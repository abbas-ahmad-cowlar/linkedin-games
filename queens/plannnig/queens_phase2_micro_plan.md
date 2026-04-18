# Phase 2 Micro-Plan: UI & Renderer

> **Deliverable 3 of 5** — Detailed implementation plan for `queens-renderer.js`, `queens.css`, and `queens.js` (game controller).

---

## Overview

Phase 2 builds the visual layer and game controller on top of the Phase 1 logic engine. The key challenge unique to Queens is **variable grid sizing** (5×5 to 9×9) and **colored region rendering** with thick inter-region borders. This phase follows the Tango pattern: renderer builds DOM, controller wires interactions, CSS handles styling.

---

## Data Model / Architecture

### Rendering Strategy

| Element | Approach |
|---|---|
| **Grid layout** | CSS Grid with `grid-template: repeat(N, var(--q-cell-size)) / repeat(N, var(--q-cell-size))` |
| **Region colors** | Inline `background-color` from the pastel palette, keyed by `regionMap[r][c]` |
| **Region borders** | Computed per-cell: thick border on sides where the adjacent cell belongs to a different region; no border where adjacent cell is same region |
| **Queen symbol** | CSS pseudo-element crown shape (▲ base + three points) OR Unicode ♛ with CSS styling |
| **Marker symbol** | Unicode ✗ with CSS font styling |
| **Error highlighting** | Same `repeating-linear-gradient` diagonal stripes pattern as Tango |
| **Cell sizing** | CSS custom property `--q-cell-size` set dynamically based on N |

### Dynamic Cell Sizing

The grid must fit comfortably on mobile (≤375px viewport). The grid area is approximately 340px wide after padding.

| N | Cell Size | Grid Width | Calculation |
|---|---|---|---|
| 5 | 60px | 308px | `floor(340 / 5) - gap` |
| 6 | 52px | 318px | `floor(340 / 6) - gap` |
| 7 | 44px | 314px | `floor(340 / 7) - gap` |
| 8 | 38px | 310px | `floor(340 / 8) - gap` |
| 9 | 34px | 312px | `floor(340 / 9) - gap` |

The renderer will set `--q-cell-size` on the grid element based on N. Gap is 0px (borders handle visual separation).

---

## Proposed File Changes

### [NEW] `src/games/queens/queens-renderer.js`

**Exports:**

| Export | Signature | Purpose |
|---|---|---|
| `renderGrid(puzzleData, onCellClick)` | `({size, regionMap}, (r,c) → void) → HTMLElement` | Build the grid DOM |
| `updateCell(grid, row, col, value, options)` | `(HTMLElement, n, n, string\|null, {animate?}) → void` | Update single cell |
| `highlightErrors(grid, errorCells)` | `(HTMLElement, Set<string>) → void` | Add error class to cells |
| `clearErrors(grid)` | `(HTMLElement) → void` | Remove all error classes |

**Dependencies:** `queens-logic.js` (for `CELL`).

#### `renderGrid` — Detailed Behavior

1. Create a `div.queens-grid` with CSS Grid layout
2. Set `--q-cell-size` and `--q-grid-size` CSS custom properties based on `puzzleData.size`
3. For each cell `(r, c)`:
   - Create `div.queens-cell`
   - Set `data-row`, `data-col` attributes
   - Set `background-color` from the pastel palette using `regionMap[r][c]`
   - Compute border classes for region boundaries:
     - If `regionMap[r][c] != regionMap[r-1][c]` → thick top border
     - If `regionMap[r][c] != regionMap[r+1][c]` → thick bottom border
     - If `regionMap[r][c] != regionMap[r][c-1]` → thick left border
     - If `regionMap[r][c] != regionMap[r][c+1]` → thick right border
     - Edge cells always get thick border on edge sides
   - Set `role="gridcell"`, `tabindex="0"`, and appropriate `aria-label`
4. Wire event delegation: single click listener on grid, delegated to `.queens-cell`
5. Wire keyboard navigation: arrow keys + Enter/Space

#### Color Palette Array (for indexing by region ID)

```
REGION_COLORS = [
  'var(--pastel-pink)',
  'var(--pastel-purple)',
  'var(--pastel-green)',
  'var(--pastel-orange)',
  'var(--pastel-blue)',
  'var(--pastel-teal)',
  'var(--pastel-yellow)',
  'var(--pastel-coral)',
  'var(--pastel-indigo)',
]
```

#### Region Border Computation

```
PSEUDOCODE: computeBorderClasses(regionMap, r, c, N)

  id = regionMap[r][c]
  classes = []
  
  // Top edge or different region above
  if r == 0 or regionMap[r-1][c] != id:
    classes.push('queens-cell--border-top')
  
  // Bottom edge or different region below
  if r == N-1 or regionMap[r+1][c] != id:
    classes.push('queens-cell--border-bottom')
  
  // Left edge or different region left
  if c == 0 or regionMap[r][c-1] != id:
    classes.push('queens-cell--border-left')
  
  // Right edge or different region right
  if c == N-1 or regionMap[r][c+1] != id:
    classes.push('queens-cell--border-right')
  
  return classes
```

#### `updateCell` — Symbol Rendering

```
PSEUDOCODE: updateCell(grid, r, c, value, options)

  cell = grid.querySelector([data-row=r][data-col=c])
  remove existing .queens-symbol child
  remove error class
  
  if value == CELL.QUEEN:
    sym = document.createElement('div')
    sym.className = 'queens-symbol queens-symbol--queen'
    if options.animate: sym.classList.add('queens-symbol--entering')
    sym.textContent = '♛'
    cell.appendChild(sym)
  
  else if value == CELL.MARKER:
    sym = document.createElement('div')
    sym.className = 'queens-symbol queens-symbol--marker'
    if options.animate: sym.classList.add('queens-symbol--entering')
    sym.textContent = '✗'
    cell.appendChild(sym)
  
  // Update aria-label
```

---

### [NEW] `src/styles/queens.css`

**Structure:**

```
/* === Grid === */
.queens-grid { ... }

/* === Cells === */
.queens-cell { ... }

/* === Region Borders === */
.queens-cell--border-top    { border-top: 3px solid var(--grid-border); }
.queens-cell--border-bottom { border-bottom: 3px solid var(--grid-border); }
.queens-cell--border-left   { border-left: 3px solid var(--grid-border); }
.queens-cell--border-right  { border-right: 3px solid var(--grid-border); }

/* Interior borders (same-region neighbors) */
/* Thin subtle line between cells of the same region */
.queens-cell { border: 1px solid rgba(0,0,0,0.1); }

/* === Symbols === */
.queens-symbol--queen { ... }
.queens-symbol--marker { ... }

/* === Error State === */
.queens-cell--error { ... }  /* red diagonal stripes */

/* === Animations === */
.queens-symbol--entering { ... }

/* === Responsive === */
@media (max-width: 375px) { ... }
```

**Key CSS Details:**

1. **Grid Container:**
```
.queens-grid {
  display: grid;
  grid-template-columns: repeat(var(--q-grid-size), var(--q-cell-size));
  grid-template-rows: repeat(var(--q-grid-size), var(--q-cell-size));
  gap: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  position: relative;
  box-shadow: var(--shadow-md);
}
```

2. **Cell Base:**
```
.queens-cell {
  width: var(--q-cell-size);
  height: var(--q-cell-size);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: filter var(--dur-fast);
  /* background-color set inline by renderer */
}
.queens-cell:hover {
  filter: brightness(0.92);
}
.queens-cell:active {
  filter: brightness(0.85);
}
```

3. **Region Border (thick, dark):**
```
.queens-cell--border-top    { border-top: 3px solid #2A2E33; }
.queens-cell--border-bottom { border-bottom: 3px solid #2A2E33; }
.queens-cell--border-left   { border-left: 3px solid #2A2E33; }
.queens-cell--border-right  { border-right: 3px solid #2A2E33; }
```

4. **Queen Symbol:**
```
.queens-symbol--queen {
  font-size: calc(var(--q-cell-size) * 0.55);
  line-height: 1;
  color: #1B1F23;
  text-shadow: 0 1px 2px rgba(0,0,0,0.15);
  user-select: none;
  pointer-events: none;
}
```

5. **Marker Symbol:**
```
.queens-symbol--marker {
  font-size: calc(var(--q-cell-size) * 0.4);
  line-height: 1;
  color: rgba(0, 0, 0, 0.35);
  font-weight: 700;
  user-select: none;
  pointer-events: none;
}
```

6. **Error State (identical pattern to Tango):**
```
.queens-cell--error {
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 4px,
    rgba(231, 76, 60, 0.25) 4px,
    rgba(231, 76, 60, 0.25) 8px
  );
}
```

7. **Entry Animation:**
```
.queens-symbol--entering {
  animation: queens-pop 200ms ease-out;
}
@keyframes queens-pop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}
```

---

### [NEW] `src/games/queens/queens.js`

**Exports:** `mount(container)`, `unmount()`

**Dependencies:**
- `queens-logic.js` — `CELL`, `createBoard`, `cloneBoard`, `findAllErrors`, `checkWin`
- `queens-renderer.js` — `renderGrid`, `updateCell`, `highlightErrors`, `clearErrors`
- `queens-daily.js` — `getDailyPuzzle`, `saveGameState`, `loadGameState` (Phase 3, stubbed in Phase 2)
- `../../shared/game-shell.js` — `createGameShell`, `announce`
- `../../shared/timer.js` — `createTimer`, `formatTime`
- `../../shared/confetti.js` — `fireConfetti`
- `../../shared/modal.js` — `showModal`
- `../../router.js` — `navigate`
- `../../shared/streak.js` — `recordWin`, `getStreak`

**State Variables (module-level, same pattern as Tango):**

```
let state = 'LOADING'      // LOADING | PLAYING | COMPLETED
let board = null            // (null|'queen'|'marker')[][]
let regionMap = null        // number[][]
let solution = null         // {r,c}[]
let size = 0                // N
let difficulty = 'medium'
let dayNumber = 0
let moveHistory = []
let timer = null
let grid = null
let shell = null
let firstMove = true
let isDaily = true
```

**Lifecycle:**

```
PSEUDOCODE: mount(container)

  state = 'LOADING'
  
  // Create game shell (shared header/controls)
  shell = createGameShell({ title: 'QUEENS', onUndo, onReset })
  container.appendChild(shell.shell)
  
  // Load puzzle (Phase 3: from daily pipeline; Phase 2: hardcoded test puzzle)
  puzzleData = await getDailyPuzzle()  // or hardcoded stub
  
  size = puzzleData.size
  regionMap = puzzleData.regionMap
  solution = puzzleData.solution
  difficulty = puzzleData.difficulty
  dayNumber = puzzleData.dayNumber
  board = createBoard(size)
  moveHistory = []
  firstMove = true
  
  grid = renderGrid(puzzleData, handleCellClick)
  shell.boardContainer.appendChild(grid)
  
  timer = createTimer(shell.timerDisplay, 0)
  state = 'PLAYING'
```

**Tap Cycle (3-state):**

```
PSEUDOCODE: handleCellClick(row, col)

  if state != 'PLAYING': return
  
  current = board[row][col]
  
  // Tap cycle: null → marker → queen → null
  if current == null:       next = CELL.MARKER
  else if current == 'marker': next = CELL.QUEEN
  else:                        next = null  // queen → clear
  
  // ALWAYS place — never block
  pushMove(row, col, current, next)
  board[row][col] = next
  updateCell(grid, row, col, next, { animate: next != null })
  
  // Start timer on first move
  if firstMove and next != null:
    timer.start()
    firstMove = false
  
  // Post-placement validation
  validateAndHighlight()
  
  // Win check: exactly N queens, no markers, no errors
  queenCount = count queens in board
  if queenCount == size and no errors:
    if checkWin(board, regionMap):
      handleWin()
  
  updateUndoState()
  autoSave()
```

**Validation & Error Highlighting:**

```
PSEUDOCODE: validateAndHighlight()

  errors = findAllErrors(board, regionMap)
  clearErrors(grid)
  
  if errors.cells.size > 0:
    highlightErrors(grid, errors.cells)
  
  // Show/clear toast
  if errors.message:
    showToast(errors.message)
  else:
    clearToast()
```

**Win Flow (identical pattern to Tango):**

```
PSEUDOCODE: handleWin()

  state = 'COMPLETED'
  elapsed = timer.stop()
  
  if isDaily:
    streakData = recordWin('queens')
    saveGameState({ ... })
  
  fireConfetti([pastel colors])
  announce('Puzzle solved!')
  
  setTimeout(() => {
    showModal({
      title: '🎉 Solved!',
      stats: [Time, Moves, Difficulty, Streak],
      actions: [NewPuzzle, Hub]
    })
  }, 600)
```

---

## Implementation Steps

### Checkpoint 5: queens.css
1. `[ ]` Create `src/styles/queens.css`
2. `[ ]` Implement grid container styles (CSS Grid, dynamic sizing)
3. `[ ]` Implement cell base styles (flex centering, cursor, hover)
4. `[ ]` Implement region border classes (4 directional thick borders)
5. `[ ]` Implement queen symbol styles (font size, color, shadow)
6. `[ ]` Implement marker symbol styles (font size, opacity)
7. `[ ]` Implement error state (red diagonal stripes overlay)
8. `[ ]` Implement entry animation (@keyframes queens-pop)
9. `[ ]` Add responsive breakpoint for mobile

### Checkpoint 6: queens-renderer.js
10. `[ ]` Implement `renderGrid` — grid element, cell creation, region colors
11. `[ ]` Implement region border computation (evaluate neighbors)
12. `[ ]` Implement event delegation (click + keyboard)
13. `[ ]` Implement `updateCell` — symbol rendering for queen/marker/empty
14. `[ ]` Implement `highlightErrors` and `clearErrors`
15. `[ ]` **CHECKPOINT**: Create a scratch HTML file with hardcoded puzzle, visually verify grid renders correctly with colored regions

### Checkpoint 7: queens.js (Game Controller)
16. `[ ]` Implement `mount` with hardcoded test puzzle (stub daily pipeline)
17. `[ ]` Implement tap cycle (null → marker → queen → null)
18. `[ ]` Implement `validateAndHighlight` using Phase 1's `findAllErrors`
19. `[ ]` Implement undo/reset handlers (same pattern as Tango)
20. `[ ]` Implement toast show/clear
21. `[ ]` Implement win detection + win flow (confetti + modal)
22. `[ ]` Implement `unmount` cleanup
23. `[ ]` **CHECKPOINT**: Wire into `main.js` temporarily, play a full game in browser, verify tap cycle → error highlighting → win flow

---

## Open Questions

> [!NOTE]
> **Q1: Region border width** — LinkedIn uses approximately 3px dark borders between regions. Should we use exactly 3px, or should it scale with cell size? Recommendation: **Fixed 3px** for small grids (N≤7), **2px** for large grids (N≥8) via a CSS custom property `--q-border-width`.

> [!NOTE]
> **Q2: Queen icon** — Unicode ♛ (U+265B, Black Chess Queen) renders differently across platforms. Should we add a CSS fallback crown shape for consistency? Recommendation: Start with Unicode ♛, evaluate cross-browser rendering, and add a CSS/SVG fallback only if needed.
