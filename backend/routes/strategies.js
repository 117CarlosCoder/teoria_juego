const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, slug, description, is_nice, is_forgiving, is_retaliating, is_clear
       FROM strategies
       ORDER BY id ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error('GET /api/strategies error:', error.message);
    res.status(500).json({ message: 'Error fetching strategies' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, slug, description, is_nice, is_forgiving, is_retaliating, is_clear
       FROM strategies
       WHERE slug = ?
       LIMIT 1`,
      [req.params.slug]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Strategy not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('GET /api/strategies/:slug error:', error.message);
    res.status(500).json({ message: 'Error fetching strategy' });
  }
});

module.exports = router;
