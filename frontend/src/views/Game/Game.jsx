import { useEffect, useMemo, useRef, useState } from 'react';
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
import RoundResultsTraffic from '../../components/RoundResultsTraffic';

const SPRITES = {
  coin: '/sprites/coin-pixel.svg',
  cooperate: '/sprites/cooperate-pixel.svg',
  defect: '/sprites/defect-pixel.svg',
};

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

function DecisionBoard({ highlightedCell, pulseTick }) {
  const outcomeClassName = (cellKey) =>
    `${styles.outcomeDiamond} ${styles[`outcome${cellKey}`]} ${highlightedCell === cellKey ? styles.outcomeActive : ''}`;

  return (
    <div className={styles.decisionBoard}>
      <p className={styles.boardLegend}>Matriz de Pagos</p>
      <div className={styles.lightTopLeft} aria-hidden="true" />
      <div className={styles.lightTopRight} aria-hidden="true" />
      <div className={styles.lightMidLeft} aria-hidden="true" />
      <div className={styles.lightMidRight} aria-hidden="true" />

      <div className={styles.matrixDiamond}>
        <div
          key={`CC-${pulseTick}`}
          className={outcomeClassName('CC')}
          aria-label="Resultado C-C: 3 y 3"
        >
          <div className={styles.outcomeTopHalf} />
          <div className={styles.outcomeBottomHalf} />
          <strong>3 | 3</strong>
        </div>

        <div
          key={`TC-${pulseTick}`}
          className={outcomeClassName('TC')}
          aria-label="Resultado T-C: 5 y 0"
        >
          <div className={styles.outcomeTopHalf} />
          <div className={styles.outcomeBottomHalf} />
          <strong>5 | 0</strong>
        </div>

        <div
          key={`CT-${pulseTick}`}
          className={outcomeClassName('CT')}
          aria-label="Resultado C-T: 0 y 5"
        >
          <div className={styles.outcomeTopHalf} />
          <div className={styles.outcomeBottomHalf} />
          <strong>0 | 5</strong>
        </div>

        <div
          key={`TT-${pulseTick}`}
          className={outcomeClassName('TT')}
          aria-label="Resultado T-T: 1 y 1"
        >
          <div className={styles.outcomeTopHalf} />
          <div className={styles.outcomeBottomHalf} />
          <strong>1 | 1</strong>
        </div>
      </div>
    </div>
  );
}

function ActorCard({ name, score, badge, side, actionLabel, secondaryLabel }) {
  const actionToneClass = (label) => {
    if (label === 'C') return styles.signCooperate;
    if (label === 'D') return styles.signDefect;
    return styles.signIdle;
  };

  const isDefectSelected = actionLabel === 'D';
  const topSignLabel = isDefectSelected ? secondaryLabel : actionLabel;
  const bottomSignLabel = isDefectSelected ? actionLabel : secondaryLabel;

  const topSignTone = actionToneClass(topSignLabel);
  const bottomSignTone = actionToneClass(bottomSignLabel);

  const sceneOrientation = side === 'player' ? styles.sceneLeft : styles.sceneRight;
  const scenePose = isDefectSelected ? styles.sceneDefect : styles.sceneCooperate;

  return (
    <div className={`${styles.actorCard} ${side === 'player' ? styles.playerSide : styles.agentSide}`}>
      <div className={`${styles.actorScene} ${sceneOrientation} ${scenePose}`}>
        <div className={styles.sceneTopScore}>
          <img className={styles.coinSprite} src={SPRITES.coin} alt="" aria-hidden="true" />
          <span>{score}</span>
        </div>

        <div className={styles.humanoid} aria-hidden="true">
          <div className={styles.hHead} />
          <div className={styles.hTorso} />
          <div className={styles.hArmUp} />
          <div className={styles.hArmDown} />
          <div className={styles.hLegLeft} />
          <div className={styles.hLegRight} />
        </div>

        <div className={styles.handMountUp} aria-hidden="true">
          <div className={`${styles.actionSign} ${styles.signTop} ${topSignTone}`}>{topSignLabel}</div>
        </div>

        <div className={styles.handMountDown} aria-hidden="true">
          <div className={`${styles.actionSign} ${styles.signBottom} ${bottomSignTone}`}>{bottomSignLabel}</div>
        </div>
      </div>

      <div className={styles.actorMeta}>
        <p className={styles.actorBadge}>{badge}</p>
        <h3>{name}</h3>
      </div>
    </div>
  );
}

function Game() {
  const { state, dispatch } = useGameState();
  const [strategies, setStrategies] = useState([]);
  const [loadingStrategies, setLoadingStrategies] = useState(true);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [isResolvingRound, setIsResolvingRound] = useState(false);
  const roundTimeoutRef = useRef(null);

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

  const highlightedCell = useMemo(() => {
    if (!lastRound) return '';
    const playerChoice = lastRound.player_action === 'cooperate' ? 'C' : 'T';
    const agentChoice = lastRound.agent_action === 'cooperate' ? 'C' : 'T';
    return `${playerChoice}${agentChoice}`;
  }, [lastRound]);

  const playerActionLabel = useMemo(() => {
    if (isResolvingRound && selectedAction) return getActionLabel(selectedAction);
    if (lastRound?.player_action) return getActionLabel(lastRound.player_action);
    return '-';
  }, [isResolvingRound, selectedAction, lastRound]);

  const playerAlternativeLabel = useMemo(
    () => getAlternativeLabel(playerActionLabel),
    [playerActionLabel]
  );

  const agentActionLabel = useMemo(() => {
    if (isResolvingRound) return '?';
    if (lastRound?.agent_action) return getActionLabel(lastRound.agent_action);
    return '-';
  }, [isResolvingRound, lastRound]);

  const agentAlternativeLabel = useMemo(
    () => getAlternativeLabel(agentActionLabel),
    [agentActionLabel]
  );

  const startGame = () => {
    if (!form.playerName.trim() || !selectedStrategy) return;
    setSaved(false);
    setSelectedAction('');
    setIsResolvingRound(false);

    if (roundTimeoutRef.current) {
      clearTimeout(roundTimeoutRef.current);
      roundTimeoutRef.current = null;
    }

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
    if (!state.strategySlug || isResolvingRound) return;
    setSelectedAction(playerAction);
    setIsResolvingRound(true);

    const { action, noiseApplied } = getAgentActionWithMeta(
      state.strategySlug,
      state.history,
      state.noiseEnabled ? 0.1 : 0
    );

    roundTimeoutRef.current = setTimeout(() => {
      dispatch({
        type: 'PLAY_ROUND',
        payload: {
          playerAction,
          agentAction: action,
          noiseApplied,
        },
      });
      setIsResolvingRound(false);
      roundTimeoutRef.current = null;
    }, 320);
  };

  useEffect(() => {
    if (state.screen !== 'playing') {
      setIsResolvingRound(false);
    }
  }, [state.screen]);

  useEffect(() => {
    return () => {
      if (roundTimeoutRef.current) {
        clearTimeout(roundTimeoutRef.current);
      }
    };
  }, []);

  if (state.screen === 'config') {
    return (
      <section className={`${styles.page} ${styles.pageConfig}`}>
        <div className={styles.hudPanel}>
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
        </div>

        {loadingStrategies && <p>Cargando estrategias...</p>}

        <div className={styles.gameFrame}>
          <div className={styles.gameArena}>
            <ActorCard
              name={form.playerName || 'Jugador'}
              score={0}
              badge="TU"
              side="player"
              actionLabel={playerActionLabel}
              secondaryLabel={playerAlternativeLabel}
            />
            <DecisionBoard highlightedCell={highlightedCell} pulseTick={state.currentRound} />
            <ActorCard
              name={selectedStrategy ? selectedStrategy.name : 'Agente'}
              score={0}
              badge="CPU"
              side="agent"
              actionLabel={agentActionLabel}
              secondaryLabel={agentAlternativeLabel}
            />
          </div>
        </div>
      </section>
    );
  }

  if (state.screen === 'playing') {
    return (
      <section className={`${styles.page} ${styles.pagePlaying}`}>
        <div className={styles.hudPanel}>
          <header className={styles.hero}>
            <h1 className={styles.title}>PARTIDA EN CURSO</h1>
            <p className={styles.progress}>Ronda {state.currentRound + 1} de {state.totalRounds}</p>
          </header>

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
            <button
              className={`${styles.cooperate} ${selectedAction === 'cooperate' ? styles.selectedCooperate : ''} ${isResolvingRound ? styles.lockedAction : ''}`}
              onClick={() => playRound('cooperate')}
              type="button"
              aria-pressed={selectedAction === 'cooperate'}
              disabled={isResolvingRound}
            >
              C · COOPERAR
            </button>
            <button
              className={`${styles.defect} ${selectedAction === 'defect' ? styles.selectedDefect : ''} ${isResolvingRound ? styles.lockedAction : ''}`}
              onClick={() => playRound('defect')}
              type="button"
              aria-pressed={selectedAction === 'defect'}
              disabled={isResolvingRound}
            >
              T · TRAICIONAR
            </button>
          </div>
        </div>

        <div className={styles.gameFrame}>
          <div className={styles.gameArena}>
            <ActorCard
              name={state.playerName}
              score={state.playerScore}
              badge="TU"
              side="player"
              actionLabel={playerActionLabel}
              secondaryLabel={playerAlternativeLabel}
            />
            <DecisionBoard highlightedCell={highlightedCell} pulseTick={state.currentRound} />
            <ActorCard
              name={startedStrategy ? startedStrategy.name : 'Agente'}
              score={state.agentScore}
              badge="CPU"
              side="agent"
              actionLabel={agentActionLabel}
              secondaryLabel={agentAlternativeLabel}
            />
          </div>
        </div>

        <RoundResultsTraffic history={state.history} />
      </section>
    );
  }

  return (
    <section className={`${styles.page} ${styles.pageResult}`}>
      <header className={styles.hero}>
        <h1 className={styles.title}>RESULTADO FINAL</h1>
      </header>

      <div className={styles.gameFrame}>
        <div className={styles.gameArena}>
          <ActorCard
            name={state.playerName}
            score={state.playerScore}
            badge="TU"
            side="player"
            actionLabel={playerActionLabel}
            secondaryLabel={playerAlternativeLabel}
          />
          <DecisionBoard highlightedCell={highlightedCell} pulseTick={state.currentRound} />
          <ActorCard
            name={startedStrategy ? startedStrategy.name : 'Agente'}
            score={state.agentScore}
            badge="CPU"
            side="agent"
            actionLabel={agentActionLabel}
            secondaryLabel={agentAlternativeLabel}
          />
        </div>
      </div>
      <p>
        {state.playerName}: {state.playerScore} - Agente: {state.agentScore}
      </p>
      <p>{describeStrategy(state.strategySlug)}</p>
      {saveError && <p className={styles.error}>{saveError}</p>}

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
