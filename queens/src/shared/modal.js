/**
 * Reusable results modal component.
 * @module shared/modal
 */

/**
 * Show a results modal.
 *
 * @param {object} options
 * @param {string} options.title - e.g., '🎉 Solved!'
 * @param {Array<{label: string, value: string}>} options.stats
 * @param {Array<{label: string, variant: 'primary'|'secondary', onClick: Function}>} options.actions
 * @returns {{ close: () => void }}
 */
export function showModal({ title, stats, actions }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal-card">
      <div class="modal-title">${title}</div>
      <div class="modal-stats">
        ${stats.map(s => `
          <div class="modal-stat">
            <span class="modal-stat__label">${s.label}</span>
            <span class="modal-stat__value">${s.value}</span>
          </div>
        `).join('')}
      </div>
      <div class="modal-actions">
        ${actions.map((a, i) => `
          <button class="modal-btn modal-btn--${a.variant}" id="modal-action-${i}">
            ${a.label}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  // Trigger animation
  requestAnimationFrame(() => {
    backdrop.classList.add('modal-backdrop--visible');
  });

  // Wire action buttons
  actions.forEach((action, i) => {
    backdrop.querySelector(`#modal-action-${i}`).addEventListener('click', () => {
      close();
      if (action.onClick) action.onClick();
    });
  });

  function close() {
    backdrop.classList.remove('modal-backdrop--visible');
    setTimeout(() => backdrop.remove(), 200);
  }

  return { close };
}
