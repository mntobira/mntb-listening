# -*- coding: utf-8 -*-
# 第3回 問題Ⅲ 和文英訳（書き下ろし）
P3 = {
    'points': 20,
    'lead': '次の日本文を英語で表せ。',
    'questions': [
        {'label': '問1', 'points': 10,
         'ja': '彼女がこの町に引っ越してきてから、もう 5 年以上になる。',
         'models': [
             'It has been more than five years since she moved to this town.',
             'More than five years have passed since she came to live in this town.',
         ],
         'tips': [
             '「～してから…になる」は **It has been ＋ 期間 ＋ since ＋ 過去形** か **期間 ＋ have passed since ～**。',
             'since の後は「引っ越した」という過去の一点なので **過去形 moved**。has moved にしないこと。',
             '「5 年以上」は **more than five years**（厳密には「5 年を超える」だが、入試の英訳ではこれで通じる）。',
             'She has lived in this town for more than five years. と、「住んでいる期間」に言いかえてもよい。',
         ],
         'criteria': [('It has been ～ since ／ have passed since ／ has lived for などの形が正しい', 5),
                      ('since の後を過去形にしている（または for で期間を正しく表している）', 3),
                      ('more than five years など数量表現と、文法・つづりに誤りがない', 2)]},
        {'label': '問2', 'points': 10,
         'ja': '自分が正しいと思うことを、ほかの人の前ではっきり言うのは、思っているほど簡単ではない。',
         'models': [
             'It is not as easy as you might think to say clearly in front of others what you believe is right.',
             'Clearly stating what you think is right in front of other people is harder than it seems.',
         ],
         'tips': [
             '主語が長いので **It is ～ to …** の形式主語を使うと書きやすい。',
             '「自分が正しいと思うこと」は **what you believe is right**。what の後に you believe を挟む形で、× what you believe it is right としない。',
             '「思っているほど簡単ではない」は **not as easy as you might think** か **harder than it seems**。',
             '「はっきり言う」は say ～ clearly ／ state ～ clearly。say の目的語が長いときは clearly を先に置くと読みやすい。',
         ],
         'criteria': [('形式主語や動名詞の主語で文の骨組みが正しい', 3),
                      ('「自分が正しいと思うこと」を what you believe (think) is right で正しく表している', 3),
                      ('「思っているほど～ない」を not as … as ／ 比較級で正しく表している', 2),
                      ('文法・語法・つづりに誤りがない', 2)]},
    ],
}
