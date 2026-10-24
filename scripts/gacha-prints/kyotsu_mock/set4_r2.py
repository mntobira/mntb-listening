"""第4回 リーディング 第5〜8問"""

P5 = {
 'label': '第5問', 'title': '講座案内・時間割・メール（複数資料の照合）', 'pts': 16,
 'gist': ['イギリスの語学学校のサマーコース案内（午前は全員英語、午後は選択講座）、Ken の申込、学校からの返信メール。',
          '定員超過で第1希望に入れず第2希望、週末旅行は追加料金、寮の部屋の変更などを照合する。'],
 'vocab': ['elective 選択科目', 'accommodation 宿泊施設', 'en-suite（英）浴室つきの', 'excursion 遠足・小旅行', 'waiting list キャンセル待ち'],
 'sections': [{
  'instr': 'あなたはイギリスの語学学校の夏期講座に申し込みました。次の資料を読みなさい。',
  'blocks': [
   ('box', [
    ('title', 'Oxbridge Language School — Summer Course (2 weeks)'),
    ('pl', '**Mornings (9:00–12:30):** General English for everyone, in classes of up to 12 students.\n'
           '**Afternoons (14:00–16:00):** Choose ONE elective:'),
    ('table', [['Elective', 'Days', 'Notes'],
               ['A: Drama', 'Mon / Wed / Fri', 'Performance on the last Friday'],
               ['B: Football', 'Mon–Thu', 'Bring trainers'],
               ['C: Cooking', 'Tue / Thu', '£20 extra for ingredients'],
               ['D: Film Club', 'Mon / Wed', 'Films in English with subtitles']], [40, 45, 85]),
    ('pl', '**Course fee:** £900 (includes lessons and one elective)\n'
           '**Accommodation:** Standard room £250 per week / En-suite room £320 per week\n'
           '**Weekend excursions:** London (Sat, £45) / Cambridge (Sun, £35)'),
   ]),
   ('box', [
    ('h', 'Application (summary)'),
    ('table', [['Name', 'Ken Ota', 'Age', '16'], ['Elective 1st', 'C: Cooking', 'Elective 2nd', 'A: Drama'],
               ['Room', 'En-suite', 'Excursions', 'London, Cambridge']], [32, 55, 32, 55]),
   ]),
   ('box', [
    ('small', '**From:** Admissions Office\n**To:** Ken Ota\n**Subject:** Your summer course'),
    ('p', 'Dear Ken,'),
    ('p', 'Thank you for your application. Unfortunately, the Cooking class is already full. We have put you on the waiting list and placed you in your second choice for now. '
          'We are also sorry to say that all en-suite rooms have been booked, so you will stay in a standard room. The difference in price will, of course, be taken off your bill.'),
    ('p', 'Your excursion bookings have been confirmed. Please arrive by 4 p.m. on the Sunday before the course starts.'),
    ('p', 'Kind regards,\nAdmissions Office'),
   ]),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Which elective will Ken take, at least at first?', 'pts': 3, 'ans': 1,
    'choices': ['Drama', 'Football', 'Cooking', 'Film Club'],
    'ex': ['料理は定員でキャンセル待ち、ひとまず第2希望の **Drama**。']},
   {'no': 2, 'prompt': 'Complete the sentence.\nKen will pay {1} per week for his room, and his two excursions will cost {2} in total.', 'pts': 3, 'ans': [2, 6], 'score': 'all', 'no_balance': True,
    'choices': ['£35', '£250', '£320', '£45', '£70', '£80'],
    'ans_text': '②・⑥（完答）',
    'ex': ['{1}：浴室つきの部屋が満室 → 標準の部屋 **£250**（②）。', '{2}：ロンドン £45 ＋ ケンブリッジ £35 ＝ **£80**（⑥）。']},
   {'no': 3, 'prompt': 'On which days will Ken have his elective in the afternoon?', 'pts': 3, 'ans': 4,
    'choices': ['Tuesday and Thursday', 'Monday to Thursday', 'Monday and Wednesday', 'Monday, Wednesday and Friday'],
    'ex': ['Drama は月・水・金 → ④。① は料理の曜日。']},
   {'no': 4, 'prompt': 'Which of the following statements are true? Choose the best combination.\nA. Ken may be able to join the Cooking class later.\nB. Ken will stay in an en-suite room.\nC. Ken will perform on the last Friday if he stays in Drama.\nD. Ken has to arrive on the Monday the course starts.', 'pts': 3, 'ans': 2,
    'choices': ['A and B', 'A and C', 'B and D', 'C and D'],
    'ex': ['A：キャンセル待ちなので空けば入れる → 正。C：Drama は最終金曜に発表 → 正。',
           'B：標準の部屋に変更 → 誤。D：開講前の日曜16時までに到着 → 誤。']},
   {'no': 5, 'prompt': 'Which **two** can be inferred from the materials? (The order does not matter.)', 'pts': 4, 'ans': [3, 5], 'any_order': True,
    'choices': ['Ken will have English lessons only in the afternoons.', 'Ken will pay £20 extra for ingredients.', 'Ken\'s bill will be lower than he expected for accommodation.',
                'Ken will study in a class of more than 20 students.', 'Ken will go on trips on both Saturday and Sunday.'],
    'ans_text': '③・⑤（順不同）',
    'ex': ['③ 部屋の差額が引かれる → 宿泊費は予定より安くなる。⑤ ロンドン（土）とケンブリッジ（日）の両方が確定。',
           '① 英語の授業は午前。② 料理に入れていないので不要。④ 1クラス12人まで。']},
  ]}]}

P6 = {
 'label': '第6問', 'title': '物語文＋発表メモ（時系列・人物の変化）', 'pts': 12,
 'gist': ['架空の人物「Lena Okafor」の物語。ナイジェリア出身の祖母から聞いた布の染め方に興味を持ち、イギリスで化学を学んだあと、植物由来の染料で布を染める小さな会社を始めた。',
          '最初の製品は洗うと色が落ちて返品が続いたが、祖母の方法（灰と発酵）を化学的に分析して色落ちしない方法を見つけ、地域の女性たちを雇うようになった。',
          '※設問の題材としての架空の人物です。'],
 'vocab': ['dye 染料・染める', 'fade 色あせる', 'ferment 発酵させる', 'refund 返金', 'synthetic 合成の'],
 'sections': [{
  'instr': 'あなたは英語の授業で、起業家についての文章を読み、発表メモを作っています。',
  'blocks': [
   ('box', [
    ('title', 'Colours That Last'),
    ('p', 'Lena Okafor grew up in Manchester, but every summer she visited her grandmother in a small town in south-west Nigeria. Her grandmother dyed cloth a deep indigo blue in large clay pots behind her house. '
          'Lena loved watching the white cloth turn green in the air and then slowly become blue. "The colour is alive," her grandmother told her. "You have to feed it."'),
    ('p', 'At university, Lena studied chemistry. She learned that most clothes today are coloured with synthetic dyes, and that the factories which produce them often release polluted water into rivers. '
          'She remembered her grandmother\'s pots and wondered whether natural dyes could be used on a larger scale.'),
    ('p', 'After graduating, Lena borrowed money from her parents and started a small company selling scarves dyed with plants. The first few months were a disaster. Customers loved the colours, but after two or three washes, the scarves began to fade. '
          'Within half a year, more than a third of buyers had asked for refunds. Lena almost gave up.'),
    ('p', 'Instead, she flew to Nigeria and spent a month working beside her grandmother. She wrote down every step: the wood ash added to the water, the days the mixture was left to ferment, the number of times the cloth was dipped and dried. '
          'Back in her laboratory, she discovered why her grandmother\'s cloth never faded. The ash made the water alkaline, and the fermentation allowed the dye to bond firmly with the fibres. Her own factory method had skipped both steps to save time.'),
    ('p', 'Lena rebuilt the process around what she had learned. It took longer and cost more, but the new scarves kept their colour after fifty washes. She began employing women from her neighbourhood, many of whom had struggled to find work, and trained them in the dyeing process. '
          'Today, her company employs thirty people and sells to shops in twelve countries.'),
    ('p', 'In interviews, Lena is often asked about her chemistry degree. She always answers in the same way: "My degree explained the colour. My grandmother knew how to make it. I needed both."'),
   ]),
   ('box', [
    ('ja', '**発表メモ**'),
    ('pl', '**Lena Okafor and natural dyes**'),
    ('pl', '・Events in order → 問1 (four boxes)'),
    ('pl', '・Why her first scarves failed → 問2'),
    ('pl', '・What she learned in Nigeria → 問3 (two answers)'),
    ('pl', '・Her message → 問4'),
   ]),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Put the following events into the order in which they happened.\n{1} → {2} → {3} → {4}', 'pts': 3, 'ans': [3, 1, 4, 2], 'score': 'all',
    'choices': ['Lena started a company selling scarves.', 'Lena began hiring women from her neighbourhood.', 'Lena studied chemistry at university.', 'Lena worked with her grandmother for a month.'],
    'ans_text': '③→①→④→②',
    'ex': ['大学で化学（第2段落）→ 会社を始める（第3段落）→ 祖母のもとで1か月（第4段落）→ 地域の女性を雇う（第5段落）。']},
   {'no': 2, 'prompt': 'Why did Lena\'s first scarves fade?', 'pts': 3, 'ans': 2,
    'choices': ['She used synthetic dyes by mistake.', 'Her process left out two important steps.', 'Customers washed them in hot water.', 'The plants she used were too old.'],
    'ex': ['"Her own factory method had skipped both steps to save time." → 灰（アルカリ）と発酵の2工程を省いていた → ②。']},
   {'no': 3, 'prompt': 'Choose **two** things Lena learned from her grandmother\'s method. (The order does not matter.)', 'pts': 3, 'ans': [1, 4], 'any_order': True,
    'choices': ['Wood ash made the water alkaline.', 'Synthetic dyes were cheaper.', 'Cloth should be dried only once.', 'Fermentation helped the dye bond with the fibres.', 'Clay pots made the colour green.'],
    'ans_text': '①・④（順不同）',
    'ex': ['① 灰で水がアルカリ性になる。④ 発酵で染料が繊維にしっかり結びつく。③ 何度も浸して乾かす。⑤ 緑になるのは空気に触れるため。']},
   {'no': 4, 'prompt': 'What does Lena mean by "I needed both"?', 'pts': 3, 'ans': 4,
    'choices': ['She needed two loans to start her company.', 'She needed workers from two countries.', 'She needed to sell scarves and shirts.', 'Scientific knowledge and traditional skill were both necessary.'],
    'ex': ['「学位は色を説明した。祖母は色の作り方を知っていた」→ 科学と伝統の両方が必要 → ④。']},
  ]}]}

P7 = {
 'label': '第7問', 'title': '論理的な文章＋スライド（要点・応用）', 'pts': 16,
 'gist': ['「都市の暑さ（ヒートアイランド現象）」の説明文。原因（アスファルト・建物が熱をためる、緑の少なさ、エアコンの排熱）、影響（熱中症・電力消費）、',
          '対策（屋上緑化・明るい色の屋根・街路樹・水を使った冷却）と、それぞれの長所・短所。'],
 'vocab': ['urban heat island ヒートアイランド', 'absorb 吸収する', 'reflect 反射する', 'evaporation 蒸発', 'heatstroke 熱中症'],
 'sections': [{
  'instr': 'あなたは環境についての発表のために、次の記事を読んでスライドを作っています。',
  'blocks': [
   ('box', [
    ('title', 'Why Are Cities So Hot?'),
    ('p', 'On a summer evening, the centre of a large city can be several degrees warmer than the countryside around it. This is known as the **urban heat island** effect, and it is becoming more serious as cities grow and summers become hotter.'),
    ('p', 'There are three main causes. First, dark surfaces such as asphalt roads and concrete buildings absorb sunlight during the day and release the heat slowly at night, so cities cool down much less after sunset. '
          'Second, cities have fewer trees and less soil. In the countryside, plants release water through their leaves, and this evaporation cools the air — rather like sweat cooling our skin. '
          'Third, cars, factories and air conditioners all produce waste heat. Ironically, the hotter a city becomes, the more people use air conditioners, which makes the streets outside even hotter.'),
    ('p', 'The effects are serious. Hot nights make it harder for the body to recover, and the risk of heatstroke rises, especially for elderly people. Electricity demand also increases sharply on hot days, which can lead to power cuts.'),
    ('p', 'Cities have tried several solutions, each with advantages and disadvantages. **Green roofs**, covered with plants, cool buildings and absorb rainwater, but they are expensive to build and many older buildings cannot support their weight. '
          '**Cool roofs**, painted white or a light colour, reflect sunlight and are cheap, but they work best on flat roofs and need repainting as they get dirty. '
          '**Street trees** provide shade and cool the air through evaporation, but they take many years to grow and need space and water.'),
    ('p', 'Some cities are also using water. In parts of Tokyo, shopkeepers sprinkle water on the pavement in a traditional practice called //uchimizu//. As the water evaporates, it can lower the surface temperature by several degrees, although the effect lasts only a short time.'),
    ('p', 'No single solution is enough. Experts recommend combining different methods depending on the type of neighbourhood: cool roofs on factories and warehouses, green roofs on new buildings, and as many trees as possible along streets where people walk.'),
   ]),
   ('slide', 'The Urban Heat Island Effect', ['Causes: dark surfaces / fewer plants / ( 問1 )', 'Effects: heatstroke, power cuts',
                                              'Solutions compared: ( A ) cheap, needs repainting / ( B ) absorbs rain, heavy', 'Recommendation: ( 問4 )']),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Which best completes the "Causes" line on the slide?', 'pts': 3, 'ans': 3,
    'choices': ['too much rain', 'cold winds from the sea', 'waste heat from cars and machines', 'too many parks'],
    'ex': ['第2段落の3つ目の原因：車・工場・エアコンの排熱 → ③。']},
   {'no': 2, 'prompt': 'According to the article, why do plants help to cool the air?', 'pts': 3, 'ans': 1,
    'choices': ['Water evaporating from their leaves takes heat away.', 'They reflect all sunlight back into the sky.', 'They produce cold air at night.', 'They stop people from using air conditioners.'],
    'ex': ['葉から水が蒸発し、汗が肌を冷やすように空気を冷やす → ①。']},
   {'no': 3, 'prompt': 'Which solutions are ( A ) and ( B ) on the slide?\n( A ) {1}　( B ) {2}', 'pts': 4, 'ans': [2, 1], 'score': 'all', 'no_balance': True,
    'choices': ['Green roofs', 'Cool roofs', 'Street trees', 'Uchimizu'],
    'ans_text': '②・①（完答）',
    'ex': ['( A ) 安いが汚れると塗り直しが必要 → **cool roofs**（②）。( B ) 雨水を吸収するが重く高価 → **green roofs**（①）。']},
   {'no': 4, 'prompt': 'Which best completes the "Recommendation" on the slide?', 'pts': 3, 'ans': 4,
    'choices': ['Paint every building white.', 'Replace all roads with soil.', 'Use uchimizu instead of other methods.', 'Combine methods to suit each type of area.'],
    'ex': ['最終段落「単独の対策では不十分。地域の種類に合わせて組み合わせる」→ ④。③ 効果は短時間しか続かない。']},
   {'no': 5, 'prompt': 'Your town plans to cool a busy shopping street where many people walk but there is little space for buildings to change. Based on the article, which is the best first step?', 'pts': 3, 'ans': 2,
    'choices': ['Put green roofs on old wooden shops.', 'Plant street trees and support shopkeepers who sprinkle water on hot days.',
                'Encourage shops to use more air conditioning.', 'Build a large car park to reduce traffic.'],
    'ex': ['人が歩く通りには街路樹（最終段落）、さらに打ち水で短時間でも表面温度を下げられる → ②。① 古い建物は重さに耐えられないことが多い。③ 排熱が増えて逆効果。']},
  ]}]}

P8 = {
 'label': '第8問', 'title': '複数の資料＋論説文の構成（統合・要約）', 'pts': 17,
 'gist': ['テーマ「自転車をもっと町の交通手段に」。調査記事（短距離の移動に車を使う人の多さ、自転車レーンを作った町の変化）、表（自転車通勤の割合と交通事故の推移）、',
          '住民・店主・医師・市議会議員の意見。生徒のプレゼンテーションの構成メモを完成させる。'],
 'vocab': ['commute 通勤する', 'cycle lane 自転車専用レーン', 'emission 排出', 'parking space 駐車スペース', 'pilot scheme 試行計画'],
 'sections': [{
  'instr': 'あなたは「町の交通をどう変えるか」についてプレゼンテーションをするために、次の資料を集めました。',
  'blocks': [
   ('box', [
    ('h', 'Source A — Article: "Short Trips, Big Impact"'),
    ('p', 'In many towns, more than half of all car journeys are shorter than five kilometres — a distance most people can cycle in under twenty minutes. '
          'When the town of Lindwick built a network of protected cycle lanes in 2019, the share of people cycling to work rose steadily. Local businesses on the main street initially worried about losing parking spaces, '
          'but a study two years later found that people arriving by bike visited shops more often and spent about the same amount per month as drivers. Some residents, however, complained that the work caused traffic jams while the lanes were being built.'),
   ]),
   ('table', [['Year', '2018', '2019', '2020', '2021', '2022'],
              ['People cycling to work (%)', '4', '6', '9', '12', '14'],
              ['Road accidents involving cyclists', '38', '35', '27', '22', '21']], [55, 23, 23, 23, 23, 23]),
   ('box', [
    ('h', 'Source B — Opinions'),
    ('pl', '**Mr. Hall (resident, 68):** I can\'t cycle because of my knees. If roads become narrower for cars, how will people like me get to the hospital?'),
    ('pl', '**Ms. Sato (café owner):** I was against the lanes at first. Now my regular customers include many cyclists who stop for coffee on their way to work.'),
    ('pl', '**Dr. Patel (doctor):** Thirty minutes of cycling a day lowers the risk of heart disease. It\'s one of the cheapest health measures a town can take.'),
    ('pl', '**Mr. Grey (councillor):** Building lanes costs money. I would support a one-year pilot scheme on two roads first, with buses kept free-flowing.'),
   ]),
   ('box', [
    ('ja', '**プレゼンテーションの構成メモ**'),
    ('pl', '**Title:** Cycling Towards a Better Town'),
    ('pl', '**Step 1:** Problem → {問1}'),
    ('pl', '**Step 2:** Evidence → {問2}・{問3 (two answers)}　Concerns → {問4}'),
    ('pl', '**Step 3:** Proposal → {問5}'),
   ]),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Which statement best describes the "problem" in Step 1?', 'pts': 3, 'ans': 2,
    'choices': ['There are not enough cars in most towns.', 'Many short journeys that could be cycled are made by car.', 'Cyclists cause most road accidents.', 'Shops on main streets are too expensive.'],
    'ex': ['Source A 冒頭：車の移動の半分以上が5km未満（自転車で20分以内）→ ②。']},
   {'no': 2, 'prompt': 'Which statement is supported by the table?', 'pts': 3, 'ans': 4,
    'choices': ['Cycling to work decreased after 2019.', 'Accidents involving cyclists increased as more people cycled.', 'The share of people cycling doubled between 2021 and 2022.',
                'Accidents involving cyclists fell while the share of cyclists rose.'],
    'ex': ['自転車通勤 4→14％ に増加、事故 38→21件 に減少 → ④。② 逆。③ 12→14％ で2倍ではない。']},
   {'no': 3, 'prompt': 'Choose **two** benefits supported by the sources. (The order does not matter.)', 'pts': 4, 'ans': [1, 5], 'any_order': True,
    'choices': ['Cyclists continued to spend money in local shops.', 'Building cycle lanes causes no traffic problems.', 'Cycling lanes make cars faster.',
                'Everyone can cycle regardless of age or health.', 'Regular cycling can improve people\'s health.'],
    'ans_text': '①・⑤（順不同）',
    'ex': ['① 自転車の客は来店が多く、月の支出は車の客とほぼ同じ（Source A・Ms. Sato）。⑤ Dr. Patel：心臓病のリスクが下がる。',
           '② 工事中の渋滞の苦情がある。④ Mr. Hall は膝のため乗れない。']},
   {'no': 4, 'prompt': 'Which concern should be included in Step 2?', 'pts': 3, 'ans': 3,
    'choices': ['Cyclists spend less money than drivers.', 'Doctors do not recommend cycling.', 'People who cannot cycle may find it harder to travel by car.', 'Cycle lanes increase accidents.'],
    'ex': ['Mr. Hall：自転車に乗れない人は、車道が狭くなると病院に行きにくい → ③。①②④ は資料と逆。']},
   {'no': 5, 'prompt': 'Which proposal best reflects all the sources?', 'pts': 4, 'ans': 1,
    'choices': ['Start a one-year trial of protected lanes on a few roads, keep buses and access for people who cannot cycle, and measure the results.',
                'Ban cars from the whole town immediately.', 'Stop building cycle lanes because they are expensive.', 'Build lanes only for people under 30.'],
    'ex': ['Mr. Grey（試行・バス優先）、Mr. Hall（自転車に乗れない人への配慮）、データで効果を測る → ①。②③④ は極端または資料と合わない。']},
  ]}]}

PARTS_B = [P5, P6, P7, P8]
