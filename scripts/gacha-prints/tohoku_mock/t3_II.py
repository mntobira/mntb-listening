# -*- coding: utf-8 -*-
# 第3回 Ⅱ 長文読解（エッセイ・書き下ろし「物を手放せない理由」）
from mk import pos_for, mc1
pos = pos_for(3)

PASSAGE = [
 "Open almost any cupboard, drawer or garage, and you are likely to find things that nobody has used for years: cables for devices that no longer exist, clothes that stopped fitting long ago, books that will never be reread, and kitchen tools bought for a recipe that was tried only once. Ask the owners why they keep such things, and they will usually offer a reasonable-sounding answer. The item might be useful one day; it was a present; throwing away something that still works would be wasteful. These explanations are not exactly false. {u1|Behind them, however, lie tendencies that have less to do with the objects themselves than with the way the human mind treats whatever it already possesses.}",
 "The first of these tendencies is simple but powerful. Once something becomes ours, we tend to value it more highly than we did before it belonged to us. A person who would never have paid much for a plain mug in a shop may be {wa|reluctant} to sell the same mug for that price once it has spent a few months on their own shelf. Nothing about the mug has changed; only its relationship to its owner has. [[①]] Shopkeepers seem to understand this well, which is why they so often encourage customers to hold a product, try it on or take it home for a free trial. By the time the trial ends, giving the item back can feel strangely like losing something.",
 "A second tendency concerns memory. Objects are remarkably good at holding on to the past for us. A worn pair of shoes may recall a long walk in the mountains; a chipped plate may bring back the kitchen of a grandparent who has since died. Because of this, getting rid of an object can feel like getting rid of the experience attached to it. {u2|To throw away a ticket from a concert we attended with a close friend can feel less like discarding a scrap of paper than like letting go of the evening itself, even though we know perfectly well that the memory does not live inside the ticket.} The stronger the feeling attached to an object, the harder this kind of parting tends to be.",
 "A third tendency looks forward rather than back. Many of the things we keep are kept not for what they have meant but for what they might one day be needed for. A box of spare screws, an old winter coat, a stack of empty jars: each represents a small promise of protection against an uncertain future. [[②]] If we throw something away and then find that we need it a week later, we are likely to blame ourselves, whereas the cost of keeping it, a little less space in a cupboard, is spread so thinly over time that it hardly seems to count. In this way, the fear of a single clear mistake often outweighs a long, quiet burden that we barely notice.",
 "That burden is real, however. Possessions take up space, and in cities where space is expensive, a room filled with unused things is a room that is paid for but not lived in. Possessions also take up time: they must be cleaned, moved, sorted and searched through. Many people know the frustration of standing in a room {wb|cluttered} with boxes, unable to find the one document they urgently need. In fact, {o3} to find what we actually need, and the very objects we kept in order to feel prepared can end up making us less prepared. Some people also describe a vague sense of heaviness when they look at shelves full of things they feel they ought to sort out but never do.",
 "None of this means that people who keep many things are foolish. {u4|Those who struggle to part with their belongings are not necessarily careless or greedy; often they are simply people who take the stories attached to objects seriously.} A drawer of old letters may look like clutter to a visitor, yet to its owner it might be a record of friendships that shaped a whole life. The same sensitivity that makes it painful to throw things away can also make a person thoughtful, loyal and attentive to the past. The aim, then, is not to stop caring about objects but to save that care for the objects that truly deserve it, the things we most {wc|cherish}.",
 "Fortunately, there are ways of letting go that respect these feelings rather than fight them. Some people take a photograph of an object before giving it away, keeping the memory while releasing the thing itself. Others find it easier to part with belongings when they know who will receive them. [[③]] Being {wd|ruthless} is rarely necessary. It is often enough to ask a few gentle questions: When did I last use this? Would I buy it again today? Is there someone who would make better use of it than I do? Questions like these shift attention from what might be lost to what might be gained, and that small change in perspective can make difficult decisions feel lighter.",
 "In the end, our possessions are meant to serve our lives, not to fill them. Deciding what to keep is therefore never only a practical question about space; it is also a question about what we value and who we want to be. A home with fewer things is not automatically a happier one, and there is no ideal number of objects that suits everyone. But a home in which each object has earned its place is likely to feel lighter and easier to live in. Clearing a single drawer will not change a life, yet it could serve as a modest first step toward owning things on purpose rather than by habit.",
]

NOTES = [('chipped', '縁の欠けた'), ('outweigh', '〜より重い・〜にまさる'), ('clutter', 'がらくた・散らかった物')]

QUESTIONS = [
 {'no': 1, 'points': 10, 'kind': 'ja_free',
  'stem': '下線部(1)の tendencies として筆者が挙げているものを，本文に沿って二つ，日本語で手短に述べよ。',
  'answer': '①いったん自分の物になると，自分の物になる前よりもその物を高く評価してしまう傾向。②物が思い出と結びついているため，物を捨てるとその経験まで捨ててしまうように感じる傾向。',
  'alts': ['①所有しているというだけで物の価値を高く見積もる傾向。②いつか必要になるかもしれないと考え，将来の不安に備えて物を手元に置いておこうとする傾向。（三つのうちどの二つを挙げてもよい）'],
  'criteria': [('傾向1：自分の物になると価値を高く見積もる／物と結びついた思い出を手放すように感じる／将来必要になるかもしれないという不安，のうち一つ', 5),
               ('傾向2：上の三つのうち，傾向1と異なるもう一つ', 5)],
  'explain': ['第2段落 “Once something becomes ours, we tend to value it more highly than we did before it belonged to us.”，第3段落 “getting rid of an object can feel like getting rid of the experience attached to it”，第4段落 “A third tendency looks forward rather than back.” の三つが候補。',
              '設問は「二つ」なので，三つのうちどの二つを挙げても内容が正しければ得点を与える。',
              '「物がいつか役に立つから」「贈り物だから」は第1段落で持ち主が口にする表向きの理由であり，筆者の言う tendencies ではない（範囲のずれ）。']},
 {'no': 2, 'points': 12, 'kind': 'trans', 'stem': '下線部(2)を和訳せよ。',
  'answer': '親しい友人と一緒に行ったコンサートのチケットを捨てることは，紙切れを捨てるというよりも，その夜そのものを手放すことのように感じられることがある。記憶がチケットの中に宿っているわけではないことは十分わかっているにもかかわらず，である。',
  'alts': ['仲のよい友人と出かけたコンサートの入場券を処分するのは，一枚の紙を捨てるというより，あの晩の出来事そのものを手放すように感じられることがある。思い出がチケットの中にあるわけではないと，よくわかっていてもそうなのだ。'],
  'criteria': [('To throw away a ticket from a concert we attended with a close friend（不定詞の主語・関係代名詞の省略）', 3),
               ('less like A than like B「AというよりもむしろBのように」', 4),
               ('letting go of the evening itself「その夜そのものを手放す」', 2),
               ('even though we know perfectly well that …「…と十分わかっているにもかかわらず」', 3)],
  'explain': ['主語は To throw away … friend までの不定詞句で，動詞は can feel。concert と we の間に目的格の関係代名詞が省略されている。',
              'less like A than like B は「AのようというよりもBのように」。“discarding a scrap of paper” と “letting go of the evening itself” が比べられている。',
              'live inside は比喩で「（記憶が）チケットの中に宿る・ある」。「中で生活する」と直訳しない。',
              'scrap of paper「紙切れ」，let go of 〜「〜を手放す」。']},
 {'no': 3, 'points': 6, 'kind': 'insert',
  'stem': '本文中の空所［①］〜［③］を補うのに最適な文を(A)〜(C)のうちからそれぞれ一つ選び，その記号を書け。各選択肢は一度ずつ用いること。',
  'choices': ['The thought of needing something later and not having it is often more painful than the clutter itself.',
              'Knowing that a favourite coat will keep someone else warm can make parting with it feel like a gift rather than a loss.',
              'Ownership, in other words, seems to add value that the object did not have before.'],
  'answer': {'①': 2, '②': 0, '③': 1},
  'reasons': ['［②］に入る。直前は「捨てずに取っておく物は，不確かな将来への小さな備えである」，直後は「捨てた一週間後に必要になると自分を責める」。後で必要になったときに手元にない，という考えのつらさを述べる文として前後をつなぐ。',
              '［③］に入る。直前は「誰が受け取るのかわかると手放しやすい」。お気に入りのコートが誰かを温めると知ることが，手放すことを贈り物のように感じさせる，という具体的な説明になる。',
              '［①］に入る。直前は「マグカップそのものは何も変わっておらず，持ち主との関係だけが変わった」。“in other words” でそれを「所有することが価値を加える」とまとめ直している。']},
 {'no': 4, 'points': 6, 'kind': 'order', 'under': '3',
  'stem': '下線部(3)の［　］内の語を正しく並べて意味の通る英文にするとき，2番目・4番目・7番目にくる語の記号を書け。各語は一度ずつ用いること。',
  'words': ['harder', 'own', 'the', 'it', 'more', 'we', 'becomes', 'the'],
  'correct': ['C', 'E', 'F', 'B', 'H', 'A', 'D', 'G'], 'ask': [2, 4, 7],
  'sentence_part': 'the more we own the harder it becomes',
  'sentence': 'In fact, the more we own, the harder it becomes to find what we actually need, and the very objects we kept in order to feel prepared can end up making us less prepared.',
  'explain': ['the + 比較級 S V, the + 比較級 S V「〜すればするほど，ますます…」の構文。前半は the more we own「多く持てば持つほど」。',
              '後半は the harder it becomes to find …「…を見つけるのがますます難しくなる」。it は後ろの to find … を指す形式主語。',
              'the は二つあるので，1番目と5番目の the はどちらの記号でもよい（設問ではその位置を問わない）。',
              '2番目 more (E)・4番目 own (B)・7番目 it (D)。']},
 mc1(5, 8, '下線部(4)で筆者が言おうとしていることとして最適なものを(A)〜(D)のうちから一つ選び，その記号を書け。',
     ['Finding it hard to give things away can reflect a person’s respect for the meanings and memories connected to objects.',
      'People who keep many things usually do so because they want to own more than others do.',
      'People who cannot throw things away are generally careless about how they organize their homes.',
      'The writer believes that stories attached to objects should be ignored when people sort their belongings.'],
     ['○ 下線部の “people who take the stories attached to objects seriously” と，続く古い手紙の例・“The same sensitivity … can also make a person thoughtful, loyal and attentive to the past” の内容に合う。',
      '× 下線部は「欲張りだとは限らない」と述べている（本文と逆）。',
      '× 下線部は「不注意だとは限らない」と述べている（本文と逆）。',
      '× 第6段落の最後は，物を大切に思うことをやめるのではなく，本当にふさわしい物を大切にすることが目標だと述べている（本文と逆）。'], pos()),
 {'no': 6, 'points': 8, 'kind': 'synonym',
  'stem': '下線部(a)〜(d)の文脈上の意味に最も近い語句を，それぞれ(A)〜(D)のうちから一つ選び，その記号を書け。',
  'items': [
   {'label': 'a', 'word': 'reluctant', 'choices': ['eager', 'proud', 'unwilling', 'careful'], 'answer': 2,
    'reason': '店では高いお金を払わなかったはずの人が，自分の棚に置いたあとは同じ値段で「売りたがらない」という文脈。unwilling が最も近い。eager は逆。'},
   {'label': 'b', 'word': 'cluttered', 'choices': ['untidily filled', 'freshly painted', 'completely empty', 'carefully arranged'], 'answer': 0,
    'reason': '箱で「散らかった（いっぱいの）」部屋で書類が見つからない，という文脈。untidily filled が最も近い。'},
   {'label': 'c', 'word': 'cherish', 'choices': ['repair', 'sell', 'forget', 'value deeply'], 'answer': 3,
    'reason': '本当にその気持ちにふさわしい物を「大切にする」という文脈。value deeply が最も近い。forget は逆。'},
   {'label': 'd', 'word': 'ruthless', 'choices': ['patient', 'harsh without pity', 'well organized', 'slightly nervous'], 'answer': 1,
    'reason': '気持ちを尊重して手放す方法の話の中で，「容赦なく」振る舞う必要はめったにない，と述べている。harsh without pity が最も近い。'}]},
]

TRANSLATION = [
 'ほとんどどの戸棚や引き出し，車庫を開けても，何年も誰も使っていない物が見つかりそうだ。もう存在しない機器のケーブル，ずっと前に体に合わなくなった服，二度と読み返されることのない本，一度試しただけの料理のために買った台所用品。なぜそうした物を取っておくのかと持ち主に尋ねれば，たいていはもっともらしい答えが返ってくる。いつか役に立つかもしれない，贈り物だった，まだ使える物を捨てるのはもったいない。こうした説明はまったくの嘘というわけではない。しかしその背後には，物そのものというよりも，人間の心がすでに持っている物をどう扱うかに関係する傾向が潜んでいる。',
 'こうした傾向の一つ目は単純だが強力である。いったん何かが自分の物になると，私たちはそれが自分の物になる前よりもそれを高く評価しがちである。店では無地のマグカップに決して高いお金を払わなかったであろう人が，そのマグカップが数か月自分の棚に置かれたあとでは，同じ値段で売るのをためらうことがある。マグカップ自体は何も変わっていない。変わったのは持ち主との関係だけである。言い換えれば，所有することは，その物が以前は持っていなかった価値を加えるようなのだ。店主たちはこのことをよく理解しているようで，だからこそ客に商品を手に取らせたり，試着させたり，無料のお試しとして家に持ち帰らせたりすることがとても多い。お試し期間が終わる頃には，品物を返すことが妙に何かを失うことのように感じられるのである。',
 '二つ目の傾向は記憶にかかわる。物は，私たちの代わりに過去をとどめておくのが驚くほど得意である。履き古した靴は山での長い散歩を思い出させるかもしれないし，縁の欠けた皿は，今はもう亡くなった祖父母の台所をよみがえらせるかもしれない。そのため，物を処分することは，それと結びついた経験を処分することのように感じられることがある。親しい友人と一緒に行ったコンサートのチケットを捨てることは，紙切れを捨てるというよりも，その夜そのものを手放すことのように感じられることがある。記憶がチケットの中に宿っているわけではないことは十分わかっているにもかかわらず，である。物に結びついた気持ちが強いほど，こうした別れはつらくなりがちである。',
 '三つ目の傾向は，過去ではなく未来に目を向ける。私たちが取っておく物の多くは，それがこれまで持ってきた意味のためではなく，いつか何のために必要になるかもしれないかのために取っておかれる。予備のねじが入った箱，古い冬のコート，積み重ねた空き瓶。どれも，不確かな未来に対する小さな備えの約束を表している。後で何かが必要になったのに手元にない，と考えることは，散らかった物そのものよりもつらいことが多い。何かを捨てて一週間後にそれが必要だとわかれば，私たちは自分を責めがちだが，それを取っておく費用，つまり戸棚の空間が少し減ることは，時間の中にごく薄く広がっているので，ほとんど数に入らないように思える。こうして，一度のはっきりした失敗への恐れが，ほとんど気づかない長く静かな負担にまさってしまうことが多いのである。',
 'しかし，その負担は現実のものである。持ち物は空間をとり，空間が高価な都市では，使われない物でいっぱいの部屋は，お金を払っているのに生活には使われていない部屋である。持ち物はまた時間もとる。掃除し，動かし，仕分けし，中を探さなければならない。多くの人は，箱で散らかった部屋に立ち尽くし，至急必要な一枚の書類が見つからないといういら立ちを知っている。実際，持っている物が多ければ多いほど，本当に必要な物を見つけるのは難しくなり，備えができていると感じるために取っておいたまさにその物が，結局は私たちを備えの足りない状態にしてしまうこともある。また，片づけるべきだと思いながら決して片づけない物でいっぱいの棚を見ると，何となく気が重くなると言う人もいる。',
 'こうしたことは，多くの物を取っておく人が愚かだという意味ではない。持ち物を手放すのが難しいと感じる人は，必ずしも不注意だったり欲張りだったりするわけではない。多くの場合，彼らは単に，物に結びついた物語を真剣に受け止める人々なのである。古い手紙の入った引き出しは，訪問者にはがらくたに見えるかもしれないが，持ち主にとっては一生を形づくった友情の記録なのかもしれない。物を捨てるのをつらくさせるのと同じ感受性が，人を思慮深く，誠実で，過去に心を配る人にすることもある。だから目指すべきは，物を大切に思うのをやめることではなく，私たちが大切にする物が，本当にその思いにふさわしい物であるようにすることなのである。',
 '幸いなことに，こうした気持ちと戦うのではなく，それを尊重する手放し方がある。物を譲る前に写真を撮り，物そのものは手放しながら思い出は残しておく人もいる。誰が受け取るのかわかっていると持ち物を手放しやすいと感じる人もいる。お気に入りのコートが誰か別の人を温めると知ることで，それを手放すことが損失ではなく贈り物のように感じられることがある。容赦なく振る舞う必要はめったにない。いくつか穏やかな問いを投げかければ十分なことが多い。最後にこれを使ったのはいつか。今日もう一度これを買うだろうか。自分よりもこれを上手に使ってくれる人はいないだろうか。こうした問いは，失うかもしれないものから得られるかもしれないものへと注意を移し，そのささやかな見方の変化が，難しい決断を軽く感じさせてくれることがある。',
 '結局のところ，持ち物は私たちの生活に役立つためのものであって，生活を埋め尽くすためのものではない。したがって，何を取っておくかを決めることは，決して空間についての実際的な問題だけではない。それは，自分が何を大切にし，どんな人間でありたいかについての問題でもある。物の少ない家が自動的により幸せな家になるわけではなく，誰にでも合う理想的な物の数というものもない。しかし，一つ一つの物がそこにある理由を持っている家は，より軽やかで暮らしやすく感じられるだろう。引き出しを一つ片づけても人生が変わるわけではないが，それは，習慣によってではなく意図をもって物を持つことへの，ささやかな第一歩になるかもしれない。',
]

VOCAB = [
 ('reasonable-sounding', 'もっともらしく聞こえる'), ('possess', '〜を所有する'), ('belong to 〜', '〜のものである'),
 ('remarkably', '驚くほど'), ('get rid of 〜', '〜を処分する'), ('discard', '〜を捨てる'), ('uncertain', '不確かな'),
 ('blame', '〜を責める'), ('burden', '負担'), ('urgently', '至急'), ('greedy', '欲張りな'), ('sensitivity', '感受性'),
 ('attentive', '心を配る'), ('perspective', '見方'), ('on purpose', '意図して・わざと'),
]

P = {'passage': PASSAGE, 'notes': NOTES, 'questions': QUESTIONS, 'translation': TRANSLATION, 'vocab': VOCAB}
