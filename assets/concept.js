/* concept page: the one orchestrated moment. On load the rail cards are
   dealt from a single stack in the middle of the hero, left to right. */
(function(){
  'use strict';
  var rail = document.querySelector('.deck-hero .cards');
  if (!rail || !rail.animate) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  rail.classList.add('is-dealing');

  function deal(){
    var box = rail.getBoundingClientRect();
    var cx = box.left + box.width / 2, cy = box.top + box.height / 2;
    var cards = [].slice.call(rail.querySelectorAll('.rail-track > .card')).filter(function(c){
      var r = c.getBoundingClientRect();
      return r.right > box.left && r.left < box.right;
    });
    rail.classList.remove('is-dealing');
    cards.forEach(function(card, i){
      var r = card.getBoundingClientRect();
      var dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2) + 40;
      var turn = (i % 2 ? 1 : -1) * (4 + i);
      card.animate([
        {transform:'translate(' + dx + 'px,' + dy + 'px) rotate(' + turn + 'deg) scale(.9)', opacity:0},
        {opacity:1, offset:.25},
        {transform:'none', opacity:1}
      ], {duration:900, delay:200 + i * 90, easing:'cubic-bezier(.2,.8,.2,1)', fill:'backwards'});
    });
  }

  if (document.readyState === 'complete') requestAnimationFrame(deal);
  else window.addEventListener('load', function(){ requestAnimationFrame(deal); });
})();
