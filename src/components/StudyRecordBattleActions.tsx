import { useState } from 'react';
import { BookOpen, NotebookPen } from 'lucide-react';
import { BattleText } from '../battle/ui/BattleText';
import type { BattleQuestion } from '../battle/core/types';
import { captureWrongAnswers, loadReviewList, reviewKeyOf, type WrongAnswerInput } from '../utils/reviewList';
import type { StudyLogEntry, StudyLogItem } from '../utils/studyLog';

type StudyRetryRequest = { chapterId: string; questionId: string; wrongOnly: boolean; subQuestionIds: string[] };
// Keep in sync with BATTLE_ONLY_SUBJECTS in data/externalSubjects.ts without adding that data file to startup imports.
const BATTLE_ONLY_SUBJECTS = new Set(['english_vocab', 'joho']);

interface ResolvedBattleQuestion {
  question: BattleQuestion;
  prompt: string;
  correctAnswer: string;
}

async function resolveBattleQuestion(subject: string, id: string): Promise<ResolvedBattleQuestion | null> {
  const { loadPool } = await import('../battle/data/battlePool');
  const question = (await loadPool(subject)).find((candidate) => candidate.id === id);
  if (!question) return null;

  let prompt = [question.prompt, question.label].filter(Boolean).join(' ');
  if (!prompt) {
    // 対戦用データの本文が空でも、教材の大問・小問側から表示用テキストを補う。
    try {
      const { getChaptersOfSubject } = await import('../data/allChapters');
      const chapter = getChaptersOfSubject(question.subject).find((candidate) => candidate.id === question.chapterId);
      const problem = [...(chapter?.practiceProblems ?? []), ...(chapter?.miniTest ?? [])]
        .find((candidate) => candidate.id === question.problemId);
      const sub = problem?.subQuestions?.find((candidate) => candidate.id === question.subQuestionId);
      prompt = [problem?.text, sub?.label, ...(sub?.options ?? [])].filter(Boolean).join('\n');
    } catch {
      // 外部教科やデータ読込エラー時も、対戦プール内の情報は表示する。
    }
  }

  let correctAnswer = '';
  if (question.format === 'kana') {
    const { kanaTextOf } = await import('../battle/core/kanaKeyboard');
    correctAnswer = kanaTextOf(question.panelOrder);
  } else if (question.format === 'panel') {
    correctAnswer = question.panelOrder.map((index) => question.options[index] ?? '').join('');
  } else {
    correctAnswer = question.options[question.answerIndex] ?? '';
  }
  return { question, prompt, correctAnswer };
}

/** 「解いた問題」に本文が欠けた対戦記録を確認するボタンと、誤答の復習登録を置く。 */
export function StudyRecordBattleActions({
  entry,
  item,
  uid,
  isWrong,
  onRetry,
}: {
  entry: StudyLogEntry;
  item: StudyLogItem;
  uid: string;
  isWrong: boolean;
  onRetry?: (request: StudyRetryRequest) => void;
}) {
  const [loading, setLoading] = useState<'question' | 'review' | null>(null);
  const [resolved, setResolved] = useState<ResolvedBattleQuestion | null>(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [saved, setSaved] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [error, setError] = useState('');
  const subject = entry.subject || '';
  const canPractice = !BATTLE_ONLY_SUBJECTS.has(subject);

  const loadQuestion = async () => {
    if (resolved) return resolved;
    if (!subject) throw new Error('対戦の教科が記録されていません');
    const result = await resolveBattleQuestion(subject, item.id);
    if (!result) throw new Error('この問題を読み込めませんでした');
    setResolved(result);
    return result;
  };

  const handleShowQuestion = async () => {
    setLoading('question');
    setError('');
    try {
      await loadQuestion();
      setShowQuestion((value) => !value);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '問題を読み込めませんでした');
    } finally {
      setLoading(null);
    }
  };

  const handleAddToReview = async () => {
    setLoading('review');
    setError('');
    try {
      const result = await loadQuestion();
      const key = reviewKeyOf(result.question.chapterId, result.question.problemId, result.question.subQuestionId);
      if (loadReviewList(uid).some((reviewItem) => reviewItem.key === key)) {
        setSaved(true);
        return;
      }
      const input: WrongAnswerInput = {
        chapterId: result.question.chapterId,
        chapterTitle: entry.title,
        questionId: result.question.problemId,
        subQuestionId: result.question.subQuestionId,
        subLabel: result.question.label || undefined,
        questionText: result.prompt || item.prompt || undefined,
        correctAnswer: result.correctAnswer || item.answer || undefined,
      };
      captureWrongAnswers(uid, [input]);
      if (!loadReviewList(uid).some((reviewItem) => reviewItem.key === key)) {
        throw new Error('復習ノートに保存できませんでした');
      }
      setSaved(true);
      window.dispatchEvent(new Event('review-list-changed'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '復習ノートに保存できませんでした');
    } finally {
      setLoading(null);
    }
  };

  const handleRetry = async (wrongOnly: boolean) => {
    if (!onRetry) return;
    setRetryLoading(true);
    setError('');
    try {
      const result = await loadQuestion();
      onRetry({
        chapterId: result.question.chapterId,
        questionId: result.question.problemId,
        wrongOnly,
        subQuestionIds: wrongOnly ? [result.question.subQuestionId] : [],
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '演習を開けませんでした');
    } finally {
      setRetryLoading(false);
    }
  };

  return (
    <div className="mt-2 grid gap-1.5" data-study-record-battle-actions>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800" onClick={handleShowQuestion} disabled={loading !== null}>
          <BookOpen size={14} className="mr-1 inline" aria-hidden="true" />
          {loading === 'question' ? '問題を読み込み中…' : showQuestion ? '問題を閉じる' : '問題を見る'}
        </button>
        {canPractice && !item.correct && !saved && (
          <button type="button" className="min-h-11 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900" onClick={handleAddToReview} disabled={loading !== null}>
            <NotebookPen size={14} className="mr-1 inline" aria-hidden="true" />
            {loading === 'review' ? '追加中…' : '復習ノートに追加'}
          </button>
        )}
        {canPractice && saved && <span className="inline-flex min-h-11 items-center text-xs font-bold text-green-700" role="status">復習ノートに登録済み</span>}
      </div>
      {onRetry && canPractice && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={`${item.label}の解き直し`}>
          <button type="button" className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800" onClick={() => void handleRetry(false)} disabled={retryLoading || loading !== null}>
            {retryLoading ? '演習を準備中…' : '解きなおす'}
          </button>
          <button type="button" className="min-h-11 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-900 disabled:opacity-60" onClick={() => void handleRetry(true)} disabled={!isWrong || retryLoading || loading !== null}>
            {isWrong ? 'まちがえた問題だけ解く' : 'まちがえた問題だけ解く（なし）'}
          </button>
        </div>
      )}
      {showQuestion && resolved && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm leading-7" data-study-record-question>
          {resolved.prompt ? <BattleText text={resolved.prompt} subject={subject} /> : <p>問題文が見つかりませんでした。</p>}
          {resolved.question.options.length > 0 && (
            <ol className="mt-2 list-inside list-decimal space-y-1">
              {resolved.question.options.map((option, index) => <li key={index}><BattleText text={option} subject={subject} /></li>)}
            </ol>
          )}
          {resolved.correctAnswer && <p className="mt-2 font-bold text-green-800">正しい答え：<BattleText text={resolved.correctAnswer} subject={subject} /></p>}
        </div>
      )}
      {error && <p className="text-xs font-bold text-red-700" role="alert">{error}</p>}
    </div>
  );
}
