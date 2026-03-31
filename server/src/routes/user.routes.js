import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, full_name, location, avatar_url, rating, total_ratings, 
              join_date, is_verified
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's items
    const itemsResult = await pool.query(
      'SELECT id, title, daily_rate, availability_status, views_count FROM items WHERE owner_id = $1',
      [req.user.id]
    );
    
    // Get user's reviews
    const reviewsResult = await pool.query(
      `SELECT r.*, u.full_name as reviewer_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [req.user.id]
    );
    
    res.json({
      profile: result.rows[0],
      items: itemsResult.rows,
      recentReviews: reviewsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('fullName').optional().trim().isLength({ min: 2 }),
  body('location').optional().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { fullName, location, avatarUrl } = req.body;
  const updates = [];
  const values = [];
  let paramIndex = 1;
  
  if (fullName) {
    updates.push(`full_name = $${paramIndex++}`);
    values.push(fullName);
  }
  if (location) {
    updates.push(`location = $${paramIndex++}`);
    values.push(location);
  }
  if (avatarUrl) {
    updates.push(`avatar_url = $${paramIndex++}`);
    values.push(avatarUrl);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }
  
  values.push(req.user.id);
  
  try {
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING id, email, full_name, location, avatar_url, rating, is_verified`,
      values
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Add review
router.post('/reviews', authenticateToken, [
  body('rentalId').notEmpty(),
  body('revieweeId').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().isLength({ max: 500 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { rentalId, revieweeId, rating, comment } = req.body;
  
  try {
    // Check if rental exists and is completed
    const rentalCheck = await pool.query(
      `SELECT id FROM rentals 
       WHERE id = $1 AND status = 'completed' 
       AND (owner_id = $2 OR renter_id = $2)`,
      [rentalId, req.user.id]
    );
    
    if (rentalCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Cannot review: Rental not completed or not found' });
    }
    
    // Check if review already exists
    const reviewCheck = await pool.query(
      'SELECT id FROM reviews WHERE rental_id = $1 AND reviewer_id = $2',
      [rentalId, req.user.id]
    );
    
    if (reviewCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Review already submitted' });
    }
    
    // Add review
    await pool.query(
      `INSERT INTO reviews (id, rental_id, reviewer_id, reviewee_id, rating, comment, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
      [rentalId, req.user.id, revieweeId, rating, comment || '']
    );
    
    // Update user rating
    const avgRating = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as count
       FROM reviews WHERE reviewee_id = $1`,
      [revieweeId]
    );
    
    await pool.query(
      'UPDATE users SET rating = $1, total_ratings = $2 WHERE id = $3',
      [avgRating.rows[0].avg_rating, avgRating.rows[0].count, revieweeId]
    );
    
    res.status(201).json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

export default router;