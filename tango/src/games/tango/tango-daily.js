/**
 * Tango Daily Puzzle Pipeline — Date → Seed → Difficulty → Puzzle.
 *
 * Days 1–20: Load from JSON bank (hand-crafted guaranteed quality).
 * Day 21+:   Generate algorithmically using seeded PRNG.
 *
 * @module games/tango/tango-daily
 */

import { createRNG, dateSeed } from '../../shared/rng.js';
import { generatePuzzle } from './tango-generator.js';
import * as storage from '../../shared/storage.js';

// ─── Day Number ──────────────────────────────────────────────────────────────

/** Epoch: first day of puzzles. Adjust to your launch date. */
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
  const seed = dateSeed(dateStr || storage.getToday(), 'tango_difficulty');
  const difficulties = ['easy', 'medium', 'hard'];
  return difficulties[seed % 3];
}

// ─── JSON Bank ───────────────────────────────────────────────────────────────

let bankCache = null;

/**
 * Load the hand-crafted puzzle bank.
 * @returns {Promise<Array|null>}
 */
async function loadBank() {
  if (bankCache !== null) return bankCache;
  try {
    const resp = await fetch('/data/tango-levels.json');
    if (!resp.ok) return null;
    bankCache = await resp.json();
    return bankCache;
  } catch {
    return null;
  }
}

// ─── Daily Puzzle Orchestrator ───────────────────────────────────────────────

/**
 * Get the daily puzzle for a specific date.
 *
 * @param {string} [dateStr] - YYYY-MM-DD, defaults to today
 * @returns {Promise<{
 *   puzzle: Array, constraints: Array, solution: Array,
 *   difficulty: string, dayNumber: number, isFromBank: boolean
 * }>}
 */
export async function getDailyPuzzle(dateStr) {
  const date = dateStr || storage.getToday();
  const dayNumber = getDayNumber(date);
  const difficulty = getDailyDifficulty(date);

  // Days 1-20: try JSON bank
  if (dayNumber >= 1 && dayNumber <= 20) {
    const bank = await loadBank();
    if (bank && bank[dayNumber - 1]) {
      const entry = bank[dayNumber - 1];
      return {
        puzzle: entry.puzzle,
        constraints: entry.constraints,
        solution: entry.solution,
        difficulty: entry.difficulty || difficulty,
        dayNumber,
        isFromBank: true,
      };
    }
  }

  // Day 21+ or bank unavailable: generate algorithmically
  const seed = dateSeed(date, 'tango');
  const rng = createRNG(seed);
  const generated = generatePuzzle(difficulty, rng);

  return {
    ...generated,
    dayNumber,
    isFromBank: false,
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
    isFromBank: false,
  };
}

// ─── Save / Resume ───────────────────────────────────────────────────────────

const DAILY_KEY = 'tango_daily';

/**
 * Save the current game state.
 * @param {object} gameState
 */
export function saveGameState(gameState) {
  storage.set(DAILY_KEY, {
    date: gameState.date || storage.getToday(),
    board: gameState.board,
    constraints: gameState.constraints,
    solution: gameState.solution,
    difficulty: gameState.difficulty,
    dayNumber: gameState.dayNumber,
    elapsed: gameState.elapsed,
    moveHistory: gameState.moveHistory,
    completed: gameState.completed || false,
    initialPuzzle: gameState.initialPuzzle,
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
