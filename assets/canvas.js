/* The working canvas: pan, zoom, fly to a frame, and an orbit around the
   selected one. Frames carry their world position in data-x/y/w/h; on narrow
   screens they are re-laid as one readable column instead. */
(function(){
  'use strict';
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var viewport = document.getElementById('viewport');
  var world = document.getElementById('world');
  var orbit = document.getElementById('orbit');
  var orbitDot = orbit.querySelector('.orbit-dot');
  var zoomValue = document.getElementById('zoom-value');
  var frames = [].slice.call(world.querySelectorAll('.frame'));
  var navLinks = [].slice.call(document.querySelectorAll('.layers [data-go]'));

  /* ---------- language, shared with the rest of the site ---------- */
  var langBtns = document.querySelectorAll('[data-set-lang]');
  function setLang(l){
    root.setAttribute('data-lang', l); root.setAttribute('lang', l);
    langBtns.forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.setLang === l); });
    try{ localStorage.setItem('md-lang', l); }catch(e){}
    if (mobile) { layout(); if (selected) fly(selected, false); }
  }
  langBtns.forEach(function(b){ b.addEventListener('click', function(){ setLang(b.dataset.setLang); }); });

  /* ---------- camera ---------- */
  var cam = {x:0, y:0, z:1}, anim = null, selected = null, mobile = false;
  var MIN = .12, MAX = 2;

  function apply(){
    world.style.transform = 'translate(' + cam.x.toFixed(2) + 'px,' + cam.y.toFixed(2) + 'px) scale(' + cam.z.toFixed(4) + ')';
    root.style.setProperty('--inv', (1 / cam.z).toFixed(4));
    var g = 24 * cam.z;
    while (g < 12) g *= 2;              // keep the dot grid from turning into mush when zoomed out
    viewport.style.setProperty('--grid', g.toFixed(2) + 'px');
    viewport.style.setProperty('--gx', (cam.x % g).toFixed(2) + 'px');
    viewport.style.setProperty('--gy', (cam.y % g).toFixed(2) + 'px');
    zoomValue.textContent = Math.round(cam.z * 100) + '%';
  }

  function stop(){ if (anim){ cancelAnimationFrame(anim); anim = null; } }

  function animateTo(t, animate){
    stop();
    if (!animate || reduced){ cam = t; apply(); return; }
    var from = {x:cam.x, y:cam.y, z:cam.z}, t0 = performance.now(), dur = 950;
    var ease = function(p){ return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
    (function step(now){
      var p = Math.min(1, (now - t0) / dur), e = ease(p);
      // zoom eases in log space so a big change in scale feels even
      cam.z = Math.exp(Math.log(from.z) + (Math.log(t.z) - Math.log(from.z)) * e);
      cam.x = from.x + (t.x - from.x) * e;
      cam.y = from.y + (t.y - from.y) * e;
      apply();
      anim = p < 1 ? requestAnimationFrame(step) : null;
    })(t0);
  }

  // the area not covered by chrome, where a framed rect is centred
  function stage(){
    var vw = innerWidth, vh = innerHeight;
    if (mobile) return {l:16, r:vw - 16, t:104, b:vh - 84};
    return {l:256, r:vw - 40, t:90, b:vh - 86};
  }

  function targetFor(rect, pad){
    var s = stage(), w = s.r - s.l, h = s.b - s.t;
    var z = Math.max(MIN, Math.min(MAX, Math.min(w / (rect.w + pad * 2), h / (rect.h + pad * 2)), mobile ? 1 : 1.15));
    return {z:z, x:(s.l + s.r) / 2 - (rect.x + rect.w / 2) * z, y:(s.t + s.b) / 2 - (rect.y + rect.h / 2) * z};
  }

  function zoomAt(px, py, factor){
    stop();
    var z = Math.max(MIN, Math.min(MAX, cam.z * factor));
    cam.x = px - (px - cam.x) * (z / cam.z);
    cam.y = py - (py - cam.y) * (z / cam.z);
    cam.z = z; apply();
  }

  /* ---------- layout ---------- */
  function rectOf(f){ return f._rect; }

  function layout(){
    mobile = innerWidth <= 820;
    if (mobile){
      var y = 0, W = Math.min(420, innerWidth - 32);
      frames.forEach(function(f){
        f.style.left = '0px'; f.style.top = y + 'px'; f.style.width = W + 'px'; f.style.height = 'auto';
        var h = f.offsetHeight;
        f._rect = {x:0, y:y, w:W, h:h};
        y += h + 96;
      });
    } else {
      frames.forEach(function(f){
        var r = {x:+f.dataset.x, y:+f.dataset.y, w:+f.dataset.w, h:+f.dataset.h};
        f.style.left = r.x + 'px'; f.style.top = r.y + 'px'; f.style.width = r.w + 'px'; f.style.height = r.h + 'px';
        f._rect = r;
      });
    }
    root.classList.toggle('is-mobile', mobile);
    if (selected) placeOrbit(selected);
  }

  function allBounds(){
    var b = {x1:Infinity, y1:Infinity, x2:-Infinity, y2:-Infinity};
    frames.forEach(function(f){ var r = rectOf(f); b.x1 = Math.min(b.x1, r.x); b.y1 = Math.min(b.y1, r.y); b.x2 = Math.max(b.x2, r.x + r.w); b.y2 = Math.max(b.y2, r.y + r.h); });
    return {x:b.x1, y:b.y1, w:b.x2 - b.x1, h:b.y2 - b.y1};
  }

  /* ---------- selection and the orbit ---------- */
  var orbitBox = null;
  function placeOrbit(f){
    var r = rectOf(f), w = r.w * 1.34, h = r.h * 1.5;
    orbitBox = {w:w, h:h};
    orbit.style.left = (r.x + r.w / 2 - w / 2) + 'px';
    orbit.style.top = (r.y + r.h / 2 - h / 2) + 'px';
    orbit.style.width = w + 'px'; orbit.style.height = h + 'px';
    orbit.classList.add('is-on');
  }

  function select(f, push){
    if (selected) selected.classList.remove('is-selected');
    selected = f; f.classList.add('is-selected');
    placeOrbit(f);
    navLinks.forEach(function(a){ a.setAttribute('aria-current', a.dataset.go === f.id ? 'true' : 'false'); });
    var hash = '#' + f.id;
    if (location.hash !== hash) history[push ? 'pushState' : 'replaceState'](null, '', hash);
  }

  function fly(f, animate){ animateTo(targetFor(rectOf(f), mobile ? 0 : 40), animate); }

  function go(id, push){
    var f = document.getElementById(id);
    if (!f || frames.indexOf(f) < 0) return;
    select(f, push); fly(f, true);
  }

  // the light glides along the lower part of the ellipse, right to left, then starts over
  (function glide(t){
    if (orbitBox){
      var p = reduced ? .5 : (t / 7000) % 1, A = Math.PI * .42;
      var ang = Math.PI / 2 - A + 2 * A * p;
      var x = orbitBox.w / 2 + orbitBox.w / 2 * Math.cos(ang), y = orbitBox.h / 2 + orbitBox.h / 2 * Math.sin(ang);
      orbitDot.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      orbitDot.style.opacity = Math.max(0, Math.min(1, p / .1, (1 - p) / .1)).toFixed(3);
    }
    if (!reduced) requestAnimationFrame(glide);
  })(0);

  /* ---------- pointer: pan, pinch, click to select ---------- */
  var pointers = new Map(), drag = null, pinch = null, suppressClick = false;
  var isControl = function(el){ return el.closest('a, button, .comment, input'); };

  viewport.addEventListener('pointerdown', function(e){
    if (e.button !== 0) return;
    pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
    stop();
    if (pointers.size === 2){
      var p = [].slice.call(pointers.values());
      pinch = {d:Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), z:cam.z};
      drag = null; return;
    }
    drag = {x:e.clientX, y:e.clientY, cx:cam.x, cy:cam.y, moved:false, id:e.pointerId, target:e.target};
  });
  viewport.addEventListener('pointermove', function(e){
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if (pinch && pointers.size === 2){
      var p = [].slice.call(pointers.values());
      var d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      zoomAt((p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2, (pinch.z * d / pinch.d) / cam.z);
      return;
    }
    if (!drag) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 5){
      drag.moved = true; viewport.classList.add('is-panning');
      try{ viewport.setPointerCapture(drag.id); }catch(err){}
    }
    if (drag.moved){ cam.x = drag.cx + dx; cam.y = drag.cy + dy; apply(); }
  });
  function endPointer(e){
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!drag) return;
    if (drag.moved){ suppressClick = true; setTimeout(function(){ suppressClick = false; }, 0); }
    else if (!isControl(drag.target)){
      var f = drag.target.closest('.frame');
      if (f && f !== selected) go(f.id, true);
    }
    drag = null; viewport.classList.remove('is-panning');
  }
  viewport.addEventListener('pointerup', endPointer);
  viewport.addEventListener('pointercancel', endPointer);
  // a drag that ends over a link must not open it
  viewport.addEventListener('click', function(e){ if (suppressClick){ e.preventDefault(); e.stopPropagation(); } }, true);

  // trackpad: two-finger scroll pans, pinch (ctrl + wheel) zooms; a mouse wheel zooms
  viewport.addEventListener('wheel', function(e){
    e.preventDefault(); stop();
    var mouseWheel = e.deltaMode === 1 || (Math.abs(e.deltaY) >= 50 && e.deltaX === 0 && !e.ctrlKey && Number.isInteger(e.deltaY));
    if (e.ctrlKey || mouseWheel) zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0018)));
    else { cam.x -= e.deltaX; cam.y -= e.deltaY; apply(); }
  }, {passive:false});

  // focus can scroll an overflow:hidden box; the camera owns the position, so undo it
  viewport.addEventListener('scroll', function(){ viewport.scrollLeft = 0; viewport.scrollTop = 0; });

  /* ---------- holographic cards lean toward the pointer ---------- */
  var canTilt = !reduced && window.matchMedia('(hover: hover)').matches;
  frames.forEach(function(f){
    var card = f.querySelector('.card');
    if (!card) return;
    card.addEventListener('pointermove', function(e){
      if (drag && drag.moved) return;
      var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      if (canTilt && !card.classList.contains('card--draft')){
        var k = Math.min(1, 360 / r.width);
        card.style.transform = 'perspective(' + Math.round(1400 / k) + 'px) rotateX(' + ((.5 - y) * 10 * k).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 12 * k).toFixed(2) + 'deg)';
      }
    });
    card.addEventListener('pointerleave', function(){ card.style.transform = ''; card.style.removeProperty('--mx'); card.style.removeProperty('--my'); });
  });

  /* ---------- navigation ---------- */
  document.addEventListener('click', function(e){
    var a = e.target.closest('[data-go]');
    if (!a) return;
    e.preventDefault();
    go(a.dataset.go, true);
    var f = document.getElementById(a.dataset.go);
    if (f && a.closest('.layers')) f.focus({preventScroll:true});
  });
  // keyboard: tabbing onto a frame flies to it
  frames.forEach(function(f){
    f.addEventListener('focusin', function(){ if (f !== selected) go(f.id, false); });
  });
  window.addEventListener('popstate', function(){ go((location.hash || '#f-hello').slice(1), false); });

  document.querySelectorAll('[data-zoom]').forEach(function(b){
    b.addEventListener('click', function(){
      var k = b.dataset.zoom;
      if (k === 'fit') animateTo(targetFor(allBounds(), 80), true);
      else zoomAt(innerWidth / 2, innerHeight / 2, k === 'in' ? 1.25 : .8);
    });
  });
  document.addEventListener('keydown', function(e){
    if (e.target.closest('input, textarea')) return;
    var step = 80;
    if (e.key === '+' || e.key === '='){ zoomAt(innerWidth / 2, innerHeight / 2, 1.25); }
    else if (e.key === '-'){ zoomAt(innerWidth / 2, innerHeight / 2, .8); }
    else if (e.key === '0' || (e.key === '1' && e.shiftKey)){ animateTo(targetFor(allBounds(), 80), true); }
    else if (document.activeElement === document.body || document.activeElement === viewport){
      if (e.key === 'ArrowLeft') cam.x += step; else if (e.key === 'ArrowRight') cam.x -= step;
      else if (e.key === 'ArrowUp') cam.y += step; else if (e.key === 'ArrowDown') cam.y -= step;
      else return;
      e.preventDefault(); stop(); apply();
    }
  });

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

  /* ---------- start: the whole canvas, then one flight into the first frame ---------- */
  var stored; try{ stored = localStorage.getItem('md-lang'); }catch(e){}
  layout();
  setLang(stored || ((navigator.language || 'en').slice(0, 2) === 'ru' ? 'ru' : 'en'));
  var startId = (location.hash || '').slice(1);
  var start = document.getElementById(startId);
  if (!start || frames.indexOf(start) < 0) start = frames[0];
  animateTo(targetFor(allBounds(), 80), false);
  select(start, false);
  setTimeout(function(){ fly(start, true); }, reduced ? 0 : 700);

  var rt;
  window.addEventListener('resize', function(){
    clearTimeout(rt);
    rt = setTimeout(function(){ layout(); if (selected) fly(selected, false); }, 120);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if (mobile){ layout(); if (selected) fly(selected, false); } });
})();
