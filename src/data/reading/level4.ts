/** レベル4：難関（早慶・旧帝大・難関国立）。4段落・各55〜90語・段落ごとの問い（問い・選択肢は英語） */
import { p, q } from './types';

export const LEVEL4 = [
  p('r4-01', 4, 'The Myth of the Multitasker', 'マルチタスクの思い込み', [
    `Many people take pride in their ability to do several things at once: answering messages during a meeting, following a lecture while scrolling through social media, or revising for an exam with the television on. They are convinced that multitasking makes them more productive. A growing body of evidence suggests that they are mistaken.`,
    `What we call multitasking is, in most cases, nothing more than rapid switching between tasks. Each time attention shifts, the brain needs a fraction of a second to reorient itself, and these small delays accumulate. In laboratory studies, participants who switched frequently between two tasks took considerably longer to finish them, and made more errors, than those who completed one before starting the other.`,
    `More surprisingly, heavy multitaskers appear to be worse, not better, at filtering out irrelevant information. Having trained themselves to respond to every new stimulus, they seem to find it harder to ignore distractions when concentration is required.`,
    `None of this is to say that we can never do two things at once. Walking while talking is effortless, precisely because one of the activities has become almost automatic. Trouble arises only when both tasks make demands on conscious thought.`,
  ], [['take pride in ~', '〜を誇りに思う'], ['nothing more than ~', '〜にすぎない'], ['filter out ~', '〜を取り除く'], ['make demands on ~', '〜に負担を強いる']], [
    q('r4-01-1', 1, 'detail', 'What does the first paragraph say about people who multitask?', [
      'They believe that doing several things at once increases their productivity', 'They admit that multitasking makes them less efficient', 'They multitask only when preparing for exams', 'They have been proven to be more productive than others'],
      '「マルチタスクで生産性が上がると確信している」。だが証拠はそれが誤りだと示す。',
      `They are convinced that multitasking makes them more productive.`, '彼らはマルチタスクが自分の生産性を上げると確信している',
      'be convinced that ~「〜と確信している」。'),
    q('r4-01-2', 2, 'paraphrase', 'According to the second paragraph, what is "multitasking" in most cases?', [
      'Moving quickly back and forth between tasks', 'Performing two demanding tasks at exactly the same moment', 'Doing tasks in a carefully planned order', 'Letting technology complete tasks automatically'],
      'nothing more than rapid switching「すばやい切り替えにすぎない」。同時処理ではない。',
      `What we call multitasking is, in most cases, nothing more than rapid switching between tasks.`, '私たちがマルチタスクと呼ぶものは、たいていの場合、作業間のすばやい切り替えにすぎない',
      'What we call ~「私たちが〜と呼ぶもの」。'),
    q('r4-01-3', 3, 'detail', 'What is said about heavy multitaskers in the third paragraph?', [
      'They are less able to ignore information that is not relevant', 'They are better at concentrating than other people', 'They rarely respond to new stimuli', 'They have trained themselves to ignore distractions'],
      'worse, not better「むしろ下手」。あらゆる刺激に反応する癖のせいで、集中が必要なとき邪魔を無視しにくい。',
      `heavy multitaskers appear to be worse, not better, at filtering out irrelevant information`, 'よくマルチタスクをする人は、無関係な情報を取り除くのが、上手ではなくむしろ下手であるようだ',
      'Having trained themselves ~ は完了形の分詞構文（理由）。'),
    q('r4-01-4', 4, 'reason', 'Why is walking while talking described as effortless?', [
      'Because one of the two activities requires little conscious thought', 'Because both activities use different parts of the body', 'Because people practise it from an early age', 'Because talking is less important than walking'],
      'precisely because 以下「まさに片方がほぼ自動的になっているから」。問題は両方が意識的思考を要するとき。',
      `precisely because one of the activities has become almost automatic`, 'まさに、片方の活動がほとんど自動的になっているからこそ',
      'None of this is to say that ~「だからといって〜というわけではない」（譲歩）。'),
  ]),

  p('r4-02', 4, 'Who Owns English?', '英語はだれのものか', [
    `English is now spoken by far more people as a second or foreign language than as a first language. This simple demographic fact raises a question that would once have seemed absurd: who has the authority to decide what counts as "correct" English?`,
    `For much of the twentieth century, the answer appeared self-evident. Correct English was the English of educated speakers in Britain or the United States, and learners elsewhere were expected to imitate it as faithfully as they could. Accents and expressions that departed from these models were treated as errors awaiting correction.`,
    `Many linguists now reject this view. In countries such as India, Nigeria, and Singapore, they point out, English has developed stable patterns of pronunciation, vocabulary, and grammar that are used with confidence by millions. To label these patterns mistakes is to confuse difference with deficiency.`,
    `This is not to suggest that anything goes. Communication depends on shared conventions, and a speaker who hopes to be understood internationally must be aware of how others will hear him or her. The goal, however, is not to pass for a native speaker but to be intelligible to as wide a range of listeners as possible.`,
  ], [['count as ~', '〜とみなされる'], ['self-evident', '自明の'], ['depart from ~', '〜から外れる'], ['pass for ~', '〜として通る']], [
    q('r4-02-1', 1, 'inference', 'What does the first paragraph imply?', [
      'Non-native speakers of English now outnumber native speakers', 'Most people learn English as their first language', 'The number of English learners is declining', 'The question of correct English has always been considered important'],
      '「第一言語としてより、第二・外国語として話す人のほうがはるかに多い」。would once have seemed absurd は「かつてならばかげて見えただろう」。',
      `English is now spoken by far more people as a second or foreign language than as a first language.`, '英語は今や、第一言語としてよりも第二言語・外国語として、はるかに多くの人に話されている',
      'would once have seemed ~：仮定法過去完了「かつてなら〜に思えただろう」。'),
    q('r4-02-2', 2, 'detail', 'According to the second paragraph, how were non-standard accents regarded in the past?', [
      'As mistakes that needed to be corrected', 'As valuable varieties of the language', 'As signs of a good education', 'As more intelligible than standard English'],
      '「モデルから外れた発音や表現は、訂正を待つ誤りとして扱われた」。',
      `Accents and expressions that departed from these models were treated as errors awaiting correction.`, 'これらのモデルから外れた発音や表現は、訂正を待つ誤りとして扱われた',
      'errors awaiting correction：現在分詞の後置修飾。'),
    q('r4-02-3', 3, 'paraphrase', 'What do the linguists mean by "to confuse difference with deficiency"?', [
      'To treat ways of speaking that are merely different as if they were faulty', 'To believe that all varieties of English are identical', 'To assume that native speakers make more mistakes than learners', 'To mix up the vocabularies of different countries'],
      '安定した独自の型を「誤り」と呼ぶのは、「違い」を「欠陥」と取り違えることだ。',
      `To label these patterns mistakes is to confuse difference with deficiency.`, 'これらの型を誤りと呼ぶことは、違いを欠陥と取り違えることだ',
      'To A is to B「AすることはBすることだ」。confuse A with B「AをBと混同する」。'),
    q('r4-02-4', 4, 'main', 'According to the final paragraph, what should be the goal of learning English?', [
      'To be understood by as many different listeners as possible', 'To be mistaken for a native speaker', 'To create an entirely new form of English', 'To ignore the conventions other speakers follow'],
      '「目標はネイティブとして通ることではなく、できるだけ幅広い聞き手に通じることだ」。anything goes（何でもよい）ではない点にも注意。',
      `The goal, however, is not to pass for a native speaker but to be intelligible to as wide a range of listeners as possible.`, 'しかし目標はネイティブとして通ることではなく、できるだけ幅広い聞き手に理解されることだ',
      'This is not to suggest that anything goes.「何でもありだと言っているのではない」（譲歩）。'),
  ]),

  p('r4-03', 4, 'The Price of "Free"', '「無料」の値段', [
    `Search engines, email services, maps, and social networks are offered to us free of charge. It is tempting to regard them as gifts. Yet the companies that provide them rank among the most profitable in the world, and their profits must come from somewhere.`,
    `In most cases, they come from advertising. Advertisers will pay handsomely to reach people who are likely to buy their products, and the more a company knows about its users, the more precisely it can target them. Hence the familiar saying: if you are not paying for the product, you are the product.`,
    `Defenders of the model insist that the exchange is a fair one. Users receive valuable tools; in return, they allow their data to be used to show them advertisements that may even prove useful. Without advertising revenue, they add, many services would be available only to those who could afford a subscription.`,
    `Critics reply that an exchange can hardly be called fair if one party does not understand its terms. Few people read the lengthy privacy policies they agree to, and fewer still could say what information is collected about them or how long it is kept. A genuine bargain, they insist, requires informed consent.`,
  ], [['free of charge', '無料で'], ['rank among ~', '〜の一つに数えられる'], ['pay handsomely', '大金を払う'], ['informed consent', '十分な説明に基づく同意']], [
    q('r4-03-1', 1, 'inference', 'What point does the author make in the first paragraph?', [
      'Free services must generate profit in some way', 'Free services are gifts from generous companies', 'Companies offering free services rarely make money', 'People ought to pay for search engines and maps'],
      'Yet 以下「提供企業は世界有数の高収益企業で、利益はどこかから来ているはずだ」。',
      `their profits must come from somewhere`, 'その利益はどこかから来ているにちがいない',
      'It is tempting to ~「〜したくなる」→ Yet で否定。'),
    q('r4-03-2', 2, 'paraphrase', 'What does the saying "you are the product" mean in this context?', [
      'Users\' attention and data are what companies actually sell to advertisers', 'Users are expected to design new products', 'Companies sell their users physical goods', 'Users must pay a hidden fee for every service'],
      '広告主は買いそうな人に届けるため大金を払い、会社は利用者を知るほど正確に狙える。つまり売り物は利用者（の注目・データ）。',
      `the more a company knows about its users, the more precisely it can target them`, '会社が利用者について多く知れば知るほど、より正確に彼らを狙うことができる',
      'Hence「それゆえ」。the 比較級, the 比較級。'),
    q('r4-03-3', 3, 'detail', 'Which argument do defenders of the advertising model make?', [
      'It allows people who cannot afford subscriptions to use the services', 'It protects users from seeing any advertisements', 'It ensures that companies collect no personal data', 'It makes privacy policies shorter and easier to read'],
      '「広告収入がなければ、多くのサービスは購読料を払える人だけのものになるだろう」。',
      `many services would be available only to those who could afford a subscription`, '多くのサービスは、購読料を払う余裕のある人だけが利用できるものになるだろう',
      'Without ~, ... would ~：仮定法（〜がなければ）。'),
    q('r4-03-4', 4, 'reason', 'Why do critics say the exchange is not fair?', [
      'Users do not really understand what they have agreed to', 'Advertisements are never useful to anyone', 'Companies charge hidden fees for their services', 'Privacy policies forbid the use of personal data'],
      '「一方が条件を理解していないなら、公正とはとても呼べない」。can hardly「ほとんど〜できない」。',
      `an exchange can hardly be called fair if one party does not understand its terms`, '一方の当事者が条件を理解していないなら、その交換はとても公正とは呼べない',
      'Few ~, and fewer still ...「〜する人は少なく、…する人はさらに少ない」。'),
  ]),

  p('r4-04', 4, 'Learning from Failure', '失敗から学ぶ組織', [
    `In many organizations, admitting a mistake is a risky business. Employees who report errors may be blamed, passed over for promotion, or even dismissed. Small wonder, then, that problems are frequently concealed until they become too large to ignore.`,
    `The aviation industry offers a striking contrast. Whenever an accident or a near miss occurs, it is investigated in detail, and the findings are shared across the industry so that the same error is not repeated elsewhere. Pilots are encouraged to report their own mistakes, and in many systems such reports cannot be used to punish them.`,
    `Researchers studying hospitals have observed a similar pattern. In one study, the teams that reported the most errors turned out to be the best-performing teams, not the worst. The likely explanation is not that they made more mistakes, but that their members felt safe enough to speak up.`,
    `The lesson is not that failure should be celebrated. It is that an organization which punishes people for revealing failure will, in the end, learn very little from it.`,
  ], [['pass over ~ for promotion', '〜を昇進で見送る'], ['small wonder (that) ~', '〜も無理はない'], ['near miss', 'ニアミス・事故寸前'], ['speak up', '声を上げる']], [
    q('r4-04-1', 1, 'inference', 'What does "Small wonder, then, that problems are frequently concealed" suggest?', [
      'It is natural that problems are hidden when reporting them is punished', 'It is surprising that anyone hides problems', 'Problems are rarely concealed in most organizations', 'Hiding problems is a small and unimportant issue'],
      'Small wonder that ~「〜も不思議ではない」。罰せられるのだから隠すのは当然。',
      `problems are frequently concealed until they become too large to ignore`, '問題は無視できないほど大きくなるまで隠されることが多い',
      'too ~ to ...「あまりに〜で…できない」。'),
    q('r4-04-2', 2, 'detail', 'What is true of the aviation industry, according to the second paragraph?', [
      'Lessons from accidents are shared so that others do not repeat the same mistakes', 'Pilots are severely punished for reporting their errors', 'Accidents are investigated only when people are killed', 'Each airline keeps its findings secret from competitors'],
      '「調査結果は業界全体で共有され、同じ誤りがほかで繰り返されないようにする」。',
      `the findings are shared across the industry so that the same error is not repeated elsewhere`, '調査結果は、同じ誤りがほかで繰り返されないよう、業界全体で共有される',
      'so that ~「〜するように」（目的）。'),
    q('r4-04-3', 3, 'reason', 'How does the author explain the finding of the hospital study?', [
      'Members of the best teams felt secure enough to report their errors', 'The best teams actually made the largest number of mistakes', 'The worst teams were punished more often', 'The researchers counted the errors incorrectly'],
      'not that A, but that B「AだからではなくBだから」：多くミスしたのではなく、安心して声を上げられた。',
      `The likely explanation is not that they made more mistakes, but that their members felt safe enough to speak up.`, 'もっともらしい説明は、彼らがより多くミスをしたということではなく、メンバーが安心して声を上げられたということだ',
      'turned out to be ~「〜だと分かった」。'),
    q('r4-04-4', 4, 'main', 'Which statement best expresses the lesson of the passage?', [
      'Organizations improve only when people can reveal mistakes without fear', 'Mistakes should be encouraged in every workplace', 'The aviation industry has never had an accident', 'Hospitals are more dangerous than aircraft'],
      '「失敗を明かした人を罰する組織は、結局失敗からほとんど学べない」。「失敗を祝うべき」ではない点に注意。',
      `an organization which punishes people for revealing failure will, in the end, learn very little from it`, '失敗を明かしたことで人を罰する組織は、結局そこからほとんど何も学ばないだろう',
      'The lesson is not that A. It is that B.（not A but B の変形）'),
  ]),

  p('r4-05', 4, 'The Urban Heat Island', '都市はなぜ暑いのか', [
    `On a summer afternoon, the center of a large city can be several degrees warmer than the surrounding countryside. This phenomenon, known as the urban heat island effect, has a number of causes, but the most important lies in the very materials of which cities are made.`,
    `Asphalt, concrete, and dark roofing absorb a large share of the sunlight that falls on them and release the heat slowly, often well into the night. Fields and forests, by contrast, reflect more sunlight, and the water that evaporates from leaves and soil cools the air around them. Tall buildings that block the wind, together with heat from vehicles and air conditioners, add further warmth.`,
    `The effect is more than a matter of comfort. During heat waves, high urban temperatures increase the risk of heatstroke, particularly among the elderly, and push up the demand for electricity.`,
    `Some remedies are surprisingly simple. Painting roofs in light colors allows them to reflect more sunlight, and planting trees provides both shade and evaporative cooling. Ironically, air conditioning, which helps individuals cope with the heat, makes the problem worse for the city as a whole.`,
  ], [['lie in ~', '〜にある'], ['of which ~ are made', '〜が作られている'], ['well into the night', '夜遅くまで'], ['cope with ~', '〜に対処する']], [
    q('r4-05-1', 1, 'detail', 'According to the first paragraph, what is the most important cause of the effect?', [
      'The materials used to build cities', 'The heat produced by air conditioners', 'The lack of wind between tall buildings', 'The number of people living in cities'],
      '「最も重要な原因は、都市が作られている材料そのものにある」。風や排熱は付け加えの要因。',
      `the most important lies in the very materials of which cities are made`, '最も重要なものは、都市を作っている材料そのものにある',
      'the very ~「まさにその〜」。of which：前置詞＋関係代名詞。'),
    q('r4-05-2', 2, 'detail', 'How do fields and forests help keep the air cool?', [
      'They reflect more sunlight, and water evaporating from them cools the air', 'They absorb sunlight and release it slowly at night', 'They block the wind that carries heat', 'They supply electricity for air conditioning'],
      '「畑や森はより多くの日光を反射し、葉や土から蒸発する水が周りの空気を冷やす」。',
      `Fields and forests, by contrast, reflect more sunlight, and the water that evaporates from leaves and soil cools the air around them.`, '対照的に畑や森はより多くの日光を反射し、葉や土から蒸発する水が周りの空気を冷やす',
      'by contrast で都市の材料と対比。'),
    q('r4-05-3', 3, 'paraphrase', 'What does "The effect is more than a matter of comfort" mean?', [
      'The heat island effect also has serious consequences for health and energy use', 'The effect only makes people feel slightly uncomfortable', 'The effect is less important than people think', 'The effect makes cities more comfortable to live in'],
      '快適さだけの問題ではない＝熱中症の危険や電力需要の増加という深刻な影響がある。',
      `high urban temperatures increase the risk of heatstroke, particularly among the elderly, and push up the demand for electricity`, '都市の高温は、特に高齢者の熱中症の危険を高め、電力の需要を押し上げる',
      'more than ~「〜以上のもの・〜だけではない」。'),
    q('r4-05-4', 4, 'reason', 'Why does the author use the word "Ironically" in the last paragraph?', [
      'A device that helps people cope with heat also adds to the problem', 'Light-coloured roofs are more expensive than dark ones', 'Planting trees makes cities hotter in winter', 'Elderly people prefer hot weather'],
      'エアコンは個人を助けるのに、都市全体では問題を悪化させる、という皮肉。',
      `air conditioning, which helps individuals cope with the heat, makes the problem worse for the city as a whole`, 'エアコンは個人が暑さに対処するのを助けるが、都市全体にとっては問題を悪化させる',
      'help + 人 + 原形「人が〜するのを助ける」。'),
  ]),

  p('r4-06', 4, 'In Praise of Boredom', '退屈の効用', [
    `Boredom has a bad reputation. We think of it as an unpleasant state to be escaped as quickly as possible, and modern technology has made escape effortless: whenever a spare moment arises, we can reach for a phone and fill it with news, games, or videos.`,
    `Some psychologists, however, argue that boredom serves a purpose. It is, they say, a signal that what we are doing is no longer satisfying and that we should seek something more meaningful. Just as pain warns us of physical harm, boredom prompts us to change our situation.`,
    `There is also evidence that boredom can foster creativity. In one experiment, participants who had first spent fifteen minutes copying numbers from a telephone directory went on to think of more uses for a pair of plastic cups than those who had not. Deprived of stimulation, it seems, the mind begins to wander and form unexpected connections.`,
    `If so, the constant stimulation supplied by our devices may come at a price. By never allowing ourselves to be bored, we may be surrendering opportunities for reflection and invention.`,
  ], [['just as A, B', 'Aと同じようにB'], ['foster ~', '〜をはぐくむ'], ['go on to ~', '続いて〜する'], ['come at a price', '代償をともなう']], [
    q('r4-06-1', 1, 'detail', 'What does the first paragraph say about modern technology?', [
      'It has made it very easy to escape from boredom', 'It has made people more patient', 'It has eliminated spare moments from our lives', 'It encourages us to accept boredom'],
      '「現代の技術は逃避を苦もないものにした」。スマホで空いた時間をすぐ埋められる。',
      `modern technology has made escape effortless`, '現代の技術は、逃れることを苦もないものにした',
      'make + O + C（effortless）「OをCにする」。'),
    q('r4-06-2', 2, 'reason', 'Why do some psychologists compare boredom to pain?', [
      'Both are signals that push us to change our situation', 'Both are caused by spending too much time on phones', 'Both are physical conditions needing medical care', 'Both disappear if we ignore them long enough'],
      'Just as A, B「Aと同じようにB」：痛みが害を知らせるように、退屈は状況を変えるよう促す。',
      `Just as pain warns us of physical harm, boredom prompts us to change our situation.`, '痛みが身体の害を警告するのと同じように、退屈は私たちに状況を変えるよう促す',
      'prompt + 人 + to ~「人に〜するよう促す」。'),
    q('r4-06-3', 3, 'detail', 'What happened in the experiment described in the third paragraph?', [
      'Participants who first did a dull task produced more ideas', 'Participants who copied numbers were too tired to think', 'Participants who were not bored produced the most ideas', 'Participants refused to finish the boring task'],
      '「最初に電話帳から数字を写した人は、そうでない人よりコップの使い道を多く思いついた」。',
      `went on to think of more uses for a pair of plastic cups than those who had not`, 'その後、そうしなかった人よりもプラスチックのコップの使い道を多く考え出した',
      'Deprived of stimulation, ~ は過去分詞の分詞構文「刺激を奪われると」。'),
    q('r4-06-4', 4, 'main', 'What does the author suggest in the final paragraph?', [
      'Always avoiding boredom may cost us chances to reflect and create', 'Smartphones should be banned from schools', 'Boredom is more harmful than pain', 'People should do dull tasks every day'],
      '「退屈を決して許さないことで、内省や発明の機会を手放しているのかもしれない」。',
      `By never allowing ourselves to be bored, we may be surrendering opportunities for reflection and invention.`, '自分が退屈するのを決して許さないことで、私たちは内省や発明の機会を手放しているのかもしれない',
      'If so「もしそうなら」：前段落の内容を受ける。'),
  ]),

  p('r4-07', 4, 'Beyond GDP', 'GDPで豊かさは測れるか', [
    `For most of the twentieth century, the success of a national economy was judged largely by a single figure: gross domestic product, or GDP, the total value of goods and services produced in a year. When GDP rose, governments claimed credit; when it fell, they faced criticism.`,
    `GDP is a useful measure, but it was never designed to capture everything that matters. It counts money spent on cleaning up after a disaster as a contribution to the economy, yet ignores the damage the disaster caused. It includes the value of timber that is cut and sold, but not the loss of the forest. Nor does it include unpaid work such as caring for children or elderly relatives.`,
    `For these reasons, economists have begun to experiment with broader measures of progress. Some combine income with indicators of health and education; others simply ask people how satisfied they are with their lives.`,
    `Such measures have problems of their own. Happiness is difficult to define, and survey answers can be swayed by the weather or the wording of a question. Still, many argue that an imperfect measure of what we value is preferable to a precise measure of something else.`,
  ], [['claimed credit', '手柄を主張した（claim credit）'], ['Nor does it ~', 'それはまた〜もしない'], ['of one\'s own', '独自の'], ['be preferable to ~', '〜より好ましい']], [
    q('r4-07-1', 1, 'detail', 'According to the first paragraph, how was economic success judged in the twentieth century?', [
      'Mainly by a single figure, GDP', 'By a combination of health and education indicators', 'By surveys of public satisfaction', 'By the number of disasters avoided'],
      '「主に一つの数字、GDPで判断された」。',
      `the success of a national economy was judged largely by a single figure`, '国の経済の成功は、主にたった一つの数字によって判断された',
      'セミコロン（;）で対照的な2文をつなぐ：rose → credit / fell → criticism。'),
    q('r4-07-2', 2, 'not', 'Which of the following is NOT counted in GDP, according to the passage?', [
      'Unpaid work such as caring for family members', 'Money spent on cleaning up after a disaster', 'The value of timber that is cut and sold', 'Goods and services produced during the year'],
      '「Nor does it include 〜（また〜も含まない）」：無償の世話。他の3つは数えられる。NOT問題。',
      `Nor does it include unpaid work such as caring for children or elderly relatives.`, 'また、子どもや高齢の親族の世話のような無償労働も含まない',
      'Nor + 倒置（does it include）：否定の追加。入試頻出。'),
    q('r4-07-3', 3, 'detail', 'What do the broader measures mentioned in the third paragraph do?', [
      'Some combine income with health and education, while others ask about life satisfaction', 'They measure only the total value of goods and services', 'They replace income with the number of trees in a country', 'They count the cost of disasters as economic growth'],
      '「所得と健康・教育の指標を組み合わせるものもあれば、生活満足度を直接尋ねるものもある」。',
      `Some combine income with indicators of health and education; others simply ask people how satisfied they are with their lives.`, '所得と健康・教育の指標を組み合わせるものもあれば、人々に生活にどれだけ満足しているかを尋ねるだけのものもある',
      'Some ~; others ...「〜するものもあれば…するものもある」。'),
    q('r4-07-4', 4, 'paraphrase', 'What does the final sentence mean?', [
      'It is better to measure roughly what matters than to measure exactly what matters less', 'Precise measures are always better than imperfect ones', 'GDP should be abolished in every country', 'No measure of progress can ever be useful'],
      '「価値あるものの不完全な尺度は、別のものの正確な尺度より好ましい」。Still「それでもなお」に注意。',
      `an imperfect measure of what we value is preferable to a precise measure of something else`, '私たちが大切にしているものの不完全な尺度は、別のものの正確な尺度より好ましい',
      'be preferable to ~（than ではなく to）。'),
  ]),

  p('r4-08', 4, 'Is a Tomato a Fruit?', 'トマトは野菜か果物か', [
    `Is a tomato a fruit or a vegetable? To a botanist, the answer is unambiguous. A fruit is the part of a flowering plant that develops from the flower and contains the seeds. By this definition, tomatoes, cucumbers, and even peppers are fruits.`,
    `Yet few cooks would dream of putting tomatoes in a fruit salad. In the kitchen, the distinction rests not on biology but on taste and use: fruits are generally sweet and eaten as desserts, whereas vegetables are savory and served as part of a main meal.`,
    `In 1893, the United States Supreme Court was asked to settle the question, because imported vegetables were taxed while fruits were not. The court ruled that tomatoes should be treated as vegetables, on the grounds that this was how ordinary people understood them.`,
    `The case illustrates a broader point. We tend to assume that our words mirror natural divisions in the world, waiting to be discovered. In fact, many categories are created to serve particular purposes. Neither the botanist nor the cook is wrong; they are simply answering different questions.`,
  ], [['would not dream of ~ing', '〜しようとは夢にも思わない'], ['rest on ~', '〜に基づく'], ['on the grounds that ~', '〜という理由で'], ['neither A nor B', 'AもBも〜ない']], [
    q('r4-08-1', 1, 'detail', 'By the botanist\'s definition, what makes something a fruit?', [
      'It develops from the flower and contains the seeds', 'It tastes sweet and is eaten as a dessert', 'It grows on trees rather than on the ground', 'It is taxed when imported'],
      '「果実とは、花から発達し種を含む、花を咲かせる植物の部分である」。',
      `A fruit is the part of a flowering plant that develops from the flower and contains the seeds.`, '果実とは、花を咲かせる植物のうち、花から発達して種を含む部分である',
      'unambiguous「あいまいでない・明確な」。'),
    q('r4-08-2', 2, 'detail', 'In the kitchen, on what is the distinction between fruits and vegetables based?', [
      'Taste and the way the food is used', 'The biological structure of the plant', 'The price of the food', 'Where the plant is grown'],
      'not on biology but on taste and use「生物学ではなく味と用途に基づく」。',
      `the distinction rests not on biology but on taste and use`, 'その区別は生物学ではなく、味と用途に基づいている',
      'few cooks would dream of ~「〜しようと思う料理人はほとんどいない」。'),
    q('r4-08-3', 3, 'reason', 'On what grounds did the court decide that tomatoes were vegetables?', [
      'That was how ordinary people understood them', 'The botanical definition of a fruit', 'The sweetness of tomatoes', 'The amount of tax that would be collected'],
      'on the grounds that ~「〜という理由で」：普通の人々の理解の仕方だったから。',
      `on the grounds that this was how ordinary people understood them`, 'それが普通の人々の理解の仕方であるという理由で',
      'because imported vegetables were taxed while fruits were not ＝裁判になった理由。'),
    q('r4-08-4', 4, 'main', 'What broader point does the author draw from the case?', [
      'Categories often depend on the purpose for which they are made', 'Words always reflect natural divisions in the world', 'Cooks understand plants better than botanists', 'Courts should decide scientific questions'],
      '「多くの分類は特定の目的のために作られる」。植物学者も料理人も間違っていない。',
      `many categories are created to serve particular purposes`, '多くの分類は、特定の目的に役立つために作られている',
      'Neither A nor B「AもBも〜ない」。'),
  ]),

  p('r4-09', 4, 'Do Grades Motivate?', '成績は意欲を高めるか', [
    `Grades are so familiar a part of schooling that it is hard to imagine education without them. Teachers use them to track progress, parents to check on their children, and universities to select applicants. Many also assume that grades motivate students to work harder.`,
    `Research on motivation complicates this assumption. Psychologists distinguish between intrinsic motivation, which springs from interest in an activity itself, and extrinsic motivation, which depends on rewards or punishments. When people are rewarded for doing something they already enjoy, their interest can actually decline, as they come to see themselves as working for the prize rather than for the pleasure of the task.`,
    `In one study, students who received only written comments on their work showed greater interest and better performance on later tasks than those who received grades, or grades together with comments. When a grade was present, it seems, students attended to the number and ignored the advice.`,
    `This does not prove that grades should be abolished. It does suggest, however, that feedback is most valuable when it tells learners how to improve, not merely where they stand.`,
  ], [['so ~ a 名詞 that ...', 'あまりに〜な…なので'], ['spring from ~', '〜から生じる'], ['come to ~', '〜するようになる'], ['attend to ~', '〜に注意を向ける']], [
    q('r4-09-1', 1, 'detail', 'According to the first paragraph, what do many people assume about grades?', [
      'That they encourage students to study harder', 'That they are unnecessary in education', 'That universities no longer use them', 'That parents rarely look at them'],
      '「成績が生徒をもっと勉強させる動機になると多くの人は思っている」。',
      `Many also assume that grades motivate students to work harder.`, '多くの人はまた、成績が生徒をもっと努力させる動機になると思っている',
      'so familiar a part of ~ that ...：so + 形容詞 + a + 名詞 の語順に注意。parents (use them) to ... の省略も。'),
    q('r4-09-2', 2, 'reason', 'Why can rewards reduce interest in an activity people already enjoy?', [
      'People begin to think they are doing it for the reward rather than for enjoyment', 'Rewards are usually too small to matter', 'People become tired of receiving rewards', 'Rewards make the activity more difficult'],
      'as 以下「楽しさのためではなく賞品のために取り組んでいると自分を見るようになるから」。',
      `they come to see themselves as working for the prize rather than for the pleasure of the task`, '彼らは、課題の楽しさのためではなく賞品のために取り組んでいると、自分のことを見るようになる',
      'intrinsic（内発的）/ extrinsic（外発的）の対比。'),
    q('r4-09-3', 3, 'detail', 'What happened when students received grades together with comments?', [
      'They focused on the grade and paid little attention to the advice', 'They performed better than those who received only comments', 'They read the comments more carefully than usual', 'They asked their teachers for more grades'],
      '「成績があると、生徒は数字に注目し助言を無視したようだ」。',
      `When a grade was present, it seems, students attended to the number and ignored the advice.`, '成績があると、生徒は数字に注意を向け、助言を無視したようだ',
      'it seems の挿入「〜のようだ」。'),
    q('r4-09-4', 4, 'main', 'What is the author\'s conclusion?', [
      'Feedback should mainly show learners how they can improve', 'Grades should be abolished immediately', 'Students work harder when they receive grades', 'Universities should stop selecting applicants'],
      '「成績廃止の証明ではない。だがフィードバックは、現在地ではなく改善の仕方を示すときに最も価値がある」。',
      `feedback is most valuable when it tells learners how to improve, not merely where they stand`, 'フィードバックは、学習者に現在地を伝えるだけでなく、どう改善すればよいかを伝えるときに最も価値がある',
      'It does suggest の does は強調「確かに示唆する」。'),
  ]),

  p('r4-10', 4, 'The Return of the Wolves', 'オオカミが戻った公園', [
    `In 1995, after an absence of some seventy years, gray wolves were reintroduced to Yellowstone National Park in the United States. The decision was fiercely debated. Ranchers living near the park feared for their cattle, and many people regarded wolves as dangerous pests.`,
    `The consequences of the wolves' return reached far beyond what most had anticipated. Before 1995, the park's elk population had grown so large that the animals stripped young trees along the riverbanks. Once wolves were present, the elk not only declined in number but also changed their behavior, avoiding open valleys where they could easily be ambushed.`,
    `As a result, willows and other trees began to recover, providing food and building material for beavers, whose dams in turn created ponds for fish and birds. Some scientists describe this chain of events as a "trophic cascade," in which a change at the top of the food chain ripples down through the entire ecosystem.`,
    `Others caution that the story has been oversimplified. Changes in climate and human activity also affected the park, and the recovery of vegetation has been uneven. Even so, Yellowstone has prompted scientists to pay closer attention to the role predators play in sustaining healthy ecosystems.`,
  ], [['fear for ~', '〜の身を案じる'], ['not only A but also B', 'AだけでなくBも'], ['in turn', '今度は・順に'], ['even so', 'それでも']], [
    q('r4-10-1', 1, 'reason', 'Why was the reintroduction of wolves fiercely debated?', [
      'Some people were worried about their livestock and saw wolves as harmful', 'Scientists believed wolves would destroy the trees', 'The park did not have enough space for wolves', 'Wolves had never lived in the area before'],
      '「牧場主は牛の身を案じ、多くの人がオオカミを危険な害獣とみなした」。',
      `Ranchers living near the park feared for their cattle, and many people regarded wolves as dangerous pests.`, '公園の近くに住む牧場主は牛の身を案じ、多くの人々はオオカミを危険な害獣とみなした',
      'regard A as B「AをBとみなす」。'),
    q('r4-10-2', 2, 'detail', 'How did the elk change after the wolves returned?', [
      'They became fewer and avoided open valleys', 'They grew in number and ate more trees', 'They moved to the riverbanks to find food', 'They began to hunt beavers'],
      'not only A but also B：数が減っただけでなく、待ち伏せされやすい開けた谷を避けるようになった。',
      `the elk not only declined in number but also changed their behavior, avoiding open valleys where they could easily be ambushed`, 'エルクは数が減っただけでなく行動も変え、簡単に待ち伏せされる開けた谷を避けるようになった',
      ', avoiding ~ は分詞構文（具体的な説明）。'),
    q('r4-10-3', 3, 'paraphrase', 'What is a "trophic cascade," as described in the passage?', [
      'A process in which a change at the top of the food chain affects the whole ecosystem', 'A waterfall created by beaver dams', 'A sudden increase in the number of predators', 'A method of counting animals in a park'],
      '「食物連鎖の頂点の変化が生態系全体へ波及していく」一連の出来事。',
      `a change at the top of the food chain ripples down through the entire ecosystem`, '食物連鎖の頂点での変化が、生態系全体へと波及していく',
      'whose dams in turn created ~：関係代名詞 whose＋in turn「今度は」。'),
    q('r4-10-4', 4, 'detail', 'What do some scientists caution about the Yellowstone story?', [
      'It may be too simple, since other factors also influenced the park', 'Wolves had no effect on the ecosystem whatsoever', 'Beavers were the real cause of the changes', 'The reintroduction should be reversed'],
      '「話は単純化されすぎている。気候や人間活動も影響し、植物の回復はむらがある」。',
      `Others caution that the story has been oversimplified.`, '話は単純化されすぎていると注意を促す科学者もいる',
      'Even so「それでも」：反論を認めたうえで結論へ。'),
  ]),

  p('r4-11', 4, 'Reading on Screens', '画面で読むと理解は浅くなるか', [
    `More and more reading now takes place on screens rather than on paper. Students read textbooks on tablets; adults read the news on their phones. Does the medium make a difference to how well we understand what we read?`,
    `A substantial body of research suggests that it can. When people read long or complex texts, those reading on paper tend to understand and remember them slightly better than those reading the same texts on a screen. Strikingly, the gap is widest when readers are under time pressure, and it has not narrowed as people have grown more accustomed to digital devices.`,
    `Researchers offer several explanations. Screens may encourage a habit of rapid skimming, acquired while scrolling through short messages, which readers then carry over to texts that require careful attention. Paper may also give readers a physical sense of where they are in a text, helping them build a mental map of its structure.`,
    `None of this renders digital reading useless. For short, simple texts, the difference is small or absent. The point is that readers should be aware of their habits and slow down when a text demands it.`,
  ], [['make a difference', '違いを生む・影響する'], ['grow accustomed to ~', '〜に慣れる'], ['carry over to ~', '〜に持ち込む'], ['render ~ useless', '〜を役に立たなくする']], [
    q('r4-11-1', 1, 'detail', 'What question does the first paragraph raise?', [
      'Whether the medium we read on affects our understanding', 'Whether students should stop using tablets', 'Whether newspapers will disappear', 'Whether adults read more than students'],
      '「媒体は、読んだものをどれだけ理解するかに違いを生むか」。',
      `Does the medium make a difference to how well we understand what we read?`, '媒体は、読んだものをどれだけよく理解するかに違いを生むのだろうか',
      'make a difference to ~「〜に影響する」。'),
    q('r4-11-2', 2, 'detail', 'According to the research, when is the gap between paper and screens widest?', [
      'When readers have limited time', 'When readers are very familiar with devices', 'When the texts are short and simple', 'When readers can adjust the text size'],
      '「その差は読み手が時間に追われているときに最も大きい」。慣れても縮まっていない点にも注意。',
      `the gap is widest when readers are under time pressure`, 'その差は、読み手が時間に追われているときに最も大きい',
      'Strikingly「著しいことに」：文修飾の副詞。'),
    q('r4-11-3', 3, 'reason', 'Which explanation for the difference is mentioned in the third paragraph?', [
      'Readers may apply a habit of quick skimming to texts that need careful reading', 'Screens damage readers\' eyesight', 'Digital texts contain more difficult words', 'Paper books are usually shorter than digital ones'],
      '「短いメッセージをスクロールするうちに身についた流し読みの癖を、丁寧に読むべき文章にも持ち込むのかもしれない」。',
      `which readers then carry over to texts that require careful attention`, 'それを読み手は、注意深く読む必要がある文章にも持ち込んでしまう',
      'acquired while scrolling ~ は過去分詞の挿入。'),
    q('r4-11-4', 4, 'main', 'Which statement is consistent with the final paragraph?', [
      'Readers should slow down when a text requires careful reading', 'Digital reading is useless for students', 'Screens always lead to poorer understanding', 'Paper should replace screens in schools'],
      '「画面で読むことが無駄になるわけではない。大事なのは自分の癖を自覚し、必要なときにゆっくり読むこと」。',
      `readers should be aware of their habits and slow down when a text demands it`, '読み手は自分の癖を自覚し、文章がそれを求めるときには速度を落とすべきだ',
      'None of this renders ~ useless「このどれも〜を無用にはしない」（無生物主語）。'),
  ]),

  p('r4-12', 4, 'The Placebo Puzzle', 'プラセボの不思議', [
    `A placebo is a treatment with no active ingredient, such as a sugar pill. In clinical trials, some patients receive the real drug while others receive a placebo, so that researchers can tell whether the drug works better than the mere expectation of being treated. Remarkably, patients given placebos often report genuine improvement, particularly in conditions such as pain and anxiety.`,
    `For a long time, it was assumed that placebos work only if patients are deceived into believing they are taking a real drug. Recent studies have called this assumption into question. In several trials, patients with chronic pain were given pills and told frankly that they contained no medicine. Many still reported feeling better than patients who received nothing at all.`,
    `One theory holds that the ritual of treatment itself — the attention of a doctor, the act of swallowing a pill — triggers the body's own mechanisms for relieving pain. Another suggests that patients have learned, through past experience, to associate taking pills with relief.`,
    `Placebos are no cure-all; they do not shrink tumors or mend broken bones. But the research reminds us that how treatment is delivered can matter almost as much as what is delivered.`,
  ], [['deceive ~ into ~ing', '〜をだまして…させる'], ['call ~ into question', '〜に疑問を投げかける'], ['associate A with B', 'AをBと結びつける'], ['cure-all', '万能薬']], [
    q('r4-12-1', 1, 'reason', 'Why do clinical trials give some patients a placebo?', [
      'To find out whether a drug is more effective than the expectation of treatment', 'To save money on expensive drugs', 'To deceive patients into feeling better', 'To test whether sugar is harmful'],
      'so that 以下「薬が、治療を受けているという期待だけより効くかを見分けるため」。',
      `so that researchers can tell whether the drug works better than the mere expectation of being treated`, '薬が、治療されているという期待だけよりも効くかどうかを研究者が見分けられるように',
      'tell whether ~「〜かどうかを見分ける」。'),
    q('r4-12-2', 2, 'detail', 'What was surprising about the recent trials?', [
      'Patients improved even though they knew the pills contained no medicine', 'Patients refused to take pills without medicine', 'Placebos worked only when patients were deceived', 'Patients felt worse after taking placebos'],
      '「薬が入っていないと率直に告げられても、多くの人が何も受けなかった患者より良くなったと報告した」。',
      `Many still reported feeling better than patients who received nothing at all.`, 'それでも多くの患者が、何も受けなかった患者より気分がよいと報告した',
      'call ~ into question「〜に疑問を投げかける」。'),
    q('r4-12-3', 3, 'detail', 'Which explanation is offered in the third paragraph?', [
      'The ritual of treatment may activate the body\'s own pain-relieving mechanisms', 'Sugar pills contain small amounts of medicine', 'Doctors secretly add drugs to placebos', 'Patients forget that they are in pain'],
      '「治療という儀式そのもの（医師の関心、錠剤を飲む行為）が、体自身の痛みを和らげる仕組みを引き起こす」。',
      `the ritual of treatment itself — the attention of a doctor, the act of swallowing a pill — triggers the body's own mechanisms for relieving pain`, '治療という儀式そのもの、つまり医師の関心や錠剤を飲む行為が、体自身の痛みを和らげる仕組みを引き起こす',
      'ダッシュではさまれた部分は具体例の挿入。主語 the ritual → 動詞 triggers。'),
    q('r4-12-4', 4, 'main', 'What is the main lesson of the passage?', [
      'How a treatment is given can be nearly as important as the treatment itself', 'Placebos can cure any illness', 'Doctors should never tell patients the truth', 'Pills are always better than other treatments'],
      '「治療の届け方は、何を届けるかとほぼ同じくらい重要になりうる」。腫瘍や骨折は治さないので万能ではない。',
      `how treatment is delivered can matter almost as much as what is delivered`, '治療がどのように届けられるかは、何が届けられるかとほとんど同じくらい重要になりうる',
      'how ~ / what ~ の名詞節の対比。'),
  ]),
];
