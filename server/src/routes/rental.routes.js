import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { createId, parseImages } from '../utils/helpers.js';

const router = express.Router();

const mapRentalRow = (row) => ({
  ...row,
  images: parseImages(row.images),
  total_amount: row.total_amount !== undefined ? Number(row.total_amount) : undefined,
  deposit_amount: row.deposit_amount !== undefined ? Number(row.deposit_amount) : undefined,
});

router.get('/my-rentals', authenticateToken, async (req, res) => {
  try {
    const [asRenter] = await pool.execute(
      `SELECT r.*, i.title AS item_title, i.images, u.full_name AS owner_name, u.email AS owner_email
       FROM rentals r
       JOIN items i ON r.item_id = i.id
       JOIN users u ON r.owner_id = u.id
       WHERE r.renter_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    const [asOwner] = await pool.execute(
      `SELECT r.*, i.title AS item_title, i.images, u.full_name AS renter_name, u.email AS renter_email
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

router.post(
  '/',
  authenticateToken,
  [body('itemId').notEmpty(), body('startDate').isISO8601(), body('endDate').isISO8601()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { itemId, startDate, endDate } = req.body;

    try {
      const [items] = await pool.execute(
        'SELECT owner_id, daily_rate, deposit_amount FROM items WHERE id = ? AND availability_status = ? LIMIT 1',
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
      const totalAmount = days * Number(item.daily_rate);

      const [overlaps] = await pool.execute(
        `SELECT id FROM rentals
         WHERE item_id = ?
           AND status IN ('pending', 'active')
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
        'INSERT INTO rentals (id, item_id, renter_id, owner_id, start_date, end_date, total_amount, deposit_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
        [id, itemId, req.user.id, item.owner_id, startDate, endDate, totalAmount, item.deposit_amount, 'pending']
      );

      const [rentals] = await pool.execute('SELECT * FROM rentals WHERE id = ? LIMIT 1', [id]);
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

      await pool.execute(
        'UPDATE rentals SET status = ?, completed_at = ? WHERE id = ?',
        [nextStatus, completedAt, req.params.id]
      );

      if (status === 'approved') {
        await pool.execute('UPDATE items SET availability_status = ? WHERE id = ?', ['rented', rental.item_id]);
      }

      if (status === 'completed') {
        await pool.execute('UPDATE items SET availability_status = ? WHERE id = ?', ['available', rental.item_id]);
      }

      if (status === 'cancelled' && rental.status === 'active') {
        await pool.execute('UPDATE items SET availability_status = ? WHERE id = ?', ['available', rental.item_id]);
      }

      const [updatedRentals] = await pool.execute('SELECT * FROM rentals WHERE id = ? LIMIT 1', [req.params.id]);
      return res.json(mapRentalRow(updatedRentals[0]));
    } catch (error) {
      console.error('Error updating rental:', error);
      return res.status(500).json({ error: 'Failed to update rental' });
    }
  }
);

export default router;
