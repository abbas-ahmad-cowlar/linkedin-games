/**
 * Queens Game Logic — Board model, constraint validators, and win detection.
 *
 * Queens is a constraint-satisfaction puzzle on an N×N grid divided into
 * N colored regions. The player places exactly one queen per region,
 * per row, and per column, with no two queens touching (including diagonally).
 *
 * Rules:
 *   R1. One queen per row
 *   R2. One queen per column
 *   R3. One queen per region
 *   R4. No two queens adjacent (8-directional)
 *
 * @module games/queens/queens-logic
 */

// ─── Constants ───────────────────────────────────────────────────────────────

export const CELL = Object.freeze({
  EMPTY: null,
  QUEEN: 'queen',
  MARKER: 'marker',
});

// ─── Board Utilities ─────────────────────────────────────────────────────────

/**
 * Create an empty N×N board (all nulls).
 * @param {number} size - Board dimension (N)
 * @returns {Array<Array<null>>}
 */
export function createBoard(size) {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

/**
 * Deep-clone a board (independent copy).
 * @param {Array<Array<any>>} board
 * @returns {Array<Array<any>>}
 */
export function cloneBoard(board) {
  return board.map((row) => [...row]);
}

/**
 * Check if (r, c) is within an N×N grid.
 * @param {number} r - Row
 * @param {number} c - Column
 * @param {number} size - Grid dimension N
 * @returns {boolean}
 */
export function inBounds(r, c, size) {
  return r >= 0 && r < size && c >= 0 && c < size;
}

/**
 * Build a region→cells lookup map from a region map.
 * @param {number[][]} regionMap - N×N grid of region IDs
 * @returns {Map<number, {r: number, c: number}[]>}
 */
export function getRegionCells(regionMap) {
  const map = new Map();
  const size = regionMap.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const id = regionMap[r][c];
      if (!map.has(id)) map.set(id, []);
      map.get(id).push({ r, c });
    }
  }
  return map;
}

/**
 * Find all queen positions on the board.
 * @param {Array<Array<any>>} board
 * @returns {{r: number, c: number}[]}
 */
export function findQueens(board) {
  const queens = [];
  const size = board.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === CELL.QUEEN) {
        queens.push({ r, c });
      }
    }
  }
  return queens;
}

// ─── Conflict Checkers ───────────────────────────────────────────────────────

/**
 * Helper: create a cell key string for Set storage.
 * @param {number} r
 * @param {number} c
 * @returns {string}
 */
function cellKey(r, c) {
  return `${r},${c}`;
}

/**
 * Find all queens that share a row with another queen.
 * @param {Array<Array<any>>} board
 * @returns {Set<string>} Set of "r,c" keys for all conflicting cells
 */
export function checkRowConflicts(board) {
  const errors = new Set();
  const size = board.length;

  for (let r = 0; r < size; r++) {
    const queensInRow = [];
    for (let c = 0; c < size; c++) {
      if (board[r][c] === CELL.QUEEN) {
        queensInRow.push(c);
      }
    }
    if (queensInRow.length > 1) {
      for (const c of queensInRow) {
        errors.add(cellKey(r, c));
      }
    }
  }

  return errors;
}

/**
 * Find all queens that share a column with another queen.
 * @param {Array<Array<any>>} board
 * @returns {Set<string>} Set of "r,c" keys for all conflicting cells
 */
export function checkColConflicts(board) {
  const errors = new Set();
  const size = board.length;

  for (let c = 0; c < size; c++) {
    const queensInCol = [];
    for (let r = 0; r < size; r++) {
      if (board[r][c] === CELL.QUEEN) {
        queensInCol.push(r);
      }
    }
    if (queensInCol.length > 1) {
      for (const r of queensInCol) {
        errors.add(cellKey(r, c));
      }
    }
  }

  return errors;
}

/**
 * Find all queens that share a region with another queen.
 * @param {Array<Array<any>>} board
 * @param {number[][]} regionMap
 * @returns {Set<string>} Set of "r,c" keys for all conflicting cells
 */
export function checkRegionConflicts(board, regionMap) {
  const errors = new Set();
  const size = board.length;

  // Group queens by region
  const regionQueens = new Map();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === CELL.QUEEN) {
        const id = regionMap[r][c];
        if (!regionQueens.has(id)) regionQueens.set(id, []);
        regionQueens.get(id).push({ r, c });
      }
    }
  }

  for (const [, queens] of regionQueens) {
    if (queens.length > 1) {
      for (const q of queens) {
        errors.add(cellKey(q.r, q.c));
      }
    }
  }

  return errors;
}

/**
 * Find all queens that are adjacent (8-directional) to another queen.
 * @param {Array<Array<any>>} board
 * @returns {Set<string>} Set of "r,c" keys for all conflicting cells
 */
export function checkAdjacencyConflicts(board) {
  const errors = new Set();
  const queens = findQueens(board);

  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      const a = queens[i];
      const b = queens[j];
      if (Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1) {
        errors.add(cellKey(a.r, a.c));
        errors.add(cellKey(b.r, b.c));
      }
    }
  }

  return errors;
}

// ─── Combined Error Finder ───────────────────────────────────────────────────

/**
 * Find all error cells by combining all constraint checks.
 * @param {Array<Array<any>>} board
 * @param {number[][]} regionMap
 * @returns {{ cells: Set<string>, message: string|null }}
 */
export function findAllErrors(board, regionMap) {
  const rowErrors = checkRowConflicts(board);
  const colErrors = checkColConflicts(board);
  const regionErrors = checkRegionConflicts(board, regionMap);
  const adjErrors = checkAdjacencyConflicts(board);

  const allErrors = new Set();
  for (const key of rowErrors) allErrors.add(key);
  for (const key of colErrors) allErrors.add(key);
  for (const key of regionErrors) allErrors.add(key);
  for (const key of adjErrors) allErrors.add(key);

  if (allErrors.size === 0) {
    return { cells: allErrors, message: null };
  }

  // Build a descriptive message
  const parts = [];
  if (rowErrors.size > 0) parts.push('row');
  if (colErrors.size > 0) parts.push('column');
  if (regionErrors.size > 0) parts.push('region');
  if (adjErrors.size > 0) parts.push('adjacency');

  const message = `Conflict: ${parts.join(', ')} violation${parts.length > 1 ? 's' : ''}`;
  return { cells: allErrors, message };
}

// ─── Win Detection ───────────────────────────────────────────────────────────

/**
 * Check if the board is in a winning state.
 * Requires exactly N queens, one per row/col/region, no adjacency.
 * @param {Array<Array<any>>} board
 * @param {number[][]} regionMap
 * @returns {boolean}
 */
export function checkWin(board, regionMap) {
  const size = board.length;
  const queens = findQueens(board);

  // Must have exactly N queens
  if (queens.length !== size) return false;

  // Check all constraints
  if (checkRowConflicts(board).size > 0) return false;
  if (checkColConflicts(board).size > 0) return false;
  if (checkRegionConflicts(board, regionMap).size > 0) return false;
  if (checkAdjacencyConflicts(board).size > 0) return false;

  return true;
}

// ─── Debug Utilities ─────────────────────────────────────────────────────────

/**
 * Pretty-print a board for debugging. Q = Queen, × = Marker, · = empty.
 * @param {Array<Array<any>>} board
 * @returns {string}
 */
export function boardToString(board) {
  return board
    .map((row) =>
      row
        .map((c) =>
          c === CELL.QUEEN ? 'Q' : c === CELL.MARKER ? '×' : '·'
        )
        .join(' ')
    )
    .join('\n');
}
