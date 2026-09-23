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
