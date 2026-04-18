import { describe, it, expect, beforeEach } from 'vitest';
import { get, set, remove, has, getToday, getYesterday, clearAll } from '../../src/shared/storage.js';

beforeEach(() => {
  localStorage.clear();
});

describe('get / set', () => {
  it('stores and retrieves a string', () => {
    set('test', 'hello');
    expect(get('test')).toBe('hello');
  });

  it('stores and retrieves an object', () => {
    const obj = { board: [[1, 2], [3, 4]], completed: true };
    set('game', obj);
    expect(get('game')).toEqual(obj);
  });

  it('stores and retrieves an array', () => {
    set('arr', [1, 2, 3]);
    expect(get('arr')).toEqual([1, 2, 3]);
  });

  it('returns fallback when key does not exist', () => {
    expect(get('missing')).toBeNull();
    expect(get('missing', 42)).toBe(42);
  });

  it('uses lg_ prefix in localStorage', () => {
    set('test', 'value');
    expect(localStorage.getItem('lg_test')).toBe('"value"');
  });

  it('returns fallback for corrupted JSON', () => {
    localStorage.setItem('lg_broken', 'not valid json{{{');
    expect(get('broken', 'fallback')).toBe('fallback');
  });
});

describe('remove', () => {
  it('removes a key', () => {
    set('temp', 'data');
    expect(has('temp')).toBe(true);
    remove('temp');
    expect(has('temp')).toBe(false);
  });
});

describe('has', () => {
  it('returns false for non-existent key', () => {
    expect(has('nope')).toBe(false);
  });

  it('returns true for existing key', () => {
    set('exists', true);
    expect(has('exists')).toBe(true);
  });
});

describe('getToday', () => {
  it('returns YYYY-MM-DD format', () => {
    const today = getToday();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getYesterday', () => {
  it('returns YYYY-MM-DD format', () => {
    const yesterday = getYesterday();
    expect(yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('is one day before today', () => {
    const today = new Date(getToday());
    const yesterday = new Date(getYesterday());
    const diffMs = today - yesterday;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(1);
  });
});

describe('clearAll', () => {
  it('removes all lg_ keys', () => {
    set('a', 1);
    set('b', 2);
    localStorage.setItem('other', 'keep');
    clearAll();
    expect(has('a')).toBe(false);
    expect(has('b')).toBe(false);
    expect(localStorage.getItem('other')).toBe('keep');
  });
});
