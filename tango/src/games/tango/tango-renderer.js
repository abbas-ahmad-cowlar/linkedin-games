/**
 * Tango Grid Renderer — Builds and updates the 6×6 game grid DOM.
 * @module games/tango/tango-renderer
 */

import { SIZE, SYM } from './tango-logic.js';

// ─── Grid Builder ────────────────────────────────────────────────────────────

/**
 * Build the full grid DOM for a Tango puzzle.
 *
 * @param {object} puzzle - { puzzle: Board, constraints: Constraint[] }
 * @param {function(number, number): void} onCellClick - (row, col) callback
 * @returns {HTMLElement} The .tango-grid element
 */
export function renderGrid(puzzle, onCellClick) {
  const grid = document.createElement('div');
  grid.className = 'tango-grid';
  grid.setAttribute('role', 'grid');
  grid.setAttribute('aria-label', 'Tango puzzle. 6 by 6 grid.');

  // Create cells
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'tango-cell';
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('tabindex', '0');
      cell.dataset.row = r;
      cell.dataset.col = c;

      const value = puzzle.puzzle[r][c];
      if (value !== null) {
        applyCellSymbol(cell, value, false);
        cell.classList.add('tango-cell--locked');
        cell.setAttribute('aria-label', `Row ${r + 1}, Column ${c + 1}. ${value}. Pre-filled.`);
      } else {
        cell.setAttribute('aria-label', `Row ${r + 1}, Column ${c + 1}. Empty.`);
      }

      grid.appendChild(cell);
    }
  }

  // Create constraint markers
  for (const con of puzzle.constraints) {
    const marker = createConstraintMarker(con);
    grid.appendChild(marker);
  }

  // Event delegation — single click listener
  grid.addEventListener('click', (e) => {
    const cell = e.target.closest('.tango-cell');
    if (!cell) return;
    onCellClick(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
  });

  // Keyboard navigation
  grid.addEventListener('keydown', (e) => {
    const cell = e.target.closest('.tango-cell');
    if (!cell) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    let nextRow = row, nextCol = col;

    switch (e.key) {
      case 'ArrowUp':    nextRow = Math.max(0, row - 1); break;
      case 'ArrowDown':  nextRow = Math.min(SIZE - 1, row + 1); break;
      case 'ArrowLeft':  nextCol = Math.max(0, col - 1); break;
      case 'ArrowRight': nextCol = Math.min(SIZE - 1, col + 1); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onCellClick(row, col);
        return;
      default: return;
    }

    e.preventDefault();
    const nextCell = grid.querySelector(`[data-row="${nextRow}"][data-col="${nextCol}"]`);
    if (nextCell) nextCell.focus();
  });

  return grid;
}

// ─── Cell Updates ────────────────────────────────────────────────────────────

/**
 * Apply a symbol to a cell element. No colored backgrounds — matches LinkedIn.
 */
export function applyCellSymbol(cell, symbol, animate = true) {
  // Remove existing symbol
  const existingSymbol = cell.querySelector('.tango-symbol');
  if (existingSymbol) existingSymbol.remove();

  // Remove error state when cell changes
  cell.classList.remove('tango-cell--error');

  const row = cell.dataset.row;
  const col = cell.dataset.col;

  if (symbol === null) {
    cell.setAttribute('aria-label', `Row ${parseInt(row) + 1}, Column ${parseInt(col) + 1}. Empty.`);
    return;
  }

  // Create symbol element
  const sym = document.createElement('div');
  sym.className = `tango-symbol tango-symbol--${symbol}`;
  if (animate) sym.classList.add('tango-symbol--entering');
  cell.appendChild(sym);

  // Update aria
  const locked = cell.classList.contains('tango-cell--locked');
  cell.setAttribute(
    'aria-label',
    `Row ${parseInt(row) + 1}, Column ${parseInt(col) + 1}. ${symbol}.${locked ? ' Pre-filled.' : ''}`
  );
}

/**
 * Update a single cell in the grid.
 */
export function updateCell(grid, row, col, symbol, options = {}) {
  const cell = grid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;
  applyCellSymbol(cell, symbol, options.animate !== false);
}

// ─── Error Highlighting (LinkedIn-style red diagonal stripes) ────────────────

/**
 * Highlight error cells with red diagonal stripe pattern.
 * @param {HTMLElement} grid
 * @param {Set<string>} errorCells - Set of "row,col" strings
 */
export function highlightErrors(grid, errorCells) {
  for (const key of errorCells) {
    const [r, c] = key.split(',');
    const cell = grid.querySelector(`[data-row="${r}"][data-col="${c}"]`);
    if (cell) {
      cell.classList.add('tango-cell--error');
    }
  }
}

/**
 * Clear all error highlights from the grid.
 * @param {HTMLElement} grid
 */
export function clearErrors(grid) {
  if (!grid) return;
  grid.querySelectorAll('.tango-cell--error').forEach((cell) => {
    cell.classList.remove('tango-cell--error');
  });
}

// ─── Constraint Markers ──────────────────────────────────────────────────────

/**
 * Create a constraint marker DOM element with calculated position.
 */
function createConstraintMarker(constraint) {
  const { r1, c1, r2, c2, type } = constraint;
  const isHorizontal = r1 === r2;

  const marker = document.createElement('div');
  marker.className = `tango-constraint tango-constraint--${isHorizontal ? 'h' : 'v'}`;
  marker.textContent = type === 'same' ? '=' : '×';
  marker.setAttribute('aria-hidden', 'true');

  // Position calculation
  const cellSize = 56; // matches --cell-size
  const gap = 2;
  const padding = gap;

  if (isHorizontal) {
    const minC = Math.min(c1, c2);
    const top = padding + r1 * (cellSize + gap) + cellSize / 2 - 9;
    const left = padding + (minC + 1) * (cellSize + gap) - gap / 2 - 10;
    marker.style.top = `${top}px`;
    marker.style.left = `${left}px`;
  } else {
    const minR = Math.min(r1, r2);
    const top = padding + (minR + 1) * (cellSize + gap) - gap / 2 - 10;
    const left = padding + c1 * (cellSize + gap) + cellSize / 2 - 9;
    marker.style.top = `${top}px`;
    marker.style.left = `${left}px`;
  }

  return marker;
}
