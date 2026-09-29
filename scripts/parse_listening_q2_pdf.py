#!/usr/bin/env python3
"""
共通テスト 英語リスニング「第2問」類題集 PDF を JSON 化する。

なぜスクリプトにするのか
  16セット×3問＝48問ある。対話スクリプト（4往復）・イラスト選択肢の説明
  （4個×48問＝192個）・画像生成プロンプト（48本）まで含めて手で写すと、
  「選択肢と正解の対応ズレ」「正解番号の写し間違い」が必ず混入する。
  PDF → JSON → TypeScript を機械的に通し、転記ミスの入る余地を無くす。
  第1問A/B（parse_listening_pdf.py）・第3問（parse_listening_q3_pdf.py）と
  同じ方針に揃えている。

PDF の構造（39ページ / 3部構成）
  p1        … 出題傾向の分析サマリー
  第1部 問題         … 場面・話者・絵の形式・選択肢イラストの説明（先読み用）
  第2部 解答・解説・スクリプト … 対話全文＋Question＋【正解】＋【解説】
  第3部 GPT Image 2 用 画像生成プロンプト … 各問の英語プロンプト

  第1部の1問の形（行単位）
    問1 場面: 男女がカフェで注文について話している。(話者: 女性(店員) / 男性(客))
    【絵の形式：2×2の4枚から選択】
    ①
    ミルクなし・砂糖入りのホットコーヒー
    ②
    ミルク入り・砂糖なしのホットコーヒー
    ③
    ミルク入り・砂糖なしのアイスコーヒー
    ④
    ミルクなし・砂糖なしのホットティー

    ※ マーク（①〜④）だけの行の次の行に説明が来る「2行1組」の形。
    ※ 【絵の形式：…】は問見出しの次の行にある場合と、
      問見出しの行末にくっついている場合の両方がある（PDF の折り返し都合）。

  第2部の1問の形
    問1 場面: 男女がカフェで注文について話している。
    W: Would you like anything to drink with your sandwich?
    M: I'll have coffee, please. No sugar, but with milk.
    W: Ice or hot?
    M: Hot, please.
    Question: What will the man drink?
    【正解】 ② ― ミルク入り・砂糖なしのホットコーヒー
    【解説】No sugar, but with milk（砂糖なし・ミルクあり）と Hot
    の3条件を統合。①は砂糖・ミルクの逆転、③は温度違い。

    ※ 話者記号は A/B ではなく W（女性）/ M（男性）/ K・S・F・D（名前の頭文字）。
      第3問の A/B と違い「どちらが男性か」が記号から分かるので、
      設問の the man / the woman を解くのに必要な情報として保持する。

  第3部の1問の形
    第1セット
    問1 プロンプト(コピペ用):
    Black and white line-art illustration sheet for a listening test. …

出力
  scripts/data/q2_parsed.json

使い方
  python3 scripts/parse_listening_q2_pdf.py <PDF>

■ 「15セット45問」と書いてあるが実体は16セット48問
  PDF の表紙は「全15セット・45問」だが、中身は第16セットまであり
  48問収録されている。表紙の数字ではなく実データを信じ、
  検査は「セット数＝16 / 各セット3問」で行う（下の main を参照）。
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'scripts' / 'data' / 'q2_parsed.json'

MARKS = '①②③④'

# --- 行の見分け方 -----------------------------------------------------------
# セット見出し（問題編）：「第1セット 【難易度:易しめ】」
RE_SET = re.compile(r'^第(\d+)セット\s*【難易度[:：]\s*([^】]+)】')
# セット見出し（解答編）：「第1セット 解答と解説」
RE_SET_ANS = re.compile(r'^第(\d+)セット\s+解答と解説')
# セット見出し（プロンプト編）：「第1セット」だけの行
RE_SET_PROMPT = re.compile(r'^第(\d+)セット\s*$')
# 問見出し：「問1 場面: …(話者: …)」。行末に【絵の形式：…】が付くことがある
RE_Q = re.compile(r'^問(\d+)\s*場面[:：]\s*(.*)$')
# 絵の形式：「【絵の形式：2×2の4枚から選択】」
RE_FIG = re.compile(r'【絵の形式[:：]\s*([^】]+)】')
# 選択肢のマークだけの行（説明は次の行に来る形）
RE_MARK_ONLY = re.compile(r'^([①②③④])\s*$')
# 選択肢のマーク＋説明が同じ行にある形
RE_MARK_INLINE = re.compile(r'^([①②③④])\s+(\S.*)$')
# 対話行：「W: …」「M: …」「K: …」など1〜2文字の話者記号
RE_TURN = re.compile(r'^([A-Z][a-z]?)[:：]\s*(.*)$')
# 設問行：「Question: What will the man drink?」
RE_QUESTION = re.compile(r'^Question[:：]\s*(.*)$')
# 正解行：「【正解】 ② ― ミルク入り・砂糖なしのホットコーヒー」
RE_ANSWER = re.compile(r'^【正解】\s*([①②③④])\s*[―\-—]\s*(.*)$')
# 解説の始まり
RE_EXPL = re.compile(r'^【解説】\s*(.*)$')
# プロンプト見出し：「問1 プロンプト(コピペ用):」
RE_PROMPT_HEAD = re.compile(r'^問(\d+)\s*プロンプト[（(]コピペ用[）)]\s*[:：]?\s*$')

# 部の区切り
RE_PART2 = re.compile(r'^第2部\s')
RE_PART3 = re.compile(r'^第3部\s')


def extract_lines(pdf_path: Path) -> list[str]:
    """PDF 全ページを 1 行のリストにして返す。"""
    lines: list[str] = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ''
            lines.extend(text.split('\n'))
    return lines


def paren_balance(s: str) -> int:
    """丸括弧の開き数 − 閉じ数。半角・全角の両方を数える。"""
    return (s.count('(') + s.count('（')) - (s.count(')') + s.count('）'))


def join_wrapped_headers(lines: list[str]) -> list[str]:
    """
    「問N 場面: …(話者: …」が PDF の幅で折り返されている場合に次行を連結する。

    ■ なぜ必要か
      話者欄は「(話者: 女性(客) / 男性(インストラクター))」のように括弧が
      入れ子で、長いと途中で改行される：
        問1 場面: …。(話者: 女性(客) /
        男性(インストラクター)) 【絵の形式：2×2の4枚から選択】
      連結しないと、次の行（話者の残り）を選択肢や別の要素として拾ってしまう。
      括弧の開閉が釣り合うまで連結する（第3問の parser と同じ方針）。
    """
    out: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if RE_Q.match(line):
            while paren_balance(line) > 0 and i + 1 < len(lines):
                i += 1
                line = line.rstrip() + ' ' + lines[i].strip()
        out.append(line)
        i += 1
    return out


def split_parts(lines: list[str]) -> tuple[list[str], list[str], list[str]]:
    """第1部 / 第2部 / 第3部 に分ける。"""
    i2 = next((i for i, l in enumerate(lines) if RE_PART2.match(l)), None)
    i3 = next((i for i, l in enumerate(lines) if RE_PART3.match(l)), None)
    if i2 is None or i3 is None:
        raise SystemExit('第2部 / 第3部 の見出しが見つかりません')
    return lines[:i2], lines[i2:i3], lines[i3:]


def parse_scene_and_speakers(rest: str) -> tuple[str, str, str]:
    """
    「男女がカフェで注文について話している。(話者: 女性(店員) / 男性(客)) 【絵の形式：…】」
    を (場面, 話者, 絵の形式) に分解する。
    """
    fig = ''
    m = RE_FIG.search(rest)
    if m:
        fig = m.group(1).strip()
        rest = RE_FIG.sub('', rest)
    speakers = ''
    m = re.search(r'[（(]話者[:：]\s*(.*?)[）)]\s*$', rest.strip())
    if m:
        speakers = m.group(1).strip()
        rest = rest[: m.start()]
    return rest.strip(), speakers, fig


def parse_part1(lines: list[str]) -> dict[tuple[int, int], dict]:
    """第1部から (セット番号, 問番号) → 場面・話者・絵の形式・選択肢 を作る。"""
    result: dict[tuple[int, int], dict] = {}
    set_no: int | None = None
    difficulty: dict[int, str] = {}
    cur: dict | None = None
    pending_mark: str | None = None

    for line in lines:
        m = RE_SET.match(line)
        if m:
            set_no = int(m.group(1))
            difficulty[set_no] = m.group(2).strip()
            cur = None
            pending_mark = None
            continue

        m = RE_Q.match(line)
        if m and set_no is not None:
            q_no = int(m.group(1))
            scene, speakers, fig = parse_scene_and_speakers(m.group(2))
            cur = {
                'set': set_no,
                'q': q_no,
                'scene': scene,
                'speakers': speakers,
                'figureType': fig,
                'options': [],
            }
            result[(set_no, q_no)] = cur
            pending_mark = None
            continue

        if cur is None:
            continue

        # 【絵の形式：…】が問見出しの「次の行」にある場合
        if not cur['figureType']:
            m = RE_FIG.search(line)
            if m and line.strip().startswith('【絵の形式'):
                cur['figureType'] = m.group(1).strip()
                continue

        def put(mark: str, text: str) -> None:
            """マークの位置に説明を入れる（並び順に依存させない）。"""
            idx = MARKS.index(mark)
            while len(cur['options']) <= idx:
                cur['options'].append('')
            cur['options'][idx] = text

        # 選択肢は抽出器によって2つの形で出てくる。
        #   (a) 「① ミルクなし・砂糖入りのホットコーヒー」… 1行に収まる形
        #   (b) 「①」の次の行に説明     … マークと説明が分かれる形
        # どちらでも読めるようにしておく（抽出器を替えても壊れない）。
        m = RE_MARK_INLINE.match(line.strip())
        if m:
            put(m.group(1), m.group(2).strip())
            pending_mark = None
            continue

        m = RE_MARK_ONLY.match(line.strip())
        if m:
            pending_mark = m.group(1)
            continue

        if pending_mark is not None:
            text = line.strip()
            if text:
                put(pending_mark, text)
                pending_mark = None
            continue

    return {'questions': result, 'difficulty': difficulty}


def parse_part2(lines: list[str]) -> dict[tuple[int, int], dict]:
    """第2部から (セット番号, 問番号) → 対話・Question・正解・解説 を作る。"""
    result: dict[tuple[int, int], dict] = {}
    set_no: int | None = None
    cur: dict | None = None
    mode = ''  # '' / 'turns' / 'expl'

    def flush_expl(target: dict) -> None:
        target['explanation'] = re.sub(r'\s+', ' ', ' '.join(target['_expl'])).strip()
        target.pop('_expl', None)

    for line in lines:
        m = RE_SET_ANS.match(line)
        if m:
            set_no = int(m.group(1))
            if cur is not None and '_expl' in cur:
                flush_expl(cur)
            cur = None
            mode = ''
            continue

        m = RE_Q.match(line)
        if m and set_no is not None:
            if cur is not None and '_expl' in cur:
                flush_expl(cur)
            q_no = int(m.group(1))
            scene, speakers, _fig = parse_scene_and_speakers(m.group(2))
            cur = {
                'set': set_no,
                'q': q_no,
                'sceneAnswer': scene,
                'turns': [],
                'question': '',
                'answerMark': '',
                'answerText': '',
                '_expl': [],
            }
            result[(set_no, q_no)] = cur
            mode = 'turns'
            continue

        if cur is None:
            continue

        m = RE_ANSWER.match(line)
        if m:
            cur['answerMark'] = m.group(1)
            cur['answerText'] = m.group(2).strip()
            mode = ''
            continue

        m = RE_EXPL.match(line)
        if m:
            cur['_expl'].append(m.group(1).strip())
            mode = 'expl'
            continue

        m = RE_QUESTION.match(line)
        if m:
            cur['question'] = m.group(1).strip()
            mode = ''
            continue

        if mode == 'expl':
            if line.strip():
                cur['_expl'].append(line.strip())
            continue

        if mode == 'turns':
            m = RE_TURN.match(line)
            if m:
                cur['turns'].append({'who': m.group(1), 'text': m.group(2).strip()})
            elif line.strip() and cur['turns']:
                # 対話行が折り返された場合は直前の発話に足す
                cur['turns'][-1]['text'] += ' ' + line.strip()
            continue

    if cur is not None and '_expl' in cur:
        flush_expl(cur)
    return result


def parse_part3(lines: list[str]) -> dict[tuple[int, int], str]:
    """第3部から (セット番号, 問番号) → 画像生成プロンプト を作る。"""
    result: dict[tuple[int, int], str] = {}
    set_no: int | None = None
    key: tuple[int, int] | None = None
    buf: list[str] = []

    def flush() -> None:
        if key is not None:
            result[key] = re.sub(r'\s+', ' ', ' '.join(buf)).strip()

    for line in lines:
        m = RE_SET_PROMPT.match(line)
        if m:
            flush()
            key, buf = None, []
            set_no = int(m.group(1))
            continue

        m = RE_PROMPT_HEAD.match(line)
        if m and set_no is not None:
            flush()
            key = (set_no, int(m.group(1)))
            buf = []
            continue

        if key is not None and line.strip():
            buf.append(line.strip())

    flush()
    return result


def build(pdf_path: Path) -> list[dict]:
    lines = join_wrapped_headers(extract_lines(pdf_path))
    p1, p2, p3 = split_parts(lines)

    part1 = parse_part1(p1)
    questions1 = part1['questions']
    difficulty = part1['difficulty']
    answers = parse_part2(p2)
    prompts = parse_part3(p3)

    sets: dict[int, dict] = {}
    for (set_no, q_no), q1 in sorted(questions1.items()):
        a = answers.get((set_no, q_no))
        if a is None:
            raise SystemExit(f'第{set_no}セット問{q_no}: 解答編が見つかりません')
        merged = {
            'q': q_no,
            'scene': q1['scene'],
            'speakers': q1['speakers'],
            'figureType': q1['figureType'],
            'options': q1['options'],
            'turns': a['turns'],
            'question': a['question'],
            'answerMark': a['answerMark'],
            'answerText': a['answerText'],
            'explanation': a['explanation'],
            'imagePrompt': prompts.get((set_no, q_no), ''),
        }
        merged['answerIndex'] = MARKS.index(a['answerMark']) + 1
        sets.setdefault(
            set_no, {'set': set_no, 'difficulty': difficulty.get(set_no, '標準'), 'questions': []}
        )['questions'].append(merged)

    return [sets[k] for k in sorted(sets)]


def verify(sets: list[dict]) -> list[str]:
    """
    生成前の突き合わせ検査。

    ■ ここで落とすもの
      「選択肢と正解本文の不一致」を最重要で見る。これが通っていれば
      正解番号の写し間違いは原理的に起こらない。
    """
    errors: list[str] = []
    for s in sets:
        no = s['set']
        if len(s['questions']) != 3:
            errors.append(f'第{no}セット: 問数が {len(s["questions"])}（3のはず）')
        for q in s['questions']:
            tag = f'第{no}セット問{q["q"]}'
            if len(q['options']) != 4 or any(not o for o in q['options']):
                errors.append(f'{tag}: 選択肢が {len(q["options"])} 個（空欄あり）')
                continue
            if not 1 <= q['answerIndex'] <= 4:
                errors.append(f'{tag}: 正解番号が範囲外')
                continue
            # 正解本文と選択肢の突き合わせ（PDF 側の全角括弧差は無視して比較）
            def norm(t: str) -> str:
                return re.sub(r'\s+', '', t).replace('(', '（').replace(')', '）')

            if norm(q['options'][q['answerIndex'] - 1]) != norm(q['answerText']):
                errors.append(
                    f'{tag}: 正解位置と本文が不一致\n'
                    f'    選択肢{q["answerMark"]}: {q["options"][q["answerIndex"] - 1]}\n'
                    f'    【正解】  : {q["answerText"]}'
                )
            if len(q['turns']) < 2:
                errors.append(f'{tag}: 対話が {len(q["turns"])} 行')
            if not q['question'].strip():
                errors.append(f'{tag}: 設問文（Question）が空')
            if not q['explanation'].strip():
                errors.append(f'{tag}: 解説が空')
            if not q['imagePrompt'].strip():
                errors.append(f'{tag}: 画像生成プロンプトが空')
            if not q['figureType'].strip():
                errors.append(f'{tag}: 絵の形式が空')
            if not q['speakers'].strip():
                errors.append(f'{tag}: 話者が空')
    return errors


def main() -> int:
    if len(sys.argv) < 2:
        print('使い方: python3 scripts/parse_listening_q2_pdf.py <PDF>')
        return 2
    pdf_path = Path(sys.argv[1])
    if not pdf_path.exists():
        print(f'PDF が見つかりません: {pdf_path}')
        return 2

    sets = build(pdf_path)
    errors = verify(sets)
    if errors:
        print(f'突き合わせ検査で {len(errors)} 件の問題を検出しました:')
        for e in errors:
            print(' -', e)
        return 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(sets, ensure_ascii=False, indent=2), encoding='utf-8')

    total = sum(len(s['questions']) for s in sets)
    fig_a = sum(1 for s in sets for q in s['questions'] if '2×2' in q['figureType'])
    fig_b = total - fig_a
    print(f'{OUT.relative_to(ROOT)}: {len(sets)} セット / {total} 問')
    print(f'  絵の形式  A(2×2の4枚): {fig_a} 問 / B(1枚に①〜④): {fig_b} 問')
    import collections

    bias = collections.Counter(q['answerMark'] for s in sets for q in s['questions'])
    print('  正解位置の偏り:', dict(sorted(bias.items())))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
