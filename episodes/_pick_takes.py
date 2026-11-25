"""Pick the steadiest ElevenLabs take per body cue (owner flagged uneven intonation, 2026-11-24).
Needs out/episodes/<ID>/tts-job.json (run cli with TTS_ONLY=1 first). Writes episodes/<ID>/seeds.json.
Score: longest internal pause (s) + penalty when pace is outside 12-17.5 chars/s. Base seed 4242 kept if already fine."""
import sys, json, os, numpy as np
sys.path.insert(0, 'pipeline/audio'); import tts
eid = sys.argv[1]
job = json.load(open(f'out/episodes/{eid}/tts-job.json')); v = job['voice']; cues = job['cues']
texts = [c.get('say', c['text']) for c in cues]
def stats(a, sr):
    w = int(0.02 * sr); db = 20 * np.log10(np.array([np.sqrt((a[i:i+w]**2).mean() + 1e-12) for i in range(0, len(a) - w, w)]))
    on = np.where(db > db.max() - 24)[0]; seg = db[on[0]:on[-1] + 1]; run = m = 0
    for x in seg < db.max() - 30: run = run + 1 if x else 0; m = max(m, run)
    return (on[-1] - on[0]) * 0.02, m * 0.02
seeds = {}
for i, c in enumerate(cues):
    if c.get('standalone') or c.get('audioFile'): continue
    best = None
    for seed in [4242, 7, 101, 2024, 555, 9001]:
        ov = dict(c.get('elSettings') or {}); ov['seed'] = seed
        a, sr = tts.el_synth(v, texts[i], c.get('elSpeed', v.get('speed', 1)), texts[i-1] if i else '', texts[i+1] if i + 1 < len(texts) else '', ov)
        d, g = stats(a, sr); cps = len(c['text']) / d
        sc = g + max(0, 12 - cps) * 0.15 + max(0, cps - 17.5) * 0.15
        if best is None or sc < best[0] - 0.02: best = (sc, seed, round(g, 2), round(cps, 1))
        if seed == 4242 and sc <= 0.5: break
    print(eid, c['id'], 'seed', best[1], 'gap', best[2], 'cps', best[3])
    if best[1] != 4242: seeds[c['id']] = best[1]
json.dump(seeds, open(f'episodes/{eid}/seeds.json', 'w'), indent=1)
