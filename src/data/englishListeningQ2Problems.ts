/**
 * ===================================================================
 * 英語リスニング 第2問 ― 類題集（イラストが揃った回から順次公開）
 * ===================================================================
 *
 * 出典
 *   配布 PDF「共通テスト_英語リスニング_第2問_類題集_15セット_改訂版v2.pdf」。
 *   場面説明（日本語）・話者・設問文（英語）・対話スクリプト・解説は
 *   すべて PDF の原文どおり。
 *
 *   ※ PDF の表紙は「全15セット・45問」だが、中身は第16セットまであり
 *     48問収録されている。表紙の数字ではなく実データに合わせて16セット
 *     （第1回〜第16回）として扱っている。
 *
 * ★なぜ全 48 問ではなく順次公開なのか★
 *   第2問は「絵を選ぶ」大問なので、イラストのない問は原理的に解けない。
 *   配布 PDF「第２問.pdf」から実物のイラストが取れた問を
 *   絵の1マスずつ拡大して選択肢の文言と突き合わせ、
 *   絵と選択肢が完全に一致した問だけを先に公開している。
 *   残りはイラストを用意できたところで追加する。
 *   セット番号・問番号は PDF 原文のまま保ち、詰め直していない
 *   （詰め直すと、後日追加したときに既存の学習記録の ID が
 *     別の問を指してしまう）。
 *
 * 生成方法（手打ちしていない理由）
 *   48問＝選択肢192個・対話192発話・画像プロンプト48本を手で書き写すと、
 *   選択肢と正解の対応ズレが必ず混入する。そこで
 *     scripts/listening-data/parse_listening_q2_pdf.py        … PDF → JSON（突き合わせ検査つき）
 *     scripts/listening-data/shuffle_listening_q2_options.py  … 正解位置の偏りを均す
 *     scripts/listening-data/gen_listening_q2_data.py         … JSON → このファイル
 *   の3段で機械的に生成している。
 *
 * 正解位置について
 *   PDF 原文のままだと正解が ①13問 / ②21問 / ③9問 / ④5問 と偏っており、
 *   「②を塗れば 44% 当たる」状態になる。音を聞かずに点が取れると
 *   リスニングの練習にならないため、選択肢の**並び順だけ**を入れ替えて
 *   偏りを均す仕組みを入れている。
 *
 *   ただしこのファイルに収録した問は「実物のイラストを使う問」で、
 *   絵の各マスの左上に ①②③④ が★絵として焼き込まれている★
 *   （実測：マス左上22%の領域の暗ピクセル率≈10%、その右隣の帯≈0.3%）。
 *   並べ替えると番号ごと動いて答えが消えるので、この分は
 *   PDF 原文の並びで固定している。
 *
 *   ★実物イラストを使う問が増えるほど、並べ替えで均せる余地は減る。★
 *   32問を実物イラストで公開した時点の実測値は下の「正解位置の実測」を参照。
 *   ②が多いのは PDF 原文の偏りがそのまま残っているためで、
 *   イラストを自前生成に置き換えた問だけが並べ替えの対象になる。
 *
 *   なお「1枚の図の中に①〜④が配置される型」は、①〜④が図の中の
 *   どこを指すかが1つの文に溶けているため、機械的に入れ替えると絵が壊れる。
 *   この型は原文の並びのまま固定し、並べ替え可能な2×2型で全体を均している。
 *
 * 正解位置の実測（このファイルに収録した分だけを数えた値）
 *   ①11問 / ②20問 / ③11問 / ④6問（計 48問）。最頻位置だけ塗った場合の正答率 42%。
 *   実物イラストの問は並べ替えられないため、この偏りは
 *   PDF 原文の偏りがそのまま出たもの。自前生成の絵に
 *   置き換えた問から順に均していく。
 *
 * 第1問B・第3問との作りの違い
 *   ・2回読み（readCount: 2）。第1問B と同じ。第3問は1回読み。
 *   ・選択肢は「絵」なので options はマーク（①〜④）のみを持ち、
 *     判断材料は imageUrl のイラストになる（第1問B と同じ設計）。
 *   ・音源が「2人の対話」なので audioTracks に turns（発話列）を持つ。
 *     ListeningAudioPlayer が話者ごとに別の声を割り当てて読み上げるため、
 *     どこで話者が替わったかが耳で分かる。1つの声で通して読むと
 *     「the man は何を買うか」型の設問が原理的に解けなくなる。
 *
 * 話者記号（W / M / K / S / F / D）について
 *   PDF のスクリプトの記号をそのまま残している。基本は W=女性・M=男性 だが、
 *   第1セット問2・第8セット問1・第10セット問2 では M が「母親」を指す。
 *   機械的に性別へ置き換えると4問で嘘になるため、記号は原文どおりとし、
 *   誰と誰の対話かは各問の「話者：」欄で伝えている。
 *
 * 音源について
 *   この類題集には MP3 が付属しない。そこで audioUrl を持たせず、
 *   ListeningAudioPlayer 側でブラウザの音声合成（SpeechSynthesis）に
 *   フォールバックして turns を読み上げる。MP3 を用意したら
 *   audioUrl を埋めるだけで実音源に切り替わる。
 *
 * 選択肢の日本語説明の置き場所
 *   本番の第2問は「絵だけ」を見て選ぶ。PDF には各選択肢のイラスト内容が
 *   日本語で書かれているが、これを問題文に並べると「絵を読み取る」練習に
 *   ならないため、問題文には出さず答え合わせ（解説）側に置いている。
 */

import type { ListeningAudioTrack, ListeningProblem } from './englishListeningQ1AProblems';

/** 解答チップはマークのみ（判断材料はイラスト）。 */
const MARK_OPTIONS = ['①', '②', '③', '④'];


const EL2_SET1_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el2_set1_1',
    label: '問1',
    hint: '男女がカフェで注文について話している。（話者：女性（店員） / 男性（客））',
    audioUrl: '/listening_audio/el2_set1_q1.mp3',
    script: 'W: Would you like anything to drink with your sandwich?\nM: I\'ll have coffee, please. No sugar, but with milk.\nW: Ice or hot?\nM: Hot, please.',
    turns: [
      { who: 'W', text: 'Would you like anything to drink with your sandwich?' },
      { who: 'M', text: 'I\'ll have coffee, please. No sugar, but with milk.' },
      { who: 'W', text: 'Ice or hot?' },
      { who: 'M', text: 'Hot, please.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set1_2',
    label: '問2',
    hint: '母と息子が息子の部屋の片付けについて話している。（話者：母親 / 息子（高校生））',
    audioUrl: '/listening_audio/el2_set1_q2.mp3',
    script: 'M: Ken, please put your books on the shelf.\nK: OK. On the top shelf?\nM: No, the middle one. The top is for the photo albums.\nK: Got it.',
    turns: [
      { who: 'M', text: 'Ken, please put your books on the shelf.' },
      { who: 'K', text: 'OK. On the top shelf?' },
      { who: 'M', text: 'No, the middle one. The top is for the photo albums.' },
      { who: 'K', text: 'Got it.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set1_3',
    label: '問3',
    hint: '店員と客が服のサイズについて話している。（話者：女性（客） / 男性（店員））',
    audioUrl: '/listening_audio/el2_set1_q3.mp3',
    script: 'W: Do you have this shirt in a smaller size?\nM: We have small and extra-small. Which would you like?\nW: Small, please. And in blue if possible.\nM: Sure, here\'s a small blue one.',
    turns: [
      { who: 'W', text: 'Do you have this shirt in a smaller size?' },
      { who: 'M', text: 'We have small and extra-small. Which would you like?' },
      { who: 'W', text: 'Small, please. And in blue if possible.' },
      { who: 'M', text: 'Sure, here\'s a small blue one.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL2_SET1: ListeningProblem = {
  id: 'q_el2_set1',
  category: '第1回 対話に合うイラストを選ぶ（易しめ）',
  readCount: 2,
  audioTracks: EL2_SET1_TRACKS,
  text: `第1回　第2問（3問・2回読み）　【難易度：易しめ】

第2問では、2人の短い対話と英語の設問が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は2回読みなので、まずは2回だけ聞いて答えを決めてください。

【解き方のコツ】
音声が流れる前に「場面」を読み、4枚の絵を見比べて「どこが違うか」を1語で言えるようにしておきます（色・数・位置・あり／なし）。違いが分かっていれば、聞き取るべき1語が決まります。第2問は「No, actually …」「the other one」のような訂正が最頻出なので、最初に聞こえた候補で決めないことが大切です。

────────────────────
問1（話者：女性（店員） / 男性（客））
場面：男女がカフェで注文について話している。
Question: What will the man drink?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問2（話者：母親 / 息子（高校生））
場面：母と息子が息子の部屋の片付けについて話している。
Question: Where will Ken put the books?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問3（話者：女性（客） / 男性（店員））
場面：店員と客が服のサイズについて話している。
Question: Which shirt did the woman get?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）`,
  subQuestions: [
    {
      id: 'q_el2_set1_1',
      label: '問1 What will the man drink?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 78,
      imageUrl: '/listening_q2/el2_set1_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: 'No sugar, but with milk（砂糖なし・ミルクあり）と Hot の3条件を統合',
        type: 'イラスト選択型（短い対話）',
        difficulty: 2,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set1_2',
      label: '問2 Where will Ken put the books?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 75,
      imageUrl: '/listening_q2/el2_set1_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '最初 top shelf と言われるが No, the middle one. で訂正される',
        type: 'イラスト選択型（短い対話）',
        difficulty: 2,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set1_3',
      label: '問3 Which shirt did the woman get?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 72,
      imageUrl: '/listening_q2/el2_set1_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '色（blue）・サイズ（small）の2条件',
        type: 'イラスト選択型（短い対話）',
        difficulty: 2,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
  ],
  explanation: `第1回（難易度：易しめ）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。各選択肢がどんな絵だったかも併せて載せているので、「どこを聞き分ければよかったか」を絵と対応させて確認できます。

問1　正解は ②
場面：男女がカフェで注文について話している。（話者：女性（店員） / 男性（客））
スクリプト：W: Would you like anything to drink with your sandwich?
M: I'll have coffee, please. No sugar, but with milk.
W: Ice or hot?
M: Hot, please.
Question: What will the man drink?
選択肢のイラスト：
① ミルクなし・砂糖入りのホットコーヒー
② ミルク入り・砂糖なしのホットコーヒー
③ ミルク入り・砂糖なしのアイスコーヒー
④ ミルクなし・砂糖なしのホットティー
正解の選択肢：② ミルク入り・砂糖なしのホットコーヒー
No sugar, but with milk（砂糖なし・ミルクあり）と Hot の3条件を統合。①は砂糖・ミルクの逆転、③は温度違い。

問2　正解は ②
場面：母と息子が息子の部屋の片付けについて話している。（話者：母親 / 息子（高校生））
スクリプト：M: Ken, please put your books on the shelf.
K: OK. On the top shelf?
M: No, the middle one. The top is for the photo albums.
K: Got it.
Question: Where will Ken put the books?
選択肢のイラスト：
① 一番上の棚
② 真ん中の棚
③ 一番下の棚
④ 机の上
正解の選択肢：② 真ん中の棚
最初 top shelf と言われるが No, the middle one. で訂正される。訂正のパターンは第2問の典型。

問3　正解は ①
場面：店員と客が服のサイズについて話している。（話者：女性（客） / 男性（店員））
スクリプト：W: Do you have this shirt in a smaller size?
M: We have small and extra-small. Which would you like?
W: Small, please. And in blue if possible.
M: Sure, here's a small blue one.
Question: Which shirt did the woman get?
選択肢のイラスト：
① 青のSサイズのシャツ
② 青のXSサイズのシャツ
③ 白のSサイズのシャツ
④ 青のMサイズのシャツ
正解の選択肢：① 青のSサイズのシャツ
色（blue）・サイズ（small）の2条件。XSと迷わせるが Small, please で確定。`,
  surroundingKnowledge: [
    '第2問は2回読み。1回目で候補を2つに絞り、2回目で決め手を確認する二段構えが基本。',
    '「訂正の型」が最頻出。No, actually … / the other one / not A but B の後ろが答えになる。',
    '属性の絞り込み（色・形・サイズ・柄・数）は3条件以上重なる。1条件だけ合う絵はダミー。',
    '消去法の型もある。3つが否定されたら、残った1つが答え。',
    '値段・時刻・曜日は「安いほう」「間に合うほう」など優先条件で決まることが多い。',
    '設問の主語（the man / the woman）の取り違えが失点の定番。誰の行動を聞かれているか確認する。',
  ],
  deepDiveTopics: [
    '絵の違いを先に言語化しておくと、聞くべき1語が決まる。これだけで正答率が変わる。',
    '聞こえた単語がそのまま当てはまる絵はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。最後に合意した内容が答え。',
  ],
};

const EL2_SET2_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el2_set2_1',
    label: '問1',
    hint: '男女が友人へのプレゼントを選んでいる。（話者：男性（大学生） / 女性（大学生））',
    audioUrl: '/listening_audio/el2_set2_q1.mp3',
    script: 'M: How about this mug with cats on it?\nW: She likes dogs, not cats.\nM: Then this mug with a dog?\nW: Perfect. And it comes in a gift box, right?',
    turns: [
      { who: 'M', text: 'How about this mug with cats on it?' },
      { who: 'W', text: 'She likes dogs, not cats.' },
      { who: 'M', text: 'Then this mug with a dog?' },
      { who: 'W', text: 'Perfect. And it comes in a gift box, right?' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set2_2',
    label: '問2',
    hint: 'レストランで店員が客にテーブルを案内している。（話者：女性（店員） / 男性（客））',
    audioUrl: '/listening_audio/el2_set2_q2.mp3',
    script: 'W: We have a table by the window for two or a booth at the back for four.\nM: We\'re a group of three actually.\nW: Then how about this round table in the center?\nM: Great, we\'ll take it.',
    turns: [
      { who: 'W', text: 'We have a table by the window for two or a booth at the back for four.' },
      { who: 'M', text: 'We\'re a group of three actually.' },
      { who: 'W', text: 'Then how about this round table in the center?' },
      { who: 'M', text: 'Great, we\'ll take it.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set2_3',
    label: '問3',
    hint: '男女がクラス写真の中で友人を探している。（話者：男性 / 女性）',
    audioUrl: '/listening_audio/el2_set2_q3.mp3',
    script: 'M: Which one is your brother?\nW: He\'s the tallest one in the back row.\nM: The one with glasses?\nW: No, next to him. He\'s wearing a striped shirt.',
    turns: [
      { who: 'M', text: 'Which one is your brother?' },
      { who: 'W', text: 'He\'s the tallest one in the back row.' },
      { who: 'M', text: 'The one with glasses?' },
      { who: 'W', text: 'No, next to him. He\'s wearing a striped shirt.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL2_SET2: ListeningProblem = {
  id: 'q_el2_set2',
  category: '第2回 対話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL2_SET2_TRACKS,
  text: `第2回　第2問（3問・2回読み）　【難易度：標準】

第2問では、2人の短い対話と英語の設問が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は2回読みなので、まずは2回だけ聞いて答えを決めてください。

【解き方のコツ】
音声が流れる前に「場面」を読み、4枚の絵を見比べて「どこが違うか」を1語で言えるようにしておきます（色・数・位置・あり／なし）。違いが分かっていれば、聞き取るべき1語が決まります。第2問は「No, actually …」「the other one」のような訂正が最頻出なので、最初に聞こえた候補で決めないことが大切です。

────────────────────
問1（話者：男性（大学生） / 女性（大学生））
場面：男女が友人へのプレゼントを選んでいる。
Question: Which item will they buy?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問2（話者：女性（店員） / 男性（客））
場面：レストランで店員が客にテーブルを案内している。
Question: Which table will the man's group take?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（1枚の図の中に①〜④）

────────────────────
問3（話者：男性 / 女性）
場面：男女がクラス写真の中で友人を探している。
Question: Which boy is the woman's brother?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（1枚の図の中に①〜④）`,
  subQuestions: [
    {
      id: 'q_el2_set2_1',
      label: '問1 Which item will they buy?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 68,
      imageUrl: '/listening_q2/el2_set2_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: 'cats→dogs への訂正＋gift box の確認',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set2_2',
      label: '問2 Which table will the man\'s group take?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 65,
      imageUrl: '/listening_q2/el2_set2_q2.jpg',
      imageCaption: '問2 の図（①〜④の位置）',
      detailedExplanation: {
        theme: '人数（three）が2でも4でもないため、中央の丸テーブルが正解',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set2_3',
      label: '問3 Which boy is the woman\'s brother?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 62,
      imageUrl: '/listening_q2/el2_set2_q3.jpg',
      imageCaption: '問3 の図（①〜④の位置）',
      detailedExplanation: {
        theme: '位置（back row）・身長（tallest）・服装（striped shirt）・眼鏡なし の4条件',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
  ],
  explanation: `第2回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。各選択肢がどんな絵だったかも併せて載せているので、「どこを聞き分ければよかったか」を絵と対応させて確認できます。

問1　正解は ②
場面：男女が友人へのプレゼントを選んでいる。（話者：男性（大学生） / 女性（大学生））
スクリプト：M: How about this mug with cats on it?
W: She likes dogs, not cats.
M: Then this mug with a dog?
W: Perfect. And it comes in a gift box, right?
Question: Which item will they buy?
選択肢のイラスト：
① 猫柄のマグ(箱なし)
② 犬柄のマグ(箱入り)
③ 猫柄のマグ(箱入り)
④ 犬柄のマグ(箱なし)
正解の選択肢：② 犬柄のマグ(箱入り)
cats→dogs への訂正＋gift box の確認。柄と包装の2軸で選ぶ。2023年問9型（否定→訂正）。

問2　正解は ③
場面：レストランで店員が客にテーブルを案内している。（話者：女性（店員） / 男性（客））
スクリプト：W: We have a table by the window for two or a booth at the back for four.
M: We're a group of three actually.
W: Then how about this round table in the center?
M: Great, we'll take it.
Question: Which table will the man's group take?
選択肢のイラスト：
① 窓際の2人席
② 奥のボックス席(4人)
③ 中央の丸テーブル
④ カウンター席
正解の選択肢：③ 中央の丸テーブル
人数（three）が2でも4でもないため、中央の丸テーブルが正解。人数条件で候補を絞る。2024年問1 1型。

問3　正解は ②
場面：男女がクラス写真の中で友人を探している。（話者：男性 / 女性）
スクリプト：M: Which one is your brother?
W: He's the tallest one in the back row.
M: The one with glasses?
W: No, next to him. He's wearing a striped shirt.
Question: Which boy is the woman's brother?
選択肢のイラスト：
① 後列で眼鏡をかけている背の高い男子
② 後列で縞シャツを着た背の高い男子
③ 前列で縞シャツを着た男子
④ 後列で無地シャツを着た背の高い男子
正解の選択肢：② 後列で縞シャツを着た背の高い男子
位置（back row）・身長（tallest）・服装（striped shirt）・眼鏡なし の4条件。2023年問8アバター型。`,
  surroundingKnowledge: [
    '第2問は2回読み。1回目で候補を2つに絞り、2回目で決め手を確認する二段構えが基本。',
    '「訂正の型」が最頻出。No, actually … / the other one / not A but B の後ろが答えになる。',
    '属性の絞り込み（色・形・サイズ・柄・数）は3条件以上重なる。1条件だけ合う絵はダミー。',
    '消去法の型もある。3つが否定されたら、残った1つが答え。',
    '値段・時刻・曜日は「安いほう」「間に合うほう」など優先条件で決まることが多い。',
    '設問の主語（the man / the woman）の取り違えが失点の定番。誰の行動を聞かれているか確認する。',
  ],
  deepDiveTopics: [
    '絵の違いを先に言語化しておくと、聞くべき1語が決まる。これだけで正答率が変わる。',
    '聞こえた単語がそのまま当てはまる絵はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。最後に合意した内容が答え。',
  ],
};

const EL2_SET3_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el2_set3_1',
    label: '問1',
    hint: '男女が来週の予定表を見ながら話している。（話者：女性 / 男性）',
    audioUrl: '/listening_audio/el2_set3_q1.mp3',
    script: 'W: Are you free on Tuesday afternoon?\nM: No, I have tennis practice then. Wednesday morning is open.\nW: I have a class then. What about Thursday?\nM: Thursday afternoon works.',
    turns: [
      { who: 'W', text: 'Are you free on Tuesday afternoon?' },
      { who: 'M', text: 'No, I have tennis practice then. Wednesday morning is open.' },
      { who: 'W', text: 'I have a class then. What about Thursday?' },
      { who: 'M', text: 'Thursday afternoon works.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set3_2',
    label: '問2',
    hint: '男女がホテルの部屋を選んでいる。（話者：男性 / 女性）',
    audioUrl: '/listening_audio/el2_set3_q2.mp3',
    script: 'M: There\'s a room with a mountain view and one with a sea view.\nW: The sea view sounds nice.\nM: But it\'s twice the price.\nW: Then let\'s go with the mountain view.',
    turns: [
      { who: 'M', text: 'There\'s a room with a mountain view and one with a sea view.' },
      { who: 'W', text: 'The sea view sounds nice.' },
      { who: 'M', text: 'But it\'s twice the price.' },
      { who: 'W', text: 'Then let\'s go with the mountain view.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set3_3',
    label: '問3',
    hint: '男女がベーカリーでパンを選んでいる。（話者：女性（客） / 男性（店員））',
    audioUrl: '/listening_audio/el2_set3_q3.mp3',
    script: 'W: I\'d like the round bread with sesame seeds on top.\nM: The one with poppy seeds? Or the one with sesame?\nW: Sesame, please. And the smaller one.\nM: OK, here you go.',
    turns: [
      { who: 'W', text: 'I\'d like the round bread with sesame seeds on top.' },
      { who: 'M', text: 'The one with poppy seeds? Or the one with sesame?' },
      { who: 'W', text: 'Sesame, please. And the smaller one.' },
      { who: 'M', text: 'OK, here you go.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL2_SET3: ListeningProblem = {
  id: 'q_el2_set3',
  category: '第3回 対話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL2_SET3_TRACKS,
  text: `第3回　第2問（3問・2回読み）　【難易度：標準】

第2問では、2人の短い対話と英語の設問が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は2回読みなので、まずは2回だけ聞いて答えを決めてください。

【解き方のコツ】
音声が流れる前に「場面」を読み、4枚の絵を見比べて「どこが違うか」を1語で言えるようにしておきます（色・数・位置・あり／なし）。違いが分かっていれば、聞き取るべき1語が決まります。第2問は「No, actually …」「the other one」のような訂正が最頻出なので、最初に聞こえた候補で決めないことが大切です。

────────────────────
問1（話者：女性 / 男性）
場面：男女が来週の予定表を見ながら話している。
Question: When will they meet?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（1枚の図の中に①〜④）

────────────────────
問2（話者：男性 / 女性）
場面：男女がホテルの部屋を選んでいる。
Question: Which room will they choose?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（1枚の図の中に①〜④）

────────────────────
問3（話者：女性（客） / 男性（店員））
場面：男女がベーカリーでパンを選んでいる。
Question: Which bread did the woman buy?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（1枚の図の中に①〜④）`,
  subQuestions: [
    {
      id: 'q_el2_set3_1',
      label: '問1 When will they meet?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 68,
      imageUrl: '/listening_q2/el2_set3_q1.jpg',
      imageCaption: '問1 の図（①〜④の位置）',
      detailedExplanation: {
        theme: '3つの候補が否定され、最後の Thursday afternoon works で確定',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set3_2',
      label: '問2 Which room will they choose?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 65,
      imageUrl: '/listening_q2/el2_set3_q2.jpg',
      imageCaption: '問2 の図（①〜④の位置）',
      detailedExplanation: {
        theme: 'sea view→But it\'s twice the price→mountain view の値段による決定',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set3_3',
      label: '問3 Which bread did the woman buy?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 62,
      imageUrl: '/listening_q2/el2_set3_q3.jpg',
      imageCaption: '問3 の図（①〜④の位置）',
      detailedExplanation: {
        theme: '種類（sesame）とサイズ（smaller）の2条件',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
  ],
  explanation: `第3回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。各選択肢がどんな絵だったかも併せて載せているので、「どこを聞き分ければよかったか」を絵と対応させて確認できます。

問1　正解は ④
場面：男女が来週の予定表を見ながら話している。（話者：女性 / 男性）
スクリプト：W: Are you free on Tuesday afternoon?
M: No, I have tennis practice then. Wednesday morning is open.
W: I have a class then. What about Thursday?
M: Thursday afternoon works.
Question: When will they meet?
選択肢のイラスト：
① 火曜午後
② 水曜午前
③ 木曜午前
④ 木曜午後
正解の選択肢：④ 木曜午後
3つの候補が否定され、最後の Thursday afternoon works で確定。第2問の典型的な消去法。

問2　正解は ②
場面：男女がホテルの部屋を選んでいる。（話者：男性 / 女性）
スクリプト：M: There's a room with a mountain view and one with a sea view.
W: The sea view sounds nice.
M: But it's twice the price.
W: Then let's go with the mountain view.
Question: Which room will they choose?
選択肢のイラスト：
① 海が見える部屋
② 山が見える部屋
③ 街が見える部屋
④ 中庭が見える部屋
正解の選択肢：② 山が見える部屋
sea view→But it's twice the price→mountain view の値段による決定。2025年問11の cheaper 型。

問3　正解は ①
場面：男女がベーカリーでパンを選んでいる。（話者：女性（客） / 男性（店員））
スクリプト：W: I'd like the round bread with sesame seeds on top.
M: The one with poppy seeds? Or the one with sesame?
W: Sesame, please. And the smaller one.
M: OK, here you go.
Question: Which bread did the woman buy?
選択肢のイラスト：
① ゴマ付きの小さな丸パン
② ポピーシード付きの大きな丸パン
③ ポピーシード付きの小さな丸パン
④ ゴマ付きの大きな丸パン
正解の選択肢：① ゴマ付きの小さな丸パン
種類（sesame）とサイズ（smaller）の2条件。poppy と sesame の音の聞き分けが鍵。`,
  surroundingKnowledge: [
    '第2問は2回読み。1回目で候補を2つに絞り、2回目で決め手を確認する二段構えが基本。',
    '「訂正の型」が最頻出。No, actually … / the other one / not A but B の後ろが答えになる。',
    '属性の絞り込み（色・形・サイズ・柄・数）は3条件以上重なる。1条件だけ合う絵はダミー。',
    '消去法の型もある。3つが否定されたら、残った1つが答え。',
    '値段・時刻・曜日は「安いほう」「間に合うほう」など優先条件で決まることが多い。',
    '設問の主語（the man / the woman）の取り違えが失点の定番。誰の行動を聞かれているか確認する。',
  ],
  deepDiveTopics: [
    '絵の違いを先に言語化しておくと、聞くべき1語が決まる。これだけで正答率が変わる。',
    '聞こえた単語がそのまま当てはまる絵はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。最後に合意した内容が答え。',
  ],
};

const EL2_SET4_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el2_set4_1',
    label: '問1',
    hint: '男女が公園の案内図を見ながら待ち合わせ場所を決めている。（話者：男性 / 女性）',
    audioUrl: '/listening_audio/el2_set4_q1.mp3',
    script: 'M: Should we meet at the fountain?\nW: It\'s too crowded there on Sundays.\nM: The bench near the playground, then?\nW: How about under the big tree by the pond? It\'s quiet.',
    turns: [
      { who: 'M', text: 'Should we meet at the fountain?' },
      { who: 'W', text: 'It\'s too crowded there on Sundays.' },
      { who: 'M', text: 'The bench near the playground, then?' },
      { who: 'W', text: 'How about under the big tree by the pond? It\'s quiet.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set4_2',
    label: '問2',
    hint: '男女がリサイクル用のごみを分別している。（話者：女性 / 男性）',
    audioUrl: '/listening_audio/el2_set4_q2.mp3',
    script: 'W: This empty juice bottle goes in the plastic bin, right?\nM: Actually, that\'s a glass bottle. It has a different bin.\nW: Oh, so where does it go?\nM: See the one with the wine glass symbol on it? Over there.',
    turns: [
      { who: 'W', text: 'This empty juice bottle goes in the plastic bin, right?' },
      { who: 'M', text: 'Actually, that\'s a glass bottle. It has a different bin.' },
      { who: 'W', text: 'Oh, so where does it go?' },
      { who: 'M', text: 'See the one with the wine glass symbol on it? Over there.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set4_3',
    label: '問3',
    hint: '男女が水族館の館内図を見ている。（話者：男性 / 女性）',
    audioUrl: '/listening_audio/el2_set4_q3.mp3',
    script: 'M: Let\'s see the penguins first.\nW: They\'re on the second floor. The dolphins are on the first floor.\nM: Then let\'s start with dolphins and then go up to penguins.\nW: OK, but let\'s skip the shark tank. We saw it last time.',
    turns: [
      { who: 'M', text: 'Let\'s see the penguins first.' },
      { who: 'W', text: 'They\'re on the second floor. The dolphins are on the first floor.' },
      { who: 'M', text: 'Then let\'s start with dolphins and then go up to penguins.' },
      { who: 'W', text: 'OK, but let\'s skip the shark tank. We saw it last time.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL2_SET4: ListeningProblem = {
  id: 'q_el2_set4',
  category: '第4回 対話に合うイラストを選ぶ（やや難）',
  readCount: 2,
  audioTracks: EL2_SET4_TRACKS,
  text: `第4回　第2問（3問・2回読み）　【難易度：やや難】

第2問では、2人の短い対話と英語の設問が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は2回読みなので、まずは2回だけ聞いて答えを決めてください。

【解き方のコツ】
音声が流れる前に「場面」を読み、4枚の絵を見比べて「どこが違うか」を1語で言えるようにしておきます（色・数・位置・あり／なし）。違いが分かっていれば、聞き取るべき1語が決まります。第2問は「No, actually …」「the other one」のような訂正が最頻出なので、最初に聞こえた候補で決めないことが大切です。

────────────────────
問1（話者：男性 / 女性）
場面：男女が公園の案内図を見ながら待ち合わせ場所を決めている。
Question: Where will they meet?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問2（話者：女性 / 男性）
場面：男女がリサイクル用のごみを分別している。
Question: Which bin will the woman use?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（1枚の図の中に①〜④）

────────────────────
問3（話者：男性 / 女性）
場面：男女が水族館の館内図を見ている。
Question: Which route will they take?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）`,
  subQuestions: [
    {
      id: 'q_el2_set4_1',
      label: '問1 Where will they meet?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 56,
      imageUrl: '/listening_q2/el2_set4_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '提案→却下を2回繰り返し、女性の How about〜 で確定',
        type: 'イラスト選択型（短い対話）',
        difficulty: 4,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set4_2',
      label: '問2 Which bin will the woman use?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 53,
      imageUrl: '/listening_q2/el2_set4_q2.jpg',
      imageCaption: '問2 の図（①〜④の位置）',
      detailedExplanation: {
        theme: '最初 plastic bin と誤解→It\'s a glass bottle→wine glass symbol の分別マーク確定',
        type: 'イラスト選択型（短い対話）',
        difficulty: 4,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set4_3',
      label: '問3 Which route will they take?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 50,
      imageUrl: '/listening_q2/el2_set4_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '順序（dolphins→penguins）＋サメを飛ばす、の2条件',
        type: 'イラスト選択型（短い対話）',
        difficulty: 4,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
  ],
  explanation: `第4回（難易度：やや難）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。各選択肢がどんな絵だったかも併せて載せているので、「どこを聞き分ければよかったか」を絵と対応させて確認できます。

問1　正解は ③
場面：男女が公園の案内図を見ながら待ち合わせ場所を決めている。（話者：男性 / 女性）
スクリプト：M: Should we meet at the fountain?
W: It's too crowded there on Sundays.
M: The bench near the playground, then?
W: How about under the big tree by the pond? It's quiet.
Question: Where will they meet?
選択肢のイラスト：
① 噴水
② 遊具そばのベンチ
③ 池のそばの大きな木の下
④ 駐車場
正解の選択肢：③ 池のそばの大きな木の下
提案→却下を2回繰り返し、女性の How about〜 で確定。2023年問11型の場所選択。

問2　正解は ②
場面：男女がリサイクル用のごみを分別している。（話者：女性 / 男性）
スクリプト：W: This empty juice bottle goes in the plastic bin, right?
M: Actually, that's a glass bottle. It has a different bin.
W: Oh, so where does it go?
M: See the one with the wine glass symbol on it? Over there.
Question: Which bin will the woman use?
選択肢のイラスト：
① ペットボトルマークの箱
② ワイングラスマークの箱
③ 紙マークの箱
④ 缶マークの箱
正解の選択肢：② ワイングラスマークの箱
最初 plastic bin と誤解→It's a glass bottle→wine glass symbol の分別マーク確定。2023年問9型。

問3　正解は ②
場面：男女が水族館の館内図を見ている。（話者：男性 / 女性）
スクリプト：M: Let's see the penguins first.
W: They're on the second floor. The dolphins are on the first floor.
M: Then let's start with dolphins and then go up to penguins.
W: OK, but let's skip the shark tank. We saw it last time.
Question: Which route will they take?
選択肢のイラスト：
① 1階イルカ→2階ペンギン→サメ
② 1階イルカ→2階ペンギン(サメなし)
③ 1階ペンギン→2階イルカ
④ 2階ペンギン→1階イルカ→サメ
正解の選択肢：② 1階イルカ→2階ペンギン(サメなし)
順序（dolphins→penguins）＋サメを飛ばす、の2条件。動線と除外の複合。`,
  surroundingKnowledge: [
    '第2問は2回読み。1回目で候補を2つに絞り、2回目で決め手を確認する二段構えが基本。',
    '「訂正の型」が最頻出。No, actually … / the other one / not A but B の後ろが答えになる。',
    '属性の絞り込み（色・形・サイズ・柄・数）は3条件以上重なる。1条件だけ合う絵はダミー。',
    '消去法の型もある。3つが否定されたら、残った1つが答え。',
    '値段・時刻・曜日は「安いほう」「間に合うほう」など優先条件で決まることが多い。',
    '設問の主語（the man / the woman）の取り違えが失点の定番。誰の行動を聞かれているか確認する。',
  ],
  deepDiveTopics: [
    '絵の違いを先に言語化しておくと、聞くべき1語が決まる。これだけで正答率が変わる。',
    '聞こえた単語がそのまま当てはまる絵はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。最後に合意した内容が答え。',
  ],
};

const EL2_SET5_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el2_set5_1',
    label: '問1',
    hint: '男女が本屋で本を探している。（話者：女性（客） / 男性（店員））',
    audioUrl: '/listening_audio/el2_set5_q1.mp3',
    script: 'W: I\'m looking for a cookbook, especially Italian food.\nM: We have Italian, French, and Japanese cookbooks. All 20% off this week.\nW: Great. Is there one for beginners?\nM: Yes, this one has step-by-step photos.',
    turns: [
      { who: 'W', text: 'I\'m looking for a cookbook, especially Italian food.' },
      { who: 'M', text: 'We have Italian, French, and Japanese cookbooks. All 20% off this week.' },
      { who: 'W', text: 'Great. Is there one for beginners?' },
      { who: 'M', text: 'Yes, this one has step-by-step photos.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set5_2',
    label: '問2',
    hint: '父と娘が娘の自転車のパンクについて話している。（話者：父親 / 娘（中学生））',
    audioUrl: '/listening_audio/el2_set5_q2.mp3',
    script: 'F: Which tire is flat, the front or the back?\nD: The back one. And the light on the front is broken too.\nF: OK, I\'ll fix both this weekend.\nD: Thanks, Dad.',
    turns: [
      { who: 'F', text: 'Which tire is flat, the front or the back?' },
      { who: 'D', text: 'The back one. And the light on the front is broken too.' },
      { who: 'F', text: 'OK, I\'ll fix both this weekend.' },
      { who: 'D', text: 'Thanks, Dad.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set5_3',
    label: '問3',
    hint: '女性が写真の中の子供を紹介している。（話者：女性 / 男性）',
    audioUrl: '/listening_audio/el2_set5_q3.mp3',
    script: 'W: This is my nephew\'s birthday party. Can you guess which is my nephew?\nM: The boy with the party hat?\nW: No, he\'s my nephew\'s friend. My nephew is the one blowing out the candles.\nM: Oh, the one without a hat!',
    turns: [
      { who: 'W', text: 'This is my nephew\'s birthday party. Can you guess which is my nephew?' },
      { who: 'M', text: 'The boy with the party hat?' },
      { who: 'W', text: 'No, he\'s my nephew\'s friend. My nephew is the one blowing out the candles.' },
      { who: 'M', text: 'Oh, the one without a hat!' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL2_SET5: ListeningProblem = {
  id: 'q_el2_set5',
  category: '第5回 対話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL2_SET5_TRACKS,
  text: `第5回　第2問（3問・2回読み）　【難易度：標準】

第2問では、2人の短い対話と英語の設問が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は2回読みなので、まずは2回だけ聞いて答えを決めてください。

【解き方のコツ】
音声が流れる前に「場面」を読み、4枚の絵を見比べて「どこが違うか」を1語で言えるようにしておきます（色・数・位置・あり／なし）。違いが分かっていれば、聞き取るべき1語が決まります。第2問は「No, actually …」「the other one」のような訂正が最頻出なので、最初に聞こえた候補で決めないことが大切です。

────────────────────
問1（話者：女性（客） / 男性（店員））
場面：男女が本屋で本を探している。
Question: Which cookbook will the woman probably buy?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（1枚の図の中に①〜④）

────────────────────
問2（話者：父親 / 娘（中学生））
場面：父と娘が娘の自転車のパンクについて話している。
Question: What is the condition of the bicycle?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問3（話者：女性 / 男性）
場面：女性が写真の中の子供を紹介している。
Question: Which boy is the woman's nephew?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）`,
  subQuestions: [
    {
      id: 'q_el2_set5_1',
      label: '問1 Which cookbook will the woman probably buy?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 68,
      imageUrl: '/listening_q2/el2_set5_q1.jpg',
      imageCaption: '問1 の図（①〜④の位置）',
      detailedExplanation: {
        theme: '料理の種類（Italian）＋レベル（for beginners）の2条件',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set5_2',
      label: '問2 What is the condition of the bicycle?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 65,
      imageUrl: '/listening_q2/el2_set5_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: 'パンク（back tire）＋ライト故障（front light）の2箇所',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set5_3',
      label: '問3 Which boy is the woman\'s nephew?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 62,
      imageUrl: '/listening_q2/el2_set5_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '帽子なし＋ろうそくを吹き消す の2条件',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
  ],
  explanation: `第5回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。各選択肢がどんな絵だったかも併せて載せているので、「どこを聞き分ければよかったか」を絵と対応させて確認できます。

問1　正解は ①
場面：男女が本屋で本を探している。（話者：女性（客） / 男性（店員））
スクリプト：W: I'm looking for a cookbook, especially Italian food.
M: We have Italian, French, and Japanese cookbooks. All 20% off this week.
W: Great. Is there one for beginners?
M: Yes, this one has step-by-step photos.
Question: Which cookbook will the woman probably buy?
選択肢のイラスト：
① 初心者向けイタリア料理本
② 上級者向けイタリア料理本
③ 初心者向けフランス料理本
④ 初心者向け日本料理本
正解の選択肢：① 初心者向けイタリア料理本
料理の種類（Italian）＋レベル（for beginners）の2条件。ダミー情報（20% off、French、Japanese）を排除。

問2　正解は ②
場面：父と娘が娘の自転車のパンクについて話している。（話者：父親 / 娘（中学生））
スクリプト：F: Which tire is flat, the front or the back?
D: The back one. And the light on the front is broken too.
F: OK, I'll fix both this weekend.
D: Thanks, Dad.
Question: What is the condition of the bicycle?
選択肢のイラスト：
① 前タイヤ・後タイヤともパンク、ライトOK
② 後タイヤがパンク、前ライトが壊れている
③ 前タイヤがパンク、後ライトが壊れている
④ 前タイヤがパンク、ライトOK
正解の選択肢：② 後タイヤがパンク、前ライトが壊れている
パンク（back tire）＋ライト故障（front light）の2箇所。front/back の入れ替えに注意。2024年問8型の詳細記述。

問3　正解は ③
場面：女性が写真の中の子供を紹介している。（話者：女性 / 男性）
スクリプト：W: This is my nephew's birthday party. Can you guess which is my nephew?
M: The boy with the party hat?
W: No, he's my nephew's friend. My nephew is the one blowing out the candles.
M: Oh, the one without a hat!
Question: Which boy is the woman's nephew?
選択肢のイラスト：
① パーティー帽子をかぶり、ろうそくを吹き消す男の子
② パーティー帽子をかぶり、ケーキを見ている男の子
③ 帽子なしで、ろうそくを吹き消す男の子
④ 帽子なしで、プレゼントを持つ男の子
正解の選択肢：③ 帽子なしで、ろうそくを吹き消す男の子
帽子なし＋ろうそくを吹き消す の2条件。第一候補（帽子の子）を否定→訂正の型。2024年問9型。`,
  surroundingKnowledge: [
    '第2問は2回読み。1回目で候補を2つに絞り、2回目で決め手を確認する二段構えが基本。',
    '「訂正の型」が最頻出。No, actually … / the other one / not A but B の後ろが答えになる。',
    '属性の絞り込み（色・形・サイズ・柄・数）は3条件以上重なる。1条件だけ合う絵はダミー。',
    '消去法の型もある。3つが否定されたら、残った1つが答え。',
    '値段・時刻・曜日は「安いほう」「間に合うほう」など優先条件で決まることが多い。',
    '設問の主語（the man / the woman）の取り違えが失点の定番。誰の行動を聞かれているか確認する。',
  ],
  deepDiveTopics: [
    '絵の違いを先に言語化しておくと、聞くべき1語が決まる。これだけで正答率が変わる。',
    '聞こえた単語がそのまま当てはまる絵はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。最後に合意した内容が答え。',
  ],
};

const EL2_SET6_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el2_set6_1',
    label: '問1',
    hint: '男女が旅行先の天気予報を見ている。（話者：男性 / 女性）',
    audioUrl: '/listening_audio/el2_set6_q1.mp3',
    script: 'M: It\'s going to rain on Saturday, our first day.\nW: And Sunday?\nM: Cloudy, but no rain.\nW: Good, we can go hiking on Sunday, then.',
    turns: [
      { who: 'M', text: 'It\'s going to rain on Saturday, our first day.' },
      { who: 'W', text: 'And Sunday?' },
      { who: 'M', text: 'Cloudy, but no rain.' },
      { who: 'W', text: 'Good, we can go hiking on Sunday, then.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set6_2',
    label: '問2',
    hint: '文房具店で客が定規を買っている。（話者：女性（客） / 男性（店員））',
    audioUrl: '/listening_audio/el2_set6_q2.mp3',
    script: 'W: Do you have a 30-centimeter ruler?\nM: We have plastic ones and metal ones. Which do you prefer?\nW: Metal, please. And I need one with millimeter markings.\nM: OK, this one has both centimeters and millimeters.',
    turns: [
      { who: 'W', text: 'Do you have a 30-centimeter ruler?' },
      { who: 'M', text: 'We have plastic ones and metal ones. Which do you prefer?' },
      { who: 'W', text: 'Metal, please. And I need one with millimeter markings.' },
      { who: 'M', text: 'OK, this one has both centimeters and millimeters.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set6_3',
    label: '問3',
    hint: '男女がホームパーティーの飾り付けをしている。（話者：男性 / 女性）',
    audioUrl: '/listening_audio/el2_set6_q3.mp3',
    script: 'M: I brought the balloons. Should I put them over the door?\nW: The flower arch is already there. Leave the door alone.\nM: Then next to the dining table?\nW: Yes, that corner still looks empty. Put them there.',
    turns: [
      { who: 'M', text: 'I brought the balloons. Should I put them over the door?' },
      { who: 'W', text: 'The flower arch is already there. Leave the door alone.' },
      { who: 'M', text: 'Then next to the dining table?' },
      { who: 'W', text: 'Yes, that corner still looks empty. Put them there.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL2_SET6: ListeningProblem = {
  id: 'q_el2_set6',
  category: '第6回 対話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL2_SET6_TRACKS,
  text: `第6回　第2問（3問・2回読み）　【難易度：標準】

第2問では、2人の短い対話と英語の設問が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は2回読みなので、まずは2回だけ聞いて答えを決めてください。

【解き方のコツ】
音声が流れる前に「場面」を読み、4枚の絵を見比べて「どこが違うか」を1語で言えるようにしておきます（色・数・位置・あり／なし）。違いが分かっていれば、聞き取るべき1語が決まります。第2問は「No, actually …」「the other one」のような訂正が最頻出なので、最初に聞こえた候補で決めないことが大切です。

────────────────────
問1（話者：男性 / 女性）
場面：男女が旅行先の天気予報を見ている。
Question: What will the weather be on Sunday?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問2（話者：女性（客） / 男性（店員））
場面：文房具店で客が定規を買っている。
Question: Which ruler will the woman buy?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問3（話者：男性 / 女性）
場面：男女がホームパーティーの飾り付けをしている。
Question: Where will the man put the balloons?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（1枚の図の中に①〜④）`,
  subQuestions: [
    {
      id: 'q_el2_set6_1',
      label: '問1 What will the weather be on Sunday?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 68,
      imageUrl: '/listening_q2/el2_set6_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: 'Saturday（雨）は誤答誘導',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set6_2',
      label: '問2 Which ruler will the woman buy?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 65,
      imageUrl: '/listening_q2/el2_set6_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '材質（metal）・長さ（30cm）・目盛（cm+mm）の3条件',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set6_3',
      label: '問3 Where will the man put the balloons?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 62,
      imageUrl: '/listening_q2/el2_set6_q3.jpg',
      imageCaption: '問3 の図（①〜④の位置）',
      detailedExplanation: {
        theme: 'over the door という提案を The flower arch is already there. Leave the door alone. で否定し',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
  ],
  explanation: `第6回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。各選択肢がどんな絵だったかも併せて載せているので、「どこを聞き分ければよかったか」を絵と対応させて確認できます。

問1　正解は ③
場面：男女が旅行先の天気予報を見ている。（話者：男性 / 女性）
スクリプト：M: It's going to rain on Saturday, our first day.
W: And Sunday?
M: Cloudy, but no rain.
W: Good, we can go hiking on Sunday, then.
Question: What will the weather be on Sunday?
選択肢のイラスト：
① 雨
② 晴れ
③ 曇り(雨なし)
④ 雪
正解の選択肢：③ 曇り(雨なし)
Saturday（雨）は誤答誘導。Sunday の情報 Cloudy, but no rain を正確に。2つの日の混同がひっかけ。

問2　正解は ③
場面：文房具店で客が定規を買っている。（話者：女性（客） / 男性（店員））
スクリプト：W: Do you have a 30-centimeter ruler?
M: We have plastic ones and metal ones. Which do you prefer?
W: Metal, please. And I need one with millimeter markings.
M: OK, this one has both centimeters and millimeters.
Question: Which ruler will the woman buy?
選択肢のイラスト：
① プラスチック製30cmで、cm目盛のみ
② 金属製30cmで、cm目盛のみ
③ 金属製30cmで、cmとmm両方の目盛
④ プラスチック製30cmで、cmとmm両方
正解の選択肢：③ 金属製30cmで、cmとmm両方の目盛
材質（metal）・長さ（30cm）・目盛（cm+mm）の3条件。2024年問10型の詳細指定。

問3　正解は ②
場面：男女がホームパーティーの飾り付けをしている。（話者：男性 / 女性）
スクリプト：M: I brought the balloons. Should I put them over the door?
W: The flower arch is already there. Leave the door alone.
M: Then next to the dining table?
W: Yes, that corner still looks empty. Put them there.
Question: Where will the man put the balloons?
選択肢のイラスト：
① ソファの上の壁（三角旗のところ）
② ダイニングテーブルのそば
③ ドアの上（花のアーチのところ）
④ ソファの肘掛け
正解の選択肢：② ダイニングテーブルのそば
over the door という提案を The flower arch is already there. Leave the door alone. で否定し、next to the dining table? → Yes, that corner still looks empty. で場所が確定する。③はすでに花のアーチがある場所なので風船は置かない。①は旗の場所、④は話題に出ていない。提案→否定→再提案→承認の流れを追う。`,
  surroundingKnowledge: [
    '第2問は2回読み。1回目で候補を2つに絞り、2回目で決め手を確認する二段構えが基本。',
    '「訂正の型」が最頻出。No, actually … / the other one / not A but B の後ろが答えになる。',
    '属性の絞り込み（色・形・サイズ・柄・数）は3条件以上重なる。1条件だけ合う絵はダミー。',
    '消去法の型もある。3つが否定されたら、残った1つが答え。',
    '値段・時刻・曜日は「安いほう」「間に合うほう」など優先条件で決まることが多い。',
    '設問の主語（the man / the woman）の取り違えが失点の定番。誰の行動を聞かれているか確認する。',
  ],
  deepDiveTopics: [
    '絵の違いを先に言語化しておくと、聞くべき1語が決まる。これだけで正答率が変わる。',
    '聞こえた単語がそのまま当てはまる絵はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。最後に合意した内容が答え。',
  ],
};

const EL2_SET7_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el2_set7_1',
    label: '問1',
    hint: '男女がスマートフォンの新機種を比較している。（話者：男性 / 女性）',
    audioUrl: '/listening_audio/el2_set7_q1.mp3',
    script: 'M: Model A has a bigger screen, but Model B has a better camera.\nW: I take a lot of photos, so the camera matters.\nM: But Model B is heavier.\nW: That\'s OK. Photos are the priority.',
    turns: [
      { who: 'M', text: 'Model A has a bigger screen, but Model B has a better camera.' },
      { who: 'W', text: 'I take a lot of photos, so the camera matters.' },
      { who: 'M', text: 'But Model B is heavier.' },
      { who: 'W', text: 'That\'s OK. Photos are the priority.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set7_2',
    label: '問2',
    hint: '男女が科学館の展示ゾーンについて話している。（話者：女性 / 男性）',
    audioUrl: '/listening_audio/el2_set7_q2.mp3',
    script: 'W: There are four zones: space, ocean, dinosaurs, and robots.\nM: I\'m really into dinosaurs, but let\'s save that for last.\nW: Then let\'s start with the ocean, because I love it.\nM: OK. After that, space, then dinosaurs. We can skip the robots.',
    turns: [
      { who: 'W', text: 'There are four zones: space, ocean, dinosaurs, and robots.' },
      { who: 'M', text: 'I\'m really into dinosaurs, but let\'s save that for last.' },
      { who: 'W', text: 'Then let\'s start with the ocean, because I love it.' },
      { who: 'M', text: 'OK. After that, space, then dinosaurs. We can skip the robots.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set7_3',
    label: '問3',
    hint: '男女が飛行機の座席表を見ながら席を選んでいる。（話者：男性 / 女性）',
    audioUrl: '/listening_audio/el2_set7_q3.mp3',
    script: 'M: We can still change our seats. Do you want the window?\nW: I\'d like to see outside, but my legs really need more room.\nM: Then the exit row has the most legroom on this plane.\nW: That settles it. I\'ll take the seat next to the exit door.',
    turns: [
      { who: 'M', text: 'We can still change our seats. Do you want the window?' },
      { who: 'W', text: 'I\'d like to see outside, but my legs really need more room.' },
      { who: 'M', text: 'Then the exit row has the most legroom on this plane.' },
      { who: 'W', text: 'That settles it. I\'ll take the seat next to the exit door.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL2_SET7: ListeningProblem = {
  id: 'q_el2_set7',
  category: '第7回 対話に合うイラストを選ぶ（やや難）',
  readCount: 2,
  audioTracks: EL2_SET7_TRACKS,
  text: `第7回　第2問（3問・2回読み）　【難易度：やや難】

第2問では、2人の短い対話と英語の設問が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は2回読みなので、まずは2回だけ聞いて答えを決めてください。

【解き方のコツ】
音声が流れる前に「場面」を読み、4枚の絵を見比べて「どこが違うか」を1語で言えるようにしておきます（色・数・位置・あり／なし）。違いが分かっていれば、聞き取るべき1語が決まります。第2問は「No, actually …」「the other one」のような訂正が最頻出なので、最初に聞こえた候補で決めないことが大切です。

────────────────────
問1（話者：男性 / 女性）
場面：男女がスマートフォンの新機種を比較している。
Question: Which model will the woman probably choose?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問2（話者：女性 / 男性）
場面：男女が科学館の展示ゾーンについて話している。
Question: Which order will they follow?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（1枚の図の中に①〜④）

────────────────────
問3（話者：男性 / 女性）
場面：男女が飛行機の座席表を見ながら席を選んでいる。
Question: Which seat will the woman choose?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）`,
  subQuestions: [
    {
      id: 'q_el2_set7_1',
      label: '問1 Which model will the woman probably choose?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 56,
      imageUrl: '/listening_q2/el2_set7_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '優先順位（Photos are the priority）で重さの欠点を許容',
        type: 'イラスト選択型（短い対話）',
        difficulty: 4,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set7_2',
      label: '問2 Which order will they follow?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 53,
      imageUrl: '/listening_q2/el2_set7_q2.jpg',
      imageCaption: '問2 の図（①〜④の位置）',
      detailedExplanation: {
        theme: '順序と除外（skip the robots）を統合',
        type: 'イラスト選択型（短い対話）',
        difficulty: 4,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set7_3',
      label: '問3 Which seat will the woman choose?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 50,
      imageUrl: '/listening_q2/el2_set7_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: 'window に惹かれつつ my legs really need more room で条件が増え',
        type: 'イラスト選択型（短い対話）',
        difficulty: 4,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
  ],
  explanation: `第7回（難易度：やや難）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。各選択肢がどんな絵だったかも併せて載せているので、「どこを聞き分ければよかったか」を絵と対応させて確認できます。

問1　正解は ②
場面：男女がスマートフォンの新機種を比較している。（話者：男性 / 女性）
スクリプト：M: Model A has a bigger screen, but Model B has a better camera.
W: I take a lot of photos, so the camera matters.
M: But Model B is heavier.
W: That's OK. Photos are the priority.
Question: Which model will the woman probably choose?
選択肢のイラスト：
① 画面が大きく軽いModel A
② カメラが良く重いModel B
③ カメラが良く軽いModel C
④ 画面が大きく重いModel D
正解の選択肢：② カメラが良く重いModel B
優先順位（Photos are the priority）で重さの欠点を許容。2025年問10型（比較→優先条件で確定）。

問2　正解は ②
場面：男女が科学館の展示ゾーンについて話している。（話者：女性 / 男性）
スクリプト：W: There are four zones: space, ocean, dinosaurs, and robots.
M: I'm really into dinosaurs, but let's save that for last.
W: Then let's start with the ocean, because I love it.
M: OK. After that, space, then dinosaurs. We can skip the robots.
Question: Which order will they follow?
選択肢のイラスト：
① 宇宙→海→恐竜→ロボット
② 海→宇宙→恐竜(ロボットなし)
③ 恐竜→海→宇宙→ロボット
④ 海→ロボット→宇宙→恐竜
正解の選択肢：② 海→宇宙→恐竜(ロボットなし)
順序と除外（skip the robots）を統合。3つ以上の要素を並べる高難度型。

問3　正解は ④
場面：男女が飛行機の座席表を見ながら席を選んでいる。（話者：男性 / 女性）
スクリプト：M: We can still change our seats. Do you want the window?
W: I'd like to see outside, but my legs really need more room.
M: Then the exit row has the most legroom on this plane.
W: That settles it. I'll take the seat next to the exit door.
Question: Which seat will the woman choose?
選択肢のイラスト：
① 窓のすぐ隣の窓側の席
② 真ん中の席（足元はふつうの広さ）
③ 真ん中の席（足元がやや広い）
④ 非常口の扉の隣の席（足元が最も広い）
正解の選択肢：④ 非常口の扉の隣の席（足元が最も広い）
window に惹かれつつ my legs really need more room で条件が増え、the exit row has the most legroom → the seat next to the exit door で確定。①は景色の条件は満たすが足元の条件を満たさない。②③はどちらも真ん中の席で、足元の広さが違うだけなので most legroom には届かない。前半の Do you want the window? に引かれて①を選ばないこと。`,
  surroundingKnowledge: [
    '第2問は2回読み。1回目で候補を2つに絞り、2回目で決め手を確認する二段構えが基本。',
    '「訂正の型」が最頻出。No, actually … / the other one / not A but B の後ろが答えになる。',
    '属性の絞り込み（色・形・サイズ・柄・数）は3条件以上重なる。1条件だけ合う絵はダミー。',
    '消去法の型もある。3つが否定されたら、残った1つが答え。',
    '値段・時刻・曜日は「安いほう」「間に合うほう」など優先条件で決まることが多い。',
    '設問の主語（the man / the woman）の取り違えが失点の定番。誰の行動を聞かれているか確認する。',
  ],
  deepDiveTopics: [
    '絵の違いを先に言語化しておくと、聞くべき1語が決まる。これだけで正答率が変わる。',
    '聞こえた単語がそのまま当てはまる絵はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。最後に合意した内容が答え。',
  ],
};

const EL2_SET8_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el2_set8_1',
    label: '問1',
    hint: '母と息子が誕生日ケーキのデザインを決めている。（話者：母親 / 息子）',
    audioUrl: '/listening_audio/el2_set8_q1.mp3',
    script: 'M: Do you want strawberries or blueberries on top?\nS: Strawberries! And chocolate letters that say \'Happy Birthday\'.\nM: How about chocolate flakes on the side, too?\nS: No, just plain cream on the side.',
    turns: [
      { who: 'M', text: 'Do you want strawberries or blueberries on top?' },
      { who: 'S', text: 'Strawberries! And chocolate letters that say \'Happy Birthday\'.' },
      { who: 'M', text: 'How about chocolate flakes on the side, too?' },
      { who: 'S', text: 'No, just plain cream on the side.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set8_2',
    label: '問2',
    hint: '男女が本のカバーを選んでいる。（話者：女性 / 男性（店員））',
    audioUrl: '/listening_audio/el2_set8_q2.mp3',
    script: 'W: I\'d like a book cover, please. Do you have any with flowers?\nM: Yes, we have roses, sunflowers, and lilies.\nW: Sunflowers, please. And do you have one with a bookmark ribbon?\nM: This one has a ribbon.',
    turns: [
      { who: 'W', text: 'I\'d like a book cover, please. Do you have any with flowers?' },
      { who: 'M', text: 'Yes, we have roses, sunflowers, and lilies.' },
      { who: 'W', text: 'Sunflowers, please. And do you have one with a bookmark ribbon?' },
      { who: 'M', text: 'This one has a ribbon.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set8_3',
    label: '問3',
    hint: '男女が引越しの荷物をどの部屋へ運ぶか相談している。（話者：男性 / 女性）',
    audioUrl: '/listening_audio/el2_set8_q3.mp3',
    script: 'M: Three boxes left: books, clothes, and kitchen things.\nW: Books go to the bedroom, and the kitchen things stay in the kitchen.\nM: Should I split the clothes between the closet and the kitchen?\nW: No, all the clothes go in the closet. One box, one room.',
    turns: [
      { who: 'M', text: 'Three boxes left: books, clothes, and kitchen things.' },
      { who: 'W', text: 'Books go to the bedroom, and the kitchen things stay in the kitchen.' },
      { who: 'M', text: 'Should I split the clothes between the closet and the kitchen?' },
      { who: 'W', text: 'No, all the clothes go in the closet. One box, one room.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL2_SET8: ListeningProblem = {
  id: 'q_el2_set8',
  category: '第8回 対話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL2_SET8_TRACKS,
  text: `第8回　第2問（3問・2回読み）　【難易度：標準】

第2問では、2人の短い対話と英語の設問が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は2回読みなので、まずは2回だけ聞いて答えを決めてください。

【解き方のコツ】
音声が流れる前に「場面」を読み、4枚の絵を見比べて「どこが違うか」を1語で言えるようにしておきます（色・数・位置・あり／なし）。違いが分かっていれば、聞き取るべき1語が決まります。第2問は「No, actually …」「the other one」のような訂正が最頻出なので、最初に聞こえた候補で決めないことが大切です。

────────────────────
問1（話者：母親 / 息子）
場面：母と息子が誕生日ケーキのデザインを決めている。
Question: Which cake matches the boy's request?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問2（話者：女性 / 男性（店員））
場面：男女が本のカバーを選んでいる。
Question: Which book cover did the woman choose?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（1枚の図の中に①〜④）

────────────────────
問3（話者：男性 / 女性）
場面：男女が引越しの荷物をどの部屋へ運ぶか相談している。
Question: Which arrangement matches the woman's instructions?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）`,
  subQuestions: [
    {
      id: 'q_el2_set8_1',
      label: '問1 Which cake matches the boy\'s request?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 68,
      imageUrl: '/listening_q2/el2_set8_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '苺＋チョコ文字＋側面プレーンの3条件',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set8_2',
      label: '問2 Which book cover did the woman choose?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 65,
      imageUrl: '/listening_q2/el2_set8_q2.jpg',
      imageCaption: '問2 の図（①〜④の位置）',
      detailedExplanation: {
        theme: '柄（sunflowers）＋機能（ribbon）の2条件',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set8_3',
      label: '問3 Which arrangement matches the woman\'s instructions?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 62,
      imageUrl: '/listening_q2/el2_set8_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: 'Should I split the clothes …? に対する No, all the clothes go in the closet. One box, one room. が決め手',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
  ],
  explanation: `第8回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。各選択肢がどんな絵だったかも併せて載せているので、「どこを聞き分ければよかったか」を絵と対応させて確認できます。

問1　正解は ①
場面：母と息子が誕生日ケーキのデザインを決めている。（話者：母親 / 息子）
スクリプト：M: Do you want strawberries or blueberries on top?
S: Strawberries! And chocolate letters that say 'Happy Birthday'.
M: How about chocolate flakes on the side, too?
S: No, just plain cream on the side.
Question: Which cake matches the boy's request?
選択肢のイラスト：
① 苺・チョコ文字・側面プレーンクリーム
② ブルーベリー・チョコ文字・側面プレーン
③ 苺・チョコ文字・側面チョコフレーク
④ 苺のみ、文字なし、側面プレーン
正解の選択肢：① 苺・チョコ文字・側面プレーンクリーム
苺＋チョコ文字＋側面プレーンの3条件。side はチョコを断る点に注意。

問2　正解は ④
場面：男女が本のカバーを選んでいる。（話者：女性 / 男性（店員））
スクリプト：W: I'd like a book cover, please. Do you have any with flowers?
M: Yes, we have roses, sunflowers, and lilies.
W: Sunflowers, please. And do you have one with a bookmark ribbon?
M: This one has a ribbon.
Question: Which book cover did the woman choose?
選択肢のイラスト：
① バラ柄・しおりリボンなし
② ヒマワリ柄・しおりリボンなし
③ ユリ柄・しおりリボンあり
④ ヒマワリ柄・しおりリボンあり
正解の選択肢：④ ヒマワリ柄・しおりリボンあり
柄（sunflowers）＋機能（ribbon）の2条件。花の種類の聞き分けが要点。

問3　正解は ①
場面：男女が引越しの荷物をどの部屋へ運ぶか相談している。（話者：男性 / 女性）
スクリプト：M: Three boxes left: books, clothes, and kitchen things.
W: Books go to the bedroom, and the kitchen things stay in the kitchen.
M: Should I split the clothes between the closet and the kitchen?
W: No, all the clothes go in the closet. One box, one room.
Question: Which arrangement matches the woman's instructions?
選択肢のイラスト：
① 本→寝室、服→クローゼット、台所用品→台所（1箱1部屋）
② 同じ3組だが、矢印が斜めに描かれている図
③ 本→寝室、服はクローゼットと台所の2部屋に分ける
④ 服だけを寝室・クローゼット・台所の3部屋に分ける
正解の選択肢：① 本→寝室、服→クローゼット、台所用品→台所（1箱1部屋）
Should I split the clothes …? に対する No, all the clothes go in the closet. One box, one room. が決め手。③は服を2部屋、④は服を3部屋に分けており、split を否定した内容に反する。②は同じ対応を斜めの矢印で描いただけなので、One box, one room を最も素直に表した図を選ぶ。`,
  surroundingKnowledge: [
    '第2問は2回読み。1回目で候補を2つに絞り、2回目で決め手を確認する二段構えが基本。',
    '「訂正の型」が最頻出。No, actually … / the other one / not A but B の後ろが答えになる。',
    '属性の絞り込み（色・形・サイズ・柄・数）は3条件以上重なる。1条件だけ合う絵はダミー。',
    '消去法の型もある。3つが否定されたら、残った1つが答え。',
    '値段・時刻・曜日は「安いほう」「間に合うほう」など優先条件で決まることが多い。',
    '設問の主語（the man / the woman）の取り違えが失点の定番。誰の行動を聞かれているか確認する。',
  ],
  deepDiveTopics: [
    '絵の違いを先に言語化しておくと、聞くべき1語が決まる。これだけで正答率が変わる。',
    '聞こえた単語がそのまま当てはまる絵はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。最後に合意した内容が答え。',
  ],
};

const EL2_SET9_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el2_set9_1',
    label: '問1',
    hint: '女性がジムのインストラクターと運動プランを相談している。（話者：女性 / 男性（インストラクター））',
    audioUrl: '/listening_audio/el2_set9_q1.mp3',
    script: 'W: I want to start running, but my knees are not strong.\nM: Then swimming or cycling would be better.\nW: I can\'t swim well, so cycling it is.\nM: Great. Let\'s start with 20 minutes a day.',
    turns: [
      { who: 'W', text: 'I want to start running, but my knees are not strong.' },
      { who: 'M', text: 'Then swimming or cycling would be better.' },
      { who: 'W', text: 'I can\'t swim well, so cycling it is.' },
      { who: 'M', text: 'Great. Let\'s start with 20 minutes a day.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set9_2',
    label: '問2',
    hint: '男女がイベントの席割りを決めている。（話者：男性 / 女性）',
    audioUrl: '/listening_audio/el2_set9_q2.mp3',
    script: 'M: VIP guests should be in the front row.\nW: Yes, and the media people on the left side of the middle rows.\nM: What about students?\nW: Students in the back rows.',
    turns: [
      { who: 'M', text: 'VIP guests should be in the front row.' },
      { who: 'W', text: 'Yes, and the media people on the left side of the middle rows.' },
      { who: 'M', text: 'What about students?' },
      { who: 'W', text: 'Students in the back rows.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set9_3',
    label: '問3',
    hint: '男女がテーマパークで乗り物を選んでいる。（話者：女性 / 男性）',
    audioUrl: '/listening_audio/el2_set9_q3.mp3',
    script: 'W: How about the roller coaster?\nM: I feel sick on those. Let\'s try the Ferris wheel.\nW: Too slow. What about the haunted house?\nM: OK, but let\'s do the merry-go-round first.',
    turns: [
      { who: 'W', text: 'How about the roller coaster?' },
      { who: 'M', text: 'I feel sick on those. Let\'s try the Ferris wheel.' },
      { who: 'W', text: 'Too slow. What about the haunted house?' },
      { who: 'M', text: 'OK, but let\'s do the merry-go-round first.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL2_SET9: ListeningProblem = {
  id: 'q_el2_set9',
  category: '第9回 対話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL2_SET9_TRACKS,
  text: `第9回　第2問（3問・2回読み）　【難易度：標準】

第2問では、2人の短い対話と英語の設問が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は2回読みなので、まずは2回だけ聞いて答えを決めてください。

【解き方のコツ】
音声が流れる前に「場面」を読み、4枚の絵を見比べて「どこが違うか」を1語で言えるようにしておきます（色・数・位置・あり／なし）。違いが分かっていれば、聞き取るべき1語が決まります。第2問は「No, actually …」「the other one」のような訂正が最頻出なので、最初に聞こえた候補で決めないことが大切です。

────────────────────
問1（話者：女性 / 男性（インストラクター））
場面：女性がジムのインストラクターと運動プランを相談している。
Question: Which exercise will she start?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問2（話者：男性 / 女性）
場面：男女がイベントの席割りを決めている。
Question: Which seating chart is correct?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問3（話者：女性 / 男性）
場面：男女がテーマパークで乗り物を選んでいる。
Question: Which ride will they go on first?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）`,
  subQuestions: [
    {
      id: 'q_el2_set9_1',
      label: '問1 Which exercise will she start?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 68,
      imageUrl: '/listening_q2/el2_set9_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '3段階の候補絞り込み（running不可→swimming不可→cycling）',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set9_2',
      label: '問2 Which seating chart is correct?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 65,
      imageUrl: '/listening_q2/el2_set9_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '3グループ×3位置の対応関係の把握',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set9_3',
      label: '問3 Which ride will they go on first?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 62,
      imageUrl: '/listening_q2/el2_set9_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '最終的に let\'s do the merry-go-round first で確定',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
  ],
  explanation: `第9回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。各選択肢がどんな絵だったかも併せて載せているので、「どこを聞き分ければよかったか」を絵と対応させて確認できます。

問1　正解は ③
場面：女性がジムのインストラクターと運動プランを相談している。（話者：女性 / 男性（インストラクター））
スクリプト：W: I want to start running, but my knees are not strong.
M: Then swimming or cycling would be better.
W: I can't swim well, so cycling it is.
M: Great. Let's start with 20 minutes a day.
Question: Which exercise will she start?
選択肢のイラスト：
① ランニング
② 水泳
③ サイクリング
④ ヨガ
正解の選択肢：③ サイクリング
3段階の候補絞り込み（running不可→swimming不可→cycling）。除外の連鎖。

問2　正解は ①
場面：男女がイベントの席割りを決めている。（話者：男性 / 女性）
スクリプト：M: VIP guests should be in the front row.
W: Yes, and the media people on the left side of the middle rows.
M: What about students?
W: Students in the back rows.
Question: Which seating chart is correct?
選択肢のイラスト：
① 前列VIP・中央左メディア・後列学生
② 前列学生・中央メディア・後列VIP
③ 前列VIP・後列メディア・中央学生
④ 前列メディア・中央VIP・後列学生
正解の選択肢：① 前列VIP・中央左メディア・後列学生
3グループ×3位置の対応関係の把握。会場図と英語表現（front/middle/back rows, left side）の整合。

問3　正解は ④
場面：男女がテーマパークで乗り物を選んでいる。（話者：女性 / 男性）
スクリプト：W: How about the roller coaster?
M: I feel sick on those. Let's try the Ferris wheel.
W: Too slow. What about the haunted house?
M: OK, but let's do the merry-go-round first.
Question: Which ride will they go on first?
選択肢のイラスト：
① ジェットコースター
② 観覧車
③ お化け屋敷
④ メリーゴーラウンド
正解の選択肢：④ メリーゴーラウンド
最終的に let's do the merry-go-round first で確定。first の語が正解の決め手。`,
  surroundingKnowledge: [
    '第2問は2回読み。1回目で候補を2つに絞り、2回目で決め手を確認する二段構えが基本。',
    '「訂正の型」が最頻出。No, actually … / the other one / not A but B の後ろが答えになる。',
    '属性の絞り込み（色・形・サイズ・柄・数）は3条件以上重なる。1条件だけ合う絵はダミー。',
    '消去法の型もある。3つが否定されたら、残った1つが答え。',
    '値段・時刻・曜日は「安いほう」「間に合うほう」など優先条件で決まることが多い。',
    '設問の主語（the man / the woman）の取り違えが失点の定番。誰の行動を聞かれているか確認する。',
  ],
  deepDiveTopics: [
    '絵の違いを先に言語化しておくと、聞くべき1語が決まる。これだけで正答率が変わる。',
    '聞こえた単語がそのまま当てはまる絵はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。最後に合意した内容が答え。',
  ],
};

const EL2_SET10_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el2_set10_1',
    label: '問1',
    hint: '男女がバス路線図を見ながら行き方を相談している。（話者：男性 / 女性）',
    audioUrl: '/listening_audio/el2_set10_q1.mp3',
    script: 'M: How do we get to the museum?\nW: Take bus 5 to City Hall, then transfer to bus 12.\nM: Isn\'t bus 8 direct?\nW: Yes, but it only runs on weekends. Today is Wednesday.',
    turns: [
      { who: 'M', text: 'How do we get to the museum?' },
      { who: 'W', text: 'Take bus 5 to City Hall, then transfer to bus 12.' },
      { who: 'M', text: 'Isn\'t bus 8 direct?' },
      { who: 'W', text: 'Yes, but it only runs on weekends. Today is Wednesday.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set10_2',
    label: '問2',
    hint: '母と息子が新学期の時間割を見ている。（話者：母親 / 息子）',
    audioUrl: '/listening_audio/el2_set10_q2.mp3',
    script: 'M: You have PE on Monday and Thursday, right?\nS: No, Tuesday and Friday. Monday I have music.\nM: And when\'s your English class?\nS: Every day except Wednesday.',
    turns: [
      { who: 'M', text: 'You have PE on Monday and Thursday, right?' },
      { who: 'S', text: 'No, Tuesday and Friday. Monday I have music.' },
      { who: 'M', text: 'And when\'s your English class?' },
      { who: 'S', text: 'Every day except Wednesday.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set10_3',
    label: '問3',
    hint: '男女がフリーマーケットで買い物をしている。（話者：女性 / 男性（店主））',
    audioUrl: '/listening_audio/el2_set10_q3.mp3',
    script: 'W: How much for this vase and this teapot?\nM: The vase is 500 yen, the teapot 800. Both together, 1200 yen.\nW: Hmm, I\'ll take just the teapot.\nM: Actually, if you take both, I\'ll make it 1000 yen.\nW: Oh, great! I\'ll take both, then.',
    turns: [
      { who: 'W', text: 'How much for this vase and this teapot?' },
      { who: 'M', text: 'The vase is 500 yen, the teapot 800. Both together, 1200 yen.' },
      { who: 'W', text: 'Hmm, I\'ll take just the teapot.' },
      { who: 'M', text: 'Actually, if you take both, I\'ll make it 1000 yen.' },
      { who: 'W', text: 'Oh, great! I\'ll take both, then.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL2_SET10: ListeningProblem = {
  id: 'q_el2_set10',
  category: '第10回 対話に合うイラストを選ぶ（やや難）',
  readCount: 2,
  audioTracks: EL2_SET10_TRACKS,
  text: `第10回　第2問（3問・2回読み）　【難易度：やや難】

第2問では、2人の短い対話と英語の設問が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は2回読みなので、まずは2回だけ聞いて答えを決めてください。

【解き方のコツ】
音声が流れる前に「場面」を読み、4枚の絵を見比べて「どこが違うか」を1語で言えるようにしておきます（色・数・位置・あり／なし）。違いが分かっていれば、聞き取るべき1語が決まります。第2問は「No, actually …」「the other one」のような訂正が最頻出なので、最初に聞こえた候補で決めないことが大切です。

────────────────────
問1（話者：男性 / 女性）
場面：男女がバス路線図を見ながら行き方を相談している。
Question: Which route will they take today?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問2（話者：母親 / 息子）
場面：母と息子が新学期の時間割を見ている。
Question: Which timetable matches?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（1枚の図の中に①〜④）

────────────────────
問3（話者：女性 / 男性（店主））
場面：男女がフリーマーケットで買い物をしている。
Question: How much will the woman pay?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）`,
  subQuestions: [
    {
      id: 'q_el2_set10_1',
      label: '問1 Which route will they take today?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 56,
      imageUrl: '/listening_q2/el2_set10_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '直行便が週末限定→今日は水曜→乗換ルート',
        type: 'イラスト選択型（短い対話）',
        difficulty: 4,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set10_2',
      label: '問2 Which timetable matches?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 53,
      imageUrl: '/listening_q2/el2_set10_q2.jpg',
      imageCaption: '問2 の図（①〜④の位置）',
      detailedExplanation: {
        theme: '母の推測（月・木体育）→息子の訂正（火・金）＋英語は水以外',
        type: 'イラスト選択型（短い対話）',
        difficulty: 4,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set10_3',
      label: '問3 How much will the woman pay?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 50,
      imageUrl: '/listening_q2/el2_set10_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '最初は teapot 単体（800円）→ 店主の提案（両方で1000円）に「I\'ll take both, then.」と合意する流れ',
        type: 'イラスト選択型（短い対話）',
        difficulty: 4,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
  ],
  explanation: `第10回（難易度：やや難）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。各選択肢がどんな絵だったかも併せて載せているので、「どこを聞き分ければよかったか」を絵と対応させて確認できます。

問1　正解は ②
場面：男女がバス路線図を見ながら行き方を相談している。（話者：男性 / 女性）
スクリプト：M: How do we get to the museum?
W: Take bus 5 to City Hall, then transfer to bus 12.
M: Isn't bus 8 direct?
W: Yes, but it only runs on weekends. Today is Wednesday.
Question: Which route will they take today?
選択肢のイラスト：
① バス8で直行
② バス5→バス12
③ バス12→バス5
④ バス5のみ
正解の選択肢：② バス5→バス12
直行便が週末限定→今日は水曜→乗換ルート。曜日条件の把握が鍵。

問2　正解は ②
場面：母と息子が新学期の時間割を見ている。（話者：母親 / 息子）
スクリプト：M: You have PE on Monday and Thursday, right?
S: No, Tuesday and Friday. Monday I have music.
M: And when's your English class?
S: Every day except Wednesday.
Question: Which timetable matches?
選択肢のイラスト：
① 月曜:体育、水:英語なし
② 火曜と金曜:体育、水:英語なし
③ 月曜と木曜:体育、毎日英語
④ 火曜と金曜:体育、毎日英語
正解の選択肢：② 火曜と金曜:体育、水:英語なし
母の推測（月・木体育）→息子の訂正（火・金）＋英語は水以外。訂正と例外の同時処理。2026年 問9型。

問3　正解は ③
場面：男女がフリーマーケットで買い物をしている。（話者：女性 / 男性（店主））
スクリプト：W: How much for this vase and this teapot?
M: The vase is 500 yen, the teapot 800. Both together, 1200 yen.
W: Hmm, I'll take just the teapot.
M: Actually, if you take both, I'll make it 1000 yen.
W: Oh, great! I'll take both, then.
Question: How much will the woman pay?
選択肢のイラスト：
① 500円
② 800円
③ 1000円
④ 1200円
正解の選択肢：③ 1000円
最初は teapot 単体（800）→ 店主の提案（両方で1000）を受け入れる流れ。値段変化を追う。2022年問9型。`,
  surroundingKnowledge: [
    '第2問は2回読み。1回目で候補を2つに絞り、2回目で決め手を確認する二段構えが基本。',
    '「訂正の型」が最頻出。No, actually … / the other one / not A but B の後ろが答えになる。',
    '属性の絞り込み（色・形・サイズ・柄・数）は3条件以上重なる。1条件だけ合う絵はダミー。',
    '消去法の型もある。3つが否定されたら、残った1つが答え。',
    '値段・時刻・曜日は「安いほう」「間に合うほう」など優先条件で決まることが多い。',
    '設問の主語（the man / the woman）の取り違えが失点の定番。誰の行動を聞かれているか確認する。',
  ],
  deepDiveTopics: [
    '絵の違いを先に言語化しておくと、聞くべき1語が決まる。これだけで正答率が変わる。',
    '聞こえた単語がそのまま当てはまる絵はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。最後に合意した内容が答え。',
  ],
};

const EL2_SET11_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el2_set11_1',
    label: '問1',
    hint: '男女がホームパーティーの飲み物を数えている。（話者：女性 / 男性）',
    audioUrl: '/listening_audio/el2_set11_q1.mp3',
    script: 'W: I bought six bottles of juice. Is that enough?\nM: For ten guests, yes. But we need water too.\nW: The same six, then?\nM: Make it one more than the juice, just in case.',
    turns: [
      { who: 'W', text: 'I bought six bottles of juice. Is that enough?' },
      { who: 'M', text: 'For ten guests, yes. But we need water too.' },
      { who: 'W', text: 'The same six, then?' },
      { who: 'M', text: 'Make it one more than the juice, just in case.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set11_2',
    label: '問2',
    hint: '男女が壁掛け写真の位置を決めている。（話者：男性 / 女性）',
    audioUrl: '/listening_audio/el2_set11_q2.mp3',
    script: 'M: Should the landscape photo go above the sofa or above the TV?\nW: Above the TV. And the family photo above the sofa.\nM: Where\'s the wedding photo, then?\nW: On the shelf, not on the wall.',
    turns: [
      { who: 'M', text: 'Should the landscape photo go above the sofa or above the TV?' },
      { who: 'W', text: 'Above the TV. And the family photo above the sofa.' },
      { who: 'M', text: 'Where\'s the wedding photo, then?' },
      { who: 'W', text: 'On the shelf, not on the wall.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set11_3',
    label: '問3',
    hint: '男女が学校の掲示板の告知を見ている。（話者：女性 / 男性）',
    audioUrl: '/listening_audio/el2_set11_q3.mp3',
    script: 'W: The music club meeting is on Friday at 4.\nM: No, the poster says Thursday at 4:30.\nW: Oh, I read the old one. Where does it meet?\nM: In the music room, not the gym.',
    turns: [
      { who: 'W', text: 'The music club meeting is on Friday at 4.' },
      { who: 'M', text: 'No, the poster says Thursday at 4:30.' },
      { who: 'W', text: 'Oh, I read the old one. Where does it meet?' },
      { who: 'M', text: 'In the music room, not the gym.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL2_SET11: ListeningProblem = {
  id: 'q_el2_set11',
  category: '第11回 対話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL2_SET11_TRACKS,
  text: `第11回　第2問（3問・2回読み）　【難易度：標準】

第2問では、2人の短い対話と英語の設問が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は2回読みなので、まずは2回だけ聞いて答えを決めてください。

【解き方のコツ】
音声が流れる前に「場面」を読み、4枚の絵を見比べて「どこが違うか」を1語で言えるようにしておきます（色・数・位置・あり／なし）。違いが分かっていれば、聞き取るべき1語が決まります。第2問は「No, actually …」「the other one」のような訂正が最頻出なので、最初に聞こえた候補で決めないことが大切です。

────────────────────
問1（話者：女性 / 男性）
場面：男女がホームパーティーの飲み物を数えている。
Question: How many bottles are there in total?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問2（話者：男性 / 女性）
場面：男女が壁掛け写真の位置を決めている。
Question: Which arrangement matches?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問3（話者：女性 / 男性）
場面：男女が学校の掲示板の告知を見ている。
Question: Which notice is correct?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）`,
  subQuestions: [
    {
      id: 'q_el2_set11_1',
      label: '問1 How many bottles are there in total?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 68,
      imageUrl: '/listening_q2/el2_set11_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: 'Make it one more than the juice が決め手で',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set11_2',
      label: '問2 Which arrangement matches?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 65,
      imageUrl: '/listening_q2/el2_set11_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '3枚の写真（風景／家族／結婚式）と3か所（TV上／ソファ上／棚）の対応',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set11_3',
      label: '問3 Which notice is correct?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 62,
      imageUrl: '/listening_q2/el2_set11_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '曜日・時刻・場所の3つが訂正される連鎖型',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
  ],
  explanation: `第11回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。各選択肢がどんな絵だったかも併せて載せているので、「どこを聞き分ければよかったか」を絵と対応させて確認できます。

問1　正解は ③
場面：男女がホームパーティーの飲み物を数えている。（話者：女性 / 男性）
スクリプト：W: I bought six bottles of juice. Is that enough?
M: For ten guests, yes. But we need water too.
W: The same six, then?
M: Make it one more than the juice, just in case.
Question: How many bottles are there in total?
選択肢のイラスト：
① ジュース6本だけ
② 水6本だけ
③ ジュース6本＋水7本＝13本
④ ジュース12本＋水12本＝24本
正解の選択肢：③ ジュース6本＋水7本＝13本
Make it one more than the juice が決め手で、水は 6+1=7 本。合計は 6+7=13 本になる。The same six, then? をそのまま受け取ると12 本と数え違える。①②は片方の飲み物しか無く、④は本数が倍以上で合わない。ゲスト数 ten はダミー。

問2　正解は ①
場面：男女が壁掛け写真の位置を決めている。（話者：男性 / 女性）
スクリプト：M: Should the landscape photo go above the sofa or above the TV?
W: Above the TV. And the family photo above the sofa.
M: Where's the wedding photo, then?
W: On the shelf, not on the wall.
Question: Which arrangement matches?
選択肢のイラスト：
① TV上:風景、ソファ上:家族、棚:結婚式
② TV上:家族、ソファ上:風景、棚:結婚式
③ TV上:結婚式、ソファ上:家族、棚:風景
④ TV上:風景、ソファ上:結婚式、棚:家族
正解の選択肢：① TV上:風景、ソファ上:家族、棚:結婚式
3枚の写真（風景／家族／結婚式）と3か所（TV上／ソファ上／棚）の対応。位置指定の連続。

問3　正解は ②
場面：男女が学校の掲示板の告知を見ている。（話者：女性 / 男性）
スクリプト：W: The music club meeting is on Friday at 4.
M: No, the poster says Thursday at 4:30.
W: Oh, I read the old one. Where does it meet?
M: In the music room, not the gym.
Question: Which notice is correct?
選択肢のイラスト：
① 金曜4時 音楽室
② 木曜4時30分 音楽室
③ 木曜4時30分 体育館
④ 金曜4時 体育館
正解の選択肢：② 木曜4時30分 音楽室
曜日・時刻・場所の3つが訂正される連鎖型。古い掲示と新しい掲示のひっかけ。2026年問9型。`,
  surroundingKnowledge: [
    '第2問は2回読み。1回目で候補を2つに絞り、2回目で決め手を確認する二段構えが基本。',
    '「訂正の型」が最頻出。No, actually … / the other one / not A but B の後ろが答えになる。',
    '属性の絞り込み（色・形・サイズ・柄・数）は3条件以上重なる。1条件だけ合う絵はダミー。',
    '消去法の型もある。3つが否定されたら、残った1つが答え。',
    '値段・時刻・曜日は「安いほう」「間に合うほう」など優先条件で決まることが多い。',
    '設問の主語（the man / the woman）の取り違えが失点の定番。誰の行動を聞かれているか確認する。',
  ],
  deepDiveTopics: [
    '絵の違いを先に言語化しておくと、聞くべき1語が決まる。これだけで正答率が変わる。',
    '聞こえた単語がそのまま当てはまる絵はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。最後に合意した内容が答え。',
  ],
};

const EL2_SET12_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el2_set12_1',
    label: '問1',
    hint: '男女がイヤホンを試している。（話者：女性（店員） / 男性（客））',
    audioUrl: '/listening_audio/el2_set12_q1.mp3',
    script: 'W: We have wired earphones and wireless ones.\nM: Wireless, please. With noise cancelling if possible.\nW: Yes, this one has it. It also has a microphone.\nM: Great, I\'ll take it.',
    turns: [
      { who: 'W', text: 'We have wired earphones and wireless ones.' },
      { who: 'M', text: 'Wireless, please. With noise cancelling if possible.' },
      { who: 'W', text: 'Yes, this one has it. It also has a microphone.' },
      { who: 'M', text: 'Great, I\'ll take it.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set12_2',
    label: '問2',
    hint: '男女がカフェのメニューを見ている。（話者：男性 / 女性）',
    audioUrl: '/listening_audio/el2_set12_q2.mp3',
    script: 'M: The set menu with soup, salad, and sandwich is 900 yen.\nW: I don\'t want the soup.\nM: Then it\'s 700 without the soup.\nW: OK, I\'ll take that.',
    turns: [
      { who: 'M', text: 'The set menu with soup, salad, and sandwich is 900 yen.' },
      { who: 'W', text: 'I don\'t want the soup.' },
      { who: 'M', text: 'Then it\'s 700 without the soup.' },
      { who: 'W', text: 'OK, I\'ll take that.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set12_3',
    label: '問3',
    hint: '男女がおもちゃ屋で人形を選んでいる。（話者：女性（客） / 男性（店員））',
    audioUrl: '/listening_audio/el2_set12_q3.mp3',
    script: 'W: I\'d like a doll with long hair and a red dress.\nM: We have long hair with pink dress or short hair with red dress.\nW: Any long hair with red dress?\nM: Not now. How about long hair, pink dress? It\'s the closest.',
    turns: [
      { who: 'W', text: 'I\'d like a doll with long hair and a red dress.' },
      { who: 'M', text: 'We have long hair with pink dress or short hair with red dress.' },
      { who: 'W', text: 'Any long hair with red dress?' },
      { who: 'M', text: 'Not now. How about long hair, pink dress? It\'s the closest.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL2_SET12: ListeningProblem = {
  id: 'q_el2_set12',
  category: '第12回 対話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL2_SET12_TRACKS,
  text: `第12回　第2問（3問・2回読み）　【難易度：標準】

第2問では、2人の短い対話と英語の設問が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は2回読みなので、まずは2回だけ聞いて答えを決めてください。

【解き方のコツ】
音声が流れる前に「場面」を読み、4枚の絵を見比べて「どこが違うか」を1語で言えるようにしておきます（色・数・位置・あり／なし）。違いが分かっていれば、聞き取るべき1語が決まります。第2問は「No, actually …」「the other one」のような訂正が最頻出なので、最初に聞こえた候補で決めないことが大切です。

────────────────────
問1（話者：女性（店員） / 男性（客））
場面：男女がイヤホンを試している。
Question: Which earphones will the man buy?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問2（話者：男性 / 女性）
場面：男女がカフェのメニューを見ている。
Question: What will the woman order and pay?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問3（話者：女性（客） / 男性（店員））
場面：男女がおもちゃ屋で人形を選んでいる。
Question: Which doll will the woman likely take?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）`,
  subQuestions: [
    {
      id: 'q_el2_set12_1',
      label: '問1 Which earphones will the man buy?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 68,
      imageUrl: '/listening_q2/el2_set12_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '接続（wireless）・機能（noise cancelling）・付属（microphone）の3属性',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set12_2',
      label: '問2 What will the woman order and pay?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 65,
      imageUrl: '/listening_q2/el2_set12_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '減算型（900−200＝700）＋メニュー内容の変更（スープ抜き）の同時把握',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set12_3',
      label: '問3 Which doll will the woman likely take?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 62,
      imageUrl: '/listening_q2/el2_set12_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '希望条件が揃わず、closest（一番近い）で妥協する型',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
  ],
  explanation: `第12回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。各選択肢がどんな絵だったかも併せて載せているので、「どこを聞き分ければよかったか」を絵と対応させて確認できます。

問1　正解は ②
場面：男女がイヤホンを試している。（話者：女性（店員） / 男性（客））
スクリプト：W: We have wired earphones and wireless ones.
M: Wireless, please. With noise cancelling if possible.
W: Yes, this one has it. It also has a microphone.
M: Great, I'll take it.
Question: Which earphones will the man buy?
選択肢のイラスト：
① 有線・ノイズキャンセルなし
② 無線・ノイズキャンセル＋マイク
③ 無線・ノイズキャンセルなし
④ 有線・ノイズキャンセルあり
正解の選択肢：② 無線・ノイズキャンセル＋マイク
接続（wireless）・機能（noise cancelling）・付属（microphone）の3属性。

問2　正解は ②
場面：男女がカフェのメニューを見ている。（話者：男性 / 女性）
スクリプト：M: The set menu with soup, salad, and sandwich is 900 yen.
W: I don't want the soup.
M: Then it's 700 without the soup.
W: OK, I'll take that.
Question: What will the woman order and pay?
選択肢のイラスト：
① 3点セット、900円
② サラダとサンドイッチ、700円
③ スープとサンドイッチ、700円
④ サンドイッチのみ、500円
正解の選択肢：② サラダとサンドイッチ、700円
減算型（900−200＝700）＋メニュー内容の変更（スープ抜き）の同時把握。2022年問11型（条件付 き）。

問3　正解は ②
場面：男女がおもちゃ屋で人形を選んでいる。（話者：女性（客） / 男性（店員））
スクリプト：W: I'd like a doll with long hair and a red dress.
M: We have long hair with pink dress or short hair with red dress.
W: Any long hair with red dress?
M: Not now. How about long hair, pink dress? It's the closest.
Question: Which doll will the woman likely take?
選択肢のイラスト：
① 長髪・赤いドレス
② 長髪・ピンクドレス
③ 短髪・赤いドレス
④ 短髪・ピンクドレス
正解の選択肢：② 長髪・ピンクドレス
希望条件が揃わず、closest（一番近い）で妥協する型。優先順位の判断。`,
  surroundingKnowledge: [
    '第2問は2回読み。1回目で候補を2つに絞り、2回目で決め手を確認する二段構えが基本。',
    '「訂正の型」が最頻出。No, actually … / the other one / not A but B の後ろが答えになる。',
    '属性の絞り込み（色・形・サイズ・柄・数）は3条件以上重なる。1条件だけ合う絵はダミー。',
    '消去法の型もある。3つが否定されたら、残った1つが答え。',
    '値段・時刻・曜日は「安いほう」「間に合うほう」など優先条件で決まることが多い。',
    '設問の主語（the man / the woman）の取り違えが失点の定番。誰の行動を聞かれているか確認する。',
  ],
  deepDiveTopics: [
    '絵の違いを先に言語化しておくと、聞くべき1語が決まる。これだけで正答率が変わる。',
    '聞こえた単語がそのまま当てはまる絵はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。最後に合意した内容が答え。',
  ],
};

const EL2_SET13_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el2_set13_1',
    label: '問1',
    hint: '男女が地図を見ながらキャンプ場での待ち合わせ場所を決めている。（話者：男性 / 女性）',
    audioUrl: '/listening_audio/el2_set13_q1.mp3',
    script: 'M: I\'ll drive from the house. You\'re coming on foot, right?\nW: Yes. Shall we meet by the lake on the way?\nM: The road there is a dead end for cars. Let me pick you up after the bridge.\nW: All right, right where the road turns into the campsite.',
    turns: [
      { who: 'M', text: 'I\'ll drive from the house. You\'re coming on foot, right?' },
      { who: 'W', text: 'Yes. Shall we meet by the lake on the way?' },
      { who: 'M', text: 'The road there is a dead end for cars. Let me pick you up after the bridge.' },
      { who: 'W', text: 'All right, right where the road turns into the campsite.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set13_2',
    label: '問2',
    hint: '男女が科学実験のグラフを見ている。（話者：男性 / 女性）',
    audioUrl: '/listening_audio/el2_set13_q2.mp3',
    script: 'M: The temperature rose sharply for the first 10 minutes.\nW: Yes, then it stayed the same for a while.\nM: And after 20 minutes, it dropped slightly.\nW: Right, and then it stayed flat again.',
    turns: [
      { who: 'M', text: 'The temperature rose sharply for the first 10 minutes.' },
      { who: 'W', text: 'Yes, then it stayed the same for a while.' },
      { who: 'M', text: 'And after 20 minutes, it dropped slightly.' },
      { who: 'W', text: 'Right, and then it stayed flat again.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set13_3',
    label: '問3',
    hint: '男女がスポーツクラブで週間スケジュールを組んでいる。（話者：女性 / 男性）',
    audioUrl: '/listening_audio/el2_set13_q3.mp3',
    script: 'W: I\'ll do yoga on Mondays and Wednesdays.\nM: Both days? That\'s a lot.\nW: And swimming on Fridays. What about you?\nM: I\'ll swim on Tuesdays and Thursdays.',
    turns: [
      { who: 'W', text: 'I\'ll do yoga on Mondays and Wednesdays.' },
      { who: 'M', text: 'Both days? That\'s a lot.' },
      { who: 'W', text: 'And swimming on Fridays. What about you?' },
      { who: 'M', text: 'I\'ll swim on Tuesdays and Thursdays.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL2_SET13: ListeningProblem = {
  id: 'q_el2_set13',
  category: '第13回 対話に合うイラストを選ぶ（やや難）',
  readCount: 2,
  audioTracks: EL2_SET13_TRACKS,
  text: `第13回　第2問（3問・2回読み）　【難易度：やや難】

第2問では、2人の短い対話と英語の設問が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は2回読みなので、まずは2回だけ聞いて答えを決めてください。

【解き方のコツ】
音声が流れる前に「場面」を読み、4枚の絵を見比べて「どこが違うか」を1語で言えるようにしておきます（色・数・位置・あり／なし）。違いが分かっていれば、聞き取るべき1語が決まります。第2問は「No, actually …」「the other one」のような訂正が最頻出なので、最初に聞こえた候補で決めないことが大切です。

────────────────────
問1（話者：男性 / 女性）
場面：男女が地図を見ながらキャンプ場での待ち合わせ場所を決めている。
Question: Where will they meet?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（1枚の図の中に①〜④）

────────────────────
問2（話者：男性 / 女性）
場面：男女が科学実験のグラフを見ている。
Question: Which graph matches?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問3（話者：女性 / 男性）
場面：男女がスポーツクラブで週間スケジュールを組んでいる。
Question: Which schedule shows the woman's plan?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）`,
  subQuestions: [
    {
      id: 'q_el2_set13_1',
      label: '問1 Where will they meet?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 56,
      imageUrl: '/listening_q2/el2_set13_q1.jpg',
      imageCaption: '問1 の図（①〜④の位置）',
      detailedExplanation: {
        theme: 'by the lake（②）という提案を The road there is a dead end for cars で否定し',
        type: 'イラスト選択型（短い対話）',
        difficulty: 4,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set13_2',
      label: '問2 Which graph matches?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 53,
      imageUrl: '/listening_q2/el2_set13_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: 'グラフの4段階変化（rose sharply → stayed the same → dropped slightly → stayed flat）を順番通り',
        type: 'イラスト選択型（短い対話）',
        difficulty: 4,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set13_3',
      label: '問3 Which schedule shows the woman\'s plan?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 50,
      imageUrl: '/listening_q2/el2_set13_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '男性のスケジュール（火・木）と混同させる',
        type: 'イラスト選択型（短い対話）',
        difficulty: 4,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
  ],
  explanation: `第13回（難易度：やや難）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。各選択肢がどんな絵だったかも併せて載せているので、「どこを聞き分ければよかったか」を絵と対応させて確認できます。

問1　正解は ③
場面：男女が地図を見ながらキャンプ場での待ち合わせ場所を決めている。（話者：男性 / 女性）
スクリプト：M: I'll drive from the house. You're coming on foot, right?
W: Yes. Shall we meet by the lake on the way?
M: The road there is a dead end for cars. Let me pick you up after the bridge.
W: All right, right where the road turns into the campsite.
Question: Where will they meet?
選択肢のイラスト：
① 地図の左上にある家
② 左側の池のそば
③ 橋を渡った先、キャンプ場に入る道
④ 左下の行き止まりの道
正解の選択肢：③ 橋を渡った先、キャンプ場に入る道
by the lake（②）という提案を The road there is a dead end for cars で否定し、after the bridge → right where the road turns into the campsite で橋の先に確定する。①は男性の出発地であって待ち合わせ場所ではなく、④は行き止まりなので車で迎えに行けない。提案→否定→言い換えの3手を追う。

問2　正解は ①
場面：男女が科学実験のグラフを見ている。（話者：男性 / 女性）
スクリプト：M: The temperature rose sharply for the first 10 minutes.
W: Yes, then it stayed the same for a while.
M: And after 20 minutes, it dropped slightly.
W: Right, and then it stayed flat again.
Question: Which graph matches?
選択肢のイラスト：
① 急上昇→横ばい→ゆるやかに下降→横ばい
② 急上昇→ゆるやかに下降→急上昇
③ 一定の上昇→急下降→横ばい
④ 横ばい→急上昇→急下降
正解の選択肢：① 急上昇→横ばい→ゆるやかに下降→横ばい
グラフの4段階変化（rose sharply → stayed the same → dropped slightly → stayed flat）を順番通り。2026年問11型のグラフ・段階選択。

問3　正解は ①
場面：男女がスポーツクラブで週間スケジュールを組んでいる。（話者：女性 / 男性）
スクリプト：W: I'll do yoga on Mondays and Wednesdays.
M: Both days? That's a lot.
W: And swimming on Fridays. What about you?
M: I'll swim on Tuesdays and Thursdays.
Question: Which schedule shows the woman's plan?
選択肢のイラスト：
① 月・水:ヨガ、金:水泳
② 月・水・金:ヨガ
③ 火・木:水泳
④ 月・水:水泳、金:ヨガ
正解の選択肢：① 月・水:ヨガ、金:水泳
男性のスケジュール（火・木）と混同させる。「女性の予定」を問う設問文の把握。`,
  surroundingKnowledge: [
    '第2問は2回読み。1回目で候補を2つに絞り、2回目で決め手を確認する二段構えが基本。',
    '「訂正の型」が最頻出。No, actually … / the other one / not A but B の後ろが答えになる。',
    '属性の絞り込み（色・形・サイズ・柄・数）は3条件以上重なる。1条件だけ合う絵はダミー。',
    '消去法の型もある。3つが否定されたら、残った1つが答え。',
    '値段・時刻・曜日は「安いほう」「間に合うほう」など優先条件で決まることが多い。',
    '設問の主語（the man / the woman）の取り違えが失点の定番。誰の行動を聞かれているか確認する。',
  ],
  deepDiveTopics: [
    '絵の違いを先に言語化しておくと、聞くべき1語が決まる。これだけで正答率が変わる。',
    '聞こえた単語がそのまま当てはまる絵はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。最後に合意した内容が答え。',
  ],
};

const EL2_SET14_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el2_set14_1',
    label: '問1',
    hint: '男女が学校祭のポスターを作成中。（話者：男性 / 女性）',
    audioUrl: '/listening_audio/el2_set14_q1.mp3',
    script: 'M: The title \'School Festival\' should be at the top.\nW: In big letters, right? And the date underneath.\nM: Yes. And put the location at the bottom.\nW: How about a small logo in the corner?',
    turns: [
      { who: 'M', text: 'The title \'School Festival\' should be at the top.' },
      { who: 'W', text: 'In big letters, right? And the date underneath.' },
      { who: 'M', text: 'Yes. And put the location at the bottom.' },
      { who: 'W', text: 'How about a small logo in the corner?' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set14_2',
    label: '問2',
    hint: '男女がペットショップで犬を選んでいる。（話者：女性 / 男性（店員））',
    audioUrl: '/listening_audio/el2_set14_q2.mp3',
    script: 'W: I like small dogs with long fur.\nM: We have a small poodle with curly fur, and a small terrier with straight long fur.\nW: The terrier sounds good. Is it a male or female?\nM: This one\'s female.',
    turns: [
      { who: 'W', text: 'I like small dogs with long fur.' },
      { who: 'M', text: 'We have a small poodle with curly fur, and a small terrier with straight long fur.' },
      { who: 'W', text: 'The terrier sounds good. Is it a male or female?' },
      { who: 'M', text: 'This one\'s female.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set14_3',
    label: '問3',
    hint: '男女が旅行の持ち物を確認している。（話者：男性 / 女性）',
    audioUrl: '/listening_audio/el2_set14_q3.mp3',
    script: 'M: Passport, camera, and sunglasses. What else?\nW: We need the guidebook, not the map. My phone has the map.\nM: OK. And an umbrella?\nW: No, it won\'t rain there.',
    turns: [
      { who: 'M', text: 'Passport, camera, and sunglasses. What else?' },
      { who: 'W', text: 'We need the guidebook, not the map. My phone has the map.' },
      { who: 'M', text: 'OK. And an umbrella?' },
      { who: 'W', text: 'No, it won\'t rain there.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL2_SET14: ListeningProblem = {
  id: 'q_el2_set14',
  category: '第14回 対話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL2_SET14_TRACKS,
  text: `第14回　第2問（3問・2回読み）　【難易度：標準】

第2問では、2人の短い対話と英語の設問が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は2回読みなので、まずは2回だけ聞いて答えを決めてください。

【解き方のコツ】
音声が流れる前に「場面」を読み、4枚の絵を見比べて「どこが違うか」を1語で言えるようにしておきます（色・数・位置・あり／なし）。違いが分かっていれば、聞き取るべき1語が決まります。第2問は「No, actually …」「the other one」のような訂正が最頻出なので、最初に聞こえた候補で決めないことが大切です。

────────────────────
問1（話者：男性 / 女性）
場面：男女が学校祭のポスターを作成中。
Question: Which poster layout matches?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問2（話者：女性 / 男性（店員））
場面：男女がペットショップで犬を選んでいる。
Question: Which dog will the woman take?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（1枚の図の中に①〜④）

────────────────────
問3（話者：男性 / 女性）
場面：男女が旅行の持ち物を確認している。
Question: Which set matches their packing list?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）`,
  subQuestions: [
    {
      id: 'q_el2_set14_1',
      label: '問1 Which poster layout matches?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 68,
      imageUrl: '/listening_q2/el2_set14_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '4要素（タイトル／日付／場所／ロゴ）の位置指定',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set14_2',
      label: '問2 Which dog will the woman take?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 65,
      imageUrl: '/listening_q2/el2_set14_q2.jpg',
      imageCaption: '問2 の図（①〜④の位置）',
      detailedExplanation: {
        theme: '種類（terrier）＋毛（straight long）＋性別（female）の3条件',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set14_3',
      label: '問3 Which set matches their packing list?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 62,
      imageUrl: '/listening_q2/el2_set14_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '含む物と除外物の複合',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
  ],
  explanation: `第14回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。各選択肢がどんな絵だったかも併せて載せているので、「どこを聞き分ければよかったか」を絵と対応させて確認できます。

問1　正解は ①
場面：男女が学校祭のポスターを作成中。（話者：男性 / 女性）
スクリプト：M: The title 'School Festival' should be at the top.
W: In big letters, right? And the date underneath.
M: Yes. And put the location at the bottom.
W: How about a small logo in the corner?
Question: Which poster layout matches?
選択肢のイラスト：
① 上部にタイトル・その下に日付・下部に場所・隅にロゴ
② 上部に日付・中央にタイトル・下部にロゴ
③ 上部にロゴ・中央にタイトル・下部に日付
④ 上部に場所・中央にタイトル・下部に日付
正解の選択肢：① 上部にタイトル・その下に日付・下部に場所・隅にロゴ
4要素（タイトル／日付／場所／ロゴ）の位置指定。上→下、隅の位置関係を統合。

問2　正解は ④
場面：男女がペットショップで犬を選んでいる。（話者：女性 / 男性（店員））
スクリプト：W: I like small dogs with long fur.
M: We have a small poodle with curly fur, and a small terrier with straight long fur.
W: The terrier sounds good. Is it a male or female?
M: This one's female.
Question: Which dog will the woman take?
選択肢のイラスト：
① 巻き毛の小型プードル(オス)
② 巻き毛の小型プードル(メス)
③ 長毛ストレートの小型テリア(オス)
④ 長毛ストレートの小型テリア(メス)
正解の選択肢：④ 長毛ストレートの小型テリア(メス)
種類（terrier）＋毛（straight long）＋性別（female）の3条件。プードルと迷わせる。

問3　正解は ②
場面：男女が旅行の持ち物を確認している。（話者：男性 / 女性）
スクリプト：M: Passport, camera, and sunglasses. What else?
W: We need the guidebook, not the map. My phone has the map.
M: OK. And an umbrella?
W: No, it won't rain there.
Question: Which set matches their packing list?
選択肢のイラスト：
① パスポート・カメラ・サングラス・ガイドブック・地図
② パスポート・カメラ・サングラス・ガイドブック(地図・傘なし)
③ パスポート・カメラ・地図・傘
④ カメラ・サングラス・地図・傘
正解の選択肢：② パスポート・カメラ・サングラス・ガイドブック(地図・傘なし)
含む物と除外物の複合。not the map と no umbrella の2つの否定を正確に。`,
  surroundingKnowledge: [
    '第2問は2回読み。1回目で候補を2つに絞り、2回目で決め手を確認する二段構えが基本。',
    '「訂正の型」が最頻出。No, actually … / the other one / not A but B の後ろが答えになる。',
    '属性の絞り込み（色・形・サイズ・柄・数）は3条件以上重なる。1条件だけ合う絵はダミー。',
    '消去法の型もある。3つが否定されたら、残った1つが答え。',
    '値段・時刻・曜日は「安いほう」「間に合うほう」など優先条件で決まることが多い。',
    '設問の主語（the man / the woman）の取り違えが失点の定番。誰の行動を聞かれているか確認する。',
  ],
  deepDiveTopics: [
    '絵の違いを先に言語化しておくと、聞くべき1語が決まる。これだけで正答率が変わる。',
    '聞こえた単語がそのまま当てはまる絵はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。最後に合意した内容が答え。',
  ],
};

const EL2_SET15_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el2_set15_1',
    label: '問1',
    hint: '男女が電車の遅延情報を確認している。（話者：男性（駅員） / 女性（乗客））',
    audioUrl: '/listening_audio/el2_set15_q1.mp3',
    script: 'M: The 10:15 train is delayed by 30 minutes.\nW: So it leaves at 10:45?\nM: Yes. But the 10:30 express is on time and stops at your station.\nW: Great, I\'ll take the express.',
    turns: [
      { who: 'M', text: 'The 10:15 train is delayed by 30 minutes.' },
      { who: 'W', text: 'So it leaves at 10:45?' },
      { who: 'M', text: 'Yes. But the 10:30 express is on time and stops at your station.' },
      { who: 'W', text: 'Great, I\'ll take the express.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set15_2',
    label: '問2',
    hint: '男女が写真を見ながら誰が誰かを話している。（話者：女性 / 男性）',
    audioUrl: '/listening_audio/el2_set15_q2.mp3',
    script: 'M: Is that your mother on the left?\nW: No, that\'s my aunt. My mother is next to her, holding the baby.\nM: And the tall man behind them?\nW: That\'s my father.',
    turns: [
      { who: 'M', text: 'Is that your mother on the left?' },
      { who: 'W', text: 'No, that\'s my aunt. My mother is next to her, holding the baby.' },
      { who: 'M', text: 'And the tall man behind them?' },
      { who: 'W', text: 'That\'s my father.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set15_3',
    label: '問3',
    hint: '男女が空港で荷物を預ける手続きをしている。（話者：女性（客） / 男性（係員））',
    audioUrl: '/listening_audio/el2_set15_q3.mp3',
    script: 'W: I have one large suitcase and this small carry-on.\nM: Only the large one goes to check-in. The carry-on stays with you.\nW: And this backpack?\nM: Backpack too, if it fits under the seat.',
    turns: [
      { who: 'W', text: 'I have one large suitcase and this small carry-on.' },
      { who: 'M', text: 'Only the large one goes to check-in. The carry-on stays with you.' },
      { who: 'W', text: 'And this backpack?' },
      { who: 'M', text: 'Backpack too, if it fits under the seat.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL2_SET15: ListeningProblem = {
  id: 'q_el2_set15',
  category: '第15回 対話に合うイラストを選ぶ（やや難）',
  readCount: 2,
  audioTracks: EL2_SET15_TRACKS,
  text: `第15回　第2問（3問・2回読み）　【難易度：やや難】

第2問では、2人の短い対話と英語の設問が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は2回読みなので、まずは2回だけ聞いて答えを決めてください。

【解き方のコツ】
音声が流れる前に「場面」を読み、4枚の絵を見比べて「どこが違うか」を1語で言えるようにしておきます（色・数・位置・あり／なし）。違いが分かっていれば、聞き取るべき1語が決まります。第2問は「No, actually …」「the other one」のような訂正が最頻出なので、最初に聞こえた候補で決めないことが大切です。

────────────────────
問1（話者：男性（駅員） / 女性（乗客））
場面：男女が電車の遅延情報を確認している。
Question: Which train will the woman take?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問2（話者：女性 / 男性）
場面：男女が写真を見ながら誰が誰かを話している。
Question: Which person is the woman's mother?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（1枚の図の中に①〜④）

────────────────────
問3（話者：女性（客） / 男性（係員））
場面：男女が空港で荷物を預ける手続きをしている。
Question: Which is checked in (預け入れ) ?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）`,
  subQuestions: [
    {
      id: 'q_el2_set15_1',
      label: '問1 Which train will the woman take?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 56,
      imageUrl: '/listening_q2/el2_set15_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '時刻と列車種別の複合',
        type: 'イラスト選択型（短い対話）',
        difficulty: 4,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set15_2',
      label: '問2 Which person is the woman\'s mother?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 53,
      imageUrl: '/listening_q2/el2_set15_q2.jpg',
      imageCaption: '問2 の図（①〜④の位置）',
      detailedExplanation: {
        theme: '左端の第一印象を否定→次に→赤ちゃんを抱いている人と特定',
        type: 'イラスト選択型（短い対話）',
        difficulty: 4,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set15_3',
      label: '問3 Which is checked in (預け入れ) ?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 50,
      imageUrl: '/listening_q2/el2_set15_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '預け入れ／機内持ち込みの区別',
        type: 'イラスト選択型（短い対話）',
        difficulty: 4,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
  ],
  explanation: `第15回（難易度：やや難）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。各選択肢がどんな絵だったかも併せて載せているので、「どこを聞き分ければよかったか」を絵と対応させて確認できます。

問1　正解は ②
場面：男女が電車の遅延情報を確認している。（話者：男性（駅員） / 女性（乗客））
スクリプト：M: The 10:15 train is delayed by 30 minutes.
W: So it leaves at 10:45?
M: Yes. But the 10:30 express is on time and stops at your station.
W: Great, I'll take the express.
Question: Which train will the woman take?
選択肢のイラスト：
① 10時15分発の各駅停車
② 10時30分発の急行
③ 10時45分発の急行
④ 10時45分発の各駅停車
正解の選択肢：② 10時30分発の急行
時刻と列車種別の複合。遅延した10:15各駅と、定時の10:30急行の比較で急行を選ぶ。

問2　正解は ②
場面：男女が写真を見ながら誰が誰かを話している。（話者：女性 / 男性）
スクリプト：M: Is that your mother on the left?
W: No, that's my aunt. My mother is next to her, holding the baby.
M: And the tall man behind them?
W: That's my father.
Question: Which person is the woman's mother?
選択肢のイラスト：
① 左端の女性
② 赤ちゃんを抱いている女性(左から2番目)
③ 背が高い男性
④ 叔母の後ろの女性
正解の選択肢：② 赤ちゃんを抱いている女性(左から2番目)
左端の第一印象を否定→次に→赤ちゃんを抱いている人と特定。2024年問9型（写真の中の人物特定 ）。

問3　正解は ①
場面：男女が空港で荷物を預ける手続きをしている。（話者：女性（客） / 男性（係員））
スクリプト：W: I have one large suitcase and this small carry-on.
M: Only the large one goes to check-in. The carry-on stays with you.
W: And this backpack?
M: Backpack too, if it fits under the seat.
Question: Which is checked in (預け入れ) ?
選択肢のイラスト：
① 大きなスーツケース1つ
② 大きなスーツケースとリュックの2つ
③ キャリーオンとリュック
④ 3つとも預ける
正解の選択肢：① 大きなスーツケース1つ
預け入れ／機内持ち込みの区別。large one goes to check-in が核心。他は機内持ち込み。`,
  surroundingKnowledge: [
    '第2問は2回読み。1回目で候補を2つに絞り、2回目で決め手を確認する二段構えが基本。',
    '「訂正の型」が最頻出。No, actually … / the other one / not A but B の後ろが答えになる。',
    '属性の絞り込み（色・形・サイズ・柄・数）は3条件以上重なる。1条件だけ合う絵はダミー。',
    '消去法の型もある。3つが否定されたら、残った1つが答え。',
    '値段・時刻・曜日は「安いほう」「間に合うほう」など優先条件で決まることが多い。',
    '設問の主語（the man / the woman）の取り違えが失点の定番。誰の行動を聞かれているか確認する。',
  ],
  deepDiveTopics: [
    '絵の違いを先に言語化しておくと、聞くべき1語が決まる。これだけで正答率が変わる。',
    '聞こえた単語がそのまま当てはまる絵はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。最後に合意した内容が答え。',
  ],
};

const EL2_SET16_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el2_set16_1',
    label: '問1',
    hint: '男女がケーキ屋でギフト用のケーキを選んでいる。（話者：女性（店員） / 男性（客））',
    audioUrl: '/listening_audio/el2_set16_q1.mp3',
    script: 'W: We have chocolate, strawberry, and cheesecake.\nM: She loves fruits, but not strawberries. Actually, she\'s allergic to them.\nW: How about our peach cake, then?\nM: Perfect. I\'ll take that.',
    turns: [
      { who: 'W', text: 'We have chocolate, strawberry, and cheesecake.' },
      { who: 'M', text: 'She loves fruits, but not strawberries. Actually, she\'s allergic to them.' },
      { who: 'W', text: 'How about our peach cake, then?' },
      { who: 'M', text: 'Perfect. I\'ll take that.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set16_2',
    label: '問2',
    hint: '男女が学校の靴箱の位置を確認している。（話者：男性 / 女性）',
    audioUrl: '/listening_audio/el2_set16_q2.mp3',
    script: 'M: Could you put my gym bag in my shoe locker?\nW: Sure. It\'s in row B, second from the top, isn\'t it?\nM: It used to be, but they moved me to row C.\nW: Row C. Which one?\nM: Third from the top.',
    turns: [
      { who: 'M', text: 'Could you put my gym bag in my shoe locker?' },
      { who: 'W', text: 'Sure. It\'s in row B, second from the top, isn\'t it?' },
      { who: 'M', text: 'It used to be, but they moved me to row C.' },
      { who: 'W', text: 'Row C. Which one?' },
      { who: 'M', text: 'Third from the top.' },
    ],
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el2_set16_3',
    label: '問3',
    hint: '男女がスポーツ用品店でテニスラケットを選んでいる。（話者：女性（客） / 男性（店員））',
    audioUrl: '/listening_audio/el2_set16_q3.mp3',
    script: 'W: I\'m a beginner. Which racket do you recommend?\nM: This lightweight one is good for beginners. It has a larger head.\nW: And the color?\nM: Available in blue, black, or white.',
    turns: [
      { who: 'W', text: 'I\'m a beginner. Which racket do you recommend?' },
      { who: 'M', text: 'This lightweight one is good for beginners. It has a larger head.' },
      { who: 'W', text: 'And the color?' },
      { who: 'M', text: 'Available in blue, black, or white.' },
    ],
    translation: '',
    keyPhrases: [],
  },
];

const EL2_SET16: ListeningProblem = {
  id: 'q_el2_set16',
  category: '第16回 対話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL2_SET16_TRACKS,
  text: `第16回　第2問（3問・2回読み）　【難易度：標準】

第2問では、2人の短い対話と英語の設問が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の問題文のすぐ下にある再生ボタンから、その問だけを何度でも聞けます。本番は2回読みなので、まずは2回だけ聞いて答えを決めてください。

【解き方のコツ】
音声が流れる前に「場面」を読み、4枚の絵を見比べて「どこが違うか」を1語で言えるようにしておきます（色・数・位置・あり／なし）。違いが分かっていれば、聞き取るべき1語が決まります。第2問は「No, actually …」「the other one」のような訂正が最頻出なので、最初に聞こえた候補で決めないことが大切です。

────────────────────
問1（話者：女性（店員） / 男性（客））
場面：男女がケーキ屋でギフト用のケーキを選んでいる。
Question: Which cake will the man buy?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問2（話者：男性 / 女性）
場面：男女が学校の靴箱の位置を確認している。
Question: Which locker is the man's?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）

────────────────────
問3（話者：女性（客） / 男性（店員））
場面：男女がスポーツ用品店でテニスラケットを選んでいる。
Question: Which racket will the woman likely choose (based on the recommended features)?
イラスト①〜④から、対話と設問の内容に合うものを選びなさい。（2×2の4枚から選択）`,
  subQuestions: [
    {
      id: 'q_el2_set16_1',
      label: '問1 Which cake will the man buy?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 68,
      imageUrl: '/listening_q2/el2_set16_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '「フルーツは好きだが苺はアレルギー」の情報から桃を新たに提案',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set16_2',
      label: '問2 Which locker is the man\'s?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 65,
      imageUrl: '/listening_q2/el2_set16_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '女性の思い込み（row B, second from the top）を they moved me to row C が訂正し',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
    {
      id: 'q_el2_set16_3',
      label: '問3 Which racket will the woman likely choose (based on the recommended features)?',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 62,
      imageUrl: '/listening_q2/el2_set16_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④の4枚）',
      detailedExplanation: {
        theme: '色は「どれでもよい」ため無関係',
        type: 'イラスト選択型（短い対話）',
        difficulty: 3,
        steps: [
          '① 音声の前に「場面（日本語）」を読み、4枚の絵の違いを1語で言語化する（色・数・位置・有無）',
          '② 1回目は流れをつかむ。候補を2つに絞れれば十分（1枚に決めきらない）',
          '③ 2回目で決め手の1語を確認する。No, actually / the other one / but の後ろが結論',
          '④ 設問の主語（the man / the woman）を必ず見る。相手の発言を答えにしない',
        ],
      },
    },
  ],
  explanation: `第16回（難易度：標準）の解説です。対話スクリプトと正解、そして PDF の解説をそのまま収録しています。各選択肢がどんな絵だったかも併せて載せているので、「どこを聞き分ければよかったか」を絵と対応させて確認できます。

問1　正解は ④
場面：男女がケーキ屋でギフト用のケーキを選んでいる。（話者：女性（店員） / 男性（客））
スクリプト：W: We have chocolate, strawberry, and cheesecake.
M: She loves fruits, but not strawberries. Actually, she's allergic to them.
W: How about our peach cake, then?
M: Perfect. I'll take that.
Question: Which cake will the man buy?
選択肢のイラスト：
① チョコレートケーキ
② 苺のショートケーキ
③ チーズケーキ
④ 桃のケーキ
正解の選択肢：④ 桃のケーキ
「フルーツは好きだが苺はアレルギー」の情報から桃を新たに提案。3択→アレルギー→新提案の流 れ。

問2　正解は ③
場面：男女が学校の靴箱の位置を確認している。（話者：男性 / 女性）
スクリプト：M: Could you put my gym bag in my shoe locker?
W: Sure. It's in row B, second from the top, isn't it?
M: It used to be, but they moved me to row C.
W: Row C. Which one?
M: Third from the top.
Question: Which locker is the man's?
選択肢のイラスト：
① B列 上から2段目
② B列 上から3段目
③ C列 上から3段目
④ A列 上から3段目
正解の選択肢：③ C列 上から3段目
女性の思い込み（row B, second from the top）を they moved me to row C が訂正し、Third from the top で段が確定する。列の訂正と段の指定を2段階で追う。①は訂正される前の位置、②は段だけ合っていて列が古い、④は列が違う。

問3　正解は ③
場面：男女がスポーツ用品店でテニスラケットを選んでいる。（話者：女性（客） / 男性（店員））
スクリプト：W: I'm a beginner. Which racket do you recommend?
M: This lightweight one is good for beginners. It has a larger head.
W: And the color?
M: Available in blue, black, or white.
Question: Which racket will the woman likely choose (based on the recommended features)?
選択肢のイラスト：
① 重量級・ヘッド大きめ
② 軽量・ヘッド小さめ
③ 軽量・ヘッド大きめ
④ 重量級・ヘッド小さめ
正解の選択肢：③ 軽量・ヘッド大きめ
色は「どれでもよい」ため無関係。lightweight + larger head の2条件で決定。属性の掛け合わせ。`,
  surroundingKnowledge: [
    '第2問は2回読み。1回目で候補を2つに絞り、2回目で決め手を確認する二段構えが基本。',
    '「訂正の型」が最頻出。No, actually … / the other one / not A but B の後ろが答えになる。',
    '属性の絞り込み（色・形・サイズ・柄・数）は3条件以上重なる。1条件だけ合う絵はダミー。',
    '消去法の型もある。3つが否定されたら、残った1つが答え。',
    '値段・時刻・曜日は「安いほう」「間に合うほう」など優先条件で決まることが多い。',
    '設問の主語（the man / the woman）の取り違えが失点の定番。誰の行動を聞かれているか確認する。',
  ],
  deepDiveTopics: [
    '絵の違いを先に言語化しておくと、聞くべき1語が決まる。これだけで正答率が変わる。',
    '聞こえた単語がそのまま当てはまる絵はダミーであることが多い（音の一致に頼らない）。',
    '対話は「提案 → 難点 → 修正案 → 合意」の型が多い。最後に合意した内容が答え。',
  ],
};

/** 第2問の演習セット一覧（イラストが揃っている 16 セット 48 問）。 */
export const EL2_PROBLEMS: ListeningProblem[] = [
  EL2_SET1,
  EL2_SET2,
  EL2_SET3,
  EL2_SET4,
  EL2_SET5,
  EL2_SET6,
  EL2_SET7,
  EL2_SET8,
  EL2_SET9,
  EL2_SET10,
  EL2_SET11,
  EL2_SET12,
  EL2_SET13,
  EL2_SET14,
  EL2_SET15,
  EL2_SET16,
];
