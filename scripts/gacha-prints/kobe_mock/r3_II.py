# -*- coding: utf-8 -*-
# 第3回 大問II（科学：発酵と微生物）
PART = {'roman': 'II',
 'points': 35,
 'intro': '次の文章は，発酵と微生物を論じた英文である。よく読んで，後の問1〜5に答えなさい。',
 'passage': ['Long before anyone knew that microorganisms existed, people around the world were putting them '
             'to work. Bread rose, milk thickened into yogurt, cabbage turned sour, and grape juice became '
             'wine. These changes were often regarded as mysterious, and the knowledge of how to bring them '
             'about was passed down from one generation to the next as a craft rather than a science. Only '
             'in the nineteenth century did researchers demonstrate that such transformations, which we now '
             'call fermentation, are carried out by living things far too small to be seen with the naked '
             'eye.',
             'At its simplest, fermentation is a way in which certain microorganisms obtain energy from '
             'sugars without needing oxygen. Yeast*, a single-celled fungus, breaks sugar down into alcohol '
             'and carbon dioxide. In bread, the alcohol largely evaporates during baking, while the bubbles '
             'of carbon dioxide are trapped in the dough and make it rise. Lactic acid bacteria*, by '
             'contrast, convert sugar mainly into lactic acid. This acid is what gives yogurt and pickles '
             'their sharp taste, and it also changes the texture of food, causing the proteins in milk, for '
             'example, to thicken.',
             'For most of human history, however, the greatest value of fermentation lay not in flavor but '
             'in preservation. Before refrigeration, keeping food from spoiling was a constant struggle. '
             'Fermentation offered an ingenious solution. As useful microorganisms multiply, they produce '
             'acid or alcohol and use up the available sugars, creating conditions in which most of the '
             'microbes that cause food to rot cannot survive. {u1|In effect, people were enlisting one group '
             'of microorganisms to defend their food against another.} Milk that would have gone bad in a '
             'day or two could be kept for weeks as cheese, and vegetables harvested in autumn could be '
             'eaten through the winter.',
             'Fermentation can also make food more nutritious and easier to digest. Some microorganisms '
             'break down substances that the human body has difficulty processing, and some produce vitamins '
             'that were not present in the original ingredients. Soybeans, for instance, are hard to digest '
             'when eaten raw, but fermentation transforms them into foods such as miso and soy sauce, which '
             'have been ( A ) parts of Japanese cooking for centuries. In this way, a process that began as '
             'a means of storage also shaped the cuisines and diets of entire cultures.',
             'In recent years, fermented foods have attracted renewed interest, partly because of research '
             'into the vast community of microorganisms that lives in the human gut*. Scientists have '
             'learned that these microbes play a part in digestion and may influence other aspects of health '
             'as well. It is tempting to conclude that eating more fermented food will automatically improve '
             'this inner community, and advertisements often make such claims. ( B ), the evidence is more '
             'complicated. Many of the microorganisms in fermented foods do not survive the journey through '
             'the stomach, and the effects of those that do appear to vary greatly from person to person. '
             '{u2|For these reasons, many researchers urge caution about the health claims attached to '
             'fermented products}.',
             'Fermentation is not limited to the kitchen. The same basic processes are now used on an '
             'industrial scale to manufacture medicines, vitamins, and other useful substances. '
             'Microorganisms can be grown in huge steel tanks and, in some cases, altered so that they '
             'produce materials that they would not make in nature. ( C ) a craft once practiced in '
             'farmhouses and small workshops has become one of the foundations of modern biotechnology*.',
             'Perhaps the most remarkable thing about fermentation is the partnership it represents. The '
             'microorganisms involved are not tools that we invented; they are living things with their own '
             'needs, which we have learned to {ua|accommodate}. A baker who keeps a starter dough alive for '
             'years, feeding it flour and water, is in a sense tending a tiny ecosystem. Our ancestors could '
             'not see their invisible helpers, but they understood, through long experience, how to create '
             'conditions in which those helpers would thrive. That understanding, refined over thousands of '
             'years, is ( D ) the reason why fermented foods remain part of our daily lives, and it reminds '
             'us that some of humanity’s most {ub|enduring} achievements depend on cooperation with '
             'organisms we cannot even see.'],
 'notes': [('yeast', '酵母'), ('lactic acid bacteria', '乳酸菌'), ('gut', '腸'), ('biotechnology', '生物工学')],
 'questions': [{'no': 1,
                'points': 8,
                'kind': 'trans',
                'stem': '下線部(1)を和訳しなさい。',
                'answer': '事実上，人々はある一群の微生物の協力を得て，別の微生物から自分たちの食べ物を守らせていたのである。',
                'alts': ['実質的には，人々はある種類の微生物を味方につけて，ほかの種類の微生物から食料を守っていたのだ。'],
                'criteria': [('in effect：「事実上・実質的には」', 2),
                             ('enlist A to do：「Aの協力を得て〜させる（Aを味方につけて〜させる）」', 3),
                             ('one group of microorganisms … another：「ある一群の微生物」と「別の（一群の）微生物」の対比', 2),
                             ('defend A against B：「AをBから守る」', 1)],
                'explain': ['enlist はもともと「（兵として）入隊させる・協力を求める」。enlist A to do で「Aの協力を得て〜させる」。',
                            'another は another group of microorganisms の省略で，直前の文の「食べ物を腐らせる微生物」を指す。',
                            '役に立つ微生物（乳酸菌や酵母）を味方にして，腐敗を起こす微生物から食べ物を守る，という比喩が伝わればよい。']},
               {'no': 2,
                'points': 8,
                'kind': 'blanks',
                'stem': '空所( A )〜( D )を補うのに最もふさわしい表現を，それぞれの選択肢(あ)〜(え)から一つ選び，記号で答えなさい。',
                'items': [{'label': 'A',
                           'choices': ['harmful', 'temporary', 'essential', 'foreign'],
                           'answer': 2,
                           'why': '味噌や醤油は「何世紀にもわたって日本料理に欠かせない部分」。for centuries と合うのは '
                                  'essential。temporary（一時的な）は for centuries と矛盾。foreign / harmful '
                                  'は直後の「一つの文化全体の料理を形作った」と合わない。'},
                          {'label': 'B',
                           'choices': ['In reality', 'For example', 'As a result', 'In addition'],
                           'answer': 0,
                           'why': '「発酵食品を食べれば自動的に腸内の微生物がよくなると結論づけたくなり，広告もそう主張する。（しかし）実際には，証拠はもっと複雑だ」。期待と現実の対比なので '
                                  'In reality。As a result（結果として）・For example（例えば）・In '
                                  'addition（さらに）は前文と対立する内容をつなげない。'},
                          {'label': 'C',
                           'choices': ['Even so', 'By contrast', 'In this way', 'By mistake'],
                           'answer': 2,
                           'why': '前の文までの「工業規模での利用」をまとめて，「このようにして，かつての手仕事が現代の生物工学の基礎の一つになった」。By '
                                  'contrast（対照的に）・Even so（それでも）は対立・譲歩がないので不可。By mistake（誤って）は内容と合わない。'},
                          {'label': 'D',
                           'choices': ['rarely', 'never', 'hardly', 'ultimately'],
                           'answer': 3,
                           'why': '「何千年もかけて磨かれたその理解こそが，発酵食品が今も日々の生活の一部である究極の理由だ」。hardly / never / rarely '
                                  'は否定の意味になり，「その理解のおかげで発酵食品が残っている」という段落の主張と逆になる。'}]},
               {'no': 3,
                'points': 9,
                'kind': 'ja_limit',
                'limit': 70,
                'stem': '下線部(2)のように多くの研究者が慎重な姿勢を求めているのはなぜか。その理由を，本文の内容に即して70字以内でまとめなさい（句読点も1字と数える）。',
                'answer': '発酵食品の微生物の多くは胃を通過する間に死に，生き残ったものの効果も人によって大きく異なるため，食べれば必ず健康によいとは言えないから。',
                'alts': ['発酵食品に含まれる微生物の多くは胃を通り抜けられず，生き残った微生物の影響も人ごとに大きく違うので，健康効果を一律に保証できないから。'],
                'criteria': [('発酵食品の微生物の多くは胃を通過する間に生き残れない', 3),
                             ('生き残った微生物の効果も人によって大きく異なる', 3),
                             ('（したがって）食べれば自動的に健康によくなるとは言えない', 2),
                             ('理由の文として結ばれている（〜から・〜ため）', 1)],
                'explain': ['For these reasons の these reasons は直前の文の2点。“Many of the microorganisms in '
                            'fermented foods do not survive the journey through the stomach” と “the effects '
                            'of those that do appear to vary greatly from person to person”。',
                            'この2点から「発酵食品を食べれば自動的に腸内の微生物がよくなる」とは言えず，広告の健康効果の主張に慎重になるべきだ，という論理。']},
               {'no': 4,
                'points': 6,
                'kind': 'tf2',
                'stem': '本文の内容に一致するものを，選択肢(あ)〜(か)から二つ選び，記号で答えなさい。',
                'choices': ['When bread is baked, carbon dioxide produced by yeast helps the dough rise.',
                            'Lactic acid bacteria turn sugar mainly into alcohol and carbon dioxide.',
                            'Microorganisms used in industry cannot be changed to produce new substances.',
                            'Fermentation helped people keep food for long periods before refrigerators '
                            'existed.',
                            'People began to make fermented foods only after microorganisms had been '
                            'discovered.',
                            'Scientists have proven that eating fermented food always improves the health of '
                            'the gut.'],
                'answer': [0, 3],
                'reasons': ['○ 第2段落 “the bubbles of carbon dioxide are trapped in the dough and make it '
                            'rise” の言い換え。',
                            '× 第2段落：アルコールと二酸化炭素を作るのは酵母で，乳酸菌は主に乳酸を作る（主語のすり替え）。',
                            '× 第6段落 “in some cases, altered so that they produce materials that they would '
                            'not make in nature” と逆（本文と逆）。',
                            '○ 第3段落 “Before refrigeration, keeping food from spoiling was a constant '
                            'struggle. Fermentation offered an ingenious solution.” の言い換え。',
                            '× 第1段落 “Long before anyone knew that microorganisms existed, people around the '
                            'world were putting them to work.” と逆（本文と逆）。',
                            '× 第5段落 “the evidence is more complicated” と矛盾する（言い過ぎ）。']},
               {'no': 5,
                'points': 4,
                'kind': 'synonym',
                'stem': '下線部(a)・(b)の語について，文脈に即した意味として最もふさわしいものを，それぞれの選択肢(あ)〜(え)から一つ選び，記号で答えなさい。',
                'items': [{'label': 'a',
                           'word': 'accommodate',
                           'choices': ['provide rooms for', 'adapt to', 'ignore', 'get rid of'],
                           'answer': 1,
                           'why': '“living things with their own needs, which we have learned to '
                                  'accommodate”：微生物自身の必要に「合わせる・応える」ことを学んできた。(あ)は「宿泊させる」という別の意味による誤答。(う)(え)は直後の「微生物が育つ条件を作る」と逆。'},
                          {'label': 'b',
                           'word': 'enduring',
                           'choices': ['recent', 'painful', 'patient', 'lasting'],
                           'answer': 3,
                           'why': '何千年も受け継がれ，今も日々の生活の一部である成果＝「長続きする」。(い)は '
                                  'endure（耐える）からの連想による誤答。(う)は人の性質を表す語で achievements に合わない。(あ)は「何千年」と逆。'}]}],
 'translation': ['微生物が存在することを誰かが知るずっと前から，世界中の人々は微生物を働かせていた。パンはふくらみ，牛乳はとろりとしたヨーグルトになり，キャベツは酸っぱくなり，ぶどう果汁はワインになった。こうした変化はしばしば不思議なものとみなされ，それを起こす方法の知識は，科学としてではなく手仕事の技として世代から世代へと受け継がれた。19世紀になって初めて，研究者たちは，今日私たちが発酵と呼ぶこうした変化が，肉眼で見るにはあまりに小さな生き物によって行われていることを示したのである。',
                 '最も単純に言えば，発酵とは，ある種の微生物が酸素を必要とせずに糖からエネルギーを得る方法である。単細胞の菌類である酵母は，糖をアルコールと二酸化炭素に分解する。パンでは，アルコールは焼く間にほとんど蒸発し，二酸化炭素の泡は生地の中に閉じ込められて生地をふくらませる。それに対して乳酸菌は，糖を主に乳酸に変える。この酸がヨーグルトや漬物に鋭い酸味を与えるのであり，また，例えば牛乳のたんぱく質を固まらせるなど，食べ物の食感も変える。',
                 'しかし，人類の歴史の大部分において，発酵の最大の価値は風味ではなく保存にあった。冷蔵技術が登場する前は，食べ物が傷まないようにすることは絶え間ない苦労だった。発酵は巧妙な解決策をもたらした。役に立つ微生物は増えるにつれて酸やアルコールを作り，利用できる糖を使い果たして，食べ物を腐らせる微生物の多くが生きられない状態を作り出す。⑴事実上，人々はある一群の微生物の協力を得て，別の微生物から自分たちの食べ物を守らせていたのである。1日か2日で悪くなっていたはずの牛乳はチーズとして何週間も保存でき，秋に収穫された野菜は冬の間ずっと食べることができた。',
                 '発酵はまた，食べ物をより栄養豊かで消化しやすいものにすることもある。人間の体が処理しにくい物質を分解する微生物もいれば，もとの材料にはなかったビタミンを作る微生物もいる。例えば大豆は生で食べると消化しにくいが，発酵によって味噌や醤油のような食品に変わり，それらは何世紀にもわたって日本料理の（A：欠かせない）一部となってきた。このようにして，保存の手段として始まった過程が，一つの文化全体の料理や食生活をも形作ったのである。',
                 '近年，発酵食品は改めて関心を集めているが，それは一つには，人間の腸に住む膨大な微生物の集団についての研究のためである。科学者たちは，これらの微生物が消化に関わり，健康のほかの面にも影響を与えている可能性があることを知った。発酵食品をもっと食べれば自動的にこの体内の集団がよくなると結論づけたくなるし，広告もしばしばそうした主張をする。（B：実際には），証拠はもっと複雑である。発酵食品に含まれる微生物の多くは胃を通過する旅を生き延びることができず，生き延びたものの効果も人によって大きく異なるようである。⑵こうした理由から，多くの研究者は，発酵食品に付けられた健康効果の主張について慎重であるよう促している。',
                 '発酵は台所にとどまらない。同じ基本的な過程が，今では医薬品やビタミン，その他の有用な物質を製造するために工業規模で利用されている。微生物は巨大な鋼鉄のタンクで育てることができ，場合によっては，自然界では作らない物質を作るように改変することもできる。（C：このようにして），かつては農家や小さな作業場で行われていた手仕事が，現代の生物工学の基礎の一つとなったのである。',
                 '発酵について最も注目すべきことは，それが表している協力関係かもしれない。関わっている微生物は私たちが発明した道具ではない。それは独自の必要を持つ生き物であり，私たちはその必要に(a)合わせることを学んできたのである。何年もの間，小麦粉と水を与えて発酵種を生かし続けるパン職人は，ある意味で小さな生態系の世話をしている。私たちの祖先は目に見えない助け手を見ることはできなかったが，長い経験を通して，その助け手が元気に育つ条件をどのように作ればよいかを理解していた。何千年もかけて磨かれたその理解こそが，発酵食品が今も私たちの日々の生活の一部である（D：究極の）理由であり，人類の最も(b)長続きする成果のいくつかが，目にすることさえできない生物との協力にかかっていることを思い出させてくれるのである。'],
 'vocab': [('microorganism', '微生物'),
           ('put … to work', '〜を働かせる'),
           ('bring about', '〜を引き起こす'),
           ('with the naked eye', '肉眼で'),
           ('fermentation', '発酵'),
           ('evaporate', '蒸発する'),
           ('dough', '（パンの）生地'),
           ('texture', '食感'),
           ('preservation', '保存'),
           ('spoil / rot', '腐る'),
           ('ingenious', '巧妙な'),
           ('in effect', '事実上'),
           ('enlist', '〜の協力を得る'),
           ('digest', '〜を消化する'),
           ('cuisine', '料理'),
           ('tempting', '心をそそる'),
           ('urge caution', '慎重であるよう促す'),
           ('on an industrial scale', '工業規模で'),
           ('accommodate', '〜に合わせる，応える'),
           ('tend', '〜の世話をする'),
           ('thrive', '元気に育つ'),
           ('refine', '〜を磨く'),
           ('enduring', '長続きする')]}
