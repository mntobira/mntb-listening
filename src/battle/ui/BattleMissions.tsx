/**
 * ===================================================================
 * BattleMissions — きょうのミッション
 * ===================================================================
 *
 * ★毎日3つ。日付だけで決まるので全員同じ★（core/growth.ts の missionsForDate）
 * 対戦系2つ＋学習（穴を埋める）系1つ。対戦に勝てない日でも、
 * 学習すれば報酬が受け取れる。
 *
 * ★報酬は「うけとる」を押して初めて入る★
 * 自動で入れると、何が増えたか気づかないまま終わる。
 * 押す行為そのものが小さな達成感になる（みんはやのデイリーと同じ）。
 *
 * ★入れ替わりまでの時間を出す★
 * 「あと3時間で消える」が見えると、今日中にやる理由になる。
 * 1分ごとにしか更新しない（毎秒描き直す価値は無い）。
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, CalendarCheck, Clock, Coins, Gift, PartyPopper, Sparkles, Zap } from 'lucide-react';
import { allMissionsClaimed, allMissionsForDate, chestOpenedToday, completeChestFor, currentCompleteStreak, localDateKey, missionsForDate, msUntilNextDay, rolloverDaily, type CompleteChest, type GrowthProgress } from '../core/growth';
import { claimMissionReward, loadMyGrowth, openChest, subscribeGrowth } from '../data/growthStore';
import { play, primeAudio } from './feedback';
import { AMBER, BattleButton, BattleLoading, BattleNotice, BattleShell, BattleTitle, GOLD, INK, INK_SUB, LINE } from './BattleParts';
import { GrowthAvatar, LevelBar, MissionRow } from './GrowthParts';

function remainLabel(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}時間${m}分`;
  return `${m}分`;
}

export function BattleMissions({ onBack, onBattle, onReview, onShop, onRush, standalone = false, extra }: { onBack: () => void; onBattle?: () => void; onReview?: () => void; onShop?: () => void; onRush?: () => void; standalone?: boolean; key?: string; /** ミッションの下に足す内容（マイページから開いたとき「レベルで手に入るもの」） */ extra?: React.ReactNode }) {
  const [progress, setProgress] = useState<GrowthProgress | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [justClaimed, setJustClaimed] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [chestReward, setChestReward] = useState<CompleteChest | null>(null);
  const [remain, setRemain] = useState(() => msUntilNextDay());
  const today = localDateKey();

  useEffect(() => {
    let alive = true;
    void loadMyGrowth().then((p) => alive && setProgress(p));
    const off = subscribeGrowth((p) => alive && setProgress(p));
    const tick = window.setInterval(() => setRemain(msUntilNextDay()), 60_000);
    return () => {
      alive = false;
      off();
      window.clearInterval(tick);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const claim = async (id: string) => {
    primeAudio();
    play('tap');
    setClaiming(id);
    const r = await claimMissionReward(id);
    setClaiming(null);
    if (r?.reward) {
      play('coin');
      setTimeout(() => play('levelup', false), 380);
      setJustClaimed(id);
      setToast(`+${r.reward.xp} XP ／ +${r.reward.coins} コイン をうけとりました`);

    } else if (r === null) {
      setToast('端末に保存できませんでした。ブラウザの保存設定・空き容量を確認してください。');
    }
  };

  const open = async () => {
    primeAudio();
    play('tap');
    setOpening(true);
    const r = await openChest();
    setOpening(false);
    if (r?.reward) {
      play(r.reward.jackpot ? 'jackpot' : 'chest');
      setChestReward(r.reward);
      setToast(`${r.reward.jackpot ? '大当たり！ ' : ''}宝箱から +${r.reward.xp} XP ／ +${r.reward.coins} コイン`);
    } else if (r === null) {
      setToast('端末に保存できませんでした。ブラウザの保存設定・空き容量を確認してください。');
    }
  };

  if (!progress) {
    return (
      <BattleShell>
        {standalone ? <h1 className="mb-4 text-center font-handwriting text-2xl font-black">きょうのミッション</h1> : <BattleTitle subtitle="きょうのミッション" />}
      <p className="mb-3 text-xs text-gray-600">この端末だけの成長記録です。AI対戦でも進みます。復習ミッションは「復習リスト」で「できた」にした問題を1問1日1回数えます。</p>
        <BattleLoading message="ミッションを読みこんでいます…" />
      </BattleShell>
    );
  }

  // 日付が変わっていれば表示上は空で始める（書き込みは次の試合・ログイン時）
  const daily = rolloverDaily(progress.daily, today);
  const battleMissions = missionsForDate(today);
  const missions = allMissionsForDate(today);
  const bonusMissions = missions.slice(battleMissions.length);
  const done = missions.filter((m) => (daily.progress[m.id] ?? 0) >= m.goal);
  const claimable = done.filter((m) => !daily.claimed.includes(m.id)).length;
  // daily.claimed には宝箱ID（COMPLETE_CHEST_ID）も入るので、件数ではなくミッションIDで数える
  const allClaimed = missions.every((m) => daily.claimed.includes(m.id));
  const view: GrowthProgress = { ...progress, daily };
  const chestReady = allMissionsClaimed(view, today) && !chestOpenedToday(view, today);
  const chestDone = chestOpenedToday(view, today);
  const streakNow = currentCompleteStreak(progress, today);
  // 今日開けたら何日目になるか（開けた後は今日の連続日数そのもの）
  const chestDay = chestDone ? streakNow : streakNow + 1;
  const preview = completeChestFor(Math.max(1, chestDay));
  const cycleDay = ((Math.max(1, chestDay) - 1) % 7) + 1;
  const totalXp = missions.reduce((a, m) => a + m.rewardXp, 0);
  const totalCoins = missions.reduce((a, m) => a + m.rewardCoins, 0);

  return (
    <BattleShell
      footer={
        <div className="grid gap-2.5">
          {onRush && !allClaimed && (
            <BattleButton onClick={onRush} icon={<Zap size={18} />}>
              マナラッシュでミッションを進める
            </BattleButton>
          )}
          {onBattle && !allClaimed && (
            <BattleButton onClick={onBattle} icon={<Sparkles size={18} />}>
              対戦してミッションを進める
            </BattleButton>
          )}
          {onReview && <BattleButton variant="ghost" onClick={onReview}>復習でミッションを進める</BattleButton>}
          {onShop && <BattleButton variant="ghost" onClick={onShop}>マナコインをショップで使う</BattleButton>}
          <BattleButton variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
            もどる
          </BattleButton>
        </div>
      }
    >
      {standalone ? <h1 className="mb-4 text-center font-handwriting text-2xl font-black">きょうのミッション</h1> : <BattleTitle subtitle="きょうのミッション" />}
      <p className="mb-3 text-xs text-gray-600">この端末だけの成長記録です。AI対戦でも進みます。復習ミッションは「復習リスト」で「できた」にした問題を1問1日1回数えます。</p>

      {toast && (
        <div className="mb-3">
          <BattleNotice message={toast} tone="info" />
        </div>
      )}

      {/* 今日の状態 */}
      <section
        id="battle-missions-summary"
        className="battle-card-in mb-4 rounded-3xl border-2 p-4"
        style={{ borderColor: claimable > 0 ? `${GOLD}AA` : LINE, background: claimable > 0 ? `${GOLD}12` : '#FFFFFF' }}
      >
        <div className="flex items-center gap-3">
          <GrowthAvatar progress={progress} size={56} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-xs font-black" style={{ color: INK_SUB }}>
              <CalendarCheck size={12} />
              {today.replace(/-/g, '/')}
              <span className="ml-auto inline-flex items-center gap-1 tabular-nums">
                <Clock size={11} /> 入れかわりまで {remainLabel(remain)}
              </span>
            </p>
            <p className="mt-0.5 text-sm font-black" style={{ color: INK }}>
              {allClaimed ? (
                <span className="inline-flex items-center gap-1" style={{ color: AMBER }}>
                  <PartyPopper size={15} /> きょうは全部うけとりました
                </span>
              ) : claimable > 0 ? (
                <span style={{ color: AMBER }}>うけとれる報酬が {claimable}件</span>
              ) : (
                `${done.length}/${missions.length} たっせい`
              )}
            </p>
            <div className="mt-1.5">
              <LevelBar xp={progress.xp} compact />
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-2xl px-3 py-2 text-xs font-bold" style={{ background: '#FAF8F3', border: `1px solid ${LINE}`, color: INK_SUB }}>
          <span>きょう全部やると</span>
          <span className="flex items-center gap-2 tabular-nums" style={{ color: INK }}>
            <span className="inline-flex items-center gap-0.5"><Sparkles size={11} style={{ color: AMBER }} /> +{totalXp} XP</span>
            <span className="inline-flex items-center gap-0.5"><Coins size={11} style={{ color: AMBER }} /> +{totalCoins}</span>
          </span>
          <span data-coin-target>もってる <span className="tabular-nums font-black" style={{ color: AMBER }}>{progress.coins}</span> コイン</span>
        </div>
      </section>

      <h2 className="mb-2 text-xs font-black" style={{ color: INK_SUB }}>対戦ミッション</h2>
      <div className="grid gap-2.5">
        {battleMissions.map((m) => (
          <MissionRow
            key={m.id}
            id={m.id}
            progress={daily.progress[m.id] ?? 0}
            claimed={daily.claimed.includes(m.id)}
            claiming={claiming === m.id}
            justClaimed={justClaimed === m.id}
            onClaim={() => void claim(m.id)}
          />
        ))}
      </div>

      <h2 className="mb-2 mt-4 text-xs font-black" style={{ color: INK_SUB }}>ボーナスミッション（演習・英単語・マナラッシュ・おたのしみ）</h2>
      <div className="grid gap-2.5" data-bonus-missions>
        {bonusMissions.map((m) => (
          <MissionRow
            key={m.id}
            id={m.id}
            progress={daily.progress[m.id] ?? 0}
            claimed={daily.claimed.includes(m.id)}
            claiming={claiming === m.id}
            justClaimed={justClaimed === m.id}
            onClaim={() => void claim(m.id)}
          />
        ))}
      </div>

      {/* デイリーコンプリート宝箱：今日のミッションを全部うけとると開く。7日連続で大当たり */}
      <section
        id="battle-missions-chest"
        className="battle-card-in mt-4 rounded-3xl border-2 p-4"
        style={{
          borderColor: chestReady ? GOLD : LINE,
          background: chestReady ? `linear-gradient(135deg, ${GOLD}22, ${AMBER}18)` : '#FFFFFF',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${chestReady ? 'animate-bounce' : ''}`}
            style={{ background: chestDone ? '#EEF1F3' : `${GOLD}40`, color: chestDone ? INK_SUB : AMBER }}
          >
            <Gift size={26} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black" style={{ color: INK }}>
              コンプリート宝箱
              {preview.jackpot && !chestDone && <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-xs" style={{ background: AMBER, color: '#FFFFFF' }}>大当たりの日</span>}
            </p>
            <p className="mt-0.5 text-xs font-bold" style={{ color: INK_SUB }}>
              {chestDone
                ? `きょうは開けました（${streakNow}日連続）。また明日！`
                : chestReady
                  ? 'ミッション全部クリア！ 宝箱を開けよう'
                  : 'ミッションを全部うけとると開けられます'}
            </p>
          </div>
        </div>
        {/* 7日すごろく：7日目が大当たり */}
        <div className="mt-3 grid grid-cols-7 gap-1" aria-label={`連続コンプリート ${cycleDay}日目`}>
          {Array.from({ length: 7 }, (_, i) => {
            const d = i + 1;
            const filled = chestDone ? d <= cycleDay : d < cycleDay;
            const current = d === cycleDay;
            return (
              <div
                key={d}
                className="flex h-8 flex-col items-center justify-center rounded-xl text-xs font-black tabular-nums"
                style={{
                  background: filled ? (d === 7 ? AMBER : GOLD) : '#FAF8F3',
                  color: filled ? (d === 7 ? '#FFFFFF' : INK) : INK_SUB,
                  border: `1.5px solid ${current && !chestDone ? AMBER : LINE}`,
                }}
              >
                {d === 7 ? '★' : `${d}日`}
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-bold" style={{ color: INK_SUB }}>
          <span>{chestDone ? '中身' : 'きょうの中身'}</span>
          <span className="flex items-center gap-2 tabular-nums" style={{ color: INK }}>
            <span className="inline-flex items-center gap-0.5"><Sparkles size={11} style={{ color: AMBER }} /> +{(chestReward ?? preview).xp} XP</span>
            <span className="inline-flex items-center gap-0.5"><Coins size={11} style={{ color: AMBER }} /> +{(chestReward ?? preview).coins}</span>
          </span>
          <span>通算 <span className="tabular-nums font-black" style={{ color: AMBER }}>{progress.completeDays}</span> 回</span>
        </div>
        {chestReady && (
          <div className="mt-3">
            <BattleButton onClick={() => void open()} disabled={opening} icon={<Gift size={18} />}>
              {opening ? 'あけています…' : '宝箱をあける'}
            </BattleButton>
          </div>
        )}
      </section>

      <p className="mt-4 flex items-start gap-1.5 text-xs font-bold leading-relaxed" style={{ color: INK_SUB }}>
        <Sparkles size={12} className="mt-0.5 shrink-0" style={{ color: AMBER }} />
        ミッションは毎日0時に入れかわり、全員おなじ内容です。ボーナスミッションは演習（大問に得点）・英単語（4択・単語帳）・マナラッシュ・ガチャや着がえで進みます。達成すると、どの画面でも上にお知らせが出ます。コインは「プロフィール」でとびら君の装備と交換できます。
        復習リストの「できた」で進みます。同じ問題は1日1回までです。全部うけとると宝箱が開き、7日連続で大当たりです。
      </p>
      {extra}
    </BattleShell>
  );
}
