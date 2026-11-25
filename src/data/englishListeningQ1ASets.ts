/**
 * ===================================================================
 * 英語リスニング 第1問 A ― 類題集（第2回〜第14回）
 * ===================================================================
 *
 * 出典
 *   配布 PDF「共通テスト_英語リスニング_第1問A_類題集_13セット.pdf」の
 *   13セット（各4問・計52問）をそのまま収録している。
 *   第1回（englishListeningQ1AProblems.ts の EL1_A_SET1）とは別内容なので、
 *   PDF の第1〜13セットを「第2回〜第14回」として続き番号で並べる。
 *
 * 生成方法（手打ちしていない理由）
 *   52問を手で書き写すと選択肢と正解の対応ズレが必ず混入する。
 *   scripts/listening-data/parse_listening_pdf.py で PDF テキストを JSON 化し、
 *   scripts/listening-data/gen_listening_data.py がこのファイルを生成している。
 *   問題文・選択肢・正解・スクリプト・解説はすべて PDF の原文どおり。
 *
 * 音源について
 *   提供された高品質MP3を audioUrl で参照する。各ファイルは原稿1回分。
 *   再生回数は readCount に従いアプリ側で制御する。
 *   対応原稿・SHA-256・出典は scripts/data/listening_premium_manifest.json に記録。
 *
 * 選択肢の表記
 *   options は ①〜④ のマーク（MARK_OPTIONS）だけを持ち、英文本体は text 側に置く。
 *   第1回と同じ設計で、スマホでも解答チップが小さく収まりマークシートと対応する。
 */

import type { ListeningAudioTrack, ListeningProblem } from './englishListeningQ1AProblems';

/** 解答チップはマークのみ（英文は問題文ペインに表示する）。 */
const MARK_OPTIONS = ['①', '②', '③', '④'];


const EL1_A_SET2_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_A_set2_1',
    audioUrl: '/listening_audio/el1A_set2_q1.mp3',
    label: '問1',
    hint: '女性（高校生）',
    script: 'I\'m really sleepy. I think I\'ll go to bed early tonight.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set2_2',
    audioUrl: '/listening_audio/el1A_set2_q2.mp3',
    label: '問2',
    hint: '男性（会社員）',
    script: 'The train was crowded this morning, so I had to stand all the way to the office.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set2_3',
    audioUrl: '/listening_audio/el1A_set2_q3.mp3',
    label: '問3',
    hint: '女の子（小学生）',
    script: 'Dad, I\'ve finished my homework. Can I watch TV now?',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set2_4',
    audioUrl: '/listening_audio/el1A_set2_q4.mp3',
    label: '問4',
    hint: '女性（高校生）',
    script: 'There are fifteen books on the shelf, and I\'ll add five more from the library.',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_A_SET2: ListeningProblem = {
  id: 'q_el1_A_set2',
  category: '第2回 短い発話の言い換え（易しめ（導入））',
  readCount: 2,
  audioTracks: EL1_A_SET2_TRACKS,
  text: `第2回　第1問 A（4問・2回読み）　【難易度：易しめ（導入）】

第1問 A では、短い英文が2回読まれます。その内容に最も近い意味の英文を、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。本番と同じ条件で練習したいときは「2回続けて」を使ってください。

────────────────────
問1（話者：女性（高校生））
① She went to bed early last night.
② She plans to go to bed early tonight.
③ She is not sleepy at all.
④ She will stay up late tonight.

────────────────────
問2（話者：男性（会社員））
① He found a seat on the train.
② He drove to the office.
③ He stood on the train the whole way.
④ He took a bus to the office.

────────────────────
問3（話者：女の子（小学生））
① She wants to do her homework.
② She is asking permission to watch TV.
③ She hasn't done her homework yet.
④ She wants her dad to watch TV.

────────────────────
問4（話者：女性（高校生））
① There will be ten books on the shelf.
② There are twenty books on the shelf now.
③ There will be twenty books on the shelf.
④ She will return five books to the library.`,
  subQuestions: [
    {
      id: 'q_el1_A_set2_1',
      label: '問1 話者（女性（高校生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 78,
      detailedExplanation: {
        theme: '将来の意志（I\'ll go to bed early tonight）を問う基本問題',
        type: '言い換え型',
        difficulty: 2,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set2_2',
      label: '問2 話者（男性（会社員））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 75,
      detailedExplanation: {
        theme: 'had to stand all the way（ずっと立っていた）が要点',
        type: '言い換え型',
        difficulty: 2,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set2_3',
      label: '問3 話者（女の子（小学生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 72,
      detailedExplanation: {
        theme: 'Can I〜? は許可を求める依頼表現',
        type: '言い換え型',
        difficulty: 2,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set2_4',
      label: '問4 話者（男性（高校生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 69,
      detailedExplanation: {
        theme: '数字の計算問題',
        type: '言い換え型',
        difficulty: 2,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
  ],
  explanation: `第2回（PDF 第1セット・難易度：易しめ（導入））の解説です。スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ②
スクリプト：I'm really sleepy. I think I'll go to bed early tonight.
正解の選択肢：She plans to go to bed early tonight.
将来の意志（I'll go to bed early tonight）を問う基本問題。①は last night（過去）、④は逆の意味。時制に注意。

問2　正解は ③
スクリプト：The train was crowded this morning, so I had to stand all the way to the office.
正解の選択肢：He stood on the train the whole way.
had to stand all the way（ずっと立っていた）が要点。①は否定の反転、②④は交通手段の入れ替えという典型のひっかけ。

問3　正解は ②
スクリプト：Dad, I've finished my homework. Can I watch TV now?
正解の選択肢：She is asking permission to watch TV.
Can I〜? は許可を求める依頼表現。完了形 I've finished と③の haven't done が対になっている。

問4　正解は ③
スクリプト：There are fifteen books on the shelf, and I'll add five more from the library.
正解の選択肢：There will be twenty books on the shelf.
数字の計算問題。15冊＋5冊＝20冊になるのは未来。②は時制（now）の混同を狙った選択肢。`,
  surroundingKnowledge: [
    '第1問 A は2回読み。1回目で全体像と数字、2回目で場所・人・理由を確認する。',
    '否定（not / never / no longer）を聞き逃すと意味が正反対になる。最優先で聞き取る。',
    'usually / normally ↔ today / this time の対比が出たら、頭の中に2列の表を作る。',
    '数量は聞こえた順にメモし、あとから ＋／− の符号を付けて計算する。',
    '選択肢の誤りは「逆の意味」「未出情報」「細部のすり替え」「計算の途中値」のどれか。',
  ],
  deepDiveTopics: [
    '言い換え（パラフレーズ）の型を蓄積する。肯定↔否定の裏返しが第1問Aの最頻出。',
    '設問文の限定語（today / for tomorrow / this week）が答えの範囲を決める。',
    '聞こえた単語がそのまま入っている選択肢は、たいてい誤りである（音の一致に頼らない）。',
  ],
};

const EL1_A_SET3_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_A_set3_1',
    audioUrl: '/listening_audio/el1A_set3_q1.mp3',
    label: '問1',
    hint: '女性（母親）',
    script: 'Kenji, your hands are dirty. Wash them before dinner.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set3_2',
    audioUrl: '/listening_audio/el1A_set3_q2.mp3',
    label: '問2',
    hint: '男性（大学生）',
    script: 'I usually play tennis on Sundays, but this week I have a part-time job.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set3_3',
    audioUrl: '/listening_audio/el1A_set3_q3.mp3',
    label: '問3',
    hint: '男性（店員）',
    script: 'This coupon can only be used on weekdays, not on weekends.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set3_4',
    audioUrl: '/listening_audio/el1A_set3_q4.mp3',
    label: '問4',
    hint: '少年（中学生）',
    script: 'My sister promised to lend me her bike, so I don\'t need to walk to school tomorrow.',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_A_SET3: ListeningProblem = {
  id: 'q_el1_A_set3',
  category: '第3回 短い発話の言い換え（標準）',
  readCount: 2,
  audioTracks: EL1_A_SET3_TRACKS,
  text: `第3回　第1問 A（4問・2回読み）　【難易度：標準】

第1問 A では、短い英文が2回読まれます。その内容に最も近い意味の英文を、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。本番と同じ条件で練習したいときは「2回続けて」を使ってください。

────────────────────
問1（話者：女性（母親））
① She washed his hands for him.
② She tells him to wash his hands before eating.
③ Dinner is already on the table.
④ He washed his hands after dinner.

────────────────────
問2（話者：男性（大学生））
① He will play tennis this Sunday.
② He works part-time every Sunday.
③ He can't play tennis this Sunday.
④ He quit his part-time job.

────────────────────
問3（話者：男性（店員））
① The coupon can be used on weekends.
② The coupon can be used on weekdays.
③ The coupon has already expired.
④ The coupon can be used any day.

────────────────────
問4（話者：少年（中学生））
① He will walk to school tomorrow.
② He bought a new bike yesterday.
③ He can use his sister's bike tomorrow.
④ His sister will walk to school.`,
  subQuestions: [
    {
      id: 'q_el1_A_set3_1',
      label: '問1 話者（女性（母親））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 66,
      detailedExplanation: {
        theme: '命令文 Wash them before dinner が要点',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set3_2',
      label: '問2 話者（男性（大学生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 63,
      detailedExplanation: {
        theme: 'usually（いつもは）と but this week の対比が核心',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set3_3',
      label: '問3 話者（女性（店員））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: 'only weekdays, not weekends の限定と否定',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set3_4',
      label: '問4 話者（少年（中学生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: 'don\'t need to walk（歩かなくてよい）の否定を正しく取れるか',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
  ],
  explanation: `第3回（PDF 第2セット・難易度：標準）の解説です。スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ②
スクリプト：Kenji, your hands are dirty. Wash them before dinner.
正解の選択肢：She tells him to wash his hands before eating.
命令文 Wash them before dinner が要点。④は before / after の時間関係の入れ替え。

問2　正解は ③
スクリプト：I usually play tennis on Sundays, but this week I have a part-time job.
正解の選択肢：He can't play tennis this Sunday.
usually（いつもは）と but this week の対比が核心。「今週はできない」を選ばせる2022年問4型。

問3　正解は ②
スクリプト：This coupon can only be used on weekdays, not on weekends.
正解の選択肢：The coupon can be used on weekdays.
only weekdays, not weekends の限定と否定。①④は否定の反転。③の expired は未言及。

問4　正解は ③
スクリプト：My sister promised to lend me her bike, so I don't need to walk to school tomorrow.
正解の選択肢：He can use his sister's bike tomorrow.
don't need to walk（歩かなくてよい）の否定を正しく取れるか。①は反転、④は主語の入れ替え。`,
  surroundingKnowledge: [
    '第1問 A は2回読み。1回目で全体像と数字、2回目で場所・人・理由を確認する。',
    '否定（not / never / no longer）を聞き逃すと意味が正反対になる。最優先で聞き取る。',
    'usually / normally ↔ today / this time の対比が出たら、頭の中に2列の表を作る。',
    '数量は聞こえた順にメモし、あとから ＋／− の符号を付けて計算する。',
    '選択肢の誤りは「逆の意味」「未出情報」「細部のすり替え」「計算の途中値」のどれか。',
  ],
  deepDiveTopics: [
    '言い換え（パラフレーズ）の型を蓄積する。肯定↔否定の裏返しが第1問Aの最頻出。',
    '設問文の限定語（today / for tomorrow / this week）が答えの範囲を決める。',
    '聞こえた単語がそのまま入っている選択肢は、たいてい誤りである（音の一致に頼らない）。',
  ],
};

const EL1_A_SET4_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_A_set4_1',
    audioUrl: '/listening_audio/el1A_set4_q1.mp3',
    label: '問1',
    hint: '女性（高校生）',
    script: 'It\'s getting windy. Should we close the windows?',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set4_2',
    audioUrl: '/listening_audio/el1A_set4_q2.mp3',
    label: '問2',
    hint: '女性（母親）',
    script: 'I haven\'t fixed the chair yet, but I\'ve already bought the tools.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set4_3',
    audioUrl: '/listening_audio/el1A_set4_q3.mp3',
    label: '問3',
    hint: '女の子（小学生）',
    script: 'Grandma sent me a sweater she made. Look, it has a cat on it!',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set4_4',
    audioUrl: '/listening_audio/el1A_set4_q4.mp3',
    label: '問4',
    hint: '男性（高校生）',
    script: 'The museum is free for students today, but we\'ll still have to pay for the special show.',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_A_SET4: ListeningProblem = {
  id: 'q_el1_A_set4',
  category: '第4回 短い発話の言い換え（標準）',
  readCount: 2,
  audioTracks: EL1_A_SET4_TRACKS,
  text: `第4回　第1問 A（4問・2回読み）　【難易度：標準】

第1問 A では、短い英文が2回読まれます。その内容に最も近い意味の英文を、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。本番と同じ条件で練習したいときは「2回続けて」を使ってください。

────────────────────
問1（話者：女性（高校生））
① She suggests closing the windows.
② She has opened the windows.
③ The windows are broken.
④ She wants to go outside.

────────────────────
問2（話者：女性（母親））
① She has already fixed the chair.
② She has already bought the tools.
③ She still needs to buy the tools.
④ She broke the chair yesterday.

────────────────────
問3（話者：女の子（小学生））
① She sent a sweater to her grandma.
② She made a sweater with a cat on it.
③ She received a handmade sweater from her grandma.
④ Her grandma has a pet cat.

────────────────────
問4（話者：男性（高校生））
① Everything at the museum is free today.
② Students must pay for everything.
③ The special show is not free.
④ The museum is closed today.`,
  subQuestions: [
    {
      id: 'q_el1_A_set4_1',
      label: '問1 話者（女性（高校生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 66,
      detailedExplanation: {
        theme: 'Should we〜? は提案表現',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set4_2',
      label: '問2 話者（男性（父親））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 63,
      detailedExplanation: {
        theme: '2023年問2型',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set4_3',
      label: '問3 話者（女の子（小学生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: '2023年問3型',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set4_4',
      label: '問4 話者（男性（高校生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: 'free と have to pay for の対比',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
  ],
  explanation: `第4回（PDF 第3セット・難易度：標準）の解説です。スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ①
スクリプト：It's getting windy. Should we close the windows?
正解の選択肢：She suggests closing the windows.
Should we〜? は提案表現。2021年問2の How about〜? と同型。「閉める／開ける」の反転に注意。

問2　正解は ②
スクリプト：I haven't fixed the chair yet, but I've already bought the tools.
正解の選択肢：She has already bought the tools.
2023年問2型。haven't fixed yet と already bought の完了形2つを聞き分ける。部分一致の選択肢を正確に。

問3　正解は ③
スクリプト：Grandma sent me a sweater she made. Look, it has a cat on it!
正解の選択肢：She received a handmade sweater from her grandma.
2023年問3型。sent me（受け取った）と①の sent to（送った）の主語・方向の入れ替えが最大のひっかけ。

問4　正解は ③
スクリプト：The museum is free for students today, but we'll still have to pay for the special show.
正解の選択肢：The special show is not free.
free と have to pay for の対比。①②は全称への拡大解釈。but の後が正解の手がかり。`,
  surroundingKnowledge: [
    '第1問 A は2回読み。1回目で全体像と数字、2回目で場所・人・理由を確認する。',
    '否定（not / never / no longer）を聞き逃すと意味が正反対になる。最優先で聞き取る。',
    'usually / normally ↔ today / this time の対比が出たら、頭の中に2列の表を作る。',
    '数量は聞こえた順にメモし、あとから ＋／− の符号を付けて計算する。',
    '選択肢の誤りは「逆の意味」「未出情報」「細部のすり替え」「計算の途中値」のどれか。',
  ],
  deepDiveTopics: [
    '言い換え（パラフレーズ）の型を蓄積する。肯定↔否定の裏返しが第1問Aの最頻出。',
    '設問文の限定語（today / for tomorrow / this week）が答えの範囲を決める。',
    '聞こえた単語がそのまま入っている選択肢は、たいてい誤りである（音の一致に頼らない）。',
  ],
};

const EL1_A_SET5_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_A_set5_1',
    audioUrl: '/listening_audio/el1A_set5_q1.mp3',
    label: '問1',
    hint: '女性（会社員）',
    script: 'Instead of taking the subway, why don\'t we walk? It\'s only a ten-minute walk.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set5_2',
    audioUrl: '/listening_audio/el1A_set5_q2.mp3',
    label: '問2',
    hint: '女性（図書館の司書）',
    script: 'You won\'t be able to enter the library after six, so please come before then.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set5_3',
    audioUrl: '/listening_audio/el1A_set5_q3.mp3',
    label: '問3',
    hint: '女性（高校生）',
    script: 'Not many people came to practice this morning, but almost everyone will be here in the afternoon.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set5_4',
    audioUrl: '/listening_audio/el1A_set5_q4.mp3',
    label: '問4',
    hint: '男性（大学生）',
    script: 'I was going to buy the blue bag, but it was sold out, so I got the black one instead.',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_A_SET5: ListeningProblem = {
  id: 'q_el1_A_set5',
  category: '第5回 短い発話の言い換え（やや難）',
  readCount: 2,
  audioTracks: EL1_A_SET5_TRACKS,
  text: `第5回　第1問 A（4問・2回読み）　【難易度：やや難】

第1問 A では、短い英文が2回読まれます。その内容に最も近い意味の英文を、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。本番と同じ条件で練習したいときは「2回続けて」を使ってください。

────────────────────
問1（話者：女性（会社員））
① She suggests taking the subway.
② She suggests walking instead.
③ It takes ten minutes by subway.
④ She doesn't want to go out.

────────────────────
問2（話者：女性（図書館の司書））
① The library closes at five.
② You can enter the library after six.
③ You should come before six o'clock.
④ She will open the library at six.

────────────────────
問3（話者：女性（高校生））
① Everyone came to practice in the morning.
② Few people came to practice in the morning.
③ Nobody will come in the afternoon.
④ Today's practice has been canceled.

────────────────────
問4（話者：男性（大学生））
① He bought the blue bag.
② The black bag was sold out.
③ He bought the black bag.
④ He didn't buy any bag.`,
  subQuestions: [
    {
      id: 'q_el1_A_set5_1',
      label: '問1 話者（女性（会社員））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: '2024年問1型',
        type: '言い換え型',
        difficulty: 4,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set5_2',
      label: '問2 話者（男性（図書館の司書））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 51,
      detailedExplanation: {
        theme: '否定＋未来形 won\'t be able to の裏返し',
        type: '言い換え型',
        difficulty: 4,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set5_3',
      label: '問3 話者（女性（高校生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 48,
      detailedExplanation: {
        theme: '2022年問1型',
        type: '言い換え型',
        difficulty: 4,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set5_4',
      label: '問4 話者（男性（大学生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 45,
      detailedExplanation: {
        theme: 'was going to（するつもりだった）と結果 so I got the black one の食い違いがひっかけ',
        type: '言い換え型',
        difficulty: 4,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
  ],
  explanation: `第5回（PDF 第4セット・難易度：やや難）の解説です。スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ②
スクリプト：Instead of taking the subway, why don't we walk? It's only a ten-minute walk.
正解の選択肢：She suggests walking instead.
2024年問1型。instead of A＝Aではなく、と読み替える。why don't we〜は提案。

問2　正解は ③
スクリプト：You won't be able to enter the library after six, so please come before then.
正解の選択肢：You should come before six o'clock.
否定＋未来形 won't be able to の裏返し。before then の then が six を指すことの把握が鍵。

問3　正解は ②
スクリプト：Not many people came to practice this morning, but almost everyone will be here in the afternoon.
正解の選択肢：Few people came to practice in the morning.
2022年問1型。not many＝few の言い換え。午前と午後の人数の対比を整理する。

問4　正解は ③
スクリプト：I was going to buy the blue bag, but it was sold out, so I got the black one instead.
正解の選択肢：He bought the black bag.
was going to（するつもりだった）と結果 so I got the black one の食い違いがひっかけ。色の入れ替えに注意。`,
  surroundingKnowledge: [
    '第1問 A は2回読み。1回目で全体像と数字、2回目で場所・人・理由を確認する。',
    '否定（not / never / no longer）を聞き逃すと意味が正反対になる。最優先で聞き取る。',
    'usually / normally ↔ today / this time の対比が出たら、頭の中に2列の表を作る。',
    '数量は聞こえた順にメモし、あとから ＋／− の符号を付けて計算する。',
    '選択肢の誤りは「逆の意味」「未出情報」「細部のすり替え」「計算の途中値」のどれか。',
  ],
  deepDiveTopics: [
    '言い換え（パラフレーズ）の型を蓄積する。肯定↔否定の裏返しが第1問Aの最頻出。',
    '設問文の限定語（today / for tomorrow / this week）が答えの範囲を決める。',
    '聞こえた単語がそのまま入っている選択肢は、たいてい誤りである（音の一致に頼らない）。',
  ],
};

const EL1_A_SET6_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_A_set6_1',
    audioUrl: '/listening_audio/el1A_set6_q1.mp3',
    label: '問1',
    hint: '少年（中学生）',
    script: 'Mom, can you pick me up at the station? It\'s pouring outside.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set6_2',
    audioUrl: '/listening_audio/el1A_set6_q2.mp3',
    label: '問2',
    hint: '男性（病院の受付係）',
    script: 'The doctor will see you in about twenty minutes. Please have a seat over there.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set6_3',
    audioUrl: '/listening_audio/el1A_set6_q3.mp3',
    label: '問3',
    hint: '男性（高校生）',
    script: 'I didn\'t forget my umbrella today. It\'s right here in my bag.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set6_4',
    audioUrl: '/listening_audio/el1A_set6_q4.mp3',
    label: '問4',
    hint: '女性（大学生）',
    script: 'There were thirty tickets this morning, but only eight are left now.',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_A_SET6: ListeningProblem = {
  id: 'q_el1_A_set6',
  category: '第6回 短い発話の言い換え（標準）',
  readCount: 2,
  audioTracks: EL1_A_SET6_TRACKS,
  text: `第6回　第1問 A（4問・2回読み）　【難易度：標準】

第1問 A では、短い英文が2回読まれます。その内容に最も近い意味の英文を、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。本番と同じ条件で練習したいときは「2回続けて」を使ってください。

────────────────────
問1（話者：少年（中学生））
① He wants his mom to drive him home from the station.
② He is driving his mom to the station.
③ He will walk home in the rain.
④ He is asking her to bring an umbrella.

────────────────────
問2（話者：男性（病院の受付係・女性患者に話している））
① The doctor is seeing her right now.
② She should wait for about twenty minutes.
③ She needs to come back tomorrow.
④ Her appointment has finished.

────────────────────
問3（話者：男性（高校生））
① He forgot his umbrella today.
② He has his umbrella with him.
③ His umbrella is still at home.
④ He lost his umbrella yesterday.

────────────────────
問4（話者：女性（大学生））
① Eight tickets have been sold.
② Thirty tickets are still left.
③ Eight tickets remain now.
④ All the tickets are sold out.`,
  subQuestions: [
    {
      id: 'q_el1_A_set6_1',
      label: '問1 話者（少年（中学生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 66,
      detailedExplanation: {
        theme: '2025年問1型',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set6_2',
      label: '問2 話者（女性（病院の受付係））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 63,
      detailedExplanation: {
        theme: 'in about twenty minutes（あと約20分で）',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set6_3',
      label: '問3 話者（男性（高校生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: '2022年問3型',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set6_4',
      label: '問4 話者（女性（大学生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '2023年問4型の数字問題',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
  ],
  explanation: `第6回（PDF 第5セット・難易度：標準）の解説です。スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ①
スクリプト：Mom, can you pick me up at the station? It's pouring outside.
正解の選択肢：He wants his mom to drive him home from the station.
2025年問1型。can you〜? の依頼＋pick me up（車で迎えに来る）。④は傘・車のすり替え。

問2　正解は ②
スクリプト：The doctor will see you in about twenty minutes. Please have a seat over there.
正解の選択肢：She should wait for about twenty minutes.
in about twenty minutes（あと約20分で）。未来の時間を正確に取る基本問題。

問3　正解は ②
スクリプト：I didn't forget my umbrella today. It's right here in my bag.
正解の選択肢：He has his umbrella with him.
2022年問3型。didn't forget（忘れなかった）の否定を肯定と誤認させるひっかけ。

問4　正解は ③
スクリプト：There were thirty tickets this morning, but only eight are left now.
正解の選択肢：Eight tickets remain now.
2023年問4型の数字問題。30枚→残り8枚。sold と left の主語の違いで①を引っかける。`,
  surroundingKnowledge: [
    '第1問 A は2回読み。1回目で全体像と数字、2回目で場所・人・理由を確認する。',
    '否定（not / never / no longer）を聞き逃すと意味が正反対になる。最優先で聞き取る。',
    'usually / normally ↔ today / this time の対比が出たら、頭の中に2列の表を作る。',
    '数量は聞こえた順にメモし、あとから ＋／− の符号を付けて計算する。',
    '選択肢の誤りは「逆の意味」「未出情報」「細部のすり替え」「計算の途中値」のどれか。',
  ],
  deepDiveTopics: [
    '言い換え（パラフレーズ）の型を蓄積する。肯定↔否定の裏返しが第1問Aの最頻出。',
    '設問文の限定語（today / for tomorrow / this week）が答えの範囲を決める。',
    '聞こえた単語がそのまま入っている選択肢は、たいてい誤りである（音の一致に頼らない）。',
  ],
};

const EL1_A_SET7_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_A_set7_1',
    audioUrl: '/listening_audio/el1A_set7_q1.mp3',
    label: '問1',
    hint: '女性（お年寄り）',
    script: 'I used to walk to the park every day, but these days my knees hurt, so I take the bus.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set7_2',
    audioUrl: '/listening_audio/el1A_set7_q2.mp3',
    label: '問2',
    hint: '女性（高校生）',
    script: 'Let\'s not start the movie until Yuki gets here.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set7_3',
    audioUrl: '/listening_audio/el1A_set7_q3.mp3',
    label: '問3',
    hint: '女性（家電量販店の店員）',
    script: 'This camera doesn\'t come with a memory card, so you\'ll have to buy one separately.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set7_4',
    audioUrl: '/listening_audio/el1A_set7_q4.mp3',
    label: '問4',
    hint: '女の子（小学生）',
    script: 'I made twenty-four cookies, and my brother ate six while I was out.',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_A_SET7: ListeningProblem = {
  id: 'q_el1_A_set7',
  category: '第7回 短い発話の言い換え（標準）',
  readCount: 2,
  audioTracks: EL1_A_SET7_TRACKS,
  text: `第7回　第1問 A（4問・2回読み）　【難易度：標準】

第1問 A では、短い英文が2回読まれます。その内容に最も近い意味の英文を、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。本番と同じ条件で練習したいときは「2回続けて」を使ってください。

────────────────────
問1（話者：女性（お年寄り））
① She walks to the park every day now.
② She goes to the park by bus now.
③ She doesn't go to the park anymore.
④ She drives her car to the park.

────────────────────
問2（話者：女性（高校生））
① They will start the movie right now.
② They should wait for Yuki before starting.
③ Yuki has already arrived.
④ They have canceled the movie.

────────────────────
問3（話者：女性（家電量販店の店員））
① A memory card is included with the camera.
② The camera is free of charge.
③ You need to buy a memory card separately.
④ The store doesn't sell memory cards.

────────────────────
問4（話者：女の子（小学生））
① Six cookies are left now.
② Her brother made six cookies.
③ Eighteen cookies are left now.
④ She ate twenty-four cookies.`,
  subQuestions: [
    {
      id: 'q_el1_A_set7_1',
      label: '問1 話者（男性（お年寄り））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 66,
      detailedExplanation: {
        theme: 'used to（以前は）と these days（最近は）の時制対比',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set7_2',
      label: '問2 話者（女性（高校生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 63,
      detailedExplanation: {
        theme: '2025年問2型',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set7_3',
      label: '問3 話者（男性（家電量販店の店員））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: 'doesn\'t come with（付属していない）の否定表現',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set7_4',
      label: '問4 話者（女の子（小学生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '数字の計算',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
  ],
  explanation: `第7回（PDF 第6セット・難易度：標準）の解説です。スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ②
スクリプト：I used to walk to the park every day, but these days my knees hurt, so I take the bus.
正解の選択肢：She goes to the park by bus now.
used to（以前は）と these days（最近は）の時制対比。過去の習慣と現在の習慣を混同させる問題。

問2　正解は ②
スクリプト：Let's not start the movie until Yuki gets here.
正解の選択肢：They should wait for Yuki before starting.
2025年問2型。Let's not〜until〜（〜するまで〜しない）構文。until の時間関係が要点。

問3　正解は ③
スクリプト：This camera doesn't come with a memory card, so you'll have to buy one separately.
正解の選択肢：You need to buy a memory card separately.
doesn't come with（付属していない）の否定表現。①は反転。buy one separately が結論。

問4　正解は ③
スクリプト：I made twenty-four cookies, and my brother ate six while I was out.
正解の選択肢：Eighteen cookies are left now.
数字の計算。24−6＝18。作った人／食べた人の主語の入れ替え（②④）もひっかけ。`,
  surroundingKnowledge: [
    '第1問 A は2回読み。1回目で全体像と数字、2回目で場所・人・理由を確認する。',
    '否定（not / never / no longer）を聞き逃すと意味が正反対になる。最優先で聞き取る。',
    'usually / normally ↔ today / this time の対比が出たら、頭の中に2列の表を作る。',
    '数量は聞こえた順にメモし、あとから ＋／− の符号を付けて計算する。',
    '選択肢の誤りは「逆の意味」「未出情報」「細部のすり替え」「計算の途中値」のどれか。',
  ],
  deepDiveTopics: [
    '言い換え（パラフレーズ）の型を蓄積する。肯定↔否定の裏返しが第1問Aの最頻出。',
    '設問文の限定語（today / for tomorrow / this week）が答えの範囲を決める。',
    '聞こえた単語がそのまま入っている選択肢は、たいてい誤りである（音の一致に頼らない）。',
  ],
};

const EL1_A_SET8_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_A_set8_1',
    audioUrl: '/listening_audio/el1A_set8_q1.mp3',
    label: '問1',
    hint: '女性（マンションの管理人）',
    script: 'The elevator isn\'t working today. Could you use the stairs, please?',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set8_2',
    audioUrl: '/listening_audio/el1A_set8_q2.mp3',
    label: '問2',
    hint: '男性（高校生）',
    script: 'I\'ve already read three of the five books for my report, so just two more to go.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set8_3',
    audioUrl: '/listening_audio/el1A_set8_q3.mp3',
    label: '問3',
    hint: '女性（母親）',
    script: 'Don\'t put the milk back in the fridge. I\'ll use it for the cake now.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set8_4',
    audioUrl: '/listening_audio/el1A_set8_q4.mp3',
    label: '問4',
    hint: '男性（大学生）',
    script: 'The concert starts at seven, but let\'s meet at the station at six to get good seats.',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_A_SET8: ListeningProblem = {
  id: 'q_el1_A_set8',
  category: '第8回 短い発話の言い換え（標準）',
  readCount: 2,
  audioTracks: EL1_A_SET8_TRACKS,
  text: `第8回　第1問 A（4問・2回読み）　【難易度：標準】

第1問 A では、短い英文が2回読まれます。その内容に最も近い意味の英文を、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。本番と同じ条件で練習したいときは「2回続けて」を使ってください。

────────────────────
問1（話者：女性（マンションの管理人））
① She asks him to use the stairs.
② The elevator is working fine.
③ She will fix the elevator today.
④ She asks him to wait for the elevator.

────────────────────
問2（話者：男性（高校生））
① He has read all five books.
② He has finished only two books.
③ He still has two books left to read.
④ He hasn't started reading yet.

────────────────────
問3（話者：女性（母親））
① She wants him to put the milk away.
② She will use the milk right away.
③ The milk is already in the fridge.
④ She has already finished the cake.

────────────────────
問4（話者：男性（大学生））
① The concert starts at six.
② They will meet at the hall at seven.
③ They plan to meet at six o'clock.
④ He wants to meet after the concert.`,
  subQuestions: [
    {
      id: 'q_el1_A_set8_1',
      label: '問1 話者（女性（マンションの管理人））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 66,
      detailedExplanation: {
        theme: '2023年問1型',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set8_2',
      label: '問2 話者（男性（高校生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 63,
      detailedExplanation: {
        theme: '数量の整理',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set8_3',
      label: '問3 話者（女性（母親））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: 'Don\'t put back（戻さないで）の否定命令＋I\'ll use it now の未来',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set8_4',
      label: '問4 話者（男性（大学生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '2024年問2型',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
  ],
  explanation: `第8回（PDF 第7セット・難易度：標準）の解説です。スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ①
スクリプト：The elevator isn't working today. Could you use the stairs, please?
正解の選択肢：She asks him to use the stairs.
2023年問1型。isn't working の否定＋Could you〜? の依頼。階段を使うよう頼んでいる。

問2　正解は ③
スクリプト：I've already read three of the five books for my report, so just two more to go.
正解の選択肢：He still has two books left to read.
数量の整理。5冊中3冊読了→残り2冊。two more to go（あと2冊）の to go が聞き取りのポイント。

問3　正解は ②
スクリプト：Don't put the milk back in the fridge. I'll use it for the cake now.
正解の選択肢：She will use the milk right away.
Don't put back（戻さないで）の否定命令＋I'll use it now の未来。①は反転。

問4　正解は ③
スクリプト：The concert starts at seven, but let's meet at the station at six to get good seats.
正解の選択肢：They plan to meet at six o'clock.
2024年問2型。2つの時刻（7時開演／6時集合）の混同を狙う数字のひっかけ。`,
  surroundingKnowledge: [
    '第1問 A は2回読み。1回目で全体像と数字、2回目で場所・人・理由を確認する。',
    '否定（not / never / no longer）を聞き逃すと意味が正反対になる。最優先で聞き取る。',
    'usually / normally ↔ today / this time の対比が出たら、頭の中に2列の表を作る。',
    '数量は聞こえた順にメモし、あとから ＋／− の符号を付けて計算する。',
    '選択肢の誤りは「逆の意味」「未出情報」「細部のすり替え」「計算の途中値」のどれか。',
  ],
  deepDiveTopics: [
    '言い換え（パラフレーズ）の型を蓄積する。肯定↔否定の裏返しが第1問Aの最頻出。',
    '設問文の限定語（today / for tomorrow / this week）が答えの範囲を決める。',
    '聞こえた単語がそのまま入っている選択肢は、たいてい誤りである（音の一致に頼らない）。',
  ],
};

const EL1_A_SET9_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_A_set9_1',
    audioUrl: '/listening_audio/el1A_set9_q1.mp3',
    label: '問1',
    hint: '女性（教師）',
    script: 'Since everyone handed in the homework early, I\'ll return your tests a day sooner than I planned.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set9_2',
    audioUrl: '/listening_audio/el1A_set9_q2.mp3',
    label: '問2',
    hint: '男性（高校生）',
    script: 'I wonder if it\'ll snow tomorrow. The weather app says there\'s a thirty percent chance.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set9_3',
    audioUrl: '/listening_audio/el1A_set9_q3.mp3',
    label: '問3',
    hint: '少年（中学生）',
    script: 'I couldn\'t find my glove anywhere this morning, but it turned out to be under my bed.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set9_4',
    audioUrl: '/listening_audio/el1A_set9_q4.mp3',
    label: '問4',
    hint: '女性（会社員）',
    script: 'Rather than emailing the client, I\'ll call her directly. It\'s much faster that way.',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_A_SET9: ListeningProblem = {
  id: 'q_el1_A_set9',
  category: '第9回 短い発話の言い換え（やや難）',
  readCount: 2,
  audioTracks: EL1_A_SET9_TRACKS,
  text: `第9回　第1問 A（4問・2回読み）　【難易度：やや難】

第1問 A では、短い英文が2回読まれます。その内容に最も近い意味の英文を、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。本番と同じ条件で練習したいときは「2回続けて」を使ってください。

────────────────────
問1（話者：女性（教師））
① The tests will be returned later than planned.
② Nobody handed in the homework on time.
③ The tests will be returned earlier than planned.
④ The homework was handed in late.

────────────────────
問2（話者：男性（高校生））
① It will definitely snow tomorrow.
② There is a small chance of snow tomorrow.
③ It snowed heavily yesterday.
④ The weather app is not working.

────────────────────
問3（話者：少年（中学生））
① He still hasn't found his glove.
② He lost his glove at school.
③ He found his glove under his bed.
④ He bought a new glove this morning.

────────────────────
問4（話者：女性（会社員））
① She will email the client.
② She thinks email is faster.
③ She will phone the client instead.
④ She has already called the client.`,
  subQuestions: [
    {
      id: 'q_el1_A_set9_1',
      label: '問1 話者（男性（教師））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: 'a day sooner than I planned（予定より1日早く）',
        type: '言い換え型',
        difficulty: 4,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set9_2',
      label: '問2 話者（女性（高校生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 51,
      detailedExplanation: {
        theme: '2025年問4型',
        type: '言い換え型',
        difficulty: 4,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set9_3',
      label: '問3 話者（少年（中学生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 48,
      detailedExplanation: {
        theme: 'turned out to be（結局〜だった）が難しめの表現',
        type: '言い換え型',
        difficulty: 4,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set9_4',
      label: '問4 話者（女性（会社員））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 45,
      detailedExplanation: {
        theme: 'rather than A（Aではなく）＝instead of と同型の読み替え',
        type: '言い換え型',
        difficulty: 4,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
  ],
  explanation: `第9回（PDF 第8セット・難易度：やや難）の解説です。スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ③
スクリプト：Since everyone handed in the homework early, I'll return your tests a day sooner than I planned.
正解の選択肢：The tests will be returned earlier than planned.
a day sooner than I planned（予定より1日早く）。sooner / later の方向と early / late の対応が鍵。

問2　正解は ②
スクリプト：I wonder if it'll snow tomorrow. The weather app says there's a thirty percent chance.
正解の選択肢：There is a small chance of snow tomorrow.
2025年問4型。I wonder if〜（〜かなあ）は不確実さの表現。30%＝small chance の言い換え。

問3　正解は ③
スクリプト：I couldn't find my glove anywhere this morning, but it turned out to be under my bed.
正解の選択肢：He found his glove under his bed.
turned out to be（結局〜だった）が難しめの表現。2024年問4（盗難自転車が見つかった）と同型。

問4　正解は ③
スクリプト：Rather than emailing the client, I'll call her directly. It's much faster that way.
正解の選択肢：She will phone the client instead.
rather than A（Aではなく）＝instead of と同型の読み替え。手段（email/電話）の反転に注意。`,
  surroundingKnowledge: [
    '第1問 A は2回読み。1回目で全体像と数字、2回目で場所・人・理由を確認する。',
    '否定（not / never / no longer）を聞き逃すと意味が正反対になる。最優先で聞き取る。',
    'usually / normally ↔ today / this time の対比が出たら、頭の中に2列の表を作る。',
    '数量は聞こえた順にメモし、あとから ＋／− の符号を付けて計算する。',
    '選択肢の誤りは「逆の意味」「未出情報」「細部のすり替え」「計算の途中値」のどれか。',
  ],
  deepDiveTopics: [
    '言い換え（パラフレーズ）の型を蓄積する。肯定↔否定の裏返しが第1問Aの最頻出。',
    '設問文の限定語（today / for tomorrow / this week）が答えの範囲を決める。',
    '聞こえた単語がそのまま入っている選択肢は、たいてい誤りである（音の一致に頼らない）。',
  ],
};

const EL1_A_SET10_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_A_set10_1',
    audioUrl: '/listening_audio/el1A_set10_q1.mp3',
    label: '問1',
    hint: '女性（高校生）',
    script: 'My phone battery is almost dead. Can I borrow your charger, Emma?',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set10_2',
    audioUrl: '/listening_audio/el1A_set10_q2.mp3',
    label: '問2',
    hint: '女性（祖母）',
    script: 'Your grandfather grows tomatoes every summer. This year, he has more than fifty.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set10_3',
    audioUrl: '/listening_audio/el1A_set10_q3.mp3',
    label: '問3',
    hint: '女性（洋服店の店員）',
    script: 'We\'re out of the red shirts in medium, but we still have them in large.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set10_4',
    audioUrl: '/listening_audio/el1A_set10_q4.mp3',
    label: '問4',
    hint: '男性（父親）',
    script: 'I\'ll finish work at five today, so I can pick you up after practice.',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_A_SET10: ListeningProblem = {
  id: 'q_el1_A_set10',
  category: '第10回 短い発話の言い換え（易しめ）',
  readCount: 2,
  audioTracks: EL1_A_SET10_TRACKS,
  text: `第10回　第1問 A（4問・2回読み）　【難易度：易しめ】

第1問 A では、短い英文が2回読まれます。その内容に最も近い意味の英文を、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。本番と同じ条件で練習したいときは「2回続けて」を使ってください。

────────────────────
問1（話者：女性（高校生））
① She wants to borrow a charger.
② Her phone is fully charged.
③ She wants to lend Emma her charger.
④ She will buy a new phone.

────────────────────
問2（話者：女性（祖母））
① He grew tomatoes for the first time this year.
② He has over fifty tomatoes this year.
③ He has stopped growing tomatoes.
④ She grows the tomatoes herself.

────────────────────
問3（話者：女性（洋服店の店員））
① Red shirts in medium are available.
② Large red shirts are available.
③ All the red shirts are sold out.
④ They only have small shirts left.

────────────────────
問4（話者：男性（父親））
① He can't pick her up today.
② He finishes work at seven.
③ He can pick her up today.
④ Her practice ends at five.`,
  subQuestions: [
    {
      id: 'q_el1_A_set10_1',
      label: '問1 話者（男性（高校生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 78,
      detailedExplanation: {
        theme: 'Can I borrow〜? の依頼表現',
        type: '言い換え型',
        difficulty: 2,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set10_2',
      label: '問2 話者（女性（祖母））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 75,
      detailedExplanation: {
        theme: 'every summer（毎年）と this year の対比',
        type: '言い換え型',
        difficulty: 2,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set10_3',
      label: '問3 話者（女性（洋服店の店員））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 72,
      detailedExplanation: {
        theme: 'out of（品切れ）と still have の対比',
        type: '言い換え型',
        difficulty: 2,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set10_4',
      label: '問4 話者（男性（父親））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 69,
      detailedExplanation: {
        theme: 'so I can〜 が結論',
        type: '言い換え型',
        difficulty: 2,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
  ],
  explanation: `第10回（PDF 第9セット・難易度：易しめ）の解説です。スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ①
スクリプト：My phone battery is almost dead. Can I borrow your charger, Emma?
正解の選択肢：She wants to borrow a charger.
Can I borrow〜? の依頼表現。borrow（借りる）と③の lend（貸す）の方向の入れ替えがひっかけ。

問2　正解は ②
スクリプト：Your grandfather grows tomatoes every summer. This year, he has more than fifty.
正解の選択肢：He has over fifty tomatoes this year.
every summer（毎年）と this year の対比。more than fifty＝over fifty の言い換え。

問3　正解は ②
スクリプト：We're out of the red shirts in medium, but we still have them in large.
正解の選択肢：Large red shirts are available.
out of（品切れ）と still have の対比。サイズ（medium / large）の入れ替えに注意。

問4　正解は ③
スクリプト：I'll finish work at five today, so I can pick you up after practice.
正解の選択肢：He can pick her up today.
so I can〜 が結論。①は反転、②は時刻のすり替え、④は主語の入れ替え。`,
  surroundingKnowledge: [
    '第1問 A は2回読み。1回目で全体像と数字、2回目で場所・人・理由を確認する。',
    '否定（not / never / no longer）を聞き逃すと意味が正反対になる。最優先で聞き取る。',
    'usually / normally ↔ today / this time の対比が出たら、頭の中に2列の表を作る。',
    '数量は聞こえた順にメモし、あとから ＋／− の符号を付けて計算する。',
    '選択肢の誤りは「逆の意味」「未出情報」「細部のすり替え」「計算の途中値」のどれか。',
  ],
  deepDiveTopics: [
    '言い換え（パラフレーズ）の型を蓄積する。肯定↔否定の裏返しが第1問Aの最頻出。',
    '設問文の限定語（today / for tomorrow / this week）が答えの範囲を決める。',
    '聞こえた単語がそのまま入っている選択肢は、たいてい誤りである（音の一致に頼らない）。',
  ],
};

const EL1_A_SET11_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_A_set11_1',
    audioUrl: '/listening_audio/el1A_set11_q1.mp3',
    label: '問1',
    hint: '女性（高校生）',
    script: 'How about studying at the library instead of the café? It\'s much quieter there.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set11_2',
    audioUrl: '/listening_audio/el1A_set11_q2.mp3',
    label: '問2',
    hint: '男性（大学生）',
    script: 'I\'ve lived in Osaka for three years, but I\'ve never been to the castle.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set11_3',
    audioUrl: '/listening_audio/el1A_set11_q3.mp3',
    label: '問3',
    hint: '女の子（小学生）',
    script: 'The cat isn\'t in her box. Oh, she\'s sleeping on the sofa!',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set11_4',
    audioUrl: '/listening_audio/el1A_set11_q4.mp3',
    label: '問4',
    hint: '男性（高校生）',
    script: 'Only twelve students have signed up for the trip, and we need at least fifteen.',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_A_SET11: ListeningProblem = {
  id: 'q_el1_A_set11',
  category: '第11回 短い発話の言い換え（標準）',
  readCount: 2,
  audioTracks: EL1_A_SET11_TRACKS,
  text: `第11回　第1問 A（4問・2回読み）　【難易度：標準】

第1問 A では、短い英文が2回読まれます。その内容に最も近い意味の英文を、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。本番と同じ条件で練習したいときは「2回続けて」を使ってください。

────────────────────
問1（話者：女性（高校生））
① She suggests going to the café.
② She suggests studying at the library.
③ The library is too noisy.
④ She wants to stop studying.

────────────────────
問2（話者：男性（大学生））
① He visited the castle three years ago.
② He has never visited the castle in Osaka.
③ He moved to Osaka very recently.
④ He goes to the castle quite often.

────────────────────
問3（話者：女の子（小学生））
① The cat is inside her box.
② The cat has gone missing.
③ The cat is on the sofa.
④ The cat is sleeping in her box.

────────────────────
問4（話者：男性（高校生））
① Fifteen students have signed up.
② More students are needed for the trip.
③ The trip has been canceled.
④ Twelve more students are needed.`,
  subQuestions: [
    {
      id: 'q_el1_A_set11_1',
      label: '問1 話者（女性（高校生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 66,
      detailedExplanation: {
        theme: '2021年問2型の How about〜? 提案表現＋instead of',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set11_2',
      label: '問2 話者（男性（大学生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 63,
      detailedExplanation: {
        theme: '現在完了 I\'ve never been to（行ったことがない）',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set11_3',
      label: '問3 話者（女の子（小学生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: 'isn\'t in her box の否定と、Oh, 〜で訂正される場所',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set11_4',
      label: '問4 話者（男性（高校生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '数量問題',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
  ],
  explanation: `第11回（PDF 第10セット・難易度：標準）の解説です。スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ②
スクリプト：How about studying at the library instead of the café? It's much quieter there.
正解の選択肢：She suggests studying at the library.
2021年問2型の How about〜? 提案表現＋instead of。カフェと図書館の入れ替えがひっかけ。

問2　正解は ②
スクリプト：I've lived in Osaka for three years, but I've never been to the castle.
正解の選択肢：He has never visited the castle in Osaka.
現在完了 I've never been to（行ったことがない）。3年住んでいるのに未訪問、という対比。

問3　正解は ③
スクリプト：The cat isn't in her box. Oh, she's sleeping on the sofa!
正解の選択肢：The cat is on the sofa.
isn't in her box の否定と、Oh, 〜で訂正される場所。④は「寝ている」情報との合成ひっかけ。

問4　正解は ②
スクリプト：Only twelve students have signed up for the trip, and we need at least fifteen.
正解の選択肢：More students are needed for the trip.
数量問題。あと3人必要。④の twelve more は数の聞き違いを狙ったひっかけ。`,
  surroundingKnowledge: [
    '第1問 A は2回読み。1回目で全体像と数字、2回目で場所・人・理由を確認する。',
    '否定（not / never / no longer）を聞き逃すと意味が正反対になる。最優先で聞き取る。',
    'usually / normally ↔ today / this time の対比が出たら、頭の中に2列の表を作る。',
    '数量は聞こえた順にメモし、あとから ＋／− の符号を付けて計算する。',
    '選択肢の誤りは「逆の意味」「未出情報」「細部のすり替え」「計算の途中値」のどれか。',
  ],
  deepDiveTopics: [
    '言い換え（パラフレーズ）の型を蓄積する。肯定↔否定の裏返しが第1問Aの最頻出。',
    '設問文の限定語（today / for tomorrow / this week）が答えの範囲を決める。',
    '聞こえた単語がそのまま入っている選択肢は、たいてい誤りである（音の一致に頼らない）。',
  ],
};

const EL1_A_SET12_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_A_set12_1',
    audioUrl: '/listening_audio/el1A_set12_q1.mp3',
    label: '問1',
    hint: '女性（教師）',
    script: 'You don\'t have to bring your textbooks tomorrow. We\'ll watch a video in class instead.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set12_2',
    audioUrl: '/listening_audio/el1A_set12_q2.mp3',
    label: '問2',
    hint: '男性（高校生）',
    script: 'The bus was late again, so I missed the first ten minutes of the movie.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set12_3',
    audioUrl: '/listening_audio/el1A_set12_q3.mp3',
    label: '問3',
    hint: '男性（大学生）',
    script: 'I won\'t buy a new laptop until this old one stops working completely.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set12_4',
    audioUrl: '/listening_audio/el1A_set12_q4.mp3',
    label: '問4',
    hint: '女性（電気店の店員）',
    script: 'This washing machine was two hundred dollars last month, but it\'s on sale for one fifty now.',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_A_SET12: ListeningProblem = {
  id: 'q_el1_A_set12',
  category: '第12回 短い発話の言い換え（標準）',
  readCount: 2,
  audioTracks: EL1_A_SET12_TRACKS,
  text: `第12回　第1問 A（4問・2回読み）　【難易度：標準】

第1問 A では、短い英文が2回読まれます。その内容に最も近い意味の英文を、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。本番と同じ条件で練習したいときは「2回続けて」を使ってください。

────────────────────
問1（話者：女性（教師））
① Bring your textbooks tomorrow.
② There will be no class tomorrow.
③ You don't need your textbooks tomorrow.
④ The video is about textbooks.

────────────────────
問2（話者：男性（高校生））
① He missed the whole movie.
② The bus arrived on time.
③ He saw most of the movie.
④ He arrived before the movie started.

────────────────────
問3（話者：男性（大学生））
① He has already bought a new laptop.
② He will buy one when his breaks.
③ His laptop stopped working yesterday.
④ He will never buy a new laptop.

────────────────────
問4（話者：女性（電気店の店員））
① It costs two hundred dollars now.
② It is now fifty dollars.
③ It is cheaper now than last month.
④ The sale ended last month.`,
  subQuestions: [
    {
      id: 'q_el1_A_set12_1',
      label: '問1 話者（女性（教師））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 66,
      detailedExplanation: {
        theme: 'don\'t have to（〜する必要がない）',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set12_2',
      label: '問2 話者（男性（高校生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 63,
      detailedExplanation: {
        theme: 'missed the first ten minutes（最初の10分だけ見逃した）',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set12_3',
      label: '問3 話者（女性（大学生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: 'not〜until（〜するまで〜しない）構文',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set12_4',
      label: '問4 話者（男性（電気店の店員））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '数字の聞き取り',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
  ],
  explanation: `第12回（PDF 第11セット・難易度：標準）の解説です。スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ③
スクリプト：You don't have to bring your textbooks tomorrow. We'll watch a video in class instead.
正解の選択肢：You don't need your textbooks tomorrow.
don't have to（〜する必要がない）。①は反転（命令文への誤読）。

問2　正解は ③
スクリプト：The bus was late again, so I missed the first ten minutes of the movie.
正解の選択肢：He saw most of the movie.
missed the first ten minutes（最初の10分だけ見逃した）。①の whole movie は範囲の拡大ひっかけ。

問3　正解は ②
スクリプト：I won't buy a new laptop until this old one stops working completely.
正解の選択肢：He will buy one when his breaks.
not〜until（〜するまで〜しない）構文。「壊れたら買う」と読み替える。④の never は言い過ぎ。

問4　正解は ③
スクリプト：This washing machine was two hundred dollars last month, but it's on sale for one fifty now.
正解の選択肢：It is cheaper now than last month.
数字の聞き取り。one fifty＝150ドル。②の fifty dollars は音声の弱化（one fifty）を狙ったひっかけ。`,
  surroundingKnowledge: [
    '第1問 A は2回読み。1回目で全体像と数字、2回目で場所・人・理由を確認する。',
    '否定（not / never / no longer）を聞き逃すと意味が正反対になる。最優先で聞き取る。',
    'usually / normally ↔ today / this time の対比が出たら、頭の中に2列の表を作る。',
    '数量は聞こえた順にメモし、あとから ＋／− の符号を付けて計算する。',
    '選択肢の誤りは「逆の意味」「未出情報」「細部のすり替え」「計算の途中値」のどれか。',
  ],
  deepDiveTopics: [
    '言い換え（パラフレーズ）の型を蓄積する。肯定↔否定の裏返しが第1問Aの最頻出。',
    '設問文の限定語（today / for tomorrow / this week）が答えの範囲を決める。',
    '聞こえた単語がそのまま入っている選択肢は、たいてい誤りである（音の一致に頼らない）。',
  ],
};

const EL1_A_SET13_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_A_set13_1',
    audioUrl: '/listening_audio/el1A_set13_q1.mp3',
    label: '問1',
    hint: '女性（高校生）',
    script: 'It\'s too hot in here. Do you mind if I turn on the air conditioner?',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set13_2',
    audioUrl: '/listening_audio/el1A_set13_q2.mp3',
    label: '問2',
    hint: '女性（会社員）',
    script: 'My flight was supposed to leave at nine, but it\'s been delayed until noon.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set13_3',
    audioUrl: '/listening_audio/el1A_set13_q3.mp3',
    label: '問3',
    hint: '女性（母親）',
    script: 'Ken, I\'ve packed your lunch, but I forgot to put in a fork.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set13_4',
    audioUrl: '/listening_audio/el1A_set13_q4.mp3',
    label: '問4',
    hint: '男性（銀行の客）',
    script: 'There are eighteen people in line, but three clerks are working, so it shouldn\'t take long.',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_A_SET13: ListeningProblem = {
  id: 'q_el1_A_set13',
  category: '第13回 短い発話の言い換え（標準）',
  readCount: 2,
  audioTracks: EL1_A_SET13_TRACKS,
  text: `第13回　第1問 A（4問・2回読み）　【難易度：標準】

第1問 A では、短い英文が2回読まれます。その内容に最も近い意味の英文を、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。本番と同じ条件で練習したいときは「2回続けて」を使ってください。

────────────────────
問1（話者：女性（高校生））
① She wants to open the window.
② She is asking to use the air conditioner.
③ She has turned off the air conditioner.
④ She feels too cold.

────────────────────
問2（話者：女性（会社員））
① Her flight left at nine.
② Her flight will leave at noon.
③ Her flight has been canceled.
④ She arrived at noon.

────────────────────
問3（話者：女性（母親））
① There is a fork in his lunch box.
② She forgot to pack his lunch.
③ There is no fork in his lunch box.
④ Ken packed his own lunch.

────────────────────
問4（話者：男性（銀行の客））
① Eighteen clerks are working.
② He expects a very long wait.
③ He thinks the wait will be short.
④ Only three people are in line.`,
  subQuestions: [
    {
      id: 'q_el1_A_set13_1',
      label: '問1 話者（女性（高校生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 66,
      detailedExplanation: {
        theme: 'Do you mind if I〜?（〜してもいいですか）の依頼表現',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set13_2',
      label: '問2 話者（男性（会社員））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 63,
      detailedExplanation: {
        theme: 'was supposed to（〜するはずだった）と delayed until noon の対比',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set13_3',
      label: '問3 話者（女性（母親））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 60,
      detailedExplanation: {
        theme: 'but の後の forgot to put in a fork が核心',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set13_4',
      label: '問4 話者（男性（銀行の客））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 57,
      detailedExplanation: {
        theme: '数字（18人と3人）と shouldn\'t take long（すぐ済むはず）の結論',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
  ],
  explanation: `第13回（PDF 第12セット・難易度：標準）の解説です。スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ②
スクリプト：It's too hot in here. Do you mind if I turn on the air conditioner?
正解の選択肢：She is asking to use the air conditioner.
Do you mind if I〜?（〜してもいいですか）の依頼表現。④は hot / cold の反転。

問2　正解は ②
スクリプト：My flight was supposed to leave at nine, but it's been delayed until noon.
正解の選択肢：Her flight will leave at noon.
was supposed to（〜するはずだった）と delayed until noon の対比。9時と正午の時刻混同がひっかけ。

問3　正解は ③
スクリプト：Ken, I've packed your lunch, but I forgot to put in a fork.
正解の選択肢：There is no fork in his lunch box.
but の後の forgot to put in a fork が核心。弁当は入っている／フォークは入っていない、の組み合わせ。

問4　正解は ③
スクリプト：There are eighteen people in line, but three clerks are working, so it shouldn't take long.
正解の選択肢：He thinks the wait will be short.
数字（18人と3人）と shouldn't take long（すぐ済むはず）の結論。①④は数の入れ替え。`,
  surroundingKnowledge: [
    '第1問 A は2回読み。1回目で全体像と数字、2回目で場所・人・理由を確認する。',
    '否定（not / never / no longer）を聞き逃すと意味が正反対になる。最優先で聞き取る。',
    'usually / normally ↔ today / this time の対比が出たら、頭の中に2列の表を作る。',
    '数量は聞こえた順にメモし、あとから ＋／− の符号を付けて計算する。',
    '選択肢の誤りは「逆の意味」「未出情報」「細部のすり替え」「計算の途中値」のどれか。',
  ],
  deepDiveTopics: [
    '言い換え（パラフレーズ）の型を蓄積する。肯定↔否定の裏返しが第1問Aの最頻出。',
    '設問文の限定語（today / for tomorrow / this week）が答えの範囲を決める。',
    '聞こえた単語がそのまま入っている選択肢は、たいてい誤りである（音の一致に頼らない）。',
  ],
};

const EL1_A_SET14_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_A_set14_1',
    audioUrl: '/listening_audio/el1A_set14_q1.mp3',
    label: '問1',
    hint: '女性（大学生）',
    script: 'Let\'s take the earlier train so that we won\'t be late for the ceremony.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set14_2',
    audioUrl: '/listening_audio/el1A_set14_q2.mp3',
    label: '問2',
    hint: '男性（高校生）',
    script: 'I haven\'t decided which club to join yet, but I\'ll choose one by Friday.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set14_3',
    audioUrl: '/listening_audio/el1A_set14_q3.mp3',
    label: '問3',
    hint: '女性（洋服店の店員）',
    script: 'The fitting rooms close at eight, so if you want to try that on, please hurry.',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_A_set14_4',
    audioUrl: '/listening_audio/el1A_set14_q4.mp3',
    label: '問4',
    hint: '男性（父親）',
    script: 'Your mother called while you were out. She said she\'ll be home around seven.',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_A_SET14: ListeningProblem = {
  id: 'q_el1_A_set14',
  category: '第14回 短い発話の言い換え（やや難）',
  readCount: 2,
  audioTracks: EL1_A_SET14_TRACKS,
  text: `第14回　第1問 A（4問・2回読み）　【難易度：やや難】

第1問 A では、短い英文が2回読まれます。その内容に最も近い意味の英文を、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。本番と同じ条件で練習したいときは「2回続けて」を使ってください。

────────────────────
問1（話者：女性（大学生））
① She wants to take a later train.
② She suggests taking the earlier train.
③ They missed the ceremony.
④ Their train was delayed.

────────────────────
問2（話者：男性（高校生））
① He joined a club last Friday.
② He has already chosen his club.
③ He will decide by Friday.
④ He is not going to join any club.

────────────────────
問3（話者：女性（洋服店の店員））
① The fitting rooms close at nine.
② She should try it on before eight.
③ The whole store closes at eight.
④ The fitting rooms are already closed.

────────────────────
問4（話者：男性（父親））
① His mother is already at home.
② He called his mother earlier.
③ His mother will be back around seven.
④ His mother forgot to call him.`,
  subQuestions: [
    {
      id: 'q_el1_A_set14_1',
      label: '問1 話者（女性（大学生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 54,
      detailedExplanation: {
        theme: 'Let\'s〜の提案＋so that（〜するために）の目的',
        type: '言い換え型',
        difficulty: 4,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set14_2',
      label: '問2 話者（男性（高校生））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 51,
      detailedExplanation: {
        theme: 'haven\'t decided yet（まだ）と I\'ll choose by Friday（金曜までに決める）の時制の整理',
        type: '言い換え型',
        difficulty: 4,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set14_3',
      label: '問3 話者（女性（洋服店の店員））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 48,
      detailedExplanation: {
        theme: 'close at eight の主語は fitting rooms',
        type: '言い換え型',
        difficulty: 4,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
    {
      id: 'q_el1_A_set14_4',
      label: '問4 話者（男性（父親））の発話に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 45,
      detailedExplanation: {
        theme: 'called while you were out（不在中に電話があった）と will be home around seven の未来',
        type: '言い換え型',
        difficulty: 4,
        steps: [
          '① 音声を1回目で通して聞き、話題（何について話しているか）をつかむ',
          '② but / not / yet / usually などの切れ目を探し、結論がどちら側かを決める',
          '③ 選択肢を「肯定／否定」または「数量」で二分し、まず半分を切る',
          '④ 残りは場所・人・時のすり替えを見つけて確定する',
        ],
      },
    },
  ],
  explanation: `第14回（PDF 第13セット・難易度：やや難）の解説です。スクリプトと正解、そして PDF の解説をそのまま収録しています。

問1　正解は ②
スクリプト：Let's take the earlier train so that we won't be late for the ceremony.
正解の選択肢：She suggests taking the earlier train.
Let's〜の提案＋so that（〜するために）の目的。earlier / later の比較級の聞き分けが鍵。

問2　正解は ③
スクリプト：I haven't decided which club to join yet, but I'll choose one by Friday.
正解の選択肢：He will decide by Friday.
haven't decided yet（まだ）と I'll choose by Friday（金曜までに決める）の時制の整理。④は言い過ぎ。

問3　正解は ②
スクリプト：The fitting rooms close at eight, so if you want to try that on, please hurry.
正解の選択肢：She should try it on before eight.
close at eight の主語は fitting rooms。③の store は主語のすり替え。please hurry＝8時前に、と読み替える。

問4　正解は ③
スクリプト：Your mother called while you were out. She said she'll be home around seven.
正解の選択肢：His mother will be back around seven.
called while you were out（不在中に電話があった）と will be home around seven の未来。②は主語の入れ替え。`,
  surroundingKnowledge: [
    '第1問 A は2回読み。1回目で全体像と数字、2回目で場所・人・理由を確認する。',
    '否定（not / never / no longer）を聞き逃すと意味が正反対になる。最優先で聞き取る。',
    'usually / normally ↔ today / this time の対比が出たら、頭の中に2列の表を作る。',
    '数量は聞こえた順にメモし、あとから ＋／− の符号を付けて計算する。',
    '選択肢の誤りは「逆の意味」「未出情報」「細部のすり替え」「計算の途中値」のどれか。',
  ],
  deepDiveTopics: [
    '言い換え（パラフレーズ）の型を蓄積する。肯定↔否定の裏返しが第1問Aの最頻出。',
    '設問文の限定語（today / for tomorrow / this week）が答えの範囲を決める。',
    '聞こえた単語がそのまま入っている選択肢は、たいてい誤りである（音の一致に頼らない）。',
  ],
};

/** 第1問 A の類題集（PDF 13セット＝第2回〜第14回）。 */
export const EL1_A_EXTRA_PROBLEMS: ListeningProblem[] = [
  EL1_A_SET2,
  EL1_A_SET3,
  EL1_A_SET4,
  EL1_A_SET5,
  EL1_A_SET6,
  EL1_A_SET7,
  EL1_A_SET8,
  EL1_A_SET9,
  EL1_A_SET10,
  EL1_A_SET11,
  EL1_A_SET12,
  EL1_A_SET13,
  EL1_A_SET14,
];
