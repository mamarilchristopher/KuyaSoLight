from lib import *
OUT = '/home/claude/brand/out/01-social-media'
HEAD = (40, 150, 520, 520)  # head-and-shoulders crop of A1

def emit(name, W, H, body, bg=None, sub=''):
    d = f'{OUT}/{sub}' if sub else OUT
    p = f'{d}/svg/{name}.svg'
    write(p, svg(W, H, body, bg=bg))
    png(p, f'{d}/{name}.png', width=W)
    return f'{d}/{name}.png'

def navy_bg(W, H, sun=None):
    sx, sy = sun or (W * 0.8, H * 0.1)
    return (f'<defs><radialGradient id="g" cx="{sx/W:.3f}" cy="{sy/H:.3f}" r="0.9"><stop offset="0" stop-color="#1A55A6"/>'
            f'<stop offset="0.55" stop-color="{NAVY}"/><stop offset="1" stop-color="{NAVY_D}"/></radialGradient></defs>'
            f'<rect width="{W}" height="{H}" fill="url(#g)"/>' + rays(sx, sy, max(W, H) * 0.08, max(W, H) * 1.2, 20, opacity=0.07))

# ---------- profile pictures (circle-safe) ----------
def profile_character(S=1080):
    b = navy_bg(S, S, (S * 0.5, S * 0.25))
    b += f'<circle cx="{S/2}" cy="{S*0.47}" r="{S*0.34}" fill="{GOLD}" opacity="0.95"/>'
    b += char('idle', S * 0.5 - S * 0.46, S * 0.13, S * 0.92, crop=HEAD)
    return b

def profile_logo(S=1080):
    b = f'<rect width="{S}" height="{S}" fill="{WHITE}"/>'
    b += logo('mark-full-color', S / 2, S * 0.2, w=S * 0.6, anchor='middle')
    return b

# ---------- covers ----------
def fb_cover(W=1640, H=924):
    # FB shows ~1640x624 on desktop (centre band) and ~1640x924 on mobile. Keep key content in centre band.
    b = navy_bg(W, H, (W * 0.78, H * 0.25))
    b += tiles(-40, H * 0.55, 70, 9, 6, opacity=0.05)
    b += char('wave', W * 0.56, H * 0.06, H * 1.1)
    b += show_title(W * 0.08, H * 0.42, 118)
    b += T(W * 0.08, H * 0.52, 'Solar tips na klaro, walang hype.', 46, WHITE, 600)
    b += pill(W * 0.08, H * 0.58, 560, 74, GOLD, TAGLINE, 34)
    b += logo('logo-horizontal-reversed', W * 0.08, H * 0.72, h=70)
    return b

def yt_banner(W=2560, H=1440):
    # Safe area for all devices: 1546x423 centred.
    sx, sy = (W - 1546) / 2, (H - 423) / 2
    b = navy_bg(W, H, (W * 0.62, H * 0.38))
    b += tiles(0, H * 0.62, 90, 22, 6, opacity=0.04)
    b += char('wave', sx + 1546 - 560, sy - 120, 680)
    b += show_title(sx + 10, sy + 165, 170)
    b += T(sx + 14, sy + 250, 'Solar tips na klaro, walang hype.', 60, WHITE, 700)
    b += pill(sx + 14, sy + 300, 720, 96, GOLD, TAGLINE, 44)
    return b

def yt_watermark(S=150):
    return f'<circle cx="{S/2}" cy="{S/2}" r="{S/2}" fill="{WHITE}"/>' + logo('mark-full-color', S / 2, S * 0.17, w=S * 0.66, anchor='middle')

# ---------- post templates ----------
def tip_post(W, H, title='TITLE NG TIP DITO', lines=('Point 1 dito', 'Point 2 dito', 'Point 3 dito'), num='TIP #01'):
    b = f'<rect width="{W}" height="{H}" fill="{CREAM}"/>' + tiles(W - 330, -40, 80, 4, 4, NAVY, 0.05)
    b += f'<rect x="0" y="0" width="{W}" height="{H*0.36}" fill="{NAVY}"/>' + rays(W * 0.88, H * 0.04, 40, W, 16, opacity=0.1)
    b += pill(60, 60, 210, 58, GOLD, num, 28)
    words = title.split(); half = (len(words) + 1) // 2
    b += T(60, H * 0.36 - 140, ' '.join(words[:half]), 76, WHITE, 900)
    b += T(60, H * 0.36 - 55, ' '.join(words[half:]), 76, GOLD, 900)
    y = H * 0.36 + 120
    for i, l in enumerate(lines):
        b += f'<circle cx="92" cy="{y - 18}" r="30" fill="{GOLD}"/>' + T(92, y - 6, str(i + 1), 34, NAVY, 900, 'middle')
        b += T(145, y, l, 46, CHARCOAL, 700)
        y += 120
    ch = H * (0.5 if H < 1200 else 0.56)
    b += char('explain', W - char_w(ch) * 0.78, H - 120 - ch * 0.92, ch)
    b += f'<rect x="0" y="{H-120}" width="{W}" height="120" fill="{NAVY}"/>'
    b += logo('logo-horizontal-reversed', 50, H - 96, h=72)
    b += T(W - 50, H - 50, TAGLINE, 32, GOLD, 700, 'end')
    return b

def question_post(W, H, q='Tanong mo kay Kuya SoLight?'):
    b = navy_bg(W, H, (W * 0.5, H * 0.18))
    b += char('pointup', W * 0.5 - char_w(H * 0.55) / 2, H * 0.42, H * 0.55)
    b += f'<rect x="60" y="{H*0.1}" width="{W-120}" height="{H*0.3}" rx="40" fill="{WHITE}"/>'
    b += f'<polygon points="{W*0.5-40},{H*0.4-2} {W*0.5+40},{H*0.4-2} {W*0.5},{H*0.45}" fill="{WHITE}"/>'
    b += T(W / 2, H * 0.1 + 80, 'SOSMART QUESTION', 34, GOLD, 900, 'middle', 4)
    b += T(W / 2, H * 0.25 + 10, q, 58 if W > 1000 else 48, NAVY, 900, 'middle')
    b += T(W / 2, H * 0.25 + 90, 'I-comment ang sagot mo! 👇'.replace(' 👇', ''), 38, CHARCOAL, 600, 'middle')
    b += logo('logo-horizontal-reversed', W / 2, H - 100, h=64, anchor='middle')
    return b

def episode_card(W=1080, H=1920, q1='Ano ba talaga', q2='ang solar?', ep='EPISODE 001'):
    """Reel/TikTok/Shorts cover and Story template (keeps text inside the Reels safe area 250..1400)."""
    b = navy_bg(W, H, (W * 0.75, H * 0.2))
    b += tiles(-30, H * 0.78, 80, 12, 6, opacity=0.05)
    b += pill(70, 270, 300, 70, GOLD, ep, 32)
    b += T(70, 470, q1, 104, WHITE, 900) + T(70, 590, q2, 104, GOLD, 900)
    b += char('present', W * 0.5 - char_w(820) / 2, 640, 820)
    b += show_title(W / 2, 1520, 70, anchor='middle')
    return b

def yt_thumb(W=1280, H=720, l1='BAKIT MAY BILL', l2='PA RIN?'):
    b = navy_bg(W, H, (W * 0.8, H * 0.2))
    b += f'<rect x="0" y="{H-90}" width="{W}" height="90" fill="{GOLD}"/>'
    b += char('explain', W - 520, 10, H * 1.0)
    b += T(50, 240, l1, 104, WHITE, 900) + T(50, 360, l2, 120, GOLD, 900)
    b += show_title(50, H - 28, 56, on_dark=False, kuya=WHITE)
    return b

def announce(W=1080, H=1080):
    b = f'<rect width="{W}" height="{H}" fill="{GOLD}"/>' + rays(W / 2, H * 0.5, 120, W, 24, color=WHITE, opacity=0.25)
    b += T(W / 2, 170, 'BAGONG EPISODE!', 92, NAVY, 900, 'middle')
    b += f'<rect x="80" y="220" width="{W-160}" height="150" rx="28" fill="{NAVY}"/>'
    b += T(W / 2, 318, 'Title ng episode dito', 62, WHITE, 800, 'middle')
    b += char('wave', W / 2 - char_w(620) / 2, 400, 620)
    b += f'<rect x="0" y="{H-110}" width="{W}" height="110" fill="{NAVY}"/>'
    b += show_title(W / 2, H - 38, 60, anchor='middle')
    return b

def lower_third(W=1920, H=220):
    b = f'<rect x="40" y="40" width="1100" height="140" rx="70" fill="{NAVY}"/>'
    b += bust('idle', 110, 110, 64)
    b += show_title(200, 115, 58) + T(202, 158, TAGLINE, 30, GOLD, 600)
    return b

if __name__ == '__main__':
    made = []
    made.append(emit('profile-character-1080', 1080, 1080, profile_character(), sub='profile'))
    made.append(emit('profile-logo-mark-1080', 1080, 1080, profile_logo(), sub='profile'))
    made.append(emit('facebook-cover-1640x924', 1640, 924, fb_cover(), sub='covers'))
    made.append(emit('youtube-banner-2560x1440', 2560, 1440, yt_banner(), sub='covers'))
    made.append(emit('youtube-watermark-150', 150, 150, yt_watermark(), sub='covers'))
    made.append(emit('tip-post-square-1080', 1080, 1080, tip_post(1080, 1080), sub='post-templates'))
    made.append(emit('tip-post-portrait-1080x1350', 1080, 1350, tip_post(1080, 1350), sub='post-templates'))
    made.append(emit('question-post-1080x1350', 1080, 1350, question_post(1080, 1350), sub='post-templates'))
    made.append(emit('new-episode-announcement-1080', 1080, 1080, announce(), sub='post-templates'))
    made.append(emit('reel-cover-story-1080x1920', 1080, 1920, episode_card(), sub='post-templates'))
    made.append(emit('youtube-thumbnail-1280x720', 1280, 720, yt_thumb(), sub='post-templates'))
    made.append(emit('video-lower-third-1920x220', 1920, 220, lower_third(), sub='video-overlays'))
    print('\n'.join(made))
