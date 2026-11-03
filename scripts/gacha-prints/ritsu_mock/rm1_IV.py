# -*- coding: utf-8 -*-
# 第1回 IV 文法・語法（書き下ろし）。正解を choices[0] に書き，mc() が位置を入れ替える。
from mk import Pos, mc
P = Pos(104)
PART = {'items': [
 mc('A', ['had not been', 'were not', 'has not been', 'would not be'],
    'If it had not been for A は「（あのとき）Aがなかったら」。主節が would have made（仮定法過去完了）なので，if 節も過去完了。{c1}は仮定法過去で，過去の事実の仮定にならない。{c2}{c3}は if 節の形として不可。', P(),
    text='If it ______ for your advice, I would have made a terrible mistake.'),
 mc('B', ['getting', 'get', 'got', 'have got'],
    'be used to doing は「〜することに慣れている」。to は前置詞なので動名詞が続く。{c1}は used to do（以前は〜したものだ）との混同（誤り）。{c2}{c3}は前置詞の後に置けない。', P(),
    text='She is used to ______ up early, so the 6 a.m. meeting did not bother her.'),
 mc('C', ['where', 'which', 'what', 'whose'],
    '後ろが my grandmother was born（文の要素が欠けていない完全な文）なので，場所を表す関係副詞 where。{c1}は後ろに主語か目的語の欠けた文が必要（in which なら可）。{c2}は先行詞をとれない。{c3}は後ろに名詞が必要。', P(),
    text='This is the town ______ my grandmother was born.'),
 mc('D', ['had I reached', 'I had reached', 'I have reached', 'have I reached'],
    'No sooner had S done … than ～ は「Sが…するとすぐに～」。否定の副詞 No sooner が文頭に出るので倒置（had I reached）になる。{c1}{c2}は倒置していない（不可）。{c3}は than 以下の過去形 left と時制が合わない。', P(),
    text='No sooner ______ the station than the train left.'),
 mc('E', ['the better', 'better', 'the best', 'best'],
    'The 比較級 …, the 比較級 ～ は「…すればするほど～」。前半が The more なので後半も the＋比較級。{c1}は the が欠けている。{c2}{c3}は最上級で不可。', P(),
    text='The more you practice, ______ you will become.'),
 mc('F', ['didn’t', 'don’t', 'won’t', 'not'],
    'would rather S＋過去形 は「Sに〜してほしい（のだが）」。現在の願望でも仮定法過去を使う。{c1}{c2}は現在形・未来の形で不可。{c3}は動詞がない。', P(),
    text='I’d rather you ______ tell anyone about this yet.'),
 mc('G', ['were', 'was', 'has been', 'is'],
    'neither A nor B が主語のとき，動詞は B（近いほう）に合わせる。B が her assistants（複数）なので were。{c1}{c2}{c3}はいずれも単数の主語に対する形（誤り）。', P(),
    text='Neither the manager nor her assistants ______ aware of the problem.'),
 mc('H', ['worrying', 'to worry', 'worried', 'worry'],
    'There is no point (in) doing は「〜しても無駄だ」。in が省略されても動名詞を用いる。{c1}は不定詞で，この構文では用いない（不可）。{c2}{c3}は文の形にならない。', P(),
    text='There is no point ______ about something you cannot change.'),
]}
