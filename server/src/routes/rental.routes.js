import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user's rentals
router.get('/my-rentals', authenticateToken, async (req, res) => {
  try {
    const asRenter = await pool.query(
      `SELECT r.*, i.title as item_title, i.images, u.full_name as owner_name,
              u.email as owner_email
       FROM rentals r
       JOIN items i ON r.item_id = i.id
       JOIN users u ON r.owner_id = u.id
       WHERE r.renter_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    
    const asOwner = await pool.query(
      `SELECT r.*, i.title as item_title, i.images, u.full_name as renter_name,
              u.email as renter_email
       FROM rentals r
       JOIN items i ON r.item_id = i.id
       JOIN users u ON r.renter_id = u.id
       WHERE r.owner_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    
    res.json({
      asRenter: asRenter.rows,
      asOwner: asOwner.rows,
    });
  } catch (error) {
    console.error('Error fetching rentals:', error);
    res.status(500).json({ error: 'Failed to fetch rentals' });
  }
});

// Create rental request
router.post('/', authenticateToken, [
  body('itemId').notEmpty(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { itemId, startDate, endDate } = req.body;
  
  try {
    // Get item details
    const itemResult = await pool.query(
      'SELECT owner_id, daily_rate, deposit_amount FROM items WHERE id = $1 AND availability_status = $2',
      [itemId, 'available']
    );
    
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not available' });
    }
    
    const item = itemResult.rows[0];
    
    if (item.owner_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot rent your own item' });
    }
    
    // Calculate total amount
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalAmount = days * item.daily_rate;
    
    // Check for overlapping rentals
    const overlapCheck = await pool.query(
      `SELECT id FROM rentals 
       WHERE item_id = $1 
       AND status IN ('pending', 'approved', 'active')
       AND (
         (start_date <= $2 AND end_date >= $2) OR
         (start_date <= $3 AND end_date >= $3) OR
         (start_date >= $2 AND end_date <= $3)
       )`,
      [itemId, startDate, endDate]
    );
    
    if (overlapCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Item already rented for selected dates' });
    }
    
    // Create rental
    const result = await pool.query(
      `INSERT INTO rentals (id, item_id, renter_id, owner_id, start_date, end_date, 
        total_amount, deposit_amount, status, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
       RETURNING *`,
      [itemId, req.user.id, item.owner_id, startDate, endDate, totalAmount, item.deposit_amount]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating rental:', error);
    res.status(500).json({ error: 'Failed to create rental' });
  }
});

// Update rental status
router.patch('/:id/status', authenticateToken, [
  body('status').isIn(['approved', 'cancelled', 'completed', 'disputed']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const rentalResult = await pool.query(
      'SELECT owner_id, renter_id, status FROM rentals WHERE id = $1',
      [id]
    );
    
    if (rentalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rental not found' });
    }
    
    const rental = rentalResult.rows[0];
    
    // Check authorization
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
    
    // Update status
    const updateData = { status };
    if (status === 'approved') {
      updateData.status = 'active';
      // Update item availability
      await pool.query(
        'UPDATE items SET availability_status = $1 WHERE id = (SELECT item_id FROM rentals WHERE id = $2)',
        ['rented', id]
      );
    }
    
    if (status === 'completed') {
      updateData.completed_at = new Date();
      // Update item availability
      await pool.query(
        'UPDATE items SET availability_status = $1 WHERE id = (SELECT item_id FROM rentals WHERE id = $2)',
        ['available', id]
      );
    }
    
    if (status === 'cancelled') {
      // Update item availability if it was active
      const rentalCheck = await pool.query(
        'SELECT status FROM rentals WHERE id = $1',
        [id]
      );
      if (rentalCheck.rows[0].status === 'active') {
        await pool.query(
          'UPDATE items SET availability_status = $1 WHERE id = (SELECT item_id FROM rentals WHERE id = $2)',
          ['available', id]
        );
      }
    }
    
    const result = await pool.query(
      `UPDATE rentals SET status = $1, completed_at = $2 
       WHERE id = $3 RETURNING *`,
      [updateData.status || status, updateData.completed_at || null, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating rental:', error);
    res.status(500).json({ error: 'Failed to update rental' });
  }
});

export default router;