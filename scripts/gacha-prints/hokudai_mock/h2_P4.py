# -*- coding: utf-8 -*-
# 第2回 大問4 会話文と要約（書き下ろし）。[[n]] は要約の空所。語群は I・O を使わない。人物は架空。
LEAD = ('Read the conversation [I] between two university students, Nanami and Riku, which ends with a phone call to their classmate Kenta, '
        'and then the summary of it [II]. The summary has 12 blanks. Fill each blank with the most suitable word from the box; '
        'no word may be used more than once. Mark your answers by giving the letter of each chosen word.')

LINES = [
 ('Nanami', 'Riku, have you heard anything from Kenta? Our presentation for the economics seminar is next Thursday, and he still hasn’t sent me his part of the slides.'),
 ('Riku', 'Not a word since our meeting last week. I sent him a message on Monday asking how his research on local shopping streets was going, but he hasn’t even read it.'),
 ('Nanami', 'That’s strange. At the first meeting he seemed so enthusiastic, and the topic was his idea to begin with.'),
 ('Riku', 'I know. Honestly, I’m starting to get a little exasperated. I’ve already finished the section on population change, and you’ve almost completed the interviews with shop owners.'),
 ('Nanami', 'I have, but I can’t write the conclusion until I know what he’s found. His part is supposed to connect our two sections, so everything depends on it.'),
 ('Riku', 'Should we just tell Professor Hayashi? She said at the beginning of term that we should report any problems with group work as early as possible.'),
 ('Nanami', 'Maybe, but I’d rather not go to her straight away. It might make Kenta feel as if we’re trying to get him into trouble, and we still have to work with him until the semester ends.'),
 ('Riku', 'That’s a valid concern. But we can’t simply wait and hope he turns up on Thursday with everything ready.'),
 ('Nanami', 'No, we can’t. What if we call him instead of sending another message? Texts are easy to overlook, but it’s much harder to avoid a phone call from friends.'),
 ('Riku', 'Good point. Actually, I remember he mentioned a few weeks ago that his grandmother had been taken to hospital. Maybe something serious has happened at home.'),
 ('Nanami', 'Oh, I didn’t know that. If so, we should be more understanding. He might be too worried, or too embarrassed, to tell us he’s fallen behind.'),
 ('Riku', 'Exactly. Let’s offer to help rather than grumble. If he gives us his notes, we could turn them into slides ourselves.'),
 ('Nanami', 'That would mean extra work for us, though, and the deadline is already close. I’m a bit wary that we’d be encouraging him to rely on others instead of doing his share.'),
 ('Riku', 'I see your point. But the presentation counts for thirty percent of our final mark, and that applies to all three of us, not just Kenta.'),
 ('Nanami', 'True. Perhaps we could divide his part into more manageable tasks, so that he only has to handle the analysis while we take care of the design.'),
 ('Riku', 'That sounds like a sensible compromise. And if he still hasn’t replied by Saturday, then we’ll explain the situation to Professor Hayashi. At least we’ll know we tried.'),
 ('Nanami', 'Agreed. Should I call him now? I’ve got about fifteen minutes before my next lecture starts.'),
 ('Riku', 'Go ahead. Put it on speaker so that I can take part as well.'),
 ('Kenta', 'Hello? Nanami? I’m so sorry. I’ve been meaning to get back to you both all week, but I kept procrastinating.'),
 ('Nanami', 'Don’t worry about that. We just wanted to check that you’re all right. Riku’s here with me too.'),
 ('Kenta', 'Thanks. My grandmother underwent surgery, and I’ve been visiting the hospital almost every day. I’ve collected most of the data, but I haven’t had time to analyze it, and I felt terrible about letting you both down.'),
 ('Riku', 'You haven’t let us down at all. Send us whatever you have, and we’ll split the remaining work between us. You can concentrate on the analysis whenever you find time.'),
 ('Kenta', 'That’s incredibly considerate of you. I’ll send everything tonight, and I promise I’ll finish the analysis by Sunday evening.'),
]

SUMMARY = [
 'Nanami and Riku are [[1]] because Kenta, the third member of their group, has not yet sent his part of a presentation that is due next Thursday. Riku says that Kenta has not even opened the message he sent on Monday. Nanami finds this puzzling, since Kenta had seemed extremely [[2]] at their first meeting and had proposed the topic himself. Both of them have already put a considerable amount of effort into the project, so the delay is particularly frustrating.',
 'Riku admits that he is becoming [[3]], as he has already completed his own section. Nanami explains that she cannot write the conclusion, because Kenta’s section is meant to [[4]] the other two parts. Riku suggests reporting the problem to Professor Hayashi, who had asked students to do so early. Nanami, however, prefers not to [[5]] to the professor immediately, because Kenta might feel that his partners want to get him into trouble.',
 'Nanami proposes telephoning Kenta, since a call is harder to [[6]] than a text message. Riku also suggests that, if Kenta hands over his notes, Nanami and he could turn the notes into slides on Kenta’s behalf. Riku then recalls that Kenta’s grandmother had been admitted to hospital, and both agree that they should be more [[7]] toward him. Although Nanami worries that doing extra work might [[8]] Kenta for neglecting his share, Riku reminds her that the presentation affects the [[9]] of all three members.',
 'They decide to divide Kenta’s part into smaller tasks and to inform the professor only if he fails to [[10]] by Saturday. When Nanami calls him, Kenta apologizes and explains that he has been visiting his grandmother, who has undergone an operation. He says he feels [[11]] about disappointing them. Riku reassures him that he and Nanami will share the remaining tasks, so that Kenta can focus on the analysis whenever he has time, and Kenta promises to send his data that evening and to [[12]] the analysis by Sunday.',
]

OPTIONS = [('A', 'absent'), ('B', 'borrow'), ('C', 'careless'), ('D', 'complain'), ('E', 'complete'), ('F', 'doubt'), ('G', 'eager'),
           ('H', 'fortunately'), ('J', 'grades'), ('K', 'guilty'), ('L', 'hesitate'), ('M', 'ignore'), ('N', 'irritated'), ('P', 'link'),
           ('Q', 'praise'), ('R', 'respond'), ('S', 'reward'), ('T', 'salary'), ('U', 'sympathetic'), ('V', 'weekly'), ('W', 'worried')]

ANSWERS = {1: 'W', 2: 'G', 3: 'N', 4: 'P', 5: 'D', 6: 'M', 7: 'U', 8: 'S', 9: 'J', 10: 'R', 11: 'K', 12: 'E'}

WHY = {
 1: 'are worried「心配している」。ケンタから担当部分が届かず，発表が来週に迫っている状況。be 動詞の後なので形容詞が入る。',
 2: 'seemed extremely eager「とても熱心に見えた」。会話の “he seemed so enthusiastic” の言い換え。',
 3: 'is becoming irritated「いらいらしてきている」。会話の “I’m starting to get a little exasperated” の言い換え。',
 4: 'is meant to link A「Aをつなぐことになっている」。会話の “His part is supposed to connect our two sections” の connect を link で言い換えている。to の後なので動詞の原形。',
 5: 'complain to 人「人に苦情を言う・訴える」。会話の “I’d rather not go to her straight away” に対応。prefers not to の後なので動詞の原形。',
 6: 'harder to ignore「無視しにくい」。会話の “Texts are easy to overlook, but it’s much harder to avoid a phone call” に対応。',
 7: 'be more sympathetic toward 人「人にもっと思いやりをもつ」。会話の “we should be more understanding” の言い換え。',
 8: 'reward A for doing「Aが〜したことに報いる」。会話の “we’d be encouraging him to rely on others instead of doing his share” を「分担をなまけたことに報いる（ほうびを与える）ことになる」と言い換えている。',
 9: 'the grades of all three members「3人全員の成績」。会話の “the presentation counts for thirty percent of our final mark” に対応。',
 10: 'fails to respond「返事をしない」。会話の “if he still hasn’t replied by Saturday” の言い換え。',
 11: 'feels guilty about doing「〜して申し訳なく思う」。会話の “I felt terrible about letting you both down” の言い換え。',
 12: 'complete the analysis「分析を仕上げる」。会話の “I’ll finish the analysis by Sunday evening” の finish を complete で言い換えている。',
}

UNUSED = ('使わない語：absent（不在の）・borrow（借りる）・careless（不注意な）・doubt（疑う）・fortunately（幸運にも）・hesitate（ためらう）・'
          'praise（ほめる）・salary（給料）・weekly（毎週の）。たとえば空所(3)に careless を入れると文法上は成り立つが，'
          '会話の “I’m starting to get a little exasperated” と合わない。空所(8)に praise を入れると「ほめる」となり，分担をなまけたことを心配する文脈と合わない。')

TRANSLATION = [
 'リク，ケンタから何か連絡あった？　経済学ゼミの発表は来週の木曜日なのに，まだ担当のスライドを送ってきてくれないの。',
 '先週の打ち合わせからひと言もないよ。月曜日に，地元の商店街についての調べものはどうなっているかってメッセージを送ったんだけど，既読にすらならない。',
 'それは変だね。最初の打ち合わせではすごく乗り気に見えたし，もともとこのテーマは彼の発案だったのに。',
 'そうなんだよ。正直，ちょっといら立ってきた。僕はもう人口の変化の部分を終えたし，君も商店主へのインタビューをほぼ終えているよね。',
 '終えてはいるけど，彼が何を見つけたかわからないと結論が書けないの。彼の部分は私たち2人の部分をつなぐことになっているから，全部がそれにかかっているのよ。',
 '林先生に言ってしまおうか？　学期の始めに，グループ作業で問題があればできるだけ早く報告するようにって言っていたよね。',
 'そうかもしれないけど，すぐに先生のところへ行くのは気が進まないな。ケンタが，私たちが彼を困らせようとしているように感じるかもしれないし，学期が終わるまでまだ一緒に作業しなきゃいけないんだから。',
 'それはもっともな心配だね。でも，木曜日に彼が全部そろえて現れるのを，ただ待って期待しているわけにもいかないよ。',
 'そうね，それはできない。メッセージをもう一度送る代わりに電話してみたらどうかな？　メッセージは見落としやすいけど，友だちからの電話を避けるのはずっと難しいでしょ。',
 'いい考えだね。そういえば，何週間か前に，おばあさんが病院に運ばれたって言っていたのを思い出した。家で何か深刻なことが起きたのかもしれない。',
 'えっ，知らなかった。そうだとしたら，私たちはもっと理解を示すべきだね。遅れていることを言い出せないほど心配しているか，恥ずかしく思っているのかもしれない。',
 'そのとおり。ぶつぶつ言うより，手伝いを申し出よう。メモをくれれば，僕たちでスライドにできるよ。',
 'でもそうすると私たちの仕事が増えるし，締め切りはもうすぐよ。自分の分担をこなさずにほかの人に頼るよう，彼を仕向けることにならないか，少し用心したいの。',
 '言いたいことはわかるよ。でも発表は最終成績の30パーセントを占めるし，それはケンタだけじゃなく僕たち3人全員に当てはまるんだ。',
 'そうだね。彼の部分をもっと扱いやすい作業に分けて，彼には分析だけを担当してもらい，デザインは私たちが引き受けるのはどうかな。',
 'それは賢い歩み寄りだね。それでも土曜日までに返事がなければ，林先生に事情を説明しよう。少なくとも努力はしたとわかるから。',
 '賛成。今電話しようか？　次の講義が始まるまで15分くらいあるから。',
 'どうぞ。僕も話に参加できるように，スピーカーにしてくれる？',
 'もしもし，ナナミ？　本当にごめん。1週間ずっと2人に連絡しなきゃと思っていたんだけど，ぐずぐず先延ばしにしてしまって。',
 'それは気にしないで。ただ，大丈夫か確かめたかっただけなの。リクも一緒にいるよ。',
 'ありがとう。祖母が手術を受けて，ほとんど毎日病院に通っているんだ。データはほとんど集めたんだけど，分析する時間がなくて，2人をがっかりさせてしまって本当に申し訳なく思っていたんだ。',
 'がっかりなんて全然していないよ。持っているものを何でも送ってくれれば，残りの作業は僕たちで分けるから。君は時間ができたときに分析に集中すればいいよ。',
 '本当に思いやりがあるね，ありがとう。今夜全部送るよ。それと，日曜日の夜までに必ず分析を仕上げるね。',
]

SUMMARY_TRANSLATION = [
 'ナナミとリクは，グループの3人目のメンバーであるケンタが，来週の木曜日が期限の発表の担当部分をまだ送ってこないので(1)心配している。リクは，月曜日に送ったメッセージをケンタが開いてさえいないと言う。ケンタは最初の打ち合わせではとても(2)熱心そうに見え，テーマも自分で提案していたので，ナナミはこれを不可解に思う。2人ともすでにかなりの労力をこの課題に注いでいるので，この遅れはとりわけもどかしい。',
 'リクは，自分の担当部分をすでに終えているので(3)いらいらしてきていると認める。ナナミは，ケンタの部分がほかの2つの部分を(4)つなぐことになっているので，結論が書けないと説明する。リクは，早めに報告するよう学生に求めていた林先生に問題を伝えることを提案する。しかしナナミは，ケンタが，仲間が自分を困らせようとしていると感じるかもしれないので，すぐに先生に(5)訴えるのは避けたいと考える。',
 'ナナミは，電話はメッセージより(6)無視しにくいので，ケンタに電話することを提案する。リクはまた，ケンタがメモを渡してくれれば，2人で代わりにスライドにできると提案する。リクはそこで，ケンタの祖母が入院していたことを思い出し，2人は彼にもっと(7)思いやりをもつべきだという点で意見が一致する。ナナミは，余分な作業をすれば分担をなまけたケンタに(8)ほうびを与えることになるのではと心配するが，リクは，発表が3人全員の(9)成績に影響することを彼女に思い出させる。',
 '2人は，ケンタの部分を小さな作業に分け，土曜日までに彼から(10)返事がない場合にだけ先生に知らせることに決める。ナナミが電話すると，ケンタは謝り，手術を受けた祖母を見舞いに通っていたと説明する。彼は2人をがっかりさせて(11)申し訳なく思っていると言う。リクは，残りの作業は自分とナナミで分担するので，ケンタは時間ができたときに分析に集中すればよいと言って彼を安心させ，ケンタはその晩にデータを送り，日曜日までに分析を(12)仕上げると約束する。',
]

VOCAB = [('seminar', 'ゼミ'), ('enthusiastic', '乗り気な・熱心な'), ('to begin with', 'もともと・そもそも'), ('annoyed', 'いらいらした'),
         ('be supposed to do', '〜することになっている'), ('straight away', 'すぐに'), ('get 人 into trouble', '人を困った立場に追い込む'), ('overlook', '見落とす'), ('exasperated', 'いら立った'), ('procrastinate', 'ぐずぐず先延ばしにする'), ('wary', '用心している'), ('compromise', '歩み寄り・妥協案'),
         ('fall behind', '遅れる'), ('do one’s share', '自分の分担を果たす'), ('count for ～', '（割合）を占める'), ('put off', '先延ばしにする'),
         ('let 人 down', '人をがっかりさせる'), ('undergo', '（手術などを）受ける'), ('reassure', '安心させる'), ('neglect', 'おろそかにする')]

PART = {'lead': LEAD, 'lines': LINES, 'summary': SUMMARY, 'options': OPTIONS, 'answers': ANSWERS, 'why': WHY, 'unused': UNUSED,
        'translation': TRANSLATION, 'summary_translation': SUMMARY_TRANSLATION, 'vocab': VOCAB, 'notes': []}
