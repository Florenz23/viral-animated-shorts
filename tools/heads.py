# python tools/heads.py <frame_pattern {:04d}> <first> <step> <n> <out.json> [--sheet out.png]
# Finds bean heads (the white, low-saturation, roundish blobs of the cast) and reports each one's
# height as a share of the frame height. Rules (720x1280): min channel > .74, saturation < .14,
# area >= 500 px with holes (eyes, mouth) of 25 px or more, bbox h/w .55-1.7 and fill >= .5
# The blob must be ringed by ink (>= 30 % of a 5 px ring darker than .38), and blobs under 48 px
# in rows 740-990 are caption letters. (A face over 30000 px cropped by the frame edge counts whatever its shape).
import sys, json, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
pat, a, st, n, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
sheet = sys.argv[sys.argv.index('--sheet') + 1] if '--sheet' in sys.argv else None
rows, thumbs = [], []
for i in range(n):
    f = a + i * st; im = Image.open(pat.format(f)).convert('RGB').resize((720, 1280)); c = np.asarray(im, np.float32) / 255
    mx, mn = c.max(-1), c.min(-1); sat = (mx - mn) / np.maximum(mx, 1e-6)
    m = (mn > .74) & (sat < .14); m = ndi.binary_opening(m, iterations=2)
    lab, k = ndi.label(m); heads = []
    for j, sl in enumerate(ndi.find_objects(lab), 1):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start; area = (lab[sl] == j).sum()
        comp = lab[sl] == j; holes = (ndi.binary_fill_holes(comp) & ~comp).sum()   # eyes and mouth are holes in a face
        big = area > 30000                                                          # a close-up face cropped by the frame edge
        if area < 500 or holes < 25 or holes > .5 * area: continue
        if not big and (not (.55 <= h / w <= 1.7) or area / (h * w) < .5): continue
        cy = (sl[0].start + sl[0].stop) / 2
        if h < 48 and 740 <= cy <= 990: continue                                   # a caption letter (o, a, e), not a face
        Y0, Y1, X0, X1 = max(0, sl[0].start - 6), sl[0].stop + 6, max(0, sl[1].start - 6), sl[1].stop + 6
        full = np.zeros(m.shape, bool); full[sl] = comp
        ring = ndi.binary_dilation(full[Y0:Y1, X0:X1], iterations=5) & ~full[Y0:Y1, X0:X1]
        if (mx[Y0:Y1, X0:X1][ring] < .38).mean() < .3: continue                     # a face is ringed by ink; sky and walls are not
        heads.append(dict(y=sl[0].start, x=sl[1].start, h=int(h), w=int(w), hs=round(h / 1280, 3)))
    heads.sort(key=lambda d: -d['h']); rows.append(dict(f=f, heads=heads))
    if sheet:
        d = ImageDraw.Draw(im)
        for hd in heads: d.rectangle([hd['x'], hd['y'], hd['x'] + hd['w'], hd['y'] + hd['h']], outline=(255, 0, 255), width=6)
        d.rectangle([0, 0, 120, 50], fill=(0, 0, 0)); d.text((6, 6), str(i), fill=(255, 255, 0)); thumbs.append(im.resize((144, 256)))
json.dump(rows, open(out, 'w'))
if sheet:
    o = Image.new('RGB', (1440, 256 * ((len(thumbs) + 9) // 10)))
    for i, t in enumerate(thumbs): o.paste(t, ((i % 10) * 144, (i // 10) * 256))
    o.save(sheet)
print(len(rows), 'samples ->', out)
