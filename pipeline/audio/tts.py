"""Narration synthesis with exact per-cue timings.

PRODUCTION ENGINE: ElevenLabs (voice.engine == "elevenlabs"). Each cue is requested
separately from the ElevenLabs text-to-speech API, with the neighbouring cue text sent as
previous_text / next_text so the delivery flows like one take. The API key is never read
here: the cloud environment's proxy injects the xi-api-key header for api.elevenlabs.io
(set ELEVENLABS_API_KEY to send it yourself when running elsewhere). Responses are cached
in .cache/elevenlabs/ by a hash of the request, so re-renders do not spend credits again.

DEMO ENGINE: Kokoro-82M (Apache-2.0, runs locally, commercial use permitted by the model
licence). It has NO Filipino voice; Tagalog words are phonemised by the rule-based G2P
below and English words by espeak-ng en-us, then fed to an English male voice blend. The
result is a working pipeline demo, NOT the final Kuya SoLight voice (accent is not
Filipino). Swap the engine via the TTSProvider interface in server/services/tts.ts.

Each cue is synthesised separately, so subtitle timings come from the actual audio
(cue start/end = sample positions), never from a second transcription pass.

Usage: python3 tts.py job.json out_dir
"""
import json, os, re, sys, unicodedata
import numpy as np, soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL = os.path.join(ROOT, '.models', 'kokoro-v1.0.int8.onnx')
VOICES = os.path.join(ROOT, '.models', 'voices-v1.0.bin')
LEXICON = os.path.join(ROOT, 'assets', 'voice', 'pronunciation.json')

_EN = None
def _en():
    global _EN
    if _EN is None:
        import espeakng_loader
        from phonemizer.backend.espeak.wrapper import EspeakWrapper
        EspeakWrapper.set_library(espeakng_loader.get_library_path())
        EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
        from phonemizer.backend import EspeakBackend
        _EN = EspeakBackend('en-us', preserve_punctuation=False, with_stress=True)
    return _EN

lex = json.load(open(LEXICON, encoding='utf-8'))
LOCKED = {k.lower(): v for k, v in lex['locked'].items()}       # brand words: fixed IPA
ENGLISH = set(w.lower() for w in lex['english'])                 # words read with English G2P
TL_STRESS = {k.lower(): v for k, v in lex.get('tagalogStress', {}).items()}  # 1-based syllable index from end

VOW = 'aeiou'
FUNCTION = {'ang', 'ka', 'na', 'pa', 'sa', 'ni', 'at', 'o', 'din', 'rin', 'mo', 'kang', 'ring', 'ay', 'si', 'ko', 'ba', 'po', 'yung', 'nang'}
TL_MAP = {'a': 'a', 'e': 'ɛ', 'i': 'i', 'o': 'o', 'u': 'u', 'b': 'b', 'd': 'd', 'g': 'ɡ', 'h': 'h', 'k': 'k', 'l': 'l', 'm': 'm',
          'n': 'n', 'p': 'p', 'r': 'ɾ', 's': 's', 't': 't', 'w': 'w', 'y': 'j', 'ŋ': 'ŋ', 'c': 'k', 'f': 'f', 'j': 'dʒ', 'v': 'b', 'z': 's', 'q': 'k', 'x': 'ks', "'": ''}

def tl_g2p(word):
    w = word.lower()
    if w == 'ng': return 'naŋ'
    if w == 'mga': return 'maŋˈa'
    w = w.replace('ng', 'ŋ').replace("’", "'")
    letters = [c for c in w if c.isalpha() or c == 'ŋ']
    vidx = [i for i, c in enumerate(letters) if c in VOW]
    if not vidx or w in FUNCTION: return ''.join(TL_MAP.get(c, '') for c in letters)
    from_end = TL_STRESS.get(word.lower(), 2 if len(vidx) > 1 else 1)
    sv = vidx[max(0, len(vidx) - from_end)]
    onset = sv - 1 if sv > 0 and letters[sv - 1] not in VOW else sv
    out = ''
    for i, c in enumerate(letters):
        if i == onset: out += 'ˈ'
        out += TL_MAP.get(c, '')
    return out

def word_ipa(tok):
    k = tok.lower().strip("'’")
    if k in LOCKED: return LOCKED[k]
    if k in ENGLISH or not re.fullmatch(r"[a-zñ'’-]+", k): return _en().phonemize([tok])[0].strip()
    return tl_g2p(k)

def to_phonemes(text):
    text = unicodedata.normalize('NFC', text).replace('…', ', ')
    parts = re.findall(r"[\wñÑ'’]+(?:-[\wñÑ'’]+)*|[,.!?;:]", text)
    out = []
    for p in parts:
        if re.fullmatch(r'[,.!?;:]', p):
            if out: out[-1] += p
            continue
        if p.lower() in LOCKED or p.lower() in ENGLISH:
            out.append(word_ipa(p)); continue
        out.append(''.join(word_ipa(s) for s in p.split('-')))
    return ' '.join(out)

EL_API = 'https://api.elevenlabs.io/v1/text-to-speech/'
EL_CACHE = os.path.join(ROOT, '.cache', 'elevenlabs')
EL_SR = 44100

def el_alias(v, text):
    """Spoken respellings for brand words (subtitles keep the written form), e.g. SoSmart -> So Smart."""
    for k, rep in (v.get('aliases') or {}).items():
        text = re.sub(r'(?<![A-Za-z])' + re.escape(k) + r'(?![a-z])', rep, text)
    return text

def el_synth(v, text, speed, prev_text, next_text):
    """One ElevenLabs request -> float32 mono at EL_SR. Cached by request hash."""
    import hashlib, subprocess, urllib.request
    text, prev_text, next_text = el_alias(v, text), el_alias(v, prev_text), el_alias(v, next_text)
    settings = dict(v.get('settings', {}))
    settings['speed'] = round(min(1.2, max(0.7, speed)), 3)
    body = {'text': text, 'model_id': v.get('model', 'eleven_multilingual_v2'), 'voice_settings': settings}
    if prev_text: body['previous_text'] = prev_text
    if next_text: body['next_text'] = next_text
    if v.get('languageCode'): body['language_code'] = v['languageCode']
    seed = v.get('seed')
    if seed is not None: body['seed'] = seed
    key = hashlib.sha256(json.dumps([v['voiceId'], body], sort_keys=True).encode()).hexdigest()[:24]
    os.makedirs(EL_CACHE, exist_ok=True)
    mp3 = os.path.join(EL_CACHE, key + '.mp3')
    if not os.path.exists(mp3):
        req = urllib.request.Request(EL_API + v['voiceId'] + '?output_format=mp3_44100_128', data=json.dumps(body).encode(),
                                     headers={'Content-Type': 'application/json', 'Accept': 'audio/mpeg',
                                              **({'xi-api-key': os.environ['ELEVENLABS_API_KEY']} if os.environ.get('ELEVENLABS_API_KEY') else {})})
        try:
            with urllib.request.urlopen(req, timeout=120) as r: data = r.read()
        except urllib.error.HTTPError as e:
            raise SystemExit(f'ElevenLabs HTTP {e.code}: {e.read()[:400]!r}')
        open(mp3 + '.tmp', 'wb').write(data); os.replace(mp3 + '.tmp', mp3)
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-f', 'f32le', '-ac', '1', '-ar', str(EL_SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(pcm, dtype=np.float32).copy(), EL_SR

def main(job_path, out_dir):
    job = json.load(open(job_path, encoding='utf-8'))
    os.makedirs(out_dir, exist_ok=True)
    v = job['voice']
    eleven = v.get('engine') == 'elevenlabs'
    speed = v.get('speed', 1.0)
    if eleven:
        sr = EL_SR
        texts = [c['say'] if 'say' in c else c['text'] for c in job['cues']]
    else:
        from kokoro_onnx import Kokoro
        k = Kokoro(MODEL, VOICES)
        style = sum(k.get_voice_style(n) * w for n, w in v['blend']) / sum(w for _, w in v['blend'])
        sr = 24000
    lead = float(job.get('leadIn', 0.0))
    audio = [np.zeros(int(lead * sr), dtype=np.float32)]
    t = lead
    cues = []
    for i, c in enumerate(job['cues']):
        if eleven:
            ph = None
            ctx = not c.get('standalone')  # standalone cues reproduce an approved take exactly (no neighbour context)
            a, sr = el_synth(v, texts[i], c.get('elSpeed', speed), ' '.join(texts[max(0, i - 2):i]) if ctx else '', ' '.join(texts[i + 1:i + 3]) if ctx else '')
        else:
            ph = to_phonemes(c['say'] if 'say' in c else c['text'])
            a, sr = k.create(ph, voice=style, speed=c.get('speed', speed), is_phonemes=True)
        a = a.astype(np.float32)
        # trim leading/trailing near-silence so cue boundaries hug the speech
        if eleven:
            # recorded-style voice with a noise floor (~-35 dB) and trailing breaths/clicks: trim on 20 ms RMS
            # windows that stay within 24 dB of the loudest for 60 ms (a 3-window running minimum drops clicks)
            w = int(0.02 * sr); nw = len(a) // w
            if nw >= 3:
                r = np.sqrt(np.mean(a[:nw * w].reshape(nw, w) ** 2, axis=1) + 1e-12)
                r = np.minimum(np.minimum(r, np.roll(r, 1)), np.roll(r, -1)); r[0] = r[-1] = 0
                on = np.where(r > r.max() * 10 ** (-24 / 20))[0]
                if len(on): a = a[max(0, (on[0] - 1) * w - int(0.03 * sr)): min(len(a), (on[-1] + 2) * w + int(0.10 * sr))]
        else:
            thr = 0.01 * np.max(np.abs(a))
            nz = np.where(np.abs(a) > thr)[0]
            if len(nz): a = a[max(0, nz[0] - int(0.02 * sr)): nz[-1] + int(0.05 * sr)]
        start = t; dur = len(a) / sr
        cues.append({'id': c['id'], 'text': c['text'], 'start': round(start, 3), 'end': round(start + dur, 3), **({'phonemes': ph} if ph else {})})
        audio.append(a); t += dur
        gap = c.get('pauseAfter', 0.12)
        audio.append(np.zeros(int(gap * sr), dtype=np.float32)); t += gap
    tail = float(job.get('tail', 0.6))
    audio.append(np.zeros(int(tail * sr), dtype=np.float32))
    y = np.concatenate(audio)
    y = y / (np.max(np.abs(y)) + 1e-9) * 0.89  # -1 dBFS peak
    sf.write(os.path.join(out_dir, 'narration.wav'), y, sr)
    fps = job.get('fps', 30)
    hop = sr / fps
    n = int(len(y) / hop)
    rms = np.array([np.sqrt(np.mean(y[int(i * hop): int((i + 1) * hop)] ** 2) + 1e-12) for i in range(n)])
    rms = rms / (np.percentile(rms[rms > 0.005], 95) if np.any(rms > 0.005) else 1)
    json.dump({'engine': f"elevenlabs {v.get('model', 'eleven_multilingual_v2')} ({v.get('name', v['voiceId'])})" if eleven else 'kokoro-82m-int8 (demo)', 'voice': v, 'sampleRate': sr, 'duration': round(len(y) / sr, 3), 'fps': fps,
               'cues': cues, 'mouth': [round(float(min(1.0, x)), 3) for x in rms]}, open(os.path.join(out_dir, 'timings.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps({'duration': round(len(y) / sr, 3), 'cues': len(cues)}))

if __name__ == '__main__':
    if sys.argv[1] == '--phonemes':
        print(to_phonemes(' '.join(sys.argv[2:])))
    else:
        main(sys.argv[1], sys.argv[2])
