import type { Chapter, Problem } from '../types/curriculum';
import { readJsonArray, setItemOrThrow } from './safeLocalStorage';

/**
 * 解説ページの「ノートに保存」：1問ぶんのノートを端末（localStorage の notes_<uid>）に足す。
 * Explanation.tsx から移した。保存する項目・形・キーは以前と同じ。
 * ゲストも保存できる（notes_guest）。失敗したときは例外をそのまま投げる（呼び出し側が知らせる）。
 */
export function saveQuestionNote({ uid, question, chapter, questionIndex }: {
  uid: string;
  question: Problem;
  chapter: Pick<Chapter, 'id' | 'abstractTitle' | 'realTitle'>;
  /** 章の中での表示番号（1始まり） */
  questionIndex: number;
}): void {
  const notesKey = `notes_${uid}`;
  const newNote = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    uid,
    question: question.text,
    answer: question.subQuestions.map((sq) => sq.correctAnswer).join(', '),
    explanation: question.explanation,
    chapterTitle: chapter.abstractTitle || chapter.realTitle || '',
    questionIndex,
    // 復習用リンク（要件5）：ノートから該当の演習問題へ戻れるよう
    // 章IDと問題IDを保持する。
    chapterId: chapter.id,
    questionId: question.id,
    memo: '',
    createdAt: new Date().toISOString(),
    isImportant: false,
    reviewCount: 0,
    tags: [],
    lastReviewedAt: null
  };

  const existingNotes = readJsonArray<typeof newNote>(notesKey);
  existingNotes.push(newNote);
  setItemOrThrow(notesKey, JSON.stringify(existingNotes)); // 失敗は呼び出し側へ投げる（元のまま）
}
