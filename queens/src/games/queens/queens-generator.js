/**
 * Queens Puzzle Generator — Solution-first region growing.
 *
 * Algorithm:
 *   1. Place N non-adjacent queens (one per row, one per column) via backtracking
 *   2. Grow N connected regions from queen positions using BFS flood fill
 *   3. Verify the puzzle has a unique solution; retry if not
 *
 * @module games/queens/queens-generator
 */

import { inBounds } from './queens-logic.js';
import { hasUniqueSolution, solve } from './queens-solver.js';
import { shuffle } from '../../shared/rng.js';

// ─── Difficulty Config ───────────────────────────────────────────────────────

const DIFFICULTY = Object.freeze({
  easy: { sizes: [5] },
  medium: { sizes: [6, 7] },
  hard: { sizes: [7, 8, 9] },
});

// ─── Queen Placement ─────────────────────────────────────────────────────────

/**
 * Place N non-adjacent queens, one per row, one per column.
 * Uses backtracking with randomized column ordering for variety.
 *
 * @param {number} N - Grid size
 * @param {function(): number} rng - Seeded PRNG
 * @returns {{r: number, c: number}[]} Array of N queen positions
 */
export function placeQueensNoAdjacent(N, rng) {
  const queens = [];

  function backtrack(row) {
    if (row === N) return true;

    // Randomize column order for variety
    const cols = Array.from({ length: N }, (_, i) => i);
    shuffle(cols, rng);

    for (const col of cols) {
      // Check column not already used
      if (queens.some((q) => q.c === col)) continue;

      // Check not adjacent to any placed queen (8-directional)
      let adjacent = false;
      for (const q of queens) {
        if (Math.abs(q.r - row) <= 1 && Math.abs(q.c - col) <= 1) {
          adjacent = true;
          break;
        }
      }
      if (adjacent) continue;

      queens.push({ r: row, c: col });
      if (backtrack(row + 1)) return true;
      queens.pop();
    }

    return false;
  }

  backtrack(0);
  return queens;
}

// ─── Region Growing ──────────────────────────────────────────────────────────

/**
 * 4-directional neighbor offsets (orthogonal connectivity).
 */
const DIRS_4 = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/**
 * Grow N connected regions from queen seed positions using per-region BFS.
 * Uses round-robin growth (smallest region first) with randomized frontier
 * ordering to create organic, irregular region shapes.
 *
 * @param {number} N - Grid size
 * @param {{r: number, c: number}[]} queenPositions - N queen positions (one per region)
 * @param {function(): number} rng - Seeded PRNG
 * @returns {number[][]} N×N region map
 */
export function growRegions(N, queenPositions, rng) {
  // Initialize region map with -1 (unassigned)
  const regionMap = Array.from({ length: N }, () => Array(N).fill(-1));
  const regionSizes = Array(N).fill(0);

  // Per-region frontiers
  const frontiers = Array.from({ length: N }, () => []);

  // Seed each region with its queen cell
  for (let i = 0; i < N; i++) {
    const q = queenPositions[i];
    regionMap[q.r][q.c] = i;
    regionSizes[i] = 1;

    // Add neighbors to this region's frontier
    for (const [dr, dc] of DIRS_4) {
      const nr = q.r + dr;
      const nc = q.c + dc;
      if (inBounds(nr, nc, N) && regionMap[nr][nc] === -1) {
        frontiers[i].push({ r: nr, c: nc });
      }
    }
  }

  let unassigned = N * N - N;

  while (unassigned > 0) {
    // Find the smallest region that still has frontier cells
    // Sort region indices by size (smallest first), randomize ties
    const order = Array.from({ length: N }, (_, i) => i);
    shuffle(order, rng);
    order.sort((a, b) => regionSizes[a] - regionSizes[b]);

    let madeProgress = false;

    for (const regionId of order) {
      const frontier = frontiers[regionId];

      // Purge stale entries
      for (let j = frontier.length - 1; j >= 0; j--) {
        if (regionMap[frontier[j].r][frontier[j].c] !== -1) {
          frontier.splice(j, 1);
        }
      }

      if (frontier.length === 0) continue;

      // Shuffle frontier for randomness
      shuffle(frontier, rng);

      // Try to assign one cell from this region's frontier
      let assigned = false;
      for (let j = 0; j < frontier.length; j++) {
        const cell = frontier[j];
        if (regionMap[cell.r][cell.c] !== -1) continue;

        // Assign cell
        regionMap[cell.r][cell.c] = regionId;
        regionSizes[regionId]++;
        unassigned--;
        frontier.splice(j, 1);

        // Add new frontier cells
        for (const [dr, dc] of DIRS_4) {
          const nr = cell.r + dr;
          const nc = cell.c + dc;
          if (inBounds(nr, nc, N) && regionMap[nr][nc] === -1) {
            frontier.push({ r: nr, c: nc });
          }
        }

        assigned = true;
        madeProgress = true;
        break;
      }

      if (assigned) break; // One cell per round to maintain balance
    }

    if (!madeProgress) {
      // Fallback: assign remaining cells to nearest region
      assignRemainingCells(regionMap, N);
      break;
    }
  }

  return regionMap;
}

/**
 * Assign any remaining unassigned cells to the nearest region.
 * Used as a fallback when the frontier-based growing gets stuck.
 *
 * @param {number[][]} regionMap - Region map (mutated in place)
 * @param {number} N - Grid size
 */
function assignRemainingCells(regionMap, N) {
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (regionMap[r][c] !== -1) continue;

        // Find the first assigned orthogonal neighbor
        for (const [dr, dc] of DIRS_4) {
          const nr = r + dr;
          const nc = c + dc;
          if (inBounds(nr, nc, N) && regionMap[nr][nc] !== -1) {
            regionMap[r][c] = regionMap[nr][nc];
            changed = true;
            break;
          }
        }
      }
    }
  }
}

// ─── Full Pipeline ───────────────────────────────────────────────────────────

/**
 * Check if a region remains connected after removing a cell.
 * Uses BFS from any remaining cell in the region.
 *
 * @param {number[][]} regionMap - Region map
 * @param {number} N - Grid size
 * @param {number} regionId - Region to check
 * @param {number} excludeR - Row of cell to exclude
 * @param {number} excludeC - Col of cell to exclude
 * @returns {boolean}
 */
function isRegionConnectedWithout(regionMap, N, regionId, excludeR, excludeC) {
  const cells = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (regionMap[r][c] === regionId && !(r === excludeR && c === excludeC)) {
        cells.push({ r, c });
      }
    }
  }
  if (cells.length <= 1) return true;

  const visited = new Set();
  const queue = [cells[0]];
  visited.add(`${cells[0].r},${cells[0].c}`);

  while (queue.length > 0) {
    const { r, c } = queue.shift();
    for (const [dr, dc] of DIRS_4) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (
        inBounds(nr, nc, N) &&
        regionMap[nr][nc] === regionId &&
        !(nr === excludeR && nc === excludeC) &&
        !visited.has(key)
      ) {
        visited.add(key);
        queue.push({ r: nr, c: nc });
      }
    }
  }

  return visited.size === cells.length;
}

/**
 * Perturb region borders to eliminate alternative solutions.
 * Finds alternative solutions and swaps border cells to invalidate them.
 *
 * @param {number[][]} regionMap - Region map (cloned internally, original not modified)
 * @param {{r: number, c: number}[]} queens - The intended solution
 * @param {number} N - Grid size
 * @param {function(): number} rng - Seeded PRNG
 * @returns {number[][]|null} Modified region map with unique solution, or null if failed
 */
function perturbRegions(regionMap, queens, N, rng) {
  // Deep clone the region map
  const rm = regionMap.map((row) => [...row]);
  const maxPerturbations = 30;

  for (let iter = 0; iter < maxPerturbations; iter++) {
    const solutions = solve(rm, 2);

    if (solutions.length === 1) return rm;
    if (solutions.length === 0) return null;

    // Find an alternative solution (not our intended one)
    const alt = solutions.find(
      (sol) => !sol.every((q, i) => q.r === queens[i].r && q.c === queens[i].c)
    );
    if (!alt) return rm; // Only our solution found

    // Find a queen position that differs between our solution and the alternative
    let diffIdx = -1;
    for (let i = 0; i < N; i++) {
      if (alt[i].r !== queens[i].r || alt[i].c !== queens[i].c) {
        diffIdx = i;
        break;
      }
    }
    if (diffIdx === -1) return rm;

    // The alternative places a queen at alt[diffIdx] which should be in a different region
    // than its current region assignment to invalidate this alternative.
    // Strategy: make the alt queen's cell belong to the same region as our queen in that row.
    const altQ = alt[diffIdx];
    const ourQ = queens[diffIdx];
    const ourRegion = rm[ourQ.r][ourQ.c]; // Region of our queen
    const altRegion = rm[altQ.r][altQ.c]; // Region of the alt queen

    if (ourRegion === altRegion) {
      // They're already in the same region — try a different approach:
      // swap a border cell of the alt queen's region to break it
      // Skip this iteration and try another solution
      continue;
    }

    // Try to extend ourRegion to include the alt queen's cell
    // by finding a path of cells from ourRegion to the alt cell
    // and reassigning them. But this is complex, so instead:
    // Find a border cell adjacent to both regions and swap it.

    // Simpler approach: find any border cell of altRegion that's adjacent to ourRegion
    // and swap it to ourRegion. This changes the shape and may break the alt solution.
    const borderCells = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (rm[r][c] !== altRegion) continue;
        // Skip queen cells — they must stay in their region
        if (r === queens[altRegion]?.r && c === queens[altRegion]?.c) continue;

        // Check if adjacent to ourRegion
        for (const [dr, dc] of DIRS_4) {
          const nr = r + dr;
          const nc = c + dc;
          if (inBounds(nr, nc, N) && rm[nr][nc] === ourRegion) {
            borderCells.push({ r, c });
            break;
          }
        }
      }
    }

    if (borderCells.length === 0) continue;

    shuffle(borderCells, rng);

    // Try swapping cells
    let swapped = false;
    for (const cell of borderCells) {
      // Check that removing this cell keeps altRegion connected
      if (!isRegionConnectedWithout(rm, N, altRegion, cell.r, cell.c)) continue;

      // Swap
      rm[cell.r][cell.c] = ourRegion;
      swapped = true;
      break;
    }

    if (!swapped) continue;
  }

  // Final check
  const finalSolutions = solve(rm, 2);
  if (finalSolutions.length === 1) return rm;
  return null;
}

/**
 * Generate a complete Queens puzzle with guaranteed valid solution.
 *
 * @param {'easy'|'medium'|'hard'} difficulty
 * @param {function(): number} rng - Seeded PRNG
 * @returns {{
 *   size: number,
 *   regionMap: number[][],
 *   solution: {r: number, c: number}[],
 *   difficulty: string
 * }}
 */
export function generatePuzzle(difficulty, rng) {
  const config = DIFFICULTY[difficulty];
  if (!config) throw new Error(`Unknown difficulty: ${difficulty}`);

  // Pick grid size from allowed range
  const sizeIndex = Math.floor(rng() * config.sizes.length);
  const N = config.sizes[sizeIndex];

  // Retry loop: generate until we get a unique puzzle
  const maxAttempts = 100;
  let regionMap;
  let queens;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    queens = placeQueensNoAdjacent(N, rng);
    regionMap = growRegions(N, queens, rng);

    // Quick check: if already unique, great
    if (hasUniqueSolution(regionMap)) {
      return {
        size: N,
        regionMap,
        solution: queens,
        difficulty,
      };
    }

    // Try to perturb the region map to make it unique
    const perturbed = perturbRegions(regionMap, queens, N, rng);
    if (perturbed) {
      return {
        size: N,
        regionMap: perturbed,
        solution: queens,
        difficulty,
      };
    }
  }

  // Fallback: return last generated puzzle even if not unique
  return {
    size: N,
    regionMap,
    solution: queens,
    difficulty,
  };
}

