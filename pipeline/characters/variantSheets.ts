// Renders the A look-variation comparison + per-variant mini sheets. Output: out/characters/variants-a/
import { mkdirSync, writeFileSync } from 'node:fs';
import { A_VARIANTS } from './variantsA.ts';
import { POSES, CharacterStyle, State } from './rig.ts';
import { svgToPng } from '../render/raster.ts';
import { svgWrap, bg, logoSlot, captionPreview } from '../render/frame.ts';
import { sparkle, esc } from '../render/props.ts';
import { PALETTE as P } from '../brand/brand.ts';
const OUT = 'out/characters/variants-a'; mkdirSync(OUT, { recursive: true });
const label = (x: number, y: number, t: string, size = 30, color: string = P.charcoal, anchor = 'middle', w = 700) => `<text x="${x}" y="${y}" font-family="Inter" font-weight="${w}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${esc(t)}</text>`;
let clipN = 0;
const head = (s: CharacterStyle, st: State, x: number, y: number, size: number) => {
  const h = s.head.r * 1.75, k = size / (h * 2), id = `hc${clipN++}`;
  const vx = 300 - h, vy = s.head.cy - h * 1.05;
  return `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="16"/></clipPath></defs><g clip-path="url(#${id})"><rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#fff"/><g transform="translate(${x - vx * k} ${y - vy * k}) scale(${k})">${s.draw(st)}</g></g><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="16" fill="none" stroke="#d9d2bf" stroke-width="3"/>`;
};
// comparison board
const W = 3000, H = 1750;
let g = `<rect width="${W}" height="${H}" fill="${P.cream}"/><rect width="${W}" height="130" fill="${P.navy}"/>` + label(60, 85, 'Kuya SoLight · Direction A — pick a look', 54, '#fff', 'start', 800) + label(W - 60, 85, 'A1 = current look (kept)', 30, P.gold, 'end', 700);
A_VARIANTS.forEach((v, i) => {
  const x = i * 600;
  const sc = 0.82;
  g += `<g transform="translate(${x + 300 - 300 * sc} 170) scale(${sc})">${v.draw({ view: 'front', expr: 'smile', pose: POSES.wave })}</g>`;
  g += head(v, { view: 'threeQuarter', expr: 'explain', mouth: 'eh', pose: POSES.idle }, x + 60, 1210, 230) + head(v, { view: 'front', expr: 'concerned', pose: POSES.idle }, x + 310, 1210, 230);
  g += label(x + 300, 1530, v.name, 40, P.navy, 'middle', 800);
});
writeFileSync(`${OUT}/a-variants-comparison.png`, svgToPng(svgWrap(g, W, H)));
// per-variant sheet + sample frame
A_VARIANTS.forEach((v) => {
  let s = `<rect width="2400" height="1300" fill="${P.cream}"/>` + label(40, 70, v.name, 46, P.navy, 'start', 800);
  const items: [string, State][] = [['Front', { view: 'front', expr: 'neutral', pose: POSES.idle }], ['¾', { view: 'threeQuarter', expr: 'smile', pose: POSES.explain }], ['Back', { view: 'back', expr: 'neutral', pose: POSES.idle }], ['Pointing', { view: 'front', expr: 'explain', pose: POSES.point }]];
  items.forEach(([n, st], i) => { s += `<g transform="translate(${i * 400 + 20} 110) scale(0.62)">${v.draw(st)}</g>` + label(i * 400 + 206, 1000, n, 30); });
  (['neutral', 'smile', 'explain', 'concerned'] as const).forEach((e, i) => { s += head(v, { view: 'front', expr: e, pose: POSES.idle }, 1640 + (i % 2) * 360, 120 + Math.floor(i / 2) * 400, 330) + label(1640 + (i % 2) * 360 + 165, 120 + Math.floor(i / 2) * 400 + 370, e, 26); });
  s += label(40, 1100, v.summary.length > 150 ? v.summary.slice(0, 150) + '…' : v.summary, 26, P.charcoal, 'start', 500);
  console.log("sheet", v.id); writeFileSync(`${OUT}/${v.id}-sheet.png`, svgToPng(svgWrap(s, 2400, 1300)));
  let f = bg('navy') + logoSlot(true) + sparkle(820, 520, 34, 0.2) + sparkle(200, 560, 18, 0.8) + `<text x="540" y="560" font-family="Inter" font-weight="900" font-size="104" fill="${P.gold}" text-anchor="middle">SoSmart</text><text x="540" y="650" font-family="Inter" font-weight="800" font-size="56" fill="#fff" text-anchor="middle">viewers!</text>`;
  const sc = 1.35; f += `<g transform="translate(${540 - 300 * sc} ${700 - (v.head.cy - v.head.ry * 1.3) * sc + 40}) scale(${sc})">${v.draw({ view: 'front', expr: 'smile', mouth: 'ah', pose: POSES.wave })}</g>` + captionPreview(["Hello, SoSmart viewers!", "Kuya SoLight 'to!"], ['SoSmart', 'SoLight']);
  console.log("frame", v.id); writeFileSync(`${OUT}/${v.id}-frame.png`, svgToPng(svgWrap(f), 720));
});
writeFileSync(`${OUT}/variants.json`, JSON.stringify(A_VARIANTS.map(({ draw, ...r }) => r), null, 1));
console.log('A variants rendered');
