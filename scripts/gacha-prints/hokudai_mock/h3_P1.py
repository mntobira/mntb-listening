# -*- coding: utf-8 -*-
# 第3回 大問1 長文読解（論説・書き下ろし）
from mk import pos_for, mc1
pos = pos_for(3)

PASSAGE = [
 "Not so long ago, finding your way around an unfamiliar city demanded some ingenuity. Travelers studied paper maps before setting out, asked strangers for directions, and memorized the names of streets and landmarks. Mistakes were common, and getting lost was an inevitable part of exploring a new place. Today, most of us carry a device that can tell us, at every moment, exactly where we are and which way to turn. The arrow on the screen moves as we move, a soothing voice announces each corner in advance, and the possibility of losing our way seems to have almost disappeared.",
 "There is much to be grateful for in this change. Navigation apps save time, alleviate stress, and make it possible for people who would once have stayed at home to travel with confidence. A visitor who speaks none of the local language can reach a hotel at midnight without asking anyone for help. {u1|For people with poor eyesight or a weak sense of direction, being guided step by step can make the difference between feeling trapped in a small familiar area and feeling free to explore.}",
 "Yet something may be lost when every journey is planned for us. When we follow instructions from a screen, our attention tends to rest on the next turn rather than on the place as a whole. We arrive at our destination, but we often could not explain how we got there, and if the battery died on the way back, we might have little idea which direction to take. {u2|We reach places, so to speak, without really getting to know them.} Someone who has found the way by reading street signs, noticing a bakery on one corner and a church tower in the distance, builds up a kind of mental picture that someone who has simply obeyed an arrow does not.",
 "This mental picture matters for more than convenience. Knowing how the parts of a town fit together allows us to find shortcuts, to devise alternative routes when a road is closed, and to give directions to others. It also shapes how we feel about where we live. ( ア ), a neighborhood that we have explored on foot, taking wrong turns and discovering unexpected streets, tends to feel more like our own than one we have only passed through while staring at a phone. {u3|Getting lost is not always a failure; it can be the moment when a place stops being a set of instructions and starts becoming somewhere we actually know.}",
 "Children may be particularly affected. In many places, young people now travel less independently than earlier generations did, partly because anxious parents fret about traffic and partly because a phone allows constant contact. When they do go out alone, they are often guided by the same apps that adults use. Some teachers and parents have begun to ask whether children are missing the chance to develop a sense of direction, along with the self-reliance that comes from solving small problems by themselves, such as working out which bus to take or what to do after missing a stop.",
 "None of this means that we should throw away our phones or refuse to use maps on a screen. A sensible approach might be to treat navigation apps as a backup rather than as a constant guide. {u4|We could look at the route before leaving, try to remember the main turns, and check the screen only when we are genuinely unsure, so that the device supports our own judgment instead of replacing it.} On a free afternoon, we might even leave the phone in a pocket and simply roam, accepting that we may take longer to reach our goal.",
 "The point is not that the old ways were always better. Paper maps could be bewildering, and asking for directions did not always produce helpful answers. But the effort of finding our own way gave us something that is easy to overlook: a relationship with the places we passed through. Technology has made it far easier to arrive. It is worth making sure that, in the process, we do not forget how to look around.",
]

QUESTIONS = [
 {'no': 1, 'points': 8, 'kind': 'trans', 'stem': '下線部(1)を和訳せよ。',
  'answer': '視力が弱い人や方向感覚に自信のない人にとって，一歩ずつ道案内してもらえることは，慣れた狭い範囲に閉じ込められていると感じるか，自由に探索できると感じるかの分かれ目になりうる。',
  'alts': ['目がよく見えない人や方向音痴の人にとっては，順を追って案内してもらえるかどうかで，なじみのある小さな地域に閉じ込められた気持ちになるか，自由に出歩ける気持ちになるかが大きく変わりうる。'],
  'criteria': [('For people with poor eyesight or a weak sense of direction「視力が弱い人や方向感覚の弱い人にとって」', 2), ('being guided step by step（動名詞の主語）「一歩ずつ案内してもらうこと」', 2),
               ('make the difference between A and B「AかBかの分かれ目になる」', 2), ('feeling trapped in a small familiar area / feeling free to explore の対比', 2)],
  'explain': ['主語は being guided step by step（受け身の動名詞）。「案内されること」→「道案内してもらえること」と自然な日本語にする。',
              'make the difference between A and B は「AとBの違いを生む」，つまり「AになるかBになるかを左右する」。',
              'feeling trapped は「閉じ込められていると感じること」。trapped と free が対比されている点を訳に残す。']},
 mc1(2, 5, '下線部(2)の言わんとすることに最も近いものを，(A)〜(D)のうちから一つ選べ。',
     ['We arrive at our destinations but learn little about the areas we pass through.', 'We can no longer reach the places that we want to visit.',
      'We visit fewer places than people did in the past.', 'We become familiar with new places more quickly than before.'],
     ['○ 直前の “We arrive at our destination, but we often could not explain how we got there” の言い換え。目的地には着くが，その場所を知ることにはならない。',
      '× 目的地には着けている。reach places の部分を否定していて本文と逆（本文と逆）。',
      '× 訪れる場所の数の比較は本文にない（本文に記述なし）。',
      '× 場所に「なじむ」のが速くなるのではなく，むしろなじまなくなるという趣旨（本文と逆）。'], pos()),
 mc1(3, 5, '( ア )を補うのにふさわしいものを，(A)〜(D)のうちから一つ選べ。',
     ['For instance', 'Nevertheless', 'In contrast', 'As a result'],
     ['○ 直前の「土地の全体像は住む場所への感じ方にも影響する」の具体例として，「歩いて探検した近所はより自分のものに感じられる」が続く。',
      '× 前の文と後の文は対立していないので，譲歩・逆接は合わない。',
      '× 後ろの文の中で「歩いて探検した近所」と「画面を見ながら通り過ぎた近所」が比べられているが，前の文との対比ではない。',
      '× 後ろの文は前の文から導かれる結果ではなく，前の文を具体的に示したものである。'], pos()),
 {'no': 4, 'points': 8, 'kind': 'ja_limit', 'limit': 70,
  'stem': '下線部(3)で筆者は「道に迷うこと」をどのようなものと考えているか。句読点も1字に数え，70字以内で説明せよ。',
  'answer': '道に迷うことは必ずしも失敗ではなく，場所が単なる道順の指示でなくなり，自分が本当に知っている場所になり始めるきっかけになりうるもの。',
  'alts': ['迷うことは失敗とは限らず，その場所がただの案内の集まりから，自分が実際によく知る場所へと変わり始める瞬間になりうるもの。'],
  'criteria': [('必ずしも失敗ではない（not always a failure）', 2), ('場所が単なる指示（道順）の集まりでなくなる', 3), ('自分が本当に知っている場所になり始めるきっかけ（瞬間）になる', 3)],
  'explain': ['セミコロンの前後で「失敗とは限らない」→「〜になる瞬間でありうる」と述べている。両方を入れる。',
              'stops being a set of instructions and starts becoming somewhere we actually know は stop doing と start doing の対比。「〜でなくなり，〜になり始める」と訳し分ける。',
              'a set of instructions は，アプリが示す「右へ・左へ」という指示の集まりのこと。']},
 {'no': 5, 'points': 9, 'kind': 'trans', 'stem': '下線部(4)を和訳せよ。',
  'answer': '出発前に経路を見て主な曲がり角を覚えるようにし，本当にわからないときだけ画面を確認すればよいだろう。そうすれば，機器は私たち自身の判断に取って代わるのではなく，それを支えることになる。',
  'alts': ['出かける前にルートを確認して大事な曲がり角を覚えておき，本当に自信がないときにだけ画面を見るようにすれば，機器は自分の判断の代わりをするのではなく，それを助けるものになるだろう。'],
  'criteria': [('look at the route before leaving / try to remember the main turns', 2), ('check the screen only when we are genuinely unsure「本当にわからないときだけ画面を見る」', 2),
               ('so that 〜「〜するように（そうすれば〜）」', 2), ('supports our own judgment instead of replacing it「判断に取って代わるのではなく支える」', 3)],
  'explain': ['We could … は「〜してもよいだろう・〜すればよい」という控えめな提案。3つの動詞（look / try / check）が並んでいる。',
              'so that 以下は目的・結果。「機器が〜するように」「そうすれば機器は〜する」のどちらでもよい。',
              'instead of replacing it の it は our own judgment。「判断の代わりになるのではなく」。']},
 {'no': 6, 'points': 7, 'kind': 'tf2', 'stem': '本文の趣旨に合致する英文を，(A)〜(F)のうちから二つ選べ。',
  'choices': ['Navigation apps, the passage says, have allowed some people to travel with more confidence.',
              'The author argues that paper maps were always clearer than navigation apps.',
              'People guided by a screen usually concentrate on the next turn rather than on the whole place.',
              'The author reports research proving that children who use apps have a worse sense of direction.',
              'In the author’s opinion, travelers should stop carrying phones when they go abroad.',
              'Knowing a town well is described as useful only for finding shortcuts.'],
  'answer': [0, 2],
  'reasons': ['○ 第2段落 “make it possible for people who would once have stayed at home to travel with confidence” と一致。',
              '× 最終段落 “Paper maps could be bewildering” と逆（本文と逆）。',
              '○ 第3段落 “our attention tends to rest on the next turn rather than on the place as a whole” と一致。',
              '× 第5段落は教師や親が「問い始めている」と述べるだけで，研究の結果は示していない（本文に記述なし）。',
              '× 第6段落 “None of this means that we should throw away our phones” と逆（本文と逆）。',
              '× 第4段落は近道のほか，回り道を考える・道を教える・住む場所への感じ方にも役立つと述べる（言い過ぎ）。']},
]

TRANSLATION = [
 'それほど昔のことではないが，見知らぬ街で道を見つけるには，ある程度の工夫が必要だった。旅行者は出発前に紙の地図を調べ，知らない人に道を尋ね，通りや目印の名前を覚えた。間違いはよくあることで，道に迷うことは新しい場所を探検する際に避けられない一部だった。今日では，私たちのほとんどが，自分が今どこにいて，どちらへ曲がればよいかを常に正確に教えてくれる機器を持ち歩いている。画面の矢印は私たちの動きに合わせて動き，落ち着いた声が曲がり角を一つ一つ前もって知らせ，道に迷う可能性はほとんど消えてしまったように思える。',
 'この変化には感謝すべき点が多い。ナビゲーションアプリは時間を節約し，ストレスを和らげ，かつてなら家にとどまっていたであろう人々が自信をもって旅行できるようにしてくれる。現地の言葉をまったく話せない旅行者でも，誰にも助けを求めずに真夜中にホテルにたどり着ける。(1)視力が弱い人や方向感覚に自信のない人にとって，一歩ずつ道案内してもらえることは，慣れた狭い範囲に閉じ込められていると感じるか，自由に探索できると感じるかの分かれ目になりうる。',
 'しかし，あらゆる移動が私たちのために計画されると，何かが失われるのかもしれない。画面の指示に従うとき，私たちは場所全体よりも次の曲がり角に注意を向けがちである。目的地には着くが，どうやってそこまで来たのかを説明できないことが多く，帰り道で電池が切れたら，どちらへ行けばよいのかほとんどわからないかもしれない。(2)いわば，私たちは場所を本当に知ることなく，そこにたどり着いているのである。通りの標識を読み，ある角のパン屋や遠くの教会の塔に気づきながら道を見つけた人は，矢印に従っただけの人にはない，ある種の頭の中の地図を築き上げる。',
 'この頭の中の地図は，便利さ以上の意味をもつ。町の各部分がどうつながっているかを知っていれば，近道を見つけたり，道路が通行止めのときに別の道筋を思い描いたり，ほかの人に道を教えたりできる。それはまた，自分の住む場所への感じ方も形づくる。たとえば，道を間違えたり思いがけない通りを見つけたりしながら歩いて探検した近所は，携帯電話を見つめながら通り過ぎただけの近所よりも，自分のものだと感じられやすい。(3)道に迷うことは必ずしも失敗ではない。それは，場所が単なる指示の集まりであることをやめ，自分が実際に知っている場所になり始める瞬間でありうるのだ。',
 '子どもは特に影響を受けるかもしれない。多くの地域で，若者は今や前の世代よりも一人で出歩くことが少なくなっている。その理由の一つは心配性の親が交通事故を気に病むからであり，もう一つは携帯電話があれば常に連絡が取れるからである。子どもが一人で出かけるときも，大人が使うのと同じアプリに案内されることが多い。教師や親の中には，子どもが方向感覚を身につける機会や，どのバスに乗ればよいか，停留所を乗り過ごしたらどうすればよいかを考え出すといった小さな問題を自分で解決することから生まれる自立心を得る機会を，逃しているのではないかと問い始めた人もいる。',
 'こうしたことはどれも，携帯電話を捨てるべきだとか，画面上の地図を使うのを拒むべきだとかいうことを意味するわけではない。賢明なやり方は，ナビゲーションアプリを常に頼る案内役としてではなく，予備として扱うことかもしれない。(4)出発前に経路を見て主な曲がり角を覚えるようにし，本当にわからないときだけ画面を確認すればよいだろう。そうすれば，機器は私たち自身の判断に取って代わるのではなく，それを支えることになる。暇な午後には，電話をポケットにしまったまま，目的地に着くのに時間がかかるかもしれないことを受け入れて，ただあてもなく歩き回ってみてもよいだろう。',
 '要するに，昔のやり方がいつも優れていたというのではない。紙の地図は途方に暮れるほどわかりにくいこともあったし，道を尋ねても役に立つ答えが得られるとは限らなかった。しかし，自分で道を見つける努力は，見落とされやすいあるものを私たちに与えてくれた。それは，通り過ぎる場所とのつながりである。技術のおかげで，たどり着くことははるかに簡単になった。その過程で，周りを見回すことを忘れないようにする価値はあるだろう。',
]

VOCAB = [('unfamiliar', 'なじみのない'), ('landmark', '目印'), ('in advance', '前もって'), ('navigation', '道案内・ナビゲーション'),
         ('step by step', '一歩ずつ・順を追って'), ('make the difference between A and B', 'AかBかを分ける'), ('trapped', '閉じ込められた'), ('as a whole', '全体として'),
         ('so to speak', 'いわば'), ('obey', '従う'), ('shortcut', '近道'), ('alternative', '代わりの'),
         ('independently', '自分の力で・一人で'), ('work out', '考え出す・解決する'), ('backup', '予備'), ('genuinely', '本当に'),
         ('judgment', '判断'), ('ingenuity', '工夫・創意'), ('inevitable', '避けられない'), ('alleviate', '和らげる'), ('devise', '考え出す'), ('fret about ～', '〜を気に病む'), ('self-reliance', '自立心'), ('bewildering', '途方に暮れさせる'), ('overlook', '見落とす')]

PART = {'passage': PASSAGE, 'questions': QUESTIONS, 'translation': TRANSLATION, 'vocab': VOCAB, 'notes': []}
