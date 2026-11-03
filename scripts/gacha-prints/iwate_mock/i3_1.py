# -*- coding: utf-8 -*-
# 第3回 大問1 長文読解（形の悪い野菜・果物と食品ロス）。{u1|…} 下線部。設問は i3_1q.py
from i3_1q import QUESTIONS, VOCAB
P = {
 'title': '長文読解',
 'intro': '英文を読んで，後に続く設問に日本語で解答しなさい。（＊印の語には，英文の末尾に意味を示してある。）',
 'passages': [{
  'paras': [
   "Walk into almost any supermarket and you will see rows of apples that look as if they were made in a factory: the same size, the same shape and the same shining red. Behind this neat display lies a less attractive fact. In many countries, shops set strict standards for the appearance of the produce* they buy from farmers. Carrots must be straight, cucumbers must not curve too much, and potatoes with small marks on their skin are often rejected. {u1|A considerable share of what farmers grow therefore never reaches the shelves, not because it is unsafe or tasteless, but simply because it does not look the way buyers expect.}",
   "What happens to this rejected food varies. Some of it is sold cheaply to factories that make juice or soup, and some is fed to animals. A large amount, however, is ploughed back into the soil or left to rot in the field, because the cost of picking and transporting it would be higher than the price anyone would pay. For the farmer, this means months of work, water and fuel wasted. For the planet, the land, energy and labour used to grow the food have produced nothing that anyone eats.",
   "Why are shops so demanding? Supermarket managers often say that they are only responding to their customers. {u2|Research on shopping behaviour suggests that when people are given a choice between a perfect tomato and a slightly odd-looking one at the same price, most pick the perfect one, even if they believe the two will taste identical.} Over decades, people have learned to treat appearance as a signal of quality and freshness. Uniform products are also easier to pack into standard boxes and to price by the piece, which makes the whole supply chain run more smoothly.",
   "In recent years, however, a number of shops and small companies have begun to challenge these habits. Some supermarkets now sell boxes of “wonky*” vegetables at a lower price, with cheerful labels that make a joke of their unusual shapes. Online businesses deliver boxes of rejected produce directly to customers’ homes. School cooking clubs have run campaigns showing that a two-legged carrot can be peeled, chopped and cooked like any other. {u3|Such efforts have been more successful than many people expected, partly because they appeal to two different motives at once.} Some customers buy wonky food to save money; others buy it because cutting waste matters to them.",
   "Not everyone is convinced that these schemes are a complete solution. Critics point out that if wonky vegetables are sold more cheaply, farmers may simply be paid less for doing the same work. Others worry that customers who buy cheap wonky produce may stop buying the regular kind, so that the shop’s total sales of fresh food do not rise at all. There is also the question of scale: a box scheme that rescues a few tonnes of carrots a week makes little difference if thousands of tonnes are still being thrown away.",
   "Even so, the movement may be changing something more important than how much food is sold. {u4|By making people laugh at a crooked cucumber, it encourages them to doubt whether the way food looks tells us how good it is.} Once shoppers begin to judge vegetables by their taste rather than their appearance, shops may find that their strict standards are no longer necessary.",
  ],
  'notes': [('produce', '農産物（名詞）'), ('wonky', '（英・口語）形のゆがんだ')],
  'translation': [
   'ほとんどどのスーパーマーケットに入っても，まるで工場で作られたかのように見えるリンゴの列が目に入るだろう。同じ大きさ，同じ形，同じつやのある赤色である。この整った陳列の裏には，あまり魅力的ではない事実がある。多くの国で，店は農家から買い入れる農産物の見た目に厳しい基準を設けている。ニンジンはまっすぐでなければならず，キュウリは曲がりすぎてはならず，皮に小さな傷のあるジャガイモはしばしば受け取りを拒まれる。そのため，農家が育てたもののかなりの部分は，安全でないからでも味がよくないからでもなく，ただ買い手が期待するような見た目をしていないという理由で，決して店の棚に並ばないのである。',
   'このはねられた食べ物がどうなるかはさまざまだ。一部はジュースやスープを作る工場に安く売られ，一部は動物のえさになる。しかし，大量のものは土にすき込まれるか，畑で腐るままにされる。収穫して運ぶ費用が，誰かが払ってくれる値段よりも高くなってしまうからだ。農家にとって，これは何か月もの労働や水，燃料が無駄になることを意味する。地球にとっては，食べ物を育てるのに使われた土地，エネルギー，労働が，誰も食べないものしか生み出さなかったことになる。',
   'なぜ店はそれほど要求が厳しいのだろうか。スーパーマーケットの店長たちは，客に応えているだけだとよく言う。買い物の行動についての研究は，同じ値段の完璧なトマトと少し変わった見た目のトマトのどちらかを選べるとき，たとえ二つの味は同じだと思っていても，ほとんどの人は完璧なほうを選ぶことを示唆している。何十年もかけて，人々は見た目を品質と新鮮さのしるしとして扱うようになった。形のそろった製品は規格の箱に詰めやすく，1個いくらで値段をつけやすいので，供給の流れ全体がより円滑に進むことにもなる。',
   'しかし近年，こうした習慣に異議を唱え始めた店や小さな会社がいくつかある。今では，「形のゆがんだ」野菜の箱を，変わった形をネタにした楽しいラベルをつけて，安い値段で売るスーパーマーケットもある。はねられた農産物の箱を客の家まで直接届けるインターネットの事業もある。学校の料理クラブは，2本足のニンジンもほかのものと同じように皮をむき，刻み，料理できることを示す活動を行ってきた。こうした取り組みは，多くの人が予想していたよりも成功している。その理由の一つは，二つの異なる動機に同時に訴えるからである。お金を節約するために形のゆがんだ食べ物を買う客もいれば，無駄を減らすことが大切だと考えて買う客もいるのだ。',
   'こうした取り組みが完全な解決策だと誰もが納得しているわけではない。形のゆがんだ野菜が安く売られれば，農家は同じ仕事をしても支払われる額が減るだけかもしれない，と批判する人々は指摘する。また，安い形のゆがんだ農産物を買う客が普通のものを買わなくなり，店の生鮮食品の売り上げの合計がまったく増えないのではないかと心配する人もいる。規模の問題もある。週に数トンのニンジンを救う箱の販売も，何千トンものものが今なお捨てられているなら，ほとんど違いを生まない。',
   'それでも，この運動は，どれだけの食べ物が売れるかよりも重要な何かを変えつつあるのかもしれない。曲がったキュウリを人々に笑わせることで，この運動は，食べ物の見た目がその良さを教えてくれるのかどうかを疑うよう人々を促している。買い物客が見た目ではなく味で野菜を判断し始めれば，店は自分たちの厳しい基準がもはや必要ないことに気づくかもしれない。',
  ],
 }],
 'questions': QUESTIONS,
 'vocab': VOCAB,
}
