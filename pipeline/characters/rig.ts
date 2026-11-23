// Shared 2D puppet rig for Kuya SoLight character directions.
// Every direction draws into a 600x1500 local box (feet at y≈1460, centre x=300)
// from the same State, so the renderer can animate any approved direction with the
// same controls: view, expression, viseme (mouth), blink, gaze and limb angles.

export type View = 'front' | 'threeQuarter' | 'side' | 'back';
export type Expression = 'neutral' | 'smile' | 'explain' | 'concerned';
export type Viseme = 'rest' | 'mbp' | 'ee' | 'eh' | 'ah' | 'oh' | 'smile';

export interface Arm { shoulder: number; elbow: number; hand?: 'open' | 'point' | 'fist' | 'wave' }
export interface Pose {
  lArm: Arm; rArm: Arm; // l = viewer-left, r = viewer-right
  lLeg: number; rLeg: number; // hip angle degrees (+ outward)
  lean: number; headTilt: number; bob: number;
}
export interface State {
  view: View; expr: Expression; mouth?: Viseme; blink?: number; lookX?: number; lookY?: number; pose?: Partial<Pose>;
}

export const POSES: Record<string, Pose> = {
  idle: { lArm: { shoulder: 8, elbow: 6, hand: 'open' }, rArm: { shoulder: 8, elbow: 6, hand: 'open' }, lLeg: 3, rLeg: 3, lean: 0, headTilt: 0, bob: 0 },
  explain: { lArm: { shoulder: 10, elbow: 8, hand: 'open' }, rArm: { shoulder: 38, elbow: 95, hand: 'open' }, lLeg: 3, rLeg: 3, lean: 0, headTilt: 3, bob: 0 },
  point: { lArm: { shoulder: 8, elbow: 6, hand: 'open' }, rArm: { shoulder: 118, elbow: 8, hand: 'point' }, lLeg: 3, rLeg: 5, lean: 2, headTilt: 4, bob: 0 },
  pointUp: { lArm: { shoulder: 8, elbow: 6, hand: 'open' }, rArm: { shoulder: 150, elbow: 12, hand: 'point' }, lLeg: 3, rLeg: 3, lean: 1, headTilt: 5, bob: 0 },
  wave: { lArm: { shoulder: 8, elbow: 6, hand: 'open' }, rArm: { shoulder: 130, elbow: 50, hand: 'wave' }, lLeg: 3, rLeg: 4, lean: 0, headTilt: -3, bob: 0 },
  present: { lArm: { shoulder: 50, elbow: 30, hand: 'open' }, rArm: { shoulder: 50, elbow: 30, hand: 'open' }, lLeg: 4, rLeg: 4, lean: 0, headTilt: 0, bob: 0 },
  walkA: { lArm: { shoulder: -14, elbow: 14, hand: 'fist' }, rArm: { shoulder: 22, elbow: 18, hand: 'fist' }, lLeg: 12, rLeg: -6, lean: 1, headTilt: 0, bob: -8 },
  walkB: { lArm: { shoulder: 22, elbow: 18, hand: 'fist' }, rArm: { shoulder: -14, elbow: 14, hand: 'fist' }, lLeg: -6, rLeg: 12, lean: 1, headTilt: 0, bob: 0 },
  concerned: { lArm: { shoulder: 6, elbow: 4, hand: 'open' }, rArm: { shoulder: 20, elbow: -150, hand: 'fist' }, lLeg: 2, rLeg: 2, lean: -1, headTilt: -5, bob: 0 },
};

export function resolvePose(p?: Partial<Pose>): Pose {
  return { ...POSES.idle, ...(p || {}) } as Pose;
}

// Expressions resolve to a default viseme and brow/eye shaping used by each style.
export interface FaceShape { browL: number; browR: number; browY: number; eyeOpen: number; mouth: Viseme; cheek: boolean }
export function faceFor(expr: Expression, mouth?: Viseme, blink = 0): FaceShape {
  const base: Record<Expression, FaceShape> = {
    neutral: { browL: 0, browR: 0, browY: 0, eyeOpen: 1, mouth: 'rest', cheek: false },
    smile: { browL: -4, browR: -4, browY: -3, eyeOpen: 0.82, mouth: 'smile', cheek: true },
    explain: { browL: -2, browR: 6, browY: -6, eyeOpen: 1.05, mouth: 'eh', cheek: false },
    concerned: { browL: 12, browR: 12, browY: -2, eyeOpen: 0.95, mouth: 'mbp', cheek: false },
  };
  const f = { ...base[expr] };
  if (mouth) f.mouth = mouth;
  f.eyeOpen = Math.max(0.06, f.eyeOpen * (1 - blink));
  return f;
}

export const r2 = (n: number) => Math.round(n * 10) / 10;
export const rad = (d: number) => (d * Math.PI) / 180;

/** Polyline points for an arm with shoulder at (sx,sy). side=-1 viewer-left, +1 viewer-right. */
export function armPoints(sx: number, sy: number, side: -1 | 1, arm: Arm, upper: number, lower: number) {
  const a1 = rad(arm.shoulder) * side; // rotate outward from straight down
  const ex = sx + Math.sin(a1) * upper;
  const ey = sy + Math.cos(a1) * upper;
  // positive elbow raises the forearm outward/up; negative brings it across the body
  const fore = a1 + rad(arm.elbow) * side;
  const hx = ex + Math.sin(fore) * lower;
  const hy = ey + Math.cos(fore) * lower;
  return { ex, ey, hx, hy, dir: fore };
}

export function hand(x: number, y: number, dir: number, size: number, kind: Arm['hand'], skin: string, outline: string, sw: number, side: -1 | 1) {
  const deg = (-dir * 180) / Math.PI;
  const s = size;
  const st = sw > 0 ? `stroke="${outline}" stroke-width="${sw}" stroke-linejoin="round"` : '';
  let shape = '';
  if (kind === 'point') {
    // "Point" = open-palm presenting gesture: all four fingers together, extended toward the target, thumb alongside.
    // Never a single extended finger (reads as rude, and index-finger pointing is impolite in PH culture).
    const creases = [-0.22, 0, 0.22].map((fx) => `<line x1="${r2(fx * s)}" y1="${r2(s * 0.62)}" x2="${r2(fx * s)}" y2="${r2(s * 1.12)}" stroke="${outline}" stroke-width="${r2(Math.max(1, sw * 0.6))}" stroke-linecap="round" opacity="0.55"/>`).join('');
    shape = `<rect x="${r2(-s * 0.46)}" y="${r2(s * 0.3)}" width="${r2(s * 0.92)}" height="${r2(s * 0.95)}" rx="${r2(s * 0.3)}" fill="${skin}" ${st}/>` +
      `<ellipse cx="0" cy="${r2(s * 0.28)}" rx="${r2(s * 0.54)}" ry="${r2(s * 0.46)}" fill="${skin}" ${st}/>` +
      `<rect x="${r2(-s * 0.44)}" y="${r2(s * 0.38)}" width="${r2(s * 0.88)}" height="${r2(s * 0.3)}" fill="${skin}"/>` + creases +
      `<rect x="${side > 0 ? r2(-s * 0.78) : r2(s * 0.38)}" y="${r2(s * 0.1)}" width="${r2(s * 0.4)}" height="${r2(s * 0.22)}" rx="${r2(s * 0.11)}" fill="${skin}" ${st} transform="rotate(${side > 0 ? 55 : -55} ${side > 0 ? r2(-s * 0.55) : r2(s * 0.55)} ${r2(s * 0.2)})"/>`;
  } else if (kind === 'fist') {
    shape = `<ellipse cx="0" cy="${s * 0.25}" rx="${s * 0.56}" ry="${s * 0.55}" fill="${skin}" ${st}/>`;
  } else {
    // open hand / wave: palm + 4 finger lobes + thumb
    const fingers = [-0.36, -0.12, 0.12, 0.36].map((fx, i) => `<rect x="${r2(fx * s - s * 0.11)}" y="${r2(s * 0.35)}" width="${r2(s * 0.22)}" height="${r2(s * (0.62 + (i === 1 || i === 2 ? 0.12 : 0)))}" rx="${r2(s * 0.11)}" fill="${skin}" ${st}/>`).join('');
    shape = fingers + `<ellipse cx="0" cy="${s * 0.3}" rx="${s * 0.52}" ry="${s * 0.46}" fill="${skin}" ${st}/>` +
      `<rect x="${side > 0 ? -s * 0.75 : s * 0.35}" y="${s * 0.05}" width="${s * 0.4}" height="${s * 0.2}" rx="${s * 0.1}" fill="${skin}" ${st} transform="rotate(${side > 0 ? 30 : -30} ${side > 0 ? -s * 0.55 : s * 0.55} ${s * 0.15})"/>`;
  }
  return `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${r2(deg)})">${shape}</g>`;
}

export interface CharacterStyle {
  id: string; // permanent character direction ID
  name: string;
  version: string;
  summary: string;
  strengths: string[];
  risks: string[];
  rig: string; // proposed rigging method
  effort: { setupDays: string; perEpisode: string; reuse: string; consistency: string };
  palette: Record<string, string>;
  head: { cy: number; r: number; ry: number };
  footY: number;
  draw(state: State): string; // returns <g> content in 600x1500 local box
}
