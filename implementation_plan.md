# Document 1: High-Level Master Plan

> **Project:** LinkedIn Daily Puzzle Games — Personal Practice Clone  
> **Games:** Tango, Queens, Mini Sudoku, Zip  
> **Architecture:** Progressive Web App (PWA)  
> **Stack:** Vite + Vanilla JS + Vanilla CSS  

---

## 1. Tech Stack & Justification

### Core

| Tool | Role | Why |
|------|------|-----|
| **Vite 6** | Build tool / Dev server | Instant HMR, native ES modules, zero-config, trivial PWA integration via plugin |
| **Vanilla JS (ES2022+)** | Application logic | No framework overhead for grid-based puzzles. Classes + modules give clean architecture. Games are self-contained — React/Vue would be unnecessary abstraction |
| **Vanilla CSS** | Styling | CSS custom properties for theming, `:has()` / container queries for modern responsive. No utility framework needed for <20 components |
| **vite-plugin-pwa** | PWA shell | Auto-generates service worker + manifest. Handles caching, offline support, installability |

### Testing

| Tool | Role | Why |
|------|------|-----|
| **Vitest** | Unit tests | Native Vite integration, fast, same config. Tests puzzle generators, solvers, validators |
| **Playwright** | E2E / Browser tests | Tests actual gameplay flows — tap, drag, animations, completion detection |
| **Manual (user feedback)** | UX validation | I test logic/visuals in the browser, then ask you to test feel/vibe |

### Data & Storage

| Tool | Role | Why |
|------|------|-----|
| **localStorage** | Daily progress, streaks, settings | Simple key-value. Sufficient for single-user personal practice |
| **Seeded PRNG** | Daily puzzle generation | Deterministic: same date → same puzzle everywhere. Uses `mulberry32` (lightweight, well-distributed) |
| **JSON files** | First 20 hand-crafted levels | Fallback / guaranteed-quality puzzles before algorithmic gen takes over |

---

## 2. Project Directory Structure

```
linkedin-games/
├── package.json
├── vite.config.js
├── index.html                      # SPA entry point
│
├── public/
│   ├── favicon.svg
│   ├── icons/                      # PWA icons (192x192, 512x512)
│   └── data/                       # Hand-crafted puzzle banks
│       ├── tango-levels.json       # 20 Tango puzzles
│       ├── queens-levels.json      # 20 Queens puzzles
│       ├── sudoku-levels.json      # 20 Sudoku puzzles
│       └── zip-levels.json         # 20 Zip puzzles
│
├── src/
│   ├── main.js                     # App entry: router init, theme init
│   ├── router.js                   # Hash-based SPA router
│   │
│   ├── styles/
│   │   ├── tokens.css              # Design tokens (colors, spacing, radii, shadows)
│   │   ├── reset.css               # Modern CSS reset
│   │   ├── global.css              # Base styles, dark theme, typography
│   │   ├── hub.css                 # Hub/landing page
│   │   ├── game-shell.css          # Shared game chrome (header, timer, controls)
│   │   ├── tango.css               # Tango-specific grid colors
│   │   ├── queens.css              # Queens-specific region colors
│   │   ├── sudoku.css              # Sudoku-specific styles
│   │   └── zip.css                 # Zip-specific path/trail styles
│   │
│   ├── shared/                     # Shared infrastructure
│   │   ├── rng.js                  # Seeded PRNG (mulberry32)
│   │   ├── seed.js                 # Date → seed conversion
│   │   ├── timer.js                # Game timer (start/stop/display)
│   │   ├── confetti.js             # Completion confetti animation
│   │   ├── shake.js                # Error shake animation
│   │   ├── storage.js              # localStorage wrapper (save/load/streak)
│   │   ├── modal.js                # Results modal / share card
│   │   ├── grid-renderer.js        # Shared grid DOM builder
│   │   ├── sound.js                # Optional: subtle audio feedback
│   │   └── utils.js                # Shuffle, deep-clone, debounce, etc.
│   │
│   ├── hub/
│   │   └── hub.js                  # Hub page renderer: game cards, streaks
│   │
│   └── games/
│       ├── tango/
│       │   ├── tango.js            # Game controller (lifecycle, events)
│       │   ├── tango-logic.js      # Rules engine: validate, check-win
│       │   ├── tango-generator.js  # Algorithmic puzzle generation
│       │   ├── tango-solver.js     # Constraint-propagation solver
│       │   └── tango-renderer.js   # DOM rendering, cell interactions
│       │
│       ├── queens/
│       │   ├── queens.js
│       │   ├── queens-logic.js
│       │   ├── queens-generator.js
│       │   ├── queens-solver.js
│       │   └── queens-renderer.js
│       │
│       ├── sudoku/
│       │   ├── sudoku.js
│       │   ├── sudoku-logic.js
│       │   ├── sudoku-generator.js
│       │   ├── sudoku-solver.js
│       │   └── sudoku-renderer.js
│       │
│       └── zip/
│           ├── zip.js
│           ├── zip-logic.js
│           ├── zip-generator.js
│           ├── zip-solver.js
│           └── zip-renderer.js
│
├── tests/
│   ├── shared/
│   │   ├── rng.test.js
│   │   └── storage.test.js
│   ├── tango/
│   │   ├── tango-logic.test.js
│   │   ├── tango-generator.test.js
│   │   └── tango-solver.test.js
│   ├── queens/
│   ├── sudoku/
│   └── zip/
│
├── e2e/
│   ├── hub.spec.js
│   ├── tango.spec.js
│   ├── queens.spec.js
│   ├── sudoku.spec.js
│   └── zip.spec.js
│
└── docs/
    ├── master-plan.md              # This document
    ├── tango-blueprint.md          # Game 1 blueprint
    └── tango-phase1.md             # Phase 1 micro-plan
```

---

## 3. Shared Architecture

### 3.1 SPA Router (Hash-based)

Simple hash router — no library needed:

| Route | View |
|-------|------|
| `#/` | Hub page (game cards grid) |
| `#/tango` | Tango game |
| `#/queens` | Queens game |
| `#/sudoku` | Mini Sudoku game |
| `#/zip` | Zip game |

Each game module exports `mount(container)` and `unmount()`. The router calls these on navigation.

### 3.2 Game Lifecycle (Shared Pattern)

Every game follows the same lifecycle:

```
INIT → LOAD_PUZZLE → PLAYING → COMPLETED
         ↑                        │
         └── RESET ←──────────────┘
```

1. **INIT:** Mount game shell (header, timer, grid container, controls)
2. **LOAD_PUZZLE:** Check localStorage for saved progress. If none, generate today's puzzle via seeded RNG (or pull from JSON bank if day ≤ 20)
3. **PLAYING:** User interacts. Every move auto-saves to localStorage. Timer runs. Validate after each action.
4. **COMPLETED:** Stop timer. Play confetti. Show results modal (time, streak). Offer share/reset.

### 3.3 Puzzle Source Strategy

```
Day 1–20:   Load from JSON bank (hand-crafted, guaranteed quality)
Day 21+:    Generate algorithmically using seeded PRNG
Any day:    User can override with "New Puzzle" for practice (non-daily)
```

The seed for day N is: `hash("GAME_NAME" + "YYYY-MM-DD")` → feeds into `mulberry32` PRNG.

### 3.4 Difficulty System

- **Daily mode:** Difficulty is pseudo-random per day, seeded from the date. Mapped to 3 tiers:
  - `seed % 3 === 0` → Easy
  - `seed % 3 === 1` → Medium  
  - `seed % 3 === 2` → Hard
- Each game's generator accepts a `difficulty` parameter that adjusts:
  - **Tango:** Number of pre-filled cells, number of constraint signs
  - **Queens:** Grid size (7×7 easy → 9×9 hard), region complexity
  - **Sudoku:** Number of givens (more givens = easier)
  - **Zip:** Grid size, number of waypoints, wall density

### 3.5 Storage Schema

```js
// localStorage keys per game
"lg_tango_daily"     → { date, board, timer, completed }
"lg_tango_streak"    → { current, best, lastPlayDate }
"lg_queens_daily"    → { date, board, timer, completed }
// ... same pattern for sudoku, zip

// Global
"lg_settings"        → { theme, soundEnabled }
```

---

## 4. Design System

### 4.1 Color Palette (LinkedIn-Inspired Dark Theme)

Based on the screenshot and LinkedIn's actual game UI:

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#1B1F23` | Main background |
| `--bg-secondary` | `#2D2D2D` | Card/panel backgrounds |
| `--bg-surface` | `#3A3A3A` | Grid cell backgrounds |
| `--bg-surface-hover` | `#4A4A4A` | Cell hover state |
| `--text-primary` | `#FFFFFF` | Main text |
| `--text-secondary` | `#B0B0B0` | Muted text, labels |
| `--accent-blue` | `#70B5F9` | LinkedIn accent (links, active states) |
| `--accent-green` | `#57C47A` | Success states |
| `--accent-red` | `#E74C3C` | Error states, shake |
| `--accent-orange` | `#F5A623` | Streak flame, warnings |

**Game-specific pastel palette (for Queens regions, Tango symbols, etc.):**

| Token | Value | Usage |
|-------|-------|-------|
| `--pastel-pink` | `#F4A0B5` | Queens region 1 |
| `--pastel-purple` | `#B39DDB` | Queens region 2 |
| `--pastel-green` | `#81C784` | Queens region 3 |
| `--pastel-orange` | `#FFB74D` | Queens region 4 |
| `--pastel-blue` | `#64B5F6` | Queens region 5 |
| `--pastel-teal` | `#4DD0E1` | Queens region 6 |
| `--pastel-yellow` | `#FFF176` | Queens region 7 |
| `--pastel-coral` | `#FF8A80` | Queens region 8 |
| `--pastel-indigo` | `#9FA8DA` | Queens region 9 |
| `--sun-gold` | `#FFD54F` | Tango sun symbol |
| `--moon-blue` | `#7E57C2` | Tango moon symbol |

### 4.2 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Headings | `Inter` (Google Fonts) | 20–28px | 600–700 |
| Body | `Inter` | 14–16px | 400 |
| Grid numbers | `Inter` | 18–24px | 600 |
| Timer | `'JetBrains Mono'` or `monospace` | 16px | 500 |
| Buttons | `Inter` | 14px | 500 |

### 4.3 Animation Specifications

| Animation | Duration | Easing | Detail |
|-----------|----------|--------|--------|
| **Cell tap** | 100ms | `ease-out` | Scale 0.95 → 1.0 |
| **Symbol appear** | 200ms | `ease-out` | Opacity 0→1 + scale 0.8→1.0 |
| **Error shake** | 400ms | `ease-in-out` | translateX: 0 → -6px → 6px → -4px → 4px → 0 |
| **Row drag lift** | 150ms | `ease-out` | Scale 1.02, box-shadow appears |
| **Row snap** | 200ms | `ease-out` | translateY to target position |
| **Confetti burst** | 2000ms | `linear` | Canvas-based particle system, 80–120 particles |
| **Results modal** | 300ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Scale 0.9→1.0 + opacity 0→1 (slight overshoot) |
| **Path trail (Zip)** | 60fps | `linear` | Continuous colored line following cursor |
| **Streak flame** | ∞ (loop) | `ease-in-out` | Subtle 1.0→1.1→1.0 scale pulse on fire emoji |

### 4.4 Responsive Breakpoints

| Breakpoint | Target | Grid Adaptation |
|------------|--------|-----------------|
| `≥ 768px` | Desktop/Tablet | Game grid centered, max-width ~480px, side panels for timer/controls |
| `< 768px` | Mobile | Full-width grid, controls stacked below, touch-optimized cell sizes (min 44px tap target) |

---

## 5. Game Development Order

### Order: Tango → Queens → Mini Sudoku → Zip

| # | Game | Rationale |
|---|------|-----------|
| **1** | **Tango** | Simplest rules (binary symbols, 6×6). Perfect for building the shared architecture: grid renderer, timer, confetti, storage, router. Everything built here carries over. |
| **2** | **Queens** | Reuses the grid infrastructure. Adds colored region rendering and diagonal-adjacency logic. The constraint-based generator is good practice before the more structured Sudoku generator. |
| **3** | **Mini Sudoku** | Most well-documented generation algorithms. The 6×6 variant is a solved problem algorithmically. Reuses everything from Tango/Queens, just different rules. |
| **4** | **Zip** | Most unique interaction model (continuous path drawing via drag). Requires different event handling (pointer events, touch tracking). Best built last after the grid/animation infrastructure is battle-tested. |

### Milestone Targets

| Milestone | Deliverable |
|-----------|-------------|
| **M1** | Tango fully playable with daily puzzles, save/progress, confetti. Hub page with Tango card. |
| **M2** | Queens added to hub. Both games share timer, confetti, storage. |
| **M3** | Sudoku added. All 3 games in hub with streaks. |
| **M4** | Zip added. All 4 games. PWA installable. Full polish pass. |

---

## 6. Cross-Cutting Concerns

### 6.1 PWA Setup

- `vite-plugin-pwa` with `generateSW` strategy (auto-generated service worker)
- Cache-first for static assets, network-first for puzzle data
- Manifest: app name, icons, theme color (`#1B1F23`), display: `standalone`
- Install prompt: custom "Add to Home Screen" banner in hub

### 6.2 Hub Page Design

The hub is a **dark-themed landing page** with 4 game cards in a grid:

```
┌──────────────────────────────┐
│       LinkedIn Games         │
│      (logo / title)          │
├──────────────┬───────────────┤
│   ┌──────┐   │   ┌──────┐   │
│   │ Tango│   │   │Queens│   │
│   │ 🔥3  │   │   │ 🔥7  │   │
│   └──────┘   │   └──────┘   │
├──────────────┼───────────────┤
│   ┌──────┐   │   ┌──────┐   │
│   │Sudoku│   │   │ Zip  │   │
│   │ 🔥1  │   │   │ NEW  │   │
│   └──────┘   │   └──────┘   │
└──────────────┴───────────────┘
```

Each card shows:
- Game icon/thumbnail
- Game name
- Streak counter (🔥 N)
- Status: "Solve [Game] →" / "Completed ✓" / "NEW"

### 6.3 Daily Reset Logic

```
On game load:
  savedDate = localStorage["lg_GAME_daily"].date
  today = new Date().toISOString().slice(0, 10)
  
  if (savedDate === today && !completed):
    → Resume saved progress
  else if (savedDate === today && completed):
    → Show "Already completed" with results
  else:
    → Generate new puzzle for today
    → Reset timer and board
    → Update streak (if yesterday was played, streak++; else streak = 1)
```

### 6.4 What's NOT Being Built (Effort/Similarity Tradeoff)

These LinkedIn features would require disproportionate effort for minimal personal-practice value:

| Feature | LinkedIn Has It | Our Decision | Reason |
|---------|----------------|--------------|--------|
| Network leaderboard | Yes | ❌ Skip | Requires backend + auth. No value for solo practice. |
| Company/school grouping | Yes | ❌ Skip | Same — needs social graph. |
| Result sharing to feed | Yes | ❌ Skip | No LinkedIn API integration needed. |
| Nudge connections | Yes | ❌ Skip | Social feature, no solo value. |
| Streak freeze (earned) | Yes | ⚠️ Simplified | We'll include a simple manual freeze toggle instead of the earned system. |
| Sound effects | Yes (subtle) | ⚠️ Optional | Add if time permits in polish phase. Low priority. |
| Playful stats ("beat 80% of CEOs") | Yes | ❌ Skip | Requires backend analytics. |
| Push notifications | Yes (PWA) | ⚠️ Later | Can add post-M4 if desired. |

---

## 7. Verification Strategy

| Phase | Method | Detail |
|-------|--------|--------|
| **Unit tests** | Vitest | Every generator, solver, and validator has tests. Puzzle generation must produce valid, unique-solution puzzles 100% of the time. |
| **E2E tests** | Playwright | Tap-to-place, drag-to-draw, timer start/stop, confetti trigger, save/resume, daily reset. |
| **Visual testing** | Browser subagent | I'll open the dev server and visually verify layout, colors, animations, dark theme. |
| **User feedback** | You | After each milestone (M1–M4), I'll ask you to play and provide feedback on feel/vibe. |

---

## 8. Open Questions for User Review

> [!IMPORTANT]
> **Please review the following decisions:**
> 1. **Build order** (Tango → Queens → Sudoku → Zip) — any preference to swap?
> 2. **Skipped features** (Section 6.4) — anything you'd want added back?
> 3. **Hub design** — the 2×2 card grid from the screenshot matches LinkedIn's dark sidebar. Does this feel right?
> 4. **Queens grid size** — LinkedIn uses ~9-10×10. For difficulty variance: Easy=7×7, Medium=8×8, Hard=9×9. OK?
