# -*- coding: utf-8 -*-
# 第3回 大問I（技術と社会：道案内アプリと空間の感覚）
PART = {'roman': 'I',
 'points': 35,
 'intro': '次の文章は，道案内アプリと人間の空間の感覚を論じた英文である。よく読んで，後の問1〜5に答えなさい。',
 'passage': ['Not long ago, finding your way around an unfamiliar city required a certain amount of effort. '
             'You studied a paper map before setting out, asked strangers for directions, and paid close '
             'attention to landmarks so that you could find your way back. Today, most of us simply type an '
             'address into a phone and follow the blue line. The app tells us when to turn, alerts us to '
             'traffic, and even estimates the minute of our arrival. It is hard to imagine a more convenient '
             'tool, and few people would yearn to return to the days of folding and refolding enormous maps '
             'on a windy street corner.',
             'Yet some psychologists have begun to ask whether this convenience comes at a hidden cost. '
             'Their concern is not that the apps are inaccurate; on the contrary, they are usually extremely '
             'reliable. The worry is rather that {u1|this very reliability} allows us to stop paying '
             'attention to our surroundings. When every turn is announced in advance, there is little reason '
             'to notice which way we are facing, how one street relates to another, or what the neighborhood '
             'looks like. We arrive at our destination, but we may have only the vaguest idea of how we got '
             'there.',
             'To understand why this might matter, it helps to distinguish between two ways of finding a '
             'route. The first is to follow a sequence of instructions: turn left at the bank, go straight '
             'for two blocks, turn right at the station. The second is to build what researchers call a '
             '“mental map,” an inner picture of how places are arranged in relation to one another. People '
             'who rely on a mental map can {ua|improvise} when a road is closed or when they want to take a '
             'shortcut. People who know only a sequence of instructions are lost the moment the sequence '
             'breaks down.',
             'Navigation apps encourage the first strategy and render the second almost superfluous. Some '
             'small-scale experiments suggest that people who reach a place by following turn-by-turn '
             'directions remember less about the route afterward than those who find their way using a map. '
             '( A ) such findings are still contested, they fit a broader pattern that is familiar from '
             'other areas of life. Just as people who rely on a calculator may find mental arithmetic '
             'harder, those who always follow a screen may find it harder to {ub|orient} themselves without '
             'one.',
             'It would be easy to turn this argument into a simple warning against technology, but that '
             'would be a mistake. Tools that take over mental tasks have a long history. Writing allowed '
             'people to stop memorizing long poems and lists, and few would argue that literacy has made '
             'humanity less intelligent. Freed from the need to remember everything, people could devote '
             'their attention to other things. In the same way, a driver who does not have to worry about '
             'the next turn may be a calmer and therefore ( B ) driver. The question is not whether we '
             'should use such tools, but how.',
             'One answer is to use them more actively. Instead of following the blue line without thinking, '
             'a traveler can glance at the whole route before starting, notice where the river or the main '
             'road lies, and try to anticipate the next turn before the app announces it. Such habits take a '
             'little more effort, but they turn a passive experience into a learning one. {u2|What is lost '
             'is not the ability to find our way but the habit of using it, and habits can be rebuilt.}',
             'There is also something to be said for occasionally getting lost. Meandering through an '
             'unfamiliar area without a fixed plan can lead to serendipitous* discoveries that no app would '
             'suggest: a quiet park, a bakery on a side street, a view of the hills from an unexpected '
             'angle. These experiences are not merely pleasant. They are also the raw material of the mental '
             'maps that make a place feel familiar rather than ( C ). Seen in this light, a wrong turn now '
             'and then is less a failure than a modest {uc|investment}, and the occasional {ud|detour} may '
             'be the shortest way to really knowing a place.'],
 'notes': [('turn-by-turn directions', '曲がり角ごとの道案内'),
           ('serendipitous', '思いがけない幸運な'),
           ('literacy', '読み書きの能力')],
 'questions': [{'no': 1,
                'points': 8,
                'kind': 'ja_limit',
                'limit': 40,
                'stem': '下線部(1)の this very reliability が表す内容を，40字以内でまとめなさい（句読点も1字と数える）。',
                'answer': '道案内アプリはたいていきわめて信頼でき，曲がる所を前もって正しく教えること。',
                'alts': ['道案内アプリはまず間違えず，曲がる角を前もって正確に知らせてくれること。'],
                'criteria': [('道案内アプリについての性質であること', 2),
                             ('不正確ではなく，たいていきわめて信頼できる（正確である）こと', 4),
                             ('（曲がる所などを）正しく知らせてくれる，という具体化', 2)],
                'explain': ['this very reliability は直前の “Their concern is not that the apps are inaccurate; '
                            'on the contrary, they are usually extremely reliable.” を受ける。very は「まさにその」という強調。',
                            '直後の文 “When every turn is announced in advance” '
                            'から，信頼性の中身（曲がる所を前もって正しく知らせる）を補ってもよい。',
                            '「周囲に注意を払わなくなる」は信頼性がもたらす結果であって，this very reliability の中身ではないので入れない。']},
               {'no': 2,
                'points': 8,
                'kind': 'synonym',
                'stem': '下線部(a)〜(d)の語について，文脈に即した意味として最もふさわしいものを，それぞれの選択肢(あ)〜(え)から一つ選び，記号で答えなさい。',
                'items': [{'label': 'a',
                           'word': 'improvise',
                           'choices': ['give up', 'ask for help', 'stick to the plan', 'adapt on the spot'],
                           'answer': 3,
                           'why': '道が閉鎖されたときや近道をしたいときに「その場で臨機応変に対応する（別の道を考え出す）」。直後の「指示しか知らない人は手順が崩れると迷う」との対比から明らか。(あ)(い)は頭の中の地図を持つ人の特徴と逆，(う)は指示に従う人の特徴。'},
                          {'label': 'b',
                           'word': 'orient',
                           'choices': ['get their bearings',
                                       'introduce themselves',
                                       'improve their skills',
                                       'travel to the East'],
                           'answer': 0,
                           'why': 'orient '
                                  'oneself＝「自分の位置や方角を確かめる」。画面がないと「自分がどこにいてどちらを向いているか」がわかりにくい，という文脈。(え)は '
                                  'Orient（東洋）からの連想による誤答。(い)(う)は道案内と関係しない。'},
                          {'label': 'c',
                           'word': 'investment',
                           'choices': ['a cost that pays off later',
                                       'a waste of money',
                                       'a careful business plan',
                                       'an unexpected accident'],
                           'answer': 0,
                           'why': '道を間違えることは失敗というより，後で頭の中の地図という見返りをもたらす「小さな投資」。(い)は直前の “less a failure” '
                                  'と逆。(え)(う)は比喩の意味（後で得をする支出）を表さない。'},
                          {'label': 'd',
                           'word': 'detour',
                           'choices': ['a guided tour',
                                       'a roundabout route',
                                       'a traffic jam',
                                       'a final destination'],
                           'answer': 1,
                           'why': 'detour＝「回り道」。“the shortest way” と組み合わせて「回り道こそが最短の道」という逆説を作っている。(あ)は tour '
                                  'の字面による誤答。(う)(え)は意味が異なる。'}]},
               {'no': 3,
                'points': 5,
                'kind': 'combo',
                'stem': '本文中の( A )〜( C )を補うのに最もふさわしい語の組を，選択肢(あ)〜(え)から一つ選び，記号で答えなさい。',
                'cols': ['( A )', '( B )', '( C )'],
                'rows': [['Unless', 'slower', 'strange'],
                         ['Although', 'slower', 'familiar'],
                         ['Because', 'safer', 'strange'],
                         ['Although', 'safer', 'strange']],
                'answer': 3,
                'explain': ['( A )：「そうした結果はまだ議論の途中だが，より広いパターンに合う」という譲歩なので Although。Because '
                            'では「議論の途中だから合う」となり因果が成り立たない。Unless も意味が通らない。',
                            '( B )：「次の曲がり角を心配しなくてよい運転者は，より落ち着いており，したがってより安全な運転者かもしれない」。calmer and therefore '
                            'は calmer の結果を表すので safer。slower（遅い）は落ち着いていることの結果ではなく，文脈（道具の利点）とも合わない。',
                            '( C )：“feel familiar rather than ( C )”：rather than の前後は対立するので，familiar と反対の '
                            'strange。familiar を入れると同じ語の繰り返しで意味をなさない。',
                            '以上から Although / safer / strange の(え)。(う)は( A )，(い)は( B )( C )，(あ)は( A )( B '
                            ')が不可。']},
               {'no': 4,
                'points': 8,
                'kind': 'trans_ref',
                'stem': '下線部(2)を，it が指す内容を具体的に示して和訳しなさい。',
                'answer': '失われるのは，自分で道を見つける能力ではなく，その能力を使う習慣であり，習慣は再び築くことができる。',
                'alts': ['私たちがなくしているのは道を見つける力そのものではなく，その力を使う習慣であって，習慣なら作り直せる。'],
                'criteria': [('it＝自分で道を見つける能力（the ability to find our way）であることを明示', 3),
                             ('What is lost is not A but B：「失われるのはAではなくBである」', 2),
                             ('the habit of using it：「それ（その能力）を使う習慣」', 1),
                             ('habits can be rebuilt：「習慣は再び築く（作り直す）ことができる」', 2)],
                'explain': ['it は直前の the ability to find our way（自分で道を見つける能力）を指す。',
                            'What is lost は関係代名詞 what の節で「失われるもの」。not A but B「AではなくB」。',
                            '直前の段落で述べた「全体の道筋を見る」「次の角を予想する」などの習慣で，能力を使う習慣は取り戻せる，という筆者の主張につながる。']},
               {'no': 5,
                'points': 6,
                'kind': 'tf2',
                'stem': '本文の内容に一致するものを，選択肢(あ)〜(か)から二つ選び，記号で答えなさい。',
                'choices': ['The author argues that people should stop using navigation apps altogether.',
                            'Getting lost is described as entirely unpleasant and of no value.',
                            'It has been firmly established that using navigation apps damages the human '
                            'brain.',
                            'People who have a mental map can deal with a closed road more easily than those '
                            'who only follow instructions.',
                            'According to the author, writing freed people from having to memorize '
                            'everything.',
                            'The psychologists mentioned in the passage are mainly worried that navigation '
                            'apps often give wrong directions.'],
                'answer': [3, 4],
                'reasons': ['× 第5段落 “The question is not whether we should use such tools, but how.” '
                            'と逆（本文と逆）。',
                            '× 第7段落 “These experiences are not merely pleasant.”（楽しいだけでなく価値もある）と逆（本文と逆）。',
                            '× 第4段落 “such findings are still contested” と矛盾する（言い過ぎ）。また「脳が損なわれる」とは書かれていない。',
                            '○ 第3段落 “People who rely on a mental map can improvise when a road is closed … '
                            'People who know only a sequence of instructions are lost the moment the '
                            'sequence breaks down.” の言い換え。',
                            '○ 第5段落 “Writing allowed people to stop memorizing long poems and lists … Freed '
                            'from the need to remember everything” の言い換え。',
                            '× 第2段落 “Their concern is not that the apps are inaccurate; on the contrary, '
                            'they are usually extremely reliable.” と逆（本文と逆）。']}],
 'translation': ['少し前まで，知らない町で道を見つけるにはそれなりの努力が必要だった。出発前に紙の地図を調べ，見知らぬ人に道を尋ね，帰り道がわかるように目印によく注意を払った。今日では，私たちのほとんどは電話に住所を打ち込み，青い線をたどるだけである。アプリはいつ曲がればよいかを教え，渋滞を知らせ，到着時刻を分単位で見積もりさえする。これ以上便利な道具は想像しがたく，風の強い街角で巨大な地図を何度も折ったり広げたりしていた時代に戻りたいと思う人はほとんどいないだろう。',
                 'しかし一部の心理学者は，この便利さには隠れた代償があるのではないかと問い始めている。彼らの懸念は，アプリが不正確だということではない。それどころか，アプリはたいていきわめて信頼できる。心配なのはむしろ，⑴まさにこの信頼性のせいで，私たちが周囲に注意を払わなくなってしまうことである。曲がる所がすべて前もって知らされると，自分がどちらを向いているのか，ある通りが別の通りとどう関係しているのか，その地域がどんな様子なのかに気づく理由はほとんどない。私たちは目的地に着くが，どうやってそこに着いたのかについては，ごくぼんやりとした考えしか持っていないかもしれない。',
                 'これがなぜ重要なのかを理解するには，道を見つける二つの方法を区別するとよい。一つ目は，一連の指示に従う方法である。銀行で左に曲がり，2区画まっすぐ進み，駅で右に曲がる。二つ目は，研究者が「頭の中の地図」と呼ぶもの，つまり場所が互いにどう配置されているかについての内的な像を作る方法である。頭の中の地図に頼る人は，道が閉鎖されているときや近道をしたいときに(a)その場で別の道を考え出すことができる。一連の指示しか知らない人は，その手順が崩れたとたんに迷ってしまう。',
                 '道案内アプリは一つ目の方法を促し，二つ目の方法をほとんど不要にする。いくつかの小規模な実験は，曲がり角ごとの道案内に従ってある場所に着いた人は，地図を使って道を見つけた人よりも，後になって道筋について覚えていることが少ないことを示唆している。そうした結果はまだ議論されている（A：が），それは生活のほかの分野でおなじみのより広いパターンに合っている。計算機に頼る人が暗算を難しく感じるかもしれないのと同じように，いつも画面に従っている人は，画面なしで(b)自分の位置や方角を確かめるのが難しくなるかもしれない。',
                 'この議論を科学技術に対する単純な警告に変えてしまうのは簡単だろうが，それは誤りだろう。頭の仕事を肩代わりする道具には長い歴史がある。文字のおかげで，人々は長い詩や一覧表を暗記するのをやめることができたが，読み書きの能力が人類を愚かにしたと主張する人はほとんどいないだろう。すべてを覚えておく必要から解放されて，人々はほかのことに注意を向けることができた。同じように，次の曲がり角を心配する必要のない運転者は，より落ち着いており，したがってより（B：安全な）運転者になるかもしれない。問題は，そうした道具を使うべきかどうかではなく，どう使うかなのである。',
                 '一つの答えは，それをもっと能動的に使うことである。何も考えずに青い線をたどるのではなく，旅行者は出発前に道筋全体にざっと目を通し，川や大通りがどこにあるかに注意し，アプリが知らせる前に次の曲がり角を予想しようとすることができる。そうした習慣には少し余計に努力が必要だが，受け身の経験を学びの経験に変えてくれる。⑵失われるのは，自分で道を見つける能力ではなく，その能力を使う習慣であり，習慣は再び築くことができる。',
                 'ときどき道に迷うことにも，それなりのよさがある。決まった予定もなく知らない地域を歩き回ると，どんなアプリも勧めないような思いがけない発見につながることがある。静かな公園，脇道のパン屋，思いがけない角度から見る丘の眺め。こうした経験は単に楽しいだけではない。それは，ある場所を（C：見知らぬ）ものではなくなじみのあるものに感じさせる，頭の中の地図の原料でもあるのだ。このように考えると，ときどき道を間違えることは失敗というよりもささやかな(c)投資であり，たまの(d)回り道こそが，ある場所を本当に知るための最短の道なのかもしれない。'],
 'vocab': [('unfamiliar', '見知らぬ，なじみのない'),
           ('landmark', '目印'),
           ('estimate', '〜を見積もる'),
           ('come at a cost', '代償を伴う'),
           ('on the contrary', 'それどころか'),
           ('reliable', '信頼できる'),
           ('vague', 'ぼんやりした'),
           ('in relation to …', '〜との関係で'),
           ('improvise', 'その場で何とかする'),
           ('break down', '崩れる，うまくいかなくなる'),
           ('mental arithmetic', '暗算'),
           ('orient oneself', '自分の位置・方角を確かめる'),
           ('take over', '〜を引き継ぐ，肩代わりする'),
           ('devote A to B', 'AをBに向ける'),
           ('glance at …', '〜にざっと目を通す'),
           ('passive', '受け身の'),
           ('there is something to be said for …', '〜にもよい点がある'),
           ('wander', '歩き回る'),
           ('serendipitous', '思いがけない幸運な'),
           ('in this light', 'このように考えると'),
           ('detour', '回り道')]}
