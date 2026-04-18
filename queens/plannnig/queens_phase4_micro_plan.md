# Phase 4 Micro-Plan: Polish & Hub

> **Deliverable 5 of 5** — Detailed implementation plan for final polish, responsive sizing, token updates, and verification.

---

## Overview

Phase 4 is the finishing pass. By this point, Queens is fully functional. This phase focuses on:
1. **Tokens update** for variable grid sizing
2. **Responsive polish** ensuring all grid sizes (5×5 through 9×9) look great on all devices
3. **Final test sweep** — all 85+ tests passing
4. **Browser walkthrough** — manual verification of the complete user journey

---

## Proposed File Changes

### [MODIFY] `src/styles/tokens.css`

Add Queens-specific CSS custom properties:

```
/* === Queens Grid (variable sizing) === */
--q-cell-size:      56px;    /* default, overridden per-puzzle by renderer */
--q-grid-size:      5;       /* default, overridden per-puzzle by renderer */
--q-border-width:   3px;     /* region border thickness */
--q-border-color:   #2A2E33; /* region border color (matches --grid-border) */

/* === Queens Symbol Sizing === */
--q-queen-scale:    0.55;    /* queen font-size = cell-size × scale */
--q-marker-scale:   0.40;    /* marker font-size = cell-size × scale */
```

These are set as defaults in `tokens.css` and overridden inline by the renderer based on the puzzle's N value.

---

### [MODIFY] `src/styles/queens.css`

**Responsive Breakpoints:**

```
/* === Desktop (default) === */
/* Cell sizes computed by renderer, but ensure comfortable minimum */

/* === Tablet (max-width: 768px) === */
@media (max-width: 768px) {
  /* Slightly reduce cell sizes for tablet */
  /* Renderer already computes optimal sizes, but cap maximum */
}

/* === Mobile (max-width: 375px) === */
@media (max-width: 375px) {
  .queens-grid {
    /* Ensure grid doesn't overflow viewport */
    max-width: calc(100vw - 32px);
  }
  
  /* Reduce region border width on small screens for large grids */
  .queens-cell--border-top,
  .queens-cell--border-bottom,
  .queens-cell--border-left,
  .queens-cell--border-right {
    border-width: var(--q-border-width);
  }
}
```

**Dynamic Border Width (set by renderer):**

For N ≥ 8, the renderer sets `--q-border-width: 2px` instead of `3px` to prevent borders from consuming too much visual space.

**Variable Cell Sizing Table (renderer sets these on the grid element):**

| N | `--q-cell-size` desktop | `--q-cell-size` mobile (≤375px) |
|---|---|---|
| 5 | 60px | 56px |
| 6 | 52px | 48px |
| 7 | 44px | 42px |
| 8 | 38px | 36px |
| 9 | 34px | 32px |

The renderer computes: `cellSize = Math.floor(Math.min(containerWidth, 340) / N)`

---

### [MODIFY] `src/games/queens/queens-renderer.js`

Add responsive cell-size computation:

```
PSEUDOCODE: computeCellSize(N)

  // Measure available width (containers are max 340px on mobile)
  maxGridWidth = 340
  cellSize = Math.floor(maxGridWidth / N)
  
  // Clamp to reasonable range
  cellSize = Math.max(28, Math.min(60, cellSize))
  
  return cellSize
```

Also add `--q-border-width` computation:
```
borderWidth = N >= 8 ? 2 : 3
grid.style.setProperty('--q-border-width', borderWidth + 'px')
```

---

### [MODIFY] Hub Integration Polish

Ensure the Queens hub card correctly reflects completion state:

- **Not started**: `"Solve Queens →"` in blue
- **Completed**: `"Completed ✓"` in green
- **Streak**: `🔥 N` below the card title

This is already handled by the existing hub code in `main.js` — just needs the `available: true` flag set in Phase 3.

---

## Final Test Plan

### Test Summary

| Test File | Test Count | Coverage |
|---|---|---|
| `tests/queens/queens-logic.test.js` | T1–T41 (41 tests) | Board model, all 4 validators, error finder, win detection |
| `tests/queens/queens-solver.test.js` | T42–T49 (8 tests) | Backtracking solver, uniqueness check |
| `tests/queens/queens-generator.test.js` | T50–T67 (18 tests) | Queen placement, region growing, full pipeline |
| `tests/queens/queens-daily.test.js` | T68–T85 (18 tests) | Daily pipeline, save/resume, bank loading |
| **Total** | **85 tests** | |

### Final Verification Command

```
npx vitest run tests/queens/
```

All 85 tests must pass.

---

## Browser Walkthrough Checklist

### Hub Verification
- [ ] Queens card shows as active (not grayed out)
- [ ] Queens card shows correct streak count
- [ ] Queens card shows "Completed ✓" after solving
- [ ] Clicking Queens card navigates to `/queens`

### Game Play Verification (5×5 Easy)
- [ ] Grid renders with 5 distinct colored regions
- [ ] Region borders are thick and dark between different regions
- [ ] Region borders are thin/invisible between same-region cells
- [ ] Tap empty cell → marker (✗) appears
- [ ] Tap marker → queen (♛) appears with pop animation
- [ ] Tap queen → cell clears to empty
- [ ] Timer starts on first placement
- [ ] Placing two queens in same row → both get red stripe error
- [ ] Placing two queens adjacently → both get red stripe error
- [ ] Toast message appears for violations
- [ ] Undo button removes last move
- [ ] Reset button clears all player moves
- [ ] Solving puzzle triggers confetti + modal
- [ ] Modal shows time, moves, difficulty, streak

### Game Play Verification (8×8 Hard)
- [ ] Grid renders with 8 distinct colored regions
- [ ] Cells are smaller but still touch-friendly
- [ ] Region borders are 2px (not 3px)
- [ ] Queen/marker symbols scale proportionally
- [ ] All constraints validated correctly

### Save/Resume Verification
- [ ] Play partially, refresh browser → state restored
- [ ] Solve puzzle, refresh → completed state shown
- [ ] Next day → fresh puzzle (no carryover)

### Responsive Verification
- [ ] Desktop (1280px): grid centered, comfortable sizing
- [ ] Tablet (768px): grid fits within viewport
- [ ] Mobile (375px): grid fits without horizontal scroll
- [ ] Mobile (320px): grid still usable

---

## Implementation Steps

### Checkpoint 12: Token Updates
1. `[ ]` Add Queens CSS custom properties to `tokens.css`

### Checkpoint 13: Responsive Polish
2. `[ ]` Update `queens-renderer.js` with `computeCellSize(N)` function
3. `[ ]` Update `queens-renderer.js` with dynamic `--q-border-width`
4. `[ ]` Update `queens.css` with responsive breakpoints
5. `[ ]` **CHECKPOINT**: Open game in Chrome DevTools device mode, verify all grid sizes at 375px and 320px widths

### Checkpoint 14: Final Test Sweep
6. `[ ]` Run `npx vitest run tests/queens/` — verify all 85 tests pass
7. `[ ]` Fix any failing tests

### Checkpoint 15: Browser Walkthrough
8. `[ ]` Complete the full browser walkthrough checklist above
9. `[ ]` Record a browser session demonstrating:
   - Hub → Queens card click
   - Full game play through to win
   - Error highlighting in action
   - Undo/reset
   - Confetti + modal on win
10. `[ ]` Create walkthrough.md summarizing all changes

---

## Open Questions

None — all design decisions have been resolved in previous phases. Phase 4 is pure execution and verification.
