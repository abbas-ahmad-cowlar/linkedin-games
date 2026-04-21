/**
 * Queens Solver — Row-by-row backtracking with constraint pruning.
 *
 * Verifies puzzle solvability and uniqueness. Each row must contain exactly
 * one queen, so the solver iterates row-by-row, trying each column and
 * pruning via column uniqueness, region uniqueness, and 8-adjacency.
 *
 * @module games/queens/queens-solver
 */

/**
 * Check if placing a queen at (r, c) would be adjacent to any already-placed queen.
 * @param {{r: number, c: number}[]} queens - Already placed queens
 * @param {number} r - Row to check
 * @param {number} c - Column to check
 * @returns {boolean} True if adjacent to any placed queen
 */
function isAdjacentToAny(queens, r, c) {
  for (const q of queens) {
    if (Math.abs(q.r - r) <= 1 && Math.abs(q.c - c) <= 1) {
      return true;
    }
  }
  return false;
}

/**
 * Solve a Queens puzzle using backtracking.
 *
 * @param {number[][]} regionMap - N×N grid of region IDs
 * @param {number} [maxSolutions=2] - Stop after finding this many solutions.
 *   Use 2 for uniqueness checking (need to know if >1 solution exists).
 * @returns {{r: number, c: number}[][]} Array of solutions, each an array of N queen positions
 */
export function solve(regionMap, maxSolutions = 2) {
  const N = regionMap.length;
  const solutions = [];
  const placement = []; // {r, c}[] — queens placed so far
  const usedCols = new Set();
  const usedRegions = new Set();

  function backtrack(row) {
    if (solutions.length >= maxSolutions) return;
    if (row === N) {
      solutions.push([...placement]);
      return;
    }

    for (let col = 0; col < N; col++) {
      // Prune 1: column already used
      if (usedCols.has(col)) continue;

      // Prune 2: region already used
      const regionId = regionMap[row][col];
      if (usedRegions.has(regionId)) continue;

      // Prune 3: adjacent to any placed queen
      if (isAdjacentToAny(placement, row, col)) continue;

      // Place queen
      placement.push({ r: row, c: col });
      usedCols.add(col);
      usedRegions.add(regionId);

      backtrack(row + 1);

      // Unplace
      placement.pop();
      usedCols.delete(col);
      usedRegions.delete(regionId);
    }
  }

  backtrack(0);
  return solutions;
}

/**
 * Check if a Queens puzzle has exactly one solution.
 *
 * @param {number[][]} regionMap - N×N grid of region IDs
 * @returns {boolean}
 */
export function hasUniqueSolution(regionMap) {
  const solutions = solve(regionMap, 2);
  return solutions.length === 1;
}
