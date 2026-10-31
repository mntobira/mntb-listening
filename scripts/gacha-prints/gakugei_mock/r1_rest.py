# -*- coding: utf-8 -*-
# 第1回 Ⅲ 和文英訳・Ⅳ 自由英作文・Ⅴ ディクテーション（すべて書き下ろし）
III = {
 'points': 20,
 'lead': '次の日本文の下線部(A)・(B)を英語に直しなさい。',
 'japanese': [
  '小学校で英語を教えるようになって 3 年目になる。最初の年は，正しい発音や文法を教えることばかり考えていた。{uA|ところが，子どもたちが一番生き生きとするのは，教科書の英文を練習しているときではなく，自分の好きなものを友達に伝えようとしているときだと気づいた。}',
  '言いたいことがあれば，子どもは知っている単語を総動員し，身ぶりも使って，なんとか伝えようとする。{uB|間違いを恐れずに話そうとする気持ちを育てることこそ，小学校の英語の授業で何より大切なことなのかもしれない。}',
 ],
 'items': [
  {'label': 'A', 'lines': 5,
   'src': 'ところが，子どもたちが一番生き生きとするのは，教科書の英文を練習しているときではなく，自分の好きなものを友達に伝えようとしているときだと気づいた。',
   'answer': 'However, I noticed that my pupils are at their liveliest not when they are practicing sentences from the textbook but when they are trying to tell their friends about the things they like.',
   'alts': ['But I realized that the children become most lively not while practicing the English in their textbooks, but while trying to share their favorite things with their classmates.'],
   'points_ja': ['「〜するのは…ではなく〜のときだ」は not when A but when B でそろえる。A と B の形（when + 主語 + 動詞）を同じにすると読みやすい。', '「生き生きとする」は be (at one’s) liveliest / become most lively / come alive。lively は形容詞（-ly でも副詞ではない）。', '「気づいた」は noticed / realized / found。時制の一致を気にしすぎず，今も続く傾向なので are のままでよい（were でも可）。', '「自分の好きなもの」は the things they like / their favorite things。'],
   'criteria': [('「気づいた」とその内容（that 節）の骨組み', 2), ('not A but B（ではなく〜のとき）の対比が正しい', 3), ('「生き生きとする」の最上級・形容詞の用法', 2), ('「教科書の英文を練習する」「好きなものを友達に伝えようとする」の語彙・語法', 3)]},
  {'label': 'B', 'lines': 4,
   'src': '間違いを恐れずに話そうとする気持ちを育てることこそ，小学校の英語の授業で何より大切なことなのかもしれない。',
   'answer': 'Perhaps the most important thing in elementary school English classes is to encourage children to try to speak without being afraid of making mistakes.',
   'alts': ['It may be that nothing matters more in English lessons at elementary school than helping children develop a willingness to speak without fear of making mistakes.'],
   'points_ja': ['「〜こそ何より大切」は the most important thing is to do / nothing is more important than doing のどちらかで書く。', '「気持ちを育てる」は直訳（grow the feeling）では不自然。encourage children to do / help children develop a willingness to do と言いかえる。', '「間違いを恐れずに」は without being afraid of making mistakes / without fear of making mistakes。', '「〜かもしれない」は Perhaps … / It may be that … / may be。'],
   'criteria': [('「何より大切なこと」の比較表現が正しい', 3), ('「気持ちを育てる」を英語として自然に言いかえている', 3), ('「間違いを恐れずに」「〜かもしれない」の表現', 2), ('小学校の英語の授業・冠詞・数の正確さ', 2)]},
 ],
}

IV = {
 'points': 15,
 'lead': '次のテーマについて，あなたの意見を 200 語程度の英語で書きなさい。解答用紙の語数欄に，書いた語数を記入すること。',
 'topic': '日本の小学校や中学校では，掃除の時間に児童・生徒が自分たちで教室や廊下を掃除することが一般的です。一方で，掃除は専門の業者に任せ，その時間を学習や休息にあてるべきだという意見もあります。**児童・生徒が学校の掃除をすることについて，あなたは賛成ですか，反対ですか。**理由を挙げて述べなさい。',
 'lines': 21,
 'criteria': [('立場（賛成・反対）が冒頭で明確で，結論まで一貫している', 3), ('理由が 2 つ程度あり，それぞれに具体例・説明がある', 5), ('段落の構成（導入→理由→結論）とつなぎの語', 3), ('文法・語彙の正確さ，語数（200 語程度：おおむね 180〜220 語）', 4)],
 'tips': [
  '冒頭の 1〜2 文で立場をはっきり書く。「両方によい点がある」で終えると，意見を求める指示に合わない。',
  '理由は 2 つ程度に絞り，それぞれに「例えば…」という具体的な場面を添える。理由を 4〜5 個並べると，どれも浅くなる。',
  '「掃除の時間」は cleaning time，「業者」は professional cleaners / a cleaning company。「責任感」は a sense of responsibility。',
  '教員を目指す受験生として，学校での具体的な場面（給食の後の掃除，地域の清掃活動など）を出すと説得力が増す。',
 ],
 'models': [
  ('賛成：責任感と協力を学べる', '導入（賛成）→理由1 責任感→理由2 協力・人への感謝→結論',
   'I believe that students should continue to clean their own schools. Although it takes time away from study, the experience teaches lessons that cannot be learned from textbooks.\nFirst, cleaning gives students a sense of responsibility for the places they use. When I was in junior high school, our class was in charge of the stairs. At first, we did the job quickly and carelessly, but after our homeroom teacher pointed out the dust in the corners, we began to take pride in keeping them clean. Since then, I have hesitated to drop even a small piece of paper on the floor.\nSecond, cleaning together teaches cooperation and respect for other people’s work. To finish in fifteen minutes, students must divide the tasks and help one another. Through this, they also come to understand how much effort the custodians and their parents put into keeping spaces clean every day.\nSome people argue that the time should be used for study or rest. However, fifteen minutes a day is a small price for these lessons. For these reasons, I think school cleaning by students is a valuable part of education and should be kept.'),
  ('反対：時間と安全を優先すべき', '導入（反対）→理由1 時間の使い方→理由2 衛生・安全→結論',
   'I do not think students should be required to clean their schools. While I understand that cleaning can teach responsibility, I believe the time and effort would be better spent in other ways.\nFirst, students today have very busy schedules. Between classes, club activities and homework, many of them do not get enough sleep. If professional cleaners took over the job, the fifteen or twenty minutes spent cleaning each day could be used for rest or for asking teachers questions. Over a school year, this adds up to more than fifty hours.\nSecond, some cleaning tasks are not safe or hygienic for children. Cleaning toilets or using strong chemicals requires proper training and equipment. Professional cleaners can also clean more thoroughly, which would help prevent the spread of illnesses such as the flu.\nOf course, students should still learn to take care of their surroundings. They can do this by tidying their own desks and picking up their own trash. However, the main cleaning of school buildings should be left to professionals. For these reasons, I am against making students clean their schools.'),
 ],
}

V = {
 'points': 10,
 'lead': 'これから読まれる英文を聞き取り，解答用紙に書きなさい。英文は 3 回読まれる。1 回目はふつうの速さで，2 回目は区切りごとに間をとって，3 回目は再びふつうの速さで読まれる。（音声はついていない。解答・解説編の最後にある「読み上げ原稿」を，ほかの人に読んでもらうこと。）',
 'lines': 6,
 'script': 'Many schools now ask students to keep a short learning diary at the end of each day. In just a few sentences, students write what they learned, what was difficult, and what they want to try next. Teachers who use these diaries say that they help students notice their own progress, and that reading them is the quickest way to find out which lessons need to be taught again.',
 'script_slashed': 'Many schools now ask students / to keep a short learning diary / at the end of each day. / In just a few sentences, / students write what they learned, / what was difficult, / and what they want to try next. / Teachers who use these diaries say / that they help students notice their own progress, / and that reading them is the quickest way / to find out which lessons / need to be taught again.',
 'criteria': [('区切りごとに語が正しく書けている（12 区切り×0.5 点）', 6), ('冠詞・複数形の s・三単現の s・時制が正確（誤り 1 か所ごとに 0.5 点減，最大 2 点）', 2), ('つづりの正確さ（誤り 1 か所ごとに 0.5 点減，最大 2 点）', 2)],
 'tips': [
  'a short learning diary の a，each day の単数形，students の複数形の s など，聞こえにくい小さな語を落とさない。',
  'what they learned / what was difficult / what they want to try next は同じ形（what ＋ 文）が 3 つ並ぶ。2 回目の区切りで形を予測しながら書く。',
  'Teachers who use these diaries say that A, and that B の that は 2 つある。2 つ目の that を落としやすい。',
  'need to be taught again は受け身（be taught）。taught のつづり（t-a-u-g-h-t）に注意。',
 ],
}
