// stretch-N.js — part 2, builder N, frames 1155–1293: "Well, ever thrown a ball to a friend who's running?
// You don't aim at him, you aim at where he'll be." The harbour quay (H) by day: the painter with a ball, the dock worker.
// 1155–1182: on the painter, tossing a ball; the wind-up lands on "ball" (1182). 1186–1212: one pull-back and truck right
// to the two-shot; the worker, far down the quay, waves on "friend" (1196) and is in full sprint toward us on "running" (1213).
// "aim" (1232): a dashed aim line grows from the ball to him; "him" (1246): a red X strikes it out. "you aim" (1256–1264): the line
// swings ahead to the spot on the quay he is running to; "where" (1269): a target ring pops there and the ball is thrown;
// "he'll" (1274): the ring pulses; "be" (1280): he runs into the ring and the ball lands in his hands.
// The line, the X, the speed lines and the catch burst are flat comic graphics drawn over the frame (under the captions);
// the ring is painted flat on the quay (so his boots stand in it). P reuses drawAimLine / drawStrike / buildTargetRing.
// Same conventions as world.js / cast.js / stretch-B.js. Nothing is added to the scene before the first call of stage().
import * as THREE from 'three';
import { drawPainter, qline, disc } from './cast.js';
import { drawPerson, BOXB } from './stretch-B.js';
import { put, toon, tex } from './world.js';
export const READY = true;

const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t), sst = t => (t = t < 0 ? 0 : t > 1 ? 1 : t, t * t * t * (t * (t * 6 - 15) + 10));
const lerp = (a, b, t) => a + (b - a) * t, lp = (a, b, t) => Array.isArray(a) ? a.map((x, i) => lp(x, b[i], t)) : lerp(a, b, t);
function key(keys, f) { if (f <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) { const [f0, a] = keys[i - 1], [f1, b] = keys[i]; return lp(a, b, ease((f - f0) / (f1 - f0))); } return keys[keys.length - 1][1]; }
const step = (tab, f) => { let v = tab[0][1]; for (const [k, x] of tab) if (k <= f) v = x; return v; };
const blink = (f, starts, eyes) => { for (const a of starts) { const k = f - a; if (k >= 0 && k <= 3) return k === 0 || k === 3 ? 'half' : 'line'; } return eyes; };
const face = (s, look, fx, f, bl) => { let [eyes, mouth, brows, open] = s.split('/'); eyes = blink(f, bl, eyes); return { eyes, mouth, brows, open: +open || 0, look, fx }; };

// ================= the comic overlays (exported: P draws the same line and ring in the scope view) =================
export const OV_YELLOW = '#f2c230', OV_RED = '#d8483c', OV_CREAM = '#f4efe2', OV_INK = '#1c1118';
// a dashed aim line from a to b (screen px), the dashes marching toward b; t grows it from a (0..1); an arrowhead at the tip.
// o: { t, phase (px), w (width scale), alpha, head, col }
export function drawAimLine(g, a, b, o = {}) {
  const t = o.t ?? 1, w = o.w ?? 1, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) * t; if (L < 2) return;
  const ux = dx / Math.hypot(dx, dy), uy = dy / Math.hypot(dx, dy), D = 26 * w, G = 15 * w, hl = o.head === false ? 0 : 30 * w, end = L - hl * .8;
  g.save(); g.globalAlpha *= o.alpha ?? 1; g.lineCap = 'round'; g.lineJoin = 'round';
  const dashes = []; for (let s = -((o.phase ?? 0) % (D + G)) - (D + G); s < end; s += D + G) { const s0 = Math.max(0, s), s1 = Math.min(end, s + D); if (s1 - s0 > 3) dashes.push([s0, s1]); }
  for (const [lw, col] of [[15 * w, OV_INK], [7.5 * w, o.col ?? OV_YELLOW]]) { g.lineWidth = lw; g.strokeStyle = col; g.beginPath();
    for (const [s0, s1] of dashes) { g.moveTo(a[0] + ux * s0, a[1] + uy * s0); g.lineTo(a[0] + ux * s1, a[1] + uy * s1); } g.stroke(); }
  if (hl) { const tx = a[0] + ux * L, ty = a[1] + uy * L, nx = -uy, ny = ux, bx = tx - ux * hl, by = ty - uy * hl;   // the head: same shape language as buildArrow
    g.beginPath(); g.moveTo(tx, ty); g.lineTo(bx + nx * hl * .55, by + ny * hl * .55); g.lineTo(bx - nx * hl * .55, by - ny * hl * .55); g.closePath();
    g.fillStyle = o.col ?? OV_YELLOW; g.fill(); g.lineWidth = 4.5 * w; g.strokeStyle = OV_INK; g.stroke(); }
  g.restore();
}
// a red comic X (struck out) at c, size px, scale k (pop), slightly rotated
export function drawStrike(g, c, size, k = 1, o = {}) {
  if (k <= 0) return; const s = size * k / 2, r = o.rot ?? .12;
  g.save(); g.globalAlpha *= o.alpha ?? 1; g.translate(c[0], c[1]); g.rotate(r); g.lineCap = 'round';
  for (const [lw, col] of [[size * .3 + 6, OV_INK], [size * .3 - 3, o.col ?? OV_RED]]) { g.lineWidth = lw; g.strokeStyle = col; g.beginPath(); g.moveTo(-s, -s); g.lineTo(s, s); g.moveTo(s, -s * .92); g.lineTo(-s * .95, s); g.stroke(); }
  g.lineWidth = 3; g.strokeStyle = 'rgba(255,235,220,.7)'; g.beginPath(); g.moveTo(-s * .7, -s * .78); g.lineTo(-s * .25, -s * .33); g.stroke();
  g.restore();
}
// the target: red / cream / red bands and a red bull, ink rings; flash 0..1 lights the cream; ripple = [radius scale, alpha]
export function drawTargetArt(g, cx, cy, r, o = {}) {
  const fl = o.flash ?? 0, cream = fl > 0 ? `rgb(${255},${Math.round(239 + 12 * fl)},${Math.round(226 - 60 * fl)})` : OV_CREAM;
  const band = (rr, col) => { g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.fillStyle = col; g.fill(); g.lineWidth = r * .045; g.strokeStyle = OV_INK; g.stroke(); };
  band(r * .93, OV_RED); band(r * .68, cream); band(r * .43, OV_RED); band(r * .18, cream);
  for (const [rs, al] of o.ripples ?? []) if (al > 0 && rs * r * .93 < r) { g.beginPath(); g.arc(cx, cy, rs * r * .93, 0, 7); g.lineWidth = r * .06; g.strokeStyle = `rgba(28,17,24,${al})`; g.stroke(); g.lineWidth = r * .03; g.strokeStyle = `rgba(242,194,48,${al})`; g.stroke(); }
}
// a flat target ring lying on a surface (local XZ plane, y up), radius r m; set(k, flash, ripples) redraws it.
// The plane holds ripples out to 1.7 r. Add it to the scene and place it yourself.
export function buildTargetRing(r = .6) {
  const N = 512, R = N / 2 / 1.7, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * r * 1.7, 2 * r * 1.7), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .35, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 3; const grp = new THREE.Group(); grp.add(m); grp.visible = false;
  let last = '';
  return { group: grp, mesh: m, r,
    set(k = 1, flash = 0, ripples = []) { grp.scale.set(k, 1, k); const id = [flash.toFixed(2), ...ripples.flat().map(v => v.toFixed(2))].join(); if (id === last) return; last = id;
      g.clearRect(0, 0, N, N); for (const [rs, al] of ripples) if (al > 0) { g.beginPath(); g.arc(N / 2, N / 2, rs * R * .93, 0, 7); g.lineWidth = R * .07; g.strokeStyle = `rgba(28,17,24,${al})`; g.stroke(); g.lineWidth = R * .035; g.strokeStyle = `rgba(242,194,48,${al})`; g.stroke(); }
      drawTargetArt(g, N / 2, N / 2, R, { flash }); t.needsUpdate = true; } };
}
// comic speed lines: n strokes starting near p (px), streaming along dir (unit, px space), spread across it
export function drawSpeedLines(g, p, dir, n, len, spread, alpha = 1, seed = 1) {
  const nx = -dir[1], ny = dir[0]; g.save(); g.globalAlpha *= alpha; g.lineCap = 'round';
  for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * spread, j = ((i * 37 + seed * 11) % 13) / 13, s = 10 + j * 18, l = len * (.6 + .4 * ((i * 53 + seed) % 7) / 7);
    const x0 = p[0] + nx * o + dir[0] * s, y0 = p[1] + ny * o + dir[1] * s;
    for (const [lw, col] of [[8, OV_INK], [3.5, OV_CREAM]]) { g.lineWidth = lw; g.strokeStyle = col; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + dir[0] * l, y0 + dir[1] * l); g.stroke(); } }
  g.restore();
}
// a comic dust kick at a runner's feet (p px, body height pm px), t 0..1: little cloud puffs out to both sides, rising and fading
export function drawDust(g, p, pm, t) {
  g.save(); g.globalAlpha *= (1 - t) * .85; g.lineWidth = 2.5; g.strokeStyle = 'rgba(28,17,24,.6)'; g.fillStyle = '#e9dfd2';
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const r = pm * (.035 + .02 * i) * (.6 + .8 * t), x = p[0] + s * pm * (.12 + .1 * i + .25 * t), y = p[1] - pm * (.02 + .03 * i) - pm * .08 * t;
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); }
  g.restore();
}
// a comic impact burst round c: short radial strokes, k 0..1 (out and fading)
export function drawBurst(g, c, r, k) {
  if (k <= 0 || k >= 1) return; g.save(); g.lineCap = 'round'; g.globalAlpha *= 1 - k * k;
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + .3, r0 = r * (.7 + .6 * k), r1 = r0 + r * (.55 + .25 * (i % 2)) * (1 - .4 * k);
    for (const [lw, col] of [[9, OV_INK], [4, OV_YELLOW]]) { g.lineWidth = lw; g.strokeStyle = col; g.beginPath(); g.moveTo(c[0] + Math.cos(a) * r0, c[1] + Math.sin(a) * r0); g.lineTo(c[0] + Math.cos(a) * r1, c[1] + Math.sin(a) * r1); g.stroke(); } }
  g.restore();
}
// The overlay canvas: a 720x1280 layer over the WebGL frame and under the captions. A shot's stage() calls ov.queue(fn) with a
// draw function for the frame being painted; it is drawn once window.__paint returns, faded by the dissolve weight `w(f)`.
// Install before index.html assigns window.__paint (this module is imported first, so that holds here).
export function makeOverlay(w = () => 1) {
  let real = null, pending = null, cv = null;
  const ensure = () => { if (cv) return cv; cv = document.createElement('canvas'); cv.width = 720; cv.height = 1280; cv.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none';
    const all = document.body.querySelectorAll('canvas'), capt = all[all.length - 1]; document.body.insertBefore(cv, capt && capt !== all[0] ? capt : null); return cv; };
  const wrap = fn => f => { pending = null; fn(f); const c = cv; if (c) c.getContext('2d').clearRect(0, 0, 720, 1280);
    if (pending) { const g = ensure().getContext('2d'); g.save(); g.globalAlpha = w(Math.round(f)); if (g.globalAlpha > 0) pending(g); g.restore(); } };
  const prev = Object.getOwnPropertyDescriptor(window, '__paint');   // another overlay installed first: chain onto it
  Object.defineProperty(window, '__paint', { configurable: true, get: () => prev?.get ? prev.get() : real, set: fn => { if (prev?.set) prev.set(wrap(fn)); else real = wrap(fn); } });
  return { queue(fn) { pending = fn; } };
}

// ================= the staging =================
// the stage frame on the H quay (H-local = world): origin O on the quay top, forward F (+x, along the quay), right R (+z, toward the water)
const Y0 = 2.01, O = new THREE.Vector3(38, Y0, -19), F = new THREE.Vector3(1, 0, 0), RT = new THREE.Vector3(0, 0, 1);
const P = (u, v, h = 0) => O.clone().addScaledVector(RT, u).addScaledVector(F, v).add(new THREE.Vector3(0, h, 0));
const PAINT = [-.35, 4.75];   // the painter's feet (u, v)
// the worker: waits down the quay to the right of the painter, sets off ACROSS the frame on "who's" (1203), a jog to 1250,
// then a sprint (1250–1260) into the ring on "be" (1280), stops by 1292. Speeds in m/s; the path is a table of metres run per frame.
const WS = [.02, 6.6], WANG = 1.66, RUN0 = 1203, RUNF = 1213, CATCH = 1280, VJ = .6, VS = 3.8, SP0 = 1256;
const WDIR = [Math.sin(WANG), Math.cos(WANG)];
const spdAt = f => f < RUN0 ? 0 : f < 1211 ? VJ * (f - RUN0) / 8 : f < SP0 ? VJ : f < SP0 + 8 ? VJ + (VS - VJ) * (f - SP0) / 8 : f < CATCH ? VS : f < 1292 ? VS * (1 - (f - CATCH) / 12) : 0;
const SRUN = []; for (let f = RUN0, s = 0; f <= 1292; f++) { SRUN[f - RUN0] = s; s += spdAt(f + .5) / 30; }
function runS(f) { if (f <= RUN0) return 0; if (f >= 1292) return SRUN[1292 - RUN0]; const i = Math.floor(f), t = f - i; return SRUN[i - RUN0] + (SRUN[i + 1 - RUN0] - SRUN[i - RUN0]) * t; }
const workerUV = f => { const s = runS(f); return [WS[0] + WDIR[0] * s, WS[1] + WDIR[1] * s]; };
const WE = workerUV(CATCH);   // where he will be on "be": the ring
const RELEASE = 1269;

// ---------- the painter's acting (drawing units, as cast.js) ----------
const SL = [-56, -414], SR = [56, -414];
let AIM = [300, -430];   // where the front arm points, in the painter card's drawing units (set by stage() before the cards are painted)
const PFACE = [[0, 'half/smile/smirk'], [1176, 'squint/bite/flat'], [1194, 'ring/smile/raised'], [1222, 'squint/bite/flat'], [1247, 'ring/line/worried'], [1257, 'half/smile/smirk'], [1266, 'squint/bite/angry'], [1280, 'shut/smile/laugh']];
const PBLINK = [1163, 1174, 1192, 1220, 1245, 1255, 1264, 1278];
// the throwing arm (screen-left): the toss, the wind-up (1175–1182), the hold, the overarm throw (1265–1272), the follow-through
const PARM_L = [[1175, [[-140, -350], [-92, -318]]], [1182, [[-160, -560], [-95, -725]]], [1265, [[-160, -560], [-95, -725]]], [1267, [[-120, -700], [-20, -760]]],
  [1269, [[60, -700], [150, -660]]], [1271, [[150, -520], [235, -430]]], [1275, [[130, -400], [200, -330]]], [1300, [[110, -370], [150, -310]]]];
const BACK_L = f => f >= 1266 && f < 1276;   // the throwing arm passes behind his head (drawn under the head and smock)
// the aiming arm (screen-right) points down the quay from the wind-up to the throw, then tucks; a small fist on "be"
const PARM_R = [[1175, [[88, -340], [80, -268]]], [1182, [[150, -440], [240, -440]]], [1222, [[150, -440], [240, -430]]], [1246, [[150, -430], [242, -415]]], [1258, [[150, -420], [244, -390]]],
  [1265, [[150, -420], [244, -390]]], [1271, [[100, -340], [62, -292]]], [1280, [[100, -340], [62, -292]]], [1284, [[130, -480], [150, -575]]], [1300, [[130, -480], [150, -575]]]];
// the painter drawn with his throwing arm behind him when it crosses over his head (cast.js draws both arms in front)
function drawPainterN(ctx, p) { const a = p.armL; if (a && a.back) { ctx.save(); ctx.lineCap = 'round'; qline(ctx, a.s, a.c, a.h, 10.5); disc(ctx, a.h[0], a.h[1], 11.5, '#1c1118'); ctx.restore(); p = { ...p, armL: null }; } drawPainter(ctx, p); }
export function painterPose(who, f) {
  const look = f < 1176 ? [.25, -.15] : f < 1257 ? [.8, -.25] : f < 1280 ? [.8, .25] : [.4, 0];
  const p = { face: face(step(PFACE, f), look, 13, f, PBLINK), smudge: true };
  let [cl, hl] = key(PARM_L, f);
  if (f < 1175) { const ph = ((f - 1144) % 12 + 12) % 12; if (ph >= 10) hl = [hl[0], hl[1] + 14 * Math.sin((ph - 10) / 2 * Math.PI)]; }   // the hand gives as he catches each toss
  let [cr, hr] = key(PARM_R, f);
  const aw = ease((f - 1176) / 6) * (1 - ease((f - 1265) / 6));
  if (aw > 0) { const d = Math.hypot(AIM[0] - SR[0], AIM[1] - SR[1]) || 1, ux = (AIM[0] - SR[0]) / d, uy = (AIM[1] - SR[1]) / d;   // the front arm points along the aim line
    cr = lp(cr, [SR[0] + ux * 60 + uy * 20, SR[1] + uy * 60 - ux * 20], aw); hr = lp(hr, [SR[0] + ux * 118, SR[1] + uy * 118], aw); }
  p.armL = { s: SL, c: cl, h: hl, back: BACK_L(f) }; p.armR = { s: SR, c: cr, h: hr, noBrush: true };
  p.lean = key([[1175, 0], [1182, -.07], [1264, -.08], [1269, .12], [1276, .07], [1290, .03]], f) + (f < 1175 ? .012 * Math.sin(f * .52) : 0);
  p.headY = f < 1175 ? -4 * Math.abs(Math.sin(f * Math.PI / 12)) : key([[1269, 0], [1271, 8], [1278, 0], [1280, -10], [1285, 0]], f);
  if (f >= 1176) p.stride = Math.PI / 2;   // feet apart: the thrower's stance
  if (f >= 1247 && f < 1257) { const t = (f - 1247) / 10; p.headX = 14 * Math.sin(t * Math.PI * 3) * (1 - t); p.headTilt = .05 * Math.sin(t * Math.PI * 3) * (1 - t); }   // "no": a small shake
  return p;
}
// ---------- the worker's acting ----------
const WFACE = [[0, 'half/smile/flat'], [1196, 'ring/smile/raised'], [1205, 'half/line/angry'], [1270, 'ring/dot/raised'], [1280, 'shut/smile/laugh']];
const WBLINK = [1186, 1194, 1203, 1268, 1278];
const runPh = f => .95 * (f - RUN0);
export function workerPose(who, f) {
  const look = f < 1270 ? [-.7, -.1] : f < 1280 ? [-.5, -.9] : [-.3, -.2];
  const p = { kind: 'worker', face: face(step(WFACE, f), look, look[0] * 14, f, WBLINK) };
  const hips = { armL: { s: SL, c: [-132, -380], h: [-74, -300] }, armR: { s: SR, c: [132, -380], h: [74, -300] } };
  const k = Math.sin(runPh(f)), amp = f < RUN0 ? 0 : ease((f - RUN0) / 8) * (1 - ease((f - 1282) / 8));
  if (f < 1194) Object.assign(p, hips);
  else if (f < 1205) { const u = ease((f - 1194) / 2) * (1 - ease((f - 1203) / 2)), w = Math.sin((f - 1194) * .9);   // "here!": both arms up, waving
    p.armL = { s: SL, c: lp([-132, -380], [-150 - 20 * w, -540], u), h: lp([-74, -300], [-125 - 30 * w, -690], u) };
    p.armR = { s: SR, c: lp([132, -380], [150 - 20 * w, -540], u), h: lp([74, -300], [125 - 30 * w, -690], u) }; }
  else { const pump = { armL: { s: SL, c: [-150, -400 + 44 * k], h: [-112 - 20 * k, -380 - 115 * k] }, armR: { s: SR, c: [150, -400 - 44 * k], h: [112 - 20 * k, -380 + 115 * k] } };   // r20: a real arm pump, elbows bent, fists to chest height
    const reach = ease((f - 1271) / 7), hold = key([[1280, 0], [1284, 1], [1290, .6]], f);   // up for the ball, then he holds it up high (never down across his face)
    const cL = [-175, -600 - 30 * hold], hL = [-12, -722 - 26 * hold], cR = [225, -600 - 30 * hold], hR = [62, -722 - 26 * hold];
    p.armL = { s: SL, c: lp(pump.armL.c, cL, reach), h: lp(pump.armL.h, hL, reach) }; p.armR = { s: SR, c: lp(pump.armR.c, cR, reach), h: lp(pump.armR.h, hR, reach) }; }
  p.kick = .75 * k * amp; p.lean = .17 * amp; p.headY = -7 * Math.abs(k) * amp + (f >= 1196 && f < 1203 ? -8 : 0);
  if (f >= 1280) p.headY += key([[1280, -14], [1286, 0]], f);
  return p;
}
const handsW = f => { const p = workerPose('', f); return [(p.armL.h[0] + p.armR.h[0]) / 2, (p.armL.h[1] + p.armR.h[1]) / 2]; };

// ---------- the camera (stage frame → world): [frame, u, v, h, lookU, lookV, lookH, fov, shiftY] ----------
// a medium close-up on the painter (he sits right of centre, the wind-up goes up into the left), a slow push in;
// 1186–1212 one move back and to the right to the two-shot; then a slow drift in and right with the run, never still
const CK = [[1146, -.5, 1.1, 1.5, -.5, 40, 1.5, 36, 167], [1183, -.48, 1.45, 1.5, -.48, 40, 1.5, 36, 167],
  [1208, .3, -2.4, 1.7, 2.6, 40, 1.6, 40, 250]];
// from 1208 one steady orbit round the painter (he holds his place in frame, eased in over 12 frames): the quay swings behind him,
// so the runner crosses the frame left to right while the camera turns with him
const ORB_TH = -.65, orbTh = f => f <= 1208 ? 0 : f < 1220 ? ORB_TH * ((f - 1208) ** 2 / 24) / 82 : ORB_TH * (f - 1214) / 82;
function pchip(K, f, j) { const n = K.length; if (f <= K[0][0]) return K[0][j]; if (f >= K[n - 1][0]) return K[n - 1][j]; let i = 1; while (f > K[i][0]) i++;
  const tan = k => { if (k === 0 || k === n - 1) return 0; const d0 = (K[k][j] - K[k - 1][j]) / (K[k][0] - K[k - 1][0]), d1 = (K[k + 1][j] - K[k][j]) / (K[k + 1][0] - K[k][0]); if (d0 * d1 <= 0) return 0;
    const w0 = 2 * (K[k + 1][0] - K[k][0]) + (K[k][0] - K[k - 1][0]), w1 = (K[k + 1][0] - K[k][0]) + 2 * (K[k][0] - K[k - 1][0]); return (w0 + w1) / (w0 / d0 + w1 / d1); };
  const a = K[i - 1], b = K[i], dt = b[0] - a[0], t = (f - a[0]) / dt, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a[j] + (t3 - 2 * t2 + t) * dt * tan(i - 1) + (-2 * t3 + 3 * t2) * b[j] + (t3 - t2) * dt * tan(i); }
// a pop shake on the two hits ("ball" 1182, "be" 1280): ~3 px, flipping sign every frame, decaying over 7 frames
const shake = f => { for (const h of [1182, 1280]) { const t = Math.round(f) - h; if (t >= 0 && t < 7) return 1.4 * (1 - t / 7) * (t % 2 ? -1 : 1); } return 0; };
export function cam(f) {
  const c = [1, 2, 3, 4, 5, 6, 7, 8].map(j => pchip(CK, f, j)), th = orbTh(f), co = Math.cos(th), si = Math.sin(th);
  const rot = (u, v) => [PAINT[0] + (u - PAINT[0]) * co - (v - PAINT[1]) * si, PAINT[1] + (u - PAINT[0]) * si + (v - PAINT[1]) * co];
  [c[0], c[1]] = rot(c[0], c[1]); [c[3], c[4]] = rot(c[3], c[4]);
  const p = P(c[0], c[1], c[2]), l = P(c[3], c[4], c[5]), s = shake(f);
  return [f, p.x, p.y, p.z, l.x, l.y, l.z, c[6], c[7] - .7 * s, s];
}
// the shot's look: Dday light, a clear blue day; daylight grade under the brief's ceilings (brightness ≤ .52, sat ≥ .28, vignette ≤ .18:
// the close-up's big white face reads as centre-bright, so its vignette is lifted until the pull-back)
export const GRADE = { gain: f => .7 + .04 * sst((f - 1190) / 16) + .02 * sst((f - 1254) / 12), sat: 1.45, con: f => 1.25 + .25 * sst((f - 1190) / 16) - .15 * sst((f - 1250) / 16), vig: f => .75 - .95 * (1 - sst((f - 1188) / 12)), warm: 1.8, lift: f => .7 + 1.1 * sst((f - 1250) / 20), toe: f => .3 * (1 - sst((f - 1248) / 14)), st: 2.2, vc: -.05 };
// r19: a warm sun key — the Dday key (255,226,184) up 30 %, the cool sky fill down to 65 % of that: lit sides warm, shade sides cool, more contrast
export const lightMul = () => 1.55, fill = () => .5, skyMul = f => 1 + .22 * sst((f - 1190) / 16);   // the blue sky a touch brighter in the two-shot: the day's highlights (p98)
let FOCUS = 5, BLUR = 4;
export const focus = () => FOCUS, blur = () => BLUR;
export const shadowC = () => P(.3, 9);
// the dissolves this stretch owns: out to P's sea (1290–1297). M's dissolve in (1150–1157) lands on 'N0'.
export const XF = [{ a: 1290, b: 1297, from: 'N0', to: 'P0' }];
const ovW = f => f >= 1289 && f <= 1298 ? 1 - sst((f - 1289) / 9) : f >= 1149 && f <= 1158 ? sst((f - 1149) / 9) : 1;
const OV = makeOverlay(ovW);

// ---------- the set (built on the first stage() call) ----------
let N = null;
function build({ S, card, CARDS }) {
  const PA = card('painterN', drawPainterN, [-280, -790, 390, 14], painterPose), WK = card('workerN', drawPerson, BOXB.person, workerPose);
  // the ball: a red rubber ball with a cream band, ink outline; radius 9 cm
  const bt = tex(128, 64, (c, W, H) => { c.fillStyle = '#d8483c'; c.fillRect(0, 0, W, H); c.fillStyle = OV_CREAM; c.fillRect(0, H * .42, W, H * .16); c.fillStyle = 'rgba(255,240,230,.5)'; c.fillRect(0, H * .18, W, H * .06); });
  const ball = new THREE.Group(); put(ball, new THREE.SphereGeometry(.09, 18, 12), toon({ map: bt }), { outline: 2.2, edges: false }); S.add(ball);
  const ring = buildTargetRing(.5); S.add(ring.group);
  // the quay's clutter: crates and a barrel pair, so the move and the run have something to pass (parallax)
  const set = new THREE.Group(); S.add(set); const wood = tex(128, 128, (c, W, H) => { c.fillStyle = '#a5754c'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(60,35,25,.35)'; for (let y = 0; y < H; y += 32) c.fillRect(0, y, W, 4); c.fillRect(0, 0, 8, H); c.fillRect(W - 8, 0, 8, H); c.fillStyle = 'rgba(60,35,25,.3)'; c.save(); c.translate(W / 2, H / 2); c.rotate(.78); c.fillRect(-W * .7, -5, W * 1.4, 10); c.restore(); });
  const cm = toon({ map: wood }), bm = toon({ color: 0x4f6f8a }), hm = toon({ color: 0x3e3a4a });
  for (const [u, v, h, sz, r] of [[-2.9, 11.5, 0, .9, .2], [-3.6, 12.6, 0, .9, -.1], [-3.2, 12.0, .9, .8, .5], [-4.2, 19, 0, 1.0, .3], [3.6, 21, 0, .9, -.2]]) { const p = P(u, v, h + sz / 2); put(set, new THREE.BoxGeometry(sz, sz, sz), cm, { pos: [p.x, p.y, p.z], rot: [0, r, 0], outline: 1.8 }); }
  for (const [u, v] of [[3.4, 17.2], [3.95, 17.6]]) { const p = P(u, v, .45); put(set, new THREE.CylinderGeometry(.32, .32, .9, 16), bm, { pos: [p.x, p.y, p.z], outline: 1.8, edges: false }); for (const dy of [-.28, .28]) put(set, new THREE.CylinderGeometry(.335, .335, .06, 16), hm, { pos: [p.x, p.y + dy, p.z], outline: 0, edges: false }); }
  // granite setts over this stretch of the quay (laid in courses across it), and a crane rail pair along it: the ground reads, and every camera move shows on it
  const sett = tex(1024, 1024, (c, W, H) => { c.fillStyle = '#665f6a'; c.fillRect(0, 0, W, H); let sd = 5; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let y = 0, row = 0; y < H; y += 42, row++) for (let x = -((row * 29) % 64); x < W; x += 64) { const k = 144 + r() * 32 | 0, w = 64 - 6; c.fillStyle = `rgb(${k},${k - 2},${k + 4})`; c.beginPath(); c.roundRect(x + 3, y + 3, w, 42 - 6, 7); c.fill();
      c.fillStyle = 'rgba(255,240,220,.42)'; c.fillRect(x + 8, y + 5, w - 12, 6); } }, [16, 4]);
  const gm = toon({ map: sett, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), gp = P(-2.5, 20, .004);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 14.8), gm); ground.rotation.x = -Math.PI / 2; ground.position.copy(gp); ground.receiveShadow = true; set.add(ground);
  const steel = toon({ color: 0x8c8a96 });
  for (const u of [-2.2, -3.6]) { const p = P(u, 20, .04); put(set, new THREE.BoxGeometry(.09, .08, 60), steel, { pos: [p.x, p.y, p.z], rot: [0, Math.PI / 2, 0], outline: 1.6 }); }
  CARDS.push({ root: set, blob: { visible: false }, paint() {} });
  const prop = o => ({ root: o, blob: { visible: false }, paint() {} });
  CARDS.push(PA, WK, prop(ball), prop(ring.group));
  return { PA, WK, ball, ring, set };
}
const U = .5 / 190, bobAt = f => f > RUN0 && f < 1290 ? .05 * Math.abs(Math.sin(runPh(f))) * (1 - ease((f - 1282) / 8)) : 0;
const handWorld = (c, h, out = 0) => { c.root.updateMatrixWorld(true); return c.root.localToWorld(new THREE.Vector3(h[0] * U, -h[1] * U, out)); };
// a world point → drawing units on a card's plane, along the camera ray (so a drawn arm points at a 3D target)
function toCard(c, w, cam) { c.root.updateMatrixWorld(true); const m = c.m.matrixWorld, n = new THREE.Vector3(0, 0, 1).transformDirection(m), p = new THREE.Vector3().setFromMatrixPosition(m);
  const d = w.clone().sub(cam.position), t = n.dot(p.sub(cam.position)) / n.dot(d), l = c.root.worldToLocal(cam.position.clone().addScaledVector(d, t)); return [l.x / U, -l.y / U]; }
const px = (v, cam) => { const p = v.clone().project(cam); return [(p.x + 1) / 2 * 720, (1 - p.y) / 2 * 1280]; };

export function stage(f, ctx) {
  if (!N) N = build(ctx);
  const { cam, HB } = ctx, { PA, WK, ball, ring, set } = N; set.visible = true;
  HB.others.forEach((o, i) => o.setDazzle(i % 2 === 0));   // some of the ships at the quay striped (hide() resets them)
  PA.at(P(...PAINT), 1, false, .46);
  const [wu, wv] = workerUV(f), bob = bobAt(f);
  WK.at(P(wu, wv, bob), 1, false, .42); WK.blob.position.y -= bob;
  // the ball: tossed and caught (to 1174), in the throwing hand (to the release on "where"), a lob into his hands on "be", then held
  const handP = g => handWorld(PA, [painterPose('', g).armL.h[0], painterPose('', g).armL.h[1] - 30], .08);
  const catchP = () => { const h = handsW(CATCH), [cu, cv] = workerUV(CATCH); return P(cu, cv, bobAt(CATCH)).add(new THREE.Vector3(h[0] * U, -(h[1] - 24) * U, .1).applyQuaternion(WK.root.quaternion)); };
  let bp;
  if (f < 1175) { const ph = ((f - 1144) % 12 + 12) % 12; bp = handP(f); if (ph < 10) bp.y += .3 * 4 * (ph / 10) * (1 - ph / 10); }
  else if (f < RELEASE) bp = handP(f);
  else if (f < CATCH) { const a = handP(RELEASE), b = catchP(), t = (f - RELEASE) / (CATCH - RELEASE); bp = a.clone().lerp(b, t); bp.y += .95 * 4 * t * (1 - t); }
  else { const h = handsW(f); bp = handWorld(WK, [h[0], h[1] - 24], .1); }
  ball.position.copy(bp); ball.rotation.set(f * .35, f * .2, 0); ball.visible = true;
  // the ring on the quay where he will be on "be": pops on "where", ripples on "he'll" and "be", flashes on "be"
  const rc = P(WE[0], WE[1], .005);
  if (f >= RELEASE - .5) { const k = key([[RELEASE, 1.28], [RELEASE + 1, 1.1], [RELEASE + 2, .96], [RELEASE + 3, 1]], f);
    const rip = [1274, CATCH].map(a => f >= a ? [1 + .55 * ease((f - a) / 8), 1 - ease((f - a) / 8)] : [0, 0]);
    ring.group.position.copy(rc); ring.group.visible = true; ring.set(k, f >= CATCH ? 1 - ease((f - CATCH) / 8) : 0, rip); }
  // focus: on the painter in the close-up, then racked between the two of them (he stays sharp enough; the runner is the action)
  const fw = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion), dz = v => Math.max(.5, v.clone().sub(cam.position).dot(fw));
  const dP = dz(P(PAINT[0], PAINT[1], 1.35)), dW = dz(P(wu, wv, 1.35)), u = sst((f - 1188) / 18) * .8;
  FOCUS = 1 / ((1 - u) / dP + u / dW); BLUR = 3.2 + .6 * (1 - sst((f - 1188) / 20));
  // the overlay for this frame (projected now, drawn after the frame is painted)
  const chest = P(wu, wv, .8), lead = rc.clone(), swing = ease((f - 1256) / 8), aimW = chest.clone().lerp(lead, swing);
  AIM = toCard(PA, aimW, cam);
  const s0 = px(handWorld(PA, painterPose('', Math.min(f, 1264)).armR.h, .05), cam), tip = px(aimW, cam), lineT = sst((f - 1232) / 6);
  const lineA = (f < 1246 ? 1 : f < 1256 ? .55 : 1) * (1 - ease((f - 1281) / 7));
  const xk = f < 1246 ? 0 : f < 1256 ? key([[1246, 1.35], [1247, 1.12], [1248, 1]], f) : 0, xa = f < 1256 ? 1 : 0;
  const hb = px(bp, cam), body = px(P(wu, wv, 1.05), cam), feet = px(P(wu, wv, .05), cam), pm = Math.abs(px(P(wu, wv, 1.05), cam)[1] - px(P(wu, wv, .05), cam)[1]);
  OV.queue(g => {
    if (f >= RUNF && f < RUNF + 10) drawDust(g, feet, pm, (f - RUNF) / 10);   // dust kicked up as he digs in on "running"
    if (f >= 1232 && lineA > 0) drawAimLine(g, s0, tip, { t: lineT, phase: f * 3.2, alpha: lineA, col: f >= 1246 && f < 1256 ? '#cfc6b8' : OV_YELLOW });
    if (xk > 0) { const xs = [lerp(s0[0], tip[0], .86), lerp(s0[1], tip[1], .86)]; drawStrike(g, xs, 54, xk, { alpha: xa }); }
    if (f >= CATCH) drawBurst(g, hb, 26, (f - CATCH) / 6);
  });
}
