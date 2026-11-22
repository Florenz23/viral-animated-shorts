// stretch-Q.js — part 2, builder Q (1578–1799). Same conventions as world.js / cast.js / stretch-D.js.
// Q0 (office, 1574–1658): the three admirals behind the map table look at each other ("So did it work?"), look down at the map
// ("Honestly"), shrug together on "nobody" (1623) and hold it; the front admiral's monocle drops on "proved" (1642) and swings on its cord.
// Q1 (Paris, 1651–1799): a rooftop studio, the city and the tower in the big window. A painter (beret, striped sailor's shirt, a thin
// curled moustache; a generic caricature, nobody in particular) paints at his easel, turns to us on "famous" (1666), flourishes the brush
// on "painter" (1677), points out of the window on "Paris" (1693), holds up a newspaper with a dazzle ship on "sure" (1708) and shakes it
// on "thing" (1734), drops it, taps the stripes on his own shirt on "stripes" (1741, 1747, 1753), thumb to chest on "his" (1766), a finger
// to the temple on "idea" (1772), and winks on "first" (1783); the film ends on his face.
// Everything here is built lazily on the first frame that uses it.
import * as THREE from 'three';
import { drawAdmiral, drawFace, shape, line, qline, disc, INK, BOX } from './cast.js';
import { put, toon, tex } from './world.js';

const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
function keyed(keys, f) {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) {
    const [f0, a] = keys[i - 1], [f1, b] = keys[i], t = ease((f - f0) / (f1 - f0));
    const mix = (x, y) => Array.isArray(x) ? x.map((v, j) => mix(v, y[j])) : lerp(x, y, t);
    return mix(a, b);
  }
  return keys[keys.length - 1][1];
}
const step = (tab, f) => { let v = null; for (const k of Object.keys(tab).map(Number).sort((a, b) => a - b)) if (k <= f) v = tab[k]; return v; };
function blinkEyes(f, starts, eyes) { for (const a of starts) { const k = f - a; if (k >= 0 && k <= 3) return k === 0 || k === 3 ? 'half' : 'line'; } return eyes; }
const FACE = '#f4f5f7';

/* ================= Q0: the three admirals at the map table ================= */
// office-local spots: behind the far side of the table (far edge z = -11.55), the front admiral a little nearer
export const QPOS = { F: [-.02, 0, -11.62], A: [-.72, 0, -11.78], B: [.70, 0, -11.76] };
const SHO = k => (k === 'front' ? 64 : k === 'a' ? 70 : 60) * .8;
// faces 'eyes/mouth/brows[/open]'; looks are eased [dx, dy]; nobody speaks (the narrator does): closed mouths only
const QF = {
  F: { face: { 1560: 'half/line/flat', 1591: 'ring/line/raised', 1611: 'half/slant/worried', 1623: 'half/bite/raised', 1643: 'ring/dot/raised', 1652: 'half/line/worried' },
       blink: [1588, 1608, 1620, 1650], look: [[1588, [0, 0]], [1591, [-.9, .05]], [1598, [-.9, .05]], [1601, [.9, .05]], [1607, [.9, .05]], [1611, [0, .7]], [1620, [0, .7]], [1623, [0, 0]], [1642, [0, 0]], [1645, [0, .8]]],
       turn: [[1588, 0], [1591, -.3], [1598, -.3], [1602, .3], [1607, .3], [1612, 0]], tilt: .05 },
  A: { face: { 1560: 'half/line/flat', 1592: 'ring/line/raised', 1611: 'half/line/worried', 1623: 'half/slant/raised', 1644: 'ring/line/raised', 1652: 'half/line/worried' },
       blink: [1589, 1609, 1621, 1648], look: [[1589, [0, 0]], [1592, [.9, 0]], [1599, [.9, 0]], [1603, [.9, -.1]], [1611, [0, .7]], [1620, [0, .7]], [1623, [0, 0]], [1642, [0, 0]], [1645, [.9, .2]]],
       turn: [[1589, 0], [1592, .3], [1608, .3], [1612, 0], [1642, 0], [1645, .25]], tilt: -.06 },
  B: { face: { 1560: 'half/line/flat', 1593: 'ring/line/raised', 1611: 'half/line/worried', 1623: 'half/bite/raised', 1644: 'ring/line/raised', 1652: 'half/line/worried' },
       blink: [1590, 1610, 1621, 1649], look: [[1590, [0, 0]], [1593, [-.9, 0]], [1611, [0, .7]], [1620, [0, .7]], [1623, [0, 0]], [1642, [0, 0]], [1645, [-.9, .2]]],
       turn: [[1590, 0], [1593, -.3], [1608, -.3], [1612, 0], [1642, 0], [1645, -.25]], tilt: .07 },
};
// the shrug: shoulders up and palms out on "nobody" (lands 1623), held (a small settle), down from "it" (1649)
const SHRUG = [[1619, 0], [1623, 1.06], [1626, 1], [1647, 1], [1649, 1], [1655, 0]];
function admQ(who, f) {
  const id = who.slice(-1), k = id === 'F' ? 'front' : id === 'A' ? 'a' : 'b', T = QF[id], sx = SHO(k);
  let [eyes, mouth, brows] = step(T.face, f).split('/'); eyes = blinkEyes(f, T.blink, eyes);
  const lk = keyed(T.look, f), tr = keyed(T.turn, f), s = keyed(SHRUG, f), br = Math.sin((f - 1578 + sx) * .19);
  // hands leaning on the table edge → elbows out, palms up beside the shoulders
  const arm = side => { const c = [side * lerp(108, k === 'front' ? 132 : 138, s), lerp(-330, -366, s)], h = [side * lerp(80, k === 'front' ? 122 : 150, s), lerp(-372, -478, s)]; return { s: [side * sx, -410], c, h }; };
  const p = { kind: k, face: { eyes, mouth, brows, open: 0, look: lk, fx: 12 * lk[0] }, turn: tr, ink17: true,
    armR: arm(1), armL: arm(-1), palm: s, headY: 22 * s + 1.6 * br, lean: 0, headTilt: T.tilt * s, headX: 0 };
  if (k === 'front') {   // the monocle drops on "proved" (1642): in free fall for 4 frames, then it swings and bounces on its cord at his chest
    p.monocle = true; const t = f - 1641;
    if (t > 0) { const fall = Math.min(1, t / 4); p.monoDy = 112 * fall * fall + (t > 4 ? -16 * Math.sin((t - 4) * .9) * Math.exp(-(t - 4) * .25) : 0); p.monoDx = t > 4 ? 14 * Math.sin((t - 4) * .55) * Math.exp(-(t - 4) * .12) : 0; }
  }
  return p;
}
// the admiral drawn by cast.js without his arms, then the arms here: the same limbs and gold cuffs, and in the shrug an open palm turned up
const GOLD = '#e8b84a';
function drawQA(ctx, p) {
  drawAdmiral(ctx, { ...p, armL: null, armR: null });
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.translate(0, -278 * .2 * -1 - 42);
  for (const [a, side] of [[p.armL, -1], [p.armR, 1]]) { if (!a) continue; qline(ctx, a.s, a.c, a.h, 10.5);
    const dx = a.h[0] - a.c[0], dy = a.h[1] - a.c[1], L = Math.hypot(dx, dy) || 1;
    line(ctx, [[a.h[0] - dx / L * 26 - dy / L * 9, a.h[1] - dy / L * 26 + dx / L * 9], [a.h[0] - dx / L * 26 + dy / L * 9, a.h[1] - dy / L * 26 - dx / L * 9]], 6, GOLD);
    if ((p.palm || 0) > .5) { ctx.save(); ctx.translate(a.h[0], a.h[1]); ctx.scale(side * 1.5, 1.5); ctx.rotate(-.18);
      shape(ctx, () => { ctx.moveTo(-6, 2); ctx.quadraticCurveTo(2, 14, 26, 10); ctx.quadraticCurveTo(44, 6, 46, -4); ctx.quadraticCurveTo(30, -2, 18, -4); ctx.quadraticCurveTo(20, -18, 10, -20); ctx.quadraticCurveTo(0, -10, -6, 2); ctx.closePath(); }, FACE, 4.6);
      ctx.restore(); } else disc(ctx, a.h[0], a.h[1], 11.5, INK); }
  ctx.restore();
}
let A3 = null;
function adm(X) {
  if (A3) return A3; const { card, CARDS } = X;
  A3 = { F: card('qF', drawQA, BOX.admiral, admQ), A: card('qA', drawQA, BOX.admiral, admQ), B: card('qB', drawQA, BOX.admiral, admQ) };
  CARDS.push(A3.F, A3.A, A3.B); return A3;
}
export function headQ0() { return A3 ? A3.F.root.position.clone().add(new THREE.Vector3(0, 1.33, 0)) : new THREE.Vector3(); }
export function stageQ0(f, X) {
  const C = adm(X), { O, DOOR } = X; if (DOOR) DOOR.setOpen(0);
  C.A.at(O(QPOS.A)); C.B.at(O(QPOS.B)); C.F.at(O(QPOS.F));
}

/* ================= Q1: the Paris rooftop studio ================= */
// place Q: far from every other place; local x right (seen from the camera), z toward the camera, the window wall at z = -2.6
const QX = 4000, QZ = -4000;
export const PL = v => new THREE.Vector3(v[0] + QX, v[1], v[2] + QZ);
let PAR = null;
function backdropTex() {   // the city through the window: a warm afternoon sky, the tower in the haze, zinc roofs and chimney pots
  return tex(2048, 1024, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h * .8); sky.addColorStop(0, '#6f92c8'); sky.addColorStop(.6, '#a9b8d4'); sky.addColorStop(1, '#d9bf9a'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(240,236,232,.42)'; for (const [x, y, r] of [[300, 220, 60], [380, 200, 80], [470, 230, 55], [1500, 150, 70], [1600, 130, 90], [1700, 160, 60]]) { g.beginPath(); g.ellipse(x, y, r * 1.8, r * .55, 0, 0, 7); g.fill(); }
    // the tower: an iron lattice, hazy blue-grey, its foot behind the roofs (x 560 of 2048 ≈ local x -4.0)
    const tx = 893, base = 840, top = 444, col = '#6a7392';
    g.save(); g.fillStyle = col; g.strokeStyle = col; g.lineJoin = 'round';
    const leg = s => { g.beginPath(); g.moveTo(tx + s * 96, base); g.quadraticCurveTo(tx + s * 40, base - 170, tx + s * 10, top + 70); g.lineTo(tx + s * 4, top + 70); g.quadraticCurveTo(tx + s * 26, base - 160, tx + s * 62, base); g.closePath(); g.fill(); };
    leg(-1); leg(1);
    g.beginPath(); g.moveTo(tx - 66, base); g.quadraticCurveTo(tx, base - 100, tx + 66, base); g.lineTo(tx + 78, base - 14); g.quadraticCurveTo(tx, base - 124, tx - 78, base - 14); g.closePath(); g.fill();   // the arch
    g.fillRect(tx - 60, base - 128, 120, 10); g.fillRect(tx - 32, base - 260, 64, 8); g.fillRect(tx - 14, top + 64, 28, 8);   // platforms
    g.fillRect(tx - 3, top + 10, 6, 60); g.fillRect(tx - 1, top - 24, 2, 40);
    g.lineWidth = 2; g.strokeStyle = 'rgba(205,214,232,.45)'; for (let y = base - 24; y > top + 90; y -= 18) { const hw = 8 + (y - top) * .12; g.beginPath(); g.moveTo(tx - hw, y); g.lineTo(tx + hw * .6, y - 22); g.moveTo(tx + hw, y); g.lineTo(tx - hw * .6, y - 22); g.stroke(); }
    g.restore();
    // far roofs (hazy), then near zinc roofs with dormers and terracotta chimney pots
    const roofs = (y0, amp, colR, colW, seed, pots) => { let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let x = -40; x < w; ) { const bw = 120 + r() * 160, ry = y0 - r() * amp; g.fillStyle = colW; g.fillRect(x, ry + 40, bw, h - ry); g.fillStyle = colR; g.beginPath(); g.moveTo(x - 6, ry + 44); g.lineTo(x + 22, ry); g.lineTo(x + bw - 22, ry); g.lineTo(x + bw + 6, ry + 44); g.closePath(); g.fill();
        if (pots) { g.fillStyle = '#b8694e'; const n = 1 + (r() * 3 | 0); for (let i = 0; i < n; i++) { const cx = x + 30 + r() * (bw - 60); g.fillRect(cx, ry - 34, 26, 36); g.fillStyle = '#8e4c3a'; for (let j = 0; j < 3; j++) g.fillRect(cx + 2 + j * 8, ry - 46, 6, 14); g.fillStyle = '#b8694e'; } }
        if (pots) { g.fillStyle = '#eef0f4'; for (let i = 0; i < 2; i++) { const dx = x + 26 + i * (bw / 2); g.fillRect(dx, ry + 10, 22, 24); g.fillStyle = '#39405a'; g.fillRect(dx + 4, ry + 14, 14, 18); g.fillStyle = '#eef0f4'; } }
        x += bw + 4; } };
    roofs(780, 50, '#8d96ae', '#d4c9b8', 7, false);
    roofs(880, 70, '#6e7896', '#e4d6be', 19, true);
    g.fillStyle = 'rgba(40,44,70,.18)'; for (let x = 0; x < w; x += 9) g.fillRect(x, 960, 3, 64);
  });
}
function canvasTex() {   // his own picture on the easel: angular stripes, black, white and blue, very like what the ships wear
  return tex(512, 640, (g, w, h) => {
    g.fillStyle = '#efe8d6'; g.fillRect(0, 0, w, h);
    const zone = (pts, a, cols, sw) => { g.save(); g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); g.clip(); g.translate(w / 2, h / 2); g.rotate(a);
      for (let i = -20; i < 20; i++) { g.fillStyle = cols[(i + 40) % cols.length]; g.fillRect(-w, i * sw, 2 * w, sw); } g.restore(); };
    zone([[0, 0], [300, 0], [200, 330], [0, 260]], .5, ['#24202c', '#efe8d6'], 34);
    zone([[300, 0], [512, 0], [512, 300], [200, 330]], -.7, ['#3d63c9', '#efe8d6', '#24202c', '#efe8d6'], 26);
    zone([[0, 260], [200, 330], [300, 640], [0, 640]], -.25, ['#efe8d6', '#24202c'], 42);
    zone([[200, 330], [512, 300], [512, 640], [300, 640]], 1.0, ['#c94a3a', '#efe8d6', '#24202c', '#efe8d6'], 30);
    g.strokeStyle = '#24202c'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  });
}
function buildParis(X) {
  const { S, PLACES } = X, G = new THREE.Group(); G.position.set(QX, 0, QZ); S.add(G); PLACES.Q = G;
  const planks = tex(512, 512, (g, w, h) => { g.fillStyle = '#9a6a48'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 64) { g.fillStyle = y % 128 ? '#93633f' : '#a3724f'; g.fillRect(0, y + 2, w, 60); g.fillStyle = '#5a3a28'; g.fillRect(0, y, w, 3); g.fillRect((y * 7) % w, y, 3, 64); } }, [3, 3]);
  const plaster = tex(512, 512, (g, w, h) => { g.fillStyle = '#e2b088'; g.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(150,120,90,${Math.random() * .06})`; g.fillRect(Math.random() * w, Math.random() * h, 20 + Math.random() * 40, 8 + Math.random() * 30); } }, [2, 2]);
  const wallM = toon({ map: plaster }), wood = toon({ color: 0x8a5a3a }), iron = toon({ color: 0x2f4a44 });
  put(G, new THREE.BoxGeometry(8, .2, 7), toon({ map: planks }), { pos: [0, -.1, .4], outline: 0 });
  const wall = (w, h, d, x, y, z) => put(G, new THREE.BoxGeometry(w, h, d), wallM, { pos: [x, y, z], outline: 0, edges: false });
  // window wall (z = -2.6) round a big studio window x -3.0..2.4, y .5..3.5
  wall(.6, 4, .2, -3.3, 2, -2.6); wall(1.6, 4, .2, 3.2, 2, -2.6); wall(5.4, .5, .2, -.3, .25, -2.6); wall(5.4, .5, .2, -.3, 3.75, -2.6);
  wall(.2, 4, 7, -3.6, 2, .4); wall(.2, 4, 7, 4, 2, .4); put(G, new THREE.BoxGeometry(8, .2, 7), wallM, { pos: [0, 4.05, .4], outline: 0, edges: false });
  for (let x = -3; x <= 2.41; x += .6) put(G, new THREE.BoxGeometry(.06, 3.0, .08), iron, { pos: [x, 2, -2.58], outline: 1.2 });
  for (let y = .5; y <= 3.51; y += .75) put(G, new THREE.BoxGeometry(5.46, .06, .08), iron, { pos: [-.3, y, -2.58], outline: 1.2 });
  put(G, new THREE.BoxGeometry(5.6, .08, .3), toon({ color: 0xe8dcc4 }), { pos: [-.3, .5, -2.45], outline: 1.4 });   // the sill
  // the city beyond (unlit, a painted backdrop far out)
  const bd = new THREE.Mesh(new THREE.PlaneGeometry(30, 15), new THREE.MeshBasicMaterial({ map: backdropTex(), fog: false })); bd.position.set(-1, 4.5, -14); G.add(bd);
  // the easel: three legs, a ledge, and his canvas, turned toward him and us
  const E = new THREE.Group(); E.position.set(.95, 0, -.35); E.rotation.y = -.75; G.add(E);
  for (const s of [-1, 1]) put(E, new THREE.BoxGeometry(.05, 1.9, .05), wood, { pos: [s * .32, .95, 0], rot: [-.08, 0, s * -.1], outline: 1.4 });
  put(E, new THREE.BoxGeometry(.05, 1.8, .05), wood, { pos: [0, .9, -.32], rot: [.28, 0, 0], outline: 1.4 });
  put(E, new THREE.BoxGeometry(.8, .05, .1), wood, { pos: [0, .66, .06], outline: 1.4 });
  put(E, new THREE.BoxGeometry(.72, .9, .03), toon({ map: canvasTex() }), { pos: [0, 1.15, .07], rot: [-.08, 0, 0], outline: 1.8 });
  // a side table with jars and brushes, a stool, canvases leaning on the wall, a hanging lamp
  put(G, new THREE.BoxGeometry(.8, .06, .5), wood, { pos: [-1.35, .72, -.9], outline: 1.6 });
  for (const [x, z] of [[-1.7, -1.1], [-1.0, -1.1], [-1.7, -.7], [-1.0, -.7]]) put(G, new THREE.BoxGeometry(.05, .7, .05), wood, { pos: [x, .35, z], outline: 1.2 });
  [[-1.55, -.95, 0xc94a3a], [-1.38, -.8, 0x3d63c9], [-1.2, -1.0, 0xe8b84a], [-1.05, -.85, 0x2a2a34]].forEach(([x, z, c]) => put(G, new THREE.CylinderGeometry(.05, .05, .12, 12), toon({ color: c }), { pos: [x, .81, z], outline: 1.4 }));
  for (let i = 0; i < 4; i++) put(G, new THREE.BoxGeometry(.012, .3, .012), wood, { pos: [-1.38 + i * .02, .95, -.8], rot: [0, 0, (i - 1.5) * .12], outline: .8 });
  put(G, new THREE.CylinderGeometry(.2, .2, .05, 16), wood, { pos: [1.7, .6, .2], outline: 1.4 });
  for (const a of [0, 2.1, 4.2]) put(G, new THREE.BoxGeometry(.04, .6, .04), wood, { pos: [1.7 + .14 * Math.cos(a), .3, .2 + .14 * Math.sin(a)], outline: 1 });
  [[2.6, .9, 1.1, 0xd8c8a8], [2.75, .7, .9, 0x3d63c9], [2.9, 1.0, 1.3, 0xc94a3a]].forEach(([x, w, h, c], i) => put(G, new THREE.BoxGeometry(w, h, .04), toon({ color: c }), { pos: [x, h / 2, -2.35 + i * .06], rot: [-.12, -.2, 0], outline: 1.6 }));
  const shade = put(G, new THREE.ConeGeometry(.28, .22, 20, 1, true), toon({ color: 0x2f4a44, side: THREE.DoubleSide }), { pos: [-.6, 3.2, -.9], outline: 1.4 });
  put(G, new THREE.CylinderGeometry(.006, .006, .8, 6), toon({ color: 0x222222 }), { pos: [-.6, 3.65, -.9], outline: 0, edges: false });
  const lamp = new THREE.PointLight(0xffd8a0, 0, 6, 1.6); lamp.position.set(-.6, 3.05, -.9); G.add(lamp);
  G.updateMatrixWorld(true);
  return { G, lamp, shade };
}

/* ---------- the Paris painter: beret, a navy-striped sailor's shirt, a thin curled moustache ---------- */
const PP = { headTop: -598, headH: 172, bodyTop: -432, hem: -236, shL: [-56, -414], shR: [56, -414] };
export const PBOX = [-400, -790, 330, 20];
const LIMB = 10.5, OL = 8, HEAD_LW = 4.4;
function headPath(ctx, cx, top, w, h) {
  const rx = w / 2, my = top + h * 0.47, k = 0.56;
  ctx.moveTo(cx, top);
  ctx.bezierCurveTo(cx + rx * k, top, cx + rx, my - h * 0.47 * k, cx + rx, my);
  ctx.bezierCurveTo(cx + rx, my + h * 0.53 * k * 1.05, cx + rx * k * 0.95, top + h, cx, top + h);
  ctx.bezierCurveTo(cx - rx * k * 0.95, top + h, cx - rx, my + h * 0.53 * k * 1.05, cx - rx, my);
  ctx.bezierCurveTo(cx - rx, my - h * 0.47 * k, cx - rx * k, top, cx, top);
  ctx.closePath();
}
const hand = (ctx, x, y) => disc(ctx, x, y, 11.5, INK);
function fineBrush(ctx, x, y, a) {   // a fine artist's brush along +x from the hand, red on the tip
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  shape(ctx, () => { ctx.moveTo(-34, -4.5); ctx.lineTo(96, -6); ctx.lineTo(96, 6); ctx.lineTo(-34, 4.5); ctx.closePath(); }, '#2a2a34', 3.4);
  shape(ctx, () => ctx.rect(96, -7, 20, 14), '#c2c6d0', 3.4);
  shape(ctx, () => { ctx.moveTo(116, -7); ctx.quadraticCurveTo(140, -6, 152, 0); ctx.quadraticCurveTo(140, 6, 116, 7); ctx.closePath(); }, '#c94a3a', 3.4);
  ctx.restore();
}
function paper(ctx, P) {   // the newspaper: masthead bars, a photo of a dazzle-painted ship, columns of type
  ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(P.r || 0); const w = 200, h = 152;
  shape(ctx, () => ctx.rect(-w / 2, -h / 2, w, h), '#f1ebdb', 5);
  line(ctx, [[-w / 2 + 16, -h / 2 + 22], [w / 2 - 16, -h / 2 + 22]], 14, '#24202c');
  line(ctx, [[-w / 2 + 16, -h / 2 + 40], [w / 2 - 16, -h / 2 + 40]], 2.4, '#24202c');
  const px = -w / 2 + 12, py = -h / 2 + 46, pw = 150, ph = 92, k = .84; ctx.save(); ctx.translate(px, py); ctx.scale(k, k); ctx.translate(-px, -py);
  ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip(); ctx.fillStyle = '#c9cbd2'; ctx.fillRect(px, py, pw, ph); ctx.fillStyle = '#8f95a6'; ctx.fillRect(px, py + ph * .62, pw, ph);
  const hull = () => { ctx.moveTo(px + 10, py + 52); ctx.lineTo(px + 140, py + 50); ctx.lineTo(px + 128, py + 72); ctx.lineTo(px + 22, py + 72); ctx.closePath(); };
  ctx.save(); ctx.beginPath(); hull(); ctx.rect(px + 60, py + 26, 36, 26); ctx.rect(px + 72, py + 10, 12, 18); ctx.clip(); ctx.fillStyle = '#f1ebdb'; ctx.fillRect(px, py, pw, ph);
  ctx.translate(px + 75, py + 50); for (const [a, x0, x1] of [[.7, -80, 0], [-.6, 0, 80]]) { ctx.save(); ctx.beginPath(); ctx.rect(x0, -60, x1 - x0, 120); ctx.clip(); ctx.rotate(a); ctx.fillStyle = '#24202c'; for (let i = -12; i < 12; i++) if (i % 2 === 0) ctx.fillRect(-120, i * 9, 240, 9); ctx.restore(); }
  ctx.restore(); shape(ctx, hull, null, 3); ctx.restore(); shape(ctx, () => ctx.rect(px, py, pw, ph), null, 3.4); ctx.restore();
  for (let i = 0; i < 5; i++) line(ctx, [[px + pw * k + 10, py + 6 + i * 14], [w / 2 - 12, py + 6 + i * 14]], 3, 'rgba(60,56,70,.55)');
  for (let i = 0; i < 2; i++) line(ctx, [[-w / 2 + 12, py + ph * k + 12 + i * 12], [w / 2 - 12, py + ph * k + 12 + i * 12]], 3, 'rgba(60,56,70,.55)');
  ctx.restore();
}
export function drawParis(ctx, p = {}) {
  const f = p.face || {};
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(40,24,48,.38)'; ctx.beginPath(); ctx.ellipse(0, 4, 84, 12, 0, 0, 7); ctx.fill();
  for (const s of [-1, 1]) { const x = s * 24;   // dark trousers: thick legs; black shoes
    line(ctx, [[x, PP.hem], [x + s * 4, -24]], 26, INK); line(ctx, [[x, PP.hem], [x + s * 4, -24]], 15, '#3a3448');
    shape(ctx, () => { const bx = x + s * 12; ctx.moveTo(bx - 26, 0); ctx.lineTo(bx + 26, 0); ctx.quadraticCurveTo(bx + 30, -2, bx + 26, -12); ctx.quadraticCurveTo(bx + 12, -32, bx - 6, -30); ctx.quadraticCurveTo(bx - 28, -28, bx - 28, -10); ctx.quadraticCurveTo(bx - 30, -2, bx - 26, 0); ctx.closePath(); }, '#24202c', 5.5); }
  ctx.save(); ctx.translate(0, PP.hem); ctx.rotate(p.lean || 0); ctx.translate(0, -PP.hem);
  const puff = p.puff || 0;   // chest out (his "his")
  const shirt = () => { const t = PP.bodyTop, h = PP.hem, ww = 62 + 6 * puff; ctx.moveTo(-44, t); ctx.quadraticCurveTo(0, t + 10, 44, t); ctx.quadraticCurveTo(ww, t + 4, ww + 4, t + 44); ctx.quadraticCurveTo(ww + 10, h - 50, ww + 4, h);
    ctx.lineTo(-ww - 4, h); ctx.quadraticCurveTo(-ww - 10, h - 50, -ww - 4, t + 44); ctx.quadraticCurveTo(-ww, t + 4, -44, t); ctx.closePath(); };
  ctx.save(); ctx.translate(7, 4); shape(ctx, shirt, INK, 0); ctx.restore();
  shape(ctx, shirt, '#f3f0e8', 0);
  ctx.save(); ctx.beginPath(); shirt(); ctx.clip();
  ctx.fillStyle = '#2c3f86'; for (let y = PP.bodyTop + 22; y < PP.hem; y += 25) ctx.fillRect(-120, y, 240, 11);   // the navy stripes
  ctx.fillStyle = 'rgba(40,40,90,.16)'; ctx.fillRect(34, PP.bodyTop - 10, 60, 240);
  line(ctx, [[-50, PP.bodyTop + 44], [-56, PP.hem - 18]], 3.2, 'rgba(255,250,235,.7)');
  ctx.restore(); shape(ctx, shirt, null, OL);
  // head
  const top = PP.headTop + (p.headY || 0), H = PP.headH, hx = p.headX || 0, sd = p.side || 0;
  ctx.save(); ctx.translate(hx, top + H * .65); ctx.rotate(p.headTilt || 0); ctx.translate(-hx, -(top + H * .65));
  ctx.save(); ctx.translate(8 + 8 * sd, 5); shape(ctx, () => headPath(ctx, hx, top, 190, H), INK, HEAD_LW); ctx.restore();
  shape(ctx, () => headPath(ctx, hx, top, 190, H), FACE, 0);
  ctx.save(); ctx.beginPath(); headPath(ctx, hx, top, 190, H); ctx.clip(); ctx.fillStyle = 'rgba(96,90,170,.10)'; ctx.beginPath(); ctx.ellipse(hx + 70, top + H * .7, 60, 70, 0, 0, 7); ctx.fill();
  // the face slides round toward screen right as he turns away to the easel (side 1), cut by the head's edge
  const fx = hx + (f.fx ?? 0) + 74 * sd, ey = top + H * .55;
  drawFace(ctx, fx, ey, ey + 40, f);
  if (p.wink) { const x = fx + 24.7; disc(ctx, x, ey + 1, 17, FACE); line(ctx, [[x - 14, ey - 4], [x + 14, ey - 4]], 4.6); ctx.save(); ctx.beginPath(); ctx.rect(x - 16, ey - 4, 32, 18); ctx.clip(); disc(ctx, x, ey - 3, 8, INK); ctx.restore(); }   // the wink: his left eye shut, the right one open under a lowered lid
  // the thin curled moustache
  const my = ey + 27; for (const s of [-1, 1]) { qline(ctx, [fx + s * 3, my], [fx + s * 26, my + 8], [fx + s * 44, my - 4], 6.5); qline(ctx, [fx + s * 44, my - 4], [fx + s * 54, my - 14], [fx + s * 44, my - 16], 4.6); }
  ctx.restore();
  shape(ctx, () => headPath(ctx, hx, top, 190, H), null, HEAD_LW);
  if (sd > .45) { const ex = hx - 70 + 20 * (1 - sd); shape(ctx, () => ctx.ellipse(ex, ey + 4, 14, 22, .1, 0, 7), FACE, 4.5); qline(ctx, [ex - 4, ey - 8], [ex + 6, ey + 2], [ex - 2, ey + 14], 3.2); }   // the ear, as he turns away
  // dark hair at the temples, under the beret
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) qline(ctx, [hx + s * (90 - i * 6), top + 40 + i * 4], [hx + s * (98 - i * 4), top + 62 + i * 6], [hx + s * (92 - i * 5), top + 80 + i * 6], 6, '#2a2430');
  // the beret: a flat soft disc tipped over toward screen right, the little stalk on top
  ctx.save(); ctx.translate(hx + 10, top + 14); ctx.rotate(.16 + (p.beretTilt || 0));
  const ber = () => { ctx.moveTo(-108, 16); ctx.bezierCurveTo(-120, -40, -30, -62, 30, -56); ctx.bezierCurveTo(100, -50, 132, -14, 118, 14); ctx.quadraticCurveTo(10, 34, -108, 16); ctx.closePath(); };
  shape(ctx, ber, '#26222f', 6.5); line(ctx, [[-70, -24], [-10, -44]], 4, 'rgba(255,255,255,.18)'); line(ctx, [[8, -56], [14, -76]], 7);
  ctx.restore();
  ctx.restore();
  ctx.restore();
  // arms (stick limbs from the shoulders), the newspaper in his left hand, the brush in his right
  if (p.paper) paper(ctx, p.paper);
  for (const a of [p.armL, p.armR]) if (a) { qline(ctx, a.s, a.c, a.h, LIMB); if (a.brush != null) fineBrush(ctx, a.h[0], a.h[1], a.brush); hand(ctx, ...a.h); if (a.finger != null) line(ctx, [a.h, [a.h[0] + Math.cos(a.finger) * 28, a.h[1] + Math.sin(a.finger) * 28]], 8.5); }
  ctx.restore();
}
// his acting, frame by frame
const PF = { 1640: 'half/smile/flat', 1666: 'ring/smile/raised', 1672: 'half/smile/smirk', 1690: 'half/smile/raised', 1707: 'ring/smile/raised', 1722: 'half/slant/smirk', 1741: 'half/smile/smirk', 1765: 'half/slant/raised', 1771: 'squint/slant/smirk', 1781: 'shut/slant/smirk', 1790: 'half/slant/smirk' };
const PBL = [1660, 1686, 1704, 1726, 1758, 1793];
const TAPS = [1741, 1747, 1753];
function parisPose(who, f) {
  let [eyes, mouth, brows] = step(PF, f).split('/'); eyes = blinkEyes(f, PBL, eyes);
  const sd = keyed([[1662, 1], [1666, 0]], f);   // turned to the easel, then to us on "famous"
  const look = sd > .5 ? [.9, .1] : keyed([[1666, [0, 0]], [1690, [0, 0]], [1693, [-.9, -.3]], [1700, [-.9, -.3]], [1703, [0, 0]], [1730, [0, 0]], [1734, [-.6, -.2]], [1737, [0, 0]], [1741, [-.1, .7]], [1756, [-.1, .7]], [1760, [0, 0]]], f);
  const face = { eyes, mouth, brows, open: 0, look, fx: 10 * look[0] };
  const SL = PP.shL, SR = PP.shR;
  // right arm: the brush. Painting (small dabs at the canvas), a flourish up on "painter", down, then a pointer up by the shoulder
  const dab = f < 1662 ? Math.max(0, Math.sin((f - 1640) * .55)) : 0;
  const R = keyed([[1655, [[122, -424], [178, -474], -.3]], [1662, [[122, -424], [178, -474], -.3]], [1667, [[112, -380], [146, -330], .9]],
    [1674, [[112, -380], [146, -330], .9]], [1677, [[112, -470], [146, -572], -1.5]], [1686, [[112, -470], [146, -572], -1.5]], [1692, [[112, -380], [146, -330], .9]],
    [1760, [[112, -380], [146, -330], .9]], [1766, [[110, -360], [120, -318], 1.2]]], f);
  const twirl = f >= 1677 && f < 1688 ? .35 * Math.sin((f - 1677) * .9) * (1 - (f - 1677) / 11) : 0;
  const armR = { s: SR, c: R[0], h: [R[1][0] + 10 * dab, R[1][1] - 4 * dab], brush: R[2] + twirl };
  // left arm: on the hip → points out of the window on "Paris" → the newspaper up on "sure" → drops it → taps the stripes → thumb to chest → temple → down
  const HIP = [[-112, -336], [-64, -294], null], POINT = [[-136, -470], [-214, -548], -2.4], PAPER = [[-128, -420], [-112, -500], null], CHEST = [[-96, -318], [-24, -372], -.5],
    THUMB = [[-96, -330], [-20, -392], -1.2], TEMPLE = [[-140, -440], [-118, -540], -.2], CHIN = [[-110, -350], [-30, -410], -1.0];
  const LK = [[1655, HIP], [1688, HIP], [1693, POINT], [1700, POINT], [1704, HIP], [1705, HIP], [1708, PAPER], [1736, PAPER], [1740, CHEST], [1760, CHEST], [1765, THUMB], [1768, THUMB], [1772, TEMPLE], [1778, TEMPLE], [1788, HIP]];
  let L = keyed(LK.map(([k, v]) => [k, [v[0], v[1], v[2] ?? 0]]), f); const fing = step(Object.fromEntries(LK.map(([k, v]) => [k, v[2]])), f);
  let lh = L[1].slice();
  if (f >= 1739 && f < 1760) { let d = 99; for (const t of TAPS) d = Math.min(d, Math.abs(f - t)); lh = [lh[0] - 10 * ease(d / 3), lh[1] - 6 * ease(d / 3)]; }   // the taps: the finger lifts off and lands on each
  if (f >= 1770 && f < 1777) { const d = Math.abs(f - 1772); lh = [lh[0] - 8 * ease(d / 3), lh[1]]; }
  const armL = { s: SL, c: L[0], h: lh, finger: fing };
  const p = { face, side: sd, armL, armR };
  if (f >= 1705 && f < 1746) {   // the newspaper: up into his hand on "sure", a shake on "thing", then dropped
    const up = ease((f - 1704) / 4), shake = f >= 1733 && f < 1738 ? 6 * Math.sin((f - 1733) * 2.4) : 0, drop = f >= 1737 ? (f - 1737) : 0;
    p.paper = { x: lh[0] - 92 + shake, y: lh[1] - 16 + (1 - up) * 160 + drop * drop * 5, r: -.08 + .02 * shake + drop * .05 };
    if (drop > 0) p.paper.x -= drop * 4;
  }
  const br = Math.sin((f - 1651) * .16);
  p.headY = keyed([[1662, 0], [1665, -12], [1669, -4], [1676, -4], [1678, -12], [1684, -4], [1764, -4], [1767, -12], [1771, -10], [1784, -6]], f) + 2 * br;
  p.headTilt = keyed([[1662, .06], [1667, -.02], [1690, -.02], [1694, -.06], [1702, 0], [1764, 0], [1768, -.07], [1771, .05], [1778, .05], [1784, -.04], [1799, -.05]], f);
  p.lean = keyed([[1662, .05], [1667, 0], [1764, 0], [1767, -.05], [1776, -.02]], f) + .006 * br;
  p.puff = keyed([[1763, 0], [1766, 1], [1772, .6]], f);
  p.wink = f >= 1783 && !(f >= 1793 && f <= 1796);
  if (f >= 1783) { face.eyes = 'shut'; face.brows = f >= 1788 && f < 1792 ? 'raised' : 'smirk'; }
  p.beretTilt = keyed([[1676, 0], [1678, -.05], [1684, 0]], f);
  return p;
}
let PC = null;
function painterCard(X) { if (PC) return PC; PC = X.card('parisPainter', drawParis, PBOX, parisPose); X.CARDS.push(PC); return PC; }
export const PSPOT = [0, 0, 0];
export function headQ1() { return PL([PSPOT[0], 1.35, PSPOT[2]]); }
export function stageQ1(f, X) {
  if (!PAR) PAR = buildParis(X);
  PAR.lamp.intensity = 2.5;
  painterCard(X).at(PL(PSPOT), 1, false, .44);
}
export const READY = true;
