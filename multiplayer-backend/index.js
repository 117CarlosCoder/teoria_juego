const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

dotenv.config();

const PORT = Number(process.env.MP_PORT || 3002);
const FRONTEND_ORIGIN = process.env.MP_FRONTEND_ORIGIN || 'http://localhost:5174';
const RECONNECT_GRACE_MS = Number(process.env.MP_RECONNECT_GRACE_MS || 30000);
const SERVE_STATIC = String(process.env.MP_SERVE_STATIC || 'false').toLowerCase() === 'true';
const STATIC_DIST_PATH = process.env.MP_STATIC_DIST_PATH
  ? path.resolve(process.env.MP_STATIC_DIST_PATH)
  : path.resolve(__dirname, '../multiplayer-frontend/dist');
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;

const allowedOrigins = String(process.env.MP_ALLOWED_ORIGINS || FRONTEND_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes('*')) return true;
  return allowedOrigins.includes(origin);
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by Socket.IO CORS'));
    },
    methods: ['GET', 'POST'],
  },
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json());

const PAYOFF_MATRIX = {
  cooperate: { cooperate: { self: 3, opponent: 3 }, defect: { self: 0, opponent: 5 } },
  defect: { cooperate: { self: 5, opponent: 0 }, defect: { self: 1, opponent: 1 } },
};

const rooms = new Map();

function generateCode(length = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  while (code.length < length) {
    const idx = crypto.randomInt(0, alphabet.length);
    code += alphabet[idx];
  }
  return code;
}

function createRoomCode() {
  let attempts = 0;
  let code = generateCode();
  while (rooms.has(code) && attempts < 10) {
    code = generateCode();
    attempts += 1;
  }
  return code;
}

function sanitizeRoom(room) {
  return {
    roomCode: room.roomCode,
    status: room.status,
    rounds: room.rounds,
    roundTimeMs: room.roundTimeMs,
    currentRound: room.currentRound,
    roundDeadline: room.roundDeadline,
    createdAt: room.createdAt,
    winnerPlayerId: room.winnerPlayerId,
    scores: room.scores,
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      ready: player.ready,
      online: player.online,
      connectedSocketId: player.connectedSocketId,
      disconnectedAt: player.disconnectedAt,
      totalScore: room.scores[player.id] || 0,
    })),
    history: room.history,
  };
}

function summarizeRooms() {
  return Array.from(rooms.values()).map((room) => ({
    roomCode: room.roomCode,
    status: room.status,
    players: room.players.length,
    rounds: room.rounds,
    currentRound: room.currentRound,
    createdAt: room.createdAt,
  }));
}

function broadcastRoomState(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  io.to(roomCode).emit('room:state', sanitizeRoom(room));
}

function getPlayer(room, playerId) {
  return room.players.find((player) => player.id === playerId);
}

function scheduleRoundTimeout(roomCode, roundNumber) {
  const room = rooms.get(roomCode);
  if (!room) return;

  if (room.roundTimer) {
    clearTimeout(room.roundTimer);
  }

  room.roundTimer = setTimeout(() => {
    const activeRoom = rooms.get(roomCode);
    if (!activeRoom || activeRoom.status !== 'IN_ROUND') return;
    if (activeRoom.currentRound !== roundNumber) return;

    for (const player of activeRoom.players) {
      if (!activeRoom.actions.has(player.id)) {
        activeRoom.actions.set(player.id, 'cooperate');
      }
    }

    resolveRound(roomCode);
  }, room.roundTimeMs);
}

function startRound(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.status = 'IN_ROUND';
  room.currentRound += 1;
  room.actions = new Map();
  room.roundDeadline = Date.now() + room.roundTimeMs;

  io.to(roomCode).emit('round:started', {
    roomCode,
    round: room.currentRound,
    roundTimeMs: room.roundTimeMs,
    deadline: room.roundDeadline,
  });
  broadcastRoomState(roomCode);
  scheduleRoundTimeout(roomCode, room.currentRound);
}

function computeRoundScore(room, actions) {
  const roundScores = {};
  for (const player of room.players) {
    roundScores[player.id] = 0;
  }

  for (let i = 0; i < room.players.length; i += 1) {
    for (let j = i + 1; j < room.players.length; j += 1) {
      const a = room.players[i];
      const b = room.players[j];
      const actionA = actions.get(a.id) || 'cooperate';
      const actionB = actions.get(b.id) || 'cooperate';

      const payoffA = PAYOFF_MATRIX[actionA][actionB].self;
      const payoffB = PAYOFF_MATRIX[actionB][actionA].self;

      roundScores[a.id] += payoffA;
      roundScores[b.id] += payoffB;
    }
  }

  return roundScores;
}

function finishGame(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.status = 'FINISHED';
  if (room.roundTimer) {
    clearTimeout(room.roundTimer);
    room.roundTimer = null;
  }

  const ranking = [...room.players]
    .map((player) => ({
      id: player.id,
      name: player.name,
      score: room.scores[player.id] || 0,
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  room.winnerPlayerId = ranking.length ? ranking[0].id : null;
  io.to(roomCode).emit('game:finished', {
    roomCode,
    winnerPlayerId: room.winnerPlayerId,
    ranking,
  });
  broadcastRoomState(roomCode);
}

function resolveRound(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.status !== 'IN_ROUND') return;

  if (room.roundTimer) {
    clearTimeout(room.roundTimer);
    room.roundTimer = null;
  }

  const roundScores = computeRoundScore(room, room.actions);

  for (const playerId of Object.keys(roundScores)) {
    room.scores[playerId] = (room.scores[playerId] || 0) + roundScores[playerId];
  }

  const actionsRecord = {};
  for (const player of room.players) {
    actionsRecord[player.id] = room.actions.get(player.id) || 'cooperate';
  }

  const roundResult = {
    round: room.currentRound,
    actions: actionsRecord,
    roundScores,
    totals: { ...room.scores },
    resolvedAt: new Date().toISOString(),
  };

  room.history.push(roundResult);
  room.status = 'ROUND_RESULT';

  io.to(roomCode).emit('round:resolved', roundResult);
  broadcastRoomState(roomCode);

  if (room.currentRound >= room.rounds) {
    finishGame(roomCode);
    return;
  }

  setTimeout(() => {
    const activeRoom = rooms.get(roomCode);
    if (!activeRoom || activeRoom.status !== 'ROUND_RESULT') return;
    startRound(roomCode);
  }, 1500);
}

function allReady(room) {
  if (room.players.length < MIN_PLAYERS) return false;
  return room.players.every((player) => player.ready && player.online);
}

function tryStartGame(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.status !== 'WAITING') return;
  if (!allReady(room)) return;

  room.startedAt = new Date().toISOString();
  startRound(roomCode);
}

function pruneDisconnectedPlayers(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.status === 'FINISHED') return;

  const now = Date.now();
  room.players = room.players.filter((player) => {
    if (player.online) return true;
    if (!player.disconnectedAt) return true;
    return now - player.disconnectedAt < RECONNECT_GRACE_MS;
  });

  if (room.players.length === 0) {
    if (room.roundTimer) clearTimeout(room.roundTimer);
    rooms.delete(roomCode);
    return;
  }

  if (room.status === 'IN_ROUND') {
    for (const player of room.players) {
      if (!room.actions.has(player.id)) {
        room.actions.set(player.id, 'cooperate');
      }
    }

    if (room.actions.size === room.players.length) {
      resolveRound(roomCode);
      return;
    }
  }

  broadcastRoomState(roomCode);
}

setInterval(() => {
  for (const roomCode of rooms.keys()) {
    pruneDisconnectedPlayers(roomCode);
  }
}, 5000);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'multiplayer-backend',
    rooms: rooms.size,
  });
});

app.get('/rooms', (req, res) => {
  res.json(summarizeRooms());
});

app.get('/rooms/:roomCode', (req, res) => {
  const roomCode = String(req.params.roomCode || '').toUpperCase();
  const room = rooms.get(roomCode);
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }
  return res.json(sanitizeRoom(room));
});

if (SERVE_STATIC && fs.existsSync(STATIC_DIST_PATH)) {
  app.use(express.static(STATIC_DIST_PATH));

  app.get('/{*splat}', (req, res, next) => {
    if (
      req.path === '/health' ||
      req.path === '/rooms' ||
      req.path.startsWith('/rooms/') ||
      req.path.startsWith('/socket.io')
    ) {
      next();
      return;
    }

    res.sendFile(path.join(STATIC_DIST_PATH, 'index.html'));
  });
}

io.on('connection', (socket) => {
  socket.on('room:create', (payload = {}, callback = () => {}) => {
    const playerName = String(payload.playerName || '').trim();
    const rounds = Number(payload.rounds || 10);
    const roundTimeMs = Number(payload.roundTimeMs || 20000);

    if (!playerName) {
      callback({ ok: false, message: 'playerName is required' });
      return;
    }

    const roomCode = createRoomCode();
    const playerId = crypto.randomUUID();

    const room = {
      roomCode,
      status: 'WAITING',
      rounds: Math.max(1, Math.min(50, rounds)),
      roundTimeMs: Math.max(5000, Math.min(60000, roundTimeMs)),
      currentRound: 0,
      roundDeadline: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      winnerPlayerId: null,
      history: [],
      scores: {},
      players: [
        {
          id: playerId,
          name: playerName,
          ready: false,
          online: true,
          connectedSocketId: socket.id,
          disconnectedAt: null,
        },
      ],
      actions: new Map(),
      roundTimer: null,
    };

    room.scores[playerId] = 0;

    rooms.set(roomCode, room);
    socket.join(roomCode);

    callback({ ok: true, roomCode, playerId, room: sanitizeRoom(room) });
    broadcastRoomState(roomCode);
  });

  socket.on('room:join', (payload = {}, callback = () => {}) => {
    const roomCode = String(payload.roomCode || '').toUpperCase();
    const playerName = String(payload.playerName || '').trim();
    const requestedPlayerId = String(payload.playerId || '').trim() || null;

    const room = rooms.get(roomCode);
    if (!room) {
      callback({ ok: false, message: 'Room not found' });
      return;
    }

    if (room.status !== 'WAITING' && !requestedPlayerId) {
      callback({ ok: false, message: 'Game already started' });
      return;
    }

    if (!playerName && !requestedPlayerId) {
      callback({ ok: false, message: 'playerName is required' });
      return;
    }

    let player = null;

    if (requestedPlayerId) {
      player = getPlayer(room, requestedPlayerId);
      if (!player) {
        callback({ ok: false, message: 'Player session not found in room' });
        return;
      }
      player.online = true;
      player.connectedSocketId = socket.id;
      player.disconnectedAt = null;
    } else {
      if (room.players.length >= MAX_PLAYERS) {
        callback({ ok: false, message: 'Room is full' });
        return;
      }

      player = {
        id: crypto.randomUUID(),
        name: playerName,
        ready: false,
        online: true,
        connectedSocketId: socket.id,
        disconnectedAt: null,
      };
      room.players.push(player);
      room.scores[player.id] = 0;
    }

    socket.join(roomCode);

    callback({ ok: true, roomCode, playerId: player.id, room: sanitizeRoom(room) });
    broadcastRoomState(roomCode);
    tryStartGame(roomCode);
  });

  socket.on('room:ready', (payload = {}, callback = () => {}) => {
    const roomCode = String(payload.roomCode || '').toUpperCase();
    const playerId = String(payload.playerId || '').trim();
    const ready = Boolean(payload.ready);

    const room = rooms.get(roomCode);
    if (!room) {
      callback({ ok: false, message: 'Room not found' });
      return;
    }

    if (room.status !== 'WAITING') {
      callback({ ok: false, message: 'Room already started' });
      return;
    }

    const player = getPlayer(room, playerId);
    if (!player) {
      callback({ ok: false, message: 'Player not found' });
      return;
    }

    player.ready = ready;
    broadcastRoomState(roomCode);
    tryStartGame(roomCode);
    callback({ ok: true });
  });

  socket.on('round:submit', (payload = {}, callback = () => {}) => {
    const roomCode = String(payload.roomCode || '').toUpperCase();
    const playerId = String(payload.playerId || '').trim();
    const action = String(payload.action || '').trim();

    const room = rooms.get(roomCode);
    if (!room) {
      callback({ ok: false, message: 'Room not found' });
      return;
    }

    if (room.status !== 'IN_ROUND') {
      callback({ ok: false, message: 'Round is not active' });
      return;
    }

    if (!['cooperate', 'defect'].includes(action)) {
      callback({ ok: false, message: 'Invalid action' });
      return;
    }

    const player = getPlayer(room, playerId);
    if (!player) {
      callback({ ok: false, message: 'Player not found' });
      return;
    }

    room.actions.set(playerId, action);

    callback({ ok: true, pending: room.players.length - room.actions.size });

    if (room.actions.size >= room.players.length) {
      resolveRound(roomCode);
    }
  });

  socket.on('room:leave', (payload = {}, callback = () => {}) => {
    const roomCode = String(payload.roomCode || '').toUpperCase();
    const playerId = String(payload.playerId || '').trim();

    const room = rooms.get(roomCode);
    if (!room) {
      callback({ ok: true });
      return;
    }

    room.players = room.players.filter((player) => player.id !== playerId);
    delete room.scores[playerId];

    if (room.players.length === 0) {
      if (room.roundTimer) clearTimeout(room.roundTimer);
      rooms.delete(roomCode);
    } else {
      broadcastRoomState(roomCode);
    }

    callback({ ok: true });
  });

  socket.on('disconnect', () => {
    for (const room of rooms.values()) {
      const player = room.players.find((entry) => entry.connectedSocketId === socket.id);
      if (!player) continue;

      player.online = false;
      player.connectedSocketId = null;
      player.disconnectedAt = Date.now();
      broadcastRoomState(room.roomCode);
    }
  });

  socket.on('error', () => {
    socket.emit('error:event', { message: 'Unexpected realtime error' });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Multiplayer backend running on http://localhost:${PORT}`);
  if (SERVE_STATIC) {
    console.log(`Serving multiplayer frontend from ${STATIC_DIST_PATH}`);
  }
});
