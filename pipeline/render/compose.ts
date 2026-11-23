// Programmatic video renderer: SVG frames → resvg → ffmpeg (H.264/AAC, 1080x1920, 30fps),
// audio mix (narration + sonic logo + optional ducked bed) and libass subtitle burn-in.
import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { svgToPng } from './raster.ts';
import { CANVAS } from '../brand/brand.ts';
import { toASS, toSRT, toVTT, TimedCue, QACheck } from './subtitles.ts';

export interface AudioTrack { file: string; at: number; gainDb: number }
export interface Composition {
  id: string; duration: number; fps: number;
  frame(t: number, i: number): string; // full SVG document for time t
  narration?: string; stings: AudioTrack[]; music?: { file: string; gainDb: number };
  cues: TimedCue[];
}

function run(cmd: string, args: string[]) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`${cmd} failed: ${r.stderr?.slice(-2000)}`);
  return r;
}

export async function renderFrames(comp: Composition, outFile: string, onProgress?: (p: number) => void) {
  const n = Math.round(comp.duration * comp.fps);
  const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(comp.fps), '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise<void>((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg frames exit ' + c)))));
  for (let i = 0; i < n; i++) {
    const png = svgToPng(comp.frame(i / comp.fps, i));
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (onProgress && i % 30 === 0) onProgress(i / n);
  }
  ff.stdin.end();
  await done;
  return n;
}

/** Mixes audio and burns subtitles. Returns final mp4 path. */
export function finalize(comp: Composition, silentVideo: string, outDir: string, opts: { music: boolean; suffix: string; burnSubs?: boolean }) {
  const assPath = join(outDir, `${comp.id}.ass`);
  writeFileSync(assPath, toASS(comp.cues));
  writeFileSync(join(outDir, `${comp.id}.srt`), toSRT(comp.cues));
  writeFileSync(join(outDir, `${comp.id}.vtt`), toVTT(comp.cues));
  const inputs: string[] = ['-i', silentVideo];
  const parts: string[] = []; const labels: string[] = [];
  let idx = 1;
  if (comp.narration) { inputs.push('-i', comp.narration); parts.push(`[${idx}:a]aresample=48000,aformat=channel_layouts=stereo,asplit=2[nar][key]`); labels.push('[nar]'); idx++; }
  comp.stings.forEach((s, k) => { inputs.push('-i', s.file); parts.push(`[${idx}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${s.gainDb}dB,adelay=${Math.round(s.at * 1000)}|${Math.round(s.at * 1000)}[s${k}]`); labels.push(`[s${k}]`); idx++; });
  if (opts.music && comp.music) {
    inputs.push('-stream_loop', '-1', '-i', comp.music.file);
    parts.push(`[${idx}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${comp.music.gainDb}dB,atrim=0:${comp.duration},afade=t=out:st=${Math.max(0, comp.duration - 1.2)}:d=1.2[bedraw]`);
    if (comp.narration) parts.push(`[bedraw][key]sidechaincompress=threshold=0.02:ratio=6:attack=20:release=350[bed]`); else parts.push('[bedraw]anull[bed]');
    labels.push('[bed]'); idx++;
  } else if (comp.narration) parts.push('[key]anullsink');
  parts.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0:duration=longest,alimiter=limit=0.89:level=false,apad,atrim=0:${comp.duration}[aout]`);
  const vf = opts.burnSubs === false ? '[0:v]null[vout]' : `[0:v]ass=${assPath}:fontsdir=/usr/share/fonts/opentype/inter[vout]`;
  parts.push(vf);
  const out = join(outDir, `${comp.id}${opts.suffix}.mp4`);
  run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...inputs, '-filter_complex', parts.join(';'), '-map', '[vout]', '-map', '[aout]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(comp.fps), '-profile:v', 'high', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-t', String(comp.duration), out]);
  return out;
}

export function probe(file: string) {
  const r = run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', file]);
  return JSON.parse(r.stdout);
}

export function mediaQA(file: string, expectDur: number): QACheck[] {
  const p = probe(file);
  const v = p.streams.find((s: any) => s.codec_type === 'video'); const a = p.streams.find((s: any) => s.codec_type === 'audio');
  const out: QACheck[] = [];
  out.push(v && v.width === CANVAS.w && v.height === CANVAS.h ? { id: 'MP4-RESOLUTION', status: 'pass', detail: `${v.width}x${v.height} (9:16)` } : { id: 'MP4-RESOLUTION', status: 'fail', blocking: true, detail: `Got ${v?.width}x${v?.height}` });
  const fps = v ? eval(v.r_frame_rate) : 0;
  out.push(Math.abs(fps - CANVAS.fps) < 0.01 ? { id: 'MP4-FPS', status: 'pass', detail: `${fps} fps` } : { id: 'MP4-FPS', status: 'fail', blocking: true, detail: `${fps} fps` });
  out.push(v?.codec_name === 'h264' && a?.codec_name === 'aac' ? { id: 'MP4-CODECS', status: 'pass', detail: 'H.264 video + AAC audio' } : { id: 'MP4-CODECS', status: 'fail', blocking: true, detail: `${v?.codec_name}/${a?.codec_name}` });
  const dur = +p.format.duration;
  out.push(Math.abs(dur - expectDur) < 0.15 ? { id: 'MP4-DURATION', status: 'pass', detail: `${dur.toFixed(2)} s` } : { id: 'MP4-DURATION', status: 'warn', detail: `${dur.toFixed(2)} s vs expected ${expectDur.toFixed(2)} s` });
  const vd = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'volumedetect', '-vn', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const max = +(vd.match(/max_volume: (-?[\d.]+)/)?.[1] ?? -99), mean = +(vd.match(/mean_volume: (-?[\d.]+)/)?.[1] ?? -99);
  out.push(!a || mean < -45 ? { id: 'AUDIO-PRESENT', status: 'fail', blocking: true, detail: `Audio missing or silent (mean ${mean} dB)` } : { id: 'AUDIO-PRESENT', status: 'pass', detail: `Mean ${mean} dBFS` });
  out.push(max > -0.3 ? { id: 'AUDIO-CLIPPING', status: 'fail', blocking: true, detail: `Peak ${max} dBFS`, fix: 'Lower mix gain / limiter ceiling.' } : { id: 'AUDIO-CLIPPING', status: 'pass', detail: `Peak ${max} dBFS (limiter ceiling −1 dBFS)` });
  return out;
}

export function contactSheet(file: string, outPng: string, times: number[]) {
  const dir = outPng.replace(/\.png$/, '_frames'); if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  times.forEach((t, i) => run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(t), '-i', file, '-frames:v', '1', '-vf', 'scale=360:-1', join(dir, `f${String(i).padStart(2, '0')}.png`)]));
  run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-pattern_type', 'glob', '-i', join(dir, 'f*.png'), '-vf', `tile=${Math.min(6, times.length)}x${Math.ceil(times.length / 6)}:padding=8:color=white`, '-frames:v', '1', outPng]);
}
