from lib import *
from printkit import VAN, ROOT
import re
def place(path, x, y, w):
    s = open(path).read(); vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', s).group(1).split()]
    inner = re.sub(r'^.*?<svg[^>]*>', '', s, count=1, flags=re.S).rsplit('</svg>', 1)[0]
    k = w / vb[2]; B = 25
    import random; i = 'c%d' % random.randint(0, 10**9)
    return (f'<clipPath id="{i}"><rect x="{x - B*k}" y="{y - B*k}" width="{vb[2]*k}" height="{vb[3]*k}"/></clipPath>'
            f'<g clip-path="url(#{i})"><g transform="translate({x - B*k} {y - B*k}) scale({k})">{inner}</g></g>')
sv = f'{ROOT}/04-vehicle-L300-decal/svg'
k = 0.25  # 1 px = 4 mm
def dim(x1, y1, x2, y2, label, off=0, vert=False):
    c = '#e0115f'
    if vert:
        return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="2"/>'
                f'<text x="{x1+10 if x1 > 300 else x1-10}" y="{(y1+y2)/2}" font-family="Inter" font-weight="700" font-size="20" fill="{c}" text-anchor="{"start" if x1 > 300 else "end"}">{label}</text>')
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="2"/>'
            f'<text x="{(x1+x2)/2}" y="{y1-8}" font-family="Inter" font-weight="700" font-size="20" fill="{c}" text-anchor="middle">{label}</text>')
def side(x0, y0, front_left, file):
    # vehicle silhouette (mm*k): overall 4440 long, 1915 tall
    L, Hh = 4440 * k, 1915 * k
    boxL, boxH = VAN['side_box'][0] * k, VAN['side_box'][1] * k
    cabL = L - boxL - 40
    g = ''
    gy = y0 + Hh  # ground
    if front_left:
        cab = f'M{x0},{gy-110} L{x0},{gy-330} Q{x0+10},{gy-430} {x0+120},{gy-440} L{x0+cabL},{gy-440} L{x0+cabL},{gy-110} Z'
        bx = x0 + cabL + 10
    else:
        cab = f'M{x0+L},{gy-110} L{x0+L},{gy-330} Q{x0+L-10},{gy-430} {x0+L-120},{gy-440} L{x0+L-cabL},{gy-440} L{x0+L-cabL},{gy-110} Z'
        bx = x0 + 30
    g += f'<path d="{cab}" fill="#f4f4f4" stroke="#333" stroke-width="3"/>'
    wx = x0 + 30 if front_left else x0 + L - cabL + 40
    g += f'<rect x="{wx}" y="{gy-420}" width="{cabL-80}" height="120" rx="12" fill="#9fb6cc" stroke="#333" stroke-width="2"/>'
    by = gy - 110 - boxH - 10
    g += f'<rect x="{bx}" y="{by}" width="{boxL}" height="{boxH+20}" fill="#ddd" stroke="#333" stroke-width="3"/>'
    g += place(f'{sv}/{file}.svg', bx, by + 10, boxL)
    for wxx in ([x0 + 150, x0 + 150 + 2350 * k] if front_left else [x0 + L - 150, x0 + L - 150 - 2350 * k]):
        g += f'<circle cx="{wxx}" cy="{gy-45}" r="62" fill="#222"/><circle cx="{wxx}" cy="{gy-45}" r="28" fill="#aaa"/>'
    cd = f'{sv}/L300-cab-door-750x450mm-x2.svg'
    cdx = (x0 + 40) if front_left else (x0 + L - cabL + 40)
    g += place(cd, cdx, gy - 290, 750 * k)
    g += dim(bx, by - 20, bx + boxL, by - 20, f'{VAN["side_box"][0]} mm (assumed)')
    g += dim(bx + (boxL + 20 if front_left else -20), by + 10, bx + (boxL + 20 if front_left else -20), by + 10 + boxH, f'{VAN["side_box"][1]} mm', vert=True)
    g += f'<line x1="{x0-20}" y1="{gy+20}" x2="{x0+L+20}" y2="{gy+20}" stroke="#999" stroke-width="2"/>'
    return g
W, H = 1400, 1760
b = f'<rect width="{W}" height="{H}" fill="#fff"/>'
b += T(40, 60, 'Mitsubishi L300 aluminium close van: decal layout (not to final scale; check panel sizes on the actual unit)', 24, NAVY, 800)
b += T(40, 100, 'LEFT side (driver side, front of van on the left)', 22, CHARCOAL, 700) + side(60, 140, True, 'L300-side-LEFT-driver-2750x1300mm')
b += T(40, 720, 'RIGHT side (front of van on the right)', 22, CHARCOAL, 700) + side(160, 760, False, 'L300-side-RIGHT-2750x1300mm')
rx, ry = 60, 1330
b += T(40, 1310, 'REAR doors (two leaves, split at centre)', 22, CHARCOAL, 700)
b += f'<rect x="{rx}" y="{ry}" width="{1600*k}" height="{1300*k}" fill="#ddd" stroke="#333" stroke-width="3"/>' + place(f'{sv}/L300-rear-doors-1600x1300mm.svg', rx, ry, 1600 * k)
b += f'<line x1="{rx+800*k}" y1="{ry}" x2="{rx+800*k}" y2="{ry+1300*k}" stroke="#e0115f" stroke-width="2" stroke-dasharray="8 6"/>'
b += T(560, 1360, 'Assumed sizes (decal shop to confirm on the unit):', 22, NAVY, 800)
yy = 1400
for t in ['Overall van: 4,440 L x 1,695 W x 1,915 H mm (published spec)', 'Cargo box side, flat area: 2,750 x 1,300 mm (each side)',
          'Rear doors, both leaves: 1,600 x 1,300 mm', 'Cab door lower panel: 750 x 450 mm (x2, same file)', 'Windshield top strip: 1,400 x 180 mm (optional)',
          'Avoid: door handles, hinges, lights, rivet lines', 'Material: cast vinyl + laminate; rear/windshield', 'perforated vinyl if over glass']:
    b += T(560, yy, '• ' + t, 19, CHARCOAL, 600); yy += 30
p = f'{ROOT}/04-vehicle-L300-decal/L300-layout-overview.svg'; write(p, svg(W, H, b)); png(p, p.replace('.svg', '.png'), width=W * 2)
