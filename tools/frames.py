#!/usr/bin/env python3
"""Per-frame measurements of a video, every frame, no sampling.

  python3 tools/frames.py <video> <outdir> [--w 320 --h 180]

Decodes every frame to a small RGB proxy (ffmpeg, area filter) and writes
<outdir>/frames.csv with one row per frame:

  f        frame index (0-based), t = f / fps
  mad      mean absolute difference to the previous frame, luma, 0..255
  chg      share of pixels whose luma moved by more than 8 levels
  dx, dy   global shift vs the previous frame in proxy px (phase correlation)
  pk       phase-correlation peak, 0..1 — how well ONE shift explains the frame
  zoom     scale change vs previous frame, from the 4 quadrants' shifts
           (1.000 = none; >1 = pushing in)
  luma     mean luma 0..255        con   luma standard deviation
  sat      mean HSV saturation 0..1
  yel      share of pixels that are highlight-yellow

numpy only. The proxy is kept at <outdir>/proxy.rgb so other tools reuse it.
"""
import sys, os, subprocess, argparse
import numpy as np

def proxy(video, out, w, h):
    p = os.path.join(out, f"proxy{w}.rgb")
    if not os.path.exists(p):
        subprocess.check_call(["ffmpeg","-v","error","-y","-i",video,"-an","-vf",
            f"scale={w}:{h}:flags=area","-pix_fmt","rgb24","-f","rawvideo",p])
    return p

def phase(a, b, win):
    """shift (dx,dy) that maps a onto b, and the peak height."""
    A = np.fft.rfft2(a*win); B = np.fft.rfft2(b*win)
    R = A.conj()*B; R /= np.abs(R)+1e-9
    c = np.fft.irfft2(R, s=a.shape)
    i = np.unravel_index(np.argmax(c), c.shape)
    pk = c[i]
    h, w = a.shape
    y, x = i
    # sub-pixel: parabola through the peak's neighbours
    def sub(m1, m0, p1):
        d = (m1 - 2*m0 + p1)
        return 0.0 if abs(d) < 1e-9 else 0.5*(m1 - p1)/d
    sx = sub(c[y,(x-1)%w], c[y,x], c[y,(x+1)%w])
    sy = sub(c[(y-1)%h,x], c[y,x], c[(y+1)%h,x])
    dy = y + sy; dx = x + sx
    if dy > h/2: dy -= h
    if dx > w/2: dx -= w
    return dx, dy, float(pk)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video"); ap.add_argument("out")
    ap.add_argument("--w", type=int, default=320); ap.add_argument("--h", type=int, default=180)
    ap.add_argument("--start", type=int, default=0); ap.add_argument("--end", type=int, default=-1)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    w, h = a.w, a.h
    mm = np.memmap(proxy(a.video, a.out, w, h), dtype=np.uint8, mode="r").reshape(-1, h, w, 3)
    n = len(mm) if a.end < 0 else min(a.end, len(mm))
    win = np.outer(np.hanning(h), np.hanning(w))
    qh, qw = h//2, w//2
    qwin = np.outer(np.hanning(qh), np.hanning(qw))
    quads = [(0,0),(0,qw),(qh,0),(qh,qw)]
    # quadrant centres relative to frame centre
    qc = np.array([[-qw/2,-qh/2],[qw/2,-qh/2],[-qw/2,qh/2],[qw/2,qh/2]])
    rows = []; prev = None
    for f in range(a.start, n):
        rgb = mm[f].astype(np.float32)
        r, g, b = rgb[...,0], rgb[...,1], rgb[...,2]
        y = 0.299*r + 0.587*g + 0.114*b
        mx = rgb.max(-1); mn = rgb.min(-1)
        sat = np.where(mx > 0, (mx-mn)/np.maximum(mx,1), 0).mean()
        yel = ((r > 200) & (g > 170) & (b < 120) & (r-b > 110)).mean()
        if prev is None:
            row = (f, 0, 0, 0, 0, 1, 1, y.mean(), y.std(), sat, yel)
        else:
            d = np.abs(y - prev)
            dx, dy, pk = phase(prev, y, win)
            # zoom: each quadrant's own shift minus the global one, projected
            # on the line from the centre — positive = moving outward = push in
            zs = []
            for (oy, ox), c in zip(quads, qc):
                qx, qy, qp = phase(prev[oy:oy+qh, ox:ox+qw], y[oy:oy+qh, ox:ox+qw], qwin)
                if qp > 0.05:
                    zs.append(((qx-dx)*c[0] + (qy-dy)*c[1]) / (c[0]**2 + c[1]**2))
            zoom = 1 + (float(np.median(zs)) if len(zs) >= 3 else 0.0)
            row = (f, d.mean(), (d > 8).mean(), dx, dy, pk, zoom, y.mean(), y.std(), sat, yel)
        rows.append(row); prev = y
    np.savetxt(os.path.join(a.out, "frames.csv"), np.array(rows), delimiter=",",
        header="f,mad,chg,dx,dy,pk,zoom,luma,con,sat,yel", comments="",
        fmt=["%d","%.3f","%.4f","%.2f","%.2f","%.3f","%.4f","%.2f","%.2f","%.4f","%.4f"])
    print(f"{len(rows)} frames -> {a.out}/frames.csv")

if __name__ == "__main__":
    main()
