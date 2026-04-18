/**
 * Queens App — Entry point.
 * Game loads directly (hub is served by the root hub/ project).
 */

import './styles/tokens.css';
import './styles/reset.css';
import './styles/global.css';
import './styles/game-shell.css';
import './styles/queens.css';

import * as queens from './games/queens/queens.js';

// ─── Direct Mount ────────────────────────────────────────────────────────────
// No router needed — the game mounts directly.

const app = document.getElementById('app');
queens.mount(app);
