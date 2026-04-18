# Queens Blueprint

> **Deliverable 1 of 5** — Architectural blueprint for the Queens game.
> This document defines the data model, constraints, algorithms, difficulty scaling, and file structure.
> No code — planning only.

---

## Overview

Queens is a constraint-satisfaction puzzle on an N×N grid divided into N colored regions. The player places exactly one queen (♛) per region, per row, and per column, with no two queens touching (including diagonally). This is a fundamentally different puzzle from Tango — variable grid sizes, irregular colored regions, queen adjacency constraints — but it follows the **exact same module architecture**.

---

## 1. Game Rules Formalization

### 1.1 Board Structure

| Concept | Description |
|---|---|
| **Grid** | N×N square grid (N = 5 to 9) |
| **Regions** | N non-overlapping colored regions that tile the entire grid. Each region is a connected set of cells with a unique color. |
| **Queen** | A placed piece (♛). Exactly N queens on the board when solved. |
| **Marker** | A player annotation (✗) meaning "not a queen here". Not enforced by rules. |

### 1.2 Constraint Rules

| # | Rule | Formal Definition |
|---|---|---|
| **R1** | One per row | `∀ row r: count(queens in row r) == 1` |
| **R2** | One per column | `∀ col c: count(queens in col c) == 1` |
| **R3** | One per region | `∀ region id: count(queens in region id) == 1` |
| **R4** | No adjacency | `∀ queen at (r,c): no queen at any of the 8 neighbors (r±1, c±1)` |

### 1.3 Interaction Model (LinkedIn-matching)

| Action | Behavior |
|---|---|
| Tap empty cell | → Place ✗ (marker) |
| Tap ✗ cell | → Place ♛ (queen) |
| Tap ♛ cell | → Clear to empty |
| Error feedback | Red diagonal stripes on conflicting queens |
| Blocking | **NEVER** — always allow free placement |
| Win check | Only when board has exactly N queens and zero violations |

---

## 2. Data Model

### 2.1 Region Map (Static per puzzle)

```
regionMap: number[][]   // N×N grid of region IDs (0 to N-1)
```

Example 5×5:
```
0 0 1 1 1
0 2 2 1 3
0 2 4 3 3
2 2 4 4 3
4 4 4 3 3
```

Each integer is a region ID. Region 0 = pink, Region 1 = purple, etc.

### 2.2 Board State (Mutable player state)

```
board: (null | 'queen' | 'marker')[][]   // N×N
```

- `null` — empty cell
- `'queen'` — queen placed (♛)
- `'marker'` — marker placed (✗), player annotation only

### 2.3 Puzzle Data Shape

```
{
  size: number,              // N (5-9)
  regionMap: number[][],     // N×N region IDs
  solution: [r, c][],        // N queen positions (the unique solution)
  difficulty: string,        // 'easy' | 'medium' | 'hard'
}
```

> [!NOTE]
> Unlike Tango where the puzzle is a partially-filled board, Queens puzzles start with a **completely empty board**. The "puzzle" is the region map itself — the player must deduce queen positions from the region geometry + constraints.

### 2.4 Color Mapping

Region IDs map to the pastel palette already defined in `tokens.css`:

| Region ID | Token | Color |
|---|---|---|
| 0 | `--pastel-pink` | `#F4A0B5` |
| 1 | `--pastel-purple` | `#B39DDB` |
| 2 | `--pastel-green` | `#81C784` |
| 3 | `--pastel-orange` | `#FFB74D` |
| 4 | `--pastel-blue` | `#64B5F6` |
| 5 | `--pastel-teal` | `#4DD0E1` |
| 6 | `--pastel-yellow` | `#FFF176` |
| 7 | `--pastel-coral` | `#FF8A80` |
| 8 | `--pastel-indigo` | `#9FA8DA` |

---

## 3. Constraint Definitions (Formal)

### 3.1 Row Uniqueness

```
For each row r in [0, N):
  cells_with_queens = [(r, c) for c in [0, N) if board[r][c] == 'queen']
  VIOLATION if len(cells_with_queens) > 1
```

### 3.2 Column Uniqueness

```
For each col c in [0, N):
  cells_with_queens = [(r, c) for r in [0, N) if board[r][c] == 'queen']
  VIOLATION if len(cells_with_queens) > 1
```

### 3.3 Region Uniqueness

```
For each region_id in [0, N):
  queens_in_region = [(r, c) for all (r,c) where regionMap[r][c] == region_id
                                           and board[r][c] == 'queen']
  VIOLATION if len(queens_in_region) > 1
```

### 3.4 Adjacency (8-directional)

```
For each queen at (r, c):
  neighbors = all (r+dr, c+dc) for dr in [-1,0,1], dc in [-1,0,1], (dr,dc) != (0,0)
  VIOLATION if any neighbor also has a queen
```

### 3.5 Error Cell Collection

When violations are found, **all participating queens** are marked as errors. For example:
- Two queens in Row 2 → both queens get the error class
- Queen at (1,1) adjacent to queen at (2,2) → both get the error class

---

## 4. Difficulty Scaling Strategy

### 4.1 Grid Size as Primary Difficulty Lever

| Difficulty | Grid Size (N) | Regions | Search Space | Reasoning |
|---|---|---|---|---|
| **Easy** | 5×5 | 5 | Small, fast to solve logically | Fewer constraints to track |
| **Medium** | 6×6 or 7×7 | 6–7 | Moderate | Requires more deduction steps |
| **Hard** | 8×8 or 9×9 | 8–9 | Large, more complex regions | Deep constraint chains needed |

### 4.2 Region Complexity as Secondary Lever

Beyond grid size, the **shape of regions** affects difficulty:

- **Easy**: Regions tend to be more regular (blocky, rectangular-ish), making it visually obvious where queens must go
- **Hard**: Regions are more irregular (L-shapes, T-shapes, thin corridors), requiring deeper reasoning about adjacency exclusion zones

### 4.3 Difficulty Configuration

```
DIFFICULTY = {
  easy:   { sizes: [5],    regionComplexity: 'low'   },
  medium: { sizes: [6, 7], regionComplexity: 'medium' },
  hard:   { sizes: [7, 8, 9], regionComplexity: 'high'  },
}
```

The generator will pick a size from the allowed range using the seeded RNG.

---

## 5. Key Algorithmic Challenges

### 5.1 Region Map Generation

**This is the hardest part of Queens.** We need to generate N connected, non-overlapping regions that tile an N×N grid, such that a valid queen placement exists.

#### Algorithm: Solution-First Region Growing

1. **Place N queens first** — Generate a valid N-queens placement (one per row, one per col, no adjacency) using backtracking with randomized ordering
2. **Assign seed cells** — Each queen's cell becomes the seed for a region
3. **Grow regions via flood fill** — Iteratively expand regions into adjacent unassigned cells, using randomized BFS to create organic shapes
4. **Ensure connectivity** — Each region must remain connected. Only expand into cells that maintain connectivity.
5. **Balance region sizes** — Prioritize growing the smallest region to prevent one region from dominating

```
PSEUDOCODE: generateRegionMap(N, rng)

  // Step 1: Place N non-adjacent queens (one per row, one per col)
  queenPositions = solveNQueensNoAdjacent(N, rng)
  
  // Step 2: Initialize regions from queen positions
  regionMap = N×N grid of -1 (unassigned)
  for i in [0, N):
    regionMap[queenPositions[i].r][queenPositions[i].c] = i
  
  // Step 3: Flood-fill growth
  frontier = queue of (cell, regionId) for each queen position's neighbors
  shuffle(frontier, rng)  // randomize for organic shapes
  
  while unassigned cells remain:
    pick cell from frontier (prefer smallest region)
    if cell is unassigned and assigning it doesn't break connectivity:
      regionMap[cell.r][cell.c] = regionId
      add cell's unassigned neighbors to frontier
  
  return { regionMap, solution: queenPositions }
```

> [!IMPORTANT]
> This "solution-first" approach **guarantees a valid solution exists** by construction, since we place queens before creating regions around them. This avoids the computationally expensive alternative of generating a random region map and then checking if any valid queen placement exists.

### 5.2 N-Queens with No-Adjacency Solver

The standard N-Queens problem allows diagonal attacks; Queens forbids even **diagonal adjacency**. This is a stricter constraint.

```
PSEUDOCODE: solveNQueensNoAdjacent(N, rng)

  board = N×N empty
  
  function backtrack(row):
    if row == N: return true  // all queens placed
    
    cols = shuffle([0, 1, ..., N-1], rng)
    for col in cols:
      if isValidQueenPlacement(board, row, col):
        board[row][col] = true
        if backtrack(row + 1): return true
        board[row][col] = false
    return false
  
  function isValidQueenPlacement(board, row, col):
    // Check column: no queen in any previous row at this col
    for r in [0, row):
      if board[r][col]: return false
    
    // Check all 8-adjacency with previous queens
    for r in [0, row):
      for c in [0, N):
        if board[r][c] and |r - row| <= 1 and |c - col| <= 1:
          return false
    return true
```

For N=5..9 this is nearly instant with backtracking.

### 5.3 Solver for Uniqueness Verification

The solver verifies that a given (regionMap, N) puzzle has **exactly one** valid queen placement. It uses backtracking row-by-row with constraint propagation.

```
PSEUDOCODE: solve(regionMap, maxSolutions=2)

  N = regionMap.length
  queens = []  // placed queen positions
  usedCols = Set()
  usedRegions = Set()
  solutions = []
  
  function backtrack(row):
    if solutions.length >= maxSolutions: return
    if row == N:
      solutions.push([...queens])
      return
    
    for col in [0, N):
      regionId = regionMap[row][col]
      if col in usedCols: continue
      if regionId in usedRegions: continue
      if adjacentToAnyQueen(queens, row, col): continue
      
      queens.push({r: row, c: col})
      usedCols.add(col)
      usedRegions.add(regionId)
      
      backtrack(row + 1)
      
      queens.pop()
      usedCols.delete(col)
      usedRegions.delete(regionId)
  
  backtrack(0)
  return solutions
```

### 5.4 Puzzle Uniqueness Guarantee

Since we use the **solution-first** approach:
1. Generate queens → build regions → regions are guaranteed to have *at least* one solution
2. Run solver to check if `solutions.length == 1`
3. If multiple solutions exist, **regenerate** with a different RNG sequence
4. For most valid region maps, uniqueness is naturally achieved because the region shapes constrain placement sufficiently

> [!TIP]
> In practice, the solution-first region growing approach produces unique puzzles ~80-90% of the time for N≤7. For N≥8, we may need a retry loop, but backtracking is fast enough that this is not a concern.

---

## 6. Estimated File List

### 6.1 New Files

| File | Purpose | Follows Tango Pattern |
|---|---|---|
| `src/games/queens/queens-logic.js` | Board model, constraint validators, error finder, win detection | `tango-logic.js` |
| `src/games/queens/queens-solver.js` | Backtracking solver with row-by-row + constraint propagation | `tango-solver.js` |
| `src/games/queens/queens-generator.js` | Region map generation (solution-first + flood fill), puzzle construction | `tango-generator.js` |
| `src/games/queens/queens-daily.js` | Daily pipeline (date → seed → difficulty → puzzle), save/resume | `tango-daily.js` |
| `src/games/queens/queens-renderer.js` | DOM grid builder, colored regions, queen/marker rendering, error highlighting | `tango-renderer.js` |
| `src/games/queens/queens.js` | Game controller (lifecycle, tap cycle, validation, win flow) | `tango.js` |
| `src/styles/queens.css` | Grid styling, region colors, queen/marker symbols, error stripes | `tango.css` |
| `public/data/queens-levels.json` | 20 hand-crafted puzzle bank | `tango-levels.json` |
| `tests/queens/queens-logic.test.js` | Logic unit tests | `tango-logic.test.js` |
| `tests/queens/queens-solver.test.js` | Solver unit tests | `tango-solver.test.js` |
| `tests/queens/queens-generator.test.js` | Generator unit tests | `tango-generator.test.js` |
| `tests/queens/queens-daily.test.js` | Daily pipeline unit tests | `tango-daily.test.js` |
| `scripts/generate-queens-bank.js` | Script to generate the 20-puzzle JSON bank | `generate-bank.js` |

### 6.2 Modified Files

| File | Change |
|---|---|
| `src/main.js` | Import `queens.js`, register `/queens` route, set Queens hub card `available: true` |
| `src/styles/tokens.css` | Add any Queens-specific tokens (cell size variables for variable grids) |
| `public/manifest.json` | No change needed (Queens shares the same PWA manifest) |

### 6.3 Directory Tree (final state)

```
tango/
├── src/
│   ├── games/
│   │   ├── tango/          # (unchanged)
│   │   └── queens/
│   │       ├── queens-logic.js
│   │       ├── queens-solver.js
│   │       ├── queens-generator.js
│   │       ├── queens-daily.js
│   │       ├── queens-renderer.js
│   │       └── queens.js
│   └── styles/
│       ├── tokens.css       # (minor additions)
│       └── queens.css       # (new)
├── tests/
│   └── queens/
│       ├── queens-logic.test.js
│       ├── queens-solver.test.js
│       ├── queens-generator.test.js
│       └── queens-daily.test.js
├── public/
│   └── data/
│       ├── tango-levels.json
│       └── queens-levels.json
└── scripts/
    ├── generate-bank.js
    └── generate-queens-bank.js
```

---

## 7. Phased Implementation Roadmap

| Phase | Scope | Key Deliverables |
|---|---|---|
| **Phase 1** | Core Logic Engine | `queens-logic.js`, `queens-solver.js`, `queens-generator.js` + full test suite |
| **Phase 2** | UI & Renderer | `queens-renderer.js`, `queens.css`, `queens.js` (controller) — playable game |
| **Phase 3** | Daily Integration | `queens-daily.js`, JSON bank generation, save/resume, streak integration |
| **Phase 4** | Polish & Hub | Hub card activation, responsive sizing, PWA updates, final test pass |

---

## 8. Key Differences from Tango (Summary)

| Aspect | Tango | Queens |
|---|---|---|
| Grid size | Fixed 6×6 | Variable 5×5 to 9×9 |
| Cell content | Sun / Moon (binary) | Queen / Marker / Empty (ternary tap cycle) |
| Puzzle definition | Partially-filled board + constraints | Empty board + colored region map |
| Constraints | Balance, no-triple, sign constraints | Row/col/region uniqueness, 8-adjacency |
| Visual identity | Sun/moon CSS shapes, constraint markers | Colored region backgrounds, queen crown icons |
| Generator approach | Complete board → remove cells | Place queens → grow regions around them |
| Solver domain | 2^(empty cells) placements | N! column permutations (pruned heavily) |

---

## Open Questions

> [!IMPORTANT]
> **Q1: Region border rendering** — Should region borders be thick solid lines (like LinkedIn) or subtle color transitions? LinkedIn uses **thick dark borders** between cells of different regions and **no border** between cells of the same region. This is the recommended approach.

> [!IMPORTANT]
> **Q2: Queen symbol rendering** — CSS-only crown shape vs. Unicode ♛ vs. SVG? Recommendation: Use a **CSS crown** similar to how Tango uses CSS sun/moon, with a Unicode ♛ fallback. The LinkedIn game uses a simple filled crown icon.

> [!NOTE]
> **Q3: Grid sizing** — For variable N (5-9), the cell size should scale inversely with N to keep the grid fitting comfortably on mobile. Proposed formula: `cellSize = min(56, floor(300 / N))` px. This gives ~60px for 5×5 and ~33px for 9×9.
