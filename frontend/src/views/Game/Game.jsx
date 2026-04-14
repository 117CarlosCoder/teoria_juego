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
import api from '../../api';
import styles from './Game.module.css';
import { describeStrategy, getAgentActionWithMeta } from './GameEngine';
import { useGameState } from './useGameState';

const SPRITES = {
  player: '/sprites/player-pixel.svg',
  cpu: '/sprites/cpu-pixel.svg',
  coin: '/sprites/coin-pixel.svg',
  cooperate: '/sprites/cooperate-pixel.svg',
  defect: '/sprites/defect-pixel.svg',
};

function ResultBanner({ result }) {
  if (result === 'win') return <p className={styles.win}>Victoria estrategica</p>;
  if (result === 'lose') return <p className={styles.lose}>Derrota tactica</p>;
  return <p className={styles.draw}>Empate estrategico</p>;
}

function DecisionBoard() {
  return (
    <div className={styles.decisionBoard}>
      <p className={styles.boardLegend}>Matriz de Pagos</p>
      <div className={styles.matrixGrid}>
        <div className={styles.cell}>
          <span className={styles.cellAction}>C / C</span>
          <strong>3 | 3</strong>
        </div>
        <div className={styles.cell}>
          <span className={styles.cellAction}>C / T</span>
          <strong>0 | 5</strong>
        </div>
        <div className={styles.cell}>
          <span className={styles.cellAction}>T / C</span>
          <strong>5 | 0</strong>
        </div>
        <div className={styles.cell}>
          <span className={styles.cellAction}>T / T</span>
          <strong>1 | 1</strong>
        </div>
      </div>
    </div>
  );
}

function ActorCard({ name, score, badge, side, sprite }) {
  return (
    <div className={`${styles.actorCard} ${side === 'player' ? styles.playerSide : styles.agentSide}`}>
      <div className={styles.actorHead}>
        <img className={styles.actorSprite} src={sprite} alt={`Sprite de ${name}`} />
        <div className={styles.actorMeta}>
          <p className={styles.actorBadge}>{badge}</p>
          <h3>{name}</h3>
        </div>
      </div>
      <p className={styles.actorScore}>
        <img className={styles.coinSprite} src={SPRITES.coin} alt="" aria-hidden="true" />
        Score: {score}
      </p>
    </div>
  );
}

function Game() {
  const { state, dispatch } = useGameState();
  const [strategies, setStrategies] = useState([]);
  const [loadingStrategies, setLoadingStrategies] = useState(true);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    playerName: '',
    strategyId: '',
    totalRounds: 10,
    noiseEnabled: false,
  });

  useEffect(() => {
    async function fetchStrategies() {
      try {
        setLoadingStrategies(true);
        const { data } = await api.get('/api/strategies');
        setStrategies(data);
        if (data.length) {
          setForm((current) => ({ ...current, strategyId: String(data[0].id) }));
        }
      } finally {
        setLoadingStrategies(false);
      }
    }

    fetchStrategies();
  }, []);

  const selectedStrategy = useMemo(
    () => strategies.find((strategy) => String(strategy.id) === String(form.strategyId)),
    [strategies, form.strategyId]
  );

  const startedStrategy = useMemo(
    () => strategies.find((strategy) => strategy.id === state.strategyId),
    [strategies, state.strategyId]
  );

  useEffect(() => {
    async function saveGame() {
      if (state.screen !== 'result' || saved || !state.history.length) return;

      try {
        setSaveError('');
        await api.post('/api/games', {
          player_name: state.playerName,
          strategy_id: state.strategyId,
          total_rounds: state.totalRounds,
          player_score: state.playerScore,
          agent_score: state.agentScore,
          noise_enabled: state.noiseEnabled,
          result: state.result,
          rounds: state.history,
        });
        setSaved(true);
      } catch (error) {
        setSaveError('No se pudo guardar la partida.');
      }
    }

    saveGame();
  }, [state, saved]);

  const lineData = useMemo(() => {
    let player = 0;
    let agent = 0;

    return state.history.map((round) => {
      player += round.player_payoff;
      agent += round.agent_payoff;
      return {
        round: round.round_num,
        player,
        agent,
      };
    });
  }, [state.history]);

  const lastRound = state.history.length ? state.history[state.history.length - 1] : null;

  const startGame = () => {
    if (!form.playerName.trim() || !selectedStrategy) return;
    setSaved(false);

    dispatch({
      type: 'START',
      payload: {
        playerName: form.playerName.trim(),
        strategyId: selectedStrategy.id,
        strategySlug: selectedStrategy.slug,
        totalRounds: Number(form.totalRounds),
        noiseEnabled: form.noiseEnabled,
      },
    });
  };

  const playRound = (playerAction) => {
    if (!state.strategySlug) return;

    const { action, noiseApplied } = getAgentActionWithMeta(
      state.strategySlug,
      state.history,
      state.noiseEnabled ? 0.1 : 0
    );

    dispatch({
      type: 'PLAY_ROUND',
      payload: {
        playerAction,
        agentAction: action,
        noiseApplied,
      },
    });
  };

  if (state.screen === 'config') {
    return (
      <section className={styles.page}>
        <header className={styles.hero}>
          <p className={styles.coin}>
            <img className={styles.coinSprite} src={SPRITES.coin} alt="" aria-hidden="true" />
            [ 1 moneda ]
          </p>
          <h1 className={styles.title}>MODO JUGAR</h1>
          <p className={styles.subtitle}>Dilema del Prisionero - Arcade Pixel</p>
        </header>
        {loadingStrategies && <p>Cargando estrategias...</p>}

        <div className={styles.gameArena}>
          <ActorCard
            name={form.playerName || 'Jugador'}
            score={0}
            badge="TU"
            side="player"
            sprite={SPRITES.player}
          />
          <DecisionBoard />
          <ActorCard
            name={selectedStrategy ? selectedStrategy.name : 'Agente'}
            score={0}
            badge="CPU"
            side="agent"
            sprite={SPRITES.cpu}
          />
        </div>

        <div className={styles.controlDeck}>
          <div className={styles.controlRow}>
            <label>
              Nombre del jugador
              <input
                value={form.playerName}
                onChange={(event) => setForm((prev) => ({ ...prev, playerName: event.target.value }))}
                placeholder="Alias del jugador"
              />
            </label>

            <label>
              Estrategia rival
              <select
                value={form.strategyId}
                onChange={(event) => setForm((prev) => ({ ...prev, strategyId: event.target.value }))}
              >
                {strategies.map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.roundSelector}>
            <p>Duracion de partida</p>
            <div className={styles.roundButtons}>
              {[5, 10, 20].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value === form.totalRounds ? styles.roundButtonActive : styles.roundButton}
                  onClick={() => setForm((prev) => ({ ...prev, totalRounds: value }))}
                >
                  {value} R
                </button>
              ))}
            </div>
          </div>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={form.noiseEnabled}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, noiseEnabled: event.target.checked }))
              }
            />
            Activar ruido del entorno (10%)
          </label>

          <button className={styles.primaryAction} onClick={startGame} type="button">
            INSERT COIN · START
          </button>
        </div>
      </section>
    );
  }

  if (state.screen === 'playing') {
    return (
      <section className={styles.page}>
        <header className={styles.hero}>
          <h1 className={styles.title}>PARTIDA EN CURSO</h1>
          <p className={styles.progress}>Ronda {state.currentRound + 1} de {state.totalRounds}</p>
          <p className={styles.score}>Tu: {state.playerScore} - Agente: {state.agentScore}</p>
        </header>

        <div className={styles.gameArena}>
          <ActorCard
            name={state.playerName}
            score={state.playerScore}
            badge="TU"
            side="player"
            sprite={SPRITES.player}
          />
          <DecisionBoard />
          <ActorCard
            name={startedStrategy ? startedStrategy.name : 'Agente'}
            score={state.agentScore}
            badge="CPU"
            side="agent"
            sprite={SPRITES.cpu}
          />
        </div>

        {lastRound && (
          <div className={styles.lastRoundPanel}>
            <p>Ultima ronda</p>
            <strong>
              Tu: {lastRound.player_action === 'cooperate' ? 'C' : 'T'} | CPU:{' '}
              {lastRound.agent_action === 'cooperate' ? 'C' : 'T'} | Pago:{' '}
              {lastRound.player_payoff}-{lastRound.agent_payoff}
            </strong>
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.cooperate} onClick={() => playRound('cooperate')} type="button">
            C · COOPERAR
          </button>
          <button className={styles.defect} onClick={() => playRound('defect')} type="button">
            T · TRAICIONAR
          </button>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Ronda</th>
              <th>Tu accion</th>
              <th>Agente</th>
              <th>Pago tuyo</th>
              <th>Pago agente</th>
              <th>Ruido</th>
            </tr>
          </thead>
          <tbody>
            {state.history.map((round) => (
              <tr key={round.round_num}>
                <td>{round.round_num}</td>
                <td className={styles.actionCell}>
                  <img
                    className={styles.actionSprite}
                    src={round.player_action === 'cooperate' ? SPRITES.cooperate : SPRITES.defect}
                    alt={round.player_action === 'cooperate' ? 'Cooperar' : 'Traicionar'}
                  />
                </td>
                <td className={styles.actionCell}>
                  <img
                    className={styles.actionSprite}
                    src={round.agent_action === 'cooperate' ? SPRITES.cooperate : SPRITES.defect}
                    alt={round.agent_action === 'cooperate' ? 'Cooperar' : 'Traicionar'}
                  />
                </td>
                <td>{round.player_payoff}</td>
                <td>{round.agent_payoff}</td>
                <td>{round.noise_applied ? 'Si' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>RESULTADO FINAL</h1>
      </header>

      <div className={styles.gameArena}>
        <ActorCard
          name={state.playerName}
          score={state.playerScore}
          badge="TU"
          side="player"
          sprite={SPRITES.player}
        />
        <ResultBanner result={state.result} />
        <ActorCard
          name={startedStrategy ? startedStrategy.name : 'Agente'}
          score={state.agentScore}
          badge="CPU"
          side="agent"
          sprite={SPRITES.cpu}
        />
      </div>
      <p>
        {state.playerName}: {state.playerScore} - Agente: {state.agentScore}
      </p>
      <p>{describeStrategy(state.strategySlug)}</p>
      {saveError && <p className={styles.error}>{saveError}</p>}
      {saved && <p className={styles.saved}>Partida guardada en MySQL.</p>}

      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="round" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="player" name="Tu" stroke="#0ea5e9" strokeWidth={3} />
            <Line type="monotone" dataKey="agent" name="Agente" stroke="#dc2626" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {startedStrategy && <p className={styles.analysis}>Patron: {startedStrategy.description}</p>}

      <button onClick={() => dispatch({ type: 'RESET' })} type="button">
        NUEVA PARTIDA
      </button>
    </section>
  );
}

export default Game;
