#!/usr/bin/env python3
"""Our video against the reference, every frame.

  python3 tools/compare.py <ours.mp4> <ref.mp4> <outdir> [--frames 900] [--w 320 --h 180]
                                     [--sheet 0 30] [--mask x0,y0,x1,y1 ...] [--ref-from FRAME]

Decodes both at 30 fps to WxH RGB and writes <outdir>/compare.csv:
  f, mad      mean absolute difference of the two frames (0-255)
  dmad        |ours change to previous frame - reference change to previous frame|
              (motion that is in one and not in the other: a cut or push on a different frame)
  luma_o/r    mean luma of ours / of the reference
  sat_o/r     mean HSV saturation
Prints the mean, the ten worst frames and every stretch above 1.5x the median.
--sheet A B writes side-by-side contact sheets (ref | ours) for seconds A..B, every frame,
2 s per sheet, into <outdir>/cmp-NNNN.Ns.jpg.
--mask (shares of the frame) leaves a region out of mad, e.g. a card interior holding a stand-in clip.
"""
import argparse, os, subprocess
import numpy as np
from PIL import Image, ImageDraw


def decode(path, n, w, h, start=0):
    # start > 0: select by frame number (exact; a -ss seek can land a frame off)
    vf = (f"select='between(n\\,{start}\\,{start + n - 1})'," if start else "fps=30,") + f"scale={w}:{h}:flags=area+accurate_rnd+full_chroma_int+full_chroma_inp"
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-frames:v", str(n), "-vsync", "0", "-vf", vf,
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], check=True, stdout=subprocess.PIPE).stdout
    a = np.frombuffer(raw, dtype=np.uint8)
    return a.reshape(-1, h, w, 3)


def sat(a):
    mx = a.max(axis=-1).astype(np.float32); mn = a.min(axis=-1).astype(np.float32)
    return float(np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0).mean())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ours"); ap.add_argument("ref"); ap.add_argument("outdir")
    ap.add_argument("--frames", type=int, default=900)
    ap.add_argument("--w", type=int, default=320); ap.add_argument("--h", type=int, default=180)
    ap.add_argument("--sheet", nargs=2, type=float)
    ap.add_argument("--mask", nargs="*", default=[])
    ap.add_argument("--ref-from", type=int, default=0, help="reference frame where our frame 0 sits (a demo of a later stretch)")
    a = ap.parse_args()
    os.makedirs(a.outdir, exist_ok=True)
    O = decode(a.ours, a.frames, a.w, a.h); R = decode(a.ref, a.frames, a.w, a.h, a.ref_from)
    n = min(len(O), len(R))
    keep = np.ones((a.h, a.w), dtype=bool)
    for m in a.mask:
        x0, y0, x1, y1 = [float(v) for v in m.split(",")]
        keep[int(y0 * a.h):int(y1 * a.h), int(x0 * a.w):int(x1 * a.w)] = False
    rows = []
    for f in range(n):
        o = O[f].astype(np.int16); r = R[f].astype(np.int16)
        mad = float(np.abs(o - r)[keep].mean())
        if f:
            co = float(np.abs(o - O[f - 1].astype(np.int16)).mean()); cr = float(np.abs(r - R[f - 1].astype(np.int16)).mean())
        else:
            co = cr = 0.0
        lo = float((O[f] @ np.array([.299, .587, .114])).mean()); lr = float((R[f] @ np.array([.299, .587, .114])).mean())
        rows.append((f, mad, abs(co - cr), lo, lr, sat(O[f]), sat(R[f]), co, cr))
    with open(os.path.join(a.outdir, "compare.csv"), "w") as fh:
        fh.write("f,mad,dmad,luma_o,luma_r,sat_o,sat_r,chg_o,chg_r\n")
        for r in rows:
            fh.write("%d,%.2f,%.2f,%.1f,%.1f,%.3f,%.3f,%.2f,%.2f\n" % r)
    mad = np.array([r[1] for r in rows]); dm = np.array([r[2] for r in rows])
    print(f"frames {n}  mad mean {mad.mean():.2f} median {np.median(mad):.2f}  dmad mean {dm.mean():.2f}")
    print(f"luma ours {np.mean([r[3] for r in rows]):.1f} ref {np.mean([r[4] for r in rows]):.1f}   sat ours {np.mean([r[5] for r in rows]):.3f} ref {np.mean([r[6] for r in rows]):.3f}")
    print("worst mad  :", " ".join(f"f{i}:{mad[i]:.0f}" for i in np.argsort(-mad)[:10]))
    print("worst dmad :", " ".join(f"f{i}:{dm[i]:.0f}" for i in np.argsort(-dm)[:12]))
    thr = 1.5 * np.median(mad); runs = []; s = None
    for f in range(n + 1):
        hot = f < n and mad[f] > thr
        if hot and s is None: s = f
        if not hot and s is not None:
            if f - s >= 3: runs.append((s, f - 1, float(mad[s:f].mean())))
            s = None
    print(f"stretches above {thr:.1f}:", " ".join(f"f{x}-{y}({m:.0f})" for x, y, m in runs))
    if a.sheet:
        tw, th = 192, 108
        f0, f1 = int(a.sheet[0] * 30), min(n, int(a.sheet[1] * 30))
        for s0 in range(f0, f1, 60):
            fr = list(range(s0, min(s0 + 60, f1)))
            cols = 5; rws = (len(fr) + cols - 1) // cols
            sh = Image.new("RGB", (cols * (tw * 2 + 6), rws * (th + 2)), "black")
            d = ImageDraw.Draw(sh)
            for i, f in enumerate(fr):
                x = (i % cols) * (tw * 2 + 6); y = (i // cols) * (th + 2)
                sh.paste(Image.fromarray(R[f]).resize((tw, th)), (x, y)); sh.paste(Image.fromarray(O[f]).resize((tw, th)), (x + tw + 1, y))
                d.text((x + 3, y + 2), str(f), fill="yellow")
            sh.save(os.path.join(a.outdir, f"cmp-{s0 / 30:06.1f}s.jpg"), quality=85)


if __name__ == "__main__":
    main()
