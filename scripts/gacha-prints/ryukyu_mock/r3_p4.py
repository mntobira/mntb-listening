# -*- coding: utf-8 -*-
# 第3回 大問4 グラフ読解・英作文（150語程度）。グラフの調査・数値は架空
PART = {
 'points': 30,
 'lead': '以下のグラフは，ある架空の調査で，旅行先を決めるときに「重視する」と答えた人の割合を，情報源（家族・友人の話・旅行サイトの口コミ・SNSの写真や動画）別，年代別に示したものです。このグラフが示す主な特徴を説明し，そのうえで自分の意見を述べる英文を，合わせて 150 語程度で書きなさい。内容がはっきり伝わるか，文法やつづりが正しいかも評価する。',
 'chart': {
  'title': '旅行先を決めるときに「重視する」情報源（年代別）',
  'categories': ['10代', '20代', '30代', '40代', '50代', '60代', '70代以上'],
  'series': [
   ('家族・友人の話', [58, 44, 41, 45, 52, 61, 68]),
   ('旅行サイトの口コミ', [27, 49, 56, 53, 44, 30, 14]),
   ('SNSの写真・動画', [72, 63, 42, 28, 17, 9, 4]),
  ],
  'source': '出典：マナトビ編集部による架空の調査（数値はすべて架空）',
 },
 'lines': 20,
 'criteria': [
  ('グラフの読み取り：全体の傾向（SNSは若い世代ほど高く，家族・友人の話は高い年代ほど高い，など）を正しく述べている', 6),
  ('グラフの読み取り：具体的な数値や年代の比較（口コミは30代が最も高い，10代ではSNSが72%で最も高い，など）を正しく示している', 6),
  ('自分の考え：読み取ったことに対する意見や解釈が，理由・具体例とともに述べられている', 8),
  ('構成：読み取り → 考え の順で，つなぎの語（While, In contrast, For instance など）を使って筋道立てている', 4),
  ('語彙・文法・つづり：大きな誤りがなく，150語程度（目安 130〜170語）で書けている', 6),
 ],
 'facts': [
  '「SNSの写真・動画」は10代（72%）が最も高く，年代が上がるにつれて下がり続け，70代以上ではわずか4%。',
  '「家族・友人の話」は30代（41%）を底にした「U字型」で，70代以上（68%）が最も高い。',
  '「旅行サイトの口コミ」は30代（56%）が最も高く，その前後の年代ほど低い「山型」。',
  '最も重視される情報源は年代によって違う：10代・20代はSNS，30代・40代は口コミ，50代以上は家族・友人の話。',
  '10代では，SNS（72%）と口コミ（27%）の差が45ポイントもある。',
 ],
 'tips': [
  '3つの系列がそれぞれ違う形（下がり続ける・U字・山型）になっているので，1系列につき1文で形と数値を示すと整理しやすい。',
  '「年代によって最も重視する情報源が変わる」という全体のまとめを1文入れると，読み取りが深く見える。',
  '考えの段落では，「なぜその年代はその情報源を信じるのか」（使う機器・経験・時間など）を推測し，自分の旅行の決め方と比べる。',
  'SNSのよい点・注意すべき点のように，両面に触れてから自分の立場を示すのも有効。',
 ],
 'models': [
  ('読み取り＋理由の推測型',
   '第1段落：グラフの説明 → SNSは若いほど高い → 家族・友人はU字 → 口コミは30代が最高 ／ 第2段落：理由の推測（機器・経験）→ 自分の経験 → まとめ',
   "The graph shows which sources of information people of different ages consider important when they choose a travel destination. Photos and videos on social media matter most to young people: 72% of teenagers rely on them, but the figure falls steadily to just 4% among people over seventy. Advice from family and friends shows the opposite pattern, reaching 68% in the oldest group. Online reviews are most popular in the middle, peaking at 56% among people in their thirties.\n"
   "I think these differences reflect the way each generation gets information. Young people spend many hours on their phones, so attractive pictures easily catch their eyes. Older people, on the other hand, may trust people they know more than strangers on the internet. When my family planned a trip to Ishigaki last year, I found the beach on social media, but my mother checked reviews before booking the hotel. Using several sources seems the wisest way."),
  ('読み取り＋意見型（SNSだけで決めてよいか）',
   '第1段落：全体のまとめ（年代で最も重視する情報源が違う）→ 数値で3点 ／ 第2段落：意見（SNSだけに頼るのは危険）→ 理由2つ → まとめ',
   "This graph compares three sources of travel information and how much people in seven age groups value each one. The most important source changes with age. Teenagers and people in their twenties depend most on social media, at 72% and 63%. People in their thirties and forties prefer online reviews, while those aged fifty and over put advice from family and friends first. In contrast, only 4% of people over seventy value social media.\n"
   "In my opinion, young people should not choose a destination based on social media alone. First, photos online are often edited, so a place may look much better than it really is. Second, a short video cannot tell us about prices, safety or how crowded a place gets. Reviews and the experiences of people we know can fill these gaps. Social media is a great way to discover new places, but we should check other sources before deciding."),
 ],
 'model_ja': [
  'このグラフは，旅行先を選ぶときに，さまざまな年代の人がどの情報源を重視するかを示している。SNSの写真や動画は若い人にとって最も重要で，10代の72%がそれに頼っているが，その数値は着実に下がり，70代以上ではわずか4%になる。家族や友人の助言は逆の傾向を示し，最も高い年代では68%に達する。旅行サイトの口コミは中間の年代で最も人気があり，30代で56%と最も高くなる。',
  'こうした違いは，それぞれの世代の情報の得方を反映していると思う。若い人はスマートフォンに長い時間を使うので，魅力的な写真が目に留まりやすい。一方，年配の人はインターネット上の知らない人よりも，知っている人を信頼するのかもしれない。昨年，家族で石垣島への旅行を計画したとき，私はSNSでその浜辺を見つけたが，母はホテルを予約する前に口コミを確かめた。いくつかの情報源を使うのがいちばん賢いやり方のようだ。',
 ],
}
