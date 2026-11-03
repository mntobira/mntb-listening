# -*- coding: utf-8 -*-
# 第2回 問題Ⅲ 和文英訳（書き下ろし）
P3 = {
    'points': 20,
    'lead': '次の日本文を英語で表せ。',
    'questions': [
        {'label': '問1', 'points': 10,
         'ja': 'もう少し早く家を出ていれば、あの電車に乗り遅れることはなかったのに。',
         'models': [
             'If I had left home a little earlier, I would not have missed that train.',
             'Had I left the house a little earlier, I could have caught that train.',
         ],
         'tips': [
             '過去の事実と反対のことを言うので **仮定法過去完了**：If ＋ 主語 ＋ had ＋ 過去分詞, 主語 ＋ would ＋ have ＋ 過去分詞。',
             '「乗り遅れる」は **miss**。反対に「間に合う」は catch を使い、could have caught としてもよい。',
             '「もう少し早く」は **a little earlier**。比較級を忘れて a little early にしないこと。',
             'If を省くと **Had I left …** と倒置になる。使い慣れていなければ If の形で十分。',
         ],
         'criteria': [('仮定法過去完了の形（had left ／ would not have missed）が正しい', 5),
                      ('「乗り遅れる」を miss（または catch を否定せずに使う）で正しく表している', 3),
                      ('a little earlier など比較級が正しく、文法・つづりに誤りがない', 2)]},
        {'label': '問2', 'points': 10,
         'ja': '健康のためには、何を食べるかと同じくらい、いつ食べるかも大切だと言われている。',
         'models': [
             'It is said that when you eat is as important for your health as what you eat.',
             'People say that, for good health, the time you eat matters as much as the food you choose.',
         ],
         'tips': [
             '「～と言われている」は **It is said that ～** か **People say that ～**。',
             '「何を食べるか」「いつ食べるか」は名詞節 **what you eat ／ when you eat**。どちらも主語や比較の対象にできる。',
             '「A と同じくらい B も大切だ」は **B is as important as A**。as … as の間に形容詞の原級を置く。',
             '名詞節が難しければ、the time you eat ／ the food you choose のように名詞＋関係詞節に言いかえてもよい。',
         ],
         'criteria': [('「～と言われている」を正しく表している', 2),
                      ('「何を食べるか」「いつ食べるか」を名詞節などで正しく表している', 4),
                      ('as … as の比較の形が正しい', 2),
                      ('文法・語法・つづりに誤りがない', 2)]},
    ],
}
