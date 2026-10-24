"""第1回 リーディング 第5〜8問"""

P5 = {
 'label': '第5問', 'title': 'チラシ・申込書・メール（複数資料の照合）', 'pts': 16,
 'gist': ['イギリスの Riverside 自然センターの夏の「ユース・レンジャー」募集のチラシ、申込書、担当者からのメール。',
          '参加条件（14〜18歳・3日間すべて参加）、コース（A 川の調査／B 野鳥観察／C 森の手入れ）、持ち物、費用（£15、会員は無料）。',
          'メールでは、Bコースの定員が埋まったこと、2日目の集合場所が変わることが知らされる。'],
 'vocab': ['wellies（英）長靴 = wellington boots', 'packed lunch（英）弁当', 'waterproof 防水の', 'oversubscribed 定員を超えた', 'car park（英）駐車場'],
 'sections': [{
  'instr': 'あなたはイギリスでホームステイ中の高校生 Haruto です。夏休みのボランティアについて、次のチラシと申込書、そして返信メールを読んでいます。',
  'blocks': [
   ('box', [
    ('title', 'Become a Youth Ranger this Summer!'),
    ('c', 'Riverside Nature Centre — 5th to 7th August, 9:30 a.m. – 3:30 p.m.'),
    ('p', 'Do you love the outdoors? Join our three-day programme and help us look after the wildlife of the River Avel. Open to young people aged 14 to 18. '
          'You must be able to attend **all three days**. Places are limited to 12 per course, and they are given on a first-come, first-served basis.'),
    ('table', [['Course', 'What you will do', 'Notes'],
               ['A: River Detectives', 'Test water quality and count insects living in the river', 'Wellies provided'],
               ['B: Bird Watch', 'Record birds at the wetland hide; learn to use a field guide', 'Binoculars provided'],
               ['C: Woodland Care', 'Clear paths, build bird boxes and plant young trees', 'Gloves provided; long trousers required']],
     [42, 90, 50]),
    ('p', '**Cost:** £15 for the three days (free for Nature Centre members). **What to bring:** a packed lunch, a water bottle and a waterproof jacket. '
          'Everyone who completes the programme will receive a Youth Ranger certificate. Apply by 20th July using the form below.'),
   ], '#f4f8f1'),
   ('box', [
    ('h', 'Application Form'),
    ('table', [['Name', 'Haruto Sato', 'Age', '16'],
               ['Member?', '☐ Yes　☑ No', 'Phone', '07700 900 461'],
               ['First choice', 'B: Bird Watch', 'Second choice', 'A: River Detectives'],
               ['Allergies / medical needs', 'Allergic to bee stings', '', '']], [40, 55, 32, 55]),
   ], '#ffffff'),
   ('box', [
    ('small', '**From:** Joanna Price <youthrangers@riversidenature.org.uk>\n**To:** Haruto Sato\n**Date:** 18th July\n**Subject:** Your Youth Ranger application'),
    ('p', 'Dear Haruto,'),
    ('p', 'Thank you for applying to be a Youth Ranger. I\'m sorry to say that Bird Watch was oversubscribed within two days, so we have placed you on your second choice. '
          'We have noted your allergy, and one of our staff members carries a first-aid kit at all times.'),
    ('p', 'Please note one change to the programme. On the second day (6th August), the meeting point will be the car park at Mill Bridge instead of the Nature Centre, '
          'as we will spend the morning further down the river. A minibus will bring everyone back to the Centre at lunchtime.'),
    ('p', 'Please pay the fee in cash on the first morning. We look forward to seeing you!'),
    ('p', 'Best wishes,\nJoanna Price, Youth Programme Coordinator'),
   ], '#fbfaf6'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Which course will Haruto take part in?', 'pts': 3, 'ans': 1,
    'choices': ['River Detectives', 'Bird Watch', 'Woodland Care', 'He has not been given a place on any course.'],
    'ex': ['メール "Bird Watch was oversubscribed … we have placed you on your second choice." → 申込書の第2希望は **A: River Detectives**。',
           '資料をまたいで照合する典型問題。メールだけ・申込書だけでは答えが決まらない。']},
   {'no': 2, 'prompt': 'Which of the following does Haruto **NOT** need to bring?', 'pts': 3, 'ans': 4,
    'choices': ['A packed lunch', 'A waterproof jacket', 'A water bottle', 'A pair of wellies'],
    'ex': ['チラシの表で Course A には "Wellies provided"（長靴は貸してくれる）。①②③ は全員の持ち物。']},
   {'no': 3, 'prompt': 'On 6th August, Haruto should', 'pts': 3, 'ans': 3,
    'choices': ['take a minibus from the Nature Centre in the morning.', 'stay at home because the programme is cancelled.',
                'go to the car park at Mill Bridge in the morning.', 'meet the other rangers at the wetland hide.'],
    'ex': ['メール第2段落：2日目は集合場所が Mill Bridge の駐車場に変更。ミニバスは**昼に**センターへ戻るためのもの（①は時間と方向が逆）。']},
   {'no': 4, 'prompt': 'Which of the following statements are true? Choose the best combination.\nA. Haruto has to pay £15.\nB. Places on each course are decided by lottery.\nC. Haruto must take part on all three days to join.\nD. The staff have not been told about Haruto\'s allergy.', 'pts': 3, 'ans': 2,
    'choices': ['A and B', 'A and C', 'B and D', 'C and D'],
    'ex': ['A：申込書で会員は No → £15 を払う（正）。C：チラシ "You must be able to attend all three days"（正）。',
           'B：first-come, first-served（先着順）で抽選ではない（誤）。D：メール "We have noted your allergy"（誤）。']},
   {'no': 5, 'prompt': 'Which **two** of the following can be learned from the materials? (The order does not matter.)', 'pts': 4, 'ans': [2, 5], 'any_order': True,
    'choices': ['Haruto will receive a certificate even if he misses one day.', 'Some courses were more popular than others.',
                'Course C participants can wear shorts.', 'The programme takes place every weekend in August.',
                'Haruto will spend part of the second day away from the Nature Centre.'],
    'ans_text': '②・⑤（順不同）',
    'ex': ['② Bird Watch は2日で定員超え → 人気に差がある。⑤ 2日目の午前は Mill Bridge で活動。',
           '① 修了者（全日参加）だけが証明書。③ Course C は長ズボン必須。④ 8月5〜7日の3日間だけ。']},
  ]}]}

P6 = {
 'label': '第6問', 'title': '物語文＋発表メモ（時系列・人物の変化）', 'pts': 12,
 'gist': ['架空の科学者「Ruth Okada」の伝記。北海道出身の母とアメリカ人の父のもとで育ち、雪の結晶の写真にひかれて研究者になる。'
          '戦後の研究所で人工雪の装置を改良し、失敗を重ねたのち「温度と湿度で結晶の形が決まる」図表を完成させる。晩年は子ども向けの雪の観察会を開いた。',
          '※設問の題材としての架空の伝記です（実在の人物ではありません）。'],
 'vocab': ['crystal 結晶', 'humidity 湿度', 'apparatus 装置', 'reproduce 再現する', 'mentor 指導者'],
 'sections': [{
  'instr': 'あなたは英語の授業で、科学者の伝記を読み、発表用のメモを作ることになりました。次の文章を読み、メモを完成させなさい。',
  'blocks': [
   ('box', [
    ('title', 'Ruth Okada: The Woman Who Read the Sky'),
    ('p', 'Ruth Okada was born in 1921 in a small town in Vermont, USA. Her mother had grown up in Hokkaido, and every winter she told Ruth stories about the deep snow of her childhood. '
          'When Ruth was ten, her father gave her an old camera, and she spent hours on the back porch trying to photograph snowflakes before they melted on her black wool glove. Most of her photographs were blurry, but a few showed perfect six-sided stars. '
          'She kept them in a biscuit tin under her bed.'),
    ('p', 'At university, Ruth studied physics — one of only three women in her year. Her professors were polite but did not expect much from her. One of them told her that "snow is for poets, not physicists." '
          'Ruth did not argue. Instead, she began collecting data. Every snowy night, she recorded the temperature and humidity outside the laboratory and photographed the crystals that fell. '
          'After two winters, she noticed something strange: on very cold, dry nights, the crystals were often shaped like small columns rather than stars.'),
    ('p', 'In 1948, Ruth joined a government weather laboratory in Colorado. Her new supervisor, Dr. Harold Finch, had heard about her photographs and asked her to help build an apparatus that could make snow inside the laboratory. '
          'The task was harder than either of them had imagined. For eighteen months, the machine produced nothing but frost and ice. Twice the cooling system broke down completely, and once a fire in the next room forced the team to start again from the beginning. '
          'Funding was nearly cut. Finch later wrote that it was Ruth\'s patience, more than any single idea, that kept the project alive.'),
    ('p', 'The breakthrough came in the winter of 1950. Ruth suggested hanging a single rabbit hair inside the chamber so that one crystal could grow on it slowly. '
          'By carefully changing the temperature and humidity, the team could now **reproduce** any shape they had seen in nature — needles, plates, columns and stars. '
          'Ruth combined these results with her notes from university to create a simple diagram showing which shape forms under which conditions. '
          'Meteorologists still use versions of this "snow chart" today: by looking at a snow crystal, they can tell what the sky was like high above the ground. Ruth liked to call snowflakes "letters sent from the sky."'),
    ('p', 'Ruth never became famous. She published her results under Finch\'s name as well as her own, and for many years, textbooks mentioned only him. '
          'She did not seem to mind. After she retired in 1981, she held free snow-watching classes for children every winter, handing out magnifying glasses and black cards to catch the flakes. '
          '"You don\'t need a laboratory to do science," she told them. "You need to look closely and write down what you see." '
          'In 2019, a group of former students placed a small sign near her old house. It reads: "Ruth Okada, 1921–2009. She taught us to read the sky."'),
   ], '#fbfaf6'),
   ('box', [
    ('ja', '**発表メモ**'),
    ('pl', '**Ruth Okada (1921–2009)**'),
    ('pl', '■ Early life: grew up hearing about snow in Hokkaido; took photos of snowflakes'),
    ('pl', '■ Career: events in order → 問1 (four boxes)'),
    ('pl', '■ What made the snow-making project succeed → 問2'),
    ('pl', '■ Her contributions → 問3 (two answers)'),
    ('pl', '■ What her life teaches us → 問4'),
   ], '#fff6df'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Put the following events into the order in which they happened.\n{1} → {2} → {3} → {4}', 'pts': 3, 'ans': [3, 1, 4, 2], 'score': 'all',
    'choices': ['Ruth started working with Dr. Finch.', 'Ruth began teaching children about snow.', 'A professor said snow was not a subject for physicists.', 'A fire forced the research team to start over.'],
    'ans_text': '③→①→④→②',
    'ex': ['大学時代の教授の発言（第2段落）→ 1948年 Finch のもとへ（第3段落）→ 研究中の火事（第3段落）→ 1981年の退職後に子ども向け観察会（第5段落）。']},
   {'no': 2, 'prompt': "According to the passage, what was the main reason the project continued?", 'pts': 3, 'ans': 4,
    'choices': ['The government gave the laboratory more money.', 'Dr. Finch found a way to repair the cooling system.',
                'Ruth used a new type of camera.', "Ruth's patience kept the team going through many failures."],
    'ex': ['"it was Ruth\'s patience, more than any single idea, that kept the project alive" が根拠。',
           '① 逆に "Funding was nearly cut"。②③ は本文にない。']},
   {'no': 3, 'prompt': 'Choose **two** contributions Ruth made. (The order does not matter.)', 'pts': 3, 'ans': [2, 5], 'any_order': True,
    'choices': ['She invented the first camera able to photograph snow.', 'She found a way to grow a single crystal slowly in a laboratory.',
                'She proved that all snow crystals are shaped like stars.', 'She persuaded textbooks to mention her name instead of Finch\'s.',
                'She linked crystal shapes to the conditions in which they form.'],
    'ans_text': '②・⑤（順不同）',
    'ex': ['② ウサギの毛1本に結晶をゆっくり育てる案。⑤ 温度・湿度と形の関係を図表（snow chart）にまとめた。',
           '③ 逆：柱状・針状など形はいろいろ。④ 教科書は長く Finch だけを載せ、Ruth は気にしなかった。']},
   {'no': 4, 'prompt': 'Which of the following best describes the message of Ruth\'s life?', 'pts': 3, 'ans': 1,
    'choices': ['Careful observation and recording can lead to discoveries, even without fame or special equipment.',
                'Scientists should always make sure that they receive credit for their work.',
                'Only people with expensive laboratories can make important discoveries.',
                'It is better to study art than science if you love nature.'],
    'ex': ['晩年の言葉 "You don\'t need a laboratory … look closely and write down what you see." と、名声を求めなかった生き方が ① に合う。',
           '② は Ruth の態度と逆、③ は本人の言葉と逆。']},
  ]}]}

P7 = {
 'label': '第7問', 'title': '論理的な文章＋スライド（要点・応用）', 'pts': 16,
 'gist': ['「睡眠は記憶を固める」をテーマにした説明文。睡眠中に脳は日中の経験を再生して記憶を定着させる。徹夜の詰め込みは逆効果で、'
          '学習後に眠ったグループは起きていたグループより成績がよかったという実験も紹介。短い昼寝（20分程度）の効果、寝る前のスマートフォンの悪影響、'
          '同じ時刻に寝起きする習慣の大切さを述べる。'],
 'vocab': ['consolidate 強固にする', 'replay 再生する', 'all-nighter 徹夜', 'groggy ぼんやりした', 'circadian rhythm 体内時計'],
 'sections': [{
  'instr': 'あなたは健康についての発表のために、次の記事を読んでスライドを作っています。',
  'blocks': [
   ('box', [
    ('title', 'Sleep: The Study Tool Nobody Talks About'),
    ('p', 'Many students believe that the best way to prepare for an exam is to study for as long as possible, even if that means cutting back on sleep. '
          'Research in brain science, however, suggests the opposite. Sleep is not simply a time when the brain switches off. It is an active period during which the brain sorts, strengthens and stores what we learned during the day.'),
    ('p', 'When we learn something new, the memory is at first fragile, like writing in pencil. During deep sleep, the brain appears to "replay" the day\'s experiences, '
          'sending information from a temporary storage area called the hippocampus to the cortex, where long-term memories are kept. In this way, sleep helps to **consolidate** memories — to turn pencil into ink.'),
    ('p', 'One well-known type of experiment shows this clearly. Two groups of volunteers learn a list of word pairs in the evening. One group then sleeps for eight hours, while the other stays awake all night. '
          'Two days later, after both groups have had a normal night\'s sleep, they are tested. The group that slept straight after learning typically remembers 20 to 40 percent more than the group that stayed up. '
          'In other words, the lost night cannot simply be "caught up on" later.'),
    ('p', 'This does not mean that more sleep is always better, or that a long nap can replace a good night\'s rest. Studies suggest that a short afternoon nap of around 20 minutes can improve alertness and help us learn in the afternoon. '
          'However, naps longer than about 30 minutes may leave people feeling groggy, and late-afternoon naps can make it harder to fall asleep at night.'),
    ('p', 'What we do before bed also matters. Light from phone and computer screens can delay the release of melatonin, a hormone that tells the body it is time to sleep. '
          'Checking social media in bed can also make the mind more active, just when it should be calming down. Experts recommend putting screens away at least an hour before going to bed.'),
    ('p', 'Finally, regular timing may be as important as the total number of hours. Our bodies follow a roughly 24-hour cycle known as the circadian rhythm. '
          'Going to bed and waking up at very different times on weekdays and weekends — sometimes called "social jet lag" — can disturb this rhythm, leaving us tired on Monday mornings. '
          'Keeping roughly the same schedule every day helps the body know when to feel sleepy and when to feel alert.'),
    ('p', 'For students, the message is clear. Staying up all night before a test may feel productive, but it can undo much of the effort made during the day. '
          'Sleep should be seen not as time taken away from studying, but as part of studying itself.'),
   ], '#fbfaf6'),
   ('slide', 'Sleep and Learning', ['Sleep = an active process: sort → strengthen → store', 'Key experiment: sleep after learning → 20–40% better recall',
                                    'Naps: see Question 3', 'Tips for better sleep (Question 4):', ' Before bed: ( A )', ' Schedule: ( B )']),
  ],
  'qs': [
   {'no': 1, 'prompt': 'In the second paragraph, the writer compares new memories to "writing in pencil" in order to show that they', 'pts': 3, 'ans': 3,
    'choices': ['are always stored in the cortex from the beginning.', 'cannot be changed once they are formed.',
                'can easily be lost unless they are strengthened.', 'are clearer than long-term memories.'],
    'ex': ['fragile（壊れやすい）→ 鉛筆は消える。睡眠でインクにする＝定着させる。② は逆（鉛筆は書き直せる）。① 最初は海馬に一時保管。']},
   {'no': 2, 'prompt': 'What does the experiment described in the third paragraph show?', 'pts': 3, 'ans': 2,
    'choices': ['People who sleep for eight hours learn word pairs faster.', 'Sleep lost right after learning cannot easily be made up for later.',
                'Both groups remembered the same number of words.', 'Staying awake all night improves memory for a short time.'],
    'ex': ['両グループとも後で普通に寝たのに差が残った → "the lost night cannot simply be \'caught up on\' later."',
           '① 覚える速さは比べていない。③ 20〜40％の差がある。']},
   {'no': 3, 'prompt': 'Which **two** statements about naps agree with the article? (The order does not matter.)', 'pts': 4, 'ans': [1, 4], 'any_order': True,
    'choices': ['A nap of about 20 minutes may help people stay alert.', 'Long naps are a good way to replace sleep at night.',
                'Napping in the late afternoon helps people fall asleep earlier.', 'Naps of more than half an hour may make people feel less clear-headed.',
                'Students should never take naps on school days.'],
    'ans_text': '①・④（順不同）',
    'ex': ['① "a short afternoon nap of around 20 minutes can improve alertness"。④ "longer than about 30 minutes may leave people feeling groggy"（groggy＝頭がぼんやり）。',
           '② "a long nap can replace a good night\'s rest" を否定している。③ 逆。⑤ 本文にない。']},
   {'no': 4, 'prompt': 'Which pair best completes ( A ) and ( B ) on the slide?', 'pts': 3, 'ans': 4,
    'choices': ['(A) check messages quickly (B) sleep in on weekends',
                '(A) drink coffee (B) change bedtime often',
                '(A) study with a bright screen (B) sleep only on weekends',
                '(A) no screens for an hour (B) similar times every day'],
    'ex': ['第5段落「寝る1時間前には画面をしまう」、第6段落「毎日ほぼ同じ時刻に」。週末の寝だめ（sleep in）は social jet lag の原因になる。']},
   {'no': 5, 'prompt': 'Your classmate Aya says: "I study until 3 a.m. the night before tests and sleep until noon on Sundays. I nap for two hours after school." Based on the article, which advice is the most suitable for Aya?', 'pts': 3, 'ans': 1,
    'choices': ['Study earlier, sleep after learning, keep similar sleep times all week, and limit naps to about 20 minutes.',
                'Keep the same schedule, because long naps make up for the lost sleep.',
                'Stay up even later on Saturday so that Sunday feels shorter.',
                'Stop taking naps but continue studying until 3 a.m.'],
    'ex': ['アヤの問題は三つ：①テスト前夜の夜更かし（第3・7段落）②週末の寝坊＝social jet lag（第6段落）③2時間の昼寝（第4段落）。三つすべてに対応するのは ①。',
           '本文の内容を自分（他人）の生活に当てはめる、新課程の第7問で増えた応用型。']},
  ]}]}

P8 = {
 'label': '第8問', 'title': '複数の意見文＋論説文の構成（統合・要約）', 'pts': 17,
 'gist': ['テーマ「高校は制服をやめるべきか」。生徒（Lena・Marcus）、保護者（Ms. Diaz）、教員（Mr. Okoro）の意見と、調査グラフ。',
          'Lena：制服は個性を抑える／Marcus：服選びの悩み・経済的な差が見えにくくなる／Ms. Diaz：制服は高いが私服はさらにかかる／Mr. Okoro：校外学習で生徒を見分けやすい・安全面。',
          '生徒のエッセイの構成メモ（3ステップ）を完成させる。'],
 'vocab': ['self-expression 自己表現', 'peer pressure 仲間からの同調圧力', 'mandatory 義務の', 'compromise 妥協', 'dress code 服装規定'],
 'sections': [{
  'instr': 'あなたは「高校の制服は廃止すべきか」についてエッセイを書くために、次の資料を集めました。',
  'blocks': [
   ('box', [
    ('h', 'Opinion 1 — Lena (17, student)'),
    ('p', 'School uniforms tell us that everyone should look the same. But we are not all the same, and the clothes we choose are one way of showing who we are. '
          'At my cousin\'s school in Sweden, there is no uniform, and students there seem confident and relaxed. I think uniforms limit self-expression at a time when young people are trying to discover their identity. '
          'If schools are worried about inappropriate clothing, they can simply have a basic dress code.'),
    ('h', 'Opinion 2 — Marcus (16, student)'),
    ('p', 'I used to go to a school without uniforms, and honestly, it was stressful. Every morning I worried about what to wear, and some students were teased because their clothes were cheap or out of fashion. '
          'There was a lot of peer pressure to buy brand-name items. Since moving to a school with uniforms, I spend that energy on other things. Uniforms make differences in family income less visible.'),
    ('h', 'Opinion 3 — Ms. Diaz (parent of two)'),
    ('p', 'People often say uniforms are expensive, and it is true that a full set costs around 40,000 yen. But a uniform lasts for three years. When my eldest went to a school with no uniform, '
          'we ended up spending far more, because she needed different clothes for every day of the week and wanted new ones each season. For our family, the uniform was the cheaper choice. '
          'That said, I would welcome more practical options, such as trousers for girls and washable jackets.'),
    ('h', 'Opinion 4 — Mr. Okoro (teacher)'),
    ('p', 'From a teacher\'s point of view, uniforms have one clear advantage: safety. On school trips to crowded places, I can find my students immediately, and it is easy to notice if a stranger enters the school building. '
          'However, I do not believe uniforms improve students\' behaviour or grades by themselves. Research on that question is mixed. What matters most is the relationship between students and teachers.'),
   ], '#fbfaf6'),
   ('bar', {'title': 'Survey: Should our school keep uniforms? (Students, n = 400)', 'cats': ['Keep as now', 'Keep, with more choices', 'Abolish', 'No opinion'],
            'series': [[22, 47, 25, 6]], 'unit': '%', 'maxv': 60, 'step': 10}),
   ('box', [
    ('ja', '**エッセイの構成メモ**'),
    ('pl', '**Title:** Uniforms: Keep Them, but Change Them'),
    ('pl', '**Step 1 — Introduction:** Introduce the debate. Position: {問1}'),
    ('pl', '**Step 2 — Body:** Reasons for keeping uniforms → {問2 (two answers)}\n'
           '　　Point to consider (other side) → {問3}\n'
           '　　Evidence from the survey → {問4 (two answers)}'),
    ('pl', '**Step 3 — Conclusion:** {問5}'),
   ], '#fff6df'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Which position best matches the title of the essay?', 'pts': 3, 'ans': 3,
    'choices': ['Uniforms should be abolished because they are too expensive.', 'Uniforms have no advantages, so each school should decide.',
                'Uniforms should stay, but students should have more options.', 'Uniforms improve students\' grades, so they should be stricter.'],
    'ex': ['題名 "Keep Them, but Change Them"（残すが変える）→ ③。④ 成績向上は Mr. Okoro が否定している。']},
   {'no': 2, 'prompt': 'Choose **two** reasons for keeping uniforms that are supported by the opinions. (The order does not matter.)', 'pts': 3, 'ans': [1, 4], 'any_order': True,
    'choices': ['They can reduce stress and pressure about clothes.', 'They make students more confident and relaxed.',
                'Research clearly shows that they improve behaviour.', 'They help teachers keep students safe.', 'They are cheaper than any other clothes for every family.'],
    'ans_text': '①・④（順不同）',
    'ex': ['① Marcus（毎朝の悩み・同調圧力）。④ Mr. Okoro（校外で見つけやすい・不審者に気づける）。',
           '② は Lena が**私服**の学校について言ったこと。③ "Research … is mixed" と否定。⑤ "For our family"（自分の家庭では）と限定されており、全家庭とは言っていない。']},
   {'no': 3, 'prompt': 'Which is the best "point to consider" from the other side?', 'pts': 3, 'ans': 2,
    'choices': ['Uniforms make it easier to notice strangers at school.', 'Uniforms may limit students\' ability to express their identity.',
                'Uniforms last for three years.', 'Teachers find students quickly on school trips.'],
    'ex': ['反対側の論点は Lena の「自己表現を制限する」。①③④ はすべて制服を**残す側**の理由。']},
   {'no': 4, 'prompt': 'Which **two** statements are supported by the survey? Mark one answer in each box.\n{1} About half of the students want to keep uniforms but with more options.\n{2} The proportion of students who want to keep uniforms in some form is', 'pts': 2, 'score': 'each', 'ans': [1, 6],
    'choices': ['True', 'False', 'about 25%.', 'about 47%.', 'about 54%.', 'about 69%.'],
    'ans_text': '①・⑥',
    'ex': [f'{{1}}：「選択肢を増やして残す」47% ≒ 約半分 → **True（①）**。',
           '{2}：何らかの形で残す＝ Keep as now 22% ＋ Keep, with more choices 47% ＝ **69%（⑥）**。',
           '④ 47% は一つのグラフ項目だけを見た誤り。複数項目を足す計算は第8問の頻出パターン。'],
    'no_balance': True},
   {'no': 5, 'prompt': 'Which is the most appropriate conclusion for the essay?', 'pts': 4, 'ans': 4,
    'choices': ['Since uniforms cause stress, schools should abolish them at once.', 'Because research is mixed, we should stop discussing uniforms.',
                'Uniforms are expensive, so families should buy second-hand clothes instead.',
                'Uniforms bring benefits such as safety and less pressure, but schools should offer practical choices like trousers for all students.'],
    'ex': ['題名・Step 2 の理由（安全・圧力の軽減）・Ms. Diaz の提案（女子のズボンなど）・調査（「選択肢を増やして残す」が最多）をすべて反映するのは ④。',
           '①② は立場と逆。③ 論点がずれる。結論は「立場＋主な理由＋反対意見への配慮」で選ぶ。']},
  ]}]}

PARTS_B = [P5, P6, P7, P8]
