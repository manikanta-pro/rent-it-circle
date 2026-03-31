import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { createId, toBoolean } from '../utils/helpers.js';

const router = express.Router();

const mapProfile = (user) => ({
  ...user,
  rating: user.rating !== undefined ? Number(user.rating) : undefined,
  total_ratings: user.total_ratings !== undefined ? Number(user.total_ratings) : undefined,
  is_verified: user.is_verified !== undefined ? toBoolean(user.is_verified) : undefined,
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [profiles] = await pool.execute(
      `SELECT id, email, full_name, location, avatar_url, rating, total_ratings, join_date, is_verified
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [items] = await pool.execute(
      'SELECT id, title, daily_rate, availability_status, views_count FROM items WHERE owner_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    const [reviews] = await pool.execute(
      `SELECT r.*, u.full_name AS reviewer_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewee_id = ?
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [req.user.id]
    );

    return res.json({
      profile: mapProfile(profiles[0]),
      items,
      recentReviews: reviews,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put(
  '/profile',
  authenticateToken,
  [body('fullName').optional().trim().isLength({ min: 2 }), body('location').optional().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = [];
    const values = [];

    if (req.body.fullName) {
      updates.push('full_name = ?');
      values.push(req.body.fullName);
    }

    if (req.body.location) {
      updates.push('location = ?');
      values.push(req.body.location);
    }

    if (req.body.avatarUrl !== undefined) {
      updates.push('avatar_url = ?');
      values.push(req.body.avatarUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(req.user.id);

    try {
      await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

      const [profiles] = await pool.execute(
        'SELECT id, email, full_name, location, avatar_url, rating, total_ratings, is_verified FROM users WHERE id = ? LIMIT 1',
        [req.user.id]
      );

      return res.json(mapProfile(profiles[0]));
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

router.post(
  '/reviews',
  authenticateToken,
  [
    body('rentalId').notEmpty(),
    body('revieweeId').notEmpty(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().isLength({ max: 500 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rentalId, revieweeId, rating, comment } = req.body;

    try {
      const [rentals] = await pool.execute(
        `SELECT id
         FROM rentals
         WHERE id = ?
           AND status = 'completed'
           AND (owner_id = ? OR renter_id = ?)
         LIMIT 1`,
        [rentalId, req.user.id, req.user.id]
      );

      if (rentals.length === 0) {
        return res.status(400).json({ error: 'Cannot review: Rental not completed or not found' });
      }

      const [existingReviews] = await pool.execute(
        'SELECT id FROM reviews WHERE rental_id = ? AND reviewer_id = ? LIMIT 1',
        [rentalId, req.user.id]
      );

      if (existingReviews.length > 0) {
        return res.status(400).json({ error: 'Review already submitted' });
      }

      await pool.execute(
        'INSERT INTO reviews (id, rental_id, reviewer_id, reviewee_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [createId(), rentalId, req.user.id, revieweeId, rating, comment || '']
      );

      const [ratingRows] = await pool.execute(
        'SELECT AVG(rating) AS avg_rating, COUNT(*) AS review_count FROM reviews WHERE reviewee_id = ?',
        [revieweeId]
      );

      await pool.execute('UPDATE users SET rating = ?, total_ratings = ? WHERE id = ?', [
        Number(ratingRows[0].avg_rating || 0),
        Number(ratingRows[0].review_count || 0),
        revieweeId,
      ]);

      return res.status(201).json({ message: 'Review submitted successfully' });
    } catch (error) {
      console.error('Error adding review:', error);
      return res.status(500).json({ error: 'Failed to add review' });
    }
  }
);

export default router;
