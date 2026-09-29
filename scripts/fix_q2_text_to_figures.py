#!/usr/bin/env python3
"""
第2問：配布 PDF のイラストに合わせて「テキストの側」を書き直す。

■ なぜ絵ではなくテキストを直すのか
    第2問は絵を選ぶ大問なので、絵と選択肢が食い違うと
    「答えが無い問題」「答えが2つある問題」になり、
    誤答を覚えさせてしまう。直し方は2通りある。

      (a) 絵を作り直して選択肢に合わせる
      (b) 選択肢・対話・解説を書き直して絵に合わせる

    (a) は画像生成のクレジットを使うため、(b) を採る。
    絵は配布 PDF の実物をそのまま使い、1枚も生成しない。

■ 何を根拠に書き直すか
    配布 PDF のイラスト46枚すべてを1枚ずつ開いて①〜④の中身を実測し、
    scripts/data/q2_figure_audit.md に台帳として残してある。
    このスクリプトの書き換えは、その台帳の「要書き換え」の行と
    1対1で対応している。台帳を読まずにここだけ直すと根拠を失う。

■ 上流・下流の関係（ここを間違えると直しても元に戻る）
    q2_parsed.json  ← ★このスクリプトが書き換えるファイル★
        ↓ shuffle_listening_q2_options.py
    q2_shuffled.json
        ↓ gen_listening_q2_data.py
    src/data/englishListeningQ2Problems.ts

    q2_shuffled.json と .ts は毎回作り直されるので、
    そこを直しても次の実行で消える。必ず最上流を直す。

■ 冪等性
    書き換え後の姿を「期待される最終形」として持っているので、
    何度実行しても同じ結果になる（2回目は「変更なし」と出る）。

使い方
    python3 scripts/fix_q2_text_to_figures.py            # 書き換える
    python3 scripts/fix_q2_text_to_figures.py --check    # 確認だけ
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'scripts' / 'data' / 'q2_parsed.json'

MARKS = '①②③④'

# 書き換える中身（1問ずつの根拠つき）は別ファイルに分けている。
# このファイルは「どう当てるか」の仕組みだけを持つ。
sys.path.insert(0, str(Path(__file__).resolve().parent))
from q2_figure_fixes import FIXES  # noqa: E402


def apply_fixes(sets: list[dict]) -> list[str]:
    """FIXES を当てて、実際に変わった問の名前を返す。"""
    changed: list[str] = []
    index = {(s['set'], q['q']): q for s in sets for q in s['questions']}

    for key, fix in FIXES.items():
        q = index.get(key)
        if q is None:
            raise SystemExit(f'第{key[0]}セット問{key[1]} が見つかりません')

        before = json.dumps(q, ensure_ascii=False, sort_keys=True)

        # 'why' と 'fig' は根拠の記録用なのでデータには入れない。
        for field in ('scene', 'speakers', 'turns', 'question',
                      'options', 'explanation', 'answerIndex'):
            if field in fix:
                q[field] = json.loads(json.dumps(fix[field]))

        # 正解の表示は必ず options から導く（手打ちしてずれるのを防ぐ）。
        idx = q['answerIndex']
        if not 1 <= idx <= 4:
            raise SystemExit(f'第{key[0]}セット問{key[1]}: answerIndex が範囲外')
        q['answerMark'] = MARKS[idx - 1]
        q['answerText'] = q['options'][idx - 1]

        # 絵の並びのまま使う問なので、並べ替えの痕跡は残さない。
        q.pop('shuffled', None)
        q.pop('shufflePerm', None)

        if json.dumps(q, ensure_ascii=False, sort_keys=True) != before:
            changed.append(f'第{key[0]}セット問{key[1]}')

    return changed


def check_consistency(sets: list[dict]) -> list[str]:
    """書き換えたあとのデータが自己矛盾していないか確かめる。"""
    errors: list[str] = []
    for s in sets:
        for q in s['questions']:
            tag = f'第{s["set"]}セット問{q["q"]}'
            if len(q['options']) != 4:
                errors.append(f'{tag}: 選択肢が4つでない')
                continue
            if len(set(q['options'])) != 4:
                errors.append(f'{tag}: 選択肢に重複がある')
            if not 1 <= q['answerIndex'] <= 4:
                errors.append(f'{tag}: answerIndex が範囲外')
                continue
            if q['answerMark'] != MARKS[q['answerIndex'] - 1]:
                errors.append(f'{tag}: マークと番号が不一致')
            if q['answerText'] != q['options'][q['answerIndex'] - 1]:
                errors.append(f'{tag}: 正解の本文と位置が不一致')
            if not q['turns']:
                errors.append(f'{tag}: 対話が空')
            for t in q['turns']:
                if not t.get('text', '').strip():
                    errors.append(f'{tag}: 空の発話がある')
            # 解説が正解と同じ番号を誤答として挙げていないか
            marks = {ch for ch in q['explanation'] if ch in MARKS}
            if q['answerMark'] in marks:
                errors.append(
                    f'{tag}: 解説が正解と同じ番号 {q["answerMark"]} に触れている'
                )
    return errors


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true', help='書かずに確認だけ')
    args = ap.parse_args()

    sets = json.loads(SRC.read_text(encoding='utf-8'))
    changed = apply_fixes(sets)

    errors = check_consistency(sets)
    if errors:
        print(f'整合性の検査で {len(errors)} 件の問題:')
        for e in errors:
            print(' -', e)
        return 1

    print(f'図に合わせて書き直した問: {len(changed)} 問')
    for c in changed:
        print('  -', c)
    if not changed:
        print('  （すでに書き換え済みでした）')

    if args.check:
        print('\n--check のためファイルは書きませんでした。')
        return 0

    SRC.write_text(
        json.dumps(sets, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
    )
    print(f'\n{SRC.relative_to(ROOT)} を書きました。')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
