"""第3回 リーディング 第5〜8問"""

P5 = {
 'label': '第5問', 'title': '求人広告・応募フォーム・メール（複数資料の照合）', 'pts': 16,
 'gist': ['イギリスの夏の音楽フェスティバルの学生ボランティア募集。役割（受付・ごみ分別・子どもエリア）、条件（16歳以上、子どもエリアは18歳以上）、'
          '特典（無料入場・食事券）。応募者 Mei の申込とスタッフからの返信。'],
 'vocab': ['steward 係員', 'shift 勤務時間帯', 'recycling 分別回収', 'voucher 引換券', 'wristband リストバンド'],
 'sections': [{
  'instr': 'あなたはイギリスに留学中で、夏休みのボランティアを探しています。次の資料を読みなさい。',
  'blocks': [
   ('box', [
    ('title', 'Volunteer at Meadowfield Music Festival! (25–27 July)'),
    ('p', 'We need 200 volunteers to help our festival run smoothly. All volunteers work **three 6-hour shifts** over the weekend and get **free entry for all three days** when they are not working, plus a meal voucher for each shift.'),
    ('table', [['Role', 'What you do', 'Minimum age'],
               ['Welcome Team', 'Check tickets and give out wristbands at the gates', '16'],
               ['Green Team', 'Help visitors sort rubbish into recycling bins', '16'],
               ['Kids\' Zone', 'Run games and craft activities for children', '18'],
               ['Info Point', 'Answer questions; give directions; speak another language (preferred)', '17']], [35, 105, 40]),
    ('p', 'Apply online by 30 June. Volunteers must attend a one-hour online training session on 15 July. A £30 deposit is taken when you apply and returned after you complete all your shifts.'),
   ], '#f4f8f1'),
   ('box', [
    ('h', 'Application (summary)'),
    ('table', [['Name', 'Mei Tanaka', 'Age', '17'], ['Languages', 'Japanese, English, some Korean', 'Camping?', 'Yes'],
               ['Role choice 1', "Kids' Zone", 'Role choice 2', 'Info Point']], [35, 60, 35, 50]),
   ], '#ffffff'),
   ('box', [
    ('small', '**From:** Volunteer Office\n**To:** Mei Tanaka\n**Subject:** Your volunteer role'),
    ('p', 'Dear Mei,'),
    ('p', 'Thank you for applying! Unfortunately, we are unable to place you in your first choice because of the age requirement. However, we are delighted to offer you a place in your second choice — your language skills will be very useful there.'),
    ('p', 'Your shifts are: Friday 12:00–18:00, Saturday 08:00–14:00 and Sunday 14:00–20:00. Please note that the online training has been moved from 15 July to **16 July** at 7 p.m.'),
    ('p', 'Volunteers who camp can use the volunteers\' campsite, which has hot showers. See you there!'),
   ], '#fbfaf6'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Which role will Mei have?', 'pts': 3, 'ans': 4,
    'choices': ['Welcome Team', 'Green Team', "Kids' Zone", 'Info Point'],
    'ex': ['第1希望の子どもエリアは18歳以上（Mei は17歳）→ 第2希望の **Info Point**（17歳以上・外国語歓迎）。']},
   {'no': 2, 'prompt': 'Complete the sentence.\nMei will receive {1} meal vouchers and work {2} hours in total.', 'pts': 3, 'ans': [3, 6], 'score': 'all', 'no_balance': True,
    'choices': ['one', 'two', 'three', '6', '12', '18'],
    'ans_text': '③・⑥（完答）',
    'ex': ['{1}："a meal voucher for each shift" × 3シフト ＝ **3枚**（③）。',
           '{2}：6時間 × 3 ＝ **18時間**（⑥）。メールの勤務時間（12–18・8–14・14–20）でも確認できる。']},
   {'no': 3, 'prompt': 'When should Mei attend the online training?', 'pts': 3, 'ans': 1,
    'choices': ['16 July at 7 p.m.', '15 July at 7 p.m.', '25 July at noon', '30 June'],
    'ex': ['メールで 15日 → **16日** 19時に変更。② は広告の元の日付。']},
   {'no': 4, 'prompt': 'Which of the following statements are true? Choose the best combination.\nA. Mei will work on Saturday morning.\nB. Mei will not get her deposit back.\nC. Mei can enjoy the festival on Friday evening.\nD. Mei is too young to be a volunteer.', 'pts': 3, 'ans': 2,
    'choices': ['A and B', 'A and C', 'B and D', 'C and D'],
    'ex': ['A：土曜 8〜14時 → 正。C：金曜は18時まで勤務、その後は無料で楽しめる → 正。',
           'B：全シフト完了で返金 → 誤。D：16歳以上なら参加できる → 誤。']},
   {'no': 5, 'prompt': 'Which **two** can be inferred from the materials? (The order does not matter.)', 'pts': 4, 'ans': [2, 5], 'any_order': True,
    'choices': ['Mei will work for 12 hours in total.', 'Mei\'s Korean may be helpful in her role.', 'Volunteers must pay £30 that is never returned.',
                'The festival lasts for one day.', 'Mei will be able to use hot showers at the campsite.'],
    'ans_text': '②・⑤（順不同）',
    'ex': ['② Info Point は外国語ができる人を歓迎、メール "your language skills will be very useful"。⑤ キャンプ希望 Yes → 温水シャワーつきの場所を使える。',
           '① 6時間 × 3 ＝ 18時間。③ 返金される。④ 3日間。']},
  ]}]}

P6 = {
 'label': '第6問', 'title': '歴史物語＋発表メモ（時系列・要点）', 'pts': 12,
 'gist': ['19世紀、イギリスの港町で灯台守を務めた架空の女性「Ada Pell」の物語。父の死後、灯台を守り続け、嵐の夜に難破船の乗組員を救った。'
          'その後、灯台の記録をもとに潮と天候の関係を調べ、漁師の安全に役立つ表を作った。',
          '※設問の題材としての架空の人物です。'],
 'vocab': ['lighthouse keeper 灯台守', 'logbook 業務日誌', 'tide 潮', 'shipwreck 難破', 'rowing boat（英）手こぎボート'],
 'sections': [{
  'instr': 'あなたは英語の授業で、歴史上の人物について調べ、発表メモを作っています。',
  'blocks': [
   ('box', [
    ('title', 'The Keeper of Gull Point'),
    ('p', 'Ada Pell was born in 1841 in the lighthouse at Gull Point, a rocky headland on the coast of Cornwall. Her father was the lighthouse keeper, and from the age of eight, Ada helped him clean the great lamp and record the weather in the logbook every four hours. '
          'She learned to read the sea the way other children learned to read books.'),
    ('p', 'When her father died suddenly in 1863, the authorities planned to send a new keeper from London. Ada, then 22, wrote a letter asking to take over the job. At first, they refused, saying the work was "unsuitable for a woman." '
          'But no replacement could be found before winter, and they reluctantly allowed her to continue "for the time being."'),
    ('p', 'That winter tested her. On the night of 9 November 1864, a violent storm drove a cargo ship, the //Margaret Rose//, onto the rocks below the lighthouse. '
          'Ada kept the lamp burning all night, and at dawn, when the wind dropped slightly, she and a local fisherman rowed out in a small boat and brought back five of the crew. Two more were rescued later that morning by a lifeboat from the nearby town.'),
    ('p', 'The rescue made her briefly famous. Newspapers called her "the Heroine of Gull Point," and visitors came to see her. Ada disliked the attention. "I did what any keeper would do," she wrote to her sister. "The real work is not the storm. It is the four-hourly log, every day, for years."'),
    ('p', 'In fact, it was the logbook that became her greatest achievement. Over the next twenty years, Ada compared her weather records with the times of the tides and the reports of local fishermen. '
          'She noticed that certain wind directions combined with high spring tides almost always produced dangerous waves near the harbour entrance. In 1885, she produced a simple table that fishermen could use to decide whether it was safe to go out. Local records suggest that the number of fishing boats lost near Gull Point fell sharply in the following decade.'),
    ('p', 'Ada remained keeper until 1901, when she was sixty. The authorities, who had once called the job unsuitable for a woman, presented her with a silver medal for "long and faithful service." Her logbooks, covering almost forty years, are now kept in the county archive, where scientists still use them to study changes in the local climate.'),
   ], '#fbfaf6'),
   ('box', [
    ('ja', '**発表メモ**'),
    ('pl', '**Ada Pell (1841–?)**'),
    ('pl', '■ Why she was able to become keeper → 問1'),
    ('pl', '■ Events in order → 問2 (four boxes)'),
    ('pl', '■ Her greatest achievement and its effects → 問3 (two answers)'),
    ('pl', '■ Her attitude to fame → 問4'),
   ], '#fff6df'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Why was Ada allowed to continue as keeper after her father died?', 'pts': 3, 'ans': 3,
    'choices': ['The authorities believed women were the best keepers.', 'She had rescued a ship\'s crew.', 'No replacement could be found before winter.', 'Her father had asked the authorities in a letter.'],
    'ex': ['"no replacement could be found before winter, and they reluctantly allowed her" → ③。② の救助は翌年のこと。']},
   {'no': 2, 'prompt': 'Put the following events into the order in which they happened.\n{1} → {2} → {3} → {4}', 'pts': 3, 'ans': [2, 4, 1, 3], 'score': 'all',
    'choices': ['Ada created a table to help fishermen.', 'Ada asked to take over her father\'s job.', 'Ada received a silver medal.', 'Ada helped rescue sailors from a cargo ship.'],
    'ans_text': '②→④→①→③',
    'ex': ['1863 後任を願い出る → 1864 救助 → 1885 表を作る → 1901 銀メダル。']},
   {'no': 3, 'prompt': 'Choose **two** statements about Ada\'s logbook work that are true. (The order does not matter.)', 'pts': 3, 'ans': [1, 4], 'any_order': True,
    'choices': ['She combined weather records with tide times and fishermen\'s reports.', 'She stopped recording the weather after the rescue.',
                'Her table made the storms less frequent.', 'Fewer fishing boats appear to have been lost after her table was used.', 'Her logbooks were destroyed in 1901.'],
    'ans_text': '①・④（順不同）',
    'ex': ['① 第5段落の比較方法。④ "the number of fishing boats lost … fell sharply"。',
           '③ 嵐そのものは減らない（危険を予測しただけ）。⑤ 記録保管所に残っている。']},
   {'no': 4, 'prompt': 'Which best describes Ada\'s attitude towards her fame?', 'pts': 3, 'ans': 2,
    'choices': ['She enjoyed meeting the visitors.', 'She thought daily, careful work mattered more than one heroic night.', 'She used it to become a writer.', 'She believed she deserved more recognition.'],
    'ex': ['"The real work is not the storm. It is the four-hourly log, every day, for years." → ②。']},
  ]}]}

P7 = {
 'label': '第7問', 'title': '論理的な文章＋スライド（要点・応用）', 'pts': 16,
 'gist': ['「マイクロプラスチック」についての説明文。発生源（一次＝洗顔料のビーズ等、二次＝ペットボトルや衣類の繊維が砕けたもの）、海の生物や人体への影響の研究状況、'
          '洗濯ネット・フィルター・使い捨て削減などの対策。'],
 'vocab': ['microplastic マイクロプラスチック', 'synthetic 合成の', 'fibre（英）繊維', 'food chain 食物連鎖', 'filter ろ過装置'],
 'sections': [{
  'instr': 'あなたは環境についての発表のために、次の記事を読んでスライドを作っています。',
  'blocks': [
   ('box', [
    ('title', 'Tiny Pieces, Big Problem'),
    ('p', 'Microplastics are pieces of plastic smaller than five millimetres — about the size of a sesame seed or smaller. They have been found almost everywhere scientists have looked: in deep ocean trenches, in Arctic snow, in tap water and even in human blood.'),
    ('p', 'Scientists divide microplastics into two types. **Primary** microplastics are made small on purpose. Examples include the tiny beads once common in face scrubs and toothpaste, many of which are now banned in several countries. '
          '**Secondary** microplastics, which make up the majority, come from larger objects that break down over time. A plastic bottle left on a beach is slowly broken into smaller and smaller pieces by sunlight and waves.'),
    ('p', 'One surprising source is our clothes. Many fabrics, such as polyester and nylon, are made from plastic. Each time they are washed, thousands of tiny fibres come loose and flow into wastewater. '
          'Treatment plants catch many of them, but not all. Car tyres are another major source: as they wear down on roads, they release particles that are washed into rivers by rain.'),
    ('p', 'What harm do microplastics cause? In the sea, animals such as fish, shellfish and seabirds often mistake them for food. This can make the animals feel full without receiving any nutrition, and some studies have linked it to slower growth. '
          'Because small animals are eaten by larger ones, microplastics can move up the food chain. The effects on human health, however, are still unclear. Researchers have found microplastics in the human body, but they do not yet know whether — or how much — they are harmful.'),
    ('p', 'Solutions exist at several levels. Governments can ban unnecessary plastic products and require better filters at treatment plants. Manufacturers can design fabrics that shed fewer fibres. '
          'Individuals can help too: washing synthetic clothes less often, using a special laundry bag that traps fibres, choosing natural materials such as cotton or wool when possible, and reducing single-use plastics.'),
    ('p', 'Because microplastics are so small and so widespread, removing them from the environment is nearly impossible. The most effective strategy, experts agree, is to stop them from entering it in the first place.'),
   ], '#fbfaf6'),
   ('slide', 'Microplastics', ['Definition: plastic pieces smaller than 5 mm', 'Two types: ( 問1 )', 'Sources: face scrubs, bottles, ( 問2 )',
                               'Effects: animals → certain / humans → ( 問3 )', 'Best strategy: ( 問4 )']),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Which best completes "Two types" on the slide?', 'pts': 3, 'ans': 4,
    'choices': ['natural and artificial', 'large and small', 'old and new', 'made small on purpose, and broken down from larger items'],
    'ex': ['一次（意図的に小さく作られた）と二次（大きなものが砕けた）→ ④。']},
   {'no': 2, 'prompt': 'Which **two** sources should be added to the slide? (The order does not matter.)', 'pts': 4, 'ans': [2, 3], 'any_order': True,
    'choices': ['cotton shirts', 'fibres from washing synthetic clothes', 'car tyres wearing down on roads', 'wool sweaters', 'Arctic snow'],
    'ans_text': '②・③（順不同）',
    'ex': ['② 合成繊維の洗濯で出る繊維。③ タイヤの摩耗。①④ は天然素材（対策として勧められている）。⑤ 見つかった**場所**で発生源ではない。']},
   {'no': 3, 'prompt': 'Which best completes "humans →" on the slide?', 'pts': 3, 'ans': 1,
    'choices': ['still unknown', 'proven to be very harmful', 'proven to be completely safe', 'only affects children'],
    'ex': ['"The effects on human health, however, are still unclear." → ①。②③ はどちらも言い過ぎ。']},
   {'no': 4, 'prompt': 'Which best completes "Best strategy" on the slide?', 'pts': 3, 'ans': 3,
    'choices': ['Remove microplastics from the ocean with nets', 'Stop eating fish and shellfish', 'Prevent microplastics from entering the environment', 'Wash clothes more often'],
    'ex': ['最終段落 "stop them from entering it in the first place" → ③。① ほぼ不可能とされる。④ 逆（洗う回数を減らす）。']},
   {'no': 5, 'prompt': 'Your classmate Ken says: "I wash my polyester sports shirts every day and buy a bottle of water from a vending machine after practice." Based on the article, which is the best advice for Ken?', 'pts': 3, 'ans': 2,
    'choices': ['Switch to washing his shirts at a higher temperature.', 'Use a laundry bag that traps fibres and carry a reusable water bottle.',
                'Leave his used bottles on the beach so they break down.', 'Buy more polyester shirts so he can wash them less.'],
    'ex': ['合成繊維の洗濯 → 繊維をとらえるネット、使い捨てボトル → 繰り返し使える水筒。② が両方に対応。③ は二次マイクロプラスチックを増やす。']},
  ]}]}

P8 = {
 'label': '第8問', 'title': '複数の意見＋論説文の構成（統合・要約）', 'pts': 17,
 'gist': ['テーマ「高校は始業時刻を遅らせるべきか」。研究記事（思春期の体内時計は夜型にずれる）、実施した学校のデータ、生徒・保護者・部活顧問・校長の意見。',
          '生徒のエッセイの構成メモを完成させる。'],
 'vocab': ['adolescent 思春期の', 'circadian rhythm 体内時計', 'tardiness 遅刻', 'extracurricular 課外の', 'trial 試行'],
 'sections': [{
  'instr': 'あなたは「高校の始業時刻を遅らせるべきか」というテーマでエッセイを書くために、次の資料を集めました。',
  'blocks': [
   ('box', [
    ('h', 'Source A — Research summary'),
    ('p', 'During adolescence, the body\'s internal clock shifts later. Teenagers typically start to feel sleepy around 11 p.m. and are biologically ready to wake at about 8 a.m. This is not laziness; it is a natural change. '
          'Medical associations in several countries recommend that secondary schools start no earlier than 8:30 a.m.'),
   ], '#fbfaf6'),
   ('line', {'title': 'Results at Westbrook High (start time moved from 8:00 to 8:50 in Year 2)', 'cats': ['Year 1', 'Year 2', 'Year 3'],
             'series': [[6.6, 7.3, 7.4], [12, 7, 6]], 'legend': ['Average sleep (hours)', 'Late arrivals (per day)'], 'maxv': 14}),
   ('box', [
    ('h', 'Source B — Opinions'),
    ('pl', '**Yuto (student):** I take a 70-minute train to school. With an 8:00 start, I leave home at 6:30 and fall asleep in first period. A later start would change my life.'),
    ('pl', '**Mrs. Clarke (parent):** I start work at 8:30. If school starts later, I can\'t drive my daughter there. Schools need to think about families like mine.'),
    ('pl', '**Mr. Ito (football coach):** If classes finish later, practice will end after dark in winter. We would need to rethink club schedules.'),
    ('pl', '**Ms. Reyes (principal):** At Westbrook, we solved the transport problem by opening the library at 7:30 for early arrivals, and we moved some club activities to the morning.'),
   ], '#fbfaf6'),
   ('box', [
    ('ja', '**エッセイの構成メモ**'),
    ('pl', '**Title:** Later Start, Better Learning?'),
    ('pl', '**Step 1:** Present the issue and my position → {問1}'),
    ('pl', '**Step 2:** Evidence → {問2}・{問3}　Concerns → {問4 (two answers)}'),
    ('pl', '**Step 3:** Conclusion with a solution → {問5}'),
   ], '#fff6df'),
  ],
  'qs': [
   {'no': 1, 'prompt': 'Which position is best supported by the sources as a whole?', 'pts': 3, 'ans': 1,
    'choices': ['Schools should consider a later start, while planning for families\' and clubs\' needs.', 'Starting time has no effect on students.',
                'Students who are sleepy are simply lazy.', 'Schools should start earlier so that clubs have more time.'],
    'ex': ['研究とデータは遅らせる利点を示し、反対意見（保護者・顧問）にも解決策がある → ①。③ は Source A が否定。']},
   {'no': 2, 'prompt': 'According to Source A, why do teenagers have trouble waking up early?', 'pts': 3, 'ans': 3,
    'choices': ['They use smartphones too much.', 'They do not exercise enough.', 'Their internal clock naturally shifts later.', 'They eat dinner too late.'],
    'ex': ['"the body\'s internal clock shifts later … it is a natural change" → ③。①②④ は本文にない。']},
   {'no': 3, 'prompt': 'Which statement is supported by the graph?', 'pts': 3, 'ans': 4,
    'choices': ['Sleep decreased after the start time changed.', 'Late arrivals doubled in Year 2.', 'There was no change in Year 2.',
                'Students slept longer and arrived late less often after the change.'],
    'ex': ['睡眠 6.6 → 7.3 → 7.4 時間に増加、遅刻 12 → 7 → 6 件に減少 → ④。']},
   {'no': 4, 'prompt': 'Choose **two** concerns about a later start mentioned in the sources. (The order does not matter.)', 'pts': 4, 'ans': [2, 4], 'any_order': True,
    'choices': ['Students would sleep too much.', 'Some parents could not take their children to school.', 'The library would close.', 'Club activities might end after dark.', 'Train fares would rise.'],
    'ans_text': '②・④（順不同）',
    'ex': ['② Mrs. Clarke（出勤前に送れない）。④ Mr. Ito（冬は暗くなってから練習が終わる）。①③⑤ は誰も言っていない。']},
   {'no': 5, 'prompt': 'Which is the most suitable conclusion for the essay?', 'pts': 4, 'ans': 2,
    'choices': ['Schools should keep the 8:00 start because change is difficult.', 'Schools could start around 8:30–9:00, opening early-arrival spaces and moving some clubs to the morning.',
                'Students should simply go to bed earlier.', 'Clubs should be cancelled to allow a later start.'],
    'ex': ['研究の推奨（8:30以降）＋ Westbrook の解決策（図書館の早朝開放・朝の部活）で二つの懸念に対応する ②。④ は極端。']},
  ]}]}

PARTS_B = [P5, P6, P7, P8]
