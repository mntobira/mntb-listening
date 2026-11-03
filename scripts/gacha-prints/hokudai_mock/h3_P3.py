# -*- coding: utf-8 -*-
# 第3回 大問3 英文＋英語で答える問題（書き下ろし）。____ は解答者が埋める空所。
PASSAGE = [
 "In a number of cities, local governments have started to close parts of their central districts to cars for one day each month, or sometimes every Sunday. On these car-free days, streets that are normally filled with traffic are opened to pedestrians, cyclists, and street performers. Families bring children to play in the road, cafés put tables outside, and residents who rarely visit the center come to walk around and see what has changed.",
 "Supporters say the benefits are easy to see. The air becomes noticeably cleaner, the noise of engines disappears, and people move more slowly, stopping to talk or look into shop windows. Many shop owners in pedestrian areas say that they welcome more customers on these days, since people who are walking are more likely to notice a small business than drivers passing by. For children, a street without cars offers a rare chance to run freely in the middle of the city.",
 "Others are less enthusiastic. Delivery companies complain that closing roads makes it harder to bring goods to shops and homes, and some residents who depend on their cars, such as older people or those with heavy work equipment, find it inconvenient to reach the center. Shop owners on streets that remain open to traffic sometimes worry that customers will be drawn away to the car-free area. There are also costs for the city, which must arrange barriers, signs, and staff to direct traffic.",
 "Some cities have responded by making exceptions. Buses, taxis for people with disabilities, and emergency vehicles are usually allowed to pass, and deliveries may be permitted before the shops open. A few cities have gone further, turning car-free days into permanent pedestrian streets after residents became used to them. Elsewhere, the experiment has been quietly ended after complaints.",
 "Whether such schemes succeed seems to depend less on the idea itself than on how carefully it is planned and explained. When residents are consulted beforehand and the needs of different groups are taken into account, car-free days tend to be regarded not as a restriction but as a chance to rediscover the city.",
]

QA = {'points': 8, 'lead': 'Fill in the blanks to finish the sentence below.',
      'frame': 'The second paragraph explains that supporters of car-free days point to advantages like ____, while shop owners in pedestrian areas often see ____.',
      'answers': ['cleaner air and quieter streets where people walk slowly ／ more people coming into their shops on those days',
                  'less pollution and no noise from engines ／ an increase in the number of customers'],
      'criteria': [('1つ目の空所：空気がきれいになる・騒音が消える（など）を自分の英語で書く', 4), ('2つ目の空所：客が増える（来店者が増える）', 3), ('文法・語法（such as・see の後は名詞句）', 1)],
      'explain': ['第2段落 “The air becomes noticeably cleaner, the noise of engines disappears” と “they welcome more customers on these days” が根拠。',
                  'like と see の後なので，名詞句（cleaner air / an increase in …）で書く。‘the air becomes cleaner’ のような節を置くと文法的に誤り。',
                  '本文の文をそのまま写すことは指示で禁じられている。welcome more customers → more people coming into their shops のように言い換える。']}

QB = {'points': 8, 'lead': 'Fill in the blanks to finish the sentence below.',
      'frame': 'The third paragraph indicates that opponents are concerned that delivery companies will find it difficult to ____, and that residents who rely on their cars may ____.',
      'answers': ['transport goods to shops and houses ／ have trouble getting to the middle of the city',
                  'make their deliveries to stores and homes ／ find the center hard to reach'],
      'criteria': [('1つ目の空所：店や家に品物を届ける', 4), ('2つ目の空所：中心部に行きにくくなる', 3), ('文法・語法（to・may の後は動詞の原形）', 1)],
      'explain': ['第3段落 “closing roads makes it harder to bring goods to shops and homes” と “find it inconvenient to reach the center” が根拠。',
                  'どちらの空所も動詞の原形で始める（to の後・may の後）。',
                  '‘older people or those with heavy work equipment’ を加えてもよいが，それだけでは「どう困るか」になっていないので減点。']}

QC = {'points': 26,
      'stem': 'Some people think that the center of their city should be closed to private cars permanently. Do you agree? Give your view and the reasons for it, using between 70 and 100 words.',
      'criteria': [('主張が明確（賛成・反対の立場を最初に示し，最後まで一貫）', 7), ('理由・具体例が適切で説得力がある（本文の論点を自分の言葉で使ってよい）', 9),
                   ('構成（主張→理由→まとめ，つなぎの語）', 4), ('語彙・文法の正確さ（70〜100語を守る）', 6)],
      'models': [('賛成', 'I agree that the center of my city should be closed to private cars for good. Without traffic, the streets would be safer for children and older people, and the air would be much cleaner. People walking around are also more likely to stop at small shops and cafés, which could help local businesses. Of course, buses, taxis for disabled people, and delivery vehicles should still be allowed at certain times. With these exceptions, a car-free center would make the city a more pleasant place to live.'),
                 ('反対', 'In my view, the city center should not be closed to private cars permanently. Many people, such as older residents or workers carrying heavy tools, cannot easily travel by bus or bicycle. If they cannot drive into the center, they may stop going there, and shops could lose customers. A better idea would be to hold car-free days once a month and to improve public transport. In this way, residents could enjoy quieter streets without making daily life more difficult for those who depend on cars.')],
      'tips': ['最初の1文で立場（agree / disagree）をはっきり書く。両方の立場を並べるだけで終わると主張が不明確で大きく減点。',
               '本文の論点（空気・騒音・客の増減・配達・車に頼る住民）を使ってよいが，本文の文をそのまま写さない。',
               '設問の ‘permanently’（恒久的に）という条件に触れると，月1回の歩行者天国との違いを踏まえていることが伝わる。',
               '語数は70〜100語。少なすぎても多すぎても減点。数字や調査結果を作り話で書かないこと。']}

TRANSLATION = [
 'いくつもの都市で，自治体が中心部の一部を月に1日，あるいは毎週日曜日に，車に対して閉鎖し始めている。こうした「車のない日」には，ふだんは車でいっぱいの通りが，歩行者や自転車に乗る人，大道芸人に開放される。家族は子どもを連れてきて道路で遊ばせ，カフェは外にテーブルを出し，めったに中心部を訪れない住民もやって来て，歩き回って何が変わったかを見る。',
 '支持する人々は，利点は一目瞭然だと言う。空気は目に見えてきれいになり，エンジンの騒音は消え，人々はゆっくりと歩き，立ち止まって話したり店のショーウィンドーをのぞいたりする。歩行者区域の多くの店主は，こうした日には客が増えて歓迎していると言う。歩いている人は，車で通り過ぎる人よりも小さな店に気づきやすいからである。子どもにとって，車のいない通りは，街の真ん中で自由に走り回れるまれな機会となる。',
 'あまり乗り気でない人々もいる。配送会社は，道路を閉鎖すると店や家に品物を届けにくくなると不満を言い，高齢者や重い仕事道具を持つ人など，車に頼っている住民の中には，中心部へ行くのが不便だと感じる人もいる。車の通行が続く通りの店主は，客が車のない区域に引き寄せられてしまうのではないかと心配することがある。また，市にも費用がかかる。市は柵や標識，交通を誘導する職員を手配しなければならないからである。',
 '例外を設けることで対応した都市もある。バス，障害のある人のためのタクシー，緊急車両はたいてい通行が認められ，開店前の配送が許可されることもある。さらに踏み込んで，住民が慣れた後に「車のない日」を恒久的な歩行者専用道路に変えた都市もいくつかある。一方で，苦情を受けてこの試みがひっそりと打ち切られた所もある。',
 'こうした計画が成功するかどうかは，アイデアそのものよりも，それがどれほど注意深く計画され説明されるかにかかっているようだ。住民に前もって意見が求められ，さまざまな集団の必要が考慮されれば，「車のない日」は制限ではなく，街を再発見する機会とみなされることが多くなるのである。',
]

VOCAB = [('local government', '自治体'), ('district', '地区'), ('pedestrian', '歩行者'), ('street performer', '大道芸人'),
         ('resident', '住民'), ('noticeably', '目に見えて'), ('enthusiastic', '乗り気な'), ('delivery', '配送'),
         ('depend on ～', '〜に頼る'), ('equipment', '道具・機材'), ('be drawn away', '引き寄せられて離れる'), ('barrier', '柵'),
         ('exception', '例外'), ('emergency vehicle', '緊急車両'), ('permanent', '恒久的な'), ('scheme', '計画'),
         ('consult', '意見を求める'), ('take ～ into account', '〜を考慮する'), ('restriction', '制限')]

PART = {'passage': PASSAGE, 'qA': QA, 'qB': QB, 'qC': QC, 'translation': TRANSLATION, 'vocab': VOCAB, 'notes': []}
