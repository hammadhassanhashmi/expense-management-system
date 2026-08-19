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
      for (const [catName, type, color, icon] of defaultCategories) {
        await pool.query(
          'INSERT INTO categories (user_id, name, type, color, icon) VALUES (?, ?, ?, ?, ?)',
          [userId, catName, type, color, icon]
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
        user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, currency: user.currency || 'USD' },
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
        'SELECT id, name, email, role, avatar, currency, created_at FROM users WHERE id = ?',
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

  // Update profile (name + currency)
  router.put('/profile', authenticate, async (req, res) => {
    const { name, currency } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    try {
      await pool.query('UPDATE users SET name = ?, currency = ? WHERE id = ?', [name, currency || 'USD', req.user.id]);
      const [rows] = await pool.query(
        'SELECT id, name, email, role, avatar, currency, created_at FROM users WHERE id = ?',
        [req.user.id]
      );
      res.json({ success: true, message: 'Profile updated', user: rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
  });

  // Update currency only
  router.put('/currency', authenticate, async (req, res) => {
    const { currency } = req.body;
    if (!currency) {
      return res.status(400).json({ success: false, message: 'Currency is required' });
    }
    try {
      await pool.query('UPDATE users SET currency = ? WHERE id = ?', [currency, req.user.id]);
      const [rows] = await pool.query(
        'SELECT id, name, email, role, avatar, currency, created_at FROM users WHERE id = ?',
        [req.user.id]
      );
      res.json({ success: true, message: 'Currency updated', user: rows[0] });
    } catch (err) {
      console.error('Currency update error:', err);
      res.status(500).json({ success: false, message: 'Failed to update currency' });
    }
  });

  // Change password
  router.put('/password', authenticate, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both fields are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }
    try {
      const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
      const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      const hashed = await bcrypt.hash(newPassword, 12);
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to change password' });
    }
  });

  // Upload avatar (base64)
  router.post('/avatar', authenticate, async (req, res) => {
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }
    if (!avatar.startsWith('data:image/')) {
      return res.status(400).json({ success: false, message: 'Invalid image format' });
    }
    // Limit size ~2MB base64
    if (avatar.length > 2.8 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'Image too large. Max 2MB.' });
    }
    try {
      await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [avatar, req.user.id]);
      res.json({ success: true, message: 'Avatar updated', avatar });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Failed to update avatar' });
    }
  });

  // Remove avatar
  router.delete('/avatar', authenticate, async (req, res) => {
    try {
      await pool.query('UPDATE users SET avatar = NULL WHERE id = ?', [req.user.id]);
      res.json({ success: true, message: 'Avatar removed' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to remove avatar' });
    }
  });

  return router;
}
