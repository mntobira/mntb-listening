import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveQuestionNote } from '../src/utils/questionNote';
import { fixture } from './helpers/fixture';
import type { Problem } from '../src/types/curriculum';

/** R-11: 解説の「ノートに保存」を utils/questionNote.ts に移した。保存の形とキーが以前と同じか。 */
describe('ノートに保存', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('notes_<uid> に以前と同じ項目で1件足す（既存のノートは残す）', () => {
    const store: Record<string, string> = { notes_u1: JSON.stringify([{ id: 'old' }]) };
    vi.stubGlobal('localStorage', { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; } });
    saveQuestionNote({
      uid: 'u1',
      question: fixture<Problem>({ id: 'q1', text: '本文', explanation: '解説', subQuestions: [{ correctAnswer: '①' }, { correctAnswer: '③' }] }),
      chapter: { id: 'el1_A', abstractTitle: '', realTitle: '第1問A' },
      questionIndex: 3,
    });
    const notes = JSON.parse(store.notes_u1);
    expect(notes).toHaveLength(2);
    expect(notes[0]).toEqual({ id: 'old' });
    const { id, createdAt, ...rest } = notes[1];
    expect(typeof id).toBe('string');
    expect(typeof createdAt).toBe('string');
    expect(Object.keys(notes[1])).toEqual(['id', 'uid', 'question', 'answer', 'explanation', 'chapterTitle', 'questionIndex', 'chapterId', 'questionId', 'memo', 'createdAt', 'isImportant', 'reviewCount', 'tags', 'lastReviewedAt']);
    expect(rest).toEqual({ uid: 'u1', question: '本文', answer: '①, ③', explanation: '解説', chapterTitle: '第1問A', questionIndex: 3,
      chapterId: 'el1_A', questionId: 'q1', memo: '', isImportant: false, reviewCount: 0, tags: [], lastReviewedAt: null });
  });
});
