# -*- coding: utf-8 -*-
# 第1回 問題Ⅲ 和文英訳（書き下ろし）
P3 = {
    'points': 20,
    'lead': '次の日本文を英語で表せ。',
    'questions': [
        {'label': '問1', 'points': 10,
         'ja': '駅に着いてはじめて、私は傘を電車の中に置き忘れてきたことに気がついた。',
         'models': [
             'It was not until I arrived at the station that I realized I had left my umbrella on the train.',
             'Only when I got to the station did I notice that I had left my umbrella on the train.',
         ],
         'tips': [
             '「～してはじめて…する」は **It was not until ～ that …** か **not … until ～** で表す。Only when ～ を文頭に置くと、後ろは did I notice のように倒置になる。',
             '「置き忘れた」のは「気がついた」より前のことなので、過去完了 **had left** にする。',
             '「置き忘れる」は forget ではなく **leave**。forget は場所を表す語句といっしょに使わない（× forgot my umbrella on the train）。',
             '「電車の中に」は **on the train**（in the train も通じるが、乗り物として言うなら on が自然）。',
         ],
         'criteria': [('「～してはじめて」を not until ／ only when などで正しく表している', 4),
                      ('置き忘れたことを過去完了（had left）で表している', 3),
                      ('「置き忘れる」を leave で表し、語法・つづりに誤りがない', 3)]},
        {'label': '問2', 'points': 10,
         'ja': '外国語を学ぶいちばんの楽しみは、ほかの国の人々がものごとをどう考えているかを知ることができる点にある。',
         'models': [
             'The greatest pleasure of learning a foreign language is that it allows you to understand how people in other countries think about things.',
             'What I enjoy most about studying a foreign language is being able to learn how people in other countries see the world.',
         ],
         'tips': [
             '主語は「いちばんの楽しみ」＝ **The greatest pleasure of learning ～**。of の後は動名詞にする。',
             '「～できる点にある」は **is that ～ can …** か **is that it allows you to …**。be able to を動名詞にして being able to としてもよい。',
             '「どう考えているか」は間接疑問なので **how people think**（× how do people think）の語順にする。',
             '「ものごと」は things のほか、意訳して the world でもよい。日本語の一語一語にこだわらず、意味が伝わる形を選ぶ。',
         ],
         'criteria': [('「いちばんの楽しみは～だ」の文の骨組みが正しい', 3),
                      ('「～できる点」を that 節や being able to などで正しく表している', 3),
                      ('間接疑問（how people think）の語順が正しい', 2),
                      ('文法・語法・つづりに誤りがない', 2)]},
    ],
}
