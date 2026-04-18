/**
 * Queens Daily Puzzle Pipeline — Date → Seed → Difficulty → Puzzle.
 *
 * All puzzles are generated algorithmically using seeded PRNG.
 *
 * @module games/queens/queens-daily
 */

import { createRNG, dateSeed } from '../../shared/rng.js';
import { generatePuzzle } from './queens-generator.js';
import * as storage from '../../shared/storage.js';

// ─── Day Number ──────────────────────────────────────────────────────────────

/** Epoch: first day of puzzles. */
const EPOCH = '2026-04-18';

/**
 * Get the day number since epoch (1-indexed).
 * @param {string} [dateStr] - YYYY-MM-DD, defaults to today
 * @returns {number}
 */
export function getDayNumber(dateStr) {
  const today = dateStr || storage.getToday();
  const epoch = new Date(EPOCH + 'T00:00:00');
  const current = new Date(today + 'T00:00:00');
  const diffMs = current - epoch;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Get the difficulty for a given date (pseudo-random from seed).
 * @param {string} [dateStr]
 * @returns {'easy'|'medium'|'hard'}
 */
export function getDailyDifficulty(dateStr) {
  const seed = dateSeed(dateStr || storage.getToday(), 'queens_difficulty');
  const difficulties = ['easy', 'medium', 'hard'];
  return difficulties[seed % 3];
}

// ─── Daily Puzzle Orchestrator ───────────────────────────────────────────────

/**
 * Get the daily puzzle for a specific date.
 *
 * @param {string} [dateStr] - YYYY-MM-DD, defaults to today
 * @returns {Promise<{
 *   size: number, regionMap: number[][], solution: {r: number, c: number}[],
 *   difficulty: string, dayNumber: number
 * }>}
 */
export async function getDailyPuzzle(dateStr) {
  const date = dateStr || storage.getToday();
  const dayNumber = getDayNumber(date);
  const difficulty = getDailyDifficulty(date);

  const seed = dateSeed(date, 'queens');
  const rng = createRNG(seed);
  const generated = generatePuzzle(difficulty, rng);

  return {
    ...generated,
    dayNumber,
  };
}

/**
 * Get a non-daily practice puzzle (random seed).
 * @param {'easy'|'medium'|'hard'} [diff] - Override difficulty
 * @returns {object} Puzzle data
 */
export function getPracticePuzzle(diff) {
  const seed = Date.now() ^ (Math.random() * 0xffffffff);
  const rng = createRNG(seed);
  const difficulty = diff || ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)];
  return {
    ...generatePuzzle(difficulty, rng),
    dayNumber: 0,
  };
}

// ─── Save / Resume ───────────────────────────────────────────────────────────

const DAILY_KEY = 'queens_daily';

/**
 * Save the current game state.
 * @param {object} gameState
 */
export function saveGameState(gameState) {
  storage.set(DAILY_KEY, {
    date: gameState.date || storage.getToday(),
    board: gameState.board,
    regionMap: gameState.regionMap,
    solution: gameState.solution,
    size: gameState.size,
    difficulty: gameState.difficulty,
    dayNumber: gameState.dayNumber,
    elapsed: gameState.elapsed,
    moveHistory: gameState.moveHistory,
    completed: gameState.completed || false,
  });
}

/**
 * Load saved game state for today.
 * @returns {object|null} Saved state or null if none/different day
 */
export function loadGameState() {
  const saved = storage.get(DAILY_KEY);
  if (!saved) return null;
  if (saved.date !== storage.getToday()) return null;
  return saved;
}

/**
 * Check if today's puzzle is completed.
 * @returns {boolean}
 */
export function isDailyCompleted() {
  const saved = storage.get(DAILY_KEY);
  if (!saved) return false;
  return saved.date === storage.getToday() && saved.completed === true;
}
