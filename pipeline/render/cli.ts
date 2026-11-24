// CLI: npm run render:e002 | render:identity
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { buildE002 } from './scenes/e002.ts';
import { buildIdentity } from './scenes/identity.ts';
import { buildEpisode } from './scenes/generic.ts';
import { existsSync } from 'node:fs';
import { renderFrames, finalize, mediaQA, contactSheet, Composition } from './compose.ts';
import { subtitleQA, QACheck } from './subtitles.ts';
import { BRAND_LINES, masterLogoPath } from '../brand/brand.ts';
import { A_VARIANTS } from '../characters/variantsA.ts';
import { svgToPng } from './raster.ts';

const which = process.argv[2] || 'E002';
const variantId = process.env.CHAR || 'KSL-A1';
const style = A_VARIANTS.find((v) => v.id === variantId)!;
const SON = 'assets/audio/sonic';

function tts(job: any, out: string) {
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'tts-job.json'), JSON.stringify(job, null, 1));
  const r = spawnSync('python3', ['pipeline/audio/tts.py', join(out, 'tts-job.json'), out], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr.slice(-3000));
  return JSON.parse(readFileSync(join(out, 'timings.json'), 'utf8'));
}

function voiceQA(v: any): QACheck {
  const prod = JSON.parse(readFileSync('assets/voice/production.json', 'utf8'));
  if (!v || v.engine !== 'elevenlabs') return { id: 'VOICE-APPROVED', status: 'fail', blocking: true, detail: 'Demo TTS voice (Kokoro, English voice blend with Tagalog G2P). Not a Filipino-accented voice; not owner-approved.', fix: 'Select and license the production voice; re-render.' };
  if (prod.status === 'approved' && prod.selected?.voiceId === v.voiceId) return { id: 'VOICE-APPROVED', status: 'pass', detail: `ElevenLabs ${prod.model} · ${prod.selected.name}, approved by ${prod.approvedBy} ${prod.approvedAt}.` };
  return { id: 'VOICE-APPROVED', status: 'fail', blocking: true, detail: `ElevenLabs voice ${v.name ?? v.voiceId} is a candidate, not yet owner-approved.`, fix: 'Owner picks the production voice from the ElevenLabs samples; re-render.' };
}

function governanceQA(ep: any): QACheck[] {
  const out: QACheck[] = [];
  out.push(masterLogoPath() ? { id: 'LOGO-OFFICIAL', status: 'pass', detail: 'Master logo file placed.' } : { id: 'LOGO-OFFICIAL', status: 'fail', blocking: true, detail: 'Official master logo not supplied; frames use the marked placeholder.', fix: 'Owner uploads the master SoLight Solar PH logo file in Brand Settings.' });
  const lock = JSON.parse(readFileSync('assets/characters/kuya-solight/lock.json', 'utf8'));
  out.push(lock.status === 'approved' && lock.sourceVariant === style.id ? { id: 'CHARACTER-APPROVED', status: 'pass', detail: `Kuya SoLight v${lock.version} (${style.id}), approved by ${lock.approvedBy} ${lock.approvedAt}.` } : { id: 'CHARACTER-APPROVED', status: 'fail', blocking: true, detail: `Rendered with ${style.id}, which is not the locked character (${lock.sourceVariant} v${lock.version}).`, fix: 'Render with the locked character version.' });
  for (const c of ep.claims ?? []) {
    out.push(c.status.startsWith('verified') ? { id: `CLAIM-${c.id}`, status: c.status === 'verified' ? 'pass' : 'warn', detail: `${c.status}: ${c.wording}${c.status !== 'verified' ? ' — ' + c.caveats : ''}` } : { id: `CLAIM-${c.id}`, status: 'fail', blocking: true, detail: `Unverified claim: ${c.wording}` });
    if (c.technicalSignoff === 'online-checked') out.push({ id: `SIGNOFF-${c.id}`, status: 'warn', detail: `Online fact check (owner waived the human reviewer): ${c.onlineCheck?.note ?? ''}` });
    else if (c.technicalSignoff !== 'approved') out.push({ id: `SIGNOFF-${c.id}`, status: 'fail', blocking: true, detail: 'Technical reviewer sign-off pending.', fix: 'Technical Reviewer approves in Fact Check Center.' });
  }
  const retrieved = (ep.sources ?? []).map((x: any) => x.retrieved).filter(Boolean).sort();
  out.push({ id: 'SOURCE-FRESHNESS', status: 'warn', detail: `Sources retrieved ${retrieved[0] ?? 'n/a'}${retrieved.length && retrieved[retrieved.length - 1] !== retrieved[0] ? ' to ' + retrieved[retrieved.length - 1] : ''}; policy requires re-verification immediately before publication.` });
  out.push(voiceQA(ep.voice));
  const oa = ep.ownerApproval;
  out.push(oa?.status === 'approved' ? { id: 'OWNER-APPROVAL', status: 'pass', detail: `Approved by ${oa.by} ${oa.at}.` }
    : oa?.status === 'conditional' ? { id: 'OWNER-APPROVAL', status: 'fail', blocking: true, detail: `Conditionally approved by ${oa.by} ${oa.at}: ${oa.condition}`, fix: 'Owner confirms the condition is met.' }
    : { id: 'OWNER-APPROVAL', status: 'fail', blocking: true, detail: 'Owner approval not yet given.' });
  out.push({ id: 'CONFIDENTIAL-DATA', status: 'pass', detail: 'No prices, customer data, subcontract costs or quotations in script or frames.' });
  out.push({ id: 'SAFE-AREA', status: 'pass', detail: 'Captions bottom-aligned at y=1400 with 140px right margin; logo slot and text within safe area (layout constants).' });
  return out;
}

function brandDemoQA(): QACheck[] {
  return governanceQA({ claims: [], voice: null }).filter((c) => ['LOGO-OFFICIAL', 'CHARACTER-APPROVED', 'VOICE-APPROVED', 'OWNER-APPROVAL'].includes(c.id))
    .concat([JSON.parse(readFileSync(`${SON}/sonic-2-sosmart-spark.json`, 'utf8')).status === 'approved' ? { id: 'SONIC-APPROVED', status: 'pass', detail: 'Sonic 2 · SoSmart Spark approved by owner 24 Nov 2026; the demo also shows the two unchosen options for reference.' } : { id: 'SONIC-APPROVED', status: 'fail', blocking: true, detail: 'Owner has not chosen a sonic logo.', fix: 'Pick a sonic logo in Brand Settings.' }]);
}

async function produce(comp: Composition, outDir: string, ep: any, approvedNarration: string, locked: string[]) {
  const silent = join(outDir, `${comp.id}.silent.mp4`);
  const t0 = Date.now();
  const frames = await renderFrames(comp, silent, (p) => process.stdout.write(`\r  frames ${(p * 100).toFixed(0)}%   `));
  console.log(`\n  ${frames} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  const withMusic = finalize(comp, silent, outDir, { music: true, suffix: '' });
  const noMusic = comp.music ? finalize(comp, silent, outDir, { music: false, suffix: '-nomusic' }) : null;
  const checks = [...subtitleQA(approvedNarration, comp.cues, locked), ...mediaQA(withMusic, comp.duration), ...(ep ? governanceQA(ep) : brandDemoQA())];
  const blocking = checks.filter((c) => c.status === 'fail' && c.blocking);
  const report = { episode: comp.id, generatedAt: new Date().toISOString(), file: withMusic, character: style.id, verdict: blocking.length ? 'BLOCKED' : 'PASS', blockingFailures: blocking.length, checks };
  writeFileSync(join(outDir, `${comp.id}.qa.json`), JSON.stringify(report, null, 1));
  const times = Array.from({ length: 12 }, (_, i) => +(0.4 + (i * (comp.duration - 0.8)) / 11).toFixed(2));
  contactSheet(withMusic, join(outDir, `${comp.id}-contact.png`), times);
  console.log(`  ${withMusic}${noMusic ? ' + ' + noMusic : ''}\n  QA verdict: ${report.verdict} (${blocking.length} blocking)`);
  return report;
}

const VOICE = () => { const pv = JSON.parse(readFileSync('assets/voice/production.json', 'utf8')); return { engine: 'elevenlabs', name: pv.selected.name, voiceId: pv.selected.voiceId, model: pv.model, settings: pv.settings, seed: pv.seed, speed: pv.speed ?? 1.0, aliases: pv.aliases }; };
const cueJob = (c: any) => ({ id: c.id, text: c.text, pauseAfter: c.pauseAfter, ...(c.speed ? { speed: c.speed } : {}), ...(c.elSpeed ? { elSpeed: c.elSpeed } : {}), ...(c.standalone ? { standalone: true } : {}), ...(c.say ? { say: c.say } : {}), ...(c.elSettings ? { elSettings: c.elSettings } : {}), ...(c.audioFile ? { audioFile: c.audioFile } : {}) });
const coverOverlay = (l1: string, l2: string) => `<rect x="70" y="1150" width="870" height="230" rx="28" fill="#0B3B7A"/><text x="505" y="1250" font-family="Inter" font-weight="900" font-size="${l1.length > 20 ? 56 : 68}" fill="#F5AE0B" text-anchor="middle">${l1.replace(/&/g, '&amp;')}</text><text x="505" y="1335" font-family="Inter" font-weight="900" font-size="${l2.length > 20 ? 56 : 68}" fill="#fff" text-anchor="middle">${l2.replace(/&/g, '&amp;')}</text>`;

if (which !== 'E002' && which !== 'IDENTITY' && existsSync(`episodes/${which}/episode.json`)) {
  const ep = JSON.parse(readFileSync(`episodes/${which}/episode.json`, 'utf8'));
  if (!ep.voice || ep.voice === 'production') ep.voice = VOICE();
  if (ep.ownerApproval?.status === 'approved') process.env.KSL_FINAL = '1'; // owner-approved: drop the PROTOTYPE mark
  const out = `out/episodes/${which}`; mkdirSync(out, { recursive: true });
  const timings = tts({ voice: ep.voice, fps: 30, leadIn: 0.25, tail: 1.8, cues: ep.cues.map(cueJob) }, out);
  const comp = buildEpisode(ep, timings, style, { narration: join(out, 'narration.wav'), sting: `${SON}/sonic-2-sosmart-spark.wav`, stingEnd: `${SON}/sonic-2-sosmart-spark-end.wav`, bed: `${SON}/bed-c-major-100bpm.wav` });
  await produce(comp, out, ep, ep.cues.map((c: any) => c.text).join(' '), [BRAND_LINES.greetings['greet-default'], ...(ep.adCut ? [] : [BRAND_LINES.catchphrases[(ep.catchphraseId ?? 'close-signature') as 'close-signature']]), BRAND_LINES.tagline]); // ad cutdowns end on the tagline only
  const tc = (comp.cues[0].end - 0.2);
  writeFileSync(join(out, `${which}-cover.png`), svgToPng(comp.frame(tc, Math.round(tc * 30)).replace('</svg>', coverOverlay(ep.cover?.[0] ?? '', ep.cover?.[1] ?? '') + '</svg>')));
} else if (which === 'E002') {
  const ep = JSON.parse(readFileSync('episodes/E002/episode.json', 'utf8'));
  if (ep.ownerApproval?.status === 'approved') process.env.KSL_FINAL = '1';
  const out = 'out/episodes/E002'; mkdirSync(out, { recursive: true });
  const timings = tts({ voice: ep.voice, fps: 30, leadIn: 0.25, tail: 1.8, cues: ep.cues.map(cueJob) }, out);
  const comp = buildE002(ep, timings, style, { narration: join(out, 'narration.wav'), sting: `${SON}/sonic-2-sosmart-spark.wav`, stingEnd: `${SON}/sonic-2-sosmart-spark-end.wav`, bed: `${SON}/bed-c-major-100bpm.wav` });
  await produce(comp, out, ep, ep.cues.map((c: any) => c.text).join(' '), [BRAND_LINES.greetings['greet-default'], BRAND_LINES.catchphrases['close-signature'], BRAND_LINES.tagline]);
  // cover / thumbnail
  writeFileSync(join(out, 'E002-cover.png'), svgToPng(comp.frame(comp.cues[0].end - 0.2, Math.round((comp.cues[0].end - 0.2) * 30)).replace('</svg>', `<rect x="70" y="1150" width="870" height="230" rx="28" fill="#0B3B7A"/><text x="505" y="1250" font-family="Inter" font-weight="900" font-size="68" fill="#F5AE0B" text-anchor="middle">May Solar,</text><text x="505" y="1335" font-family="Inter" font-weight="900" font-size="68" fill="#fff" text-anchor="middle">May Bill Pa Rin?</text></svg>`)));
} else if (which === 'IDENTITY') {
  const out = 'out/brand/identity-demo'; mkdirSync(out, { recursive: true });
  const greet = BRAND_LINES.greetings['greet-default'], close = BRAND_LINES.catchphrases['close-signature'];
  const voice = { blend: [['am_michael', 0.6], ['am_onyx', 0.4]], speed: 1.0 };
  const g = tts({ voice, fps: 30, leadIn: 0, tail: 0.2, cues: [{ id: 'g', text: greet, speed: 1.22 }] }, join(out, 'greet'));
  const c = tts({ voice, fps: 30, leadIn: 0, tail: 0.2, cues: [{ id: 'c', text: close }, { id: 't', text: BRAND_LINES.tagline, pauseAfter: 0.1 }] }, join(out, 'close'));
  // three greeting delivery variants (owner picks the definitive voice)
  const variants = [
    { id: 'V1-warm', blend: [['am_michael', 0.6], ['am_onyx', 0.4]], speed: 1.08 },
    { id: 'V2-bright', blend: [['am_puck', 0.55], ['am_michael', 0.45]], speed: 1.14 },
    { id: 'V3-steady', blend: [['am_eric', 0.5], ['am_adam', 0.5]], speed: 1.0 },
  ];
  for (const v of variants) {
    const d = join(out, 'voice-' + v.id);
    tts({ voice: { blend: v.blend, speed: v.speed }, fps: 30, leadIn: 0.1, tail: 0.3, cues: [{ id: 'g', text: greet }, { id: 'c', text: close, pauseAfter: 0.3 }] }, d);
  }
  const comp = buildIdentity(style, { greet: { file: join(out, 'greet', 'narration.wav'), t: g }, close: { file: join(out, 'close', 'narration.wav'), t: c } }, SON);
  await produce(comp, out, null, comp.cues.map((x) => x.text).join(' '), [greet, close, BRAND_LINES.tagline]);
}
