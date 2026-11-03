# -*- coding: utf-8 -*-
# 第1回 Ⅱ 長文読解（エッセイ・書き下ろし「待つ時間」）
from mk import pos_for, mc1
pos = pos_for(1)

PASSAGE = [
 "Few experiences are as universally disliked as waiting. We wait for buses that are late, for web pages that refuse to load, for a doctor who is running behind schedule, and for replies to messages we sent hours ago. In each case, the minutes seem to stretch, and our patience {wa|wears thin} far sooner than we expect. What is curious is that {u1|the same length of time can feel completely different depending on the circumstances in which we spend it}. Ten minutes in a pleasant conversation pass almost unnoticed; ten minutes staring at a closed door can feel like half an hour.",
 "Part of the explanation lies in where our attention goes. When we are {wb|absorbed} in an activity, we rarely check the clock, and time slips by without our noticing. When we are waiting, by contrast, there is often nothing to occupy the mind except the waiting itself. [[①]] Each glance at a watch reminds us that the thing we want has not yet arrived, and so the attention we pay to time actually makes it seem to move more slowly. This is why people who design public spaces have long tried to give those who wait something to look at, read or do.",
 "Uncertainty makes matters worse. A wait of fifteen minutes is far easier to bear when we know it will last fifteen minutes than when we have no idea whether it will end in two minutes or in an hour. [[②]] Not knowing turns a simple delay into a small source of *anxiety, because we cannot plan, relax or decide whether to give up and leave. A short message announcing that the train will arrive in twelve minutes does nothing to make the train faster, yet it changes the experience of everyone on the platform. The delay is the same; what has changed is that people can now fit it into their picture of the day. Similarly, a receptionist at a clinic who says “about forty minutes” often makes patients calmer than one who says nothing at all.",
 "Fairness matters too, perhaps more than we usually admit. Most people will accept a long wait with reasonable calm as long as they believe that everyone is being treated equally. What {wc|provokes} real anger is the sense that someone else has been allowed to jump ahead without good reason. [[③]] In this respect, a queue is not just a practical arrangement for serving people one by one; it is a small social agreement, and people react strongly when they feel it has been broken. {u2|Someone who has waited patiently for twenty minutes may forgive the delay itself, but not the stranger who walks straight to the front.}",
 "If waiting is so unpleasant, it is tempting to conclude that the ideal world would be one in which we never had to wait at all. Modern technology seems to be moving us in that direction. Films begin the moment we choose them, goods arrive at our door within a day, and questions that once required a trip to the library can be answered in seconds. Much of this is undeniably useful. A parent who can order medicine at midnight or a student who can check a fact instantly is better off than someone who had to wait days for the same result. Yet it is worth asking whether something is lost when every gap in our day is filled and every wish is met at once.",
 "One possibility is that waiting, at least in moderate amounts, gives value to the things we wait for. A meal that has been slowly prepared, a letter from a friend in a distant country, or a holiday that has been planned for months often brings a pleasure that is partly made of *anticipation. The days before the event are not simply empty time to be endured; they are filled with imagining, preparing and looking forward. Children counting the days until a birthday understand this instinctively: the counting itself adds to the fun. Remove the wait entirely, and {o3} before the experience even begins.",
 "Waiting may also offer something more modest but no less important: a pause. In a life crowded with tasks and notifications, the few minutes spent in a queue or at a bus stop are among the rare moments in which nothing is demanded of us. No one expects an answer from us, no task is waiting to be finished, and for once we are free to be slightly bored. Some people use these moments to *daydream, to notice the street around them, or simply to let their thoughts settle. When we fill every such gap automatically with a screen, we may gain a little information, but we also give up a chance to rest our minds. It may be no coincidence that people often report having their best ideas while doing nothing in particular.",
 "None of this is an argument for long, pointless delays. A hospital that keeps patients waiting for hours, or an office that makes people return again and again to complete a simple form, is failing them, and the frustration they feel is entirely justified. Reducing such delays is a responsibility that organizations should take seriously. The point is rather that waiting is not a single thing. Some waits are wasteful and should be reduced; others are part of what makes an experience meaningful. Learning to tell the difference, and perhaps to treat a few idle minutes as an opportunity rather than an *ordeal, may be a skill worth developing in an age that has made {wd|impatience} so easy.",
]

NOTES = [('anxiety', '不安'), ('anticipation', '期待'), ('daydream', '空想にふける'), ('ordeal', '苦しい試練')]

QUESTIONS = [
 {'no': 1, 'points': 10, 'kind': 'ja_free',
  'stem': '下線部(1)のような違いが生じる理由として筆者が挙げていることを，本文に沿って二つ，日本語で手短に述べよ。',
  'answer': '①何かに夢中になっているときは時間を気にしないが，待っているときは待つこと以外に注意を向ける対象がなく，時間に注意を払うことでかえって時間が遅く感じられるから。②待ち時間がいつ終わるのかわからないと，予定も立てられず不安になり，同じ長さの待ち時間でも耐えがたく感じられるから。',
  'alts': ['①待っている間は時計ばかり気にしてしまい，時間に注目するほど時間が進まないように感じられるため。②終わりが見えない待ち時間は先の見通しが立たず，不安を生むため。（③として，不公平に扱われていると感じると怒りが強まる点を挙げてもよい）'],
  'criteria': [('理由1：注意が時間そのものに向かうと遅く感じる（夢中なら気づかない）', 5),
               ('理由2：終わりがわからない不確かさが不安を生み，耐えにくくする', 5)],
  'explain': ['第2段落 “the attention we pay to time actually makes it seem to move more slowly” と，第3段落 “Uncertainty makes matters worse” が二つの理由の中心。',
              '第4段落の「公平さ」も待ち時間の感じ方にかかわるので，二つのうち一つとして挙げた場合も内容が正しければ得点を与える。',
              '「楽しいと時間が早い」と現象を言い換えただけでは理由の説明にならないので不可。']},
 {'no': 2, 'points': 10, 'kind': 'ja_free',
  'stem': '下線部(2)が具体的に表している内容を，本文に沿って日本語で説明せよ。',
  'answer': '人は，皆が同じように扱われていると思えば長い待ち時間そのものは比較的落ち着いて受け入れるが，正当な理由もなく誰かが列に割り込むと，順番を守るという暗黙の約束が破られたと感じて強く腹を立てるということ。',
  'alts': ['行列で長く待たされること自体は我慢できても，理由なく先に入り込む人がいると，皆で守ってきた公平さの取り決めが壊されたと感じ，その人を許せなくなるということ。'],
  'criteria': [('遅れ（長い待ち時間）そのものは許せる・受け入れられる', 3),
               ('理由なく前に割り込む人は許せない', 3),
               ('その理由：行列は公平さについての社会的な約束であり，それが破られたと感じるから', 4)],
  'explain': ['the delay itself は「待たされること自体」，the stranger who walks straight to the front は「まっすぐ先頭に行く見知らぬ人＝割り込む人」。',
              '同じ段落の “a queue is not just a practical arrangement … it is a small social agreement” を理由として盛り込むと高得点になる。',
              '「20分」「見知らぬ人」をそのまま訳すだけでは説明として不十分。']},
 {'no': 3, 'points': 6, 'kind': 'order', 'under': '3',
  'stem': '下線部(3)の［　］内の語を正しく並べて意味の通る英文にするとき，3番目・6番目・9番目にくる語の記号を書け。各語は一度ずつ用いること。',
  'words': ['much', 'of', 'we', 'the', 'that', 'enjoyment', 'might', 'we', 'lose', 'feel'],
  'correct': ['C', 'G', 'I', 'A', 'B', 'D', 'F', 'E', 'H', 'J'], 'ask': [3, 6, 9],
  'sentence_part': 'we might lose much of the enjoyment that we feel',
  'sentence': 'Remove the wait entirely, and we might lose much of the enjoyment that we feel before the experience even begins.',
  'explain': ['命令文 + and S V「〜せよ，そうすれば…」の形。and の後に主節 we might lose を置く。',
              'lose の目的語は much of the enjoyment「楽しみの多く」。',
              'that we feel は enjoyment を修飾する関係代名詞節で，before the experience even begins へとつながる。',
              '3番目 lose (I)・6番目 the (D)・9番目 we (H)。we は二つあるので，(C) と (H) の位置を区別して答える。']},
 {'no': 4, 'points': 6, 'kind': 'insert',
  'stem': '本文中の空所［①］〜［③］を補うのに最適な文を(A)〜(C)のうちからそれぞれ一つ選び，その記号を書け。各選択肢は一度ずつ用いること。',
  'choices': ['The end point is what allows the mind to accept the wait.',
              'We become, in a sense, observers of our own impatience.',
              'Even a brief delay feels intolerable once it seems unjust.'],
  'answer': {'①': 1, '②': 0, '③': 2},
  'reasons': ['［②］に入る。直前は「終わりがわかっている待ち時間は耐えやすい」，直後は「わからないことが不安を生む」。“The end point” が「終わりの時点」を指し，前後をつなぐ。',
              '［①］に入る。直前は「待つこと以外に心を占めるものがない」，直後は「時計を見るたびに…」。自分の待ちきれない気持ちを眺めてしまう状態を述べる文として流れに合う。',
              '［③］に入る。第4段落は公平さの話題。“unjust” が直前の「理由なく割り込まれる」ことを受け，直後の「行列は社会的な約束である」へつながる。']},
 {'no': 5, 'points': 10, 'kind': 'tf2',
  'stem': '本文の内容から推し量れることとして適当なものを(A)〜(E)のうちから二つ選び，その記号を書け。',
  'choices': ['Telling waiting passengers when the train will come may make them calmer even though the train is not any earlier.',
              'The writer claims that modern technology has made waiting completely unnecessary in daily life.',
              'People generally become angrier about the length of a wait than about whether others are treated equally.',
              'The writer suggests that some of the pleasure of an event can come from the period before it happens.',
              'The writer recommends that hospitals make patients wait longer so that they can rest their minds.'],
  'answer': [0, 3],
  'reasons': ['○ 第3段落の到着予定の案内の例。“does nothing to make the train faster, yet it changes the experience” と一致する。',
              '× 筆者は技術が待ち時間を減らしていると述べるが，「完全に不要にした」とは言っていない（言い過ぎ）。',
              '× 第4段落は，長い待ち時間よりも不公平な扱いのほうが怒りを生むと述べている（本文と逆）。',
              '○ 第6段落 “a pleasure that is partly made of anticipation” と一致する。',
              '× 第8段落は，病院で何時間も待たせることを「人々の期待に応えていない」と批判している（本文と逆）。']},
 {'no': 6, 'points': 8, 'kind': 'synonym',
  'stem': '下線部(a)〜(d)の文脈上の意味に最も近い語句を，それぞれ(A)〜(D)のうちから一つ選び，その記号を書け。',
  'items': [
   {'label': 'a', 'word': 'wears thin', 'choices': ['grows stronger', 'becomes visible', 'stays calm', 'runs out'], 'answer': 3,
    'reason': '第1段落の下線部(a)。忍耐が「すり減る・尽きかける」の意味で，run out「尽きる」が最も近い。'},
   {'label': 'b', 'word': 'absorbed', 'choices': ['deeply involved', 'slightly tired', 'quietly bored', 'easily confused'], 'answer': 0,
    'reason': '第2段落の下線部(b)は「〜に夢中になって」。deeply involved が近い。'},
   {'label': 'c', 'word': 'provokes', 'choices': ['prevents', 'reduces', 'causes', 'hides'], 'answer': 2,
    'reason': '第4段落の下線部(c)を含む部分は「本当の怒りを引き起こすもの」。cause が最も近い。'},
   {'label': 'd', 'word': 'impatience', 'choices': ['eagerness to wait', 'inability to wait calmly', 'fear of the future', 'lack of interest'], 'answer': 1,
    'reason': '最終文の下線部(d)は「待ちきれなさ・短気」。inability to wait calmly「落ち着いて待てないこと」が最も近い。'}]},
]

TRANSLATION = [
 '待つことほど誰からも嫌われる経験はそう多くない。私たちは遅れているバスを待ち，なかなか読み込まれないウェブページを待ち，予定より遅れている医者を待ち，何時間も前に送ったメッセージへの返事を待つ。どの場合も数分が引き延ばされるように感じられ，私たちの忍耐は予想よりずっと早くすり減っていく。興味深いのは，同じ長さの時間でも，それをどのような状況で過ごすかによってまったく違って感じられることである。楽しい会話の中の10分はほとんど気づかれずに過ぎるが，閉まったドアを見つめて過ごす10分は30分にも感じられることがある。',
 'その説明の一部は，私たちの注意がどこに向かうかにある。何かの活動に夢中になっているとき，私たちはめったに時計を確かめず，時間は気づかないうちに過ぎていく。それに対して待っているときには，待つことそのもの以外に心を占めるものが何もないことが多い。私たちはある意味で，自分自身の待ちきれなさを観察する者になるのだ。時計に目をやるたびに，望むものがまだ来ていないことを思い知らされる。こうして時間に払う注意が，実際には時間をよりゆっくり進むように見せてしまうのである。公共の空間を設計する人々が，待つ人に何か見るもの，読むもの，することを与えようと昔から工夫してきたのはこのためである。',
 '不確かさは事態をさらに悪くする。15分の待ち時間は，それが15分続くとわかっているときのほうが，2分で終わるのか1時間かかるのか見当もつかないときよりもずっと耐えやすい。終わりの時点こそが，心に待つことを受け入れさせるのである。わからないということは，単なる遅れを小さな不安の種に変えてしまう。計画を立てることも，くつろぐことも，あきらめて立ち去るかどうか決めることもできないからだ。電車があと12分で到着するという短い案内は，電車を少しも速くはしないが，ホームにいるすべての人の経験を変える。遅れは同じである。変わったのは，人々がその遅れを一日の見通しの中に組み込めるようになったことなのである。同様に，「40分ほどです」と伝える医院の受付係は，何も言わない受付係よりも患者を落ち着かせることが多い。',
 '公平さもまた重要であり，おそらく私たちがふだん認める以上に重要である。たいていの人は，皆が同じように扱われていると信じている限り，長い待ち時間をそれなりに落ち着いて受け入れる。本当の怒りを引き起こすのは，誰か別の人が正当な理由もなく先に入ることを許されたという感覚である。ほんの短い遅れでも，それが不当に思えたとたんに耐えがたくなる。この点で，行列は単に人々に一人ずつ対応するための実際的な仕組みではなく，小さな社会的な取り決めであり，人々はそれが破られたと感じると激しく反応する。20分間辛抱強く待った人は，遅れそのものは許すかもしれないが，まっすぐ先頭へ歩いていく見知らぬ人は許さないのだ。',
 '待つことがそれほど不快なら，理想の世界とはまったく待つ必要のない世界だと結論づけたくなる。現代の技術は私たちをその方向へ導いているように見える。映画は選んだ瞬間に始まり，品物は1日以内に玄関に届き，かつては図書館へ足を運ぶ必要があった疑問も数秒で答えが得られる。こうしたことの多くが本当に役に立つことは疑いない。真夜中に薬を注文できる親や，事実を即座に確かめられる学生は，同じ結果を得るのに何日も待たなければならなかった人より恵まれている。しかし，一日のあらゆる隙間が埋められ，あらゆる望みがすぐにかなえられるとき，何かが失われていないかと問うてみる価値はある。',
 '一つの可能性として，待つことは，少なくとも適度な量であれば，待っている物事に価値を与えるということが考えられる。ゆっくりと準備された食事，遠い国の友人からの手紙，何か月も前から計画してきた休暇は，その一部が期待でできている喜びをもたらすことが多い。その出来事までの日々は，ただ耐えるべき空っぽの時間ではなく，想像し，準備し，心待ちにすることで満たされている。誕生日までの日数を数える子どもたちは，このことを本能的に理解している。数えることそのものが楽しみを増やしてくれるのだ。待つことを完全に取り除けば，経験が始まる前から感じている楽しみの多くを，私たちは失ってしまうかもしれない。',
 '待つことは，もっとささやかだが，劣らず大切なものも与えてくれるかもしれない。それは一息つく時間である。仕事や通知でいっぱいの生活の中で，行列やバス停で過ごす数分は，何も求められない数少ない瞬間の一つである。誰も私たちに返事を期待しておらず，片づけるべき仕事も待っていない。このときばかりは，少し退屈していてもかまわないのだ。そうした瞬間を空想にふけったり，周りの通りに目を向けたり，ただ考えを落ち着かせたりするのに使う人もいる。そうした隙間をすべて無意識に画面で埋めてしまうと，わずかな情報は得られるかもしれないが，心を休める機会も手放すことになる。人々がよく，特に何もしていないときに最良の考えが浮かぶと言うのは，偶然ではないのかもしれない。',
 'こうしたことはどれも，長くて無意味な遅れを擁護する主張ではない。患者を何時間も待たせる病院や，簡単な書類を仕上げるために何度も足を運ばせる役所は人々の期待に応えておらず，人々が感じる不満はまったく正当である。そうした遅れを減らすことは，組織が真剣に受け止めるべき責任である。むしろ言いたいのは，待つことは一種類ではないということだ。無駄なので減らすべき待ち時間もあれば，経験を意味あるものにしている一部である待ち時間もある。その違いを見分けることを学び，そしてときには何もない数分を苦しい試練ではなく機会として扱うことは，待ちきれなさをこれほど容易にしてしまった時代において，身につける価値のある技能なのかもしれない。',
]

VOCAB = [
 ('universally', '普遍的に・誰からも'), ('stretch', '延びる'), ('circumstances', '状況'),
 ('occupy', '〜を占める'), ('glance', 'ちらりと見ること'), ('uncertainty', '不確かさ'),
 ('bear', '〜に耐える'), ('provoke', '〜を引き起こす'), ('queue', '行列'),
 ('tempting', '〜したくなる・魅力的な'), ('undeniably', '否定しようもなく・明らかに'), ('moderate', '適度な'),
 ('endure', '〜に耐える'), ('coincidence', '偶然'), ('justified', '正当な'), ('idle', '何もしていない'),
]

P = {'passage': PASSAGE, 'notes': NOTES, 'questions': QUESTIONS, 'translation': TRANSLATION, 'vocab': VOCAB}
