#!/usr/bin/env python3
"""
共通テスト英語リスニング 第1問A / 第1問B の類題集 PDF を構造化 JSON に変換する。

なぜスクリプト化するか
  第1問A は 13セット×4問＝52問、第1問B は 15セット×4問＝60問。合計112問を
  手で書き写すと必ず転記ミスが出る。PDF テキストから機械的に取り出すことで、
  選択肢・正解・スクリプト・解説の対応ズレを構造的に防ぐ。

入力
  pdftotext -layout で書き出したテキスト（第1部＝問題／第2部＝解答・解説・スクリプト）

出力（JSON）
  [
    { "set": 1, "difficulty": "易しめ（導入）",
      "questions": [
        { "no": 1, "speaker": "女性（高校生）",
          "options": ["...", "...", "...", "..."],
          "answerIndex": 1,           # 0-based
          "script": "...", "explanation": "..." },
        ...
      ] },
    ...
  ]

使い方
  python3 scripts/parse_listening_pdf.py A /tmp/lst/q1a.txt /tmp/lst/q1a.json
  python3 scripts/parse_listening_pdf.py B /tmp/lst/q1b.txt /tmp/lst/q1b.json
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

CIRCLED = '①②③④'


def norm(s: str) -> str:
    """全角スペース・改ページ文字を潰し、前後空白を落とす。"""
    s = s.replace('\f', ' ').replace('\u3000', ' ')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()


def split_parts(text: str) -> tuple[str, str]:
    """第1部（問題）と第2部（解答・解説）に切り分ける。"""
    m = re.search(r'第2部\s*解答', text)
    if not m:
        raise SystemExit('第2部が見つかりません')
    return text[: m.start()], text[m.start() :]


def split_sets(part: str) -> list[tuple[int, str]]:
    """「第Nセット」ごとに分割する。"""
    idx = [(int(m.group(1)), m.start()) for m in re.finditer(r'第(\d+)セット', part)]
    out = []
    for i, (no, pos) in enumerate(idx):
        end = idx[i + 1][1] if i + 1 < len(idx) else len(part)
        out.append((no, part[pos:end]))
    return out


# 「問1（話者：女性（高校生））」のように話者名の中に丸括弧が入るため、
# [^）]* では途中で切れてしまう。行末の「）」まで貪欲に取ってから整形する。
Q_HEAD = re.compile(r'問(\d)\s*[（(]話者[：:]\s*(.*?)[）)]\s*(?=$|スクリプト)', re.M)


def clean_speaker(s: str) -> str:
    """話者名の末尾に閉じ括弧が余る場合を整える（例 '女性（高校生' → '女性（高校生）'）。"""
    s = norm(s)
    if s.count('（') > s.count('）'):
        s += '）'
    return s


def parse_questions_A(block: str) -> list[dict]:
    """第1問A：選択肢は半角数字 1〜4 で始まる英文。"""
    qs = []
    # 問1（話者：…） … 次の 問N か末尾まで
    for m in Q_HEAD.finditer(block):
        no = int(m.group(1))
        speaker = clean_speaker(m.group(2))
        nxt = re.search(r'問\d\s*[（(]話者', block[m.end() :])
        body = block[m.end() : m.end() + (nxt.start() if nxt else len(block))]
        opts: list[str] = []
        # 行頭の 1/2/3/4 で始まる行を選択肢として拾う（-layout なので番号と本文が同一行）
        for line in body.splitlines():
            raw = line.replace('\f', '').rstrip()
            mm = re.match(r'\s*([1-4１-４])[\s.．)）]+(\S.*)$', raw)
            if mm:
                n = int(unicodedata.normalize('NFKC', mm.group(1)))
                if n == len(opts) + 1:
                    opts.append(norm(mm.group(2)))
                    continue
            # 折り返し行（前の選択肢の続き）
            if opts and raw.strip() and not re.match(r'\s*(問\d|第\d+セット)', raw):
                opts[-1] = norm(opts[-1] + ' ' + raw)
        if len(opts) == 4:
            qs.append({'no': no, 'speaker': speaker, 'options': opts})
    return qs


def parse_questions_B(block: str) -> list[dict]:
    """第1問B：選択肢は丸数字 ①〜④ で始まるイラストの日本語説明。"""
    qs = []
    for m in Q_HEAD.finditer(block):
        no = int(m.group(1))
        speaker = clean_speaker(m.group(2))
        nxt = re.search(r'問\d\s*[（(]話者', block[m.end() :])
        body = block[m.end() : m.end() + (nxt.start() if nxt else len(block))]
        opts: list[str] = []
        for line in body.splitlines():
            raw = line.replace('\f', '').rstrip()
            mm = re.match(r'\s*([①-④])\s*(\S.*)$', raw)
            if mm:
                n = CIRCLED.index(mm.group(1))
                if n == len(opts):
                    opts.append(norm(mm.group(2)))
                    continue
            if opts and raw.strip() and not re.match(r'\s*(問\d|第\d+セット)', raw):
                opts[-1] = norm(opts[-1] + ' ' + raw)
        if len(opts) == 4:
            qs.append({'no': no, 'speaker': speaker, 'options': opts})
    return qs


def parse_answers(block: str) -> dict[int, dict]:
    """解答ブロックから 問番号 → {answerIndex, script, explanation} を作る。"""
    out: dict[int, dict] = {}
    for m in re.finditer(r'問(\d)\s*[（(]話者[：:].*?スクリプト\s*[：:]', block, re.S):
        no = int(m.group(1))
        nxt = re.search(r'問\d\s*[（(]話者[：:].*?スクリプト\s*[：:]', block[m.end() :], re.S)
        body = block[m.end() : m.end() + (nxt.start() if nxt else len(block))]

        ma = re.search(r'【正解】\s*([1-4１-４①-④])', body)
        if not ma:
            continue
        tok = ma.group(1)
        ai = CIRCLED.index(tok) if tok in CIRCLED else int(unicodedata.normalize('NFKC', tok)) - 1

        script = norm(body[: ma.start()])
        # 「【正解】 3 番 ― 英文」の英文部分（Aのみ意味がある）
        tail = body[ma.end() :]
        me = re.search(r'【解説】', tail)
        answer_text = norm(re.sub(r'^\s*番?\s*[―—\-–]\s*', '', tail[: me.start()] if me else tail))
        explanation = norm(tail[me.end() :]) if me else ''
        out[no] = {
            'answerIndex': ai,
            'script': script,
            'answerText': answer_text,
            'explanation': explanation,
        }
    return out


def main() -> int:
    if len(sys.argv) != 4:
        print(__doc__)
        return 1
    kind, src, dst = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3])
    text = src.read_text(encoding='utf-8')
    qpart, apart = split_parts(text)

    qsets = dict(split_sets(qpart))
    asets = dict(split_sets(apart))
    parse_q = parse_questions_A if kind == 'A' else parse_questions_B

    result = []
    for no in sorted(qsets):
        dm = re.search(r'【難易度[：:]\s*([^】]*)】', qsets[no])
        questions = parse_q(qsets[no])
        answers = parse_answers(asets.get(no, ''))
        merged = []
        for q in questions:
            a = answers.get(q['no'])
            if not a:
                print(f'!! set{no} 問{q["no"]}: 解答が見つかりません', file=sys.stderr)
                continue
            merged.append({**q, **a})
        result.append(
            {
                'set': no,
                'difficulty': norm(dm.group(1)) if dm else '標準',
                'questions': merged,
            }
        )

    dst.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding='utf-8')
    total = sum(len(s['questions']) for s in result)
    print(f'sets={len(result)} questions={total} -> {dst}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
