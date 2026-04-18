import { describe, it, expect } from 'vitest';
import { createRNG } from '../../src/shared/rng.js';
import {
  placeQueensNoAdjacent,
  growRegions,
  generatePuzzle,
} from '../../src/games/queens/queens-generator.js';
import { solve, hasUniqueSolution } from '../../src/games/queens/queens-solver.js';
import { inBounds } from '../../src/games/queens/queens-logic.js';

// ─── Helper: verify region connectivity via BFS ──────────────────────────────

/**
 * Check that every cell of a given region ID is reachable from any other cell
 * in that region via 4-connected (orthogonal) adjacency.
 */
function isRegionConnected(regionMap, regionId) {
  const N = regionMap.length;
  const cells = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (regionMap[r][c] === regionId) {
        cells.push({ r, c });
      }
    }
  }
  if (cells.length === 0) return true;

  const visited = new Set();
  const queue = [cells[0]];
  visited.add(`${cells[0].r},${cells[0].c}`);

  while (queue.length > 0) {
    const { r, c } = queue.shift();
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (
        inBounds(nr, nc, N) &&
        regionMap[nr][nc] === regionId &&
        !visited.has(key)
      ) {
        visited.add(key);
        queue.push({ r: nr, c: nc });
      }
    }
  }

  return visited.size === cells.length;
}

// ─── placeQueensNoAdjacent ───────────────────────────────────────────────────

describe('placeQueensNoAdjacent', () => {
  it('[T50] returns N queens for N=5', () => {
    const queens = placeQueensNoAdjacent(5, createRNG(42));
    expect(queens.length).toBe(5);
  });

  it('[T51] all queens in different rows (one per row, 0 to N-1)', () => {
    const N = 5;
    const queens = placeQueensNoAdjacent(N, createRNG(42));
    const rows = queens.map((q) => q.r).sort();
    expect(rows).toEqual([0, 1, 2, 3, 4]);
  });

  it('[T52] all queens in different columns', () => {
    const N = 5;
    const queens = placeQueensNoAdjacent(N, createRNG(42));
    const cols = new Set(queens.map((q) => q.c));
    expect(cols.size).toBe(N);
  });

  it('[T53] no two queens are adjacent (8-directional)', () => {
    const queens = placeQueensNoAdjacent(5, createRNG(42));
    for (let i = 0; i < queens.length; i++) {
      for (let j = i + 1; j < queens.length; j++) {
        const dr = Math.abs(queens[i].r - queens[j].r);
        const dc = Math.abs(queens[i].c - queens[j].c);
        expect(dr <= 1 && dc <= 1).toBe(false);
      }
    }
  });

  it('[T54] deterministic: same RNG seed → same placement', () => {
    const q1 = placeQueensNoAdjacent(5, createRNG(42));
    const q2 = placeQueensNoAdjacent(5, createRNG(42));
    expect(q1).toEqual(q2);
  });

  it('[T55] works for N=5, 6, 7, 8, 9', () => {
    for (const N of [5, 6, 7, 8, 9]) {
      const queens = placeQueensNoAdjacent(N, createRNG(100 + N));
      expect(queens.length).toBe(N);

      // Verify constraints
      const cols = new Set(queens.map((q) => q.c));
      expect(cols.size).toBe(N);

      for (let i = 0; i < queens.length; i++) {
        for (let j = i + 1; j < queens.length; j++) {
          const dr = Math.abs(queens[i].r - queens[j].r);
          const dc = Math.abs(queens[i].c - queens[j].c);
          expect(dr <= 1 && dc <= 1).toBe(false);
        }
      }
    }
  });
});

// ─── growRegions ─────────────────────────────────────────────────────────────

describe('growRegions', () => {
  it('[T56] returns N×N grid with all cells assigned (no -1 remaining)', () => {
    const N = 5;
    const queens = placeQueensNoAdjacent(N, createRNG(42));
    const regionMap = growRegions(N, queens, createRNG(42));

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        expect(regionMap[r][c]).toBeGreaterThanOrEqual(0);
        expect(regionMap[r][c]).toBeLessThan(N);
      }
    }
  });

  it('[T57] exactly N distinct region IDs [0, N-1]', () => {
    const N = 5;
    const queens = placeQueensNoAdjacent(N, createRNG(42));
    const regionMap = growRegions(N, queens, createRNG(42));

    const ids = new Set();
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        ids.add(regionMap[r][c]);
      }
    }
    expect(ids.size).toBe(N);
  });

  it('[T58] each region is connected (BFS from any cell reaches all cells)', () => {
    const N = 6;
    const queens = placeQueensNoAdjacent(N, createRNG(77));
    const regionMap = growRegions(N, queens, createRNG(77));

    for (let id = 0; id < N; id++) {
      expect(isRegionConnected(regionMap, id)).toBe(true);
    }
  });

  it('[T59] each queen position is in its assigned region', () => {
    const N = 5;
    const queens = placeQueensNoAdjacent(N, createRNG(42));
    const regionMap = growRegions(N, queens, createRNG(42));

    for (let i = 0; i < N; i++) {
      expect(regionMap[queens[i].r][queens[i].c]).toBe(i);
    }
  });

  it('[T60] deterministic: same RNG seed → same region map', () => {
    const N = 5;
    const q1 = placeQueensNoAdjacent(N, createRNG(42));
    const m1 = growRegions(N, q1, createRNG(42));

    const q2 = placeQueensNoAdjacent(N, createRNG(42));
    const m2 = growRegions(N, q2, createRNG(42));

    expect(m1).toEqual(m2);
  });
});

// ─── generatePuzzle ──────────────────────────────────────────────────────────

describe('generatePuzzle', () => {
  it('[T61] returns valid puzzle data shape', () => {
    const result = generatePuzzle('easy', createRNG(42));
    expect(result).toHaveProperty('size');
    expect(result).toHaveProperty('regionMap');
    expect(result).toHaveProperty('solution');
    expect(result).toHaveProperty('difficulty');
    expect(result.difficulty).toBe('easy');
    expect(result.regionMap.length).toBe(result.size);
    expect(result.solution.length).toBe(result.size);
  });

  it('[T62] solution satisfies all Queens constraints', () => {
    const { size, regionMap, solution } = generatePuzzle('medium', createRNG(42));
    const N = size;

    // One per row
    const rows = new Set(solution.map((q) => q.r));
    expect(rows.size).toBe(N);

    // One per column
    const cols = new Set(solution.map((q) => q.c));
    expect(cols.size).toBe(N);

    // One per region
    const regions = new Set(solution.map((q) => regionMap[q.r][q.c]));
    expect(regions.size).toBe(N);

    // No adjacency
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dr = Math.abs(solution[i].r - solution[j].r);
        const dc = Math.abs(solution[i].c - solution[j].c);
        expect(dr <= 1 && dc <= 1).toBe(false);
      }
    }
  });

  it('[T63] puzzle has unique solution (verified by solver)', () => {
    const { regionMap } = generatePuzzle('easy', createRNG(42));
    expect(hasUniqueSolution(regionMap)).toBe(true);
  });

  it('[T64] easy difficulty produces size=5', () => {
    const result = generatePuzzle('easy', createRNG(42));
    expect(result.size).toBe(5);
  });

  it('[T65] medium difficulty produces size 6 or 7', () => {
    const result = generatePuzzle('medium', createRNG(42));
    expect([6, 7]).toContain(result.size);
  });

  it('[T66] hard difficulty produces size 7, 8, or 9', () => {
    const result = generatePuzzle('hard', createRNG(42));
    expect([7, 8, 9]).toContain(result.size);
  });

  it('[T67] deterministic: same RNG seed + difficulty → same puzzle', () => {
    const p1 = generatePuzzle('easy', createRNG(42));
    const p2 = generatePuzzle('easy', createRNG(42));
    expect(p1.regionMap).toEqual(p2.regionMap);
    expect(p1.solution).toEqual(p2.solution);
    expect(p1.size).toBe(p2.size);
  });

  it('throws for unknown difficulty', () => {
    expect(() => generatePuzzle('extreme', createRNG(42))).toThrow();
  });
});

// ─── Uniqueness Stress Test ──────────────────────────────────────────────────

describe('generated puzzles have unique solutions', () => {
  it('easy: 5 puzzles all uniquely solvable', () => {
    for (let seed = 100; seed < 105; seed++) {
      const { regionMap } = generatePuzzle('easy', createRNG(seed));
      expect(hasUniqueSolution(regionMap)).toBe(true);
    }
  });

  it('medium: 5 puzzles all uniquely solvable', () => {
    for (let seed = 200; seed < 205; seed++) {
      const { regionMap } = generatePuzzle('medium', createRNG(seed));
      expect(hasUniqueSolution(regionMap)).toBe(true);
    }
  });
});

// ─── Performance ─────────────────────────────────────────────────────────────

describe('generator performance', () => {
  it('generates an easy puzzle in under 500ms', () => {
    const start = performance.now();
    generatePuzzle('easy', createRNG(42));
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  it('generates a medium puzzle in under 1000ms', () => {
    const start = performance.now();
    generatePuzzle('medium', createRNG(42));
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });
});
