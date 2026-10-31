# -*- coding: utf-8 -*-
# 第3回 Ⅲ 和文英訳・Ⅳ 自由英作文・Ⅴ ディクテーション（すべて書き下ろし）
III = {
 'points': 20,
 'lead': '次の日本文の下線部(A)・(B)を英語に直しなさい。',
 'japanese': [
  '教育実習で中学校の教壇に立ったとき，私は授業の準備に何時間もかけた。説明の順番を考え，例文を選び，生徒がつまずきそうな所を予想した。{uA|それでも実際の授業では，予想もしなかった質問が次々に出てきて，準備した計画どおりに進んだのは最初の10分だけだった。}',
  'その日の放課後，指導教員の先生は私にこう言った。「計画どおりに進まなかったのは，生徒が本気で考えていた証拠ですよ。」{uB|うまくいかなかった授業から学べることの方が，うまくいった授業から学べることよりも多いのだと，私はそのとき初めて気づいた。}',
 ],
 'items': [
  {'label': 'A', 'lines': 5,
   'src': 'それでも実際の授業では，予想もしなかった質問が次々に出てきて，準備した計画どおりに進んだのは最初の10分だけだった。',
   'answer': 'Even so, in the actual lesson, the students asked one unexpected question after another, and only the first ten minutes went according to the plan I had prepared.',
   'alts': ['However, when I actually taught the class, questions I had never imagined came up one after another, and the lesson followed my plan for only the first ten minutes.'],
   'points_ja': ['「それでも」は Even so / However / Still。', '「予想もしなかった質問」は unexpected questions / questions I had never imagined（過去完了で「それまでに」想像していなかった）。', '「次々に」は one after another。one unexpected question after another の語順に注意。', '「計画どおりに進んだのは最初の10分だけ」は only the first ten minutes went according to the plan / the lesson followed my plan for only the first ten minutes。'],
   'criteria': [('「それでも」と「実際の授業では」の文のつなぎ', 2), ('「予想もしなかった質問が次々に出てきた」の表現（one after another など）', 3), ('「計画どおりに進んだのは最初の10分だけ」の only の位置と表現', 3), ('「準備した計画」の関係詞・時制（過去完了）', 2)]},
  {'label': 'B', 'lines': 4,
   'src': 'うまくいかなかった授業から学べることの方が，うまくいった授業から学べることよりも多いのだと，私はそのとき初めて気づいた。',
   'answer': 'It was then that I realized for the first time that we can learn more from lessons that do not go well than from lessons that do.',
   'alts': ['At that moment, I understood for the first time that a lesson that fails teaches us more than one that succeeds.'],
   'points_ja': ['「そのとき初めて気づいた」は It was then that I realized for the first time … / Only then did I realize … / At that moment, I first realized …。', '「〜から学べることの方が…から学べることより多い」は we can learn more from A than from B と比較の形でそろえる。', '2つ目の lessons that do（＝go well）のように，繰り返しを do で受けると英語らしい。', '「うまくいかない授業」は lessons that do not go well / a lesson that fails。'],
   'criteria': [('「そのとき初めて気づいた」の表現（強調構文・倒置などを含む）', 3), ('比較 learn more from A than from B の形が正しい', 3), ('「うまくいく／いかない授業」の関係詞・語法', 2), ('時制・冠詞・数の正確さ', 2)]},
 ],
}

IV = {
 'points': 15,
 'lead': '次のテーマについて，あなたの意見を 200 語程度の英語で書きなさい。解答用紙の語数欄に，書いた語数を記入すること。',
 'topic': '中学校・高校の部活動について，教員の負担を減らすために，指導を地域のクラブや外部の指導者に任せる「地域移行」が進められています。**学校の部活動の指導を，教員ではなく地域の指導者が担うことに，あなたは賛成ですか，反対ですか。**理由を挙げて述べなさい。',
 'lines': 21,
 'criteria': [('立場（賛成・反対）が冒頭で明確で，結論まで一貫している', 3), ('理由が 2 つ程度あり，それぞれに具体例・説明がある', 5), ('段落の構成（導入→理由→結論）とつなぎの語', 3), ('文法・語彙の正確さ，語数（200 語程度：おおむね 180〜220 語）', 4)],
 'tips': [
  '「教員の負担」と「生徒にとっての良し悪し」の両方の観点がある。どちらを中心に論じるかを決め，理由を 2 つに絞る。',
  '「部活動」は club activities / school clubs，「地域の指導者」は local coaches / community instructors，「教員の負担」は teachers’ workload。',
  '賛成なら「専門的な指導」「教員が授業準備に時間を使える」，反対なら「費用・送迎の負担」「教員と生徒の関係」などが書きやすい。',
  '教員志望の受験生として，自分の部活動の経験を具体例に使うと説得力が増す。',
 ],
 'models': [
  ('賛成：専門的な指導と教員の授業準備', '導入（賛成）→理由1 専門的な指導→理由2 教員が授業に集中できる→結論',
   'I agree that local coaches should take over the coaching of school club activities. I believe this change will benefit both students and teachers.\nFirst, students can receive better coaching from specialists. In my junior high school, our soccer club was led by a math teacher who had never played soccer. He was very kind, but he could not teach us skills or tactics, and we often practiced the same drills without knowing why. A coach from a local club, on the other hand, would know how to train young players safely and effectively.\nSecond, teachers will have more time to prepare lessons and to care for their students. Many teachers now spend their evenings and weekends at club practice and matches. If they no longer have to do this, they can use the time to plan better lessons and to talk with students who need help. In the long run, this will improve the quality of education.\nOf course, schools and local clubs must work together so that the cost does not become a burden for families. However, I believe the benefits are greater than the problems. For these reasons, I support moving club coaching to local instructors.'),
  ('反対：費用の格差と教員と生徒の関係', '導入（反対）→理由1 家庭の負担と格差→理由2 教員と生徒の関係→結論',
   'I disagree with the idea of leaving the coaching of school clubs to local instructors. Although I understand that teachers are very busy, I believe this change could cause new problems for students.\nFirst, it may create gaps between students. Local clubs often charge fees, and practice may be held far from school. Students whose families cannot pay or cannot drive them to practice might have to give up activities they love. School clubs, by contrast, are open to every student at little cost, which is one of their greatest strengths.\nSecond, club activities give teachers a chance to know their students outside the classroom. When I was in the brass band, our adviser noticed that I seemed worried and talked with me about my plans for high school. I might not have shared my problems with an outside coach who saw me only twice a week.\nTo reduce teachers’ workload, schools could limit practice days or ask several teachers to share one club. However, I believe teachers should remain involved in club activities. For these reasons, I am against handing them over completely to local instructors.'),
 ],
}

V = {
 'points': 10,
 'lead': 'これから読まれる英文を聞き取り，解答用紙に書きなさい。英文は 3 回読まれる。1 回目はふつうの速さで，2 回目は区切りごとに間をとって，3 回目は再びふつうの速さで読まれる。（音声はついていない。解答・解説編の最後にある「読み上げ原稿」を，ほかの人に読んでもらうこと。）',
 'lines': 6,
 'script': 'Some elementary schools have started a reading program in which older students read picture books to first graders once a week. The younger children enjoy the stories, but teachers say that the older students may benefit even more. To read aloud well, they must practice in advance, think about how the listeners will feel, and answer questions they did not expect.',
 'script_slashed': 'Some elementary schools have started / a reading program / in which older students read picture books / to first graders / once a week. / The younger children enjoy the stories, / but teachers say / that the older students / may benefit even more. / To read aloud well, / they must practice in advance, / think about how the listeners will feel, / and answer questions / they did not expect.',
 'criteria': [('区切りごとに語が正しく書けている（14 区切り×約 0.43 点，合計 6 点）', 6), ('冠詞・複数形の s・三単現の s・時制が正確（誤り 1 か所ごとに 0.5 点減，最大 2 点）', 2), ('つづりの正確さ（誤り 1 か所ごとに 0.5 点減，最大 2 点）', 2)],
 'tips': [
  'have started（現在完了）の have，in which（前置詞＋関係代名詞）の in を落とさない。',
  'first graders（1年生）は複数形。once a week の a も聞き落としやすい。',
  'benefit even more の even は比較級を強める語。',
  'practice in advance / think about … / answer … は must のあとに並ぶ 3 つの動詞（原形）。3 つ目の前の and に注意。',
 ],
}
