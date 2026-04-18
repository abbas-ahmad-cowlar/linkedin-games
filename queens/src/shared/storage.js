/**
 * localStorage wrapper with prefixed keys, JSON roundtrip, and error resilience.
 * @module shared/storage
 */

const PREFIX = 'lg_';

/**
 * Get a value from localStorage.
 * @param {string} key - Key (auto-prefixed with 'lg_')
 * @param {*} [fallback=null] - Default if key doesn't exist or parse fails
 * @returns {*} Parsed value or fallback
 */
export function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Set a value in localStorage.
 * @param {string} key - Key (auto-prefixed)
 * @param {*} value - JSON-serializable value
 * @returns {boolean} true if successful
 */
export function set(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove a key from localStorage.
 * @param {string} key - Key (auto-prefixed)
 */
export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // silently fail
  }
}

/**
 * Check if a key exists.
 * @param {string} key
 * @returns {boolean}
 */
export function has(key) {
  return localStorage.getItem(PREFIX + key) !== null;
}

/**
 * Get today's date as YYYY-MM-DD string.
 * @returns {string}
 */
export function getToday() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Get yesterday's date as YYYY-MM-DD string.
 * @returns {string}
 */
export function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Clear all lg_ prefixed keys (for debugging).
 */
export function clearAll() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
