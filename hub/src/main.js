/**
 * LinkedIn Games Hub — Landing page for all games.
 * This is a lightweight gateway that links to each game's sub-path.
 * In dev, Vite proxy forwards /tango and /queens to their dev servers.
 */

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = document.createElement('style');
styles.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  button { border: none; background: none; cursor: pointer; font: inherit; color: inherit; }

  :root {
    --bg-primary:       #1B1F23;
    --bg-secondary:     #2D2D2D;
    --bg-surface:       #3A3A3A;
    --bg-surface-hover: #4A4A4A;
    --text-primary:     #FFFFFF;
    --text-secondary:   #B0B0B0;
    --text-muted:       #787878;
    --accent-blue:      #70B5F9;
    --accent-green:     #57C47A;
    --accent-orange:    #F5A623;
    --radius-md:        8px;
    --radius-lg:        12px;
    --space-xs:         4px;
    --space-sm:         8px;
    --space-md:         16px;
    --space-lg:         24px;
    --space-xl:         32px;
    --space-2xl:        48px;
    --shadow-md:        0 4px 12px rgba(0, 0, 0, 0.4);
    --dur-fast:         100ms;
    --dur-normal:       200ms;
  }

  html, body {
    height: 100%;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
  }

  #app {
    display: flex;
    justify-content: center;
    min-height: 100%;
    padding: 0 var(--space-md);
  }

  .hub-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 480px;
    gap: var(--space-lg);
    padding-top: var(--space-2xl);
  }
  .hub-title {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .hub-subtitle {
    color: var(--text-secondary);
    font-size: 14px;
    margin-top: -12px;
  }
  .hub-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-md);
    width: 100%;
  }
  .hub-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-lg) var(--space-md);
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    cursor: pointer;
    text-align: center;
    text-decoration: none;
    color: inherit;
    transition: background var(--dur-fast), transform var(--dur-fast), box-shadow var(--dur-normal);
  }
  .hub-card:hover {
    background: var(--bg-surface);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  .hub-card:active {
    transform: translateY(0) scale(0.98);
  }
  .hub-card--disabled {
    opacity: 0.4;
    cursor: default;
    pointer-events: none;
  }
  .hub-card__icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
  }
  .hub-card__title {
    font-size: 16px;
    font-weight: 600;
  }
  .hub-card__streak {
    font-size: 14px;
    color: var(--accent-orange);
    font-weight: 500;
    min-height: 20px;
  }
  .hub-card__streak:empty { display: none; }
  .hub-card__cta {
    font-size: 13px;
    color: var(--accent-blue);
    font-weight: 500;
  }
  .hub-card__cta--completed { color: var(--accent-green); }
  .hub-card__cta--coming { color: var(--text-muted); }

  @media (max-width: 320px) {
    .hub-grid { grid-template-columns: 1fr; }
  }
`;
document.head.appendChild(styles);

// ─── Game Definitions ────────────────────────────────────────────────────────

const GAMES = [
  { id: 'tango',  name: 'Tango',  icon: '☀️', gradient: 'linear-gradient(135deg, #FFD54F, #B39DDB)', path: '/tango/', available: true },
  { id: 'queens', name: 'Queens', icon: '👑', gradient: 'linear-gradient(135deg, #F4A0B5, #B39DDB)', path: '/queens/', available: true },
  { id: 'sudoku', name: 'Sudoku', icon: '🔢', gradient: 'linear-gradient(135deg, #64B5F6, #4DD0E1)', path: null, available: false },
  { id: 'zip',    name: 'Zip',    icon: '🔗', gradient: 'linear-gradient(135deg, #FFB74D, #E74C3C)', path: null, available: false },
];

// ─── Streak Reading (shared localStorage keys) ──────────────────────────────

function getStreak(gameId) {
  try {
    const data = JSON.parse(localStorage.getItem(`${gameId}_streak`) || 'null');
    return data || { current: 0, best: 0 };
  } catch { return { current: 0, best: 0 }; }
}

function isCompletedToday(gameId) {
  try {
    const data = JSON.parse(localStorage.getItem(`${gameId}_daily`) || 'null');
    if (!data) return false;
    const today = new Date().toISOString().split('T')[0];
    return data.date === today && data.completed === true;
  } catch { return false; }
}

// ─── Build Page ──────────────────────────────────────────────────────────────

function buildCard(game) {
  const streak = game.available ? getStreak(game.id) : null;
  const completed = game.available ? isCompletedToday(game.id) : false;
  const streakNum = streak?.current || 0;

  const card = document.createElement(game.available ? 'a' : 'div');
  card.className = `hub-card${game.available ? '' : ' hub-card--disabled'}`;
  card.id = `hub-card-${game.id}`;

  if (game.available && game.path) {
    card.href = game.path;
  }

  card.innerHTML = `
    <div class="hub-card__icon" style="background: ${game.gradient}">${game.icon}</div>
    <span class="hub-card__title">${game.name}</span>
    ${streakNum > 0 ? `<span class="hub-card__streak">🔥 ${streakNum}</span>` : '<span class="hub-card__streak"></span>'}
    <span class="hub-card__cta ${completed ? 'hub-card__cta--completed' : ''} ${!game.available ? 'hub-card__cta--coming' : ''}">
      ${!game.available ? 'Coming Soon' : completed ? 'Completed ✓' : `Solve ${game.name} →`}
    </span>
  `;

  return card;
}

const app = document.getElementById('app');
const page = document.createElement('div');
page.className = 'hub-page';
page.innerHTML = `
  <h1 class="hub-title">🎮 LinkedIn Games</h1>
  <p class="hub-subtitle">Daily puzzle games for practice</p>
  <div class="hub-grid"></div>
`;

const grid = page.querySelector('.hub-grid');
GAMES.forEach(game => grid.appendChild(buildCard(game)));

app.appendChild(page);
