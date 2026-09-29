#!/usr/bin/env python3
"""
第3問 類題集の「正解の位置」の偏りを直す。

なぜ必要か
  PDF 原文のままだと 90 問の正解位置が ①=5 / ②=40 / ③=37 / ④=8 と極端に偏る。
  この状態で出題すると「②か③を塗れば 85% 当たる」ため、リスニングの練習に
  ならない（音を聞かずに点が取れてしまう）。そこで選択肢の並び順だけを
  入れ替え、正解位置をほぼ均等（各 22〜23 問）にする。

壊してはいけない前提
  1. 選択肢の**文言**は PDF 原文から一切変えない。並び替えるだけ。
  2. 数値・時刻・曜日のように「自然な並び順」がある選択肢は並べ替えない。
     （150円→200円→350円→550円 が 350円→150円… になったら不自然で、
       本番の見た目から離れてしまう）
  3. 解説文が「④が正解」のようにマーク番号を直接指している問も並べ替えない。
     並べ替えると解説と食い違うため。
  4. 一度並べ替えたデータは二度並べ替えない。
     JSON に shuffled フラグを残しておき、既に処理済みなら検証だけを行う。
     再実行で並びが変わると、コミット済みの TS と食い違ってしまう。

使い方
  python3 scripts/shuffle_listening_q3_options.py            # 書き換える
  python3 scripts/shuffle_listening_q3_options.py --check    # 検証のみ
  python3 scripts/shuffle_listening_q3_options.py --force    # 強制的に再抽選
"""

from __future__ import annotations

import argparse
import collections
import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'scripts' / 'data' / 'q3_parsed.json'
MARKS = '①②③④'

# 「時」を表す語が全選択肢に入っていれば時系列順に並んでいるとみなす。
TEMPORAL = re.compile(
    r'(\d'
    r'|noon|midnight'
    r'|today|tomorrow|yesterday|tonight'
    r'|monday|tuesday|wednesday|thursday|friday|saturday|sunday'
    r'|january|february|march|april|may|june|july|august'
    r'|september|october|november|december'
    r'|morning|afternoon|evening|night)',
    re.I,
)
MARK_IN_TEXT = re.compile(r'[①②③④]')


def numeric_key(option: str) -> int | None:
    """選択肢の先頭付近の数値を取り出す（'1,100 yen' → 1100）。"""
    m = re.search(r'\d[\d,]*', option)
    if not m:
        return None
    return int(m.group(0).replace(',', ''))


def is_locked(question: dict) -> str | None:
    """並べ替えてはいけない問なら理由文字列を返す。並べ替えて良ければ None。"""
    opts = question['options']

    if MARK_IN_TEXT.search(question.get('explanation', '')):
        return '解説がマーク番号を直接指している'

    keys = [numeric_key(o) for o in opts]
    if all(k is not None for k in keys) and keys == sorted(keys):
        return '数値が昇順に並んでいる'

    if all(TEMPORAL.search(o) for o in opts):
        return '時刻・日付・曜日の並び'

    return None


def rebalance(questions: list[dict], seed: int = 20260818) -> dict:
    """正解位置がほぼ均等になるよう、並べ替え可能な問だけを入れ替える。"""
    rng = random.Random(seed)

    locked = []
    free = []
    for q in questions:
        (locked if is_locked(q) else free).append(q)

    # 固定分の分布を先に数え、残りを「今いちばん少ない位置」から順に埋める。
    counts = collections.Counter(q['answerIndex'] - 1 for q in locked)
    for i in range(4):
        counts.setdefault(i, 0)

    # 偏りが再現しないよう、割り当て順もシャッフルしておく。
    order = list(free)
    rng.shuffle(order)

    for q in order:
        target = min(range(4), key=lambda i: (counts[i], rng.random()))
        counts[target] += 1

        answer = q['options'][q['answerIndex'] - 1]
        rest = [o for i, o in enumerate(q['options']) if i != q['answerIndex'] - 1]
        rng.shuffle(rest)

        new_options = rest[:target] + [answer] + rest[target:]
        assert len(new_options) == 4
        assert sorted(new_options) == sorted(q['options'])

        q['options'] = new_options
        q['answerIndex'] = target + 1
        q['answerText'] = answer
        q['shuffled'] = True

    for q in locked:
        q['shuffled'] = False
        q['lockReason'] = is_locked(q)

    return {
        'locked': len(locked),
        'shuffled': len(free),
        'dist': collections.Counter(q['answerIndex'] for q in questions),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true', help='検証のみ（書き込まない）')
    ap.add_argument('--force', action='store_true', help='処理済みでも再抽選する')
    args = ap.parse_args()

    sets = json.loads(SRC.read_text(encoding='utf-8'))
    questions = [q for s in sets for q in s['questions']]

    before = collections.Counter(q['answerIndex'] for q in questions)
    original = {
        (s['set'], q['q']): (sorted(q['options']), q['answerText'])
        for s in sets for q in s['questions']
    }

    # 既に並べ替え済みなら再抽選しない。
    # 再実行で並びが変わると、コミット済みの TS データと食い違ってしまう。
    already = any('shuffled' in q for q in questions)
    if already and not args.force:
        info = {
            'locked': sum(1 for q in questions if not q.get('shuffled')),
            'shuffled': sum(1 for q in questions if q.get('shuffled')),
            'dist': collections.Counter(q['answerIndex'] for q in questions),
        }
        print('※ 並べ替え済みのデータです（--force で再抽選できます）')
    else:
        info = rebalance(questions)

    # --- 検証 -------------------------------------------------------------
    errors: list[str] = []
    for s in sets:
        for q in s['questions']:
            key = (s['set'], q['q'])
            opts_sorted, answer_text = original[key]
            if sorted(q['options']) != opts_sorted:
                errors.append(f'第{key[0]}セット問{key[1]}: 選択肢の集合が変わった')
            if q['answerText'] != answer_text:
                errors.append(f'第{key[0]}セット問{key[1]}: 正解本文が変わった')
            if q['options'][q['answerIndex'] - 1] != q['answerText']:
                errors.append(f'第{key[0]}セット問{key[1]}: 正解位置と本文が不一致')
            if not 1 <= q['answerIndex'] <= 4:
                errors.append(f'第{key[0]}セット問{key[1]}: 正解番号が範囲外')

    worst = max(info['dist'].values())
    if worst > len(questions) // 4 + 6:
        errors.append(f'偏りが残っている: {dict(sorted(info["dist"].items()))}')

    print(f'対象: {len(sets)} セット / {len(questions)} 問')
    print(f'並べ替え前の正解位置: {dict(sorted(before.items()))}')
    print(f'並べ替え後の正解位置: {dict(sorted(info["dist"].items()))}')
    print(f'固定した問: {info["locked"]} 問（自然な並び順・解説がマーク指定）')
    print(f'並べ替えた問: {info["shuffled"]} 問')

    if errors:
        print('\n--- 検証エラー ---')
        for e in errors:
            print(' -', e)
        return 1

    print('検証OK（選択肢の文言・正解本文は原文どおり／位置のみ変更）')

    if not args.check:
        SRC.write_text(
            json.dumps(sets, ensure_ascii=False, indent=1) + '\n',
            encoding='utf-8',
        )
        print(f'書き込み: {SRC}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
