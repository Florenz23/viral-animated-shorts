// places.js — places S (open sea) and O (navy office). Same conventions as world.js.
// S: its own origin far from H (PLACE.S). Local stagings: x ~ 0 the periscope run (shot 3),
//    x = 600 the crane insert (shot 3, f188), x = -500 the periscope view (shot 6, f384).
// O: the harbour master's tower on the H quay (PLACE.O = floor of the room, window wall at local z = 0,
//    room z -12..0, x -8..8, ceiling 4.6). The window looks out over H at the hero ship.
import * as THREE from 'three';
import { toon, put, tex, rng, makeWater, buildShip, crane, LINE } from './world.js';
import { buildPeriscope, buildCargo, buildSplash, buildCalendar, buildMapTable, buildToken } from './props.js';

/* ---------------- S: the open sea ---------------- */
export function buildSea() {
  const S = new THREE.Group(); S.name = 'S';
  const W = makeWater('#55707f', 2.2); S.add(W.mesh);
  const peri = buildPeriscope(); S.add(peri.group);
  const cargo = buildCargo(); cargo.group.position.set(-6, 0, -120); cargo.group.rotation.y = .25; S.add(cargo.group);
  const splash = buildSplash(); splash.group.position.set(-6, 0, -120); S.add(splash.group);
  // far shipping on the horizon
  for (const [x, z, ry] of [[-160, -420, .4], [140, -520, -.3]]) { const c = buildCargo({ L: 44 }); c.group.position.set(x, 0, z); c.group.rotation.y = ry; S.add(c.group); }
  // the crane insert (x = 140): a pier and a dockside crane, a shiny new ship on the hook, two ships going down behind
  const IN = new THREE.Group(); IN.position.set(140, 0, 0); S.add(IN);
  const stone = toon({ color: 0x9a949c });
  put(IN, new THREE.BoxGeometry(14, 4, 40), stone, { pos: [-16, 0, -6], outline: 2 });
  const cr = crane(IN, -16, -2, 0xd8a640, -.35); cr.getObjectByName('hookRope').visible = false; cr.getObjectByName('hookBlock').visible = false;
  cr.updateMatrixWorld(true);
  const fresh = buildShip({ L: 26, B: 5, seed: 31 }); IN.add(fresh.group);
  fresh.group.traverse(o => { if (o.isMesh && o.material && o.material.isMeshToonMaterial && !o.userData.fresh) { o.material = o.material.clone(); o.material.emissive = new THREE.Color(0x30343c); o.userData.fresh = true; } });
  const slings = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([0, 1, 2, 3].map(() => new THREE.Vector3())), LINE); IN.add(slings);
  const sinkers = [[-14, -120, .5, 'cargo'], [26, -150, -.3, 'war']].map(([x, z, ry, k]) => { const s = k === 'cargo' ? buildCargo({ L: 40 }) : buildShip({ L: 34, seed: 41 }); s.group.position.set(x, 0, z); s.group.rotation.y = ry; IN.add(s.group); const sp = buildSplash(); sp.group.position.set(x, 0, z); IN.add(sp.group); return { s, sp }; });
  const sparkle = tex(128, 128, (c) => { c.fillStyle = '#fffbe8'; c.strokeStyle = '#2a1a26'; c.lineWidth = 5; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 16 : 58; c.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke(); });
  const sparks = [[-4, 9], [6, 6], [1, 12]].map(([x, y]) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkle, fog: false })); m.scale.set(2.2, 2.2, 1); m.userData.p = [x, y]; IN.add(m); return m; });
  // the periscope view (x = -500): one plain grey warship
  const target = buildShip({ L: 40, seed: 51 }); target.group.position.set(-500, 0, -330); target.group.rotation.y = .5; S.add(target.group);
  return { group: S, water: W, peri, cargo, splash, IN, crane: cr, fresh, slings, sinkers, sparks, target,
    update(f) { W.update(f); for (const s of [cargo, ...sinkers.map(k => k.s), target]) if (!s.sinking) s.group.position.y = .08 * Math.sin(f * .07 + s.group.position.x); },
    // the new ship hangs from the jib tip; h = keel height above the water (0 = afloat)
    hang(h, f) { const tip = cr.localToWorld(cr.userData.tip.clone()); IN.worldToLocal(tip); const g = fresh.group;
      g.position.set(tip.x, h + .2 * Math.max(0, h > .1 ? Math.sin(f * .5) * .2 : 0), tip.z); g.rotation.set(0, .6, h > .1 ? Math.sin(f * .3) * .03 : 0);
      const a = g.localToWorld(new THREE.Vector3(-8, 4.6, 0)), b = g.localToWorld(new THREE.Vector3(8, 5.6, 0)); IN.worldToLocal(a); IN.worldToLocal(b);
      slings.geometry.setFromPoints([tip, a, tip, b]); },
    sink(s, t, ease) { s.sinking = true; t = Math.max(0, t); const e = Math.min(1, t);   // t < 0: still afloat on the horizon
 s.group.rotation.z = -.45 * (ease ? 1 - (1 - Math.min(1, t * 1.4)) ** 2 : Math.min(1, t * 1.4));   // ease: the tip reads at once
 s.group.rotation.x = .12 * e; s.group.position.y = -14 * Math.pow(e, 1.6); } };
}

/* ---------------- O: the navy office ---------------- */
export function buildOffice() {
  const O = new THREE.Group(); O.name = 'O';
  const planks = tex(512, 512, (c, W, H) => { const r = rng(8); for (let y = 0; y < H; y += 64) { const k = .85 + r() * .25; c.fillStyle = `rgb(${150 * k | 0},${96 * k | 0},${62 * k | 0})`; c.fillRect(0, y, W, 64); c.fillStyle = 'rgba(50,25,20,.5)'; c.fillRect(0, y, W, 3); c.fillRect((r() * W) | 0, y, 3, 64); } }, [4, 3]);
  const paper = tex(512, 512, (c, W, H) => { c.fillStyle = '#4f7d6a'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(232,214,150,.22)'; for (let x = 0; x < W; x += 64) c.fillRect(x, 0, 14, H);
    c.fillStyle = 'rgba(232,214,150,.3)'; for (let y = 32; y < H; y += 128) for (let x = 32; x < W; x += 64) { c.beginPath(); c.moveTo(x + 7, y - 14); c.lineTo(x + 18, y); c.lineTo(x + 7, y + 14); c.lineTo(x - 4, y); c.closePath(); c.fill(); } }, [6, 1.4]);
  const wains = tex(512, 256, (c, W, H) => { c.fillStyle = '#a06a4a'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(40,20,15,.5)'; c.lineWidth = 6; for (let x = 10; x < W; x += 128) c.strokeRect(x, 30, 108, H - 60); c.fillStyle = 'rgba(255,220,170,.25)'; c.fillRect(0, 0, W, 10); }, [8, 1]);
  const stone = toon({ color: 0xa8a0a0 }), white = toon({ color: 0xece4d2 }), sh = { cast: false };
  const wallM = toon({ map: paper }), wainM = toon({ map: wains });
  const floorM = toon({ map: planks }); put(O, new THREE.BoxGeometry(16.4, .2, 12.4), floorM, { pos: [0, -.1, -6], outline: 0, ...sh });
  put(O, new THREE.BoxGeometry(16.4, .3, 12.4), toon({ color: 0xd9cbb0 }), { pos: [0, 4.75, -6], outline: 0, ...sh });
  // walls: back, sides, and the window wall in four pieces round the opening (x -1.3..1.3, y .25..4.2)
  const wall = (w, h, d, x, y, z) => { put(O, new THREE.BoxGeometry(w, h, d), wallM, { pos: [x, y, z], outline: 0, edges: false, ...sh }); };
  wall(16.4, 4.6, .3, 0, 2.3, -12.05); wall(.3, 4.6, 12.4, -8.05, 2.3, -6); wall(.3, 4.6, 12.4, 8.05, 2.3, -6);
  wall(6.7, 4.6, .3, -4.65, 2.3, 0); wall(6.7, 4.6, .3, 4.65, 2.3, 0); wall(2.6, .25, .3, 0, .125, 0); wall(2.6, .4, .3, 0, 4.4, 0);
  for (const [w, x, z, d] of [[6.7, -4.65, -.17, .04], [6.7, 4.65, -.17, .04], [16.4, 0, -11.88, .04]]) put(O, new THREE.BoxGeometry(w, 1.2, d), wainM, { pos: [x, .6, z], outline: 1.4, ...sh });
  // the window: white frame, mullions, glass with two highlight streaks
  for (const [w, h, x, y] of [[.12, 3.95, -1.3, 2.225], [.12, 3.95, 1.3, 2.225], [2.72, .12, 0, .25], [2.72, .12, 0, 4.2], [.07, 3.95, 0, 2.225], [2.6, .07, 0, 1.6], [2.6, .07, 0, 2.9]]) put(O, new THREE.BoxGeometry(w, h, .14), white, { pos: [x, y, -.05], outline: 1.6, ...sh });
  put(O, new THREE.BoxGeometry(3.0, .08, .4), white, { pos: [0, .3, -.3], outline: 1.6, ...sh });   // sill
  const gl = tex(256, 512, (c, W, H) => { c.fillStyle = 'rgba(190,215,235,.10)'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 14; c.beginPath(); c.moveTo(40, 300); c.lineTo(170, 120); c.stroke(); c.lineWidth = 7; c.beginPath(); c.moveTo(80, 340); c.lineTo(200, 175); c.stroke(); });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.95), new THREE.MeshBasicMaterial({ map: gl, transparent: true, depthWrite: false, side: THREE.DoubleSide })); glass.position.set(0, 2.225, -.02); O.add(glass);
  // curtains: deep red, either side of the window
  const cur = toon({ color: 0xb8434a, emissive: 0x3a1014 });
  for (const s of [-1, 1]) { const geo = new THREE.PlaneGeometry(.9, 4.1, 12, 1); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, .08 * Math.sin(p.getX(i) * 18)); geo.computeVertexNormals();
    put(O, geo, cur, { pos: [s * 1.75, 2.3, -.3], rot: [0, Math.PI, 0], outline: 1.6, edges: false, ...sh }); }   // turned to face into the room
  // outside: the tower's stone base, cornice and roof, so the harbour shots see a building
  put(O, new THREE.BoxGeometry(17, 10, 13), stone, { pos: [0, -5.2, -6], outline: 2, ...sh });
  put(O, new THREE.BoxGeometry(17.4, .5, 13.4), white, { pos: [0, 5.1, -6], outline: 2, ...sh });
  // two lamps over the map table
  const shade = toon({ color: 0x3f7a55, side: THREE.DoubleSide }), bulb = new THREE.MeshBasicMaterial({ color: 0xffe2a8 });
  const lamps = [-1.2, 1.2].map(x => { const g = new THREE.Group(); g.position.set(x, 2.55, -10.2); O.add(g);
    put(g, new THREE.ConeGeometry(.32, .26, 20, 1, true), shade, { pos: [0, 0, 0], outline: 1.6, edges: false, ...sh }); put(g, new THREE.SphereGeometry(.08, 10, 8), bulb, { pos: [0, -.1, 0], outline: 0, edges: false, ...sh });
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, .13, 0), new THREE.Vector3(0, 2.1, 0)]), LINE));
    const l = new THREE.PointLight(0xffc98a, 6, 9, 1.6); l.position.set(0, -.2, 0); g.add(l); return l; });
  const table = buildMapTable(); table.group.position.set(0, 0, -10.2); O.add(table.group);
  const tokens = []; const r = rng(3);
  // token spots on the map (table-local x = north, z = east): the Western Approaches, near the west edge (z = -1.15)
  for (const [x, z, ry, k] of [[-.55, -.78, .3, 'ship'], [-.25, -.62, -.2, 'ship'], [.1, -.85, .5, 'ship'], [.45, -.6, 0, 'ship'], [-.9, -.45, .2, 'ship'], [.3, -.3, -.4, 'ship'], [-.4, -.25, 1.1, 'sub'], [.7, -.9, .8, 'sub'], [-.1, -1.0, -.6, 'ship']]) {
    const t = buildToken(k); t.position.set(x, table.top + .002, z); t.rotation.y = ry; table.group.add(t); tokens.push(t); t.userData.p0 = t.position.clone(); t.userData.r0 = ry; }
  const cal = buildCalendar(); cal.group.position.set(3.0, 2.6, -.16); cal.group.rotation.y = Math.PI; O.add(cal.group);
  // a framed picture of a sailing ship on the side wall
  const pic = tex(256, 192, (c, W, H) => { c.fillStyle = '#e8d8b0'; c.fillRect(0, 0, W, H); c.fillStyle = '#7fa6b8'; c.fillRect(0, 120, W, 72); c.fillStyle = '#5a3a2a'; c.fillRect(70, 110, 120, 18); c.fillStyle = '#f4ecd8'; c.fillRect(90, 40, 30, 66); c.fillRect(135, 30, 34, 76); c.strokeStyle = '#6b4a34'; c.lineWidth = 16; c.strokeRect(8, 8, W - 16, H - 16); });
  put(O, new THREE.PlaneGeometry(1.4, 1.05), toon({ map: pic }), { pos: [-7.88, 2.4, -4], rot: [0, Math.PI / 2, 0], outline: 0, ...sh });
  return { group: O, lamps, table, tokens, cal, floorM };
}
