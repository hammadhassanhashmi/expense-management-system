import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

export default function budgetRoutes(pool) {
  // GET budgets for a month
  router.get('/', authenticate, async (req, res) => {
    const month = req.query.month || new Date().getMonth() + 1;
    const year = req.query.year || new Date().getFullYear();
    try {
      const [budgets] = await pool.query(
        `SELECT b.*, c.name as category_name, c.color, c.icon,
          COALESCE(SUM(e.amount), 0) as spent
         FROM budgets b
         JOIN categories c ON b.category_id = c.id
         LEFT JOIN expenses e ON e.category_id = b.category_id
           AND e.user_id = b.user_id
           AND MONTH(e.date) = b.month
           AND YEAR(e.date) = b.year
           AND e.type = 'expense'
         WHERE b.user_id = ? AND b.month = ? AND b.year = ?
         GROUP BY b.id`,
        [req.user.id, month, year]
      );
      res.json({ success: true, data: budgets });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Failed to fetch budgets' });
    }
  });

  // POST create/update budget (upsert)
  router.post('/', authenticate, async (req, res) => {
    const { category_id, amount, month, year } = req.body;
    if (!category_id || !amount || !month || !year) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    try {
      await pool.query(
        `INSERT INTO budgets (user_id, category_id, amount, month, year)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE amount = ?`,
        [req.user.id, category_id, amount, month, year, amount]
      );
      res.status(201).json({ success: true, message: 'Budget saved' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Failed to save budget' });
    }
  });

  // DELETE budget
  router.delete('/:id', authenticate, async (req, res) => {
    try {
      const [result] = await pool.query(
        'DELETE FROM budgets WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Budget not found' });
      }
      res.json({ success: true, message: 'Budget deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to delete budget' });
    }
  });

  return router;
}
