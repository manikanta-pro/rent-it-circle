import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { createId, parseImages, parseJsonArray, stringifyJsonArray } from '../utils/helpers.js';

const router = express.Router();

const mapRentalRow = (row) => ({
  ...row,
  images: parseImages(row.images),
  total_amount: row.total_amount !== undefined ? Number(row.total_amount) : undefined,
  deposit_amount: row.deposit_amount !== undefined ? Number(row.deposit_amount) : undefined,
});

const mapIncident = (incident) => ({
  ...incident,
  evidence_images: parseJsonArray(incident.evidence_images),
  deposit_claim_amount:
    incident.deposit_claim_amount !== undefined ? Number(incident.deposit_claim_amount) : undefined,
});

router.get('/my-rentals', authenticateToken, async (req, res) => {
  try {
    const [asRenter] = await pool.execute(
      `SELECT r.*, i.title AS item_title, i.images, i.location, u.full_name AS owner_name, u.email AS owner_email
       FROM rentals r
       JOIN items i ON r.item_id = i.id
       JOIN users u ON r.owner_id = u.id
       WHERE r.renter_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    const [asOwner] = await pool.execute(
      `SELECT r.*, i.title AS item_title, i.images, i.location, u.full_name AS renter_name, u.email AS renter_email
       FROM rentals r
       JOIN items i ON r.item_id = i.id
       JOIN users u ON r.renter_id = u.id
       WHERE r.owner_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      asRenter: asRenter.map(mapRentalRow),
      asOwner: asOwner.map(mapRentalRow),
    });
  } catch (error) {
    console.error('Error fetching rentals:', error);
    return res.status(500).json({ error: 'Failed to fetch rentals' });
  }
});

router.get('/:id/incidents', authenticateToken, async (req, res) => {
  try {
    const [rentals] = await pool.execute(
      'SELECT owner_id, renter_id FROM rentals WHERE id = ? LIMIT 1',
      [req.params.id]
    );

    if (!rentals.length) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    if (![rentals[0].owner_id, rentals[0].renter_id].includes(req.user.id)) {
      return res.status(403).json({ error: 'Only rental participants can view incidents' });
    }

    const [incidents] = await pool.execute(
      `SELECT ri.*, u.full_name AS reported_by_name
       FROM rental_incidents ri
       JOIN users u ON ri.reported_by_user_id = u.id
       WHERE ri.rental_id = ?
       ORDER BY ri.created_at DESC`,
      [req.params.id]
    );

    return res.json(incidents.map(mapIncident));
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

router.post(
  '/:id/incidents',
  authenticateToken,
  [
    body('incidentType').isIn(['damage', 'late_return', 'missing_item', 'cleaning', 'other']),
    body('severity').optional({ values: 'falsy' }).isIn(['low', 'medium', 'high']),
    body('description').notEmpty().trim().isLength({ min: 10, max: 2000 }),
    body('evidenceImages').optional().isArray(),
    body('depositClaimAmount').optional({ values: 'falsy' }).isFloat({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      incidentType,
      severity = 'medium',
      description,
      evidenceImages = [],
      depositClaimAmount = 0,
    } = req.body;

    try {
      const [rentals] = await pool.execute(
        'SELECT owner_id, renter_id, status FROM rentals WHERE id = ? LIMIT 1',
        [req.params.id]
      );

      if (!rentals.length) {
        return res.status(404).json({ error: 'Rental not found' });
      }

      const rental = rentals[0];
      if (![rental.owner_id, rental.renter_id].includes(req.user.id)) {
        return res.status(403).json({ error: 'Only rental participants can report incidents' });
      }

      const id = createId();
      await pool.execute(
        `INSERT INTO rental_incidents (
          id, rental_id, reported_by_user_id, incident_type, severity, description,
          evidence_images, deposit_claim_amount, resolution_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          req.params.id,
          req.user.id,
          incidentType,
          severity,
          description,
          stringifyJsonArray(evidenceImages),
          depositClaimAmount,
          'open',
        ]
      );

      await pool.execute('UPDATE rentals SET status = ?, deposit_status = ? WHERE id = ?', [
        'disputed',
        depositClaimAmount > 0 ? 'under_review' : 'held',
        req.params.id,
      ]);

      const [incidents] = await pool.execute('SELECT * FROM rental_incidents WHERE id = ? LIMIT 1', [id]);
      return res.status(201).json(mapIncident(incidents[0]));
    } catch (error) {
      console.error('Error reporting incident:', error);
      return res.status(500).json({ error: 'Failed to report incident' });
    }
  }
);

router.patch(
  '/:id/incidents/:incidentId',
  authenticateToken,
  [
    body('resolutionStatus').optional({ values: 'falsy' }).isIn(['open', 'reviewing', 'resolved', 'rejected']),
    body('resolutionNotes').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }),
    body('depositClaimAmount').optional({ values: 'falsy' }).isFloat({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const [rentals] = await pool.execute(
        'SELECT owner_id, renter_id FROM rentals WHERE id = ? LIMIT 1',
        [req.params.id]
      );

      if (!rentals.length) {
        return res.status(404).json({ error: 'Rental not found' });
      }

      if (rentals[0].owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the owner can resolve incidents' });
      }

      const updates = [];
      const values = [];
      if (Object.prototype.hasOwnProperty.call(req.body, 'resolutionStatus')) {
        updates.push('resolution_status = ?');
        values.push(req.body.resolutionStatus);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'resolutionNotes')) {
        updates.push('resolution_notes = ?');
        values.push(req.body.resolutionNotes || null);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'depositClaimAmount')) {
        updates.push('deposit_claim_amount = ?');
        values.push(req.body.depositClaimAmount || 0);
      }

      if (!updates.length) {
        return res.status(400).json({ error: 'No incident updates provided' });
      }

      values.push(req.params.incidentId, req.params.id);
      await pool.execute(
        `UPDATE rental_incidents SET ${updates.join(', ')} WHERE id = ? AND rental_id = ?`,
        values
      );

      if (req.body.resolutionStatus === 'resolved') {
        await pool.execute('UPDATE rentals SET deposit_status = ? WHERE id = ?', ['claimed_or_released', req.params.id]);
      }

      const [incidents] = await pool.execute('SELECT * FROM rental_incidents WHERE id = ? LIMIT 1', [req.params.incidentId]);
      return res.json(mapIncident(incidents[0]));
    } catch (error) {
      console.error('Error updating incident:', error);
      return res.status(500).json({ error: 'Failed to update incident' });
    }
  }
);

router.post(
  '/',
  authenticateToken,
  [
    body('itemId').notEmpty(),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('message').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
    body('pickupNotes').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { itemId, startDate, endDate, message = '', pickupNotes = '' } = req.body;

    try {
      const [items] = await pool.execute(
        `SELECT owner_id, daily_rate, deposit_amount, min_rental_days, max_rental_days
         FROM items
         WHERE id = ? AND availability_status = ?
         LIMIT 1`,
        [itemId, 'available']
      );

      if (items.length === 0) {
        return res.status(404).json({ error: 'Item not available' });
      }

      const item = items[0];

      if (item.owner_id === req.user.id) {
        return res.status(400).json({ error: 'Cannot rent your own item' });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        return res.status(400).json({ error: 'Please choose a valid rental period' });
      }

      if (days < Number(item.min_rental_days || 1)) {
        return res.status(400).json({ error: `Minimum rental period is ${item.min_rental_days} day(s)` });
      }

      if (days > Number(item.max_rental_days || 14)) {
        return res.status(400).json({ error: `Maximum rental period is ${item.max_rental_days} day(s)` });
      }

      const totalAmount = days * Number(item.daily_rate);

      const [overlaps] = await pool.execute(
        `SELECT id FROM rentals
         WHERE item_id = ?
           AND status IN ('pending', 'active', 'disputed')
           AND (
             (start_date <= ? AND end_date >= ?)
             OR (start_date <= ? AND end_date >= ?)
             OR (start_date >= ? AND end_date <= ?)
           )`,
        [itemId, startDate, startDate, endDate, endDate, startDate, endDate]
      );

      if (overlaps.length > 0) {
        return res.status(400).json({ error: 'Item already rented for selected dates' });
      }

      const id = createId();

      await pool.execute(
        `INSERT INTO rentals (
          id, item_id, renter_id, owner_id, start_date, end_date, total_amount, deposit_amount,
          deposit_status, renter_message, pickup_notes, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [id, itemId, req.user.id, item.owner_id, startDate, endDate, totalAmount, item.deposit_amount, 'held', message, pickupNotes, 'pending']
      );

      await pool.execute('UPDATE users SET last_active_at = NOW() WHERE id = ?', [req.user.id]);

      const [rentals] = await pool.execute(
        `SELECT r.*, i.title AS item_title, i.images, i.location, u.full_name AS owner_name, u.email AS owner_email
         FROM rentals r
         JOIN items i ON r.item_id = i.id
         JOIN users u ON r.owner_id = u.id
         WHERE r.id = ?
         LIMIT 1`,
        [id]
      );
      return res.status(201).json(mapRentalRow(rentals[0]));
    } catch (error) {
      console.error('Error creating rental:', error);
      return res.status(500).json({ error: 'Failed to create rental' });
    }
  }
);

router.patch(
  '/:id/status',
  authenticateToken,
  [body('status').isIn(['approved', 'cancelled', 'completed', 'disputed'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;

    try {
      const [rentals] = await pool.execute(
        'SELECT id, item_id, owner_id, renter_id, status FROM rentals WHERE id = ? LIMIT 1',
        [req.params.id]
      );

      if (rentals.length === 0) {
        return res.status(404).json({ error: 'Rental not found' });
      }

      const rental = rentals[0];
      const isOwner = rental.owner_id === req.user.id;
      const isRenter = rental.renter_id === req.user.id;

      if (status === 'approved' && !isOwner) {
        return res.status(403).json({ error: 'Only owner can approve rentals' });
      }

      if (status === 'cancelled' && !isOwner && !isRenter) {
        return res.status(403).json({ error: 'Only participants can cancel rentals' });
      }

      if (status === 'completed' && !isOwner) {
        return res.status(403).json({ error: 'Only owner can mark as completed' });
      }

      const nextStatus = status === 'approved' ? 'active' : status;
      const completedAt = status === 'completed' ? new Date() : null;

      await pool.execute('UPDATE rentals SET status = ?, completed_at = ? WHERE id = ?', [
        nextStatus,
        completedAt,
        req.params.id,
      ]);

      if (status === 'approved') {
        await pool.execute('UPDATE items SET availability_status = ? WHERE id = ?', ['rented', rental.item_id]);
      }

      if (status === 'completed') {
        await pool.execute('UPDATE items SET availability_status = ? WHERE id = ?', ['available', rental.item_id]);
        await pool.execute(
          'UPDATE users SET completed_rentals = completed_rentals + 1 WHERE id IN (?, ?)',
          [rental.owner_id, rental.renter_id]
        );
        await pool.execute('UPDATE rentals SET deposit_status = ? WHERE id = ?', ['released', req.params.id]);
      }

      if (status === 'cancelled' && ['active', 'pending'].includes(rental.status)) {
        await pool.execute('UPDATE items SET availability_status = ? WHERE id = ?', ['available', rental.item_id]);
        await pool.execute('UPDATE rentals SET deposit_status = ? WHERE id = ?', ['released', req.params.id]);
      }

      await pool.execute('UPDATE users SET last_active_at = NOW() WHERE id = ?', [req.user.id]);

      const [updatedRentals] = await pool.execute(
        `SELECT r.*, i.title AS item_title, i.images, i.location,
                owner.full_name AS owner_name, owner.email AS owner_email,
                renter.full_name AS renter_name, renter.email AS renter_email
         FROM rentals r
         JOIN items i ON r.item_id = i.id
         JOIN users owner ON r.owner_id = owner.id
         JOIN users renter ON r.renter_id = renter.id
         WHERE r.id = ?
         LIMIT 1`,
        [req.params.id]
      );
      return res.json(mapRentalRow(updatedRentals[0]));
    } catch (error) {
      console.error('Error updating rental:', error);
      return res.status(500).json({ error: 'Failed to update rental' });
    }
  }
);

export default router;
