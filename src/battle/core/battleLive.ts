/**
 * ===================================================================
 * battleLive — 対戦の「臨場感」を作る純粋関数（依存ゼロ）
 * ===================================================================
 *
 * ★このファイルは Firebase / React / DOM を一切 import しない。★
 *
 * ■ 何をするファイルか
 * 対戦の仕組み（出題・採点・進行・同期）は既存の battleCore / useBattleRoom
 * が持っている。ここでは ★その結果を「実況」に変換する★ だけを担う。
 *   ・相手はいま何問目を解いていて、答えたか／正解したか
 *   ・どちらがリードしていて、順位が入れ替わったか
 *   ・「あと3問」「最終問題」といった試合の局面（フェーズ）
 *   ・実況ログの1行（「相手が第3問を正解！」）
 *
 * ★新しいデータを Firestore に書かない★
 * 相手の「回答済み・正解・不正解・現在の問題番号・スコア・コンボ」は
 * すべて既存の部屋ドキュメント（answers.{uid}.q{n} と currentIndex）から
 * 導ける。両端末が同じ純粋関数（scoreBattlePlayer）で採点しているので、
 * その出力（BattlePlayerScore.perQuestion）を読むだけで足りる。追加の書き込みは0回。
 *
 * ★相手の選択肢そのものは絶対に出さない★
 * ここが受け取るのは採点結果（correct: true/false）だけで、
 * 「相手が何番を押したか（choice）」は引数に取らない。型の段階で漏れない。
 *
 * ★正解／不正解を見せるタイミング★
 * 相手が答えた事実は即座に出してよい（既存の「解答済み」表示と同じ）。
 * ★正解したかどうか★は、自分が答える前には出さない。
 * 出すと「相手が正解した＝この選択肢が正しい」の推測に使われうる（2択なら確定する）。
 * 既存の reveal（両者解答済み or 締切）と同じ条件でだけ出す。
 */

import type { BattlePlayerScore } from './types';

// ============================================================
// 局面（フェーズ）
// ============================================================

/**
 *   normal  … 通常
 *   closing … 残り3問以内。少し緊張感を上げる
 *   final   … 最終問題。「FINAL QUESTION」を出し BGM を切り替える
 */
export type BattlePhase = 'normal' | 'closing' | 'final';

/** この残り問題数以下で closing（いまの問題を含めて数える） */
export const CLOSING_REMAIN = 3;

export function phaseOf(index: number, total: number): BattlePhase {
  if (total <= 0 || index < 0) return 'normal';
  const remain = total - index;
  if (remain <= 1) return 'final';
  if (remain <= CLOSING_REMAIN) return 'closing';
  return 'normal';
}

// ============================================================
// リード・逆転
// ============================================================

export type Lead = 'me' | 'opponent' | 'tie';

export function leadOf(myScore: number, opponentScore: number): Lead {
  if (myScore > opponentScore) return 'me';
  if (myScore < opponentScore) return 'opponent';
  return 'tie';
}

/**
 *   'overtake'  … 自分が相手を抜いた（逆転！）
 *   'overtaken' … 相手に抜かれた
 *   'caught-up' … 追いついた（負けていた側が同点に）
 *   'caught'    … 追いつかれた（勝っていた側が同点に）
 *   null        … 変化なし
 *
 * ★同点への変化を逆転と分ける理由★
 * 「追いついた！」は追う側には大きな出来事だが逆転ではない。
 * 同じ扱いにすると「逆転！」と出て実態と合わない。
 */
export type LeadChange = 'overtake' | 'overtaken' | 'caught-up' | 'caught' | null;

export function leadChangeOf(before: Lead, after: Lead): LeadChange {
  if (before === after) return null;
  if (after === 'me') return 'overtake';
  if (after === 'opponent') return 'overtaken';
  return before === 'opponent' ? 'caught-up' : 'caught';
}

/**
 * 点差からプレイヤーへの一言（モチベーションを下げない表現）。
 * リードされている側にだけ出す。1問で返せる差は黙っておく（すぐ入れ替わるので騒がない）。
 *
 * @param maxPerQuestion 1問で取れる最大点
 * @param remainQuestions まだ解ける問題の数（いまの問題を含む）
 */
export function gapMessage(
  myScore: number,
  opponentScore: number,
  maxPerQuestion: number,
  remainQuestions: number,
): string | null {
  const gap = opponentScore - myScore;
  if (gap <= 0 || remainQuestions <= 0) return null;
  if (gap <= maxPerQuestion) return null;
  if (gap <= maxPerQuestion * remainQuestions) return 'まだ逆転できる！';
  return '最後まで全力で！';
}

/** 1問で取れる最大点（基礎＋速さ満点＋連続ボーナス上限） */
export function maxPointsPerQuestion(rules: {
  pointsCorrect: number;
  pointsSpeedMax: number;
  pointsStreak: number;
}, streakCap = 8, streakThreshold = 3): number {
  const streakMax = rules.pointsStreak * Math.max(0, streakCap - streakThreshold + 1);
  return rules.pointsCorrect + rules.pointsSpeedMax + streakMax;
}

// ============================================================
// 相手の状態
// ============================================================

/**
 *   thinking … 問題を読んでいる（まだ答えていない）
 *   answered … 答えた（正誤はまだ見せられない）
 *   correct  … 正解した（見せてよい状態）
 *   wrong    … 不正解だった（見せてよい状態）
 */
/** 'offline' は自分が圏外のとき画面側が上書きする（相手の状態が届いていないだけ） */
export type OpponentActivity = 'thinking' | 'answered' | 'correct' | 'wrong' | 'offline';

export interface OpponentStatus {
  activity: OpponentActivity;
  index: number;
  /** 見せてよい範囲での連続正解数 */
  streak: number;
  label: string;
}

/** 回答時間の表示（1.2秒 / 12秒） */
export function fmtSec(sec: number | undefined): string {
  const v = Math.max(0, Number(sec) || 0);
  return v < 10 ? `${(Math.round(v * 10) / 10).toFixed(1)}秒` : `${Math.round(v)}秒`;
}

export function opponentStatusOf(
  index: number,
  answered: boolean,
  reveal: boolean,
  opponentScore: BattlePlayerScore | null,
): OpponentStatus {
  const n = index + 1;
  const streak = streakThrough(opponentScore, reveal ? index : index - 1);
  if (!answered) return { activity: 'thinking', index, streak, label: `第${n}問を考え中…` };
  if (!reveal) return { activity: 'answered', index, streak, label: `第${n}問に回答！` };
  const q = opponentScore?.perQuestion.find((s) => s.index === index);
  const t = q && answered ? ` ${fmtSec(q.timeUsed)}` : '';
  if (q?.correct) return { activity: 'correct', index, streak, label: `第${n}問 正解！${t}` };
  return { activity: 'wrong', index, streak, label: `第${n}問 ミス${t}` };
}

/**
 * upTo 問目までの末尾の連続正解数。
 * 採点されていない（perQuestion に無い）問題で数えるのを止める。
 */
export function streakThrough(score: BattlePlayerScore | null, upTo: number): number {
  if (!score || upTo < 0) return 0;
  const byIndex = new Map(score.perQuestion.map((s) => [s.index, s]));
  let n = 0;
  for (let i = upTo; i >= 0; i -= 1) {
    const s = byIndex.get(i);
    if (!s || !s.correct) break;
    n += 1;
  }
  return n;
}

// ============================================================
// 実況ログ
// ============================================================

export type FeedKind =
  | 'answered'
  | 'correct'
  | 'wrong'
  | 'streak'
  | 'advance'
  | 'overtake'
  | 'overtaken'
  | 'caught-up'
  | 'caught'
  | 'final'
  | 'closing';

export interface FeedEntry {
  id: string;
  who: 'me' | 'opponent' | 'system';
  kind: FeedKind;
  text: string;
  /** 作られた時刻（ミリ秒）。一定時間後に消す */
  at: number;
}

/** 画面に残す行数（多いと問題文の邪魔になる） */
export const FEED_MAX_VISIBLE = 3;
/** 1行を何ミリ秒で消すか */
export const FEED_TTL_MS = 3200;

/** 前回までの様子（useRef に入れて持ち回る） */
export interface FeedSnapshot {
  index: number;
  myAnswered: boolean;
  opponentAnswered: boolean;
  revealed: boolean;
  lead: Lead;
  phase: BattlePhase;
}

export function initialFeedSnapshot(): FeedSnapshot {
  return { index: -1, myAnswered: false, opponentAnswered: false, revealed: false, lead: 'tie', phase: 'normal' };
}

export interface FeedInput {
  index: number;
  total: number;
  myAnswered: boolean;
  opponentAnswered: boolean;
  /** 正誤を見せてよい状態か（両者解答済み or 締切） */
  reveal: boolean;
  myScore: BattlePlayerScore | null;
  opponentScore: BattlePlayerScore | null;
  now: number;
}

/**
 * 前回といまを比べ、新しく起きた出来事だけを実況にする（差分）。
 * 呼び出し側は entries を既存ログに足し、snapshot を次回の比較用に保存する。
 */
export function diffFeed(
  prev: FeedSnapshot,
  cur: FeedInput,
): { entries: FeedEntry[]; snapshot: FeedSnapshot } {
  const entries: FeedEntry[] = [];
  const n = cur.index + 1;
  const mk = (who: FeedEntry['who'], kind: FeedKind, text: string): FeedEntry => ({
    id: `${cur.now}-${cur.index}-${who}-${kind}-${entries.length}`,
    who,
    kind,
    text,
    at: cur.now,
  });

  const sameQuestion = prev.index === cur.index;
  const phase = phaseOf(cur.index, cur.total);

  // ① 問題が進んだ
  if (!sameQuestion && prev.index >= 0 && cur.index > prev.index) {
    entries.push(mk('system', 'advance', `第${n}問へ！`));
  }

  // ② 局面が変わった
  if (phase === 'final' && prev.phase !== 'final') {
    entries.push(mk('system', 'final', 'FINAL QUESTION！'));
  } else if (phase === 'closing' && prev.phase === 'normal') {
    entries.push(mk('system', 'closing', `のこり${cur.total - cur.index}問！`));
  }

  // ③ 相手が答えた（正誤はまだ言わない）
  const prevOppAnswered = sameQuestion ? prev.opponentAnswered : false;
  if (cur.opponentAnswered && !prevOppAnswered && !cur.reveal) {
    entries.push(mk('opponent', 'answered', `相手が第${n}問に回答！`));
  }

  // ④ 正誤を見せてよくなった瞬間：両者の結果・連続正解・順位の変化
  const prevRevealed = sameQuestion ? prev.revealed : false;
  let lead = prev.lead;
  if (cur.reveal && !prevRevealed) {
    const mine = cur.myScore?.perQuestion.find((s) => s.index === cur.index);
    const theirs = cur.opponentScore?.perQuestion.find((s) => s.index === cur.index);

    // 2026-10-04：自分と相手の回答時間も添える（何秒で答えたか）
    const myT = mine && cur.myAnswered ? `（${fmtSec(mine.timeUsed)}）` : '';
    const opT = theirs && cur.opponentAnswered ? `（${fmtSec(theirs.timeUsed)}）` : '';
    if (mine?.correct) {
      const streak = streakThrough(cur.myScore, cur.index);
      entries.push(streak >= 3 ? mk('me', 'streak', `あなたが${streak}連続正解！${myT}`) : mk('me', 'correct', `あなたが第${n}問を正解！${myT}`));
    } else if (cur.myAnswered) {
      entries.push(mk('me', 'wrong', `あなたは第${n}問をミス${myT}`));
    }

    if (theirs?.correct) {
      const streak = streakThrough(cur.opponentScore, cur.index);
      entries.push(streak >= 3 ? mk('opponent', 'streak', `相手が${streak}連続正解！${opT}`) : mk('opponent', 'correct', `相手が第${n}問を正解！${opT}`));
    } else if (cur.opponentAnswered) {
      entries.push(mk('opponent', 'wrong', `相手は第${n}問をミス${opT}`));
    }

    lead = leadOf(cur.myScore?.score ?? 0, cur.opponentScore?.score ?? 0);
    const change = leadChangeOf(prev.lead, lead);
    /**
     * ★同点からの先行は「逆転」と言わない★
     * 0-0 から相手が先に取ったのを「相手が逆転」と言うと実態と合わない。
     * 「逆転」は、負けていた側が勝っている側を抜いたときだけ。
     */
    const fromTie = prev.lead === 'tie';
    if (change === 'overtake') entries.push(mk('system', 'overtake', fromTie ? 'あなたが先行！' : '逆転！あなたがリード！'));
    if (change === 'overtaken') entries.push(mk('system', 'overtaken', fromTie ? '相手が先行…' : '相手が逆転…！'));
    if (change === 'caught-up') entries.push(mk('system', 'caught-up', 'あなたが追いついた！'));
    if (change === 'caught') entries.push(mk('system', 'caught', '追いつかれた！'));
  }

  return {
    entries,
    snapshot: {
      index: cur.index,
      myAnswered: cur.myAnswered,
      opponentAnswered: cur.opponentAnswered,
      revealed: cur.reveal,
      lead,
      phase,
    },
  };
}

/** 期限切れを落とし、新しい順に FEED_MAX_VISIBLE 件だけ残す */
export function pruneFeed(entries: readonly FeedEntry[], now: number): FeedEntry[] {
  const alive = entries.filter((e) => now - e.at < FEED_TTL_MS);
  return alive.slice(-FEED_MAX_VISIBLE);
}

// ============================================================
// スコアの滑らかな増加
// ============================================================

/**
 * 表示中の点数を目標に向けて進める（ease-out cubic）。
 * requestAnimationFrame の中で「開始値・目標・経過時間」から次の表示値を出す。
 */
export function tweenScore(from: number, to: number, elapsed: number, duration: number): number {
  if (duration <= 0 || elapsed >= duration) return to;
  if (elapsed <= 0) return from;
  const t = elapsed / duration;
  const eased = 1 - Math.pow(1 - t, 3);
  return Math.round(from + (to - from) * eased);
}

export const SCORE_TWEEN_MS = 650;

/** 3桁区切り（1,240） */
export function formatScore(n: number): string {
  return Math.round(n).toLocaleString('ja-JP');
}

// ============================================================
// カウントダウン（7 → 6 → … → 1 → START!）
// ============================================================

/** 1カウントの長さ */
export const COUNTDOWN_STEP_MS = 1000;
export const COUNTDOWN_SECONDS = 7;
/** START! を見せる長さ */
export const COUNTDOWN_START_HOLD_MS = 600;
/** カウントダウン全体（7秒 ＋ START!） */
export const COUNTDOWN_TOTAL_MS = COUNTDOWN_STEP_MS * COUNTDOWN_SECONDS + COUNTDOWN_START_HOLD_MS;

/**
 * 1問目の締切（開始の書き込みから何秒後か）の上限。
 *
 * ★なぜ上限が要るのか（2026-09-23 に実際に起きた不具合）★
 * firestore.rules の battleDeadlineSane() は
 *   deadlineAt < request.time + 60秒
 * でないと開始・進行の書き込みを拒否する。
 * 1問目の締切は「制限時間 ＋ カウントダウン 7.6秒」＋通信猶予 0.7秒 なので、
 * リスニング（制限時間 55秒）は 55 + 7.6 + 0.7 = 63.3秒 になり、
 * ★オンライン対戦が毎回開始できなかった★（AI対戦は書き込みが無いので動いていた）。
 * 他教科でも1問目が上限 55秒 の問題だと同じく失敗していた。
 *
 * ルールを変えると本番への反映作業が要るので、アプリ側で
 * 「60秒 − 通信猶予 0.7秒 − 時計ずれの余裕 1.5秒」= 57.8秒 に収める。
 * 足りない分はカウントダウンが短くなるだけ（例：55秒の問題は「2」から始まる）。
 * 制限時間（解答できる時間）そのものは削らない。
 */
export const FIRST_DEADLINE_MAX_SEC = 60 - 0.7 - 1.5;

/** 1問目の締切（秒）。制限時間は必ず確保し、カウントダウンを上限内に収める。 */
export function firstDeadlineSec(timeLimitSec: number): number {
  return Math.max(timeLimitSec, Math.min(timeLimitSec + COUNTDOWN_TOTAL_MS / 1000, FIRST_DEADLINE_MAX_SEC));
}

/**
 * 開始からの経過ミリ秒 → 表示する文字。終わったら null。
 * 7秒の準備時間のあとに START! を表示する。
 */
export function countdownLabelAt(elapsedMs: number): string | null {
  if (elapsedMs < 0) return String(COUNTDOWN_SECONDS);
  if (elapsedMs >= COUNTDOWN_TOTAL_MS) return null;
  const step = Math.floor(elapsedMs / COUNTDOWN_STEP_MS);
  if (step >= COUNTDOWN_SECONDS) return 'START!';
  return String(COUNTDOWN_SECONDS - step);
}
