# -*- coding: utf-8 -*-
# 第1回 Ⅳ 日本文（書き下ろし「雑談の効用」）：問1 和文英訳／問2・問3 語句整序（10個から8個）
PASSAGE = [
 '職場や教室で交わされる雑談は，しばしば時間の無駄だと考えられている。天気の話や週末の出来事についての短いやりとりは，仕事や勉強の中身とは直接かかわりがないからだ。{u1|しかし，雑談がまったくない集団では，困ったことがあっても誰にも相談できず，小さな問題が大きくなるまで放っておかれることが少なくない。}',
 '雑談の意味は，情報を伝えることよりも，互いの様子を知り，声をかけやすい関係をつくっておくことにあるのだろう。{u2|実際，毎日言葉を交わしている相手に自分の失敗を打ち明けることは，それほど難しくない。}一方，ふだんほとんど話さない相手には，ささいな質問をするのにも勇気がいる。',
 'もちろん，相手の都合も考えずに長々と話し続けるのは迷惑である。{u3|大切なのは，雑談を義務にすることではなく，誰もが気軽に話しかけられる雰囲気を保つことである。}',
]

QUESTIONS = [
 {'no': 1, 'points': 24, 'kind': 'trans_en', 'stem': '下線部(1)を英文にせよ。',
  'source': 'しかし，雑談がまったくない集団では，困ったことがあっても誰にも相談できず，小さな問題が大きくなるまで放っておかれることが少なくない。',
  'answer': 'However, in groups where there is no small talk at all, people often have no one to consult when they are in trouble, and small problems are frequently left alone until they become serious.',
  'alts': ['In a group whose members never chat with each other, however, people with difficulties often cannot ask anyone for advice, and minor problems are often ignored until they grow large.'],
  'criteria': [('「雑談がまったくない集団では」：in groups where there is no small talk at all など（関係副詞・whose も可）', 6),
               ('「困ったことがあっても誰にも相談できず」：have no one to consult / cannot ask anyone for advice', 6),
               ('「小さな問題が大きくなるまで放っておかれる」：are left alone (ignored) until they become serious', 8),
               ('「〜ことが少なくない」を often / frequently で処理し，時制・数の一致が正しい', 4)],
  'explain': ['「〜ことが少なくない」は「よく〜する」と読み換え，often や frequently で表すと書きやすい。否定語を重ねた直訳は不自然になりやすい。',
              '「雑談」は small talk（不可算）や chatting。chat with each other のように動詞で書いてもよい。',
              '「放っておかれる」は受動態 be left alone / be ignored / be neglected。until 節の中は現在形（become / grow）。',
              '「相談できない」は no one to consult（不定詞の形容詞的用法）が簡潔。consult with を使うなら have no one to consult with。']},
 {'no': 2, 'points': 13, 'kind': 'order_en',
  'stem': '下線部(2)を下のような英文で表すとき，(A)〜(J)から8つを選んで正しく並べ，空所( ① )( ② )( ③ )にくるものの記号を書け。各選択肢は一度ずつ用いること。',
  'pre': 'In fact,', 'post': 'every day is not that difficult.',
  'options': ['admitting', 'failures', 'people', 'talk', 'to', 'our', 'whom', 'we', 'which', 'with'],
  'correct': ['A', 'F', 'B', 'E', 'C', 'H', 'D', 'J'], 'marks': {'2': '①', '5': '②', '7': '③'},
  'explain': ['主語は動名詞句 admitting our failures to people …「人々に失敗を打ち明けること」。動詞は後ろの is。',
              'people (whom) we talk with every day で「毎日言葉を交わしている人々」。目的格の関係代名詞は省略されている。',
              'whom を使うと9語必要になり，which は人を先行詞にとれないので，この2つが不要。',
              '① our (F)・② people (C)・③ talk (D)。']},
 {'no': 3, 'points': 13, 'kind': 'order_en',
  'stem': '下線部(3)を下のような英文で表すとき，(A)〜(J)から8つを選んで正しく並べ，空所( ① )( ② )( ③ )にくるものの記号を書け。各選択肢は一度ずつ用いること。',
  'pre': 'What matters is not making small talk an obligation but', 'post': 'to speak to others.',
  'options': ['an', 'anyone', 'atmosphere', 'feels', 'free', 'in', 'keeping', 'what', 'which', 'whom'],
  'correct': ['G', 'A', 'C', 'F', 'I', 'B', 'D', 'E'], 'marks': {'1': '①', '4': '②', '7': '③'},
  'explain': ['not A but B「AではなくB」。A = making small talk an obligation（make O C「OをCにする」），B = keeping an atmosphere …。',
              'an atmosphere in which anyone feels free to …「誰もが気軽に〜できる雰囲気」。前置詞 + 関係代名詞 in which。',
              'feel free to do「遠慮なく〜する」。what は先行詞を含むので atmosphere の後には置けず，whom は人を指すので不要。',
              '① keeping (G)・② in (F)・③ feels (D)。']},
]

P = {'passage': PASSAGE, 'questions': QUESTIONS}
