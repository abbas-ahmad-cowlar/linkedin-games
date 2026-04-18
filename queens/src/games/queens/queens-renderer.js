/**
 * Queens Grid Renderer — Builds and updates the N×N game grid DOM.
 *
 * Handles variable grid sizing (5×5 to 9×9), colored region rendering
 * with thick inter-region borders, and cell state updates.
 *
 * @module games/queens/queens-renderer
 */

import { CELL } from './queens-logic.js';

// ─── Region Color Palette ────────────────────────────────────────────────────

/**
 * Pastel colors for region rendering, indexed by region ID.
 * 9 colors for up to 9×9 grids.
 */
const REGION_COLORS = [
  '#E87461', // coral-red
  '#A8D860', // lime-green
  '#F5A843', // orange
  '#7CB8F2', // sky-blue
  '#C4A2E0', // lavender
  '#F2A0C0', // pink
  '#E8D94E', // gold-yellow
  '#96D4D4', // seafoam
  '#CFCFCF', // light-gray
];

// ─── Dynamic Cell Sizing ─────────────────────────────────────────────────────

/**
 * Calculate cell size based on grid dimension N.
 * Targets a comfortable grid width within ~340px mobile viewport.
 */
function getCellSize(N) {
  const sizes = { 5: 60, 6: 52, 7: 44, 8: 38, 9: 34 };
  return sizes[N] || Math.floor(340 / N);
}

// ─── Border Computation ─────────────────────────────────────────────────────

/**
 * Compute border CSS classes for a cell based on region boundaries.
 *
 * Thick borders appear between cells of different regions and on grid edges.
 * Interior cells of the same region get only the thin default border.
 *
 * @param {number[][]} regionMap - Region ID grid
 * @param {number} r - Row
 * @param {number} c - Column
 * @param {number} N - Grid size
 * @returns {string[]} Array of CSS class names
 */
function computeBorderClasses(regionMap, r, c, N) {
  const id = regionMap[r][c];
  const classes = [];

  // Top: grid edge or different region above
  if (r === 0 || regionMap[r - 1][c] !== id) {
    classes.push('queens-cell--border-top');
  }

  // Bottom: grid edge or different region below
  if (r === N - 1 || regionMap[r + 1][c] !== id) {
    classes.push('queens-cell--border-bottom');
  }

  // Left: grid edge or different region left
  if (c === 0 || regionMap[r][c - 1] !== id) {
    classes.push('queens-cell--border-left');
  }

  // Right: grid edge or different region right
  if (c === N - 1 || regionMap[r][c + 1] !== id) {
    classes.push('queens-cell--border-right');
  }

  return classes;
}

// ─── Grid Builder ────────────────────────────────────────────────────────────

/**
 * Build the full grid DOM for a Queens puzzle.
 *
 * @param {object} puzzleData - { size, regionMap }
 * @param {function(number, number): void} onCellClick - (row, col) tap-cycle callback
 * @param {function(number, number): void} [onCellDrag] - (row, col) drag-mark callback
 * @param {function(number, number): void} [onCellQueen] - (row, col) direct queen placement
 * @returns {HTMLElement} The .queens-grid element
 */
export function renderGrid(puzzleData, onCellClick, onCellDrag, onCellQueen) {
  const { size: N, regionMap } = puzzleData;
  const cellSize = getCellSize(N);

  const grid = document.createElement('div');
  grid.className = 'queens-grid';
  grid.setAttribute('role', 'grid');
  grid.setAttribute('aria-label', `Queens puzzle. ${N} by ${N} grid.`);
  grid.dataset.size = N;

  // Set CSS custom properties for dynamic sizing
  grid.style.setProperty('--q-cell-size', `${cellSize}px`);
  grid.style.setProperty('--q-grid-size', N);

  // Create cells
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const cell = document.createElement('div');
      cell.className = 'queens-cell';
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('tabindex', '0');
      cell.dataset.row = r;
      cell.dataset.col = c;

      // Region background color
      const regionId = regionMap[r][c];
      cell.style.backgroundColor = REGION_COLORS[regionId % REGION_COLORS.length];

      // Region border classes
      const borderClasses = computeBorderClasses(regionMap, r, c, N);
      cell.classList.add(...borderClasses);

      // Accessibility
      cell.setAttribute(
        'aria-label',
        `Row ${r + 1}, Column ${c + 1}. Region ${regionId + 1}. Empty.`
      );

      grid.appendChild(cell);
    }
  }

  // ─── Pointer Events: Click + Drag-to-Mark ─────────────────────────────────
  // A simple tap fires onCellClick (tap cycle).
  // A drag (pointerdown on empty cell → move across cells) fires onCellDrag
  // for each new empty cell the pointer enters, placing markers.

  let isDragging = false;
  let dragStartCell = null;    // { row, col } of pointerdown
  let dragVisited = new Set();  // "r,c" keys of cells already marked this drag
  let hasMoved = false;         // Did the pointer move to a different cell?
  let startMarked = false;      // Was the start cell immediately marked?

  function getCellFromEvent(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return null;
    const cell = el.closest('.queens-cell');
    if (!cell || !grid.contains(cell)) return null;
    return { row: parseInt(cell.dataset.row), col: parseInt(cell.dataset.col) };
  }

  grid.addEventListener('pointerdown', (e) => {
    const cellInfo = getCellFromEvent(e);
    if (!cellInfo) return;

    isDragging = true;
    hasMoved = false;
    startMarked = false;
    dragStartCell = cellInfo;
    dragVisited = new Set();
    dragVisited.add(`${cellInfo.row},${cellInfo.col}`);

    // Immediately mark the start cell (cross it if empty)
    if (onCellDrag) {
      const didMark = onCellDrag(cellInfo.row, cellInfo.col);
      startMarked = !!didMark;
    }

    grid.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  grid.addEventListener('pointermove', (e) => {
    if (!isDragging) return;

    const cellInfo = getCellFromEvent(e);
    if (!cellInfo) return;

    const key = `${cellInfo.row},${cellInfo.col}`;

    // Detect if pointer moved to a different cell
    if (cellInfo.row !== dragStartCell.row || cellInfo.col !== dragStartCell.col) {
      hasMoved = true;
    }

    // If dragging and entering a new cell, call onCellDrag
    if (hasMoved && !dragVisited.has(key) && onCellDrag) {
      dragVisited.add(key);
      onCellDrag(cellInfo.row, cellInfo.col);
    }
  });

  grid.addEventListener('pointerup', (e) => {
    if (!isDragging) return;

    if (!hasMoved && dragStartCell && !startMarked) {
      // Simple tap and start wasn't already drag-marked — fire click cycle
      onCellClick(dragStartCell.row, dragStartCell.col);
    }
    // If hasMoved or startMarked, the drag already handled everything

    isDragging = false;
    dragStartCell = null;
    dragVisited = new Set();
    hasMoved = false;
    startMarked = false;

    grid.releasePointerCapture(e.pointerId);
  });

  grid.addEventListener('pointercancel', () => {
    isDragging = false;
    dragStartCell = null;
    dragVisited = new Set();
    hasMoved = false;
  });

  // Prevent text selection during drag
  grid.style.touchAction = 'none';

  // Right-click → direct queen placement
  grid.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const cellInfo = getCellFromEvent(e);
    if (!cellInfo || !onCellQueen) return;
    onCellQueen(cellInfo.row, cellInfo.col);
  });

  // Double-click → direct queen placement
  grid.addEventListener('dblclick', (e) => {
    const cellInfo = getCellFromEvent(e);
    if (!cellInfo || !onCellQueen) return;
    onCellQueen(cellInfo.row, cellInfo.col);
  });

  // Keyboard navigation
  grid.addEventListener('keydown', (e) => {
    const cell = e.target.closest('.queens-cell');
    if (!cell) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    let nextRow = row, nextCol = col;

    switch (e.key) {
      case 'ArrowUp':    nextRow = Math.max(0, row - 1); break;
      case 'ArrowDown':  nextRow = Math.min(N - 1, row + 1); break;
      case 'ArrowLeft':  nextCol = Math.max(0, col - 1); break;
      case 'ArrowRight': nextCol = Math.min(N - 1, col + 1); break;
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
 * Update a single cell's visual state.
 *
 * @param {HTMLElement} grid - The grid element
 * @param {number} row
 * @param {number} col
 * @param {string|null} value - CELL.QUEEN, CELL.MARKER, or null
 * @param {object} [options]
 * @param {boolean} [options.animate=true] - Whether to animate the symbol
 */
export function updateCell(grid, row, col, value, options = {}) {
  const cell = grid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;

  // Remove existing symbol
  const existing = cell.querySelector('.queens-symbol');
  if (existing) existing.remove();

  // Remove error state and symbol flag when cell changes
  cell.classList.remove('queens-cell--error');
  cell.classList.remove('queens-cell--has-symbol');

  const animate = options.animate !== false;

  if (value === CELL.QUEEN) {
    const sym = document.createElement('div');
    sym.className = 'queens-symbol queens-symbol--queen';
    if (animate) sym.classList.add('queens-symbol--entering');
    sym.textContent = '♛';
    cell.appendChild(sym);
    cell.classList.add('queens-cell--has-symbol');
    cell.setAttribute(
      'aria-label',
      `Row ${row + 1}, Column ${col + 1}. Queen.`
    );
  } else if (value === CELL.MARKER) {
    const sym = document.createElement('div');
    sym.className = 'queens-symbol queens-symbol--marker';
    if (animate) sym.classList.add('queens-symbol--entering');
    sym.textContent = '✕';
    cell.appendChild(sym);
    cell.classList.add('queens-cell--has-symbol');
    cell.setAttribute(
      'aria-label',
      `Row ${row + 1}, Column ${col + 1}. Marked.`
    );
  } else {
    cell.setAttribute(
      'aria-label',
      `Row ${row + 1}, Column ${col + 1}. Empty.`
    );
  }
}

// ─── Error Highlighting ──────────────────────────────────────────────────────

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
      cell.classList.add('queens-cell--error');
    }
  }
}

/**
 * Clear all error highlights from the grid.
 * @param {HTMLElement} grid
 */
export function clearErrors(grid) {
  if (!grid) return;
  grid.querySelectorAll('.queens-cell--error').forEach((cell) => {
    cell.classList.remove('queens-cell--error');
  });
}

// ─── Hint Highlighting ───────────────────────────────────────────────────────

/**
 * Apply hint highlights and stripes to cells.
 * @param {HTMLElement} grid
 * @param {string[]} highlightCells - "r,c" keys for blue-glow highlight
 * @param {string[]} stripeCells - "r,c" keys for diagonal stripe overlay
 */
export function applyHintHighlights(grid, highlightCells, stripeCells) {
  for (const key of highlightCells) {
    const [r, c] = key.split(',');
    const cell = grid.querySelector(`[data-row="${r}"][data-col="${c}"]`);
    if (cell) cell.classList.add('queens-cell--hint-highlight');
  }
  for (const key of stripeCells) {
    const [r, c] = key.split(',');
    const cell = grid.querySelector(`[data-row="${r}"][data-col="${c}"]`);
    if (cell) cell.classList.add('queens-cell--hint-stripe');
  }
}

/**
 * Clear all hint highlights and stripes from the grid.
 * @param {HTMLElement} grid
 */
export function clearHintHighlights(grid) {
  if (!grid) return;
  grid.querySelectorAll('.queens-cell--hint-highlight').forEach((cell) => {
    cell.classList.remove('queens-cell--hint-highlight');
  });
  grid.querySelectorAll('.queens-cell--hint-stripe').forEach((cell) => {
    cell.classList.remove('queens-cell--hint-stripe');
  });
}
