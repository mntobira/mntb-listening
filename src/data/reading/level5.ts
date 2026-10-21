/** レベル5：最難関（東大・京大・医学部）。抽象度の高い論説・4段落・各55〜90語・段落ごとの問い（英語） */
import { p, q } from './types';

export const LEVEL5 = [
  p('r5-01', 5, 'The Map and the Territory', '地図と現地', [
    `Every map is a lie, but a useful one. To be of any value, a map must leave out almost everything about the place it represents. A map that recorded every tree, every stone, and every passing cloud would have to be as large as the land itself, and would therefore be useless. The cartographer's art lies not in reproducing reality but in deciding what to ignore.`,
    `The same holds for scientific models, economic forecasts, and arguably for language itself. When we describe a person as "generous" or a policy as "fair," we select certain features of a complex reality and pass over others. Such simplification is not a defect of thought; it is the very condition that makes thought possible.`,
    `The danger arises when we forget that a simplification has taken place. A traveler who trusts his map so completely that he walks into a river it fails to show has confused the representation with the thing represented.`,
    `The appropriate response is not to abandon maps, which would leave us lost, but to hold them lightly: to use them while remembering what they were designed to show and what, of necessity, they were designed to omit.`,
  ], [['be of any value', '少しでも価値がある'], ['hold for ~', '〜に当てはまる'], ['pass over ~', '〜を無視する'], ['of necessity', '必然的に']], [
    q('r5-01-1', 1, 'reason', 'Why does the author call every map "a lie, but a useful one"?', [
      'A map is valuable precisely because it omits most details of reality', 'Cartographers deliberately include false information', 'Maps are always out of date by the time they are printed', 'A map is useful only if it is as large as the land itself'],
      '地図は役立つためにほとんどすべてを省く。現実をそのまま写さない（lie）が、だからこそ役立つ。',
      `To be of any value, a map must leave out almost everything about the place it represents.`, '少しでも価値を持つためには、地図はそれが表す場所についてのほとんどすべてを省かなければならない',
      'would have to be ~：仮定法（もしすべてを記録したら）。'),
    q('r5-01-2', 2, 'paraphrase', 'What does the author mean by saying simplification is "the very condition that makes thought possible"?', [
      'We cannot think at all without selecting some features and ignoring others', 'Simple thoughts are better than complex ones', 'Language prevents us from thinking clearly', 'Only scientists need to simplify reality'],
      '単純化は思考の欠陥ではなく、思考を可能にする条件そのもの＝選んで捨てなければ考えられない。',
      `Such simplification is not a defect of thought; it is the very condition that makes thought possible.`, 'そうした単純化は思考の欠陥ではなく、まさに思考を可能にしている条件なのだ',
      'not A; it is B（not A but B の変形）。the very「まさにその」。'),
    q('r5-01-3', 3, 'detail', 'According to the third paragraph, what is the real danger of simplification?', [
      'Forgetting that the simplification has been made', 'Making a map that is too detailed to read', 'Describing people as "generous" or "fair"', 'Relying on more than one model at a time'],
      '「危険は、単純化が行われたことを忘れるときに生じる」。川に入る旅人は表象と実物を取り違えた。',
      `The danger arises when we forget that a simplification has taken place.`, '危険は、単純化が行われたことを私たちが忘れるときに生じる',
      'confuse A with B「AをBと混同する」。'),
    q('r5-01-4', 4, 'main', 'Which attitude toward maps and models does the author recommend?', [
      'Using them while keeping in mind what they leave out', 'Abandoning them in favour of direct experience', 'Trusting them completely to avoid confusion', 'Adding as many details to them as possible'],
      '「捨てるのではなく軽く持つ：何を示し、何を省くよう作られたかを覚えたまま使う」。',
      `to use them while remembering what they were designed to show and what, of necessity, they were designed to omit`, '何を示すように作られ、そして必然的に何を省くように作られたかを覚えたまま、それらを使うこと',
      'not to A but to B。コロン以下は hold them lightly の言い換え。'),
  ]),

  p('r5-02', 5, 'The Tyranny of Metrics', '数値指標の暴走', [
    `When a measure becomes a target, it ceases to be a good measure. This principle, commonly attributed to the economist Charles Goodhart, describes a pattern that recurs wherever institutions attempt to manage performance through numbers.`,
    `Consider a hospital judged by the proportion of patients seen within four hours of arriving at its emergency department. The figure was chosen because it seemed to reflect the quality of care. Once staff are rewarded or penalized according to it, however, their behavior shifts. Patients may be moved to an area that technically counts as "seen," or treated hastily as the deadline approaches. The number improves; the care it was meant to reflect may not.`,
    `The problem is not that the people involved are dishonest. Most are responding rationally to the incentives they face. Rather, any single indicator captures only part of what an organization is trying to achieve, and when attention is concentrated on that part, the unmeasured remainder tends to be neglected.`,
    `None of this implies that measurement should be abandoned; without data, organizations would be blind to their own failures. What it implies is that numbers should inform judgment rather than replace it.`,
  ], [['cease to ~', '〜しなくなる'], ['be attributed to ~', '〜によるとされる'], ['respond to ~', '〜に反応する'], ['inform ~', '〜に情報を与える・〜の判断材料になる']], [
    q('r5-02-1', 1, 'paraphrase', 'What does Goodhart\'s principle claim?', [
      'A figure loses its value as a measure once people aim directly at it', 'Every organization should set numerical targets', 'Good measures are impossible to design', 'Economists are better at management than doctors'],
      '「指標が目標になると、よい指標ではなくなる」。人がそれ自体を狙うと、本来測りたいものを映さなくなる。',
      `When a measure becomes a target, it ceases to be a good measure.`, 'ある尺度が目標になると、それはよい尺度ではなくなる',
      'recur「繰り返し起こる」。'),
    q('r5-02-2', 2, 'inference', 'What does the hospital example illustrate?', [
      'Targeting a figure can improve the number without improving what it represents', 'Emergency departments are generally poorly managed', 'Four hours is too short a time to treat patients', 'Staff deliberately falsify hospital records'],
      '「数字は改善するが、それが反映するはずだったケアは改善しないかもしれない」。',
      `The number improves; the care it was meant to reflect may not.`, '数字は改善する。だが、それが反映するはずだったケアは改善しないかもしれない',
      'may not (improve) の省略。セミコロンで対比。'),
    q('r5-02-3', 3, 'reason', 'How does the author explain the behaviour of the people involved?', [
      'They are reacting sensibly to the incentives placed on them', 'They are dishonest and wish to deceive their managers', 'They do not understand how the indicator is calculated', 'They oppose any form of measurement'],
      '「関係者が不誠実なのではない。多くは直面する誘因に合理的に反応している」。',
      `Most are responding rationally to the incentives they face.`, '大半は、自分たちが直面している誘因に合理的に反応しているのだ',
      'The problem is not that A. Rather, B.（not A but B）'),
    q('r5-02-4', 4, 'main', 'What is the author\'s conclusion?', [
      'Numbers should support human judgment rather than take its place', 'Measurement should be abandoned altogether', 'Organizations should rely only on numbers', 'Data makes organizations blind to their failures'],
      '「数値は判断を置き換えるのではなく、判断に情報を与えるべきだ」。測定の放棄は否定している。',
      `numbers should inform judgment rather than replace it`, '数値は判断に取って代わるのではなく、判断の材料となるべきだ',
      'without data, ... would be ~：仮定法「データがなければ〜だろう」。'),
  ]),

  p('r5-03', 5, 'Memory as Reconstruction', '記憶は再構成される', [
    `We tend to picture memory as a kind of recording. An event occurs, the brain stores it, and when we remember, we simply play the recording back. On this view, forgetting is a matter of the recording fading, and a vivid memory is a reliable one.`,
    `Decades of research have shown this picture to be mistaken. Remembering is not retrieval but reconstruction: each time we recall an event, we rebuild it from fragments, filling the gaps with general knowledge, expectations, and information acquired afterward. In a well-known experiment, people who had watched a film of a car accident estimated higher speeds when asked how fast the cars were going when they "smashed" into each other than when the word "hit" was used.`,
    `Particularly troubling is the finding that confidence is a poor guide to accuracy. Memories of dramatic public events, which people often describe as perfectly clear, have been shown to change substantially over the years, while their owners remain certain that nothing has changed.`,
    `From an evolutionary perspective, this flexibility may be less a flaw than a feature. A memory designed to guide future action has little reason to preserve the past exactly; what it needs is to extract what is useful and update it as circumstances change.`,
  ], [['show ~ to be ...', '〜が…であると示す'], ['filling the gaps', '隙間を埋めること（fill the gaps）'], ['a poor guide to ~', '〜のあてにならない目安'], ['less A than B', 'AというよりむしろB']], [
    q('r5-03-1', 1, 'detail', 'According to the "recording" view of memory, which of the following is true?', [
      'A vivid memory can be trusted to be accurate', 'Memories are rebuilt each time they are recalled', 'Forgetting happens because memories are updated', 'Memory exists mainly to guide future action'],
      '録音のような見方では「鮮明な記憶は信頼できる記憶」とされる。筆者はこれを否定する。',
      `a vivid memory is a reliable one`, '鮮明な記憶は信頼できる記憶である',
      'On this view「この見方では」：筆者の意見ではなく紹介。'),
    q('r5-03-2', 2, 'inference', 'What did the car accident experiment demonstrate?', [
      'The wording of a later question can alter what people recall', 'People remember fast cars better than slow ones', 'Films are a poor way of studying memory', 'Most people can estimate speed accurately'],
      'smashed と聞かれた人のほうが速度を高く見積もった。後から得た情報で記憶が作り直される例。',
      `estimated higher speeds when asked how fast the cars were going when they "smashed" into each other than when the word "hit" was used`, '車が「激突した」ときにどれくらい速かったかと聞かれると、「ぶつかった」という語が使われたときより高い速度を見積もった',
      'not retrieval but reconstruction「取り出しではなく再構成」。'),
    q('r5-03-3', 3, 'paraphrase', 'What is "particularly troubling," according to the third paragraph?', [
      'Feeling sure about a memory does not mean the memory is accurate', 'Memories of public events fade completely within a year', 'People refuse to admit that their memories have changed', 'Dramatic events are impossible to remember'],
      '「自信は正確さのよい目安にならない」。記憶が大きく変わっても本人は変わっていないと確信している。',
      `confidence is a poor guide to accuracy`, '自信は正確さのあてにならない目安である',
      'Particularly troubling is the finding that ~：補語が文頭に出た倒置。the finding that は同格。'),
    q('r5-03-4', 4, 'main', 'Why might the reconstructive nature of memory be "less a flaw than a feature"?', [
      'Memory evolved to guide future behaviour, not to keep an exact record of the past', 'Exact memories would take up too much space in the brain', 'Early humans did not need to remember anything', 'Reconstruction makes memories more vivid'],
      '「未来の行動を導く記憶には、過去を正確に保存する理由がほとんどない」。less A than B「AというよりB」。',
      `A memory designed to guide future action has little reason to preserve the past exactly`, '未来の行動を導くよう設計された記憶には、過去を正確に保存する理由がほとんどない',
      'less a flaw than a feature「欠陥というよりむしろ特性」。'),
  ]),

  p('r5-04', 5, 'The Problem of Other Minds', '他者の心', [
    `I know that I have thoughts and feelings because I experience them directly. But how do I know that anyone else does? I can observe other people's behavior: they weep, laugh, and complain of pain. Yet behavior is not experience. It is at least conceivable that another person might act exactly as I do while experiencing nothing whatsoever.`,
    `The most common response is an argument from analogy: since others are physically similar to me and behave as I do in similar circumstances, it is reasonable to infer that they have similar inner lives. Critics point out, however, that this argument generalizes from a single case — my own — which would be considered weak reasoning in any other context.`,
    `A different response holds that the puzzle rests on a confusion. On this view, we do not first inspect our own experience in private and then project it onto others. Rather, we learn words like "pain" in a shared public world, by observing how they are used in connection with behavior. If so, the skeptic is using a vocabulary whose very meaning presupposes what he doubts.`,
    `Whatever the merits of these arguments, the practical stakes are rising. As machines grow ever more adept at imitating human conversation, the question of what, if anything, lies behind behavior is no longer merely academic.`,
  ], [['conceivable', '考えうる'], ['infer that ~', '〜と推論する'], ['rest on ~', '〜に基づく'], ['presuppose ~', '〜を前提とする']], [
    q('r5-04-1', 1, 'detail', 'What possibility does the first paragraph raise?', [
      'Someone might behave exactly as I do without having any experience at all', 'Other people might be able to read my thoughts', 'Behaviour might be identical to experience', 'I might not have any feelings myself'],
      '「他人が私とまったく同じように振る舞いながら、何も経験していないことも少なくとも考えうる」。',
      `another person might act exactly as I do while experiencing nothing whatsoever`, '他人は、何一つ経験していないのに、私とまったく同じように振る舞うかもしれない',
      'Yet behavior is not experience.「しかし振る舞いは経験ではない」が論点。'),
    q('r5-04-2', 2, 'reason', 'What weakness do critics find in the argument from analogy?', [
      'It draws a general conclusion from only one example', 'It ignores the physical differences between people', 'It relies too heavily on scientific experiments', 'It assumes that behaviour and experience are the same'],
      '「ただ一つの事例（自分）から一般化しており、他の文脈なら弱い推論とされる」。',
      `this argument generalizes from a single case — my own — which would be considered weak reasoning in any other context`, 'この議論はただ一つの事例、つまり自分自身から一般化しており、それは他のどんな文脈でも弱い推論とみなされるだろう',
      'would be considered：仮定法（他の文脈なら）。'),
    q('r5-04-3', 3, 'inference', 'According to the view in the third paragraph, why is the skeptic\'s position problematic?', [
      'The words the skeptic uses already assume that others have minds', 'The skeptic has never observed other people\'s behaviour', 'The skeptic cannot prove that he himself has a mind', 'The skeptic relies on an argument from analogy'],
      '心の語は公共の世界で行動と結びつけて学ばれる。だから懐疑論者は、自分が疑うこと（他者の心）を前提とする語彙を使っている。',
      `the skeptic is using a vocabulary whose very meaning presupposes what he doubts`, '懐疑論者は、その意味そのものが自分の疑っていることを前提としている語彙を使っている',
      'not first A and then B. Rather, C.（not A but B）'),
    q('r5-04-4', 4, 'main', 'Why does the author say the question is "no longer merely academic"?', [
      'Machines that imitate human conversation make it a practical concern', 'Philosophers have finally solved the problem', 'Most people now doubt that others have minds', 'Scientists can now observe experience directly'],
      '「機械が人間の会話を模倣するのがますます巧みになるにつれ」、行動の背後に何があるかは実際的な問題になる。',
      `As machines grow ever more adept at imitating human conversation`, '機械が人間の会話を模倣することにますます巧みになるにつれて',
      'Whatever the merits of ~「〜の利点がどうであれ」（譲歩）。what, if anything,「何かあるとすれば何が」。'),
  ]),

  p('r5-05', 5, 'Risk and Perception', 'リスクの感じ方', [
    `Statistically, driving is far more dangerous than flying. Yet many people who drive daily without a second thought feel genuine fear on boarding an aircraft. Such discrepancies between measured and perceived risk are not simply errors to be corrected by better information; they reveal something about how human beings evaluate danger.`,
    `We judge risks not only by their probability but by their character. Risks imposed on us seem worse than risks we choose; unfamiliar risks seem worse than those we meet every day; and risks that could kill many people at once seem worse than those that kill the same number one at a time.`,
    `Experts sometimes dismiss such reactions as irrational. But this dismissal assumes that the only thing that matters about a risk is the expected number of deaths. People may reasonably care about other things as well: whether a risk is fairly distributed, whether it was accepted voluntarily, and whether those responsible can be held to account.`,
    `This is not to say that perception should always prevail over calculation; fear can be manipulated. The challenge is to treat public perception neither as noise to be eliminated nor as a verdict to be obeyed, but as evidence about what people value.`,
  ], [['without a second thought', 'ためらわずに'], ['on ~ing', '〜するとすぐに'], ['dismiss A as B', 'AをBとして退ける'], ['be held to account', '責任を問われる']], [
    q('r5-05-1', 1, 'inference', 'What does the author suggest about the gap between measured and perceived risk?', [
      'It tells us something about how people evaluate danger', 'It can be eliminated simply by providing better statistics', 'It shows that flying is more dangerous than driving', 'It exists only among people who rarely fly'],
      '「単により良い情報で正すべき誤りではない。人間が危険をどう評価するかを明らかにする」。',
      `they reveal something about how human beings evaluate danger`, 'それらは、人間が危険をどう評価するかについて何かを明らかにする',
      'not simply A; B：単なるAではなくB。'),
    q('r5-05-2', 2, 'detail', 'According to the second paragraph, which kind of risk tends to seem worse?', [
      'A risk that is forced on us rather than chosen', 'A risk that we encounter every day', 'A risk that kills people one at a time', 'A risk that we feel we can control'],
      '「押しつけられたリスクは、自分で選んだリスクより悪く思える」。他の3つは逆。',
      `Risks imposed on us seem worse than risks we choose`, '私たちに押しつけられたリスクは、自分で選ぶリスクよりも悪く思える',
      'セミコロンで3つの対比を並べている。'),
    q('r5-05-3', 3, 'detail', 'What assumption does the author attribute to experts who dismiss public fears as irrational?', [
      'That the expected number of deaths is the only relevant feature of a risk', 'That the public has better information than experts', 'That flying is more dangerous than driving', 'That fear can never be manipulated'],
      '「その切り捨ては、リスクで重要なのは予想死者数だけだと仮定している」。',
      `this dismissal assumes that the only thing that matters about a risk is the expected number of deaths`, 'この切り捨ては、リスクについて重要なのは予想される死者数だけだと仮定している',
      'dismiss A as B「AをBとして退ける」。'),
    q('r5-05-4', 4, 'main', 'Which best summarises the author\'s position?', [
      'Public perceptions of risk should be taken seriously as information about values, but not followed blindly', 'Public fears should always determine government policy', 'Statistical calculation should replace public opinion entirely', 'Perception is mere noise that experts should ignore'],
      '「世論の受け止め方を、消すべき雑音とも従うべき判決ともせず、人々が何を大切にするかの証拠として扱う」。',
      `neither as noise to be eliminated nor as a verdict to be obeyed, but as evidence about what people value`, '取り除くべき雑音としてでも従うべき判決としてでもなく、人々が何を大切にしているかの証拠として',
      'neither A nor B, but C。'),
  ]),

  p('r5-06', 5, 'The Division of Cognitive Labor', '専門家への信頼', [
    `Modern societies depend on experts to an extent rarely acknowledged. Few of us could verify for ourselves that a vaccine is safe or that a bridge will bear the weight of the traffic crossing it. We accept such claims not because we have examined the evidence but because we trust those who have.`,
    `This dependence is often portrayed as a weakness, a failure to think for ourselves. It is better understood as a division of cognitive labor, comparable to the division of physical labor that makes an economy productive. A society in which everyone insisted on checking everything personally would know very little.`,
    `The difficulty is that trust can be abused, and the layperson is, by definition, poorly placed to tell genuine expertise from its imitation. What, then, can justify trust? Not, in most cases, the content of an expert's claims, which the layperson cannot evaluate, but features of the system in which those claims are made.`,
    `Are the experts independent of those who would profit from their conclusions? Is their work open to criticism by other experts? Does the institution have a record of correcting its own mistakes? For a citizen, these questions may matter more than "Is this claim true?"`,
  ], [['to an extent ~', '〜な程度まで'], ['for oneself', '自分で'], ['tell A from B', 'AとBを見分ける'], ['by definition', '定義上']], [
    q('r5-06-1', 1, 'reason', 'Why, according to the first paragraph, do we accept many claims?', [
      'Because we trust the people who have examined the evidence', 'Because we have checked the evidence ourselves', 'Because the claims are simple to understand', 'Because governments require us to accept them'],
      'not because A but because B：自分で証拠を調べたからではなく、調べた人を信頼しているから。',
      `not because we have examined the evidence but because we trust those who have`, '私たちが証拠を調べたからではなく、調べた人々を信頼しているから',
      'those who have (examined the evidence) の省略。'),
    q('r5-06-2', 2, 'paraphrase', 'How does the author reinterpret our dependence on experts?', [
      'As a sharing of intellectual work that allows a society to know more', 'As evidence that most people are unable to think', 'As a temporary stage that education will overcome', 'As a weakness that should be eliminated'],
      '「弱さとされがちだが、認知的な分業と理解するほうがよい」。経済を生産的にする分業と同じ。',
      `It is better understood as a division of cognitive labor`, 'それは認知的な分業として理解するほうがよい',
      'A society in which everyone insisted ~ would know very little.（仮定法的な would）'),
    q('r5-06-3', 3, 'detail', 'According to the third paragraph, why can laypeople not usually judge experts by the content of their claims?', [
      'They lack the knowledge needed to evaluate those claims', 'Experts refuse to explain their conclusions', 'The claims are kept secret by institutions', 'The content of claims changes too quickly'],
      '「素人はその内容を評価できない」ので、内容ではなく制度の特徴で判断する。',
      `the content of an expert's claims, which the layperson cannot evaluate`, '素人には評価できない、専門家の主張の内容',
      'Not A, but B（文の一部が省略された答えの形）。'),
    q('r5-06-4', 4, 'main', 'Which of the following would the author regard as a good reason to trust a source?', [
      'It has a history of admitting and correcting its own errors', 'Its experts are funded by companies that benefit from their findings', 'It never changes its conclusions', 'It is supported by a large number of ordinary citizens'],
      '信頼の根拠：利害関係者からの独立、他の専門家からの批判に開かれていること、誤りを正してきた実績。②は逆。',
      `Does the institution have a record of correcting its own mistakes?`, 'その機関には、自らの誤りを正してきた実績があるか',
      '修辞疑問の並列で判断基準を示している。'),
  ]),

  p('r5-07', 5, 'Translation and Loss', '翻訳で失われるもの', [
    `It is often said that poetry is what gets lost in translation. The remark contains a truth, but it can also mislead, for it implies that an original text possesses a fixed meaning which a translation either preserves or fails to preserve. The reality of translation is more interesting.`,
    `Languages do not simply attach different labels to the same set of objects and ideas; they divide experience differently. Where one language has a single word for a color, another distinguishes two. A translator therefore cannot avoid making decisions that the original author never had to make. Translating from a language that does not mark gender into one that does, for instance, may force the translator to decide whether a character is male or female.`,
    `Seen in this light, translation is not a copy but an interpretation, and every translation emphasizes some aspects of the original at the expense of others. This is why great works are translated again and again.`,
    `Loss, then, is only half the story. A translation can also reveal possibilities in a text that readers of the original had overlooked, precisely because the translator has been obliged to ask what each word really commits the author to.`,
  ], [['for ~', '（接続詞）というのは〜だから'], ['seen in this light', 'この観点から見ると'], ['at the expense of ~', '〜を犠牲にして'], ['commit A to B', 'AをBに関わらせる・拘束する']], [
    q('r5-07-1', 1, 'reason', 'Why does the author say the remark about poetry "can also mislead"?', [
      'It suggests that a text has a single fixed meaning to be kept or lost', 'It implies that poetry cannot be translated at all', 'It ignores the fact that prose is harder to translate', 'It assumes that translators are poor writers'],
      'for（というのは）以下：「原文には決まった意味があり、翻訳はそれを保つか失うかだと示唆する」から。',
      `it implies that an original text possesses a fixed meaning which a translation either preserves or fails to preserve`, 'それは、原文には決まった意味があり、翻訳はそれを保つか保ちそこなうかのどちらかだと示唆している',
      '等位接続詞 for「というのは〜だから」。'),
    q('r5-07-2', 2, 'inference', 'What does the example of gender illustrate?', [
      'A translator may have to make choices that the original author did not', 'Some languages are more precise than others', 'Translators often change the characters in a story', 'Gender is unimportant in literature'],
      '性を区別しない言語から区別する言語へ訳すと、原作者が決めなくてよかったことを訳者が決めねばならない。',
      `A translator therefore cannot avoid making decisions that the original author never had to make.`, 'それゆえ翻訳者は、原作者が決める必要のなかった決定を避けることができない',
      'divide experience differently「経験を異なって区切る」。'),
    q('r5-07-3', 3, 'detail', 'According to the third paragraph, why are great works translated repeatedly?', [
      'Each translation brings out some aspects of the original while sacrificing others', 'Earlier translations always contain grammatical mistakes', 'Publishers want to sell more books', 'The original texts change over time'],
      '「どの翻訳も、原文のある面を他の面を犠牲にして強調する。だから名作は何度も訳される」。',
      `every translation emphasizes some aspects of the original at the expense of others`, 'あらゆる翻訳は、原文のある側面を他の側面を犠牲にして強調する',
      'Seen in this light は分詞構文（If it is seen ~）。'),
    q('r5-07-4', 4, 'main', 'Which statement best reflects the author\'s view in the final paragraph?', [
      'Translation can bring to light aspects of a text that original readers missed', 'Translation always reduces the value of a great work', 'Original readers understand a text better than any translator', 'Great works should be translated only once'],
      '「損失は話の半分にすぎない。翻訳は原文の読者が見落としていた可能性を明らかにしうる」。',
      `A translation can also reveal possibilities in a text that readers of the original had overlooked`, '翻訳はまた、原文の読者が見落としていた文章の可能性を明らかにすることもある',
      'precisely because ~「まさに〜だからこそ」。'),
  ]),

  p('r5-08', 5, 'Antibiotics and Evolution', '抗生物質と進化', [
    `When antibiotics were introduced in the 1940s, they seemed to promise the end of bacterial disease. Infections that had killed millions could suddenly be cured in days. Less than a century later, the World Health Organization ranks antibiotic resistance among the gravest threats to global health. How did a triumph turn into a crisis?`,
    `The answer lies in natural selection. In any large population of bacteria, a few individuals may, by chance, carry a variation that allows them to survive a particular drug. When the drug is used, the susceptible bacteria die, and the resistant ones are left to multiply without competition. Bacteria can also pass resistance genes directly to one another, accelerating the process.`,
    `Human behavior has supplied the selective pressure. Antibiotics are often prescribed for viral infections, against which they are useless; patients frequently stop taking them as soon as they feel better; and in many countries, large quantities are given to livestock to promote growth.`,
    `Resistance, then, is not a failure of the drugs but a predictable consequence of their use. The goal cannot be to defeat bacteria once and for all, but to use antibiotics in ways that slow the evolution of resistance.`,
  ], [['rank A among B', 'AをBの一つに数える'], ['by chance', '偶然に'], ['be left to ~', '〜するにまかされる'], ['once and for all', 'きっぱりと・永久に']], [
    q('r5-08-1', 1, 'detail', 'What does the first paragraph say about antibiotics today?', [
      'Resistance to them is considered one of the most serious threats to health', 'They have eliminated all bacterial disease', 'They are no longer used by doctors', 'They cure infections more slowly than before'],
      '「WHOは抗生物質耐性を世界の健康に対する最も深刻な脅威の一つに数えている」。',
      `the World Health Organization ranks antibiotic resistance among the gravest threats to global health`, '世界保健機関は、抗生物質耐性を世界の健康に対する最も重大な脅威の一つに数えている',
      'How did a triumph turn into a crisis? ＝ 問題提起。答えは次の段落。'),
    q('r5-08-2', 2, 'detail', 'According to the passage, how does a resistant strain become dominant?', [
      'The drug kills the vulnerable bacteria, leaving resistant ones to multiply', 'The drug causes all bacteria to change their genes', 'Resistant bacteria attack and destroy other bacteria', 'Patients transmit the drug to other people'],
      '「感受性のある菌が死に、耐性菌が競争相手なしに増えるにまかされる」。',
      `the susceptible bacteria die, and the resistant ones are left to multiply without competition`, '感受性のある細菌は死に、耐性のある細菌は競争なしに増えるにまかされる',
      ', accelerating the process は分詞構文（結果）。'),
    q('r5-08-3', 3, 'not', 'Which human behaviour is NOT mentioned in the third paragraph as contributing to resistance?', [
      'Developing new antibiotics too slowly', 'Using antibiotics against viral infections', 'Stopping treatment once symptoms improve', 'Giving antibiotics to farm animals to promote growth'],
      '本文が挙げるのは「ウイルス感染への処方」「よくなったら服用をやめる」「家畜の成長促進」。NOT問題。',
      `Antibiotics are often prescribed for viral infections, against which they are useless`, '抗生物質はしばしばウイルス感染症に処方されるが、それに対しては効果がない',
      'against which：前置詞＋関係代名詞。'),
    q('r5-08-4', 4, 'main', 'What does the author mean by saying resistance is "not a failure of the drugs"?', [
      'Resistance is an expected result of natural selection whenever the drugs are used', 'The drugs were never effective against bacteria', 'Doctors are responsible for every case of resistance', 'New drugs will completely solve the problem'],
      '「耐性は薬の失敗ではなく、使用の予測可能な帰結である」。',
      `Resistance, then, is not a failure of the drugs but a predictable consequence of their use.`, 'つまり耐性は薬の失敗ではなく、その使用の予測可能な帰結である',
      'cannot be to A, but to B：not A but B の変形。'),
  ]),

  p('r5-09', 5, 'The Paradox of Tolerance', '寛容のパラドックス', [
    `A tolerant society permits its members to hold and express a wide range of opinions, including many that most people find offensive. But should it tolerate those who, given the chance, would abolish tolerance itself? Karl Popper famously argued that it should not, warning that unlimited tolerance would lead to the disappearance of tolerance.`,
    `Popper's argument is often quoted as though it justified suppressing any view one regards as intolerant. This reading ignores a crucial qualification. Popper did not recommend silencing intolerant opinions so long as they could be countered by rational argument and kept in check by public opinion.`,
    `Suppression was justified, in his view, only when the intolerant refused to engage in argument at all and instead taught their followers to answer arguments with violence. The distinction matters because the label "intolerant" is easily applied to one's opponents. If every disagreement could be redescribed as a threat to tolerance, the principle would become a weapon for silencing dissent.`,
    `The paradox, then, does not offer a simple rule. A tolerant society must be prepared to defend itself, but it must also resist the temptation to treat the mere expression of disagreeable ideas as an attack.`,
  ], [['given the chance', '機会があれば'], ['as though ~', 'まるで〜であるかのように'], ['so long as ~', '〜する限り'], ['keep ~ in check', '〜を抑える']], [
    q('r5-09-1', 1, 'detail', 'What did Popper warn about?', [
      'Unlimited tolerance would eventually destroy tolerance', 'Offensive opinions should always be banned', 'Tolerant societies are too weak to survive', 'People should not express opinions publicly'],
      '「無制限の寛容は寛容の消滅につながる」と警告した。',
      `unlimited tolerance would lead to the disappearance of tolerance`, '無制限の寛容は、寛容の消滅につながるだろう',
      'given the chance「機会が与えられれば」（仮定）。'),
    q('r5-09-2', 2, 'paraphrase', 'What "crucial qualification" does the common reading of Popper ignore?', [
      'He did not advocate silencing intolerant views that could be answered by argument', 'He believed all opinions should be suppressed', 'He thought public opinion was always wrong', 'He supported violence against the intolerant'],
      '「理性的な議論で反論でき、世論で抑えられる限り、不寛容な意見を封じることは勧めなかった」。',
      `Popper did not recommend silencing intolerant opinions so long as they could be countered by rational argument and kept in check by public opinion`, 'ポパーは、理性的な議論で反論でき世論によって抑えられる限り、不寛容な意見を封じることを勧めなかった',
      'as though it justified ~：仮定法「まるで〜を正当化するかのように」。'),
    q('r5-09-3', 3, 'detail', 'Under what condition did Popper consider suppression justified?', [
      'When the intolerant reject argument and promote violence instead', 'Whenever an opinion offends most people', 'Whenever an opinion is held by a minority', 'Whenever public opinion disagrees with a view'],
      '「不寛容な者が議論を一切拒み、議論に暴力で答えるよう教えるときだけ」。',
      `only when the intolerant refused to engage in argument at all and instead taught their followers to answer arguments with violence`, '不寛容な者たちが議論することを一切拒み、代わりに支持者たちに議論に暴力で応じるよう教えたときだけ',
      'only when ~「〜するときに限り」。'),
    q('r5-09-4', 4, 'main', 'Which best summarises the author\'s conclusion?', [
      'A tolerant society must defend itself without treating mere disagreement as an attack', 'A tolerant society should silence anyone it disagrees with', 'Tolerance should have no limits at all', 'Popper\'s paradox offers a simple rule for every case'],
      '「自らを守る用意は必要だが、不快な意見の表明そのものを攻撃とみなす誘惑にも抵抗せねばならない」。',
      `it must also resist the temptation to treat the mere expression of disagreeable ideas as an attack`, 'それはまた、不快な考えを単に表明することを攻撃とみなす誘惑にも抵抗しなければならない',
      'must A, but must also B：両方の条件。'),
  ]),

  p('r5-10', 5, 'Why Do We Sleep?', '眠りの謎', [
    `Sleep is among the most puzzling of animal behaviors. For several hours each day, an animal becomes unaware of its surroundings and largely unable to respond to danger. From an evolutionary standpoint, this is an extraordinary risk. Had sleep served no essential purpose, natural selection would surely have produced animals that did without it. Yet virtually every animal studied shows some form of sleep.`,
    `For much of the twentieth century, scientists could say more about what sleep was not than about what it was for. It is not simply rest, since the sleeping brain is in some respects as active as the waking one. Recent research has begun to identify specific functions: the consolidation of memories, and the clearing of waste products that accumulate in the brain during waking hours.`,
    `These discoveries do not necessarily mean that sleep evolved for any one of these purposes. It may have begun for one reason and later been put to other uses, much as feathers may have evolved for warmth before they were used for flight.`,
    `What is clear is that sleep is not a passive state of switching off. It is an active process — one that the brain, it seems, cannot carry out while it is busy dealing with the outside world.`,
  ], [['Had S p.p., ~', 'もしSが〜していたなら（倒置）'], ['do without ~', '〜なしで済ませる'], ['in some respects', 'いくつかの点で'], ['put ~ to use', '〜を利用する']], [
    q('r5-10-1', 1, 'reason', 'Why does sleep seem puzzling from an evolutionary standpoint?', [
      'It leaves animals vulnerable, so it should have disappeared unless it is essential', 'Only a few species of animals sleep', 'Sleeping animals use more energy than waking ones', 'Sleep makes animals more aggressive'],
      'Had sleep served no essential purpose ＝ If sleep had served ~（倒置の仮定法）。本質的な目的がなければ淘汰で消えていたはず。',
      `Had sleep served no essential purpose, natural selection would surely have produced animals that did without it.`, 'もし睡眠が本質的な目的を果たしていなかったなら、自然選択はきっと睡眠なしで済む動物を生み出していただろう',
      'If の省略による倒置：Had S p.p., S would have p.p.'),
    q('r5-10-2', 2, 'detail', 'Which function of sleep is mentioned in the second paragraph?', [
      'Clearing away waste that builds up in the brain while we are awake', 'Lowering the body temperature to save energy', 'Repairing broken bones', 'Strengthening muscles'],
      'コロン以下「記憶の定着と、起きている間に脳にたまる老廃物の除去」。',
      `the clearing of waste products that accumulate in the brain during waking hours`, '起きている時間に脳にたまる老廃物の除去',
      'say more about A than about B「BよりAについて多く語る」。'),
    q('r5-10-3', 3, 'paraphrase', 'What is the point of the comparison with feathers?', [
      'A trait may have arisen for one purpose and later served others', 'Birds sleep more than other animals', 'Sleep evolved in order to keep animals warm', 'Flight is more important than sleep'],
      '羽毛が保温のために進化し後に飛行に使われたように、睡眠も別の理由で始まり後に他の用途に使われたかもしれない。',
      `It may have begun for one reason and later been put to other uses`, 'それはある理由で始まり、のちに他の用途に使われるようになったのかもしれない',
      'may have p.p.「〜したかもしれない」。much as ~「〜とちょうど同じように」。'),
    q('r5-10-4', 4, 'main', 'What does the final paragraph claim?', [
      'Sleep is an active process the brain cannot perform while engaged with the outside world', 'Sleep is simply a way of switching the brain off', 'The brain is inactive during sleep', 'Scientists have fully explained why we sleep'],
      '「睡眠は受け身のスイッチオフではなく能動的な過程で、外界の処理で忙しい間は脳が行えないもの」。',
      `It is an active process — one that the brain, it seems, cannot carry out while it is busy dealing with the outside world.`, 'それは能動的な過程、つまり脳が外の世界の対応に忙しい間は行えないらしい過程なのだ',
      'What is clear is that ~「明らかなのは〜ということだ」。'),
  ]),

  p('r5-11', 5, 'History and Hindsight', '歴史と後知恵', [
    `Once we know how events turned out, it becomes difficult to imagine that they could have turned out otherwise. Looking back on a war or a financial crisis, we see the warning signs clearly and wonder how anyone could have missed them. But those living through such events did not have the advantage of knowing which of the countless signals around them would prove significant.`,
    `This hindsight bias distorts our understanding of the past in two ways. It makes history appear more inevitable than it was, obscuring the role of chance and individual decisions. And it encourages unfair judgments of past actors, who are blamed for failing to foresee outcomes that were genuinely uncertain at the time.`,
    `One remedy is to try to recover the perspective of the people being studied: to read the newspapers, letters, and diaries of the period without skipping ahead to the ending. Such sources often reveal that what seems obvious to us was a matter of fierce debate.`,
    `None of this means that past mistakes should be excused. But to distinguish negligence from bad luck, we must ask not "What should they have known?" but "What could they reasonably have known, given the information available to them?"`,
  ], [['turn out ~', '結局〜になる'], ['prove ~', '〜だと分かる'], ['obscure ~', '〜を見えにくくする'], ['given ~', '〜を考慮すると']], [
    q('r5-11-1', 1, 'detail', 'What advantage did people living through past events lack?', [
      'Knowing which signals would turn out to be important', 'Access to newspapers and letters', 'The ability to make decisions', 'Information about earlier wars'],
      '「周囲の無数の兆候のどれが重要だと分かるのかを知るという利点がなかった」。',
      `did not have the advantage of knowing which of the countless signals around them would prove significant`, '周囲の無数の兆候のどれが重要だと分かるのかを知るという利点を持っていなかった',
      'could have turned out otherwise「別の結果になりえた」。'),
    q('r5-11-2', 2, 'detail', 'Which of the following is described as an effect of hindsight bias?', [
      'It makes past events seem more unavoidable than they really were', 'It makes people forget important historical events', 'It encourages historians to read old newspapers', 'It causes people to overestimate the role of chance'],
      '「歴史を実際より必然的に見せ、偶然や個人の決断の役割を見えにくくする」。④は逆。',
      `It makes history appear more inevitable than it was`, 'それは歴史を、実際よりも必然的なものに見せる',
      ', obscuring ~ は分詞構文（結果・付帯）。'),
    q('r5-11-3', 3, 'detail', 'What do sources such as letters and diaries often reveal?', [
      'Matters that seem obvious now were fiercely disputed at the time', 'People in the past could predict the future accurately', 'Historians have misunderstood most past events', 'Past leaders were usually careless'],
      '「今の私たちには明らかに見えることが、当時は激しい議論の的だった」。',
      `what seems obvious to us was a matter of fierce debate`, '私たちには明らかに思えることが、激しい議論の的だった',
      'without skipping ahead to the ending「結末まで読み飛ばさずに」。'),
    q('r5-11-4', 4, 'main', 'What question does the author recommend asking when judging past decisions?', [
      'What people could reasonably have known with the information they had', 'What people should have known about the outcome', 'Whether people were lucky or unlucky', 'Whether historians agree about the event'],
      '「何を知るべきだったか」ではなく「入手可能な情報から合理的に何を知りえたか」。',
      `What could they reasonably have known, given the information available to them?`, '入手できた情報を考慮すると、彼らは合理的に何を知りえただろうか',
      'ask not A but B。given ~「〜を考慮すると」。'),
  ]),

  p('r5-12', 5, 'The Limits of Prediction', '予測の限界', [
    `Weather forecasting has improved dramatically over the past half century; a five-day forecast today is about as accurate as a one-day forecast was in the 1980s. Yet there appears to be a horizon beyond which no amount of computing power will allow us to see. Detailed forecasts more than about two weeks ahead are, and are likely to remain, little better than guesses.`,
    `The reason was discovered almost by accident by the meteorologist Edward Lorenz in the 1960s. Rerunning a simple computer model of the atmosphere, he entered numbers rounded to three decimal places instead of six, expecting a nearly identical result. Instead, after a short time, the two runs diverged completely.`,
    `Systems that behave in this way are called chaotic. They are not random; they obey precise rules. But because their future depends so sensitively on their present state, and because the present can never be measured perfectly, long-range prediction of their exact behavior is impossible in principle, not merely in practice.`,
    `This does not mean that nothing can be said about the future of such systems. We cannot predict whether it will rain on a particular day next month, yet we can be confident that summer will be warmer than winter. Chaos limits our knowledge of particular events, but leaves room for knowledge of averages and patterns.`,
  ], [['no amount of ~', 'どれほどの〜も…ない'], ['little better than ~', '〜とほとんど変わらない'], ['in principle', '原理的に'], ['leave room for ~', '〜の余地を残す']], [
    q('r5-12-1', 1, 'paraphrase', 'What does the author mean by a "horizon" in the first paragraph?', [
      'A limit beyond which detailed prediction is not possible however powerful computers become', 'The line where the sky meets the earth', 'A period during which forecasts become more accurate', 'The point at which computers stop working'],
      '「どれほどの計算能力でも見通せない地平線」＝いくら計算機が強くなっても越えられない予測の限界。',
      `there appears to be a horizon beyond which no amount of computing power will allow us to see`, 'どれほどの計算能力をもってしても、その向こうは見通せない地平線があるようだ',
      'no amount of ~ will ...「どれほどの〜も…しない」。'),
    q('r5-12-2', 2, 'detail', 'What did Lorenz expect when he entered the rounded numbers?', [
      'That the result would be almost the same as before', 'That the computer would stop working', 'That the two runs would diverge completely', 'That the rounded numbers would produce a better forecast'],
      '「ほとんど同じ結果を期待していた」。実際は完全に食い違った。',
      `expecting a nearly identical result`, 'ほぼ同じ結果を予想して',
      'Rerunning ~ は分詞構文（〜していたとき）。'),
    q('r5-12-3', 3, 'reason', 'Why is long-range prediction of chaotic systems impossible in principle?', [
      'Their future depends greatly on present conditions that can never be measured perfectly', 'They do not follow any rules', 'Computers are not yet powerful enough', 'Meteorologists use inaccurate instruments'],
      '「未来が現在の状態にきわめて敏感に依存し、しかも現在は完全には測れないから」。ランダムではない点に注意。',
      `because their future depends so sensitively on their present state, and because the present can never be measured perfectly`, '未来が現在の状態にきわめて敏感に左右され、しかも現在を完全に測ることは決してできないから',
      'in principle, not merely in practice「実際上だけでなく原理的に」。'),
    q('r5-12-4', 4, 'main', 'What is the main point of the final paragraph?', [
      'Even in chaotic systems, general patterns can be known with confidence', 'Chaos makes all knowledge of the future impossible', 'Summer and winter are becoming harder to predict', 'Rain can be predicted a month ahead'],
      '「カオスは個々の出来事の知識を制限するが、平均やパターンの知識の余地は残す」。',
      `Chaos limits our knowledge of particular events, but leaves room for knowledge of averages and patterns.`, 'カオスは個々の出来事についての知識を制限するが、平均やパターンについての知識の余地は残している',
      'This does not mean that nothing ~「何も〜できないという意味ではない」。'),
  ]),
];
