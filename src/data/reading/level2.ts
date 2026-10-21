/** レベル2：標準（共通テスト・日東駒専・産近甲龍）。3段落・各55〜75語・段落ごとの問い＋全体の問い（日本語） */
import { p, q } from './types';

export const LEVEL2 = [
  p('r2-01', 2, 'Why We Forget Names', '名前を忘れるわけ', [
    `Most of us have had the embarrassing experience of meeting someone, hearing their name, and forgetting it within a minute. What is strange is that we usually remember other details about the person, such as their face or their job, much more easily. Psychologists have long wondered why names, of all things, should slip away so quickly.`,
    `One explanation is that a job gives the brain something to hold on to. If you learn that someone is a baker, you can picture bread, flour, and the smell of an oven. A name like "Baker," on the other hand, is just a sound with no image attached. Researchers call this the "Baker-baker paradox."`,
    `The lesson, then, is that a name becomes easier to remember once it is connected to a picture. If you meet a woman named Rose, imagine her holding a red flower. The stranger the image is, the longer it is likely to stay in your memory.`,
  ], [['of all things', 'よりによって'], ['hold on to ~', '〜にしがみつく・〜を手がかりにする'], ['on the other hand', '一方で'], ['the 比較級, the 比較級', '〜すればするほど…']], [
    q('r2-01-1', 1, 'detail', '第1段落で、筆者が「奇妙だ」と述べていることは何か。', [
      '名前はすぐ忘れるのに、顔や職業は覚えやすいこと', '人は初対面の相手の顔を忘れやすいこと', '名前を一度聞けば忘れないこと', '心理学者が名前に関心を持たないこと'],
      'What is strange is that ~「奇妙なのは〜ということだ」。顔や職業のほうがずっと覚えやすい。',
      `we usually remember other details about the person, such as their face or their job, much more easily`, '私たちはふつう、顔や職業など、その人についてのほかの細かいことのほうをずっと簡単に覚えている',
      'What is strange is that ~：関係代名詞 what が主語になる形。'),
    q('r2-01-2', 2, 'reason', '職業のほうが名前より覚えやすい理由として本文が挙げているものはどれか。', [
      '職業はイメージと結びつけやすいから', '職業は名前より短いから', '職業はくり返し聞くことが多いから', '名前は外国語であることが多いから'],
      '職業は「脳がつかまるもの」を与える。パン屋ならパンやオーブンの匂いを思い浮かべられるが、名前はただの音。',
      `a job gives the brain something to hold on to`, '職業は脳に、手がかりとしてつかまるものを与えてくれる',
      'on the other hand「一方」の前後で、職業と名前を対比している。'),
    q('r2-01-3', 3, 'paraphrase', '最後の文の内容と合うものはどれか。', [
      'イメージが奇妙であるほど長く記憶に残る', '普通のイメージのほうが覚えやすい', 'イメージはすぐに忘れてしまう', '奇妙なイメージは記憶を混乱させる'],
      '「the 比較級, the 比較級」＝「〜であればあるほど…」。奇妙なほど長く残る。',
      `The stranger the image is, the longer it is likely to stay in your memory.`, 'イメージが奇妙であればあるほど、記憶に長く残りやすい',
      'the 比較級 ..., the 比較級 ... は入試頻出。'),
    q('r2-01-4', 0, 'main', 'この文章の主旨として最も適切なものはどれか。', [
      '名前はイメージと結びつけると覚えやすくなる', '人の名前は覚えなくてもよい', '職業を聞くのは失礼である', '人は顔より名前をよく覚える'],
      '第3段落の The lesson, then, is that ~ がまとめ。「名前は絵と結びつけると覚えやすくなる」。',
      `a name becomes easier to remember once it is connected to a picture`, '名前は、いったん絵と結びつけられると覚えやすくなる',
      'once ~ は接続詞「いったん〜すると」。'),
  ]),

  p('r2-02', 2, 'The Four-Day Week', '週休3日制', [
    `In 2022, about seventy companies in Britain took part in a six-month experiment with a four-day working week. Employees worked around thirty-two hours instead of forty, but their pay remained exactly the same. Many managers expected that, with less time at work, their companies would inevitably produce less.`,
    `The results proved them wrong. In most companies, the amount of work done stayed about the same, and in some it actually increased. Workers took fewer sick days and reported feeling less stressed. With only four days available, people cut down on long meetings and unnecessary emails, and focused on what really mattered.`,
    `Not every business found the change easy, though. A restaurant, for example, could not simply close for an extra day without losing customers, and had to hire more staff. The experiment suggests that a shorter week works best where work is judged by results rather than by hours.`,
  ], [['take part in ~', '〜に参加する'], ['prove ~ wrong', '〜が間違っていると証明する'], ['cut down on ~', '〜を減らす'], ['A rather than B', 'BではなくむしろA']], [
    q('r2-02-1', 1, 'detail', '実験の条件として正しいものはどれか。', [
      '労働時間は約32時間に減ったが、給料は同じだった', '労働時間も給料も減った', '労働時間は同じで、給料が上がった', '週に5日、短い時間だけ働いた'],
      '「40時間ではなく約32時間働いたが、給料はまったく同じままだった」。',
      `Employees worked around thirty-two hours instead of forty, but their pay remained exactly the same.`, '従業員は40時間ではなく約32時間働いたが、給料はまったく同じままだった',
      'remain + 形容詞「〜のままである」。'),
    q('r2-02-2', 2, 'detail', '実験の結果として本文に述べられていないものはどれか。', [
      '会社の利益が2倍になった', '仕事の量はほぼ変わらなかった', '病気で休む日が減った', '長い会議や不要なメールが減った'],
      '「利益が2倍」はどこにも書かれていない。残りの3つは第2段落にある。NOT問題は選択肢を1つずつ本文と照らす。',
      `In most companies, the amount of work done stayed about the same, and in some it actually increased.`, 'ほとんどの会社では仕事の量はほぼ同じままで、いくつかの会社では実際に増えた',
      'The results proved them wrong.「結果は彼ら（経営者）が間違っていることを示した」＝無生物主語。'),
    q('r2-02-3', 3, 'inference', 'レストランの例が示していることはどれか。', [
      '週休3日制は、すべての業種で同じようにうまくいくわけではない', 'レストランは週休3日制で客が増えた', 'レストランでは働く人が減った', '飲食店は実験に参加しなかった'],
      'Not every business found the change easy「すべての会社が楽だと思ったわけではない」（部分否定）。その具体例がレストラン。',
      `Not every business found the change easy, though.`, 'もっとも、すべての会社がその変化を楽だと感じたわけではない',
      'Not every ~「すべての〜が…というわけではない」＝部分否定。'),
    q('r2-02-4', 0, 'main', '筆者の結論として最も適切なものはどれか。', [
      '働いた時間ではなく成果で評価される仕事に、短い週は向いている', 'すべての会社が週休3日制にすべきだ', '週休3日制は失敗だった', '長く働くほど成果が上がる'],
      '「短い週は、仕事が時間ではなく成果で判断される場所で最もうまくいく」。',
      `a shorter week works best where work is judged by results rather than by hours`, '短い週は、仕事が時間ではなく成果で判断されるところで最もうまくいく',
      'where ~ は「〜するところで」（接続詞的に使う関係副詞）。'),
  ]),

  p('r2-03', 2, 'Bees in the City', '都会のミツバチ', [
    `It may sound surprising, but some of the healthiest honeybees in Europe live not in the countryside but in the middle of large cities. In Paris, for instance, beehives can be found on the roofs of famous buildings, including the opera house. Beekeepers there often collect more honey than their colleagues in rural areas.`,
    `The main reason is that city gardens, parks, and balconies offer a wide variety of flowers that bloom at different times of the year. In the countryside, by contrast, many fields are used to grow a single crop and are often sprayed with chemicals that can harm insects.`,
    `Experts warn, however, that too many hives can create a new problem. Honeybees compete for food with wild bees, which are also important for plants. Adding more hives, they say, is less useful than planting more flowers.`,
  ], [['not A but B', 'AではなくB'], ['for instance', 'たとえば'], ['by contrast', '対照的に'], ['compete for ~', '〜を求めて争う']], [
    q('r2-03-1', 1, 'detail', '第1段落の内容と合うものはどれか。', [
      'パリの養蜂家は、田舎の養蜂家より多くのはちみつを集めることが多い', 'ヨーロッパの健康なミツバチはすべて田舎にいる', 'パリでは建物の屋上に巣箱を置くことが禁止されている', 'オペラ座ではミツバチを育てていない'],
      '「都市の養蜂家は田舎の同業者よりも多くのはちみつを集めることが多い」。not A but B「AではなくB」にも注意。',
      `Beekeepers there often collect more honey than their colleagues in rural areas.`, 'そこの養蜂家は、田舎の同業者よりも多くのはちみつを集めることが多い',
      'not in the countryside but in the middle of large cities：not A but B。'),
    q('r2-03-2', 2, 'reason', '都会のミツバチが元気な主な理由はどれか。', [
      '一年のちがう時期に咲くさまざまな花があるから', '都会のほうが気温が低いから', '都会には天敵がいないから', '人がえさを与えているから'],
      '「都会の庭・公園・ベランダは、一年のさまざまな時期に咲く多様な花を提供する」。田舎は単一作物と農薬。',
      `offer a wide variety of flowers that bloom at different times of the year`, '一年のさまざまな時期に咲く、多種多様な花を提供している',
      'by contrast「対照的に」で田舎の事情と比べている。'),
    q('r2-03-3', 3, 'detail', '専門家が心配していることはどれか。', [
      '巣箱が多すぎると、ミツバチが野生のハチとえさを奪い合う', 'ミツバチが人を刺すこと', 'はちみつの値段が下がること', '花が多すぎること'],
      '「ミツバチは、植物にとって同じく重要な野生のハチとえさを奪い合う」。',
      `Honeybees compete for food with wild bees, which are also important for plants.`, 'ミツバチは、植物にとってやはり重要な野生のハチと、えさを奪い合う',
      ', which ~ は前の名詞（wild bees）の補足説明。'),
    q('r2-03-4', 0, 'main', '筆者がこの文章で最も伝えたいことはどれか。', [
      'ミツバチのためには、巣箱を増やすより花を植えるほうが役に立つ', '都会では巣箱をもっと増やすべきだ', 'ミツバチは田舎でしか生きられない', '野生のハチは植物に役立たない'],
      '最後の文「巣箱を増やすことは、花をもっと植えることほど役に立たない」がまとめ。',
      `Adding more hives, they say, is less useful than planting more flowers.`, '巣箱を増やすのは、花をもっと植えるほど役に立たないと専門家は言う',
      'less useful than ~「〜ほど役に立たない」。'),
  ]),

  p('r2-04', 2, 'The Power of Handwriting', '手で書くこと', [
    `Many students today take notes on laptops because typing is faster than writing by hand. It seems natural to assume that recording more of what a teacher says would lead to better learning. Several studies, however, have suggested that the opposite may be true.`,
    `In one experiment, students who took notes by hand understood a lecture better than those who typed, even though they wrote down fewer words. Because writing by hand is slow, they could not copy everything. Instead, they had to listen carefully, decide what was important, and summarize it in their own words.`,
    `Typists, by contrast, tended to record the lecture almost word for word without really thinking about it. The researchers concluded that it is not the amount of notes that matters, but how deeply students process the information while taking them.`,
  ], [['take notes', 'ノートをとる'], ['the opposite', '逆のこと'], ['in one\'s own words', '自分の言葉で'], ['word for word', '一語一語そのまま']], [
    q('r2-04-1', 1, 'detail', '第1段落で、多くの人が当然だと考えていることは何か。', [
      '先生の話をより多く記録すれば、よりよく学べる', '手書きのほうがタイピングより速い', 'ノートをとらないほうがよく学べる', 'パソコンは授業で使えない'],
      '「先生の言うことをより多く記録すれば、よりよい学習につながると考えるのは自然に思える」。However 以下でそれが否定される。',
      `recording more of what a teacher says would lead to better learning`, '先生の言うことをより多く記録すれば、よりよい学習につながる',
      'It seems natural to assume that ~「〜と思い込むのは自然に思える」→ 後で否定される「通説」。'),
    q('r2-04-2', 2, 'reason', '手書きの学生が講義をよく理解できたのはなぜか。', [
      '全部は書けないので、よく聞いて大事なことを自分の言葉でまとめたから', '書いた語数が多かったから', 'パソコンより字がきれいだから', '先生が手書きの学生をほめたから'],
      '手書きは遅いので全部写せない。そのためよく聞き、何が大事かを決め、自分の言葉で要約した。',
      `they had to listen carefully, decide what was important, and summarize it in their own words`, '彼らは注意深く聞き、何が大事かを決め、それを自分の言葉で要約しなければならなかった',
      'even though ~「〜にもかかわらず」：語数は少ないのに理解はよかった。'),
    q('r2-04-3', 3, 'main', '研究者の結論として最も適切なものはどれか。', [
      '大事なのはノートの量ではなく、情報をどれだけ深く考えたかだ', 'パソコンは授業で使ってはいけない', 'ノートは多くとるほどよい', '手書きは遅いので勧められない'],
      '「大事なのはノートの量ではなく、ノートをとりながらどれだけ深く情報を処理するかだ」。',
      `it is not the amount of notes that matters, but how deeply students process the information`, '重要なのはノートの量ではなく、学生がどれだけ深く情報を処理するかだ',
      'It is not A that matters, but B：強調構文＋not A but B。入試頻出。'),
  ]),

  p('r2-05', 2, 'Sleeping on It', 'ひと晩寝て考える', [
    `When people face a difficult decision, they are often told to "sleep on it," that is, to wait until the next day before deciding. This advice may sound like a way of simply avoiding the problem, but scientists have found that there may be good reasons behind it.`,
    `In one study, participants were given a puzzle that had a hidden shortcut. Those who were allowed to sleep for eight hours before trying again were more than twice as likely to discover the shortcut as those who stayed awake for the same amount of time.`,
    `The researchers believe that while we sleep, the brain continues to work on information we took in during the day, reorganizing it in new ways. A problem that seemed impossible at night may look quite different in the morning — not because we tried harder, but because we stopped trying for a while.`,
  ], [['sleep on it', 'ひと晩寝て考える'], ['that is', 'つまり'], ['twice as ~ as ...', '…の2倍〜'], ['take in ~', '〜を取り入れる']], [
    q('r2-05-1', 1, 'paraphrase', '"sleep on it" の意味として本文で説明されているものはどれか。', [
      '決める前に次の日まで待つこと', '問題を忘れてしまうこと', '夜通し考え続けること', '昼寝をしてから決めること'],
      'that is「つまり」のあとに言い換えがある：「決める前に次の日まで待つこと」。',
      `that is, to wait until the next day before deciding`, 'つまり、決める前に次の日まで待つこと',
      'that is（すなわち）＝言い換えのサイン。'),
    q('r2-05-2', 2, 'detail', '実験の結果として正しいものはどれか。', [
      '8時間眠った人は、起きていた人の2倍以上近道を見つけやすかった', '起きていた人のほうが多く近道を見つけた', '眠った人も起きていた人も結果は同じだった', '眠った人はパズルを解けなかった'],
      'more than twice as likely to ~ as ...「…の2倍以上〜しやすい」。',
      `were more than twice as likely to discover the shortcut as those who stayed awake`, '起きていた人より2倍以上、近道を見つけやすかった',
      '倍数表現：X times as ~ as ...'),
    q('r2-05-3', 3, 'reason', '朝になると問題が違って見えることがあるのはなぜか。', [
      '眠っている間も脳が情報を新しい形に整理しているから', '朝のほうが頭が冷たいから', '夜より朝のほうが一生懸命考えるから', '夢の中で答えを教えてもらうから'],
      '「眠っている間、脳は昼に取り入れた情報に取り組み続け、新しい形に組み直す」。',
      `the brain continues to work on information we took in during the day, reorganizing it in new ways`, '脳は昼間に取り入れた情報に取り組み続け、それを新しい形に組み直している',
      'not because A, but because B「AだからではなくBだから」。'),
  ]),

  p('r2-06', 2, 'Small Shops, Big Changes', '商店街の工夫', [
    `Across Japan, many traditional shopping streets have been struggling for decades. Large shopping centers on the edge of town offer free parking and long opening hours, and many shoppers now buy what they need online. As a result, rows of closed shutters have become a familiar sight in many local towns.`,
    `Some shopping streets, however, have found new ways to survive. In one town, shop owners began holding free classes in their stores: the butcher teaches cooking, and the owner of the bicycle shop shows customers how to repair a flat tire.`,
    `The classes do not make much money directly. What they do is give people a reason to visit and talk with the shop owners. Once customers have learned something from a person, they are far more likely to come back and buy from that person.`,
  ], [['as a result', 'その結果'], ['familiar sight', '見慣れた光景'], ['find a way to ~', '〜する方法を見つける'], ['be likely to ~', '〜しそうだ']], [
    q('r2-06-1', 1, 'reason', '多くの商店街が苦しんでいる理由として述べられていないものはどれか。', [
      '商店街の家賃が高すぎること', '郊外の大型店が駐車場無料で長時間営業していること', 'ネットで買い物をする人が多いこと', 'これらの結果、閉まったシャッターが増えたこと'],
      '家賃の話はない。残りは第1段落にある。NOT問題。',
      `Large shopping centers on the edge of town offer free parking and long opening hours, and many shoppers now buy what they need online.`, '郊外の大型商業施設は無料駐車場と長い営業時間を提供し、多くの買い物客は今では必要なものをネットで買う',
      'As a result「その結果」は因果関係のサイン。'),
    q('r2-06-2', 2, 'detail', 'ある町の商店主たちが始めたことはどれか。', [
      '自分の店で無料の教室を開くこと', '店を大型施設へ移すこと', '商品をネットで安く売ること', '店の営業時間を短くすること'],
      '「店主たちは店で無料の教室を開き始めた。肉屋は料理を、自転車屋はパンクの直し方を教える」。',
      `shop owners began holding free classes in their stores`, '店主たちは自分の店で無料の教室を開き始めた',
      'コロン（:）のあとに具体例が続く。'),
    q('r2-06-3', 3, 'main', '教室を開くことの効果について、筆者の説明に合うものはどれか。', [
      '人から何かを学ぶと、その人の店にまた来て買い物をしやすくなる', '教室の参加費で大きな利益が出る', '教室は客を減らしてしまう', '店主と客の会話が少なくなる'],
      '教室は直接はもうからないが、「人から学ぶと、その人の店に戻って買う可能性がはるかに高い」。',
      `they are far more likely to come back and buy from that person`, '彼らはその人の店に戻ってきて買い物をする可能性がはるかに高い',
      'What they do is ~「それらがすることは〜だ」。far は比較級の強調。'),
  ]),

  p('r2-07', 2, 'Learning a Language Later in Life', '大人になってからの外国語', [
    `It is often said that children learn foreign languages more easily than adults. There is some truth in this: children who grow up with a language usually develop a more natural accent. But this does not mean that adults are bad language learners.`,
    `In fact, in the early stages, adults often make faster progress than children. They can use their knowledge of grammar, apply study strategies, and understand explanations. A ten-year-old may need months to learn what an adult can understand in a single lesson.`,
    `What adults usually lack is not ability but time and opportunity. Children are surrounded by a language all day, while most adults study for only an hour or two a week. The key for older learners, therefore, is to find ways of using the language as part of daily life.`,
  ], [['there is some truth in ~', '〜にも一理ある'], ['this does not mean that ~', 'だからといって〜というわけではない'], ['in fact', '実際'], ['be surrounded by ~', '〜に囲まれている']], [
    q('r2-07-1', 1, 'detail', '第1段落で「一理ある」と認めているのはどの点か。', [
      '幼いころから言語に触れた子どもは、より自然な発音を身につけること', '大人は外国語の学習が苦手であること', '子どもは文法を理解するのが速いこと', '大人は発音がよいこと'],
      'There is some truth in this:（一理ある）のあとに具体的な内容。だが「大人が下手」とは言っていない。',
      `children who grow up with a language usually develop a more natural accent`, 'ある言語に囲まれて育つ子どもは、ふつうより自然な発音を身につける',
      '譲歩（一理ある）→ But（しかし）→ 主張、という流れ。'),
    q('r2-07-2', 2, 'detail', '学習の初めの段階について正しいものはどれか。', [
      '大人のほうが子どもより速く上達することが多い', '子どものほうが大人より常に速く上達する', '大人は文法を使えない', '大人は説明を理解できない'],
      '「実際、初期の段階では大人のほうが子どもより速く上達することが多い」。',
      `adults often make faster progress than children`, '大人は子どもよりも速く上達することが多い',
      'make progress「進歩する」。'),
    q('r2-07-3', 3, 'main', '大人の学習者にとっての鍵として、筆者が述べていることはどれか。', [
      '日常生活の中でその言語を使う方法を見つけること', '子どもと同じ教材で学ぶこと', '文法の勉強をやめること', '1週間に1時間だけ勉強すること'],
      '「大人に足りないのは能力ではなく時間と機会。だから日常生活の一部として使う方法を見つけることが鍵」。',
      `The key for older learners, therefore, is to find ways of using the language as part of daily life.`, 'したがって年上の学習者にとっての鍵は、その言語を日常生活の一部として使う方法を見つけることだ',
      'not ability but time and opportunity：not A but B。'),
  ]),

  p('r2-08', 2, 'Why Ice Floats', '氷はなぜ浮くか', [
    `Most substances become heavier, or more precisely denser, when they change from liquid to solid. A piece of solid iron, for example, sinks in melted iron. Water, however, behaves differently. When it freezes, it expands and becomes lighter for its size, which is why ice cubes float in a glass.`,
    `This strange behavior is extremely important for life on Earth. In winter, ice forms on the surface of lakes and rivers instead of at the bottom. The layer of ice acts like a blanket, protecting the water beneath it from the cold air.`,
    `If ice sank, lakes would freeze from the bottom up, and many of them might become solid ice in cold regions. Fish and other creatures that live in water would have nowhere to survive the winter. Something as ordinary as a floating ice cube, in other words, helps to make life possible.`,
  ], [['more precisely', 'より正確に言えば'], ['which is why ~', 'それが〜の理由だ'], ['act like ~', '〜のはたらきをする'], ['in other words', '言いかえれば']], [
    q('r2-08-1', 1, 'detail', '水がほかの多くの物質とちがう点はどれか。', [
      '凍ると体積が増え、大きさの割に軽くなる', '凍ると重くなって沈む', '熱すると固くなる', '凍っても重さが変わらない'],
      '「水は凍ると膨張し、大きさの割に軽くなる。それが氷がグラスに浮く理由だ」。',
      `When it freezes, it expands and becomes lighter for its size`, '水は凍ると膨張し、大きさの割に軽くなる',
      ', which is why ~「そしてそれが〜の理由だ」（前の内容を受ける）。'),
    q('r2-08-2', 2, 'paraphrase', '氷の層が「毛布のような」はたらきをするとは、どういう意味か。', [
      '下の水を冷たい空気から守っている', '湖の水をすべて凍らせる', '魚のえさになる', '太陽の光を強くする'],
      '「氷の層は毛布のようにはたらき、その下の水を冷たい空気から守っている」。',
      `protecting the water beneath it from the cold air`, 'その下の水を冷たい空気から守りながら',
      'protect A from B「AをBから守る」。'),
    q('r2-08-3', 3, 'inference', 'もし氷が沈むとしたら、どうなると筆者は考えているか。', [
      '湖が底から凍り、水中の生き物が冬を越せなくなる', '湖の水が温かくなる', '魚が増える', '氷が早くとける'],
      '仮定法過去「もし氷が沈むなら、湖は底から凍り、生き物は冬を生き延びる場所がなくなるだろう」。',
      `Fish and other creatures that live in water would have nowhere to survive the winter.`, '魚や水中に住む生き物は、冬を生き延びる場所がなくなるだろう',
      'If + 過去形, would ~：現実とちがう仮定。'),
  ]),

  p('r2-09', 2, 'Reviews You Can Trust?', '口コミは信用できるか', [
    `Before buying a product or choosing a restaurant, many people check online reviews. Reading the experiences of other customers seems more reliable than listening to advertisements, since the reviewers have nothing to gain from praising the product. Or do they?`,
    `Unfortunately, a growing number of reviews are not written by real customers at all. Some companies pay people to post positive comments about their own products, or negative ones about their competitors. Experts estimate that a significant share of reviews on some websites may be fake.`,
    `There are, however, some warning signs. Fake reviews tend to be extremely positive or extremely negative, and they rarely mention specific details. Reading a range of moderate reviews, especially those that describe both strengths and weaknesses, is therefore a safer guide.`,
  ], [['have nothing to gain', '得るものが何もない'], ['a growing number of ~', 'ますます多くの〜'], ['tend to ~', '〜する傾向がある'], ['a range of ~', 'さまざまな〜']], [
    q('r2-09-1', 1, 'reason', '口コミが広告より信頼できるように思える理由はどれか。', [
      '書いた人は、商品をほめても得をしないから', '口コミは会社が書いているから', '広告はいつもうそだから', '口コミは短いから'],
      '「口コミを書く人は商品をほめても何も得るものがないので」。since は理由。最後の Or do they? で疑問を投げかけている。',
      `since the reviewers have nothing to gain from praising the product`, '口コミを書く人は、商品をほめることで何も得るものがないので',
      'Or do they?「でも本当にそうだろうか」＝次の段落で反論が来るサイン。'),
    q('r2-09-2', 2, 'detail', '第2段落の内容と合うものはどれか。', [
      'お金をもらって自社をほめたり他社をけなしたりする人がいる', '口コミはすべて本物の客が書いている', '偽の口コミは法律で完全に禁止されている', '専門家は偽の口コミはほとんどないと考えている'],
      '「自社製品のよいコメントや、競合のわるいコメントを投稿させるためにお金を払う会社もある」。',
      `Some companies pay people to post positive comments about their own products, or negative ones about their competitors.`, '自社製品についての好意的なコメントや、競合他社についての否定的なコメントを投稿させるために、人にお金を払う会社もある',
      'negative ones の ones は comments の代わり。'),
    q('r2-09-3', 3, 'main', '筆者が勧める口コミの読み方はどれか。', [
      '長所と短所の両方を書いた、ほどほどの評価をいくつも読む', '最も評価の高い口コミだけを信じる', '口コミを一切読まない', '最も評価の低い口コミだけを読む'],
      '偽物は極端な評価で具体性がない。だから「長所と短所の両方を書いたほどほどの口コミをいろいろ読む」のが安全。',
      `Reading a range of moderate reviews, especially those that describe both strengths and weaknesses, is therefore a safer guide.`, 'したがって、さまざまなほどほどの口コミ、特に長所と短所の両方を書いたものを読むほうが、より安全な手引きとなる',
      '主語は Reading ~ reviews（動名詞句）、動詞は is。'),
  ]),

  p('r2-10', 2, 'The Walking Meeting', '歩きながらの会議', [
    `Most meetings take place around a table, with people sitting for an hour or more. Some companies are now trying a different approach: the walking meeting. Instead of booking a meeting room, two or three colleagues simply go for a walk around the neighborhood while they talk.`,
    `Supporters say that walking meetings have several benefits. Moving the body is good for health, of course, but it also seems to make people more creative. In one study, people came up with significantly more new ideas while walking than while sitting.`,
    `Walking meetings are not suitable for every purpose, however. It is difficult to look at documents or take detailed notes while walking, and large groups cannot hear each other. They work best for small groups who need to discuss ideas rather than examine data.`,
  ], [['take place', '行われる'], ['go for a walk', '散歩に行く'], ['come up with ~', '〜を思いつく'], ['be suitable for ~', '〜に適している']], [
    q('r2-10-1', 1, 'detail', '「歩く会議」とはどのようなものか。', [
      '会議室の代わりに、数人で近所を歩きながら話す', '大勢でマラソンをしながら話す', '会議の前に必ず散歩をする', '会議室の中を歩き回る'],
      '「会議室を予約する代わりに、2〜3人の同僚が話しながら近所を散歩する」。',
      `two or three colleagues simply go for a walk around the neighborhood while they talk`, '2〜3人の同僚が、話しながら近所を散歩するだけだ',
      'Instead of ~ing「〜する代わりに」。'),
    q('r2-10-2', 2, 'detail', '研究で分かったことはどれか。', [
      '歩いているときのほうが、新しいアイデアをかなり多く出した', '座っているときのほうがよいアイデアが出た', '歩くと疲れてアイデアが出なくなった', '歩いても座ってもアイデアの数は同じだった'],
      '「人々は座っているときより歩いているときに、かなり多くの新しいアイデアを思いついた」。',
      `people came up with significantly more new ideas while walking than while sitting`, '人々は座っているときより歩いているときのほうが、かなり多くの新しい考えを思いついた',
      'of course ~, but ...「もちろん〜だが…」：譲歩→本題。'),
    q('r2-10-3', 3, 'main', '歩く会議が最も向いているのはどのような場合か。', [
      'データを調べるより、アイデアを話し合う少人数の場合', '書類をくわしく確認する場合', '大人数で話し合う場合', 'くわしいメモをとる必要がある場合'],
      '「データを調べるよりも、アイデアを話し合う必要のある少人数に最も向いている」。',
      `They work best for small groups who need to discuss ideas rather than examine data.`, 'それはデータを調べるよりも、アイデアを話し合う必要がある少人数に最も向いている',
      'A rather than B「BよりむしろA」。'),
  ]),

  p('r2-11', 2, 'A Second Life for Old Phones', '古いスマホの再利用', [
    `The average person replaces their smartphone every two or three years, even though most old phones still work perfectly well. Millions of them end up forgotten in drawers, and many more are thrown away. This is a serious waste, because phones contain small amounts of valuable metals such as gold and copper.`,
    `Some organizations are trying to give these devices a second life. They collect used phones, repair them, and send them to people who cannot afford a new one, including elderly people living alone and students from low-income families.`,
    `Others take the phones apart to recover the metals inside. Surprisingly, a ton of old phones can contain far more gold than a ton of rock from a gold mine. For this reason, discarded electronics are sometimes described as an "urban mine."`,
  ], [['end up ~', '結局〜になる'], ['cannot afford ~', '〜を買う余裕がない'], ['take ~ apart', '〜を分解する'], ['for this reason', 'このため']], [
    q('r2-11-1', 1, 'reason', '古いスマホを捨てることが「深刻なむだ」だとされる理由はどれか。', [
      '金や銅のような貴重な金属が含まれているから', '古いスマホは高く売れるから', '捨てると法律違反になるから', '古いスマホは壊れやすいから'],
      'because 以下「スマホには金や銅など貴重な金属が少量含まれているから」。',
      `phones contain small amounts of valuable metals such as gold and copper`, 'スマホには金や銅などの貴重な金属が少量含まれている',
      'even though ~「〜にもかかわらず」：まだ使えるのに買い替える。'),
    q('r2-11-2', 2, 'detail', '集めたスマホを修理して送る先として述べられているのはどれか。', [
      '新しいスマホを買う余裕のない人', 'スマホの会社', '外国の工場', '博物館'],
      '「新しいものを買う余裕のない人々、たとえば一人暮らしの高齢者や低所得家庭の学生」。',
      `send them to people who cannot afford a new one`, '新しいスマホを買う余裕のない人々にそれらを送る',
      'cannot afford ~「〜を買う（する）余裕がない」。'),
    q('r2-11-3', 3, 'paraphrase', '古い電子機器が「都市鉱山」と呼ばれるのはなぜか。', [
      '金鉱山の岩より多くの金を含むことがあるから', '都市の地下に埋められているから', '鉱山で働く人が使っているから', '都市でしか作られないから'],
      '「1トンの古いスマホは、金鉱山の岩1トンよりはるかに多くの金を含みうる」。For this reason が因果を示す。',
      `a ton of old phones can contain far more gold than a ton of rock from a gold mine`, '1トンの古いスマホは、金鉱山の岩1トンよりもはるかに多くの金を含むことがある',
      'Some ~. Others ...「〜するものもあれば、…するものもある」。'),
  ]),

  p('r2-12', 2, 'The Myth of the Ten Percent Brain', '脳の10%神話', [
    `You may have heard the claim that humans use only ten percent of their brains. The idea appears in films, advertisements, and self-help books, which often promise to help people "unlock" the remaining ninety percent. Despite its popularity, the claim has no scientific basis.`,
    `Brain scans show that even during simple tasks, activity can be seen across many different areas of the brain. Over the course of a day, practically every part is used. Moreover, damage to almost any area of the brain, however small, causes some kind of problem, which would not be the case if ninety percent were unused.`,
    `Why, then, has the myth survived for so long? One reason may be that it is an attractive message. It suggests that each of us has hidden abilities waiting to be discovered — a hopeful thought, even if it is not a true one.`,
  ], [['despite ~', '〜にもかかわらず'], ['over the course of ~', '〜の間に'], ['however small', 'どんなに小さくても'], ['be the case', '事実である']], [
    q('r2-12-1', 1, 'detail', '第1段落で「10%の脳」の説について述べられていることはどれか。', [
      '広く知られているが、科学的な根拠はない', '科学者によって証明された', '映画にしか出てこない', '最近考え出された説である'],
      '「人気があるにもかかわらず、その主張には科学的根拠がない」。',
      `Despite its popularity, the claim has no scientific basis.`, 'その人気にもかかわらず、その主張には科学的な根拠がない',
      'Despite + 名詞「〜にもかかわらず」。'),
    q('r2-12-2', 2, 'reason', '脳のどこが傷ついても何らかの問題が起きることは、何を示しているか。', [
      '脳の90%が使われていないという説は正しくない', '脳は小さい部分しか使われていない', '脳の傷はすぐに治る', '脳の一部は不要である'],
      '「もし90%が使われていないなら、そうはならないはずだ」＝説が誤りである証拠。',
      `which would not be the case if ninety percent were unused`, 'もし90%が使われていないのなら、そうはならないだろう',
      'however small「どんなに小さくても」（譲歩）。were は仮定法。'),
    q('r2-12-3', 3, 'inference', 'この神話が長く残ってきた理由として筆者が考えていることはどれか。', [
      '誰にでも隠れた能力があるという希望のあるメッセージだから', '科学者が支持しているから', '学校で教えられているから', '脳のスキャンが不正確だから'],
      '「魅力的なメッセージだから。一人ひとりに発見を待つ隠れた能力があることを示唆する」。',
      `It suggests that each of us has hidden abilities waiting to be discovered`, 'それは、私たち一人ひとりに、発見されるのを待っている隠れた能力があることを示唆している',
      'even if it is not a true one「たとえ本当のことではないとしても」。'),
  ]),
];
