/**
 * Shared game shell — header, timer, controls chrome for all games.
 * @module shared/game-shell
 */

import { navigate } from '../router.js';

/**
 * Create the game shell DOM structure.
 *
 * @param {object} options
 * @param {string} options.title - Game name (e.g., 'TANGO')
 * @param {function} [options.onUndo] - Undo callback
 * @param {function} [options.onReset] - Reset callback
 * @returns {{
 *   shell: HTMLElement,
 *   boardContainer: HTMLElement,
 *   timerDisplay: HTMLElement,
 *   undoBtn: HTMLElement,
 *   resetBtn: HTMLElement,
 * }}
 */
export function createGameShell({ title, onUndo, onReset }) {
  const shell = document.createElement('div');
  shell.className = 'game-page';
  shell.innerHTML = `
    <header class="game-header">
      <button class="game-header__back" id="btn-back" aria-label="Back to hub">
        ← Back
      </button>
      <h1 class="game-header__title">${title}</h1>
      <div class="game-header__timer" role="timer" aria-label="Elapsed time" id="timer-display">
        00:00
      </div>
    </header>
    <div class="game-board" id="game-board"></div>
    <div class="game-controls">
      <button class="game-controls__btn" id="btn-undo" aria-label="Undo last move">
        Undo
      </button>
      <button class="game-controls__btn" id="btn-reset" aria-label="Reset puzzle">
        Reset
      </button>
    </div>
    <div id="sr-announcements" class="sr-only" aria-live="assertive" aria-atomic="true"></div>
  `;

  // Wire events
  shell.querySelector('#btn-back').addEventListener('click', () => navigate('/'));

  const undoBtn = shell.querySelector('#btn-undo');
  const resetBtn = shell.querySelector('#btn-reset');

  if (onUndo) undoBtn.addEventListener('click', onUndo);
  if (onReset) resetBtn.addEventListener('click', onReset);

  return {
    shell,
    boardContainer: shell.querySelector('#game-board'),
    timerDisplay: shell.querySelector('#timer-display'),
    undoBtn,
    resetBtn,
  };
}

/**
 * Announce a message to screen readers.
 * @param {string} message
 */
export function announce(message) {
  const el = document.getElementById('sr-announcements');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = message;
  });
}
