import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const api = async (path: string, opts: RequestInit = {}) => {
  const r = await fetch(path, { credentials: 'same-origin', headers: { 'content-type': 'application/json' }, ...opts });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(body.error || r.statusText), { body, status: r.status });
  return body;
};
const media = (p?: string | null) => (p ? `/media/${p}` : '');
const PILLARS: Record<string, string> = { A: 'Solar Basics', B: 'Solar Myths, Explained', C: 'Sulit Ba Talaga?', D: 'Home Solar Decisions', E: 'Solar Tech 101', F: 'Solar Safety & Quality', G: 'SoLight in Real Life', H: 'Solar for Business' };

function useHash() {
  const [h, setH] = useState(location.hash.slice(1) || 'dashboard');
  useEffect(() => { const f = () => setH(location.hash.slice(1) || 'dashboard'); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return h;
}
function useLoad<T>(path: string | null, deps: any[] = []) {
  const [d, setD] = useState<T | null>(null); const [err, setErr] = useState<string | null>(null);
  const reload = useCallback(() => { if (path) api(path).then(setD).catch((e) => setErr(e.message)); }, [path]);
  useEffect(() => { reload(); }, [reload, ...deps]);
  return { d, err, reload };
}
const Pill = ({ s }: { s: string }) => <span className={`pill st-${s}`}>{s.replace(/_/g, ' ').toLowerCase()}</span>;

function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('owner@solight.local'); const [pw, setPw] = useState(''); const [err, setErr] = useState('');
  return <form className="login" onSubmit={(e) => { e.preventDefault(); api('/api/login', { method: 'POST', body: JSON.stringify({ email, password: pw }) }).then(onDone).catch((x) => setErr(x.message)); }}>
    <h1>Kuya SoLight <span>Content Studio</span></h1>
    <label htmlFor="em">Email</label><input id="em" value={email} onChange={(e) => setEmail(e.target.value)} />
    <label htmlFor="pw">Password</label><input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
    {err && <p className="err">{err}</p>}<button>Sign in</button>
  </form>;
}

const NAV = [['dashboard', 'Dashboard'], ['episodes', 'Episode Library'], ['calendar', 'Content Calendar'], ['factcheck', 'Fact Check Center'], ['characters', 'Character Studio'], ['voice', 'Voice & Music'], ['renders', 'Video Renderer'], ['archive', 'Published Archive'], ['analytics', 'Analytics & Leads'], ['brand', 'Brand Settings']];

function App() {
  const [me, setMe] = useState<any>(undefined);
  const route = useHash();
  useEffect(() => { api('/api/me').then(setMe).catch(() => setMe(null)); }, []);
  if (me === undefined) return null;
  if (!me) return <Login onDone={() => api('/api/me').then(setMe)} />;
  const [page, arg] = route.split('/');
  return <div className="shell">
    <aside><div className="brand">Kuya SoLight<small>Content Studio</small></div>
      <nav>{NAV.map(([k, l]) => <a key={k} href={`#${k}`} className={page === k || (page === 'episode' && k === 'episodes') ? 'on' : ''}>{l}</a>)}</nav>
      <div className="me">{me.name}<br /><small>{me.roles.join(' · ')}</small><button className="link" onClick={() => api('/api/logout', { method: 'POST' }).then(() => setMe(null))}>Sign out</button></div>
    </aside>
    <main>
      {page === 'dashboard' && <Dashboard />}
      {page === 'episodes' && <Library />}
      {page === 'episode' && <Episode id={arg} />}
      {page === 'calendar' && <Calendar />}
      {page === 'factcheck' && <FactCheck />}
      {page === 'characters' && <Characters />}
      {page === 'voice' && <Voice />}
      {page === 'renders' && <Renders />}
      {page === 'archive' && <Library status="PUBLISHED" title="Published Archive" />}
      {page === 'analytics' && <Analytics />}
      {page === 'brand' && <Brand />}
    </main>
  </div>;
}

function Dashboard() {
  const { d } = useLoad<any>('/api/dashboard');
  if (!d) return <p>Loading…</p>;
  return <>
    <h1>Dashboard</h1>
    {!d.logoSupplied && <div className="alert">The official SoLight Solar PH logo has not been uploaded. Every render uses a marked placeholder and is blocked from publishing. <a href="#brand">Upload it in Brand Settings</a>.</div>}
    <div className="tiles">
      <Tile n={d.readyForRelease.length} l="Ready for release" />
      <Tile n={d.thisWeek.length} l="Scheduled this week" />
      <Tile n={d.next4Weeks.length} l="Next 4 weeks" />
      <Tile n={d.total} l="Planned episodes" />
      <Tile n={d.awaitingResearch + (d.counts.IDEA || 0)} l="Awaiting research" />
      <Tile n={d.awaitingReview.length} l="Awaiting review" />
      <Tile n={d.renderFailures.length} l="Render failures" warn={d.renderFailures.length > 0} />
      <Tile n={d.expiringSources.length} l="Sources expiring ≤14 days" warn={d.expiringSources.length > 0} />
      <Tile n={d.published} l="Published videos" />
    </div>
    <section><h2>Production inventory</h2>
      <table><thead><tr><th>Bank</th><th>Have</th><th>Target</th><th></th></tr></thead><tbody>{d.inventory.map((x: any) => <tr key={x.label}><td>{x.label}</td><td className="num">{x.have}</td><td className="num">{x.target}</td><td>{x.low ? <span className="pill warn">low inventory</span> : <span className="pill ok">ok</span>}</td></tr>)}</tbody></table></section>
    <section><h2>Awaiting review</h2>{d.awaitingReview.length ? <ul>{d.awaitingReview.map((e: any) => <li key={e.id}><a href={`#episode/${e.id}`}>{e.id} · {e.title}</a> <Pill s={e.status} /></li>)}</ul> : <p className="muted">Nothing waiting.</p>}</section>
    <section><h2>Sources to re-verify</h2>{d.expiringSources.length ? <ul>{d.expiringSources.map((s: any) => <li key={s.id}>{s.title} · {s.publisher} · <b>expires {s.expires_at}</b></li>)}</ul> : <p className="muted">None in the next 14 days.</p>}</section>
    <section><h2>Pipeline</h2><div className="funnel">{Object.entries(d.counts).map(([k, v]: any) => <div key={k} className={v ? '' : 'dim'}><b>{v}</b><span>{k.replace(/_/g, ' ').toLowerCase()}</span></div>)}</div></section>
    <section><h2>Content performance</h2>{d.metrics.eps ? <p>{d.metrics.eps} episodes tracked · reach {d.metrics.reach ?? 0} · plays {d.metrics.plays ?? 0} · inquiries {d.metrics.inquiries ?? 0} · qualified leads {d.metrics.leads ?? 0}</p> : <p className="muted">No analytics yet. Nothing is published; numbers appear once you import platform data.</p>}</section>
  </>;
}
const Tile = ({ n, l, warn }: { n: number; l: string; warn?: boolean }) => <div className={`tile ${warn ? 'warn' : ''}`}><b>{n}</b><span>{l}</span></div>;

function Library({ status, title }: { status?: string; title?: string }) {
  const [q, setQ] = useState(''); const [p, setP] = useState(''); const [s, setS] = useState(status || '');
  const { d } = useLoad<any[]>(`/api/episodes?q=${encodeURIComponent(q)}&pillar=${p}&status=${s}`, []);
  return <>
    <h1>{title || 'Episode Library'}</h1>
    <div className="filters">
      <input id="q" placeholder="Search title, angle or ID" value={q} onChange={(e) => setQ(e.target.value)} />
      <select id="pillar" value={p} onChange={(e) => setP(e.target.value)}><option value="">All pillars</option>{Object.entries(PILLARS).map(([k, v]) => <option key={k} value={k}>{k} · {v}</option>)}</select>
      {!status && <select id="status" value={s} onChange={(e) => setS(e.target.value)}><option value="">All stages</option>{['IDEA', 'RESEARCH_REQUIRED', 'CLAIMS_VERIFIED', 'SCRIPT_DRAFT', 'TECHNICAL_REVIEW', 'SCRIPT_APPROVED', 'STORYBOARD', 'VOICE_SUBTITLES', 'VIDEO_RENDER', 'AV_QA', 'OWNER_APPROVAL', 'READY_TO_PUBLISH', 'SCHEDULED', 'PUBLISHED', 'PERFORMANCE_REVIEW'].map((x) => <option key={x} value={x}>{x.replace(/_/g, ' ').toLowerCase()}</option>)}</select>}
    </div>
    {d && <div className="scroll"><table><thead><tr><th>ID</th><th>Wk</th><th>Title</th><th>Pillar</th><th>Date</th><th>Stage</th></tr></thead><tbody>{d.map((e) => <tr key={e.id}><td><a href={`#episode/${e.id}`}>{e.id}</a></td><td className="num">{e.week}</td><td><a href={`#episode/${e.id}`}>{e.title}</a><div className="muted small">{e.angle}</div></td><td>{e.pillar} · {PILLARS[e.pillar]}</td><td className="num">{e.scheduled_date || e.proposed_date}{!e.scheduled_date && <div className="muted small">proposed</div>}</td><td><Pill s={e.status} /></td></tr>)}</tbody></table>{!d.length && <p className="muted">No episodes match.</p>}</div>}
  </>;
}

function Episode({ id }: { id: string }) {
  const { d, reload } = useLoad<any>(`/api/episodes/${id}`);
  const [tab, setTab] = useState('overview'); const [msg, setMsg] = useState<any>(null); const [note, setNote] = useState('');
  const [poll, setPoll] = useState(0);
  useEffect(() => { if (d?.jobs?.[0]?.status === 'running') { const t = setTimeout(() => { reload(); setPoll(poll + 1); }, 2000); return () => clearTimeout(t); } }, [d, poll]);
  if (!d) return <p>Loading…</p>;
  const e = d.episode;
  const act = (p: Promise<any>) => p.then(() => { setMsg(null); setNote(''); reload(); }).catch((x) => setMsg({ error: x.message, reasons: x.body?.reasons }));
  const move = (to: string) => act(api(`/api/episodes/${id}/transition`, { method: 'POST', body: JSON.stringify({ to, note }) }));
  const r0 = d.renders.find((r: any) => !r.stale) || d.renders[0];
  return <>
    <p className="crumb"><a href="#episodes">Episode Library</a> / {e.id}</p>
    <h1>{e.id} · {e.title}</h1>
    <p className="muted">{PILLARS[e.pillar]} · Week {e.week} · {e.slot} · v{e.version} · <Pill s={e.status} /></p>
    <div className="workflow">
      {d.next.forward && <button disabled={!d.next.forward.ok} onClick={() => move(d.next.forward.state)}>Move to {d.next.forward.label}</button>}
      {e.status === 'OWNER_APPROVAL' && <button onClick={() => act(api(`/api/episodes/${id}/owner-approval`, { method: 'POST', body: '{}' }))}>Record owner approval</button>}
      {d.next.back.length > 0 && <><input id="note" placeholder="Reason for rejection" value={note} onChange={(x) => setNote(x.target.value)} />{d.next.back.map((b: any) => <button key={b.state} className="ghost" onClick={() => move(b.state)}>Return to {b.label}</button>)}</>}
      {d.next.forward && !d.next.forward.ok && <ul className="gate">{d.next.forward.reasons.map((r: string) => <li key={r}>{r}</li>)}</ul>}
      {msg && <div className="err">{msg.error}{msg.reasons && <ul>{msg.reasons.map((r: string) => <li key={r}>{r}</li>)}</ul>}</div>}
    </div>
    <div className="tabs">{['overview', 'script', 'storyboard', 'factcheck', 'renders', 'copy', 'history'].map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{({ overview: 'Overview', script: 'Script Studio', storyboard: 'Storyboard', factcheck: 'Fact check', renders: 'Renders & QA', copy: 'Caption & CTA', history: 'History' } as any)[t]}</button>)}</div>
    {tab === 'overview' && <section>
      <p><b>Angle:</b> {e.angle}</p>{e.premise && <p><b>Premise:</b> {e.premise}</p>}
      {e.requires_real_project ? <div className="alert">This episode needs a genuinely documented SoLight project: approved images, commissioning date, exact equipment and measured data. No invented figures.</div> : null}
      {e.hooks.length > 0 && <><h3>Hook candidates</h3><ol>{e.hooks.map((h: any, i: number) => <li key={i} className={i === e.chosen_hook ? 'chosen' : ''}><span className="muted small">{h.type}</span> {h.text}{i === e.chosen_hook && <b> · chosen</b>}</li>)}</ol></>}
      {r0 && <div className="player"><video controls preload="metadata" src={media(r0.file)} poster={media(r0.cover)} /></div>}
      {!e.cues.length && <p className="muted">No research or script yet. Start by moving it to Research required, then extract claims in the Fact Check Center.</p>}
    </section>}
    {tab === 'script' && <ScriptEditor e={e} onSaved={reload} />}
    {tab === 'storyboard' && <section>{e.cues.length ? <table><thead><tr><th>Cue</th><th>Scene</th><th>Narration</th><th>Claims</th></tr></thead><tbody>{e.cues.map((c: any) => <tr key={c.id}><td>{c.id}</td><td><Pill s={c.scene} /></td><td>{c.text}</td><td className="small">{(c.claims || []).join(', ')}</td></tr>)}</tbody></table> : <p className="muted">No storyboard yet.</p>}
      <p className="muted small">Scene timing is derived from the recorded narration: each cue's start/end comes from the synthesized audio. Scene graphs live in <code>pipeline/render/scenes/</code>.</p></section>}
    {tab === 'factcheck' && <ClaimList claims={d.claims} onChange={reload} />}
    {tab === 'renders' && <section>
      <button disabled={!d.renderable || d.jobs?.[0]?.status === 'running'} onClick={() => act(api(`/api/episodes/${id}/render`, { method: 'POST', body: JSON.stringify({ preview: true }) }))}>{d.jobs?.[0]?.status === 'running' ? `Rendering… ${Math.round((d.jobs[0].progress || 0) * 100)}%` : 'Queue preview render'}</button>
      {!d.renderable && <p className="muted">This episode has no scene graph yet, so it can't be rendered.</p>}
      {d.renders.map((r: any) => <div key={r.id} className={`render ${r.stale ? 'stale' : ''}`}>
        <div className="player"><video controls preload="metadata" src={media(r.file)} poster={media(r.cover)} /></div>
        <div><h3>Render #{r.id} · script v{r.episode_version} {r.stale ? <span className="pill warn">stale</span> : null} <span className={`pill ${r.verdict === 'PASS' ? 'ok' : 'bad'}`}>{r.verdict}</span></h3>
          <p className="small">{r.duration?.toFixed?.(1)} s · {r.character_version} · voice: {r.voice_version} · music: {r.music_license}</p>
          <p className="downloads"><a href={media(r.file)} download>MP4 (music)</a><a href={media(r.file_nomusic)} download>MP4 (no music)</a><a href={media(r.srt)} download>SRT</a><a href={media(r.vtt)} download>VTT</a><a href={media(r.cover)} download>Cover</a></p>
          <QA checks={r.qa?.checks || []} /></div></div>)}
    </section>}
    {tab === 'copy' && <section>{e.caption ? <dl className="copy">{Object.entries(e.caption).map(([k, v]: any) => <React.Fragment key={k}><dt>{k}</dt><dd>{Array.isArray(v) ? v.join(' ') : v}</dd></React.Fragment>)}</dl> : <p className="muted">Caption is generated after the script is approved.</p>}</section>}
    {tab === 'history' && <section><h3>Transitions</h3><ul>{d.transitions.map((t: any) => <li key={t.id}><span className="muted">{t.at.slice(0, 16).replace('T', ' ')}</span> {t.from_state} → <b>{t.to_state}</b> by {t.actor}{t.note ? ` · ${t.note}` : ''}</li>)}</ul><h3>Revisions</h3><ul>{d.revisions.map((r: any) => <li key={r.id}><span className="muted">{r.at.slice(0, 16).replace('T', ' ')}</span> v{r.version} {r.kind} by {r.actor}: {r.detail}</li>)}</ul></section>}
  </>;
}

function ScriptEditor({ e, onSaved }: { e: any; onSaved: () => void }) {
  const [cues, setCues] = useState<any[]>(e.cues); const [msg, setMsg] = useState('');
  const dirty = JSON.stringify(cues) !== JSON.stringify(e.cues);
  if (!e.cues.length) return <p className="muted">No script yet.</p>;
  return <section>
    <p className="muted small">Editing a cue that carries a factual claim resets that claim's technical sign-off. Any narration change re-runs voice, subtitle timing and transcript checks. The tagline cue is locked.</p>
    {cues.map((c, i) => <div key={c.id} className="cue"><label htmlFor={`cue-${c.id}`}>{c.id} · {c.scene}{c.brandLine ? ` · ${c.brandLine}` : ''}{c.claims ? ` · ${c.claims.join(', ')}` : ''}</label>
      <textarea id={`cue-${c.id}`} rows={2} value={c.text} disabled={c.brandLine === 'tagline'} onChange={(x) => setCues(cues.map((y, j) => (j === i ? { ...y, text: x.target.value } : y)))} /><span className="muted small">{c.text.length} chars</span></div>)}
    <button disabled={!dirty} onClick={() => api(`/api/episodes/${e.id}`, { method: 'PATCH', body: JSON.stringify({ cues }) }).then(() => { setMsg('Saved as a new version.'); onSaved(); }).catch((x) => setMsg(x.message))}>Save script</button> {msg && <span>{msg}</span>}
  </section>;
}

function ClaimList({ claims, onChange }: { claims: any[]; onChange: () => void }) {
  const [err, setErr] = useState('');
  const sign = (id: string, decision: string) => api(`/api/claims/${id}/signoff`, { method: 'POST', body: JSON.stringify({ decision }) }).then(onChange).catch((x) => setErr(x.message));
  if (!claims.length) return <p className="muted">No claims extracted yet.</p>;
  return <section>{err && <p className="err">{err}</p>}{claims.map((c) => <article key={c.id} className="claim">
    <header><b>{c.id}</b> <span className="pill">{c.category}</span> <span className={`pill ${c.status === 'verified' ? 'ok' : 'warn'}`}>{c.status}</span> <span className={`pill ${c.technical_signoff === 'approved' ? 'ok' : c.technical_signoff === 'rejected' ? 'bad' : 'warn'}`}>sign-off: {c.technical_signoff}</span>{c.episodeTitle && <span className="muted small"> · {c.episode_id} {c.episodeTitle}</span>}</header>
    <p className="wording">{c.wording}</p><p className="small"><b>Scope:</b> {c.scope}</p><p className="small"><b>Caveats:</b> {c.caveats}</p>
    {c.sources.map((s: any) => <details key={s.id}><summary>Tier {s.tier} · {s.publisher} · {s.title} {s.stale ? <span className="pill bad">stale</span> : <span className="muted small">re-verify by {s.expires_at}</span>}</summary><p className="small"><a href={s.url} target="_blank" rel="noreferrer">{s.url}</a><br />Published {s.published || 'n/a'} · retrieved {s.retrieved} · {s.jurisdiction} · {s.freshness}</p><ul className="small">{s.excerpts.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></details>)}
    {c.signoff_by && <p className="small muted">Signed off by {c.signoff_by} on {c.signoff_at?.slice(0, 10)}</p>}
    <div className="row"><button onClick={() => sign(c.id, 'approved')}>Approve claim</button><button className="ghost" onClick={() => sign(c.id, 'rejected')}>Reject</button></div>
  </article>)}</section>;
}

function QA({ checks }: { checks: any[] }) {
  return <table className="qa"><tbody>{checks.map((c, i) => <tr key={i} className={c.status}><td><span className={`pill ${c.status === 'pass' ? 'ok' : c.status === 'warn' ? 'warn' : 'bad'}`}>{c.status}</span></td><td><b>{c.id}</b><div className="small">{c.detail}</div>{c.fix && <div className="small muted">Fix: {c.fix}</div>}</td></tr>)}</tbody></table>;
}

function FactCheck() {
  const { d, reload } = useLoad<any[]>('/api/claims');
  const s = useLoad<any[]>('/api/sources');
  return <><h1>Fact Check Center</h1><p className="muted">Every objective claim, its Tier-ranked sources and reviewer decisions. Sources past their freshness date block publication until re-verified.</p>
    {d && <ClaimList claims={d} onChange={reload} />}
    <h2>Source register</h2>{s.d && <div className="scroll"><table><thead><tr><th>Tier</th><th>Source</th><th>Retrieved</th><th>Re-verify by</th><th>Policy</th></tr></thead><tbody>{s.d.map((x) => <tr key={x.id}><td className="num">{x.tier}</td><td><a href={x.url} target="_blank" rel="noreferrer">{x.title}</a><div className="small muted">{x.publisher}</div></td><td className="num">{x.retrieved}</td><td className="num">{x.expires_at} {x.stale && <span className="pill bad">stale</span>}</td><td className="small">{x.freshness}</td></tr>)}</tbody></table></div>}</>;
}

function Calendar() {
  const { d } = useLoad<any[]>('/api/episodes?q=');
  if (!d) return <p>Loading…</p>;
  const weeks: Record<number, any[]> = {}; d.forEach((e) => { (weeks[e.week] ||= []).push(e); });
  return <><h1>Content Calendar</h1><p className="muted">Proposed Tuesday/Friday cadence from Week 01 (5 Jan 2027). Dates are proposals until scheduled; reorder freely, canonical IDs never change.</p>
    <div className="cal">{Object.entries(weeks).map(([w, es]) => <div key={w} className="wk"><b>Week {String(w).padStart(2, '0')}</b>{es.map((e) => <a key={e.id} href={`#episode/${e.id}`} className="ce"><span className="small muted">{e.slot.slice(0, 3)} {e.scheduled_date || e.proposed_date}</span><span>{e.id} · {e.title}</span><Pill s={e.status} /></a>)}</div>)}</div></>;
}

function Characters() {
  const { d } = useLoad<any>('/api/characters');
  if (!d) return <p>Loading…</p>;
  return <><h1>Character Studio</h1>
    <section className="locked"><h2>Kuya SoLight v{d.lock.version} <span className="pill ok">{d.lock.status}</span></h2><p>{d.lock.approvalRecord}</p><p className="small">{d.lock.changePolicy}</p>
      <img src={media('out/characters/variants-a/KSL-A1-sheet.png')} alt="Kuya SoLight v1.0 sheet" /></section>
    <h2>Look variations considered</h2><div className="grid">{d.variants.map((v: any) => <figure key={v.id}><img src={media(`out/characters/variants-a/${v.id}-sheet.png`)} alt={v.name} /><figcaption><b>{v.name}</b> {v.id === d.lock.sourceVariant && <span className="pill ok">approved</span>}<br /><span className="small">{v.summary}</span></figcaption></figure>)}</div>
    <h2>Original directions (archive)</h2><div className="grid">{d.options.map((o: any) => <figure key={o.id}><img src={media(`out/characters/${o.id}-sheet.png`)} alt={o.name} /><figcaption><b>{o.name}</b><br /><span className="small">{o.summary}</span></figcaption></figure>)}</div>
    <h2>Supporting characters</h2><p className="muted">Ate Liwanag, Mang Tony, Tech Nico, Boss Marco, Tita May and Wattson are specified in docs/SUPPORTING_CHARACTERS.md and are built in Phase 4 on the same rig.</p></>;
}

function Voice() {
  const { d } = useLoad<any>('/api/brand');
  if (!d) return <p>Loading…</p>;
  return <><h1>Voice & Music Studio</h1>
    <div className="alert">The current narration is a <b>demo voice</b> (open-source Kokoro TTS, English male voice blend with a Tagalog pronunciation layer). It proves timing, lip-sync and subtitles but does not have a Filipino accent. Choose a production voice provider before publishing.</div>
    <h2>Greeting voice variants</h2><div className="grid">{d.voices.map((v: any) => <figure key={v.id}><figcaption><b>{v.id}</b> {d.approvedVoice === v.id && <span className="pill ok">approved</span>}</figcaption>{v.exists ? <audio controls src={media(v.file)} /> : <span className="muted">not rendered</span>}</figure>)}</div>
    <h2>Sonic logo options</h2><div className="grid">{d.sonicAssets.filter((s: any) => !s.assetId.startsWith('bed')).map((s: any) => <figure key={s.assetId}><figcaption><b>{s.assetId}</b> · {s.role} · {s.durationSec}s<br /><span className="small">{s.description}</span></figcaption><audio controls src={media(`assets/audio/sonic/${s.file}`)} /><p className="small muted">{s.license}</p></figure>)}</div>
    <h2>Music bed</h2>{d.sonicAssets.filter((s: any) => s.assetId.startsWith('bed')).map((s: any) => <figure key={s.assetId}><audio controls src={media(`assets/audio/sonic/${s.file}`)} /><p className="small">{s.description}</p></figure>)}
    <h2>Pronunciation settings</h2><p className="small muted">{d.pronunciation.note}</p><table><tbody>{Object.entries(d.pronunciation.locked).map(([w, ipa]: any) => <tr key={w}><td><b>{w}</b></td><td><code>{ipa}</code></td><td><span className="pill">locked</span></td></tr>)}</tbody></table></>;
}

function Renders() {
  const { d, reload } = useLoad<any[]>('/api/jobs');
  useEffect(() => { const t = setInterval(reload, 3000); return () => clearInterval(t); }, [reload]);
  return <><h1>Video Renderer</h1><p className="muted">Background render jobs: SVG scene frames → H.264/AAC 1080×1920 at 30 fps, burned-in subtitles, SRT/VTT export and automatic QA. Start a render from an episode's Renders tab.</p>
    {d && (d.length ? <table><thead><tr><th>#</th><th>Episode</th><th>Kind</th><th>Status</th><th>Progress</th><th>Started</th></tr></thead><tbody>{d.map((j) => <tr key={j.id}><td>{j.id}</td><td><a href={`#episode/${j.episode_id}`}>{j.episode_id}</a></td><td>{j.kind}</td><td><span className={`pill ${j.status === 'done' ? 'ok' : j.status === 'failed' ? 'bad' : 'warn'}`}>{j.status}</span></td><td className="num">{Math.round((j.progress || 0) * 100)}%</td><td className="small">{j.created_at.slice(0, 16)}</td></tr>)}</tbody></table> : <p className="muted">No jobs yet.</p>)}</>;
}

function Analytics() {
  const { d, reload } = useLoad<any[]>('/api/analytics');
  const [f, setF] = useState<any>({ episode_id: 'E002', platform: 'facebook', captured_on: new Date().toISOString().slice(0, 10) }); const [msg, setMsg] = useState('');
  const fields = ['reach', 'plays', 'plays_3s', 'avg_watch_sec', 'completion_rate', 'engagements', 'shares', 'saves', 'comments', 'profile_visits', 'inquiries', 'qualified_leads', 'quote_requests', 'site_visits', 'closed_projects'];
  return <><h1>Analytics & Lead Attribution</h1><p className="muted">Manual import until Meta Graph API access is authorised. No benchmarks are assumed; the first weeks are an evidence-gathering period. Attribution of closed projects to content is approximate.</p>
    <form className="an" onSubmit={(e) => { e.preventDefault(); api('/api/analytics', { method: 'POST', body: JSON.stringify(f) }).then(() => { setMsg('Saved.'); reload(); }).catch((x) => setMsg(x.message)); }}>
      {['episode_id', 'platform', 'captured_on', ...fields].map((k) => <label key={k} htmlFor={`an-${k}`}>{k.replace(/_/g, ' ')}<input id={`an-${k}`} value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>)}
      <button>Add snapshot</button> {msg}
    </form>
    {d && d.length > 0 && <div className="scroll"><table><thead><tr><th>Episode</th><th>Date</th><th>Reach</th><th>Plays</th><th>Completion</th><th>Inquiries</th><th>Qualified leads</th></tr></thead><tbody>{d.map((a) => <tr key={a.id}><td>{a.episode_id} {a.title}</td><td>{a.captured_on}</td><td className="num">{a.reach}</td><td className="num">{a.plays}</td><td className="num">{a.completion_rate}</td><td className="num">{a.inquiries}</td><td className="num">{a.qualified_leads}</td></tr>)}</tbody></table></div>}</>;
}

function Brand() {
  const { d, reload } = useLoad<any>('/api/brand'); const [msg, setMsg] = useState('');
  if (!d) return <p>Loading…</p>;
  const save = (b: any) => api('/api/brand', { method: 'PUT', body: JSON.stringify(b) }).then(() => { setMsg('Saved.'); reload(); }).catch((x) => setMsg(x.message));
  const upload = (file: File) => fetch('/api/brand/logo', { method: 'POST', headers: { 'content-type': file.type }, body: file }).then((r) => r.json()).then((j) => { setMsg(j.error || j.note); reload(); });
  return <><h1>Brand Settings</h1>{msg && <p className="ok-msg">{msg}</p>}
    <section><h2>Official logo</h2>{d.logo ? <><img className="logo" src={media(d.logo)} alt="Master logo" /><p className="small">Uploaded by {d.logoMeta?.uploadedBy} on {d.logoMeta?.at?.slice(0, 10)} · sha256 {d.logoMeta?.sha256?.slice(0, 12)}…</p></> : <div className="alert">Not uploaded. Upload the original master file (SVG preferred, or high-resolution PNG). It is stored unchanged and never redrawn.</div>}
      <label htmlFor="logo">Upload master logo</label><input id="logo" type="file" accept="image/svg+xml,image/png" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /></section>
    <section><h2>Tagline <span className="pill">locked</span></h2><p className="tagline">{d.tagline}</p></section>
    <section><h2>Signature greeting</h2>{Object.entries(d.greetings).map(([k, v]: any) => <label key={k} className="radio" htmlFor={`g-${k}`}><input id={`g-${k}`} type="radio" checked={d.defaultGreeting === k} onChange={() => save({ defaultGreeting: k })} /> {v}</label>)}</section>
    <section><h2>Closing catchphrase</h2>{Object.entries(d.catchphrases).map(([k, v]: any) => <label key={k} className="radio" htmlFor={`c-${k}`}><input id={`c-${k}`} type="radio" checked={d.defaultCatchphrase === k} onChange={() => save({ defaultCatchphrase: k })} /> {v} <span className="muted small">({k === 'close-signature' ? 'signature' : 'educational alternative'})</span></label>)}</section>
    <section><h2>Sonic logo</h2>{d.sonicOptions.map((s: string) => <label key={s} className="radio" htmlFor={`s-${s}`}><input id={`s-${s}`} type="radio" checked={d.approvedSonic === s} onChange={() => save({ approvedSonic: s })} /> {s} <audio controls src={media(`assets/audio/sonic/${s}.wav`)} /></label>)}</section>
    <section><h2>Opening & closing preview</h2>{d.identityDemo ? <div className="player"><video controls preload="metadata" src={media(d.identityDemo)} /></div> : <p className="muted">Render the identity demo with <code>npm run render:identity</code>.</p>}</section>
    <section><h2>Palette <span className="pill warn">{d.paletteStatus}</span></h2><div className="swatches">{Object.entries(d.palette).map(([k, v]: any) => <div key={k}><i style={{ background: v }} /><b>{k}</b><code>{v}</code></div>)}</div></section>
    <section><h2>Safe area & export</h2><p className="small">1080×1920, 9:16, 30 fps, H.264 + AAC. Captions bottom-aligned at y=1400 (520 px clear for the Reels caption/UI), 140 px right margin for action buttons, logo fixed top-left.</p></section></>;
}

createRoot(document.getElementById('root')!).render(<App />);
