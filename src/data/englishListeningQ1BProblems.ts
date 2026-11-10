/**
 * ===================================================================
 * 英語リスニング 第1問 B ― 類題集（第1回〜第15回・イラスト選択）
 * ===================================================================
 *
 * 出典（2つの PDF を対応させている）
 *   ・「共通テスト_英語リスニング_第1問B_類題集_15セット.pdf」… 設問・正解・スクリプト・解説
 *   ・「第１問B.pdf」（75ページ・画像）              … 各問のイラスト（①〜④が1枚に4コマ）
 *   ページ対応：第nセットの表紙は 1+5*(n-1) ページ、続く4ページが 問1〜問4。
 *   画像は 1枚に ①〜④ の4コマが 2×2 で入っているため、1問につき1枚を貼る。
 *
 * イラストの前処理
 *   第1セットの4枚には生成時の Genspark ロゴが右下に焼き込まれていたため、
 *   scripts/listening-data/strip_genspark_logo.py（テンプレートマッチ＋インペイント）で除去した。
 *   画像は public/listening_q1b/el1B_set<N>_q<M>.jpg として配置している。
 *
 * 第1問A との違い
 *   A は「音声に合う英文」を選ぶが、B は「音声に合うイラスト」を選ぶ。
 *   そのため options はマーク（①〜④）のみで、判断材料は imageUrl のイラストになる。
 *   イラストの内容（PDF の日本語説明）は解説側に載せ、解答時のネタバレを防ぐ。
 *
 * 音源について
 *   提供された高品質MP3を audioUrl で参照する。各ファイルは原稿1回分。
 *   再生回数は readCount に従いアプリ側で制御する。
 *   対応原稿・SHA-256・出典は scripts/data/listening_premium_manifest.json に記録。
 */

import type { ListeningAudioTrack, ListeningProblem } from './englishListeningQ1AProblems';

/** 解答チップはマークのみ（判断材料はイラスト）。 */
const MARK_OPTIONS = ['①', '②', '③', '④'];


const EL1_B_SET1_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_B_set1_1',
    audioUrl: '/listening_audio/el1B_set1_q1.mp3',
    label: '問1',
    hint: '女性（高校生）',
    script: '"Look, Mom. The cat is sleeping under the table again."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set1_2',
    audioUrl: '/listening_audio/el1B_set1_q2.mp3',
    label: '問2',
    hint: '男性（会社員）',
    script: '"I\'ll take this shoulder bag with the long strap, please."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set1_3',
    audioUrl: '/listening_audio/el1B_set1_q3.mp3',
    label: '問3',
    hint: '女の子（小学生）',
    script: '"The bus stop is in front of the bank, next to the big tree."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set1_4',
    audioUrl: '/listening_audio/el1B_set1_q4.mp3',
    label: '問4',
    hint: '男性（高校生）',
    script: '"Two boys are playing soccer, and one more is just watching them."',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_B_SET1: ListeningProblem = {
  id: 'q_el1_B_set1',
  category: '第1回 発話に合うイラストを選ぶ（易しめ）',
  readCount: 2,
  audioTracks: EL1_B_SET1_TRACKS,
  text: `第1回　第1問 B（4問・2回読み）　【難易度：易しめ】

第1問 B では、短い英文が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。イラストは各問の下に①〜④の順で並んでいます。

【解き方のコツ】
音声が流れる前に4枚のイラストを見比べ、「どこが違うか」を1語で言えるようにしておきます（上／下、赤／青、2人／3人 など）。違いが分かっていれば、聞き取るべき1語が決まります。

────────────────────
問1（話者：女性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問2（話者：男性（会社員））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問3（話者：女の子（小学生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問4（話者：男性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。`,
  subQuestions: [
    {
      id: 'q_el1_B_set1_1',
      label: '問1 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 78,
      imageUrl: '/listening_q1b/el1B_set1_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'under the table が核心',
        type: 'イラスト選択型',
        difficulty: 2,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set1_2',
      label: '問2 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 75,
      imageUrl: '/listening_q1b/el1B_set1_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '種類（shoulder bag）と属性（long strap）の組み合わせ',
        type: 'イラスト選択型',
        difficulty: 2,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set1_3',
      label: '問3 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 72,
      imageUrl: '/listening_q1b/el1B_set1_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'in front of と next to の2つの位置情報の両方を満たす絵を選ぶ',
        type: 'イラスト選択型',
        difficulty: 2,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set1_4',
      label: '問4 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 69,
      imageUrl: '/listening_q1b/el1B_set1_q4.jpg',
      imageCaption: '問4 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '数（two + one more）と動作（playing / watching）の対応',
        type: 'イラスト選択型',
        difficulty: 2,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
  ],
  explanation: `第1回（難易度：易しめ）の解説です。イラスト選択では「4枚の違い」を先に言語化しておくことが最大の得点源になります。

問1　正解は ②
スクリプト："Look, Mom. The cat is sleeping under the table again."
イラストの内容：① テーブルの上で寝ている猫／② テーブルの下で寝ている猫／③ テーブルの横の床で寝ている猫／④ ソファの上で寝ている猫
正解のイラスト：テーブルの下で寝ている猫
under the table が核心。on/under/beside の前置詞の聞き分け。本試験では前置詞の違いだけのイラストが典型。

問2　正解は ③
スクリプト："I'll take this red shoulder bag with the long strap, please."
イラストの内容：① 長いストラップの青いショルダーバッグ／② 短い持ち手の赤いハンドバッグ／③ 長いストラップの赤いショルダーバッグ／④ 赤いリュックサック
正解のイラスト：長いストラップの赤いショルダーバッグ
色（red）・種類（shoulder bag）・属性（long strap）の3条件の組み合わせ。2025年問5（Not the square one, but the other one）型の属性一致問題。

問3　正解は ①
スクリプト："The bus stop is in front of the bank, next to the big tree."
イラストの内容：① 銀行の前・大きな木の横にあるバス停／② 銀行の後ろに隠れているバス停／③ 郵便局の前にあるバス停／④ 木の横だけにあるバス停（建物なし）
正解のイラスト：銀行の前・大きな木の横にあるバス停
in front of と next to の2つの位置情報の両方を満たす絵を選ぶ。条件を片方だけ満たす④がひっかけ。

問4　正解は ④
スクリプト："Two boys are playing soccer, and one more is just watching them."
イラストの内容：① 3人全員がサッカーをしている／② 2人だけがサッカーをしている／③ 2人がサッカー、1人がバスケット／④ 2人がサッカー、1人が腕を組んで見ている
正解のイラスト：2人がサッカー、1人が腕を組んで見ている
数（two + one more）と動作（playing / watching）の対応。2025年問6（数の聞き分け）型。`,
  surroundingKnowledge: [
    '位置の前置詞：on（接触して上）／over・above（離れて上）／under・below（下）／in front of（前）／behind（後ろ）／between A and B（A と B の間）／next to・beside（隣）。',
    '比較の聞き取り：taller / shorter / bigger / more ~ than。どちらが基準かを取り違えないこと。',
    '数の聞き取り：two / three / four に加え、both / none of / all of / one more / two left の言い換え。',
    '否定：not A but B（A ではなく B）は、イラスト選択で最も多い仕掛け。but の後ろが正解。',
    '時の対比：now ↔ a minute ago / just flew away。「今の状態」を描いた1枚を選ぶ。',
  ],
  deepDiveTopics: [
    '4枚のイラストは「1か所だけ違う」ように作られている。違いの軸（位置・色・数・動作）を先に決めるのが定石。',
    '音声に出た語がそのまま描かれている絵は、しばしばダミーである（not / instead of の前の語）。',
    '2回読みのうち1回目で軸を絞り、2回目で残った候補の差分だけを確認すると安定する。',
  ],
};

const EL1_B_SET2_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_B_set2_1',
    audioUrl: '/listening_audio/el1B_set2_q1.mp3',
    label: '問1',
    hint: '女性（母親）',
    script: '"None of the three girls is wearing a hat, but one of them has an umbrella."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set2_2',
    audioUrl: '/listening_audio/el1B_set2_q2.mp3',
    label: '問2',
    hint: '少年（中学生）',
    script: '"The taller boy has a basketball, and the shorter one has a book."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set2_3',
    audioUrl: '/listening_audio/el1B_set2_q3.mp3',
    label: '問3',
    hint: '女性（大学生）',
    script: '"The cup is between the plate and the vase on the table."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set2_4',
    audioUrl: '/listening_audio/el1B_set2_q4.mp3',
    label: '問4',
    hint: '男性（お年寄り）',
    script: '"That brown dog isn\'t chasing a ball. It\'s chasing its own tail!"',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_B_SET2: ListeningProblem = {
  id: 'q_el1_B_set2',
  category: '第2回 発話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL1_B_SET2_TRACKS,
  text: `第2回　第1問 B（4問・2回読み）　【難易度：標準】

第1問 B では、短い英文が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。イラストは各問の下に①〜④の順で並んでいます。

【解き方のコツ】
音声が流れる前に4枚のイラストを見比べ、「どこが違うか」を1語で言えるようにしておきます（上／下、赤／青、2人／3人 など）。違いが分かっていれば、聞き取るべき1語が決まります。

────────────────────
問1（話者：女性（母親））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問2（話者：少年（中学生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問3（話者：女性（大学生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問4（話者：男性（お年寄り））
イラスト①〜④から、発話の内容に合うものを選びなさい。`,
  subQuestions: [
    {
      id: 'q_el1_B_set2_1',
      label: '問1 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 66,
      imageUrl: '/listening_q1b/el1B_set2_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'None of〜（誰も〜ない）の全否定と but one（1人は）の組み合わせ',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set2_2',
      label: '問2 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 63,
      imageUrl: '/listening_q1b/el1B_set2_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '背の高さと持ち物の対応関係',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set2_3',
      label: '問3 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 60,
      imageUrl: '/listening_q1b/el1B_set2_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'between A and B（AとBの間）の位置関係',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set2_4',
      label: '問4 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 57,
      imageUrl: '/listening_q1b/el1B_set2_q4.jpg',
      imageCaption: '問4 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'isn\'t chasing a ball の否定の後に訂正情報（its own tail）が来る',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
  ],
  explanation: `第2回（難易度：標準）の解説です。イラスト選択では「4枚の違い」を先に言語化しておくことが最大の得点源になります。

問1　正解は ③
スクリプト："None of the three girls is wearing a hat, but one of them has an umbrella."
イラストの内容：① 3人全員が帽子をかぶっている／② 1人だけ帽子をかぶっている（傘なし）／③ 全員帽子なし、1人が傘を持っている／④ 全員帽子なし、1人がショルダーバッグ
正解のイラスト：全員帽子なし、1人が傘を持っている
None of〜（誰も〜ない）の全否定と but one（1人は）の組み合わせ。2025年問6とほぼ同型。

問2　正解は ①
スクリプト："The taller boy has a basketball, and the shorter one has a book."
イラストの内容：① 背の高い男の子がバスケットボール、低い方が本／② 背の高い男の子が本、低い方がバスケットボール／③ 2人ともバスケットボール／④ 2人とも本
正解のイラスト：背の高い男の子がバスケットボール、低い方が本
背の高さと持ち物の対応関係。①と②が鏡像のひっかけ。比較級 taller/shorter の聞き取りが鍵。

問3　正解は ②
スクリプト："The cup is between the plate and the vase on the table."
イラストの内容：① 左から カップ・皿・花瓶／② 左から 皿・カップ・花瓶（カップが中央）／③ カップが花瓶の後ろに隠れている／④ 左から カップ・花瓶・皿
正解のイラスト：左から 皿・カップ・花瓶（カップが中央）
between A and B（AとBの間）の位置関係。並び順のパターンを聞き取る基本問題。

問4　正解は ④
スクリプト："That brown dog isn't chasing a ball. It's chasing its own tail!"
イラストの内容：① 赤いボールを追う犬／② 小さな猫を追う犬／③ 草の上で眠る犬／④ 自分のしっぽを追って回る犬
正解のイラスト：自分のしっぽを追って回る犬
isn't chasing a ball の否定の後に訂正情報（its own tail）が来る。2023年問（Oh, I see one behind the fence）の訂正型。`,
  surroundingKnowledge: [
    '位置の前置詞：on（接触して上）／over・above（離れて上）／under・below（下）／in front of（前）／behind（後ろ）／between A and B（A と B の間）／next to・beside（隣）。',
    '比較の聞き取り：taller / shorter / bigger / more ~ than。どちらが基準かを取り違えないこと。',
    '数の聞き取り：two / three / four に加え、both / none of / all of / one more / two left の言い換え。',
    '否定：not A but B（A ではなく B）は、イラスト選択で最も多い仕掛け。but の後ろが正解。',
    '時の対比：now ↔ a minute ago / just flew away。「今の状態」を描いた1枚を選ぶ。',
  ],
  deepDiveTopics: [
    '4枚のイラストは「1か所だけ違う」ように作られている。違いの軸（位置・色・数・動作）を先に決めるのが定石。',
    '音声に出た語がそのまま描かれている絵は、しばしばダミーである（not / instead of の前の語）。',
    '2回読みのうち1回目で軸を絞り、2回目で残った候補の差分だけを確認すると安定する。',
  ],
};

const EL1_B_SET3_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_B_set3_1',
    audioUrl: '/listening_audio/el1B_set3_q1.mp3',
    label: '問1',
    hint: '女性（高校生）',
    script: '"The man with glasses is watering the flowers in the garden."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set3_2',
    audioUrl: '/listening_audio/el1B_set3_q2.mp3',
    label: '問2',
    hint: '男性（父親）',
    script: '"Two stars are above the moon, and one is below it."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set3_3',
    audioUrl: '/listening_audio/el1B_set3_q3.mp3',
    label: '問3',
    hint: '女性（会社員）',
    script: '"On the bench, the girl in the white shirt is on the left, and the boy in the cap is on the right."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set3_4',
    audioUrl: '/listening_audio/el1B_set3_q4.mp3',
    label: '問4',
    hint: '男の子（小学生）',
    script: '"Grandma bought six apples, but she used four for a pie. Only two are left in the basket."',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_B_SET3: ListeningProblem = {
  id: 'q_el1_B_set3',
  category: '第3回 発話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL1_B_SET3_TRACKS,
  text: `第3回　第1問 B（4問・2回読み）　【難易度：標準】

第1問 B では、短い英文が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。イラストは各問の下に①〜④の順で並んでいます。

【解き方のコツ】
音声が流れる前に4枚のイラストを見比べ、「どこが違うか」を1語で言えるようにしておきます（上／下、赤／青、2人／3人 など）。違いが分かっていれば、聞き取るべき1語が決まります。

────────────────────
問1（話者：女性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問2（話者：男性（父親））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問3（話者：女性（会社員））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問4（話者：男の子（小学生））
イラスト①〜④から、発話の内容に合うものを選びなさい。`,
  subQuestions: [
    {
      id: 'q_el1_B_set3_1',
      label: '問1 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 66,
      imageUrl: '/listening_q1b/el1B_set3_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '人物の属性（with glasses）と動作（watering the flowers）の組み合わせ',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set3_2',
      label: '問2 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 63,
      imageUrl: '/listening_q1b/el1B_set3_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '数（two / one）と位置（above / below）の対応',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set3_3',
      label: '問3 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 60,
      imageUrl: '/listening_q1b/el1B_set3_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '人物の属性と左右の位置の対応',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set3_4',
      label: '問4 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 57,
      imageUrl: '/listening_q1b/el1B_set3_q4.jpg',
      imageCaption: '問4 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '6−4＝2 の計算と、結果の状態（only two are left）を選ぶ',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
  ],
  explanation: `第3回（難易度：標準）の解説です。イラスト選択では「4枚の違い」を先に言語化しておくことが最大の得点源になります。

問1　正解は ②
スクリプト："The man with glasses is watering the flowers in the garden."
イラストの内容：① 眼鏡の男性が芝刈り機で草を刈っている／② 眼鏡の男性が花に水をやっている／③ 眼鏡なしの男性が花に水をやっている／④ 眼鏡の男性が車を洗っている
正解のイラスト：眼鏡の男性が花に水をやっている
人物の属性（with glasses）と動作（watering the flowers）の組み合わせ。2026年問5（帽子の男性）型。

問2　正解は ①
スクリプト："Two stars are above the moon, and one is below it."
イラストの内容：① 月の上に星2つ、下に1つ／② 月の上に1つ、下に2つ／③ 月の上に3つ／④ 月の下に3つ
正解のイラスト：月の上に星2つ、下に1つ
数（two / one）と位置（above / below）の対応。数え間違いを誘う配置がひっかけ。

問3　正解は ①
スクリプト："On the bench, the girl in the white shirt is on the left, and the boy in the cap is on the right."
イラストの内容：① 白シャツの女の子が左、帽子の男の子が右／② 帽子の男の子が左、白シャツの女の子が右／③ 女の子だけ座り、男の子は立っている／④ 2人ともベンチの前に立っている
正解のイラスト：白シャツの女の子が左、帽子の男の子が右
人物の属性と左右の位置の対応。on the left / on the right の聞き分け。

問4　正解は ①
スクリプト："Grandma bought six apples, but she used four for a pie. Only two are left in the basket."
イラストの内容：① かごにりんご2個と、横にアップルパイ／② かごにりんご4個／③ かごにりんご6個／④ かごにりんご3個
正解のイラスト：かごにりんご2個と、横にアップルパイ
6−4＝2 の計算と、結果の状態（only two are left）を選ぶ。数字の変化を追う2023年A型の画像版。`,
  surroundingKnowledge: [
    '位置の前置詞：on（接触して上）／over・above（離れて上）／under・below（下）／in front of（前）／behind（後ろ）／between A and B（A と B の間）／next to・beside（隣）。',
    '比較の聞き取り：taller / shorter / bigger / more ~ than。どちらが基準かを取り違えないこと。',
    '数の聞き取り：two / three / four に加え、both / none of / all of / one more / two left の言い換え。',
    '否定：not A but B（A ではなく B）は、イラスト選択で最も多い仕掛け。but の後ろが正解。',
    '時の対比：now ↔ a minute ago / just flew away。「今の状態」を描いた1枚を選ぶ。',
  ],
  deepDiveTopics: [
    '4枚のイラストは「1か所だけ違う」ように作られている。違いの軸（位置・色・数・動作）を先に決めるのが定石。',
    '音声に出た語がそのまま描かれている絵は、しばしばダミーである（not / instead of の前の語）。',
    '2回読みのうち1回目で軸を絞り、2回目で残った候補の差分だけを確認すると安定する。',
  ],
};

const EL1_B_SET4_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_B_set4_1',
    audioUrl: '/listening_audio/el1B_set4_q1.mp3',
    label: '問1',
    hint: '女性（高校生）',
    script: '"The bird\'s nest is not in the tallest tree. It\'s in the shorter one next to it."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set4_2',
    audioUrl: '/listening_audio/el1B_set4_q2.mp3',
    label: '問2',
    hint: '男性（大学生）',
    script: '"The boy is waving behind the car, not in front of it."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set4_3',
    audioUrl: '/listening_audio/el1B_set4_q3.mp3',
    label: '問3',
    hint: '女性（小学生の母）',
    script: '"My son is holding the round clock, and my daughter has the square one."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set4_4',
    audioUrl: '/listening_audio/el1B_set4_q4.mp3',
    label: '問4',
    hint: '男性（ケーキ店の店員）',
    script: '"The large cake is 800 yen, and the small one is 300 yen."',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_B_SET4: ListeningProblem = {
  id: 'q_el1_B_set4',
  category: '第4回 発話に合うイラストを選ぶ（やや難）',
  readCount: 2,
  audioTracks: EL1_B_SET4_TRACKS,
  text: `第4回　第1問 B（4問・2回読み）　【難易度：やや難】

第1問 B では、短い英文が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。イラストは各問の下に①〜④の順で並んでいます。

【解き方のコツ】
音声が流れる前に4枚のイラストを見比べ、「どこが違うか」を1語で言えるようにしておきます（上／下、赤／青、2人／3人 など）。違いが分かっていれば、聞き取るべき1語が決まります。

────────────────────
問1（話者：女性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問2（話者：男性（大学生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問3（話者：女性（小学生の母））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問4（話者：男性（ケーキ店の店員））
イラスト①〜④から、発話の内容に合うものを選びなさい。`,
  subQuestions: [
    {
      id: 'q_el1_B_set4_1',
      label: '問1 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 54,
      imageUrl: '/listening_q1b/el1B_set4_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'not in the tallest tree の否定＋the shorter one（代名詞 one の指示）の2段構え',
        type: 'イラスト選択型',
        difficulty: 4,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set4_2',
      label: '問2 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 51,
      imageUrl: '/listening_q1b/el1B_set4_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'behind と in front of の反転＋not A の否定',
        type: 'イラスト選択型',
        difficulty: 4,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set4_3',
      label: '問3 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 48,
      imageUrl: '/listening_q1b/el1B_set4_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '人物（son/daughter）と形（round/square）の対応の入れ替え',
        type: 'イラスト選択型',
        difficulty: 4,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set4_4',
      label: '問4 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 45,
      imageUrl: '/listening_q1b/el1B_set4_q4.jpg',
      imageCaption: '問4 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'サイズと価格の対応',
        type: 'イラスト選択型',
        difficulty: 4,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
  ],
  explanation: `第4回（難易度：やや難）の解説です。イラスト選択では「4枚の違い」を先に言語化しておくことが最大の得点源になります。

問1　正解は ②
スクリプト："The bird's nest is not in the tallest tree. It's in the shorter one next to it."
イラストの内容：① 一番高い木に鳥の巣／② 高い木の隣の低い木に鳥の巣／③ 2つの木両方に鳥の巣／④ 巣はなく、高い木の上を鳥が飛んでいる
正解のイラスト：高い木の隣の低い木に鳥の巣
not in the tallest tree の否定＋the shorter one（代名詞 one の指示）の2段構え。2025年問5（the other one）型。

問2　正解は ①
スクリプト："The boy is waving behind the car, not in front of it."
イラストの内容：① 車の後ろで手を振る男の子／② 車の前で手を振る男の子／③ 車の中で手を振る男の子／④ 車の横に立つが手を振っていない男の子
正解のイラスト：車の後ろで手を振る男の子
behind と in front of の反転＋not A の否定。動作（waving）の有無も絡む複合問題。

問3　正解は ①
スクリプト："My son is holding the round clock, and my daughter has the square one."
イラストの内容：① 男の子が丸い時計、女の子が四角い時計／② 男の子が四角い時計、女の子が丸い時計／③ 2人とも丸い時計／④ 2人とも四角い時計
正解のイラスト：男の子が丸い時計、女の子が四角い時計
人物（son/daughter）と形（round/square）の対応の入れ替え。①と②が鏡像。

問4　正解は ②
スクリプト："The large cake is 800 yen, and the small one is 300 yen."
イラストの内容：① 大300円・中500円・小800円／② 大800円・小300円／③ 全部500円／④ 小800円・大500円・中300円
正解のイラスト：大800円・小300円
サイズと価格の対応。「大きい＝高い」という先入観を逆手に取る①が強いひっかけ。`,
  surroundingKnowledge: [
    '位置の前置詞：on（接触して上）／over・above（離れて上）／under・below（下）／in front of（前）／behind（後ろ）／between A and B（A と B の間）／next to・beside（隣）。',
    '比較の聞き取り：taller / shorter / bigger / more ~ than。どちらが基準かを取り違えないこと。',
    '数の聞き取り：two / three / four に加え、both / none of / all of / one more / two left の言い換え。',
    '否定：not A but B（A ではなく B）は、イラスト選択で最も多い仕掛け。but の後ろが正解。',
    '時の対比：now ↔ a minute ago / just flew away。「今の状態」を描いた1枚を選ぶ。',
  ],
  deepDiveTopics: [
    '4枚のイラストは「1か所だけ違う」ように作られている。違いの軸（位置・色・数・動作）を先に決めるのが定石。',
    '音声に出た語がそのまま描かれている絵は、しばしばダミーである（not / instead of の前の語）。',
    '2回読みのうち1回目で軸を絞り、2回目で残った候補の差分だけを確認すると安定する。',
  ],
};

const EL1_B_SET5_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_B_set5_1',
    audioUrl: '/listening_audio/el1B_set5_q1.mp3',
    label: '問1',
    hint: '女性（母親）',
    script: '"It\'s sunny now, so I hung the wet umbrella outside to dry."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set5_2',
    audioUrl: '/listening_audio/el1B_set5_q2.mp3',
    label: '問2',
    hint: '男性（高校生）',
    script: '"I had bread for breakfast this morning, not rice."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set5_3',
    audioUrl: '/listening_audio/el1B_set5_q3.mp3',
    label: '問3',
    hint: '女性（受付係）',
    script: '"The meeting room is on the second floor, right next to the elevator."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set5_4',
    audioUrl: '/listening_audio/el1B_set5_q4.mp3',
    label: '問4',
    hint: '男性（父親）',
    script: '"We have two cars. I use the white one, and my wife drives the black one."',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_B_SET5: ListeningProblem = {
  id: 'q_el1_B_set5',
  category: '第5回 発話に合うイラストを選ぶ（易しめ）',
  readCount: 2,
  audioTracks: EL1_B_SET5_TRACKS,
  text: `第5回　第1問 B（4問・2回読み）　【難易度：易しめ】

第1問 B では、短い英文が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。イラストは各問の下に①〜④の順で並んでいます。

【解き方のコツ】
音声が流れる前に4枚のイラストを見比べ、「どこが違うか」を1語で言えるようにしておきます（上／下、赤／青、2人／3人 など）。違いが分かっていれば、聞き取るべき1語が決まります。

────────────────────
問1（話者：女性（母親））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問2（話者：男性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問3（話者：女性（受付係））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問4（話者：男性（父親））
イラスト①〜④から、発話の内容に合うものを選びなさい。`,
  subQuestions: [
    {
      id: 'q_el1_B_set5_1',
      label: '問1 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 78,
      imageUrl: '/listening_q1b/el1B_set5_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'sunny と wet umbrella（干している）の組み合わせ',
        type: 'イラスト選択型',
        difficulty: 2,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set5_2',
      label: '問2 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 75,
      imageUrl: '/listening_q1b/el1B_set5_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'not rice の否定が核心',
        type: 'イラスト選択型',
        difficulty: 2,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set5_3',
      label: '問3 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 72,
      imageUrl: '/listening_q1b/el1B_set5_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '階数（second floor）と位置（next to the elevator）の2条件',
        type: 'イラスト選択型',
        difficulty: 2,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set5_4',
      label: '問4 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 69,
      imageUrl: '/listening_q1b/el1B_set5_q4.jpg',
      imageCaption: '問4 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '2台の色の組み合わせを聞き取る',
        type: 'イラスト選択型',
        difficulty: 2,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
  ],
  explanation: `第5回（難易度：易しめ）の解説です。イラスト選択では「4枚の違い」を先に言語化しておくことが最大の得点源になります。

問1　正解は ①
スクリプト："It's sunny now, so I hung the wet umbrella outside to dry."
イラストの内容：① 晴れた空、家の外に濡れた傘が干してある／② 豪雨の家／③ 雪の降る家／④ 曇り空の家（雨なし）
正解のイラスト：晴れた空、家の外に濡れた傘が干してある
sunny と wet umbrella（干している）の組み合わせ。天気＋状態の2条件。

問2　正解は ②
スクリプト："I had bread for breakfast this morning, not rice."
イラストの内容：① ご飯とみそ汁の朝食（パンなし）／② トーストとジャムの朝食（ご飯なし）／③ ご飯とパンの両方／④ シリアルと牛乳
正解のイラスト：トーストとジャムの朝食（ご飯なし）
not rice の否定が核心。A not B 型の基本問題。

問3　正解は ①
スクリプト："The meeting room is on the second floor, right next to the elevator."
イラストの内容：① 2階のエレベーターの横に会議室／② 1階のエレベーターの横に会議室／③ 2階のエレベーターから遠い端に会議室／④ 1階の階段の横に会議室
正解のイラスト：2階のエレベーターの横に会議室
階数（second floor）と位置（next to the elevator）の2条件。right next to の強調がポイント。

問4　正解は ①
スクリプト："We have two cars. I use the white one, and my wife drives the black one."
イラストの内容：① 白い車と黒い車の2台（黒に印）／② 赤と白の2台／③ 白い車1台のみ／④ 黒い車2台
正解のイラスト：白い車と黒い車の2台（黒に印）
2台の色の組み合わせを聞き取る。誰がどちらを使うかの情報も含むが、絵は車の色の組み合わせ で決まる。`,
  surroundingKnowledge: [
    '位置の前置詞：on（接触して上）／over・above（離れて上）／under・below（下）／in front of（前）／behind（後ろ）／between A and B（A と B の間）／next to・beside（隣）。',
    '比較の聞き取り：taller / shorter / bigger / more ~ than。どちらが基準かを取り違えないこと。',
    '数の聞き取り：two / three / four に加え、both / none of / all of / one more / two left の言い換え。',
    '否定：not A but B（A ではなく B）は、イラスト選択で最も多い仕掛け。but の後ろが正解。',
    '時の対比：now ↔ a minute ago / just flew away。「今の状態」を描いた1枚を選ぶ。',
  ],
  deepDiveTopics: [
    '4枚のイラストは「1か所だけ違う」ように作られている。違いの軸（位置・色・数・動作）を先に決めるのが定石。',
    '音声に出た語がそのまま描かれている絵は、しばしばダミーである（not / instead of の前の語）。',
    '2回読みのうち1回目で軸を絞り、2回目で残った候補の差分だけを確認すると安定する。',
  ],
};

const EL1_B_SET6_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_B_set6_1',
    audioUrl: '/listening_audio/el1B_set6_q1.mp3',
    label: '問1',
    hint: '女性（高校生）',
    script: '"The girl with short hair is riding a bicycle, but the girl with long hair is walking."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set6_2',
    audioUrl: '/listening_audio/el1B_set6_q2.mp3',
    label: '問2',
    hint: '男性（高校生）',
    script: '"There are three clocks on the wall. The middle one shows seven o\'clock."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set6_3',
    audioUrl: '/listening_audio/el1B_set6_q3.mp3',
    label: '問3',
    hint: '女の子（小学生）',
    script: '"My little brother is hiding behind the door. Can you see his shoes?"',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set6_4',
    audioUrl: '/listening_audio/el1B_set6_q4.mp3',
    label: '問4',
    hint: '男性（会社員）',
    script: '"This box is too heavy for me. Let\'s put it on the floor, not on the shelf."',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_B_SET6: ListeningProblem = {
  id: 'q_el1_B_set6',
  category: '第6回 発話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL1_B_SET6_TRACKS,
  text: `第6回　第1問 B（4問・2回読み）　【難易度：標準】

第1問 B では、短い英文が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。イラストは各問の下に①〜④の順で並んでいます。

【解き方のコツ】
音声が流れる前に4枚のイラストを見比べ、「どこが違うか」を1語で言えるようにしておきます（上／下、赤／青、2人／3人 など）。違いが分かっていれば、聞き取るべき1語が決まります。

────────────────────
問1（話者：女性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問2（話者：男性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問3（話者：女の子（小学生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問4（話者：男性（会社員））
イラスト①〜④から、発話の内容に合うものを選びなさい。`,
  subQuestions: [
    {
      id: 'q_el1_B_set6_1',
      label: '問1 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 66,
      imageUrl: '/listening_q1b/el1B_set6_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '髪の長さと移動手段の対応',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set6_2',
      label: '問2 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 63,
      imageUrl: '/listening_q1b/el1B_set6_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '個数（three）＋位置（the middle one）＋時刻（seven）の3条件',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set6_3',
      label: '問3 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 60,
      imageUrl: '/listening_q1b/el1B_set6_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'behind the door の位置＋his shoes が見えるという詳細',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set6_4',
      label: '問4 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 57,
      imageUrl: '/listening_q1b/el1B_set6_q4.jpg',
      imageCaption: '問4 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'not on the shelf の否定と on the floor の結論',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
  ],
  explanation: `第6回（難易度：標準）の解説です。イラスト選択では「4枚の違い」を先に言語化しておくことが最大の得点源になります。

問1　正解は ②
スクリプト："The girl with short hair is riding a bicycle, but the girl with long hair is walking."
イラストの内容：① 長い髪の子が自転車、短い髪の子が徒歩／② 短い髪の子が自転車、長い髪の子が徒歩／③ 2人とも自転車／④ 2人とも徒歩
正解のイラスト：短い髪の子が自転車、長い髪の子が徒歩
髪の長さと移動手段の対応。but の対比構文。①と②が鏡像の典型問題。

問2　正解は ①
スクリプト："There are three clocks on the wall. The middle one shows seven o'clock."
イラストの内容：① 3つの時計、中央が7時／② 3つの時計、中央が9時／③ 2つの時計、左が7時／④ 3つの時計、中央が12時
正解のイラスト：3つの時計、中央が7時
個数（three）＋位置（the middle one）＋時刻（seven）の3条件。時計の針の読み取り問題。

問3　正解は ①
スクリプト："My little brother is hiding behind the door. Can you see his shoes?"
イラストの内容：① ドアの後ろに隠れる男の子（靴だけ見える）／② ドアの前に立つ男の子／③ ベッドの下に隠れる男の子／④ カーテンの後ろに隠れる男の子
正解のイラスト：ドアの後ろに隠れる男の子（靴だけ見える）
behind the door の位置＋his shoes が見えるという詳細。隠れ場所の違いがひっかけ。

問4　正解は ①
スクリプト："This box is too heavy for me. Let's put it on the floor, not on the shelf."
イラストの内容：① 箱を床に置こうとしている2人／② 箱を棚の上に置く2人／③ 箱をテーブルの上に置く2人／④ 1人で箱を持ち上げる男性
正解のイラスト：箱を床に置こうとしている2人
not on the shelf の否定と on the floor の結論。重いので床に、という理由付きの判断問題。`,
  surroundingKnowledge: [
    '位置の前置詞：on（接触して上）／over・above（離れて上）／under・below（下）／in front of（前）／behind（後ろ）／between A and B（A と B の間）／next to・beside（隣）。',
    '比較の聞き取り：taller / shorter / bigger / more ~ than。どちらが基準かを取り違えないこと。',
    '数の聞き取り：two / three / four に加え、both / none of / all of / one more / two left の言い換え。',
    '否定：not A but B（A ではなく B）は、イラスト選択で最も多い仕掛け。but の後ろが正解。',
    '時の対比：now ↔ a minute ago / just flew away。「今の状態」を描いた1枚を選ぶ。',
  ],
  deepDiveTopics: [
    '4枚のイラストは「1か所だけ違う」ように作られている。違いの軸（位置・色・数・動作）を先に決めるのが定石。',
    '音声に出た語がそのまま描かれている絵は、しばしばダミーである（not / instead of の前の語）。',
    '2回読みのうち1回目で軸を絞り、2回目で残った候補の差分だけを確認すると安定する。',
  ],
};

const EL1_B_SET7_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_B_set7_1',
    audioUrl: '/listening_audio/el1B_set7_q1.mp3',
    label: '問1',
    hint: '女性（高校生）',
    script: '"The poster of the mountains is above the desk, and the poster of the sea is next to the window."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set7_2',
    audioUrl: '/listening_audio/el1B_set7_q2.mp3',
    label: '問2',
    hint: '男性（お年寄り）',
    script: '"I can see two dogs in the park. The white one is running, but the black one is sleeping."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set7_3',
    audioUrl: '/listening_audio/el1B_set7_q3.mp3',
    label: '問3',
    hint: '女性（駅員）',
    script: '"To get to the platform, go up the stairs and turn right. Don\'t use the escalator today."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set7_4',
    audioUrl: '/listening_audio/el1B_set7_q4.mp3',
    label: '問4',
    hint: '男性（高校生）',
    script: '"There are more oranges than apples in the basket. I count five oranges and three apples."',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_B_SET7: ListeningProblem = {
  id: 'q_el1_B_set7',
  category: '第7回 発話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL1_B_SET7_TRACKS,
  text: `第7回　第1問 B（4問・2回読み）　【難易度：標準】

第1問 B では、短い英文が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。イラストは各問の下に①〜④の順で並んでいます。

【解き方のコツ】
音声が流れる前に4枚のイラストを見比べ、「どこが違うか」を1語で言えるようにしておきます（上／下、赤／青、2人／3人 など）。違いが分かっていれば、聞き取るべき1語が決まります。

────────────────────
問1（話者：女性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問2（話者：男性（お年寄り））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問3（話者：女性（駅員））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問4（話者：男性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。`,
  subQuestions: [
    {
      id: 'q_el1_B_set7_1',
      label: '問1 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 66,
      imageUrl: '/listening_q1b/el1B_set7_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '2枚のポスター（山/海）と2か所（机の上/窓の横）の対応',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set7_2',
      label: '問2 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 63,
      imageUrl: '/listening_q1b/el1B_set7_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '色と動作の対応＋but の対比',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set7_3',
      label: '問3 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 60,
      imageUrl: '/listening_q1b/el1B_set7_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'up the stairs＋turn right＋not the escalator の3情報',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set7_4',
      label: '問4 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 57,
      imageUrl: '/listening_q1b/el1B_set7_q4.jpg',
      imageCaption: '問4 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'more A than B（Aのほうが多い）の比較と具体数',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
  ],
  explanation: `第7回（難易度：標準）の解説です。イラスト選択では「4枚の違い」を先に言語化しておくことが最大の得点源になります。

問1　正解は ③
スクリプト："The poster of the mountains is above the desk, and the poster of the sea is next to the window."
イラストの内容：① 2枚とも窓の横／② 海のポスターが机の上、山のポスターが窓の横／③ 山のポスターが机の上、海のポスターが窓の横／④ 山のポスターだけが机の上
正解のイラスト：山のポスターが机の上、海のポスターが窓の横
2枚のポスター（山/海）と2か所（机の上/窓の横）の対応。③と②が入れ替えのひっかけ。

問2　正解は ④
スクリプト："I can see two dogs in the park. The white one is running, but the black one is sleeping."
イラストの内容：① 2匹とも走っている／② 黒い犬が走り、白い犬が寝ている／③ 2匹とも寝ている／④ 白い犬が走り、黒い犬が寝ている
正解のイラスト：白い犬が走り、黒い犬が寝ている
色と動作の対応＋but の対比。走る/寝るの組み合わせの鏡像がひっかけ。

問3　正解は ②
スクリプト："To get to the platform, go up the stairs and turn right. Don't use the escalator today."
イラストの内容：① 階段を上がって左へ曲がる案内／② 階段を上がって右へ曲がる案内／③ エスカレーターで上がる案内／④ エレベーターの案内
正解のイラスト：階段を上がって右へ曲がる案内
up the stairs＋turn right＋not the escalator の3情報。左右の反転がひっかけ。

問4　正解は ①
スクリプト："There are more oranges than apples in the basket. I count five oranges and three apples."
イラストの内容：① かごにみかん5個・りんご3個／② かごにみかん5個だけ／③ かごにみかん3個・りんご5個／④ かごにりんご8個
正解のイラスト：かごにみかん5個・りんご3個
more A than B（Aのほうが多い）の比較と具体数。5と3の対応を逆に取る③がひっかけ。`,
  surroundingKnowledge: [
    '位置の前置詞：on（接触して上）／over・above（離れて上）／under・below（下）／in front of（前）／behind（後ろ）／between A and B（A と B の間）／next to・beside（隣）。',
    '比較の聞き取り：taller / shorter / bigger / more ~ than。どちらが基準かを取り違えないこと。',
    '数の聞き取り：two / three / four に加え、both / none of / all of / one more / two left の言い換え。',
    '否定：not A but B（A ではなく B）は、イラスト選択で最も多い仕掛け。but の後ろが正解。',
    '時の対比：now ↔ a minute ago / just flew away。「今の状態」を描いた1枚を選ぶ。',
  ],
  deepDiveTopics: [
    '4枚のイラストは「1か所だけ違う」ように作られている。違いの軸（位置・色・数・動作）を先に決めるのが定石。',
    '音声に出た語がそのまま描かれている絵は、しばしばダミーである（not / instead of の前の語）。',
    '2回読みのうち1回目で軸を絞り、2回目で残った候補の差分だけを確認すると安定する。',
  ],
};

const EL1_B_SET8_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_B_set8_1',
    audioUrl: '/listening_audio/el1B_set8_q1.mp3',
    label: '問1',
    hint: '女性（大学生）',
    script: '"The girl playing the guitar is my sister. The one at the piano is her friend."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set8_2',
    audioUrl: '/listening_audio/el1B_set8_q2.mp3',
    label: '問2',
    hint: '男性（高校生）',
    script: '"I put the dictionary on the top shelf because I use it every day. The photo album is on the bottom shelf."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set8_3',
    audioUrl: '/listening_audio/el1B_set8_q3.mp3',
    label: '問3',
    hint: '女性（母親）',
    script: '"Look at the pond. There are three ducks swimming, and two more are sitting on the grass."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set8_4',
    audioUrl: '/listening_audio/el1B_set8_q4.mp3',
    label: '問4',
    hint: '男性（乗客）',
    script: '"The bus is almost full. There\'s only one seat left, next to the old man at the back."',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_B_SET8: ListeningProblem = {
  id: 'q_el1_B_set8',
  category: '第8回 発話に合うイラストを選ぶ（やや難）',
  readCount: 2,
  audioTracks: EL1_B_SET8_TRACKS,
  text: `第8回　第1問 B（4問・2回読み）　【難易度：やや難】

第1問 B では、短い英文が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。イラストは各問の下に①〜④の順で並んでいます。

【解き方のコツ】
音声が流れる前に4枚のイラストを見比べ、「どこが違うか」を1語で言えるようにしておきます（上／下、赤／青、2人／3人 など）。違いが分かっていれば、聞き取るべき1語が決まります。

────────────────────
問1（話者：女性（大学生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問2（話者：男性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問3（話者：女性（母親））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問4（話者：男性（乗客））
イラスト①〜④から、発話の内容に合うものを選びなさい。`,
  subQuestions: [
    {
      id: 'q_el1_B_set8_1',
      label: '問1 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 54,
      imageUrl: '/listening_q1b/el1B_set8_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '楽器（guitar/piano）と人物関係（sister/friend）の対応',
        type: 'イラスト選択型',
        difficulty: 4,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set8_2',
      label: '問2 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 51,
      imageUrl: '/listening_q1b/el1B_set8_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'top shelf / bottom shelf の上下と物の対応',
        type: 'イラスト選択型',
        difficulty: 4,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set8_3',
      label: '問3 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 48,
      imageUrl: '/listening_q1b/el1B_set8_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '数（three + two more）と場所（in the pond / on the grass）の対応',
        type: 'イラスト選択型',
        difficulty: 4,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set8_4',
      label: '問4 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 45,
      imageUrl: '/listening_q1b/el1B_set8_q4.jpg',
      imageCaption: '問4 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'only one seat left（残り1席）＋位置（next to the old man at the back）の2条件',
        type: 'イラスト選択型',
        difficulty: 4,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
  ],
  explanation: `第8回（難易度：やや難）の解説です。イラスト選択では「4枚の違い」を先に言語化しておくことが最大の得点源になります。

問1　正解は ④
スクリプト："The girl playing the guitar is my sister. The one at the piano is her friend."
イラストの内容：① ピアノを弾く女の子（話者の妹）と、ギターの女の子／② 2人ともピアノ／③ バイオリンとピアノを弾く2人／④ ギターを弾く女の子（話者の妹）と、ピアノの女の子
正解のイラスト：ギターを弾く女の子（話者の妹）と、ピアノの女の子
楽器（guitar/piano）と人物関係（sister/friend）の対応。楽器名の聞き取りと入れ替えが鍵。

問2　正解は ③
スクリプト："I put the dictionary on the top shelf because I use it every day. The photo album is on the bottom shelf."
イラストの内容：① 辞書が真ん中、アルバムが上／② 辞書が一番下、写真アルバムが一番上／③ 辞書が一番上の棚、写真アルバムが一番下の棚／④ 2冊とも真ん中の棚
正解のイラスト：辞書が一番上の棚、写真アルバムが一番下の棚
top shelf / bottom shelf の上下と物の対応。because 以下の理由はダミー情報。

問3　正解は ①
スクリプト："Look at the pond. There are three ducks swimming, and two more are sitting on the grass."
イラストの内容：① アヒル3羽が泳ぎ、2羽が草の上に座っている／② アヒル5羽すべてが泳いでいる／③ アヒル2羽が泳ぎ、3羽が草の上／④ アヒル3羽が泳ぎ、1羽が飛んでいる
正解のイラスト：アヒル3羽が泳ぎ、2羽が草の上に座っている
数（three + two more）と場所（in the pond / on the grass）の対応。合計5羽だが動作で分かれる。

問4　正解は ②
スクリプト："The bus is almost full. There's only one seat left, next to the old man at the back."
イラストの内容：① 前のほうに空席がたくさん／② 後部のお年寄りの横に1つだけ空席／③ 運転席のすぐ後ろに空席1つ／④ 空席なし（全員座っている）
正解のイラスト：後部のお年寄りの横に1つだけ空席
only one seat left（残り1席）＋位置（next to the old man at the back）の2条件。almost full の状況把握も必要。`,
  surroundingKnowledge: [
    '位置の前置詞：on（接触して上）／over・above（離れて上）／under・below（下）／in front of（前）／behind（後ろ）／between A and B（A と B の間）／next to・beside（隣）。',
    '比較の聞き取り：taller / shorter / bigger / more ~ than。どちらが基準かを取り違えないこと。',
    '数の聞き取り：two / three / four に加え、both / none of / all of / one more / two left の言い換え。',
    '否定：not A but B（A ではなく B）は、イラスト選択で最も多い仕掛け。but の後ろが正解。',
    '時の対比：now ↔ a minute ago / just flew away。「今の状態」を描いた1枚を選ぶ。',
  ],
  deepDiveTopics: [
    '4枚のイラストは「1か所だけ違う」ように作られている。違いの軸（位置・色・数・動作）を先に決めるのが定石。',
    '音声に出た語がそのまま描かれている絵は、しばしばダミーである（not / instead of の前の語）。',
    '2回読みのうち1回目で軸を絞り、2回目で残った候補の差分だけを確認すると安定する。',
  ],
};

const EL1_B_SET9_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_B_set9_1',
    audioUrl: '/listening_audio/el1B_set9_q1.mp3',
    label: '問1',
    hint: '女性（高校生）',
    script: '"Can I have some soup, please? I don\'t want salad today."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set9_2',
    audioUrl: '/listening_audio/el1B_set9_q2.mp3',
    label: '問2',
    hint: '男性（教師）',
    script: '"The flag is on the left side of the blackboard, not the right."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set9_3',
    audioUrl: '/listening_audio/el1B_set9_q3.mp3',
    label: '問3',
    hint: '女の子（小学生）',
    script: '"I\'m wearing my new blue hat today, not the yellow one."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set9_4',
    audioUrl: '/listening_audio/el1B_set9_q4.mp3',
    label: '問4',
    hint: '男性（車掌）',
    script: '"The doors on the left side will open at the next station."',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_B_SET9: ListeningProblem = {
  id: 'q_el1_B_set9',
  category: '第9回 発話に合うイラストを選ぶ（易しめ）',
  readCount: 2,
  audioTracks: EL1_B_SET9_TRACKS,
  text: `第9回　第1問 B（4問・2回読み）　【難易度：易しめ】

第1問 B では、短い英文が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。イラストは各問の下に①〜④の順で並んでいます。

【解き方のコツ】
音声が流れる前に4枚のイラストを見比べ、「どこが違うか」を1語で言えるようにしておきます（上／下、赤／青、2人／3人 など）。違いが分かっていれば、聞き取るべき1語が決まります。

────────────────────
問1（話者：女性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問2（話者：男性（教師））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問3（話者：女の子（小学生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問4（話者：男性（車掌））
イラスト①〜④から、発話の内容に合うものを選びなさい。`,
  subQuestions: [
    {
      id: 'q_el1_B_set9_1',
      label: '問1 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 78,
      imageUrl: '/listening_q1b/el1B_set9_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'don\'t want salad の否定が核心',
        type: 'イラスト選択型',
        difficulty: 2,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set9_2',
      label: '問2 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 75,
      imageUrl: '/listening_q1b/el1B_set9_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'left / not the right の位置の聞き分け',
        type: 'イラスト選択型',
        difficulty: 2,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set9_3',
      label: '問3 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 72,
      imageUrl: '/listening_q1b/el1B_set9_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'wearing（かぶっている）と色（blue, not yellow）の2条件',
        type: 'イラスト選択型',
        difficulty: 2,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set9_4',
      label: '問4 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 69,
      imageUrl: '/listening_q1b/el1B_set9_q4.jpg',
      imageCaption: '問4 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'left side の聞き取りのみのシンプルな問題',
        type: 'イラスト選択型',
        difficulty: 2,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
  ],
  explanation: `第9回（難易度：易しめ）の解説です。イラスト選択では「4枚の違い」を先に言語化しておくことが最大の得点源になります。

問1　正解は ③
スクリプト："Can I have some soup, please? I don't want salad today."
イラストの内容：① スープとサラダ両方／② パンを頼む女の子／③ スープを頼む女の子／④ サラダを頼む女の子
正解のイラスト：スープを頼む女の子
don't want salad の否定が核心。欲しいもの／いらないものの基本問題。

問2　正解は ②
スクリプト："The flag is on the left side of the blackboard, not the right."
イラストの内容：① 黒板の上に国旗／② 黒板の左側に国旗／③ 黒板の横に旗はない／④ 黒板の右側に国旗
正解のイラスト：黒板の左側に国旗
left / not the right の位置の聞き分け。左右反転の最も基本的な型。

問3　正解は ④
スクリプト："I'm wearing my new blue hat today, not the yellow one."
イラストの内容：① 青い帽子を手に持つ女の子／② 帽子をかぶっていない女の子／③ 黄色い帽子をかぶる女の子／④ 青い帽子をかぶる女の子
正解のイラスト：青い帽子をかぶる女の子
wearing（かぶっている）と色（blue, not yellow）の2条件。「かぶる／持つ」の動作の違いもひっかけ。

問4　正解は ①
スクリプト："The doors on the left side will open at the next station."
イラストの内容：① 電車の左側のドアが開く／② 両側のドアが開く／③ 電車の右側のドアが開く／④ ドアは開かない
正解のイラスト：電車の左側のドアが開く
left side の聞き取りのみのシンプルな問題。車内アナウンスの場面設定。`,
  surroundingKnowledge: [
    '位置の前置詞：on（接触して上）／over・above（離れて上）／under・below（下）／in front of（前）／behind（後ろ）／between A and B（A と B の間）／next to・beside（隣）。',
    '比較の聞き取り：taller / shorter / bigger / more ~ than。どちらが基準かを取り違えないこと。',
    '数の聞き取り：two / three / four に加え、both / none of / all of / one more / two left の言い換え。',
    '否定：not A but B（A ではなく B）は、イラスト選択で最も多い仕掛け。but の後ろが正解。',
    '時の対比：now ↔ a minute ago / just flew away。「今の状態」を描いた1枚を選ぶ。',
  ],
  deepDiveTopics: [
    '4枚のイラストは「1か所だけ違う」ように作られている。違いの軸（位置・色・数・動作）を先に決めるのが定石。',
    '音声に出た語がそのまま描かれている絵は、しばしばダミーである（not / instead of の前の語）。',
    '2回読みのうち1回目で軸を絞り、2回目で残った候補の差分だけを確認すると安定する。',
  ],
};

const EL1_B_SET10_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_B_set10_1',
    audioUrl: '/listening_audio/el1B_set10_q1.mp3',
    label: '問1',
    hint: '女性（会社員）',
    script: '"The calendar on the wall says today is Wednesday, the fifteenth."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set10_2',
    audioUrl: '/listening_audio/el1B_set10_q2.mp3',
    label: '問2',
    hint: '男性（高校生）',
    script: '"This is a photo of my family. There are five of us, including the dog."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set10_3',
    audioUrl: '/listening_audio/el1B_set10_q3.mp3',
    label: '問3',
    hint: '女性（カフェ店員）',
    script: '"Here you are. Two cups of coffee and one cup of tea. The tea is for the lady by the window."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set10_4',
    audioUrl: '/listening_audio/el1B_set10_q4.mp3',
    label: '問4',
    hint: '男の子（中学生）',
    script: '"The children are sitting under the tree because it\'s too hot in the sun."',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_B_SET10: ListeningProblem = {
  id: 'q_el1_B_set10',
  category: '第10回 発話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL1_B_SET10_TRACKS,
  text: `第10回　第1問 B（4問・2回読み）　【難易度：標準】

第1問 B では、短い英文が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。イラストは各問の下に①〜④の順で並んでいます。

【解き方のコツ】
音声が流れる前に4枚のイラストを見比べ、「どこが違うか」を1語で言えるようにしておきます（上／下、赤／青、2人／3人 など）。違いが分かっていれば、聞き取るべき1語が決まります。

────────────────────
問1（話者：女性（会社員））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問2（話者：男性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問3（話者：女性（カフェ店員））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問4（話者：男の子（中学生））
イラスト①〜④から、発話の内容に合うものを選びなさい。`,
  subQuestions: [
    {
      id: 'q_el1_B_set10_1',
      label: '問1 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 66,
      imageUrl: '/listening_q1b/el1B_set10_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '曜日（Wednesday）と日付（the fifteenth）の2条件',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set10_2',
      label: '問2 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 63,
      imageUrl: '/listening_q1b/el1B_set10_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'five of us, including the dog（犬を入れて5）の解釈が核心',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set10_3',
      label: '問3 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 60,
      imageUrl: '/listening_q1b/el1B_set10_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '飲み物の種類と数（two coffees / one tea）の対応',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set10_4',
      label: '問4 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 57,
      imageUrl: '/listening_q1b/el1B_set10_q4.jpg',
      imageCaption: '問4 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'under the tree の位置と、because 以下の理由（暑いから）はダミー情報',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
  ],
  explanation: `第10回（難易度：標準）の解説です。イラスト選択では「4枚の違い」を先に言語化しておくことが最大の得点源になります。

問1　正解は ②
スクリプト："The calendar on the wall says today is Wednesday, the fifteenth."
イラストの内容：① 5日（水曜）に丸印のカレンダー／② 15日（水曜）に丸印のカレンダー／③ 25日（水曜）に丸印のカレンダー／④ 15日（木曜）に丸印のカレンダー
正解のイラスト：15日（水曜）に丸印のカレンダー
曜日（Wednesday）と日付（the fifteenth）の2条件。fifteen/fifty 系の音の聞き分けも絡む。

問2　正解は ④
スクリプト："This is a photo of my family. There are five of us, including the dog."
イラストの内容：① 人間3人と犬2匹／② 人間4人の写真（犬なし）／③ 人間5人の写真（犬なし）／④ 人間4人と犬1匹の写真
正解のイラスト：人間4人と犬1匹の写真
five of us, including the dog（犬を入れて5）の解釈が核心。「犬を含める」表現のひっかけ。

問3　正解は ①
スクリプト："Here you are. Two cups of coffee and one cup of tea. The tea is for the lady by the window."
イラストの内容：① コーヒー2杯と紅茶1杯（紅茶は窓際の客へ）／② コーヒー1杯と紅茶2杯／③ コーヒー3杯／④ 紅茶3杯
正解のイラスト：コーヒー2杯と紅茶1杯（紅茶は窓際の客へ）
飲み物の種類と数（two coffees / one tea）の対応。by the window の位置情報は補助。

問4　正解は ③
スクリプト："The children are sitting under the tree because it's too hot in the sun."
イラストの内容：① 木の下で立っている子どもたち／② 日なたに座る子どもたち／③ 木の下に座る子どもたち／④ ベンチに座る子どもたち
正解のイラスト：木の下に座る子どもたち
under the tree の位置と、because 以下の理由（暑いから）はダミー情報。座る／立つもひっかけ。`,
  surroundingKnowledge: [
    '位置の前置詞：on（接触して上）／over・above（離れて上）／under・below（下）／in front of（前）／behind（後ろ）／between A and B（A と B の間）／next to・beside（隣）。',
    '比較の聞き取り：taller / shorter / bigger / more ~ than。どちらが基準かを取り違えないこと。',
    '数の聞き取り：two / three / four に加え、both / none of / all of / one more / two left の言い換え。',
    '否定：not A but B（A ではなく B）は、イラスト選択で最も多い仕掛け。but の後ろが正解。',
    '時の対比：now ↔ a minute ago / just flew away。「今の状態」を描いた1枚を選ぶ。',
  ],
  deepDiveTopics: [
    '4枚のイラストは「1か所だけ違う」ように作られている。違いの軸（位置・色・数・動作）を先に決めるのが定石。',
    '音声に出た語がそのまま描かれている絵は、しばしばダミーである（not / instead of の前の語）。',
    '2回読みのうち1回目で軸を絞り、2回目で残った候補の差分だけを確認すると安定する。',
  ],
};

const EL1_B_SET11_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_B_set11_1',
    audioUrl: '/listening_audio/el1B_set11_q1.mp3',
    label: '問1',
    hint: '女性（高校生）',
    script: '"I gave my teacher a bouquet of twelve red roses this morning."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set11_2',
    audioUrl: '/listening_audio/el1B_set11_q2.mp3',
    label: '問2',
    hint: '男性（父親）',
    script: '"There are two bicycles in front of our house. The blue one is mine."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set11_3',
    audioUrl: '/listening_audio/el1B_set11_q3.mp3',
    label: '問3',
    hint: '女性（祖母）',
    script: '"Both of my cats are sleeping. One is on the chair, and the other is on the rug."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set11_4',
    audioUrl: '/listening_audio/el1B_set11_q4.mp3',
    label: '問4',
    hint: '男性（高校生）',
    script: '"Please open the window. It\'s closed now, and the room is getting hot."',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_B_SET11: ListeningProblem = {
  id: 'q_el1_B_set11',
  category: '第11回 発話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL1_B_SET11_TRACKS,
  text: `第11回　第1問 B（4問・2回読み）　【難易度：標準】

第1問 B では、短い英文が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。イラストは各問の下に①〜④の順で並んでいます。

【解き方のコツ】
音声が流れる前に4枚のイラストを見比べ、「どこが違うか」を1語で言えるようにしておきます（上／下、赤／青、2人／3人 など）。違いが分かっていれば、聞き取るべき1語が決まります。

────────────────────
問1（話者：女性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問2（話者：男性（父親））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問3（話者：女性（祖母））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問4（話者：男性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。`,
  subQuestions: [
    {
      id: 'q_el1_B_set11_1',
      label: '問1 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 66,
      imageUrl: '/listening_q1b/el1B_set11_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '花の種類（roses）・色（red）・数（twelve）の3条件',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set11_2',
      label: '問2 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 63,
      imageUrl: '/listening_q1b/el1B_set11_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '台数（two）と場所（in front of the house）が要点',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set11_3',
      label: '問3 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 60,
      imageUrl: '/listening_q1b/el1B_set11_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'Both〜sleeping の両方＋one〜the other〜 の場所の対応',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set11_4',
      label: '問4 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 57,
      imageUrl: '/listening_q1b/el1B_set11_q4.jpg',
      imageCaption: '問4 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'open the window（依頼）＋It\'s closed now（現在の状態）の時間関係',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
  ],
  explanation: `第11回（難易度：標準）の解説です。イラスト選択では「4枚の違い」を先に言語化しておくことが最大の得点源になります。

問1　正解は ③
スクリプト："I gave my teacher a bouquet of twelve red roses this morning."
イラストの内容：① 赤いバラ6本の花束／② 赤いチューリップ12本／③ 赤いバラ12本の花束／④ 白いバラ12本の花束
正解のイラスト：赤いバラ12本の花束
花の種類（roses）・色（red）・数（twelve）の3条件。どれか1つだけ違う選択肢がひっかけ。

問2　正解は ①
スクリプト："There are two bicycles in front of our house. The blue one is mine."
イラストの内容：① 家の前に自転車2台（青と赤）／② 家の前に自転車1台（青）／③ 家の前にバイク2台／④ 家の後ろに自転車2台
正解のイラスト：家の前に自転車2台（青と赤）
台数（two）と場所（in front of the house）が要点。The blue one is mine は絵の特定に必須の情報ではない。

問3　正解は ②
スクリプト："Both of my cats are sleeping. One is on the chair, and the other is on the rug."
イラストの内容：① 2匹とも床で寝ている／② 1匹は椅子の上、もう1匹は絨毯の上で寝ている／③ 2匹とも椅子の上で寝ている／④ 1匹は寝て、もう1匹は遊んでいる
正解のイラスト：1匹は椅子の上、もう1匹は絨毯の上で寝ている
Both〜sleeping の両方＋one〜the other〜 の場所の対応。「片方だけ寝ている」④がひっかけ。

問4　正解は ④
スクリプト："Please open the window. It's closed now, and the room is getting hot."
イラストの内容：① 開いているドア／② 閉まっているドア／③ 開いている窓／④ 閉まっている窓（これから開ける場面）
正解のイラスト：閉まっている窓（これから開ける場面）
open the window（依頼）＋It's closed now（現在の状態）の時間関係。絵は「今閉まっている窓」が正解。③は未来の状態なので誤り。`,
  surroundingKnowledge: [
    '位置の前置詞：on（接触して上）／over・above（離れて上）／under・below（下）／in front of（前）／behind（後ろ）／between A and B（A と B の間）／next to・beside（隣）。',
    '比較の聞き取り：taller / shorter / bigger / more ~ than。どちらが基準かを取り違えないこと。',
    '数の聞き取り：two / three / four に加え、both / none of / all of / one more / two left の言い換え。',
    '否定：not A but B（A ではなく B）は、イラスト選択で最も多い仕掛け。but の後ろが正解。',
    '時の対比：now ↔ a minute ago / just flew away。「今の状態」を描いた1枚を選ぶ。',
  ],
  deepDiveTopics: [
    '4枚のイラストは「1か所だけ違う」ように作られている。違いの軸（位置・色・数・動作）を先に決めるのが定石。',
    '音声に出た語がそのまま描かれている絵は、しばしばダミーである（not / instead of の前の語）。',
    '2回読みのうち1回目で軸を絞り、2回目で残った候補の差分だけを確認すると安定する。',
  ],
};

const EL1_B_SET12_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_B_set12_1',
    audioUrl: '/listening_audio/el1B_set12_q1.mp3',
    label: '問1',
    hint: '女性（小学生）',
    script: '"The boy holding the flag is the leader of our team."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set12_2',
    audioUrl: '/listening_audio/el1B_set12_q2.mp3',
    label: '問2',
    hint: '男性（高校生）',
    script: '"I usually take the train to school, but today I came by bus because of the rain."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set12_3',
    audioUrl: '/listening_audio/el1B_set12_q3.mp3',
    label: '問3',
    hint: '女性（母親）',
    script: '"Put the apples in the green bowl and the oranges in the white one, please."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set12_4',
    audioUrl: '/listening_audio/el1B_set12_q4.mp3',
    label: '問4',
    hint: '男性（図書館司書）',
    script: '"Please be quiet. Some students are reading books at the desks near the window."',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_B_SET12: ListeningProblem = {
  id: 'q_el1_B_set12',
  category: '第12回 発話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL1_B_SET12_TRACKS,
  text: `第12回　第1問 B（4問・2回読み）　【難易度：標準】

第1問 B では、短い英文が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。イラストは各問の下に①〜④の順で並んでいます。

【解き方のコツ】
音声が流れる前に4枚のイラストを見比べ、「どこが違うか」を1語で言えるようにしておきます（上／下、赤／青、2人／3人 など）。違いが分かっていれば、聞き取るべき1語が決まります。

────────────────────
問1（話者：女性（小学生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問2（話者：男性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問3（話者：女性（母親））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問4（話者：男性（図書館司書））
イラスト①〜④から、発話の内容に合うものを選びなさい。`,
  subQuestions: [
    {
      id: 'q_el1_B_set12_1',
      label: '問1 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 66,
      imageUrl: '/listening_q1b/el1B_set12_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'holding the flag（旗を持っている）の現在分詞による人物特定',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set12_2',
      label: '問2 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 63,
      imageUrl: '/listening_q1b/el1B_set12_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'usually（いつも）と but today（今日は）の時制対比',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set12_3',
      label: '問3 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 60,
      imageUrl: '/listening_q1b/el1B_set12_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '果物と容器の色の対応の組み合わせ',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set12_4',
      label: '問4 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 57,
      imageUrl: '/listening_q1b/el1B_set12_q4.jpg',
      imageCaption: '問4 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '動作（reading）と場所（near the window）の2条件',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
  ],
  explanation: `第12回（難易度：標準）の解説です。イラスト選択では「4枚の違い」を先に言語化しておくことが最大の得点源になります。

問1　正解は ①
スクリプト："The boy holding the flag is the leader of our team."
イラストの内容：① 旗を持っている男の子／② 笛を持っている男の子／③ 旗を掲げたポールの横に立つ男の子／④ 腕章をした男の子（旗なし）
正解のイラスト：旗を持っている男の子
holding the flag（旗を持っている）の現在分詞による人物特定。動作の違いがひっかけ。

問2　正解は ④
スクリプト："I usually take the train to school, but today I came by bus because of the rain."
イラストの内容：① 徒歩で学校に向かう男の子／② 自転車で学校に向かう男の子／③ 電車で学校に向かう男の子／④ バスで学校に向かう男の子
正解のイラスト：バスで学校に向かう男の子
usually（いつも）と but today（今日は）の時制対比。問われるのは今日の手段。2022年A問4型の画像版。

問3　正解は ②
スクリプト："Put the apples in the green bowl and the oranges in the white one, please."
イラストの内容：① 白いボウルにりんご、緑のボウルにみかん／② 緑のボウルにりんご、白いボウルにみかん／③ りんごはかご、みかんは白いボウル／④ 全部緑のボウル
正解のイラスト：緑のボウルにりんご、白いボウルにみかん
果物と容器の色の対応の組み合わせ。②と①が鏡像。

問4　正解は ③
スクリプト："Please be quiet. Some students are reading books at the desks near the window."
イラストの内容：① 部屋の中央の机で読む学生たち／② 窓際の机で話している学生たち／③ 窓際の机で本を読む学生たち／④ 本棚の前に立つ学生たち
正解のイラスト：窓際の机で本を読む学生たち
動作（reading）と場所（near the window）の2条件。reading/talking の動作違いがひっかけ。`,
  surroundingKnowledge: [
    '位置の前置詞：on（接触して上）／over・above（離れて上）／under・below（下）／in front of（前）／behind（後ろ）／between A and B（A と B の間）／next to・beside（隣）。',
    '比較の聞き取り：taller / shorter / bigger / more ~ than。どちらが基準かを取り違えないこと。',
    '数の聞き取り：two / three / four に加え、both / none of / all of / one more / two left の言い換え。',
    '否定：not A but B（A ではなく B）は、イラスト選択で最も多い仕掛け。but の後ろが正解。',
    '時の対比：now ↔ a minute ago / just flew away。「今の状態」を描いた1枚を選ぶ。',
  ],
  deepDiveTopics: [
    '4枚のイラストは「1か所だけ違う」ように作られている。違いの軸（位置・色・数・動作）を先に決めるのが定石。',
    '音声に出た語がそのまま描かれている絵は、しばしばダミーである（not / instead of の前の語）。',
    '2回読みのうち1回目で軸を絞り、2回目で残った候補の差分だけを確認すると安定する。',
  ],
};

const EL1_B_SET13_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_B_set13_1',
    audioUrl: '/listening_audio/el1B_set13_q1.mp3',
    label: '問1',
    hint: '女性（高校生）',
    script: '"Everyone in the picture is wearing glasses except the tall boy in the middle."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set13_2',
    audioUrl: '/listening_audio/el1B_set13_q2.mp3',
    label: '問2',
    hint: '男性（大学生）',
    script: '"There were five birds on the wire a minute ago, but two just flew away."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set13_3',
    audioUrl: '/listening_audio/el1B_set13_q3.mp3',
    label: '問3',
    hint: '女性（店員）',
    script: '"The clock on the wall is ten minutes fast. It says nine ten, but it\'s actually nine o\'clock."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set13_4',
    audioUrl: '/listening_audio/el1B_set13_q4.mp3',
    label: '問4',
    hint: '男の子（小学生）',
    script: '"I finished reading three books this week, so I have just one more to go before Sunday."',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_B_SET13: ListeningProblem = {
  id: 'q_el1_B_set13',
  category: '第13回 発話に合うイラストを選ぶ（やや難）',
  readCount: 2,
  audioTracks: EL1_B_SET13_TRACKS,
  text: `第13回　第1問 B（4問・2回読み）　【難易度：やや難】

第1問 B では、短い英文が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。イラストは各問の下に①〜④の順で並んでいます。

【解き方のコツ】
音声が流れる前に4枚のイラストを見比べ、「どこが違うか」を1語で言えるようにしておきます（上／下、赤／青、2人／3人 など）。違いが分かっていれば、聞き取るべき1語が決まります。

────────────────────
問1（話者：女性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問2（話者：男性（大学生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問3（話者：女性（店員））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問4（話者：男の子（小学生））
イラスト①〜④から、発話の内容に合うものを選びなさい。`,
  subQuestions: [
    {
      id: 'q_el1_B_set13_1',
      label: '問1 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 54,
      imageUrl: '/listening_q1b/el1B_set13_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'except（〜を除いて）の構文理解が核心',
        type: 'イラスト選択型',
        difficulty: 4,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set13_2',
      label: '問2 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 51,
      imageUrl: '/listening_q1b/el1B_set13_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '5−2＝3 の計算',
        type: 'イラスト選択型',
        difficulty: 4,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set13_3',
      label: '問3 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 48,
      imageUrl: '/listening_q1b/el1B_set13_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'ten minutes fast（10分進んでいる）の理解が鍵',
        type: 'イラスト選択型',
        difficulty: 4,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set13_4',
      label: '問4 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 45,
      imageUrl: '/listening_q1b/el1B_set13_q4.jpg',
      imageCaption: '問4 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'finished three＋one more to go の数量関係',
        type: 'イラスト選択型',
        difficulty: 4,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
  ],
  explanation: `第13回（難易度：やや難）の解説です。イラスト選択では「4枚の違い」を先に言語化しておくことが最大の得点源になります。

問1　正解は ①
スクリプト："Everyone in the picture is wearing glasses except the tall boy in the middle."
イラストの内容：① 中央の背の高い男の子以外全員が眼鏡／② 中央の男の子だけ眼鏡／③ 誰も眼鏡をしていない／④ 全員眼鏡
正解のイラスト：中央の背の高い男の子以外全員が眼鏡
except（〜を除いて）の構文理解が核心。「全員−1人」を正確に絵に対応させる難度高めの問題。

問2　正解は ③
スクリプト："There were five birds on the wire a minute ago, but two just flew away."
イラストの内容：① 電線に鳥が2羽いる／② 電線に鳥が5羽いる／③ 電線に鳥が3羽残っている／④ 電線に鳥はいない
正解のイラスト：電線に鳥が3羽残っている
5−2＝3 の計算。過去の状態（were five）と現在の状態の時間変化を追う。2024年A型の画像版。

問3　正解は ④
スクリプト："The clock on the wall is ten minutes fast. It says nine ten, but it's actually nine o'clock."
イラストの内容：① 10時9分を指す時計／② 9時ちょうどを指す時計／③ 8時50分を指す時計／④ 9時10分を指す時計
正解のイラスト：9時10分を指す時計
ten minutes fast（10分進んでいる）の理解が鍵。絵に描かれるのは時計の表示（9:10）であり、実際 の時刻（9:00）ではない。高度なひっかけ。

問4　正解は ②
スクリプト："I finished reading three books this week, so I have just one more to go before Sunday."
イラストの内容：① これから読む本が3冊／② 読み終えた本3冊の隣に、これから読む本が1冊／③ 読み終えた本4冊／④ 本が全部で3冊だけ
正解のイラスト：読み終えた本3冊の隣に、これから読む本が1冊
finished three＋one more to go の数量関係。合計4冊のうち残り1冊、という状態を選ぶ。`,
  surroundingKnowledge: [
    '位置の前置詞：on（接触して上）／over・above（離れて上）／under・below（下）／in front of（前）／behind（後ろ）／between A and B（A と B の間）／next to・beside（隣）。',
    '比較の聞き取り：taller / shorter / bigger / more ~ than。どちらが基準かを取り違えないこと。',
    '数の聞き取り：two / three / four に加え、both / none of / all of / one more / two left の言い換え。',
    '否定：not A but B（A ではなく B）は、イラスト選択で最も多い仕掛け。but の後ろが正解。',
    '時の対比：now ↔ a minute ago / just flew away。「今の状態」を描いた1枚を選ぶ。',
  ],
  deepDiveTopics: [
    '4枚のイラストは「1か所だけ違う」ように作られている。違いの軸（位置・色・数・動作）を先に決めるのが定石。',
    '音声に出た語がそのまま描かれている絵は、しばしばダミーである（not / instead of の前の語）。',
    '2回読みのうち1回目で軸を絞り、2回目で残った候補の差分だけを確認すると安定する。',
  ],
};

const EL1_B_SET14_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_B_set14_1',
    audioUrl: '/listening_audio/el1B_set14_q1.mp3',
    label: '問1',
    hint: '女性（高校生）',
    script: '"The woman wearing a hat is carrying a heavy suitcase, but the woman without a hat has only a small bag."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set14_2',
    audioUrl: '/listening_audio/el1B_set14_q2.mp3',
    label: '問2',
    hint: '男性（高校生）',
    script: '"There are two balls under the chair. The red one is bigger than the blue one."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set14_3',
    audioUrl: '/listening_audio/el1B_set14_q3.mp3',
    label: '問3',
    hint: '女性（会社員）',
    script: '"The desks in my office are in two rows. My desk is the second one from the window."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set14_4',
    audioUrl: '/listening_audio/el1B_set14_q4.mp3',
    label: '問4',
    hint: '男性（父親）',
    script: '"Don\'t leave your umbrella by the door. Hang it on the hook on the wall."',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_B_SET14: ListeningProblem = {
  id: 'q_el1_B_set14',
  category: '第14回 発話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL1_B_SET14_TRACKS,
  text: `第14回　第1問 B（4問・2回読み）　【難易度：標準】

第1問 B では、短い英文が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。イラストは各問の下に①〜④の順で並んでいます。

【解き方のコツ】
音声が流れる前に4枚のイラストを見比べ、「どこが違うか」を1語で言えるようにしておきます（上／下、赤／青、2人／3人 など）。違いが分かっていれば、聞き取るべき1語が決まります。

────────────────────
問1（話者：女性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問2（話者：男性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問3（話者：女性（会社員））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問4（話者：男性（父親））
イラスト①〜④から、発話の内容に合うものを選びなさい。`,
  subQuestions: [
    {
      id: 'q_el1_B_set14_1',
      label: '問1 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 66,
      imageUrl: '/listening_q1b/el1B_set14_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '帽子の有無と荷物の大きさの対応',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set14_2',
      label: '問2 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 63,
      imageUrl: '/listening_q1b/el1B_set14_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '位置（under the chair）・色・大きさ比較（bigger than）の3条件',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set14_3',
      label: '問3 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 60,
      imageUrl: '/listening_q1b/el1B_set14_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'two rows（2列）と the second one from the window（窓から2番目）の序数表現',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set14_4',
      label: '問4 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 57,
      imageUrl: '/listening_q1b/el1B_set14_q4.jpg',
      imageCaption: '問4 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'Don\'t leave〜by the door（否定の指示）の後に正しい場所（on the hook on the wall）が来る',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
  ],
  explanation: `第14回（難易度：標準）の解説です。イラスト選択では「4枚の違い」を先に言語化しておくことが最大の得点源になります。

問1　正解は ③
スクリプト："The woman wearing a hat is carrying a heavy suitcase, but the woman without a hat has only a small bag."
イラストの内容：① 帽子なしの女性がスーツケース、帽子の女性が小さなバッグ／② 2人ともスーツケース／③ 帽子の女性が大きなスーツケース、帽子なしの女性が小さなバッグ／④ 2人とも小さなバッグ
正解のイラスト：帽子の女性が大きなスーツケース、帽子なしの女性が小さなバッグ
帽子の有無と荷物の大きさの対応。but の対比構文。鏡像の①がひっかけ。

問2　正解は ②
スクリプト："There are two balls under the chair. The red one is bigger than the blue one."
イラストの内容：① 椅子の下に小さい赤いボールと大きい青いボール／② 椅子の下に大きい赤いボールと小さい青いボール／③ 椅子の上にボール2つ／④ 椅子の下にボール1つ
正解のイラスト：椅子の下に大きい赤いボールと小さい青いボール
位置（under the chair）・色・大きさ比較（bigger than）の3条件。比較級の対応が鍵。

問3　正解は ④
スクリプト："The desks in my office are in two rows. My desk is the second one from the window."
イラストの内容：① 2列の机、窓から一番遠い机に印／② 1列の机、窓から2番目に印／③ 2列の机、窓から1番目に印／④ 2列の机、窓から2番目に印
正解のイラスト：2列の机、窓から2番目に印
two rows（2列）と the second one from the window（窓から2番目）の序数表現。序数の聞き取りが核心。

問4　正解は ①
スクリプト："Don't leave your umbrella by the door. Hang it on the hook on the wall."
イラストの内容：① 壁のフックに掛けられた傘／② かばんの中の畳まれた傘／③ 床に開いて置かれた傘／④ ドアのそばに立て掛けられた傘
正解のイラスト：壁のフックに掛けられた傘
Don't leave〜by the door（否定の指示）の後に正しい場所（on the hook on the wall）が来る。否定→指示の流れ。`,
  surroundingKnowledge: [
    '位置の前置詞：on（接触して上）／over・above（離れて上）／under・below（下）／in front of（前）／behind（後ろ）／between A and B（A と B の間）／next to・beside（隣）。',
    '比較の聞き取り：taller / shorter / bigger / more ~ than。どちらが基準かを取り違えないこと。',
    '数の聞き取り：two / three / four に加え、both / none of / all of / one more / two left の言い換え。',
    '否定：not A but B（A ではなく B）は、イラスト選択で最も多い仕掛け。but の後ろが正解。',
    '時の対比：now ↔ a minute ago / just flew away。「今の状態」を描いた1枚を選ぶ。',
  ],
  deepDiveTopics: [
    '4枚のイラストは「1か所だけ違う」ように作られている。違いの軸（位置・色・数・動作）を先に決めるのが定石。',
    '音声に出た語がそのまま描かれている絵は、しばしばダミーである（not / instead of の前の語）。',
    '2回読みのうち1回目で軸を絞り、2回目で残った候補の差分だけを確認すると安定する。',
  ],
};

const EL1_B_SET15_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_B_set15_1',
    audioUrl: '/listening_audio/el1B_set15_q1.mp3',
    label: '問1',
    hint: '女性（高校生）',
    script: '"Look at the sky. A plane is flying above the clouds, and a bird is flying below them."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set15_2',
    audioUrl: '/listening_audio/el1B_set15_q2.mp3',
    label: '問2',
    hint: '男性（お年寄り）',
    script: '"My dog is in the doghouse now. He was in the garden a minute ago."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set15_3',
    audioUrl: '/listening_audio/el1B_set15_q3.mp3',
    label: '問3',
    hint: '女性（教師）',
    script: '"Four students are standing in front of the whiteboard, and two are sitting at their desks."',
    translation: '',
    keyPhrases: [],
  },
  {
    subId: 'q_el1_B_set15_4',
    audioUrl: '/listening_audio/el1B_set15_q4.mp3',
    label: '問4',
    hint: '男の子（中学生）',
    script: '"I bought the pencil case with the blue stars, not the one with the red hearts."',
    translation: '',
    keyPhrases: [],
  },
];

const EL1_B_SET15: ListeningProblem = {
  id: 'q_el1_B_set15',
  category: '第15回 発話に合うイラストを選ぶ（標準）',
  readCount: 2,
  audioTracks: EL1_B_SET15_TRACKS,
  text: `第15回　第1問 B（4問・2回読み）　【難易度：標準】

第1問 B では、短い英文が2回読まれます。その内容に最も合うイラストを、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
各問の解答欄の横にある再生ボタンから、その問だけを何度でも聞けます。イラストは各問の下に①〜④の順で並んでいます。

【解き方のコツ】
音声が流れる前に4枚のイラストを見比べ、「どこが違うか」を1語で言えるようにしておきます（上／下、赤／青、2人／3人 など）。違いが分かっていれば、聞き取るべき1語が決まります。

────────────────────
問1（話者：女性（高校生））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問2（話者：男性（お年寄り））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問3（話者：女性（教師））
イラスト①〜④から、発話の内容に合うものを選びなさい。

────────────────────
問4（話者：男の子（中学生））
イラスト①〜④から、発話の内容に合うものを選びなさい。`,
  subQuestions: [
    {
      id: 'q_el1_B_set15_1',
      label: '問1 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '①',
      correctAnswerRate: 66,
      imageUrl: '/listening_q1b/el1B_set15_q1.jpg',
      imageCaption: '問1 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'above / below the clouds と対象（plane/bird）の上下対応',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set15_2',
      label: '問2 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 63,
      imageUrl: '/listening_q1b/el1B_set15_q2.jpg',
      imageCaption: '問2 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'now と a minute ago の時制対比',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set15_3',
      label: '問3 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 60,
      imageUrl: '/listening_q1b/el1B_set15_q3.jpg',
      imageCaption: '問3 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: '数（four standing / two sitting）と動作の対応',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
    {
      id: 'q_el1_B_set15_4',
      label: '問4 発話に合うイラスト',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 57,
      imageUrl: '/listening_q1b/el1B_set15_q4.jpg',
      imageCaption: '問4 の選択肢イラスト（①〜④）',
      detailedExplanation: {
        theme: 'not A, but B 型',
        type: 'イラスト選択型',
        difficulty: 3,
        steps: [
          '① 音声の前に4枚を見比べ、違いを1語で言語化する（位置・色・数・動作）',
          '② 音声では、その1語に対応する部分だけを狙って聞く',
          '③ 前置詞（on / under / in front of / between）と数を最優先で確認する',
          '④ 2回目の読み上げで、残った2枚の差分を確定させる',
        ],
      },
    },
  ],
  explanation: `第15回（難易度：標準）の解説です。イラスト選択では「4枚の違い」を先に言語化しておくことが最大の得点源になります。

問1　正解は ①
スクリプト："Look at the sky. A plane is flying above the clouds, and a bird is flying below them."
イラストの内容：① 雲の上に飛行機、雲の下に鳥／② 雲の上に鳥、雲の下に飛行機／③ 2つとも雲の上／④ 飛行機だけで鳥はいない
正解のイラスト：雲の上に飛行機、雲の下に鳥
above / below the clouds と対象（plane/bird）の上下対応。鏡像の②がひっかけ。

問2　正解は ③
スクリプト："My dog is in the doghouse now. He was in the garden a minute ago."
イラストの内容：① 犬小屋の屋根の上にいる犬／② 庭にいる犬／③ 犬小屋の中にいる犬／④ 家の中にいる犬
正解のイラスト：犬小屋の中にいる犬
now と a minute ago の時制対比。問われるのは現在の場所。過去の情報（garden）はひっかけ。

問3　正解は ②
スクリプト："Four students are standing in front of the whiteboard, and two are sitting at their desks."
イラストの内容：① 6人全員が立っている／② 4人がホワイトボードの前に立ち、2人が机に座っている／③ 2人が立ち、4人が座っている／④ 6人全員が座っている
正解のイラスト：4人がホワイトボードの前に立ち、2人が机に座っている
数（four standing / two sitting）と動作の対応。合計6人だが比率の逆転③がひっかけ。

問4　正解は ④
スクリプト："I bought the pencil case with the blue stars, not the one with the red hearts."
イラストの内容：① 赤いハート柄の筆箱／② 赤い星柄の筆箱／③ 青いハート柄の筆箱／④ 青い星柄の筆箱
正解のイラスト：青い星柄の筆箱
not A, but B 型。色と柄の2属性の組み合わせ。属性の掛け違い（青ハート・赤星）がひっかけ。2025年問5型。`,
  surroundingKnowledge: [
    '位置の前置詞：on（接触して上）／over・above（離れて上）／under・below（下）／in front of（前）／behind（後ろ）／between A and B（A と B の間）／next to・beside（隣）。',
    '比較の聞き取り：taller / shorter / bigger / more ~ than。どちらが基準かを取り違えないこと。',
    '数の聞き取り：two / three / four に加え、both / none of / all of / one more / two left の言い換え。',
    '否定：not A but B（A ではなく B）は、イラスト選択で最も多い仕掛け。but の後ろが正解。',
    '時の対比：now ↔ a minute ago / just flew away。「今の状態」を描いた1枚を選ぶ。',
  ],
  deepDiveTopics: [
    '4枚のイラストは「1か所だけ違う」ように作られている。違いの軸（位置・色・数・動作）を先に決めるのが定石。',
    '音声に出た語がそのまま描かれている絵は、しばしばダミーである（not / instead of の前の語）。',
    '2回読みのうち1回目で軸を絞り、2回目で残った候補の差分だけを確認すると安定する。',
  ],
};

/** 第1問 B の演習セット一覧（PDF 15セット＝第1回〜第15回）。 */
export const EL1_B_PROBLEMS: ListeningProblem[] = [
  EL1_B_SET1,
  EL1_B_SET2,
  EL1_B_SET3,
  EL1_B_SET4,
  EL1_B_SET5,
  EL1_B_SET6,
  EL1_B_SET7,
  EL1_B_SET8,
  EL1_B_SET9,
  EL1_B_SET10,
  EL1_B_SET11,
  EL1_B_SET12,
  EL1_B_SET13,
  EL1_B_SET14,
  EL1_B_SET15,
];
