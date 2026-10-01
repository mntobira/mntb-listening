/**
 * ===================================================================
 * BattleLiveStage — 対戦中の画面を「臨場感つき」で組み立てる共通部品
 * ===================================================================
 *
 * ■ なぜ人間戦（BattleRoomScreen）と AI 戦（BattleAiRoomScreen）で共有するのか
 *   両画面は同じ BattleQuestionView を使い、上部の得点表もほぼ同じだった。
 *   実況・演出・音を2か所に書くと片方だけ直し忘れる。
 *   ここに「試合中の見せ方」を集め、2つの画面は状態を渡すだけにする。
 *
 * ■ 既存の仕組みへの影響
 *   受け取るのは既存フックが返している値（＋ preStartMs）だけ。
 *   進行・採点・同期には触らない。BattleQuestionView もそのまま使う。
 *
 * ■ 画面の順序（上から）
 *   得点表（🔵自分 / 🔴相手・状態）
 *   FINAL QUESTION／のこりN問 の帯
 *   実況ログ（最大3行）
 *   知らせ（圏外など：呼び出し側が children で差し込む）
 *   問題・選択肢（既存）
 *   オーバーレイ：カウントダウン／トースト（pointer-events: none）
 */

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import type { BattlePlayerScore, BattleQuestion, BattleRule } from '../core/types';
import { BGM_FILES } from '../audio/bgmFiles';
import { countdownLabelAt, COUNTDOWN_START_HOLD_MS, COUNTDOWN_TOTAL_MS, gapMessage, maxPointsPerQuestion, phaseOf } from '../core/battleLive';
import { answerNumber } from '../core/arenaRules';
import { resolveTimeLimit } from '../core/battleCore';
import { bgmTrackFor } from '../core/audioSettings';
import { useBattleAudio } from '../hooks/useBattleAudio';
import { useBattleLive } from '../hooks/useBattleLive';
import { ArenaFighters } from './ArenaFighters';
import { CorrectBurst } from '../../components/fx/CorrectBurst';
import { BattleText } from './BattleText';
import { BattleQuestionView } from './BattleQuestionView';
import {
  ClosingBanner,
  CountdownOverlay,
  FinalBanner,
  GapHint,
  LiveFeed,
  LiveScoreboard,
  LiveToast,
} from './BattleLiveParts';

export interface BattleLiveStageProps {
  question: BattleQuestion;
  index: number;
  total: number;
  rules: BattleRule;
  remainMs: number;
  preStartMs: number;
  answered: boolean;
  opponentAnswered: boolean;
  locked?: boolean;
  myChoice: number;
  myPanel: number[];
  reveal: boolean;
  myScore: BattlePlayerScore | null;
  opponentScore: BattlePlayerScore | null;
  meNickname: string;
  opponentNickname: string;
  maskOpponent: boolean;
  /** 試合が終わったか（BGM を止める・実況を止める） */
  finished: boolean;
  onChoose: (index: number) => void;
  onPushPanel: (index: number) => void;
  onPopPanel: () => void;
  onCyclePanel: () => void;
  onCommitKana: () => void;
  /** 得点表と問題の間に差し込む知らせ（圏外・復帰など） */
  notices?: ReactNode;
  /** 問題の下に置くもの（「対戦をやめる」など） */
  footer?: ReactNode;
  /**
   * 自分が圏外か。★相手の状態を「考え中」と言わない★
   * 圏外だと相手の回答が届かないだけで、相手は普通に答えているかもしれない。
   * 「考え中…」と出すと嘘になるので「通信待ち」に切り替える。
   */
  offline?: boolean;
}

export function BattleLiveStage(p: BattleLiveStageProps) {
  const playing = !p.finished;
  const counting = p.preStartMs > 0;

  // ------------------------------------------------------------
  // 実況・演出
  // ------------------------------------------------------------
  const phase = counting ? 'normal' : phaseOf(p.index, p.total);
  const track = bgmTrackFor(
    { bgm: true },
    p.finished ? 'finished' : counting ? 'countdown' : 'playing',
    phase,
  );
  const listening = p.question.subject === 'english_listening';
  const quiet = listening && !counting && !p.reveal;
  // ★音源の対戦BGMがあるときは、カウントダウンの頭から対戦曲を鳴らす★
  //   曲頭から dropSec（=7秒）で本編に入るように作ってあるので、START! と同時にドロップする。
  //   合成音しか無いときは従来どおり、カウントダウン中は待合室の曲。
  const countdownTrack = counting && BGM_FILES.battle ? 'normal' : track;
  const startInMs = counting ? Math.max(0, p.preStartMs - COUNTDOWN_START_HOLD_MS) : undefined;
  // リスニングは問題の音声と重ならないよう、問題中は鳴らさない（従来どおり）。
  // カウントダウン中だけは待合室の曲を鳴らし続け、START! のあと問題が始まったら絞って止める。
  const { play: playSound, unlock } = useBattleAudio(listening ? (counting ? 'matching' : null) : countdownTrack, startInMs);
  const play = useCallback((sound: Parameters<typeof playSound>[0]) => {
    if (!quiet) playSound(sound);
  }, [playSound, quiet]);

  const live = useBattleLive({
    playing: playing && !counting,
    index: p.index,
    total: p.total,
    answered: p.answered,
    opponentAnswered: p.opponentAnswered,
    reveal: p.reveal,
    myScore: p.myScore,
    opponentScore: p.opponentScore,
    play,
  });

  // カウントダウンの数字と音
  const countLabel = counting ? countdownLabelAt(COUNTDOWN_TOTAL_MS - p.preStartMs) : null;
  const lastCountRef = useRef<string | null>(null);
  useEffect(() => {
    if (countLabel === lastCountRef.current) return;
    lastCountRef.current = countLabel;
    if (countLabel === 'START!') play('start');
    // 7 秒すべてで鳴らすとうるさいので、最後の 3・2・1 だけ
    else if (countLabel && Number(countLabel) <= 3) play('countdown');
  }, [countLabel, play]);

  // 見せてよい範囲の確定点（reveal 前のいまの問題は入れない）
  const upTo = p.reveal ? p.index : p.index - 1;
  const settled = (s: BattlePlayerScore | null) =>
    s ? s.perQuestion.filter((q) => q.index <= upTo).reduce((a, q) => a + q.total, 0) : 0;
  const mySettled = settled(p.myScore);
  const oppSettled = settled(p.opponentScore);
  const myCorrect = !!p.myScore?.perQuestion.find(q => q.index === p.index)?.correct;

  /**
   * ★残り3秒の刻み音★（自分がまだ答えていないときだけ）
   * 1秒ごとに小さく「コッ」。答えた後・締切後は鳴らさない（急かす理由が無い）。
   */
  const secondsLeft = Math.ceil(p.remainMs / 1000);
  const lastHurryRef = useRef<number>(-1);
  useEffect(() => {
    if (counting || p.answered || p.reveal || p.finished) return;
    if (secondsLeft > 3 || secondsLeft <= 0) return;
    if (lastHurryRef.current === secondsLeft) return;
    lastHurryRef.current = secondsLeft;
    play('hurry');
  }, [secondsLeft, counting, p.answered, p.reveal, p.finished, play]);
  // 答えないまま 0 秒になったら「時間切れ」を1回だけ
  const timeupRef = useRef<number>(-1);
  useEffect(() => {
    if (counting || p.answered || p.finished) return;
    if (secondsLeft > 0 || timeupRef.current === p.index) return;
    timeupRef.current = p.index;
    play('timeup');
  }, [secondsLeft, counting, p.answered, p.finished, p.index, play]);
  useEffect(() => {
    lastHurryRef.current = -1;
  }, [p.index]);

  const hint = useMemo(() => {
    if (counting || !p.reveal) return null;
    return gapMessage(mySettled, oppSettled, maxPointsPerQuestion(p.rules), p.total - p.index - 1);
  }, [counting, p.reveal, mySettled, oppSettled, p.rules, p.total, p.index]);

  // 選択肢を押した瞬間の小さな音（正誤の音ではない）
  const choose = (i: number) => {
    unlock();
    play('tap');
    p.onChoose(i);
  };
  const push = (i: number) => {
    unlock();
    play('tap');
    p.onPushPanel(i);
  };

  const theirAnswer = p.opponentScore?.perQuestion.find(q => q.index === p.index);
  const theirText = theirAnswer?.submittedAnswer || '';
  const selectedNumber = answerNumber(p.question, theirText);
  // Keep questions and options out of the DOM until the shared start time.
  if (counting) return <div className="battle-ready-stage">
    {p.notices}
    <CountdownOverlay label={countLabel} />
    <div className="battle-ready-footer">{p.footer}</div>
  </div>;
  return (
    <div className={`arena-live-stage ${phase === 'final' ? 'arena-final' : ''}`}>
      <div className="arena-background-fx" aria-hidden="true"><i/><i/><i/></div>
      <ArenaFighters roundKey={p.index} streak={live.myStreak} opponentCorrect={p.reveal && !!theirAnswer?.correct} offline={p.offline} answered={p.answered} opponentAnswered={p.opponentAnswered} reveal={p.reveal} correct={!!p.myScore?.perQuestion.find(q=>q.index===p.index)?.correct}/>

      <LiveScoreboard
        meNickname={p.meNickname}
        opponentNickname={p.opponentNickname}
        maskOpponent={p.maskOpponent}
        myScore={mySettled}
        opponentScore={oppSettled}
        myAnswered={p.answered}
        myStreak={live.myStreak}
        opponent={p.offline ? { ...live.opponent, activity: 'offline' } : live.opponent}
        lead={live.lead}
      />

      {!counting && phase === 'final' && <FinalBanner />}
      {!counting && phase === 'closing' && <ClosingBanner remain={p.total - p.index} />}
      <GapHint message={hint} />
      {/* ★相手が先に答えた★ 自分がまだのときだけ、急かしすぎない一言 */}
      {/* ★相手が先に答えた★ は問題の「1/10もん」と「4つからえらぶ」の間に出す（1行ぶん上に詰める・2026-10-01） */}
      <LiveFeed entries={live.feed} />
      {!counting && (p.answered || p.reveal) && p.opponentAnswered && <div className="arena-opponent-answer" role="status"><span>相手の確定回答 {selectedNumber}</span><BattleText text={theirText || '無回答'} subject={p.question.subject}/></div>}


      {p.notices}

      {/* ★最終問題は枠を少しだけ特別に★ 問題文・選択肢の中身は変えない */}
      <div className={`arena-question-area ${phase === 'final' && !counting ? 'battle-live-final-frame rounded-2xl' : ''}`}>
        <BattleQuestionView
          question={p.question}
          index={p.index}
          total={p.total}
          remainMs={counting ? resolveTimeLimit(p.question, p.rules) * 1000 : p.remainMs}
          limitSec={resolveTimeLimit(p.question, p.rules)}
          answered={p.answered}
          locked={(p.locked ?? false) || counting}
          myChoice={p.myChoice}
          myPanel={p.myPanel}
          reveal={p.reveal}
          onChoose={choose}
          onPushPanel={push}
          onPopPanel={p.onPopPanel}
          onCyclePanel={p.onCyclePanel}
          notice={!counting && p.opponentAnswered && !p.answered && !p.reveal
            ? <p className="battle-live-pop truncate text-xs font-black" style={{ color: '#C0392B' }} role="status">🔴 相手は回答ずみ！<span className="bq-notice-long"> 落ち着いて選ぼう</span></p>
            : undefined}
          onCommitKana={() => {
            unlock();
            p.onCommitKana();
          }}
        />
      </div>

      <div className="bl-footer">{p.footer}</div>

      {/* ★正解したら全画面の演出（2026-10-01）★ 逆転・追いついたも同じ演出の中に添える（別の札でかぶせない） */}
      {!counting && p.reveal && myCorrect && <CorrectBurst burstKey={`q${p.index}`} combo={live.myStreak}
        extra={live.toast && (live.toast.kind === 'overtake' || live.toast.kind === 'caught-up') ? live.toast.text : undefined} />}
      <LiveToast toast={p.reveal && myCorrect && live.toast && (live.toast.kind === 'overtake' || live.toast.kind === 'caught-up') ? null : live.toast} />
    </div>
  );
}

