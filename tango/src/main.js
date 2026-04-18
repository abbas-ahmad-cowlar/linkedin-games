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

// ─── Hub (placeholder until Phase 4) ────────────────────────────────────────

const hub = {
  mount(container) {
    container.innerHTML = `
      <div class="game-page" style="justify-content: center; min-height: 80vh;">
        <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">🎮 LinkedIn Games</h1>
        <p style="color: var(--text-secondary); margin-bottom: 32px;">Daily puzzle games for practice</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; width: 100%; max-width: 360px;">
          <button onclick="location.hash='#/tango'" style="
            display: flex; flex-direction: column; align-items: center; gap: 8px;
            padding: 24px 16px; background: var(--bg-secondary); border-radius: 12px;
            cursor: pointer; border: none; color: var(--text-primary); font-family: inherit;
            transition: background 0.1s, transform 0.1s;
          " onmouseover="this.style.background='var(--bg-surface)';this.style.transform='translateY(-2px)'"
             onmouseout="this.style.background='var(--bg-secondary)';this.style.transform='none'">
            <div style="
              width: 48px; height: 48px; border-radius: 8px;
              background: linear-gradient(135deg, #FFD54F, #B39DDB);
              display: flex; align-items: center; justify-content: center;
              font-size: 20px;
            ">☀️</div>
            <span style="font-weight: 600; font-size: 16px;">Tango</span>
            <span style="color: var(--accent-blue); font-size: 13px; font-weight: 500;">Solve Tango →</span>
          </button>
          <div style="
            display: flex; flex-direction: column; align-items: center; gap: 8px;
            padding: 24px 16px; background: var(--bg-secondary); border-radius: 12px;
            opacity: 0.4;
          ">
            <div style="width: 48px; height: 48px; border-radius: 8px; background: linear-gradient(135deg, #F4A0B5, #B39DDB); display: flex; align-items: center; justify-content: center; font-size: 20px;">👑</div>
            <span style="font-weight: 600; font-size: 16px;">Queens</span>
            <span style="color: var(--text-muted); font-size: 13px;">Coming Soon</span>
          </div>
          <div style="
            display: flex; flex-direction: column; align-items: center; gap: 8px;
            padding: 24px 16px; background: var(--bg-secondary); border-radius: 12px;
            opacity: 0.4;
          ">
            <div style="width: 48px; height: 48px; border-radius: 8px; background: linear-gradient(135deg, #64B5F6, #4DD0E1); display: flex; align-items: center; justify-content: center; font-size: 20px;">🔢</div>
            <span style="font-weight: 600; font-size: 16px;">Sudoku</span>
            <span style="color: var(--text-muted); font-size: 13px;">Coming Soon</span>
          </div>
          <div style="
            display: flex; flex-direction: column; align-items: center; gap: 8px;
            padding: 24px 16px; background: var(--bg-secondary); border-radius: 12px;
            opacity: 0.4;
          ">
            <div style="width: 48px; height: 48px; border-radius: 8px; background: linear-gradient(135deg, #FFB74D, #E74C3C); display: flex; align-items: center; justify-content: center; font-size: 20px;">🔗</div>
            <span style="font-weight: 600; font-size: 16px;">Zip</span>
            <span style="color: var(--text-muted); font-size: 13px;">Coming Soon</span>
          </div>
        </div>
      </div>
    `;
  },
  unmount() {},
};

// ─── Register Routes ─────────────────────────────────────────────────────────

register('/', hub);
register('/tango', tango);

// ─── Initialize ──────────────────────────────────────────────────────────────

const app = document.getElementById('app');
init(app);
