/**
 * ===================================================================
 * 英語リスニング　第1問 A（el1_A）演習問題
 * ===================================================================
 *
 * ■ 何のファイルか
 *   共通テスト「第1問 A」（短い発話を聞き、内容に最も近い意味の英文を
 *   ①〜④から選ぶ・2回読み・4問）の演習セットを収録する。
 *   1セット＝アプリ上の「1大問（problem）」として扱い、
 *   `第1回`『第2回』… と回を増やしていける形にしてある。
 *
 * ■ なぜ別ファイルにするのか
 *   englishListeningData.ts は「全大問の単元の枠組み」を持つ骨格ファイル。
 *   化学側で chemistryAdvancedData.ts ↔ advancedThermoProblems.ts を
 *   分離しているのと同じ方針で、問題本体はこちらに切り出し、
 *   単元ID（el1_A）をキーに流し込む。
 *
 * ■ データ形式（他科目と完全に同じ）
 *     problem     = { id, category, text, subQuestions[], explanation,
 *                     surroundingKnowledge[], deepDiveTopics[] }
 *     subQuestion = { id, label, type, options?, correctAnswer,
 *                     correctAnswerRate?, detailedExplanation? }
 *   → Quiz.tsx / Explanation.tsx / ChapterSelection.tsx を無改造で流用できる。
 *
 * ■ リスニング固有の追加フィールド（任意項目なので既存処理を壊さない）
 *     problem.audioTracks : ListeningAudioTrack[]
 *       各問の音源・スクリプト・和訳・語句。
 *       ListeningAudioPlayer が「音源を聞く」パネルを描画するために使う。
 *     problem.readCount   : 本番の読み上げ回数（第1問は 2回読み）
 *
 * ■ 選択肢の持たせ方（マーク式に合わせる）
 *   options は ['①','②','③','④'] とし、英文そのものは problem.text に並べる。
 *   理由：
 *     ・本番のマークシートと同じ操作感になる
 *     ・スマホの解答欄で 4 つのチップが横並びに収まりタップしやすい
 *     ・英文は問題文ペイン（読み返せる場所）に置いた方が視線移動が少ない
 *
 * ■ 解説本文の書き方（重要）
 *   utils/explanationFormat.ts の enhanceExplanation() が
 *   「解答カード → 小問ごとのアコーディオン」へ自動整形する。
 *   小問ごとに切り分けさせるため、解説本文は
 *     ・小問の見出し（問1・問2 …）を必ず**行頭**に置く
 *   というルールで書く。ラベル側の先頭表記と一致させること。
 *
 * ■ 音源
 *   public/listening_audio/ 配下に MP3 を置き、'/listening_audio/xxx.mp3' で参照する。
 *   （Genspark のファイル共有URLはセッション認証付きでアプリ資産にできないため、
 *     必ず public 配下の静的ファイルとして持つ）
 */

import type { SubQuestion } from '../types/curriculum';

/** Printed materials only: never include scripts, answers or explanation fields. */
export interface ListeningMaterial {
  title: string;
  instruction?: string;
  sections?: { heading?: string; rows: string[] }[];
  table?: { headers: string[]; rows: string[][] };
  images?: { src: string; caption: string; minWidth?: number }[];
}

/** 1問ぶんの音源とスクリプト。復習用音源パネルの1行に対応する。 */
export type ListeningAudioTrack = {
  /** 対応する小問の id（subQuestions[].id と一致させる） */
  subId: string;
  /** ボタンに出す短いラベル（例：'問1'） */
  label: string;
  /** 一言でわかる場面メモ（例：'電車に傘を忘れた'） */
  hint: string;
  /**
   * 音源のパス（public 配下の絶対パス）。
   *
   * 任意項目にしている理由：
   *   配布 PDF から取り込んだ類題集（第1問A 13セット・第1問B 15セット）には
   *   MP3 が付属しない。audioUrl を必須にすると「音源が無い問題は登録できない」
   *   ことになり、112問がアプリに載らなくなってしまう。
   *   そこで未設定を許可し、ListeningAudioPlayer 側で
   *   ブラウザの音声合成（SpeechSynthesis）が script を読み上げる。
   *   MP3 を後から用意したら、このフィールドを埋めるだけで実音源に切り替わる。
   */
  audioUrl?: string;
  /** 読み上げられる英文（スクリプト） */
  script: string;
  /**
   * 対話形式（第3問など）の場合の発話単位。
   *
   * 任意項目にしている理由：
   *   第1問は1人の短い発話なので script 1本で足りるが、第3問は
   *   「2人の対話（5〜7発話）」を1回だけ聞いて答える大問。
   *   1つの声で通して読むと話者の交替が分からず、
   *   「What will the man do?」のような設問が解けなくなる。
   *   そこで発話を行単位で持ち、ListeningAudioPlayer 側で
   *   A / B に別の声（と少しずらした pitch）を割り当てて読み上げる。
   *   turns を持たないトラックは従来どおり script を1つの声で読む。
   */
  turns?: { who: string; text: string }[];
  /**
   * この音源1本にぶら下がる小問の id 一覧（第4問以降）。
   *
   * 任意項目にしている理由：
   *   第1〜3問は「1問＝1音源」なので subId だけで足りる。
   *   第4問以降は「1本の音声に問18〜21の4つの解答欄」のように
   *   複数の小問が同じ音源を共有する。この一覧があると
   *   listeningSteps.ts が「1画面＝1音源」でステップを切れる。
   *   無いトラックは従来どおり subId 1つだけのステップになる。
   */
  subIds?: string[];
  /** Readable shared worksheet, tied to the audio step rather than the answer page. */
  material?: ListeningMaterial;
  /** スクリプトの和訳 */
  translation: string;
  /** この音源で押さえたい語句・表現 */
  keyPhrases: { phrase: string; meaning: string }[];
};

/** 1セット（＝1回）ぶんの大問。他科目の practiceProblems 要素と同形。 */
export type ListeningProblem = {
  id: string;
  category: string;
  text: string;
  subQuestions: SubQuestion[];
  explanation: string;
  surroundingKnowledge: string[];
  deepDiveTopics: string[];
  /** リスニング固有：各問の音源 */
  audioTracks: ListeningAudioTrack[];
  /** リスニング固有：本番の読み上げ回数 */
  readCount: 1 | 2;
  /**
   * 本番モードでは再生を1回だけに制限する（第4問以降）。
   * 1回読みの大問で何度も聞けると練習にならないため。
   * 解説（復習）画面では制限しない。
   */
  playOnce?: boolean;
  /**
   * 制限時間（秒）の上書き。未指定なら設問数・選択肢数から自動計算する。
   * 第4問以降は音声が1〜2分あるため、自動計算（選択肢を読む時間のみ）では
   * 聞き終わる前にタイマーが切れてしまう。音声の長さ＋解答時間を入れる。
   */
  timeLimitSec?: number;
};

/** 第1問Aの選択肢は常に ①〜④ のマーク式。 */
const MARK_OPTIONS = ['①', '②', '③', '④'];

// =====================================================================
// 第1回
// =====================================================================

const EL1_A_SET1_TRACKS: ListeningAudioTrack[] = [
  {
    subId: 'q_el1_A_set1_1',
    label: '問1',
    hint: '電車に傘を忘れた',
    audioUrl: '/listening_audio/el1A_set1_q1.mp3',
    script: 'I was going to bring my umbrella, but I forgot it on the train this morning.',
    translation: '傘を持って行こうと思っていたのですが、今朝、電車の中に忘れてきてしまいました。',
    keyPhrases: [
      { phrase: 'be going to bring', meaning: '（持って行く）つもりだった ※過去形 was going to は「〜するつもりだったが、しなかった」' },
      { phrase: 'forget A on the train', meaning: 'A を電車に置き忘れる' },
      { phrase: 'leave A behind', meaning: 'A を置き忘れる（forget の言い換えで頻出）' },
    ],
  },
  {
    subId: 'q_el1_A_set1_2',
    label: '問2',
    hint: 'まだPCを切らないで',
    audioUrl: '/listening_audio/el1A_set1_q2.mp3',
    script: "Mike, don't turn off the computer yet. I haven't saved my report.",
    translation: 'マイク、まだコンピューターの電源を切らないで。レポートをまだ保存していないの。',
    keyPhrases: [
      { phrase: "don't ~ yet", meaning: 'まだ〜しないで（否定の命令文＋yet）' },
      { phrase: 'turn off', meaning: '（電源を）切る ⇔ turn on' },
      { phrase: "haven't saved", meaning: 'まだ保存していない（現在完了の否定＝今もその状態）' },
    ],
  },
  {
    subId: 'q_el1_A_set1_3',
    label: '問3',
    hint: '普段はバス／今日は自転車',
    audioUrl: '/listening_audio/el1A_set1_q3.mp3',
    script: 'Emma usually takes the bus to school, but today she rode her bike because the buses are on strike.',
    translation: 'エマは普段バスで学校に行きますが、今日はバスがストライキ中なので自転車に乗って行きました。',
    keyPhrases: [
      { phrase: 'usually ~ , but today ...', meaning: '普段は〜だが、今日は…（習慣と例外の対比）' },
      { phrase: 'take the bus', meaning: 'バスを利用する' },
      { phrase: 'be on strike', meaning: 'ストライキ中である（＝運行していない）' },
    ],
  },
  {
    subId: 'q_el1_A_set1_4',
    label: '問4',
    hint: 'クッキーの数を計算',
    audioUrl: '/listening_audio/el1A_set1_q4.mp3',
    script: "There are eight cookies on the plate. If you eat three, I'll bake five more for tomorrow.",
    translation: 'お皿にクッキーが8枚あります。あなたが3枚食べたら、明日のためにもう5枚焼きます。',
    keyPhrases: [
      { phrase: 'There are eight cookies', meaning: 'クッキーが8枚ある（最初の数）' },
      { phrase: 'If you eat three', meaning: '3枚食べたら（引く数）' },
      { phrase: 'five more', meaning: 'さらに5枚（足す数）※more は「追加で」' },
    ],
  },
];

const EL1_A_SET1: ListeningProblem = {
  id: 'q_el1_A_set1',
  category: '第1回 短い発話の言い換え（傘・PC・通学手段・数量）',
  readCount: 2,
  audioTracks: EL1_A_SET1_TRACKS,
  text: `第1回　第1問 A（4問・2回読み）

第1問 A では、短い英文が2回読まれます。その内容に最も近い意味の英文を、①〜④のうちから1つずつ選びなさい。

【音源の聞き方】
問題文の上にある「音源を聞く」パネルの 問1〜問4 のボタンから、いつでも再生できます。本番と同じ条件で練習したいときは「2回続けて再生」を使ってください。解説画面では同じ音源をスクリプト・和訳つきで聞き直せます。

────────────────────
問1
① The speaker has her umbrella with her now.
② The speaker does not have her umbrella now.
③ The speaker bought a new umbrella this morning.
④ The speaker left her umbrella at home this morning.

────────────────────
問2
① Mike has already saved the report.
② Mike should not turn off the computer yet.
③ The speaker has finished saving her report.
④ The speaker wants Mike to turn off the computer now.

────────────────────
問3
① Emma rides her bike to school every day.
② Emma took the bus to school today.
③ Emma went to school by bike today because the buses were not running.
④ Emma walked to school because she missed the bus.

────────────────────
問4
① There will be five cookies for tomorrow.
② There will be eight cookies for tomorrow.
③ There will be thirteen cookies for tomorrow.
④ There will be ten cookies for tomorrow.`,
  subQuestions: [
    {
      id: 'q_el1_A_set1_1',
      label: '問1 傘について、話者の状況に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 72,
      detailedExplanation: {
        theme: '否定的な状況の「裏返し」を読み取る（2022年 問2・2024年 問4 型）',
        type: '言い換え型',
        difficulty: 2,
        steps: [
          '① 文を but で前半・後半に切る。結論はいつも but の後ろにある',
          '② 後半 forgot it on the train を「今どうなっているか」に翻訳する（＝今、手元にない）',
          '③ 選択肢を「持っている／持っていない」で二分し、まず半分を切る',
          '④ 残った選択肢は「どこに忘れたか」「買ったか」など細部で見分ける',
        ],
      },
    },
    {
      id: 'q_el1_A_set1_2',
      label: '問2 話者がマイクに伝えたい内容に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '②',
      correctAnswerRate: 68,
      detailedExplanation: {
        theme: '否定の命令文＋現在完了の否定という「二重の否定情報」（2023年 問2 型）',
        type: '言い換え型',
        difficulty: 3,
        steps: [
          '① 1文目は Don\'t ~ yet（＝まだするな）。「してほしくないこと」を頼んでいると押さえる',
          '② 2文目 I haven\'t saved が①の理由。理由が言われたら必ずセットでメモする',
          '③ 選択肢を「切ってよい／切ってはいけない」で二分する',
          '④ 主語のすり替え（Mike が保存した／話者が保存し終えた）を見つけて切る',
        ],
      },
    },
    {
      id: 'q_el1_A_set1_3',
      label: '問3 エマの今日の通学方法に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '③',
      correctAnswerRate: 74,
      detailedExplanation: {
        theme: 'usually（習慣）と today（今日）の対比＋原因の but 節（2022年 問4 型）',
        type: '対比整理型',
        difficulty: 2,
        steps: [
          '① usually と today を聞いた瞬間に、頭の中で2列の表を作る',
          '② usually の列に bus、today の列に bike を入れる',
          '③ because 以下（buses are on strike）を today の理由として結ぶ',
          '④ 選択肢が「どちらの列の話か」を判定する。列を取り違えた選択肢が必ず混ざっている',
        ],
      },
    },
    {
      id: 'q_el1_A_set1_4',
      label: '問4 明日のクッキーの枚数に最も近い英文',
      type: 'multiple_choice',
      options: MARK_OPTIONS,
      correctAnswer: '④',
      correctAnswerRate: 61,
      detailedExplanation: {
        theme: '数量計算＋条件文の未来（2023年 問4・2025年 問2 型）',
        type: '計算型',
        difficulty: 3,
        steps: [
          '① 出てきた数字を聞こえた順にすべてメモする（8 → 3 → 5）',
          '② 数字ごとに「＋か－か」の符号を決める。ある＝＋8、eat＝－3、more＝＋5',
          '③ 8 - 3 + 5 = 10 を計算する。選択肢は必ず途中の値（5・8・13）を用意している',
          '④ 問われているのが「いつの数か（for tomorrow）」を確認して答えを確定する',
        ],
      },
    },
  ],
  explanation: `第1問 A は「聞こえた英文を、別の言い方に置き換えられるか」だけを問う設問です。難しい単語はほとんど出ません。代わりに、①否定、②対比、③数量 のいずれかが必ず仕掛けられています。この第1回は、その3タイプを一通り体験できるように並べてあります。

問1　正解は ②
スクリプトは I was going to bring my umbrella, but I forgot it on the train this morning. です。
まず but に注目します。but の前は「持って行くつもりだった」という予定の話、but の後ろが実際に起きたことで、結論はつねに but の後ろにあります。was going to は「〜するつもりだった（が、そうならなかった）」という含みを持つ表現なので、この時点で「結局、傘は手元にない」という方向が見えます。
決定打は forgot it on the train です。forget A on ~ は「A を〜に置き忘れる」。つまり今、傘は電車の中にあり、話者は持っていません。この「置き忘れた＝今は持っていない」という裏返しができれば ② The speaker does not have her umbrella now. が選べます。
① は「今、傘を持っている」で、状況がちょうど逆です。聞き取れた単語（umbrella）だけで選ぶと引っかかります。
③ は bought a new umbrella（新しい傘を買った）ですが、買ったという話はどこにもありません。「言っていないことは正解にならない」が鉄則です。
④ は「家に忘れた」。忘れたのは事実ですが、場所が train ではなく home にすり替わっています。場所・人・時をひとつだけ入れ替える選択肢は毎年出るので、細部までメモする習慣をつけてください。

問2　正解は ②
スクリプトは Mike, don't turn off the computer yet. I haven't saved my report. です。
ポイントは否定が2回出てくることです。1文目は don't turn off ~ yet で「まだ電源を切らないで」という否定の命令文。yet は「まだ」で、否定文とセットで「まだ〜していない・まだ〜するな」を作ります。2文目 I haven't saved my report. は現在完了の否定で「まだ保存していない（＝今もその状態が続いている）」。
つまり全体は「レポートを保存できていないから、まだ電源を切らないで」という1つのお願いです。これをそのまま言い換えた ② Mike should not turn off the computer yet. が正解です。should not（〜すべきでない）が、否定の命令文 don't の言い換えになっていることを確認しておきましょう。
① は「マイクがもう保存した」。保存していないのは話者で、しかも「していない」のですから、人と否定の両方が誤りです。
③ は「話者は保存を終えた」。haven't saved の否定を落とすと、この選択肢に見えてしまいます。現在完了の否定は not を聞き逃すと意味が正反対になるので、have / haven't の判別を最優先で聞いてください。
④ は「今すぐ電源を切ってほしい」。don't を聞き逃した人が選ぶ選択肢です。命令文は文頭の Don't がすべてを決めるので、最初の一語に集中します。

問3　正解は ③
スクリプトは Emma usually takes the bus to school, but today she rode her bike because the buses are on strike. です。
usually（普段は）と today（今日は）が出てきたら、その瞬間に頭の中に2列の表を作ります。usually の列に bus、today の列に bike を書き込みます。設問が聞いているのはほぼ必ず「今日はどうしたか」なので、today の列が答えになります。
さらに because 以下に理由があります。be on strike は「ストライキ中である」で、要するにバスが動いていないということです。ここまで整理できれば、③ Emma went to school by bike today because the buses were not running. が、乗り物（bike）も理由（バスが動いていない）も一致していると分かります。on strike → were not running という言い換えに気づけるかが分かれ目です。
① は every day（毎日）自転車。これは usually の列と today の列を混同した選択肢で、usually は bus なので誤りです。
② は「今日はバスで行った」。today の列に usually の内容を入れてしまった形で、対比を聞き逃すとこれを選んでしまいます。
④ は walked（歩いた）、missed the bus（バスに乗り遅れた）。どちらも音声にありません。原因は「乗り遅れ」ではなく「ストライキ」です。

問4　正解は ④
スクリプトは There are eight cookies on the plate. If you eat three, I'll bake five more for tomorrow. です。
数量の問題は、聞きながら数字を並べてメモし、あとで符号（＋か－か）を付けるのが最短ルートです。
まず There are eight cookies で ＋8。次に If you eat three で、食べる分なので －3。最後に I'll bake five more で、追加で焼くので ＋5 です。more が「さらに」を表し、既存の8枚とは別に5枚増えることを示しています。
したがって 8 - 3 + 5 = 10 で、④ There will be ten cookies for tomorrow. が正解です。I'll ~ と for tomorrow から、答えるべきなのは「明日の枚数」だと確認しておきましょう。
選択肢が巧妙で、①の five は「焼く枚数だけ」、②の eight は「最初の枚数のまま」、③の thirteen は「8＋5 で、食べた3枚を引き忘れた数」です。つまり①〜③はすべて計算の途中で止まった値になっています。数字が3つ出たら必ず3つとも使う、と決めておくとこの型は落としません。

【第1回のまとめ】
・but・today・yet・not が聞こえたら、結論はその後ろにあります。
・「置き忘れた」「まだ保存していない」のような否定的な内容は、選択肢では「持っていない」「切ってはいけない」と裏返して表現されます。
・数字は聞こえた順にメモし、あとから符号を付けて計算します。途中の値が選択肢に必ず並んでいます。
・音声は2回流れます。1回目で全体像と数字、2回目で細部（場所・人・理由）を確認する、と役割を分けると安定します。`,
  surroundingKnowledge: [
    '否定の命令文：Don\'t ~ / Don\'t ~ yet（まだ〜しないで）。選択肢では should not / had better not に言い換えられる。',
    '現在完了の否定：haven\'t + 過去分詞 は「まだ〜していない」。not を聞き逃すと意味が正反対になる最重要ポイント。',
    'was going to ~ は「〜するつもりだったが、しなかった」。予定と結果のズレを示す合図。',
    'be on strike（ストライキ中）＝ not running / not in service。交通機関の言い換えとして頻出。',
    '数量表現：five more（さらに5つ）／three fewer（3つ少なく）／twice as many（2倍の数）。',
    '第1問 A は2回読み。1回目＝全体像と数字、2回目＝場所・人・理由の確認、と役割を分けて聞く。',
  ],
  deepDiveTopics: [
    '言い換え（パラフレーズ）の型：肯定↔否定の裏返し（forgot it → don\'t have it）は第1問Aで最も出題される型。',
    '対比の目印：usually / normally / on weekdays ↔ today / this morning / this time。聞いた瞬間に2列メモを作る練習をする。',
    '選択肢の作り方を逆から知る：正解以外は「逆」「未出情報」「細部すり替え」「計算の途中値」のどれかである。',
    '数量計算の設問は、答えの数値そのものではなく「いつ・誰の分か」を問うことがある。設問文の for tomorrow などの限定語に注意。',
  ],
};

/** 第1問 A の演習セット一覧（回を増やすときはここに追加する）。 */
export const EL1_A_PROBLEMS: ListeningProblem[] = [EL1_A_SET1];
