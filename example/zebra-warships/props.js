// props.js — props for the Zebra Warships. Same conventions as world.js (metres, Y up, toon + ink hulls).
import * as THREE from 'three';
import { toon, put, tex, rng, LINE, hullGeometry, buildShip } from './world.js';

const ss = t => (t = Math.min(1, Math.max(0, t)), t * t * (3 - 2 * t));

/* ---------- periscope: tube, head with a lens on +X, a foam collar and a V wake trailing to -X ---------- */
export function buildPeriscope() {
  const g = new THREE.Group(), m = toon({ color: 0x59696f }), d = toon({ color: 0x2c3138 }), foam = toon({ color: 0xeef3f6 });
  put(g, new THREE.CylinderGeometry(.12, .14, 3.4, 14), m, { pos: [0, .5, 0], outline: 2.2, edges: false });
  put(g, new THREE.CylinderGeometry(.15, .15, .12, 14), toon({ color: 0xb2503e }), { pos: [0, 1.5, 0], outline: 1.6, edges: false });
  put(g, new THREE.BoxGeometry(.42, .4, .32), m, { pos: [.06, 2.35, 0], outline: 2.2 });
  put(g, new THREE.CircleGeometry(.12, 16), d, { pos: [.275, 2.36, 0], rot: [0, Math.PI / 2, 0], outline: 0, edges: false });
  put(g, new THREE.CircleGeometry(.035, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }), { pos: [.28, 2.4, .04], rot: [0, Math.PI / 2, 0], outline: 0, edges: false, shadow: false });
  put(g, new THREE.TorusGeometry(.26, .09, 6, 18), foam, { pos: [0, .03, 0], rot: [Math.PI / 2, 0, 0], scale: [1.25, 1, .5], outline: 1.4, edges: false });
  // a spray feather on the leading side
  for (const [x, y, s] of [[.2, .18, .13], [.32, .12, .09], [.12, .3, .08]]) put(g, new THREE.SphereGeometry(s, 8, 6), foam, { pos: [x, y, 0], outline: 1.2, edges: false });
  const wt = tex(1024, 256, (c, W, H) => { const r = rng(21); c.clearRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) { const a = r(), x = W * (1 - a), sp = a * H * .42, side = r() < .5 ? -1 : 1, y = H / 2 + side * sp * (.85 + r() * .3), rad = (1 - a) * 9 + 3 + r() * 4;
      c.fillStyle = `rgba(240,246,248,${.95 - a * .5})`; c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill(); }
    for (let i = 0; i < 90; i++) { const a = r(), x = W * (1 - a); c.fillStyle = `rgba(230,240,245,${.8 - a * .6})`; c.beginPath(); c.ellipse(x, H / 2 + (r() - .5) * 16 * (1 + a * 3), 6 + r() * 10, 3 + r() * 3, 0, 0, 7); c.fill(); } });
  wt.wrapS = wt.wrapT = THREE.ClampToEdgeWrapping;
  const wake = new THREE.Mesh(new THREE.PlaneGeometry(18, 7), toon({ map: wt, transparent: true, alphaTest: .35, depthWrite: false }));
  wake.rotation.x = -Math.PI / 2; wake.position.set(-8.9, .1, 0); wake.receiveShadow = true; g.add(wake);
  return { group: g, wake };
}

/* ---------- a merchant ship: dark hull, white bridge house, one tall funnel with a red band, derricks ---------- */
export function buildCargo({ L = 50, B = 8 } = {}) {
  const g = new THREE.Group(), X = t => (t - .5) * L;
  const deck = t => 4.2 + 1.2 * ss((t - .86) / .04) + 1.0 * ss((.12 - t) / .04);
  const keel = t => -3 + .8 * ss((.08 - t) / .08) + .6 * ss((t - .92) / .08);
  const geo = hullGeometry(L, B, deck, keel);
  const ht = tex(1024, 256, (c, W, H) => { c.fillStyle = '#4c4f61'; c.fillRect(0, 0, W, H); const y0 = H * (1 - (0 + 2.6) / 9.6);
    c.fillStyle = '#9b3f34'; c.fillRect(0, y0 - 6, W, H); c.fillStyle = '#e9e3d4'; c.fillRect(0, H * (1 - (4.0 + 2.6) / 9.6), W, 6);
    const r = rng(4); for (let i = 0; i < 30; i++) { c.fillStyle = 'rgba(160,90,60,.35)'; c.fillRect(r() * W, H * .2, 3, 20 + r() * 40); } });
  put(g, geo.hull, toon({ map: ht }), { outline: 2, edgeAngle: 50 });
  put(g, geo.deck, toon({ color: 0x8a7462 }), { outline: 0, edges: false });
  const white = toon({ color: 0xe8e2d2 }), dk = toon({ color: 0x3b3744 });
  put(g, new THREE.BoxGeometry(7, 3.2, 6), white, { pos: [X(.5), deck(.5) + 1.6, 0], outline: 1.8 });
  put(g, new THREE.BoxGeometry(4.5, 1.6, 7), white, { pos: [X(.52), deck(.5) + 4, 0], outline: 1.8 });
  const ft = tex(128, 256, (c, W, H) => { c.fillStyle = '#2f2b36'; c.fillRect(0, 0, W, H); c.fillStyle = '#c9493c'; c.fillRect(0, H * .18, W, H * .2); c.fillStyle = '#efe8d8'; c.fillRect(0, H * .24, W, H * .08); });
  put(g, new THREE.CylinderGeometry(1.1, 1.2, 7, 20), toon({ map: ft }), { pos: [X(.44), deck(.44) + 3.2 + 3.5, 0], rot: [0, 0, .08], outline: 2, edges: false });
  for (const t of [.22, .78]) { const y = deck(t); put(g, new THREE.CylinderGeometry(.18, .24, 13, 8), dk, { pos: [X(t), y + 6.5, 0], outline: 1.6, edges: false });
    put(g, new THREE.CylinderGeometry(.1, .12, 9, 6), dk, { pos: [X(t) + (t < .5 ? 3.5 : -3.5), y + 3.5, 0], rot: [0, 0, t < .5 ? -1.0 : 1.0], outline: 1.4, edges: false });
    put(g, new THREE.BoxGeometry(5, 1, 4.6), toon({ color: 0x6c7a5c }), { pos: [X(t) + (t < .5 ? 3.6 : -3.6), y + .5, 0], outline: 1.6 }); }
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(X(1), deck(1), 0), new THREE.Vector3(X(.78), deck(.78) + 13, 0), new THREE.Vector3(X(.78), deck(.78) + 13, 0), new THREE.Vector3(X(.22), deck(.22) + 13, 0), new THREE.Vector3(X(.22), deck(.22) + 13, 0), new THREE.Vector3(X(0), deck(0) + 1, 0)]), LINE));
  return { group: g, L };
}

/* ---------- splash ring and bubbles (a sinking ship) ---------- */
export function buildSplash() {
  const g = new THREE.Group(), foam = toon({ color: 0xeef3f6 }), parts = [];
  const r = rng(13); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, m = put(g, new THREE.SphereGeometry(.6 + r() * .6, 8, 6), foam, { pos: [Math.cos(a) * 6, 0, Math.sin(a) * 3], outline: 1.6, edges: false }); m.userData.a = a; m.userData.k = .7 + r() * .6; parts.push(m); }
  return { group: g, set(t) { g.visible = t > 0 && t < 1; for (const m of parts) { const k = m.userData.k, h = Math.sin(Math.min(1, t) * Math.PI) * 3 * k; m.position.y = h; m.scale.setScalar(.4 + t * k); m.position.x = Math.cos(m.userData.a) * (4 + t * 6); m.position.z = Math.sin(m.userData.a) * (2 + t * 3); } } };
}

/* ---------- rope ladder over a ship's side ---------- */
export function buildLadder(len = 4.5) {
  const g = new THREE.Group(), rope = toon({ color: 0xd8c08a }), wood = toon({ color: 0xb98a58 });
  for (const x of [-.24, .24]) put(g, new THREE.CylinderGeometry(.03, .03, len, 6), rope, { pos: [x, -len / 2, 0], outline: 1.2, edges: false });
  for (let y = -.35; y > -len; y -= .35) put(g, new THREE.BoxGeometry(.56, .05, .07), wood, { pos: [0, y, 0], outline: 1.2, edges: false });
  return g;
}

/* ---------- the wall calendar: a board, the 1917 page, and the 1916 page on a hinge at the top ---------- */
function pageTex(year, month, days, crossed) {
  return tex(512, 704, (c, W, H) => {
    c.fillStyle = '#f3ead2'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#c4433a'; c.fillRect(0, 0, W, 96); c.fillStyle = '#f7efdc'; c.font = 'bold 44px Georgia, serif'; c.textAlign = 'center'; c.fillText('ADMIRALTY', W / 2, 66);
    c.fillStyle = '#2a1a26'; c.font = 'bold 190px Georgia, serif'; c.fillText(year, W / 2, 300);
    c.fillStyle = '#c4433a'; c.font = 'bold 50px Georgia, serif'; c.fillText(month, W / 2, 372);
    c.strokeStyle = 'rgba(42,26,38,.35)'; c.lineWidth = 2; c.font = '26px Georgia, serif'; c.fillStyle = '#2a1a26';
    for (let i = 0; i < 35; i++) { const x = 40 + (i % 7) * 62, y = 410 + Math.floor(i / 7) * 56; c.strokeRect(x, y, 56, 50); const d = i - days[0] + 1; if (d >= 1 && d <= days[1]) { c.fillText(String(d), x + 28, y + 34);
      if (crossed && d <= crossed) { c.strokeStyle = '#c4433a'; c.lineWidth = 4; c.beginPath(); c.moveTo(x + 8, y + 8); c.lineTo(x + 48, y + 42); c.moveTo(x + 48, y + 8); c.lineTo(x + 8, y + 42); c.stroke(); c.strokeStyle = 'rgba(42,26,38,.35)'; c.lineWidth = 2; } } }
    c.strokeStyle = '#2a1a26'; c.lineWidth = 10; c.strokeRect(5, 5, W - 10, H - 10);
  });
}
export function buildCalendar() {   // faces +Z; pages 0.56 x 0.77 m
  const g = new THREE.Group(), W = .56, H = .77;
  put(g, new THREE.BoxGeometry(.66, .94, .03), toon({ color: 0x8a5a3a }), { pos: [0, -.47, -.02], outline: 2 });
  put(g, new THREE.CylinderGeometry(.02, .02, .5, 8), toon({ color: 0xc9a24a }), { pos: [0, -.035, .02], rot: [0, 0, Math.PI / 2], outline: 1.4, edges: false });
  put(g, new THREE.CylinderGeometry(.012, .012, .3, 6), toon({ color: 0x3b3744 }), { pos: [0, .12, -.02], rot: [0, 0, 0], outline: 1, edges: false });
  const under = put(g, new THREE.PlaneGeometry(W, H), toon({ map: pageTex('1917', 'JANUARY', [2, 31], 0) }), { pos: [0, -.06 - H / 2, .005], outline: 0 });
  const hinge = new THREE.Group(); hinge.position.set(0, -.06, .012); g.add(hinge);
  const front = put(hinge, new THREE.PlaneGeometry(W, H), toon({ map: pageTex('1916', 'DECEMBER', [5, 31], 31) }), { pos: [0, -H / 2, 0], outline: 0 });
  const back = put(hinge, new THREE.PlaneGeometry(W, H), toon({ color: 0xe6dcc2 }), { pos: [0, -H / 2, -.002], rot: [0, Math.PI, 0], outline: 0 });
  return { group: g, under, setFlip(t) { hinge.rotation.x = -Math.PI * .97 * t; hinge.visible = t < 1; } };   // t 0 = 1916 down, 1 = flipped over the top
}

/* ---------- the map table: an Admiralty plot of the Western Approaches, drawn north-up for a camera whose screen-up is +X ---------- */
function mapTex() {
  return tex(2048, 1024, (c) => {
    c.setTransform(0, 1, -1, 0, 2048, 0);   // draw in screen space: x 0..1024 left→right, y 0..2048 top→bottom
    const r = rng(17);
    c.fillStyle = '#c9d3b6'; c.fillRect(0, 0, 1024, 2048);   // warm chart paper
    c.strokeStyle = 'rgba(40,70,90,.18)'; c.lineWidth = 2; for (let x = 0; x <= 1024; x += 128) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 2048); c.stroke(); } for (let y = 0; y <= 2048; y += 128) { c.beginPath(); c.moveTo(0, y); c.lineTo(1024, y); c.stroke(); }
    const blob = (pts, fill) => { c.beginPath(); c.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; c.quadraticCurveTo(a[0] + (r() - .5) * 30, a[1] + (r() - .5) * 30, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); } c.closePath();
      c.save(); c.strokeStyle = 'rgba(60,110,130,.35)'; c.lineWidth = 26; c.stroke(); c.lineWidth = 12; c.strokeStyle = 'rgba(240,250,245,.5)'; c.stroke(); c.restore(); c.fillStyle = fill; c.fill(); c.lineWidth = 5; c.strokeStyle = '#2a1a26'; c.stroke(); };
    blob([[690, 520], [760, 470], [800, 560], [770, 660], [860, 760], [900, 900], [880, 1010], [960, 1110], [990, 1240], [900, 1290], [780, 1300], [700, 1270], [760, 1190], [730, 1090], [690, 1000], [720, 900], [660, 820], [700, 720], [650, 620]], '#e3d39c');   // the big island
    blob([[470, 840], [560, 800], [610, 880], [600, 1000], [540, 1060], [460, 1040], [430, 950]], '#cfdc9a');  // the green island
    blob([[760, 1500], [860, 1470], [1024, 1460], [1060, 1800], [900, 1760], [820, 1640], [700, 1600]], '#e6c39a');   // the continent
    blob([[900, 0], [1060, -40], [1060, 300], [960, 260], [920, 160]], '#d9cfa8');
    c.fillStyle = 'rgba(42,26,38,.65)'; c.font = 'italic bold 54px Georgia, serif'; c.textAlign = 'center';
    c.fillText('A T L A N T I C', 300, 700);   // horizontal from the top-down camera (screen up = +X)
    c.font = 'italic 34px Georgia, serif'; c.fillText('Western Approaches', 300, 1330); c.fillText('North Sea', 960, 420);
    // compass rose
    c.save(); c.translate(160, 1760); c.fillStyle = '#c4433a'; c.strokeStyle = '#2a1a26'; c.lineWidth = 4;
    for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(0, -110); c.lineTo(22, 0); c.lineTo(-22, 0); c.closePath(); c.fillStyle = i % 2 ? '#f3ead2' : '#c4433a'; c.fill(); c.stroke(); }
    c.beginPath(); c.arc(0, 0, 60, 0, 7); c.stroke(); c.restore(); c.fillStyle = '#2a1a26'; c.font = 'bold 40px Georgia, serif'; c.fillText('N', 160, 1630);
    // convoy routes: dashed lines
    c.setLineDash([22, 16]); c.strokeStyle = 'rgba(196,67,58,.7)'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 1500); c.quadraticCurveTo(400, 1350, 640, 1240); c.stroke(); c.beginPath(); c.moveTo(0, 1100); c.quadraticCurveTo(300, 1000, 450, 1050); c.stroke(); c.setLineDash([]);
    c.strokeStyle = '#6b4a34'; c.lineWidth = 14; c.strokeRect(7, 7, 1010, 2034);
  });
}
// the token: a small grey ship on a wooden base (x = bow)
export function buildToken(kind = 'ship') {
  const g = new THREE.Group();
  if (kind === 'ship') { const s = new THREE.Shape(); s.moveTo(-.08, -.03); s.lineTo(.06, -.03); s.lineTo(.1, 0); s.lineTo(.06, .03); s.lineTo(-.08, .03); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: .03, bevelEnabled: false }); geo.rotateX(-Math.PI / 2);
    put(g, geo, toon({ color: 0x9aa1b0 }), { outline: 2, edgeAngle: 30 });
    put(g, new THREE.BoxGeometry(.05, .025, .03), toon({ color: 0xb3b8c4 }), { pos: [-.005, .042, 0], outline: 1.6 });
    put(g, new THREE.CylinderGeometry(.008, .008, .03, 8), toon({ color: 0x3b3744 }), { pos: [-.025, .065, 0], outline: 1.2, edges: false }); }
  else { put(g, new THREE.CapsuleGeometry(.018, .08, 4, 8), toon({ color: 0x2f2b36 }), { pos: [0, .02, 0], rot: [0, 0, Math.PI / 2], outline: 1.6, edges: false });
    put(g, new THREE.BoxGeometry(.02, .025, .012), toon({ color: 0x2f2b36 }), { pos: [0, .045, 0], outline: 1.2 }); }
  return g;
}
export function buildMapTable() {   // table top surface at y = 0.92, long side along X; map 4.6 (X) x 2.3 (Z)
  const g = new THREE.Group(), wood = toon({ color: 0x7a4b30 }), top = .92;
  put(g, new THREE.BoxGeometry(5.0, .1, 2.7), wood, { pos: [0, top - .05, 0], outline: 2 });
  for (const [x, z] of [[-2.3, -1.2], [2.3, -1.2], [-2.3, 1.2], [2.3, 1.2]]) put(g, new THREE.BoxGeometry(.14, top - .1, .14), wood, { pos: [x, (top - .1) / 2, z], outline: 1.8 });
  put(g, new THREE.PlaneGeometry(4.6, 2.3), toon({ map: mapTex() }), { pos: [0, top + .002, 0], rot: [-Math.PI / 2, 0, 0], outline: 0, edges: false });
  // brass dividers and a ruler, warm accents
  put(g, new THREE.BoxGeometry(.7, .012, .06), toon({ color: 0xd8a640 }), { pos: [1.2, top + .01, -.75], rot: [0, .4, 0], outline: 1.6 });
  return { group: g, top, wood };
}

/* ---------- the office door (shot 7): a frame and a panelled door hinged at its -z edge; it opens into the room (+x→-x).
   Built facing -X (into the room from the x = +8 wall). The dark opening behind it is the corridor. ---------- */
export function buildDoor() {
  const g = new THREE.Group(), white = toon({ color: 0xece4d2 });
  const panel = tex(256, 512, (c, W, H) => { c.fillStyle = '#b07450'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(40,20,15,.55)'; c.lineWidth = 10;
    c.strokeRect(34, 40, W - 68, 190); c.strokeRect(34, 280, W - 68, 190); c.fillStyle = 'rgba(255,220,170,.22)'; c.fillRect(0, 0, 14, H);
    c.fillStyle = '#f4ecd8'; c.fillRect(60, 110, W - 120, 46); c.fillStyle = '#2a1a26'; c.font = 'bold 30px Georgia, serif'; c.textAlign = 'center'; c.fillText('ADMIRALTY', W / 2, 144); });
  const W = 1.3, H = 2.7;
  // the opening: a bright, warm corridor (the painter comes in backlit, so his outline reads against it)
  const cor = tex(128, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e8cfa6'); gr.addColorStop(.75, '#f6e2bc'); gr.addColorStop(.76, '#c99a6e'); gr.addColorStop(1, '#b08058'); c.fillStyle = gr; c.fillRect(0, 0, w, h); }); cor.colorSpace = THREE.SRGBColorSpace;
  const op = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: cor })); op.position.set(.02, H / 2, 0); op.rotation.y = -Math.PI / 2; g.add(op);
  for (const [w, h, z, y] of [[.14, H + .14, -W / 2 - .07, H / 2], [.14, H + .14, W / 2 + .07, H / 2], [W + .28, .14, 0, H + .07]]) put(g, new THREE.BoxGeometry(.12, h, w), white, { pos: [-.04, y, z], outline: 1.6 });
  const hinge = new THREE.Group(); hinge.position.set(-.03, 0, -W / 2); g.add(hinge);
  const door = put(hinge, new THREE.BoxGeometry(.06, H - .02, W - .02), toon({ map: panel }), { pos: [0, H / 2, W / 2], outline: 1.8 }); door.receiveShadow = false;   // the painter passes it: his shadow would sit right on his outline
  door.material.map.center.set(.5, .5);
  put(hinge, new THREE.SphereGeometry(.05, 10, 8), toon({ color: 0xd8a640 }), { pos: [-.07, 1.05, W - .14], outline: 1.2, edges: false });
  return { group: g, setOpen(t) { hinge.rotation.y = -1.75 * t; } };
}

/* ---------- a small tea table (shot 8): round top at 0.98 m, cup and saucer, a teapot ---------- */
export function buildTeaTable() {
  const g = new THREE.Group(), wood = toon({ color: 0x7a4b30 }), china = toon({ color: 0xf1ede4 }), top = .98;   // a tall stand: the cup sits above the caption band
  put(g, new THREE.CylinderGeometry(.42, .42, .05, 28), wood, { pos: [0, top - .025, 0], outline: 2, edges: false });
  put(g, new THREE.CylinderGeometry(.04, .06, top - .05, 10), wood, { pos: [0, (top - .05) / 2, 0], outline: 1.6, edges: false });
  put(g, new THREE.CylinderGeometry(.22, .25, .03, 14), wood, { pos: [0, .015, 0], outline: 1.6, edges: false });
  const cup = new THREE.Group(); cup.position.set(.08, top, .12); g.add(cup);
  put(cup, new THREE.CylinderGeometry(.11, .08, .02, 20), china, { pos: [0, .01, 0], outline: 1.6, edges: false });   // saucer
  put(cup, new THREE.CylinderGeometry(.065, .045, .08, 20, 1, true), toon({ color: 0xf1ede4, side: THREE.DoubleSide }), { pos: [0, .06, 0], outline: 1.8, edges: false });
  put(cup, new THREE.TorusGeometry(.025, .008, 6, 12, Math.PI), china, { pos: [.07, .065, 0], rot: [0, 0, -Math.PI / 2], outline: 1.2, edges: false });
  put(cup, new THREE.CircleGeometry(.06, 20), toon({ color: 0x8a5a30 }), { pos: [0, .09, 0], rot: [-Math.PI / 2, 0, 0], outline: 0, edges: false });   // tea
  const pot = new THREE.Group(); pot.position.set(-.26, top, -.16); g.add(pot);
  put(pot, new THREE.SphereGeometry(.12, 16, 12), toon({ color: 0x3f7a8a }), { pos: [0, .11, 0], scale: [1, .85, 1], outline: 2, edges: false });
  put(pot, new THREE.CylinderGeometry(.015, .025, .14, 8), toon({ color: 0x3f7a8a }), { pos: [.14, .14, 0], rot: [0, 0, -.9], outline: 1.4, edges: false });
  // the monocle (3D, for the fall) and a splash: drops and a ring on the tea
  const mono = new THREE.Group(); g.add(mono); mono.visible = false;
  put(mono, new THREE.TorusGeometry(.03, .005, 6, 20), toon({ color: 0xe8b84a, emissive: 0x403010 }), { outline: 1.4, edges: false });
  const drops = []; for (let i = 0; i < 7; i++) { const d = put(g, new THREE.SphereGeometry(.02, 8, 6), toon({ color: 0x9a6a3a }), { outline: 1, edges: false }); d.visible = false; d.userData.a = i / 7 * Math.PI * 2; drops.push(d); }
  const ring = put(g, new THREE.TorusGeometry(1, .08, 4, 24), toon({ color: 0xd8b890 }), { rot: [Math.PI / 2, 0, 0], outline: 0, edges: false }); ring.visible = false;
  return { group: g, cupTop: new THREE.Vector3(.08, top + .09, .12), mono, setSplash(t) {
    const on = t > 0 && t < 1; ring.visible = on; drops.forEach(d => d.visible = on);
    if (!on) return; ring.position.set(.08, top + .092, .12); ring.scale.setScalar(.02 + .07 * t);
    drops.forEach((d, i) => { const a = d.userData.a, h = .09 * Math.sin(Math.PI * Math.min(1, t * 1.3)) * (1 + (i % 3) * .3); d.position.set(.08 + Math.cos(a) * .09 * t, top + .1 + h, .12 + Math.sin(a) * .09 * t); }); } };
}

/* ---------- the painter's model boat: a small dazzled warship on a wooden stand; and the heading arrow above it ---------- */
export function buildModelBoat() {
  const g = new THREE.Group(), s = buildShip({ dazzle: true, L: 40, variant: 1, seed: 9 });
  s.group.scale.setScalar(.022); s.group.position.y = 2.3 * .022 + .05; g.add(s.group);
  const wood = toon({ color: 0xc89a62 });
  put(g, new THREE.BoxGeometry(.5, .03, .12), wood, { pos: [0, .015, 0], outline: 1.6 });
  for (const x of [-.18, .18]) put(g, new THREE.BoxGeometry(.03, .06, .08), wood, { pos: [x, .05, 0], outline: 1.2 });
  return { group: g, ship: s, len: .88 };
}
export function buildArrow() {   // a flat comic arrow on a camera-facing sprite; sprite rotation = its heading on screen
  const t = tex(256, 128, (c, W, H) => { c.lineJoin = 'round'; c.beginPath(); c.moveTo(20, 46); c.lineTo(160, 46); c.lineTo(160, 16); c.lineTo(236, 64); c.lineTo(160, 112); c.lineTo(160, 82); c.lineTo(20, 82); c.closePath();
    c.fillStyle = '#f2c230'; c.fill(); c.lineWidth = 10; c.strokeStyle = '#1c1118'; c.stroke(); });
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, fog: false, depthTest: false })); m.scale.set(.3, .15, 1); m.renderOrder = 20; return m;
}
