# -*- coding: utf-8 -*-
# 第2回 大問2 本文（書き下ろし・町と人物は架空）
P2 = {
    'points': 30,
    'lead': '次の英文は、ある港町で古い船を修理する造船所についての記事である。よく読んで、後の設問に答えよ。',
    'title': 'Keeping Wooden Boats Afloat',
    'passage': [
        "On the edge of the harbor in the fishing town of Brackwater, a long wooden shed smells of tar, pine, and sea salt. Inside, three "
        "boatbuilders are bent over the frame of a fishing boat that is nearly a hundred years old. Most of its planks have rotted, and the "
        "owner was told by several insurance companies that the boat was not worth {b1}. He brought it here instead, to one of the last "
        "yards in the country that still repairs wooden boats by hand.",

        "The yard was founded in 1921 by the grandfather of its current owner, Tomas Keel. In those days, almost every boat in the harbor "
        "was made of wood, and a skilled builder could {b2} a small fishing boat in a single winter. After the 1960s, however, boats made "
        "of fiberglass and steel became common. They were cheaper to build and needed less care, and orders for wooden boats {b3} to almost "
        "nothing. \"My father spent the last twenty years of his career mostly painting other people's fiberglass,\" Keel says.",

        "When Keel took over the yard, he expected to close it within a few years. What {b4} his mind was a visit from a group of students "
        "from a maritime museum. They wanted to learn how wooden hulls had been built, and they were surprised to discover that much of "
        "this knowledge had never been written down. It {b5} only in the hands and memories of a few elderly craftsmen. Keel realized that "
        "if the yard closed, the skills would disappear with it.",

        "Today, the yard {b6} about half its income from restoring historic vessels for museums and private owners. The rest comes from "
        "teaching. Each spring, it runs a twelve-week course in which participants build a small rowing boat from start to finish. The course "
        "is always full, and people have traveled from as far away as Canada and New Zealand to take part. Many of them have no plans to "
        "become professional builders. They simply want to {b7} something solid with their own hands. One recent participant, a software engineer, said that after years "
        "of working on screens, it was a relief to make a mistake he could actually see and fix.",

        "Repairing an old boat requires patience. A builder cannot simply {b8} a damaged plank with a new one of the same size. Each piece "
        "of wood bends differently, and it must be shaped to fit the curve of the hull exactly. Keel prefers to use oak and larch that are "
        "{b9} locally, partly because they suit the local sea conditions and partly because buying from nearby forests reduces the need "
        "for transport. A single repair can take months, and Keel tells every customer at the start that the work cannot be hurried.",

        "Keel admits that the business will never make him rich. But he believes that the yard does something more important than earn "
        "money. \"Every boat that leaves here carries the work of my grandfather, my father, and the people we have taught,\" he says. Last "
        "month, the hundred-year-old fishing boat was {b10} into the water again for the first time in a decade. Its owner stood on the "
        "deck and waved as it floated out into the harbor.",
    ],
    'qlead': '空所 (1)〜(10) を補うのに最適な語を下の語群から選べ。語形の変化が必要なものは変化させた形で解答用紙に記入すること。'
             '語群の各語は一度ずつしか使えず、1 語は余る。',
    'bank': ['build', 'change', 'create', 'earn', 'exist', 'fall', 'grow', 'launch', 'protect', 'repair', 'replace'],
    'blanks': [
        {'n': 1, 'base': 'repair', 'answer': 'repairing',
         'expl': 'be worth ～ing「～する価値がある」。worth の後は動名詞。保険会社は「修理する価値がない」と言った。'},
        {'n': 2, 'base': 'build', 'answer': 'build',
         'expl': 'could の後なので原形。build a boat「船をつくる」。冬の間に 1 隻つくれた、という昔の様子。'},
        {'n': 3, 'base': 'fall', 'answer': 'fell', 'irregular': True,
         'expl': '過去の話なので過去形。fall to almost nothing「ほとんどゼロに落ちこむ」。fall の過去形は不規則変化の fell。'},
        {'n': 4, 'base': 'change', 'answer': 'changed',
         'expl': 'What changed his mind was ～「彼の考えを変えたのは～だった」。過去の出来事なので過去形。'},
        {'n': 5, 'base': 'exist', 'answer': 'existed',
         'expl': 'It existed only in ～「それは～の中にしか存在しなかった」。主語の It は「書きとめられていない知識」。過去形。'},
        {'n': 6, 'base': 'earn', 'answer': 'earns',
         'expl': 'Today があり主語が the yard（単数）なので 3 人称単数現在。earn income「収入を得る」。'},
        {'n': 7, 'base': 'create', 'answer': 'create',
         'expl': 'want to の後なので原形。create something solid「しっかりしたものを生み出す」。'},
        {'n': 8, 'base': 'replace', 'answer': 'replace',
         'expl': 'cannot simply の後なので原形。replace A with B「A を B と取り替える」。'},
        {'n': 9, 'base': 'grow', 'answer': 'grown', 'irregular': True,
         'expl': 'that are grown locally「地元で育てられた」。受け身なので過去分詞。grow の過去分詞は不規則変化の grown。'},
        {'n': 10, 'base': 'launch', 'answer': 'launched',
         'expl': 'was launched into the water「水に進水させられた」。launch は「船を進水させる」の意味で、受け身の過去分詞。'},
    ],
    'translation': [
        '漁師町ブラックウォーターの港のはずれにある細長い木造の小屋は、タールと松と潮のにおいがする。中では 3 人の船大工が、つくられてから 100 年近くたつ漁船の'
        '骨組みの上にかがみこんでいる。船板のほとんどは腐っていて、持ち主はいくつもの保険会社から、その船は修理する価値がないと言われた。かわりに彼は、木造船を'
        '今も手作業で修理している国内最後の造船所の一つであるここへ、船を持ちこんだのだ。',

        'この造船所は、1921 年に現在の持ち主トマス・キールの祖父によって設立された。当時、港の船はほとんどすべて木でつくられていて、腕のよい船大工なら、ひと冬で'
        '小さな漁船を 1 隻つくることができた。しかし 1960 年代以降、ガラス繊維や鋼鉄でできた船が一般的になった。それらはつくるのが安く、手入れもあまり必要なかった'
        'ので、木造船の注文はほとんどゼロにまで落ちこんだ。「父は仕事人生の最後の 20 年間、ほとんどよその人のガラス繊維の船にペンキを塗っていました」とキールは言う。',

        'キールが造船所を継いだとき、彼は数年のうちに閉めるつもりだった。彼の考えを変えたのは、海事博物館から来た学生のグループの訪問だった。彼らは木の船体が'
        'どのようにつくられていたかを学びたいと思っていたが、その知識の多くが一度も書きとめられていないことを知って驚いた。それは、数人の年配の職人の手と記憶の中に'
        'しか存在していなかったのだ。キールは、造船所が閉まれば、その技術もいっしょに消えてしまうと気づいた。',

        '今日、造船所は収入の約半分を、博物館や個人の持ち主のために歴史的な船を修復することで得ている。残りは教えることから得ている。毎年春に、参加者が小さな'
        '手こぎボートを最初から最後までつくる 12 週間の講座を開いている。講座はいつも満員で、カナダやニュージーランドほど遠くから参加しに来た人もいる。その多くは'
        'プロの船大工になるつもりはない。ただ、自分の手でしっかりしたものを生み出したいのである。最近の参加者の一人であるソフトウェア技術者は、何年も画面に向かって働いてきたあとで、'
        '実際に目で見て直せる失敗をするのはほっとすることだったと言った。',

        '古い船の修理には忍耐が必要だ。船大工は、傷んだ船板を同じ大きさの新しい板とただ取り替えればよいというわけにはいかない。木はそれぞれ曲がり方が違い、'
        '船体の曲線にぴったり合うように形を整えなければならない。キールは地元で育ったオークやカラマツを使うほうを好む。地元の海の状態に合っているからでもあり、'
        '近くの森から買えば運ぶ必要が減るからでもある。1 回の修理に何か月もかかることがあり、キールはどの客にも最初に、作業は急げないと伝えている。',

        'キールは、この商売で金持ちになることは決してないと認めている。しかし彼は、造船所がお金をかせぐよりも大切なことをしていると信じている。「ここを出ていく'
        '船はどれも、祖父や父や、私たちが教えた人たちの仕事を乗せているのです」と彼は言う。先月、その 100 年前の漁船は、10 年ぶりに再び水に進水した。持ち主は'
        '甲板に立ち、船が港へとただよい出ていくとき、手を振っていた。',
    ],
    'vocab': [
        ('shed', '小屋'), ('tar', 'タール'), ('plank', '板、船板'), ('rot', '腐る'), ('yard', '造船所（boatyard）'),
        ('fiberglass', 'ガラス繊維'), ('take over', '引き継ぐ'), ('maritime', '海事の'), ('hull', '船体'),
        ('craftsman', '職人'), ('restore', '修復する'), ('vessel', '船'), ('larch', 'カラマツ'), ('deck', '甲板'),
    ],
}
