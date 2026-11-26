"""Re-master an already rendered episode's audio without regenerating any voice.

Inputs: the episode's -nomusic.mp4 (narration + stings, already mixed and limited)
and its final .mp4 (video with burned subtitles). The voice/sting track is
de-hissed (denoise.py), the music bed is re-mixed exactly like compose.finalize
(-21 dB, side-chain ducked under the voice, 1.2 s fade-out, limiter at -1 dBFS)
and the result is muxed onto the untouched video stream (copied, not re-encoded).

usage: remaster.py NOMUSIC.mp4 VIDEO.mp4 OUT.mp4 [OUT-nomusic.mp4] [--no-denoise]
"""
import os, subprocess, sys, tempfile, json
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(__file__))
from denoise import denoise, noise_profile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BED = os.path.join(ROOT, 'assets/audio/sonic/bed-c-major-100bpm.wav')
BED_DB = -21


def run(*a):
    subprocess.run(a, check=True)


def duration(f):
    p = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', f], capture_output=True, text=True, check=True)
    return float(json.loads(p.stdout)['format']['duration'])


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    nomusic, video, out = args[:3]
    out_nm = args[3] if len(args) > 3 else None
    dn = '--no-denoise' not in sys.argv
    dur = duration(video); lag = 0
    with tempfile.TemporaryDirectory() as td:
        raw = os.path.join(td, 'voice.wav'); clean = os.path.join(td, 'clean.wav')
        run('ffmpeg', '-v', 'error', '-y', '-i', nomusic, '-vn', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_f32le', raw)
        y, sr = sf.read(raw, dtype='float32')
        # align the voice track to the final mix (codec delay); the limiter look-ahead (5 ms = 240 samples) is trimmed after mixing
        ref = os.path.join(td, 'ref.wav')
        run('ffmpeg', '-v', 'error', '-y', '-i', video, '-vn', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_f32le', ref)
        r, _ = sf.read(ref, dtype='float32')
        from scipy.signal import correlate
        A, B = r[sr:sr * 8, 0], y[sr:sr * 8, 0]
        lag = int(np.argmax(correlate(A, B, mode='full', method='fft')) - (len(B) - 1))
        if lag < 0: y = y[-lag:]
        elif lag > 0: y = np.concatenate([np.zeros((lag, 2), np.float32), y])
        if dn:
            prof = noise_profile(y.mean(1), sr)
            y = np.stack([denoise(y[:, c], sr, prof) for c in range(2)], 1)
        sf.write(clean, y, sr, subtype='FLOAT')
        fc = (f'[1:a]asplit=2[nar][key];'
              f'[2:a]aresample=48000,aformat=channel_layouts=stereo,volume={BED_DB}dB,adelay=240S|240S,atrim=0:{dur},afade=t=out:st={max(0, dur - 1.2)}:d=1.2[bedraw];'
              f'[bedraw][key]sidechaincompress=threshold=0.02:ratio=6:attack=20:release=350[bed];'
              f'[nar][bed]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.89:level=false,atrim=start_sample=240,asetpts=PTS-STARTPTS,apad,atrim=0:{dur}[aout]')
        enc = ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-t', str(dur)]
        run('ffmpeg', '-v', 'error', '-y', '-i', video, '-i', clean, '-stream_loop', '-1', '-i', BED, '-filter_complex', fc,
            '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', *enc, out)
        if out_nm:
            run('ffmpeg', '-v', 'error', '-y', '-i', nomusic, '-i', clean, '-filter_complex', f'[1:a]alimiter=limit=0.89:level=false,atrim=start_sample=240,asetpts=PTS-STARTPTS,apad,atrim=0:{dur}[aout]',
                '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', *enc, out_nm)
    print(out, 'lag', lag)


if __name__ == '__main__':
    main()
