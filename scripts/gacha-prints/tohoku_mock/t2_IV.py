# -*- coding: utf-8 -*-
# 第2回 Ⅳ 日本文（書き下ろし「向いていることの見つけ方」）：問1 和文英訳／問2・問3 語句整序（10個から8個）
PASSAGE = [
 '自分にはどんな仕事が向いているのか，何を学べばよいのかと，机の前で長い時間考え込んでしまう若い人は多い。考えること自体は悪いことではない。{u1|しかし，何が自分に合っているかは，頭の中で考えているだけではわからず，実際にやってみて初めてわかることが多い。}',
 '始める前から，うまくできるかどうかばかりを気にしていると，最初の一歩がなかなか踏み出せなくなる。だが，やってみた結果が思いどおりでなくても，それで時間が無駄になるわけではない。{u2|うまくいかなかった経験でさえ，次に何を選ぶべきかを決める助けとなる大切な手がかりになりうる。}',
 'もちろん，何でも手当たり次第に試せばよいというわけではないし，一度始めたことをすぐに投げ出してよいわけでもない。{u3|いちばん大切なのは，若いうちに，失敗を恐れることなく挑戦できる機会をたくさん持つことである。}',
]

QUESTIONS = [
 {'no': 1, 'points': 24, 'kind': 'trans_en', 'stem': '下線部(1)を英文にせよ。',
  'source': 'しかし，何が自分に合っているかは，頭の中で考えているだけではわからず，実際にやってみて初めてわかることが多い。',
  'answer': 'However, we often cannot find out what suits us just by thinking about it; it is not until we actually try something that we know whether it suits us.',
  'alts': ['But simply thinking in our heads is usually not enough to tell us what we are suited to. In many cases, we only realize it after we have actually tried doing it.'],
  'criteria': [('「何が自分に合っているか」：what suits us / what we are suited to（間接疑問の語順）', 6),
               ('「頭の中で考えているだけではわからず」：cannot find out … just by thinking about it など', 6),
               ('「実際にやってみて初めてわかる」：it is not until we actually try … that we know / only … after we have tried', 8),
               ('「〜ことが多い」を often / in many cases で処理し，文法・つづりが正確', 4)],
  'explain': ['「〜して初めて…する」は It is not until 〜 that … や only after 〜 で表す。not until を使うときは It is … that の強調構文の形を崩さない。',
              '「合っている」は suit（他動詞：What suits me?）や be suited to。suit は前置詞なしで目的語をとるので suit to us は誤り。',
              '「頭の中で考えているだけでは」は just by thinking (about it) / simply by thinking in our heads。by + 動名詞「〜することによって」。',
              '主語は一般の人を表す we / you / people でよい。I にすると筆者個人の話になり，文意がずれる。']},
 {'no': 2, 'points': 13, 'kind': 'order_en',
  'stem': '下線部(2)を下のような英文で表すとき，(A)〜(J)から8つを選んで正しく並べ，空所( ① )( ② )( ③ )にくるものの記号を書け。各選択肢は一度ずつ用いること。',
  'pre': 'Even experiences in which things did not go well', 'post': 'decide what to choose next.',
  'options': ['as', 'clues', 'can', 'help', 'important', 'serve', 'that', 'us', 'helps', 'for'],
  'correct': ['C', 'F', 'A', 'E', 'B', 'G', 'D', 'H'], 'marks': {'2': '①', '5': '②', '7': '③'},
  'explain': ['主語は Even experiences in which things did not go well「うまくいかなかった経験でさえ」。in which は前置詞＋関係代名詞。',
              '動詞は can serve as 〜「〜として役立つ・〜になりうる」。serve for という形はここでは使わない。',
              'important clues を that help us decide …「…を決める助けとなる」が修飾する。help + O + 原形不定詞。先行詞 clues は複数なので helps は不可。',
              '① serve (F)・② clues (B)・③ help (D)。']},
 {'no': 3, 'points': 13, 'kind': 'order_en',
  'stem': '下線部(3)を下のような英文で表すとき，(A)〜(J)から8つを選んで正しく並べ，空所( ① )( ② )( ③ )にくるものの記号を書け。各選択肢は一度ずつ用いること。',
  'pre': 'What matters most is', 'post': 'without being afraid of failure while we are still young.',
  'options': ['to', 'challenges', 'having', 'much', 'on', 'opportunities', 'have', 'plenty', 'take', 'of'],
  'correct': ['C', 'H', 'J', 'F', 'A', 'I', 'E', 'B'], 'marks': {'1': '①', '4': '②', '7': '③'},
  'explain': ['What matters most is 〜「いちばん大切なのは〜だ」。補語には動名詞 having を置く（is have は不可）。',
              'plenty of opportunities「たくさんの機会」。opportunity は可算名詞なので much は使えない。',
              'opportunities to take on challenges「挑戦する機会」。不定詞の形容詞的用法で，take on 〜 は「〜を引き受ける・〜に挑む」。',
              '① having (C)・② opportunities (F)・③ on (E)。']},
]

P = {'passage': PASSAGE, 'questions': QUESTIONS}
