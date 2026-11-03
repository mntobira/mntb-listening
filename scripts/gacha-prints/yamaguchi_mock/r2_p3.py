# -*- coding: utf-8 -*-
# 第2回 Ⅲ：大学に移ってくる週末の市場をめぐる会話とメール（書き下ろし。人物・団体・地名は架空）
P31 = {
    'points': 30,
    'lead': '以下は，大学生の Sota と留学生の Emma の会話である。会話の前に，二人が読んでいる大学新聞の記事を示す。'
            '記事を手がかりに，会話の（①）〜（⑥）を適切な英語で補え。1語とは限らない。',
    'article': {
        'title': 'Saturday Market Moves to Campus',
        'paras': [
            "From April, the Northfield Saturday Market will be held on the university’s main lawn instead of in the town car park, "
            "which is being rebuilt. The market, which has run for over twenty years, will open from 8 a.m. to 1 p.m. every Saturday "
            "and will include about forty stalls selling vegetables, bread, flowers and handmade goods.",
            "“Students have always been some of our best customers, so moving to the campus makes sense,” said market manager Clara Voss. "
            "For the first time, the market will also offer five free stalls each week to student clubs and societies. Clubs that wish to "
            "take part must apply at least two weeks in advance by writing to the market office.",
        ],
        'notes': [('stall', '屋台・売り場'), ('in advance', '前もって')],
    },
    'conversation': [
        ('Sota', "Emma, did you hear? The Saturday Market is coming to our campus."),
        ('Emma', "Really? I thought it was always held in the car park in town. Why {c1} it moving?"),
        ('Sota', "The car park is being rebuilt. So from April, it’ll be on the main lawn every Saturday morning."),
        ('Emma', "That’s great. I love their bread. What time does it {c2}?"),
        ('Sota', "At eight. It closes at one, so you can’t sleep in if you want the good bread."),
        ('Emma', "I’ll set an alarm. By the way, I heard clubs can sell things there. Is that true?"),
        ('Sota', "Yes. There are five free stalls for student clubs every week. Your cooking club could {c3} one."),
        ('Emma', "We make really good strawberry jam. I’m sure people would buy it. What do we have to do?"),
        ('Sota', "You have to apply to the market office. And you have to do it at least two weeks {c4}."),
        ('Emma', "Two weeks? Then we should hurry. {c5} should I contact them — by phone?"),
        ('Sota', "The article says you have to write to them. An email should be fine."),
        ('Emma', "OK. I’ll write tonight, and if they say yes, you {c6} be our first customer."),
    ],
    'answers': [['is'],
                ['open', 'start'],
                ['apply for', 'get', 'have', 'use'],
                ['in advance', 'before', 'ahead', 'beforehand'],
                ['How'],
                ['have to', 'must', 'will', "’ll"]],
    'expl': [
        '主語 it（the market）は単数で，現在進行形 is moving の疑問文。Why is it moving?',
        '「何時に開くの？」。開始時刻を聞いているので open ／ start。does の後なので原形。',
        '記事 offer five free stalls ... to student clubs。「申し込める・使える」apply for ／ get ／ have ／ use。could の後なので原形。',
        '記事 at least two weeks in advance。in advance ／ before ／ ahead ／ beforehand。',
        '直後に「電話で？」と方法を確かめ，Sota が「手紙・メールで」と答えている。方法を聞く How。',
        '「最初のお客さんになってもらうからね」という軽い約束・念押し。have to ／ must ／ will。',
    ],
    'conversation_ja': [
        'Sota：Emma，聞いた？　土曜市がうちのキャンパスに来るんだって。',
        'Emma：本当？　いつも町の駐車場でやっていると思ってた。どうして移るの？',
        'Sota：駐車場が建て直し中なんだ。だから4月からは毎週土曜の朝に中央の芝生でやるよ。',
        'Emma：すてき。あそこのパンが大好きなの。何時に開くの？',
        'Sota：8時。1時には閉まるから，おいしいパンが欲しかったら寝坊はできないよ。',
        'Emma：目覚ましをかけるわ。ところで，サークルもそこで物を売れるって聞いたけど，本当？',
        'Sota：うん。毎週，学生のサークル用に無料の売り場が5つあるんだ。君の料理サークルも1つ申し込めるよ。',
        'Emma：私たち，すごくおいしいいちごジャムを作るの。きっと買ってもらえるわ。何をすればいいの？',
        'Sota：市場の事務所に申し込まないといけない。しかも少なくとも2週間前にね。',
        'Emma：2週間？　じゃあ急がなきゃ。どうやって連絡すればいいの，電話？',
        'Sota：記事には文書で申し込むって書いてある。メールで大丈夫だと思うよ。',
        'Emma：分かった。今夜書くわ。OKが出たら，あなたが最初のお客さんになってね。',
    ],
    'article_ja': [
        '4月から，ノースフィールド土曜市は，建て直し中の町の駐車場ではなく，大学の中央芝生で開かれる。20年以上続くこの市場は，毎週土曜日の午前8時から午後1時まで開かれ，野菜，パン，花，手作りの品を売る約40の売り場が並ぶ。',
        '「学生はずっと私たちの大切なお客さんなので，キャンパスへの移転は理にかなっています」と市場の責任者クララ・ヴォスさんは話す。市場は初めて，毎週5つの売り場を学生のサークルや団体に無料で提供する。参加を希望するサークルは，少なくとも2週間前までに市場の事務所に文書で申し込まなければならない。',
    ],
}

P32 = {
    'points': 40,
    'lead': 'Emma は市場の事務所にメール（A）を送り，料理サークルとして売り場を申し込んだ。これに対し，責任者の Clara Voss さんから返信（B）が届いた。'
            '①〜④に示した内容をそれぞれ英語で書き，返信（B）の空欄を埋めよ。',
    'instructions': [
        '料理サークルが市場に参加してくれることを，とてもうれしく思っているということ。',
        '4月の第2土曜日の売り場なら，まだ空いているということ。',
        'ジャムのびんには，材料を書いたラベルを貼る必要があるということ。',
        '当日は，開始の30分前までに来てほしいということ。',
    ],
    'mail_a': {
        'from': 'Emma Novak', 'to': 'Northfield Saturday Market Office', 'subject': 'Stall application: Cooking Club',
        'body': [
            'Dear Ms. Voss,',
            'I am writing on behalf of the university Cooking Club. We read in the student newspaper that the market will offer free stalls '
            'to student clubs, and we would like to apply. Our club makes homemade strawberry jam, and we would like to sell it at the market. '
            'Any Saturday in April would suit us.',
            'Thank you for considering our application.',
            'Kind regards,{br}Emma Novak{br}Cooking Club',
        ],
    },
    'mail_b': {
        'from': 'Clara Voss', 'to': 'Emma Novak', 'subject': 'Re: Stall application: Cooking Club',
        'body': [
            'Dear Emma,',
            'Thank you for your application. {c1} Homemade food is always popular with our customers.',
            'Most of the stalls for April have already been taken. {c2} If that date suits you, please reply by Friday.',
            'There is one rule I should mention. {c3} This is because some customers have food allergies, and they need to know exactly what is in the jars.',
            '{c4} This will give you enough time to set up your table before the customers arrive. We look forward to tasting your jam!',
            'Best regards,{br}Clara Voss{br}Market Manager, Northfield Saturday Market',
        ],
    },
    'slots': [
        {'models': ['We are very happy that your cooking club will take part in the market.',
                    'We are delighted to have the Cooking Club join our market.'],
         'tips': ['「～してうれしい」は be happy that ... ／ be delighted to have ...（～に来てもらえてうれしい）。',
                  '「参加する」は take part in ／ join。join は他動詞なので join in the market とはしない。'],
         'criteria': [('「とてもうれしい」（very happy ／ delighted）', 4), ('「料理サークルが市場に参加する」', 4), ('文法', 2)]},
        {'models': ['However, a stall is still available on the second Saturday of April.',
                    'We still have a free stall on the second Saturday in April.'],
         'tips': ['「空いている」は available ／ free。「まだ」は still で，be 動詞の後・一般動詞の前に置く。',
                  '「4月の第2土曜日に」は on the second Saturday of ／ in April。曜日・日付には on を使う。'],
         'criteria': [('「まだ空いている」（still available ／ still have a free stall）', 4), ('「4月の第2土曜日」と前置詞 on', 4), ('文法', 2)]},
        {'models': ['Each jar of jam must have a label that lists its ingredients.',
                    'You need to put a label showing the ingredients on every jar.'],
         'tips': ['「～する必要がある」は must ／ need to ／ have to。規則を伝える文なので must が自然。',
                  '「材料」は ingredients（複数形）。「材料を書いたラベル」は a label that lists ／ showing the ingredients。'],
         'criteria': [('「必要がある」（must ／ need to ／ have to）', 3), ('「材料を書いたラベル」', 4), ('「びんに貼る」・文法', 3)]},
        {'models': ['On the day, please arrive at least thirty minutes before the market opens.',
                    'We would like you to come by 7:30, half an hour before opening time.'],
         'tips': ['「～までに来る」は arrive ／ come by ...。by は「期限」，until は「その時までずっと」なので until は使わない。',
                  '「開始の30分前」は thirty minutes before the market opens ／ half an hour before opening time。開始は8時なので by 7:30 も可。'],
         'criteria': [('「来てほしい」（please arrive ／ we would like you to come）', 3), ('「開始の30分前（までに）」', 5), ('文法', 2)]},
    ],
    'mail_b_ja': [
        'Emma さんへ',
        'お申し込みありがとうございます。【①】手作りの食べ物は，いつもお客さんに人気があります。',
        '4月の売り場のほとんどはすでに埋まっています。【②】その日でよろしければ，金曜日までにご返信ください。',
        'ひとつお伝えしておくべき決まりがあります。【③】食物アレルギーのあるお客さんもいて，びんに何が入っているかを正確に知る必要があるからです。',
        '【④】そうすれば，お客さんが来る前にテーブルを準備する時間が十分にとれます。ジャムを味わうのを楽しみにしています！',
        'よろしくお願いします。　クララ・ヴォス（ノースフィールド土曜市 責任者）',
    ],
}
