import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  calculateDistanceKm,
  createId,
  normalizePostalArea,
  parseImages,
  parseJsonArray,
  stringifyImages,
  stringifyJsonArray,
  toBoolean,
  toNumber,
} from '../utils/helpers.js';

const router = express.Router();

const buildImageUrl = (req, filename) => `${req.protocol}://${req.get('host')}/uploads/items/${filename}`;

const enrichLocality = (item, filters) => {
  const userLat = toNumber(filters.latitude);
  const userLng = toNumber(filters.longitude);
  const itemLat = toNumber(item.latitude);
  const itemLng = toNumber(item.longitude);
  const distanceKm = calculateDistanceKm(userLat, userLng, itemLat, itemLng);
  const sameCity =
    filters.city && item.location ? item.location.toLowerCase() === String(filters.city).toLowerCase() : false;
  const sameNeighborhood =
    filters.neighborhood && item.neighborhood
      ? item.neighborhood.toLowerCase() === String(filters.neighborhood).toLowerCase()
      : false;
  const postalMatch =
    normalizePostalArea(filters.postalCode) &&
    normalizePostalArea(item.postal_code) &&
    normalizePostalArea(filters.postalCode) === normalizePostalArea(item.postal_code);

  const allowedRadius = Number(filters.radiusKm || item.service_radius_km || 10);
  const isLocalMatch = Boolean(sameNeighborhood || postalMatch || sameCity || (distanceKm !== null && distanceKm <= allowedRadius));

  return {
    ...item,
    distance_km: distanceKm,
    is_local_match: isLocalMatch,
  };
};

const mapItem = (item) => ({
  ...item,
  images: parseImages(item.images),
  tags: parseJsonArray(item.tags),
  local_only: item.local_only !== undefined ? toBoolean(item.local_only) : undefined,
  owner_rating: item.owner_rating !== undefined ? Number(item.owner_rating) : undefined,
  owner_review_count:
    item.owner_review_count !== undefined ? Number(item.owner_review_count) : undefined,
  owner_verified:
    item.owner_verified !== undefined ? toBoolean(item.owner_verified) : undefined,
  daily_rate: item.daily_rate !== undefined ? Number(item.daily_rate) : undefined,
  deposit_amount: item.deposit_amount !== undefined ? Number(item.deposit_amount) : undefined,
  service_radius_km:
    item.service_radius_km !== undefined ? Number(item.service_radius_km) : undefined,
  min_rental_days:
    item.min_rental_days !== undefined ? Number(item.min_rental_days) : undefined,
  max_rental_days:
    item.max_rental_days !== undefined ? Number(item.max_rental_days) : undefined,
  views_count: item.views_count !== undefined ? Number(item.views_count) : undefined,
  latitude: toNumber(item.latitude),
  longitude: toNumber(item.longitude),
  distance_km: toNumber(item.distance_km),
  is_local_match: item.is_local_match !== undefined ? Boolean(item.is_local_match) : undefined,
});

router.post('/uploads', authenticateToken, upload.array('images', 6), async (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ error: 'No images uploaded' });
  }

  return res.status(201).json({
    images: req.files.map((file) => buildImageUrl(req, file.filename)),
  });
});

router.get('/', async (req, res) => {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    location,
    city,
    neighborhood,
    postalCode,
    nearby,
    radiusKm,
    latitude,
    longitude,
    localOnly,
  } = req.query;

  let query = `
    SELECT i.*, u.full_name AS owner_name, u.rating AS owner_rating, u.is_verified AS owner_verified,
           u.city AS owner_city, u.neighborhood AS owner_neighborhood, u.postal_code AS owner_postal_code,
           (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) AS owner_review_count
    FROM items i
    JOIN users u ON i.owner_id = u.id
    WHERE i.availability_status <> 'archived'
  `;
  const params = [];

  if (category && category !== 'all') {
    query += ' AND i.category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (i.title LIKE ? OR i.description LIKE ? OR i.brand LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
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

  if (city) {
    query += ' AND i.location LIKE ?';
    params.push(`%${city}%`);
  }

  if (neighborhood) {
    query += ' AND i.neighborhood LIKE ?';
    params.push(`%${neighborhood}%`);
  }

  if (localOnly === 'true') {
    query += ' AND i.local_only = 1';
  }

  query += ' ORDER BY i.created_at DESC';

  try {
    const [items] = await pool.execute(query, params);
    const enrichedItems = items.map((item) => enrichLocality(item, { city, neighborhood, postalCode, radiusKm, latitude, longitude }));

    const filteredItems =
      nearby === 'true'
        ? enrichedItems.filter((item) => item.is_local_match && (!item.local_only || item.is_local_match))
        : enrichedItems;

    return res.json(filteredItems.map(mapItem));
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
              u.join_date AS owner_join_date, u.city AS owner_city, u.neighborhood AS owner_neighborhood,
              u.postal_code AS owner_postal_code, u.preferred_contact_method AS owner_preferred_contact_method,
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
    body('brand').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
    body('condition').isIn(['new', 'like-new', 'good', 'fair', 'poor']),
    body('dailyRate').isFloat({ min: 0 }),
    body('depositAmount').isFloat({ min: 0 }),
    body('location').notEmpty(),
    body('neighborhood').optional({ values: 'falsy' }).trim().isLength({ max: 150 }),
    body('postalCode').optional({ values: 'falsy' }).trim().isLength({ max: 20 }),
    body('localOnly').optional().isBoolean(),
    body('serviceRadiusKm').optional().isInt({ min: 1, max: 100 }),
    body('handoffType').optional().isIn(['pickup', 'meetup', 'delivery']),
    body('pickupWindow').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
    body('minRentalDays').optional().isInt({ min: 1, max: 30 }),
    body('maxRentalDays').optional().isInt({ min: 1, max: 90 }),
    body('rentalTerms').optional({ values: 'falsy' }).trim().isLength({ max: 1500 }),
    body('damagePolicy').optional({ values: 'falsy' }).trim().isLength({ max: 1500 }),
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
      brand,
      condition,
      dailyRate,
      depositAmount,
      damagePolicy,
      location,
      neighborhood,
      postalCode,
      localOnly = true,
      serviceRadiusKm = 10,
      handoffType = 'pickup',
      pickupWindow,
      minRentalDays = 1,
      maxRentalDays = 14,
      rentalTerms,
      latitude,
      longitude,
      images,
      tags,
    } = req.body;

    try {
      const id = createId();

      await pool.execute(
        `INSERT INTO items (
          id, owner_id, title, description, category, brand, \`condition\`, daily_rate, deposit_amount,
          damage_policy, location, neighborhood, postal_code, local_only, service_radius_km, handoff_type,
          pickup_window, min_rental_days, max_rental_days, rental_terms, latitude, longitude, images, tags,
          availability_status, created_at, views_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0)`,
        [
          id,
          req.user.id,
          title,
          description,
          category,
          brand || null,
          condition,
          dailyRate,
          depositAmount,
          damagePolicy || null,
          location,
          neighborhood || null,
          postalCode || null,
          localOnly ? 1 : 0,
          serviceRadiusKm,
          handoffType,
          pickupWindow || null,
          minRentalDays,
          maxRentalDays,
          rentalTerms || null,
          latitude || null,
          longitude || null,
          stringifyImages(images),
          stringifyJsonArray(tags),
          'available',
        ]
      );

      await pool.execute('UPDATE users SET last_active_at = NOW() WHERE id = ?', [req.user.id]);

      const [items] = await pool.execute(
        `SELECT i.*, u.full_name AS owner_name, u.rating AS owner_rating, u.is_verified AS owner_verified,
                u.city AS owner_city, u.neighborhood AS owner_neighborhood,
                (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) AS owner_review_count
         FROM items i
         JOIN users u ON i.owner_id = u.id
         WHERE i.id = ?
         LIMIT 1`,
        [id]
      );

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
    brand: 'brand',
    condition: '`condition`',
    dailyRate: 'daily_rate',
    depositAmount: 'deposit_amount',
    damagePolicy: 'damage_policy',
    location: 'location',
    neighborhood: 'neighborhood',
    postalCode: 'postal_code',
    localOnly: 'local_only',
    serviceRadiusKm: 'service_radius_km',
    handoffType: 'handoff_type',
    pickupWindow: 'pickup_window',
    minRentalDays: 'min_rental_days',
    maxRentalDays: 'max_rental_days',
    rentalTerms: 'rental_terms',
    latitude: 'latitude',
    longitude: 'longitude',
    availabilityStatus: 'availability_status',
    images: 'images',
    tags: 'tags',
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
    const values = entries.map(([key, value]) => {
      if (key === 'images') {
        return stringifyImages(value);
      }

      if (key === 'tags') {
        return stringifyJsonArray(value);
      }

      if (key === 'localOnly') {
        return value ? 1 : 0;
      }

      return value;
    });
    values.push(req.params.id);

    await pool.execute(`UPDATE items SET ${setClause} WHERE id = ?`, values);
    await pool.execute('UPDATE users SET last_active_at = NOW() WHERE id = ?', [req.user.id]);

    const [items] = await pool.execute(
      `SELECT i.*, u.full_name AS owner_name, u.rating AS owner_rating, u.is_verified AS owner_verified,
              u.city AS owner_city, u.neighborhood AS owner_neighborhood,
              (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) AS owner_review_count
       FROM items i
       JOIN users u ON i.owner_id = u.id
       WHERE i.id = ?
       LIMIT 1`,
      [req.params.id]
    );
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
    await pool.execute('UPDATE users SET last_active_at = NOW() WHERE id = ?', [req.user.id]);
    return res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
