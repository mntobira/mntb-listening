# -*- coding: utf-8 -*-
# 第2回 大問II（社会科学：「初期設定」が選択を左右する）
PART = {'roman': 'II',
 'points': 35,
 'intro': '次の文章は，人の選択と「初期設定」の関係を論じた英文である。よく読んで，後の問1〜5に答えなさい。',
 'passage': ['Imagine that you have just started a new job and are handed a sheaf of forms on your first '
             'morning. One of them asks whether you would like part of your salary to be placed in a savings '
             'plan for your retirement. If the form says that you will be enrolled unless you tick a box to '
             'opt out, you will probably remain in the plan. If it says that you will not be enrolled unless '
             'you tick a box to join, you will probably stay out. In both cases the choice is entirely '
             'yours, and ticking a box takes only a second. Yet the way the question is framed exerts a '
             'formidable influence on what most people end up doing.',
             'An option that takes effect automatically when a person makes no active choice is known as a '
             'default*. Defaults are ubiquitous, determining the settings on a new phone, how large a coffee '
             'we are served if we do not ask for something different, and the plan we are placed on when we '
             'sign up for a service. Because they require nothing of us, we seldom notice them. Yet '
             'researchers who study decision-making have found again and again that {u1|the option a person '
             'happens to be given at the start is often the one he or she ends up with}, even when the '
             'stakes are high and changing it would be easy.',
             'Why should something so minor have such {ua|considerable} influence? One reason is simple '
             'effort. Every decision, however small, requires some attention, and people tend to '
             'procrastinate on choices that seem convoluted or unpleasant. ( A ) a decision has been '
             'postponed, the default persists, sometimes for years. A second reason is that a default can be '
             'construed as advice. People often assume, not unreasonably, that whoever set up the default '
             'chose the option that most people would want. Accepting it therefore feels like the prudent '
             'thing to do.',
             'A third reason concerns how we judge gains and losses. Once an option has been given to us, we '
             'tend to treat it as our starting point. Moving away from it then feels like forfeiting '
             'something, and people generally dislike losses more than they like gains of the same size. An '
             'employee who has been enrolled in a savings plan may feel that leaving it means losing money '
             'for the future, while an employee who has not been enrolled may feel that joining means losing '
             'part of today’s salary. The facts are the same in both cases; only the starting point is ( B '
             ').',
             '{u2|For these reasons, many governments and companies have begun to design defaults '
             'deliberately}, hoping to steer people toward choices that serve their long-term interests. '
             'Proponents of this approach point out that someone has to decide what happens when people do '
             'nothing, and that since a truly neutral option rarely exists, a default should be chosen with '
             'care rather than left to chance. And because people remain free to choose otherwise, no one is '
             'coerced into anything.',
             'Critics, however, are less ( C ). They worry that the same techniques can be exploited to '
             'serve the interests of those who design them rather than those who are affected. A company '
             'might make a pricey subscription* the default, knowing that many customers will never get '
             'around to canceling it. Even well-intentioned defaults raise thorny questions. Who decides '
             'what is good for us? And if people end up with an option without ever thinking about it, can '
             'that option really be called their choice?',
             'There is no simple answer to these questions, but one point is worth keeping in mind: defaults '
             'cannot be avoided, since every form, website, and contract has to start somewhere. The real '
             'question is therefore not whether our choices should be influenced, but by whom, for what '
             'purpose, and how {ub|openly}. A default that is clearly explained and easy to change respects '
             'people’s autonomy in a way that a covert one does not. Perhaps the best safeguard is simply '
             'awareness: ( D ) we notice the defaults around us, we can ask whether they are really the '
             'options we would have chosen ourselves.'],
 'notes': [('default', '初期設定，既定値'), ('subscription', '定額制の契約（サービス）')],
 'questions': [{'no': 1,
                'points': 8,
                'kind': 'trans',
                'stem': '下線部(1)を和訳しなさい。',
                'answer': '人が最初にたまたま与えられた選択肢が，結局その人が手にする（選ぶ）選択肢であることが多い',
                'alts': ['最初にたまたま割り当てられた選択肢を，人は結局そのまま選ぶことが多い'],
                'criteria': [('the option a person happens to be given：関係詞節（目的格の関係代名詞の省略）「人がたまたま与えられる選択肢」',
                              2),
                             ('happen to do「たまたま〜する」と at the start「最初に」', 2),
                             ('the one＝the option（同じ選択肢）', 2),
                             ('end up with：「結局〜を手にする（〜に落ち着く）」', 2)],
                'explain': ['the option と a person の間に目的格の関係代名詞が省略されている。主語は the option … at the start，動詞は '
                            'is。',
                            'happen to do「たまたま〜する」。be given は「与えられる」。the one は前出の option の代わり。he or she ends '
                            'up with も the one を修飾する関係詞節（関係代名詞の省略）。',
                            'end up with A「結局Aを手にする・Aに落ち着く」。「自分で選び直すことはあまりない」という含みが伝わればよい。']},
               {'no': 2,
                'points': 8,
                'kind': 'blanks',
                'stem': '空所( A )〜( D )を補うのに最もふさわしい表現を，それぞれの選択肢(あ)〜(え)から一つ選び，記号で答えなさい。',
                'items': [{'label': 'A',
                           'choices': ['Before', 'Although', 'Unless', 'Once'],
                           'answer': 3,
                           'why': '「いったん決定が先送りされると，初期設定がそのまま残る」。Unless（〜でない限り）では「先送りされない限り残る」となり逆。Although '
                                  'は前後に対立がない。Before は時の関係が成り立たない。'},
                          {'label': 'B',
                           'choices': ['hidden', 'different', 'identical', 'fixed'],
                           'answer': 1,
                           'why': '“The facts are the same in both cases; only the starting point is ( B '
                                  ').”：事実は同じで，「出発点だけが違う」。identical では only との対比が成り立たない。fixed / hidden '
                                  'は直前の2人の従業員の例（出発点が加入か非加入かの違い）を説明しない。'},
                          {'label': 'C',
                           'choices': ['enthusiastic', 'careful', 'worried', 'critical'],
                           'answer': 0,
                           'why': '前段落の支持者の意見に対して，批判する人々は「それほど乗り気ではない」。直後に “They worry …” と続くので less worried '
                                  'は矛盾。less critical も「批判する人々」と矛盾。less careful は直後の懸念の内容と結びつかない。'},
                          {'label': 'D',
                           'choices': ['although', 'so that', 'if', 'unless'],
                           'answer': 2,
                           'why': '「身の回りの初期設定に気づけば，それが本当に自分で選んだであろう選択肢かと問うことができる」という条件。unless は逆の条件，although '
                                  'は対立がない，so that は後ろに主節が来る形にならず文が成り立たない。'}]},
               {'no': 3,
                'points': 9,
                'kind': 'ja_limit',
                'limit': 70,
                'stem': '下線部(2)のように多くの政府や企業が初期設定を設計し始めたのはなぜか。その理由を，本文の内容に即して70字以内でまとめなさい（句読点も1字と数える）。',
                'answer': '決定は手間がかかり先送りされやすく，初期設定は推奨と受け取られ，出発点となって変更が損失に感じられるため，人は初期設定のままでいやすいから。',
                'alts': ['人は面倒な選択を先延ばしにし，初期設定を勧められた選択肢とみなし，そこから離れることを損と感じるので，初期設定がそのまま選ばれやすいから。'],
                'criteria': [('決定には手間（注意）が必要で，先送りされやすい', 2),
                             ('初期設定は助言（推奨）と受け取られる', 2),
                             ('初期設定が出発点となり，そこから離れることが損失に感じられる', 2),
                             ('その結果，人は初期設定のままでいることが多い', 2),
                             ('理由の文として結ばれている（〜から・〜ため）', 1)],
                'explain': ['For these reasons の these reasons は第3・第4段落で述べた3つの理由。①決定には手間がかかり先送りされる（One '
                            'reason is simple effort.）②初期設定は助言として読まれる（A second reason '
                            '…）③出発点となり，離れることが損失に感じられる（A third reason …）。',
                            'この3つの理由により「人は初期設定のままでいやすい」ので，政府や企業は意図的に初期設定を設計し始めた，という論理。「長期的な利益のため」は目的（hoping '
                            'to …）であり，these reasons の中身ではない。']},
               {'no': 4,
                'points': 6,
                'kind': 'tf2',
                'stem': '本文の内容に一致するものを，選択肢(あ)〜(か)から二つ選び，記号で答えなさい。',
                'choices': ['If a savings plan is the default, most new employees will probably stay in it.',
                            'Companies are required by law to make the cheapest option the default.',
                            'Supporters argue that, since a neutral option rarely exists, defaults should be '
                            'chosen with care.',
                            'The author concludes that all defaults should be banned in order to protect '
                            'freedom.',
                            'People rarely accept defaults because they distrust whoever designed them.',
                            'Changing a default is usually difficult and takes a long time.'],
                'answer': [0, 2],
                'reasons': ['○ 第1段落 “If the form says that you will be enrolled unless you tick a box to opt '
                            'out, you will probably remain in the plan.” の言い換え。',
                            '× 法律による義務づけについては本文に記述がない（本文にない内容）。',
                            '○ 第5段落 “Since a truly neutral option rarely exists, a default should be chosen '
                            'with care rather than left to chance.” の言い換え。',
                            '× 第7段落 “Defaults cannot be avoided” と矛盾する（本文と逆）。',
                            '× 第3段落 “People often assume … that whoever set up the default chose the option '
                            'that most people would want.” と逆（本文と逆）。',
                            '× 第1段落 “ticking a box takes only a second”，第2段落 “changing it would be easy” '
                            'と逆（本文と逆）。']},
               {'no': 5,
                'points': 4,
                'kind': 'synonym',
                'stem': '下線部(a)・(b)の語について，文脈に即した意味として最もふさわしいものを，それぞれの選択肢(あ)〜(え)から一つ選び，記号で答えなさい。',
                'items': [{'label': 'a',
                           'word': 'considerable',
                           'choices': ['visible', 'kind', 'thoughtful', 'substantial'],
                           'answer': 3,
                           'why': '“something so minor”（とても小さなこと）と対比して「かなり大きな」影響。(う)(い)は '
                                  'considerate（思いやりのある）との混同を誘う誤答。(あ)「目に見える」は “we seldom notice them” と逆。'},
                          {'label': 'b',
                           'word': 'openly',
                           'choices': ['widely', 'transparently', 'frequently', 'loudly'],
                           'answer': 1,
                           'why': '直後で「はっきり説明され，変えやすい初期設定」と「隠された初期設定」を対比しているので，openly＝隠さずに＝transparently。(あ)「広く」(う)「頻繁に」(え)「大声で」はこの対比に合わない。'}]}],
 'translation': ['あなたが新しい仕事を始めたばかりで，初日の朝に書類の束を手渡されたと想像してほしい。その一つは，給料の一部を退職後のための貯蓄制度に回したいかどうかを尋ねている。用紙に「脱退の欄に印をつけない限り加入となる」と書いてあれば，あなたはおそらく制度にとどまるだろう。「加入の欄に印をつけない限り加入しない」と書いてあれば，おそらく加入しないままだろう。どちらの場合も選択は完全にあなたに任されており，欄に印をつけるのは1秒しかかからない。それでも，質問の示し方は，ほとんどの人が最終的にどうするかに強い影響を及ぼすのである。',
                 '人が積極的に選択をしないときに自動的に適用される選択肢は，初期設定と呼ばれる。初期設定はいたるところにあり，新しい電話の設定，別のものを頼まなければ出てくるコーヒーのサイズ，サービスに登録したときに入れられるプランを決めている。初期設定は私たちに何も求めないので，私たちはめったにそれに気づかない。しかし，意思決定を研究する人々は，たとえ大きなものがかかっていて，変更するのが簡単な場合でも，⑴人が最初にたまたま与えられた選択肢が，結局その人が手にする選択肢であることが多いということを何度も見いだしてきた。',
                 'なぜこれほど小さなことがこれほど(a)大きな影響力を持つのだろうか。一つの理由は単純に手間である。どんな決定も，どれほど小さくても，ある程度の注意を必要とし，人は複雑に思えたり不快に思えたりする選択を先延ばしにしがちである。（A：いったん）決定が先送りされると，初期設定がそのまま残り，それが何年も続くこともある。二つ目の理由は，初期設定が助言として受け取られうることである。人はしばしば，初期設定を決めた人はほとんどの人が望む選択肢を選んだのだろうと考えるが，それは無理もないことである。それゆえ，初期設定を受け入れることは賢明なことのように感じられる。',
                 '三つ目の理由は，私たちが得と損をどう判断するかに関わる。いったんある選択肢を与えられると，私たちはそれを出発点とみなす傾向がある。するとそこから離れることは何かを手放すことのように感じられ，人は一般に，同じ大きさの得を好む以上に損を嫌う。貯蓄制度に加入させられた従業員は，脱退することは将来のお金を失うことだと感じるかもしれず，一方，加入させられていない従業員は，加入することは今日の給料の一部を失うことだと感じるかもしれない。事実はどちらの場合も同じであり，出発点だけが（B：違う）のである。',
                 '⑵こうした理由から，多くの政府や企業は初期設定を意図的に設計し始めており，人々を長期的な利益にかなう選択へと導くことを望んでいる。この考え方を支持する人々は，人が何もしないときにどうなるかは誰かが決めなければならず，本当に中立な選択肢はめったに存在しないのだから，初期設定を成り行きに任せるよりも慎重に選ぶ方がよいと指摘する。そして，人々は別の選択をする自由を持ち続けるのだから，誰も何かを強制されるわけではない。',
                 'しかし，批判する人々はそれほど（C：乗り気）ではない。彼らは，同じ手法が，影響を受ける人々ではなく，それを設計する人々の利益のために使われうることを心配している。企業は，多くの客がいつまでも解約に取りかからないことを見越して，高額な定額制の契約を初期設定にするかもしれない。善意の初期設定でさえ難しい問題を提起する。何が私たちにとってよいのかを誰が決めるのか。そして，人が一度も考えることなくある選択肢に落ち着いたとしたら，それを本当にその人の選択と呼べるのだろうか。',
                 'こうした問いに簡単な答えはないが，一つ心に留めておく価値のある点がある。どんな用紙も，ウェブサイトも，契約も，どこかから始めなければならないので，初期設定は避けられないということだ。したがって本当の問題は，私たちの選択が影響を受けるべきかどうかではなく，誰によって，何の目的で，どれほど(b)公然と影響を受けるのかということである。はっきりと説明され，簡単に変えられる初期設定は，隠された初期設定にはない形で人々の自由を尊重する。おそらく最善の防御は，単に気づくことだろう。身の回りの初期設定に気づけ（D：ば），それが本当に自分で選んだであろう選択肢なのかと問うことができるのである。'],
 'vocab': [('be enrolled', '加入（登録）させられる'),
           ('opt out', '（制度から）脱退する'),
           ('frame', '（質問など）を組み立てる，示す'),
           ('take effect', '効力を生じる'),
           ('exert an influence on …', '〜に影響を及ぼす'),
           ('ubiquitous', 'いたるところにある'),
           ('prudent', '賢明な，慎重な'),
           ('stakes', '（かかっている）利害'),
           ('happen to do', 'たまたま〜する'),
           ('end up with …', '結局〜を手にする'),
           ('considerable', 'かなりの'),
           ('procrastinate on …', '〜を先延ばしにする'),
           ('sheaf', '（書類の）束'),
           ('formidable', '強大な'),
           ('steer', '〜を導く'),
           ('exploit', '〜を（不当に）利用する'),
           ('thorny', '厄介な'),
           ('safeguard', '防御策'),
           ('autonomy', '自主性，自律'),
           ('postpone', '〜を延期する'),
           ('not unreasonably', '無理もなく'),
           ('give … up', '〜を手放す'),
           ('deliberately', '意図的に'),
           ('neutral', '中立の'),
           ('leave … to chance', '〜を成り行きに任せる'),
           ('get around to doing', 'ようやく〜に取りかかる'),
           ('well-intentioned', '善意の'),
           ('openly', '公然と，隠さずに')]}
