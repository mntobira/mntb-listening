# -*- coding: utf-8 -*-
# 第2回 Ⅲ 会話文（教授と学生2人「卒業要件としてのボランティア活動」）＋意見論述 60〜80語。{w1|…} 下線部(1)
LEAD = ('Professor Thornbury teaches a course on education and society. When a class finishes, she asks two students, Haruto and Leila, '
        'what they think about a plan being discussed at another university. Go through their conversation and then deal with tasks 1) and 2) that follow it.')

LINES = [
 ('Professor Thornbury', "Before you go, I'd like your reactions to something. A university I visited recently is considering a rule that every student must complete sixty hours of community volunteering before graduating. The idea has caused quite a stir among staff and students there, so I'm curious what you two make of it."),
 ('Haruto', "I think it's a great idea. When I was in high school, I helped out at a food bank for a few months, and it completely changed how I saw my own town. I met people I would never have spoken to otherwise. If it hadn't been a school project, though, I probably wouldn't have gone at all, so I think a little push can be useful."),
 ('Professor Thornbury', "That's a point supporters often make: people don't always know what they'll enjoy until they try it. They also argue that students benefit from practical experience. Employers frequently say they want graduates who can work in teams and communicate with many different people, and volunteering can help to {w1|cultivate} those abilities. Leila, you're frowning."),
 ('Leila', "Sorry, I'm not against volunteering at all. I just don't see how it can still be called volunteering if it's compulsory. The whole point is that you choose to give your time. If students are forced to do it, some will just turn up, sign the form and leave. I'm not sure that helps anyone, least of all the organizations that have to supervise them."),
 ('Professor Thornbury', "That's a fair concern. Some charities have said exactly that: they welcome help, but training reluctant volunteers takes staff time they can't always spare. Haruto, what would you say to that?"),
 ('Haruto', "Maybe the university could let students choose among various activities, so that each person finds something they actually care about. Someone who loves sports could coach children, and someone interested in the environment could help clean up a river. If people have a choice, they're more likely to take it seriously."),
 ('Leila', "Choice would help, but there's another problem. Many students already have part-time jobs to pay their rent and fees. I work three evenings a week at a restaurant. Sixty extra hours might not sound like much, but for some of us it would mean losing income or sleep. Students from wealthier families could easily find the time, so the rule would fall {w2|disproportionately} on those who are already struggling."),
 ('Professor Thornbury', "That's an important point about fairness. Some universities have tried to deal with it by counting certain kinds of paid work in the community, or by spreading the hours over four years. Others offer small grants to cover travel costs. The details make a big difference to who benefits and who pays."),
 ('Haruto', "Students who work never crossed my mind. I suppose a rule that looks fair on paper might not be fair in practice."),
 ('Leila', "Exactly. And I worry that it could turn something generous into just another box to tick on the way to a degree."),
 ('Professor Thornbury', "Then again, you could argue that many valuable things in education are compulsory. Nobody chooses to take every required course, and yet some of those courses turn out to be the ones students remember most. Requirements can open doors that people wouldn't have opened themselves. The question is whether volunteering is an activity that survives being required, or whether the requirement {w3|undermines} the very motivation it hopes to build."),
 ('Leila', "So it depends on how the rule is designed, not just on whether it exists."),
 ('Professor Thornbury', "Precisely. Rules are rarely good or bad in themselves; their effects depend on the details and on the people they apply to. That would make an excellent topic for your end-of-term essays, by the way. I'll put some readings on the course page, including a report from a university that has had a similar requirement for several years, and you can judge the {w4|outcome} for yourselves."),
]

Q1 = {'points': 8, 'stem': 'For each underlined expression (1)–(4), pick the option from (A)–(D) closest to its meaning in this conversation.',
 'items': [
  {'label': '1', 'word': 'cultivate', 'choices': ['hide', 'measure', 'develop', 'replace'], 'answer': 2,
   'reason': '雇用主が求める「チームで働く力・意思疎通の力」を，ボランティアが「育てる」助けになる，という文脈。develop が最も近い。'},
  {'label': '2', 'word': 'disproportionately', 'choices': ['more heavily than is fair', 'more slowly than expected', 'in a hidden way', 'in equal amounts'], 'answer': 0,
   'reason': '裕福な学生は時間を作れるが，働いている学生には大きな負担になる，という話。「不釣り合いに（偏って）重く」の意味で，(A) が最も近い。in equal amounts は逆。'},
  {'label': '3', 'word': 'undermines', 'choices': ['strengthens', 'explains', 'weakens', 'announces'], 'answer': 2,
   'reason': '義務にすることが，育てたいはずの意欲そのものを「損なう」のではないか，という問い。weakens が最も近い。strengthens は逆。'},
  {'label': '4', 'word': 'outcome', 'choices': ['cost', 'result', 'reason', 'rule'], 'answer': 1,
   'reason': '同様の要件を数年続けている大学の報告書を読み，その「結果」を自分で判断する，という文脈。result が最も近い。'}]}

Q2 = {'points': 32,
 'stem': 'Should universities require every student to do community volunteering before graduating? Give your opinion with two supporting reasons, using between 60 and 80 English words.',
 'criteria': [('賛成か反対かを冒頭で明確に示している', 4), ('理由1が具体的で，立場と論理的につながっている', 8),
              ('理由2が理由1と重ならず，具体的である', 8), ('会話の論点（意欲・公平さ・選択肢・経験の価値など）を自分の言葉で活かしている', 4),
              ('文法・語彙・つづりの正確さ', 6), ('60〜80語の範囲と，まとまりのある構成', 2)],
 'models': [
  ('反対', "In my view, universities should not make volunteering compulsory. First, volunteering is meaningful because people choose to do it. If students are forced to take part, many will simply do the minimum, and the organizations they join will waste time training them. Second, the rule would be unfair to students who must work part-time to pay for their studies. Instead, universities should encourage volunteering by offering credits or flexible schedules."),
  ('賛成', "I believe universities should require community volunteering. To begin with, many students never try volunteering because they are busy or shy, but once they start, they often discover activities they truly enjoy. In addition, working with people of different ages and backgrounds builds communication skills that are useful in any job. To keep the rule fair, universities should let students choose their activities and spread the hours over four years."),
 ],
 'tips': ['最初の一文で賛否をはっきり書く（In my view, … should not … / I believe …）。「場合による」だけで終わると立場が不明確になる。',
          '理由は First, … Second, … や To begin with, … In addition, … で二つに分ける。会話の論点（自発性・働く学生への不公平さ・経験の価値など）を自分の言葉で言い換えて使うとよい。',
          'compulsory（義務の），volunteer（動詞・名詞），community（地域社会）のつづりと品詞に注意。volunteer を形容詞のように使わない。',
          '反対の立場でも，最後に代案（単位を与える・時間割を柔軟にする）を一文添えると，議論がまとまって見える。語数は 60〜80 語に収める。']}

TRANSLATION = [
 '帰る前に，ちょっと意見を聞かせてほしいことがあります。最近訪れたある大学で，すべての学生に卒業までに60時間の地域ボランティアを義務づける規則が検討されています。この案は向こうの教職員や学生の間でかなりの騒ぎになっているので，あなたたち二人がどう思うか知りたいのです。',
 'すばらしい考えだと思います。高校生のとき，数か月フードバンクの手伝いをしたのですが，自分の町の見え方がすっかり変わりました。そうでなければ話すこともなかったような人たちに出会えたんです。でも，もし学校の課題でなかったら，たぶんまったく行かなかったと思います。だから，少し背中を押すことは役に立つと思うんです。',
 'それは賛成する人がよく挙げる点ですね。人は試してみるまで何を楽しめるのかわからないことがある，と。彼らはまた，学生が実践的な経験から得るものがあるとも主張します。雇用主は，チームで働けて，あらゆる人と意思疎通ができる卒業生がほしいとよく言いますし，ボランティアはそうした能力を育てる助けになりえます。レイラ，顔をしかめていますね。',
 'すみません，ボランティアにはまったく反対ではないんです。ただ，義務なのにまだボランティアと呼べるのかがわからなくて。肝心なのは，自分の時間を差し出すことを自分で選ぶという点ですよね。もし学生が無理やりやらされたら，顔を出して用紙にサインしてすぐ帰る人もいるでしょう。それが誰の役に立つのか疑問です。とりわけ，その学生たちを監督しなければならない団体のためにはならないと思います。',
 'もっともな懸念ですね。慈善団体の中にもまさにそう言っているところがあります。手伝いは歓迎するけれども，気の進まないボランティアを指導するには，いつも割けるとは限らない職員の時間がかかる，と。ハルト，それにはどう答えますか。',
 '大学が幅広い活動の中から学生に選ばせれば，一人ひとりが本当に関心のあることを見つけられるかもしれません。スポーツが大好きな人は子どもたちを指導できるし，環境に興味がある人は川の清掃を手伝えます。選べるなら，真剣に取り組む可能性が高くなると思います。',
 '選べるのは助けになりますが，別の問題もあります。多くの学生は家賃や学費を払うためにすでにアルバイトをしています。私も週に三晩レストランで働いています。60時間の追加はたいしたことがないように聞こえるかもしれませんが，私たちの中には収入か睡眠を削ることになる人もいます。裕福な家庭の学生なら簡単に時間を作れるので，この規則は，すでに苦労している学生に不釣り合いに重くのしかかることになるでしょう。',
 'それは公平さについての重要な指摘ですね。ある種の地域での有給の仕事を時間に数えたり，時間を4年間に分散させたりすることで，その問題に対処しようとしてきた大学もあります。交通費をまかなうための少額の補助金を出す大学もあります。細かい設計次第で，誰が得をし，誰が負担するのかが大きく変わるのです。',
 '働いている学生のことは考えていませんでした。書類の上では公平に見える規則も，実際には公平でないことがあるのかもしれませんね。',
 'そのとおりです。それに，気前のよい行いを，学位を取るまでにチェックを入れるだけの項目の一つに変えてしまうのではないかと心配なんです。',
 '一方で，教育における価値あるものの多くは義務である，と主張することもできます。必修の授業をすべて自分で選ぶ人はいませんが，それでも，そうした授業の中には学生が最もよく覚えているものになる授業もあります。要件は，人が自分では開けなかったであろう扉を開けることがあるのです。問題は，ボランティアが義務にされても損なわれない種類の活動なのか，それとも義務にすることが，育てようとしている意欲そのものを損なってしまうのか，という点です。',
 'では，規則があるかどうかだけではなく，規則がどう設計されるかによるということですね。',
 'まさにそのとおり。規則がそれ自体でよいとか悪いとかいうことはめったになく，その効果は細部と，規則が適用される人々によって決まります。ところで，それは期末レポートのとてもよいテーマになりますね。授業のページに読み物をいくつか載せておきます。数年前から同様の要件を設けている大学の報告書も含めておくので，その結果を自分たちで判断してみてください。',
]

VOCAB = [('cause a stir', '騒ぎを起こす'), ('make of 〜', '〜をどう思う'), ('compulsory', '義務の・必修の'), ('least of all', 'とりわけ〜ない'),
         ('supervise', '〜を監督する'), ('reluctant', '気の進まない'), ('spare', '（時間など）を割く'), ('fall on 〜', '（負担が）〜にかかる'),
         ('grant', '補助金'), ('on paper', '書類上は・理論上は'), ('box to tick', 'チェックを入れるだけの項目'), ('requirement', '要件'),
         ('motivation', '意欲・動機'), ('in themselves', 'それ自体で')]

P = {'lead': LEAD, 'lines': LINES, 'q1': Q1, 'q2': Q2, 'translation': TRANSLATION, 'vocab': VOCAB}
