// Look variations of the owner-selected direction A (Friendly Solar Expert).
// Same construction rules (soft 2D, clean even outlines, big expressive eyes, navy + gold),
// different hair / face details / outfit cut. A1 is the original look, kept as requested.
import { CFG_A, Cfg, build } from './styles.ts';

const NAVY = '#0B3B7A', GOLD = '#F5AE0B', CREAM = '#FFF8E8', OUT = '#17202c';

const stubble = (op: number) => (cx: number, cy: number, R: number, Ry: number, v: string) => {
  const off = v === 'threeQuarter' ? R * 0.15 : 0;
  return `<path d="M${cx - R * 0.86 + off},${cy + Ry * 0.2} Q${cx - R * 0.78 + off},${cy + Ry * 0.96} ${cx + off},${cy + Ry * 1.0} Q${cx + R * 0.78 + off},${cy + Ry * 0.96} ${cx + R * 0.86 + off},${cy + Ry * 0.2} Q${cx + R * 0.6 + off},${cy + Ry * 0.72} ${cx + off},${cy + Ry * 0.7} Q${cx - R * 0.6 + off},${cy + Ry * 0.72} ${cx - R * 0.86 + off},${cy + Ry * 0.2} Z" fill="#2a1a10" opacity="${op}"/>`;
};

const backHair = (fill: string) => (cx: number, cy: number, R: number, Ry: number) =>
  `<path d="M${cx - R * 1.02},${cy + Ry * 0.15} C${cx - R * 1.1},${cy - Ry * 1.3} ${cx + R * 1.1},${cy - Ry * 1.3} ${cx + R * 1.02},${cy + Ry * 0.15} Q${cx},${cy + Ry * 0.45} ${cx - R * 1.02},${cy + Ry * 0.15} Z" fill="${fill}" stroke="${OUT}" stroke-width="4"/>`;

// A2 — short textured fade + light stubble, slightly squarer jaw
const A2: Cfg = {
  ...CFG_A, id: 'KSL-A2', name: 'A2 · Fade & Stubble',
  summary: 'Same friendly A construction with a short textured fade, light stubble and a slightly squarer jaw. Reads a bit older (mid-30s) and more grounded.',
  jaw: 0.7,
  extraFace: stubble(0.16),
  hairFront: (cx, cy, R, Ry, v) => v === 'back' ? backHair('#1d130d')(cx, cy, R, Ry) :
    `<path d="M${cx - R * 1.0},${cy - Ry * 0.12} C${cx - R * 1.04},${cy - Ry * 0.95} ${cx - R * 0.5},${cy - Ry * 1.18} ${cx},${cy - Ry * 1.16} C${cx + R * 0.55},${cy - Ry * 1.18} ${cx + R * 1.04},${cy - Ry * 0.95} ${cx + R * 1.0},${cy - Ry * 0.12} C${cx + R * 0.94},${cy - Ry * 0.5} ${cx + R * 0.75},${cy - Ry * 0.66} ${cx + R * 0.4},${cy - Ry * 0.7} L${cx - R * 0.4},${cy - Ry * 0.7} C${cx - R * 0.75},${cy - Ry * 0.66} ${cx - R * 0.94},${cy - Ry * 0.5} ${cx - R * 1.0},${cy - Ry * 0.12} Z" fill="#1d130d" stroke="${OUT}" stroke-width="4"/>` +
    `<path d="M${cx - R * 0.98},${cy - Ry * 0.3} L${cx - R * 0.9},${cy - Ry * 0.55} M${cx + R * 0.98},${cy - Ry * 0.3} L${cx + R * 0.9},${cy - Ry * 0.55}" stroke="#4a3a2e" stroke-width="10" opacity="0.5"/>` +
    [-0.5, -0.2, 0.1, 0.4].map((k) => `<path d="M${cx + R * k},${cy - Ry * 1.08} q${R * 0.08},${-Ry * 0.05} ${R * 0.16},0" fill="none" stroke="#4a3526" stroke-width="4" stroke-linecap="round"/>`).join(''),
};

// A3 — fuller wavy hair + thin round glasses
const A3: Cfg = {
  ...CFG_A, id: 'KSL-A3', name: 'A3 · Wavy Hair & Glasses',
  summary: 'Fuller wavy hair swept back and thin round navy glasses. Signals "knows the tech" without implying credentials. Glasses are a fixed part of the design.',
  hairFront: (cx, cy, R, Ry, v) => v === 'back' ? backHair('#24170f')(cx, cy, R, Ry) :
    `<path d="M${cx - R * 1.05},${cy - Ry * 0.05} C${cx - R * 1.2},${cy - Ry * 0.9} ${cx - R * 0.7},${cy - Ry * 1.42} ${cx - R * 0.1},${cy - Ry * 1.3} C${cx + R * 0.2},${cy - Ry * 1.45} ${cx + R * 0.75},${cy - Ry * 1.35} ${cx + R * 0.9},${cy - Ry * 1.05} C${cx + R * 1.18},${cy - Ry * 0.85} ${cx + R * 1.14},${cy - Ry * 0.35} ${cx + R * 1.03},${cy - Ry * 0.02} C${cx + R * 0.96},${cy - Ry * 0.5} ${cx + R * 0.7},${cy - Ry * 0.72} ${cx + R * 0.35},${cy - Ry * 0.66} C${cx + R * 0.1},${cy - Ry * 0.82} ${cx - R * 0.3},${cy - Ry * 0.8} ${cx - R * 0.5},${cy - Ry * 0.62} C${cx - R * 0.8},${cy - Ry * 0.62} ${cx - R * 0.95},${cy - Ry * 0.35} ${cx - R * 1.05},${cy - Ry * 0.05} Z" fill="#24170f" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M${cx - R * 0.6},${cy - Ry * 1.05} q${R * 0.2},${-Ry * 0.15} ${R * 0.4},0 q${R * 0.2},${Ry * 0.12} ${R * 0.42},-${Ry * 0.04}" fill="none" stroke="#4a3526" stroke-width="5" stroke-linecap="round"/>`,
  overHead: (cx, cy, R, Ry, v) => {
    if (v === 'back') return '';
    const off = v === 'threeQuarter' ? R * 0.2 : 0, sp = R * 0.4 * (v === 'threeQuarter' ? 0.85 : 1), y = cy + Ry * 0.03;
    return [-1, 1].map((s) => `<circle cx="${cx + off + s * sp}" cy="${y}" r="${R * 0.24}" fill="#cfe3f5" fill-opacity="0.15" stroke="${NAVY}" stroke-width="5"/>`).join('') +
      `<path d="M${cx + off - sp + R * 0.24},${y - R * 0.03} Q${cx + off},${y - R * 0.12} ${cx + off + sp - R * 0.24},${y - R * 0.03}" fill="none" stroke="${NAVY}" stroke-width="5"/>`;
  },
};

// A4 — navy collared work shirt (rolled sleeves), khaki trousers, brown shoes
const A4: Cfg = {
  ...CFG_A, id: 'KSL-A4', name: 'A4 · Field Shirt',
  summary: 'Original A face and hair with a navy button-down field shirt (sleeves rolled), gold placket piping, khaki trousers and brown shoes. A bit more "site visit ready".',
  sleeveLen: 0.85, pants: '#8C7A57', shoes: '#5b3b22',
  torsoDetail: (cx, c) => `<path d="M${cx - 56},${c.sy - 12} L${cx - 8},${c.sy + 36} L${cx - 30},${c.sy + 44} L${cx - 62},${c.sy + 4} Z M${cx + 56},${c.sy - 12} L${cx + 8},${c.sy + 36} L${cx + 30},${c.sy + 44} L${cx + 62},${c.sy + 4} Z" fill="#0e2240" stroke="${OUT}" stroke-width="3"/>` +
    `<path d="M${cx},${c.sy + 30} L${cx},${c.hipY}" stroke="${GOLD}" stroke-width="5"/>` + [60, 120, 180, 240].map((d) => `<circle cx="${cx + 9}" cy="${c.sy + d}" r="4.5" fill="${CREAM}"/>`).join('') +
    `<rect x="${cx - c.wh + 22}" y="${c.sy + 70}" width="54" height="46" rx="4" fill="none" stroke="#0b1a2e" stroke-width="4"/><rect x="${cx + 34}" y="${c.sy + 72}" width="62" height="20" rx="4" fill="${GOLD}"/><text x="${cx + 65}" y="${c.sy + 87}" font-family="Inter" font-weight="800" font-size="12" text-anchor="middle" fill="${NAVY}">KUYA</text>`,
};

// A5 — curly top, deeper skin tone, polo with contrast gold sleeve bands
const A5: Cfg = {
  ...CFG_A, id: 'KSL-A5', name: 'A5 · Curly Top',
  summary: 'Short curly top with neat sides and a deeper morena skin tone, same navy polo. Gives the character a more distinctive silhouette in thumbnails.',
  skin: '#A86A42', skinShade: '#86502d',
  hairFront: (cx, cy, R, Ry, v) => {
    if (v === 'back') return backHair('#1a100a')(cx, cy, R, Ry);
    const base = `<path d="M${cx - R * 1.0},${cy - Ry * 0.08} C${cx - R * 1.05},${cy - Ry * 0.9} ${cx + R * 1.05},${cy - Ry * 0.9} ${cx + R * 1.0},${cy - Ry * 0.08} C${cx + R * 0.9},${cy - Ry * 0.45} ${cx - R * 0.9},${cy - Ry * 0.45} ${cx - R * 1.0},${cy - Ry * 0.08} Z" fill="#1a100a" stroke="${OUT}" stroke-width="4"/>`;
    const curls: string[] = [];
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.08 + (i / 8) * 0.84);
      curls.push(`<circle cx="${cx + Math.cos(a) * R * 0.78}" cy="${cy - Ry * 0.42 + Math.sin(a) * Ry * 0.78}" r="${R * 0.24}" fill="#1a100a" stroke="${OUT}" stroke-width="4"/>`);
    }
    for (let i = 0; i < 5; i++) curls.push(`<circle cx="${cx + (i - 2) * R * 0.32}" cy="${cy - Ry * 0.95 + (i % 2) * 8}" r="${R * 0.22}" fill="#1a100a"/>`);
    curls.push(...[-0.4, 0, 0.4].map((k) => `<path d="M${cx + R * k - 10},${cy - Ry * 1.0} q10,-12 20,0" fill="none" stroke="#3e2a1d" stroke-width="4" stroke-linecap="round"/>`));
    return base + curls.join('');
  },
};

const A1: Cfg = { ...CFG_A, id: 'KSL-A1', name: 'A1 · Original (current)', summary: 'The A look you approved: side-part hair, clean-shaven, navy polo with gold collar and sleeve trims.' };

export const A_VARIANT_CFGS = [A1, A2, A3, A4, A5];
export const A_VARIANTS = A_VARIANT_CFGS.map(build);
