// stretch-A.js — the opening (shot 1 + travel T12): a harbour lookout on the bow of a tug in the FOREGROUND of the wide.
// He squints into the fog with a hand over his eyes, scanning; 3 frames before "warships" (f27) the bow breaks out of the fog,
// his eyes pop and he points at it; then the tug falls behind to port and the camera travels on to the painter.
// The warship carries a bow wave (it is still gliding in: heroX). Everything here is staged by shot '1' (index.html).
import * as THREE from 'three';
import { INK, shape, line, qline, disc, drawFace } from './cast.js';
import { hullGeometry, put, toon, tex } from './world.js';

const FACE = '#f4f5f7', OL = 8, LIMB = 10.5, HEAD_LW = 4.4;
const lerp = (a, b, t) => a + (b - a) * t, ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
function keyed(keys, f) { if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) { const [f0, a] = keys[i - 1], [f1, b] = keys[i], t = ease((f - f0) / (f1 - f0)); const mix = (x, y) => Array.isArray(x) ? x.map((v, j) => mix(v, y[j])) : lerp(x, y, t); return mix(a, b); }
  return keys[keys.length - 1][1]; }
// the cast's head construction (cast.js keeps these private): bean head, weighted ink copy offset down-right (P17)
function headPath(ctx, cx, top, w, h) { const rx = w / 2, my = top + h * 0.47, k = 0.56; ctx.moveTo(cx, top);
  ctx.bezierCurveTo(cx + rx * k, top, cx + rx, my - h * 0.47 * k, cx + rx, my); ctx.bezierCurveTo(cx + rx, my + h * 0.53 * k * 1.05, cx + rx * k * 0.95, top + h, cx, top + h);
  ctx.bezierCurveTo(cx - rx * k * 0.95, top + h, cx - rx, my + h * 0.53 * k * 1.05, cx - rx, my); ctx.bezierCurveTo(cx - rx, my - h * 0.47 * k, cx - rx * k, top, cx, top); ctx.closePath(); }
function headInk(ctx, cx, top, w, h) { ctx.save(); ctx.translate(8, 5); shape(ctx, () => headPath(ctx, cx, top, w, h), INK, HEAD_LW); ctx.restore(); }

// ---------- THE LOOKOUT: red watch cap, teal pea coat with brass buttons, white roll-neck, binoculars on a strap ----------
// Same build as the painter: head 190 x 172, 3.5 head-heights, body .75 head widths, stick legs with boots.
const LK = { headTop: -598, headH: 172, bodyTop: -432, hem: -242, sL: [-58, -414], sR: [58, -414] };
export const BOX_LOOKOUT = [-230, -700, 330, 16];
const COAT = '#3d7480', COAT_D = '#2c5560', CAP = '#cf4a3c', CAP_D = '#a93a31', BRASS = '#e2b04a';
export function drawLookout(ctx, p = {}) {
  const f = p.face || {};
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const s of [-1, 1]) { const x = s * 24;   // legs and boots
    line(ctx, [[x, LK.hem + 4], [x + s * 4, -26]], LIMB);
    shape(ctx, () => { const bx = x + s * 12; ctx.moveTo(bx - 26, 0); ctx.lineTo(bx + 26, 0); ctx.quadraticCurveTo(bx + 30, -2, bx + 26, -12); ctx.quadraticCurveTo(bx + 12, -34, bx - 6, -32); ctx.quadraticCurveTo(bx - 28, -30, bx - 28, -10); ctx.quadraticCurveTo(bx - 30, -2, bx - 26, 0); ctx.closePath(); }, '#3b3346', 6); }
  ctx.save(); ctx.translate(0, LK.hem); ctx.rotate(p.lean || 0); ctx.translate(0, -LK.hem);
  // pea coat: a weighted ink copy behind (heavy on the shadow side), then the cloth
  const coat = () => { const t = LK.bodyTop, h = LK.hem; ctx.moveTo(-42, t); ctx.lineTo(42, t); ctx.quadraticCurveTo(64, t + 2, 66, t + 44); ctx.lineTo(74, h);
    ctx.quadraticCurveTo(0, h + 12, -74, h); ctx.lineTo(-66, t + 44); ctx.quadraticCurveTo(-64, t + 2, -42, t); ctx.closePath(); };
  ctx.save(); ctx.translate(7, 4); shape(ctx, coat, INK, 0); ctx.restore();
  shape(ctx, coat, COAT, 0);
  ctx.save(); ctx.beginPath(); coat(); ctx.clip();
  ctx.fillStyle = 'rgba(20,30,70,.24)'; ctx.fillRect(32, LK.bodyTop - 10, 60, 230);                       // shadow side (light from the left)
  line(ctx, [[-50, LK.bodyTop + 50], [-58, LK.hem - 16]], 3.2, 'rgba(200,240,240,.5)');                // highlight
  shape(ctx, () => { ctx.moveTo(-40, LK.bodyTop); ctx.lineTo(-6, LK.bodyTop + 70); ctx.lineTo(-30, LK.bodyTop + 96); ctx.lineTo(-58, LK.bodyTop + 30); ctx.closePath(); }, COAT_D, 3.4);   // lapels
  shape(ctx, () => { ctx.moveTo(40, LK.bodyTop); ctx.lineTo(6, LK.bodyTop + 70); ctx.lineTo(30, LK.bodyTop + 96); ctx.lineTo(58, LK.bodyTop + 30); ctx.closePath(); }, COAT_D, 3.4);
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) disc(ctx, s * 24, LK.bodyTop + 112 + i * 34, 7.5, BRASS, 2.6);
  line(ctx, [[-74, LK.hem - 6], [74, LK.hem - 6]], 3, 'rgba(20,20,40,.35)');
  ctx.restore(); shape(ctx, coat, null, OL);
  // white roll-neck
  shape(ctx, () => { ctx.moveTo(-34, LK.bodyTop - 8); ctx.quadraticCurveTo(0, LK.bodyTop - 18, 34, LK.bodyTop - 8); ctx.lineTo(24, LK.bodyTop + 22); ctx.quadraticCurveTo(0, LK.bodyTop + 30, -24, LK.bodyTop + 22); ctx.closePath(); }, '#f2efe6', 4.5);
  // binoculars on their strap, swinging with the body (by = drop, bx = swing)
  { const bx = p.binoX || 0, by = LK.bodyTop + 76 + (p.binoY || 0);
    qline(ctx, [-20, LK.bodyTop + 6], [-26 + bx * .5, by - 30], [-14 + bx, by - 18], 3.2); qline(ctx, [20, LK.bodyTop + 6], [26 + bx * .5, by - 30], [14 + bx, by - 18], 3.2);
    for (const s of [-1, 1]) { shape(ctx, () => { ctx.roundRect(bx + s * 15 - 13, by - 22, 26, 46, 7); }, '#2d2a36', 3.6); shape(ctx, () => ctx.rect(bx + s * 15 - 13, by + 16, 26, 8), BRASS, 2.4); }
    shape(ctx, () => ctx.rect(bx - 4, by - 10, 8, 18), '#2d2a36', 2.4); }
  // head
  const top = LK.headTop + (p.headY || 0), H = LK.headH, hx = p.headX || 0;
  ctx.save(); ctx.translate(hx, top + H * .65); ctx.rotate(p.headTilt || 0); ctx.translate(-hx, -(top + H * .65));
  headInk(ctx, hx, top, 190, H); shape(ctx, () => headPath(ctx, hx, top, 190, H), FACE, 0);
  ctx.fillStyle = 'rgba(96,90,170,.10)'; ctx.save(); ctx.beginPath(); headPath(ctx, hx, top, 190, H); ctx.clip(); ctx.beginPath(); ctx.ellipse(hx + 70, top + H * .7, 60, 70, 0, 0, 7); ctx.fill(); ctx.restore();
  shape(ctx, () => headPath(ctx, hx, top, 190, H), null, HEAD_LW);
  const fx = hx + (f.fx ?? 13), ey = top + H * .56;
  drawFace(ctx, fx, ey, ey + 38, f);
  // stubble shadow on the jaw: a harbour man
  ctx.save(); ctx.beginPath(); headPath(ctx, hx, top, 190, H); ctx.clip(); ctx.fillStyle = 'rgba(70,60,90,.13)'; ctx.beginPath(); ctx.ellipse(fx, top + H * .95, 70, 34, 0, 0, 7); ctx.fill(); ctx.restore();
  // watch cap: a knitted dome over the head top and a ribbed rolled cuff, kept above the brows
  const ct = top - 40, cuffY = top + 14;
  const dome = () => { ctx.moveTo(hx - 98, cuffY + 8); ctx.bezierCurveTo(hx - 104, ct + 18, hx - 50, ct, hx, ct); ctx.bezierCurveTo(hx + 50, ct, hx + 104, ct + 18, hx + 98, cuffY + 8); ctx.closePath(); };
  shape(ctx, dome, CAP, 0); ctx.save(); ctx.beginPath(); dome(); ctx.clip(); ctx.strokeStyle = 'rgba(90,20,20,.22)'; ctx.lineWidth = 3;
  for (let x = -90; x <= 90; x += 18) { ctx.beginPath(); ctx.moveTo(hx + x * .4, ct + 4); ctx.quadraticCurveTo(hx + x * .9, ct + 30, hx + x, cuffY + 6); ctx.stroke(); }
  line(ctx, [[hx - 66, ct + 32], [hx - 30, ct + 12]], 3.4, 'rgba(255,230,220,.5)'); ctx.restore(); shape(ctx, dome, null, 6.5);
  const cuff = () => { ctx.moveTo(hx - 104, cuffY - 4); ctx.quadraticCurveTo(hx, cuffY - 18, hx + 104, cuffY - 4); ctx.lineTo(hx + 104, cuffY + 30); ctx.quadraticCurveTo(hx, cuffY + 18, hx - 104, cuffY + 30); ctx.closePath(); };
  shape(ctx, cuff, CAP_D, 0); ctx.save(); ctx.beginPath(); cuff(); ctx.clip(); for (let x = -100; x <= 100; x += 13) line(ctx, [[hx + x, cuffY - 20], [hx + x, cuffY + 34]], 2.6, 'rgba(60,10,10,.3)'); ctx.restore(); shape(ctx, cuff, null, 6);
  ctx.restore();
  ctx.restore();
  // arms in front: the visor arm (a flat hand over the brows) and the pointing arm (index finger out)
  if (p.armL) { const a = p.armL; qline(ctx, a.s, a.c, a.h, LIMB);
    if (a.visor) { ctx.save(); ctx.translate(...a.h); ctx.rotate(a.visor); shape(ctx, () => ctx.ellipse(50, 0, 56, 13, 0, 0, 7), INK, 0); ctx.restore(); }
    disc(ctx, ...a.h, 11.5, INK); }
  if (p.armR) { const a = p.armR; qline(ctx, a.s, a.c, a.h, LIMB); disc(ctx, ...a.h, 11.5, INK);
    if (a.finger != null) line(ctx, [a.h, [a.h[0] + Math.cos(a.finger) * 30, a.h[1] + Math.sin(a.finger) * 30]], 8.5); }
  ctx.restore();
}
// his timeline: scan the fog (0–22), a blink over the swap, wide eyes and an open mouth on 24 (3 f before "warships" f27),
// the arm swings out to point at the bow (24–30), held while the tug falls away
export function lookoutPose(who, f) {
  const surprised = f >= 24;
  let eyes = surprised ? 'ring' : 'squint'; { const k = f - 22; if (k >= 0 && k <= 3) eyes = k === 0 || k === 3 ? 'half' : 'line'; }
  // the look switches (never glides): held on fixed positions, swapped on 0, 9, 16 and 22; the head and body still turn smoothly
  const scan = keyed([[0, -.6], [9, .8], [16, -.3], [22, .6]], f), sc = surprised ? .6 : scan, held = f < 9 ? -.6 : f < 16 ? .8 : f < 22 ? -.3 : .6;
  const face = surprised ? { eyes, mouth: 'open', brows: 'raised', open: 1, look: [.75, -.35], fx: 16 }
    : { eyes, mouth: f < 10 ? 'line' : 'bite', brows: 'angry', look: [held, -.2], fx: Math.round(lerp(-6, 15, (held + .5) / 1.2)) };
  const sway = Math.sin(f * .17 - .7);
  const lean = .025 * sway + .045 * sc + keyed([[23, 0], [25, -.07], [30, .05], [36, .03]], f);
  const visor = [[-160, -470], [-104, -542]], down = [[-96, -330], [-84, -262]];
  const holdB = [[110, -330], [30, -356]], point = [[150, -470], [236, -546]];
  const out = [[-190, -440], [-176, -440]], [lc, lh] = keyed([[24, visor], [27, out], [32, down]], f), [rc, rh] = keyed([[24, holdB], [29, point]], f);
  return { face, lean, headX: 9 * sc, headY: keyed([[23, 0], [25, -18], [30, -6], [40, -6]], f) + 3 * sway, headTilt: .06 * sc + keyed([[23, 0], [25, -.1], [30, -.02]], f),
    binoY: keyed([[24, 0], [26, -16], [30, 4], [33, 0]], f), binoX: keyed([[24, 0], [27, 10], [31, -6], [35, 0]], f),
    armL: { s: LK.sL, c: lc, h: lh, visor: f < 24 ? -.1 : f < 26 ? -.9 : null }, armR: { s: LK.sR, c: rc, h: rh, finger: f >= 26 ? -.62 : null } };
}

// ---------- the tug: the boat we ride out on. Local +x = forward (bow), +z = starboard (screen right), deck ~2 m.
export function buildTug() {
  const g = new THREE.Group(); g.name = 'tug';
  const L = 18, B = 5.2, deck = t => 2.0 + .38 * ease((t - .7) / .3), keel = t => -1.4 + .5 * ease((t - .85) / .15);
  const geo = hullGeometry(L, B, deck, keel);
  const hullT = tex(512, 128, (c, W, H) => { c.fillStyle = '#34303f'; c.fillRect(0, 0, W, H); c.fillStyle = '#efe9dc'; c.fillRect(0, H * .1, W, 7); });
  put(g, geo.hull, toon({ map: hullT }), { outline: 2.2, edgeAngle: 50 });
  const dk = tex(512, 512, (c, W, H) => { c.fillStyle = '#56668f'; c.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 64) { c.fillStyle = 'rgba(200,220,255,.08)'; c.fillRect(0, y + 10, W, 40); c.fillStyle = 'rgba(28,30,62,.5)'; c.fillRect(0, y, W, 5); } });   // a painted steel deck, slate blue: the shadows stay cool (P4)
  // the deck as a fine grid with planar UVs (the hull's own deck strip is 2 vertices wide, so lengthwise seams would zigzag)
  const rk = (t, h) => .2 * h * ease((t - .9) / .1) - .14 * h * ease((.07 - t) / .07), dp = [], du = [], di = [], NI = 72, NJ = 12;
  for (let i = 0; i <= NI; i++) for (let j = 0; j <= NJ; j++) { const t = i / NI, z = (j / NJ * 2 - 1) * geo.half(t) * .995, x = (t - .5) * L + rk(t, deck(t) - keel(t)); dp.push(x, deck(t) + .01, z); du.push(x / 4, z / 2.4); }
  for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++) { const a = i * (NJ + 1) + j, b = a + NJ + 1; di.push(a, a + 1, b, a + 1, b + 1, b); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute('uv', new THREE.Float32BufferAttribute(du, 2)); dg.setIndex(di); dg.computeVertexNormals();
  if (dg.attributes.normal.getY(0) < 0) { const ix = dg.index.array; for (let q = 0; q < ix.length; q += 3) { const t = ix[q]; ix[q] = ix[q + 1]; ix[q + 1] = t; } dg.computeVertexNormals(); }
  put(g, dg, toon({ map: dk }), { outline: 0, edges: false });
  const X = t => (t - .5) * L;
  // a coiled line on the port side (it leaves the frame with him)
  put(g, new THREE.TorusGeometry(.42, .09, 8, 20), toon({ color: 0xd8c08a }), { pos: [X(.74), deck(.74) + .1, -1.15], rot: [Math.PI / 2, 0, 0], outline: 1.2, edges: false });
  put(g, new THREE.TorusGeometry(.26, .08, 8, 20), toon({ color: 0xd8c08a }), { pos: [X(.74), deck(.74) + .22, -1.15], rot: [Math.PI / 2, 0, 0], outline: 1.2, edges: false });
  return { group: g, deck, X, L };
}

// ---------- the warship's bow wave: a white moustache of foam and a few drops, sized by its speed
export function buildBowWave(hero) {
  const g = new THREE.Group(), white = toon({ color: 0xf4f2ee }), x = hero.X(1) - .6;
  const foam = put(g, new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), white, { pos: [x, -.1, 0], outline: 1.4, edges: false });
  const drops = Array.from({ length: 7 }, (_, i) => put(g, new THREE.SphereGeometry(.35, 8, 6), white, { pos: [x, 0, 0], outline: 1.2, edges: false }));
  hero.group.add(g);
  return { group: g, set(f, speed) {   // speed 0..1
    const k = Math.max(0, speed), w = 1 + .08 * Math.sin(f * 1.3);
    foam.scale.set(3.2 * k * w + .01, 2.4 * k * (1 + .15 * Math.sin(f * 1.7)) + .01, hero.B * .62);
    drops.forEach((d, i) => { const ph = ((f * .11 + i / drops.length) % 1), side = i % 2 ? 1 : -1;
      d.visible = k > .05; d.position.set(x + 1.2 - 2.2 * ph, .4 + (6 * ph - 7 * ph * ph) * 2.2 * k, side * (hero.B * .45 + 2.4 * ph * k)); d.scale.setScalar((1 - ph) * k + .01); }); } };
}

// ---------- a gull: white body, grey wings with dark tips, yellow beak; flaps (flap = wing angle, rad)
export const BOX_GULL = [-150, -170, 150, 40];
export function drawGull(ctx, p = {}) {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.translate(0, -60);
  const a = p.flap || 0, wing = s => () => { const tx = s * 120 * Math.cos(a), ty = -120 * Math.sin(a); ctx.moveTo(s * 10, -6); ctx.quadraticCurveTo(s * 60, -10 - 60 * Math.sin(a), s * 70 + tx * .2, ty * .55 - 4); ctx.lineTo(tx, ty); ctx.quadraticCurveTo(s * 60, 14 + ty * .3, s * 8, 12); ctx.closePath(); };
  for (const s of [-1, 1]) { shape(ctx, wing(s), '#c9cdd8', 0); ctx.save(); ctx.beginPath(); wing(s)(); ctx.clip(); ctx.fillStyle = '#2d2a36'; ctx.beginPath(); ctx.arc(s * 120 * Math.cos(a), -120 * Math.sin(a), 34, 0, 7); ctx.fill(); ctx.restore(); shape(ctx, wing(s), null, 6); }
  shape(ctx, () => ctx.ellipse(0, 4, 40, 22, 0, 0, 7), '#f4f2ee', 6);
  disc(ctx, -30, -10, 17, '#f4f2ee', 6); disc(ctx, -34, -13, 3.5, INK);
  shape(ctx, () => { ctx.moveTo(-44, -10); ctx.lineTo(-64, -6); ctx.lineTo(-44, -2); ctx.closePath(); }, '#e8b84a', 3.5);
  ctx.restore();
}
export const gullPose = (who, f) => ({ flap: .55 * Math.sin(f * .75 + (who === 'gull2' ? 2 : 0)) + .15 });
