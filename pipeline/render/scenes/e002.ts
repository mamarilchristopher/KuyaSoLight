// E002 — "Bakit May Bill Pa Rin Kahit May Solar?" scene graph (Template 05 · Energy Flow).
import { PALETTE as P, BRAND_LINES } from '../../brand/brand.ts';
import { POSES, CharacterStyle } from '../../characters/rig.ts';
import { bg, logoSlot, svgWrap, masterLogo } from '../frame.ts';
import { house, sun, moon, cloud, gridTower, battery, flow, arrowHead, bill, sparkle, bulb, logoPlaceholder, speechBubble } from '../props.ts';
import { Ctx, charAt, mirror, ease, easeOutBack, ramp, clamp, visemeFor, blinkAt, prototypeMark, chip } from './common.ts';
import type { Composition } from '../compose.ts';
import type { TimedCue } from '../subtitles.ts';

type SceneFn = (c: Ctx) => string;

const SCENES: Record<string, SceneFn> = {
  hook: (c) => {
    let g = bg('cream') + logoSlot(false) + prototypeMark(false);
    g += sun(860, 360, 58, c.t) + house(150, 840, 470, { lit: 1, panelsGlow: 1 });
    const slide = ease(ramp(c.lt, 0.5, 1.2));
    g += `<g transform="translate(${(1 - slide) * 500} 0) rotate(${(1 - slide) * 12} 830 600)">${bill(620, 380, 330, { amountVisible: 1 })}</g>`;
    const q = easeOutBack(ramp(c.lt, 1.3, 1.7));
    g += `<g transform="translate(910 330) scale(${q})"><circle r="62" fill="${P.gold}"/><text y="30" font-family="Inter" font-weight="900" font-size="88" fill="${P.navy}" text-anchor="middle">?</text></g>`;
    g += charAt(c.style, { view: 'threeQuarter', expr: 'concerned', mouth: c.mouth, blink: c.blink, pose: { ...POSES.concerned, headTilt: -4 + Math.sin(c.t * 2) * 1.5 } }, 330, 1010, 280);
    return g;
  },
  identity: (c) => {
    let g = bg('navy') + logoSlot(true) + prototypeMark(true);
    const pop = easeOutBack(ramp(c.lt, 0.05, 0.45));
    [[820, 520, 34, 0.2], [930, 650, 20, 0.5], [180, 560, 22, 0.8], [260, 420, 14, 1.1]].forEach(([x, y, s, ph]) => { g += sparkle(x, y, s * pop, c.t + ph); });
    g += `<g transform="translate(540 560) scale(${pop})"><text x="0" y="0" font-family="Inter" font-weight="900" font-size="110" fill="${P.gold}" text-anchor="middle">SoSmart</text><text x="0" y="88" font-family="Inter" font-weight="800" font-size="58" fill="#fff" text-anchor="middle">viewers!</text></g>`;
    const enter = ease(ramp(c.lt, 0, 0.35));
    const wave = { ...POSES.wave, rArm: { ...POSES.wave.rArm, elbow: 40 + Math.sin(c.t * 14) * 18 } };
    g += `<g transform="translate(0 ${(1 - enter) * 300})">` + charAt(c.style, { view: 'front', expr: 'smile', mouth: c.mouth, blink: c.blink, pose: wave }, 540, 940, 300) + '</g>';
    return g;
  },
  day: (c) => {
    let g = bg('cream') + logoSlot(false) + prototypeMark(false);
    g += sun(880, 360, 64, c.t);
    g += house(110, 900, 500, { lit: 1, panelsGlow: 1 });
    const r1 = ease(ramp(c.lt, 0.2, 1.0)), r2 = ease(ramp(c.lt, 1.0, 1.8));
    g += flow('M 820 400 Q 640 430 500 520', c.t, P.gold, 14, r1) + (r1 > 0.95 ? arrowHead(500, 520, 150) : '');
    g += flow('M 460 560 Q 400 640 360 740', c.t, P.gold, 14, r2) + (r2 > 0.95 ? arrowHead(360, 740, 115) : '');
    const ch = easeOutBack(ramp(c.lt, 1.6, 2.0));
    g += `<g transform="translate(110 290) scale(${ch})">${chip(0, 0, 'Daytime: solar → bahay', { size: 36 })}</g>`;
    g += `<g opacity="${clamp(ramp(c.lt, 2.2, 2.6))}">${chip(110, 960, 'Depende sa setup', { fill: P.gold, color: P.navy, size: 28 })}</g>`;
    g += charAt(c.style, { view: 'threeQuarter', expr: 'explain', mouth: c.mouth, blink: c.blink, lookX: -0.6, pose: { ...mirror(POSES.pointUp), headTilt: -3 } }, 800, 1030, 250);
    return g;
  },
  night: (c) => {
    const dark = ease(ramp(c.lt, 0, 0.8));
    let g = `<rect width="1080" height="1920" fill="${P.cream}"/><rect width="1080" height="1920" fill="#0f2440" opacity="${0.92 * dark}"/>` + logoSlot(dark > 0.5) + prototypeMark(dark > 0.5);
    g += sun(880, 360 + dark * 300, 64, c.t, 1 - dark);
    g += cloud(720, 330, 90, '#c9d3e0', clamp(ramp(c.lt, 0.1, 0.5)) * (1 - dark));
    g += moon(870, 360, 52, dark);
    g += house(330, 900, 470, { lit: 1, panelsGlow: 0 });
    g += `<g opacity="${dark}">${chip(330, 290, 'Kulang ang solar / gabi na', { fill: '#ffffff', color: P.navy, size: 32 })}</g>`;
    // battery: absent (crossed) during c06
    const bOp = clamp(ramp(c.lt, 1.6, 2.0));
    g += `<g opacity="${bOp}">${battery(880, 650, 110, 0, true)}<text x="935" y="860" font-family="Inter" font-weight="800" font-size="28" fill="#fff" text-anchor="middle">walang battery</text></g>`;
    // grid import flow during c07
    const gr = ease(ramp(c.lt, 2.6, 3.4));
    g += `<g opacity="${clamp(ramp(c.lt, 2.3, 2.7))}">${gridTower(150, 900, 230, '#cfe0f5')}</g>`;
    g += flow('M 230 560 Q 300 620 330 700', c.t, '#7FB8EE', 14, gr) + (gr > 0.95 ? arrowHead(330, 700, 70, '#7FB8EE') : '');
    g += `<g opacity="${clamp(ramp(c.lt, 3.2, 3.6))}">${chip(60, 950, 'Grid import', { fill: '#7FB8EE', color: P.navy, size: 34 })}</g>`;
    g += charAt(c.style, { view: 'threeQuarter', expr: c.lt > 2.4 ? 'explain' : 'concerned', mouth: c.mouth, blink: c.blink, pose: c.lt > 2.4 ? mirror(POSES.point) : POSES.idle }, 820, 1050, 240);
    return g;
  },
  charges: (c) => {
    let g = bg('cream') + logoSlot(false) + prototypeMark(false);
    const inn = ease(ramp(c.lt, 0, 0.5));
    g += `<g transform="translate(0 ${(1 - inn) * 120})" opacity="${inn}">${bill(300, 300, 520, { highlightFixed: clamp(ramp(c.lt, 0.8, 1.4)) })}</g>`;
    g += `<g opacity="${clamp(ramp(c.lt, 1.4, 1.8))}">${chip(740, 1010, 'Hindi lahat nawawala', { fill: P.gold, color: P.navy, size: 30, anchor: 'middle' })}</g>`;
    g += charAt(c.style, { view: 'threeQuarter', expr: 'explain', mouth: c.mouth, blink: c.blink, pose: POSES.present }, 230, 1060, 230);
    return g;
  },
  nozero: (c) => {
    let g = bg('cream') + logoSlot(false) + prototypeMark(false);
    g += bill(300, 300, 520, { highlightFixed: 1, zeroStamp: easeOutBack(ramp(c.lt, 0.4, 0.9)) });
    const shake = Math.sin(c.t * 10) * 4 * clamp(ramp(c.lt, 1.0, 1.3)) * (1 - clamp(ramp(c.lt, 2.2, 2.5)));
    g += charAt(c.style, { view: 'front', expr: 'concerned', mouth: c.mouth, blink: c.blink, pose: { ...POSES.idle, headTilt: shake } }, 230, 1060, 230);
    return g;
  },
  close: (c) => {
    let g = bg('navy') + logoSlot(true) + prototypeMark(true);
    const on = clamp(ramp(c.lt, c.dur * 0.55, c.dur * 0.65));
    g += bulb(540, 430, 70, on);
    [[300, 380, 26, 0.1], [790, 360, 30, 0.6], [860, 560, 18, 0.9], [220, 600, 20, 0.3]].forEach(([x, y, s, ph]) => { g += sparkle(x, y, s * on, c.t + ph); });
    const pop = easeOutBack(ramp(c.lt, c.dur * 0.6, c.dur * 0.72));
    g += `<g transform="translate(540 690) scale(${pop})"><text font-family="Inter" font-weight="900" font-size="84" fill="${P.gold}" text-anchor="middle">SoSmart ka pa!</text></g>`;
    const point = { ...POSES.point, rArm: { shoulder: 70, elbow: 10, hand: 'point' as const } };
    g += charAt(c.style, { view: 'front', expr: 'smile', mouth: c.mouth, blink: c.blink, pose: c.lt > c.dur * 0.5 ? point : POSES.explain }, 540, 990, 280);
    return g;
  },
  endcard: (c) => {
    let g = bg('navy');
    const a = ease(ramp(c.lt, 0, 0.5));
    g += `<g opacity="${a}">${(masterLogo(190, 520, 700, 250, true) ?? logoPlaceholder(190, 520, 700, 250, true))}</g>`;
    const b = ease(ramp(c.lt, 0.25, 0.8));
    g += `<g opacity="${b}" transform="translate(0 ${(1 - b) * 30})"><text x="540" y="900" font-family="Inter" font-weight="900" font-size="62" fill="#fff" text-anchor="middle">${BRAND_LINES.tagline}</text><rect x="390" y="935" width="300" height="8" rx="4" fill="${P.gold}"/></g>`;
    g += `<g opacity="${clamp(ramp(c.lt, 0.6, 1.0))}"><text x="540" y="1010" font-family="Inter" font-weight="700" font-size="32" fill="${P.gold}" text-anchor="middle">Kuya SoLight · para sa SoSmart viewers</text>` +
      `<text x="540" y="1090" font-family="Inter" font-weight="500" font-size="22" fill="#c8d3e3" text-anchor="middle">Sources: Meralco Solar &amp; Net Metering and DER pages;</text><text x="540" y="1122" font-family="Inter" font-weight="500" font-size="22" fill="#c8d3e3" text-anchor="middle">DOE DC2026-08-0017 media release (checked 23 Nov 2026)</text></g>` + prototypeMark(true);
    return g;
  },
};

export function buildE002(ep: any, timings: any, style: CharacterStyle, files: { narration: string; sting: string; stingEnd: string; bed: string }): Composition {
  const cues: TimedCue[] = timings.cues.map((t: any) => ({ ...t, gold: ep.cues.find((c: any) => c.id === t.id)?.gold }));
  const sceneOf = (id: string) => ep.cues.find((c: any) => c.id === id).scene as string;
  const order: { scene: string; start: number }[] = [];
  for (const c of cues) { const s = sceneOf(c.id); if (!order.length || order[order.length - 1].scene !== s) order.push({ scene: s, start: order.length ? c.start - 0.15 : 0 }); }
  const duration = timings.duration;
  const fps = timings.fps;
  const sceneAt = (t: number) => { let k = 0; for (let i = 0; i < order.length; i++) if (t >= order[i].start) k = i; return k; };
  const ctxFor = (k: number, t: number, i: number): Ctx => {
    const s = order[k], end = k + 1 < order.length ? order[k + 1].start : duration;
    const level = timings.mouth[i] ?? 0;
    const talking = cues.some((c) => t >= c.start - 0.03 && t <= c.end + 0.03);
    return { t, lt: t - s.start, dur: end - s.start, sp: (t - s.start) / (end - s.start), i, mouth: talking ? visemeFor(level, i) : 'rest', talking, blink: blinkAt(t), style };
  };
  const XF = 0.28;
  const identityStart = order.find((o) => o.scene === 'identity')!.start;
  const closeStart = order.find((o) => o.scene === 'endcard')!.start;
  return {
    id: 'E002', duration, fps, cues, narration: files.narration,
    stings: [{ file: files.sting, at: Math.max(0, identityStart + 0.05), gainDb: -5 }, { file: files.stingEnd, at: closeStart + 0.1, gainDb: -7 }],
    music: { file: files.bed, gainDb: -21 },
    frame(t, i) {
      const k = sceneAt(t);
      let inner = SCENES[order[k].scene](ctxFor(k, t, i));
      const since = t - order[k].start;
      if (k > 0 && since < XF) inner += `<g opacity="${(1 - since / XF).toFixed(3)}">${SCENES[order[k - 1].scene](ctxFor(k - 1, t, i))}</g>`;
      return svgWrap(inner);
    },
  };
}
