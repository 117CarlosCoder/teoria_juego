const express = require('express');
const pool = require('../config/db');

const router = express.Router();

const PAYOFF_MATRIX = {
  CC: { player: 3, agent: 3 },
  CD: { player: 0, agent: 5 },
  DC: { player: 5, agent: 0 },
  DD: { player: 1, agent: 1 },
};

function computeAction(strategy, history) {
  if (strategy === 'tit_for_tat') {
    if (history.length === 0) return 'cooperate';
    return history[history.length - 1].opponentAction;
  }

  if (strategy === 'grim') {
    const betrayed = history.some((h) => h.opponentAction === 'defect');
    return betrayed ? 'defect' : 'cooperate';
  }

  if (strategy === 'joss') {
    if (history.length === 0) return 'cooperate';
    const last = history[history.length - 1].opponentAction;
    if (last === 'cooperate' && Math.random() < 0.1) return 'defect';
    return last;
  }

  if (strategy === 'random') {
    return Math.random() < 0.5 ? 'cooperate' : 'defect';
  }

  if (strategy === 'tit_for_two_tats') {
    if (history.length < 2) return 'cooperate';
    const lastTwo = history.slice(-2);
    const bothDefect = lastTwo.every((h) => h.opponentAction === 'defect');
    return bothDefect ? 'defect' : 'cooperate';
  }

  return 'cooperate';
}

function getPayoff(playerAction, agentAction) {
  const key = `${playerAction === 'cooperate' ? 'C' : 'D'}${agentAction === 'cooperate' ? 'C' : 'D'}`;
  return PAYOFF_MATRIX[key];
}

function playMatch(strategyA, strategyB, rounds = 200) {
  const historyA = [];
  const historyB = [];
  let scoreA = 0;
  let scoreB = 0;

  for (let i = 0; i < rounds; i += 1) {
    const actionA = computeAction(strategyA, historyA);
    const actionB = computeAction(strategyB, historyB);
    const payoff = getPayoff(actionA, actionB);

    scoreA += payoff.player;
    scoreB += payoff.agent;

    historyA.push({ opponentAction: actionB });
    historyB.push({ opponentAction: actionA });
  }

  return { scoreA, scoreB };
}

async function runTournament() {
  const [strategies] = await pool.execute('SELECT id, slug FROM strategies ORDER BY id ASC');
  const totals = new Map();

  for (const strategy of strategies) {
    totals.set(strategy.slug, { id: strategy.id, total: 0 });
  }

  for (let i = 0; i < strategies.length; i += 1) {
    for (let j = i + 1; j < strategies.length; j += 1) {
      const a = strategies[i];
      const b = strategies[j];
      const match = playMatch(a.slug, b.slug, 200);
      totals.get(a.slug).total += match.scoreA;
      totals.get(b.slug).total += match.scoreB;
    }
  }

  const ranked = Array.from(totals.entries())
    .map(([slug, value]) => ({ slug, strategy_id: value.id, total_score: value.total }))
    .sort((a, b) => b.total_score - a.total_score)
    .map((entry, index) => ({
      ...entry,
      rank_position: index + 1,
      avg_score_per_round: Number((entry.total_score / 800).toFixed(2)),
    }));

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const simulatedAt = new Date();

    for (const row of ranked) {
      await connection.execute(
        `INSERT INTO tournament_results (
          strategy_id,
          total_score,
          avg_score_per_round,
          rank_position,
          simulated_at
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          row.strategy_id,
          row.total_score,
          row.avg_score_per_round,
          row.rank_position,
          simulatedAt,
        ]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return ranked;
}

router.get('/results', async (req, res) => {
  try {
    const [latest] = await pool.execute(
      `SELECT simulated_at
       FROM tournament_results
       ORDER BY simulated_at DESC
       LIMIT 1`
    );

    if (!latest.length) {
      return res.json([]);
    }

    const [rows] = await pool.execute(
      `SELECT tr.id, tr.strategy_id, s.name AS strategy_name, s.slug AS strategy_slug,
              tr.total_score, tr.avg_score_per_round, tr.rank_position, tr.simulated_at
       FROM tournament_results tr
       INNER JOIN strategies s ON s.id = tr.strategy_id
       WHERE tr.simulated_at = ?
       ORDER BY tr.rank_position ASC`,
      [latest[0].simulated_at]
    );

    res.json(rows);
  } catch (error) {
    console.error('GET /api/tournament/results error:', error.message);
    res.status(500).json({ message: 'Error fetching tournament results' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT simulated_at, MAX(total_score) AS winning_score
       FROM tournament_results
       GROUP BY simulated_at
       ORDER BY simulated_at DESC
       LIMIT 5`
    );
    res.json(rows);
  } catch (error) {
    console.error('GET /api/tournament/history error:', error.message);
    res.status(500).json({ message: 'Error fetching tournament history' });
  }
});

router.post('/run', async (req, res) => {
  try {
    const results = await runTournament();
    res.status(201).json(results);
  } catch (error) {
    console.error('POST /api/tournament/run error:', error.message);
    res.status(500).json({ message: 'Error running tournament' });
  }
});

module.exports = router;
