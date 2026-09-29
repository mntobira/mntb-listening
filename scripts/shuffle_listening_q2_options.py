#!/usr/bin/env python3
"""
第2問の正解位置の偏りを均す（選択肢の並び順だけを入れ替える）。

■ なぜ必要か
    配布 PDF の正解位置は 48 問で
        ① 13問 / ② 21問 / ③ 9問 / ④ 5問
    と偏っている。②を塗るだけで 44% 当たり、①②で 71% になる。
    音を聞かずに点が取れると リスニングの練習にならないので、
    選択肢の**並び順だけ**を入れ替えて正解位置をほぼ均等にする。
    第1問B（shuffle_q1b_options.py）・第3問（shuffle_listening_q3_options.py）と
    同じ方針。

■ 第1問B との決定的な違い ―「画像を切り貼りしない」
    第1問B では既に焼き込み済みの JPEG があったため、
    画像のマスを切り出して入れ替える必要があった（難しく、壊れやすい）。
    第2問は **まだ画像を作っていない**。
    そこで「画像生成プロンプトの Panel 記述ごと入れ替える」ことで、
    画像は最初から入れ替わった順番で生成される。
    画像処理が一切要らないので、ズレようがない。

■ 入れ替える対象（この4つを必ず同じ置換で動かす）
    1. options（選択肢の説明・日本語）
    2. answerIndex / answerMark（正解位置）
    3. imagePrompt の Panel 1〜4 の記述（＝生成される絵の並び）
    4. explanation 中の丸数字（①③ のような他選択肢への言及）

■ 「2×2の4枚から選択」型（34問）だけを入れ替える理由
    第2問には2つの絵の形式がある。
      A: 2×2 の4枚から選ぶ（34問）… プロンプトが Panel 1〜4 に分かれており、
         記述の入れ替えが機械的に安全にできる。
      B: 1枚の図の中に①〜④が配置される（14問）… 地図上のルートや
         座席表のように「①〜④が図の中のどこを指すか」が
         1つの文に溶けており、機械的に入れ替えると
         プロンプトが壊れて意味不明な絵になりかねない。
    ご要望「コードで形式的に作ると問題によっておかしくなる可能性があるから
    注意ね」に照らし、安全に入れ替えられる A 型だけを対象にする。
    B 型14問の正解位置（① 2 / ② 8 / ③ 1 / ④ 3）は固定なので、
    A 型34問の割り当てでその不足を埋め、全体でほぼ均等にする。

■ 使い方
    python3 scripts/shuffle_listening_q2_options.py            # 実行
    python3 scripts/shuffle_listening_q2_options.py --check    # 検証のみ
"""

from __future__ import annotations

import argparse
import collections
import itertools
import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'scripts' / 'data' / 'q2_parsed.json'
OUT = ROOT / 'scripts' / 'data' / 'q2_shuffled.json'

MARKS = '①②③④'

# 乱数を固定し、何度実行しても同じ結果になるようにする（再現性のため）。
SEED = 20260828

# ===================================================================
# ★配布 PDF のイラストをそのまま使う問（並べ替えを禁止する）★
# ===================================================================
#
# 当初この入れ替えは「画像はまだ作っていないから、プロンプトごと
# 入れ替えれば絵は最初から入れ替わった順で生成される」という前提で
# 作られていた（上の説明の「第1問B との決定的な違い」）。
#
# ところが後日、配布 PDF「第２問.pdf」から実物のイラストが手に入った。
# そこで実測したところ、
#
#     4枚組の画像は 1254×1254 px で、各マスの左上に ①②③④ が
#     ★絵として焼き込まれている★
#     （マス左上 22% の領域の暗ピクセル率 ≈10%、
#       その右隣の帯は ≈0.3% ＝ ほぼ白紙）
#
# ことが分かった。番号が絵の一部なので、
#
#   ・マスを切り貼りして並べ替えると、番号ごと動いてしまう
#     （②のマスが①の位置に来ても、そこには②と描かれている）
#   ・逆にデータ側だけ並べ替えると、絵の②と選択肢の②が食い違う
#
# つまり「実物の絵を使うなら、データは PDF の並びのままにするしかない」。
# 絵を選ぶ大問で並びが1つずれると、答えが無い／2つある問題になり、
# 学習の妨げになるどころか誤答を覚えさせてしまう。
#
# そのため、実物のイラストを収録する問はここに列挙して
# 並べ替えの対象から外す（＝ PDF 原文の並びで固定する）。
# 残りの問は従来どおり並べ替え、後から自前生成のイラストを
# 入れ替え後の並びで作る。
#
# ★ここに足した問は、必ず配布 PDF の実物イラストを使うこと。★
# 自前生成の絵を使う問をここに入れると、偏りを均す効果が薄れる。
#
# 単位は「セット」ではなく「(セット番号, 問番号)」にしている。
# 実物イラストを1枚ずつ目で確認したところ、同じセットの中でも
# 使える絵と使えない絵が混在していたため（下の EXCLUDED を参照）。
#
# ★2026-08-30 の増補（29問 → 39問）★
# 配布 PDF の46枚を1枚ずつ開いて①〜④の中身を実測し、
# scripts/data/q2_figure_audit.md に台帳として残した。
# その結果、次の2種類の問を新たに公開できるようになった。
#
#   (A) 見出しと中身がずれていた問（対応表で貼り替えれば使える）
#       … 3-2 / 4-2 / 6-3 / 14-3 / 15-2 の5問。
#          下の ILLUSTRATION_SOURCE_LABEL を参照。
#
#   (B) 絵は使えるが選択肢が絵と噛み合っていなかった問
#       … 7-3 / 8-3 / 11-1 / 13-1 / 16-2 の5問。
#          「絵を作り直す」のではなく「テキストを絵に合わせて書き直す」
#          方針を採り、scripts/fix_q2_text_to_figures.py で
#          選択肢・対話・設問・解説を書き換えた。
#          書き換えの根拠は scripts/q2_figure_fixes.py に1問ずつ残してある。
#
# ★(B) の5問も並べ替えてはいけない★
# 絵に ①②③④ が焼き込まれている以上、データ側だけ動かすと食い違う。
# 書き換え後の選択肢は絵の①〜④の並びに合わせてあるので、
# ここに登録して並べ替えの対象から外す。
PDF_ILLUSTRATION_QUESTIONS = frozenset({
    (1, 1), (1, 2), (1, 3),
    (2, 1), (2, 3),
    (3, 2),
    (4, 1), (4, 2), (4, 3),
    (5, 2), (5, 3),
    (6, 1), (6, 2), (6, 3),
    (7, 1), (7, 3),
    (8, 1), (8, 3),
    (9, 1), (9, 2), (9, 3),
    (10, 1), (10, 3),
    (11, 1), (11, 2), (11, 3),
    (12, 1), (12, 2), (12, 3),
    (13, 1), (13, 2), (13, 3),
    (14, 1), (14, 3),
    (15, 1), (15, 2), (15, 3),
    (16, 2),
})

# ===================================================================
# ★絵の見出し（S◯Q◯）と問番号が食い違っている問★
# ===================================================================
# 配布 PDF の絵は「imagePrompt（プロンプト）」どおりに描かれている。
# ところが類題集 PDF の側で、Part1（場面・選択肢）と
# Part3（画像生成プロンプト）が一部ずれて綴じられているため、
# 「S3Q2 の見出しが付いた絵」が実際には第4セット問2 の絵、
# というような食い違いが起きている。
#
# 46枚すべてを開いて①〜④の中身を1つずつ選択肢と突き合わせ、
# 4つとも一致した組だけを下に登録した（内容で確定させた対応）。
#
#   キー   … 絵を貼りたい問（＝テキストの側の (セット, 問)）
#   値     … その絵が実際に入っている PDF の見出し
#
# ★下の3問は「対応表は作ったが、まだ公開していない」★
#   PDF_ILLUSTRATION_QUESTIONS には入れていない。理由は2つある。
#     (1) 見出しと中身がずれている問なので、他の29問（見出しどおりに
#         中身が一致していた問）より1段だけ確度が低い。
#     (2) この3問はいずれも正解が②で、入れると公開分の②が
#         17/32＝53% になり「②を塗れば半分当たる」状態になる。
#         これは tests/englishListeningQ2Sets.test.ts が
#         「①〜④のどれかに全部集まっていない（<50%）」で
#         意図的に止めている状態。耳を使わずに解けてしまう。
#   絵を自前生成に置き換えて並べ替えられるようにしたうえで、
#   正解位置を均してから公開する。対応表はここに残してあるので、
#   そのときに絵を取り違える心配はない。
#
#   (3, 2) ホテルの部屋の眺望を選ぶ問。
#          S4Q2 の見出しの絵が ①海・②山・③街・④中庭 で4つとも一致。
#   (4, 2) ごみの分別で使う箱を選ぶ問。
#          S3Q2 の見出しの絵が ①ペットボトル・②ワイングラス・③紙・④缶 で一致。
#          （(3,2) と (4,2) はちょうど入れ替わっている）
#   (6, 3) ホームパーティーの飾り付けの位置を選ぶ問。
#          S7Q2 の見出しの絵が ①ソファ上の旗・②風船・
#          ③ドア上の花輪・④ソファの肘掛け で一致。
#          （旗と風船の2箇所を問う元の選択肢のままでは噛み合わないため、
#            この問は「どの飾りをどこに付けるか」を1箇所ずつ問う形に
#            fix_q2_text_to_figures.py で書き直している）
#   (14, 3) 旅行の持ち物を選ぶ問。
#          S14Q2 の見出しの絵がスーツケースの中身4通りで一致。
#   (15, 2) 家族写真の中から母親を選ぶ問。
#          S14Q3 の見出しの絵（立ち姿の7人＋赤ちゃん）が
#          ①左端の女性・②赤ちゃんを抱く女性・③後ろの男性・
#          ④後ろ左の女性 で4つとも一致。
#          S10Q2 にも似た家族写真があるが、そちらはソファに座った6人＋赤ちゃんで
#          ①が祖母を指しており、選択肢①「左端の女性」と噛み合わない。
#
# ★ここを実測で訂正した経緯（本番に出ていた取り違え）★
#   public/listening_q2/el2_set14_q3.jpg には
#   「旅行の持ち物」の問なのに家族写真の絵が入っていた。
#   見出し S14Q3 の絵が家族写真で、スーツケースの絵は
#   見出し S14Q2 の側に入っていたため、見出しを信じて貼ると入れ替わる。
#   46枚すべての中身を実測して対応を取り直した（台帳は
#   scripts/data/q2_figure_audit.md）。
#
# ここに登録した「値」の位置にある絵は、その問には使わない。
# 例：S15Q2 の見出しの絵（靴箱の壁）は第15セット問2 には使わない。
ILLUSTRATION_SOURCE_LABEL: dict[tuple[int, int], tuple[int, int]] = {
    (3, 2): (4, 2),
    (4, 2): (3, 2),
    (6, 3): (7, 2),
    (14, 3): (14, 2),
    (15, 2): (14, 3),
    (16, 2): (15, 2),
}

# ===================================================================
# ★実物イラストがあるのに使えなかった問（記録）★
# ===================================================================
# 上のセット（1・6・9・11・12・13）の絵を1マスずつ拡大して
# 選択肢の文言と突き合わせた結果、次の3問は絵と選択肢が
# 噛み合っていなかったため、公開対象から外した。
# 「コードで形式的に作るとおかしくなる」ご指摘のとおり、
# 4枚組だからといって機械的に採用してはいけない実例。
#
#   (6, 3) 別問題の絵が入っている
#          選択肢は「ソファ上に旗／テーブルの角に風船」など
#          ホームパーティーの飾り付けの位置を選ぶ問なのに、
#          PDF のその頁の絵は誕生日パーティーで4人の男の子に
#          ①〜④が振られた絵（＝第5セット問3 の1枚図版）だった。
#
#   (11, 1) 絵の本数が選択肢と合わない
#          ③の絵はジュース6本＋水7本＝13本だが選択肢③は「6本＋6本＝12本」。
#          ④の絵は12本＋12本＝24本だが選択肢④は「10本＋10本＝20本」。
#          しかも③が正解なので、絵を見て数えると正解が消える。
#
#   (13, 1) ①〜④がルートではなく地点に付いている
#          選択肢は4通りの道順を選ぶ問だが、絵に描かれた破線ルートは1本だけで、
#          ①〜④は家・湖・橋の右・行き止まりという「場所」を指していた。
#
#   (7, 3) ②と③が見分けられない
#          飛行機の座席を選ぶ問。①は窓そのもの、④は非常口横で問題ないが、
#          ②と③はどちらも「3席の真ん中の席」に丸が付いており、
#          壁との間隔がわずかに違うだけで区別できない。
#          選択肢は②通路側・③真ん中なので、通路側が絵に描かれていない。
#
#   (8, 3) ①と②が同じ内容になっている
#          引越しの荷物を運ぶ問。①も②も
#          BOOKS→BEDROOM・CLOTHES→CLOSET・KITCHEN→KITCHEN で、
#          矢印の傾きしか違わない（②は斜めに描いてあるだけ）。
#          ①が正解なので、絵を見ると正解が2つになってしまう。
#
#   (16, 2) ③の絵の位置が選択肢と合わない
#          靴箱の位置を選ぶ問。絵は A・B・C の3列×1〜4段で、
#          ③は「C列3段目」に付いているが選択肢③は「B列 上から3番目 右側」。
#          ③が正解なので、絵を見て数えると正解が消える（(11,1) と同型）。
#
# ------------------------------------------------------------------
# 【2026-08-30 解消】上の6問はいずれも「絵を作り直す」のではなく
# 「文章側（場面・対話・設問・選択肢・解説）を絵に合わせて書き直す」ことで解決した。
#   → 書き換えの実体は scripts/q2_figure_fixes.py（FIXES）
#   → 適用スクリプトは scripts/fix_q2_text_to_figures.py
#   → 6問はすべて PDF_ILLUSTRATION_QUESTIONS に入り、実物イラストを収録する。
# 画像生成は一切していない（クレジットを使わない方針）。
# したがって除外リストは空。上のコメントは経緯の記録として残す。
# ------------------------------------------------------------------
EXCLUDED_PDF_ILLUSTRATIONS: frozenset[tuple[int, int]] = frozenset()

# ===================================================================
# ★画像生成で新しく作った絵を使う問（2026-09-28〜）★
# ===================================================================
# 配布 PDF に使える絵が無く、出題できていなかった10問
#   (2,2) (3,1) (3,3) (5,1) (7,2) (8,2) (10,2) (14,2) (16,1) (16,3)
# を、画像生成（利用者の指示で「クレジットを使ってちゃんと作る」）で1問ずつ描き、
# 目で①〜④が選択肢どおりか確認できたものから下の表に登録して公開する。
#
# 並び順（perm[i] = 新しい i 番目に置く元の選択肢の番号）はここで固定し、乱数の並べ替えから外す
#（絵は下の並びで描いてあるので、動かすと絵と食い違う）。
# 正解位置は公開全体で ①〜④ が偏らないように選ぶ（公開済み38問は ①9 ②18 ③9 ④2 で ④ が少ない）。
#
#   (16, 1): public/listening_q2/el2_set16_q1.jpg（2026-09-28 生成・確認済み）
#            ①チョコ ②苺 ③チーズ ④桃 → 正解 ④
#   (14, 2): el2_set14_q2.jpg ①プードル♂ ②プードル♀ ③テリア♂ ④テリア♀ → 正解 ④
#   (3, 3):  el2_set3_q3.jpg  ①小ゴマ ②大ポピー ③小ポピー ④大ゴマ → 正解 ①
#   (8, 2):  el2_set8_q2.jpg  ①バラ×リボン ②ヒマワリ×リボン ③ユリ＋リボン ④ヒマワリ＋リボン → 正解 ④
#            （1回目は全部にリボンが付いて解けない絵だったので不採用・描き直し）
#   (16, 3): el2_set16_q3.jpg ①重・大 ②軽・小 ③軽・大 ④重・小 → 正解 ③（3回目で採用。1回目は大小が曖昧、2回目は④に2本描かれていた）
#   (2, 2):  el2_set2_q2.jpg  1枚の店内見取り図。①窓際2人席 ②奥ボックス4人 ③中央丸テーブル ④カウンター → 正解 ③
#   (3, 1):  el2_set3_q1.jpg  1枚の週間予定表。①火PM(テニス) ②水AM(授業) ③木AM ④木PM → 正解 ④
#   (10, 2): el2_set10_q2.jpg 1枚の図に時間割4つ。①月体育・水英語なし ②火金体育・水英語なし ③月木体育・毎日英語 ④火金体育・毎日英語 → 正解 ②
#   (7, 2):  el2_set7_q2.jpg  1枚の図に順路4本。①宇宙→海→恐竜→ロボ ②海→宇宙→恐竜(ロボなし) ③恐竜→海→宇宙→ロボ ④海→ロボ→宇宙→恐竜 → 正解 ②（3回目で採用）
#   (5, 1):  el2_set5_q1.jpg  ①伊・初心者 ②伊・上級 ③仏・初心者 ④和・初心者 → 正解 ①
#
# 未登録（絵の生成待ち。台本・録り直しPDFは用意済み）：
#   なし（48問すべて絵あり）
DRAWN_ILLUSTRATION_PERMS: dict[tuple[int, int], tuple[int, int, int, int]] = {
    (16, 1): (0, 1, 2, 3),   # 正解 ④ 桃のケーキ
    (14, 2): (0, 1, 2, 3),   # 正解 ④ 長毛ストレートの小型テリア(メス)
    (3, 3): (3, 0, 1, 2),    # 正解 ① ゴマ付きの小さな丸パン
    (8, 2): (0, 2, 3, 1),    # 正解 ④ ヒマワリ柄・しおりリボンあり
    (5, 1): (0, 1, 2, 3),    # 正解 ① 初心者向けイタリア料理本
    (16, 3): (1, 2, 0, 3),   # 正解 ③ 軽量・ヘッド大きめ
    (2, 2): (0, 1, 2, 3),    # 正解 ③ 中央の丸テーブル（1枚の図）
    (3, 1): (0, 1, 2, 3),    # 正解 ④ 木曜午後（1枚の図）
    (10, 2): (0, 1, 2, 3),   # 正解 ② 火・金が体育、水曜は英語なし
    (7, 2): (0, 1, 2, 3),    # 正解 ② 海→宇宙→恐竜（ロボットなし）
}
DRAWN_ILLUSTRATION_QUESTIONS = frozenset(DRAWN_ILLUSTRATION_PERMS)

# アプリに収録する問 ＝ 配布PDFの実物イラスト ＋ 新しく生成した絵
PUBLISHED_QUESTIONS = PDF_ILLUSTRATION_QUESTIONS | DRAWN_ILLUSTRATION_QUESTIONS

# Panel 記述の切り出し。「Panel 1: … Panel 2: …」を4つに分ける。
RE_PANEL = re.compile(r'Panel\s*([1-4])\s*:\s*(.*?)(?=\s*Panel\s*[1-4]\s*:|$)', re.S)


def is_grid(q: dict) -> bool:
    """2×2の4枚から選ぶ型（A型）かどうか。"""
    return '2×2' in q['figureType']


def is_locked(set_no: int, q_no: int) -> bool:
    """配布 PDF の実物イラストを使う問（＝並べ替え禁止）かどうか。"""
    return (set_no, q_no) in PDF_ILLUSTRATION_QUESTIONS or (set_no, q_no) in DRAWN_ILLUSTRATION_QUESTIONS


def split_prompt(prompt: str) -> tuple[str, list[str]] | None:
    """
    プロンプトを (共通の前置き, [Panel1〜4の記述]) に分ける。
    Panel が4つ揃っていなければ None（＝入れ替え対象にしない）。
    """
    head_end = prompt.find('Panel 1:')
    if head_end < 0:
        return None
    head, body = prompt[:head_end], prompt[head_end:]
    found = RE_PANEL.findall(body)
    if [n for n, _ in found] != ['1', '2', '3', '4']:
        return None
    return head, [t.strip() for _, t in found]


def join_prompt(head: str, panels: list[str]) -> str:
    """(前置き, Panel記述4つ) を1本のプロンプトに戻す。"""
    body = ' '.join(f'Panel {i + 1}: {panels[i]}' for i in range(4))
    return (head.rstrip() + ' ' + body).strip()


def apply_perm(q: dict, perm: tuple[int, int, int, int]) -> dict:
    """
    perm[i] = 「新しい i 番目には元の perm[i] 番目を置く」という置換を適用する。

    options / imagePrompt の Panel / answerIndex / explanation の丸数字を
    すべて同じ置換で書き換えるので、4者が食い違うことは原理的に起きない。
    """
    q = json.loads(json.dumps(q))  # 元を壊さないよう深いコピー

    old_options = q['options']
    q['options'] = [old_options[perm[i]] for i in range(4)]

    split = split_prompt(q['imagePrompt'])
    if split is not None:
        head, panels = split
        q['imagePrompt'] = join_prompt(head, [panels[perm[i]] for i in range(4)])

    # 元の正解が新しい何番目に来たか
    old_answer = q['answerIndex'] - 1
    new_answer = perm.index(old_answer)
    q['answerIndex'] = new_answer + 1
    q['answerMark'] = MARKS[new_answer]
    q['answerText'] = q['options'][new_answer]

    # 解説が他の選択肢を丸数字で指している場合も同じ置換で書き換える
    # （旧番号 → 新番号。置換途中で二重に書き換えないよう一括で行う）
    old_to_new = {perm[i]: i for i in range(4)}
    q['explanation'] = re.sub(
        r'[①②③④]',
        lambda m: MARKS[old_to_new[MARKS.index(m.group())]],
        q['explanation'],
    )

    q['shuffled'] = True
    q['shufflePerm'] = list(perm)
    return q


def plan_targets(grid_count: int, fixed: collections.Counter) -> list[int]:
    """
    A型 grid_count 問に割り当てる「正解位置」の一覧を作る。

    B型（固定）の分布 fixed を踏まえ、全体がなるべく均等になるよう
    A型側で不足分を埋める。
    """
    total = grid_count + sum(fixed.values())
    targets: list[int] = []
    # 各位置の目標本数（全体を均等に割る）
    base = [total // 4] * 4
    for i in range(total % 4):
        base[i] += 1
    for i in range(4):
        need = base[i] - fixed[MARKS[i]]
        targets += [i] * max(0, need)
    # 端数の調整（丸めで合計がずれた場合は少ない位置から足す／多い位置から引く）
    while len(targets) > grid_count:
        c = collections.Counter(targets)
        targets.remove(max(c, key=lambda k: c[k]))
    while len(targets) < grid_count:
        c = collections.Counter(targets)
        targets.append(min(range(4), key=lambda k: c[k]))
    return targets


def shuffle(sets: list[dict]) -> list[dict]:
    rng = random.Random(SEED)

    grid: list[tuple[int, int]] = []
    fixed: collections.Counter = collections.Counter()
    for s in sets:
        for q in s['questions']:
            # 並べ替えられるのは
            #   (1) 2×2型で、(2) プロンプトが Panel 1〜4 に分かれており、
            #   (3) 配布 PDF の実物イラストを使わない問
            # の3条件を満たす問だけ。
            # (3) を外すと、絵に焼き込まれた ①②③④ とデータの並びが
            # 食い違って「答えの無い問題」になる（上の説明を参照）。
            if (
                is_grid(q)
                and split_prompt(q['imagePrompt']) is not None
                and not is_locked(s['set'], q['q'])
            ):
                grid.append((s['set'], q['q']))
            else:
                fixed[q['answerMark']] += 1

    targets = plan_targets(len(grid), fixed)
    rng.shuffle(targets)

    # すべての置換パターン（24通り）を用意しておく
    perms = list(itertools.permutations(range(4)))

    out = json.loads(json.dumps(sets))
    index = {(s['set'], q['q']): q for s in out for q in s['questions']}

    for (key, target) in zip(grid, targets):
        q = index[key]
        old_answer = q['answerIndex'] - 1
        # 「元の正解が新しい target 番目に来る」置換だけを候補にする
        candidates = [p for p in perms if p.index(old_answer) == target]
        # 恒等置換（並びが変わらない）は最後の手段にして、見た目を必ず変える
        non_identity = [p for p in candidates if p != (0, 1, 2, 3)]
        chosen = rng.choice(non_identity or candidates)
        index[key].update(apply_perm(q, chosen))

    # プログラム描画の問は、決めた並びに固定する（絵はこの並びで描く）
    for key, perm in DRAWN_ILLUSTRATION_PERMS.items():
        index[key].update(apply_perm(index[key], perm))

    return out


def verify(before: list[dict], after: list[dict]) -> list[str]:
    """
    入れ替えの結果が壊れていないことを確かめる。

    ■ ここで落とすもの（重要な順）
      1. 選択肢の集合が変わっていないこと（＝説明を作ったり消したりしていない）
      2. 正解の中身が同じであること（位置だけが変わったこと）
      3. Panel 記述の集合が変わっていないこと（＝絵の内容が増減していない）
      4. 選択肢と Panel の対応が保たれていること
    """
    errors: list[str] = []
    b_index = {(s['set'], q['q']): q for s in before for q in s['questions']}

    for s in after:
        for q in s['questions']:
            tag = f'第{s["set"]}セット問{q["q"]}'
            b = b_index[(s['set'], q['q'])]

            if sorted(q['options']) != sorted(b['options']):
                errors.append(f'{tag}: 選択肢の集合が変わっている')
            if q['options'][q['answerIndex'] - 1] != q['answerText']:
                errors.append(f'{tag}: 正解位置と本文が不一致')
            if q['answerText'] != b['answerText']:
                errors.append(
                    f'{tag}: 正解の中身が変わっている\n'
                    f'    before: {b["answerText"]}\n    after : {q["answerText"]}'
                )
            if q['answerMark'] != MARKS[q['answerIndex'] - 1]:
                errors.append(f'{tag}: マークと番号が不一致')

            sa, sb = split_prompt(q['imagePrompt']), split_prompt(b['imagePrompt'])
            if (sa is None) != (sb is None):
                errors.append(f'{tag}: プロンプトの Panel 構造が壊れた')
            elif sa is not None and sb is not None:
                if sorted(sa[1]) != sorted(sb[1]):
                    errors.append(f'{tag}: Panel 記述の集合が変わっている')
                if sa[0].strip() != sb[0].strip():
                    errors.append(f'{tag}: プロンプトの前置きが変わっている')
                # 選択肢と Panel の対応（元の対応表と突き合わせる）
                if 'shufflePerm' in q:
                    perm = q['shufflePerm']
                    for i in range(4):
                        if q['options'][i] != b['options'][perm[i]]:
                            errors.append(f'{tag}: 選択肢の置換が perm と不一致')
                        if sa[1][i] != sb[1][perm[i]]:
                            errors.append(f'{tag}: Panel の置換が perm と不一致')

            # 解説に残った丸数字が「正解と同じ番号」を他選択肢として
            # 指していないか（置換ミスの検出）
            marks = set(re.findall(r'[①②③④]', q['explanation']))
            if q['answerMark'] in marks and len(marks) > 0:
                errors.append(
                    f'{tag}: 解説が正解と同じ番号 {q["answerMark"]} を'
                    f'誤答として挙げている可能性'
                )
    return errors


def report(label: str, sets: list[dict]) -> None:
    c = collections.Counter(q['answerMark'] for s in sets for q in s['questions'])
    total = sum(c.values())
    parts = ' / '.join(f'{MARKS[i]} {c[MARKS[i]]}問' for i in range(4))
    top = max(c.values()) / total * 100
    print(f'  {label}: {parts}  （最頻位置だけ塗った場合の正答率 {top:.0f}%）')


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true', help='検証のみ（ファイルを書かない）')
    args = ap.parse_args()

    before = json.loads(SRC.read_text(encoding='utf-8'))
    after = shuffle(before)

    errors = verify(before, after)
    print('正解位置の分布')
    report('入れ替え前', before)
    report('入れ替え後', after)

    total_q = sum(len(s['questions']) for s in after)
    grid = sum(1 for s in after for q in s['questions'] if q.get('shuffled'))
    print(
        f'  入れ替えた問: {grid} 問（2×2型）/ '
        f'固定: {total_q - grid} 問'
        f'（うち {len(PDF_ILLUSTRATION_QUESTIONS)} 問は配布PDFの実物イラストを使う問）'
    )

    # 先に公開する問（実物イラストがある問）だけの分布も出す。
    # 全体が均等でも、先に公開する分だけを見ると偏っている場合があるため。
    published = [
        {
            'set': s['set'],
            'questions': [
                q for q in s['questions'] if is_locked(s['set'], q['q'])
            ],
        }
        for s in after
    ]
    published = [s for s in published if s['questions']]
    if published:
        report('うち先行公開ぶん', published)

    if errors:
        print(f'\n検証で {len(errors)} 件の問題を検出しました:')
        for e in errors:
            print(' -', e)
        return 1

    if args.check:
        print('\n--check のためファイルは書きませんでした。')
        return 0

    OUT.write_text(json.dumps(after, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'\n{OUT.relative_to(ROOT)} を書きました。')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
