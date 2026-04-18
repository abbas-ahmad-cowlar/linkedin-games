/**
 * Game timer — tracks elapsed time with mm:ss display.
 * @module shared/timer
 */

/**
 * Create a game timer.
 *
 * @param {HTMLElement} displayEl - Element to render "mm:ss" into
 * @param {number} [initialSeconds=0] - Resume from this elapsed time
 * @returns {{
 *   start: () => void,
 *   stop: () => number,
 *   pause: () => void,
 *   resume: () => void,
 *   reset: () => void,
 *   getElapsed: () => number,
 *   isRunning: () => boolean,
 * }}
 */
export function createTimer(displayEl, initialSeconds = 0) {
  let elapsed = initialSeconds; // Total seconds elapsed
  let startTime = null;        // When current run started (ms)
  let intervalId = null;
  let running = false;

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function updateDisplay() {
    if (displayEl) {
      displayEl.textContent = formatTime(getElapsed());
    }
  }

  function getElapsed() {
    if (running && startTime !== null) {
      return elapsed + (Date.now() - startTime) / 1000;
    }
    return elapsed;
  }

  function start() {
    if (running) return;
    running = true;
    startTime = Date.now();
    updateDisplay();
    intervalId = setInterval(updateDisplay, 1000);
  }

  function stop() {
    if (running) {
      elapsed += (Date.now() - startTime) / 1000;
      running = false;
      startTime = null;
    }
    clearInterval(intervalId);
    intervalId = null;
    updateDisplay();
    return Math.floor(elapsed);
  }

  function pause() {
    if (!running) return;
    elapsed += (Date.now() - startTime) / 1000;
    running = false;
    startTime = null;
    clearInterval(intervalId);
    intervalId = null;
  }

  function resume() {
    if (running) return;
    start();
  }

  function reset() {
    stop();
    elapsed = 0;
    updateDisplay();
  }

  // Pause on tab hidden, resume on visible
  function handleVisibility() {
    if (document.hidden) {
      if (running) pause();
    }
    // Note: we don't auto-resume on visible — game decides when to resume
  }

  document.addEventListener('visibilitychange', handleVisibility);

  // Initial display
  updateDisplay();

  return {
    start,
    stop,
    pause,
    resume,
    reset,
    getElapsed: () => Math.floor(getElapsed()),
    isRunning: () => running,
    destroy: () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    },
  };
}

/**
 * Format seconds as mm:ss string.
 * @param {number} seconds
 * @returns {string}
 */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
