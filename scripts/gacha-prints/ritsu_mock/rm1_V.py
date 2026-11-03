# -*- coding: utf-8 -*-
# 第1回 V 語彙（書き下ろし）。〔1〕空所補充，〔2〕下線語 {u|…} の同意語。
from mk import Pos, mc
P = Pos(105)
PART = {
 'q1': {'items': [
  mc('A', ['luggage', 'lumber', 'lottery', 'ladder'],
     'luggage は「（旅行の）手荷物」。ホテルの従業員が部屋まで運ぶもの。{c1}「材木」{c2}「宝くじ」{c3}「はしご」は文脈に合わない。', P(),
     text='The hotel staff carried our ______ up to the room.'),
  mc('B', ['whisper', 'wrinkle', 'wreck', 'wrist'],
     'in a whisper は「ささやき声で」。赤ちゃんが寝ているので小声で話した。{c1}「しわ」{c2}「残骸」{c3}「手首」は in a ___ の形で意味が通らない。', P(),
     text='The baby was asleep, so we spoke in a ______.'),
  mc('C', ['sore', 'loose', 'bold', 'tame'],
     'sore は「（筋肉が）痛い」。長いハイキングの後で階段を上れないほど脚が痛い。{c1}「ゆるい」{c2}「大胆な」{c3}「飼いならされた」は脚の状態として合わない。', P(),
     text='After the long hike, my legs were so ______ that I could hardly climb the stairs.'),
  mc('D', ['refrain', 'resign', 'reckon', 'recite'],
     'refrain from doing は「〜を控える」。from を伴う形は refrain のみ。{c1}「辞職する」{c2}「推測する」{c3}「暗唱する」は from eating と結びつかない。', P(),
     text='The doctor told him to ______ from eating sweets for a month.'),
  mc('E', ['confidently', 'faintly', 'vaguely', 'gloomily'],
     '“without any hesitation”（少しもためらわずに）と言い換えられているので「自信をもって」。{c1}「かすかに」{c2}「あいまいに」{c3}「陰気に」はためらいのなさと合わない。', P(),
     text='She answered the difficult question ______, without any hesitation.'),
 ]},
 'q2': {'items': [
  mc('A', ['strengthened', 'weakened', 'replaced', 'delayed'],
     'reinforce は「補強する・強める」。新しい証拠が主張を強めた。{c1}は逆の意味。{c2}「置き換えた」{c3}「遅らせた」は意味が異なる。', P(),
     text='The new evidence {u|reinforced} her argument.'),
  mc('B', ['short', 'detailed', 'careless', 'formal'],
     'concise は「簡潔な」。{c1}「詳しい」は逆に近い。{c2}「不注意な」{c3}「正式な」は意味が異なる。', P(),
     text='She wrote a {u|concise} summary of the meeting.'),
  mc('C', ['delay', 'cancel', 'advertise', 'organize'],
     'postpone は「延期する」。{c1}「中止する」は「延期」とは異なり，後日行わない。{c2}「宣伝する」{c3}「準備する」は意味が異なる。', P(),
     text='The company had to {u|postpone} the event because of the storm.'),
  mc('D', ['famous', 'criticized', 'punished', 'unknown'],
     'be renowned for A は「Aで名高い」。{c1}「批判された」{c2}「罰せられた」は意味が異なり，{c3}「知られていない」は逆。', P(),
     text='The village is {u|renowned} for its pottery.'),
  mc('E', ['evaluate', 'repair', 'ignore', 'cause'],
     'assess は「評価する・見積もる」。修理を始める前に被害の程度を見積もる。{c1}「修理する」は修理の前に行うことと合わない。{c2}「無視する」{c3}「引き起こす」は意味が異なる。', P(),
     text='We need to {u|assess} the damage before we start repairs.'),
 ]},
}
