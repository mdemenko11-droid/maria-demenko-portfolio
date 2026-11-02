/* The zoom: scrolling through the pinned first screen scatters the collage
   and opens the orbit into a lens onto a case; notes then point at the
   decisions. Below, the intro lights up word by word. */
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

  /* ---------- holographic foil follows the pointer ---------- */
  document.querySelectorAll('.frag, .holo, .sc').forEach(function(el){
    el.addEventListener('pointermove', function(e){
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
    el.addEventListener('pointerleave', function(){ el.style.removeProperty('--mx'); el.style.removeProperty('--my'); });
  });

  /* ---------- the zoom ---------- */
  var zoom = document.querySelector('.zoom'), stage = document.getElementById('zoom-stage');
  var frags = [].slice.call(document.querySelectorAll('.frag'));
  var ring = document.getElementById('ring'), lens = document.getElementById('lens'), lensImg = document.getElementById('lens-img');
  var hello = document.getElementById('hello'), cue = document.getElementById('cue'), lensCase = document.getElementById('lens-case');
  var notes = [].slice.call(document.querySelectorAll('.note'));
  var W, H, r0, rEnd, centers = [];

  var clamp = function(v){ return Math.max(0, Math.min(1, v)); };
  var ease = function(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  function measure(){
    W = stage.clientWidth; H = stage.clientHeight;
    r0 = Math.min(W, H) * (W <= 820 ? .36 : .24);
    rEnd = Math.hypot(W, H) / 2 + 20;
    // each fragment flies away from the centre along its own direction
    centers = frags.map(function(f){
      f.style.transform = '';
      var r = f.getBoundingClientRect();
      var dx = r.left + r.width / 2 - W / 2, dy = r.top + r.height / 2 - H / 2, d = Math.hypot(dx, dy) || 1;
      return {x:dx / d, y:dy / d, depth:+f.dataset.depth || 1};
    });
    placeNotes();
  }

  // notes sit on points of the screenshot, mapped through object-fit: cover
  function placeNotes(){
    var iw = +lensImg.dataset.w, ih = +lensImg.dataset.h, s = Math.max(W / iw, H / ih);
    var ox = (W - iw * s) / 2, oy = (H - ih * s) / 2;
    notes.forEach(function(n){
      var x = ox + n.dataset.x * s, y = oy + n.dataset.y * s;
      n.style.left = x + 'px'; n.style.top = y + 'px';
      n.hidden = x < 24 || x > W - 24 || y < 90 || y > H * .5;
      // the label opens toward whichever side it fits, and is nudged in if neither does
      var b = n.querySelector('b'), bw = b.offsetWidth;
      var right = x + bw <= W - 12, left = x - bw >= 12;
      n.classList.toggle('note--left', !right && (left || x > W / 2));
      var edge = n.classList.contains('note--left') ? Math.max(0, 12 - (x - bw)) : -Math.max(0, x + bw - (W - 12));
      b.style.transform = edge ? 'translateX(' + edge.toFixed(0) + 'px)' : '';
    });
  }

  function progress(){
    var r = zoom.getBoundingClientRect(), D = zoom.offsetHeight - H;
    return D > 0 ? clamp(-r.top / D) : 0;
  }

  var shownNotes = -1;
  function render(p){
    var a = ease(clamp(p / .5));          // phase one: scatter and open the lens
    var b = clamp((p - .55) / .35);       // phase two: notes and the case
    frags.forEach(function(f, i){
      var c = centers[i], k = a * Math.max(W, H) * .65 * c.depth;
      f.style.transform = 'translate(' + (c.x * k).toFixed(1) + 'px,' + (c.y * k).toFixed(1) + 'px) scale(' + (1 + a * .45 * c.depth).toFixed(3) + ')';
      f.style.opacity = clamp(1 - a * 1.3).toFixed(3);
      f.style.visibility = a > .97 ? 'hidden' : 'visible';
    });
    var r = r0 + (rEnd - r0) * a;
    ring.style.setProperty('--r', r.toFixed(1) + 'px');
    ring.style.opacity = clamp(1 - a * 1.4).toFixed(3);
    lens.style.setProperty('--lens', r.toFixed(1) + 'px');
    lens.style.setProperty('--lens-o', clamp(a * 4).toFixed(3));
    hello.style.opacity = clamp(1 - a * 3).toFixed(3);
    hello.style.transform = 'translate(-50%, -50%) scale(' + (1 + a * .25).toFixed(3) + ')';
    cue.style.opacity = clamp(1 - p * 8).toFixed(3);

    var on = b <= 0 ? -1 : Math.min(notes.length - 1, Math.floor(b * (notes.length + 1)) - 1);
    if (on !== shownNotes){
      shownNotes = on;
      notes.forEach(function(n, i){ n.classList.toggle('is-on', i <= on); });
    }
    lensCase.classList.toggle('is-on', b > .02);
  }

  // the light keeps travelling round the orbit at rest
  var angle = 0, last = 0;
  function frame(t){
    var dt = last ? Math.min(t - last, 50) : 16; last = t;
    if (!reduced){ angle = (angle + dt * .012) % 360; ring.style.setProperty('--a', angle.toFixed(2) + 'deg'); }
    render(progress());
    requestAnimationFrame(frame);
  }

  /* ---------- the intro lights up word by word ---------- */
  var reveal = document.getElementById('reveal');
  var words = [];
  document.querySelectorAll('[data-words]').forEach(function(p){
    var parts = p.textContent.trim().split(/\s+/);
    p.textContent = '';
    var list = parts.map(function(w, i){
      var s = document.createElement('span');
      s.className = 'w'; s.textContent = w;
      p.appendChild(s);
      if (i < parts.length - 1) p.appendChild(document.createTextNode(' '));
      return s;
    });
    words.push(list);
  });
  function lightWords(){
    var r = reveal.getBoundingClientRect(), vh = window.innerHeight;
    var t = clamp((-r.top + vh * .15) / (r.height - vh * .9));
    words.forEach(function(list){
      var n = reduced ? list.length : Math.round(t * list.length);
      list.forEach(function(w, i){ w.classList.toggle('is-lit', i < n); });
    });
  }
  window.addEventListener('scroll', lightWords, {passive:true});

  /* ---------- the fan: cards held like a hand ---------- */
  var drum = document.getElementById('drum'), ringEl = document.getElementById('drum-ring');
  if (drum){
    var cards = [].slice.call(ringEl.querySelectorAll('.dc')), n = cards.length;
    var open = false, lifted = -1, geo = {};
    var touch = window.matchMedia('(hover: none)').matches;

    var measureFan = function(){
      var W = drum.clientWidth, cw = cards[0].offsetWidth, ch = cards[0].offsetHeight, narrow = W <= 820;
      var step = narrow ? 6 : 5;                              // degrees between neighbouring cards
      var outer = step * (n - 1) / 2;
      // the radius at which the outer cards reach a little short of the screen edges
      var r = Math.max(ch, (W / 2 - cw * (narrow ? .5 : .9)) / Math.sin(outer * Math.PI / 180));
      geo = {step:step, r:r, ch:ch, drop:r * (1 - Math.cos(outer * Math.PI / 180))};
      cards.forEach(function(c){ c.style.transformOrigin = '50% ' + (r + ch / 2).toFixed(0) + 'px'; });
      drum.style.height = (ch + geo.drop + cw * Math.sin(outer * Math.PI / 180) + 100) + 'px';
    };

    var layoutFan = function(){
      cards.forEach(function(c, i){
        var mid = i - (n - 1) / 2, angle = open ? mid * geo.step : mid * .6, lift = 0, scale = 1;
        if (lifted >= 0 && open){
          var d = i - lifted;
          if (d === 0){ lift = -Math.min(48, geo.ch * .14); }
          // neighbours make room, more the closer they are
          else angle += Math.sign(d) * geo.step * .4 * Math.max(0, 1 - (Math.abs(d) - 1) * .45);
        }
        c.style.transform = 'translateX(-50%) rotate(' + angle.toFixed(2) + 'deg) translateY(' + lift.toFixed(1) + 'px) scale(' + scale + ')';
        c.style.zIndex = String(i === lifted ? 50 : 10 + i);
        c.classList.toggle('is-lifted', i === lifted);
      });
    };

    var lift = function(i){ if (lifted !== i){ lifted = i; layoutFan(); } };
    cards.forEach(function(c, i){
      c.style.transitionDelay = (i * 45) + 'ms';
      if (!touch){
        c.addEventListener('pointerenter', function(){ lift(i); });
      }
      c.addEventListener('focus', function(){ lift(i); });
      // on a touch screen the first tap lifts the card, the second opens it
      c.addEventListener('click', function(e){
        if (touch && lifted !== i){ e.preventDefault(); lift(i); }
      });
      c.addEventListener('pointermove', function(e){
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    });
    drum.addEventListener('pointerleave', function(e){ if (e.pointerType === 'mouse') lift(-1); });
    // on a phone, sliding a finger along the hand lifts whichever card is under it
    drum.addEventListener('pointermove', function(e){
      if (e.pointerType === 'mouse') return;
      var el = document.elementFromPoint(e.clientX, e.clientY), c = el && el.closest('.dc');
      if (c) lift(cards.indexOf(c));
    });
    document.addEventListener('pointerdown', function(e){ if (touch && !drum.contains(e.target)) lift(-1); });

    measureFan(); layoutFan();
    // the one orchestrated moment: the fan opens once the page has loaded
    var openFan = function(){
      open = true; layoutFan();
      setTimeout(function(){ cards.forEach(function(c){ c.style.transitionDelay = '0ms'; }); }, 900);
    };
    // with no hover to point at, a phone starts with the middle card already lifted
    if (touch) lifted = Math.floor((n - 1) / 2);
    if (reduced){ cards.forEach(function(c){ c.style.transitionDelay = '0ms'; }); openFan(); }
    else setTimeout(openFan, 350);
    var ft;
    window.addEventListener('resize', function(){ clearTimeout(ft); ft = setTimeout(function(){ measureFan(); layoutFan(); }, 100); });
  }

  /* ---------- the nav jumps ---------- */
  document.querySelectorAll('a[href="#top"]').forEach(function(a){
    a.addEventListener('click', function(e){ e.preventDefault(); window.scrollTo({top:0, behavior:reduced ? 'auto' : 'smooth'}); });
  });

  measure();
  lightWords();
  requestAnimationFrame(frame);
  var rt;
  window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ measure(); lightWords(); }, 120); });
  window.addEventListener('load', measure);
})();
