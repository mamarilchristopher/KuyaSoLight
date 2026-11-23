# Kuya SoLight Content Studio: implementation checklist

The master spec v1.0 (24 Nov 2026) plus Brand Voice Update V1.1, broken into trackable items.
Status: ✅ done in this pass · 🟡 partial / prototype · ⬜ not started · 🔒 blocked on an owner input or an external service.

## Phase 1: Brand and character prototype
| # | Item | Status | Where |
|---|------|--------|-------|
| 1.1 | Four distinct original Kuya SoLight directions (A–D), not merged | ✅ | `pipeline/characters/styles.ts`, `out/characters/` |
| 1.2 | Per-direction front / ¾ / back views, full and half body | ✅ (side profile spec-only) | `KSL-*-sheet.png` |
| 1.3 | Neutral / smiling / explaining / concerned expressions | ✅ | sheets |
| 1.4 | Two sample frames in the branded layout per direction | ✅ | `KSL-*-frame-*.png` |
| 1.5 | Walk, point, speak pose tests | ✅ | sheets |
| 1.6 | Rigging method + effort / reuse / consistency estimates | ✅ | `options.json`, review page |
| 1.7 | Owner comparison presentation | ✅ | Character Review artifact |
| 1.8 | Owner selection | ✅ A → look A1 (24 Nov 2026) | `assets/characters/kuya-solight/lock.json` |
| 1.9 | Sample narration voice | 🟡 demo voice (no Filipino accent) | `pipeline/audio/tts.py` |
| 1.10 | Two or more original sonic identity options | ✅ 3 options + soft end variants + bed, rights metadata | `assets/audio/sonic/` |
| 1.11 | Brand reference screen + approval mechanism | ✅ | Brand Settings page, `/api/brand` |
| 1.12 | Official logo | 🔒 waiting for the master file. Placeholder shown, upload route built, QA blocks publishing | `/api/brand/logo` |
| 1.13 | Palette extracted from the real logo | 🔒 needs the logo | `pipeline/brand/brand.ts` (proposed) |

## Canonical character bundle (after selection)
| Item | Status |
|------|--------|
| Locked spec, version number and change policy | ✅ v1.0 |
| Character sheet front/¾/back | ✅ · side profile ⬜ |
| 16 expressions | 🟡 4 drawn + 6 mouth shapes; 12 more ⬜ |
| 12 hand gestures | 🟡 open, point, fist, wave; 8 ⬜ |
| 8 body poses | 🟡 idle, explain, point, pointUp, wave, present, walk A/B, concerned (9 rig poses, need art polish) |
| 12 mouth/phoneme shapes | 🟡 6 visemes; 6 more ⬜ |
| Blink, eye direction, brow controls | ✅ rig controls |
| Sitting / presenting / walking loops | 🟡 walk keyframes only |
| Presentation poses (whiteboard, panels, meter, battery) | ⬜ |
| Situational outfits | ⬜ |
| Transparent exports + editable SVG | ✅ SVG from rig (`KSL-*-front.svg`); PNG export via resvg |
| 10-frame consistency test | ⬜ (E002 contact sheet is an informal 12-frame test) |

## Supporting characters (Phase 4)
Ate Liwanag, Mang Tony, Tech Nico, Boss Marco, Tita May, Wattson: specs in `docs/SUPPORTING_CHARACTERS.md` · art ⬜.

## Audio & sonic identity
| Item | Status |
|------|--------|
| 3 sonic options (3-note, 4-note pluck, solar cue) + softer end variants | ✅ |
| Music bed + music/no-music comparison renders | ✅ (`E002.mp4` vs `E002-nomusic.mp4`) |
| Rights/licence metadata per sound asset | ✅ `*.json` beside each WAV |
| Three greeting delivery variants | 🟡 3 demo-voice variants rendered; real voice 🔒 |
| Locked pronunciation for SoLight / SoSmart | ✅ `assets/voice/pronunciation.json` |
| Ducking under narration | ✅ sidechain compression |

## Video art direction & templates
| Item | Status |
|------|--------|
| 1080×1920, 30 fps, H.264 + AAC, faststart | ✅ verified by ffprobe QA |
| Five-scene formula with V1.1 timing | ✅ E002 (hook 3.2 s, greeting ≈2.5 s) |
| Reusable props: house+PV, sun, cloud, moon, grid tower, battery, energy flow, bill, phone, bubbles, bulb, sparkles | ✅ `pipeline/render/props.ts` |
| Commercial building, resort, appliances, aircon, EV, charts, comparison tables, site assessment, installation, safety | ⬜ |
| Template 05 Energy Flow | ✅ (E002) |
| Templates 01–04, 06–08 | ⬜ (share the same frame, caption, brand and QA layers) |
| 3 opening + 3 closing concepts, identity demo | ✅ `out/brand/identity-demo/` |
| Cover/thumbnail | ✅ `E002-cover.png` |

## Subtitles (mandatory)
| Item | Status |
|------|--------|
| Generated from approved narration + measured audio timings (no ASR pass) | ✅ |
| Burned-in (libass), ≤2 lines, gold keywords, safe-area aware | ✅ |
| SRT + VTT export | ✅ |
| Transcript QA: all words + all numbers must match; number mismatch blocks | ✅ + unit tests |
| Locked brand lines must be verbatim | ✅ |
| Reading-speed and line-layout checks | ✅ |

## Fact-checking
| Item | Status |
|------|--------|
| Source / Claim records with tier, URL, dates, jurisdiction, excerpts | ✅ |
| E002 claims verified against Tier-1 sources (Meralco, DOE) | ✅ (one claim "verified-with-conditions") |
| Technical reviewer sign-off | 🔒 pending: needs a qualified reviewer |
| Freshness policy + expiry dates, stale sources block publishing | ✅ |
| Claim extraction assistant for new episodes | ⬜ (needs an LLM API key) |

## Production web app
| Item | Status |
|------|--------|
| Persistent data model (episodes, claims, sources, renders, jobs, approvals, revisions, analytics) | ✅ SQLite (`server/db.ts`), Postgres-portable |
| 104-episode backlog seeded verbatim | ✅ |
| 15-state workflow with gates, rejections and revision history | ✅ `server/workflow.ts` + tests |
| Edit invalidation (claim/number edits reset sign-off; narration edits re-run voice/subtitles; renders go stale) | ✅ |
| Roles: owner, producer, reviewer, editor, publisher (server-side checks) | ✅ |
| Dashboard, Library, Calendar, Fact Check, Character Studio, Voice & Music, Renderer queue, Archive, Analytics, Brand Settings | ✅ |
| Script Studio (edit + versioning) | ✅ manual; AI generator ⬜ (needs an LLM key) |
| Storyboard editor | 🟡 read-only cue/scene table; scenes are code |
| Background render jobs with progress/failure | ✅ |
| Greeting/catchphrase selectors, locked tagline, sonic choice, logo upload | ✅ |
| Caption, hashtags, pinned comment, discussion question | ✅ E002 |
| Meta publishing integration | 🔒 needs Meta app review + page tokens; manual upload pack meanwhile |
| SDES estimate import | ⬜ needs SDES API details |
| Low-inventory alerts | ✅ |
| Deployment (auth, HTTPS, private object storage) | ⬜ |

## Phase gates
- Phase 1: ✅ except the real voice and the logo.
- Phase 2 (one complete verified episode): 🟡 E002 is a real playable MP4 with exact subtitles, original music and QA. QA correctly **blocks** it until: logo upload, production voice, technical sign-off, owner approval.
- Phase 3 (functional studio): ✅ first version.
- Phase 4–5: ⬜
