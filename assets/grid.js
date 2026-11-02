(function(){
  'use strict';
  var root = document.documentElement;

  /* language, shared with the rest of the site */
  var langBtns = document.querySelectorAll('[data-set-lang]');
  function setLang(l){
    root.setAttribute('data-lang', l); root.setAttribute('lang', l);
    langBtns.forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.setLang === l); });
    try{ localStorage.setItem('md-lang', l); }catch(e){}
  }
  langBtns.forEach(function(b){ b.addEventListener('click', function(){ setLang(b.dataset.setLang); }); });
  var stored; try{ stored = localStorage.getItem('md-lang'); }catch(e){}
  setLang(stored || ((navigator.language || 'en').slice(0, 2) === 'ru' ? 'ru' : 'en'));

  /* copy e-mail; the label may hold both languages, so restore its markup afterwards */
  document.querySelectorAll('[data-copy]').forEach(function(btn){
    var label = btn.querySelector('[data-copy-label]'), html = label.innerHTML;
    btn.addEventListener('click', function(e){
      e.preventDefault();
      var done = function(){
        btn.classList.add('copy-ok');
        label.textContent = root.getAttribute('data-lang') === 'ru' ? 'Скопировано' : 'Copied';
        setTimeout(function(){ btn.classList.remove('copy-ok'); label.innerHTML = html; }, 1600);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(btn.dataset.copy).then(done, function(){ location.href = 'mailto:' + btn.dataset.copy; });
      else location.href = 'mailto:' + btn.dataset.copy;
    });
  });

  /* cells settle in one after another */
  document.querySelectorAll('.board > *').forEach(function(el, i){ el.style.setProperty('--i', i); });

  /* the card leans toward the pointer and the lights follow it.
     Pointer events only set a target; one animation loop eases every card
     toward its target each frame, so the motion is continuous whatever the
     mouse does, and it settles back the same way when the pointer leaves. */
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canTilt = !still && window.matchMedia('(hover: hover)').matches;
  var cards = [].slice.call(document.querySelectorAll('.card')).map(function(el){
    // rest: the light sits top-left, nothing tilted
    return {el:el, foil:el.querySelector('.foil'), tx:-.4, ty:-.6, th:0, x:-.4, y:-.6, h:0, ax:0, ay:0, tax:0, tay:0, k:.14, w:1, hgt:1, amp:1};
  });
  var running = false;

  function paint(c){
    var s = c.el.style;
    if (canTilt){
      // the tilt has its own position, which always comes home to level
      // a wide card leans less, so its far edge never swings too far
      s.setProperty('--rx', (-c.ay * 6 * c.amp).toFixed(3) + 'deg');
      s.setProperty('--ry', (c.ax * 7 * c.amp).toFixed(3) + 'deg');
      s.setProperty('--s', (1 + .012 * c.h).toFixed(4));
    }
    // the white light rides with the pointer; the colour wash drifts the other way, like foil
    s.setProperty('--hx', (c.x * .32 * c.w).toFixed(1) + 'px');
    s.setProperty('--hy', (c.y * .32 * c.hgt).toFixed(1) + 'px');
    if (c.foil){
      c.foil.style.setProperty('--fx', (-c.x * .14 * c.w).toFixed(1) + 'px');
      c.foil.style.setProperty('--fy', (-c.y * .14 * c.hgt).toFixed(1) + 'px');
      c.foil.style.setProperty('--fo', (.62 + .38 * c.h).toFixed(3));
    }
  }

  function frame(){
    var moving = false;
    cards.forEach(function(c){
      // a gentle ease: about a sixth of the remaining distance each frame
      // following the pointer is quick; settling back after it leaves is slower and softer
      c.x += (c.tx - c.x) * c.k;
      c.y += (c.ty - c.y) * c.k;
      c.ax += (c.tax - c.ax) * c.k;
      c.ay += (c.tay - c.ay) * c.k;
      c.h += (c.th - c.h) * c.k;
      var d = Math.abs(c.tx - c.x) + Math.abs(c.ty - c.y) + Math.abs(c.tax - c.ax) + Math.abs(c.tay - c.ay) + Math.abs(c.th - c.h);
      if (d > .002) moving = true;
      else { c.x = c.tx; c.y = c.ty; c.ax = c.tax; c.ay = c.tay; c.h = c.th; }
      paint(c);
    });
    if (moving) requestAnimationFrame(frame); else running = false;
  }
  function kick(){ if (!running){ running = true; requestAnimationFrame(frame); } }

  function measure(){ cards.forEach(function(c){ c.w = c.el.offsetWidth; c.hgt = c.el.offsetHeight; c.amp = Math.min(1, 380 / Math.max(c.w, c.hgt)); paint(c); }); }

  cards.forEach(function(c){
    c.el.addEventListener('pointerenter', function(){ measure(); });
    c.el.addEventListener('pointermove', function(e){
      // read the untilted box so the tilt itself never feeds back into the target
      var r = c.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      c.tx = Math.max(-1, Math.min(1, (e.clientX - cx) / (c.w / 2)));
      c.ty = Math.max(-1, Math.min(1, (e.clientY - cy) / (c.hgt / 2)));
      c.tax = c.tx; c.tay = c.ty; c.th = 1; c.k = .14;
      kick();
    });
    c.el.addEventListener('pointerleave', function(){
      c.tx = -.4; c.ty = -.6; c.tax = 0; c.tay = 0; c.th = 0; c.k = .06;
      kick();
    });
  });
  measure();
  window.addEventListener('resize', measure);

  /* the timeline's bars grow in once it scrolls into view */
  var tl = document.querySelector('.cell--timeline');
  if (tl && !still && 'IntersectionObserver' in window){
    tl.classList.add('is-pending');
    new IntersectionObserver(function(entries, io){
      if (entries[0].isIntersecting){ tl.classList.remove('is-pending'); io.disconnect(); }
    }, {threshold:.35}).observe(tl);
  }

  /* the buttons: the rim light and the halo follow the pointer; sparks drift off them */
  document.querySelectorAll('.lead-btn').forEach(function(btn, bi){
    /* the membrane: the outline is a ring of points on springs. Near the pointer it swells out,
       and once the pointer slips outside, the nearest edge reaches after it like a drop of
       liquid, then lets go and wobbles back into a pill. */
    if (btn){
      var svg = btn.querySelector('.lb-svg'), paths = btn.querySelectorAll('.lb-path'), glint = btn.querySelector('#lb-glint');
      // each button gets its own clip and glint, so several can share a page
      var clip = btn.querySelector('clipPath');
      if (bi && clip){ clip.id = 'lb-clip-' + bi; btn.querySelector('.lb-body').style.clipPath = 'url(#lb-clip-' + bi + ')'; }
      if (bi && glint){ glint.id = 'lb-glint-' + bi; btn.querySelector('.lb-glint').setAttribute('stroke', 'url(#lb-glint-' + bi + ')'); }
      var PAD = 44, N = 56, pts = [], bw = 0, bh = 0, ptr = null, mRun = false, wasNear = false;

      // rest outline: evenly spaced points round a pill, with outward normals
      function build(){
        bw = btn.offsetWidth; bh = btn.offsetHeight;
        var r = bh / 2, straight = bw - bh, per = 2 * straight + 2 * Math.PI * r, old = pts;
        pts = [];
        for (var i = 0; i < N; i++){
          var d = i / N * per, x, y, nx, ny;
          if (d < straight){ x = r + d; y = 0; nx = 0; ny = -1; }
          else if ((d -= straight) < Math.PI * r){ var a = -Math.PI / 2 + d / r; x = bw - r + Math.cos(a) * r; y = r + Math.sin(a) * r; nx = Math.cos(a); ny = Math.sin(a); }
          else if ((d -= Math.PI * r) < straight){ x = bw - r - d; y = bh; nx = 0; ny = 1; }
          else { d -= straight; var b = Math.PI / 2 + d / r; x = r + Math.cos(b) * r; y = r + Math.sin(b) * r; nx = Math.cos(b); ny = Math.sin(b); }
          pts.push({x0:x, y0:y, nx:nx, ny:ny, dx:old[i] ? old[i].dx : 0, dy:old[i] ? old[i].dy : 0, vx:0, vy:0, tx:0, ty:0});
        }
      }

      // a smooth closed curve through the points (Catmull-Rom as cubic Béziers)
      function draw(){
        var P = pts.map(function(p){ return [p.x0 + p.dx + PAD, p.y0 + p.dy + PAD]; }), d = '';
        for (var i = 0; i < N; i++){
          var p0 = P[(i - 1 + N) % N], p1 = P[i], p2 = P[(i + 1) % N], p3 = P[(i + 2) % N];
          if (!i) d += 'M' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1);
          d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
               (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
        }
        paths.forEach(function(p){ p.setAttribute('d', d + 'Z'); });
      }

      function targets(){
        pts.forEach(function(p){ p.tx = 0; p.ty = 0; });
        if (!ptr) return;
        var inside = ptr.x > 0 && ptr.x < bw && ptr.y > 0 && ptr.y < bh;
        // how far outside the pill the pointer is (0 when inside)
        var cx = Math.max(bh / 2, Math.min(bw - bh / 2, ptr.x)), ex = ptr.x - cx, ey = ptr.y - bh / 2;
        var gap = Math.max(0, Math.sqrt(ex * ex + ey * ey) - bh / 2);
        if (gap > 60) return; // too far: let go
        pts.forEach(function(p){
          var vx = ptr.x - p.x0, vy = ptr.y - p.y0, dist = Math.sqrt(vx * vx + vy * vy);
          if (inside){
            // swell outward around the pointer
            var g = Math.exp(-dist * dist / (2 * 34 * 34));
            p.tx = p.nx * 10 * g; p.ty = p.ny * 10 * g;
          } else {
            // reach after the pointer: a narrow drop that thins as the pointer pulls away
            var g2 = Math.exp(-dist * dist / (2 * (26 + gap * .3) * (26 + gap * .3))), hold = 1 - (gap / 60) * (gap / 60);
            p.tx = vx * .92 * g2 * hold + p.nx * 4 * g2; p.ty = vy * .92 * g2 * hold + p.ny * 4 * g2;
          }
        });
      }

      function mFrame(){
        var moving = false;
        pts.forEach(function(p){
          p.vx = (p.vx + (p.tx - p.dx) * .12) * .78; p.vy = (p.vy + (p.ty - p.dy) * .12) * .78;
          p.dx += p.vx; p.dy += p.vy;
          if (Math.abs(p.tx - p.dx) + Math.abs(p.ty - p.dy) + Math.abs(p.vx) + Math.abs(p.vy) > .03) moving = true;
        });
        draw();
        if (moving) requestAnimationFrame(mFrame); else mRun = false;
      }
      function mKick(){ if (!mRun){ mRun = true; requestAnimationFrame(mFrame); } }

      if (svg){
        build(); draw(); btn.classList.add('is-blob');
        window.addEventListener('resize', function(){ build(); draw(); });
        if (canTilt){
          window.addEventListener('pointermove', function(e){
            var r = btn.getBoundingClientRect(), s = r.width / bw || 1;
            ptr = {x:(e.clientX - r.left) / s, y:(e.clientY - r.top) / s};
            // far from the button with the outline at rest: nothing to redraw
            var near = ptr.x > -80 && ptr.x < bw + 80 && ptr.y > -80 && ptr.y < bh + 80;
            if (!near && !mRun && !wasNear) return;
            wasNear = near;
            if (glint){ glint.setAttribute('cx', ptr.x + PAD); glint.setAttribute('cy', ptr.y + PAD); }
            targets(); mKick();
          }, {passive:true});
          document.addEventListener('pointerleave', function(){ ptr = null; targets(); mKick(); });
        }
      }
    }
    if (btn){
      var sparks = btn.querySelector('.lb-sparks'), last = 0;
      btn.addEventListener('pointermove', function(e){
        var r = btn.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        btn.style.setProperty('--px', x.toFixed(1) + 'px');
        btn.style.setProperty('--py', y.toFixed(1) + 'px');
        if (still || !sparks) return;
        var now = performance.now();
        if (now - last < 60 || sparks.childElementCount > 18) return;
        last = now;
        var s = document.createElement('span'), a = Math.random() * Math.PI * 2, d = 18 + Math.random() * 34;
        s.className = 'spark';
        s.style.setProperty('--sz', (2 + Math.random() * 2.5).toFixed(1) + 'px');
        s.style.setProperty('--x0', (x + Math.cos(a) * 8).toFixed(1) + 'px');
        s.style.setProperty('--y0', (y + Math.sin(a) * 8).toFixed(1) + 'px');
        s.style.setProperty('--x1', (x + Math.cos(a) * d).toFixed(1) + 'px');
        s.style.setProperty('--y1', (y + Math.sin(a) * d - 10).toFixed(1) + 'px');
        sparks.appendChild(s);
        s.addEventListener('animationend', function(){ s.remove(); });
      });
    }
  });
})();
