// Reusable diagram props (original vector art). All coordinates are absolute in the
// 1080x1920 canvas unless a transform is applied by the caller.
import { PALETTE as P } from '../brand/brand.ts';

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Clearly-marked master-logo placeholder. NEVER replace this with a drawn logo. */
export function logoPlaceholder(x: number, y: number, w: number, h: number, dark = true) {
  const fg = dark ? P.cream : P.navy;
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${dark ? '#ffffff14' : '#13294b10'}" stroke="${P.gold}" stroke-width="4" stroke-dasharray="14 10"/>` +
    `<text x="${x + w / 2}" y="${y + h / 2 - 6}" font-family="Inter" font-weight="800" font-size="${Math.round(h * 0.2)}" fill="${fg}" text-anchor="middle">OFFICIAL LOGO</text>` +
    `<text x="${x + w / 2}" y="${y + h / 2 + h * 0.22}" font-family="Inter" font-weight="600" font-size="${Math.round(h * 0.13)}" fill="${P.gold}" text-anchor="middle">PLACEHOLDER · upload master file</text></g>`;
}

export function sun(cx: number, cy: number, r: number, t = 0, opacity = 1) {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 + t * 0.6;
    const r1 = r * 1.25, r2 = r * (1.55 + 0.08 * Math.sin(t * 4 + i));
    return `<line x1="${cx + Math.cos(a) * r1}" y1="${cy + Math.sin(a) * r1}" x2="${cx + Math.cos(a) * r2}" y2="${cy + Math.sin(a) * r2}" stroke="${P.gold}" stroke-width="${r * 0.14}" stroke-linecap="round"/>`;
  }).join('');
  return `<g opacity="${opacity}">${rays}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${P.gold}"/><circle cx="${cx - r * 0.3}" cy="${cy - r * 0.3}" r="${r * 0.35}" fill="#fff" opacity="0.25"/></g>`;
}

export function moon(cx: number, cy: number, r: number, opacity = 1) {
  return `<g opacity="${opacity}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#F4E9C8"/><circle cx="${cx + r * 0.45}" cy="${cy - r * 0.25}" r="${r * 0.85}" fill="${P.navy}"/>` +
    [[-2.2, -0.8], [1.8, 1.2], [-1.2, 1.9], [2.6, -1.6]].map(([dx, dy]) => `<circle cx="${cx + dx * r}" cy="${cy + dy * r}" r="4" fill="#F4E9C8" opacity="0.8"/>`).join('') + `</g>`;
}

export function cloud(cx: number, cy: number, s: number, fill = '#E7ECF3', opacity = 1) {
  return `<g opacity="${opacity}" fill="${fill}"><ellipse cx="${cx}" cy="${cy}" rx="${s}" ry="${s * 0.45}"/><circle cx="${cx - s * 0.35}" cy="${cy - s * 0.25}" r="${s * 0.38}"/><circle cx="${cx + s * 0.25}" cy="${cy - s * 0.35}" r="${s * 0.48}"/></g>`;
}

/** House with rooftop PV array. (x,y) = bottom-left of the house body. */
export function house(x: number, y: number, w: number, opts: { lit?: number; panelsGlow?: number } = {}) {
  const h = w * 0.62, roofH = w * 0.42;
  const lit = opts.lit ?? 1;
  const win = (wx: number, wy: number) => `<rect x="${wx}" y="${wy}" width="${w * 0.17}" height="${w * 0.15}" rx="5" fill="${lit > 0.5 ? '#FFE7A0' : '#3d4b63'}" stroke="${P.navy}" stroke-width="5"/>`;
  const roofL = x - w * 0.06, roofR = x + w * 1.06, peakX = x + w / 2, peakY = y - h - roofH;
  // panels on the right roof slope
  const panels: string[] = [];
  const glow = opts.panelsGlow ?? 0;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    const t0 = 0.18 + i * 0.25, t1 = t0 + 0.22;
    const ax = peakX + (roofR - peakX) * t0, ay = peakY + (y - h - peakY) * t0;
    const bx = peakX + (roofR - peakX) * t1, by = peakY + (y - h - peakY) * t1;
    const off = j * 0.0;
    void off;
    panels.push(`<path d="M${ax},${ay - 6 - j * 0} L${bx},${by - 6} L${bx},${by - 6 - w * 0.07 * (j + 1) + w * 0.07 * j} L${ax},${ay - 6 - w * 0.07 * (j + 1) + w * 0.07 * j} Z" fill="${glow > 0 ? '#2E5A8F' : '#1E3A5F'}" stroke="${glow > 0 ? P.gold : '#9db4d1'}" stroke-width="${glow > 0 ? 4 : 2.5}"/>`);
  }
  return `<g>
  <rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${P.cream}" stroke="${P.navy}" stroke-width="6"/>
  <path d="M${roofL},${y - h} L${peakX},${peakY} L${roofR},${y - h} Z" fill="#C4553A" stroke="${P.navy}" stroke-width="6" stroke-linejoin="round"/>
  ${panels.join('')}
  ${win(x + w * 0.1, y - h * 0.8)}${win(x + w * 0.73, y - h * 0.8)}
  <rect x="${x + w * 0.42}" y="${y - h * 0.55}" width="${w * 0.16}" height="${h * 0.55}" rx="6" fill="${P.navy}"/>
  <circle cx="${x + w * 0.54}" cy="${y - h * 0.27}" r="4" fill="${P.gold}"/>
  </g>`;
}

/** Utility pole/transmission tower with meter label. */
export function gridTower(x: number, y: number, s: number, color: string = P.navy) {
  return `<g stroke="${color}" stroke-width="${s * 0.05}" fill="none" stroke-linejoin="round" stroke-linecap="round">
  <path d="M${x - s * 0.35},${y} L${x},${y - s * 1.6} L${x + s * 0.35},${y}"/>
  <path d="M${x - s * 0.24},${y - s * 0.55} L${x + s * 0.24},${y - s * 0.55} M${x - s * 0.14},${y - s * 0.98} L${x + s * 0.14},${y - s * 0.98}"/>
  <path d="M${x - s * 0.24},${y - s * 0.55} L${x + s * 0.14},${y - s * 0.98} M${x + s * 0.24},${y - s * 0.55} L${x - s * 0.14},${y - s * 0.98}"/>
  <path d="M${x - s * 0.55},${y - s * 1.3} L${x + s * 0.55},${y - s * 1.3}"/>
  </g>`;
}

export function battery(x: number, y: number, w: number, level: number, crossed = false) {
  const h = w * 1.5;
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${P.cream}" stroke="${P.navy}" stroke-width="6"/><rect x="${x + w * 0.32}" y="${y - 14}" width="${w * 0.36}" height="16" rx="4" fill="${P.navy}"/>` +
    `<rect x="${x + 10}" y="${y + 10 + (h - 20) * (1 - level)}" width="${w - 20}" height="${(h - 20) * level}" rx="6" fill="#5FB36B"/>` +
    (crossed ? `<path d="M${x - 14},${y - 14} L${x + w + 14},${y + h + 14} M${x + w + 14},${y - 14} L${x - 14},${y + h + 14}" stroke="#D9534F" stroke-width="14" stroke-linecap="round"/>` : '') + `</g>`;
}

/** Animated dashed energy path. progress 0..1 reveals the path; t animates dash flow. */
export function flow(d: string, t: number, color: string = P.gold, width = 12, reveal = 1) {
  const off = -t * 120;
  return `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="0.25" stroke-width="${width + 10}" stroke-linecap="round" pathLength="1000" stroke-dasharray="${1000 * reveal} 2000"/>` +
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-dasharray="26 22" stroke-dashoffset="${off}" opacity="${reveal > 0.02 ? 1 : 0}"/>`;
}

export function arrowHead(x: number, y: number, angleDeg: number, color: string = P.gold, s = 26) {
  return `<path d="M0,0 L${-s},${-s * 0.6} L${-s},${s * 0.6} Z" fill="${color}" transform="translate(${x} ${y}) rotate(${angleDeg})"/>`;
}

export function bill(x: number, y: number, w: number, opts: { highlightFixed?: number; zeroStamp?: number; amountVisible?: number } = {}) {
  const h = w * 1.3;
  const lines = [
    ['Generation charge', 'per kWh'], ['Transmission', 'per kWh'], ['System loss', 'per kWh'], ['Distribution', 'per kWh'], ['Metering / other', 'per customer'], ['Taxes & universal', 'various'],
  ];
  const fixedHi = opts.highlightFixed ?? 0;
  let s = `<g><rect x="${x + 10}" y="${y + 12}" width="${w}" height="${h}" rx="18" fill="#00000030"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#fff" stroke="${P.navy}" stroke-width="5"/>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h * 0.14}" rx="18" fill="${P.navy}"/><rect x="${x}" y="${y + h * 0.08}" width="${w}" height="${h * 0.06}" fill="${P.navy}"/>`;
  s += `<text x="${x + 28}" y="${y + h * 0.095}" font-family="Inter" font-weight="800" font-size="${w * 0.07}" fill="#fff">ELECTRIC BILL</text>`;
  lines.forEach(([a, b], i) => {
    const ly = y + h * 0.22 + i * h * 0.1;
    const isFixed = i >= 4;
    if (isFixed && fixedHi > 0) s += `<rect x="${x + 14}" y="${ly - h * 0.055}" width="${w - 28}" height="${h * 0.085}" rx="8" fill="${P.gold}" opacity="${0.35 * fixedHi + 0.1}"/>`;
    s += `<text x="${x + 28}" y="${ly}" font-family="Inter" font-weight="600" font-size="${w * 0.052}" fill="${P.charcoal}">${esc(a)}</text><text x="${x + w - 28}" y="${ly}" font-family="Inter" font-weight="500" font-size="${w * 0.042}" fill="#6b7686" text-anchor="end">${esc(b)}</text>`;
  });
  const amtY = y + h * 0.88;
  s += `<line x1="${x + 24}" y1="${amtY - h * 0.08}" x2="${x + w - 24}" y2="${amtY - h * 0.08}" stroke="#c9ced6" stroke-width="3"/>`;
  s += `<text x="${x + 28}" y="${amtY}" font-family="Inter" font-weight="800" font-size="${w * 0.06}" fill="${P.navy}">AMOUNT DUE</text><text x="${x + w - 28}" y="${amtY}" font-family="Inter" font-weight="900" font-size="${w * 0.075}" fill="${P.navy}" text-anchor="end" opacity="${opts.amountVisible ?? 1}">₱ • • •</text>`;
  if (opts.zeroStamp) {
    const sOp = Math.min(1, opts.zeroStamp);
    s += `<g opacity="${sOp}" transform="rotate(-14 ${x + w / 2} ${y + h / 2})"><rect x="${x + w * 0.08}" y="${y + h * 0.38}" width="${w * 0.84}" height="${h * 0.2}" rx="14" fill="#ffffffd0" stroke="#D9534F" stroke-width="9"/><text x="${x + w / 2}" y="${y + h * 0.505}" font-family="Inter" font-weight="900" font-size="${w * 0.085}" fill="#D9534F" text-anchor="middle">"AUTOMATIC ₱0 BILL"</text><line x1="${x + w * 0.1}" y1="${y + h * 0.56}" x2="${x + w * 0.9}" y2="${y + h * 0.4}" stroke="#D9534F" stroke-width="10" stroke-linecap="round"/></g>`;
  }
  return s + '</g>';
}

export function phone(x: number, y: number, w: number, inner: string) {
  const h = w * 1.9;
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * 0.12}" fill="${P.charcoal}"/><rect x="${x + 12}" y="${y + 30}" width="${w - 24}" height="${h - 60}" rx="${w * 0.06}" fill="#fff"/>${inner}</g>`;
}

export function speechBubble(x: number, y: number, w: number, h: number, text: string, size = 44, fill: string = P.white, color: string = P.navy, tailLeft = true) {
  const tail = tailLeft ? `M${x + 60},${y + h - 2} L${x + 40},${y + h + 46} L${x + 120},${y + h - 2} Z` : `M${x + w - 120},${y + h - 2} L${x + w - 40},${y + h + 46} L${x + w - 60},${y + h - 2} Z`;
  const lines = text.split('\n');
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="34" fill="${fill}"/><path d="${tail}" fill="${fill}"/>` + lines.map((l, i) => `<text x="${x + w / 2}" y="${y + h / 2 + (i - (lines.length - 1) / 2) * size * 1.2 + size * 0.35}" font-family="Inter" font-weight="800" font-size="${size}" fill="${color}" text-anchor="middle">${esc(l)}</text>`).join('') + `</g>`;
}

export function sparkle(cx: number, cy: number, s: number, t: number, color: string = P.gold) {
  const k = 0.6 + 0.4 * Math.sin(t * 9);
  const r = s * k;
  return `<path d="M${cx},${cy - r} Q${cx + r * 0.15},${cy - r * 0.15} ${cx + r},${cy} Q${cx + r * 0.15},${cy + r * 0.15} ${cx},${cy + r} Q${cx - r * 0.15},${cy + r * 0.15} ${cx - r},${cy} Q${cx - r * 0.15},${cy - r * 0.15} ${cx},${cy - r} Z" fill="${color}"/>`;
}

export function bulb(cx: number, cy: number, s: number, on: number) {
  return `<g><circle cx="${cx}" cy="${cy}" r="${s * 1.6}" fill="${P.gold}" opacity="${0.25 * on}"/><path d="M${cx - s * 0.7},${cy + s * 0.2} A${s},${s} 0 1 1 ${cx + s * 0.7},${cy + s * 0.2} L${cx + s * 0.45},${cy + s * 0.9} L${cx - s * 0.45},${cy + s * 0.9} Z" fill="${on > 0.5 ? P.gold : '#d8d2c0'}" stroke="${P.navy}" stroke-width="5"/><rect x="${cx - s * 0.42}" y="${cy + s * 0.95}" width="${s * 0.84}" height="${s * 0.35}" rx="5" fill="${P.navy}"/></g>`;
}
