# -*- coding: utf-8 -*-
# 第3回 Ⅳ 日本文（書き下ろし「一人の時間」）：問1 和文英訳／問2・問3 語句整序（10個から8個）
PASSAGE = [
 '友人や家族と過ごす時間が大切なことは言うまでもない。けれども最近は，スマートフォンのおかげで，一人でいるときでさえ誰かとつながっていることが当たり前になった。{u1|そのため，誰にも邪魔されずに自分の考えを整理する時間が，以前よりも持ちにくくなっているのではないだろうか。}',
 '一人の時間は，寂しさと結びつけて語られることが多い。{u2|しかし，自分が本当は何を望んでいるのかに気づくのは，周りに誰もいないときであることも少なくない。}他人の意見や画面に流れてくる情報からいったん離れることで，ようやく自分の内側の声が聞こえてくるのだろう。',
 'もちろん，人との交わりを避けて閉じこもればよいということではない。{u3|大切なのは，人とつながる時間と，一人で静かに考える時間との釣り合いを保つことである。}',
]

QUESTIONS = [
 {'no': 1, 'points': 24, 'kind': 'trans_en', 'stem': '下線部(1)を英文にせよ。',
  'source': 'そのため，誰にも邪魔されずに自分の考えを整理する時間が，以前よりも持ちにくくなっているのではないだろうか。',
  'answer': 'Because of this, it may now be harder than it used to be to find time to organize our ideas without anyone disturbing us.',
  'alts': ['As a result, it may have become harder than before to find time to sort out our own thoughts without being disturbed by anyone.'],
  'criteria': [('「そのため」：Because of this / As a result / For this reason', 3),
               ('「自分の考えを整理する時間」：time to organize our ideas / time to sort out our thoughts（不定詞の形容詞的用法）', 6),
               ('「誰にも邪魔されずに」：without anyone disturbing us / without being disturbed by anyone', 6),
               ('「以前よりも持ちにくくなっている」：it may now be harder than it used to be to … など（形式主語 it と比較）', 6),
               ('「〜のではないだろうか」を may / might などで控えめに表し，文法・つづりが正確', 3)],
  'explain': ['「〜のではないだろうか」は筆者の控えめな推測なので，疑問文にせず may / might で表すと自然。“Isn’t it …?” と疑問文で書いても，意味が通れば減点は小さい。',
              '「時間が持ちにくい」は「時間を見つけるのが難しい」と読み換え，it is hard to find time to … とする。主語を time にした直訳（time is hard to have）は不自然。',
              '「以前よりも」は than before / than it used to be。used to の後の be を落とさない。',
              '「邪魔されずに」は without + 動名詞。受け身なら without being disturbed，能動なら without anyone disturbing us。']},
 {'no': 2, 'points': 13, 'kind': 'order_en',
  'stem': '下線部(2)を下のような英文で表すとき，(A)〜(J)から8つを選んで正しく並べ，空所( ① )( ② )( ③ )にくるものの記号を書け。各選択肢は一度ずつ用いること。',
  'pre': 'However, it is', 'post': 'what we really want.',
  'options': ['around', 'is', 'lonely', 'nobody', 'often', 'realize', 'that', 'we', 'when', 'which'],
  'correct': ['E', 'I', 'D', 'B', 'A', 'G', 'H', 'F'], 'marks': {'2': '①', '5': '②', '8': '③'},
  'explain': ['It is 〜 that …「…なのは〜だ」の強調構文。強調されているのは時を表す when nobody is around「周りに誰もいないとき」。',
              '「〜ことも少なくない」は often で表し，It is often when … that … の語順にする。',
              'that の後は we realize what we really want「自分が本当に望むものに気づく」。強調構文なので which は使えず，lonely は「寂しい」で日本文の「周りに誰もいない」とは意味が違うため不要。',
              '① when (I)・② around (A)・③ realize (F)。']},
 {'no': 3, 'points': 13, 'kind': 'order_en',
  'stem': '下線部(3)を下のような英文で表すとき，(A)〜(J)から8つを選んで正しく並べ，空所( ① )( ② )( ③ )にくるものの記号を書け。各選択肢は一度ずつ用いること。',
  'pre': 'The important thing is', 'post': 'others and time spent thinking quietly alone.',
  'options': ['a', 'among', 'balance', 'between', 'for', 'keep', 'spent', 'time', 'to', 'with'],
  'correct': ['I', 'F', 'A', 'C', 'D', 'H', 'G', 'J'], 'marks': {'1': '①', '4': '②', '7': '③'},
  'explain': ['The important thing is to do「大切なのは〜することだ」。補語は to 不定詞 to keep。',
              'keep a balance between A and B「AとBの釣り合いを保つ」。A = time spent with others「人と過ごす時間」，B = time spent thinking quietly alone「一人で静かに考えて過ごす時間」。spent は time を後ろから修飾する過去分詞。',
              'among は三つ以上のものの間に使うので，between A and B の形にはならない。for は入る場所がないので不要。',
              '① to (I)・② balance (C)・③ spent (G)。']},
]

P = {'passage': PASSAGE, 'questions': QUESTIONS}
