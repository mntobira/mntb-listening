# -*- coding: utf-8 -*-
# 第1回 大問I（社会科学：ゆるやかな人間関係＝弱い絆）
# マークアップ：{u1|…} 下線(1)  {ua|…} 下線(a)  {wa|…} 波線(a)
PART = {'roman': 'I',
 'points': 35,
 'intro': '次の文章は，日常の「ゆるやかな人間関係」を論じた英文である。よく読んで，後の問1〜5に答えなさい。',
 'passage': ['Most of us, when asked who matters most in our lives, would name a small circle of people: '
             'family members, a partner, perhaps two or three close friends. These are the people we turn to '
             'in a crisis, and it seems natural to presume that our well-being depends almost entirely on '
             'them. Yet a typical day is replete with a very different kind of contact. We exchange a few '
             'words with the barista who makes our coffee, nod to a neighbor walking her dog, or chat '
             'briefly with a classmate we hardly know while waiting for a lecture to begin. Such encounters '
             'are so fleeting and so mundane that we seldom reflect on them at all.',
             'Sociologists have long distinguished between “strong ties,” the deep relationships we sustain '
             'with a few people, and “weak ties,” the looser connections we have with acquaintances. At '
             'first glance, the second category hardly seems worth taking seriously. Weak ties involve '
             'little emotional investment or mutual obligation, and they can dissolve without much sense of '
             'loss. However, there are compelling reasons to think that {u1|this view} underestimates them. '
             'Acquaintances enrich our lives in ways that close friends often cannot.',
             'The first reason concerns information: the people closest to us tend to move in the same '
             'circles that we do. They read the same news, visit the same places, and know many of the same '
             'people. As a result, what they can tell us is often what we already know. Acquaintances, by '
             'contrast, belong to other networks. A former teammate who now works in a different industry, '
             'or a neighbor who grew up in another country, can {ua|open a window onto} a world we would '
             'otherwise never glimpse. It is frequently through such people, rather than through our best '
             'friends, that we first hear of a job opening, a useful book, or an unfamiliar way of looking '
             'at a problem.',
             'A second reason is emotional: many of us think of a conversation with a stranger as something '
             'to be {ub|endured} rather than enjoyed. Asked in advance, people often anticipate that talking '
             'to someone they do not know will be awkward and that the other person will have little '
             'interest in them. Yet when they actually begin such a conversation, they frequently find it '
             'more pleasant than they had expected. ( A ) people misjudge how such conversations will go, '
             'they shun them, and so they never discover that their fears were {uc|exaggerated}.',
             'Weak ties also shape the neighborhoods where we spend our days. A neighborhood where residents '
             'recognize one another, even if they know little more than each other’s faces, feels different '
             'from one where everyone is a stranger. Such a neighborhood requires no deep friendships, only '
             'repeated, low-cost contact: the same faces at the same shop, the same greetings on the same '
             'street. In this sense, a community is built not only from strong bonds but also from countless '
             'slender threads, each one weak on its own but ( B ) when woven together.',
             'Why, then, do we neglect these relationships? Part of the answer lies in the way modern life '
             'is organized. Online shopping, self-service checkouts*, and headphones worn in public spaces '
             'all make it easier to get through a day without speaking to anyone. Each of these conveniences '
             'saves a little time or effort, and few people would willingly relinquish them. Taken together, '
             'however, they remove many of the small opportunities for contact that once arose naturally. '
             '{u2|This is not a problem that anyone designed; it is a side effect of choices that each made '
             'sense on its own.}',
             'None of this means that close relationships are unimportant. A friend who listens during a '
             'difficult time cannot be replaced by a friendly shop assistant. The point is rather that the '
             'two kinds of relationship do different jobs, and that a life built entirely around a few '
             'strong ties may be ( C ) than it appears. Fortunately, weak ties are cheap to create. Asking a '
             'classmate how a test went, thanking a bus driver, or pausing for a moment to talk with a '
             'neighbor costs almost nothing. Such gestures may seem {ud|trivial}, but they are the raw '
             'material* from which a sense of belonging is made.'],
 'notes': [('self-service checkouts', 'セルフレジ'), ('raw material', '原料')],
 'questions': [{'no': 1,
                'points': 8,
                'kind': 'ja_limit',
                'limit': 40,
                'stem': '下線部(1)の this view が表す内容を，40字以内でまとめなさい（句読点も1字と数える）。',
                'answer': '弱い絆は思い入れが小さく，失っても喪失感が少ないので，重視に値しないという見方。',
                'alts': ['知人との浅い関係は思い入れが少なく，消えても惜しくないので大切でないという考え。'],
                'criteria': [('「弱い絆（知人とのゆるやかなつながり）」についての見方であること', 2),
                             ('感情的な関わり（思い入れ）が小さいこと', 2),
                             ('失っても喪失感が少ない（大して惜しくない）こと', 2),
                             ('だから真剣に取り上げる（重視する）価値がない，という結論', 2)],
                'explain': ['this view は直前の2文 “At first glance, the second category hardly seems worth '
                            'taking seriously. Weak ties involve little emotional investment or mutual '
                            'obligation, and they can dissolve without much sense of loss.” を受ける。the second '
                            'category ＝ weak ties。',
                            '直後の underestimates '
                            'them（それらを過小評価する）から，「弱い絆は重要でない」という見方だと確かめられる。理由（感情的な関わりが小さい・失っても喪失感が少ない）と結論（重視に値しない）の両方を入れる。',
                            '「社会学者が強い絆と弱い絆を区別してきた」ことは見方の中身ではないので，40字に入れる必要はない。']},
               {'no': 2,
                'points': 8,
                'kind': 'synonym',
                'stem': '下線部(a)〜(d)の語句について，文脈に即した意味として最もふさわしいものを，それぞれの選択肢(あ)〜(え)から一つ選び，記号で答えなさい。',
                'items': [{'label': 'a',
                           'word': 'open a window onto',
                           'choices': ['let fresh air into',
                                       'protect us from',
                                       'give us a view of',
                                       'shut us out of'],
                           'answer': 2,
                           'why': '「それがなければ決して見ることのない世界」をのぞかせてくれる，という比喩。(あ)は window の文字どおりの意味（換気）で，目的語 a '
                                  'world と合わない。(い)(え)は「見せる」と逆の方向。'},
                          {'label': 'b',
                           'word': 'endured',
                           'choices': ['looked forward to', 'put up with', 'put off', 'made up for'],
                           'answer': 1,
                           'why': '“something to be endured rather than enjoyed”＝楽しむものではなく「我慢する」もの。(あ)は '
                                  'enjoyed の側の意味なので rather than の対比が成り立たない。(う)「延期する」(え)「埋め合わせる」は endure '
                                  'の意味を持たない。'},
                          {'label': 'c',
                           'word': 'exaggerated',
                           'choices': ['overstated', 'hidden', 'shared', 'justified'],
                           'answer': 0,
                           'why': '実際に話すと予想より楽しい（同じ段落の第4文）ので，不安は「大げさだった」。(え)「正当だった」は本文の流れと逆。(い)(う)は「誇張」の意味を持たない。'},
                          {'label': 'd',
                           'word': 'trivial',
                           'choices': ['unpleasant', 'unnatural', 'unusual', 'unimportant'],
                           'answer': 3,
                           'why': '“Such gestures may seem trivial, but they are the raw '
                                  'material…”：「ささいに見えるが，実は帰属意識の原料だ」という対比。(う)(い)(あ)では but '
                                  '以下（重要である）との対比が成り立たない。'}]},
               {'no': 3,
                'points': 5,
                'kind': 'combo',
                'stem': '本文中の( A )〜( C )を補うのに最もふさわしい語の組を，選択肢(あ)〜(え)から一つ選び，記号で答えなさい。',
                'cols': ['( A )', '( B )', '( C )'],
                'rows': [['Although', 'fragile', 'richer'],
                         ['Because', 'fragile', 'poorer'],
                         ['Because', 'strong', 'poorer'],
                         ['Unless', 'strong', 'richer']],
                'answer': 2,
                'explain': ['( A )：「読み違える → だから避ける → だから気づかない」という因果関係なので '
                            'Because。Although（譲歩）は前後に対立がないので不可。Unless（〜でない限り）では「読み違えない限り避ける」となり意味が通らない。',
                            '( B )：each one weak on its own but ( B ) と but でつながるので，weak と対立する '
                            'strong。fragile（もろい）は weak と同じ方向で but と合わない。',
                            '( C )：直前で「二種類の関係は違う役割を果たす」と述べ，強い絆だけの生活は「見かけより貧しい」とつなぐ。richer '
                            'では弱い絆の価値を説く筆者の主張と逆になる。',
                            '以上から Because / strong / poorer の(う)。(あ)は3つとも，(え)は( A )( C )，(い)は( B )が不可。']},
               {'no': 4,
                'points': 8,
                'kind': 'trans_ref',
                'stem': '下線部(2)を，This が指す内容を具体的に示して和訳しなさい。',
                'answer': '便利なものが合わさって，かつては自然に生じていた人と接する小さな機会の多くが失われていることは，誰かが意図して作り出した問題ではない。それは，一つ一つはそれだけで理にかなっていた選択の副作用なのである。',
                'alts': ['オンラインショッピングやセルフレジなどの便利なものが重なり，以前は自然に生まれていた人との小さな接触の機会が奪われているという事態は，誰かが計画した問題ではなく，それぞれ単独では筋の通った選択がもたらした副作用である。'],
                'criteria': [('This＝便利なもの（オンラインショッピング等）が合わさって／重なって', 2),
                             ('かつては自然に生じていた人と接する小さな機会が失われていること', 2),
                             ('誰かが意図して（計画して）作った問題ではない', 2),
                             ('一つ一つはそれだけで理にかなっていた選択の副作用である（each … on its own の処理）', 2)],
                'explain': ['This は直前の文 “Taken together, however, they remove many of the small '
                            'opportunities for contact that once arose naturally.” の内容を指す。they ＝ these '
                            'conveniences（オンラインショッピング・セルフレジ・ヘッドホン）。',
                            'designed は「設計した・意図して作った」。side effect は「副作用（意図しない結果）」。',
                            'choices that each made sense on its own：each は主語（関係代名詞 '
                            'that＝choices）と同格で「それぞれが」，on its own は「それだけで（単独で）」。']},
               {'no': 5,
                'points': 6,
                'kind': 'tf2',
                'stem': '本文の内容に一致するものを，選択肢(あ)〜(か)から二つ選び，記号で答えなさい。',
                'choices': ['The author argues that close friendships should be replaced with a wide network '
                            'of acquaintances.',
                            'Because weak ties take a great deal of time to build, most people can maintain '
                            'only a few of them.',
                            'Close friends are often less useful than acquaintances as sources of new '
                            'information because they share many of our experiences.',
                            'Online shopping and self-service checkouts were introduced in order to reduce '
                            'contact between people.',
                            'Most people enjoy conversations with strangers less than they had predicted '
                            'beforehand.',
                            'According to the author, a neighborhood can feel different even if its '
                            'residents know hardly anything about one another except their faces.'],
                'answer': [2, 5],
                'reasons': ['× 第7段落 “None of this means that close relationships are unimportant. A friend '
                            'who listens … cannot be replaced…” と逆（本文と逆）。',
                            '× 第7段落 “weak ties are cheap to create… costs almost nothing” と逆（本文と逆）。',
                            '○ 第3段落 “The people closest to us tend to move in the same circles… what they '
                            'can tell us is often what we already know.” と “It is frequently through such '
                            'people, rather than through our best friends, that we first hear of…” の言い換え。',
                            '× 第6段落 “This is not a problem that anyone '
                            'designed”。人との接触を減らす「目的で」導入されたとは書かれていない（目的のすり替え＝本文にない内容）。',
                            '× 第4段落 “they frequently find it more pleasant than they had expected” と逆（本文と逆）。',
                            '○ 第5段落 “A neighborhood where residents recognize one another, even if they know '
                            'little more than each other’s faces, feels different from one where everyone is '
                            'a stranger.” の言い換え。']}],
 'translation': ['私たちのほとんどは，人生で最も大切な人は誰かと尋ねられると，家族，パートナー，そしておそらく2，3人の親しい友人といった小さな輪の人々の名前を挙げるだろう。彼らは私たちが困ったときに頼る人々であり，私たちの幸福はほとんど彼らだけにかかっていると考えるのは自然なことのように思える。しかし，典型的な一日は，それとはまったく異なる種類の接触で満ちている。私たちはコーヒーをいれてくれるバリスタと二言三言交わし，犬を散歩させている近所の女性に会釈し，講義が始まるのを待つ間にほとんど知らない同級生と少しおしゃべりをする。そうした出会いはあまりにはかなく，あまりにありふれているので，私たちはそれについて考えることなどめったにない。',
                 '社会学者たちは長い間，「強い絆」，つまり少数の人々と保つ深い関係と，「弱い絆」，つまり知人との間に持つよりゆるやかなつながりとを区別してきた。一見すると，後者は真剣に取り上げる価値などほとんどないように思える。弱い絆には感情的な投資や互いへの義務がほとんど伴わず，大した喪失感もなく消えてしまうことがある。しかし，⑴この見方は弱い絆を過小評価していると考える十分な理由がある。知人は，親しい友人にはしばしばできない形で私たちの生活に貢献しているのだ。',
                 '一つ目の理由は情報に関わる。私たちに最も近い人々は，私たちと同じ集団の中で動いている傾向がある。彼らは同じニュースを読み，同じ場所を訪れ，同じ人々の多くを知っている。その結果，彼らが教えてくれることは，すでに知っていることである場合が多い。それに対して，知人は別のネットワークに属している。今は別の業界で働いているかつてのチームメイトや，別の国で育った隣人は，それがなければ決して目にすることのない世界を(a)のぞかせてくれることがある。私たちが求人や役に立つ本，あるいは問題についての見慣れない見方を初めて耳にするのは，親友を通じてよりもむしろ，そうした人々を通じてであることが多い。',
                 '二つ目の理由は感情に関わる。私たちの多くは，見知らぬ人との会話を，楽しむものではなく(b)我慢するものだと考えている。前もって尋ねられると，人々はしばしば，知らない人と話すのは気まずいだろうし，相手は自分にほとんど関心を持たないだろうと予想する。しかし実際にそうした会話を始めてみると，思っていたより楽しいと感じることが多い。人々はそうした会話がどうなるかを読み違える（A：ので），それを避けてしまい，そのため自分の不安が(c)大げさだったことに決して気づかないのである。',
                 '弱い絆は，私たちが日々を過ごす地域のあり方も左右する。住民が互いを見知っている地域は，たとえ顔くらいしか知らなくても，誰もが他人同士である地域とは違った感じがする。そうした地域に深い友情は必要なく，必要なのは，繰り返される負担の少ない接触だけである。同じ店で見る同じ顔，同じ通りで交わす同じあいさつ。この意味で，地域社会は強い結びつきだけでなく，無数の細い糸からもできている。その糸の一本一本はそれだけでは弱いが，織り合わされると（B：強い）のである。',
                 'それでは，なぜ私たちはこうした関係をおろそかにするのだろうか。答えの一部は，現代の生活の仕組みにある。オンラインショッピング，セルフレジ，公共の場で着けるヘッドホンは，いずれも誰とも話さずに一日を過ごすことを容易にしている。こうした便利なものはどれも少しの時間や手間を省いてくれるし，それを手放したいと思う人はほとんどいないだろう。しかし，それらが合わさることで，かつては自然に生じていた人と接する小さな機会の多くが失われている。⑵これは誰かが意図して作り出した問題ではない。一つ一つはそれだけで理にかなっていた選択の副作用なのである。',
                 'こうしたことはどれも，親しい関係が重要でないという意味ではない。つらい時期に話を聞いてくれる友人を，愛想のよい店員で置き換えることはできない。要点はむしろ，二種類の関係は異なる役割を果たしており，少数の強い絆だけを中心に築かれた生活は，見かけよりも（C：貧しい）ものかもしれないということである。幸い，弱い絆は安上がりに作ることができる。同級生にテストはどうだったかと尋ねたり，バスの運転手にお礼を言ったり，少し立ち止まって近所の人と話をしたりすることには，ほとんど何の費用もかからない。そうした振る舞いは(d)ささいなものに思えるかもしれないが，帰属意識はそれを原料として作られるのである。'],
 'vocab': [('fleeting', 'つかの間の，はかない'),
           ('mundane', 'ありふれた'),
           ('acquaintance', '知人'),
           ('mutual obligation', '互いへの義務'),
           ('distinguish between A and B', 'AとBを区別する'),
           ('emotional investment', '感情的な投資（思い入れ）'),
           ('underestimate', '〜を過小評価する'),
           ('move in the same circles', '同じ交友範囲の中にいる'),
           ('otherwise', 'そうでなければ'),
           ('job opening', '求人，就職口'),
           ('endure', '〜に耐える，我慢する'),
           ('awkward', '気まずい'),
           ('misjudge', '〜の判断を誤る'),
           ('exaggerate', '〜を誇張する'),
           ('weave（wove, woven）', '〜を織る'),
           ('neglect', '〜をおろそかにする'),
           ('side effect', '副作用'),
           ('make sense', '理にかなう'),
           ('on one’s own', 'それだけで，単独で'),
           ('trivial', 'ささいな'),
           ('a sense of belonging', '帰属意識')]}
