#!/usr/bin/env python3
"""
強弱（プロミネンス）を音源から測って public/read_along/*.json に足す（2026-10-08）。

各語の [表示語, 開始ms, 終了ms, ARPAbet] の後ろに、次の3つを足す。
  [4] 目立ち度 0〜9（強く読まれたか。下の計算）
  [5] つづりの音節の切れ目（例 "um|brel|la"。1音節の語は ""）
  [6] 強く読む音節の番号（0 から。発音辞書の第1強勢。無ければ -1）
  ※ 文末の上がり下がりは、音源の声の高さからは安定して測れなかったため、画面側で文の形（? と疑問詞）から出す

  目立ち度 = 音の大きさ（その語の中で一番大きい所の dB）
           + 声の高さ（基本周波数の中央値。対数）
           + 1音節あたりの長さ
  を、同じ行（話者の1発言）の中で標準化して足し合わせたもの。
  英語で「強く読む語」は、大きく・高く・長くなるので、この3つで測る。
声の高さは、20ms ごとの自己相関（70〜400Hz）で求める。

  使い方：python3 scripts/readalong/add_prosody.py
"""
import glob, json, os, subprocess
import numpy as np
import re
import pyphen
HY = pyphen.Pyphen(lang='en_US')

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SR = 16000
VOWEL = ('AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW')

def load(mp3):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0

def frames(x, win=640, hop=160):
    n = 1 + max(0, (len(x) - win) // hop)
    idx = np.arange(win)[None, :] + hop * np.arange(n)[:, None]
    return x[idx] if n > 0 else np.zeros((0, win), np.float32)

def analyse(x):
    F = frames(x)
    rms = np.sqrt((F ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    # 自己相関（FFT）で f0
    w = F * np.hanning(F.shape[1])[None, :]
    spec = np.fft.rfft(w, n=2 * F.shape[1], axis=1)
    ac = np.fft.irfft(np.abs(spec) ** 2, axis=1)[:, :F.shape[1]]
    ac = ac / (ac[:, :1] + 1e-12)
    lo, hi = SR // 400, SR // 70
    seg = ac[:, lo:hi]
    lag = seg.argmax(axis=1) + lo
    peak = seg.max(axis=1)
    f0 = SR / lag
    voiced = (peak > 0.45) & (db > db.max() - 35)
    return db, f0, voiced

def syl(arpa):
    return max(1, sum(1 for p in arpa.split() if p.startswith(VOWEL)))

def z(v):
    v = np.asarray(v, float); ok = ~np.isnan(v)
    if ok.sum() < 2: return np.zeros_like(v)
    m, s = np.nanmean(v), np.nanstd(v) or 1.0
    out = (v - m) / s; out[~ok] = 0.0
    return out

def vowel_groups(w):
    """つづりの母音のかたまり（語末の黙字 e は除く。-le は1音節）"""
    lw = w.lower()
    g = [(m.start(), m.end()) for m in re.finditer(r'[aeiouy]+', lw)]
    if g and g[0][0] == 0 and lw[0] == 'y' and len(g) > 1 and g[0][1] == 1: g = g[1:]
    if len(g) > 1 and lw.endswith('e') and g[-1] == (len(lw) - 1, len(lw)) and not re.search(r'[^aeiouy]le$', lw): g = g[:-1]
    if len(g) > 1 and re.search(r'[^aeiouy]es$|[^aeiouytd]ed$', lw) and g[-1][0] == len(lw) - 2: g = g[:-1]
    return g

def split_letters(w, n):
    """つづりを n 音節に分ける。うまく分けられなければ None"""
    if n <= 1: return None
    parts = HY.inserted(w).split('-')
    if len(parts) == n and all(parts): return parts
    g = vowel_groups(w)
    if len(g) != n: return None
    cuts = []
    for (a1, b1), (a2, b2) in zip(g, g[1:]):
        cons = a2 - b1
        cuts.append(b1 if cons <= 1 else b1 + cons // 2 if cons % 2 == 0 else b1 + 1)
    out, prev = [], 0
    for c in cuts: out.append(w[prev:c]); prev = c
    out.append(w[prev:])
    return out if all(out) else None

def syllables(tok, arpa):
    """表示語 → ("um|brel|la", 強勢の番号)。ハイフン語は最初の強勢のある部分で"""
    core = re.sub(r"^[^A-Za-zÀ-ÿ0-9]+|[^A-Za-zÀ-ÿ0-9']+$", '', tok)
    if not arpa or re.search(r'\d', core) or not core: return '', -1
    if '|' in arpa or '-' in core: return '', -1
    vs = [p for p in arpa.split() if p.startswith(VOWEL)]
    st = next((k for k, p in enumerate(vs) if p.endswith('1')), -1)
    if len(vs) <= 1: return '', st
    letters = re.sub(r"'.*$", '', core)
    parts = split_letters(letters, len(vs))
    if not parts: return '', st
    parts[-1] += core[len(letters):]
    return '|'.join(parts), st

def run(path):
    d = json.load(open(path))
    x = load(os.path.join(ROOT, 'public' + d['src']))
    db, f0, voiced = analyse(x)
    fr = lambda ms: int(ms / 10)
    for ln in d['lines']:
        E, P, D = [], [], []
        for w in ln['w']:
            a, b = fr(w[1]), max(fr(w[1]) + 1, fr(w[2]))
            a, b = min(a, len(db) - 1), min(b, len(db))
            E.append(float(db[a:b].max()) if b > a else np.nan)
            v = voiced[a:b]
            P.append(float(np.log(np.median(f0[a:b][v]))) if v.sum() >= 2 else np.nan)
            D.append((w[2] - w[1]) / syl(w[3]) if w[3] else (w[2] - w[1]) / 2)
        score = 0.5 * z(E) + 0.35 * z(P) + 0.25 * z(D)
        for k, (w, sc) in enumerate(zip(ln['w'], score)):
            val = int(round(min(9, max(0, (sc + 1.8) / 3.6 * 9))))
            sp, st = syllables(w[0], w[3])
            del w[4:]
            w.extend([val, sp, st])
    d['v'] = 1
    json.dump(d, open(path, 'w'), ensure_ascii=False, separators=(',', ':'))

if __name__ == '__main__':
    files = sorted(glob.glob(os.path.join(ROOT, 'public/read_along/*/*.json')))
    for k, f in enumerate(files):
        run(f)
        if k % 50 == 0: print(k, os.path.basename(f), flush=True)
    print('done', len(files))
