# -*- coding: utf-8 -*-
# 第1回〔4〕自由英作文（約100語・40点）。プログラム・金額は架空
PART = {
 'points': 40,
 'lead': 'Read the situation and the table below, and answer the question **in English**.',
 'context': [
  "You are a first-year university student. Your university offers two short study-abroad programs during the summer vacation, and you can join only one of them. The details are shown in the table.",
 ],
 'table': {
  'head': ['', 'Program A', 'Program B'],
  'rows': [
   ['Place', 'A large city (language school downtown)', 'A small farming town (local community college)'],
   ['Length', '2 weeks', '4 weeks'],
   ['Housing', 'Student dormitory with other international students', 'Homestay with a local family'],
   ['Classes', '4 hours of English every morning', '2 hours of English, plus volunteer work on local farms'],
   ['Cost', '250,000 yen', '380,000 yen'],
  ],
 },
 'question': '//Which program would you choose, Program A or Program B?//',
 'instruction': 'Using the information in the table, explain your choice and your reasons. Write one paragraph of about **100 words**.',
 'lines': 15,
 'criteria': [
  ('どちらのプログラムを選ぶかが最初にはっきり示されている', 6),
  ('表の情報（場所・期間・滞在先・授業・費用）を2点以上使って理由を述べている', 14),
  ('もう一方を選ばない理由や，自分の目標・経験と結びつけて説得力を持たせている', 8),
  ('構成（選択 → 理由 → まとめ）とつなぎの語が適切である', 4),
  ('語彙・文法・つづりに大きな誤りがなく，約100語（目安 85〜115語）で書けている', 8),
 ],
 'tips': [
  '1文目で I would choose Program A / B. と言い切る。どちらを選んでも評価は同じで，表の情報をどれだけ根拠として使えているかが大切。',
  '表の項目をそのまま並べるのではなく，「だから自分にとってどうなのか」まで書く（例：homestay → 毎日英語で話す機会が増える）。',
  '費用や期間のような弱点には，In return, ... / Although B is more expensive, ... のように触れておくと，比べたうえで選んだことが伝わる。',
  '数字は英語で正しく書く（250,000 yen / two weeks）。最後に1文でまとめる。',
 ],
 'models': [
  ('Program B を選ぶ',
   '選択（B）→ 理由1 ホームステイで生活の英語（自分の課題）→ 理由2 農場のボランティアで地域の人と関わる → 費用への一言 → まとめ',
   "I would choose Program B. First, I want to use English in everyday situations, not only in a classroom. Living with a local family would give me the chance to talk with native speakers at breakfast and dinner every day, which is exactly what I lack now. Second, volunteer work on local farms would let me learn about life in a small community and make friends outside school. It is true that Program B costs 130,000 yen more, but it is twice as long, so I think it is better value. For these reasons, Program B suits my goals."),
  ('Program A を選ぶ',
   '選択（A）→ 理由1 毎朝4時間の授業で文法と発音を集中して学べる → 理由2 費用と期間が現実的（アルバイトとの両立）→ まとめ',
   "I would choose Program A. My main goal this summer is to improve my speaking and grammar quickly, and four hours of English classes every morning would give me intensive practice. Staying in a dormitory with other international students would also help, because we would have to use English as our common language. In addition, Program A costs 250,000 yen and lasts only two weeks. Since I work part-time during the vacation to pay for my studies, a shorter and cheaper program is more realistic for me. Therefore, Program A is the better choice."),
 ],
 'model_ja': [
  '私はプログラムBを選ぶ。第一に，私は教室の中だけでなく，日常の場面で英語を使いたい。地元の家庭で暮らせば，毎日朝食や夕食の席で英語を母語とする人と話す機会が得られ，それはまさに今の私に足りないものだ。第二に，地元の農場でのボランティア活動を通して，小さな地域社会での暮らしを学び，学校の外で友人を作ることができる。たしかにプログラムBは13万円高いが，期間は2倍なので，より割安だと思う。こうした理由から，プログラムBが私の目標に合っている。',
 ],
}
