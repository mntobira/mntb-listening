#!/usr/bin/env python3
"""
parse_listening_pdf.py が作った JSON から、アプリの TypeScript データを生成する。

なぜ生成するのか
  第1問A は 13セット×4問＝52問、第1問B は 15セット×4問＝60問。
  合計112問を手書きすると「選択肢と正解の対応ズレ」が必ず混入する。
  PDF → JSON → TS を機械的に通すことで、転記ミスの入る余地を無くす。

出力
  src/data/englishListeningQ1ASets.ts   … 第1問A（第2回〜第14回）
  src/data/englishListeningQ1BProblems.ts … 第1問B（第1回〜第15回・イラスト選択）

使い方
  python3 scripts/gen_listening_data.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
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
    """正答率の目安。実データが無いので難易度から機械的に割り当てる（表示用の目安）。"""
    base = {2: 78, 3: 66, 4: 54}[difficulty_num(label)]
    return base - (idx % 4) * 3


def strip_marks(text: str) -> str:
    """解説文の中の「①は〜」を残しつつ、余分な空白を整える。"""
    return re.sub(r'\s+', ' ', text).strip()


def theme_of(expl: str) -> str:
    """解説の先頭から「テーマ」を作る。

    文字数で機械的に切ると「①は last night（過去）」のように途中で切れて
    意味が壊れるため、必ず句点（。）の位置で切る。1文目が長すぎる場合だけ
    読点（、）で切り、それでも長ければ諦めて全文の先頭文を使う。
    """
    expl = strip_marks(expl)
    if not expl:
        return 'リスニング要点整理'
    first = expl.split('。')[0]
    if len(first) <= 46:
        return first
    head = first.split('、')[0]
    return head if head else first[:46]


# =====================================================================
# 第1問A
# =====================================================================

A_HEAD = """/**
 * ===================================================================
 * 英語リスニング 第1問 A ― 類題集（第2回〜第14回）
 * ===================================================================
 *
 * 出典
 *   配布 PDF「共通テスト_英語リスニング_第1問A_類題集_13セット.pdf」の
 *   13セット（各4問・計52問）をそのまま収録している。
 *   第1回（englishListeningQ1AProblems.ts の EL1_A_SET1）とは別内容なので、
 *   PDF の第1〜13セットを「第2回〜第14回」として続き番号で並べる。
 *
 * 生成方法（手打ちしていない理由）
 *   52問を手で書き写すと選択肢と正解の対応ズレが必ず混入する。
 *   scripts/parse_listening_pdf.py で PDF テキストを JSON 化し、
 *   scripts/gen_listening_data.py がこのファイルを生成している。
 *   問題文・選択肢・正解・スクリプト・解説はすべて PDF の原文どおり。
 *
 * 音源について
 *   提供された高品質MP3を audioUrl で参照する。各ファイルは原稿1回分。
 *   再生回数は readCount に従いアプリ側で制御する。
 *   対応原稿・SHA-256・出典は scripts/data/listening_premium_manifest.json に記録。
 *
 * 選択肢の表記
 *   options は ①〜④ のマーク（MARK_OPTIONS）だけを持ち、英文本体は text 側に置く。
 *   第1回と同じ設計で、スマホでも解答チップが小さく収まりマークシートと対応する。
 */

import type { ListeningAudioTrack, ListeningProblem } from './englishListeningQ1AProblems';

/** 解答チップはマークのみ（英文は問題文ペインに表示する）。 */
const MARK_OPTIONS = ['①', '②', '③', '④'];

"""


def build_a(sets: list[dict]) -> str:
    out = [A_HEAD]
    names = []
    for s in sets:
        pdf_no = s['set']
        app_no = pdf_no + 1  # 第1回は既存のハンドメイド版なので +1 する
        sid = f'EL1_A_SET{app_no}'
        names.append(sid)
        diff = s['difficulty']
        qs = s['questions']

        # ---- audioTracks ----
        tracks = []
        for q in qs:
            base = f'q_el1_A_set{app_no}_{q["no"]}'
            phrases = [
                f"{{ phrase: '{ts(w)}', meaning: '' }}"
                for w in []
            ]
            tracks.append(
                '  {\n'
                f"    subId: '{base}',\n"
                f"{audio_row(base)}"
                f"    label: '問{q['no']}',\n"
                f"    hint: '{ts(q['speaker'])}',\n"
                f"    script: '{ts(q['script'])}',\n"
                f"    translation: '',\n"
                '    keyPhrases: [],\n'
                '  },'
            )
        out.append(f'const {sid}_TRACKS: ListeningAudioTrack[] = [\n' + '\n'.join(tracks) + '\n];\n')

        # ---- 問題文（text） ----
        body = [
            f'第{app_no}回　第1問 A（4問・2回読み）　【難易度：{diff}】',
            '',
            '第1問 A では、短い英文が2回読まれます。その内容に最も近い意味の英文を、①〜④のうちから1つずつ選びなさい。',
            '',
            '【音源の聞き方】',
            '各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。本番と同じ条件で練習したいときは「2回続けて」を使ってください。',
        ]
        for q in qs:
            body += ['', '────────────────────', f'問{q["no"]}（話者：{q["speaker"]}）']
            for i, o in enumerate(q['options']):
                body.append(f'{MARKS[i]} {o}')
        text = '\n'.join(body)

        # ---- subQuestions ----
        subs = []
        for i, q in enumerate(qs):
            base = f'q_el1_A_set{app_no}_{q["no"]}'
            mark = MARKS[q['answerIndex']]
            expl = strip_marks(q['explanation'])
            subs.append(
                '    {\n'
                f"      id: '{base}',\n"
                f"      label: '問{q['no']} 話者（{ts(q['speaker'])}）の発話に最も近い英文',\n"
                "      type: 'multiple_choice',\n"
                '      options: MARK_OPTIONS,\n'
                f"      correctAnswer: '{mark}',\n"
                f'      correctAnswerRate: {answer_rate(diff, i)},\n'
                '      detailedExplanation: {\n'
                f"        theme: '{ts(theme_of(expl))}',\n"
                "        type: '言い換え型',\n"
                f'        difficulty: {difficulty_num(diff)},\n'
                '        steps: [\n'
                "          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',\n"
                "          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',\n"
                "          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',\n"
                "          '④ 残りは場所・人・時のすり替えを見つけて確定する',\n"
                '        ],\n'
                '      },\n'
                '    },'
            )

        # ---- explanation ----
        ex = [
            f'第{app_no}回（PDF 第{pdf_no}セット・難易度：{diff}）の解説です。'
            'スクリプトと正解、そして PDF の解説をそのまま収録しています。',
        ]
        for q in qs:
            mark = MARKS[q['answerIndex']]
            ex += [
                '',
                f'問{q["no"]}　正解は {mark}',
                f'スクリプト：{q["script"]}',
                f'正解の選択肢：{q["answerText"]}',
                strip_marks(q['explanation']),
            ]
        explanation = '\n'.join(ex)

        cat = f'第{app_no}回 短い発話の言い換え（{diff}）'
        out.append(
            f'const {sid}: ListeningProblem = {{\n'
            f"  id: 'q_el1_A_set{app_no}',\n"
            f"  category: '{ts(cat)}',\n"
            '  readCount: 2,\n'
            f'  audioTracks: {sid}_TRACKS,\n'
            f'  text: `{tmpl(text)}`,\n'
            '  subQuestions: [\n' + '\n'.join(subs) + '\n  ],\n'
            f'  explanation: `{tmpl(explanation)}`,\n'
            '  surroundingKnowledge: [\n'
            "    '第1問 A は2回読み。1回目で全体像と数字、2回目で場所・人・理由を確認する。',\n"
            "    '否定（not / never / no longer）を聞き逃すと意味が正反対になる。最優先で聞き取る。',\n"
            "    'usually / normally ↔ today / this time の対比が出たら、頭の中に2列の表を作る。',\n"
            "    '数量は聞こえた順にメモし、あとから ＋／− の符号を付けて計算する。',\n"
            "    '選択肢の誤りは「逆の意味」「未出情報」「細部のすり替え」「計算の途中値」のどれか。',\n"
            '  ],\n'
            '  deepDiveTopics: [\n'
            "    '言い換え（パラフレーズ）の型を蓄積する。肯定↔否定の裏返しが第1問Aの最頻出。',\n"
            "    '設問文の限定語（today / for tomorrow / this week）が答えの範囲を決める。',\n"
            "    '聞こえた単語がそのまま入っている選択肢は、たいてい誤りである（音の一致に頼らない）。',\n"
            '  ],\n'
            '};\n'
        )

    out.append(
        '/** 第1問 A の類題集（PDF 13セット＝第2回〜第14回）。 */\n'
        f'export const EL1_A_EXTRA_PROBLEMS: ListeningProblem[] = [\n'
        + ''.join(f'  {n},\n' for n in names)
        + '];\n'
    )
    return '\n'.join(out)


# =====================================================================
# 第1問B
# =====================================================================

B_HEAD = """/**
 * ===================================================================
 * 英語リスニング 第1問 B ― 類題集（第1回〜第15回・イラスト選択）
 * ===================================================================
 *
 * 出典（2つの PDF を対応させている）
 *   ・「共通テスト_英語リスニング_第1問B_類題集_15セット.pdf」… 設問・正解・スクリプト・解説
 *   ・「第１問B.pdf」（75ページ・画像）              … 各問のイラスト（①〜④が1枚に4コマ）
 *   ページ対応：第nセットの表紙は 1+5*(n-1) ページ、続く4ページが 問1〜問4。
 *   画像は 1枚に ①〜④ の4コマが 2×2 で入っているため、1問につき1枚を貼る。
 *
 * イラストの前処理
 *   第1セットの4枚には生成時の Genspark ロゴが右下に焼き込まれていたため、
 *   scripts/strip_genspark_logo.py（テンプレートマッチ＋インペイント）で除去した。
 *   画像は public/listening_q1b/el1B_set<N>_q<M>.jpg として配置している。
 *
 * 第1問A との違い
 *   A は「音声に合う英文」を選ぶが、B は「音声に合うイラスト」を選ぶ。
 *   そのため options はマーク（①〜④）のみで、判断材料は imageUrl のイラストになる。
 *   イラストの内容（PDF の日本語説明）は解説側に載せ、解答時のネタバレを防ぐ。
 *
 * 音源について
 *   提供された高品質MP3を audioUrl で参照する。各ファイルは原稿1回分。
 *   再生回数は readCount に従いアプリ側で制御する。
 *   対応原稿・SHA-256・出典は scripts/data/listening_premium_manifest.json に記録。
 */

import type { ListeningAudioTrack, ListeningProblem } from './englishListeningQ1AProblems';

/** 解答チップはマークのみ（判断材料はイラスト）。 */
const MARK_OPTIONS = ['①', '②', '③', '④'];

"""


def build_b(sets: list[dict]) -> str:
    out = [B_HEAD]
    names = []
    for s in sets:
        no = s['set']
        sid = f'EL1_B_SET{no}'
        names.append(sid)
        diff = s['difficulty']
        qs = s['questions']

        tracks = []
        for q in qs:
            base = f'q_el1_B_set{no}_{q["no"]}'
            tracks.append(
                '  {\n'
                f"    subId: '{base}',\n"
                f"{audio_row(base)}"
                f"    label: '問{q['no']}',\n"
                f"    hint: '{ts(q['speaker'])}',\n"
                f"    script: '{ts(q['script'])}',\n"
                f"    translation: '',\n"
                '    keyPhrases: [],\n'
                '  },'
            )
        out.append(f'const {sid}_TRACKS: ListeningAudioTrack[] = [\n' + '\n'.join(tracks) + '\n];\n')

        body = [
            f'第{no}回　第1問 B（4問・2回読み）　【難易度：{diff}】',
            '',
            '第1問 B では、短い英文が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。',
            '',
            '【音源の聞き方】',
            '各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。イラストは各問の下に①〜④の順で並んでいます。',
            '',
            '【解き方のコツ】',
            '音声が流れる前に4枚のイラストを見比べ、「どこが違うか」を1語で言えるようにしておきます（上／下、赤／青、2人／3人 など）。違いが分かっていれば、聞き取るべき1語が決まります。',
        ]
        for q in qs:
            body += [
                '',
                '────────────────────',
                f'問{q["no"]}（話者：{q["speaker"]}）',
                'イラスト①〜④から、発話の内容に合うものを選びなさい。',
            ]
        text = '\n'.join(body)

        subs = []
        for i, q in enumerate(qs):
            base = f'q_el1_B_set{no}_{q["no"]}'
            mark = MARKS[q['answerIndex']]
            expl = strip_marks(q['explanation'])
            subs.append(
                '    {\n'
                f"      id: '{base}',\n"
                f"      label: '問{q['no']} 発話に合うイラスト',\n"
                "      type: 'multiple_choice',\n"
                '      options: MARK_OPTIONS,\n'
                f"      correctAnswer: '{mark}',\n"
                f'      correctAnswerRate: {answer_rate(diff, i)},\n'
                f"      imageUrl: '/listening_q1b/el1B_set{no}_q{q['no']}.jpg',\n"
                f"      imageCaption: '問{q['no']} の選択肢イラスト（①〜④）',\n"
                '      detailedExplanation: {\n'
                f"        theme: '{ts(theme_of(expl))}',\n"
                "        type: 'イラスト選択型',\n"
                f'        difficulty: {difficulty_num(diff)},\n'
                '        steps: [\n'
                "          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',\n"
                "          '② 音声では、その1語に対応する部分だけを狙って聞く',\n"
                "          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',\n"
                "          '④ 2回目の読み上げで、残った2枚の差分を確定させる',\n"
                '        ],\n'
                '      },\n'
                '    },'
            )

        ex = [
            f'第{no}回（難易度：{diff}）の解説です。'
            'イラスト選択では「4枚の違い」を先に言語化しておくことが最大の得点源になります。',
        ]
        for q in qs:
            mark = MARKS[q['answerIndex']]
            opts = '／'.join(f'{MARKS[i]} {o}' for i, o in enumerate(q['options']))
            ex += [
                '',
                f'問{q["no"]}　正解は {mark}',
                f'スクリプト：{q["script"]}',
                f'イラストの内容：{opts}',
                f'正解のイラスト：{q["answerText"]}',
                strip_marks(q['explanation']),
            ]
        explanation = '\n'.join(ex)

        cat = f'第{no}回 発話に合うイラストを選ぶ（{diff}）'
        out.append(
            f'const {sid}: ListeningProblem = {{\n'
            f"  id: 'q_el1_B_set{no}',\n"
            f"  category: '{ts(cat)}',\n"
            '  readCount: 2,\n'
            f'  audioTracks: {sid}_TRACKS,\n'
            f'  text: `{tmpl(text)}`,\n'
            '  subQuestions: [\n' + '\n'.join(subs) + '\n  ],\n'
            f'  explanation: `{tmpl(explanation)}`,\n'
            '  surroundingKnowledge: [\n'
            "    '位置の前置詞：on（接触して上）／over・above（離れて上）／under・below（下）／in front of（前）／behind（後ろ）／between A and B（A と B の間）／next to・beside（隣）。',\n"
            "    '比較の聞き取り：taller / shorter / bigger / more ~ than。どちらが基準かを取り違えないこと。',\n"
            "    '数の聞き取り：two / three / four に加え、both / none of / all of / one more / two left の言い換え。',\n"
            "    '否定：not A but B（A ではなく B）は、イラスト選択で最も多い仕掛け。but の後ろが正解。',\n"
            "    '時の対比：now ↔ a minute ago / just flew away。「今の状態」を描いた1枚を選ぶ。',\n"
            '  ],\n'
            '  deepDiveTopics: [\n'
            "    '4枚のイラストは「1か所だけ違う」ように作られている。違いの軸（位置・色・数・動作）を先に決めるのが定石。',\n"
            "    '音声に出た語がそのまま描かれている絵は、しばしばダミーである（not / instead of の前の語）。',\n"
            "    '2回読みのうち1回目で軸を絞り、2回目で残った候補の差分だけを確認すると安定する。',\n"
            '  ],\n'
            '};\n'
        )

    out.append(
        '/** 第1問 B の演習セット一覧（PDF 15セット＝第1回〜第15回）。 */\n'
        f'export const EL1_B_PROBLEMS: ListeningProblem[] = [\n'
        + ''.join(f'  {n},\n' for n in names)
        + '];\n'
    )
    return '\n'.join(out)


def main() -> int:
    a = json.loads(Path('/tmp/lst/q1a.json').read_text(encoding='utf-8'))
    b = json.loads(Path('/tmp/lst/q1b.json').read_text(encoding='utf-8'))

    pa = ROOT / 'src' / 'data' / 'englishListeningQ1ASets.ts'
    pb = ROOT / 'src' / 'data' / 'englishListeningQ1BProblems.ts'
    pa.write_text(build_a(a), encoding='utf-8')
    pb.write_text(build_b(b), encoding='utf-8')

    print(f'{pa.name}: {len(a)} sets / {sum(len(s["questions"]) for s in a)} questions')
    print(f'{pb.name}: {len(b)} sets / {sum(len(s["questions"]) for s in b)} questions')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
