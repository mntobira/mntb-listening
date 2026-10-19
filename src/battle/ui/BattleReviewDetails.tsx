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
  // ★この1問の解説だけを出す（2026-10-04）★ 大問の解説（problem.explanation）は「問1〜問5の解答一覧」なので、
  //   対戦で出た1問と対応しない。小問ごとの解説（detailedExplanation / explanation）だけを使う。
  return subQuestionExplanation(sub);
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
  return <details className="mt-3 rounded-xl border border-slate-200 bg-white p-3" open={open}
    onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="min-h-11 cursor-pointer py-2 text-sm font-black text-blue-800">詳しい解説を読む</summary>
    {open && <div className="min-w-0 break-words text-base leading-8" data-battle-explanation>
      {failed ? <div role="alert">解説を読み込めませんでした。<button type="button" className="ml-2 min-h-11 underline" onClick={() => setRetry(n => n + 1)}>再読み込み</button></div>
        : text === null ? <p role="status">解説を読み込んでいます…</p>
        : text ? <><p className="mb-2 text-xs text-slate-500">この問題の解説</p><BattleText text={text} subject={question.subject} /></>
        : oneLine ? <BattleText text={oneLine} subject={question.subject} />
        : <p>この問題には詳しい解説が登録されていません。上の問題文と正しい答えを確認し、対応する演習で復習できます。</p>}
    </div>}
  </details>;
}
