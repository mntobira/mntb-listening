/**
 * TOEIC Part 5 の「ノートに保存」（1問ずつ）（2026-10-29）
 *
 * 英文法の「ノートに保存」（utils/questionNote.ts の saveQuestionNote）は大問1つ（＝TOEIC では1回30問）を
 * まるごと1件にするため、TOEIC の1問を保存する用にここで同じ形のノートを作る。共通の関数は変えない。
 *
 * ■ 二重登録を防ぐ決まり
 *   ・ノートのIDを「toeic_小問ID」に固定する。同じ問題はノートに1件だけ（2回押しても増えない）。
 *   ・ノート（notes_<uid>）は、採点のときに間違えた問題が自動で入る「復習リスト」（review_list_<uid>）とは
 *     別の入れ物（既存の仕様）。ここでは復習リストには書かないので、ボタンで復習リストが二重になることはない。
 */
import type { Chapter, Problem, SubQuestion } from '../../types/curriculum';
import { readJsonArray, setItemOrThrow } from '../../utils/safeLocalStorage';
import type { ToeicExplanation } from './toeicPageModel';

export const toeicNoteId = (subQuestionId: string) => `toeic_${subQuestionId}`;

const notesKey = (uid: string) => `notes_${uid}`;

/** この問題をもうノートに保存しているか */
export function isToeicNoteSaved(uid: string, subQuestionId: string): boolean {
  const id = toeicNoteId(subQuestionId);
  return readJsonArray<{ id?: string }>(notesKey(uid)).some((n) => n && n.id === id);
}

/** ノートに書く解説（画面の解説と同じ順・同じ見出し。空の項目は書かない） */
export function toeicNoteText(ex: ToeicExplanation): string {
  const rows: string[] = [`【正解の理由】${ex.why}`];
  if (ex.hint) rows.push(`【着眼点】${ex.hint}`);
  if (ex.rule) rows.push(`【ポイント】${ex.rule}`);
  rows.push('【選択肢】', ...ex.choices.map((c) => `${c.mark} ${c.text}　${c.correct ? '○ 正解' : `× ${c.reason}`}`));
  if (ex.tip) rows.push(`【TOEICでのコツ】${ex.tip}`);
  rows.push(`【和訳】${ex.translation}`);
  if (ex.keywords.length > 0) rows.push(`【重要語句】${ex.keywords.map((k) => `${k.en}（${k.ja}）`).join('　')}`);
  return rows.join('\n');
}

/**
 * 1問ぶんをノートに保存する。すでにあれば何もしない（false を返す）。
 * 保存する項目とキーは saveQuestionNote と同じ（学習ノート画面・同期はそのまま読める）。
 * 失敗したときは例外をそのまま投げる（呼び出し側が知らせる）。
 */
export function saveToeicNote({ uid, chapter, problem, sq, ex, questionNo, roundNo }: {
  uid: string;
  chapter: Pick<Chapter, 'id' | 'abstractTitle' | 'realTitle'>;
  problem: Pick<Problem, 'id'>;
  sq: Pick<SubQuestion, 'id' | 'correctAnswer'>;
  ex: ToeicExplanation;
  questionNo: number;
  roundNo: number;
}): boolean {
  const key = notesKey(uid);
  const id = toeicNoteId(sq.id);
  const existing = readJsonArray<{ id?: string }>(key);
  if (existing.some((n) => n && n.id === id)) return false;
  const correct = ex.choices.find((c) => c.correct);
  const note = {
    id,
    uid,
    // Part 7 は設問文と根拠の英文（2026-11-02）
    question: ex.prompt ? `問${questionNo}　${ex.prompt}\n根拠：${ex.sentence}` : `問${questionNo}　${ex.sentence}`,
    answer: `${sq.correctAnswer} ${correct?.text ?? ''}`.trim(),
    explanation: toeicNoteText(ex),
    chapterTitle: `${chapter.abstractTitle || chapter.realTitle || ''} 第${roundNo}回`.trim(),
    questionIndex: roundNo,
    chapterId: chapter.id,
    questionId: problem.id,
    memo: '',
    createdAt: new Date().toISOString(),
    isImportant: false,
    reviewCount: 0,
    tags: [],
    lastReviewedAt: null,
  };
  existing.push(note);
  setItemOrThrow(key, JSON.stringify(existing));
  return true;
}
