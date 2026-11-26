"""Kuya SoLight brand kit helpers: SVG building blocks. The official logo SVGs are
inlined unchanged (only wrapped in a positioning <g>); character A1 comes from the
studio rig export in /home/claude/brand/char."""
import re, os, subprocess, cairosvg

LOGO = '/home/claude/kuya-solight-studio/assets/brand/logo/official/SVG'
CHAR = '/home/claude/brand/char'
NAVY, GOLD, WHITE, CREAM, CHARCOAL = '#0B3B7A', '#F5AE0B', '#FFFFFF', '#FFF8E8', '#243443'
NAVY_D = '#082C5C'  # darker navy for depth (tint of brand navy)
SKY = '#E8F0FA'
FONT = "Inter"
TAGLINE = 'Life is SoLight with Solar.'
CONTACT = {
    'phone': '0917 XXX XXXX',            # placeholder: CHRIS to confirm
    'email': 'hello@solight.ph',          # placeholder: CHRIS to confirm
    'page': 'SoLight Solar PH',           # FB page / YouTube channel name
    'handle': '@KuyaSoLight',             # placeholder: CHRIS to confirm TikTok handle
    'area': 'Solar para sa bahay at negosyo',
}

_cache = {}

def _load(path):
    if path not in _cache:
        s = open(path).read()
        vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', s).group(1).split()]
        inner = re.sub(r'^.*?<svg[^>]*>', '', s, count=1, flags=re.S)
        inner = re.sub(r'</svg>\s*$', '', inner.strip())
        inner = re.sub(r'<title>.*?</title>', '', inner, flags=re.S)
        _cache[path] = (vb, inner)
    return _cache[path]


def logo(kind, x, y, w=None, h=None, anchor='start'):
    """kind e.g. 'logo-horizontal-full-color', 'mark-reversed', 'logo-stacked-one-color-white'."""
    vb, inner = _load(f'{LOGO}/solight-{kind}.svg')
    s = (w / vb[2]) if w else (h / vb[3])
    W = vb[2] * s
    if anchor == 'middle': x -= W / 2
    elif anchor == 'end': x -= W
    return f'<g transform="translate({x:.2f} {y:.2f}) scale({s:.5f}) translate({-vb[0]} {-vb[1]})">{inner}</g>'


def logo_size(kind, w=None, h=None):
    vb, _ = _load(f'{LOGO}/solight-{kind}.svg')
    s = (w / vb[2]) if w else (h / vb[3])
    return vb[2] * s, vb[3] * s

# Character crop box in rig coordinates (600x1500 local box, feet at y=1200)
CBOX = (-150, 110, 900, 1160)  # x, y, w, h

_cid = [0]
def bust(pose, cx, cy, r, bg=GOLD, scale=2.1, dy=0.05):
    """Head-and-shoulders of A1 inside a circle of radius r centred (cx, cy), clipped."""
    _cid[0] += 1; i = f'bc{_cid[0]}'
    h = r * scale  # height of the HEAD crop box
    crop = (40, 150, 520, 520)
    w = char_w(h, crop)
    g = char(pose, cx - w / 2, cy - r * (1 - dy) - h * 0.02, h, crop=crop)
    return (f'<clipPath id="{i}"><circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}"/></clipPath>'
            f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}" fill="{bg}"/><g clip-path="url(#{i})">{g}</g>')


def char(pose, x, y, h, flip=False, crop=None):
    """Place character A1 with the crop box's top-left at (x, y) scaled to height h."""
    inner = re.sub(r'^<svg[^>]*>|</svg>$', '', open(f'{CHAR}/{pose}.svg').read())
    bx, by, bw, bh = crop or CBOX
    s = h / bh
    if flip:
        return f'<g transform="translate({x + bw * s:.2f} {y:.2f}) scale({-s:.5f} {s:.5f}) translate({-bx} {-by})">{inner}</g>'
    return f'<g transform="translate({x:.2f} {y:.2f}) scale({s:.5f}) translate({-bx} {-by})">{inner}</g>'


def char_w(h, crop=None):
    bx, by, bw, bh = crop or CBOX
    return bw * h / bh


def T(x, y, s, size, fill=NAVY, weight=800, anchor='start', ls=0, extra=''):
    s = s.replace('&', '&amp;').replace('<', '&lt;')
    fam = {900: 'Inter Black', 800: 'Inter ExtraBold', 700: 'Inter', 600: 'Inter SemiBold'}.get(weight, 'Inter')
    fw = 'bold' if weight == 700 else 'normal'
    return (f'<text x="{x:.2f}" y="{y:.2f}" font-family="{fam}" font-weight="{fw}" font-size="{size:.2f}" '
            f'fill="{fill}" text-anchor="{anchor}" letter-spacing="{ls}" {extra}>{s}</text>')


from PIL import ImageFont
_FF = {900: 'Black', 800: 'ExtraBold', 700: 'Bold', 600: 'SemiBold'}
def measure(s, size, weight=800):
    f = ImageFont.truetype(f'/usr/share/fonts/opentype/inter/Inter-{_FF.get(weight, "Bold")}.otf', 200)
    return f.getlength(s) * size / 200


def show_title(x, y, size, on_dark=True, anchor='start', kuya=GOLD):
    """'Kuya SoLight' show lockup typeset in Inter Black (separate from the official company logo)."""
    c2 = WHITE if on_dark else NAVY
    w1 = measure('Kuya', size, 900) + size * 0.27; w = w1 + measure('SoLight', size, 900)
    if anchor == 'middle': x -= w / 2
    elif anchor == 'end': x -= w
    return T(x, y, 'Kuya', size, kuya, 900) + T(x + w1, y, 'SoLight', size, c2, 900)


def rays(cx, cy, r0, r1, n=16, width=None, color=GOLD, opacity=0.18, start=0, sweep=360):
    out = []
    import math
    width = width or (r1 - r0) * 0.12
    for i in range(n):
        a = math.radians(start + sweep * (i + 0.5) / n)
        da = math.radians(sweep / n * 0.28)
        p = [(cx + r0 * math.cos(a - da * 0.4), cy + r0 * math.sin(a - da * 0.4)),
             (cx + r1 * math.cos(a - da), cy + r1 * math.sin(a - da)),
             (cx + r1 * math.cos(a + da), cy + r1 * math.sin(a + da)),
             (cx + r0 * math.cos(a + da * 0.4), cy + r0 * math.sin(a + da * 0.4))]
        out.append('<polygon points="' + ' '.join(f'{px:.1f},{py:.1f}' for px, py in p) + '"/>')
    return f'<g fill="{color}" opacity="{opacity}">' + ''.join(out) + '</g>'


def tiles(x, y, cell, cols, rows, color=WHITE, opacity=0.06, gap=None):
    """Rounded-square panel motif (echo of the logo's solar cells) as a background texture."""
    gap = gap if gap is not None else cell * 0.2
    r = cell * 0.15
    out = [f'<rect x="{x + c*(cell+gap):.1f}" y="{y + rr*(cell+gap):.1f}" width="{cell:.1f}" height="{cell:.1f}" rx="{r:.1f}"/>'
           for rr in range(rows) for c in range(cols)]
    return f'<g fill="{color}" opacity="{opacity}">' + ''.join(out) + '</g>'


def pill(x, y, w, h, fill=GOLD, text='', size=None, tcolor=NAVY, weight=800, anchor='middle'):
    size = size or h * 0.5
    t = T(x + w / 2, y + h / 2 + size * 0.36, text, size, tcolor, weight, 'middle') if text else ''
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{h/2:.1f}" fill="{fill}"/>' + t


def svg(w, h, body, unit='', bg=None):
    bgr = f'<rect x="0" y="0" width="{w}" height="{h}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}{unit}" height="{h}{unit}" viewBox="0 0 {w} {h}">'
            f'{bgr}{body}</svg>')


def write(path, s):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w').write(s)


def png(svg_path, out, width=None, dpi=None):
    if dpi:
        cairosvg.svg2png(url=svg_path, write_to=out, dpi=dpi)
        from PIL import Image
        im = Image.open(out); im.load(); im.save(out, dpi=(dpi, dpi))
    else:
        cairosvg.svg2png(url=svg_path, write_to=out, output_width=width)


def pdf_cmyk(svg_path, out):
    """Vector PDF (fonts embedded) converted to DeviceCMYK with Ghostscript."""
    tmp = out + '.rgb.pdf'
    cairosvg.svg2pdf(url=svg_path, write_to=tmp)
    subprocess.run(['gs', '-q', '-dNOPAUSE', '-dBATCH', '-dSAFER', '-sDEVICE=pdfwrite',
                    '-sColorConversionStrategy=CMYK', '-sProcessColorModel=DeviceCMYK',
                    '-dEmbedAllFonts=true', '-dSubsetFonts=true', '-dCompatibilityLevel=1.6',
                    f'-sOutputFile={out}', tmp], check=True)
    os.remove(tmp)


def guides(W, H, bleed, safe, unit_label='mm'):
    """Overlay for proof images only: trim (red), safe (cyan dashed)."""
    return (f'<rect x="{bleed}" y="{bleed}" width="{W-2*bleed}" height="{H-2*bleed}" fill="none" stroke="#e0115f" stroke-width="{max(W,H)/900:.3f}"/>'
            f'<rect x="{bleed+safe}" y="{bleed+safe}" width="{W-2*bleed-2*safe}" height="{H-2*bleed-2*safe}" fill="none" stroke="#00a3d9" stroke-width="{max(W,H)/1200:.3f}" stroke-dasharray="{max(W,H)/150:.2f} {max(W,H)/300:.2f}"/>')
