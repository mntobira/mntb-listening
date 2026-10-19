#!/usr/bin/env python3
"""ElevenLabs に貼る読み上げ原稿を、英単語帳の全語ぶん作る。

  python3 scripts/vocab-audio/make_prompts.py

出力（docs/elevenlabs_vocab/）
  batches/<レベル>_<開始番号>-<終了番号>.txt … 1回の生成に貼る原稿（50語）
  ALL_PROMPTS.md                               … 全バッチを1つにまとめたもの（上から順にコピー）
  manifest.json                                … バッチ名 → 語ID の並び（cut.py が使う）

原稿の形：1語ずつ、間に <break time="1.2s" /> を入れる。
  この「1.2秒の無音」を cut.py が見つけて1語ずつに切る。語の数と無音の数が合わないバッチは切らずに報告する。
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from spoken import spoken

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'docs', 'elevenlabs_vocab')
BATCH = 50
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
        for i in range(0, len(ws), BATCH):
            chunk = ws[i:i + BATCH]
            a, b = i + 1, i + len(chunk)
            name = f'{lv}_{a:04d}-{b:04d}'
            # 文末に「.」を付けて、1語ずつ言い切る読み方にする（疑問調・続く調子にしない）
            lines = [spoken(w['word']).rstrip('.') + '.' for w in chunk]
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
