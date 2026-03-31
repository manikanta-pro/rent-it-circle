import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { createId, parseImages, stringifyImages, toBoolean } from '../utils/helpers.js';

const router = express.Router();

const mapItem = (item) => ({
  ...item,
  images: parseImages(item.images),
  owner_rating: item.owner_rating !== undefined ? Number(item.owner_rating) : undefined,
  owner_review_count:
    item.owner_review_count !== undefined ? Number(item.owner_review_count) : undefined,
  owner_verified:
    item.owner_verified !== undefined ? toBoolean(item.owner_verified) : undefined,
  daily_rate: item.daily_rate !== undefined ? Number(item.daily_rate) : undefined,
  deposit_amount: item.deposit_amount !== undefined ? Number(item.deposit_amount) : undefined,
  views_count: item.views_count !== undefined ? Number(item.views_count) : undefined,
});

router.get('/', async (req, res) => {
  const { category, search, minPrice, maxPrice, location } = req.query;

  let query = `
    SELECT i.*, u.full_name AS owner_name, u.rating AS owner_rating, u.is_verified AS owner_verified,
           (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) AS owner_review_count
    FROM items i
    JOIN users u ON i.owner_id = u.id
    WHERE i.availability_status = 'available'
  `;
  const params = [];

  if (category && category !== 'all') {
    query += ' AND i.category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (i.title LIKE ? OR i.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (minPrice) {
    query += ' AND i.daily_rate >= ?';
    params.push(minPrice);
  }

  if (maxPrice) {
    query += ' AND i.daily_rate <= ?';
    params.push(maxPrice);
  }

  if (location) {
    query += ' AND i.location LIKE ?';
    params.push(`%${location}%`);
  }

  query += ' ORDER BY i.created_at DESC';

  try {
    const [items] = await pool.execute(query, params);
    return res.json(items.map(mapItem));
  } catch (error) {
    console.error('Error fetching items:', error);
    return res.status(500).json({ error: 'Failed to fetch items' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    await pool.execute('UPDATE items SET views_count = views_count + 1 WHERE id = ?', [req.params.id]);

    const [items] = await pool.execute(
      `SELECT i.*, u.full_name AS owner_name, u.rating AS owner_rating,
              u.join_date AS owner_join_date, u.location AS owner_location,
              u.is_verified AS owner_verified,
              (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) AS owner_review_count
       FROM items i
       JOIN users u ON i.owner_id = u.id
       WHERE i.id = ?
       LIMIT 1`,
      [req.params.id]
    );

    if (items.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    return res.json(mapItem(items[0]));
  } catch (error) {
    console.error('Error fetching item:', error);
    return res.status(500).json({ error: 'Failed to fetch item' });
  }
});

router.post(
  '/',
  authenticateToken,
  [
    body('title').notEmpty().trim().isLength({ min: 3, max: 100 }),
    body('description').notEmpty().trim().isLength({ min: 10, max: 2000 }),
    body('category').notEmpty(),
    body('condition').isIn(['new', 'like-new', 'good', 'fair', 'poor']),
    body('dailyRate').isFloat({ min: 0 }),
    body('depositAmount').isFloat({ min: 0 }),
    body('location').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      category,
      condition,
      dailyRate,
      depositAmount,
      location,
      latitude,
      longitude,
      images,
    } = req.body;

    try {
      const id = createId();

      await pool.execute(
        'INSERT INTO items (id, owner_id, title, description, category, `condition`, daily_rate, deposit_amount, location, latitude, longitude, images, availability_status, created_at, views_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0)',
        [
          id,
          req.user.id,
          title,
          description,
          category,
          condition,
          dailyRate,
          depositAmount,
          location,
          latitude || null,
          longitude || null,
          stringifyImages(images),
          'available',
        ]
      );

      const [items] = await pool.execute('SELECT * FROM items WHERE id = ? LIMIT 1', [id]);
      return res.status(201).json(mapItem(items[0]));
    } catch (error) {
      console.error('Error creating item:', error);
      return res.status(500).json({ error: 'Failed to create item' });
    }
  }
);

router.put('/:id', authenticateToken, async (req, res) => {
  const allowedFields = {
    title: 'title',
    description: 'description',
    category: 'category',
    condition: '`condition`',
    dailyRate: 'daily_rate',
    depositAmount: 'deposit_amount',
    location: 'location',
    latitude: 'latitude',
    longitude: 'longitude',
    availabilityStatus: 'availability_status',
    images: 'images',
  };

  try {
    const [itemRows] = await pool.execute('SELECT owner_id FROM items WHERE id = ? LIMIT 1', [req.params.id]);

    if (itemRows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (itemRows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this item' });
    }

    const entries = Object.entries(req.body).filter(([key]) => allowedFields[key]);

    if (entries.length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    const setClause = entries.map(([key]) => `${allowedFields[key]} = ?`).join(', ');
    const values = entries.map(([key, value]) => (key === 'images' ? stringifyImages(value) : value));
    values.push(req.params.id);

    await pool.execute(`UPDATE items SET ${setClause} WHERE id = ?`, values);

    const [items] = await pool.execute('SELECT * FROM items WHERE id = ? LIMIT 1', [req.params.id]);
    return res.json(mapItem(items[0]));
  } catch (error) {
    console.error('Error updating item:', error);
    return res.status(500).json({ error: 'Failed to update item' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [itemRows] = await pool.execute('SELECT owner_id FROM items WHERE id = ? LIMIT 1', [req.params.id]);

    if (itemRows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (itemRows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this item' });
    }

    await pool.execute('DELETE FROM items WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
