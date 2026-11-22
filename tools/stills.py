#!/usr/bin/env python3
"""Exact frames as stills, optionally as 2x2 montages.

  python3 tools/stills.py <video> <outdir> 30 100 150 185 [--w 1280] [--montage]
Frame numbers are 0-based at --fps (30). Writes f<frame>.png, and m-<first>.jpg per 4 with --montage.
"""
import sys, os, subprocess, argparse
ap = argparse.ArgumentParser()
ap.add_argument("video"); ap.add_argument("out"); ap.add_argument("frames", type=int, nargs="+")
ap.add_argument("--w", type=int, default=1280); ap.add_argument("--fps", type=float, default=30)
ap.add_argument("--montage", action="store_true")
a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
ps = []
for f in a.frames:
    p = os.path.join(a.out, f"f{f}.png"); ps.append(p)
    subprocess.check_call(["ffmpeg","-v","error","-y","-ss",f"{f/a.fps:.4f}","-i",a.video,"-frames:v","1","-vf",f"scale={a.w}:-2",p])
if a.montage:
    for i in range(0, len(ps), 4):
        g = ps[i:i+4]
        if len(g) < 4: break
        ins = sum((["-i", p] for p in g), [])
        m = os.path.join(a.out, f"m-{a.frames[i]}.jpg")
        subprocess.check_call(["ffmpeg","-v","error","-y",*ins,"-filter_complex","xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0","-q:v","3",m])
        print(m)
