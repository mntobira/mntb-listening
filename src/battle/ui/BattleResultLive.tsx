import { answerNumber } from '../core/arenaRules';
/**
 * ===================================================================
 * BattleResultLive — リザルトの上部（WIN / LOSE / DRAW・統計・XP・復習）
 * ===================================================================
 *
 * ■ BattleResult から切り出している理由
 *   既存の BattleResult は「1問ずつの内訳」「レート」「この単元を演習する」
 *   を持ち、これらは今回も変えない。今回足すのは
 *     ・大きな WIN / LOSE / DRAW と勝敗のジングル
 *     ・正解数・平均回答時間・最大コンボ・獲得XP
 *     ・「今回間違えた問題」「相手は正解したが自分は間違えた問題」のまとめ
 *     ・「もう一度対戦」「復習する」の2導線
 *   で、これを別ファイルにしておけば既存部分の差分が最小になる。
 *
 * ■ 復習リストへの登録
 *   「復習する」を押した瞬間に、間違えた問題を既存の復習リスト
 *   （utils/reviewList.ts、演習の誤答と同じ保存先）に入れる。
 *   自動で入れない理由：対戦は同じ問題が繰り返し出るので、
 *   黙って入れると復習リストが対戦の誤答で埋まり、演習で間違えた問題が沈む。
 *   押した人だけ入れる（押さなければ何も変わらない）。
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { BookOpenCheck, Clock3, Flame, RotateCcw, Sparkles, Target } from 'lucide-react';

import { auth } from '../../firebase';
import { captureWrongAnswers, loadReviewList, type WrongAnswerInput } from '../../utils/reviewList';
import { kanaTextOf } from '../core/kanaKeyboard';
import {
  pickReviewQuestions,
  statsOf,
  type ReviewPick,
} from '../core/battleSummary';
import type { BattleQuestion, BattleResultSummary } from '../core/types';
import { useBattleAudio } from '../hooks/useBattleAudio';
import { AMBER, BattleButton, INK, INK_SUB, LINE, WRONG } from './BattleParts';
import { BattleText } from './BattleText';
import { ME_BLUE, OPP_RED } from './BattleLiveParts';
import { isBattleOnlySubject } from '../../data/externalSubjects';

const GREEN = '#1E7D46';

export function OutcomeHero({ outcome, byForfeit }: { outcome: 'win' | 'lose' | 'draw'; byForfeit: boolean }) {
  const conf = {
    win: { big: 'WIN', small: 'かち！', color: AMBER, bg: '#FFF7D6', ring: '#F4D03F' },
    lose: { big: 'LOSE', small: 'まけ…つぎは勝てる！', color: INK_SUB, bg: '#F4F1EA', ring: LINE },
    draw: { big: 'DRAW', small: 'ひきわけ', color: '#2E86C1', bg: '#EAF4FB', ring: '#2E86C155' },
  }[outcome];
  return (
    <section
      id="battle-outcome-hero"
      className="battle-live-hero mb-4 flex flex-col items-center rounded-3xl border-2 py-6"
      style={{ borderColor: conf.ring, background: conf.bg }}
    >
      <p className="text-5xl font-black tracking-[0.15em]" style={{ color: conf.color }}>
        {conf.big}
      </p>
      <p className="mt-1 font-handwriting text-xl font-black" style={{ color: INK }}>
        {conf.small}
      </p>
      {byForfeit && (
        <p className="mt-1 text-xs font-bold" style={{ color: INK_SUB }}>
          {outcome === 'win' ? '相手が途中で離脱したため、不戦勝です' : '途中離脱のため、この試合は負けとして記録されます'}
        </p>
      )}
    </section>
  );
}

/**
 * Read-only match statistics. XP is saved only by BattleGrowthReward/growthStore.
 */
export function ResultStats({
  result,
  answeredIndexes,
  matchKey,
}: {
  result: BattleResultSummary;
  answeredIndexes: number[];
  /** 同じ試合で2回足さないための鍵（部屋ID や AI 試合番号） */
  matchKey: string;
}) {
  const stats = useMemo(
    () => statsOf(result.me, new Set(answeredIndexes)),
    [result.me, answeredIndexes],
  );
  const opp = result.opponent;

  return (
    <section
      id="battle-result-stats"
      className="battle-card-in mb-4 grid grid-cols-2 gap-2 rounded-3xl border-2 p-3"
      style={{ borderColor: LINE, background: '#FFFFFF' }}
    >
      <Stat icon={<Target size={14} />} label="正解数" value={`${stats.correctCount} / ${result.me.perQuestion.length}`} sub={opp ? `相手 ${opp.correctCount}` : undefined} color={ME_BLUE} />
      <Stat icon={<Clock3 size={14} />} label="平均回答時間" value={stats.averageSeconds > 0 ? `${stats.averageSeconds.toFixed(1)}秒` : '—'} color={INK} />
      <Stat icon={<Flame size={14} />} label="最大コンボ" value={stats.maxStreak >= 2 ? `×${stats.maxStreak}` : '—'} sub={opp && opp.maxStreak >= 2 ? `相手 ×${opp.maxStreak}` : undefined} color="#E67E22" />

      {/* ★どこで差がついたか★ 問題ごとの ○× を両者並べる（試合後なので出してよい） */}
      <div className="col-span-2 rounded-2xl px-3 py-2" style={{ background: '#FDFBF7' }}>
        <p className="mb-1 text-xs font-black" style={{ color: INK_SUB }}>1問ごとのながれ</p>
        <QuestionTimeline result={result} />
      </div>
    </section>
  );
}

/**
 * 問題ごとの両者の結果を横一列に。
 * 上段 🔵自分・下段 🔴相手。各マスは ○（正解）／×（不正解・無回答）。
 * 「相手だけ正解」のマスは赤枠で目立たせる＝復習の優先度がそのまま見える。
 */
function QuestionTimeline({ result }: { result: BattleResultSummary }) {
  const n = result.me.perQuestion.length;
  const mine = new Map(result.me.perQuestion.map((q) => [q.index, q]));
  const theirs = new Map(result.opponent?.perQuestion.map((q) => [q.index, q]) ?? []);
  const cols = Array.from({ length: n }, (_, i) => i);
  const cell = (ok: boolean | undefined, color: string, hot: boolean) => (
    <span
      className="flex h-5 flex-1 items-center justify-center rounded text-xs font-black"
      style={{
        background: ok ? `${color}22` : '#F4F1EA',
        color: ok ? color : INK_SUB,
        boxShadow: hot ? `inset 0 0 0 1.5px ${OPP_RED}` : 'none',
      }}
    >
      {ok ? '○' : '×'}
    </span>
  );
  return (
    <div className="grid gap-1" role="table" aria-label="1問ごとの両者の正誤">
      <div className="flex items-center gap-1" role="row">
        <span className="w-4 text-xs" aria-hidden>🔵</span>
        {cols.map((i) => {
          const m = mine.get(i)?.correct;
          const t = theirs.get(i)?.correct;
          return <span key={`m${i}`} className="flex flex-1" role="cell">{cell(m, ME_BLUE, Boolean(t && !m))}</span>;
        })}
      </div>
      <div className="flex items-center gap-1" role="row">
        <span className="w-4 text-xs" aria-hidden>🔴</span>
        {cols.map((i) => (
          <span key={`o${i}`} className="flex flex-1" role="cell">{cell(theirs.get(i)?.correct, OPP_RED, false)}</span>
        ))}
      </div>
      <div className="flex items-center gap-1" aria-hidden>
        <span className="w-4" />
        {cols.map((i) => (
          <span key={`n${i}`} className="flex-1 text-center text-xs font-bold tabular-nums" style={{ color: INK_SUB }}>{i + 1}</span>
        ))}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  color,
  pop,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
  pop?: boolean;
}) {
  return (
    <div className="rounded-2xl px-3 py-2" style={{ background: '#FDFBF7' }}>
      <p className="flex items-center gap-1 text-xs font-black" style={{ color: INK_SUB }}>
        <span style={{ color }}>{icon}</span>
        {label}
      </p>
      <p className={`text-xl font-black tabular-nums ${pop ? 'battle-pop' : ''}`} style={{ color }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs font-bold" style={{ color: INK_SUB }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/**
 * 「今回間違えた問題」「相手は正解したが自分は間違えた問題」のまとめ。
 * ★ここは試合後なので正解を出してよい★
 */
export function ReviewPicks({
  picks,
  oneLines,
  subject,
  onPractice,
  chapterTitleOf,
  opponentScore,
}: {
  opponentScore?: BattleResultSummary['opponent'];
  picks: ReviewPick[];
  /** 出題ID → ひと言の理由（試合後に読み込む。無い問題は出さない） */
  oneLines?: ReadonlyMap<string, string>;
  subject: string;
  /** 「この単元を演習する」（既存の対戦→演習の橋） */
  onPractice?: (subject: string, chapterId: string, problemId?: string, subQuestionId?: string) => void;
  chapterTitleOf?: (chapterId: string) => string;
}) {
  if (picks.length === 0) {
    return (
      <section className="mb-4 rounded-2xl border-2 px-3 py-3 text-center" style={{ borderColor: `${GREEN}55`, background: `${GREEN}0E` }}>
        <p className="text-xs font-black" style={{ color: GREEN }}>
          全問正解！ 復習する問題はありません
        </p>
      </section>
    );
  }
  const oppRight = picks.filter((p) => p.reason === 'opponent-right');
  return (
    <section id="battle-review-picks" className="mb-4">
      <h2 className="mb-2 flex items-center gap-1 text-xs font-black" style={{ color: INK_SUB }}>
        <BookOpenCheck size={14} style={{ color: AMBER }} />
        今回まちがえた問題（{picks.length}問）
        {oppRight.length > 0 && (
          <span className="ml-1 rounded-full px-1.5 py-px text-xs" style={{ background: `${OPP_RED}14`, color: OPP_RED }}>
            相手は正解 {oppRight.length}
          </span>
        )}
      </h2>
      <ul className="grid gap-1.5">
        {picks.map((p) => (
          <li
            key={p.index}
            className="rounded-xl border-2 px-3 py-2"
            style={{
              borderColor: p.reason === 'opponent-right' ? `${OPP_RED}44` : LINE,
              background: p.reason === 'opponent-right' ? `${OPP_RED}08` : '#FFFFFF',
            }}
          >
            <p className="flex items-center gap-1.5 text-xs font-black" style={{ color: INK_SUB }}>
              <span className="tabular-nums">第{p.index + 1}問</span>
              {p.reason === 'opponent-right' && (
                <span style={{ color: OPP_RED }}>🔴 相手は正解していた</span>
              )}
            </p>
            <p className="mt-2 text-sm font-bold leading-relaxed" style={{ color: INK }}>
              <BattleText text={p.question.prompt || p.question.label} subject={subject} />
              {p.question.prompt && p.question.label && (
                <span className="ml-1 font-black" style={{ color: INK_SUB }}>{p.question.label}</span>
              )}
            </p>
            <p className="mt-0.5 text-xs font-black" style={{ color: GREEN }}>
              こたえ: <BattleText text={p.correctText} subject={subject} />
            </p>
            {opponentScore && <p className="arena-review-answer">相手の回答 {answerNumber(p.question, opponentScore.perQuestion.find(q=>q.index===p.index)?.submittedAnswer)}：<BattleText subject={subject} text={opponentScore.perQuestion.find(q=>q.index===p.index)?.submittedAnswer || '無回答'}/></p>}
            {oneLines?.get(p.question.id) && (
              <p className="mt-1 rounded-lg px-2 py-1 text-xs font-bold leading-relaxed" style={{ background: `${AMBER}12`, color: INK, border: `1px solid ${AMBER}44` }}>
                <BattleText text={oneLines.get(p.question.id)!} subject={subject} />
              </p>
            )}
            {onPractice && !isBattleOnlySubject(subject) && p.question.chapterId && (
              <button
                type="button"
                onClick={() => onPractice(subject, p.question.chapterId, p.question.problemId, p.question.subQuestionId)}
                className="mt-1.5 flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-black transition active:scale-[0.97]"
                style={{ borderColor: `${AMBER}66`, background: '#FFFFFF', color: AMBER }}
              >
                <BookOpenCheck size={12} />
                {chapterTitleOf ? `「${chapterTitleOf(p.question.chapterId)}」を演習する` : 'この単元を演習する'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 「もう一度対戦」「復習する」 */
export function ResultActions({
  onRematch,
  rematchLabel,
  onReview,
  picks,
  subject,
  chapterTitleOf,
}: {
  onRematch?: () => void;
  rematchLabel: string;
  onReview?: () => void;
  picks: ReviewPick[];
  subject: string;
  chapterTitleOf: (chapterId: string) => string;
}) {
  const uid = auth.currentUser?.uid || 'guest';
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const review = () => {
    if (!onReview) return;
    try {
      const inputs: WrongAnswerInput[] = picks.map((p) => ({
        chapterId: p.question.chapterId,
        chapterTitle: chapterTitleOf(p.question.chapterId),
        questionId: p.question.problemId,
        subQuestionId: p.question.subQuestionId,
        subLabel: p.question.label || undefined,
        questionText: p.question.prompt || p.question.label,
        correctAnswer: p.correctText,
        wrongAnswer: undefined,
      }));
      captureWrongAnswers(uid, inputs);
      const stored = loadReviewList(uid);
      if (inputs.some(input => !stored.some(item => item.chapterId === input.chapterId && item.questionId === input.questionId && item.subQuestionId === input.subQuestionId && item.correctAnswer === input.correctAnswer))) {
        throw new Error('Review persistence failed');
      }
      setSaved(true);
    } catch {
      setError('復習リストに保存できませんでした。保存設定・空き容量を確認してください。');
      return;
    }
    onReview();
  };

  return (
    <div className="grid gap-2.5">
      {onRematch && (
        <BattleButton onClick={onRematch} icon={<RotateCcw size={18} />}>
          {rematchLabel}
        </BattleButton>
      )}
      {onReview && !isBattleOnlySubject(subject) && (
        <BattleButton variant="ghost" onClick={review} icon={<BookOpenCheck size={18} />}>
          {picks.length > 0 ? `復習する（${picks.length}問を復習リストへ）` : '復習リストを見る'}
        </BattleButton>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {saved && (
        <p className="text-center text-xs font-bold" style={{ color: GREEN }}>
          復習リストに登録しました
        </p>
      )}
    </div>
  );
}

/** 勝敗のジングルを1回だけ鳴らす */
export function useOutcomeJingle(outcome: 'win' | 'lose' | 'draw') {
  const { play } = useBattleAudio(null);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    play(outcome);
  }, [outcome, play]);
}

export { pickReviewQuestions, kanaTextOf, WRONG };
