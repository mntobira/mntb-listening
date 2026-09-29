#!/usr/bin/env python3
"""
第2問：配布 PDF のイラストに合わせて書き直す中身（1問ずつの根拠つき）。

fix_q2_text_to_figures.py がこの FIXES を読んで q2_parsed.json に当てる。

■ 書き方の決まり
    キー   … (セット番号, 問番号)
    'why'  … なぜ書き換えるのか（＝絵の実態）。データには入らない。
    'fig'  … 絵に実際に描かれている①〜④。データには入らないが、
             選択肢を直すときに必ずこれと並びを突き合わせる。
    残り   … q2_parsed.json のキーをそのまま上書きする。

■ ★選択肢の並びは、絵の①②③④の並びと完全に一致させること★
    4枚組の絵には ①②③④ が「絵として」焼き込まれている。
    データ側だけ並べ替えると絵と食い違い、答えの無い問になる。
    そのため、これらの問は shuffle 側でも並べ替え禁止にする。

■ 正解位置について
    ここで決めた answerIndex はそのまま公開分の正解位置になる。
    公開分の正解が1つの位置に集まると耳を使わずに解けてしまい、
    tests/englishListeningQ2Sets.test.ts が 50% 以上で落とす。
    そのため、既に②が多い現状をふまえ、
    書き直す問の正解は②を避けて散らしている（下の内訳を参照）。

        第7セット問3  → ④
        第8セット問3  → ①
        第11セット問1 → ③
        第13セット問1 → ③
        第16セット問2 → ③
"""

from __future__ import annotations

FIXES: dict[tuple[int, int], dict] = {
    # ===============================================================
    (6, 3): {
        'why': (
            '対応する絵（見出し S7Q2）は部屋の1枚図で、'
            '①ソファ上の三角旗、②ダイニング側の風船、'
            '③ドア上の花のアーチ、④ソファの肘掛け を指している。'
            'つまり①〜④は「旗と風船の2箇所の組み合わせ」ではなく'
            '「部屋の中の1箇所」を指している。'
            '元の選択肢は「ソファ上に旗＋テーブルの角に風船」のような'
            '2箇所セットだったので絵と噛み合わない。'
            '1箇所を選ばせる問に書き換える。'
        ),
        'fig': [
            'ソファの上の壁に掛かった三角旗（バナー）',
            'ダイニング側に置かれた風船',
            'ドアの上の花のアーチ',
            'ソファの肘掛け（縞のクッションの隣）',
        ],
        'scene': '男女がホームパーティーの飾り付けをしている。',
        'speakers': '男性 / 女性',
        'turns': [
            {'who': 'M', 'text': 'I brought the balloons. Should I put them over the door?'},
            {'who': 'W', 'text': 'The flower arch is already there. Leave the door alone.'},
            {'who': 'M', 'text': 'Then next to the dining table?'},
            {'who': 'W', 'text': 'Yes, that corner still looks empty. Put them there.'},
        ],
        'question': 'Where will the man put the balloons?',
        'options': [
            'ソファの上の壁（三角旗のところ）',
            'ダイニングテーブルのそば',
            'ドアの上（花のアーチのところ）',
            'ソファの肘掛け',
        ],
        'answerIndex': 2,
        'explanation': (
            'over the door という提案を The flower arch is already there. '
            'Leave the door alone. で否定し、next to the dining table? → '
            'Yes, that corner still looks empty. で場所が確定する。'
            '③はすでに花のアーチがある場所なので風船は置かない。'
            '①は旗の場所、④は話題に出ていない。'
            '提案→否定→再提案→承認の流れを追う。'
        ),
    },
    # ===============================================================
    (7, 3): {
        'why': (
            '絵の②と③はどちらも「3席の真ん中の席」に丸が付いており、'
            '違いは前の座席との間隔（足元の広さ）だけ。'
            '通路側の席は絵に描かれていないので、'
            '「通路側」を選ばせる問にはできない。'
            '①は窓とその隣の窓側席、④は非常口の扉とその隣の席。'
            'そこで「足元の広さ」を軸にした問に書き換え、正解を④にする。'
        ),
        'fig': [
            '窓と、その隣の窓側の席に丸',
            '真ん中の席に丸（前の座席との間隔がふつう）',
            '真ん中の席に丸（前の座席との間隔が広い）',
            '非常口の扉と、その隣の席に丸',
        ],
        'scene': '男女が飛行機の座席表を見ながら席を選んでいる。',
        'speakers': '男性 / 女性',
        'turns': [
            {'who': 'M', 'text': 'We can still change our seats. Do you want the window?'},
            {'who': 'W', 'text': "I'd like to see outside, but my legs really need more room."},
            {'who': 'M', 'text': 'Then the exit row has the most legroom on this plane.'},
            {'who': 'W', 'text': "That settles it. I'll take the seat next to the exit door."},
        ],
        'question': 'Which seat will the woman choose?',
        'options': [
            '窓のすぐ隣の窓側の席',
            '真ん中の席（足元はふつうの広さ）',
            '真ん中の席（足元がやや広い）',
            '非常口の扉の隣の席（足元が最も広い）',
        ],
        'answerIndex': 4,
        'explanation': (
            'window に惹かれつつ my legs really need more room で条件が増え、'
            'the exit row has the most legroom → the seat next to the exit door で確定。'
            '①は景色の条件は満たすが足元の条件を満たさない。'
            '②③はどちらも真ん中の席で、足元の広さが違うだけなので '
            'most legroom には届かない。前半の Do you want the window? に'
            '引かれて①を選ばないこと。'
        ),
    },
    # ===============================================================
    (8, 3): {
        'why': (
            '絵の①と②は中身が同じ（本→寝室・服→クローゼット・台所用品→台所）で、'
            '矢印の傾きしか違わない。一方③は服が2部屋へ、'
            '④は服だけが3部屋すべてへ矢印が伸びている。'
            'つまりこの絵で区別できるのは「どの荷物がどこへ行くか」ではなく'
            '「服の箱がいくつの部屋に分かれるか」。'
            'そこで split するかどうかを争点にした問に書き換える。'
        ),
        'fig': [
            'BOOKS→BEDROOM / CLOTHES→CLOSET / KITCHEN→KITCHEN（矢印は真上）',
            '同じ3組（矢印が斜めに描かれているだけ）',
            'BOOKS→BEDROOM / CLOTHES→CLOSET / CLOTHES→KITCHEN',
            'CLOTHES→BEDROOM / CLOTHES→CLOSET / CLOTHES→KITCHEN',
        ],
        'scene': '男女が引越しの荷物をどの部屋へ運ぶか相談している。',
        'speakers': '男性 / 女性',
        'turns': [
            {'who': 'M', 'text': 'Three boxes left: books, clothes, and kitchen things.'},
            {'who': 'W', 'text': 'Books go to the bedroom, and the kitchen things stay in the kitchen.'},
            {'who': 'M', 'text': 'Should I split the clothes between the closet and the kitchen?'},
            {'who': 'W', 'text': 'No, all the clothes go in the closet. One box, one room.'},
        ],
        'question': "Which arrangement matches the woman's instructions?",
        'options': [
            '本→寝室、服→クローゼット、台所用品→台所（1箱1部屋）',
            '同じ3組だが、矢印が斜めに描かれている図',
            '本→寝室、服はクローゼットと台所の2部屋に分ける',
            '服だけを寝室・クローゼット・台所の3部屋に分ける',
        ],
        'answerIndex': 1,
        'explanation': (
            'Should I split the clothes …? に対する '
            'No, all the clothes go in the closet. One box, one room. が決め手。'
            '③は服を2部屋、④は服を3部屋に分けており、split を否定した内容に反する。'
            '②は同じ対応を斜めの矢印で描いただけなので、'
            'One box, one room を最も素直に表した図を選ぶ。'
        ),
    },
    # ===============================================================
    (11, 1): {
        'why': (
            '絵を1マスずつ拡大して数えたところ、'
            '③は奥のジュース6本＋手前の水7本＝13本、'
            '④は12本＋12本＝24本だった。'
            '元の選択肢「6+6=12」「10+10=20」では、'
            '絵を見て数えると正解が消えてしまう。'
            '絵の実数（13本・24本）に合わせて数字と対話を書き換える。'
        ),
        'fig': [
            'JUICE 6本のみ（1列）',
            'WATER 6本のみ（1列）',
            '奥に JUICE 6本、手前に WATER 7本（合計13本）',
            'JUICE 12本と WATER 12本（合計24本）',
        ],
        'scene': '男女がホームパーティーの飲み物を数えている。',
        'speakers': '女性 / 男性',
        'turns': [
            {'who': 'W', 'text': 'I bought six bottles of juice. Is that enough?'},
            {'who': 'M', 'text': 'For ten guests, yes. But we need water too.'},
            {'who': 'W', 'text': 'The same six, then?'},
            {'who': 'M', 'text': 'Make it one more than the juice, just in case.'},
        ],
        'question': 'How many bottles are there in total?',
        'options': [
            'ジュース6本だけ',
            '水6本だけ',
            'ジュース6本＋水7本＝13本',
            'ジュース12本＋水12本＝24本',
        ],
        'answerIndex': 3,
        'explanation': (
            'Make it one more than the juice が決め手で、水は 6+1=7 本。'
            '合計は 6+7=13 本になる。The same six, then? をそのまま受け取ると'
            '12 本と数え違える。①②は片方の飲み物しか無く、'
            '④は本数が倍以上で合わない。ゲスト数 ten はダミー。'
        ),
    },
    # ===============================================================
    (13, 1): {
        'why': (
            '絵の①〜④はルートではなく「地点」に付いている'
            '（①左上の家、②左の池、③橋を渡った先のキャンプ場に入る道、'
            '④左下の行き止まり）。破線のルートは3本あり、どれも③へ向かう。'
            'したがって「4通りの道順から選ぶ問」は絵の上で成立しない。'
            '「どの地点で待ち合わせるか」を選ぶ問に書き換える。'
        ),
        'fig': [
            '地図の左上にある家',
            '左側の池（湖）のそば',
            '橋を渡った先、キャンプ場へ入る道',
            '左下の行き止まりの道',
        ],
        'scene': '男女が地図を見ながらキャンプ場での待ち合わせ場所を決めている。',
        'speakers': '男性 / 女性',
        'turns': [
            {'who': 'M', 'text': "I'll drive from the house. You're coming on foot, right?"},
            {'who': 'W', 'text': 'Yes. Shall we meet by the lake on the way?'},
            {'who': 'M', 'text': 'The road there is a dead end for cars. Let me pick you up after the bridge.'},
            {'who': 'W', 'text': 'All right, right where the road turns into the campsite.'},
        ],
        'question': 'Where will they meet?',
        'options': [
            '地図の左上にある家',
            '左側の池のそば',
            '橋を渡った先、キャンプ場に入る道',
            '左下の行き止まりの道',
        ],
        'answerIndex': 3,
        'explanation': (
            'by the lake（②）という提案を The road there is a dead end for cars で'
            '否定し、after the bridge → right where the road turns into the campsite '
            'で橋の先に確定する。①は男性の出発地であって待ち合わせ場所ではなく、'
            '④は行き止まりなので車で迎えに行けない。'
            '提案→否定→言い換えの3手を追う。'
        ),
    },
    # ===============================================================
    (16, 2): {
        'why': (
            '絵は A・B・C の3列 × 1〜4段。'
            '③は「C列3段目」に付いているが、元の選択肢③は'
            '「B列 上から3番目 右側」だった。③が正解なので、'
            '絵を見て数えると正解が消える。'
            '絵のとおり「C列3段目」に書き換え、対話も C 列を指すようにする。'
        ),
        'fig': ['B列2段目', 'B列3段目', 'C列3段目', 'A列3段目'],
        'scene': '男女が学校の靴箱の位置を確認している。',
        'speakers': '男性 / 女性',
        'turns': [
            {'who': 'M', 'text': 'Could you put my gym bag in my shoe locker?'},
            {'who': 'W', 'text': "Sure. It's in row B, second from the top, isn't it?"},
            {'who': 'M', 'text': 'It used to be, but they moved me to row C.'},
            {'who': 'W', 'text': 'Row C. Which one?'},
            {'who': 'M', 'text': 'Third from the top.'},
        ],
        'question': "Which locker is the man's?",
        'options': [
            'B列 上から2段目',
            'B列 上から3段目',
            'C列 上から3段目',
            'A列 上から3段目',
        ],
        'answerIndex': 3,
        'explanation': (
            '女性の思い込み（row B, second from the top）を '
            'they moved me to row C が訂正し、Third from the top で段が確定する。'
            '列の訂正と段の指定を2段階で追う。'
            '①は訂正される前の位置、②は段だけ合っていて列が古い、'
            '④は列が違う。'
        ),
    },
}
