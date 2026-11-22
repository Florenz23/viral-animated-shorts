// stretch-M.js — part 2, builder M (frames 990–1154; Ef 981–989 is part 1 and unchanged). Same conventions as world.js / cast.js / stretch-D.js.
// "The good news? He can see it perfectly. The bad news? He has no idea which way it's going. Wait, why does that matter?"
// The captain (his own card, so part 1's acting in stretch-D stays as it is), a young crewman with a "?", and two comic arrows in the scope.
// Nothing is added to the scene before the first M frame: refs() only keeps references; the cards and arrows are built on first use.
import * as THREE from 'three';
import { drawCaptain, CAPBOX, CAPG } from './stretch-D.js';
import { drawPerson, BOXB } from './stretch-B.js';
import { INK, shape } from './cast.js';
import { buildArrow } from './props.js';

export const READY = true;
const ss = t => (t = Math.min(1, Math.max(0, t)), t * t * (3 - 2 * t));
const lerp = (a, b, t) => a + (b - a) * t;
const keyed = (keys, f) => { if (f <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) { const [f0, a] = keys[i - 1], [f1, b] = keys[i]; return a + (b - a) * ss((f - f0) / (f1 - f0)); } return keys[keys.length - 1][1]; };
const step = (keys, f) => { let v = keys[0][1]; for (const [k, x] of keys) if (k <= f) v = x; return v; };

let R = null, CAPM = null, CREW = null, G = null, ARR = null, armed = false;
export function refs(r) { R = r; return 'M'; }   // called once while the shot table is built; stores references only
function build() {
  if (CAPM) return;
  CAPM = R.card('captainM', drawCaptain, CAPBOX, capPose); CREW = R.card('crewM', drawCrew, CREWBOX, crewPose); R.CARDS.push(CAPM, CREW);
  G = new THREE.Group(); ARR = [buildArrow(), buildArrow()]; for (const a of ARR) G.add(a); G.visible = false; R.S.add(G);
  const o = R.S.onBeforeRender; R.S.onBeforeRender = (...a) => { G.visible = armed; armed = false; o(...a); };   // the arrows show only in a render an M stage armed
}
export const cap = () => (build(), CAPM);

/* ---------- the captain, 990–1154 ----------
   990 he brightens ("good news", 987–994) and leans back into the eyepiece (994–1002); in the scope 1007–1037.
   1038 back on him at the cup, pleased; on "bad news" (1045) he comes off it and his face falls (wide eyes, a small "o", brows up in the middle).
   "He has no idea" (1063–1082): he looks from the eyepiece to us; his eyes dart left and right (1066–1075), and he presses back to the cup (1076–1083).
   After the scope (1115): his eyes dart left/right/left; on "Wait" (1120) the crewman leans in beside him; he turns to him (1126); on "matter?" (1144) to us. */
const MFACE = [[990, 'squint/smile/raised/0'], [1003, 'half/smile/smirk/0'], [1029, 'squint/smile/smirk/0'], [1045, 'ring/dot/worried/0'], [1063, 'half/line/worried/0'],
  [1076, 'squint/line/angry/0'], [1112, 'ring/line/worried/0'], [1126, 'half/line/raised/0'], [1144, 'half/bite/worried/0']];
const MBLINK = [999, 1058, 1071, 1131, 1149];
const AT = [[990, .45], [995, .45], [1004, 1], [1026, 1], [1033, .52], [1044, .52], [1051, .3], [1079, .3], [1089, 1], [1110, 1], [1117, .25]];   // 1 = the eye at the cup
const dart = (f, a, n, every) => { const k = Math.floor((f - a) / every); return k >= 0 && k < n ? (k % 2 ? 1 : -1) : 0; };
export function capPose(who, f) {
  let [eyes, mouth, brows, open] = step(MFACE, f).split('/'); for (const a of MBLINK) { const k = f - a; if (k >= 0 && k <= 3) eyes = k === 0 || k === 3 ? 'half' : 'line'; }
  const at = keyed(AT, f), d = dart(f, 1066, 3, 4) || dart(f, 1111, 3, 4);
  const look = at > .6 ? [-1, 0] : d ? [.9 * d, 0] : f >= 1144 ? [.15, .05] : f >= 1126 ? [.9, -.05] : f >= 1063 ? [.1, .05] : [-.7, .05];
  const face = { eyes, mouth, brows, open: +open || 0, look, fx: lerp(8, -24, at) + 6 * d };
  const br = Math.sin(f * .2), lift = f < 1003 ? 10 * Math.sin(Math.PI * ss((f - 989) / 12)) : 0;   // he perks up on "good news"
  const fall = f >= 1045 && f < 1075 ? ss((f - 1045) / 5) * (1 - .6 * ss((f - 1058) / 14)) : 0;   // and sags on "bad news"
  const turn = f >= 1126 && f < 1144 ? ss((f - 1126) / 5) : f >= 1144 ? 1 - ss((f - 1144) / 6) : 0;
  const headX = lerp(20, -50, at) + 6 * Math.sin((f - 815) * .1) * (1 - at) + 7 * d + 16 * turn, lean = lerp(.035, -.05, at) + .01 * br + .04 * fall - .015 * turn;
  const headTilt = lerp(.04, -.06, at) + .05 * fall - .08 * turn + .03 * d, headY = -3 * br - lift + 14 * fall;
  const hip = [-96, -265], gh = CAPG.grip;   // the near hand stays on the grip (as at the end of part 1)
  const armL = { s: [-54, -411], c: [-150, -330], h: [gh[0], gh[1]] };
  const armR = { s: [54, -411], c: [128, -337], h: [84, -271] };
  return { face, headX, headY, headTilt, lean, armL, armR };
}

/* ---------- the crewman (a young rating: red watch cap, striped jersey), 1116–1154 ----------
   On "Wait" (1120) he leans in from the right; head tilt and a "?" on "why" (1129); he scratches his cap on "does that" (1133–1143); no lip sync. */
export const CREWBOX = [BOXB.person[0], -1060, BOXB.person[2] + 80, BOXB.person[3]];
const S_L = [-56, -414], S_R = [56, -414];
export function crewPose(who, f) {
  const fc = f < 1129 ? 'half/line/raised/0' : 'ring/line/smirk/0', tilt = .2 * ss((f - 1127) / 6) + .03 * Math.sin((f - 1129) * .25) * ss((f - 1129) / 8);
  let eyes = fc.split('/')[0]; for (const a of [1124, 1146]) { const k = f - a; if (k >= 0 && k <= 3) eyes = k === 0 || k === 3 ? 'half' : 'line'; }
  const [, mouth, brows] = fc.split('/'), look = f < 1138 ? [-.85, 0] : [-.1, .05];
  const sc = ss((f - 1133) / 4) * (1 - ss((f - 1146) / 5)), k = Math.sin((f - 1133) * 1.3) * sc;   // scratching the cap
  const armR = { s: S_R, c: [lerp(110, 170, sc), lerp(-330, -540, sc)], h: [lerp(84, 92 + 10 * k, sc), lerp(-250, -640 + 8 * k, sc)] };
  const armL = { s: S_L, c: [-100, -330], h: [-84, -250] };
  const q = f < 1129 ? 0 : ss((f - 1129) / 3) * (1 + .25 * Math.exp(-(f - 1129) / 3) * Math.sin((f - 1129) * 1.4));
  return { kind: 'cap', face: { eyes, mouth, brows, open: 0, look, fx: -14 }, armL, armR, headTilt: -tilt, lean: -.07 * ss((f - 1118) / 6), headY: 0, q, qy: 3 * Math.sin(f * .3) };
}
function drawCrew(ctx, p) {
  drawPerson(ctx, p);
  if (p.q > .01) { ctx.save(); ctx.translate(-30, -775 + (p.qy || 0)); ctx.scale(p.q, p.q); ctx.rotate(-.12);
    ctx.font = '900 190px Montserrat, Arial Black, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = 22; ctx.strokeStyle = INK; ctx.strokeText('?', 0, 0); ctx.fillStyle = '#f2c230'; ctx.fillText('?', 0, 0); ctx.restore(); }
}

/* ---------- placing them in U ---------- */
export function stageU(f) {
  build(); const { SUB, UL, cam, U } = R;
  SUB.want = true; SUB.update(f); SUB.P.position.y = 0; SUB.fold(0);
  CAPM.at(UL([0, 0, 0]), 1, false, .5); CAPM.root.updateMatrixWorld(true);
  const c = CAPM.root.worldToLocal(cam.position.clone()), g = CAPM.root.worldToLocal(SUB.gripWorld()), t = c.z / (c.z - g.z);
  CAPG.grip = [(c.x + (g.x - c.x) * t) / U - 8, -(c.y + (g.y - c.y) * t) / U + 4];
  if (f >= 1116) { const x = lerp(1.35, CX, ss((f - 1118) / 7)) + .015 * Math.sin((f - 1125) * .2); CREW.at(UL([x, 0, CZ]), 1, false, .5); }
}
export let CX = .5, CZ = -.3;   // where the crewman ends up (U-local)
export function setCrew(x, z) { CX = x; CZ = z; }

/* ---------- the arrows in the scope, "which way it's going": over the ship, one above, one along the waterline; they flip on
   "which" (1094), "way" (1098) and "going" (1107): the top one left/right/left, the low one always the other way ---------- */
const FLIPS = [1094, 1098, 1107];
function heading(f, first) { let a = first, prev = first; for (const k of FLIPS) if (f >= k) { prev = a; a = a === 0 ? Math.PI : 0; } else break;
  const k0 = FLIPS.filter(k => f >= k).pop(); if (k0 == null) return first; const t = f - k0; return a + (prev - a) * Math.exp(-.6 * t) * Math.cos(.9 * t); }
export function arrows(f, at) {   // at(dx, dy): world position dx, dy metres from the ship's middle, in the scope's view plane
  build(); armed = true;
  const pop = ss((f - 1091) / 3) * (1 + .3 * Math.exp(-(f - 1091) / 3) * Math.sin((f - 1091) * 1.2));
  ARR.forEach((a, i) => { a.position.copy(at(0, i ? -3 : 22)); a.scale.set(26 * pop, 13 * pop, 1); a.material.rotation = heading(f, i ? Math.PI : 0); });   // they always disagree
}
