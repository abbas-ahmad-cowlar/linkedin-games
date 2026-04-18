/**
 * Tango Game Logic — Board model, rule validators, and win detection.
 *
 * Tango is a binary logic puzzle on a 6×6 grid.
 * Rules:
 *   1. Balance: Each row/column has exactly 3 suns and 3 moons
 *   2. No-three-in-a-row: Max 2 identical symbols adjacent (H or V)
 *   3. Constraint signs: = (same) and × (different) between cell pairs
 *
 * @module games/tango/tango-logic
 */

// ─── Constants ───────────────────────────────────────────────────────────────

export const SIZE = 6;
export const HALF = SIZE / 2; // 3

export const SYM = Object.freeze({
  SUN: 'sun',
  MOON: 'moon',
});

export const CONSTRAINT = Object.freeze({
  SAME: 'same',
  DIFF: 'different',
});

// ─── Board Utilities ─────────────────────────────────────────────────────────

/**
 * Create an empty 6×6 board (all nulls).
 * @returns {Array<Array<null>>}
 */
export function createBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

/**
 * Deep-clone a board (independent copy).
 * @param {Array<Array<string|null>>} board
 * @returns {Array<Array<string|null>>}
 */
export function cloneBoard(board) {
  return board.map((row) => [...row]);
}

/**
 * Get the opposite symbol.
 * @param {string} symbol - 'sun' or 'moon'
 * @returns {string}
 */
export function opposite(symbol) {
  return symbol === SYM.SUN ? SYM.MOON : SYM.SUN;
}

/**
 * Check if (r, c) is within the grid bounds.
 * @param {number} r - Row
 * @param {number} c - Column
 * @returns {boolean}
 */
export function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

/**
 * Count occurrences of a symbol in a row.
 * @param {Array<Array<string|null>>} board
 * @param {number} row
 * @param {string} symbol
 * @returns {number}
 */
export function countInRow(board, row, symbol) {
  return board[row].filter((s) => s === symbol).length;
}

/**
 * Count occurrences of a symbol in a column.
 * @param {Array<Array<string|null>>} board
 * @param {number} col
 * @param {string} symbol
 * @returns {number}
 */
export function countInCol(board, col, symbol) {
  let count = 0;
  for (let r = 0; r < SIZE; r++) {
    if (board[r][col] === symbol) count++;
  }
  return count;
}

/**
 * Check if the board is fully filled (no nulls).
 * @param {Array<Array<string|null>>} board
 * @returns {boolean}
 */
export function isFilled(board) {
  return board.every((row) => row.every((cell) => cell !== null));
}

/**
 * Pretty-print a board for debugging. S = Sun, M = Moon, . = empty
 * @param {Array<Array<string|null>>} board
 * @returns {string}
 */
export function boardToString(board) {
  return board
    .map((row) =>
      row.map((c) => (c === SYM.SUN ? 'S' : c === SYM.MOON ? 'M' : '.')).join(' ')
    )
    .join('\n');
}

// ─── Rule Validators ─────────────────────────────────────────────────────────

/**
 * Rule 1: Balance — each row/col can have at most HALF (3) of each symbol.
 * @returns {{ valid: boolean, reason?: string }}
 */
export function checkBalance(board, row, col, symbol) {
  if (countInRow(board, row, symbol) >= HALF) {
    return { valid: false, reason: `Row ${row} already has ${HALF} ${symbol}s` };
  }
  if (countInCol(board, col, symbol) >= HALF) {
    return { valid: false, reason: `Col ${col} already has ${HALF} ${symbol}s` };
  }
  return { valid: true };
}

/**
 * Rule 2: No three identical symbols in a row (horizontally or vertically).
 * Checks all possible triplets that include (row, col).
 * @returns {{ valid: boolean, reason?: string }}
 */
export function checkNoThree(board, row, col, symbol) {
  // Horizontal: check 3 possible triplet windows containing this cell
  // [col-2, col-1, col]
  if (
    col >= 2 &&
    board[row][col - 1] === symbol &&
    board[row][col - 2] === symbol
  ) {
    return { valid: false, reason: 'Three in a row horizontally (left pair)' };
  }
  // [col-1, col, col+1]
  if (
    col >= 1 &&
    col < SIZE - 1 &&
    board[row][col - 1] === symbol &&
    board[row][col + 1] === symbol
  ) {
    return { valid: false, reason: 'Three in a row horizontally (center)' };
  }
  // [col, col+1, col+2]
  if (
    col <= SIZE - 3 &&
    board[row][col + 1] === symbol &&
    board[row][col + 2] === symbol
  ) {
    return { valid: false, reason: 'Three in a row horizontally (right pair)' };
  }

  // Vertical: same logic transposed
  if (
    row >= 2 &&
    board[row - 1][col] === symbol &&
    board[row - 2][col] === symbol
  ) {
    return { valid: false, reason: 'Three in a row vertically (top pair)' };
  }
  if (
    row >= 1 &&
    row < SIZE - 1 &&
    board[row - 1][col] === symbol &&
    board[row + 1][col] === symbol
  ) {
    return { valid: false, reason: 'Three in a row vertically (center)' };
  }
  if (
    row <= SIZE - 3 &&
    board[row + 1][col] === symbol &&
    board[row + 2][col] === symbol
  ) {
    return { valid: false, reason: 'Three in a row vertically (bottom pair)' };
  }

  return { valid: true };
}

/**
 * Rule 3: Constraint signs — = (same) and × (different).
 * Only validates against already-placed partner cells.
 * @param {Array} constraints - List of { r1, c1, r2, c2, type }
 * @returns {{ valid: boolean, reason?: string }}
 */
export function checkConstraints(board, row, col, symbol, constraints) {
  for (const c of constraints) {
    let partnerR, partnerC;

    if (c.r1 === row && c.c1 === col) {
      partnerR = c.r2;
      partnerC = c.c2;
    } else if (c.r2 === row && c.c2 === col) {
      partnerR = c.r1;
      partnerC = c.c1;
    } else {
      continue;
    }

    const partner = board[partnerR][partnerC];
    if (partner === null) continue; // Partner not placed yet

    if (c.type === CONSTRAINT.SAME && partner !== symbol) {
      return {
        valid: false,
        reason: `Constraint '=' violated: (${row},${col}) must match (${partnerR},${partnerC})`,
      };
    }
    if (c.type === CONSTRAINT.DIFF && partner === symbol) {
      return {
        valid: false,
        reason: `Constraint '×' violated: (${row},${col}) must differ from (${partnerR},${partnerC})`,
      };
    }
  }
  return { valid: true };
}

/**
 * Combined validator: checks all three rules.
 * @returns {{ valid: boolean, reason?: string }}
 */
export function isValidPlacement(board, row, col, symbol, constraints = []) {
  if (!inBounds(row, col)) return { valid: false, reason: 'Out of bounds' };
  if (board[row][col] !== null)
    return { valid: false, reason: 'Cell already occupied' };

  const balance = checkBalance(board, row, col, symbol);
  if (!balance.valid) return balance;

  const noThree = checkNoThree(board, row, col, symbol);
  if (!noThree.valid) return noThree;

  const constCheck = checkConstraints(board, row, col, symbol, constraints);
  if (!constCheck.valid) return constCheck;

  return { valid: true };
}

/**
 * Check if the entire board is valid and complete (win detection).
 * @param {Array<Array<string|null>>} board
 * @param {Array} constraints
 * @returns {boolean}
 */
export function checkWin(board, constraints = []) {
  if (!isFilled(board)) return false;

  for (let r = 0; r < SIZE; r++) {
    if (countInRow(board, r, SYM.SUN) !== HALF) return false;
    if (countInRow(board, r, SYM.MOON) !== HALF) return false;

    // Check no-three in rows
    for (let c = 0; c <= SIZE - 3; c++) {
      if (board[r][c] === board[r][c + 1] && board[r][c + 1] === board[r][c + 2])
        return false;
    }
  }

  for (let c = 0; c < SIZE; c++) {
    if (countInCol(board, c, SYM.SUN) !== HALF) return false;
    if (countInCol(board, c, SYM.MOON) !== HALF) return false;

    // Check no-three in columns
    for (let r = 0; r <= SIZE - 3; r++) {
      if (board[r][c] === board[r + 1][c] && board[r + 1][c] === board[r + 2][c])
        return false;
    }
  }

  // Check all constraints
  for (const con of constraints) {
    const a = board[con.r1][con.c1];
    const b = board[con.r2][con.c2];
    if (con.type === CONSTRAINT.SAME && a !== b) return false;
    if (con.type === CONSTRAINT.DIFF && a === b) return false;
  }

  return true;
}
