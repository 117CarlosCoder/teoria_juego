import { useEffect, useState } from 'react';
import api from '../../api';
import styles from './GameHistory.module.css';

function MiniTraffic({ gameId }) {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRounds() {
      try {
        const { data } = await api.get(`/api/games/${gameId}`);
        setRounds(data);
      } catch (err) {
        console.error('Error fetching rounds:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRounds();
  }, [gameId]);

  const getColor = (action) => {
    return action === 'cooperate' ? '#4ade80' : '#ef4444';
  };

  if (loading) {
    return <div className={styles.miniTrafficLoading}>...</div>;
  }

  return (
    <div className={styles.miniTraffic}>
      <div className={styles.miniTrafficLabel}>Tu:</div>
      <div className={styles.miniCircles}>
        {rounds.map((round) => (
          <div
            key={`player-${round.round_num}`}
            className={styles.miniCircle}
            style={{ backgroundColor: getColor(round.player_action) }}
            title={`R${round.round_num}`}
          />
        ))}
      </div>
      <div className={styles.miniTrafficLabel}>CPU:</div>
      <div className={styles.miniCircles}>
        {rounds.map((round) => (
          <div
            key={`agent-${round.round_num}`}
            className={styles.miniCircle}
            style={{ backgroundColor: getColor(round.agent_action) }}
            title={`R${round.round_num}`}
          />
        ))}
      </div>
    </div>
  );
}

function GameHistory() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchGames() {
      try {
        setLoading(true);
        const { data } = await api.get('/api/games');
        setGames(data);
      } catch (err) {
        setError('No se pudo cargar el historial de partidas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, []);

  const getResultBadge = (result) => {
    switch (result) {
      case 'win':
        return { label: '🏆 GANASTE', color: '#4ade80' };
      case 'lose':
        return { label: '❌ PERDISTE', color: '#ef4444' };
      case 'draw':
        return { label: '🤝 EMPATE', color: '#fbbf24' };
      default:
        return { label: '-', color: '#6b7280' };
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h1>Historial de Partidas</h1>
        <p>Todas las partidas jugadas registradas en la base de datos</p>
      </header>

      {loading && (
        <div className={styles.loadingContainer}>
          <p className={styles.loadingText}>Cargando historial...</p>
        </div>
      )}

      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>{error}</p>
        </div>
      )}

      {!loading && !error && games.length === 0 && (
        <div className={styles.emptyContainer}>
          <p className={styles.emptyText}>Aún no hay partidas registradas.</p>
          <p>¡Juega tu primera partida para aparecer en el historial!</p>
        </div>
      )}

      {!loading && !error && games.length > 0 && (
        <>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📊</div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Total de Partidas</p>
                <p className={styles.statValue}>{games.length}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🏆</div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Partidas Ganadas</p>
                <p className={styles.statValue}>{games.filter((g) => g.result === 'win').length}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📈</div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Tasa de Victoria</p>
                <p className={styles.statValue}>
                  {Math.round((games.filter((g) => g.result === 'win').length / games.length) * 100)}%
                </p>
              </div>
            </div>
          </div>

          <div className={styles.gamesList}>
            {games.map((game) => {
              const resultBadge = getResultBadge(game.result);
              return (
                <div key={game.id} className={`${styles.gameCard} ${styles[`result${game.result}`]}`}>
                  <div className={styles.gameHeader}>
                    <div className={styles.playerSection}>
                      <h3 className={styles.playerName}>{game.player_name}</h3>
                      <p className={styles.strategyName}>{game.strategy_name}</p>
                    </div>
                    <div className={styles.resultSection}>
                      <span
                        className={styles.resultBadge}
                        style={{ backgroundColor: resultBadge.color }}
                      >
                        {resultBadge.label}
                      </span>
                    </div>
                  </div>

                  <div className={styles.gameBody}>
                    <MiniTraffic gameId={game.id} />
                  </div>

                  <div className={styles.gameFooter}>
                    <div className={styles.statBox}>
                      <span className={styles.statBoxLabel}>Tu Puntuación</span>
                      <span className={styles.statBoxValue}>{game.player_score}</span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statBoxLabel}>CPU</span>
                      <span className={styles.statBoxValue}>{game.agent_score}</span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statBoxLabel}>Rondas</span>
                      <span className={styles.statBoxValue}>{game.total_rounds}</span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statBoxLabel}>Ruido</span>
                      <span className={styles.statBoxValue}>{game.noise_enabled ? '✓' : '✗'}</span>
                    </div>
                  </div>

                  <div className={styles.gameDate}>
                    {formatDate(game.played_at)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

export default GameHistory;
