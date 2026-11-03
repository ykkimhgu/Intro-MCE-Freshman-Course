import sys, os, hashlib
from PIL import Image
src, w, h, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
im = Image.open(src).convert("RGB"); W, H = im.size; r = w / h
if W / H > r: nw = round(H * r); im = im.crop(((W - nw) // 2, 0, (W - nw) // 2 + nw, H))
else: nh = round(W / r); im = im.crop((0, (H - nh) // 2, W, (H - nh) // 2 + nh))
im.save(out, quality=90)
