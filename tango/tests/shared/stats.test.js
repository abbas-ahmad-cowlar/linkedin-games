import { describe, it, expect, beforeEach } from 'vitest';
import { getStats, recordSolve, getAverageTime, getSessionStats } from '../../src/shared/stats.js';
import * as storage from '../../src/shared/storage.js';

beforeEach(() => {
  localStorage.clear();
});

describe('getStats', () => {
  it('returns defaults for new game', () => {
    const stats = getStats('tango');
    expect(stats.totalSolved).toBe(0);
    expect(stats.bestTimes.easy).toBeNull();
    expect(stats.bestTimes.medium).toBeNull();
    expect(stats.bestTimes.hard).toBeNull();
    expect(stats.recentTimes).toEqual([]);
  });
});

describe('recordSolve', () => {
  it('increments totalSolved', () => {
    recordSolve('tango', 45, 'easy');
    recordSolve('tango', 60, 'medium');
    const stats = getStats('tango');
    expect(stats.totalSolved).toBe(2);
  });

  it('tracks personal best for each difficulty', () => {
    recordSolve('tango', 60, 'easy');
    recordSolve('tango', 45, 'easy');
    recordSolve('tango', 90, 'easy'); // Not a PB
    const stats = getStats('tango');
    expect(stats.bestTimes.easy).toBe(45);
  });

  it('returns isPersonalBest=true on first solve', () => {
    const result = recordSolve('tango', 60, 'hard');
    expect(result.isPersonalBest).toBe(true);
  });

  it('returns isPersonalBest=true when beating record', () => {
    recordSolve('tango', 60, 'hard');
    const result = recordSolve('tango', 40, 'hard');
    expect(result.isPersonalBest).toBe(true);
  });

  it('returns isPersonalBest=false when not beating record', () => {
    recordSolve('tango', 40, 'hard');
    const result = recordSolve('tango', 60, 'hard');
    expect(result.isPersonalBest).toBe(false);
  });

  it('calculates improvement percentage', () => {
    recordSolve('tango', 100, 'medium');
    const result = recordSolve('tango', 80, 'medium');
    expect(result.improvement).toBe(20); // 20% faster
  });

  it('calculates negative improvement (slower)', () => {
    recordSolve('tango', 50, 'medium');
    const result = recordSolve('tango', 60, 'medium');
    expect(result.improvement).toBe(-20); // 20% slower
  });

  it('returns null improvement on first solve', () => {
    const result = recordSolve('tango', 50, 'easy');
    expect(result.improvement).toBeNull();
  });

  it('keeps only last 20 recent times', () => {
    for (let i = 0; i < 25; i++) {
      recordSolve('tango', 30 + i, 'easy');
    }
    const stats = getStats('tango');
    expect(stats.recentTimes.length).toBe(20);
    expect(stats.totalSolved).toBe(25);
  });

  it('tracks session count', () => {
    recordSolve('tango', 45, 'easy');
    recordSolve('tango', 55, 'easy');
    recordSolve('tango', 35, 'easy');
    const stats = getStats('tango');
    expect(stats.sessionCount).toBe(3);
    expect(stats.sessionTimes).toEqual([45, 55, 35]);
  });
});

describe('getAverageTime', () => {
  it('returns null when no data', () => {
    expect(getAverageTime('tango')).toBeNull();
  });

  it('returns average of all solves', () => {
    recordSolve('tango', 40, 'easy');
    recordSolve('tango', 60, 'easy');
    expect(getAverageTime('tango')).toBe(50);
  });

  it('filters by difficulty', () => {
    recordSolve('tango', 40, 'easy');
    recordSolve('tango', 100, 'hard');
    expect(getAverageTime('tango', 'easy')).toBe(40);
    expect(getAverageTime('tango', 'hard')).toBe(100);
  });
});

describe('getSessionStats', () => {
  it('returns empty session when no data', () => {
    const session = getSessionStats('tango');
    expect(session.count).toBe(0);
    expect(session.avgTime).toBeNull();
    expect(session.bestTime).toBeNull();
  });

  it('tracks session correctly', () => {
    recordSolve('tango', 30, 'easy');
    recordSolve('tango', 50, 'easy');
    recordSolve('tango', 40, 'easy');
    const session = getSessionStats('tango');
    expect(session.count).toBe(3);
    expect(session.avgTime).toBe(40);
    expect(session.bestTime).toBe(30);
  });
});
