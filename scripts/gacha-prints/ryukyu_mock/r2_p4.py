# -*- coding: utf-8 -*-
# 第2回 大問4 グラフ読解・英作文（150語程度）。グラフの調査・数値は架空
PART = {
 'points': 30,
 'lead': '以下のグラフは，ある架空の調査で，健康のためにふだん「心がけている」と答えた人の割合を，取り組み（運動・食事・睡眠）別，年代別に示したものです。このグラフが示す主な特徴を説明し，そのうえで自分の意見を述べる英文を，合わせて 150 語程度で書きなさい。内容がはっきり伝わるか，文法やつづりが正しいかも評価する。',
 'chart': {
  'title': '健康のために「心がけている」と答えた人の割合（年代別・取り組み別）',
  'categories': ['10代', '20代', '30代', '40代', '50代', '60代', '70代以上'],
  'series': [
   ('定期的な運動', [61, 34, 28, 31, 38, 49, 57]),
   ('食事の内容', [22, 35, 46, 55, 63, 71, 74]),
   ('十分な睡眠', [29, 26, 33, 39, 44, 52, 60]),
  ],
  'source': '出典：マナトビ編集部による架空の調査（数値はすべて架空）',
 },
 'lines': 20,
 'criteria': [
  ('グラフの読み取り：全体の傾向（食事・睡眠は年代が上がるほど高い，など）を正しく述べている', 6),
  ('グラフの読み取り：具体的な数値や年代の比較（運動は10代が最も高く30代が最も低い，など）を正しく示している', 6),
  ('自分の考え：読み取ったことに対する意見や解釈が，理由・具体例とともに述べられている', 8),
  ('構成：読み取り → 考え の順で，つなぎの語（However, On the other hand, For example など）を使って筋道立てている', 4),
  ('語彙・文法・つづり：大きな誤りがなく，150語程度（目安 130〜170語）で書けている', 6),
 ],
 'facts': [
  '「食事の内容」は年代が上がるほど割合が高くなり，10代の22%から70代以上の74%まで3倍以上の差がある。',
  '「十分な睡眠」も20代（26%）を底にして，年代とともに上がり，70代以上で60%になる。',
  '「定期的な運動」は10代（61%）が最も高く，30代（28%）で最も低くなり，その後また上がる「U字型」。',
  '10代では運動が3つの中で最も高いが，20代以降は食事が最も高い（20代は運動34%・食事35%でほぼ同じ）。',
  '20代・30代は，3つの取り組みのどれも50%に届かない。',
 ],
 'tips': [
  '第1段落の最初に，グラフが「何の割合」を「どの区分」で示しているかを1文でまとめる。そのあと，目立つ特徴を2〜3点だけ，数値を入れて書く。',
  '増減の表現：rise / increase with age，fall to ~，reach ~，the gap between A and B，about three times as high as ~ など。',
  '第2段落では，「なぜその年代でそうなるのか」の推測（部活・仕事・子育て・体の変化など）と，自分の生活に引きつけた考えを書く。グラフにないことは I think / This may be because ~ で推測として書く。',
  '最後の1文で，これから自分がどうしたいか・社会がどうすべきかをまとめると全体がしまる。',
 ],
 'models': [
  ('読み取り＋理由の推測型',
   '第1段落：グラフの説明 → 食事・睡眠は年代とともに上昇 → 運動は10代が最高・30代が最低 ／ 第2段落：理由の推測（部活・仕事と子育て・体の変化）→ 自分の生活 → まとめ',
   "The graph shows the percentage of people in seven age groups who try to stay healthy in three ways: regular exercise, diet and sleep. Paying attention to diet becomes more common with age, rising from 22% among teenagers to 74% among people aged seventy and over. Sleep follows a similar pattern. Exercise, however, is different. It is highest among teenagers (61%), falls to its lowest point in the thirties (28%), and then rises again.\n"
   "I think these patterns reflect people’s lives. Many teenagers exercise because they belong to school sports clubs. People in their thirties are busy with work and raising children, so they may have little time for exercise or sleep. Older people may start to care about food after they notice changes in their bodies. As a high school student, I play basketball almost every day, but I often stay up late. From now on, I want to sleep more, not only exercise."),
  ('読み取り＋意見型（若い世代への呼びかけ）',
   '第1段落：全体の傾向 → 20代・30代はどれも50%未満 → 70代以上は3つとも高い ／ 第2段落：意見（若いうちから習慣を）→ 理由2つ → まとめ',
   "This graph compares how many people of different ages make an effort to exercise regularly, eat well and get enough sleep for their health. Overall, older people are more careful about their health: among people aged seventy and over, all three figures are 57% or higher. In contrast, people in their twenties and thirties show low figures for every item, and none of them reaches 50%. Teenagers are an exception only in exercise, at 61%.\n"
   "In my opinion, young people should build healthy habits before they become busy adults. First, habits are easier to start when we are young and have more free time. Second, the graph suggests that many people only begin to care about their health later in life, perhaps after problems appear. I believe schools could help by teaching simple cooking and the importance of sleep, so that students keep these habits throughout their lives."),
 ],
 'model_ja': [
  'このグラフは，7つの年代の人のうち，定期的な運動・食事・睡眠という3つの方法で健康を保とうとしている人の割合を示している。食事に気をつけることは年代が上がるほど一般的になり，10代の22%から70代以上の74%まで上がる。睡眠も同じような傾向を示している。しかし運動は違う。10代で最も高く（61%），30代で最も低くなり（28%），その後また上がる。',
  'こうした傾向は人々の生活を反映していると思う。多くの10代は学校の運動部に入っているので運動をする。30代の人は仕事や子育てで忙しいので，運動や睡眠にかける時間がほとんどないのかもしれない。年配の人は，体の変化に気づいてから食べ物に気をつけ始めるのかもしれない。高校生の私はほぼ毎日バスケットボールをしているが，夜ふかしをすることが多い。これからは，運動だけでなく，もっと睡眠をとりたい。',
 ],
}
