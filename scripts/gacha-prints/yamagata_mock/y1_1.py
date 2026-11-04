# -*- coding: utf-8 -*-
# 第1回 Ⅰ エッセイ（数字のないレシピ）。{u|…} 和訳・説明の下線。設問は y1_1q.py
from y1_1q import QUESTIONS, VOCAB
P = {
 'title': '長文読解（エッセイ）',
 'intro': 'Go through the passage, then answer Q1 to Q5.',
 'passages': [{
  'headline': 'Recipes Without Numbers',
  'paras': [
   "My grandmother kept her recipes in a tin box that had once held biscuits. There were perhaps sixty cards inside, each written in her small, sloping handwriting, and almost none of them contained a number. Her instructions for bread asked for “enough flour to make it behave”. Her apple cake was to be baked “until the kitchen smells right”. One card, for a soup I loved as a child, simply listed six vegetables and ended with the words “you will know”.",
   "When I was young, these cards drove me mad. I was the kind of child who liked rules, and I wanted to know exactly how many grams of flour went into the bowl and exactly how many minutes the cake should stay in the oven. Whenever I asked, my grandmother would laugh and say that the dough would tell me. I assumed she was simply being difficult, or that she had forgotten the real amounts and was too proud to admit it.",
   "She died when I was twenty-three, and the tin box came to me. That winter, missing her, I decided to make her bread. I followed the card as closely as I could, which was not very closely at all, and the result was a flat, heavy loaf that even the birds in the garden seemed to avoid. I tried again the next weekend with more yeast* and a hotter oven. The second loaf was worse.",
   "Eventually I telephoned my aunt Maura, who had spent much of her childhood in that kitchen. I expected her to give me the missing numbers. Instead she paused and then said, “Mum never measured. She watched.” She explained that my grandmother added flour a little at a time, pressing the dough with her fingers, until it stopped sticking to her hands but still felt soft. The amount changed from day to day, depending on the weather and the flour.",
   "That conversation changed the way I read the cards. I had treated them as incomplete instructions, as if my grandmother had been careless. In fact, they were reminders written by someone who already knew how to cook, for someone who would learn by doing. {u|The real recipe had never been on the cards; it had been in her hands.} The words were only there to point the way.",
   "So I began to cook every Sunday, slowly and with a great deal of failure. I kept a notebook beside the bowl and wrote down what I noticed: how the dough felt when it was too wet, how it looked when it had risen enough, how the smell of the cake changed in the last few minutes before it was done. Some weeks the notes were more useful than the bread.",
   "Gradually, my hands started to recognise what my eyes had missed. I learned that a good dough springs back slowly when you press it, and that a cake is ready when it begins to pull away from the sides of the tin. None of this was written on the cards, and I am not sure I could have learned it from a book. I had to get it wrong many times before I could get it right.",
   "I do not want to pretend that numbers are useless. Modern recipes, with their precise weights and temperatures, make it possible for a beginner to produce something edible on the first attempt, and that is a real gift. When I cook a dish I have never tried before, I am grateful for them. But precise instructions can also encourage us to stop paying attention. If the recipe says twenty-five minutes, we set a timer and walk away, even if our oven runs hot or our pan is thinner than the writer’s.",
   "My grandmother’s cards asked for something different. {u|They assumed that the cook would stay in the kitchen, using all of her senses, and would answer for the result herself instead of blaming the instructions.} That is a harder way to cook, but I have come to think it is also a more satisfying one.",
   "These days I write my own cards. I include the numbers, because I want my niece, who is nine, to have somewhere to start. But under each set of measurements I add a line or two about what to look for: the colour of the onions, the hiss of the oil, the moment when the sauce coats the back of a spoon. I suspect she will find these lines as annoying as I once found her great-grandmother’s.",
   "That is fine. One day, perhaps, she will make a loaf that comes out flat and heavy, and she will turn the card over, looking for the answer. I hope she finds a note in my handwriting that says, quite simply, “keep watching”.",
  ],
  'notes': [('yeast', 'イースト（パンをふくらませる酵母）')],
  'translation': [
   '祖母は，かつてビスケットが入っていたブリキの箱にレシピをしまっていた。中にはおそらく60枚ほどのカードがあり，どれも祖母の小さな右上がりの字で書かれていて，数字が入っているものはほとんどなかった。パンの作り方には「生地がおとなしくなるだけの小麦粉」と書かれていた。りんごのケーキは「台所のにおいがちょうどよくなるまで」焼くことになっていた。子どものころ大好きだったスープのカードには，6種類の野菜が並べてあるだけで，最後に「そのうちわかる」という言葉で終わっていた。',
   '小さいころ，私はこのカードにいらいらさせられた。私は決まりが好きな子どもで，ボウルに小麦粉を何グラム入れるのか，ケーキをオーブンに何分入れておくのかを正確に知りたかった。尋ねるたびに，祖母は笑って，生地が教えてくれるよと言った。私は，祖母はわざと意地悪をしているのか，本当の分量を忘れてしまったのに，プライドが高くてそれを認められないのだろうと思い込んでいた。',
   '祖母は私が23歳のときに亡くなり，ブリキの箱は私のところに来た。その冬，祖母を恋しく思いながら，私は祖母のパンを作ってみることにした。できるだけカードどおりに作ったが，それはまったくカードどおりとは言えないものだった。そして出来上がったのは，庭の鳥さえ避けているように見える，平たくて重いパンだった。次の週末，イーストを増やし，オーブンの温度を上げてもう一度作った。2つめのパンはもっとひどかった。',
   'とうとう私は，子ども時代の多くをその台所で過ごしたマウラおばさんに電話をかけた。足りない数字を教えてもらえるものと思っていた。ところがおばさんは少し間を置いてから，「母さんは量ったりしなかった。見ていたのよ」と言った。祖母は小麦粉を少しずつ加え，指で生地を押しながら，手にくっつかなくなったけれどまだやわらかいと感じるまで続けていたのだと，おばさんは説明してくれた。その量は，天気や小麦粉によって日ごとに変わっていたという。',
   'その会話で，私のカードの読み方が変わった。私はカードを，祖母がいいかげんだったかのように，不完全な説明書として扱っていた。実際には，カードは，すでに料理の仕方を知っている人が，やってみることで学ぶ人のために書いた覚え書きだったのだ。本当のレシピはカードの上にあったことなど一度もなく，祖母の手の中にあったのだ。言葉は道を指し示すためだけにそこにあったのである。',
   'そこで私は，毎週日曜日に料理をするようになった。ゆっくりと，そして何度も失敗しながら。ボウルのそばにノートを置いて，気づいたことを書き留めた。水分が多すぎるときの生地の手ざわり，十分にふくらんだときの見た目，焼き上がる直前の数分間にケーキのにおいがどう変わるか。パンよりもメモのほうが役に立った週もあった。',
   '少しずつ，目が見落としていたことを手がわかるようになってきた。良い生地は押すとゆっくり押し返してくること，ケーキは型の側面から離れ始めたら焼き上がりであることを知った。そうしたことは何一つカードに書かれていなかったし，本から学べたかどうかもわからない。正しくできるようになるまでに，何度も間違えなければならなかったのだ。',
   '数字が役に立たないふりをするつもりはない。正確な重さや温度が書かれた現代のレシピのおかげで，初心者でも初めての挑戦で食べられるものが作れる。それは本当にありがたいことだ。作ったことのない料理を作るとき，私はそうしたレシピに感謝している。しかし，正確な指示は，私たちが注意を払うのをやめるよう促してしまうこともある。レシピに25分と書いてあれば，自分のオーブンが熱くなりやすくても，鍋が書き手のものより薄くても，私たちはタイマーをセットしてその場を離れてしまう。',
   '祖母のカードが求めていたのは，それとは違うことだった。料理をする人は台所にとどまって五感のすべてを使い，説明のせいにするのではなく，結果に自分で責任を負うものだと，カードは考えていたのだ。それはより難しい料理の仕方だが，より満足のいく仕方でもあると，私は思うようになった。',
   '今では，私は自分のカードを書いている。数字も入れる。9歳になる姪に，出発点を持っていてほしいからだ。しかし，それぞれの分量の下に，何に気をつければよいかを1，2行書き添えている。玉ねぎの色，油の音，ソースがスプーンの背を覆う瞬間。姪はきっと，私がかつて姪の曽祖母のカードをいらだたしく思ったのと同じくらい，この書き添えをいらだたしく思うだろう。',
   'それでかまわない。いつか，姪は平たくて重いパンを焼いてしまい，答えを探してカードを裏返すかもしれない。そこに私の字で，ただ一言「見続けて」と書かれたメモを見つけてくれたらと思う。',
  ],
 }],
 'questions': QUESTIONS,
 'vocab': VOCAB,
}
