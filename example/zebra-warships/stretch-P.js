// stretch-P.js — part 2, builder P (frames 1294–1577): "Back then, a torpedo was aimed by eye, exactly the same way. The stripes break up
// the bow and the stern, so the captain guesses the wrong direction, and the torpedo goes where the ship isn't."
// Same conventions as world.js / cast.js / stretch-D.js. index.html hands over its handles once (bind, at load: nothing is built);
// every prop and card is built lazily on the first P frame (build) and hidden by hide() through CARDS.
import * as THREE from 'three';
import { toon, put, tex, dazzleBlockTex } from './world.js';
import { buildSplash, buildArrow } from './props.js';
import { drawCaptain, CAPBOX } from './stretch-D.js';
import { drawPerson, BOXB } from './stretch-B.js';
import { INK } from './cast.js';
import { drawAimLine, drawTargetArt, buildTargetRing } from './stretch-N.js';   // N's rhyme: the same yellow dashed aim line and target ring

export const READY = true;
const clamp01 = t => Math.min(1, Math.max(0, t)), ss = t => (t = clamp01(t), t * t * (3 - 2 * t)), sst = t => (t = clamp01(t), t * t * t * (t * (t * 6 - 15) + 10));
const lerp = (a, b, t) => a + (b - a) * t;
const step = (keys, f) => { let v = keys[0][1]; for (const [k, x] of keys) if (k <= f) v = x; return v; };
const kf = (keys, f) => { if (f <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) { const [f0, a] = keys[i - 1], [f1, b] = keys[i], t = sst((f - f0) / (f1 - f0)); return Array.isArray(a) ? a.map((v, j) => lerp(v, b[j], t)) : lerp(a, b, t); } return keys[keys.length - 1][1]; };
// a pop: 0 before pf, overshoots to ~1.25 and rings down to 1 (the hull pops of shot 10, a little softer)
const popIn = (f, pf, k = .8) => f < pf ? 0 : 1 - Math.exp(-(f - pf) * k) * Math.cos((f - pf) * .9);

// ---------- handles from index.html ----------
let X = null;
export function bind(h) { X = h; window.__P = { shipW: f => shipW(f), shipPt: (...a) => shipPt(...a), shipC: f => shipC(f), subPt: (...a) => subPt(...a), RING_R, RING_L, RW: () => RW(), torpW: f => torpW(f), X, waterY }; return []; }   // window.__P: debug handles   // returns no shots: it only sits in the SH table so the handles exist before the first P frame

// ---------- the sea's own surface (places.js makeWater, swell 2.2, a 20 m grid): bilinear between the grid points the mesh really has ----------
const seaH = (x, z, f) => 2.2 * (.09 * Math.sin(x * .09 + f * .07) + .07 * Math.sin(z * .13 - f * .05 + x * .03));
function waterY(x, z, f) { const gx = (x + 1500) / 20, gz = (z + 1500) / 20, i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, x0 = -1500 + 20 * i, z0 = -1500 + 20 * j;
  return lerp(lerp(seaH(x0, z0, f), seaH(x0 + 20, z0, f), u), lerp(seaH(x0, z0 + 20, f), seaH(x0 + 20, z0 + 20, f), u), v); }

// ---------- the striped ship (SEA.target) on my clock: S-local; heading HEAD6 (its local +x), its +z side faces the sub ----------
const VS = .3;   // m per frame (slower than 6p's .5: the bow and the stern must both stay readable in the scope)
const shipC = f => X.TGT0.clone().addScaledVector(X.HEAD6, VS * (f - 1340));
const RY = .5, CR = Math.cos(RY), SR = Math.sin(RY);
const shipPt = (f, x, y, z, C = shipC) => C(f).add(new THREE.Vector3(x * CR + z * SR, y, -x * SR + z * CR));   // ship-local → S-local
// the two rings (S-local, on the water): the right lead, 16 m ahead of the bow; the wrong one, 14 m astern of the stern
const RING_R = () => shipPt(1420, 26, 0, 0), RING_L = () => shipPt(1492, -34, 0, 0);

// ---------- the sub (outside, place S): it lies where the scope looks from, bow toward the ship ----------
const SUB0 = () => new THREE.Vector3(-470, 0, 40), subDir = () => { const d = shipC(1420).sub(SUB0()); d.y = 0; return d.normalize(); };
const SUBV = .2;   // m per frame, awash
function subPt(f, x, y, z) { const d = subDir(), r = new THREE.Vector3(-d.z, 0, d.x); return SUB0().addScaledVector(d, x + SUBV * (f - 1290)).addScaledVector(r, z).add(new THREE.Vector3(0, y, 0)); }
// the torpedo: out of the bow tube on "torpedo" (1314), a porpoise leap (1314–1323), then a straight run under the surface at 1.6 m/f
const TF = 1314, TJ = 10, TV = 1.6, TX0 = 20.5;
const torpX = f => TX0 + TV * (f - TF);

// ---------- build: everything new, once, on the first P frame ----------
let B = null;
function cardProp(o) { return { root: o, blob: { visible: false }, paint() {} }; }
function build() {
  if (B) return B;
  const { S, SEA, card, CARDS } = X;
  B = { want: false };
  // the captain, my own acting (drawCaptain, the same man as CAPT)
  B.capt = card('captainP', drawCaptain, CAPBOX, capPose); CARDS.push(B.capt);
  // the sub outside
  B.sub = buildUBoat(); SEA.group.add(B.sub.group); CARDS.push(cardProp(B.sub.group));
  B.torp = buildTorpedo(); SEA.group.add(B.torp); CARDS.push(cardProp(B.torp));
  B.wake = buildWake(); SEA.group.add(B.wake.mesh); CARDS.push(cardProp(B.wake.mesh));
  B.spl = [0, 1].map(() => { const s = buildSplash(); s.group.scale.setScalar(.28); SEA.group.add(s.group); CARDS.push(cardProp(s.group)); return s; });
  // the masks that eat the bow and the stern (on the target's +z side), and the HUD (lead line, rings) for the scope
  B.masks = buildMasks(SEA.target); B.masks.forEach(m => CARDS.push(cardProp(m)));
  B.hud = buildHud(); S.add(B.hud.mesh); CARDS.push(cardProp(B.hud.mesh));
  B.arrow = buildArrow(); S.add(B.arrow); CARDS.push(cardProp(B.arrow));
  // the high wide: the wrong ring on the water, three sailors at the stern rail
  B.ringN = buildTargetRing(2); SEA.group.add(B.ringN.group); CARDS.push(cardProp(B.ringN.group));
  B.head = buildTorpHead(); SEA.group.add(B.head); CARDS.push(cardProp(B.head));
  B.puffs = []; X.SMOKE.group.traverse(o => { if (o.isMesh && o.material?.color?.getHex() === 0x9a97a4) B.puffs.push(o); });
  B.sail = ['s0', 's1', 's2'].map(k => card(k, drawPerson, BOXB.person, sailorPose)); CARDS.push(...B.sail);
  // the target's dazzle materials: brightened on "break" in my scope frames only; put back on every other render
  B.dz = SEA.target.swaps.map(s => s[2]);
  { const o = S.onBeforeRender; S.onBeforeRender = (...a) => { if (!B.want) { for (const m of B.dz) m.color.setScalar(1); SEA.target.group.scale.setScalar(1); } B.want = false; o(...a); }; }
  return B;
}

/* ---------- the U-boat outside: a long grey-green hull awash, the casing deck, the conning tower with "U 9", the periscope up, the jumping wire. Local +x = bow. ---------- */
function buildUBoat() {
  const g = new THREE.Group();
  const hull = toon({ color: 0x55605f }), casing = toon({ color: 0x737b7b }), tower = toon({ color: 0x69726f }), dark = toon({ color: 0x2c3036 }), foam = toon({ color: 0xeef3f6 }), red = toon({ color: 0xa8473a });
  put(g, new THREE.CapsuleGeometry(1.55, 40, 8, 24), hull, { pos: [0, -.95, 0], rot: [0, 0, Math.PI / 2], scale: [1, 1, .95], outline: 2.2, edges: false });
  put(g, new THREE.BoxGeometry(34, .42, 1.9), casing, { pos: [-1, .5, 0], outline: 1.8 });
  // the raked stem: a blade from the forefoot up to the casing, the bow's profile above the water
  put(g, new THREE.BoxGeometry(6.5, 1.5, .5), casing, { pos: [18.6, .15, 0], rot: [0, 0, -.2], outline: 1.8 });
  put(g, new THREE.BoxGeometry(2.2, .9, .32), casing, { pos: [21.6, .1, 0], rot: [0, 0, -.55], outline: 1.6 });
  // the conning tower: a box with a round front, a bridge rail, the number
  put(g, new THREE.BoxGeometry(4.6, 2.1, 1.9), tower, { pos: [-.4, 1.75, 0], outline: 2 });
  put(g, new THREE.CylinderGeometry(.95, .95, 2.1, 20), tower, { pos: [1.9, 1.75, 0], outline: 2, edges: false });
  put(g, new THREE.BoxGeometry(5.0, .12, 1.95), casing, { pos: [-.2, 2.86, 0], outline: 1.4 });
  const num = tex(256, 128, (c, W, H) => { c.font = '800 92px Montserrat, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 10; c.strokeStyle = '#1c1118'; c.strokeText('U 9', W / 2, H / 2 + 4); c.fillStyle = '#ece6d6'; c.fillText('U 9', W / 2, H / 2 + 4); });
  num.wrapS = num.wrapT = THREE.ClampToEdgeWrapping;
  put(g, new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshToonMaterial({ map: num, transparent: true, alphaTest: .4 }), { pos: [-.4, 1.75, .96], outline: 0, edges: false, shadow: false });
  // the periscope standard and the raised periscope, its head turned to the bow
  put(g, new THREE.CylinderGeometry(.22, .3, 1.2, 12), tower, { pos: [.6, 3.4, 0], outline: 1.8, edges: false });
  put(g, new THREE.CylinderGeometry(.11, .11, 2.6, 12), casing, { pos: [.6, 5.2, 0], outline: 2, edges: false });
  put(g, new THREE.CylinderGeometry(.13, .13, .1, 12), red, { pos: [.6, 4.4, 0], outline: 1.4, edges: false });
  put(g, new THREE.BoxGeometry(.38, .34, .28), casing, { pos: [.66, 6.6, 0], outline: 2 });
  // a deck gun forward of the tower
  put(g, new THREE.CylinderGeometry(.28, .36, .7, 12), dark, { pos: [6.2, 1.05, 0], outline: 1.6, edges: false });
  put(g, new THREE.CylinderGeometry(.08, .1, 2.4, 10), dark, { pos: [7.2, 1.45, 0], rot: [0, 0, Math.PI / 2 - .12], outline: 1.4, edges: false });
  // the jumping wire: stem → periscope standard → stern
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([[22.4, .7, 0], [.6, 4.0, 0], [.6, 4.0, 0], [-19, .9, 0]].map(p => new THREE.Vector3(...p))), new THREE.LineBasicMaterial({ color: INK })));
  // foam along the waterline and a bow wave at the stem (it is under way)
  const bow = [];
  for (const [x, z, r] of [[21.2, 0, .9], [20, .9, .8], [20, -.9, .8], [17.5, 1.4, .7], [17.5, -1.4, .7], [14, 1.6, .55], [14, -1.6, .55], [9, 1.65, .45], [-6, 1.6, .45], [-14, 1.4, .5], [-19, .6, .7]])
    bow.push(put(g, new THREE.SphereGeometry(r, 10, 7), foam, { pos: [x, .02, z], scale: [1.5, .42, 1], outline: 1.2, edges: false }));
  return { group: g, bow, update(f) { bow.forEach((m, i) => { const k = 1 + .15 * Math.sin(f * .5 + i * 1.9); m.scale.set(1.5 * k, .42 * (2 - k), k); }); } };
}
function buildTorpedo() {   // 6 m, steel with a bronze warhead, a two-bladed screw; local +x = nose
  const g = new THREE.Group();
  put(g, new THREE.CapsuleGeometry(.27, 5.4, 6, 16), toon({ color: 0x8a9096 }), { rot: [0, 0, Math.PI / 2], outline: 1.8, edges: false });
  put(g, new THREE.CapsuleGeometry(.275, .9, 6, 16), toon({ color: 0xc09048 }), { pos: [2.6, 0, 0], rot: [0, 0, Math.PI / 2], outline: 0, edges: false });
  for (const a of [0, Math.PI / 2]) put(g, new THREE.BoxGeometry(.06, .7, .14), toon({ color: 0xc09048 }), { pos: [-3.05, 0, 0], rot: [a, 0, 0], outline: 1.2 });
  return g;
}
// the torpedo seen from high up: a small dark body awash at the head of the wake (local +x = nose)
function buildTorpHead() { const g = new THREE.Group(); put(g, new THREE.CapsuleGeometry(.3, 2.2, 6, 12), toon({ color: 0x3a3744 }), { rot: [0, 0, Math.PI / 2], outline: 1.6, edges: false }); g.visible = false; return g; }
// a foam wake: a strip on the water from tail to head, wide and broken at the tail, a tight white line at the head
function buildWake() {
  const N = 48, pos = new Float32Array((N + 1) * 2 * 3), uv = [], idx = [];
  for (let i = 0; i <= N; i++) uv.push(i / N, 0, i / N, 1);
  for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array((N + 1) * 6).map((_, i) => i % 3 === 1 ? 1 : 0), 3));   // flat on the water: lit from above
  const t = tex(1024, 128, (c, W, H) => { c.clearRect(0, 0, W, H); let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 520; i++) { const u = r(), x = u * W, sp = (.12 + .38 * (1 - u)) * H, y = H / 2 + (r() - .5) * 2 * sp, rad = 3 + r() * (4 + 9 * (1 - u));
      c.fillStyle = `rgba(242,247,249,${.55 + .45 * u})`; c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill(); }
    const gr = c.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(240,246,248,0)'); gr.addColorStop(.25, 'rgba(240,246,248,.5)'); gr.addColorStop(1, 'rgba(250,252,253,1)');
    c.fillStyle = gr; c.fillRect(0, H * .4, W, H * .2); });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const mat = new THREE.MeshBasicMaterial({ map: t, color: 0xeef6fb, alphaTest: .3, depthWrite: false, fog: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n  gl_FragColor.a = .5;'); };   // the card flag: white foam stays white (graded, the half-alpha edges went mauve)
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false; m.receiveShadow = true; m.renderOrder = 3;
  // a, b: S-local tail and head; w0, w1: widths there (m)
  return { mesh: m, set(a, b, f, w0 = 3, w1 = .7) { const d = b.clone().sub(a); d.y = 0; const L = d.length(); if (L < .01) { m.visible = false; return; } d.normalize(); const r = new THREE.Vector3(-d.z, 0, d.x);
    for (let i = 0; i <= N; i++) { const u = i / N, p = a.clone().addScaledVector(d, L * u), w = lerp(w0, w1, u) / 2, y = .12;
      const l = p.clone().addScaledVector(r, -w), q = p.clone().addScaledVector(r, w);
      pos.set([l.x, waterY(l.x, l.z, f) + y, l.z, q.x, waterY(q.x, q.z, f) + y, q.z], i * 6); }
    geo.attributes.position.needsUpdate = true; geo.computeBoundingSphere(); m.visible = true; } };
}
// the zigzag masks: flat dazzle panels a hand's breadth off the +z side, with a sawtooth outline; each grows out of the hull on its beat
function buildMasks(ship) {
  const mk = (seed, flip) => tex(512, 384, (c, W, H) => { c.save(); c.beginPath();
      // sawtooth silhouette: the outer edge (x = W) and the top are teeth, the inner edge (x = 0) is straight
      c.moveTo(0, H); c.lineTo(0, H * .12); for (let i = 0; i <= 6; i++) c.lineTo(W * i / 6 * .92, H * (i % 2 ? .02 : .14));
      for (let j = 0; j <= 8; j++) c.lineTo(W * (j % 2 ? 1 : .82), H * (.06 + .94 * j / 8)); c.closePath(); c.clip();
      c.fillStyle = '#ece9e3'; c.fillRect(0, 0, W, H); c.fillStyle = '#4d4945';
      for (let k = -8; k < 14; k++) { c.beginPath(); const x = k * 70 + (seed % 3) * 9; c.moveTo(x, 0); c.lineTo(x + 38, 0); c.lineTo(x + 38 - 150, H); c.lineTo(x - 150, H); c.closePath(); c.fill(); }
      c.restore(); c.lineWidth = 7; c.strokeStyle = '#1c1118'; c.beginPath(); c.moveTo(0, H * .12); for (let i = 0; i <= 6; i++) c.lineTo(W * i / 6 * .92, H * (i % 2 ? .02 : .14));
      for (let j = 0; j <= 8; j++) c.lineTo(W * (j % 2 ? 1 : .82), H * (.06 + .94 * j / 8)); c.stroke();
      if (flip) { const d = c.getImageData(0, 0, W, H), o = c.createImageData(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let k = 0; k < 4; k++) o.data[(y * W + x) * 4 + k] = d.data[(y * W + W - 1 - x) * 4 + k]; c.putImageData(o, 0, 0); } });
  const out = [];
  for (const [x0, w, y0, h, flip, seed] of [[12, 17, -1.2, 10, false, 2], [-12, 17, -1.2, 10, true, 2]]) {   // the same panel, mirrored: both ends read alike
    const t = mk(seed, flip); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    const geo = new THREE.PlaneGeometry(w, h); geo.translate(flip ? -w / 2 : w / 2, h / 2, 0);
    const piv = new THREE.Group(); piv.position.set(x0, y0, 3.75); ship.group.add(piv);
    const m = new THREE.Mesh(geo, toon({ map: t, alphaTest: .5, side: THREE.DoubleSide })); m.receiveShadow = true; piv.add(m);
    piv.visible = false; out.push(piv); }
  return out;
}
// the HUD: one full-frame canvas at the focus distance, unprojected from the frame corners (lens shift included); ungraded like a card
function buildHud() {
  const c = document.createElement('canvas'); c.width = 720; c.height = 1280; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: t, alphaTest: .3, depthTest: false, depthWrite: true, fog: false, side: THREE.DoubleSide });
  mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n  gl_FragColor.a = .5;'); };   // the card flag: no grade
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 0, 0, 1, 0], 2)); geo.setIndex([0, 2, 1, 1, 2, 3]);
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 60;
  return { mesh, g, t, place(cam, D) { const z = new THREE.Vector3(0, 0, -D).applyMatrix4(cam.projectionMatrix).z, P = geo.attributes.position;
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([x, y], i) => { const v = new THREE.Vector3(x, y, z).unproject(cam); P.setXYZ(i, v.x, v.y, v.z); }); P.needsUpdate = true; mesh.visible = true; } };
}

/* ---------- the captain's acting (new frames). at = 1: his eye at the cup. ---------- */
const PFACE = [[0, 'squint/smile/smirk/0'], [1348, 'shut/bite/angry/0'], [1366, 'squint/line/flat/0'], [1388, 'squint/smile/smirk/0'], [1416, 'ring/line/raised/0'],
  [1429, 'ring/bite/worried/0'], [1458, 'half/line/flat/0'], [1477, 'half/smile/smirk/0']];
const PBLINK = [1338, 1404, 1468];
const GRIP = { at: [-120, -435] };
export function capPose(who, f) {
  let [eyes, mouth, brows, open] = step(PFACE, f).split('/'); for (const a of PBLINK) { const k = f - a; if (k >= 0 && k <= 3) eyes = k === 0 || k === 3 ? 'half' : 'line'; }
  const at = 1 - .62 * ss((f - 1458) / 9);
  // the eye darts: to the bow (1431), to the stern (1443), back (1450)
  const look = f >= 1429 && f < 1458 ? (f < 1441 ? [.7, -.05] : f < 1450 ? [-1, -.05] : [0, 0]) : at > .5 ? [-1, 0] : [.3, .05];
  const face = { eyes, mouth, brows, open: +open || 0, look, fx: lerp(8, -24, at) };
  const br = Math.sin(f * .2), push = ss((f - 1344) / 4) * (1 - ss((f - 1360) / 8));   // "eye" (1348): he presses into the cup
  const jolt = f >= 1416 && f < 1426 ? Math.sin(Math.PI * (f - 1416) / 10) : 0;          // "break": a start
  const nod = (f >= 1477 && f < 1487 ? Math.sin(Math.PI * (f - 1477) / 10) : 0) + .6 * (f >= 1488 && f < 1496 ? Math.sin(Math.PI * (f - 1488) / 8) : 0);   // "guesses": a confident nod, and a second
  const dart = f >= 1429 && f < 1452 ? Math.sin((f - 1429) * .55) : 0;
  const headX = lerp(20, -50, at) - 8 * push + 5 * dart + 6 * Math.sin(f * .1) * (1 - at), lean = lerp(.035, -.05, at) - .012 * push + .01 * br + .02 * jolt;
  const headTilt = lerp(.04, -.06, at) + .05 * jolt + .05 * nod + (f >= 1477 ? .03 * ss((f - 1477) / 6) : 0), headY = -3 * br - 9 * jolt + 15 * nod;
  const gh = GRIP.at, armL = { s: [-54, -411], c: [-150, -330], h: gh }, armR = { s: [54, -411], c: [128, -337], h: [84, -271] };
  return { face, headX, headY, headTilt, lean, armL, armR };
}
// the sailors at the stern rail: they watch the wake come in (alarm, from "torpedo" 1522), lean over as it nears, and wave it past on "isn't" (1561)
const S_L = [-56, -414], S_R = [56, -414];
export function sailorPose(who, f) {
  const i = +who.slice(1), kind = ['cap', 'cap', 'sou'][i], d = i * 2;
  const fc = f < 1522 + d ? 'half/line/flat/0' : f < 1561 + d ? 'ring/dot/raised/0' : 'squint/smile/laugh/0';
  let [eyes, mouth, brows] = fc.split('/'); for (const a of [1530 + 3 * i, 1548 - i]) { const k = f - a; if (k >= 0 && k <= 3 && f < 1561) eyes = k === 0 || k === 3 ? 'half' : 'line'; }
  const look = f < 1522 + d ? [.5, .3] : f < 1561 ? [-.4 - .3 * i, .45] : [-.8, .3];
  const lean = f < 1530 ? .02 * Math.sin(f * .15 + i) : f < 1561 ? -.06 * ss((f - 1530) / 12) : -.06 + .1 * ss((f - 1561) / 6);
  let armL = { s: S_L, c: [-110, -330], h: [-120, -250] }, armR = { s: S_R, c: [110, -330], h: [120, -250] };   // hands on the rail
  if (f >= 1561 + d) { const k = Math.sin((f - 1561 - d) * .75 + i), u = ss((f - 1561 - d) / 4);
    armR = { s: S_R, c: [lerp(110, 150 - 20 * k, u), lerp(-330, -540, u)], h: [lerp(120, 130 - 30 * k, u), lerp(-250, -700, u)] };
    if (i !== 1) armL = { s: S_L, c: [lerp(-110, -150 - 20 * k, u), lerp(-330, -540, u)], h: [lerp(-120, -130 - 30 * k, u), lerp(-250, -700, u)] }; }
  else if (f >= 1540 && i === 1) { const u = ss((f - 1540) / 5); armR = { s: S_R, c: [lerp(110, 190, u), lerp(-330, -440, u)], h: [lerp(120, 290, u), lerp(-250, -470, u)], finger: .5 }; }   // the middle one points at it
  return { kind, face: { eyes, mouth, brows, open: 0, look, fx: look[0] * 14 }, armL, armR, lean, headY: f >= 1561 + d ? -8 * Math.abs(Math.sin((f - 1561) * .5)) : 0, headTilt: f >= 1561 ? -.05 : .03 * i };
}

/* ======================= the shots ======================= */
// ---- P0: the launch (S). Low beside the sub's conning tower, looking along the casing at the striped ship on the horizon. ----
const KL = [[1290, -30, 7.6, 4.8, 40, 0, -3, 34], [1312, -25, 7.1, 4.5, 40, 0, -3, 33.5], [1332, -16, 6.4, 4.1, 55, 0, -2.6, 31]];
export function camLaunch(f) { const k = kf(KL.map(r => [r[0], r.slice(1)]), f), a = X.SL(subPt(f, k[0], k[1], k[2]).toArray()), b = X.SL(subPt(f, k[3], k[4], k[5]).toArray());
  const sw = .3 * Math.sin((f - 1290) * .16), rl = .25 * Math.sin((f - 1290) * .11 + 1); return [f, a.x + rl, a.y + sw, a.z, b.x, b.y + sw * .4, b.z, k[6], 0, 0]; }   // a camera on the water: heave and sway
export const focLaunch = () => { const h = X.SL(subPt(TF, Math.min(torpX(Math.max(TF, curF)) + 2, 60), .3, 0).toArray()); return X.fz(h); };
let curF = 1290;
export function stageLaunch(f) {
  const b = build(); B.want = true; curF = f; const { SEA } = X;
  stageShipBase(f);
  // the sub, riding the swell
  const c = subPt(f, 0, 0, 0), g = b.sub.group, d = subDir(); g.visible = true;
  g.position.set(c.x, waterY(c.x, c.z, f) * .6 - .05, c.z); g.rotation.set(0, Math.atan2(-d.z, d.x), 0); g.rotateZ(.012 * Math.sin(f * .09)); b.sub.update(f);
  // the launch: a burst of foam at the stem, the torpedo leaps and dives, then the wake runs on ahead
  b.spl[0].group.position.copy(subPt(f, 21.5, 0, 0)); b.spl[0].set((f - TF + 1) / 16);
  const xe = torpX(TF + TJ); b.spl[1].group.position.copy(subPt(f, xe, 0, 0)); b.spl[1].set((f - TF - TJ) / 14);
  const tj = (f - TF) / TJ;
  if (tj >= 0 && tj <= 1) { const x = torpX(f), y = -.55 + 2.8 * Math.sin(Math.PI * tj), dy = 2.8 * Math.PI * Math.cos(Math.PI * tj) / TJ / TV; const p = subPt(f, x, y, 0);
    b.torp.visible = true; b.torp.position.copy(p); b.torp.rotation.set(0, Math.atan2(-d.z, d.x), 0); b.torp.rotateZ(Math.atan(dy)); }
  if (f > TF + TJ - 1) b.wake.set(subPt(f, Math.max(xe - 2, torpX(f) - 60), 0, 0), subPt(f, torpX(f) + 2.5, 0, 0), f, 3.2, .9);
}
// the striped ship's own state in every S frame of mine: dazzled, under way on my clock, smoking, pitching
function stageShipBase(f, C = shipC, lean = 1) { const { SEA, SMOKE } = X, p = C(f); SEA.target.setDazzle(true); SEA.target.group.position.set(p.x, SEA.target.group.position.y, p.z); SMOKE.want = true; SMOKE.update(f); smokeLean(lean); SEA.target.group.rotation.z = .02 * Math.sin(f * .2 + .8); }
// the puffs drift aft .42 m and up .11 m per frame of age (stretch-D rigTarget; age = z / .1): m scales the aft drift (0 = straight up, so nothing gives her heading away)
function smokeLean(m) { if (m === 1 || !B) return; for (const o of B.puffs) { const a = o.position.z / .1; o.position.x += a * .42 * (1 - m); o.position.y += a * .05 * (1 - Math.min(m, 1)); } }

// ---- Pe: the captain (U). From the medium (u .6) one push to his eye at the cup, landing on "eye" (1348); the iris opens out of the cup (1358).
// Behind the scope (hidden, 1367–1388) the camera moves to the inset framing: his head low in frame, under the circle and the caption band. ----
const PIPK = [1.72, 1.5, 5.86, -.08, 1.46, 0, 27, -430, 0];   // U-local position, look, fov, lens shift y/x
export const pip = f => sst((f - 1389) / 11) * (1 - sst((f - 1504) / 7));
export function camEye(f) {
  const u = .6 * (1 - sst((f - 1322) / 26)), a = X.camU(f, u); a[7] *= 1 - .05 * sst((f - 1348) / 24);
  const p = PIPK, d = f - 1389, b = X.ck(X.UL, [f, p[0] + .008 * d + .07 * Math.sin(d * .19), p[1] + .0015 * d + .04 * Math.sin(d * .31 + 1), p[2] - .011 * d, p[3] + .002 * d + .03 * Math.sin(d * .23 + 2), p[4], p[5], p[6], p[7] - .5 * d, p[8]]);   // the inset drifts in and round him (≈ 1.2 m over the stretch)
  const m = sst((f - 1367) / 21); return a.map((v, j) => j === 0 ? f : lerp(v, b[j], m)); }
export function stageEye(f) {
  const b = build(); const { SUB, UL, cam, U } = X;
  SUB.want = true; SUB.update(f); SUB.P.position.y = 0; SUB.fold(0); SUB.group.updateMatrixWorld(true);
  b.capt.at(UL([0, 0, 0]), 1, false, .5); b.capt.root.updateMatrixWorld(true);
  const c = b.capt.root.worldToLocal(cam.position.clone()), g = b.capt.root.worldToLocal(SUB.gripWorld()), t = c.z / (c.z - g.z);
  GRIP.at = [(c.x + (g.x - c.x) * t) / U - 8, -(c.y + (g.y - c.y) * t) / U + 4];
}
export const capHead = () => build().capt.root.position.clone().add(new THREE.Vector3(0, 1.34, 0));

// ---- Pq: the iris and the inset. The scope circle opens out of the cup (1358–1368, the room sinks to dark as in Ex); full scope to 1389;
// then the circle rises and shrinks (1389–1400) and the dark opens on his face below it; back to the full scope 1504–1511. ----
export function irisK(f) {
  const k = pip(f), o = { ko: f < 1389 ? sst((f - 1357) / 13) : 1 - k };
  if (f >= 1389) { o.pc = [360, 560 - 110 * k]; o.pr = 300 - 30 * k; }
  return o; }
const circ = f => { const k = f < 1389 ? 0 : pip(f); return [360, 560 - 110 * k, 300 - 30 * k]; };

// ---- Ps: the scope view (S). The ship steams right; "same way" (1381–1387): the dashed lead line runs out to a ring ahead of her bow and the
// view swings to it; "break" (1416): the stripes pop; "bow" (1431) and "stern" (1443): zigzag panels eat each end; "guesses" (1479): the view
// swings astern; "wrong" (1492): the line and a ring go down there; "direction" (1504): the arrow over her points the wrong way. ----
const sway = f => .5 * Math.sin((f - 900) * .36);
const hunt = f => 3.2 * Math.sin((f - 1360) * .13) + 1.5 * Math.sin((f - 1360) * .29 + 1);   // the scope never settles: a slow hunt along her (m)
const hand = f => { const e = sst((f - 1366) / 6) * (1 - sst((f - 1392) / 8)) + 1.3 * sst((f - 1396) / 8) * (1 - sst((f - 1494) / 5)) + sst((f - 1494) / 5);   // his hand on the grips, strongest where the view would otherwise sit still
  return e * (1.6 * Math.sin(f * .61) + .8 * Math.sin(f * 1.17 + 2)); };
export function camScope(f) {
  const c = shipC(f), r = RING_R(), l = RING_L(), bob = .07 * Math.sin(f * .13);
  const wR = .5 * sst((f - 1379) / 9) * (1 - sst((f - 1400) / 12)), wL = .5 * sst((f - 1479) / 12);
  const wig = 17 * (kf([[1424, 0], [1431, 1], [1438, 1], [1443, -1], [1454, -1], [1463, 0]], f));   // the view hunts to the bow, then the stern
  const look = c.clone().lerp(r, wR).lerp(l, wL).addScaledVector(X.HEAD6, wig + hunt(f) + hand(f));
  const cy = circ(Math.round(f))[1], sy = 590 - cy, fov = 17 + 3 * sst((f - 1479) / 14);
  const a = X.SL([-470, 1.9 + bob, 40]), b = X.SL([look.x, 1.9 + bob + sway(f) + .25 * hand(f + 7), look.z]);
  return [f, a.x, a.y, a.z, b.x, b.y, b.z, fov, sy, 0]; }
// N's target art lying on the water: squashed to the grazing angle, popping in by s
function ring(g, p, r, s) { if (s <= 0) return; g.save(); g.translate(p[0], p[1]); g.scale(s, s * .36); drawTargetArt(g, 0, 0, r); g.restore(); }
export function stageScope(f) {
  const b = build(); B.want = true; const { SEA, SL, cam } = X;
  stageShipBase(f, shipC, 1 - sst((f - 1425) / 6) * (1 - sst((f - 1479) / 8)));   // straight up through the bow/stern beats
  // "break": the stripes pop brighter (and the hull with them), and stay bolder
  const pb = popIn(f, 1416, .5), kb = f < 1416 ? 1 : 1.12 + .3 * Math.exp(-(f - 1416) * .22);
  for (const m of b.dz) m.color.setScalar(kb); SEA.target.group.scale.setScalar(1 + .05 * (pb > 0 ? pb - (pb > 1 ? 0 : 0) : 0) * Math.exp(-(f - 1416) * .15));
  // the masks: bow on 1431, stern on 1443
  b.masks.forEach((m, i) => { const s = popIn(f, i ? 1443 : 1431, .6); m.visible = s > 0; m.scale.set(Math.max(.001, s), .6 + .4 * Math.min(1, s), 1); });
  // the arrow over her, pointing the wrong way (to the stern), on "direction"
  const sa = popIn(f, 1504, .7); if (sa > 0) { const p = SL(shipPt(f, 0, 24, 0).toArray()); b.arrow.visible = true; b.arrow.position.copy(p); b.arrow.material.rotation = Math.PI; b.arrow.scale.set(15 * sa, 7.5 * sa, 1); }
  // the HUD: lead line and rings
  const g = b.hud.g; g.clearRect(0, 0, 720, 1280);
  const [cx, cyy, pr] = circ(f), from = [cx, cyy + pr - 46];
  const px = v => { const p = SL(v.toArray()).project(cam); return [(p.x + 1) / 2 * 720, (1 - p.y) / 2 * 1280]; };
  const gone = 1 - sst((f - 1414) / 5);   // the right lead goes on "break"
  if (f >= 1381 && gone > 0) { const r = px(RING_R()); ring(g, r, 58, popIn(f, 1387) * gone); drawAimLine(g, from, r, { t: sst((f - 1381) / 6), phase: (f - 1381) * 4, w: .8, alpha: gone }); }
  if (f >= 1487) { const r = px(RING_L()); ring(g, r, 54, popIn(f, 1492)); drawAimLine(g, from, r, { t: sst((f - 1487) / 6), phase: (f - 1487) * 4, w: .8 }); }
  b.hud.t.needsUpdate = true; b.hud.place(cam, 370);
}

// ---- Pw: the high wide (S), a chase view: high behind the torpedo's run, looking down along it. The wake runs up the frame to the ring on the water
// just astern of her; she steams on to the right, away from it; the sailors at her stern rail face us, watch it come and wave it past.
// It runs through the ring, astern, on "isn't" (1561). ----
const PW = { ring: 4, v: .12, vw: .12, e: 2 };   // v: slow enough that the wake is in frame by ~1540 and still meets the ring on "isn't"
// her clock in the wide: slower (.1 m/f), so the stern and the ring share the frame; the camera tracks her at half that
const shipW = f => X.TGT0.clone().addScaledVector(X.HEAD6, VS * (1520 - 1340) + (window.__PW?.vw ?? PW.vw) * (f - 1520));
const NRM = () => new THREE.Vector3(SR, 0, CR);   // her +z side, toward the sub
const TD = () => NRM().multiplyScalar(-.91).addScaledVector(X.HEAD6, .41).normalize();   // the torpedo's heading: from the sub, on her quarter
const RW = () => shipPt(1561, -20 - (window.__PW?.ring ?? PW.ring), 0, 0, shipW);   // the ring: just astern of her stern when the torpedo gets there
const torpW = f => RW().addScaledVector(TD(), -(window.__PW?.v ?? PW.v) * (1561 - f));
// two framings, one move: A over the sailors on the turret roof (they face us and the torpedo's side), B the high wide; the camera cranes up and
// back from A to B (1530–1558) and lands as the wake runs through the ring. Each: view from (h·1 + td·m), elevation el (rad), distance, look offsets.
const PWA = { m: 2.2, el: .32, dist: 9, lh: -18.3, ln: 0, lu: 6.4, fov: 36, sx: 0, sy: 0 }, PWB = { m: .7, el: .78, dist: 52, lh: 8, ln: -2, lu: 0, fov: 34, sx: 0, sy: -260 }, PWT = [1516, 1552];   // starts under the Ps→Pw dissolve; e 2 eases out of the close medium so the crane's 5-frame motion stays ≤ 15
function wideKey(o, R) { const td = TD(), v = X.HEAD6.clone().addScaledVector(td, o.m); v.y = 0; v.normalize();
  const L = R.clone().addScaledVector(X.HEAD6, o.lh).addScaledVector(NRM(), o.ln).add(new THREE.Vector3(0, o.lu, 0)), P = L.clone().addScaledVector(v, -o.dist * Math.cos(o.el)).add(new THREE.Vector3(0, o.dist * Math.sin(o.el), 0));
  return { P, L }; }
export function camWide(f) { const A = { ...PWA, ...(window.__PW?.A || {}) }, Bo = { ...PWB, ...(window.__PW?.B || {}) }, T = window.__PW?.T || PWT;
  const ka = wideKey(A, shipPt(f, 0, 0, 0, shipW)), kb = wideKey(Bo, RW()), u = sst((f - T[0]) / (T[1] - T[0])) ** (window.__PW?.e ?? PW.e);
  const P = ka.P.lerp(kb.P, u), L = ka.L.lerp(kb.L, u), ta = Math.tan(A.fov * Math.PI / 360), tb = Math.tan(Bo.fov * Math.PI / 360), fov = 2 * Math.atan(ta * Math.pow(tb / ta, u)) * 180 / Math.PI;
  const a = X.SL(P.toArray()), b = X.SL(L.toArray()); return [f, a.x, a.y, a.z, b.x, b.y, b.z, fov, lerp(A.sy, Bo.sy, u), lerp(A.sx, Bo.sx, u)]; }
export function stageWide(f) {
  const b = build(); B.want = true; const { SEA } = X;
  stageShipBase(f, shipW, 1.8); for (const o of b.puffs) { o.position.z *= -2; o.scale.multiplyScalar(.75); }   // and off to her far side, clear of the sailors SEA.target.group.updateMatrixWorld(true);   // the smoke streams well aft: she steams away from the ring
  const R = RW(), dt = f - 1561; b.ringN.group.visible = true; b.ringN.group.position.set(R.x, waterY(R.x, R.z, f) + .1, R.z);
  b.ringN.set(1 + (dt >= 0 ? .15 * Math.exp(-dt * .25) * Math.sin(dt * .9) : 0), 0, dt >= 0 && dt < 14 ? [[1 + dt / 9, 1 - dt / 14]] : []);   // N's ring; ripples as the torpedo runs through it
  b.wake.set(torpW(1470), torpW(f), f, 6.5, 1.6);
  // the torpedo itself, a small dark body awash at the head of the wake
  { const h = torpW(f), d = TD(); b.head.visible = true; b.head.position.set(h.x, waterY(h.x, h.z, f) + .05, h.z); b.head.rotation.set(0, Math.atan2(-d.z, d.x), 0); }
  // the sailors at the rail on her +z side, by the aft deckhouse
  b.sail.forEach((c, i) => { const x = [-18.3, -17.9, -18.5][i], z = [-.05, .95, -1.0][i]; c.at(X.SL(shipPt(f, x, 5.72, z, shipW).toArray()), 1.42 + 1.2 * sst((f - 1530) / 26), false, .42); });   // they grow as the crane rises, so they still read from the high wide   // on the aft turret's roof
}
export const focWide = () => X.fz(build().sail[0].root.position.clone().add(new THREE.Vector3(0, 1.9, 0)));
export const subAt = f => X.SL(subPt(f, 8, 0, 0).toArray());
export const shipAt = f => X.SL(shipC(f).toArray());
