/**
 * 教材データ（単元・大問・小問・音源）の共通の型。
 *
 * ■ なぜここに置くのか
 *   これまで画面・フック・整形処理の多くが `any` で大問や小問を受け取っており、
 *   フィールド名を打ち間違えても型検査で気づけなかった。
 *   データ側（src/data/*）の個別の型は「その教科のデータを書くための型」で、
 *   画面側が欲しいのは「どの教科の問題が来ても読める形」なので、
 *   その最小公倍数をここに1つだけ置く。
 *
 * ■ 形の根拠
 *   全教科（英語リスニング・英文法）の全データを走査して実在したキーと値の型に合わせている。
 *   画面側の汎用処理（採点・表示）が他教科由来の任意キー（group / acceptedAnswers など）も
 *   読むため、それらは「無くてもよい」項目として残している。
 *
 * ■ ルール
 *   ・データに無いことがある項目は必ず `?` にする（画面側は undefined を前提に書かれている）。
 *   ・ここは型だけを置く（値や処理を置くと data ↔ components の依存が生まれる）。
 */

/** 小問ごとの解き方の解説 */
export interface DetailedExplanation {
  theme?: string;
  /** 解き方の型（例：'言い換え型'） */
  type?: string;
  /** 難しさ（1〜5） */
  difficulty?: number;
  steps?: string[];
}

/** 誤答の切り方（第4問以降） */
export interface Distractor {
  no: number;
  why: string;
  type?: string;
}

/** 小問（マーク1つ＝解答欄1つ） */
export interface SubQuestion {
  id: string;
  label: string;
  /** 'multiple_choice' など。採点と表示の切り替えに使う */
  type: string;
  options: string[];
  correctAnswer: string;
  correctAnswerRate?: number;
  detailedExplanation?: DetailedExplanation | null;
  imageUrl?: string;
  imageCaption?: string;
  /** 選択肢の本文（options と同じ並び） */
  optionTexts?: string[];
  /** 選択肢が図そのもののときの画像パス（options と同じ並び） */
  optionImages?: string[];
  /** 完答グループ。同じ値の小問が全部正解のときだけ正解として数える */
  allOrNothingGroup?: string;
  examPoints?: number;
  blankHint?: string;
  explainJa?: string;
  distractors?: Distractor[];
  /** 対戦での制限時間（秒） */
  battleTimeLimit?: number;
  /** 対戦結果に出すひと言の理由 */
  oneLine?: string;
  // ---- 汎用の採点・表示処理が読む任意項目（現行データには無い） ----
  /** 同じ見出しでまとめて表示する小問のグループ名 */
  group?: string;
  /** 記述式で正解として認める別解 */
  acceptedAnswers?: string[];
  /** 記述式の部分点の基準 */
  partialCreditCriteria?: string;
  score?: number;
  explanation?: string;
  items?: string[];
}

/** 読み上げの発話1つ（対話形式の大問） */
export interface SpeakerTurn {
  who: string;
  text: string;
}

/** 配布資料（問題用紙に印刷されている表・図） */
export interface TrackMaterial {
  title: string;
  instruction?: string;
  sections?: { heading?: string; rows: string[] }[];
  table?: { headers: string[]; rows: string[][] };
  images?: { src: string; caption: string; minWidth?: number }[];
}

/** 決め手になる語句 */
export interface KeyPhrase {
  phrase: string;
  meaning: string;
}

/** 音源1本ぶん（英文法では音を出さない「解説用の英文」として同じ形を使う） */
export interface AudioTrack {
  /** 対応する小問の id */
  subId: string;
  /** 1本の音源に複数の小問がぶら下がるとき（第4問以降）の小問 id 一覧 */
  subIds?: string[];
  label: string;
  hint: string;
  /** 無ければ音声合成が script を読む */
  audioUrl?: string;
  script: string;
  turns?: SpeakerTurn[];
  material?: TrackMaterial;
  translation: string;
  keyPhrases: KeyPhrase[];
}

/** 大問（1画面で解く問題のまとまり） */
export interface Problem {
  id: string;
  category: string;
  text: string;
  subQuestions: SubQuestion[];
  explanation: string;
  surroundingKnowledge: string[];
  deepDiveTopics: string[];
  /** 本番の読み上げ回数 */
  readCount?: 1 | 2;
  /** リスニングの音源 */
  audioTracks?: AudioTrack[];
  /** 英文法の解説用英文（音を出さない） */
  explanationTracks?: AudioTrack[];
  /** 本番モードで再生を1回に制限する（第4問以降） */
  playOnce?: boolean;
  /** 制限時間（秒）の上書き */
  timeLimitSec?: number;
  /** 解説を「決め手の語句」だけにする（英文法） */
  keyPhrasesOnly?: boolean;
  /** 1小問ずつ進める画面にする */
  stepwise?: boolean;
  /** 構造化した解説の補足（data/explanationPostProcess.ts が後から付ける） */
  explanationSupplement?: string;
  // ---- 汎用処理が読む任意項目（現行データには無い） ----
  imageUrl?: string;
  imageCaption?: string;
  requiresMathPalette?: boolean;
  requiresChemicalPalette?: boolean;
  /**
   * 旧形式の見出し。現行データには無い（採点・学習記録は無ければ「第N回」で代用する）。
   * 読んでいる箇所の挙動を変えないために型にだけ残している。
   */
  title?: string;
}

/** 単元（1つのタブ・1つの章） */
export interface Chapter {
  id: string;
  abstractTitle: string;
  realTitle: string;
  /** 配点を合算するときの大問キー */
  questionGroup: string;
  topics: string[];
  practiceProblems: Problem[];
  miniTest: Problem[];
  /**
   * 旧形式の章名。現行データには無く、読む側は abstractTitle などへ代用する。
   * 復習リストの chapterTitle はこれをそのまま入れているため常に空になる（既知の課題）。
   */
  title?: string;
  // ---- リスニング固有 ----
  points?: number;
  marks?: number;
  readCount?: 1 | 2;
  speakers?: string;
}

/** 単元のまとまり（教科データの parts の1要素） */
export interface Part {
  id: string;
  title: string;
  section?: string;
  chapters: Chapter[];
}

/**
 * 表示・採点の小さなヘルパーが「読むかもしれない項目」だけを持つ緩い形。
 *
 * ヘルパーは本物の小問のほか、テストの部分的なオブジェクトや
 * 他教科由来の形（type が無い等）でも呼ばれ、どの項目も欠けていてよい前提で書かれている。
 * そのため SubQuestion / Problem を Partial にしたものを受け口にする（null / undefined も許す）。
 */
export type SubQuestionLike = Partial<SubQuestion> | null | undefined;
export type ProblemLike = (Partial<Omit<Problem, 'subQuestions'>> & { subQuestions?: SubQuestionLike[] }) | null | undefined;
