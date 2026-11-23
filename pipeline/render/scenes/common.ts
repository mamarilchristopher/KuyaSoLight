import type { CharacterStyle, State, Viseme, Pose } from '../../characters/rig.ts';
export const mirror = (p: Pose): Pose => ({ ...p, lArm: p.rArm, rArm: p.lArm, lLeg: p.rLeg, rLeg: p.lLeg, headTilt: -p.headTilt });
import { PALETTE as P } from '../../brand/brand.ts';

export interface Ctx { t: number; lt: number; dur: number; sp: number; i: number; mouth: Viseme; talking: boolean; blink: number; style: CharacterStyle }

export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = (x: number) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const easeOutBack = (x: number) => { x = clamp(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
export const ramp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

/** Place character so local head centre lands at (hx,hy) with head height headPx. */
export function charAt(style: CharacterStyle, state: State, hx: number, hy: number, headPx: number, flip = false) {
  const k = headPx / (2 * style.head.ry);
  return `<g transform="translate(${hx} ${hy}) scale(${flip ? -k : k} ${k}) translate(${-300} ${-style.head.cy})">${style.draw(state)}</g>`;
}

export function visemeFor(level: number, i: number): Viseme {
  if (level < 0.08) return 'rest';
  const v = (i >> 1) % 3;
  if (level < 0.28) return v === 0 ? 'mbp' : 'ee';
  if (level < 0.55) return v === 2 ? 'oh' : 'eh';
  return v === 1 ? 'oh' : 'ah';
}

export function blinkAt(t: number) {
  const period = 3.3, ph = (t + 0.7) % period;
  return ph < 0.06 ? ph / 0.06 : ph < 0.13 ? 1 - (ph - 0.06) / 0.07 : 0;
}

export const prototypeMark = (dark: boolean) => `<g><rect x="660" y="132" width="290" height="44" rx="22" fill="${dark ? '#ffffff1a' : '#13294b14'}"/><text x="805" y="161" font-family="Inter" font-weight="700" font-size="20" fill="${dark ? '#ffffffb0' : '#13294bb0'}" text-anchor="middle">PROTOTYPE · not for posting</text></g>`;

export const chip = (x: number, y: number, text: string, opts: { fill?: string; color?: string; size?: number; anchor?: 'start' | 'middle' } = {}) => {
  const size = opts.size ?? 34, w = text.length * size * 0.56 + 48, h = size * 1.7;
  const x0 = opts.anchor === 'middle' ? x - w / 2 : x;
  return `<g><rect x="${x0}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${opts.fill ?? P.navy}"/><text x="${x0 + w / 2}" y="${y + h / 2 + size * 0.36}" font-family="Inter" font-weight="800" font-size="${size}" fill="${opts.color ?? '#fff'}" text-anchor="middle">${text.replace(/&/g, '&amp;')}</text></g>`;
};
