import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all items
router.get('/', async (req, res) => {
  const { category, search, minPrice, maxPrice, location } = req.query;
  
  let query = `
    SELECT i.*, u.full_name as owner_name, u.rating as owner_rating,
           (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) as owner_review_count
    FROM items i
    JOIN users u ON i.owner_id = u.id
    WHERE i.availability_status = 'available'
  `;
  const params = [];
  let paramIndex = 1;

  if (category && category !== 'all') {
    query += ` AND i.category = $${paramIndex++}`;
    params.push(category);
  }

  if (search) {
    query += ` AND (i.title ILIKE $${paramIndex++} OR i.description ILIKE $${paramIndex++})`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (minPrice) {
    query += ` AND i.daily_rate >= $${paramIndex++}`;
    params.push(minPrice);
  }

  if (maxPrice) {
    query += ` AND i.daily_rate <= $${paramIndex++}`;
    params.push(maxPrice);
  }

  if (location) {
    query += ` AND i.location ILIKE $${paramIndex++}`;
    params.push(`%${location}%`);
  }

  query += ` ORDER BY i.created_at DESC`;

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get single item
router.get('/:id', async (req, res) => {
  try {
    // Increment view count
    await pool.query(
      'UPDATE items SET views_count = views_count + 1 WHERE id = $1',
      [req.params.id]
    );

    const result = await pool.query(
      `SELECT i.*, u.full_name as owner_name, u.rating as owner_rating, 
              u.join_date as owner_join_date, u.location as owner_location,
              u.is_verified as owner_verified,
              (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) as owner_review_count
       FROM items i
       JOIN users u ON i.owner_id = u.id
       WHERE i.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create item
router.post('/', authenticateToken, [
  body('title').notEmpty().trim().isLength({ min: 3, max: 100 }),
  body('description').notEmpty().trim().isLength({ min: 10, max: 2000 }),
  body('category').notEmpty(),
  body('condition').isIn(['new', 'like-new', 'good', 'fair', 'poor']),
  body('dailyRate').isFloat({ min: 0 }),
  body('depositAmount').isFloat({ min: 0 }),
  body('location').notEmpty(),
], async (req, res) => {
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
    const result = await pool.query(
      `INSERT INTO items (id, owner_id, title, description, category, condition, 
        daily_rate, deposit_amount, location, latitude, longitude, images, 
        availability_status, created_at, views_count)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'available', NOW(), 0)
       RETURNING *`,
      [req.user.id, title, description, category, condition, dailyRate, 
       depositAmount, location, latitude || null, longitude || null, images || []]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update item
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    // Check ownership
    const itemCheck = await pool.query(
      'SELECT owner_id FROM items WHERE id = $1',
      [id]
    );
    
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (itemCheck.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this item' });
    }
    
    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(updates)];
    
    const result = await pool.query(
      `UPDATE items SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const itemCheck = await pool.query(
      'SELECT owner_id FROM items WHERE id = $1',
      [id]
    );
    
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (itemCheck.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this item' });
    }
    
    await pool.query('DELETE FROM items WHERE id = $1', [id]);
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;