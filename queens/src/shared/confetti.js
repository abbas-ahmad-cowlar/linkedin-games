/**
 * Canvas-based confetti particle system.
 * @module shared/confetti
 */

/**
 * Fire a confetti burst.
 *
 * @param {string[]} colors - Array of hex color strings
 * @param {number} [duration=2000] - Duration in ms
 */
export function fireConfetti(colors = ['#FFD54F', '#B39DDB', '#57C47A', '#70B5F9', '#F4A0B5'], duration = 2000) {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.style.cssText = `
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 200;
  `;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const count = 80 + Math.floor(Math.random() * 40); // 80-120

  for (let i = 0; i < count; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 10,
      vy: -(Math.random() * 6 + 8), // upward burst
      w: Math.random() * 6 + 4,
      h: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      gravity: 0.12 + Math.random() * 0.06,
    });
  }

  const startTime = performance.now();

  function animate(now) {
    const progress = (now - startTime) / duration;
    if (progress >= 1) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const alpha = progress > 0.75 ? 1 - (progress - 0.75) / 0.25 : 1;

    particles.forEach((p) => {
      p.x += p.vx;
      p.vy += p.gravity;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
