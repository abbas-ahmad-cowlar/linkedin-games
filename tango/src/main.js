/**
 * Tango App — Entry point.
 * Wires router, registers game modules, initializes the app.
 */

import './styles/tokens.css';
import './styles/reset.css';
import './styles/global.css';
import './styles/game-shell.css';
import './styles/tango.css';

import { init, register } from './router.js';
import * as tango from './games/tango/tango.js';
import { getStreak, isCompletedToday } from './shared/streak.js';

// ─── Hub ─────────────────────────────────────────────────────────────────────

const GAMES = [
  { id: 'tango',  name: 'Tango',  icon: '☀️', gradient: 'linear-gradient(135deg, #FFD54F, #B39DDB)', available: true },
  { id: 'queens', name: 'Queens', icon: '👑', gradient: 'linear-gradient(135deg, #F4A0B5, #B39DDB)', available: false },
  { id: 'sudoku', name: 'Sudoku', icon: '🔢', gradient: 'linear-gradient(135deg, #64B5F6, #4DD0E1)', available: false },
  { id: 'zip',    name: 'Zip',    icon: '🔗', gradient: 'linear-gradient(135deg, #FFB74D, #E74C3C)', available: false },
];

function buildHubCard(game) {
  const streak = game.available ? getStreak(game.id) : null;
  const completed = game.available ? isCompletedToday(game.id) : false;
  const streakNum = streak?.current || 0;

  const card = document.createElement('div');
  card.className = `hub-card${game.available ? '' : ' hub-card--disabled'}`;
  card.id = `hub-card-${game.id}`;

  card.innerHTML = `
    <div class="hub-card__icon" style="background: ${game.gradient}">${game.icon}</div>
    <span class="hub-card__title">${game.name}</span>
    ${streakNum > 0 ? `<span class="hub-card__streak">🔥 ${streakNum}</span>` : '<span class="hub-card__streak"></span>'}
    <span class="hub-card__cta ${completed ? 'hub-card__cta--completed' : ''} ${!game.available ? 'hub-card__cta--coming' : ''}">
      ${!game.available ? 'Coming Soon' : completed ? 'Completed ✓' : `Solve ${game.name} →`}
    </span>
  `;

  if (game.available) {
    card.addEventListener('click', () => {
      location.hash = `#/${game.id}`;
    });
  }

  return card;
}

const hub = {
  mount(container) {
    const page = document.createElement('div');
    page.className = 'hub-page';
    page.innerHTML = `
      <h1 class="hub-title">🎮 LinkedIn Games</h1>
      <p class="hub-subtitle">Daily puzzle games for practice</p>
      <div class="hub-grid"></div>
    `;

    const grid = page.querySelector('.hub-grid');
    GAMES.forEach(game => grid.appendChild(buildHubCard(game)));

    container.appendChild(page);
  },
  unmount() {},
};

// ─── Hub Styles (injected once) ──────────────────────────────────────────────

const hubStyles = document.createElement('style');
hubStyles.textContent = `
  .hub-page {
    display: flex; flex-direction: column; align-items: center;
    width: 100%; max-width: 480px;
    gap: var(--space-lg);
    padding-top: var(--space-2xl);
  }
  .hub-title {
    font-size: 28px; font-weight: 700; letter-spacing: 0.5px;
  }
  .hub-subtitle {
    color: var(--text-secondary); font-size: 14px; margin-top: -12px;
  }
  .hub-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: var(--space-md); width: 100%;
  }
  .hub-card {
    display: flex; flex-direction: column; align-items: center; gap: var(--space-sm);
    padding: var(--space-lg) var(--space-md);
    background: var(--bg-secondary); border-radius: var(--radius-lg);
    cursor: pointer; text-align: center;
    transition: background var(--dur-fast), transform var(--dur-fast), box-shadow var(--dur-normal);
  }
  .hub-card:hover {
    background: var(--bg-surface); transform: translateY(-2px); box-shadow: var(--shadow-md);
  }
  .hub-card:active { transform: translateY(0) scale(0.98); }
  .hub-card--disabled {
    opacity: 0.4; cursor: default; pointer-events: none;
  }
  .hub-card__icon {
    width: 48px; height: 48px; border-radius: var(--radius-md);
    display: flex; align-items: center; justify-content: center; font-size: 22px;
  }
  .hub-card__title { font-size: 16px; font-weight: 600; }
  .hub-card__streak { font-size: 14px; color: var(--accent-orange); font-weight: 500; min-height: 20px; }
  .hub-card__streak:empty { display: none; }
  .hub-card__cta { font-size: 13px; color: var(--accent-blue); font-weight: 500; }
  .hub-card__cta--completed { color: var(--accent-green); }
  .hub-card__cta--coming { color: var(--text-muted); }
  @media (max-width: 320px) { .hub-grid { grid-template-columns: 1fr; } }
`;
document.head.appendChild(hubStyles);

// ─── Register Routes ─────────────────────────────────────────────────────────

register('/', hub);
register('/tango', tango);

// ─── Initialize ──────────────────────────────────────────────────────────────

const app = document.getElementById('app');
init(app);
