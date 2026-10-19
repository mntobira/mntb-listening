/**
 * 学習ノート1件の形（localStorage の `notes_<uid>` に配列で保存している）。
 *
 * 書き込むのは解説画面（Explanation の「ノートに保存」）で、
 * 読むのは学習ハブ（StudyHub）とノート詳細（NoteDetail）。
 * 端末に残った古い形式のノートも読めるよう、id 以外はすべて任意にしている
 * （読む側はどれも `|| ''` などで欠けを補っている）。
 */
export interface StudyNote {
  id: string;
  uid?: string;
  /** 大問の問題文 */
  question?: string;
  /** 小問の正解を「, 」でつないだもの */
  answer?: string;
  explanation?: string;
  chapterTitle?: string;
  /** 章の中での番号（1始まり） */
  questionIndex?: number;
  /** 解き直しで演習画面へ戻るための章ID・大問ID */
  chapterId?: string;
  questionId?: string;
  memo?: string;
  createdAt?: string;
  isImportant?: boolean;
  reviewCount?: number;
  tags?: string[];
  lastReviewedAt?: string | null;
}
