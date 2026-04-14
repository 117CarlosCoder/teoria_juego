const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const strategiesRoutes = require('./routes/strategies');
const gamesRoutes = require('./routes/games');
const tournamentRoutes = require('./routes/tournament');

dotenv.config();
const pool = require('./config/db');

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

app.use('/api/strategies', strategiesRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/tournament', tournamentRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
