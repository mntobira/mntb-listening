/**
 * ===================================================================
 * BattleAiRoomScreen — AI 対戦の1試合（準備 → 対戦 → 結果）
 * ===================================================================
 *
 * 人間どうしの BattleRoomScreen と同じ部品（BattleQuestionView / BattleResult /
 * PlayerBadge）を使い、見た目と操作を揃える。
 * 違いは
 *   ・Firestore を使わない（useAiBattle が端末内で進める）
 *   ・待機画面が「はじめる」だけ（相手を待つ必要がない）
 *   ・レートが動かない旨を結果に出す
 *   ・「もう1回」で同じ強さ・同じ教科の新しい試合を作れる
 */

import { useEffect, useMemo, useState } from 'react';
import { auth } from '../../firebase';
import { Bot, LogOut, Play, X } from 'lucide-react';
import { subjectTheme } from '../../data/subjectTheme';
import type { SubjectKey } from '../../data/allChapters';
import { aiProfileOf, type AiLevel, type AiProfile } from '../core/aiOpponent';
import type { GhostReason } from '../core/matchFallback';
import { ArenaFighters } from './ArenaFighters';
import { useAiBattle } from '../hooks/useAiBattle';
import { useBattleAudio } from '../hooks/useBattleAudio';
import { OpponentCard } from './OpponentCard';
import { BattleLiveStage } from './BattleLiveStage';
import { BattleResult } from './BattleResult';
import {
  BattleButton,
  BattleLoading,
  BattleNotice,
  BattleShell,
  BattleTitle,
  GOLD,
  INK,
  INK_SUB,
  LINE,
  PlayerBadge,
} from './BattleParts';

/** 結果画面に切り替わるまでの間（最後の1問の正解を見る時間） */
const REVEAL_HOLD_MS = 3500;

export function BattleAiRoomScreen({
  subject,
  level,
  matchNo,
  questionCount,
  chapterId,
  onExit,
  onRematch,
  onChangeLevel,
  onChangeSubject,
  onPractice,
  onOpenProfile, onOpenMissions, onActiveChange,
  onReview,
  ghost,
  retryIds,
  onRetryWrong,
}: {
  subject: string;
  level: AiLevel;
  /**
   * 試合番号。変わると新しい試合を作る（「もう1回」）。
   * ★key ではなく prop にしている理由★
   * このプロジェクトの型設定では、インライン型の関数コンポーネントに
   * key を渡すと型エラーになる。フック側で番号の変化を見て作り直す。
   */
  matchNo: number;
  /** 利用者が選んだ問題数。undefined なら教科の既定。 */
  questionCount?: number;
  chapterId?: string;
  onExit: (message?: string) => void;
  /** 同じ教科・同じ強さでもう1回 */
  onRematch: () => void;
  /** 強さを変える */
  onChangeLevel: () => void;
  /** 教科・単元を選び直す */
  onChangeSubject?: () => void;
  onPractice?: (subject: string, chapterId: string, problemId?: string, subQuestionId?: string) => void;
  onActiveChange?: (active: boolean) => void;
  onOpenProfile?: () => void;
  onOpenMissions?: () => void;
  /** リザルトの「復習する」 */
  onReview?: () => void;
  /**
   * 全国対戦で相手がいない／サーバーが使えないときの AI プレイヤー。
   * 渡すと「全国対戦」として見せ、名前・レートは ghost.profile、試合は自動で始まる。
   */
  ghost?: { profile: AiProfile; reason: GhostReason };
  /** 間違えた問題だけの再対戦（出題IDの一覧）。渡すとこの問題だけで試合をする */
  retryIds?: readonly string[];
  /** 結果画面の「間違えた問題だけ再対戦」 */
  onRetryWrong?: (subject: string, ids: string[]) => void;
}) {
  const theme = subjectTheme(subject as SubjectKey);
  const profile = ghost?.profile ?? aiProfileOf(level);
  const b = useAiBattle(subject, level, matchNo, questionCount, chapterId, ghost?.profile, retryIds);
  // ★開始前（読み込み・はじめる画面）も待合室の曲を鳴らし続ける（2026-10-02）★
  //   この画面は親（BattleMode）から「BGMは自分で持つ」と見なされるので、
  //   対戦ステージが始まるまで誰も曲を要求せず、無音になっていた。
  //   優先度は低め（1）：ステージ（10）や結果画面が始まればそちらが勝つ。
  useBattleAudio('matching', undefined, 1);
  // ★全国対戦で組まれた AI（ghost）は、人と組めたときと同じ見た目にする（「AI」とは出さない）★
  const modeLabel = ghost ? '全国対戦' : 'AIと対戦';
  // ★AI プレイヤーは見つかった直後に自動で始める★（人と組めたときと同じ流れ）
  const { phase: aiPhase, start: aiStart } = b;
  useEffect(() => {
    if (!ghost || aiPhase !== 'ready') return;
    const timer = window.setTimeout(aiStart, 2200);
    return () => window.clearTimeout(timer);
  }, [ghost, aiPhase, aiStart]);

  useEffect(() => {
    onActiveChange?.(b.phase === 'playing');
    return () => onActiveChange?.(false);
  }, [b.phase, onActiveChange]);

  const [growthOwnerUid] = useState(() => auth.currentUser?.uid || 'guest');
  const growthMatchId = useMemo(() => `ai:${crypto.randomUUID()}`, [matchNo, subject, level, chapterId]);
  const [resultMatchNo, setResultMatchNo] = useState(-1);
  const [showResult, setShowResult] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  // 新しい試合になったら結果表示を畳む
  useEffect(() => {
    setShowResult(false);
    setConfirmQuit(false);
  }, [matchNo]);
  useEffect(() => {
    if (!b.finished) return;
    const timer = window.setTimeout(() => { setResultMatchNo(matchNo); setShowResult(true); }, REVEAL_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [b.finished, matchNo]);

  const reveal = (b.answered && b.opponentAnswered) || b.remainMs <= 0;

  const backButton = (
    <BattleButton variant="ghost" onClick={() => onExit()} icon={<LogOut size={18} />}>
      対戦メニューにもどる
    </BattleButton>
  );

  // ------------------------------------------------------------
  // 読み込み中／失敗
  // ------------------------------------------------------------
  if (b.phase === 'loading') {
    return (
      <BattleShell>
        <BattleTitle subtitle={`${theme.label} ／ ${modeLabel}`} />
        <BattleLoading message="問題を用意しています…" />
      </BattleShell>
    );
  }
  if (b.phase === 'error') {
    return (
      <BattleShell footer={backButton}>
        <BattleTitle subtitle={`${theme.label} ／ ${modeLabel}`} />
        <div className="flex flex-1 items-center justify-center py-16">
          <BattleNotice message={b.error || '問題を用意できませんでした。'} />
        </div>
      </BattleShell>
    );
  }

  // ------------------------------------------------------------
  // 結果
  // ------------------------------------------------------------
  if (showResult && b.result && resultMatchNo === matchNo) {
    return (
      <BattleResult
        result={b.result}
        questions={b.questions}
        subject={subject}
        opponent={b.opponent}
        meNickname={b.me.nickname}
        mePhotoURL={b.me.photoURL}
        rating={null}
        ratingNote={ghost ? 'この試合はレートに反映されませんでした' : 'AI対戦ではレートは動きません（練習用）'}
        byForfeit={false}
        maskOpponent={!!ghost}
        onRematch={onRematch}
        rematchLabel={ghost ? 'もう1回 全国対戦' : `同じ相手（${b.opponent?.nickname || 'AI'}）ともう1回`}
        onPlayAgain={ghost ? undefined : onChangeLevel}
        playAgainLabel="相手の強さを変える"
        onChangeSubject={onChangeSubject}
        onExit={() => onExit()}
        onPractice={onPractice}
        growthMatchId={growthMatchId} growthOwnerUid={growthOwnerUid} growthEligible
        onOpenProfile={onOpenProfile} onOpenMissions={onOpenMissions}
        onReview={onReview}
        onRetryWrong={onRetryWrong}
        retryMode={!!retryIds}
        myAnsweredIndexes={b.myAnsweredIndexes}
        matchKey={`ai-${subject}-${level}-${matchNo}`}
      />
    );
  }

  // ------------------------------------------------------------
  // 準備（はじめる）
  // ------------------------------------------------------------
  if (b.phase === 'ready' && ghost) {
    // 人間どうしの全国対戦の開始準備画面（BattleRoomScreen）と同じ見た目
    return (
      <BattleShell className="arena-matching">
        <BattleTitle subtitle="全国対戦・開始準備" />
        <ArenaFighters matched />
        <OpponentCard nickname={b.opponent.nickname} photoURL={b.opponent.photoURL} rating={b.opponent.rating} mask isAi />
        <p className="text-center font-bold" data-ghost-ready>2人がそろいました。まもなくスタート</p>
        <BattleButton variant="ghost" onClick={() => onExit()}>対戦を終了する</BattleButton>
      </BattleShell>
    );
  }
  if (b.phase === 'ready') {
    return (
      <BattleShell
        footer={
          <div className="grid gap-2.5">
            <BattleButton onClick={b.start} icon={<Play size={18} />}>
              はじめる
            </BattleButton>
            <BattleButton variant="ghost" onClick={onChangeLevel}>
              強さを変える
            </BattleButton>
            <BattleButton variant="danger" onClick={() => onExit()} icon={<X size={18} />}>
              やめる
            </BattleButton>
          </div>
        }
      >
        <BattleTitle subtitle={`${theme.label} ／ ${b.questions.length}問しょうぶ`} />

        <section
          className="battle-card-in mb-4 rounded-3xl border-2 p-4"
          style={{ borderColor: `${profile.color}66`, background: '#FFFFFF' }}
        >
          <div className="flex items-center gap-2">
            <PlayerBadge nickname={b.me.nickname} photoURL={b.me.photoURL} rating={1500} isMe />
            <span
              className="battle-vs-pulse shrink-0 rounded-lg px-1.5 py-0.5 text-xs font-black"
              style={{ background: GOLD, color: INK }}
            >
              VS
            </span>
            <div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2 text-right">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2"
                style={{ background: `${profile.color}1F`, borderColor: `${profile.color}66`, color: profile.color }}
              >
                <Bot size={18} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-black" style={{ color: INK }}>
                  {profile.name}
                </p>
                <p className="text-xs font-bold tabular-nums" style={{ color: INK_SUB }}>
                  {`正解率 ${Math.round(profile.accuracy * 100)}% ／ レート目安 ${profile.displayRating}`}
                </p>
              </div>
            </div>
          </div>
        </section>

        <OpponentCard nickname={profile.name} rating={profile.displayRating} isAi
          aiNote={`${profile.tagline}（正解率 ${Math.round(profile.accuracy * 100)}%）`} />

        <BattleNotice
          message="出題・制限時間・点数の計算は全国対戦と同じです。レートは動きません。"
          tone="info"
        />

        {b.rules.note && (
          <p className="mt-4 text-center text-xs font-bold leading-relaxed" style={{ color: '#B7791F' }}>
            {b.rules.note}
          </p>
        )}
      </BattleShell>
    );
  }

  // ------------------------------------------------------------
  // 対戦中
  // ------------------------------------------------------------
  if (!b.current) {
    return (
      <BattleShell>
        <BattleTitle />
        <BattleLoading message="問題を読みこんでいます…" />
      </BattleShell>
    );
  }

  const footer = (
    <div className="mt-3">
      {confirmQuit ? (
        <div className="grid gap-2 rounded-2xl border-2 p-3" style={{ borderColor: LINE, background: '#FFFFFF' }}>
          <p className="text-center text-xs font-black" style={{ color: INK }}>
            {ghost ? '対戦をやめますか？' : '対戦をやめますか？（AI対戦なので記録には残りません）'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <BattleButton variant="ghost" onClick={() => setConfirmQuit(false)}>
              つづける
            </BattleButton>
            <BattleButton variant="danger" onClick={() => onExit()} icon={<X size={16} />}>
              やめる
            </BattleButton>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmQuit(true)}
          className="w-full min-h-11 py-1 text-center text-xs font-bold underline-offset-2 hover:underline"
          style={{ color: '#9A948A' }}
        >
          対戦をやめる
        </button>
      )}
    </div>
  );

  /**
   * ★臨場感アップデート★ 人間戦と同じ BattleLiveStage で描く。
   * AI の「回答済み・正解・不正解」は useAiBattle の aiSheet から
   * 同じ純粋関数で採点した結果を読むだけなので、見せ方が人間戦と揃う。
   */
  return (
    <BattleShell className="arena-live-shell">
      <BattleLiveStage
        question={b.current}
        index={b.currentIndex}
        total={b.questions.length}
        rules={b.rules}
        remainMs={b.remainMs}
        preStartMs={b.preStartMs}
        answered={b.answered}
        opponentAnswered={b.opponentAnswered}
        myChoice={b.myChoice}
        myPanel={b.myPanel}
        reveal={reveal}
        myScore={b.result?.me ?? b.scores?.me ?? null}
        opponentScore={b.result?.opponent ?? b.scores?.other ?? null}
        meNickname={b.me.nickname}
        opponentNickname={b.opponent.nickname}
        maskOpponent={!!ghost}
        finished={b.finished}
        onChoose={b.choose}
        onPushPanel={b.pushPanel}
        onPopPanel={b.popPanel}
        onCyclePanel={b.cyclePanel}
        onCommitKana={b.commitKana}
        footer={footer}
      />
    </BattleShell>
  );
}
