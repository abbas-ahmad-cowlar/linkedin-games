/**
 * Streak tracking module — consecutive day tracking per game.
 * @module shared/streak
 */

import * as storage from './storage.js';

/**
 * Get streak data for a game.
 * @param {string} gameId - e.g. 'tango'
 * @returns {{ current: number, best: number, lastPlayDate: string|null, frozen: boolean }}
 */
export function getStreak(gameId) {
  return storage.get(`${gameId}_streak`, {
    current: 0,
    best: 0,
    lastPlayDate: null,
    frozen: false,
  });
}

/**
 * Record a win for today, updating the streak.
 * @param {string} gameId
 * @returns {{ current: number, best: number }}
 */
export function recordWin(gameId) {
  const today = storage.getToday();
  const yesterday = storage.getYesterday();
  const streak = getStreak(gameId);

  // Already played today — no double-count
  if (streak.lastPlayDate === today) {
    return { current: streak.current, best: streak.best };
  }

  // Consecutive day?
  if (streak.lastPlayDate === yesterday || streak.current === 0) {
    streak.current += 1;
  } else if (streak.frozen) {
    // Freeze absorbs one missed day
    streak.frozen = false;
    streak.current += 1;
  } else {
    streak.current = 1; // Reset
  }

  streak.best = Math.max(streak.best, streak.current);
  streak.lastPlayDate = today;

  storage.set(`${gameId}_streak`, streak);
  return { current: streak.current, best: streak.best };
}

/**
 * Check if today's puzzle is already completed.
 * @param {string} gameId
 * @returns {boolean}
 */
export function isCompletedToday(gameId) {
  const daily = storage.get(`${gameId}_daily`);
  if (!daily) return false;
  return daily.date === storage.getToday() && daily.completed === true;
}

/**
 * Toggle streak freeze.
 * @param {string} gameId
 * @returns {boolean} New frozen state
 */
export function toggleFreeze(gameId) {
  const streak = getStreak(gameId);
  streak.frozen = !streak.frozen;
  storage.set(`${gameId}_streak`, streak);
  return streak.frozen;
}
