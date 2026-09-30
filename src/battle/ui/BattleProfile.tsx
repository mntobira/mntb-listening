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
import { ArrowLeft, Award, BarChart3, Coins, Lock, Shirt, Sparkles, Trophy, Store, Volume2, VolumeX } from 'lucide-react';
import { labelOfSubject } from '../../data/subjectLabels';
import {
  BADGES,
  badgeById,
  badgeProgress,
  ITEMS,
  levelOf,
  rankSubjects,
  type EquipKind,
  type GrowthProgress,
  type ItemDef,
} from '../core/growth';
import { buyItem, equip, equipBadgeTitle, unequip } from '../data/growthStore';
import { ACCESSORY_SLOTS, SLOT_LABELS, wallpaperOf } from '../core/tobiraParts';
import { AccessoryLayer } from './TobiraAccessories';
import { fetchMyRankingRow, ratingTitle } from '../data/battleRanking';
import { play, primeAudio, setSfxEnabled, sfxEnabled } from './feedback';
import {
  AMBER,
  BattleButton,
  BattleLoading,
  BattleNotice,
  BattleShell,
  BattleTitle,
  GOLD,
  INK,
  INK_SUB,
  LINE,
  WRONG,
} from './BattleParts';
import { GachaRoom } from '../../components/GachaRoom';
import { useGrowthProgress } from '../../hooks/useGrowthProgress';
import { BadgeChip, GrowthAvatar, LevelBar, NextGoals, StatCard, TitleChip } from './GrowthParts';

export type ProfileTab = 'outfit' | 'shop' | 'badges' | 'stats' | 'gacha';

type Runner = (fn: () => Promise<unknown>, okMessage?: string) => Promise<void>;

function unlockLabel(item: ItemDef): string {
  if ('level' in item.unlock) return `Lv.${item.unlock.level} で解放`;
  if ('badge' in item.unlock) return `称号「${badgeById(item.unlock.badge)?.label ?? '?'}」で解放`;
  if ('gacha' in item.unlock) return 'ガチャ限定';
  return `${item.unlock.coins} マナコイン`;
}

export function BattleProfile({ onBack, initialTab = 'outfit', standalone = false, onMissions }: { onBack: () => void; initialTab?: ProfileTab; standalone?: boolean; onMissions?: () => void; key?: string }) {
  const { progress, uid } = useGrowthProgress();
  const [rating, setRating] = useState<number>(1500);
  const [tab, setTab] = useState<ProfileTab>(initialTab);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setRating(1500);
    void fetchMyRankingRow().then((r) => alive && r && setRating(r.rating)).catch(() => {});
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
    ['shop', <Store size={14} />, 'ショップ'],
    ['outfit', <Shirt size={14} />, 'きせかえ'],
    ['badges', <Award size={14} />, '称号'],
    ['stats', <BarChart3 size={14} />, '教科別'],
  ];

  return (
    <BattleShell
      footer={
        <BattleButton variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
          もどる
        </BattleButton>
      }
    >
{standalone ? <h1 className="mb-4 text-center font-handwriting text-2xl font-black">{tab === 'shop' ? 'マナコインショップ' : 'とびら君のマイページ'}</h1> : <BattleTitle subtitle="プロフィール ／ とびら君の成長" />}

      {notice && (
        <div className="mb-3">
          <BattleNotice message={notice} tone="info" />
        </div>
      )}

      <p className="mb-3 text-xs leading-relaxed text-gray-600">成長記録はこのブラウザ・アカウント専用です。端末間同期や他の人への公開はありません。サイトデータを削除すると消えます。</p>
      {tab === 'shop' ? <section className="mb-4 flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4" aria-label="現在の装備と残高">
        <GrowthAvatar progress={progress} size={64} /><div className="min-w-0 flex-1"><p className="text-xs text-amber-900">いまのとびら君</p><p className="text-xl font-black tabular-nums">{progress.coins.toLocaleString()} <span className="text-xs">マナコイン</span></p><LevelBar xp={progress.xp} compact /></div>
      </section> : <ProfileHeader progress={progress} rating={rating} />}

      {!standalone && <nav className="mb-3 grid grid-cols-5 gap-1.5" aria-label="プロフィールの切り替え">
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
      {(tab === 'outfit' || tab === 'shop') && <OutfitTab key={tab} shop={tab === 'shop'} progress={progress} busy={busy} run={run} setNotice={setNotice} />}
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

// ============================================================
// きせかえ
// ============================================================

function OutfitTab({ progress, busy, run, setNotice, shop = false }: { shop?: boolean; key?: string; progress: GrowthProgress; busy: boolean; run: Runner; setNotice: (m: string) => void }) {
  const level = levelOf(progress.xp).level;
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const poses = ITEMS.filter((i) => i.kind === 'pose' && (!shop || 'coins' in i.unlock));
  const frames = ITEMS.filter((i) => i.kind === 'frame' && (!shop || 'coins' in i.unlock));
  // 部位アクセサリ・壁紙はガチャ限定なので、きせかえでは「持っているもの」だけ並べる
  const partKinds: EquipKind[] = [...ACCESSORY_SLOTS, 'wallpaper'];
  const ownedParts = (kind: EquipKind) => ITEMS.filter((i) => i.kind === kind && progress.owned.includes(i.id));

  const renderItem = (item: ItemDef) => {
    const owned = progress.owned.includes(item.id);
    const equipped = progress.equipped[item.kind] === item.id;
    const canBuy = !owned && 'coins' in item.unlock && progress.coins >= item.unlock.coins;
    const onClick = () => {
      if (equipped || busy) return;
      if (owned) {
        void run(() => equip(item.id), `「${item.label}」を身につけました`);
        return;
      }
      if (!('coins' in item.unlock)) return;
      if (!canBuy) {
        setNotice(`コインが ${item.unlock.coins - progress.coins} 足りません（ミッションでためられます）`);
        return;
      }
      // ★交換は確認を1回はさむ★（コインは戻らないので、押し間違いを防ぐ）
      if (confirmId !== item.id) {
        setConfirmId(item.id);
        return;
      }
      setConfirmId(null);
      void run(async () => {
        const r = await buyItem(item.id);
        if (r && !r.ok) {
          setNotice(r.reason ?? '交換できませんでした。');
          return r;
        }
        // Purchase and equip are committed together in the local store.
        return r;
      }, `「${item.label}」と交換して身につけました`);
    };
    return (
      <button
        key={item.id}
        type="button"
        onClick={onClick}
        disabled={busy || equipped}
        className="flex flex-col items-center gap-1 rounded-2xl border-2 p-2 text-center transition active:scale-[0.97] disabled:cursor-default"
        style={{
          borderColor: equipped || confirmId === item.id ? AMBER : owned ? `${AMBER}55` : LINE,
          background: equipped ? `${GOLD}26` : confirmId === item.id ? `${GOLD}14` : '#FFFFFF',
          opacity: owned || canBuy ? 1 : 0.7,
          boxShadow: equipped ? `0 2px 0 ${GOLD}` : undefined,
        }}
        aria-pressed={equipped}
      >
        {item.kind === 'pose' ? (
          <span className="flex h-14 w-14 items-end justify-center">
            <img src={item.value} alt={item.label} draggable={false} className="max-h-full max-w-full object-contain" style={{ filter: owned ? undefined : 'grayscale(1)' }} />
          </span>
        ) : item.kind === 'wallpaper' ? (
          <span className="wallpaper-swatch h-14 w-14" style={{ background: wallpaperOf(item.value)?.css }} />
        ) : item.kind !== 'frame' ? (
          <span className="relative flex h-14 w-14 items-end justify-center">
            <img src="/mascots/basic.webp" alt="" draggable={false} className="h-full w-full object-contain object-bottom" />
            <AccessoryLayer poseSrc="/mascots/basic.webp" parts={{ [item.kind]: item.value }} align="bottom" />
          </span>
        ) : (
          <span data-frame-pattern={item.pattern} className="h-14 w-14 rounded-2xl border-[4px]" style={{ borderColor: item.value, background: `${item.value}22`, filter: owned ? undefined : 'grayscale(0.8)' }} />
        )}
        <span className="text-xs font-black" style={{ color: INK }}>
          {item.label}
        </span>
        <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: equipped ? AMBER : owned ? INK_SUB : canBuy ? AMBER : INK_SUB }}>
          {confirmId === item.id ? 'もう一度タップで交換' : equipped ? '装備中' : owned ? 'タップで装備' : (
            <>
              {'coins' in item.unlock ? <Coins size={10} /> : <Lock size={10} />}
              {unlockLabel(item)}
            </>
          )}
        </span>
      </button>
    );
  };

  return (
    <div className="grid gap-4">
      {shop && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-lg font-black">ためたマナコインで、自分らしく。</p>
        <p className="mt-1 text-sm">購入は確認後に確定します。交換した装備はホーム・対戦で共通。強さは変わりません。</p>
        <p className="mt-2 font-bold">所持マナコイン：{progress.coins.toLocaleString()} 枚</p>
      </div>}
      <section>
        <h3 className="mb-2 flex items-center gap-1 text-xs font-black" style={{ color: INK_SUB }}>
          <Sparkles size={12} style={{ color: AMBER }} /> ポーズ（Lv.{level}）
        </h3>
        <div className="grid grid-cols-3 gap-2">{poses.map(renderItem)}</div>
      </section>
      <section>
        <h3 className="mb-2 flex items-center gap-1 text-xs font-black" style={{ color: INK_SUB }}>
          <Sparkles size={12} style={{ color: AMBER }} /> わく
        </h3>
        <div className="grid grid-cols-3 gap-2">{frames.map(renderItem)}</div>
      </section>
      {!shop && partKinds.map((kind) => {
        const list = ownedParts(kind);
        const current = progress.equipped[kind];
        return (
          <section key={kind} data-outfit-part={kind}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-1 text-xs font-black" style={{ color: INK_SUB }}>
                <Sparkles size={12} style={{ color: AMBER }} /> {SLOT_LABELS[kind as keyof typeof SLOT_LABELS]}（{list.length}）
              </h3>
              {current && (
                <button type="button" disabled={busy} onClick={() => void run(() => unequip(kind), `${SLOT_LABELS[kind as keyof typeof SLOT_LABELS]}を外しました`)}
                  className="min-h-[32px] rounded-full border px-3 text-xs font-bold" style={{ borderColor: LINE, color: INK_SUB }}>外す</button>
              )}
            </div>
            {list.length === 0
              ? <p className="rounded-2xl border px-3 py-3 text-center text-xs font-bold" style={{ borderColor: LINE, color: INK_SUB }}>まだありません。ガチャで出ます。</p>
              : <div className="grid grid-cols-3 gap-2">{list.map(renderItem)}</div>}
          </section>
        );
      })}
      <p className="text-xs font-bold leading-relaxed" style={{ color: INK_SUB }}>
        マナコインは対戦・日替わりボーナス・ミッションで手に入ります（課金はありません）。装備は見た目だけで、対戦の強さには影響しません。
      </p>
    </div>
  );
}

// ============================================================
// 称号（バッジ）
// ============================================================

function BadgesTab({ progress, busy, run }: { progress: GrowthProgress; busy: boolean; run: Runner }) {
  const earned = BADGES.filter((b) => b.id in progress.badges).sort((a, b) => b.tier - a.tier);
  // ★近い順に並べる★（「あと1」が上に来る。希少度順だと遠い目標が上に来てしまう）
  const locked = BADGES.filter((b) => !(b.id in progress.badges)).sort((a, b) => {
    const ra = badgeProgress(progress, a.id)?.ratio ?? 0;
    const rb = badgeProgress(progress, b.id)?.ratio ?? 0;
    return rb - ra || a.tier - b.tier;
  });
  const current = progress.equipped.title;

  return (
    <div className="grid gap-4">
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-1 text-xs font-black" style={{ color: INK_SUB }}>
            <Trophy size={12} style={{ color: AMBER }} /> もっている称号（{earned.length}/{BADGES.length}）
          </h3>
          {current !== '' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(() => equipBadgeTitle(''), 'レートの称号にもどしました')}
              className="rounded-full border px-2 py-0.5 text-xs font-bold"
              style={{ borderColor: LINE, color: INK_SUB }}
            >
              レート称号にもどす
            </button>
          )}
        </div>
        {earned.length === 0 ? (
          <p className="rounded-2xl border px-3 py-3 text-center text-xs font-bold" style={{ borderColor: LINE, color: INK_SUB }}>
            まだ称号がありません。1回対戦すると最初の称号がもらえます。
          </p>
        ) : (
          <div className="grid gap-1.5">
            {earned.map((b, i) => (
              <BadgeChip
                key={b.id}
                id={b.id}
                delay={i * 0.05}
                selected={current === b.id}
                onClick={() => {
                  if (busy || current === b.id) return;
                  void run(() => equipBadgeTitle(b.id), `称号「${b.label}」を身につけました`);
                }}
              />
            ))}
          </div>
        )}
        <p className="mt-1.5 text-xs font-bold" style={{ color: INK_SUB }}>
          選んだ称号は、この端末の自分のプロフィールに表示されます（他の人には公開されません）。
        </p>
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-1 text-xs font-black" style={{ color: INK_SUB }}>
          <Lock size={12} /> まだの称号
        </h3>
        <div className="grid gap-1.5">
          {locked.map((b) => (
            <BadgeChip key={b.id} id={b.id} earned={false} progress={progress} />
          ))}
        </div>
      </section>
    </div>
  );
}

// ============================================================
// 教科別成績（ジャンル別統計）
// ============================================================

function StatsTab({ progress }: { progress: GrowthProgress }) {
  const rows = rankSubjects(progress);
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border px-3 py-4 text-center text-xs font-bold" style={{ borderColor: LINE, color: INK_SUB }}>
        まだ対戦の記録がありません。
      </p>
    );
  }
  return (
    <div className="grid gap-2">
      {rows.map((r, i) => {
        const acc = r.accuracy ?? 0;
        const color = acc >= 80 ? AMBER : acc >= 60 ? '#3498DB' : WRONG;
        return (
          <div key={r.subject} className="rounded-2xl border px-3 py-2.5" style={{ borderColor: LINE, background: '#FFFFFF' }}>
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[12px] font-black" style={{ color: INK }}>
                <span className="w-4 text-center text-xs tabular-nums" style={{ color: INK_SUB }}>
                  {i + 1}
                </span>
                {labelOfSubject(r.subject)}
              </p>
              <p className="text-sm font-black tabular-nums" style={{ color }}>
                {r.accuracy === null ? '—' : `${r.accuracy}%`}
              </p>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: '#E8E2D6' }}>
              <div className="h-full rounded-full" style={{ width: `${acc}%`, background: color }} />
            </div>
            <p className="mt-1 text-xs font-bold tabular-nums" style={{ color: INK_SUB }}>
              {r.stats.matches}試合 ／ {r.stats.wins}勝 ／ {r.stats.correct}/{r.stats.answered}問せいかい
            </p>
          </div>
        );
      })}
      <p className="text-xs font-bold leading-relaxed" style={{ color: INK_SUB }}>
        正答率がいちばん低い教科が「苦手」です。その教科の穴（対戦で落とした問題）を学習でうめると、次の対戦で正答率が上がります。
      </p>
    </div>
  );
}
