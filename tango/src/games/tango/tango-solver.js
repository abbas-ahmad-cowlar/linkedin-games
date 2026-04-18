/**
 * Tango Solver — Backtracking constraint-propagation solver.
 *
 * Verifies puzzle solvability and uniqueness. Uses MRV (Most Remaining Values)
 * heuristic for efficient search on the 6×6 grid.
 *
 * @module games/tango/tango-solver
 */

import {
  SIZE,
  SYM,
  cloneBoard,
  isValidPlacement,
  checkWin,
} from './tango-logic.js';

/**
 * Find the empty cell with the fewest valid placement options (MRV heuristic).
 * Returns { r, c, count } or { r: -1, c: -1, count: 0 } if dead-end or all filled.
 *
 * @param {Array<Array<string|null>>} board
 * @param {Array} constraints
 * @returns {{ r: number, c: number, count: number }}
 */
function findMRVCell(board, constraints) {
  let bestR = -1;
  let bestC = -1;
  let bestCount = 3; // At most 2 options (sun or moon), so 3 means "not found yet"

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== null) continue;

      let count = 0;
      for (const sym of [SYM.SUN, SYM.MOON]) {
        if (isValidPlacement(board, r, c, sym, constraints).valid) count++;
      }

      if (count === 0) return { r: -1, c: -1, count: 0 }; // Dead end
      if (count < bestCount) {
        bestR = r;
        bestC = c;
        bestCount = count;
        if (count === 1) return { r: bestR, c: bestC, count: 1 }; // Can't beat 1
      }
    }
  }

  return { r: bestR, c: bestC, count: bestCount };
}

/**
 * Solve a Tango puzzle using backtracking with MRV heuristic.
 *
 * @param {Array<Array<string|null>>} board - Board (cloned internally, original not modified)
 * @param {Array} constraints - Constraint list
 * @param {number} [maxSolutions=2] - Stop after finding this many solutions.
 *   Use 2 for uniqueness checking (need to know if >1 solution exists).
 * @returns {Array<Array<Array<string>>>} Array of solution boards
 */
export function solve(board, constraints, maxSolutions = 2) {
  const workBoard = cloneBoard(board);
  const solutions = [];

  function backtrack() {
    if (solutions.length >= maxSolutions) return;

    const { r, c, count } = findMRVCell(workBoard, constraints);

    // All cells filled
    if (r === -1 && count !== 0) {
      if (checkWin(workBoard, constraints)) {
        solutions.push(cloneBoard(workBoard));
      }
      return;
    }

    // Dead end — no valid options for some cell
    if (count === 0) return;

    // Try each symbol
    for (const sym of [SYM.SUN, SYM.MOON]) {
      if (!isValidPlacement(workBoard, r, c, sym, constraints).valid) continue;

      workBoard[r][c] = sym;
      backtrack();
      workBoard[r][c] = null;

      if (solutions.length >= maxSolutions) return;
    }
  }

  backtrack();
  return solutions;
}

/**
 * Check if a puzzle has exactly one solution.
 *
 * @param {Array<Array<string|null>>} board
 * @param {Array} constraints
 * @returns {boolean}
 */
export function hasUniqueSolution(board, constraints) {
  const solutions = solve(board, constraints, 2);
  return solutions.length === 1;
}
