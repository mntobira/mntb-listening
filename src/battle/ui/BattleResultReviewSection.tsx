/**
 * 対戦結果「詳しい結果」の答えあわせ（1問ずつ）と「つづけて演習する」（C-09）。
 * BattleResult.tsx から移した。JSX・クラス名・data-* 属性・文言は1文字も変えていない。
 *
 * ★状態（いま見ている問・解説の読み込み）は useBattleReviewState で親が持つ★
 *   このセクションは「詳しい結果」ページを開いたときだけ描画される。状態を子に置くと、
 *   ・勝敗の画面⇄詳しい結果 を行き来するたびに「いま見ている問」が最初に戻る
 *   ・解説（ひと言の理由）の読み込みが、ページを開くまで始まらない
 *   と動きが変わってしまう。フックは親の元の位置で呼ぶので、フックの順番も以前と同じ。
 */
import { useEffect, useRef, useState } from 'react';
import type { TouchEvent as ReactTouchEvent } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { answerNumber } from '../core/arenaRules';
import { BattleText } from './BattleText';
import { BattleReviewDetails } from './BattleReviewDetails';
import { ReviewPictureGrid } from './ReviewPictureGrid';
import { isBattleOnlySubject } from '../../data/externalSubjects';
import type { subjectTheme } from '../../data/subjectTheme';
import type { BattleQuestion, BattleResultSummary } from '../core/types';
import { loadBattleAnswers } from '../data/battlePool';
import { AMBER, INK, INK_SUB, LINE, WRONG } from './BattleParts';
import { kanaTextOf } from './BattleResultLive';

/** 答えあわせの状態（親の BattleResult で、元の位置で呼ぶ） */
export function useBattleReviewState(result: BattleResultSummary, subject: string) {
  const [answerLoadFailed, setAnswerLoadFailed] = useState(false);
  const [answerRetry, setAnswerRetry] = useState(0);
  // 1問ずつの答えあわせ：いま見ている問（最初は最初に間違えた問）
  const firstWrong = result.me.perQuestion.findIndex((q) => !q.correct);
  const [reviewIndex, setReviewIndex] = useState(firstWrong >= 0 ? firstWrong : 0);
  const swipeX = useRef<number | null>(null);
  const chipsRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    // 番号の列だけを横に動かす（ページ全体はスクロールさせない）
    const nav = chipsRef.current;
    const chip = nav?.querySelector<HTMLElement>(`[data-review-chip="${reviewIndex}"]`);
    if (nav && chip) nav.scrollLeft = Math.max(0, chip.offsetLeft - nav.clientWidth / 2 + chip.offsetWidth / 2);
  }, [reviewIndex]);
  const onReviewTouchStart = (e: ReactTouchEvent) => { swipeX.current = e.touches[0]?.clientX ?? null; };
  const onReviewTouchEnd = (e: ReactTouchEvent) => {
    const start = swipeX.current; swipeX.current = null;
    const end = e.changedTouches[0]?.clientX;
    if (start == null || end == null || Math.abs(end - start) < 50) return;
    const last = result.me.perQuestion.length - 1;
    setReviewIndex((i) => (end < start ? Math.min(last, i + 1) : Math.max(0, i - 1)));
  };
  const [answers, setAnswers] = useState<ReadonlyMap<string, string>>(new Map());

  useEffect(() => {
    /**
     * ★片付け（cancelled）が必要な理由★
     * 「もう1回たいせん」を素早く押すとこの画面が消える。
     * そのあとに解答が届いて setAnswers すると、
     * 消えた部品への更新になって React が警告を出す。
     */
    let cancelled = false;
    setAnswerLoadFailed(false);
    loadBattleAnswers(subject)
      .then((map) => {
        if (!cancelled) setAnswers(map);
      })
      .catch(() => {
        if (!cancelled) setAnswerLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [subject, answerRetry]);
  return { answerLoadFailed, setAnswerRetry, reviewIndex, setReviewIndex, chipsRef, onReviewTouchStart, onReviewTouchEnd, answers };
}

export type BattleReviewState = ReturnType<typeof useBattleReviewState>;

export function BattleResultReviewSection({
  result,
  questions,
  subject,
  theme,
  onPractice,
  chapterTitleOf,
  review,
}: {
  result: BattleResultSummary;
  questions: BattleQuestion[];
  subject: string;
  theme: ReturnType<typeof subjectTheme>;
  onPractice?: (subject: string, chapterId: string, problemId?: string, subQuestionId?: string) => void;
  chapterTitleOf: (chapterId: string) => string;
  review: BattleReviewState;
}) {
  const { answerLoadFailed, setAnswerRetry, reviewIndex, setReviewIndex, chipsRef, onReviewTouchStart, onReviewTouchEnd, answers } = review;
  const chapterRows = (() => {
    const wrongChapters = new Set<string>();
    for (const s of result.me.perQuestion) {
      if (!s.correct) {
        const q = questions[s.index];
        if (q) wrongChapters.add(q.chapterId);
      }
    }
    const seen = new Map<string, { chapterId: string; wrong: boolean }>();
    for (const s of result.me.perQuestion) {
      const q = questions[s.index];
      if (!q || !q.chapterId || seen.has(q.chapterId)) continue;
      seen.set(q.chapterId, { chapterId: q.chapterId, wrong: wrongChapters.has(q.chapterId) });
    }
    return Array.from(seen.values()).sort((x, y) => Number(y.wrong) - Number(x.wrong));
  })();

  return (
    <>
      {/* 以前の「今回まちがえた問題」の縦長リストは消した（2026-10-04）。1問ずつ切り替える答えあわせだけにする */}
      {/* 1問ずつの内訳 ＋ ★試合後の答えとひと言の理由（請求⑦-A）★
          2026-10-02 夜：縦に長くスクロールさせず、問の番号と ‹ › で1問ずつ切り替える（スマホ） */}
      <section id="battle-result-detail" className="mb-4 result-review" data-result-review>
        <div className="result-review-head">
          <h2 className="text-xs font-black" style={{ color: INK_SUB }}>1問ずつのけっか（答えあわせ）</h2>
          <span className="result-review-count">{reviewIndex + 1} / {result.me.perQuestion.length}</span>
        </div>
        {answerLoadFailed && <p role="alert" className="mb-2 text-sm text-red-700">解説の読み込みに失敗しました。<button type="button" className="min-h-11 underline" onClick={() => setAnswerRetry(n => n + 1)}>再読み込み</button></p>}
        <div className="result-review-bar">
          <button type="button" className="result-review-arrow" data-review-prev aria-label="前の問題" disabled={reviewIndex <= 0} onClick={() => setReviewIndex(i => Math.max(0, i - 1))}><ChevronLeft size={22} /></button>
        <nav ref={chipsRef} className="result-review-chips" aria-label="問の番号">
          {result.me.perQuestion.map((q, i) => (
            <button key={q.index} type="button" data-review-chip={i} aria-current={i === reviewIndex ? 'true' : undefined}
              data-ok={q.correct || undefined} data-none={(!q.correct && q.answered === false) || undefined}
              aria-label={`第${q.index + 1}問 ${q.correct ? '正解' : q.answered === false ? '未回答' : '不正解'}`}
              onClick={() => setReviewIndex(i)}>{q.index + 1}</button>
          ))}
        </nav>
          <button type="button" className="result-review-arrow" data-review-next aria-label="次の問題" disabled={reviewIndex >= result.me.perQuestion.length - 1} onClick={() => setReviewIndex(i => Math.min(result.me.perQuestion.length - 1, i + 1))}><ChevronRight size={22} /></button>
        </div>
        <div className="result-review-stage" onTouchStart={onReviewTouchStart} onTouchEnd={onReviewTouchEnd}>
          {result.me.perQuestion.filter((_, i) => i === reviewIndex).map((q) => {
            const question = questions[q.index];
            const other = result.opponent?.perQuestion.find((o) => o.index === q.index) || null;
            /**
             * ★正解の文字列★
             * choice 系は options[answerIndex]、kana は panelOrder から組み立てる。
             * （プールは答えの文字列そのものを持たない設計なので、ここで作る）
             */
            const correctText = !question ? '' : question.format === 'kana'
              ? kanaTextOf(question.panelOrder)
              : question.format === 'panel' ? question.panelOrder.map(i => question.options[i]).join('')
              : question.options[question.answerIndex] || '';
            /**
             * ★ひと言の理由（oneLine）★
             * 手書き問題だけが持つ。機械生成の問題では undefined になるので、
             * その場合は理由の行を出さない（空の欄を出すと壊れて見える）。
             */
            const oneLine = question ? answers.get(question.id) : undefined;
            return (
              <div
                key={q.index}
                data-review-card={q.index}
                className="result-review-card min-w-0 flex-1 rounded-xl border-2 px-3 py-2"
                style={{
                  borderColor: q.correct ? `${theme.accent}55` : LINE,
                  background: q.correct ? `${theme.accent}12` : '#FFFFFF',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="w-5 shrink-0 text-xs font-black tabular-nums"
                      style={{ color: INK_SUB }}
                    >
                      {q.index + 1}
                    </span>
                    <span
                      className="shrink-0 rounded-full px-2 py-1 text-xs font-black"
                      style={{
                        background: q.correct ? theme.accent : `${WRONG}14`,
                        color: q.correct ? '#FFFFFF' : WRONG,
                      }}
                    >
                      {q.correct ? '正解' : q.answered === false ? '未回答' : '不正解'}
                    </span>

                  </span>
                  <span
                    className="shrink-0 text-right text-xs font-bold tabular-nums"
                    style={{ color: INK_SUB }}
                  >
                    <span style={{ color: q.correct ? AMBER : INK_SUB }}>{q.total}</span>
                    <span style={{ color: LINE }}> / </span>
                    {other?.total ?? 0}
                  </span>
                </div>
                {question && <div className="mt-2 text-sm leading-7 text-slate-800" data-result-question={question.id}>
                  <BattleText text={[question.prompt, question.label].filter(Boolean).join('\n')} subject={question.subject} />
                </div>}
                {q.answered !== undefined && <p className="mt-2 text-sm font-bold" style={{ color: q.correct ? '#1E7D46' : WRONG }}>
                  あなたの回答：{q.answered
                    ? <BattleText text={q.submittedAnswer || ''} subject={question?.subject ?? subject} /> : '未回答'}
                </p>}
                <div className="mt-1 min-w-0 text-sm font-bold leading-relaxed" style={{ color: INK }}>
                  正しい答え：<BattleText text={correctText} subject={question?.subject ?? subject} />
                </div>
                {question && <ReviewPictureGrid question={question} mine={q.answered ? q.submittedAnswer : undefined} />}
                {q.correct && (
                  <p className="mt-0.5 pl-7 text-xs font-bold" style={{ color: INK_SUB }}>
                    {q.timeUsed.toFixed(1)}秒 ／ 速さ +{q.speed}
                    {q.streak > 0 && ` ／ 連続 +${q.streak}`}
                  </p>
                )}

                {/*
                  ★ひと言の理由（請求⑦-A）★
                  「答えは分かったが、なぜそれが答えなのか」がここで埋まる。
                  間違えた問題では枠を強めて、目が先にそこへ行くようにする。
                */}
                {oneLine && (
                  <p
                    className="mt-1.5 flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-bold leading-relaxed"
                    style={{
                      background: q.correct ? '#FFFFFF' : `${AMBER}12`,
                      color: INK,
                      border: `1px solid ${q.correct ? LINE : `${AMBER}44`}`,
                    }}
                  >
                    <Lightbulb
                      size={12}
                      className="mt-px shrink-0"
                      style={{ color: q.correct ? INK_SUB : AMBER }}
                    />
                    <BattleText text={oneLine} subject={question?.subject ?? subject} />
                  </p>
                )}
                {question && <p className="arena-review-answer">相手の回答 {answerNumber(question, result.opponent?.perQuestion.find(s=>s.index===q.index)?.submittedAnswer)}：<BattleText text={result.opponent?.perQuestion.find(s=>s.index===q.index)?.submittedAnswer || '無回答'} subject={subject}/></p>}
                {question && <BattleReviewDetails question={question} oneLine={oneLine} />}
                {question && onPractice && !isBattleOnlySubject(subject) && <button type="button" data-practice-question={question.id}
                  onClick={() => onPractice(subject, question.chapterId, question.problemId, question.subQuestionId)}
                  className="mt-3 min-h-11 w-full rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900">
                  この問題を演習する（結果に戻れます）
                </button>}
              </div>
            );
          })}
        </div>
      </section>

      {/*
        ★★この単元を演習する（請求⑦-A の出口）★★

        ここが「① 対戦 ⇒ ② 演習」の橋である。
        対戦で出た章を並べ、★間違えた章を先に★ 出す。
        押すとその章の演習画面に飛ぶ（既存の単元選択と同じ入口を使う）。

        onPractice が渡されていないときは何も出さない。
        押しても何も起きないボタンを出すのは、無いより悪い。
      */}
      {onPractice && chapterRows.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-2 text-xs font-black" style={{ color: INK_SUB }}>
            つづけて演習する
          </h2>
          <div className="grid gap-1.5">
            {chapterRows.map((row) => (
              <button
                key={row.chapterId}
                type="button"
                onClick={() => onPractice(subject, row.chapterId)}
                className="flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition active:scale-[0.99]"
                style={{
                  borderColor: row.wrong ? `${AMBER}55` : LINE,
                  background: row.wrong ? `${AMBER}0E` : '#FFFFFF',
                }}
              >
                <BookOpen size={16} className="shrink-0" style={{ color: theme.accent }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-black" style={{ color: INK }}>
                    {chapterTitleOf(row.chapterId)}
                  </span>
                  <span className="block text-xs font-bold" style={{ color: INK_SUB }}>
                    {row.wrong ? 'まちがえた問題がある単元・演習する' : 'この単元を演習する'}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

    </>
  );
}
