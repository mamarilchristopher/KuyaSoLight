// Kuya SoLight Content Studio API + static web app.
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, unlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { db, now, J, getSetting, setSetting } from './db.ts';
import { seed, registerRender } from './seed.ts';
import { STATES, STATE_LABEL, State, Role, Facts, canTransition, nextStates, invalidationsForEdit, gate } from './workflow.ts';
import { subtitleQA, numbers } from '../pipeline/render/subtitles.ts';
import { masterLogoPath, LOGO_DIR } from '../pipeline/brand/brand.ts';

seed();
const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// ── auth ────────────────────────────────────────────────────────────────────────────
interface U { id: string; name: string; email: string; roles: Role[] }
declare global { namespace Express { interface Request { user?: U } } }
function verify(pw: string, stored: string) { const [salt, h] = stored.split(':'); const a = scryptSync(pw, salt, 32); return timingSafeEqual(a, Buffer.from(h, 'hex')); }
app.post('/api/login', (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(req.body?.email) as any;
  if (!u || !verify(String(req.body?.password || ''), u.pass_hash)) return res.status(401).json({ error: 'Wrong email or password.' });
  const token = randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id, expires) VALUES (?,?,?)').run(token, u.id, Date.now() + 7 * 864e5);
  res.cookie('ksl', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 864e5 }).json({ ok: true });
});
app.post('/api/logout', (req, res) => { db.prepare('DELETE FROM sessions WHERE token=?').run(req.cookies.ksl || ''); res.clearCookie('ksl').json({ ok: true }); });
function auth(req: Request, res: Response, next: NextFunction) {
  const s = db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?').get(req.cookies.ksl || '', Date.now()) as any;
  if (!s) return res.status(401).json({ error: 'Sign in required.' });
  req.user = { id: s.id, name: s.name, email: s.email, roles: J(s.roles, []) }; next();
}
const need = (...roles: Role[]) => (req: Request, res: Response, next: NextFunction) => req.user!.roles.some((r) => roles.includes(r)) ? next() : res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` });
app.use('/api', auth);
app.use('/media', auth, (req, res, next) => {
  const p = resolve('.' + decodeURIComponent(req.path));
  const allowed = [resolve('out'), resolve('assets')];
  if (!allowed.some((a) => p.startsWith(a + '/')) || !existsSync(p)) return res.status(404).end();
  res.sendFile(p);
});
app.get('/api/me', (req, res) => res.json(req.user));

// ── helpers ─────────────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);
function claimsFor(id: string) {
  const cl = db.prepare('SELECT * FROM claims WHERE episode_id=? ORDER BY id').all(id) as any[];
  return cl.map((c) => {
    const src = db.prepare('SELECT s.* FROM claim_sources cs JOIN sources s ON s.id=cs.source_id WHERE cs.claim_id=?').all(c.id) as any[];
    return { ...c, sources: src.map((s) => ({ ...s, excerpts: J(s.excerpts, []), stale: !!s.expires_at && s.expires_at < today() })) };
  });
}
function latestRender(id: string) { return db.prepare('SELECT * FROM renders WHERE episode_id=? AND stale=0 ORDER BY id DESC LIMIT 1').get(id) as any; }
function facts(e: any): Facts {
  const cl = claimsFor(e.id); const cues = J<any[]>(e.cues, []);
  const r = latestRender(e.id); const qa = r ? J<any>(r.qa, { checks: [] }) : null;
  const brand = getSetting<any>('brand', {});
  const sq = cues.length ? subtitleQA(cues.map((c) => c.text).join(' '), cues.map((c, i) => ({ id: c.id, text: c.text, start: i, end: i + 0.5 })), []).filter((x) => x.id === 'SUB-TRANSCRIPT-MATCH' || x.id === 'SUB-NUMBERS-MATCH') : [];
  return {
    claims: cl.map((c) => ({ id: c.id, status: c.status, sourceCount: c.sources.length, technicalSignoff: c.technical_signoff, stale: c.sources.some((s: any) => s.stale) })),
    hasScript: cues.length > 0, scriptHasHook: cues.some((c) => c.scene === 'hook'), hasStoryboard: cues.length > 0 && cues.every((c) => !!c.scene),
    subtitleQaPassed: cues.length > 0 && sq.every((x) => x.status === 'pass'),
    latestRender: r && r.episode_version === e.version ? { blockingFailures: qa.checks.filter((c: any) => c.status === 'fail' && c.blocking).map((c: any) => c.id) } : null,
    ownerApproved: e.owner_approved_version === e.version, scheduledDate: e.scheduled_date, publishedUrl: e.published_url,
    logoSupplied: !!masterLogoPath(), characterApproved: !!brand.character?.approvedBy,
  };
}
const epRow = (id: string) => db.prepare('SELECT * FROM episodes WHERE id=?').get(id) as any;
function shape(e: any) {
  return { ...e, hooks: J(e.hooks, []), cues: J(e.cues, []), caption: J(e.caption, null), tags: J(e.tags, []), statusLabel: STATE_LABEL[e.status as State] };
}

// ── dashboard ───────────────────────────────────────────────────────────────────────
app.get('/api/dashboard', (req, res) => {
  const all = db.prepare('SELECT id,title,status,pillar,proposed_date,scheduled_date,week FROM episodes ORDER BY id').all() as any[];
  const by = (s: string[]) => all.filter((e) => s.includes(e.status));
  const d0 = today(), d7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10), d28 = new Date(Date.now() + 28 * 864e5).toISOString().slice(0, 10);
  const dateOf = (e: any) => e.scheduled_date || e.proposed_date;
  const counts = Object.fromEntries(STATES.map((s) => [s, all.filter((e) => e.status === s).length]));
  const t = getSetting<any>('brand', {}).inventoryTargets || {};
  const researched = all.filter((e) => STATES.indexOf(e.status) >= STATES.indexOf('CLAIMS_VERIFIED')).length;
  const approvedScripts = all.filter((e) => STATES.indexOf(e.status) >= STATES.indexOf('SCRIPT_APPROVED')).length;
  const ready = by(['READY_TO_PUBLISH', 'SCHEDULED']).length;
  const inventory = [
    { label: 'Researched & prioritised', have: researched, target: t.researched ?? 12 },
    { label: 'Approved scripts', have: approvedScripts, target: t.approvedScripts ?? 8 },
    { label: 'Publication-ready videos', have: ready, target: t.readyVideos ?? 4 },
  ].map((x) => ({ ...x, low: x.have < x.target }));
  const expiring = db.prepare('SELECT id,title,publisher,expires_at FROM sources WHERE expires_at <= ? ORDER BY expires_at').all(new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10));
  const failures = db.prepare("SELECT id,episode_id,log,finished_at FROM jobs WHERE status='failed' ORDER BY id DESC LIMIT 5").all();
  res.json({
    counts, total: all.length, inventory,
    readyForRelease: by(['READY_TO_PUBLISH']), thisWeek: all.filter((e) => dateOf(e) >= d0 && dateOf(e) <= d7), next4Weeks: all.filter((e) => dateOf(e) >= d0 && dateOf(e) <= d28),
    awaitingResearch: by(['RESEARCH_REQUIRED']).length, awaitingReview: by(['TECHNICAL_REVIEW', 'OWNER_APPROVAL', 'AV_QA']), renderFailures: failures, expiringSources: expiring,
    published: by(['PUBLISHED', 'PERFORMANCE_REVIEW']).length, logoSupplied: !!masterLogoPath(),
    metrics: db.prepare('SELECT COUNT(DISTINCT episode_id) eps, SUM(reach) reach, SUM(plays) plays, SUM(qualified_leads) leads, SUM(inquiries) inquiries FROM analytics').get(),
  });
});

// ── episodes ────────────────────────────────────────────────────────────────────────
app.get('/api/episodes', (req, res) => {
  const q = `%${String(req.query.q || '').toLowerCase()}%`;
  const rows = db.prepare(`SELECT id,week,quarter,title,angle,pillar,slot,proposed_date,scheduled_date,published_date,status,version,requires_real_project FROM episodes WHERE (lower(title) LIKE ? OR lower(angle) LIKE ? OR lower(id) LIKE ?) ORDER BY id`).all(q, q, q) as any[];
  res.json(rows.filter((r) => (!req.query.status || r.status === req.query.status) && (!req.query.pillar || r.pillar === req.query.pillar)).map((r) => ({ ...r, statusLabel: STATE_LABEL[r.status as State] })));
});
app.get('/api/episodes/:id', (req, res) => {
  const e = epRow(String(req.params.id)); if (!e) return res.status(404).json({ error: 'No such episode.' });
  const f = facts(e); const ns = nextStates(e.status);
  res.json({
    episode: shape(e), claims: claimsFor(e.id), facts: f,
    next: { forward: ns.forward ? { state: ns.forward, label: STATE_LABEL[ns.forward], ...canTransition(e.status, ns.forward, req.user!.roles, f) } : null, back: ns.back.map((s) => ({ state: s, label: STATE_LABEL[s] })) },
    renders: (db.prepare('SELECT * FROM renders WHERE episode_id=? ORDER BY id DESC').all(e.id) as any[]).map((r) => ({ ...r, qa: J(r.qa, null) })),
    transitions: db.prepare('SELECT * FROM transitions WHERE episode_id=? ORDER BY id DESC').all(e.id),
    revisions: db.prepare('SELECT * FROM revisions WHERE episode_id=? ORDER BY id DESC').all(e.id),
    jobs: db.prepare('SELECT * FROM jobs WHERE episode_id=? ORDER BY id DESC LIMIT 5').all(e.id),
    renderable: existsSync(`episodes/${e.id}/episode.json`) && existsSync(`pipeline/render/scenes/${e.id.toLowerCase()}.ts`),
  });
});
app.post('/api/episodes/:id/transition', (req, res) => {
  const e = epRow(String(req.params.id)); if (!e) return res.status(404).json({ error: 'No such episode.' });
  const to = req.body?.to as State;
  const v = canTransition(e.status, to, req.user!.roles, facts(e));
  if (!v.ok) return res.status(409).json({ error: 'Transition blocked.', reasons: v.reasons });
  if (STATES.indexOf(to) < STATES.indexOf(e.status) && !req.body?.note) return res.status(400).json({ error: 'A rejection needs a note explaining what to fix.' });
  db.prepare('UPDATE episodes SET status=?, updated_at=? WHERE id=?').run(to, now(), e.id);
  db.prepare('INSERT INTO transitions (episode_id, from_state, to_state, actor, at, note) VALUES (?,?,?,?,?,?)').run(e.id, e.status, to, req.user!.name, now(), req.body?.note || null);
  res.json({ ok: true, status: to });
});
app.post('/api/episodes/:id/owner-approval', need('owner'), (req, res) => {
  const e = epRow(String(req.params.id));
  if (e.status !== 'OWNER_APPROVAL') return res.status(409).json({ error: 'Episode is not awaiting owner approval.' });
  db.prepare('UPDATE episodes SET owner_approved_version=? WHERE id=?').run(e.version, e.id);
  db.prepare('INSERT INTO approvals (episode_id, kind, actor, at, version, note) VALUES (?,?,?,?,?,?)').run(e.id, 'owner', req.user!.name, now(), e.version, req.body?.note || null);
  res.json({ ok: true });
});
app.patch('/api/episodes/:id', need('owner', 'producer', 'editor'), (req, res) => {
  const e = epRow(String(req.params.id)); if (!e) return res.status(404).json({ error: 'No such episode.' });
  const b = req.body || {}; const changes: string[] = [];
  const isEditorOnly = !req.user!.roles.some((r) => ['owner', 'producer'].includes(r));
  if (b.cues) {
    const old = J<any[]>(e.cues, []); const neu = b.cues as any[];
    const brand = getSetting<any>('brand', {});
    for (const c of neu) if (c.brandLine === 'tagline' && c.text !== brand.tagline) return res.status(422).json({ error: `The tagline is locked: "${brand.tagline}"` });
    const textChanged = neu.filter((c) => old.find((o) => o.id === c.id)?.text !== c.text);
    if (isEditorOnly && (textChanged.length || neu.length !== old.length)) return res.status(403).json({ error: 'Video editors can change scenes and timing but not approved narration.' });
    const claimCues = [...new Set(textChanged.flatMap((c) => c.claims || old.find((o) => o.id === c.id)?.claims || []))];
    const numbersChanged = numbers(old.map((c) => c.text).join(' ')).join() !== numbers(neu.map((c) => c.text).join(' ')).join();
    const narrationChanged = textChanged.length > 0 || neu.length !== old.length;
    const inv = invalidationsForEdit(e.status, { claimCuesChanged: claimCues as string[], numbersChanged, narrationChanged });
    const newVersion = narrationChanged ? e.version + 1 : e.version;
    db.prepare('UPDATE episodes SET cues=?, version=?, updated_at=? WHERE id=?').run(JSON.stringify(neu), newVersion, now(), e.id);
    for (const cid of inv.resetSignoffFor) db.prepare("UPDATE claims SET technical_signoff='pending', signoff_by=NULL, signoff_at=NULL WHERE id=?").run(cid);
    if (numbersChanged) db.prepare("UPDATE claims SET technical_signoff='pending' WHERE episode_id=?").run(e.id);
    if (inv.staleRenders) db.prepare('UPDATE renders SET stale=1 WHERE episode_id=?').run(e.id);
    if (inv.moveTo) {
      db.prepare('UPDATE episodes SET status=? WHERE id=?').run(inv.moveTo, e.id);
      db.prepare('INSERT INTO transitions (episode_id, from_state, to_state, actor, at, note) VALUES (?,?,?,?,?,?)').run(e.id, e.status, inv.moveTo, 'system', now(), inv.notes.join(' '));
    }
    changes.push(narrationChanged ? `Narration edited (${textChanged.map((c) => c.id).join(', ') || 'cue list'}). ${inv.notes.join(' ')}` : 'Storyboard/scene edit.');
    db.prepare('INSERT INTO revisions (episode_id, version, actor, at, kind, detail) VALUES (?,?,?,?,?,?)').run(e.id, newVersion, req.user!.name, now(), narrationChanged ? 'script' : 'storyboard', changes.join(' '));
  }
  for (const k of ['scheduled_date', 'published_url', 'published_date', 'premise', 'greeting_id', 'catchphrase_id', 'pillar']) if (k in b) {
    if ((k === 'published_url' || k === 'published_date') && !req.user!.roles.some((r) => ['owner', 'publisher'].includes(r))) return res.status(403).json({ error: 'Publisher role required.' });
    db.prepare(`UPDATE episodes SET ${k}=?, updated_at=? WHERE id=?`).run(b[k], now(), e.id);
    db.prepare('INSERT INTO revisions (episode_id, version, actor, at, kind, detail) VALUES (?,?,?,?,?,?)').run(e.id, e.version, req.user!.name, now(), 'meta', `${k} → ${b[k]}`);
  }
  res.json({ ok: true });
});

// ── claims & sources ────────────────────────────────────────────────────────────────
app.get('/api/claims', (req, res) => {
  const eps = db.prepare('SELECT DISTINCT episode_id FROM claims').all() as any[];
  res.json(eps.flatMap((x) => claimsFor(x.episode_id).map((c) => ({ ...c, episodeTitle: epRow(x.episode_id)?.title }))));
});
app.post('/api/claims/:id/signoff', need('reviewer', 'owner'), (req, res) => {
  const d = req.body?.decision; if (!['approved', 'online-checked', 'rejected', 'pending'].includes(d)) return res.status(400).json({ error: 'decision must be approved|online-checked|rejected|pending' });
  const c = db.prepare('SELECT * FROM claims WHERE id=?').get(String(req.params.id)) as any; if (!c) return res.status(404).end();
  if ((d === 'approved' || d === 'online-checked') && !(db.prepare('SELECT 1 FROM claim_sources WHERE claim_id=?').get(c.id))) return res.status(409).json({ error: 'Cannot approve a claim without a source.' });
  db.prepare('UPDATE claims SET technical_signoff=?, signoff_by=?, signoff_at=?, signoff_note=? WHERE id=?').run(d, req.user!.name, now(), req.body?.note || null, c.id);
  db.prepare('INSERT INTO approvals (episode_id, kind, actor, at, version, note) VALUES (?,?,?,?,?,?)').run(c.episode_id, `technical:${c.id}:${d}`, req.user!.name, now(), epRow(c.episode_id).version, req.body?.note || null);
  res.json({ ok: true });
});
app.get('/api/sources', (req, res) => res.json((db.prepare('SELECT * FROM sources ORDER BY expires_at').all() as any[]).map((s) => ({ ...s, excerpts: J(s.excerpts, []), stale: s.expires_at < today() }))));

// ── render queue ────────────────────────────────────────────────────────────────────
app.get('/api/jobs', (req, res) => res.json(db.prepare('SELECT * FROM jobs ORDER BY id DESC LIMIT 30').all()));
app.post('/api/episodes/:id/render', need('owner', 'producer', 'editor'), (req, res) => {
  const e = epRow(String(req.params.id));
  if (!existsSync(`episodes/${e.id}/episode.json`) || !existsSync(`pipeline/render/scenes/${e.id.toLowerCase()}.ts`)) return res.status(409).json({ error: `${e.id} has no storyboard scene graph yet. Build its scenes before rendering.` });
  if (STATES.indexOf(e.status) < STATES.indexOf('VOICE_SUBTITLES') && !req.body?.preview) return res.status(409).json({ error: 'Rendering for review requires an approved script (Voice & subtitle stage). Use a preview render instead.' });
  if (db.prepare("SELECT 1 FROM jobs WHERE status IN ('queued','running')").get()) return res.status(409).json({ error: 'A render is already running.' });
  // write current DB narration back to the episode file so the pipeline renders exactly the approved text
  const file = JSON.parse(readFileSync(`episodes/${e.id}/episode.json`, 'utf8')); file.cues = J(e.cues, file.cues); file.scriptVersion = e.version;
  writeFileSync(`episodes/${e.id}/episode.json`, JSON.stringify(file, null, 2));
  const job = db.prepare('INSERT INTO jobs (episode_id, kind, status, progress, log, created_at, actor) VALUES (?,?,?,?,?,?,?)').run(e.id, req.body?.preview ? 'preview' : 'render', 'running', 0, '', now(), req.user!.name);
  const id = Number(job.lastInsertRowid);
  const p = spawn(process.execPath, ['--import', 'tsx', 'pipeline/render/cli.ts', e.id], { env: { ...process.env, NODE_NO_WARNINGS: '1' } });
  let log = '';
  const onData = (d: Buffer) => { log += d.toString(); const m = [...log.matchAll(/frames (\d+)%/g)].pop(); db.prepare('UPDATE jobs SET progress=?, log=? WHERE id=?').run(m ? +m[1] / 100 : 0, log.slice(-4000), id); };
  p.stdout.on('data', onData); p.stderr.on('data', onData);
  p.on('close', (code) => {
    if (code === 0) { db.prepare('UPDATE renders SET stale=1 WHERE episode_id=?').run(e.id); registerRender(e.id); }
    db.prepare('UPDATE jobs SET status=?, progress=?, finished_at=?, log=? WHERE id=?').run(code === 0 ? 'done' : 'failed', code === 0 ? 1 : null, now(), log.slice(-4000), id);
  });
  res.json({ ok: true, jobId: id });
});

// ── brand, characters, audio ────────────────────────────────────────────────────────
app.get('/api/brand', (req, res) => {
  const sonic = existsSync('assets/audio/sonic') ? readdirSync('assets/audio/sonic').filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(`assets/audio/sonic/${f}`, 'utf8'))) : [];
  const voices = ['V1-warm', 'V2-bright', 'V3-steady'].map((v) => ({ id: v, file: `out/brand/identity-demo/voice-${v}/narration.wav`, exists: existsSync(`out/brand/identity-demo/voice-${v}/narration.wav`) }));
  res.json({ ...getSetting('brand', {}), logo: masterLogoPath(), logoMeta: getSetting('logoMeta', null), sonicAssets: sonic, voices, pronunciation: J(readFileSync('assets/voice/pronunciation.json', 'utf8'), {}),
    identityDemo: existsSync('out/brand/identity-demo/IDENTITY-DEMO.mp4') ? 'out/brand/identity-demo/IDENTITY-DEMO.mp4' : null });
});
app.put('/api/brand', need('owner'), (req, res) => {
  const cur = getSetting<any>('brand', {}); const b = req.body || {};
  if ('tagline' in b && b.tagline !== cur.tagline) return res.status(422).json({ error: 'The official tagline is locked and cannot be edited here.' });
  const allowed = ['defaultGreeting', 'defaultCatchphrase', 'approvedSonic', 'approvedVoice', 'cadence', 'inventoryTargets'];
  for (const k of allowed) if (k in b) cur[k] = b[k];
  setSetting('brand', cur); res.json({ ok: true });
});
app.post('/api/brand/logo', need('owner'), express.raw({ type: ['image/png', 'image/svg+xml'], limit: '20mb' }), (req, res) => {
  const ct = req.headers['content-type']; const ext = ct === 'image/svg+xml' ? 'svg' : 'png';
  if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: 'Send the master logo file as image/png or image/svg+xml.' });
  mkdirSync(LOGO_DIR, { recursive: true });
  for (const x of ['svg', 'png']) if (existsSync(`${LOGO_DIR}/master.${x}`)) unlinkSync(`${LOGO_DIR}/master.${x}`);
  writeFileSync(`${LOGO_DIR}/master.${ext}`, req.body);
  setSetting('logoMeta', { uploadedBy: req.user!.name, at: now(), bytes: req.body.length, sha256: createHash('sha256').update(req.body).digest('hex'), type: ct });
  res.json({ ok: true, note: 'Stored unchanged. Re-render episodes to apply. Extract and approve final colours from this file.' });
});
app.get('/api/characters', (req, res) => {
  const lock = J(readFileSync('assets/characters/kuya-solight/lock.json', 'utf8'), {});
  const dir = 'out/characters'; const files = existsSync(dir) ? readdirSync(dir) : []; const vfiles = existsSync(dir + '/variants-a') ? readdirSync(dir + '/variants-a') : [];
  res.json({ lock, options: existsSync(dir + '/options.json') ? J(readFileSync(dir + '/options.json', 'utf8'), []) : [], variants: existsSync(dir + '/variants-a/variants.json') ? J(readFileSync(dir + '/variants-a/variants.json', 'utf8'), []) : [], files: files.filter((f) => f.endsWith('.png')).map((f) => `${dir}/${f}`), variantFiles: vfiles.filter((f) => f.endsWith('.png')).map((f) => `${dir}/variants-a/${f}`) });
});

// ── analytics (manual import until Meta API access is authorised) ───────────────────
app.get('/api/analytics', (req, res) => res.json(db.prepare('SELECT a.*, e.title, e.pillar FROM analytics a JOIN episodes e ON e.id=a.episode_id ORDER BY captured_on DESC').all()));
app.post('/api/analytics', need('owner', 'publisher'), (req, res) => {
  const b = req.body || {}; if (!epRow(b.episode_id)) return res.status(400).json({ error: 'Unknown episode.' });
  const cols = ['episode_id', 'platform', 'captured_on', 'reach', 'plays', 'plays_3s', 'avg_watch_sec', 'completion_rate', 'engagements', 'shares', 'saves', 'comments', 'profile_visits', 'inquiries', 'qualified_leads', 'quote_requests', 'site_visits', 'closed_projects', 'notes'];
  db.prepare(`INSERT INTO analytics (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).run(...cols.map((c) => b[c] ?? null));
  res.json({ ok: true });
});
app.get('/api/workflow', (req, res) => res.json({ states: STATES.map((s) => ({ id: s, label: STATE_LABEL[s] })) }));

// ── web app ─────────────────────────────────────────────────────────────────────────
const webDist = resolve('web/dist');
if (existsSync(webDist)) { app.use(express.static(webDist)); app.get(/^\/(?!api|media).*/, (req, res) => res.sendFile(join(webDist, 'index.html'))); }
const port = +(process.env.PORT || 8787);
app.listen(port, () => console.log(`Kuya SoLight Content Studio on http://localhost:${port}`));
void gate;
