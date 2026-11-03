# -*- coding: utf-8 -*-
# 第1回 大問1 長文読解（論説・書き下ろし）。{u1|…} 下線部(1)・( ア ) 空所
from mk import pos_for, mc1
pos = pos_for(1)

PASSAGE = [
 "Not long ago, a teacher I know asked her class of sixteen-year-olds to write a short letter by hand to someone they admired. Several students hesitated before they began, and one boy admitted that he could not remember the last time he had written more than a few lines without a keyboard. His remark was not unusual. In many countries, people now type, tap, and swipe far more often than they hold a pen, and handwriting has quietly moved from the center of daily life to its edges. This shift raises a question that might once have seemed strange: what, if anything, do we lose when we stop writing by hand?",
 "One common answer is that nothing important is lost at all. According to this view, handwriting is simply a tool, like a typewriter or a fax machine, and tools are replaced when better ones appear. Typing is faster for most adults, typed text is easier to read, and a document stored on a computer can be searched, copied, and shared in seconds. {u1|If the purpose of writing is to put words in a form that others can use, it is hard to see why anyone should spend years training a hand to do slowly what a machine does quickly and well.}",
 "Yet people who teach writing often notice something that this practical argument leaves out. When students take notes by hand, they cannot record every word a speaker says, so they are forced to ( ア ). They must decide what matters, put it in their own words, and connect it to what they already know. A laptop, by contrast, lets a student copy a lecture almost word for word without thinking very hard about its meaning. The slowness of the pen may therefore be less a weakness than a hidden advantage, because it obliges the writer to process ideas rather than merely store them.",
 "There is also the matter of memory and attention. Forming letters by hand involves a series of small, deliberate movements, and many teachers believe that this physical effort helps fix words and ideas in the mind. Typing, in comparison, requires much the same simple motion for every letter, and it is easily interrupted by messages, alerts, and the temptation to open another window. {u2|A sheet of paper, however, offers no such distractions; it waits patiently for whatever the writer decides to put on it.} For people who find it difficult to concentrate in front of a screen, this quietness can be surprisingly valuable.",
 "Handwriting carries personal meaning as well. A typed message looks much the same whoever sends it, but a handwritten note shows the writer’s hand in a very literal sense: the pressure of the pen, the shape of the letters, even the places where a word was crossed out and written again. Many people keep letters from relatives or old friends long after they have deleted thousands of emails. {u3|This happens not because the handwritten words are wiser, but because they seem to preserve a trace of the person who wrote them, a sign that someone took time and care to communicate.}",
 "None of this means that schools should abandon keyboards or that adults should feel guilty about typing. Digital tools have made writing available to people who once struggled with it, including those for whom holding a pen is painful, and they allow us to revise and share our work in ways earlier generations could not have imagined. The real question is not which method is better in every situation, but which method suits a particular purpose. A shopping list, a business report, and a diary entry make different ( イ ) on the writer, and there is no reason the same tool should serve all of them equally well.",
 "Perhaps the most sensible approach, then, is to think of handwriting not as an old habit to be defended or discarded, but as one skill among several that a thoughtful writer can choose to use. Someone who can type quickly and also write clearly by hand has more options than someone who can do only one. The teacher who asked her students to write letters found that, once they had overcome their initial reluctance, most of them enjoyed the task, and several said they intended to send their letters by post. Their experience suggests that the pen has lost not its power so much as its place, and that its place may yet be found again.",
]

QUESTIONS = [
 {'no': 1, 'points': 8, 'kind': 'trans', 'stem': '下線部(1)を和訳せよ。',
  'answer': '書くことの目的が，言葉を他人が使える形にすることであるなら，機械が速くうまくやってのけることをゆっくりとやれるように，わざわざ何年もかけて手を訓練すべき理由はわかりにくい。',
  'alts': ['文章を書く目的が他の人に使える形で言葉を残すことにあるのなら，機械がすばやく上手にこなすことを時間をかけて行うために何年も手を鍛える必要がなぜあるのか，理解しがたい。'],
  'criteria': [('If 節「書くことの目的が〜であるなら」', 2), ('put words in a form that others can use「言葉を他人が使える形にする」', 2),
               ('it is hard to see why anyone should …「〜すべき理由はわかりにくい」', 2), ('to do slowly what a machine does quickly and well（what＝〜すること）', 2)],
  'explain': ['it is hard to see why … は「なぜ〜なのかわかりにくい」。see は「理解する」の意味。',
              'what a machine does quickly and well の what は先行詞を含む関係代名詞で「機械が速くうまくやること」。slowly と quickly and well の対比を訳に残す。',
              'spend years training a hand は「spend＋時間＋doing（〜して時間を過ごす）」の形。「手を訓練するのに何年も費やす」。',
              '筆者自身の主張ではなく，第2段落冒頭の “nothing important is lost at all” という立場の論理であることに注意（第3段落の Yet で反論が始まる）。']},
 mc1(2, 5, '( ア )を補うのにふさわしいものを，(A)〜(D)のうちから一つ選べ。',
     ['select and summarize what they hear', 'write as quickly as they possibly can', 'rely on the speaker’s own slides', 'stop listening for a while'],
     ['○ 直後の文 “They must decide what matters, put it in their own words” が空欄の言い換え。すべては書き取れないので「取捨選択して要約する」しかない。',
      '× 速く書こうとしても全部は書けない，というのが前提。後ろの “decide what matters” とつながらない。',
      '× スライドに頼る話は本文にない（本文に記述なし）。手書きのメモが「自分の言葉で」まとめさせる，という流れと逆。',
      '× 聞くのをやめると内容を処理できない。第3段落の「考えを処理させる」という結論に合わない。'], pos()),
 mc1(3, 5, '下線部(2)の言わんとすることに最も近いものを，(A)〜(D)のうちから一つ選べ。',
     ['Paper does not compete with the writer for attention.', 'Paper is more patient than any reader of the text.',
      'Writing on paper takes more time than writing on a screen.', 'Paper is less convenient because it cannot send messages.'],
     ['○ no such distractions の such は直前の “messages, alerts, and the temptation to open another window” を指す。紙は注意をそらすものを出さない＝書き手の注意を奪い合わない。',
      '× waits patiently は紙を擬人化した表現で，読み手との比較ではない（範囲のずれ）。',
      '× 時間の長短は第3段落の話題。下線部は注意をそらすものがないことを述べている。',
      '× 紙がメッセージを送れないことを欠点として述べているのではなく，むしろ利点として述べている（本文と逆）。'], pos()),
 {'no': 4, 'points': 10, 'kind': 'trans', 'stem': '文頭の This が指す内容を具体的に示しつつ，下線部(3)を和訳せよ。',
  'answer': '多くの人が何千通ものメールを削除した後も親類や旧友からの手紙を長く手元に残しておくのは，手書きの言葉のほうが賢明だからではなく，それを書いた人の痕跡，つまり誰かが時間と心を注いで気持ちを伝えようとしたしるしを残しているように思えるからである。',
  'alts': ['何千ものメールを消してしまった後でも，親戚や昔の友人からの手紙を多くの人がずっと取っておくのは，手で書かれた言葉がより賢いからではない。書いた本人の名残，すなわち誰かが手間と思いやりをかけて伝えようとしたことの証を，そうした言葉がとどめているように感じられるからである。'],
  'criteria': [('This の内容「多くの人がメールを消した後も手紙を長く取っておくこと」を示す', 3), ('not because A but because B「AだからではなくBだから」（This happens＝そうなるのは）', 2),
               ('seem to preserve a trace of the person who wrote them「書いた人の痕跡を残しているように思える」', 3), ('同格 a sign that …「〜というしるし」と take time and care', 2)],
  'explain': ['This は直前の文 “Many people keep letters from relatives or old friends long after they have deleted thousands of emails.” の内容。long after … は「〜したずっと後も」。',
              'not because … but because … の構文。the handwritten words are wiser は比較級で「（印字の言葉より）賢い」。',
              'a sign that someone took time and care to communicate は a trace of the person … の言い換え（同格）。take time and care to do「時間と気づかいをかけて〜する」。',
              'preserve は「保存する・残す」。they は the handwritten words を指す。']},
 mc1(5, 5, '( イ )を補うのにふさわしい語を，(A)〜(D)のうちから一つ選べ。',
     ['demands', 'promises', 'mistakes', 'excuses'],
     ['○ make demands on 人「人に（負担・要求を）課す」。買い物メモ・業務報告・日記は書き手に求めるものが違うので，同じ道具がどれにも合うとは限らない，という文意になる。',
      '× make promises は「約束する」。主語は買い物メモなどの文書で，書き手に約束をすることはない。',
      '× make mistakes on は「〜でまちがえる」の意味になり，文書が主語では成り立たない。',
      '× make excuses は「言い訳をする」。文脈に合わない。'], pos()),
 {'no': 6, 'points': 9, 'kind': 'tf2', 'stem': '本文の趣旨に合致する英文を，(A)〜(F)のうちから二つ選べ。',
  'choices': ['The teacher found that all of her students refused to write letters by hand at first.',
              'In the author’s view, the slowness of writing by hand can help learners think about what they are recording.',
              'The author argues that schools should stop teaching typing and return to the pen.',
              'The author expects handwriting to vanish completely from everyday life before long.',
              'According to the passage, handwritten letters are often kept because they seem to carry something of the writer.',
              'Typed messages are described as more personal than handwritten ones because they are easier to read.'],
  'answer': [1, 4],
  'reasons': ['× 第1段落は “Several students hesitated” で，全員が拒んだわけではない。最終段落でも多くが楽しんだとある（言い過ぎ）。',
              '○ 第3段落 “The slowness of the pen may therefore be less a weakness than a hidden advantage” と一致。',
              '× 第6段落 “None of this means that schools should abandon keyboards” と逆（本文と逆）。',
              '× 最終段落は「場所を失っただけで，再び見つかるかもしれない」と述べている（本文と逆）。',
              '○ 第5段落 “they seem to preserve a trace of the person who wrote them” と一致。',
              '× 第5段落では印字の文は誰が送っても同じに見えるとあり，個人的なのは手書きのほう（本文と逆）。']},
]

TRANSLATION = [
 '少し前，知り合いの教師が16歳の生徒たちのクラスで，尊敬する人に宛てて短い手紙を手書きで書くよう課題を出した。書き始める前にためらう生徒が何人もいて，ある男子は，キーボードを使わずに数行以上書いたのがいつ以来か思い出せないと打ち明けた。彼の発言は珍しいものではない。多くの国で，人々は今やペンを握るよりもはるかに頻繁に文字を打ち込み，画面をたたき，指でなぞっている。そして手書きは，日常生活の中心からその周縁へと，ひっそり移ってしまった。この変化は，かつてなら奇妙に思えたかもしれない問いを投げかける。手で書くことをやめたとき，私たちは何かを失うのだろうか，失うとすればそれは何なのか。',
 'よくある答えの一つは，大切なものは何も失われないというものだ。この見方によれば，手書きはタイプライターやファクスと同じ単なる道具にすぎず，道具はよりよいものが現れれば取って代わられる。たいていの大人にとって打ち込むほうが速く，印字された文章のほうが読みやすく，コンピューターに保存された文書は数秒で検索も複製も共有もできる。(1)書くことの目的が，言葉を他人が使える形にすることであるなら，機械が速くうまくやってのけることをゆっくりとやれるように，わざわざ何年もかけて手を訓練すべき理由はわかりにくい。',
 'だが，書くことを教える人々は，この実用的な議論が見落としている点にしばしば気づく。生徒が手でノートをとるとき，話し手の言葉をすべて書き留めることはできないので，聞いたことを取捨選択して要約せざるをえない。何が重要かを判断し，それを自分の言葉に置き換え，すでに知っていることと結びつけなければならないのだ。対照的に，ノートパソコンを使えば，内容についてたいして考えなくても講義をほぼ一語一語写すことができる。したがって，ペンの遅さは弱点というよりむしろ隠れた利点なのかもしれない。というのも，それによって書き手は考えを単に蓄えるのではなく，処理することを強いられるからである。',
 '記憶と注意の問題もある。手で文字を形づくるには，小さく意図的な動きを連続して行う必要があり，多くの教師は，この身体的な努力が言葉や考えを頭に定着させる助けになると考えている。一方，キーボードで打つ動作はどの文字でもほぼ同じ単純な動きで，メッセージや通知，別のウィンドウを開きたくなる誘惑によって簡単に中断される。(2)しかし一枚の紙は，そのように気を散らすものを何も差し出さない。書き手がそこに何を書こうと決めるのであれ，紙は辛抱強く待っていてくれる。画面の前で集中するのが難しい人にとって，この静けさは驚くほど価値がありうる。',
 '手書きには個人的な意味もある。印字されたメッセージは誰が送ってもほとんど同じに見えるが，手書きのメモは，まさに文字どおりの意味で書き手の「手」を示す。ペンの筆圧，文字の形，さらには一度線で消して書き直した箇所までもがそうだ。多くの人が，何千通ものメールを削除した後も，親類や旧友からの手紙を長く手元に残している。(3)それは手書きの言葉のほうが賢明だからではなく，それを書いた人の痕跡，つまり誰かが時間と心を注いで気持ちを伝えようとしたしるしを残しているように思えるからである。',
 'こうしたことはどれも，学校がキーボードを捨てるべきだとか，大人が文字を打つことに罪悪感を覚えるべきだとかいうことを意味するわけではない。デジタルの道具のおかげで，かつて書くことに苦労していた人々，たとえばペンを持つと痛みを感じる人々にも書くことが可能になったし，前の世代には想像もできなかったやり方で文章を推敲し共有できるようになった。本当の問題は，どの方法があらゆる場面で優れているかではなく，どの方法が特定の目的に合っているかである。買い物メモと業務報告と日記とでは，書き手に求めるものが異なるのであり，同じ道具がそのすべてに等しく役立たなければならない理由はない。',
 'それならおそらく最も賢明な考え方は，手書きを，守るべき古い習慣とも捨てるべき古い習慣とも考えず，思慮深い書き手が選んで使える複数の技能の一つと考えることだろう。速く打ち込めて，しかも手ではっきりと書ける人は，片方しかできない人よりも多くの選択肢をもっている。生徒に手紙を書かせた教師は，生徒たちが最初のためらいを乗り越えると，その多くが課題を楽しみ，何人かは手紙を郵便で送るつもりだと言ったことに気づいた。彼らの経験が示すのは，ペンはその力を失ったというよりも，その居場所を失ったのであり，その居場所はこれから再び見つかるかもしれない，ということである。',
]

VOCAB = [('hesitate', 'ためらう'), ('swipe', '（画面を）指でなぞる'), ('obliges＋人＋to do', '人に〜することを強いる'), ('process', '（情報を）処理する'),
         ('deliberate', '意図的な・慎重な'), ('temptation', '誘惑'), ('distraction', '気を散らすもの'), ('literal', '文字どおりの'),
         ('preserve', '保存する・とどめる'), ('trace', '痕跡・名残'), ('abandon', '捨てる・やめる'), ('revise', '推敲する・修正する'),
         ('make demands on 人', '人に負担・要求を課す'), ('discard', '捨てる'), ('reluctance', '気が進まないこと・ためらい'), ('initial', '最初の')]

PART = {'passage': PASSAGE, 'questions': QUESTIONS, 'translation': TRANSLATION, 'vocab': VOCAB, 'notes': []}
