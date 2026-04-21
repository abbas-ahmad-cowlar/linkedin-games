/**
 * Queens Stats — Persistent statistics tracking with SVG visualizations.
 *
 * Stores solve history in localStorage and provides a stats modal
 * with summary cards and an SVG bar chart of recent solve times.
 *
 * @module games/queens/queens-stats
 */

import * as storage from '../../shared/storage.js';
import { formatTime } from '../../shared/timer.js';

const STATS_KEY = 'queens_stats';

// ─── Data Layer ──────────────────────────────────────────────────────────────

function getStats() {
  return storage.get(STATS_KEY, {
    totalSolved: 0,
    bestTime: null,
    totalTime: 0,
    hintsUsed: 0,
    history: [],  // last 30: { time, difficulty, gridSize, moves, hints, date }
    diffBreakdown: { easy: 0, medium: 0, hard: 0 },
  });
}

function saveStats(stats) {
  storage.set(STATS_KEY, stats);
}

/**
 * Record a puzzle solve.
 */
export function recordQueensSolve({ time, difficulty, gridSize, moves, hints = 0 }) {
  const stats = getStats();
  const date = storage.getToday();
  const timeSec = Math.floor(time);

  stats.totalSolved += 1;
  stats.totalTime += timeSec;
  stats.hintsUsed += hints;

  if (stats.bestTime === null || timeSec < stats.bestTime) {
    stats.bestTime = timeSec;
  }

  stats.diffBreakdown[difficulty] = (stats.diffBreakdown[difficulty] || 0) + 1;

  stats.history.push({ time: timeSec, difficulty, gridSize, moves, hints, date });
  if (stats.history.length > 30) {
    stats.history = stats.history.slice(-30);
  }

  saveStats(stats);
  return stats;
}

// ─── Stats Modal UI ──────────────────────────────────────────────────────────

/**
 * Show the stats modal with summary cards and SVG bar chart.
 * @param {function} showModalFn - The showModal function from shared/modal.js
 */
export function showStatsModal(showModalFn) {
  const stats = getStats();

  // Build stats modal content
  const content = document.createElement('div');
  content.style.textAlign = 'left';

  // Summary cards
  const avgTime = stats.totalSolved > 0 ? Math.round(stats.totalTime / stats.totalSolved) : 0;
  const summaryHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
      ${statCard('Total Solved', stats.totalSolved)}
      ${statCard('Best Time', stats.bestTime !== null ? formatTime(stats.bestTime) : '—')}
      ${statCard('Avg Time', stats.totalSolved > 0 ? formatTime(avgTime) : '—')}
      ${statCard('Hints Used', stats.hintsUsed)}
    </div>
  `;

  // Difficulty breakdown
  const total = stats.totalSolved || 1;
  const breakdownHTML = `
    <div style="margin-bottom:20px;">
      <div style="font-size:13px;font-weight:600;color:#B0B0B0;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Difficulty</div>
      ${diffBar('Easy', stats.diffBreakdown.easy, total, '#57C47A')}
      ${diffBar('Medium', stats.diffBreakdown.medium, total, '#F5A623')}
      ${diffBar('Hard', stats.diffBreakdown.hard, total, '#E74C3C')}
    </div>
  `;

  // Bar chart of recent times
  const chartHTML = stats.history.length > 0 ? buildBarChart(stats.history.slice(-10)) : '';

  content.innerHTML = summaryHTML + breakdownHTML + chartHTML;

  showModalFn({
    title: '📊 Stats',
    customContent: content,
    actions: [
      { label: 'Close', variant: 'primary', onClick: () => {} },
    ],
  });
}

function statCard(label, value) {
  return `
    <div style="background:#3A3A3A;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-size:22px;font-weight:700;">${value}</div>
      <div style="font-size:12px;color:#B0B0B0;margin-top:2px;">${label}</div>
    </div>
  `;
}

function diffBar(label, count, total, color) {
  const pct = Math.round((count / total) * 100);
  return `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
      <span style="font-size:13px;width:55px;color:#B0B0B0;">${label}</span>
      <div style="flex:1;height:16px;background:#3A3A3A;border-radius:8px;overflow:hidden;">
        <div style="width:${pct}%;height:100%;background:${color};border-radius:8px;transition:width 400ms ease;"></div>
      </div>
      <span style="font-size:13px;font-weight:600;width:30px;text-align:right;">${count}</span>
    </div>
  `;
}

function buildBarChart(history) {
  const width = 320;
  const height = 120;
  const barGap = 4;
  const barCount = history.length;
  const barWidth = Math.floor((width - barGap * (barCount - 1)) / barCount);
  const maxTime = Math.max(...history.map(h => h.time), 1);

  const diffColors = { easy: '#57C47A', medium: '#F5A623', hard: '#E74C3C' };

  let bars = '';
  history.forEach((h, i) => {
    const barH = Math.max(4, Math.round((h.time / maxTime) * (height - 20)));
    const x = i * (barWidth + barGap);
    const y = height - barH;
    const color = diffColors[h.difficulty] || '#70B5F9';
    bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="3" fill="${color}" opacity="0.85"/>`;
    bars += `<text x="${x + barWidth / 2}" y="${height + 14}" font-size="9" fill="#787878" text-anchor="middle">${formatTime(h.time)}</text>`;
  });

  return `
    <div style="margin-bottom:8px;">
      <div style="font-size:13px;font-weight:600;color:#B0B0B0;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Recent Solves</div>
      <svg width="${width}" height="${height + 18}" viewBox="0 0 ${width} ${height + 18}" style="max-width:100%;">
        ${bars}
      </svg>
    </div>
  `;
}
