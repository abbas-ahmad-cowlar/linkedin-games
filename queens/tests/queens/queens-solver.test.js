import { describe, it, expect } from 'vitest';
import { solve, hasUniqueSolution } from '../../src/games/queens/queens-solver.js';

// ─── Test Fixtures ───────────────────────────────────────────────────────────

/**
 * Known 5×5 region map with a verified unique solution (generator seed 9).
 * Solution: (0,3)→R0, (1,0)→R1, (2,2)→R2, (3,4)→R3, (4,1)→R4
 */
const UNIQUE_5x5 = [
  [0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
  [2, 2, 2, 0, 3],
  [4, 2, 2, 3, 3],
  [4, 4, 4, 3, 3],
];

/**
 * 5×5 region map designed to have multiple solutions.
 * Each row IS a separate region → effectively standard N-Queens with no-adjacency.
 */
const AMBIGUOUS_5x5 = [
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2],
  [3, 3, 3, 3, 3],
  [4, 4, 4, 4, 4],
];

/**
 * 3×3 region map that is impossible to solve.
 * With 3×3 and no-adjacency constraint, placing 3 non-adjacent queens
 * one per row, one per col is impossible (only positions with gap ≥2 needed).
 */
const IMPOSSIBLE_3x3 = [
  [0, 1, 2],
  [0, 1, 2],
  [0, 1, 2],
];

// ─── solve ───────────────────────────────────────────────────────────────────

describe('solve', () => {
  it('[T42] finds the correct solution for a known 5×5 puzzle', () => {
    const solutions = solve(UNIQUE_5x5, 10);
    expect(solutions.length).toBeGreaterThanOrEqual(1);

    // The known solution
    const expected = [
      { r: 0, c: 3 },
      { r: 1, c: 0 },
      { r: 2, c: 2 },
      { r: 3, c: 4 },
      { r: 4, c: 1 },
    ];

    // Check that the known solution is among the results
    const matchesSolution = solutions.some((sol) =>
      sol.every(
        (q, i) => q.r === expected[i].r && q.c === expected[i].c
      )
    );
    expect(matchesSolution).toBe(true);
  });

  it('[T43] returns exactly 1 solution for a unique puzzle', () => {
    const solutions = solve(UNIQUE_5x5, 10);
    expect(solutions.length).toBe(1);
  });

  it('[T44] returns 2 solutions for an ambiguous region map (maxSolutions=2)', () => {
    const solutions = solve(AMBIGUOUS_5x5, 2);
    expect(solutions.length).toBe(2);
  });

  it('[T45] returns empty array for an impossible region map', () => {
    const solutions = solve(IMPOSSIBLE_3x3, 10);
    expect(solutions.length).toBe(0);
  });

  it('[T46] respects maxSolutions limit (stops early)', () => {
    const solutions = solve(AMBIGUOUS_5x5, 1);
    expect(solutions.length).toBe(1);
  });

  it('[T47] handles N=7 within reasonable time (<200ms)', () => {
    // 7×7 with row-per-region (many solutions)
    const regionMap7 = Array.from({ length: 7 }, (_, r) =>
      Array(7).fill(r)
    );
    const start = performance.now();
    const solutions = solve(regionMap7, 2);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
    expect(solutions.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── hasUniqueSolution ───────────────────────────────────────────────────────

describe('hasUniqueSolution', () => {
  it('[T48] returns true for a known unique puzzle', () => {
    expect(hasUniqueSolution(UNIQUE_5x5)).toBe(true);
  });

  it('[T49] returns false for a puzzle with multiple solutions', () => {
    expect(hasUniqueSolution(AMBIGUOUS_5x5)).toBe(false);
  });
});
