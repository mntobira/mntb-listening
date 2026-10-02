import type { BattleQuestion } from './types';
export function vocabScope(book: string, start: number, end: number) { return `vocab:${book}:${start}:${end}`; }
export function questionInScope(q: BattleQuestion, scope: string): boolean {
  if (!scope.startsWith('vocab:')) return q.chapterId === scope;
  const match = /^vocab:([a-z0-9]+):(\d+):(\d+)$/.exec(scope);
  if (!match || q.subject !== 'english_vocab') return false;
  const [, book, lo, hi] = match;
  const number = Number(q.subQuestionId);
  return Number(lo) >= 1 && Number(hi) >= Number(lo) && q.chapterId === book && Number.isInteger(number) && number >= Number(lo) && number <= Number(hi);
}
export function vocabRanges(pool: readonly BattleQuestion[], book: string, size: 50 | 100) {
  const numbers = [...new Set(pool.filter(q => q.chapterId === book).map(q => Number(q.subQuestionId)))].filter(n => Number.isInteger(n) && n > 0);
  const max = Math.max(0, ...numbers);
  const ranges: { id: string; title: string; count: number }[] = [];
  for (let start = 1; start <= max; start += size) {
    const end = Math.min(start + size - 1, max);
    const count = numbers.filter(n => n >= start && n <= end).length;
    if (count) ranges.push({ id: vocabScope(book, start, end), title: `${start}〜${end}語`, count });
  }
  return ranges;
}
