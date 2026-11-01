# -*- coding: utf-8 -*-
# 第1回 大問3 図つきの長文読解。調査・数値は架空
PART = {
 'points': 30,
 'lead': '以下の英文と図を読み，(1)〜(3) の問いに答えなさい。(1) と (2) は，最も適切なものを (a)〜(d) から 1 つずつ選ぶこと。',
 'title': 'Learning from Videos',
 'passage': [
  "Not long ago, a student who did not understand a math problem had two choices: ask a teacher the next day or stare at the textbook until the answer appeared. Today, many students simply search for a short video in which someone explains the same kind of problem step by step. A survey carried out every five years in the fictional region of Westmoor shows how quickly this habit has spread (Figure 1).",
  "In 2010, only a small share of students at any level said they watched learning videos at least once a week. By 2025, the picture had changed completely. Among high school students, the figure rose from 12 percent to 71 percent, and junior high school students showed a similar rise. Elementary school students also watched more videos, but their share stayed clearly lower than that of older students, partly because many families {ki} limits on how long young children can spend in front of a screen.",
  "Teachers are divided on what this means. Some welcome the change, pointing out that a student can pause a video, watch a difficult part again, and learn at a speed that suits them. Others worry that students may confuse watching with understanding. “Following someone else’s explanation feels easy,” says one teacher, “but the real test is whether you can solve the next problem on your own.”",
  "Researchers in Westmoor also noticed that the increase slowed down after 2020 for high school students. Between 2020 and 2025, their share rose by only six points, compared with much larger jumps in earlier periods. One possible reason is that most students who wanted to use videos had already started doing so. Another is that schools began to offer their own recorded lessons, which some students counted as class work rather than as “learning videos.”",
 ],
 'notes': [('fictional', '架空の'), ('confuse A with B', 'AをBと取り違える')],
 'chart': {
  'title': 'Figure 1.  Students who watch learning videos at least once a week (Westmoor, %)',
  'categories': ['2010', '2015', '2020', '2025'],
  'series': [('Elementary', [4, 9, 22, 30]), ('Junior high', [9, 25, 55, 66]), ('High school', [12, 33, 65, 71])],
  'source': 'Source: Westmoor Regional Education Survey（架空の調査・数値はすべて架空）',
 },
 'lines': 9,
 'questions': [
  {'label': '(1)', 'type': 'mc', 'points': 5, 'kind': '主題',
   'stem': 'What is the main topic of the passage?',
   'choices': [('(a)', 'How the use of learning videos by students has grown and what it may mean'), ('(b)', 'Why teachers in Westmoor stopped using textbooks'), ('(c)', 'How elementary schools banned screens for young children'), ('(d)', 'Why math has become the most difficult subject for students')],
   'answer': '(a)', 'expl': '第1段落で学習動画の広がりを示し，第2段落で数値の変化，第3段落で先生たちの賛否，第4段落で伸びの鈍化を述べている。全体をまとめるのは (a)。(b)(c) は本文にない，(d) は第1段落の例にすぎない。'},
  {'label': '(2)', 'type': 'mc', 'points': 5, 'kind': '空所補充（語彙）',
   'stem': 'Choose the word that should go in blank (i).',
   'choices': [('(a)', 'set'), ('(b)', 'lose'), ('(c)', 'forget'), ('(d)', 'remove')], 'cols': 4,
   'answer': '(a)', 'expl': 'set limits on ~ で「〜に制限を設ける」。小学生の割合が低いままである理由として「多くの家庭が画面の前で過ごす時間に制限を設けている」が合う。(d) remove（取り除く）では逆の意味になる。'},
  {'label': '(3)', 'type': 'write', 'points': 20, 'kind': '英語での記述（約60語）',
   'stem': 'Using the passage and Figure 1, predict how the share of high school students who watch learning videos will change between 2025 and 2030. Give reasons for your prediction in English. (About 60 words)',
   'criteria': [
    ('予測（増える・ほぼ横ばい・減る など）がはっきり書かれている', 4),
    ('本文または図の根拠（2020→2025 の伸びは6ポイントだけ／多くの生徒がすでに使っている／学校の録画授業 など）を示している', 8),
    ('理由と予測が論理的につながっている', 4),
    ('語彙・文法が正確で，約60語（目安 45〜75語）で書けている', 4),
   ],
   'models': [
    ('ほぼ横ばいと予測',
     "I think the share will increase only a little and stay at around 72 or 73 percent by 2030. Between 2020 and 2025, it rose by just six points, which suggests that most students who want to use videos already do so. Also, schools now offer their own recorded lessons, and students may count them as class work instead."),
    ('減ると予測',
     "I predict that the share will fall slightly by 2030. The growth has already slowed down, and schools are making more recorded lessons of their own. Students may watch these lessons instead of other learning videos and not count them as such. In addition, some teachers worry that watching is not understanding, so they may encourage students to solve problems alone."),
   ],
   'expl': '本文第4段落の「伸びの鈍化」とその2つの理由をそのまま根拠に使うのが確実。図の数値（65→71）を1つ入れると説得力が増す。「増え続ける」と予測してもよいが，その場合も鈍化をふまえ「ゆっくり増える」などと書き，本文と矛盾しないようにする。'},
 ],
 'facts': [
  'どの学校段階でも，2010年から2025年まで割合は増え続けている。',
  '高校生は 12% → 71% と最も高いが，2020→2025 の伸びは6ポイントで，それ以前（21・32ポイント）より小さい。',
  '中学生も 9% → 66% と高校生に近い伸び方をしている。',
  '小学生は 4% → 30% で，2025年でも中高生の半分以下にとどまる。',
 ],
 'translation': [
  '少し前まで，数学の問題がわからない生徒には2つの選択肢しかなかった。翌日先生に聞くか，答えが浮かぶまで教科書をにらみ続けるかだ。今日では，多くの生徒が，同じ種類の問題を誰かが一歩ずつ説明する短い動画をただ検索する。架空の地域ウェストムーアで5年ごとに行われている調査は，この習慣がどれほど速く広まったかを示している（図1）。',
  '2010年には，どの段階でも，週に1回以上学習動画を見ると答えた生徒はわずかだった。2025年までに，状況はすっかり変わった。高校生の間では割合が12%から71%に上がり，中学生も同様の上昇を見せた。小学生も動画を見ることが増えたが，その割合は年上の生徒よりはっきり低いままだった。一因は，幼い子どもが画面の前で過ごせる時間に，多くの家庭が制限を設けていることである。',
  'これが何を意味するかについて，先生たちの意見は分かれている。この変化を歓迎する先生は，生徒が動画を止めたり，難しい部分を見直したり，自分に合った速さで学んだりできることを指摘する。一方で，生徒が「見ること」を「理解すること」と取り違えるのではないかと心配する先生もいる。「人の説明についていくのは簡単に感じます」とある先生は言う。「でも本当に試されるのは，次の問題を自分ひとりで解けるかどうかです」。',
  'ウェストムーアの研究者たちは，高校生については2020年以降に伸びが鈍ったことにも気づいた。2020年から2025年の間に，割合はわずか6ポイントしか上がらず，それ以前の期間のずっと大きな伸びとは対照的だった。考えられる理由の1つは，動画を使いたい生徒のほとんどがすでに使い始めていたことだ。もう1つは，学校が独自の録画授業を提供し始め，生徒によってはそれを「学習動画」ではなく授業の一部として数えたことである。',
 ],
 'vocab': [('stare at', '〜をじっと見つめる'), ('step by step', '一歩ずつ'), ('carry out', '実施する'), ('share', '割合'), ('figure', '数値'), ('set limits on', '〜に制限を設ける'), ('be divided', '意見が分かれる'), ('welcome', '歓迎する'), ('pause', '一時停止する'), ('slow down', '鈍る'), ('count A as B', 'AをBとみなす')],
}
