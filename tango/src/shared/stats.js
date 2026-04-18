/**
 * Stats tracking module — Personal bests, averages, improvement tracking.
 * @module shared/stats
 */

import * as storage from './storage.js';

/**
 * Get stats for a game.
 * @param {string} gameId - e.g. 'tango'
 * @returns {object} Stats object
 */
export function getStats(gameId) {
  return storage.get(`${gameId}_stats`, {
    totalSolved: 0,
    bestTimes: { easy: null, medium: null, hard: null },
    recentTimes: [],    // Last 20 solve times: { time, difficulty, date }
    sessionCount: 0,
    sessionTimes: [],   // Current session times
    lastSessionDate: null,
  });
}

/**
 * Record a puzzle solve in endless mode.
 * @param {string} gameId
 * @param {number} time - Seconds
 * @param {string} difficulty - easy/medium/hard
 * @returns {{ stats: object, isPersonalBest: boolean, improvement: number|null }}
 */
export function recordSolve(gameId, time, difficulty) {
  const stats = getStats(gameId);
  const today = storage.getToday();
  const timeFloored = Math.floor(time);

  // Update total
  stats.totalSolved += 1;

  // Check personal best
  const prevBest = stats.bestTimes[difficulty];
  const isPersonalBest = prevBest === null || timeFloored < prevBest;
  if (isPersonalBest) {
    stats.bestTimes[difficulty] = timeFloored;
  }

  // Calculate improvement from last solve at same difficulty
  const lastSameD = [...stats.recentTimes]
    .reverse()
    .find(r => r.difficulty === difficulty);
  let improvement = null;
  if (lastSameD) {
    improvement = Math.round(((lastSameD.time - timeFloored) / lastSameD.time) * 100);
  }

  // Add to recent times (keep last 20)
  stats.recentTimes.push({ time: timeFloored, difficulty, date: today });
  if (stats.recentTimes.length > 20) {
    stats.recentTimes = stats.recentTimes.slice(-20);
  }

  // Session tracking — reset if different day
  if (stats.lastSessionDate !== today) {
    stats.sessionCount = 0;
    stats.sessionTimes = [];
    stats.lastSessionDate = today;
  }
  stats.sessionCount += 1;
  stats.sessionTimes.push(timeFloored);

  storage.set(`${gameId}_stats`, stats);

  return { stats, isPersonalBest, improvement };
}

/**
 * Get the average time for a difficulty from recent solves.
 * @param {string} gameId
 * @param {string} [difficulty] - Filter by difficulty, null for all
 * @returns {number|null} Average in seconds, or null if no data
 */
export function getAverageTime(gameId, difficulty) {
  const stats = getStats(gameId);
  const filtered = difficulty
    ? stats.recentTimes.filter(r => r.difficulty === difficulty)
    : stats.recentTimes;

  if (filtered.length === 0) return null;
  const sum = filtered.reduce((acc, r) => acc + r.time, 0);
  return Math.round(sum / filtered.length);
}

/**
 * Get session stats for today.
 * @param {string} gameId
 * @returns {{ count: number, avgTime: number|null, bestTime: number|null }}
 */
export function getSessionStats(gameId) {
  const stats = getStats(gameId);
  const today = storage.getToday();

  if (stats.lastSessionDate !== today || stats.sessionTimes.length === 0) {
    return { count: 0, avgTime: null, bestTime: null };
  }

  const times = stats.sessionTimes;
  const sum = times.reduce((a, b) => a + b, 0);
  return {
    count: times.length,
    avgTime: Math.round(sum / times.length),
    bestTime: Math.min(...times),
  };
}
