import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

export default function categoryRoutes(pool) {
  // GET all categories for user
  router.get('/', authenticate, async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM categories WHERE user_id = ? ORDER BY type, name',
        [req.user.id]
      );
      res.json({ success: true, data: rows });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
  });

  // POST create category
  router.post('/', authenticate, async (req, res) => {
    const { name, type, color, icon } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Name and type are required' });
    }
    try {
      const [result] = await pool.query(
        'INSERT INTO categories (user_id, name, type, color, icon) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, name, type, color || '#6366f1', icon || '📁']
      );
      const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
      res.status(201).json({ success: true, message: 'Category created', data: rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to create category' });
    }
  });

  // PUT update category
  router.put('/:id', authenticate, async (req, res) => {
    const { name, type, color, icon } = req.body;
    try {
      const [existing] = await pool.query(
        'SELECT id FROM categories WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      await pool.query(
        'UPDATE categories SET name=?, type=?, color=?, icon=? WHERE id=? AND user_id=?',
        [name, type, color, icon, req.params.id, req.user.id]
      );
      const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
      res.json({ success: true, message: 'Category updated', data: rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to update category' });
    }
  });

  // DELETE category
  router.delete('/:id', authenticate, async (req, res) => {
    try {
      const [result] = await pool.query(
        'DELETE FROM categories WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      res.json({ success: true, message: 'Category deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to delete category' });
    }
  });

  return router;
}
