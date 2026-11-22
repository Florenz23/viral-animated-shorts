#!/usr/bin/env python3
"""Contact sheets of EVERY frame of a time range, frame number on each tile.

  python3 tools/sheets.py <video> <outdir> --from 0 --to 30 \
      [--per 2] [--cols 10] [--tw 200] [--step 1] [--fps 30]

--per   seconds per sheet (2 s = 60 tiles at 30 fps)
--step  1 = every frame. Anything else is sampling and the sheet says so.
Writes <outdir>/sheet-<from>s.jpg … one per --per seconds.
"""
import sys, os, subprocess, argparse
import numpy as np
from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument("video"); ap.add_argument("out")
ap.add_argument("--from", dest="t0", type=float, default=0)
ap.add_argument("--to", dest="t1", type=float, default=30)
ap.add_argument("--per", type=float, default=2); ap.add_argument("--cols", type=int, default=10)
ap.add_argument("--tw", type=int, default=200); ap.add_argument("--step", type=int, default=1)
ap.add_argument("--fps", type=float, default=30)
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
tw = a.tw; th = round(tw*9/16/2)*2
f0 = round(a.t0*a.fps); f1 = round(a.t1*a.fps)
raw = subprocess.run(["ffmpeg","-v","error","-ss",f"{a.t0}","-i",a.video,"-frames:v",str(f1-f0),
    "-an","-vf",f"scale={tw}:{th}:flags=area","-pix_fmt","rgb24","-f","rawvideo","-"],
    stdout=subprocess.PIPE, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, th, tw, 3)
per = round(a.per*a.fps)
for s in range(0, len(fr), per):
    idx = list(range(s, min(s+per, len(fr)), a.step))
    rows = -(-len(idx)//a.cols)
    sheet = Image.new("RGB", (a.cols*tw, rows*th), (20,20,20))
    d = ImageDraw.Draw(sheet)
    for k, i in enumerate(idx):
        x, y = (k % a.cols)*tw, (k//a.cols)*th
        sheet.paste(Image.fromarray(fr[i]), (x, y))
        lab = str(f0+i)
        d.rectangle([x, y, x+7*len(lab)+4, y+12], fill=(0,0,0))
        d.text((x+2, y), lab, fill=(255,255,0))
    p = os.path.join(a.out, f"sheet-{(f0+s)/a.fps:06.1f}s.jpg")
    sheet.save(p, quality=85); print(p)
