import { describe, it, expect } from 'vitest';
import { createRNG, dateSeed, shuffle, randInt } from '../../src/shared/rng.js';

describe('createRNG', () => {
  it('produces deterministic sequences for the same seed', () => {
    const rng1 = createRNG(42);
    const rng2 = createRNG(42);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = createRNG(42);
    const rng2 = createRNG(99);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });

  it('produces values in [0, 1)', () => {
    const rng = createRNG(12345);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('has approximately uniform distribution (mean ≈ 0.5)', () => {
    const rng = createRNG(777);
    let sum = 0;
    const N = 10000;
    for (let i = 0; i < N; i++) sum += rng();
    const mean = sum / N;
    expect(mean).toBeGreaterThan(0.45);
    expect(mean).toBeLessThan(0.55);
  });
});

describe('dateSeed', () => {
  it('returns the same seed for the same date and game', () => {
    const a = dateSeed('2026-04-18', 'tango');
    const b = dateSeed('2026-04-18', 'tango');
    expect(a).toBe(b);
  });

  it('returns different seeds for different dates', () => {
    const a = dateSeed('2026-04-18', 'tango');
    const b = dateSeed('2026-04-19', 'tango');
    expect(a).not.toBe(b);
  });

  it('returns different seeds for different game names', () => {
    const a = dateSeed('2026-04-18', 'tango');
    const b = dateSeed('2026-04-18', 'queens');
    expect(a).not.toBe(b);
  });

  it('returns a positive integer', () => {
    const seed = dateSeed('2026-01-01', 'tango');
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(seed)).toBe(true);
  });

  it('uses default game name "tango" when not specified', () => {
    const a = dateSeed('2026-04-18');
    const b = dateSeed('2026-04-18', 'tango');
    expect(a).toBe(b);
  });
});

describe('shuffle', () => {
  it('keeps all elements (no loss or duplication)', () => {
    const rng = createRNG(42);
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    shuffle(arr, rng);
    expect(arr.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('produces the same order with the same seed', () => {
    const arr1 = [1, 2, 3, 4, 5];
    const arr2 = [1, 2, 3, 4, 5];
    shuffle(arr1, createRNG(42));
    shuffle(arr2, createRNG(42));
    expect(arr1).toEqual(arr2);
  });

  it('produces different order with different seeds', () => {
    const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const arr2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    shuffle(arr1, createRNG(42));
    shuffle(arr2, createRNG(99));
    expect(arr1).not.toEqual(arr2);
  });

  it('returns the same array reference', () => {
    const arr = [1, 2, 3];
    const result = shuffle(arr, createRNG(42));
    expect(result).toBe(arr);
  });
});

describe('randInt', () => {
  it('stays within [min, max] over many iterations', () => {
    const rng = createRNG(42);
    for (let i = 0; i < 1000; i++) {
      const v = randInt(3, 7, rng);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });

  it('returns integers', () => {
    const rng = createRNG(42);
    for (let i = 0; i < 100; i++) {
      expect(Number.isInteger(randInt(0, 100, rng))).toBe(true);
    }
  });

  it('can return both endpoints', () => {
    const rng = createRNG(42);
    const values = new Set();
    for (let i = 0; i < 1000; i++) {
      values.add(randInt(0, 2, rng));
    }
    expect(values.has(0)).toBe(true);
    expect(values.has(2)).toBe(true);
  });

  it('returns min when min === max', () => {
    const rng = createRNG(42);
    expect(randInt(5, 5, rng)).toBe(5);
  });
});
