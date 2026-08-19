import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

export default function expenseRoutes(pool) {
  // GET all expenses (with filters)
  router.get('/', authenticate, async (req, res) => {
    const { type, category_id, start_date, end_date, search } = req.query;
    let sql = `
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ?
    `;
    const params = [req.user.id];

    if (type) { sql += ' AND e.type = ?'; params.push(type); }
    if (category_id) { sql += ' AND e.category_id = ?'; params.push(category_id); }
    if (start_date) { sql += ' AND e.date >= ?'; params.push(start_date); }
    if (end_date) { sql += ' AND e.date <= ?'; params.push(end_date); }
    if (search) { sql += ' AND e.title LIKE ?'; params.push(`%${search}%`); }

    sql += ' ORDER BY e.date DESC, e.created_at DESC';

    try {
      const [rows] = await pool.query(sql, params);
      res.json({ success: true, data: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
    }
  });

  // GET single expense
  router.get('/:id', authenticate, async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT e.*, c.name as category_name FROM expenses e
         LEFT JOIN categories c ON e.category_id = c.id
         WHERE e.id = ? AND e.user_id = ?`,
        [req.params.id, req.user.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Expense not found' });
      }
      res.json({ success: true, data: rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch expense' });
    }
  });

  // POST create expense
  router.post('/', authenticate, async (req, res) => {
    const { title, amount, type, date, category_id, description } = req.body;
    if (!title || !amount || !type || !date) {
      return res.status(400).json({ success: false, message: 'Title, amount, type, and date are required' });
    }
    try {
      const [result] = await pool.query(
        'INSERT INTO expenses (user_id, category_id, title, amount, type, date, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, category_id || null, title, amount, type, date, description || null]
      );
      const [rows] = await pool.query(
        `SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
         FROM expenses e LEFT JOIN categories c ON e.category_id = c.id WHERE e.id = ?`,
        [result.insertId]
      );
      res.status(201).json({ success: true, message: 'Transaction added', data: rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Failed to create expense' });
    }
  });

  // PUT update expense
  router.put('/:id', authenticate, async (req, res) => {
    const { title, amount, type, date, category_id, description } = req.body;
    try {
      const [existing] = await pool.query(
        'SELECT id FROM expenses WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Expense not found' });
      }
      await pool.query(
        'UPDATE expenses SET title=?, amount=?, type=?, date=?, category_id=?, description=? WHERE id=? AND user_id=?',
        [title, amount, type, date, category_id || null, description || null, req.params.id, req.user.id]
      );
      const [rows] = await pool.query(
        `SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
         FROM expenses e LEFT JOIN categories c ON e.category_id = c.id WHERE e.id = ?`,
        [req.params.id]
      );
      res.json({ success: true, message: 'Transaction updated', data: rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Failed to update expense' });
    }
  });

  // DELETE expense
  router.delete('/:id', authenticate, async (req, res) => {
    try {
      const [result] = await pool.query(
        'DELETE FROM expenses WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Expense not found' });
      }
      res.json({ success: true, message: 'Transaction deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to delete expense' });
    }
  });

  return router;
}
