import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

export default function authRoutes(pool) {
  // Register
  router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    try {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, hashedPassword]
      );
      const userId = result.insertId;

      // Seed default categories
      const defaultCategories = [
        ['Salary', 'income', '#10b981', '💰'],
        ['Freelance', 'income', '#3b82f6', '💻'],
        ['Food & Dining', 'expense', '#ef4444', '🍔'],
        ['Transportation', 'expense', '#f59e0b', '🚗'],
        ['Shopping', 'expense', '#8b5cf6', '🛍️'],
        ['Entertainment', 'expense', '#ec4899', '🎬'],
        ['Healthcare', 'expense', '#06b6d4', '🏥'],
        ['Utilities', 'expense', '#84cc16', '💡'],
      ];
      for (const [name, type, color, icon] of defaultCategories) {
        await pool.query(
          'INSERT INTO categories (user_id, name, type, color, icon) VALUES (?, ?, ?, ?, ?)',
          [userId, name, type, color, icon]
        );
      }

      const token = jwt.sign({ id: userId, email, name }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: { id: userId, name, email, role: 'user' },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Registration failed' });
    }
  });

  // Login
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      res.json({
        success: true,
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Login failed' });
    }
  });

  // Get current user
  router.get('/me', authenticate, async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?',
        [req.user.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, user: rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
  });

  return router;
}
