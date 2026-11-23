// Seeds the 104-episode backlog verbatim, E002's full production record, brand settings
// and an owner account. Idempotent: never overwrites existing episode rows (canonical IDs
// and published history are preserved).
import { readFileSync, existsSync } from 'node:fs';
import { randomBytes, scryptSync } from 'node:crypto';
import { db, now, setSetting, getSetting } from './db.ts';
import { BRAND_LINES, PALETTE } from '../pipeline/brand/brand.ts';

export function hashPassword(pw: string) { const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(pw, salt, 32).toString('hex')}`; }

export function seed() {
  const { episodes } = JSON.parse(readFileSync('data/episodes.json', 'utf8'));
  const ins = db.prepare(`INSERT OR IGNORE INTO episodes (id, week, quarter, quarter_theme, title, angle, pillar, slot, proposed_date, status, requires_real_project, updated_at) VALUES (?,?,?,?,?,?,?,?,?, 'IDEA', ?, ?)`);
  for (const e of episodes) ins.run(e.id, e.week, e.quarter, e.quarterTheme, e.title, e.angle, e.pillar, e.slot, e.proposedDate, e.requiresRealProjectEvidence ? 1 : 0, now());

  // E002 production record
  const ep = JSON.parse(readFileSync('episodes/E002/episode.json', 'utf8'));
  const row = db.prepare('SELECT status, cues FROM episodes WHERE id=?').get('E002') as any;
  if (!row.cues) {
    db.prepare(`UPDATE episodes SET premise=?, audience=?, template=?, hooks=?, chosen_hook=?, cues=?, caption=?, character_version=?, status='TECHNICAL_REVIEW', version=?, updated_at=? WHERE id='E002'`)
      .run(ep.premise, ep.audience, ep.template, JSON.stringify(ep.hooks), ep.chosenHook, JSON.stringify(ep.cues), JSON.stringify(ep.caption), 'KSL v1.0', ep.scriptVersion, now());
    const tr = db.prepare('INSERT INTO transitions (episode_id, from_state, to_state, actor, at, note) VALUES (?,?,?,?,?,?)');
    const path = ['IDEA', 'RESEARCH_REQUIRED', 'CLAIMS_VERIFIED', 'SCRIPT_DRAFT', 'TECHNICAL_REVIEW'];
    for (let i = 1; i < path.length; i++) tr.run('E002', path[i - 1], path[i], 'system (seed)', now(), i === 2 ? 'Claims verified against Tier-1 sources retrieved 2026-11-23' : 'Prototype pipeline seed');
    db.prepare('INSERT INTO revisions (episode_id, version, actor, at, kind, detail) VALUES (?,?,?,?,?,?)').run('E002', 1, 'system (seed)', now(), 'script', 'Approved-direction script from master spec §11 (v1.0 brand lines).');
    db.prepare('INSERT INTO revisions (episode_id, version, actor, at, kind, detail) VALUES (?,?,?,?,?,?)').run('E002', 2, 'system (seed)', now(), 'script', 'Brand voice V1.1 lines substituted (greeting, signature catchphrase, tagline).');
  }
  const insS = db.prepare(`INSERT OR REPLACE INTO sources (id, tier, publisher, title, url, published, retrieved, jurisdiction, freshness, expires_at, excerpts) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  for (const s of ep.sources) {
    const days = /rates/.test(s.freshness) ? 31 : 30;
    const exp = new Date(new Date(s.retrieved).getTime() + days * 864e5).toISOString().slice(0, 10);
    insS.run(s.id, s.tier, s.publisher, s.title, s.url, s.published, s.retrieved, s.jurisdiction, s.freshness, exp, JSON.stringify(s.excerpts));
  }
  const insC = db.prepare(`INSERT OR IGNORE INTO claims (id, episode_id, wording, category, scope, caveats, status, verified_by, verified_at, technical_signoff) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const link = db.prepare('INSERT OR IGNORE INTO claim_sources (claim_id, source_id) VALUES (?,?)');
  for (const c of ep.claims) { insC.run(c.id, 'E002', c.wording, c.category, c.scope, c.caveats, c.status, 'Claude (research pass)', '2026-11-23', c.technicalSignoff ?? 'pending'); for (const s of c.sources) link.run(c.id, s); }

  if (!getSetting('brand', null)) setSetting('brand', {
    tagline: BRAND_LINES.tagline, taglineLocked: true,
    greetings: BRAND_LINES.greetings, catchphrases: BRAND_LINES.catchphrases, defaultGreeting: 'greet-default', defaultCatchphrase: 'close-signature',
    community: BRAND_LINES.community, palette: PALETTE, paletteStatus: 'proposed — verify against master logo',
    sonicOptions: ['sonic-1-klaro-rise', 'sonic-2-sosmart-spark', 'sonic-3-solar-shimmer'], approvedSonic: 'sonic-2-sosmart-spark',
    voiceVariants: ['V1-warm', 'V2-bright', 'V3-steady', 'W1-sunny', 'W2-sparkle', 'W3-smile', 'W4-kuya-hug'], approvedGreetingDelivery: 'W3-smile', approvedVoice: null,
    character: { id: 'KSL', version: '1.0', variant: 'KSL-A1', approvedBy: 'CHRIS (Owner)', approvedAt: '2026-11-24T03:22:45+08:00' },
    cadence: { days: ['Tuesday', 'Friday'], note: 'Proposed starting cadence, adjust from analytics.' },
    inventoryTargets: { planned: 104, researched: 12, approvedScripts: 8, readyVideos: 4, bankWeeks: 4 },
  });
  if (!db.prepare('SELECT 1 FROM users LIMIT 1').get()) {
    const pw = process.env.OWNER_PASSWORD || randomBytes(6).toString('base64url');
    db.prepare('INSERT INTO users (id, email, name, roles, pass_hash) VALUES (?,?,?,?,?)').run('u-owner', 'owner@solight.local', 'CHRIS (Owner)', JSON.stringify(['owner', 'producer', 'reviewer', 'editor', 'publisher']), hashPassword(pw));
    console.log(`Owner account created: owner@solight.local / ${pw}  (set OWNER_PASSWORD to choose it)`);
  }
  // register the existing prototype render if present
  if (existsSync('out/episodes/E002/E002.qa.json') && !db.prepare('SELECT 1 FROM renders WHERE episode_id=?').get('E002')) registerRender('E002');
}

export function registerRender(id: string) {
  const dir = `out/episodes/${id}`;
  const qa = JSON.parse(readFileSync(`${dir}/${id}.qa.json`, 'utf8'));
  const ver = (db.prepare('SELECT version FROM episodes WHERE id=?').get(id) as any)?.version ?? 1;
  db.prepare(`INSERT INTO renders (episode_id, episode_version, file, file_nomusic, srt, vtt, cover, contact, qa, verdict, duration, character_version, voice_version, template_version, music_license, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, ver, `${dir}/${id}.mp4`, `${dir}/${id}-nomusic.mp4`, `${dir}/${id}.srt`, `${dir}/${id}.vtt`, `${dir}/${id}-cover.png`, `${dir}/${id}-contact.png`, JSON.stringify(qa), qa.verdict,
      qa.checks.find((c: any) => c.id === 'MP4-DURATION') ? parseFloat(qa.checks.find((c: any) => c.id === 'MP4-DURATION').detail) : null,
      `KSL v1.0 (${qa.character})`, 'demo: kokoro-82m blend michael/onyx', 'T05-energy-flow v0.1', 'Original, owned by SoLight Solar PH (assets/audio/sonic/*.json)', now());
}

if (process.argv[1]?.endsWith('seed.ts')) { seed(); console.log('seeded'); }
