// Four ORIGINAL Kuya SoLight visual directions (A–D). They share the rig controls but
// are deliberately drawn with different construction rules. Do not merge styles before
// the owner selects one (spec §3).
import { CharacterStyle, State, View, faceFor, resolvePose, armPoints, hand, r2, FaceShape, Viseme } from './rig.ts';

export interface Cfg {
  id: string; name: string; summary: string; strengths: string[]; risks: string[]; rig: string;
  effort: CharacterStyle['effort'];
  headR: number; headRy: number; headCY: number; jaw: number; neckW: number; neckH: number;
  sy: number; sh: number; wy: number; wh: number; hipY: number; footY: number; legGap: number; legW: number;
  armW: number; upper: number; lower: number; handS: number; longSleeve: boolean; sleeveLen: number;
  skin: string; skinShade: string; hair: string; shirt: string; shirtShade: string; accent: string; pants: string; shoes: string; outline: string; sw: number;
  shaded: boolean; flat: boolean;
  eyes: 'big' | 'glossy' | 'dot' | 'human';
  hairFront(cx: number, cy: number, R: number, Ry: number, view: View): string;
  hairBack(cx: number, cy: number, R: number, Ry: number, view: View): string;
  torsoDetail(cx: number, c: Cfg, view: View): string;
  extraFace?(cx: number, cy: number, R: number, Ry: number, view: View): string;
  overHead?(cx: number, cy: number, R: number, Ry: number, view: View): string;
}

function st(c: Cfg, w = c.sw) { return w > 0 ? ` stroke="${c.outline}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"` : ''; }

function limb(x1: number, y1: number, x2: number, y2: number, w: number, color: string, c: Cfg) {
  const o = c.sw > 0 ? `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" stroke="${c.outline}" stroke-width="${w + c.sw * 2}" stroke-linecap="round"/>` : '';
  return o + `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
}

function mouthPath(m: Viseme, x: number, y: number, s: number, c: Cfg): string {
  const dark = '#5a1f1f', tongue = '#d9746b';
  const lip = c.flat ? c.outline : '#3b1a12';
  switch (m) {
    case 'rest': return `<path d="M${x - s * 0.45},${y} Q${x},${y + s * 0.12} ${x + s * 0.45},${y}" fill="none" stroke="${lip}" stroke-width="${Math.max(3, s * 0.09)}" stroke-linecap="round"/>`;
    case 'mbp': return `<path d="M${x - s * 0.38},${y + s * 0.04} L${x + s * 0.38},${y + s * 0.04}" stroke="${lip}" stroke-width="${Math.max(3, s * 0.1)}" stroke-linecap="round"/>`;
    case 'smile': return `<path d="M${x - s * 0.6},${y - s * 0.08} Q${x},${y + s * 0.55} ${x + s * 0.6},${y - s * 0.08} Q${x},${y + s * 0.2} ${x - s * 0.6},${y - s * 0.08} Z" fill="${dark}" stroke="${lip}" stroke-width="${Math.max(2, s * 0.06)}" stroke-linejoin="round"/><path d="M${x - s * 0.42},${y + s * 0.02} Q${x},${y + s * 0.14} ${x + s * 0.42},${y + s * 0.02}" fill="#fff"/>`;
    case 'ee': return `<rect x="${x - s * 0.45}" y="${y - s * 0.08}" width="${s * 0.9}" height="${s * 0.22}" rx="${s * 0.11}" fill="${dark}" stroke="${lip}" stroke-width="${Math.max(2, s * 0.06)}"/><rect x="${x - s * 0.36}" y="${y - s * 0.07}" width="${s * 0.72}" height="${s * 0.07}" fill="#fff"/>`;
    case 'eh': return `<path d="M${x - s * 0.42},${y - s * 0.05} Q${x},${y - s * 0.1} ${x + s * 0.42},${y - s * 0.05} Q${x + s * 0.3},${y + s * 0.34} ${x},${y + s * 0.34} Q${x - s * 0.3},${y + s * 0.34} ${x - s * 0.42},${y - s * 0.05} Z" fill="${dark}" stroke="${lip}" stroke-width="${Math.max(2, s * 0.06)}"/><ellipse cx="${x}" cy="${y + s * 0.24}" rx="${s * 0.2}" ry="${s * 0.07}" fill="${tongue}"/>`;
    case 'ah': return `<path d="M${x - s * 0.4},${y - s * 0.08} Q${x},${y - s * 0.14} ${x + s * 0.4},${y - s * 0.08} Q${x + s * 0.34},${y + s * 0.6} ${x},${y + s * 0.6} Q${x - s * 0.34},${y + s * 0.6} ${x - s * 0.4},${y - s * 0.08} Z" fill="${dark}" stroke="${lip}" stroke-width="${Math.max(2, s * 0.06)}"/><ellipse cx="${x}" cy="${y + s * 0.45}" rx="${s * 0.22}" ry="${s * 0.1}" fill="${tongue}"/><rect x="${x - s * 0.28}" y="${y - s * 0.09}" width="${s * 0.56}" height="${s * 0.08}" fill="#fff"/>`;
    case 'oh': return `<ellipse cx="${x}" cy="${y + s * 0.18}" rx="${s * 0.22}" ry="${s * 0.28}" fill="${dark}" stroke="${lip}" stroke-width="${Math.max(2, s * 0.06)}"/>`;
  }
}

function eyesAndBrows(c: Cfg, cx: number, cy: number, R: number, f: FaceShape, view: View, lookX: number, lookY: number) {
  const tq = view === 'threeQuarter';
  const off = tq ? R * 0.2 : 0;
  const spread = R * (c.eyes === 'dot' ? 0.36 : 0.4) * (tq ? 0.85 : 1);
  const ey = cy - R * 0.02;
  let out = '';
  [-1, 1].forEach((side) => {
    const far = tq && side === -1;
    const ex = cx + off + side * spread;
    const sc = far ? 0.82 : 1;
    const bx = ex, by = ey - R * (c.eyes === 'dot' ? 0.26 : 0.36) + f.browY;
    const tilt = side === -1 ? f.browL : -f.browR;
    if (c.eyes === 'big') {
      const rx = R * 0.17 * sc, ry = R * 0.21 * f.eyeOpen;
      out += `<ellipse cx="${r2(ex)}" cy="${r2(ey)}" rx="${r2(rx)}" ry="${r2(ry)}" fill="#fff"${st(c, c.sw * 0.8)}/>`;
      if (f.eyeOpen > 0.3) out += `<circle cx="${r2(ex + lookX * rx * 0.35)}" cy="${r2(ey + lookY * ry * 0.3 + ry * 0.1)}" r="${r2(rx * 0.62)}" fill="#3a2416"/><circle cx="${r2(ex + lookX * rx * 0.35)}" cy="${r2(ey + lookY * ry * 0.3 + ry * 0.1)}" r="${r2(rx * 0.34)}" fill="#120b07"/><circle cx="${r2(ex + lookX * rx * 0.35 + rx * 0.22)}" cy="${r2(ey - ry * 0.18)}" r="${r2(rx * 0.2)}" fill="#fff"/>`;
      out += `<path d="M${r2(bx - R * 0.17)},${r2(by + (tilt > 0 ? -tilt * 0.3 : 0))} Q${r2(bx)},${r2(by - R * 0.07 - Math.abs(tilt) * 0.2)} ${r2(bx + R * 0.17)},${r2(by + (tilt < 0 ? tilt * 0.3 : 0))}" fill="none" stroke="${c.hair}" stroke-width="${R * 0.07}" stroke-linecap="round" transform="rotate(${side * tilt} ${bx} ${by})"/>`;
    } else if (c.eyes === 'glossy') {
      const rx = R * 0.15 * sc, ry = R * 0.17 * f.eyeOpen;
      out += `<ellipse cx="${r2(ex)}" cy="${r2(ey)}" rx="${r2(rx)}" ry="${r2(ry)}" fill="#fbfbfb"/>`;
      if (f.eyeOpen > 0.3) out += `<circle cx="${r2(ex + lookX * rx * 0.3)}" cy="${r2(ey + ry * 0.05)}" r="${r2(rx * 0.68)}" fill="url(#irisB)"/><circle cx="${r2(ex + lookX * rx * 0.3)}" cy="${r2(ey + ry * 0.05)}" r="${r2(rx * 0.34)}" fill="#0b0806"/><circle cx="${r2(ex + lookX * rx * 0.3 + rx * 0.25)}" cy="${r2(ey - ry * 0.25)}" r="${r2(rx * 0.22)}" fill="#fff" opacity="0.95"/><circle cx="${r2(ex - rx * 0.2)}" cy="${r2(ey + ry * 0.35)}" r="${r2(rx * 0.1)}" fill="#fff" opacity="0.7"/>`;
      out += `<path d="M${r2(ex - rx * 1.05)},${r2(ey - ry * 0.25)} Q${r2(ex)},${r2(ey - ry * 1.35)} ${r2(ex + rx * 1.05)},${r2(ey - ry * 0.25)}" fill="none" stroke="#2a1a12" stroke-width="${R * 0.035}" stroke-linecap="round"/>`;
      out += `<path d="M${r2(bx - R * 0.16)},${r2(by)} Q${r2(bx)},${r2(by - R * 0.06)} ${r2(bx + R * 0.16)},${r2(by)}" fill="none" stroke="${c.hair}" stroke-width="${R * 0.055}" stroke-linecap="round" transform="rotate(${side * tilt} ${bx} ${by})"/>`;
    } else if (c.eyes === 'dot') {
      const r = R * 0.075 * sc;
      out += f.eyeOpen > 0.3 ? `<ellipse cx="${r2(ex + lookX * 2)}" cy="${r2(ey)}" rx="${r2(r)}" ry="${r2(r * Math.min(1.25, f.eyeOpen * 1.25))}" fill="${c.outline}"/>` : `<line x1="${r2(ex - r)}" y1="${r2(ey)}" x2="${r2(ex + r)}" y2="${r2(ey)}" stroke="${c.outline}" stroke-width="${r * 0.7}" stroke-linecap="round"/>`;
      out += `<rect x="${r2(bx - R * 0.13)}" y="${r2(by - R * 0.025)}" width="${r2(R * 0.26)}" height="${r2(R * 0.05)}" rx="${r2(R * 0.025)}" fill="${c.outline}" transform="rotate(${side * tilt} ${bx} ${by})"/>`;
    } else {
      // human: almond eye, iris, lid line, thicker brows
      const rx = R * 0.14 * sc, ry = R * 0.075 * f.eyeOpen;
      out += `<path d="M${r2(ex - rx)},${r2(ey)} Q${r2(ex)},${r2(ey - ry * 1.6)} ${r2(ex + rx)},${r2(ey)} Q${r2(ex)},${r2(ey + ry * 1.3)} ${r2(ex - rx)},${r2(ey)} Z" fill="#fdfaf5" stroke="#2a1810" stroke-width="2"/>`;
      if (f.eyeOpen > 0.3) out += `<circle cx="${r2(ex + lookX * rx * 0.3)}" cy="${r2(ey)}" r="${r2(rx * 0.42)}" fill="#3b2516"/><circle cx="${r2(ex + lookX * rx * 0.3)}" cy="${r2(ey)}" r="${r2(rx * 0.2)}" fill="#0d0805"/><circle cx="${r2(ex + lookX * rx * 0.3 + rx * 0.14)}" cy="${r2(ey - rx * 0.14)}" r="${r2(rx * 0.1)}" fill="#fff"/>`;
      out += `<path d="M${r2(ex - rx * 1.1)},${r2(ey - ry * 0.2)} Q${r2(ex)},${r2(ey - ry * 2)} ${r2(ex + rx * 1.1)},${r2(ey - ry * 0.4)}" fill="none" stroke="#2a1810" stroke-width="3" stroke-linecap="round"/>`;
      out += `<path d="M${r2(bx - R * 0.2)},${r2(by + R * 0.03)} Q${r2(bx)},${r2(by - R * 0.07)} ${r2(bx + R * 0.2)},${r2(by + R * 0.01)} L${r2(bx + R * 0.19)},${r2(by + R * 0.06)} Q${r2(bx)},${r2(by - R * 0.01)} ${r2(bx - R * 0.19)},${r2(by + R * 0.08)} Z" fill="${c.hair}" transform="rotate(${side * tilt} ${bx} ${by})"/>`;
    }
  });
  return out;
}

function nose(c: Cfg, x: number, y: number, R: number, view: View) {
  const tq = view === 'threeQuarter';
  if (c.eyes === 'dot') return '';
  if (c.eyes === 'human') return `<path d="M${r2(x + (tq ? R * 0.03 : 0))},${r2(y - R * 0.2)} Q${r2(x + R * (tq ? 0.14 : 0.06))},${r2(y + R * 0.05)} ${r2(x + R * (tq ? 0.1 : 0.08))},${r2(y + R * 0.1)} M${r2(x - R * 0.1)},${r2(y + R * 0.1)} Q${r2(x - R * 0.02)},${r2(y + R * 0.15)} ${r2(x + R * 0.1)},${r2(y + R * 0.1)}" fill="none" stroke="${c.skinShade}" stroke-width="3.5" stroke-linecap="round"/>`;
  if (c.eyes === 'glossy') return `<ellipse cx="${r2(x + (tq ? R * 0.08 : 0))}" cy="${r2(y + R * 0.05)}" rx="${r2(R * 0.11)}" ry="${r2(R * 0.08)}" fill="${c.skinShade}" opacity="0.55"/><ellipse cx="${r2(x + (tq ? R * 0.06 : -R * 0.02))}" cy="${r2(y + R * 0.02)}" rx="${r2(R * 0.04)}" ry="${r2(R * 0.025)}" fill="#fff" opacity="0.45"/>`;
  return `<path d="M${r2(x - R * 0.03 + (tq ? R * 0.06 : 0))},${r2(y - R * 0.04)} Q${r2(x + R * 0.08 + (tq ? R * 0.06 : 0))},${r2(y + R * 0.08)} ${r2(x - R * 0.06 + (tq ? R * 0.06 : 0))},${r2(y + R * 0.1)}" fill="none" stroke="${c.skinShade}" stroke-width="${R * 0.04}" stroke-linecap="round"/>`;
}

export function build(c: Cfg): CharacterStyle {
  return {
    id: c.id, name: c.name, version: '0.1-concept', summary: c.summary, strengths: c.strengths, risks: c.risks, rig: c.rig, effort: c.effort,
    palette: { skin: c.skin, hair: c.hair, shirt: c.shirt, accent: c.accent, pants: c.pants, shoes: c.shoes },
    head: { cy: c.headCY, r: c.headR, ry: c.headRy }, footY: c.footY,
    draw(s: State) {
      const p = resolvePose(s.pose);
      const view = s.view;
      const f = faceFor(s.expr, s.mouth, s.blink ?? 0);
      const cx = 300 + p.lean * 2;
      const bob = p.bob;
      const tq = view === 'threeQuarter';
      const back = view === 'back';
      const side = view === 'side';
      const shW = tq ? c.sh * 0.86 : side ? c.sh * 0.45 : c.sh;
      const wW = tq ? c.wh * 0.88 : side ? c.wh * 0.6 : c.wh;
      const sy = c.sy + bob, wy = c.wy + bob, hipY = c.hipY + bob;
      const R = c.headR, Ry = c.headRy, hcy = c.headCY + bob;
      const hcx = cx + (tq ? 8 : 0);
      let g = '';
      // defs for shaded style
      if (c.shaded) g += `<defs><radialGradient id="skinB" cx="0.42" cy="0.38" r="0.7"><stop offset="0" stop-color="${lighten(c.skin, 0.18)}"/><stop offset="0.7" stop-color="${c.skin}"/><stop offset="1" stop-color="${c.skinShade}"/></radialGradient><linearGradient id="shirtB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighten(c.shirt, 0.22)}"/><stop offset="1" stop-color="${c.shirtShade}"/></linearGradient><radialGradient id="irisB" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#8a5a32"/><stop offset="1" stop-color="#2e1a0d"/></radialGradient><linearGradient id="hairB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lighten(c.hair, 0.25)}"/><stop offset="1" stop-color="${c.hair}"/></linearGradient><radialGradient id="shadowB" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0.28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>`;
      const skinFill = c.shaded ? 'url(#skinB)' : c.skin;
      const shirtFill = c.shaded ? 'url(#shirtB)' : c.shirt;
      // ground shadow
      g += `<ellipse cx="${cx}" cy="${c.footY + 18}" rx="${c.sh * 1.15}" ry="18" fill="${c.shaded ? 'url(#shadowB)' : '#000'}" opacity="${c.shaded ? 1 : 0.12}"/>`;
      // hair behind head
      g += c.hairBack(hcx, hcy, R, Ry, view);
      // legs
      const legTop = hipY - 10;
      const legLen = c.footY - legTop;
      const legs = [-1, 1].map((sd) => {
        const ang = ((sd === -1 ? p.lLeg : p.rLeg) * Math.PI) / 180 * (sd as number);
        const lx = cx + sd * c.legGap * (side ? 0.3 : tq ? 0.85 : 1);
        const fx = lx + Math.sin(ang) * legLen, fy = legTop + Math.cos(ang) * legLen;
        return limb(lx, legTop, fx, fy, c.legW, c.pants, c) + `<ellipse cx="${r2(fx + (side ? 16 : tq ? 8 : sd * 6))}" cy="${r2(fy + c.legW * 0.18)}" rx="${r2(c.legW * (side ? 0.95 : 0.72))}" ry="${r2(c.legW * 0.36)}" fill="${c.shoes}"${st(c)}/>` + (c.flat ? '' : `<path d="M${r2(fx - c.legW * 0.6)},${r2(fy + c.legW * 0.3)} L${r2(fx + c.legW * 0.7)},${r2(fy + c.legW * 0.3)}" stroke="#ffffff" stroke-opacity="0.5" stroke-width="4"/>`);
      });
      g += legs.join('');
      // arms (drawn behind torso when back view)
      const arms = ([-1, 1] as const).map((sd) => {
        const arm = sd === -1 ? p.lArm : p.rArm;
        const sx = cx + sd * (shW - c.armW * 0.45), syy = sy + c.armW * 0.45;
        const a = armPoints(sx, syy, sd, arm, c.upper, c.lower);
        const sleeveEndT = Math.min(1, c.sleeveLen);
        const mx = sx + (a.ex - sx) * sleeveEndT, my = syy + (a.ey - syy) * sleeveEndT;
        let out = '';
        if (c.longSleeve) out += limb(sx, syy, a.ex, a.ey, c.armW, c.shirt, c) + limb(a.ex, a.ey, a.hx, a.hy, c.armW * 0.92, c.shirt, c);
        else out += limb(a.ex, a.ey, a.hx, a.hy, c.armW * 0.78, c.skin, c) + limb(sx, syy, a.ex, a.ey, c.armW * 0.8, c.skin, c) + limb(sx, syy, mx, my, c.armW * 1.12, c.shirt, c) + `<circle cx="${r2(mx)}" cy="${r2(my)}" r="${r2(c.armW * 0.56)}" fill="${c.accent}"/>`;
        if (c.longSleeve) out += `<circle cx="${r2(a.hx - Math.sin(a.dir) * 4)}" cy="${r2(a.hy - Math.cos(a.dir) * 4)}" r="${r2(c.armW * 0.5)}" fill="${c.accent}"/>`;
        out += hand(a.hx, a.hy, a.dir, c.handS, back ? 'fist' : arm.hand, c.skin, c.outline, c.sw * 0.8, sd);
        return out;
      });
      if (back) g += arms.join('');
      // neck
      g += `<rect x="${r2(hcx - c.neckW / 2)}" y="${r2(hcy + Ry * 0.55)}" width="${c.neckW}" height="${r2(sy - (hcy + Ry * 0.55) + 22)}" fill="${c.skinShade}"${st(c)}/>`;
      // torso
      const torso = `M${r2(cx - shW)},${r2(sy + 34)} Q${r2(cx - shW)},${r2(sy - 6)} ${r2(cx - shW + 46)},${r2(sy - 10)} L${r2(cx + shW - 46)},${r2(sy - 10)} Q${r2(cx + shW)},${r2(sy - 6)} ${r2(cx + shW)},${r2(sy + 34)} L${r2(cx + wW + 4)},${r2(wy)} L${r2(cx + wW)},${r2(hipY)} L${r2(cx - wW)},${r2(hipY)} L${r2(cx - wW - 4)},${r2(wy)} Z`;
      g += `<path d="${torso}" fill="${shirtFill}"${st(c)}/>`;
      if (!back) g += c.torsoDetail(cx, { ...c, sh: shW, wh: wW, sy, wy, hipY }, view);
      else g += `<path d="M${r2(cx - 46)},${r2(sy - 10)} Q${cx},${r2(sy + 8)} ${r2(cx + 46)},${r2(sy - 10)}" fill="none" stroke="${c.accent}" stroke-width="10"/>`;
      if (!back) g += arms.join('');
      // head
      const jaw = c.jaw;
      const headPath = `M${r2(hcx - R)},${r2(hcy - Ry * 0.1)} C${r2(hcx - R)},${r2(hcy - Ry * 1.05)} ${r2(hcx + R)},${r2(hcy - Ry * 1.05)} ${r2(hcx + R)},${r2(hcy - Ry * 0.1)} C${r2(hcx + R)},${r2(hcy + Ry * 0.55)} ${r2(hcx + R * jaw)},${r2(hcy + Ry * 0.98)} ${r2(hcx)},${r2(hcy + Ry)} C${r2(hcx - R * jaw)},${r2(hcy + Ry * 0.98)} ${r2(hcx - R)},${r2(hcy + Ry * 0.55)} ${r2(hcx - R)},${r2(hcy - Ry * 0.1)} Z`;
      const tilt = p.headTilt;
      let head = '';
      // ears
      if (!back) {
        const earSides = tq ? [-1] : side ? [] : [-1, 1];
        head += earSides.map((sd) => `<ellipse cx="${r2(hcx + sd * R * 0.98)}" cy="${r2(hcy + Ry * 0.08)}" rx="${r2(R * 0.16)}" ry="${r2(Ry * 0.22)}" fill="${c.skin}"${st(c)}/><ellipse cx="${r2(hcx + sd * R * 0.98)}" cy="${r2(hcy + Ry * 0.08)}" rx="${r2(R * 0.07)}" ry="${r2(Ry * 0.12)}" fill="${c.skinShade}"/>`).join('');
      } else {
        head += [-1, 1].map((sd) => `<ellipse cx="${r2(hcx + sd * R * 0.98)}" cy="${r2(hcy + Ry * 0.08)}" rx="${r2(R * 0.15)}" ry="${r2(Ry * 0.21)}" fill="${c.skin}"${st(c)}/>`).join('');
      }
      head += `<path d="${headPath}" fill="${skinFill}"${st(c)}/>`;
      if (!back) {
        if (c.extraFace) head += c.extraFace(hcx, hcy, R, Ry, view);
        if (f.cheek && !c.flat) head += [-1, 1].map((sd) => `<ellipse cx="${r2(hcx + (tq ? R * 0.18 : 0) + sd * R * 0.52)}" cy="${r2(hcy + Ry * 0.3)}" rx="${r2(R * 0.14)}" ry="${r2(R * 0.08)}" fill="#e2765f" opacity="0.32"/>`).join('');
        head += eyesAndBrows(c, hcx, hcy + (c.eyes === 'dot' ? 0 : Ry * 0.05), R, f, view, s.lookX ?? 0, s.lookY ?? 0);
        head += nose(c, hcx + (tq ? R * 0.2 : 0), hcy + Ry * 0.28, R, view);
        const ms = c.eyes === 'dot' ? R * 0.4 : R * 0.38;
        head += mouthPath(f.mouth, hcx + (tq ? R * 0.2 : 0), hcy + Ry * (c.eyes === 'dot' ? 0.45 : 0.56), ms, c);
      }
      head += c.hairFront(hcx, hcy, R, Ry, view);
      if (c.overHead) head += c.overHead(hcx, hcy, R, Ry, view);
      g += `<g transform="rotate(${tilt} ${hcx} ${hcy + Ry})">${head}</g>`;
      return `<g>${g}</g>`;
    },
  };
}

export function lighten(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * amt));
  return '#' + ch.map((v) => v.toString(16).padStart(2, '0')).join('');
}

const NAVY = '#0B3B7A', GOLD = '#F5AE0B', CREAM = '#FFF8E8';

// ── Option A — Friendly Solar Expert (premium soft 2D, clean outlines) ───────────────
export const CFG_A: Cfg = {
  id: 'KSL-A', name: 'A · Friendly Solar Expert',
  summary: 'Premium soft-vector 2D presenter. Rounded shapes, expressive eyes, navy polo with gold collar and sleeve trims. Clean, even line weight.',
  strengths: ['Easiest to animate consistently (flat layers, few gradients)', 'Reads clearly at phone size', 'Warm and approachable without looking childish'],
  risks: ['Can look generic if expressions are under-used', 'Needs a disciplined colour/line spec to stay premium'],
  rig: 'Layered SVG cut-out rig (this repo): bone angles for arms/legs, 6-viseme mouth set, blink and brow controls. Portable to Rive or Moho later.',
  effort: { setupDays: '3–5 days to lock full bundle', perEpisode: 'Low (code-driven poses)', reuse: 'Very high', consistency: 'Very high (same vector parts every frame)' },
  headR: 92, headRy: 100, headCY: 300, jaw: 0.62, neckW: 46, neckH: 30,
  sy: 458, sh: 122, wy: 720, wh: 106, hipY: 800, footY: 1200, legGap: 48, legW: 70,
  armW: 44, upper: 170, lower: 160, handS: 34, longSleeve: false, sleeveLen: 0.45,
  skin: '#C98B5E', skinShade: '#A86E46', hair: '#22160F', shirt: NAVY, shirtShade: '#0c1d33', accent: GOLD, pants: '#3a4658', shoes: '#2b2b2b', outline: '#17202c', sw: 4,
  shaded: false, flat: false, eyes: 'big',
  hairBack: (cx, cy, R, Ry, v) => v === 'back' ? `<path d="M${cx - R * 1.04},${cy + Ry * 0.1} C${cx - R * 1.1},${cy - Ry * 1.25} ${cx + R * 1.1},${cy - Ry * 1.25} ${cx + R * 1.04},${cy + Ry * 0.1} C${cx + R * 0.9},${cy + Ry * 0.5} ${cx - R * 0.9},${cy + Ry * 0.5} ${cx - R * 1.04},${cy + Ry * 0.1} Z" fill="#22160F" stroke="#17202c" stroke-width="4"/>` : '',
  hairFront: (cx, cy, R, Ry, v) => v === 'back'
    ? `<path d="M${cx - R * 1.02},${cy + Ry * 0.15} C${cx - R * 1.1},${cy - Ry * 1.3} ${cx + R * 1.1},${cy - Ry * 1.3} ${cx + R * 1.02},${cy + Ry * 0.15} Q${cx},${cy + Ry * 0.45} ${cx - R * 1.02},${cy + Ry * 0.15} Z" fill="#22160F" stroke="#17202c" stroke-width="4"/><path d="M${cx - R * 0.3},${cy - Ry * 0.6} Q${cx},${cy - Ry * 0.75} ${cx + R * 0.35},${cy - Ry * 0.55}" fill="none" stroke="#3b2a1f" stroke-width="5" stroke-linecap="round"/>`
    : `<path d="M${cx - R * 1.03},${cy - Ry * 0.02} C${cx - R * 1.12},${cy - Ry * 1.05} ${cx - R * 0.2},${cy - Ry * 1.38} ${cx + R * 0.55},${cy - Ry * 1.1} C${cx + R * 1.05},${cy - Ry * 0.95} ${cx + R * 1.1},${cy - Ry * 0.4} ${cx + R * 1.02},${cy - Ry * 0.05} C${cx + R * 0.95},${cy - Ry * 0.45} ${cx + R * 0.7},${cy - Ry * 0.62} ${cx + R * 0.3},${cy - Ry * 0.6} C${cx - R * 0.1},${cy - Ry * 0.85} ${cx - R * 0.65},${cy - Ry * 0.55} ${cx - R * 0.82},${cy - Ry * 0.3} C${cx - R * 0.9},${cy - Ry * 0.2} ${cx - R * 0.95},${cy - Ry * 0.1} ${cx - R * 1.03},${cy - Ry * 0.02} Z" fill="#22160F" stroke="#17202c" stroke-width="4" stroke-linejoin="round"/><path d="M${cx - R * 0.35},${cy - Ry * 0.95} Q${cx + R * 0.2},${cy - Ry * 1.12} ${cx + R * 0.7},${cy - Ry * 0.85}" fill="none" stroke="#4a3526" stroke-width="5" stroke-linecap="round"/>`,
  torsoDetail: (cx, c) => `<path d="M${cx - 50},${c.sy - 10} L${cx},${c.sy + 50} L${cx + 50},${c.sy - 10} L${cx + 30},${c.sy - 14} L${cx},${c.sy + 22} L${cx - 30},${c.sy - 14} Z" fill="${GOLD}" stroke="#17202c" stroke-width="3"/><path d="M${cx},${c.sy + 50} L${cx},${c.sy + 120}" stroke="#0b1a2e" stroke-width="4"/><circle cx="${cx}" cy="${c.sy + 72}" r="5" fill="${CREAM}"/><circle cx="${cx}" cy="${c.sy + 100}" r="5" fill="${CREAM}"/><rect x="${cx + 38}" y="${c.sy + 62}" width="62" height="20" rx="4" fill="${GOLD}"/><text x="${cx + 69}" y="${c.sy + 77}" font-family="Inter" font-weight="800" font-size="12" text-anchor="middle" fill="${NAVY}">KUYA</text><path d="M${cx - c.wh},${c.hipY - 18} L${cx + c.wh},${c.hipY - 18}" stroke="${GOLD}" stroke-width="7"/>`,
};
export const OPTION_A = build(CFG_A);


// ── Option B — Modern 3D Presenter (stylised, volumetric shading, glasses) ────────────
export const OPTION_B = build({
  id: 'KSL-B', name: 'B · Modern 3D Presenter',
  summary: 'Stylised "3D-look" presenter: large head, volumetric gradients, specular eye highlights, thin navy glasses, zip jacket over a cream tee. This is a 2.5D vector mock of the direction; a true 3D version needs a modelled and rigged asset.',
  strengths: ['Feels premium and modern', 'Lighting gives depth that stands out in feed', 'Glasses read as "smart" without credentials'],
  risks: ['True 3D needs a Blender/Unreal model + rig (extra cost and time)', 'Highest risk of inconsistency if generated by AI image/video tools', 'Heavier renders'],
  rig: 'Production: Blender armature + shape keys for visemes/expressions, rendered to image sequences; or Ready-made stylised rig. Prototype here: 2.5D gradient SVG on the shared rig.',
  effort: { setupDays: '2–4 weeks (modelling, texturing, rig, lookdev)', perEpisode: 'Medium–High', reuse: 'High once built', consistency: 'High only with a real 3D model; Low with generative tools' },
  headR: 112, headRy: 116, headCY: 300, jaw: 0.55, neckW: 50, neckH: 26,
  sy: 486, sh: 126, wy: 740, wh: 108, hipY: 812, footY: 1230, legGap: 50, legW: 72,
  armW: 48, upper: 160, lower: 150, handS: 36, longSleeve: true, sleeveLen: 1,
  skin: '#C8875A', skinShade: '#9A6038', hair: '#1c120c', shirt: '#1B3A61', shirtShade: '#0A1A30', accent: GOLD, pants: '#2E3B4E', shoes: '#F1EEE6', outline: '#0e1622', sw: 0,
  shaded: true, flat: false, eyes: 'glossy',
  hairBack: () => '',
  hairFront: (cx, cy, R, Ry, v) => v === 'back'
    ? `<path d="M${cx - R * 1.02},${cy + Ry * 0.05} C${cx - R * 1.12},${cy - Ry * 1.3} ${cx + R * 1.12},${cy - Ry * 1.3} ${cx + R * 1.02},${cy + Ry * 0.05} Q${cx},${cy + Ry * 0.35} ${cx - R * 1.02},${cy + Ry * 0.05} Z" fill="url(#hairB)"/>`
    : `<path d="M${cx - R * 1.0},${cy - Ry * 0.1} C${cx - R * 1.08},${cy - Ry * 1.0} ${cx - R * 0.5},${cy - Ry * 1.3} ${cx + R * 0.1},${cy - Ry * 1.28} C${cx + R * 0.8},${cy - Ry * 1.32} ${cx + R * 1.1},${cy - Ry * 0.9} ${cx + R * 1.0},${cy - Ry * 0.1} C${cx + R * 0.92},${cy - Ry * 0.5} ${cx + R * 0.6},${cy - Ry * 0.75} ${cx + R * 0.1},${cy - Ry * 0.72} C${cx - R * 0.4},${cy - Ry * 0.7} ${cx - R * 0.85},${cy - Ry * 0.5} ${cx - R * 1.0},${cy - Ry * 0.1} Z" fill="url(#hairB)"/><path d="M${cx - R * 0.2},${cy - Ry * 1.18} Q${cx + R * 0.35},${cy - Ry * 1.22} ${cx + R * 0.7},${cy - Ry * 0.95}" fill="none" stroke="#fff" stroke-opacity="0.18" stroke-width="10" stroke-linecap="round"/>`,
  overHead: (cx, cy, R, Ry, v) => v === 'back' ? '' : (() => { const off = v === 'threeQuarter' ? R * 0.2 : 0; const sp = R * 0.4 * (v === 'threeQuarter' ? 0.85 : 1); const y = cy + Ry * 0.04; return [-1, 1].map((s) => `<rect x="${cx + off + s * sp - R * 0.24}" y="${y - R * 0.17}" width="${R * 0.48}" height="${R * 0.34}" rx="${R * 0.1}" fill="#9fc3e6" fill-opacity="0.12" stroke="${NAVY}" stroke-width="6"/>`).join('') + `<path d="M${cx + off - sp + R * 0.24},${y - R * 0.04} Q${cx + off},${y - R * 0.12} ${cx + off + sp - R * 0.24},${y - R * 0.04}" fill="none" stroke="${NAVY}" stroke-width="6"/>`; })(),
  torsoDetail: (cx, c) => `<path d="M${cx - 42},${c.sy - 10} L${cx},${c.sy + 40} L${cx + 42},${c.sy - 10} Z" fill="${CREAM}"/><path d="M${cx - 46},${c.sy - 10} L${cx - 6},${c.hipY} M${cx + 46},${c.sy - 10} L${cx + 6},${c.hipY}" stroke="${GOLD}" stroke-width="6"/><rect x="${cx - 6}" y="${c.sy + 40}" width="12" height="${c.hipY - c.sy - 40}" fill="${CREAM}"/><path d="M${cx},${c.sy + 40} L${cx},${c.hipY}" stroke="#bfb7a5" stroke-width="3" stroke-dasharray="6 5"/><path d="M${cx - c.sh + 20},${c.sy + 60} Q${cx - c.sh + 30},${c.wy} ${cx - c.wh + 10},${c.hipY - 10}" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="16" stroke-linecap="round"/>`,
});

// ── Option C — Illustrated Tech Educator (flat editorial, strong silhouette) ─────────
export const OPTION_C = build({
  id: 'KSL-C', name: 'C · Illustrated Tech Educator',
  summary: 'Flat editorial illustration: no outlines, small head on a tall frame, big expressive hands, minimal dot-eye face. Built to sit inside dense diagrams.',
  strengths: ['Best for information-dense reels (character never fights the diagram)', 'Fast to pose; strong silhouette at tiny sizes', 'Very cheap to render'],
  risks: ['Less facial warmth; relies on gesture and voice', 'Can feel corporate if overused'],
  rig: 'Flat SVG/Lottie-style bone rig with large hand library (12 gesture swaps). Easy export to Lottie for web.',
  effort: { setupDays: '2–4 days', perEpisode: 'Low', reuse: 'Very high', consistency: 'Very high' },
  headR: 64, headRy: 74, headCY: 250, jaw: 0.7, neckW: 30, neckH: 30,
  sy: 380, sh: 104, wy: 660, wh: 82, hipY: 760, footY: 1400, legGap: 38, legW: 54,
  armW: 36, upper: 190, lower: 180, handS: 44, longSleeve: true, sleeveLen: 1,
  skin: '#B5754B', skinShade: '#8E5733', hair: '#0B3B7A', shirt: '#0B3B7A', shirtShade: '#0B3B7A', accent: GOLD, pants: '#243443', shoes: '#F5AE0B', outline: '#0b1828', sw: 0,
  shaded: false, flat: true, eyes: 'dot',
  hairBack: () => '',
  hairFront: (cx, cy, R, Ry, v) => v === 'back'
    ? `<path d="M${cx - R * 1.03},${cy + Ry * 0.1} L${cx - R * 1.03},${cy - Ry * 0.6} Q${cx - R},${cy - Ry * 1.12} ${cx},${cy - Ry * 1.12} Q${cx + R},${cy - Ry * 1.12} ${cx + R * 1.03},${cy - Ry * 0.6} L${cx + R * 1.03},${cy + Ry * 0.1} Z" fill="#0B3B7A"/>`
    : `<path d="M${cx - R * 1.05},${cy - Ry * 0.05} L${cx - R * 1.05},${cy - Ry * 0.62} Q${cx - R * 0.95},${cy - Ry * 1.15} ${cx},${cy - Ry * 1.15} L${cx + R * 0.7},${cy - Ry * 1.15} L${cx + R * 1.05},${cy - Ry * 0.8} L${cx + R * 1.05},${cy - Ry * 0.35} L${cx + R * 0.2},${cy - Ry * 0.55} L${cx - R * 0.55},${cy - Ry * 0.45} L${cx - R * 0.8},${cy - Ry * 0.2} Z" fill="#0B3B7A"/>`,
  torsoDetail: (cx, c) => `<path d="M${cx - 34},${c.sy - 10} L${cx},${c.sy + 30} L${cx + 34},${c.sy - 10} Z" fill="${CREAM}"/><path d="M${cx - 30},${c.sy - 6} L${cx + 52},${c.sy + 170}" stroke="${GOLD}" stroke-width="7"/><rect x="${cx + 34}" y="${c.sy + 160}" width="44" height="58" rx="6" fill="${GOLD}"/><rect x="${cx + 41}" y="${c.sy + 168}" width="30" height="34" rx="2" fill="${CREAM}"/><path d="M${cx + 45},${c.sy + 194} L${cx + 52},${c.sy + 184} L${cx + 58},${c.sy + 190} L${cx + 67},${c.sy + 175}" fill="none" stroke="${NAVY}" stroke-width="3"/><rect x="${cx - c.wh}" y="${c.hipY - 24}" width="${c.wh * 2}" height="10" fill="${GOLD}"/>`,
});

// ── Option D — Casual Filipino Kuya (grounded, human proportions, cap) ───────────────
export const OPTION_D = build({
  id: 'KSL-D', name: 'D · Casual Filipino Kuya',
  summary: 'Grounded homeowner-turned-solar-enthusiast. Near-human proportions, light stubble, plain navy cap (no logo), open navy overshirt with gold piping over a cream tee, jeans and white sneakers.',
  strengths: ['Most relatable and "real kuya" in feel', 'Credible next to real project footage (Template 06)', 'Less mascot-like'],
  risks: ['More detail = more animation cost per expression', 'Must avoid resembling any real person', 'Uncanny if over-detailed'],
  rig: 'Layered vector cut-out with extra face layers (stubble, nasolabial lines) or Adobe Character Animator-style puppet; same 6-viseme set.',
  effort: { setupDays: '5–8 days', perEpisode: 'Medium', reuse: 'High', consistency: 'High with locked layer files' },
  headR: 74, headRy: 88, headCY: 240, jaw: 0.72, neckW: 46, neckH: 30,
  sy: 386, sh: 118, wy: 680, wh: 96, hipY: 780, footY: 1340, legGap: 44, legW: 64,
  armW: 42, upper: 195, lower: 180, handS: 32, longSleeve: true, sleeveLen: 1,
  skin: '#B8774C', skinShade: '#8D5531', hair: '#1a110b', shirt: '#1A3354', shirtShade: '#10233d', accent: GOLD, pants: '#33445e', shoes: '#f3f1ec', outline: '#1d140f', sw: 3,
  shaded: false, flat: false, eyes: 'human',
  hairBack: () => '',
  extraFace: (cx, cy, R, Ry, v) => { const off = v === 'threeQuarter' ? R * 0.15 : 0; return `<path d="M${cx - R * 0.82 + off},${cy + Ry * 0.25} Q${cx - R * 0.75 + off},${cy + Ry * 0.95} ${cx + off},${cy + Ry * 0.99} Q${cx + R * 0.75 + off},${cy + Ry * 0.95} ${cx + R * 0.82 + off},${cy + Ry * 0.25} Q${cx + R * 0.55 + off},${cy + Ry * 0.75} ${cx + off},${cy + Ry * 0.72} Q${cx - R * 0.55 + off},${cy + Ry * 0.75} ${cx - R * 0.82 + off},${cy + Ry * 0.25} Z" fill="#2a1a10" opacity="0.22"/>`; },
  hairFront: (cx, cy, R, Ry, v) => v === 'back'
    ? `<path d="M${cx - R * 1.02},${cy + Ry * 0.15} C${cx - R * 1.06},${cy - Ry * 0.5} ${cx + R * 1.06},${cy - Ry * 0.5} ${cx + R * 1.02},${cy + Ry * 0.15} Q${cx},${cy + Ry * 0.3} ${cx - R * 1.02},${cy + Ry * 0.15} Z" fill="#1a110b"/>`
    : `<path d="M${cx - R * 1.02},${cy - Ry * 0.05} Q${cx - R * 1.0},${cy - Ry * 0.4} ${cx - R * 0.85},${cy - Ry * 0.48} L${cx + R * 0.85},${cy - Ry * 0.48} Q${cx + R * 1.0},${cy - Ry * 0.4} ${cx + R * 1.02},${cy - Ry * 0.05} L${cx + R * 0.9},${cy - Ry * 0.3} L${cx - R * 0.9},${cy - Ry * 0.3} Z" fill="#1a110b"/>`,
  overHead: (cx, cy, R, Ry, v) => {
    if (v === 'back') return `<path d="M${cx - R * 1.06},${cy - Ry * 0.35} C${cx - R * 1.1},${cy - Ry * 1.35} ${cx + R * 1.1},${cy - Ry * 1.35} ${cx + R * 1.06},${cy - Ry * 0.35} Z" fill="${NAVY}" stroke="#1d140f" stroke-width="3"/><rect x="${cx - R * 0.35}" y="${cy - Ry * 0.48}" width="${R * 0.7}" height="${Ry * 0.12}" rx="4" fill="#0c1a2c"/><path d="M${cx - R * 1.06},${cy - Ry * 0.35} L${cx + R * 1.06},${cy - Ry * 0.35}" stroke="${GOLD}" stroke-width="5"/>`;
    const off = v === 'threeQuarter' ? R * 0.25 : 0;
    return `<path d="M${cx - R * 1.06},${cy - Ry * 0.42} C${cx - R * 1.1},${cy - Ry * 1.38} ${cx + R * 1.1},${cy - Ry * 1.38} ${cx + R * 1.06},${cy - Ry * 0.42} Z" fill="${NAVY}" stroke="#1d140f" stroke-width="3"/><path d="M${cx - R * 1.06},${cy - Ry * 0.42} L${cx + R * 1.06},${cy - Ry * 0.42}" stroke="${GOLD}" stroke-width="5"/><path d="M${cx - R * 0.95 + off},${cy - Ry * 0.42} Q${cx + off},${cy - Ry * 0.62} ${cx + R * 0.95 + off},${cy - Ry * 0.42} Q${cx + R * 1.15 + off},${cy - Ry * 0.25} ${cx + off},${cy - Ry * 0.22} Q${cx - R * 1.15 + off},${cy - Ry * 0.25} ${cx - R * 0.95 + off},${cy - Ry * 0.42} Z" fill="#0f2238" stroke="#1d140f" stroke-width="3"/><circle cx="${cx}" cy="${cy - Ry * 1.13}" r="6" fill="${NAVY}" stroke="#1d140f" stroke-width="2"/>`;
  },
  torsoDetail: (cx, c) => `<path d="M${cx - 58},${c.sy - 10} L${cx + 58},${c.sy - 10} L${cx + 48},${c.hipY} L${cx - 48},${c.hipY} Z" fill="${CREAM}" stroke="#1d140f" stroke-width="3"/><path d="M${cx - 38},${c.sy - 10} Q${cx},${c.sy + 26} ${cx + 38},${c.sy - 10}" fill="none" stroke="#d9cfb8" stroke-width="5"/><path d="M${cx - 58},${c.sy - 10} L${cx - 78},${c.sy + 40} L${cx - 50},${c.sy + 70} L${cx - 48},${c.hipY} M${cx + 58},${c.sy - 10} L${cx + 78},${c.sy + 40} L${cx + 50},${c.sy + 70} L${cx + 48},${c.hipY}" fill="none" stroke="${GOLD}" stroke-width="5" stroke-linejoin="round"/><rect x="${cx - c.wh + 14}" y="${c.sy + 120}" width="44" height="50" rx="5" fill="none" stroke="#0c1a2c" stroke-width="4"/><path d="M${cx - c.wh},${c.hipY - 6} L${cx + c.wh},${c.hipY - 6}" stroke="#5a4632" stroke-width="10"/>`,
});

export const OPTIONS = [OPTION_A, OPTION_B, OPTION_C, OPTION_D];
