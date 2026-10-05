#!/usr/bin/env python3
"""
英単語の意味の表記くずれを直す（2026-10-05）。
元の語彙表から取り込んだときに「第1の」の数字が落ちて「第／の」になる等、
助詞だけ・数字の抜けが ／ で区切られて残っていた（例：first＝「第／の」）。
生成済みのファイル（単語帳・対戦の4択・解答）をまとめて同じ表に従って置き換える。
  python3 scripts/fix-vocab-meanings.py         … 置き換える
  python3 scripts/fix-vocab-meanings.py --check … くずれが残っていないか調べるだけ（テストでも使う）
"""
import sys, re, json, pathlib

FIX = {
    '第／の／初めて': '第1の／最初の／初めて',
    '第／の': '第1の／最初の',
    '補償する／に／～に補償する': '補償する／～に補償する／埋め合わせる',
    '補償する／に': '補償する／埋め合わせる',
    '抱きしめる／を／抱擁': '～を抱きしめる／抱擁',
    '抱きしめる／を': '～を抱きしめる',
    '～を取り除く／から取り除く／～を処分する': '～を取り除く／～から取り除く／～を処分する',
    '～を取り除く／から取り除く': '～を取り除く／～から取り除く',
    'から連想する／～を関連づける／～を結び付けて考える': '～から連想する／～を関連づける／～を結び付けて考える',
    'から連想する／～を関連づける': '～から連想する／～を関連づける',
    '細長い一片／～を取り去る／から?奪する': '細長い一片／～を取り去る／～から剥奪する',
    'から奪う／奪う／～を襲う': '～から奪う／奪う／～を襲う',
    'から奪う／奪う／AからBを奪う': '～から奪う／奪う／AからBを奪う',
    'から奪う／奪う': '～から奪う／奪う',
    'から成る／～を構成する／構成される': '～から成る／～を構成する／構成される',
    'から成る／～を構成する': '～から成る／～を構成する',
    '３倍になる／を３倍にする': '３倍になる／～を３倍にする',
    '～を避難させる／から立ち退く': '～を避難させる／～から立ち退く',
    '～を克服する／から回復する': '～を克服する／～から回復する',
    '～に出る／で審議される': '～に出る／～で審議される',
    'が…した': '～が…した',
    'から脱する／成長してがなくなる': '～から脱する／成長して～がなくなる',
    'できない／失敗する／しない': '～できない／失敗する／～しない',
    'できない／失敗する': '～できない／失敗する',
}
FILES = [
    'src/data/listeningVocabularySource.json',
    'public/data/listeningVocabulary.json',
    'src/battle/data/pool.english_vocab.generated.ts',
    'src/battle/data/answer.english_vocab.generated.ts',
]
# 長いものから置き換える（短いものが長いものの一部なので）
KEYS = sorted(FIX, key=len, reverse=True)
# 区切りの前後を確認して、別の語の一部を誤って置き換えない
def boundary(k):
    return re.compile(r'(?<![^"\\\s\[,(＝ ])' + re.escape(k) + r'(?=["\\\s\],)]|$)')
BROKEN = re.compile(r'(?:^|["\s,\[＝])(?:第／の|[^"／]{1,12}／[をに](?:["／\\]|$))')

root = pathlib.Path(__file__).resolve().parent.parent
def main(check=False):
    left = 0
    for f in FILES:
        p = root / f
        s = p.read_text(encoding='utf8'); n0 = s
        for k in KEYS:
            if check:
                left += len(boundary(k).findall(s))
            else:
                s = boundary(k).sub(FIX[k], s)
        if not check and s != n0:
            p.write_text(s, encoding='utf8'); print('fixed', f)
    if check:
        print('remaining', left); return left
    return 0

if __name__ == '__main__':
    sys.exit(1 if main('--check' in sys.argv) else 0)
