/**
 * Seeded Pseudo-Random Number Generator (PRNG) — mulberry32 algorithm.
 *
 * Provides deterministic random number generation for daily puzzle seeding.
 * Same seed always produces the same sequence of numbers.
 *
 * @module shared/rng
 */

/**
 * Creates a seeded PRNG using the mulberry32 algorithm.
 * A fast, high-quality 32-bit generator with excellent distribution.
 *
 * @param {number} seed - Integer seed value
 * @returns {function(): number} Function that returns floats in [0, 1)
 *
 * @example
 *   const rng = createRNG(42);
 *   rng(); // 0.6011037519201636  (always the same for seed 42)
 *   rng(); // 0.44916992192156613
 */
export function createRNG(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Converts a date string + game name into a deterministic integer seed.
 * Uses a simple DJB2-style hash to map strings → integers.
 *
 * @param {string} dateStr - Date in "YYYY-MM-DD" format
 * @param {string} [gameName='queens'] - Game identifier for uniqueness
 * @returns {number} Positive integer seed
 */
export function dateSeed(dateStr, gameName = 'queens') {
  const str = `${gameName}_${dateStr}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Shuffle an array in-place using the Fisher-Yates algorithm
 * with the provided seeded RNG.
 *
 * @param {Array} arr - Array to shuffle (mutated in-place)
 * @param {function(): number} rng - PRNG function returning [0, 1)
 * @returns {Array} The same array reference, now shuffled
 */
export function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Pick a random integer in [min, max] (inclusive) using the provided RNG.
 *
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @param {function(): number} rng - PRNG function returning [0, 1)
 * @returns {number} Random integer in [min, max]
 */
export function randInt(min, max, rng) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
