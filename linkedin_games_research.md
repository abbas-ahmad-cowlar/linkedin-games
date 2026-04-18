# LinkedIn Daily Puzzle Games — Comprehensive Research

> [!NOTE]
> **Research Date:** April 18, 2026  
> **Total Games:** 7 daily puzzles  
> **Platform:** linkedin.com/games (Desktop & Mobile App)  
> **Reset Time:** Midnight Pacific Time (PT) daily  
> **Cost:** Free for all LinkedIn members

---

## Table of Contents

1. [Overview & History](#1-overview--history)
2. [Game 1: Queens](#2-queens)
3. [Game 2: Tango](#3-tango)
4. [Game 3: Pinpoint](#4-pinpoint)
5. [Game 4: Crossclimb](#5-crossclimb)
6. [Game 5: Zip](#6-zip)
7. [Game 6: Mini Sudoku](#7-mini-sudoku)
8. [Game 7: Patches](#8-patches)
9. [Social & Engagement Features](#9-social--engagement-features)
10. [UI/UX Design System](#10-uiux-design-system)
11. [Animations & Visual Feedback](#11-animations--visual-feedback)
12. [Scoring & Metrics](#12-scoring--metrics)
13. [Engagement Statistics](#13-engagement-statistics)
14. [The Puzzle Designer](#14-the-puzzle-designer)
15. [Game Comparison Matrix](#15-game-comparison-matrix)

---

## 1. Overview & History

### What Are LinkedIn Games?

LinkedIn Games are a suite of **seven free daily puzzle games** embedded directly into the LinkedIn platform. They are designed as short, "bite-sized" mental breaks (typically solvable in under 5–10 minutes) that serve a dual purpose:

1. **Cognitive stimulation** — Positioned as "brain fuel" or "mind-chargers" for professionals
2. **Social engagement** — Creating daily shared rituals that foster networking, conversation starters, and friendly competition within professional networks

### Launch Timeline

| Date | Event |
|------|-------|
| **May 1, 2024** | Official launch with the first 3 games: **Pinpoint**, **Queens**, **Crossclimb** |
| **July 2024** | **Tango** added to the lineup |
| **Late 2024** | **Zip** added to the lineup |
| **2025** | **Mini Sudoku** added |
| **March 2026** | **Patches** added (most recent game) |

### Strategic Purpose

LinkedIn positions these games not as distractions, but as tools to transform the platform from a "transactional utility" (job search, connection requests) into a **"daily destination"** — increasing session frequency and platform stickiness. The games leverage the "Wordle effect" — finite daily content that creates anticipation and shared social moments.

---

## 2. Queens

### Overview

| Property | Value |
|----------|-------|
| **Genre** | Spatial logic / constraint satisfaction |
| **Inspiration** | Star Battle puzzle (competitive puzzle genre) |
| **Grid Size** | Typically **~9×9 to 10×10** (varies daily) |
| **Symbol** | Crown / Queen (👑) |
| **Difficulty** | Medium to Hard |
| **Launch** | May 2024 (original batch) |

### Rules

1. **One queen per row** — Every row must contain exactly one queen
2. **One queen per column** — Every column must contain exactly one queen
3. **One queen per colored region** — The grid is divided into colored, irregularly-shaped regions; each region gets exactly one queen
4. **No adjacency** — No two queens can touch each other, **including diagonally** (the 8 surrounding cells of any queen must be empty)

### Visual Design

- **Grid appearance:** Clean square grid overlaid with **distinctly colored irregular regions**
- **Color palette:** Vibrant **pastel colors** — typical shades include:
  - Pink / Rose
  - Purple / Lavender
  - Green / Mint
  - Orange / Peach
  - Blue / Sky
  - Yellow / Gold
  - Teal / Aqua
- **Queen symbol:** A golden crown icon (👑)
- **Marking system:**
  - **Single tap** → places an "X" (elimination marker, "queen cannot go here")
  - **Double tap** → places a Queen (👑)
  - **Tap again** → clears the cell
- **Auto-X option:** Settings allow enabling "Auto-place X" — when a queen is placed, all invalid cells in its row, column, and diagonal adjacency are automatically marked with X

### Solving Strategies & Tricks

1. **Start with singletons:** Find colored regions that have only one valid cell remaining — the queen *must* go there
2. **Region-row/column analysis:** If a colored region is entirely contained within a single row or column, the queen for that region must be in that row/column. Therefore, eliminate all other cells in that row/column from contention
3. **Proximity elimination:** After placing a queen, immediately mark all cells in its row, column, and the 3×3 bounding box around it (including diagonals) with "X"
4. **Work small → large:** Start with the smallest, most constrained regions
5. **Pigeonhole principle:** If N regions share only N available rows/columns, those rows/columns are "claimed" by those regions — eliminate other region candidates from those rows/columns
6. **Edge/corner analysis:** Regions touching grid edges have naturally fewer placement options
7. **Never guess:** Every puzzle has exactly one solution derivable purely through logical deduction

### Mathematical Foundation

This is a variant of the **Star Battle** puzzle, itself related to the **N-Queens problem** in combinatorics/computer science. The colored regions add a third constraint dimension beyond the classic row/column constraints of the N-Queens problem.

---

## 3. Tango

### Overview

| Property | Value |
|----------|-------|
| **Genre** | Binary logic puzzle |
| **Inspiration** | Binairo / Takuzu / Binary puzzle |
| **Grid Size** | **6×6** |
| **Symbols** | Sun (☀️) and Moon (🌙) |
| **Difficulty** | Easy to Medium |
| **Launch** | July 2024 |

### Rules

1. **Balance rule:** Every row and every column must contain **exactly 3 Suns and 3 Moons** (equal distribution)
2. **No three-in-a-row:** No more than **two identical symbols** can be adjacent horizontally or vertically (e.g., ☀️☀️☀️ is forbidden; ☀️☀️🌙 is allowed)
3. **Constraint signs (between cells):**
   - **Equals sign (=):** The two adjacent cells must contain the **same** symbol
   - **Cross/X sign (×):** The two adjacent cells must contain **different** symbols
4. **Unique solution:** Every puzzle has exactly one valid solution — no guessing needed

### Visual Design

- **Grid:** Clean 6×6 grid with light borders
- **Symbols:**
  - **Sun (☀️):** Bright, warm-toned circular icon
  - **Moon (🌙):** Cool-toned crescent or filled circle icon
- **Constraint markers:** "=" and "×" symbols displayed on the borders between adjacent cells
- **Pre-filled cells:** Some cells come pre-filled as starting points
- **Interaction:**
  - **Click once** → Sun
  - **Click twice** → Moon
  - **Click again** → Clear

### Solving Strategies & Tricks

1. **Pair sandwiching:** If you see two identical symbols side-by-side (e.g., ☀️☀️), the cells on both sides must be the opposite symbol: 🌙☀️☀️🌙
2. **Gap filling:** If a row/column already has 3 of one symbol, fill all remaining empties with the other
3. **Constraint chaining:** Use "=" and "×" signs to create cascading deductions. If A=B and B×C, then A×C
4. **Three-in-a-row prevention:** If placing a symbol would create three-in-a-row, it must be the opposite
5. **Count remaining:** Track how many of each symbol remain in each row/column — when one hits the max (3), fill the rest with the other
6. **No unique-row assumption needed:** Unlike standard Binairo, LinkedIn's Tango does NOT require unique rows/columns — only the balance and no-three rules apply

### Mathematical Foundation

Based on **Takuzu/Binairo**, a binary constraint-satisfaction problem. The grid is small enough (6×6) to be solvable quickly but the constraint signs add an interesting twist over the standard format.

---

## 4. Pinpoint

### Overview

| Property | Value |
|----------|-------|
| **Genre** | Word association / category guessing |
| **Inspiration** | Word-association guessing games (similar to Connections, but reversed) |
| **Grid Size** | N/A (text-based) |
| **Input** | Free-text typing |
| **Difficulty** | Easy to Hard (varies by category) |
| **Launch** | May 2024 (original batch) |

### Rules

1. **Five clue words** are associated with a single hidden category
2. Clues are revealed **one at a time** (starting with the most vague/misleading)
3. After each clue, you can guess the category
4. You have a maximum of **5 guesses** total
5. **Scoring:** Based on how few clues you needed — fewer clues = better score
6. **No time limit** — take as long as you need per guess

### Visual Design

- **Layout:** Clean, centered text-based interface
- **Clue reveal:** Words appear sequentially, often with a subtle slide-in or fade-in animation
- **Input:** Text field for typing the category guess
- **Feedback:**
  - ✅ Correct → celebration animation
  - ❌ Incorrect → next clue is revealed
- **Color scheme:** Predominantly LinkedIn blue-white with category-specific accent colors

### Solving Strategies & Tricks

1. **Don't rush on clue 1:** The first clue is intentionally the most ambiguous/misleading. Wait for at least 2–3 clues before guessing
2. **Think in category terms:** The answer is always a *grouping/category/list*, not a definition. Ask "What list would all these words appear on?"
3. **Watch for multi-meaning words:** Clues often exploit word polysemy (e.g., "Python" could mean snake, programming language, or Monty Python)
4. **Look for "Blank + Word" patterns:** Many categories involve compound words or phrases (words that all precede or follow a specific word)
5. **Formatting matters:** The validation can be strict — try singular vs. plural, check spelling, try synonyms
6. **Pattern recognition improves:** Regular play builds intuition for LinkedIn's category styles

### Scoring System

| Clues Used | Score Quality |
|------------|--------------|
| 1 clue | Perfect / Exceptional |
| 2 clues | Excellent |
| 3 clues | Good |
| 4 clues | Average |
| 5 clues | Barely made it |
| 5 fails | Lost |

---

## 5. Crossclimb

### Overview

| Property | Value |
|----------|-------|
| **Genre** | Word ladder + crossword hybrid |
| **Inspiration** | Word Ladder (invented by Lewis Carroll) + Mini crossword |
| **Grid Size** | ~7 rows × 4–5 letter columns |
| **Input** | Typing + Drag-and-Drop |
| **Difficulty** | Medium to Hard |
| **Launch** | May 2024 (original batch) |

### Rules

1. **Solve clues:** You're given several crossword-style clues, each mapping to a word of a specific length (typically 4–5 letters)
2. **Reorder into a ladder:** Once solved, drag-and-drop the word rows to arrange them so each word differs from its neighbor by **exactly one letter**
   - Example: CAT → CAR → BAR → BAG
3. **Unlock endpoints:** Correctly ordering the middle words unlocks the **top** and **bottom** rows, which have separate final clues
4. **Complete the ladder:** Solve the endpoint clues to finish

### Visual Design

- **Layout:** Vertical ladder structure with rows representing words
- **Row handles:** Double-line icon (≡) on each row for drag-and-drop
- **Letter cells:** Individual letter boxes similar to a crossword
- **Drag-and-drop:** Rows physically animate as you drag them between positions
- **Feedback:**
  - Correct position → row "locks" into place with a subtle snap
  - Hint mode → highlights an incorrect row or reveals a letter

### Solving Strategies & Tricks

1. **Solve easy clues first:** Build momentum with the ones you know immediately
2. **Start reordering early:** Don't wait to solve all clues — start arranging as soon as you have 2–3 words to spot patterns
3. **Focus on common letter changes:** Look for vowel swaps (A↔E↔I↔O↔U) and common consonant alternations (R↔S↔T↔L↔N)
4. **Work both directions:** If stuck, try to connect from the bottom up or middle-out
5. **Avoid obscure words:** The puzzles use standard, common vocabulary — if you're forcing an obscure word, reconsider
6. **Use hints strategically:** The hint can reveal if a guessed word is wrong, or if a row is misplaced during reordering
7. **Desktop advantage:** Many players find the drag-and-drop easier on desktop than mobile touchscreens

### Mathematical Foundation

Based on Lewis Carroll's **Word Ladder** (Doublets), which is related to **graph theory** — each word is a node, and edges connect words that differ by one letter. The puzzle asks you to find a **Hamiltonian path** through a subset of this word graph.

---

## 6. Zip

### Overview

| Property | Value |
|----------|-------|
| **Genre** | Hamiltonian path / number-linking puzzle |
| **Inspiration** | Numberlink / Hidato / Numbrix path puzzles |
| **Grid Size** | Variable (increases in difficulty) |
| **Input** | Click-and-drag path drawing |
| **Difficulty** | Easy to Medium |
| **Launch** | Late 2024 |

### Rules

1. **Connect numbered cells:** Draw a single continuous path that visits all numbered cells in **ascending order** (1 → 2 → 3 → ... → N)
2. **Fill every cell:** The path must pass through **every single cell** in the grid — no empty cells allowed
3. **Orthogonal movement only:** Move only **horizontally or vertically** between adjacent cells (no diagonals)
4. **No crossing:** The path cannot cross itself
5. **Wall obstacles:** Some puzzles include walls between cells that cannot be crossed
6. **Backtracking allowed:** If you make a mistake, you can erase/undo part of your path

### Visual Design

- **Grid:** Clean square grid with numbered anchor cells
- **Path:** A colored **trail/line** follows your finger/cursor as you draw through cells
- **Numbered cells:** Bold numbers marking the waypoints that must be connected in order
- **Walls:** Thick borders between certain cells indicating impassable barriers
- **Filled cells:** Cells change color or shade as the path crosses through them
- **Interaction:**
  - **Click on "1"** to start
  - **Drag continuously** through cells to draw the path
  - **Release** or click to stop
  - **Undo/erase** by backtracking or using an undo button

### Solving Strategies & Tricks

1. **Identify forced paths:** Look for corners, edges, and narrow corridors where only one path is physically possible
2. **Work backward:** Sometimes start from the highest number and trace back to see which routes are forced
3. **Plan ahead:** Since every cell must be visited, mentally map the full path before committing — avoid trapping yourself in corners
4. **Use walls as guides:** Walls constrain the path, reducing possibilities and often creating forced segments
5. **Fill edges first:** Edge and corner cells often have limited connectivity, making them easier to plan around
6. **Number spacing:** If two consecutive numbers are far apart, the path between them must snake through many cells — trace that sub-path first

### Mathematical Foundation

This is a **Hamiltonian path** problem on a grid graph with ordered waypoints. Finding a Hamiltonian path is NP-complete in general, but the structured grid and numbered waypoints make the puzzles tractably solvable through constraint propagation and backtracking.

---

## 7. Mini Sudoku

### Overview

| Property | Value |
|----------|-------|
| **Genre** | Number placement / classic logic |
| **Inspiration** | Classic Sudoku (scaled down) |
| **Grid Size** | **6×6** with **2×3 boxes** |
| **Numbers** | 1 through 6 |
| **Difficulty** | Easy to Medium |
| **Launch** | 2025 |

### Rules

1. **Each row** must contain the numbers 1–6 exactly once
2. **Each column** must contain the numbers 1–6 exactly once
3. **Each 2×3 box** (6 boxes total) must contain the numbers 1–6 exactly once
4. Some cells are **pre-filled** as givens/clues

### Visual Design

- **Grid:** 6×6 grid divided into six 2×3 rectangular boxes by thicker borders
- **Given numbers:** Displayed in a distinct style (bold, darker, or colored differently from user-entered numbers)
- **User input:** Tap a cell → number selector appears or direct keyboard input
- **Pencil marks:** Some implementations allow notes/candidates in cells
- **Color scheme:** Clean, minimal — consistent with LinkedIn's professional aesthetic

### Solving Strategies & Tricks

1. **Start with most-filled rows/columns/boxes:** Fewer empty cells = fewer possibilities = easier to solve
2. **Scanning:** Pick a specific number (e.g., "3") and scan all rows/columns to find where it already exists, then determine where it must go in remaining boxes
3. **Naked singles:** If a cell has only one possible number (all others are eliminated by row/column/box), fill it in
4. **Hidden singles:** If a number can only go in one cell within a row/column/box (even if that cell has multiple candidates), it must go there
5. **Pairs elimination:** If two cells in the same unit can only contain the same two numbers, those numbers are "locked" to those cells — eliminate them from other cells in that unit
6. **Box-line interaction:** If a number in a box is restricted to a single row/column, eliminate that number from the rest of that row/column outside the box

### Mathematical Foundation

Mini Sudoku is a constraint satisfaction problem on a 6×6 Latin square with additional box constraints. It's a simplified version of the 9×9 Sudoku, itself an instance of **graph coloring** on a Sudoku graph.

---

## 8. Patches

### Overview

| Property | Value |
|----------|-------|
| **Genre** | Spatial partition / area-division puzzle |
| **Inspiration** | **Shikaku** (Japanese logic puzzle) |
| **Grid Size** | Often **6×6** (may vary) |
| **Input** | Click-and-drag to draw rectangles |
| **Difficulty** | Easy to Medium |
| **Launch** | March 2026 (newest game) |

### Rules

1. **Fill the entire grid** with rectangular or square "patches"
2. **No overlaps** — patches cannot overlap each other
3. **No gaps** — every cell must be covered exactly once
4. **Clue matching:** Each patch must correspond to a clue specifying:
   - **Shape type:** Square, Tall rectangle, or Wide rectangle
   - **Area (number of cells):** How many cells the patch covers
5. All patches must be valid rectangles (no L-shapes, T-shapes, etc.)

### Visual Design

- **Grid:** Clean grid with clue indicators in certain cells (number showing required area, icon or label showing shape type)
- **Patch drawing:** Click and drag across cells to define a rectangular region
- **Color fill:** Successfully placed patches fill with **distinct colors** for visual clarity
- **Minimalist aesthetic:** Clean, professional design with high-contrast grid lines
- **Light/dark mode:** Supports both for comfortable play
- **Interactive feedback:** Real-time validation — valid rectangles are accepted, invalid ones are rejected

### Solving Strategies & Tricks

1. **Start with highly constrained clues:** Small-area patches (e.g., 2×1, 1×2, 2×2) or patches in corners/edges have very few valid placements
2. **Edge and corner priority:** Patches pushed against grid borders have naturally limited dimension options
3. **Shape analysis:** A "Tall" clue cannot be a "Wide" rectangle — respect the shape constraints to eliminate impossible placements
4. **Divide and conquer:** Solve one area of the grid at a time; completed patches create new boundaries that constrain remaining empty space
5. **Don't force it:** If stuck in one area, move elsewhere — solving other sections often clarifies the remaining space
6. **Undo freely:** Use the undo button to experiment without penalty

### Mathematical Foundation

Based on **Shikaku** (also known as "Rectangles"), a constraint satisfaction problem requiring exact coverage of a grid by non-overlapping rectangles. Related to **exact cover** problems and **tiling theory** in combinatorics.

---

## 9. Social & Engagement Features

### Leaderboards

LinkedIn's leaderboard system is **network-centric**, not globally anonymous:

| Leaderboard Type | Description |
|------------------|-------------|
| **Connections** | Compare performance against your direct LinkedIn connections |
| **Company** | See how you rank against colleagues at your company |
| **Alma Mater** | Compete with alumni from your school(s) |
| **Percentile** | "You've done better than 80% of CEOs" — playful, role-based benchmarks |

### Streaks

| Feature | Detail |
|---------|--------|
| **Daily Streak** | Tracks consecutive days played |
| **Streak Freeze** | Earned every 5 consecutive wins (max 2 at a time) — auto-activates if you miss a day |
| **Progress Tracking** | All-time win rates, best scores, streak badges visible on your profile |

### Social Sharing

- **Post results** directly to your LinkedIn feed after completing a puzzle
- **Nudge connections** who haven't played yet — CTAs on leaderboard pages invite friends to play
- **Daily discussion posts** — LinkedIn publishes dedicated posts for each game where users can comment and share tips

### Privacy

- You can control who sees if you played via game **privacy settings**
- Settings are consistent across desktop and mobile

---

## 10. UI/UX Design System

### Design Philosophy

LinkedIn Games follow a deliberate design language:

| Principle | Implementation |
|-----------|----------------|
| **Professional alignment** | Games use LinkedIn's existing design system (typography, colors, button styles) |
| **Minimalist & functional** | Clean, uncluttered layouts optimized for quick interaction |
| **Accessible playfulness** | Rounded edges, clean layouts, progress tracking mirrors professional feedback loops |
| **"Mind-charger" framing** | Positioned as cognitive exercises, not distractions |

### Color Language

| Element | Colors |
|---------|--------|
| **Global UI** | Standard LinkedIn blues (#0A66C2), whites (#FFFFFF), greys (#F3F2EF, #666666) |
| **Queens regions** | Pastel palette: pinks, purples, greens, oranges, blues, teals, yellows |
| **Tango symbols** | Warm tones (sun ☀️) vs. cool tones (moon 🌙) |
| **Zip path** | Colored trail line (typically blue or green gradient) |
| **Patches fills** | Distinct solid colors per placed rectangle |
| **Crossclimb** | Neutral grid with accent colors for correct/incorrect feedback |
| **Error states** | Red highlights for invalid placements |
| **Success states** | Green accents, confetti colors matching the game's palette |

### Typography

- Uses LinkedIn's standard font stack (system fonts, consistent with the platform)
- Clean, legible numbers in grids
- Bold clue text for word games

### Layout & Placement

- **Desktop:** Games appear in the **right-hand sidebar** of the LinkedIn home page, below the news feed. Also accessible via the top navigation Games icon or direct URL (`linkedin.com/games`)
- **Mobile:** Accessible via the Games icon in the app's navigation. UI is responsive — elements stack/streamline for smaller screens
- **Responsive design:** Core puzzle area adapts to screen size while maintaining touch-friendly target sizes

---

## 11. Animations & Visual Feedback

### Completion Animations

| Game | Completion Effect |
|------|-------------------|
| **Queens** | 🎉 Multi-colored confetti burst — confetti colors match the board's region colors. Crown icons animate into place |
| **Tango** | ✨ Completion confirmation screen with performance stats and comparison metrics |
| **Pinpoint** | 🎯 Category reveal animation with congratulatory message showing how many clues were used |
| **Crossclimb** | 🪜 Ladder "locks in" with a satisfying snap animation as the final word connects |
| **Zip** | 🔗 Path animates with a flowing line effect as it completes through the final cell |
| **Mini Sudoku** | ✅ Board completes with a subtle glow/highlight sweep across all cells |
| **Patches** | 🧩 Patches fill with color in a cascading animation effect |

### Error/Invalid Feedback

| Feedback Type | Visual Effect |
|---------------|---------------|
| **Invalid placement** | Cell or row **shakes** (horizontal oscillation animation) |
| **Rule violation** | Conflicting cells highlight in **red** |
| **Wrong word/guess** | Red flash or shake on the input field |
| **Constraint violation** | The violating constraint (row/column/region) briefly highlights |

### Interaction Micro-Animations

| Interaction | Animation |
|-------------|-----------|
| **Cell tap** | Subtle press/scale-down effect on touch |
| **Symbol placement** | Symbol appears with a light fade-in or pop animation |
| **Drag-and-drop (Crossclimb)** | Row lifts, casts a shadow, smoothly slides to new position |
| **Path drawing (Zip)** | Colored trail follows finger/cursor with smooth interpolation |
| **Rectangle drawing (Patches)** | Selection area highlights as you drag, fills with color on release |
| **Clue reveal (Pinpoint)** | New word slides in or fades in from above/below |
| **Undo** | Reversed placement with a subtle fade/retract animation |

### Post-Game Animations

| Element | Detail |
|---------|--------|
| **Results card** | Clean modal/card appears with your time, score, and streak info |
| **Leaderboard reveal** | Your ranking position slides into view with comparative stats |
| **Share button** | Prominent CTA with LinkedIn's blue accent color |
| **"Nudge" button** | Playful design encouraging you to invite connections |
| **Streak counter** | Flame/fire icon (🔥) with the streak number, animated increment if streak continues |

---

## 12. Scoring & Metrics

### General Scoring Principles

| Aspect | Detail |
|--------|--------|
| **No star ratings** | LinkedIn does NOT use a traditional star-based scoring system |
| **No hard time limits** | No countdown timer that forces game-over — take as long as you need |
| **Speed matters** | Completion time is the primary competitive metric on leaderboards |
| **Accuracy over guessing** | Games are designed to be solved logically, not by trial-and-error |
| **Daily reset** | All puzzles reset at 12:00 AM PT — one chance per day per game |

### Game-Specific Scoring

| Game | Primary Metric | Secondary Metric |
|------|---------------|-----------------|
| **Queens** | Completion time | — |
| **Tango** | Completion time | — |
| **Pinpoint** | Number of clues needed (1–5) | — |
| **Crossclimb** | Completion time | Number of hints used |
| **Zip** | Completion time | — |
| **Mini Sudoku** | Completion time | — |
| **Patches** | Completion time | — |

### Hint System

| Game | Hint Availability | Hint Effect |
|------|-------------------|-------------|
| **Queens** | Auto-X toggle (settings) | Automatically marks invalid cells when a queen is placed |
| **Tango** | Minimal | Pre-filled cells serve as starting hints |
| **Pinpoint** | Built-in (clue reveals) | Each new clue IS the hint system |
| **Crossclimb** | Hint button | Highlights an incorrect word or misplaced row |
| **Zip** | Hint button | Reveals a correct next step |
| **Mini Sudoku** | Pencil marks | Note-taking feature for candidates |
| **Patches** | Undo button | Free experimentation without penalty |

> [!IMPORTANT]
> Using hints may impact your leaderboard ranking/time, as they add overhead or are tracked.

---

## 13. Engagement Statistics

| Metric | Value |
|--------|-------|
| **Daily active players** | "Millions" (official LinkedIn statement) |
| **Next-day retention** | ~84–86% of players return the following day |
| **Weekly retention** | ~80–82% return within a week |
| **Platform user base** | 1.2B+ total LinkedIn members (games are a fraction) |
| **Top demographics** | Gen Z disproportionately represented |
| **Top geographies** | USA (leading), India, UK, Europe, Brazil |
| **Behavioral impact** | Game players more likely to consume feed posts, news, and messaging |

### Key Engagement Insights

- Games are not "unlimited play" — the **once-per-day** constraint creates anticipation and prevents binge behavior
- The **streak mechanic** is a powerful retention driver — players don't want to break streaks
- **Network leaderboards** create a social pressure loop — seeing a colleague beat your time incentivizes return visits
- LinkedIn reports that games have been a **"home run"** for their stated goal of increasing session frequency

---

## 14. The Puzzle Designer

### Thomas Snyder — Principal Puzzlemaster

| Detail | Info |
|--------|------|
| **Title** | Principal Puzzlemaster at LinkedIn |
| **Joined LinkedIn** | October 2025 (full-time; previously consulting) |
| **Championships** | 3× World Sudoku Champion, former World Puzzle Champion |
| **Puzzles Created** | 10,000+ puzzles across formats |
| **Founded** | Grandmaster Puzzles (2012) — themed logic puzzle company |
| **Education** | Ph.D. in Chemistry from Harvard University |
| **Prior Career** | 10+ years in biotech (genomics, disease detection) |
| **Games Designed** | Zip, Patches, Queens, Mini Sudoku (and editing all others) |

> [!NOTE]
> Snyder's design philosophy emphasizes "thinking-oriented" puzzles that are easy to learn but become progressively more challenging as the week progresses (Monday = easiest, Friday/weekend = hardest).

---

## 15. Game Comparison Matrix

| Feature | Queens | Tango | Pinpoint | Crossclimb | Zip | Mini Sudoku | Patches |
|---------|--------|-------|----------|------------|-----|-------------|---------|
| **Type** | Spatial logic | Binary logic | Word association | Word ladder + crossword | Path finding | Number logic | Area partition |
| **Grid** | ~9-10×10 | 6×6 | N/A (text) | ~7 rows × 4-5 cols | Variable | 6×6 | ~6×6 |
| **Input** | Tap | Tap | Type | Type + Drag | Draw/drag | Tap/type | Draw/drag |
| **Time Pressure** | No limit | No limit | No limit | No limit | No limit | No limit | No limit |
| **Hints** | Auto-X | Pre-fills | Clue reveals | Highlight errors | Reveal step | Pencil marks | Undo |
| **Primary Metric** | Time | Time | Clues used | Time | Time | Time | Time |
| **Inspiration** | Star Battle | Binairo/Takuzu | Category games | Word Ladder | Numberlink | Classic Sudoku | Shikaku |
| **Visual Identity** | Pastel regions + crowns | Sun/Moon icons | Text cards | Letter ladder | Trail path | Number grid | Colored rectangles |
| **Launch** | May 2024 | Jul 2024 | May 2024 | May 2024 | Late 2024 | 2025 | Mar 2026 |
| **Difficulty** | Medium-Hard | Easy-Medium | Variable | Medium-Hard | Easy-Medium | Easy-Medium | Easy-Medium |

---

## Platform Differences

### Desktop vs. Mobile

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **Input** | Mouse/trackpad clicking, keyboard | Touch (tap, drag, swipe) |
| **Layout** | Spacious — grid, clues, and leaderboard visible simultaneously | Stacked/streamlined — puzzle-focused with scrollable extras |
| **Drag-and-drop** | Precise mouse control | Touch can be imprecise — some users prefer desktop for Crossclimb |
| **Path drawing** | Click-and-drag with mouse | Finger drag — more natural for Zip |
| **Accessibility** | Full keyboard support | Thumb-friendly button sizes |
| **Game content** | Identical puzzles | Identical puzzles |
| **Social features** | Same leaderboards and sharing | Same leaderboards and sharing |
| **Access** | `linkedin.com/games` or Games icon in nav | Games icon in app navigation |

---

## Key Observations for Implementation

> [!TIP]
> If building clones or inspired games, note these critical design patterns:
> 
> 1. **All games are deterministic** — every puzzle has exactly one solution, solvable without guessing
> 2. **Progressive weekly difficulty** — puzzles get harder as the week progresses
> 3. **Immediate visual feedback** — every action has a visual response (shake for error, color fill for success)
> 4. **Minimalist UI** — the puzzle grid is the hero; no clutter, no ads, no distractions
> 5. **Celebration on completion** — confetti, stats cards, and social sharing create a satisfying end-state
> 6. **Streak psychology** — the streak counter + streak freeze system drives daily retention
> 7. **Network leaderboards** — social competition through existing professional relationships, not anonymous global rankings
> 8. **Pastel/professional color palette** — vibrant but not garish; professional but not boring
> 9. **Touch + mouse optimized** — responsive design that works seamlessly on both platforms
> 10. **Sub-5-minute design target** — every puzzle is designed to be completable in a short break
