/* Signal UI: the button light that follows the pointer and the specks thrown from it.
   Shared by every Signal page (no three.js needed). */
// buttons: the arc and halo follow the pointer, and specks of light are thrown out from it as it moves
if (matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.querySelectorAll('.btn').forEach(b => {
  let last = 0, px = null, py = null;
  const spark = (x, y, speed) => {
    const d = document.createElement('span'), r = Math.random, a = r() * Math.PI * 2, dist = 18 + r() * 34 + speed * 2;
    d.className = 'btn-spark'; d.setAttribute('aria-hidden', 'true');
    d.style.cssText = `left:${x}px;top:${y}px;--s:${(1.6 + r() * 2.2).toFixed(1)}px;--d:${(.9 + r() * 1.1).toFixed(2)}s;--dx:${(Math.cos(a) * dist).toFixed(1)}px;--dy:${(Math.sin(a) * dist * .7 - 8).toFixed(1)}px`;
    d.addEventListener('animationend', () => d.remove()); b.prepend(d);
  };
  b.addEventListener('pointerenter', e => { const r = b.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    for (let i = 0; i < 8; i++) spark(x, y, 4); });
  b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    b.style.setProperty('--mx', x + 'px'); b.style.setProperty('--my', y + 'px');
    const now = performance.now(), speed = px === null ? 0 : Math.min(20, Math.hypot(x - px, y - py)); px = x; py = y;
    if (now - last > 40 && b.querySelectorAll('.btn-spark').length < 40){ last = now; spark(x, y, speed); if (speed > 6) spark(x, y, speed); }
  });
  b.addEventListener('pointerleave', () => { px = py = null; });
});
