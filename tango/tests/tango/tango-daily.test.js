import { describe, it, expect } from 'vitest';
import { getDayNumber, getDailyDifficulty, getDailyPuzzle, getPracticePuzzle } from '../../src/games/tango/tango-daily.js';
import { checkWin } from '../../src/games/tango/tango-logic.js';
import { hasUniqueSolution } from '../../src/games/tango/tango-solver.js';

describe('getDayNumber', () => {
  it('returns 1 for the epoch date', () => {
    expect(getDayNumber('2026-04-18')).toBe(1);
  });

  it('returns 2 for the day after epoch', () => {
    expect(getDayNumber('2026-04-19')).toBe(2);
  });

  it('returns 20 for epoch + 19 days', () => {
    expect(getDayNumber('2026-05-07')).toBe(20);
  });

  it('handles dates far in the future', () => {
    expect(getDayNumber('2027-04-18')).toBe(366);
  });
});

describe('getDailyDifficulty', () => {
  it('returns one of easy/medium/hard', () => {
    const diff = getDailyDifficulty('2026-04-18');
    expect(['easy', 'medium', 'hard']).toContain(diff);
  });

  it('is deterministic for the same date', () => {
    const d1 = getDailyDifficulty('2026-04-18');
    const d2 = getDailyDifficulty('2026-04-18');
    expect(d1).toBe(d2);
  });

  it('varies across dates', () => {
    const results = new Set();
    for (let d = 18; d <= 30; d++) {
      results.add(getDailyDifficulty(`2026-04-${d}`));
    }
    // Over 13 days, we should see at least 2 different difficulties
    expect(results.size).toBeGreaterThanOrEqual(2);
  });
});

describe('getDailyPuzzle', () => {
  it('returns valid puzzle structure', async () => {
    const puzzle = await getDailyPuzzle('2026-04-25');
    expect(puzzle).toHaveProperty('puzzle');
    expect(puzzle).toHaveProperty('constraints');
    expect(puzzle).toHaveProperty('solution');
    expect(puzzle).toHaveProperty('difficulty');
    expect(puzzle).toHaveProperty('dayNumber');
    expect(puzzle.puzzle.length).toBe(6);
    expect(puzzle.solution.length).toBe(6);
  });

  it('is deterministic for the same date', async () => {
    const p1 = await getDailyPuzzle('2026-04-25');
    const p2 = await getDailyPuzzle('2026-04-25');
    expect(p1.puzzle).toEqual(p2.puzzle);
    expect(p1.solution).toEqual(p2.solution);
    expect(p1.constraints).toEqual(p2.constraints);
  });

  it('produces different puzzles for different dates', async () => {
    const p1 = await getDailyPuzzle('2026-04-25');
    const p2 = await getDailyPuzzle('2026-04-26');
    expect(p1.solution).not.toEqual(p2.solution);
  });

  it('solution is valid', async () => {
    const puzzle = await getDailyPuzzle('2026-04-25');
    expect(checkWin(puzzle.solution, puzzle.constraints)).toBe(true);
  });

  it('puzzle has unique solution', async () => {
    const puzzle = await getDailyPuzzle('2026-04-25');
    expect(hasUniqueSolution(puzzle.puzzle, puzzle.constraints)).toBe(true);
  });
});

describe('getPracticePuzzle', () => {
  it('returns valid puzzle', () => {
    const puzzle = getPracticePuzzle();
    expect(puzzle.puzzle.length).toBe(6);
    expect(checkWin(puzzle.solution, puzzle.constraints)).toBe(true);
  });

  it('accepts difficulty override', () => {
    const puzzle = getPracticePuzzle('hard');
    expect(puzzle.difficulty).toBe('hard');
  });

  it('returns dayNumber 0', () => {
    const puzzle = getPracticePuzzle();
    expect(puzzle.dayNumber).toBe(0);
  });
});
