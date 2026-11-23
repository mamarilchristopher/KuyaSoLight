// V1.1 brand identity demo: 3 opening concepts + 3 closing concepts, each paired with
// one of the 3 original sonic logo options. Every segment is preceded by a label card.
import { PALETTE as P, BRAND_LINES } from '../../brand/brand.ts';
import { POSES, CharacterStyle } from '../../characters/rig.ts';
import { bg, logoSlot, svgWrap, masterLogo } from '../frame.ts';
import { sun, sparkle, bulb, logoPlaceholder } from '../props.ts';
import { charAt, ease, easeOutBack, ramp, clamp, visemeFor, blinkAt, prototypeMark } from './common.ts';
import type { Composition, AudioTrack } from '../compose.ts';
import type { TimedCue } from '../subtitles.ts';
import type { Viseme } from '../../characters/rig.ts';

interface Voice { file: string; t: any }
interface Seg { kind: 'label' | 'open' | 'close'; idx: number; start: number; dur: number; voiceAt?: number; voice?: Voice }

const OPEN_NAMES = ['O1 · Gold Sweep', 'O2 · Lightbulb Pop', 'O3 · Sunrise Reveal'];
const CLOSE_NAMES = ['C1 · Point & Sparkle', 'C2 · Panel Grid Build', 'C3 · Sunset Card'];
const SONIC_NAMES = ['Sonic 1 · Klaro Rise (3 notes)', 'Sonic 2 · SoSmart Spark (4 notes)', 'Sonic 3 · Solar Shimmer'];
const SONIC_FILES = ['sonic-1-klaro-rise', 'sonic-2-sosmart-spark', 'sonic-3-solar-shimmer'];

export function buildIdentity(style: CharacterStyle, v: { greet: Voice; close: Voice }, sonicDir: string): Composition {
  const segs: Seg[] = []; let t = 0;
  const gDur = v.greet.t.cues[0].end, cTag = v.close.t.cues[1], cEnd = cTag.end;
  for (let k = 0; k < 3; k++) {
    segs.push({ kind: 'label', idx: k, start: t, dur: 1.3 }); t += 1.3;
    segs.push({ kind: 'open', idx: k, start: t, dur: 0.55 + gDur + 0.9, voiceAt: t + 0.55, voice: v.greet }); t += 0.55 + gDur + 0.9;
  }
  for (let k = 0; k < 3; k++) {
    segs.push({ kind: 'label', idx: 3 + k, start: t, dur: 1.3 }); t += 1.3;
    segs.push({ kind: 'close', idx: k, start: t, dur: 0.3 + cEnd + 1.4, voiceAt: t + 0.3, voice: v.close }); t += 0.3 + cEnd + 1.4;
  }
  const duration = +t.toFixed(3);
  const cues: TimedCue[] = []; const stings: AudioTrack[] = [];
  for (const s of segs) {
    if (s.kind === 'open') {
      stings.push({ file: `${sonicDir}/${SONIC_FILES[s.idx]}.wav`, at: s.start, gainDb: -4 });
      stings.push({ file: s.voice!.file, at: s.voiceAt!, gainDb: 0 });
      for (const c of s.voice!.t.cues) cues.push({ id: `${s.kind}${s.idx}-${c.id}`, text: c.text, start: +(s.voiceAt! + c.start).toFixed(3), end: +(s.voiceAt! + c.end).toFixed(3), gold: ['SoSmart', 'SoLight'] });
    }
    if (s.kind === 'close') {
      stings.push({ file: s.voice!.file, at: s.voiceAt!, gainDb: 0 });
      stings.push({ file: `${sonicDir}/${SONIC_FILES[s.idx]}-end.wav`, at: s.voiceAt! + cTag.start - 0.15, gainDb: -8 });
      for (const c of s.voice!.t.cues) cues.push({ id: `${s.kind}${s.idx}-${c.id}`, text: c.text, start: +(s.voiceAt! + c.start).toFixed(3), end: +(s.voiceAt! + c.end).toFixed(3), gold: ['SoSmart'] });
    }
  }
  const mouthAt = (s: Seg, tt: number, i: number): Viseme => {
    if (!s.voice) return 'rest';
    const local = tt - s.voiceAt!; const fi = Math.round(local * 30);
    const talking = s.voice.t.cues.some((c: any) => local >= c.start && local <= c.end);
    return talking ? visemeFor(s.voice.t.mouth[fi] ?? 0, i) : 'rest';
  };

  const label = (s: Seg, lt: number) => {
    const isOpen = s.idx < 3, k = s.idx % 3;
    const a = ease(ramp(lt, 0, 0.3)) * (1 - ease(ramp(lt, 1.05, 1.3)));
    return bg('cream') + `<g opacity="${a}"><text x="540" y="820" font-family="Inter" font-weight="700" font-size="34" fill="${P.charcoal}" text-anchor="middle" letter-spacing="4">${isOpen ? 'OPENING CONCEPT' : 'CLOSING CONCEPT'}</text>` +
      `<text x="540" y="920" font-family="Inter" font-weight="900" font-size="76" fill="${P.navy}" text-anchor="middle">${(isOpen ? OPEN_NAMES : CLOSE_NAMES)[k].replace('&', '&amp;')}</text>` +
      `<rect x="290" y="960" width="500" height="64" rx="32" fill="${P.gold}"/><text x="540" y="1003" font-family="Inter" font-weight="800" font-size="28" fill="${P.navy}" text-anchor="middle">${SONIC_NAMES[k]}${isOpen ? '' : ' (soft end)'}</text></g>`;
  };

  const opening = (s: Seg, lt: number, tt: number, i: number) => {
    const st = { mouth: mouthAt(s, tt, i), blink: blinkAt(tt) };
    const wave = { ...POSES.wave, rArm: { ...POSES.wave.rArm, elbow: 40 + Math.sin(tt * 14) * 18 } };
    let g = bg('navy') + logoSlot(true) + prototypeMark(true);
    if (s.idx === 0) { // Gold Sweep
      const w = ease(ramp(lt, 0, 0.5));
      g += `<path d="M${-600 + w * 1900},0 L${-200 + w * 1900},0 L${-800 + w * 1900},1920 L${-1200 + w * 1900},1920 Z" fill="${P.gold}" opacity="${0.9 * (1 - ramp(lt, 0.45, 0.6))}"/>`;
      const slide = ease(ramp(lt, 0.2, 0.7));
      g += `<g transform="translate(${(1 - slide) * -700} 0)">${charAt(style, { view: 'front', expr: 'smile', ...st, pose: wave }, 540, 960, 300)}</g>`;
      const word = ease(ramp(lt, 0.5, 0.9)), shine = ramp(lt, 0.9, 1.5);
      g += `<defs><linearGradient id="shine" x1="0" x2="1"><stop offset="${Math.max(0, shine - 0.15)}" stop-color="${P.gold}"/><stop offset="${shine}" stop-color="#FFF3C4"/><stop offset="${Math.min(1, shine + 0.15)}" stop-color="${P.gold}"/></linearGradient></defs><g opacity="${word}"><text x="540" y="560" font-family="Inter" font-weight="900" font-size="110" fill="url(#shine)" text-anchor="middle">SoSmart</text><text x="540" y="648" font-family="Inter" font-weight="800" font-size="58" fill="#fff" text-anchor="middle">viewers!</text></g>`;
    } else if (s.idx === 1) { // Lightbulb Pop
      const on = ramp(lt, 0.1, 0.25), pop = easeOutBack(ramp(lt, 0.05, 0.4));
      g += `<g transform="translate(540 420) scale(${pop}) translate(-540 -420)">${bulb(540, 420, 80, on)}</g>`;
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, r = 130 + ease(ramp(lt, 0.2, 0.7)) * 140; g += sparkle(540 + Math.cos(a) * r, 440 + Math.sin(a) * r, 22 * (1 - ramp(lt, 0.9, 1.5)), tt + k); }
      const up = easeOutBack(ramp(lt, 0.3, 0.8));
      g += `<g transform="translate(0 ${(1 - up) * 900})">${charAt(style, { view: 'front', expr: 'smile', ...st, pose: wave }, 540, 980, 300)}</g>`;
      g += `<g opacity="${ramp(lt, 0.6, 0.9)}"><text x="540" y="700" font-family="Inter" font-weight="900" font-size="96" fill="${P.gold}" text-anchor="middle">SoSmart viewers!</text></g>`;
    } else { // Sunrise Reveal
      const rise = ease(ramp(lt, 0, 0.9));
      g += `<defs><radialGradient id="dawn" cx="0.5" cy="0.55" r="0.6"><stop offset="0" stop-color="#F6C453" stop-opacity="${0.55 * rise}"/><stop offset="1" stop-color="${P.navy}" stop-opacity="0"/></radialGradient></defs><rect width="1080" height="1920" fill="url(#dawn)"/>`;
      g += sun(540, 900 - rise * 380, 90, tt * 0.6);
      g += `<rect x="0" y="900" width="1080" height="1020" fill="${P.navy}"/><path d="M0,900 L1080,900" stroke="${P.gold}" stroke-width="6"/>`;
      const up = ease(ramp(lt, 0.4, 1.0));
      g += `<g transform="translate(0 ${(1 - up) * 500})">${charAt(style, { view: 'front', expr: 'smile', ...st, pose: wave }, 540, 1020, 290)}</g>`;
      g += `<g opacity="${ramp(lt, 0.8, 1.2)}"><text x="540" y="330" font-family="Inter" font-weight="900" font-size="92" fill="${P.gold}" text-anchor="middle">SoSmart viewers!</text></g>`;
    }
    return g;
  };

  const closing = (s: Seg, lt: number, tt: number, i: number) => {
    const st = { mouth: mouthAt(s, tt, i), blink: blinkAt(tt) };
    const vl = lt - 0.3; // voice-local time
    const tagStart = cTag.start, card = ease(ramp(vl, tagStart - 0.2, tagStart + 0.3));
    const point = { ...POSES.point, rArm: { shoulder: 70, elbow: 10, hand: 'point' as const } };
    let g = bg('navy') + prototypeMark(true);
    const phrase = ease(ramp(vl, v.close.t.cues[0].end * 0.55, v.close.t.cues[0].end * 0.7));
    if (s.idx === 0) {
      for (let k = 0; k < 6; k++) g += sparkle(200 + k * 140, 420 + (k % 2) * 160, 24 * phrase, tt + k);
      g += `<g opacity="${1 - card}">${charAt(style, { view: 'front', expr: 'smile', ...st, pose: vl > 1.2 ? point : POSES.explain }, 540, 1000, 290)}<text x="540" y="700" font-family="Inter" font-weight="900" font-size="86" fill="${P.gold}" text-anchor="middle" opacity="${phrase}">SoSmart ka pa!</text></g>`;
    } else if (s.idx === 1) {
      const build = ramp(vl, 0, 1.6);
      for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) { const k = (r * 4 + c) / 24, o = clamp((build - k) * 4); g += `<rect x="${110 + c * 220}" y="${300 + r * 150}" width="200" height="130" rx="8" fill="#1E3A5F" stroke="${P.gold}" stroke-opacity="${0.6 * o}" stroke-width="3" opacity="${o * (0.35 + 0.4 * card)}"/>`; }
      g += `<g opacity="${1 - card}">${charAt(style, { view: 'threeQuarter', expr: 'smile', ...st, pose: POSES.present }, 540, 1000, 280)}<text x="540" y="260" font-family="Inter" font-weight="900" font-size="80" fill="${P.gold}" text-anchor="middle" opacity="${phrase}">SoSmart ka pa!</text></g>`;
    } else {
      const warm = ease(ramp(vl, 0, 1.5));
      g += `<defs><linearGradient id="sunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.navy}"/><stop offset="1" stop-color="#C9733A" stop-opacity="${0.8 * warm}"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#sunset)"/>`;
      g += sun(540, 520 + card * 300, 80, tt * 0.4, 1 - card * 0.6);
      g += `<g opacity="${1 - card}">${charAt(style, { view: 'front', expr: 'smile', ...st, pose: { ...POSES.wave, rArm: { ...POSES.wave.rArm, elbow: 40 + Math.sin(tt * 10) * 15 } } }, 540, 1000, 290)}<text x="540" y="760" font-family="Inter" font-weight="900" font-size="86" fill="${P.gold}" text-anchor="middle" opacity="${phrase}">SoSmart ka pa!</text></g>`;
    }
    g += `<g opacity="${card}">${(masterLogo(190, 560, 700, 250, true) ?? logoPlaceholder(190, 560, 700, 250, true))}<text x="540" y="940" font-family="Inter" font-weight="900" font-size="62" fill="#fff" text-anchor="middle">${BRAND_LINES.tagline}</text><rect x="390" y="975" width="300" height="8" rx="4" fill="${P.gold}"/></g>`;
    return g;
  };

  return {
    id: 'IDENTITY-DEMO', duration, fps: 30, cues, stings,
    frame(tt, i) {
      const s = segs.filter((x) => tt >= x.start).pop()!;
      const lt = tt - s.start;
      const inner = s.kind === 'label' ? label(s, lt) : s.kind === 'open' ? opening(s, lt, tt, i) : closing(s, lt, tt, i);
      return svgWrap(inner);
    },
  };
}
