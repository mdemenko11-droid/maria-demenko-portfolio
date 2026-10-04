(function(){
  var root = document.documentElement;

  var header = document.querySelector('.site-header');
  var lastY = window.scrollY;
  var ticking = false;
  function onScroll(){
    var y = window.scrollY;
    if (y > lastY && y > header.offsetHeight){
      header.classList.add('is-hidden');
    } else {
      header.classList.remove('is-hidden');
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function(){
    if (!ticking){
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, {passive:true});

  // the #top anchor sits below the sticky header, so scroll to the real top instead
  document.querySelector('.logo-mark').addEventListener('click', function(e){
    e.preventDefault();
    window.scrollTo({top:0, behavior:'smooth'});
  });

  var langButtons = document.querySelectorAll('.lang-btn');
  function setLang(l){
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l);
    for (var i=0;i<langButtons.length;i++){
      langButtons[i].setAttribute('aria-pressed', langButtons[i].getAttribute('data-set-lang') === l);
    }
    try{ localStorage.setItem('md-lang', l); }catch(e){}
  }
  for (var i=0;i<langButtons.length;i++){
    (function(b){ b.addEventListener('click', function(){ setLang(b.getAttribute('data-set-lang')); }); })(langButtons[i]);
  }
  var storedLang;
  try{ storedLang = localStorage.getItem('md-lang'); }catch(e){}
  var navLang = (navigator.language || 'en').slice(0,2);
  setLang(storedLang || (navLang === 'ru' ? 'ru' : 'en'));

  var themeBtn = document.getElementById('theme-toggle');
  var sunIcon = themeBtn.querySelector('.icon-sun');
  var moonIcon = themeBtn.querySelector('.icon-moon');
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function isDarkNow(){
    var current = root.getAttribute('data-theme');
    return current ? current === 'dark' : systemDark.matches;
  }
  function syncToggle(){
    var dark = isDarkNow();
    themeBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    sunIcon.hidden = !dark;
    moonIcon.hidden = dark;
  }
  function applyTheme(t){
    if (t){ root.setAttribute('data-theme', t); }
    else { root.removeAttribute('data-theme'); }
    syncToggle();
  }

  var storedTheme;
  try{ storedTheme = localStorage.getItem('md-theme'); }catch(e){}
  if (storedTheme){ root.setAttribute('data-theme', storedTheme); }
  syncToggle();
  systemDark.addEventListener('change', function(){ if (!root.getAttribute('data-theme')) syncToggle(); });

  themeBtn.addEventListener('click', function(){
    var next = isDarkNow() ? 'light' : 'dark';
    applyTheme(next);
    try{ localStorage.setItem('md-theme', next); }catch(e){}
  });
})();

/* case card carousel: crossfade two screenshots, pause while hovered */
document.querySelectorAll('[data-carousel]').forEach(function(root){
  var track  = root.querySelector('.carousel-track');
  var slides = root.querySelectorAll('.carousel-slide');
  var dots   = root.querySelectorAll('.carousel-dot');
  if (slides.length < 2) return;
  var index = 0, timer = null;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show(next){
    index = (next + slides.length) % slides.length;
    slides.forEach(function(s,i){ s.classList.toggle('is-active', i === index); });
    dots.forEach(function(d,i){ d.classList.toggle('is-active', i === index); });
  }
  function play(){ if (!still) timer = setInterval(function(){ show(index + 1); }, 5000); }
  function stop(){ clearInterval(timer); timer = null; }

  /* any click restarts the 5s countdown so a manual step never fights the timer */
  function goTo(next){ stop(); show(next); play(); }

  dots.forEach(function(d,i){
    d.addEventListener('click', function(){ goTo(i); });
  });
  track.addEventListener('click', function(){ goTo(index + 1); });
  play();
});

/* tools marquee: clone the track until it covers twice the viewport, then
   scroll it by exactly one track + one gap so the loop is seamless */
document.querySelectorAll('[data-marquee]').forEach(function(mq){
  var row = mq.querySelector('.marquee-row');
  var track = mq.querySelector('.marquee-track');
  if (!row || !track) return;

  function build(){
    row.querySelectorAll('.marquee-track[aria-hidden]').forEach(function(t){ t.remove(); });
    var gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    var one = track.getBoundingClientRect().width;
    if (!one) return;
    var copies = Math.max(2, Math.ceil((mq.offsetWidth * 2) / (one + gap)));
    for (var i = 1; i < copies; i++){
      var clone = track.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      row.appendChild(clone);
    }
    row.style.setProperty('--mq-shift', (one + gap) + 'px');
    row.style.setProperty('--mq-dur', ((one + gap) / 55) + 's');   /* ~55px per second */
  }

  build();
  window.addEventListener('resize', function(){
    clearTimeout(mq._t);
    mq._t = setTimeout(build, 200);
  });
});

/* headline typewriter: the sentence after "designer" cycles through a few
   phrasings. One typer per language span, so switching EN/RU keeps working.
   The heading is height-locked to its tallest phrase first, so the hero never
   reflows while the text types. */
(function(){
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var typers = [].slice.call(document.querySelectorAll('.hero-title .type'));
  if (!typers.length) return;

  function lockHeight(el){
    var title = el.closest('.hero-title');
    if (!title || el.offsetParent === null) return;
    var words = el.dataset.words.split('|');
    var keep = el.textContent;
    title.style.minHeight = '';
    var tallest = 0;
    words.forEach(function(w){
      el.textContent = w;
      tallest = Math.max(tallest, title.offsetHeight);
    });
    el.textContent = keep;
    title.style.minHeight = tallest + 'px';
  }

  function lockVisible(){
    typers.forEach(function(el){ if (el.offsetParent !== null) lockHeight(el); });
  }

  typers.forEach(function(el){
    var words = el.dataset.words.split('|');
    if (still) { el.textContent = words[0]; return; }

    var word = 0, char = 0, erasing = false;
    (function step(){
      var target = words[word];
      char += erasing ? -1 : 1;
      el.textContent = target.slice(0, char);

      var delay = erasing ? 28 : 55;
      if (!erasing && char === target.length) { erasing = true; delay = 1900; }
      else if (erasing && char === 0) { erasing = false; word = (word + 1) % words.length; delay = 360; }
      setTimeout(step, delay);
    })();
  });

  lockVisible();

  var t;
  window.addEventListener('resize', function(){
    clearTimeout(t);
    t = setTimeout(lockVisible, 200);
  });

  /* the language buttons swap which span is visible, so re-measure after them */
  document.querySelectorAll('[data-set-lang]').forEach(function(b){
    b.addEventListener('click', function(){ setTimeout(lockVisible, 50); });
  });
})();
