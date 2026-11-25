/**
 * ===================================================================
 * 英語リスニング 第3問 ― 類題集（第1回〜第15回）
 * ===================================================================
 *
 * 出典
 *   配布 PDF「共通テスト_英語リスニング_第3問_類題集_15セット90問.pdf」の
 *   15セット（各6問・計90問）をそのまま収録している。
 *   場面説明（日本語）・設問文（英語）・選択肢・対話スクリプト・解説は
 *   すべて PDF の原文どおり。
 *
 * 生成方法（手打ちしていない理由）
 *   90問＝選択肢360個・対話530発話を手で書き写すと、
 *   選択肢と正解の対応ズレが必ず混入する。そこで
 *     scripts/listening-data/parse_listening_q3_pdf.py        … PDF → JSON（突き合わせ検査つき）
 *     scripts/listening-data/shuffle_listening_q3_options.py  … 正解位置の偏りを均す
 *     scripts/listening-data/gen_listening_q3_data.py         … JSON → このファイル
 *   の3段で機械的に生成している。
 *
 * 正解位置を並べ替えている理由
 *   PDF 原文のままだと正解が ①5問 / ②40問 / ③37問 / ④8問 と極端に偏り、
 *   「②か③を塗れば 85% 当たる」状態になる。音を聞かずに点が取れると
 *   リスニングの練習にならないため、選択肢の**並び順だけ**を入れ替えて
 *   正解位置をほぼ均等（各22〜23問）にした。
 *   ただし「150円→200円→350円→550円」「Today→Tomorrow→Thursday」のように
 *   自然な並び順がある問と、解説がマーク番号を直接指している問は
 *   本番の見た目から離れないよう原文の並びのまま固定している。
 *
 * 第1問との作りの違い
 *   ・1回読み（readCount: 1）。本番と同じ条件で練習するため、
 *     「2回続けて」ボタンは出さない設定にしてある。
 *   ・音源が「2人の対話」なので audioTracks に turns（A / B の発話列）を持つ。
 *     ListeningAudioPlayer が A と B に別の声を割り当てて読み上げるため、
 *     どこで話者が替わったかが耳で分かる。1つの声で通して読むと
 *     「男性は何をするか」型の設問が原理的に解けなくなる。
 *
 * 音源について
 *   提供された高品質MP3を audioUrl で参照する。各ファイルは原稿1回分。
 *   再生回数は readCount に従いアプリ側で制御する。
 *   対応原稿・SHA-256・出典は scripts/data/listening_premium_manifest.json に記録。
 *
 * 選択肢の表記
 *   options は ①〜④ のマーク（MARK_OPTIONS）だけを持ち、英文本体は text 側に置く。
 *   第1問と同じ設計で、スマホでも解答チップが小さく収まりマークシートと対応する。
 */

import type { ListeningAudioTrack, ListeningProblem } from './englishListeningQ1AProblems';

/** 解答チップはマークのみ（英文は問題文ペインに表示する）。 */
const MARK_OPTIONS = ['①', '②', '③', '④'];


const EL3_SET1_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el3_set1_1',
    audioUrl: '/listening_audio/el3_set1_q1.mp3',
    label: '問1',
    hint: '図書館で本を借りようとしている。',
    script: 'A: Can I borrow this book for three weeks?\nB: Usually two weeks is the limit, but new books are just one week.\nA: This one was published last month.\nB: Then it\'s one week. But you can renew it once online.\nA: OK, I\'ll do that if I need more time.',
    turns: [
      { who: 'A', text: 'Can I borrow this book for three weeks?' },
      { who: 'B', text: 'Usually two weeks is the limit, but new books are just one week.' },
      { who: 'A', text: 'This one was published last month.' },
      { who: 'B', text: 'Then it\'s one week. But you can renew it once online.' },
      { who: 'A', text: 'OK, I\'ll do that if I need more time.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set1_2',
    audioUrl: '/listening_audio/el3_set1_q2.mp3',
    label: '問2',
    hint: '駅で切符の買い方を尋ねている。',
    script: 'A: Excuse me, how much is a ticket to Central Park Station?\nB: It\'s 350 yen for adults. Are you a student?\nA: Yes, I\'m a university student.\nB: Then it\'s 200 yen with your student ID card.\nA: Great. Here\'s my ID.',
    turns: [
      { who: 'A', text: 'Excuse me, how much is a ticket to Central Park Station?' },
      { who: 'B', text: 'It\'s 350 yen for adults. Are you a student?' },
      { who: 'A', text: 'Yes, I\'m a university student.' },
      { who: 'B', text: 'Then it\'s 200 yen with your student ID card.' },
      { who: 'A', text: 'Great. Here\'s my ID.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set1_3',
    audioUrl: '/listening_audio/el3_set1_q3.mp3',
    label: '問3',
    hint: '誕生日パーティーの準備について話している。',
    script: 'A: How many friends are coming to your party on Saturday?\nB: Eight friends. Oh wait, Tom can\'t come.\nA: So seven friends plus you.\nB: Right. Can you make eight sandwiches for each person?\nA: Eight each? That\'s sixty-four!\nB: Sorry, I mean eight sandwiches in total!',
    turns: [
      { who: 'A', text: 'How many friends are coming to your party on Saturday?' },
      { who: 'B', text: 'Eight friends. Oh wait, Tom can\'t come.' },
      { who: 'A', text: 'So seven friends plus you.' },
      { who: 'B', text: 'Right. Can you make eight sandwiches for each person?' },
      { who: 'A', text: 'Eight each? That\'s sixty-four!' },
      { who: 'B', text: 'Sorry, I mean eight sandwiches in total!' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set1_4',
    audioUrl: '/listening_audio/el3_set1_q4.mp3',
    label: '問4',
    hint: '放課後、明日の持ち物について話している。',
    script: 'A: Do we need our gym clothes tomorrow?\nB: Let me check... Tomorrow we have math, English, and art.\nA: No PE?\nB: Right. But bring a paint set for art class.\nA: Oh, I left mine in my locker at school. Do you have yours?\nB: No, it\'s at home, so I\'ll bring my paint set tomorrow.',
    turns: [
      { who: 'A', text: 'Do we need our gym clothes tomorrow?' },
      { who: 'B', text: 'Let me check... Tomorrow we have math, English, and art.' },
      { who: 'A', text: 'No PE?' },
      { who: 'B', text: 'Right. But bring a paint set for art class.' },
      { who: 'A', text: 'Oh, I left mine in my locker at school. Do you have yours?' },
      { who: 'B', text: 'No, it\'s at home, so I\'ll bring my paint set tomorrow.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set1_5',
    audioUrl: '/listening_audio/el3_set1_q5.mp3',
    label: '問5',
    hint: 'ペットの世話の分担について話している。',
    script: 'A: It\'s your turn to feed the dog this week.\nB: But I fed him last week, too!\nA: Because I was sick. This week I\'ll take him for a walk every day instead.\nB: OK, deal. So I just feed him in the morning?\nA: Morning and evening, please.',
    turns: [
      { who: 'A', text: 'It\'s your turn to feed the dog this week.' },
      { who: 'B', text: 'But I fed him last week, too!' },
      { who: 'A', text: 'Because I was sick. This week I\'ll take him for a walk every day instead.' },
      { who: 'B', text: 'OK, deal. So I just feed him in the morning?' },
      { who: 'A', text: 'Morning and evening, please.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set1_6',
    audioUrl: '/listening_audio/el3_set1_q6.mp3',
    label: '問6',
    hint: '映画館で席を探している。',
    script: 'A: Our seats are G-11 and G-12.\nB: This row is F. The next one must be G.\nA: Right. G-11 is here. You\'re next to me.\nB: Wait, there\'s someone in G-12 already.\nA: Let me check his ticket... Oh, he\'s in the wrong row. His seat is H-12.',
    turns: [
      { who: 'A', text: 'Our seats are G-11 and G-12.' },
      { who: 'B', text: 'This row is F. The next one must be G.' },
      { who: 'A', text: 'Right. G-11 is here. You\'re next to me.' },
      { who: 'B', text: 'Wait, there\'s someone in G-12 already.' },
      { who: 'A', text: 'Let me check his ticket... Oh, he\'s in the wrong row. His seat is H-12.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL3_SET1: ListeningProblem = {
  id: 'q_el3_set1',
  category: '第1回 短い対話の内容一致（易しめ）',
  readCount: 1,
  audioTracks: EL3_SET1_TRACKS,
  text: `第1回　第3問（6問・1回読み）　【難易度：易しめ】

第3問では、2人の短い対話が1回だけ流れます。それぞれの問いの答えとして最も適切なものを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は1回読みなので、まずは1回で解き、答え合わせの前にもう一度だけ聞いて確かめてください。

【解き方のコツ】
音声が流れる前に「場面」と「Question」を読み、選択肢4つの違いを1語で言えるようにしておきます。1回読みでは、聞くべき1語が決まっているかどうかで勝負が決まります。

────────────────────
問1（話者：女性（高校生） / 男性（司書））
場面：図書館で本を借りようとしている。
Question: How long can the woman keep the book first?
① Three weeks
② Two weeks
③ One week
④ Four weeks

────────────────────
問2（話者：男性（旅行者） / 女性（駅員））
場面：駅で切符の買い方を尋ねている。
Question: How much will the man pay?
① 150 yen
② 200 yen
③ 350 yen
④ 550 yen

────────────────────
問3（話者：女性（母親） / 男性（息子・小学生））
場面：誕生日パーティーの準備について話している。
Question: How many sandwiches will the mother make?
① 7
② 8
③ 56
④ 64

────────────────────
問4（話者：女性（高校生） / 男性（高校生））
場面：放課後、明日の持ち物について話している。
Question: What will the boy bring to school tomorrow?
① Gym clothes
② A paint set
③ Two paint sets
④ A math textbook only

────────────────────
問5（話者：女性（姉） / 男性（弟・中学生））
場面：ペットの世話の分担について話している。
Question: What will the boy do this week?
① Feed the dog twice a day
② Walk the dog every day
③ Nothing this week
④ Feed the dog once a day

────────────────────
問6（話者：女性（大学生） / 女性（大学生））
場面：映画館で席を探している。
Question: What is the problem?
① Someone is already sitting in one of their seats.
② Their tickets are for another movie.
③ They are in the wrong row.
④ Their seats are in different rows.`,
  subQuestions: [
    {
      id: 'q_el3_set1_1',
      label: '問1 How long can the woman keep the book first?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 70,
      detailedExplanation: {
        theme: '通常2週間・新刊は1週間、という条件分岐',
        type: '短い対話の内容一致型',
        difficulty: 2,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set1_2',
      label: '問2 How much will the man pay?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 67,
      detailedExplanation: {
        theme: '学生証提示で割引（350→200円）',
        type: '短い対話の内容一致型',
        difficulty: 2,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set1_3',
      label: '問3 How many sandwiches will the mother make?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 64,
      detailedExplanation: {
        theme: '人数の訂正（8→7人）と数量の訂正（each→in total）の2段階ひっかけ',
        type: '短い対話の内容一致型',
        difficulty: 2,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set1_4',
      label: '問4 What will the boy bring to school tomorrow?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 70,
      detailedExplanation: {
        theme: '体育なし（体操着不要）→ 女子は学校のロッカーに置いてあるが、男子（B）は自宅から絵の具セット（a paint set）を持参する',
        type: '短い対話の内容一致型',
        difficulty: 2,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set1_5',
      label: '問5 What will the boy do this week?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 67,
      detailedExplanation: {
        theme: '分担（姉＝散歩、弟＝餌）と回数（morning and evening＝1日2回）の特定',
        type: '短い対話の内容一致型',
        difficulty: 2,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set1_6',
      label: '問6 What is the problem?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 64,
      detailedExplanation: {
        theme: 'G-12に先客→その人のチケットはH-12＝その人が間違えている',
        type: '短い対話の内容一致型',
        difficulty: 2,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
  ],
  explanation: `第1回（難易度：易しめ）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ③
場面：図書館で本を借りようとしている。
スクリプト：A: Can I borrow this book for three weeks?
B: Usually two weeks is the limit, but new books are just one week.
A: This one was published last month.
B: Then it's one week. But you can renew it once online.
A: OK, I'll do that if I need more time.
Question: How long can the woman keep the book first?
正解の選択肢：One week
通常2週間・新刊は1週間、という条件分岐。この本は先月刊行＝新刊扱い。renew（延長可）はダミー。2022年問13型（条件による日付・期間の特定）。

問2　正解は ②
場面：駅で切符の買い方を尋ねている。
スクリプト：A: Excuse me, how much is a ticket to Central Park Station?
B: It's 350 yen for adults. Are you a student?
A: Yes, I'm a university student.
B: Then it's 200 yen with your student ID card.
A: Great. Here's my ID.
Question: How much will the man pay?
正解の選択肢：200 yen
学生証提示で割引（350→200円）。数字の聞き分けと条件の適用。

問3　正解は ②
場面：誕生日パーティーの準備について話している。
スクリプト：A: How many friends are coming to your party on Saturday?
B: Eight friends. Oh wait, Tom can't come.
A: So seven friends plus you.
B: Right. Can you make eight sandwiches for each person?
A: Eight each? That's sixty-four!
B: Sorry, I mean eight sandwiches in total!
Question: How many sandwiches will the mother make?
正解の選択肢：8
人数の訂正（8→7人）と数量の訂正（each→in total）の2段階ひっかけ。最終発話の in totalが結論。2026年問17型（数値の組み立て）。

問4　正解は ②
場面：放課後、明日の持ち物について話している。
スクリプト：A: Do we need our gym clothes tomorrow?
B: Let me check... Tomorrow we have math, English, and art.
A: No PE?
B: Right. But bring a paint set for art class.
A: Oh, I left mine in my locker at school. Do you have yours?
B: No, it's at home, so I'll bring my paint set tomorrow.
Question: What will the boy bring to school tomorrow?
正解の選択肢：A paint set
体育がないため gym clothes は不要。女子（A）は学校のロッカーに置いてあるが、男子（B）は自宅にあるため明日②A paint set を持ってくる。

問5　正解は ①
場面：ペットの世話の分担について話している。
スクリプト：A: It's your turn to feed the dog this week.
B: But I fed him last week, too!
A: Because I was sick. This week I'll take him for a walk every day instead.
B: OK, deal. So I just feed him in the morning?
A: Morning and evening, please.
Question: What will the boy do this week?
正解の選択肢：Feed the dog twice a day
分担（姉＝散歩、弟＝餌）と回数（morning and evening＝1日2回）の特定。insteadの言い換えに注意。

問6　正解は ①
場面：映画館で席を探している。
スクリプト：A: Our seats are G-11 and G-12.
B: This row is F. The next one must be G.
A: Right. G-11 is here. You're next to me.
B: Wait, there's someone in G-12 already.
A: Let me check his ticket... Oh, he's in the wrong row. His seat is H-12.
Question: What is the problem?
正解の選択肢：Someone is already sitting in one of their seats.
G-12に先客→その人のチケットはH-12＝その人が間違えている。誰が間違えたかの特定。2026年問1 5型（間違いの所在を問う）。`,
  surroundingKnowledge: [
    '第3問は1回読み。音声が流れる前に場面と設問文を読み終えておくのが前提の大問である。',
    '設問文の疑問詞が答えの型を決める。How long → 期間、How much → 金額、What will 〜 do → 次の行動。',
    '数量・金額・時刻は「訂正」がつきもの。最初に聞こえた数字はダミーであることが多い。',
    'but / actually / instead / in total / on second thought の後ろに結論が来る。',
    '選択肢の誤りは「最初に出た数字」「別人の行動」「条件を満たさない案」のどれかに集約される。',
  ],
  deepDiveTopics: [
    '「先読み」を習慣にする。場面＋設問文＋選択肢の3点を10秒で読む練習を単独でやると効く。',
    '聞こえた単語がそのまま入っている選択肢はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。合意した内容が答えになる。',
  ],
};

const EL3_SET2_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el3_set2_1',
    audioUrl: '/listening_audio/el3_set2_q1.mp3',
    label: '問1',
    hint: '喫茶店でアルバイトの面接をしている。',
    script: 'A: Can you work on weekdays after school?\nB: I can work on Mondays and Wednesdays, from four to eight.\nA: We also need someone on Saturday mornings.\nB: I have piano lessons until eleven, so I can start at noon.\nA: OK. Let\'s start with Monday, Wednesday, and Saturday afternoons.',
    turns: [
      { who: 'A', text: 'Can you work on weekdays after school?' },
      { who: 'B', text: 'I can work on Mondays and Wednesdays, from four to eight.' },
      { who: 'A', text: 'We also need someone on Saturday mornings.' },
      { who: 'B', text: 'I have piano lessons until eleven, so I can start at noon.' },
      { who: 'A', text: 'OK. Let\'s start with Monday, Wednesday, and Saturday afternoons.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set2_2',
    audioUrl: '/listening_audio/el3_set2_q2.mp3',
    label: '問2',
    hint: '空港で友達を待っている。',
    script: 'A: Yuki\'s flight lands at three, right?\nB: Yes, but she has to pick up her luggage. That takes about thirty minutes.\nA: And the bus from the airport to the city?\nB: Forty minutes. So she\'ll be here around... let me think.\nA: We should meet her at the bus stop at four-ten.',
    turns: [
      { who: 'A', text: 'Yuki\'s flight lands at three, right?' },
      { who: 'B', text: 'Yes, but she has to pick up her luggage. That takes about thirty minutes.' },
      { who: 'A', text: 'And the bus from the airport to the city?' },
      { who: 'B', text: 'Forty minutes. So she\'ll be here around... let me think.' },
      { who: 'A', text: 'We should meet her at the bus stop at four-ten.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set2_3',
    audioUrl: '/listening_audio/el3_set2_q3.mp3',
    label: '問3',
    hint: '兄妹で祖父母への贈り物を相談している。',
    script: 'A: What should we get Grandma for her seventieth birthday?\nB: How about a scarf? She always wears one.\nA: We gave her a scarf last year. A photo album?\nB: We did that two years ago. What about flowers and a cake?\nA: She loves gardening. Let\'s get her flowers she can plant in the garden, not cut flowers.',
    turns: [
      { who: 'A', text: 'What should we get Grandma for her seventieth birthday?' },
      { who: 'B', text: 'How about a scarf? She always wears one.' },
      { who: 'A', text: 'We gave her a scarf last year. A photo album?' },
      { who: 'B', text: 'We did that two years ago. What about flowers and a cake?' },
      { who: 'A', text: 'She loves gardening. Let\'s get her flowers she can plant in the garden, not cut flowers.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set2_4',
    audioUrl: '/listening_audio/el3_set2_q4.mp3',
    label: '問4',
    hint: '会社で会議の変更連絡をしている。',
    script: 'A: Did you hear about tomorrow\'s meeting?\nB: It\'s at ten in Room 3, right?\nA: The time is the same, but the room changed to Room 5 on the fourth floor.\nB: Room 5? Isn\'t that the small one?\nA: Yes, but only six people are coming, so it\'s fine.',
    turns: [
      { who: 'A', text: 'Did you hear about tomorrow\'s meeting?' },
      { who: 'B', text: 'It\'s at ten in Room 3, right?' },
      { who: 'A', text: 'The time is the same, but the room changed to Room 5 on the fourth floor.' },
      { who: 'B', text: 'Room 5? Isn\'t that the small one?' },
      { who: 'A', text: 'Yes, but only six people are coming, so it\'s fine.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set2_5',
    audioUrl: '/listening_audio/el3_set2_q5.mp3',
    label: '問5',
    hint: '新しい携帯電話の契約について話している。',
    script: 'A: How much is this smartphone?\nB: It\'s 60,000 yen, but today we have a campaign. It\'s 50,000 yen if you pay cash.\nA: I only have my credit card.\nB: With a card it\'s the regular price, but you get 5,000 yen worth of points.\nA: OK, I\'ll use my card then.',
    turns: [
      { who: 'A', text: 'How much is this smartphone?' },
      { who: 'B', text: 'It\'s 60,000 yen, but today we have a campaign. It\'s 50,000 yen if you pay cash.' },
      { who: 'A', text: 'I only have my credit card.' },
      { who: 'B', text: 'With a card it\'s the regular price, but you get 5,000 yen worth of points.' },
      { who: 'A', text: 'OK, I\'ll use my card then.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set2_6',
    audioUrl: '/listening_audio/el3_set2_q6.mp3',
    label: '問6',
    hint: '宿題のレポートについて話している。',
    script: 'A: Have you finished the history report?\nB: Almost. I just have to write the conclusion.\nA: Isn\'t it due tomorrow?\nB: No, the teacher changed it to Friday because of the school trip.\nA: Lucky! I haven\'t even started mine.',
    turns: [
      { who: 'A', text: 'Have you finished the history report?' },
      { who: 'B', text: 'Almost. I just have to write the conclusion.' },
      { who: 'A', text: 'Isn\'t it due tomorrow?' },
      { who: 'B', text: 'No, the teacher changed it to Friday because of the school trip.' },
      { who: 'A', text: 'Lucky! I haven\'t even started mine.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL3_SET2: ListeningProblem = {
  id: 'q_el3_set2',
  category: '第2回 短い対話の内容一致（標準）',
  readCount: 1,
  audioTracks: EL3_SET2_TRACKS,
  text: `第2回　第3問（6問・1回読み）　【難易度：標準】

第3問では、2人の短い対話が1回だけ流れます。それぞれの問いの答えとして最も適切なものを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は1回読みなので、まずは1回で解き、答え合わせの前にもう一度だけ聞いて確かめてください。

【解き方のコツ】
音声が流れる前に「場面」と「Question」を読み、選択肢4つの違いを1語で言えるようにしておきます。1回読みでは、聞くべき1語が決まっているかどうかで勝負が決まります。

────────────────────
問1（話者：男性（店主） / 女性（高校生））
場面：喫茶店でアルバイトの面接をしている。
Question: When will the girl work on Saturdays?
① From 8:00 a.m.
② From 11:00 a.m.
③ From noon
④ From 4:00 p.m.

────────────────────
問2（話者：女性（大学生） / 男性（大学生））
場面：空港で友達を待っている。
Question: When will Yuki arrive at the bus stop?
① 3:30
② 3:40
③ 4:00
④ 4:10

────────────────────
問3（話者：男性（兄） / 女性（妹））
場面：兄妹で祖父母への贈り物を相談している。
Question: What will they probably give their grandmother?
① Flowers to plant in the garden
② A photo album
③ Cut flowers and a cake
④ A scarf

────────────────────
問4（話者：女性（会社員） / 男性（会社員））
場面：会社で会議の変更連絡をしている。
Question: What was changed about the meeting?
① The room
② The time
③ The number of people
④ The date

────────────────────
問5（話者：男性（客） / 女性（店員））
場面：新しい携帯電話の契約について話している。
Question: How will the man pay, and what will he get?
① Cash and pay 50,000 yen
② Card and pay 50,000 yen
③ Card and get points worth 5,000 yen
④ Cash and get points worth 5,000 yen

────────────────────
問6（話者：女性（高校生） / 男性（高校生））
場面：宿題のレポートについて話している。
Question: When is the report due?
① Today
② Tomorrow
③ Thursday
④ Friday`,
  subQuestions: [
    {
      id: 'q_el3_set2_1',
      label: '問1 When will the girl work on Saturdays?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: 'until eleven → start at noonの時間変換',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set2_2',
      label: '問2 When will Yuki arrive at the bus stop?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '3:00着＋30分（荷物）＋40分（バス）＝4:10',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set2_3',
      label: '問3 What will they probably give their grandmother?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '候補3つを過去の実績で消去し、最終提案が結論',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set2_4',
      label: '問4 What was changed about the meeting?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: 'The time is the same, but〜の対比で変わったのは部屋のみ',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set2_5',
      label: '問5 How will the man pay, and what will he get?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '支払方法で条件が変わる（現金→値引き／カード→ポイント）',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set2_6',
      label: '問6 When is the report due?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '明日締切→先生が金曜に変更、の訂正型',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
  ],
  explanation: `第2回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ③
場面：喫茶店でアルバイトの面接をしている。
スクリプト：A: Can you work on weekdays after school?
B: I can work on Mondays and Wednesdays, from four to eight.
A: We also need someone on Saturday mornings.
B: I have piano lessons until eleven, so I can start at noon.
A: OK. Let's start with Monday, Wednesday, and Saturday afternoons.
Question: When will the girl work on Saturdays?
正解の選択肢：From noon
until eleven → start at noonの時間変換。morningの希望が叶わず午後勤務に。時刻の複数出現がひっかけ。

問2　正解は ④
場面：空港で友達を待っている。
スクリプト：A: Yuki's flight lands at three, right?
B: Yes, but she has to pick up her luggage. That takes about thirty minutes.
A: And the bus from the airport to the city?
B: Forty minutes. So she'll be here around... let me think.
A: We should meet her at the bus stop at four-ten.
Question: When will Yuki arrive at the bus stop?
正解の選択肢：4:10
3:00着＋30分（荷物）＋40分（バス）＝4:10。時間計算の連鎖。2026年問17型。

問3　正解は ①
場面：兄妹で祖父母への贈り物を相談している。
スクリプト：A: What should we get Grandma for her seventieth birthday?
B: How about a scarf? She always wears one.
A: We gave her a scarf last year. A photo album?
B: We did that two years ago. What about flowers and a cake?
A: She loves gardening. Let's get her flowers she can plant in the garden, not cut flowers.
Question: What will they probably give their grandmother?
正解の選択肢：Flowers to plant in the garden
候補3つを過去の実績で消去し、最終提案が結論。not cut flowersの限定がポイント。2023年問13型（提案→修正→合意）。

問4　正解は ①
場面：会社で会議の変更連絡をしている。
スクリプト：A: Did you hear about tomorrow's meeting?
B: It's at ten in Room 3, right?
A: The time is the same, but the room changed to Room 5 on the fourth floor.
B: Room 5? Isn't that the small one?
A: Yes, but only six people are coming, so it's fine.
Question: What was changed about the meeting?
正解の選択肢：The room
The time is the same, but〜の対比で変わったのは部屋のみ。変わらない情報と変わった情報の聞き分け。

問5　正解は ③
場面：新しい携帯電話の契約について話している。
スクリプト：A: How much is this smartphone?
B: It's 60,000 yen, but today we have a campaign. It's 50,000 yen if you pay cash.
A: I only have my credit card.
B: With a card it's the regular price, but you get 5,000 yen worth of points.
A: OK, I'll use my card then.
Question: How will the man pay, and what will he get?
正解の選択肢：Card and get points worth 5,000 yen
支払方法で条件が変わる（現金→値引き／カード→ポイント）。最終選択（カード）と特典の組み合わせを問う。

問6　正解は ④
場面：宿題のレポートについて話している。
スクリプト：A: Have you finished the history report?
B: Almost. I just have to write the conclusion.
A: Isn't it due tomorrow?
B: No, the teacher changed it to Friday because of the school trip.
A: Lucky! I haven't even started mine.
Question: When is the report due?
正解の選択肢：Friday
明日締切→先生が金曜に変更、の訂正型。曜日の変更に注意。2022年問13型。`,
  surroundingKnowledge: [
    '第3問は1回読み。音声が流れる前に場面と設問文を読み終えておくのが前提の大問である。',
    '設問文の疑問詞が答えの型を決める。How long → 期間、How much → 金額、What will 〜 do → 次の行動。',
    '数量・金額・時刻は「訂正」がつきもの。最初に聞こえた数字はダミーであることが多い。',
    'but / actually / instead / in total / on second thought の後ろに結論が来る。',
    '選択肢の誤りは「最初に出た数字」「別人の行動」「条件を満たさない案」のどれかに集約される。',
  ],
  deepDiveTopics: [
    '「先読み」を習慣にする。場面＋設問文＋選択肢の3点を10秒で読む練習を単独でやると効く。',
    '聞こえた単語がそのまま入っている選択肢はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。合意した内容が答えになる。',
  ],
};

const EL3_SET3_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el3_set3_1',
    audioUrl: '/listening_audio/el3_set3_q1.mp3',
    label: '問1',
    hint: '動物園での見学計画を立てている。',
    script: 'A: The pandas are the most popular. The line is already long.\nB: Can we see them last, then?\nA: Good idea. We\'ll start with the elephants near the entrance.\nB: And the monkeys after that?\nA: Sure. Then lunch, and the pandas in the afternoon when the line is shorter.',
    turns: [
      { who: 'A', text: 'The pandas are the most popular. The line is already long.' },
      { who: 'B', text: 'Can we see them last, then?' },
      { who: 'A', text: 'Good idea. We\'ll start with the elephants near the entrance.' },
      { who: 'B', text: 'And the monkeys after that?' },
      { who: 'A', text: 'Sure. Then lunch, and the pandas in the afternoon when the line is shorter.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set3_2',
    audioUrl: '/listening_audio/el3_set3_q2.mp3',
    label: '問2',
    hint: '風邪をひいた生徒と先生が話している。',
    script: 'A: You look pale. Are you all right?\nB: I have a headache and a slight fever.\nA: You should go to the nurse\'s office.\nB: But we have a math test this afternoon!\nA: Your health comes first. You can take the test tomorrow.\nB: OK. I\'ll go now and take the test tomorrow.',
    turns: [
      { who: 'A', text: 'You look pale. Are you all right?' },
      { who: 'B', text: 'I have a headache and a slight fever.' },
      { who: 'A', text: 'You should go to the nurse\'s office.' },
      { who: 'B', text: 'But we have a math test this afternoon!' },
      { who: 'A', text: 'Your health comes first. You can take the test tomorrow.' },
      { who: 'B', text: 'OK. I\'ll go now and take the test tomorrow.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set3_3',
    audioUrl: '/listening_audio/el3_set3_q3.mp3',
    label: '問3',
    hint: 'マンションの買い物の分担を話している。',
    script: 'A: We\'re out of milk and eggs.\nB: I\'ll stop by the supermarket on my way home.\nA: Can you also get bread? Not the white one ̶ the whole grain one.\nB: Sure. Anything else?\nA: No, that\'s all. Oh wait ̶ do we have butter?\nB: Yes, I bought some yesterday.',
    turns: [
      { who: 'A', text: 'We\'re out of milk and eggs.' },
      { who: 'B', text: 'I\'ll stop by the supermarket on my way home.' },
      { who: 'A', text: 'Can you also get bread? Not the white one ̶ the whole grain one.' },
      { who: 'B', text: 'Sure. Anything else?' },
      { who: 'A', text: 'No, that\'s all. Oh wait ̶ do we have butter?' },
      { who: 'B', text: 'Yes, I bought some yesterday.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set3_4',
    audioUrl: '/listening_audio/el3_set3_q4.mp3',
    label: '問4',
    hint: 'オンラインで買った商品の不具合について話している。',
    script: 'A: The headphones I ordered last week arrived yesterday, but the left side doesn\'t work.\nB: I\'m sorry to hear that. We can exchange them or give you a refund.\nA: I\'d like to exchange them, please.\nB: Please send them back with the form in the box. Shipping is free.\nA: How long will it take to get the new ones?\nB: About a week after we receive yours.',
    turns: [
      { who: 'A', text: 'The headphones I ordered last week arrived yesterday, but the left side doesn\'t work.' },
      { who: 'B', text: 'I\'m sorry to hear that. We can exchange them or give you a refund.' },
      { who: 'A', text: 'I\'d like to exchange them, please.' },
      { who: 'B', text: 'Please send them back with the form in the box. Shipping is free.' },
      { who: 'A', text: 'How long will it take to get the new ones?' },
      { who: 'B', text: 'About a week after we receive yours.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set3_5',
    audioUrl: '/listening_audio/el3_set3_q5.mp3',
    label: '問5',
    hint: '博物館でガイドツアーについて尋ねている。',
    script: 'A: Are there any guided tours in English?\nB: Yes, at eleven and at two. The eleven o\'clock tour is full, I\'m afraid.\nA: Then I\'ll take the two o\'clock one. How long is it?\nB: Ninety minutes. It starts at the main hall, next to the gift shop.\nA: Where is that?\nB: Go straight down this hallway, and it\'s on your right.',
    turns: [
      { who: 'A', text: 'Are there any guided tours in English?' },
      { who: 'B', text: 'Yes, at eleven and at two. The eleven o\'clock tour is full, I\'m afraid.' },
      { who: 'A', text: 'Then I\'ll take the two o\'clock one. How long is it?' },
      { who: 'B', text: 'Ninety minutes. It starts at the main hall, next to the gift shop.' },
      { who: 'A', text: 'Where is that?' },
      { who: 'B', text: 'Go straight down this hallway, and it\'s on your right.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set3_6',
    audioUrl: '/listening_audio/el3_set3_q6.mp3',
    label: '問6',
    hint: 'テニス部の練習日程を確認している。',
    script: 'A: This week we have practice on Tuesday and Thursday as usual.\nB: What about Friday?\nA: Friday is canceled because of the school festival.\nB: And the match on Saturday?\nA: It\'s still on. Be at the courts by eight thirty.\nB: Eight thirty? That\'s earlier than usual!\nA: The other team asked for an early start.',
    turns: [
      { who: 'A', text: 'This week we have practice on Tuesday and Thursday as usual.' },
      { who: 'B', text: 'What about Friday?' },
      { who: 'A', text: 'Friday is canceled because of the school festival.' },
      { who: 'B', text: 'And the match on Saturday?' },
      { who: 'A', text: 'It\'s still on. Be at the courts by eight thirty.' },
      { who: 'B', text: 'Eight thirty? That\'s earlier than usual!' },
      { who: 'A', text: 'The other team asked for an early start.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL3_SET3: ListeningProblem = {
  id: 'q_el3_set3',
  category: '第3回 短い対話の内容一致（標準）',
  readCount: 1,
  audioTracks: EL3_SET3_TRACKS,
  text: `第3回　第3問（6問・1回読み）　【難易度：標準】

第3問では、2人の短い対話が1回だけ流れます。それぞれの問いの答えとして最も適切なものを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は1回読みなので、まずは1回で解き、答え合わせの前にもう一度だけ聞いて確かめてください。

【解き方のコツ】
音声が流れる前に「場面」と「Question」を読み、選択肢4つの違いを1語で言えるようにしておきます。1回読みでは、聞くべき1語が決まっているかどうかで勝負が決まります。

────────────────────
問1（話者：男性（父親） / 女性（娘・小学生））
場面：動物園での見学計画を立てている。
Question: What will they see first?
① The monkeys
② The elephants
③ They will have lunch first
④ The pandas

────────────────────
問2（話者：女性（先生） / 男性（生徒））
場面：風邪をひいた生徒と先生が話している。
Question: What will the boy do?
① Go to the nurse's office now
② Go home right away
③ Take the math test this afternoon
④ Study for tomorrow's test in class

────────────────────
問3（話者：女性（妻） / 男性（夫））
場面：マンションの買い物の分担を話している。
Question: What will the husband buy?
① Milk, eggs, bread, and butter
② Milk, eggs, and white bread
③ Eggs and butter only
④ Milk, eggs, and whole grain bread

────────────────────
問4（話者：男性（客） / 女性（店のスタッフ））
場面：オンラインで買った商品の不具合について話している。
Question: What will the man do first?
① Wait a week
② Get a refund
③ Send back the broken headphones
④ Buy new headphones at a store

────────────────────
問5（話者：女性（旅行者） / 男性（受付））
場面：博物館でガイドツアーについて尋ねている。
Question: Which tour will the woman join?
① A self-guided tour
② The 3:30 tour
③ The 2:00 tour
④ The 11:00 tour

────────────────────
問6（話者：男性（キャプテン） / 女性（部員））
場面：テニス部の練習日程を確認している。
Question: What should the woman do on Saturday?
① Arrive at the courts at 8:30
② Go to the school festival
③ Play a match in the afternoon
④ Practice at the school`,
  subQuestions: [
    {
      id: 'q_el3_set3_1',
      label: '問1 What will they see first?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: '順序の組み立て',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set3_2',
      label: '問2 What will the boy do?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: 'テストを受ける vs保健室、の葛藤から最終決定（保健室へ今行く・テストは明日）',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set3_3',
      label: '問3 What will the husband buy?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '買う物リストの確定（牛乳・卵・全粒粉パン）',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set3_4',
      label: '問4 What will the man do first?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: '交換を選択（返金でない）',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set3_5',
      label: '問5 Which tour will the woman join?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '11時は満員→2時のツアーに決定',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set3_6',
      label: '問6 What should the woman do on Saturday?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '曜日ごとの予定整理',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
  ],
  explanation: `第3回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ②
場面：動物園での見学計画を立てている。
スクリプト：A: The pandas are the most popular. The line is already long.
B: Can we see them last, then?
A: Good idea. We'll start with the elephants near the entrance.
B: And the monkeys after that?
A: Sure. Then lunch, and the pandas in the afternoon when the line is shorter.
Question: What will they see first?
正解の選択肢：The elephants
順序の組み立て。パンダは最初の話題だが last に変更。near the entrance が第一候補の根拠。

問2　正解は ①
場面：風邪をひいた生徒と先生が話している。
スクリプト：A: You look pale. Are you all right?
B: I have a headache and a slight fever.
A: You should go to the nurse's office.
B: But we have a math test this afternoon!
A: Your health comes first. You can take the test tomorrow.
B: OK. I'll go now and take the test tomorrow.
Question: What will the boy do?
正解の選択肢：Go to the nurse's office now
テストを受ける vs保健室、の葛藤から最終決定（保健室へ今行く・テストは明日）。2024年問15型（現在の行動を問う）。

問3　正解は ④
場面：マンションの買い物の分担を話している。
スクリプト：A: We're out of milk and eggs.
B: I'll stop by the supermarket on my way home.
A: Can you also get bread? Not the white one ̶ the whole grain one.
B: Sure. Anything else?
A: No, that's all. Oh wait ̶ do we have butter?
B: Yes, I bought some yesterday.
Question: What will the husband buy?
正解の選択肢：Milk, eggs, and whole grain bread
買う物リストの確定（牛乳・卵・全粒粉パン）。butter は既にあり＝買わない。not the white oneの限定に注意。

問4　正解は ③
場面：オンラインで買った商品の不具合について話している。
スクリプト：A: The headphones I ordered last week arrived yesterday, but the left side doesn't work.
B: I'm sorry to hear that. We can exchange them or give you a refund.
A: I'd like to exchange them, please.
B: Please send them back with the form in the box. Shipping is free.
A: How long will it take to get the new ones?
B: About a week after we receive yours.
Question: What will the man do first?
正解の選択肢：Send back the broken headphones
交換を選択（返金でない）。まず最初に送り返す、という手順の問い。2026年問14型（What will 〜do first?）。

問5　正解は ③
場面：博物館でガイドツアーについて尋ねている。
スクリプト：A: Are there any guided tours in English?
B: Yes, at eleven and at two. The eleven o'clock tour is full, I'm afraid.
A: Then I'll take the two o'clock one. How long is it?
B: Ninety minutes. It starts at the main hall, next to the gift shop.
A: Where is that?
B: Go straight down this hallway, and it's on your right.
Question: Which tour will the woman join?
正解の選択肢：The 2:00 tour
11時は満員→2時のツアーに決定。時間帯の消去法。ガイドなしの選択肢もひっかけ。

問6　正解は ①
場面：テニス部の練習日程を確認している。
スクリプト：A: This week we have practice on Tuesday and Thursday as usual.
B: What about Friday?
A: Friday is canceled because of the school festival.
B: And the match on Saturday?
A: It's still on. Be at the courts by eight thirty.
B: Eight thirty? That's earlier than usual!
A: The other team asked for an early start.
Question: What should the woman do on Saturday?
正解の選択肢：Arrive at the courts at 8:30
曜日ごとの予定整理。土曜は試合あり＆集合は8:30。キャンセル（金曜）と時刻変更の複合情報。`,
  surroundingKnowledge: [
    '第3問は1回読み。音声が流れる前に場面と設問文を読み終えておくのが前提の大問である。',
    '設問文の疑問詞が答えの型を決める。How long → 期間、How much → 金額、What will 〜 do → 次の行動。',
    '数量・金額・時刻は「訂正」がつきもの。最初に聞こえた数字はダミーであることが多い。',
    'but / actually / instead / in total / on second thought の後ろに結論が来る。',
    '選択肢の誤りは「最初に出た数字」「別人の行動」「条件を満たさない案」のどれかに集約される。',
  ],
  deepDiveTopics: [
    '「先読み」を習慣にする。場面＋設問文＋選択肢の3点を10秒で読む練習を単独でやると効く。',
    '聞こえた単語がそのまま入っている選択肢はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。合意した内容が答えになる。',
  ],
};

const EL3_SET4_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el3_set4_1',
    audioUrl: '/listening_audio/el3_set4_q1.mp3',
    label: '問1',
    hint: '引っ越しの段取りを話している。',
    script: 'A: The moving truck comes at nine tomorrow.\nB: I\'ll help you pack the kitchen stuff tonight.\nA: Thanks. I already packed my books and clothes.\nB: What about your piano?\nA: A special company is coming for it on Friday. It stays here until then.\nB: Got it. So tonight, just the kitchen.',
    turns: [
      { who: 'A', text: 'The moving truck comes at nine tomorrow.' },
      { who: 'B', text: 'I\'ll help you pack the kitchen stuff tonight.' },
      { who: 'A', text: 'Thanks. I already packed my books and clothes.' },
      { who: 'B', text: 'What about your piano?' },
      { who: 'A', text: 'A special company is coming for it on Friday. It stays here until then.' },
      { who: 'B', text: 'Got it. So tonight, just the kitchen.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set4_2',
    audioUrl: '/listening_audio/el3_set4_q2.mp3',
    label: '問2',
    hint: 'バスを降りる場所を確認している。',
    script: 'A: Does this bus go to the science museum?\nB: No, it goes to the art museum. For the science museum, get off at the third stop and walk five minutes.\nA: The third stop... What\'s the stop called?\nB: City Hospital. You\'ll see a big park on your left.\nA: Thanks. And which stop is this bus\'s last stop?\nB: The art museum.',
    turns: [
      { who: 'A', text: 'Does this bus go to the science museum?' },
      { who: 'B', text: 'No, it goes to the art museum. For the science museum, get off at the third stop and walk five minutes.' },
      { who: 'A', text: 'The third stop... What\'s the stop called?' },
      { who: 'B', text: 'City Hospital. You\'ll see a big park on your left.' },
      { who: 'A', text: 'Thanks. And which stop is this bus\'s last stop?' },
      { who: 'B', text: 'The art museum.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set4_3',
    audioUrl: '/listening_audio/el3_set4_q3.mp3',
    label: '問3',
    hint: '遅れた荷物の配達について電話している。',
    script: 'A: My package was supposed to arrive yesterday, but it didn\'t.\nB: I\'m sorry. Let me check... It left our Osaka center this morning.\nA: When will it arrive in Tokyo?\nB: If it left this morning, it should arrive tomorrow before noon.\nA: I won\'t be home in the morning. Can you deliver it in the evening?\nB: Certainly. Between six and eight, then.',
    turns: [
      { who: 'A', text: 'My package was supposed to arrive yesterday, but it didn\'t.' },
      { who: 'B', text: 'I\'m sorry. Let me check... It left our Osaka center this morning.' },
      { who: 'A', text: 'When will it arrive in Tokyo?' },
      { who: 'B', text: 'If it left this morning, it should arrive tomorrow before noon.' },
      { who: 'A', text: 'I won\'t be home in the morning. Can you deliver it in the evening?' },
      { who: 'B', text: 'Certainly. Between six and eight, then.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set4_4',
    audioUrl: '/listening_audio/el3_set4_q4.mp3',
    label: '問4',
    hint: '学校の文化祭の出し物を決めている。',
    script: 'A: Our class needs to decide today: a haunted house or a café.\nB: The café idea got more votes in the survey.\nA: True, but three other classes are doing cafés already.\nB: Oh. Then the haunted house would be more unique.\nA: Exactly. Let\'s go with that. I\'ll tell our teacher.',
    turns: [
      { who: 'A', text: 'Our class needs to decide today: a haunted house or a café.' },
      { who: 'B', text: 'The café idea got more votes in the survey.' },
      { who: 'A', text: 'True, but three other classes are doing cafés already.' },
      { who: 'B', text: 'Oh. Then the haunted house would be more unique.' },
      { who: 'A', text: 'Exactly. Let\'s go with that. I\'ll tell our teacher.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set4_5',
    audioUrl: '/listening_audio/el3_set4_q5.mp3',
    label: '問5',
    hint: 'レンタカーの予約変更をしている。',
    script: 'A: I reserved a compact car for this weekend, but two more people are coming.\nB: Then you\'ll need a bigger car. We have a van for seven people.\nA: How much more is it?\nB: 3,000 yen more per day.\nA: That\'s fine. Same pickup time, ten o\'clock on Saturday?\nB: Yes. I\'ll change your reservation to a van.',
    turns: [
      { who: 'A', text: 'I reserved a compact car for this weekend, but two more people are coming.' },
      { who: 'B', text: 'Then you\'ll need a bigger car. We have a van for seven people.' },
      { who: 'A', text: 'How much more is it?' },
      { who: 'B', text: '3,000 yen more per day.' },
      { who: 'A', text: 'That\'s fine. Same pickup time, ten o\'clock on Saturday?' },
      { who: 'B', text: 'Yes. I\'ll change your reservation to a van.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set4_6',
    audioUrl: '/listening_audio/el3_set4_q6.mp3',
    label: '問6',
    hint: '写真展の感想を話している。',
    script: 'A: What did you think of the photo exhibition?\nB: The nature photos were amazing, especially the ones of the northern lights.\nA: I liked the city photos better.\nB: Really? They were all black and white. I found them a bit dark.\nA: That\'s what I liked about them. But the entrance fee was a little high, right?\nB: Yeah, 1,800 yen is a lot for students.',
    turns: [
      { who: 'A', text: 'What did you think of the photo exhibition?' },
      { who: 'B', text: 'The nature photos were amazing, especially the ones of the northern lights.' },
      { who: 'A', text: 'I liked the city photos better.' },
      { who: 'B', text: 'Really? They were all black and white. I found them a bit dark.' },
      { who: 'A', text: 'That\'s what I liked about them. But the entrance fee was a little high, right?' },
      { who: 'B', text: 'Yeah, 1,800 yen is a lot for students.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL3_SET4: ListeningProblem = {
  id: 'q_el3_set4',
  category: '第4回 短い対話の内容一致（標準）',
  readCount: 1,
  audioTracks: EL3_SET4_TRACKS,
  text: `第4回　第3問（6問・1回読み）　【難易度：標準】

第3問では、2人の短い対話が1回だけ流れます。それぞれの問いの答えとして最も適切なものを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は1回読みなので、まずは1回で解き、答え合わせの前にもう一度だけ聞いて確かめてください。

【解き方のコツ】
音声が流れる前に「場面」と「Question」を読み、選択肢4つの違いを1語で言えるようにしておきます。1回読みでは、聞くべき1語が決まっているかどうかで勝負が決まります。

────────────────────
問1（話者：女性（大学生） / 男性（兄））
場面：引っ越しの段取りを話している。
Question: What will they pack tonight?
① The piano
② Books
③ Clothes
④ Kitchen items

────────────────────
問2（話者：男性（旅行者） / 女性（バスの運転手））
場面：バスを降りる場所を確認している。
Question: Where should the man get off?
① At the science museum stop
② At the first stop
③ At the art museum
④ At the third stop, City Hospital

────────────────────
問3（話者：女性（客） / 男性（配達会社））
場面：遅れた荷物の配達について電話している。
Question: When will the package be delivered?
① Yesterday
② Today before noon
③ Tomorrow morning
④ Tomorrow evening

────────────────────
問4（話者：男性（高校生） / 女性（高校生））
場面：学校の文化祭の出し物を決めている。
Question: What will their class do for the festival?
① A café
② Nothing decided yet
③ A survey
④ A haunted house

────────────────────
問5（話者：女性（客） / 男性（店員））
場面：レンタカーの予約変更をしている。
Question: What did the woman decide?
① Keep the compact car
② Change to a van
③ Change the pickup time
④ Cancel the reservation

────────────────────
問6（話者：男性（大学生） / 女性（大学生））
場面：写真展の感想を話している。
Question: What do both people agree on?
① The nature photos were the best.
② The entrance fee was high.
③ The city photos were too dark.
④ The exhibition was too small.`,
  subQuestions: [
    {
      id: 'q_el3_set4_1',
      label: '問1 What will they pack tonight?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: '既に梱包済み（本・服）と別日（ピアノ）を除き、今夜は台所用品',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set4_2',
      label: '問2 Where should the man get off?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '目的地とバスの行き先が違う点がポイント',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set4_3',
      label: '問3 When will the package be delivered?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '当初予定（昨日）→変更後（明日午前）→再変更（明日夕方6〜8時）の3段階',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set4_4',
      label: '問4 What will their class do for the festival?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: '多数決（カフェ）を他クラスとの重複で覆す展開',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set4_5',
      label: '問5 What did the woman decide?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '人数増→バンに変更',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set4_6',
      label: '問6 What do both people agree on?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '感想は2人で異なる（自然 vs 都市）が、入場料が高い点で一致',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
  ],
  explanation: `第4回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ④
場面：引っ越しの段取りを話している。
スクリプト：A: The moving truck comes at nine tomorrow.
B: I'll help you pack the kitchen stuff tonight.
A: Thanks. I already packed my books and clothes.
B: What about your piano?
A: A special company is coming for it on Friday. It stays here until then.
B: Got it. So tonight, just the kitchen.
Question: What will they pack tonight?
正解の選択肢：Kitchen items
既に梱包済み（本・服）と別日（ピアノ）を除き、今夜は台所用品。時制の整理（過去・未来）が鍵。

問2　正解は ④
場面：バスを降りる場所を確認している。
スクリプト：A: Does this bus go to the science museum?
B: No, it goes to the art museum. For the science museum, get off at the third stop and walk five minutes.
A: The third stop... What's the stop called?
B: City Hospital. You'll see a big park on your left.
A: Thanks. And which stop is this bus's last stop?
B: The art museum.
Question: Where should the man get off?
正解の選択肢：At the third stop, City Hospital
目的地とバスの行き先が違う点がポイント。third stop（City Hospital）で降りる。停留所名の聞き取り。

問3　正解は ④
場面：遅れた荷物の配達について電話している。
スクリプト：A: My package was supposed to arrive yesterday, but it didn't.
B: I'm sorry. Let me check... It left our Osaka center this morning.
A: When will it arrive in Tokyo?
B: If it left this morning, it should arrive tomorrow before noon.
A: I won't be home in the morning. Can you deliver it in the evening?
B: Certainly. Between six and eight, then.
Question: When will the package be delivered?
正解の選択肢：Tomorrow evening
当初予定（昨日）→変更後（明日午前）→再変更（明日夕方6〜8時）の3段階。最終指定が正解。時間情報の連続訂正。

問4　正解は ④
場面：学校の文化祭の出し物を決めている。
スクリプト：A: Our class needs to decide today: a haunted house or a café.
B: The café idea got more votes in the survey.
A: True, but three other classes are doing cafés already.
B: Oh. Then the haunted house would be more unique.
A: Exactly. Let's go with that. I'll tell our teacher.
Question: What will their class do for the festival?
正解の選択肢：A haunted house
多数決（カフェ）を他クラスとの重複で覆す展開。more unique が決定の根拠。最終結論型。

問5　正解は ②
場面：レンタカーの予約変更をしている。
スクリプト：A: I reserved a compact car for this weekend, but two more people are coming.
B: Then you'll need a bigger car. We have a van for seven people.
A: How much more is it?
B: 3,000 yen more per day.
A: That's fine. Same pickup time, ten o'clock on Saturday?
B: Yes. I'll change your reservation to a van.
Question: What did the woman decide?
正解の選択肢：Change to a van
人数増→バンに変更。値段と時刻は変更なし。何が変わり何が変わらないかの整理。

問6　正解は ②
場面：写真展の感想を話している。
スクリプト：A: What did you think of the photo exhibition?
B: The nature photos were amazing, especially the ones of the northern lights.
A: I liked the city photos better.
B: Really? They were all black and white. I found them a bit dark.
A: That's what I liked about them. But the entrance fee was a little high, right?
B: Yeah, 1,800 yen is a lot for students.
Question: What do both people agree on?
正解の選択肢：The entrance fee was high.
感想は2人で異なる（自然 vs 都市）が、入場料が高い点で一致。What do they have in common?型。2025年問16型。`,
  surroundingKnowledge: [
    '第3問は1回読み。音声が流れる前に場面と設問文を読み終えておくのが前提の大問である。',
    '設問文の疑問詞が答えの型を決める。How long → 期間、How much → 金額、What will 〜 do → 次の行動。',
    '数量・金額・時刻は「訂正」がつきもの。最初に聞こえた数字はダミーであることが多い。',
    'but / actually / instead / in total / on second thought の後ろに結論が来る。',
    '選択肢の誤りは「最初に出た数字」「別人の行動」「条件を満たさない案」のどれかに集約される。',
  ],
  deepDiveTopics: [
    '「先読み」を習慣にする。場面＋設問文＋選択肢の3点を10秒で読む練習を単独でやると効く。',
    '聞こえた単語がそのまま入っている選択肢はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。合意した内容が答えになる。',
  ],
};

const EL3_SET5_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el3_set5_1',
    audioUrl: '/listening_audio/el3_set5_q1.mp3',
    label: '問1',
    hint: '日本に来た留学生とホストファミリーが話している。',
    script: 'A: I want to try Japanese food while I\'m here.\nB: Do you like sushi?\nA: I love it, but I\'m allergic to shellfish, so no shrimp or crab, please.\nB: How about a conveyor-belt sushi place? You can choose only what you like.\nA: That sounds perfect. Can we go this weekend?\nB: Sure, Saturday night. I\'ll make a reservation.',
    turns: [
      { who: 'A', text: 'I want to try Japanese food while I\'m here.' },
      { who: 'B', text: 'Do you like sushi?' },
      { who: 'A', text: 'I love it, but I\'m allergic to shellfish, so no shrimp or crab, please.' },
      { who: 'B', text: 'How about a conveyor-belt sushi place? You can choose only what you like.' },
      { who: 'A', text: 'That sounds perfect. Can we go this weekend?' },
      { who: 'B', text: 'Sure, Saturday night. I\'ll make a reservation.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set5_2',
    audioUrl: '/listening_audio/el3_set5_q2.mp3',
    label: '問2',
    hint: 'スマホの画面が割れた生徒同士が話している。',
    script: 'A: Oh no, I dropped my phone and the screen cracked!\nB: Is it still working?\nA: Yes, but it\'s hard to read messages.\nB: There\'s a repair shop next to the station. They fix screens in an hour.\nA: How much does it cost?\nB: My brother paid 8,000 yen last month, but with a student discount it was 6,000.',
    turns: [
      { who: 'A', text: 'Oh no, I dropped my phone and the screen cracked!' },
      { who: 'B', text: 'Is it still working?' },
      { who: 'A', text: 'Yes, but it\'s hard to read messages.' },
      { who: 'B', text: 'There\'s a repair shop next to the station. They fix screens in an hour.' },
      { who: 'A', text: 'How much does it cost?' },
      { who: 'B', text: 'My brother paid 8,000 yen last month, but with a student discount it was 6,000.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set5_3',
    audioUrl: '/listening_audio/el3_set5_q3.mp3',
    label: '問3',
    hint: '週末のボランティア活動について話している。',
    script: 'A: Are you joining the beach cleanup on Sunday?\nB: I want to, but I work until noon on Sundays.\nA: The cleanup starts at ten and ends at two.\nB: Then I can only join for the second half.\nA: That\'s fine. Just come when you can. Bring gloves if you have them.\nB: I don\'t, but I\'ll buy some on the way.',
    turns: [
      { who: 'A', text: 'Are you joining the beach cleanup on Sunday?' },
      { who: 'B', text: 'I want to, but I work until noon on Sundays.' },
      { who: 'A', text: 'The cleanup starts at ten and ends at two.' },
      { who: 'B', text: 'Then I can only join for the second half.' },
      { who: 'A', text: 'That\'s fine. Just come when you can. Bring gloves if you have them.' },
      { who: 'B', text: 'I don\'t, but I\'ll buy some on the way.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set5_4',
    audioUrl: '/listening_audio/el3_set5_q4.mp3',
    label: '問4',
    hint: '英語のスピーチコンテストの準備をしている。',
    script: 'A: My speech is five minutes long, but the limit is four.\nB: Then you need to cut about sixty seconds.\nA: Which part should I cut?\nB: The introduction is too long. The story about your grandmother is the best part, so keep it.\nA: OK. I\'ll shorten the opening and practice again tonight.',
    turns: [
      { who: 'A', text: 'My speech is five minutes long, but the limit is four.' },
      { who: 'B', text: 'Then you need to cut about sixty seconds.' },
      { who: 'A', text: 'Which part should I cut?' },
      { who: 'B', text: 'The introduction is too long. The story about your grandmother is the best part, so keep it.' },
      { who: 'A', text: 'OK. I\'ll shorten the opening and practice again tonight.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set5_5',
    audioUrl: '/listening_audio/el3_set5_q5.mp3',
    label: '問5',
    hint: '夜、夕食の買い出しについて話している。',
    script: 'A: I\'m going to the store. Do we need anything?\nB: We\'re out of rice. And get some fish for dinner.\nA: Salmon or tuna?\nB: Tuna is on sale today, but the kids prefer salmon.\nA: I\'ll get salmon, then. Anything sweet for dessert?\nB: The kids ate all the ice cream yesterday, so yes, please.',
    turns: [
      { who: 'A', text: 'I\'m going to the store. Do we need anything?' },
      { who: 'B', text: 'We\'re out of rice. And get some fish for dinner.' },
      { who: 'A', text: 'Salmon or tuna?' },
      { who: 'B', text: 'Tuna is on sale today, but the kids prefer salmon.' },
      { who: 'A', text: 'I\'ll get salmon, then. Anything sweet for dessert?' },
      { who: 'B', text: 'The kids ate all the ice cream yesterday, so yes, please.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set5_6',
    audioUrl: '/listening_audio/el3_set5_q6.mp3',
    label: '問6',
    hint: '就職活動の面接の服装について相談している。',
    script: 'A: I have a job interview on Friday. Should I wear a suit?\nB: For a company interview, yes. Which company is it?\nA: A design company. My friend there said everyone wears casual clothes.\nB: Still, for the interview itself, a suit is safer. You can dress casually after you get the job.\nA: You\'re right. I\'ll wear my navy suit.',
    turns: [
      { who: 'A', text: 'I have a job interview on Friday. Should I wear a suit?' },
      { who: 'B', text: 'For a company interview, yes. Which company is it?' },
      { who: 'A', text: 'A design company. My friend there said everyone wears casual clothes.' },
      { who: 'B', text: 'Still, for the interview itself, a suit is safer. You can dress casually after you get the job.' },
      { who: 'A', text: 'You\'re right. I\'ll wear my navy suit.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL3_SET5: ListeningProblem = {
  id: 'q_el3_set5',
  category: '第5回 短い対話の内容一致（標準）',
  readCount: 1,
  audioTracks: EL3_SET5_TRACKS,
  text: `第5回　第3問（6問・1回読み）　【難易度：標準】

第3問では、2人の短い対話が1回だけ流れます。それぞれの問いの答えとして最も適切なものを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は1回読みなので、まずは1回で解き、答え合わせの前にもう一度だけ聞いて確かめてください。

【解き方のコツ】
音声が流れる前に「場面」と「Question」を読み、選択肢4つの違いを1語で言えるようにしておきます。1回読みでは、聞くべき1語が決まっているかどうかで勝負が決まります。

────────────────────
問1（話者：男性（留学生） / 女性（ホストマザー））
場面：日本に来た留学生とホストファミリーが話している。
Question: Why is the conveyor-belt sushi restaurant a good choice?
① It is famous for shrimp.
② It is near their house.
③ It is cheap.
④ He can avoid shellfish easily.

────────────────────
問2（話者：女性（高校生） / 男性（高校生））
場面：スマホの画面が割れた生徒同士が話している。
Question: How much will the girl probably pay for the repair?
① 6,000 yen
② 10,000 yen
③ Nothing, it's free
④ 8,000 yen

────────────────────
問3（話者：男性（大学生） / 女性（大学生））
場面：週末のボランティア活動について話している。
Question: What will the woman do on Sunday?
① Skip the cleanup
② Join the cleanup around noon
③ Bring her own gloves
④ Join the cleanup from 10:00

────────────────────
問4（話者：女性（高校生） / 男性（先生））
場面：英語のスピーチコンテストの準備をしている。
Question: What will the student cut from her speech?
① The conclusion
② The story about her grandmother
③ Part of the introduction
④ One minute from the middle

────────────────────
問5（話者：女性（姉） / 女性（母））
場面：夜、夕食の買い出しについて話している。
Question: What will the shopper buy?
① Rice, salmon, and ice cream
② Rice, tuna, and ice cream
③ Salmon and ice cream only
④ Rice and tuna only

────────────────────
問6（話者：女性（大学生） / 男性（兄））
場面：就職活動の面接の服装について相談している。
Question: What will the woman wear to the interview?
① Casual clothes
② Her navy suit
③ The same clothes as the employees
④ A new suit she will buy`,
  subQuestions: [
    {
      id: 'q_el3_set5_1',
      label: '問1 Why is the conveyor-belt sushi restaurant a good choice?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: 'アレルギー（甲殻類NG）→自分で選べる回転寿司が最適、という理由の推論',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set5_2',
      label: '問2 How much will the girl probably pay for the repair?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '通常8,000円・学生割引6,000円',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set5_3',
      label: '問3 What will the woman do on Sunday?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '勤務（正午まで）→活動の後半から参加',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set5_4',
      label: '問4 What will the student cut from her speech?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: 'どこを削るかの助言（序論が長すぎ）',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set5_5',
      label: '問5 What will the shopper buy?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '米・魚（セールのマグロではなく子供の好みでサケ）・アイス（昨日食べ尽くした）',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set5_6',
      label: '問6 What will the woman wear to the interview?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '職場のカジュアル文化（ダミー情報）vs面接はスーツ、という助言に従う',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
  ],
  explanation: `第5回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ④
場面：日本に来た留学生とホストファミリーが話している。
スクリプト：A: I want to try Japanese food while I'm here.
B: Do you like sushi?
A: I love it, but I'm allergic to shellfish, so no shrimp or crab, please.
B: How about a conveyor-belt sushi place? You can choose only what you like.
A: That sounds perfect. Can we go this weekend?
B: Sure, Saturday night. I'll make a reservation.
Question: Why is the conveyor-belt sushi restaurant a good choice?
正解の選択肢：He can avoid shellfish easily.
アレルギー（甲殻類NG）→自分で選べる回転寿司が最適、という理由の推論。Why型の設問。

問2　正解は ①
場面：スマホの画面が割れた生徒同士が話している。
スクリプト：A: Oh no, I dropped my phone and the screen cracked!
B: Is it still working?
A: Yes, but it's hard to read messages.
B: There's a repair shop next to the station. They fix screens in an hour.
A: How much does it cost?
B: My brother paid 8,000 yen last month, but with a student discount it was 6,000.
Question: How much will the girl probably pay for the repair?
正解の選択肢：6,000 yen
通常8,000円・学生割引6,000円。話者は高校生→割引適用。条件付き価格の判定。

問3　正解は ②
場面：週末のボランティア活動について話している。
スクリプト：A: Are you joining the beach cleanup on Sunday?
B: I want to, but I work until noon on Sundays.
A: The cleanup starts at ten and ends at two.
B: Then I can only join for the second half.
A: That's fine. Just come when you can. Bring gloves if you have them.
B: I don't, but I'll buy some on the way.
Question: What will the woman do on Sunday?
正解の選択肢：Join the cleanup around noon
勤務（正午まで）→活動の後半から参加。時刻の組み合わせと部分参加の結論。

問4　正解は ③
場面：英語のスピーチコンテストの準備をしている。
スクリプト：A: My speech is five minutes long, but the limit is four.
B: Then you need to cut about sixty seconds.
A: Which part should I cut?
B: The introduction is too long. The story about your grandmother is the best part, so keep it.
A: OK. I'll shorten the opening and practice again tonight.
Question: What will the student cut from her speech?
正解の選択肢：Part of the introduction
どこを削るかの助言（序論が長すぎ）。keep it で祖母の話は残す。keep/cut の対応が鍵。

問5　正解は ①
場面：夜、夕食の買い出しについて話している。
スクリプト：A: I'm going to the store. Do we need anything?
B: We're out of rice. And get some fish for dinner.
A: Salmon or tuna?
B: Tuna is on sale today, but the kids prefer salmon.
A: I'll get salmon, then. Anything sweet for dessert?
B: The kids ate all the ice cream yesterday, so yes, please.
Question: What will the shopper buy?
正解の選択肢：Rice, salmon, and ice cream
米・魚（セールのマグロではなく子供の好みでサケ）・アイス（昨日食べ尽くした）。on sale情報で誘導するひっかけ。

問6　正解は ②
場面：就職活動の面接の服装について相談している。
スクリプト：A: I have a job interview on Friday. Should I wear a suit?
B: For a company interview, yes. Which company is it?
A: A design company. My friend there said everyone wears casual clothes.
B: Still, for the interview itself, a suit is safer. You can dress casually after you get the job.
A: You're right. I'll wear my navy suit.
Question: What will the woman wear to the interview?
正解の選択肢：Her navy suit
職場のカジュアル文化（ダミー情報）vs面接はスーツ、という助言に従う。ネイビーのスーツが具体的答え。`,
  surroundingKnowledge: [
    '第3問は1回読み。音声が流れる前に場面と設問文を読み終えておくのが前提の大問である。',
    '設問文の疑問詞が答えの型を決める。How long → 期間、How much → 金額、What will 〜 do → 次の行動。',
    '数量・金額・時刻は「訂正」がつきもの。最初に聞こえた数字はダミーであることが多い。',
    'but / actually / instead / in total / on second thought の後ろに結論が来る。',
    '選択肢の誤りは「最初に出た数字」「別人の行動」「条件を満たさない案」のどれかに集約される。',
  ],
  deepDiveTopics: [
    '「先読み」を習慣にする。場面＋設問文＋選択肢の3点を10秒で読む練習を単独でやると効く。',
    '聞こえた単語がそのまま入っている選択肢はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。合意した内容が答えになる。',
  ],
};

const EL3_SET6_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el3_set6_1',
    audioUrl: '/listening_audio/el3_set6_q1.mp3',
    label: '問1',
    hint: '町の清掃イベントの案内を確認している。',
    script: 'A: The cleanup event was moved from this Sunday to next Sunday because of the weather forecast.\nB: Oh, I already told my friends about this Sunday.\nA: Please tell them about the change. Also, the meeting place changed from the park entrance to the community center.\nB: Same time, nine o\'clock?\nA: No, thirty minutes earlier, at eight thirty.\nB: OK, new day, new place, new time. Got it.',
    turns: [
      { who: 'A', text: 'The cleanup event was moved from this Sunday to next Sunday because of the weather forecast.' },
      { who: 'B', text: 'Oh, I already told my friends about this Sunday.' },
      { who: 'A', text: 'Please tell them about the change. Also, the meeting place changed from the park entrance to the community center.' },
      { who: 'B', text: 'Same time, nine o\'clock?' },
      { who: 'A', text: 'No, thirty minutes earlier, at eight thirty.' },
      { who: 'B', text: 'OK, new day, new place, new time. Got it.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set6_2',
    audioUrl: '/listening_audio/el3_set6_q2.mp3',
    label: '問2',
    hint: '祖父母の金婚式の計画を話している。',
    script: 'A: Grandma and Grandpa\'s fiftieth anniversary is next month.\nB: Are we having a party?\nA: At a restaurant on the 20th. But Grandpa\'s doctor said he should eat early, so we moved it from dinner to lunch.\nB: Can I invite my girlfriend?\nA: It\'s family only this time. Sorry.\nB: No problem. What should I bring?\nA: Just a card. Your grandfather said no gifts.',
    turns: [
      { who: 'A', text: 'Grandma and Grandpa\'s fiftieth anniversary is next month.' },
      { who: 'B', text: 'Are we having a party?' },
      { who: 'A', text: 'At a restaurant on the 20th. But Grandpa\'s doctor said he should eat early, so we moved it from dinner to lunch.' },
      { who: 'B', text: 'Can I invite my girlfriend?' },
      { who: 'A', text: 'It\'s family only this time. Sorry.' },
      { who: 'B', text: 'No problem. What should I bring?' },
      { who: 'A', text: 'Just a card. Your grandfather said no gifts.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set6_3',
    audioUrl: '/listening_audio/el3_set6_q3.mp3',
    label: '問3',
    hint: 'ホテルのチェックインでトラブルがあった後で話している。',
    script: 'A: How was your trip?\nB: Terrible at first. The hotel couldn\'t find my reservation.\nA: Oh no. What happened?\nB: Turns out I booked it for the wrong month ̶ July instead of June.\nA: Did you find a room?\nB: Luckily they had one, but I had to pay a higher price for the same night.\nA: At least you got a room.',
    turns: [
      { who: 'A', text: 'How was your trip?' },
      { who: 'B', text: 'Terrible at first. The hotel couldn\'t find my reservation.' },
      { who: 'A', text: 'Oh no. What happened?' },
      { who: 'B', text: 'Turns out I booked it for the wrong month ̶ July instead of June.' },
      { who: 'A', text: 'Did you find a room?' },
      { who: 'B', text: 'Luckily they had one, but I had to pay a higher price for the same night.' },
      { who: 'A', text: 'At least you got a room.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set6_4',
    audioUrl: '/listening_audio/el3_set6_q4.mp3',
    label: '問4',
    hint: '雑誌の定期購読について話している。',
    script: 'A: This cooking magazine costs 800 yen a month. That\'s almost 10,000 yen a year.\nB: Why not read it online? The digital version is half the price.\nA: I know, but I like paper. I cut out recipes and keep them.\nB: Then how about buying back issues? They\'re 500 yen each at the used bookstore.\nA: But I want to read the new recipes first. I\'ll keep the subscription but cancel the other one ̶ the travel magazine I never read.',
    turns: [
      { who: 'A', text: 'This cooking magazine costs 800 yen a month. That\'s almost 10,000 yen a year.' },
      { who: 'B', text: 'Why not read it online? The digital version is half the price.' },
      { who: 'A', text: 'I know, but I like paper. I cut out recipes and keep them.' },
      { who: 'B', text: 'Then how about buying back issues? They\'re 500 yen each at the used bookstore.' },
      { who: 'A', text: 'But I want to read the new recipes first. I\'ll keep the subscription but cancel the other one ̶ the travel magazine I never read.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set6_5',
    audioUrl: '/listening_audio/el3_set6_q5.mp3',
    label: '問5',
    hint: '夜道で拾った財布の対応を話している。',
    script: 'A: I found a wallet on my way home. There\'s no ID inside, just cash and a train pass.\nB: You should take it to the police box tonight.\nA: It\'s closed already. The one near the station closes at eight.\nB: Then take it tomorrow morning before school.\nA: But I have morning practice at seven.\nB: OK. Take it after school, then. Don\'t spend any of the money, of course.\nA: Of course not!',
    turns: [
      { who: 'A', text: 'I found a wallet on my way home. There\'s no ID inside, just cash and a train pass.' },
      { who: 'B', text: 'You should take it to the police box tonight.' },
      { who: 'A', text: 'It\'s closed already. The one near the station closes at eight.' },
      { who: 'B', text: 'Then take it tomorrow morning before school.' },
      { who: 'A', text: 'But I have morning practice at seven.' },
      { who: 'B', text: 'OK. Take it after school, then. Don\'t spend any of the money, of course.' },
      { who: 'A', text: 'Of course not!' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set6_6',
    audioUrl: '/listening_audio/el3_set6_q6.mp3',
    label: '問6',
    hint: 'スーパーでアレルギー対応の商品を探している。',
    script: 'A: Do you have any bread without eggs? My son is allergic.\nB: This white bread has no eggs. But it was made in a factory that also makes cakes with eggs.\nA: Then it\'s not safe for him. His allergy is serious.\nB: We also have rice-flour bread in the frozen section. It\'s made in a special factory with no eggs at all.\nA: That\'s the one. Where\'s the frozen section?\nB: At the back, next to the drinks.',
    turns: [
      { who: 'A', text: 'Do you have any bread without eggs? My son is allergic.' },
      { who: 'B', text: 'This white bread has no eggs. But it was made in a factory that also makes cakes with eggs.' },
      { who: 'A', text: 'Then it\'s not safe for him. His allergy is serious.' },
      { who: 'B', text: 'We also have rice-flour bread in the frozen section. It\'s made in a special factory with no eggs at all.' },
      { who: 'A', text: 'That\'s the one. Where\'s the frozen section?' },
      { who: 'B', text: 'At the back, next to the drinks.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL3_SET6: ListeningProblem = {
  id: 'q_el3_set6',
  category: '第6回 短い対話の内容一致（やや難）',
  readCount: 1,
  audioTracks: EL3_SET6_TRACKS,
  text: `第6回　第3問（6問・1回読み）　【難易度：やや難】

第3問では、2人の短い対話が1回だけ流れます。それぞれの問いの答えとして最も適切なものを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は1回読みなので、まずは1回で解き、答え合わせの前にもう一度だけ聞いて確かめてください。

【解き方のコツ】
音声が流れる前に「場面」と「Question」を読み、選択肢4つの違いを1語で言えるようにしておきます。1回読みでは、聞くべき1語が決まっているかどうかで勝負が決まります。

────────────────────
問1（話者：男性（町の職員） / 女性（住民））
場面：町の清掃イベントの案内を確認している。
Question: Which information stayed the same?
① The day
② The place
③ The time
④ None of them

────────────────────
問2（話者：女性（母） / 男性（息子・大学生））
場面：祖父母の金婚式の計画を話している。
Question: What should the son bring to the party?
① His girlfriend
② A gift
③ Lunch
④ A card

────────────────────
問3（話者：男性（旅行者） / 女性（同僚））
場面：ホテルのチェックインでトラブルがあった後で話している。
Question: What was the man's mistake?
① He booked the wrong month.
② He paid at the wrong hotel.
③ He went to the wrong hotel.
④ He lost his reservation paper.

────────────────────
問4（話者：女性（妻） / 男性（夫））
場面：雑誌の定期購読について話している。
Question: What will the woman do?
① Cancel the cooking magazine
② Buy back issues at the used bookstore
③ Cancel the travel magazine
④ Switch to the digital version

────────────────────
問5（話者：男性（高校生） / 女性（母親））
場面：夜道で拾った財布の対応を話している。
Question: When will the boy take the wallet to the police box?
① Tonight
② Tomorrow morning before practice
③ Tomorrow before school
④ Tomorrow after school

────────────────────
問6（話者：女性（客） / 男性（店員））
場面：スーパーでアレルギー対応の商品を探している。
Question: Why doesn't the woman buy the white bread?
① It contains eggs.
② It is too expensive.
③ It may have touched eggs at the factory.
④ It is frozen.`,
  subQuestions: [
    {
      id: 'q_el3_set6_1',
      label: '問1 Which information stayed the same?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 48,
      detailedExplanation: {
        theme: '日・場所・時刻すべて変更',
        type: '短い対話の内容一致型',
        difficulty: 4,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set6_2',
      label: '問2 What should the son bring to the party?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 45,
      detailedExplanation: {
        theme: '時間変更（夕食→昼食）・家族のみ（彼女不可）・no giftsが混在',
        type: '短い対話の内容一致型',
        difficulty: 4,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set6_3',
      label: '問3 What was the man\'s mistake?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 42,
      detailedExplanation: {
        theme: '2026年問15型（間違いの特定）',
        type: '短い対話の内容一致型',
        difficulty: 4,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set6_4',
      label: '問4 What will the woman do?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 48,
      detailedExplanation: {
        theme: '提案2つ（デジタル版・バックナンバー）を却下し、別の雑誌（旅行）を解約する結論',
        type: '短い対話の内容一致型',
        difficulty: 4,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set6_5',
      label: '問5 When will the boy take the wallet to the police box?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 45,
      detailedExplanation: {
        theme: '今夜（閉まっている）→明朝（練習がある）→放課後、の消去',
        type: '短い対話の内容一致型',
        difficulty: 4,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set6_6',
      label: '問6 Why doesn\'t the woman buy the white bread?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 42,
      detailedExplanation: {
        theme: '卵不使用でも同一工場製造（コンタミネーション）のため避ける、という細かい区別',
        type: '短い対話の内容一致型',
        difficulty: 4,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
  ],
  explanation: `第6回（難易度：やや難）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ④
場面：町の清掃イベントの案内を確認している。
スクリプト：A: The cleanup event was moved from this Sunday to next Sunday because of the weather forecast.
B: Oh, I already told my friends about this Sunday.
A: Please tell them about the change. Also, the meeting place changed from the park entrance to the community center.
B: Same time, nine o'clock?
A: No, thirty minutes earlier, at eight thirty.
B: OK, new day, new place, new time. Got it.
Question: Which information stayed the same?
正解の選択肢：None of them
日・場所・時刻すべて変更。stayed the same（変わらなかったもの）を問う逆転の設問。全部変わった＝④が正解。2022年問15型（否定の確認）。

問2　正解は ④
場面：祖父母の金婚式の計画を話している。
スクリプト：A: Grandma and Grandpa's fiftieth anniversary is next month.
B: Are we having a party?
A: At a restaurant on the 20th. But Grandpa's doctor said he should eat early, so we moved it from dinner to lunch.
B: Can I invite my girlfriend?
A: It's family only this time. Sorry.
B: No problem. What should I bring?
A: Just a card. Your grandfather said no gifts.
Question: What should the son bring to the party?
正解の選択肢：A card
時間変更（夕食→昼食）・家族のみ（彼女不可）・no giftsが混在。最終的に持参するのはカードのみ。複数訂正の中の確定情報。

問3　正解は ①
場面：ホテルのチェックインでトラブルがあった後で話している。
スクリプト：A: How was your trip?
B: Terrible at first. The hotel couldn't find my reservation.
A: Oh no. What happened?
B: Turns out I booked it for the wrong month ̶ July instead of June.
A: Did you find a room?
B: Luckily they had one, but I had to pay a higher price for the same night.
A: At least you got a room.
Question: What was the man's mistake?
正解の選択肢：He booked the wrong month.
2026年問15型（間違いの特定）。July instead of June＝月を間違えた。部屋は確保できたが高くついた、は結末の詳細。

問4　正解は ③
場面：雑誌の定期購読について話している。
スクリプト：A: This cooking magazine costs 800 yen a month. That's almost 10,000 yen a year.
B: Why not read it online? The digital version is half the price.
A: I know, but I like paper. I cut out recipes and keep them.
B: Then how about buying back issues? They're 500 yen each at the used bookstore.
A: But I want to read the new recipes first. I'll keep the subscription but cancel the other one ̶ the travel magazine I never read.
Question: What will the woman do?
正解の選択肢：Cancel the travel magazine
提案2つ（デジタル版・バックナンバー）を却下し、別の雑誌（旅行）を解約する結論。主語の取り違い注意。

問5　正解は ④
場面：夜道で拾った財布の対応を話している。
スクリプト：A: I found a wallet on my way home. There's no ID inside, just cash and a train pass.
B: You should take it to the police box tonight.
A: It's closed already. The one near the station closes at eight.
B: Then take it tomorrow morning before school.
A: But I have morning practice at seven.
B: OK. Take it after school, then. Don't spend any of the money, of course.
A: Of course not!
Question: When will the boy take the wallet to the police box?
正解の選択肢：Tomorrow after school
今夜（閉まっている）→明朝（練習がある）→放課後、の消去。3つの時刻候補を潰していく型。

問6　正解は ③
場面：スーパーでアレルギー対応の商品を探している。
スクリプト：A: Do you have any bread without eggs? My son is allergic.
B: This white bread has no eggs. But it was made in a factory that also makes cakes with eggs.
A: Then it's not safe for him. His allergy is serious.
B: We also have rice-flour bread in the frozen section. It's made in a special factory with no eggs at all.
A: That's the one. Where's the frozen section?
B: At the back, next to the drinks.
Question: Why doesn't the woman buy the white bread?
正解の選択肢：It may have touched eggs at the factory.
卵不使用でも同一工場製造（コンタミネーション）のため避ける、という細かい区別。Why型＋理由の精度が求められる。やや難。`,
  surroundingKnowledge: [
    '第3問は1回読み。音声が流れる前に場面と設問文を読み終えておくのが前提の大問である。',
    '設問文の疑問詞が答えの型を決める。How long → 期間、How much → 金額、What will 〜 do → 次の行動。',
    '数量・金額・時刻は「訂正」がつきもの。最初に聞こえた数字はダミーであることが多い。',
    'but / actually / instead / in total / on second thought の後ろに結論が来る。',
    '選択肢の誤りは「最初に出た数字」「別人の行動」「条件を満たさない案」のどれかに集約される。',
  ],
  deepDiveTopics: [
    '「先読み」を習慣にする。場面＋設問文＋選択肢の3点を10秒で読む練習を単独でやると効く。',
    '聞こえた単語がそのまま入っている選択肢はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。合意した内容が答えになる。',
  ],
};

const EL3_SET7_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el3_set7_1',
    audioUrl: '/listening_audio/el3_set7_q1.mp3',
    label: '問1',
    hint: '部活の新入部員への説明をしている。',
    script: 'A: Practice is every Monday, Wednesday, and Friday from four to six.\nB: I have a part-time job on Fridays. Can I skip Friday practice?\nA: Friday is when we practice with the coach, so it\'s the most important.\nB: Then I\'ll ask my boss to change my shift.\nA: Also, bring your own water bottle. The school doesn\'t provide drinks.',
    turns: [
      { who: 'A', text: 'Practice is every Monday, Wednesday, and Friday from four to six.' },
      { who: 'B', text: 'I have a part-time job on Fridays. Can I skip Friday practice?' },
      { who: 'A', text: 'Friday is when we practice with the coach, so it\'s the most important.' },
      { who: 'B', text: 'Then I\'ll ask my boss to change my shift.' },
      { who: 'A', text: 'Also, bring your own water bottle. The school doesn\'t provide drinks.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set7_2',
    audioUrl: '/listening_audio/el3_set7_q2.mp3',
    label: '問2',
    hint: '朝、寝坊した兄弟が話している。',
    script: 'A: It\'s already seven forty! The bus leaves at seven fifty.\nB: We\'ll never make it. It\'s a ten-minute walk to the bus stop.\nA: The next bus is at eight twenty, but then I\'ll miss the first period.\nB: Why don\'t you take my bike? It\'s faster.\nA: What about you?\nB: My first class is second period. I\'ll take the eight-twenty bus.',
    turns: [
      { who: 'A', text: 'It\'s already seven forty! The bus leaves at seven fifty.' },
      { who: 'B', text: 'We\'ll never make it. It\'s a ten-minute walk to the bus stop.' },
      { who: 'A', text: 'The next bus is at eight twenty, but then I\'ll miss the first period.' },
      { who: 'B', text: 'Why don\'t you take my bike? It\'s faster.' },
      { who: 'A', text: 'What about you?' },
      { who: 'B', text: 'My first class is second period. I\'ll take the eight-twenty bus.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set7_3',
    audioUrl: '/listening_audio/el3_set7_q3.mp3',
    label: '問3',
    hint: 'アパートの騒音問題について話している。',
    script: 'A: The people upstairs play loud music every night until midnight.\nB: Have you talked to them directly?\nA: I did, twice. They were friendly but nothing changed.\nB: I see. I\'ll send a notice to all residents about quiet hours after ten.\nA: Could you talk to them directly instead? A general notice might not work.\nB: All right. I\'ll visit them this weekend.',
    turns: [
      { who: 'A', text: 'The people upstairs play loud music every night until midnight.' },
      { who: 'B', text: 'Have you talked to them directly?' },
      { who: 'A', text: 'I did, twice. They were friendly but nothing changed.' },
      { who: 'B', text: 'I see. I\'ll send a notice to all residents about quiet hours after ten.' },
      { who: 'A', text: 'Could you talk to them directly instead? A general notice might not work.' },
      { who: 'B', text: 'All right. I\'ll visit them this weekend.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set7_4',
    audioUrl: '/listening_audio/el3_set7_q4.mp3',
    label: '問4',
    hint: 'デパートで入学祝いを選んでいる。',
    script: 'A: I\'m looking for a gift for my daughter. She\'s starting junior high school.\nB: How about a fountain pen? These start at 3,000 yen.\nA: She already has one from her grandmother.\nB: Then maybe a desk lamp? This one changes brightness and color.\nA: That\'s nice, but a bit expensive. Do you have anything around 5,000 yen?\nB: This smaller lamp is 4,500 yen. Same functions.\nA: I\'ll take that one.',
    turns: [
      { who: 'A', text: 'I\'m looking for a gift for my daughter. She\'s starting junior high school.' },
      { who: 'B', text: 'How about a fountain pen? These start at 3,000 yen.' },
      { who: 'A', text: 'She already has one from her grandmother.' },
      { who: 'B', text: 'Then maybe a desk lamp? This one changes brightness and color.' },
      { who: 'A', text: 'That\'s nice, but a bit expensive. Do you have anything around 5,000 yen?' },
      { who: 'B', text: 'This smaller lamp is 4,500 yen. Same functions.' },
      { who: 'A', text: 'I\'ll take that one.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set7_5',
    audioUrl: '/listening_audio/el3_set7_q5.mp3',
    label: '問5',
    hint: '海外旅行前に両替について話している。',
    script: 'A: Should I exchange money at the airport?\nB: The rates there are bad. I always use the machine at the city bank ̶ better rates.\nA: But I leave at six in the morning. The bank won\'t be open.\nB: The machine is available twenty-four hours.\nA: Perfect. How much should I exchange?\nB: I took about 300 dollars for a week. Cards work almost everywhere there, so that was enough.',
    turns: [
      { who: 'A', text: 'Should I exchange money at the airport?' },
      { who: 'B', text: 'The rates there are bad. I always use the machine at the city bank ̶ better rates.' },
      { who: 'A', text: 'But I leave at six in the morning. The bank won\'t be open.' },
      { who: 'B', text: 'The machine is available twenty-four hours.' },
      { who: 'A', text: 'Perfect. How much should I exchange?' },
      { who: 'B', text: 'I took about 300 dollars for a week. Cards work almost everywhere there, so that was enough.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set7_6',
    audioUrl: '/listening_audio/el3_set7_q6.mp3',
    label: '問6',
    hint: '試験の結果について話している。',
    script: 'A: How did you do on the English test?\nB: Eighty-two points. I lost points on the listening section again.\nA: Same here. I got seventy-eight, and my reading score was fine but writing was terrible.\nB: Let\'s practice together. I\'ll teach you listening if you help me with... wait, actually my writing is OK.\nA: Then you teach me listening, and I\'ll ask the teacher for writing help.\nB: Deal. Let\'s start after school on Thursday.',
    turns: [
      { who: 'A', text: 'How did you do on the English test?' },
      { who: 'B', text: 'Eighty-two points. I lost points on the listening section again.' },
      { who: 'A', text: 'Same here. I got seventy-eight, and my reading score was fine but writing was terrible.' },
      { who: 'B', text: 'Let\'s practice together. I\'ll teach you listening if you help me with... wait, actually my writing is OK.' },
      { who: 'A', text: 'Then you teach me listening, and I\'ll ask the teacher for writing help.' },
      { who: 'B', text: 'Deal. Let\'s start after school on Thursday.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL3_SET7: ListeningProblem = {
  id: 'q_el3_set7',
  category: '第7回 短い対話の内容一致（標準）',
  readCount: 1,
  audioTracks: EL3_SET7_TRACKS,
  text: `第7回　第3問（6問・1回読み）　【難易度：標準】

第3問では、2人の短い対話が1回だけ流れます。それぞれの問いの答えとして最も適切なものを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は1回読みなので、まずは1回で解き、答え合わせの前にもう一度だけ聞いて確かめてください。

【解き方のコツ】
音声が流れる前に「場面」と「Question」を読み、選択肢4つの違いを1語で言えるようにしておきます。1回読みでは、聞くべき1語が決まっているかどうかで勝負が決まります。

────────────────────
問1（話者：男性（部長） / 女性（新入部員））
場面：部活の新入部員への説明をしている。
Question: What will the new member do about her job?
① Ask to change her shift
② Work only on weekends
③ Quit her part-time job
④ Skip Friday practice

────────────────────
問2（話者：男性（兄） / 女性（妹））
場面：朝、寝坊した兄弟が話している。
Question: How will the brother get to school?
① By the 8:20 bus
② By bicycle
③ By the 7:50 bus
④ On foot

────────────────────
問3（話者：女性（住人） / 男性（大家））
場面：アパートの騒音問題について話している。
Question: What will the owner do?
① Send a notice to everyone
② Talk to all residents
③ Change the quiet hours
④ Visit the noisy neighbors

────────────────────
問4（話者：男性（父） / 女性（店員））
場面：デパートで入学祝いを選んでいる。
Question: What will the father buy?
① A fountain pen
② The smaller desk lamp
③ The large desk lamp
④ Nothing today

────────────────────
問5（話者：女性（旅行者） / 男性（友人））
場面：海外旅行前に両替について話している。
Question: Where will the woman probably exchange her money?
① At the bank counter
② At her hotel
③ At the airport
④ At the bank's machine

────────────────────
問6（話者：男性（高校生） / 女性（高校生））
場面：試験の結果について話している。
Question: What will the girl help the boy with?
① Reading
② Writing
③ Grammar
④ Listening`,
  subQuestions: [
    {
      id: 'q_el3_set7_1',
      label: '問1 What will the new member do about her job?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: '金曜練習が最重要→シフト変更を申し出る',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set7_2',
      label: '問2 How will the brother get to school?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '間に合わないバス・遅刻するバスを経て、妹の自転車で行く結論',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set7_3',
      label: '問3 What will the owner do?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '最初の提案（全戸への通知）→住人の要望で直接訪問に変更',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set7_4',
      label: '問4 What will the father buy?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: '万年筆（既に所持）→大きいランプ（高い）→小型ランプ4,500円で確定',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set7_5',
      label: '問5 Where will the woman probably exchange her money?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '空港（レート悪）→銀行（早朝で窓口不可）→24時間使えるATM、の絞り込み',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set7_6',
      label: '問6 What will the girl help the boy with?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '男子（A）の Then you teach me listening に対し女子（B）が Deal と合意する流れ',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
  ],
  explanation: `第7回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ①
場面：部活の新入部員への説明をしている。
スクリプト：A: Practice is every Monday, Wednesday, and Friday from four to six.
B: I have a part-time job on Fridays. Can I skip Friday practice?
A: Friday is when we practice with the coach, so it's the most important.
B: Then I'll ask my boss to change my shift.
A: Also, bring your own water bottle. The school doesn't provide drinks.
Question: What will the new member do about her job?
正解の選択肢：Ask to change her shift
金曜練習が最重要→シフト変更を申し出る。行動の解決策を問う。水筒はダミー詳細。

問2　正解は ②
場面：朝、寝坊した兄弟が話している。
スクリプト：A: It's already seven forty! The bus leaves at seven fifty.
B: We'll never make it. It's a ten-minute walk to the bus stop.
A: The next bus is at eight twenty, but then I'll miss the first period.
B: Why don't you take my bike? It's faster.
A: What about you?
B: My first class is second period. I'll take the eight-twenty bus.
Question: How will the brother get to school?
正解の選択肢：By bicycle
間に合わないバス・遅刻するバスを経て、妹の自転車で行く結論。兄弟で異なる手段になる点に注意。

問3　正解は ④
場面：アパートの騒音問題について話している。
スクリプト：A: The people upstairs play loud music every night until midnight.
B: Have you talked to them directly?
A: I did, twice. They were friendly but nothing changed.
B: I see. I'll send a notice to all residents about quiet hours after ten.
A: Could you talk to them directly instead? A general notice might not work.
B: All right. I'll visit them this weekend.
Question: What will the owner do?
正解の選択肢：Visit the noisy neighbors
最初の提案（全戸への通知）→住人の要望で直接訪問に変更。insteadの効いた要望が結論を変える。

問4　正解は ②
場面：デパートで入学祝いを選んでいる。
スクリプト：A: I'm looking for a gift for my daughter. She's starting junior high school.
B: How about a fountain pen? These start at 3,000 yen.
A: She already has one from her grandmother.
B: Then maybe a desk lamp? This one changes brightness and color.
A: That's nice, but a bit expensive. Do you have anything around 5,000 yen?
B: This smaller lamp is 4,500 yen. Same functions.
A: I'll take that one.
Question: What will the father buy?
正解の選択肢：The smaller desk lamp
万年筆（既に所持）→大きいランプ（高い）→小型ランプ4,500円で確定。価格帯の条件指定。

問5　正解は ④
場面：海外旅行前に両替について話している。
スクリプト：A: Should I exchange money at the airport?
B: The rates there are bad. I always use the machine at the city bank ̶ better rates.
A: But I leave at six in the morning. The bank won't be open.
B: The machine is available twenty-four hours.
A: Perfect. How much should I exchange?
B: I took about 300 dollars for a week. Cards work almost everywhere there, so that was enough.
Question: Where will the woman probably exchange her money?
正解の選択肢：At the bank's machine
空港（レート悪）→銀行（早朝で窓口不可）→24時間使えるATM、の絞り込み。機械と窓口の区別が鍵。

問6　正解は ④
場面：試験の結果について話している。
スクリプト：A: How did you do on the English test?
B: Eighty-two points. I lost points on the listening section again.
A: Same here. I got seventy-eight, and my reading score was fine but writing was terrible.
B: Let's practice together. I'll teach you listening if you help me with... wait, actually my writing is OK.
A: Then you teach me listening, and I'll ask the teacher for writing help.
B: Deal. Let's start after school on Thursday.
Question: What will the girl help the boy with?
正解の選択肢：Listening
男子（A）が Then you teach me listening, and I'll ask the teacher for writing help. と提案し、女子（B）が Deal. と引き受けているため、女子が男子に教えるのは④Listening。ライティングは先生に質問する点に注意。`,
  surroundingKnowledge: [
    '第3問は1回読み。音声が流れる前に場面と設問文を読み終えておくのが前提の大問である。',
    '設問文の疑問詞が答えの型を決める。How long → 期間、How much → 金額、What will 〜 do → 次の行動。',
    '数量・金額・時刻は「訂正」がつきもの。最初に聞こえた数字はダミーであることが多い。',
    'but / actually / instead / in total / on second thought の後ろに結論が来る。',
    '選択肢の誤りは「最初に出た数字」「別人の行動」「条件を満たさない案」のどれかに集約される。',
  ],
  deepDiveTopics: [
    '「先読み」を習慣にする。場面＋設問文＋選択肢の3点を10秒で読む練習を単独でやると効く。',
    '聞こえた単語がそのまま入っている選択肢はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。合意した内容が答えになる。',
  ],
};

const EL3_SET8_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el3_set8_1',
    audioUrl: '/listening_audio/el3_set8_q1.mp3',
    label: '問1',
    hint: '習い事の体験教室について電話している。',
    script: 'A: I\'d like to sign my son up for a trial piano lesson.\nB: We have trials on Saturdays at ten, one, and four.\nA: He has soccer until eleven on Saturdays. One o\'clock, please.\nB: The one o\'clock class is full. How about four?\nA: That works. Do we need to bring anything?\nB: Just indoor shoes. We provide everything else.',
    turns: [
      { who: 'A', text: 'I\'d like to sign my son up for a trial piano lesson.' },
      { who: 'B', text: 'We have trials on Saturdays at ten, one, and four.' },
      { who: 'A', text: 'He has soccer until eleven on Saturdays. One o\'clock, please.' },
      { who: 'B', text: 'The one o\'clock class is full. How about four?' },
      { who: 'A', text: 'That works. Do we need to bring anything?' },
      { who: 'B', text: 'Just indoor shoes. We provide everything else.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set8_2',
    audioUrl: '/listening_audio/el3_set8_q2.mp3',
    label: '問2',
    hint: '庭の手入れを手伝ってもらう約束をしている。',
    script: 'A: Can you help me in the garden this Saturday?\nB: I have a test on Monday, so I should study. How about Sunday?\nA: Sunday is supposed to rain.\nB: Then Saturday morning only. I can study in the afternoon.\nA: Deal. Come at eight ̶ it gets too hot after ten.\nB: Eight?! Grandpa, it\'s Saturday... OK, OK, eight.',
    turns: [
      { who: 'A', text: 'Can you help me in the garden this Saturday?' },
      { who: 'B', text: 'I have a test on Monday, so I should study. How about Sunday?' },
      { who: 'A', text: 'Sunday is supposed to rain.' },
      { who: 'B', text: 'Then Saturday morning only. I can study in the afternoon.' },
      { who: 'A', text: 'Deal. Come at eight ̶ it gets too hot after ten.' },
      { who: 'B', text: 'Eight?! Grandpa, it\'s Saturday... OK, OK, eight.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set8_3',
    audioUrl: '/listening_audio/el3_set8_q3.mp3',
    label: '問3',
    hint: '献血会場での案内を聞いている。',
    script: 'A: Before donating blood, please fill out this form and show your ID.\nB: Here\'s my driver\'s license.\nA: Thank you. Have you eaten today?\nB: Just breakfast, around seven.\nA: It\'s past noon, so please have a snack and something to drink first. We have free cookies and juice over there.\nB: OK. How long does the whole thing take?\nA: About forty minutes after the snack.',
    turns: [
      { who: 'A', text: 'Before donating blood, please fill out this form and show your ID.' },
      { who: 'B', text: 'Here\'s my driver\'s license.' },
      { who: 'A', text: 'Thank you. Have you eaten today?' },
      { who: 'B', text: 'Just breakfast, around seven.' },
      { who: 'A', text: 'It\'s past noon, so please have a snack and something to drink first. We have free cookies and juice over there.' },
      { who: 'B', text: 'OK. How long does the whole thing take?' },
      { who: 'A', text: 'About forty minutes after the snack.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set8_4',
    audioUrl: '/listening_audio/el3_set8_q4.mp3',
    label: '問4',
    hint: '図書委員の仕事の引き継ぎをしている。',
    script: 'A: As library committee members, we check the returned books every morning.\nB: Every morning? That\'s a lot.\nA: It only takes fifteen minutes. Also, on Fridays we put new books on the display shelf.\nB: Who chooses the new books?\nA: The librarian chooses them. We just arrange them by theme.\nB: Got it. Morning checks every day, displays on Fridays.',
    turns: [
      { who: 'A', text: 'As library committee members, we check the returned books every morning.' },
      { who: 'B', text: 'Every morning? That\'s a lot.' },
      { who: 'A', text: 'It only takes fifteen minutes. Also, on Fridays we put new books on the display shelf.' },
      { who: 'B', text: 'Who chooses the new books?' },
      { who: 'A', text: 'The librarian chooses them. We just arrange them by theme.' },
      { who: 'B', text: 'Got it. Morning checks every day, displays on Fridays.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set8_5',
    audioUrl: '/listening_audio/el3_set8_q5.mp3',
    label: '問5',
    hint: '夜、アルバイト先のシフト変更を電話で頼んでいる。',
    script: 'A: I\'m sorry to call this late. Can I change my shift this Thursday?\nB: What\'s wrong?\nA: My professor moved the exam from Wednesday to Thursday morning.\nB: Your shift starts at five in the evening, right? The exam is in the morning.\nA: Yes, but I need the afternoon to review my notes. I haven\'t studied at all.\nB: All right, I\'ll ask Ken to cover you. But you owe him one.',
    turns: [
      { who: 'A', text: 'I\'m sorry to call this late. Can I change my shift this Thursday?' },
      { who: 'B', text: 'What\'s wrong?' },
      { who: 'A', text: 'My professor moved the exam from Wednesday to Thursday morning.' },
      { who: 'B', text: 'Your shift starts at five in the evening, right? The exam is in the morning.' },
      { who: 'A', text: 'Yes, but I need the afternoon to review my notes. I haven\'t studied at all.' },
      { who: 'B', text: 'All right, I\'ll ask Ken to cover you. But you owe him one.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set8_6',
    audioUrl: '/listening_audio/el3_set8_q6.mp3',
    label: '問6',
    hint: '新婚旅行の行き先を決めている。',
    script: 'A: I found a great deal for Hawaii ̶ five days for 150,000 yen.\nB: I only have four days off. What about Guam? It\'s closer.\nA: The Guam tour is three days. Too short for a honeymoon.\nB: Then Hawaii for four days? Is that possible?\nA: There\'s a four-day plan for 130,000 yen. Cheaper and fits your vacation!\nB: Perfect. Book that one.',
    turns: [
      { who: 'A', text: 'I found a great deal for Hawaii ̶ five days for 150,000 yen.' },
      { who: 'B', text: 'I only have four days off. What about Guam? It\'s closer.' },
      { who: 'A', text: 'The Guam tour is three days. Too short for a honeymoon.' },
      { who: 'B', text: 'Then Hawaii for four days? Is that possible?' },
      { who: 'A', text: 'There\'s a four-day plan for 130,000 yen. Cheaper and fits your vacation!' },
      { who: 'B', text: 'Perfect. Book that one.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL3_SET8: ListeningProblem = {
  id: 'q_el3_set8',
  category: '第8回 短い対話の内容一致（標準）',
  readCount: 1,
  audioTracks: EL3_SET8_TRACKS,
  text: `第8回　第3問（6問・1回読み）　【難易度：標準】

第3問では、2人の短い対話が1回だけ流れます。それぞれの問いの答えとして最も適切なものを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は1回読みなので、まずは1回で解き、答え合わせの前にもう一度だけ聞いて確かめてください。

【解き方のコツ】
音声が流れる前に「場面」と「Question」を読み、選択肢4つの違いを1語で言えるようにしておきます。1回読みでは、聞くべき1語が決まっているかどうかで勝負が決まります。

────────────────────
問1（話者：女性（母親） / 男性（教室スタッフ））
場面：習い事の体験教室について電話している。
Question: What time is the trial lesson, and what should they bring?
① 10:00, indoor shoes
② 1:00, nothing
③ 4:00, indoor shoes
④ 4:00, a piano book

────────────────────
問2（話者：男性（祖父） / 女性（孫・高校生））
場面：庭の手入れを手伝ってもらう約束をしている。
Question: When will the girl help her grandfather?
① Saturday all day
② Saturday morning from eight
③ Sunday morning
④ Sunday if it doesn't rain

────────────────────
問3（話者：女性（看護師） / 男性（会社員））
場面：献血会場での案内を聞いている。
Question: What must the man do before donating blood?
① Eat a full meal
② Have a snack and a drink
③ Wait forty minutes
④ Pay for the cookies

────────────────────
問4（話者：女性（3年生） / 男性（2年生））
場面：図書委員の仕事の引き継ぎをしている。
Question: What do the committee members do on Fridays?
① Choose new books
② Arrange new books by theme
③ Clean the library
④ Check returned books only

────────────────────
問5（話者：男性（大学生） / 女性（店長））
場面：夜、アルバイト先のシフト変更を電話で頼んでいる。
Question: Why does the man want to change his shift?
① He wants time to study before the exam.
② Ken asked him to switch shifts.
③ He is not feeling well.
④ The exam is at the same time as his shift.

────────────────────
問6（話者：女性（妻） / 男性（夫））
場面：新婚旅行の行き先を決めている。
Question: Which tour will they book?
① Guam, three days
② Guam, four days
③ Hawaii, four days
④ Hawaii, five days`,
  subQuestions: [
    {
      id: 'q_el3_set8_1',
      label: '問1 What time is the trial lesson, and what should they bring?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: '時刻（10時は習い事と重複・1時は満員→4時）と持ち物（上履き）の2情報を問う',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set8_2',
      label: '問2 When will the girl help her grandfather?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '土曜終日→テスト勉強で午前のみ、かつ8時開始',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set8_3',
      label: '問3 What must the man do before donating blood?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '朝食のみ＝空腹気味→まず軽食と飲み物',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set8_4',
      label: '問4 What do the committee members do on Fridays?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: '本を選ぶのは司書＝ダミー誘導',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set8_5',
      label: '問5 Why does the man want to change his shift?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '試験は午前・シフトは夕方で直接は重ならないが、午後に勉強時間が欲しい、という理由',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set8_6',
      label: '問6 Which tour will they book?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '日数の条件（夫の休み4日）と価格の変化を組み合わせる',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
  ],
  explanation: `第8回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ③
場面：習い事の体験教室について電話している。
スクリプト：A: I'd like to sign my son up for a trial piano lesson.
B: We have trials on Saturdays at ten, one, and four.
A: He has soccer until eleven on Saturdays. One o'clock, please.
B: The one o'clock class is full. How about four?
A: That works. Do we need to bring anything?
B: Just indoor shoes. We provide everything else.
Question: What time is the trial lesson, and what should they bring?
正解の選択肢：4:00, indoor shoes
時刻（10時は習い事と重複・1時は満員→4時）と持ち物（上履き）の2情報を問う。組み合わせの正確性。

問2　正解は ②
場面：庭の手入れを手伝ってもらう約束をしている。
スクリプト：A: Can you help me in the garden this Saturday?
B: I have a test on Monday, so I should study. How about Sunday?
A: Sunday is supposed to rain.
B: Then Saturday morning only. I can study in the afternoon.
A: Deal. Come at eight ̶ it gets too hot after ten.
B: Eight?! Grandpa, it's Saturday... OK, OK, eight.
Question: When will the girl help her grandfather?
正解の選択肢：Saturday morning from eight
土曜終日→テスト勉強で午前のみ、かつ8時開始。日曜は雨予報で消去。条件の絞り込み。

問3　正解は ②
場面：献血会場での案内を聞いている。
スクリプト：A: Before donating blood, please fill out this form and show your ID.
B: Here's my driver's license.
A: Thank you. Have you eaten today?
B: Just breakfast, around seven.
A: It's past noon, so please have a snack and something to drink first. We have free cookies and juice over there.
B: OK. How long does the whole thing take?
A: About forty minutes after the snack.
Question: What must the man do before donating blood?
正解の選択肢：Have a snack and a drink
朝食のみ＝空腹気味→まず軽食と飲み物。40分は献血そのものの時間でダミー。手順の正しい理解。

問4　正解は ②
場面：図書委員の仕事の引き継ぎをしている。
スクリプト：A: As library committee members, we check the returned books every morning.
B: Every morning? That's a lot.
A: It only takes fifteen minutes. Also, on Fridays we put new books on the display shelf.
B: Who chooses the new books?
A: The librarian chooses them. We just arrange them by theme.
B: Got it. Morning checks every day, displays on Fridays.
Question: What do the committee members do on Fridays?
正解の選択肢：Arrange new books by theme
本を選ぶのは司書＝ダミー誘導。委員の仕事はテーマ別に並べること。役割の区別（who does what）が鍵。

問5　正解は ①
場面：夜、アルバイト先のシフト変更を電話で頼んでいる。
スクリプト：A: I'm sorry to call this late. Can I change my shift this Thursday?
B: What's wrong?
A: My professor moved the exam from Wednesday to Thursday morning.
B: Your shift starts at five in the evening, right? The exam is in the morning.
A: Yes, but I need the afternoon to review my notes. I haven't studied at all.
B: All right, I'll ask Ken to cover you. But you owe him one.
Question: Why does the man want to change his shift?
正解の選択肢：He wants time to study before the exam.
試験は午前・シフトは夕方で直接は重ならないが、午後に勉強時間が欲しい、という理由。Why型で理由の正確な把握が求められる。

問6　正解は ③
場面：新婚旅行の行き先を決めている。
スクリプト：A: I found a great deal for Hawaii ̶ five days for 150,000 yen.
B: I only have four days off. What about Guam? It's closer.
A: The Guam tour is three days. Too short for a honeymoon.
B: Then Hawaii for four days? Is that possible?
A: There's a four-day plan for 130,000 yen. Cheaper and fits your vacation!
B: Perfect. Book that one.
Question: Which tour will they book?
正解の選択肢：Hawaii, four days
日数の条件（夫の休み4日）と価格の変化を組み合わせる。5日プラン→4日プランへの修正。数字情報の整理。`,
  surroundingKnowledge: [
    '第3問は1回読み。音声が流れる前に場面と設問文を読み終えておくのが前提の大問である。',
    '設問文の疑問詞が答えの型を決める。How long → 期間、How much → 金額、What will 〜 do → 次の行動。',
    '数量・金額・時刻は「訂正」がつきもの。最初に聞こえた数字はダミーであることが多い。',
    'but / actually / instead / in total / on second thought の後ろに結論が来る。',
    '選択肢の誤りは「最初に出た数字」「別人の行動」「条件を満たさない案」のどれかに集約される。',
  ],
  deepDiveTopics: [
    '「先読み」を習慣にする。場面＋設問文＋選択肢の3点を10秒で読む練習を単独でやると効く。',
    '聞こえた単語がそのまま入っている選択肢はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。合意した内容が答えになる。',
  ],
};

const EL3_SET9_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el3_set9_1',
    audioUrl: '/listening_audio/el3_set9_q1.mp3',
    label: '問1',
    hint: '雨の日の送迎を調整している。',
    script: 'A: It\'s pouring. Do you want a ride to school?\nB: The car is being repaired today, isn\'t it?\nA: Right. Then take the bus from the corner stop. It comes at seven forty.\nB: That gets me there too early. My friends and I always meet at the gate at eight ten.\nA: The seven-forty bus arrives at school at eight. That\'s only ten minutes early. You\'ll survive.\nB: Fine. But I\'m coming home by bike if it stops raining.',
    turns: [
      { who: 'A', text: 'It\'s pouring. Do you want a ride to school?' },
      { who: 'B', text: 'The car is being repaired today, isn\'t it?' },
      { who: 'A', text: 'Right. Then take the bus from the corner stop. It comes at seven forty.' },
      { who: 'B', text: 'That gets me there too early. My friends and I always meet at the gate at eight ten.' },
      { who: 'A', text: 'The seven-forty bus arrives at school at eight. That\'s only ten minutes early. You\'ll survive.' },
      { who: 'B', text: 'Fine. But I\'m coming home by bike if it stops raining.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set9_2',
    audioUrl: '/listening_audio/el3_set9_q2.mp3',
    label: '問2',
    hint: 'レストランでアレルギーの確認をしている。',
    script: 'A: Does the tomato pasta contain cheese? My wife can\'t eat dairy.\nB: It has a little cheese on top, but we can make it without.\nA: Please do. Also, is the soup of the day dairy-free?\nB: Today\'s soup is corn soup. It has milk and butter.\nA: Then no soup for her. I\'ll have the soup myself.\nB: Certainly. One pasta without cheese, and one corn soup.',
    turns: [
      { who: 'A', text: 'Does the tomato pasta contain cheese? My wife can\'t eat dairy.' },
      { who: 'B', text: 'It has a little cheese on top, but we can make it without.' },
      { who: 'A', text: 'Please do. Also, is the soup of the day dairy-free?' },
      { who: 'B', text: 'Today\'s soup is corn soup. It has milk and butter.' },
      { who: 'A', text: 'Then no soup for her. I\'ll have the soup myself.' },
      { who: 'B', text: 'Certainly. One pasta without cheese, and one corn soup.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set9_3',
    audioUrl: '/listening_audio/el3_set9_q3.mp3',
    label: '問3',
    hint: '駅のコインロッカーについて話している。',
    script: 'A: Are there lockers big enough for a suitcase?\nB: Yes, on the second floor near the east exit. The ones here on the first floor are for small bags only.\nA: How much are the big ones?\nB: 700 yen per day. The small ones are 400.\nA: I only need it until this evening. Is it still 700?\nB: Yes, the price is per calendar day, not per hour.',
    turns: [
      { who: 'A', text: 'Are there lockers big enough for a suitcase?' },
      { who: 'B', text: 'Yes, on the second floor near the east exit. The ones here on the first floor are for small bags only.' },
      { who: 'A', text: 'How much are the big ones?' },
      { who: 'B', text: '700 yen per day. The small ones are 400.' },
      { who: 'A', text: 'I only need it until this evening. Is it still 700?' },
      { who: 'B', text: 'Yes, the price is per calendar day, not per hour.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set9_4',
    audioUrl: '/listening_audio/el3_set9_q4.mp3',
    label: '問4',
    hint: '学校の避難訓練の手順を確認している。',
    script: 'A: In this year\'s drill, the first bell means \'stay in your classroom.\'\nB: Last year the first bell meant \'go to the gym,\' right?\nA: That\'s the change this year. The second bell means move to the field, not the gym.\nB: Why the field?\nA: The gym is being repainted. And don\'t use the east stairs ̶ use the main stairs and the west stairs only.',
    turns: [
      { who: 'A', text: 'In this year\'s drill, the first bell means \'stay in your classroom.\'' },
      { who: 'B', text: 'Last year the first bell meant \'go to the gym,\' right?' },
      { who: 'A', text: 'That\'s the change this year. The second bell means move to the field, not the gym.' },
      { who: 'B', text: 'Why the field?' },
      { who: 'A', text: 'The gym is being repainted. And don\'t use the east stairs ̶ use the main stairs and the west stairs only.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set9_5',
    audioUrl: '/listening_audio/el3_set9_q5.mp3',
    label: '問5',
    hint: '引っ越し先の部屋の採寸をしている。',
    script: 'A: Will my desk fit? It\'s 120 centimeters wide.\nB: The wall space between the door and the window is 140 centimeters.\nA: Great. What about my bookshelf? It\'s 90 wide and 180 tall.\nB: The ceiling is fine, but that same wall only has 140. The desk plus the shelf would be 210.\nA: Then the bookshelf goes on the other wall, next to the bed.\nB: That wall is 200 centimeters. No problem.',
    turns: [
      { who: 'A', text: 'Will my desk fit? It\'s 120 centimeters wide.' },
      { who: 'B', text: 'The wall space between the door and the window is 140 centimeters.' },
      { who: 'A', text: 'Great. What about my bookshelf? It\'s 90 wide and 180 tall.' },
      { who: 'B', text: 'The ceiling is fine, but that same wall only has 140. The desk plus the shelf would be 210.' },
      { who: 'A', text: 'Then the bookshelf goes on the other wall, next to the bed.' },
      { who: 'B', text: 'That wall is 200 centimeters. No problem.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set9_6',
    audioUrl: '/listening_audio/el3_set9_q6.mp3',
    label: '問6',
    hint: '友達の家でのお泊まり会の計画をしている。',
    script: 'A: My parents will be away this weekend, so we can have the movie night at my place.\nB: Nice. Saturday night?\nA: My little brother has a friend over on Saturday. Sunday is better.\nB: Sunday night... I have school the next day. Can we start early, like five?\nA: Sure, we\'ll finish by nine. Bring snacks ̶ I\'ll order pizza.\nB: I\'ll bring chips and juice. See you Sunday at five.',
    turns: [
      { who: 'A', text: 'My parents will be away this weekend, so we can have the movie night at my place.' },
      { who: 'B', text: 'Nice. Saturday night?' },
      { who: 'A', text: 'My little brother has a friend over on Saturday. Sunday is better.' },
      { who: 'B', text: 'Sunday night... I have school the next day. Can we start early, like five?' },
      { who: 'A', text: 'Sure, we\'ll finish by nine. Bring snacks ̶ I\'ll order pizza.' },
      { who: 'B', text: 'I\'ll bring chips and juice. See you Sunday at five.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL3_SET9: ListeningProblem = {
  id: 'q_el3_set9',
  category: '第9回 短い対話の内容一致（標準）',
  readCount: 1,
  audioTracks: EL3_SET9_TRACKS,
  text: `第9回　第3問（6問・1回読み）　【難易度：標準】

第3問では、2人の短い対話が1回だけ流れます。それぞれの問いの答えとして最も適切なものを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は1回読みなので、まずは1回で解き、答え合わせの前にもう一度だけ聞いて確かめてください。

【解き方のコツ】
音声が流れる前に「場面」と「Question」を読み、選択肢4つの違いを1語で言えるようにしておきます。1回読みでは、聞くべき1語が決まっているかどうかで勝負が決まります。

────────────────────
問1（話者：女性（母親） / 男性（息子・中学生））
場面：雨の日の送迎を調整している。
Question: How will the boy go to school?
① By bus
② On foot
③ By car
④ By bike

────────────────────
問2（話者：男性（客） / 女性（店員））
場面：レストランでアレルギーの確認をしている。
Question: What will the man's wife eat?
① Pasta without cheese, no soup
② Pasta with cheese, no soup
③ Pasta with cheese and corn soup
④ Only the corn soup

────────────────────
問3（話者：女性（旅行者） / 男性（駅員））
場面：駅のコインロッカーについて話している。
Question: How much will the woman pay for the locker?
① 400 yen
② 700 yen
③ 1,100 yen
④ 350 yen

────────────────────
問4（話者：男性（先生） / 女性（生徒会長））
場面：学校の避難訓練の手順を確認している。
Question: What should students do at the second bell?
① Go to the field
② Go to the gym
③ Use the east stairs
④ Stay in the classroom

────────────────────
問5（話者：女性（大学生） / 男性（不動産屋））
場面：引っ越し先の部屋の採寸をしている。
Question: Where will the bookshelf go?
① On the wall next to the bed
② It won't fit anywhere
③ Next to the desk
④ Between the door and the window

────────────────────
問6（話者：女性（高校生） / 男性（高校生））
場面：友達の家でのお泊まり会の計画をしている。
Question: When and where will they have the movie night?
① Saturday night at her house
② Sunday from five at her house
③ Saturday night at his house
④ Sunday from five at his house`,
  subQuestions: [
    {
      id: 'q_el3_set9_1',
      label: '問1 How will the boy go to school?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: '車は修理中→バスで登校',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set9_2',
      label: '問2 What will the man\'s wife eat?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '妻＝チーズ抜きパスタ・スープなし、夫＝スープあり、の個別注文の整理',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set9_3',
      label: '問3 How much will the woman pay for the locker?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '大きいロッカー700円・時間ではなく日単位',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set9_4',
      label: '問4 What should students do at the second bell?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: '昨年との手順変更（第1ベル＝教室待機、第2ベル＝グラウンド）',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set9_5',
      label: '問5 Where will the bookshelf go?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '寸法の計算（120+90=210 > 140 で同居不可）→別の壁へ',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set9_6',
      label: '問6 When and where will they have the movie night?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '場所（彼女の家）と曜日・時刻（日曜17時開始）の確定',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
  ],
  explanation: `第9回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ①
場面：雨の日の送迎を調整している。
スクリプト：A: It's pouring. Do you want a ride to school?
B: The car is being repaired today, isn't it?
A: Right. Then take the bus from the corner stop. It comes at seven forty.
B: That gets me there too early. My friends and I always meet at the gate at eight ten.
A: The seven-forty bus arrives at school at eight. That's only ten minutes early. You'll survive.
B: Fine. But I'm coming home by bike if it stops raining.
Question: How will the boy go to school?
正解の選択肢：By bus
車は修理中→バスで登校。自転車は帰りの話（条件付き）でひっかけ。行きと帰りの手段の区別。

問2　正解は ①
場面：レストランでアレルギーの確認をしている。
スクリプト：A: Does the tomato pasta contain cheese? My wife can't eat dairy.
B: It has a little cheese on top, but we can make it without.
A: Please do. Also, is the soup of the day dairy-free?
B: Today's soup is corn soup. It has milk and butter.
A: Then no soup for her. I'll have the soup myself.
B: Certainly. One pasta without cheese, and one corn soup.
Question: What will the man's wife eat?
正解の選択肢：Pasta without cheese, no soup
妻＝チーズ抜きパスタ・スープなし、夫＝スープあり、の個別注文の整理。誰が何を食べるかの対応。

問3　正解は ②
場面：駅のコインロッカーについて話している。
スクリプト：A: Are there lockers big enough for a suitcase?
B: Yes, on the second floor near the east exit. The ones here on the first floor are for small bags only.
A: How much are the big ones?
B: 700 yen per day. The small ones are 400.
A: I only need it until this evening. Is it still 700?
B: Yes, the price is per calendar day, not per hour.
Question: How much will the woman pay for the locker?
正解の選択肢：700 yen
大きいロッカー700円・時間ではなく日単位。数時間でも700円。料金体系の理解がポイント。

問4　正解は ①
場面：学校の避難訓練の手順を確認している。
スクリプト：A: In this year's drill, the first bell means 'stay in your classroom.'
B: Last year the first bell meant 'go to the gym,' right?
A: That's the change this year. The second bell means move to the field, not the gym.
B: Why the field?
A: The gym is being repainted. And don't use the east stairs ̶ use the main stairs and the west stairs only.
Question: What should students do at the second bell?
正解の選択肢：Go to the field
昨年との手順変更（第1ベル＝教室待機、第2ベル＝グラウンド）。東階段は使用禁止。変更点の正確な把握。

問5　正解は ①
場面：引っ越し先の部屋の採寸をしている。
スクリプト：A: Will my desk fit? It's 120 centimeters wide.
B: The wall space between the door and the window is 140 centimeters.
A: Great. What about my bookshelf? It's 90 wide and 180 tall.
B: The ceiling is fine, but that same wall only has 140. The desk plus the shelf would be 210.
A: Then the bookshelf goes on the other wall, next to the bed.
B: That wall is 200 centimeters. No problem.
Question: Where will the bookshelf go?
正解の選択肢：On the wall next to the bed
寸法の計算（120+90=210 > 140 で同居不可）→別の壁へ。数字の比較による配置決定。

問6　正解は ②
場面：友達の家でのお泊まり会の計画をしている。
スクリプト：A: My parents will be away this weekend, so we can have the movie night at my place.
B: Nice. Saturday night?
A: My little brother has a friend over on Saturday. Sunday is better.
B: Sunday night... I have school the next day. Can we start early, like five?
A: Sure, we'll finish by nine. Bring snacks ̶ I'll order pizza.
B: I'll bring chips and juice. See you Sunday at five.
Question: When and where will they have the movie night?
正解の選択肢：Sunday from five at her house
場所（彼女の家）と曜日・時刻（日曜17時開始）の確定。土曜は弟の友人が来るため不可。複合情報の整理。`,
  surroundingKnowledge: [
    '第3問は1回読み。音声が流れる前に場面と設問文を読み終えておくのが前提の大問である。',
    '設問文の疑問詞が答えの型を決める。How long → 期間、How much → 金額、What will 〜 do → 次の行動。',
    '数量・金額・時刻は「訂正」がつきもの。最初に聞こえた数字はダミーであることが多い。',
    'but / actually / instead / in total / on second thought の後ろに結論が来る。',
    '選択肢の誤りは「最初に出た数字」「別人の行動」「条件を満たさない案」のどれかに集約される。',
  ],
  deepDiveTopics: [
    '「先読み」を習慣にする。場面＋設問文＋選択肢の3点を10秒で読む練習を単独でやると効く。',
    '聞こえた単語がそのまま入っている選択肢はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。合意した内容が答えになる。',
  ],
};

const EL3_SET10_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el3_set10_1',
    audioUrl: '/listening_audio/el3_set10_q1.mp3',
    label: '問1',
    hint: '会社の健康診断の案内を読んで話している。',
    script: 'A: The health check is on the 14th. We\'re supposed to skip breakfast that day.\nB: Really? Last year we could eat until six a.m.\nA: The rules changed. This year, nothing after nine p.m. the night before. Only water is OK in the morning.\nB: What about medicine? I take pills every morning.\nA: The notice says to bring them and take them after the blood test.\nB: OK. Pills come with me, breakfast stays home.',
    turns: [
      { who: 'A', text: 'The health check is on the 14th. We\'re supposed to skip breakfast that day.' },
      { who: 'B', text: 'Really? Last year we could eat until six a.m.' },
      { who: 'A', text: 'The rules changed. This year, nothing after nine p.m. the night before. Only water is OK in the morning.' },
      { who: 'B', text: 'What about medicine? I take pills every morning.' },
      { who: 'A', text: 'The notice says to bring them and take them after the blood test.' },
      { who: 'B', text: 'OK. Pills come with me, breakfast stays home.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set10_2',
    audioUrl: '/listening_audio/el3_set10_q2.mp3',
    label: '問2',
    hint: '地区の防災訓練の参加について話している。',
    script: 'A: The disaster drill is this Sunday at the elementary school.\nB: Do I need to register in advance?\nA: No, just come between eight thirty and nine. We\'ll lend you a helmet, but bring your own water and towel.\nB: My husband uses a wheelchair. Is the school accessible?\nA: Yes, and we have a special area for wheelchair users near the exit. Ask the staff in the red jackets when you arrive.\nB: That\'s a relief. We\'ll be there before nine.',
    turns: [
      { who: 'A', text: 'The disaster drill is this Sunday at the elementary school.' },
      { who: 'B', text: 'Do I need to register in advance?' },
      { who: 'A', text: 'No, just come between eight thirty and nine. We\'ll lend you a helmet, but bring your own water and towel.' },
      { who: 'B', text: 'My husband uses a wheelchair. Is the school accessible?' },
      { who: 'A', text: 'Yes, and we have a special area for wheelchair users near the exit. Ask the staff in the red jackets when you arrive.' },
      { who: 'B', text: 'That\'s a relief. We\'ll be there before nine.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set10_3',
    audioUrl: '/listening_audio/el3_set10_q3.mp3',
    label: '問3',
    hint: '論文の提出方法について学生と事務員が話している。',
    script: 'A: Is the deadline for the paper still Friday at five?\nB: The deadline is the same, but the submission method changed. No more paper copies ̶ email it as a PDF.\nA: To the department office address?\nB: No, there\'s a new online form on the university website. Upload it there.\nA: Do I still need the signature page from my advisor?\nB: Yes. Scan it and upload it as a separate file.',
    turns: [
      { who: 'A', text: 'Is the deadline for the paper still Friday at five?' },
      { who: 'B', text: 'The deadline is the same, but the submission method changed. No more paper copies ̶ email it as a PDF.' },
      { who: 'A', text: 'To the department office address?' },
      { who: 'B', text: 'No, there\'s a new online form on the university website. Upload it there.' },
      { who: 'A', text: 'Do I still need the signature page from my advisor?' },
      { who: 'B', text: 'Yes. Scan it and upload it as a separate file.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set10_4',
    audioUrl: '/listening_audio/el3_set10_q4.mp3',
    label: '問4',
    hint: '劇のチケットの取り置きを頼んでいる。',
    script: 'A: Can I reserve two tickets for Saturday evening?\nB: Saturday evening is sold out. We have seats for Saturday afternoon or Sunday evening.\nA: How\'s the view from the Sunday seats?\nB: Saturday afternoon\'s seats are in the front center. Sunday evening\'s are on the second floor, side.\nA: The front center sounds better. But my friend works Saturday afternoons... You know what, she said evening shows only. Sunday, please.',
    turns: [
      { who: 'A', text: 'Can I reserve two tickets for Saturday evening?' },
      { who: 'B', text: 'Saturday evening is sold out. We have seats for Saturday afternoon or Sunday evening.' },
      { who: 'A', text: 'How\'s the view from the Sunday seats?' },
      { who: 'B', text: 'Saturday afternoon\'s seats are in the front center. Sunday evening\'s are on the second floor, side.' },
      { who: 'A', text: 'The front center sounds better. But my friend works Saturday afternoons... You know what, she said evening shows only. Sunday, please.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set10_5',
    audioUrl: '/listening_audio/el3_set10_q5.mp3',
    label: '問5',
    hint: 'パソコンのデータ移行について相談している。',
    script: 'A: I got a new laptop. Can you move all my files today?\nB: All the documents, yes. But your photo folder is 200 gigabytes ̶ that alone will take all night.\nA: Can you skip the videos in that folder? I have them saved elsewhere.\nB: The videos are half of it. Then it\'s 100 gigabytes. Still slow, but we can finish by tomorrow morning.\nA: OK. Documents first, please. I need them for a meeting at three.',
    turns: [
      { who: 'A', text: 'I got a new laptop. Can you move all my files today?' },
      { who: 'B', text: 'All the documents, yes. But your photo folder is 200 gigabytes ̶ that alone will take all night.' },
      { who: 'A', text: 'Can you skip the videos in that folder? I have them saved elsewhere.' },
      { who: 'B', text: 'The videos are half of it. Then it\'s 100 gigabytes. Still slow, but we can finish by tomorrow morning.' },
      { who: 'A', text: 'OK. Documents first, please. I need them for a meeting at three.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set10_6',
    audioUrl: '/listening_audio/el3_set10_q6.mp3',
    label: '問6',
    hint: '祭りの屋台の出店申し込みについて話している。',
    script: 'A: I\'d like to apply for a food stall at the summer festival.\nB: Food stalls need a fire safety certificate. Do you have one?\nA: I have one from last year. Is it still valid?\nB: Certificates expire after two years. When exactly did you get yours?\nA: June, two years ago.\nB: Then it\'s still valid this summer, but you\'ll need to renew it next year. Also, the application fee went up to 5,000 yen this year.\nA: That\'s fine. Here\'s the form and the fee.',
    turns: [
      { who: 'A', text: 'I\'d like to apply for a food stall at the summer festival.' },
      { who: 'B', text: 'Food stalls need a fire safety certificate. Do you have one?' },
      { who: 'A', text: 'I have one from last year. Is it still valid?' },
      { who: 'B', text: 'Certificates expire after two years. When exactly did you get yours?' },
      { who: 'A', text: 'June, two years ago.' },
      { who: 'B', text: 'Then it\'s still valid this summer, but you\'ll need to renew it next year. Also, the application fee went up to 5,000 yen this year.' },
      { who: 'A', text: 'That\'s fine. Here\'s the form and the fee.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL3_SET10: ListeningProblem = {
  id: 'q_el3_set10',
  category: '第10回 短い対話の内容一致（やや難）',
  readCount: 1,
  audioTracks: EL3_SET10_TRACKS,
  text: `第10回　第3問（6問・1回読み）　【難易度：やや難】

第3問では、2人の短い対話が1回だけ流れます。それぞれの問いの答えとして最も適切なものを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は1回読みなので、まずは1回で解き、答え合わせの前にもう一度だけ聞いて確かめてください。

【解き方のコツ】
音声が流れる前に「場面」と「Question」を読み、選択肢4つの違いを1語で言えるようにしておきます。1回読みでは、聞くべき1語が決まっているかどうかで勝負が決まります。

────────────────────
問1（話者：女性（会社員） / 男性（同僚））
場面：会社の健康診断の案内を読んで話している。
Question: What should the man do on the morning of the 14th?
① Take his medicine as usual
② Drink only water and bring his pills
③ Skip both breakfast and water
④ Eat breakfast before six

────────────────────
問2（話者：男性（自治会長） / 女性（住民））
場面：地区の防災訓練の参加について話している。
Question: What should the woman bring to the drill?
① Nothing
② Water and a towel
③ A helmet
④ A registration form

────────────────────
問3（話者：男性（大学院生） / 女性（事務員））
場面：論文の提出方法について学生と事務員が話している。
Question: How should the man submit his paper?
① Upload a PDF through the website form
② Email a PDF to the department
③ Upload everything in one file
④ Hand in a paper copy

────────────────────
問4（話者：女性（客） / 男性（劇場スタッフ））
場面：劇のチケットの取り置きを頼んでいる。
Question: Which tickets will the woman buy?
① Saturday evening, front center
② Saturday afternoon, front center
③ Sunday evening, second floor side
④ Sunday evening, front center

────────────────────
問5（話者：男性（会社員） / 女性（IT担当））
場面：パソコンのデータ移行について相談している。
Question: What will be finished by tomorrow morning?
① Documents and photos without videos
② Everything including videos
③ Documents and all photos
④ Only the documents

────────────────────
問6（話者：女性（出店希望者） / 男性（実行委員））
場面：祭りの屋台の出店申し込みについて話している。
Question: What is true about the woman's certificate?
① It is valid this year but not next year.
② It must be renewed this year.
③ It is valid for two more years.
④ It has already expired.`,
  subQuestions: [
    {
      id: 'q_el3_set10_1',
      label: '問1 What should the man do on the morning of the 14th?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 48,
      detailedExplanation: {
        theme: '昨年のルールとの変更点（21時以降禁食・朝は水のみ・薬は持参して検査後）',
        type: '短い対話の内容一致型',
        difficulty: 4,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set10_2',
      label: '問2 What should the woman bring to the drill?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 45,
      detailedExplanation: {
        theme: '貸与品（ヘルメット）と持参品（水・タオル）の区別',
        type: '短い対話の内容一致型',
        difficulty: 4,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set10_3',
      label: '問3 How should the man submit his paper?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 42,
      detailedExplanation: {
        theme: '提出方法の変更（紙→メール→Webフォーム、の2段階の訂正）',
        type: '短い対話の内容一致型',
        difficulty: 4,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set10_4',
      label: '問4 Which tickets will the woman buy?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 48,
      detailedExplanation: {
        theme: '希望（土曜夜）は完売→座席の良さ（土曜昼・前方中央）と友人の条件（夜のみ）が競合→友人の条件優先で日曜夜',
        type: '短い対話の内容一致型',
        difficulty: 4,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set10_5',
      label: '問5 What will be finished by tomorrow morning?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 45,
      detailedExplanation: {
        theme: '容量の内訳（写真フォルダ200GB→動画除外で100GB）を除けば明朝までに完了、という計算',
        type: '短い対話の内容一致型',
        difficulty: 4,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set10_6',
      label: '問6 What is true about the woman\'s certificate?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 42,
      detailedExplanation: {
        theme: '有効期限2年・取得は2年前の6月→今年ぎりぎり有効・来年は更新必要、という時間軸の正確な計算',
        type: '短い対話の内容一致型',
        difficulty: 4,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
  ],
  explanation: `第10回（難易度：やや難）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ②
場面：会社の健康診断の案内を読んで話している。
スクリプト：A: The health check is on the 14th. We're supposed to skip breakfast that day.
B: Really? Last year we could eat until six a.m.
A: The rules changed. This year, nothing after nine p.m. the night before. Only water is OK in the morning.
B: What about medicine? I take pills every morning.
A: The notice says to bring them and take them after the blood test.
B: OK. Pills come with me, breakfast stays home.
Question: What should the man do on the morning of the 14th?
正解の選択肢：Drink only water and bring his pills
昨年のルールとの変更点（21時以降禁食・朝は水のみ・薬は持参して検査後）。複数の新ルールの統合。

問2　正解は ②
場面：地区の防災訓練の参加について話している。
スクリプト：A: The disaster drill is this Sunday at the elementary school.
B: Do I need to register in advance?
A: No, just come between eight thirty and nine. We'll lend you a helmet, but bring your own water and towel.
B: My husband uses a wheelchair. Is the school accessible?
A: Yes, and we have a special area for wheelchair users near the exit. Ask the staff in the red jackets when you arrive.
B: That's a relief. We'll be there before nine.
Question: What should the woman bring to the drill?
正解の選択肢：Water and a towel
貸与品（ヘルメット）と持参品（水・タオル）の区別。事前登録不要もダミー。詳細の聞き分け。

問3　正解は ①
場面：論文の提出方法について学生と事務員が話している。
スクリプト：A: Is the deadline for the paper still Friday at five?
B: The deadline is the same, but the submission method changed. No more paper copies ̶ email it as a PDF.
A: To the department office address?
B: No, there's a new online form on the university website. Upload it there.
A: Do I still need the signature page from my advisor?
B: Yes. Scan it and upload it as a separate file.
Question: How should the man submit his paper?
正解の選択肢：Upload a PDF through the website form
提出方法の変更（紙→メール→Webフォーム、の2段階の訂正）。署名ページは別ファイル、はひっかけ詳細。締切は不変。

問4　正解は ③
場面：劇のチケットの取り置きを頼んでいる。
スクリプト：A: Can I reserve two tickets for Saturday evening?
B: Saturday evening is sold out. We have seats for Saturday afternoon or Sunday evening.
A: How's the view from the Sunday seats?
B: Saturday afternoon's seats are in the front center. Sunday evening's are on the second floor, side.
A: The front center sounds better. But my friend works Saturday afternoons... You know what, she said evening shows only. Sunday, please.
Question: Which tickets will the woman buy?
正解の選択肢：Sunday evening, second floor side
希望（土曜夜）は完売→座席の良さ（土曜昼・前方中央）と友人の条件（夜のみ）が競合→友人の条件優先で日曜夜。優先順位の判断。

問5　正解は ①
場面：パソコンのデータ移行について相談している。
スクリプト：A: I got a new laptop. Can you move all my files today?
B: All the documents, yes. But your photo folder is 200 gigabytes ̶ that alone will take all night.
A: Can you skip the videos in that folder? I have them saved elsewhere.
B: The videos are half of it. Then it's 100 gigabytes. Still slow, but we can finish by tomorrow morning.
A: OK. Documents first, please. I need them for a meeting at three.
Question: What will be finished by tomorrow morning?
正解の選択肢：Documents and photos without videos
容量の内訳（写真フォルダ200GB→動画除外で100GB）を除けば明朝までに完了、という計算。all / skip の対象が鍵。

問6　正解は ①
場面：祭りの屋台の出店申し込みについて話している。
スクリプト：A: I'd like to apply for a food stall at the summer festival.
B: Food stalls need a fire safety certificate. Do you have one?
A: I have one from last year. Is it still valid?
B: Certificates expire after two years. When exactly did you get yours?
A: June, two years ago.
B: Then it's still valid this summer, but you'll need to renew it next year. Also, the application fee went up to 5,000 yen this year.
A: That's fine. Here's the form and the fee.
Question: What is true about the woman's certificate?
正解の選択肢：It is valid this year but not next year.
有効期限2年・取得は2年前の6月→今年ぎりぎり有効・来年は更新必要、という時間軸の正確な計算。What is true 型。`,
  surroundingKnowledge: [
    '第3問は1回読み。音声が流れる前に場面と設問文を読み終えておくのが前提の大問である。',
    '設問文の疑問詞が答えの型を決める。How long → 期間、How much → 金額、What will 〜 do → 次の行動。',
    '数量・金額・時刻は「訂正」がつきもの。最初に聞こえた数字はダミーであることが多い。',
    'but / actually / instead / in total / on second thought の後ろに結論が来る。',
    '選択肢の誤りは「最初に出た数字」「別人の行動」「条件を満たさない案」のどれかに集約される。',
  ],
  deepDiveTopics: [
    '「先読み」を習慣にする。場面＋設問文＋選択肢の3点を10秒で読む練習を単独でやると効く。',
    '聞こえた単語がそのまま入っている選択肢はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。合意した内容が答えになる。',
  ],
};

const EL3_SET11_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el3_set11_1',
    audioUrl: '/listening_audio/el3_set11_q1.mp3',
    label: '問1',
    hint: '帰国子女の生徒が転校初日に話している。',
    script: 'A: I just moved here from Singapore last week.\nB: Were you born there?\nA: No, I was born in Osaka. We moved to Singapore when I was six because of my dad\'s job.\nB: So you speak English well?\nA: Pretty well, but my Chinese is better. My mom is from Taiwan.\nB: Wow. When did you come back to Japan?\nA: We arrived in Tokyo last month, then moved here to Nagoya last week.',
    turns: [
      { who: 'A', text: 'I just moved here from Singapore last week.' },
      { who: 'B', text: 'Were you born there?' },
      { who: 'A', text: 'No, I was born in Osaka. We moved to Singapore when I was six because of my dad\'s job.' },
      { who: 'B', text: 'So you speak English well?' },
      { who: 'A', text: 'Pretty well, but my Chinese is better. My mom is from Taiwan.' },
      { who: 'B', text: 'Wow. When did you come back to Japan?' },
      { who: 'A', text: 'We arrived in Tokyo last month, then moved here to Nagoya last week.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set11_2',
    audioUrl: '/listening_audio/el3_set11_q2.mp3',
    label: '問2',
    hint: '駅前の再開発について話している。',
    script: 'A: Did you hear the old bookstore in front of the station closed?\nB: No! I loved that place. Why?\nA: They\'re building a new shopping mall there. The supermarket in the mall opens next month.\nB: What about the bookstore? Is it gone forever?\nA: Actually, it\'s moving into the mall ̶ second floor, next to the café. It opens in spring.\nB: That\'s good news. The location is even better.',
    turns: [
      { who: 'A', text: 'Did you hear the old bookstore in front of the station closed?' },
      { who: 'B', text: 'No! I loved that place. Why?' },
      { who: 'A', text: 'They\'re building a new shopping mall there. The supermarket in the mall opens next month.' },
      { who: 'B', text: 'What about the bookstore? Is it gone forever?' },
      { who: 'A', text: 'Actually, it\'s moving into the mall ̶ second floor, next to the café. It opens in spring.' },
      { who: 'B', text: 'That\'s good news. The location is even better.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set11_3',
    audioUrl: '/listening_audio/el3_set11_q3.mp3',
    label: '問3',
    hint: '遠足のグループ分けを確認している。',
    script: 'A: For the field trip, you\'ll be in groups of five. Group leaders, come get the maps.\nB: Ms. Tanaka, I\'m in Group 3, but my best friend is in Group 5. Can we switch?\nA: Group 3 already has six people because of the new student. I need someone to move.\nB: Oh, then moving to Group 5 actually helps!\nA: Exactly. You\'re in Group 5 now. Take this map ̶ you\'re also the new leader since Ken is absent today.',
    turns: [
      { who: 'A', text: 'For the field trip, you\'ll be in groups of five. Group leaders, come get the maps.' },
      { who: 'B', text: 'Ms. Tanaka, I\'m in Group 3, but my best friend is in Group 5. Can we switch?' },
      { who: 'A', text: 'Group 3 already has six people because of the new student. I need someone to move.' },
      { who: 'B', text: 'Oh, then moving to Group 5 actually helps!' },
      { who: 'A', text: 'Exactly. You\'re in Group 5 now. Take this map ̶ you\'re also the new leader since Ken is absent today.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set11_4',
    audioUrl: '/listening_audio/el3_set11_q4.mp3',
    label: '問4',
    hint: 'ネットショッピングの返品について話している。',
    script: 'A: I want to return this sweater. It\'s too small.\nB: We can exchange it for a larger size or refund you. But returns must be within two weeks of delivery.\nA: It arrived on the first of this month. What\'s today... the tenth?\nB: Then you\'re fine. Would you like a size M?\nA: Actually, I checked the size chart and L is better. And a different color if possible ̶ the navy one.\nB: Size L in navy. I\'ll arrange it.',
    turns: [
      { who: 'A', text: 'I want to return this sweater. It\'s too small.' },
      { who: 'B', text: 'We can exchange it for a larger size or refund you. But returns must be within two weeks of delivery.' },
      { who: 'A', text: 'It arrived on the first of this month. What\'s today... the tenth?' },
      { who: 'B', text: 'Then you\'re fine. Would you like a size M?' },
      { who: 'A', text: 'Actually, I checked the size chart and L is better. And a different color if possible ̶ the navy one.' },
      { who: 'B', text: 'Size L in navy. I\'ll arrange it.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set11_5',
    audioUrl: '/listening_audio/el3_set11_q5.mp3',
    label: '問5',
    hint: '朝のラジオ体操イベントに誘っている。',
    script: 'A: Grandma, will you come to radio exercises with me tomorrow?\nB: What time does it start?\nA: Six thirty at the park. You get a stamp card, and after ten stamps you get a prize.\nB: How many stamps do you have now?\nA: Seven! Only three more. But it ends this Friday.\nB: Then we should go every day. I\'ll wake you up at six.',
    turns: [
      { who: 'A', text: 'Grandma, will you come to radio exercises with me tomorrow?' },
      { who: 'B', text: 'What time does it start?' },
      { who: 'A', text: 'Six thirty at the park. You get a stamp card, and after ten stamps you get a prize.' },
      { who: 'B', text: 'How many stamps do you have now?' },
      { who: 'A', text: 'Seven! Only three more. But it ends this Friday.' },
      { who: 'B', text: 'Then we should go every day. I\'ll wake you up at six.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set11_6',
    audioUrl: '/listening_audio/el3_set11_q6.mp3',
    label: '問6',
    hint: 'フリーマーケットの値段交渉をしている。',
    script: 'A: How much is this lamp?\nB: 2,000 yen. It\'s almost new.\nA: There\'s a small scratch here. Would you take 1,500?\nB: I can do 1,800.\nA: What if I also buy this clock? It\'s 800 yen, right?\nB: Tell you what ̶ the lamp and the clock together for 2,200 yen.\nA: Deal!',
    turns: [
      { who: 'A', text: 'How much is this lamp?' },
      { who: 'B', text: '2,000 yen. It\'s almost new.' },
      { who: 'A', text: 'There\'s a small scratch here. Would you take 1,500?' },
      { who: 'B', text: 'I can do 1,800.' },
      { who: 'A', text: 'What if I also buy this clock? It\'s 800 yen, right?' },
      { who: 'B', text: 'Tell you what ̶ the lamp and the clock together for 2,200 yen.' },
      { who: 'A', text: 'Deal!' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL3_SET11: ListeningProblem = {
  id: 'q_el3_set11',
  category: '第11回 短い対話の内容一致（標準）',
  readCount: 1,
  audioTracks: EL3_SET11_TRACKS,
  text: `第11回　第3問（6問・1回読み）　【難易度：標準】

第3問では、2人の短い対話が1回だけ流れます。それぞれの問いの答えとして最も適切なものを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は1回読みなので、まずは1回で解き、答え合わせの前にもう一度だけ聞いて確かめてください。

【解き方のコツ】
音声が流れる前に「場面」と「Question」を読み、選択肢4つの違いを1語で言えるようにしておきます。1回読みでは、聞くべき1語が決まっているかどうかで勝負が決まります。

────────────────────
問1（話者：男性（生徒） / 女性（クラスメート））
場面：帰国子女の生徒が転校初日に話している。
Question: What is true about the boy?
① He returned to Japan last week.
② He moved to Nagoya from Osaka.
③ He was born in Singapore.
④ His best language is Chinese.

────────────────────
問2（話者：女性（住民） / 男性（友人））
場面：駅前の再開発について話している。
Question: What will happen to the bookstore?
① It reopened last month.
② It will move next to the station.
③ It will close permanently.
④ It will reopen inside the new mall.

────────────────────
問3（話者：男性（先生） / 女性（生徒））
場面：遠足のグループ分けを確認している。
Question: What happened to the girl?
① She stayed in Group 3.
② She moved to Group 5 and became the leader.
③ She moved to Group 5 as a regular member.
④ She became the leader of Group 3.

────────────────────
問4（話者：女性（客） / 男性（カスタマーサービス））
場面：ネットショッピングの返品について話している。
Question: What will the customer receive?
① The same sweater in size L
② A navy sweater in size M
③ A refund
④ A navy sweater in size L

────────────────────
問5（話者：男性（小学生） / 女性（祖母））
場面：朝のラジオ体操イベントに誘っている。
Question: How many more times does the boy need to go?
① Ten times
② Seven times
③ Three times
④ Five times

────────────────────
問6（話者：女性（客） / 男性（出店者））
場面：フリーマーケットの値段交渉をしている。
Question: How much did the woman pay in total?
① 1,500 yen
② 1,800 yen
③ 2,200 yen
④ 2,800 yen`,
  subQuestions: [
    {
      id: 'q_el3_set11_1',
      label: '問1 What is true about the boy?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: '出生地（大阪）・経由地（シンガポール）・帰国先（東京→名古屋）と母語の情報が錯綜',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set11_2',
      label: '問2 What will happen to the bookstore?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '閉店→モール内2階で春に再開、という経緯',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set11_3',
      label: '問3 What happened to the girl?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: 'グループ変更＋リーダー任命の2つの変化',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set11_4',
      label: '問4 What will the customer receive?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: '返金か交換か→交換、サイズ（M→Lに変更）・色（ネイビー）の指定変更',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set11_5',
      label: '問5 How many more times does the boy need to go?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '10個で賞品・現在7個→あと3回',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set11_6',
      label: '問6 How much did the woman pay in total?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '単品の定価（2,000＋800＝2,800）と交渉経過（1,500→1,800）を経てセット2,200円で確定',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
  ],
  explanation: `第11回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ④
場面：帰国子女の生徒が転校初日に話している。
スクリプト：A: I just moved here from Singapore last week.
B: Were you born there?
A: No, I was born in Osaka. We moved to Singapore when I was six because of my dad's job.
B: So you speak English well?
A: Pretty well, but my Chinese is better. My mom is from Taiwan.
B: Wow. When did you come back to Japan?
A: We arrived in Tokyo last month, then moved here to Nagoya last week.
Question: What is true about the boy?
正解の選択肢：His best language is Chinese.
出生地（大阪）・経由地（シンガポール）・帰国先（東京→名古屋）と母語の情報が錯綜。1つ1つ検証する What is true 型。2023年問15型。

問2　正解は ④
場面：駅前の再開発について話している。
スクリプト：A: Did you hear the old bookstore in front of the station closed?
B: No! I loved that place. Why?
A: They're building a new shopping mall there. The supermarket in the mall opens next month.
B: What about the bookstore? Is it gone forever?
A: Actually, it's moving into the mall ̶ second floor, next to the café. It opens in spring.
B: That's good news. The location is even better.
Question: What will happen to the bookstore?
正解の選択肢：It will reopen inside the new mall.
閉店→モール内2階で春に再開、という経緯。時制（来月開くのはスーパー／書店は春）の区別が鍵。

問3　正解は ②
場面：遠足のグループ分けを確認している。
スクリプト：A: For the field trip, you'll be in groups of five. Group leaders, come get the maps.
B: Ms. Tanaka, I'm in Group 3, but my best friend is in Group 5. Can we switch?
A: Group 3 already has six people because of the new student. I need someone to move.
B: Oh, then moving to Group 5 actually helps!
A: Exactly. You're in Group 5 now. Take this map ̶ you're also the new leader since Ken is absent today.
Question: What happened to the girl?
正解の選択肢：She moved to Group 5 and became the leader.
グループ変更＋リーダー任命の2つの変化。人数調整（6人→1人移動）の背景理解も必要。

問4　正解は ④
場面：ネットショッピングの返品について話している。
スクリプト：A: I want to return this sweater. It's too small.
B: We can exchange it for a larger size or refund you. But returns must be within two weeks of delivery.
A: It arrived on the first of this month. What's today... the tenth?
B: Then you're fine. Would you like a size M?
A: Actually, I checked the size chart and L is better. And a different color if possible ̶ the navy one.
B: Size L in navy. I'll arrange it.
Question: What will the customer receive?
正解の選択肢：A navy sweater in size L
返金か交換か→交換、サイズ（M→Lに変更）・色（ネイビー）の指定変更。最終的な組み合わせが正解。

問5　正解は ③
場面：朝のラジオ体操イベントに誘っている。
スクリプト：A: Grandma, will you come to radio exercises with me tomorrow?
B: What time does it start?
A: Six thirty at the park. You get a stamp card, and after ten stamps you get a prize.
B: How many stamps do you have now?
A: Seven! Only three more. But it ends this Friday.
B: Then we should go every day. I'll wake you up at six.
Question: How many more times does the boy need to go?
正解の選択肢：Three times
10個で賞品・現在7個→あと3回。金曜終了は緊急性の情報。単純な引き算だが数字の所在（7と10）の聞き分けが鍵。

問6　正解は ③
場面：フリーマーケットの値段交渉をしている。
スクリプト：A: How much is this lamp?
B: 2,000 yen. It's almost new.
A: There's a small scratch here. Would you take 1,500?
B: I can do 1,800.
A: What if I also buy this clock? It's 800 yen, right?
B: Tell you what ̶ the lamp and the clock together for 2,200 yen.
A: Deal!
Question: How much did the woman pay in total?
正解の選択肢：2,200 yen
単品の定価（2,000＋800＝2,800）と交渉経過（1,500→1,800）を経てセット2,200円で確定。最終合意額を問う。`,
  surroundingKnowledge: [
    '第3問は1回読み。音声が流れる前に場面と設問文を読み終えておくのが前提の大問である。',
    '設問文の疑問詞が答えの型を決める。How long → 期間、How much → 金額、What will 〜 do → 次の行動。',
    '数量・金額・時刻は「訂正」がつきもの。最初に聞こえた数字はダミーであることが多い。',
    'but / actually / instead / in total / on second thought の後ろに結論が来る。',
    '選択肢の誤りは「最初に出た数字」「別人の行動」「条件を満たさない案」のどれかに集約される。',
  ],
  deepDiveTopics: [
    '「先読み」を習慣にする。場面＋設問文＋選択肢の3点を10秒で読む練習を単独でやると効く。',
    '聞こえた単語がそのまま入っている選択肢はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。合意した内容が答えになる。',
  ],
};

const EL3_SET12_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el3_set12_1',
    audioUrl: '/listening_audio/el3_set12_q1.mp3',
    label: '問1',
    hint: '大学のオープンキャンパスへの行き方を調べている。',
    script: 'A: The university\'s open campus is on the 20th. It starts at ten.\nB: It\'s near Kyoto Station, right? We can drive.\nA: The website says there\'s no parking that day. We should use the train.\nB: OK. From our station, do we change trains?\nA: Yes, at Osaka. The rapid train at eight fifteen gets us there at nine twenty.\nB: Let\'s catch the earlier one at seven fifty, just in case.',
    turns: [
      { who: 'A', text: 'The university\'s open campus is on the 20th. It starts at ten.' },
      { who: 'B', text: 'It\'s near Kyoto Station, right? We can drive.' },
      { who: 'A', text: 'The website says there\'s no parking that day. We should use the train.' },
      { who: 'B', text: 'OK. From our station, do we change trains?' },
      { who: 'A', text: 'Yes, at Osaka. The rapid train at eight fifteen gets us there at nine twenty.' },
      { who: 'B', text: 'Let\'s catch the earlier one at seven fifty, just in case.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set12_2',
    audioUrl: '/listening_audio/el3_set12_q2.mp3',
    label: '問2',
    hint: '習熟度別クラスの振り分けテストについて話している。',
    script: 'A: Your test result decides your class. Seventy points or above is Class A.\nB: I got sixty-eight! That\'s so close.\nA: You can retake the test once. The retest is next Monday.\nB: Is it the same test?\nA: Same level, different questions. But note: if you take the retest, your new score counts even if it\'s lower.\nB: Risky... but I want Class A. I\'ll retake it.',
    turns: [
      { who: 'A', text: 'Your test result decides your class. Seventy points or above is Class A.' },
      { who: 'B', text: 'I got sixty-eight! That\'s so close.' },
      { who: 'A', text: 'You can retake the test once. The retest is next Monday.' },
      { who: 'B', text: 'Is it the same test?' },
      { who: 'A', text: 'Same level, different questions. But note: if you take the retest, your new score counts even if it\'s lower.' },
      { who: 'B', text: 'Risky... but I want Class A. I\'ll retake it.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set12_3',
    audioUrl: '/listening_audio/el3_set12_q3.mp3',
    label: '問3',
    hint: '地域のラジオ番組のゲスト出演の打ち合わせをしている。',
    script: 'A: You\'ll be on the show next Thursday. We record at the studio at six p.m., and it airs at eight.\nB: So it\'s not live?\nA: The Thursday show is recorded, but Saturday\'s show is live. Yours is the Thursday one.\nB: Got it. How long is my part?\nA: Ten minutes. We\'ll talk about your volunteer work abroad.\nB: Should I prepare anything?\nA: Bring photos if you have them. We\'ll post them on the show\'s website.',
    turns: [
      { who: 'A', text: 'You\'ll be on the show next Thursday. We record at the studio at six p.m., and it airs at eight.' },
      { who: 'B', text: 'So it\'s not live?' },
      { who: 'A', text: 'The Thursday show is recorded, but Saturday\'s show is live. Yours is the Thursday one.' },
      { who: 'B', text: 'Got it. How long is my part?' },
      { who: 'A', text: 'Ten minutes. We\'ll talk about your volunteer work abroad.' },
      { who: 'B', text: 'Should I prepare anything?' },
      { who: 'A', text: 'Bring photos if you have them. We\'ll post them on the show\'s website.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set12_4',
    audioUrl: '/listening_audio/el3_set12_q4.mp3',
    label: '問4',
    hint: '家族でペットホテルを選んでいる。',
    script: 'A: We need a pet hotel for Moko during our trip. Five nights.\nB: This one is 3,000 yen per night, and they send photos every day.\nA: This other one is 2,500 yen per night but charges extra for walks ̶ 500 yen each time.\nB: Moko needs a walk twice a day. So that\'s 1,000 yen extra per day.\nA: Right, so the second one is actually 3,500 a day. The first one is cheaper after all.\nB: And we get daily photos. Let\'s book the first one.',
    turns: [
      { who: 'A', text: 'We need a pet hotel for Moko during our trip. Five nights.' },
      { who: 'B', text: 'This one is 3,000 yen per night, and they send photos every day.' },
      { who: 'A', text: 'This other one is 2,500 yen per night but charges extra for walks ̶ 500 yen each time.' },
      { who: 'B', text: 'Moko needs a walk twice a day. So that\'s 1,000 yen extra per day.' },
      { who: 'A', text: 'Right, so the second one is actually 3,500 a day. The first one is cheaper after all.' },
      { who: 'B', text: 'And we get daily photos. Let\'s book the first one.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set12_5',
    audioUrl: '/listening_audio/el3_set12_q5.mp3',
    label: '問5',
    hint: '修学旅行の班別行動の持ち物を確認している。',
    script: 'A: Tomorrow is free time in Kyoto. Each group needs one map and one phone.\nB: Everyone has a phone. Can\'t we each use our own?\nA: School rules: phones stay off except the leader\'s. The leader\'s phone is for emergencies only.\nB: So I, as the leader, keep my phone on, and the others turn theirs off?\nA: Correct. Also, everyone needs to bring lunch money ̶ about 1,500 yen ̶ and a raincoat, not an umbrella. The streets are crowded.\nB: Raincoat, not umbrella. Got it.',
    turns: [
      { who: 'A', text: 'Tomorrow is free time in Kyoto. Each group needs one map and one phone.' },
      { who: 'B', text: 'Everyone has a phone. Can\'t we each use our own?' },
      { who: 'A', text: 'School rules: phones stay off except the leader\'s. The leader\'s phone is for emergencies only.' },
      { who: 'B', text: 'So I, as the leader, keep my phone on, and the others turn theirs off?' },
      { who: 'A', text: 'Correct. Also, everyone needs to bring lunch money ̶ about 1,500 yen ̶ and a raincoat, not an umbrella. The streets are crowded.' },
      { who: 'B', text: 'Raincoat, not umbrella. Got it.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set12_6',
    audioUrl: '/listening_audio/el3_set12_q6.mp3',
    label: '問6',
    hint: '市民プールの利用方法を確認している。',
    script: 'A: Is this your first time here?\nB: Yes. Do I need a membership card?\nA: No, but please write your name and address on this sheet each visit. Entry is 400 yen for adults.\nB: And my son? He\'s six.\nA: Children under elementary school age are 200 yen. Elementary students are free on weekends ̶ but today is Friday, so he\'s 200 yen... wait, is he in elementary school?\nB: He just started first grade this April.\nA: Then 200 yen for him today. Lockers need a 100-yen coin, which you get back.',
    turns: [
      { who: 'A', text: 'Is this your first time here?' },
      { who: 'B', text: 'Yes. Do I need a membership card?' },
      { who: 'A', text: 'No, but please write your name and address on this sheet each visit. Entry is 400 yen for adults.' },
      { who: 'B', text: 'And my son? He\'s six.' },
      { who: 'A', text: 'Children under elementary school age are 200 yen. Elementary students are free on weekends ̶ but today is Friday, so he\'s 200 yen... wait, is he in elementary school?' },
      { who: 'B', text: 'He just started first grade this April.' },
      { who: 'A', text: 'Then 200 yen for him today. Lockers need a 100-yen coin, which you get back.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL3_SET12: ListeningProblem = {
  id: 'q_el3_set12',
  category: '第12回 短い対話の内容一致（標準）',
  readCount: 1,
  audioTracks: EL3_SET12_TRACKS,
  text: `第12回　第3問（6問・1回読み）　【難易度：標準】

第3問では、2人の短い対話が1回だけ流れます。それぞれの問いの答えとして最も適切なものを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は1回読みなので、まずは1回で解き、答え合わせの前にもう一度だけ聞いて確かめてください。

【解き方のコツ】
音声が流れる前に「場面」と「Question」を読み、選択肢4つの違いを1語で言えるようにしておきます。1回読みでは、聞くべき1語が決まっているかどうかで勝負が決まります。

────────────────────
問1（話者：女性（高校生） / 男性（父親））
場面：大学のオープンキャンパスへの行き方を調べている。
Question: How will they get to the university?
① By car
② By bus from Kyoto Station
③ By direct train
④ By train with one transfer

────────────────────
問2（話者：男性（塾講師） / 女性（生徒））
場面：習熟度別クラスの振り分けテストについて話している。
Question: What happens if the girl's retest score is lower than 68?
① The retest score will be used.
② She can keep 68.
③ She will automatically enter Class A.
④ She can take the test a third time.

────────────────────
問3（話者：女性（パーソナリティ） / 男性（ゲスト・高校生））
場面：地域のラジオ番組のゲスト出演の打ち合わせをしている。
Question: What is true about the boy's appearance?
① It is recorded at six and airs at eight on Thursday.
② He will be on the show for thirty minutes.
③ It airs live on Saturday at eight.
④ It will be broadcast live on Thursday.

────────────────────
問4（話者：男性（父） / 女性（母））
場面：家族でペットホテルを選んでいる。
Question: Which hotel will they choose and why?
① The second one because the nightly price is lower
② The first one because of the photos
③ The second one because walks are included
④ The first one because it is cheaper in total

────────────────────
問5（話者：女性（先生） / 男性（生徒））
場面：修学旅行の班別行動の持ち物を確認している。
Question: What should the group members (not the leader) do with their phones?
① Use them only at lunch
② Turn them off
③ Keep them on for photos
④ Leave them at the hotel

────────────────────
問6（話者：女性（受付） / 女性（利用者））
場面：市民プールの利用方法を確認している。
Question: How much will they pay in total today?
① 400 yen
② 500 yen
③ 600 yen
④ 700 yen`,
  subQuestions: [
    {
      id: 'q_el3_set12_1',
      label: '問1 How will they get to the university?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: '車は駐車場なしで不可→電車・大阪で乗換',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set12_2',
      label: '問2 What happens if the girl\'s retest score is lower than 68?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '再試験のルール（低くても新スコアが採用される）という条件の正確な理解',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set12_3',
      label: '問3 What is true about the boy\'s appearance?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '木曜＝収録（18時収録・20時放送）／土曜＝生放送、の対比',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set12_4',
      label: '問4 Which hotel will they choose and why?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: '単価の安い方が散歩代で割高になる計算（2,500+1,000=3,500 > 3,000）',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set12_5',
      label: '問5 What should the group members (not the leader) do with their phones?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: 'リーダーと一般生徒でルールが違う点が核心',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set12_6',
      label: '問6 How much will they pay in total today?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '大人400円＋小学生（平日なので無料ではなく）200円＝600円',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
  ],
  explanation: `第12回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ④
場面：大学のオープンキャンパスへの行き方を調べている。
スクリプト：A: The university's open campus is on the 20th. It starts at ten.
B: It's near Kyoto Station, right? We can drive.
A: The website says there's no parking that day. We should use the train.
B: OK. From our station, do we change trains?
A: Yes, at Osaka. The rapid train at eight fifteen gets us there at nine twenty.
B: Let's catch the earlier one at seven fifty, just in case.
Question: How will they get to the university?
正解の選択肢：By train with one transfer
車は駐車場なしで不可→電車・大阪で乗換。時刻の選択（7:50発に早める）はひっかけ。交通手段の結論を問う。

問2　正解は ①
場面：習熟度別クラスの振り分けテストについて話している。
スクリプト：A: Your test result decides your class. Seventy points or above is Class A.
B: I got sixty-eight! That's so close.
A: You can retake the test once. The retest is next Monday.
B: Is it the same test?
A: Same level, different questions. But note: if you take the retest, your new score counts even if it's lower.
B: Risky... but I want Class A. I'll retake it.
Question: What happens if the girl's retest score is lower than 68?
正解の選択肢：The retest score will be used.
再試験のルール（低くても新スコアが採用される）という条件の正確な理解。リスクの条件文が鍵。

問3　正解は ①
場面：地域のラジオ番組のゲスト出演の打ち合わせをしている。
スクリプト：A: You'll be on the show next Thursday. We record at the studio at six p.m., and it airs at eight.
B: So it's not live?
A: The Thursday show is recorded, but Saturday's show is live. Yours is the Thursday one.
B: Got it. How long is my part?
A: Ten minutes. We'll talk about your volunteer work abroad.
B: Should I prepare anything?
A: Bring photos if you have them. We'll post them on the show's website.
Question: What is true about the boy's appearance?
正解の選択肢：It is recorded at six and airs at eight on Thursday.
木曜＝収録（18時収録・20時放送）／土曜＝生放送、の対比。live/recorded の混同がひっかけ。

問4　正解は ④
場面：家族でペットホテルを選んでいる。
スクリプト：A: We need a pet hotel for Moko during our trip. Five nights.
B: This one is 3,000 yen per night, and they send photos every day.
A: This other one is 2,500 yen per night but charges extra for walks ̶ 500 yen each time.
B: Moko needs a walk twice a day. So that's 1,000 yen extra per day.
A: Right, so the second one is actually 3,500 a day. The first one is cheaper after all.
B: And we get daily photos. Let's book the first one.
Question: Which hotel will they choose and why?
正解の選択肢：The first one because it is cheaper in total
単価の安い方が散歩代で割高になる計算（2,500+1,000=3,500 > 3,000）。総額比較が核心。理由付き設問。

問5　正解は ②
場面：修学旅行の班別行動の持ち物を確認している。
スクリプト：A: Tomorrow is free time in Kyoto. Each group needs one map and one phone.
B: Everyone has a phone. Can't we each use our own?
A: School rules: phones stay off except the leader's. The leader's phone is for emergencies only.
B: So I, as the leader, keep my phone on, and the others turn theirs off?
A: Correct. Also, everyone needs to bring lunch money ̶ about 1,500 yen ̶ and a raincoat, not an umbrella. The streets are crowded.
B: Raincoat, not umbrella. Got it.
Question: What should the group members (not the leader) do with their phones?
正解の選択肢：Turn them off
リーダーと一般生徒でルールが違う点が核心。傘ではなくレインコート、という指定も典型的な詳細ひっかけ。

問6　正解は ③
場面：市民プールの利用方法を確認している。
スクリプト：A: Is this your first time here?
B: Yes. Do I need a membership card?
A: No, but please write your name and address on this sheet each visit. Entry is 400 yen for adults.
B: And my son? He's six.
A: Children under elementary school age are 200 yen. Elementary students are free on weekends ̶ but today is Friday, so he's 200 yen... wait, is he in elementary school?
B: He just started first grade this April.
A: Then 200 yen for him today. Lockers need a 100-yen coin, which you get back.
Question: How much will they pay in total today?
正解の選択肢：600 yen
大人400円＋小学生（平日なので無料ではなく）200円＝600円。ロッカーの100円は返金式でダミー。曜日条件と年齢条件の複合。`,
  surroundingKnowledge: [
    '第3問は1回読み。音声が流れる前に場面と設問文を読み終えておくのが前提の大問である。',
    '設問文の疑問詞が答えの型を決める。How long → 期間、How much → 金額、What will 〜 do → 次の行動。',
    '数量・金額・時刻は「訂正」がつきもの。最初に聞こえた数字はダミーであることが多い。',
    'but / actually / instead / in total / on second thought の後ろに結論が来る。',
    '選択肢の誤りは「最初に出た数字」「別人の行動」「条件を満たさない案」のどれかに集約される。',
  ],
  deepDiveTopics: [
    '「先読み」を習慣にする。場面＋設問文＋選択肢の3点を10秒で読む練習を単独でやると効く。',
    '聞こえた単語がそのまま入っている選択肢はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。合意した内容が答えになる。',
  ],
};

const EL3_SET13_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el3_set13_1',
    audioUrl: '/listening_audio/el3_set13_q1.mp3',
    label: '問1',
    hint: '家のインターネット回線の故障について電話している。',
    script: 'A: Our internet has been down since this morning. I\'ve restarted the router twice.\nB: There\'s a cable problem in your area. A technician can come tomorrow between nine and noon, or between one and five.\nA: I work from home in the mornings, so the afternoon, please.\nB: All right. Someone must be home during the visit. Also, there\'s no charge if the problem is with our outside cable.\nA: And if it\'s inside my house?\nB: Then it\'s 8,000 yen. But since the whole area is affected, it will most likely be free.',
    turns: [
      { who: 'A', text: 'Our internet has been down since this morning. I\'ve restarted the router twice.' },
      { who: 'B', text: 'There\'s a cable problem in your area. A technician can come tomorrow between nine and noon, or between one and five.' },
      { who: 'A', text: 'I work from home in the mornings, so the afternoon, please.' },
      { who: 'B', text: 'All right. Someone must be home during the visit. Also, there\'s no charge if the problem is with our outside cable.' },
      { who: 'A', text: 'And if it\'s inside my house?' },
      { who: 'B', text: 'Then it\'s 8,000 yen. But since the whole area is affected, it will most likely be free.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set13_2',
    audioUrl: '/listening_audio/el3_set13_q2.mp3',
    label: '問2',
    hint: '幼稚園のお遊戯会の衣装について話している。',
    script: 'A: What should the children wear for the play?\nB: White shirts and dark pants. We provide the animal costumes here at the kindergarten.\nA: My daughter has a white shirt, but it\'s short-sleeved. Is that all right?\nB: Long sleeves are better because the costumes are sleeveless. But under the costume, short sleeves are fine.\nA: What about shoes?\nB: Everyone wears the same white gym shoes. Please write her name inside them.',
    turns: [
      { who: 'A', text: 'What should the children wear for the play?' },
      { who: 'B', text: 'White shirts and dark pants. We provide the animal costumes here at the kindergarten.' },
      { who: 'A', text: 'My daughter has a white shirt, but it\'s short-sleeved. Is that all right?' },
      { who: 'B', text: 'Long sleeves are better because the costumes are sleeveless. But under the costume, short sleeves are fine.' },
      { who: 'A', text: 'What about shoes?' },
      { who: 'B', text: 'Everyone wears the same white gym shoes. Please write her name inside them.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set13_3',
    audioUrl: '/listening_audio/el3_set13_q3.mp3',
    label: '問3',
    hint: '山登りの計画を天気予報を見ながら練り直している。',
    script: 'A: The forecast says Saturday will be cloudy, and Sunday sunny but windy at the summit.\nB: Windy how?\nA: Gusts up to 20 meters per second. The ropeway stops if it\'s over 15.\nB: So on Sunday the ropeway might not run. What about hiking up?\nA: It\'s a three-hour hike. Doable, but we\'d be tired for the festival that evening.\nB: Saturday it is, then. Cloudy is fine ̶ the ropeway will run, and we won\'t get sunburned.',
    turns: [
      { who: 'A', text: 'The forecast says Saturday will be cloudy, and Sunday sunny but windy at the summit.' },
      { who: 'B', text: 'Windy how?' },
      { who: 'A', text: 'Gusts up to 20 meters per second. The ropeway stops if it\'s over 15.' },
      { who: 'B', text: 'So on Sunday the ropeway might not run. What about hiking up?' },
      { who: 'A', text: 'It\'s a three-hour hike. Doable, but we\'d be tired for the festival that evening.' },
      { who: 'B', text: 'Saturday it is, then. Cloudy is fine ̶ the ropeway will run, and we won\'t get sunburned.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set13_4',
    audioUrl: '/listening_audio/el3_set13_q4.mp3',
    label: '問4',
    hint: 'バイト先の店の閉店セールについて話している。',
    script: 'A: I heard the shop is closing at the end of March. Is that true?\nB: Yes. The building is being torn down. But we\'re having a closing sale all month.\nA: Will the other shop in the mall hire the staff here?\nB: They offered positions to full-time workers only. Part-timers like you get two extra weeks of pay instead.\nA: That\'s fair. When\'s my last shift?\nB: The 28th. The last two days are for cleanup ̶ full-time staff only.',
    turns: [
      { who: 'A', text: 'I heard the shop is closing at the end of March. Is that true?' },
      { who: 'B', text: 'Yes. The building is being torn down. But we\'re having a closing sale all month.' },
      { who: 'A', text: 'Will the other shop in the mall hire the staff here?' },
      { who: 'B', text: 'They offered positions to full-time workers only. Part-timers like you get two extra weeks of pay instead.' },
      { who: 'A', text: 'That\'s fair. When\'s my last shift?' },
      { who: 'B', text: 'The 28th. The last two days are for cleanup ̶ full-time staff only.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set13_5',
    audioUrl: '/listening_audio/el3_set13_q5.mp3',
    label: '問5',
    hint: '家電の保証期間について話している。',
    script: 'A: This washing machine broke. I bought it here about two years ago.\nB: Do you have the receipt? The standard warranty is one year, but this brand offers a free three-year warranty if you registered online within a month of purchase.\nA: Registered? I don\'t think I did.\nB: Then it\'s the one-year warranty, I\'m afraid. The repair would cost about 12,000 yen.\nA: Hmm. A new basic model is 45,000 yen... I\'ll pay for the repair. It\'s cheaper.\nB: We\'ll pick it up on Thursday, then.',
    turns: [
      { who: 'A', text: 'This washing machine broke. I bought it here about two years ago.' },
      { who: 'B', text: 'Do you have the receipt? The standard warranty is one year, but this brand offers a free three-year warranty if you registered online within a month of purchase.' },
      { who: 'A', text: 'Registered? I don\'t think I did.' },
      { who: 'B', text: 'Then it\'s the one-year warranty, I\'m afraid. The repair would cost about 12,000 yen.' },
      { who: 'A', text: 'Hmm. A new basic model is 45,000 yen... I\'ll pay for the repair. It\'s cheaper.' },
      { who: 'B', text: 'We\'ll pick it up on Thursday, then.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set13_6',
    audioUrl: '/listening_audio/el3_set13_q6.mp3',
    label: '問6',
    hint: '深夜の救急病院の受付で話している。',
    script: 'A: My son fell off his bike and hit his head. He seems fine now, but he vomited once.\nB: Head injury with vomiting ̶ the doctor should see him right away. Fill out this form, please.\nA: Should he eat or drink anything?\nB: Nothing until the CT scan, in case we need to do a procedure. Sips of water are OK if he\'s thirsty.\nA: How long is the wait?\nB: He\'s high priority, so about fifteen minutes. The scan itself takes ten.',
    turns: [
      { who: 'A', text: 'My son fell off his bike and hit his head. He seems fine now, but he vomited once.' },
      { who: 'B', text: 'Head injury with vomiting ̶ the doctor should see him right away. Fill out this form, please.' },
      { who: 'A', text: 'Should he eat or drink anything?' },
      { who: 'B', text: 'Nothing until the CT scan, in case we need to do a procedure. Sips of water are OK if he\'s thirsty.' },
      { who: 'A', text: 'How long is the wait?' },
      { who: 'B', text: 'He\'s high priority, so about fifteen minutes. The scan itself takes ten.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL3_SET13: ListeningProblem = {
  id: 'q_el3_set13',
  category: '第13回 短い対話の内容一致（やや難）',
  readCount: 1,
  audioTracks: EL3_SET13_TRACKS,
  text: `第13回　第3問（6問・1回読み）　【難易度：やや難】

第3問では、2人の短い対話が1回だけ流れます。それぞれの問いの答えとして最も適切なものを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は1回読みなので、まずは1回で解き、答え合わせの前にもう一度だけ聞いて確かめてください。

【解き方のコツ】
音声が流れる前に「場面」と「Question」を読み、選択肢4つの違いを1語で言えるようにしておきます。1回読みでは、聞くべき1語が決まっているかどうかで勝負が決まります。

────────────────────
問1（話者：女性（客） / 男性（サポートセンター））
場面：家のインターネット回線の故障について電話している。
Question: What can we learn from the conversation?
① The technician will come in the morning.
② The woman must take a day off from work.
③ The repair will probably be free.
④ The woman will pay 8,000 yen.

────────────────────
問2（話者：女性（母親） / 男性（保育士））
場面：幼稚園のお遊戯会の衣装について話している。
Question: What does the mother need to prepare?
① A short-sleeved white shirt and named white gym shoes
② White gym shoes and dark pants with costumes
③ A long-sleeved white shirt
④ An animal costume

────────────────────
問3（話者：男性（大学生） / 女性（大学生））
場面：山登りの計画を天気予報を見ながら練り直している。
Question: Why did they choose Saturday?
① The festival is on Saturday.
② It will be sunny.
③ The ropeway will be running.
④ The hike is shorter on Saturday.

────────────────────
問4（話者：女性（店員・大学生） / 男性（店長））
場面：バイト先の店の閉店セールについて話している。
Question: What will the woman receive when the shop closes?
① Work during the cleanup days
② A job at the mall shop
③ Two extra weeks of pay
④ A closing sale discount

────────────────────
問5（話者：男性（客） / 女性（店員））
場面：家電の保証期間について話している。
Question: What will the man do?
① Register for the warranty online
② Buy a new washing machine
③ Get a free repair under warranty
④ Pay 12,000 yen for the repair

────────────────────
問6（話者：女性（母親） / 男性（受付））
場面：深夜の救急病院の受付で話している。
Question: What is the boy allowed to have before the scan?
① Nothing at all
② A light meal
③ Only his medicine
④ Small amounts of water`,
  subQuestions: [
    {
      id: 'q_el3_set13_1',
      label: '問1 What can we learn from the conversation?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 48,
      detailedExplanation: {
        theme: '午後の訪問を選択・在宅必要・外部ケーブルの故障なら無料→地域全体の故障なのでおそらく無料',
        type: '短い対話の内容一致型',
        difficulty: 4,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set13_2',
      label: '問2 What does the mother need to prepare?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 45,
      detailedExplanation: {
        theme: '衣装（動物コスチューム）は園が用意・白シャツは半袖で可・上履きに記名、という細かい条件の統合',
        type: '短い対話の内容一致型',
        difficulty: 4,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set13_3',
      label: '問3 Why did they choose Saturday?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 42,
      detailedExplanation: {
        theme: '日曜は晴れだが強風でロープウェイ運休の恐れ→曇りの土曜を選択',
        type: '短い対話の内容一致型',
        difficulty: 4,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set13_4',
      label: '問4 What will the woman receive when the shop closes?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 48,
      detailedExplanation: {
        theme: '正社員＝別店舗へ／パート＝2週間分の手当、という区別',
        type: '短い対話の内容一致型',
        difficulty: 4,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set13_5',
      label: '問5 What will the man do?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 45,
      detailedExplanation: {
        theme: '保証の条件（購入後1か月以内のオンライン登録）を満たさず有償→修理か買替かの比較で修理を選択',
        type: '短い対話の内容一致型',
        difficulty: 4,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set13_6',
      label: '問6 What is the boy allowed to have before the scan?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 42,
      detailedExplanation: {
        theme: '飲食禁止だが水は少量OK、という例外つきの指示',
        type: '短い対話の内容一致型',
        difficulty: 4,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
  ],
  explanation: `第13回（難易度：やや難）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ③
場面：家のインターネット回線の故障について電話している。
スクリプト：A: Our internet has been down since this morning. I've restarted the router twice.
B: There's a cable problem in your area. A technician can come tomorrow between nine and noon, or between one and five.
A: I work from home in the mornings, so the afternoon, please.
B: All right. Someone must be home during the visit. Also, there's no charge if the problem is with our outside cable.
A: And if it's inside my house?
B: Then it's 8,000 yen. But since the whole area is affected, it will most likely be free.
Question: What can we learn from the conversation?
正解の選択肢：The repair will probably be free.
午後の訪問を選択・在宅必要・外部ケーブルの故障なら無料→地域全体の故障なのでおそらく無料、という推論。What can we learn 型。

問2　正解は ①
場面：幼稚園のお遊戯会の衣装について話している。
スクリプト：A: What should the children wear for the play?
B: White shirts and dark pants. We provide the animal costumes here at the kindergarten.
A: My daughter has a white shirt, but it's short-sleeved. Is that all right?
B: Long sleeves are better because the costumes are sleeveless. But under the costume, short sleeves are fine.
A: What about shoes?
B: Everyone wears the same white gym shoes. Please write her name inside them.
Question: What does the mother need to prepare?
正解の選択肢：A short-sleeved white shirt and named white gym shoes
衣装（動物コスチューム）は園が用意・白シャツは半袖で可・上履きに記名、という細かい条件の統合。提供物と持参物の区別。

問3　正解は ③
場面：山登りの計画を天気予報を見ながら練り直している。
スクリプト：A: The forecast says Saturday will be cloudy, and Sunday sunny but windy at the summit.
B: Windy how?
A: Gusts up to 20 meters per second. The ropeway stops if it's over 15.
B: So on Sunday the ropeway might not run. What about hiking up?
A: It's a three-hour hike. Doable, but we'd be tired for the festival that evening.
B: Saturday it is, then. Cloudy is fine ̶ the ropeway will run, and we won't get sunburned.
Question: Why did they choose Saturday?
正解の選択肢：The ropeway will be running.
日曜は晴れだが強風でロープウェイ運休の恐れ→曇りの土曜を選択。天気の良さより運行条件を優先する推論が鍵。

問4　正解は ③
場面：バイト先の店の閉店セールについて話している。
スクリプト：A: I heard the shop is closing at the end of March. Is that true?
B: Yes. The building is being torn down. But we're having a closing sale all month.
A: Will the other shop in the mall hire the staff here?
B: They offered positions to full-time workers only. Part-timers like you get two extra weeks of pay instead.
A: That's fair. When's my last shift?
B: The 28th. The last two days are for cleanup ̶ full-time staff only.
Question: What will the woman receive when the shop closes?
正解の選択肢：Two extra weeks of pay
正社員＝別店舗へ／パート＝2週間分の手当、という区別。最終シフト（28日）と清掃日の詳細はひっかけ。身分による条件の違いが鍵。

問5　正解は ④
場面：家電の保証期間について話している。
スクリプト：A: This washing machine broke. I bought it here about two years ago.
B: Do you have the receipt? The standard warranty is one year, but this brand offers a free three-year warranty if you registered online within a month of purchase.
A: Registered? I don't think I did.
B: Then it's the one-year warranty, I'm afraid. The repair would cost about 12,000 yen.
A: Hmm. A new basic model is 45,000 yen... I'll pay for the repair. It's cheaper.
B: We'll pick it up on Thursday, then.
Question: What will the man do?
正解の選択肢：Pay 12,000 yen for the repair
保証の条件（購入後1か月以内のオンライン登録）を満たさず有償→修理か買替かの比較で修理を選択。条件の細かい聞き取り。

問6　正解は ④
場面：深夜の救急病院の受付で話している。
スクリプト：A: My son fell off his bike and hit his head. He seems fine now, but he vomited once.
B: Head injury with vomiting ̶ the doctor should see him right away. Fill out this form, please.
A: Should he eat or drink anything?
B: Nothing until the CT scan, in case we need to do a procedure. Sips of water are OK if he's thirsty.
A: How long is the wait?
B: He's high priority, so about fifteen minutes. The scan itself takes ten.
Question: What is the boy allowed to have before the scan?
正解の選択肢：Small amounts of water
飲食禁止だが水は少量OK、という例外つきの指示。優先度の高い患者＝待ち15分、という詳細も含む。例外表現（Sips of water are OK）が鍵。`,
  surroundingKnowledge: [
    '第3問は1回読み。音声が流れる前に場面と設問文を読み終えておくのが前提の大問である。',
    '設問文の疑問詞が答えの型を決める。How long → 期間、How much → 金額、What will 〜 do → 次の行動。',
    '数量・金額・時刻は「訂正」がつきもの。最初に聞こえた数字はダミーであることが多い。',
    'but / actually / instead / in total / on second thought の後ろに結論が来る。',
    '選択肢の誤りは「最初に出た数字」「別人の行動」「条件を満たさない案」のどれかに集約される。',
  ],
  deepDiveTopics: [
    '「先読み」を習慣にする。場面＋設問文＋選択肢の3点を10秒で読む練習を単独でやると効く。',
    '聞こえた単語がそのまま入っている選択肢はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。合意した内容が答えになる。',
  ],
};

const EL3_SET14_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el3_set14_1',
    audioUrl: '/listening_audio/el3_set14_q1.mp3',
    label: '問1',
    hint: '学校の補習授業の日程調整をしている。',
    script: 'A: You failed the math test, so you need to take the supplementary class.\nB: When is it?\nA: There are two sessions: Tuesday after school or Saturday morning. Same content.\nB: I have club activities after school on Tuesday. Saturday, please.\nA: Saturday\'s session is from nine to eleven in Room 204. Bring your test paper and a notebook.\nB: Do I have to retake the test?\nA: Yes, the following Monday during lunch break.',
    turns: [
      { who: 'A', text: 'You failed the math test, so you need to take the supplementary class.' },
      { who: 'B', text: 'When is it?' },
      { who: 'A', text: 'There are two sessions: Tuesday after school or Saturday morning. Same content.' },
      { who: 'B', text: 'I have club activities after school on Tuesday. Saturday, please.' },
      { who: 'A', text: 'Saturday\'s session is from nine to eleven in Room 204. Bring your test paper and a notebook.' },
      { who: 'B', text: 'Do I have to retake the test?' },
      { who: 'A', text: 'Yes, the following Monday during lunch break.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set14_2',
    audioUrl: '/listening_audio/el3_set14_q2.mp3',
    label: '問2',
    hint: '深夜バスの予約を変更している。',
    script: 'A: I booked the night bus to Sendai this Friday, but I need to change it to Saturday.\nB: Saturday\'s bus has only a few seats left ̶ in the back row.\nA: Back row... is it noisy?\nB: It\'s near the restroom, so some passengers walk by. The front seats are quieter but that day they\'re sold out.\nA: Hmm. What about the late Sunday bus?\nB: Sunday at 11 p.m. has front row seats available, same price.\nA: I\'ll take Sunday, front row, please.',
    turns: [
      { who: 'A', text: 'I booked the night bus to Sendai this Friday, but I need to change it to Saturday.' },
      { who: 'B', text: 'Saturday\'s bus has only a few seats left ̶ in the back row.' },
      { who: 'A', text: 'Back row... is it noisy?' },
      { who: 'B', text: 'It\'s near the restroom, so some passengers walk by. The front seats are quieter but that day they\'re sold out.' },
      { who: 'A', text: 'Hmm. What about the late Sunday bus?' },
      { who: 'B', text: 'Sunday at 11 p.m. has front row seats available, same price.' },
      { who: 'A', text: 'I\'ll take Sunday, front row, please.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set14_3',
    audioUrl: '/listening_audio/el3_set14_q3.mp3',
    label: '問3',
    hint: '植物の世話を引き受ける約束をしている。',
    script: 'A: Could you water my plants while I\'m abroad? I\'ll be gone for ten days from the third.\nB: Sure. How often?\nA: The ones in the living room need water every two days. The cactus on the balcony, only once a week.\nB: Every two days for the indoor ones, once for the cactus. Anything else?\nA: Please collect the mail, too. And if any package comes, just keep it inside your place.\nB: No problem. Leave me the key under the mat?\nA: I\'d rather hand it to you directly the day before I leave.',
    turns: [
      { who: 'A', text: 'Could you water my plants while I\'m abroad? I\'ll be gone for ten days from the third.' },
      { who: 'B', text: 'Sure. How often?' },
      { who: 'A', text: 'The ones in the living room need water every two days. The cactus on the balcony, only once a week.' },
      { who: 'B', text: 'Every two days for the indoor ones, once for the cactus. Anything else?' },
      { who: 'A', text: 'Please collect the mail, too. And if any package comes, just keep it inside your place.' },
      { who: 'B', text: 'No problem. Leave me the key under the mat?' },
      { who: 'A', text: 'I\'d rather hand it to you directly the day before I leave.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set14_4',
    audioUrl: '/listening_audio/el3_set14_q4.mp3',
    label: '問4',
    hint: '図書館の規則の変更について説明を受けている。',
    script: 'A: I heard the borrowing rules changed.\nB: Yes. Starting this month, you can borrow up to eight books instead of five.\nA: That\'s great. How long can I keep them?\nB: Still two weeks, but now you can renew twice online. It used to be once, in person only.\nA: Wonderful. Are DVDs the same?\nB: No. DVDs are still three items for one week, and no renewals.',
    turns: [
      { who: 'A', text: 'I heard the borrowing rules changed.' },
      { who: 'B', text: 'Yes. Starting this month, you can borrow up to eight books instead of five.' },
      { who: 'A', text: 'That\'s great. How long can I keep them?' },
      { who: 'B', text: 'Still two weeks, but now you can renew twice online. It used to be once, in person only.' },
      { who: 'A', text: 'Wonderful. Are DVDs the same?' },
      { who: 'B', text: 'No. DVDs are still three items for one week, and no renewals.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set14_5',
    audioUrl: '/listening_audio/el3_set14_q5.mp3',
    label: '問5',
    hint: '体育祭のリレーの選手順を決めている。',
    script: 'A: For the relay, I\'ll run first, then Yuki, then Tomo, and you\'re the anchor.\nB: Me, last? But Tomo is faster than me.\nA: Tomo twisted his ankle yesterday. He can run, but not at full speed, so the middle is safer.\nB: Makes sense. But honestly, I\'m nervous as the anchor.\nA: You\'ll be fine. If we\'re leading by the third runner, just keep the pace.\nB: OK. I\'ll do my best.',
    turns: [
      { who: 'A', text: 'For the relay, I\'ll run first, then Yuki, then Tomo, and you\'re the anchor.' },
      { who: 'B', text: 'Me, last? But Tomo is faster than me.' },
      { who: 'A', text: 'Tomo twisted his ankle yesterday. He can run, but not at full speed, so the middle is safer.' },
      { who: 'B', text: 'Makes sense. But honestly, I\'m nervous as the anchor.' },
      { who: 'A', text: 'You\'ll be fine. If we\'re leading by the third runner, just keep the pace.' },
      { who: 'B', text: 'OK. I\'ll do my best.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set14_6',
    audioUrl: '/listening_audio/el3_set14_q6.mp3',
    label: '問6',
    hint: 'デジカメの修理の見積もりについて話している。',
    script: 'A: My camera won\'t turn on. Can you fix it?\nB: Let me see... It\'s the battery connector. The repair is 6,000 yen, and a new battery is 4,000 yen if yours is worn out.\nA: Is my battery worn out?\nB: No, it\'s fine. So just 6,000 yen. It\'ll take three days.\nA: That\'s faster than I expected. I have a trip on the 15th. Today\'s the 10th ̶ will it make it?\nB: Pick it up on the 13th. One day to spare.',
    turns: [
      { who: 'A', text: 'My camera won\'t turn on. Can you fix it?' },
      { who: 'B', text: 'Let me see... It\'s the battery connector. The repair is 6,000 yen, and a new battery is 4,000 yen if yours is worn out.' },
      { who: 'A', text: 'Is my battery worn out?' },
      { who: 'B', text: 'No, it\'s fine. So just 6,000 yen. It\'ll take three days.' },
      { who: 'A', text: 'That\'s faster than I expected. I have a trip on the 15th. Today\'s the 10th ̶ will it make it?' },
      { who: 'B', text: 'Pick it up on the 13th. One day to spare.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL3_SET14: ListeningProblem = {
  id: 'q_el3_set14',
  category: '第14回 短い対話の内容一致（標準）',
  readCount: 1,
  audioTracks: EL3_SET14_TRACKS,
  text: `第14回　第3問（6問・1回読み）　【難易度：標準】

第3問では、2人の短い対話が1回だけ流れます。それぞれの問いの答えとして最も適切なものを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は1回読みなので、まずは1回で解き、答え合わせの前にもう一度だけ聞いて確かめてください。

【解き方のコツ】
音声が流れる前に「場面」と「Question」を読み、選択肢4つの違いを1語で言えるようにしておきます。1回読みでは、聞くべき1語が決まっているかどうかで勝負が決まります。

────────────────────
問1（話者：男性（先生） / 男性（生徒））
場面：学校の補習授業の日程調整をしている。
Question: What should the boy bring on Saturday?
① His club equipment
② A new textbook
③ His test paper and a notebook
④ Lunch

────────────────────
問2（話者：男性（乗客） / 女性（バス会社スタッフ））
場面：深夜バスの予約を変更している。
Question: Which seat did the man book?
① Friday, back row
② Saturday, back row
③ Sunday, front row
④ Saturday, front row

────────────────────
問3（話者：女性（隣人） / 男性（隣人））
場面：植物の世話を引き受ける約束をしている。
Question: How will the woman give the key to the man?
① Give it to his wife
② Leave it under the mat
③ Mail it to him
④ Hand it to him directly

────────────────────
問4（話者：男性（利用者） / 女性（司書））
場面：図書館の規則の変更について説明を受けている。
Question: What is true about the new rules?
① DVDs can now be renewed online.
② Up to eight books can be borrowed.
③ The borrowing period became longer.
④ All items can be renewed twice.

────────────────────
問5（話者：女性（キャプテン） / 男性（部員））
場面：体育祭のリレーの選手順を決めている。
Question: Why is Tomo in the middle of the relay order?
① He asked to run in the middle.
② His ankle is not fully healed.
③ He is nervous about running last.
④ He is the fastest runner.

────────────────────
問6（話者：男性（客） / 女性（修理店員））
場面：デジカメの修理の見積もりについて話している。
Question: How much will the repair cost?
① 4,000 yen
② 6,000 yen
③ 10,000 yen
④ Nothing, it's under warranty`,
  subQuestions: [
    {
      id: 'q_el3_set14_1',
      label: '問1 What should the boy bring on Saturday?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: '火曜（部活で不可）→土曜午前を選択',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set14_2',
      label: '問2 Which seat did the man book?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '曜日変更（金→土→日）と座席（後方・トイレ近く vs前方静か）のトレードオフ',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set14_3',
      label: '問3 How will the woman give the key to the man?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '水やりの頻度（2日ごと／週1回）の詳細が並ぶが、設問は鍵の受け渡し方法',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set14_4',
      label: '問4 What is true about the new rules?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: '変更点（冊数5→8・更新2回オンライン可）と変更なし（貸出期間2週間・DVD規則）の混在',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set14_5',
      label: '問5 Why is Tomo in the middle of the relay order?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '速いのに最終走者でない理由（足首を捻挫し完走は可能だが本調子ではない）',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set14_6',
      label: '問6 How much will the repair cost?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: 'コネクタ修理6,000円のみ（バッテリは劣化していないので不要）',
        type: '短い対話の内容一致型',
        difficulty: 3,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
  ],
  explanation: `第14回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ③
場面：学校の補習授業の日程調整をしている。
スクリプト：A: You failed the math test, so you need to take the supplementary class.
B: When is it?
A: There are two sessions: Tuesday after school or Saturday morning. Same content.
B: I have club activities after school on Tuesday. Saturday, please.
A: Saturday's session is from nine to eleven in Room 204. Bring your test paper and a notebook.
B: Do I have to retake the test?
A: Yes, the following Monday during lunch break.
Question: What should the boy bring on Saturday?
正解の選択肢：His test paper and a notebook
火曜（部活で不可）→土曜午前を選択。持ち物（テスト用紙とノート）が設問の対象。再テストの日程はダミー詳細。

問2　正解は ③
場面：深夜バスの予約を変更している。
スクリプト：A: I booked the night bus to Sendai this Friday, but I need to change it to Saturday.
B: Saturday's bus has only a few seats left ̶ in the back row.
A: Back row... is it noisy?
B: It's near the restroom, so some passengers walk by. The front seats are quieter but that day they're sold out.
A: Hmm. What about the late Sunday bus?
B: Sunday at 11 p.m. has front row seats available, same price.
A: I'll take Sunday, front row, please.
Question: Which seat did the man book?
正解の選択肢：Sunday, front row
曜日変更（金→土→日）と座席（後方・トイレ近く vs前方静か）のトレードオフ。最終的な組み合わせが正解。売り切れ情報が消去の材料。

問3　正解は ④
場面：植物の世話を引き受ける約束をしている。
スクリプト：A: Could you water my plants while I'm abroad? I'll be gone for ten days from the third.
B: Sure. How often?
A: The ones in the living room need water every two days. The cactus on the balcony, only once a week.
B: Every two days for the indoor ones, once for the cactus. Anything else?
A: Please collect the mail, too. And if any package comes, just keep it inside your place.
B: No problem. Leave me the key under the mat?
A: I'd rather hand it to you directly the day before I leave.
Question: How will the woman give the key to the man?
正解の選択肢：Hand it to him directly
水やりの頻度（2日ごと／週1回）の詳細が並ぶが、設問は鍵の受け渡し方法。I'd rather〜の希望が結論。詳細の中から設問に対応する情報だけ拾う練習。

問4　正解は ②
場面：図書館の規則の変更について説明を受けている。
スクリプト：A: I heard the borrowing rules changed.
B: Yes. Starting this month, you can borrow up to eight books instead of five.
A: That's great. How long can I keep them?
B: Still two weeks, but now you can renew twice online. It used to be once, in person only.
A: Wonderful. Are DVDs the same?
B: No. DVDs are still three items for one week, and no renewals.
Question: What is true about the new rules?
正解の選択肢：Up to eight books can be borrowed.
変更点（冊数5→8・更新2回オンライン可）と変更なし（貸出期間2週間・DVD規則）の混在。What is true 型で全文の照合が必要。

問5　正解は ②
場面：体育祭のリレーの選手順を決めている。
スクリプト：A: For the relay, I'll run first, then Yuki, then Tomo, and you're the anchor.
B: Me, last? But Tomo is faster than me.
A: Tomo twisted his ankle yesterday. He can run, but not at full speed, so the middle is safer.
B: Makes sense. But honestly, I'm nervous as the anchor.
A: You'll be fine. If we're leading by the third runner, just keep the pace.
B: OK. I'll do my best.
Question: Why is Tomo in the middle of the relay order?
正解の選択肢：His ankle is not fully healed.
速いのに最終走者でない理由（足首を捻挫し完走は可能だが本調子ではない）。Why型の理由推論。表層の速さ情報がひっかけ。

問6　正解は ②
場面：デジカメの修理の見積もりについて話している。
スクリプト：A: My camera won't turn on. Can you fix it?
B: Let me see... It's the battery connector. The repair is 6,000 yen, and a new battery is 4,000 yen if yours is worn out.
A: Is my battery worn out?
B: No, it's fine. So just 6,000 yen. It'll take three days.
A: That's faster than I expected. I have a trip on the 15th. Today's the 10th ̶ will it make it?
B: Pick it up on the 13th. One day to spare.
Question: How much will the repair cost?
正解の選択肢：6,000 yen
コネクタ修理6,000円のみ（バッテリは劣化していないので不要）。合計1万円がひっかけ。部品の要否の確認が鍵。`,
  surroundingKnowledge: [
    '第3問は1回読み。音声が流れる前に場面と設問文を読み終えておくのが前提の大問である。',
    '設問文の疑問詞が答えの型を決める。How long → 期間、How much → 金額、What will 〜 do → 次の行動。',
    '数量・金額・時刻は「訂正」がつきもの。最初に聞こえた数字はダミーであることが多い。',
    'but / actually / instead / in total / on second thought の後ろに結論が来る。',
    '選択肢の誤りは「最初に出た数字」「別人の行動」「条件を満たさない案」のどれかに集約される。',
  ],
  deepDiveTopics: [
    '「先読み」を習慣にする。場面＋設問文＋選択肢の3点を10秒で読む練習を単独でやると効く。',
    '聞こえた単語がそのまま入っている選択肢はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。合意した内容が答えになる。',
  ],
};

const EL3_SET15_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el3_set15_1',
    audioUrl: '/listening_audio/el3_set15_q1.mp3',
    label: '問1',
    hint: '昼食の場所を決めている。',
    script: 'A: Where do you want to eat lunch today?\nB: The cafeteria is closed for cleaning. Let\'s buy something at the convenience store.\nA: There\'s a new sandwich shop near the station, too.\nB: That place is expensive. Convenience store is fine ̶ we can eat in the park.\nA: Good idea. It\'s sunny today.',
    turns: [
      { who: 'A', text: 'Where do you want to eat lunch today?' },
      { who: 'B', text: 'The cafeteria is closed for cleaning. Let\'s buy something at the convenience store.' },
      { who: 'A', text: 'There\'s a new sandwich shop near the station, too.' },
      { who: 'B', text: 'That place is expensive. Convenience store is fine ̶ we can eat in the park.' },
      { who: 'A', text: 'Good idea. It\'s sunny today.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set15_2',
    audioUrl: '/listening_audio/el3_set15_q2.mp3',
    label: '問2',
    hint: '忘れ物の傘を届けている。',
    script: 'A: Excuse me, someone left this umbrella in Classroom 2-B.\nB: Thanks. Do you know whose it is?\nA: There was a name tag on it, but it was too faded to read.\nB: OK. I\'ll keep it at the office. If no one claims it in a month, we give unclaimed items to the student council\'s reuse sale.\nA: A reuse sale?\nB: Yes, they sell lost items cheaply and use the money for school events.',
    turns: [
      { who: 'A', text: 'Excuse me, someone left this umbrella in Classroom 2-B.' },
      { who: 'B', text: 'Thanks. Do you know whose it is?' },
      { who: 'A', text: 'There was a name tag on it, but it was too faded to read.' },
      { who: 'B', text: 'OK. I\'ll keep it at the office. If no one claims it in a month, we give unclaimed items to the student council\'s reuse sale.' },
      { who: 'A', text: 'A reuse sale?' },
      { who: 'B', text: 'Yes, they sell lost items cheaply and use the money for school events.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set15_3',
    audioUrl: '/listening_audio/el3_set15_q3.mp3',
    label: '問3',
    hint: '週末のゴルフ練習の予定を立てている。',
    script: 'A: Want to practice golf this weekend?\nB: The outdoor range is closed on Saturdays now. Sundays only.\nA: How about the indoor range near the office? It\'s open every day.\nB: Weekday evenings are too crowded. Let\'s go there Saturday morning ̶ it\'s empty before ten.\nA: Wait, you said Saturday is closed...\nB: The outdoor one is. The indoor one is open Saturday.',
    turns: [
      { who: 'A', text: 'Want to practice golf this weekend?' },
      { who: 'B', text: 'The outdoor range is closed on Saturdays now. Sundays only.' },
      { who: 'A', text: 'How about the indoor range near the office? It\'s open every day.' },
      { who: 'B', text: 'Weekday evenings are too crowded. Let\'s go there Saturday morning ̶ it\'s empty before ten.' },
      { who: 'A', text: 'Wait, you said Saturday is closed...' },
      { who: 'B', text: 'The outdoor one is. The indoor one is open Saturday.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set15_4',
    audioUrl: '/listening_audio/el3_set15_q4.mp3',
    label: '問4',
    hint: '犬の散歩の代行を頼んでいる。',
    script: 'A: I\'m stuck at work late today. Can you walk Choco?\nB: Sure. Just the usual route around the park?\nA: Yes, but avoid the north gate ̶ there\'s construction today.\nB: How long should I walk him?\nA: Thirty minutes is fine. And take the small towel by the door ̶ wipe his paws before coming in.\nB: Got it. Walk, wipe, done.',
    turns: [
      { who: 'A', text: 'I\'m stuck at work late today. Can you walk Choco?' },
      { who: 'B', text: 'Sure. Just the usual route around the park?' },
      { who: 'A', text: 'Yes, but avoid the north gate ̶ there\'s construction today.' },
      { who: 'B', text: 'How long should I walk him?' },
      { who: 'A', text: 'Thirty minutes is fine. And take the small towel by the door ̶ wipe his paws before coming in.' },
      { who: 'B', text: 'Got it. Walk, wipe, done.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set15_5',
    audioUrl: '/listening_audio/el3_set15_q5.mp3',
    label: '問5',
    hint: '新しいアルバイトの研修日を確認している。',
    script: 'A: Your training starts next Monday. Can you come at three?\nB: School ends at three thirty on Mondays. I can be there by four.\nA: OK, four then. The training is about two hours ̶ we\'ll go over the register and cleaning.\nB: Do I get paid for training?\nA: Yes, same hourly rate. And wear something you can move in ̶ no uniform needed that day.',
    turns: [
      { who: 'A', text: 'Your training starts next Monday. Can you come at three?' },
      { who: 'B', text: 'School ends at three thirty on Mondays. I can be there by four.' },
      { who: 'A', text: 'OK, four then. The training is about two hours ̶ we\'ll go over the register and cleaning.' },
      { who: 'B', text: 'Do I get paid for training?' },
      { who: 'A', text: 'Yes, same hourly rate. And wear something you can move in ̶ no uniform needed that day.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el3_set15_6',
    audioUrl: '/listening_audio/el3_set15_q6.mp3',
    label: '問6',
    hint: '文化祭のチケット販売について話している。',
    script: 'A: How are ticket sales?\nB: We sold 120 tickets yesterday and 80 today so far.\nA: The hall holds 300 people. We\'re selling tickets for two days, so...\nB: We still have 100 left for this afternoon and tomorrow morning.\nA: Let\'s announce it in the group chat so everyone knows they can still buy.\nB: Good idea. I\'ll write the message now.',
    turns: [
      { who: 'A', text: 'How are ticket sales?' },
      { who: 'B', text: 'We sold 120 tickets yesterday and 80 today so far.' },
      { who: 'A', text: 'The hall holds 300 people. We\'re selling tickets for two days, so...' },
      { who: 'B', text: 'We still have 100 left for this afternoon and tomorrow morning.' },
      { who: 'A', text: 'Let\'s announce it in the group chat so everyone knows they can still buy.' },
      { who: 'B', text: 'Good idea. I\'ll write the message now.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL3_SET15: ListeningProblem = {
  id: 'q_el3_set15',
  category: '第15回 短い対話の内容一致（易しめ）',
  readCount: 1,
  audioTracks: EL3_SET15_TRACKS,
  text: `第15回　第3問（6問・1回読み）　【難易度：易しめ】

第3問では、2人の短い対話が1回だけ流れます。それぞれの問いの答えとして最も適切なものを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は1回読みなので、まずは1回で解き、答え合わせの前にもう一度だけ聞いて確かめてください。

【解き方のコツ】
音声が流れる前に「場面」と「Question」を読み、選択肢4つの違いを1語で言えるようにしておきます。1回読みでは、聞くべき1語が決まっているかどうかで勝負が決まります。

────────────────────
問1（話者：女性（高校生） / 男性（高校生））
場面：昼食の場所を決めている。
Question: Where will they have lunch?
① At the sandwich shop
② At the convenience store
③ At the cafeteria
④ In the park

────────────────────
問2（話者：男性（生徒） / 女性（事務員））
場面：忘れ物の傘を届けている。
Question: What happens to the umbrella if nobody claims it?
① It is sold at a reuse sale.
② It is returned to Classroom 2-B.
③ It is thrown away.
④ It is kept at the office forever.

────────────────────
問3（話者：男性（会社員） / 女性（同僚））
場面：週末のゴルフ練習の予定を立てている。
Question: When and where will they practice?
① Saturday at the outdoor range
② Sunday at the outdoor range
③ Saturday morning at the indoor range
④ Weekday evening at the indoor range

────────────────────
問4（話者：女性（依頼者） / 男性（高校生の息子））
場面：犬の散歩の代行を頼んでいる。
Question: What should the boy avoid today?
① The small towel
② The construction worker
③ The north gate
④ The park

────────────────────
問5（話者：女性（高校生） / 男性（店長））
場面：新しいアルバイトの研修日を確認している。
Question: What should the girl wear on Monday?
① The uniform
② Her school uniform
③ Comfortable clothes
④ Formal clothes

────────────────────
問6（話者：男性（実行委員） / 女性（実行委員））
場面：文化祭のチケット販売について話している。
Question: How many tickets have been sold so far?
① 100
② 200
③ 300
④ 400`,
  subQuestions: [
    {
      id: 'q_el3_set15_1',
      label: '問1 Where will they have lunch?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 70,
      detailedExplanation: {
        theme: '買う場所（コンビニ）と食べる場所（公園）の区別が鍵',
        type: '短い対話の内容一致型',
        difficulty: 2,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set15_2',
      label: '問2 What happens to the umbrella if nobody claims it?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 67,
      detailedExplanation: {
        theme: '拾得物の行方の流れ（事務室で1か月保管→リユースセールへ）',
        type: '短い対話の内容一致型',
        difficulty: 2,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set15_3',
      label: '問3 When and where will they practice?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 64,
      detailedExplanation: {
        theme: '2つの練習場（屋外＝日曜のみ／屋内＝毎日）の営業情報の整理と',
        type: '短い対話の内容一致型',
        difficulty: 2,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set15_4',
      label: '問4 What should the boy avoid today?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 70,
      detailedExplanation: {
        theme: 'avoid the north gate（工事のため）が核心',
        type: '短い対話の内容一致型',
        difficulty: 2,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set15_5',
      label: '問5 What should the girl wear on Monday?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 67,
      detailedExplanation: {
        theme: 'wear something you can move in（動きやすい服装）＝制服不要',
        type: '短い対話の内容一致型',
        difficulty: 2,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
    {
      id: 'q_el3_set15_6',
      label: '問6 How many tickets have been sold so far?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 64,
      detailedExplanation: {
        theme: '120＋80＝200枚が販売済み',
        type: '短い対話の内容一致型',
        difficulty: 2,
        steps: [
          '① 音声の前に、場面（日本語）と設問文（英語）を先に読んで「何を聞き取るか」を1つに絞る',
          '② 選択肢を見比べ、違いの軸（数量・時刻・人・場所・行動）を1語で言語化する',
          '③ 1回読みなので、その軸に関わる部分だけを狙って聞く（全部を訳そうとしない）',
          '④ 最後の発話で条件が覆ることが多い。but / actually / instead / in total の後ろを確認する',
        ],
      },
    },
  ],
  explanation: `第15回（難易度：易しめ）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ④
場面：昼食の場所を決めている。
スクリプト：A: Where do you want to eat lunch today?
B: The cafeteria is closed for cleaning. Let's buy something at the convenience store.
A: There's a new sandwich shop near the station, too.
B: That place is expensive. Convenience store is fine ̶ we can eat in the park.
A: Good idea. It's sunny today.
Question: Where will they have lunch?
正解の選択肢：In the park
買う場所（コンビニ）と食べる場所（公園）の区別が鍵。設問 Where will they have lunch?は食べる場所。近視眼的に店名を選ばせない構成。

問2　正解は ①
場面：忘れ物の傘を届けている。
スクリプト：A: Excuse me, someone left this umbrella in Classroom 2-B.
B: Thanks. Do you know whose it is?
A: There was a name tag on it, but it was too faded to read.
B: OK. I'll keep it at the office. If no one claims it in a month, we give unclaimed items to the student council's reuse sale.
A: A reuse sale?
B: Yes, they sell lost items cheaply and use the money for school events.
Question: What happens to the umbrella if nobody claims it?
正解の選択肢：It is sold at a reuse sale.
拾得物の行方の流れ（事務室で1か月保管→リユースセールへ）。手順の順序理解。

問3　正解は ③
場面：週末のゴルフ練習の予定を立てている。
スクリプト：A: Want to practice golf this weekend?
B: The outdoor range is closed on Saturdays now. Sundays only.
A: How about the indoor range near the office? It's open every day.
B: Weekday evenings are too crowded. Let's go there Saturday morning ̶ it's empty before ten.
A: Wait, you said Saturday is closed...
B: The outdoor one is. The indoor one is open Saturday.
Question: When and where will they practice?
正解の選択肢：Saturday morning at the indoor range
2つの練習場（屋外＝日曜のみ／屋内＝毎日）の営業情報の整理と、会話中の確認（Wait, you said〜）への訂正対応。

問4　正解は ③
場面：犬の散歩の代行を頼んでいる。
スクリプト：A: I'm stuck at work late today. Can you walk Choco?
B: Sure. Just the usual route around the park?
A: Yes, but avoid the north gate ̶ there's construction today.
B: How long should I walk him?
A: Thirty minutes is fine. And take the small towel by the door ̶ wipe his paws before coming in.
B: Got it. Walk, wipe, done.
Question: What should the boy avoid today?
正解の選択肢：The north gate
avoid the north gate（工事のため）が核心。30分・足を拭く、の詳細は実行内容。avoidの対象を問う。

問5　正解は ③
場面：新しいアルバイトの研修日を確認している。
スクリプト：A: Your training starts next Monday. Can you come at three?
B: School ends at three thirty on Mondays. I can be there by four.
A: OK, four then. The training is about two hours ̶ we'll go over the register and cleaning.
B: Do I get paid for training?
A: Yes, same hourly rate. And wear something you can move in ̶ no uniform needed that day.
Question: What should the girl wear on Monday?
正解の選択肢：Comfortable clothes
wear something you can move in（動きやすい服装）＝制服不要。no uniform needed の否定が鍵。

問6　正解は ②
場面：文化祭のチケット販売について話している。
スクリプト：A: How are ticket sales?
B: We sold 120 tickets yesterday and 80 today so far.
A: The hall holds 300 people. We're selling tickets for two days, so...
B: We still have 100 left for this afternoon and tomorrow morning.
A: Let's announce it in the group chat so everyone knows they can still buy.
B: Good idea. I'll write the message now.
Question: How many tickets have been sold so far?
正解の選択肢：200
120＋80＝200枚が販売済み。残り100枚は未販売。定員300との関係で soldを問われている点に注意（100を選ばせない）。`,
  surroundingKnowledge: [
    '第3問は1回読み。音声が流れる前に場面と設問文を読み終えておくのが前提の大問である。',
    '設問文の疑問詞が答えの型を決める。How long → 期間、How much → 金額、What will 〜 do → 次の行動。',
    '数量・金額・時刻は「訂正」がつきもの。最初に聞こえた数字はダミーであることが多い。',
    'but / actually / instead / in total / on second thought の後ろに結論が来る。',
    '選択肢の誤りは「最初に出た数字」「別人の行動」「条件を満たさない案」のどれかに集約される。',
  ],
  deepDiveTopics: [
    '「先読み」を習慣にする。場面＋設問文＋選択肢の3点を10秒で読む練習を単独でやると効く。',
    '聞こえた単語がそのまま入っている選択肢はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。合意した内容が答えになる。',
  ],
};

/** 第3問の演習セット一覧（PDF 15セット＝第1回〜第15回・各6問）。 */
export const EL3_PROBLEMS: ListeningProblem[] = [
  EL3_SET1,
  EL3_SET2,
  EL3_SET3,
  EL3_SET4,
  EL3_SET5,
  EL3_SET6,
  EL3_SET7,
  EL3_SET8,
  EL3_SET9,
  EL3_SET10,
  EL3_SET11,
  EL3_SET12,
  EL3_SET13,
  EL3_SET14,
  EL3_SET15,
];
