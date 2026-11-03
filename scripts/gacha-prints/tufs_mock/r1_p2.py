# -*- coding: utf-8 -*-
# 第1回 大問2 本文（書き下ろし・村と人物は架空）
P2 = {
    'points': 30,
    'lead': '次の英文は、山あいの村に残る手すきの紙づくりについての記事である。よく読んで、後の設問に答えよ。',
    'title': 'A Village Keeps Its Paper Alive',
    'passage': [
        "High in the hills above the river town of Sorimachi, the village of Kitaura has made paper by hand for more than four hundred "
        "years. Fibers from the bark of a local shrub are boiled, beaten, and spread across bamboo screens, then left to dry in the cold "
        "winter air. A century ago, nearly every family in the village had a workshop. Since then, the number of workshops has {b1} "
        "sharply, and today only three remain.",

        "One of them belongs to Michiko Arai, who is seventy-one. She learned the craft as a teenager, using skills {b2} from her "
        "grandmother, and she still begins work at five o'clock every morning. \"People think that paper is just paper,\" she says, "
        "\"but the quality {b3} on dozens of small decisions: how long the bark is soaked, how cold the water is, how gently you lift "
        "the screen.\" A sheet that looks perfect when it is wet can tear or wrinkle as it dries, and only years of practice teach a "
        "maker to recognize the difference by touch.",

        "For most of the twentieth century, it seemed unlikely that the craft would {b4}. Machine-made paper was cheaper and more "
        "uniform, and young people left the village to look for work in the cities. Arai remembers a winter in the 1980s when she was "
        "the only person in Kitaura still making paper. \"I kept going because I could not imagine stopping,\" she says. \"But I did not "
        "expect anyone to follow me.\"",

        "The situation began to change about fifteen years ago, when a small group of residents succeeded in {b5} attention from outside "
        "the region. They invited artists, bookbinders, and restorers of old documents to visit the workshops, and they discovered that "
        "these professionals valued exactly what machines could not provide. Handmade paper from Kitaura is unusually strong and lasts "
        "for centuries, which makes it ideal for repairing damaged books and scrolls in museums. Orders began to arrive from libraries "
        "in several countries.",

        "Arai has since {b6} twelve apprentices, most of them in their twenties and thirties. Some came from nearby towns; others had "
        "never lived in the countryside before. Training is slow. An apprentice may spend a whole year doing nothing but preparing bark "
        "before being allowed to form a single sheet. Several have left, but five have stayed and opened workshops of their own. Last "
        "year, the village's papermaking was officially {b7} as an important local tradition, which brought a modest grant from the "
        "prefecture.",

        "The new makers have also had to think carefully about money. Handmade paper takes many hours to produce, and it cannot compete "
        "with factory paper on price. To {b8} costs, the workshops now share equipment and buy bark together from farmers in the "
        "valley. They have also found new customers by {b9} visitors to try the craft themselves. In weekend classes, tourists make "
        "a few sheets of their own and take them home as souvenirs, and many go on to order larger quantities later.",

        "Two years ago, the younger makers {b10} an online shop, which now accounts for about a third of their sales. Arai admits that "
        "she does not fully understand how it works. \"They show me the screen and tell me that someone in another country has bought our "
        "paper,\" she laughs. \"To me, that is still a kind of magic.\" What matters most to her, though, is not the shop but the sound "
        "she hears early in the morning: water splashing in the workshops next door, where people she has taught are already at work.",
    ],
    'qlead': '空所 (1)〜(10) を補うのに最適な語を下の語群から選べ。語形の変化が必要なものは変化させた形で解答用紙に記入すること。'
             '語群の各語は一度ずつしか使えず、1 語は余る。',
    'bank': ['abandon', 'attract', 'decline', 'depend', 'encourage', 'inherit', 'launch', 'recognize', 'reduce', 'survive', 'train'],
    'blanks': [
        {'n': 1, 'base': 'decline', 'answer': 'declined',
         'expl': 'has の後なので現在完了。the number of ～ has declined「～の数が減った」。sharply「急激に」ともよく結びつく。'},
        {'n': 2, 'base': 'inherit', 'answer': 'inherited',
         'expl': 'skills inherited from her grandmother「祖母から受け継いだ技術」。名詞を後ろから修飾する過去分詞（受け身）。'},
        {'n': 3, 'base': 'depend', 'answer': 'depends',
         'expl': '主語は the quality（単数）で、現在の一般的なことを述べているので 3 人称単数の depends。depend on ～「～によって決まる」。'},
        {'n': 4, 'base': 'survive', 'answer': 'survive',
         'expl': 'would の後なので原形。the craft would survive「その技が生き残るだろう」。後の文の「若者が村を出た」と対になる。'},
        {'n': 5, 'base': 'attract', 'answer': 'attracting',
         'expl': 'succeed in ～ing「～することに成功する」。前置詞 in の後なので動名詞。attract attention「注目を集める」。'},
        {'n': 6, 'base': 'train', 'answer': 'trained',
         'expl': 'has since の後なので現在完了。目的語が twelve apprentices「12 人の弟子」で、次の文の Training is slow. とつながる。'},
        {'n': 7, 'base': 'recognize', 'answer': 'recognized',
         'expl': 'was officially recognized as ～「正式に～として認められた」。受け身なので過去分詞。助成金がもらえた理由になる。'},
        {'n': 8, 'base': 'reduce', 'answer': 'reduce',
         'expl': 'To の後なので原形（目的を表す不定詞）。reduce costs「費用を減らす」。設備を共有し、まとめて買う工夫の目的。'},
        {'n': 9, 'base': 'encourage', 'answer': 'encouraging',
         'expl': 'by ～ing「～することによって」。encourage ＋ 人 ＋ to do「人に～するよううながす」。'},
        {'n': 10, 'base': 'launch', 'answer': 'launched',
         'expl': 'Two years ago があるので過去形。launch an online shop「ネットショップを立ち上げる」。'},
    ],
    'translation': [
        'ソリマチという川沿いの町の上手、高い丘の上にあるキタウラ村では、400 年以上にわたって手で紙をすいてきた。地元の低木の樹皮からとった繊維を'
        '煮て、たたき、竹のすだれの上に広げ、それから冬の冷たい空気の中で乾かす。1 世紀前には、村のほとんどすべての家に工房があった。それ以来、'
        '工房の数は急激に減り、今では 3 軒しか残っていない。',

        'そのうちの 1 軒は、71 歳のアライ・ミチコさんのものである。彼女は 10 代のころに祖母から受け継いだ技術を使ってこの技を覚え、今でも毎朝 5 時に'
        '仕事を始める。「紙はただの紙だと人は思っています。でも品質は、何十もの小さな判断で決まるのです。樹皮をどれくらい水にひたすか、水がどれくらい'
        '冷たいか、すだれをどれくらいそっと持ち上げるか」と彼女は言う。ぬれているときには完璧に見える紙も、乾くうちに破れたりしわになったりすることがあり、'
        '何年もの経験を積んではじめて、すき手はその違いを手ざわりで見分けられるようになる。',

        '20 世紀の大半の間、この技が生き残りそうには思えなかった。機械でつくった紙のほうが安くて品質もそろっていたし、若い人々は仕事を探して村を出て'
        '都市へ行った。アライさんは、1980 年代のある冬、キタウラでまだ紙をすいていたのが自分だけだったことを覚えている。「やめることが想像できなかった'
        'から続けたのです。でも、あとに続く人がいるとは思っていませんでした」と彼女は言う。',

        '状況が変わり始めたのは 15 年ほど前、住民の小さなグループが地域の外から注目を集めることに成功したときだった。彼らは芸術家や製本職人、古い文書の'
        '修復家を工房に招き、こうした専門家たちが、まさに機械には与えられないものを高く評価していることに気づいた。キタウラの手すき紙は並はずれて丈夫で'
        '何世紀ももつので、博物館の傷んだ本や巻物を修理するのにうってつけなのだ。いくつかの国の図書館から注文が届き始めた。',

        'アライさんはそれ以来、12 人の弟子を育ててきた。その多くは 20 代から 30 代である。近くの町から来た人もいれば、それまで田舎に住んだことのない人も'
        'いた。修業はゆっくりと進む。弟子は 1 枚の紙をすくことを許されるまでに、まる 1 年、樹皮の下ごしらえだけをすることもある。何人かはやめていったが、'
        '5 人は残り、自分の工房を開いた。昨年、村の紙づくりは地域の大切な伝統として正式に認められ、県からささやかな助成金がもたらされた。',

        '新しいすき手たちは、お金のこともよく考えなければならなかった。手すき紙はつくるのに長い時間がかかり、値段では工場の紙にかなわない。費用を減らすため、'
        '工房は今では設備を共有し、谷の農家からまとめて樹皮を買っている。また、訪れた人に自分でこの技を体験してみるようすすめることで、新しい客を'
        '見つけてもいる。週末の教室では、観光客が自分で何枚か紙をすいておみやげとして持ち帰り、その多くがのちにもっと多くの量を注文してくる。',

        '2 年前、若いすき手たちはネットショップを立ち上げ、それが今では売り上げの約 3 分の 1 を占めている。アライさんは、そのしくみがよくわからないことを'
        '認めている。「画面を見せて、外国の誰かがうちの紙を買ってくれたと教えてくれるのです。私にとっては、それは今でも一種の魔法です」と彼女は笑う。'
        'しかし彼女にとっていちばん大切なのは、ネットショップではなく、朝早くに聞こえてくる音である。それは、彼女が教えた人たちがもう仕事を始めている'
        '隣の工房で、水がはねる音なのだ。',
    ],
    'vocab': [
        ('fiber', '繊維'), ('bark', '樹皮'), ('shrub', '低木'), ('screen', 'すだれ、（紙すきの）簀'), ('craft', '技、工芸'),
        ('soak', '水にひたす'), ('wrinkle', 'しわになる'), ('uniform', '均一な'), ('bookbinder', '製本職人'),
        ('restorer', '修復家'), ('scroll', '巻物'), ('apprentice', '弟子、見習い'), ('grant', '助成金'),
        ('souvenir', 'おみやげ'), ('account for ～', '～を占める'),
    ],
}
