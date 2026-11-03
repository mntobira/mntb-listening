# -*- coding: utf-8 -*-
# 第1回 大問2 長文読解（体験エッセイ・書き下ろし）。人物・町はすべて架空。
from mk import pos_for, mc1
pos = pos_for(1)

PASSAGE = [
 "The winter I turned twenty-four, I moved to Brannock Bay, a fishing town of about two thousand people on a rocky northern coast, to work as an assistant at the town’s only veterinary clinic. I had grown up in a large city where I rarely spoke to my neighbors, and I assumed that life in a small town would be much the same, only quieter. For the first few weeks, it was. I went to work in the dark, came home in the dark, and spent my evenings reading or watching films on my laptop. I nodded to the people I passed on the street, but none of them were really acquaintances of mine, nor did I feel the lack.",
 "That changed in early February, when a storm arrived from the sea and stayed for three days. On the first night, the wind brought down the power lines along the coast road, and the whole town lost electricity. My apartment was heated by an electric radiator, and by morning I could see my breath in the air. My phone battery was almost empty, the shops were closed, and the road out of town was blocked by fallen trees. {u1|I remember standing at my window, wrapped in every sweater I owned, and realizing, as never before, how completely my comfortable life depended on systems I had never once thought about.}",
 "Around noon there was a knock at the door. It was Edda Lindqvist, the elderly woman who lived in the apartment below mine and whom I had greeted perhaps twice. She told me that several neighbors were gathering at the community hall, which had an old wood-burning stove, and that I should bring any food I had. When I arrived, I found about forty people there. Someone had brought a gas burner and was making soup in an enormous pot; a group of teenagers was collecting firewood; two fishermen were checking on people who lived alone. Nobody seemed to be in charge, and yet everyone seemed to know ( ア ).",
 "Over the next two days, I learned more about my neighbors than I had in the previous two months. The man who ran the hardware store turned out to have been a nurse for twenty years. A shy girl from the high school organized a rota so that the oldest residents were never left without someone to talk to. Edda herself, who I had imagined spent her days alone in front of the television, had lived through a far worse storm as a child and calmly told stories about it to the younger children until they fell asleep. {u2|What struck me most was that none of this felt like charity.} People were not helping out of pity or a sense of duty, but because, in a town this size, the well-being of one household was obviously tied to the well-being of all the others.",
 "I was able to contribute something, too. On the second morning, a farmer arrived with a sheepdog that had cut its leg badly on a broken fence. With the clinic closed and the vet stuck on the other side of the blocked road, I cleaned and bandaged the wound by the light of a camping lantern while several children watched in silence. It was a small thing, and I was nervous throughout, but afterwards people I had never spoken to greeted me by name. It was the first moment since my arrival when I felt that I was not simply living in Brannock Bay but belonged to it.",
 "When the power came back on the third evening, there was a cheer in the hall, followed by a strange moment of hesitation, as if nobody quite wanted to go home. Life soon returned to normal, but it was not quite the same normal. People who had shared soup by candlelight continued to stop and talk in the street. Edda began inviting me for tea on Sundays, and I began shoveling the snow from her steps without being asked. I began to realize that {u3|this town had ways of looking after its members that no official system could fully replace}: the habit of checking on someone whose curtains stayed closed too long, the unspoken rule that whoever had a working car gave lifts to anyone without one, the pot of soup that appeared whenever someone was ill.",
 "I have since moved back to the city, and I still live in a building where most people keep to themselves. I do not believe that small towns are always better places to live; they can be lonely in their own way, and privacy is harder to find. {u4|But that storm taught me that independence is partly an illusion, one that is easy to maintain only as long as the lights stay on.} These days I make a point of learning my neighbors’ names. It is a modest habit, but I now believe the strength of a community is built in ordinary moments like these, long before anyone needs it.",
]

QUESTIONS = [
 {'no': 1, 'points': 8, 'kind': 'trans', 'stem': '下線部(1)を和訳せよ。',
  'answer': '持っているセーターを全部着込んで窓辺に立ち，自分の快適な生活が，一度も考えたことのなかった仕組みにどれほど完全に頼っていたかに初めて気づいたことを覚えている。',
  'alts': ['手持ちのセーターをすべて重ね着して窓のそばに立ち，それまで一度も意識したことのない仕組みに自分の快適な暮らしがいかに全面的に依存していたかを初めて悟ったのを覚えている。'],
  'criteria': [('remember doing「〜したことを覚えている」（standing と realizing の2つ）・as never before「それまでになく（初めて）」', 2), ('wrapped in every sweater I owned「持っているセーターを全部着込んで」', 2),
               ('how completely … depended on ～「どれほど完全に〜に頼っていたか」', 2), ('systems I had never once thought about「一度も考えたことのなかった仕組み」', 2)],
  'explain': ['remember の後の standing と realizing はともに動名詞で，「（過去に）〜したことを覚えている」。and で並んでいる。',
              'wrapped in every sweater I owned は付帯状況を表す分詞句。every sweater I owned は「自分が持っているすべてのセーター」。',
              'how completely は感嘆的な間接疑問「どれほど完全に」。depend on は「〜に頼る・依存する」。',
              'systems の後に関係代名詞 that（which）が省略されている。never once は never の強調。']},
 mc1(2, 5, '( ア )を補うのにふさわしいものを，(A)〜(D)のうちから一つ選べ。',
     ['what needed to be done', 'when the power would return', 'who had caused the damage', 'how to leave the town'],
     ['○ 直前に，スープを作る人・薪を集める若者・一人暮らしの人を見回る漁師が描かれている。指示役がいないのに各自が「すべきこと」をわかっていた，という対比（and yet）になる。',
      '× 停電がいつ直るかは誰にもわからない状況で，最終日の夕方に戻ったとき歓声が上がっている。and yet の対比にもならない。',
      '× 被害の原因は嵐であり，「誰が」被害を起こしたかは話題にない（本文に記述なし）。',
      '× 道路は倒木でふさがれており，人々は町を出ようとしていたのではなく集会所で助け合っていた（本文と逆）。'], pos()),
 {'no': 3, 'points': 7, 'kind': 'ja_limit', 'limit': 50,
  'stem': '筆者が下線部(2)のように感じた理由を，本文に即して説明せよ。句読点も1字に数え，50字以内とする。',
  'answer': '同情や義務感からではなく，小さな町では一家の幸せが皆の幸せと結びつくので助け合っていたから。',
  'alts': ['小さな町では一家庭の幸福が全体の幸福とつながり，人々は哀れみや義務でなく助け合っていたから。'],
  'criteria': [('同情・哀れみや義務感から助けていたのではない', 3), ('小さな町では一つの家の幸せが他の家すべての幸せと結びついている', 3), ('理由の形（〜から・〜ため）で結ぶ', 1)],
  'explain': ['直後の文 “People were not helping out of pity or a sense of duty, but because …” が理由そのもの。not A but B の両方を入れる。',
              'charity は「慈善・施し」。施しには「助ける側／助けられる側」の上下があるが，ここではお互いさまの関係だったことを述べている。',
              '“the well-being of one household was obviously tied to the well-being of all the others” の tied to は「〜と結びついた」。']},
 {'no': 4, 'points': 4, 'kind': 'extract', 'n': 2,
  'stem': '下線部(3)の具体例にあたる語句を，本文から二つ抜き出して英語で記せ。',
  'answer': ['the habit of checking on someone whose curtains stayed closed too long', 'the unspoken rule that whoever had a working car gave lifts to anyone without one', 'the pot of soup that appeared whenever someone was ill'],
  'criteria': [('具体例（3つのうち）1つ目', 2), ('具体例（3つのうち）2つ目', 2)],
  'explain': ['下線部の直後のコロン（:）以下に，具体例が3つ並んでいる。そのうち2つを書けばよい（解答欄の正解は3つのうちいずれか2つ）。',
              '名詞句をそのまま書き抜く。“the habit of checking …” のように冠詞から句の終わりまでを写す。途中で切ると減点。',
              'official system「公的な仕組み」と対比されているのは，住民どうしの暗黙の習慣であることを押さえる。']},
 {'no': 5, 'points': 9, 'kind': 'trans', 'stem': 'one の指す内容を明らかにしながら，下線部(4)を和訳せよ。',
  'answer': 'しかし，あの嵐が私に教えてくれたのは，自立というものは部分的には幻想であり，その幻想は明かりがついている間しか保ちやすくないものだということだった。',
  'alts': ['だがあの嵐によって私は，自立はある程度思い込みにすぎず，その思い込みは電気がついている限りにおいてのみ容易に維持できるものだと学んだ。'],
  'criteria': [('taught me that …「〜ということを私に教えた」', 2), ('independence is partly an illusion「自立は部分的には幻想だ」', 2),
               ('one＝an illusion（幻想）を明示する', 3), ('only as long as the lights stay on「明かりがついている間だけ」', 2)],
  'explain': ['one は前に出た可算名詞の代わりで，ここでは an illusion を指す。「その幻想は」と訳出する。',
              'easy to maintain は「維持しやすい」。only as long as … は「〜する限りにおいてのみ」。',
              'the lights stay on は停電の体験を踏まえた表現。電気（社会の仕組み）が動いている間だけ，人は「一人で生きている」と思い込める，という趣旨。']},
 {'no': 6, 'points': 9, 'kind': 'tf2', 'stem': '本文の趣旨に合致する英文を，(A)〜(F)のうちから二つ選べ。',
  'choices': ['The author moved to Brannock Bay mainly to escape the noise of city life.',
              'Before the storm, the author had little real contact with the people nearby.',
              'Edda Lindqvist organized a rota so that the oldest residents always had company.',
              'The author treated an injured dog even though the clinic was closed.',
              'Soon after the power returned, the townspeople forgot what they had shared.',
              'The author now believes that small towns are always better places to live than cities.'],
  'answer': [1, 3],
  'reasons': ['× 第1段落によれば，町に来たのは動物病院で働くため。騒音から逃れるためとは書かれていない（本文に記述なし）。',
              '○ 第1段落 “none of them were really acquaintances of mine” と一致。',
              '× 第4段落で当番表を作ったのは “A shy girl from the high school”。Edda は子どもたちに話をしていた。',
              '○ 第5段落 “With the clinic closed … I cleaned and bandaged the wound” と一致。',
              '× 第6段落では，その後も通りで立ち止まって話すようになったとある（本文と逆）。',
              '× 最終段落 “I do not believe that small towns are always better places to live” と逆（本文と逆）。']},
]

TRANSLATION = [
 '24歳になった冬，私はブラノック湾という，岩の多い北の海岸にある人口2千人ほどの漁師町に移り住み，町で唯一の動物病院で助手として働くことになった。私は大都市で育ち，近所の人と話すことはめったになかったので，小さな町での暮らしも，静かなだけでほとんど変わらないだろうと思い込んでいた。最初の数週間は実際そのとおりだった。暗いうちに仕事へ行き，暗くなってから帰宅し，夜は本を読むかノートパソコンで映画を見て過ごした。通りですれ違う人には会釈をしたが，誰のこともよく知らず，知る必要があるとも思っていなかった。',
 'それが変わったのは2月の初め，海から嵐がやって来て3日間居座ったときだった。最初の夜，強風で海岸道路沿いの電線が倒れ，町全体が停電した。私の部屋は電気ヒーターで暖めていたので，朝には吐く息が白く見えた。携帯電話の電池はほとんど空で，店は閉まり，町から出る道は倒木でふさがれていた。(1)持っているセーターを全部着込んで窓辺に立ち，自分の快適な生活が，一度も考えたことのなかった仕組みにどれほど完全に頼っていたかに初めて気づいたことを覚えている。',
 '正午ごろ，ドアをノックする音がした。エッダ・リンドクヴィストという，私の部屋の下に住む年配の女性で，それまでおそらく2回あいさつした程度の相手だった。彼女は，古い薪ストーブのある公民館に近所の人が何人も集まっているから，食べ物があれば持ってくるようにと言った。行ってみると，40人ほどが集まっていた。誰かがガスバーナーを持ってきて巨大な鍋でスープを作っており，十代の若者のグループは薪を集め，漁師2人は一人暮らしの人の様子を見て回っていた。誰かが仕切っているようには見えなかったが，それでも全員が何をすべきかわかっているようだった。',
 'その後の2日間で，私はそれまでの2か月間よりも多くのことを近所の人々について知った。金物屋を営む男性は，実は20年間看護師をしていた人だった。高校の内気な女の子が当番表を作り，最年長の住民たちが話し相手のいない状態に決してならないようにした。エッダ自身も，私はテレビの前で一人きりで毎日を過ごしているのだろうと想像していたのだが，子どものころにずっとひどい嵐を経験しており，年下の子どもたちが眠るまで，その話を落ち着いて聞かせていた。(2)何より印象的だったのは，こうしたことのどれ一つとして施しのようには感じられなかったことだ。人々は哀れみや義務感から助けていたのではなく，この規模の町では，一つの家の幸せがほかのすべての家の幸せと結びついていることが明らかだったから助けていたのである。',
 '私も少しは役に立つことができた。2日目の朝，ある農家の人が，壊れた柵で脚をひどく切った牧羊犬を連れてやって来た。病院は閉まっており，獣医はふさがれた道路の向こう側で足止めされていたので，私はキャンプ用ランタンの明かりを頼りに傷口を洗って包帯を巻いた。その間，何人かの子どもが黙って見ていた。ささいなことで，私はずっと緊張していたが，その後，一度も話したことのない人たちが私の名前を呼んであいさつしてくれるようになった。この町に来て初めて，自分はブラノック湾に単に住んでいるのではなく，この町の一員なのだと感じた。',
 '3日目の夕方に電気が戻ると，公民館では歓声が上がったが，続いて，誰もあまり家に帰りたくないかのような，妙なためらいの間があった。生活はすぐに元に戻ったが，まったく同じ元どおりではなかった。ろうそくの明かりのもとでスープを分け合った人々は，その後も通りで立ち止まって話をするようになった。エッダは日曜日に私をお茶に招いてくれるようになり，私は頼まれなくても彼女の家の階段の雪かきをするようになった。私は，(3)この町には，どんな公的な仕組みも完全には取って代わることのできない，住民の面倒を見るやり方があるのだとわかるようになった。カーテンが長く閉まったままの人の様子を確かめる習慣，動く車を持っている人は持っていない人を乗せてあげるという暗黙の決まり，誰かが病気になるといつの間にか届くスープの鍋，といったものである。',
 '私はその後都会に戻り，今もほとんどの人が他人とかかわらずに暮らす建物に住んでいる。小さな町のほうがいつも住みやすいとは思わない。小さな町にはそれなりの寂しさがあるし，プライバシーも得にくい。(4)しかし，あの嵐が私に教えてくれたのは，自立というものは部分的には幻想であり，その幻想は明かりがついている間しか保ちやすくないものだということだった。最近，私は近所の人の名前を覚えるよう心がけている。ささやかな習慣だが，共同体の強さは，誰かがそれを必要とするずっと前に，こうした何気ない瞬間の中で築かれるのだと考えるようになった。',
]

VOCAB = [('veterinary clinic', '動物病院'), ('radiator', '暖房器・ヒーター'), ('wrapped in ～', '〜にくるまって'), ('depend on ～', '〜に頼る'),
         ('in charge', '責任者で・仕切って'), ('turn out to have been ～', '実は〜だったとわかる'), ('rota', '当番表'), ('charity', '施し・慈善'),
         ('out of pity', '哀れみから'), ('well-being', '幸福・健康'), ('bandage', '包帯を巻く'), ('belong to ～', '〜の一員である'),
         ('hesitation', 'ためらい'), ('unspoken rule', '暗黙の決まり'), ('give a lift', '車に乗せてあげる'), ('keep to oneself', '人とかかわらずに暮らす'),
         ('illusion', '幻想・思い込み'), ('make a point of doing', '努めて〜するようにする')]

PART = {'passage': PASSAGE, 'questions': QUESTIONS, 'translation': TRANSLATION, 'vocab': VOCAB, 'notes': []}
