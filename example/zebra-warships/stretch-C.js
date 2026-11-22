// stretch-C.js — frames 258–373 (T45, 5, T56, 6): the admiral acts.
// Shot 5: the flag lieutenant (a fourth officer in a peaked cap, so no admiral of shot 4 is ever seen twice in the pan)
// stands on a step stool and tears the 1916 page off on "1917", sees 1917, crumples the page, drops it.
// Shot 6: a second admiral (the bearded one) at the west side of the map table rakes ship tokens off the edge with a
// croupier's rake, wincing as each goes "down" (week 320, down 359), then glares at the sub token before the iris.
// Shot 6 is now an oblique view from shot 5's own camera spot (T56 stays a pure pitch, ~30° instead of 90°).
import * as THREE from 'three';
import { drawAdmiral, shape, line, qline, disc, INK } from './cast.js';
import { put, toon } from './world.js';

// shot 5's camera (O-local): position, look, fov, lens shift. Shot 6 starts from the same spot with the same heading.
export const CAM5 = [-.05, 3.2, -9.2, 3.46, 2.0, 0, 17.5, 120, 0];   // 3.2 m up: a smaller rise in T45 than the old 4.25
const AOFF = 278 * .2 - 42;   // drawAdmiral draws arm points shifted down by LD + AY = 13.6
const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t, lp = (a, b, t) => Array.isArray(a) ? a.map((x, i) => lp(x, b[i], t)) : lerp(a, b, t);
// keyed values (number or [x,y]) with smoothstep between keys
function key(keys, f) { if (f <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) { const [f0, a] = keys[i - 1], [f1, b] = keys[i], t = ease((f - f0) / (f1 - f0)); return lp(a, b, t); } return keys[keys.length - 1][1]; }
const step = (tab, f) => { let v = null; for (const [k, x] of tab) if (k <= f) v = x; return v; };
const blink = (f, starts, eyes) => { for (const a of starts) { const k = f - a; if (k >= 0 && k <= 3) return k === 0 || k === 3 ? 'half' : 'line'; } return eyes; };
const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const face = (s, look, fx) => { const [eyes, mouth, brows, open] = s.split('/'); return { eyes, mouth, brows, open: +open || 0, look, fx }; };

export function stretchC({ S, OF, O, cam, card, CARDS, U }) {
  // ---------- projection: a world point → drawing units on a card's plane (along the camera ray), so drawn hands and rakes land on 3D props
  const _n = new THREE.Vector3(), _p = new THREE.Vector3(), _d = new THREE.Vector3();
  function toCard(c, w) { c.root.updateMatrixWorld(true); const m = c.m.matrixWorld; _n.set(0, 0, 1).transformDirection(m); _p.setFromMatrixPosition(m);
    _d.copy(w).sub(cam.position); const t = _n.dot(_p.clone().sub(cam.position)) / _n.dot(_d); const X = cam.position.clone().addScaledVector(_d, t);
    const l = c.root.worldToLocal(X); return [l.x / U, -l.y / U]; }

  // ================= shot 5: the calendar =================
  const BOX5 = [-260, -1000, 560, 40];
  const st5 = { f: null, grab: [0, 0], page: null };
  // the torn page, drawn in the page's own units (560 x 770, y down) into the affine frame of its projected corners
  function pageArt(g) {
    g.fillStyle = '#f3ead2'; g.beginPath(); g.moveTo(0, 18); for (let x = 0; x <= 560; x += 28) g.lineTo(x, x / 28 % 2 ? 4 : 22); g.lineTo(560, 770); g.lineTo(0, 770); g.closePath(); g.fill();   // torn top edge
    g.fillStyle = '#c4433a'; g.fillRect(0, 60, 560, 90); g.fillStyle = '#f3ead2'; g.font = 'bold 50px Georgia, serif'; g.textAlign = 'center'; g.fillText('ADMIRALTY', 280, 122);
    g.fillStyle = '#2a1a26'; g.font = 'bold 180px Georgia, serif'; g.fillText('1916', 280, 330); g.fillStyle = '#c4433a'; g.font = 'bold 54px Georgia, serif'; g.fillText('DECEMBER', 280, 400);
    g.strokeStyle = '#c4433a'; g.lineWidth = 9; for (let j = 0; j < 5; j++) for (let i = 0; i < 7; i++) { const x = 62 + i * 73, y = 460 + j * 60; g.beginPath(); g.moveTo(x - 20, y - 18); g.lineTo(x + 20, y + 18); g.moveTo(x + 20, y - 18); g.lineTo(x - 20, y + 18); g.stroke(); }
    g.beginPath(); g.moveTo(0, 18); for (let x = 0; x <= 560; x += 28) g.lineTo(x, x / 28 % 2 ? 4 : 22); g.lineTo(560, 770); g.lineTo(0, 770); g.closePath(); g.lineWidth = 14; g.strokeStyle = INK; g.stroke(); }
  // a crumpled paper wad: a jagged cream lump with a red corner of the header and angular creases (spins as it falls)
  function wad(g, x, y, r, a) { g.save(); g.translate(x, y); g.rotate(a);
    const P = [1, .82, 1.05, .78, .98, .86, 1.08, .8, .95, .84].map((k, i) => [Math.cos(i / 10 * 6.283) * r * k, Math.sin(i / 10 * 6.283) * r * k]);
    const path = () => { g.moveTo(...P[0]); for (const p of P.slice(1)) g.lineTo(...p); g.closePath(); };
    shape(g, path, '#efe4c8', 0); g.save(); g.beginPath(); path(); g.clip(); g.fillStyle = '#c4433a'; g.fillRect(r * .25, -r, r, r * .55); g.restore();
    for (const [p, q, s] of [[[-.6, -.2], [-.1, .1], [.3, -.35]], [[-.3, .55], [.05, .2], [.55, .35]], [[.1, -.75], [.2, -.3], [-.05, .05]]]) line(g, [p, q, s].map(([u, v]) => [u * r, v * r]), 3);
    shape(g, path, null, 5.5); g.restore(); }
  // the lieutenant's peaked cap, drawn over the head after the bicorne is erased: white crown, navy band, black visor, gold badge
  function capOver(g, p) {
    const top = -640 + 278 * .2 + (p.headY || 0), hx = p.headX || 0, pv = [hx, top + 172 * .65];
    g.save(); g.translate(...pv); g.rotate(p.headTilt || 0); g.translate(-pv[0], -pv[1]);
    g.save(); g.globalCompositeOperation = 'destination-out'; g.fillRect(hx - 150, top - 420, 300, 450); g.restore();   // the bicorne and the head's very top
    const crown = () => { g.moveTo(hx - 104, top + 2); g.quadraticCurveTo(hx - 128, top - 52, hx - 60, top - 62); g.quadraticCurveTo(hx, top - 70, hx + 64, top - 62); g.quadraticCurveTo(hx + 132, top - 52, hx + 104, top + 2); g.closePath(); };
    shape(g, crown, '#f2efe8', 6.5);
    shape(g, () => { g.moveTo(hx - 100, top - 4); g.lineTo(hx + 100, top - 4); g.lineTo(hx + 96, top + 30); g.lineTo(hx - 96, top + 30); g.closePath(); }, '#2b3560', 6);
    shape(g, () => { g.moveTo(hx - 86, top + 28); g.quadraticCurveTo(hx, top + 58, hx + 86, top + 28); g.closePath(); }, '#1f1c2a', 5);
    disc(g, hx, top + 12, 13, '#e8b84a', 3.5); g.restore(); }
  function pose5(who, f) {
    const S = [56, -410], G = [st5.grab[0], st5.grab[1] - AOFF];
    const rest = [[110, -300], [58, -270]];
    const reach = [[(S[0] + G[0]) / 2 + 70, (S[1] + G[1]) / 2 + 40], G];
    const torn = [[190, -380], [205, -330]], held = [[175, -360], [150, -330]];
    const arm = key([[262, rest], [271, rest], [275, reach], [276, reach], [279, torn], [283, held], [292, held], [297, rest]], f);
    const look = f < 280 ? [.85, -.75] : f < 284 ? [.7, .5] : f < 295 ? [.85, -.85] : [.1, .1];
    let fs = step([[0, 'half/line/flat'], [271, 'half/line/angry'], [274, 'squint/bite/angry'], [280, 'half/smile/smirk'], [284, 'ring/line/flat'], [287, 'ring/open/raised/.5'], [292, 'ring/line/raised']], f);
    let F = face(fs, look, f < 295 ? 14 : 2); F.eyes = blink(f, [267, 293], F.eyes);
    return { kind: 'a', face: F, armR: { s: S, c: arm[0], h: arm[1] }, armL: { s: [-S[0], -410], c: [-150, -330], h: [-120, -300], back: true },
      headY: key([[271, 0], [274, 7], [276, 7], [278, -9], [281, 0], [286, 0], [288, -14], [292, -6], [296, -4]], f), lean: key([[273, 0], [275, .035], [277, -.05], [282, 0]], f),
      headTilt: key([[270, .02], [274, .06], [277, -.05], [282, 0], [287, 0], [289, -.05], [296, 0]], f), _f: f };
  }
  function draw5(g, p) {
    drawAdmiral(g, p); capOver(g, p); const f = p._f, h = [p.armR.h[0], p.armR.h[1] + AOFF];
    if (f >= 276 && f < 292 && st5.page) {   // the 1916 page in his fist: pulled down with the hand, turning, then crumpled
      const [tl, tr, , bl] = st5.page, G0 = st5.grab0, th = key([[276, 0], [279, -.55], [283, -.35]], f), cr = ease((f - 284) / 6), k = 1 - .86 * cr;
      g.save(); g.translate(h[0], h[1]); g.rotate(th); g.scale(k, k); g.translate(-G0[0], -G0[1]);
      if (cr < .98) { g.save(); g.transform((tr[0] - tl[0]) / 560, (tr[1] - tl[1]) / 560, (bl[0] - tl[0]) / 770, (bl[1] - tl[1]) / 770, tl[0], tl[1]);
        if (cr > 0) { g.translate(280, 385); g.rotate(cr * .9); g.scale(1 - .25 * cr, 1 - .1 * cr); g.translate(-280, -385); } pageArt(g); g.restore(); }
      g.restore();
      if (cr > .3) wad(g, h[0] + 6, h[1] - 8, 12 + 26 * cr, f * .1);
      disc(g, h[0], h[1], 12.5, INK);   // the fist over the page
    }
    if (f >= 292 && f < 302) {   // the crumpled page drops
      const t = f - 292, x = 150 + 14 * t, y = -340 + 6 * t + 9 * t * t; wad(g, x, y, 38, .5 * t);
    }
  }
  const ADM5 = card('admC5', draw5, BOX5, pose5); CARDS.push(ADM5);
  // the step stool he stands on (he's short; the calendar hangs high)
  const stool = new THREE.Group(); const wood = toon({ color: 0x8a5634 });
  put(stool, new THREE.BoxGeometry(.62, .06, .42), wood, { pos: [0, .52, 0], outline: 2 });
  for (const [x, z] of [[-.25, -.15], [.25, -.15], [-.25, .15], [.25, .15]]) put(stool, new THREE.BoxGeometry(.06, .49, .06), wood, { pos: [x, .245, z], outline: 1.6 });
  for (const y of [.18, .36]) put(stool, new THREE.BoxGeometry(.56, .04, .05), wood, { pos: [0, y, .16], outline: 1.4 });
  OF.group.add(stool); stool.visible = false; CARDS.push({ root: stool, blob: { visible: false }, paint() {} });   // hide() hides it with the cards
  const STOOL = [3.75, 0, -.55], SH = .55;
  function stage5(f) {
    stool.visible = true; stool.position.set(...STOOL); stool.rotation.y = .12; OF.group.updateMatrixWorld(true);
    ADM5.at(O([STOOL[0], SH, STOOL[2]]), 1, false, 0);
    // the 1916 page: pulled out at the bottom as he grips it (274–276), torn off at 276 (one frame before "1917")
    OF.cal.setFlip(f < 276 ? .055 * ease((f - 273.5) / 2.5) : 1);
    if (st5.f !== Math.round(f)) { st5.f = Math.round(f);
      const c = [[3.28, 2.54], [2.72, 2.54], [2.72, 1.77], [3.28, 1.77]].map(([x, y]) => toCard(ADM5, O([x, y, -.172])));   // screen TL, TR, BR, BL of the page at rest
      st5.page = c; st5.grab = toCard(ADM5, O([3.21, 1.83, -.19])); st5.grab0 = st5.grab; }
  }

  // ================= shot 6: the map table, an oblique view from shot 5's camera spot =================
  const P5 = O(CAM5.slice(0, 3)), L5 = O(CAM5.slice(3, 6));
  const hd = new THREE.Vector3(L5.x - P5.x, 0, L5.z - P5.z).normalize();            // shot 5's heading: shot 6 keeps it (pure pitch)
  const ea = new THREE.Vector3(-hd.z, 0, hd.x);                                         // table-local +z (east): screen-right
  const PITCH = 33 * Math.PI / 180, LOOK = [-.78, -1.3];                               // the look point on the map (table-local x north, z east)
  const top = OF.table.top, TY = Math.atan2(hd.x, hd.z) - Math.PI / 2;
  const tgt = P5.clone().addScaledVector(hd, (P5.y - OF.group.position.y - top) / Math.tan(PITCH));
  let TC = null;   // table centre in O-local coordinates
  function placeTable() { const g = OF.table.group; g.rotation.y = TY;
    if (!TC) { const w = new THREE.Vector3(tgt.x, 0, tgt.z).addScaledVector(hd, -LOOK[0]).addScaledVector(ea, -LOOK[1]); TC = OF.group.worldToLocal(w); TC.y = 0; }
    g.position.copy(TC); g.updateMatrixWorld(true); }
  const T = v => OF.table.group.localToWorld(new THREE.Vector3(...v));
  const SUB = 6, SUBP = [-.85, -1.0];   // the iris's sub token (index 6), moved next to the raked ones by the west edge, so he and it share the frame
  // pulls: token i dragged west to the edge (z −1.47), then it tips off and falls; each tips on its word (week 320, down 359)
  const PULL = [{ i: 0, a: 313, b: 318 }, { i: 1, a: 349, b: 356 }];
  const TOKS = 1.7;   // tokens drawn 1.7x so a falling one reads; hide() puts them back (a pseudo-card whose root.visible setter resets them)
  CARDS.push({ root: { get visible() { return false; }, set visible(v) { for (const t of OF.tokens) { t.scale.setScalar(1); t.position.copy(t.userData.p0); } } }, blob: { visible: false }, paint() {} });
  function tokens(f) { const out = {};
    for (const t of OF.tokens) { t.position.copy(t.userData.p0); t.rotation.set(0, t.userData.r0, 0); t.visible = true; t.scale.setScalar(TOKS); }
    OF.tokens[SUB].position.x = SUBP[0]; OF.tokens[SUB].position.z = SUBP[1];
    for (const p of PULL) { const tk = OF.tokens[p.i], z0 = tk.userData.p0.z, u = ease((f - p.a) / (p.b - p.a)), z = z0 + (-1.47 - z0) * u;
      if (f >= p.a) tk.position.z = z;
      // at the edge it teeters (tips over the rim for 2 frames, bow up), then drops and tumbles to the floor
      if (f > p.b) { const w = Math.min(1, (f - p.b) / 2), v = Math.max(0, Math.min(1, (f - p.b - 2) / 7)); tk.position.z = -1.47 - .08 * w - .2 * v; tk.position.y = top - top * v * v;
        tk.rotation.set(-.55 * w - 1.7 * v, tk.userData.r0, 1.1 * v); } }
    return out; }
  const tokP = i => i === SUB ? new THREE.Vector3(SUBP[0], top + .002, SUBP[1]) : OF.tokens[i].userData.p0;
  // the rake blade (table-local x, y above the top, z): it sits just east of the token it pulls
  function bladeAt(f) {
    const t0 = tokP(0), t1 = tokP(1), s = tokP(SUB), d = .12;
    const zOf = (p, i) => { const tk = OF.tokens[i]; return Math.min(tk.userData.p0.z + (-1.47 - tk.userData.p0.z) * ease((f - p.a) / (p.b - p.a)), 99) + d; };
    if (f <= 318) return [t0.x, key([[300, .14], [309, .14], [312, .01]], f), zOf(PULL[0], 0)];
    if (f <= 346) { const u = ease((f - 323) / 21); return [lerp(t0.x, t1.x, u), key([[319, .01], [324, .16], [342, .16], [346, .01]], f), lerp(-1.47 + d, t1.z + d, u)]; }
    if (f <= 356) return [t1.x, .01, zOf(PULL[1], 1)];
    const u = ease((f - 361) / 10); return [lerp(t1.x, s.x - .02, u), key([[356, .01], [360, .15], [371, .2]], f), lerp(-1.47 + d, s.z - .22, u)];
  }
  const BOX6 = [-260, -1000, 900, 40];
  const st6 = { blade: [[0, 0], [0, 0], [0, 0]] };
  function pose6(who, f) {
    const lean = key([[300, .1], [312, .13], [317, .06], [320, .02], [327, .02], [345, .13], [352, .1], [357, .02], [364, .0], [372, .03]], f);
    const [B, B1, B2] = st6.blade;
    const A = rot([20, -330], lean);                                          // the chest, in card space
    const dir = [B[0] - A[0], B[1] - A[1]], L = Math.hypot(...dir) || 1, u = [dir[0] / L, dir[1] / L];
    const dR = Math.min(170, Math.max(55, L - 170)), HR = [A[0] + u[0] * dR, A[1] + u[1] * dR], HL = [HR[0] - u[0] * 95, HR[1] - u[1] * 95];
    const toBody = q => { const r = rot(q, -lean); return [r[0], r[1] - AOFF]; };   // card space → the drawing's rotated arm space
    const hr = toBody(HR), hl = toBody(HL), S = [48, -410];
    const fs = step([[0, 'half/line/flat'], [312, 'half/bite/angry'], [318, 'line/bite/angry'], [326, 'half/line/raised'], [335, 'ring/line/raised'], [345, 'half/bite/angry'], [356, 'line/bite/angry'], [364, 'half/line/raised'], [368, 'squint/line/angry']], f);
    const look = f < 335 ? [.85, .7] : f < 345 ? [.05, 0] : f < 368 ? [.85, .7] : [.8, .45];
    const F = face(fs, look, f >= 335 && f < 345 ? 2 : 13); F.eyes = blink(f, [303, 341, 366], F.eyes);
    return { kind: 'b', face: F, _lean: lean, _f: f, _HR: HR, _HL: HL, _B: [B, B1, B2],
      armR: { s: S, c: [(S[0] + hr[0]) / 2 + 20, (S[1] + hr[1]) / 2 + 45], h: hr }, armL: { s: [-S[0], -410], c: [(hl[0] - S[0]) / 2 - 10, (hl[1] - 410) / 2 + 55], h: hl },
      headY: key([[300, 0], [317, 0], [319, -12], [326, -3], [335, -6], [345, 0], [355, 0], [358, -16], [364, 4], [372, 6]], f),
      headTilt: key([[300, .03], [317, .03], [319, -.09], [326, -.02], [335, 0], [345, .04], [355, .04], [358, -.12], [364, .02], [372, .05]], f) };
  }
  function draw6(g, p) {
    const [B, B1, B2] = p._B, HR = p._HR, HL = p._HL, dx = B[0] - HL[0], dy = B[1] - HL[1], L = Math.hypot(dx, dy) || 1, end = [HL[0] - dx / L * 130, HL[1] - dy / L * 130];
    g.save(); g.rotate(p._lean); drawAdmiral(g, p); g.restore();
    // the rake: a long brass-capped stick and a blade lying across the map, then his fists over the stick
    line(g, [end, B], 17); line(g, [end, B], 9, '#b8834e'); line(g, [[end[0] + dy / L * 2, end[1] - dx / L * 2], [B[0] - dx / L * 20 + dy / L * 2, B[1] - dy / L * 20 - dx / L * 2]], 2.4, 'rgba(255,225,170,.7)');
    line(g, [B1, B2], 19); line(g, [B1, B2], 11, '#d8a640');
    for (const h of [HL, HR]) disc(g, h[0], h[1], 12.5, INK);
  }
  const ADM6 = card('admC6', draw6, BOX6, pose6); CARDS.push(ADM6);
  ADM6.m.material.depthFunc = THREE.AlwaysDepth; ADM6.m.renderOrder = 3;   // he stands beside the table, never behind it: the rake drawn on his card must not dip under the table top (depth still written, for the focus)
  const ADM6P = [-1.15, 0, -1.85];   // table-local: west of the edge, a little south of the tokens (so they lie behind his card)
  function stage6(f) {
    placeTable(); tokens(f);
    ADM6.at(T(ADM6P), 1, false, .5);
    // lean the card back toward the high camera, so his face isn't squashed
    const r = ADM6.root, el = Math.atan2(cam.position.y - (r.position.y + 1.3), Math.hypot(cam.position.x - r.position.x, cam.position.z - r.position.z));
    r.rotation.order = 'YXZ'; r.rotation.x = -.55 * el; r.updateMatrixWorld(true);
    const b = bladeAt(f), bl = .09;
    st6.blade = [toCard(ADM6, T([b[0], top + b[1], b[2]])), toCard(ADM6, T([b[0] - bl, top + b[1], b[2]])), toCard(ADM6, T([b[0] + bl, top + b[1], b[2]]))];
  }
  // shot 6 camera (world keys): the 315 key is shot 5's camera spot, pitched down. A slow drift in (315–352), then one push onto the sub
  // token that stays slow while the admiral is still in frame (to ~373) and lands the sub 80 px above centre at 384, as the iris needs
  // one Hermite curve through the keys (Catmull-Rom tangents, at rest at both ends): a slow drift down and in toward him and the tokens
  function herm(k, f) { const n = k.length; if (f <= k[0][0]) return k[0].slice(); if (f >= k[n - 1][0]) return k[n - 1].slice();
    const tan = (i, j) => (i === 0 || i === n - 1) ? 0 : (k[i + 1][j] - k[i - 1][j]) / (k[i + 1][0] - k[i - 1][0]);
    let i = 1; while (f > k[i][0]) i++; const a = k[i - 1], b = k[i], dt = b[0] - a[0], t = (f - a[0]) / dt, t2 = t * t, t3 = t2 * t;
    return a.map((v, j) => j === 0 ? f : (2 * t3 - 3 * t2 + 1) * v + (t3 - 2 * t2 + t) * dt * tan(i - 1, j) + (-2 * t3 + 3 * t2) * b[j] + (t3 - t2) * dt * tan(i, j)); }
  let K6 = null;
  function cam6(f) {
    placeTable();
    if (!K6) { const s = T(tokP(SUB).toArray()); s.y = top + OF.group.position.y + .02;
      const look = tgt.clone(); look.y = top + OF.group.position.y;
      const p352 = P5.clone().addScaledVector(hd, .5).addScaledVector(ea, -.3).add(new THREE.Vector3(0, -.3, 0)), l352 = look.clone().addScaledVector(ea, -.18);
      const p374 = s.clone().lerp(p352, .9), near = s.clone().lerp(p352, .2);
      K6 = [[315, ...P5.toArray(), ...look.toArray(), 44, 0, 0], [352, ...p352.toArray(), ...l352.toArray(), 42, 0, 0],
        [374, ...p374.toArray(), ...s.clone().lerp(l352, .75).addScaledVector(ea, -.12).toArray(), 41, 10, 0], [384, ...near.toArray(), ...s.toArray(), 26, 80, 0]]; }
    return herm(K6, f);
  }
  const up6 = () => [hd.x, 0, hd.z];
  return { st5, st6, stage5, stage6, cam6, up6, ADM5, ADM6, stool, headAt5: () => ADM5.root.position.clone().add(new THREE.Vector3(0, 1.3, 0)), headAt6: () => ADM6.root.localToWorld(new THREE.Vector3(0, 1.3, 0)) };   // the face centre on his tilted card
}
