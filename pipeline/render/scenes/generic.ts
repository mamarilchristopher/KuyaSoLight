// Data-driven episode scenes. An episode JSON lists `scenes` (id -> {type, ...params}) and
// each cue names the scene it plays over. Scene types are reusable across the series, so a
// new explainer only needs a script, claims and scene parameters, not new code.
import { PALETTE as P, BRAND_LINES } from '../../brand/brand.ts';
import { POSES, CharacterStyle, Pose } from '../../characters/rig.ts';
import { bg, logoSlot, svgWrap, masterLogo } from '../frame.ts';
import { house, sun, moon, cloud, gridTower, battery, flow, arrowHead, bill, sparkle, logoPlaceholder, esc } from '../props.ts';
import { Ctx, charAt, mirror, ease, easeOutBack, ramp, clamp, visemeFor, blinkAt, prototypeMark, chip } from './common.ts';
import { SCENES as E002 } from './e002.ts';
import type { Composition } from '../compose.ts';
import type { TimedCue } from '../subtitles.ts';

type Params = Record<string, any>;
type SceneFn = (c: Ctx, p: Params) => string;

// ---------- small props ----------
const txt = (x: number, y: number, s: string, size: number, fill: string, weight = 800, anchor = 'middle') =>
  `<text x="${x}" y="${y}" font-family="Inter" font-weight="${weight}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`;

export function panelIcon(cx: number, cy: number, s: number, glow = 1) {
  const w = s * 1.5, h = s;
  let g = `<g transform="translate(${cx - w / 2} ${cy - h / 2})"><rect width="${w}" height="${h}" rx="8" fill="#1E3A5F" stroke="${glow > 0.5 ? P.gold : '#9db4d1'}" stroke-width="5"/>`;
  for (let i = 1; i < 4; i++) g += `<line x1="${(w * i) / 4}" y1="4" x2="${(w * i) / 4}" y2="${h - 4}" stroke="#9db4d1" stroke-width="2"/>`;
  for (let j = 1; j < 3; j++) g += `<line x1="4" y1="${(h * j) / 3}" x2="${w - 4}" y2="${(h * j) / 3}" stroke="#9db4d1" stroke-width="2"/>`;
  return g + `<rect x="${w * 0.45}" y="${h}" width="${w * 0.1}" height="${s * 0.35}" fill="${P.navy}"/></g>`;
}
export function inverterIcon(cx: number, cy: number, s: number, on = 1) {
  return `<g transform="translate(${cx - s / 2} ${cy - s * 0.65})"><rect width="${s}" height="${s * 1.3}" rx="14" fill="#fff" stroke="${P.navy}" stroke-width="6"/>` +
    `<rect x="${s * 0.15}" y="${s * 0.15}" width="${s * 0.7}" height="${s * 0.32}" rx="6" fill="${on > 0.5 ? '#CDEBD3' : '#d5dae2'}" stroke="${P.navy}" stroke-width="3"/>` +
    `<path d="M${s * 0.22},${s * 0.8} q${s * 0.07},-${s * 0.14} ${s * 0.14},0 t${s * 0.14},0" fill="none" stroke="${P.navy}" stroke-width="4"/>` +
    `<line x1="${s * 0.58}" y1="${s * 0.8}" x2="${s * 0.8}" y2="${s * 0.8}" stroke="${P.navy}" stroke-width="4"/><line x1="${s * 0.58}" y1="${s * 0.88}" x2="${s * 0.8}" y2="${s * 0.88}" stroke="${P.navy}" stroke-width="4" stroke-dasharray="5 4"/>` +
    `<circle cx="${s * 0.5}" cy="${s * 1.1}" r="${s * 0.06}" fill="${on > 0.5 ? '#5FB36B' : '#D9534F'}"/></g>`;
}
export function tvIcon(cx: number, cy: number, s: number, on = 1) {
  return `<g transform="translate(${cx - s * 0.8} ${cy - s * 0.55})"><rect width="${s * 1.6}" height="${s}" rx="12" fill="${P.navy}"/><rect x="${s * 0.08}" y="${s * 0.08}" width="${s * 1.44}" height="${s * 0.84}" rx="6" fill="${on > 0.5 ? '#7FB8EE' : '#2b3a52'}"/>` +
    `<rect x="${s * 0.7}" y="${s}" width="${s * 0.2}" height="${s * 0.15}" fill="${P.navy}"/><rect x="${s * 0.45}" y="${s * 1.13}" width="${s * 0.7}" height="${s * 0.07}" rx="4" fill="${P.navy}"/></g>`;
}
export function acIcon(cx: number, cy: number, s: number, t = 0) {
  let g = `<g transform="translate(${cx - s} ${cy - s * 0.3})"><rect width="${s * 2}" height="${s * 0.6}" rx="16" fill="#fff" stroke="${P.navy}" stroke-width="6"/><line x1="${s * 0.2}" y1="${s * 0.45}" x2="${s * 1.8}" y2="${s * 0.45}" stroke="${P.navy}" stroke-width="4"/>`;
  for (let i = 0; i < 3; i++) g += `<path d="M${s * (0.5 + i * 0.5)},${s * 0.75 + ((t * 40) % 20)} q10,15 0,30 t0,30" fill="none" stroke="#7FB8EE" stroke-width="5" stroke-linecap="round" opacity="0.8"/>`;
  return g + '</g>';
}
export function gauge(cx: number, cy: number, r: number, value: number, label: string) {
  const a0 = Math.PI, a = Math.PI + Math.PI * clamp(value);
  const nx = cx + Math.cos(a) * r * 0.8, ny = cy + Math.sin(a) * r * 0.8;
  return `<g><path d="M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}" fill="none" stroke="#dfe5ee" stroke-width="${r * 0.18}" stroke-linecap="round"/>` +
    `<path d="M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}" fill="none" stroke="${P.gold}" stroke-width="${r * 0.18}" stroke-linecap="round"/>` +
    `<line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="${P.navy}" stroke-width="10" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="14" fill="${P.navy}"/>` +
    txt(cx, cy + r * 0.5, label, r * 0.28, P.navy, 900) + `</g>` + (a0 ? '' : '');
}
export function counter(cx: number, cy: number, w: number, value: number, unit: string) {
  const digits = value.toFixed(1).padStart(5, '0');
  let g = `<g><rect x="${cx - w / 2}" y="${cy - w * 0.17}" width="${w}" height="${w * 0.34}" rx="16" fill="${P.navy}"/>`;
  const dw = (w * 0.6) / digits.length;
  [...digits].forEach((d, i) => {
    const x = cx - w * 0.46 + i * dw;
    g += d === '.' ? txt(x + dw / 2, cy + w * 0.09, '.', w * 0.16, '#fff', 900) : `<rect x="${x + 3}" y="${cy - w * 0.12}" width="${dw - 6}" height="${w * 0.24}" rx="6" fill="#fff"/>` + txt(x + dw / 2, cy + w * 0.08, d, w * 0.16, P.navy, 900);
  });
  return g + txt(cx + w * 0.33, cy + w * 0.06, unit, w * 0.1, P.gold, 900) + '</g>';
}
function icon(kind: string, cx: number, cy: number, s: number, t: number) {
  switch (kind) {
    case 'sun': return sun(cx, cy, s * 0.45, t);
    case 'panel': return panelIcon(cx, cy, s * 0.75);
    case 'inverter': return inverterIcon(cx, cy, s * 0.7);
    case 'house': return house(cx - s * 0.6, cy + s * 0.5, s * 1.2, { lit: 1, panelsGlow: 1 });
    case 'grid': return gridTower(cx, cy + s * 0.6, s * 0.75);
    case 'battery': return battery(cx - s * 0.3, cy - s * 0.4, s * 0.6, 0.8);
    case 'tv': return tvIcon(cx, cy, s * 0.7);
    case 'ac': return acIcon(cx, cy, s * 0.5, t);
    case 'moon': return `<circle cx="${cx}" cy="${cy}" r="${s * 0.75}" fill="#0f2440"/>` + moon(cx, cy, s * 0.4);
    case 'cloud': return cloud(cx, cy, s * 0.55, '#c9d3e0');
    case 'bill': return bill(cx - s * 0.45, cy - s * 0.6, s * 0.9, {});
    default: return '';
  }
}
const kuya = (c: Ctx, x: number, y: number, size: number, pose: Partial<Pose>, expr: any = 'explain', view: any = 'threeQuarter', lookX = 0) =>
  charAt(c.style, { view, expr, mouth: c.mouth, blink: c.blink, lookX, pose: { ...POSES.idle, ...pose } }, x, y, size);
const frame = (dark: boolean) => bg(dark ? 'navy' : 'cream') + logoSlot(dark) + prototypeMark(dark);
/** k-th of n items: appears in sequence across the scene. */
const stepIn = (c: Ctx, k: number, n: number, lead = 0.1) => ease(clamp((c.sp - lead * (k > 0 ? 1 : 0) - (k / n) * 0.65) * n * 2.2 + (k === 0 ? 0.3 : 0)));

// ---------- scene types ----------
export const TYPES: Record<string, SceneFn> = {
  /** Opening question: one big prop + question mark, Kuya puzzled. */
  hook: (c, p) => {
    let g = frame(false);
    const inn = easeOutBack(ramp(c.lt, 0.1, 0.6));
    g += `<g transform="translate(560 560) scale(${inn}) translate(-560 -560)">${icon(p.icon, 560, 560, 360, c.t)}</g>`;
    if (p.icon2) g += `<g opacity="${clamp(ramp(c.lt, 0.5, 0.9))}">${icon(p.icon2, 830, 400, 200, c.t)}</g>`;
    const q = easeOutBack(ramp(c.lt, 0.9, 1.3));
    g += `<g transform="translate(900 300) scale(${q})"><circle r="62" fill="${P.gold}"/>${txt(0, 30, '?', 88, P.navy, 900)}</g>`;
    if (p.chip) g += `<g opacity="${clamp(ramp(c.lt, 1.2, 1.6))}">${chip(540, 830, p.chip, { size: 36, anchor: 'middle' })}</g>`;
    g += kuya(c, 300, 1040, 260, { ...POSES.concerned, headTilt: -4 + Math.sin(c.t * 2) * 1.5 }, 'concerned');
    return g;
  },
  /** Chain of icons with energy flowing between them, revealed one by one. p.steps=[{icon,label}] */
  path: (c, p) => {
    const dark = !!p.dark;
    let g = frame(dark);
    const steps: { icon: string; label: string }[] = p.steps;
    const n = steps.length, y0 = 440, y1 = 1010;
    const pos = steps.map((_, i) => ({ x: i % 2 ? 700 : 300, y: y0 + ((y1 - y0) * i) / Math.max(1, n - 1) }));
    steps.forEach((s, i) => {
      const a = stepIn(c, i, n);
      if (i > 0) {
        const A = pos[i - 1], B = pos[i];
        const fr = ease(clamp(a * 1.4));
        g += flow(`M ${A.x + (B.x > A.x ? 90 : -90)} ${A.y + 40} L ${B.x + (B.x > A.x ? -110 : 110)} ${B.y - 30}`, c.t, p.flowColor ?? P.gold, 12, fr);
      }
      g += `<g opacity="${a}" transform="translate(${pos[i].x} ${pos[i].y}) scale(${0.6 + 0.4 * easeOutBack(a)}) translate(${-pos[i].x} ${-pos[i].y})">${icon(s.icon, pos[i].x, pos[i].y, 190, c.t)}</g>`;
      if (s.label) g += `<g opacity="${clamp(a * 1.5 - 0.5)}">${chip(pos[i].x + (i % 2 ? -10 : 0), pos[i].y + 110, s.label, { size: 30, anchor: 'middle', fill: dark ? '#ffffff' : P.navy, color: dark ? P.navy : '#fff' })}</g>`;
    });
    g += kuya(c, p.kuyaLeft ? 190 : 890, 1180, 190, p.kuyaLeft ? POSES.present : mirror(POSES.point), 'explain', 'threeQuarter', p.kuyaLeft ? 0.5 : -0.6);
    return g;
  },
  /** 1-3 comparison cards. p.cards=[{title, lines[], tone:'navy'|'gold'|'white'}] */
  cards: (c, p) => {
    let g = frame(false);
    const cards: { title: string; lines: string[]; tone?: string }[] = p.cards;
    const n = cards.length, top = n === 1 ? 400 : 290, avail = n === 1 ? 440 : 760, gap = 26, h = (avail - gap * (n - 1)) / n; // a lone card stays card-sized
    cards.forEach((cd, i) => {
      const a = stepIn(c, i, n, 0.05);
      const y = top + i * (h + gap);
      const fill = cd.tone === 'gold' ? P.gold : cd.tone === 'white' ? '#fff' : P.navy;
      const fg = cd.tone === 'navy' || !cd.tone ? '#fff' : P.navy;
      g += `<g opacity="${a}" transform="translate(${(1 - a) * 80} 0)"><rect x="80" y="${y}" width="920" height="${h}" rx="28" fill="${fill}" stroke="${P.navy}" stroke-width="${cd.tone === 'white' ? 5 : 0}"/>`;
      if (cd.icon) g += `<circle cx="210" cy="${y + h / 2}" r="${Math.min(95, h * 0.42)}" fill="#ffffff" opacity="0.9"/>` + icon(cd.icon, 210, y + h / 2, Math.min(130, h * 0.5), c.t);
      const tx = cd.icon ? 335 : 130;
      const ts = Math.min(64, h * 0.2, (960 - tx) / (cd.title.length * 0.6)), ls = Math.min(42, h * 0.13, (960 - tx) / (Math.max(1, ...cd.lines.map((l) => l.length)) * 0.5)), block = ts + cd.lines.length * ls * 1.3;
      const ty = y + (h - block) / 2 + ts * 0.85;
      g += txt(tx, ty, cd.title, ts, fg, 900, 'start');
      cd.lines.forEach((l, j) => { g += txt(tx, ty + ts * 0.35 + (j + 1) * ls * 1.3, l, ls, fg, 600, 'start'); });
      g += '</g>';
    });
    g += kuya(c, 880, 1150, 190, POSES.explain, 'explain');
    return g;
  },
  /** Title + checklist items ticked in sequence. */
  checklist: (c, p) => {
    let g = frame(!!p.dark);
    const fg = p.dark ? '#fff' : P.navy;
    g += `<g opacity="${clamp(ramp(c.lt, 0, 0.4))}">${txt(540, 330, p.title, 58, p.dark ? P.gold : P.navy, 900)}</g>`;
    const items: string[] = p.items;
    items.forEach((it, i) => {
      const a = ease(clamp((c.sp - 0.04 - (i * 0.55) / items.length) * 5)), y = 430 + i * 125;
      g += `<g opacity="${a}" transform="translate(${(1 - a) * 60} 0)"><rect x="100" y="${y}" width="880" height="100" rx="24" fill="${p.dark ? '#ffffff14' : '#fff'}" stroke="${p.dark ? '#ffffff40' : P.navy}" stroke-width="4"/>` +
        `<circle cx="160" cy="${y + 50}" r="30" fill="${p.mark === 'cross' ? '#D9534F' : P.gold}"/>` +
        (p.mark === 'cross' ? `<path d="M147,${y + 37} l26,26 M173,${y + 37} l-26,26" stroke="#fff" stroke-width="8" stroke-linecap="round"/>` : `<path d="M145,${y + 50} l11,12 l21,-24" fill="none" stroke="${P.navy}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`) +
        txt(215, y + 62, it, 36, fg, 700, 'start') + '</g>';
    });
    g += kuya(c, 860, 1160, 190, POSES.present, 'explain', 'front');
    return g;
  },
  /** Big statement lines (equation style), revealed in sequence. */
  equation: (c, p) => {
    let g = frame(!!p.dark);
    const lines: { text: string; color?: string; size?: number }[] = p.lines;
    lines.forEach((l, i) => {
      const a = ease(clamp((c.sp - i * 0.16) * 5 + 0.2));
      g += `<g opacity="${a}" transform="translate(0 ${(1 - a) * 40})">${txt(540, 420 + i * 150, l.text, l.size ?? 72, l.color === 'gold' ? P.gold : p.dark ? '#fff' : P.navy, 900)}</g>`;
    });
    if (p.icon) g += `<g opacity="${clamp(ramp(c.lt, 0.2, 0.6))}">${icon(p.icon, 540, 420 + lines.length * 150 + 60, 200, c.t)}</g>`;
    g += kuya(c, 230, 1160, 190, mirror(POSES.explain), 'smile', 'threeQuarter', 0.4);
    return g;
  },
  /** Appliance with power gauge (kW) and/or energy counter (kWh). p.show: 'kw'|'kwh'|'both' */
  meter: (c, p) => {
    let g = frame(false);
    const on = ease(ramp(c.lt, 0.2, 0.6));
    g += icon(p.appliance ?? 'tv', 540, 400, 300, c.t);
    if (p.show !== 'kwh') g += `<g opacity="${on}">${gauge(p.show === 'both' ? 300 : 540, 760, 150, on * (p.level ?? 0.35), 'kW')}${txt(p.show === 'both' ? 300 : 540, 900, p.kwLabel ?? 'bilis ng gamit', 34, P.navy, 700)}</g>`;
    if (p.show !== 'kw') {
      const v = (p.kwhFrom ?? 0) + ((p.kwhTo ?? 1) - (p.kwhFrom ?? 0)) * ease(ramp(c.sp, 0.15, 0.85));
      g += `<g opacity="${clamp(ramp(c.lt, 0.4, 0.8))}">${counter(p.show === 'both' ? 780 : 540, 740, 380, v, 'kWh')}${txt(p.show === 'both' ? 780 : 540, 900, p.kwhLabel ?? 'dami ng nagamit', 34, P.navy, 700)}</g>`;
    }
    if (p.chip) g += `<g opacity="${clamp(ramp(c.sp, 0.5, 0.65))}">${chip(540, 960, p.chip, { size: 34, anchor: 'middle', fill: P.gold, color: P.navy })}</g>`;
    g += kuya(c, 860, 1180, 180, POSES.explain, 'explain');
    return g;
  },
  /** House under a sky with a generation bar. p.sky: 'sunny'|'cloudy'|'rain'|'night'; p.level 0..1 */
  sky: (c, p) => {
    const night = p.sky === 'night';
    let g = night ? `<rect width="1080" height="1920" fill="#0f2440"/>` + logoSlot(true) + prototypeMark(true) : frame(false);
    if (p.sky === 'cloudy' || p.sky === 'rain') g += `<rect width="1080" height="1920" fill="#8fa3bd" opacity="0.28"/>`;
    if (p.sky === 'sunny') g += sun(860, 380, 64, c.t);
    if (p.sky === 'cloudy' || p.sky === 'rain') { g += sun(820, 380, 54, c.t, 0.55); g += cloud(760, 400, 140, '#c9d3e0') + cloud(470, 330, 110, '#d7dfea'); }
    if (p.sky === 'rain') for (let i = 0; i < 26; i++) { const x = 240 + ((i * 97) % 700), y = 470 + ((c.t * 600 + i * 83) % 380); g += `<line x1="${x}" y1="${y}" x2="${x - 10}" y2="${y + 34}" stroke="#7FB8EE" stroke-width="5" stroke-linecap="round" opacity="0.8"/>`; }
    if (night) g += moon(850, 380, 56);
    g += house(170, 1000, 470, { lit: 1, panelsGlow: night ? 0 : 1 });
    const lvl = (p.level ?? 0.5) * ease(ramp(c.lt, 0.3, 1.2));
    g += `<g><rect x="800" y="560" width="90" height="400" rx="20" fill="${night ? '#ffffff20' : '#fff'}" stroke="${night ? '#ffffff60' : P.navy}" stroke-width="5"/><rect x="812" y="${572 + 376 * (1 - lvl)}" width="66" height="${376 * lvl}" rx="12" fill="${P.gold}"/>` +
      txt(845, 1010, p.barLabel ?? 'solar output', 28, night ? '#fff' : P.navy, 800) + `</g>`;
    if (p.chip) g += `<g opacity="${clamp(ramp(c.lt, 0.9, 1.3))}">${chip(170, 300, p.chip, { size: 34, fill: night ? '#fff' : P.navy, color: night ? P.navy : '#fff' })}</g>`;
    if (p.battery) {
      const bl = p.battery === 'discharge' ? 0.85 - 0.5 * ease(c.sp) : 0.85;
      g += battery(660, 800, 80, bl) + flow('M 700 780 Q 660 700 620 740', c.t, '#5FB36B', 10, ease(ramp(c.lt, 0.6, 1.2)));
    }
    g += kuya(c, 860, 1220, 170, night ? POSES.idle : POSES.explain, p.expr ?? 'explain', 'threeQuarter', -0.5);
    return g;
  },
  /** Grid outage: grid crossed out; p.backup = 'none'|'battery' decides whether the house stays lit. */
  outage: (c, p) => {
    const dark = ease(ramp(c.lt, 0, 0.6));
    let g = `<rect width="1080" height="1920" fill="${P.cream}"/><rect width="1080" height="1920" fill="#0f2440" opacity="${0.9 * dark}"/>` + logoSlot(dark > 0.5) + prototypeMark(dark > 0.5);
    g += sun(880, 360, 58, c.t, p.daytime ? 1 : 0);
    g += gridTower(190, 900, 220, '#cfe0f5');
    const x = clamp(ramp(c.lt, 0.5, 0.9));
    g += `<g opacity="${x}"><path d="M90,560 L300,900 M300,560 L90,900" stroke="#D9534F" stroke-width="16" stroke-linecap="round"/></g>`;
    const lit = p.backup === 'battery' ? 1 : 0;
    g += house(380, 950, 430, { lit, panelsGlow: p.daytime ? 1 : 0 });
    if (p.backup === 'battery') g += battery(870, 720, 90, 0.75) + flow('M 900 700 Q 860 620 800 660', c.t, '#5FB36B', 10, ease(ramp(c.lt, 0.8, 1.3)));
    else g += `<g opacity="${clamp(ramp(c.lt, 0.9, 1.3))}">${inverterIcon(900, 760, 110, 0)}</g>`;
    if (p.chip) g += `<g opacity="${clamp(ramp(c.lt, 1.0, 1.4))}">${chip(540, 300, p.chip, { size: 34, anchor: 'middle', fill: '#fff', color: P.navy })}</g>`;
    g += kuya(c, 820, 1220, 170, POSES.idle, p.backup === 'battery' ? 'smile' : 'concerned');
    return g;
  },
  /** Myth-buster card: "MYTH n/N" tag, quoted myth lines, then a red "MALI!" stamp slams in. */
  myth: (c, p) => {
    let g = frame(false);
    const tag = easeOutBack(ramp(c.lt, 0.05, 0.4));
    g += `<g transform="translate(540 300) scale(${tag}) translate(-540 -300)"><rect x="330" y="248" width="420" height="104" rx="52" fill="#D9534F"/>${txt(540, 320, p.tag ?? `MYTH #${p.n}${p.of ? ` / ${p.of}` : ''}`, 56, '#fff', 900)}</g>`;
    const lines: string[] = p.lines;
    const a = ease(ramp(c.lt, 0.2, 0.6));
    const h = 120 + lines.length * 78;
    g += `<g opacity="${a}" transform="translate(0 ${(1 - a) * 40})"><rect x="90" y="420" width="900" height="${h}" rx="32" fill="#fff" stroke="${P.navy}" stroke-width="6"/>` +
      txt(150, 520, '\u201C', 120, P.gold, 900, 'start') +
      lines.map((l, i) => txt(540, 520 + i * 78, l, 58, P.navy, 900)).join('') + '</g>';
    const st = ramp(c.lt, p.stampAt ?? 1.5, (p.stampAt ?? 1.5) + 0.22);
    if (st > 0) {
      const sc = 1.9 - 0.9 * ease(st);
      g += `<g opacity="${clamp(st * 1.6)}" transform="translate(720 ${420 + h - 10}) rotate(-12) scale(${sc})"><rect x="-190" y="-70" width="380" height="140" rx="22" fill="none" stroke="#D9534F" stroke-width="14"/>${txt(0, 34, 'MALI!', 104, '#D9534F', 900)}</g>`;
    }
    g += kuya(c, 280, 1170, 230, { ...POSES.concerned, headTilt: Math.sin(c.t * 7) * (st > 0 ? 5 : 1.5) }, st > 0 ? 'smile' : 'concerned', 'threeQuarter', 0.4);
    return g;
  },
  identity: (c) => E002.identity(c),
  close: (c) => E002.close(c),
  endcard: (c, p) => {
    let g = bg('navy');
    const a = ease(ramp(c.lt, 0, 0.5));
    g += `<g opacity="${a}">${(masterLogo(190, 520, 700, 250, true) ?? logoPlaceholder(190, 520, 700, 250, true))}</g>`;
    const b = ease(ramp(c.lt, 0.25, 0.8));
    g += `<g opacity="${b}" transform="translate(0 ${(1 - b) * 30})">${txt(540, 900, BRAND_LINES.tagline, 62, '#fff', 900)}<rect x="390" y="935" width="300" height="8" rx="4" fill="${P.gold}"/></g>`;
    g += `<g opacity="${clamp(ramp(c.lt, 0.6, 1.0))}">${txt(540, 1010, 'Kuya SoLight · para sa SoSmart viewers', 32, P.gold, 700)}` +
      (p.sources ?? []).map((s: string, i: number) => txt(540, 1090 + i * 32, s, 22, '#c8d3e3', 500)).join('') + `</g>` + prototypeMark(true);
    return g;
  },
};

export function buildEpisode(ep: any, timings: any, style: CharacterStyle, files: { narration: string; sting: string; stingEnd: string; bed: string }): Composition {
  const cues: TimedCue[] = timings.cues.map((t: any) => ({ ...t, gold: ep.cues.find((c: any) => c.id === t.id)?.gold }));
  const sceneOf = (id: string) => ep.cues.find((c: any) => c.id === id).scene as string;
  const order: { scene: string; start: number }[] = [];
  for (const c of cues) { const s = sceneOf(c.id); if (!order.length || order[order.length - 1].scene !== s) order.push({ scene: s, start: order.length ? c.start - 0.15 : 0 }); }
  const duration = timings.duration, fps = timings.fps;
  const spec = (id: string): Params => ep.scenes?.[id] ?? { type: id };
  for (const o of order) if (!TYPES[spec(o.scene).type]) throw new Error(`${ep.id}: unknown scene type for ${o.scene}`);
  const sceneAt = (t: number) => { let k = 0; for (let i = 0; i < order.length; i++) if (t >= order[i].start) k = i; return k; };
  const ctxFor = (k: number, t: number, i: number): Ctx => {
    const s = order[k], end = k + 1 < order.length ? order[k + 1].start : duration;
    const level = timings.mouth[i] ?? 0;
    const talking = cues.some((c) => t >= c.start - 0.03 && t <= c.end + 0.03);
    return { t, lt: t - s.start, dur: end - s.start, sp: (t - s.start) / (end - s.start), i, mouth: talking ? visemeFor(level, i) : 'rest', talking, blink: blinkAt(t), style };
  };
  const draw = (k: number, t: number, i: number) => { const p = spec(order[k].scene); return TYPES[p.type](ctxFor(k, t, i), p); };
  const XF = 0.28;
  const identityStart = order.find((o) => spec(o.scene).type === 'identity')!.start;
  const closeStart = order.find((o) => spec(o.scene).type === 'endcard')!.start;
  return {
    id: ep.id, duration, fps, cues, narration: files.narration,
    stings: [{ file: files.sting, at: Math.max(0, identityStart + 0.05), gainDb: -5 }, { file: files.stingEnd, at: closeStart + 0.1, gainDb: -7 }],
    music: { file: files.bed, gainDb: -21 },
    frame(t, i) {
      const k = sceneAt(t);
      let inner = draw(k, t, i);
      const since = t - order[k].start;
      if (k > 0 && since < XF) inner += `<g opacity="${(1 - since / XF).toFixed(3)}">${draw(k - 1, t, i)}</g>`;
      return svgWrap(inner);
    },
  };
}
