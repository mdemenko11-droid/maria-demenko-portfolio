/* Real 3D glyphs for the cards: glossy black objects with reflections, a
   soft shadow on the card and volume. They sway on their own and turn toward
   the pointer. If WebGL is not available the flat SVG glyphs stay. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* iridescent chrome: a mirror metal with a thin-film coat, so it shifts
   from pink to teal as the object turns, like the foil on the cards */
/* rose gold: a pink-copper metal with only a faint film of iridescence left on it */
function lacquer(){
  return new THREE.MeshPhysicalMaterial({
    color:0xffd6c8, metalness:.92, roughness:.14,
    iridescence:.25, iridescenceIOR:1.3, iridescenceThicknessRange:[200, 520],
    clearcoat:.7, clearcoatRoughness:.06, envMapIntensity:3
  });
}

/* a rounded bar between two points, used to draw strokes in 3D */
function bar(len, thick, depth){
  return new RoundedBoxGeometry(len, thick, depth, 6, thick * .48);
}

const bevel = {bevelEnabled:true, bevelThickness:.1, bevelSize:.06, bevelSegments:8, curveSegments:48};

/* the four-point sparkle used across the AI figures */
function sparkle(material, r){
  const sp = new THREE.Shape(), k = r * .12;
  sp.moveTo(0, r); sp.quadraticCurveTo(k, k, r, 0); sp.quadraticCurveTo(k, -k, 0, -r);
  sp.quadraticCurveTo(-k, -k, -r, 0); sp.quadraticCurveTo(-k, k, 0, r);
  const geo = new THREE.ExtrudeGeometry(sp, {depth:r * .3, bevelEnabled:true, bevelThickness:r * .12, bevelSize:r * .07, bevelSegments:6, curveSegments:24});
  geo.center();
  return new THREE.Mesh(geo, material);
}

const builders = {
  // three linked rings: parts of a system that only work together
  rings(){
    const g = new THREE.Group(), m = lacquer();
    const geo = new THREE.TorusGeometry(.62, .15, 32, 96);
    [[0, .42, 0, 0], [-.48, -.36, .9, .5], [.48, -.36, -.9, -.5]].forEach(([x, y, ry, rz]) => {
      const t = new THREE.Mesh(geo, m);
      t.position.set(x, y, 0); t.rotation.set(.35, ry, rz);
      g.add(t);
    });
    return g;
  },
  // three stacked layers: components built on a shared foundation
  layers(){
    const g = new THREE.Group(), m = lacquer();
    const rs = new THREE.Shape(), h = .78, r = .22;
    rs.moveTo(-h + r, -h); rs.lineTo(h - r, -h); rs.quadraticCurveTo(h, -h, h, -h + r); rs.lineTo(h, h - r);
    rs.quadraticCurveTo(h, h, h - r, h); rs.lineTo(-h + r, h); rs.quadraticCurveTo(-h, h, -h, h - r); rs.lineTo(-h, -h + r);
    rs.quadraticCurveTo(-h, -h, -h + r, -h);
    const geo = new THREE.ExtrudeGeometry(rs, Object.assign({depth:.08}, bevel));
    geo.center(); geo.rotateX(-Math.PI / 2);
    [-.48, 0, .48].forEach((y, i) => {
      const p = new THREE.Mesh(geo, m); p.position.set(0, y, 0); p.scale.setScalar(1 - i * .12); g.add(p);
    });
    g.rotation.set(.62, .62, 0);      // seen from above at three quarters, so the stack reads
    return g;
  },
  // a network of nodes and links: seeing how the parts of a system connect
  // a chubby light bulb: the idea, the thinking
  bulb(){
    const g = new THREE.Group(), m = lacquer();
    // the glass: a round head that narrows softly into the neck, turned on a lathe
    const pts = [];
    for (let i = 0; i <= 24; i++){
      const t = i / 24, a = -Math.PI / 2 + t * Math.PI * 1.32;      // most of a circle, open at the bottom
      pts.push(new THREE.Vector2(Math.cos(a) * .95, Math.sin(a) * .95 + .35));
    }
    pts.reverse();
    pts.push(new THREE.Vector2(.5, -.62), new THREE.Vector2(.46, -.72), new THREE.Vector2(0, -.72));
    pts.sort((p, q) => q.y - p.y);
    const head = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(Math.max(0, p.x), p.y)), 64);
    g.add(new THREE.Mesh(head, m));
    // the screw base: three soft rings and a round tip
    [-.82, -.98, -1.14].forEach((y, i) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.44 - i * .04, .08, 20, 48), m);
      ring.rotation.x = Math.PI / 2; ring.position.y = y; g.add(ring);
    });
    const core = new THREE.Mesh(new THREE.CylinderGeometry(.42, .34, .5, 40), m); core.position.y = -.98; g.add(core);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(.16, 24, 16), m); tip.position.y = -1.28; g.add(tip);
    g.position.y = .3;
    g.scale.setScalar(1.05);
    return g;
  },
  // a chunky puzzle piece: parts that fit together
  puzzle(){
    const s = new THREE.Shape(), h = .78, k = .3;
    s.moveTo(-h, -h); s.lineTo(h, -h); s.lineTo(h, -k);
    s.absarc(h + .18, 0, k, -Math.PI * .7, Math.PI * .7, false);   // knob on the right
    s.lineTo(h, h); s.lineTo(k, h);
    s.absarc(0, h + .18, k, -Math.PI * .2, Math.PI * 1.2, false);  // knob on top
    s.lineTo(-h, h); s.lineTo(-h, k);
    s.absarc(-h + .2, 0, k * .9, Math.PI * .65, -Math.PI * .65, true); // a notch on the left
    s.lineTo(-h, -h);
    const geo = new THREE.ExtrudeGeometry(s, {depth:.34, bevelEnabled:true, bevelThickness:.16, bevelSize:.14, bevelSegments:10, curveSegments:40});
    geo.center();
    const g = new THREE.Group(); const p = new THREE.Mesh(geo, lacquer()); p.rotation.z = -.18; g.add(p); g.scale.setScalar(.95);
    return g;
  },
  // three smooth pebbles in balance
  cairn(){
    const g = new THREE.Group(), m = lacquer(), geo = new THREE.SphereGeometry(1, 48, 32);
    [[0, -.78, .95, .42, 0], [.06, -.12, .72, .34, .2], [-.04, .4, .5, .28, -.15]].forEach(([x, y, r, ry, rot]) => {
      const p = new THREE.Mesh(geo, m); p.position.set(x, y, 0); p.scale.set(r, ry, r * .85); p.rotation.z = rot; g.add(p);
    });
    g.position.y = .15;
    return g;
  },
  // a cube made of eight rounded cubes: a system built from modules
  cubes(){
    const g = new THREE.Group(), m = lacquer(), geo = new RoundedBoxGeometry(.72, .72, .72, 6, .16), d = .4;
    [-1, 1].forEach(x => [-1, 1].forEach(y => [-1, 1].forEach(z => {
      const c = new THREE.Mesh(geo, m); c.position.set(x * d, y * d, z * d); g.add(c);
    })));
    g.rotation.set(.62, .78, 0);
    return g;
  },
  // a soft infinity loop: one continuous flow
  loop(){
    const pts = [];
    for (let i = 0; i <= 200; i++){
      const t = i / 200 * Math.PI * 2, d = 1 + Math.sin(t) * Math.sin(t);
      pts.push(new THREE.Vector3(1.25 * Math.cos(t) / d, 1.25 * Math.sin(t) * Math.cos(t) / d, .22 * Math.sin(2 * t)));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true);
    const geo = new THREE.TubeGeometry(curve, 240, .2, 32, true);
    const g = new THREE.Group(); g.add(new THREE.Mesh(geo, lacquer()));
    return g;
  },
  // a chubby planet with a ring: the orbit, in miniature
  saturn(){
    const g = new THREE.Group(), m = lacquer();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(.78, 64, 48), m));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, .1, 24, 96), m);
    ring.scale.set(1, 1, .5); ring.rotation.set(Math.PI / 2.3, .25, 0); g.add(ring);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(.16, 32, 24), m); moon.position.set(1.15, .7, .2); g.add(moon);
    return g;
  },
  // a stacking-ring toy: layers that build the whole
  stack(){
    const g = new THREE.Group(), m = lacquer();
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 1.9, 24), m); rod.position.y = .1; g.add(rod);
    [[.62, -.68], [.52, -.32], [.42, .02], [.32, .32]].forEach(([r, y]) => {
      const t = new THREE.Mesh(new THREE.TorusGeometry(r, .16, 24, 64), m); t.rotation.x = Math.PI / 2; t.position.y = y; t.scale.z = 1.4; g.add(t);
    });
    const top = new THREE.Mesh(new THREE.SphereGeometry(.2, 32, 24), m); top.position.y = 1.08; g.add(top);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.8, .85, .14, 48), m); base.position.y = -.95; g.add(base);
    g.rotation.x = .25;
    return g;
  },
  // a cluster of soft bubbles: parts that hold together
  bubbles(){
    const g = new THREE.Group(), m = lacquer();
    [[0, 0, 0, .62], [.72, .38, -.1, .42], [-.62, .45, .1, .38], [.5, -.55, .2, .34], [-.45, -.6, -.1, .28], [.05, .82, -.2, .24]].forEach(([x, y, z, r]) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), m); s.position.set(x, y, z); g.add(s);
    });
    return g;
  },
  // a Newton's cradle: cause and effect, everything in the system touches
  cradle(){
    const g = new THREE.Group(), m = lacquer();
    const bar = new THREE.Mesh(new RoundedBoxGeometry(2.3, .14, .14, 4, .06), m); bar.position.y = 1.0; g.add(bar);
    [-1.12, 1.12].forEach(x => { const leg = new THREE.Mesh(new RoundedBoxGeometry(.12, 1.9, .12, 4, .05), m); leg.position.set(x, .08, 0); g.add(leg); });
    const foot = new THREE.Mesh(new RoundedBoxGeometry(2.5, .14, .7, 4, .06), m); foot.position.y = -.88; g.add(foot);
    [-.66, -.22, .22, .66].forEach((x, i) => {
      const lift = i === 0 ? -.55 : 0;
      const bx = x + (i === 0 ? -.35 : 0), by = -.25 + (i === 0 ? .12 : 0);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(.21, 40, 28), m); ball.position.set(bx, by, 0); g.add(ball);
      const len = Math.hypot(bx - x, 1.0 - by);
      const str = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, len, 8), m);
      str.position.set((bx + x) / 2, (by + 1.0) / 2, 0); str.rotation.z = -Math.atan2(bx - x, 1.0 - by) * -1; g.add(str);
    });
    g.rotation.y = .3; g.scale.setScalar(.92);
    return g;
  },
  // a spinning top: balance that holds while everything moves
  top(){
    const g = new THREE.Group(), m = lacquer();
    const prof = [[0, -1.1], [.12, -.95], [.55, -.35], [.82, -.02], [.8, .1], [.55, .22], [.18, .3], [.14, .75], [.18, .92], [0, .96]].map(([x, y]) => new THREE.Vector2(x, y));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 64), m));
    const band = new THREE.Mesh(new THREE.TorusGeometry(.8, .06, 16, 64), m); band.rotation.x = Math.PI / 2; band.position.y = .04; g.add(band);
    g.rotation.z = .18;
    return g;
  },
  // a falling row of dominoes: one move sets off the next
  dominoes(){
    const g = new THREE.Group(), m = lacquer(), geo = new RoundedBoxGeometry(.34, 1.1, .18, 4, .07);
    const dot = new THREE.SphereGeometry(.05, 16, 12);
    [0, 12, 26, 44].forEach((tilt, i) => {
      const d = new THREE.Group();
      const body = new THREE.Mesh(geo, m); body.position.y = .55; d.add(body);
      [[0, .82], [0, .28], [.0, .55]].slice(0, 2 + (i % 2)).forEach(([x, y]) => { const s = new THREE.Mesh(dot, m); s.position.set(x, y, .1); d.add(s); });
      d.position.set(-.9 + i * .52, -.6, 0); d.rotation.z = -tilt * Math.PI / 180;
      g.add(d);
    });
    g.rotation.y = -.5;
    return g;
  },
  // an hourglass: a lot flowing into one
  hourglass(){
    const g = new THREE.Group(), m = lacquer();
    const prof = [[0, -.95], [.55, -.92], [.6, -.75], [.5, -.4], [.14, -.04], [.14, .04], [.5, .4], [.6, .75], [.55, .92], [0, .95]].map(([x, y]) => new THREE.Vector2(x, y));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 64), m));
    [-1.02, 1.02].forEach(y => { const cap = new THREE.Mesh(new THREE.CylinderGeometry(.74, .74, .14, 48), m); cap.position.y = y; g.add(cap); });
    [[.62, 0], [-.31, .54], [-.31, -.54]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 2.04, 12), m); p.position.set(x, 0, z); g.add(p); });
    g.rotation.z = -.12;
    return g;
  },
  // an atom: everything turns around one idea
  atom(){
    const g = new THREE.Group(), m = lacquer();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(.46, 48, 32), m));
    // the orbit is a tube swept along an ellipse, so it keeps an even thickness all the way round
    const pts = [];
    for (let i = 0; i < 96; i++){ const a = i / 96 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * 1.1, Math.sin(a) * .44, 0)); }
    const orbit = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 160, .1, 20, true);
    [0, Math.PI / 3, -Math.PI / 3].forEach((rz, i) => {
      const ring = new THREE.Mesh(orbit, m); ring.rotation.z = rz; g.add(ring);
      const e = new THREE.Mesh(new THREE.SphereGeometry(.19, 32, 20), m);
      const a = i * 2.1; e.position.set(Math.cos(a) * 1.1, Math.sin(a) * .44, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), rz); g.add(e);
    });
    g.rotation.x = .35;
    return g;
  },
  // a magnifier: seeing the details of a system
  magnifier(){
    const g = new THREE.Group(), m = lacquer();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.62, .15, 32, 80), m); rim.position.set(-.25, .25, 0); g.add(rim);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .06, 64), new THREE.MeshPhysicalMaterial({color:0xffffff, metalness:0, roughness:.05, transmission:.9, thickness:.3, transparent:true, opacity:.35, clearcoat:1}));
    lens.rotation.x = Math.PI / 2; lens.position.copy(rim.position); g.add(lens);
    const handle = new THREE.Mesh(new RoundedBoxGeometry(.26, 1.0, .26, 6, .12), m);
    handle.position.set(.48, -.5, 0); handle.rotation.z = Math.PI / 4; g.add(handle);
    return g;
  },
  // a paper plane: an idea that takes off
  plane(){
    const g = new THREE.Group(), m = lacquer();
    const wing = (sign) => {
      const s = new THREE.Shape(); s.moveTo(1.3, 0); s.lineTo(-1.0, sign * .95); s.lineTo(-.55, 0); s.lineTo(1.3, 0);
      const geo = new THREE.ExtrudeGeometry(s, {depth:.06, bevelEnabled:true, bevelThickness:.03, bevelSize:.03, bevelSegments:3});
      const w = new THREE.Mesh(geo, m); w.rotation.x = sign * .35; return w;
    };
    g.add(wing(1), wing(-1));
    const keel = new THREE.Shape(); keel.moveTo(1.3, 0); keel.lineTo(-.9, 0); keel.lineTo(-.7, -.32); keel.lineTo(1.3, 0);
    const k = new THREE.Mesh(new THREE.ExtrudeGeometry(keel, {depth:.05, bevelEnabled:true, bevelThickness:.02, bevelSize:.02, bevelSegments:2}), m); k.position.z = -.02; g.add(k);
    g.rotation.set(-.9, .35, .35);
    return g;
  },
  // a soft cloud: the complicated made light
  cloud(){
    const g = new THREE.Group(), m = lacquer();
    [[0, .1, .6], [-.62, -.12, .44], [.62, -.1, .46], [-.25, .48, .4], [.32, .42, .38], [0, -.26, .5]].forEach(([x, y, r]) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), m); s.position.set(x, y, 0); s.scale.z = .8; g.add(s);
    });
    return g;
  },
  // a little key: finding the way into complex logic
  key(){
    const g = new THREE.Group(), m = lacquer();
    const bow = new THREE.Mesh(new THREE.TorusGeometry(.42, .14, 32, 64), m); bow.position.x = -.75; g.add(bow);
    const shaft = new THREE.Mesh(new RoundedBoxGeometry(1.5, .2, .2, 4, .08), m); shaft.position.x = .4; g.add(shaft);
    [[.75, -.2], [1.0, -.24]].forEach(([x, h]) => { const t = new THREE.Mesh(new RoundedBoxGeometry(.16, .36, .2, 4, .06), m); t.position.set(x, h, 0); g.add(t); });
    g.rotation.set(.3, .2, .55);
    return g;
  },
  // a faceted crystal: clear structure
  crystal(){
    const g = new THREE.Group();
    const mat = lacquer(); mat.flatShading = true;
    const c = new THREE.Mesh(new THREE.OctahedronGeometry(1.05, 0), mat); c.scale.set(.85, 1.25, .85); g.add(c);
    g.rotation.set(.2, .5, 0);
    return g;
  },
  // a hierarchy: one root, branches, leaves — the architecture of a system
  hierarchy(){
    const g = new THREE.Group(), m = lacquer(), node = new RoundedBoxGeometry(.5, .32, .32, 5, .12);
    const pts = [[0, .85], [-.7, .05], [.7, .05], [-1.05, -.75], [-.35, -.75], [.35, -.75], [1.05, -.75]];
    const links = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
    pts.forEach(([x, y], i) => { const n = new THREE.Mesh(node, m); n.position.set(x, y, 0); n.scale.setScalar(i === 0 ? 1.25 : i < 3 ? 1.05 : .9); g.add(n); });
    const up = new THREE.Vector3(0, 1, 0);
    links.forEach(([i, k]) => {
      const a = new THREE.Vector3(pts[i][0], pts[i][1], 0), b = new THREE.Vector3(pts[k][0], pts[k][1], 0);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, a.distanceTo(b), 12), m);
      rod.position.copy(a).add(b).multiplyScalar(.5); rod.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize()); g.add(rod);
    });
    return g;
  },
  // a flow: three steps joined by arrows, like a scenario diagram
  flow(){
    const g = new THREE.Group(), m = lacquer();
    const block = new RoundedBoxGeometry(.62, .62, .3, 6, .14);
    const xs = [-1.05, 0, 1.05];
    xs.forEach((x, i) => {
      const b = new THREE.Mesh(i === 1 ? new THREE.CylinderGeometry(.34, .34, .3, 48).rotateX(Math.PI / 2) : block, m);
      b.position.set(x, i === 1 ? .0 : (i === 0 ? .3 : -.3), 0); g.add(b);
    });
    [[-1.05, .3, 0, 0], [0, 0, 1.05, -.3]].forEach(([x1, y1, x2, y2]) => {
      const a = new THREE.Vector3(x1 + .36, y1, 0), b = new THREE.Vector3(x2 - .42, y2, 0);
      const len = a.distanceTo(b), dir = b.clone().sub(a).normalize();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, len, 12), m);
      shaft.position.copy(a).add(b).multiplyScalar(.5); shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); g.add(shaft);
      const head = new THREE.Mesh(new THREE.ConeGeometry(.1, .2, 20), m);
      head.position.copy(b).add(dir.clone().multiplyScalar(.06)); head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); g.add(head);
    });
    return g;
  },
  // stepped platforms: the levels of a system
  levels(){
    const g = new THREE.Group(), m = lacquer();
    [[1.9, -.55], [1.45, -.18], [1.0, .19], [.55, .56]].forEach(([w, y]) => {
      const s = new THREE.Mesh(new RoundedBoxGeometry(w, .26, w, 6, .08), m); s.position.y = y; g.add(s);
    });
    g.rotation.set(.5, .78, 0);
    return g;
  },
  // ---- the playlist: a vinyl record on the platter, the tonearm resting on it ----
  vinyl(){
    const g = new THREE.Group(), m = lacquer();
    const black = new THREE.MeshPhysicalMaterial({color:0x050507, metalness:0, roughness:.42, clearcoat:.7, clearcoatRoughness:.18, envMapIntensity:.55});
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, .08, 128), black); disc.rotation.x = Math.PI / 2; g.add(disc);
    // the grooves: fine raised rings that catch the light
    const groove = new THREE.MeshPhysicalMaterial({color:0x1d1e24, metalness:.5, roughness:.25, clearcoat:1, envMapIntensity:.7});
    [.62, .74, .86, .98, 1.1].forEach(r => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, .012, 8, 128), groove); t.position.z = .045; g.add(t); });
    // the label: the same pearl chrome as the other figures
    const label = new THREE.Mesh(new THREE.CylinderGeometry(.44, .44, .1, 64), m); label.rotation.x = Math.PI / 2; label.position.z = .01; g.add(label);
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .14, 24), black); hole.rotation.x = Math.PI / 2; g.add(hole);
    // the tonearm: a pivot at the top right, the arm across to the outer grooves
    const pivot = new THREE.Mesh(new THREE.CylinderGeometry(.16, .18, .22, 32), m); pivot.rotation.x = Math.PI / 2; pivot.position.set(1.3, 1.05, .14); g.add(pivot);
    const arm = new THREE.Mesh(new RoundedBoxGeometry(.09, 1.25, .08, 3, .035), m); arm.position.set(1.08, .45, .2); arm.rotation.z = .42; g.add(arm);
    const head = new THREE.Mesh(new RoundedBoxGeometry(.2, .32, .1, 3, .04), m); head.position.set(.82, -.12, .22); head.rotation.z = .42; g.add(head);
    g.userData.optical = 1.25; // the tonearm stretches the box, so the disc itself needs a little more
    return g;
  },

  // ---- systems thinking: complex in, simple out ----
  // a funnel: many balls go in the top, one comes out below
  stFunnel(){
    const g = new THREE.Group(), m = lacquer();
    const prof = [new THREE.Vector2(.14, -.95), new THREE.Vector2(.14, -.35), new THREE.Vector2(.95, .55), new THREE.Vector2(1.02, .62)];
    const cup = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), m); cup.material.side = THREE.DoubleSide; g.add(cup);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.0, .07, 16, 80), m); rim.rotation.x = Math.PI / 2; rim.position.y = .62; g.add(rim);
    const ball = new THREE.SphereGeometry(.2, 32, 20);
    [[-.4, .78, .1], [.05, .86, -.2], [.45, .76, .15], [-.1, .72, .4]].forEach(p => { const b = new THREE.Mesh(ball, m); b.position.set(...p); g.add(b); });
    const out = new THREE.Mesh(ball, m); out.position.set(0, -1.3, 0); g.add(out);
    g.rotation.x = .38;
    return g;
  },
  // a tangled knot that runs out into one straight line
  stKnot(){
    const g = new THREE.Group(), m = lacquer();
    const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(.62, .16, 200, 24, 2, 3), m); knot.position.x = -.45; g.add(knot);
    const line = new THREE.Mesh(new THREE.CapsuleGeometry(.16, 1.3, 8, 24), m); line.rotation.z = Math.PI / 2; line.position.set(.95, 0, 0); g.add(line);
    return g;
  },
  // a prism: scattered rays go in, one clean beam leaves
  stPrism(){
    const g = new THREE.Group(), m = lacquer();
    const tri = new THREE.Shape(); tri.moveTo(0, .85); tri.lineTo(.8, -.55); tri.lineTo(-.8, -.55); tri.lineTo(0, .85);
    const geo = new THREE.ExtrudeGeometry(tri, {depth:.5, bevelEnabled:true, bevelThickness:.08, bevelSize:.08, bevelSegments:6}); geo.center();
    g.add(new THREE.Mesh(geo, m));
    const ray = new THREE.CapsuleGeometry(.06, .7, 6, 16);
    [.35, 0, -.35].forEach((y, i) => { const r = new THREE.Mesh(ray, m); r.rotation.z = Math.PI / 2 + (i - 1) * .35; r.position.set(-1.05, y * .8, 0); g.add(r); });
    const beam = new THREE.Mesh(new THREE.CapsuleGeometry(.13, .8, 8, 20), m); beam.rotation.z = Math.PI / 2; beam.position.set(1.1, -.05, 0); g.add(beam);
    return g;
  },
  // a maze tile with one ball that has found its way out
  stMaze(){
    const g = new THREE.Group(), m = lacquer();
    const base = new THREE.Mesh(new RoundedBoxGeometry(2.0, 2.0, .18, 5, .14), m); g.add(base);
    const wall = (w, h, x, y) => { const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, .26, 3, .06), m); b.position.set(x, y, .2); g.add(b); };
    wall(1.7, .14, 0, .85); wall(.14, 1.2, -.85, .2); wall(1.2, .14, .25, .3); wall(.14, .9, .85, -.15); wall(1.1, .14, -.3, -.3); wall(.14, .5, -.3, -.6); wall(1.2, .14, .2, -.85);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.17, 32, 20), m); ball.position.set(-.6, -.62, .3); g.add(ball);
    g.userData.optical = .82; // a solid square reads heavier than open shapes
    g.rotation.x = -.15;
    return g;
  },
  // ---- design systems: parts made to be reused ----
  // the component mark: four diamonds round a centre
  dsComponent(){
    const g = new THREE.Group(), m = lacquer();
    const d = new RoundedBoxGeometry(.72, .72, .3, 5, .12);
    [[0, .62], [.62, 0], [0, -.62], [-.62, 0]].forEach(([x, y]) => { const b = new THREE.Mesh(d, m); b.position.set(x, y, 0); b.rotation.z = Math.PI / 4; g.add(b); });
    g.userData.optical = 1.22;
    return g;
  },
  // a fan of colour swatches, like a token palette
  dsSwatches(){
    const g = new THREE.Group(), m = lacquer();
    const tints = [0xE9EAF0, 0xC9CCD6, 0x9CA1AE, 0x3A3C45];
    const card = new RoundedBoxGeometry(.62, 1.9, .08, 4, .12);
    tints.forEach((c, i) => {
      const mat = i === 0 ? m : new THREE.MeshPhysicalMaterial({color:c, metalness:.6, roughness:.22, clearcoat:1, clearcoatRoughness:.08, iridescence:.6, iridescenceIOR:1.3});
      const p = new THREE.Group(), s = new THREE.Mesh(card, mat);
      s.position.y = .75; p.add(s); p.rotation.z = .55 - i * .36; p.position.set(0, -.85, i * .1); g.add(p);
    });
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .5, 24), m); pin.rotation.x = Math.PI / 2; pin.position.set(0, -.85, .2); g.add(pin);
    return g;
  },
  // the primitives: a sphere, a cube and a cone sharing one base
  dsPrimitives(){
    const g = new THREE.Group(), m = lacquer();
    const base = new THREE.Mesh(new RoundedBoxGeometry(2.4, .2, 1.1, 4, .08), m); base.position.y = -.62; g.add(base);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.38, 48, 32), m); ball.position.set(-.75, -.14, 0); g.add(ball);
    const box = new THREE.Mesh(new RoundedBoxGeometry(.7, .7, .7, 5, .1), m); box.position.set(0, -.17, 0); box.rotation.y = .5; g.add(box);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(.4, .85, 48), m); cone.position.set(.78, -.1, 0); g.add(cone);
    return g;
  },
  // a grid of tiles where every tile is the same part
  dsTiles(){
    const g = new THREE.Group(), m = lacquer();
    const tile = new RoundedBoxGeometry(.78, .78, .22, 5, .14), knob = new THREE.SphereGeometry(.17, 32, 20);
    [-.46, .46].forEach(x => [-.46, .46].forEach(y => {
      const t = new THREE.Mesh(tile, m); t.position.set(x, y, 0); g.add(t);
      const k = new THREE.Mesh(knob, m); k.position.set(x, y, .16); k.scale.z = .6; g.add(k);
    }));
    g.children[6].position.z = .35; g.children[7].position.z = .51; // one tile lifts out of the set
    return g;
  },
  // ---- AI prototyping: the sparkle with something to make ----
  sparkCode(){
    const g = new THREE.Group(), m = lacquer();
    const bar = new RoundedBoxGeometry(.2, .78, .2, 4, .09);
    [[-1, 1], [1, -1]].forEach(([side, tilt]) => {
      [1, -1].forEach(v => { const b = new THREE.Mesh(bar, m); b.position.set(side * .95, v * .27, 0); b.rotation.z = tilt * v * -.75; g.add(b); });
    });
    const slash = new THREE.Mesh(new RoundedBoxGeometry(.2, 1.35, .2, 4, .09), m); slash.rotation.z = -.38; g.add(slash);
    const s = sparkle(m, .42); s.position.set(1.05, .9, .15); g.add(s);
    return g;
  },
  sparkWindow(){
    const g = new THREE.Group(), m = lacquer();
    const frame = new THREE.Mesh(new RoundedBoxGeometry(2.1, 1.5, .2, 6, .16), m); g.add(frame);
    // the screen is rose gold too, a deeper satin tone so the bright star still stands out on it
    const dark = new THREE.MeshPhysicalMaterial({color:0xc98c78, metalness:.95, roughness:.38, clearcoat:.5, clearcoatRoughness:.2, envMapIntensity:1.6});
    const screen = new THREE.Mesh(new RoundedBoxGeometry(1.82, 1.08, .06, 4, .06), dark); screen.position.set(0, -.12, .1); g.add(screen);
    [-.78, -.62, -.46].forEach(x => { const d = new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 12), m); d.position.set(x, .6, .12); g.add(d); });
    const s = sparkle(m, .5); s.position.set(.1, -.12, .3); g.add(s);
    g.userData.optical = .94;
    return g;
  },
  sparkWand(){
    const g = new THREE.Group(), m = lacquer();
    const wand = new THREE.Mesh(new RoundedBoxGeometry(.18, 2.0, .18, 4, .08), m); wand.rotation.z = .7; wand.position.set(-.25, -.3, 0); g.add(wand);
    const s = sparkle(m, .55); s.position.set(.52, .52, .1); g.add(s);
    const s2 = sparkle(m, .22); s2.position.set(1.05, .05, .1); g.add(s2);
    const s3 = sparkle(m, .16); s3.position.set(.15, 1.15, .1); g.add(s3);
    return g;
  },
  sparkChat(){
    const g = new THREE.Group(), m = lacquer();
    const sh = new THREE.Shape(), w = 1.0, h = .72, r = .34;
    sh.moveTo(-w + r, -h); sh.lineTo(-.25, -h); sh.lineTo(-.55, -h - .38); sh.lineTo(-.45, -h);
    sh.lineTo(w - r, -h); sh.quadraticCurveTo(w, -h, w, -h + r); sh.lineTo(w, h - r); sh.quadraticCurveTo(w, h, w - r, h);
    sh.lineTo(-w + r, h); sh.quadraticCurveTo(-w, h, -w, h - r); sh.lineTo(-w, -h + r); sh.quadraticCurveTo(-w, -h, -w + r, -h);
    const geo = new THREE.ExtrudeGeometry(sh, {depth:.24, bevelEnabled:true, bevelThickness:.1, bevelSize:.08, bevelSegments:6, curveSegments:24}); geo.center();
    g.add(new THREE.Mesh(geo, m));
    const dark = new THREE.MeshPhysicalMaterial({color:0x1b1b22, metalness:.2, roughness:.35, clearcoat:1});
    const s = sparkle(dark, .42); s.position.set(0, .08, .26); g.add(s);
    return g;
  },
  // a building brick: components teams build from, no questions asked
  brick(){
    const g = new THREE.Group(), m = lacquer();
    const body = new THREE.Mesh(new RoundedBoxGeometry(2, .78, 1.1, 8, .14), m);
    g.add(body);
    // studs on top, two by two; each with a soft rounded rim
    const stud = new THREE.CylinderGeometry(.24, .24, .2, 48);
    const cap = new THREE.TorusGeometry(.21, .035, 16, 48); cap.rotateX(Math.PI / 2);
    [-.5, .5].forEach(x => [-.27, .27].forEach(z => {
      const s = new THREE.Mesh(stud, m); s.position.set(x, .49, z); g.add(s);
      const c = new THREE.Mesh(cap, m); c.position.set(x, .59, z); g.add(c);
    }));
    g.rotation.set(1.0, .62, 0);      // seen well from above, so the studs read
    g.scale.setScalar(1.12);
    return g;
  },
  // a pointer with a spark: a clickable prototype, made with AI
  cursor(){
    const g = new THREE.Group(), m = lacquer();
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(0, -1.9); s.lineTo(.48, -1.45); s.lineTo(.82, -2.2); s.lineTo(1.12, -2.06);
    s.lineTo(.8, -1.33); s.lineTo(1.42, -1.33); s.lineTo(0, 0);
    const arrow = new THREE.ExtrudeGeometry(s, Object.assign({depth:.24}, bevel)); arrow.center();
    const a = new THREE.Mesh(arrow, m); a.position.set(-.18, -.12, 0); g.add(a);
    const sp = new THREE.Shape(), r = .42, k = .05;
    sp.moveTo(0, r); sp.quadraticCurveTo(k, k, r, 0); sp.quadraticCurveTo(k, -k, 0, -r);
    sp.quadraticCurveTo(-k, -k, -r, 0); sp.quadraticCurveTo(-k, k, 0, r);
    const spark = new THREE.ExtrudeGeometry(sp, Object.assign({depth:.12}, bevel, {bevelSize:.03, bevelThickness:.05})); spark.center();
    const st = new THREE.Mesh(spark, m); st.position.set(.78, .86, .1); g.add(st);
    return g;
  },
  // the pen nib: the designer's own tool
  pen(){
    const s = new THREE.Shape();
    s.moveTo(0, -1.45);
    s.lineTo(.9, .15); s.quadraticCurveTo(.95, .3, .82, .42);
    s.lineTo(.52, .72); s.lineTo(.52, 1.25); s.lineTo(-.52, 1.25); s.lineTo(-.52, .72);
    s.lineTo(-.82, .42); s.quadraticCurveTo(-.95, .3, -.9, .15); s.lineTo(0, -1.45);
    const hole = new THREE.Path(); hole.absarc(0, .05, .17, 0, Math.PI * 2, true); s.holes.push(hole);
    const slot = new THREE.Path(); slot.moveTo(-.035, -.12); slot.lineTo(.035, -.12); slot.lineTo(.035, -1.05); slot.lineTo(-.035, -1.05); slot.lineTo(-.035, -.12); s.holes.push(slot);
    const geo = new THREE.ExtrudeGeometry(s, Object.assign({depth:.26}, bevel)); geo.center();
    const g = new THREE.Group(); const p = new THREE.Mesh(geo, lacquer()); p.rotation.z = -.5; g.add(p);
    g.userData.optical = 1.3;
    return g;
  }
};

/* One WebGL renderer for every figure on the page. Browsers keep only about
   sixteen WebGL contexts alive, so each figure draws through this shared
   renderer and copies the frame onto its own plain 2D canvas. */
let shared = null;
function getShared(){
  if (shared) return shared;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, preserveDrawingBuffer:true});
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  const pmrem = new THREE.PMREMGenerator(renderer);
  shared = {renderer, env:pmrem.fromScene(new RoomEnvironment(), .04).texture, dpr, w:0, h:0};
  pmrem.dispose();
  return shared;
}

/* the face area every figure is scaled to, and the longest side any may reach */
const WEIGHT = 2.5, REACH = 3.1;

function mount(host){
  const shape = host.dataset.shape;
  if (!builders[shape]) return;
  const card = host.closest('.card');
  const {renderer, env, dpr} = getShared();

  const canvas = document.createElement('canvas');
  canvas.className = 'glyph3d';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');

  const scene = new THREE.Scene();
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(30, 1, .1, 50);
  camera.position.set(0, 0, 9);

  // a key light from the upper left casts the shadow down and to the right, onto the card
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-2, 3, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 14;
  key.shadow.blurSamples = 16;
  key.shadow.bias = -.0005;
  Object.assign(key.shadow.camera, {left:-4, right:4, top:4, bottom:-4, near:1, far:20});
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe6ff, 1.4); rim.position.set(4, -1, -3); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, .25));

  // the card surface, invisible except for the shadow it receives
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({opacity:.18}));
  floor.position.z = -.8;
  floor.receiveShadow = true;
  scene.add(floor);

  const obj = builders[shape]();
  obj.traverse(o => { if (o.isMesh){ o.castShadow = true; } });
  // every figure gets the same visual weight: centre it, then scale it so its face covers
  // the same area, without letting a long thin one run past the others
  const box = new THREE.Box3().setFromObject(obj), dims = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
  // a figure drawn on the diagonal fills less of its box, so it may ask for a little more (userData.optical)
  const fit = Math.min(WEIGHT / Math.sqrt(dims.x * dims.y), REACH / Math.max(dims.x, dims.y)) * (obj.userData.optical || 1);
  const norm = new THREE.Group(); obj.position.sub(mid); norm.add(obj); norm.scale.setScalar(fit);
  const pivot = new THREE.Group(); pivot.add(norm); scene.add(pivot);

  host.appendChild(canvas);
  host.classList.add('is-3d');

  let w = 0, h = 0;
  const size = () => {
    w = canvas.clientWidth; h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    camera.aspect = w / h;
    // keep the object about the same share of the card at any size
    camera.position.z = 9 / Math.min(1, camera.aspect);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(size).observe(canvas);
  size();

  // the pointer over the card turns the object toward it; it eases, never jumps
  const aim = {x:0, y:0}, cur = {x:0, y:0};
  // a click spins the figure one full turn; the page keeps count and says so
  const spin = {v:0, t:0};
  host.style.cursor = 'pointer';
  host.addEventListener('click', () => {
    spin.t += Math.PI * 2;
    window.dispatchEvent(new CustomEvent('glyph-spin', {detail:{shape}}));
  });
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    aim.x = ((e.clientX - r.left) / r.width - .5) * 2;
    aim.y = ((e.clientY - r.top) / r.height - .5) * 2;
  });
  card.addEventListener('pointerleave', () => { aim.x = aim.y = 0; });

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(host);

  const seed = Math.random() * 10;
  figures.push(t => {
    if (!visible || !w || !h) return;
    cur.x += (aim.x - cur.x) * .1;
    cur.y += (aim.y - cur.y) * .1;
    const s = reduced ? 0 : t / 1000 + seed;
    // a slow sway and float of its own, plus the turn toward the pointer
    spin.v += (spin.t - spin.v) * .09;
    pivot.rotation.y = -.32 + Math.sin(s * .6) * .26 + cur.x * .55 + spin.v;
    pivot.rotation.x = -.18 + Math.cos(s * .5) * .1 + cur.y * .4;
    pivot.position.y = Math.sin(s * .9) * .06;
    // resizing the drawing buffer is costly, so it only ever grows to fit the largest figure;
    // each figure draws into its own corner of it (WebGL counts from the bottom left)
    const sh = getShared();
    if (w > sh.w || h > sh.h){ sh.w = Math.max(sh.w, w); sh.h = Math.max(sh.h, h); renderer.setSize(sh.w, sh.h, false); }
    renderer.setViewport(0, 0, w, h);
    renderer.render(scene, camera);
    const src = renderer.domElement;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(src, 0, src.height - canvas.height, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
  });
}

/* one loop draws every figure, at 30 frames a second: the motion is slow, so the eye
   can't tell, and it halves the work. Hidden tabs and off-screen figures cost nothing. */
const figures = [];
let lastFrame = 0;
function loop(t){
  requestAnimationFrame(loop);
  if (t - lastFrame < 32) return;
  lastFrame = t;
  for (const draw of figures) draw(t);
}


try {
  const probe = document.createElement('canvas');
  if (probe.getContext('webgl2') || probe.getContext('webgl')) { document.querySelectorAll('[data-shape]').forEach(mount); requestAnimationFrame(loop); }
} catch (e) { /* the SVG glyphs stay */ }
