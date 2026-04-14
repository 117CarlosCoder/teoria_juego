const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3317),
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || 'apppass123',
  database: process.env.DB_NAME || 'game_theory',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
