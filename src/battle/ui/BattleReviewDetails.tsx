import { useEffect, useState } from 'react';
import type { BattleQuestion } from '../core/types';
import type { Chapter, Problem, SubQuestion } from '../../types/curriculum';
import { BattleText } from './BattleText';

/** Only called after a result's explanation is opened. Never loads study data during a match. */
export async function loadReviewExplanation(question: BattleQuestion): Promise<string> {
  const { getChaptersOfSubject, miniTestProblemsOf } = await import('../../data/allChapters');
  const chapter = getChaptersOfSubject(question.subject).find((c: Chapter) => c.id === question.chapterId);
  if (!chapter) return '';
  const mini = miniTestProblemsOf(chapter);
  const problem = [...chapter.practiceProblems || [], ...mini].find((p: Problem) => p.id === question.problemId);
  const sub = problem?.subQuestions?.find((sq: SubQuestion) => sq.id === question.subQuestionId);
  if (!sub) return '';
  // 英文法の演習解説は大問内に「問1〜問5」単位で保存されているため、
  // 対戦で出た小問番号に対応する詳しい本文だけを取り出す。
  return practiceQuestionExplanation(problem, sub, chapter.id);
}

/** 小問1つぶんの解説テキスト（ポイント・考え方の手順）。無ければ空文字 */
export function subQuestionExplanation(sub: SubQuestion | null | undefined): string {
  const d = sub?.detailedExplanation;
  const parts: string[] = [];
  if (d && typeof d === 'object') {
    if (typeof d.theme === 'string' && d.theme.trim()) parts.push(`【ポイント】${d.theme.trim()}`);
    if (Array.isArray(d.steps)) {
      const steps = d.steps.filter((x: unknown) => typeof x === 'string' && x.trim());
      if (steps.length) parts.push(steps.join('\n'));
    }
  }
  if (typeof sub?.explanation === 'string' && sub.explanation.trim()) parts.push(sub.explanation.trim());
  return parts.join('\n\n');
}

/** 英文法の大問解説から、番号が一致する小問の詳しい本文を取り出す。 */
export function exerciseQuestionExplanation(explanation: unknown, questionNumber: number): string {
  if (typeof explanation !== 'string' || questionNumber < 1) return '';
  const lines = explanation.split(/\r?\n/u);
  let currentNumber: number | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    const marker = line.match(/^\s*問(\d+)[\s　]+正解は(?:[\s　]|$)/u);
    if (marker) {
      if (currentNumber === questionNumber) return currentLines.slice(1).join('\n').trim();
      currentNumber = Number(marker[1]);
      currentLines = [line];
      continue;
    }
    if (/^\s*【第\d+回のまとめ】/u.test(line)) {
      if (currentNumber === questionNumber) return currentLines.slice(1).join('\n').trim();
      break;
    }
    if (currentNumber !== null) currentLines.push(line);
  }

  return currentNumber === questionNumber ? currentLines.slice(1).join('\n').trim() : '';
}

/** 英文法は大問側の詳しい本文を優先し、他教科は従来の小問解説を維持する。 */
export function practiceQuestionExplanation(
  problem: Pick<Problem, 'explanation' | 'subQuestions'>,
  sub: SubQuestion,
  chapterId: string,
): string {
  if (chapterId.startsWith('eg')) {
    const subIndex = problem.subQuestions?.findIndex((candidate) => candidate.id === sub.id) ?? -1;
    if (subIndex >= 0) {
      const detailed = exerciseQuestionExplanation(problem.explanation, subIndex + 1);
      if (detailed) return detailed;
    }
  }
  return subQuestionExplanation(sub);
}

export function BattleReviewDetails({ question, oneLine }: { question: BattleQuestion; oneLine?: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setText(null); setFailed(false);
    void loadReviewExplanation(question).then(value => { if (alive) setText(value); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [open, question, retry]);
  return <details className="mt-3 rounded-xl border border-[#E5DCCC] bg-[#FFFDF8] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_1.5px_0_#E6DCCB]" open={open}
    onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="min-h-11 cursor-pointer py-2 text-sm font-black text-[#1E4B8F]">詳しい解説を読む</summary>
    {open && <div className="min-w-0 break-words text-base leading-8" data-battle-explanation>
      {failed ? <div role="alert">解説を読み込めませんでした。<button type="button" className="ml-2 min-h-11 underline" onClick={() => setRetry(n => n + 1)}>再読み込み</button></div>
        : text === null ? <p role="status">解説を読み込んでいます…</p>
        : text ? <><p className="mb-2 text-xs font-bold text-[#7A6A52]">この問題の解説</p><BattleText text={text} subject={question.subject} /></>
        : oneLine ? <BattleText text={oneLine} subject={question.subject} />
        : <p>この問題には詳しい解説が登録されていません。上の問題文と正しい答えを確認し、対応する演習で復習できます。</p>}
    </div>}
  </details>;
}
