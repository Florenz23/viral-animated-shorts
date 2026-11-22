# python3 lookstats.py <dir with NNNN.png> f1 f2 ...  — per frame: C1 brightness/contrast, C2 p2/p98, C3 saturation, C4 warm-cool split, C5 vignette
import sys, numpy as np
from PIL import Image
D = sys.argv[1]
print('frame  lum   std   p2    p98   sat   split  cen-edge')
for f in map(int, sys.argv[2:]):
    c = np.asarray(Image.open(f'{D}/{f:04d}.png').convert('RGB'), np.float32) / 255
    l = c @ np.array([.2126, .7152, .0722], np.float32); mx = c.max(-1); mn = c.min(-1); sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    m = np.ones(l.shape, bool); m[860:935, 60:660] = False     # caption band
    hi = (l > np.percentile(l[m], 80)) & m; lo = (l < np.percentile(l[m], 20)) & m; rb = c[..., 0] - c[..., 2]
    cen = np.zeros(l.shape, bool); cen[320:960, 180:540] = True
    print(f'{f:5d}  {l[m].mean():.2f}  {l[m].std():.2f}  {np.percentile(l[m],2):.2f}  {np.percentile(l[m],98):.2f}  {sat[m].mean():.2f}  {rb[hi].mean()-rb[lo].mean():+.2f}  {l[cen&m].mean()-l[~cen&m].mean():+.2f}')
