"""Anima el flux del sistema àzigos sobre la il·lustració generada. Ús: anim_azigos.py SRC OUTDIR"""
import sys, math, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
src, outdir = sys.argv[1:3]
base = Image.open(src).convert('RGB')
A = np.asarray(base).astype(np.float32)
r, g, b = A[..., 0], A[..., 1], A[..., 2]
blue = (b > r + 70) & (b > 140)
H, W = blue.shape
yy, xx = np.mgrid[0:H, 0:W]
# Venes intercostals: blau fora dels troncs principals
trunk = (np.abs(xx - 447) < 16) | (np.abs(xx - 593) < 16) | ((xx > 225) & (xx < 315)) | (yy < 265) & (xx > 290) & (xx < 480)
trunk |= (np.abs(yy - 576) < 10) & (xx > 430) & (xx < 610) | (np.abs(yy - 277) < 10) & (xx > 440) & (xx < 600)
inter = blue & ~trunk & (yy > 60) & (yy < 900)
inter = np.asarray(Image.fromarray((inter * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
dist = np.abs(xx - 520).astype(np.float32)

def poly(pts):
    seg = [math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    return pts, seg, sum(seg)
def at(p, s):
    pts, seg, L = p
    s = max(0, min(s, L - 1e-6))
    for i, d in enumerate(seg):
        if s <= d:
            f = s / d; return (pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f)
        s -= d
    return pts[-1]
TAIL = [(452, 450), (455, 300), (452, 255), (445, 215), (425, 186), (400, 177), (372, 182), (350, 200), (330, 224), (300, 246), (284, 262), (283, 400), (281, 560), (262, 640), (245, 700)]
P_az = poly([(444, 880), (447, 600)] + TAIL)
P_hl = poly([(595, 880), (594, 600), (590, 577), (520, 576), (450, 577)])
P_hu = poly([(562, 160), (565, 225), (572, 262), (560, 277), (458, 277)])
P_ci = poly([(276, 1010), (276, 900), (272, 830), (255, 760), (245, 710)])

N = 72                      # fotogrames del bucle (3 s a 24 fps)
SP = 96                     # separació entre gotes
font = ImageFont.truetype('/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf', 30)
fnum = ImageFont.truetype('/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf', 30)

def label(d, box_xy, text, anchor, fill='white', fg=(59, 69, 64), border=(59, 69, 64)):
    x, y = box_xy
    tw = d.textlength(text, font=font); w, h = tw + 28, 46
    cx = min(max(anchor[0], x), x + w); cy = min(max(anchor[1], y), y + h)
    d.line([(cx, cy), anchor], fill=border, width=3)
    d.ellipse([anchor[0] - 5, anchor[1] - 5, anchor[0] + 5, anchor[1] + 5], fill=border)
    d.rounded_rectangle([x, y, x + w, y + h], radius=12, fill=fill, outline=border, width=3)
    d.text((x + 14, y + h / 2), text, font=font, fill=fg, anchor='lm')
def num(d, c, n):
    d.ellipse([c[0] - 24, c[1] - 24, c[0] + 24, c[1] + 24], fill=(62, 128, 76), outline='white', width=4)
    d.text(c, str(n), font=fnum, fill='white', anchor='mm')

def frame(t):
    ph = t / N
    # brillantor que avança cap a la columna per les intercostals
    f = 0.5 + 0.5 * np.sin(2 * np.pi * (dist / 110.0 + ph * 2))
    f = (f ** 6)[..., None] * inter[..., None] * 0.75
    img = A * (1 - f) + np.array([200, 235, 255], np.float32) * f
    im = Image.fromarray(img.clip(0, 255).astype(np.uint8))
    # aurícula que "batega"
    d = ImageDraw.Draw(im, 'RGBA')
    beat = 0.5 + 0.5 * math.cos(2 * math.pi * ph * 2)
    d.ellipse([175, 625, 320, 790], fill=(90, 140, 230, int(40 + 60 * beat)))
    for p, col in ((P_az, (25, 45, 140)), (P_hl, (25, 45, 140)), (P_hu, (25, 45, 140)), (P_ci, (70, 90, 170))):
        L = p[2]; n = max(1, round((L + SP) / SP)); sp = (L + SP) / n
        off = ph * sp * 3       # el patró es repeteix exactament al final del bucle
        k = 0
        while k < n:
            s = (k * sp + off) % (L + SP) - SP / 2
            k += 1
            if s < 0 or s > L: continue
            x, y = at(p, s)
            fade = min(1, s / 40, (L - s) / 40)
            rr = 8
            d.ellipse([x - rr - 2, y - rr - 2, x + rr + 2, y + rr + 2], fill=(255, 255, 255, int(230 * fade)))
            d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=col + (int(255 * fade),))
    d = ImageDraw.Draw(im)
    label(d, (18, 395), 'Cava superior', (269, 420))
    label(d, (18, 540), 'Cor', (190, 690))
    label(d, (18, 930), 'Cava inferior', (262, 950))
    label(d, (300, 690), 'Àzigos', (437, 712), fill=(46, 93, 159), fg='white', border=(46, 93, 159))
    label(d, (690, 640), 'Hemiàzigos', (603, 660))
    label(d, (690, 420), 'Aorta', (575, 440), border=(170, 60, 50), fg=(170, 60, 50))
    label(d, (690, 18), 'Venes intercostals', (640, 150))
    num(d, (368, 352), 1); num(d, (480, 520), 2); num(d, (360, 140), 3)
    return im

frames = [frame(t) for t in range(N)]
for i, fr in enumerate(frames): fr.save(f'{outdir}/f{i:03d}.png')
frames[N // 3].convert('RGB').save(f'{outdir}/poster.jpg', quality=92)
