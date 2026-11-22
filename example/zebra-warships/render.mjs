// node render.mjs index.html <outdir> range a b [--mp4 out/name.mp4]   → <outdir>/0000.png … (frame numbers), optional mp4 (with vo/voice.mp3 if you add one)
// node render.mjs index.html <outdir> frames f1 f2 …                   → <outdir>/NNNN.png for those frames only
// The mp4 takes frames a..b at 30 fps; if vo/voice.mp3 exists it is cut at a/30 s (frame 0 = audio 0 s).
// Serves this folder over http (ES modules do not load from file://). Adapted from our earlier study harness.
import { chromium } from 'playwright'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), mi = args.indexOf('--mp4'), mp4 = mi >= 0 ? args.splice(mi, 2)[1] : null;
const [page, out, mode, ...rest] = args; fs.mkdirSync(out, { recursive: true });
const T = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(root)) { r.writeHead(403); return r.end(); }
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 720, height: 1280 } }); let errs = 0;
p.on('pageerror', e => { errs++; console.log('ERR', e.message); }); p.on('console', m => m.type() === 'error' && (errs++, console.log('CONSOLE', m.text()))); p.on('requestfailed', r => console.log('FAILED', r.url())); p.on('response', r => r.status() >= 400 && console.log('HTTP', r.status(), r.url()));
let fatal = null; p.on('pageerror', e => { if (!fatal) fatal = e.message; });
await p.goto(`http://127.0.0.1:${srv.address().port}/${page}`);
for (let i = 0; i < 600 && !(await p.evaluate('!!window.__ready')); i++) { if (fatal) { console.log('page failed to load:', fatal); process.exit(1); } await new Promise(r => setTimeout(r, 200)); }
const n = f => String(f).padStart(4, '0'); const shot = async f => { await p.evaluate(f => window.__paint(f), +f); await p.screenshot({ path: `${out}/${n(f)}.png`, clip: { x: 0, y: 0, width: 720, height: 1280 } }); };
const frames = mode === 'range' ? Array.from({ length: +rest[1] - +rest[0] + 1 }, (_, i) => +rest[0] + i) : rest.map(Number);
const t0 = Date.now(); for (const f of frames) await shot(f); const ms = (Date.now() - t0) / frames.length;
console.log(`${frames.length} frames, ${ms.toFixed(0)} ms/frame, ${errs} page errors`);
await b.close(); srv.close();
if (mp4 && mode === 'range') { const a = +rest[0], z = +rest[1]; fs.mkdirSync(path.dirname(mp4), { recursive: true });
  const vo = path.join(root, 'vo/voice.mp3');   // your own voice-over (not shipped); without it the mp4 is silent
  const audio = fs.existsSync(vo) ? ['-ss', (a / 30).toFixed(4), '-t', ((z - a + 1) / 30).toFixed(4), '-i', vo] : [];
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '30', '-start_number', String(a), '-i', `${out}/%04d.png`, ...audio,
    '-map', '0:v', ...(audio.length ? ['-map', '1:a', '-c:a', 'aac', '-b:a', '192k'] : []), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '14', '-r', '30', '-frames:v', String(z - a + 1), mp4], { stdio: 'inherit' });
  console.log('wrote', mp4); }
