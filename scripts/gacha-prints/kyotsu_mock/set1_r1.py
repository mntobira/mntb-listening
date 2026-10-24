"""第1回 リーディング 第1〜4問"""

P1 = {
 'label': '第1問', 'title': 'テキストメッセージ（情報の読み取り）', 'pts': 6,
 'gist': ['カナダでホームステイ中のケンタと、ホストシスターのエマのやりとり。エマは水泳の帰りに買い物をする。ケンタはおせんべいと歯みがき粉を頼むが、'
          'おせんべいはアジア食材店（7時閉店）にしかない。祖父の誕生日プレゼントには、ケンタが翌日に園芸用手袋を買いに行くことになる。'],
 'vocab': ['pick up 〜（店で）買ってくる', 'be out of 〜 〜を切らしている', 'hardware store 金物店・ホームセンター', 'pay 〜 back 〜にお金を返す'],
 'sections': [{
  'instr': 'あなたはカナダでホームステイをしています。ホストシスターの Emma から携帯電話にメッセージが届きました。メッセージを読み、問いに答えなさい。',
  'blocks': [
   ('msg', 'Emma', "Hi Kenta! Mom asked me to pick up a few things on my way home from swimming practice. We're having a barbecue for Grandpa's birthday on Saturday. Is there anything you'd like me to get for you?", 'l'),
   ('msg', 'Kenta', "Thanks! Could you buy some rice crackers? I want to share them with everyone at the party. Also, I'm out of toothpaste.", 'r'),
   ('msg', 'Emma', "Sure. The supermarket near the pool doesn't sell Japanese snacks, though. I'll try the Asian grocery store next to the library. It closes at seven, so I'll have to hurry.", 'l'),
   ('msg', 'Kenta', "If it's too much trouble, don't worry about the crackers. I can go there myself tomorrow after school.", 'r'),
   ('msg', 'Emma', "No problem! Practice ends at six. By the way, Grandpa loves gardening. Do you have any ideas for a present?", 'l'),
   ('msg', 'Kenta', "How about a pair of gardening gloves? I saw some nice ones at the hardware store downtown. I could get them tomorrow when I go to the station to buy my bus pass.", 'r'),
   ('msg', 'Emma', "Perfect! I'll pay you back half. See you at dinner!", 'l'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'What does Kenta ask Emma to buy for him?', 'pts': 2, 'ans': 3,
    'choices': ['A birthday cake for the barbecue', 'A pair of gardening gloves', 'Rice crackers and toothpaste', 'A new bus pass'],
    'ex': ['ケンタの最初の返信 "Could you buy some rice crackers? … Also, I\'m out of toothpaste." が根拠。',
           '② の手袋はケンタが**自分で**明日買うもの。④ のバスの定期券もケンタが駅で買う。① のケーキは話に出てこない。']},
   {'no': 2, 'prompt': 'Why does Emma say she will have to hurry?', 'pts': 2, 'ans': 2,
    'choices': ['Her swimming practice finishes late at night.', 'The store she plans to visit closes at seven.',
                'The supermarket near the pool is far from home.', 'Dinner will start earlier than usual.'],
    'ex': ['"It closes at seven, so I\'ll have to hurry." の It はアジア食材店。練習は6時に終わるので、急げば間に合う。',
           '① 練習は6時終了で「夜遅く」ではない。③④ は本文にない。']},
   {'no': 3, 'prompt': 'What will Kenta most likely do tomorrow?', 'pts': 2, 'ans': 1,
    'choices': ["Buy a present for Emma's grandfather downtown.", 'Go to the Asian grocery store after school.',
                'Join Emma at her swimming practice.', 'Prepare food for the barbecue with Emma\'s mother.'],
    'ex': ['ケンタ "I could get them tomorrow when I go to the station" ＋ エマ "Perfect!" で、明日ダウンタウンで手袋（祖父へのプレゼント）を買うことが決まる。',
           '② はエマが今日行くと言ったので不要になった（"No problem!"）。ひっかけの定番：途中で取り消された予定を選ばせる。']},
  ]}]}

P2 = {
 'label': '第2問', 'title': 'ウェブサイトとコメント（事実と意見）', 'pts': 12,
 'gist': ['イギリスの町 Greenford の「Cup Loop」：アプリに登録して、提携カフェでくり返し使えるカップを借りる仕組み。学生は無料、それ以外は年3ポンド。'
          '7日以内に提携カフェか返却箱に返す（遅れると5ポンド）。利用者・カフェ経営者の感想つき。'],
 'vocab': ['scheme（英）計画・制度', 'landfill ごみの埋め立て地', 'flask（英）水筒', 'fair enough まあ仕方ない'],
 'sections': [{
  'instr': 'あなたはイギリスに留学中で、環境問題についての発表の準備をしています。次のウェブサイトを見つけました。',
  'blocks': [
   ('box', [
    ('title', 'Cup Loop — Borrow a cup. Return it. Repeat.'),
    ('p', 'Cup Loop is a scheme that lets you borrow a reusable cup at any of our 38 partner cafés in Greenford. Here\'s how it works:'),
    ('pl', '1. Download the Cup Loop app and register (free for students, £3 a year for everyone else).\n'
           '2. Order your drink at a partner café and scan the QR code on the cup.\n'
           '3. Return the cup to any partner café or to one of the 12 return bins in the town centre within 7 days.'),
    ('p', 'If a cup is not returned within 7 days, £5 will be charged to your account. Each cup can be used up to 500 times and is washed in a commercial dishwasher after every use. '
          'Since the scheme started in 2023, more than 260,000 single-use cups have been kept out of landfill. Partner cafés also take 20p off any drink served in a Cup Loop cup.'),
    ('h', 'What our users say'),
    ('pl', '**Priya** (university student): I use Cup Loop almost every day. Not having to wash a cup myself is a huge relief! The only problem is that the return bins near the station are often full by the evening.'),
    ('pl', '**Tom** (office worker): I was charged £5 when I forgot to return a cup after a weekend trip. Fair enough, I suppose, but a reminder notification would be nice. Otherwise, it\'s a brilliant idea.'),
    ('pl', '**Grace** (café owner): Since joining, we\'ve cut our spending on paper cups by about 40%. Some customers still prefer to bring their own flasks, which is absolutely fine by us.'),
   ], '#fbfaf6'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'According to the website, who can use Cup Loop without paying a yearly fee?', 'pts': 3, 'ans': 2,
    'choices': ['Café owners', 'Students', 'People who registered in 2023', 'People who live in the town centre'],
    'ex': ['"free for students, £3 a year for everyone else" が根拠。', '③ の 2023 は制度が始まった年で、料金とは関係ない。']},
   {'no': 2, 'prompt': 'One **fact** (not an opinion) stated in the users\' comments is that', 'pts': 3, 'ans': 3,
    'choices': ['Cup Loop is a brilliant idea.', 'not having to wash a cup is a relief.',
                'a café has reduced the money it spends on paper cups.', 'a reminder notification would be nice.'],
    'ex': ['Grace の "we\'ve cut our spending on paper cups by about 40%" は数字で確かめられる**事実**。',
           '① brilliant、② a huge relief、④ would be nice はいずれも話し手の評価・感想（**意見**）。「確かめられるか」で判断する。']},
   {'no': 3, 'prompt': 'Tom had to pay £5 because he', 'pts': 3, 'ans': 2,
    'choices': ['broke one of the cups.', 'kept a cup for more than a week.', 'did not register on the app.', 'used the same cup more than 500 times.'],
    'ex': ['Tom は週末旅行の後に返し忘れた → "If a cup is not returned within 7 days, £5 will be charged" に当たる。within 7 days ＝ a week。']},
   {'no': 4, 'prompt': 'Which of the following is a problem mentioned by a user?', 'pts': 3, 'ans': 4,
    'choices': ['Partner cafés do not allow customers to bring their own flasks.', 'Cups are not washed often enough.',
                'The 20p discount is too small to attract new users.', 'Some return points cannot accept more cups later in the day.'],
    'ex': ['Priya "the return bins near the station are often full by the evening" を言いかえたのが ④。full by the evening → cannot accept more cups later in the day。',
           '① は逆（Grace は自分の水筒も歓迎）。② 毎回洗浄と書かれている。③ 割引額への不満は誰も言っていない。']},
  ]}]}

P3 = {
 'label': '第3問', 'title': '物語（出来事の順序・語句の意味）', 'pts': 9,
 'gist': ['高校生のミカは、亡くなった祖母の手書きのレシピ帳を見つけ、文化祭で祖母の梅ジャムを売ろうとする。レシピには「ちょうどよくなるまで煮る」としか書いておらず、'
          '強火で急いで煮た1回目は焦げて失敗。祖母と料理をしていた隣の原さんに教わり、弱火でじっくり煮て、最後にレモンの皮を加えるコツを知る。'
          'ジャムは昼前に売り切れ、ミカはレシピ帳の余白に自分の言葉でコツを書き足す。'],
 'vocab': ['scribble 走り書きする', 'simmer とろ火で煮る', 'scorch 焦がす', 'stir かき混ぜる', 'margin 余白'],
 'sections': [{
  'instr': 'あなたは英語の授業で、留学生向けのブログを読んでいます。',
  'blocks': [
   ('box', [
    ('title', "Grandma's Jam"),
    ('small', 'Posted by Mika, 15 November'),
    ('p', 'Last spring, while helping my parents clear out the storeroom, I found a cardboard box with "Mitsuko" written on the side. That was my grandmother\'s name. She passed away three years ago. '
          'Inside the box was a notebook full of recipes she had scribbled down over fifty years. On one page, stained with something purple, was her plum jam — the jam I used to eat on toast every morning at her house.'),
    ('p', 'Our school festival was coming up in October, and my class had decided to run a small café. I suggested selling toast with Grandma\'s jam. Everyone agreed, so I had to learn how to make it — fast.'),
    ('p', 'The recipe looked simple: plums, sugar, and "cook until it feels right." That was all. My first attempt was a disaster. I wanted to finish quickly, so I turned the heat up high. '
          'Ten minutes later, the kitchen smelled of burnt sugar, and the bottom of the pan was black. My mother laughed and said, "Your grandma never rushed anything."'),
    ('p', 'The next day, I took the notebook to Mrs. Hara, our neighbour, who used to make jam with Grandma every June. She smiled when she saw the purple stain. '
          '"Your grandmother never measured anything," she said. "She cooked with her nose." She showed me how to let the plums simmer slowly, stirring now and then, and to wait until the smell changed from sharp to sweet. '
          'At the very end, she added a little lemon peel. "That was Mitsuko\'s secret," she whispered.'),
    ('p', 'On the day of the festival, we sold out before noon. A woman who had known my grandmother tasted it and said quietly, "This takes me back." '
          'That evening, I wrote everything Mrs. Hara had taught me in the margin of the notebook, next to Grandma\'s handwriting. Now the recipe says a little more than "until it feels right."'),
   ], '#fbfaf6'),
  ],
  'qs': [
   {'no': 1, 'prompt': "Mika's first batch of jam failed mainly because she", 'pts': 3, 'ans': 2,
    'choices': ['used the wrong kind of plums.', 'cooked it too quickly over high heat.', 'forgot to add any sugar.', "could not read her grandmother's handwriting."],
    'ex': ['"I wanted to finish quickly, so I turned the heat up high." → 焦げた。母の "Your grandma never rushed anything." もヒント。']},
   {'no': 2, 'prompt': 'Put the following events into the order in which they happened.\n{1} → {2} → {3} → {4}', 'pts': 3, 'ans': [3, 4, 1, 2], 'score': 'all',
    'choices': ['Mika asked her neighbour for help.', "The class's jam sold out at the festival.", 'Mika found an old notebook in a box.',
                "Mika's first attempt to make jam went badly.", 'Mika gave the notebook to her grandmother.'],
    'ans_text': '③→④→①→②',
    'ex': ['箱からノートを発見（第1段落）→ 1回目の失敗（第3段落）→ 原さんに相談（第4段落）→ 文化祭で完売（第5段落）。',
           '⑤ は起こっていない（祖母は3年前に亡くなっている）。5つから4つを選ぶ型では「本文にない出来事」が1つ混ざる。']},
   {'no': 3, 'prompt': 'When Mrs. Hara says, "She cooked with her nose," she means that Mika\'s grandmother', 'pts': 3, 'ans': 1,
    'choices': ['judged when the food was ready by its smell and her experience.', 'often caught colds while she was cooking.',
                'did not like the smell of plums.', 'always followed recipes exactly.'],
    'ex': ['直前の "never measured anything"（量を測らない）と、直後の「香りが鋭い→甘いに変わるまで待つ」から、**香りと経験で判断した**という意味。',
           '④ は "never measured anything" と逆。文脈から語句の意味を決める問題は、前後1文ずつが根拠になる。']},
  ]}]}

P4 = {
 'label': '第4問', 'title': '推敲（下書きとコメント）', 'pts': 12,
 'gist': ['高校生の Daichi が、図書館で幼児に絵本を読み聞かせたボランティア体験をもとに書いたエッセイの下書き。主張は「読み聞かせは語彙・集中力・感情の理解を育てる」。'
          '先生のコメント（A〜D）に従って、つなぎの言葉・具体例の挿入位置・論点に合わない文の差し替え・結論の書き直しを考える。'],
 'vocab': ['picture book 絵本', 'attention span 集中できる時間', 'fidget そわそわする', 'empathy 共感'],
 'sections': [{
  'instr': 'あなたは英語の授業でエッセイを書いています。次は Daichi の下書きと、それに対する先生のコメントです。',
  'blocks': [
   ('box', [
    ('title', 'Why Reading Aloud Matters'),
    ('p', 'Last summer, I volunteered at our city library, where I read picture books to children aged four to six every Saturday. At first, I thought it would be easy, but I soon realised that reading aloud is a skill — and that it gives young children much more than entertainment.'),
    ('p', 'First, children who are read to regularly learn more words. Picture books often contain words that we rarely use in everyday conversation, such as "gigantic" or "whisper." '
          'When children hear these words in a story, they can guess their meanings from the pictures and the situation. **[ A ]** they tend to enjoy reading on their own later.'),
    ('p', 'Second, reading aloud can help children concentrate for longer. **(a)** On my first day, many of the children could not sit still for more than a few minutes. **(b)** '
          'However, as the weeks passed, I noticed a change. **(c)** By the end of the summer, most of the group could listen to a fifteen-minute story without fidgeting. **(d)**'),
    ('p', 'Third, stories help children understand feelings. __Many libraries also have cafés where parents can relax.__ When I used a scared voice for a lost rabbit, some children held each other\'s hands, and when the rabbit found its mother, they cheered.'),
    ('p', '**[ D ]** In conclusion, I volunteered at the library last summer, and I read picture books to children. It was a good experience.'),
   ], '#fbfaf6'),
   ('box', [
    ('ja', '**先生のコメント**'),
    ('ja', '**A**：前の文とのつながりがわかりにくいです。適切な語句を入れましょう。'),
    ('ja', '**B**：第3段落の主張を支える具体例を1文加えましょう。'),
    ('ja', '**C**：下線部の文は、この段落の主張とずれています。差し替えましょう。'),
    ('ja', '**D**：結論が導入のくり返しになっています。三つの論点をまとめて書き直しましょう。'),
   ], '#fff6df'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Based on Comment A, which is the best expression to put in **[ A ]**?', 'pts': 3, 'ans': 2,
    'choices': ['In contrast,', 'On top of that,', 'For example,', 'Nevertheless,'],
    'ex': ['前の文（語彙が増える）に、後の文（自分から読書を楽しむようになる）という**別の良い点を追加**している → On top of that（それに加えて）。',
           '① 対比、④ 逆接は流れに合わない。③ For example は前の内容の具体例を導くが、後の文は語彙の具体例ではない。']},
   {'no': 2, 'prompt': 'Based on Comment B, where is the best place to add the following sentence?\n"For instance, one boy who used to wander around the room began asking me to read the same dinosaur book again and again."', 'pts': 3, 'ans': 3,
    'choices': ['(a)', '(b)', '(c)', '(d)'],
    'ex': ['挿入文は「集中できなかった子が変わった」具体例。"However, as the weeks passed, I noticed a change." の直後 **(c)** に入れると、変化の具体例 → 夏の終わりの全体の様子、と自然につながる。',
           '(a)(b) は変化の前の段階なので「変わった」例は早すぎる。(d) は段落の結びの後で、For instance が浮く。']},
   {'no': 3, 'prompt': 'Based on Comment C, which is the best sentence to replace the underlined one?', 'pts': 3, 'ans': 2,
    'choices': ['Public libraries in Japan have a history of more than one hundred years.',
                'Hearing a story read with feeling helps children recognise emotions such as fear and joy.',
                'Some children prefer watching videos to listening to stories.', 'I usually took the bus to the library on Saturdays.'],
    'ex': ['段落の主題文は "stories help children understand feelings"。続く具体例（怖がる声で手をつなぐ・再会で歓声）につながるのは、**感情の理解**を説明する ②。',
           '①③④ はいずれも「感情」という論点から外れる。差し替え問題は「主題文」と「直後の具体例」の両方に合う文を選ぶ。']},
   {'no': 4, 'prompt': 'Based on Comment D, which is the best way to rewrite the conclusion?', 'pts': 3, 'ans': 4,
    'choices': ['In conclusion, libraries should open more cafés so that parents can relax while their children read.',
                'In conclusion, reading aloud is difficult, so only trained adults should do it.',
                'In conclusion, children today prefer videos, so picture books are no longer necessary.',
                'In conclusion, reading aloud helps young children build vocabulary, concentrate for longer, and understand feelings.'],
    'ex': ['三つの論点（語彙・集中力・感情の理解）をすべて含むのは ④ だけ。',
           '① は削除すべき文（カフェ）を根拠にしている。②③ は本文の主張と逆。結論の書き直しは「本文の論点を過不足なく」が基準。']},
  ]}]}

PARTS_A = [P1, P2, P3, P4]
