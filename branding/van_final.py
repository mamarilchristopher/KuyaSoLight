"""FINAL L300 FB-body decal: Option B Sunrise (CHRIS picked 26 Nov 2026 19:53 Manila).
Left side (driver, front on the left), right side (front on the right, drafted on the mirrored photo),
rear panel (assumed, no rear photo yet), cab doors x2."""
from lib import *
import van_fb as v
import base64, subprocess, os
OUT = '/home/claude/brand/out/04-vehicle-L300-decal/FINAL-B-Sunrise'
W, H, K, LOW = v.W, v.H, v.K, v.LOW
SUN2 = '#FFC53D'


def geom(side):
    if side == 'LEFT':
        return v.WIN, v.ARCH
    win = [(W - x - w, y, w, h) for x, y, w, h in v.WIN]
    ax, ay, ar = v.ARCH
    return win, (W - ax, ay, ar)


def holes_d(side):
    win, (ax, ay, ar) = geom(side)
    d = ''
    for x, y, w, h in win:
        r = 40
        d += f'M{x+r},{y} H{x+w-r} Q{x+w},{y} {x+w},{y+r} V{y+h-r} Q{x+w},{y+h} {x+w-r},{y+h} H{x+r} Q{x},{y+h} {x},{y+h-r} V{y+r} Q{x},{y} {x+r},{y} Z '
    d += f'M{ax-ar},{ay} A{ar},{ar} 0 0 1 {ax+ar},{ay} Z'
    return d


def sunrise(side):
    L = side == 'LEFT'
    win, (ax, ay, ar) = geom(side)
    sx = W if L else 0                      # sun rises from the REAR bottom corner
    b = f'<rect width="{W}" height="{H}" fill="{CREAM}"/>'
    b += rays(sx, H, 700, 3400, 28, color=GOLD, opacity=0.35, start=180 if L else 270, sweep=90)
    r1, r2 = (640, 520) if L else (560, 450)
    b += f'<circle cx="{sx}" cy="{H}" r="{r1}" fill="{GOLD}"/><circle cx="{sx}" cy="{H}" r="{r2}" fill="{SUN2}"/>'
    b += f'<rect x="0" y="{H-120}" width="{W}" height="120" fill="{NAVY}"/>'
    bx = 380 if L else W - 380              # Kuya at the FRONT (cab) end
    b += rays(bx, LOW + 420, 300, 380, 20, opacity=1) + bust('idle', bx, LOW + 420, 290, bg=SUN2)
    if L:
        b += logo('logo-horizontal-full-color', 760, LOW + 40, h=250)
        b += T(765, LOW + 450, CONTACT['phone'], 125, NAVY, 900)
        rx = ax + ar + 50
        b += T(rx, LOW + 150, 'Solar para sa', 66, NAVY, 900) + T(rx, LOW + 235, 'bahay at negosyo', 66, NAVY, 900)
        b += T(rx, LOW + 330, TAGLINE, 44, NAVY, 800)
        b += T(40, H - 40, f'FB / YouTube: {CONTACT["page"]}  •  TikTok: {CONTACT["handle"]}', 46, GOLD, 800)
    else:
        b += logo('logo-horizontal-full-color', W - 760, LOW + 40, h=250, anchor='end')
        b += T(W - 765, LOW + 450, CONTACT['phone'], 125, NAVY, 900, 'end')
        rx = ax - ar - 50
        b += T(rx, LOW + 110, 'Solar para sa', 62, NAVY, 900, 'end') + T(rx, LOW + 190, 'bahay at negosyo', 62, NAVY, 900, 'end')
        b += T(rx, LOW + 270, TAGLINE, 40, NAVY, 800, 'end')
        b += T(W - 40, H - 40, f'FB / YouTube: {CONTACT["page"]}  •  TikTok: {CONTACT["handle"]}', 46, GOLD, 800, 'end')
    return b


# Rear: no rear photo yet. Assumed printable area on the rear door below the window.
RW, RH = 1500, 650

def rear():
    b = f'<rect width="{RW}" height="{RH}" fill="{CREAM}"/>'
    b += rays(RW / 2, RH, 300, 1800, 22, color=GOLD, opacity=0.35, start=180, sweep=180)
    b += f'<circle cx="{RW/2}" cy="{RH}" r="230" fill="{GOLD}"/><circle cx="{RW/2}" cy="{RH}" r="185" fill="{SUN2}"/>'
    b += logo('logo-horizontal-full-color', RW / 2, 40, h=190, anchor='middle')
    b += T(RW / 2, 330, 'Naka-solar ka na, SoSmart ka pa!', 62, NAVY, 900, 'middle')
    b += f'<rect x="0" y="{RH-120}" width="{RW}" height="120" fill="{NAVY}"/>'
    b += T(RW / 2, RH - 35, CONTACT['phone'], 92, WHITE, 900, 'middle')
    return b


def cab():
    return logo('logo-horizontal-full-color', v.CW / 2, 15, h=v.CH - 30, anchor='middle')


def mockup(side):
    s = 1 / K
    raw = open(v.PHOTO, 'rb').read()
    if side == 'RIGHT':
        flip = OUT + '/tmp-flop.png'
        subprocess.run(['convert', v.PHOTO, '-flop', flip], check=True); raw = open(flip, 'rb').read(); os.remove(flip)
    img = f'<image xlink:href="data:image/png;base64,{base64.b64encode(raw).decode()}" x="0" y="0" width="852" height="568"/>'
    bx = v.BX if side == 'LEFT' else 852 - 754
    cx = v.CX if side == 'LEFT' else 852 - v.CX - v.CW / K
    clip = (f'<clipPath id="b"><rect x="{bx}" y="{v.BY}" width="{W*s}" height="{H*s}" rx="2"/></clipPath>'
            f'<clipPath id="h"><path transform="translate({bx} {v.BY}) scale({s})" d="{holes_d(side)}"/></clipPath>')
    label = 'B · Sunrise: LEFT side (driver)' if side == 'LEFT' else 'B · Sunrise: RIGHT side (photo mirrored)'
    out = (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="852" height="568" viewBox="0 0 852 568">'
           f'{img}{clip}<g clip-path="url(#b)"><g transform="translate({bx} {v.BY}) scale({s})">{sunrise(side)}</g><g opacity="0.12">{img}</g></g>'
           f'<g clip-path="url(#h)">{img}</g><g transform="translate({cx} {v.CY}) scale({s})">{cab()}</g>'
           f'<rect x="0" y="500" width="852" height="68" fill="{WHITE}"/>'
           f'<text x="426" y="545" font-family="Inter Black" font-size="28" fill="{NAVY}" text-anchor="middle">{label}</text></svg>')
    p = f'{OUT}/mockups/L300-sunrise-{side}-mockup.svg'; write(p, out); png(p, p.replace('.svg', '.png'), width=1704); os.remove(p)
    return p.replace('.svg', '.png')


def production():
    B = 25
    for side in ['LEFT', 'RIGHT']:
        body = (f'<g transform="translate({B} {B})">{sunrise(side)}</g>'
                f'<path transform="translate({B} {B})" fill="none" stroke="#e0115f" stroke-width="4" stroke-dasharray="30 18" d="{holes_d(side)}"/>')
        n = f'L300-sunrise-side-{side}-{W}x{H}mm'
        p = f'{OUT}/svg/{n}.svg'; write(p, svg(W + 2 * B, H + 2 * B, body, 'mm'))
        pdf_cmyk(p, f'{OUT}/{n}-CMYK.pdf'); png(p, f'{OUT}/{n}-72dpi.png', dpi=72)
    p = f'{OUT}/svg/L300-sunrise-rear-{RW}x{RH}mm.svg'
    write(p, svg(RW + 2 * B, RH + 2 * B, f'<g transform="translate({B} {B})">{rear()}</g>', 'mm'))
    pdf_cmyk(p, f'{OUT}/L300-sunrise-rear-{RW}x{RH}mm-CMYK.pdf'); png(p, f'{OUT}/L300-sunrise-rear-{RW}x{RH}mm-72dpi.png', dpi=72)
    p = f'{OUT}/svg/L300-cab-door-logo-{v.CW}x{v.CH}mm-print-x2.svg'
    write(p, svg(v.CW, v.CH, cab(), 'mm')); pdf_cmyk(p, f'{OUT}/L300-cab-door-logo-{v.CW}x{v.CH}mm-print-x2-CMYK.pdf')

if __name__ == '__main__':
    os.makedirs(f'{OUT}/mockups', exist_ok=True)
    m = [mockup('LEFT'), mockup('RIGHT')]
    production()
    print('\n'.join(m))
