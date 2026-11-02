/* Cases along the orbit: the scroll position inside the pinned scene turns
   a large circle, and the case cards ride along it. Step -1 is the intro,
   steps 0..n-1 are the cases. */
(function(){
  'use strict';
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- language ---------- */
  var langBtns = document.querySelectorAll('[data-set-lang]');
  function setLang(l){
    root.setAttribute('data-lang', l); root.setAttribute('lang', l);
    langBtns.forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.setLang === l); });
    try{ localStorage.setItem('md-lang', l); }catch(e){}
  }
  langBtns.forEach(function(b){ b.addEventListener('click', function(){ setLang(b.dataset.setLang); }); });
  var stored; try{ stored = localStorage.getItem('md-lang'); }catch(e){}
  setLang(stored || ((navigator.language || 'en').slice(0, 2) === 'ru' ? 'ru' : 'en'));

  /* ---------- copy e-mail ---------- */
  document.querySelectorAll('[data-copy]').forEach(function(btn){
    var label = btn.querySelector('[data-copy-label]'), text = label.textContent;
    btn.addEventListener('click', function(){
      var done = function(){
        btn.classList.add('copy-ok');
        label.textContent = root.getAttribute('data-lang') === 'ru' ? 'Скопировано' : 'Copied';
        setTimeout(function(){ btn.classList.remove('copy-ok'); label.textContent = text; }, 1600);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(btn.dataset.copy).then(done, function(){ location.href = 'mailto:' + btn.dataset.copy; });
      else location.href = 'mailto:' + btn.dataset.copy;
    });
  });

  /* ---------- the scene ---------- */
  var scene = document.querySelector('.orbit-scene');
  var stage = document.getElementById('stage');
  var ring = document.getElementById('ring'), dot = document.getElementById('ring-dot');
  var covers = [].slice.call(document.querySelectorAll('.cover'));
  var sats = [].slice.call(document.querySelectorAll('.sat'));
  var steps = [].slice.call(document.querySelectorAll('.step'));
  var N = covers.filter(function(c){ return +c.dataset.i >= 0; }).length;
  var geo = null, cur = -1, target = -1, shown = null;
  var tilt = covers.map(function(){ return {x:0, y:0}; });

  function measure(){
    var W = stage.clientWidth, H = stage.clientHeight, narrow = W <= 820;
    scene.style.height = Math.round(H * (1 + N * .85)) + 'px';
    var g = {W:W, H:H, narrow:narrow};
    if (narrow){
      g.cw = Math.min(W - 40, 440); g.ch = g.cw * .66;
      g.y0 = 74 + g.ch / 2;
      // on a phone the satellites ride a shallow arc under the card
      g.ringTop = g.y0 + g.ch / 2 + 46; g.R = W * 1.6;
      g.copyTop = g.ringTop + 74;
    } else {
      g.cw = Math.min(W * .4, 600, H * .44 * 1.6); g.ch = g.cw * .625;
      g.y0 = 104 + g.ch / 2 + Math.max(0, (H - 900) * .1);
      // on wide screens the orbit passes behind the card's middle; the card sits on it
      g.ringTop = g.y0; g.R = Math.max(W * 1.1, 1300);
      g.copyTop = g.y0 + g.ch / 2 + 44;
    }
    g.x0 = W / 2; g.cx = W / 2; g.cy = g.ringTop + g.R;
    ring.style.left = (g.cx - g.R) + 'px'; ring.style.top = g.ringTop + 'px';
    ring.style.width = ring.style.height = (g.R * 2) + 'px';
    ring.style.setProperty('--ring-fade', (Math.min(.5, (H - g.ringTop) / (2 * g.R)) * 100 * .5).toFixed(2) + '%');
    covers.forEach(function(c){ c.style.setProperty('--cw', g.cw + 'px'); c.style.setProperty('--ch', g.ch + 'px'); });
    stage.style.setProperty('--copy-top', Math.round(g.copyTop) + 'px');
    geo = g;
  }

  // how far from the centre a satellite sits for a given distance in steps
  function satOffset(ad){
    var g = geo;
    if (g.narrow) return ad * 78;
    var first = g.cw / 2 + 110;
    return ad < 1 ? ad * first : first + (ad - 1) * 170;
  }
  function onRing(off){
    var g = geo, o = Math.max(-g.R * .98, Math.min(g.R * .98, off));
    return {x:g.cx + o, y:g.ringTop + g.R - Math.sqrt(g.R * g.R - o * o)};
  }

  function progress(){
    var top = scene.getBoundingClientRect().top + window.scrollY;
    var D = scene.offsetHeight - geo.H;
    var t = D > 0 ? (window.scrollY - top) / D : 0;
    return -1 + Math.max(0, Math.min(1, t)) * N;
  }

  function scrollToStep(i){
    var top = scene.getBoundingClientRect().top + window.scrollY;
    var D = scene.offsetHeight - geo.H;
    window.scrollTo({top:top + D * (i + 1) / N, behavior:reduced ? 'auto' : 'smooth'});
  }

  function render(){
    var g = geo;
    covers.forEach(function(c, k){
      var d = +c.dataset.i - cur, ad = Math.abs(d);
      var o = Math.max(0, Math.min(1, 1 - ad * 1.7));
      var tx = d * (g.narrow ? 60 : 120), s = 1 - Math.min(ad, 1) * .06, t = tilt[k];
      c.style.transform = 'translate(' + (g.x0 - g.cw / 2 + tx).toFixed(1) + 'px,' + (g.y0 - g.ch / 2).toFixed(1) + 'px) rotateY(' + (-d * 16 + t.y).toFixed(2) + 'deg) rotateX(' + t.x.toFixed(2) + 'deg) scale(' + s.toFixed(3) + ')';
      c.style.opacity = o.toFixed(3);
      c.style.visibility = o < .01 ? 'hidden' : 'visible';
      c.style.zIndex = String(10 - Math.round(ad * 2));
      var front = ad < .5;
      c.classList.toggle('is-front', front);
      c.setAttribute('tabindex', front ? '0' : '-1');
    });
    sats.forEach(function(b){
      var d = +b.dataset.goto - cur, ad = Math.abs(d);
      var p = onRing(Math.sign(d) * satOffset(ad));
      // on wide screens the current satellite hides behind its card; on a phone it stays lit under it
      var o = g.narrow ? 1 - Math.max(0, ad - 2.2) : Math.max(0, Math.min(1, (ad - .45) / .45));
      if (p.x < -60 || p.x > g.W + 60) o = 0;
      b.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)';
      b.style.opacity = Math.max(0, o).toFixed(3);
      b.style.visibility = o < .01 ? 'hidden' : 'visible';
    });

    var idx = Math.max(-1, Math.min(N - 1, Math.round(cur)));
    if (idx !== shown){
      shown = idx;
      steps.forEach(function(s){ s.classList.toggle('is-active', +s.dataset.step === idx); });
      sats.forEach(function(b){ b.setAttribute('aria-current', +b.dataset.goto === idx ? 'true' : 'false'); });
    }
  }

  // the light glides along the visible top of the ring
  function placeDot(now){
    var g = geo, p = reduced ? .5 : (now / 9000) % 1;
    var span = Math.min(g.W * .5, g.R * .9);
    var q = onRing(span - 2 * span * p);
    dot.style.transform = 'translate(' + (q.x - (g.cx - g.R)).toFixed(1) + 'px,' + (q.y - g.ringTop).toFixed(1) + 'px)';
    dot.style.opacity = Math.max(0, Math.min(1, p / .1, (1 - p) / .1)).toFixed(3);
  }

  function frame(now){
    target = progress();
    cur = reduced ? target : cur + (target - cur) * .12;
    if (Math.abs(target - cur) < .0005) cur = target;
    render();
    placeDot(now);
    requestAnimationFrame(frame);
  }

  /* ---------- interaction ---------- */
  covers.forEach(function(c, k){
    c.addEventListener('click', function(e){ if (!c.classList.contains('is-front')) e.preventDefault(); });
    c.addEventListener('pointermove', function(e){
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      if (!reduced && e.pointerType === 'mouse'){ tilt[k].x = (.5 - y) * 10; tilt[k].y = (x - .5) * 12; }
    });
    c.addEventListener('pointerleave', function(){ tilt[k].x = tilt[k].y = 0; c.style.removeProperty('--mx'); c.style.removeProperty('--my'); });
  });
  sats.forEach(function(b){ b.addEventListener('click', function(){ scrollToStep(+b.dataset.goto); }); });
  document.querySelectorAll('a[href="#work"], a[href="#top"]').forEach(function(a){
    a.addEventListener('click', function(e){ e.preventDefault(); scrollToStep(a.getAttribute('href') === '#work' ? 0 : -1); });
  });
  // keyboard: arrows step through while the scene is on screen
  document.addEventListener('keydown', function(e){
    if (e.target.closest('input, textarea')) return;
    var r = scene.getBoundingClientRect();
    if (r.top > 1 || r.bottom < geo.H - 1) return;
    var idx = Math.round(target);
    if ((e.key === 'ArrowDown' || e.key === 'ArrowRight') && idx < N - 1){ e.preventDefault(); scrollToStep(idx + 1); }
    else if ((e.key === 'ArrowUp' || e.key === 'ArrowLeft') && idx > -1){ e.preventDefault(); scrollToStep(idx - 1); }
  });

  measure();
  cur = target = progress();
  render();
  requestAnimationFrame(frame);
  var rt;
  window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(measure, 100); });
})();
