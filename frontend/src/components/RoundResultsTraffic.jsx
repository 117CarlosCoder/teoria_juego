import styles from './RoundResultsTraffic.module.css';

const SPRITES = {
  coin: '/sprites/coin-pixel.svg',
};

function RoundResultsTraffic({ history }) {
  const getCircleColor = (action) => {
    return action === 'cooperate' ? '#4ade80' : '#ef4444'; // green for cooperate, red for defect
  };

  const playerTotal = history.reduce((sum, round) => sum + round.player_payoff, 0);
  const agentTotal = history.reduce((sum, round) => sum + round.agent_payoff, 0);

  return (
    <div className={styles.trafficContainer}>
      {/* Semáforo del jugador - Celeste */}
      <div className={styles.trafficLightPlayer}>
        <div className={styles.circlesRow}>
          {history.map((round) => (
            <div
              key={`player-${round.round_num}`}
              className={styles.circle}
              style={{ backgroundColor: getCircleColor(round.player_action) }}
              title={`Ronda ${round.round_num}: ${round.player_action === 'cooperate' ? 'Cooperaste' : 'Traicionaste'} - Pago: ${round.player_payoff}`}
            />
          ))}
          <div className={styles.total}>
            <img src={SPRITES.coin} alt="moneda" className={styles.coinIcon} />
            {playerTotal}
          </div>
        </div>
      </div>

      {/* Semáforo del agente - Rosa */}
      <div className={styles.trafficLightAgent}>
        <div className={styles.circlesRow}>
          {history.map((round) => (
            <div
              key={`agent-${round.round_num}`}
              className={styles.circle}
              style={{ backgroundColor: getCircleColor(round.agent_action) }}
              title={`Ronda ${round.round_num}: Agente ${round.agent_action === 'cooperate' ? 'cooperó' : 'traicionó'} - Pago: ${round.agent_payoff}`}
            />
          ))}
          <div className={styles.total}>
            <img src={SPRITES.coin} alt="moneda" className={styles.coinIcon} />
            {agentTotal}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoundResultsTraffic;
