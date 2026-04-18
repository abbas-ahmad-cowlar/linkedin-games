/**
 * Tango Puzzle Generator — Produces valid, uniquely-solvable puzzles.
 *
 * Algorithm:
 *   1. Generate a random complete valid board (backtracking with random ordering)
 *   2. Select random constraint signs from adjacent pairs
 *   3. Iteratively remove cells while maintaining unique solvability
 *
 * @module games/tango/tango-generator
 */

import {
  SIZE,
  SYM,
  CONSTRAINT,
  createBoard,
  cloneBoard,
  isValidPlacement,
} from './tango-logic.js';
import { hasUniqueSolution } from './tango-solver.js';
import { shuffle, randInt } from '../../shared/rng.js';

// ─── Difficulty Config ───────────────────────────────────────────────────────

const DIFFICULTY = Object.freeze({
  easy: { keepMin: 12, keepMax: 16, constraintMin: 4, constraintMax: 6 },
  medium: { keepMin: 8, keepMax: 11, constraintMin: 3, constraintMax: 5 },
  hard: { keepMin: 4, keepMax: 7, constraintMin: 2, constraintMax: 4 },
});

// ─── Solution Generator ─────────────────────────────────────────────────────

/**
 * Generate a random complete valid Tango board.
 * Uses backtracking with randomized symbol order.
 *
 * @param {function(): number} rng - Seeded PRNG
 * @returns {Array<Array<string>>} Complete valid 6×6 board
 */
export function generateCompleteSolution(rng) {
  const board = createBoard();

  function fill() {
    // Find first empty cell (left-to-right, top-to-bottom)
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] !== null) continue;

        // Randomize symbol order
        const symbols =
          rng() < 0.5
            ? [SYM.SUN, SYM.MOON]
            : [SYM.MOON, SYM.SUN];

        for (const sym of symbols) {
          if (isValidPlacement(board, r, c, sym, []).valid) {
            board[r][c] = sym;
            if (fill()) return true;
            board[r][c] = null;
          }
        }
        return false; // Dead end, backtrack
      }
    }
    return true; // All cells filled
  }

  fill();
  return board;
}

// ─── Adjacent Pairs ──────────────────────────────────────────────────────────

/**
 * Enumerate all horizontally and vertically adjacent cell pairs.
 * @returns {Array<{ r1: number, c1: number, r2: number, c2: number }>}
 */
export function getAdjacentPairs() {
  const pairs = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (c < SIZE - 1) pairs.push({ r1: r, c1: c, r2: r, c2: c + 1 }); // horizontal
      if (r < SIZE - 1) pairs.push({ r1: r, c1: c, r2: r + 1, c2: c }); // vertical
    }
  }
  return pairs;
}

// ─── Puzzle Generator ────────────────────────────────────────────────────────

/**
 * Generate a Tango puzzle with guaranteed unique solution.
 *
 * @param {'easy'|'medium'|'hard'} difficulty
 * @param {function(): number} rng - Seeded PRNG
 * @returns {{
 *   puzzle: Array<Array<string|null>>,
 *   constraints: Array<{ r1: number, c1: number, r2: number, c2: number, type: string }>,
 *   solution: Array<Array<string>>,
 *   difficulty: string
 * }}
 */
export function generatePuzzle(difficulty, rng) {
  const config = DIFFICULTY[difficulty];
  if (!config) throw new Error(`Unknown difficulty: ${difficulty}`);

  // Step 1: Generate complete solution
  const solution = generateCompleteSolution(rng);

  // Step 2: Generate constraint signs
  const allPairs = getAdjacentPairs();
  shuffle(allPairs, rng);
  const numConstraints = randInt(config.constraintMin, config.constraintMax, rng);
  const constraints = allPairs.slice(0, numConstraints).map((pair) => ({
    ...pair,
    type:
      solution[pair.r1][pair.c1] === solution[pair.r2][pair.c2]
        ? CONSTRAINT.SAME
        : CONSTRAINT.DIFF,
  }));

  // Step 3: Remove cells to create puzzle
  const puzzle = cloneBoard(solution);
  const allCells = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      allCells.push({ r, c });
    }
  }
  shuffle(allCells, rng);

  const targetKeep = randInt(config.keepMin, config.keepMax, rng);
  let currentFilled = SIZE * SIZE; // 36

  for (const { r, c } of allCells) {
    if (currentFilled <= targetKeep) break;

    const saved = puzzle[r][c];
    puzzle[r][c] = null;

    if (hasUniqueSolution(puzzle, constraints)) {
      currentFilled--;
    } else {
      puzzle[r][c] = saved; // Restore — removal creates ambiguity
    }
  }

  return { puzzle, constraints, solution, difficulty };
}
