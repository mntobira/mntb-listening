import { useEffect, useState } from 'react';
import type { BattleQuestion } from '../core/types';
import type { Chapter, Problem, SubQuestion } from '../../types/curriculum';
import { BattleText } from './BattleText';

/** Only called after a result's explanation is opened. Never loads study data during a match. */
export interface LoadedReviewData {
  text: string;
  audioUrl?: string;
  audioLabel?: string;
  scriptLines?: { who?: string; text: string }[];
  translationLines?: string[];
}

export async function loadReviewData(question: BattleQuestion): Promise<LoadedReviewData> {
  const { getChaptersOfSubject, miniTestProblemsOf } = await import('../../data/allChapters');
  const chapter = getChaptersOfSubject(question.subject).find((c: Chapter) => c.id === question.chapterId);
  if (!chapter) return { text: '' };
  const mini = miniTestProblemsOf(chapter);
  const problem = [...chapter.practiceProblems || [], ...mini].find((p: Problem) => p.id === question.problemId);
  const sub = problem?.subQuestions?.find((sq: SubQuestion) => sq.id === question.subQuestionId);
  if (!sub || !problem) return { text: '' };
  const tracks = Array.isArray(problem.audioTracks) ? problem.audioTracks : [];
  const matchedTrack = tracks.find(
    (t) => t.subId === sub.id || (Array.isArray(t.subIds) && t.subIds.map(String).includes(sub.id)),
  );
  let translationLines: string[] | undefined;
  if (matchedTrack) {
    try {
      const { loadListeningTranslations, trackKey } = await import('../../features/listeningTranslation/segments');
      const allTr = await loadListeningTranslations();
      const tr = allTr[trackKey(matchedTrack)];
      if (Array.isArray(tr) && tr.length > 0) translationLines = tr;
      else if (matchedTrack.translation?.trim()) translationLines = [matchedTrack.translation.trim()];
    } catch {
      // 和訳取得失敗時はスクリプト・解説のみ表示する
    }
  }
  const scriptLines = matchedTrack
    ? matchedTrack.turns?.length
      ? matchedTrack.turns.map((t) => ({ who: t.who, text: t.text }))
      : matchedTrack.script?.trim()
        ? [{ text: matchedTrack.script.trim() }]
        : undefined
    : undefined;
  // 英文法の演習解説は大問内に「問1〜問5」単位で保存されているため、
  // 対戦で出た小問番号に対応する詳しい本文だけを取り出す。
  return {
    text: practiceQuestionExplanation(problem, sub, chapter.id),
    audioUrl: matchedTrack?.audioUrl || undefined,
    audioLabel: matchedTrack?.label || undefined,
    scriptLines,
    translationLines,
  };
}

export async function loadReviewExplanation(question: BattleQuestion): Promise<string> {
  const loaded = await loadReviewData(question);
  return loaded.text;
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
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [audioLabel, setAudioLabel] = useState<string | undefined>(undefined);
  const [scriptLines, setScriptLines] = useState<{ who?: string; text: string }[] | undefined>(undefined);
  const [translationLines, setTranslationLines] = useState<string[] | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setText(null); setAudioUrl(undefined); setAudioLabel(undefined); setScriptLines(undefined); setTranslationLines(undefined); setFailed(false);
    void loadReviewData(question).then(loaded => {
      if (!alive) return;
      setText(loaded.text);
      setAudioUrl(loaded.audioUrl);
      setAudioLabel(loaded.audioLabel);
      setScriptLines(loaded.scriptLines);
      setTranslationLines(loaded.translationLines);
    }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [open, question, retry]);
  return <details className="mt-3 rounded-xl border border-slate-200 bg-white p-3" open={open}
    onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="min-h-11 cursor-pointer py-2 text-sm font-black text-blue-800">詳しい解説を読む</summary>
    {open && <div className="min-w-0 break-words text-base leading-8" data-battle-explanation>
      {audioUrl && (
        <div className="mb-3 rounded-lg border border-teal-200 bg-teal-50/60 p-2.5">
          <p className="mb-1 text-xs font-bold text-teal-800">
            {audioLabel ? `${audioLabel} の音源を聞き直す` : 'この問題の音源を聞き直す'}
          </p>
          <audio controls preload="metadata" src={audioUrl} className="h-9 w-full" playsInline />
          {scriptLines && scriptLines.length > 0 && (
            <details className="mt-2 rounded-md border border-teal-200/80 bg-white px-2.5 py-1.5 text-sm leading-6">
              <summary className="min-h-9 cursor-pointer py-1 text-xs font-bold text-teal-800">スクリプト・和訳を見る</summary>
              <div className="mt-1 space-y-1.5 text-slate-800" lang="en">
                {scriptLines.map((ln, idx) => (
                  <div key={idx}>
                    <p className="font-medium">
                      {ln.who && <b className="mr-1.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">{ln.who}</b>}
                      {ln.text}
                    </p>
                    {translationLines?.[idx] && (
                      <p className="text-xs text-slate-600" lang="ja">{translationLines[idx]}</p>
                    )}
                  </div>
                ))}
                {translationLines && translationLines.length > 0 && scriptLines.length === 1 && translationLines.length > 1 && (
                  <p className="text-xs text-slate-600" lang="ja">{translationLines.join(' ')}</p>
                )}
              </div>
            </details>
          )}
        </div>
      )}
      {failed ? <div role="alert">解説を読み込めませんでした。<button type="button" className="ml-2 min-h-11 underline" onClick={() => setRetry(n => n + 1)}>再読み込み</button></div>
        : text === null ? <p role="status">解説を読み込んでいます…</p>
        : text ? <><p className="mb-2 text-xs text-slate-500">この問題の解説</p><BattleText text={text} subject={question.subject} /></>
        : oneLine ? <BattleText text={oneLine} subject={question.subject} />
        : <p>この問題には詳しい解説が登録されていません。上の問題文と正しい答えを確認し、対応する演習で復習できます。</p>}
    </div>}
  </details>;
}
