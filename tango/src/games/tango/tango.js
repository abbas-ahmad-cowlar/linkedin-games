/**
 * Tango Game Controller — Correct LinkedIn-matching interaction model.
 *
 * KEY PRINCIPLE: Never block placement. Always allow tap cycle.
 * Show red striped errors on violating cells. Show toast for constraint errors.
 *
 * Tap cycle: empty → sun → moon → empty (always, no validation blocking)
 *
 * @module games/tango/tango
 */

import { SYM, SIZE, cloneBoard, checkWin } from './tango-logic.js';
import { renderGrid, updateCell, highlightErrors, clearErrors } from './tango-renderer.js';
import {
  getDailyPuzzle,
  getPracticePuzzle,
  saveGameState,
  loadGameState,
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
let toastTimeout = null;

// ─── Lifecycle ───────────────────────────────────────────────────────────────

export async function mount(container) {
  state = 'LOADING';
  isDaily = true;

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
    await loadFromState(saved, shellParts);
    state = 'COMPLETED';
    showCompletedState();
    return;
  }

  if (saved && !saved.completed) {
    await loadFromState(saved, shellParts);
    state = 'PLAYING';
    firstMove = false;
    timer.start();
    // Validate current board state
    validateAndHighlight();
    return;
  }

  const puzzleData = await getDailyPuzzle();
  loadFromPuzzle(puzzleData, shellParts);
  state = 'PLAYING';
}

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

async function loadFromState(saved, shellParts) {
  board = saved.board.map(row => [...row]);
  initialPuzzle = saved.initialPuzzle;
  constraints = saved.constraints;
  solution = saved.solution;
  difficulty = saved.difficulty;
  dayNumber = saved.dayNumber;
  moveHistory = saved.moveHistory || [];

  const puzzleData = { puzzle: saved.initialPuzzle, constraints: saved.constraints };
  grid = renderGrid(puzzleData, handleCellClick);
  shellParts.boardContainer.appendChild(grid);

  // Apply saved board state
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (initialPuzzle[r][c] === null && board[r][c] !== null) {
        updateCell(grid, r, c, board[r][c], { animate: false });
      }
    }
  }

  timer = createTimer(shellParts.timerDisplay, saved.elapsed || 0);
  updateUndoState();
}

function showCompletedState() {
  const saved = loadGameState();
  const streak = getStreak('tango');

  if (grid) {
    grid.style.pointerEvents = 'none';
    grid.style.opacity = '0.85';
  }

  setTimeout(() => {
    showModal({
      title: '✅ Already Solved!',
      stats: [
        { label: 'Time', value: formatTime(saved?.elapsed || 0) },
        { label: 'Streak', value: `🔥 ${streak.current}` },
        { label: 'Best Streak', value: `🔥 ${streak.best}` },
      ],
      actions: [
        { label: 'Practice', variant: 'secondary', onClick: startPractice },
        { label: 'Hub →', variant: 'primary', onClick: () => navigate('/') },
      ],
    });
  }, 300);
}

function startPractice() {
  isDaily = false;
  const puzzleData = getPracticePuzzle();

  board = cloneBoard(puzzleData.puzzle);
  initialPuzzle = puzzleData.puzzle;
  constraints = puzzleData.constraints;
  solution = puzzleData.solution;
  difficulty = puzzleData.difficulty;
  dayNumber = 0;
  moveHistory = [];
  firstMove = true;

  if (grid) grid.remove();
  grid = renderGrid(puzzleData, handleCellClick);
  shell.boardContainer.appendChild(grid);

  if (timer) timer.destroy();
  timer = createTimer(shell.timerDisplay, 0);
  updateUndoState();
  clearToast();
  state = 'PLAYING';
}

export function unmount() {
  if (timer) { timer.destroy(); timer = null; }
  if (saveDebounceId) { clearTimeout(saveDebounceId); saveDebounceId = null; }
  clearToast();
  grid = null;
  shell = null;
  state = 'LOADING';
}

// ─── Core Interaction: FREE placement with post-validation ───────────────────

function handleCellClick(row, col) {
  if (state !== 'PLAYING') return;
  if (initialPuzzle[row][col] !== null) return; // Locked

  const current = board[row][col];
  let next;

  // Simple tap cycle: null → sun → moon → null
  if (current === null) next = SYM.SUN;
  else if (current === SYM.SUN) next = SYM.MOON;
  else next = null; // moon → null (clear)

  // ALWAYS place — never block
  pushMove(row, col, current, next);
  board[row][col] = next;
  updateCell(grid, row, col, next, { animate: next !== null });

  // Start timer on first move
  if (firstMove && next !== null) {
    timer.start();
    firstMove = false;
  }

  // Announce
  if (next === null) {
    announce(`Row ${row + 1}, Column ${col + 1} cleared.`);
  } else {
    announce(`${next} placed at Row ${row + 1}, Column ${col + 1}.`);
  }

  // Post-placement: validate entire board and highlight errors
  validateAndHighlight();

  // Check for win (only if board is complete and no errors)
  if (isBoardFull() && checkWin(board, constraints)) {
    handleWin();
  }

  updateUndoState();
  autoSave();
}

// ─── Validation & Error Highlighting ─────────────────────────────────────────

function validateAndHighlight() {
  const errors = findAllErrors();
  clearErrors(grid);

  if (errors.cells.size > 0) {
    highlightErrors(grid, errors.cells);
  }

  // Show toast for constraint violations
  if (errors.message) {
    showToast(errors.message);
  } else {
    clearToast();
  }
}

/**
 * Find all rule violations on the current board.
 * Returns: { cells: Set<string>, message: string|null }
 */
function findAllErrors() {
  const errorCells = new Set(); // "row,col" strings
  let message = null;

  // Check each row and column
  for (let i = 0; i < SIZE; i++) {
    // --- Balance check: more than 3 of either symbol ---
    let rowSuns = 0, rowMoons = 0, colSuns = 0, colMoons = 0;
    for (let j = 0; j < SIZE; j++) {
      if (board[i][j] === SYM.SUN) rowSuns++;
      if (board[i][j] === SYM.MOON) rowMoons++;
      if (board[j][i] === SYM.SUN) colSuns++;
      if (board[j][i] === SYM.MOON) colMoons++;
    }

    if (rowSuns > 3) {
      // Mark all suns in this row
      for (let j = 0; j < SIZE; j++) {
        if (board[i][j] === SYM.SUN) errorCells.add(`${i},${j}`);
      }
    }
    if (rowMoons > 3) {
      for (let j = 0; j < SIZE; j++) {
        if (board[i][j] === SYM.MOON) errorCells.add(`${i},${j}`);
      }
    }
    if (colSuns > 3) {
      for (let j = 0; j < SIZE; j++) {
        if (board[j][i] === SYM.SUN) errorCells.add(`${j},${i}`);
      }
    }
    if (colMoons > 3) {
      for (let j = 0; j < SIZE; j++) {
        if (board[j][i] === SYM.MOON) errorCells.add(`${j},${i}`);
      }
    }

    // --- Three consecutive (row) ---
    for (let j = 0; j <= SIZE - 3; j++) {
      const a = board[i][j], b = board[i][j + 1], c = board[i][j + 2];
      if (a !== null && a === b && b === c) {
        errorCells.add(`${i},${j}`);
        errorCells.add(`${i},${j + 1}`);
        errorCells.add(`${i},${j + 2}`);
      }
    }

    // --- Three consecutive (column) ---
    for (let j = 0; j <= SIZE - 3; j++) {
      const a = board[j][i], b = board[j + 1][i], c = board[j + 2][i];
      if (a !== null && a === b && b === c) {
        errorCells.add(`${j},${i}`);
        errorCells.add(`${j + 1},${i}`);
        errorCells.add(`${j + 2},${i}`);
      }
    }
  }

  // --- Constraint violations ---
  for (const con of constraints) {
    const { r1, c1, r2, c2, type } = con;
    const v1 = board[r1][c1];
    const v2 = board[r2][c2];

    if (v1 === null || v2 === null) continue; // Skip if either cell empty

    if (type === 'same' && v1 !== v2) {
      errorCells.add(`${r1},${c1}`);
      errorCells.add(`${r2},${c2}`);
      message = 'Oops! Use identical shapes to join cells with a =.';
    }

    if (type === 'diff' && v1 === v2) {
      errorCells.add(`${r1},${c1}`);
      errorCells.add(`${r2},${c2}`);
      message = 'Oops! Use different shapes to join cells with a ×.';
    }
  }

  return { cells: errorCells, message };
}

function isBoardFull() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === null) return false;
    }
  }
  return true;
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function showToast(msg) {
  clearToast();
  let toast = shell.shell.querySelector('.game-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'game-toast';
    shell.shell.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('game-toast--visible');

  toastTimeout = setTimeout(() => {
    toast.classList.remove('game-toast--visible');
  }, 4000);
}

function clearToast() {
  if (toastTimeout) { clearTimeout(toastTimeout); toastTimeout = null; }
  const toast = shell?.shell?.querySelector('.game-toast');
  if (toast) toast.classList.remove('game-toast--visible');
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
  validateAndHighlight();
  updateUndoState();
  autoSave();
}

function handleReset() {
  if (state !== 'PLAYING') return;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (initialPuzzle[r][c] === null) {
        board[r][c] = null;
        updateCell(grid, r, c, null, { animate: false });
      }
    }
  }
  moveHistory = [];
  timer.reset();
  firstMove = true;
  clearErrors(grid);
  clearToast();
  updateUndoState();
  autoSave();
  announce('Puzzle reset.');
}

function updateUndoState() {
  if (shell?.undoBtn) shell.undoBtn.disabled = moveHistory.length === 0;
}

// ─── Auto-Save ───────────────────────────────────────────────────────────────

function autoSave() {
  if (!isDaily) return;
  if (saveDebounceId) clearTimeout(saveDebounceId);

  saveDebounceId = setTimeout(() => {
    saveGameState({
      date: storage.getToday(),
      board, constraints, solution, difficulty, dayNumber,
      elapsed: timer ? timer.getElapsed() : 0,
      moveHistory,
      completed: state === 'COMPLETED',
      initialPuzzle,
    });
  }, 300);
}

// ─── Win Flow ────────────────────────────────────────────────────────────────

function handleWin() {
  state = 'COMPLETED';
  const elapsed = timer.stop();

  let streakData = { current: 0, best: 0 };
  if (isDaily) {
    streakData = recordWin('tango');
    saveGameState({
      date: storage.getToday(),
      board, constraints, solution, difficulty, dayNumber,
      elapsed, moveHistory, completed: true, initialPuzzle,
    });
  }

  fireConfetti(['#F5A623', '#8EAFC0', '#57C47A', '#70B5F9', '#F4A0B5']);
  announce(`Puzzle solved! Time: ${formatTime(elapsed)}.`);

  setTimeout(() => {
    const stats = [
      { label: 'Time', value: formatTime(elapsed) },
      { label: 'Moves', value: String(moveHistory.length) },
      { label: 'Difficulty', value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1) },
    ];
    if (isDaily) {
      stats.push({ label: 'Streak', value: `🔥 ${streakData.current}` });
    }

    showModal({
      title: '🎉 Solved!',
      stats,
      actions: [
        { label: 'New Puzzle', variant: 'secondary', onClick: startPractice },
        { label: 'Hub →', variant: 'primary', onClick: () => navigate('/') },
      ],
    });
  }, 600);
}
