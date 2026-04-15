import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { createId, toBoolean, toNumber } from '../utils/helpers.js';

const router = express.Router();

const mapProfile = (user) => ({
  ...user,
  latitude: toNumber(user.latitude),
  longitude: toNumber(user.longitude),
  rating: user.rating !== undefined ? Number(user.rating) : undefined,
  total_ratings: user.total_ratings !== undefined ? Number(user.total_ratings) : undefined,
  response_rate: user.response_rate !== undefined ? Number(user.response_rate) : undefined,
  response_time_minutes:
    user.response_time_minutes !== undefined ? Number(user.response_time_minutes) : undefined,
  completed_rentals:
    user.completed_rentals !== undefined ? Number(user.completed_rentals) : undefined,
  search_radius_km:
    user.search_radius_km !== undefined ? Number(user.search_radius_km) : undefined,
  is_verified: user.is_verified !== undefined ? toBoolean(user.is_verified) : undefined,
});

const mapSavedItem = (item) => ({
  ...item,
  daily_rate: item.daily_rate !== undefined ? Number(item.daily_rate) : undefined,
  deposit_amount: item.deposit_amount !== undefined ? Number(item.deposit_amount) : undefined,
  owner_rating: item.owner_rating !== undefined ? Number(item.owner_rating) : undefined,
  owner_verified: item.owner_verified !== undefined ? toBoolean(item.owner_verified) : undefined,
  saved_at: item.saved_at,
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [profiles] = await pool.execute(
      `SELECT id, email, full_name, phone, city, neighborhood, postal_code, latitude, longitude,
              search_radius_km, local_visibility, account_type, preferred_contact_method, bio, avatar_url,
              rating, total_ratings, response_rate, response_time_minutes, completed_rentals, join_date,
              last_active_at, is_verified
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [items] = await pool.execute(
      `SELECT id, title, category, neighborhood, daily_rate, availability_status, views_count, created_at
       FROM items
       WHERE owner_id = ?
       ORDER BY created_at DESC`,
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

    const [verifications] = await pool.execute(
      `SELECT verification_type, verification_status, verified_at
       FROM user_verifications
       WHERE user_id = ?
       ORDER BY created_at ASC`,
      [req.user.id]
    );

    const [savedStats] = await pool.execute('SELECT COUNT(*) AS saved_items_count FROM saved_items WHERE user_id = ?', [
      req.user.id,
    ]);

    const [rentalStats] = await pool.execute(
      `SELECT
         SUM(CASE WHEN owner_id = ? THEN 1 ELSE 0 END) AS owner_rentals,
         SUM(CASE WHEN renter_id = ? THEN 1 ELSE 0 END) AS renter_rentals,
         SUM(CASE WHEN status IN ('pending', 'active') AND owner_id = ? THEN 1 ELSE 0 END) AS open_requests
       FROM rentals
       WHERE owner_id = ? OR renter_id = ?`,
      [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
    );

    return res.json({
      profile: mapProfile(profiles[0]),
      items,
      recentReviews: reviews,
      verifications,
      stats: {
        savedItems: Number(savedStats[0]?.saved_items_count || 0),
        ownerRentals: Number(rentalStats[0]?.owner_rentals || 0),
        renterRentals: Number(rentalStats[0]?.renter_rentals || 0),
        openRequests: Number(rentalStats[0]?.open_requests || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put(
  '/profile',
  authenticateToken,
  [
    body('fullName').optional().trim().isLength({ min: 2, max: 150 }),
    body('phone').optional().trim().isLength({ min: 7, max: 30 }),
    body('city').optional().trim().isLength({ min: 2, max: 150 }),
    body('neighborhood').optional({ values: 'falsy' }).trim().isLength({ max: 150 }),
    body('postalCode').optional({ values: 'falsy' }).trim().isLength({ max: 20 }),
    body('latitude').optional({ values: 'falsy' }).isFloat({ min: -90, max: 90 }),
    body('longitude').optional({ values: 'falsy' }).isFloat({ min: -180, max: 180 }),
    body('searchRadiusKm').optional({ values: 'falsy' }).isInt({ min: 1, max: 100 }),
    body('localVisibility').optional({ values: 'falsy' }).isIn(['city', 'neighborhood', 'radius']),
    body('accountType').optional().isIn(['renter', 'owner', 'both']),
    body('preferredContactMethod').optional().isIn(['in_app', 'phone', 'email']),
    body('bio').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const fieldMap = {
      fullName: 'full_name',
      phone: 'phone',
      city: 'city',
      neighborhood: 'neighborhood',
      postalCode: 'postal_code',
      latitude: 'latitude',
      longitude: 'longitude',
      searchRadiusKm: 'search_radius_km',
      localVisibility: 'local_visibility',
      accountType: 'account_type',
      preferredContactMethod: 'preferred_contact_method',
      bio: 'bio',
      avatarUrl: 'avatar_url',
    };

    const updates = [];
    const values = [];

    Object.entries(fieldMap).forEach(([requestField, column]) => {
      if (Object.prototype.hasOwnProperty.call(req.body, requestField)) {
        updates.push(`${column} = ?`);
        values.push(req.body[requestField] || null);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push('last_active_at = NOW()');
    values.push(req.user.id);

    try {
      await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

      const [profiles] = await pool.execute(
        `SELECT id, email, full_name, phone, city, neighborhood, postal_code, latitude, longitude,
                search_radius_km, local_visibility, account_type, preferred_contact_method, bio, avatar_url,
                rating, total_ratings, response_rate, response_time_minutes, completed_rentals,
                join_date, last_active_at, is_verified
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [req.user.id]
      );

      return res.json(mapProfile(profiles[0]));
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const [items] = await pool.execute(
      `SELECT si.created_at AS saved_at, i.id, i.title, i.category, i.daily_rate, i.deposit_amount,
              i.location, i.images, u.full_name AS owner_name, u.rating AS owner_rating,
              u.is_verified AS owner_verified
       FROM saved_items si
       JOIN items i ON si.item_id = i.id
       JOIN users u ON i.owner_id = u.id
       WHERE si.user_id = ?
       ORDER BY si.created_at DESC`,
      [req.user.id]
    );

    return res.json(items.map(mapSavedItem));
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

router.post('/favorites/:itemId', authenticateToken, async (req, res) => {
  try {
    const [items] = await pool.execute('SELECT id FROM items WHERE id = ? LIMIT 1', [req.params.itemId]);

    if (items.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await pool.execute(
      `INSERT INTO saved_items (id, user_id, item_id)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE created_at = created_at`,
      [createId(), req.user.id, req.params.itemId]
    );

    return res.status(201).json({ itemId: req.params.itemId });
  } catch (error) {
    console.error('Error saving favorite:', error);
    return res.status(500).json({ error: 'Failed to save favorite' });
  }
});

router.delete('/favorites/:itemId', authenticateToken, async (req, res) => {
  try {
    await pool.execute('DELETE FROM saved_items WHERE user_id = ? AND item_id = ?', [req.user.id, req.params.itemId]);
    return res.json({ itemId: req.params.itemId });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

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
