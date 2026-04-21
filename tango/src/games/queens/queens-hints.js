/**
 * Queens Hint Engine — Logic-based deduction for the hint button.
 *
 * Produces hints by analyzing the board state WITHOUT peeking at the solution
 * (except as a last resort). Matches LinkedIn's hint UX:
 *
 *  1. Error hints:  "This queen conflicts. Remove it."
 *  2. Elimination:  "The ♛ blocks these cells. Eliminate them."
 *  3. Forced queen: "Only one cell left in this row/col/region. Place a ♛."
 *
 * @module games/queens/queens-hints
 */

import { CELL, findQueens, findAllErrors, getRegionCells, inBounds } from './queens-logic.js';

// ─── Main Entry Point ────────────────────────────────────────────────────────

/**
 * Compute a hint for the current board state.
 *
 * @param {Array<Array<any>>} board - Current board state
 * @param {number[][]} regionMap - Region ID grid
 * @param {{r:number,c:number}[]} solution - Known solution queen positions
 * @returns {{
 *   type: 'error'|'elimination'|'forced'|'solution',
 *   message: string,
 *   highlightCells: string[],   // "r,c" keys — cells to highlight (blue glow)
 *   stripeCells: string[],      // "r,c" keys — cells to stripe (elimination zone)
 *   actions: {r:number, c:number, value:string|null}[], // Auto-apply actions
 * }|null}
 */
export function getHint(board, regionMap, solution) {
  const size = board.length;

  // Priority 1: Check for errors
  const errorHint = checkForErrors(board, regionMap);
  if (errorHint) return errorHint;

  // Priority 2: Check for queen eliminations (cells blocked by existing queens)
  const elimHint = checkForEliminations(board, regionMap, size);
  if (elimHint) return elimHint;

  // Priority 3: Check for forced queens (row/col/region with single valid cell)
  const forcedHint = checkForForcedQueens(board, regionMap, size);
  if (forcedHint) return forcedHint;

  // Priority 4: Fallback — use solution to find next best move
  const solutionHint = checkSolutionFallback(board, regionMap, solution, size);
  if (solutionHint) return solutionHint;

  return null;
}

// ─── Hint Type 1: Error Detection ────────────────────────────────────────────

function checkForErrors(board, regionMap) {
  const errors = findAllErrors(board, regionMap);
  if (errors.cells.size === 0) return null;

  const errorKeys = [...errors.cells];
  // Find the first error queen
  const [r, c] = errorKeys[0].split(',').map(Number);

  return {
    type: 'error',
    message: `This ♛ has a conflict. Remove the highlighted queen.`,
    highlightCells: [errorKeys[0]],
    stripeCells: [],
    actions: [{ r, c, value: null }],
  };
}

// ─── Hint Type 2: Elimination by Queen ───────────────────────────────────────

function checkForEliminations(board, regionMap, size) {
  const queens = findQueens(board);
  if (queens.length === 0) return null;

  for (const queen of queens) {
    const blocked = getBlockedCells(queen, board, regionMap, size);
    // Filter to cells that are currently empty (not yet marked)
    const unmarked = blocked.filter(
      ({ r, c }) => board[r][c] === null
    );

    if (unmarked.length > 0) {
      const stripeCells = unmarked.map(({ r, c }) => `${r},${c}`);
      const actions = unmarked.map(({ r, c }) => ({ r, c, value: CELL.MARKER }));

      return {
        type: 'elimination',
        message: `The ♛ blocks cells in the same row, column, region, or adjacent spots.\n\nEliminate the striped cells.`,
        highlightCells: [`${queen.r},${queen.c}`],
        stripeCells,
        actions,
      };
    }
  }

  return null;
}

/**
 * Get all cells blocked by a queen (same row, col, region, adjacent).
 */
function getBlockedCells(queen, board, regionMap, size) {
  const blocked = [];
  const queenRegion = regionMap[queen.r][queen.c];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (r === queen.r && c === queen.c) continue;
      if (board[r][c] === CELL.QUEEN) continue; // Don't block other queens

      const sameRow = r === queen.r;
      const sameCol = c === queen.c;
      const sameRegion = regionMap[r][c] === queenRegion;
      const adjacent = Math.abs(r - queen.r) <= 1 && Math.abs(c - queen.c) <= 1;

      if (sameRow || sameCol || sameRegion || adjacent) {
        blocked.push({ r, c });
      }
    }
  }

  return blocked;
}

// ─── Hint Type 3: Forced Queen ───────────────────────────────────────────────

function checkForForcedQueens(board, regionMap, size) {
  // Compute all blocked cells for all queens
  const queens = findQueens(board);
  const blockedSet = new Set();
  for (const q of queens) {
    const blocked = getBlockedCells(q, board, regionMap, size);
    for (const { r, c } of blocked) {
      blockedSet.add(`${r},${c}`);
    }
  }

  // Check rows
  for (let r = 0; r < size; r++) {
    // Skip rows that already have a queen
    const hasQueen = findQueens(board).some(q => q.r === r);
    if (hasQueen) continue;

    const validCells = [];
    for (let c = 0; c < size; c++) {
      if (board[r][c] === null && !blockedSet.has(`${r},${c}`)) {
        validCells.push({ r, c });
      }
    }

    if (validCells.length === 1) {
      const cell = validCells[0];
      return {
        type: 'forced',
        message: `All other cells in row ${r + 1} are eliminated.\n\nPlace a ♛ in the highlighted cell.`,
        highlightCells: [`${cell.r},${cell.c}`],
        stripeCells: [],
        actions: [{ r: cell.r, c: cell.c, value: CELL.QUEEN }],
      };
    }
  }

  // Check columns
  for (let c = 0; c < size; c++) {
    const hasQueen = findQueens(board).some(q => q.c === c);
    if (hasQueen) continue;

    const validCells = [];
    for (let r = 0; r < size; r++) {
      if (board[r][c] === null && !blockedSet.has(`${r},${c}`)) {
        validCells.push({ r, c });
      }
    }

    if (validCells.length === 1) {
      const cell = validCells[0];
      return {
        type: 'forced',
        message: `All other cells in column ${c + 1} are eliminated.\n\nPlace a ♛ in the highlighted cell.`,
        highlightCells: [`${cell.r},${cell.c}`],
        stripeCells: [],
        actions: [{ r: cell.r, c: cell.c, value: CELL.QUEEN }],
      };
    }
  }

  // Check regions
  const regionCellsMap = getRegionCells(regionMap);
  for (const [regionId, cells] of regionCellsMap) {
    const hasQueen = cells.some(({ r, c }) => board[r][c] === CELL.QUEEN);
    if (hasQueen) continue;

    const validCells = cells.filter(
      ({ r, c }) => board[r][c] === null && !blockedSet.has(`${r},${c}`)
    );

    if (validCells.length === 1) {
      const cell = validCells[0];
      return {
        type: 'forced',
        message: `All other cells in this region are eliminated.\n\nPlace a ♛ in the highlighted cell.`,
        highlightCells: [`${cell.r},${cell.c}`],
        stripeCells: [],
        actions: [{ r: cell.r, c: cell.c, value: CELL.QUEEN }],
      };
    }
  }

  return null;
}

// ─── Hint Type 4: Solution Fallback ──────────────────────────────────────────

function checkSolutionFallback(board, regionMap, solution, size) {
  if (!solution || solution.length === 0) return null;

  // Find the first solution queen that isn't placed yet
  for (const sq of solution) {
    if (board[sq.r][sq.c] !== CELL.QUEEN) {
      // Find which row/col/region this belongs to for context
      return {
        type: 'solution',
        message: `Try looking at row ${sq.r + 1}, column ${sq.c + 1}.\n\nConsider placing a ♛ there.`,
        highlightCells: [`${sq.r},${sq.c}`],
        stripeCells: [],
        actions: [{ r: sq.r, c: sq.c, value: CELL.QUEEN }],
      };
    }
  }

  return null;
}
