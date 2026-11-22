// cast.js — our cast as flat 2D drawings (canvas 2D only), shown on camera-facing cards in the lit world.
// Units: 1 unit = 1 px when the head is 190 wide. Origin = middle of the feet on the ground, y down.
// The painter: 3.5 head-heights tall (head 172 tall, feet to cap top ~ 640), paint-stained smock, flat cap, a big brush.
// Drawing helpers follow our earlier study builds (shape/line/qline/disc, weighted head ink, eye kinds).

export const INK = '#1c1118';     // luma .078: ink stays under .09
const FACE = '#f4f5f7';          // face fill (244,245,247), slightly cool; cards are kept out of the grade
const OL = 8;          // body outline at head 190
const LIMB = 10.5;     // limb line width

const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);

export function shape(ctx, build, fill, lw = 5, stroke = INK) {   // fill, then rebuild the path and stroke it
  if (fill) { ctx.beginPath(); build(); ctx.fillStyle = fill; ctx.fill(); }
  if (lw > 0) { ctx.beginPath(); build(); ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
}
export function line(ctx, pts, lw, col = INK) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
export function qline(ctx, a, c, b, lw, col = INK) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(c[0], c[1], b[0], b[1]); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke(); }
export function disc(ctx, x, y, r, fill, lw = 0, stroke = INK) { shape(ctx, () => ctx.arc(x, y, r, 0, Math.PI * 2), fill, lw, stroke); }
function headPath(ctx, cx, top, w, h) {
  const rx = w / 2, my = top + h * 0.47, k = 0.56;
  ctx.moveTo(cx, top);
  ctx.bezierCurveTo(cx + rx * k, top, cx + rx, my - h * 0.47 * k, cx + rx, my);
  ctx.bezierCurveTo(cx + rx, my + h * 0.53 * k * 1.05, cx + rx * k * 0.95, top + h, cx, top + h);
  ctx.bezierCurveTo(cx - rx * k * 0.95, top + h, cx - rx, my + h * 0.53 * k * 1.05, cx - rx, my);
  ctx.bezierCurveTo(cx - rx, my - h * 0.47 * k, cx - rx * k, top, cx, top);
  ctx.closePath();
}
// weighted head outline: an ink copy shifted (+5,+3) behind the face gives thin lit upper-left, thick lower-right
const HEAD_LW = 4.4;   // P17 at head 190: lit side 4.4, shadow side 12.4 (2.8x)
function headInk(ctx, cx, top, w, h) { ctx.save(); ctx.translate(8, 5); shape(ctx, () => headPath(ctx, cx, top, w, h), INK, HEAD_LW); ctx.restore(); }
function rrect(ctx, x, y, w, h, rTop, rBot) {
  ctx.moveTo(x + rTop, y); ctx.lineTo(x + w - rTop, y); ctx.quadraticCurveTo(x + w, y, x + w, y + rTop);
  ctx.lineTo(x + w, y + h - rBot); ctx.quadraticCurveTo(x + w, y + h, x + w - rBot, y + h);
  ctx.lineTo(x + rBot, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - rBot);
  ctx.lineTo(x, y + rTop); ctx.quadraticCurveTo(x, y, x + rTop, y); ctx.closePath();
}

// ---------- faces: f = { eyes: ring|half|line|squint|shut, look:[dx,dy], brows, mouth, open, blush } ----------
export function drawFace(ctx, cx, ey, my, f) {
  const sep = 24.7, look = f.look || [0, 0], L = cx - sep, R = cx + sep;   // eyes .26 head-widths apart
  if (false && f.blush) for (const x of [L - 16, R + 16]) { ctx.fillStyle = 'rgba(240,120,130,0.45)'; ctx.beginPath(); ctx.ellipse(x, ey + 17, 13, 7, 0, 0, 7); ctx.fill(); }
  for (const x of [L, R]) {
    const px = x + look[0] * 5;
    switch (f.eyes) {
      case 'ring': disc(ctx, x, ey, 16.5, '#fbfaf3', 5); disc(ctx, x + look[0] * 6, ey + look[1] * 5, 3.6, INK); break;
      case 'half': line(ctx, [[x - 14, ey - 4], [x + 14, ey - 4]], 4.6); ctx.save(); ctx.beginPath(); ctx.rect(x - 16, ey - 4, 32, 18); ctx.clip(); disc(ctx, px, ey - 3, 8, INK); ctx.restore(); break;
      case 'line': line(ctx, [[x - 12, ey], [x + 12, ey]], 4.4); break;
      case 'squint': line(ctx, [[x - 12, ey], [x + 12, ey]], 4.4); ctx.save(); ctx.beginPath(); ctx.rect(x - 15, ey, 30, 8); ctx.clip(); disc(ctx, px, ey, 4.2, INK); ctx.restore(); break;
      case 'shut': qline(ctx, [x - 12, ey + 4], [x, ey - 10], [x + 12, ey + 4], 4.4); break;
      default: disc(ctx, px, ey, 5.5, INK);
    }
  }
  const b = f.brows || 'flat', by = ey - (f.eyes === 'ring' ? (b === 'angry' ? 42 : 34) : 29);
  const brow = (x, side, dy0, dy1, arch = 0) => { const a = [x - 15 * side, by + dy0], c = [x + 16 * side, by + dy1]; qline(ctx, a, [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2 - arch], c, 5.6); };
  if (b === 'flat') { brow(L, -1, 0, 0); brow(R, 1, 0, 0); }
  if (b === 'smirk') { brow(L, -1, 2, 0, 1); brow(R, 1, -4, -8, 5); }
  if (b === 'raised') { brow(L, -1, -3, -3, 4); brow(R, 1, -3, -3, 4); }
  if (b === 'angry') { brow(L, -1, 5, -5, 0); brow(R, 1, 5, -5, 0); }
  if (b === 'worried') { brow(L, -1, -6, 4, 2); brow(R, 1, -6, 4, 2); }   // inner ends up
  if (b === 'laugh') { brow(L, -1, -2, -4, 3); brow(R, 1, -2, -4, 3); }
  const mx = cx + (f.mx || 0), o = f.open ?? 0;
  switch (f.mouth) {
    case 'dot': shape(ctx, () => ctx.ellipse(mx + look[0] * 3, my, 6, 4, 0, 0, 7), INK, 0); break;
    case 'line': line(ctx, [[mx - 11, my], [mx + 11, my]], 4.4); break;
    case 'bite': line(ctx, [[mx - 12, my + 2], [mx - 2, my - 1], [mx + 12, my + 1]], 4.4); break;        // effort: lip bitten, crooked
    case 'open': shape(ctx, () => ctx.ellipse(mx, my, 12 + 6 * o, 3 + 8 * o, 0, 0, 7), '#3a2028', 0); break;
    case 'smile': qline(ctx, [mx - 14, my - 3], [mx, my + 9], [mx + 14, my - 3], 4.2); break;
    case 'grin': { const w = 32, h = 12 + 10 * o;
      const build = () => { ctx.moveTo(mx - w, my - 8); ctx.quadraticCurveTo(mx, my + 2, mx + w, my - 8); ctx.quadraticCurveTo(mx + w * 0.5, my + h + 4, mx, my + h); ctx.quadraticCurveTo(mx - w * 0.5, my + h + 4, mx - w, my - 8); ctx.closePath(); };
      shape(ctx, build, '#3a2028', 3.4); ctx.save(); ctx.beginPath(); build(); ctx.clip();
      for (let i = -3; i <= 3; i++) shape(ctx, () => ctx.rect(mx + i * 9 - 4, my - 10, 8, 10 - Math.abs(i) * 0.6), '#fbfaf3', 1.6);
      ctx.fillStyle = '#d8606a'; ctx.beginPath(); ctx.ellipse(mx, my + h, 14, 7, 0, 0, 7); ctx.fill(); ctx.restore(); break; }
  }
}
function hand(ctx, x, y) { disc(ctx, x, y, 11.5, INK); }

// the big brush, drawn along +x from the hand (angle a, rad): handle, ferrule, bristles loaded with black paint
function brush(ctx, x, y, a, wet = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  shape(ctx, () => rrect(ctx, -46, -8, 112, 16, 7, 7), '#c98b4e', 4);             // handle
  line(ctx, [[-36, -3], [50, -3]], 2.4, 'rgba(255,225,170,.6)');
  shape(ctx, () => rrect(ctx, 62, -27, 26, 54, 4, 4), '#b9bfcb', 4.5);             // ferrule
  line(ctx, [[66, -20], [66, 20]], 2.4, 'rgba(255,255,255,.6)');
  const br = () => { ctx.moveTo(86, -30); ctx.lineTo(128, -30); ctx.quadraticCurveTo(140, -26, 142, -14); ctx.lineTo(144, 14); ctx.quadraticCurveTo(140, 28, 128, 31); ctx.lineTo(86, 30); ctx.closePath(); };
  shape(ctx, br, '#e9dcc0', 0);
  ctx.save(); ctx.beginPath(); br(); ctx.clip(); ctx.fillStyle = '#24202c'; ctx.fillRect(86 + 52 * (1 - wet * .75), -40, 70, 80);
  line(ctx, [[96, -24], [132, -24]], 2, 'rgba(255,255,255,.35)'); ctx.restore();
  shape(ctx, br, null, 5);
  ctx.restore();
}
function splat(ctx, x, y, r, col, seed) {   // a paint stain: blob with a few satellite drops
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI * 2, rr = r * (.7 + rnd() * .5); i ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill();
  for (let i = 0; i < 3; i++) { const a = rnd() * 6.28, d = r * (1.3 + rnd()); ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r * (.15 + rnd() * .18), 0, 7); ctx.fill(); }
}

// ---------- THE PAINTER ----------
// P9: head 172 tall; smock (torso) 1.1 head-heights = 190, .75 head-widths wide; legs 1.4 head-heights = 240 as stick limbs (LIMB = .055 W).
const PT = { headTop: -598, headH: 172, bodyTop: -432, hem: -242, shoulder: [-56, -414], shoulderR: [56, -414] };
export const BOX = { painter: [-170, -720, 360, 14] };
let RIMC = null;
export function drawPainter(ctx, p = {}) {
  if (p.rim) {   // a rim of light round the whole figure (C28 figure-ground on a dark hull): the silhouette, tinted and spread, under him
    const c = ctx.canvas, o = RIMC || (RIMC = document.createElement('canvas')); o.width = c.width; o.height = c.height; const g = o.getContext('2d');
    g.setTransform(ctx.getTransform()); drawPainter(g, { ...p, rim: null }); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = p.rim; g.fillRect(0, 0, o.width, o.height);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); const r = p.rimW || 24; for (let a = 0; a < 16; a++) ctx.drawImage(o, Math.cos(a * Math.PI / 8) * r, Math.sin(a * Math.PI / 8) * r); ctx.restore();
  }
  const f = p.face || {};
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // legs: stick limbs with boots, a paint drip on each shin
  for (const s of [-1, 1]) { const x = s * 24, ph = p.stride ?? null, dx = ph == null ? 0 : s * 46 * Math.sin(ph), lift = ph == null ? 0 : Math.max(0, s * Math.cos(ph)) * 26;
    ctx.save(); line(ctx, [[x, PT.hem + 4], [x + s * 4 + dx, -26 - lift]], LIMB); ctx.translate(dx, -lift);   // a stride: feet swing opposite, the forward foot lifts
    shape(ctx, () => { const bx = x + s * 12; ctx.moveTo(bx - 26, 0); ctx.lineTo(bx + 26, 0); ctx.quadraticCurveTo(bx + 30, -2, bx + 26, -12); ctx.quadraticCurveTo(bx + 12, -34, bx - 6, -32); ctx.quadraticCurveTo(bx - 28, -30, bx - 28, -10); ctx.quadraticCurveTo(bx - 30, -2, bx - 26, 0); ctx.closePath(); }, '#7a5038', 6);   // boot, flat sole on the ground line
    ctx.restore();
  }
  // body leans from the hips
  ctx.save(); ctx.translate(0, PT.hem); ctx.rotate(p.lean || 0); ctx.translate(0, -PT.hem);
  const smock = () => { const t = PT.bodyTop, h = PT.hem; ctx.moveTo(-40, t); ctx.lineTo(40, t); ctx.quadraticCurveTo(60, t + 2, 62, t + 40); ctx.lineTo(71, h - 4);
    ctx.quadraticCurveTo(48, h + 9, 24, h); ctx.quadraticCurveTo(0, h + 10, -24, h); ctx.quadraticCurveTo(-48, h + 9, -71, h - 4); ctx.lineTo(-62, t + 40); ctx.quadraticCurveTo(-60, t + 2, -40, t); ctx.closePath(); };
  shape(ctx, smock, '#e4c178', 0);
  ctx.save(); ctx.beginPath(); smock(); ctx.clip();
  ctx.fillStyle = 'rgba(96,90,170,.16)'; ctx.fillRect(30, PT.bodyTop - 10, 60, 230);                    // shadow side (the light comes from the left)
  line(ctx, [[-46, PT.bodyTop + 46], [-54, PT.hem - 18]], 3.2, 'rgba(255,246,220,.75)');                // highlight
  splat(ctx, -22, -350, 11, '#24202c', 3); splat(ctx, 34, -296, 9, '#f6f2e6', 7); splat(ctx, -42, -276, 8, '#3d63c9', 11); splat(ctx, 14, -412, 6, '#d2483d', 5); splat(ctx, 46, -380, 7, '#24202c', 13); splat(ctx, -8, -262, 5, '#24202c', 17);
  if (!p.back) { shape(ctx, () => rrect(ctx, 8, -346, 44, 38, 6, 8), '#d6ae62', 4.5);                   // pocket
  line(ctx, [[20, -346], [14, -388]], 6, '#c98b4e'); line(ctx, [[38, -346], [44, -384]], 6, '#3d63c9'); } // two small brushes in it
  ctx.restore();
  shape(ctx, smock, null, OL);
  // a red neckerchief knot
  if (p.back) shape(ctx, () => rrect(ctx, -34, PT.bodyTop - 8, 68, 16, 8, 8), '#d24a3c', 4.5);   // seen from behind: the neckerchief's band round the neck
  else shape(ctx, () => { ctx.moveTo(-30, PT.bodyTop - 4); ctx.lineTo(30, PT.bodyTop - 4); ctx.lineTo(6, PT.bodyTop + 36); ctx.lineTo(-4, PT.bodyTop + 36); ctx.closePath(); }, '#d24a3c', 4.5);
  // head
  const top = PT.headTop + (p.headY || 0), H = PT.headH, hx = (p.headX || 0);
  ctx.save(); ctx.translate(hx, top + H * .65); ctx.rotate(p.headTilt || 0); ctx.scale(p.headScale || 1, p.headScale || 1); ctx.translate(-hx, -(top + H * .65));
  if (p.back) { ctx.save(); ctx.translate(18, 6); shape(ctx, () => headPath(ctx, hx, top, 190, H), INK, HEAD_LW); ctx.restore(); }   // P17: the shadow side (right, away from the key) carries the heavy line
  headInk(ctx, hx, top, 190, H);
  shape(ctx, () => headPath(ctx, hx, top, 190, H), FACE, 0);
  ctx.fillStyle = 'rgba(96,90,170,.10)'; ctx.save(); ctx.beginPath(); headPath(ctx, hx, top, 190, H); ctx.clip(); ctx.beginPath(); ctx.ellipse(hx + 70, top + H * .7, 60, 70, 0, 0, 7); ctx.fill(); ctx.restore();
  shape(ctx, () => headPath(ctx, hx, top, 190, H), null, HEAD_LW);
  // face sits off-centre toward the look direction (.07 W)
  const fx = hx + (f.fx ?? 13), ey = top + H * .55;
  if (p.back) {   // three-quarters away (turned to screen right): the face slides round the head's edge and is cut by it; an ear and hair on the near side
    ctx.save(); ctx.beginPath(); headPath(ctx, hx, top, 190, H); ctx.clip(); drawFace(ctx, fx, ey, ey + 38, f);
    for (let i = 0; i < 5; i++) qline(ctx, [hx - 92 + i * 9, top + 58], [hx - 88 + i * 10, top + 92 + i * 4], [hx - 78 + i * 12, top + 112 + i * 2], 5, '#5a4636');   // hair under the cap
    ctx.restore();
    shape(ctx, () => ctx.ellipse(fx - 76, ey + 6, 15, 23, .1, 0, 7), FACE, 4.5); qline(ctx, [fx - 80, ey - 6], [fx - 70, ey + 4], [fx - 78, ey + 16], 3.2);   // ear
  } else drawFace(ctx, fx, ey, ey + 38, f);
  if (p.smudge) splat(ctx, fx - 52, ey + 30, 6, '#24202c', 23);
  // flat cap: a puffed crown over the head top, the peak toward the look direction
  const cs = p.capSide ?? 1, ct = top - 30;
  const crown = () => { ctx.moveTo(hx - 104, top + 60); ctx.bezierCurveTo(hx - 112, ct + 10, hx - 40, ct - 10, hx + 30, ct - 4); ctx.bezierCurveTo(hx + 96, ct, hx + 116, top + 30, hx + 102, top + 58); ctx.quadraticCurveTo(hx, top + 40, hx - 104, top + 60); ctx.closePath(); };
  ctx.save(); if (cs < 0) { ctx.translate(2 * hx, 0); ctx.scale(-1, 1); }
  shape(ctx, crown, '#7c6a8e', 0);
  ctx.save(); ctx.beginPath(); crown(); ctx.clip(); ctx.strokeStyle = 'rgba(40,30,55,.22)'; ctx.lineWidth = 3; for (let x = -120; x < 130; x += 16) { ctx.beginPath(); ctx.moveTo(hx + x, ct - 20); ctx.lineTo(hx + x + 30, top + 70); ctx.stroke(); }
  line(ctx, [[hx - 70, ct + 30], [hx - 20, ct + 8]], 3.4, 'rgba(255,240,255,.45)'); splat(ctx, hx - 50, top + 20, 7, '#f6f2e6', 29); ctx.restore();
  shape(ctx, crown, null, 6.5);
  shape(ctx, () => { ctx.moveTo(hx + 40, top + 48); ctx.quadraticCurveTo(hx + 120, top + 36, hx + 150, top + 62); ctx.quadraticCurveTo(hx + 110, top + 76, hx + 40, top + 62); ctx.closePath(); }, '#5e4f72', 6);   // peak
  disc(ctx, hx + 18, ct - 2, 8, '#5e4f72', 4);   // button
  ctx.restore();
  ctx.restore();
  ctx.restore();
  // the free arm, then the brush arm, both in front from the shoulder edges
  if (p.armL) { qline(ctx, p.armL.s, p.armL.c, p.armL.h, LIMB); hand(ctx, ...p.armL.h); }
  if (p.armR) { const a = p.armR; qline(ctx, a.s, a.c, a.h, LIMB); if (!a.noBrush) brush(ctx, a.h[0], a.h[1], a.brush, p.wet ?? 1); hand(ctx, ...a.h); }
  // flying paint drops after the slap
  if (p.drops) for (const [x, y, r] of p.drops) shape(ctx, () => ctx.arc(x, y, r, 0, 7), '#24202c', 0);
  ctx.restore();
}

// ---------- poses ----------
function keyed(keys, f) {   // [[frame, value(number|array|array of arrays)], ...]; eases between keys
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) {
    const [f0, a] = keys[i - 1], [f1, b] = keys[i], t = ease((f - f0) / (f1 - f0));
    const mix = (x, y) => Array.isArray(x) ? x.map((v, j) => mix(v, y[j])) : lerp(x, y, t);   // any depth
    return mix(a, b);
  }
  return keys[keys.length - 1][1];
}
// a blink: 4 frames half / shut / shut / half from its start frame a; an expression swap lands on a + 2, inside the shut
function blinkEyes(f, starts, eyes) { for (const a of starts) { const k = f - a; if (k >= 0 && k <= 3) return k === 0 || k === 3 ? 'half' : 'line'; } return eyes; }
const step = (tab, f) => { let v = null; for (const k of Object.keys(tab).map(Number).sort((a, b) => a - b)) if (k <= f) v = tab[k]; return v; };

// Named arm poses (ctrl, hand, brush angle). 'swing up' and 'slap down' ease over 6–8 frames.
export const ARM = {
  stand: [[96, -330], [118, -276], -1.25],     // brush held up beside him
  up:    [[120, -470], [176, -548], -.55],     // brush raised to the top of the stroke
  down:  [[150, -352], [204, -340], .55],      // brush slapped down on the hull
  high:  [[118, -500], [150, -600], -1.0],     // the big wind-up
  proud: [[110, -440], [150, -520], -1.45],    // brush held up like a sword
  rest:  [[130, -330], [170, -300], .9],       // brush hanging, still dripping
};
// face per frame: 'eyes/mouth/brows[/open]' — switches in one frame, never tweens; a 3-frame blink covers each swap (BLINK)
const FACE_TAB = {
  0: 'half/smile/smirk', 58: 'half/bite/flat', 86: 'ring/open/raised/.5',      // "zebra": the surprise is held into the pop
  97: 'squint/smile/laugh', 100: 'shut/grin/laugh/.6',                          // the laugh from parts (P24): rise + squint, then shut eyes and the grin, then the bend
};
const BLINK = [56, 69, 84, 94];   // blink starts (swaps at 58, 86, 97; the 94 blink covers 95–96)
// arm keys: the swing schedule lands each slap on a word (86 "zebra", 97 "stripes")
const ARM_KEYS = [[54, 'stand'], [58, 'stand'], [65, 'up'], [72, 'down'], [79, 'up'], [86, 'down'], [92, 'high'], [97, 'down'], [101, 'down'], [110, 'rest']];
// shots 7 and 9 (f450+): he strides in with the model boat held high, sets it on the table, then the close-up grin,
// the head shake on "hide" (701) and the turn of the model on "lie" (739). No brush in these shots.
const FACE7 = { 450: 'half/grin/raised/.3', 548: 'half/smile/smirk', 665: 'half/grin/smirk/.4', 682: 'half/grin/raised/.4', 698: 'squint/grin/flat/.2', 714: 'half/grin/smirk/.4', 737: 'squint/grin/smirk/.7' };
const BLINK7 = [494, 546, 663, 680, 696, 712, 735];   // 680 covers the brow lift on "doesn't" (682)
function painterLater(f) {
  let [eyes, mouth, brows, open] = step(FACE7, f).split('/'); eyes = blinkEyes(f, BLINK7, eyes);
  const face = { eyes, mouth, brows, open: +open, look: f < 548 ? [.2, -.1] : f < 665 ? [.7, .5] : [.15, 0], fx: f < 548 ? 4 : 13 };
  const L = PT.shoulder, Rr = PT.shoulderR;
  // hi: arms up outside the head, never across the face
  const hi = [[[-128, -540], [-106, -662]], [[128, -540], [106, -662]]], table = [[[-110, -380], [-74, -330]], [[110, -380], [74, -330]]], side = [[[-88, -340], [-80, -268]], [[88, -340], [80, -268]]];
  const turn = [[[-110, -380], [-40, -318]], [[120, -380], [110, -322]]];
  const arms = keyed([[450, hi], [534, hi], [544, table], [556, side], [664, side], [722, side], [732, table], [739, turn], [746, turn], [751, table]], f);
  const p = { face, armL: { s: L, c: arms[0][0], h: arms[0][1] }, armR: { s: Rr, c: arms[1][0], h: arms[1][1], noBrush: true }, smudge: true };
  if (f >= 460 && f < 538) p.stride = (f - 460) * .52;
  if (f >= 543 && f < 555) p.stride = (f - 543) * .52;          // ~6-frame steps
  p.lean = f < 538 ? .04 : keyed([[538, .04], [548, .1], [560, 0]], f);
  // shot 9 (r13): he breathes through the close-up, and on "doesn't" (682) tips his head, sly, as the brows go up; it comes back by the end of the shake
  if (f >= 665 && f < 737) { const br = Math.sin((f - 677) * 2 * Math.PI / 48) * ease((f - 664) / 8); p.headY = -3.5 * br; p.lean += .007 * br; p.headTilt = keyed([[669, 0], [681, -.035], [692, .065], [698, .045], [716, .03], [730, 0]], f); }
  if (f >= 698 && f < 716) { const t = (f - 698) / 18, e = Math.min(1, t * 5), k = Math.sin(t * Math.PI * 3) * (1 - t) * e * e * (3 - 2 * e); p.headX = 18 * k; p.headTilt = (p.headTilt || 0) + .1 * k; }   // "no": three shakes, decaying
  if (f >= 737 && f < 746) p.headY = keyed([[737, 0], [740, -14], [746, 0]], f);
  return p;
}
export function painterPose(f) {
  if (f >= 450) return painterLater(f);
  let [eyes, mouth, brows, open] = step(FACE_TAB, f).split('/');
  eyes = blinkEyes(f, BLINK, eyes);
  const face = { eyes, mouth, brows, open: open ? +open : 0, look: eyes === 'ring' ? [.4, -.1] : [.6, .1], fx: 13 };
  const ks = ARM_KEYS.map(([k, n]) => [k, [ARM[n][0], ARM[n][1], [ARM[n][2], 0]]]);
  const [c, h, [a]] = keyed(ks, f);
  // body: small leans on each stroke; the laugh rocks back (97–100) then bends over (101–111)
  const lean = keyed([[54, 0], [65, -.03], [72, .05], [79, -.03], [86, .05], [92, -.05], [97, .02], [100, -.07], [111, .2], [114, .19]], f);
  const p = { face, lean, armR: { s: PT.shoulderR, c, h, brush: a }, armL: { s: PT.shoulder, c: [-88, -340], h: [-80, -268] }, smudge: f >= 86,
    headTilt: keyed([[97, 0], [100, -.08], [111, .16]], f), headY: keyed([[96, 0], [99, -18], [104, -12], [111, 0]], f), headScale: keyed([[96, 1], [99, 1.1], [106, 1.05], [111, 1]], f) };
  if (f >= 97 && f < 104) { const t = f - 97; p.drops = [[250 + t * 22, -380 - t * 14 + t * t * 2.5, 9], [236 + t * 16, -310 - t * 6 + t * t * 2, 6], [270 + t * 26, -330 - t * 20 + t * t * 3, 7]]; }
  return p;
}

// shot 4: seen through the office window, dangling from a rope ladder over the dazzled hull, still painting
function painterDangle(f) {
  const sw = Math.sin(f * .45);
  return { face: { eyes: 'ring', mouth: 'grin', brows: 'raised', open: .4, look: [.6, 0], fx: 20 }, lean: .05 * sw, smudge: true,
    armL: { s: PT.shoulder, c: [-110, -520], h: [-70, -640] }, armR: { s: PT.shoulderR, c: [150, -390 + 40 * sw], h: [196, -420 + 70 * sw], brush: .2 + .5 * sw } };
}

// ---------- THE ADMIRALS ----------
// kind 'front': walrus moustache, monocle, a cocked hat far too tall. 'a': round, ginger side-whiskers. 'b': thin, a black pointed beard.
const AD = { headTop: -640, headH: 172, bodyTop: -474, hem: -270, legTop: -278 };   // legs 278 = 1.46 head-heights (+18 %)
BOX.admiral = [-230, -985, 250, 24];
const NAVY = '#4a62a8', GOLD = '#e8b84a';   // a lighter navy, so the ink arms read against it
function hat(ctx, cx, top, w, h, trim) {   // cocked hat worn athwartships: a tall half-moon with a gold edge and a cockade
  const build = () => { ctx.moveTo(cx - w / 2, top + 26); ctx.bezierCurveTo(cx - w * .45, top - h * .6, cx - w * .14, top - h, cx + 4, top - h); ctx.bezierCurveTo(cx + w * .16, top - h, cx + w * .46, top - h * .6, cx + w / 2, top + 26); ctx.quadraticCurveTo(cx, top + 6, cx - w / 2, top + 26); ctx.closePath(); };
  shape(ctx, build, '#1f1c2a', 0); ctx.save(); ctx.beginPath(); build(); ctx.clip(); ctx.lineWidth = 14; ctx.strokeStyle = trim; ctx.beginPath(); build(); ctx.stroke();
  line(ctx, [[cx - w * .3, top - h * .35], [cx - w * .12, top - h * .78]], 4, 'rgba(255,255,255,.22)'); ctx.restore(); shape(ctx, build, null, 6.5);
  disc(ctx, cx + w * .12, top - h * .32, 18, GOLD, 4); disc(ctx, cx + w * .12, top - h * .32, 7, '#c4433a', 2.5);
}
export function drawAdmiral(ctx, p = {}) {
  const f = p.face || {}, k = p.kind || 'front', bw = k === 'front' ? 64 : k === 'a' ? 70 : 60;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const tr = p.turn || 0; if (tr) ctx.scale(1 - .12 * Math.abs(tr), 1);   // [G] turn (−1..1, − = toward screen left): a three-quarter view — narrower, features and hat slide toward the turn
  ctx.fillStyle = 'rgba(40,24,48,.38)'; ctx.beginPath(); ctx.ellipse(0, 4, 92, 13, 0, 0, 7); ctx.fill();   // contact blob under the feet
  const AY = -42;   // pose arm coordinates were authored before the legs grew; lift them with the body
  // legs 12 % shorter (chin-to-sole 2.33 head widths): everything above the legs drops by LD
  const LD = -AD.legTop * .2;
  if (p.armL && p.armL.back) { ctx.save(); ctx.translate(0, AY + LD); qline(ctx, p.armL.s, p.armL.c, p.armL.h, LIMB); ctx.restore(); }
  for (const s of [-1, 1]) { const x = s * 24;
    line(ctx, [[x, AD.legTop + LD], [x + s * 4, -26]], LIMB);
    shape(ctx, () => { const bx = x + s * 10; ctx.moveTo(bx - 30, 0); ctx.lineTo(bx + 30, 0); ctx.quadraticCurveTo(bx + 34, -2, bx + 30, -14); ctx.quadraticCurveTo(bx + 14, -40, bx - 6, -38); ctx.quadraticCurveTo(bx - 32, -36, bx - 32, -12); ctx.quadraticCurveTo(bx - 34, -2, bx - 30, 0); ctx.closePath(); }, '#4c4a68', 6.5); }
  ctx.translate(0, LD);
  ctx.save(); ctx.translate(0, AD.hem); ctx.rotate(p.lean || 0); ctx.translate(0, -AD.hem);
  const coat = () => { const t = AD.bodyTop, h = AD.hem; ctx.moveTo(-bw * .55, t); ctx.lineTo(bw * .55, t); ctx.quadraticCurveTo(bw, t + 4, bw + (k === 'front' ? 8 : 4), t + 90); ctx.quadraticCurveTo(bw + (k === 'front' ? 12 : 8), h - 60, bw + 6, h);
    ctx.lineTo(-bw - 6, h); ctx.quadraticCurveTo(-bw - (k === 'front' ? 12 : 8), h - 60, -bw - (k === 'front' ? 8 : 4), t + 90); ctx.quadraticCurveTo(-bw, t + 4, -bw * .55, t); ctx.closePath(); };
  ctx.save(); ctx.translate(7, 4); shape(ctx, coat, INK, 0); ctx.restore();   // weighted outline: an ink copy behind, heavy on the shadow side
  shape(ctx, coat, NAVY, 0);
  ctx.save(); ctx.beginPath(); coat(); ctx.clip();
  ctx.fillStyle = 'rgba(20,20,60,.25)'; ctx.fillRect(bw * .45, AD.bodyTop - 10, 120, 400);
  line(ctx, [[-bw * .7, AD.bodyTop + 60], [-bw * .8, AD.hem - 30]], 3.4, 'rgba(160,180,240,.45)');
  shape(ctx, () => { ctx.moveTo(-30, AD.bodyTop - 2); ctx.lineTo(30, AD.bodyTop - 2); ctx.lineTo(0, AD.bodyTop + 64); ctx.closePath(); }, '#f4efe2', 3.4);   // shirt front
  shape(ctx, () => { ctx.moveTo(-8, AD.bodyTop + 6); ctx.lineTo(8, AD.bodyTop + 6); ctx.lineTo(4, AD.bodyTop + 44); ctx.lineTo(-4, AD.bodyTop + 44); ctx.closePath(); }, '#1f1c2a', 2);
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) disc(ctx, s * 30, AD.bodyTop + 92 + i * 52, 9, GOLD, 2.6);
  line(ctx, [[-bw - 10, AD.hem - 26], [bw + 10, AD.hem - 26]], 9, GOLD);   // gold edge on the coat skirt
  if (k !== 'b') { const mx = -bw * .55; [['#c4433a', '#f2ece0'], ['#3d63c9', '#e8b84a'], ['#2f8a5a', '#c4433a']].forEach(([a, b], i) => { shape(ctx, () => ctx.rect(mx - 12 + i * 22, AD.bodyTop + 76, 20, 26), a, 2.4); line(ctx, [[mx - 2 + i * 22, AD.bodyTop + 78], [mx - 2 + i * 22, AD.bodyTop + 100]], 4, b); }); }
  ctx.restore(); shape(ctx, coat, null, OL);
  // epaulettes: gold pads with a fringe
  for (const s of [-1, 1]) { const ex = s * (bw * .62); for (let i = -3; i <= 3; i++) line(ctx, [[ex + i * 7, AD.bodyTop + 14], [ex + i * 8, AD.bodyTop + 46]], 4.2, '#d3a03a'); shape(ctx, () => ctx.ellipse(ex, AD.bodyTop + 10, 40, 16, 0, 0, 7), GOLD, 4.5); }
  // head
  const top = AD.headTop + (p.headY || 0), H = AD.headH, hx = p.headX || 0;
  ctx.save(); ctx.translate(hx, top + H * .65); ctx.rotate(p.headTilt || 0); ctx.translate(-hx, -(top + H * .65));
  if (p.ink17) { ctx.save(); ctx.translate(14, 7); shape(ctx, () => headPath(ctx, hx, top, 190, H), INK, 0); ctx.restore(); }   // [G] P17: a heavier shadow-side ink (lower right, away from the key)
  headInk(ctx, hx, top, 190, H); shape(ctx, () => headPath(ctx, hx, top, 190, H), FACE, 0);
  ctx.fillStyle = 'rgba(96,90,170,.10)'; ctx.save(); ctx.beginPath(); headPath(ctx, hx, top, 190, H); ctx.clip(); ctx.beginPath(); ctx.ellipse(hx + 70, top + H * .7, 60, 70, 0, 0, 7); ctx.fill();
  if (false) for (const s of [-1, 1]) { }
  ctx.restore(); shape(ctx, () => headPath(ctx, hx, top, 190, H), null, p.ink17 ? HEAD_LW * .9 : HEAD_LW * 1.45);   // the admirals' lit side reads thicker (P17); with ink17 the lit side thin, the shadow side heavy
  const fx = hx + (f.fx ?? 0) + 34 * tr, ey = top + H * .52;
  drawFace(ctx, fx, ey, ey + 44 + (p.jaw || 0), f);   // jaw: the mouth drops below the moustache (shot 11)
  if (k === 'front') {   // walrus moustache over the mouth
    const my = ey + 34, m = () => { ctx.moveTo(fx, my - 6); ctx.bezierCurveTo(fx + 30, my - 16, fx + 62, my - 8, fx + 72, my + 22); ctx.quadraticCurveTo(fx + 44, my + 12, fx + 22, my + 18); ctx.quadraticCurveTo(fx + 8, my + 10, fx, my + 14);
      ctx.quadraticCurveTo(fx - 8, my + 10, fx - 22, my + 18); ctx.quadraticCurveTo(fx - 44, my + 12, fx - 72, my + 22); ctx.bezierCurveTo(fx - 62, my - 8, fx - 30, my - 16, fx, my - 6); ctx.closePath(); };
    shape(ctx, m, '#ece8e2', 4.5); line(ctx, [[fx - 40, my + 4], [fx - 20, my]], 2.4, 'rgba(120,110,130,.6)'); line(ctx, [[fx + 40, my + 4], [fx + 20, my]], 2.4, 'rgba(120,110,130,.6)');
    if (p.monocle !== false) { const mx = fx + 19 + (p.monoDx || 0), my2 = ey + (p.monoDy || 0); shape(ctx, () => ctx.arc(mx, my2, 24, 0, 7), 'rgba(200,228,255,.28)', 0); shape(ctx, () => ctx.arc(mx, my2, 24, 0, 7), null, 7); shape(ctx, () => ctx.arc(mx, my2, 24, 0, 7), null, 3.4, GOLD);   // r17: monoDx/Dy, the monocle slipping before it falls
      line(ctx, [[mx - 10, my2 - 12], [mx - 2, my2 - 17]], 3, 'rgba(255,255,255,.85)'); qline(ctx, [mx + 22, my2 + 10], [mx + 60, my2 + 120], [mx + 20, top + H + 60], 2.4, GOLD); }
  }
  if (k === 'b') { const by = ey + 62; shape(ctx, () => { ctx.moveTo(fx - 40, by - 14); ctx.quadraticCurveTo(fx, by - 4, fx + 40, by - 14); ctx.quadraticCurveTo(fx + 30, by + 30, fx + 2, by + 62); ctx.quadraticCurveTo(fx - 28, by + 30, fx - 40, by - 14); ctx.closePath(); }, '#3a3036', 4.5);
    shape(ctx, () => { ctx.moveTo(fx - 30, ey + 36); ctx.quadraticCurveTo(fx, ey + 26, fx + 30, ey + 36); ctx.quadraticCurveTo(fx, ey + 40, fx - 30, ey + 36); ctx.closePath(); }, '#3a3036', 3); }
  const hH = k === 'front' ? 330 : k === 'a' ? 130 : 150, hw = (k === 'front' ? 250 : 220) * (1 - .25 * Math.abs(tr));
  hat(ctx, hx + (p.hatX || 0) + 24 * tr, top + 30, hw, hH, GOLD);
  ctx.restore(); ctx.restore();
  ctx.translate(0, AY);
  for (const a of [p.armL, p.armR]) if (a && !a.back) { qline(ctx, a.s, a.c, a.h, LIMB); const dx = a.h[0] - a.c[0], dy = a.h[1] - a.c[1], L = Math.hypot(dx, dy) || 1;
    line(ctx, [[a.h[0] - dx / L * 26 - dy / L * 9, a.h[1] - dy / L * 26 + dx / L * 9], [a.h[0] - dx / L * 26 + dy / L * 9, a.h[1] - dy / L * 26 - dx / L * 9]], 6, GOLD);
    hand(ctx, ...a.h); if (a.finger != null) line(ctx, [a.h, [a.h[0] + Math.cos(a.finger) * 26, a.h[1] + Math.sin(a.finger) * 26]], 8.5); }
  ctx.restore();
}
const ADM_FACE = { 0: 'half/line/flat', 237: 'half/line/raised', 244: 'half/slant/smirk' };
const CHO_FACE = { 0: 'half/line/flat', 246: 'line/smile/raised', 259: 'half/smile/flat' };
const ADM_BLINK = [216, 235, 242, 262], CHO_BLINK = [226, 244, 257];
// shot 8: the monocle drops into the tea on "stares" (586) — the reaction lands 2 frames early; deadpan slow blink on "see" (654), 650–658, before the whip
const ADM8 = { 0: 'half/line/flat', 584: 'ring/open/raised/.6', 592: 'half/line/flat', 622: 'half/line/raised', 651: 'half/line/flat' };
function admiral8(f) {
  let [eyes, mouth, brows, open] = step(ADM8, f).split('/'); if (f >= 651 && f <= 658) eyes = f === 651 || f === 658 ? 'half' : 'line'; else eyes = blinkEyes(f, [582, 590, 620, 632], eyes);   // 582: a blink over the swap to the wide eyes on 584   // the slow blink: 9 frames
  const S = [bwS('front'), -410];
  const talk = f >= 621 && f < 649 ? 6 * Math.abs(Math.sin((f - 621) * .7)) : 0;
  // acting through the holds (r13): he breathes the whole shot; on "it" (600) a slow quizzical tilt toward the model, on "goes" (609) he draws
  // himself up for the line; on "to see?" (650) he leans in and tilts the other way into the slow blink
  const br = Math.sin((f - 576) * 2 * Math.PI / 52), tilt = keyed([[570, 0], [582, -.08], [588, 0], [594, 0], [610, -.075], [621, -.05], [646, -.03], [658, .06]], f);
  const draw = keyed([[607, 0], [615, -14], [621, -10], [646, -6], [658, 4]], f), lean8 = keyed([[570, 0], [582, .06], [588, 0], [607, 0], [615, -.03], [646, -.015], [658, .035]], f);   // 570–583: he leans in and peers at the model before the monocle drops (r16: from the whip's landing, bigger, so 487–494 isn't still)
  return { kind: 'front', face: { eyes, mouth, brows, open: +open || 0, look: f < 584 ? [.5, .6] : f < 592 ? [0, 0] : f < 600 ? [.2, 0] : f < 646 ? [.45, .25] : [0, 0], fx: -4 }, monocle: f < 586, monoDy: f >= 577 && f < 586 ? keyed([[577, 0], [578, 5], [580, 2], [582, 7], [584, 10], [585, 13]], f) : 0, monoDx: f >= 578 && f < 586 ? 3 * Math.sin((f - 577) * 2.4) : 0,   // r17/r18: from 578 (new 488) the full ring trembles and slips as his brow goes up, through 585 (new 497); thrown off from 586 (new 498 = old 586.2, the plop)
    armR: { s: S, c: [110, -300 + 6 * br], h: [58, -270 + 5 * br] }, armL: { s: [-S[0], -410], c: [-150, -330], h: [-120, -300], back: true },
    headY: keyed([[583, 0], [585, -16], [590, -10], [596, 0]], f) - talk + draw - 5 * br, headTilt: tilt, lean: keyed([[583, 0], [586, -.04], [596, 0]], f) + lean8 + .012 * br };
}
function admiralPose(kind, f) {
  if (kind === 'front' && f >= 450) return admiral8(f);
  if (kind === 'front') {
    let [eyes, mouth, brows] = step(ADM_FACE, f).split('/'); eyes = blinkEyes(f, ADM_BLINK, eyes);
    const face = { eyes, mouth, brows, look: f >= 236 ? [0, .1] : [-.8, 0], fx: f >= 236 ? -4 : -13 };   // he stands screen-right, looking left to the window
    const S = [bwS('front'), -410];
    const rest = [[110, -300], [58, -270]], up = [[178, -440], [132, -556]];   // the hand clear of the head, by the temple
    let [c, h] = (keyedPair([[207, rest], [241, rest], [246, up], [262, up], [270, rest]], f));
    let finger = f >= 244 && f < 264 ? -2.85 : null;
    if (f >= 244 && f < 262) { const ph = (f - 244) / 6 * Math.PI * 2; h = [h[0] + 12 * Math.cos(ph), h[1] + 12 * Math.sin(ph)]; finger = -2.85 + .45 * Math.sin(ph); }
    return { kind, face, armR: { s: S, c, h, finger }, armL: { s: [-S[0], -410], c: [-150, -330], h: [-120, -300], back: true }, lean: keyed([[241, 0], [246, .03], [262, .03], [270, 0]], f), headTilt: keyed([[238, 0], [244, -.06], [262, -.06], [270, 0]], f) };
  }
  let [eyes, mouth, brows] = step(CHO_FACE, f).split('/'); if (eyes !== 'line') eyes = blinkEyes(f, CHO_BLINK, eyes);
  const nod = keyed([[242, 0], [247, 16], [252, 0], [257, 16], [262, 0]], f);   // nods start on 'lost' (244), 5-frame strokes
  const look = kind === 'a' ? [.8, 0] : [.6, .1];
  // the chorus stands screen-left, looking right at him
  return { kind, face: { eyes, mouth, brows, look, fx: 13 }, headY: nod, headTilt: nod * .004, armL: { s: [-bwS(kind), -410], c: [-110, -320], h: [-60, -300] }, armR: { s: [bwS(kind), -410], c: [110, -320], h: [60, -300] } };
}
const bwS = k => (k === 'front' ? 64 : k === 'a' ? 70 : 60) * .8;
function keyedPair(keys, f) { const r = keyed(keys, f); return r; }

// ---------- the admiral's hand from above (shot 6): a navy sleeve from the right, index finger pointing left ----------
BOX.hand = [-200, -110, 1560, 110];   // the sleeve runs on past the frame edge
export function drawHand(ctx, p = {}) {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  shape(ctx, () => rrect(ctx, 70, -66, 1500, 132, 18, 18), NAVY, OL);
  ctx.save(); ctx.beginPath(); rrect(ctx, 70, -66, 1500, 132, 18, 18); ctx.clip(); for (const x of [104, 128, 146]) line(ctx, [[x, -70], [x, 70]], x === 104 ? 12 : 6, GOLD); ctx.fillStyle = 'rgba(160,180,240,.25)'; ctx.fillRect(70, -60, 1500, 18); ctx.restore();
  shape(ctx, () => rrect(ctx, 48, -58, 34, 116, 10, 10), '#f4efe2', 6);
  const palm = () => { ctx.moveTo(52, -48); ctx.quadraticCurveTo(-10, -66, -40, -36); ctx.quadraticCurveTo(-60, 0, -30, 40); ctx.quadraticCurveTo(10, 66, 52, 46); ctx.closePath(); };
  shape(ctx, palm, FACE, 0);
  for (const y of [-6, 14, 32]) shape(ctx, () => ctx.ellipse(-44, y, 22, 13, 0, 0, 7), FACE, 5);   // curled fingers
  shape(ctx, () => rrect(ctx, -160, -46, 140, 30, 15, 15), FACE, 6);                             // index finger, pointing left
  line(ctx, [[-150, -36], [-140, -36]], 3, 'rgba(160,150,170,.5)');
  shape(ctx, palm, null, 6);
  shape(ctx, () => ctx.ellipse(10, -60, 34, 15, -.3, 0, 7), FACE, 5.5);                          // thumb on top
  ctx.restore();
}
// shot 10 (752–786): over his shoulder. The painter in the lower left, three-quarters away from us, turned to the hull: we see his
// shoulder, ear and cheek, one eye at the head's edge. He watches it ("So they paint"), raises the brush like a sword as it pops on
// "one" (767), and as the camera pulls back on "ten" (780) he throws both arms up; he leaves the frame by its left side (~776).
const FACE10 = { 752: 'half/grin/raised/.3', 766: 'ring/grin/raised/.6', 772: 'squint/grin/laugh/.6', 777: 'shut/grin/laugh/.8', 786: 'half/grin/raised/.4', 805: 'ring/grin/raised/.9' };
const BLINK10 = [757, 762, 796, 802];
// 10b (786–834): he has climbed onto the cab of the crane on the head wall: head and shoulder over the lower-left edge, looking out at the ten,
// then up and out as the hundreds pop (805)
function painterDock(f) {
  let [eyes, mouth, brows, open] = step(FACE10, f).split('/'); eyes = blinkEyes(f, BLINK10, eyes);
  const rim = f < 780 ? '#b4c3ef' : null, rimW = f < 773 ? 24 : 24 * (1 - ease((f - 773) / 7)) + .01;   // r18: the rim (C28, for the dark hull over his shoulder) thins out as he gets small in the pull-back and is off from 780: it read as an 8 px halo on 697–718
  if (f >= 786) {
    const face = { eyes, mouth, brows, open: +open, look: f < 805 ? [.8, .5] : [.9, -.2], fx: 70 };
    const go = f >= 797 ? (f - 797) * .9 : null;   // the trot off to the left (797–806)
    return { face, back: true, rim, rimW, smudge: false, stride: go, lean: keyed([[786, .02], [804, .02], [808, -.05]], f) + .006 * Math.sin((f - 786) * .15),
      armR: { s: PT.shoulderR, c: [112, -400], h: [150, -470], brush: -1.35 }, armL: { s: PT.shoulder, c: [-96, -330], h: [-70, -276] },
      headY: keyed([[786, 0], [804, 0], [807, -16], [812, -10]], f) + 3 * Math.sin((f - 786) * .21), headTilt: keyed([[786, .06], [804, .06], [808, -.05]], f) };
  }
  const face = { eyes, mouth, brows, open: +open, look: [.9, -.6], fx: 76 };
  const A = n => [ARM[n][0], ARM[n][1], [ARM[n][2], 0]], READY = [[112, -400], [146, -474], [-1.35, 0]];   // brush held up by his cheek: out of the caption band
  const [c, h, [a]] = keyed([[752, READY], [762, READY], [766, A('proud')], [774, A('proud')], [778, A('high')]], f);
  const armL = keyed([[752, [[-88, -340], [-80, -268]]], [774, [[-88, -340], [-80, -268]]], [778, [[-128, -540], [-106, -662]]]], f);
  const breathe = 3 * Math.sin((f - 752) * .21);   // never a still card: a slow breath and a small sway while he watches
  return { face, back: true, rim, rimW, lean: keyed([[752, .02], [766, -.03], [774, -.02], [778, -.07]], f) + .006 * Math.sin((f - 752) * .13), smudge: false, armR: { s: PT.shoulderR, c, h, brush: a }, armL: { s: PT.shoulder, c: armL[0], h: armL[1] },
    headY: keyed([[752, 0], [763, 0], [766, -14], [771, -7], [774, -7], [778, -18]], f) + breathe, headTilt: keyed([[752, .05], [764, .05], [767, -.04], [772, 0]], f) };
}
// shot 11 (old 835–898, new 754–822 through the page's time map): the admiral a year later, in the bow of the harbour launch, proud over the
// striped fleet; on "ships" he sweeps his arm out over it (882–893) and back (899). v18: the factory reactions (look up, turn, jaw, head shake) went with 11i.
const FACE11 = { 835: 'half/smile/smirk' };
const BLINK11 = [848, 876, 903];
function admiral11(f) {
  let [eyes, mouth, brows, open] = step(FACE11, f).split('/'); eyes = blinkEyes(f, BLINK11, eyes);
  const S = [bwS('front'), -410];
  const arms = keyed([[835, [[110, -300], [58, -270], [-150, -330], [-120, -300]]], [876, [[110, -300], [58, -270], [-150, -330], [-120, -300]]], [882, [[110, -300], [58, -270], [-200, -400], [-290, -420]]], [893, [[110, -300], [58, -270], [-200, -400], [-290, -430]]], [899, [[110, -300], [58, -270], [-150, -330], [-120, -300]]]], f);
  return { kind: 'front', face: { eyes, mouth, brows, open: +open || 0, look: [-.7, .1], fx: -10 }, monocle: true, ink17: true, turn: 0,
    armR: { s: S, c: arms[0], h: arms[1] }, armL: { s: [-S[0], -410], c: arms[2], h: arms[3], back: !(f >= 879 && f < 898) },
    jaw: 0, headY: keyed([[855, 0], [859, -6], [868, -3]], f), lean: keyed([[855, 0], [859, -.03], [870, -.02]], f), headTilt: 0, headX: 0 };
}
export function poseAt(who, f) {
  if (who === 'painter' && f >= 752) return painterDock(f);
  if (who === 'admiral' && f >= 835) return admiral11(f);
  if (who === 'painter') return f >= 207 && f <= 276 ? painterDangle(f) : painterPose(f);
  if (who === 'admiral') return admiralPose('front', f);
  if (who === 'chorusA') return admiralPose('a', f);
  if (who === 'chorusB') return admiralPose('b', f);
  return {};
}
