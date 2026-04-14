import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { getAgentAction } from '../Game/GameEngine';
import styles from './Strategies.module.css';

const probePlayerPattern = [
  'cooperate',
  'cooperate',
  'defect',
  'cooperate',
  'defect',
  'defect',
  'cooperate',
  'cooperate',
];

function buildPreview(strategySlug) {
  const history = [];

  for (const playerAction of probePlayerPattern) {
    const agentAction = getAgentAction(strategySlug, history, 0);
    history.push({
      playerAction,
      agentAction,
      playerPayoff: 0,
      agentPayoff: 0,
      noiseApplied: false,
    });
  }

  return history;
}

function badge(value) {
  return value ? '✓' : '✗';
}

function Strategies() {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStrategies() {
      try {
        setLoading(true);
        const { data } = await api.get('/api/strategies');
        setStrategies(data);
      } catch (err) {
        setError('No se pudo cargar la lista de estrategias.');
      } finally {
        setLoading(false);
      }
    }

    fetchStrategies();
  }, []);

  const previews = useMemo(() => {
    const map = new Map();
    strategies.forEach((strategy) => {
      map.set(strategy.slug, buildPreview(strategy.slug));
    });
    return map;
  }, [strategies]);

  return (
    <section className={styles.page}>
      <h1>Estrategias Clasicas</h1>

      {loading && <p>Cargando estrategias...</p>}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.grid}>
        {strategies.map((strategy) => {
          const isOpen = expanded === strategy.slug;
          return (
            <article
              key={strategy.id}
              className={styles.card}
              onClick={() => setExpanded(isOpen ? null : strategy.slug)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter') setExpanded(isOpen ? null : strategy.slug);
              }}
            >
              <h3>{strategy.name}</h3>
              <p>{strategy.description}</p>

              <div className={styles.badges}>
                <span>Bondad {badge(strategy.is_nice)}</span>
                <span>Indulgencia {badge(strategy.is_forgiving)}</span>
                <span>Reactividad {badge(strategy.is_retaliating)}</span>
                <span>Claridad {badge(strategy.is_clear)}</span>
              </div>

              {isOpen && (
                <div className={styles.preview}>
                  <h4>Primeras 8 jugadas (simulacion local)</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Ronda</th>
                        <th>Jugador</th>
                        <th>Agente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previews.get(strategy.slug)?.map((round, index) => (
                        <tr key={`${strategy.slug}-${index + 1}`}>
                          <td>{index + 1}</td>
                          <td>{round.playerAction === 'cooperate' ? '🤝' : '🗡'}</td>
                          <td>{round.agentAction === 'cooperate' ? '🤝' : '🗡'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <button className={styles.nextButton} onClick={() => navigate('/tournament')} type="button">
        Ver torneo →
      </button>
    </section>
  );
}

export default Strategies;
