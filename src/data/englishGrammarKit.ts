/**
 * ===================================================================
 * 英文法　4択演習の型と組み立て道具
 * ===================================================================
 *
 * ■ 何のファイルか
 *   英文法の問題データ（englishGrammarProblems*.ts）が共通で使う
 *   ・型（GrammarProblem / EgItem）
 *   ・1回ぶんの大問を組み立てる buildEgSet()
 *   だけを置く。問題の中身は一切ここに書かない。
 *
 * ■ ★「形式的に作る」ことへの歯止め★
 *   ご指摘「コードで形式的に作ると問題によっておかしくなる可能性がある」を
 *   踏まえ、このファイルが担当するのは
 *     ＝ 手書きした部品を、決まった場所に並べる作業だけ。
 *   逆に、次のものは ★1問ずつ人間が書く★ 前提で必須項目にしている。
 *     ・sentence（空所つき英文）／choices（4択）／answer
 *     ・full（完成文＝音源スクリプト）／translation
 *     ・keyPhrases（決め手になる語句と意味）
 *     ・steps（解答の道すじ）／commentary（解説本文）
 *   つまり「英文から選択肢を自動生成する」ようなことはしない。
 *   自動生成すると、単元によって不自然な誤答肢が混ざり、
 *   まさにご心配のとおり問題ごとに壊れるため。
 *
 * ■ ★リスニングと同じ形にする理由★
 *   ご要望「リスニングのような形でつくると結構いいかも」。
 *   utils/listeningExplanation.ts の buildListeningExplanation() が
 *   ［英文 → 聞き取り（読み取り）の決め手 → 解答の道すじ］の順に
 *   解説を組み立ててくれる。これを英文法でも通すために、
 *   次の4つを厳密に満たす必要がある（実装を読んで確認済み）。
 *     (1) audioTracks[].subId === subQuestions[].id
 *     (2) audioTracks[].script が空でない
 *     (3) subQuestions[].label に「問N」を含む
 *     (4) explanation の各設問見出しが ★行頭★ の「問N」で始まる
 *   buildEgSet() はこの4条件を構造として強制する。
 *   その結果、Quiz.tsx / Explanation.tsx / ListeningAudioPlayer.tsx を
 *   ★1行も変えずに★ 英文法でも音源パネルと専用解説が動く。
 *
 * ■ 選択肢の持たせ方
 *   options は ['①','②','③','④'] のマーク式にし、英文と選択肢は
 *   problem.text に並べる（リスニング第1問Aと完全に同じ）。
 *   ・本番のマークシートと同じ操作感になる
 *   ・スマホで4つのチップが1行に収まりタップしやすい
 *   ・英文は読み返せる問題文ペインに置いた方が視線移動が少ない
 */

/** 音源トラック（リスニングの ListeningAudioTrack と同形にする） */
export type GrammarAudioTrack = {
  /** 対応する小問の id（★subQuestions[].id と一致させる★） */
  subId: string;
  /** ボタンに出す短いラベル（例：'問1'） */
  label: string;
  /** 一言メモ（何を問う問題か） */
  hint: string;
  /** 音源ファイル（英文法は用意しないので未設定＝音声合成が読む） */
  audioUrl?: string;
  /** 読み上げる英文＝★空所を埋めた完成文★ */
  script: string;
  /** 完成文の和訳 */
  translation: string;
  /** 決め手になる語句と意味 */
  keyPhrases: { phrase: string; meaning: string }[];
};

/** 1回ぶんの大問（他科目の practiceProblems 要素と同形） */
export type GrammarProblem = {
  id: string;
  category: string;
  text: string;
  subQuestions: any[];
  explanation: string;
  surroundingKnowledge: string[];
  deepDiveTopics: string[];
  audioTracks: GrammarAudioTrack[];
  readCount: 1 | 2;
};

/** 英文法の選択肢は常に ①〜④ のマーク式 */
export const EG_MARKS = ['①', '②', '③', '④'] as const;

export type EgMark = '①' | '②' | '③' | '④';

/** 1問ぶんの手書きデータ */
export type EgItem = {
  /**
   * この問が担当する単元 topics の項目。
   * ★単元の topics と1対1で対応させる★
   *   「網羅した」を口約束にせず、単元が宣言した論点の数だけ問題を作り、
   *   どの問がどの論点を担当するかを検査できるようにするため。
   */
  topic: string;
  /**
   * 小問ラベル・音源パネルに出す短い見出し。
   * topic は検査用に長い正式名を入れるため、画面表示用を別に持つ。
   * （topic をそのまま出すと「問1 第1文型 SV と第2文型 SVC の見分け（be 動詞以外の SVC）」
   *   のように長すぎ、スマホの解答欄で折り返しが増えて読みにくい）
   */
  focus: string;
  /** 空所つき英文。空所は ______（半角アンダースコア6つ） */
  sentence: string;
  /** 4つの選択肢（①〜④の順） */
  choices: [string, string, string, string];
  /** 正解のマーク */
  answer: EgMark;
  /** 想定正答率（%） */
  rate: number;
  /** 完成文（空所を正解で埋めた文）＝音源スクリプト */
  full: string;
  /** 完成文の和訳 */
  translation: string;
  /** 決め手になる語句 */
  keyPhrases: { phrase: string; meaning: string }[];
  /** 何の型の問題か（解説の見出しに出る） */
  theme: string;
  /** 判断の種類（例：'語法判断型' / '時制判断型'） */
  type: string;
  /** 難易度 1〜5 */
  difficulty: number;
  /** 解答の道すじ（①〜④の手順。4行を基本とする） */
  steps: string[];
  /** 解説本文。1要素＝1行。誤答肢がなぜ誤りかまで書く */
  commentary: string[];
};

/** 1回ぶんのメタ情報 */
export type EgSetMeta = {
  /** 単元 id（例：'eg1_1'）。problem.id に必ず含める */
  chapterId: string;
  /** 何回目か */
  setNo: number;
  /** 単元名（表示用。例：'① 基本5文型と自動詞・他動詞'） */
  unitTitle: string;
  /** 一覧に出る短い見出し（扱う論点の列挙） */
  category: string;
  /** 冒頭の導入文（この回で何を身につけるか） */
  intro: string;
  /** 末尾のまとめ（箇条書き。行頭の「・」はこちらで付ける） */
  summary: string[];
  /** 周辺知識 */
  surroundingKnowledge: string[];
  /** さらに深掘り */
  deepDiveTopics: string[];
};

const SEP = '────────────────────';

/**
 * 1回ぶんの大問を組み立てる。
 *
 * ★ここで作るのは「並べ方」だけ★
 *   本文・選択肢・解説はすべて items の手書きデータをそのまま使う。
 *   文字列を機械的に加工して問題文を作ることはしない。
 */
export function buildEgSet(meta: EgSetMeta, items: EgItem[]): GrammarProblem {
  const base = `q_${meta.chapterId}_set${meta.setNo}`;

  // --- 小問 id は「大問 id ＋ 問番号」。トラックの subId と共有する ---
  const subIdOf = (index: number) => `${base}_${index + 1}`;

  // --- 音源トラック（条件 (1)(2) を構造で満たす） ---
  const audioTracks: GrammarAudioTrack[] = items.map((item, index) => ({
    subId: subIdOf(index),
    label: `問${index + 1}`,
    hint: item.focus,
    // ★script は完成文★（空所つきの文を読み上げても意味が取れないため）
    script: item.full,
    translation: item.translation,
    keyPhrases: item.keyPhrases,
  }));

  // --- 問題文ペイン ---
  const head =
    `第${meta.setNo}回　${meta.unitTitle}（${items.length}問・4択）\n\n` +
    `空所に入れるのに最も適切なものを、①〜④のうちから1つずつ選びなさい。\n\n` +
    `1問ずつ解いて、すぐ下の解説で「なぜその形か」を確認してから次の問へ進みます。`;

  const blocks = items.map(
    (item, index) =>
      `${SEP}\n問${index + 1}　${item.sentence}\n` +
      `① ${item.choices[0]}\n② ${item.choices[1]}\n③ ${item.choices[2]}\n④ ${item.choices[3]}`,
  );

  const text = `${head}\n\n${blocks.join('\n\n')}`;

  // --- 小問（条件 (3) を構造で満たす：label は必ず「問N」で始まる） ---
  const subQuestions = items.map((item, index) => ({
    id: subIdOf(index),
    label: `問${index + 1} ${item.focus}`,
    type: 'multiple_choice',
    options: [...EG_MARKS],
    correctAnswer: item.answer,
    correctAnswerRate: item.rate,
    detailedExplanation: {
      theme: item.theme,
      type: item.type,
      difficulty: item.difficulty,
      steps: item.steps,
    },
  }));

  // --- 解説本文（条件 (4) を構造で満たす：見出しは行頭の「問N」） ---
  const bodies = items.map(
    (item, index) => `問${index + 1}　正解は ${item.answer}\n${item.commentary.join('\n')}`,
  );

  const summary =
    meta.summary.length > 0
      ? `\n\n【第${meta.setNo}回のまとめ】\n${meta.summary.map((s) => `・${s}`).join('\n')}`
      : '';

  const explanation = `${meta.intro}\n\n${bodies.join('\n\n')}${summary}`;

  return {
    id: base,
    category: `第${meta.setNo}回 ${meta.category}`,
    // 英文法は本番の読み上げ回数という概念が無いので 1 にしておく
    // （ListeningAudioPlayer の「2回続けて再生」ボタンを出さないため）
    readCount: 1,
    audioTracks,
    text,
    subQuestions,
    explanation,
    surroundingKnowledge: meta.surroundingKnowledge,
    deepDiveTopics: meta.deepDiveTopics,
  };
}
