# -*- coding: utf-8 -*-
# 第1回 Ⅲ 会話文（教授と学生2人「現金のない社会」）＋意見論述 60〜80語。{w1|…} 下線部(1)
LEAD = ('After a seminar on money and technology, Professor Ashcombe of the Faculty of Economics stays behind to talk with two students, '
        'Ryota and Ingrid. Go through their conversation and then deal with tasks 1) and 2) that follow it.')

LINES = [
 ('Professor Ashcombe', "Thanks for staying, both of you; in today's seminar I described how quickly payments in many countries have shifted from coins and notes to cards and phones. Some economists predict that cash will be almost gone within a generation, while others think it will survive in a smaller role, and before you leave I'd like to hear where you stand."),
 ('Ryota', "Honestly, I hardly ever carry cash now: I pay for the train, my lunch, even my share of a dinner with friends using my phone. It's quicker, and I can see exactly where my money goes, because every purchase is recorded in an app. When I do have coins, they just sit in a jar on my desk. I think Japan should move toward a fully cashless system without delay."),
 ('Professor Ashcombe', "That's a common view among students, and businesses often agree with you. Handling cash is surprisingly {w1|costly}: shops have to count it, store it safely and carry it to the bank, and all of that takes staff time. Ingrid, though, you look less convinced by that argument."),
 ('Ingrid', "I am, although I use cards myself; what worries me is the people who can't or don't want to. My grandmother, for example, has never owned a smartphone, and she finds card machines confusing. If every shop stopped accepting cash, she would struggle to buy even a loaf of bread. And it isn't only older people who would suffer, since some visitors from abroad, or people without a bank account, depend on cash too."),
 ('Professor Ashcombe', "That's a serious concern, and in countries where cash use has fallen sharply, there have been arguments about whether shops should be obliged to keep accepting it. Ryota, how would you respond to Ingrid's point?"),
 ('Ryota', "I understand the problem, but I think it's temporary. Technology keeps getting simpler, and the government could help people who need support, for instance by offering free lessons or simple prepaid cards. We shouldn't keep an old system just because some people haven't adapted yet."),
 ('Ingrid', "But it's not just about learning; what happens when the whole system fails? Last year there was a power cut in my hometown after a storm, and for two days none of the card readers worked. People who had cash at home could still buy food and water from the small shops that stayed open, while everyone else simply had to wait. A society that relies entirely on electronic payments is {w2|vulnerable} in a way we don't notice until something goes wrong."),
 ('Professor Ashcombe', "That's an important point about resilience, and there's also the matter of privacy to consider. Every electronic payment leaves a record, and those records can reveal a great deal about a person's habits, health and relationships. Some people find that convenient; others find it rather {w3|intrusive}."),
 ('Ryota', "I suppose I've never really thought about who can see my payment history; I just assumed it was safe."),
 ('Ingrid', "That's exactly what worries me, because with cash, nobody knows what I bought unless I tell them."),
 ('Professor Ashcombe', "Of course, cash has its own problems: it can be lost or stolen, and it's easier to use for illegal purposes because it leaves no trace. In short, neither system is perfect, and many economists would say the real issue is not cash versus no cash, but how to balance convenience, safety and fairness. Some propose a mixed approach: encourage digital payments, but make sure cash remains available for those who need it."),
 ('Ryota', "That sounds sensible, but wouldn't keeping both systems be expensive? Someone has to pay for maintaining cash machines and printing money."),
 ('Professor Ashcombe', "Yes, and that cost is one reason some banks are closing branches and cash machines, especially in rural areas. It's a genuine {w4|trade-off}, and nobody has a simple solution. Well, I'm afraid we have to stop here for today. For next week, please read the two short articles I've uploaded; they take opposite positions on this question."),
]

Q1 = {'points': 8, 'stem': 'For each underlined expression (1)–(4), pick the option from (A)–(D) closest to its meaning in this conversation.',
 'items': [
  {'label': '1', 'word': 'costly', 'choices': ['popular', 'expensive', 'careless', 'slow'], 'answer': 1,
   'reason': '直後に「数える・安全に保管する・銀行へ運ぶ，そのすべてに人手がかかる」とあり，現金の扱いにお金がかかるという意味。expensive が最も近い。'},
  {'label': '2', 'word': 'vulnerable', 'choices': ['highly efficient', 'strongly protected', 'easily harmed', 'widely trusted'], 'answer': 2,
   'reason': '停電でカード決済が使えなくなった例を受けて「電子決済だけに頼る社会は…」と述べている。「傷つきやすい・もろい」の意味で easily harmed が最も近い。strongly protected は逆。'},
  {'label': '3', 'word': 'intrusive', 'choices': ['helpful and welcome', 'harmless in most cases', 'easy to ignore', 'unpleasantly invading one’s private life'], 'answer': 3,
   'reason': '支払いの記録から習慣や健康までわかってしまうというプライバシーの話。「便利だと思う人もいれば…」と対比されるので，「私生活に踏み込んでくる」の意味。'},
  {'label': '4', 'word': 'trade-off', 'choices': ['a balance between gains and losses', 'a business agreement', 'a sudden change', 'a simple mistake'], 'answer': 0,
   'reason': '現金を残せば公平さや安全は守れるが費用がかかる，という「得るものと失うものの兼ね合い」を表す。'}]}

Q2 = {'points': 32,
 'stem': 'Which of the two students, Ryota or Ingrid, is more convincing to you? Explain your view with two supporting reasons, using between 60 and 80 English words.',
 'criteria': [('どちらに賛成かを冒頭で明確に示している', 4), ('理由1が具体的で，立場と論理的につながっている', 8),
              ('理由2が理由1と重ならず，具体的である', 8), ('会話の内容（停電・高齢者・費用・記録など）を自分の言葉で活かしている', 4),
              ('文法・語彙・つづりの正確さ', 6), ('60〜80語の範囲と，まとまりのある構成', 2)],
 'models': [
  ('Ingrid に賛成', "I agree with Ingrid. First, a fully cashless society would leave some people behind. Elderly people who cannot use smartphones, tourists and people without bank accounts would struggle to buy daily necessities. Second, electronic payments depend on electricity and networks. After an earthquake or a major storm, cash may be the only way to buy food and water. For these reasons, I believe cash should remain available."),
  ('Ryota に賛成', "I find Ryota's view more convincing. To begin with, digital payments save time for both shoppers and shop staff, because nobody has to count coins or carry cash to the bank. In addition, every purchase is recorded automatically, which helps people manage their spending and avoid running out of money. Problems such as older users' lack of experience can be solved with support and training, so they are not a reason to keep cash."),
 ],
 'tips': ['最初の一文で立場をはっきり書く（I agree with Ingrid. / I find Ryota’s view more convincing.）。両方に賛成するような書き方は設問の要求に合わない。',
          '理由は First, … Second, … や To begin with, … In addition, … で二つを明確に分ける。二つの理由が実質的に同じ（例：「便利」「速い」）にならないようにする。',
          '会話の表現を丸写しせず，自分の言葉に言い換える。具体例（地震・停電，家計の管理など）を一つずつ添えると説得力が増す。',
          '語数の数え忘れに注意。60語未満・80語超は減点の対象になる。cashless，smartphone などのつづりも確認する。']}

TRANSLATION = [
 '二人とも残ってくれてありがとう。今日のゼミでは，多くの国で支払いが硬貨や紙幣からカードや携帯電話へといかに急速に移ってきたかを説明しました。一世代のうちに現金はほとんどなくなると予測する経済学者もいれば，役割は小さくなっても生き残ると考える経済学者もいます。帰る前に，あなたたちの考えを聞きたいと思います。',
 '正直に言うと，今はほとんど現金を持ち歩いていません。電車も昼食も，友人との夕食の自分の分も携帯電話で払います。そのほうが速いですし，買ったものがすべてアプリに記録されるので，お金の行き先が正確にわかります。たまに硬貨があっても，机の上の瓶に入ったままです。日本はすぐにでも完全なキャッシュレスの仕組みへ移行すべきだと思います。',
 '学生にはよくある考え方ですし，企業もしばしばあなたに同意します。現金を扱うのは意外に費用がかかるのです。店は現金を数え，安全に保管し，銀行へ運ばなければならず，そのすべてに従業員の時間がとられます。イングリッド，あなたはあまり納得していないようですね。',
 'はい。私自身カードを使いますが，使えない人や使いたくない人のことが心配です。たとえば祖母はスマートフォンを持ったことがなく，カードの機械をわかりにくいと感じています。もしすべての店が現金を受け付けなくなったら，祖母はパン一斤を買うのにも苦労するでしょう。それに高齢者だけではありません。海外からの旅行者や銀行口座を持たない人の中にも，現金に頼っている人がいます。',
 'それは深刻な懸念ですね。現金の利用が急激に減った国々では，店に現金の受け付けを続けるよう義務づけるべきかどうかについて議論がありました。リョウタ，イングリッドの指摘にあなたならどう答えますか。',
 '問題はわかりますが，一時的なものだと思います。技術はどんどん簡単になっていますし，たとえば無料の講習やわかりやすいプリペイドカードを提供して，支援が必要な人を政府が助けることもできます。まだ慣れていない人がいるというだけで，古い仕組みを残すべきではありません。',
 'でも，学ぶことだけの問題ではありません。仕組み全体が止まったらどうなるのでしょう。昨年，私の故郷では嵐のあとに停電があって，2日間カードの読み取り機がまったく使えませんでした。家に現金があった人は，営業を続けていた小さな店でまだ食料や水を買えました。それ以外の人は待つしかありませんでした。電子決済だけに頼る社会は，何かがうまくいかなくなるまで気づかないような形で，もろいのです。',
 'それは回復力（災害などへの強さ）についての重要な指摘ですね。プライバシーの問題もあります。電子的な支払いはすべて記録を残し，その記録から人の習慣や健康，人間関係について多くのことがわかってしまいます。それを便利だと思う人もいれば，かなり私生活に踏み込んでくるものだと感じる人もいます。',
 '誰が自分の支払いの履歴を見られるのか，本気で考えたことはなかったと思います。安全だと思い込んでいました。',
 'まさにそこが心配なんです。現金なら，自分から言わない限り，何を買ったかは誰にもわかりません。',
 'もちろん，現金には現金の問題があります。なくしたり盗まれたりすることがありますし，痕跡が残らないので不正な目的にも使いやすい。つまり，どちらの仕組みも完璧ではありません。多くの経済学者は，本当の問題は現金かキャッシュレスかではなく，便利さと安全と公平さをどう両立させるかだと言うでしょう。電子決済を促しつつ，必要な人のために現金を使える状態を保つという，両方を組み合わせた方法を提案する人もいます。',
 'それは理にかなっているように聞こえますが，両方の仕組みを維持するのは高くつきませんか。現金自動預け払い機の維持やお札の印刷には，誰かがお金を払わなければなりません。',
 'そうです。その費用が，特に地方で一部の銀行が支店やATMを閉じている理由の一つです。まさに一方を取れば他方を失う関係で，簡単な答えはありません。さて，残念ですが今日はここで終わりにしなければなりません。来週までに，私がアップロードした短い記事を二つ読んできてください。この問題について正反対の立場をとっている記事です。',
]

VOCAB = [('shift from A to B', 'AからBへ移る'), ('survive', '生き残る'), ('convinced', '納得して'), ('oblige O to do', 'Oに〜するよう義務づける'),
         ('temporary', '一時的な'), ('adapt', '適応する'), ('power cut', '停電'), ('rely on', '〜に頼る'), ('resilience', '回復力・しなやかな強さ'),
         ('reveal', '〜を明らかにする'), ('trace', '痕跡'), ('maintain', '〜を維持する'), ('branch', '支店'), ('rural', '地方の・田舎の')]

P = {'lead': LEAD, 'lines': LINES, 'q1': Q1, 'q2': Q2, 'translation': TRANSLATION, 'vocab': VOCAB}
