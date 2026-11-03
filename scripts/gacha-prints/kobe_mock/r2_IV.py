# -*- coding: utf-8 -*-
# 第2回 大問IV（英作文：棒グラフ・架空データ）
PART = {
'roman': 'IV', 'points': 25,
'intro_en': 'This graph presents the share of people in one country who mainly paid without cash for everyday shopping, by age group, in 2019 and in 2025. (The data are fictional.) Answer the questions below in English.',
'chart': {'kind': 'bar', 'title': 'People who mainly pay without cash (%)', 'unit_label': '(%)', 'vmax': 100, 'step': 20,
          'cats': ['Ages 18–29', 'Ages 30–49', 'Ages 50–69', 'Ages 70 and over'],
          'series': [('2019', [48, 41, 22, 9]), ('2025', [79, 70, 51, 28])]},
'questions': [
 {'no': '(1)', 'points': 10, 'target': 40,
  'stem': 'Select two of the four age groups and compare the changes in the share of people who mainly paid without cash between 2019 and 2025. Answer in English in about 40 words.',
  'models': [
   ('18〜29歳と70歳以上', 'Between 2019 and 2025, cashless payment spread in every age group. Among people aged 18 to 29, it rose from 48% to 79%. People aged 70 and over also used it more, but only 28% of them paid this way in 2025.'),
   ('30〜49歳と50〜69歳', 'The share of people mainly paying without cash grew in both middle age groups. It went up from 41% to 70% among those aged 30 to 49, and from 22% to 51% among those aged 50 to 69, an equal rise of 29 points.')],
  'criteria': [('内容：2つの年齢層を選び，2019→2025の変化（増減・数値）を正しく読み取っている', 4),
               ('構成：2つを比較する表現（while / both / but など）で関係づけている', 2),
               ('文法・語彙：時制（過去形），増減の動詞（rise / grow / go up），割合の書き方', 3),
               ('語数：おおむね35〜45語（大きく外れる場合は減点）', 1)]},
 {'no': '(2)', 'points': 15, 'target': 60,
  'stem': 'Some people say that all shops should continue to accept cash, even as cashless payment spreads. Do you agree or disagree? Give reasons for your answer. Answer in English in about 60 words.',
  'models': [
   ('賛成', 'I agree that all shops should continue to accept cash. As the graph suggests, many older people still do not pay without cash, and some of them find smartphones difficult to use. If shops refused cash, these people could not even buy food. In addition, cash still works when there is a power cut or a network problem.'),
   ('反対', 'I disagree. Handling cash costs shops time and money, because staff must count it and take it to the bank every day. Small shops in particular should be free to choose the payment methods that suit them. Instead of forcing every shop to accept cash, we should help older people learn how to use cashless payment safely.')],
  'criteria': [('内容：賛否を明示し，理由を2つ程度，具体例（自分の経験・グラフなど）で支えている', 6),
               ('構成：主張→理由→（反論への配慮・まとめ）の順で，つなぎの語が適切', 3),
               ('文法・語彙：主述の一致・時制・冠詞・語法の誤りが少ない', 5),
               ('語数：おおむね55〜65語（大きく外れる場合は減点）', 1)]},
],
'vocab': [('cashless payment', 'キャッシュレス決済'), ('share', '割合'), ('go up / rise from A to B', 'AからBに増える'), ('point', '（割合の）ポイント'),
          ('accept cash', '現金を受け付ける'), ('power cut', '停電'), ('handle', '〜を扱う'), ('payment method', '支払い方法')],
}
