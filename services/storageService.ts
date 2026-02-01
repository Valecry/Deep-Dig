import { GameSession } from '../types';

const HISTORY_KEY = 'gemini_dig_history_v1';

export const saveGameSession = (session: GameSession) => {
  try {
    const existing = getGameHistory();
    const updated = [session, ...existing].slice(0, 100); // Keep last 100
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save history", e);
  }
};

export const getGameHistory = (): GameSession[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const getLeaderboard = (): GameSession[] => {
  const history = getGameHistory();
  // Sort by score desc
  return [...history].sort((a, b) => b.score - a.score).slice(0, 10);
};

// Determine rank based on score relative to history
export const getRank = (score: number): number => {
  const history = getGameHistory();
  const allScores = [...history.map(h => h.score), score].sort((a, b) => b - a);
  return allScores.indexOf(score) + 1;
};