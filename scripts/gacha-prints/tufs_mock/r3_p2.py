# -*- coding: utf-8 -*-
# 第3回 大問2 本文（書き下ろし・町と人物は架空）
P2 = {
    'points': 30,
    'lead': '次の英文は、ある町の古い映画館を住民が運営し直した話についての記事である。よく読んで、後の設問に答えよ。',
    'title': 'The Cinema That Refused to Close',
    'passage': [
        "When the Regent Cinema in the market town of Ashby Vale announced that it would close, many residents assumed it was simply a sign "
        "of the times. The building had shown films since 1934, but audiences had been {b1} for years as people turned to streaming services "
        "at home. On the final night, the owner thanked the small crowd for coming and said he could no longer afford to keep the lights on.",

        "One person in the audience that night was Ruth Okonjo, a retired accountant who had seen her first film at the Regent at the age of "
        "six. She could not bear the thought of the building being turned into flats. Within a week, she had {b2} a public meeting in the "
        "town hall. More than two hundred people came, far more than she had expected, and many of them offered to help in some way. Some brought old ticket stubs and photographs, and one elderly man described "
        "proposing to his wife in the back row in 1958.",

        "The group's first task was to raise enough money to buy the building. Instead of looking for one wealthy investor, they {b3} to sell "
        "shares to the community. Each share cost fifty pounds, and anyone who bought one would become a part-owner of the cinema. Over six "
        "months, nearly fifteen hundred people bought shares, some of them living far away but {b4} to the town by childhood memories.",

        "Running a cinema turned out to be harder than buying one. The projection equipment was old, the roof leaked, and none of the volunteers "
        "had any experience in the film business. A retired engineer spent his weekends {b5} the heating system, while a group of students "
        "designed a new website and handled the cinema's social media. Local businesses donated paint, carpets, and seats {b6} from a theater "
        "that had been renovated in a nearby city.",

        "The volunteers also realized that they could not compete with streaming services by showing the same films that people could watch at "
        "home. Instead, they {b7} the Regent as a place where people came together. They began holding monthly discussion evenings after "
        "screenings, film nights for parents with babies, and quiet afternoon showings with softer sound and lighting for people who find "
        "ordinary cinemas overwhelming. Schools now bring classes to watch films that are {b8} to their lessons.",

        "Five years after it nearly closed, the Regent is open seven days a week and makes a small profit, which is {b9} in repairs and in "
        "lowering ticket prices for young people. About sixty volunteers work there regularly, selling tickets, making popcorn, and greeting "
        "customers at the door. Okonjo says that many of them came to help the cinema but stayed because of the friendships they made. For some older "
        "volunteers who live alone, a shift at the Regent is the main social event of their week, and several say it has given them a "
        "new sense of purpose.",

        "Other towns have since asked the group for advice, and Okonjo always gives the same answer: a building can be saved only if people "
        "feel that it belongs to them. \"We did not just {b10} a cinema,\" she says. \"We gave the town a living room.\"",
    ],
    'qlead': '空所 (1)〜(10) を補うのに最適な語を下の語群から選べ。語形の変化が必要なものは変化させた形で解答用紙に記入すること。'
             '語群の各語は一度ずつしか使えず、1 語は余る。',
    'bank': ['connect', 'decide', 'invest', 'organize', 'rebuild', 'reinvent', 'relate', 'remove', 'rescue', 'shrink', 'study'],
    'blanks': [
        {'n': 1, 'base': 'shrink', 'answer': 'shrinking',
         'expl': 'had been ～ing for years「何年も～し続けていた」（過去完了進行形）。audiences had been shrinking「観客が減り続けていた」。'},
        {'n': 2, 'base': 'organize', 'answer': 'organized',
         'expl': 'had の後なので過去完了。organize a meeting「集会を開く（準備する）」。'},
        {'n': 3, 'base': 'decide', 'answer': 'decided',
         'expl': '過去の話なので過去形。decide to do「～することに決める」。'},
        {'n': 4, 'base': 'connect', 'answer': 'connected',
         'expl': 'connected to ～ by …「…によって～とつながっている」。but の後に（being）connected が続き、some of them を説明する過去分詞。'},
        {'n': 5, 'base': 'rebuild', 'answer': 'rebuilding', 'irregular': True,
         'expl': 'spend ＋ 時間 ＋ ～ing「～して時間を過ごす」。rebuild の ing 形は rebuilding。'},
        {'n': 6, 'base': 'remove', 'answer': 'removed',
         'expl': 'seats removed from a theater「劇場から取り外された座席」。名詞を後ろから修飾する過去分詞（受け身）。'},
        {'n': 7, 'base': 'reinvent', 'answer': 'reinvented',
         'expl': '過去の話なので過去形。reinvent A as B「A を B として生まれ変わらせる」。同じ映画を見せるのではなく、人が集まる場所に変えた。'},
        {'n': 8, 'base': 'relate', 'answer': 'related',
         'expl': 'be related to ～「～に関係がある」。授業に関係のある映画。'},
        {'n': 9, 'base': 'invest', 'answer': 'invested',
         'expl': 'which is invested in ～「～に投資される（使われる）」。主語は a small profit で受け身。'},
        {'n': 10, 'base': 'rescue', 'answer': 'rescue',
         'expl': 'did not just の後なので原形。rescue a cinema「映画館を救う」。'},
    ],
    'translation': [
        '市場町アシュビー・ベールのリージェント映画館が閉館すると発表したとき、多くの住民はそれを単に時代の流れだと考えた。建物は 1934 年から映画を上映してきたが、'
        '人々が家で動画配信サービスを使うようになり、観客は何年も減り続けていた。最後の夜、持ち主は来てくれた少人数の観客に感謝し、もう明かりをつけておく余裕が'
        'ないと言った。',

        'その夜の観客の一人に、ルース・オコンジョがいた。退職した会計士で、6 歳のときにリージェントで初めて映画を見た人だった。彼女は、建物が集合住宅に変えられる'
        'と考えると耐えられなかった。1 週間のうちに、彼女は町役場で住民集会を開いていた。200 人を超える人が集まり、彼女が予想していたよりずっと多く、その多くが'
        '何らかの形で手伝うと申し出た。古いチケットの半券や写真を持ってきた人もいれば、1958 年に後ろの列で妻にプロポーズしたことを話す年配の男性もいた。',

        'グループの最初の仕事は、建物を買うのに十分なお金を集めることだった。1 人の裕福な投資家を探すかわりに、彼らは地域の人々に株を売ることに決めた。1 株は'
        '50 ポンドで、株を買った人は誰でも映画館の共同所有者になる。6 か月の間に、1500 人近くが株を買った。遠くに住んでいながら、子どものころの思い出で町と'
        'つながっている人もいた。',

        '映画館を運営することは、買うことより難しいとわかった。映写機は古く、屋根は雨もりし、ボランティアの誰も映画の仕事の経験がなかった。退職した技術者が週末を'
        '使って暖房設備をつくり直し、学生のグループは新しいウェブサイトをデザインして映画館の SNS を担当した。地元の店はペンキやじゅうたん、それに近くの都市で改装'
        'された劇場から取り外された座席を寄付した。',

        'ボランティアたちはまた、人々が家で見られるのと同じ映画を上映しても、動画配信サービスにはかなわないと気づいた。そのかわりに、彼らはリージェントを人々が集まる'
        '場所として生まれ変わらせた。毎月の上映後の話し合いの夕べ、赤ちゃん連れの親のための映画の夜、そしてふつうの映画館を刺激が強すぎると感じる人のために、音と'
        '照明をやわらげた静かな午後の上映を始めた。今では学校が、授業に関係のある映画を見せるためにクラスを連れてくる。',

        '閉館しかけてから 5 年後、リージェントは週 7 日開いていて、少しの利益を出しており、それは修理と若い人向けのチケットの値下げに使われている。60 人ほどの'
        'ボランティアが定期的にそこで働き、チケットを売り、ポップコーンをつくり、入り口で客を出迎えている。オコンジョは、その多くが映画館を手伝うために来たのに、'
        'そこでできた友情のために残ったのだと言う。一人暮らしの年配のボランティアの中には、リージェントでの当番が 1 週間の主な人づきあいの場になっている人もいて、'
        '新しい生きがいができたと言う人も何人かいる。',

        'その後、ほかの町がグループに助言を求めてきたが、オコンジョはいつも同じ答えをする。建物を救えるのは、人々がそれを自分たちのものだと感じる場合だけだ、と。'
        '「私たちは映画館を救っただけではありません。町に居間を与えたのです」と彼女は言う。',
    ],
    'vocab': [
        ('sign of the times', '時代の流れを示すもの'), ('streaming service', '動画配信サービス'), ('afford to do', '～する余裕がある'),
        ('accountant', '会計士'), ('flat', '集合住宅の一戸'), ('investor', '投資家'), ('share', '株'), ('projection', '映写'),
        ('leak', '雨もりする'), ('renovate', '改装する'), ('overwhelming', '圧倒するような、刺激が強すぎる'), ('profit', '利益'),
    ],
}
