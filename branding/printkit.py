"""Print collateral, apparel and L300 decal files. All geometry in millimetres."""
from lib import *
import math
ROOT = '/home/claude/brand/out'
PREV = []  # (label, png) for preview sheet


def emit_print(folder, name, W, H, body, bleed, safe, dpi=300, bg=None, transparent=False, proof_dpi=None):
    """Writes: svg (editable), CMYK PDF (with bleed), 300 dpi PNG (with bleed), proof PNG with trim/safe guides."""
    d = f'{ROOT}/{folder}'
    s = svg(W, H, body, 'mm', bg)
    p = f'{d}/svg/{name}.svg'
    write(p, s)
    pdf_cmyk(p, f'{d}/{name}-CMYK.pdf')
    if dpi:
        png(p, f'{d}/{name}-{dpi}dpi.png', dpi=dpi)
    pp = f'{d}/proofs/{name}-proof.svg'
    write(pp, svg(W, H, body + (guides(W, H, bleed, safe) if bleed or safe else ''), 'mm', bg or (None if transparent else None)))
    pw = 1400 if max(W, H) > 120 else 900
    png(pp, f'{d}/proofs/{name}-proof.png', width=int(pw if W >= H else pw * W / H))
    os.remove(pp)
    PREV.append((name, f'{d}/proofs/{name}-proof.png'))

# ---------------- business card ----------------
def business_card():
    B, S = 3, 4
    TW, TH = 88.9, 50.8  # 3.5 x 2 in
    W, H = TW + 2 * B, TH + 2 * B
    # front: navy, official logo + tagline
    f = f'<rect width="{W}" height="{H}" fill="{NAVY}"/>' + rays(W * 0.92, H * 0.05, 4, 90, 18, opacity=0.08)
    f += logo('logo-horizontal-reversed', W / 2, H * 0.30, w=56, anchor='middle')
    f += T(W / 2, H * 0.76, TAGLINE, 3.6, GOLD, 700, 'middle')
    emit_print('02-print/business-card', 'business-card-front', W, H, f, B, S)
    # back: cream, character head + contact
    b = f'<rect width="{W}" height="{H}" fill="{WHITE}"/>' + f'<rect x="0" y="{H-11}" width="{W}" height="11" fill="{NAVY}"/>'
    b += bust('idle', B + S + 13, B + S + 14, 13.5)
    x = B + S + 31
    b += T(x, B + S + 7, 'Juan Dela Cruz', 4.4, NAVY, 900) + T(x, B + S + 12, 'Solar Consultant', 3, CHARCOAL, 600)
    b += show_title(x, B + S + 20, 3.4, on_dark=False)
    yy = B + S + 29
    for lab, val in [('Tel', CONTACT['phone']), ('Email', CONTACT['email']), ('FB / YT', CONTACT['page'])]:
        b += T(x, yy, lab, 2.5, GOLD, 800) + T(x + 11, yy, val, 2.8, CHARCOAL, 600); yy += 4.4
    b += logo('logo-horizontal-reversed', B + S, H - 8.6, h=5.6) + T(W - B - S, H - 4.7, TAGLINE, 2.6, GOLD, 700, 'end')
    emit_print('02-print/business-card', 'business-card-back', W, H, b, B, S)

# ---------------- flyer A4 ----------------
def flyer():
    B, S = 3, 10
    W, H = 210 + 2 * B, 297 + 2 * B
    b = f'<rect width="{W}" height="{H}" fill="{CREAM}"/>'
    b += f'<rect width="{W}" height="{H*0.43}" fill="{NAVY}"/>' + rays(W * 0.85, H * 0.06, 8, 260, 20, opacity=0.09)
    b += logo('logo-horizontal-reversed', B + S, B + S, h=17)
    b += T(B + S, 66, 'Gusto mo bang', 13, WHITE, 800) + T(B + S, 85, 'mag-solar', 19, GOLD, 900) + T(B + S, 104, 'nang klaro?', 19, GOLD, 900)
    b += T(B + S, 116, 'Walang hype. Tamang system', 5.4, WHITE, 600) + T(B + S, 123, 'para sa bahay mo.', 5.4, WHITE, 600)
    b += bust('wave', W - B - S - 42, 78, 42, scale=2.2)
    y = H * 0.43 + 17
    b += T(B + S, y, 'Bakit SoLight Solar PH?', 9, NAVY, 900); y += 15
    for t1, t2 in [('Tamang laki ng system', 'Batay sa kWh mo sa Meralco bill, hindi hula.'),
                   ('Grid-tied, hybrid o off-grid', 'Ipapaliwanag namin kung alin ang bagay sa iyo.'),
                   ('Net metering assistance', 'Tutulungan ka sa proseso ng net metering.'),
                   ('After-sales na maaasahan', 'Monitoring at serbisyo pagkatapos ng install.')]:
        b += f'<circle cx="{B+S+5}" cy="{y-2}" r="5" fill="{GOLD}"/>' + f'<path d="M{B+S+2.5},{y-2} l1.8,2 l3.2,-4" stroke="{NAVY}" stroke-width="1.3" fill="none" stroke-linecap="round"/>'
        b += T(B + S + 14, y, t1, 6.4, NAVY, 800) + T(B + S + 14, y + 6.5, t2, 4.6, CHARCOAL, 600); y += 16.5
    # CTA band
    cy = H - 78
    b += f'<rect x="{B+S}" y="{cy}" width="{W-2*B-2*S}" height="44" rx="6" fill="{NAVY}"/>'
    b += T(B + S + 8, cy + 13, 'MAG-MESSAGE PARA SA QUOTATION', 5.4, GOLD, 900)
    b += T(B + S + 8, cy + 24, CONTACT['phone'], 9.5, WHITE, 900)
    b += T(B + S + 8, cy + 33, f'FB / YouTube: {CONTACT["page"]}', 4.6, WHITE, 600)
    b += T(B + S + 8, cy + 39.5, CONTACT['email'], 4.6, WHITE, 600)
    qx = W - B - S - 40
    b += f'<rect x="{qx}" y="{cy+5}" width="34" height="34" rx="2" fill="{WHITE}"/>' + T(qx + 17, cy + 21, 'QR CODE', 3.6, CHARCOAL, 800, 'middle') + T(qx + 17, cy + 26, '(ilagay dito)', 2.8, CHARCOAL, 600, 'middle')
    b += f'<rect x="0" y="{H-28}" width="{W}" height="28" fill="{GOLD}"/>'
    b += show_title(B + S, H - B - 10, 8, on_dark=False, kuya=WHITE) + T(W - B - S, H - B - 10, TAGLINE, 5.4, NAVY, 800, 'end')
    emit_print('02-print/flyer', 'flyer-A4', W, H, b, B, S)

# ---------------- tarpaulin 6 x 3 ft ----------------
def tarp():
    B, S = 20, 50  # 20 mm bleed, 50 mm safe (grommets / hem)
    TW, TH = 1828.8, 914.4
    W, H = TW + 2 * B, TH + 2 * B
    b = f'<rect width="{W}" height="{H}" fill="{NAVY}"/>' + rays(W * 0.74, H * 0.2, 60, 2200, 24, opacity=0.07)
    b += tiles(-30, H * 0.66, 70, 30, 5, opacity=0.05)
    b += logo('logo-horizontal-reversed', B + S + 10, B + S + 10, h=150)
    b += T(B + S + 10, 420, 'Mag-solar', 150, WHITE, 900) + T(B + S + 10, 570, 'nang klaro.', 150, GOLD, 900)
    b += T(B + S + 14, 650, 'Grid-tied • Hybrid • Off-grid • Net metering', 46, WHITE, 700)
    b += pill(B + S + 10, 700, 820, 110, GOLD, CONTACT['phone'], 70, NAVY, 900)
    b += T(B + S + 14, 880, f'FB / YouTube: {CONTACT["page"]}   •   {TAGLINE}', 34, WHITE, 600)
    b += rays(W * 0.77, H * 0.46, 345, 420, 22, opacity=1)
    b += bust('wave', W * 0.77, H * 0.46, 330)
    emit_print('02-print/tarpaulin', 'tarpaulin-6x3ft', W, H, b, B, S, dpi=150)

# ---------------- roll-up standee 85 x 200 cm ----------------
def standee():
    B, S = 5, 40
    TW, TH = 850, 2000
    W, H = TW + 2 * B, TH + 2 * B
    b = f'<rect width="{W}" height="{H}" fill="{NAVY}"/>' + rays(W * 0.7, 640, 60, 1600, 22, opacity=0.08)
    b += logo('logo-horizontal-reversed', W / 2, 90, w=640, anchor='middle')
    b += T(W / 2, 450, 'Mag-solar', 115, WHITE, 900, 'middle') + T(W / 2, 570, 'nang klaro.', 115, GOLD, 900, 'middle')
    b += rays(W / 2, 1010, 300, 365, 22, opacity=1) + bust('idle', W / 2, 1010, 290)
    b += f'<rect x="0" y="1390" width="{W}" height="{H-1390}" fill="{WHITE}"/>'
    y = 1470
    for t in ['Grid-tied • Hybrid • Off-grid', 'Net metering assistance', 'After-sales monitoring']:
        b += T(W / 2, y, t, 44, NAVY, 800, 'middle'); y += 66
    b += pill(85, 1690, W - 170, 100, GOLD, CONTACT['phone'], 62, NAVY, 900)
    b += T(W / 2, 1830, TAGLINE, 40, NAVY, 700, 'middle')
    b += f'<rect x="0" y="{H-160}" width="{W}" height="160" fill="#cfd8e3"/>' + T(W / 2, H - 70, 'BOTTOM 150 mm HIDDEN IN STAND BASE: keep blank', 18, '#8090a0', 700, 'middle')
    emit_print('02-print/standee', 'rollup-standee-85x200cm', W, H, b, B, S, dpi=150)

# ---------------- sticker ----------------
def sticker():
    B = 3; D = 80; W = H = D + 2 * B
    b = f'<circle cx="{W/2}" cy="{H/2}" r="{D/2+B}" fill="{NAVY}"/>' + f'<circle cx="{W/2}" cy="{H/2}" r="{D/2-1.6}" fill="none" stroke="{GOLD}" stroke-width="1"/>'
    b += bust('idle', W / 2, H / 2 - 7, 22)
    b += show_title(W / 2, H / 2 + 24, 7.0, anchor='middle')
    b += T(W / 2, H / 2 + 30, TAGLINE, 3.0, GOLD, 700, 'middle')
    emit_print('02-print/sticker', 'sticker-80mm-round', W, H, b, B, 4)

# ---------------- dri-fit shirt ----------------
def shirt():
    # left chest: 90 mm wide official logo
    for col, kind in [('navy-shirt', 'logo-horizontal-reversed'), ('white-shirt', 'logo-horizontal-full-color')]:
        w = 90; lw, lh = logo_size(kind, w=w)
        emit_print('03-apparel-drifit', f'front-left-chest-90mm-{col}', w + 4, lh + 4, logo(kind, 2, 2, w=w), 0, 0, transparent=True)
        # back print 300 x 350 mm
        dark = col == 'navy-shirt'
        W, H = 300, 350
        b = rays(W / 2, 140, 118, 148, 15, opacity=1, start=160, sweep=220)
        b += bust('idle', W / 2, 140, 112)
        b += f'<rect x="20" y="236" width="{W-40}" height="18" fill="{GOLD}"/>' if False else ''
        b += show_title(W / 2, 296, 44, on_dark=dark, anchor='middle')
        b += T(W / 2, 322, TAGLINE, 17, GOLD if dark else NAVY, 800, 'middle')
        b += logo(kind, W / 2, 330, h=18, anchor='middle')
        emit_print('03-apparel-drifit', f'back-print-300x350mm-{col}', W, H, b, 0, 0, transparent=True)
        # sleeve: mark 70 mm
        k2 = 'mark-reversed' if dark else 'mark-full-color'
        emit_print('03-apparel-drifit', f'sleeve-mark-70mm-{col}', 74, 74, logo(k2, 2, 2, w=70), 0, 0, transparent=True)

def shirt_mockup():
    from lib import _load
    out = f'{ROOT}/03-apparel-drifit/mockups'
    def tee(x, y, fill, art):
        p = (f'M{x+150},{y} L{x+250},{y} Q{x+270},{y+30} {x+300},{y+30} Q{x+330},{y+30} {x+350},{y} L{x+450},{y} L{x+580},{y+110} '
             f'L{x+520},{y+190} L{x+470},{y+150} L{x+470},{y+620} L{x+130},{y+620} L{x+130},{y+150} L{x+80},{y+190} L{x+20},{y+110} Z')
        return f'<path d="{p}" fill="{fill}" stroke="#00000033" stroke-width="2"/>' + art
    def place_svg(path, x, y, w):
        s = open(path).read(); vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', s).group(1).split()]
        inner = re.sub(r'^.*?<svg[^>]*>', '', s, count=1, flags=re.S).rsplit('</svg>', 1)[0]
        k = w / vb[2]
        return f'<g transform="translate({x} {y}) scale({k})">{inner}</g>'
    sv = f'{ROOT}/03-apparel-drifit/svg'
    body = '<rect width="1300" height="1460" fill="#eef1f5"/>'
    for i, (col, fill) in enumerate([('navy-shirt', NAVY), ('white-shirt', '#fbfbfb')]):
        y0 = 60 + i * 700
        # 1 mm ~ 1.13 px at this mockup scale (shirt body ~ 340px ~ 52 cm chest)
        k = 340 / 520
        body += tee(30, y0, fill, place_svg(f'{sv}/front-left-chest-90mm-{col}.svg', 30 + 345, y0 + 140, 94 * k) +
                    place_svg(f'{sv}/sleeve-mark-70mm-{col}.svg', 30 + 515 - 74 * k * 0.45, y0 + 85, 74 * k * 0.9))
        body += tee(650, y0, fill, place_svg(f'{sv}/back-print-300x350mm-{col}.svg', 650 + 300 - 150 * k * 1.0 * 1, y0 + 120, 300 * k))
        body += T(330, y0 + 660, f'FRONT ({col.replace("-", " ")})', 22, CHARCOAL, 800, 'middle') + T(950, y0 + 660, 'BACK', 22, CHARCOAL, 800, 'middle')
    p = f'{out}/drifit-mockup.svg'; write(p, svg(1300, 1460, body)); png(p, f'{out}/drifit-mockup.png', width=1300); os.remove(p)
    PREV.append(('drifit-mockup', f'{out}/drifit-mockup.png'))

# ---------------- Mitsubishi L300 aluminium close van ----------------
# ASSUMED decal areas (shop must measure the actual unit before printing):
VAN = {
    'side_box': (2750, 1300),   # each side of the aluminium cargo box, flat area L x H
    'rear_doors': (1600, 1300), # both rear door leaves together W x H, split at centre
    'cab_door': (750, 450),     # lower panel of each cab door
    'windshield_strip': (1400, 180),  # top windshield banner (perforated/clear vinyl), optional
}

def van_side(front_left=True):
    W, H = VAN['side_box']; B = 25; S = 60
    W2, H2 = W + 2 * B, H + 2 * B
    b = f'<rect width="{W2}" height="{H2}" fill="{WHITE}"/>'
    # navy swoosh band at bottom + gold stripe
    b += f'<path d="M0,{H2*0.62} C{W2*0.35},{H2*0.52} {W2*0.65},{H2*0.78} {W2},{H2*0.6} L{W2},{H2} L0,{H2} Z" fill="{NAVY}"/>'
    b += f'<path d="M0,{H2*0.6} C{W2*0.35},{H2*0.5} {W2*0.65},{H2*0.76} {W2},{H2*0.58}" stroke="{GOLD}" stroke-width="28" fill="none"/>'
    cx = B + S + 330 if front_left else W2 - B - S - 330  # character at the cab (front) end
    b += rays(cx, H2 * 0.42, 340, 440, 20, opacity=1) + bust('idle', cx, H2 * 0.42, 330)
    tx = (B + S + 820) if front_left else (B + S + 40)
    b += logo('logo-horizontal-full-color', tx, B + S + 20, w=1500)
    b += T(tx + 10, B + S + 560, 'Solar para sa bahay at negosyo', 82, NAVY, 800)
    b += T(tx + 10, H2 - B - S - 200, CONTACT['phone'], 150, WHITE, 900)
    b += T(tx + 10, H2 - B - S - 90, f'FB / YouTube: {CONTACT["page"]}  •  {TAGLINE}', 50, GOLD, 700)
    return W2, H2, b, B, S

def van_rear():
    W, H = VAN['rear_doors']; B = 25; S = 60
    W2, H2 = W + 2 * B, H + 2 * B
    b = f'<rect width="{W2}" height="{H2}" fill="{NAVY}"/>' + rays(W2 / 2, 0, 60, 1400, 20, opacity=0.08)
    b += logo('logo-horizontal-reversed', W2 / 2, B + S + 20, w=1150, anchor='middle')
    b += T(W2 / 2, 620, 'Naka-solar ka na,', 90, WHITE, 900, 'middle') + T(W2 / 2, 730, 'SoSmart ka pa!', 110, GOLD, 900, 'middle')
    b += pill(W2 / 2 - 600, 830, 1200, 170, GOLD, CONTACT['phone'], 110, NAVY, 900)
    b += T(W2 / 2, 1150, f'FB / YouTube: {CONTACT["page"]}', 56, WHITE, 700, 'middle')
    b += f'<line x1="{W2/2}" y1="0" x2="{W2/2}" y2="{H2}" stroke="#e0115f" stroke-width="3" stroke-dasharray="30 20" opacity="0"/>'
    return W2, H2, b, B, S

def van_cab_door():
    W, H = VAN['cab_door']; B = 15; S = 40
    W2, H2 = W + 2 * B, H + 2 * B
    b = f'<rect width="{W2}" height="{H2}" fill="none"/>'
    b += logo('logo-horizontal-full-color', W2 / 2, B + S, w=W - 2 * S, anchor='middle')
    b += T(W2 / 2, H2 - B - S - 20, CONTACT['phone'], 64, NAVY, 900, 'middle')
    return W2, H2, b, B, S

def van_windshield():
    W, H = VAN['windshield_strip']; B = 10; S = 20
    W2, H2 = W + 2 * B, H + 2 * B
    b = f'<rect width="{W2}" height="{H2}" fill="{NAVY}"/>' + show_title(W2 / 2, H2 / 2 + 40, 110, anchor='middle')
    return W2, H2, b, B, S

def van():
    for name, fn in [('L300-side-LEFT-driver-2750x1300mm', lambda: van_side(True)), ('L300-side-RIGHT-2750x1300mm', lambda: van_side(False)),
                     ('L300-rear-doors-1600x1300mm', van_rear), ('L300-cab-door-750x450mm-x2', van_cab_door), ('L300-windshield-strip-1400x180mm', van_windshield)]:
        W2, H2, b, B, S = fn()
        emit_print('04-vehicle-L300-decal', name, W2, H2, b, B, S, dpi=0)
        # 1:10 preview PNG at 25 dpi of full size ~ 100dpi for 1:4. Keep a 72 dpi full-size raster for shops that want raster.
        png(f'{ROOT}/04-vehicle-L300-decal/svg/{name}.svg', f'{ROOT}/04-vehicle-L300-decal/{name}-72dpi.png', dpi=72)

if __name__ == '__main__':
    import sys
    which = sys.argv[1:] or ['card', 'flyer', 'tarp', 'standee', 'sticker', 'shirt', 'van']
    for w in which:
        {'card': business_card, 'flyer': flyer, 'tarp': tarp, 'standee': standee, 'sticker': sticker,
         'shirt': lambda: (shirt(), shirt_mockup()), 'van': van}[w]()
    import json; json.dump(PREV, open(f'/home/claude/brand/prev-{"-".join(which)}.json', 'w'))
    print('\n'.join(p for _, p in PREV))
