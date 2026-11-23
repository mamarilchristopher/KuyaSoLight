// Persistent store: SQLite via node:sqlite (single file, zero native deps).
// Swap for PostgreSQL in production; the schema below maps 1:1.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';

mkdirSync('data', { recursive: true });
export const db = new DatabaseSync(process.env.STUDIO_DB || 'data/studio.db');
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, name TEXT, roles TEXT NOT NULL, pass_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), expires INTEGER);
CREATE TABLE IF NOT EXISTS episodes (
  id TEXT PRIMARY KEY, week INTEGER, quarter TEXT, quarter_theme TEXT, title TEXT NOT NULL, angle TEXT, pillar TEXT, slot TEXT,
  proposed_date TEXT, scheduled_date TEXT, published_date TEXT, published_url TEXT,
  status TEXT NOT NULL DEFAULT 'IDEA', version INTEGER NOT NULL DEFAULT 1,
  premise TEXT, audience TEXT, template TEXT, hooks TEXT, chosen_hook INTEGER, cues TEXT, caption TEXT,
  greeting_id TEXT DEFAULT 'greet-default', catchphrase_id TEXT DEFAULT 'close-signature',
  character_version TEXT, requires_real_project INTEGER DEFAULT 0, owner_approved_version INTEGER, tags TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS revisions (id INTEGER PRIMARY KEY AUTOINCREMENT, episode_id TEXT, version INTEGER, actor TEXT, at TEXT, kind TEXT, detail TEXT);
CREATE TABLE IF NOT EXISTS transitions (id INTEGER PRIMARY KEY AUTOINCREMENT, episode_id TEXT, from_state TEXT, to_state TEXT, actor TEXT, at TEXT, note TEXT);
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY, tier INTEGER, publisher TEXT, title TEXT, url TEXT, published TEXT, retrieved TEXT, jurisdiction TEXT,
  product_model TEXT, freshness TEXT, expires_at TEXT, excerpts TEXT, notes TEXT
);
CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY, episode_id TEXT REFERENCES episodes(id), wording TEXT, category TEXT, scope TEXT, caveats TEXT,
  status TEXT DEFAULT 'unverified', verified_by TEXT, verified_at TEXT,
  technical_signoff TEXT DEFAULT 'pending', signoff_by TEXT, signoff_at TEXT, signoff_note TEXT
);
CREATE TABLE IF NOT EXISTS claim_sources (claim_id TEXT REFERENCES claims(id), source_id TEXT REFERENCES sources(id), PRIMARY KEY (claim_id, source_id));
CREATE TABLE IF NOT EXISTS renders (
  id INTEGER PRIMARY KEY AUTOINCREMENT, episode_id TEXT, episode_version INTEGER, file TEXT, file_nomusic TEXT, srt TEXT, vtt TEXT, cover TEXT, contact TEXT,
  qa TEXT, verdict TEXT, duration REAL, character_version TEXT, voice_version TEXT, template_version TEXT, music_license TEXT, created_at TEXT, stale INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY AUTOINCREMENT, episode_id TEXT, kind TEXT, status TEXT, progress REAL, log TEXT, created_at TEXT, finished_at TEXT, actor TEXT);
CREATE TABLE IF NOT EXISTS approvals (id INTEGER PRIMARY KEY AUTOINCREMENT, episode_id TEXT, kind TEXT, actor TEXT, at TEXT, version INTEGER, note TEXT);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT, episode_id TEXT, platform TEXT, captured_on TEXT, reach INTEGER, plays INTEGER, plays_3s INTEGER,
  avg_watch_sec REAL, completion_rate REAL, engagements INTEGER, shares INTEGER, saves INTEGER, comments INTEGER, profile_visits INTEGER,
  inquiries INTEGER, qualified_leads INTEGER, quote_requests INTEGER, site_visits INTEGER, closed_projects INTEGER, notes TEXT
);
`);

export const now = () => new Date().toISOString();
export const J = <T = any>(s: any, d: T): T => { try { return s == null ? d : JSON.parse(s); } catch { return d; } };
export function getSetting<T>(key: string, d: T): T { const r = db.prepare('SELECT value FROM settings WHERE key=?').get(key) as any; return r ? J(r.value, d) : d; }
export function setSetting(key: string, v: unknown) { db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, JSON.stringify(v)); }
