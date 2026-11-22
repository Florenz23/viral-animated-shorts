// stretch-B.js — the open sea, frames 114–206 (shots 3, W3, 3i): the people in it.
// Shot 3: three sailors row a lifeboat away from the tipping cargo ship (the periscope glides along beside them);
// on "sinking" (134) they throw their arms up, three more jump off the cargo's rail; on "faster" (154) they row twice as fast.
// Shot 3i: a dock worker on the quay waves the new ship down, cheers as it lands, then sees the two sinking behind it.
// Drawings follow cast.js (head 190 x 172, weighted head ink, OL 8, LIMB 10.5, face from drawFace); units as there.
import * as THREE from 'three';
import { INK, shape, line, qline, disc, drawFace } from './cast.js';
import { toon, put, tex, hullGeometry, LINE } from './world.js';

const FACE = '#f4f5f7', OL = 8, LIMB = 10.5, HEAD_LW = 4.4;
const lerp = (a, b, t) => a + (b - a) * t, ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
function headPath(ctx, cx, top, w, h) {
  const rx = w / 2, my = top + h * 0.47, k = 0.56;
  ctx.moveTo(cx, top);
  ctx.bezierCurveTo(cx + rx * k, top, cx + rx, my - h * 0.47 * k, cx + rx, my);
  ctx.bezierCurveTo(cx + rx, my + h * 0.53 * k * 1.05, cx + rx * k * 0.95, top + h, cx, top + h);
  ctx.bezierCurveTo(cx - rx * k * 0.95, top + h, cx - rx, my + h * 0.53 * k * 1.05, cx - rx, my);
  ctx.bezierCurveTo(cx - rx, my - h * 0.47 * k, cx - rx * k, top, cx, top);
  ctx.closePath();
}
function headInk(ctx, cx, top, w, h) { ctx.save(); ctx.translate(8, 5); shape(ctx, () => headPath(ctx, cx, top, w, h), INK, HEAD_LW); ctx.restore(); }
function rrect(ctx, x, y, w, h, r) { ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }

// ---------- the people: same frame as the painter (head top -598, body -432..-242, shoulders ±56,-414) ----------
const P = { headTop: -598, headH: 172, bodyTop: -432, hem: -242 };
export const BOXB = { person: [-250, -860, 250, 14] };
// kind: 'capt' (white-top cap, grey beard, navy coat), 'sou' (yellow oilskin and sou'wester), 'cap' (red knit cap, striped jersey),
// 'worker' (flat cap, waistcoat, rolled sleeves, moustache). Lifeboat people wear the orange cork life vest.
const CLOTH = { capt: '#3f5596', sou: '#f2c33a', cap: '#f1ece0', worker: '#f1ece0' };
export function drawPerson(ctx, p = {}) {
  const k = p.kind || 'cap', f = p.face || {};
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // legs and boots (hidden under the gunwale in the boat)
  for (const s of [-1, 1]) { const x = s * 24, kick = (p.kick || 0) * s;
    line(ctx, [[x, P.hem + 4], [x + s * 6 + kick * 40, -26 + Math.abs(kick) * 20]], LIMB);
    ctx.save(); ctx.translate(kick * 40 + s * 2, Math.abs(kick) * 20);
    shape(ctx, () => { const bx = x + s * 12; ctx.moveTo(bx - 26, 0); ctx.lineTo(bx + 26, 0); ctx.quadraticCurveTo(bx + 30, -2, bx + 26, -12); ctx.quadraticCurveTo(bx + 12, -34, bx - 6, -32); ctx.quadraticCurveTo(bx - 28, -30, bx - 28, -10); ctx.quadraticCurveTo(bx - 30, -2, bx - 26, 0); ctx.closePath(); }, k === 'worker' ? '#6b4a34' : '#2f2b3a', 6);
    ctx.restore(); }
  ctx.save(); ctx.translate(0, P.hem); ctx.rotate(p.lean || 0); ctx.translate(0, -P.hem);
  // the arms behind the body first (a back arm), then the body
  for (const a of [p.armL, p.armR]) if (a && a.back) arm(ctx, a, k);
  const body = () => { const t = P.bodyTop, h = P.hem; ctx.moveTo(-40, t); ctx.lineTo(40, t); ctx.quadraticCurveTo(62, t + 2, 64, t + 40); ctx.lineTo(70, h - 4);
    ctx.quadraticCurveTo(0, h + 12, -70, h - 4); ctx.lineTo(-64, t + 40); ctx.quadraticCurveTo(-62, t + 2, -40, t); ctx.closePath(); };
  ctx.save(); ctx.translate(7, 4); shape(ctx, body, INK, 0); ctx.restore();   // weighted outline (heavy on the shadow side)
  shape(ctx, body, CLOTH[k], 0);
  ctx.save(); ctx.beginPath(); body(); ctx.clip();
  if (k === 'cap') { ctx.fillStyle = '#34478a'; for (let y = P.bodyTop + 22; y < P.hem + 10; y += 34) ctx.fillRect(-90, y, 180, 15); }   // the striped jersey
  if (k === 'sou') { line(ctx, [[0, P.bodyTop], [0, P.hem + 10]], 4, 'rgba(120,80,20,.5)'); for (let i = 0; i < 3; i++) disc(ctx, 8, P.bodyTop + 50 + i * 50, 6, '#2f2b3a'); }
  if (k === 'capt') { for (let i = 0; i < 3; i++) for (const s of [-1, 1]) disc(ctx, s * 26, P.bodyTop + 60 + i * 50, 7, '#e8b84a', 2.4); }
  if (k === 'worker') { shape(ctx, () => { ctx.moveTo(-66, P.bodyTop + 6); ctx.lineTo(-18, P.bodyTop + 6); ctx.lineTo(-6, P.hem + 8); ctx.lineTo(-80, P.hem + 8); ctx.closePath(); }, '#7a5038', 4);   // waistcoat
    shape(ctx, () => { ctx.moveTo(66, P.bodyTop + 6); ctx.lineTo(18, P.bodyTop + 6); ctx.lineTo(6, P.hem + 8); ctx.lineTo(80, P.hem + 8); ctx.closePath(); }, '#7a5038', 4);
    for (let i = 0; i < 3; i++) disc(ctx, -14, P.bodyTop + 70 + i * 44, 5, '#e8b84a', 2); line(ctx, [[-90, P.hem - 6], [90, P.hem - 6]], 10, '#4a3a30'); }
  ctx.fillStyle = 'rgba(96,90,170,.18)'; ctx.fillRect(30, P.bodyTop - 10, 60, 240);   // shadow side (light from the left)
  ctx.restore(); shape(ctx, body, null, OL);
  if (p.vest) {   // the cork life vest: two orange columns of blocks over the chest, a strap
    for (const s of [-1, 1]) shape(ctx, () => rrect(ctx, s < 0 ? -62 : 8, P.bodyTop + 10, 54, 118, 14), '#ee7a2f', 5);
    for (const s of [-1, 1]) for (let i = 1; i < 3; i++) line(ctx, [[s < 0 ? -58 : 12, P.bodyTop + 10 + i * 39], [s < 0 ? -12 : 58, P.bodyTop + 10 + i * 39]], 3.6);
    line(ctx, [[-50, P.bodyTop + 22], [-40, P.bodyTop + 52]], 3, 'rgba(255,230,190,.8)');
  }
  if (k === 'worker') shape(ctx, () => { ctx.moveTo(-30, P.bodyTop - 4); ctx.lineTo(30, P.bodyTop - 4); ctx.lineTo(4, P.bodyTop + 34); ctx.lineTo(-4, P.bodyTop + 34); ctx.closePath(); }, '#3d63c9', 4.5);   // blue neckerchief
  // head
  const top = P.headTop + (p.headY || 0), H = P.headH, hx = p.headX || 0;
  ctx.save(); ctx.translate(hx, top + H * .65); ctx.rotate(p.headTilt || 0); ctx.translate(-hx, -(top + H * .65));
  headInk(ctx, hx, top, 190, H); shape(ctx, () => headPath(ctx, hx, top, 190, H), FACE, 0);
  ctx.fillStyle = 'rgba(96,90,170,.10)'; ctx.save(); ctx.beginPath(); headPath(ctx, hx, top, 190, H); ctx.clip(); ctx.beginPath(); ctx.ellipse(hx + 70, top + H * .7, 60, 70, 0, 0, 7); ctx.fill(); ctx.restore();
  shape(ctx, () => headPath(ctx, hx, top, 190, H), null, HEAD_LW);
  const fx = hx + (f.fx ?? 0), ey = top + H * .55;
  if (k === 'capt') {   // a full grey beard round the jaw, the mouth inside it
    shape(ctx, () => { ctx.moveTo(fx - 84, ey + 4); ctx.quadraticCurveTo(fx - 80, ey + 96, fx, ey + 104); ctx.quadraticCurveTo(fx + 80, ey + 96, fx + 84, ey + 4); ctx.quadraticCurveTo(fx + 56, ey + 30, fx + 40, ey + 22); ctx.quadraticCurveTo(fx, ey + 14, fx - 40, ey + 22); ctx.quadraticCurveTo(fx - 56, ey + 30, fx - 84, ey + 4); ctx.closePath(); }, '#c9c6cf', 4.5);
    shape(ctx, () => ctx.ellipse(fx, ey + 46, 30, 18, 0, 0, 7), FACE, 0); }
  drawFace(ctx, fx, ey, ey + 40, f);
  if (k === 'worker') { const my = ey + 22; shape(ctx, () => { ctx.moveTo(fx, my - 4); ctx.quadraticCurveTo(fx + 30, my - 14, fx + 48, my + 6); ctx.quadraticCurveTo(fx + 24, my + 2, fx, my + 6); ctx.quadraticCurveTo(fx - 24, my + 2, fx - 48, my + 6); ctx.quadraticCurveTo(fx - 30, my - 14, fx, my - 4); ctx.closePath(); }, '#5a3a2a', 3.4); }
  // hats
  if (k === 'cap') {   // red knit watch cap, folded band, bobble
    const dome = () => { ctx.moveTo(hx - 92, top + 40); ctx.bezierCurveTo(hx - 96, top - 70, hx + 96, top - 70, hx + 92, top + 40); ctx.closePath(); };
    shape(ctx, dome, '#d24a3c', 6.5); ctx.save(); ctx.beginPath(); dome(); ctx.clip(); for (let x = -90; x <= 90; x += 18) line(ctx, [[hx + x, top + 40], [hx + x * .8, top - 40]], 2.4, 'rgba(90,20,20,.35)'); ctx.restore();
    shape(ctx, () => rrect(ctx, hx - 100, top + 18, 200, 40, 16), '#b83a32', 6); disc(ctx, hx, top - 58, 22, '#f1ece0', 5); }
  if (k === 'sou') {   // yellow sou'wester: a round crown, a wide brim that slopes down at the back
    shape(ctx, () => { ctx.moveTo(hx - 150, top + 70); ctx.quadraticCurveTo(hx, top + 10, hx + 150, top + 70); ctx.quadraticCurveTo(hx + 120, top + 40, hx, top + 34); ctx.quadraticCurveTo(hx - 120, top + 40, hx - 150, top + 70); ctx.closePath(); }, '#e2b02e', 6);
    shape(ctx, () => { ctx.moveTo(hx - 86, top + 42); ctx.bezierCurveTo(hx - 92, top - 56, hx + 92, top - 56, hx + 86, top + 42); ctx.closePath(); }, '#f2c33a', 6.5);
    line(ctx, [[hx - 50, top - 10], [hx - 20, top - 26]], 4, 'rgba(255,250,220,.8)'); }
  if (k === 'capt') {   // white-top peaked cap, black band and peak, gold badge
    shape(ctx, () => rrect(ctx, hx - 92, top + 2, 184, 44, 10), '#24202c', 6);
    shape(ctx, () => { ctx.moveTo(hx - 104, top + 8); ctx.quadraticCurveTo(hx - 110, top - 44, hx, top - 50); ctx.quadraticCurveTo(hx + 110, top - 44, hx + 104, top + 8); ctx.closePath(); }, '#f4f1e8', 6.5);
    shape(ctx, () => { ctx.moveTo(hx - 70, top + 44); ctx.quadraticCurveTo(hx + 10, top + 76, hx + 96, top + 44); ctx.closePath(); }, '#24202c', 5);
    disc(ctx, hx + 6, top + 22, 12, '#e8b84a', 3); }
  if (k === 'worker') {   // grey tweed flat cap, peak forward
    const crown = () => { ctx.moveTo(hx - 100, top + 56); ctx.bezierCurveTo(hx - 108, top - 18, hx + 40, top - 40, hx + 100, top + 40); ctx.quadraticCurveTo(hx, top + 34, hx - 100, top + 56); ctx.closePath(); };
    shape(ctx, crown, '#7d7a84', 6.5); shape(ctx, () => { ctx.moveTo(hx + 30, top + 44); ctx.quadraticCurveTo(hx + 110, top + 30, hx + 140, top + 54); ctx.quadraticCurveTo(hx + 100, top + 68, hx + 30, top + 58); ctx.closePath(); }, '#5e5b66', 6); }
  ctx.restore();
  ctx.restore();
  for (const a of [p.armL, p.armR]) if (a && !a.back) arm(ctx, a, k);
  ctx.restore();
}
function arm(ctx, a, k) {
  if (a.oar) { line(ctx, [a.oar[0], a.oar[1]], 13, INK); line(ctx, [a.oar[0], a.oar[1]], 6.5, '#c98b4e'); }   // the oar shaft runs on under the gunwale
  const sl = k === 'capt' ? '#3f5596' : k === 'sou' ? '#f2c33a' : null;   // coat sleeves: a fat coloured limb inside the ink line
  qline(ctx, a.s, a.c, a.h, LIMB); if (sl) qline(ctx, a.s, a.c, [lerp(a.c[0], a.h[0], .55), lerp(a.c[1], a.h[1], .55)], 5, sl);
  disc(ctx, a.h[0], a.h[1], 11.5, INK);
  if (a.finger != null) line(ctx, [a.h, [a.h[0] + Math.cos(a.finger) * 28, a.h[1] + Math.sin(a.finger) * 28]], 8.5);
  if (a.thumb) line(ctx, [a.h, [a.h[0] + 4, a.h[1] - 28]], 8.5);
}

// ---------- poses ----------
const S_L = [-56, -414], S_R = [56, -414];
const step = (tab, f) => { let v = null; for (const k of Object.keys(tab).map(Number).sort((a, b) => a - b)) if (k <= f) v = tab[k]; return v; };
function keyed(keys, f) { if (f <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) { const [f0, a] = keys[i - 1], [f1, b] = keys[i], t = ease((f - f0) / (f1 - f0)); const mix = (x, y) => Array.isArray(x) ? x.map((v, j) => mix(v, y[j])) : lerp(x, y, t); return mix(a, b); } return keys[keys.length - 1][1]; }
const blink = (f, starts, eyes) => { for (const a of starts) { const k = f - a; if (k >= 0 && k <= 3) return k === 0 || k === 3 ? 'half' : 'line'; } return eyes; };
const face = (s, look, fx, f, bl) => { let [eyes, mouth, brows, open] = s.split('/'); eyes = blink(f, bl, eyes); return { eyes, mouth, brows, open: +open || 0, look, fx }; };
// rowing: both hands on one oar, circling at chest height; ph = phase (rad); side = which gunwale the oar goes over
function row(ph, side) { const cx = side * 34, hx = cx + side * 44 * Math.cos(ph), hy = -330 + 34 * Math.sin(ph);
  const oar = [[hx - side * 70, hy - 40], [hx + side * 170, hy + 230]];
  return { armL: { s: S_L, c: [lerp(S_L[0], hx, .5) - 30, -330], h: [hx - 16, hy] }, armR: { s: S_R, c: [lerp(S_R[0], hx, .5) + 30, -330], h: [hx + 16, hy + 6], oar } }; }
const UP = { armL: { s: S_L, c: [-140, -540], h: [-118, -690] }, armR: { s: S_R, c: [140, -540], h: [118, -690] } };   // both arms up, clear of the head
const wave = (f, amp, rate, ph = 0) => { const k = Math.sin(f * rate + ph); return { armL: { s: S_L, c: [-150 - 20 * k, -540], h: [-130 - amp * k, -690] }, armR: { s: S_R, c: [150 - 20 * k, -540], h: [130 - amp * k, -690] } }; };
// rowing rate: steady, then twice as fast from "faster" (154): the phase is the integral of the rate, so it never jumps
const rowPh = f => .42 * (f - 100) + .48 * (f < 150 ? 0 : f < 158 ? (f - 150) ** 2 / 16 : 4 + (f - 158));
// the reaction lands 2 frames before "sinking" (134): arms up and the faces switch on 132
export function lifeboatPose(who, f) {
  if (who === 'capt') {   // the captain: stands mid-boat looking back at his ship, arms up on 132, points at the periscope on 144, then bellows "ROW!"
    const fc = step({ 0: 'half/line/flat', 132: 'ring/open/raised/.9', 144: 'ring/open/angry/.6', 153: 'half/open/angry/1', 165: 'ring/dot/worried/.4' }, f);   // "than" (165): a worried glance back at the sinking ship
    const W = ease((f - 165) / 7);
    const look = f < 144 ? [-.6, -.4] : f < 153 ? [-.9, .2] : f < 165 ? [.6, 0] : [-.9, -.5];
    let arms = f < 128 ? { armL: { s: S_L, c: [-96, -340], h: [-86, -270] }, armR: { s: S_R, c: [96, -340], h: [86, -270] } } : UP;
    const t = ease((f - 128) / 6); if (f >= 128 && f < 140) arms = { armL: { s: S_L, c: [lerp(-96, -140, t), lerp(-340, -540, t)], h: [lerp(-86, -118, t), lerp(-270, -690, t)] }, armR: { s: S_R, c: [lerp(96, 140, t), lerp(-340, -540, t)], h: [lerp(86, 118, t), lerp(-270, -690, t)] } };
    if (f >= 140 && f < 153) { const u = ease((f - 140) / 5); arms = { armL: { s: S_L, c: [lerp(-140, -200, u), lerp(-540, -440, u)], h: [lerp(-118, -280, u), lerp(-690, -470, u)], finger: Math.PI + .15 }, armR: { s: S_R, c: [lerp(140, 96, u), lerp(-540, -340, u)], h: [lerp(118, 86, u), lerp(-690, -270, u)] } }; }
    if (f >= 153) { const k = Math.sin((Math.min(f, 165) - 153) * .55) * (1 - W); arms = { armL: { s: S_L, c: [-96, -340], h: [-86, -270] }, armR: { s: S_R, c: [lerp(150, 96, W), lerp(-520, -340, W) + 40 * k], h: [lerp(140, 86, W) + 20 * k, lerp(-660, -270, W) + 70 * k] } }; }   // the fist drops as he looks back   // one fist pumping
    return { kind: 'capt', vest: true, face: face(fc, look, look[0] * 14, f, [121, 162]), ...arms, lean: keyed([[128, 0], [134, -.06], [144, .02], [153, .05], [165, .05], [172, -.05]], f), headY: keyed([[130, 0], [133, -16], [138, -8]], f), headTilt: -.09 * W };
  }
  const bow = who === 'sou', side = bow ? 1 : -1;
  const fc = step({ 0: 'squint/bite/angry', 132: 'ring/open/raised/.7', 144: 'ring/open/raised/1', 152: 'squint/bite/angry/.2', 165: 'ring/dot/worried/.4' }, f), W = ease((f - 165) / 7);
  const look = f < 132 ? [side * .3, 0] : f < 144 ? [-.5, -.5] : f < 152 ? [-.9, .1] : f < 165 ? [0, 0] : [-.9, -.5];
  const ph = rowPh(f) + (bow ? 0 : 1.1);
  let pose = row(ph, side);
  if (f >= 131 && f < 146) { const t = ease((f - 131) / 5) * (1 - ease((f - 141) / 5)); const r = pose; pose = { armL: { s: S_L, c: [lerp(r.armL.c[0], -140, t), lerp(r.armL.c[1], -540, t)], h: [lerp(r.armL.h[0], -118, t), lerp(r.armL.h[1], -690, t)] }, armR: { s: S_R, c: [lerp(r.armR.c[0], 140, t), lerp(r.armR.c[1], -540, t)], h: [lerp(r.armR.h[0], 118, t), lerp(r.armR.h[1], -690, t)], oar: t > .5 ? null : r.armR.oar } }; }
  return { kind: who, vest: true, face: face(fc, look, look[0] * 14 + side * 4, f, bow ? [117, 147, 166] : [124, 160]), ...pose, lean: (f >= 152 ? .07 : .03) * Math.sin(ph) + (f >= 131 && f < 144 ? -.05 : 0) - .06 * W, headY: f >= 131 && f < 140 ? -12 : 4 * Math.sin(ph), headTilt: -.09 * W };
}
// the jumpers off the cargo's rail: arms up, legs kicking
export function jumperPose(who, f) {
  const i = +who.slice(-1), k = Math.sin(f * .9 + i * 2);
  return { kind: ['cap', 'sou', 'cap'][i], vest: i !== 1, face: { eyes: 'ring', mouth: 'open', brows: 'raised', open: .9, look: [0, -.3] }, kick: .35 * k,
    ...wave(f, 26, .9, i * 1.7) };
}
// the dock worker (3i): waves the new ship down (palms down, "lower, lower"), cheers as it lands (197), then the double take at the sinkers (203)
export function workerPose(who, f) {
  const fc = step({ 0: 'half/open/raised/.5', 197: 'squint/grin/laugh/.6', 203: 'ring/line/raised' }, f);
  const look = f < 203 ? [-.8, -.2] : [.8, -.1];
  let arms;
  if (f < 197) { const k = Math.sin((f - 178) * .75); arms = { armL: { s: S_L, c: [-150, -480 + 30 * k], h: [-210, -560 + 70 * k] }, armR: { s: S_R, c: [150, -480 + 30 * k], h: [210, -560 + 70 * k] } }; }   // flapping down
  else if (f >= 201) { const k = Math.sin((f - 201) * .8); arms = { armL: { s: S_L, c: [-140 - 30 * k, -540], h: [-118 - 60 * k, -700], thumb: true }, armR: { s: S_R, c: [140 - 30 * k, -540], h: [118 - 60 * k, -700], thumb: true } }; }   // cheering, arms swaying
  else { const t = ease((f - 197) / 4); arms = { armL: { s: S_L, c: [lerp(-150, -140, t), lerp(-480, -540, t)], h: [lerp(-210, -118, t), lerp(-560, -700, t)], thumb: t > .7 }, armR: { s: S_R, c: [lerp(150, 140, t), lerp(-480, -540, t)], h: [lerp(210, 118, t), lerp(-560, -700, t)], thumb: t > .7 } }; }
  return { kind: 'worker', face: face(fc, look, look[0] * 14, f, [186, 201]), ...arms, lean: f < 197 ? .03 * Math.sin((f - 178) * .75) : keyed([[197, 0], [200, -.05], [206, -.03]], f), headY: f >= 197 && f < 203 ? keyed([[197, 0], [199, -14], [203, -8]], f) : 0, headTilt: f >= 203 ? .06 : 0 };
}

// ---------- the lifeboat: a white double-ender with a red sheer stripe, oak inside; length 4.4 m along local x ----------
export function buildLifeboat() {
  const g = new THREE.Group(), L = 4.4, B = 1.7;
  const deck = t => .62 + .3 * Math.pow(Math.abs(t - .5) * 2, 2.2), keel = t => -.42 + .2 * Math.pow(Math.abs(t - .5) * 2, 3);
  const geo = hullGeometry(L, B, deck, keel);
  const ht = tex(64, 512, (c, W, H) => { c.fillStyle = '#efe9dc'; c.fillRect(0, 0, W, H); c.fillStyle = '#c4433a'; c.fillRect(0, H * (1 - .352), W, H * .022); c.fillStyle = '#3d63c9'; c.fillRect(0, H * (1 - .232), W, H * .25); });
  put(g, geo.hull, toon({ map: ht }), { outline: 2, edgeAngle: 60 });
  put(g, geo.deck, toon({ color: 0x9a7254 }), { outline: 0, edges: false });
  // ink along the waterline: the hull's own ink hull is hidden under the sea, so its bottom edge gets a thin ink band (C9)
  { const pos = [], idx = [], n = 64, y0 = -.05, y1 = .035;
    for (const sd of [-1, 1]) for (let i = 0; i <= n; i++) { const t = i / n, x = (t - .5) * L * 1.004, z = sd * (geo.half(t) + .02); pos.push(x, y0, z, x, y1, z); }
    for (let k = 0; k < 2; k++) for (let i = 0; i < n; i++) { const a = (k * (n + 1) + i) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setIndex(idx);
    g.add(new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: INK, side: THREE.DoubleSide, fog: false }))); }
  // foam at the bow and a short wake astern (the boat runs toward +x)
  const foam = toon({ color: 0xeef3f6 }), puffs = [];
  for (let i = 0; i < 9; i++) { const a = i / 8, m = put(g, new THREE.SphereGeometry(.16 + .1 * (i % 3), 8, 6), foam, { pos: [L / 2 - .2 - a * 1.2, .05, (i % 2 ? 1 : -1) * (B / 2 * (1 - a * .2) + .08)], outline: 3, edges: false }); m.userData.p = m.position.clone(); puffs.push(m); }
  const wt = tex(512, 128, (c, W, H) => { c.clearRect(0, 0, W, H); let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 160; i++) { const a = r(), x = W * (1 - a), sp = a * H * .42, sd = r() < .5 ? -1 : 1, y = H / 2 + sd * sp * (.8 + r() * .3); c.fillStyle = `rgba(240,246,248,${.95 - a * .6})`; c.beginPath(); c.arc(x, y, (1 - a) * 9 + 3 + r() * 3, 0, 7); c.fill(); } });
  wt.wrapS = wt.wrapT = THREE.ClampToEdgeWrapping;
  const wake = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.6), toon({ map: wt, transparent: true, alphaTest: .35, depthWrite: false })); wake.rotation.x = -Math.PI / 2; wake.position.set(-L / 2 - 4.1, .06, 0); wake.receiveShadow = true; g.add(wake);
  return { group: g, L, B, deck, wake, puffs,
    update(f, rate = 1) { for (const [i, m] of puffs.entries()) { const k = .5 + .5 * Math.sin(f * .6 * rate + i * 1.9); m.position.y = m.userData.p.y + .12 * k; m.scale.setScalar(.75 + .5 * k); } } };
}
// the sea's height at S-local (x, z) on frame f: the same swell as makeWater('#55707f', 2.2), so the lifeboat floats on it
export const seaH = (x, z, f, swell = 2.2) => swell * (.09 * Math.sin(x * .09 + f * .07) + .07 * Math.sin(z * .13 - f * .05 + x * .03));
// the quay the dock worker stands on (3i): a stone block, a bollard with a rope
export function buildQuay() {
  const g = new THREE.Group(), stone = toon({ color: 0x8a8a94 });
  const st = tex(256, 128, (c, W, H) => { c.fillStyle = '#6f6a74'; c.fillRect(0, 0, W, H); for (let y = 0, r = 0; y < H; y += 32, r++) for (let x = (r % 2) * 32 - 32; x < W; x += 64) { const k = 146 + (x * 7 + y * 3) % 14; c.fillStyle = `rgb(${k},${k - 4},${k + 2})`; c.fillRect(x + 3, y + 3, 58, 26); } }, [2, 1]);
  put(g, new THREE.BoxGeometry(9, 3, 7), toon({ map: st }), { pos: [0, -.5, 0], outline: 2 });
  put(g, new THREE.BoxGeometry(9.2, .25, 7.2), stone, { pos: [0, 1.1, 0], outline: 1.6 });
  const iron = toon({ color: 0x3e3a4a });
  put(g, new THREE.CylinderGeometry(.22, .26, .55, 14), iron, { pos: [3.2, 1.5, 2.4], outline: 1.6, edges: false });
  put(g, new THREE.CylinderGeometry(.32, .32, .1, 14), iron, { pos: [3.2, 1.8, 2.4], outline: 1.4, edges: false });
  return { group: g, top: 1.225 };
}
