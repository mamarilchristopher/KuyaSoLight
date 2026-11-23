# What's still needed for a production-ready release

Checked 23–24 Nov 2026. Prices come from the vendors' pages where they loaded. Re-confirm before buying.

## 1. Owner inputs (blocking)
| Input | Why it blocks | How |
|---|---|---|
| **Master SoLight Solar PH logo** (SVG preferred, or a large PNG) | QA check `LOGO-OFFICIAL` fails every render; colours can't be finalised | Brand Settings → Upload, or drop it in the project files |
| **Production voice choice** | `VOICE-APPROVED` fails; the demo voice has no Filipino accent | Pick an option in §2, then a delivery variant (V1 warm / V2 bright / V3 steady) |
| **Sonic logo choice** (1 Klaro Rise, 2 SoSmart Spark, 3 Solar Shimmer) | Identity demo QA `SONIC-APPROVED` | Brand Settings |
| **Technical reviewer** | Every claim needs sign-off before a script is approved (spec §8, §16) | Name a qualified person (e.g. a licensed electrical engineer or senior designer) and give them the reviewer role |
| **Owner approval per episode** | Final gate before Ready to Publish | Episode page → Record owner approval |
| Approved contact info for CTAs | Quote-related CTAs need the current sales workflow | Send page/Messenger/phone details |

## 2. Voice (largest open item)
The pipeline already uses a provider interface: cue-by-cue synthesis, then measured timings, lip-sync and subtitles. Swapping the engine only changes `pipeline/audio/tts.py`.

| Option | Fit | Cost (as published) | Notes |
|---|---|---|---|
| **Hire a Filipino male voice actor** + designed character voice | Best accent and warmth; you own the recordings | Quote-based | Records per-cue lines; the pipeline reads timings from the WAVs. Fixed signature lines can be recorded once and reused |
| **ElevenLabs** (Voice Design for an original voice, or a Professional Voice Clone of a consenting, contracted voice actor) | Good Taglish with an original voice | Starter $6/mo · Creator $22/mo (121k credits) · Pro $99/mo (third-party summary, Sept 2026). Paid plans include commercial rights; Free is non-commercial | ~600 chars per episode means 104 episodes ≈ 65k credits per year, so Creator covers it with room for retakes |
| **Azure AI Speech** `fil-PH-AngeloNeural` (prebuilt Filipino male) | Real Filipino accent, cheap, consistent, SSML pronunciation lexicon | Free tier 0.5M chars/month (covers this volume). Paid per-1M-char price didn't load; check the Azure calculator | Stock voice, so less distinctive. A Custom Neural Voice needs Microsoft approval |
| Kokoro (current demo) | Free, local, Apache-2.0 | $0 | No Filipino voice. Keep it only for drafts |

Needed from you: pick one, then give me an API key (stored server-side as an environment variable) or the recordings.

## 3. Other services and approvals
| Item | Status | Cost / approval |
|---|---|---|
| Video rendering | Built in-house (SVG → resvg → FFmpeg). **No Remotion licence needed** | $0. (Remotion would be free for ≤3 people, $25/seat/mo for Creators or $0.01/render for Automators above that) |
| Image generation for richer art | Not used; all art is original vector code | Optional |
| LLM for script and claim drafts in-app | Not wired | Needs an Anthropic API key and a monthly budget; drafts still go through review gates |
| Hosting | Runs locally (`npm start`) | Small VPS or managed Node host + Postgres + private object storage (e.g. S3/R2) for masters. Roughly $10–40/mo depending on provider |
| GitHub repository | Code is in a local git repo in this workspace | Create an empty repo (e.g. `solight/kuya-solight-studio`) and tell me the name; I'll push |
| Meta publishing | Manual upload pack (MP4, cover, caption, hashtags, SRT) | Auto-posting needs a Meta app, Page/IG business account linking and app review for `pages_manage_posts` / `instagram_content_publish` |
| Analytics import | Manual form | Meta Graph API insights need the same app access |
| SDES estimate import | Not built | Need SDES export format/API; studio will only read approved public fields |
| Music clearance | Original procedural compositions, metadata recorded | Optional: have a musician listen for accidental similarity before locking the sonic logo |
| Fixed per-customer charge on the Meralco bill | Not named in E002 (generic "bill charges" only) | Reviewer should confirm the residential per-customer charge (likely metering) in the Nov 2026 rate PDF before any episode names it |

## 4. Next build steps (proposed order)
1. Swap in the chosen production voice and re-render E002 → owner review.
2. Logo in → palette extracted → re-render.
3. Complete the KSL v1.0 bundle (side profile, 16 expressions, 12 gestures, presenting poses, 10-frame consistency test).
4. Templates 01, 02, 03, 07 + props for appliances, aircon, battery runtime, comparison tables.
5. Research + scripts for E001, E003–E012 (12-episode researched bank, 8 approved scripts).
6. Supporting characters (Mang Tony and Ate Liwanag first).
7. Deploy with HTTPS, Postgres and object storage; then Meta integration if wanted.
