# 宣伝動画の冒頭用の効果音（numpy の数式だけで作る。素材・AI は使わない → 商用・表記不要）
#   python3 store-assets/_tools/promo_sfx.py <出力dir>
#   open_shimmer.wav … エンブレムが出る時のきらきら（E メジャー。「誕生」と同じ調）
#   title_swell.wav  … タイトルへ向かって盛り上がる「すーっ」（最後の 1.30 秒がピーク）
#   title_bloom.wav  … タイトルが出た瞬間の「ふわっ」（和音のベル＋低い音）
import os, sys, wave
import numpy as np

SR = 48000
rng = np.random.default_rng(20261017)

def t_(d): return np.arange(int(SR * d)) / SR

def bell(f, d, decay, bright=0.35):
  t = t_(d); env = np.exp(-t / decay) * (1 - np.exp(-t / 0.004))
  return env * (np.sin(2 * np.pi * f * t) + bright * np.sin(2 * np.pi * f * 2.003 * t) * np.exp(-t / (decay * 0.4))
                + 0.12 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t / (decay * 0.25)))

def reverb(x, mix=0.35):
  """簡単な残響（くし形フィルタ4本＋全域通過2本、scipy の IIR）。左右で少しずらす"""
  from scipy.signal import lfilter
  xp = np.concatenate([x, np.zeros(SR)]); out = []
  for ds in ((1557, 1617, 1491, 1422), (1601, 1559, 1513, 1447)):
    y = np.zeros_like(xp)
    for d in ds:
      d = int(d * SR / 44100); a = np.zeros(d + 1); a[0] = 1; a[d] = -0.78; y += lfilter([1.0], a, xp)
    y /= len(ds)
    for d, g in ((225, 0.7), (556, 0.7)):
      d = int(d * SR / 44100); bb = np.zeros(d + 1); bb[0] = -g; bb[d] = 1; aa = np.zeros(d + 1); aa[0] = 1; aa[d] = -g
      y = lfilter(bb, aa, y)
    out.append(xp * (1 - mix) + y * mix)
  return np.stack(out, 1)

def place(buf, x, at, pan=0.0):
  i = int(at * SR); n = min(len(x), len(buf) - i)
  l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
  buf[i:i + n, 0] += x[:n] * l * 1.4; buf[i:i + n, 1] += x[:n] * r * 1.4

def save(path, st, peak=0.7):
  st = st / (np.abs(st).max() + 1e-9) * peak
  fade = int(SR * 0.05); st[-fade:] *= np.linspace(1, 0, fade)[:, None]
  with wave.open(path, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())

def lowpass(x, a):  # 1次のローパス（a: 0〜1、小さいほどこもる）
  from scipy.signal import lfilter
  return lfilter([a], [1, -(1 - a)], x)

def shimmer():
  d = 3.6; dry = np.zeros((int(SR * d), 2))
  notes = [(659.26, 0.00, -0.4), (987.77, 0.16, 0.4), (830.61, 0.32, -0.2), (1318.5, 0.52, 0.3), (1975.5, 0.78, -0.3), (1661.2, 1.02, 0.2)]
  for f, at, pan in notes: place(dry, bell(f, 2.4, 0.9, 0.25) * 0.22, at, pan)
  t = t_(d); pad = (np.sin(2 * np.pi * 329.63 * t) + 0.6 * np.sin(2 * np.pi * 493.88 * t) + 0.4 * np.sin(2 * np.pi * 659.26 * t))
  pad *= np.clip(t / 1.1, 0, 1) * np.exp(-np.maximum(0, t - 1.4) / 1.2) * 0.09
  dry[:, 0] += pad; dry[:, 1] += pad
  wet = reverb((dry[:, 0] + dry[:, 1]) / 2, 0.45)[:len(dry)]
  return dry * 0.5 + wet

def swell():
  d = 1.30; t = t_(d); n = rng.standard_normal(len(t))
  env = (t / d) ** 2.6
  hiss = lowpass(n, 0.05) * 0.6 + lowpass(n, 0.25) * 0.15
  glide = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2 * t / d)) / SR) * 0.25
  x = (hiss + glide) * env
  return np.stack([x, x * 0.92], 1)

def bloom():
  d = 3.4; dry = np.zeros((int(SR * d), 2))
  for f, pan in ((329.63, -0.3), (415.30, 0.25), (493.88, -0.1), (659.26, 0.35), (987.77, -0.35)): place(dry, bell(f, d, 1.3, 0.3) * 0.2, 0.0, pan)
  t = t_(d); sub = np.sin(2 * np.pi * 82.41 * t) * np.exp(-t / 0.55) * (1 - np.exp(-t / 0.01)) * 0.45
  dry[:, 0] += sub; dry[:, 1] += sub
  wet = reverb((dry[:, 0] + dry[:, 1]) / 2, 0.4)[:len(dry)]
  return dry * 0.6 + wet * 0.8

if __name__ == '__main__':
  out = sys.argv[1]; os.makedirs(out, exist_ok=True)
  save(os.path.join(out, 'open_shimmer.wav'), shimmer(), 0.6)
  save(os.path.join(out, 'title_swell.wav'), swell(), 0.5)
  save(os.path.join(out, 'title_bloom.wav'), bloom(), 0.75)
  print('ok', out)
