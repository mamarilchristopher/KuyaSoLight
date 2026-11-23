// Subtitle generation from APPROVED narration + measured cue timings, plus the
// mandatory transcript QA (spec §7). No speech-recognition pass is involved.
import { PALETTE, CANVAS, SAFE } from '../brand/brand.ts';

export interface TimedCue { id: string; text: string; start: number; end: number; gold?: string[] }

export const MAX_LINE_CHARS = 30;

/** Balanced break into ≤2 lines of ≤MAX_LINE_CHARS where possible. */
export function breakLines(text: string, max = MAX_LINE_CHARS): string[] {
  if (text.length <= max) return [text];
  const words = text.split(' ');
  let best: string[] = [text], bestScore = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
    const over = Math.max(0, a.length - max) + Math.max(0, b.length - max);
    // prefer breaking after punctuation, then balance
    const punct = /[,.!?…]$/.test(words[i - 1]) ? -4 : 0;
    const score = over * 100 + Math.abs(a.length - b.length) + punct;
    if (score < bestScore) { bestScore = score; best = [a, b]; }
  }
  return best;
}

const ts = (t: number, sep: ',' | '.') => {
  const ms = Math.round(t * 1000);
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000), r = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}${sep}${String(r).padStart(3, '0')}`;
};

export function toSRT(cues: TimedCue[]) {
  return cues.map((c, i) => `${i + 1}\n${ts(c.start, ',')} --> ${ts(c.end, ',')}\n${breakLines(c.text).join('\n')}\n`).join('\n');
}
export function toVTT(cues: TimedCue[]) {
  return 'WEBVTT\n\n' + cues.map((c) => `${c.id}\n${ts(c.start, '.')} --> ${ts(c.end, '.')} line:${Math.round((SAFE.bottom / CANVAS.h) * 100)}%\n${breakLines(c.text).join('\n')}\n`).join('\n');
}

const assTime = (t: number) => { const cs = Math.round(t * 100); const h = Math.floor(cs / 360000), m = Math.floor((cs % 360000) / 6000), s = Math.floor((cs % 6000) / 100), r = cs % 100; return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(r).padStart(2, '0')}`; };
const bgr = (hex: string) => `&H00${hex.slice(5, 7)}${hex.slice(3, 5)}${hex.slice(1, 3)}&`.toUpperCase();

/** ASS for libass burn-in: Inter ExtraBold, white on a translucent navy box, gold keywords. */
export function toASS(cues: TimedCue[]) {
  const marginV = CANVAS.h - SAFE.bottom; // box bottom sits on the safe-area bottom line
  const head = `[Script Info]\nScriptType: v4.00+\nPlayResX: ${CANVAS.w}\nPlayResY: ${CANVAS.h}\nWrapStyle: 2\nScaledBorderAndShadow: yes\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Kuya,Inter ExtraBold,52,&H00FFFFFF&,&H00FFFFFF&,&H262E1A0B&,&H262E1A0B&,0,0,0,0,100,100,0,0,3,16,0,2,${SAFE.left + 10},${CANVAS.w - SAFE.right + 10},${marginV}\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  const gold = bgr(PALETTE.gold);
  const ev = cues.map((c) => {
    const lines = breakLines(c.text).map((l) => l.split(' ').map((w) => {
      const bare = w.toLowerCase().replace(/[^\p{L}\d-]/gu, '');
      return (c.gold || []).some((g) => bare === g.toLowerCase() || bare.startsWith(g.toLowerCase())) ? `{\\c${gold}}${w}{\\c&H00FFFFFF&}` : w;
    }).join(' '));
    return `Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Kuya,,0,0,0,,{\\fad(60,60)}${lines.join('\\N')}`;
  });
  return head + ev.join('\n') + '\n';
}

// ── QA ──────────────────────────────────────────────────────────────────────────────
export const normalize = (s: string) => s.toLowerCase().normalize('NFC').replace(/[’]/g, "'").replace(/…/g, ' ').replace(/[^\p{L}\d'₱%.\s-]/gu, ' ').replace(/(?<!\d)\.(?!\d)/g, ' ').replace(/\s+/g, ' ').trim();
export const numbers = (s: string) => (s.match(/₱?\d[\d,.]*\s?(%|kwh|kwp|kw|w|v|a)?/gi) || []).map((n) => n.replace(/\s/g, '').toLowerCase());

export interface QACheck { id: string; status: 'pass' | 'fail' | 'warn'; detail: string; fix?: string; blocking?: boolean }

export function subtitleQA(approvedNarration: string, cues: TimedCue[], lockedLines: string[]): QACheck[] {
  const out: QACheck[] = [];
  const a = normalize(approvedNarration).split(' '), b = normalize(cues.map((c) => c.text).join(' ')).split(' ');
  let diff = -1;
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { diff = i; break; }
  out.push(diff < 0
    ? { id: 'SUB-TRANSCRIPT-MATCH', status: 'pass', detail: `All ${a.length} words of the approved narration appear in the subtitle transcript in order.` }
    : { id: 'SUB-TRANSCRIPT-MATCH', status: 'fail', blocking: true, detail: `Mismatch at word ${diff + 1}: narration "${a.slice(diff, diff + 4).join(' ')}" vs subtitles "${b.slice(diff, diff + 4).join(' ')}".`, fix: 'Regenerate subtitles from the approved script; never hand-edit cue text.' });
  const na = numbers(approvedNarration).join('|'), nb = numbers(cues.map((c) => c.text).join(' ')).join('|');
  out.push(na === nb ? { id: 'SUB-NUMBERS-MATCH', status: 'pass', detail: na ? `Numbers match: ${na}` : 'No numerical values in narration.' } : { id: 'SUB-NUMBERS-MATCH', status: 'fail', blocking: true, detail: `Numbers differ: narration [${na}] vs subtitles [${nb}]`, fix: 'Any numeric mismatch blocks publication. Fix script or regenerate.' });
  for (const l of lockedLines) {
    const hit = cues.some((c) => c.text === l);
    out.push(hit ? { id: 'BRAND-LINE-EXACT', status: 'pass', detail: `Exact brand line present: "${l}"` } : { id: 'BRAND-LINE-EXACT', status: 'fail', blocking: true, detail: `Brand line missing or altered: "${l}"`, fix: 'Use the locked line from Brand Settings verbatim.' });
  }
  const long = cues.filter((c) => breakLines(c.text).length > 2 || breakLines(c.text).some((l) => l.length > MAX_LINE_CHARS + 6));
  out.push(long.length ? { id: 'SUB-LINE-LAYOUT', status: 'warn', detail: `Cues needing manual line-break review: ${long.map((c) => c.id).join(', ')}`, fix: 'Split cue in the script or shorten wording (requires re-approval).' } : { id: 'SUB-LINE-LAYOUT', status: 'pass', detail: `All cues fit ≤2 lines (≈≤${MAX_LINE_CHARS} chars/line).` });
  const fast = cues.filter((c) => c.text.length / Math.max(0.1, c.end - c.start) > 22);
  out.push(fast.length ? { id: 'SUB-READING-SPEED', status: 'warn', detail: `Above 22 chars/sec: ${fast.map((c) => `${c.id} (${(c.text.length / (c.end - c.start)).toFixed(1)})`).join(', ')}`, fix: 'Slow the voice slightly or add a pause.' } : { id: 'SUB-READING-SPEED', status: 'pass', detail: 'All cues ≤22 characters/second.' });
  const overlap = cues.some((c, i) => i > 0 && c.start < cues[i - 1].end);
  out.push(overlap ? { id: 'SUB-TIMING', status: 'fail', blocking: true, detail: 'Overlapping cues.' } : { id: 'SUB-TIMING', status: 'pass', detail: 'Cues are sequential, timed from synthesized audio sample positions.' });
  return out;
}
