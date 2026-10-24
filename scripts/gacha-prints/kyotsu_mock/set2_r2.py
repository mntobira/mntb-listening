"""第2回 リーディング 第5〜8問"""

P5 = {
 'label': '第5問', 'title': '旅程・料金表・メール（複数資料の照合）', 'pts': 16,
 'gist': ['イギリスの湖水地方へのクラス旅行の計画。バス会社の料金表（人数・平日/週末・保険）、先生からのメール、生徒の投票結果。',
          '人数が22人なので中型バス、土曜出発で週末料金、ボート体験は雨天時に鉛筆博物館へ変更、などの条件を組み合わせて読む。'],
 'vocab': ['coach（英）長距離バス', 'surcharge 追加料金', 'deposit 前金', 'refundable 払い戻し可能な', 'itinerary 旅程'],
 'sections': [{
  'instr': 'あなたはイギリスの高校で、クラスの日帰り旅行の係をしています。次の資料を読んで、問いに答えなさい。',
  'blocks': [
   ('box', [
    ('title', 'Lakeland Coaches — Day Trip Hire'),
    ('table', [['Coach size', 'Seats', 'Weekday price', 'Weekend price'],
               ['Minibus', 'up to 16', '£280', '£320'],
               ['Midi coach', 'up to 29', '£390', '£450'],
               ['Full-size coach', 'up to 53', '£520', '£600']], [45, 35, 50, 50]),
    ('pl', '• Prices include the driver and fuel for up to 10 hours. Each extra hour: £40.\n'
           '• A deposit of 20% is required when booking. The deposit is refundable if you cancel at least 14 days before the trip.\n'
           '• Optional travel insurance: £2 per passenger.'),
   ], '#f4f8f1'),
   ('box', [
    ('small', '**From:** Mr. Hughes\n**To:** Trip Committee\n**Subject:** Lake District trip — decisions'),
    ('p', 'Hello everyone,'),
    ('p', 'Thanks for organising the vote. As you know, 20 students have signed up, and Ms. Patel and I will come too. Since most of you chose Saturday, let\'s go on Saturday 17th May. '
          'We\'ll leave school at 7:30 a.m. and should be back by 6:30 p.m. Please book the smallest coach that fits all of us, and add insurance for everyone, including the teachers.'),
    ('p', 'The boat trip on Lake Windermere is the main event, but if it rains heavily, the boats won\'t run. In that case, we\'ll visit the Pencil Museum in Keswick instead. Its entrance fee is £5 per person, compared with £9 for the boat.'),
    ('p', 'Please pay the deposit by Friday. Thanks,\nMr. Hughes'),
   ], '#fbfaf6'),
   ('box', [
    ('h', 'Vote results (20 students)'),
    ('table', [['Question', 'Option', 'Votes'], ['Day', 'Saturday / Sunday', '13 / 7'], ['Main activity', 'Boat trip / Hiking / Shopping', '11 / 6 / 3']], [50, 80, 50]),
   ], '#ffffff'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Which coach should the committee book, and how much will it cost (not including insurance)?', 'pts': 3, 'ans': 3,
    'choices': ['A minibus for £320', 'A midi coach for £390', 'A midi coach for £450', 'A full-size coach for £600'],
    'ex': ['生徒20人＋先生2人＝22人 → 16席の minibus では足りず、29席の **midi coach**。土曜日＝**週末料金 £450**。',
           '② は平日料金。人数の合計（先生を含める）と曜日の両方を照合する問題。']},
   {'no': 2, 'prompt': 'How much will the insurance cost in total?', 'pts': 3, 'ans': 2,
    'choices': ['£40', '£44', '£58', '£106'],
    'ex': ['"add insurance for everyone, including the teachers" → 22人 × £2 ＝ **£44**。① は生徒だけ（20人）で計算した誤り。']},
   {'no': 3, 'prompt': 'Will the committee need to pay for extra hours?', 'pts': 3, 'ans': 1,
    'choices': ['Yes, for one hour, because the trip lasts 11 hours.', 'No, because the trip lasts less than 10 hours.',
                'Yes, for two hours, because the coach must return to the garage.', 'No, because extra hours are free on weekends.'],
    'ex': ['7:30 出発 → 18:30 帰着 ＝ **11時間**。10時間を1時間超える → £40 追加。']},
   {'no': 4, 'prompt': 'Which of the following statements are true? Choose the best combination.\nA. More than half of the students voted for the boat trip.\nB. The deposit can never be returned.\nC. If it rains heavily, the entrance fee per person will be lower.\nD. Ms. Patel organised the vote.', 'pts': 3, 'ans': 2,
    'choices': ['A and B', 'A and C', 'B and D', 'C and D'],
    'ex': ['A：20人中11人（55%）→ 正。C：雨天は博物館 £5（ボート £9 より安い）→ 正。',
           'B：14日前までの取り消しなら返金される → 誤。D：投票を行ったのは委員会（"Thanks for organising the vote"）→ 誤。']},
   {'no': 5, 'prompt': 'Which **two** of the following can be inferred from the materials? (The order does not matter.)', 'pts': 4, 'ans': [3, 4], 'any_order': True,
    'choices': ['The trip will take place on a Sunday.', 'Hiking was the most popular activity.', 'The deposit for the coach will be £90.',
                'Mr. Hughes followed the majority opinion when choosing the day.', 'The Pencil Museum is next to Lake Windermere.'],
    'ans_text': '③・④（順不同）',
    'ex': ['③ £450 の 20% ＝ **£90**。④ 投票で土曜が13票と多数 → "Since most of you chose Saturday"。',
           '① 土曜。② 最多はボート（11票）。⑤ 博物館は Keswick にあり、湖の隣とは書かれていない。']},
  ]}]}

P6 = {
 'label': '第6問', 'title': '伝記的な文章＋発表メモ（時系列・要点）', 'pts': 12,
 'gist': ['架空の発明家「Tomás Rivera」の物語。チリの漁村に育ち、霧から水を集める「フォグ・キャッチャー」を改良して乾燥地域の村に水を届けた。'
          '最初の網は風で破れ、村人にも疑われたが、網の素材と角度を変え、村人自身が修理できる設計にしたことで広まった。',
          '※設問の題材としての架空の人物です（霧から水を集める技術自体は実在します）。'],
 'vocab': ['mesh 網', 'droplet しずく', 'arid 乾燥した', 'skeptical 疑い深い', 'maintain 維持する'],
 'sections': [{
  'instr': 'あなたは英語の授業で、社会に役立つ技術について発表します。次の文章を読み、発表メモを完成させなさい。',
  'blocks': [
   ('box', [
    ('title', 'Catching Water from the Clouds'),
    ('p', 'Tomás Rivera grew up in a fishing village on the northern coast of Chile, one of the driest places on Earth. It almost never rained there, but most mornings, a thick fog called camanchaca rolled in from the Pacific Ocean. '
          'As a boy, Tomás noticed that drops of water collected on spider webs and on his grandmother\'s washing line. "If a spider can catch water," he once asked his teacher, "why can\'t we?"'),
    ('p', 'Years later, after studying engineering in Santiago, Tomás returned to the north and joined a small project in the hill village of Alto Verde. The village had no river, and drinking water was delivered by truck once a week at a high price. '
          'A team of scientists had set up large plastic nets, called fog catchers, on a hillside. In theory, fog would pass through the mesh, tiny droplets would stick to it, and the water would run down into pipes.'),
    ('p', 'In practice, the first nets were a failure. Strong winds tore them apart within months, and when they broke, nobody in the village knew how to fix them. Many villagers became skeptical. '
          '"Scientists come, take photos and leave," one farmer told Tomás. "Then the nets fall down."'),
    ('p', 'Tomás decided that the problem was not only technical. He spent a winter living in the village, listening to people\'s complaints and watching how the wind moved across the hill. '
          'He then tested dozens of materials and found that a double layer of a cheap, flexible mesh collected more water and survived strong winds better. He also tilted the nets slightly so that water ran off faster before it could be blown away.'),
    ('p', 'Most importantly, he designed the system so that it could be repaired with simple tools and materials sold in the nearest town. He trained a group of local women and young people, who formed a committee to look after the nets. '
          'Within three years, the fog catchers at Alto Verde were producing an average of 6,000 litres of water a day — enough for drinking, a small vegetable garden and even a tiny brewery that now sells "fog beer" to tourists.'),
    ('p', 'Today, villages in Peru, Morocco and Nepal use designs based on Tomás\'s work. When asked about his success, he usually points to the committee. "The nets catch the water," he says, "but the people keep the nets."'),
   ], '#fbfaf6'),
   ('box', [
    ('ja', '**発表メモ**'),
    ('pl', '**Tomás Rivera and fog catchers**'),
    ('pl', '■ Childhood inspiration → 問1'),
    ('pl', '■ Events in order → 問2 (four boxes)'),
    ('pl', '■ Improvements Tomás made → 問3 (two answers)'),
    ('pl', '■ Key message → 問4'),
   ], '#fff6df'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'What first gave Tomás the idea of catching water?', 'pts': 3, 'ans': 2,
    'choices': ['A lesson about rain clouds at school', 'Water drops on spider webs and a washing line', 'A truck delivering water to his village', 'A visit to a scientist\'s laboratory'],
    'ex': ['第1段落：クモの巣や祖母の洗濯ロープにしずくがつくのに気づいた。']},
   {'no': 2, 'prompt': 'Put the following events into the order in which they happened.\n{1} → {2} → {3} → {4}', 'pts': 3, 'ans': [4, 1, 3, 2], 'score': 'all',
    'choices': ['Strong winds destroyed the first nets.', 'Villages in other countries began using similar designs.', 'Tomás lived in Alto Verde for a winter.', 'Tomás studied engineering in Santiago.'],
    'ans_text': '④→①→③→②',
    'ex': ['サンティアゴで工学を学ぶ（第2段落）→ 最初の網が風で壊れる（第3段落）→ 村で冬を過ごす（第4段落）→ 他国に広まる（第6段落）。']},
   {'no': 3, 'prompt': 'Choose **two** improvements that Tomás made. (The order does not matter.)', 'pts': 3, 'ans': [1, 5], 'any_order': True,
    'choices': ['He used two layers of a flexible mesh.', 'He replaced the nets with expensive metal panels.', 'He moved the project to a village with a river.',
                'He asked scientists to repair the nets every month.', 'He made sure local people could repair the nets themselves.'],
    'ans_text': '①・⑤（順不同）',
    'ex': ['① "a double layer of a cheap, flexible mesh"。⑤ 近くの町で買える材料と簡単な道具で直せる設計＋住民の委員会。',
           '② 安い素材を使った。④ 逆に「科学者が去ると誰も直せない」が問題だった。']},
   {'no': 4, 'prompt': 'Which statement best expresses the key message of the story?', 'pts': 3, 'ans': 4,
    'choices': ['Fog catchers work best when they are as large as possible.', 'Scientists should not work with villagers.',
                'Technology alone is enough to solve water shortages.', 'A technology lasts when the local community can understand and maintain it.'],
    'ex': ['"The nets catch the water, but the people keep the nets." → 地域の人が維持できてこそ技術が続く。③ は逆。']},
  ]}]}

P7 = {
 'label': '第7問', 'title': '説明文＋図（要点・図の完成・応用）', 'pts': 16,
 'gist': ['「アンカリング効果」の説明文。最初に見た数字（アンカー）がその後の判断を引っぱる。値札の「元値」表示、交渉の最初の提示額、'
          '推測問題の実験などの例。専門家でも影響を受けるが、別の基準を自分で考える・反対の理由を挙げると影響を弱められる。'],
 'vocab': ['anchor いかり・基準点', 'estimate 見積もる', 'negotiate 交渉する', 'bias 偏り', 'counteract 打ち消す'],
 'sections': [{
  'instr': 'あなたは心理学についての発表のために、次の記事を読んでポスターを作っています。',
  'blocks': [
   ('box', [
    ('title', 'The Number That Stays in Your Head'),
    ('p', 'Imagine you are asked two questions. First: "Is the population of Kenya more or less than 90 million?" Second: "What is your best guess of the population of Kenya?" '
          'Now imagine a friend is asked the same questions, except the first number is 20 million. Research suggests that your guess will probably be much higher than your friend\'s — even though both of you know the first number was chosen at random.'),
    ('p', 'This tendency is called the **anchoring effect**. The first piece of information we receive acts like a ship\'s anchor: our later judgements may move around it, but they rarely move far away. '
          'In one classic study, participants spun a wheel that stopped at either 10 or 65, and were then asked to estimate the percentage of African countries in the United Nations. Those who saw 10 gave an average estimate of 25%; those who saw 65 guessed 45%.'),
    ('p', 'Anchors are everywhere in daily life. A price tag that says "Was £80, now £50" makes £50 feel like a bargain, even if the item was never really worth £80. '
          'In salary negotiations, the first figure mentioned — by either side — strongly influences the final agreement. Restaurants sometimes put one extremely expensive dish at the top of the menu, not because they expect to sell many, but because it makes the other dishes look reasonable.'),
    ('p', 'Surprisingly, experts are not immune. In one experiment, experienced estate agents were shown the same house but given different "listing prices." Their own valuations of the house rose and fell with the listing price, yet most insisted that the listing price had not affected their judgement at all.'),
    ('p', 'Can we protect ourselves? Simply knowing about the effect helps only a little. More effective is to create your own reference point before seeing anyone else\'s number — for example, by checking the prices of similar items first. '
          'Another strategy is called "considering the opposite": deliberately listing reasons why the anchor might be wrong. In experiments, people who did this were influenced much less.'),
    ('p', 'The anchoring effect reminds us that our judgements are not made in a vacuum. The numbers we see first quietly shape what seems "normal," "cheap" or "expensive." Being aware of where an anchor comes from is the first step towards making decisions that are truly our own.'),
   ], '#fbfaf6'),
   ('box', [
    ('pl', '**Poster: The Anchoring Effect**'),
    ('pl', 'Definition: The first number we see ( 問1 ).'),
    ('pl', 'Wheel experiment: saw 10 → estimate 25% / saw 65 → estimate ( 問2 )'),
    ('pl', 'Everyday examples: sale tags, salary talks, expensive menu items'),
    ('pl', 'How to reduce it: ( 問4 )'),
   ], '#f2f5fb'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Which best completes the definition on the poster?', 'pts': 3, 'ans': 1,
    'choices': ['strongly influences our later judgements', 'is usually forgotten very quickly', 'is always the correct answer', 'only affects people who are not experts'],
    'ex': ['"our later judgements may move around it, but they rarely move far away" → ①。④ は第4段落（専門家も影響を受ける）と逆。']},
   {'no': 2, 'prompt': 'Which number completes the wheel experiment on the poster?', 'pts': 3, 'ans': 3,
    'choices': ['10%', '25%', '45%', '65%'],
    'ex': ['"those who saw 65 guessed 45%"。④ 65 はルーレットの数字そのもので、推測値ではない。']},
   {'no': 3, 'prompt': 'Why do some restaurants put a very expensive dish at the top of the menu?', 'pts': 3, 'ans': 4,
    'choices': ['They expect most customers to order it.', 'It is the most popular dish.', 'The law requires them to list it first.', 'It makes the other prices seem more acceptable.'],
    'ex': ['"not because they expect to sell many, but because it makes the other dishes look reasonable" → ④。① は明確に否定されている。']},
   {'no': 4, 'prompt': 'Which **two** strategies should be written in ( 問4 )? (The order does not matter.)', 'pts': 4, 'ans': [2, 5], 'any_order': True,
    'choices': ['Trust the first price you are told.', 'Decide on your own reference point before seeing others\' numbers.', 'Ask an expert, because experts are not affected.',
                'Make your decision as quickly as possible.', 'Think of reasons why the first number might be wrong.'],
    'ans_text': '②・⑤（順不同）',
    'ex': ['② "create your own reference point before seeing anyone else\'s number"。⑤ "considering the opposite"。',
           '③ 専門家も影響を受ける（第4段落）。「知っているだけ」ではあまり効かない点も押さえる。']},
   {'no': 5, 'prompt': 'Your friend is about to buy a used bicycle. The seller says, "It cost £600 new, but I\'ll give it to you for £300." Based on the article, what is the best advice?', 'pts': 3, 'ans': 2,
    'choices': ['Accept the offer quickly, because £300 is half the original price.', 'Check the prices of similar used bicycles first, then decide what a fair price is.',
                'Offer £600, because the seller mentioned that number first.', 'Ask the seller to repeat the price several times.'],
    'ex': ['「新品600ポンド」はアンカー。第5段落の対策（似た商品の価格を先に調べて自分の基準を作る）を当てはめた ②。① はアンカーに引きずられた判断そのもの。']},
  ]}]}

P8 = {
 'label': '第8問', 'title': '複数の資料＋論説文の構成（統合・要約）', 'pts': 17,
 'gist': ['テーマ「高校生のアルバイトは認めるべきか」。記事（労働時間と成績の関係）、表（アルバイトの週あたり時間と平均成績）、生徒・保護者・店長の意見。',
          '週10時間以内なら成績への悪影響はほとんどなく、社会経験・金銭感覚の利点がある。長時間になると睡眠と成績に悪影響。',
          '生徒のレポートの構成メモ（3ステップ）を完成させる。'],
 'vocab': ['part-time job アルバイト', 'correlation 相関', 'time management 時間管理', 'cap 上限を設ける', 'permission 許可'],
 'sections': [{
  'instr': 'あなたは「高校生のアルバイト」についてレポートを書くために、次の資料を集めました。',
  'blocks': [
   ('box', [
    ('h', 'Source A — Article: "Work and Grades: Is There a Limit?"'),
    ('p', 'A study of 3,200 high school students looked at the relationship between hours of part-time work and school grades. Students who worked up to about 10 hours a week had grades similar to, or slightly better than, those who did not work at all. '
          'Researchers suggest that a small amount of work may encourage better time management. However, grades fell noticeably among students working more than 15 hours a week, and these students also reported sleeping less. '
          'The researchers warn that the study shows a correlation, not necessarily a cause: students who were already struggling at school might choose to work more.'),
   ], '#fbfaf6'),
   ('table', [['Hours of work per week', '0', '1–5', '6–10', '11–15', '16–20', '21+'],
              ['Average grade (out of 5)', '3.4', '3.5', '3.5', '3.2', '2.9', '2.6'],
              ['Average sleep (hours/night)', '7.1', '7.0', '6.9', '6.5', '6.1', '5.8']], [52, 21, 21, 21, 22, 22, 23]),
   ('box', [
    ('h', 'Source B — Opinions'),
    ('pl', '**Haruka (student, 17):** My job at a bakery taught me how to talk to customers and how hard it is to earn money. I used to buy things without thinking. Now I save first.'),
    ('pl', '**Mr. Grant (parent):** I support my son working, but I set a rule: no more than two evenings a week, and never during exam periods.'),
    ('pl', '**Ms. Kwon (shop manager):** Teenage staff are often very reliable. But I\'ve seen students so tired that they fall asleep during breaks. Schools and employers should talk to each other more.'),
   ], '#fbfaf6'),
   ('box', [
    ('ja', '**レポートの構成メモ**'),
    ('pl', '**Title:** Part-Time Jobs: Yes, but Within Limits'),
    ('pl', '**Step 1 — Introduction:** Many students work. My position: {問1}'),
    ('pl', '**Step 2 — Body:** Benefits → {問2 (two answers)}　Data → {問3}　A caution about the data → {問4}'),
    ('pl', '**Step 3 — Conclusion and proposal:** {問5}'),
   ], '#fff6df'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Which position best matches the title of the report?', 'pts': 3, 'ans': 4,
    'choices': ['High school students should not work at all.', 'Students should work as many hours as they want.', 'Only students with good grades should work.',
                'Part-time work is acceptable if the number of hours is limited.'],
    'ex': ['題名 "Yes, but Within Limits" → ④。']},
   {'no': 2, 'prompt': 'Choose **two** benefits of part-time work that are supported by the sources. (The order does not matter.)', 'pts': 4, 'ans': [1, 3], 'any_order': True,
    'choices': ['Learning to manage money more carefully', 'Getting more sleep', 'Developing communication skills with customers', 'Always getting better grades', 'Spending less time with family'],
    'ans_text': '①・③（順不同）',
    'ex': ['① Haruka「以前は考えずに買っていた。今はまず貯金」。③ Haruka「お客さんとの話し方を学んだ」。',
           '② 表では働く時間が長いほど睡眠は減る。④ "always" は言い過ぎ：長時間だと成績は下がる。']},
   {'no': 3, 'prompt': 'Complete the sentence using the table.\nGrades start to fall when students work {1} hours a week, and average sleep first drops below six hours at {2} hours a week.', 'pts': 3, 'ans': [4, 6], 'score': 'all', 'no_balance': True,
    'choices': ['0', '1–5', '6–10', '11–15', '16–20', '21+'],
    'ans_text': '④・⑥（完答）',
    'ex': ['{1}：成績は 0〜10時間で 3.4〜3.5、**11–15時間**で 3.2 に下がり始める → ④。',
           '{2}：睡眠は 16–20時間で 6.1（まだ6時間以上）、**21時間以上**で 5.8 → ⑥。',
           '「下回る（below）」は境界の数字に注意。6.1 を「約6時間」と丸めて ⑤ を選ばない。']},
   {'no': 4, 'prompt': 'Which is the most appropriate "caution about the data"?', 'pts': 3, 'ans': 1,
    'choices': ['Working long hours may not be the cause of low grades; struggling students might choose to work more.',
                'The study included too few students to be useful.', 'The table proves that work improves grades.', 'Sleep has no relationship with grades.'],
    'ex': ['記事の最後 "a correlation, not necessarily a cause" を言いかえた ①。② 3,200人で少なくない。③ "proves" は言い過ぎ。']},
   {'no': 5, 'prompt': 'Which is the most appropriate proposal for the conclusion?', 'pts': 4, 'ans': 3,
    'choices': ['Schools should ban part-time jobs during the whole school year.', 'Employers should hire only university students.',
                'Schools could allow work of up to about 10 hours a week, with breaks during exams and better communication with employers.',
                'Students should work more hours to save money for university.'],
    'ex': ['データ（10時間以内は悪影響が小さい）・Mr. Grant（試験期間は休む）・Ms. Kwon（学校と雇用者の連携）をすべて取り込んだ ③。',
           '① 立場（認める）と逆。④ データと逆。']},
  ]}]}

PARTS_B = [P5, P6, P7, P8]
