# -*- coding: utf-8 -*-
# 第2回 大問3 図つきの長文読解。町・調査・数値は架空
PART = {
 'points': 30,
 'lead': '以下の英文と図を読み，(1)〜(3) の問いに答えなさい。(1) と (2) は，最も適切なものを (a)〜(d) から 1 つずつ選ぶこと。',
 'title': 'How People Get to Work in Brenford',
 'passage': [
  "For decades, almost everyone in the mid-sized city of Brenford drove to work. Buses ran only once an hour, and the narrow streets felt unsafe for cyclists. In 2015, the city council decided to change this. Over the next ten years it built protected bicycle lanes, doubled the number of buses on main routes and raised parking fees in the city center. Figure 1 shows how commuters’ choices changed during this period.",
  "The most striking change is the fall in car use, from 68 percent of commuters in 2015 to 41 percent in 2025. Cycling, which was almost unheard of at the start, grew more than fivefold. Bus use also rose, though less dramatically. Interestingly, the share of people who worked from home jumped in 2020 and then {ki} at a higher level than before, even after most offices had reopened.",
  "Not everyone welcomed the new policies. Shop owners in the center feared that higher parking fees would drive customers away, and some residents of outlying neighborhoods complained that the improved buses did not reach them. The council responded by adding a free shuttle on weekends and by opening two new routes to the edges of the city in 2023.",
  "City planners say the lesson is that people’s habits can change, but only when the alternatives are genuinely convenient. “Nobody gives up a car because a poster tells them to,” says one planner. “They switch when the bike lane or the bus is simply the easiest way to get where they are going.”",
 ],
 'notes': [('commuter', '通勤者'), ('fivefold', '5倍に'), ('outlying', '中心から離れた')],
 'chart': {
  'title': 'Figure 1.  Main way of getting to work in Brenford (% of commuters)',
  'categories': ['2015', '2020', '2025'],
  'series': [('Car', [68, 52, 41]), ('Bus', [14, 17, 21]), ('Bicycle', [3, 12, 17]), ('Work from home', [5, 16, 13])],
  'source': 'Source: Brenford City Transport Survey（架空の調査・数値はすべて架空。徒歩などその他は省略）',
 },
 'lines': 9,
 'questions': [
  {'label': '(1)', 'type': 'mc', 'points': 5, 'kind': '内容一致',
   'stem': 'Which statement is true according to the passage and Figure 1?',
   'choices': [('(a)', 'Bus use grew faster than bicycle use between 2015 and 2025.'), ('(b)', 'The council made parking in the city center more expensive.'), ('(c)', 'Working from home fell back to its 2015 level by 2025.'), ('(d)', 'Shop owners asked the council to build more bicycle lanes.')],
   'answer': '(b)', 'expl': '第1段落 raised parking fees in the city center と一致。(a) バスは14→21%，自転車は3→17%で自転車のほうが伸びた。(c) 在宅勤務は2025年でも13%で2015年の5%より高い。(d) 商店主は駐車料金の値上げを心配していた。'},
  {'label': '(2)', 'type': 'mc', 'points': 5, 'kind': '空所補充（語彙）',
   'stem': 'Choose the word that should go in blank (i).',
   'choices': [('(a)', 'settled'), ('(b)', 'vanished'), ('(c)', 'doubled'), ('(d)', 'started')], 'cols': 4,
   'answer': '(a)', 'expl': '図では在宅勤務は 5 → 16 → 13% で，2020年に急増したあと少し下がり，以前より高い水準に落ち着いている。settle at ~ で「〜（の水準）に落ち着く」。(b) 消えた，(c) 倍増した，(d) 始まった，はいずれも図と合わない。'},
  {'label': '(3)', 'type': 'write', 'points': 20, 'kind': '英語での記述（約60語）',
   'stem': 'Imagine that your own town wants to reduce car use in the same way as Brenford. Which one of Brenford’s measures would work best in your town? Explain why in English, using information from the passage or Figure 1. (About 60 words)',
   'criteria': [
    ('ブレンフォードの施策の中から1つをはっきり選んでいる（自転車専用レーン・バスの増便・駐車料金の値上げ・郊外路線や無料シャトル）', 4),
    ('本文または図の根拠（自転車が5倍以上に増えた／車が68→41% など）を使っている', 8),
    ('自分の町の事情と結びつけて理由を述べている', 4),
    ('語彙・文法が正確で，約60語（目安 45〜75語）で書けている', 4),
   ],
   'models': [
    ('自転車専用レーンを選ぶ',
     "Protected bicycle lanes would work best in my town. Like old Brenford, my town has narrow roads, and many students are afraid to ride bikes beside cars. In Brenford, cycling grew more than fivefold after safe lanes were built. Since most of us live within five kilometers of school or work, safe lanes could make cycling the easiest choice."),
    ('バスの増便を選ぶ',
     "Adding more buses would be the most effective measure in my town. Now our buses come only once an hour, just as in Brenford before 2015, so people have no choice but to drive. Brenford’s bus use rose from 14 to 21 percent after it doubled its buses. My town is hilly, so buses would be easier than bicycles for older people."),
   ],
   'expl': '問われているのは「1つの施策」と「なぜ自分の町でうまくいくか」。本文最終段落の「代わりの手段が本当に便利なときだけ習慣は変わる」という考えを使うと理由がまとまりやすい。数値は1つ入れれば十分で，図にない数値を作らないこと。'},
 ],
 'facts': [
  '車での通勤は 68% → 52% → 41% と大きく減ったが，2025年でも最も多い手段である。',
  '自転車は 3% → 17% で 5 倍以上に増え，最も伸び率が大きい。',
  'バスは 14% → 21% と増えたが，伸びは自転車より小さい。',
  '在宅勤務は 2020年に 16% へ急増し，2025年は 13% と少し下がったが，2015年（5%）より高い。',
 ],
 'translation': [
  '何十年もの間，中規模の都市ブレンフォードでは，ほとんど誰もが車で通勤していた。バスは1時間に1本しかなく，狭い通りは自転車には危険に感じられた。2015年，市議会はこれを変えることを決めた。その後10年間で，市は守られた自転車専用レーンを作り，主要路線のバスの本数を2倍にし，中心部の駐車料金を引き上げた。図1は，この期間に通勤者の選択がどう変わったかを示している。',
  '最も目立つ変化は車の利用の減少で，2015年の通勤者の68%から，2025年には41%になった。初めはほとんど聞いたこともなかった自転車通勤は5倍以上に増えた。バスの利用も増えたが，それほど劇的ではなかった。興味深いことに，在宅勤務の割合は2020年に跳ね上がり，その後，以前より高い水準に落ち着いた。ほとんどの職場が再開したあとでもそうだった。',
  '新しい政策を誰もが歓迎したわけではない。中心部の商店主は駐車料金の値上げで客が遠のくことを恐れ，郊外の地区の住民の中には，改善されたバスが自分たちのところまで来ないと不満を言う人もいた。市議会はそれに応えて，週末に無料のシャトルバスを走らせ，2023年には市の外れへの新しい路線を2本開設した。',
  '都市計画の担当者たちは，人々の習慣は変わりうるが，それは代わりの手段が本当に便利なときだけだ，というのが教訓だと言う。「ポスターに言われたから車をやめる人はいません」とある担当者は言う。「自転車レーンやバスが，行きたい場所へ行くいちばん簡単な方法になったときに乗り換えるのです」。',
 ],
 'vocab': [('city council', '市議会'), ('protected', '（車道から）守られた'), ('parking fee', '駐車料金'), ('striking', '目立つ'), ('unheard of', '聞いたこともない'), ('dramatically', '劇的に'), ('settle at', '〜の水準に落ち着く'), ('drive A away', 'Aを遠ざける'), ('respond by doing', '〜することで応える'), ('alternative', '代わりの手段'), ('genuinely', '本当に'), ('switch', '乗り換える')],
}
