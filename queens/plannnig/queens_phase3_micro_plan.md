# Phase 3 Micro-Plan: Daily Integration

> **Deliverable 4 of 5** — Detailed implementation plan for `queens-daily.js`, `generate-queens-bank.js`, `queens-levels.json`, and daily pipeline tests.

---

## Overview

Phase 3 connects the Queens game to the daily puzzle infrastructure, following the exact same pipeline as Tango: `date → seed → difficulty → puzzle`. It also creates the 20-puzzle JSON bank for the first 20 days and implements save/resume so players can close the browser and come back to their in-progress puzzle.

---

## Data Model / Architecture

### Daily Pipeline Flow

```
Date (YYYY-MM-DD)
  ↓ dateSeed(date, 'queens')
Seed (integer)
  ↓ getDailyDifficulty(date)
Difficulty ('easy' | 'medium' | 'hard')
  ↓ Day 1-20: loadBank() | Day 21+: generatePuzzle(difficulty, createRNG(seed))
PuzzleData { size, regionMap, solution, difficulty, dayNumber, isFromBank }
```

### Save State Shape

```
{
  date: string,            // 'YYYY-MM-DD'
  size: number,            // N
  regionMap: number[][],   // N×N region IDs
  board: (null|'queen'|'marker')[][],  // current player state
  solution: {r,c}[],      // N queen positions
  difficulty: string,
  dayNumber: number,
  elapsed: number,         // seconds
  moveHistory: {row, col, from, to}[],
  completed: boolean,
}
```

### JSON Bank Schema (`queens-levels.json`)

```
[
  {
    "size": 5,
    "regionMap": [[0,0,1,1,1], [0,2,2,1,3], ...],
    "solution": [{"r":0,"c":2}, {"r":1,"c":4}, ...],
    "difficulty": "easy"
  },
  ...
]
```

20 entries. Days 1-7: easy (5×5), Days 8-14: medium (6×6 or 7×7), Days 15-20: hard (7×7 or 8×8).

---

## Proposed File Changes

### [NEW] `src/games/queens/queens-daily.js`

**Exports:**

| Export | Signature | Purpose |
|---|---|---|
| `getDayNumber(dateStr?)` | `(string?) → number` | Day number since epoch (1-indexed) |
| `getDailyDifficulty(dateStr?)` | `(string?) → string` | Difficulty for a given date |
| `getDailyPuzzle(dateStr?)` | `(string?) → Promise<PuzzleData>` | Full daily pipeline |
| `getPracticePuzzle(diff?)` | `(string?) → PuzzleData` | Non-daily random puzzle |
| `saveGameState(gameState)` | `(object) → void` | Save to localStorage |
| `loadGameState()` | `() → object\|null` | Load saved state for today |
| `isDailyCompleted()` | `() → boolean` | Check if today is done |

**Dependencies:**
- `../../shared/rng.js` — `createRNG`, `dateSeed`
- `./queens-generator.js` — `generatePuzzle`
- `../../shared/storage.js` — `get`, `set`, `getToday`

**Key Differences from Tango's Daily:**

| Aspect | Tango | Queens |
|---|---|---|
| Storage key | `tango_daily` | `queens_daily` |
| Salt for seed | `'tango'` | `'queens'` |
| Difficulty salt | `'tango_difficulty'` | `'queens_difficulty'` |
| Epoch date | `'2026-04-18'` | `'2026-04-18'` (same launch day) |
| Saved state shape | board + constraints | board + regionMap (no constraints) |
| Puzzle loading | Puzzle is partially-filled board | Puzzle is empty board + regionMap |

#### Pseudocode

```
PSEUDOCODE: getDailyPuzzle(dateStr?)

  date = dateStr || getToday()
  dayNumber = getDayNumber(date)
  difficulty = getDailyDifficulty(date)

  // Days 1-20: try JSON bank
  if dayNumber >= 1 and dayNumber <= 20:
    bank = await loadBank()
    if bank and bank[dayNumber - 1]:
      entry = bank[dayNumber - 1]
      return {
        size: entry.size,
        regionMap: entry.regionMap,
        solution: entry.solution,
        difficulty: entry.difficulty || difficulty,
        dayNumber,
        isFromBank: true,
      }

  // Day 21+: generate algorithmically
  seed = dateSeed(date, 'queens')
  rng = createRNG(seed)
  generated = generatePuzzle(difficulty, rng)

  return {
    ...generated,
    dayNumber,
    isFromBank: false,
  }
```

```
PSEUDOCODE: saveGameState(gameState)

  storage.set('queens_daily', {
    date: gameState.date || getToday(),
    size: gameState.size,
    regionMap: gameState.regionMap,
    board: gameState.board,
    solution: gameState.solution,
    difficulty: gameState.difficulty,
    dayNumber: gameState.dayNumber,
    elapsed: gameState.elapsed,
    moveHistory: gameState.moveHistory,
    completed: gameState.completed || false,
  })
```

```
PSEUDOCODE: loadGameState()

  saved = storage.get('queens_daily')
  if not saved: return null
  if saved.date != getToday(): return null
  return saved
```

---

### [NEW] `scripts/generate-queens-bank.js`

**Purpose:** Node.js script that generates 20 puzzles and writes `public/data/queens-levels.json`.

**Algorithm:**

```
PSEUDOCODE: generateBank()

  puzzles = []
  
  // Days 1-7: Easy (5×5)
  for day in [1, 7]:
    seed = baseSeed + day
    rng = createRNG(seed)
    puzzle = generatePuzzle('easy', rng)
    puzzles.push(puzzle)
  
  // Days 8-14: Medium (6×6 or 7×7)
  for day in [8, 14]:
    seed = baseSeed + day
    rng = createRNG(seed)
    puzzle = generatePuzzle('medium', rng)
    puzzles.push(puzzle)
  
  // Days 15-20: Hard (7×7+)
  for day in [15, 20]:
    seed = baseSeed + day
    rng = createRNG(seed)
    puzzle = generatePuzzle('hard', rng)
    puzzles.push(puzzle)
  
  // Verify all puzzles have unique solutions
  for each puzzle:
    assert(hasUniqueSolution(puzzle.regionMap))
  
  writeFile('public/data/queens-levels.json', JSON.stringify(puzzles, null, 2))
```

**Run command:** `node scripts/generate-queens-bank.js`

---

### [MODIFY] `src/main.js`

**Changes:**
1. Import Queens CSS: `import './styles/queens.css'`
2. Import Queens module: `import * as queens from './games/queens/queens.js'`
3. Register route: `register('/queens', queens)`
4. Update hub card: Set Queens `available: true`

```
// Before:
{ id: 'queens', name: 'Queens', icon: '👑', gradient: '...', available: false },

// After:
{ id: 'queens', name: 'Queens', icon: '👑', gradient: '...', available: true },
```

---

### [NEW] `tests/queens/queens-daily.test.js`

#### Test Cases

##### `getDayNumber`
- `[T68]` Returns 1 for epoch date
- `[T69]` Returns 2 for day after epoch
- `[T70]` Returns correct number for arbitrary future date

##### `getDailyDifficulty`
- `[T71]` Returns one of 'easy', 'medium', 'hard'
- `[T72]` Same date always returns same difficulty
- `[T73]` Different dates may return different difficulties

##### `getDailyPuzzle`
- `[T74]` Returns valid puzzle data shape
- `[T75]` Same date returns same puzzle (deterministic)
- `[T76]` Different dates return different puzzles

##### `saveGameState / loadGameState`
- `[T77]` Save then load returns same state
- `[T78]` Load returns null when no saved state
- `[T79]` Load returns null when saved state is from different day

##### `isDailyCompleted`
- `[T80]` Returns false when no saved state
- `[T81]` Returns true when today's puzzle is saved as completed
- `[T82]` Returns false when saved state is from different day

##### `getPracticePuzzle`
- `[T83]` Returns valid puzzle data shape
- `[T84]` Returns dayNumber = 0
- `[T85]` Accepts difficulty override

---

## Implementation Steps

### Checkpoint 8: queens-daily.js
1. `[ ]` Write `queens-daily.test.js` with tests T68–T85
2. `[ ]` Implement `getDayNumber` (copy from Tango, adjust epoch)
3. `[ ]` Implement `getDailyDifficulty` (copy from Tango, change salt to `'queens_difficulty'`)
4. `[ ]` Implement `loadBank` (fetch `/data/queens-levels.json`)
5. `[ ]` Implement `getDailyPuzzle` (bank or algorithmic pipeline)
6. `[ ]` Implement `getPracticePuzzle`
7. `[ ]` Implement `saveGameState` / `loadGameState` / `isDailyCompleted`
8. `[ ]` **CHECKPOINT**: Run `npx vitest run tests/queens/queens-daily.test.js` — all tests green

### Checkpoint 9: Bank Generation
9. `[ ]` Create `scripts/generate-queens-bank.js`
10. `[ ]` Run script: `node scripts/generate-queens-bank.js`
11. `[ ]` Verify `public/data/queens-levels.json` has 20 valid entries
12. `[ ]` Spot-check: log a few puzzles, visually verify region maps

### Checkpoint 10: Hub Integration
13. `[ ]` Add `import './styles/queens.css'` to `main.js`
14. `[ ]` Add `import * as queens from './games/queens/queens.js'` to `main.js`
15. `[ ]` Add `register('/queens', queens)` 
16. `[ ]` Set Queens hub card `available: true`
17. `[ ]` **CHECKPOINT**: `npm run dev`, navigate to hub, click Queens card, verify game loads and plays correctly

### Checkpoint 11: Save/Resume Integration
18. `[ ]` Wire `autoSave` into queens.js controller (debounced, daily only)
19. `[ ]` Wire `loadGameState` into mount (restore board state)
20. `[ ]` Wire `showCompletedState` for already-solved puzzles
21. `[ ]` **CHECKPOINT**: Play partially, refresh browser, verify state is restored

---

## Open Questions

> [!NOTE]
> **Q1: Bank size** — 20 puzzles matches Tango. Is this sufficient? The algorithmic generator takes over on day 21. Recommendation: **20 is fine** — same as Tango, provides a safety net of curated puzzles for the first 3 weeks.

> [!NOTE]
> **Q2: Practice mode** — Tango's practice uses a random seed. Queens should do the same. Should practice offer a difficulty picker (Easy/Medium/Hard buttons)? Recommendation: **No dedicated picker for now** — just random difficulty, matching Tango's practice mode. Can be added as polish later.
