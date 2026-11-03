# -*- coding: utf-8 -*-
# 第2回 大問I（科学：睡眠と記憶の定着）
PART = {'roman': 'I',
 'points': 35,
 'intro': '次の文章は，睡眠と記憶の関係を論じた英文である。よく読んで，後の問1〜5に答えなさい。',
 'passage': ['Students preparing for an important examination often treat sleep as a luxury they cannot '
             'afford. When there is too much to learn and too little time, shaving a few hours off the night '
             'seems like an easy way to gain extra time for study. The logic appears simple: time spent '
             'asleep is time not spent learning. Yet a growing body of research suggests that {u1|this '
             'reasoning} rests on a mistaken picture of how memory works. Sleep, it turns out, is not a '
             'pause in learning but one of its indispensable stages.',
             'For a long time, sleep was thought of mainly as rest, a period in which the brain, like a '
             'fatigued muscle, simply recovered from the exertions of the day. We now know that the sleeping '
             'brain is far from idle. During certain stages of sleep, brain activity is in some respects as '
             'vigorous as it is during waking hours. Much of this activity appears to be devoted to '
             'processing what happened during the day: sifting through experiences, reinforcing some '
             'connections between nerve cells, and allowing others to wane.',
             'A useful way to understand this is to think of memory as having at least two stages. When we '
             'first learn something, the new information is held in a fragile form that can easily be '
             '{ua|disrupted} by fresh experiences or simply dwindle away. To last, it must be stabilized and '
             'linked to what we already know, a process that scientists call consolidation*. Many '
             'researchers believe that a large part of consolidation takes place while we sleep, when the '
             'brain is no longer {ub|flooded} with new input from the senses and can turn its attention '
             'inward.',
             'Evidence for this comes from a simple kind of experiment that has been replicated in many '
             'forms. Participants learn a list of words or a new skill, such as a sequence of finger '
             'movements, and are tested some hours later. Those who have slept in between generally perform '
             'better than those who have stayed awake for the same length of time. ( A ) the difference is '
             'not always large, it appears consistently, and in tasks involving movement, people sometimes '
             'do better after sleep than they did at the end of the original practice, as if the brain had '
             'continued to {uc|rehearse} without them.',
             'Sleep also seems to do something more creative than storing memories exactly as they were. It '
             'appears to help the brain discern patterns and connections that were not obvious at first. '
             'People who are given a puzzle containing a hidden rule are more likely to uncover that rule '
             'after a night of sleep than after an equal period awake. In this sense, sleep may not only '
             'safeguard what we have learned but also help us understand it more ( B ).',
             'None of this means that sleeping is a substitute for studying. The brain can only consolidate '
             'what it has taken in, and a good night of sleep after an afternoon spent watching videos will '
             'not produce a knowledge of chemistry. What the research does suggest is that study and sleep '
             'work in tandem. Information that is studied late at night but not followed by adequate sleep '
             'is less likely to be retained. {u2|This means that the hours gained by staying awake may be '
             'paid for with the very learning they were meant to produce.}',
             'Fortunately, the practical lessons are far from elaborate. Distributing study over several '
             'days, rather than ( C ) it into one long session, gives the brain several nights in which to '
             'consolidate what has been learned. Keeping regular hours is beneficial, too, since the stages '
             'of sleep that matter most for memory are easily curtailed when we go to bed late or wake up '
             'early. Students who heed such advice may find that they remember more while spending fewer '
             'hours at their desks, a result that seems {ud|paradoxical} only if we still regard sleep as '
             'wasted time.'],
 'notes': [('consolidation', '（記憶の）定着'), ('nerve cells', '神経細胞')],
 'questions': [{'no': 1,
                'points': 8,
                'kind': 'ja_limit',
                'limit': 40,
                'stem': '下線部(1)の this reasoning が表す内容を，40字以内でまとめなさい（句読点も1字と数える）。',
                'answer': '睡眠中は学習できないので，睡眠を削れば勉強時間が増え，多く学べるという考え。',
                'alts': ['眠る時間は学びに使えないので，夜の睡眠を減らせば勉強時間を増やせるという考え。'],
                'criteria': [('眠っている時間は学習していない（学習に使えない）時間であるという前提', 3),
                             ('睡眠を削る（夜の数時間を削る）こと', 2),
                             ('勉強時間が増える（より多く学べる）という結論', 3)],
                'explain': ['this reasoning は直前の2文を受ける。“shaving a few hours off the night seems like an easy '
                            'way to gain extra time for study” と “The logic appears simple: time spent '
                            'asleep is time not spent learning.”',
                            '「眠っている時間＝学んでいない時間」という前提と，「だから睡眠を削れば勉強時間が増える」という結論の両方を入れる。',
                            '直後の “rests on a mistaken picture of how memory works” は筆者の評価であり，this reasoning '
                            'の中身ではないので入れない。']},
               {'no': 2,
                'points': 8,
                'kind': 'synonym',
                'stem': '下線部(a)〜(d)の語について，文脈に即した意味として最もふさわしいものを，それぞれの選択肢(あ)〜(え)から一つ選び，記号で答えなさい。',
                'items': [{'label': 'a',
                           'word': 'disrupted',
                           'choices': ['recorded', 'repeated', 'disturbed', 'organized'],
                           'answer': 2,
                           'why': '新しい情報はもろく，新たな経験によって「乱される（妨げられる）」こともあれば消えることもある。(あ)(え)(い)はいずれも記憶を保つ方向の語で，“fragile” '
                                  '“dwindle away” の流れと合わない。'},
                          {'label': 'b',
                           'word': 'flooded',
                           'choices': ['supplied with water', 'overwhelmed', 'washed', 'emptied'],
                           'answer': 1,
                           'why': '“flooded with new input from the '
                                  'senses”＝感覚からの新しい情報が「どっと押し寄せる（あふれる）」。(う)(あ)は flood の文字どおりの意味（洪水・水）で目的語 '
                                  'input と合わない。(え)は逆の意味。'},
                          {'label': 'c',
                           'word': 'rehearse',
                           'choices': ['practice', 'perform in public', 'relax', 'forget'],
                           'answer': 0,
                           'why': '眠った後に練習終了時より上達していることがある →「脳が本人の代わりに練習し続けたかのよう」。rehearse '
                                  'は「（本番に向けて）練習する」。(い)は練習の後に来る「本番」の意味で逆。(え)(う)は上達の説明にならない。'},
                          {'label': 'd',
                           'word': 'paradoxical',
                           'choices': ['temporary', 'obvious', 'contradictory', 'dangerous'],
                           'answer': 2,
                           'why': '「勉強時間を減らしてもより多く覚えられる」は，睡眠を無駄な時間と考える限り「矛盾しているように見える」。(い)「明らかな」は “only if '
                                  '…” の条件と逆。(え)(あ)は文脈と無関係。'}]},
               {'no': 3,
                'points': 5,
                'kind': 'combo',
                'stem': '本文中の( A )〜( C )を補うのに最もふさわしい語の組を，選択肢(あ)〜(え)から一つ選び，記号で答えなさい。',
                'cols': ['( A )', '( B )', '( C )'],
                'rows': [['Although', 'deeply', 'cramming'],
                         ['Although', 'narrowly', 'dividing'],
                         ['Because', 'deeply', 'dividing'],
                         ['Unless', 'narrowly', 'cramming']],
                'answer': 0,
                'explain': ['( A )：「差はいつも大きいわけではないが，一貫して現れる」という譲歩の関係なので Although。Because '
                            'では「差が大きくないから一貫して現れる」となり因果が成り立たない。Unless（〜でない限り）も意味が通らない。',
                            '( B )：「学んだことを守るだけでなく，より深く理解する助けにもなる」。直前の「隠れた規則に気づく」と合うのは '
                            'deeply。narrowly（狭く）では理解が進むことにならない。',
                            '( C )：「何日にも分けて勉強する，1回の長い勉強に詰め込むのではなく」。rather than の後は「分ける」と対立する '
                            'cramming（詰め込む）。dividing（分ける）では「1回の長い勉強に分ける」となり矛盾する。',
                            '以上から Although / deeply / cramming の(あ)。(う)は( A )( C )，(い)は( B )( C )，(え)は( A )( '
                            'B )が不可。']},
               {'no': 4,
                'points': 8,
                'kind': 'trans_ref',
                'stem': '下線部(2)を，This が指す内容を具体的に示して和訳しなさい。',
                'answer': '夜遅くに勉強した情報も，その後に十分な睡眠をとらなければ記憶に残りにくいということは，起きていることで得た時間の代償として，その時間が生み出すはずだったまさにその学習が失われるかもしれないということを意味する。',
                'alts': ['夜遅くに学んでも十分に眠らなければ情報は定着しにくいということは，徹夜で得た数時間が，それによって得られるはずだった学習そのものと引き換えになるおそれがあるということだ。'],
                'criteria': [('This＝夜遅くに勉強しても十分な睡眠をとらなければ記憶に残りにくいこと', 3),
                             ('the hours gained by staying awake：起きていることで得た時間', 1),
                             ('be paid for with …：〜を代償とする（〜と引き換えになる）', 2),
                             ('the very learning they were meant to produce：その時間が生み出すはずだったまさにその学習', 2)],
                'explain': ['This は直前の文 “Information that is studied late at night but not followed by '
                            'adequate sleep is less likely to be retained.” を指す。',
                            'be paid for with A「Aで支払われる＝Aを代償とする」。the very＋名詞「まさにその〜」。they は the hours '
                            'を指し，were meant to produce は「生み出すはずだった」。',
                            '「勉強時間を増やすために起きていたのに，その勉強の成果そのものが失われる」という皮肉が訳文で伝わればよい。']},
               {'no': 5,
                'points': 6,
                'kind': 'tf2',
                'stem': '本文の内容に一致するものを，選択肢(あ)〜(か)から二つ選び，記号で答えなさい。',
                'choices': ['According to the passage, the brain is almost completely inactive during sleep.',
                            'New memories are fragile at first and need to be stabilized in order to last.',
                            'The author claims that sleeping well can replace studying for an examination.',
                            'A short nap after studying has been proven to be as effective as a full night '
                            'of sleep.',
                            'Sleep may help people notice rules or patterns that they did not see at first.',
                            'People who stay awake after learning a skill usually perform better than those '
                            'who sleep.'],
                'answer': [1, 4],
                'reasons': ['× 第2段落 “the sleeping brain is far from idle” と逆（本文と逆）。',
                            '○ 第3段落 “the new information is held in a fragile form … To last, it must be '
                            'stabilized” の言い換え。',
                            '× 第6段落 “None of this means that sleeping is a substitute for studying.” '
                            'と逆（本文と逆）。',
                            '× 昼寝については本文に記述がない（本文にない内容）。',
                            '○ 第5段落 “It appears to help the brain discern patterns and connections that were '
                            'not obvious at first.” の言い換え。',
                            '× 第4段落 “Those who have slept in between generally perform better than those who '
                            'have stayed awake” と逆（本文と逆）。']}],
 'translation': ['大切な試験の準備をしている学生は，しばしば睡眠を自分には手の届かないぜいたく品のように扱う。学ぶことが多すぎて時間が少なすぎるとき，夜の数時間を削ることは，勉強時間を増やす簡単な方法に思える。理屈は単純に見える。眠っている時間は学んでいない時間だ，というわけである。しかし，ますます多くの研究が，⑴この考え方は記憶の仕組みについての誤った理解に基づいていることを示している。睡眠は，学習の中断ではなく，学習に不可欠な段階の一つであることがわかってきたのである。',
                 '長い間，睡眠は主に休息，つまり疲労した筋肉と同じように，脳が一日の働きからただ回復する時間だと考えられていた。今では，眠っている脳は決して休んでなどいないことがわかっている。睡眠のある段階では，脳の活動はいくつかの点で起きているときと同じくらい活発である。この活動の多くは，その日に起こったことの処理に向けられているようだ。経験をふるいにかけて整理し，神経細胞どうしのつながりのいくつかを強め，ほかのつながりは弱まるにまかせるのである。',
                 'このことを理解するには，記憶に少なくとも二つの段階があると考えるとよい。何かを初めて学ぶとき，新しい情報はもろい形で保たれており，新たな経験によって簡単に(a)乱されたり，ただ消えてしまったりする。長く残るためには，それは安定させられ，すでに知っていることと結びつけられなければならない。科学者はこの過程を定着と呼ぶ。多くの研究者は，定着の大部分は私たちが眠っている間に起こると考えている。そのとき脳は，もはや感覚からの新しい情報に(b)圧倒されることがなく，注意を内側に向けることができるのである。',
                 'このことの証拠は，さまざまな形で繰り返されてきた単純な種類の実験から得られている。参加者は単語のリストや，指の動きの順序のような新しい技能を学び，数時間後にテストを受ける。その間に眠った人は，同じ時間起きていた人よりも，一般に成績がよい。差はいつも大きいわけではない（A：が），一貫して現れる。そして動きを伴う課題では，最初の練習の終わりよりも眠った後の方がうまくできることさえあり，まるで脳が本人のいないところで(c)練習を続けていたかのようである。',
                 '睡眠はまた，記憶をそのままの形で保存するよりも創造的なことをしているようだ。睡眠は，最初は明らかでなかったパターンやつながりを脳が見つけ出すのを助けるらしい。隠れた規則を含むパズルを与えられた人は，同じ時間起きていた後よりも，一晩眠った後の方がその規則に気づきやすい。この意味で，睡眠は学んだことを守るだけでなく，それをより（B：深く）理解する助けにもなるのかもしれない。',
                 'こうしたことはどれも，眠ることが勉強の代わりになるという意味ではない。脳は取り入れたものしか定着させることができず，午後を動画を見て過ごした後にぐっすり眠っても，化学の知識が生まれるわけではない。研究が示しているのは，勉強と睡眠は協力して働くということである。夜遅くに勉強した情報も，その後に十分な睡眠をとらなければ記憶に残りにくい。⑵このことは，起きていることで得た時間の代償として，その時間が生み出すはずだったまさにその学習が失われるかもしれないということを意味する。',
                 '幸い，実際の教訓は複雑なものではない。1回の長い勉強に（C：詰め込む）のではなく，何日かに分けて勉強すれば，学んだことを定着させる夜が脳に何回も与えられる。規則正しい生活をすることも役に立つ。記憶にとって最も重要な睡眠の段階は，遅く寝たり早く起きたりすると簡単に短くなってしまうからである。こうした助言を真剣に受け止める学生は，机に向かう時間を減らしながら，より多くを覚えていることに気づくかもしれない。それは，睡眠を今なお無駄な時間とみなす場合にのみ(d)矛盾しているように見える結果なのである。'],
 'vocab': [('luxury', 'ぜいたく品'),
           ('afford', '〜する余裕がある'),
           ('shave A off B', 'BからAを削る'),
           ('rest on …', '〜に基づく'),
           ('idle', '何もしていない，休んでいる'),
           ('in some respects', 'いくつかの点で'),
           ('be devoted to …', '〜に向けられる'),
           ('fragile', 'もろい'),
           ('fatigued', '疲労した'),
           ('reinforce', '〜を強化する'),
           ('dwindle away', '次第に消えていく'),
           ('disrupt', '〜を乱す，妨げる'),
           ('stabilize', '〜を安定させる'),
           ('consolidation', '（記憶の）定着'),
           ('flood A with B', 'AにBをあふれさせる'),
           ('consistently', '一貫して'),
           ('rehearse', '練習する，下稽古をする'),
           ('discern', '〜を見分ける，見つけ出す'),
           ('sift through …', '〜をふるいにかける，精査する'),
           ('indispensable', '不可欠な'),
           ('vigorous', '活発な'),
           ('replicate', '（実験）を再現する'),
           ('elaborate', '手の込んだ，複雑な'),
           ('substitute for …', '〜の代わり'),
           ('retain', '〜を保持する'),
           ('pay for A with B', 'Bを代償にAを得る'),
           ('cram', '〜を詰め込む'),
           ('keep regular hours', '規則正しい生活をする'),
           ('paradoxical', '逆説的な，矛盾して見える')]}
