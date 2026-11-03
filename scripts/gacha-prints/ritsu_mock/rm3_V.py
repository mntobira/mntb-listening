# -*- coding: utf-8 -*-
# 第3回 V 語彙（書き下ろし）。〔1〕空所補充，〔2〕下線語 {u|…} の同意語。
from mk import Pos, mc
P = Pos(305)
PART = {
 'q1': {'items': [
  mc('A', ['blister', 'blizzard', 'blanket', 'bladder'],
     'blister は「（皮膚の）水ぶくれ・まめ」。新しい靴で歩いた後にかかとにできるもの。{c1}「猛吹雪」{c2}「毛布」{c3}「ぼうこう」はかかとにできるものではない。', P(),
     text='Walking in my new shoes gave me a painful ______ on my heel.'),
  mc('B', ['drowsy', 'thrifty', 'stubborn', 'vivid'],
     'drowsy は「眠い」。風邪薬を飲むと眠くなるので運転しないよう注意している文脈。{c1}「倹約的な」{c2}「頑固な」{c3}「鮮やかな」は薬の副作用として合わない。', P(),
     text='This medicine may make you ______, so do not drive after taking it.'),
  mc('C', ['receipt', 'recipe', 'remedy', 'riddle'],
     'receipt は「領収書・レシート」。返品するときに見せるよう求められるもの。{c1}「調理法」{c2}「治療法」{c3}「なぞなぞ」は返品の手続きと合わない。', P(),
     text='You will need to show your ______ if you want to return the item.'),
  mc('D', ['soak', 'sew', 'sweep', 'swell'],
     'soak は「（液体に）浸す」。豆を料理の前に一晩水に浸しておく。{c1}「縫う」{c2}「掃く」{c3}「ふくらむ（自動詞）」は beans を目的語にして水に浸す意味にならない。', P(),
     text='______ the beans in water overnight before you cook them.'),
  mc('E', ['abruptly', 'gradually', 'patiently', 'politely'],
     'abruptly は「突然に・ぶっきらぼうに」。“without saying goodbye”（さよならも言わずに）と合う。{c1}「徐々に」{c2}「辛抱強く」{c3}「礼儀正しく」は「さよならも言わずに」と合わない。', P(),
     text='He ended the phone call ______, without even saying goodbye.'),
 ]},
 'q2': {'items': [
  mc('A', ['dull', 'exciting', 'expensive', 'necessary'],
     'tedious は「退屈な・うんざりする」。{c1}「わくわくする」は逆。{c2}「高価な」{c3}「必要な」は意味が異なる。', P(),
     text='Filling in all these forms is a {u|tedious} task.'),
  mc('B', ['ban', 'allow', 'repair', 'measure'],
     'prohibit は「禁止する」。{c1}「許可する」は逆。{c2}「修理する」{c3}「測定する」は意味が異なる。', P(),
     text='The city decided to {u|prohibit} cars in the old town center.'),
  mc('C', ['enormous', 'tiny', 'empty', 'ancient'],
     'immense は「巨大な・莫大な」。{c1}「とても小さい」は逆。{c2}「空の」{c3}「古代の」は意味が異なる。', P(),
     text='The project required an {u|immense} amount of time.'),
  mc('D', ['brief', 'permanent', 'noisy', 'careful'],
     'temporary は「一時的な」。{c1}「永続的な」は逆。{c2}「騒々しい」{c3}「注意深い」は意味が異なる。', P(),
     text='The museum is offering a {u|temporary} exhibition of local art.'),
  mc('E', ['give up', 'carry on', 'look up', 'set up'],
     'abandon は「（計画などを）断念する・捨てる」。{c1}「続ける」は逆。{c2}「調べる」{c3}「設立する」は意味が異なる。', P(),
     text='Bad weather forced the climbers to {u|abandon} their plan.'),
 ]},
}
