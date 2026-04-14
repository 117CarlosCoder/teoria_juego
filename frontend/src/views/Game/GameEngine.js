export const PAYOFF_MATRIX = {
  CC: { player: 3, agent: 3 },
  CD: { player: 0, agent: 5 },
  DC: { player: 5, agent: 0 },
  DD: { player: 1, agent: 1 },
};

function computeAction(strategy, history) {
  if (strategy === 'tit_for_tat') {
    if (history.length === 0) return 'cooperate';
    return history[history.length - 1].playerAction;
  }

  if (strategy === 'grim') {
    const playerBetrayed = history.some((round) => round.playerAction === 'defect');
    return playerBetrayed ? 'defect' : 'cooperate';
  }

  if (strategy === 'joss') {
    if (history.length === 0) return 'cooperate';
    const lastPlayerAction = history[history.length - 1].playerAction;
    if (lastPlayerAction === 'cooperate' && Math.random() < 0.1) {
      return 'defect';
    }
    return lastPlayerAction;
  }

  if (strategy === 'random') {
    return Math.random() < 0.5 ? 'cooperate' : 'defect';
  }

  if (strategy === 'tit_for_two_tats') {
    if (history.length < 2) return 'cooperate';
    const recent = history.slice(-2);
    const twoDefections = recent.every((round) => round.playerAction === 'defect');
    return twoDefections ? 'defect' : 'cooperate';
  }

  return 'cooperate';
}

export function getAgentAction(strategy, history, noiseRate = 0) {
  let intended = computeAction(strategy, history);
  if (noiseRate > 0 && Math.random() < noiseRate) {
    intended = intended === 'cooperate' ? 'defect' : 'cooperate';
  }
  return intended;
}

export function getAgentActionWithMeta(strategy, history, noiseRate = 0) {
  const planned = computeAction(strategy, history);
  const actual = getAgentAction(strategy, history, noiseRate);
  return {
    action: actual,
    noiseApplied: planned !== actual,
  };
}

export function getRoundPayoff(playerAction, agentAction) {
  const key = `${playerAction === 'cooperate' ? 'C' : 'D'}${agentAction === 'cooperate' ? 'C' : 'D'}`;
  return PAYOFF_MATRIX[key];
}

export function describeStrategy(slug) {
  const descriptions = {
    tit_for_tat: 'Responde espejo: coopera primero y luego imita tu jugada anterior.',
    grim: 'Perdona cero: tras una traicion, castiga para siempre.',
    joss: 'Casi espejo, pero a veces traiciona aunque coopere el rival.',
    random: 'No tiene patron estable; mezcla cooperacion y traicion al azar.',
    tit_for_two_tats: 'Tolera errores aislados y solo castiga dos traiciones seguidas.',
  };

  return descriptions[slug] || 'Estrategia no identificada.';
}
