# -*- coding: utf-8 -*-
# 第1回 大問3 英文＋英語で答える問題（書き下ろし）。____ は解答者が埋める空所。
PASSAGE = [
 "In many cities across the globe, public drinking fountains were once a familiar sight. Built in parks, squares, and railway stations, they offered clean water to anyone who was thirsty, free of charge. Over the past several decades, however, a large number of them have disappeared. Some were removed because they were expensive to maintain, and others were simply left broken until they were taken away. Meanwhile, bottled water became widely available in shops and vending machines, and many people came to assume that drinking water in public was something one paid for.",
 "Concerns about hygiene also played a part. Many people grew uneasy about putting their mouths close to a tap that strangers had used, and fountains that were not cleaned regularly did little to change their minds. Once a fountain looked dirty, people stopped using it, and once it was rarely used, local authorities had even less reason to repair it. Thus a useful public service slowly faded from many streets without much discussion.",
 "Recently, though, public fountains have begun to make a comeback. One reason is the growing concern about plastic waste. Every bottle of water that is bought, emptied, and thrown away adds to a problem that cities and oceans are struggling to cope with. If people can refill their own bottles for free, they have less need to buy new ones. Another reason is health. As summers grow hotter in many regions, easy access to water can help prevent heatstroke, especially among children, older people, and those who work outdoors. For people who cannot easily afford to buy drinks, a free fountain may be the only convenient source of water while they are away from home.",
 "Modern fountains are also designed differently. Many now include a separate tap for filling bottles, so users need not touch the spout with their mouths. Some towns have begun publishing maps that show where fountains can be found, and certain shops and cafés have agreed to refill visitors’ bottles without asking them to buy anything.",
 "Not everyone is convinced. Installing and cleaning fountains costs money, and some people worry that they will be damaged or misused. Shops that sell drinks may also see them as unfair competition. Whether public fountains will become common again may depend on whether residents see free water as a basic public service, like streetlights or benches, or as a product that should be bought and sold.",
]

QA = {'points': 8, 'lead': 'Fill in the blanks to finish the sentence below.',
      'frame': 'The first two paragraphs suggest that many public fountains disappeared partly because ____, and partly because people became worried about ____.',
      'answers': ['they cost too much to keep in good condition / people began to think of drinking water outside as something to buy ／ whether the fountains were clean and safe to use',
                  'cities found them too costly to look after ／ sharing a tap that unknown people had put their mouths near'],
      'criteria': [('1つ目の空所：維持費が高い（または「水は買うものだ」という意識の広がり）を自分の英語で書く', 4),
                   ('2つ目の空所：衛生面（他人が使った蛇口・清掃不足）への不安を書く', 3), ('文法・語法（about の後は名詞・動名詞・wh節）', 1)],
      'explain': ['第1段落 “Some were removed because they were expensive to maintain” と，第2段落 “Concerns about hygiene also played a part” が根拠。',
                  '本文の文をそのまま写すことは指示で禁じられている。expensive to maintain → cost too much to keep in good condition のように言い換える。',
                  '2つ目の空所は worried about の後なので，名詞句・動名詞句・whether 節などで書く。‘they were dirty’ のような節を直接置くと文法的に誤り。']}

QB = {'points': 8, 'lead': 'Fill in the blanks to finish the sentence below.',
      'frame': 'The third paragraph explains that supporters of public fountains believe that they can reduce ____ and protect people’s health by ____.',
      'answers': ['the number of plastic bottles that are thrown away ／ making it easy to drink water and avoid heatstroke on hot days',
                  'the amount of plastic waste people produce ／ giving everyone, including people who cannot pay for drinks, a place to get water'],
      'criteria': [('1つ目の空所：プラスチック（ペットボトル）のごみの量', 4), ('2つ目の空所：水を手軽に飲めるようにして熱中症を防ぐ（など）', 3), ('文法・語法（by の後は動名詞）', 1)],
      'explain': ['第3段落 “One reason is the growing concern about plastic waste.” と “easy access to water can help prevent heatstroke” が根拠。',
                  'by の後は動名詞（making / giving / allowing など）で始める。‘by people can drink water’ は誤り。',
                  '“children, older people, and those who work outdoors” を挙げてもよいが，それだけでは「どう健康を守るか」になっていないので減点。']}

QC = {'points': 26,
      'stem': 'Some people say that their city should install more public drinking fountains, even if this means a small rise in local taxes. Do you agree? Give your view and the reasons for it, using between 70 and 100 words.',
      'criteria': [('主張が明確（賛成・反対の立場を最初に示し，最後まで一貫）', 7), ('理由・具体例が適切で説得力がある（本文の論点を自分の言葉で使ってよい）', 9),
                   ('構成（主張→理由→まとめ，つなぎの語）', 4), ('語彙・文法の正確さ（70〜100語を守る）', 6)],
      'models': [('賛成', 'I agree that my city should build more public drinking fountains, even if taxes rise slightly. First, free water would reduce the number of plastic bottles that end up as waste in our rivers and parks. Second, summers here are becoming hotter, and children and elderly people need a quick way to drink water when they are outside. A small tax increase shared by everyone seems a fair price for such benefits. Like streetlights, clean water in public places should be treated as a basic service.'),
                 ('反対', 'I do not agree with raising taxes to install more fountains. Most people in my city already carry their own bottles, and many shops and stations have places where water can be bought cheaply. Fountains also need regular cleaning, and if the city cannot afford proper maintenance, they will soon look dirty and nobody will use them. I think the money would be better spent on improving services that many residents use every day, such as buses or libraries. Fountains are useful, but they should not be a priority.')],
      'tips': ['最初の1文で立場（agree / disagree）をはっきり書く。‘I think there are good points and bad points.’ だけで終わると主張が不明確で大きく減点。',
               '本文の論点（plastic waste, heatstroke, cost of cleaning）を使ってよいが，本文の文をそのまま写さない。',
               '設問の ‘a small rise in local taxes’ という条件にも触れると，問いに正面から答えていることが伝わる。',
               '語数は70〜100語。少なすぎても多すぎても減点。数字（10%など）や調査結果を作り話で書かないこと。']}

TRANSLATION = [
 '世界の多くの都市で，公共の水飲み場はかつてなじみのある光景だった。公園や広場，鉄道の駅に設けられ，のどが渇いた人なら誰にでも清潔な水を無料で提供していた。しかし過去数十年の間に，その多くが姿を消した。維持費が高いという理由で撤去されたものもあれば，壊れたまま放置され，やがて取り除かれたものもあった。同時に，ペットボトルの水が店や自動販売機で広く手に入るようになり，多くの人が，外で飲む水はお金を払うものだと思い込むようになった。',
 '衛生面の懸念も一因だった。見知らぬ人が使った蛇口に口を近づけることに不安を覚える人が多くなり，定期的に清掃されない水飲み場は，そうした人々の考えを変える役にはほとんど立たなかった。水飲み場が汚く見えると人々は使わなくなり，めったに使われなくなると，自治体にはそれを修理する理由がさらになくなった。こうして，役に立つ公共サービスが，たいした議論もないまま多くの通りから少しずつ消えていった。',
 'ところが最近，公共の水飲み場が復活し始めている。理由の一つは，プラスチックごみへの関心の高まりである。買われ，飲み干され，捨てられる水のボトル一本一本が，都市や海が対処に苦労している問題を大きくしている。自分のボトルに無料で水を補充できれば，新しいボトルを買う必要は少なくなる。もう一つの理由は健康である。多くの地域で夏が暑くなるにつれ，水を手軽に飲めることは，特に子ども，高齢者，屋外で働く人々の熱中症を防ぐ助けになりうる。飲み物を買う余裕があまりない人々にとって，無料の水飲み場は，外出中に水を得られる唯一の便利な場所かもしれない。',
 '現代の水飲み場は設計も異なっている。今では多くがボトルに水を入れるための別の蛇口を備えているので，利用者は飲み口に口をつける必要がない。水飲み場の場所を示す地図を発行し始めた町もあり，一部の店やカフェは，何も買うよう求めずに来訪者のボトルに水を入れることに同意している。',
 '誰もが納得しているわけではない。水飲み場の設置と清掃には費用がかかり，壊されたり不適切に使われたりするのではないかと心配する人もいる。飲み物を売る店は，水飲み場を不公平な競争相手とみなすかもしれない。公共の水飲み場が再び一般的になるかどうかは，住民が無料の水を，街灯やベンチのような基本的な公共サービスとみなすのか，それとも売り買いされるべき商品とみなすのかにかかっているのかもしれない。',
]

VOCAB = [('free of charge', '無料で'), ('maintain', '維持する'), ('vending machine', '自動販売機'), ('hygiene', '衛生'),
         ('uneasy', '不安な'), ('local authorities', '自治体'), ('fade', '次第に消える'), ('make a comeback', '復活する'),
         ('cope with ～', '〜に対処する'), ('refill', '詰め替える・補充する'), ('heatstroke', '熱中症'), ('afford to do', '〜する余裕がある'),
         ('spout', '飲み口・注ぎ口'), ('misuse', '誤用する・悪用する'), ('competition', '競争（相手）'), ('resident', '住民')]

PART = {'passage': PASSAGE, 'qA': QA, 'qB': QB, 'qC': QC, 'translation': TRANSLATION, 'vocab': VOCAB, 'notes': []}
