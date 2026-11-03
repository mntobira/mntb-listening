# -*- coding: utf-8 -*-
# 第2回 大問2 体験談（新聞配達と隣人の老人）。{u1|…} 下線部。設問は i2_2q.py
from i2_2q import QUESTIONS, VOCAB
P = {
 'title': '長文読解（体験談）',
 'intro': '次の英文は，ある女性が子どものころの体験を振り返って書いた文章である。英文を読んで，後に続く設問に日本語で解答しなさい。（＊印の語には，英文の末尾に意味を示してある。）',
 'passages': [{
  'paras': [
   "When I was twelve, I wanted a bicycle more than anything in the world. Not just any bicycle, but a green one with silver handlebars that stood in the window of the hardware shop on our high street. My parents told me kindly but firmly that it was too expensive. {u1|If I really wanted it, my father said, I would have to earn at least half of the money myself.}",
   "So I took a job delivering newspapers. Every morning at six, before school, I walked a route of forty-two houses with a heavy canvas bag over my shoulder. In winter it was still dark, and my fingers were often so cold that I could hardly fold the papers. I kept a notebook in which I recorded every coin I earned, and each Saturday I counted my savings and worked out how many weeks remained.",
   "The last house on my route belonged to Mr Brannock, a retired carpenter who lived alone. He was always awake when I arrived, and he always opened the door before I could push the paper through the letterbox. At first this annoyed me, because it meant I had to stop and say good morning when all I wanted was to go home and get warm. {u2|Then one icy morning he handed me a mug of hot chocolate and told me to drink it on his step before I went any further.}",
   "After that, the hot chocolate became a habit, and so did our conversations. He told me about the chairs and tables he had made, and about a cabinet* he had built for his wife that took him a whole winter. When I told him about the bicycle, he asked to see my notebook. He studied it carefully for several minutes and then said something I did not understand until years later: {u3|“The bicycle will be nice. But the notebook is worth more.”}",
   "In March, two weeks before I reached my goal, Mr Brannock did not open the door. The paper from the day before was still lying on the mat. I knocked, then ran to the neighbour’s house, and she called an ambulance. He had fallen in the kitchen the previous evening and had been unable to get up. {u4|The doctors said that if he had been left on the floor for another day, he might not have survived.} For a week, I delivered his paper to an empty house.",
   "When he came home, he asked me to come inside. On the table was a small wooden box with my initials carved on the lid. “For your coins,” he said. “Every serious saver needs a proper bank.” I bought the green bicycle in late April, and I rode it for six years. {u5|I no longer have the bicycle, but the box sits on my desk as I write this.}",
   "I have often thought about what he meant. I think he was trying to tell me that the bicycle was only the reward; the real prize was what I had become by working for it. I had learned to get up when I would rather have stayed in bed, to keep records, and to wait. {u6|I had also learned, almost by accident, that the people we see every day without really noticing them may be the ones who matter most.}",
  ],
  'notes': [('cabinet', '飾り棚')],
  'translation': [
   '12歳のとき，私は世界中の何よりも自転車が欲しかった。どんな自転車でもいいわけではなく，大通りの金物店のショーウインドーに飾られていた，銀色のハンドルのついた緑色の自転車だった。両親は，やさしく，しかしきっぱりと，それは高すぎると言った。本当に欲しいなら，少なくとも代金の半分は自分で稼がなければならない，と父は言った。',
   'そこで私は新聞配達の仕事を始めた。毎朝6時，学校へ行く前に，重い帆布のかばんを肩にかけて42軒の家を回る道を歩いた。冬はまだ暗く，指が冷たすぎて新聞をたたむのもやっとということがよくあった。私は稼いだ硬貨を一枚残らず記録するノートをつけ，毎週土曜日に貯金を数えて，あと何週間残っているかを計算した。',
   '私の配達路の最後の家は，一人で暮らす引退した大工のブラノックさんの家だった。彼は私が着くといつも起きていて，私が新聞を郵便受けに押し込む前に，いつもドアを開けた。最初はこれがいやだった。家に帰って暖まりたいだけなのに，立ち止まっておはようございますと言わなければならなかったからだ。そんなある凍えるような朝，彼は私に熱いココアの入ったマグカップを手渡し，先へ行く前に玄関の段に座って飲んでいきなさいと言った。',
   'それ以来，ココアは習慣になり，私たちの会話もそうなった。彼は自分が作った椅子やテーブルのことや，ひと冬まるごとかけて妻のために作った飾り棚のことを話してくれた。私が自転車のことを話すと，彼はノートを見せてほしいと言った。彼は数分間じっくりとそれを見て，それから私が何年も後になるまで理解できなかったことを言った。「自転車はいいものだろう。でも，このノートのほうが価値がある」',
   '3月，目標に届く2週間前，ブラノックさんはドアを開けなかった。前の日の新聞がまだマットの上にあった。私はドアをたたき，それから隣の家に走っていき，隣の女性が救急車を呼んだ。彼は前の晩に台所で転び，起き上がれなくなっていたのだった。もしもう一日床の上に放っておかれていたら，助からなかったかもしれないと医師たちは言った。1週間，私は誰もいない家に彼の新聞を配った。',
   '彼は家に戻ると，私を家の中に招き入れた。テーブルの上には，ふたに私の頭文字が彫られた小さな木の箱があった。「硬貨を入れるためのものだよ」と彼は言った。「本気で貯金する人には，ちゃんとした銀行が必要だからね」。私は4月の終わりに緑色の自転車を買い，6年間乗った。その自転車はもう手元にないが，この文章を書いている私の机の上には，あの箱が置いてある。',
   '私は，彼が言おうとしたことについてよく考えてきた。彼は，自転車はごほうびにすぎず，本当の賞品は，それを手に入れるために働くことで私がどんな人間になったかだ，と伝えようとしていたのだと思う。私は，寝ていたいときに起きること，記録をつけること，そして待つことを学んだ。また，ほとんど偶然に，毎日見かけていながらきちんと気にとめていない人々こそが，いちばん大切な人なのかもしれないということも学んでいた。',
  ],
 }],
 'questions': QUESTIONS,
 'vocab': VOCAB,
}
