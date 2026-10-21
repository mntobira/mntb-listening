/**
 * 解説エンジンが読む「問題・小問の最小形」（C-11: explanationFormat.ts から分離）。
 *   explanationFormat / explanationMarkers / explanationSlices の3つが共有する。
 *   他の src を import しない葉モジュール（循環 import を作らない）。
 */
/** 整形に必要な小問の最小形 */
export interface SubQuestionLike {
  id?: string;
  label?: string;
  type?: string;
  correctAnswer?: string;
  detailedExplanation?: { steps?: string[]; theme?: string } | null;
}

/** 整形に必要な問題の最小形 */
export interface QuestionLike {
  id?: string;
  explanation?: string;
  subQuestions?: SubQuestionLike[];
}
