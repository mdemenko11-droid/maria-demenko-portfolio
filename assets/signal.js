/* Signal: iridescent glass objects on black, the way the references show a single chrome mark.
   One WebGL renderer draws every object (the big "m." in the hero and the three small marks in "How I work")
   and copies each frame onto its own canvas, so the page holds one context. The colour in the glass comes
   from a studio of light strips (silver, white, ice blue, a faint rose) baked into the environment. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- the shared renderer and the light studio ---------- */
const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

function studio(){
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x020202);
  const strip = (color, w, h, x, y, z, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color, side:THREE.DoubleSide}));
    m.position.set(x, y, z); m.rotation.y = ry || 0; m.lookAt(0, 0, 0); s.add(m);
  };
  strip(new THREE.Color(4.2, 3.4, 3.6), 2.2, 14, -6, 0, 3);    // warm pearl, left
  strip(new THREE.Color(2.6, 1.5, 2), 2.2, 14, 6, 1, 2);       // dusky rose, right
  strip(new THREE.Color(3, 3, 3), 12, 1.2, 0, 6, 1);          // white bar above
  strip(new THREE.Color(2.4, .6, 1.2), 1.4, 10, 2, -2, -6);   // rose, behind
  strip(new THREE.Color(1.6, 1.6, 1.6), 8, 1, 0, -6, 2);      // soft floor bounce
  return s;
}
const pmrem = new THREE.PMREMGenerator(renderer);
const envMap = pmrem.fromScene(studio(), .02).texture;
pmrem.dispose();

/* liquid chrome with an oil-slick film: the references' glass reads as polished metal that splits the
   studio's strips into rainbow edges, not as clear glass (clear glass on black only shows grey) */
function glass(){
  return new THREE.MeshPhysicalMaterial({
    color:0xf4f4f6, metalness:1, roughness:.07,
    iridescence:1, iridescenceIOR:1.8, iridescenceThicknessRange:[180, 900],
    clearcoat:1, clearcoatRoughness:.03, envMapIntensity:1.9,
  });
}

/* light glass for the hero mark. Real transmission has nothing to refract over a transparent canvas and goes flat
   grey, so this fakes thin glass: a polished reflective surface whose opacity follows the fresnel term, so the
   edges stay bright and reflective while the faces that look at you go nearly clear and the type shows through. */
function lightGlass(){
  const m = new THREE.MeshPhysicalMaterial({
    color:0xfff4f7, metalness:1, roughness:.05, emissive:0x3a2c32, emissiveIntensity:1,
    iridescence:.6, iridescenceIOR:1.6, iridescenceThicknessRange:[200, 700],
    clearcoat:1, clearcoatRoughness:.02, envMapIntensity:2.6,
    transparent:true, depthWrite:false,
  });
  m.onBeforeCompile = s => {
    s.fragmentShader = s.fragmentShader.replace('#include <opaque_fragment>', `#include <opaque_fragment>
      float fr = pow(1.0 - abs(dot(normalize(vViewPosition), normalize(normal))), 1.1);
      gl_FragColor.a *= mix(0.4, 1.0, fr);`);
  };
  return m;
}

/* ---------- the objects ---------- */
// the logo "m." as glass tubes with round ends, traced from the site's own mark
function mark(){
  const g = new THREE.Group(), mat = lightGlass(), r = .26, S = .1;
  const P = (x, y) => new THREE.Vector3((x - 29) * S, (27 - y) * S, 0);
  const arch = (x0) => {
    const path = new THREE.CurvePath();
    path.add(new THREE.LineCurve3(P(x0, 38), P(x0, 26)));
    path.add(new THREE.CubicBezierCurve3(P(x0, 26), P(x0, 20), P(x0 + 4, 17), P(x0 + 8, 17)));
    path.add(new THREE.CubicBezierCurve3(P(x0 + 8, 17), P(x0 + 12, 17), P(x0 + 16, 20), P(x0 + 16, 26)));
    path.add(new THREE.LineCurve3(P(x0 + 16, 26), P(x0 + 16, 38)));
    return new THREE.Mesh(new THREE.TubeGeometry(path, 220, r, 40, false), mat);
  };
  g.add(arch(8), arch(24));
  const cap = new THREE.SphereGeometry(r, 40, 24);
  [8, 24, 40].forEach(x => { const m = new THREE.Mesh(cap, mat); m.position.copy(P(x, 38)); g.add(m); });
  const dot = new THREE.Mesh(new THREE.SphereGeometry(.4, 48, 32), mat); dot.position.copy(P(50, 35.5)); g.add(dot);
  return g;
}
// a four-point spark for AI prototyping
function spark(){
  const r = 1.1, k = .14, s = new THREE.Shape();
  s.moveTo(0, r); s.quadraticCurveTo(k, k, r, 0); s.quadraticCurveTo(k, -k, 0, -r); s.quadraticCurveTo(-k, -k, -r, 0); s.quadraticCurveTo(-k, k, 0, r);
  const geo = new THREE.ExtrudeGeometry(s, {depth:.32, bevelEnabled:true, bevelThickness:.16, bevelSize:.1, bevelSegments:10, curveSegments:48});
  geo.center();
  return new THREE.Mesh(geo, glass());
}
// four rounded tiles for design systems
function tiles(){
  const g = new THREE.Group(), mat = glass(), geo = new RoundedBoxGeometry(.82, .82, .4, 6, .16);
  [[-.47, .47], [.47, .47], [-.47, -.47], [.47, -.47]].forEach(([x, y]) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, 0); g.add(m); });
  return g;
}
// a knot for systems thinking: the tangle a system starts as
function knot(){
  return new THREE.Mesh(new THREE.TorusKnotGeometry(.62, .2, 220, 32, 2, 3), glass());
}

/* ---------- a view: one object, one canvas, its own camera ---------- */
const views = [];
function mount(canvas, build, opts = {}){
  const scene = new THREE.Scene();
  scene.environment = envMap;
  const obj = build();
  const pivot = new THREE.Group(); pivot.add(obj); scene.add(pivot);
  const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3());
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
  const fill = opts.fill || 1;
  const ctx = canvas.getContext('2d');
  const v = {canvas, ctx, scene, camera, pivot, w:0, h:0, seed:Math.random() * 10, aim:{x:0, y:0}, cur:{x:0, y:0}, visible:true, opts};
  v.size = () => {
    const dpr = renderer.getPixelRatio();
    v.w = canvas.clientWidth; v.h = canvas.clientHeight; if (!v.w || !v.h) return;
    canvas.width = Math.round(v.w * dpr); canvas.height = Math.round(v.h * dpr);
    camera.aspect = v.w / v.h;
    // fit the object's larger side into the canvas with a margin
    const fitH = size.y / fill, fitW = size.x / fill / camera.aspect, need = Math.max(fitH, fitW, size.z);
    camera.position.set(0, 0, need / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) + size.z);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(v.size).observe(canvas); v.size();
  new IntersectionObserver(([en]) => { v.visible = en.isIntersecting; }).observe(canvas);
  views.push(v);
  return v;
}

/* the pointer turns the hero mark a little, easing toward it */
if (fine) addEventListener('pointermove', e => {
  const x = e.clientX / innerWidth * 2 - 1, y = e.clientY / innerHeight * 2 - 1;
  views.forEach(v => { if (v.opts.follow){ v.aim.x = x; v.aim.y = y; } });
});

let maxW = 0, maxH = 0;
const t0 = performance.now();
function frame(t){
  requestAnimationFrame(frame);
  const s = reduced ? 0 : (t - t0) / 1000;
  views.forEach(v => {
    if (!v.visible || !v.w) return;
    v.cur.x += (v.aim.x - v.cur.x) * .06; v.cur.y += (v.aim.y - v.cur.y) * .06;
    const spin = v.opts.spin || .25;
    v.pivot.rotation.y = Math.sin(s * spin + v.seed) * (v.opts.sway || .55) + v.cur.x * .35;
    v.pivot.rotation.x = Math.cos(s * spin * .8 + v.seed) * .18 + v.cur.y * .2;
    v.pivot.position.y = Math.sin(s * .9 + v.seed) * .05;
    if (v.w > maxW || v.h > maxH){ maxW = Math.max(maxW, v.w); maxH = Math.max(maxH, v.h); renderer.setSize(maxW, maxH, false); }
    renderer.setViewport(0, 0, v.w, v.h);
    renderer.render(v.scene, v.camera);
    const src = renderer.domElement;
    v.ctx.clearRect(0, 0, v.canvas.width, v.canvas.height);
    v.ctx.drawImage(src, 0, src.height - v.canvas.height, v.canvas.width, v.canvas.height, 0, 0, v.canvas.width, v.canvas.height);
  });
}

/* ---------- hero alternatives to the mark (pick with ?hero=bolt|spark|ring|folder) ----------
   Crystal, after the reference's glass bolt: thick clear blocks with nearly sharp edges. Edges and side walls stay
   bright (fresnel-weighted opacity), the faces read as dark clear glass, a warm peach-amber glow sits inside, and
   fine glitter specks float in the volume. */
function crystal(glowAt = [.15, -.45], glowSize = 2, face = .35, glowK = .6, edge = 1, rim = .75){   // edge: opacity at the grazing sides; rim: their white light   // face: how much the flat faces cloud; glowK: inner warm light
  const m = new THREE.MeshPhysicalMaterial({
    color:0xffffff, metalness:1, roughness:.03, clearcoat:1, clearcoatRoughness:.01, envMapIntensity:3,
    transparent:true, depthWrite:false, side:THREE.DoubleSide,
  });
  m.onBeforeCompile = s => {
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLocal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLocal;')
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
        float fr = pow(1.0 - abs(dot(normalize(vViewPosition), normalize(normal))), 1.2);
        vec2 d = vLocal.xy - vec2(${glowAt[0].toFixed(2)}, ${glowAt[1].toFixed(2)});
        float glow = exp(-dot(d, d) * ${glowSize.toFixed(2)});
        gl_FragColor.rgb += vec3(1.0, 0.62, 0.4) * glow * ${glowK.toFixed(2)} + vec3(1.0, 0.97, 0.98) * pow(fr, 2.2) * ${rim.toFixed(2)};
        gl_FragColor.a *= clamp(mix(${face.toFixed(2)}, ${edge.toFixed(2)}, fr) + glow * ${(glowK * .75).toFixed(2)}, 0.0, 1.0);`);
  };
  return m;
}
// glitter: tiny bright specks scattered inside the given 2D outlines, through the thickness
function glitter(outlines, depth, count = 220, holes = []){
  const inside = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++){ const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const all = outlines.flat(), xs = all.map(p => p[0]), ys = all.map(p => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const pts = [];
  while (pts.length < count * 3){ const x = x0 + Math.random() * (x1 - x0), y = y0 + Math.random() * (y1 - y0); if (outlines.some(o => inside(x, y, o)) && !holes.some(o => inside(x, y, o))) pts.push(x, y, Math.random() * depth); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({color:0xfff4ea, size:.032, transparent:true, opacity:.9, depthWrite:false}));
}
// glitter with fixed places: a seeded random and a minimum gap between specks, so the scatter is the same on every
// visit and evenly spread (no clumps, no bare patches)
function glitterFixed(outlines, depth, count, holes = [], seed = 1, gap = .08, size = .032, opacity = .9){
  let a = seed >>> 0; const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const inside = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++){ const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const all = outlines.flat(), xs = all.map(p => p[0]), ys = all.map(p => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const pts = [], placed = [];
  for (let tries = 0; placed.length < count && tries < count * 400; tries++){
    const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0);
    if (!outlines.some(o => inside(x, y, o)) || holes.some(o => inside(x, y, o))) continue;
    if (placed.some(([px, py]) => Math.hypot(px - x, py - y) < gap)) continue;
    placed.push([x, y]); pts.push(x, y, rnd() * depth);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({color:0xfff4ea, size, transparent:true, opacity, depthWrite:false}));
}
const block = (poly, depth, bevel = .05) => { const s = new THREE.Shape(); s.moveTo(...poly[0]); poly.slice(1).forEach(p => s.lineTo(...p)); s.closePath();
  return new THREE.ExtrudeGeometry(s, {depth, bevelEnabled:true, bevelThickness:bevel, bevelSize:bevel, bevelSegments:4, curveSegments:32}); };
const centered = g => { const c = new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3()); g.children.forEach(m => m.position.sub(c)); return g; };

// the bolt as two thick blocks, after the reference: a parallelogram on top, an arrowed block below
function bolt(){
  const top = [[-.95, 1.12], [.82, 1.12], [.82, .2], [.1, .2]];
  const low = [[-.82, .08], [-.02, .08], [.8, -.6], [.1, -.6], [.04, -1.38], [-.82, -.48]];
  const g = new THREE.Group(), mat = crystal([.2, -.55], 2.2), D = .5;
  g.add(new THREE.Mesh(block(top, D), mat), new THREE.Mesh(block(low, D), mat), glitter([top, low], D));
  return centered(g);
}
// the four-point spark
function heroSpark(){
  const r = 1.25, k = .2, s = new THREE.Shape();
  s.moveTo(0, r); s.quadraticCurveTo(k, k, r, 0); s.quadraticCurveTo(k, -k, 0, -r); s.quadraticCurveTo(-k, -k, -r, 0); s.quadraticCurveTo(-k, k, 0, r);
  const g = new THREE.Group(), D = .45, poly = s.getPoints(48).map(p => [p.x, p.y]);
  g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(s, {depth:D, bevelEnabled:true, bevelThickness:.05, bevelSize:.05, bevelSegments:4, curveSegments:48}), crystal([.1, -.2], 2.4)), glitter([poly], D));
  return centered(g);
}
// a thick ring
function ring(){
  const m = new THREE.Mesh(new THREE.TorusGeometry(1, .34, 64, 180), crystal([.3, -.6], 1.4));
  m.rotation.x = .5; return m;
}
// a folder: the back with its tab, and the front pane forward
function folder(){
  const back = [[-1.2, -.85], [1.2, -.85], [1.2, .7], [-.25, .7], [-.45, .95], [-1.2, .95]];
  const front = [[-1.26, -.92], [1.26, -.92], [1.26, .5], [-1.26, .5]];
  const g = new THREE.Group(), mat = crystal([.2, -.5], 1.6), D = .22;
  const f = new THREE.Mesh(block(front, D), mat); f.position.z = .55;
  const gl = glitter([front], D, 160); gl.position.z = .55;
  g.add(new THREE.Mesh(block(back, D), mat), f, gl);
  return centered(g);
}
// a mouse pointer: the designer's own tool, cut from one thick block
function cursor(){
  const arrow = [[-.7, 1.2], [-.7, -.75], [-.27, -.36], [.04, -1.15], [.36, -1.01], [.06, -.26], [.62, -.26]];
  const g = new THREE.Group(), D = .5;
  g.add(new THREE.Mesh(block(arrow, D), crystal([-.35, .1], 1.8)), glitter([arrow], D, 200));
  return centered(g);
}
// three screens stacked in depth: the "simple screens" of the headline
function rounded(w, h, r, n = 6){
  const pts = [], c = [[w/2 - r, h/2 - r, 0], [-w/2 + r, h/2 - r, 1], [-w/2 + r, -h/2 + r, 2], [w/2 - r, -h/2 + r, 3]];
  c.forEach(([x, y, q]) => { for (let i = 0; i <= n; i++){ const a = (q + i / n) * Math.PI / 2; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } });
  return pts;
}
function layers(){
  const g = new THREE.Group(), pane = rounded(2.1, 1.4, .16), D = .1, mat = crystal([.1, -.3], 1.4);
  [[-.34, .3, -.6], [0, 0, 0], [.34, -.3, .6]].forEach(([x, y, z], i) => {
    const m = new THREE.Mesh(block(pane, D, .03), mat); m.position.set(x, y, z); g.add(m);
    if (i === 2){ const gl = glitter([pane], D, 140); gl.position.set(x, y, z); g.add(gl); }
  });
  return centered(g);
}
// a cut gem: flat facets catch the light strips one by one
function gem(){
  const geo = new THREE.IcosahedronGeometry(1.15, 0);
  geo.computeVertexNormals();
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, crystal([.1, -.35], 1.2)));
  return g;
}
// the letter m cut as lightning: each leg breaks with a bolt's step and ends in a sharp point, plus the brand dot
function boltM(){
  const m = [[-1.25, 1], [-.72, 1], [0, .12], [.72, 1], [1.25, 1],
    [1.15, .02], [1.38, .02], [.95, -1.1], [.78, -.12], [.58, -.12], [.7, .38],
    [0, -.55],
    [-.7, .38], [-.58, -.12], [-.78, -.12], [-.95, -1.1], [-1.38, .02], [-1.15, .02]];
  const g = new THREE.Group(), D = .45;
  g.add(new THREE.Mesh(block(m, D), crystal([.0, -.3], 1.3)), glitter([m], D, 240));
  const dot = new THREE.Mesh(new THREE.SphereGeometry(.24, 48, 32), crystal([0, -.1], 8));
  dot.position.set(1.8, -.86, D / 2); g.add(dot);
  return centered(g);
}
// the initials MD in thick crystal, set wide like the Archivo headings, the pair tilted at 45 degrees
function arcPts(cx, cy, r, a0, a1, n = 24){ const p = []; for (let i = 0; i <= n; i++){ const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; }
function initials(tilt, onlyM = false){
  const M = [[-1.55, -.6], [-1.55, .6], [-1.15, .6], [-.78, .04], [-.41, .6], [-.01, .6], [-.01, -.6], [-.35, -.6], [-.35, .1], [-.66, -.36], [-.9, -.36], [-1.21, .1], [-1.21, -.6]];
  const dOut = [[.17, -.6], [.95, -.6], ...arcPts(.95, 0, .6, -Math.PI / 2, Math.PI / 2), [.17, .6]];
  const dIn = [[.51, -.28], [.95, -.28], ...arcPts(.95, 0, .28, -Math.PI / 2, Math.PI / 2), [.51, .28]];
  const D = .42, mat = crystal([.1, -.35], 1.1);
  const shapeD = new THREE.Shape(); shapeD.moveTo(...dOut[0]); dOut.slice(1).forEach(q => shapeD.lineTo(...q)); shapeD.closePath();
  const hole = new THREE.Path(); hole.moveTo(...dIn[0]); dIn.slice(1).forEach(q => hole.lineTo(...q)); hole.closePath(); shapeD.holes.push(hole);
  const geoD = new THREE.ExtrudeGeometry(shapeD, {depth:D, bevelEnabled:true, bevelThickness:.05, bevelSize:.05, bevelSegments:4, curveSegments:32});
  const inner = new THREE.Group();
  if (onlyM) inner.add(new THREE.Mesh(block(M, D), mat), glitter([M], D, 180));
  else inner.add(new THREE.Mesh(block(M, D), mat), new THREE.Mesh(geoD, mat), glitter([M, dOut], D, 260, [dIn]));
  centered(inner);
  const outer = new THREE.Group(); outer.add(inner);
  if (tilt === 'turn') inner.rotation.y = -Math.PI / 4; else inner.rotation.z = Math.PI / 4;
  return outer;
}
// a crystal cube, turned on its corner so three faces catch the light; warm glow and specks inside
function cube(){
  const sq = [[-.8, -.8], [.8, -.8], [.8, .8], [-.8, .8]], D = 1.6;
  const inner = new THREE.Group();
  inner.add(new THREE.Mesh(block(sq, D, .08), crystal([.0, -.1], 3.2)), glitter([sq], D, 320));
  centered(inner);
  inner.rotation.set(.62, .785, 0);
  const outer = new THREE.Group(); outer.add(inner);
  return outer;
}
// more crystal objects for the hero
function wrapTilt(mesh, rx = 0, ry = 0, rz = 0){ const inner = new THREE.Group(); inner.add(mesh); inner.rotation.set(rx, ry, rz); const o = new THREE.Group(); o.add(inner); return o; }
// a knot: complex inside, one smooth line outside
function knotC(){ return wrapTilt(new THREE.Mesh(new THREE.TorusKnotGeometry(.8, .26, 240, 40, 2, 3), crystal([0, 0], .8)), .3, 0, 0); }
// a soft drop of liquid glass, its surface gently warped
function blob(){
  const g = new THREE.IcosahedronGeometry(1.1, 24), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++){ v.fromBufferAttribute(p, i); const n = v.clone().normalize();
    const k = 1 + .12 * Math.sin(n.x * 3.1 + 1.2) * Math.cos(n.y * 2.6) + .08 * Math.sin(n.z * 4.2 + n.y * 1.7);
    v.copy(n).multiplyScalar(1.1 * k); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals();
  return wrapTilt(new THREE.Mesh(g, crystal([.1, -.3], 1.2)));
}
// a twisted ribbon loop (a Moebius band): one surface, no inside or outside
function ribbon(){
  const seg = 260, w = 22, pos = [], idx = [];
  for (let i = 0; i <= seg; i++){ const u = i / seg * Math.PI * 2;
    for (let j = 0; j <= w; j++){ const t = (j / w - .5) * .9;
      const r = 1 + t * Math.cos(u / 2);
      pos.push(r * Math.cos(u), r * Math.sin(u), t * Math.sin(u / 2)); } }
  for (let i = 0; i < seg; i++) for (let j = 0; j < w; j++){ const a = i * (w + 1) + j, b = a + w + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return wrapTilt(new THREE.Mesh(g, crystal([0, -.4], 1)), .9, 0, .3);
}
// a thick lens: a disc with rounded rims, seen at an angle
function lens(){
  const pts = []; for (let i = 0; i <= 40; i++){ const a = -Math.PI / 2 + Math.PI * i / 40; pts.push(new THREE.Vector2(.95 + Math.cos(a) * .32, Math.sin(a) * .32)); }
  pts.unshift(new THREE.Vector2(0, -.32)); pts.push(new THREE.Vector2(0, .32));
  return wrapTilt(new THREE.Mesh(new THREE.LatheGeometry(pts, 96), crystal([0, 0], 1.4)), 1.05, 0, .35);
}
// a capsule pill, like the buttons, lying at a slant
function pill(){ return wrapTilt(new THREE.Mesh(new THREE.CapsuleGeometry(.5, 1.5, 16, 64), crystal([0, -.3], 1)), .3, 0, .9); }
// a thick rounded square of crystal with the About portrait inside it: the photo is a plane at mid-depth,
// so it turns and sways with the square
function slab(){
  const sq = rounded(2, 2, .3, 16), D = .38, g = new THREE.Group();
  const shape = new THREE.Shape(sq.map(p => new THREE.Vector2(...p)));
  // rounder, smoother edges: a deep bevel with many steps, vertices welded so the shading flows round it without bands
  let geo = new THREE.ExtrudeGeometry(shape, {depth:D, bevelEnabled:true, bevelThickness:.14, bevelSize:.12, bevelSegments:24, curveSegments:96});
  geo.deleteAttribute('uv'); geo.deleteAttribute('normal'); geo = mergeVertices(geo, 1e-4); geo.computeVertexNormals();
  // the star's glass, with clearer, glassier sides: lighter where they turn away, a crisper white rim, a touch of iridescence
  const gm = crystal([.1, -.2], 2.4, .3, .5, .55, 1.1); gm.iridescence = .5; gm.iridescenceIOR = 1.4; gm.clearcoatRoughness = 0;
  const glass = new THREE.Mesh(geo, gm); glass.renderOrder = 2;
  // specks as in the home star: the same glitter, scattered through the whole glass, only the face and neck kept clear
  const face = Array.from({length:32}, (_, i) => [Math.cos(i / 32 * Math.PI * 2) * .36, .14 + Math.sin(i / 32 * Math.PI * 2) * .54]);
  const specks = glitter([rounded(1.8, 1.8, .24)], D, 220, [face]); specks.renderOrder = 6;
  g.add(glass, specks);
  centered(g);
  const front = D / 2 + .14;
  // the photo, as it is (no tone or exposure from the glass scene), its shoulders fading out before the bottom edge
  const tex = new THREE.TextureLoader().load('assets/photo-hero.webp', () => document.querySelectorAll('.portrait').forEach(f => f.classList.add('is-3d')));
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const pm = new THREE.MeshBasicMaterial({map:tex, transparent:true, depthWrite:false, side:THREE.DoubleSide, toneMapped:false});
  pm.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n  diffuseColor.a *= smoothstep(0.04, 0.24, vMapUv.y);'); };
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), pm);
  photo.position.set(0, -.06, 0); photo.renderOrder = 5;   // set inside the glass (mid-depth), drawn last so it stays clear
  g.add(photo);

  return g;
}
const heroPick = new URLSearchParams(location.search).get('hero');
const heroBuilders = {cube, knotc:knotC, blob, ribbon, lens, pill, m45:() => initials(null, true), md:() => initials(), mdturn:() => initials('turn'), boltm:boltM, m:mark, bolt, spark:heroSpark, ring, folder, cursor, layers, gem};

const builders = {mark:heroBuilders[heroPick] || heroSpark, slab, spark, tiles, knot};
document.querySelectorAll('canvas[data-glass]').forEach(c => {
  const kind = c.dataset.glass;
  mount(c, builders[kind], kind === 'slab' ? {follow:true, fill:.96, spin:.18, sway:.2} : kind === 'mark' ? {follow:true, fill:.5, spin:.22, sway:(heroPick !== 'm' && heroPick !== 'ring' && heroPick !== 'gem') ? .28 : .55} : {fill:.82, spin:.35});
});
requestAnimationFrame(frame);
