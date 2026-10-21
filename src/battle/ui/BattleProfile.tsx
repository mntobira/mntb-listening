/**
 * ===================================================================
 * BattleProfile — プロフィール／成長画面（とびら君・称号・バッジ・教科別成績）
 * ===================================================================
 *
 * エグゼクティブサマリ §2「プロフィール／アバター（扉くん）設計案」の実装。
 *   ・成長要素     … 経験値→レベル、レベルで装備が解放
 *   ・カスタマイズ … ポーズ（既存9枚の絵）と枠の色を着せ替え
 *   ・コレクタブル … バッジ（達成条件つき）。称号として身につけられる
 *   ・ソーシャル   … GrowthAvatar は相手・フレンドの表示にも使える部品
 *   ・課金要素     … ★実装しない★（コインは対戦・ミッションでしか手に入らない）
 *
 * ★既存の設定モーダル（components/ProfileModal）は触らない★
 * あちらは名前・学年・Google連携・フレンド・クラスを扱う「設定」。
 * ここは対戦モードの中の「成長の記録」で、責務が違う。
 *
 * ★装備の変更は1回の書き込み★
 * 押した瞬間にトランザクションで保存する。失敗したら画面に知らせる。
 */

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Award, BarChart3, Coins, Shirt, Sparkles, Volume2, VolumeX } from 'lucide-react';
import {
  levelOf,
  type GrowthProgress,
  } from '../core/growth';
import { fetchMyRankingRow, ratingTitle } from '../data/battleRanking';
import { play, primeAudio, setSfxEnabled, sfxEnabled } from './feedback';
import {
  AMBER,
  BattleButton,
  BattleNotice,
  BattleShell,
  BattleTitle,
  GOLD,
  INK,
  INK_SUB,
  LINE,
  } from './BattleParts';
import { GachaRoom } from '../../components/GachaRoom';
import { useGrowthProgress } from '../../hooks/useGrowthProgress';
import { GrowthAvatar, LevelBar, NextGoals, StatCard, TitleChip } from './GrowthParts';
import { logRejection } from '../../utils/reportError';
import { OutfitTab, BadgesTab, StatsTab } from './BattleProfileTabs';
import type { Runner } from './BattleProfileTabs';


export type ProfileTab = 'outfit' | 'badges' | 'stats' | 'gacha';

export function BattleProfile({ onBack, initialTab = 'outfit', standalone = false, onMissions }: { onBack: () => void; initialTab?: ProfileTab; standalone?: boolean; onMissions?: () => void; key?: string }) {
  const { progress, uid } = useGrowthProgress();
  const [rating, setRating] = useState<number>(1500);
  const [tab, setTab] = useState<ProfileTab>(initialTab);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setRating(1500);
    void fetchMyRankingRow().then((r) => alive && r && setRating(r.rating)).catch(logRejection('battle.profile.fetchRanking'));
    return () => {
      alive = false;
    };
  }, [uid]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(t);
  }, [notice]);

  const [sfxOn, setSfxOn] = useState<boolean>(() => sfxEnabled());
  const toggleSfx = () => {
    const next = !sfxOn;
    setSfxEnabled(next);
    setSfxOn(next);
    if (next) {
      primeAudio();
      play('correct');
    }
  };

  const run: Runner = async (fn, okMessage) => {
    if (busy) return;
    primeAudio();
    play('tap');
    setBusy(true);
    try {
      const r = await fn();
      if (r === null) setNotice('端末に保存できませんでした。ブラウザの保存設定・空き容量を確認してください。');
      else if (typeof r === 'object' && r && 'ok' in r && !r.ok) return;
      else if (okMessage) {
        play('coin', false);
        setNotice(okMessage);

      }
    } finally {
      setBusy(false);
    }
  };

  if (!progress) {
    return (
      <BattleShell>
        <BattleTitle subtitle="プロフィール" />
        <BattleNotice message="成長記録を読み込めません。端末の保存設定を確認してください。" /><BattleButton onClick={onBack}>もどる</BattleButton>
      </BattleShell>
    );
  }

  const tabs: [ProfileTab, ReactNode, string][] = [
    ['gacha', <Sparkles size={14} />, 'ガチャ'],
    ['outfit', <Shirt size={14} />, 'きせかえ'],
    ['badges', <Award size={14} />, '称号'],
    ['stats', <BarChart3 size={14} />, '教科別'],
  ];

  if (standalone) {
    const heading = tab === 'badges' ? ['称号', 'バッジを集めて、つけたい称号を選べます'] : tab === 'stats' ? ['記録', '積み上げ・ステージの履歴・対戦成績'] : ['とびら君', ''];
    return (
      <section className="profile-standalone" data-profile-standalone={tab}>
        <header className="profile-standalone-head">
          <button type="button" onClick={onBack} aria-label="マイページにもどる"><ArrowLeft size={18} /></button>
          <div><h2>{heading[0]}</h2>{heading[1] && <p>{heading[1]}</p>}</div>
        </header>
        {notice && <div className="mb-3"><BattleNotice message={notice} tone="info" /></div>}
        {tab === 'outfit' && <OutfitTab progress={progress} busy={busy} run={run} setNotice={setNotice} />}
        {tab === 'badges' && <BadgesTab progress={progress} busy={busy} run={run} />}
        {tab === 'stats' && <StatsTab progress={progress} />}
      </section>
    );
  }

  return (
    <BattleShell
      footer={
        <BattleButton variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
          もどる
        </BattleButton>
      }
    >
{standalone ? null : <BattleTitle subtitle="プロフィール ／ とびら君の成長" />}

      {notice && (
        <div className="mb-3">
          <BattleNotice message={notice} tone="info" />
        </div>
      )}

      {!standalone && <p className="mb-3 text-xs leading-relaxed text-gray-600">成長記録はこのブラウザ・アカウント専用です。端末間同期や他の人への公開はありません。サイトデータを削除すると消えます。</p>}
      {!standalone && <ProfileHeader progress={progress} rating={rating} />}

      {!standalone && <nav className="mb-3 grid grid-cols-4 gap-1.5" aria-label="プロフィールの切り替え">
        {tabs.map(([id, icon, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? 'page' : undefined}
            className="flex min-h-11 items-center justify-center gap-1 rounded-xl border-2 text-xs font-black transition active:scale-[0.98]"
            style={{
              borderColor: tab === id ? AMBER : LINE,
              background: tab === id ? `${GOLD}22` : '#FFFFFF',
              color: tab === id ? AMBER : INK_SUB,
            }}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>}

      {tab === 'gacha' && <GachaRoom onBack={() => setTab('outfit')} onMissions={onMissions || onBack} />}
      {tab === 'outfit' && <OutfitTab progress={progress} busy={busy} run={run} setNotice={setNotice} />}
      {tab === 'badges' && <BadgesTab progress={progress} busy={busy} run={run} />}
      {tab === 'stats' && <StatsTab progress={progress} />}

      {/* 対戦の効果音・振動の切り替え（BGM とは別。既定 ON） */}
      {!standalone && <section
        id="battle-sfx-setting"
        className="mt-4 flex items-center justify-between rounded-2xl border-2 px-3 py-2.5"
        style={{ borderColor: LINE, background: '#FFFFFF' }}
      >
        <div>
          <p className="text-xs font-black" style={{ color: INK }}>
            対戦の効果音・振動
          </p>
          <p className="text-xs font-bold" style={{ color: INK_SUB }}>
            勝敗・レベルアップ・報酬のときだけ短く鳴ります
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={sfxOn}
          onClick={toggleSfx}
          className="flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-black transition active:scale-95"
          style={{
            borderColor: sfxOn ? AMBER : LINE,
            background: sfxOn ? `${GOLD}22` : '#FFFFFF',
            color: sfxOn ? AMBER : INK_SUB,
          }}
        >
          {sfxOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          {sfxOn ? 'ON' : 'OFF'}
        </button>
      </section>}
    </BattleShell>
  );
}

// ============================================================
// ヘッダー（とびら君・レベル・称号・数字）
// ============================================================

function ProfileHeader({ progress, rating }: { progress: GrowthProgress; rating: number }) {
  const info = levelOf(progress.xp);
  const rate = progress.answered > 0 ? Math.round((progress.correct / progress.answered) * 100) : null;
  return (
    <section
      id="battle-profile-header"
      className="battle-card-in mb-3 rounded-3xl border-2 p-4"
      style={{ borderColor: `${GOLD}88`, background: `${GOLD}10` }}
    >
      <div className="flex items-center gap-3">
        <GrowthAvatar progress={progress} size={88} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <TitleChip progress={progress} rating={rating} size="md" />
            <span className="text-xs font-bold" style={{ color: INK_SUB }}>
              レート {rating}（{ratingTitle(rating).label}）
            </span>
          </div>
          <LevelBar xp={progress.xp} />
          <p className="mt-1 flex items-center gap-3 text-xs font-bold" style={{ color: INK_SUB }}>
            <span className="tabular-nums">累計 {progress.xp.toLocaleString()} XP</span>
            <span className="inline-flex items-center gap-0.5 tabular-nums">
              <Coins size={11} style={{ color: AMBER }} /> {progress.coins}
            </span>
            <span className="tabular-nums">Lv.{info.level}</span>
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        <StatCard label="たいせん" value={progress.matches} />
        <StatCard label="かち" value={progress.wins} color={AMBER} />
        <StatCard label="せいとう率" value={rate === null ? '—' : `${rate}%`} />
        <StatCard label="できた復習" value={progress.holesFilled} />
      </div>
      <div className="mt-3">
        <NextGoals progress={progress} max={3} />
      </div>
    </section>
  );
}
