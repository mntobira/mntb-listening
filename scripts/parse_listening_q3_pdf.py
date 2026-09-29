#!/usr/bin/env python3
"""
共通テスト 英語リスニング「第3問」類題集 PDF を JSON 化する。

なぜスクリプトにするのか
  15セット×6問＝90問ある。対話スクリプト（5〜7往復）まで含めて手で写すと、
  「設問と選択肢の対応ズレ」「正解番号の写し間違い」が必ず混入する。
  PDF → JSON → TypeScript を機械的に通し、転記ミスの入る余地を無くす。
  第1問A/B で同じ方針（parse_listening_pdf.py）を採ったのでそれに揃える。

PDF の構造（46ページ）
  p1        … 出題傾向の分析サマリー
  p2〜p16   … 第1部 問題（場面・設問・選択肢のみ。先読み用）
  p17〜p46  … 第2部 解答・解説・スクリプト（対話全文＋正解＋解説）

  第1部の1問の形（行単位）
    問1 場面: 図書館で本を借りようとしている。(話者: 女性(高校生) / 男性(司書))
    How long can the woman keep the book first?
    1 One week
    2 Two weeks
    3 Three weeks
    4 Four weeks

  第2部の1問の形
    問1 場面: 図書館で…(話者: …)
    A: Can I borrow this book for three weeks?
    B: Usually two weeks is the limit, ...
    （A/B が5〜7往復）
    Question: How long can the woman keep the book first?
    【正解】 1 番 ― One week
    【解説】通常2週間・新刊は1週間、という条件分岐。…

出力
  scripts/data/q3_parsed.json

使い方
  python3 scripts/parse_listening_q3_pdf.py <PDF>
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parent.parent

# --- 行の見分け方 -----------------------------------------------------------
# セット見出し：「第1セット 【難易度:易しめ】」
RE_SET = re.compile(r'^第(\d+)セット\s*【難易度[:：]\s*([^】]+)】')
# セット見出し（解答編）：「第1セット 解答と解説」
RE_SET_ANS = re.compile(r'^第(\d+)セット\s+解答と解説')
# 問見出し：「問1 場面: …(話者: 女性(高校生) / 男性(司書))」
RE_Q = re.compile(r'^問(\d+)\s*場面[:：]\s*(.*)$')
# 選択肢：「1 One week」。行頭の 1〜4 のみ（本文中の数字と誤認しないよう厳格に）
RE_OPT = re.compile(r'^([1-4])\s+(\S.*)$')
# 対話行：「A: …」「B: …」
RE_TURN = re.compile(r'^([AB])[:：]\s*(.*)$')
# 設問行（解答編）：「Question: How long …」
RE_QUESTION = re.compile(r'^Question[:：]\s*(.*)$')
# 正解行：「【正解】 1 番 ― One week」
RE_ANSWER = re.compile(r'^【正解】\s*([1-4])\s*番\s*[―\-—]\s*(.*)$')
# 解説の始まり
RE_EXPL = re.compile(r'^【解説】\s*(.*)$')


def extract_pages(pdf_path: Path) -> list[str]:
    with pdfplumber.open(str(pdf_path)) as pdf:
        return [(pg.extract_text() or '') for pg in pdf.pages]


def paren_balance(s: str) -> int:
    """丸括弧の開き数 − 閉じ数。半角・全角の両方を数える。"""
    return (s.count('(') + s.count('（')) - (s.count(')') + s.count('）'))


def iter_lines(pages: list[str]):
    """
    ページ群を1行ずつ返す。ただし「問N 場面: …(話者: …」の行が
    PDF の幅で折り返されている場合は次の行を連結して1行として返す。

    ■ なぜ必要か
      話者欄は「(話者: 男性(客) / 女性(店のスタッフ))」のように括弧が入れ子で、
      長いと途中で改行される：
        問4 場面: オンラインで買った…。(話者: 男性(客) /
        女性(店のスタッフ))
      連結せずに読むと、次の行（話者の残り）を設問文の一部として拾ってしまい、
      設問文が「女性(店のスタッフ)) What will the man do first?」になる。
      括弧が閉じるまで連結することで、この取り違えを防ぐ。
    """
    buf: str | None = None
    for page in pages:
        for raw in page.split('\n'):
            line = raw.strip()
            if buf is not None:
                # 括弧が閉じるまで連結し続ける
                buf = f'{buf} {line}'.strip()
                if paren_balance(buf) <= 0:
                    yield buf
                    buf = None
                continue
            if not line:
                continue
            if RE_Q.match(line) and paren_balance(line) > 0:
                buf = line
                continue
            yield line
    if buf is not None:
        yield buf


def split_scene(rest: str) -> tuple[str, str]:
    """
    「図書館で本を借りようとしている。(話者: 女性(高校生) / 男性(司書))」を
    場面と話者に分ける。話者の丸括弧は入れ子（女性(高校生)）なので、
    最後の「(話者:」から後ろを話者として切り出す。
    """
    marker = rest.rfind('(話者')
    if marker < 0:
        return rest.strip(), ''
    scene = rest[:marker].strip()
    speaker = rest[marker:].strip()
    # 前後の括弧を落とす：「(話者: 女性(高校生) / 男性(司書))」→「女性(高校生) / 男性(司書)」
    speaker = re.sub(r'^\(話者[:：]?\s*', '', speaker)
    if speaker.endswith(')'):
        speaker = speaker[:-1]
    return scene, speaker.strip()


def parse_part1(pages: list[str]) -> dict[int, dict]:
    """第1部（問題）を読む。戻り値は {セット番号: {...}}。"""
    sets: dict[int, dict] = {}
    cur_set: dict | None = None
    cur_q: dict | None = None
    # いま何を読んでいるか：設問文待ち / 選択肢待ち
    for line in iter_lines(pages):
            m = RE_SET.match(line)
            if m:
                num = int(m.group(1))
                cur_set = {'set': num, 'difficulty': m.group(2).strip(), 'questions': []}
                sets[num] = cur_set
                cur_q = None
                continue
            if cur_set is None:
                continue
            m = RE_Q.match(line)
            if m:
                scene, speaker = split_scene(m.group(2))
                cur_q = {
                    'q': int(m.group(1)),
                    'scene': scene,
                    'speakers': speaker,
                    'question': '',
                    'options': [],
                }
                cur_set['questions'].append(cur_q)
                continue
            if cur_q is None:
                continue
            m = RE_OPT.match(line)
            if m:
                idx = int(m.group(1))
                # 選択肢は 1→2→3→4 の順に必ず出る。番号が合わないときは
                # 設問文の折り返し行が数字で始まっただけなので設問文に足す。
                if idx == len(cur_q['options']) + 1:
                    cur_q['options'].append(m.group(2).strip())
                    continue
            if len(cur_q['options']) == 0:
                # まだ選択肢が始まっていない＝設問文（折り返しがあるので連結する）
                cur_q['question'] = (cur_q['question'] + ' ' + line).strip()
            else:
                # 選択肢の折り返し
                cur_q['options'][-1] = (cur_q['options'][-1] + ' ' + line).strip()
    return sets


def parse_part2(pages: list[str]) -> dict[int, dict[int, dict]]:
    """第2部（解答・解説・スクリプト）を読む。戻り値は {セット: {問: {...}}}。"""
    out: dict[int, dict[int, dict]] = {}
    cur_set: int | None = None
    cur: dict | None = None
    field: str | None = None  # いま何を積んでいるか：'turns' / 'question' / 'expl'
    for line in iter_lines(pages):
            m = RE_SET_ANS.match(line)
            if m:
                cur_set = int(m.group(1))
                out.setdefault(cur_set, {})
                cur = None
                field = None
                continue
            if cur_set is None:
                continue
            m = RE_Q.match(line)
            if m:
                scene, speaker = split_scene(m.group(2))
                cur = {
                    'q': int(m.group(1)),
                    'scene': scene,
                    'speakers': speaker,
                    'turns': [],       # [{'who': 'A'|'B', 'text': str}]
                    'question': '',
                    'answerIndex': 0,  # 1〜4
                    'answerText': '',
                    'explanation': '',
                }
                out[cur_set][cur['q']] = cur
                field = 'turns'
                continue
            if cur is None:
                continue
            m = RE_TURN.match(line)
            if m:
                cur['turns'].append({'who': m.group(1), 'text': m.group(2).strip()})
                field = 'turns'
                continue
            m = RE_QUESTION.match(line)
            if m:
                cur['question'] = m.group(1).strip()
                field = 'question'
                continue
            m = RE_ANSWER.match(line)
            if m:
                cur['answerIndex'] = int(m.group(1))
                cur['answerText'] = m.group(2).strip()
                field = 'answer'
                continue
            m = RE_EXPL.match(line)
            if m:
                cur['explanation'] = m.group(1).strip()
                field = 'expl'
                continue
            # ここまで来た行は「直前の項目の折り返し」。
            # PDF は幅で折り返すため、1文が2行に割れることがある。
            if field == 'turns' and cur['turns']:
                cur['turns'][-1]['text'] = (cur['turns'][-1]['text'] + ' ' + line).strip()
            elif field == 'question':
                cur['question'] = (cur['question'] + ' ' + line).strip()
            elif field == 'answer':
                cur['answerText'] = (cur['answerText'] + ' ' + line).strip()
            elif field == 'expl':
                # 解説の折り返しは日本語なので、単純に空白で繋ぐと不自然な空きが出る。
                # 行末・行頭が ASCII のときだけ空白を入れる。
                prev = cur['explanation']
                sep = ' ' if (prev[-1:].isascii() and line[:1].isascii()) else ''
                cur['explanation'] = prev + sep + line
    return out


def main() -> None:
    pdf_path = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if pdf_path is None or not pdf_path.exists():
        raise SystemExit('使い方: python3 scripts/parse_listening_q3_pdf.py <PDF>')

    pages = extract_pages(pdf_path)
    # 第1部と第2部の境目を探す（「第2部」の見出しがあるページ）
    split_at = next(
        (i for i, t in enumerate(pages) if t.lstrip().startswith('第2部')),
        len(pages),
    )
    part1 = parse_part1(pages[:split_at])
    part2 = parse_part2(pages[split_at:])

    # --- 突き合わせ（ここで壊れていれば早く気づける） ---
    problems = []
    errors: list[str] = []
    for set_no in sorted(part1):
        src = part1[set_no]
        ans = part2.get(set_no, {})
        qs = []
        for q in src['questions']:
            a = ans.get(q['q'])
            if a is None:
                errors.append(f'第{set_no}セット 問{q["q"]}: 解答編が見つからない')
                continue
            if len(q['options']) != 4:
                errors.append(f'第{set_no}セット 問{q["q"]}: 選択肢が{len(q["options"])}個')
            if not 1 <= a['answerIndex'] <= 4:
                errors.append(f'第{set_no}セット 問{q["q"]}: 正解番号が不正')
            if len(a['turns']) < 2:
                errors.append(f'第{set_no}セット 問{q["q"]}: 対話が{len(a["turns"])}行')
            # 設問文が第1部と第2部で一致するか（対応ズレの検出）
            n1 = re.sub(r'\s+', ' ', q['question']).strip().rstrip('?').lower()
            n2 = re.sub(r'\s+', ' ', a['question']).strip().rstrip('?').lower()
            if n1 and n2 and n1 != n2:
                errors.append(
                    f'第{set_no}セット 問{q["q"]}: 設問文が不一致\n  第1部: {q["question"]}\n  第2部: {a["question"]}'
                )
            # 正解の選択肢本文が一致するか（正解番号の写し間違いの検出）
            opt = q['options'][a['answerIndex'] - 1] if 1 <= a['answerIndex'] <= len(q['options']) else ''
            o1 = re.sub(r'[\s.]+', ' ', opt).strip().lower()
            o2 = re.sub(r'[\s.]+', ' ', a['answerText']).strip().lower()
            if o1 and o2 and o1 != o2:
                errors.append(
                    f'第{set_no}セット 問{q["q"]}: 正解本文が不一致\n  選択肢{a["answerIndex"]}: {opt}\n  【正解】: {a["answerText"]}'
                )
            qs.append({**q, **{k: a[k] for k in ('turns', 'answerIndex', 'answerText', 'explanation')}})
        problems.append({'set': set_no, 'difficulty': src['difficulty'], 'questions': qs})

    out_path = ROOT / 'scripts' / 'data' / 'q3_parsed.json'
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(problems, ensure_ascii=False, indent=2), encoding='utf-8')

    total = sum(len(s['questions']) for s in problems)
    print(f'セット数: {len(problems)} / 問数: {total}')
    print(f'出力: {out_path}')
    if errors:
        print(f'\n⚠ 突き合わせで {len(errors)} 件の問題を検出:')
        for e in errors:
            print(' -', e)
        raise SystemExit(1)
    print('突き合わせOK（設問文・正解本文・選択肢数・対話行数すべて整合）')


if __name__ == '__main__':
    main()
