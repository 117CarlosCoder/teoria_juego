import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { fetchHealth, fetchRooms } from './api';
import { connectSocket, socket } from './socket';

const SPRITES = {
  coin: '/sprites/coin-pixel.svg',
};

const CHART_COLORS = [
  '#0ea5e9',
  '#dc2626',
  '#22c55e',
  '#f59e0b',
  '#7c3aed',
  '#e11d48',
  '#14b8a6',
  '#f97316',
];

const defaultConfig = {
  playerName: '',
  rounds: 10,
  roundTimeMs: 20000,
  roomCode: '',
};

function ActionButtons({ disabled, onSelect }) {
  return (
    <div className="actions">
      <button
        className="cooperateBtn"
        disabled={disabled}
        onClick={() => onSelect('cooperate')}
        type="button"
      >
        Cooperar
      </button>
      <button
        className="defectBtn"
        disabled={disabled}
        onClick={() => onSelect('defect')}
        type="button"
      >
        Traicionar
      </button>
    </div>
  );
}

function DecisionBoard({ highlightedCell, pulseTick }) {
  const outcomeClassName = (cellKey) =>
    `outcomeDiamond outcome${cellKey} ${highlightedCell === cellKey ? 'outcomeActive' : ''}`;

  return (
    <div className="decisionBoard">
      <p className="boardLegend">Matriz de Pagos</p>
      <div className="lightTopLeft" aria-hidden="true" />
      <div className="lightTopRight" aria-hidden="true" />
      <div className="lightMidLeft" aria-hidden="true" />
      <div className="lightMidRight" aria-hidden="true" />

      <div className="matrixDiamond">
        <div key={`CC-${pulseTick}`} className={outcomeClassName('CC')} aria-label="Resultado C-C: 3 y 3">
          <div className="outcomeTopHalf" />
          <div className="outcomeBottomHalf" />
          <strong>3 | 3</strong>
        </div>

        <div key={`TC-${pulseTick}`} className={outcomeClassName('TC')} aria-label="Resultado T-C: 5 y 0">
          <div className="outcomeTopHalf" />
          <div className="outcomeBottomHalf" />
          <strong>5 | 0</strong>
        </div>

        <div key={`CT-${pulseTick}`} className={outcomeClassName('CT')} aria-label="Resultado C-T: 0 y 5">
          <div className="outcomeTopHalf" />
          <div className="outcomeBottomHalf" />
          <strong>0 | 5</strong>
        </div>

        <div key={`TT-${pulseTick}`} className={outcomeClassName('TT')} aria-label="Resultado T-T: 1 y 1">
          <div className="outcomeTopHalf" />
          <div className="outcomeBottomHalf" />
          <strong>1 | 1</strong>
        </div>
      </div>
    </div>
  );
}

function HumanoidCard({ badge, name, score, side, actionLabel, secondaryLabel }) {
  const actionToneClass = (label) => {
    if (label === 'C') return 'signCooperate';
    if (label === 'D') return 'signDefect';
    return 'signIdle';
  };

  const isDefectSelected = actionLabel === 'D';
  const topSignLabel = isDefectSelected ? secondaryLabel : actionLabel;
  const bottomSignLabel = isDefectSelected ? actionLabel : secondaryLabel;
  const topSignTone = actionToneClass(topSignLabel);
  const bottomSignTone = actionToneClass(bottomSignLabel);

  return (
    <article className={`humanoidCard ${side === 'agent' ? 'agentTone' : 'playerTone'}`}>
      <div
        className={`actorScene ${side === 'agent' ? 'sceneRight' : 'sceneLeft'} ${
          isDefectSelected ? 'sceneDefect' : 'sceneCooperate'
        }`}
      >
        <div className="sceneTopScore">
          <img className="coinTiny" src={SPRITES.coin} alt="" aria-hidden="true" />
          <span>{score}</span>
        </div>

        <div className="humanoid" aria-hidden="true">
          <div className="hHead" />
          <div className="hTorso" />
          <div className="hArmUp" />
          <div className="hArmDown" />
          <div className="hLegLeft" />
          <div className="hLegRight" />
        </div>

        <div className="handMountUp" aria-hidden="true">
          <div className="handTipUp">
            <div className="signPoleTop" />
            <div className={`actionSign signTop ${topSignTone}`}>{topSignLabel}</div>
          </div>
        </div>

        <div className="handMountDown" aria-hidden="true">
          <div className="handTipDown">
            <div className="signPoleBottom" />
            <div className={`actionSign signBottom ${bottomSignTone}`}>{bottomSignLabel}</div>
          </div>
        </div>
      </div>

      <div className="spriteHeader">
        <p>{badge}</p>
        <strong>{name}</strong>
      </div>
    </article>
  );
}

function getActionLabel(action) {
  if (action === 'cooperate') return 'C';
  if (action === 'defect') return 'D';
  return '-';
}

function getAlternativeLabel(label) {
  if (label === 'C') return 'D';
  if (label === 'D') return 'C';
  return '-';
}

function App() {
  const [health, setHealth] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [config, setConfig] = useState(defaultConfig);
  const [roomState, setRoomState] = useState(null);
  const [playerId, setPlayerId] = useState(() => localStorage.getItem('mp_player_id') || '');
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem('mp_room_code') || '');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [isResolvingRound, setIsResolvingRound] = useState(false);

  const myPlayer = useMemo(() => {
    if (!roomState || !playerId) return null;
    return roomState.players?.find((player) => player.id === playerId) || null;
  }, [roomState, playerId]);

  const canSubmitAction =
    roomState?.status === 'IN_ROUND' && Boolean(myPlayer?.online) && !selectedAction && !isResolvingRound;
  const myScore = myPlayer?.totalScore || 0;
  const topOpponent = useMemo(() => {
    if (!roomState?.players?.length) return null;
    const others = roomState.players.filter((player) => player.id !== playerId);
    if (!others.length) return null;
    return [...others].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))[0];
  }, [roomState, playerId]);

  const latestRound = useMemo(() => {
    if (!roomState?.history?.length) return null;
    return roomState.history[roomState.history.length - 1];
  }, [roomState]);

  const highlightedCell = useMemo(() => {
    if (!latestRound || !playerId || !topOpponent?.id) return '';
    const myAction = latestRound.actions?.[playerId];
    const rivalAction = latestRound.actions?.[topOpponent.id];
    if (!myAction || !rivalAction) return '';
    const me = myAction === 'cooperate' ? 'C' : 'T';
    const rival = rivalAction === 'cooperate' ? 'C' : 'T';
    return `${me}${rival}`;
  }, [latestRound, playerId, topOpponent]);

  const chartData = useMemo(() => {
    if (!roomState?.history?.length || !roomState?.players?.length) return [];
    return roomState.history.map((roundItem) => {
      const point = { round: roundItem.round };
      roomState.players.forEach((player) => {
        point[player.id] = roundItem.totals?.[player.id] || 0;
      });
      return point;
    });
  }, [roomState]);

  const ranking = useMemo(() => {
    if (!roomState?.players?.length) return [];
    return [...roomState.players].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  }, [roomState]);

  const winner = ranking.length ? ranking[0] : null;

  const myActionLabel = useMemo(() => {
    if (selectedAction) return getActionLabel(selectedAction);
    if (!latestRound || !playerId) return '-';
    return getActionLabel(latestRound.actions?.[playerId]);
  }, [selectedAction, latestRound, playerId]);

  const myAlternativeLabel = useMemo(() => getAlternativeLabel(myActionLabel), [myActionLabel]);

  const opponentActionLabel = useMemo(() => {
    if (!latestRound || !topOpponent?.id) return '-';
    return getActionLabel(latestRound.actions?.[topOpponent.id]);
  }, [latestRound, topOpponent]);

  const opponentAlternativeLabel = useMemo(
    () => getAlternativeLabel(opponentActionLabel),
    [opponentActionLabel]
  );

  useEffect(() => {
    connectSocket();

    const onRoomState = (state) => {
      setRoomState(state);
      if (state?.roomCode) {
        setRoomCode(state.roomCode);
        localStorage.setItem('mp_room_code', state.roomCode);
      }
    };

    const onRoundStarted = (data) => {
      setSelectedAction('');
      setIsResolvingRound(false);
      setStatusMessage(`Ronda ${data.round} iniciada. Tienes ${Math.floor((data.roundTimeMs || 0) / 1000)}s.`);
    };

    const onRoundResolved = (data) => {
      setIsResolvingRound(false);
      setStatusMessage(`Ronda ${data.round} resuelta.`);
    };

    const onFinished = (data) => {
      setIsResolvingRound(false);
      const winner = data.ranking?.[0];
      setStatusMessage(winner ? `Partida finalizada. Gano: ${winner.name}` : 'Partida finalizada.');
    };

    const onError = (error) => {
      setStatusMessage(error?.message || 'Error en tiempo real');
    };

    socket.on('room:state', onRoomState);
    socket.on('round:started', onRoundStarted);
    socket.on('round:resolved', onRoundResolved);
    socket.on('game:finished', onFinished);
    socket.on('error:event', onError);

    return () => {
      socket.off('room:state', onRoomState);
      socket.off('round:started', onRoundStarted);
      socket.off('round:resolved', onRoundResolved);
      socket.off('game:finished', onFinished);
      socket.off('error:event', onError);
    };
  }, []);

  useEffect(() => {
    async function boot() {
      try {
        const [healthData, roomsData] = await Promise.all([fetchHealth(), fetchRooms()]);
        setHealth(healthData);
        setRooms(roomsData);
      } catch (error) {
        setStatusMessage(error.message);
      }
    }

    boot();
    const interval = setInterval(async () => {
      try {
        const roomsData = await fetchRooms();
        setRooms(roomsData);
      } catch {
        // Ignore polling errors to avoid disrupting live play.
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const createRoom = () => {
    setStatusMessage('');
    socket.emit(
      'room:create',
      {
        playerName: config.playerName,
        rounds: Number(config.rounds),
        roundTimeMs: Number(config.roundTimeMs),
      },
      (response) => {
        if (!response?.ok) {
          setStatusMessage(response?.message || 'No se pudo crear la sala');
          return;
        }

        setPlayerId(response.playerId);
        setRoomState(response.room);
        setRoomCode(response.roomCode);
        localStorage.setItem('mp_player_id', response.playerId);
        localStorage.setItem('mp_room_code', response.roomCode);
        setStatusMessage(`Sala creada: ${response.roomCode}`);
      }
    );
  };

  const joinRoom = () => {
    setStatusMessage('');
    socket.emit(
      'room:join',
      {
        roomCode: config.roomCode,
        playerName: config.playerName,
        playerId: playerId || undefined,
      },
      (response) => {
        if (!response?.ok) {
          setStatusMessage(response?.message || 'No se pudo unir a la sala');
          return;
        }

        setPlayerId(response.playerId);
        setRoomState(response.room);
        setRoomCode(response.roomCode);
        localStorage.setItem('mp_player_id', response.playerId);
        localStorage.setItem('mp_room_code', response.roomCode);
        setStatusMessage(`Unido a sala ${response.roomCode}`);
      }
    );
  };

  const setReady = (ready) => {
    if (!roomCode || !playerId) return;

    socket.emit('room:ready', { roomCode, playerId, ready }, (response) => {
      if (!response?.ok) {
        setStatusMessage(response?.message || 'No se pudo actualizar el estado ready');
        return;
      }
      setStatusMessage(ready ? 'Marcado como listo.' : 'Ya no estas listo.');
    });
  };

  const submitAction = (action) => {
    if (!roomCode || !playerId) return;

    socket.emit('round:submit', { roomCode, playerId, action }, (response) => {
      if (!response?.ok) {
        setStatusMessage(response?.message || 'No se pudo enviar la accion');
        return;
      }

      setSelectedAction(action);
      setIsResolvingRound(true);
      setStatusMessage(`Accion enviada. Esperando al resto (${response.pending} pendientes).`);
    });
  };

  const leaveRoom = () => {
    if (!roomCode || !playerId) {
      setRoomState(null);
      setSelectedAction('');
      return;
    }

    socket.emit('room:leave', { roomCode, playerId }, () => {
      setRoomState(null);
      setSelectedAction('');
      setIsResolvingRound(false);
      setStatusMessage('Saliste de la sala.');
      localStorage.removeItem('mp_room_code');
      localStorage.removeItem('mp_player_id');
      setRoomCode('');
      setPlayerId('');
    });
  };

  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">Teoria de Juegos Lab</div>
        <nav className="pillNav" aria-label="Multiplayer navigation">
          <span className="pill active">Multijugador</span>
          <span className="pill">Aislado</span>
        </nav>
      </header>

      <main className="page">
        <header className="hero">
          <p className="heroKicker">[ 1 moneda ]</p>
          <h1>MODO MULTIJUGADOR</h1>
          <p>Dilema del Prisionero - Sala en tiempo real</p>
        </header>

        <section className="statusBar">
          <p className="statusPill">WS: {socket.connected ? 'Conectado' : 'Desconectado'}</p>
          <p className="statusPill">Backend: {health?.status || 'sin respuesta'}</p>
          <p className="statusPill">Salas activas: {rooms.length}</p>
        </section>

        <section
          className={`arenaPreview ${isResolvingRound ? 'resolvingArena' : ''}`}
          aria-label="Vista pixel de la partida multijugador"
        >
          <HumanoidCard
            badge="TU"
            name={myPlayer?.name || config.playerName || 'Jugador'}
            score={myScore}
            side="player"
            actionLabel={myActionLabel}
            secondaryLabel={myAlternativeLabel}
          />
          <DecisionBoard highlightedCell={highlightedCell} pulseTick={roomState?.currentRound || 0} />
          <HumanoidCard
            badge="RIVAL"
            name={topOpponent?.name || 'CPU'}
            score={topOpponent?.totalScore || 0}
            side="agent"
            actionLabel={opponentActionLabel}
            secondaryLabel={opponentAlternativeLabel}
          />
        </section>

        <section className="statusBar">
          <p className="statusPill">{roomCode ? `Sala: ${roomCode}` : 'Aun no estas en una sala'}</p>
          <p className="statusPill">
            {selectedAction ? `Ultima accion: ${selectedAction.toUpperCase()}` : 'Sin accion enviada'}
          </p>
          {isResolvingRound && <p className="lockedLabel">Resolviendo...</p>}
        </section>

        <section className="panel panelLobby">
          <h2>Lobby</h2>
          <div className="grid2">
            <label>
              Nombre
              <input
                value={config.playerName}
                onChange={(event) => setConfig((prev) => ({ ...prev, playerName: event.target.value }))}
                placeholder="Tu alias"
              />
            </label>
            <label>
              Codigo de sala
              <input
                value={config.roomCode}
                onChange={(event) => setConfig((prev) => ({ ...prev, roomCode: event.target.value.toUpperCase() }))}
                placeholder="ABC123"
              />
            </label>
            <label>
              Rondas
              <input
                type="number"
                min="1"
                max="50"
                value={config.rounds}
                onChange={(event) => setConfig((prev) => ({ ...prev, rounds: Number(event.target.value) }))}
              />
            </label>
            <label>
              Tiempo por ronda (ms)
              <input
                type="number"
                min="5000"
                max="60000"
                step="1000"
                value={config.roundTimeMs}
                onChange={(event) => setConfig((prev) => ({ ...prev, roundTimeMs: Number(event.target.value) }))}
              />
            </label>
          </div>

          <div className="actions">
            <button type="button" onClick={createRoom} disabled={!config.playerName.trim()}>
              Crear sala
            </button>
            <button
              type="button"
              onClick={joinRoom}
              disabled={!config.playerName.trim() || !config.roomCode.trim()}
            >
              Unirse
            </button>
          </div>
        </section>

        <section className="panel panelRooms">
          <h2>Salas activas</h2>
          {rooms.length === 0 ? (
            <p>No hay salas activas.</p>
          ) : (
            <ul className="roomList">
              {rooms.map((room) => (
                <li key={room.roomCode}>
                  <strong>{room.roomCode}</strong>
                  <span>{room.players} jugadores</span>
                  <span>{room.status}</span>
                  <span>
                    Ronda {room.currentRound}/{room.rounds}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {roomState && (
          <section className="panel panelRoomState">
            <h2>Sala {roomState.roomCode}</h2>
            <p className="roomStateLine">
              Estado: <strong>{roomState.status}</strong> | Ronda {roomState.currentRound}/{roomState.rounds}
            </p>
            <div className="actions">
              <button type="button" onClick={() => setReady(true)}>
                Estoy listo
              </button>
              <button type="button" onClick={() => setReady(false)}>
                No listo
              </button>
              <button type="button" onClick={leaveRoom}>
                Salir sala
              </button>
            </div>

            <ActionButtons disabled={!canSubmitAction} onSelect={submitAction} />
            <p className="currentAction">Tu accion actual: {selectedAction || '-'}</p>

            <h3>Jugadores</h3>
            <ul className="playersList">
              {roomState.players?.map((player) => (
                <li key={player.id}>
                  <strong>{player.name}</strong>
                  <span>{player.id === playerId ? 'tu' : 'otro'}</span>
                  <span>score: {player.totalScore}</span>
                  <span>{player.ready ? 'ready' : 'not-ready'}</span>
                  <span>{player.online ? 'online' : 'offline'}</span>
                </li>
              ))}
            </ul>

            <h3>Ranking</h3>
            <ol className="rankingList">
              {ranking.map((player) => (
                <li key={`rank-${player.id}`}>
                  {player.name}: {player.totalScore || 0}
                </li>
              ))}
            </ol>
          </section>
        )}

        {roomState?.status === 'FINISHED' && (
          <section className="panel panelFinalResult">
            <h2>RESULTADO FINAL</h2>
            <p className="resultSummary">
              {winner ? `Ganador: ${winner.name} (${winner.totalScore || 0})` : 'Partida finalizada'}
            </p>

            <div className="chartWrap">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="round" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {ranking.map((player, index) => (
                    <Line
                      key={`line-${player.id}`}
                      type="monotone"
                      dataKey={player.id}
                      name={player.name}
                      stroke={CHART_COLORS[index % CHART_COLORS.length]}
                      strokeWidth={3}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="resultHint">Grafica acumulada por ronda para todos los jugadores de la sala.</p>
          </section>
        )}

        {statusMessage ? <p className="info">{statusMessage}</p> : null}
      </main>
    </div>
  );
}

export default App;
