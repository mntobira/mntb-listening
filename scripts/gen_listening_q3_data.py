#!/usr/bin/env python3
"""
第3問（短い対話・1回読み・6問）の TypeScript データを生成する。

処理の流れ
  共通テスト_英語リスニング_第3問_類題集_15セット90問.pdf
    → scripts/parse_listening_q3_pdf.py   … PDF を JSON 化（突き合わせ検査つき）
    → scripts/shuffle_listening_q3_options.py … 正解位置の偏りを均す
    → scripts/gen_listening_q3_data.py（このファイル） … TS を生成
  出力: src/data/englishListeningQ3Problems.ts

なぜ生成するのか
  90問（選択肢360個・対話530発話）を手で書き写すと、選択肢と正解の
  対応ズレが必ず混入する。機械的に通すことで転記ミスの余地を無くす。

第1問との作りの違い
  ・1回読み（readCount: 1）。「2回続けて」ボタンは出さない。
  ・音源が「2人の対話」なので audioTracks に turns を持たせる。
    ListeningAudioPlayer が A / B に別の声を割り当てて読み上げる。
  ・設問文が英語（Question: How long can …?）で、場面説明が日本語。
    本番と同じく「日本語の場面 → 英語の設問 → 英語の選択肢」の順に並べる。

使い方
  python3 scripts/gen_listening_q3_data.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'scripts' / 'data' / 'q3_parsed.json'
OUT = ROOT / 'src' / 'data' / 'englishListeningQ3Problems.ts'
MARKS = '①②③④'


def audio_row(sub_id: str) -> str:
    match = re.fullmatch(r'q_el(1_[AB]|3)_set(\d+)_(\d+)', sub_id)
    if not match:
        return ''
    group, number, question = match.groups()
    filename = f'el{group.replace("_", "")}_set{number}_q{question}.mp3'
    if not (ROOT / 'public' / 'listening_audio' / filename).is_file():
        return ''
    return f"    audioUrl: '/listening_audio/{filename}',\n"


def ts(s: str) -> str:
    """TypeScript のシングルクォート文字列として安全にエスケープする。"""
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')


def tmpl(s: str) -> str:
    """テンプレートリテラル用のエスケープ（バックティックと ${ を無害化）。"""
    return s.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')


def difficulty_num(label: str) -> int:
    """【難易度】表記を 1〜5 の数値に落とす（detailedExplanation.difficulty 用）。"""
    if '易' in label:
        return 2
    if 'やや難' in label:
        return 4
    return 3


def answer_rate(label: str, idx: int) -> int:
    """正答率の目安。実データが無いので難易度から機械的に割り当てる（表示用）。

    第3問は1回読みなので、同じ難易度表記でも第1問より低めに置く。
    """
    base = {2: 70, 3: 60, 4: 48}[difficulty_num(label)]
    return base - (idx % 3) * 3


def tidy(text: str) -> str:
    """PDF 由来の折り返しで入った空白を整える。"""
    return re.sub(r'\s+', ' ', text or '').strip()


def theme_of(expl: str) -> str:
    """解説の1文目をテーマにする。句点で切るので途中で意味が壊れない。"""
    expl = tidy(expl)
    if not expl:
        return '短い対話の要点整理'
    first = expl.split('。')[0]
    if len(first) <= 46:
        return first
    head = first.split('、')[0]
    return head or first[:46]


def speaker_label(speakers: str) -> str:
    """'女性(高校生) / 男性(司書)' を全角に整えて読みやすくする。"""
    return tidy(speakers).replace('(', '（').replace(')', '）')


HEAD = """/**
 * ===================================================================
 * 英語リスニング 第3問 ― 類題集（第1回〜第15回）
 * ===================================================================
 *
 * 出典
 *   配布 PDF「共通テスト_英語リスニング_第3問_類題集_15セット90問.pdf」の
 *   15セット（各6問・計90問）をそのまま収録している。
 *   場面説明（日本語）・設問文（英語）・選択肢・対話スクリプト・解説は
 *   すべて PDF の原文どおり。
 *
 * 生成方法（手打ちしていない理由）
 *   90問＝選択肢360個・対話530発話を手で書き写すと、
 *   選択肢と正解の対応ズレが必ず混入する。そこで
 *     scripts/parse_listening_q3_pdf.py        … PDF → JSON（突き合わせ検査つき）
 *     scripts/shuffle_listening_q3_options.py  … 正解位置の偏りを均す
 *     scripts/gen_listening_q3_data.py         … JSON → このファイル
 *   の3段で機械的に生成している。
 *
 * 正解位置を並べ替えている理由
 *   PDF 原文のままだと正解が ①5問 / ②40問 / ③37問 / ④8問 と極端に偏り、
 *   「②か③を塗れば 85% 当たる」状態になる。音を聞かずに点が取れると
 *   リスニングの練習にならないため、選択肢の**並び順だけ**を入れ替えて
 *   正解位置をほぼ均等（各22〜23問）にした。
 *   ただし「150円→200円→350円→550円」「Today→Tomorrow→Thursday」のように
 *   自然な並び順がある問と、解説がマーク番号を直接指している問は
 *   本番の見た目から離れないよう原文の並びのまま固定している。
 *
 * 第1問との作りの違い
 *   ・1回読み（readCount: 1）。本番と同じ条件で練習するため、
 *     「2回続けて」ボタンは出さない設定にしてある。
 *   ・音源が「2人の対話」なので audioTracks に turns（A / B の発話列）を持つ。
 *     ListeningAudioPlayer が A と B に別の声を割り当てて読み上げるため、
 *     どこで話者が替わったかが耳で分かる。1つの声で通して読むと
 *     「男性は何をするか」型の設問が原理的に解けなくなる。
 *
 * 音源について
 *   提供された高品質MP3を audioUrl で参照する。各ファイルは原稿1回分。
 *   再生回数は readCount に従いアプリ側で制御する。
 *   対応原稿・SHA-256・出典は scripts/data/listening_premium_manifest.json に記録。
 *
 * 選択肢の表記
 *   options は ①〜④ のマーク（MARK_OPTIONS）だけを持ち、英文本体は text 側に置く。
 *   第1問と同じ設計で、スマホでも解答チップが小さく収まりマークシートと対応する。
 */

import type { ListeningAudioTrack, ListeningProblem } from './englishListeningQ1AProblems';

/** 解答チップはマークのみ（英文は問題文ペインに表示する）。 */
const MARK_OPTIONS = ['①', '②', '③', '④'];

"""

COMMON_STEPS = [
    '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
    '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
    '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
    '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
]

SURROUNDING = [
    '第3問は1回読み。音声が流れる前に場面と設問文を読み終えておくのが前提の大問である。',
    '設問文の疑問詞が答えの型を決める。How long → 期間、How much → 金額、What will 〜 do → 次の行動。',
    '数量・金額・時刻は「訂正」がつきもの。最初に聞こえた数字はダミーであることが多い。',
    'but / actually / instead / in total / on second thought の後ろに結論が来る。',
    '選択肢の誤りは「最初に出た数字」「別人の行動」「条件を満たさない案」のどれかに集約される。',
]

DEEP_DIVE = [
    '「先読み」を習慣にする。場面＋設問文＋選択肢の3点を10秒で読む練習を単独でやると効く。',
    '聞こえた単語がそのまま入っている選択肢はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。合意した内容が答えになる。',
]


def build(sets: list[dict]) -> str:
    out = [HEAD]
    names: list[str] = []

    for s in sets:
        no = s['set']
        sid = f'EL3_SET{no}'
        names.append(sid)
        diff = s['difficulty']
        qs = s['questions']

        # ---- audioTracks（turns つき） ----
        tracks = []
        for q in qs:
            base = f'q_el3_set{no}_{q["q"]}'
            script = '\n'.join(f'{t["who"]}: {tidy(t["text"])}' for t in q['turns'])
            turn_rows = ''.join(
                f"      {{ who: '{ts(t['who'])}', text: '{ts(tidy(t['text']))}' }},\n"
                for t in q['turns']
            )
            tracks.append(
                '  {\n'
                f"    subId: '{base}',\n"
                f"{audio_row(base)}"
                f"    label: '問{q['q']}',\n"
                f"    hint: '{ts(tidy(q['scene']))}',\n"
                f"    script: '{ts(script)}',\n"
                '    turns: [\n'
                f'{turn_rows}'
                '    ],\n'
                "    translation: '',\n"
                '    keyPhrases: [],\n'
                '  },'
            )
        out.append(
            f'const {sid}_TRACKS: ListeningAudioTrack[] = [\n' + '\n'.join(tracks) + '\n];\n'
        )

        # ---- 問題文（text） ----
        body = [
            f'第{no}回　第3問（6問・1回読み）　【難易度：{diff}】',
            '',
            '第3問では、2人の短い対話が1回だけ流れます。'
            'それぞれの問いの答えとして最も適切なものを、①〜④のうちから1つずつ選びなさい。',
            '',
            '【音源の聞き方】',
            '各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。'
            '本番は1回読みなので、まずは1回で解き、答え合わせの前にもう一度だけ聞いて確かめてください。',
            '',
            '【解き方のコツ】',
            '音声が流れる前に「場面」と「Question」を読み、選択肢4つの違いを1語で言えるようにしておきます。'
            '1回読みでは、聞くべき1語が決まっているかどうかで勝負が決まります。',
        ]
        for q in qs:
            body += [
                '',
                '────────────────────',
                f'問{q["q"]}（話者：{speaker_label(q["speakers"])}）',
                f'場面：{tidy(q["scene"])}',
                f'Question: {tidy(q["question"])}',
            ]
            for i, o in enumerate(q['options']):
                body.append(f'{MARKS[i]} {tidy(o)}')
        text = '\n'.join(body)

        # ---- subQuestions ----
        subs = []
        for i, q in enumerate(qs):
            base = f'q_el3_set{no}_{q["q"]}'
            mark = MARKS[q['answerIndex'] - 1]
            expl = tidy(q['explanation'])
            steps = ''.join(f"          '{ts(step)}',\n" for step in COMMON_STEPS)
            subs.append(
                '    {\n'
                f"      id: '{base}',\n"
                f"      label: '問{q['q']} {ts(tidy(q['question']))}',\n"
                "      type: 'multiple_choice',\n"
                '      options: MARK_OPTIONS,\n'
                f"      correctAnswer: '{mark}',\n"
                f'      correctAnswerRate: {answer_rate(diff, i)},\n'
                '      detailedExplanation: {\n'
                f"        theme: '{ts(theme_of(expl))}',\n"
                "        type: '短い対話の内容一致型',\n"
                f'        difficulty: {difficulty_num(diff)},\n'
                '        steps: [\n'
                f'{steps}'
                '        ],\n'
                '      },\n'
                '    },'
            )

        # ---- explanation ----
        ex = [
            f'第{no}回（難易度：{diff}）の解説です。'
            '対話スクリプトと正解、そして PDF の解説をそのまま収録しています。',
        ]
        for q in qs:
            mark = MARKS[q['answerIndex'] - 1]
            script = '\n'.join(f'{t["who"]}: {tidy(t["text"])}' for t in q['turns'])
            ex += [
                '',
                f'問{q["q"]}　正解は {mark}',
                f'場面：{tidy(q["scene"])}',
                f'スクリプト：{script}',
                f'Question: {tidy(q["question"])}',
                f'正解の選択肢：{tidy(q["answerText"])}',
                tidy(q['explanation']),
            ]
        explanation = '\n'.join(ex)

        cat = f'第{no}回 短い対話の内容一致（{diff}）'
        out.append(
            f'const {sid}: ListeningProblem = {{\n'
            f"  id: 'q_el3_set{no}',\n"
            f"  category: '{ts(cat)}',\n"
            '  readCount: 1,\n'
            f'  audioTracks: {sid}_TRACKS,\n'
            f'  text: `{tmpl(text)}`,\n'
            '  subQuestions: [\n' + '\n'.join(subs) + '\n  ],\n'
            f'  explanation: `{tmpl(explanation)}`,\n'
            '  surroundingKnowledge: [\n'
            + ''.join(f"    '{ts(k)}',\n" for k in SURROUNDING)
            + '  ],\n'
            '  deepDiveTopics: [\n'
            + ''.join(f"    '{ts(k)}',\n" for k in DEEP_DIVE)
            + '  ],\n'
            '};\n'
        )

    out.append(
        '/** 第3問の演習セット一覧（PDF 15セット＝第1回〜第15回・各6問）。 */\n'
        'export const EL3_PROBLEMS: ListeningProblem[] = [\n'
        + ''.join(f'  {n},\n' for n in names)
        + '];\n'
    )
    return '\n'.join(out)


def main() -> int:
    sets = json.loads(SRC.read_text(encoding='utf-8'))

    # 生成前に最低限の整合性を確認する（壊れたデータを TS に流さない）
    errors: list[str] = []
    for s in sets:
        if len(s['questions']) != 6:
            errors.append(f'第{s["set"]}セット: 問数が {len(s["questions"])}（6のはず）')
        for q in s['questions']:
            if len(q['options']) != 4:
                errors.append(f'第{s["set"]}セット問{q["q"]}: 選択肢が {len(q["options"])} 個')
            if not 1 <= q['answerIndex'] <= 4:
                errors.append(f'第{s["set"]}セット問{q["q"]}: 正解番号が範囲外')
            if q['options'][q['answerIndex'] - 1] != q['answerText']:
                errors.append(f'第{s["set"]}セット問{q["q"]}: 正解位置と本文が不一致')
            if len(q['turns']) < 2:
                errors.append(f'第{s["set"]}セット問{q["q"]}: 対話が {len(q["turns"])} 行')
            if not q['question'].strip():
                errors.append(f'第{s["set"]}セット問{q["q"]}: 設問文が空')
    if errors:
        for e in errors:
            print(' -', e)
        return 1

    OUT.write_text(build(sets), encoding='utf-8')
    total = sum(len(s['questions']) for s in sets)
    print(f'{OUT.name}: {len(sets)} セット / {total} 問')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
