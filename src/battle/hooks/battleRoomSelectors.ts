/**
 * ===================================================================
 * 対戦モード: 部屋の状態から導出する純関数ヘルパー
 * ===================================================================
 *
 * useBattleRoom.ts から「最初の退出者の特定」「不戦勝判定」「勝敗結果の決定」
 * 「相互申告（attest）の合意判定」「解答済み問題番号の抽出」を純関数として分離（#22）。
 * 挙動・判定条件は 1 ビットも変えていない。
 */

import {
  FORFEIT_STREAK,
  hasLeft,
  judgeBattle,
  trailingNoAnswerCount,
} from '../core/battleCore';
import type { ConnectionState } from '../core/connection';
import { toMillis } from '../core/serverClock';
import type {
  BattleAnswerSheet,
  BattleAttestation,
  BattlePlayerScore,
  BattleResultSummary,
  BattleRule,
} from '../core/types';
import { answerIndexOf } from '../core/types';

/**
 * 退出マップ（left）から、最初に退出したプレイヤーの uid を返す。
 * 誰も退出していなければ空文字 '' を返す。
 */
export function findFirstLeaver(
  players: readonly string[] | undefined,
  leftMap: Record<string, unknown> | undefined,
): string {
  const leavers = (players || []).filter((p) => hasLeft(leftMap, p));
  if (leavers.length === 0) return '';
  return [...leavers].sort(
    (a, b) => (toMillis(leftMap?.[a]) ?? 0) - (toMillis(leftMap?.[b]) ?? 0),
  )[0] as string;
}

/**
 * 解答シート（q0, q1, ...）から解答済みの問題インデックス配列を取り出す。
 */
export function extractAnsweredIndexes(sheet: BattleAnswerSheet): number[] {
  return Object.keys(sheet)
    .map((k) => answerIndexOf(k))
    .filter((n): n is number => n != null);
}

/**
 * 相手の離脱（不戦勝）かどうかを判定する。
 *
 *   ① 明示的な離脱（相手が「もどる」を押した）→ 即座に成立
 *   ② 推測（無回答が FORFEIT_STREAK 問以上連続）→ 自分がオンラインのときだけ成立
 */
export function evaluateByForfeit(params: {
  explicitForfeit: boolean;
  firstLeaver: string;
  uid: string;
  status: string | undefined;
  leftMap: Record<string, unknown> | undefined;
  opponentUid: string;
  connection: ConnectionState;
  opponentSheet: BattleAnswerSheet;
  currentIndex: number;
}): boolean {
  const {
    explicitForfeit,
    firstLeaver,
    uid,
    status,
    leftMap,
    opponentUid,
    connection,
    opponentSheet,
    currentIndex,
  } = params;

  if (explicitForfeit) return firstLeaver !== uid;
  if (status !== 'playing') return false;
  if (hasLeft(leftMap, opponentUid)) return true;
  if (connection === 'offline') return false;

  const answeredIndexes = extractAnsweredIndexes(opponentSheet);
  const trailing = trailingNoAnswerCount(answeredIndexes, currentIndex);
  return trailing >= FORFEIT_STREAK;
}

/**
 * 試合終了時の勝敗結果を計算する。
 * 明示的な退出（explicitForfeit）がある場合は得点に関係なく退出側を負けにする。
 */
export function computeBattleResult(params: {
  scores: { me: BattlePlayerScore; other: BattlePlayerScore } | null;
  finished: boolean;
  explicitForfeit: boolean;
  firstLeaver: string;
  uid: string;
  rules: BattleRule;
}): BattleResultSummary | null {
  const { scores, finished, explicitForfeit, firstLeaver, uid, rules } = params;
  if (!scores || !finished) return null;
  if (explicitForfeit) {
    return {
      me: scores.me,
      opponent: scores.other,
      outcome: firstLeaver === uid ? ('lose' as const) : ('win' as const),
      decidedByTime: false,
      needsSuddenDeath: false,
    };
  }
  return judgeBattle(scores.me, scores.other, rules);
}

/**
 * 両者の結果申告（attest）が互いに整合しているかを判定する。
 */
export function areAttestationsAgreed(
  mine: BattleAttestation,
  theirs: BattleAttestation,
): boolean {
  return (
    (mine.outcome === 'win' && theirs.outcome === 'lose') ||
    (mine.outcome === 'lose' && theirs.outcome === 'win') ||
    (mine.outcome === 'draw' && theirs.outcome === 'draw')
  );
}
