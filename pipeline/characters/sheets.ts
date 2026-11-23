// Renders concept sheets, sample branded frames and the owner comparison board for
// the four Kuya SoLight directions. Output: out/characters/
import { mkdirSync, writeFileSync } from 'node:fs';
import { OPTIONS } from './styles.ts';
import { POSES, CharacterStyle, State, Viseme } from './rig.ts';
import { svgToPng } from '../render/raster.ts';
import { bg, logoSlot, placeCharacter, captionPreview, svgWrap } from '../render/frame.ts';
import { house, sun, flow, speechBubble, sparkle, esc } from '../render/props.ts';
import { PALETTE as P } from '../brand/brand.ts';

const OUT = 'out/characters';
mkdirSync(OUT, { recursive: true });

const label = (x: number, y: number, t: string, size = 30, color: string = P.charcoal, anchor = 'middle', weight = 700) => `<text x="${x}" y="${y}" font-family="Inter" font-weight="${weight}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${esc(t)}</text>`;

function cell(style: CharacterStyle, s: State, x: number, y: number, scale: number) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${style.draw(s)}</g>`;
}
function headCrop(style: CharacterStyle, s: State, x: number, y: number, size: number, id: string) {
  const { cy, r } = style.head;
  const half = r * 1.75;
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${300 - half} ${cy - half * 1.05} ${half * 2} ${half * 2}"><rect x="-2000" y="-2000" width="5000" height="5000" fill="#fff"/>${style.draw(s)}</svg><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="18" fill="none" stroke="#d9d2bf" stroke-width="3" id="${id}"/>`;
}

function sheet(style: CharacterStyle) {
  const W = 3000, H = 2350;
  let g = `<rect width="${W}" height="${H}" fill="${P.cream}"/>`;
  g += `<rect width="${W}" height="150" fill="${P.navy}"/>` + label(60, 95, `Kuya SoLight — ${style.name}`, 60, '#fff', 'start', 800) + label(W - 60, 95, `${style.id} · v${style.version} · CONCEPT, NOT APPROVED`, 34, P.gold, 'end', 700);
  // Row 1: turnaround + pose tests (full body)
  const sc = 0.62, rowY = 220;
  const items: [string, State][] = [
    ['Front', { view: 'front', expr: 'neutral', pose: POSES.idle }],
    ['Left ¾', { view: 'threeQuarter', expr: 'neutral', pose: POSES.idle }],
    ['Back', { view: 'back', expr: 'neutral', pose: POSES.idle }],
    ['Pointing', { view: 'front', expr: 'explain', pose: POSES.point }],
    ['Speaking', { view: 'front', expr: 'explain', mouth: 'ah', pose: POSES.explain }],
    ['Walking', { view: 'threeQuarter', expr: 'smile', pose: POSES.walkA }],
    ['Waving', { view: 'front', expr: 'smile', pose: POSES.wave }],
  ];
  items.forEach(([n, s], i) => {
    const x = 40 + i * 420;
    g += cell(style, s, x + 20, rowY, sc) + label(x + 206, rowY + 960, n, 34);
  });
  g += label(60, rowY + 1010, 'Side profile: generation-ready spec only in this concept round (drawn after the direction is chosen).', 26, '#7a6f58', 'start', 600);
  // Row 2: expressions + visemes + half-body
  const r2y = 1300;
  g += label(60, r2y - 20, 'Expressions', 36, P.navy, 'start', 800);
  (['neutral', 'smile', 'explain', 'concerned'] as const).forEach((e, i) => {
    g += headCrop(style, { view: 'front', expr: e, pose: POSES.idle }, 60 + i * 330, r2y, 300, `e${i}`) + label(60 + i * 330 + 150, r2y + 345, e[0].toUpperCase() + e.slice(1), 30);
  });
  g += label(1420, r2y - 20, 'Mouth shapes (lip-sync set)', 36, P.navy, 'start', 800);
  (['rest', 'mbp', 'ee', 'eh', 'ah', 'oh'] as Viseme[]).forEach((m, i) => {
    g += headCrop(style, { view: 'front', expr: 'neutral', mouth: m, pose: POSES.idle }, 1420 + i * 190, r2y, 175, `m${i}`) + label(1420 + i * 190 + 88, r2y + 215, m.toUpperCase(), 26);
  });
  // Half body
  g += label(1420, r2y + 290, 'Half-body', 30, P.navy, 'start', 800);
  g += `<svg x="1420" y="${r2y + 310}" width="420" height="420" viewBox="60 ${style.head.cy - style.head.ry * 1.6} 480 480"><rect x="-500" y="-500" width="2000" height="3000" fill="#fff"/>${style.draw({ view: 'threeQuarter', expr: 'smile', pose: POSES.explain })}</svg>`;
  // Text block
  const tx = 1900; let ty = r2y + 330;
  g += label(tx, ty, 'Why this direction', 32, P.navy, 'start', 800); ty += 46;
  g += wrap(style.summary, 62).map((l) => { const s = label(tx, ty, l, 24, P.charcoal, 'start', 500); ty += 32; return s; }).join('');
  ty += 10;
  g += label(tx, ty, 'Rig: ' + '', 24, P.navy, 'start', 800);
  g += wrap(style.rig, 58).map((l, i) => { const s = label(tx + (i === 0 ? 60 : 0), ty, l, 22, P.charcoal, 'start', 500); ty += 30; return s; }).join('');
  ty += 6;
  g += label(tx, ty, `Setup: ${style.effort.setupDays} · Per episode: ${style.effort.perEpisode}`, 22, P.charcoal, 'start', 600); ty += 30;
  g += label(tx, ty, `Reuse: ${style.effort.reuse} · Consistency: ${style.effort.consistency}`, 22, P.charcoal, 'start', 600);
  g += `<rect x="1420" y="${r2y + 760}" width="${W - 1480}" height="200" rx="16" fill="#fff" stroke="#e3dcc8" stroke-width="3"/>`;
  let sy2 = r2y + 800;
  for (const [t, col] of [['Strengths: ' + style.strengths.join(' · '), '#2d6a3e'], ['Risks: ' + style.risks.join(' · '), '#8a3b2f'], ['No logo on clothing: the official logo is placed only from the uploaded master file.', '#7a6f58']] as const) {
    for (const l of wrap(t, 120)) { g += label(1450, sy2, l, 22, col, 'start', 600); sy2 += 30; }
    sy2 += 8;
  }
  return svgWrap(g, W, H);
}

function wrap(t: string, n: number) { const out: string[] = []; let cur = ''; for (const w of t.split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur.trim()); cur = w; } else cur += ' ' + w; } if (cur.trim()) out.push(cur.trim()); return out; }

function frameIdentity(style: CharacterStyle) {
  let g = bg('navy') + logoSlot(true);
  g += sparkle(820, 520, 34, 0.2) + sparkle(900, 640, 20, 0.5) + sparkle(200, 560, 18, 0.8);
  g += `<text x="540" y="560" font-family="Inter" font-weight="900" font-size="104" fill="${P.gold}" text-anchor="middle">SoSmart</text><text x="540" y="650" font-family="Inter" font-weight="800" font-size="56" fill="#fff" text-anchor="middle">viewers!</text>`;
  const sc = 1180 / (style.footY - style.head.cy + style.head.ry * 1.3) ;
  g += placeCharacter(style, { view: 'front', expr: 'smile', mouth: 'ah', pose: POSES.wave }, 540 - 300 * sc * 1.0, 760 - (style.head.cy - style.head.ry * 1.3) * sc, sc);
  g += captionPreview(["Hello, SoSmart viewers!", "Kuya SoLight 'to!"], ['SoSmart', 'SoLight']);
  return svgWrap(g);
}

function frameExplain(style: CharacterStyle) {
  let g = bg('cream') + logoSlot(false);
  g += sun(860, 380, 60, 0.3) + house(330, 860, 420, { lit: 1, panelsGlow: 1 });
  g += flow('M 800 440 Q 700 520 650 600', 0.4, P.gold, 12, 1);
  g += speechBubble(90, 300, 470, 120, 'Daytime: solar muna', 40, P.navy, '#fff', true);
  const sc = 0.72 * 900 / (style.footY - style.head.cy);
  g += placeCharacter(style, { view: 'threeQuarter', expr: 'explain', mouth: 'eh', pose: POSES.pointUp }, 600, 930 - (style.head.cy - style.head.ry * 1.2) * sc, sc);
  g += captionPreview(['Sa typical self-consumption setup,', 'tumutulong ang solar sa daytime'], ['solar', 'daytime']);
  return svgWrap(g);
}

const t0 = Date.now();
const board: string[] = [];
OPTIONS.forEach((o) => {
  writeFileSync(`${OUT}/${o.id}-sheet.png`, svgToPng(sheet(o), 3000));
  writeFileSync(`${OUT}/${o.id}-frame-identity.png`, svgToPng(frameIdentity(o)));
  writeFileSync(`${OUT}/${o.id}-frame-explainer.png`, svgToPng(frameExplain(o)));
  writeFileSync(`${OUT}/${o.id}-front.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 1500">${o.draw({ view: 'front', expr: 'smile', pose: POSES.idle })}</svg>`);
  board.push(o.id);
});
// Comparison board: four directions side by side, same pose
let g = `<rect width="2400" height="1500" fill="${P.cream}"/><rect width="2400" height="130" fill="${P.navy}"/>` + label(60, 85, 'Kuya SoLight — choose one direction', 54, '#fff', 'start', 800) + label(2340, 85, 'Concepts only · styles not merged', 30, P.gold, 'end', 700);
OPTIONS.forEach((o, i) => {
  const x = i * 600;
  const sc = 1080 / (o.footY - o.head.cy + o.head.ry * 1.4);
  g += `<g transform="translate(${x + 300 - 300 * sc} ${180 - (o.head.cy - o.head.ry * 1.4) * sc}) scale(${sc})">${o.draw({ view: 'front', expr: 'smile', pose: POSES.wave })}</g>`;
  g += label(x + 300, 1330, o.name, 38, P.navy, 'middle', 800) + label(x + 300, 1380, `Setup ${o.effort.setupDays}`, 24, P.charcoal, 'middle', 600) + label(x + 300, 1415, `Per episode: ${o.effort.perEpisode}`, 24, P.charcoal, 'middle', 600);
});
writeFileSync(`${OUT}/comparison.png`, svgToPng(svgWrap(g, 2400, 1500)));
writeFileSync(`${OUT}/options.json`, JSON.stringify(OPTIONS.map(({ draw, ...rest }) => rest), null, 1));
console.log('character sheets rendered in', Date.now() - t0, 'ms');
