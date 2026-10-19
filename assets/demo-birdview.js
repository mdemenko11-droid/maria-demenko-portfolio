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
    return l.pct > 100.5 ? 'over' : l.pct >= 80 ? 'ok' : l.pct > 0 ? 'under' : 'free';
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
    return '<button type="button" class="cell st-' + s + chg + '" data-action="cell" data-p="' + p.id + '" data-m="' + m + '" style="left:' + (xOf(m) + 4) + 'px;width:' + (S.col - 8) + 'px">' +
      '<span class="v">' + ic('hour') + main + '</span><small>' + sub + '</small></button>';
  }
  function barHtml(d, b){
    var pj = project(d, b.project);
    var left = xOf(b.start) + 4, width = (b.end - b.start + 1) * S.col - 8;
    var pad = left < 0 ? (-left + 10) : 10;
    var label = b.person ? b.pct + '% (' + totalHrs(b) + 'h)' : 'Unassigned · ' + b.pct + '% (' + totalHrs(b) + 'h)';
    return '<div class="bar' + (b.person ? '' : ' req') + (drag && drag.id === b.id ? ' drag' : '') + '" data-b="' + b.id + '" style="left:' + left + 'px;width:' + width + 'px;--pc:' + pj.color + ';padding-left:' + pad + 'px" title="' + esc(pj.name) + ' · ' + mLabel(b.start) + ' – ' + mLabel(b.end) + '">' +
      '<span class="h l" data-h="l"></span><span class="bl">' + label + '</span><span class="h r" data-h="r"></span></div>';
  }
  function personRows(d, p){
    var k = 'p:' + p.id, open = isOpen(k), r = role(p.role);
    var name = tw(k) + avatar(p) + '<span class="txt"><b>' + esc(p.name) + '</b><small>' + r.name + '</small></span>' +
      '<button type="button" class="hd-btn row-act" data-action="book" data-p="' + p.id + '" title="Book on a project">' + ic('plus') + '</button>';
    var h = row('person', name, visMonths().map(function(m){ return cellHtml(d, p, m); }).join(''));
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
        h += row('booking', pbadge(pj) + '<span class="txt"><b>' + esc(pj.name) + '</b></span>', barHtml(d, b));
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
        h += row('booking proj-b', name, barHtml(d, b));
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
  function renderSimBanner(){
    var el = $('#simBanner');
    if (S.tab !== 'simulation'){ el.hidden = true; return; }
    var ch = simChanges(), o1 = overCount(S.live), o2 = overCount(S.sim);
    el.hidden = false;
    el.innerHTML = '<span class="sim-ic">' + ic('flask') + '</span>' +
      '<div class="stat"><span><b>Sandbox.</b> Nothing here reaches the live plan until you apply it.</span>' +
      '<span>Changes: <b>' + ch + '</b></span>' +
      '<span>Overloaded person-months: <b>' + o1 + '</b> → <span class="' + (o2 < o1 ? 'good' : o2 > o1 ? 'bad' : '') + '">' + o2 + '</span></span></div>' +
      '<button type="button" class="btn-s sm" data-action="new-project">' + ic('plus') + 'Tentative project</button>' +
      '<button type="button" class="btn-s sm" data-action="sim-discard"' + (ch ? '' : ' disabled') + '>Discard</button>' +
      '<button type="button" class="btn-p sm" data-action="sim-apply"' + (ch ? '' : ' disabled') + '>Apply to plan</button>';
  }

  function renderGrid(){
    if (S.tab === 'workload') renderWorkload(); else renderPlanning();
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
  function closePanel(){ if (panelEl){ panelEl.forEach(function(e){ e.remove(); }); panelEl = null; } }
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
    var free = l.avail - l.booked;
    var foot = s === 'over'
      ? '<button type="button" class="btn-p" data-action="resolve" data-p="' + p.id + '" data-m="' + m + '">' + ic('spark') + 'Resolve overload</button>'
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

  /* conflict resolution drawer */
  function openResolve(pid, focusM){
    var d = D(), p = person(d, pid);
    var draft = clone(d.bookings);
    var overM = [];
    for (var m = 0; m < MN; m++) if (st(load(d, pid, m)) === 'over') overM.push(m);
    var involved = draft.filter(function(b){
      return b.person === pid && overM.some(function(m){ return m >= b.start && m <= b.end; });
    });
    var from = Math.min.apply(null, involved.map(function(b){ return b.start; }));
    var to = Math.max.apply(null, involved.map(function(b){ return b.end; }));
    if (to - from > 7) to = from + 7;
    var span = []; for (var mm = from; mm <= to; mm++) span.push(mm);
    var cols = 'grid-template-columns:repeat(' + span.length + ',1fr)';

    function candidates(b){
      return d.people.filter(function(c){ return c.role === b.role && c.id !== pid; }).map(function(c){
        var worst = Infinity, fits = true;
        for (var m = b.start; m <= b.end; m++){
          var l = load(d, c.id, m, draft.filter(function(x){ return x.id !== b.id; }));
          var free = l.avail - l.booked; worst = Math.min(worst, free);
          if (free < hrs(b, m)) fits = false;
        }
        return {p:c, free:Math.max(0, worst), fits:fits};
      }).sort(function(a, c){ return c.free - a.free; });
    }
    var cards = involved.map(function(b){
      var pj = project(d, b.project);
      var opts = '<option value="' + pid + '">Keep on ' + esc(p.name) + '</option>' + candidates(b).map(function(c){
        return '<option value="' + c.p.id + '">Move to ' + esc(c.p.name) + ' — ' + (c.fits ? 'fits, ' : 'tight, ') + c.free + 'h free/mo</option>';
      }).join('');
      return '<div class="card" data-card="' + b.id + '"><div class="card-h">' + pbadge(pj) + '<b>' + esc(pj.name) + '</b><em>' + mShort(b.start) + ' – ' + mLabel(b.end) + '</em></div>' +
        '<label class="fld"><span>Allocation <output data-out="' + b.id + '">' + b.pct + '%</output></span><input type="range" min="0" max="100" step="5" value="' + b.pct + '" data-rs-pct="' + b.id + '"></label>' +
        '<label class="fld" style="margin:0"><select data-rs-who="' + b.id + '">' + opts + '</select></label></div>';
    }).join('');

    var el = openPanel('drawer',
      '<div class="dr-h">' + avatar(p, 'lg') + '<span class="txt"><h2>Resolve overload</h2><p>' + esc(p.name) + ' is booked over capacity in ' + overM.map(mShort).join(', ') + '. Lower allocations or move work to a free colleague — the load updates as you go.</p></span><button type="button" class="x-btn" data-action="close">' + ic('x') + '</button></div>' +
      '<div class="dr-b"><div class="sec-t">' + esc(p.name.split(' ')[0]) + '’s load</div><div class="strip" id="rsStrip" style="' + cols + '"></div>' +
      '<div class="strip-l" style="' + cols + '">' + span.map(function(m){ return '<span>' + mShort(m) + '</span>'; }).join('') + '</div>' +
      '<div class="sec-t">Competing bookings</div>' + cards + '</div>' +
      '<div class="dr-f"><span class="grow" id="rsStatus"></span><button type="button" class="btn-s" data-action="rs-auto">' + ic('spark') + 'Auto-balance</button><button type="button" class="btn-p" data-action="rs-apply">Apply</button></div>');

    function update(){
      var over = 0;
      $('#rsStrip', el).innerHTML = span.map(function(m){
        var l = load(d, pid, m, draft), s = st(l); if (s === 'over') over++;
        return '<div class="sc st-' + s + '">' + (l.avail ? Math.round(l.pct) + '%' : '—') + '<small>' + l.booked + '/' + l.avail + 'h</small></div>';
      }).join('');
      // a reassigned booking can overload the colleague it moved to — surface that too
      var moved = draft.filter(function(b){ return b.person !== pid && involved.indexOf(b) >= 0; });
      var hurt = moved.filter(function(b){
        for (var m = b.start; m <= b.end; m++) if (st(load(d, b.person, m, draft)) === 'over') return true;
        return false;
      });
      var s = $('#rsStatus', el);
      if (over) s.innerHTML = '<span class="status-line bad">' + ic('alert') + 'Still over in ' + over + ' month' + (over > 1 ? 's' : '') + '</span>';
      else if (hurt.length) s.innerHTML = '<span class="status-line bad">' + ic('alert') + esc(person(d, hurt[0].person).name) + ' becomes overloaded</span>';
      else s.innerHTML = '<span class="status-line good">' + ic('check') + 'Everyone fits</span>';
      involved.forEach(function(b){
        $('[data-out="' + b.id + '"]', el).textContent = b.pct + '% · ' + hrs(b, clamp(focusM, b.start, b.end)) + 'h in ' + mShort(clamp(focusM, b.start, b.end));
      });
    }
    update();
    el.addEventListener('input', function(e){
      var id = e.target.dataset.rsPct; if (!id) return;
      find(draft, id).pct = +e.target.value; update();
    });
    el.addEventListener('change', function(e){
      var id = e.target.dataset.rsWho; if (!id) return;
      find(draft, id).person = e.target.value; update();
    });
    el._auto = function(){
      autoBalance(d, pid, draft, involved);
      involved.forEach(function(b){
        $('[data-rs-pct="' + b.id + '"]', el).value = b.pct;
        $('[data-rs-who="' + b.id + '"]', el).value = b.person;
      });
      update();
    };
    el._apply = function(){
      draft = draft.filter(function(b){ return b.pct > 0; });
      closePanel();
      commit('Overload resolved for ' + esc(p.name), function(dd){ dd.bookings = draft; });
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
    var rows = list.map(function(x, i){
      var tags = (x.roleMatch ? '<span class="tag">Role match</span>' : '<span class="tag warn">' + role(x.c.role).name + '</span>') +
        (x.fitM === range.length ? '<span class="tag ok">Available</span>' : '<span class="tag warn">Over in ' + (range.length - x.fitM) + ' mo</span>');
      var skills = x.c.skills.map(function(s){ return '<span class="chip' + (need.indexOf(s) >= 0 ? ' match' : '') + '">' + (need.indexOf(s) >= 0 ? ic('check') : '') + s + '</span>'; }).join('');
      var mini = '<div class="mini">' + x.after.map(function(a){ return '<span class="st-' + a.s + '">' + Math.round(a.pct) + '%</span>'; }).join('') + '</div>' +
        '<div class="mini-l">' + x.after.map(function(a){ return '<span>' + mShort(a.m) + '</span>'; }).join('') + '</div>';
      return '<div class="cand' + (i === 0 && x.roleMatch ? ' best' : '') + (x.roleMatch ? '' : ' dim') + '">' + avatar(x.c, 'lg') +
        '<div class="txt"><div class="nm">' + esc(x.c.name) + tags + '</div><small>' + x.score + '% fit · load after booking:</small>' + mini +
        '<div class="chips" style="margin-top:8px">' + skills + '</div></div>' +
        '<button type="button" class="' + (i === 0 ? 'btn-p' : 'btn-s') + ' sm" data-action="assign" data-b="' + b.id + '" data-p="' + x.c.id + '">Assign</button></div>';
    }).join('');
    openPanel('drawer',
      '<div class="dr-h">' + pbadge(pj) + '<span class="txt"><h2>' + (b.person ? 'Reassign' : 'Find people for') + ' ' + esc(pj.name) + '</h2><p>' + role(b.role).name + ' · ' + b.pct + '% · ' + mLabel(b.start) + ' – ' + mLabel(b.end) +
      (need.length ? ' · skills: ' + need.join(', ') : '') + '. Ranked by role, availability and skills; every card shows how the person’s load would look after the booking.</p></span><button type="button" class="x-btn" data-action="close">' + ic('x') + '</button></div>' +
      '<div class="dr-b">' + (best && best.fitM < range.length ? '<p class="note">' + ic('info') + ' Nobody with this role is fully free — consider a lower allocation or a split between two people.</p>' : '') + rows + '</div>');
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
  function openBook(pid, m){
    var d = D(), p = person(d, pid);
    m = isNaN(m) ? Math.max(S.view, TODAY) : m;
    var el = openPanel('modal narrow',
      '<div class="dr-h">' + avatar(p, 'lg') + '<span class="txt"><h2>Book ' + esc(p.name) + '</h2><p>' + role(p.role).name + '</p></span><button type="button" class="x-btn" data-action="close">' + ic('x') + '</button></div>' +
      '<div class="dr-b"><label class="fld"><span>Project</span><select id="bkProj">' + d.projects.map(function(pj){ return '<option value="' + pj.id + '">' + esc(pj.name) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fld"><span>Allocation <output id="bkOut">50%</output></span><input id="bkPct" type="range" min="5" max="100" step="5" value="50"></label>' +
      '<div class="two"><label class="fld"><span>From</span><select id="bkS">' + monthOptions(m) + '</select></label><label class="fld"><span>To</span><select id="bkE">' + monthOptions(Math.min(m + 2, MN - 1)) + '</select></label></div>' +
      '<p class="note" id="bkNote"></p></div>' +
      '<div class="dr-f"><span class="grow"></span><button type="button" class="btn-s" data-action="close">Cancel</button><button type="button" class="btn-p" data-action="bk-create" data-p="' + pid + '">Book</button></div>');
    function note(){
      var b = {person:pid, pct:+$('#bkPct', el).value, start:+$('#bkS', el).value, end:Math.max(+$('#bkS', el).value, +$('#bkE', el).value)};
      $('#bkOut', el).textContent = b.pct + '%';
      var peak = 0;
      for (var mm = b.start; mm <= b.end; mm++){ var l = load(d, pid, mm, d.bookings.concat([b])); peak = Math.max(peak, l.pct); }
      $('#bkNote', el).innerHTML = 'Peak load after booking: <b style="color:' + (peak > 100.5 ? 'var(--ov-tx)' : 'var(--ok-tx)') + '">' + Math.round(peak) + '%</b>';
    }
    note();
    el.addEventListener('input', note);
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
