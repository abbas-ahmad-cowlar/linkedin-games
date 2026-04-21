/**
 * Shared game shell — header, timer, controls chrome for all games.
 * @module shared/game-shell
 */

// No router import needed — back button uses window.location

/**
 * Create the game shell DOM structure.
 *
 * @param {object} options
 * @param {string} options.title - Game name (e.g., 'TANGO')
 * @param {string} [options.difficulty] - Difficulty level (easy/medium/hard)
 * @param {function} [options.onUndo] - Undo callback
 * @param {function} [options.onReset] - Reset callback
 * @param {function} [options.onHint] - Hint callback
 * @returns {{
 *   shell: HTMLElement,
 *   boardContainer: HTMLElement,
 *   timerDisplay: HTMLElement,
 *   undoBtn: HTMLElement,
 *   resetBtn: HTMLElement,
 *   hintBtn: HTMLElement|null,
 *   hintPanel: HTMLElement|null,
 *   difficultyBadge: HTMLElement|null,
 * }}
 */
export function createGameShell({ title, difficulty, onUndo, onReset, onHint }) {
  const shell = document.createElement('div');
  shell.className = 'game-page';

  const diffBadgeHTML = difficulty
    ? `<span class="game-header__badge game-header__badge--${difficulty}">${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>`
    : '';

  const hintBtnHTML = onHint
    ? `<button class="game-controls__btn game-controls__btn--hint" id="btn-hint" aria-label="Get a hint">Hint</button>`
    : '';

  shell.innerHTML = `
    <header class="game-header">
      <button class="game-header__back" id="btn-back" aria-label="Back to hub">
        ← Back
      </button>
      <div class="game-header__center">
        <h1 class="game-header__title">${title}</h1>
        ${diffBadgeHTML}
      </div>
      <div class="game-header__timer" role="timer" aria-label="Elapsed time" id="timer-display">
        00:00
      </div>
    </header>
    <div class="game-board" id="game-board"></div>
    <div class="game-controls">
      <button class="game-controls__btn" id="btn-undo" aria-label="Undo last move">
        Undo
      </button>
      ${hintBtnHTML}
      <button class="game-controls__btn" id="btn-reset" aria-label="Reset puzzle">
        Reset
      </button>
    </div>
    <div id="hint-panel" class="hint-panel" style="display:none;"></div>
    <div id="sr-announcements" class="sr-only" aria-live="assertive" aria-atomic="true"></div>
  `;

  // Wire events — back navigates to the hub
  shell.querySelector('#btn-back').addEventListener('click', () => {
    // Use hash navigation (same SPA)
    location.hash = '#/';
  });

  const undoBtn = shell.querySelector('#btn-undo');
  const resetBtn = shell.querySelector('#btn-reset');
  const hintBtn = shell.querySelector('#btn-hint');

  if (onUndo) undoBtn.addEventListener('click', onUndo);
  if (onReset) resetBtn.addEventListener('click', onReset);
  if (onHint && hintBtn) hintBtn.addEventListener('click', onHint);

  return {
    shell,
    boardContainer: shell.querySelector('#game-board'),
    timerDisplay: shell.querySelector('#timer-display'),
    undoBtn,
    resetBtn,
    hintBtn,
    hintPanel: shell.querySelector('#hint-panel'),
    difficultyBadge: shell.querySelector('.game-header__badge'),
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
