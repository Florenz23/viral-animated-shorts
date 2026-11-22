// fleet.js — places D (dry dock) and the F dressing of H (the harbour a year later), the instanced fleets, the paint factory.
// Same conventions as world.js: metres, Y up, ships along +X with the bow at +X, starboard +Z.
import * as THREE from 'three';
import { toon, put, tex, rng, crane, makeWater, buildShip, hullGeometry, INK, INK_SCALE,
  greyHullTex, dazzleHullTex, dazzleBlockTex, greyTex, dazzleFunnelTex, greyFunnelTex, hullGeo } from './world.js';

const ss = t => (t = Math.min(1, Math.max(0, t)), t * t * (3 - 2 * t));

// the ink hull for instanced meshes: the same screen-space outline as world.js outlineMat, with instanceMatrix applied
const OUTI = new Map();
function outlineInst(px) {
  if (!OUTI.has(px)) {
    const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uPx: { value: px }, uColor: { value: new THREE.Color(INK) }, uRes: { value: new THREE.Vector2(720, 1280) } }]);
    u.uScale = INK_SCALE;
    OUTI.set(px, new THREE.ShaderMaterial({ uniforms: u, fog: true, side: THREE.BackSide,
      vertexShader: `uniform float uPx, uScale; uniform vec2 uRes;
        #include <fog_pars_vertex>
        void main(){ mat4 im = mat4(1.0);
          #ifdef USE_INSTANCING
          im = instanceMatrix;
          #endif
          vec4 mvPosition = modelViewMatrix*im*vec4(position,1.0); vec4 c = projectionMatrix*mvPosition;
          vec3 n = normalize(normalMatrix*mat3(im)*normal); vec4 cn = projectionMatrix*vec4(n,0.0);
          vec2 d = cn.xy; float l = length(d); d = l>1e-5 ? d/l : vec2(0.0);
          c.xy += d*uPx*uScale*2.0/uRes*c.w; gl_Position = c;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform vec3 uColor;
        #include <fog_pars_fragment>
        void main(){ gl_FragColor = vec4(uColor,1.0);
          #ifdef USE_FOG
          float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor * .62);
          #endif
        }` }));
  }
  return OUTI.get(px);
}

const M4 = (pos, scl = [1, 1, 1], rot = [0, 0, 0]) => new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...scl));
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

// A fleet of simplified warships (hull, deck, blocks, turrets, funnels, mast) as instanced meshes.
// spots: [{ x, y, z, ry, v }] (v = dazzle variant 0..2). Each ship is grey or dazzled, with a pop scale.
export function buildFleet(spots, { L = 40, B = 6.6, ink = 1, mast: mastCol = 0x8f96a6 } = {}) {   // ink: outline width multiplier; mast: the mast colour (the F fleet uses both)
  const g = new THREE.Group(), n = spots.length;
  const deck = t => 4.0 + 1.3 * ss((t - .62) / .03) + .7 * Math.pow(t, 5) + .25 * ss((.1 - t) / .1);
  const keel = t => -2.3 + 1.0 * ss((.12 - t) / .12) + .7 * ss((t - .9) / .1);
  const hg = hullGeometry(L, B, deck, keel), X = t => (t - .5) * L, dk = deck;
  const box = new THREE.BoxGeometry(1, 1, 1), fun = new THREE.CylinderGeometry(.82, .9, 1, 16, 1, true), pole = new THREE.CylinderGeometry(.18, .22, 1, 8);
  const blocks = [[.6, 3.4, 2.4, 4.6, 0], [.6, 2.4, 1.5, 6.0, 2.4], [.37, 11, 2.0, 3.8, 0], [.13, 4.0, 1.6, 3.4, 0], [.76, 2.6, 1.1, 2.3, .45], [.045, 2.6, 1.1, 2.3, .45]]
    .map(([t, w, h, d, y0]) => M4([X(t), dk(t) + y0 + h / 2, 0], [w, h, d]));
  const funnels = [.47, .385, .30].map((t, i) => { const h = 5.6 - i * .3; return M4([X(t) - .3, dk(t) + 2 + h / 2, 0], [1.2, h, .85], [0, 0, .1]); });
  const mast = [M4([X(.545), dk(.545) + 6.25, 0], [1, 12.5, 1])];
  const fm = toon({ map: greyFunnelTex(), side: THREE.DoubleSide });
  const P = [
    { geo: hg.hull, local: [new THREE.Matrix4()], grey: toon({ map: greyHullTex() }), dz: [0, 1, 2].map(v => toon({ map: dazzleHullTex(v) })), px: 2.2, ink: hullGeo(hg.hull) },
    { geo: hg.deck, local: [new THREE.Matrix4()], grey: toon({ color: 0xa88a6c }), dz: null, px: 0 },
    { geo: box, local: blocks, grey: toon({ map: greyTex('#a3a9b6', 1) }), dz: [11, 23, 37].map(s => toon({ map: dazzleBlockTex(s) })), px: 1.8, ink: hullGeo(box) },
    { geo: fun, local: funnels, grey: fm, dz: [1, 2, 3].map(s => toon({ map: dazzleFunnelTex(s), side: THREE.DoubleSide })), px: 2, ink: hullGeo(fun) },
    { geo: pole, local: mast, grey: toon({ color: mastCol }), dz: null, px: 1.4, ink: hullGeo(pole) },
  ];
  for (const p of P) { const k = p.local.length * n;
    const mk = mat => { const m = new THREE.InstancedMesh(p.geo, mat, k); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; g.add(m); return m; };
    p.gm = mk(p.grey); p.dm = p.dz ? p.dz.map(mk) : null;
    if (p.px) { p.om = new THREE.InstancedMesh(p.ink, outlineInst(p.px * ink), k); p.om.frustumCulled = false; p.om.renderOrder = -1; g.add(p.om); } }
  const st = spots.map(s => ({ ...s, y: s.y ?? 0, v: s.v ?? 0, dz: false, s: 1, dy: 0 }));
  const S = new THREE.Matrix4(), T = new THREE.Matrix4();
  function commit() {
    st.forEach((s, i) => { S.compose(new THREE.Vector3(s.x, s.y + s.dy, s.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s.ry || 0, 0)), new THREE.Vector3(s.s, s.s, s.s));
      for (const p of P) p.local.forEach((l, j) => { const k = i * p.local.length + j; T.multiplyMatrices(S, l);
        if (p.dm) { p.gm.setMatrixAt(k, s.dz ? ZERO : T); p.dm.forEach((m, v) => m.setMatrixAt(k, s.dz && v === s.v ? T : ZERO)); } else p.gm.setMatrixAt(k, T);
        if (p.om) p.om.setMatrixAt(k, T); }); });
    for (const p of P) { p.gm.instanceMatrix.needsUpdate = true; if (p.dm) p.dm.forEach(m => m.instanceMatrix.needsUpdate = true); if (p.om) p.om.instanceMatrix.needsUpdate = true; }
  }
  commit();
  return { group: g, ships: st, commit };
}

// a pop: the hull switches to dazzle on frame pf and jumps 14 % bigger, settling over ~5 frames
export const popScale = (f, pf) => f < pf ? 1 : 1 + .14 * Math.exp(-(f - pf) * .7) * Math.cos((f - pf) * .9);

/* ---------------- D: the dry dock, bright day ---------------- */
// One dock complex on the water: a concrete apron (top y = 0) cut into long basins by raised piers (top y = 4), a head wall
// across the near end, the sea all round it. The ten sit in the middle basin (x = 0) on keel blocks; the hundreds fill the others.
export function buildDock() {
  const D = new THREE.Group(); D.name = 'D';
  const LX = 480, Z0 = -560, Z1 = 46;   // the land: x ±LX, z Z0..Z1
  // basin floor: cool wet concrete slabs (the shadow side of the picture), a drain line down each basin
  const floor = tex(512, 512, (c, W, H) => { const r = rng(21); c.fillStyle = '#9ca3ad'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(60,70,96,.22)'; for (let x = 0; x < W; x += 128) c.fillRect(x, 0, 3, H); for (let y = 0; y < H; y += 128) c.fillRect(0, y, W, 3);
    for (let i = 0; i < 120; i++) { c.fillStyle = `rgba(70,84,120,${.04 + r() * .07})`; c.fillRect(r() * W, r() * H, 6 + r() * 30, 3 + r() * 8); } }, [(2 * LX) / 13, (Z1 - Z0) / 13]);
  const land = put(D, new THREE.BoxGeometry(2 * LX, 8, Z1 - Z0), [toon({ color: 0x7d808e }), toon({ color: 0x7d808e }), toon({ map: floor }), toon({ color: 0x7d808e }), toon({ color: 0x7d808e }), toon({ color: 0x7d808e })], { pos: [0, -4, (Z0 + Z1) / 2], outline: 2.2, edges: false });
  land.castShadow = false;
  // the sea round the dock, below the quay edge
  const sea = makeWater('#3f6c96', .6); sea.mesh.position.y = -2.4; sea.mesh.scale.set(2.2, 1, 2.2); D.add(sea.mesh);
  // piers between the basins: stone walls, a warm lit top with a yellow safety line along each edge, bollards
  const top = tex(256, 512, (c, W, H) => { c.fillStyle = '#c4beb2'; c.fillRect(0, 0, W, H); c.fillStyle = '#e8b840'; c.fillRect(0, 0, 18, H); c.fillRect(W - 18, 0, 18, H); c.fillStyle = 'rgba(120,96,80,.25)'; for (let y = 0; y < H; y += 64) c.fillRect(18, y, W - 36, 3); }, [1, 30]);
  const wall = tex(512, 128, (c, W, H) => { c.fillStyle = '#868a9c'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(40,40,70,.28)'; for (let y = 0; y < H; y += 32) { c.fillRect(0, y, W, 3); for (let x = (y / 32 % 2) * 32; x < W; x += 64) c.fillRect(x, y, 3, 32); } }, [40, 1]);
  const wm = toon({ map: wall }), tm = toon({ map: top }), bol = toon({ color: 0x2e2b3a });
  const PL = Z1 - 12 - Z0;
  for (let cx = -8; cx <= 7; cx++) { const x = cx * 58 + 29;
    put(D, new THREE.BoxGeometry(14, 4, PL), [wm, wm, tm, wm, wm, wm], { pos: [x, 2, Z0 + PL / 2], outline: 1.8, edges: false });
    for (let z = Z0 + 20; z < Z1 - 14; z += 40) for (const sx of [-5.6, 5.6]) put(D, new THREE.CylinderGeometry(.45, .55, .9, 10), bol, { pos: [x + sx, 4.45, z], outline: 1.2, edges: false }); }
  // the head wall across the near end of every basin, with the gate's dark seam
  put(D, new THREE.BoxGeometry(2 * LX, 4, 12), [wm, wm, tm, wm, wm, wm], { pos: [0, 2, Z1 - 6], outline: 1.8, edges: false });
  // the ten: real ships on keel blocks in a row, beam to beam (ship 0 nearest the camera)
  const blockM = toon({ color: 0x6f5040 }), ships = [];
  for (let i = 0; i < 10; i++) { const s = buildShip({ L: 40, seed: 60 + i, variant: i % 3 }); s.group.position.set(0, 2.6, -18 * i); D.add(s.group); ships.push(s);
    for (const x of [-12, -2, 9]) put(D, new THREE.BoxGeometry(1.4, .3, 3), blockM, { pos: [x, .15, -18 * i], outline: 1.2, edges: false }); }
  // scaffolding along ship 0's starboard side, paint buckets on the ground
  const pole = toon({ color: 0x3d63c9 }), plank = toon({ color: 0xe0883a });
  for (let x = -15; x <= 15; x += 6) put(D, new THREE.CylinderGeometry(.12, .12, 10, 6), pole, { pos: [x, 5, 5.2], outline: 1.2, edges: false });
  for (const y of [2.6, 5.6]) put(D, new THREE.BoxGeometry(31, .12, .9), plank, { pos: [0, y, 5.0], outline: 1.4 });
  const pail = toon({ color: 0xc9cfd8, side: THREE.DoubleSide }), r = rng(5);
  for (let i = 0; i < 9; i++) { const b = new THREE.Group(); b.position.set(-14 + i * 3.4 + r() * 1.2, 0, 7.5 + r() * 2.5); D.add(b);
    put(b, new THREE.CylinderGeometry(.45, .38, .8, 14, 1, true), pail, { pos: [0, .4, 0], outline: 1.6, edges: false });
    put(b, new THREE.CircleGeometry(.42, 14), toon({ color: i % 2 ? 0x24202c : 0xf0ece2 }), { pos: [0, .7, 0], rot: [-Math.PI / 2, 0, 0], outline: 0, edges: false }); }
  // cranes standing on the pier tops (feet on the concrete), jibs out over the basins
  for (const [x, z, col, ry] of [[29, -62, 0xc9653f, Math.PI * .92], [-29, -150, 0xd8a640, .1], [87, -250, 0xc9653f, Math.PI * 1.1], [-145, -60, 0xd8a640, -.15], [203, -120, 0xc9653f, Math.PI * .95]])
    crane(D, x, z, col, ry).position.y = 4;
  // hundreds: grey hulls waiting in every other basin, painted (popped) in waves outward from the ten
  const spots = [], rr = rng(77);
  for (let cx = -7; cx <= 7; cx++) for (let rz = -22; rz <= 0; rz++) { const x = cx * 58 + (rr() - .5) * 4, z = rz * 22 + (rr() - .5) * 3;
    if (cx === 0 && z > -190) continue; spots.push({ x, y: 2.6, z, ry: 0, v: (cx + rz + 30) % 3 }); }
  const fleet = buildFleet(spots); D.add(fleet.group);
  fleet.ships.forEach(s => { s.d = Math.hypot(s.x, (s.z + 81) * 1.2); });   // distance from the ten: the shot table times the rings (pf) from it
  return { group: D, ships, fleet, sea };
}

/* ---------------- F: the harbour a year later, packed with dazzled ships ---------------- */
// [G] the harbour packed solid: ships beam to beam in columns either side of a clear lane down to the hero (the launch's run, x = lane ± 10),
// the roads beyond the quay filled to the horizon, and more rows out past the breakwater. ~1100 ships, instanced; heavier ink, dark masts (C9).
export function buildHarbourFleet(H, { lane = 3 } = {}) {
  const spots = [], r = rng(91);
  // keep clear of the harbour's fixed pieces: the quay row (hero and the moored ships), the breakwater, the lighthouse, the buoy and the dolphin
  const bw = (x, z) => { for (let s = -1; s <= 1; s += .25) { const px = x + 20 * s; const t = Math.max(-80, Math.min(80, (px + 150) * .878 - (z - 70) * .479)), bx = -150 + .878 * t, bz = 70 - .479 * t; if (Math.hypot(px - bx, z - bz) < 9) return true; } return false; };
  const near = (x, z, [ax, az], dx, dz) => Math.abs(ax - x) < dx && Math.abs(az - z) < dz;
  const free = (x, z) => !bw(x, z) && !near(x, z, [-210, 110], 30, 14) && !near(x, z, [62, 52], 26, 8) && !near(x, z, [103, 112], 26, 8)
    && !near(x, z, [-60, -150], 48, 14) && !near(x, z, [80, -230], 48, 14) && !near(x, z, [-180, -60], 48, 12);
  const add = (x, z, ry, i) => { if (free(x, z)) spots.push({ x, z, ry, v: ((i * 7) % 3 + 3) % 3, ph: r() * 6 }); };
  // the inner harbour: columns of ships nose to tail (43 m apart), rows 17 m apart (beam 6.6), the lane left open
  let i = 0;
  for (let k = 0; k < 7; k++) for (const sd of [-1, 1]) for (let j = 0; j < 15; j++) { const x = lane + sd * (31 + 43 * k) + (r() - .5) * 3, z = 16 + 17 * j + (r() - .5) * 2.5; add(x, z, (r() - .5) * .08, i++); }
  // out past the breakwater: rows further out, a little looser
  for (let j = 0; j < 14; j++) for (let c = -11; c <= 11; c++) { const x = c * 46 + (j % 2) * 23 + (r() - .5) * 8, z = 275 + 30 * j + (r() - .5) * 8; add(x, z, (r() - .5) * .3, i++); }
  // the roads beyond the quay, to the horizon
  for (let j = 0; j < 20; j++) for (let c = -13; c <= 13; c++) { const x = c * 46 + (j % 2) * 23 + (r() - .5) * 8, z = -82 - 30 * j + (r() - .5) * 8; add(x, z, (r() - .5) * .3, i++); }
  const fleet = buildFleet(spots, { ink: 1.35, mast: 0x4a4458 }); fleet.ships.forEach(s => s.dz = true); fleet.commit();
  return { group: fleet.group, fleet, update(f) { for (const s of fleet.ships) s.dy = .06 * Math.sin(f * .06 + s.ph); fleet.commit(); } };
}

/* ---------------- the paint factory: a cartoon works with a sawtooth roof, a chimney and paint cans on top ---------------- */
const SPLAT_COLS = ['#e8433a', '#f2c230', '#2f6fd6', '#2fa65a', '#f07ab0', '#f08a2a', '#7a4fc8'];
function blobTex(seed) { return tex(256, 256, (c) => { const r = rng(seed); c.fillStyle = '#fff'; c.beginPath();
  for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2, rr = 70 + r() * 40; const x = 128 + Math.cos(a) * rr, y = 128 + Math.sin(a) * rr; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.fill();
  for (let i = 0; i < 5; i++) { const a = r() * 6.28, d = 100 + r() * 16; c.beginPath(); c.arc(128 + Math.cos(a) * d * .9, 128 + Math.sin(a) * d * .9, 6 + r() * 10, 0, 7); c.fill(); } }); }
export function buildFactory() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const brick = tex(512, 512, (c, W, H) => { c.fillStyle = '#b8503e'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(60,20,20,.25)'; for (let y = 0; y < H; y += 24) { c.fillRect(0, y, W, 3); for (let x = (y / 24 % 2) * 24; x < W; x += 48) c.fillRect(x, y, 3, 24); }
    for (let x = 40; x < W; x += 112) { c.fillStyle = '#ffe1a0'; c.fillRect(x, 150, 60, 80); c.strokeStyle = '#2a1a26'; c.lineWidth = 6; c.strokeRect(x, 150, 60, 80); c.beginPath(); c.moveTo(x + 30, 150); c.lineTo(x + 30, 230); c.stroke(); }
    // paint dribbling down the walls from the roof
    SPLAT_COLS.forEach((col, i) => { c.fillStyle = col; const x = 20 + i * 70; c.fillRect(x, 0, 22, 40 + (i * 37) % 90); c.beginPath(); c.arc(x + 11, 40 + (i * 37) % 90, 11, 0, 7); c.fill(); });
    c.fillStyle = '#f4ecd8'; c.fillRect(70, 320, 372, 110); c.strokeStyle = '#2a1a26'; c.lineWidth = 8; c.strokeRect(70, 320, 372, 110);
    c.fillStyle = '#2a1a26'; c.font = 'bold 84px Georgia, serif'; c.textAlign = 'center'; c.fillText('PAINT', 256, 408); });
  put(body, new THREE.BoxGeometry(16, 9, 10), toon({ map: brick }), { pos: [0, 4.5, 0], outline: 2.4 });
  const roofM = toon({ color: 0x5c6278 });
  for (let i = 0; i < 3; i++) { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(5.33, 0); s.lineTo(5.33, 3.2); s.closePath(); const rg = new THREE.ExtrudeGeometry(s, { depth: 10, bevelEnabled: false }); rg.translate(-8 + i * 5.33, 0, -5);
    put(body, rg, roofM, { pos: [0, 9, 0], outline: 2 }); }
  put(body, new THREE.CylinderGeometry(.9, 1.1, 9, 14), toon({ color: 0xa04636 }), { pos: [5.5, 13, -2.5], outline: 2.2, edges: false });
  put(body, new THREE.CylinderGeometry(1.05, 1.05, .6, 14), toon({ color: 0x2a2630 }), { pos: [5.5, 17.6, -2.5], outline: 2, edges: false });
  // paint cans stacked on the roof edge, lids off, each a colour
  SPLAT_COLS.slice(0, 5).forEach((col, i) => { const cg = new THREE.Group(); cg.position.set(-6 + i * 2.6, 9.1, 3.6); body.add(cg);
    put(cg, new THREE.CylinderGeometry(.9, .9, 1.6, 16), toon({ color: 0xc9cfd8 }), { pos: [0, .8, 0], outline: 2, edges: false });
    put(cg, new THREE.CircleGeometry(.86, 16), toon({ color: col, emissive: new THREE.Color(col).multiplyScalar(.25) }), { pos: [0, 1.61, 0], rot: [-Math.PI / 2, 0, 0], outline: 0, edges: false }); });
  // the splat: blobs that fly out of the impact, and the colour left on the hull
  // the blobs fly out to the sides and back, clear of the sign
  const texs = [1, 2, 3, 4].map(blobTex), r = rng(33);
  const flyers = []; for (let i = 0; i < 46; i++) { const col = SPLAT_COLS[i % SPLAT_COLS.length], m = new THREE.Sprite(new THREE.SpriteMaterial({ map: texs[i % 4], color: col, fog: false }));
    const sd = i % 2 ? 1 : -1, up = .5 + r() * .8; m.userData.v = [sd * (16 + r() * 20), up * 26, -4 - r() * 10]; m.userData.s = 1.4 + r() * 2.6; m.visible = false; g.add(m); flyers.push(m); }
  return { group: g, body, flyers, texs, cols: SPLAT_COLS };
}
// colour splats stuck to a ship's starboard side and deck (ship-local planes), grown in over 3 frames from the impact
export function buildHullSplats(ship, texs) {
  const g = new THREE.Group(), r = rng(57), list = [];
  for (let i = 0; i < 26; i++) { const t = .3 + r() * .38, y = 2.0 + r() * 1.8, p = ship.side(t, y); const col = SPLAT_COLS[i % SPLAT_COLS.length];   // [G] high on the side, under the factory: the paint has hull left to run down
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), toon({ map: texs[i % 4], color: col, emissive: new THREE.Color(col).multiplyScalar(.2), alphaTest: .5, transparent: false, polygonOffset: true, polygonOffsetFactor: -4 }));
    m.position.set(p.x, p.y, p.z + .03 + i * .003); m.rotation.z = r() * 6; const s = 1.6 + r() * 2.4; m.userData.s = s; m.userData.d = i % 5; m.scale.setScalar(.001); g.add(m); list.push(m); }
  for (let i = 0; i < 12; i++) { const t = .3 + r() * .45, col = SPLAT_COLS[(i * 3) % SPLAT_COLS.length];
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), toon({ map: texs[i % 4], color: col, emissive: new THREE.Color(col).multiplyScalar(.2), alphaTest: .5 }));
    m.position.set(ship.X(t), ship.deck(t) + .06, (r() - .5) * 4); m.rotation.set(-Math.PI / 2, 0, r() * 6); const s = 3 + r() * 4; m.userData.s = s; m.userData.d = i % 4; m.scale.setScalar(.001); g.add(m); list.push(m); }
  // [G] paint runs: 2 drips under each side splat, growing down the hull toward the waterline after the hit (a slow ease-out, still running at the end)
  const dripTex = tex(64, 256, (c, W, H) => { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(10, 0); c.lineTo(54, 0); c.quadraticCurveTo(44, H * .5, 46, H - 34); c.arc(32, H - 30, 22, 0, Math.PI); c.quadraticCurveTo(20, H * .5, 10, 0); c.closePath(); c.fill(); });
  const drips = [], dg = new THREE.PlaneGeometry(1, 1); dg.translate(0, -.5, 0);
  list.slice(0, 26).forEach((sp, i) => { const col = sp.material.color.getStyle(); for (let j = 0; j < 2; j++) { const s = sp.userData.s, x = sp.position.x + (r() - .5) * s * .5, y = sp.position.y - s * .1;
    const len = Math.max(.6, (y - .2) * (.6 + r() * .4)), d = new THREE.Mesh(dg, toon({ map: dripTex, color: col, emissive: new THREE.Color(col).multiplyScalar(.2), alphaTest: .5, polygonOffset: true, polygonOffsetFactor: -4 }));
    d.position.set(x, y, sp.position.z - .002); d.userData = { len, w: .3 + r() * .3, d: 3 + r() * 6, rate: 7 + r() * 8 }; d.scale.set(.001, .001, 1); g.add(d); drips.push(d); } });
  ship.group.add(g);
  return { group: g, set(f, f0) { for (const m of list) { const k = ss((f - f0 - m.userData.d * .5) / 3); m.visible = k > 0; m.scale.setScalar(Math.max(.001, k * m.userData.s)); }
    for (const d of drips) { const t = f - f0 - d.userData.d, k = t > 0 ? 1 - Math.exp(-t / d.userData.rate) : 0; d.visible = k > .01; d.scale.set(d.userData.w * Math.min(1, k * 4), Math.max(.001, d.userData.len * k), 1); } } };
}
