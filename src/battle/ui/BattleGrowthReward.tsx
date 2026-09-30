import { useEffect, useState } from 'react';
import type { BattleResultSummary } from '../core/types';
import { applyMatchGrowth } from '../data/growthStore';
import { BattleGrowthCard } from './BattleGrowthCard';
import { ShareButton } from './GrowthFx';
import { equippedTitleLabel, levelOf, shareTextForMatch, type GrowthDelta, type GrowthProgress } from '../core/growth';

export function BattleGrowthReward({ matchId, ownerUid, eligible, subject, subjectLabel, result, rating, onProfile, onMissions }: {
  matchId: string; ownerUid: string; eligible: boolean; subject: string; subjectLabel: string;
  result: BattleResultSummary; rating: { before: number; after: number } | null;
  onProfile?: () => void; onMissions?: () => void;
}) {
  const [reward, setReward] = useState<{ progress: GrowthProgress; delta: GrowthDelta | null } | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setReward(null); setFailed(false);
    if (!eligible) return;
    void applyMatchGrowth({ roomId: matchId, subject, outcome: result.outcome, score: result.me,
      answeredCount: result.me.perQuestion.length, buzz: false, forfeit: false, holesFilled: 0 }, ownerUid)
      .then(value => { if (active) { setReward(value); setFailed(!value); } });
    return () => { active = false; };
  }, [matchId, ownerUid, eligible, subject, result, retry]);
  if (!eligible) return null;
  if (failed) return <div role="alert" className="mb-3 rounded-xl border p-3 text-sm">
    成長記録を端末に保存できませんでした。対戦結果・レートには影響しません。
    <button type="button" className="mt-2 block min-h-11 underline" onClick={() => setRetry(n => n + 1)}>保存を再試行</button>
  </div>;
  if (!reward) return <p role="status" className="mb-3 text-xs text-gray-600">成長記録を保存しています…</p>;
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
