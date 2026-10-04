import { useEffect, useState } from 'react';
import type { BattleResultSummary } from '../core/types';
import { applyMatchGrowth } from '../data/growthStore';
import { BattleGrowthCard } from './BattleGrowthCard';
import { ShareButton } from './GrowthFx';
import { equippedTitleLabel, levelOf, shareTextForMatch, type GrowthDelta, type GrowthProgress } from '../core/growth';

/** 試合ID → 最初に受け取った報酬（画面を開き直しても「＋◯コイン」を出し続ける。端末内のメモリだけ） */
const firstDelta = new Map<string, GrowthDelta>();

export type GrowthReward = { progress: GrowthProgress; delta: GrowthDelta | null };

/**
 * compact … 勝敗画面（1画面）用。獲得コイン・XP・レベルアップを1行だけ出す。
 *            詳しいカード（ミッション・称号・共有）は「詳しい結果」ページで onLoaded の値から出す。
 */
export function BattleGrowthReward({ matchId, ownerUid, eligible, subject, subjectLabel, result, rating, onProfile, onMissions, compact = false, onLoaded }: {
  matchId: string; ownerUid: string; eligible: boolean; subject: string; subjectLabel: string;
  result: BattleResultSummary; rating: { before: number; after: number } | null;
  onProfile?: () => void; onMissions?: () => void;
  compact?: boolean; onLoaded?: (reward: GrowthReward) => void;
}) {
  const [reward, setReward] = useState<{ progress: GrowthProgress; delta: GrowthDelta | null } | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setReward(null); setFailed(false);
    if (!eligible) return;
    void applyMatchGrowth({ roomId: matchId, subject, outcome: result.outcome, score: result.me,
      answeredCount: result.me.perQuestion.length, buzz: false, forfeit: false, holesFilled: 0,
      marginCorrect: result.opponent ? Math.abs(result.me.correctCount - result.opponent.correctCount) : undefined }, ownerUid)
      .then(value => {
        // 同じ試合を2回読んだとき（開発時の StrictMode・再描画）は2回目が「受取済み（delta なし）」になる。
        // 最初に受け取った分（delta あり）を消さないよう、同じ試合の delta はキャッシュから戻す。
        const kept = value && !value.delta ? firstDelta.get(matchId) : undefined;
        const shown = kept ? { ...value!, delta: kept } : value;
        if (value?.delta) firstDelta.set(matchId, value.delta);
        if (active) { setReward(shown); setFailed(!shown); if (shown) onLoaded?.(shown); }
      });
    return () => { active = false; };
  }, [matchId, ownerUid, eligible, subject, result, retry]);
  if (!eligible) return null;
  if (failed) return <div role="alert" className="mb-3 rounded-xl border p-3 text-sm">
    成長記録を端末に保存できませんでした。対戦結果・レートには影響しません。
    <button type="button" className="mt-2 block min-h-11 underline" onClick={() => setRetry(n => n + 1)}>保存を再試行</button>
  </div>;
  if (!reward) return <p role="status" className="mb-3 text-xs text-gray-600">成長記録を保存しています…</p>;
  if (compact) {
    const d = reward.delta;
    const up = d ? d.levelAfter > d.levelBefore : false;
    return <p className="result-reward-line" role="status" aria-label="今回の獲得報酬" data-reward-compact>
      {d ? <><b>＋{d.coins?.total ?? 0}</b><span>マナコイン</span><b>＋{d.xp.total}</b><span>XP</span>{up && <em>Lv.{d.levelAfter}にアップ！</em>}</>
        : <span>受取済みの対戦（所持 {reward.progress.coins} マナコイン）</span>}
    </p>;
  }
  return <>
    <section className="arena-reward" aria-label="今回の獲得報酬" role="status">
      <span>{reward.delta ? 'BATTLE REWARDS' : '受取済みの対戦'}</span>
      <h2>{reward.delta ? `＋${reward.delta.coins?.total ?? 0} マナコイン` : `所持 ${reward.progress.coins} マナコイン`}</h2>
      {reward.delta && <><p>完走 +{reward.delta.coins?.finish ?? 0} ／ 正解 +{reward.delta.coins?.correct ?? 0} ／ 勝利 +{reward.delta.coins?.victory ?? 0}</p>
        <strong>＋{reward.delta.xp.total} XP</strong><p>残高 {reward.progress.coins - (reward.delta.coins?.total ?? 0)} → {reward.progress.coins} 枚</p></>}
      <small>50枚で装飾ガチャ1回。ホームと同じおさいふです。</small>
    </section>
    <p className="mb-2 text-xs text-gray-600">このブラウザ・アカウントだけの成長記録です。端末間同期・公開はありません。</p>
    <BattleGrowthCard progress={reward.progress} delta={reward.delta} onOpenProfile={onProfile} onOpenMissions={onMissions} />
    <ShareButton text={shareTextForMatch({ outcome: result.outcome, subjectLabel,
      myScore: result.me.score, theirScore: result.opponent?.score || 0, rating,
      level: levelOf(reward.progress.xp).level, title: equippedTitleLabel(reward.progress) || '' })} />
  </>;
}
