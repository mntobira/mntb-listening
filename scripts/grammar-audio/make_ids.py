#!/usr/bin/env python3
"""public/grammar_audio/*.mp3 の一覧から src/data/grammarAudioIds.ts を作る（2026-11-03）。
音源を足した・差し替えたら実行する：python3 scripts/grammar-audio/make_ids.py"""
import glob, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ids = sorted(os.path.basename(p)[:-4] for p in glob.glob(os.path.join(ROOT, 'public/grammar_audio/*.mp3')))
body = '\n'.join(f"  '{i}'," for i in ids)
open(os.path.join(ROOT, 'src/data/grammarAudioIds.ts'), 'w').write(
    "// 自動生成（scripts/grammar-audio/make_ids.py）。手で直さない。\n"
    "// public/grammar_audio/<問題ID>.mp3 がある問題の ID。\n"
    f"export const GRAMMAR_AUDIO_ID_LIST: readonly string[] = [\n{body}\n];\n")
print(len(ids))
