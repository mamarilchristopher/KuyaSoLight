# Kuya SoLight Content Studio

Production pipeline and content-management app for **SoLight Solar PH**'s educational reel series *Kuya SoLight* (Facebook/Instagram Reels, 104 episodes per year).

> Life is SoLight with Solar.

## What works today
- **Character**: Kuya SoLight v1.0 (Direction A, look A1, owner-approved 24 Nov 2026) on a code-driven 2D rig with visemes, blinks, gaze and limb angles. The four original directions and five A looks are archived in `out/characters/`.
- **Video pipeline**: SVG scenes rendered with resvg and encoded by FFmpeg to **1080×1920, 30 fps, H.264/AAC**. Narration is synthesised cue by cue, so the subtitle timings are measured, not guessed. Subtitles are burned in with libass and exported as SRT and VTT. The original sonic logo and a ducked music bed are mixed in, with a no-music version alongside. Every render gets a cover image, a contact sheet and a machine-readable QA report.
- **E002** "Bakit May Bill Pa Rin Kahit May Solar?" is a full prototype episode (`out/episodes/E002/`) with Tier-1 sources (Meralco, DOE).
- **Brand identity demo**: 3 opening and 3 closing concepts, each with its own sonic option (`out/brand/identity-demo/`).
- **Studio app**: dashboard, 104-episode library, calendar, fact-check centre, character studio, voice and music, render queue, archive, analytics, and brand settings with a locked tagline and logo upload. Includes a 15-state approval workflow with server-side role checks, edit invalidation and revision history.

## Run it
```bash
npm install
pip install kokoro-onnx soundfile noisereduce scipy   # TTS + hiss removal (noisereduce)
# demo voice model (Apache-2.0):
mkdir -p .models && cd .models && \
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.int8.onnx && \
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin && cd ..
npm run sonic            # generate sonic logos + bed
npm run characters       # concept sheets
npm run render:e002      # E002 MP4 + SRT/VTT + QA
npm run render:identity  # opening/closing concepts demo
npm run build            # web UI
OWNER_PASSWORD=choose-one npm start   # http://localhost:8787  (owner@solight.local)
npm test                 # workflow + subtitle QA tests
```
Requires Node 22+, Python 3.11+, FFmpeg with libass, and the Inter font.

## Layout
```
server/            API (Express), SQLite store, workflow state machine, seed
web/               React UI (Vite)
pipeline/brand     brand constants, safe area, logo resolution
pipeline/characters rig + four directions + A looks + sheet renderers
pipeline/audio     sonic.py (original music), tts.py (narration + timings)
pipeline/render    props, frame layout, scenes/, subtitles + QA, compose (FFmpeg)
episodes/E002      episode record: cues, claims, sources, caption
assets/            locked character spec, pronunciation lexicon, sonic WAVs + licences
data/episodes.json 104-episode calendar (verbatim from spec §10)
docs/              implementation checklist, remaining requirements, supporting characters
```

## Non-negotiables enforced in code
- The master logo is never drawn. It's a placeholder until uploaded, and QA blocks publishing until then.
- The tagline can't be edited (API returns 422; the subtitle QA requires it verbatim).
- A number mismatch between narration and subtitles blocks publishing.
- Editing a claim-bearing or numeric line resets technical sign-off. Any narration edit re-runs the voice and subtitle steps and marks old renders as stale.
- Stages can't be skipped. Rejections can only go back to the allowed earlier stages.
