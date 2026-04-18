import { describe, it, expect, beforeEach } from 'vitest';
import { getStreak, recordWin, isCompletedToday, toggleFreeze } from '../../src/shared/streak.js';
import * as storage from '../../src/shared/storage.js';

beforeEach(() => {
  localStorage.clear();
});

describe('getStreak', () => {
  it('returns default values for new game', () => {
    const streak = getStreak('tango');
    expect(streak.current).toBe(0);
    expect(streak.best).toBe(0);
    expect(streak.lastPlayDate).toBeNull();
    expect(streak.frozen).toBe(false);
  });
});

describe('recordWin', () => {
  it('starts streak at 1 on first win', () => {
    const result = recordWin('tango');
    expect(result.current).toBe(1);
    expect(result.best).toBe(1);
  });

  it('does not double-count same day', () => {
    recordWin('tango');
    const result = recordWin('tango');
    expect(result.current).toBe(1);
  });

  it('increments streak for consecutive days', () => {
    // Simulate yesterday's win
    const yesterday = storage.getYesterday();
    storage.set('tango_streak', {
      current: 3,
      best: 5,
      lastPlayDate: yesterday,
      frozen: false,
    });

    const result = recordWin('tango');
    expect(result.current).toBe(4);
    expect(result.best).toBe(5); // 4 < 5, so best stays
  });

  it('resets streak after gap (non-consecutive)', () => {
    storage.set('tango_streak', {
      current: 5,
      best: 5,
      lastPlayDate: '2020-01-01', // Long ago
      frozen: false,
    });

    const result = recordWin('tango');
    expect(result.current).toBe(1);
    expect(result.best).toBe(5); // Best preserved
  });

  it('freeze absorbs one missed day', () => {
    storage.set('tango_streak', {
      current: 3,
      best: 3,
      lastPlayDate: '2020-01-01',
      frozen: true,
    });

    const result = recordWin('tango');
    expect(result.current).toBe(4); // Freeze saved it
    expect(result.best).toBe(4);
  });

  it('updates best when current exceeds it', () => {
    const yesterday = storage.getYesterday();
    storage.set('tango_streak', {
      current: 5,
      best: 5,
      lastPlayDate: yesterday,
      frozen: false,
    });

    const result = recordWin('tango');
    expect(result.current).toBe(6);
    expect(result.best).toBe(6);
  });
});

describe('isCompletedToday', () => {
  it('returns false when no data', () => {
    expect(isCompletedToday('tango')).toBe(false);
  });

  it('returns false when saved for different date', () => {
    storage.set('tango_daily', { date: '2020-01-01', completed: true });
    expect(isCompletedToday('tango')).toBe(false);
  });

  it('returns false when not completed', () => {
    storage.set('tango_daily', { date: storage.getToday(), completed: false });
    expect(isCompletedToday('tango')).toBe(false);
  });

  it('returns true when completed today', () => {
    storage.set('tango_daily', { date: storage.getToday(), completed: true });
    expect(isCompletedToday('tango')).toBe(true);
  });
});

describe('toggleFreeze', () => {
  it('toggles freeze state', () => {
    expect(toggleFreeze('tango')).toBe(true);
    expect(toggleFreeze('tango')).toBe(false);
  });
});
