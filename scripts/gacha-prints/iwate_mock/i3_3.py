# -*- coding: utf-8 -*-
# 第3回 大問3 段落番号つき長文（夜行列車の復活）。((1)) 空所①・{w6|…} 語義⑥。設問は i3_3q.py
from i3_3q import QUESTIONS, VOCAB
P = {
 'title': '長文読解（選択式）',
 'intro': '英文を読み，後に続く設問に答えなさい。各段落の冒頭の (1)〜(6) は段落番号である。（＊印の語には，英文の末尾に意味を示してある。）',
 'passages': [{
  'para_numbers': True,
  'paras': [
   "Only a generation ago, night trains seemed to be heading for extinction. As cheap flights and fast daytime rail lines spread, fewer passengers were willing to spend ten hours in a narrow bunk*, and many railway companies cut their overnight services to save money. Old sleeping cars were sold, scrapped or left to ((1)) in sidings. For people who remembered falling asleep in one country and waking up in another, it felt like the end of a romantic way to travel.",
   "In recent years, however, the night train has made a surprising return. New routes have been launched between major cities, and some old ones have been {w6|restored}. Several railway companies have ordered modern sleeping cars with private cabins, showers and power sockets. Tickets on popular routes now sell out weeks in advance, especially during holiday seasons. On some routes, families now book the same cabin every summer, and children who have never flown before treat the journey as the most exciting part of their holiday. The ((2)) is not only nostalgia. More and more travellers are looking for ways to cut the amount of carbon* they produce, and a train that carries them while they sleep can replace both a flight and a hotel night.",
   "Supporters also point to the time that is saved. A short flight may last only an hour or two, but passengers must travel to an airport, which is often far from the city centre, arrive well before departure and pass through security. A night train, by contrast, usually leaves from a central station in the evening and arrives in the centre of another city in the morning. For a business traveller with a meeting at nine, this can be more ((3)) than an early flight that requires getting up at four.",
   "The comeback has not been easy, though. Running a sleeping car is {w7|costly}: each carriage carries far fewer passengers than a daytime coach, but it still needs staff, cleaning and bedding. Track charges, which railway companies pay to use the lines, can differ greatly from country to country, so a single international route may involve several sets of fees and rules. Delays are another problem. When a train crosses many borders, a small problem early in the night can {w8|accumulate} until the train arrives hours late.",
   "Governments have responded in different ways. Some have offered financial support for new routes, arguing that night trains help them meet their environmental goals. Others have been more ((4)), pointing out that only a small number of passengers are involved compared with the millions who fly each year. Critics also note that a ticket for a private cabin can cost more than a flight, which means that night trains may {w9|appeal} mainly to people who already have money and time to spare.",
   "Whether the revival lasts may depend on whether night trains can become an ordinary choice rather than a special experience. If prices fall, timetables become more reliable and booking across borders becomes as simple as buying a plane ticket, more travellers may decide that a good night’s sleep on the move is worth the extra hours. For now, the sight of a full sleeping car pulling out of a station on a winter evening is a {w10|reminder} that an old idea can sometimes answer a ((5)) problem.",
  ],
  'notes': [('bunk', '（列車などの）寝台'), ('carbon', '（ここでは）二酸化炭素')],
  'translation': [
   'ほんの一世代前，夜行列車は消滅に向かっているように見えた。安い航空便や速い昼間の鉄道路線が広がるにつれて，狭い寝台で10時間を過ごそうとする乗客は減り，多くの鉄道会社はお金を節約するために夜行の運行を削減した。古い寝台車は売られたり，解体されたり，待避線でさびるままにされたりした。ある国で眠りにつき，別の国で目覚めたことを覚えている人々にとって，それはロマンのある旅の仕方の終わりのように感じられた。',
   'しかし近年，夜行列車は意外な復活を遂げている。主要都市の間に新しい路線が開かれ，いくつかの古い路線は復活した。個室やシャワー，電源コンセントを備えた新しい寝台車を発注した鉄道会社もいくつかある。人気の路線の切符は，特に休暇の時期には，今では何週間も前に売り切れる。毎年夏に同じ個室を予約する家族がいる路線もあり，飛行機に乗ったことのない子どもたちは，その旅を休暇でいちばんわくわくする部分だと思っている。その理由は懐かしさだけではない。自分が出す二酸化炭素の量を減らす方法を探す旅行者が増えており，眠っている間に運んでくれる列車は，飛行機の便とホテルの一泊の両方の代わりになりうるのだ。',
   '支持する人々は，節約される時間も指摘する。短い航空便は1〜2時間しかかからないかもしれないが，乗客はしばしば市の中心部から遠い空港まで移動し，出発のかなり前に到着して保安検査を通らなければならない。対照的に，夜行列車はふつう夕方に中心部の駅を出発し，朝には別の都市の中心部に到着する。9時に会議がある出張者にとっては，4時に起きなければならない早朝の便より，こちらのほうが便利なことがある。',
   'とはいえ，復活は容易ではなかった。寝台車を走らせるには費用がかかる。1両あたりの乗客は昼間の客車よりはるかに少ないのに，乗務員や清掃，寝具は必要だからだ。鉄道会社が線路を使うために払う線路使用料は国によって大きく異なることがあるので，一つの国際路線に何種類もの料金や規則が関わることもある。遅れももう一つの問題だ。列車が多くの国境を越えるとき，夜の早い時間の小さな問題が積み重なって，列車が何時間も遅れて到着することがある。',
   '政府の対応はさまざまである。夜行列車は環境目標の達成に役立つと主張して，新しい路線に財政支援をしてきた政府もある。一方，毎年飛行機に乗る何百万もの人々に比べれば関わる乗客の数は少ないと指摘して，より慎重な政府もある。批判する人々は，個室の切符が航空券より高いことがあるので，夜行列車はすでにお金と時間に余裕のある人々に主に好まれることになるかもしれない，とも指摘する。',
   'この復活が続くかどうかは，夜行列車が特別な体験ではなく普通の選択肢になれるかどうかにかかっているのかもしれない。値段が下がり，時刻表がより確かなものになり，国境を越える予約が航空券を買うのと同じくらい簡単になれば，移動しながらぐっすり眠れることには余分な時間をかける価値があると考える旅行者が増えるかもしれない。今のところ，冬の夕方に満員の寝台車が駅を出ていく光景は，古い考えが時に現代の問題に答えを出しうることを思い出させてくれるものである。',
  ],
 }],
 'questions': QUESTIONS,
 'vocab': VOCAB,
}
