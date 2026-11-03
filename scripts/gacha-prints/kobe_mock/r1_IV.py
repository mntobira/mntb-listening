# -*- coding: utf-8 -*-
# 第1回 大問IV（英作文：棒グラフ・架空データ）
PART = {
'roman': 'IV', 'points': 25,
'intro_en': 'This graph presents the average time that high school students in one city spent on four activities on a weekday in 2018 and in 2025. (The data are fictional.) Answer the questions below in English.',
'chart': {'kind': 'bar', 'title': 'Average time spent on a weekday (minutes)', 'unit': 'min',
          'cats': ['Studying at home', 'Using a smartphone (not for study)', 'Exercise', 'Reading books'],
          'series': [('2018', [72, 95, 48, 25]), ('2025', [65, 150, 40, 14])]},
'questions': [
 {'no': '(1)', 'points': 10, 'target': 40,
  'stem': 'Select two of the four activities and compare the changes in the time spent on them between 2018 and 2025. Answer in English in about 40 words.',
  'models': [
   ('スマートフォンと読書', 'Between 2018 and 2025, the time students spent on their smartphones rose sharply from 95 to 150 minutes a day. In contrast, reading time almost halved, falling from 25 to 14 minutes. Smartphones may have taken time away from books.'),
   ('家庭学習と運動', 'Both studying at home and exercise decreased between 2018 and 2025. Study time fell from 72 to 65 minutes, while exercise dropped from 48 to 40 minutes. The decline was slightly larger for exercise, at eight minutes a day.')],
  'criteria': [('内容：2つの活動を選び，2018→2025の変化（増減・数値）を正しく読み取っている', 4),
               ('構成：2つを比較する表現（while / in contrast / both など）で関係づけている', 2),
               ('文法・語彙：時制（過去形），増減の動詞（rise / fall / drop），数値の書き方', 3),
               ('語数：おおむね35〜45語（大きく外れる場合は減点）', 1)]},
 {'no': '(2)', 'points': 15, 'target': 60,
  'stem': 'Some people say that schools should collect students’ smartphones during the school day. Do you agree or disagree? Give reasons for your answer. Answer in English in about 60 words.',
  'models': [
   ('賛成', 'I agree that schools should collect students’ smartphones during the school day. When my phone is in my bag, I find it hard to stop checking messages, even in class. Without phones, students can concentrate on their lessons and talk with each other face to face during breaks. In an emergency, they can still contact their families through the school office.'),
   ('反対', 'I disagree with collecting students’ smartphones. Smartphones are useful learning tools; in my classes, we often look up words or check data online. Moreover, learning to control our own phone use is an important skill, and students cannot develop it if the school simply takes their phones away. Instead, schools should set clear rules about when phones may be used.')],
  'criteria': [('内容：賛否を明示し，理由を2つ程度，具体例（自分の経験など）で支えている', 6),
               ('構成：主張→理由→（反論への配慮・まとめ）の順で，つなぎの語が適切', 3),
               ('文法・語彙：主述の一致・時制・冠詞・語法の誤りが少ない', 5),
               ('語数：おおむね55〜65語（大きく外れる場合は減点）', 1)]},
],
'vocab': [('rise sharply', '急増する'), ('halve', '半分になる'), ('fall / drop from A to B', 'AからBに減る'), ('in contrast', 'それに対して'),
          ('decline', '減少'), ('concentrate on …', '〜に集中する'), ('face to face', '対面で'), ('look up …', '〜を調べる')],
}
