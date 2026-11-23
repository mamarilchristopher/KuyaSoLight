// Branded 1080x1920 frame layout shared by sample frames and the video renderer.
import { PALETTE as P, SAFE, masterLogoPath, masterLogoReversedPath } from '../brand/brand.ts';
import { readFileSync } from 'node:fs';
import { logoPlaceholder, esc } from './props.ts';
import type { CharacterStyle, State } from '../characters/rig.ts';

export function bg(kind: 'navy' | 'cream') {
  if (kind === 'navy') return `<defs><radialGradient id="bgN" cx="0.5" cy="0.35" r="0.85"><stop offset="0" stop-color="#1f4373"/><stop offset="1" stop-color="${P.navy}"/></radialGradient></defs><rect width="1080" height="1920" fill="url(#bgN)"/>`;
  return `<rect width="1080" height="1920" fill="${P.cream}"/><g stroke="#13294b" stroke-opacity="0.05" stroke-width="2">${Array.from({ length: 20 }, (_, i) => `<line x1="0" y1="${i * 100}" x2="1080" y2="${i * 100}"/>`).join('')}${Array.from({ length: 11 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="1920"/>`).join('')}</g>`;
}

/** Fixed logo slot: top-left inside the safe area. */
/** Embeds the uploaded master logo file unchanged (scaled to fit, aspect preserved). */
const logoCache = new Map<string, string | null>();
function logoUri(p: string | null) {
  if (!p) return null;
  if (!logoCache.has(p)) logoCache.set(p, `data:${p.endsWith('.svg') ? 'image/svg+xml' : 'image/png'};base64,${readFileSync(p).toString('base64')}`);
  return logoCache.get(p)!;
}
/** Embeds the owner-supplied logo file unchanged (never redrawn). dark=true uses the official reversed version. */
export function masterLogo(x: number, y: number, w: number, h: number, dark = false): string | null {
  const uri = logoUri(dark ? (masterLogoReversedPath() ?? masterLogoPath()) : masterLogoPath());
  return uri ? `<image href="${uri}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMinYMid meet"/>` : null;
}
export function logoSlot(dark: boolean) { return masterLogo(SAFE.left, 120, 330, 110, dark) ?? logoPlaceholder(SAFE.left, 120, 330, 110, dark); }

export function placeCharacter(style: CharacterStyle, state: State, x: number, y: number, scale: number) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${style.draw(state)}</g>`;
}

/** Static caption preview (video uses libass burn-in with the same style). */
export function captionPreview(lines: string[], gold: string[] = []) {
  const size = 44, lh = 58, pad = 26;
  const h = lines.length * lh + pad * 2 - 10;
  const y = SAFE.bottom - h;
  const word = (w: string) => gold.some((g) => w.toLowerCase().replace(/[^\p{L}\d]/gu, '').startsWith(g.toLowerCase())) ? `<tspan fill="${P.gold}">${esc(w)}</tspan>` : esc(w);
  return `<rect x="${SAFE.left}" y="${y}" width="${SAFE.right - SAFE.left}" height="${h}" rx="22" fill="#0b1a2e" fill-opacity="0.82"/>` + lines.map((l, i) => `<text x="${(SAFE.left + SAFE.right) / 2}" y="${y + pad + size * 0.85 + i * lh}" font-family="Inter" font-weight="800" font-size="${size}" fill="#fff" text-anchor="middle">${l.split(' ').map(word).join(' ')}</text>`).join('');
}

export function safeAreaGuides() {
  return `<g fill="none" stroke="#ff3b7f" stroke-width="3" stroke-dasharray="10 8" opacity="0.8"><rect x="${SAFE.left}" y="${SAFE.top}" width="${SAFE.right - SAFE.left}" height="${SAFE.bottom - SAFE.top}"/></g>`;
}

export const svgWrap = (inner: string, w = 1080, h = 1920) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
