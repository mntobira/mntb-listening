"""第5回 リーディング 第1〜4問"""

P1 = {
 'label': '第1問', 'title': 'テキストメッセージ（情報の読み取り）', 'pts': 6,
 'gist': ['イギリスに留学中の Sakura と、友人 Oliver のやりとり。週末の映画の約束。上映時間が変わり、Oliver はアルバイトで遅れるため、Sakura が先にチケットを2枚買っておくことになる。'],
 'vocab': ['showing（英）上映', 'cover a shift 代わりに勤務に入る', 'sort out 手配する', 'pay back 返金する'],
 'sections': [{
  'instr': 'あなたはイギリスに留学中です。友人の Oliver とメッセージをやりとりしています。',
  'blocks': [
   ('msg', 'Oliver', "Hi Sakura! Are we still on for the film on Saturday? I just checked, and the 6 o'clock showing has moved to 7:15.", 'l'),
   ('msg', 'Sakura', "That's fine with me. It means we can have dinner first!", 'r'),
   ('msg', 'Oliver', "Actually, my manager asked me to cover a shift at the café until 6:30. I don't think I can make dinner. Sorry!", 'l'),
   ('msg', 'Sakura', "No problem. Shall I buy the tickets online so we don't have to queue?", 'r'),
   ('msg', 'Oliver', "That would be brilliant. Get two student tickets — they're £6 each. I'll pay you back on Saturday.", 'l'),
   ('msg', 'Sakura', "OK! I'll sort them out tonight. Let's meet in front of the cinema at 7.", 'r'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'What time will the film start?', 'pts': 2, 'ans': 4,
    'choices': ['6:00', '6:30', '7:00', '7:15'],
    'ex': ['6時の上映が **7:15** に変更。③ 7時は待ち合わせの時刻。']},
   {'no': 2, 'prompt': 'Why can\'t Oliver have dinner with Sakura?', 'pts': 2, 'ans': 1,
    'choices': ['He has to work until 6:30.', 'He does not like the restaurant.', 'He has already eaten.', 'He has to buy the tickets.'],
    'ex': ['カフェで6時半まで代わりに働く → ①。']},
   {'no': 3, 'prompt': 'How much will Oliver give Sakura on Saturday?', 'pts': 2, 'ans': 2,
    'choices': ['£3', '£6', '£12', 'Nothing'],
    'ex': ['学生チケット £6 × 2 を Sakura が立て替え → Oliver が払うのは自分の1枚分 **£6**。③ £12 は2枚の合計。']},
  ]}]}

P2 = {
 'label': '第2問', 'title': '商品紹介とレビュー（事実と意見）', 'pts': 12,
 'gist': ['イギリスのアウトドア用品店のサイト。折りたたみ式の太陽光充電器「SunFold」の商品説明と仕様、購入者のレビュー。'],
 'vocab': ['solar panel 太陽電池パネル', 'waterproof 防水の', 'overcast くもりの', 'gadget 小型機器'],
 'sections': [{
  'instr': 'あなたは夏のキャンプに持っていく道具を探しています。次のウェブサイトを見つけました。',
  'blocks': [
   ('box', [
    ('title', 'SunFold Portable Solar Charger'),
    ('p', 'Charge your phone anywhere the sun shines! The SunFold folds to the size of a paperback book and weighs only 450 grams. It has two USB ports, so you can charge two devices at once.'),
    ('table', [['Feature', 'Details'], ['Charging time (phone)', 'About 3 hours in full sun; 6–8 hours on cloudy days'],
               ['Water resistance', 'Splash-proof (not for use in heavy rain)'], ['Price', '£39.99 (free delivery on orders over £30)'], ['Guarantee', '1 year']], [55, 119]),
    ('h', 'Customer reviews'),
    ('pl', '**Jack (★★★★★):** I took it on a week-long walking holiday in Wales. My phone never ran out of battery. Absolutely worth every penny.'),
    ('pl', '**Priya (★★★☆☆):** It works, but it took most of the day to charge my phone when it was overcast. Fine for summer, less useful in autumn.'),
    ('pl', '**Tom (★★★★☆):** Light and easy to carry. I attach it to my rucksack while I walk. It got wet in a shower and still works.'),
   ]),
  ],
  'qs': [
   {'no': 1, 'prompt': 'What can the SunFold do?', 'pts': 3, 'ans': 3,
    'choices': ['Charge a phone in one hour', 'Work in heavy rain', 'Charge two devices at the same time', 'Store electricity for a whole year'],
    'ex': ['"two USB ports, so you can charge two devices at once" → ③。② 激しい雨では使えない。']},
   {'no': 2, 'prompt': 'Which of the following is a **fact** stated in the reviews?', 'pts': 3, 'ans': 4,
    'choices': ['The charger is worth every penny.', 'It is less useful in autumn.', 'It is light and easy to carry.', 'Tom attaches it to his rucksack.'],
    'ex': ['Tom がリュックに付けて歩くのは確かめられる事実。①②③ は評価（意見）。']},
   {'no': 3, 'prompt': 'Priya\'s experience matches which information on the website?', 'pts': 3, 'ans': 2,
    'choices': ['It weighs 450 grams.', 'Charging takes 6–8 hours on cloudy days.', 'Delivery is free.', 'It has a one-year guarantee.'],
    'ex': ['くもりの日はほぼ一日かかった ⇔ 表「くもりの日は6〜8時間」→ ②。']},
   {'no': 4, 'prompt': 'Based on the information, who would find the SunFold **least** suitable?', 'pts': 3, 'ans': 1,
    'choices': ['Someone camping in a place where it rains heavily all week', 'A student walking in sunny weather', 'A cyclist who needs to charge a phone and a camera', 'A hiker who wants a light charger'],
    'ex': ['激しい雨には対応していない（splash-proof のみ）＋晴れないと充電に時間がかかる → ①。']},
  ]}]}

P3 = {
 'label': '第3問', 'title': '体験談（出来事の順序・心情）', 'pts': 9,
 'gist': ['留学生 Daniel が日本の高校の書道部に入った体験。最初はうまく書けず、先生に「速く書きすぎ」と言われる。毎朝の練習を重ね、文化祭で「縁」の字を出品する。'],
 'vocab': ['calligraphy 書道', 'brush 筆', 'stroke （文字の）画', 'ink stick 墨', 'patience 忍耐'],
 'sections': [{
  'instr': 'あなたは留学生の体験談を集めたウェブサイトで、次の記事を読んでいます。',
  'blocks': [
   ('box', [
    ('title', 'One Character, One Year'),
    ('small', 'by Daniel Moreau'),
    ('p', 'When I arrived at my Japanese high school as an exchange student from France, my host sister Aya invited me to visit the calligraphy club. I expected it to be easy — after all, I had beautiful handwriting in French. '
          'I was wrong. My first attempt at the character for "river" looked like three tired worms.'),
    ('p', 'The club advisor, Mr. Kondo, watched me for a while. "You write very fast," he said. "In calligraphy, the brush is not a pen. Each stroke must have a beginning, a middle and an end." '
          'He showed me how he slowly ground the ink stick before writing. "This is not wasted time," he said. "It calms the mind."'),
    ('p', 'I started coming to the club room twenty minutes before morning lessons. At first, I did it because I was embarrassed by my poor work. Later, I realised I was looking forward to it. The quiet room, the smell of the ink and the sound of the brush on paper became my favourite part of the day.'),
    ('p', 'In October, Mr. Kondo told me I could submit a work to the school festival. I chose the character 縁 (en), which Aya had explained to me. It means a connection between people — the kind of bond that seems to happen by chance but feels meant to be. '
          'I wrote it more than two hundred times. On the last day before the deadline, I finally wrote one I was not ashamed of.'),
    ('p', 'At the festival, an elderly visitor stood in front of my work for a long time. Then she turned to me and said, in slow English, "This character is right for you." I did not win a prize, but I have never been prouder of anything. '
          'The work now hangs in my room in Lyon, and every time I look at it, I think of Aya, Mr. Kondo and the quiet mornings in the club room.'),
   ]),
  ],
  'qs': [
   {'no': 1, 'prompt': 'What did Mr. Kondo say was Daniel\'s main problem at first?', 'pts': 3, 'ans': 3,
    'choices': ['He used too much ink.', 'He held the brush like a pen.', 'He wrote too quickly.', 'He chose characters that were too difficult.'],
    'ex': ['"You write very fast" → ③。② は「筆はペンではない」という説明で、指摘の中心は速さ。']},
   {'no': 2, 'prompt': 'Put the following events into the order in which they happened.\n{1} → {2} → {3} → {4}', 'pts': 3, 'ans': [2, 4, 1, 3], 'score': 'all',
    'choices': ['Daniel chose the character 縁.', 'Daniel wrote a character that looked like worms.', 'An elderly visitor spoke to Daniel.', 'Daniel began practising before morning lessons.', 'Daniel won a prize at the festival.'],
    'ans_text': '②→④→①→③',
    'ex': ['最初の「川」（第1段落）→ 朝練を始める（第3段落）→ 「縁」を選ぶ（第4段落）→ 文化祭で老婦人に話しかけられる（第5段落）。⑤ 入賞はしていない。']},
   {'no': 3, 'prompt': 'How did Daniel\'s feelings about the morning practice change?', 'pts': 3, 'ans': 1,
    'choices': ['He started because he was embarrassed, but came to enjoy it.', 'He enjoyed it at first, but later found it boring.', 'He always disliked it but did it for Aya.', 'He did it only to win a prize.'],
    'ex': ['"At first, I did it because I was embarrassed … Later, I realised I was looking forward to it." → ①。']},
  ]}]}

P4 = {
 'label': '第4問', 'title': '推敲（下書きとコメント）', 'pts': 12,
 'gist': ['高校生 Yuto の意見文「学校でスマートフォンを授業に活用すべきだ」の下書き。理由は「調べ学習」「英語の発音練習」。気が散るという反論にも答える。'],
 'vocab': ['distraction 気を散らすもの', 'pronunciation 発音', 'rule ルール', 'airplane mode 機内モード'],
 'sections': [{
  'instr': 'あなたは英語の授業で意見文を書いています。次は Yuto の下書きと先生のコメントです。',
  'blocks': [
   ('box', [
    ('title', 'Smartphones Can Be Learning Tools'),
    ('p', 'At my school, students must keep their smartphones in their bags all day. I think teachers should allow us to use them in some lessons, because they can help us learn.'),
    ('p', 'First, smartphones let us find information quickly. In social studies, for example, we could check current news or look at maps and photos of the places we are studying. **(a)** This makes lessons more connected to the real world. **(b)**'),
    ('p', 'Second, smartphones are useful for practising English pronunciation. **[ B ]** many apps can listen to our voice and tell us which sounds we need to improve. **(c)** In a class of forty students, the teacher cannot check everyone\'s pronunciation. **(d)**'),
    ('p', 'Of course, some people worry that students will play games or use social media during lessons. __My brother has a new smartphone with a great camera.__ Clear rules, such as using airplane mode and putting phones face down when the teacher is speaking, can reduce this problem.'),
    ('p', '**[ D ]** In conclusion, smartphones are popular among students, so schools should think about them.'),
   ]),
   ('box', [
    ('ja', '**先生のコメント**'),
    ('ja', 'A：第3段落に、アプリが特に役立つ理由をもう1文加えましょう。'),
    ('ja', 'B：前後をつなぐ語句を入れましょう。'),
    ('ja', 'C：下線部は反論への応答になっていません。差し替えましょう。'),
    ('ja', 'D：結論で、主張・理由・反論への答えをまとめましょう。'),
   ]),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Based on Comment A, where is the best place to add the following sentence?\n"With an app, however, each of us can get feedback whenever we practise."', 'pts': 3, 'ans': 4,
    'choices': ['(a)', '(b)', '(c)', '(d)'],
    'ex': ['「40人では先生が全員を確認できない」（(c)の後の文）を however で受け、アプリなら一人ひとりが練習のたびに助言を得られると続ける → **(d)**。']},
   {'no': 2, 'prompt': 'Based on Comment B, which is the best expression to put in **[ B ]**?', 'pts': 3, 'ans': 3,
    'choices': ['However,', 'In contrast,', 'For example,', 'As a result,'],
    'ex': ['前の文（発音練習に役立つ）の具体例としてアプリの機能を挙げる → For example。']},
   {'no': 3, 'prompt': 'Based on Comment C, which is the best sentence to replace the underlined one?', 'pts': 3, 'ans': 1,
    'choices': ['However, this risk can be managed.', 'Many games are free to download.', 'Smartphones are expensive to repair.', 'Some teachers do not have smartphones.'],
    'ex': ['反論（ゲームやSNS）を受け、後の「明確なルールで減らせる」につなぐ → ①。']},
   {'no': 4, 'prompt': 'Based on Comment D, which is the best way to rewrite the conclusion?', 'pts': 3, 'ans': 2,
    'choices': ['In conclusion, smartphones should be banned from schools.', 'In conclusion, with clear rules, smartphones can help us find information and practise pronunciation, so schools should allow them in some lessons.',
                'In conclusion, everyone should buy a new smartphone.', 'In conclusion, social media is useful for learning.'],
    'ex': ['主張（一部の授業で許可）＋理由2つ（情報検索・発音練習）＋反論への答え（ルール）→ ②。']},
  ]}]}

PARTS_A = [P1, P2, P3, P4]
