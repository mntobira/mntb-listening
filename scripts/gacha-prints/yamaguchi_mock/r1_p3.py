# -*- coding: utf-8 -*-
# 第1回 Ⅲ：町の「修理カフェ」をめぐる会話とメール（書き下ろし。人物・団体・地名は架空）
P31 = {
    'points': 30,
    'lead': '以下は，留学生の Mia と大学生の Kenta の会話である。会話の前に，二人が話題にしている地元新聞の記事を示す。'
            '記事の内容を参考にして，会話の（①）〜（⑥）に入る適切な英語を書け。空所に入る語の数は一つとは限らない。',
    'article': {
        'title': 'Broken Toaster? Bring It to the Library',
        'paras': [
            "Westbrook Public Library will open a monthly “Repair Café” starting next month. On the first Saturday of each month, "
            "residents can bring broken household items — lamps, toasters, clothes, bicycles and even toys — to the library hall "
            "between 10 a.m. and 2 p.m. Volunteers with repair skills will try to fix them free of charge, while owners watch and learn.",
            "“Many people throw things away simply because they don’t know how to repair them,” said Tobias Hale, who is organizing "
            "the event. “We want to show that a little knowledge can keep things out of the rubbish bin.” Organizers are still "
            "looking for volunteers, especially people who can sew or fix small electrical items. No professional training is "
            "required. Those interested can contact the library by email.",
        ],
        'notes': [('free of charge', '無料で'), ('sew', '縫う')],
    },
    'conversation': [
        ('Mia', "Kenta, have you seen this article about the library? They’re starting something called a Repair Café."),
        ('Kenta', "No, I haven’t. What are they {c1}?"),
        ('Mia', "It’s a place where volunteers fix people’s broken things for free. You bring a lamp or a toaster, and they repair it while you watch."),
        ('Kenta', "That sounds great. My bicycle light stopped working last week. I was going to buy a new one."),
        ('Mia', "Well, don’t! You could take it there instead. It opens on the {c2} Saturday of every month."),
        ('Kenta', "Next month, then. But wait — who does the repairs? Do they hire professionals?"),
        ('Mia', "No, they’re all volunteers. In fact, they {c3} more people to help, especially people who can sew."),
        ('Kenta', "You’re good at sewing, aren’t you? You fixed my jacket last winter."),
        ('Mia', "I guess I am. I was actually thinking of {c4} up. The article says you don’t need any professional training."),
        ('Kenta', "You should do it. {c5} do you sign up?"),
        ('Mia', "We can write an email to the library. I’ll send one tonight."),
        ('Kenta', "Let me know what they say. If they {c6} you, I’ll bring my bicycle light on your first day."),
    ],
    'answers': [['talking about', 'doing', 'starting'],
                ['first'],
                ['are looking for', 'need', 'want'],
                ['signing', 'volunteering and signing'],
                ['How'],
                ['accept', 'take', 'choose']],
    'expl': [
        'Mia の「修理カフェというものを始める」を受けて「それは何の話？」と聞く。What are they talking about? が最も自然。What are they doing? も可。',
        '記事 On the first Saturday of each month。the の後なので序数 first。',
        '記事 Organizers are still looking for volunteers。are looking for ／ need ／ want。現在進行形の are looking for が記事の表現に最も近い。',
        'think of ～ing「～しようかと考える」。sign up「申し込む・登録する」なので signing up になる形 signing。',
        '直後の答えが「図書館にメールを書けばいい」なので，方法を聞く How。',
        '「もし採用されたら」。accept ／ take ／ choose。三人称複数 they なので s はつかない。',
    ],
    'conversation_ja': [
        'Mia：Kenta，図書館についてのこの記事見た？　修理カフェっていうものを始めるんだって。',
        'Kenta：いや，見てない。何の話？',
        'Mia：ボランティアが人の壊れたものを無料で直してくれる場所よ。ランプやトースターを持っていくと，見ている前で直してくれるの。',
        'Kenta：それはいいね。先週，自転車のライトがつかなくなったんだ。新しいのを買おうと思ってた。',
        'Mia：じゃあ買わないで！　代わりにそこへ持っていけばいいわ。毎月第1土曜日に開くのよ。',
        'Kenta：じゃあ来月だね。でも待って，誰が修理するの？　専門家を雇うの？',
        'Mia：いいえ，全員ボランティアよ。実は，手伝ってくれる人をもっと探しているの。特に縫い物ができる人を。',
        'Kenta：君は縫い物が得意だよね？　去年の冬に僕の上着を直してくれた。',
        'Mia：そうかもね。実は申し込もうかと思っていたの。専門的な訓練は要らないって記事に書いてあるし。',
        'Kenta：やるべきだよ。どうやって申し込むの？',
        'Mia：図書館にメールを書けばいいの。今夜送るわ。',
        'Kenta：返事がどうだったか教えて。採用されたら，君の初日に自転車のライトを持っていくよ。',
    ],
    'article_ja': [
        'ウェストブルック公共図書館は，来月から毎月1回の「修理カフェ」を始める。毎月第1土曜日の午前10時から午後2時まで，住民は壊れた家庭用品――ランプ，トースター，衣類，自転車，おもちゃまで――を図書館のホールに持ち込むことができる。修理の技術を持つボランティアが無料で修理を試み，持ち主はそれを見て学ぶことができる。',
        '「直し方を知らないというだけで物を捨ててしまう人が多いのです」と，催しを企画しているトバイアス・ヘイル氏は話す。「少しの知識があれば物をごみ箱に入れずにすむことを示したいのです」。主催者は今もボランティアを募集しており，特に縫い物や小さな電気製品の修理ができる人を求めている。専門的な訓練は必要ない。関心のある人は図書館にメールで連絡できる。',
    ],
}

P32 = {
    'points': 40,
    'lead': 'Mia は図書館にメール（A）を送り，修理カフェのボランティアに申し込んだ。これに対し，企画担当の Tobias Hale さんからメール（B）が届いた。'
            '次の①〜④の内容を表す英語を解答用紙の所定の欄に書き，メール（B）を完成させよ。',
    'instructions': [
        '縫い物ができるボランティアを，まさに探していたところだということ。',
        '最初の回の前に，短い説明会に出てもらえないかということ。',
        '自分の裁縫道具を持ってきてもらえると助かるということ。',
        '都合が悪い場合は，遠慮なく知らせてほしいということ。',
    ],
    'mail_a': {
        'from': 'Mia Laurent', 'to': 'Westbrook Public Library', 'subject': 'Repair Café volunteer',
        'body': [
            'Dear Repair Café team,',
            'I read about the Repair Café in the local newspaper, and I would like to volunteer. I am an exchange student at Westbrook '
            'University. I do not have any professional training, but I have been sewing since I was a child, and I often repair '
            "clothes for my friends.",
            'Please let me know if I can help.',
            'Best regards,{br}Mia Laurent',
        ],
    },
    'mail_b': {
        'from': 'Tobias Hale', 'to': 'Mia Laurent', 'subject': 'Re: Repair Café volunteer',
        'body': [
            'Dear Mia,',
            'Thank you very much for your email. {c1} Several people have already asked whether we can fix torn clothes, '
            'and until now we have had no one to do it.',
            '{c2} It will be held in the library hall at 6 p.m. on the Wednesday before the event and will take about thirty minutes. '
            'We will explain how the day works and introduce you to the other volunteers.',
            'We have some needles and thread at the library, but not very many. {c3}',
            '{c4} We are very grateful for your offer and look forward to working with you.',
            'Best wishes,{br}Tobias Hale{br}Repair Café Organizer, Westbrook Public Library',
        ],
    },
    'slots': [
        {'models': ['We have been looking for exactly that kind of volunteer: someone who can sew.',
                    'A volunteer who can sew is just what we were looking for.'],
         'tips': ['「まさに探していたところだ」は現在完了進行形 have been looking for ＋ exactly，または just what we were looking for（まさに探していたもの）。',
                  'someone who can sew ／ a volunteer who can sew と関係代名詞で「縫い物ができる人」を表す。'],
         'criteria': [('「探していた」（have been looking for ／ were looking for）', 4), ('「縫い物ができるボランティア」', 4), ('「まさに」（exactly ／ just）・文法', 2)]},
        {'models': ['Would it be possible for you to attend a short briefing before the first session?',
                    'Could you come to a short information meeting before our first event?'],
         'tips': ['依頼は Would it be possible for you to ...? ／ Could you ...? がていねい。Will you ...? は命令に近く聞こえることがある。',
                  '「説明会」は briefing ／ information meeting ／ orientation。「最初の回の前に」は before the first session ／ event。'],
         'criteria': [('ていねいな依頼の形（Could you ／ Would it be possible など）', 3), ('「短い説明会に出る」', 4), ('「最初の回の前に」', 3)]},
        {'models': ['It would be very helpful if you could bring your own sewing kit.',
                    'We would appreciate it if you could bring your own sewing tools.'],
         'tips': ['「～してもらえると助かる」は It would be (very) helpful if you could ... ／ We would appreciate it if you could ...。',
                  'appreciate の後の it を落としやすい。「裁縫道具」は sewing kit ／ sewing tools。'],
         'criteria': [('「助かる・ありがたい」（helpful ／ appreciate it）', 4), ('「自分の裁縫道具を持ってくる」', 4), ('if you could ... などの形・文法', 2)]},
        {'models': ['If the time is not convenient for you, please feel free to let me know.',
                    'Please do not hesitate to tell us if you are not available.'],
         'tips': ['「遠慮なく～してください」は please feel free to ... ／ please do not hesitate to ...。',
                  '「都合が悪い」は it is not convenient for you ／ you are not available。I am not convenient. とは言わない（convenient は人を主語にしない）。'],
         'criteria': [('「都合が悪ければ」（not convenient for you ／ not available）', 4), ('「遠慮なく知らせて」（feel free ／ do not hesitate）', 4), ('文法', 2)]},
    ],
    'mail_b_ja': [
        'Mia さんへ',
        'メールをどうもありがとうございます。【①】破れた服を直せるかという問い合わせがすでに何件か来ているのですが，これまではそれをできる人がいませんでした。',
        '【②】説明会は催しの前の水曜日の午後6時から図書館ホールで行い，30分ほどかかります。当日の流れを説明し，ほかのボランティアを紹介します。',
        '図書館にも針と糸はありますが，あまり多くはありません。【③】',
        '【④】お申し出に心から感謝しています。一緒に活動できるのを楽しみにしています。',
        'よろしくお願いします。　トバイアス・ヘイル（ウェストブルック公共図書館 修理カフェ企画担当）',
    ],
}
