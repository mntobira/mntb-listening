# -*- coding: utf-8 -*-
# 第1回〔5〕グラフを説明する英作文（約80語・30点）。大学・調査・数値は架空
PART = {
 'points': 30,
 'lead': 'The graph below presents the results of a survey asking students at Hollin University where they usually ate lunch on weekdays, in 2014 and in 2024.',
 'chart': {
  'title': 'Where Hollin University students usually eat lunch on weekdays (%)',
  'categories': ['University cafeteria', 'Convenience store', 'Packed lunch from home', 'Off-campus restaurant'],
  'series': [('2014', [48, 22, 12, 18]), ('2024', [31, 35, 24, 10])],
  'max': 60, 'step': 10,
  'source': 'Source: Hollin University Student Life Survey（架空の調査・数値はすべて架空）',
 },
 'instruction': 'Describe the main changes shown in the graph, using about **80 words**.',
 'lines': 12,
 'facts': [
  '2014年は大学の食堂が 48% で最も多かったが，2024年は 31% に減った。',
  'コンビニは 22% → 35% に増え，2024年には最も多い場所になった。',
  '家からの弁当は 12% → 24% と 2 倍になった。',
  '学外のレストランは 18% → 10% に減り，2024年は最も少ない。',
 ],
 'criteria': [
  ('グラフが何を示しているか（何の割合を，どの2つの年で）を最初に述べている', 6),
  ('増えたもの（コンビニ・弁当）と減ったもの（食堂・学外レストラン）を数値を挙げて正しく述べている', 12),
  ('最も目立つ変化（順位の入れかわり・2倍など）を比較の表現でまとめている', 6),
  ('語彙・文法が正確で，約80語（目安 65〜95語）で書けている', 6),
 ],
 'tips': [
  '問われているのは「主な変化の説明」。グラフにない理由や自分の意見を長く書く必要はない。',
  '数値の変化は rose from 22% to 35% / fell from 48% to 31% / doubled のように動詞で表す。',
  '「最も多い」の入れかわりは overtook ~ as the most popular choice などで1文にまとめると効果的。',
  'すべての数値を並べるより，大きな変化を2〜3点選び，順序立てて書く。',
 ],
 'models': [
  ('変化の大きい順にまとめる',
   '何のグラフか → 食堂の減少と，コンビニが最多に → 弁当が2倍 → 学外レストランの減少',
   "This graph compares where students at Hollin University usually had lunch on weekdays in 2014 and 2024. The most noticeable change is that the university cafeteria fell from 48% to 31%, while convenience stores rose from 22% to 35% and became the most common choice. Packed lunches from home also doubled, from 12% to 24%. On the other hand, off-campus restaurants became less popular, dropping from 18% to 10%. Overall, students seem to prefer quicker or cheaper options than before."),
  ('増えたもの・減ったものに分けてまとめる',
   '何のグラフか → 増えた2つ（コンビニ・弁当）→ 減った2つ（食堂・学外レストラン）→ 一言のまとめ',
   "The graph shows how Hollin University students' weekday lunch habits changed between 2014 and 2024. Two options grew in popularity. Convenience stores increased by 13 points to 35%, and packed lunches from home went up from 12% to 24%. In contrast, the other two declined. The cafeteria, which had been the top choice at 48%, dropped to 31%, and off-campus restaurants fell to only 10%. In short, eating at the cafeteria or in restaurants has become less common."),
 ],
 'model_ja': [
  'このグラフは，ホリン大学の学生が平日にふだん昼食をとっていた場所を，2014年と2024年で比べたものである。最も目立つ変化は，大学の食堂が48%から31%に下がった一方で，コンビニが22%から35%に上がり，最も多い選択肢になったことだ。家からの弁当も12%から24%へと2倍になった。他方，学外のレストランは18%から10%に下がり，人気が落ちた。全体として，学生は以前よりも手早く済む，あるいは安い選択肢を好むようになっているようだ。',
 ],
}
