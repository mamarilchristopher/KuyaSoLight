"""'SOLAR PH pop' logo variants requested by CHRIS (26 Nov 2026).
The mark and the 'SoLight' wordmark paths are copied unchanged from the official SVGs;
only the thin spaced 'SOLAR PH' line is replaced by a bolder treatment, outlined to paths (Inter Black)."""
import re, os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

SRC = '/home/claude/kuya-solight-studio/assets/brand/logo/official/SVG'
OUT = '/home/claude/brand/out/00-logos/SOLAR-PH-pop-options'
NAVY, GOLD, WHITE = '#0B3B7A', '#F5AE0B', '#FFFFFF'
FONT = TTFont('/usr/share/fonts/opentype/inter/Inter-Black.otf')
GS = FONT.getGlyphSet(); CMAP = FONT.getBestCmap(); UPM = FONT['head'].unitsPerEm
CAP = FONT['OS/2'].sCapHeight


def text_path(s, x0, x1, cap_h, base_y, fill, anchor_full=True):
    """Outline `s` so its caps are cap_h tall and it spans x0..x1 exactly (letter-spaced)."""
    k = cap_h / CAP
    names = [CMAP[ord(c)] for c in s]
    adv = [GS[n].width * k for n in names]
    # spacing: distribute so first glyph starts at x0 and last glyph ink ends at x1
    nat = sum(adv[:-1]) + adv[-1]
    gap = (x1 - x0 - nat) / (len(s) - 1)
    out, x = [], x0
    for n, a in zip(names, adv):
        pen = SVGPathPen(GS)
        GS[n].draw(TransformPen(pen, (k, 0, 0, -k, x, base_y)))
        d = pen.getCommands()
        if d: out.append(d)
        x += a + gap
    return f'<path fill="{fill}" d="{" ".join(out)}"/>'


def load(name):
    s = open(f'{SRC}/{name}.svg').read()
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', s).group(1).split()]
    paths = re.findall(r'<path fill="[^"]+" d="[^"]+"/>', s)
    solar = paths[-1]
    body = s.replace(solar, '')
    return body, vb


def variant(name, style, box):
    """box = (x0, y0, x1, y1) of the original SOLAR PH line."""
    body, vb = load(name)
    x0, y0, x1, y1 = box
    rev = 'reversed' in name or 'white' in name
    extra, grow = '', 0
    if style == 'bold':  # big bold gold caps, full wordmark width
        cap = (y1 - y0) * 2.0; grow = cap - (y1 - y0)
        extra = text_path('SOLAR PH', x0 + 2, x1 - 2, cap, y1 + grow, GOLD)
    elif style == 'goldbar':  # gold bar, navy caps
        h = (y1 - y0) * 2.5; top = y0 - (y1 - y0) * 0.3; grow = top + h - y1
        cap = h * 0.6
        extra = (f'<rect x="{x0}" y="{top}" width="{x1-x0}" height="{h}" rx="{h*0.22}" fill="{GOLD}"/>' +
                 text_path('SOLAR PH', x0 + h * 0.35, x1 - h * 0.35, cap, top + h / 2 + cap / 2, NAVY))
    elif style == 'navybar':  # navy bar, gold caps (white bar + navy caps on reversed)
        h = (y1 - y0) * 2.5; top = y0 - (y1 - y0) * 0.3; grow = top + h - y1
        cap = h * 0.6
        bar, txt = (WHITE, NAVY) if rev else (NAVY, GOLD)
        extra = (f'<rect x="{x0}" y="{top}" width="{x1-x0}" height="{h}" rx="{h*0.22}" fill="{bar}"/>' +
                 text_path('SOLAR PH', x0 + h * 0.35, x1 - h * 0.35, cap, top + h / 2 + cap / 2, txt))
    nvb = f'{vb[0]:.2f} {vb[1]:.2f} {vb[2]:.2f} {vb[3] + max(grow, 0) + 2:.2f}'
    body = re.sub(r'viewBox="[^"]+"', f'viewBox="{nvb}"', body, count=1)
    body = re.sub(r'width="[^"]+" height="[^"]+"', f'width="{vb[2]:.2f}" height="{vb[3] + max(grow, 0) + 2:.2f}"', body, count=1)
    body = body.replace('</svg>', extra + '</svg>')
    return body

BOX = {'logo-horizontal': (257.0, 170.8, 735.8, 198.5), 'logo-stacked': (-87.1, 376.5, 307.2, 400.5)}

if __name__ == '__main__':
    import cairosvg
    os.makedirs(f'{OUT}/SVG', exist_ok=True); os.makedirs(f'{OUT}/PNG', exist_ok=True)
    made = []
    for style in ['bold', 'goldbar', 'navybar']:
        for lay in ['logo-horizontal', 'logo-stacked']:
            for col in ['full-color', 'reversed']:
                n = f'solight-{lay}-{col}'
                s = variant(n, style, BOX[lay])
                p = f'{OUT}/SVG/{n}-SOLARPH-{style}.svg'; open(p, 'w').write(s)
                cairosvg.svg2png(url=p, write_to=f'{OUT}/PNG/{n}-SOLARPH-{style}-2400w.png' if lay == 'logo-horizontal' else f'{OUT}/PNG/{n}-SOLARPH-{style}-1600w.png',
                                 output_width=2400 if lay == 'logo-horizontal' else 1600)
                made.append(p)
    print(len(made))
