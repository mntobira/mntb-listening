"""第2回 リーディング 第1〜4問"""

P1 = {
 'label': '第1問', 'title': '掲示・お知らせ（情報の読み取り）', 'pts': 6,
 'gist': ['留学先の高校の掲示板にある「国際料理の夕べ」の案内。各国の料理を持ち寄るイベントで、参加者は前日までに料理名と材料を登録する。'
          'アレルギー表示のためナッツ・卵・乳製品の使用を明記すること。会場は食堂、ボランティアは4時集合。'],
 'vocab': ['potluck 持ち寄りの食事会', 'ingredient 材料', 'label 表示する', 'cafeteria 食堂'],
 'sections': [{
  'instr': 'あなたはアメリカの高校に留学しています。掲示板で次のお知らせを見つけました。',
  'blocks': [
   ('box', [
    ('title', 'International Food Night — Potluck Party!'),
    ('c', 'Friday, March 14 · 6:00–8:30 p.m. · School Cafeteria'),
    ('p', 'Bring a dish from your home country or family tradition and share it with everyone! Students, families and teachers are all welcome.'),
    ('pl', '• Please register the name of your dish and its main ingredients on the sign-up sheet outside Room 204 **by Thursday, March 13**.\n'
           '• To help guests with allergies, write on your label whether your dish contains **nuts, eggs or dairy products**.\n'
           '• Dishes should be ready to serve. Microwaves will not be available.\n'
           '• Volunteers to set up tables: meet in the cafeteria at 4:00 p.m.'),
    ('p', 'The student council will provide drinks, plates and forks. Prizes will be given for "Most Colourful Dish" and "Best Story Behind a Dish."'),
   ], '#fbfaf6'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'What must people who bring a dish do before the event?', 'pts': 2, 'ans': 4,
    'choices': ['Heat their dish in the cafeteria microwave.', 'Buy drinks and plates for the guests.', 'Meet the student council at 4:00 p.m.', 'Sign up with the name and main ingredients of their dish.'],
    'ex': ['"register the name of your dish and its main ingredients … by Thursday" が根拠。',
           '① 電子レンジは使えない。② 飲み物と皿は生徒会が用意。③ 4時集合はボランティアだけ。']},
   {'no': 2, 'prompt': 'The labels on the dishes are mainly intended to', 'pts': 2, 'ans': 1,
    'choices': ['help guests who cannot eat certain foods.', 'show which country the dish is from.', 'decide which dish wins a prize.', 'tell guests how much each dish costs.'],
    'ex': ['"To help guests with allergies, write on your label …" → アレルギーのある人のため。']},
   {'no': 3, 'prompt': 'Which prize focuses on something other than how the food looks or tastes?', 'pts': 2, 'ans': 3,
    'choices': ['Most Colourful Dish', 'Most Delicious Dish', 'Best Story Behind a Dish', 'Fastest Dish to Prepare'],
    'ex': ['"Best Story Behind a Dish" は料理にまつわる**話**を評価する。② ④ はそもそも掲示にない賞。']},
  ]}]}

P2 = {
 'label': '第2問', 'title': 'レビュー記事（事実と意見）', 'pts': 12,
 'gist': ['イギリスの学生向けウェブマガジンが、3種類の単語学習アプリ（WordNest・Flashly・LexiQuest）を比べた記事と読者コメント。'
          '料金・機能・30日間の試用で覚えた語数の表と、編集部の評価。'],
 'vocab': ['subscription 定額料金', 'spaced repetition 間隔反復', 'leaderboard 順位表', 'gimmick 小細工'],
 'sections': [{
  'instr': 'あなたは英単語の勉強方法を調べていて、イギリスの学生向けウェブマガジンで次の記事を見つけました。',
  'blocks': [
   ('box', [
    ('title', 'We Tested Three Vocabulary Apps for 30 Days'),
    ('p', 'Three of our student writers each used a different app for 15 minutes a day for a month. At the end, they took the same 100-word test, made up of words their app had introduced.'),
    ('table', [['App', 'Price', 'Main feature', 'Words remembered'],
               ['WordNest', 'Free (with adverts)', 'Spaced repetition: words come back just before you forget them', '78 / 100'],
               ['Flashly', '£2.99 per month', 'Photos and example sentences for every word', '71 / 100'],
               ['LexiQuest', '£4.99 per month', 'Game-style levels and a weekly leaderboard', '64 / 100']], [28, 34, 82, 38]),
    ('p', '**Our verdict:** WordNest produced the best test score, and it costs nothing — although the adverts can be annoying. LexiQuest was the most fun to use, but our writer admitted she sometimes rushed through levels just to climb the leaderboard. '
          'In our view, the scientific approach of WordNest makes it the smartest choice for exam preparation.'),
    ('h', 'Comments'),
    ('pl', '**Olivia_K:** I\'ve used Flashly for a year. The photos really help me picture each word, so it\'s worth the money for me.'),
    ('pl', '**Sam1999:** Fun is important too! I gave up on two "serious" apps before LexiQuest. A gimmick that keeps you studying beats a perfect method you abandon.'),
   ], '#fbfaf6'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'According to the table, which app costs the most?', 'pts': 3, 'ans': 3,
    'choices': ['WordNest', 'Flashly', 'LexiQuest', 'They all cost the same.'],
    'ex': ['LexiQuest は月 £4.99 で最も高い。']},
   {'no': 2, 'prompt': 'Which of the following is an **opinion** rather than a fact?', 'pts': 3, 'ans': 4,
    'choices': ['WordNest shows adverts.', 'Each writer used an app for 15 minutes a day.', 'The LexiQuest writer scored 64 out of 100.', 'WordNest is the smartest choice for exam preparation.'],
    'ex': ['"In our view … the smartest choice" は編集部の**評価**。"In our view / I think" などの合図に注目。',
           '①②③ は記事・表から確認できる事実。']},
   {'no': 3, 'prompt': 'Why did the LexiQuest writer sometimes not study carefully?', 'pts': 3, 'ans': 1,
    'choices': ['She wanted to move up in the ranking.', 'The app had too many adverts.', 'She did not have enough time each day.', 'The example sentences were too difficult.'],
    'ex': ['"rushed through levels just to climb the leaderboard"（順位を上げるためだけに急いだ）→ ①。']},
   {'no': 4, 'prompt': "Sam1999's main point is that", 'pts': 3, 'ans': 2,
    'choices': ['games are a waste of time for serious learners.', 'an app that keeps you motivated may be better than a more efficient one you stop using.',
                'Flashly is worth paying for because of its photos.', 'the test in the article was unfair to LexiQuest.'],
    'ex': ['"A gimmick that keeps you studying beats a perfect method you abandon." の言いかえが ②。③ は Olivia の意見。']},
  ]}]}

P3 = {
 'label': '第3問', 'title': '体験談（出来事の順序・心情）', 'pts': 9,
 'gist': ['ニュージーランドに留学した日本人学生 Sota が、地元のラグビーチームのマネージャーを務めた体験談。言葉の壁で最初は孤立したが、'
          '選手の水筒に名前を書いたことをきっかけに会話が生まれ、最後の試合では仲間から「チームの一員」と呼ばれる。'],
 'vocab': ['bench ベンチ', 'kit（英・NZ）用具一式', 'nickname あだ名', 'awkward 気まずい'],
 'sections': [{
  'instr': 'あなたは留学体験談を集めたウェブサイトで、次の記事を読んでいます。',
  'blocks': [
   ('box', [
    ('title', 'The Water Bottle Manager'),
    ('small', 'by Sota Ishii'),
    ('p', 'When I arrived in Christchurch, New Zealand, for a six-month exchange, my host brother Liam invited me to help his school rugby team. I had never played rugby, so the coach asked me to be the team manager: carrying the kit, filling water bottles and keeping the score book.'),
    ('p', 'For the first few weeks, I felt invisible. The players spoke so fast, with so many jokes I didn\'t understand, that I just stood at the side of the field holding bottles. During one match, I gave a bottle to the wrong player twice, and someone shouted something I didn\'t catch. Everyone laughed. I went home that evening and almost decided to quit.'),
    ('p', 'Instead, I came up with a small idea. That weekend, I bought a marker pen and wrote each player\'s name on his bottle — in English and in katakana. At the next practice, the captain, Tama, picked up his bottle and stared at it. "What does this say?" he asked. I explained, and soon everyone was crowding around me, asking how to write their names in Japanese. One player wanted his nickname, "Moose," in katakana too.'),
    ('p', 'After that, practice felt different. The players started teaching me rugby words, and I taught them a little Japanese. Tama began calling me "Coach Sota," which was a joke, but a kind one.'),
    ('p', 'At the final match of the season, our team won by two points. In the changing room, Tama handed me the match ball. "This belongs to the whole team," he said, "and you\'re part of the team." I still have that ball on my shelf in Japan. Next to it is the marker pen — almost empty.'),
   ], '#fbfaf6'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Why did Sota feel "invisible" at first?', 'pts': 3, 'ans': 4,
    'choices': ['The coach would not let him enter the field.', 'He was not allowed to talk during matches.', 'Liam stopped going to practice.', 'He could not follow the players\' fast speech and jokes.'],
    'ex': ['"The players spoke so fast, with so many jokes I didn\'t understand" が直接の理由。']},
   {'no': 2, 'prompt': 'Put the following events into the order in which they happened.\n{1} → {2} → {3} → {4}', 'pts': 3, 'ans': [2, 5, 4, 1], 'score': 'all',
    'choices': ['Sota received the match ball.', 'Sota handed bottles to the wrong player.', 'Sota taught the players how to play rugby.',
                'The captain started calling Sota "Coach Sota."', 'Sota wrote the players\' names on their bottles.'],
    'ans_text': '②→⑤→④→①',
    'ex': ['水筒の渡し間違い（第2段落）→ 名前を書く（第3段落）→ 「コーチ・ソウタ」と呼ばれる（第4段落）→ 試合球を受け取る（第5段落）。',
           '③ は逆：ラグビーの言葉を教わったのはソウタ。']},
   {'no': 3, 'prompt': 'What does the almost empty marker pen most likely represent for Sota?', 'pts': 3, 'ans': 2,
    'choices': ['His regret about wasting money.', 'The small action that helped him connect with the team.', 'His wish to become a rugby player.', 'The difficulty of learning katakana.'],
    'ex': ['ペンは「水筒に名前を書いた」きっかけの象徴で、使い切りかけている＝何度も書いて交流が続いた。試合球（チームの一員）と並べて飾っていることもヒント。']},
  ]}]}

P4 = {
 'label': '第4問', 'title': '推敲（下書きとコメント）', 'pts': 12,
 'gist': ['高校生 Rina の意見文「地元の商店街を守るために」の下書き。主張は「商店街は地域のつながりの場であり、高校生も関われる」。'
          '先生のコメントに従って、論点の順序を示す語・データの挿入位置・不要な文の削除と差し替え・結論の書き直しを考える。'],
 'vocab': ['shopping street 商店街', 'vacant 空いている', 'foot traffic 人通り', 'pop-up shop 期間限定の店'],
 'sections': [{
  'instr': 'あなたは英語の授業で意見文を書いています。次は Rina の下書きと先生のコメントです。',
  'blocks': [
   ('box', [
    ('title', 'Bringing Our Shopping Street Back to Life'),
    ('p', 'The shopping street near my house used to be full of people. Now, many shops have their shutters down. I believe our local shopping street is worth saving, and that high school students can play an important role.'),
    ('p', '**[ A ]**, a shopping street is more than a place to buy things. Shop owners know their customers by name, and elderly people who live alone often stop to chat. **(a)** In this way, the street helps people stay connected. **(b)**'),
    ('p', 'Second, young people can bring new ideas. Last year, students from a nearby university opened a pop-up café in an empty shop for one month. **(c)** They also posted photos on social media, which attracted visitors from other towns. **(d)**'),
    ('p', 'Third, students can help shops reach new customers. __I like to buy snacks at the convenience store after school.__ For example, we could design posters, make short videos or help shop owners start online shops.'),
    ('p', '**[ D ]** In conclusion, the shopping street near my house has many closed shops, and it is sad.'),
   ], '#fbfaf6'),
   ('box', [
    ('ja', '**先生のコメント**'),
    ('ja', '**A**：三つの理由を順に述べる構成がわかるように、最初の理由を導く語句を入れましょう。'),
    ('ja', '**B**：第3段落に、取り組みの効果を示すデータを加えましょう。'),
    ('ja', '**C**：下線部は段落の主張と関係がありません。差し替えましょう。'),
    ('ja', '**D**：結論で、主張と三つの理由をまとめ直しましょう。'),
   ], '#fff6df'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Based on Comment A, which is the best expression to put in **[ A ]**?', 'pts': 3, 'ans': 3,
    'choices': ['However', 'As a result', 'First of all', 'In other words'],
    'ex': ['後に Second, Third と続くので、最初の理由を導く First of all。']},
   {'no': 2, 'prompt': 'Based on Comment B, where is the best place to add the following sentence?\n"According to the local shop association, the number of people walking along the street on weekends rose by about 30% during that month."', 'pts': 3, 'ans': 3,
    'choices': ['(a)', '(b)', '(c)', '(d)'],
    'ex': ['"that month" はポップアップカフェを開いた「1か月」を指す → カフェの紹介の直後 **(c)**。',
           '(d) だと SNS の話の後になり、"that month" が何を指すか遠くなる。(a)(b) は第2段落（つながりの話）で無関係。']},
   {'no': 3, 'prompt': 'Based on Comment C, which is the best sentence to replace the underlined one?', 'pts': 3, 'ans': 1,
    'choices': ['Many shop owners are skilled at their work but have little experience with digital tools.', 'Convenience stores are open twenty-four hours a day.',
                'Some students prefer to study in libraries.', 'The street was built more than sixty years ago.'],
    'ex': ['段落の主張は「生徒が店の新しい客層開拓を手伝える」。直後の具体例（ポスター・動画・オンライン店）につながるのは、店主がデジタルに不慣れだという ①。']},
   {'no': 4, 'prompt': 'Based on Comment D, which is the best way to rewrite the conclusion?', 'pts': 3, 'ans': 4,
    'choices': ['In conclusion, convenience stores are more useful than shopping streets.', 'In conclusion, only university students can save shopping streets.',
                'In conclusion, people should stop using social media.',
                'In conclusion, our shopping street connects people, and students can help it with fresh ideas and new ways to reach customers.'],
    'ex': ['三つの理由（つながり・新しいアイデア・客層開拓）と主張をまとめた ④。②は「高校生も役割を果たせる」という主張に反する。']},
  ]}]}

PARTS_A = [P1, P2, P3, P4]
