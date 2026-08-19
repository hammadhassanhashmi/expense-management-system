import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

export default function dashboardRoutes(pool) {
  router.get('/summary', authenticate, async (req, res) => {
    const userId = req.user.id;
    const month = req.query.month || new Date().getMonth() + 1;
    const year = req.query.year || new Date().getFullYear();

    try {
      // Total income and expense for the month
      const [totals] = await pool.query(
        `SELECT type, SUM(amount) as total
         FROM expenses
         WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
         GROUP BY type`,
        [userId, month, year]
      );

      let income = 0, expense = 0;
      totals.forEach(row => {
        if (row.type === 'income') income = parseFloat(row.total);
        else expense = parseFloat(row.total);
      });

      // Monthly trend (last 6 months)
      const [trend] = await pool.query(
        `SELECT MONTH(date) as month, YEAR(date) as year, type, SUM(amount) as total
         FROM expenses
         WHERE user_id = ?
           AND date >= DATE_SUB(LAST_DAY(CONCAT(?, '-', ?, '-01')), INTERVAL 5 MONTH)
         GROUP BY YEAR(date), MONTH(date), type
         ORDER BY year ASC, month ASC`,
        [userId, year, month]
      );

      // Expense by category (current month)
      const [byCategory] = await pool.query(
        `SELECT c.name, c.color, c.icon, SUM(e.amount) as total
         FROM expenses e
         JOIN categories c ON e.category_id = c.id
         WHERE e.user_id = ? AND MONTH(e.date) = ? AND YEAR(e.date) = ? AND e.type = 'expense'
         GROUP BY c.id
         ORDER BY total DESC`,
        [userId, month, year]
      );

      // Recent transactions (last 5)
      const [recent] = await pool.query(
        `SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
         FROM expenses e
         LEFT JOIN categories c ON e.category_id = c.id
         WHERE e.user_id = ?
         ORDER BY e.date DESC, e.created_at DESC
         LIMIT 5`,
        [userId]
      );

      res.json({
        success: true,
        data: {
          summary: { income, expense, balance: income - expense },
          trend,
          byCategory,
          recent,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
    }
  });

  return router;
}
