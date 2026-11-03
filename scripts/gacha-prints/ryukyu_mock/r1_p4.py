# -*- coding: utf-8 -*-
# 第1回 大問4 グラフ読解・英作文（150語程度）。グラフの調査・数値は架空
PART = {
 'points': 30,
 'lead': '以下のグラフは，ある架空の調査で「この1か月に，30分以上続けて本を読んだ」と答えた人の割合を，読んだ本の形（紙の本・電子書籍・オーディオブック）別，年代別に示したものです。このグラフが示す主な特徴を説明し，そのうえで自分の意見を述べる英文を，合わせて 150 語程度で書きなさい。内容がはっきり伝わるか，文法やつづりが正しいかも評価する。',
 'chart': {
  'title': '「この1か月に30分以上続けて読んだ」人の割合（年代別・本の形別）',
  'categories': ['10代', '20代', '30代', '40代', '50代', '60代', '70代以上'],
  'series': [
   ('紙の本', [52, 38, 33, 36, 41, 47, 55]),
   ('電子書籍', [24, 35, 37, 30, 21, 12, 5]),
   ('オーディオブック', [6, 14, 18, 15, 9, 6, 4]),
  ],
  'source': '出典：マナトビ編集部による架空の調査（数値はすべて架空）',
 },
 'lines': 20,
 'criteria': [
  ('グラフの読み取り：全体の傾向（紙の本はどの年代でも最も多い，など）を正しく述べている', 6),
  ('グラフの読み取り：具体的な数値や年代の比較（電子書籍は30代が最も高く，年代が上がるほど低い，など）を正しく示している', 6),
  ('自分の考え：読み取ったことに対する意見や解釈が，理由・具体例とともに述べられている', 8),
  ('構成：読み取り → 考え の順で，つなぎの語（However, In contrast, For example など）を使って筋道立てている', 4),
  ('語彙・文法・つづり：大きな誤りがなく，150語程度（目安 130〜170語）で書けている', 6),
 ],
 'facts': [
  '紙の本は，どの年代でも3つの形の中で最も割合が高い（最も低い30代でも33%）。',
  '紙の本は10代（52%）と70代以上（55%）で高く，30代（33%）で最も低い「U字型」になっている。',
  '電子書籍は30代（37%）が最も高く，50代以上では年代が上がるほど下がり，70代以上では5%しかない。',
  'オーディオブックはどの年代でも20%未満だが，30代（18%）が最も高い。',
  '20代・30代では，電子書籍と紙の本の差が小さい（20代 38% と 35%，30代 33% と 37% で電子書籍が上回る）。',
 ],
 'tips': [
  '第1段落でグラフが何を示しているか（何の割合を，どの区分で）を1文でまとめ，次に目立つ特徴を2〜3点，数値を入れて書く。すべての数値を並べる必要はない。',
  '比較の表現：the highest / the lowest，A is more popular than B，decrease as age increases，In contrast,，while ~ など。',
  '第2段落では「なぜそうなるのか」の推測や，自分や身近な人の経験を書くと考えが具体的になる。グラフから言えないことを事実のように書かないこと（I think / This may be because ~ を使う）。',
  '最後に1文でまとめ（今後どうなると思うか，どうしたいか）を書くと，全体がしまる。',
 ],
 'models': [
  ('読み取り＋理由の推測型',
   '第1段落：グラフの説明 → 紙の本はどの年代でも最多・U字型 → 電子書籍は30代が最多で高年代ほど低い ／ 第2段落：理由の推測（時間・目の疲れ・習慣）→ 自分の経験 → まとめ',
   "The graph shows the percentage of people in seven age groups who read a book for at least thirty minutes in one month, in three different forms. Paper books were the most popular form in every age group, especially among teenagers (52%) and people over seventy (55%). In contrast, e-books were most popular among people in their thirties (37%), and their share fell steadily with age to only 5% among the oldest group. Audiobooks were the least common form for all ages.\n"
   "I think these differences come from people’s daily lives. People in their thirties are busy with work and children, so they may read e-books on their phones on the train. Older people, on the other hand, may find small screens tiring for their eyes. As a high school student, I usually read paper books borrowed from the school library, because they are free. In the future, I would like to try audiobooks while I walk to school."),
  ('読み取り＋意見型（紙の本は残るか）',
   '第1段落：全体の傾向 → 20代・30代は電子書籍と紙の本がほぼ同じ → オーディオブックは少数 ／ 第2段落：意見（紙の本はなくならない）→ 理由2つ → まとめ',
   "This graph compares how many people of different ages read books in paper, electronic and audio form for thirty minutes or more in a month. Overall, paper books were read by the largest share of people, from 33% in the thirties to 55% among people aged seventy and over. However, in their twenties and thirties, almost as many people read e-books as paper books, and people in their thirties actually chose e-books slightly more often. Audiobooks stayed below 20% in every group.\n"
   "Some people say paper books will disappear, but I do not think so. First, the graph shows that teenagers, the youngest group, read paper books more than any other form. Second, many readers say that turning real pages helps them remember the story. I believe e-books and audiobooks will keep growing because they are convenient, but they will be added to paper books rather than replace them."),
 ],
 'model_ja': [
  'このグラフは，7つの年代の人のうち，1か月に30分以上続けて本を読んだ人の割合を，3つの形別に示している。紙の本はどの年代でも最も多く読まれており，特に10代（52%）と70代以上（55%）で高かった。対照的に，電子書籍は30代で最も多く（37%），その割合は年代が上がるにつれて着実に下がり，最も高い年代ではわずか5%だった。オーディオブックはすべての年代で最も少ない形だった。',
  'こうした違いは，人々の日々の生活から来ていると思う。30代の人は仕事や子育てで忙しいので，電車の中でスマートフォンで電子書籍を読むのかもしれない。一方，年配の人は小さな画面が目に疲れると感じるのかもしれない。高校生の私は，無料なので，ふだんは学校の図書館で借りた紙の本を読んでいる。今後は，学校まで歩くあいだにオーディオブックを試してみたい。',
 ],
}
