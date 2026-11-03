# -*- coding: utf-8 -*-
# 第2回 Ⅱ 長文読解（エッセイ・書き下ろし「怖さを楽しむ」）
from mk import pos_for, mc1
pos = pos_for(2)

PASSAGE = [
 "On a cold evening in late autumn, cinemas fill with people who have paid good money to be frightened. Many of them will spend much of the film with their hands half over their eyes, holding tightly to the arm of the seat, and yet they will walk out into the night smiling and talking excitedly about the scenes that scared them most. Haunted houses at fairgrounds, ghost stories told in the dark, and rides that drop riders from a great height all attract eager crowds. {u1|At first sight this seems a strange way to spend free time, for fear is, after all, the emotion that evolved to keep us away from danger, not to draw us toward it.}",
 "To understand the puzzle, it helps to recall what fear does to the body. When we sense a threat, the heart beats faster, breathing quickens, muscles tighten and attention narrows to the source of danger. Stress-related chemicals are released into the blood, and for a brief period we may feel stronger and more alert than usual. These changes prepare us to fight or to run, and in a genuine emergency they can save a life. In ordinary circumstances, however, the same reactions feel {wa|distressing}: a racing heart and shaking hands are not what most people would choose to experience on a quiet afternoon. Few of us, after all, would describe a real accident or a sudden illness as entertaining, and nobody buys a ticket to be robbed.",
 "The key difference seems to be safety. While we watch a frightening film, the body reacts as though the threat were real, but the mind knows perfectly well that the monster on the screen cannot climb out of it. We experience the physical excitement of danger without its actual consequences. When the film ends, the alarm switches off, and what remains is a powerful sense of {wb|relief}, often mixed with a small feeling of pride at having endured it. In the end, {o2} that turns fear into fun. Remove that knowledge, and the same racing heart would feel like nothing but terror.",
 "A related explanation concerns control. People who enter a haunted house at a fair choose to go in, and they know that the door at the far end will open within a few minutes. The rider on a roller coaster understands that the ride, however wild, will be over before long. Even the scream that riders let out on the steepest drop is partly a performance, a way of joining in rather than a cry for help. Real fears are quite different. The worry that comes with losing a job or waiting to hear how a medical test turned out is not something we chose, and we cannot simply decide to end it. Frightening entertainment offers fear with a clear beginning and a clear end, and that boundary may be exactly what allows people to relax inside it.",
 "Being scared has a social side as well. Friends who watch a horror film together grab one another’s arms, scream at the same moments and laugh at themselves afterwards. Teenagers at a sleepover compete to tell the most chilling story, and the listeners huddle closer as the tale goes on. Such moments can strengthen friendships as calmer activities rarely do, because those frightened together feel that they have shared something real. Years later, the same friends may still laugh about the night they all refused to walk home alone after a particularly frightening film. {u3|Fear shared is, in a sense, fear halved, and the laughter that follows a scream is a way of telling one another that the danger is over.}",
 "Some thinkers have suggested that frightening stories may also serve as a kind of rehearsal. Traditional tales for children are full of hungry wolves, wicked witches and dark forests, and they have been told for generations even though they can keep a young listener awake at night. One possible reason is that such stories allow children to meet danger in a form they can manage. A child who hears how a clever girl escapes from a wolf learns, in a small way, that threats can be faced and overcome. The fear is real enough to be felt, but the story keeps it within limits that a child can handle. Adults reading such tales aloud often soften the most frightening parts or pause to reassure a worried listener, adjusting the level of fear to suit the child.",
 "Not everyone, of course, enjoys being frightened, and treating those who dislike horror films as simply less brave than others would be a mistake. {u4|People for whom frightening entertainment brings no pleasure} may find that the fear stays with them long after the film has ended, returning when they turn off the light or walk down a dark street. For some, imagined dangers feel uncomfortably close to things they have actually experienced, so that what others see as play feels to them like a reminder of real pain. Others simply find that their bodies take a long time to calm down. For such people, the line between pretend danger and real distress is too {wc|thin} to be comfortable, and avoiding scary films is a sensible choice rather than a weakness.",
 "This variety points to an important truth about frightening entertainment: it works only within limits. When the line between pretend and real disappears, fear stops being fun and becomes what it was originally meant to be, a warning. Yet the fact that so many people can enjoy it at all says something remarkable about human beings. We can borrow an emotion that developed to help our ancestors survive and use it for play, to share it with friends and even to draw lessons from it. Seen in this light, a crowd leaving a cinema with pounding hearts is not behaving strangely at all. It is simply showing how {wd|flexible} our emotions can be.",
]

NOTES = [('fairground', '移動遊園地'), ('sleepover', '友人宅でのお泊まり会'), ('huddle', '身を寄せ合う'), ('rehearsal', '予行演習')]

QUESTIONS = [
 {'no': 1, 'points': 12, 'kind': 'trans', 'stem': '下線部(1)を和訳せよ。',
  'answer': '一見すると，これは自由な時間の過ごし方としては奇妙に思える。というのも，結局のところ，恐怖とは私たちを危険に引き寄せるためではなく，危険から遠ざけるために進化した感情だからである。',
  'alts': ['ちょっと見たところ，これは余暇の使い方として変わっているように思われる。そもそも恐怖は，人を危険へと近づけるのではなく，危険から離しておくために発達してきた感情なのだから。'],
  'criteria': [('At first sight「一見すると」', 2),
               ('this seems a strange way to spend free time「これは自由な時間の過ごし方として奇妙に思える」', 3),
               ('for 〜「というのも〜だから」（理由を表す接続詞）', 2),
               ('the emotion that evolved to keep us away from danger「危険から遠ざけるために進化した感情」', 3),
               ('not to draw us toward it との対比（not A but B の変形：A, not B）', 2)],
  'explain': ['for はここでは前置詞ではなく，理由を補足する接続詞。「〜のために」と訳すと誤り。',
              'after all は「結局のところ・そもそも」。相手も知っている理由を持ち出すときの表現。',
              'keep O away from 〜「Oを〜から遠ざけておく」と draw O toward 〜「Oを〜へ引き寄せる」が対比されている。it は danger を指す。',
              'evolve は「進化する・発達する」。to keep は目的を表す副詞的用法。']},
 {'no': 3, 'points': 10, 'kind': 'ja_free', 'stem': '下線部(3)が具体的に表している内容を，本文に沿って日本語で説明せよ。',
  'answer': '友人どうしで一緒に怖い思いをすると，一人で感じるよりも恐怖が軽くなり，悲鳴のあとにみんなで笑うことは，もう危険は去ったのだと互いに確かめ合う合図になるということ。',
  'alts': ['恐怖は仲間と分かち合うことで和らぎ，叫んだあとに起こる笑いには「もう大丈夫だ」と伝え合う働きがあるということ。そうした経験は友情を深めることにもつながる。'],
  'criteria': [('恐怖を仲間と分かち合うと，恐怖が軽くなる（fear halved の比喩の説明）', 4),
               ('悲鳴のあとの笑い＝危険が去ったことを互いに伝え合う合図', 4),
               ('友人と一緒に怖がる場面（ホラー映画・怪談など）が前提であることを示す', 2)],
  'explain': ['“Fear shared is, in a sense, fear halved” は「分かち合った恐怖は半分になる」という比喩。「半分になる」を数量の話と取らず，「軽くなる・和らぐ」と説明する。',
              'a way of telling one another that … は「互いに…と伝え合う方法」。誰が誰に伝えるのかを明確にする。',
              '同じ段落の “those frightened together feel that they have shared something real” を補足に使ってもよい。']},
 {'no': 2, 'points': 6, 'kind': 'order', 'under': '2',
  'stem': '下線部(2)の［　］内の語を正しく並べて意味の通る英文にするとき，3番目・6番目・9番目にくる語の記号を書け。各語は一度ずつ用いること。',
  'words': ['nothing', 'is', 'hurt', 'the', 'it', 'that', 'us', 'knowledge', 'really', 'can'],
  'correct': ['E', 'B', 'D', 'H', 'F', 'A', 'J', 'I', 'C', 'G'], 'ask': [3, 6, 9],
  'sentence_part': 'it is the knowledge that nothing can really hurt us',
  'sentence': 'In the end, it is the knowledge that nothing can really hurt us that turns fear into fun.',
  'explain': ['It is A that …「…なのはAだ」の強調構文。下線部の後の that turns fear into fun が強調構文の that にあたる。',
              '強調されるのは the knowledge that nothing can really hurt us「何も本当には自分を傷つけられないという認識」。knowledge の後の that は同格の接続詞。',
              '同格節の中は nothing can really hurt us。副詞 really は助動詞 can と動詞 hurt の間に置く。',
              '3番目 the (D)・6番目 nothing (A)・9番目 hurt (C)。']},
 mc1(4, 6, '下線部(4)の人々の説明として，本文と合致しないものを(A)〜(D)のうちから一つ選び，その記号を書け。',
     ['They lack the courage that people who enjoy horror films have.',
      'They may keep feeling afraid long after the film has finished.',
      'Imagined dangers may remind them of painful things that really happened to them.',
      'Their bodies may need a long time to become calm again.'],
     ['○ 当てはまらない。第7段落冒頭で筆者は，ホラー映画が嫌いな人を「単に勇気が足りない」とみなすのは誤りだと述べ，最後に「弱さではなく賢明な選択だ」としている（本文と逆）。',
      '× 当てはまる。“the fear stays with them long after the film has ended” と一致する。',
      '× 当てはまる。“imagined dangers feel uncomfortably close to things they have actually experienced” と一致する。',
      '× 当てはまる。“their bodies take a long time to calm down” と一致する。'], pos()),
 {'no': 5, 'points': 8, 'kind': 'tf2',
  'stem': '本文の内容と合うものを(A)〜(E)のうちから二つ選び，その記号を書け。',
  'choices': ['The writer regards fear as an emotion that originally developed to protect people from danger.',
              'People enjoy frightening films because their bodies hardly react to what appears on the screen.',
              'Knowing that a frightening experience will end soon can make it easier to enjoy.',
              'Anyone who avoids horror films is described in the passage as lacking courage.',
              'The writer insists that traditional tales should no longer include wolves and witches.'],
  'answer': [0, 2],
  'reasons': ['○ 第1段落 “the emotion that evolved to keep us away from danger” と一致する。',
              '× 第3段落は “the body reacts as though the threat were real” と述べている（本文と逆）。',
              '○ 第4段落の遊園地やジェットコースターの例と，“that boundary may be exactly what allows people to relax inside it” と一致する。',
              '× 第7段落は，そのようにみなすのは誤りだと述べている（本文と逆）。',
              '× 第6段落は昔話が子どもに危険と向き合う練習をさせる可能性を述べており，オオカミや魔女を除くべきだとは言っていない（本文に記述なし）。']},
 {'no': 6, 'points': 8, 'kind': 'synonym',
  'stem': '下線部(a)〜(d)の文脈上の意味に最も近い語句を，それぞれ(A)〜(D)のうちから一つ選び，その記号を書け。',
  'items': [
   {'label': 'a', 'word': 'distressing', 'choices': ['upsetting', 'refreshing', 'boring', 'surprising'], 'answer': 0,
    'reason': '心臓がどきどきし手が震えるのは，静かな午後に誰も経験したくないもの，と続く。「苦痛を与える・動揺させる」の意味で upsetting が最も近い。'},
   {'label': 'b', 'word': 'relief', 'choices': ['regret', 'confusion', 'ease after worry', 'fresh fear'], 'answer': 2,
    'reason': '映画が終わって警報が止まったあとに残る気持ち。「不安が去ったあとの安心」で ease after worry が最も近い。'},
   {'label': 'c', 'word': 'thin', 'choices': ['wide', 'narrow', 'clear', 'heavy'], 'answer': 1,
    'reason': '作り物の危険と本物の苦痛の「境界線が薄い（細い）」＝両者の間の差がほとんどない，という意味。narrow が最も近い。'},
   {'label': 'd', 'word': 'flexible', 'choices': ['fragile', 'predictable', 'dangerous', 'adaptable'], 'answer': 3,
    'reason': '生き延びるために発達した感情を遊びや学びに転用できる，という段落の内容から「柔軟な・適応できる」の意味。adaptable が最も近い。'}]},
]

TRANSLATION = [
 '晩秋の寒い夜，映画館は，怖がるために少なからぬお金を払った人々でいっぱいになる。その多くは映画の大半を，手で目を半分おおい，座席のひじ掛けをしっかり握りしめて過ごすのだが，それでも笑顔で夜の街へ出ていき，いちばん怖かった場面について興奮して語り合う。遊園地のお化け屋敷，暗闇で語られる怪談，高いところから乗客を落下させる乗り物は，どれも熱心な人々を大勢引きつける。一見すると，これは自由な時間の過ごし方としては奇妙に思える。というのも，結局のところ，恐怖とは私たちを危険に引き寄せるためではなく，危険から遠ざけるために進化した感情だからである。',
 'この謎を理解するには，恐怖が体に何をもたらすかを思い出すとよい。脅威を感じると，心臓の鼓動は速まり，呼吸は荒くなり，筋肉はこわばり，注意は危険の源へと絞られる。ストレスにかかわる化学物質が血液中に放出され，しばらくの間，私たちはふだんより力がみなぎり，注意が研ぎ澄まされたように感じることもある。こうした変化は戦うか逃げるかの準備をさせるものであり，本当の緊急時には命を救うこともある。しかし，ふだんの状況では同じ反応はつらく感じられる。どきどきする心臓や震える手は，たいていの人が静かな午後に経験したいと思うものではない。そもそも本物の事故や突然の病気を楽しいと言う人はほとんどいないし，強盗に遭うために切符を買う人もいない。',
 '決定的な違いは安全にあるようだ。怖い映画を見ている間，体は脅威が本物であるかのように反応するが，心は画面の中の怪物がそこから這い出してこられないことを十分にわかっている。私たちは危険の実際の結果を伴わずに，危険の身体的な興奮を経験するのである。映画が終わると警報は止まり，あとに残るのは強い安堵感であり，そこには耐え抜いたというささやかな誇らしさが混じっていることも多い。結局のところ，恐怖を楽しみに変えるのは，何も本当には自分を傷つけられないという認識なのである。その認識を取り除けば，同じどきどきする心臓も，ただの恐怖としか感じられないだろう。',
 'これに関連する説明として，自分で制御できるかどうかがある。遊園地のお化け屋敷に入る人は，自分で入ることを選んでおり，数分以内に奥の扉が開くことを知っている。ジェットコースターに乗る人は，どれほど激しくても乗り物がまもなく終わることを理解している。いちばん急な落下で乗客が上げる悲鳴でさえ，一部は演技であり，助けを求める叫びというより，その場に加わるための方法なのである。本物の恐怖はまったく違う。仕事を失うことや医療検査の結果を待つことに伴う不安は，自分で選んだものではなく，終わらせようと決めて終わらせられるものでもない。怖い娯楽は，始まりと終わりがはっきりした恐怖を提供しており，その境界こそが，人々がその中でくつろぐことを可能にしているのかもしれない。',
 '怖がることには社会的な側面もある。一緒にホラー映画を見る友人たちは，互いの腕をつかみ，同じ瞬間に悲鳴を上げ，あとで自分たちのことを笑う。お泊まり会の十代の若者たちは，いちばん背筋の凍る話をしようと競い合い，話が進むにつれて聞き手は身を寄せ合う。こうした瞬間は，もっと穏やかな活動ではめったに得られない形で友情を強めることがある。一緒に怖い思いをした人々は，何か本物のものを分かち合ったと感じるからである。何年もたってから，同じ友人たちが，とりわけ怖い映画を見たあと誰も一人で歩いて帰ろうとしなかった夜のことを，今でも笑いながら話すこともある。分かち合った恐怖は，ある意味で半分になった恐怖であり，悲鳴のあとに起こる笑いは，もう危険は去ったと互いに伝え合う方法なのである。',
 '怖い物語は一種の予行演習の役割も果たしているのではないかと述べる思想家もいる。子ども向けの昔話は，腹を空かせたオオカミや悪い魔女や暗い森でいっぱいで，幼い聞き手を夜眠れなくすることがあるにもかかわらず，何世代にもわたって語り継がれてきた。考えられる理由の一つは，そうした物語が，子どもたちに扱える形で危険と出会わせるということである。賢い少女がオオカミから逃げ出す話を聞いた子どもは，脅威には立ち向かい，乗り越えることができるのだと，ささやかながら学ぶ。恐怖は感じられるほどには本物だが，物語はそれを子どもが対処できる範囲にとどめておくのである。そうした話を読み聞かせる大人は，最も怖い部分をやわらげたり，不安そうな聞き手を安心させるために間を置いたりして，恐怖の度合いを子どもに合わせて調節することが多い。',
 'もちろん，誰もが怖がることを楽しむわけではなく，ホラー映画が嫌いな人を，単に他の人より勇気がないとみなすのは誤りだろう。怖い娯楽に何の楽しみも感じない人々は，映画が終わったずっと後まで恐怖が残り，明かりを消したときや暗い通りを歩くときにそれがよみがえることに気づくかもしれない。想像上の危険が，実際に経験したことにあまりにも近く感じられるため，他の人が遊びとみなすものが，本物の苦しみを思い出させるものに感じられる人もいる。また，単に体が落ち着くまでに長い時間がかかる人もいる。そうした人々にとって，作り物の危険と本物の苦痛との境界はあまりに薄く，快適ではいられない。そして怖い映画を避けることは，弱さではなく賢明な選択なのである。',
 'この多様さは，怖い娯楽についての重要な真実を示している。それは限度の中でしか成り立たないということだ。作り物と本物の境界が消えると，恐怖は楽しみではなくなり，もともとそうであるはずだったもの，つまり警告になる。しかし，それほど多くの人がそもそも恐怖を楽しめるという事実は，人間について驚くべきことを物語っている。私たちは，祖先が生き延びるのを助けるために発達した感情を借りてきて，遊びに使い，友人と分かち合い，さらにはそこから学ぶことさえできるのだ。このように見ると，胸を高鳴らせながら映画館を出ていく人々は，まったく奇妙な振る舞いをしているわけではない。ただ，私たちの感情がどれほど柔軟でありうるかを示しているだけなのである。',
]

VOCAB = [
 ('evolve', '進化する・発達する'), ('quicken', '速くなる'), ('genuine', '本物の'), ('consequence', '結果'),
 ('endure', '〜に耐える'), ('boundary', '境界'), ('chilling', '背筋の凍るような'), ('strengthen', '〜を強める'),
 ('wicked', '邪悪な'), ('overcome', '〜を乗り越える'), ('distress', '苦痛・苦悩'), ('sensible', '賢明な・分別のある'),
 ('remarkable', '驚くべき'), ('ancestor', '祖先'), ('pounding', '（心臓が）どきどきする'),
]

QUESTIONS.sort(key=lambda q: q['no'])
P = {'passage': PASSAGE, 'notes': NOTES, 'questions': QUESTIONS, 'translation': TRANSLATION, 'vocab': VOCAB}
