# -*- coding: utf-8 -*-
# 第2回 大問1 長文読解（論説・書き下ろし）
from mk import pos_for, mc1
pos = pos_for(2)

PASSAGE = [
 "Few experiences are as widely disliked as boredom. We feel it in waiting rooms, on long train journeys, and during meetings that seem to have no end, and most of us will do almost anything to escape it. In the past, escape was not always possible: a person waiting for a bus had little choice but to look at the street, watch the clouds, or let the mind drift. Today, a phone in the pocket means that no moment ever needs to be empty. Whenever a gap appears in our day, we can fill it instantly with news, games, messages, or videos. It is worth asking whether this constant filling is entirely a good thing.",
 "At first glance, the answer seems obvious. Boredom is unpleasant, and avoiding unpleasant feelings is a reasonable thing to do. {u1|If technology allows us to turn wasted minutes into time spent learning, laughing, or keeping in touch with friends, it would seem foolish to refuse such an offer simply because earlier generations had to put up with long hours of dullness.} Few people would argue that we should return to a world without books or radio for the sake of feeling bored more often.",
 "Yet boredom may be more than an empty feeling waiting to be removed. It can be understood as a signal, much like hunger or tiredness, telling us that our current situation is failing to engage us. Hunger pushes us to look for food; boredom pushes us to look for something worth doing. When we respond to that signal by reaching for a phone, we silence it without asking what it was trying to tell us. ( ア ), we may never discover that we are dissatisfied with our work, our studies, or the way we spend our evenings, because the feeling that might have prompted change is switched off before it has a chance to grow.",
 "Boredom is also linked with imagination. Many writers, artists, and inventors have described ideas that came to them not while they were concentrating hard, but while they were doing something dull, such as walking, washing dishes, or staring out of a window. {u2|An unoccupied mind does not simply switch off; it begins to wander, to make unexpected connections, and to rehearse possibilities that a busy mind would never have time to consider.} Children who are left without organized activities, for example, often complain at first, but many eventually invent games, build things, or tell themselves stories. The complaint is the beginning of the process rather than its conclusion.",
 "Of course, not all boredom is useful. A worker performing the same task for eight hours a day, with no opportunity to vary it, may simply suffer, and no amount of daydreaming will make the job more meaningful. People who are bored for long periods, with no prospect of change, can become restless, unhappy, or even unwell. ( イ ) boredom can encourage reflection, it is not something to be imposed on others or celebrated without limits. The point is not that we should seek it out, ( ウ ) that we should not always rush to destroy it.",
 "What, then, can be done? One modest suggestion is to leave some gaps in the day unfilled on purpose: to walk to the station without headphones, or to sit quietly for a few minutes after finishing one task before starting the next. {u3|This may feel uncomfortable at first, because we have grown used to receiving a steady stream of small rewards from our screens, and their absence can make an ordinary moment seem strangely long.} With practice, however, many people find that these pauses become a source of calm, and sometimes of ideas they would not otherwise have had.",
 "None of this requires us to give up the devices that make modern life so convenient. Phones and computers are remarkable tools, and being able to fill an idle moment with something interesting is, in many ways, a gift. But a gift that is used without thought can gradually change the person who receives it. By learning to tolerate a little boredom, we may recover a space in which the mind can wander, notice what is missing, and begin to imagine something new.",
]

QUESTIONS = [
 {'no': 1, 'points': 8, 'kind': 'trans', 'stem': '下線部(1)を和訳せよ。',
  'answer': '科学技術によって，無駄な数分間を，学んだり笑ったり友人と連絡を取り合ったりして過ごす時間に変えられるのであれば，前の世代が長時間の退屈に耐えなければならなかったというだけの理由でそうした申し出を断るのは，愚かなことに思えるだろう。',
  'alts': ['技術のおかげで無駄になる数分を，何かを学ぶ時間や笑う時間，友人とつながる時間に変えられるなら，昔の世代は長く退屈な時間を我慢しなければならなかったからというだけでその申し出を拒むのは，ばかげているように思われるだろう。'],
  'criteria': [('If 節「技術が〜を…に変えることを可能にするなら」（allow O to do）', 2), ('turn A into B「AをBに変える」と time spent doing「〜して過ごす時間」', 2),
               ('it would seem foolish to refuse such an offer「そうした申し出を断るのは愚かに思えるだろう」', 2), ('simply because …「単に〜という理由で」と put up with「〜に耐える」', 2)],
  'explain': ['allow O to do「Oが〜するのを可能にする」。無生物主語なので「技術によって〜できるなら」と訳すと自然。',
              'time spent learning, laughing, or keeping in touch with friends は過去分詞 spent が time を後ろから修飾する形。',
              'it は形式主語で，to refuse such an offer が真主語。would は仮定の気持ち（「〜に思えるだろう」）。',
              'simply because … は「単に〜だからというだけで」。put up with は「我慢する」。dullness は「退屈さ」。']},
 mc1(2, 5, '( ア )を補うのにふさわしいものを，(A)〜(D)のうちから一つ選べ。',
     ['As a result', 'In contrast', 'For instance', 'Even so'],
     ['○ 前文「合図を，それが何を伝えようとしていたかを問わずに黙らせてしまう」の結果として，「不満に気づかないままになるかもしれない」と続く。因果関係なので As a result。',
      '× 前後は対立していない。後ろの文は前の内容がもたらす事態を述べている。',
      '× 後ろの文は前文の具体例ではなく，その帰結である。',
      '× Even so「それでも」は前の内容と反対の流れを導くが，ここは同じ方向の流れ。'], pos()),
 {'no': 3, 'points': 7, 'kind': 'ja_limit', 'limit': 60,
  'stem': '下線部(2)はどのようなことを述べているか。本文に即して説明せよ。句読点も1字に数え，60字以内とする。',
  'answer': '何もしていない心は停止せず，さまよって意外な結びつきを作り，忙しい心では考える暇のない可能性を思い描くということ。',
  'alts': ['暇な心は止まるのではなく，思いをめぐらせて思わぬ結びつきを見つけ，忙しいときには考えない可能性を試すということ。'],
  'criteria': [('何もしていない心は停止しない（switch off しない）', 2), ('さまよい，思いがけない結びつきを作る', 3), ('忙しい心には考える時間のない可能性を思い描く', 2)],
  'explain': ['セミコロン（;）の後で，心が「何をするか」が3つの不定詞（to wander / to make … / to rehearse …）で並べられている。3つすべてに触れる。',
              'rehearse は「下稽古する」が原義。ここでは「頭の中で試してみる・思い描く」。',
              'a busy mind would never have time to consider は，unoccupied mind（暇な心）との対比。「忙しい心では考える時間がない」と対比を残す。']},
 mc1(4, 5, '( イ )と( ウ )を補う語の組み合わせのうち，最も適当なものを(A)〜(E)から一つ選べ。',
     ['イ: Although　ウ: but', 'イ: Because　ウ: and', 'イ: Unless　ウ: or', 'イ: Since　ウ: so', 'イ: Until　ウ: nor'],
     ['○ ( イ )「退屈は内省を促しうるけれども，押しつけたり無制限にたたえたりするものではない」で譲歩。( ウ ) は not A but B「AではなくB」。',
      '× Because では「内省を促すから押しつけるべきではない」となり論理が逆になる。not A and B という形もない。',
      '× Unless「〜でない限り」は条件で，文意が通らない。',
      '× Since は理由で ( イ ) が成り立たず，not A so B という形もない。',
      '× Until は時を表し文意に合わない。nor は否定の後に「〜もない」を続ける語で，not A but B の形にならない。'], pos()),
 {'no': 5, 'points': 9, 'kind': 'trans', 'stem': '文頭の This が指す内容を具体的に示しつつ，下線部(3)を和訳せよ。',
  'answer': '一日の中のすきま時間をわざと埋めずに残しておくことは，最初は落ち着かなく感じられるかもしれない。私たちは画面からささやかな報酬を絶え間なく受け取ることに慣れてしまっており，それがないと，ありふれた一瞬が妙に長く感じられることがあるからだ。',
  'alts': ['ヘッドホンをつけずに駅まで歩くなど，あえて何もしない時間を作ることは，初めのうちは居心地が悪いかもしれない。というのも，私たちは画面から小さなごほうびを次々と受け取るのに慣れてしまっていて，それがないと普段の何気ない時間がやけに長く思えることがあるからである。'],
  'criteria': [('This の内容「一日のすきま時間をわざと埋めずにおくこと」を示す', 3), ('may feel uncomfortable at first「最初は落ち着かなく感じるかもしれない」', 2),
               ('have grown used to receiving …「〜を受け取ることに慣れてしまった」', 2), ('their absence can make … seem strangely long「それがないと〜が妙に長く思える」', 2)],
  'explain': ['This は直前の文 “leave some gaps in the day unfilled on purpose” を指す。具体例（ヘッドホンなしで歩く・作業の合間に座る）を入れてもよい。',
              'grow used to doing は「〜することに慣れる」。to の後が動名詞になる点に注意。',
              'their は small rewards from our screens を指す。無生物主語の make O do は「〜すると…が…に思える」と訳すと自然。']},
 {'no': 6, 'points': 8, 'kind': 'tf2', 'stem': '本文の内容と合致しないものを，(A)〜(F)のうちから二つ選べ。',
  'choices': ['A phone, as the author notes, allows people to fill almost any empty moment.',
              'In the author’s view, boredom can work as a signal, much as hunger does.',
              'The author claims that boredom is always beneficial, even when it continues for years.',
              'Children without organized activities sometimes end up creating their own games.',
              'The author recommends that people stop using phones and computers altogether.',
              'Leaving some moments unfilled may feel strange at first.'],
  'answer': [2, 4],
  'reasons': ['× 本文と合致する（正解ではない）：第1段落 “no moment ever needs to be empty” と合う。',
              '× 本文と合致する（正解ではない）：第3段落 “It can be understood as a signal, much like hunger or tiredness” と合う。',
              '○ 本文と合致しない（正解）：第5段落 “not all boredom is useful” と逆。長く続く退屈は人を不幸にしうるとある。',
              '× 本文と合致する（正解ではない）：第4段落 “many eventually invent games, build things, or tell themselves stories” と合う。',
              '○ 本文と合致しない（正解）：最終段落 “None of this requires us to give up the devices” と逆。',
              '× 本文と合致する（正解ではない）：第6段落 “This may feel uncomfortable at first” と合う。']},
]

TRANSLATION = [
 '退屈ほど広く嫌われている経験はほとんどない。私たちは待合室で，長い列車の旅で，終わりがないように思える会議の最中に退屈を感じ，たいていの人はそこから逃れるためならほとんど何でもする。かつては逃れることが常にできたわけではなかった。バスを待つ人は，通りを眺めるか，雲を見るか，ぼんやりと考えをさまよわせるくらいしかなかった。今では，ポケットに電話があるので，どんな瞬間も空白である必要がない。一日の中にすきまができるたびに，ニュースやゲーム，メッセージ，動画ですぐに埋めることができる。この絶え間ない穴埋めが全面的によいことなのかどうか，問うてみる価値がある。',
 '一見，答えは明らかに思える。退屈は不快であり，不快な感情を避けるのは理にかなったことだ。(1)科学技術によって，無駄な数分間を，学んだり笑ったり友人と連絡を取り合ったりして過ごす時間に変えられるのであれば，前の世代が長時間の退屈に耐えなければならなかったというだけの理由でそうした申し出を断るのは，愚かなことに思えるだろう。もっと頻繁に退屈を味わうために，本もラジオもない世界に戻るべきだと主張する人はほとんどいないだろう。',
 'しかし，退屈は取り除かれるのを待っている空っぽの感情以上のものかもしれない。退屈は，空腹や疲労とよく似た合図，つまり今の状況が自分を夢中にさせていないことを知らせる合図だと理解することができる。空腹は私たちを食べ物探しへと駆り立て，退屈はやる価値のあること探しへと駆り立てる。その合図に電話へ手を伸ばすことで応じると，私たちはそれが何を伝えようとしていたのかを問うことなく，合図を黙らせてしまう。その結果，自分が仕事や勉強や夜の過ごし方に不満を抱いていることに，決して気づかないままになるかもしれない。変化を促したかもしれない感情が，大きくなる機会を得る前にスイッチを切られてしまうからである。',
 '退屈は想像力とも結びついている。多くの作家や芸術家，発明家が，懸命に集中しているときではなく，散歩や皿洗い，窓の外をじっと眺めることといった退屈なことをしているときに思いついた考えについて語ってきた。(2)何もしていない心は単にスイッチが切れるわけではない。さまよい始め，思いがけない結びつきを作り，忙しい心では考える時間が決してないような可能性を頭の中で試し始めるのである。たとえば，決められた活動を与えられずに放っておかれた子どもは，最初は文句を言うことが多いが，やがて多くがゲームを考え出したり，物を作ったり，自分に物語を語って聞かせたりする。文句はその過程の終わりではなく始まりなのだ。',
 'もちろん，すべての退屈が役に立つわけではない。変化をつける機会もなく1日8時間同じ作業をする労働者は，ただ苦しむだけかもしれず，どれほど空想しても仕事がより意味のあるものになることはない。変化の見込みもなく長期間退屈している人は，落ち着かなくなったり，不幸になったり，体調を崩したりすることさえある。退屈は内省を促しうるけれども，他人に押しつけたり，際限なくたたえたりするものではない。要するに，退屈を求めるべきだというのではなく，いつも急いで退屈をなくそうとすべきではない，ということなのである。',
 'では，どうすればよいのか。ささやかな提案の一つは，一日の中のすきまの一部を，わざと埋めないままにしておくことだ。ヘッドホンをつけずに駅まで歩いたり，一つの作業を終えたら次を始める前に数分間静かに座ったりするのである。(3)これは最初は落ち着かなく感じられるかもしれない。私たちは画面からささやかな報酬を絶え間なく受け取ることに慣れてしまっており，それがないと，ありふれた一瞬が妙に長く感じられることがあるからだ。しかし慣れてくると，多くの人が，こうした間が安らぎの源になり，ときにはそうでなければ浮かばなかったであろう考えの源にもなると気づく。',
 'こうしたことのどれも，現代の生活をこれほど便利にしている機器を手放すことを求めてはいない。電話やコンピューターはすばらしい道具であり，手持ちぶさたな瞬間を興味深いもので満たせることは，多くの点で一つの恵みである。だが，考えなしに使われる恵みは，それを受け取る人を少しずつ変えてしまうことがある。少しの退屈に耐えることを学べば，心がさまよい，足りないものに気づき，何か新しいものを思い描き始められる余地を取り戻せるかもしれない。',
]

VOCAB = [('drift', '（考えが）さまよう'), ('put up with ～', '〜に耐える'), ('dullness', '退屈さ'), ('engage', '（人の）心をとらえる'),
         ('dissatisfied', '不満な'), ('prompt', '促す・引き起こす'), ('unoccupied', '何もしていない・暇な'), ('rehearse', '頭の中で試す・下稽古する'),
         ('prospect', '見込み'), ('restless', '落ち着かない'), ('impose A on B', 'AをBに押しつける'), ('on purpose', 'わざと'),
         ('grow used to doing', '〜することに慣れる'), ('absence', '不在・ないこと'), ('idle', '手持ちぶさたな'), ('tolerate', '耐える・容認する')]

PART = {'passage': PASSAGE, 'questions': QUESTIONS, 'translation': TRANSLATION, 'vocab': VOCAB, 'notes': []}
