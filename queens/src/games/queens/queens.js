/**
 * Queens Game Controller — Free-placement interaction model.
 *
 * KEY PRINCIPLE: Never block placement. Always allow tap cycle.
 * Show red striped errors on violating cells. Show toast for constraint errors.
 *
 * Tap cycle: empty → marker → queen → empty (always, no validation blocking)
 *
 * @module games/queens/queens
 */

import { CELL, createBoard, findQueens, findAllErrors, checkWin } from './queens-logic.js';
import { renderGrid, updateCell, highlightErrors, clearErrors } from './queens-renderer.js';
import {
  getDailyPuzzle,
  getPracticePuzzle,
  saveGameState,
  loadGameState,
} from './queens-daily.js';
import { createGameShell, announce } from '../../shared/game-shell.js';
import { createTimer, formatTime } from '../../shared/timer.js';
import { fireConfetti } from '../../shared/confetti.js';
import { showModal } from '../../shared/modal.js';
import { navigate } from '../../router.js';
import { recordWin, getStreak } from '../../shared/streak.js';
import * as storage from '../../shared/storage.js';

// ─── State ───────────────────────────────────────────────────────────────────

let state = 'LOADING'; // LOADING | PLAYING | COMPLETED
let board = null;       // (null|'queen'|'marker')[][]
let regionMap = null;   // number[][]
let solution = null;    // {r,c}[]
let size = 0;           // N
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
    title: 'QUEENS',
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
    validateAndHighlight();
    return;
  }

  const puzzleData = await getDailyPuzzle();
  loadFromPuzzle(puzzleData, shellParts);
  state = 'PLAYING';
}

function loadFromPuzzle(puzzleData, shellParts) {
  size = puzzleData.size;
  regionMap = puzzleData.regionMap;
  solution = puzzleData.solution;
  difficulty = puzzleData.difficulty;
  dayNumber = puzzleData.dayNumber;
  board = createBoard(size);
  moveHistory = [];
  firstMove = true;

  grid = renderGrid(puzzleData, handleCellClick, handleCellDrag, handleCellQueen);
  shellParts.boardContainer.appendChild(grid);

  timer = createTimer(shellParts.timerDisplay, 0);
  updateUndoState();
}

async function loadFromState(saved, shellParts) {
  size = saved.size;
  regionMap = saved.regionMap;
  solution = saved.solution;
  difficulty = saved.difficulty;
  dayNumber = saved.dayNumber;
  board = saved.board.map(row => [...row]);
  moveHistory = saved.moveHistory || [];

  const puzzleData = { size, regionMap };
  grid = renderGrid(puzzleData, handleCellClick, handleCellDrag, handleCellQueen);
  shellParts.boardContainer.appendChild(grid);

  // Apply saved board state
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] !== null) {
        updateCell(grid, r, c, board[r][c], { animate: false });
      }
    }
  }

  timer = createTimer(shellParts.timerDisplay, saved.elapsed || 0);
  updateUndoState();
}

function showCompletedState() {
  const saved = loadGameState();
  const streak = getStreak('queens');

  if (grid) {
    grid.classList.add('queens-grid--won');
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

  size = puzzleData.size;
  regionMap = puzzleData.regionMap;
  solution = puzzleData.solution;
  difficulty = puzzleData.difficulty;
  dayNumber = 0;
  board = createBoard(size);
  moveHistory = [];
  firstMove = true;

  if (grid) grid.remove();
  grid = renderGrid(puzzleData, handleCellClick, handleCellDrag, handleCellQueen);
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

  const current = board[row][col];
  let next;

  // Tap cycle: null → marker → queen → null
  if (current === null) next = CELL.MARKER;
  else if (current === CELL.MARKER) next = CELL.QUEEN;
  else next = null; // queen → clear

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
  } else if (next === CELL.QUEEN) {
    announce(`Queen placed at Row ${row + 1}, Column ${col + 1}.`);
  } else {
    announce(`Marker placed at Row ${row + 1}, Column ${col + 1}.`);
  }

  // Post-placement: validate entire board and highlight errors
  validateAndHighlight();

  // Win check: exactly N queens, no errors
  const queens = findQueens(board);
  if (queens.length === size && checkWin(board, regionMap)) {
    handleWin();
  }

  updateUndoState();
  autoSave();
}

// ─── Drag-to-Mark (paint markers on empty cells) ─────────────────────────────

/**
 * Handle dragging over a cell — places a marker if the cell is empty.
 * This mimics LinkedIn's "drag to mark" feature for quick note-taking.
 */
function handleCellDrag(row, col) {
  if (state !== 'PLAYING') return false;

  const current = board[row][col];
  // Only mark empty cells — don't overwrite queens or existing markers
  if (current !== null) return false;

  pushMove(row, col, null, CELL.MARKER);
  board[row][col] = CELL.MARKER;
  updateCell(grid, row, col, CELL.MARKER, { animate: false });

  // Start timer on first interaction
  if (firstMove) {
    timer.start();
    firstMove = false;
  }

  validateAndHighlight();
  updateUndoState();
  autoSave();
  return true;
}
// ─── Direct Queen Placement (right-click / double-click) ───────────────────

/**
 * Handle right-click or double-click — directly toggle a queen.
 * If cell is empty or has a marker, place a queen.
 * If cell already has a queen, remove it.
 */
function handleCellQueen(row, col) {
  if (state !== 'PLAYING') return;

  const current = board[row][col];
  const next = current === CELL.QUEEN ? null : CELL.QUEEN;

  pushMove(row, col, current, next);
  board[row][col] = next;
  updateCell(grid, row, col, next, { animate: next !== null });

  if (firstMove && next !== null) {
    timer.start();
    firstMove = false;
  }

  if (next === CELL.QUEEN) {
    announce(`Queen placed at Row ${row + 1}, Column ${col + 1}.`);
  } else {
    announce(`Row ${row + 1}, Column ${col + 1} cleared.`);
  }

  validateAndHighlight();

  const queens = findQueens(board);
  if (queens.length === size && checkWin(board, regionMap)) {
    handleWin();
  }

  updateUndoState();
  autoSave();
}

// ─── Validation & Error Highlighting ─────────────────────────────────────────

function validateAndHighlight() {
  const errors = findAllErrors(board, regionMap);
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

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      board[r][c] = null;
      updateCell(grid, r, c, null, { animate: false });
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
      board, regionMap, solution, size, difficulty, dayNumber,
      elapsed: timer ? timer.getElapsed() : 0,
      moveHistory,
      completed: state === 'COMPLETED',
    });
  }, 300);
}

// ─── Win Flow ────────────────────────────────────────────────────────────────

function handleWin() {
  state = 'COMPLETED';
  const elapsed = timer.stop();

  // Add win animation to grid
  grid.classList.add('queens-grid--won');

  let streakData = { current: 0, best: 0 };
  if (isDaily) {
    streakData = recordWin('queens');
    saveGameState({
      date: storage.getToday(),
      board, regionMap, solution, size, difficulty, dayNumber,
      elapsed, moveHistory, completed: true,
    });
  }

  // Queens-specific confetti colors (pastel palette)
  fireConfetti(['#EF6A6E', '#F5A843', '#7EC880', '#6EB5F5', '#B38EDC']);
  announce(`Puzzle solved! Time: ${formatTime(elapsed)}.`);

  setTimeout(() => {
    const stats = [
      { label: 'Time', value: formatTime(elapsed) },
      { label: 'Moves', value: String(moveHistory.length) },
      { label: 'Grid', value: `${size}×${size}` },
      { label: 'Difficulty', value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1) },
    ];
    if (isDaily) {
      stats.push({ label: 'Streak', value: `🔥 ${streakData.current}` });
    }

    showModal({
      title: '👑 Solved!',
      stats,
      actions: [
        { label: 'New Puzzle', variant: 'secondary', onClick: startPractice },
        { label: 'Hub →', variant: 'primary', onClick: () => navigate('/') },
      ],
    });
  }, 600);
}
