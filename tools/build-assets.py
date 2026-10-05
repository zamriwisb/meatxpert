"""Turn the client's raw files into web assets.

Run from the project root:  python3 tools/build-assets.py
Reads  WEBSITE RAW FILES/   writes  assets/products/, assets/brand/, assets/media/
Needs Pillow, plus macOS `sips` for the HEIC tallow shots.
"""
import os, subprocess, tempfile
from PIL import Image, ImageOps

RAW = 'WEBSITE RAW FILES/website jenis daging'
OUT = 'assets/products'

# slug -> source files, primary (white-background where there is one) first
P = {
 'tomahawk': ['TOMAHAWK/Copy of EOSR2759.JPG', 'TOMAHAWK/Copy of EOSR2706.JPG'],
 't-bone': ['TBONE/Copy of T-BONE.JPG'],
 'porterhouse': ['PORTERHOUSE/Copy of porterhouse.JPG', 'PORTERHOUSE/Copy of EOSR2676.JPG'],
 'picanha': ['PICANHA/Copy of EOSR2765.JPG', 'PICANHA/Copy of EOSR2714.JPG'],
 'flat-iron': ['FLAT IRON/Copy of EOSR2769.JPG', 'FLAT IRON/Copy of EOSR2745.JPG'],
 'topside-steak': ['TOPSIDE STEAK/Copy of EOSR2777.JPG', 'TOPSIDE STEAK/Copy of EOSR2751.JPG'],
 'chuck-eye': ['CHUCK EYE/Copy of CHUCK EYE.JPG'],
 'petite-tender': ['PETITE TENDER/Copy of PETITE TENDER.JPG'],
 'oyster-blade': ['OYSTER BLADE/Copy of OYSTER BLADE.JPG'],
 'flank': ['FLANK/Copy of EOSR2763.JPG', 'FLANK/Copy of EOSR2695.JPG'],
 'skirt': ['SKIRT/Copy of SKIRT.JPG'],
 'brisket': ['BRISKET/Copy of BRISKET.JPG', 'BRISKET/Copy of EOSR3130.JPG', 'BRISKET/Copy of EOSR3140.JPG'],
 'short-ribs': ['SHORT RIBS/Copy of SHORT RIBS(1).JPG', 'SHORT RIBS/Copy of SHORT RIBS.JPG'],
 'chuck': ['CHUCK/Copy of CHUCK.JPG'],
 'chuck-tender': ['CHUCK TENDER/Copy of chuck tender.JPG'],
 'blade-whole': ['BLADE WHOLE/Copy of BLADE WHOLE.JPG'],
 'eye-round': ['EYE AROUND/Copy of EOSR2772.JPG', 'EYE AROUND/Copy of EOSR2738.JPG'],
 'eye-of-knuckle': ['EYE OF KNUCKLE/Copy of EOSR2775.JPG', 'EYE OF KNUCKLE/Copy of EOSR2740.JPG'],
 'shin-shank': ['SHIN SHANK/Copy of shin shank.JPG'],
 'beef-cubes': ['BEEF CUBE/Copy of beef cube.JPG', 'BEEF CUBE/Copy of R_HF4877.JPG'],
 'tetel': ['TETEL/Copy of R_HF4884.JPG'],
 'trimming': ['TRIMMING/Copy of TRIMMING.JPG'],
 'soup-bone': ['SOUP BONE/Copy of Soup Bone.JPG', 'SOUP BONE/Copy of R_HF4783.JPG'],
 'lamb-rack': ['LAMB RACK/Copy of EOSR2939.JPG'],
 'lamb-loin': ['LAMB LOIN/Copy of R_HF4801.JPG', 'LAMB LOIN/Copy of EOSR2986.JPG'],
 'lamb-ribs': ['LAMB RIBS/Copy of Lamb Ribs.JPG', 'LAMB RIBS/Copy of EOSR2971.JPG'],
 'lamb-shank': ['LAMB SHANK/Copy of lamb shank(1).JPG', 'LAMB SHANK/Copy of lamb shank.JPG'],
 'lamb-neck': ['LAMB NECK/Copy of R_HF4773.JPG', 'LAMB NECK/Copy of lamb neck.JPG'],
 'lamb-flap': ['LAMB FLAP/Copy of LAMB FLAP.JPG', 'LAMB FLAP/Copy of EOSR2966.JPG'],
 'lamb-skirt-roll': ['LAMB SKIRT ROLL/Copy of lamb skirt roll.JPG', 'LAMB SKIRT ROLL/Copy of EOSR2979.JPG'],
 'lamb-leg-steak': ['LAMB STEAK LEG/Copy of EOSR2983.JPG'],
 'lamb-shoulder-steak': ['LAMB STEAK SHOULDER/Copy of LAMB STEAK SHOULDER.JPG'],
 'yakiniku': ['YAKINIKU/Copy of EOSR2779.JPG', 'YAKINIKU/Copy of EOSR2729.JPG'],
 'shabu-shabu': ['SHABU SHABU/Copy of Shabu-Shabu6 (1).jpg', 'SHABU SHABU/Copy of KUM03256.JPG'],
 'skewers': ['SKEWER/Copy of Skewer7.jpg', 'SKEWER/Copy of Skewer.jpg'],
 'marinated-steak': ['STIK PERAP/Copy of Marinate Beef1.jpg', 'STIK PERAP/Copy of KUM03266.JPG'],
 'meatballs': ['MEATBALL/Copy of Meatball2.jpg'],
 'sausages': ['SAUSAGE/Copy of EOSR2638.JPG', 'SAUSAGE/Copy of EOSR2632.JPG'],
 'beef-patties': ['BEEF PATTY/Copy of EOSR2589.JPG', 'BEEF PATTY/Copy of EOSR2596.JPG'],
 'beef-tallow': ['BEEF TALLOW/Copy of IMG_0550.HEIC', 'BEEF TALLOW/Copy of IMG_0569.HEIC'],
 'wagyu-tallow': ['WAGYU BEEF TALLOW/Copy of IMG_0619.HEIC'],
}

ASPECT = 4 / 3   # every product image is 4:3, so cards and galleries line up


def load(path):
    if path.lower().endswith('.heic'):
        tmp = tempfile.mktemp(suffix='.jpg')
        subprocess.run(['sips', '-s', 'format', 'jpeg', path, '--out', tmp],
                       check=True, capture_output=True)
        path = tmp
    return ImageOps.exif_transpose(Image.open(path)).convert('RGB')


def subject_box(im):
    """Bounding box of whatever differs from the backdrop, on a light shot."""
    small = im.copy(); small.thumbnail((600, 600))
    w, h = small.size
    corners = [small.getpixel(p) for p in ((4, 4), (w - 5, 4), (4, h - 5), (w - 5, h - 5))]
    bright = sum(sum(c) for c in corners) / (len(corners) * 3)
    if bright < 175:
        return None                      # dark styled shot: keep the whole scene
    bg = [sum(c[i] for c in corners) / 4 for i in range(3)]
    px = small.load(); xs = []; ys = []
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            r, g, b = px[x, y]
            if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) > 70 and r > g + 18:
                xs.append(x); ys.append(y)
    if len(xs) < 50:
        return None
    xs.sort(); ys.sort()
    k = len(xs) // 200                   # ignore stray specks
    s = im.width / w
    return (xs[k] * s, ys[k] * s, xs[-k - 1] * s, ys[-k - 1] * s)


def frame(im):
    W, H = im.size
    box = subject_box(im)
    if box:
        x0, y0, x1, y1 = box
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        bw, bh = (x1 - x0) * 1.5, (y1 - y0) * 1.5      # breathing room round the cut
        if bw / bh < ASPECT: bw = bh * ASPECT
        else: bh = bw / ASPECT
        bw = max(bw, W * 0.45); bh = bw / ASPECT
        bw = min(bw, W, H * ASPECT); bh = bw / ASPECT
    else:
        cx, cy = W / 2, H / 2
        bw = min(W, H * ASPECT); bh = bw / ASPECT
    x0 = min(max(cx - bw / 2, 0), W - bw); y0 = min(max(cy - bh / 2, 0), H - bh)
    return im.crop((int(x0), int(y0), int(x0 + bw), int(y0 + bh)))


os.makedirs(OUT + '/thumb', exist_ok=True)
for slug, files in P.items():
    for n, f in enumerate(files, 1):
        im = frame(load(os.path.join(RAW, f)))
        big = im.copy(); big.thumbnail((1400, 1050), Image.LANCZOS)
        big.save(f'{OUT}/{slug}-{n}.jpg', quality=80, optimize=True, progressive=True)
        th = im.copy(); th.thumbnail((640, 480), Image.LANCZOS)
        th.save(f'{OUT}/thumb/{slug}-{n}.jpg', quality=78, optimize=True, progressive=True)
    print(slug, len(files))

# ---- brand: the logo, trimmed of its 7500px square canvas
os.makedirs('assets/brand', exist_ok=True)
logo = Image.open('WEBSITE RAW FILES/LOGO/LOGO MXP.png').convert('RGBA')
alpha = logo.split()[3]
if alpha.getextrema()[0] == 255:         # no transparency: key out the white
    g = logo.convert('L').point(lambda v: 255 if v < 235 else 0)
    bbox = g.getbbox()
else:
    bbox = alpha.getbbox()
logo = logo.crop(bbox)
logo.thumbnail((1200, 1200), Image.LANCZOS)
logo.save('assets/brand/meatxpert-logo.png', optimize=True)
r, g_, b, a = logo.split()
white = Image.merge('RGBA', (r.point(lambda v: 255), g_.point(lambda v: 255), b.point(lambda v: 255), a))
white.save('assets/brand/meatxpert-logo-white.png', optimize=True)
print('logo', logo.size, 'alpha' if alpha.getextrema()[0] < 255 else 'opaque')
