// world.js — the Zebra Warships world, built once.
// Conventions (every later shot uses them):
//   metres, Y up, sea level y = 0. Every place has its own origin in the same scene (PLACE below);
//   a shot shows one place group (or two during a dissolve).
//   Ships: length along +X with the bow at +X, starboard at +Z, origin = midships on the waterline.
//   H (harbour): hero ship at the origin; the quay face runs along z = -14, its top at y = 2.
// Engineering (toon ramp, screen-space ink hull, crease lines, canvas textures) follows our earlier study builds.
import * as THREE from 'three';

export const INK = 0x1c1118;   // luma .078 (ink stays under .09)
export const PLACE = { H: [0, 0, 0], S: [0, 0, -4000], O: [0, 1.5, -62], D: [-4000, 0, 0], F: [0, 0, 0] }; // O = the office tower's room floor on the H quay; F = H a year later (re-dressed)
export const INK_SCALE = { value: 1 }, INK_FOG = { value: .62 };      // per-shot multiplier on every ink hull (set by the shot table)

/* ---------------- helpers ---------------- */
export function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rgb = (r, g, b) => `rgb(${r | 0},${g | 0},${b | 0})`;
const shade = ([r, g, b], k) => rgb(r * k, g * k, b * k);
const ss = t => (t = Math.min(1, Math.max(0, t)), t * t * (3 - 2 * t));

let GRAD = null;
export function grad() {   // 4 hard steps; the lowest stays at ~0.37 so shadow sides keep their colour
  if (!GRAD) { GRAD = new THREE.DataTexture(new Uint8Array([95, 165, 220, 255]), 4, 1, THREE.RedFormat); GRAD.minFilter = GRAD.magFilter = THREE.NearestFilter; GRAD.generateMipmaps = false; GRAD.needsUpdate = true; }
  return GRAD;
}
export const toon = (o) => new THREE.MeshToonMaterial({ gradientMap: grad(), ...o });
export function tex(w, h, draw, rep = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.repeat.set(rep[0], rep[1]); return t;
}

// screen-space inverted hull: constant px outline at 720x1280, fogged like the surface it outlines
const OUT_MATS = new Map();
export function outlineMat(px) {
  if (!OUT_MATS.has(px)) {
    const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uPx: { value: px }, uColor: { value: new THREE.Color(INK) }, uRes: { value: new THREE.Vector2(720, 1280) } }]);
    u.uScale = INK_SCALE; u.uFog = INK_FOG;
    OUT_MATS.set(px, new THREE.ShaderMaterial({ uniforms: u, fog: true, side: THREE.BackSide,
      vertexShader: `uniform float uPx, uScale; uniform vec2 uRes;
        #include <fog_pars_vertex>
        void main(){ vec4 mvPosition = modelViewMatrix*vec4(position,1.0); vec4 c = projectionMatrix*mvPosition;
          vec3 n = normalize(normalMatrix*normal); vec4 cn = projectionMatrix*vec4(n,0.0);
          vec2 d = cn.xy; float l = length(d); d = l>1e-5 ? d/l : vec2(0.0);
          c.xy += d*uPx*uScale*2.0/uRes*c.w; gl_Position = c;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform vec3 uColor; uniform float uFog;
        #include <fog_pars_fragment>
        void main(){ gl_FragColor = vec4(uColor,1.0);
          #ifdef USE_FOG
          float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor * uFog);   // ink hazes in fog but never vanishes (plum, not gone)
          #endif
        }` }));
  }
  return OUT_MATS.get(px);
}
const HULLS = new WeakMap();
function hullGeo(geo) {   // smoothed normals so the ink hull does not split at hard edges
  if (HULLS.has(geo)) return HULLS.get(geo);
  const g = new THREE.BufferGeometry(), p = geo.attributes.position; g.setAttribute('position', p); if (geo.index) g.setIndex(geo.index);
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const n = geo.attributes.normal, sum = new Map(), key = i => `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
  for (let i = 0; i < p.count; i++) { const k = key(i), s = sum.get(k) || [0, 0, 0]; s[0] += n.getX(i); s[1] += n.getY(i); s[2] += n.getZ(i); sum.set(k, s); }
  const out = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const s = sum.get(key(i)), l = Math.hypot(...s) || 1; out[i * 3] = s[0] / l; out[i * 3 + 1] = s[1] / l; out[i * 3 + 2] = s[2] / l; }
  g.setAttribute('normal', new THREE.BufferAttribute(out, 3)); HULLS.set(geo, g); return g;
}
export const LINE = new THREE.LineBasicMaterial({ color: INK });
export function put(parent, geo, mat, o = {}) {
  const m = new THREE.Mesh(geo, mat);
  if (o.pos) m.position.set(...o.pos); if (o.rot) m.rotation.set(...o.rot); if (o.scale) m.scale.set(...o.scale); if (o.name) m.name = o.name;
  const sh = o.shadow !== false; m.castShadow = sh && o.cast !== false; m.receiveShadow = sh;
  const px = o.outline ?? 1.5;
  if (px > 0) { const h = new THREE.Mesh(hullGeo(geo), outlineMat(px)); h.castShadow = h.receiveShadow = false; h.renderOrder = -1; m.add(h); }
  if (o.edges !== false) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, o.edgeAngle ?? 35), LINE));
  parent.add(m); return m;
}
function stoneBlocks(g, w, h, { base, v = 14, bw, bh, mortar, seed = 1, hi = 1.12 }) {
  const r = rng(seed); g.fillStyle = rgb(...mortar); g.fillRect(0, 0, w, h);
  for (let y = 0, row = 0; y < h; y += bh, row++) { const off = (row % 2) * bw / 2;
    for (let x = -off; x < w; x += bw) { const k = 1 + (r() - .5) * v / 50, ww = bw - 3, hh = bh - 3;
      g.fillStyle = shade(base, k); g.fillRect(x + 2, y + 2, ww, hh); g.fillStyle = shade(base, k * hi); g.fillRect(x + 2, y + 2, ww, 3); g.fillStyle = shade(base, k * .86); g.fillRect(x + 2, y + hh - 2, ww, 3); } }
}

/* ---------------- ship paint ---------------- */
// Hull canvas: u (x) = 0 stern .. 1 bow over the ship's length; v (y) maps world y from Y0 to Y1.
const Y0 = -2.6, Y1 = 7.0, HW = 2048, HH = 512;
const py = y => (1 - (y - Y0) / (Y1 - Y0)) * HH;
const DZ_K = '#4d4945', DZ_W = '#ece9e3';   // near-black slate (no blue cast once the cool shadow grade lands) and off-white
const TEXC = new Map();
const cached = (k, mk) => { if (!TEXC.has(k)) TEXC.set(k, mk()); return TEXC.get(k); };

function hullCommon(g, L, ports) {   // boot topping and portholes, painted over either finish
  g.fillStyle = '#7d3a33'; g.fillRect(0, py(.32), HW, py(-.6) - py(.32));
  g.fillStyle = '#4b2a2c'; g.fillRect(0, py(-.6), HW, HH);
  if (ports) for (let x = .2; x < .93; x += .028) if (Math.abs(x - .6) > .03) { const cx = x * HW, cy = py(3.0); g.fillStyle = '#2b2733'; g.beginPath(); g.arc(cx, cy, 7, 0, 7); g.fill(); g.fillStyle = 'rgba(255,240,210,.5)'; g.beginPath(); g.arc(cx - 2, cy - 2, 2.2, 0, 7); g.fill(); }
}
function greyHullTex() {
  return cached('hullGrey', () => tex(HW, HH, (g) => {
    const r = rng(11); g.fillStyle = '#8a93ab'; g.fillRect(0, 0, HW, HH);
    g.fillStyle = 'rgba(70,72,95,.10)'; for (let y = py(6); y < py(.3); y += 46) g.fillRect(0, y, HW, 3);          // plate seams
    for (let x = 0; x < HW; x += 96) { g.fillStyle = 'rgba(70,72,95,.08)'; g.fillRect(x, 0, 3, py(.3)); }
    g.fillStyle = 'rgba(232,236,245,.18)'; g.fillRect(0, py(4.6), HW, 10);                                     // lit deck-edge strake
    for (let i = 0; i < 26; i++) { const x = r() * HW, y = py(2.9), l = 30 + r() * 90; const gr = g.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, 'rgba(150,80,50,.35)'); gr.addColorStop(1, 'rgba(150,80,50,0)'); g.fillStyle = gr; g.fillRect(x, y, 5 + r() * 4, l); }  // rust streaks
    hullCommon(g, 40, true);
  }));
}
// Dazzle: three zones with their own stripe angles, joined along zigzag seams, so neither the stem nor the stern line survives.
function zig(pts, x, y0, y1, amp, n) { for (let i = 0; i <= n; i++) pts.push([x + (i % 2 ? amp : -amp), y0 + (y1 - y0) * i / n]); return pts; }
function clipPoly(g, pts) { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); g.clip(); }
function stripes(g, x0, x1, period, width, slant, H) { g.fillStyle = DZ_K; for (let x = x0 - H * Math.abs(slant) - period; x < x1 + H * Math.abs(slant) + period; x += period) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + width, 0); g.lineTo(x + width + slant * H, H); g.lineTo(x + slant * H, H); g.closePath(); g.fill(); } }
function dazzleHullTex(variant = 0) {
  return cached('hullDz' + variant, () => tex(HW, HH, (g, W, H) => {
    g.fillStyle = DZ_W; g.fillRect(0, 0, W, H);
    const s1 = .30 * W + variant * 40, s2 = .60 * W - variant * 30;   // zone seams
    // stern zone: stripes lean forward (/), crossing the stern's rake
    g.save(); clipPoly(g, [[0, 0], ...zig([], s1, 0, H, 34, 7), [0, H]]); stripes(g, 0, s1, 118, 64, -.9, H); g.restore();
    // midships: stacked sawtooth bands that run the eye along a false sheer
    g.save(); clipPoly(g, [...zig([], s1, 0, H, 34, 7), ...zig([], s2, 0, H, 40, 7).reverse()]);
    g.fillStyle = DZ_K; for (let k = 0; k < 4; k++) { const y = H * (.05 + k * .24), a = 46, P = 150; g.beginPath(); g.moveTo(s1 - 80, y + a);
      for (let x = s1 - 80, i = 0; x <= s2 + 80; x += P / 2, i++) g.lineTo(x, y + (i % 2 ? -a : a)); for (let x = s2 + 80, i = 0; x >= s1 - 80; x -= P / 2, i++) g.lineTo(x, y + 58 + (i % 2 ? -a : a)); g.closePath(); g.fill(); }
    g.restore();
    // bow zone: stripes lean aft (\), a dark false stem wedge and a white false bow wave
    g.save(); clipPoly(g, [...zig([], s2, 0, H, 40, 7), [W, H], [W, 0]]); stripes(g, s2, W, 132, 74, 1.15, H);
    g.fillStyle = DZ_K; g.beginPath(); g.moveTo(.70 * W, 0); g.lineTo(.79 * W, 0); g.lineTo(.70 * W, H * .78); g.closePath(); g.fill();
    g.fillStyle = DZ_W; g.beginPath(); g.moveTo(.64 * W, py(.5)); g.quadraticCurveTo(.70 * W, py(2.4), .76 * W, py(1.1)); g.quadraticCurveTo(.72 * W, py(1.0), .70 * W, py(.5)); g.closePath(); g.fill();
    g.restore();
    // staging: an off-white field where the painter stands (t .545–.598, y 1–4), so his ink outline reads against light paint
    if (variant === 0) { g.fillStyle = DZ_W; g.beginPath(); g.moveTo(.545 * W, py(4.1)); for (let i = 0; i <= 6; i++) g.lineTo((.545 + (i % 2 ? .012 : 0)) * W, py(4.1 - i * .55)); g.lineTo(.598 * W, py(.8));
      for (let i = 6; i >= 0; i--) g.lineTo((.598 - (i % 2 ? .01 : 0)) * W, py(4.1 - i * .55)); g.closePath(); g.fill(); }
    g.strokeStyle = DZ_K; g.lineWidth = 3; g.beginPath(); g.moveTo(0, py(.32)); g.lineTo(W, py(.32)); g.stroke();
    hullCommon(g, 40, false);
  }));
}
function greyTex(base, seed) { return cached('grey' + base + seed, () => tex(256, 256, (g, W, H) => { g.fillStyle = base; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(60,60,85,.10)'; for (let y = 24; y < H; y += 48) g.fillRect(0, y, W, 3); g.fillStyle = 'rgba(240,242,250,.14)'; g.fillRect(0, 0, W, 10); })); }
function windowsTex() { return cached('win', () => tex(256, 128, (g, W, H) => { g.fillStyle = '#a7acb8'; g.fillRect(0, 0, W, H); for (let x = 14; x < W; x += 40) { g.fillStyle = '#2c2a38'; g.fillRect(x, 34, 24, 30); g.fillStyle = 'rgba(255,226,170,.55)'; g.fillRect(x + 3, 37, 8, 8); } g.fillStyle = 'rgba(240,242,250,.2)'; g.fillRect(0, 0, W, 10); })); }
function dazzleBlockTex(seed) {
  return cached('dzb' + seed, () => tex(512, 512, (g, W, H) => { const r = rng(seed); g.fillStyle = DZ_W; g.fillRect(0, 0, W, H);
    g.save(); clipPoly(g, [[0, 0], ...zig([], W * (.4 + r() * .2), 0, H, 30, 5), [0, H]]); stripes(g, 0, W, 104, 56, .8, H); g.restore();
    g.save(); clipPoly(g, [...zig([], W * (.4 + r() * .2), 0, H, 30, 5), [W, H], [W, 0]]); g.fillStyle = DZ_K; for (let y = -40; y < H; y += 120) { g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W; x += 64) g.lineTo(x, y + (x / 64 % 2 ? 44 : 0)); g.lineTo(W, y + 60); for (let x = W; x >= 0; x -= 64) g.lineTo(x, y + 60 + (x / 64 % 2 ? 44 : 0)); g.closePath(); g.fill(); } g.restore(); }));
}
function dazzleFunnelTex(seed) { return cached('dzf' + seed, () => tex(512, 256, (g, W, H) => { g.fillStyle = DZ_W; g.fillRect(0, 0, W, H); stripes(g, 0, W, 128, 60, seed % 2 ? 1.1 : -1.1, H); g.fillStyle = DZ_K; g.fillRect(0, 0, W, 26); })); }
function greyFunnelTex() { return cached('gf', () => tex(256, 256, (g, W, H) => { g.fillStyle = '#8f96a6'; g.fillRect(0, 0, W, H); g.fillStyle = '#34303d'; g.fillRect(0, 0, W, 34); g.fillStyle = 'rgba(240,242,250,.18)'; g.fillRect(0, 40, W, 6); })); }

/* ---------------- the ship ---------------- */
export function hullGeometry(L, B, deck, keel) {
  const nT = 96, nS = 14, half = t => { const b = B / 2; if (t > .58) { const u = (t - .58) / .42; return b * Math.max(0, 1 - Math.pow(u, 1.8)); } if (t < .16) { const u = (.16 - t) / .16; return b * (.1 + .9 * Math.sqrt(Math.max(0, 1 - u * u))); } return b; };
  const rakeX = (t, h) => .2 * h * ss((t - .9) / .1) - .14 * h * ss((.07 - t) / .07);
  const pos = [], uv = [], idx = [], row = 2 * nS + 1;
  for (let i = 0; i <= nT; i++) { const t = i / nT, w = half(t), d = deck(t), k = keel(t);
    for (let j = 0; j < row; j++) { const ph = (j / nS - 1) * Math.PI / 2, s = Math.sin(ph), c = Math.cos(ph);
      const z = w * Math.sign(s) * Math.pow(Math.abs(s), .45), y = d - (d - k) * Math.pow(c, .45);
      pos.push((t - .5) * L + rakeX(t, y - k), y, z); uv.push(t, (y - Y0) / (Y1 - Y0)); } }
  for (let i = 0; i < nT; i++) for (let j = 0; j < row - 1; j++) { const a = i * row + j, b = a + row; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  // stern cap: a fan from the centre of the last section
  const c0 = pos.length / 3; let cx = 0, cy = 0; for (let j = 0; j < row; j++) { cx += pos[j * 3]; cy += pos[j * 3 + 1]; } pos.push(cx / row - .05, cy / row, 0); uv.push(0, .5);
  for (let j = 0; j < row - 1; j++) idx.push(c0, j + 1, j);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  // make sure the faces point out (starboard mid vertex must have +z normal)
  const mid = (Math.round(nT / 2) * row + row - 3); if (g.attributes.normal.getZ(mid) < 0) { const ix = g.index.array; for (let q = 0; q < ix.length; q += 3) { const t = ix[q]; ix[q] = ix[q + 1]; ix[q + 1] = t; } g.computeVertexNormals(); }
  // deck: a strip between the two deck edges
  const dp = [], du = [], di = [];
  for (let i = 0; i <= nT; i++) { const t = i / nT, w = half(t) * .995, d = deck(t), x = (t - .5) * L + rakeX(t, d - keel(t)); dp.push(x, d + .01, -w, x, d + .01, w); du.push(t * L / 4, 0, t * L / 4, B / 4); }
  for (let i = 0; i < nT; i++) { const a = i * 2; di.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute('uv', new THREE.Float32BufferAttribute(du, 2)); dg.setIndex(di); dg.computeVertexNormals();
  if (dg.attributes.normal.getY(0) < 0) { const ix = dg.index.array; for (let q = 0; q < ix.length; q += 3) { const t = ix[q]; ix[q] = ix[q + 1]; ix[q + 1] = t; } dg.computeVertexNormals(); }
  return { hull: g, deck: dg, half };
}

export function buildShip({ dazzle = false, L = 40, B = 6.6, variant = 0, seed = 1 } = {}) {
  const grp = new THREE.Group(); grp.name = 'ship';
  const deck = t => 4.0 + 1.3 * ss((t - .62) / .03) + .7 * Math.pow(t, 5) + .25 * ss((.1 - t) / .1);
  const keel = t => -2.3 + 1.0 * ss((.12 - t) / .12) + .7 * ss((t - .9) / .1);
  const geo = hullGeometry(L, B, deck, keel);
  const swaps = [];   // [mesh, grey material, dazzle material]
  const sw = (m, g, d) => { swaps.push([m, g, d]); return m; };
  const X = t => (t - .5) * L;
  const hullG = toon({ map: greyHullTex() }), hullD = toon({ map: dazzleHullTex(variant) });
  const hull = sw(put(grp, geo.hull, hullG, { outline: 2.2, edgeAngle: 50, name: 'hull' }), hullG, hullD);
  const deckTex = cached('deck', () => tex(256, 256, (g, W, H) => { g.fillStyle = '#a88a6c'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(70,45,40,.35)'; for (let y = 0; y < H; y += 21) g.fillRect(0, y, W, 2); }));
  put(grp, geo.deck, toon({ map: deckTex }), { outline: 0, edges: false, name: 'deck' });
  // superstructure: boxes on the deck, each with a grey and a dazzle finish
  const blk = (t, w, h, d, y0, opt = {}) => { const gm = toon({ map: opt.win ? windowsTex() : greyTex('#a3a9b6', 1) }), dm = toon({ map: dazzleBlockTex(seed * 7 + swaps.length) });
    return sw(put(grp, new THREE.BoxGeometry(w, h, d), gm, { pos: [X(t), y0 + h / 2, 0], outline: 1.8 }), gm, dm); };
  const dk = t => deck(t);
  blk(.60, 3.4, 2.4, 4.6, dk(.60));                    // bridge block
  blk(.60, 2.4, 1.5, 6.0, dk(.60) + 2.4, { win: true });// bridge with wings
  blk(.37, 11, 2.0, 3.8, dk(.37));                     // midships deckhouse
  blk(.13, 4.0, 1.6, 3.4, dk(.13));                    // aft deckhouse
  // turrets with twin barrels
  const metal = toon({ color: 0x9aa0ad }), dark = toon({ color: 0x3a3644 });
  const turret = (t, dir) => { const y = dk(t), gm = toon({ map: greyTex('#9aa0ad', 2) }), dm = toon({ map: dazzleBlockTex(seed * 3 + Math.round(t * 10)) });
    put(grp, new THREE.CylinderGeometry(1.25, 1.35, .5, 20), metal, { pos: [X(t), y + .25, 0], outline: 1.6, edges: false });
    sw(put(grp, new THREE.BoxGeometry(2.6, 1.1, 2.3), gm, { pos: [X(t), y + 1.0, 0], outline: 1.8 }), gm, dm);
    for (const z of [-.45, .45]) put(grp, new THREE.CylinderGeometry(.13, .16, 3.4, 10), metal, { pos: [X(t) + dir * 2.7, y + 1.05, z], rot: [0, 0, Math.PI / 2], outline: 1.4, edges: false }); };
  turret(.76, 1); turret(.045, -1);
  // funnels: raked aft, black caps
  [.47, .385, .30].forEach((t, i) => { const y = dk(t) + 2.0, h = 5.6 - i * .3, gm = toon({ map: greyFunnelTex() }), dm = toon({ map: dazzleFunnelTex(seed + i) });
    const f = sw(put(grp, new THREE.CylinderGeometry(.82, .9, h, 24, 1, true), gm, { pos: [X(t) - .3, y + h / 2, 0], rot: [0, 0, .1], scale: [1.2, 1, .85], outline: 2, edges: false }), gm, dm);
    f.material.side = THREE.DoubleSide; dm.side = THREE.DoubleSide;
    put(grp, new THREE.CircleGeometry(.8, 20), dark, { pos: [X(t) - .3 - Math.sin(.1) * h / 2, y + h - .05, 0], rot: [-Math.PI / 2, 0, 0], scale: [1.18, .84, 1], outline: 0, edges: false }); });
  // masts: a tripod foremast with a spotting top, a pole mainmast
  const mastM = toon({ color: 0x8f96a6 });
  const pole = (x0, y0, z0, x1, y1, z1, r) => { const a = new THREE.Vector3(x0, y0, z0), b = new THREE.Vector3(x1, y1, z1), m = new THREE.Mesh(new THREE.CylinderGeometry(r * .8, r, a.distanceTo(b), 8), mastM);
    m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); grp.add(m);
    const h = new THREE.Mesh(hullGeo(m.geometry), outlineMat(1.4)); m.add(h); m.castShadow = true; return m; };
  const fx = X(.545), fy = dk(.545), top = fy + 12.5, n0 = grp.children.length;
  pole(fx, fy, 0, fx, top, 0, .22); pole(fx - 2.6, fy, -1.7, fx, top - 3, 0, .14); pole(fx - 2.6, fy, 1.7, fx, top - 3, 0, .14);
  put(grp, new THREE.BoxGeometry(1.8, 1.0, 1.8), toon({ color: 0xa3a9b6 }), { pos: [fx, top - 2.2, 0], outline: 1.6 });
  pole(fx - 2.5, top - 4, 0, fx + 2.5, top - 4, 0, .07);   // yard
  // the foremast in its own group, pivoting on the deck, so the paint factory can crush it flat (shot 11)
  const fore = new THREE.Group(); fore.position.set(fx, fy, 0); for (const c of grp.children.slice(n0)) { c.position.x -= fx; c.position.y -= fy; fore.add(c); } grp.add(fore);
  grp.userData.fore = fore; grp.userData.foreTop = 12.5;
  const mx = X(.2), my = dk(.2); pole(mx, my, 0, mx, my + 10.5, 0, .18); pole(mx - 1.6, my + 8, 0, mx + 1.6, my + 8, 0, .06);
  // rigging: thin ink wires stem to foremast, foremast to mainmast, mainmast to stern
  const rig = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(X(1) + 1.2, deck(1) + .3, 0), new THREE.Vector3(fx, top, 0), new THREE.Vector3(fx, top - .5, 0), new THREE.Vector3(mx, my + 10.5, 0), new THREE.Vector3(mx, my + 10.3, 0), new THREE.Vector3(X(0) - .5, deck(0) + .4, 0)]);
  const rigL = new THREE.LineSegments(rig, LINE); grp.add(rigL); grp.userData.rig = rigL;
  // two lifeboats on the deckhouse roof: warm wood, a cream cover
  for (const z of [-1.2, 1.2]) { const b = put(grp, new THREE.CapsuleGeometry(.42, 2.6, 4, 10), toon({ color: 0xc89a62 }), { pos: [X(.37) - 2.5, dk(.37) + 2.35, z], rot: [0, 0, Math.PI / 2], scale: [1, 1, .9], outline: 1.4, edges: false }); }
  const ship = { group: grp, hull, swaps, L, B, deck, keel, half: geo.half, X, dazzle: false, dzMap: hullD.map, uvAt: (t, y) => [t, (y - Y0) / (Y1 - Y0)],
    setDazzle(on) { if (on === this.dazzle) return; this.dazzle = on; for (const [m, g, d] of swaps) m.material = on ? d : g; },
    // side point on the starboard hull at length fraction t and height y (ship-local)
    side(t, y) { return new THREE.Vector3(X(t), y, geo.half(t)); } };
  ship.setDazzle(dazzle);
  return ship;
}

/* ---------------- the harbour (place H) ---------------- */
function waterTex(base = '#4a6f8c') {
  return tex(512, 512, (g, W, H) => { const r = rng(5); g.fillStyle = base; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H, l = 30 + r() * 60, light = r() < .55; g.strokeStyle = light ? 'rgba(170,200,222,.75)' : 'rgba(40,58,96,.65)'; g.lineWidth = 3 + r() * 2.5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 6, x + l, y); g.stroke(); if (x + l > W) { g.beginPath(); g.moveTo(x - W, y); g.quadraticCurveTo(x - W + l / 2, y - 6, x - W + l, y); g.stroke(); } } }, [60, 60]);
}
// toon sea: a huge plane, gentle swell on the vertices, painted wavelets drifting on the texture
export function makeWater(base = '#4a6f8c', swell = 1) {
  const wg = new THREE.PlaneGeometry(3000, 3000, 150, 150); wg.rotateX(-Math.PI / 2);
  const wt = waterTex(base); const mesh = new THREE.Mesh(wg, toon({ map: wt })); mesh.receiveShadow = true; mesh.name = 'water';
  const b0 = Float32Array.from(wg.attributes.position.array);
  return { mesh, update(f) { const p = wg.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = b0[i * 3], z = b0[i * 3 + 2]; p.array[i * 3 + 1] = swell * (.09 * Math.sin(x * .09 + f * .07) + .07 * Math.sin(z * .13 - f * .05 + x * .03)); }
    p.needsUpdate = true; wg.computeVertexNormals(); wt.offset.set(f * .0009, f * .0004); } };
}
function fogTex() {   // soft painted fog bank: overlapping round puffs, flat on top of each other, faded at the edges
  return tex(1024, 256, (g, W, H) => { const r = rng(9);
    for (let i = 0; i < 46; i++) { const x = W * (.08 + r() * .84), y = H * (.45 + r() * .3), rad = 40 + r() * 90; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(.7, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); }
    g.globalCompositeOperation = 'destination-in'; const e = g.createLinearGradient(0, 0, W, 0); e.addColorStop(0, 'rgba(0,0,0,0)'); e.addColorStop(.15, '#000'); e.addColorStop(.85, '#000'); e.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = e; g.fillRect(0, 0, W, H); });
}
export function crane(parent, x, z, color, rotY) {
  const c = new THREE.Group(); c.position.set(x, 2, z); c.rotation.y = rotY; parent.add(c);
  const m = toon({ color }), d = toon({ color: 0x3e3a4a });
  for (const [lx, lz] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]) put(c, new THREE.BoxGeometry(.5, 11, .5), m, { pos: [lx * .8, 5.5, lz * .8], rot: [lz * .02, 0, -lx * .02], outline: 1.6 });
  put(c, new THREE.BoxGeometry(4.6, .6, 4.6), m, { pos: [0, 11, 0], outline: 1.6 });
  put(c, new THREE.BoxGeometry(3.4, 2.8, 3.0), toon({ map: windowsTex() }), { pos: [0, 12.7, 0], outline: 1.8 });
  put(c, new THREE.BoxGeometry(3.6, .5, 3.2), d, { pos: [0, 14.3, 0], outline: 1.6 });
  const jib = new THREE.Group(); jib.position.set(1.2, 13, 0); jib.rotation.z = .42; c.add(jib);
  const lat = tex(512, 64, (g, W, H) => { g.clearRect(0, 0, W, H); g.strokeStyle = '#fff'; g.lineWidth = 7; g.strokeRect(4, 4, W - 8, H - 8); for (let x = 0; x < W; x += 56) { g.beginPath(); g.moveTo(x, 4); g.lineTo(x + 28, H - 4); g.lineTo(x + 56, 4); g.stroke(); } });
  const jm = toon({ color, map: lat, alphaTest: .5, side: THREE.DoubleSide, transparent: false });
  for (const zz of [-.55, .55]) put(jib, new THREE.PlaneGeometry(22, 1.4), jm, { pos: [11, 0, zz], outline: 0, edges: false });
  put(jib, new THREE.BoxGeometry(22, .14, 1.2), m, { pos: [11, .7, 0], outline: 1.2, edges: false }); put(jib, new THREE.BoxGeometry(22, .14, 1.2), m, { pos: [11, -.7, 0], outline: 1.2, edges: false });
  const tip = new THREE.Vector3(22, 0, 0); jib.updateMatrix(); tip.applyMatrix4(jib.matrix);
  const rope = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([tip, new THREE.Vector3(tip.x, 3, 0)]), LINE); rope.name = 'hookRope'; c.add(rope);
  put(c, new THREE.BoxGeometry(.9, .7, .9), d, { pos: [tip.x, 2.7, 0], outline: 1.4, name: 'hookBlock' });
  c.userData.tip = tip;   // jib tip, crane-local
  return c;
}
function shed(parent, x, z, w, d, h, wall, roof) {
  const g = new THREE.Group(); g.position.set(x, 2, z); parent.add(g);
  const wt = tex(256, 128, (c, W, H) => { c.fillStyle = wall; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(40,30,50,.18)'; for (let y = 8; y < H; y += 12) c.fillRect(0, y, W, 2); for (let x = 20; x < W; x += 64) { c.fillStyle = '#2f2b3a'; c.fillRect(x, 50, 26, 34); c.fillStyle = 'rgba(255,214,150,.6)'; c.fillRect(x + 3, 53, 9, 9); } }, [w / 8, 1]);
  put(g, new THREE.BoxGeometry(w, h, d), toon({ map: wt }), { pos: [0, h / 2, 0], outline: 1.6 });
  const s = new THREE.Shape(); s.moveTo(-d / 2 - .4, 0); s.lineTo(0, h * .45); s.lineTo(d / 2 + .4, 0); s.closePath();
  const rg = new THREE.ExtrudeGeometry(s, { depth: w + .8, bevelEnabled: false }); rg.translate(0, 0, -(w + .8) / 2); rg.rotateY(Math.PI / 2);
  put(g, rg, toon({ color: roof }), { pos: [0, h, 0], outline: 1.6 });
}
export function buildHarbour() {
  const H = new THREE.Group(); H.name = 'H';
  // water: a huge plane, gentle swell on the vertices, painted wavelets drifting on the texture
  const W = makeWater(); const water = W.mesh; H.add(water);
  // quay along z = -14 .. -60, top at y = 2
  const stone = tex(1024, 512, (g, w, h) => stoneBlocks(g, w, h, { base: [150, 146, 150], v: 18, bw: 170, bh: 85, mortar: [98, 92, 104], seed: 4 }), [20, 1]);
  const quay = put(H, new THREE.BoxGeometry(400, 4, 46), toon({ map: stone }), { pos: [0, 0, -37], outline: 2, name: 'quay' });
  const top = tex(512, 512, (g, w, h) => { g.fillStyle = '#9d969a'; g.fillRect(0, 0, w, h); const r = rng(3); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(80,74,90,${.05 + r() * .08})`; g.fillRect(r() * w, r() * h, 4 + r() * 20, 2 + r() * 6); } g.fillStyle = '#d8b453'; g.fillRect(0, 30, w, 10); }, [40, 4]);
  put(H, new THREE.PlaneGeometry(400, 46), toon({ map: top }), { pos: [0, 2.01, -37], rot: [-Math.PI / 2, 0, 0], outline: 0, edges: false });
  const bm = toon({ color: 0x3e3a4a });
  for (let x = -190; x <= 190; x += 12) { put(H, new THREE.CylinderGeometry(.32, .38, .7, 12), bm, { pos: [x, 2.35, -14.8], outline: 1.4, edges: false }); put(H, new THREE.CylinderGeometry(.45, .45, .14, 12), bm, { pos: [x, 2.75, -14.8], outline: 1.2, edges: false }); }
  // fenders: tyres on the quay face, a warm accent near the waterline
  for (let x = -190; x <= 190; x += 7) put(H, new THREE.TorusGeometry(.45, .2, 8, 16), toon({ color: 0x3a3340 }), { pos: [x, .9, -13.85], outline: 1.2, edges: false });
  crane(H, -52, -20, 0xc9653f, Math.PI * .5 + .25); crane(H, 34, -22, 0xd8a640, Math.PI * .5 - .35); crane(H, 120, -22, 0xc9653f, Math.PI * .5);
  shed(H, -60, -40, 34, 14, 7, '#a65a4c', 0x5c6278); shed(H, -112, -44, 30, 12, 8, '#4f8a8b', 0x6d5a6e); shed(H, 62, -40, 36, 14, 6.5, '#c49a5c', 0x55607a); shed(H, 130, -42, 30, 14, 7, '#7a6a9a', 0x5c6278);
  // a breakwater with a red-and-white lighthouse at the harbour mouth
  put(H, new THREE.BoxGeometry(160, 3, 10), toon({ map: stone }), { pos: [-150, .5, 70], rot: [0, .5, 0], outline: 1.8 });
  const lh = new THREE.Group(); lh.position.set(-210, 2, 110); H.add(lh);
  const lt = tex(64, 256, (g, W, Hh) => { for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#f2ece0' : '#cc4a3e'; g.fillRect(0, i * Hh / 6, W, Hh / 6); } });
  put(lh, new THREE.CylinderGeometry(1.6, 2.4, 16, 20), toon({ map: lt }), { pos: [0, 8, 0], outline: 2, edges: false }); put(lh, new THREE.CylinderGeometry(1.9, 1.9, 2.4, 16), toon({ color: 0xffe6a8, emissive: 0x806030 }), { pos: [0, 17.2, 0], outline: 2, edges: false }); put(lh, new THREE.ConeGeometry(2.3, 2.2, 16), toon({ color: 0x3e3a4a }), { pos: [0, 19.5, 0], outline: 2, edges: false });
  // a red channel buoy and a mooring dolphin: near-camera accents for the wide
  const buoy = new THREE.Group(); buoy.position.set(62, 0, 52); H.add(buoy);
  const bt = tex(64, 64, (g, W, Hh) => { g.fillStyle = '#d0473c'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#f2ece0'; g.fillRect(0, Hh * .42, W, Hh * .16); });
  put(buoy, new THREE.CylinderGeometry(.9, 1.3, 2.4, 16), toon({ map: bt }), { pos: [0, .8, 0], outline: 2, edges: false }); put(buoy, new THREE.ConeGeometry(.75, 1.4, 16), toon({ color: 0xd0473c }), { pos: [0, 2.7, 0], outline: 2, edges: false });
  const dol = new THREE.Group(); dol.position.set(103, 0, 112); H.add(dol); const wood = toon({ color: 0x6f5040 });
  for (const [x, z, h] of [[0, 0, 3.0], [.9, .3, 2.5], [.3, .95, 2.8], [-.6, .6, 2.3]]) put(dol, new THREE.CylinderGeometry(.35, .4, h + 2, 10), wood, { pos: [x, h / 2 - 1, z], outline: 1.8, edges: false });
  put(dol, new THREE.TorusGeometry(.75, .13, 6, 18), toon({ color: 0xd8c08a }), { pos: [.2, 1.9, .45], rot: [Math.PI / 2, 0, 0], outline: 1.2, edges: false });
  // ships: the hero at the origin, three grey ships at the quay, two out in the roads
  const hero = buildShip({ seed: 1 }); H.add(hero.group);
  const others = [];
  for (const [x, z, ry, L, s] of [[-70, -4, 0, 38, 2], [62, -4, 0, 42, 3], [150, -4, 0, 36, 4], [-60, -150, -.4, 44, 5], [80, -230, .3, 40, 6], [-180, -60, .1, 40, 7]]) {
    const sh = buildShip({ L, seed: s, variant: s % 3 }); sh.group.position.set(x, 0, z); sh.group.rotation.y = ry; H.add(sh.group); others.push(sh); }
  // fog banks: soft camera-facing cards in the fog colour
  const ft = fogTex(), fogCards = [];
  for (const [x, y, z, w, h] of [[-10, 3, 30, 160, 26], [40, 2, -30, 220, 34], [-60, 4, -100, 300, 50], [70, 3, 10, 120, 20]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: ft, transparent: true, depthWrite: false, fog: false, color: 0xffffff }));
    m.position.set(x, y, z); m.userData.p0 = m.position.clone(); m.renderOrder = 5; H.add(m); fogCards.push(m); }
  return { group: H, hero, others, water, fogCards, quay,
    update(f, cam, fogColor, fogAmt) {   // f may be fractional (sub-frame blur)
      W.update(f);
      for (const m of fogCards) { m.position.x = m.userData.p0.x + f * .06; m.rotation.y = Math.atan2(cam.position.x - m.position.x, cam.position.z - m.position.z);
        m.material.color.copy(fogColor); m.material.opacity = fogAmt; m.visible = fogAmt > .01; }
      for (const s of [hero, ...others]) s.group.position.y = .05 * Math.sin(f * .06 + s.group.position.x);
    } };
}

/* ---------------- sky ---------------- */
export function buildSky() {
  const u = { cH: { value: new THREE.Color() }, cZ: { value: new THREE.Color() }, cG: { value: new THREE.Color() }, gDir: { value: new THREE.Vector3(-.6, .12, -1).normalize() }, gK: { value: .5 } };
  const m = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), new THREE.ShaderMaterial({ uniforms: u, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD;void main(){vD=(modelMatrix*vec4(position,0.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform vec3 cH,cZ,cG,gDir;uniform float gK;varying vec3 vD;
      void main(){vec3 d=normalize(vD);float h=d.y;vec3 c=mix(cH,cZ,smoothstep(.0,.6,h));float g=pow(max(dot(d,normalize(gDir)),0.),5.);c=mix(c,cG,g*gK*smoothstep(-.05,.15,h+.1));gl_FragColor=vec4(c,1.);}` }));
  m.renderOrder = -10; m.name = 'sky'; return { mesh: m, u };
}

/* ---------------- the painter's plank ---------------- */
// A board hung by two ropes from the deck edge, against the hero's starboard side. Returns where the painter's feet go.
export function buildPlank(ship, t, y) {
  const g = new THREE.Group(); ship.group.add(g);
  const p = ship.side(t, y), wood = toon({ color: 0xb98a58 }), z = p.z + .45;
  put(g, new THREE.BoxGeometry(3.0, .09, .42), wood, { pos: [p.x, y, z], outline: 2 });
  // ropes hang plumb from two short outrigger timbers at the deck edge
  for (const dx of [-1.25, 1.25]) { const tt = t + dx / ship.L, top = ship.side(tt, ship.deck(tt)), ry = top.y + .3;
    put(g, new THREE.CylinderGeometry(.035, .035, ry - y, 6), toon({ color: 0xd8c08a }), { pos: [p.x + dx, (y + ry) / 2, z], outline: 1.2, edges: false });
    put(g, new THREE.BoxGeometry(.14, .14, z - top.z + .5), wood, { pos: [p.x + dx, ry + .05, (z + top.z) / 2 - .1], outline: 1.4 }); }
  // a paint bucket on the plank: black paint inside
  const bk = new THREE.Group(); bk.position.set(p.x - .95, y + .045, z); g.add(bk);
  put(bk, new THREE.CylinderGeometry(.17, .14, .32, 16, 1, true), toon({ color: 0xc9cfd8, side: THREE.DoubleSide }), { pos: [0, .16, 0], outline: 1.6, edges: false });
  put(bk, new THREE.CircleGeometry(.16, 16), toon({ color: 0x24202c }), { pos: [0, .27, 0], rot: [-Math.PI / 2, 0, 0], outline: 0, edges: false });
  return { group: g, feet: new THREE.Vector3(p.x, y + .045, z) };
}

// shared with fleet.js (instanced fleets for D and F)
export { greyHullTex, dazzleHullTex, dazzleBlockTex, greyTex, dazzleFunnelTex, greyFunnelTex, hullGeo };
