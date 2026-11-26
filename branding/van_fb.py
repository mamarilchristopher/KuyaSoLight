"""L300 FB body (passenger body with windows) decal options, drafted on CHRIS's photo.
Scale: photo vehicle length 680 px = 4,260 mm published L300 FB length -> 6.26 mm/px (estimate)."""
from lib import *
import math, sys
PHOTO = '/home/claude/brand/ref/l300-fb-side.png'
ROOT = '/home/claude/brand/out/04-vehicle-L300-decal/FB-body-options'
K = 6.26  # mm per photo px
BX, BY = 326, 168  # rear body top-left in photo px
W, H = round((754 - 326) * K), round((386 - 168) * K)  # 2679 x 1365 mm
WIN = [((368 - BX) * K, (172 - BY) * K, (525 - 368) * K, (250 - 172) * K),
       ((561 - BX) * K, (172 - BY) * K, (713 - 561) * K, (250 - 172) * K)]
ARCH = ((586 - BX) * K, H, 52 * K)  # rear wheel arch cx, cy, r
CX, CY = 112, 284  # cab door: area below the door handle, top-left px
CW, CH = round(165 * K), round(44 * K)  # ~1033 x 275 mm


def body_path():
    p = f'M0,0 H{W} V{H} H0 Z '
    for x, y, w, h in WIN:
        r = 40
        p += f'M{x+r},{y} H{x+w-r} Q{x+w},{y} {x+w},{y+r} V{y+h-r} Q{x+w},{y+h} {x+w-r},{y+h} H{x+r} Q{x},{y+h} {x},{y+h-r} V{y+r} Q{x},{y} {x+r},{y} Z '
    ax, ay, ar = ARCH
    p += f'M{ax-ar},{ay} A{ar},{ar} 0 0 1 {ax+ar},{ay} Z'
    return p

LOW = (WIN[0][1] + WIN[0][3])  # bottom of windows (~513 mm)


def common_text(dark_band=True, txt=NAVY, phone_col=WHITE):
    b = logo('logo-horizontal-full-color' if txt == NAVY else 'logo-horizontal-reversed', 760, LOW + 50, h=230)
    b += T(765, LOW + 450, CONTACT['phone'], 125, phone_col, 900)
    rx = ARCH[0] + ARCH[2] + 60
    b += T(rx, LOW + 150, 'Solar para sa', 72, txt, 800) + T(rx, LOW + 240, 'bahay at negosyo', 72, txt, 800)
    b += T(rx, LOW + 340, TAGLINE, 44, GOLD if txt != NAVY else NAVY, 700)
    b += T(rx, LOW + 420, f'FB / YouTube: {CONTACT["page"]}', 40, phone_col, 700)
    return b


def opt_A():  # current: navy wave + gold stripe, Kuya in a sun
    b = f'<rect width="{W}" height="{H}" fill="{WHITE}"/>'
    b += f'<path d="M0,{LOW+330} C{W*0.35},{LOW+240} {W*0.65},{LOW+460} {W},{LOW+300} L{W},{H} L0,{H} Z" fill="{NAVY}"/>'
    b += f'<path d="M0,{LOW+320} C{W*0.35},{LOW+230} {W*0.65},{LOW+450} {W},{LOW+290}" stroke="{GOLD}" stroke-width="26" fill="none"/>'
    b += rays(380, LOW + 420, 300, 380, 20, opacity=1) + bust('idle', 380, LOW + 420, 290)
    b += common_text()
    return b


def opt_B():  # sunrise: giant sun rising from the rear corner, rays sweep the whole side
    b = f'<rect width="{W}" height="{H}" fill="{CREAM}"/>'
    b += rays(W, H, 700, 3400, 28, color=GOLD, opacity=0.35, start=180, sweep=90)
    b += f'<circle cx="{W}" cy="{H}" r="640" fill="{GOLD}"/>' + f'<circle cx="{W}" cy="{H}" r="520" fill="#FFC53D"/>'
    b += f'<rect x="0" y="{H-120}" width="{W}" height="120" fill="{NAVY}"/>'
    b += rays(380, LOW + 420, 300, 380, 20, opacity=1) + bust('idle', 380, LOW + 420, 290, bg='#FFC53D')
    b += logo('logo-horizontal-full-color', 760, LOW + 50, h=230)
    b += T(765, LOW + 450, CONTACT['phone'], 125, NAVY, 900)
    rx = ARCH[0] + ARCH[2] + 50
    b += T(rx, LOW + 150, 'Solar para sa', 66, NAVY, 900) + T(rx, LOW + 235, 'bahay at negosyo', 66, NAVY, 900)
    b += T(rx, LOW + 330, TAGLINE, 44, NAVY, 800)
    b += T(40, H - 40, f'FB / YouTube: {CONTACT["page"]}  •  TikTok: {CONTACT["handle"]}', 46, GOLD, 800)
    return b


def opt_C():  # solar panel: lower body is a PV panel, sun in the top rear corner
    b = f'<rect width="{W}" height="{H}" fill="{WHITE}"/>'
    b += rays(W - 160, 120, 150, 1300, 18, opacity=0.25, start=90, sweep=180)
    b += f'<circle cx="{W-160}" cy="120" r="140" fill="{GOLD}"/>'
    top = LOW + 30
    b += f'<rect x="0" y="{top}" width="{W}" height="{H-top}" fill="{NAVY}"/>'
    cell = 130; g = ''
    for i in range(int(W / cell) + 1):
        g += f'<line x1="{i*cell}" y1="{top}" x2="{i*cell}" y2="{H}"/>'
    for j in range(int((H - top) / cell) + 1):
        g += f'<line x1="0" y1="{top+j*cell}" x2="{W}" y2="{top+j*cell}"/>'
    b += f'<g stroke="#2E64AD" stroke-width="6">{g}</g>' + f'<rect x="0" y="{top}" width="{W}" height="14" fill="#c9d3df"/>'
    b += f'<polygon points="0,{top} {W*0.25},{top} 0,{H*0.95}" fill="{WHITE}" opacity="0.08"/>'
    b += rays(380, LOW + 420, 300, 380, 20, opacity=1) + bust('idle', 380, LOW + 420, 290)
    b += logo('logo-horizontal-reversed', 760, LOW + 70, h=220)
    b += T(765, LOW + 450, CONTACT['phone'], 125, GOLD, 900)
    rx = ARCH[0] + ARCH[2] + 60
    b += T(rx, LOW + 160, 'Solar para sa', 70, WHITE, 900) + T(rx, LOW + 245, 'bahay at negosyo', 70, WHITE, 900)
    b += T(rx, LOW + 335, TAGLINE, 44, GOLD, 800) + T(rx, LOW + 410, f'FB / YouTube: {CONTACT["page"]}', 40, WHITE, 700)
    return b


def opt_D():  # blue sky with sun beams, Kuya at the centre of the burst
    b = (f'<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7EC4F2"/>'
         f'<stop offset="0.45" stop-color="#2C6FC0"/><stop offset="1" stop-color="{NAVY}"/></linearGradient></defs>')
    b += f'<rect width="{W}" height="{H}" fill="url(#sky)"/>'
    b += rays(380, LOW + 420, 320, 3000, 26, color='#FFE08A', opacity=0.35)
    b += f'<path d="M0,{H-150} Q{W*0.5},{H-260} {W},{H-150} L{W},{H} L0,{H} Z" fill="{GOLD}"/>'
    b += rays(380, LOW + 420, 300, 380, 20, opacity=1) + bust('idle', 380, LOW + 420, 290)
    b += logo('logo-horizontal-reversed', 760, LOW + 50, h=230)
    b += T(765, LOW + 450, CONTACT['phone'], 125, WHITE, 900)
    rx = ARCH[0] + ARCH[2] + 60
    b += T(rx, LOW + 150, 'Solar para sa', 70, WHITE, 900) + T(rx, LOW + 235, 'bahay at negosyo', 70, WHITE, 900)
    b += T(rx, LOW + 330, TAGLINE, 44, GOLD, 800)
    b += T(40, H - 50, f'FB / YouTube: {CONTACT["page"]}', 46, NAVY, 800)
    return b


def cab(dark):
    if dark:
        return f'<rect width="{CW}" height="{CH}" rx="30" fill="{NAVY}"/>' + logo('logo-horizontal-reversed', CW / 2, 30, h=CH - 60, anchor='middle')
    return logo('logo-horizontal-full-color', CW / 2, 20, h=CH - 40, anchor='middle')

OPTS = {'A-navy-wave-current': (opt_A, False, 'A · Navy wave (current)'),
        'B-sunrise': (opt_B, False, 'B · Sunrise'),
        'C-solar-panel': (opt_C, True, 'C · Solar panel'),
        'D-blue-sky-sunburst': (opt_D, True, 'D · Blue sky sunburst')}


import base64
_IMG = 'data:image/png;base64,' + base64.b64encode(open(PHOTO, 'rb').read()).decode()

def holes():
    d = ''
    for x, y, w, h in WIN:
        r = 40
        d += f'M{x+r},{y} H{x+w-r} Q{x+w},{y} {x+w},{y+r} V{y+h-r} Q{x+w},{y+h} {x+w-r},{y+h} H{x+r} Q{x},{y+h} {x},{y+h-r} V{y+r} Q{x},{y} {x+r},{y} Z '
    ax, ay, ar = ARCH
    d += f'M{ax-ar},{ay} A{ar},{ar} 0 0 1 {ax+ar},{ay} Z'
    return f'<path d="{d}"/>'

def mockup(key):
    fn, dark, label = OPTS[key]
    s = 1 / K
    img = f'<image xlink:href="{_IMG}" x="0" y="0" width="852" height="568"/>'
    clip = (f'<clipPath id="bodyclip"><rect x="{BX}" y="{BY}" width="{W*s}" height="{H*s}" rx="2"/></clipPath>'
            f'<clipPath id="holes"><g transform="translate({BX} {BY}) scale({s})">{holes()}</g></clipPath>')
    out = (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="852" height="568" viewBox="0 0 852 568">'
           f'{img}{clip}'
           f'<g clip-path="url(#bodyclip)"><g transform="translate({BX} {BY}) scale({s})">{fn()}</g>'
           f'<g opacity="0.12">{img}</g></g><g clip-path="url(#holes)">{img}</g>'
           f'<g transform="translate({CX} {CY}) scale({s})">{cab(dark)}</g>'
           f'<rect x="0" y="500" width="852" height="68" fill="{WHITE}"/>'
           f'<text x="426" y="545" font-family="Inter Black" font-size="30" fill="{NAVY}" text-anchor="middle">{label}</text></svg>')
    p = f'{ROOT}/mockups/L300-FB-{key}-mockup.svg'; write(p, out)
    png(p, p.replace('.svg', '.png'), width=1704); os.remove(p)
    return p.replace('.svg', '.png')


def production(key):
    fn, dark, label = OPTS[key]
    B = 25
    body = (f'<g transform="translate({B} {B})">{fn()}</g>'
            f'<g transform="translate({B} {B})" fill="none" stroke="#e0115f" stroke-width="4" stroke-dasharray="30 18">'
            f'<path d="{body_path()}"/></g>')
    # cut-outs (windows, wheel arch) are drawn as magenta dashed contours: do not print inside them
    name = f'L300-FB-side-LEFT-{key}-{W}x{H}mm'
    p = f'{ROOT}/svg/{name}.svg'; write(p, svg(W + 2 * B, H + 2 * B, body, 'mm'))
    pdf_cmyk(p, f'{ROOT}/{name}-CMYK.pdf')
    c = f'{ROOT}/svg/L300-FB-cab-door-{"navy" if dark else "white"}-{CW}x{CH}mm.svg'
    write(c, svg(CW, CH, cab(dark), 'mm')); pdf_cmyk(c, c.replace('/svg/', '/').replace('.svg', '-CMYK.pdf'))

if __name__ == '__main__':
    keys = sys.argv[1:] or list(OPTS)
    ms = [mockup(k) for k in keys]
    for k in keys: production(k)
    print('\n'.join(ms))
