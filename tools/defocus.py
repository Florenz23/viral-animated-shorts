# python tools/defocus.py <frames_glob> <out.json> [band_y0 band_y1] [--maps dir]
# Depth of field on every frame, read as a blur MAP rather than a guess about which object is the subject.
# Per edge: contrast-free blur sigma by the re-blur gradient ratio (Zhuo & Sim 2011): a Gaussian step of
# sigma s has gradient peak ~1/s, re-blurred by s0 ~1/sqrt(s^2+s0^2), so R=G/G_re gives s=s0/sqrt(R^2-1).
# Calibrated on synthetic steps: reads 1.3/1.7/2.2/3.1/4.1/6.0 for true 1/1.5/2/3/4/6 px (a 3 px ink line reads 0.7).
# Edges: gradient peaks with G>.006 and local contrast >.05 (13 px window), so blurred background
# still counts (a G>.02 gate silently dropped it and made every frame read "all sharp").
# Per 40 px cell: gradient-weighted median sigma of its edges (>= 8 edges, else no data).
# sharp cell < 1.4 px, soft cell > 2.5 px. Caption band rows skipped (default 768-947 at 1280 high).
import sys, glob, json, os, numpy as np
from PIL import Image
from scipy import ndimage as ndi
from multiprocessing import Pool
A = [a for a in sys.argv[1:] if not a.startswith('--')]
b0, b1 = (int(A[2]), int(A[3])) if len(A) > 3 else (768, 948)
MAPS = sys.argv[sys.argv.index('--maps') + 1] if '--maps' in sys.argv else None
S0, CELL = 2.0, 40; Y = np.array([.2126, .7152, .0722])
def grad(l): return np.hypot(ndi.sobel(l, 0), ndi.sobel(l, 1)) / 8
def wmed(v, w):
    o = np.argsort(v); c = np.cumsum(w[o]); return float(v[o][np.searchsorted(c, c[-1] / 2)])
def frame(p):
    rgb = np.asarray(Image.open(p).convert('RGB')); l = (rgb.astype(np.float64) @ Y) / 255; H, W = l.shape
    G = grad(ndi.gaussian_filter(l, .5)); G2 = grad(ndi.gaussian_filter(l, np.hypot(.5, S0)))
    lb = ndi.gaussian_filter(l, 1); rng = ndi.maximum_filter(lb, 13) - ndi.minimum_filter(lb, 13)
    edge = (G > .006) & (G >= ndi.maximum_filter(G, 3)) & (rng > .05)
    edge[b0:b1] = False; edge[:4] = edge[-4:] = False; edge[:, :4] = edge[:, -4:] = False
    R = G / np.maximum(G2, 1e-6); s = np.clip(S0 / np.sqrt(np.maximum(R ** 2 - 1, 1e-6)), 0, 12)
    ys, xs = np.nonzero(edge); sv, gv = s[edge], G[edge]
    ny, nx = -(-H // CELL), -(-W // CELL); M = np.full((ny, nx), np.nan)
    k = (ys // CELL) * nx + xs // CELL
    for c in np.unique(k):
        m = k == c
        if m.sum() >= 8: M.flat[c] = wmed(sv[m], gv[m])
    v = M[~np.isnan(M)]
    sharp, soft = (v < 1.4), (v > 2.5)
    r = dict(f=os.path.basename(p), cells=int(v.size), sharp=round(float(sharp.mean()), 3) if v.size else 0,
             soft=round(float(soft.mean()), 3) if v.size else 0,
             s_soft=round(float(np.median(v[soft])), 2) if soft.any() else None,
             s_rest=round(float(np.median(v[~sharp])), 2) if (~sharp).any() else None,
             s_p90=round(float(np.percentile(v, 90)), 2) if v.size else None,
             map=[[None if np.isnan(x) else round(float(x), 1) for x in row] for row in M])
    if MAPS:
        ov = rgb.copy().astype(np.float64)
        for i in range(ny):
            for j in range(nx):
                x = M[i, j]
                if np.isnan(x): continue
                col = np.array((40, 230, 60)) if x < 1.4 else (np.array((240, 60, 50)) if x > 2.5 else np.array((240, 200, 40)))
                ov[i*CELL:(i+1)*CELL, j*CELL:(j+1)*CELL] = ov[i*CELL:(i+1)*CELL, j*CELL:(j+1)*CELL] * .55 + col * .45
        Image.fromarray(np.concatenate([rgb, ov.astype(np.uint8)], 1)).resize((W, H // 2)).save(f'{MAPS}/{os.path.basename(p)}')
    return r
if __name__ == '__main__':
    P = sorted(glob.glob(A[0]))
    if MAPS: os.makedirs(MAPS, exist_ok=True)
    with Pool(8) as pool: rows = pool.map(frame, P, chunksize=8)
    json.dump(rows, open(A[1], 'w')); print(len(rows), 'frames ->', A[1])
