/**
 * ===================================================================
 * 対戦の「試合後」：結果の申告・相互確認・レート反映（C-07: useBattleRoom.ts から分離）
 * ===================================================================
 *   1. 結果の申告（1人1回・上書き不可。届かなければ4秒後に送り直す）
 *   2. 両者の申告が揃ってからレートを反映（食い違えば無効試合。相手が離脱なら不戦勝として半分）
 *   3. 対戦履歴の保存（間違えた出題 ID を最大30件残し、「間違えた問題だけ再対戦」に使う）
 *
 *   本体（useEffect 2つとその依存配列）は useBattleRoom.ts にあったときと1文字も変えていない。
 *   AI 対戦はこのフックを使わない（レートを書き込まない。tests/ai-no-rating.test.ts）。
 */
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { attestResult, saveHistory } from '../data/battle';
import { applyRatingResult } from '../data/battleRanking';
import type { BattlePlayerScore, BattleResultSummary, BattleRoom } from '../core/types';
import { areAttestationsAgreed } from './battleRoomSelectors';

export function useBattlePostMatch({
  roomId, room, uid, result, scores, subject, opponentUid, opponent, byForfeit, explicitForfeit, questionIds, setError,
}: {
  roomId: string | null;
  room: BattleRoom | null;
  uid: string;
  result: BattleResultSummary | null;
  scores: { me: BattlePlayerScore; other: BattlePlayerScore } | null;
  subject: string | undefined;
  opponentUid: string | null | undefined;
  opponent: { rating?: number; nickname?: string } | null | undefined;
  byForfeit: boolean;
  explicitForfeit: boolean;
  questionIds: readonly string[] | undefined;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [rating, setRating] = useState<{ before: number; after: number } | null>(null);
  /** 二重実行を防ぐための記録（申告・レート反映） */
  const attestedRef = useRef(false);
  const ratedRef = useRef(false);

  // ------------------------------------------------------------
  // 結果の申告
  // ------------------------------------------------------------
  const myAttest = room?.attest?.[uid];
  const [attestRetry, setAttestRetry] = useState(0);
  useEffect(() => {
    if (!roomId || !result || !scores || attestedRef.current) return;
    // ★結果画面を再読み込みしたときに再申告しない★
    //   申告はルールで「1人1回・上書き不可」なので、2回目は必ず拒否される。
    //   以前はここで拒否エラーが未処理例外になっていた（独立検証で指摘）。
    //   既に自分の申告が部屋にあれば、それを結果として使う。
    if (myAttest) {
      attestedRef.current = true;
      return;
    }
    attestedRef.current = true;
    void attestResult(roomId, {
      myScore: scores.me.score,
      opponentScore: scores.other.score,
      outcome: result.outcome,
    }).catch((e: Error) => {
      // ★結果の申告が届かなかったら、通信が戻ったときにもう一度送る★
      //   ここで諦めると、レートも履歴も残らない試合になる。
      setError(`${e.message} 通信が戻ると自動で送り直します。`);
      window.setTimeout(() => { attestedRef.current = false; setAttestRetry((n) => n + 1); }, 4_000);
    });
  }, [roomId, result, scores, myAttest, attestRetry]);

  // ------------------------------------------------------------
  // レート反映（★相互確認が揃ってから★）
  // ------------------------------------------------------------
  const attest = room?.attest;
  useEffect(() => {
    if (!roomId || !result || !scores || !subject || ratedRef.current) return;

    const mine = attest?.[uid];
    const theirs = opponentUid ? attest?.[opponentUid] : undefined;

    // 相手が離脱した場合は相手の申告が来ないので、
    // 不戦勝として（変化量を半分にして）反映する。
    const forfeit = explicitForfeit || (byForfeit && !theirs);
    if (!mine) return;
    if (!theirs && !forfeit) return;

    // 申告が食い違ったら無効試合（レートを動かさない）
    if (theirs && !areAttestationsAgreed(mine, theirs)) {
      ratedRef.current = true;
      return;
    }

    ratedRef.current = true;
    const opponentRating = opponent?.rating ?? 1500;

    void applyRatingResult(roomId, opponentRating, result.outcome, forfeit, opponentUid).then((change) => {
      if (change) setRating(change);
      void saveHistory({
        roomId,
        subject,
        outcome: result.outcome,
        myScore: scores.me.score,
        opponentScore: scores.other.score,
        opponentNickname: opponent?.nickname || '対戦相手',
        ratingBefore: change?.before ?? 0,
        ratingAfter: change?.after ?? 0,
        // 履歴から「間違えた問題だけ再対戦」できるように、間違えた出題IDを残す（最大30）
        wrongIds: scores.me.perQuestion.filter((q) => !q.correct).map((q) => questionIds?.[q.index]).filter((id): id is string => typeof id === 'string').slice(0, 30),
      });
    });
  }, [roomId, result, scores, subject, attest, uid, opponentUid, opponent, byForfeit, explicitForfeit]);

  return { rating };
}
