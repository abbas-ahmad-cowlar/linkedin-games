/**
 * Tango App — Entry point.
 * Game loads directly (hub is served by the root hub/ project).
 */

import './styles/tokens.css';
import './styles/reset.css';
import './styles/global.css';
import './styles/game-shell.css';
import './styles/tango.css';

import * as tango from './games/tango/tango.js';

// ─── Direct Mount ────────────────────────────────────────────────────────────
// No router needed — the game mounts directly.

const app = document.getElementById('app');
tango.mount(app);
