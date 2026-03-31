import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database.js';
import { createId, toBoolean } from '../utils/helpers.js';

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || 'change-this-secret';
const jwtExpire = process.env.JWT_EXPIRE || '7d';

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').notEmpty().trim(),
    body('location').notEmpty().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName, location } = req.body;

    try {
      const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const id = createId();
      const passwordHash = await bcrypt.hash(password, 10);

      await pool.execute(
        'INSERT INTO users (id, email, password_hash, full_name, location, join_date, rating, total_ratings, is_verified) VALUES (?, ?, ?, ?, ?, NOW(), 0, 0, 0)',
        [id, email, passwordHash, fullName, location]
      );

      const [users] = await pool.execute(
        'SELECT id, email, full_name, location, join_date, is_verified FROM users WHERE id = ?',
        [id]
      );

      const user = users[0];
      const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: jwtExpire });

      return res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          location: user.location,
          joinDate: user.join_date,
          isVerified: toBoolean(user.is_verified),
        },
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
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const [users] = await pool.execute(
        'SELECT id, email, password_hash, full_name, location, rating, total_ratings, is_verified FROM users WHERE email = ? LIMIT 1',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: jwtExpire });

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          location: user.location,
          rating: Number(user.rating),
          totalRatings: Number(user.total_ratings),
          isVerified: toBoolean(user.is_verified),
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  }
);

export default router;
