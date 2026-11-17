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

// easter egg on every page: the orange dot bounces like a ball, throws a handful of sparks and the page's glass object
// (the star, the photo square) spins once. On the home page it then glides to the top; elsewhere it goes on to the home page.
(() => {
  const logo = document.querySelector('.logo'), dot = logo && logo.querySelector('.logo-mark i');
  if (!logo || !dot) return;
  logo.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    const onHome = !!document.querySelector('h1#hero-title');
    // elsewhere: the trick plays, the page softly fades and lifts away, then the home page opens (and rises in)
    if (!onHome){
      setTimeout(() => document.documentElement.classList.add('is-leaving'), 450);
      setTimeout(() => { location.href = logo.getAttribute('href'); }, 950);
    }
    else scrollTo({top:0, behavior:'smooth'});
    dot.classList.remove('is-hop'); void dot.offsetWidth; dot.classList.add('is-hop');
    dispatchEvent(new Event('md:twirl'));
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = dot.getBoundingClientRect(), L = logo.getBoundingClientRect();
    const x = r.left - L.left + r.width / 2, y = r.top - L.top + r.height / 2;
    for (let i = 0; i < 14; i++){
      const sp = document.createElement('span'), a = Math.random() * Math.PI * 2, d = 18 + Math.random() * 30;
      sp.className = 'logo-spark'; sp.setAttribute('aria-hidden', 'true');
      sp.style.cssText = `left:${x}px;top:${y}px;--s:${(2 + Math.random() * 2.4).toFixed(1)}px;--d:${(.6 + Math.random() * .6).toFixed(2)}s;--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d * .8 + 6).toFixed(1)}px`;
      sp.addEventListener('animationend', () => sp.remove()); logo.append(sp);
    }
  });
})();
// coming back with the browser's Back button restores the page from memory: clear the leaving fade
addEventListener('pageshow', () => document.documentElement.classList.remove('is-leaving'));

// smooth page changes for every link inside the site: the page fades, blurs and lifts away, then the next one opens
// and rises in (see .is-leaving and the page-in animation in signal.css). Links that only scroll this page, open a new
// tab, a file or another site are left alone; the logo runs its own trick first (above).
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || a.classList.contains('logo') || e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.getAttribute('href'), location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.hash) return;          // same page, just a scroll
    e.preventDefault();
    document.documentElement.classList.add('is-leaving');
    setTimeout(() => { location.href = url.href; }, 420);
  });
})();

// arriving with an anchor (index.html#work from another page): land on that section once the page has laid out
(() => {
  const id = decodeURIComponent(location.hash.slice(1)); if (!id) return;
  const go = () => { const el = document.getElementById(id); if (el) scrollTo({top:el.getBoundingClientRect().top + scrollY, behavior:'instant'}); };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(go));
})();
