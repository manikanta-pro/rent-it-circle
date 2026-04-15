import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database.js';
import { createId, toBoolean, toNumber } from '../utils/helpers.js';

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || 'change-this-secret';
const jwtExpire = process.env.JWT_EXPIRE || '7d';

const contactMethods = ['in_app', 'phone', 'email'];
const accountTypes = ['renter', 'owner', 'both'];
const localVisibilityModes = ['city', 'neighborhood', 'radius'];

const mapUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.full_name,
  phone: user.phone,
  city: user.city,
  location: user.city,
  neighborhood: user.neighborhood,
  postalCode: user.postal_code,
  latitude: toNumber(user.latitude),
  longitude: toNumber(user.longitude),
  searchRadiusKm: Number(user.search_radius_km || 15),
  localVisibility: user.local_visibility,
  accountType: user.account_type,
  preferredContactMethod: user.preferred_contact_method,
  bio: user.bio,
  avatarUrl: user.avatar_url,
  rating: Number(user.rating || 0),
  totalRatings: Number(user.total_ratings || 0),
  responseRate: `${Number(user.response_rate || 0)}%`,
  responseTimeMinutes: Number(user.response_time_minutes || 0),
  completedRentals: Number(user.completed_rentals || 0),
  joinDate: user.join_date,
  lastActiveAt: user.last_active_at,
  isVerified: toBoolean(user.is_verified),
});

const getErrorMessage = (errors) => (!errors.isEmpty() ? errors.array() : null);

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('fullName').notEmpty().trim().isLength({ min: 2, max: 150 }),
    body('phone').notEmpty().trim().isLength({ min: 7, max: 30 }),
    body('city').notEmpty().trim().isLength({ min: 2, max: 150 }),
    body('neighborhood').optional({ values: 'falsy' }).trim().isLength({ max: 150 }),
    body('postalCode').optional({ values: 'falsy' }).trim().isLength({ max: 20 }),
    body('latitude').optional({ values: 'falsy' }).isFloat({ min: -90, max: 90 }),
    body('longitude').optional({ values: 'falsy' }).isFloat({ min: -180, max: 180 }),
    body('searchRadiusKm').optional({ values: 'falsy' }).isInt({ min: 1, max: 100 }),
    body('localVisibility').optional({ values: 'falsy' }).isIn(localVisibilityModes),
    body('accountType').isIn(accountTypes),
    body('preferredContactMethod').isIn(contactMethods),
    body('bio').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const errorPayload = getErrorMessage(errors);

    if (errorPayload) {
      return res.status(400).json({ errors: errorPayload });
    }

    const {
      email,
      password,
      fullName,
      phone,
      city,
      neighborhood = '',
      postalCode = '',
      latitude = null,
      longitude = null,
      searchRadiusKm = 15,
      localVisibility = 'neighborhood',
      accountType,
      preferredContactMethod,
      bio = '',
    } = req.body;

    try {
      const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      const id = createId();
      const passwordHash = await bcrypt.hash(password, 10);

      await pool.execute(
        `INSERT INTO users (
          id, email, password_hash, full_name, phone, city, neighborhood, postal_code,
          latitude, longitude, search_radius_km, local_visibility, account_type,
          preferred_contact_method, bio, join_date, rating, total_ratings,
          response_rate, response_time_minutes, completed_rentals, is_verified, last_active_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0, 0, 92, 60, 0, 0, NOW())`,
        [
          id,
          email,
          passwordHash,
          fullName,
          phone,
          city,
          neighborhood || null,
          postalCode || null,
          latitude || null,
          longitude || null,
          searchRadiusKm,
          localVisibility,
          accountType,
          preferredContactMethod,
          bio || null,
        ]
      );

      await pool.execute(
        `INSERT INTO user_verifications (id, user_id, verification_type, verification_status, metadata)
         VALUES (?, ?, ?, ?, ?)`,
        [createId(), id, 'email', 'pending', JSON.stringify({ source: 'registration' })]
      );
      await pool.execute(
        `INSERT INTO user_verifications (id, user_id, verification_type, verification_status, metadata)
         VALUES (?, ?, ?, ?, ?)`,
        [createId(), id, 'address', postalCode ? 'pending' : 'not_submitted', JSON.stringify({ city, postalCode })]
      );

      const [users] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);

      const user = users[0];
      const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: jwtExpire });

      return res.status(201).json({
        token,
        user: mapUser(user),
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Registration failed' });
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    const errorPayload = getErrorMessage(errors);

    if (errorPayload) {
      return res.status(400).json({ errors: errorPayload });
    }

    const { email, password } = req.body;

    try {
      const [users] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      await pool.execute('UPDATE users SET last_active_at = NOW() WHERE id = ?', [user.id]);

      const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: jwtExpire });
      const [updatedUsers] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [user.id]);

      return res.json({
        token,
        user: mapUser(updatedUsers[0]),
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  }
);

export default router;
