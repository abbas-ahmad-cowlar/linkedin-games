import { describe, it, expect } from 'vitest';
import { createRNG } from '../../src/shared/rng.js';
import { checkWin, SIZE } from '../../src/games/tango/tango-logic.js';
import { hasUniqueSolution } from '../../src/games/tango/tango-solver.js';
import {
  generateCompleteSolution,
  generatePuzzle,
  getAdjacentPairs,
} from '../../src/games/tango/tango-generator.js';

// ─── Complete Solution Tests ─────────────────────────────────────────────────

describe('generateCompleteSolution', () => {
  it('returns a valid complete board', () => {
    const rng = createRNG(42);
    const board = generateCompleteSolution(rng);
    expect(checkWin(board)).toBe(true);
  });

  it('is deterministic with the same seed', () => {
    const board1 = generateCompleteSolution(createRNG(42));
    const board2 = generateCompleteSolution(createRNG(42));
    expect(board1).toEqual(board2);
  });

  it('produces different boards with different seeds', () => {
    const board1 = generateCompleteSolution(createRNG(42));
    const board2 = generateCompleteSolution(createRNG(99));
    expect(board1).not.toEqual(board2);
  });

  it('generates valid boards across 20 different seeds', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const board = generateCompleteSolution(createRNG(seed));
      expect(checkWin(board)).toBe(true);
    }
  });
});

// ─── Adjacent Pairs Tests ────────────────────────────────────────────────────

describe('getAdjacentPairs', () => {
  it('returns correct number of pairs', () => {
    const pairs = getAdjacentPairs();
    // Horizontal: 6 rows × 5 pairs = 30
    // Vertical: 5 rows × 6 cols = 30
    // Total = 60
    expect(pairs.length).toBe(60);
  });

  it('all pairs are actually adjacent', () => {
    const pairs = getAdjacentPairs();
    pairs.forEach((p) => {
      const dr = Math.abs(p.r1 - p.r2);
      const dc = Math.abs(p.c1 - p.c2);
      expect(dr + dc).toBe(1); // exactly 1 step apart
    });
  });
});

// ─── Puzzle Generator Tests ──────────────────────────────────────────────────

describe('generatePuzzle', () => {
  it('produces a valid puzzle structure', () => {
    const rng = createRNG(42);
    const result = generatePuzzle('medium', rng);

    expect(result).toHaveProperty('puzzle');
    expect(result).toHaveProperty('constraints');
    expect(result).toHaveProperty('solution');
    expect(result).toHaveProperty('difficulty');
    expect(result.difficulty).toBe('medium');
    expect(result.puzzle.length).toBe(SIZE);
    expect(result.solution.length).toBe(SIZE);
  });

  it('solution is valid', () => {
    const rng = createRNG(42);
    const { solution, constraints } = generatePuzzle('easy', rng);
    expect(checkWin(solution, constraints)).toBe(true);
  });

  it('is deterministic with the same seed', () => {
    const p1 = generatePuzzle('easy', createRNG(42));
    const p2 = generatePuzzle('easy', createRNG(42));
    expect(p1.puzzle).toEqual(p2.puzzle);
    expect(p1.constraints).toEqual(p2.constraints);
    expect(p1.solution).toEqual(p2.solution);
  });

  it('produces different puzzles with different seeds', () => {
    const p1 = generatePuzzle('easy', createRNG(42));
    const p2 = generatePuzzle('easy', createRNG(99));
    expect(p1.solution).not.toEqual(p2.solution);
  });

  it('pre-filled cells match the solution', () => {
    const { puzzle, solution } = generatePuzzle('medium', createRNG(42));
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (puzzle[r][c] !== null) {
          expect(puzzle[r][c]).toBe(solution[r][c]);
        }
      }
    }
  });

  it('constraints are correct relative to solution', () => {
    const { solution, constraints } = generatePuzzle('medium', createRNG(42));
    constraints.forEach((con) => {
      const a = solution[con.r1][con.c1];
      const b = solution[con.r2][con.c2];
      if (con.type === 'same') {
        expect(a).toBe(b);
      } else {
        expect(a).not.toBe(b);
      }
    });
  });

  it('all constraint pairs are adjacent', () => {
    const { constraints } = generatePuzzle('hard', createRNG(42));
    constraints.forEach((c) => {
      const dist = Math.abs(c.r1 - c.r2) + Math.abs(c.c1 - c.c2);
      expect(dist).toBe(1);
    });
  });

  it('throws for unknown difficulty', () => {
    expect(() => generatePuzzle('extreme', createRNG(42))).toThrow();
  });
});

// ─── Uniqueness Verification (Critical) ──────────────────────────────────────

describe('generated puzzles have unique solutions', () => {
  const difficulties = ['easy', 'medium', 'hard'];

  difficulties.forEach((diff) => {
    it(`${diff}: 10 puzzles all uniquely solvable`, () => {
      for (let seed = 100; seed < 110; seed++) {
        const rng = createRNG(seed);
        const { puzzle, constraints } = generatePuzzle(diff, rng);
        expect(hasUniqueSolution(puzzle, constraints)).toBe(true);
      }
    });
  });
});

// ─── Difficulty Scaling ──────────────────────────────────────────────────────

describe('difficulty affects puzzle complexity', () => {
  it('easy puzzles have more pre-filled cells than hard', () => {
    let easyFilled = 0;
    let hardFilled = 0;
    const N = 10;

    for (let seed = 200; seed < 200 + N; seed++) {
      const easy = generatePuzzle('easy', createRNG(seed));
      const hard = generatePuzzle('hard', createRNG(seed + 1000));

      easyFilled += easy.puzzle.flat().filter((c) => c !== null).length;
      hardFilled += hard.puzzle.flat().filter((c) => c !== null).length;
    }

    // On average, easy should have more filled cells
    expect(easyFilled / N).toBeGreaterThan(hardFilled / N);
  });
});

// ─── Performance ─────────────────────────────────────────────────────────────

describe('generator performance', () => {
  it('generates a puzzle in under 500ms', () => {
    const difficulties = ['easy', 'medium', 'hard'];
    difficulties.forEach((diff) => {
      const start = performance.now();
      generatePuzzle(diff, createRNG(42));
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(500);
    });
  });
});
