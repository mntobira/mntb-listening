# -*- coding: utf-8 -*-
# 第2回 Ⅲ 和文英訳・Ⅳ 自由英作文・Ⅴ ディクテーション（すべて書き下ろし）
III = {
 'points': 20,
 'lead': '次の日本文の下線部(A)・(B)を英語に直しなさい。',
 'japanese': [
  '祖母の家の近くにある小さな図書館は，私にとって特別な場所だった。夏休みになると，私は毎日のようにそこへ通い，気になった本を片っ端から読んだ。{uA|今思えば，あの頃に読んだ本の内容はほとんど覚えていないが，本を読む楽しさを知ったことは，その後の私の人生を大きく変えた。}',
  'その図書館は数年前に閉館したと聞いた。利用者が減ったことが理由だという。{uB|子どもたちが気軽に本と出会える場所を，どうすれば地域に残していけるのか，考えずにはいられない。}',
 ],
 'items': [
  {'label': 'A', 'lines': 5,
   'src': '今思えば，あの頃に読んだ本の内容はほとんど覚えていないが，本を読む楽しさを知ったことは，その後の私の人生を大きく変えた。',
   'answer': 'Looking back, I hardly remember what the books I read in those days were about, but discovering the joy of reading changed the rest of my life greatly.',
   'alts': ['Now that I think about it, I can remember almost nothing of the books I read at that time, but learning how enjoyable reading can be had a great influence on my life after that.'],
   'points_ja': ['「今思えば」は Looking back, / Now that I think about it, / When I look back now,。', '「ほとんど覚えていない」は hardly remember / remember almost nothing of。hardly は否定の意味を含むので not と重ねない。', '「本の内容」は what the books were about と間接疑問にすると自然（the contents of the books でも可）。', '「〜を知ったことは」は動名詞の主語 discovering / learning ... で書く。「人生を大きく変えた」は changed my life greatly / had a great influence on my life。'],
   'criteria': [('「今思えば」と，対比（〜が，…）の骨組み', 2), ('「ほとんど覚えていない」の否定の表現が正しい', 2), ('「あの頃に読んだ本の内容」の名詞句・関係詞', 3), ('「本を読む楽しさを知ったこと」を主語にした文が正しい', 3)]},
  {'label': 'B', 'lines': 4,
   'src': '子どもたちが気軽に本と出会える場所を，どうすれば地域に残していけるのか，考えずにはいられない。',
   'answer': 'I cannot help wondering how we can keep places in our communities where children can easily come across books.',
   'alts': ['I can’t stop thinking about what we should do to preserve places in our neighborhoods where children can casually encounter books.'],
   'points_ja': ['「〜せずにはいられない」は cannot help doing / can’t stop doing。cannot help but do でも可。', '「どうすれば〜できるのか」は how we can … / what we should do to … の間接疑問（語順は 主語＋動詞）。', '「子どもたちが…できる場所」は places where children can … と関係副詞 where で後ろから説明する。', '「気軽に本と出会う」は easily come across books / casually encounter books。'],
   'criteria': [('「考えずにはいられない」の表現が正しい', 3), ('間接疑問（how we can …）の語順が正しい', 3), ('「子どもたちが…できる場所」を関係詞で正しく表している', 2), ('「地域に残す」「気軽に本と出会う」の語彙・語法', 2)]},
 ],
}

IV = {
 'points': 15,
 'lead': '次のテーマについて，あなたの意見を 200 語程度の英語で書きなさい。解答用紙の語数欄に，書いた語数を記入すること。',
 'topic': '小学校では，1 人 1 台のタブレット端末が配られ，授業や家庭学習で使われるようになりました。一方で，**小学生のうちは，ノートと鉛筆で手を動かして学ぶことを中心にすべきだ**という意見もあります。この意見について，あなたは賛成ですか，反対ですか。理由を挙げて述べなさい。',
 'lines': 21,
 'criteria': [('立場（賛成・反対）が冒頭で明確で，結論まで一貫している', 3), ('理由が 2 つ程度あり，それぞれに具体例・説明がある', 5), ('段落の構成（導入→理由→結論）とつなぎの語', 3), ('文法・語彙の正確さ，語数（200 語程度：おおむね 180〜220 語）', 4)],
 'tips': [
  '「タブレットか紙か」の二者択一に見えるが，求められているのは「小学生のうちは紙を中心にすべきか」への賛否。立場を冒頭で明確にする。',
  '理由は「記憶・理解」「集中」「調べる力」「書く力」などから 2 つに絞り，授業や家庭学習の具体的な場面で裏づける。',
  '「タブレット端末」は tablet (computer)，「1 人 1 台」は one tablet for each student，「手で書く」は write by hand。',
  '教員志望らしく，「自分が教えるならどうするか」を結論で一言添えると締まりがよい。',
 ],
 'models': [
  ('賛成：手で書くことが理解と記憶を深める', '導入（賛成）→理由1 記憶・理解→理由2 集中→結論',
   'I agree that elementary school students should mainly learn with notebooks and pencils. Tablets are useful tools, but I believe young children learn the basics better by writing by hand.\nFirst, writing by hand helps children remember and understand what they learn. When children practice writing a new kanji or work out a math problem step by step on paper, they must think about each line and each step. On a tablet, it is easy to tap an answer without thinking. I still remember the multiplication tables because I wrote them out again and again in a notebook.\nSecond, paper helps children concentrate. A tablet can show games, videos and messages, and young children find it hard to ignore them. With a notebook, there is nothing to distract them except the task in front of them.\nOf course, tablets are helpful for searching for information or sharing ideas with classmates. However, these skills can be added once children have built a strong foundation. If I become a teacher, I will use tablets as a supplement, not as the center of learning.'),
  ('反対：タブレットは学び方の幅を広げる', '導入（反対）→理由1 一人一人に合わせられる→理由2 将来必要な力→結論',
   'I disagree with the idea that elementary school students should mainly use notebooks and pencils. Although handwriting is still important, I believe tablets should play a central role in learning from an early age.\nFirst, tablets allow each child to learn at his or her own pace. With learning apps, a child who finds fractions difficult can practice easier problems and watch short explanations again and again, while a faster learner can move on to harder ones. With the same printed worksheet for everyone, this is much more difficult for one teacher to manage.\nSecond, children need digital skills for the future. They will use computers in high school, at university and at work. If they learn to search for information, check whether it is reliable and present their ideas with slides while they are young, these skills will come naturally to them later.\nOf course, children should still practice writing by hand, especially when they learn kanji. However, that does not mean paper should be the center of learning. For these reasons, I think tablets should be used actively in elementary school classrooms.'),
 ],
}

V = {
 'points': 10,
 'lead': 'これから読まれる英文を聞き取り，解答用紙に書きなさい。英文は 3 回読まれる。1 回目はふつうの速さで，2 回目は区切りごとに間をとって，3 回目は再びふつうの速さで読まれる。（音声はついていない。解答・解説編の最後にある「読み上げ原稿」を，ほかの人に読んでもらうこと。）',
 'lines': 6,
 'script': 'When children start school in a new country, they often understand far more than they can say. For the first few months, some of them hardly speak at all. Teachers sometimes worry about this silence, but researchers say that it is usually a normal stage. During this period, the children are listening carefully and preparing to use the new language when they feel ready.',
 'script_slashed': 'When children start school / in a new country, / they often understand far more / than they can say. / For the first few months, / some of them hardly speak at all. / Teachers sometimes worry / about this silence, / but researchers say / that it is usually a normal stage. / During this period, / the children are listening carefully / and preparing to use the new language / when they feel ready.',
 'criteria': [('区切りごとに語が正しく書けている（14 区切り×約 0.43 点，合計 6 点）', 6), ('冠詞・複数形の s・三単現の s・時制が正確（誤り 1 か所ごとに 0.5 点減，最大 2 点）', 2), ('つづりの正確さ（誤り 1 か所ごとに 0.5 点減，最大 2 点）', 2)],
 'tips': [
  'far more than（〜よりずっと多く）の far は比較級を強める語。聞き落としやすい。',
  'hardly speak at all（ほとんどまったく話さない）。hardly のあとに not は来ない。',
  'a normal stage の a，the new language の the など，冠詞を正確に。',
  'listening carefully and preparing to use は進行形の and でつながる 2 つの動詞。preparing の -ing を落とさない。',
 ],
}
