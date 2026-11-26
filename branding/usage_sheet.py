from lib import *
K = 'out/SoLight-Solar-PH-Logo-Kit-v2'
W, H = 1600, 2200
b = f'<rect width="{W}" height="{H}" fill="{WHITE}"/>'
b += f'<rect width="{W}" height="150" fill="{NAVY}"/>' + T(60, 95, 'SoLight Solar PH · Logo v2', 54, WHITE, 900) + T(W - 60, 95, 'SOLAR PH gold bar · 26 Nov 2026', 26, GOLD, 700, 'end')
y = 220
b += T(60, y, 'Primary logo', 34, NAVY, 900); y += 30
b += f'<rect x="60" y="{y}" width="700" height="300" rx="16" fill="{WHITE}" stroke="#dde3ea" stroke-width="3"/>' + logo('logo-horizontal-full-color', 410, y + 55, w=580, anchor='middle')
b += f'<rect x="840" y="{y}" width="700" height="300" rx="16" fill="{NAVY}"/>' + logo('logo-horizontal-reversed', 1190, y + 55, w=580, anchor='middle')
b += T(410, y + 335, 'Full colour · on white / light backgrounds', 22, CHARCOAL, 700, 'middle') + T(1190, y + 335, 'Reversed · on navy / dark backgrounds', 22, CHARCOAL, 700, 'middle')
y += 400
b += T(60, y, 'Stacked and mark', 34, NAVY, 900); y += 30
b += f'<rect x="60" y="{y}" width="460" height="420" rx="16" fill="{WHITE}" stroke="#dde3ea" stroke-width="3"/>' + logo('logo-stacked-full-color', 290, y + 30, h=360, anchor='middle')
b += f'<rect x="570" y="{y}" width="460" height="420" rx="16" fill="{NAVY}"/>' + logo('logo-stacked-reversed', 800, y + 30, h=360, anchor='middle')
b += f'<rect x="1080" y="{y}" width="460" height="420" rx="16" fill="{CREAM}"/>' + logo('mark-full-color', 1310, y + 90, w=240, anchor='middle')
b += T(1310, y + 390, 'Mark only: profile photos, icons, small spaces', 18, CHARCOAL, 700, 'middle')
y += 500
b += T(60, y, 'One colour (SOLAR PH is knocked out of the bar)', 34, NAVY, 900); y += 30
for i, (k, bg) in enumerate([('one-color-navy', WHITE), ('one-color-black', WHITE), ('one-color-white', NAVY)]):
    x = 60 + i * 500
    b += f'<rect x="{x}" y="{y}" width="460" height="200" rx="16" fill="{bg}" stroke="#dde3ea" stroke-width="3"/>' + logo(f'logo-horizontal-{k}', x + 230, y + 40, w=380, anchor='middle')
y += 290
b += T(60, y, 'Colours', 34, NAVY, 900); y += 30
for i, (nm, hx, cm, pm) in enumerate([('SoLight Navy', NAVY, 'C100 M75 Y10 K20', '≈ PMS 7687 C'), ('SoLight Gold', GOLD, 'C0 M33 Y100 K0', '≈ PMS 130 C'),
                                       ('Cream', CREAM, 'C0 M2 Y8 K0', 'backgrounds'), ('Charcoal', CHARCOAL, 'C75 M55 Y35 K55', 'body text')]):
    x = 60 + i * 375
    b += f'<rect x="{x}" y="{y}" width="340" height="150" rx="14" fill="{hx}" stroke="#dde3ea" stroke-width="2"/>'
    b += T(x, y + 190, nm, 24, NAVY, 900) + T(x, y + 222, f'{hx}  ·  {cm}', 19, CHARCOAL, 600) + T(x, y + 250, pm, 19, CHARCOAL, 600)
y += 330
b += T(60, y, 'Rules', 34, NAVY, 900); y += 50
for t in ['Use the files as supplied. Do not redraw, stretch, recolour, rotate or add shadows/outlines.',
          'Clear space: keep empty space around the logo equal to one solar square of the mark.',
          'Minimum size: horizontal 30 mm / 160 px wide; stacked 20 mm / 110 px; mark 10 mm / 32 px.',
          'Gold bar always gold with navy SOLAR PH (full colour and reversed). Never put the logo on busy photos without a navy or white panel.',
          'Font: Inter (Black / ExtraBold for headlines, SemiBold for body). Tagline: "Life is SoLight with Solar."']:
    b += f'<circle cx="74" cy="{y-8}" r="7" fill="{GOLD}"/>' + T(95, y, t, 21, CHARCOAL, 600); y += 44
p = f'{K}/SoLight-Logo-v2-Usage-Sheet.svg'; write(p, svg(W, H, b)); png(p, p.replace('.svg', '.png'), width=W)
import cairosvg; cairosvg.svg2pdf(url=p, write_to=p.replace('.svg', '.pdf')); os.remove(p)
