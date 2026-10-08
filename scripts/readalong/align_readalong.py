#!/usr/bin/env python3
"""
音読・ディクテーション用の「単語ごとの時刻」を作る（2026-10-08）。

  入力：.tmp_ui/rd/tracks.json（audioUrl・script・turns）
        作り方：npx tsx scripts/readalong/dump_tracks.ts > .tmp_ui/rd/tracks.json
  必要：pip install vosk cmudict num2words、Vosk 英語小モデル（vosk-model-small-en-us-0.15）を .tmp_ui/vosk/ に展開
  出力：public/read_along/<音源名>.json

やっていること
  1. 音源を 16kHz モノラルにして、Vosk（オフライン音声認識・英語小モデル）で単語と時刻を取る。
     認識する語は「その問題のスクリプトに出てくる語」だけに絞る（取り違えを減らすため）。
  2. スクリプトの語の並びと、認識結果の並びを突き合わせる（difflib）。
     一致した語は認識の時刻をそのまま使い、一致しなかった語は前後の時刻から文字数で按分する。
  3. 各語に CMU 発音辞書の発音記号（ARPAbet）を付ける（画面で IPA に直して表示）。

出力の形（1ファイル＝1音源）
  { "v":1, "dur": 秒, "rate": 一致率, "lines":[ { "who":"W"|null, "w":[[表示語, 開始ms, 終了ms, "発音"], ...] }, ... ] }
"""
import json, os, re, subprocess, sys, difflib, wave
from vosk import Model, KaldiRecognizer, SetLogLevel
import cmudict
from num2words import num2words

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MODEL = os.environ.get('VOSK_MODEL', os.path.join(ROOT, '.tmp_ui/vosk/vosk-model-small-en-us-0.15'))
OUT = os.path.join(ROOT, 'public/read_along')
TMP = os.path.join(ROOT, '.tmp_ui/rd/wav')
SetLogLevel(-1)
CMU = cmudict.dict()

SPEAKER = re.compile(r"^\s*([A-Z][A-Za-z .'-]{0,24}|話者\d+|Speaker \d+)\s*[:：]\s*")
# 表示語：前後の引用符・句読点も語にくっつけて持つ（語群・文の区切りに使う）
TOKEN = re.compile(r"[\"“‘(]?[$£€]?[A-Za-z0-9À-ÿ](?:[A-Za-z0-9À-ÿ'’\-.,:/%]*[A-Za-z0-9À-ÿ%])?[.,!?;:\"”’)…—–-]*")

def lines_of(track):
    if track.get('turns'):
        return [(t.get('who'), t['text']) for t in track['turns'] if t.get('text', '').strip()]
    out = []
    for raw in re.split(r'\n+', track['script']):
        raw = raw.strip()
        if not raw: continue
        m = SPEAKER.match(raw)
        if m and not re.match(r'^\d', m.group(1)):
            out.append((m.group(1), raw[m.end():]))
        else:
            out.append((None, raw))
    return out

def spoken(tok):
    """表示語 → 発音される語の並び（数字・記号を英語に開く）"""
    t = tok.replace('’', "'").lower()
    t = re.sub(r"^[^a-z0-9$£€À-ÿ]+|[^a-z0-9%À-ÿ]+$", '', t)
    m = re.fullmatch(r'(\d{1,2}):(\d{2})', t)
    if m:
        h, mi = int(m.group(1)), int(m.group(2))
        s = num2words(h) + ('' if mi == 0 else ' ' + (('oh ' + num2words(mi)) if mi < 10 else num2words(mi)))
        return re.findall(r"[a-z']+", s)
    cur = ''
    if t[:1] in '$£€': cur = {'$': 'dollars', '£': 'pounds', '€': 'euros'}[t[0]]; t = t[1:]
    pct = t.endswith('%'); t = t.rstrip('%')
    m = re.fullmatch(r'(\d+)(st|nd|rd|th)', t)
    if m: words = num2words(int(m.group(1)), to='ordinal')
    elif re.fullmatch(r'\d[\d,]*(\.\d+)?', t):
        n = t.replace(',', '')
        if re.fullmatch(r'(1[1-9]|20)\d\d', n) and not cur: words = num2words(int(n), to='year')
        else: words = num2words(float(n) if '.' in n else int(n))
    else:
        return [w for w in re.split(r"[-/]", t) if w] or [t]
    words = words + (' percent' if pct else '') + (' ' + cur if cur else '')
    return re.findall(r"[a-z']+", words)

def pron1(w):
    w = re.sub(r"[^a-z']", '', w.lower().replace('’', "'").replace('é', 'e').replace('è', 'e'))
    p = CMU.get(w) or CMU.get(w.strip("'"))
    return ' '.join(p[0]) if p else ''

def pron(tok):
    """表示語の発音（ARPAbet）。ハイフン語は各部分をつなぐ。数字は読み方の語から作る"""
    if re.search(r'\d', tok):
        parts = [pron1(s) for s in spoken(tok)]
        return ' | '.join(parts) if all(parts) else ''
    parts = [pron1(s) for s in re.split(r'[-/]', tok) if s]
    return ' | '.join(parts) if parts and all(parts) else ''


def to_wav(src, dst):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', '16000', dst], check=True)

def recognize(wav_path, vocab, model):
    wf = wave.open(wav_path, 'rb')
    grammar = json.dumps(sorted(vocab) + ['[unk]'])
    rec = KaldiRecognizer(model, wf.getframerate(), grammar)
    rec.SetWords(True)
    res = []
    while True:
        data = wf.readframes(8000)
        if not data: break
        if rec.AcceptWaveform(data): res += json.loads(rec.Result()).get('result', [])
    res += json.loads(rec.FinalResult()).get('result', [])
    dur = wf.getnframes() / wf.getframerate()
    return [(r['word'], r['start'], r['end']) for r in res if r['word'] != '[unk]'], dur

def align(track, model):
    src = os.path.join(ROOT, 'public' + track['audioUrl'])
    name = os.path.splitext(os.path.basename(track['audioUrl']))[0]
    dir_ = track['audioUrl'].split('/')[1]
    os.makedirs(TMP, exist_ok=True)
    wav = os.path.join(TMP, f'{dir_}__{name}.wav')
    to_wav(src, wav)
    lines = lines_of(track)
    disp = []   # (line_index, 表示語)
    for li, (_, text) in enumerate(lines):
        for m in TOKEN.finditer(text): disp.append((li, m.group(0)))
    seq = []    # 発音される語 → 表示語の番号
    for di, (_, tok) in enumerate(disp):
        for s in spoken(tok): seq.append((s, di))
    known = set(model_vocab)
    vocab = {s for s, _ in seq if s in known}
    rec, dur = recognize(wav, vocab, model)
    os.remove(wav)
    a = [s for s, _ in seq]; b = [w for w, _, _ in rec]
    st = [None] * len(disp); en = [None] * len(disp)
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    matched = 0
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == 'equal' or (op == 'replace' and i2 - i1 == j2 - j1):
            for k in range(i2 - i1):
                di = seq[i1 + k][1]; _, s, e = rec[j1 + k]
                st[di] = s if st[di] is None else min(st[di], s)
                en[di] = e if en[di] is None else max(en[di], e)
                if op == 'equal': matched += 1
    # 時刻が付かなかった語は、前後の時刻から文字数で按分
    n = len(disp); i = 0
    while i < n:
        if st[i] is not None: i += 1; continue
        j = i
        while j < n and st[j] is None: j += 1
        left = en[i - 1] if i > 0 else 0.0
        right = st[j] if j < n else dur
        if right < left: right = left
        lens = [max(1, len(disp[k][1])) for k in range(i, j)]; tot = sum(lens); t = left
        for k, L in zip(range(i, j), lens):
            d = (right - left) * L / tot; st[k] = t; en[k] = t + d; t += d
        i = j
    for k in range(1, n):   # 単調にする
        if st[k] < st[k - 1]: st[k] = st[k - 1]
        if en[k] < st[k]: en[k] = st[k]
    out_lines = [{'who': who, 'w': []} for who, _ in lines]
    for k, (li, tok) in enumerate(disp):
        out_lines[li]['w'].append([tok, int(round(st[k] * 1000)), int(round(en[k] * 1000)), pron(tok)])
    rate = matched / max(1, len(a))
    data = {'v': 1, 'src': track['audioUrl'], 'dur': round(dur, 2), 'rate': round(rate, 3), 'lines': out_lines}
    os.makedirs(os.path.join(OUT, dir_), exist_ok=True)
    with open(os.path.join(OUT, dir_, name + '.json'), 'w') as f: json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    return rate

if __name__ == '__main__':
    tracks = json.load(open(os.environ.get('TRACKS', os.path.join(ROOT, '.tmp_ui/rd/tracks.json'))))
    part, parts = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (0, 1)
    model = Model(MODEL)
    model_vocab = set()
    wl = os.path.join(MODEL, 'graph/words.txt')
    if os.path.exists(wl): model_vocab = {l.split()[0] for l in open(wl)}
    else:
        # 小モデルは words.txt が無いので、CMU 辞書の語を候補にする（モデルに無い語は Vosk が無視する）
        model_vocab = set(CMU.keys())
    for idx, t in enumerate(tracks):
        if idx % parts != part: continue
        dir_ = t['audioUrl'].split('/')[1]; name = os.path.splitext(os.path.basename(t['audioUrl']))[0]
        if os.path.exists(os.path.join(OUT, dir_, name + '.json')) and '--force' not in sys.argv: continue
        try:
            r = align(t, model); print(f'{idx} {t["audioUrl"]} rate={r:.2f}', flush=True)
        except Exception as e:
            print(f'{idx} {t["audioUrl"]} ERROR {e}', flush=True)
