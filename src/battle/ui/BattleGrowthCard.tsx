/**
 * ===================================================================
 * BattleGrowthCard — リザルトに出す「この試合で得たもの」
 * ===================================================================
 *
 * エグゼクティブサマリの UX フロー
 *   問題解答 → 対戦結果表示 → 学習リコメンド → プロフィール成長
 * のうち「プロフィール成長」を結果画面の中で先に見せる部品。
 *
 * ★負けた試合でも必ず何かが増える★
 * 経験値は減らない設計なので、この枡は勝敗に関係なく増える数字だけが並ぶ。
 * レートの増減（赤くなりうる）の上に置き、
 * 「負けたけれど積み上がった」を先に読ませる。
 */

import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { ArrowUp, Award, Coins, Sparkles, Target, Unlock } from 'lucide-react';
import { itemById, levelOf, missionById, type GrowthDelta, type GrowthProgress } from '../core/growth';
import { AMBER, GOLD, INK, INK_SUB, LINE } from './BattleParts';
import { BadgeChip, GrowthAvatar, LevelBar, NextGoals } from './GrowthParts';
import { play } from './feedback';

function XpRow({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <li className="flex justify-between rounded-lg px-2 py-1" style={{ background: highlight ? `${GOLD}22` : '#FAF8F3' }}>
      <span>{label}</span>
      <span className="tabular-nums" style={{ color: highlight ? AMBER : INK }}>
        +{value}
      </span>
    </li>
  );
}

export function BattleGrowthCard({
  progress,
  delta,
  onOpenProfile,
  onOpenMissions,
}: {
  /** 反映後の記録 */
  progress: GrowthProgress;
  /** この試合で変わったこと（同じ試合を再表示したときは null） */
  delta: GrowthDelta | null;
  onOpenProfile?: () => void;
  onOpenMissions?: () => void;
}) {
  const leveledUp = delta ? delta.levelAfter > delta.levelBefore : false;
  // 音は勝敗の音（BattleResult）の後に：レベルアップ 1.2s、新称号 1.9s（バッジが順に現れる時刻に合わせる）
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (leveledUp) timers.push(setTimeout(() => play('levelup', false), 1200));
    if (delta && delta.newBadges.length > 0) timers.push(setTimeout(() => play('badge', false), 1900));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const completedMissions = delta?.missionUpdates.filter((m) => m.completed) ?? [];
  const info = levelOf(progress.xp);

  return (
    <section
      id="battle-result-growth"
      className={`battle-card-in mb-4 rounded-3xl border-2 p-4 ${leveledUp ? 'growth-levelup' : ''}`}
      style={
        {
          borderColor: leveledUp ? `${GOLD}AA` : LINE,
          background: leveledUp ? `${GOLD}12` : '#FFFFFF',
          '--card-delay': '0.06s',
        } as CSSProperties
      }
    >
      <h2 className="mb-3 flex items-center gap-1.5 text-xs font-black" style={{ color: INK_SUB }}>
        <Sparkles size={14} style={{ color: AMBER }} />
        この試合で ふえたもの
      </h2>

      <div className="flex items-center gap-3">
        <button type="button" onClick={onOpenProfile} className="shrink-0 transition active:scale-95" aria-label="プロフィールを開く">
          <GrowthAvatar progress={progress} size={64} celebrate={leveledUp} />
        </button>
        <div className="min-w-0 flex-1">
          {leveledUp && delta ? (
            <p className="growth-reveal mb-1 flex flex-wrap items-baseline gap-x-1.5 font-black" style={{ color: AMBER }}>
              <span className="inline-flex items-center gap-0.5 font-handwriting text-base">
                <ArrowUp size={15} />
                レベルアップ！
              </span>
              <span className="whitespace-nowrap text-sm tabular-nums">
                Lv.{delta.levelBefore}
                <span className="mx-1" style={{ color: INK_SUB }}>→</span>
                <span className="text-lg">Lv.{delta.levelAfter}</span>
              </span>
            </p>
          ) : (
            <p className="mb-1 text-xs font-bold" style={{ color: INK_SUB }}>
              Lv.{info.level} ／ 累計 {progress.xp.toLocaleString()} XP
              <span className="ml-2 inline-flex items-center gap-0.5 tabular-nums">
                <Coins size={10} style={{ color: AMBER }} /> {progress.coins}
              </span>
            </p>
          )}
          <LevelBar xp={progress.xp} gained={delta?.xp.total} leveledUp={leveledUp} compact />
        </div>
      </div>

      {/* 経験値の内訳（なぜその数になったか） */}
      {delta && (
        <ul className="mt-3 grid grid-cols-2 gap-1 text-xs font-bold" style={{ color: INK_SUB }}>
          <XpRow label="参加" value={delta.xp.participation} />
          <XpRow label="せいかい" value={delta.xp.correct} />
          {delta.xp.outcome > 0 && <XpRow label="勝利・引き分け" value={delta.xp.outcome} />}
          {delta.xp.streak > 0 && <XpRow label="3連続以上" value={delta.xp.streak} />}
          {delta.xp.perfect > 0 && <XpRow label="全問せいかい" value={delta.xp.perfect} highlight />}
        </ul>
      )}

      {/* 新しいバッジ */}
      {delta && delta.newBadges.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 flex items-center gap-1 text-xs font-black" style={{ color: AMBER }}>
            <Award size={12} />
            あたらしい称号
          </p>
          <div className="grid gap-1.5">
            {delta.newBadges.map((id, i) => (
              <BadgeChip key={id} id={id} delay={0.5 + i * 0.18} />
            ))}
          </div>
        </div>
      )}

      {/* 解放された装備 */}
      {delta && delta.unlocked.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-1 text-xs font-bold" style={{ color: INK_SUB }}>
          <Unlock size={12} style={{ color: AMBER }} />
          とびら君の装備が解放:
          {delta.unlocked.map((id) => {
            const item = itemById(id);
            return item ? (
              <span key={id} className="rounded-full px-1.5 py-0.5 font-black" style={{ background: `${GOLD}26`, color: INK }}>
                {item.label}
              </span>
            ) : null;
          })}
        </p>
      )}

      {/* ミッション */}
      {delta && delta.missionUpdates.length > 0 && (
        <div className="mt-3 rounded-2xl px-3 py-2" style={{ background: '#FAF8F3', border: `1px solid ${LINE}` }}>
          <p className="mb-1 flex items-center gap-1 text-xs font-black" style={{ color: INK_SUB }}>
            <Target size={12} />
            きょうのミッション
          </p>
          <ul className="grid gap-0.5 text-xs font-bold" style={{ color: INK }}>
            {delta.missionUpdates.map((u) => {
              const m = missionById(u.id);
              if (!m) return null;
              return (
                <li key={u.id} className="flex items-center justify-between gap-2">
                  <span>{m.label}</span>
                  <span className="tabular-nums" style={{ color: u.completed ? AMBER : INK_SUB }}>
                    {u.completed ? 'たっせい！' : `${u.after}/${m.goal}`}
                  </span>
                </li>
              );
            })}
          </ul>
          {completedMissions.length > 0 && onOpenMissions && (
            <button
              type="button"
              onClick={onOpenMissions}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 py-2 text-xs font-black transition active:translate-y-[1px]"
              style={{ background: GOLD, borderColor: '#E5B93C', color: INK }}
            >
              <Coins size={14} />
              報酬をうけとる（{completedMissions.length}件）
            </button>
          )}
        </div>
      )}

      {/* つぎの目標（この試合で何も無かった人にも、次の1試合の理由を置く） */}
      <div className="mt-3">
        <NextGoals progress={progress} max={2} compact />
      </div>
    </section>
  );
}
