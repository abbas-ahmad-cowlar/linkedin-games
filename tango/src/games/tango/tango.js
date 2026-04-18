/**
 * Tango Game Controller — Lifecycle, state, events, win flow.
 * @module games/tango/tango
 */

import { SYM, cloneBoard, isValidPlacement, checkWin } from './tango-logic.js';
import { generatePuzzle } from './tango-generator.js';
import { renderGrid, updateCell, shakeCell } from './tango-renderer.js';
import { createGameShell, announce } from '../../shared/game-shell.js';
import { createTimer, formatTime } from '../../shared/timer.js';
import { fireConfetti } from '../../shared/confetti.js';
import { showModal } from '../../shared/modal.js';
import { navigate } from '../../router.js';
import { createRNG } from '../../shared/rng.js';

// ─── State ───────────────────────────────────────────────────────────────────

let state = 'LOADING'; // LOADING | PLAYING | COMPLETED
let board = null;
let initialPuzzle = null;
let constraints = [];
let solution = null;
let difficulty = 'medium';
let moveHistory = [];
let timer = null;
let grid = null;
let shell = null;
let firstMove = true;

// ─── Lifecycle ───────────────────────────────────────────────────────────────

/**
 * Mount the Tango game into a container.
 * @param {HTMLElement} container
 */
export async function mount(container) {
  state = 'LOADING';

  // Generate a puzzle (for now, random seed; Phase 3 adds daily seeding)
  const seed = Math.floor(Math.random() * 2147483647);
  const rng = createRNG(seed);
  const difficulties = ['easy', 'medium', 'hard'];
  difficulty = difficulties[Math.floor(Math.random() * 3)];
  const puzzleData = generatePuzzle(difficulty, rng);

  board = cloneBoard(puzzleData.puzzle);
  initialPuzzle = puzzleData.puzzle;
  constraints = puzzleData.constraints;
  solution = puzzleData.solution;
  moveHistory = [];
  firstMove = true;

  // Build game shell
  const shellParts = createGameShell({
    title: 'TANGO',
    onUndo: handleUndo,
    onReset: handleReset,
  });
  shell = shellParts;

  container.appendChild(shellParts.shell);

  // Build grid
  grid = renderGrid(puzzleData, handleCellClick);
  shellParts.boardContainer.appendChild(grid);

  // Create timer
  timer = createTimer(shellParts.timerDisplay, 0);

  // Update undo button state
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
  grid = null;
  shell = null;
  state = 'LOADING';
}

// ─── Interaction ─────────────────────────────────────────────────────────────

/**
 * Handle a cell click (tap cycle).
 * @param {number} row
 * @param {number} col
 */
function handleCellClick(row, col) {
  if (state !== 'PLAYING') return;

  // Check if cell is locked (pre-filled)
  if (initialPuzzle[row][col] !== null) return;

  const current = board[row][col];
  let next;

  // Cycle: null → sun → moon → null
  if (current === null) next = SYM.SUN;
  else if (current === SYM.SUN) next = SYM.MOON;
  else next = null;

  if (next === null) {
    // Clearing is always valid
    pushMove(row, col, current, null);
    board[row][col] = null;
    updateCell(grid, row, col, null, { animate: false });
    announce(`Row ${row + 1}, Column ${col + 1} cleared.`);
  } else {
    // Validate placement
    const check = isValidPlacement(board, row, col, next, constraints);
    if (check.valid) {
      pushMove(row, col, current, next);
      board[row][col] = next;
      updateCell(grid, row, col, next, { animate: true });
      announce(`${next} placed at Row ${row + 1}, Column ${col + 1}.`);

      // Start timer on first valid move
      if (firstMove) {
        timer.start();
        firstMove = false;
      }

      // Check for win
      if (checkWin(board, constraints)) {
        handleWin();
      }
    } else {
      // Invalid placement — try the other symbol
      const other = next === SYM.SUN ? SYM.MOON : SYM.SUN;
      const checkOther = isValidPlacement(board, row, col, other, constraints);

      if (current === null && checkOther.valid) {
        // Skip to the valid symbol
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
        // Both invalid or switching — shake
        shakeCell(grid, row, col);
        announce(`Invalid placement. ${check.reason}`);
      }
    }
  }

  updateUndoState();
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

  // Fire confetti with Tango colors
  fireConfetti(['#FFD54F', '#B39DDB', '#57C47A', '#70B5F9', '#F4A0B5']);

  announce(`Puzzle solved! Time: ${formatTime(elapsed)}.`);

  // Show results modal after a short delay
  setTimeout(() => {
    showModal({
      title: '🎉 Solved!',
      stats: [
        { label: 'Time', value: formatTime(elapsed) },
        { label: 'Moves', value: String(moveHistory.length) },
        { label: 'Difficulty', value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1) },
      ],
      actions: [
        {
          label: 'New Puzzle',
          variant: 'secondary',
          onClick: () => {
            // Reload with new random puzzle
            const container = shell.shell.parentElement;
            unmount();
            container.innerHTML = '';
            mount(container);
          },
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
