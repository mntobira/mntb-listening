"""第3回 リーディング 第1〜4問"""

P1 = {
 'label': '第1問', 'title': 'テキストメッセージ（情報の読み取り）', 'pts': 6,
 'gist': ['オーストラリア留学中の Yuki と、クラスメイトの Chloe のやりとり。グループ発表の準備で図書館に集まる予定だったが、図書館が改装で閉館。'
          'Chloe の家に変更し、Yuki はノートパソコン、Chloe はプロジェクターを用意する。'],
 'vocab': ['renovation 改装', 'arvo（豪口語）午後 = afternoon', 'heaps（豪口語）たくさん', 'projector プロジェクター'],
 'sections': [{
  'instr': 'あなたはオーストラリアに留学中です。クラスメイトの Chloe とメッセージをやりとりしています。',
  'blocks': [
   ('msg', 'Chloe', "Hey Yuki! Bad news — the town library is closed all week for renovation. We can't meet there tomorrow arvo for our presentation practice.", 'l'),
   ('msg', 'Yuki', "Oh no! What about the school study room?", 'r'),
   ('msg', 'Chloe', "It's booked by the debate team until 5. How about my place instead? It's a 10-minute walk from school. Mum says it's fine.", 'l'),
   ('msg', 'Yuki', "That's very kind. Shall I bring anything?", 'r'),
   ('msg', 'Chloe', "Could you bring your laptop? Mine's really slow. We've got a projector, so we can practise with the slides on the wall.", 'l'),
   ('msg', 'Yuki', "Sure. I'll also bring some Japanese sweets for your family.", 'r'),
   ('msg', 'Chloe', "Heaps nice! See you at the school gate at 3:30, and we'll walk over together.", 'l'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Why can\'t the students practise at the library?', 'pts': 2, 'ans': 3,
    'choices': ['The debate team has booked it.', "Chloe's mother does not allow it.", 'It is being renovated.', 'It is too far from school.'],
    'ex': ['"closed all week for renovation" が根拠。① はスクールの自習室の話。']},
   {'no': 2, 'prompt': 'What will Yuki bring?', 'pts': 2, 'ans': 1,
    'choices': ['A laptop and some sweets', 'A projector and some sweets', 'A laptop and a projector', 'Only a projector'],
    'ex': ['Chloe が頼んだノートパソコン＋ Yuki が自分から言ったお菓子。プロジェクターは Chloe の家にある。']},
   {'no': 3, 'prompt': 'Where will Yuki and Chloe meet first tomorrow?', 'pts': 2, 'ans': 4,
    'choices': ['At the library', "At Chloe's house", 'In the school study room', 'At the school gate'],
    'ex': ['"See you at the school gate at 3:30, and we\'ll walk over together." → まず校門で待ち合わせ。② は最終的な練習場所。']},
  ]}]}

P2 = {
 'label': '第2問', 'title': 'イベント案内とレビュー（事実と意見）', 'pts': 12,
 'gist': ['イギリスの博物館の夜間イベント「Museum Lates」の案内（金曜夜・18歳以上・ガイドツアー・ワークショップ）と参加者のレビュー。'],
 'vocab': ['late（英）夜間開館', 'admission 入場', 'workshop 体験講座', 'heaving（英口語）とても混んでいる'],
 'sections': [{
  'instr': 'あなたはロンドンに留学中で、週末の過ごし方を探しています。次のウェブページを見つけました。',
  'blocks': [
   ('box', [
    ('title', 'Museum Lates at the Thornbury Science Museum'),
    ('p', 'On the last Friday of every month, the museum stays open until 10 p.m. for adults only (18+). Enjoy live music, a pop-up bar and special activities among our galleries.'),
    ('table', [['Activity', 'Time', 'Booking'],
               ['Torch-lit tour of the dinosaur hall', '7:00 / 8:30 p.m.', 'Required (£6)'],
               ['Make-your-own perfume workshop', '7:30 p.m.', 'Required (£12)'],
               ['Silent disco in the space gallery', 'All evening', 'Not required'],
               ['Talk: "How Do Robots Learn?"', '8:00 p.m.', 'Not required']], [70, 50, 60]),
    ('p', 'General admission to Museum Lates is free, but bags larger than A3 size must be left in the cloakroom (£2). Please bring photo ID.'),
    ('h', 'Visitor reviews'),
    ('pl', '**Hannah:** The torch-lit tour was the highlight — seeing the T. rex skeleton in the dark was genuinely spooky. Book early; it sold out a week before.'),
    ('pl', '**Marco:** Great atmosphere, but the main hall was absolutely heaving by 9 o\'clock. I\'d arrive at opening time if I went again.'),
    ('pl', '**Aisha:** The robot talk lasted 40 minutes and included a live demonstration. Probably the best free talk I\'ve ever been to.'),
   ], '#fbfaf6'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Which activity can you join without booking?', 'pts': 3, 'ans': 2,
    'choices': ['The torch-lit tour', 'The silent disco', 'The perfume workshop', 'All of the activities'],
    'ex': ['表で "Not required" はサイレントディスコとロボットの講演。選択肢にあるのは ②。']},
   {'no': 2, 'prompt': 'Which of the following is a **fact** stated in the reviews?', 'pts': 3, 'ans': 4,
    'choices': ['The tour was the highlight of the evening.', 'The atmosphere was great.', 'The robot talk was the best free talk ever.', 'The talk included a live demonstration.'],
    'ex': ['Aisha "included a live demonstration" は確認できる事実。①②③ は評価（意見）。']},
   {'no': 3, 'prompt': 'If you visit with a large backpack, you will need to', 'pts': 3, 'ans': 1,
    'choices': ['pay £2 to leave it in the cloakroom.', 'buy a ticket for £6.', 'show it at the entrance with your ID.', 'keep it with you in the galleries.'],
    'ex': ['A3より大きいかばんはクロークに預ける（£2）。']},
   {'no': 4, 'prompt': 'Based on the reviews, which advice would be most useful for a first-time visitor?', 'pts': 3, 'ans': 3,
    'choices': ['Go only to the perfume workshop.', 'Arrive after 9 p.m. to avoid queues.', 'Book the tour well in advance and arrive early.', 'Bring children to the talk.'],
    'ex': ['Hannah「1週間前に売り切れた・早めに予約」＋ Marco「9時には混む・開場時に来る」→ ③。② は逆、④ 18歳以上限定。']},
  ]}]}

P3 = {
 'label': '第3問', 'title': '物語（出来事の順序・語句の意味）', 'pts': 9,
 'gist': ['高校の写真部員 Ren は、コンテストに出す作品に悩む。派手な夕焼けの写真が撮れずにいたが、毎朝店を開ける近所のパン屋の老人を撮った一枚が、'
          '顧問に「物語がある」と言われ、入賞する。'],
 'vocab': ['tripod 三脚', 'blurry ぼやけた', 'flour 小麦粉', 'candid 自然な・ありのままの'],
 'sections': [{
  'instr': 'あなたは英語の授業で、生徒が書いた短い物語を読んでいます。',
  'blocks': [
   ('box', [
    ('title', 'The Picture I Didn\'t Plan'),
    ('p', 'The deadline for the city photo contest was two weeks away, and Ren still had nothing to submit. Every evening, he carried his tripod up to the hill behind the school, hoping to capture a perfect sunset over the harbour. '
          'But it was the rainy season. Night after night, the sky stayed grey, and his photos looked flat and lifeless.'),
    ('p', 'One morning, he left home early to try a sunrise instead. Again, clouds covered everything. Disappointed, he was walking past the small bakery on the corner when he saw Mr. Mori, the owner, pulling up the shutters. '
          'Mr. Mori was over eighty, and his hands and apron were white with flour. Steam rose from the trays of bread behind him. Without thinking, Ren lifted his camera and pressed the button.'),
    ('p', 'Mr. Mori turned, surprised, and then laughed. "Taking pictures of an old man? You should photograph something beautiful." Ren apologised and showed him the screen. The old man looked at it for a long time. '
          '"My wife used to stand right there every morning," he said quietly. "Fifty-two years."'),
    ('p', 'At school, Ren showed his club advisor a dozen sunset shots and, almost as an afterthought, the bakery picture. Ms. Ueda pointed straight at the last one. "This," she said. "The sunsets are pretty, but this one has a story. It\'s **candid** — he didn\'t pose, and you can feel it."'),
    ('p', 'Ren entered the photo with Mr. Mori\'s permission. A month later, it won second prize. He printed a large copy and took it to the bakery. It now hangs beside the cash register, and every morning, when Mr. Mori pulls up the shutters, he says good morning to it.'),
   ], '#fbfaf6'),
  ],
  'qs': [
   {'no': 1, 'prompt': "Why were Ren's sunset photos unsuccessful?", 'pts': 3, 'ans': 2,
    'choices': ['His camera was broken.', 'The weather was cloudy during the rainy season.', 'The hill was closed to students.', 'He did not have a tripod.'],
    'ex': ['"it was the rainy season. Night after night, the sky stayed grey" → ②。']},
   {'no': 2, 'prompt': 'Put the following events into the order in which they happened.\n{1} → {2} → {3} → {4}', 'pts': 3, 'ans': [3, 1, 4, 2], 'score': 'all',
    'choices': ['Ren took a photo of Mr. Mori.', 'The photo was hung in the bakery.', 'Ren tried to photograph sunsets from the hill.', "Ms. Ueda chose the bakery photo.", 'Mr. Mori asked Ren to take his photo.'],
    'ans_text': '③→①→④→②',
    'ex': ['丘で夕焼け（第1段落）→ パン屋を撮る（第2段落）→ 顧問が選ぶ（第4段落）→ 店に飾られる（第5段落）。',
           '⑤ は逆：Ren が思わず撮り、老人は「美しいものを撮りなさい」と笑った。']},
   {'no': 3, 'prompt': 'In the fourth paragraph, the word **candid** is closest in meaning to', 'pts': 3, 'ans': 1,
    'choices': ['natural and not posed.', 'carefully planned.', 'brightly coloured.', 'taken from far away.'],
    'ex': ['直後の "he didn\'t pose, and you can feel it" が言いかえ → ①。']},
  ]}]}

P4 = {
 'label': '第4問', 'title': '推敲（下書きとコメント）', 'pts': 12,
 'gist': ['高校生 Kaito のスピーチ原稿「なぜ外国語を学ぶのか」の下書き。主張は「外国語は仕事のためだけでなく、他人の考え方を理解する窓になる」。'],
 'vocab': ['perspective 物の見方', 'translation app 翻訳アプリ', 'nuance 微妙な違い', 'fluent 流ちょうな'],
 'sections': [{
  'instr': 'あなたは英語の授業でスピーチ原稿を書いています。次は Kaito の下書きと先生のコメントです。',
  'blocks': [
   ('box', [
    ('title', 'Is Learning a Foreign Language Still Worth It?'),
    ('p', 'Some of my friends say there is no need to study foreign languages any more, because translation apps can do the job for us. I disagree. I believe learning a language gives us something that no app can.'),
    ('p', 'First, translation apps often miss nuance. **(a)** The Japanese word "otsukaresama," for example, has no single English equivalent. **(b)** Depending on the situation, it can mean "thank you for your hard work," "good job" or simply "see you." **(c)** Only a person who understands the culture can choose the right meaning. **(d)**'),
    ('p', 'Second, learning a language changes the way we think. When I studied Spanish, I noticed that it has two verbs for "to be" — one for permanent qualities and one for temporary states. **[ B ]** I started to think more carefully about whether a feeling or situation would last.'),
    ('p', 'Third, speaking someone\'s language shows respect. __My favourite food is ramen, especially with lots of garlic.__ When I said just a few words of Vietnamese to a classmate\'s grandmother, she smiled and held my hands.'),
    ('p', '**[ D ]** In conclusion, translation apps are popular, but I still study English every day.'),
   ], '#fbfaf6'),
   ('box', [
    ('ja', '**先生のコメント**'),
    ('ja', '**A**：第2段落に、アプリの誤訳の具体例を1文加えましょう。'),
    ('ja', '**B**：前後をつなぐ語句を入れましょう。'),
    ('ja', '**C**：下線部は主張と関係ありません。差し替えましょう。'),
    ('ja', '**D**：結論で三つの理由をまとめましょう。'),
   ], '#fff6df'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Based on Comment A, where is the best place to add the following sentence?\n"When I typed it into an app, it suggested \'You must be tired,\' which sounded strange when I said it to my coach after practice."', 'pts': 3, 'ans': 3,
    'choices': ['(a)', '(b)', '(c)', '(d)'],
    'ex': ['挿入文はアプリの訳が場面に合わなかった例。「状況で意味が変わる」（(b)の後の文）の直後、「文化を理解する人だけが選べる」の直前 **(c)** が自然。',
           '(a)(b) では "it" が「おつかれさま」を指す前になり意味が通らない。']},
   {'no': 2, 'prompt': 'Based on Comment B, which is the best expression to put in **[ B ]**?', 'pts': 3, 'ans': 4,
    'choices': ['On the other hand,', 'For instance,', 'Even so,', 'Because of this,'],
    'ex': ['前文（2種類の be 動詞に気づいた）が**原因**、後文（感情が続くかよく考えるようになった）が**結果** → Because of this。']},
   {'no': 3, 'prompt': 'Based on Comment C, which is the best sentence to replace the underlined one?', 'pts': 3, 'ans': 2,
    'choices': ['Vietnamese has six tones.', 'Even a simple greeting in someone\'s first language can make them feel valued.',
                'Many apps are free to download.', 'Ramen is popular all over the world.'],
    'ex': ['主題文「相手の言語を話すことは敬意を示す」と、直後の例（祖母が笑って手を握った）をつなぐのは ②。']},
   {'no': 4, 'prompt': 'Based on Comment D, which is the best way to rewrite the conclusion?', 'pts': 3, 'ans': 1,
    'choices': ['In conclusion, learning a language helps us understand nuance, think in new ways and show respect — things no app can do for us.',
                'In conclusion, translation apps will soon be perfect.', 'In conclusion, everyone should study Spanish.', 'In conclusion, apps are more useful than teachers.'],
    'ex': ['三つの理由（ニュアンス・考え方・敬意）と主張を含む ①。']},
  ]}]}

PARTS_A = [P1, P2, P3, P4]
