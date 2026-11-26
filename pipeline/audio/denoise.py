"""Hiss removal for the narration track.

The production ElevenLabs voice ("Juan") is a recorded-style voice with a steady
broadband noise floor around -50 dBFS (strongest 1-6 kHz). Between cues the
pipeline inserts digital silence, so that floor switches on and off with every
line and is heard as background static. We learn the hiss spectrum from the
quiet frames (pauses between words) and remove it with stationary spectral
gating, then softly expand anything left in the pauses.
"""
import sys
import numpy as np

FRAME = 0.02  # s


def _frames_db(y, sr):
    w = int(FRAME * sr); n = len(y) // w
    r = np.sqrt(np.mean(y[:n * w].reshape(n, w) ** 2, axis=1) + 1e-12)
    return 20 * np.log10(r), w


def noise_profile(y, sr, lo_db=-68.0, hi_db=-40.0):
    """Concatenate frames that sit in the hiss band (not digital silence, not speech)."""
    db, w = _frames_db(y, sr)
    peak = 20 * np.log10(np.max(np.abs(y)) + 1e-12)
    idx = np.where((db > peak + lo_db) & (db < peak + hi_db))[0]
    if len(idx) * FRAME < 0.3:
        return None
    return np.concatenate([y[i * w:(i + 1) * w] for i in idx])


def denoise(y, sr, noise=None, strength=1.0):
    import noisereduce as nr
    y = np.asarray(y, dtype=np.float32)
    if noise is None:
        noise = noise_profile(y, sr)
    if noise is None:
        return y
    out = nr.reduce_noise(y=y, sr=sr, y_noise=noise, stationary=True, prop_decrease=strength,
                          n_std_thresh_stationary=2.0, n_fft=1024, freq_mask_smooth_hz=300, time_mask_smooth_ms=40)
    return out.astype(np.float32)




def denoise_mix(y, sr, split_hz=1200.0):
    """De-hiss a finished mix (voice + music bed) when no voice-only track exists.

    The C-major bed has almost no energy above ~1.2 kHz while the hiss lives at
    1-10 kHz, so only the band above split_hz is cleaned. low + high == y exactly
    (zero-phase split), so the music below the split is untouched.
    """
    from scipy.signal import butter, sosfiltfilt
    y = np.asarray(y, dtype=np.float32)
    low = sosfiltfilt(butter(4, split_hz, 'low', fs=sr, output='sos'), y).astype(np.float32)
    high = y - low
    prof = noise_profile(high, sr, lo_db=-60.0, hi_db=-28.0)
    return low + denoise(high, sr, prof)


if __name__ == '__main__':
    # usage: denoise.py IN.wav OUT.wav [--mix]   (--mix: finished mix with music, clean only above 1.2 kHz)
    import soundfile as sf
    y, sr = sf.read(sys.argv[1], dtype='float32')
    ch = [y] if y.ndim == 1 else [y[:, c] for c in range(y.shape[1])]
    if '--mix' in sys.argv:
        z = [denoise_mix(c, sr) for c in ch]
    else:
        prof = noise_profile(np.mean(ch, 0), sr)
        z = [denoise(c, sr, prof) for c in ch]
    sf.write(sys.argv[2], z[0] if len(z) == 1 else np.stack(z, 1), sr, subtype='FLOAT')
