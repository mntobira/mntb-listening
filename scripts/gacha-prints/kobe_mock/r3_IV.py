# -*- coding: utf-8 -*-
# 第3回 大問IV（英作文：棒グラフ・架空データ）
PART = {
'roman': 'IV', 'points': 25,
'intro_en': 'This graph presents the percentage of third-year high school students in one region who said that each factor was “very important” when choosing a university, in 2016 and in 2025. (The data are fictional.) Answer the questions below in English.',
'chart': {'kind': 'bar', 'title': 'Factors rated “very important” (%)', 'unit_label': '(%)', 'vmax': 100, 'step': 20,
          'cats': ['Subjects one can study', 'Location (near home)', 'Tuition and costs', 'Reputation of the university'],
          'series': [('2016', [74, 31, 38, 57]), ('2025', [78, 49, 61, 42])]},
'questions': [
 {'no': '(1)', 'points': 10, 'target': 40,
  'stem': 'Select two of the four factors and compare the changes in the percentage of students who rated them “very important” between 2016 and 2025. Answer in English in about 40 words.',
  'models': [
   ('学費と大学の評判', 'Between 2016 and 2025, the share of students who valued tuition and costs rose sharply from 38% to 61%. In contrast, reputation became less important, falling from 57% to 42%. Students may now care more about money than prestige.'),
   ('学べる分野と立地', 'Both the subjects one can study and location became more important. The former rose only slightly, from 74% to 78%, while the latter increased by 18 points, from 31% to 49%. Subjects remained the most important factor.')],
  'criteria': [('内容：2つの要素を選び，2016→2025の変化（増減・数値）を正しく読み取っている', 4),
               ('構成：2つを比較する表現（while / in contrast / both など）で関係づけている', 2),
               ('文法・語彙：時制（過去形），増減の動詞（rise / fall / increase），割合の書き方', 3),
               ('語数：おおむね35〜45語（大きく外れる場合は減点）', 1)]},
 {'no': '(2)', 'points': 15, 'target': 60,
  'stem': 'Some people say that high school students should choose a university mainly by what they want to study, not by its location or reputation. Do you agree or disagree? Give reasons for your answer. Answer in English in about 60 words.',
  'models': [
   ('賛成', 'I agree. University is a place to study a subject deeply, and four years is a long time to spend on something that does not interest you. A friend of mine chose a famous university but lost motivation in her classes. If students follow their interests, they will work harder and gain knowledge that leads to a career they really want.'),
   ('反対', 'I disagree. Many students do not yet know exactly what they want to study, and their interests may change after they enter university. Moreover, living costs differ greatly depending on location, and studying near home can reduce the burden on families. Students should consider several factors, including cost and location, rather than focusing on one alone.')],
  'criteria': [('内容：賛否を明示し，理由を2つ程度，具体例（自分の経験など）で支えている', 6),
               ('構成：主張→理由→（反論への配慮・まとめ）の順で，つなぎの語が適切', 3),
               ('文法・語彙：主述の一致・時制・冠詞・語法の誤りが少ない', 5),
               ('語数：おおむね55〜65語（大きく外れる場合は減点）', 1)]},
],
'vocab': [('tuition', '授業料'), ('reputation', '評判'), ('prestige', '名声'), ('the former / the latter', '前者／後者'),
          ('rise sharply', '急増する'), ('lose motivation', 'やる気を失う'), ('living costs', '生活費'), ('burden', '負担')],
}
