// stretch-D.js — the periscope stretch (frames 374–449): the grey ship steaming through the scope (bow wave, smoke),
// and the U-boat captain at his periscope in a small sub interior (place U). Same conventions as world.js / cast.js.
import * as THREE from 'three';
import { toon, put } from './world.js';
import { INK, shape, line, qline, disc, drawFace } from './cast.js';

const ss = t => (t = Math.min(1, Math.max(0, t)), t * t * (3 - 2 * t));
const lerp = (a, b, t) => a + (b - a) * t;
const keyed = (keys, f) => { if (f <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) { const [f0, a] = keys[i - 1], [f1, b] = keys[i], t = ss((f - f0) / (f1 - f0)); return Array.isArray(a) ? a.map((v, j) => lerp(v, b[j], t)) : lerp(a, b, t); } return keys[keys.length - 1][1]; };

/* ---------- the grey ship under way (shot 6p): a bow wave and funnel smoke, children of the ship ---------- */
export const SHIP_V = .5;   // m per frame along its heading
export function rigTarget(ship) {
  const g = new THREE.Group(); ship.group.add(g);
  const foam = toon({ color: 0xeef3f6 }), smoke = toon({ color: 0x9a97a4 });
  const bow = [];
  for (const [x, y, z, r] of [[20.6, .25, 0, 1.1], [19.6, .2, 2.4, 1.0], [19.6, .2, -2.4, 1.0], [18.2, .15, 3.4, .8], [18.2, .15, -3.4, .8], [16.4, .1, 3.9, .6], [16.4, .1, -3.9, .6], [21.4, .5, .9, .7]])
    bow.push(put(g, new THREE.SphereGeometry(r, 10, 7), foam, { pos: [x, y, z], scale: [1.3, .5, 1], outline: 1.2, edges: false }));
  // a foam line along the waterline
  for (const z of [3.5, -3.5]) put(g, new THREE.BoxGeometry(30, .25, .5), foam, { pos: [0, .1, z], outline: 1, edges: false });
  // smoke: per funnel, puffs born every 4 frames that drift aft and up, grow, then shrink away (no pops)
  const tops = [.47, .385, .30].map((t, i) => { const h = 5.6 - i * .3; return [(t - .5) * ship.L - .3 - Math.sin(.1) * h / 2, 4.02 + 2 + h]; });
  const puffs = []; tops.forEach(([x, y], k) => { for (let i = 0; i < 8; i++) puffs.push({ m: put(g, new THREE.SphereGeometry(1, 10, 8), smoke, { pos: [x, y, 0], outline: 1.3, edges: false }), x, y, ph: i * 4 + k * 1.3 }); });
  return { group: g, want: false,
    update(f) { bow.forEach((m, i) => { const k = 1 + .14 * Math.sin(f * .55 + i * 1.7); m.scale.set(1.3 * k, .5 * (2 - k), k); });
      for (const p of puffs) { const a = ((f - 300 + p.ph) % 32 + 32) % 32, s = (.38 + a * .045) * Math.min(1, a / 3) * Math.min(1, (32 - a) / 6);
        p.m.position.set(p.x - a * .42, p.y + a * .11 + .4 * Math.sin(a * .3 + p.ph), .1 * a); p.m.scale.setScalar(Math.max(.001, s)); } } };
}

/* ---------- place U: the U-boat control room. Captain's feet at the origin; the camera looks down -Z at him. ---------- */
// The periscope column stands at x = -.6 (screen-left of him), its eyepiece housing reaching toward his face at head height.
export function buildSub() {
  const G = new THREE.Group(); G.name = 'U';
  const wall = toon({ color: 0x5f6e5a }), rib = toon({ color: 0x4e5a4a }), deck = toon({ color: 0x6f6a72 }), ceil = toon({ color: 0x55604f });
  const brass = toon({ color: 0xc89a4e }), red = toon({ color: 0xb4483a }), steel = toon({ color: 0x5a6068 }), dark = toon({ color: 0x2e3038 }), cream = toon({ color: 0xece2c8 });
  // shell: back wall, side walls, deck, a low curved ceiling (the pressure hull)
  put(G, new THREE.BoxGeometry(9, 3.6, .3), wall, { pos: [0, 1.6, -2.5], outline: 0, edges: false });
  for (const x of [-4.2, 4.2]) put(G, new THREE.BoxGeometry(.3, 3.6, 8), wall, { pos: [x, 1.6, 1], outline: 0, edges: false });
  put(G, new THREE.BoxGeometry(9, .1, 8), deck, { pos: [0, -.05, 1], outline: 0, edges: false });
  for (let z = -2; z < 5; z += .8) put(G, new THREE.BoxGeometry(9, .02, .03), dark, { pos: [0, .005, z], outline: 0, edges: false, shadow: false });
  const hull = put(G, new THREE.CylinderGeometry(4.2, 4.2, 9, 32, 1, true, -Math.PI / 2 - .9, 1.8), ceil, { pos: [0, -.9, 0], rot: [0, 0, Math.PI / 2], outline: 0, edges: false });
  hull.material = hull.material.clone(); hull.material.side = THREE.BackSide;
  // ribs on the back wall
  for (let x = -3.6; x <= 3.6; x += 1.2) put(G, new THREE.BoxGeometry(.14, 3.4, .14), rib, { pos: [x, 1.6, -2.3], outline: 1.6 });
  // pipes along the wall, a valve wheel, a round hatch
  [[2.75, .09, brass], [2.5, .06, red], [2.3, .07, steel], [.55, .08, steel]].forEach(([y, r, m]) => put(G, new THREE.CylinderGeometry(r, r, 9, 12), m, { pos: [0, y, -2.15], rot: [0, 0, Math.PI / 2], outline: 1.5, edges: false }));
  put(G, new THREE.TorusGeometry(.2, .035, 6, 20), red, { pos: [-1.9, 2.5, -2.02], outline: 1.4, edges: false });
  for (const a of [0, Math.PI / 2]) put(G, new THREE.BoxGeometry(.4, .03, .03), red, { pos: [-1.9, 2.5, -2.02], rot: [0, 0, a], outline: 0, edges: false });
  put(G, new THREE.TorusGeometry(.55, .09, 8, 28), steel, { pos: [-2.9, 1.25, -2.3], outline: 1.8, edges: false });
  put(G, new THREE.CircleGeometry(.5, 28), dark, { pos: [-2.9, 1.25, -2.34], outline: 0, edges: false });
  // a pale chart board on the bulkhead behind his head: his head outline reads against it (C28)
  put(G, new THREE.BoxGeometry(1.7, 1.15, .05), toon({ color: 0xcfc8ae }), { pos: [-.55, 1.45, -2.3], outline: 1.8 });
  for (const [x, y, w] of [[-.9, 1.6, .5], [-.3, 1.3, .7], [-.6, 1.75, .3]]) put(G, new THREE.BoxGeometry(w, .025, .01), new THREE.MeshBasicMaterial({ color: 0x8a7f6a }), { pos: [x, y, -2.27], outline: 0, edges: false, shadow: false });
  // the gauge panel, screen-right of him: dials with cream faces and ink needles, and blinking lamps
  put(G, new THREE.BoxGeometry(1.6, 1.0, .12), steel, { pos: [1.35, 1.55, -2.25], outline: 1.8 });
  const needles = [];
  for (const [x, y, r] of [[.9, 1.72, .17], [1.32, 1.72, .17], [1.74, 1.72, .17], [1.1, 1.3, .12], [1.55, 1.3, .12]]) {
    put(G, new THREE.CylinderGeometry(r, r, .05, 24), cream, { pos: [x, y, -2.16], rot: [Math.PI / 2, 0, 0], outline: 1.6, edges: false });
    const n = new THREE.Group(); n.position.set(x, y, -2.13); G.add(n); put(n, new THREE.BoxGeometry(r * 1.6, .022, .01), new THREE.MeshBasicMaterial({ color: INK }), { pos: [r * .5, 0, 0], outline: 0, edges: false, shadow: false }); needles.push(n); }
  const lamps = [[.8, 1.13, 0x6cff9c], [1.0, 1.13, 0x6cff9c], [1.2, 1.13, 0xffc04a], [1.85, 1.13, 0xff5a40], [1.65, 1.13, 0x6cff9c]].map(([x, y, c]) => { const m = put(G, new THREE.SphereGeometry(.045, 10, 8), new THREE.MeshBasicMaterial({ color: c }), { pos: [x, y, -2.17], outline: 1.2, edges: false, shadow: false }); m.userData.c = new THREE.Color(c); return m; });
  // the red night lamp, caged, high on the wall screen-left; it lights the room
  put(G, new THREE.SphereGeometry(.13, 14, 10), new THREE.MeshBasicMaterial({ color: 0xff7a5a }), { pos: [-1.3, 2.3, -2.1], outline: 1.6, edges: false, shadow: false });
  for (const a of [-.6, 0, .6]) put(G, new THREE.TorusGeometry(.15, .012, 4, 16), dark, { pos: [-1.3, 2.3, -2.1], rot: [0, a, 0], outline: 0, edges: false });
  const redL = new THREE.PointLight(0xff5038, 2.6, 0, 1.4); redL.position.set(-1.3, 2.2, -1.6); G.add(redL);
  const grnL = new THREE.PointLight(0x58ffa0, 1.6, 0, 1.6); grnL.position.set(1.3, 1.3, -1.4); G.add(grnL);
  // the periscope: a column floor to ceiling, the eyepiece housing reaching toward his face, two training handles that fold up
  const P = new THREE.Group(); P.position.set(-.62, 0, .38); G.add(P);
  put(P, new THREE.CylinderGeometry(.1, .1, 3.4, 18), steel, { pos: [0, 1.7, 0], outline: 2, edges: false });
  put(P, new THREE.CylinderGeometry(.13, .13, .1, 18), red, { pos: [0, 2.05, 0], outline: 1.6, edges: false });
  put(P, new THREE.BoxGeometry(.4, .21, .22), toon({ color: 0x9aa2ac }), { pos: [.2, 1.34, 0], outline: 3.5 });   // the housing: a lighter steel, so its ink reads (C9)
  put(P, new THREE.CylinderGeometry(.075, .085, .08, 16), dark, { pos: [.43, 1.36, 0], rot: [0, 0, Math.PI / 2], outline: 3, edges: false });   // the rubber eye cup
  // the screen-space hull misses on a box seen face-on at 2–4 m, so the housing and cup also get a world-space ink shell (~1 cm rim, C9)
  const shell = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  { const b = new THREE.Mesh(new THREE.BoxGeometry(.42, .23, .24), shell); b.position.set(.2, 1.34, 0); P.add(b); }
  { const c = new THREE.Mesh(new THREE.CylinderGeometry(.087, .097, .1, 16), shell); c.position.set(.43, 1.36, 0); c.rotation.z = Math.PI / 2; P.add(c); }
  const handle = side => { const piv = new THREE.Group(); piv.position.set(side * .1, 1.18, 0); P.add(piv);
    put(piv, new THREE.CylinderGeometry(.03, .03, .28, 10), steel, { pos: [side * .14, 0, 0], rot: [0, 0, Math.PI / 2], outline: 1.6, edges: false });
    put(piv, new THREE.CylinderGeometry(.048, .048, .13, 12), dark, { pos: [side * .32, 0, 0], rot: [0, 0, Math.PI / 2], outline: 1.6, edges: false });
    return piv; };
  const hR = handle(1), hL = handle(-1);
  return { group: G, want: false, P, hR, hL, needles, lamps,
    // handle fold 0 = out level, 1 = folded straight up
    fold(u) { hR.rotation.z = u * Math.PI / 2; hL.rotation.z = -u * Math.PI / 2; },
    gripWorld() { return hR.localToWorld(new THREE.Vector3(.32, 0, 0)); },
    update(f) { needles.forEach((n, i) => n.rotation.z = 1.9 - i * .7 + .08 * Math.sin(f * (.3 + i * .11) + i)); lamps.forEach((m, i) => { const on = ((Math.floor(f / (5 + i * 2)) + i) % 3) !== 0; m.material.color.copy(m.userData.c).multiplyScalar(on ? 1 : .3); }); } };
}

/* ---------- THE CAPTAIN: a U-boat commander in a white-topped cap, a short dark beard, a cream turtleneck under a leather jacket ---------- */
const FACE = '#f4f5f7', OL = 8, LIMB = 10.5, HEAD_LW = 4.4;
const CP = { headTop: -593, headH: 172, bodyTop: -427, hem: -215, legTop: -227 };   // legs 1.25–1.3 head heights (P9)
export const CAPBOX = [-330, -745, 280, 24];
function headPath(ctx, cx, top, w, h) {
  const rx = w / 2, my = top + h * 0.47, k = 0.56;
  ctx.moveTo(cx, top); ctx.bezierCurveTo(cx + rx * k, top, cx + rx, my - h * 0.47 * k, cx + rx, my);
  ctx.bezierCurveTo(cx + rx, my + h * 0.53 * k * 1.05, cx + rx * k * 0.95, top + h, cx, top + h);
  ctx.bezierCurveTo(cx - rx * k * 0.95, top + h, cx - rx, my + h * 0.53 * k * 1.05, cx - rx, my);
  ctx.bezierCurveTo(cx - rx, my - h * 0.47 * k, cx - rx * k, top, cx, top); ctx.closePath();
}
// the shoulder point after the body's lean (rotation about the hem)
const leanPt = (x, y, a) => { const dy = y - CP.hem; return [x * Math.cos(a) - dy * Math.sin(a), CP.hem + x * Math.sin(a) + dy * Math.cos(a)]; };
export function drawCaptain(ctx, p = {}) {
  const f = p.face || {}, bw = 66, lean = p.lean || 0;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // legs: dark trousers as stick limbs, sea boots
  for (const s of [-1, 1]) { const x = s * 24; line(ctx, [[x, CP.legTop], [x + s * 4, -30]], LIMB);
    shape(ctx, () => { const bx = x + s * 10; ctx.moveTo(bx - 30, 0); ctx.lineTo(bx + 30, 0); ctx.quadraticCurveTo(bx + 34, -2, bx + 30, -14); ctx.quadraticCurveTo(bx + 14, -46, bx - 6, -44); ctx.quadraticCurveTo(bx - 32, -42, bx - 32, -12); ctx.quadraticCurveTo(bx - 34, -2, bx - 30, 0); ctx.closePath(); }, '#3c3846', 6.5); }
  ctx.save(); ctx.translate(0, CP.hem); ctx.rotate(lean); ctx.translate(0, -CP.hem);
  const coat = () => { const t = CP.bodyTop, h = CP.hem; ctx.moveTo(-bw * .55, t); ctx.lineTo(bw * .55, t); ctx.quadraticCurveTo(bw + 4, t + 4, bw + 10, t + 90); ctx.quadraticCurveTo(bw + 14, h - 60, bw + 8, h + 6);
    ctx.lineTo(-bw - 8, h + 6); ctx.quadraticCurveTo(-bw - 14, h - 60, -bw - 10, t + 90); ctx.quadraticCurveTo(-bw - 4, t + 4, -bw * .55, t); ctx.closePath(); };
  ctx.save(); ctx.translate(7, 4); shape(ctx, coat, INK, 0); ctx.restore();   // weighted outline: an ink copy behind
  shape(ctx, coat, '#8a6a52', 0);   // leather jacket
  ctx.save(); ctx.beginPath(); coat(); ctx.clip();
  ctx.fillStyle = 'rgba(30,16,40,.25)'; ctx.fillRect(bw * .4, CP.bodyTop - 10, 120, 400);   // shadow side
  line(ctx, [[-bw * .72, CP.bodyTop + 50], [-bw * .82, CP.hem - 20]], 3.4, 'rgba(255,220,190,.5)');   // highlight
  // the cream sweater down the open front, ribbed
  const front = () => { ctx.moveTo(-34, CP.bodyTop - 4); ctx.lineTo(34, CP.bodyTop - 4); ctx.lineTo(22, CP.hem + 10); ctx.lineTo(-22, CP.hem + 10); ctx.closePath(); };
  shape(ctx, front, '#ece0c2', 4.5); ctx.save(); ctx.beginPath(); front(); ctx.clip(); for (let x = -30; x <= 30; x += 10) line(ctx, [[x, CP.bodyTop + 30], [x * .7, CP.hem + 10]], 2.2, 'rgba(150,120,90,.45)'); ctx.restore();
  // lapels
  for (const s of [-1, 1]) shape(ctx, () => { ctx.moveTo(s * 34, CP.bodyTop - 2); ctx.lineTo(s * 66, CP.bodyTop + 10); ctx.lineTo(s * 30, CP.bodyTop + 110); ctx.closePath(); }, '#6e5240', 4);
  ctx.restore(); shape(ctx, coat, null, OL);
  // turtleneck roll
  shape(ctx, () => { ctx.ellipse(0, CP.bodyTop - 4, 52, 20, 0, 0, 7); }, '#ece0c2', 4.5);
  for (let x = -36; x <= 36; x += 12) line(ctx, [[x, CP.bodyTop - 16], [x, CP.bodyTop + 8]], 2.2, 'rgba(150,120,90,.5)');
  // head
  const top = CP.headTop + (p.headY || 0), H = CP.headH, hx = p.headX || 0;
  ctx.save(); ctx.translate(hx, top + H * .65); ctx.rotate(p.headTilt || 0); ctx.translate(-hx, -(top + H * .65));
  ctx.save(); ctx.translate(8, 5); shape(ctx, () => headPath(ctx, hx, top, 190, H), INK, HEAD_LW); ctx.restore();
  shape(ctx, () => headPath(ctx, hx, top, 190, H), FACE, 0);
  ctx.fillStyle = 'rgba(96,90,170,.10)'; ctx.save(); ctx.beginPath(); headPath(ctx, hx, top, 190, H); ctx.clip(); ctx.beginPath(); ctx.ellipse(hx + 70, top + H * .7, 60, 70, 0, 0, 7); ctx.fill();
  // the short beard along the jaw, clear of the mouth
  const fx = hx + (f.fx ?? 0), ey = top + H * .5, my = ey + 46;
  shape(ctx, () => { ctx.moveTo(hx - 84, ey + 34); ctx.quadraticCurveTo(hx - 70, top + H + 16, fx, top + H + 16); ctx.quadraticCurveTo(hx + 70, top + H + 16, hx + 84, ey + 34);
    ctx.quadraticCurveTo(hx + 50, ey + 50, fx + 30, my + 6); ctx.quadraticCurveTo(fx, my + 26, fx - 30, my + 6); ctx.quadraticCurveTo(hx - 50, ey + 50, hx - 84, ey + 34); ctx.closePath(); }, '#7a5c50', 0);
  ctx.restore();
  shape(ctx, () => headPath(ctx, hx, top, 190, H), null, HEAD_LW);
  drawFace(ctx, fx, ey, my, f);
  // moustache: two short curls over the mouth
  for (const s of [-1, 1]) qline(ctx, [fx + s * 4, my - 12], [fx + s * 22, my - 20], [fx + s * 34, my - 6], 7, '#7a5c50');
  // the cap: a white crown worn rakishly, a black band and peak, a small gold badge
  ctx.save(); ctx.translate(hx, top + 20); ctx.rotate(-.1); ctx.translate(-hx, -(top + 20));
  const ct = top - 22, crown = () => { ctx.moveTo(hx - 104, top + 34); ctx.bezierCurveTo(hx - 128, ct - 18, hx - 40, ct - 34, hx + 20, ct - 30); ctx.bezierCurveTo(hx + 96, ct - 26, hx + 132, ct - 6, hx + 106, top + 30); ctx.closePath(); };
  shape(ctx, crown, '#f2efe6', 0); ctx.save(); ctx.beginPath(); crown(); ctx.clip(); ctx.fillStyle = 'rgba(96,90,170,.16)'; ctx.fillRect(hx + 40, ct - 40, 120, 90); ctx.restore(); shape(ctx, crown, null, 6.5);
  shape(ctx, () => { ctx.moveTo(hx - 100, top + 22); ctx.quadraticCurveTo(hx, top + 12, hx + 102, top + 20); ctx.lineTo(hx + 100, top + 48); ctx.quadraticCurveTo(hx, top + 40, hx - 98, top + 50); ctx.closePath(); }, '#24202c', 4);
  const pk = (f.fx ?? 0) * .6;
  shape(ctx, () => { ctx.moveTo(hx - 70 + pk, top + 46); ctx.quadraticCurveTo(hx + pk, top + 82, hx + 80 + pk, top + 44); ctx.quadraticCurveTo(hx + pk, top + 58, hx - 70 + pk, top + 46); ctx.closePath(); }, '#24202c', 5);
  disc(ctx, hx + 4, top + 30, 9, '#e8b84a', 3);
  ctx.restore();
  ctx.restore();
  ctx.restore();
  // arms, in front: from the leaned shoulders; ink hands, a cream sweater cuff
  for (const a of [p.armL, p.armR]) { if (!a) continue; const s = leanPt(a.s[0], a.s[1], lean); qline(ctx, s, a.c, a.h, LIMB);
    const dx = a.h[0] - a.c[0], dy = a.h[1] - a.c[1], L = Math.hypot(dx, dy) || 1;
    line(ctx, [[a.h[0] - dx / L * 24 - dy / L * 9, a.h[1] - dy / L * 24 + dx / L * 9], [a.h[0] - dx / L * 24 + dy / L * 9, a.h[1] - dy / L * 24 - dx / L * 9]], 7, '#ece0c2');
    disc(ctx, a.h[0], a.h[1], 11.5, INK); }
  ctx.restore();
}

// the captain's acting, f = global frame. CAPG.grip (drawing units) is where the near handle's grip falls on his card (set by the stage).
export const CAPG = { grip: [-120, -435] };
const CFACE = { 0: 'squint/smile/smirk', 419: 'half/grin/smirk/.35', 436: 'half/grin/raised/.5', 440: 'half/grin/smirk/.4' };
const CBLINK = [417];
export function captainPose(who, f) {
  if (f >= 800) return captainEnd(f);   // [K v18] the end, in new frames (vo/zebra-v2)
  let st = null; for (const k of Object.keys(CFACE).map(Number).sort((a, b) => a - b)) if (k <= f) st = CFACE[k];
  let [eyes, mouth, brows, open] = st.split('/'); for (const a of CBLINK) { const k = f - a; if (k >= 0 && k <= 3) eyes = k === 0 || k === 3 ? 'half' : 'line'; }
  const at = f < 419;   // eye at the eyepiece
  const face = { eyes, mouth, brows, open: +open || 0, look: at ? [-1, 0] : [.25, .05], fx: at ? -24 : 8 };
  // pull back from the eyepiece on "anyone" (420): 417–423
  const chuckle = f >= 437 && f < 446 ? Math.sin((f - 437) * 1.6) * (1 - (f - 437) / 9) : 0;   // a smug chuckle: the shoulders shake
  const headX = keyed([[416, -50], [423, 20]], f), lean = keyed([[416, -.05], [423, .045], [436, .045], [439, .02], [444, .035]], f) + .012 * chuckle, headTilt = keyed([[416, -.06], [423, .04]], f);
  const headY = keyed([[434, 0], [437, -10], [442, 0]], f) - 10 * Math.abs(chuckle);
  // the near arm holds the grip until the handles are folded (424–428), then drops to the hip
  const hip = [-96, -265], gh = CAPG.grip, rel = ss((f - 429) / 6);
  const h = [lerp(gh[0], hip[0], rel), lerp(gh[1], hip[1], rel)];
  const armL = { s: [-54, -411], c: [lerp(-130, -150, rel), lerp(-385, -325, rel)], h };
  const armR = { s: [54, -411], c: [128, -337], h: [84, -271] };   // hand on the hip, elbow out
  return { face, headX, headY, headTilt, lean, armL, armR };
}

// [K v18, r15] the end (new frames 815–989, vo/zebra-v2): from 815 he breathes and glances about by the periscope (no still frames); a yawn
// on "morning" (837); on "submarine captain" (857–870) he looks to the column, then a closed-mouth smirk (he is not the one talking); he
// reaches down for the grip (874–881) and pulls the periscope up from waist height on "raises" (882–892), his eyes on it; on "periscope"
// (899) his eye is at the cup (893–900). From 975: he takes his eye off it, brows down, lip bitten: the stripes lie.
const EFACE = [[0, 'half/smile/flat/0'], [836, 'shut/open/raised/.75'], [849, 'half/smile/flat/0'], [867, 'half/smile/smirk/0'], [876, 'half/bite/raised/0'], [893, 'squint/smile/smirk/0'], [976, 'half/bite/angry/0']];
const EBLINK = [826, 862, 889, 979];
export function captainEnd(f) {
  let st = EFACE[0][1]; for (const [k, v] of EFACE) if (k <= f) st = v;
  let [eyes, mouth, brows, open] = st.split('/'); for (const a of EBLINK) { const k = f - a; if (k >= 0 && k <= 3) eyes = k === 0 || k === 3 ? 'half' : 'line'; }
  const at = f < 975 ? ss((f - 893) / 7) : 1 - .55 * ss((f - 975) / 8);   // leaning in to the cup (893–900); back off it from 975
  const look = f >= 975 ? [-.7, .05] : at > .5 ? [-1, 0] : f >= 874 ? [-.7, .35] : f >= 855 && f < 866 ? [-.8, -.05] : [.25 + .35 * Math.sin((f - 815) * .1), .05];
  const face = { eyes, mouth, brows, open: +open || 0, look, fx: lerp(8, -24, at) };
  const yawn = f >= 836 && f < 851 ? Math.sin(Math.PI * (f - 836) / 15) : 0, br = Math.sin(f * .2);   // a breath every ~31 frames
  const prd = f >= 850 && f < 874 ? Math.sin(Math.PI * (f - 850) / 24) : 0;   // [K r16] "a submarine captain" (852–869): he draws himself up, chin up, and settles (was 8 still frames)
  const headX = lerp(20, -50, at) + 6 * Math.sin((f - 815) * .1) * (1 - at) + 12 * prd, lean = lerp(.035, -.05, at) - .025 * yawn + .01 * br - .03 * prd;
  const headTilt = lerp(.04, -.06, at) + .07 * yawn - .09 * prd + (f >= 975 ? .05 * ss((f - 975) / 8) : 0), headY = -9 * yawn - 3 * br + 14 * prd;
  // the near arm: on the hip, down to the grip (874–881); the hand rides the grip up and stays on it
  const hip = [-96, -265], gh = CAPG.grip, r = ss((f - 874) / 7);
  const armL = { s: [-54, -411], c: [lerp(-150, -150, r), lerp(-325, -330, r)], h: [lerp(hip[0], gh[0], r), lerp(hip[1], gh[1], r)] };
  const armR = { s: [54, -411], c: [128, -337], h: [84, -271] };
  return { face, headX, headY, headTilt, lean, armL, armR };
}
