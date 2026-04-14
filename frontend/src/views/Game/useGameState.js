import { useReducer } from 'react';
import { getRoundPayoff } from './GameEngine';

const initialState = {
  screen: 'config',
  playerName: '',
  strategySlug: '',
  strategyId: null,
  totalRounds: 10,
  noiseEnabled: false,
  currentRound: 0,
  playerScore: 0,
  agentScore: 0,
  history: [],
  result: null,
};

function getResult(playerScore, agentScore) {
  if (playerScore > agentScore) return 'win';
  if (playerScore < agentScore) return 'lose';
  return 'draw';
}

function reducer(state, action) {
  switch (action.type) {
    case 'START': {
      return {
        ...initialState,
        screen: 'playing',
        playerName: action.payload.playerName,
        strategySlug: action.payload.strategySlug,
        strategyId: action.payload.strategyId,
        totalRounds: action.payload.totalRounds,
        noiseEnabled: action.payload.noiseEnabled,
      };
    }

    case 'PLAY_ROUND': {
      const roundNum = state.currentRound + 1;
      const payoff = getRoundPayoff(action.payload.playerAction, action.payload.agentAction);

      const nextHistory = [
        ...state.history,
        {
          round_num: roundNum,
          player_action: action.payload.playerAction,
          agent_action: action.payload.agentAction,
          player_payoff: payoff.player,
          agent_payoff: payoff.agent,
          noise_applied: action.payload.noiseApplied,
          playerAction: action.payload.playerAction,
          agentAction: action.payload.agentAction,
          playerPayoff: payoff.player,
          agentPayoff: payoff.agent,
          noiseApplied: action.payload.noiseApplied,
        },
      ];

      const playerScore = state.playerScore + payoff.player;
      const agentScore = state.agentScore + payoff.agent;
      const finished = roundNum >= state.totalRounds;

      return {
        ...state,
        currentRound: roundNum,
        playerScore,
        agentScore,
        history: nextHistory,
        screen: finished ? 'result' : 'playing',
        result: finished ? getResult(playerScore, agentScore) : null,
      };
    }

    case 'END_GAME': {
      return {
        ...state,
        screen: 'result',
        result: getResult(state.playerScore, state.agentScore),
      };
    }

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return { state, dispatch };
}
