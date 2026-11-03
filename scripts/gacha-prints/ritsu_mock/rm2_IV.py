# -*- coding: utf-8 -*-
# 第2回 IV 文法・語法（書き下ろし）。正解を choices[0] に書き，mc() が位置を入れ替える。
from mk import Pos, mc
P = Pos(204)
PART = {'items': [
 mc('A', ['had been waiting', 'has been waiting', 'waits', 'is waiting'],
    '過去のある時点（the bus finally came）までずっと続いていた動作なので過去完了進行形。{c1}は現在完了進行形で，過去の時点までの継続を表せない。{c2}{c3}は現在の形で，came と時制が合わない。', P(),
    text='She ______ for over an hour when the bus finally came.'),
 mc('B', ['to have been', 'to be', 'being', 'have been'],
    'seem to have p.p. は「（今から見て）以前〜だったようだ」。主節の seems（現在）より前の時点（昨日）のことなので完了不定詞。{c1}は現在のことになり yesterday と合わない。{c2}{c3}は seem の後に置けない形。', P(),
    text='He seems ______ sick yesterday, because he didn’t come to school.'),
 mc('C', ['Whoever', 'Whomever', 'Whose', 'Which'],
    '空所の後ろが finishes first（主語が欠けた形）で，文全体の主語となる名詞節を作るので Whoever（〜する人は誰でも）。{c1}は目的格で主語にならない。{c2}は後ろに名詞が必要。{c3}は人を表す名詞節を作れない。', P(),
    text='______ finishes first can leave early.'),
 mc('D', ['so', 'such', 'too', 'very'],
    'so＋形容詞＋that … は「とても〜なので…」。後ろが形容詞 tired だけなので so。{c1} such は such a＋形容詞＋名詞 の形で用いる（名詞がないので不可）。{c2} too は too … to do の形で that 節をとらない。{c3} very は that 節と結びつかない。', P(),
    text='I was ______ tired that I fell asleep on the train.'),
 mc('E', ['Had', 'If', 'Should', 'Were'],
    'If I had known の if を省略すると倒置して Had I known となる。主節が would have called（仮定法過去完了）なので Had。{c1} If だと known の前に had が必要。{c2}{c3}は仮定法過去完了の倒置にならない。', P(),
    text='______ I known you were in town, I would have called you.'),
 mc('F', ['to', 'with', 'for', 'at'],
    'object to A は「Aに反対する」。to は前置詞なので後ろに動名詞 working が続く。{c1}{c2}{c3}は object と結びついて「反対する」の意味にならない。', P(),
    text='Many residents object ______ working on Sundays.'),
 mc('G', ['as', 'than', 'that', 'like'],
    'twice as＋原級＋as … は「…の2倍〜」。前に as large があるので as で受ける。{c1} than は比較級の後に用いる。{c2}{c3}は as … as の形にならない。', P(),
    text='Our new office is twice as large ______ the old one.'),
 mc('H', ['being', 'to be', 'be', 'been'],
    'There being no … は独立分詞構文「〜がないので」。意味上の主語 there が残る。{c1}は不定詞で，理由を表す副詞句にならない。{c2}{c3}は分詞構文の形として不可。', P(),
    text='There ______ no buses that late, we had to walk home.'),
]}
