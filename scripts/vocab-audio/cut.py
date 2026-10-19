#!/usr/bin/env python3
"""ElevenLabs で作った音声（1バッチ＝50語つづけて）を、1語ずつの mp3 に切る。

  python3 scripts/vocab-audio/cut.py <受け取ったmp3のフォルダ> [--dry-run]

  入力：<フォルダ>/<バッチ名>.mp3（例 lv1_0001-0050.mp3。ファイル名は ALL_PROMPTS.md の見出しのとおり）
  出力：public/audio/vocab/<レベル>/<番号>.mp3（例 public/audio/vocab/lv1/1.mp3 ＝ ev:lv1:1）
        public/audio/vocab/index.json（音声がある語ID の一覧。アプリはこれを見て、無い語は端末の読み上げにする）
        docs/elevenlabs_vocab/cut_report.md（バッチごとの結果。切れなかったバッチは作り直しの対象）

切り方：
  ffmpeg silencedetect で無音を全部見つけ、長い順に「語数−1」個を語の切れ目にする。
  （原稿は語の間に 1.2 秒の無音を入れているので、語の中の短い間より必ず長い）
  切れ目に選んだ無音のうち一番短いものが 0.45 秒未満なら、数が合っていないとみなして切らない。
  前後 0.08 秒の余白を残し、音量を -16 LUFS 前後にそろえ、モノラル 64kbps の mp3 にする。
"""
import json, os, re, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MANIFEST = os.path.join(ROOT, 'docs', 'elevenlabs_vocab', 'manifest.json')
OUT = os.path.join(ROOT, 'public', 'audio', 'vocab')
REPORT = os.path.join(ROOT, 'docs', 'elevenlabs_vocab', 'cut_report.md')
MIN_GAP = 0.45
PAD = 0.08

def duration(path):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]).decode().strip())

def silences(path, noise='-40dB', d=0.25):
    err = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', f'silencedetect=noise={noise}:d={d}', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', err)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', err)]
    return list(zip(starts, ends))

def plan_segments(sil, total, n):
    """無音の一覧から n 語ぶんの [開始, 終了] を決める。合わなければ (None, 理由)。"""
    # 先頭・末尾の無音は切れ目ではない（語の外側）
    head = next((e for s, e in sil if s <= 0.05), 0.0)
    tail = next((s for s, e in sil if e >= total - 0.05), total)
    inner = [(s, e) for s, e in sil if s > 0.05 and e < total - 0.05]
    if len(inner) < n - 1:
        return None, f'無音が {len(inner)} か所しかない（{n - 1} 必要）'
    gaps = sorted(inner, key=lambda g: g[1] - g[0], reverse=True)[:n - 1]
    shortest = min((e - s for s, e in gaps), default=9)
    if n > 1 and shortest < MIN_GAP:
        return None, f'切れ目の無音が短すぎる（{shortest:.2f}秒）。語数と合っていない可能性'
    gaps.sort()
    bounds, cur = [], head
    for s, e in gaps:
        bounds.append((cur, s)); cur = e
    bounds.append((cur, tail))
    if any(b - a < 0.15 for a, b in bounds):
        return None, '0.15秒未満の語がある（読み飛ばしの可能性）'
    return bounds, ''

def cut_one(src, a, b, dst, total):
    a = max(0.0, a - PAD); b = min(total, b + PAD)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', f'{a:.3f}', '-to', f'{b:.3f}', '-i', src,
                    '-af', 'afade=t=in:d=0.02,areverse,afade=t=in:d=0.04,areverse,loudnorm=I=-16:TP=-1.5:LRA=11',
                    '-ac', '1', '-ar', '44100', '-b:a', '64k', dst], check=True)

def main():
    args = [x for x in sys.argv[1:] if not x.startswith('--')]
    dry = '--dry-run' in sys.argv
    if not args:
        print(__doc__); sys.exit(1)
    src_dir = args[0]
    manifest = json.load(open(MANIFEST))
    rows, done_ids = [], set()
    idx_path = os.path.join(OUT, 'index.json')
    if os.path.exists(idx_path):
        done_ids = set(json.load(open(idx_path)).get('ids', []))
    for name, m in manifest.items():
        src = os.path.join(src_dir, name + '.mp3')
        if not os.path.exists(src):
            alt = [f for f in os.listdir(src_dir) if f.startswith(name) and f.lower().endswith(('.mp3', '.wav', '.m4a'))]
            if not alt:
                continue
            src = os.path.join(src_dir, alt[0])
        total = duration(src)
        n = len(m['ids'])
        bounds, why = None, ''
        for noise in ('-40dB', '-35dB', '-45dB', '-30dB'):
            bounds, why = plan_segments(silences(src, noise), total, n)
            if bounds:
                break
        if not bounds:
            rows.append(f'| {name} | × | {why} |'); continue
        if not dry:
            for wid, (a, b) in zip(m['ids'], bounds):
                lv, num = wid.split(':')[1], wid.split(':')[2]
                cut_one(src, a, b, os.path.join(OUT, lv, f'{num}.mp3'), total)
                done_ids.add(wid)
        lens = [b - a for a, b in bounds]
        rows.append(f'| {name} | ○ | {n}語・1語 {min(lens):.2f}〜{max(lens):.2f}秒 |')
    if not dry:
        os.makedirs(OUT, exist_ok=True)
        json.dump({'version': 1, 'ids': sorted(done_ids)}, open(idx_path, 'w'))
    open(REPORT, 'w').write('# 切り出し結果\n\n| バッチ | 結果 | 内容 |\n|---|---|---|\n' + '\n'.join(rows) + '\n')
    ok = sum(1 for r in rows if '| ○ |' in r)
    print(f'{ok}/{len(rows)} バッチを切りました。音声のある語：{len(done_ids)}。詳しくは {os.path.relpath(REPORT, ROOT)}')

if __name__ == '__main__':
    main()
