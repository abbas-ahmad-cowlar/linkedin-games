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
 * Apply a symbol to a cell element.
 *
 * @param {HTMLElement} cell
 * @param {string|null} symbol - 'sun', 'moon', or null
 * @param {boolean} [animate=true] - Whether to play the appear animation
 */
export function applyCellSymbol(cell, symbol, animate = true) {
  // Remove existing symbol and state classes
  cell.classList.remove('tango-cell--sun', 'tango-cell--moon');
  const existingSymbol = cell.querySelector('.tango-symbol');
  if (existingSymbol) existingSymbol.remove();

  if (symbol === null) {
    const row = cell.dataset.row;
    const col = cell.dataset.col;
    cell.setAttribute('aria-label', `Row ${parseInt(row) + 1}, Column ${parseInt(col) + 1}. Empty.`);
    return;
  }

  // Add state class
  cell.classList.add(symbol === SYM.SUN ? 'tango-cell--sun' : 'tango-cell--moon');

  // Create symbol element
  const sym = document.createElement('div');
  sym.className = `tango-symbol tango-symbol--${symbol}`;
  if (animate) sym.classList.add('tango-symbol--entering');
  cell.appendChild(sym);

  // Update aria
  const row = cell.dataset.row;
  const col = cell.dataset.col;
  const locked = cell.classList.contains('tango-cell--locked');
  cell.setAttribute(
    'aria-label',
    `Row ${parseInt(row) + 1}, Column ${parseInt(col) + 1}. ${symbol}.${locked ? ' Pre-filled.' : ''}`
  );
}

/**
 * Update a single cell in the grid.
 *
 * @param {HTMLElement} grid
 * @param {number} row
 * @param {number} col
 * @param {string|null} symbol
 * @param {{ animate?: boolean }} [options]
 */
export function updateCell(grid, row, col, symbol, options = {}) {
  const cell = grid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;
  applyCellSymbol(cell, symbol, options.animate !== false);
}

/**
 * Trigger shake animation on a cell.
 *
 * @param {HTMLElement} grid
 * @param {number} row
 * @param {number} col
 */
export function shakeCell(grid, row, col) {
  const cell = grid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;

  cell.classList.add('tango-cell--shake', 'tango-cell--error');

  // Remove after animation completes
  setTimeout(() => {
    cell.classList.remove('tango-cell--shake', 'tango-cell--error');
  }, 400);
}

// ─── Constraint Markers ──────────────────────────────────────────────────────

/**
 * Create a constraint marker DOM element with calculated position.
 *
 * @param {{ r1: number, c1: number, r2: number, c2: number, type: string }} constraint
 * @returns {HTMLElement}
 */
function createConstraintMarker(constraint) {
  const { r1, c1, r2, c2, type } = constraint;
  const isHorizontal = r1 === r2; // same row → horizontal neighbor

  const marker = document.createElement('div');
  marker.className = `tango-constraint tango-constraint--${isHorizontal ? 'h' : 'v'}`;
  marker.textContent = type === 'same' ? '=' : '×';
  marker.setAttribute('aria-hidden', 'true');

  // Calculate position
  // Grid uses CSS grid, so we position relative to the grid container.
  // Each cell occupies: cellSize + gap. Grid has padding = gap.
  // We read CSS custom properties at runtime.
  const cellSize = 56; // fallback, will be overridden by CSS
  const gap = 2;
  const padding = gap; // grid padding = gap

  if (isHorizontal) {
    // Between (r1, c1) and (r1, c2) where c2 = c1 + 1
    const minC = Math.min(c1, c2);
    const top = padding + r1 * (cellSize + gap) + cellSize / 2 - 9; // 9 = half marker height
    const left = padding + (minC + 1) * (cellSize + gap) - gap / 2 - 10; // 10 = half marker width
    marker.style.top = `${top}px`;
    marker.style.left = `${left}px`;
  } else {
    // Between (r1, c1) and (r2, c1) where r2 = r1 + 1
    const minR = Math.min(r1, r2);
    const top = padding + (minR + 1) * (cellSize + gap) - gap / 2 - 10;
    const left = padding + c1 * (cellSize + gap) + cellSize / 2 - 9;
    marker.style.top = `${top}px`;
    marker.style.left = `${left}px`;
  }

  return marker;
}

/**
 * Reposition all constraint markers (call on resize / mobile).
 * @param {HTMLElement} grid
 * @param {Array} constraints
 */
export function repositionConstraints(grid, constraints) {
  // Remove existing markers
  grid.querySelectorAll('.tango-constraint').forEach((m) => m.remove());

  // Detect actual cell size from rendered grid
  const firstCell = grid.querySelector('.tango-cell');
  if (!firstCell) return;

  const cellRect = firstCell.getBoundingClientRect();
  const cellSize = cellRect.width;
  const gridStyle = getComputedStyle(grid);
  const gap = parseFloat(gridStyle.gap) || 2;
  const padding = parseFloat(gridStyle.padding) || gap;

  for (const con of constraints) {
    const { r1, c1, r2, c2, type } = con;
    const isHorizontal = r1 === r2;

    const marker = document.createElement('div');
    marker.className = `tango-constraint tango-constraint--${isHorizontal ? 'h' : 'v'}`;
    marker.textContent = type === 'same' ? '=' : '×';
    marker.setAttribute('aria-hidden', 'true');

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

    grid.appendChild(marker);
  }
}
