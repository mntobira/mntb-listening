# -*- coding: utf-8 -*-
# 第1回 Ⅰ 長文読解（論説・書き下ろし「修理するということ」）
from mk import pos_for, mc1
pos = pos_for(1)

PASSAGE = [
 "For most of human history, an object that stopped working was not the end of a story but the beginning of a new chapter. A torn coat was patched, a cracked bowl was glued, and a chair with a loose leg was carried to someone in the village who {gア|knew how to make it} stand firmly again. Repair was so ordinary that hardly anyone thought of it as a skill worth discussing; it was simply part of owning things. Families kept boxes of buttons, nails and spare pieces of cloth, not because they were poor, but because it seemed foolish to throw away anything that might one day be useful. Today, in many wealthy societies, the situation looks very different. When the screen of a phone breaks or a kettle stops heating, the first question people ask is often not “Who can fix this?” but “How much does a new one cost?”",
 "This change did not happen by accident. Over the past century, manufacturing has become so efficient that many goods {gイ|is now cheaper to replace} than to mend. Products, meanwhile, have grown far more complex. A radio built seventy years ago could be opened with an ordinary screwdriver, and its parts {gウ|were large enough to be seen} and handled by anyone curious enough to look inside. Many modern devices, by contrast, are sealed with glue, held together by unusual screws, or built around tiny *components that cannot be replaced one by one. Even when repair is technically possible, the information needed to carry it out is often {gエ|kept from} the very people who own the device. The result is a world in which {u1|the ability to fix things has quietly moved out of ordinary hands}.",
 "[[I]], something important is lost when repair disappears from everyday life. The most obvious loss is economic and environmental. Every object that is thrown away rather than mended must be replaced by a new one, and making that new object requires raw materials, energy and transport, much of which leaves no trace on the price tag. {u2|A society that repairs little is therefore one that must keep producing a great deal, not because people need more things, but because the things they already have are treated as disposable the moment they fail.} Seen in this light, the cheapness of replacement is partly an illusion: the cost has not disappeared but has simply been moved somewhere we cannot easily see it. Someone, somewhere, still pays it, whether as polluted rivers, overflowing landfills or the exhaustion of resources that future generations will need.",
 "Yet resources are not all that is lost. Repairing something demands a particular kind of attention. To fix a bicycle chain or a dripping tap, a person has to look closely, form a guess about what has gone wrong, test that guess, and try again {gオ|when the first attempt fails}. Very often the first guess is wrong, and the second is only partly right. Yet each failure narrows the possibilities, and the person gradually builds a clearer picture of the object than any instruction book could have provided. This slow cycle of observation and correction teaches patience, and it builds a practical sense of how the material world actually behaves. People who repair things often say that they truly understand an object only after they have taken it apart and put it back together. {u3|In this sense, a broken object is not merely a problem to be solved; it is also an invitation to learn.}",
 "There is a social side to repair as well. In the past, fixing things frequently brought people together. Neighbours lent one another tools, older relatives showed younger ones how to sew on a button or sharpen a knife, and small repair shops were places {gカ|where news and advice were exchanged} as freely as spare parts. When repair moves into distant service centres, or vanishes altogether, these modest connections {gキ|grow weaker}. A teenager who has never watched anyone mend a shirt is unlikely to think of mending one, and a town without a single repair shop offers few places where such skills can even be seen. [[II]], knowledge that was once handed down from person to person is in danger of being forgotten, because skills that are not practised are rarely remembered for long.",
 "In recent years, however, signs of change have appeared. In a number of towns, volunteers {gク|have begun organizing} regular gatherings at which residents can bring broken lamps, toasters, clothes and toys and work on them side by side with people who have the necessary skills. Participants often say that the most valuable thing they take home is not the repaired object but the confidence to attempt the next repair on their own. Some governments have begun to debate rules that would require manufacturers {gケ|making spare parts and repair manuals} available for several years after a product is sold. {u4|What is striking about these efforts is how sharply the attitudes they encourage differ from the ones the market has long rewarded.} Where the market has praised speed, novelty and convenience, those who promote repair value care, *durability and the gradual *accumulation of skill.",
 "None of this means that we should return to a world in which every household mends its own shoes. Specialization has genuine benefits, and not every object deserves the hours it would take to restore. But it does suggest that the question “Can this be fixed?” deserves a place in our thinking once more. If {o5} before buying something new, we may begin to see the objects around us less as temporary purchases and more as things {gコ|worth looking after}. That shift in perspective, small as it may seem, could change how much we buy, how much we throw away, and how connected we feel to the people who help keep our belongings working.",
]

NOTES = [('components', '部品'), ('durability', '耐久性'), ('accumulation', '蓄積')]

GRAM = [
 ('ア', 'knew how to make it', '正しい。make + O + 原形不定詞（stand）で「Oを〜させる」。'),
 ('イ', 'is now cheaper to replace', '誤り。主語は many goods（複数）なので is ではなく are が正しい。than to mend と比べる形 cheaper to replace は正しい。'),
 ('ウ', 'were large enough to be seen', '正しい。主語 its parts（複数）に were が一致し，形容詞 + enough to 〜 の語順も正しい。'),
 ('エ', 'kept from', '正しい。keep A from B「AをBに知らせないでおく」の受動態 A is kept from B。'),
 ('オ', 'when the first attempt fails', '正しい。時を表す副詞節の中なので現在形 fails でよい。'),
 ('カ', 'where news and advice were exchanged', '正しい。places を先行詞とする関係副詞 where。news and advice は「交わされる」側なので受動態。'),
 ('キ', 'grow weaker', '正しい。主語 these modest connections（複数）に grow が一致。grow + 比較級で「より〜になる」。'),
 ('ク', 'have begun organizing', '正しい。begin は動名詞・不定詞のどちらも目的語にとれる。'),
 ('ケ', 'making spare parts and repair manuals', '誤り。require + O + to 不定詞「Oに〜するよう求める」の形なので to make が正しい。'),
 ('コ', 'worth looking after', '正しい。worth + 動名詞「〜する価値がある」。look after「〜を大切に扱う」。'),
]

QUESTIONS = [
 {'no': 1, 'points': 6, 'kind': 'gram2',
  'stem': '下線部(ア)〜(オ)と(カ)〜(コ)には，文法的に正しくない箇所がそれぞれ一つずつ含まれている。該当する記号を書け。',
  'answer': ['イ', 'ケ'], 'reasons': GRAM},
 mc1(2, 4, '下線部(1)で筆者が述べている内容として最適なものを(A)〜(D)のうちから一つ選び，その記号を書け。',
     ['Fixing things has gradually become something that ordinary owners are less and less able to do themselves.',
      'People have quietly stopped caring whether the things they own work properly.',
      'Most owners now prefer to repair their devices in secret rather than ask for help.',
      'Repair shops have moved away from cities, so people must travel far to have things fixed.'],
     ['○ 第2段落は，製品が複雑になり，修理の情報も持ち主に渡らないことを述べ，その結果として「修理の力が普通の人の手から離れた」とまとめている。',
      '× 持ち主が物の不具合を気にしなくなったという記述はない（本文に記述なし）。',
      '× 「こっそり修理する」という話ではない。quietly は「いつの間にか」の意味で，変化が目立たずに進んだことを表す（本文と逆）。',
      '× 修理店の移転は第5段落で触れる程度で，下線部(1)の内容ではない（範囲のずれ）。'], pos()),
 mc1(3, 4, '空所[ I ]を補うのに最適な語句を(A)〜(D)のうちから一つ選び，その記号を書け。',
     ['Even so', 'In short', 'For example', 'Likewise'],
     ['○ 第2段落は「修理より買い替えが安い」という買い替えの合理性を述べる。第3段落はそれに反して「それでも失われるものがある」と続くので，譲歩を受ける Even so が合う。',
      '× In short は直前の内容の要約。第3段落は要約ではなく反論である。',
      '× For example は具体例の導入。第3段落の冒頭は具体例ではない。',
      '× Likewise は「同様に」。前段落と同じ方向の内容が続くわけではない。'], pos(), blank='I'),
 {'no': 4, 'points': 12, 'kind': 'trans', 'stem': '下線部(2)を和訳せよ。',
  'answer': 'したがって，修理をほとんどしない社会とは，大量に生産し続けなければならない社会である。それは人々がより多くの物を必要としているからではなく，すでに持っている物が，壊れた瞬間に使い捨てのものとして扱われるからである。',
  'alts': ['それゆえ，ほとんど修理をしない社会は，多くの物を作り続けざるをえない社会だということになる。人々がもっと物を必要としているからではなく，手元にある物が故障したとたんに捨ててよいものとみなされるからだ。'],
  'criteria': [('A society that repairs little is one that … の骨格（「修理をほとんどしない社会は…社会である」）', 3),
               ('must keep producing a great deal「大量に生産し続けなければならない」', 3),
               ('not because …, but because … の対比を正しく訳す', 3),
               ('are treated as disposable the moment they fail「壊れた瞬間に使い捨て扱いされる」（the moment = 〜するとすぐに）', 3)],
  'explain': ['therefore は前文（捨てた物は新しい物で置き換えなければならない）を受けて「したがって」。',
              'repairs little の little は「ほとんど〜しない」という否定的な意味。「少し修理する」は誤り。',
              'the moment S V は接続詞的に「SがVするとすぐに」。“the moment they fail” を「その瞬間」と名詞で訳すと減点。',
              'disposable は「使い捨ての」。treated as A「Aとして扱われる」。']},
 {'no': 5, 'points': 10, 'kind': 'ja_free', 'stem': '下線部(3)の意味するところを，本文の内容に沿って日本語で説明せよ。',
  'answer': '壊れた物は単に解決すべき問題であるだけでなく，原因を推測し，試し，失敗しては直すという修理の過程を通じて，忍耐力や物の仕組みについての実際的な理解を身につける機会にもなるということ。',
  'alts': ['物が壊れることは困りごとであるだけでなく，じっくり観察して原因を考え，試行錯誤しながら直すことで，辛抱強さと物がどう働くかという実感をともなった知識を得るきっかけにもなるということ。'],
  'criteria': [('壊れた物は「解決すべき問題」であるだけではない，という対比', 2),
               ('修理の過程（観察・推測・試す・やり直す）の説明', 4),
               ('その過程で忍耐や物の仕組みの実際的な理解が得られる（＝学ぶ機会）', 4)],
  'explain': ['“an invitation to learn” は比喩。「招待状」と直訳せず，「学ぶきっかけ・機会」と内容を説明する。',
              '根拠は同じ段落の “look closely, form a guess … test that guess, and try again” と “teaches patience … a practical sense of how the material world actually behaves”。',
              '「物を分解すると理解できる」だけを書くと，忍耐の要素が抜けて減点。']},
 mc1(6, 4, '空所[ II ]を補うのに最適な語句を(A)〜(D)のうちから一つ選び，その記号を書け。',
     ['As a result', 'In contrast', 'Despite this', 'Instead'],
     ['○ 直前は「修理を通じた人のつながりが弱まる」，直後は「人から人へ伝わってきた知識が忘れられるおそれがある」。原因→結果の関係なので As a result が合う。',
      '× In contrast は対照を示す。前後は対照ではなく因果である。',
      '× Despite this は「それにもかかわらず」。前後は逆接の関係ではない（本文と逆）。',
      '× Instead は「その代わりに」。前の内容に代わる別の事柄が述べられているわけではない。'], pos(), blank='II'),
 {'no': 7, 'points': 12, 'kind': 'ja_free',
  'stem': '下線部(4)で筆者が大きく異なると考えている二つのものは何か。本文に沿って日本語で具体的に述べよ。',
  'answer': '修理を広めようとする取り組みが促す，手間をかけて物を大切に扱い，長持ちさせ，技能を少しずつ積み重ねることを重んじる態度と，市場が長く評価してきた，速さや目新しさ，便利さを重んじる態度。',
  'alts': ['地域の修理の集まりや部品・説明書の提供を求めるルールづくりが育てる「丁寧さ・耐久性・技能の着実な蓄積」を大事にする姿勢と，これまで市場が報いてきた「速さ・新しさ・手軽さ」を大事にする姿勢。'],
  'criteria': [('比べられているのは二つの「態度・価値観」であることを示す', 2),
               ('修理を広める取り組み側：手間・丁寧さ（care）', 2),
               ('同：長持ち（durability）と技能の着実な蓄積', 3),
               ('市場側：速さ（speed）・目新しさ（novelty）・便利さ（convenience）', 3),
               ('「市場が長く評価してきた」側であることの明示', 2)],
  'explain': ['下線部の次の文 “Where the market has praised speed, novelty and convenience, those who promote repair value care, durability and the gradual accumulation of skill.” が対比の中身。',
              'these efforts は，地域の修理の集まりと，部品・修理説明書の提供を求めるルールづくりの議論を指す。',
              '片方の価値観しか書いていない答案は大きく減点。']},
 {'no': 8, 'points': 8, 'kind': 'order', 'under': '5',
  'stem': '下線部(5)の［　］内の語を正しく並べて意味の通る英文にするとき，2番目・5番目・7番目にくる語の記号を書け。各語は一度ずつ用いること。',
  'words': ['asking', 'habit', 'that', 'ourselves', 'we', 'of', 'make', 'question', 'a'],
  'correct': ['E', 'G', 'I', 'B', 'F', 'A', 'D', 'C', 'H'], 'ask': [2, 5, 7],
  'sentence_part': 'we make a habit of asking ourselves that question',
  'sentence': 'If we make a habit of asking ourselves that question before buying something new, we may begin to see the objects around us …',
  'explain': ['make a habit of 〜ing「〜することを習慣にする」が骨格。If の後に主語 we と動詞 make を置く。',
              'ask oneself a question「自問する」。ourselves は asking の直後に置く。',
              'that question は直前の文の “Can this be fixed?” を指すので，that と question をつなげる。a は habit の前。',
              '2番目 make (G)・5番目 of (F)・7番目 ourselves (D)。']},
]

TRANSLATION = [
 '人類の歴史の大半において，動かなくなった物は物語の終わりではなく，新しい章の始まりだった。破れた上着には継ぎが当てられ，ひびの入った鉢は接着され，脚のぐらつく椅子は，再びしっかり立たせる方法を知っている村の誰かのもとへ運ばれた。修理はあまりにありふれていたので，話題にするほどの技能だと考える人はほとんどいなかった。それは単に物を所有することの一部だったのである。家庭には，ボタンや釘，布の切れ端を入れた箱が置かれていた。それは貧しかったからではなく，いつか役に立つかもしれない物を捨てるのは愚かなことに思えたからである。今日，多くの豊かな社会では，状況は大きく異なって見える。携帯電話の画面が割れたり，やかんが温まらなくなったりしたとき，人々が最初に口にする問いは「誰がこれを直せるだろう」ではなく，「新しいのはいくらだろう」であることが多い。',
 'この変化は偶然に起こったのではない。この100年ほどの間に，製造はきわめて効率的になったため，多くの品物は今や直すより買い替えるほうが安い。一方で，製品ははるかに複雑になった。70年前に作られたラジオは普通のねじ回しで開けることができ，その部品は，中をのぞいてみようとする好奇心のある人なら誰でも見て手に取れるほど大きかった。対照的に，現代の機器の多くは接着剤で封じられていたり，特殊なねじで留められていたり，一つずつは交換できない小さな部品を中心に作られていたりする。技術的には修理が可能な場合でさえ，それを行うのに必要な情報は，その機器を所有している当の人々に知らされないことが多い。その結果，物を直す力が，いつの間にか普通の人々の手を離れてしまった世界ができあがったのである。',
 'それでも，修理が日常生活から消えると，大切なものが失われる。最も明らかな損失は経済と環境にかかわるものである。直されずに捨てられる物はすべて新しい物で置き換えられなければならず，その新しい物を作るには原材料やエネルギー，輸送が必要で，その多くは値札には何の痕跡も残さない。したがって，修理をほとんどしない社会とは，大量に生産し続けなければならない社会である。それは人々がより多くの物を必要としているからではなく，すでに持っている物が，壊れた瞬間に使い捨てのものとして扱われるからである。このように見ると，買い替えの安さはある程度は錯覚である。費用は消えたのではなく，私たちに容易には見えない場所へ移されただけなのだ。汚れた川，あふれる埋め立て地，将来の世代が必要とする資源の枯渇といった形で，どこかの誰かが今もそれを支払っているのである。',
 'しかし，失われるのは資源だけではない。何かを修理するには，ある特別な種類の注意力が必要である。自転車のチェーンや水の漏れる蛇口を直すには，よく観察し，どこがおかしいのかについて推測を立て，その推測を試し，最初の試みがうまくいかなければもう一度やってみなければならない。最初の推測は間違っていることが非常に多く，二度目の推測も一部しか正しくない。しかし失敗するたびに可能性は絞られ，その人は，どんな説明書が与えてくれるよりもはっきりとした物の姿を少しずつ思い描けるようになる。観察と修正をくり返すこのゆっくりとした過程は忍耐を教え，物の世界が実際にどのように振る舞うのかについての実際的な感覚を育てる。物を修理する人はよく，物をばらして組み立て直してはじめて，それを本当に理解できると言う。この意味で，壊れた物は単に解決すべき問題であるだけでなく，学びへの誘いでもあるのだ。',
 '修理には社会的な側面もある。かつて，物を直すことはしばしば人々を結びつけた。隣人たちは互いに道具を貸し合い，年長の親族は若い者にボタンの付け方や刃物の研ぎ方を教え，小さな修理店は，交換部品と同じくらい気軽に知らせや助言が交わされる場所だった。修理が遠くのサービスセンターに移ったり，すっかり消えてしまったりすると，こうしたささやかなつながりは弱まっていく。誰かがシャツを繕うのを一度も見たことのない十代の若者が，自分で繕おうと思いつくことはまずないし，修理店が一軒もない町には，そうした技能を目にする場所さえほとんどない。その結果，かつては人から人へと受け継がれてきた知識が忘れられる危険にさらされる。実践されない技能は，長く記憶されることはめったにないからである。',
 'しかし近年，変化の兆しが見られる。いくつかの町では，ボランティアが定期的な集まりを開き始めた。そこでは住民が壊れた電気スタンドやトースター，衣類やおもちゃを持ち込み，必要な技能を持つ人々と並んで修理に取り組むことができる。参加者はよく，持ち帰る最も価値あるものは直った品物ではなく，次の修理に自分で挑む自信だと言う。製品の販売後数年間，交換部品と修理説明書を入手できるようにすることを製造業者に義務づける規則について，議論を始めた政府もある。こうした取り組みで目を引くのは，それらが促す態度が，市場が長く報いてきた態度とどれほど大きく異なるかという点である。市場が速さ，目新しさ，便利さを称賛してきたのに対し，修理を推し進める人々は，丁寧さ，耐久性，そして技能の少しずつの蓄積を重んじる。',
 'こうしたことは，どの家庭も自分の靴を自分で直すような世界に戻るべきだということを意味するわけではない。専門化には本物の利点があり，すべての物が修復にかかる時間に値するわけではない。しかし，「これは直せるだろうか」という問いが，再び私たちの考えの中に居場所を与えられてよいということは示している。何か新しい物を買う前にその問いを自分に投げかけることを習慣にすれば，私たちは身の回りの物を，一時的な買い物というよりも，大切に扱う価値のある物として見るようになるかもしれない。この見方の変化は，小さく思えるかもしれないが，私たちが買う量や捨てる量，そして持ち物を使える状態に保つ手助けをしてくれる人々とのつながりの感じ方を変えうるのである。',
]

VOCAB = [
 ('patch', '〜に継ぎを当てる'), ('mend', '〜を修繕する'), ('efficient', '効率的な'),
 ('sealed', '封をされた'), ('technically', '技術的には'), ('disposable', '使い捨ての'),
 ('illusion', '錯覚・幻想'), ('observation', '観察'), ('vanish', '消える'),
 ('practise', '〜を実践する・練習する（英式つづり）'), ('novelty', '目新しさ'), ('specialization', '専門化'),
 ('restore', '〜を修復する'), ('perspective', '見方・観点'), ('belongings', '持ち物'),
]

P = {'passage': PASSAGE, 'notes': NOTES, 'questions': QUESTIONS, 'translation': TRANSLATION, 'vocab': VOCAB}
