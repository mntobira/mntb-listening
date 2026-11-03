# -*- coding: utf-8 -*-
# 第3回 Ⅲ 会話文（教授と学生2人「美術館・博物館は無料にすべきか」）＋意見論述 60〜80語。{w1|…} 下線部(1)
LEAD = ('Professor Penhallow, who teaches cultural policy, has just returned from a conference on museums. After class, she talks with two students, '
        'Mio and Tobias, about a debate she heard there. Go through their conversation and then deal with tasks 1) and 2) that follow it.')

LINES = [
 ('Professor Penhallow', "At the conference last week, one session was devoted entirely to a single question: should public museums charge an entrance fee at all? Several countries have experimented with free admission to national collections, and the results have been debated ever since. I'd be interested to know which side you two would take, since you both visit museums fairly often."),
 ('Mio', "I'd make them free without hesitation. Back in my childhood, my family couldn't afford many outings, but the city museum near our flat didn't charge anything, so we went almost every month. That's where I first became interested in history. If there had been a fee, even a small one, I doubt my parents would have taken us so regularly."),
 ('Professor Penhallow', "That's very much the argument supporters make. Museums hold collections that belong, in a sense, to everyone, so it seems odd to make people pay to see their own heritage. There's also evidence from several places that visitor numbers rose {w1|considerably} after fees were removed, although the increase wasn't spread evenly across all groups. Tobias, you don't look entirely persuaded."),
 ('Tobias', "Not entirely, no. I like the principle, but someone has to cover the cost of the guards, the cleaning and the care of old objects. If visitors don't pay, the money comes from taxes, and that means people who never visit museums are paying for those who do. Frankly, many regular museum-goers are reasonably well-off and could easily afford a ticket."),
 ('Professor Penhallow', "That point came up repeatedly at the conference. Some researchers found that when admission became free, most of the extra visitors were people who already went to museums, just going more often. Attracting people who had never been before proved much harder than simply removing the fee."),
 ('Mio', "But that doesn't mean the fee is harmless. For families like mine, even a few hundred yen per person adds up quickly. And maybe the reason new visitors didn't come is that museums didn't do enough to welcome them. Free entry is only the first step; museums also need events, guides in different languages and exhibitions that connect with people's everyday lives."),
 ('Tobias', "I agree that those things matter, but they cost money too. If a museum loses its ticket income, it might have to cut exactly the kind of programmes you're describing. I'd rather see a modest fee for most adults, with free entry for children, students and people on low incomes. That way the museum keeps some income and the people who most need help still get in for nothing."),
 ('Professor Penhallow', "That's the compromise many institutions have chosen. Others keep their permanent collections free but charge for special exhibitions, which are expensive to organize. Some ask for voluntary donations at the entrance instead of a fixed price, which leaves the decision to each visitor."),
 ('Mio', "Donations sound nice, but I'd feel embarrassed walking past the box without paying, so in practice it might still keep some people away."),
 ('Tobias', "And a discount system only works if people know about it and don't feel awkward asking. Proving you have a low income at a ticket desk could be quite {w2|humiliating}."),
 ('Professor Penhallow', "Those are both thoughtful points, and they show how much the design of a policy matters. A rule that looks generous on paper can still discourage people if it makes them feel watched or judged. Researchers also stress that the location of a museum, its opening hours and even the way the building looks from the street can form a {w3|barrier} just as serious as the price of a ticket."),
 ('Tobias', "So the fee might not be the biggest obstacle after all."),
 ('Professor Penhallow', "Possibly not, though it remains an important one for many families. For your next assignment, I'd like each of you to visit a local museum and observe who seems to be using it and what might be keeping others away. Then write a short report suggesting how the museum could become more {w4|accessible}, whether or not it charges for entry."),
]

Q1 = {'points': 8, 'stem': 'For each underlined expression (1)–(4), pick the option from (A)–(D) closest to its meaning in this conversation.',
 'items': [
  {'label': '1', 'word': 'considerably', 'choices': ['slightly', 'significantly', 'suddenly', 'secretly'], 'answer': 1,
   'reason': '入場料をなくしたあと来館者数が「かなり」増えた，という文脈。significantly が最も近い。slightly は逆。'},
  {'label': '2', 'word': 'humiliating', 'choices': ['causing embarrassment and shame', 'taking a long time', 'very expensive', 'difficult to understand'], 'answer': 0,
   'reason': '切符売り場で低収入であることを証明するのは「屈辱的・恥ずかしい」かもしれない，という文脈。(A) が最も近い。直前の Mio の embarrassed とも呼応している。'},
  {'label': '3', 'word': 'barrier', 'choices': ['benefit', 'reward', 'obstacle', 'entrance'], 'answer': 2,
   'reason': '場所・開館時間・建物の見た目も，入場料と同じくらい人を遠ざける「障壁」になりうる，という文脈。直後の Tobias の “the biggest obstacle” が言い換えになっている。'},
  {'label': '4', 'word': 'accessible', 'choices': ['expensive to enter', 'well hidden', 'strictly controlled', 'easy for people to visit and use'], 'answer': 3,
   'reason': '誰が利用し，何が他の人を遠ざけているかを観察したうえで，どうすれば博物館がより「利用しやすく」なるかを提案する課題。(D) が最も近い。'}]}

Q2 = {'points': 32,
 'stem': 'Which of the two students, Mio or Tobias, is more convincing to you? Explain your view with two supporting reasons, using between 60 and 80 English words.',
 'criteria': [('どちらに賛成かを冒頭で明確に示している', 4), ('理由1が具体的で，立場と論理的につながっている', 8),
              ('理由2が理由1と重ならず，具体的である', 8), ('会話の論点（税負担・家族の出費・割引制度・寄付など）を自分の言葉で活かしている', 4),
              ('文法・語彙・つづりの正確さ', 6), ('60〜80語の範囲と，まとまりのある構成', 2)],
 'models': [
  ('Mio に賛成', "Mio's opinion seems more convincing to me. First, museums keep collections that belong to the whole society, so everyone ought to have the chance to enjoy them regardless of income. Second, even a small fee can stop families with several children from visiting regularly, and children who never visit museums may never discover an interest in art or history. Free entry, together with events and multilingual guides, would help museums reach many more people."),
  ('Tobias に賛成', "I side with Tobias. To begin with, caring for old objects and paying staff is expensive, and a modest fee lets visitors share that cost instead of placing it entirely on taxpayers. Moreover, free entry mainly benefits people who already go to museums often. Charging most adults while letting children, students and low-income visitors in for nothing seems a fairer way to protect both the museum and the people who need support."),
 ],
 'tips': ['最初の一文で誰の意見に賛成かをはっきり書く（Mio’s opinion seems more convincing to me. / I side with Tobias.）。',
          '理由は First, … Second, … や To begin with, … Moreover, … で二つに分ける。「費用」と「お金がかかる」のように，同じ理由を言い換えただけにならないよう注意する。',
          '会話の表現を丸写しせず，自分の言葉に言い換える（例：“people who never visit museums are paying for those who do” → taxpayers share the cost）。',
          'admission（入場），exhibition（展示），regardless of（〜に関係なく）のつづりと使い方を確認する。語数は 60〜80 語に収める。']}

TRANSLATION = [
 '先週の学会では，ある分科会がまるごと一つの問いにあてられていました。公立の博物館はそもそも入場料を取るべきか，という問いです。いくつかの国が国立の収蔵品の無料公開を試みてきて，その結果はそれ以来ずっと議論されています。二人ともかなりよく博物館に行くので，どちらの側に立つか知りたいと思います。',
 '私なら迷わず無料にします。子どもの頃，うちはあまり出かける余裕がありませんでしたが，家の近くの市立博物館は何もお金を取らなかったので，ほとんど毎月行きました。私が初めて歴史に興味を持ったのはそこです。もし料金があったら，たとえ少額でも，両親があれほど定期的に連れて行ってくれたかは疑問です。',
 'それはまさに賛成派が挙げる議論ですね。博物館は，ある意味で皆のものである収蔵品を持っているのだから，自分たちの遺産を見るのに人々にお金を払わせるのはおかしく思える，と。また，入場料をなくしたあと来館者数がかなり増えたという証拠もいくつかの場所から得られています。ただし，その増加はすべての集団に均等に広がったわけではありませんでした。トビアス，あなたはすっかり納得したようには見えませんね。',
 'すっかりとは言えません。原則は好きですが，警備員や清掃，古い物の手入れには誰かがお金を払わなければなりません。来館者が払わなければ，お金は税金から出ることになり，それは博物館に一度も行かない人が，行く人のために払っているということです。率直に言って，博物館によく行く人の多くはそれなりに裕福で，入場券くらい楽に買えるはずです。',
 'その点は学会でくり返し取り上げられました。入場が無料になったとき，増えた来館者の大半はもともと博物館に行っていた人で，行く回数が増えただけだったと気づいた研究者もいます。一度も行ったことのない人を呼び込むことは，単に入場料をなくすよりもずっと難しいとわかったのです。',
 'でも，だからといって入場料に害がないことにはなりません。うちのような家族にとっては，一人数百円でもすぐにかさみます。それに，新しい来館者が来なかったのは，博物館が彼らを迎え入れる努力を十分にしなかったからかもしれません。無料入場は最初の一歩にすぎず，博物館には催しや，いろいろな言語の案内，人々の日常生活とつながる展示も必要です。',
 'そういうものが大切だというのには賛成ですが，それにもお金がかかります。博物館が入場料収入を失えば，あなたが言っているまさにその種の企画を削らなければならなくなるかもしれません。私なら，たいていの大人には手ごろな料金を設けて，子どもや学生，低収入の人は無料にするほうがいいと思います。そうすれば博物館はある程度の収入を保てるし，最も助けを必要としている人は無料で入れます。',
 'それは多くの施設が選んできた妥協案ですね。常設の収蔵品は無料のままにして，準備にお金のかかる特別展には料金を取るところもあります。決まった料金の代わりに入口で任意の寄付を求めるところもあり，その場合は判断を来館者一人ひとりに委ねることになります。',
 '寄付はよさそうに聞こえますが，払わずに箱の前を通り過ぎるのは気まずく感じると思うので，実際にはやはり一部の人を遠ざけるかもしれません。',
 'それに，割引制度は，人々がそれを知っていて，頼むのを気まずく感じない場合にしか機能しません。切符売り場で低収入であることを証明するのは，かなり屈辱的かもしれません。',
 'どちらも思慮深い指摘で，政策の設計がどれほど重要かを示していますね。書類の上では気前よく見える規則も，人々に見張られている，評価されていると感じさせれば，やはり人を遠ざけることがあります。研究者たちはまた，博物館の場所や開館時間，さらには通りから見た建物の外観さえも，入場券の値段と同じくらい障壁になりうると強調しています。',
 'では，結局のところ入場料は一番の障害ではないのかもしれませんね。',
 'そうかもしれません。とはいえ，多くの家族にとっては依然として重要な障害です。次の課題として，それぞれ地元の博物館を訪れて，誰が利用しているようか，そして何が他の人々を遠ざけているかもしれないかを観察してください。そのうえで，入場料を取るかどうかにかかわらず，その博物館がどうすればより利用しやすくなるかを提案する短いレポートを書いてください。',
]

VOCAB = [('be devoted to 〜', '〜にあてられる'), ('admission', '入場（料）'), ('without hesitation', 'ためらわずに'), ('heritage', '遺産'),
         ('persuaded', '納得した'), ('well-off', '裕福な'), ('add up', '（金額が）かさむ'), ('modest', '手ごろな・控えめな'),
         ('compromise', '妥協（案）'), ('voluntary donation', '任意の寄付'), ('awkward', '気まずい'), ('discourage', '〜を遠ざける・やる気をそぐ'),
         ('obstacle', '障害'), ('observe', '〜を観察する')]

P = {'lead': LEAD, 'lines': LINES, 'q1': Q1, 'q2': Q2, 'translation': TRANSLATION, 'vocab': VOCAB}
