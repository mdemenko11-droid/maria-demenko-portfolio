(function(){
  'use strict';
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* language, shared with the prototype through localStorage */
  var langBtns = document.querySelectorAll('[data-set-lang]');
  function setLang(l){
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l);
    langBtns.forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.setLang === l); });
    try{ localStorage.setItem('md-lang', l); }catch(e){}
  }
  langBtns.forEach(function(b){ b.addEventListener('click', function(){ setLang(b.dataset.setLang); }); });
  var stored; try{ stored = localStorage.getItem('md-lang'); }catch(e){}
  setLang(stored || ((navigator.language || 'en').slice(0, 2) === 'ru' ? 'ru' : 'en'));

  /* the nav goes dark while it floats over a dark panel (hero, footer) */
  var nav = document.querySelector('.nav'), darks = document.querySelectorAll('.hero, .foot');
  if (nav && darks.length){
    var tick = false;
    var sync = function(){
      var y = nav.offsetTop + nav.offsetHeight / 2, dark = false;
      darks.forEach(function(el){ var r = el.getBoundingClientRect(); if (r.top < y && r.bottom > y) dark = true; });
      nav.classList.toggle('on-dark', dark);
      tick = false;
    };
    window.addEventListener('scroll', function(){ if (!tick){ tick = true; requestAnimationFrame(sync); } }, {passive:true});
    window.addEventListener('resize', sync);
    sync();
  }

  /* copy e-mail */
  document.querySelectorAll('[data-copy]').forEach(function(btn){
    var label = btn.querySelector('[data-copy-label]'), text = label ? label.textContent : '';
    btn.addEventListener('click', function(){
      var done = function(){
        btn.classList.add('copy-ok');
        if (label) label.textContent = root.getAttribute('data-lang') === 'ru' ? 'Скопировано' : 'Copied';
        setTimeout(function(){ btn.classList.remove('copy-ok'); if (label) label.textContent = text; }, 1600);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(btn.dataset.copy).then(done, function(){ location.href = 'mailto:' + btn.dataset.copy; });
      else location.href = 'mailto:' + btn.dataset.copy;
    });
  });

  /* hero cards lean toward the pointer and carry a soft light */
  var canTilt = !reduced && window.matchMedia('(hover: hover)').matches;
  function bindTilt(card){
    if (!canTilt) return;
    card.addEventListener('pointermove', function(e){
      var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.transform = 'perspective(700px) rotateX(' + ((.5 - y) * 22).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 26).toFixed(2) + 'deg) translateY(-6px) scale(1.03)';
      card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    });
    card.addEventListener('pointerleave', function(){ card.style.transform = ''; card.style.removeProperty('--mx'); card.style.removeProperty('--my'); });
  }
  document.querySelectorAll('.card').forEach(bindTilt);

  /* a light that glides right to left along the visible lower half of the arc */
  var arc = document.querySelector('.hero-arc'), dot = document.querySelector('.hero-arc-dot');
  if (arc && dot){
    var heroBox = arc.parentNode, geo = null;
    var measureArc = function(){
      var a = arc.getBoundingClientRect(), h = heroBox.getBoundingClientRect();
      geo = {cx:a.left - h.left + a.width / 2, cy:a.top - h.top + a.height / 2, rx:a.width / 2, ry:a.height / 2, w:h.width};
    };
    var placeDot = function(t){
      // always right to left along the bottom of the ellipse (pi/2 is the lowest point), then it starts over
      var p = (t / 9000) % 1, A = Math.PI * .32;
      var ang = Math.PI / 2 - A + 2 * A * p;
      var x = geo.cx + geo.rx * Math.cos(ang), y = geo.cy + geo.ry * Math.sin(ang);
      var u = x / geo.w, fade = Math.max(0, Math.min(1, p / .08, (1 - p) / .08, (u - .02) / .2, (.98 - u) / .2));
      dot.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      dot.style.opacity = fade.toFixed(3);
    };
    var glide = function(t){ placeDot(t); requestAnimationFrame(glide); };
    measureArc();
    window.addEventListener('resize', measureArc);
    window.addEventListener('load', measureArc);
    if (reduced) placeDot(0); else requestAnimationFrame(glide);
  }

  /* hero rail: drifts on its own, pauses under the pointer, can be dragged */
  var rail = document.querySelector('.hero--rail .cards');
  if (rail){
    var track = rail.querySelector('.rail-track');
    var originals = Array.prototype.slice.call(track.children);
    // copy the set until the track covers the widest screen plus one more set, so the loop never shows a gap
    var addCopy = function(){
      originals.forEach(function(card){
        var cl = card.cloneNode(true);
        cl.setAttribute('aria-hidden', 'true');
        if (cl.tagName === 'A') cl.setAttribute('tabindex', '-1');
        bindTilt(cl);
        track.appendChild(cl);
      });
    };
    addCopy();
    var fill = function(){
      var set = track.children[originals.length].offsetLeft - track.children[0].offsetLeft;
      while (set > 0 && track.scrollWidth < rail.clientWidth + set * 2 && track.children.length < originals.length * 8) addCopy();
    };
    var rx = 0, setW = 1, paused = false, drag = null, last = 0, suppress = false;
    var measure = function(){ setW = track.children[originals.length].offsetLeft - track.children[0].offsetLeft; };
    var apply = function(){ rx = ((rx % setW) - setW) % setW; track.style.transform = 'translateX(' + rx.toFixed(1) + 'px)'; };
    var step = function(t){
      var dt = last ? Math.min(t - last, 50) : 16; last = t;
      if (!reduced && !paused && !drag){ rx -= dt * .03; apply(); }
      requestAnimationFrame(step);
    };
    rail.addEventListener('pointerenter', function(e){ if (e.pointerType === 'mouse') paused = true; });
    rail.addEventListener('pointerleave', function(){ paused = false; });
    rail.addEventListener('focusin', function(){ paused = true; });
    rail.addEventListener('focusout', function(){ paused = false; });
    rail.addEventListener('pointerdown', function(e){ if (e.button === 0) drag = {x:e.clientX, start:rx, id:e.pointerId, moved:false}; });
    rail.addEventListener('pointermove', function(e){
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 6){ drag.moved = true; rail.classList.add('dragging'); rail.setPointerCapture(drag.id); }
      if (drag.moved){ rx = drag.start + dx; apply(); }
    });
    var end = function(){
      if (drag && drag.moved){ suppress = true; setTimeout(function(){ suppress = false; }, 0); }
      drag = null; rail.classList.remove('dragging');
    };
    rail.addEventListener('pointerup', end);
    rail.addEventListener('pointercancel', end);
    // a drag that ends over a link should not open it
    rail.addEventListener('click', function(e){ if (suppress){ e.preventDefault(); e.stopPropagation(); } }, true);
    window.addEventListener('resize', function(){ fill(); measure(); apply(); });
    window.addEventListener('load', function(){ fill(); measure(); apply(); });
    fill(); measure(); apply();
    requestAnimationFrame(step);
  }

  /* timeline: the row in the middle of the screen lights up its dot */
  var tlRows = document.querySelectorAll('.tl-row');
  if (tlRows.length && 'IntersectionObserver' in window){
    var tlIO = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ en.target.classList.toggle('is-active', en.isIntersecting); });
    }, {rootMargin:'-45% 0px -45% 0px'});
    tlRows.forEach(function(r){ tlIO.observe(r); });
  }

  /* fade blocks in as they enter */
  var items = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)){ items.forEach(function(el){ el.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){ if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
  }, {rootMargin:'0px 0px 0px 0px'});
  items.forEach(function(el, i){ el.style.transitionDelay = (i % 2) * 80 + 'ms'; io.observe(el); });
})();
