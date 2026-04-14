const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT g.id, g.player_name, g.total_rounds, g.player_score, g.agent_score, g.noise_enabled,
              g.result, g.played_at, s.name AS strategy_name, s.slug AS strategy_slug
       FROM games g
       INNER JOIN strategies s ON g.strategy_id = s.id
       ORDER BY g.played_at DESC
       LIMIT 20`
    );
    res.json(rows);
  } catch (error) {
    console.error('GET /api/games error:', error.message);
    res.status(500).json({ message: 'Error fetching games' });
  }
});

router.post('/', async (req, res) => {
  const {
    player_name,
    strategy_id,
    total_rounds,
    player_score,
    agent_score,
    noise_enabled,
    result,
    rounds,
  } = req.body;

  if (!player_name || !strategy_id || !total_rounds || !result || !Array.isArray(rounds)) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [gameResult] = await connection.execute(
      `INSERT INTO games (
          player_name,
          strategy_id,
          total_rounds,
          player_score,
          agent_score,
          noise_enabled,
          result
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        player_name,
        strategy_id,
        total_rounds,
        player_score,
        agent_score,
        Boolean(noise_enabled),
        result,
      ]
    );

    const gameId = gameResult.insertId;

    for (const round of rounds) {
      await connection.execute(
        `INSERT INTO game_rounds (
            game_id,
            round_num,
            player_action,
            agent_action,
            player_payoff,
            agent_payoff,
            noise_applied
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          gameId,
          round.round_num,
          round.player_action,
          round.agent_action,
          round.player_payoff,
          round.agent_payoff,
          Boolean(round.noise_applied),
        ]
      );
    }

    await connection.commit();
    res.status(201).json({ id: gameId, result });
  } catch (error) {
    await connection.rollback();
    console.error('POST /api/games error:', error.message);
    res.status(500).json({ message: 'Error saving game' });
  } finally {
    connection.release();
  }
});

module.exports = router;
