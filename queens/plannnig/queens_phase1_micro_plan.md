# Phase 1 Micro-Plan: Core Logic Engine

> **Deliverable 2 of 5** — Detailed implementation plan for `queens-logic.js`, `queens-solver.js`, `queens-generator.js`, and their test suites.

---

## Overview

Phase 1 builds the **pure-logic foundation** of the Queens game with zero DOM dependencies. All three modules are pure functions operating on plain arrays/objects, making them fully testable with Vitest + jsdom. This phase follows the exact TDD pattern established by Tango: write tests → implement logic → verify all green.

---

## Data Model / Architecture

### Board State Constants

```
CELL = { EMPTY: null, QUEEN: 'queen', MARKER: 'marker' }
```

### Core Data Structures

| Structure | Shape | Description |
|---|---|---|
| `regionMap` | `number[][]` (N×N) | Static puzzle definition. Each cell is a region ID `[0, N)`. |
| `board` | `(null\|'queen'\|'marker')[][]` (N×N) | Mutable player state. |
| `solution` | `{r: number, c: number}[]` | Array of N queen positions (the unique solution). |

### Region Metadata (derived, cached)

```
regionCells: Map<regionId, [{r, c}]>   // which cells belong to each region
```

This is computed once from `regionMap` at puzzle load time and cached for fast lookups.

---

## Proposed File Changes

### [NEW] `src/games/queens/queens-logic.js`

**Exports:**

| Export | Signature | Purpose |
|---|---|---|
| `CELL` | `Object.freeze({EMPTY, QUEEN, MARKER})` | Cell state constants |
| `createBoard(size)` | `(number) → null[][]` | Create empty N×N board |
| `cloneBoard(board)` | `(any[][]) → any[][]` | Deep clone |
| `inBounds(r, c, size)` | `(n, n, n) → boolean` | Bounds check |
| `getRegionCells(regionMap)` | `(number[][]) → Map<number, {r,c}[]>` | Build region→cells lookup |
| `findQueens(board)` | `(any[][]) → {r,c}[]` | Find all queen positions |
| `checkRowConflicts(board)` | `(any[][]) → Set<string>` | Find queens sharing a row |
| `checkColConflicts(board)` | `(any[][]) → Set<string>` | Find queens sharing a column |
| `checkRegionConflicts(board, regionMap)` | `(any[][], number[][]) → Set<string>` | Find queens sharing a region |
| `checkAdjacencyConflicts(board)` | `(any[][]) → Set<string>` | Find adjacent queen pairs |
| `findAllErrors(board, regionMap)` | `(any[][], number[][]) → {cells: Set<string>, message: string\|null}` | Combined error finder |
| `checkWin(board, regionMap)` | `(any[][], number[][]) → boolean` | Win detection |
| `boardToString(board)` | `(any[][]) → string` | Debug pretty-print |

**Dependencies:** None (pure module).

**Key Design Decision — Post-Placement Validation:**

Unlike Tango's `isValidPlacement` which checks *before* placing, Queens uses a **post-placement scan** approach (matching the `findAllErrors` pattern in `tango.js`). This is because:
1. Placement is NEVER blocked — the user always freely places
2. We need to highlight ALL conflicting pairs, not just one
3. Scanning the full board after each move is cheap for N≤9 (max 81 cells)

Each `check*Conflicts` function returns a `Set<string>` of `"row,col"` keys for all cells involved in that violation type. `findAllErrors` unions them all.

---

### [NEW] `src/games/queens/queens-solver.js`

**Exports:**

| Export | Signature | Purpose |
|---|---|---|
| `solve(regionMap, maxSolutions)` | `(number[][], number?) → {r,c}[][]` | Find up to N solutions |
| `hasUniqueSolution(regionMap)` | `(number[][]) → boolean` | Check exactly 1 solution |

**Dependencies:** `queens-logic.js` (for `inBounds`).

**Algorithm: Row-by-Row Backtracking**

The solver processes one row at a time (since each row must have exactly one queen). At each row, it tries each column and prunes immediately using:
- **Column uniqueness**: skip if column already used
- **Region uniqueness**: skip if region already used
- **Adjacency**: skip if any previously-placed queen is in the 8-neighborhood

```
PSEUDOCODE: solve(regionMap, maxSolutions = 2)

  N = regionMap.length
  solutions = []
  placement = []       // [{r, c}] queens placed so far
  usedCols = Set()
  usedRegions = Set()

  function backtrack(row):
    if solutions.length >= maxSolutions: return
    if row == N:
      solutions.push([...placement])
      return

    for col in [0, N):
      // Prune 1: column already used
      if col in usedCols: continue

      // Prune 2: region already used  
      regionId = regionMap[row][col]
      if regionId in usedRegions: continue

      // Prune 3: adjacent to any placed queen
      if isAdjacentToAny(placement, row, col): continue

      // Place queen
      placement.push({r: row, c: col})
      usedCols.add(col)
      usedRegions.add(regionId)

      backtrack(row + 1)

      // Unplace
      placement.pop()
      usedCols.delete(col)
      usedRegions.delete(regionId)

  function isAdjacentToAny(queens, r, c):
    for q in queens:
      if |q.r - r| <= 1 and |q.c - c| <= 1: return true
    return false

  backtrack(0)
  return solutions
```

**Performance Notes:**
- For N=5: worst case ~120 leaf nodes, typically <10ms
- For N=9: worst case ~362880 leaf nodes, but pruning reduces to <1000, typically <50ms
- `maxSolutions=2` aborts early for uniqueness checks

---

### [NEW] `src/games/queens/queens-generator.js`

**Exports:**

| Export | Signature | Purpose |
|---|---|---|
| `generatePuzzle(difficulty, rng)` | `(string, () → number) → PuzzleData` | Full puzzle generation pipeline |
| `placeQueensNoAdjacent(N, rng)` | `(number, () → number) → {r,c}[]` | Random valid queen placement |
| `growRegions(N, queenPositions, rng)` | `(number, {r,c}[], () → number) → number[][]` | BFS region growing |

**Dependencies:** `queens-solver.js` (for `hasUniqueSolution`), `../../shared/rng.js` (for `shuffle`, `randInt`).

#### Algorithm 1: Queen Placement (`placeQueensNoAdjacent`)

```
PSEUDOCODE: placeQueensNoAdjacent(N, rng)

  queens = []

  function backtrack(row):
    if row == N: return true

    // Randomize column order for variety
    cols = shuffle([0, 1, ..., N-1], rng)
    
    for col in cols:
      // Check column not used
      if any queen in queens has col == col: continue
      
      // Check not adjacent to any placed queen
      // Only need to check row-1 (previous row) since we go row by row
      // and adjacency is |dr| <= 1, |dc| <= 1
      if row > 0:
        prevQueen = queens[row - 1]  // queen in row-1
        if |prevQueen.c - col| <= 1: continue
      
      // Also check column adjacency with row-1 queen at different cols
      // Actually need to check ALL previous queens for column adjacency
      adjacent = false
      for q in queens:
        if |q.r - row| <= 1 and |q.c - col| <= 1:
          adjacent = true; break
      if adjacent: continue

      queens.push({r: row, c: col})
      if backtrack(row + 1): return true
      queens.pop()
    
    return false

  backtrack(0)
  return queens
```

#### Algorithm 2: Region Growing (`growRegions`)

```
PSEUDOCODE: growRegions(N, queenPositions, rng)

  regionMap = N×N grid of -1 (unassigned)
  regionSizes = Array(N).fill(0)
  
  // Seed each region with its queen cell
  for i in [0, N):
    q = queenPositions[i]
    regionMap[q.r][q.c] = i
    regionSizes[i] = 1

  // Build initial frontier: all unassigned neighbors of seed cells
  frontier = []
  for i in [0, N):
    q = queenPositions[i]
    for each neighbor (nr, nc) of (q.r, q.c):
      if inBounds(nr, nc, N) and regionMap[nr][nc] == -1:
        frontier.push({r: nr, c: nc, regionId: i})

  // Grow regions iteratively
  // Strategy: process frontier in shuffled order, but prioritize
  // expanding the smallest region to keep sizes balanced
  
  while frontier.length > 0:
    shuffle(frontier, rng)
    
    // Sort by region size (smallest first) for balance
    frontier.sort((a, b) => regionSizes[a.regionId] - regionSizes[b.regionId])
    
    // Try to assign the first valid entry
    assigned = false
    for i in [0, frontier.length):
      entry = frontier[i]
      if regionMap[entry.r][entry.c] != -1: 
        frontier.splice(i, 1)  // already assigned
        continue
      
      // Check: would assigning this cell maintain region connectivity?
      // Simple check: is the cell adjacent to an existing cell of the same region?
      if not adjacentToRegion(regionMap, entry.r, entry.c, entry.regionId, N):
        continue  // skip, would create disconnected region piece
      
      regionMap[entry.r][entry.c] = entry.regionId
      regionSizes[entry.regionId]++
      frontier.splice(i, 1)
      
      // Add this cell's unassigned neighbors to frontier
      for each neighbor (nr, nc) of (entry.r, entry.c):
        if inBounds(nr, nc, N) and regionMap[nr][nc] == -1:
          frontier.push({r: nr, c: nc, regionId: entry.regionId})
      
      assigned = true
      break
    
    if not assigned:
      // All frontier entries are stale or blocked — 
      // assign remaining unassigned cells to nearest region
      assignRemainingCells(regionMap, N)
      break

  function adjacentToRegion(regionMap, r, c, regionId, N):
    // Check 4-directional neighbors (not diagonal — connectivity = orthogonal)
    for (dr, dc) in [(-1,0),(1,0),(0,-1),(0,1)]:
      nr = r + dr; nc = c + dc
      if inBounds(nr, nc, N) and regionMap[nr][nc] == regionId:
        return true
    return false

  return regionMap
```

#### Algorithm 3: Full Pipeline (`generatePuzzle`)

```
PSEUDOCODE: generatePuzzle(difficulty, rng)

  config = DIFFICULTY[difficulty]
  N = pickFrom(config.sizes, rng)  // e.g., [5] for easy, [6,7] for medium

  // Retry loop: generate until we get a unique puzzle
  maxAttempts = 50
  for attempt in [0, maxAttempts):
    queens = placeQueensNoAdjacent(N, rng)
    regionMap = growRegions(N, queens, rng)
    
    // Verify uniqueness
    if hasUniqueSolution(regionMap):
      return {
        size: N,
        regionMap: regionMap,
        solution: queens,
        difficulty: difficulty,
      }
  
  // Fallback: should rarely happen
  // Return last generated puzzle even if not unique
  // (solver will still accept it — multiple solutions just means it's easier)
  return { size: N, regionMap, solution: queens, difficulty }
```

**Difficulty Config:**
```
DIFFICULTY = {
  easy:   { sizes: [5] },
  medium: { sizes: [6, 7] },
  hard:   { sizes: [7, 8, 9] },
}
```

---

## Test Plan

### `tests/queens/queens-logic.test.js`

#### `createBoard`
- `[T1]` Returns N×N grid of nulls for size=5
- `[T2]` Returns N×N grid of nulls for size=9
- `[T3]` Rows are independent (mutating one doesn't affect others)

#### `cloneBoard`
- `[T4]` Creates independent copy
- `[T5]` Preserves all values

#### `inBounds`
- `[T6]` Accepts (0,0,5) and (4,4,5)
- `[T7]` Rejects (-1,0,5), (5,0,5), (0,-1,5), (0,5,5)

#### `getRegionCells`
- `[T8]` Correctly groups cells by region ID for a known 5×5 map
- `[T9]` Returns N entries for an N-region map
- `[T10]` Each cell appears exactly once across all regions

#### `findQueens`
- `[T11]` Returns empty array for empty board
- `[T12]` Finds all queens on a partially-filled board
- `[T13]` Ignores markers (only returns queen cells)

#### `checkRowConflicts`
- `[T14]` No conflicts with one queen per row → empty set
- `[T15]` Two queens in row 0 → both cells in error set
- `[T16]` Three queens in row 2 → all three cells in error set
- `[T17]` Multiple row violations → union of all error cells

#### `checkColConflicts`
- `[T18]` No conflicts with one queen per column → empty set
- `[T19]` Two queens in column 3 → both cells in error set
- `[T20]` Column conflict doesn't affect row-clean queens

#### `checkRegionConflicts`
- `[T21]` No conflicts with one queen per region → empty set
- `[T22]` Two queens in same region → both cells in error set
- `[T23]` Works with irregular region shapes

#### `checkAdjacencyConflicts`
- `[T24]` No conflicts when queens are spaced apart → empty set
- `[T25]` Horizontal adjacency (same row, col diff = 1) → both in error set
- `[T26]` Vertical adjacency (same col, row diff = 1) → both in error set
- `[T27]` Diagonal adjacency (row diff = 1, col diff = 1) → both in error set
- `[T28]` Non-adjacent queens (row diff = 2) → empty set
- `[T29]` Multiple adjacency violations → union of all involved cells

#### `findAllErrors`
- `[T30]` Clean board with valid placement → `{cells: empty, message: null}`
- `[T31]` Combines row + adjacency violations → union of all error cells
- `[T32]` Returns appropriate message string for violations
- `[T33]` Markers are ignored in all conflict checks

#### `checkWin`
- `[T34]` Valid complete board (one queen per row/col/region, no adjacency) → true
- `[T35]` Incomplete board (fewer than N queens) → false
- `[T36]` Board with row duplication → false
- `[T37]` Board with column duplication → false
- `[T38]` Board with region duplication → false
- `[T39]` Board with adjacency violation → false
- `[T40]` Board with markers + correct queens → true (markers ignored)

#### `boardToString`
- `[T41]` Formats Q for queen, × for marker, · for empty

---

### `tests/queens/queens-solver.test.js`

#### `solve`
- `[T42]` Finds the correct solution for a known 5×5 puzzle
- `[T43]` Returns exactly 1 solution for a unique puzzle
- `[T44]` Returns 2 solutions for an ambiguous region map (maxSolutions=2)
- `[T45]` Returns empty array for an impossible region map
- `[T46]` Respects maxSolutions limit (stops early)
- `[T47]` Handles N=7 within reasonable time (<200ms)

#### `hasUniqueSolution`
- `[T48]` Returns true for a known unique puzzle
- `[T49]` Returns false for a puzzle with multiple solutions

---

### `tests/queens/queens-generator.test.js`

#### `placeQueensNoAdjacent`
- `[T50]` Returns N queens for N=5
- `[T51]` All queens in different rows (one per row, 0 to N-1)
- `[T52]` All queens in different columns
- `[T53]` No two queens are adjacent (8-directional)
- `[T54]` Deterministic: same RNG seed → same placement
- `[T55]` Works for N=5, 6, 7, 8, 9

#### `growRegions`
- `[T56]` Returns N×N grid with all cells assigned (no -1 remaining)
- `[T57]` Exactly N distinct region IDs [0, N-1]
- `[T58]` Each region is connected (BFS/DFS from any cell reaches all cells in that region)
- `[T59]` Each queen position is in its assigned region
- `[T60]` Deterministic: same RNG seed → same region map

#### `generatePuzzle`
- `[T61]` Returns valid puzzle data shape: `{size, regionMap, solution, difficulty}`
- `[T62]` Solution satisfies all Queens constraints
- `[T63]` Puzzle has unique solution (verified by solver)
- `[T64]` Easy difficulty produces size=5
- `[T65]` Medium difficulty produces size 6 or 7
- `[T66]` Hard difficulty produces size 7, 8, or 9
- `[T67]` Deterministic: same RNG seed + difficulty → same puzzle

---

## Implementation Steps

### Checkpoint 0: Setup
1. `[ ]` Create directory `src/games/queens/`
2. `[ ]` Create directory `tests/queens/`

### Checkpoint 1: queens-logic.js (Board Model + Validators)
3. `[ ]` Write `queens-logic.test.js` with tests T1–T41
4. `[ ]` Implement `CELL`, `createBoard`, `cloneBoard`, `inBounds`, `boardToString`
5. `[ ]` Implement `getRegionCells`, `findQueens`
6. `[ ]` Implement `checkRowConflicts`
7. `[ ]` Implement `checkColConflicts`
8. `[ ]` Implement `checkRegionConflicts`
9. `[ ]` Implement `checkAdjacencyConflicts`
10. `[ ]` Implement `findAllErrors` (combines all checks)
11. `[ ]` Implement `checkWin`
12. `[ ]` **CHECKPOINT**: Run `npx vitest run tests/queens/queens-logic.test.js` — all tests green

### Checkpoint 2: queens-solver.js
13. `[ ]` Write `queens-solver.test.js` with tests T42–T49
14. `[ ]` Implement `solve` (row-by-row backtracking)
15. `[ ]` Implement `hasUniqueSolution`
16. `[ ]` **CHECKPOINT**: Run `npx vitest run tests/queens/queens-solver.test.js` — all tests green

### Checkpoint 3: queens-generator.js
17. `[ ]` Write `queens-generator.test.js` with tests T50–T67
18. `[ ]` Implement `placeQueensNoAdjacent`
19. `[ ]` Implement `growRegions` (BFS flood fill)
20. `[ ]` Implement `generatePuzzle` (full pipeline with uniqueness retry)
21. `[ ]` **CHECKPOINT**: Run `npx vitest run tests/queens/queens-generator.test.js` — all tests green

### Checkpoint 4: Full Phase 1 Verification
22. `[ ]` Run `npx vitest run tests/queens/` — ALL Phase 1 tests green
23. `[ ]` Manual spot-check: log a generated puzzle to console, visually verify region map makes sense

---

## Open Questions

> [!NOTE]
> **Q1: Region connectivity definition** — Should connectivity be **4-connected** (orthogonal only: up/down/left/right) or **8-connected** (including diagonals)? Recommendation: **4-connected** — this matches LinkedIn's visual design where regions are contiguous blocks sharing edges, and is more natural for the player to visually parse. Two cells sharing only a corner would look disconnected.

> [!NOTE]
> **Q2: Fallback for uniqueness retry exhaustion** — If after 50 attempts no unique puzzle is found (extremely unlikely for N≤7, possible for N=9), should we: (a) return the best non-unique puzzle, (b) fall back to a smaller grid size, or (c) throw an error? Recommendation: **(a)** — return the last generated puzzle. A puzzle with 2 solutions is still playable; the player just happens to find one valid arrangement.
