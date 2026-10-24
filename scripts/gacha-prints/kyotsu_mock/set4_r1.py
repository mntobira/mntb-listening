"""第4回 リーディング 第1〜4問"""

P1 = {
 'label': '第1問', 'title': '案内・メモ（情報の読み取り）', 'pts': 6,
 'gist': ['ホストマザー Karen が冷蔵庫に貼ったメモ。週末は家族が留守にするため、留学生 Riku への頼みごとが書かれている。',
          '植物の水やり（ベランダは土曜だけ）、ネコのえさ（朝夕。薬は朝だけ）、日曜朝のごみ出し。困ったら隣の Mr. Lee に連絡する。'],
 'vocab': ['balcony バルコニー', 'tablet 錠剤', 'bin（英）ごみ箱', 'spare key 合鍵'],
 'sections': [{
  'instr': 'あなたはカナダでホームステイをしています。ホストマザーの Karen が冷蔵庫にメモを貼っていきました。',
  'blocks': [
   ('box', [
    ('title', 'Riku — Weekend To-Do List'),
    ('p', 'Hi Riku! Thanks so much for looking after things while we\'re at Grandma\'s (Friday night to Sunday evening).'),
    ('pl', '**Plants:** Water the kitchen plants on Saturday and Sunday. The balcony plants only need water on Saturday — it\'s supposed to rain on Sunday.\n'
           '**Biscuit (the cat):** Food twice a day, morning and evening. Put her tablet in the **morning** food only. Don\'t let her out!\n'
           '**Rubbish:** Take the green bin out to the street on Sunday morning before 8.\n'
           '**Problems?** Mr. Lee next door has a spare key. His number is on the board by the door.'),
    ('p', 'There\'s pizza in the freezer for Saturday. See you on Sunday! — Karen'),
   ]),
  ],
  'qs': [
   {'no': 1, 'prompt': 'What should Riku do on Sunday?', 'pts': 2, 'ans': 2,
    'choices': ['Water the balcony plants', 'Take out the green bin', 'Give Biscuit her tablet in the evening', 'Visit his grandmother'],
    'ex': ['ごみ出しは日曜の朝8時前。① ベランダの水やりは土曜だけ。③ 薬は朝のえさにだけ入れる。']},
   {'no': 2, 'prompt': 'Why doesn\'t Riku need to water the balcony plants on Sunday?', 'pts': 2, 'ans': 4,
    'choices': ['Mr. Lee will water them.', 'They have already died.', 'Karen will water them when she returns.', 'Rain is expected that day.'],
    'ex': ['"it\'s supposed to rain on Sunday" → ④。']},
   {'no': 3, 'prompt': 'If Riku gets locked out of the house, he should', 'pts': 2, 'ans': 1,
    'choices': ['contact the neighbour.', 'call Karen\'s grandmother.', 'wait for the family to return on Saturday.', 'let the cat out.'],
    'ex': ['隣の Mr. Lee が合鍵を持っている → ①。③ 家族が帰るのは日曜の夜。']},
  ]}]}

P2 = {
 'label': '第2問', 'title': '調査結果とコメント（事実と意見）', 'pts': 12,
 'gist': ['イギリスの大学新聞が、学生500人にキャンパスの食堂について調査した記事。項目別の満足度グラフ、食堂の改善予定、学生のコメント。'],
 'vocab': ['refectory（英）大学の食堂', 'vegan 完全菜食の', 'queue（英）列', 'add up 積み重なる'],
 'sections': [{
  'instr': 'あなたはイギリスの大学の短期講座に参加しています。大学新聞で次の記事を読みました。',
  'blocks': [
   ('box', [
    ('title', 'Refectory Survey: What Do Students Really Think?'),
    ('p', 'Last month, the Student Union asked 500 students to rate the campus refectory. The graph shows the percentage who said they were "satisfied" or "very satisfied" with each area.'),
    ('bar', {'title': 'Satisfaction with the refectory (%)', 'cats': ['Taste', 'Price', 'Vegan options', 'Waiting time', 'Seating'],
             'series': [[72, 38, 41, 29, 66]], 'unit': '%', 'maxv': 100, 'step': 20}),
    ('p', 'The refectory manager said that a second serving counter will open in January to reduce queues at lunchtime. A new vegan menu will also be introduced next term.'),
    ('h', 'Student comments'),
    ('pl', '**Fatima:** The curry is honestly the best I\'ve had in this country. But £6.50 for lunch every day really adds up.'),
    ('pl', '**Josh:** I waited 25 minutes yesterday and had only ten minutes to eat before my seminar.'),
    ('pl', '**Elena:** As a vegan, I usually end up with chips and salad. I\'m glad they\'re finally listening.'),
   ]),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Which area were students the **least** satisfied with?', 'pts': 3, 'ans': 4,
    'choices': ['Taste', 'Price', 'Vegan options', 'Waiting time'],
    'ex': ['待ち時間 29% が最も低い。']},
   {'no': 2, 'prompt': 'Which of the following is an **opinion** rather than a fact?', 'pts': 3, 'ans': 1,
    'choices': ['The curry is the best Fatima has had in the country.', 'Josh waited 25 minutes.', 'Lunch costs £6.50.', 'A second counter will open in January.'],
    'ex': ['"the best I\'ve had" は Fatima の評価（意見）。②③④ は確認できる事実。']},
   {'no': 3, 'prompt': 'Which change is planned to deal with the problem Josh described?', 'pts': 3, 'ans': 3,
    'choices': ['A new vegan menu', 'Lower prices', 'A second serving counter', 'More seats'],
    'ex': ['Josh の問題は待ち時間 → 2つ目のカウンターで行列を減らす → ③。']},
   {'no': 4, 'prompt': 'What does Elena mean by "I\'m glad they\'re finally listening"?', 'pts': 3, 'ans': 2,
    'choices': ['The staff have started to play music.', 'She is pleased that a vegan menu is coming.', 'She thinks the survey was too long.', 'She wants to work in the refectory.'],
    'ex': ['ビーガン向けの選択肢が少ないという不満 → 来学期に新メニューが入る → ②。']},
  ]}]}

P3 = {
 'label': '第3問', 'title': '物語（出来事の順序・語句の意味）', 'pts': 9,
 'gist': ['中学生の Hina は、町の慈善イベント「アヒルのおもちゃレース」を手伝う。前夜の大雨で川が増水し、中止の危機に。',
          'Hina は公園の横の静かな運河を使う案を出し、レースは無事に開かれた。集まったお金は川の清掃団体に寄付された。'],
 'vocab': ['charity 慈善', 'swollen 増水した', 'canal 運河', 'lock（運河の）水門', 'litter ごみ'],
 'sections': [{
  'instr': 'あなたは英語の授業で、地域行事についての短い物語を読んでいます。',
  'blocks': [
   ('box', [
    ('title', 'The Great Duck Race'),
    ('p', 'Every September, the town of Millbrook holds a charity duck race. People buy numbered rubber ducks for two pounds each, and the ducks are dropped into the river from the old stone bridge. The first duck to float under the finish line wins a bicycle. '
          'This year, fourteen-year-old Hina had volunteered to help her uncle, who organised the event.'),
    ('p', 'On the night before the race, it rained so heavily that Hina could hear the water roaring from her bedroom. In the morning, the river was brown and **swollen**, rushing much faster than usual and carrying branches. '
          'Her uncle stood on the bridge, shaking his head. "If we drop the ducks in there, half of them will end up in the sea," he said. "We might have to cancel."'),
    ('p', 'Hina thought about the 3,000 ducks already sold and the children who had been waiting all week. Then she remembered the canal that ran beside the park, where she sometimes fed swans. It was narrow, calm and only a few hundred metres long. '
          '"What about the canal?" she asked. "The water there barely moves, but there\'s a lock at the end. If they open it a little, there\'ll be a gentle current."'),
    ('p', 'Her uncle phoned the canal office, and by ten o\'clock, the plan was ready. Volunteers moved the finish line, and Hina\'s classmates stood along the banks with fishing nets to catch any ducks that drifted to the side. '
          'The race started an hour late, but the crowd cheered just as loudly as in any other year.'),
    ('p', 'The winning duck, number 1,207, belonged to an elderly man who said he had bought a duck every year for thirty years and never won anything. The race raised £6,000, which was given to a group that cleans litter from the river. '
          'At the end of the day, Hina\'s uncle handed her a rubber duck with a gold ribbon. "For the best idea of the year," he said.'),
   ]),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Why did Hina\'s uncle think the race might have to be cancelled?', 'pts': 3, 'ans': 1,
    'choices': ['The river was flowing too fast after heavy rain.', 'Not enough ducks had been sold.', 'The stone bridge was damaged.', 'The canal office refused to help.'],
    'ex': ['前夜の大雨で川が増水し、速く流れていた。「アヒルの半分が海へ流れてしまう」。']},
   {'no': 2, 'prompt': 'Put the following events into the order in which they happened.\n{1} → {2} → {3} → {4}', 'pts': 3, 'ans': [4, 2, 1, 3], 'score': 'all',
    'choices': ['Hina\'s classmates stood along the canal with nets.', 'Hina suggested using the canal.', 'An elderly man won the bicycle.',
                'Heavy rain fell during the night.', 'The ducks were dropped from the stone bridge.'],
    'ans_text': '④→②→①→③',
    'ex': ['前夜の大雨 → 運河を提案 → 網を持って岸に並ぶ → 老人が優勝。',
           '⑤ 今年は橋から落とさず、運河で行われたので起こっていない。']},
   {'no': 3, 'prompt': 'In the second paragraph, the word **swollen** is closest in meaning to', 'pts': 3, 'ans': 3,
    'choices': ['frozen.', 'very clean.', 'higher and fuller than usual.', 'completely dry.'],
    'ex': ['大雨の後で、茶色く、いつもより速く流れて枝を運んでいる → 増水した → ③。']},
  ]}]}

P4 = {
 'label': '第4問', 'title': '推敲（下書きとコメント）', 'pts': 12,
 'gist': ['高校生 Mao の意見文「学校の図書館をもっと長く開けるべきだ」の下書き。理由は「家に静かな場所がない生徒がいる」「図書館にしかない資料がある」。費用の反論にも答える。'],
 'vocab': ['reference book 参考図書', 'supervise 監督する', 'take turns 交代でする', 'entrance exam 入学試験'],
 'sections': [{
  'instr': 'あなたは英語の授業で意見文を書いています。次は Mao の下書きと先生のコメントです。',
  'blocks': [
   ('box', [
    ('title', 'Our Library Should Open Longer'),
    ('p', 'At our school, the library closes at 4:30 p.m., just thirty minutes after classes end. I believe it should stay open until 7:00 p.m. on weekdays.'),
    ('p', 'First, many students have no quiet place to study at home. Some share a room with younger brothers and sisters, and others live in small apartments. **[ A ]** the library is the only place where they can concentrate.'),
    ('p', 'Second, the library has resources that are not available elsewhere. **(a)** Students can use reference books, newspapers and computers for free. **(b)** For students preparing for university entrance exams, these resources are especially valuable. **(c)** Many of them also want to study with friends and ask each other questions. **(d)**'),
    ('p', 'Some people may say that keeping the library open would cost too much because staff would have to work longer. __I usually borrow mystery novels from the library.__ Parent volunteers or university students could take turns supervising in the evening.'),
    ('p', '**[ D ]** In conclusion, the library closes at 4:30, and I think that is too early.'),
   ]),
   ('box', [
    ('ja', '**先生のコメント**'),
    ('ja', 'A：前の文とのつながりを示す語句を入れましょう。'),
    ('ja', 'B：第3段落に、自分の学校の具体的なデータを加えましょう。'),
    ('ja', 'C：下線部は反論への応答になっていません。差し替えましょう。'),
    ('ja', 'D：結論で、主張・理由・反論への答えをまとめましょう。'),
   ]),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Based on Comment A, which is the best expression to put in **[ A ]**?', 'pts': 3, 'ans': 2,
    'choices': ['In contrast,', 'For these students,', 'Nevertheless,', 'In the past,'],
    'ex': ['前文の「家に静かな場所がない生徒たち」を受けて「そうした生徒にとって」→ ②。']},
   {'no': 2, 'prompt': 'Based on Comment B, where is the best place to add the following sentence?\n"In a survey at our school, 64% of third-year students said they would use the library after 4:30 if it were open."', 'pts': 3, 'ans': 3,
    'choices': ['(a)', '(b)', '(c)', '(d)'],
    'ex': ['「受験生には特に価値がある」の直後 **(c)** に置くと、3年生の64％という数字がその主張を裏づける。',
           '(d) だと「友だちと勉強したい」という別の話の後になり、つながりが弱い。']},
   {'no': 3, 'prompt': 'Based on Comment C, which is the best sentence to replace the underlined one?', 'pts': 3, 'ans': 4,
    'choices': ['The library has more than 20,000 books.', 'Some students prefer to study at cafés.', 'Libraries in other countries are open on Sundays.',
                'However, the extra cost could be kept low.'],
    'ex': ['前の文の反論（費用がかかる）に応答し、後の文（保護者や大学生が交代で見守る）につながる → ④。']},
   {'no': 4, 'prompt': 'Based on Comment D, which is the best way to rewrite the conclusion?', 'pts': 3, 'ans': 1,
    'choices': ['In conclusion, opening the library until 7:00 would give students a quiet place and useful resources, and volunteers could help keep costs down.',
                'In conclusion, students should study only at home.', 'In conclusion, the library should sell mystery novels.', 'In conclusion, staff should work longer for no pay.'],
    'ex': ['主張（7時まで開館）＋理由2つ（静かな場所・資料）＋反論への答え（ボランティア）をすべて含む → ①。']},
  ]}]}

PARTS_A = [P1, P2, P3, P4]
