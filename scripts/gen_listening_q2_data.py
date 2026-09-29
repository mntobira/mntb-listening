#!/usr/bin/env python3
"""
第2問（短い対話・2回読み・イラスト選択・3問）の TypeScript データを生成する。

処理の流れ
  共通テスト_英語リスニング_第2問_類題集_15セット_改訂版v2.pdf
    → scripts/parse_listening_q2_pdf.py        … PDF を JSON 化（突き合わせ検査つき）
    → scripts/shuffle_listening_q2_options.py  … 正解位置の偏りを均す
    → scripts/gen_listening_q2_data.py（このファイル） … TS を生成
  出力: src/data/englishListeningQ2Problems.ts

なぜ生成するのか
  48問＝選択肢192個・対話192発話を手で書き写すと、
  選択肢と正解の対応ズレが必ず混入する。機械的に通すことで転記ミスの余地を無くす。

第1問B・第3問との作りの違い
  ・2回読み（readCount: 2）。第1問B と同じで、第3問（1回読み）とは異なる。
  ・選択肢は「絵」なので options はマーク（①〜④）のみ。
    判断材料は imageUrl のイラスト（第1問B と同じ設計）。
  ・音源が「2人の対話」なので audioTracks に turns を持たせる（第3問と同じ）。
  ・設問文が英語（Question: What will the man drink?）で、場面説明が日本語。

■ 選択肢の日本語説明を問題文に出さない理由（第1問B と同じ方針）
    本番の第2問は「絵だけ」を見て選ぶ大問である。
    PDF には各選択肢のイラスト内容が日本語で書かれているが、
    これを問題文に並べてしまうと「絵を読み取る」練習にならず、
    日本語を読んで解く別の問題になってしまう。
    そこで日本語説明は問題文には出さず、答え合わせ（解説）側に置く。
    復習では「①はこういう絵だった」が分かるほうが役に立つ。

■ 話者記号（W / M / K / S / F / D）をそのまま残す理由
    PDF のスクリプトは W（女性）/ M（男性）が基本だが、
      第1セット問2  … M: が「母親」
      第8セット問1  … M: が「母親」
      第10セット問2 … M: が「母親」
    のように、M が女性を指す問が実際に4問ある（実データで確認）。
    そのため「W なら女性・M なら男性」と機械的に置き換えると
    4問で嘘の情報を出すことになる。記号は PDF の原文どおりに残し、
    誰と誰の対話かは PDF の「話者：」欄をそのまま表示して伝える。
    読み上げ側（speakDialogue）は登場順に声を振り分けるので、
    記号の意味を解釈しなくても「話者が替わったこと」は耳で分かる。

使い方
  python3 scripts/gen_listening_q2_data.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'scripts' / 'data' / 'q2_shuffled.json'

# 「どの問を収録するか」の定義はシャッフラー側に1か所だけ置き、
# ここでは読み込むだけにする（2か所に書くと必ず食い違うため）。
sys.path.insert(0, str(Path(__file__).resolve().parent))
from shuffle_listening_q2_options import (  # noqa: E402
    PUBLISHED_QUESTIONS,
)
OUT = ROOT / 'src' / 'data' / 'englishListeningQ2Problems.ts'
IMG_DIR_REL = '/listening_q2'
MARKS = '①②③④'

# ------------------------------------------------------------------
# 音源（MP3）の置き場所
# ------------------------------------------------------------------
# この類題集には MP3 が付属しないので、既定では audioUrl を持たせず、
# ListeningAudioPlayer がブラウザの音声合成で turns を読み上げる。
#
# 将来 TTS で MP3 を作ったら public/listening_audio/ に置くだけでよい。
# このスクリプトは「実際にファイルがある問だけ」audioUrl を埋める。
# 存在しないファイルを指すと再生ボタンを押した瞬間に 404 で無音になり、
# 音声合成のフォールバックすら働かなくなるため、実在確認を必須にする。
#
#   台本の作り方: python3 scripts/gen_q2_tts_scripts.py
#                 → scripts/data/q2_tts/manifest.json
AUDIO_DIR_REL = '/listening_audio'
AUDIO_DIR = ROOT / 'public' / 'listening_audio'


def audio_url_for(set_no: int, q_no: int) -> str | None:
    """
    その問の MP3 が実在すれば公開URLを返し、無ければ None を返す。

    None のときは audioUrl を出力しない（＝音声合成へフォールバックする）。
    """
    name = f'el2_set{set_no}_q{q_no}.mp3'
    path = AUDIO_DIR / name
    # 0バイトや極端に小さいファイルは生成失敗の残骸なので採用しない。
    if path.exists() and path.stat().st_size > 1000:
        return f'{AUDIO_DIR_REL}/{name}'
    return None

# ★今回収録する問（＝配布 PDF の実物イラストがある問）★
#
# 絵を選ぶ大問なので、絵のない問を入れても解けない。
# そのため 48問全部を待たず、絵が揃っている問だけを先に公開し、
# 残りはイラストが揃ったところで追加していく。
# 配布PDFの実物イラスト ＋ 新しく生成した絵（shuffle_listening_q2_options.py の DRAWN_ILLUSTRATION_PERMS）の問
PUBLISHED = PUBLISHED_QUESTIONS


def ts(s: str) -> str:
    """TypeScript のシングルクォート文字列として安全にエスケープする。"""
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')


def tmpl(s: str) -> str:
    """テンプレートリテラル用のエスケープ（バックティックと ${ を無害化）。"""
    return s.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')


def tidy(text: str) -> str:
    """PDF 由来の折り返しで入った空白を整える。"""
    return re.sub(r'\s+', ' ', text or '').strip()


def difficulty_num(label: str) -> int:
    """【難易度】表記を 1〜5 の数値に落とす（detailedExplanation.difficulty 用）。"""
    if '易' in label:
        return 2
    if 'やや難' in label:
        return 4
    return 3


def answer_rate(label: str, idx: int) -> int:
    """正答率の目安。実データが無いので難易度から機械的に割り当てる（表示用）。

    第2問は2回読み・やや易の大問なので、第3問（1回読み）より高めに置く。
    """
    base = {2: 78, 3: 68, 4: 56}[difficulty_num(label)]
    return base - (idx % 3) * 3


def theme_of(expl: str) -> str:
    """解説の1文目をテーマにする。句点で切るので途中で意味が壊れない。"""
    expl = tidy(expl)
    if not expl:
        return '短い対話とイラストの照合'
    first = expl.split('。')[0]
    if len(first) <= 46:
        return first
    head = first.split('、')[0]
    return head or first[:46]


def speaker_label(speakers: str) -> str:
    """'女性(店員) / 男性(客)' を全角に整えて読みやすくする。"""
    return tidy(speakers).replace('(', '（').replace(')', '）')


def figure_label(figure_type: str) -> str:
    """絵の形式を、画面に出す短い日本語にする。"""
    if '2×2' in figure_type:
        return '2×2の4枚から選択'
    return '1枚の図の中に①〜④'


def image_caption(q: dict) -> str:
    """イラストのキャプション。絵の形式によって言い方を変える。"""
    if '2×2' in q['figureType']:
        return f'問{q["q"]} の選択肢イラスト（①〜④の4枚）'
    return f'問{q["q"]} の図（①〜④の位置）'


HEAD = """/**
 * ===================================================================
 * 英語リスニング 第2問 ― 類題集（イラストが揃った回から順次公開）
 * ===================================================================
 *
 * 出典
 *   配布 PDF「共通テスト_英語リスニング_第2問_類題集_15セット_改訂版v2.pdf」。
 *   場面説明（日本語）・話者・設問文（英語）・対話スクリプト・解説は
 *   すべて PDF の原文どおり。
 *
 *   ※ PDF の表紙は「全15セット・45問」だが、中身は第16セットまであり
 *     48問収録されている。表紙の数字ではなく実データに合わせて16セット
 *     （第1回〜第16回）として扱っている。
 *
 * ★なぜ全 48 問ではなく順次公開なのか★
 *   第2問は「絵を選ぶ」大問なので、イラストのない問は原理的に解けない。
 *   配布 PDF「第２問.pdf」から実物のイラストが取れた問を
 *   絵の1マスずつ拡大して選択肢の文言と突き合わせ、
 *   絵と選択肢が完全に一致した問だけを先に公開している。
 *   残りはイラストを用意できたところで追加する。
 *   セット番号・問番号は PDF 原文のまま保ち、詰め直していない
 *   （詰め直すと、後日追加したときに既存の学習記録の ID が
 *     別の問を指してしまう）。
 *
 * 生成方法（手打ちしていない理由）
 *   48問＝選択肢192個・対話192発話・画像プロンプト48本を手で書き写すと、
 *   選択肢と正解の対応ズレが必ず混入する。そこで
 *     scripts/parse_listening_q2_pdf.py        … PDF → JSON（突き合わせ検査つき）
 *     scripts/shuffle_listening_q2_options.py  … 正解位置の偏りを均す
 *     scripts/gen_listening_q2_data.py         … JSON → このファイル
 *   の3段で機械的に生成している。
 *
 * 正解位置について
 *   PDF 原文のままだと正解が ①13問 / ②21問 / ③9問 / ④5問 と偏っており、
 *   「②を塗れば 44% 当たる」状態になる。音を聞かずに点が取れると
 *   リスニングの練習にならないため、選択肢の**並び順だけ**を入れ替えて
 *   偏りを均す仕組みを入れている。
 *
 *   ただしこのファイルに収録した問は「実物のイラストを使う問」で、
 *   絵の各マスの左上に ①②③④ が★絵として焼き込まれている★
 *   （実測：マス左上22%の領域の暗ピクセル率≈10%、その右隣の帯≈0.3%）。
 *   並べ替えると番号ごと動いて答えが消えるので、この分は
 *   PDF 原文の並びで固定している。
 *
 *   ★実物イラストを使う問が増えるほど、並べ替えで均せる余地は減る。★
 *   32問を実物イラストで公開した時点の実測値は下の「正解位置の実測」を参照。
 *   ②が多いのは PDF 原文の偏りがそのまま残っているためで、
 *   イラストを自前生成に置き換えた問だけが並べ替えの対象になる。
 *
 *   なお「1枚の図の中に①〜④が配置される型」は、①〜④が図の中の
 *   どこを指すかが1つの文に溶けているため、機械的に入れ替えると絵が壊れる。
 *   この型は原文の並びのまま固定し、並べ替え可能な2×2型で全体を均している。
 *
 * 第1問B・第3問との作りの違い
 *   ・2回読み（readCount: 2）。第1問B と同じ。第3問は1回読み。
 *   ・選択肢は「絵」なので options はマーク（①〜④）のみを持ち、
 *     判断材料は imageUrl のイラストになる（第1問B と同じ設計）。
 *   ・音源が「2人の対話」なので audioTracks に turns（発話列）を持つ。
 *     ListeningAudioPlayer が話者ごとに別の声を割り当てて読み上げるため、
 *     どこで話者が替わったかが耳で分かる。1つの声で通して読むと
 *     「the man は何を買うか」型の設問が原理的に解けなくなる。
 *
 * 話者記号（W / M / K / S / F / D）について
 *   PDF のスクリプトの記号をそのまま残している。基本は W=女性・M=男性 だが、
 *   第1セット問2・第8セット問1・第10セット問2 では M が「母親」を指す。
 *   機械的に性別へ置き換えると4問で嘘になるため、記号は原文どおりとし、
 *   誰と誰の対話かは各問の「話者：」欄で伝えている。
 *
 * 音源について
 *   この類題集には MP3 が付属しない。そこで audioUrl を持たせず、
 *   ListeningAudioPlayer 側でブラウザの音声合成（SpeechSynthesis）に
 *   フォールバックして turns を読み上げる。MP3 を用意したら
 *   audioUrl を埋めるだけで実音源に切り替わる。
 *
 * 選択肢の日本語説明の置き場所
 *   本番の第2問は「絵だけ」を見て選ぶ。PDF には各選択肢のイラスト内容が
 *   日本語で書かれているが、これを問題文に並べると「絵を読み取る」練習に
 *   ならないため、問題文には出さず答え合わせ（解説）側に置いている。
 */

import type { ListeningAudioTrack, ListeningProblem } from './englishListeningQ1AProblems';

/** 解答チップはマークのみ（判断材料はイラスト）。 */
const MARK_OPTIONS = ['①', '②', '③', '④'];

"""

COMMON_STEPS = [
    '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
    '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
    '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
    '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
]

SURROUNDING = [
    '第2問は2回読み。1回目で候補を2つに絞り、2回目で決め手を確認する二段構えが基本。',
    '「訂正の型」が最頻出。No, actually … / the other one / not A but B の後ろが答えになる。',
    '属性の絞り込み（色・形・サイズ・柄・数）は3条件以上重なる。1条件だけ合う絵はダミー。',
    '消去法の型もある。3つが否定されたら、残った1つが答え。',
    '値段・時刻・曜日は「安いほう」「間に合うほう」など優先条件で決まることが多い。',
    '設問の主語（the man / the woman）の取り違えが失点の定番。誰の行動を聞かれているか確認する。',
]

DEEP_DIVE = [
    '絵の違いを先に言語化しておくと、聞くべき1語が決まる。これだけで正答率が変わる。',
    '聞こえた単語がそのまま当てはまる絵はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。最後に合意した内容が答え。',
]


def published_only(sets: list[dict]) -> list[dict]:
    """
    実物イラストがある問だけを残す。

    セット番号・問番号は原文のまま保つ（詰め直さない）。
    詰め直すと、後から残りのセットを追加したときに
    既に保存してある学習記録の ID が別の問を指してしまう。
    番号を固定しておけば、追加は隔間を埋めるだけで済む。
    """
    out = []
    for s in sets:
        qs = [q for q in s['questions'] if (s['set'], q['q']) in PUBLISHED]
        if qs:
            out.append({**s, 'questions': qs})
    return out


def measured_bias_note(sets: list[dict]) -> str:
    """正解位置の実測値をヘッダに書き込む文を作る。

    ここを固定文にすると、収録する問が増えたときに
    「①12 / ②14 …」のような古い数字がファイルに残って嘘になる。
    実測して書くことで、数字とデータが必ず一致する。
    """
    import collections

    bias = collections.Counter(q['answerMark'] for s in sets for q in s['questions'])
    total = sum(bias.values())
    parts = ' / '.join(f'{m}{bias.get(m, 0)}問' for m in MARKS)
    top = max(bias.values()) if bias else 0
    rate = round(top / total * 100) if total else 0
    return (
        ' * 正解位置の実測（このファイルに収録した分だけを数えた値）\n'
        f' *   {parts}（計 {total}問）。'
        f'最頻位置だけ塗った場合の正答率 {rate}%。\n'
        ' *   実物イラストの問は並べ替えられないため、この偏りは\n'
        ' *   PDF 原文の偏りがそのまま出たもの。自前生成の絵に\n'
        ' *   置き換えた問から順に均していく。\n'
        ' *\n'
    )


def build(sets: list[dict]) -> str:
    # 正解位置の実測値をヘッダに差し込む（固定文にすると古い数字が残るため）
    anchor = ' * 第1問B・第3問との作りの違い\n'
    assert HEAD.count(anchor) == 1, 'ヘッダの差し込み位置が見つかりません'
    head = HEAD.replace(anchor, measured_bias_note(sets) + anchor)
    out = [head]
    names: list[str] = []

    for s in sets:
        no = s['set']
        sid = f'EL2_SET{no}'
        names.append(sid)
        diff = s['difficulty']
        qs = s['questions']

        # ---- audioTracks（turns つき） ----
        tracks = []
        for q in qs:
            base = f'q_el2_set{no}_{q["q"]}'
            script = '\n'.join(f'{t["who"]}: {tidy(t["text"])}' for t in q['turns'])
            turn_rows = ''.join(
                f"      {{ who: '{ts(t['who'])}', text: '{ts(tidy(t['text']))}' }},\n"
                for t in q['turns']
            )
            hint = f'{tidy(q["scene"])}（話者：{speaker_label(q["speakers"])}）'
            # MP3 が実在する問だけ audioUrl を出す。無ければ音声合成に任せる。
            url = audio_url_for(no, q['q'])
            audio_row = f"    audioUrl: '{url}',\n" if url else ''
            tracks.append(
                '  {\n'
                f"    subId: '{base}',\n"
                f"    label: '問{q['q']}',\n"
                f"    hint: '{ts(hint)}',\n"
                f'{audio_row}'
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
        # 選択肢の日本語説明は載せない（絵を読み取る練習にするため）。
        body = [
            f'第{no}回　第2問（{len(qs)}問・2回読み）　【難易度：{diff}】',
            '',
            '第2問では、2人の短い対話と英語の設問が2回読まれます。'
            'その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。',
            '',
            '【音源の聞き方】',
            '各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。'
            '本番は2回読みなので、まずは2回だけ聞いて答えを決めてください。',
            '',
            '【解き方のコツ】',
            '音声が流れる前に「場面」を読み、4枚の絵を見比べて「どこが違うか」を'
            '1語で言えるようにしておきます（色・数・位置・あり／なし）。'
            '違いが分かっていれば、聞き取るべき1語が決まります。'
            '第2問は「No, actually …」「the other one」のような訂正が最頻出なので、'
            '最初に聞こえた候補で決めないことが大切です。',
        ]
        for q in qs:
            body += [
                '',
                '────────────────────',
                f'問{q["q"]}（話者：{speaker_label(q["speakers"])}）',
                f'場面：{tidy(q["scene"])}',
                f'Question: {tidy(q["question"])}',
                f'イラスト①〜④から、対話と設問の内容に合うものを選びなさい。'
                f'（{figure_label(q["figureType"])}）',
            ]

        # 問番号に欠けがある場合（＝いまイラストがない問がある）は
        # 「なぜ問3がないのか」が学習者に分かるように一言添える。
        #
        # ★EXCLUDED だけを見てはいけない★
        # 欠ける理由は2通りある。
        #   (1) 絵はあるが選択肢と噛み合わない（EXCLUDED に理由を記録）
        #   (2) そもそもその問に対応する絵が PDF に無い
        # (2) を数え忘れると、問1・問3 だけが並んだセットで
        # 「問2 はどこへ行ったのか」が学習者に伝わらなくなる。
        # そこで実際に収録した問番号の裏返しとして求める。
        published_qs = {q['q'] for q in qs}
        missing = [n for n in (1, 2, 3) if n not in published_qs]
        if missing:
            body += [
                '',
                '※ '
                + '・'.join(f'問{m}' for m in missing)
                + ' はイラストの準備中のため、この回では出題していません。',
            ]

        text = '\n'.join(body)

        # ---- subQuestions ----
        subs = []
        for i, q in enumerate(qs):
            base = f'q_el2_set{no}_{q["q"]}'
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
                f"      imageUrl: '{IMG_DIR_REL}/el2_set{no}_q{q['q']}.jpg',\n"
                f"      imageCaption: '{ts(image_caption(q))}',\n"
                '      detailedExplanation: {\n'
                f"        theme: '{ts(theme_of(expl))}',\n"
                "        type: 'イラスト選択型（短い対話）',\n"
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
            '対話スクリプトと正解、そして PDF の解説をそのまま収録しています。'
            '各選択肢がどんな絵だったかも併せて載せているので、'
            '「どこを聞き分ければよかったか」を絵と対応させて確認できます。',
        ]
        for q in qs:
            mark = MARKS[q['answerIndex'] - 1]
            script = '\n'.join(f'{t["who"]}: {tidy(t["text"])}' for t in q['turns'])
            ex += [
                '',
                f'問{q["q"]}　正解は {mark}',
                f'場面：{tidy(q["scene"])}（話者：{speaker_label(q["speakers"])}）',
                f'スクリプト：{script}',
                f'Question: {tidy(q["question"])}',
                '選択肢のイラスト：',
            ]
            for j, o in enumerate(q['options']):
                ex.append(f'{MARKS[j]} {tidy(o)}')
            ex += [
                f'正解の選択肢：{mark} {tidy(q["answerText"])}',
                tidy(q['explanation']),
            ]
        explanation = '\n'.join(ex)

        cat = f'第{no}回 対話に合うイラストを選ぶ（{diff}）'
        out.append(
            f'const {sid}: ListeningProblem = {{\n'
            f"  id: 'q_el2_set{no}',\n"
            f"  category: '{ts(cat)}',\n"
            '  readCount: 2,\n'
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

    total = sum(len(s['questions']) for s in sets)
    out.append(
        f'/** 第2問の演習セット一覧（イラストが揃っている {len(sets)} セット {total} 問）。 */\n'
        'export const EL2_PROBLEMS: ListeningProblem[] = [\n'
        + ''.join(f'  {n},\n' for n in names)
        + '];\n'
    )
    return '\n'.join(out)


def main() -> int:
    all_sets = json.loads(SRC.read_text(encoding='utf-8'))

    # 実物イラストがある問だけを収録する（絵のない問は解けないため）。
    sets = published_only(all_sets)

    # 生成前に最低限の整合性を確認する（壊れたデータを TS に流さない）
    errors: list[str] = []
    for s in sets:
        if not s['questions']:
            errors.append(f'第{s["set"]}セット: 問が0問')
        for q in s['questions']:
            tag = f'第{s["set"]}セット問{q["q"]}'
            if len(q['options']) != 4:
                errors.append(f'{tag}: 選択肢が {len(q["options"])} 個')
                continue
            if not 1 <= q['answerIndex'] <= 4:
                errors.append(f'{tag}: 正解番号が範囲外')
                continue
            if q['options'][q['answerIndex'] - 1] != q['answerText']:
                errors.append(f'{tag}: 正解位置と本文が不一致')
            if q['answerMark'] != MARKS[q['answerIndex'] - 1]:
                errors.append(f'{tag}: マークと番号が不一致')
            if len(q['turns']) < 2:
                errors.append(f'{tag}: 対話が {len(q["turns"])} 行')
            if not q['question'].strip():
                errors.append(f'{tag}: 設問文が空')
            if not q['explanation'].strip():
                errors.append(f'{tag}: 解説が空')
    if errors:
        for e in errors:
            print(' -', e)
        return 1

    OUT.write_text(build(sets), encoding='utf-8')
    total = sum(len(s['questions']) for s in sets)
    grand = sum(len(s['questions']) for s in all_sets)
    print(f'{OUT.name}: {len(sets)} セット / {total} 問')
    print(f'  （PDF 全体は {len(all_sets)} セット {grand} 問。イラストが揃った分だけ収録）')

    import collections

    bias = collections.Counter(q['answerMark'] for s in sets for q in s['questions'])
    print('  正解位置:', dict(sorted(bias.items())))
    print(f'  必要な画像: public{IMG_DIR_REL}/el2_set<N>_q<M>.jpg （{total} 枚）')

    # 音源の実装状況を毎回はっきり出す（「入っているつもり」を防ぐ）
    with_audio = sum(
        1 for s in sets for q in s['questions'] if audio_url_for(s['set'], q['q'])
    )
    print(f'  MP3 を貼れた問: {with_audio} / {total} 問')
    if with_audio < total:
        print(
            f'    残り {total - with_audio} 問はブラウザの音声合成で読み上げる。'
            'MP3 を作るなら scripts/gen_q2_tts_scripts.py で台本を出してから、'
            f'public{AUDIO_DIR_REL}/ に置いてこのスクリプトを再実行する。'
        )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
