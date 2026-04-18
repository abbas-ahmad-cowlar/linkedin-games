/**
 * Tango Game Controller — Lifecycle, state, events, win flow.
 * Integrates daily pipeline, save/resume, and streak tracking.
 * @module games/tango/tango
 */

import { SYM, cloneBoard, isValidPlacement, checkWin } from './tango-logic.js';
import { renderGrid, updateCell, shakeCell } from './tango-renderer.js';
import {
  getDailyPuzzle,
  getPracticePuzzle,
  saveGameState,
  loadGameState,
  isDailyCompleted,
} from './tango-daily.js';
import { createGameShell, announce } from '../../shared/game-shell.js';
import { createTimer, formatTime } from '../../shared/timer.js';
import { fireConfetti } from '../../shared/confetti.js';
import { showModal } from '../../shared/modal.js';
import { navigate } from '../../router.js';
import { recordWin, getStreak } from '../../shared/streak.js';
import * as storage from '../../shared/storage.js';

// ─── State ───────────────────────────────────────────────────────────────────

let state = 'LOADING'; // LOADING | PLAYING | COMPLETED
let board = null;
let initialPuzzle = null;
let constraints = [];
let solution = null;
let difficulty = 'medium';
let dayNumber = 0;
let moveHistory = [];
let timer = null;
let grid = null;
let shell = null;
let firstMove = true;
let isDaily = true;
let saveDebounceId = null;

// ─── Lifecycle ───────────────────────────────────────────────────────────────

/**
 * Mount the Tango game into a container.
 * @param {HTMLElement} container
 */
export async function mount(container) {
  state = 'LOADING';
  isDaily = true;

  // Build game shell first (shows loading state)
  const shellParts = createGameShell({
    title: 'TANGO',
    onUndo: handleUndo,
    onReset: handleReset,
  });
  shell = shellParts;
  container.appendChild(shellParts.shell);

  // Check for saved state
  const saved = loadGameState();

  if (saved && saved.completed) {
    // Already completed today — show completed state
    await loadFromState(saved, shellParts);
    state = 'COMPLETED';
    showCompletedState();
    return;
  }

  if (saved && !saved.completed) {
    // Resume in-progress game
    await loadFromState(saved, shellParts);
    state = 'PLAYING';
    firstMove = false;
    timer.start();
    return;
  }

  // No saved state — generate daily puzzle
  const puzzleData = await getDailyPuzzle();
  loadFromPuzzle(puzzleData, shellParts);
  state = 'PLAYING';
}

/**
 * Load game from puzzle data (fresh start).
 */
function loadFromPuzzle(puzzleData, shellParts) {
  board = cloneBoard(puzzleData.puzzle);
  initialPuzzle = puzzleData.puzzle;
  constraints = puzzleData.constraints;
  solution = puzzleData.solution;
  difficulty = puzzleData.difficulty;
  dayNumber = puzzleData.dayNumber;
  moveHistory = [];
  firstMove = true;

  grid = renderGrid(puzzleData, handleCellClick);
  shellParts.boardContainer.appendChild(grid);

  timer = createTimer(shellParts.timerDisplay, 0);
  updateUndoState();
}

/**
 * Load game from saved state (resume).
 */
async function loadFromState(saved, shellParts) {
  board = saved.board.map(row => [...row]);
  initialPuzzle = saved.initialPuzzle;
  constraints = saved.constraints;
  solution = saved.solution;
  difficulty = saved.difficulty;
  dayNumber = saved.dayNumber;
  moveHistory = saved.moveHistory || [];

  // Reconstruct puzzle data for renderer
  const puzzleData = { puzzle: saved.initialPuzzle, constraints: saved.constraints };
  grid = renderGrid(puzzleData, handleCellClick);
  shellParts.boardContainer.appendChild(grid);

  // Apply saved moves to the grid display
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (initialPuzzle[r][c] === null && board[r][c] !== null) {
        updateCell(grid, r, c, board[r][c], { animate: false });
      }
    }
  }

  timer = createTimer(shellParts.timerDisplay, saved.elapsed || 0);
  updateUndoState();
}

/**
 * Show completed state (already solved today).
 */
function showCompletedState() {
  const saved = loadGameState();
  const streak = getStreak('tango');

  // Disable grid interactions
  if (grid) {
    grid.style.pointerEvents = 'none';
    grid.style.opacity = '0.85';
  }

  // Show completion banner
  setTimeout(() => {
    showModal({
      title: '✅ Already Solved!',
      stats: [
        { label: 'Time', value: formatTime(saved?.elapsed || 0) },
        { label: 'Streak', value: `🔥 ${streak.current}` },
        { label: 'Best Streak', value: `🔥 ${streak.best}` },
      ],
      actions: [
        {
          label: 'Practice',
          variant: 'secondary',
          onClick: () => startPractice(),
        },
        {
          label: 'Hub →',
          variant: 'primary',
          onClick: () => navigate('/'),
        },
      ],
    });
  }, 300);
}

/**
 * Start a practice (non-daily) puzzle.
 */
function startPractice() {
  isDaily = false;
  const puzzleData = getPracticePuzzle();

  // Clear and rebuild
  board = cloneBoard(puzzleData.puzzle);
  initialPuzzle = puzzleData.puzzle;
  constraints = puzzleData.constraints;
  solution = puzzleData.solution;
  difficulty = puzzleData.difficulty;
  dayNumber = 0;
  moveHistory = [];
  firstMove = true;

  // Rebuild grid
  if (grid) grid.remove();
  grid = renderGrid(puzzleData, handleCellClick);
  shell.boardContainer.appendChild(grid);

  // Reset timer
  if (timer) timer.destroy();
  timer = createTimer(shell.timerDisplay, 0);
  updateUndoState();

  state = 'PLAYING';
}

/**
 * Unmount the Tango game.
 */
export function unmount() {
  if (timer) {
    timer.destroy();
    timer = null;
  }
  if (saveDebounceId) {
    clearTimeout(saveDebounceId);
    saveDebounceId = null;
  }
  grid = null;
  shell = null;
  state = 'LOADING';
}

// ─── Auto-Save (debounced) ───────────────────────────────────────────────────

function autoSave() {
  if (!isDaily) return; // Don't save practice games
  if (saveDebounceId) clearTimeout(saveDebounceId);

  saveDebounceId = setTimeout(() => {
    saveGameState({
      date: storage.getToday(),
      board,
      constraints,
      solution,
      difficulty,
      dayNumber,
      elapsed: timer ? timer.getElapsed() : 0,
      moveHistory,
      completed: state === 'COMPLETED',
      initialPuzzle,
    });
  }, 300);
}

// ─── Interaction ─────────────────────────────────────────────────────────────

/**
 * Handle a cell click (tap cycle).
 */
function handleCellClick(row, col) {
  if (state !== 'PLAYING') return;
  if (initialPuzzle[row][col] !== null) return;

  const current = board[row][col];
  let next;

  // Cycle: null → sun → moon → null
  if (current === null) next = SYM.SUN;
  else if (current === SYM.SUN) next = SYM.MOON;
  else next = null;

  if (next === null) {
    pushMove(row, col, current, null);
    board[row][col] = null;
    updateCell(grid, row, col, null, { animate: false });
    announce(`Row ${row + 1}, Column ${col + 1} cleared.`);
  } else {
    const check = isValidPlacement(board, row, col, next, constraints);
    if (check.valid) {
      pushMove(row, col, current, next);
      board[row][col] = next;
      updateCell(grid, row, col, next, { animate: true });
      announce(`${next} placed at Row ${row + 1}, Column ${col + 1}.`);

      if (firstMove) {
        timer.start();
        firstMove = false;
      }

      if (checkWin(board, constraints)) {
        handleWin();
      }
    } else {
      // Try the other symbol
      const other = next === SYM.SUN ? SYM.MOON : SYM.SUN;
      const checkOther = isValidPlacement(board, row, col, other, constraints);

      if (current === null && checkOther.valid) {
        pushMove(row, col, current, other);
        board[row][col] = other;
        updateCell(grid, row, col, other, { animate: true });
        announce(`${other} placed at Row ${row + 1}, Column ${col + 1}.`);

        if (firstMove) {
          timer.start();
          firstMove = false;
        }

        if (checkWin(board, constraints)) {
          handleWin();
        }
      } else {
        shakeCell(grid, row, col);
        announce(`Invalid placement. ${check.reason}`);
      }
    }
  }

  updateUndoState();
  autoSave();
}

// ─── Move History ────────────────────────────────────────────────────────────

function pushMove(row, col, from, to) {
  moveHistory.push({ row, col, from, to });
}

function handleUndo() {
  if (state !== 'PLAYING' || moveHistory.length === 0) return;

  const move = moveHistory.pop();
  board[move.row][move.col] = move.from;
  updateCell(grid, move.row, move.col, move.from, { animate: false });
  announce(`Undo. Row ${move.row + 1}, Column ${move.col + 1} restored.`);
  updateUndoState();
  autoSave();
}

function handleReset() {
  if (state !== 'PLAYING') return;

  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (initialPuzzle[r][c] === null) {
        board[r][c] = null;
        updateCell(grid, r, c, null, { animate: false });
      }
    }
  }
  moveHistory = [];
  timer.reset();
  firstMove = true;
  updateUndoState();
  autoSave();
  announce('Puzzle reset.');
}

function updateUndoState() {
  if (shell && shell.undoBtn) {
    shell.undoBtn.disabled = moveHistory.length === 0;
  }
}

// ─── Win Flow ────────────────────────────────────────────────────────────────

function handleWin() {
  state = 'COMPLETED';
  const elapsed = timer.stop();

  // Record streak (daily only)
  let streakData = { current: 0, best: 0 };
  if (isDaily) {
    streakData = recordWin('tango');
    // Save completed state
    saveGameState({
      date: storage.getToday(),
      board,
      constraints,
      solution,
      difficulty,
      dayNumber,
      elapsed,
      moveHistory,
      completed: true,
      initialPuzzle,
    });
  }

  fireConfetti(['#FFD54F', '#B39DDB', '#57C47A', '#70B5F9', '#F4A0B5']);
  announce(`Puzzle solved! Time: ${formatTime(elapsed)}.${isDaily ? ` Streak: ${streakData.current} days.` : ''}`);

  setTimeout(() => {
    const stats = [
      { label: 'Time', value: formatTime(elapsed) },
      { label: 'Moves', value: String(moveHistory.length) },
      { label: 'Difficulty', value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1) },
    ];

    if (isDaily) {
      stats.push({ label: 'Streak', value: `🔥 ${streakData.current}` });
      stats.push({ label: 'Best', value: `🔥 ${streakData.best}` });
    }

    showModal({
      title: '🎉 Solved!',
      stats,
      actions: [
        {
          label: 'New Puzzle',
          variant: 'secondary',
          onClick: () => startPractice(),
        },
        {
          label: 'Hub →',
          variant: 'primary',
          onClick: () => navigate('/'),
        },
      ],
    });
  }, 600);
}
