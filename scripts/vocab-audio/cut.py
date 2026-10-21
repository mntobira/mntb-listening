#!/usr/bin/env python3
"""ElevenLabs で作った音声（1回＝30語つづけて）を、1語ずつの mp3 に切る。

  python3 scripts/vocab-audio/cut.py <受け取った音声のフォルダ or zip> [--dry-run] [--force <回の名前>...]

  入力：<フォルダ>/<回の名前>.mp3（例 lv1_0001-0030.mp3）。wav / m4a / flac でもよい。
        名前に余計な文字が付いていても（「lv1_0001-0030 (1).mp3」「ElevenLabs_..._lv1_0001-0030.mp3」）回の名前が入っていれば拾う。
        名前を付け忘れたファイル（ElevenLabs の初期の名前のまま）も、1語ずつの長さの並びで回を推定する。
        ただし、はっきり1つに決まるときだけ（決まらなければ切らずに報告）。
        サブフォルダの中も探す。zip はそのまま渡してよい。
  出力：public/audio/vocab/<レベル>/<番号>.mp3（例 public/audio/vocab/lv1/1.mp3 ＝ ev:lv1:1）
        public/audio/vocab/index.json（音声のある語ID と版 rev。アプリはこれを見て、無い語は端末の読み上げにする）
        docs/elevenlabs_vocab/cut_report.md（回ごとの結果。× の回は作り直しの対象）

■ 切り方
  ffmpeg silencedetect で無音を見つけ、長い順に「語数−1」個を語の切れ目にする。
  原稿は語の間に 1.2 秒の間を入れているので、語の中の短い間（0.1〜0.4 秒）より必ず長い。

■ ずれた音声を入れないための確認（1つでも引っかかったら、その回は切らない）
  ・切れ目の数が足りない（読み飛ばし・間が短すぎる）
  ・「語数−1 番目に長い無音」と「その次に長い無音」の差が小さい（どこが切れ目か決められない＝語が多い／言い直し）
  ・極端に短い語（0.15 秒未満）・極端に長い語（4.5 秒超）がある
  ・1語の長さが、原稿の文字数から見て不自然（短い語なのに長い・長い熟語なのに短い）
  ・音が小さすぎる・無音のファイル
  検出の閾値（-50〜-30dB）と無音の最短（0.25〜0.6 秒）を何通りか試し、上の確認をすべて通った切り方だけを採る。

■ 出力の音
  前後 0.06 秒の余白・頭 0.01 秒／お尻 0.04 秒のフェード・音量を -18 LUFS 前後にそろえる・モノラル 44.1kHz 48kbps。
  1語 約5KB、全 5,713 語で 約30MB。
"""
import hashlib, json, os, re, shutil, subprocess, sys, tempfile, time, zipfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MANIFEST = os.path.join(ROOT, 'docs', 'elevenlabs_vocab', 'manifest.json')
OUT = os.path.join(ROOT, 'public', 'audio', 'vocab')
REPORT = os.path.join(ROOT, 'docs', 'elevenlabs_vocab', 'cut_report.md')
AUDIO_EXT = ('.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac')
PAD = 0.06
MIN_WORD, MAX_WORD = 0.15, 4.5
NOISES = ('-40dB', '-45dB', '-35dB', '-50dB', '-30dB')
MIN_SIL = (0.35, 0.25, 0.5, 0.6)


def run(args, **kw):
    return subprocess.run(args, capture_output=True, text=True, **kw)


def duration(path):
    r = run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path])
    try:
        return float(r.stdout.strip())
    except ValueError:
        return 0.0


def loudness(path):
    """平均の音量（dB）。無音のファイルを見つける"""
    err = run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'volumedetect', '-f', 'null', '-']).stderr
    m = re.search(r'mean_volume: (-?[\d.]+) dB', err)
    return float(m.group(1)) if m else -99.0


def silences(path, noise, d):
    err = run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', f'silencedetect=noise={noise}:d={d}', '-f', 'null', '-']).stderr
    out, start = [], None
    for line in err.splitlines():
        m = re.search(r'silence_start: (-?[\d.]+)', line)
        if m:
            start = max(0.0, float(m.group(1)))
        m = re.search(r'silence_end: ([\d.]+)', line)
        if m and start is not None:
            out.append((start, float(m.group(1))))
            start = None
    if start is not None:  # 最後まで無音のまま終わった
        out.append((start, duration(path)))
    return out


def expected_weight(text):
    """読み上げの長さの目安（母音のかたまり＋語数）。極端な食い違いを見つけるためだけに使う"""
    t = text.lower()
    syl = len(re.findall(r'[aeiouy]+', t))
    return max(1.0, syl + 0.6 * len(t.split()) + 1.2 * t.count('—'))


def plan_segments(sil, total, texts):
    n = len(texts)
    edge = 0.05
    head = next((e for s, e in sil if s <= edge), 0.0)
    tail = next((s for s, e in sil if e >= total - edge), total)
    inner = [(s, e) for s, e in sil if s > edge and e < total - edge]
    if len(inner) < n - 1:
        return None, f'間が {len(inner)} か所しか見つからない（{n - 1} 必要）＝読み飛ばし、または間が短い'
    ranked = sorted(inner, key=lambda g: g[1] - g[0], reverse=True)
    gaps = ranked[:n - 1]
    if n > 1:
        shortest = gaps[-1][1] - gaps[-1][0]
        nxt = (ranked[n - 1][1] - ranked[n - 1][0]) if len(ranked) >= n else 0.0
        if shortest < 0.45:
            return None, f'切れ目の間が短すぎる（{shortest:.2f}秒）'
        # 切れ目と、語の中の間が区別できるか（言い直し・余分な語があると差が縮む）
        if nxt > 0 and shortest - nxt < 0.15 and nxt > 0.4:
            return None, f'切れ目の候補が {n - 1} 個に絞れない（{shortest:.2f}秒 と {nxt:.2f}秒）＝語が多い・言い直しの可能性'
    gaps.sort()
    bounds, cur = [], head
    for s, e in gaps:
        bounds.append((cur, s)); cur = e
    bounds.append((cur, tail))
    lens = [b - a for a, b in bounds]
    for i, L in enumerate(lens):
        if L < MIN_WORD:
            return None, f'{i + 1}語目が短すぎる（{L:.2f}秒）'
        if L > MAX_WORD:
            return None, f'{i + 1}語目が長すぎる（{L:.2f}秒）＝2語がつながった可能性'
    # 長さの並びが原稿と合っているか（1つずれると、長い熟語と短い単語の位置が入れ替わる）
    w = [expected_weight(t) for t in texts]
    rate = sum(lens) / sum(w)
    bad = [i for i, (L, k) in enumerate(zip(lens, w)) if L > 0.6 and (L / (k * rate) > 3.2 or L / (k * rate) < 0.28)]
    if len(bad) >= 3:
        return None, '語の長さが原稿と合わない（' + '、'.join(f'{i + 1}語目' for i in bad[:4]) + '）＝ずれている可能性'
    return bounds, ''


def best_plan(src, total, texts, sil_cache=None):
    """閾値を何通りか試し、確認をすべて通った切り方を返す"""
    why = ''
    for noise in NOISES:
        for d in MIN_SIL:
            key = (noise, d)
            sil = sil_cache.get(key) if sil_cache is not None else None
            if sil is None:
                sil = silences(src, noise, d)
                if sil_cache is not None: sil_cache[key] = sil
            bounds, why_now = plan_segments(sil, total, texts)
            if bounds: return bounds, ''
            why = why or why_now
    return None, why


def correlation(xs, ys):
    n = len(xs)
    if n < 3: return 0.0
    mx, my = sum(xs) / n, sum(ys) / n
    sx = sum((x - mx) ** 2 for x in xs) ** 0.5; sy = sum((y - my) ** 2 for y in ys) ** 0.5
    if not sx or not sy: return 0.0
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy)


def guess_batch(path, candidates, manifest):
    """名前に回が書いていないファイル：1語ずつの長さの並びが、どの回の原稿と一番合うかで決める。
    はっきり1つに決まるときだけ採る（似た回が2つあれば決めない＝間違った語に音を付けない）"""
    total = duration(path)
    if total < 1.0: return None, '音声が読めない'
    cache, scored = {}, []
    for name in candidates:
        texts = manifest[name]['spoken']
        bounds, _ = best_plan(path, total, texts, cache)
        if not bounds: continue
        lens = [b - a for a, b in bounds]
        scored.append((correlation(lens, [expected_weight(t) for t in texts]), name))
    scored.sort(reverse=True)
    if not scored: return None, 'どの回の語数とも合わない'
    best = scored[0]
    second = scored[1][0] if len(scored) > 1 else -1.0
    if best[0] >= 0.75 and best[0] - second >= 0.12:
        return best[1], f'名前なし→長さの並びで {best[1]} と判断（一致度 {best[0]:.2f}）'
    return None, f'回を1つに決められない（候補 {best[1]} 一致度 {best[0]:.2f}、次点 {second:.2f}）'


def cut_one(src, a, b, dst, total):
    a = max(0.0, a - PAD); b = min(total, b + PAD)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    d = max(0.05, b - a)
    tmp = dst + '.part.mp3'
    r = run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', f'{a:.3f}', '-t', f'{d:.3f}', '-i', src,
             '-af', f'afade=t=in:st=0:d=0.01,afade=t=out:st={max(0.0, d - 0.04):.3f}:d=0.04,loudnorm=I=-18:TP=-1.5:LRA=11',
             '-ac', '1', '-ar', '44100', '-b:a', '48k', tmp])
    if r.returncode != 0 or duration(tmp) < 0.05:
        if os.path.exists(tmp): os.remove(tmp)
        raise RuntimeError(r.stderr.strip()[:200] or '書き出しに失敗')
    os.replace(tmp, dst)  # 途中で止まっても、壊れたファイルを残さない


def find_inputs(src):
    """フォルダ（サブフォルダも）か zip から、音声ファイルを集める"""
    tmpdir = None
    if os.path.isfile(src) and src.lower().endswith('.zip'):
        tmpdir = tempfile.mkdtemp(prefix='vocab_in_')
        with zipfile.ZipFile(src) as z:
            z.extractall(tmpdir)
        src = tmpdir
    files = []
    for dp, _, fs in os.walk(src):
        for f in fs:
            if f.lower().endswith(AUDIO_EXT) and not f.startswith('._'):
                files.append(os.path.join(dp, f))
    return files, tmpdir


def match_batches(files, manifest):
    # 戻り値：(回の名前 → ファイル, 名前から分からなかったファイルのパス)
    """ファイル名から回の名前を探す。同じ回が2つあれば新しい方（作り直し）を使う"""
    pat = re.compile(r'(i?lv\d)[ _-]?(\d{4})[ _-]+(\d{4})', re.I)
    found, unknown = {}, []
    for f in files:
        m = pat.search(os.path.basename(f))
        name = f'{m.group(1).lower()}_{m.group(2)}-{m.group(3)}' if m else None
        if not name or name not in manifest:
            unknown.append(f); continue
        if name not in found or os.path.getmtime(f) > os.path.getmtime(found[name]):
            found[name] = f
    return found, unknown


def main():
    args = [x for x in sys.argv[1:] if not x.startswith('--')]
    dry = '--dry-run' in sys.argv
    if not args:
        print(__doc__); sys.exit(1)
    manifest = json.load(open(MANIFEST))
    files, tmpdir = find_inputs(args[0])
    found, unknown_files = match_batches(files, manifest)
    unknown, guessed = [], {}
    for f in unknown_files:
        cand = [n for n in manifest if n not in found]
        name, note = guess_batch(f, cand, manifest) if cand else (None, 'すべての回が届いている')
        if name:
            found[name] = f; guessed[name] = note
        else:
            unknown.append(f'{os.path.basename(f)}：{note}')
    idx_path = os.path.join(OUT, 'index.json')
    done_ids = set()
    if os.path.exists(idx_path):
        try: done_ids = set(json.load(open(idx_path)).get('ids', []))
        except Exception: done_ids = set()
    rows, ok_n = [], 0
    for name in manifest:
        if name not in found:
            continue
        m, src = manifest[name], found[name]
        total = duration(src)
        if total < 1.0:
            rows.append(f'| {name} | × | 音声が読めない・短すぎる（{total:.1f}秒） |'); continue
        if loudness(src) < -55:
            rows.append(f'| {name} | × | ほぼ無音のファイル |'); continue
        texts = m['spoken']
        bounds, why = best_plan(src, total, texts)
        if not bounds:
            rows.append(f'| {name} | × | {why} |'); continue
        try:
            if not dry:
                for wid, (a, b) in zip(m['ids'], bounds):
                    lv, num = wid.split(':')[1], wid.split(':')[2]
                    cut_one(src, a, b, os.path.join(OUT, lv, f'{num}.mp3'), total)
                    done_ids.add(wid)
        except Exception as e:
            rows.append(f'| {name} | × | 書き出しに失敗：{e} |'); continue
        lens = [b - a for a, b in bounds]
        ok_n += 1
        extra = f'・{guessed[name]}' if name in guessed else ''
        rows.append(f'| {name} | ○ | {len(lens)}語・1語 {min(lens):.2f}〜{max(lens):.2f}秒（{os.path.basename(src)}{extra}） |')
    missing = [n for n in manifest if n not in found]
    if not dry and ok_n:
        os.makedirs(OUT, exist_ok=True)
        rev = hashlib.sha1(f'{time.time()}:{len(done_ids)}'.encode()).hexdigest()[:10]
        tmp = idx_path + '.part'
        json.dump({'version': 1, 'rev': rev, 'ids': sorted(done_ids)}, open(tmp, 'w'))
        os.replace(tmp, idx_path)
    rep = ['# 切り出し結果', '', f'- 切れた回：**{ok_n} / {len(found)}**　音声のある語：**{len(done_ids)} / {sum(len(v["ids"]) for v in manifest.values())}**',
           f'- まだ届いていない回：{len(missing)}', '']
    if unknown:
        rep += ['## 回が分からなかったファイル（名前を見出しどおりに直して、もう一度）', ''] + [f'- {u}' for u in unknown] + ['']
    rep += ['| 回 | 結果 | 内容 |', '|---|---|---|'] + rows
    bad = [r.split('|')[1].strip() for r in rows if '| × |' in r]
    if bad:
        rep += ['', '## 作り直しをお願いする回', '', '、'.join(bad)]
    open(REPORT, 'w').write('\n'.join(rep) + '\n')
    if tmpdir: shutil.rmtree(tmpdir, ignore_errors=True)
    print(f'{ok_n}/{len(found)} 回を切りました。作り直し：{len(bad)} 回。名前不明：{len(unknown)} 件。音声のある語：{len(done_ids)}。詳しくは {os.path.relpath(REPORT, ROOT)}')


if __name__ == '__main__':
    main()
