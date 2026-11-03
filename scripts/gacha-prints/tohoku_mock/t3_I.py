# -*- coding: utf-8 -*-
# 第3回 Ⅰ 長文読解（論説・書き下ろし「消えていく静けさ」）
from mk import pos_for, mc1
pos = pos_for(3)

PASSAGE = [
 "Ask people what they remember about a city they have visited, and most will describe what they saw: tall buildings, crowded markets, a famous bridge at sunset. Far fewer mention what they heard, although sound shapes our experience of a place {gア|at least as much as} sight does. Traffic, construction work, sirens, air-conditioning units and music drifting out of shops combine into a constant background that most residents eventually stop noticing. Yet our failure to notice a sound any longer is no proof that it leaves us untouched. {u1|The body, it seems, goes on listening long after the mind has stopped paying attention.}",
 "Throughout most of the human past, the loudest sounds people heard were natural ones: thunder, waterfalls, the roar of a storm at sea. Human activity added bells, hammers and the clatter of carts on stone streets, but these sounds rose and fell with the rhythm of the working day, and night was, for the most part, quiet. The arrival of engines changed this {gイ|more dramatically than} any earlier invention. Railways, factories and later motor vehicles produced noise that was not only louder but also continuous, and as cities grew, the hours of genuine quiet {gウ|became} fewer and fewer. Today, in many large cities, there is no time of the night when the hum of traffic disappears completely. Many residents {gエ|has grown so used to this} that they find complete silence strange, even uncomfortable, when they {gオ|stay in} the countryside for a few days.",
 "[[I]], getting used to noise differs from being unaffected by it. Our hearing evolved as an early warning system, and unlike our eyes, our ears cannot be closed. Even during sleep, the brain continues to monitor the surroundings, ready to wake us if something seems wrong. A passing truck or a slammed door can cause a brief rise in heart rate and pull a sleeper from deep sleep into a lighter stage, although the sleeper may not wake fully or remember anything in the morning. {u2|Repeated night after night, these small disturbances may add up to something far from small, which is why noise is increasingly discussed not simply as a nuisance but as a public health issue.} People who sleep badly for long periods tend to feel tired, irritable and less able to concentrate, and the cause may lie partly in sounds they never consciously heard.",
 "Noise, like many other environmental burdens, is not shared equally. Homes beside busy roads, railway lines and airports tend to be cheaper, so the people who live in them are often those {gカ|who have the fewest} choices about where to live. Wealthier residents can buy houses on quiet streets, install thick double windows, or leave the city at weekends for somewhere calmer. Children are affected too. Pupils who attend schools beside major roads {gキ|may find it harder concentrating} on their lessons when lorries rumble past the windows every few minutes, and teachers in such schools sometimes have to stop speaking until the noise fades. A problem that seems merely annoying for one family can, across a whole neighbourhood, become a quiet form of disadvantage.",
 "If noise is a burden, quiet is a resource, and like other resources it can be protected or lost. Some cities have begun to treat quiet places, such as small parks, courtyards and riverbanks, as something {gク|worth identifying and defending}, just as they protect historic buildings or old trees. Planners can route heavy traffic away from homes, plant thick hedges along roads, and design buildings so that bedrooms face inner gardens rather than busy streets. Such measures rarely make headlines, and their benefits are hard to see in a photograph. Their effect, however, can be felt by anyone who walks from a roaring avenue into a sheltered square and notices, almost with surprise, that their shoulders have relaxed.",
 "Protecting quiet does not mean creating silence. Few people would want to live in a city with no sound at all, and complete silence can feel unsettling rather than peaceful. {u3|The sounds that people tend to find restful, such as running water, birdsong, wind in the trees and distant voices, are rarely the quietest ones; what matters is less how loud a sound is than whether we feel free to escape it.} A neighbour’s music {gケ|that we cannot turn off} may disturb us far more than the louder roar of a waterfall we have chosen to visit. Control, in other words, shapes our response to sound as much as volume does, and a good city offers its residents places where they can choose the sounds around them.",
 "Individuals have a role too. Much of the noise in modern life is produced not by factories or aircraft but by ordinary people going about their day: car horns used out of impatience, phones ringing in quiet carriages, music played loudly through open windows. Each of these sounds may seem trivial on its own, yet together they form much of the background that wears people down. Simple habits, such as {gコ|turning down} the volume, driving more gently through residential streets or taking a phone call outside, cost almost nothing. They also remind us that the soundscape of a city is something its residents create together, not something that simply happens to them.",
 "None of this requires a return to some imagined past in which every street was peaceful; cities have always been lively places, and much of their energy is expressed in sound. The aim is rather to recognize quiet as something valuable that deserves a place in our planning and our habits. Perhaps the first step is simply to listen: {o4} we hear in a single ordinary day, we might be surprised by how much of it we could easily do without, and by how much calmer our lives might become if we chose to.",
]

NOTES = [('clatter', 'ガタガタという音'), ('lorry', 'トラック（英）'), ('hedge', '生け垣'), ('soundscape', '音の風景（ある場所の音の環境全体）')]

GRAM = [
 ('ア', 'at least as much as', '正しい。as much as 〜「〜と同じくらい」を at least「少なくとも」が強めている。'),
 ('イ', 'more dramatically than', '正しい。動詞 changed を修飾する副詞の比較級 more dramatically + than。'),
 ('ウ', 'became', '正しい。主語 the hours of genuine quiet（複数）に対する過去形 became。become は主語の数によって形が変わらない。'),
 ('エ', 'has grown so used to this', '誤り。主語は Many residents（複数）なので has ではなく have が正しい。so 〜 that … と grow used to 〜「〜に慣れる」の形は正しい。'),
 ('オ', 'stay in', '正しい。when 節の中の現在形。stay in 〜「〜に滞在する」。'),
 ('カ', 'who have the fewest', '正しい。先行詞 those（複数）に have が一致する。choices は可算名詞なので few の最上級 fewest。'),
 ('キ', 'may find it harder concentrating', '誤り。find it + 形容詞 + to do「〜するのが…だとわかる」の形で，it は後ろの to 不定詞を指す。to concentrate が正しい。'),
 ('ク', 'worth identifying and defending', '正しい。worth + 動名詞「〜する価値がある」。二つの動名詞を and でつないでいる。'),
 ('ケ', 'that we cannot turn off', '正しい。music を先行詞とする目的格の関係代名詞 that。turn off は「〜を止める・消す」。'),
 ('コ', 'turning down', '正しい。such as の後に turning down … / driving … / taking … と動名詞が並んでいる。'),
]

QUESTIONS = [
 mc1(1, 4, '下線部(1)で筆者が述べている内容として最適なものを(A)〜(D)のうちから一つ選び，その記号を書け。',
     ['Sounds can continue to affect us physically even when we are no longer aware of them.',
      'People can train their bodies to ignore any sound if they practise for long enough.',
      'Our ears become more sensitive the longer we stay in a noisy city.',
      'People notice sounds more than sights when they visit a new city.'],
     ['○ 直前の “our failure to notice a sound any longer is no proof that it leaves us untouched” を言い換えた部分。第3段落の睡眠中の例もこの内容を裏づける。',
      '× 訓練すればどんな音も無視できるという記述はない（本文に記述なし）。',
      '× 耳が敏感になるという話ではない。慣れて気づかなくなっても影響は残る，という内容である（範囲のずれ）。',
      '× 第1段落は，人は旅先について見たものを語り，聞いたものはあまり語らないと述べている（本文と逆）。'], pos()),
 {'no': 2, 'points': 14, 'kind': 'trans', 'stem': '下線部(2)を和訳せよ。',
  'answer': '毎晩毎晩くり返されると，こうした小さな妨げは積み重なって決して小さくはないものになるかもしれない。だからこそ，騒音はますます，単なる迷惑としてではなく，公衆衛生の問題として論じられるようになっているのである。',
  'alts': ['夜ごとにくり返されるうちに，これらのささいな睡眠の乱れは合わさって，とても小さいとは言えないものになりうる。騒音が，単に迷惑なものではなく，人々の健康にかかわる公共の問題として議論されることが増えているのはそのためである。'],
  'criteria': [('Repeated night after night（分詞構文）「毎晩くり返されると」', 4),
               ('these small disturbances may add up to something far from small「小さな妨げが積み重なって決して小さくないものになりうる」', 3),
               ('which is why …「そしてそれが…の理由だ／だからこそ…」（前の内容を受ける関係代名詞 which）', 4),
               ('not simply as a nuisance but as a public health issue「単なる迷惑ではなく公衆衛生の問題として」', 3)],
  'explain': ['文頭の Repeated は受け身の分詞構文で，主語 these small disturbances が「くり返される」。条件・時の意味で「くり返されると」と訳す。',
              'add up to 〜「合計して〜になる」。far from 〜「決して〜ではない」で，something far from small は「小さいどころではないもの」。',
              '“which is why” の which は前の節全体を受ける。「〜，それが…の理由だ」「だからこそ…」と訳す。',
              'nuisance は「迷惑・厄介なもの」，public health は「公衆衛生」。not simply A but B「単にAではなくB」。']},
 mc1(3, 4, '空所[ I ]を補うのに最適な語句を(A)〜(D)のうちから一つ選び，その記号を書け。',
     ['However', 'Therefore', 'For instance', 'In addition'],
     ['○ 直前は「多くの住民は騒音にすっかり慣れている」，空所の後は「慣れることは影響を受けないことと同じではない」。前の内容に反する方向へ転じるので However が合う。',
      '× Therefore は「したがって」。慣れていることから「影響を受けないわけではない」が導かれるわけではない。',
      '× For instance は具体例の導入。後の文は前の文の具体例ではない。',
      '× In addition は同じ方向の内容を付け加えるときに使う。前後は逆の方向である（本文と逆）。'], pos(), blank='I'),
 {'no': 4, 'points': 6, 'kind': 'gram2',
  'stem': '下線部(ア)〜(オ)と(カ)〜(コ)には，文法的に正しくない箇所がそれぞれ一つずつ含まれている。該当する記号を書け。',
  'answer': ['エ', 'キ'], 'reasons': GRAM},
 {'no': 5, 'points': 14, 'kind': 'ja_free', 'stem': '下線部(3)の意味するところを，本文の内容に沿って日本語で説明せよ。',
  'answer': '人が心安らぐと感じる流れる水や鳥の声，木々を渡る風といった音は，必ずしもいちばん小さな音ではない。音の受け止め方を左右するのは音量の大きさよりも，その音から自分の意思で離れられると感じられるかどうかだということ。',
  'alts': ['心地よいと感じる音は最も静かな音とは限らず，大切なのは音がどれほど大きいかではなく，嫌になればその音から逃れられるという自由があると感じられるかどうかである。たとえば止められない隣人の音楽は，自分で見に行った滝の轟音より不快に感じられる。'],
  'criteria': [('心安らぐ音（流水・鳥の声・風など）は，最も小さい音とは限らない', 4),
               ('音量の大きさが決め手ではない（less A than B の A 側）', 4),
               ('その音から自分で逃れられると感じられるかどうかが大切（B 側＝自分で制御できるか）', 6)],
  'explain': ['less A than B は「AというよりむしろB」。“what matters is less how loud a sound is than whether we feel free to escape it” の A＝音の大きさ，B＝逃れられると感じるかどうか。',
              '直後の具体例（止められない隣人の音楽と，自分で見に来た滝）と，“Control, in other words, shapes our response to sound as much as volume does” が説明の手がかりになる。',
              '「静かな音が好まれる」とだけ書くと，下線部と逆の内容になるので不可。']},
 {'no': 6, 'points': 8, 'kind': 'order', 'under': '4',
  'stem': '下線部(4)の［　］内の語を正しく並べて意味の通る英文にするとき，2番目・5番目・7番目にくる語の記号を書け。各語は一度ずつ用いること。',
  'words': ['minute', 'to', 'what', 'we', 'paused', 'if', 'a', 'notice', 'for'],
  'correct': ['F', 'D', 'E', 'I', 'G', 'A', 'B', 'H', 'C'], 'ask': [2, 5, 7],
  'sentence_part': 'if we paused for a minute to notice what',
  'sentence': 'Perhaps the first step is simply to listen: if we paused for a minute to notice what we hear in a single ordinary day, we might be surprised by how much of it we could easily do without …',
  'explain': ['後半が we might be surprised と仮定法過去の帰結になっているので，前半は if we paused …「もし…すれば」。',
              'pause for a minute to do「少し立ち止まって〜する」。to notice は目的を表す不定詞で，その目的語が what we hear …「私たちが聞くもの」。',
              'what は関係代名詞で，下線部の後の we hear in a single ordinary day とつながる。',
              '2番目 we (D)・5番目 a (G)・7番目 to (B)。']},
 {'no': 7, 'points': 10, 'kind': 'tf2',
  'stem': '本文の内容と合うものを(A)〜(E)のうちから二つ選び，その記号を書け。',
  'choices': ['Before engines appeared, the sounds made by people tended to follow the pattern of the working day.',
              'The writer argues that a healthy city should be made as silent as possible.',
              'People who sleep near busy roads always wake up and remember the noise in the morning.',
              'Families with less money are more likely to live in places exposed to heavy noise.',
              'The writer thinks that noise made by individuals is too small to make any difference.'],
  'answer': [0, 3],
  'reasons': ['○ 第2段落 “these sounds rose and fell with the rhythm of the working day” と一致する。',
              '× 第6段落は “Protecting quiet does not mean creating silence.” と述べている（本文と逆）。',
              '× 第3段落は，眠っている人は完全には目覚めず，朝には何も覚えていないこともあると述べている（本文と逆）。',
              '○ 第4段落 “the people who live in them are often those who have the fewest choices about where to live” と一致する。',
              '× 第7段落は，一つ一つの音はささいでも，合わさると人を疲れさせる背景音になると述べている（本文と逆）。']},
]

TRANSLATION = [
 '訪れたことのある都市について何を覚えているかと尋ねれば，たいていの人は目にしたものを語るだろう。高い建物，混み合った市場，夕暮れの有名な橋。耳にしたものを挙げる人はずっと少ないが，音は少なくとも視覚と同じくらい，私たちがある場所をどう経験するかを形づくっている。車の往来，工事，サイレン，エアコンの室外機，店から漂ってくる音楽が合わさって絶え間ない背景となり，たいていの住民はやがてそれに気づかなくなる。しかし，ある音にもう気づかないということは，それが私たちに何の影響も及ぼさないということではない。どうやら体は，心が注意を払わなくなったずっと後まで，聞き続けているようなのである。',
 '歴史の大半を通じて，人々が耳にする最も大きな音は自然の音だった。雷，滝，海の嵐のとどろき。人間の活動は鐘やハンマー，石畳を行く荷車のガタガタという音を付け加えたが，そうした音は一日の仕事のリズムに合わせて高まっては静まり，夜はおおむね静かだった。エンジンの登場は，それ以前のどんな発明よりも劇的にこの状況を変えた。鉄道，工場，そして後には自動車が，より大きいだけでなく途切れることのない騒音を生み出し，都市が大きくなるにつれて，本当に静かな時間はますます少なくなった。今日，多くの大都市では，車の往来のうなりが完全に消える時間帯は夜のどこにもない。多くの住民はこれにすっかり慣れてしまったので，数日田舎に滞在すると，まったくの静けさを奇妙に，さらには居心地悪く感じるほどである。',
 'しかし，騒音に慣れることは，それに影響されないことと同じではない。私たちの聴覚は危険を早く知らせる仕組みとして進化したものであり，目とは違って耳は閉じることができない。眠っている間でさえ，脳は周囲を見張り続け，何かおかしいと感じれば私たちを起こす準備をしている。通り過ぎるトラックや乱暴に閉められたドアは，心拍を一時的に上げ，眠っている人を深い眠りから浅い段階へ引き上げることがある。その人は完全には目覚めず，朝には何も覚えていないかもしれないが。毎晩毎晩くり返されると，こうした小さな妨げは積み重なって決して小さくはないものになるかもしれない。だからこそ，騒音はますます，単なる迷惑としてではなく，公衆衛生の問題として論じられるようになっているのである。長い間よく眠れない人は，疲れやすく，いらいらし，集中しにくくなりがちであり，その原因の一部は，本人が意識して聞いたことのない音にあるのかもしれない。',
 '騒音は，ほかの多くの環境上の負担と同じように，平等に分かち合われてはいない。交通量の多い道路や線路，空港のそばの家は安くなりがちなので，そこに住むのは，住む場所についての選択肢が最も少ない人々であることが多い。裕福な住民は静かな通りに家を買ったり，厚い二重窓を取り付けたり，週末にはもっと落ち着いた場所へと都市を離れたりできる。子どもたちも影響を受ける。幹線道路沿いの学校に通う児童は，数分ごとにトラックが窓の外をとどろきながら通り過ぎると授業に集中しにくくなるかもしれず，そうした学校の教師は，騒音がおさまるまで話すのを止めなければならないこともある。一つの家族にとっては単に煩わしいだけに思える問題も，地域全体で見れば，目立たない形の不利益になりうるのである。',
 '騒音が負担であるなら，静けさは資源であり，ほかの資源と同じく，守ることも失うこともありうる。いくつかの都市は，小さな公園や中庭，川岸といった静かな場所を，歴史的建造物や古木を守るのと同じように，見つけ出して守る価値のあるものとして扱い始めている。都市計画者は，交通量の多い車の流れを住宅から遠ざけたり，道路沿いに厚い生け垣を植えたり，寝室がにぎやかな通りではなく内側の庭に面するように建物を設計したりできる。こうした対策が大きく報じられることはめったになく，その効果を写真で示すのも難しい。しかしその効果は，とどろくような大通りから風の当たらない広場へ歩いて入り，自分の肩の力が抜けていることにほとんど驚きとともに気づく人なら，誰でも感じることができる。',
 '静けさを守ることは，無音をつくり出すことではない。まったく音のない都市に住みたいと思う人はほとんどいないだろうし，完全な無音は安らぎよりもむしろ不安を感じさせることがある。人が心安らぐと感じがちな音，たとえば流れる水や鳥のさえずり，木々を渡る風，遠くの話し声は，最も静かな音であることはめったにない。大切なのは，音がどれほど大きいかというよりも，その音から自由に逃れられると感じられるかどうかなのである。止めることのできない隣人の音楽は，自分で見に行くことを選んだ滝のより大きなとどろきよりも，はるかに私たちを悩ませるかもしれない。言い換えれば，自分で制御できるかどうかは，音量と同じくらい音への反応を左右するのであり，よい都市は，住民が周りの音を自分で選べる場所を用意しているのである。',
 '個人も役割を果たすことができる。現代生活の騒音の多くは，工場や航空機ではなく，日々を過ごす普通の人々によって生み出されている。いらだちから鳴らされる車のクラクション，静かな車両で鳴る電話，開け放した窓から大音量で流れる音楽。こうした音の一つ一つはそれだけではささいに思えるかもしれないが，合わさると人々をすり減らす背景音の大部分を形づくる。音量を下げる，住宅街ではより穏やかに運転する，電話には外に出て応じるといった簡単な習慣は，ほとんどお金がかからない。そうした習慣はまた，都市の音の風景が，単に住民の身に降りかかるものではなく，住民が一緒につくり出すものであることを思い出させてくれる。',
 'こうしたことはどれも，すべての通りが穏やかだったという想像上の過去に戻ることを求めるものではない。都市は昔からにぎやかな場所であり，その活力の多くは音として表れている。目指すのはむしろ，静けさを，計画にも習慣にも居場所を与えられるべき価値あるものとして認めることである。おそらく最初の一歩は，ただ耳を傾けることだろう。もし少し時間をとって，ごく普通の一日に自分が聞いているものに気づいてみれば，そのうちのどれほど多くがなくても簡単にすませられるか，そして，そうすることを選べば生活がどれほど穏やかになりうるかに，私たちは驚くかもしれない。',
]

VOCAB = [
 ('drift', '漂う'), ('continuous', '途切れることのない'), ('genuine', '本当の'), ('evolve', '進化する'),
 ('monitor', '〜を監視する・見張る'), ('disturbance', '妨げ・乱れ'), ('nuisance', '迷惑・厄介なもの'), ('irritable', 'いらいらしやすい'),
 ('burden', '負担'), ('disadvantage', '不利益'), ('route', '〜を（ある経路に）通す'), ('sheltered', '風雨から守られた'),
 ('unsettling', '不安にさせる'), ('trivial', 'ささいな'), ('do without 〜', '〜なしですませる'),
]

P = {'passage': PASSAGE, 'notes': NOTES, 'questions': QUESTIONS, 'translation': TRANSLATION, 'vocab': VOCAB}
