#!/usr/bin/env python3
"""ElevenLabs に貼る読み上げ原稿を、英単語帳の全語ぶん作る。

  python3 scripts/vocab-audio/make_prompts.py

出力（docs/elevenlabs_vocab/）
  batches/<レベル>_<開始番号>-<終了番号>.txt … 1回の生成に貼る原稿（30語）
  ALL_PROMPTS.md                               … 全バッチを1つにまとめたもの（上から順にコピー）
  manifest.json                                … バッチ名 → 語ID の並び（cut.py が使う）

原稿の形：1語ずつ、間に <break time="1.2s" /> を入れる。
  この「1.2秒の無音」を cut.py が見つけて1語ずつに切る。語の数と無音の数が合わないバッチは切らずに報告する。
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from spoken import spoken, line_for_prompt

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'docs', 'elevenlabs_vocab')
# 1回 30 語（＝間のタグ 29 個）。ElevenLabs 公式：「break タグが多すぎると、読む速さが上がったり雑音が入ることがある」
BATCH = 30
BREAK = '<break time="1.2s" />'
LEVEL_ORDER = ['lv1', 'lv2', 'lv3', 'lv4', 'ilv1', 'ilv2', 'ilv3']
LEVEL_LABEL = {'lv1': '単語 Lv1', 'lv2': '単語 Lv2', 'lv3': '単語 Lv3', 'lv4': '単語 Lv4', 'ilv1': '熟語 Lv1', 'ilv2': '熟語 Lv2', 'ilv3': '熟語 Lv3'}

def main():
    words = json.load(open(os.path.join(ROOT, 'public', 'data', 'listeningVocabulary.json')))['words']
    by = {lv: [w for w in words if w['level'] == lv] for lv in LEVEL_ORDER}
    os.makedirs(os.path.join(OUT, 'batches'), exist_ok=True)
    for f in os.listdir(os.path.join(OUT, 'batches')):
        os.remove(os.path.join(OUT, 'batches', f))
    manifest, md, total_chars = {}, [], 0
    for lv in LEVEL_ORDER:
        ws = by[lv]
        # 均等に分ける（最後の回が1〜2語だけになると、間の数で確かめられない）
        k = -(-len(ws) // BATCH)
        base, extra = divmod(len(ws), k)
        sizes = [base + (1 if j < extra else 0) for j in range(k)]
        starts = [sum(sizes[:j]) for j in range(k)]
        for i, size in zip(starts, sizes):
            chunk = ws[i:i + size]
            a, b = i + 1, i + len(chunk)
            name = f'{lv}_{a:04d}-{b:04d}'
            # 文末に「.」を付けて、1語ずつ言い切る読み方にする（疑問文だけは ? のまま）
            lines = [line_for_prompt(w['word']) for w in chunk]
            text = f' {BREAK}\n'.join(lines)
            open(os.path.join(OUT, 'batches', name + '.txt'), 'w').write(text + '\n')
            manifest[name] = {'level': lv, 'from': a, 'to': b, 'ids': [w['id'] for w in chunk],
                              'spoken': [spoken(w['word']) for w in chunk], 'words': [w['word'] for w in chunk]}
            total_chars += len(text)
            md.append(f'## {name}（{LEVEL_LABEL[lv]} No.{a}〜{b}・{len(chunk)}語・{len(text)}文字）\n\n保存するファイル名：`{name}.mp3`\n\n```\n{text}\n```\n')
    json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), ensure_ascii=False, indent=1)
    head = f'# ElevenLabs 読み上げ原稿（英単語帳 全{len(words)}語・{len(manifest)}バッチ・合計 約{total_chars:,}文字）\n\n使い方は README.md。上から順に1バッチずつ貼って生成し、見出しのファイル名で保存してください。\n\n'
    open(os.path.join(OUT, 'ALL_PROMPTS.md'), 'w').write(head + '\n'.join(md))
    print(len(words), 'words', len(manifest), 'batches', total_chars, 'chars')

if __name__ == '__main__':
    main()
