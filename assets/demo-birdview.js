/* Birdview resource-planning prototype.
   One in-memory plan drives every view: Planning (timeline + load cells),
   Workload (hours table) and Simulation (a sandbox copy of the plan). */
(function(){
  'use strict';

  var root = document.documentElement;
  function $(s, r){ return (r || document).querySelector(s); }
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  /* ---------- icons ---------- */
  // Lucide icons (lucide.dev, ISC licence) — the same thin line family the real product uses
  var ICON = {
    chevL:'<path d="m15 18-6-6 6-6"/>', chevR:'<path d="m9 18 6-6-6-6"/>', chevD:'<path d="m6 9 6 6 6-6"/>',
    collapse:'<path d="m7 20 5-5 5 5"/><path d="m7 4 5 5 5-5"/>',
    expand:'<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
    search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    history:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    reports:'<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    gauge:'<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    pie:'<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    folder:'<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    form:'<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
    table:'<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>',
    bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    tasks:'<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    timer:'<path d="M10 2h4"/><path d="m12 14 3-3"/><circle cx="12" cy="14" r="8"/>',
    chat:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    feedback:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7"/><path d="M17 12H7"/>',
    group:'<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><path d="M14 4h7"/><path d="M14 9h7"/><path d="M14 15h7"/><path d="M14 20h7"/>',
    eye:'<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    plane:'<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    hour:'<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
    plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',
    x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    reset:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    flask:'<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
    spark:'<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0l1.58 6.14a2 2 0 0 0 1.44 1.44l6.14 1.58a.5.5 0 0 1 0 .96l-6.14 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/>',
    rocket:'<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    check:'<path d="M20 6 9 17l-5-5"/>',
    info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    swap:'<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
    briefcase:'<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    userSearch:'<circle cx="10" cy="7" r="4"/><path d="M10.3 15H7a4 4 0 0 0-4 4v2"/><circle cx="17" cy="17" r="3"/><path d="m21 21-1.9-1.9"/>',
    panel:'<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/>',
    gantt:'<path d="M8 6h10"/><path d="M6 12h9"/><path d="M11 18h7"/>',
    columns:'<path d="M3 3v16a2 2 0 0 0 2 2h16"/><rect x="7" y="13" width="3" height="5" rx="1"/><rect x="15" y="5" width="3" height="13" rx="1"/><rect x="11" y="9" width="3" height="9" rx="1"/>',
    bird:'<path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/>'
  };
  function ic(n){ return '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICON[n] + '</svg>'; }

  /* ---------- calendar ---------- */
  var M0Y = 2026, M0M = 6, MN = 18, TODAY = 3;            // months run Jul 2026 → Dec 2027, today is Oct 2026
  var MS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function mDate(i){ return new Date(M0Y, M0M + i, 1); }
  function mShort(i){ return MS[mDate(i).getMonth()]; }
  function mLabel(i){ var d = mDate(i); return MS[d.getMonth()] + ' ' + d.getFullYear(); }
  var CAP = [];
  for (var ci = 0; ci < MN; ci++){
    var d0 = mDate(ci), mo = d0.getMonth(), n = 0;
    for (var day = new Date(d0); day.getMonth() === mo; day.setDate(day.getDate() + 1)){
      var w = day.getDay(); if (w && w < 6) n++;
    }
    CAP.push(n * 8);
  }

  /* ---------- sample data ---------- */
  var ROLES = [
    {id:'arch', name:'Architect'},
    {id:'eng',  name:'Building engineer'},
    {id:'int',  name:'Interior designer'},
    {id:'pm',   name:'Project manager'}
  ];
  var SEED = {
    seq: 100,
    people: [
      {id:'db', name:'Daria Belova', role:'arch', skills:['Revit','Facades','BIM'], hue:330, vac:{4:40}},
      {id:'og', name:'Oliver Grant', role:'arch', skills:['Revit','Masterplan'], hue:205},
      {id:'ms', name:'Mina Sato',    role:'arch', skills:['BIM','Facades','Rhino'], hue:150, vac:{6:80}},
      {id:'su', name:'Sam Ueda',     role:'eng',  skills:['Structures','HVAC'], hue:85},
      {id:'lf', name:'Lena Ford',    role:'eng',  skills:['Structures','Steel'], hue:30},
      {id:'ip', name:'Iris Park',    role:'int',  skills:['Lighting','Retail','3D'], hue:270, vac:{5:88}},
      {id:'th', name:'Tom Hale',     role:'int',  skills:['Residential','3D'], hue:180},
      {id:'nk', name:'Nora Klein',   role:'pm',   skills:['Agile','Budgeting'], hue:0},
      {id:'pr', name:'Paul Reyes',   role:'pm',   skills:['Procurement','Budgeting'], hue:240}
    ],
    projects: [
      {id:'rl', name:'Riverside Library', color:'#5B4CF0'},
      {id:'ho', name:'Harbor Offices', color:'#16968A'},
      {id:'mr', name:'Maple Residences', color:'#E0752B'},
      {id:'cs', name:'Central Station refit', color:'#D2448C'},
      {id:'fx', name:'Fixing issues', color:'#737A90'}
    ],
    bookings: [
      {id:'b1',  project:'rl', person:'db', role:'arch', start:2, end:7, pct:70},
      {id:'b2',  project:'ho', person:'db', role:'arch', start:3, end:5, pct:60},
      {id:'b3',  project:'mr', person:'og', role:'arch', start:1, end:4, pct:35},
      {id:'b4',  project:'fx', person:'og', role:'arch', start:5, end:8, pct:20},
      {id:'b5',  project:'ho', person:'ms', role:'arch', start:2, end:9, pct:90},
      {id:'b6',  project:'rl', person:'su', role:'eng',  start:2, end:6, pct:80},
      {id:'b7',  project:'mr', person:'su', role:'eng',  start:3, end:4, pct:50},
      {id:'b8',  project:'ho', person:'lf', role:'eng',  start:1, end:3, pct:60},
      {id:'b9',  project:'mr', person:'ip', role:'int',  start:2, end:6, pct:100},
      {id:'b10', project:'rl', person:'th', role:'int',  start:4, end:8, pct:40},
      {id:'b11', project:'rl', person:'nk', role:'pm',   start:1, end:9, pct:50},
      {id:'b12', project:'ho', person:'nk', role:'pm',   start:2, end:7, pct:50},
      {id:'b13', project:'mr', person:'pr', role:'pm',   start:3, end:8, pct:60},
      {id:'b14', project:'cs', person:null, role:'int',  start:4, end:7, pct:50, skills:['Retail','Lighting']}
    ]
  };
  var PALETTE = ['#2F7BE0','#8A4CE8','#0E9F6E','#C2410C','#B4387A','#4E5BD6'];

  /* ---------- state ---------- */
  var S = {
    live: clone(SEED), sim: null,
    tab: 'planning', view: 2, n: 6, col: 130,
    group: 'role', display: 'pct', show: 'all', wmode: 'booked', q: '',
    tog: {}, hist: [], guide: {}, guideMin: false
  };
  function D(){ return S.tab === 'simulation' ? S.sim : S.live; }
  function dataKey(){ return S.tab === 'simulation' ? 'sim' : 'live'; }

  function find(list, id){ for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function person(d, id){ return find(d.people, id); }
  function project(d, id){ return find(d.projects, id); }
  function booking(d, id){ return find(d.bookings, id); }
  function role(id){ return find(ROLES, id); }
  function initials(name){ return name.split(/\s+/).map(function(w){ return w[0]; }).join('').slice(0, 2).toUpperCase(); }
  function avatar(p, cls){
    if (!p) return '<span class="av q ' + (cls || '') + '">?</span>';
    return '<span class="av ' + (cls || '') + '" style="background:hsl(' + p.hue + ' 70% 92%);color:hsl(' + p.hue + ' 45% 38%)">' + initials(p.name) + '</span>';
  }
  function pbadge(pj){ return '<span class="pbadge" style="background:' + pj.color + '">' + esc(pj.name[0]) + '</span>'; }

  function hrs(b, m){ return Math.round(b.pct / 100 * CAP[m]); }
  function totalHrs(b){ var t = 0; for (var m = b.start; m <= b.end; m++) t += hrs(b, m); return t; }

  // Load of one person in one month; `bks` lets drafts be measured before they're applied
  function load(d, pid, m, bks){
    var p = person(d, pid), vac = (p && p.vac && p.vac[m]) || 0;
    var cap = CAP[m], avail = Math.max(cap - vac, 0), booked = 0, items = [];
    (bks || d.bookings).forEach(function(b){
      if (b.person === pid && m >= b.start && m <= b.end){ var h = hrs(b, m); booked += h; items.push({b:b, h:h}); }
    });
    return {cap:cap, vac:vac, avail:avail, booked:booked, items:items, pct: avail ? booked / avail * 100 : (booked ? 999 : 0)};
  }
  function st(l){
    if (!l.avail && !l.booked) return 'off';
    // healthy stays quiet; only real deviations get colour (under 50% = idle capacity worth acting on)
    return l.pct > 100.5 ? 'over' : l.pct >= 50 ? 'ok' : l.pct > 0 ? 'under' : 'free';
  }
  function visMonths(){ var a = []; for (var k = 0; k < S.n; k++) a.push(S.view + k); return a; }
  function overCount(d){
    var c = 0;
    d.people.forEach(function(p){ for (var m = 0; m < MN; m++) if (st(load(d, p.id, m)) === 'over') c++; });
    return c;
  }

  function isOpen(k){
    if (k in S.tog) return S.tog[k];
    if (k.charAt(0) === 'p') return k === 'p:db' || k === 'p:su' || k === 'w:db';
    if (k.charAt(0) === 'w') return k === 'w:db' || k === 'w:nk';
    return true;
  }

  /* ---------- history ---------- */
  function snapshot(){ return {key:dataKey(), json:JSON.stringify(D())}; }
  function pushHist(snap){ S.hist.push(snap); if (S.hist.length > 40) S.hist.shift(); }
  function commit(msg, fn){
    var snap = snapshot();
    fn(D());
    pushHist(snap);
    render();
    toast(msg, true);
  }
  function undo(){
    var h = S.hist.pop();
    if (!h){ toast('Nothing to undo'); return; }
    S[h.key] = JSON.parse(h.json);
    if (h.key === 'sim' && S.tab !== 'simulation'){ S.tab = 'simulation'; }
    closeAll();
    render();
    toast('Undone');
  }

  /* ---------- layout ---------- */
  var grid = $('#grid');
  function measure(){
    var w = grid.clientWidth;
    var nameW = w < 640 ? 170 : w < 1000 ? 260 : 320;
    var avail = w - nameW;
    var n = clamp(Math.floor(avail / 128), 2, 9);
    S.n = n; S.col = Math.floor(avail / n);
    S.view = clamp(S.view, 0, MN - n);
    root.style.setProperty('--name-w', nameW + 'px');
    root.style.setProperty('--col', S.col + 'px');
    root.style.setProperty('--n', n);
  }
  function xOf(m){ return (m - S.view) * S.col; }
  function todayCol(){
    if (TODAY < S.view || TODAY >= S.view + S.n) return '';
    return '<i class="tcol" style="left:' + xOf(TODAY) + 'px;width:' + S.col + 'px"></i>';
  }
  function row(cls, name, track, attrs){
    return '<div class="row ' + cls + '"' + (attrs || '') + '><div class="g-name">' + name + '</div><div class="g-track">' + todayCol() + track + '</div></div>';
  }
  function tw(k, blank){
    if (blank) return '<span class="tw blank"></span>';
    return '<button type="button" class="tw' + (isOpen(k) ? '' : ' closed') + '" data-action="toggle" data-k="' + k + '" aria-label="Expand or collapse">' + ic('chevD') + '</button>';
  }
  function headRow(label, extra){
    var h = '<div class="g-head"><div class="g-name">' +
      '<button type="button" class="hd-btn" data-action="collapse-all" title="Collapse all">' + ic('collapse') + '</button>' +
      '<button type="button" class="hd-btn" data-action="expand-all" title="Expand all">' + ic('expand') + '</button>' +
      '<span class="txt" style="padding-left:4px">' + label + '</span>' + (extra || '') + '</div><div class="g-track">';
    visMonths().forEach(function(m){
      h += '<div class="mh' + (m === TODAY ? ' today' : '') + '" style="left:' + xOf(m) + 'px;width:' + S.col + 'px">' + mLabel(m) + '</div>';
    });
    return h + '</div></div>';
  }

  /* ---------- filters ---------- */
  function personVisible(d, p){
    if (S.q && p.name.toLowerCase().indexOf(S.q.toLowerCase()) < 0) return false;
    if (S.show === 'all') return true;
    return visMonths().some(function(m){
      var s = st(load(d, p.id, m));
      return S.show === 'over' ? s === 'over' : (s === 'under' || s === 'free');
    });
  }

  /* ---------- planning view ---------- */
  function cellHtml(d, p, m){
    var l = load(d, p.id, m), s = st(l), main, sub;
    if (S.display === 'pct'){
      main = l.avail ? Math.round(l.pct) + '%' : '—';
      var diff = l.avail - l.booked;
      sub = s === 'over' ? (-diff) + 'h over' : s === 'off' ? 'Day off' : diff > 0 ? diff + 'h free' : 'Full';
    } else {
      main = l.booked + 'h'; sub = 'of ' + l.avail + 'h';
    }
    var chg = '';
    if (S.tab === 'simulation'){
      var lv = person(S.live, p.id) ? load(S.live, p.id, m) : null;
      if (!lv || lv.booked !== l.booked) chg = ' chg';
    }
    var fill = l.avail ? Math.min(l.pct, 100) : 0;
    return '<button type="button" class="cell st-' + s + chg + '" data-action="cell" data-p="' + p.id + '" data-m="' + m + '" style="left:' + (xOf(m) + 4) + 'px;width:' + (S.col - 8) + 'px">' +
      '<span class="top"><span class="v">' + main + '</span><small>' + sub + '</small></span><span class="cb"><i style="width:' + fill + '%"></i></span></button>';
  }
  function barHtml(d, b){
    var pj = project(d, b.project);
    var left = xOf(b.start) + 4, width = (b.end - b.start + 1) * S.col - 8;
    var pad = left < 0 ? (-left + 10) : 10;
    var label = b.person ? b.pct + '% (' + totalHrs(b) + 'h)' : 'Unassigned · ' + b.pct + '% (' + totalHrs(b) + 'h)';
    var tent = S.tab === 'simulation' && !project(S.live, b.project);
    return '<div class="bar' + (b.person ? '' : ' req') + (tent ? ' tent' : '') + (drag && drag.id === b.id ? ' drag' : '') + '" data-b="' + b.id + '" style="left:' + left + 'px;width:' + width + 'px;--pc:' + pj.color + ';padding-left:' + pad + 'px" title="' + esc(pj.name) + ' · ' + mLabel(b.start) + ' – ' + mLabel(b.end) + '">' +
      '<span class="h l" data-h="l"></span><span class="bl">' + label + '</span><span class="h r" data-h="r"></span></div>';
  }
  function personRows(d, p){
    var k = 'p:' + p.id, open = isOpen(k), r = role(p.role);
    var name = tw(k) + avatar(p) + '<span class="txt"><b>' + esc(p.name) + '</b><small>' + r.name + '</small></span>' +
      '<button type="button" class="hd-btn row-act" data-action="book" data-p="' + p.id + '" title="Book on a project">' + ic('plus') + '</button>';
    var h = row('person', name, visMonths().map(function(m){ return cellHtml(d, p, m); }).join(''), ' data-p="' + p.id + '"');
    if (!open) return h;
    if (p.vac){
      var chips = '';
      Object.keys(p.vac).forEach(function(m){
        m = +m; if (m < S.view || m >= S.view + S.n) return;
        chips += '<span class="vchip" style="left:' + (xOf(m) + 10) + 'px">' + ic('plane') + p.vac[m] + 'h</span>';
      });
      h += row('vac', ic('plane') + '<span class="txt">Vacation</span>', chips);
    }
    d.bookings.filter(function(b){ return b.person === p.id; })
      .sort(function(a, b){ return a.start - b.start; })
      .forEach(function(b){
        var pj = project(d, b.project);
        h += row('booking', pbadge(pj) + '<span class="txt"><b>' + esc(pj.name) + '</b></span>', barHtml(d, b), ' data-p="' + p.id + '" data-j="' + b.project + '"');
      });
    return h;
  }
  function requestRow(d, b){
    var pj = project(d, b.project);
    var name = avatar(null) + '<span class="txt"><b>' + esc(pj.name) + '</b><small>Needs ' + role(b.role).name.toLowerCase() + ' · ' + mShort(b.start) + '–' + mShort(b.end) + '</small></span>' +
      '<button type="button" class="btn-p sm" data-action="shortlist" data-b="' + b.id + '">' + ic('userSearch') + 'Find people</button>';
    return row('req-row', name, barHtml(d, b));
  }
  function roleRows(d){
    var h = '', any = false;
    ROLES.forEach(function(r){
      var people = d.people.filter(function(p){ return p.role === r.id; });
      var vis = people.filter(function(p){ return personVisible(d, p); });
      var reqs = (!S.q && S.show === 'all') ? d.bookings.filter(function(b){ return !b.person && b.role === r.id; }) : [];
      if (!vis.length && !reqs.length) return;
      any = true;
      var k = 'r:' + r.id;
      var cells = visMonths().map(function(m){
        var bk = 0, av = 0;
        people.forEach(function(p){ var l = load(d, p.id, m); bk += l.booked; av += l.avail; });
        var pct = av ? Math.round(bk / av * 100) : 0;
        var s = st({avail:av, booked:bk, pct:pct});
        return '<div class="rcell st-' + s + '" style="left:' + (xOf(m) + 4) + 'px;width:' + (S.col - 8) + 'px"><span>' + pct + '% team</span><i style="width:' + Math.min(pct, 100) + '%"></i></div>';
      }).join('');
      h += row('role', tw(k) + '<span class="role-ic">' + ic('briefcase') + '</span><span class="txt"><b>' + r.name + '</b><small>' + ic('user') + people.length + (reqs.length ? ' · <span style="color:#A07A12">' + reqs.length + ' open request</span>' : '') + '</small></span>', cells);
      if (!isOpen(k)) return;
      reqs.forEach(function(b){ h += requestRow(d, b); });
      vis.forEach(function(p){ h += personRows(d, p); });
    });
    return any ? h : '<div class="empty">No people match these filters.</div>';
  }
  function projectRows(d){
    var h = '', any = false;
    d.projects.forEach(function(pj){
      var bks = d.bookings.filter(function(b){
        if (b.project !== pj.id) return false;
        if (!b.person) return !S.q && S.show === 'all';
        return personVisible(d, person(d, b.person));
      });
      if (!bks.length) return;
      any = true;
      var k = 'j:' + pj.id;
      var ppl = {}; bks.forEach(function(b){ if (b.person) ppl[b.person] = 1; });
      var cells = visMonths().map(function(m){
        var t = 0; bks.forEach(function(b){ if (m >= b.start && m <= b.end) t += hrs(b, m); });
        return '<div class="pcell" style="left:' + xOf(m) + 'px;width:' + S.col + 'px">' + (t ? t + 'h' : '') + '</div>';
      }).join('');
      h += row('proj', tw(k) + pbadge(pj) + '<span class="txt"><b>' + esc(pj.name) + '</b><small>' + ic('user') + Object.keys(ppl).length + ' people</small></span>', cells);
      if (!isOpen(k)) return;
      bks.sort(function(a, b){ return a.start - b.start; }).forEach(function(b){
        var p = b.person ? person(d, b.person) : null;
        var name = avatar(p, 'sm') + '<span class="txt"><b>' + (p ? esc(p.name) : 'Unassigned') + '</b><small>' + role(b.role).name + '</small></span>' +
          (p ? '' : '<button type="button" class="btn-p sm" data-action="shortlist" data-b="' + b.id + '">Find people</button>');
        h += row('booking proj-b', name, barHtml(d, b), p ? ' data-p="' + p.id + '" data-j="' + b.project + '"' : '');
      });
    });
    return any ? h : '<div class="empty">No projects match these filters.</div>';
  }
  function renderPlanning(){
    var d = D();
    var label = S.group === 'role' ? 'Roles, resources and projects' : 'Projects and resources';
    grid.innerHTML = headRow(label) + (S.group === 'role' ? roleRows(d) : projectRows(d));
  }

  /* ---------- workload view ---------- */
  function fmtH(h){ return h + 'h'; }
  function renderWorkload(){
    var d = live(), h = headRow('People and projects', '<span class="wl-col" style="color:var(--muted);font-size:12px">Workload %</span>'), any = false;
    d.people.forEach(function(p){
      if (!personVisible(d, p)) return;
      any = true;
      var k = 'w:' + p.id, ms = visMonths(), bk = 0, av = 0;
      ms.forEach(function(m){ var l = load(d, p.id, m); bk += l.booked; av += l.avail; });
      var avgPct = av ? bk / av * 100 : 0, s = st({avail:av, booked:bk, pct:avgPct});
      var cells = ms.map(function(m){
        var l = load(d, p.id, m), v = S.wmode === 'booked' ? l.booked : l.avail - l.booked;
        return '<div class="wcell st-' + st(l) + '" style="left:' + xOf(m) + 'px;width:' + S.col + 'px">' + fmtH(v) + '</div>';
      }).join('');
      h += row('wl-p', tw(k) + avatar(p, 'sm') + '<span class="txt"><b>' + esc(p.name) + '</b></span><span class="wl-col pill st-' + s + '" style="justify-content:flex-end">' + avgPct.toFixed(1) + '%</span>', cells);
      if (!isOpen(k)) return;
      var byProj = {};
      d.bookings.forEach(function(b){ if (b.person === p.id) (byProj[b.project] = byProj[b.project] || []).push(b); });
      Object.keys(byProj).forEach(function(pid){
        var pj = project(d, pid), list = byProj[pid], tot = 0;
        var chips = ms.map(function(m){
          var t = 0; list.forEach(function(b){ if (m >= b.start && m <= b.end) t += hrs(b, m); });
          tot += t;
          return t ? '<div class="wchip" style="left:' + (xOf(m) + 3) + 'px;width:' + (S.col - 6) + 'px">' + fmtH(t) + '</div>' : '';
        }).join('');
        h += row('wl-j', pbadge(pj) + '<span class="txt"><b>' + esc(pj.name) + '</b></span><span class="wl-col">' + fmtH(tot) + '</span>', chips);
      });
    });
    grid.innerHTML = any ? h : h + '<div class="empty">No people match these filters.</div>';
  }
  function live(){ return S.live; }

  function exportCsv(){
    var d = live(), lines = [['Person', 'Role', 'Project'].concat(Array.from({length:MN}, function(_, m){ return mLabel(m); }))];
    d.bookings.forEach(function(b){
      var p = b.person ? person(d, b.person) : null;
      var line = [p ? p.name : 'Unassigned', role(b.role).name, project(d, b.project).name];
      for (var m = 0; m < MN; m++) line.push(m >= b.start && m <= b.end ? hrs(b, m) : '');
      lines.push(line);
    });
    var csv = lines.map(function(l){ return l.map(function(v){ return '"' + String(v).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
    a.download = 'birdview-workload.csv';
    document.body.appendChild(a); a.click(); a.remove();
    toast('Exported birdview-workload.csv');
  }

  /* ---------- chrome ---------- */
  function renderSidebar(){
    function it(icon, label, on){ return '<button type="button" class="sb-item' + (on ? ' on' : '') + '" data-action="nav" title="' + label + '">' + ic(icon) + '<span class="lbl">' + label + '</span></button>'; }
    $('#sidebar').innerHTML =
      '<div class="sb-brand"><span class="sb-logo"><span class="sb-mark">' + ic('bird') + '</span><span class="lbl">birdview</span></span><button type="button" class="hd-btn sb-tg" data-action="sb-toggle" title="Collapse sidebar">' + ic('panel') + '</button></div>' +
      it('search', 'Global search') + '<div class="sb-sep"></div>' +
      it('history', 'Time log history') + it('users', 'Resources', true) + it('reports', 'Reports') + it('gauge', 'Dashboard') + it('pie', 'Business Intelligence') +
      '<div class="sb-sep"></div><div class="sb-space"><span class="sq">S</span><span class="lbl">First space</span></div>' +
      it('folder', 'Projects') + it('form', 'Custom forms') +
      '<div class="sb-label">Saved views ' + ic('chevD') + '</div>' + it('table', 'Default view') +
      '<div class="sb-grow"></div>' +
      '<div class="sb-trial">Trial ends in 11 days<button type="button" class="btn-p" data-action="nav">' + ic('rocket') + 'Upgrade now</button></div>' +
      '<div class="sb-user"><span class="av sm" style="background:#DDF5E6;color:#2C7A4B">MD</span><span class="lbl">Maria Demenko</span></div>';
    $('#topIcons').innerHTML = ['bell', 'tasks', 'timer', 'chat'].map(function(n){ return '<button type="button" class="icon-btn" data-action="nav">' + ic(n) + '</button>'; }).join('');
  }
  var TAB_IC = {planning:'gantt', workload:'columns', simulation:'flask'};
  function renderTabs(){
    function t(id, label){
      return '<button type="button" class="tab' + (S.tab === id ? ' on' : '') + '" data-action="tab" data-tab="' + id + '">' + ic(TAB_IC[id]) + label + (id === 'simulation' && S.sim && simChanges() ? '<span class="dot"></span>' : '') + '</button>';
    }
    $('#tabs').innerHTML = t('planning', 'Planning') + t('workload', 'Workload') + t('simulation', 'Simulation') +
      '<span class="grow"></span><button type="button" class="fb" data-action="nav">' + ic('feedback') + 'Leave feedback</button>';
  }
  var LABELS = {
    group: {role:'Job role', project:'Project'},
    show: {all:'All', over:'Overloaded', free:'Has free time'}
  };
  function renderToolbar(){
    var h = '<button type="button" class="tb-btn icon" data-action="prev" title="Previous month">' + ic('chevL') + '</button>' +
      '<button type="button" class="tb-btn" data-action="today">Today</button>' +
      '<button type="button" class="tb-btn icon" data-action="next" title="Next month">' + ic('chevR') + '</button>' +
      '<span class="tb-range" id="tbRange">' + mLabel(S.view) + ' – ' + mLabel(S.view + S.n - 1) + '</span><span class="tb-grow"></span>' +
      '<label class="tb-search">' + ic('search') + '<input id="q" type="text" placeholder="Search people" value="' + esc(S.q) + '" autocomplete="off"></label>';
    if (S.tab !== 'workload'){
      h += '<button type="button" class="tb-btn" data-action="menu" data-menu="group">' + ic('group') + 'Group by: <b>' + LABELS.group[S.group] + '</b></button>';
    }
    h += '<button type="button" class="tb-btn" data-action="menu" data-menu="show">' + ic('eye') + 'Show: <b>' + LABELS.show[S.show] + '</b></button>';
    if (S.tab === 'workload'){
      h += '<span class="seg"><button type="button" class="' + (S.wmode === 'booked' ? 'on' : '') + '" data-action="set" data-key="wmode" data-val="booked">Booked hours</button><button type="button" class="' + (S.wmode === 'left' ? 'on' : '') + '" data-action="set" data-key="wmode" data-val="left">Hours left</button></span>' +
        '<button type="button" class="tb-btn" data-action="export">' + ic('download') + 'Export to Excel</button>';
    } else {
      h += '<span class="seg"><button type="button" class="' + (S.display === 'pct' ? 'on' : '') + '" data-action="set" data-key="display" data-val="pct">%</button><button type="button" class="' + (S.display === 'hours' ? 'on' : '') + '" data-action="set" data-key="display" data-val="hours">Hours</button></span>';
    }
    $('#toolbar').innerHTML = h;
  }
  function simChanges(){
    if (!S.sim) return 0;
    var a = {}, c = 0;
    S.live.bookings.forEach(function(b){ a[b.id] = JSON.stringify(b); });
    S.sim.bookings.forEach(function(b){ if (a[b.id] !== JSON.stringify(b)) c++; delete a[b.id]; });
    return c + Object.keys(a).length;
  }
  // free hours of everyone in the months on screen — the "idle capacity" the sandbox tries to use up
  function idleHours(d){
    var t = 0;
    d.people.forEach(function(p){ visMonths().forEach(function(m){ var l = load(d, p.id, m); t += Math.max(l.avail - l.booked, 0); }); });
    return t;
  }
  function renderSimBanner(){
    var el = $('#simBanner');
    if (S.tab !== 'simulation'){ el.hidden = true; return; }
    var ch = simChanges(), o1 = overCount(S.live), o2 = overCount(S.sim), i1 = idleHours(S.live), i2 = idleHours(S.sim);
    var tent = S.sim.projects.filter(function(pj){ return !project(S.live, pj.id); });
    var title = tent.length ? 'What if we win ' + esc(tent[tent.length - 1].name) + '?' : 'What if…? Try changes safely';
    function delta(a, b, lowerIsGood, unit){
      var cls = a === b ? '' : (b < a) === lowerIsGood ? 'good' : 'bad';
      return '<b>' + a + unit + '</b> → <span class="' + cls + '">' + b + unit + '</span>';
    }
    el.hidden = false;
    el.innerHTML = '<span class="sim-ic">' + ic('flask') + '</span>' +
      '<span class="sim-t"><b>' + title + '</b><small>Sandbox — nothing reaches the live plan until you apply it</small></span>' +
      '<span class="sim-k"><small>Overloaded</small><span>' + delta(o1, o2, true, '') + ' person-months</span></span>' +
      '<span class="sim-k"><small>Idle hours</small><span>' + delta(i1, i2, true, 'h') + '</span></span>' +
      '<span class="grow"></span>' +
      '<button type="button" class="btn-s sm" data-action="new-project">' + ic('plus') + 'Tentative project</button>' +
      '<button type="button" class="btn-s sm" data-action="sim-discard"' + (ch ? '' : ' disabled') + '>Discard</button>' +
      '<button type="button" class="btn-p sm" data-action="sim-apply"' + (ch ? '' : ' disabled') + '>' + (ch ? 'Apply ' + ch + ' change' + (ch > 1 ? 's' : '') : 'Apply to plan') + '</button>';
  }

  /* "Needs attention" — turns scanning for red into a short queue */
  function attnStats(d){
    var ms = visMonths(), overP = {}, overPM = 0, under = 0, idle = 0;
    d.people.forEach(function(p){
      var bk = 0, av = 0;
      ms.forEach(function(m){ var l = load(d, p.id, m); if (st(l) === 'over'){ overP[p.id] = 1; overPM++; } bk += l.booked; av += l.avail; });
      if (av && bk / av < 0.5){ under++; idle += av - bk; }
    });
    return {over:Object.keys(overP).length, overPM:overPM, under:under, idle:idle, reqs:d.bookings.filter(function(b){ return !b.person; })};
  }
  function renderAttn(){
    var el = $('#attn');
    if (S.tab === 'workload'){ el.hidden = true; return; }
    el.hidden = false;
    var a = attnStats(D()), h = '<span class="attn-l">Needs attention</span>';
    h += a.over
      ? '<button type="button" class="achip over' + (S.show === 'over' ? ' on' : '') + '" data-action="attn" data-k="over"><i></i><b>' + a.over + ' overloaded</b><span>· ' + a.overPM + ' person-month' + (a.overPM > 1 ? 's' : '') + '</span></button>'
      : '<span class="achip good">' + ic('check') + '<b>No overloads in view</b></span>';
    if (a.reqs.length){
      var pj = project(D(), a.reqs[0].project);
      h += '<button type="button" class="achip req" data-action="attn" data-k="req"><i></i><b>' + a.reqs.length + ' open role' + (a.reqs.length > 1 ? 's' : '') + '</b><span>· ' + esc(pj.name) + '</span></button>';
    }
    if (a.under) h += '<button type="button" class="achip under' + (S.show === 'free' ? ' on' : '') + '" data-action="attn" data-k="under"><i></i><b>' + a.under + ' under 50%</b><span>· ' + a.idle + 'h idle</span></button>';
    if (S.show !== 'all') h += '<button type="button" class="attn-clear" data-action="attn" data-k="clear">' + ic('x') + 'Show everyone</button>';
    el.innerHTML = h;
  }

  function renderGrid(){
    if (S.tab === 'workload') renderWorkload(); else renderPlanning();
    renderAttn(); renderSimBanner();
    var r = $('#tbRange'); if (r) r.textContent = mLabel(S.view) + ' – ' + mLabel(S.view + S.n - 1);
  }
  function render(){
    measure();
    renderTabs();
    renderToolbar();
    renderSimBanner();
    renderGrid();
    renderGuide();
  }

  /* ---------- layer: popover, menu, drawer, modal, toast ---------- */
  var layer = $('#layer'), popEl = null, popClose = null, panelEl = null;
  function closePop(){
    if (popEl){ popEl.remove(); popEl = null; var f = popClose; popClose = null; if (f) f(); }
  }
  function openPop(html, anchor, cls, onClose){
    closePop();
    popEl = document.createElement('div');
    popEl.className = 'pop ' + (cls || '');
    popEl.innerHTML = html;
    layer.appendChild(popEl);
    popClose = onClose || null;
    var r = anchor.getBoundingClientRect(), pw = popEl.offsetWidth, ph = popEl.offsetHeight;
    var x = clamp(r.left, 8, window.innerWidth - pw - 8);
    var y = r.bottom + 6;
    if (y + ph > window.innerHeight - 8) y = Math.max(8, r.top - ph - 6);
    popEl.style.left = x + 'px'; popEl.style.top = y + 'px';
    return popEl;
  }
  function closePanel(){
    if (panelEl){ panelEl.forEach(function(e){ e.remove(); }); panelEl = null; }
    var g = grid.querySelector('.paint'); if (g) g.remove();
  }
  function openPanel(cls, html){
    closePop(); closePanel();
    var scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.setAttribute('data-action', 'close');
    var el = document.createElement('div'); el.className = cls; el.innerHTML = html;
    layer.appendChild(scrim); layer.appendChild(el);
    panelEl = [scrim, el];
    return el;
  }
  function closeAll(){ closePop(); closePanel(); }
  var toastT;
  function toast(msg, withUndo){
    var old = $('.toast'); if (old) old.remove();
    var el = document.createElement('div'); el.className = 'toast';
    el.innerHTML = '<span>' + msg + '</span>' + (withUndo ? '<button type="button" data-action="undo">Undo</button>' : '');
    document.body.appendChild(el);
    clearTimeout(toastT); toastT = setTimeout(function(){ el.remove(); }, 5000);
  }
  function monthOptions(sel, from){
    var h = '';
    for (var m = from || 0; m < MN; m++) h += '<option value="' + m + '"' + (m === sel ? ' selected' : '') + '>' + mLabel(m) + '</option>';
    return h;
  }

  /* cell popover */
  function openCellPop(el){
    var d = D(), p = person(d, el.dataset.p), m = +el.dataset.m, l = load(d, p.id, m), s = st(l);
    var fill = Math.min(l.pct, 150) / 150 * 100, capX = 100 / 150 * 100;
    var color = {ok:'var(--ok-bd)', under:'var(--un-bd)', over:'var(--ov-bd)', free:'var(--fr-bd)', off:'var(--fr-bd)'}[s];
    var list = l.items.map(function(it){
      var pj = project(d, it.b.project);
      return '<li>' + pbadge(pj) + '<span>' + esc(pj.name) + '</span><em>' + it.h + 'h · ' + it.b.pct + '%</em></li>';
    }).join('');
    var free = l.avail - l.booked, hint = '';
    if (s === 'over'){
      var mate = null;
      d.people.forEach(function(c){
        if (c.role !== p.role || c.id === p.id) return;
        var lc = load(d, c.id, m), fc = lc.avail - lc.booked;
        if (fc > 0 && (!mate || fc > mate.f)) mate = {c:c, f:fc};
      });
      hint = '<span class="pop-hint">' + (mate ? esc(mate.c.name) + ' has ' + mate.f + 'h free' : 'No free ' + role(p.role).name.toLowerCase() + ' this month') + '</span>';
    }
    var foot = s === 'over'
      ? hint + '<button type="button" class="btn-p" data-action="resolve" data-p="' + p.id + '" data-m="' + m + '">' + ic('spark') + 'Resolve</button>'
      : free > 0 ? '<button type="button" class="btn-p" data-action="book" data-p="' + p.id + '" data-m="' + m + '">' + ic('plus') + 'Book ' + free + 'h</button>' : '';
    openPop(
      '<div class="pop-h">' + avatar(p) + '<span class="txt"><b>' + esc(p.name) + '</b><small>' + mLabel(m) + ' · ' + role(p.role).name + '</small></span><span class="pill st-' + s + '">' + (l.avail ? Math.round(l.pct) + '%' : '—') + '</span></div>' +
      '<div class="meter"><i style="width:' + fill + '%;background:' + color + '"></i><span class="cap" style="left:' + capX + '%"></span></div>' +
      '<p><b>' + l.booked + 'h</b> booked of <b>' + l.avail + 'h</b> available' + (l.vac ? ' (' + l.cap + 'h − ' + l.vac + 'h vacation)' : '') + '.' +
      (s === 'over' ? ' <span style="color:var(--ov-tx)">' + (-free) + 'h over capacity.</span>' : '') + '</p>' +
      (list ? '<ul class="plist">' + list + '</ul>' : '<p>No bookings this month.</p>') +
      '<div class="pop-f">' + foot + '</div>', el);
  }

  /* booking editor popover */
  function openBarPop(b, anchor){
    var d = D(), pj = project(d, b.project), p = b.person ? person(d, b.person) : null;
    var snap = snapshot(), before = JSON.stringify(b);
    var el = openPop(
      '<div class="pop-h">' + pbadge(pj) + '<span class="txt"><b>' + esc(pj.name) + '</b><small>' + (p ? esc(p.name) : 'Unassigned') + ' · ' + role(b.role).name + '</small></span></div>' +
      '<label class="fld"><span>Allocation <output id="bpPct">' + b.pct + '%</output></span><input type="range" min="5" max="100" step="5" value="' + b.pct + '" data-live="pct"></label>' +
      '<div class="two"><label class="fld"><span>From</span><select data-live="start">' + monthOptions(b.start) + '</select></label>' +
      '<label class="fld"><span>To</span><select data-live="end">' + monthOptions(b.end) + '</select></label></div>' +
      '<p id="bpSum"></p>' +
      '<div class="pop-f"><button type="button" class="btn-s danger" data-action="bk-remove" data-b="' + b.id + '">Remove</button><span class="grow"></span>' +
      '<button type="button" class="btn-s" data-action="shortlist" data-b="' + b.id + '">' + ic('swap') + (p ? 'Reassign' : 'Find people') + '</button>' +
      '<button type="button" class="btn-p" data-action="pop-done">Done</button></div>', anchor, '',
      function(){
        var cur = booking(D(), b.id);
        if (cur && JSON.stringify(cur) !== before){ pushHist(snap); toast('Booking updated', true); renderTabs(); renderSimBanner(); }
      });
    function sum(){
      $('#bpSum', el).innerHTML = mLabel(b.start) + ' – ' + mLabel(b.end) + ' · <b>' + totalHrs(b) + 'h</b> in total, ≈' + Math.round(totalHrs(b) / (b.end - b.start + 1)) + 'h a month';
    }
    sum();
    el.addEventListener('input', function(e){
      var k = e.target.dataset.live; if (!k) return;
      var v = +e.target.value;
      if (k === 'pct'){ b.pct = v; $('#bpPct', el).textContent = v + '%'; }
      if (k === 'start'){ b.start = v; if (b.end < v){ b.end = v; $('[data-live=end]', el).value = v; } }
      if (k === 'end'){ b.end = v; if (b.start > v){ b.start = v; $('[data-live=start]', el).value = v; } }
      sum(); renderGrid();
    });
  }

  /* conflict resolution drawer: pick an outcome, see who it lands on, tweak by hand if needed */
  function openResolve(pid, focusM){
    var d = D(), p = person(d, pid);
    var overM = [];
    for (var m = 0; m < MN; m++) if (st(load(d, pid, m)) === 'over') overM.push(m);
    var involvedIds = d.bookings.filter(function(b){
      return b.person === pid && overM.some(function(m){ return m >= b.start && m <= b.end; });
    }).map(function(b){ return b.id; });
    var orig = d.bookings.map(function(b){ return find(d.bookings, b.id); });
    var from = Math.min.apply(null, overM), to = Math.max.apply(null, overM);
    from = Math.max(0, from - 1); to = Math.min(MN - 1, to + 1);
    if (to - from > 6) to = from + 6;
    var span = []; for (var mm = from; mm <= to; mm++) span.push(mm);
    var cols = 'grid-template-columns:repeat(' + span.length + ',1fr)';
    var first = p.name.split(' ')[0];

    function overMonths(who, dr, a, b){ var c = 0; for (var m = (a || 0); m <= (b === undefined ? MN - 1 : b); m++) if (st(load(d, who, m, dr)) === 'over') c++; return c; }
    function peak(who, dr, a, b){ var x = 0; for (var m = a; m <= b; m++){ var l = load(d, who, m, dr); if (l.avail) x = Math.max(x, l.pct); } return Math.round(x); }
    function fits(dr){ return !overMonths(pid, dr) && dr.every(function(b){ return !b.person || b.person === pid || involvedIds.indexOf(b.id) < 0 || !overMonths(b.person, dr, b.start, b.end); }); }

    // build the candidate outcomes from the live data
    var opts = [];
    involvedIds.map(function(id){ return booking(d, id); }).sort(function(a, b){ return a.pct - b.pct; }).forEach(function(b){
      if (opts.length) return;
      var best = null;
      d.people.filter(function(c){ return c.role === b.role && c.id !== pid; }).forEach(function(c){
        var dr = clone(d.bookings); find(dr, b.id).person = c.id;
        if (!fits(dr)) return;
        var pk = peak(c.id, dr, b.start, b.end);
        if (!best || pk < best.pk) best = {c:c, dr:dr, pk:pk};
      });
      if (!best) return;
      var pj = project(d, b.project), cb = peak(best.c.id, d.bookings, b.start, b.end);
      opts.push({id:'move', title:'Move ' + esc(pj.name) + ' to ' + esc(best.c.name), tag:'Recommended',
        desc:'Same role, only ' + cb + '% busy in ' + mShort(b.start) + '–' + mShort(b.end) + '. Nobody goes over capacity and every project keeps its dates.',
        draft:best.dr, who:[pid, best.c.id], a:b.start, b:b.end});
    });
    (function(){ // lower everything proportionally
      var dr = clone(d.bookings), factor = 1;
      for (var m = 0; m < MN; m++){ var l = load(d, pid, m, dr); if (l.pct > 100.5) factor = Math.min(factor, l.avail / l.booked); }
      var parts = [], lost = 0;
      involvedIds.forEach(function(id){
        var b = find(dr, id), was = b.pct, before = totalHrs(b);
        b.pct = Math.max(5, Math.floor(b.pct * factor / 5) * 5);
        lost += before - totalHrs(b);
        parts.push(esc(project(d, b.project).name.split(' ')[0]) + ' ' + was + ' → ' + b.pct + '%');
      });
      if (fits(dr)) opts.push({id:'lower', title:'Lower ' + (involvedIds.length > 1 ? 'both allocations' : 'the allocation'), cost:'slows delivery',
        desc:parts.join(', ') + '. Fits, but the projects lose ' + lost + 'h of ' + first + '’s time.', draft:dr, who:[pid]});
    })();
    (function(){ // push the latest-starting booking until the overlap is gone
      var ids = involvedIds.slice().sort(function(a, b){ return booking(d, b).start - booking(d, a).start; });
      var b0 = booking(d, ids[0]);
      for (var k = 1; k <= 8 && b0.end + k < MN; k++){
        var dr = clone(d.bookings), b = find(dr, b0.id); b.start += k; b.end += k;
        if (fits(dr)){
          opts.push({id:'shift', title:'Start ' + esc(project(d, b0.project).name) + ' in ' + mShort(b.start), cost:'moves a client date',
            desc:first + ' is free from ' + mShort(b.start) + '. The project finishes ' + k + ' month' + (k > 1 ? 's' : '') + ' later, in ' + mLabel(b.end) + '.', draft:dr, who:[pid]});
          return;
        }
      }
    })();

    var sel = opts.length ? opts[0].id : 'manual';
    var manual = clone(opts.length ? opts[0].draft : d.bookings), manOpen = !opts.length;
    function cur(){ if (sel === 'manual') return manual; for (var i = 0; i < opts.length; i++) if (opts[i].id === sel) return opts[i].draft; return d.bookings; }

    function whoChips(o){
      return (o.who || []).map(function(id){
        var x = person(d, id), a = o.a === undefined ? from : o.a, b = o.b === undefined ? to : o.b;
        var p0 = peak(id, d.bookings, a, b), p1 = peak(id, o.draft, a, b);
        return '<span class="who">' + avatar(x, 'xs') + '<span>' + esc(x.name.split(' ')[0]) + '</span><s class="' + (p0 > 100 ? 'ov' : p0 < 50 ? 'un' : '') + '">' + p0 + '%</s><b class="' + (p1 > 100 ? 'ov' : 'ok') + '">' + p1 + '%</b></span>';
      }).join('');
    }
    function optHtml(o){
      return '<button type="button" class="opt' + (sel === o.id ? ' on' : '') + '" data-action="rs-opt" data-o="' + o.id + '"><span class="radio"></span><span class="opt-b">' +
        '<span class="opt-t"><b>' + o.title + '</b>' + (o.tag ? '<span class="tag">' + o.tag + '</span>' : '<em>' + o.cost + '</em>') + '</span>' +
        '<span class="opt-d">' + o.desc + '</span>' + (sel === o.id && o.who.length > 1 ? '<span class="opt-p">' + whoChips(o) + '</span>' : '') + '</span></button>';
    }
    function manualHtml(){
      return manual.filter(function(b){ return involvedIds.indexOf(b.id) >= 0; }).map(function(b){
        var pj = project(d, b.project);
        var others = d.people.filter(function(c){ return c.role === b.role && c.id !== pid; });
        var sel2 = '<option value="' + pid + '">Keep on ' + esc(p.name) + '</option>' + others.map(function(c){
          return '<option value="' + c.id + '"' + (b.person === c.id ? ' selected' : '') + '>Move to ' + esc(c.name) + '</option>';
        }).join('');
        return '<div class="card"><div class="card-h">' + pbadge(pj) + '<b>' + esc(pj.name) + '</b><em>' + mShort(b.start) + ' – ' + mLabel(b.end) + '</em></div>' +
          '<label class="fld"><span>Allocation <output data-out="' + b.id + '">' + b.pct + '%</output></span><input type="range" min="0" max="100" step="5" value="' + b.pct + '" data-rs-pct="' + b.id + '"></label>' +
          '<label class="fld" style="margin:0"><select data-rs-who="' + b.id + '">' + sel2 + '</select></label></div>';
      }).join('');
    }

    var el = openPanel('drawer rs',
      '<div class="dr-h">' + avatar(p, 'lg') + '<span class="txt"><h2>Resolve ' + esc(first) + '’s overload</h2><p id="rsLead"></p></span><button type="button" class="x-btn" data-action="close">' + ic('x') + '</button></div>' +
      '<div class="dr-b"><div class="sec-row"><span class="sec-t">' + esc(first) + '’s load</span><span class="sec-n">before → after the fix</span></div>' +
      '<div class="strip" id="rsStrip" style="' + cols + '"></div>' +
      (opts.length ? '<div class="sec-t" style="margin-top:18px">Ways to fix it</div><div id="rsOpts"></div>' : '') +
      '<button type="button" class="man-tg' + (manOpen ? ' open' : '') + '" data-action="rs-manual">' + ic('chevR') + 'Adjust bookings manually</button>' +
      '<div id="rsMan"' + (manOpen ? '' : ' hidden') + '>' + manualHtml() + '</div></div>' +
      '<div class="dr-f"><span class="grow" id="rsStatus"></span><button type="button" class="btn-s" data-action="close">Cancel</button><button type="button" class="btn-p" data-action="rs-apply">Apply fix</button></div>');

    var extra = 0; overM.forEach(function(m){ var l = load(d, pid, m); extra += l.booked - l.avail; });
    $('#rsLead', el).innerHTML = 'Over capacity in ' + overM.map(mShort).join(', ') + ' — <b class="ov">' + extra + 'h</b> more than ' + esc(first) + ' can do. Pick a fix; the plan updates as you go.';

    function update(){
      var dr = cur(), over = 0;
      $('#rsStrip', el).innerHTML = span.map(function(m){
        var l0 = load(d, pid, m), l1 = load(d, pid, m, dr), s = st(l1); if (s === 'over') over++;
        var a = l1.avail ? Math.round(l1.pct) + '%' : '—', b = l0.avail ? Math.round(l0.pct) + '%' : '—';
        var changed = l0.booked !== l1.booked;
        return '<div class="sc st-' + (changed && s !== 'over' ? 'fixed' : s) + '"><em>' + mShort(m) + '</em>' + a + '<small>' + (changed ? '<s>' + b + '</s>' : 'no change') + '</small></div>';
      }).join('');
      if ($('#rsOpts', el)) $('#rsOpts', el).innerHTML = opts.map(optHtml).join('');
      var hurt = dr.filter(function(b){ return involvedIds.indexOf(b.id) >= 0 && b.person && b.person !== pid && overMonths(b.person, dr, b.start, b.end); });
      var s = $('#rsStatus', el);
      if (over) s.innerHTML = '<span class="status-line bad">' + ic('alert') + 'Still over in ' + over + ' month' + (over > 1 ? 's' : '') + '</span>';
      else if (hurt.length) s.innerHTML = '<span class="status-line bad">' + ic('alert') + esc(person(d, hurt[0].person).name) + ' becomes overloaded</span>';
      else s.innerHTML = '<span class="status-line good">' + ic('check') + 'Everyone fits after this change</span>';
      manual.forEach(function(b){ var o = $('[data-out="' + b.id + '"]', el); if (o) o.textContent = b.pct + '%'; });
    }
    update();
    el._sel = function(id){ sel = id; update(); };
    el._manual = function(){
      manOpen = !manOpen;
      $('.man-tg', el).classList.toggle('open', manOpen);
      $('#rsMan', el).hidden = !manOpen;
      if (manOpen){ manual = clone(cur()); $('#rsMan', el).innerHTML = manualHtml(); sel = 'manual'; update(); }
    };
    el.addEventListener('input', function(e){
      var id = e.target.dataset.rsPct; if (!id) return;
      find(manual, id).pct = +e.target.value; sel = 'manual'; update();
    });
    el.addEventListener('change', function(e){
      var id = e.target.dataset.rsWho; if (!id) return;
      find(manual, id).person = e.target.value; sel = 'manual'; update();
    });
    el._auto = function(){ if (opts.length) el._sel(opts[0].id); };
    el._apply = function(){
      var dr = clone(cur()).filter(function(b){ return b.pct > 0; });
      closePanel();
      commit('Overload resolved for ' + esc(p.name), function(dd){ dd.bookings = dr; });
      done('resolve');
      flashCells(pid);
    };
  }
  function autoBalance(d, pid, draft, involved){
    function overIn(b){ for (var m = b.start; m <= b.end; m++) if (st(load(d, pid, m, draft)) === 'over') return true; return false; }
    // 1. move the smallest competing booking to a colleague who has room for all of it
    involved.slice().sort(function(a, b){ return a.pct - b.pct; }).forEach(function(b){
      if (b.person !== pid || !overIn(b)) return;
      var others = d.people.filter(function(c){ return c.role === b.role && c.id !== pid; });
      for (var i = 0; i < others.length; i++){
        var c = others[i], ok = true;
        b.person = c.id;
        for (var m = b.start; m <= b.end && ok; m++) if (load(d, c.id, m, draft).pct > 100.5) ok = false;
        if (ok) return;
        b.person = pid;
      }
    });
    // 2. whatever is still over gets scaled down proportionally
    var factor = 1;
    for (var m = 0; m < MN; m++){
      var l = load(d, pid, m, draft);
      if (l.pct > 100.5) factor = Math.min(factor, l.avail / l.booked);
    }
    if (factor < 1) involved.forEach(function(b){ if (b.person === pid) b.pct = Math.max(5, Math.floor(b.pct * factor / 5) * 5); });
  }
  function flashCells(pid){
    requestAnimationFrame(function(){
      grid.querySelectorAll('.cell[data-p="' + pid + '"]').forEach(function(c){ c.classList.add('flash'); });
    });
  }

  /* candidate shortlist */
  function openShortlist(bid){
    var d = D(), b = booking(d, bid), pj = project(d, b.project);
    var need = b.skills || [];
    var range = []; for (var m = b.start; m <= b.end; m++) range.push(m);
    var others = d.bookings.filter(function(x){ return x.id !== b.id; });
    var list = d.people.filter(function(c){ return c.id !== b.person; }).map(function(c){
      var fitM = 0, after = range.map(function(m){
        var l = load(d, c.id, m, others), bk = l.booked + hrs(b, m), pct = l.avail ? bk / l.avail * 100 : 999;
        if (pct <= 100.5) fitM++;
        return {m:m, pct:pct, s:st({avail:l.avail, booked:bk, pct:pct})};
      });
      var skillHit = need.filter(function(s){ return c.skills.indexOf(s) >= 0; }).length;
      var roleMatch = c.role === b.role;
      var score = (roleMatch ? 50 : 0) + fitM / range.length * 35 + (need.length ? skillHit / need.length * 15 : 15);
      return {c:c, after:after, fitM:fitM, skillHit:skillHit, roleMatch:roleMatch, score:Math.round(score)};
    }).sort(function(a, b){ return b.score - a.score; });

    var best = list[0];
    // the most skilled role-match, if it isn't already the top pick — that trade-off is the interesting one
    var skilled = need.length ? list.filter(function(x, i){ return i > 0 && x.roleMatch && x.skillHit === need.length; })[0] : null;
    var rows = list.map(function(x, i){
      var tags = (i === 0 && x.roleMatch ? '<span class="tag">Best fit</span>' : '') +
        (x === skilled ? '<span class="tag ok">Skills match</span>' : '') +
        (x.roleMatch ? '' : '<span class="tag warn">' + role(x.c.role).name + '</span>');
      var sub = (x.roleMatch ? role(x.c.role).name : 'Other role') + ' · ' +
        (x.fitM === range.length ? 'free in all ' + range.length + ' months' : '<span class="ov">over in ' + (range.length - x.fitM) + ' month' + (range.length - x.fitM > 1 ? 's' : '') + '</span>');
      var skills = x.c.skills.map(function(s){ return '<span class="chip' + (need.indexOf(s) >= 0 ? ' match' : '') + '">' + (need.indexOf(s) >= 0 ? ic('check') : '') + s + '</span>'; }).join('');
      var miss = need.filter(function(s){ return x.c.skills.indexOf(s) < 0; });
      var mini = '<div class="mini">' + x.after.map(function(a){ return '<span class="st-' + a.s + '">' + mShort(a.m) + ' ' + Math.round(a.pct) + '%</span>'; }).join('') + '</div>';
      return '<div class="cand' + (i === 0 && x.roleMatch ? ' best' : '') + (x.roleMatch ? '' : ' dim') + '">' +
        '<div class="cand-h">' + avatar(x.c, 'lg') + '<div class="txt"><div class="nm">' + esc(x.c.name) + tags + '</div><small>' + sub + '</small></div><span class="score">' + x.score + '%</span></div>' +
        (x.roleMatch ? '<div class="mini-t">Load after booking</div>' + mini : '') +
        '<div class="cand-f"><div class="chips">' + skills + (miss.length && x.roleMatch ? '<span class="miss">no ' + miss.join(', ') + ' yet</span>' : '') + '</div>' +
        '<button type="button" class="' + (i === 0 ? 'btn-p' : 'btn-s') + ' sm" data-action="assign" data-b="' + b.id + '" data-p="' + x.c.id + '">' + (i === 0 ? 'Book ' + esc(x.c.name.split(' ')[0]) : x.fitM === range.length ? 'Book' : 'Book anyway') + '</button></div></div>';
    });
    if (skilled && best.roleMatch && best.skillHit < need.length){
      var freeFrom = null; skilled.after.some(function(a){ if (a.s !== 'over'){ freeFrom = a.m; return true; } });
      rows.splice(2, 0, '<div class="tip">' + ic('spark') + '<div><b>Or split the role</b><span>' + esc(best.c.name.split(' ')[0]) + ' starts now' +
        (freeFrom !== null ? ', ' + esc(skilled.c.name.split(' ')[0]) + ' joins in ' + mShort(freeFrom) + ' when free' : ', ' + esc(skilled.c.name.split(' ')[0]) + ' reviews ' + need.join(' and ').toLowerCase()) +
        ' and brings the ' + need.join(' and ').toLowerCase() + ' expertise. Nobody goes over 100%.</span></div></div>');
    } else if (best && best.fitM < range.length){
      rows.unshift('<p class="note">' + ic('info') + ' Nobody with this role is fully free — consider a lower allocation or a split between two people.</p>');
    }
    openPanel('drawer',
      '<div class="dr-h">' + pbadge(pj) + '<span class="txt"><h2>' + (b.person ? 'Reassign ' + esc(pj.name) : 'Find ' + (/^[aeiou]/i.test(role(b.role).name) ? 'an ' : 'a ') + role(b.role).name.toLowerCase()) + '</h2><p>' + esc(pj.name) + ' · ' + b.pct + '% · ' + mLabel(b.start) + ' – ' + mLabel(b.end) + '</p>' +
      '<div class="rank">Ranked by <span>Role</span><span>Availability</span>' + (need.length ? '<span>' + need.join(', ') + '</span>' : '') + '</div></span><button type="button" class="x-btn" data-action="close">' + ic('x') + '</button></div>' +
      '<div class="dr-b">' + rows.join('') + '</div>');
  }
  function assign(bid, pid){
    var d = D(), b = booking(d, bid), wasReq = !b.person, p = person(d, pid);
    closeAll();
    commit((wasReq ? 'Booked ' : 'Moved to ') + esc(p.name) + ' on ' + esc(project(d, b.project).name), function(dd){
      booking(dd, bid).person = pid;
      S.tog['r:' + p.role] = true; S.tog['p:' + pid] = true; S.tog['j:' + b.project] = true;
    });
    if (wasReq) done('staff');
    var over = false; for (var m = b.start; m <= b.end; m++) if (st(load(D(), pid, m)) === 'over') over = true;
    if (over) setTimeout(function(){ toast(esc(p.name) + ' is now over capacity — click a red cell to resolve it', true); }, 1200);
    flashCells(pid);
  }

  /* book a person / create a project */
  // biggest allocation that still fits every month of the range — a sensible default, not a blind 50%
  function fitPct(d, pid, s, e){
    var best = 100;
    for (var m = s; m <= e; m++){ var l = load(d, pid, m); if (CAP[m]) best = Math.min(best, (l.avail - l.booked) / CAP[m] * 100); }
    return clamp(Math.floor(best / 5) * 5, 5, 100);
  }
  function openBook(pid, m, e, pref){
    var d = D(), p = person(d, pid), drawn = e !== undefined && !isNaN(e);
    m = isNaN(m) ? Math.max(S.view, TODAY) : m;
    e = drawn ? e : Math.min(m + 2, MN - 1);
    var pct0 = fitPct(d, pid, m, e);
    var mine = {}; d.bookings.forEach(function(b){ if (b.person === pid) mine[b.project] = 1; });
    var projs = d.projects.filter(function(pj){ return !mine[pj.id]; }).concat(d.projects.filter(function(pj){ return mine[pj.id]; }));
    if (pref) projs.sort(function(a, b){ return (b.id === pref) - (a.id === pref); });
    var n = e - m + 1;
    var el = openPanel('modal narrow bk',
      '<div class="dr-h">' + avatar(p, 'lg') + '<span class="txt"><h2>' + (drawn ? 'Confirm booking' : 'Book ' + esc(p.name)) + '</h2><p>' + esc(p.name) + ' · ' + role(p.role).name +
      (drawn ? ' · <b>' + (n > 1 ? mShort(m) + ' – ' + mLabel(e) : mLabel(m)) + '</b>, ' + n + ' month' + (n > 1 ? 's' : '') : '') + '</p></span><button type="button" class="x-btn" data-action="close">' + ic('x') + '</button></div>' +
      '<div class="dr-b"><label class="fld"><span>Project</span><select id="bkProj">' + projs.map(function(pj){ return '<option value="' + pj.id + '">' + esc(pj.name) + (mine[pj.id] ? ' · already booked' : '') + '</option>'; }).join('') + '</select></label>' +
      '<label class="fld"><span>Allocation <output id="bkOut">' + pct0 + '%</output></span><input id="bkPct" type="range" min="5" max="100" step="5" value="' + pct0 + '"></label>' +
      '<div class="two"><label class="fld"><span>From</span><select id="bkS">' + monthOptions(m) + '</select></label><label class="fld"><span>To</span><select id="bkE">' + monthOptions(e) + '</select></label></div>' +
      '<div class="sec-row"><span class="sec-t">' + esc(p.name.split(' ')[0]) + '’s load after booking</span><span class="sec-n" id="bkSum"></span></div><div class="mini bk-mini" id="bkMini"></div>' +
      '<p class="bk-st" id="bkNote"></p></div>' +
      '<div class="dr-f"><span class="grow"></span><button type="button" class="btn-s" data-action="close">Cancel</button><button type="button" class="btn-p" data-action="bk-create" data-p="' + pid + '" id="bkGo">Book</button></div>');
    function note(){
      var s0 = +$('#bkS', el).value, e0 = Math.max(s0, +$('#bkE', el).value);
      var b = {person:pid, pct:+$('#bkPct', el).value, start:s0, end:e0}, peak = 0, over = 0, tot = 0;
      $('#bkOut', el).textContent = b.pct + '%';
      var cells = [];
      for (var mm = b.start; mm <= b.end; mm++){
        var l = load(d, pid, mm, d.bookings.concat([b])), s = st(l);
        peak = Math.max(peak, l.pct); if (s === 'over') over++; tot += hrs(b, mm);
        cells.push('<span class="st-' + s + '">' + mShort(mm) + ' ' + Math.round(l.pct) + '%</span>');
      }
      $('#bkMini', el).innerHTML = cells.join('');
      $('#bkSum', el).textContent = tot + 'h in total';
      $('#bkNote', el).innerHTML = over
        ? '<span class="status-line bad">' + ic('alert') + 'Over capacity in ' + over + ' month' + (over > 1 ? 's' : '') + ' — try ' + fitPct(d, pid, b.start, b.end) + '% to fit</span>'
        : '<span class="status-line good">' + ic('check') + 'Fits — peak load ' + Math.round(peak) + '%</span>';
      $('#bkGo', el).textContent = over ? 'Book anyway' : 'Book ' + b.pct + '%';
    }
    note();
    el.addEventListener('input', note);
    el.addEventListener('change', note);
  }
  function createBooking(pid){
    var el = panelEl && panelEl[1]; if (!el) return;
    var proj = $('#bkProj', el).value, pct = +$('#bkPct', el).value, s = +$('#bkS', el).value, e = Math.max(s, +$('#bkE', el).value);
    var p = person(D(), pid);
    closeAll();
    commit('Booked ' + esc(p.name) + ' on ' + esc(project(D(), proj).name), function(d){
      d.bookings.push({id:'b' + (++d.seq), project:proj, person:pid, role:p.role, start:s, end:e, pct:pct});
      S.tog['p:' + pid] = true; S.tog['r:' + p.role] = true;
    });
    done('paint');
    flashCells(pid);
  }
  function openNewProject(){
    var d = D(), skills = {};
    d.people.forEach(function(p){ p.skills.forEach(function(s){ skills[s] = 1; }); });
    var start = Math.max(S.view, TODAY + 1);
    var el = openPanel('modal',
      '<div class="dr-h"><span class="txt"><h2>' + (S.tab === 'simulation' ? 'Tentative project' : 'New project') + '</h2><p>Describe the role you need — Birdview will shortlist people who fit.</p></span><button type="button" class="x-btn" data-action="close">' + ic('x') + '</button></div>' +
      '<div class="dr-b"><label class="fld"><span>Project name</span><input type="text" id="npName" value="Northgate School" maxlength="40"></label>' +
      '<div class="two"><label class="fld"><span>Role</span><select id="npRole">' + ROLES.map(function(r){ return '<option value="' + r.id + '">' + r.name + '</option>'; }).join('') + '</select></label>' +
      '<label class="fld"><span>Allocation <output id="npOut">50%</output></span><input id="npPct" type="range" min="10" max="100" step="5" value="50"></label></div>' +
      '<div class="two"><label class="fld"><span>From</span><select id="npS">' + monthOptions(start) + '</select></label><label class="fld"><span>To</span><select id="npE">' + monthOptions(Math.min(start + 3, MN - 1)) + '</select></label></div>' +
      '<div class="fld"><span>Skills <small style="color:var(--muted);font-weight:400">optional</small></span><div class="chips" id="npSkills">' +
      Object.keys(skills).sort().map(function(s){ return '<button type="button" class="chip' + (s === 'Revit' ? ' on' : '') + '" data-action="chip">' + s + '</button>'; }).join('') + '</div></div></div>' +
      '<div class="dr-f"><span class="grow"></span><button type="button" class="btn-s" data-action="close">Cancel</button><button type="button" class="btn-p" data-action="np-create">' + ic('userSearch') + 'Create and find people</button></div>');
    el.addEventListener('input', function(){ $('#npOut', el).textContent = $('#npPct', el).value + '%'; });
  }
  function createProject(){
    var el = panelEl && panelEl[1]; if (!el) return;
    var name = $('#npName', el).value.trim() || 'Untitled project';
    var r = $('#npRole', el).value, pct = +$('#npPct', el).value, s = +$('#npS', el).value, e = Math.max(s, +$('#npE', el).value);
    var skills = Array.prototype.map.call(el.querySelectorAll('#npSkills .chip.on'), function(c){ return c.textContent; });
    var bid;
    closeAll();
    commit('Created ' + esc(name), function(d){
      var pid = 'n' + (++d.seq);
      d.projects.push({id:pid, name:name, color:PALETTE[d.projects.length % PALETTE.length]});
      bid = 'b' + (++d.seq);
      d.bookings.push({id:bid, project:pid, person:null, role:r, start:s, end:e, pct:pct, skills:skills});
      S.tog['r:' + r] = true;
    });
    if (S.tab === 'simulation') done('sim');
    openShortlist(bid);
  }

  /* ---------- menus ---------- */
  function openMenu(btn){
    var key = btn.dataset.menu, opts = LABELS[key];
    openPop(Object.keys(opts).map(function(v){
      return '<button type="button" class="menu-it" data-action="set" data-key="' + key + '" data-val="' + v + '"><span class="ck">' + (S[key] === v ? ic('check') : '') + '</span>' + opts[v] + '</button>';
    }).join(''), btn, 'menu').dataset.menu = key;
  }

  /* ---------- guide ---------- */
  var STEPS = [
    {id:'resolve', en:'Click a red cell and resolve the overload', ru:'Кликните красную ячейку и разрулите перегруз'},
    {id:'drag',    en:'Drag a booking bar or stretch its edge', ru:'Перетащите бронь или потяните её за край'},
    {id:'paint',   en:'Drag across free cells to book someone', ru:'Протяните по свободным ячейкам, чтобы забронировать человека'},
    {id:'staff',   en:'Find someone for Central Station refit', ru:'Подберите человека на Central Station refit'},
    {id:'sim',     en:'Try a what-if in Simulation and apply it', ru:'Проверьте сценарий в Simulation и примените его'}
  ];
  function done(id){ if (!S.guide[id]){ S.guide[id] = true; renderGuide(); } }
  function renderGuide(){
    var c = STEPS.filter(function(s){ return S.guide[s.id]; }).length;
    var g = $('#guide');
    g.className = 'guide' + (S.guideMin ? ' min' : '');
    g.innerHTML = '<div class="guide-h" data-action="guide-min"><b><span class="t-en">' + (c === STEPS.length ? 'All done — nice!' : 'Try it yourself') + '</span><span class="t-ru">' + (c === STEPS.length ? 'Готово — отлично!' : 'Попробуйте сами') + '</span></b><span class="cnt">' + c + '/' + STEPS.length + '</span>' + ic('chevD') + '</div>' +
      '<div class="guide-bar"><i style="width:' + (c / STEPS.length * 100) + '%"></i></div><ol>' +
      STEPS.map(function(s){
        return '<li class="' + (S.guide[s.id] ? 'done' : '') + '"><button type="button" data-action="guide-go" data-step="' + s.id + '"><span class="ckb">' + ic('check') + '</span><span><span class="t-en">' + s.en + '</span><span class="t-ru">' + s.ru + '</span></span></button></li>';
      }).join('') + '</ol><button type="button" class="guide-reset" data-action="reset">' + ic('reset') + '<span class="t-en">Start over</span><span class="t-ru">Начать заново</span></button>';
  }
  function guideGo(id){
    if (id === 'sim'){ setTab('simulation'); return; }
    if (S.tab === 'workload') setTab('planning');
    if (id === 'resolve'){
      var d = D(), hit = null;
      d.people.some(function(p){ return visMonths().some(function(m){ if (st(load(d, p.id, m)) === 'over'){ hit = [p.id, m]; return true; } }); });
      if (!hit){ toast('No overloads left in view — try moving to other months'); return; }
      openResolve(hit[0], hit[1]);
    } else if (id === 'staff'){
      var req = D().bookings.filter(function(b){ return !b.person; })[0];
      if (req) openShortlist(req.id); else toast('Every role is staffed — create a New project to try again');
    } else if (id === 'paint'){
      var free = [].filter.call(grid.querySelectorAll('.cell'), function(c){ return paintable(c) && !c.classList.contains('st-ok'); });
      free.forEach(function(c){ c.classList.add('hint'); });
      setTimeout(function(){ free.forEach(function(c){ c.classList.remove('hint'); }); }, 1600);
      if (free[0]) free[0].scrollIntoView({block:'center', behavior:'smooth'});
      toast('Press on a cell with free time and drag across the months you need');
    } else if (id === 'drag'){
      var bar = grid.querySelector('.bar:not(.req)');
      if (bar){ bar.scrollIntoView({block:'center', behavior:'smooth'}); bar.classList.add('drag'); setTimeout(function(){ bar.classList.remove('drag'); }, 900); }
      toast('Grab a bar to move it in time, or its edge to change the dates');
    }
  }

  /* ---------- actions ---------- */
  function setTab(t){
    closeAll();
    if (t === 'simulation' && !S.sim) S.sim = clone(S.live);
    S.tab = t;
    render();
  }
  var A = {
    tab: function(el){ setTab(el.dataset.tab); },
    prev: function(){ S.view = clamp(S.view - 1, 0, MN - S.n); renderGrid(); },
    next: function(){ S.view = clamp(S.view + 1, 0, MN - S.n); renderGrid(); },
    today: function(){ S.view = clamp(TODAY - 1, 0, MN - S.n); renderGrid(); },
    toggle: function(el){ var k = el.dataset.k; S.tog[k] = !isOpen(k); renderGrid(); },
    'collapse-all': function(){ setAll(false); },
    'expand-all': function(){ setAll(true); },
    cell: openCellPop,
    resolve: function(el){ openResolve(el.dataset.p, +el.dataset.m); },
    'rs-auto': function(){ panelEl[1]._auto(); },
    'rs-apply': function(){ panelEl[1]._apply(); },
    book: function(el){ openBook(el.dataset.p, el.dataset.m === undefined ? NaN : +el.dataset.m); },
    'bk-create': function(el){ createBooking(el.dataset.p); },
    'bk-remove': function(el){
      var id = el.dataset.b; popClose = null; closePop();
      commit('Booking removed', function(d){ d.bookings = d.bookings.filter(function(b){ return b.id !== id; }); });
    },
    'pop-done': function(){ closePop(); },
    shortlist: function(el){ var id = el.dataset.b; closePop(); openShortlist(id); },
    assign: function(el){ assign(el.dataset.b, el.dataset.p); },
    'new-project': openNewProject,
    'np-create': createProject,
    chip: function(el){ el.classList.toggle('on'); },
    menu: openMenu,
    attn: function(el){
      var k = el.dataset.k;
      if (k === 'req'){ var r = D().bookings.filter(function(b){ return !b.person; })[0]; if (r) openShortlist(r.id); return; }
      var v = k === 'over' ? 'over' : k === 'under' ? 'free' : 'all';
      S.show = S.show === v ? 'all' : v;
      if (S.show !== 'all') ROLES.forEach(function(r){ S.tog['r:' + r.id] = true; });
      renderToolbar(); renderGrid();
    },
    'rs-opt': function(el){ panelEl[1]._sel(el.dataset.o); },
    'rs-manual': function(){ panelEl[1]._manual(); },
    set: function(el){ S[el.dataset.key] = el.dataset.val; closePop(); renderToolbar(); renderGrid(); },
    export: exportCsv,
    'sim-apply': function(){
      var ch = simChanges();
      pushHist({key:'live', json:JSON.stringify(S.live)});
      S.live = clone(S.sim);
      done('sim');
      S.tab = 'planning'; closeAll(); render();
      toast(ch + ' change' + (ch > 1 ? 's' : '') + ' applied to the live plan', true);
    },
    'sim-discard': function(){ commit('Simulation discarded', function(){ S.sim.bookings = clone(S.live.bookings); S.sim.projects = clone(S.live.projects); }); },
    undo: undo,
    close: function(){ closeAll(); },
    nav: function(){ toast('This prototype covers the Resources module'); },
    reset: function(){
      S.live = clone(SEED); S.sim = null; S.hist = []; S.guide = {}; S.tog = {}; S.tab = 'planning'; S.q = ''; S.show = 'all'; S.group = 'role';
      closeAll(); render(); toast('Demo reset to sample data');
    },
    'sb-toggle': function(){ root.classList.toggle('sb-mini'); closePop(); render(); },
    'guide-min': function(){ S.guideMin = !S.guideMin; renderGuide(); },
    'guide-go': function(el){ guideGo(el.dataset.step); },
    'dismiss-small': function(){ document.body.classList.add('small-ok'); }
  };
  function setAll(v){
    ROLES.forEach(function(r){ S.tog['r:' + r.id] = v; });
    D().projects.forEach(function(p){ S.tog['j:' + p.id] = v; });
    D().people.forEach(function(p){ S.tog['p:' + p.id] = v; S.tog['w:' + p.id] = v; });
    renderGrid();
  }

  document.addEventListener('click', function(e){
    if (paintClick){ paintClick = false; return; }       // the click that ends a paint gesture is not a cell click
    if (e.target.closest('.bar')) return;                 // bars are handled by the pointer logic below
    var a = e.target.closest('[data-action]');
    if (!e.target.closest('.pop')){
      // a second click on the same menu button closes it instead of reopening
      var sameMenu = a && a.dataset.action === 'menu' && popEl && popEl.dataset.menu === a.dataset.menu;
      closePop();
      if (sameMenu) return;
    }
    if (!a) return;
    var f = A[a.dataset.action];
    if (f) f(a, e);
  });
  document.addEventListener('input', function(e){
    if (e.target.id === 'q'){ S.q = e.target.value; renderGrid(); }
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){ closeAll(); return; }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){ e.preventDefault(); undo(); }
  });

  /* ---------- paint a new booking: press on a cell with free time and drag across months ---------- */
  var paint = null, paintClick = false;
  function paintable(c){
    if (!c || S.tab === 'workload') return false;
    var l = load(D(), c.dataset.p, +c.dataset.m);
    return l.avail - l.booked > 0;
  }
  function monthAt(track, x){ var r = track.getBoundingClientRect(); return clamp(S.view + Math.floor((x - r.left) / S.col), S.view, S.view + S.n - 1); }
  function paintRow(t){
    if (S.tab === 'workload' || t.closest('.bar, .vchip, button:not(.cell)')) return null;
    var tr = t.closest('.g-track'), rw = tr && tr.parentNode;
    return rw && rw.dataset && rw.dataset.p ? {track:tr, pid:rw.dataset.p, j:rw.dataset.j || null} : null;
  }
  grid.addEventListener('pointerdown', function(e){
    if (e.button !== 0) return;
    var r = paintRow(e.target); if (!r) return;
    var m = monthAt(r.track, e.clientX);
    paint = {pid:r.pid, j:r.j, s:m, e:m, x:e.clientX, track:r.track, moved:false, el:null, empty:!e.target.closest('.cell')};
    hideSlot();
  });
  // hover hint on empty timeline space: shows where a drag would start
  var slot = null;
  function hideSlot(){ if (slot){ slot.remove(); slot = null; } }
  grid.addEventListener('pointermove', function(e){
    if (paint || drag) return;
    var r = paintRow(e.target);
    if (!r || e.target.closest('.cell')){ hideSlot(); return; }
    var m = monthAt(r.track, e.clientX);
    if (!slot){ slot = document.createElement('div'); slot.className = 'slot'; slot.innerHTML = ic('plus') + '<span>Drag to book</span>'; }
    if (slot.parentNode !== r.track) r.track.appendChild(slot);
    slot.style.left = (xOf(m) + 4) + 'px'; slot.style.width = (S.col - 8) + 'px';
  });
  grid.addEventListener('pointerleave', hideSlot);
  window.addEventListener('pointermove', function(e){
    if (!paint) return;
    if (!paint.moved && Math.abs(e.clientX - paint.x) < 6) return;
    if (!paint.moved){
      paint.moved = true; closePop();
      document.body.classList.add('painting');
      paint.el = document.createElement('div'); paint.el.className = 'paint';
      paint.track.appendChild(paint.el);
    }
    paint.e = monthAt(paint.track, e.clientX);
    var a = Math.min(paint.s, paint.e), b = Math.max(paint.s, paint.e), n = b - a + 1;
    paint.el.style.left = (xOf(a) + 4) + 'px';
    paint.el.style.width = (n * S.col - 8) + 'px';
    paint.el.innerHTML = '<span>' + ic('plus') + (n > 1 ? mShort(a) + ' – ' + mShort(b) : mShort(a)) + '</span><small>' + n + ' mo · ' + fitPct(D(), paint.pid, a, b) + '% fits</small>';
  });
  window.addEventListener('pointerup', function(){
    if (!paint) return;
    var p0 = paint; paint = null;
    document.body.classList.remove('painting');
    if (!p0.moved && !p0.empty) return;                      // a plain click on a cell opens its details as before
    if (!p0.el){ p0.el = document.createElement('div'); p0.el.className = 'paint'; }  // a click on empty space books that one month
    paintClick = true; setTimeout(function(){ paintClick = false; }, 0);
    openBook(p0.pid, Math.min(p0.s, p0.e), Math.max(p0.s, p0.e), p0.j);
    var a0 = Math.min(p0.s, p0.e), n0 = Math.abs(p0.e - p0.s) + 1;
    p0.el.style.left = (xOf(a0) + 4) + 'px'; p0.el.style.width = (n0 * S.col - 8) + 'px';
    p0.track.appendChild(p0.el);                             // keep the drawn range visible behind the modal
  });

  /* ---------- drag and resize bars ---------- */
  var drag = null;
  grid.addEventListener('pointerdown', function(e){
    var bar = e.target.closest('.bar'); if (!bar || e.button !== 0) return;
    var b = booking(D(), bar.dataset.b);
    drag = {id:b.id, b:b, mode:e.target.dataset.h || 'move', x:e.clientX, s:b.start, e:b.end, snap:snapshot(), moved:false, el:bar};
    e.preventDefault();
  });
  window.addEventListener('pointermove', function(e){
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 5) return;
    if (!drag.moved){ drag.moved = true; closePop(); document.body.classList.add(drag.mode === 'move' ? 'dragging' : 'resizing'); }
    var dm = Math.round(dx / S.col), b = drag.b, ns = drag.s, ne = drag.e;
    if (drag.mode === 'move'){ dm = clamp(dm, -drag.s, MN - 1 - drag.e); ns += dm; ne += dm; }
    else if (drag.mode === 'l') ns = clamp(drag.s + dm, 0, drag.e);
    else ne = clamp(drag.e + dm, drag.s, MN - 1);
    if (ns !== b.start || ne !== b.end){ b.start = ns; b.end = ne; renderGrid(); }
  });
  window.addEventListener('pointerup', function(){
    if (!drag) return;
    var d0 = drag; drag = null;
    document.body.classList.remove('dragging', 'resizing');
    if (d0.moved){
      renderGrid();
      if (d0.b.start !== d0.s || d0.b.end !== d0.e){
        pushHist(d0.snap);
        renderTabs(); renderSimBanner();
        toast(esc(project(D(), d0.b.project).name) + ': ' + mLabel(d0.b.start) + ' – ' + mLabel(d0.b.end), true);
        done('drag');
        if (d0.b.person) flashCells(d0.b.person);
      }
    } else {
      openBarPop(d0.b, d0.el);
    }
  });

  /* horizontal wheel / trackpad scrolls months */
  var wheelAcc = 0;
  grid.addEventListener('wheel', function(e){
    var dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
    if (!dx) return;
    e.preventDefault();
    wheelAcc += dx;
    if (Math.abs(wheelAcc) > 70){
      S.view = clamp(S.view + (wheelAcc > 0 ? 1 : -1), 0, MN - S.n);
      wheelAcc = 0; closePop(); renderGrid();
    }
  }, {passive:false});

  var rT;
  window.addEventListener('resize', function(){ clearTimeout(rT); rT = setTimeout(function(){ closePop(); measure(); renderToolbar(); renderGrid(); }, 80); });

  /* ---------- language (shared with the portfolio) ---------- */
  function setLang(l){
    root.setAttribute('data-lang', l);
    document.querySelectorAll('[data-set-lang]').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.setLang === l); });
    try{ localStorage.setItem('md-lang', l); }catch(err){}
  }
  document.querySelectorAll('[data-set-lang]').forEach(function(b){ b.addEventListener('click', function(){ setLang(b.dataset.setLang); }); });
  var storedLang; try{ storedLang = localStorage.getItem('md-lang'); }catch(err){}
  setLang(storedLang || ((navigator.language || 'en').slice(0, 2) === 'ru' ? 'ru' : 'en'));

  // ?embed: shown inside the case page, so drop the portfolio strip and give the grid more room
  if (/[?&]embed\b/.test(location.search)) root.classList.add('embed', 'sb-mini');
  window.addEventListener('storage', function(e){ if (e.key === 'md-lang' && e.newValue) setLang(e.newValue); });

  renderSidebar();
  render();
})();
