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

// scroll reveal: the blocks of every Signal page rise in as they enter the viewport, once
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const sel = ['.intro-copy', '.facts--row', '.job', '.about-cta .mono', '.about-cta h2', '.about-cta .hero-actions',
    '.case-top', '.foot-name', '.foot .wrap',
    '.cs-brief', '.cs-quote', '.cs-split', '.cs-step', '.cs-tiles > *', '.cs-chips', '.cs-feat-row', '.cs-demo-head', '.cs-demo',
    '.cs-sub', '.cs-shots > *', '.cs-shot--wide', '.cs-standout', '.cs-metrics li', '.cs-learn > *', '.cs-actions'];
  const els = [...document.querySelectorAll(sel.join(','))];
  els.forEach(el => {
    el.classList.add('reveal');
    // a short stagger among siblings that share a parent (the job rows, the closing lines)
    const sibs = els.filter(o => o.parentElement === el.parentElement);
    el.style.setProperty('--rd', (Math.min(sibs.indexOf(el), 5) * .09) + 's');
  });
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting){ en.target.classList.add('is-shown'); io.unobserve(en.target); }
  }), {rootMargin:'0px 0px -12% 0px', threshold:.12});
  els.forEach(el => io.observe(el));
  // a fast scroll can jump right past a block between frames: anything already above the fold is shown too
  // and at the very bottom of the page everything left shows, since the last lines can never rise any higher
  const sweep = () => { const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
    els.forEach(el => { if (!el.classList.contains('is-shown') && (atEnd || el.getBoundingClientRect().top < innerHeight * .9)){ el.classList.add('is-shown'); io.unobserve(el); } }); };
  addEventListener('scroll', sweep, {passive:true}); sweep();
})();
