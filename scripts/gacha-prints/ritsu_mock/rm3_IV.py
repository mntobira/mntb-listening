# -*- coding: utf-8 -*-
# 第3回 IV 文法・語法（書き下ろし）。正解を choices[0] に書き，mc() が位置を入れ替える。
from mk import Pos, mc
P = Pos(304)
PART = {'items': [
 mc('A', ['will have finished', 'have finished', 'finished', 'had finished'],
    'by the time＋現在形 は未来のある時点を表す。その時点までに完了している動作なので未来完了。{c1}は現在完了で未来の時点までの完了を表せない。{c2}{c3}は過去の形で，未来の時点と合わない。', P(),
    text='By the time you arrive, we ______ the preparations.'),
 mc('B', ['to repair', 'repairing', 'repair', 'repaired'],
    'cost＋人＋金額＋to do は「人が〜するのに（金額）がかかる」。It は形式主語で，to repair 以下を受ける。{c1}{c2}{c3}は形式主語 It を受ける形にならない。', P(),
    text='It cost me two hundred dollars ______ my laptop.'),
 mc('C', ['what', 'that', 'which', 'whether'],
    'what S is は「Sの現在の姿（あり方）」。the town を主語にした名詞節を作り，前置詞 from の目的語になる。{c1}{c2}は先行詞がなく，is の補語が欠けたままになる。{c3}は「〜かどうか」で意味が通らない。', P(),
    text='The town is very different from ______ it was twenty years ago.'),
 mc('D', ['Not until', 'Only if', 'Even though', 'As soon as'],
    'Not until … did S do は「…して初めてSは〜した」。否定の語句が文頭にあるので主節が倒置（did I realize）になる。{c1}{c2}{c3}は文頭にあっても主節が倒置しない（形が合わない）。', P(),
    text='______ I got home did I realize that I had lost my key.'),
 mc('E', ['would', 'will', 'can', 'shall'],
    'I wish＋S＋would do は「Sが〜してくれればいいのに」（現在・未来への願望）。wish の後の節は仮定法なので過去形の助動詞を用いる。{c1}{c2}{c3}は現在形の助動詞で，wish の後では用いない。', P(),
    text='I wish my neighbor ______ stop playing loud music at night.'),
 mc('F', ['in', 'on', 'at', 'for'],
    'succeed in doing は「〜することに成功する」。in は前置詞なので後ろに動名詞 persuading が続く。{c1}{c2}{c3}は succeed と結びついて「成功する」の意味にならない。', P(),
    text='She finally succeeded ______ persuading her parents.'),
 mc('G', ['as', 'so', 'than', 'that'],
    'A is to B as C is to D は「AとBの関係はCとDの関係と同じ」。前半の “Reading is to the mind” を受けて as で結ぶ。{c1}{c2}{c3}はこの構文に用いない。', P(),
    text='Reading is to the mind ______ exercise is to the body.'),
 mc('H', ['having', 'to have', 'have', 'had'],
    'Having p.p. は完了分詞構文で，主節（I knew）より前の時点の内容を表す。「以前そこに住んでいたので」。{c1}は不定詞で，理由を表す副詞句にならない。{c2}{c3}は主語がないので文の形にならない。', P(),
    text='______ lived there before, I knew the best places to eat.'),
]}
