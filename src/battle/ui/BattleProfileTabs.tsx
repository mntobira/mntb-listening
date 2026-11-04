/** プロフィールのタブ（着せ替え・称号・戦績）。BattleProfile.tsx から分けた。中身は不変。 */
import { useFitPager } from '../../hooks/useFitPager';
import { FitPagerBar } from '../../components/ui/FitPagerBar';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Coins, Lock, Sparkles, Trophy } from 'lucide-react';
import { labelOfSubject } from '../../data/subjectLabels';
import {
  BADGES,
  badgeById,
  badgeProgress,
  badgeTierColor,
  ITEMS,
  levelOf,
  lifetimeTotals,
  rankSubjects,
  type EquipKind,
  type GrowthProgress,
  type ItemDef,
} from '../core/growth';
import { buyItem, equip, equipBadgeTitle, unequip } from '../data/growthStore';
import { ACCESSORY_SLOTS, SLOT_LABELS, stageOf, wallpaperOf } from '../core/tobiraParts';
import '../../styles/home-stage.css';
import { AccessoryLayer } from './TobiraAccessories';
import { CompanionArt } from './CompanionArt';
import {
  AMBER,
  GOLD,
  INK,
  INK_SUB,
  LINE,
  WRONG,
} from './BattleParts';
import { auth } from '../../firebase';
import { STAGE_CLEAR_PERFECTS, readStageHistory, stageSummary } from '../../utils/stageRecords';
import { StatCard } from './GrowthParts';


export type Runner = (fn: () => Promise<unknown>, okMessage?: string) => Promise<void>;

export function unlockLabel(item: ItemDef): string {
  if ('level' in item.unlock) return `Lv.${item.unlock.level} で解放`;
  if ('badge' in item.unlock) return `称号「${badgeById(item.unlock.badge)?.label ?? '?'}」で解放`;
  if ('gacha' in item.unlock) return 'ガチャ限定';
  return `${item.unlock.coins} マナコイン`;
}

// ============================================================
// きせかえ
// ============================================================

export function OutfitTab({ progress, busy, run, setNotice, shop = false }: { shop?: boolean; key?: string; progress: GrowthProgress; busy: boolean; run: Runner; setNotice: (m: string) => void }) {
  const level = levelOf(progress.xp).level;
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const poses = ITEMS.filter((i) => i.kind === 'pose' && (!shop || 'coins' in i.unlock));
  const frames = ITEMS.filter((i) => i.kind === 'frame' && (!shop || 'coins' in i.unlock));
  // 部位アクセサリ・壁紙はガチャ限定なので、きせかえでは「持っているもの」だけ並べる
  const partKinds: EquipKind[] = ['companion', ...ACCESSORY_SLOTS, 'wallpaper', 'stage'];
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
        ) : item.kind === 'stage' ? (
          <span className="wallpaper-swatch stage-swatch h-14 w-14" data-stage-swatch={stageOf(item.value) ? item.value : 'cosmos'} />
        ) : item.kind === 'wallpaper' ? (
          <span className="wallpaper-swatch h-14 w-14" style={{ background: wallpaperOf(item.value)?.css }} />
        ) : item.kind === 'companion' ? (
          <span className="flex h-14 w-14 items-end justify-center">
            <CompanionArt value={item.value} size={56} label={item.label} />
          </span>
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

/**
 * 称号（2026-10-29 B4 作り直し）
 *   全部の称号を小さなタイルで1つの一覧に。達成したものは色つき＋「達成」の印、まだのものは灰色＋進み具合のバー。
 *   押すと詳細の窓（説明・進み具合・「この称号をつける」）。並び＝達成（希少な順）→ まだ（近い順）。
 */
export function BadgesTab({ progress, busy, run }: { progress: GrowthProgress; busy: boolean; run: Runner }) {
  const earned = BADGES.filter((b) => b.id in progress.badges).sort((a, b) => b.tier - a.tier);
  // ★近い順に並べる★（「あと1」が前に来る。希少度順だと遠い目標が前に来てしまう）
  const locked = BADGES.filter((b) => !(b.id in progress.badges)).sort((a, b) => {
    const ra = badgeProgress(progress, a.id)?.ratio ?? 0;
    const rb = badgeProgress(progress, b.id)?.ratio ?? 0;
    return rb - ra || a.tier - b.tier;
  });
  const all = [...earned, ...locked];
  const current = progress.equipped.title;
  const pager = useFitPager(all.length);
  const [open, setOpen] = useState<string | null>(null);
  const openBadge = open ? badgeById(open) : undefined;
  const isEarned = (id: string) => id in progress.badges;

  return (
    <div className="badges-tab badges-tiles-wrap" data-badges-tiles>
      <header className="badges-tiles-head">
        <h3><Trophy size={14} style={{ color: AMBER }} aria-hidden />達成 <b>{earned.length}</b><small>/ {BADGES.length}</small></h3>
        <span className="badges-tiles-bar" aria-hidden><i style={{ width: `${Math.round((earned.length / BADGES.length) * 100)}%` }} /></span>
        {current !== '' && (
          <button type="button" disabled={busy} onClick={() => void run(() => equipBadgeTitle(''), 'レートの称号にもどしました')}>レート称号にもどす</button>
        )}
      </header>
      <div ref={pager.frameRef} className="badge-locked-frame badges-tiles-frame">
        <ul className="badges-tiles" ref={pager.gridRef} aria-label="称号の一覧（押すと詳細）">
          {all.slice(pager.start, pager.end).map((b) => {
            const got = isEarned(b.id);
            const goal = got ? null : badgeProgress(progress, b.id);
            const color = badgeTierColor(b.tier);
            return (
              <li key={b.id}>
                <button type="button" className="badge-tile" data-earned={got || undefined} data-equipped={current === b.id || undefined} data-badge={b.id}
                  style={{ ['--tier' as string]: color } as CSSProperties} onClick={() => setOpen(b.id)}
                  aria-label={`${b.label}（${got ? (current === b.id ? '達成・つけている' : '達成') : goal ? `まだ・${goal.current}/${goal.goal}` : 'まだ'}）の詳細`}>
                  <span className="badge-tile-emoji" aria-hidden>{b.emoji}</span>
                  <span className="badge-tile-name">{b.label}</span>
                  {got ? <span className="badge-tile-done">{current === b.id ? 'つけている' : '達成'}</span>
                    : goal && goal.goal > 1 ? <span className="badge-tile-progress" aria-hidden><i style={{ width: `${goal.ratio * 100}%` }} /></span>
                    : <span className="badge-tile-lock"><Lock size={11} aria-hidden />まだ</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <FitPagerBar pager={pager} label="称号" />
      {openBadge && <BadgeDialog onClose={() => setOpen(null)} title={openBadge.label}>
        {(() => {
          const got = isEarned(openBadge.id);
          const goal = got ? null : badgeProgress(progress, openBadge.id);
          const color = badgeTierColor(openBadge.tier);
          return <>
            <div className="badge-detail-head" style={{ ['--tier' as string]: color } as CSSProperties} data-earned={got || undefined}>
              <span className="badge-tile-emoji" aria-hidden>{openBadge.emoji}</span>
              <div><small>{openBadge.tier === 3 ? 'ゴールド' : openBadge.tier === 2 ? 'シルバー' : 'ブロンズ'}{got ? ' · 達成！' : ' · まだ'}</small><strong>{openBadge.label}</strong></div>
            </div>
            <p className="badge-detail-desc">{openBadge.desc}</p>
            {goal && goal.goal > 1 && <p className="badge-detail-goal"><span className="badge-tile-progress"><i style={{ width: `${goal.ratio * 100}%` }} /></span><b>{goal.current}/{goal.goal}</b>（あと{goal.remain}）</p>}
            {got ? (current === openBadge.id
              ? <button type="button" className="badge-detail-btn" disabled>つけています</button>
              : <button type="button" className="badge-detail-btn" disabled={busy} onClick={() => { void run(() => equipBadgeTitle(openBadge.id), `称号「${openBadge.label}」を身につけました`); setOpen(null); }}>この称号をつける</button>)
              : <p className="badge-detail-note">達成すると、この称号をつけられます。</p>}
            <p className="badge-detail-note">選んだ称号は、この端末の自分のプロフィールに表示されます（他の人には公開されません）。</p>
          </>;
        })()}
      </BadgeDialog>}
    </div>
  );
}

/** 称号の詳細の窓（既存の窓と同じ見た目） */
function BadgeDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current; if (d && !d.open) d.showModal(); }, []);
  return createPortal(<dialog ref={ref} className="game-details-dialog mt-dialog badge-detail" aria-label={`称号「${title}」の詳細`} data-badge-detail
    onClose={onClose} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === ref.current) onClose(); }}>
    <header><h2>称号の詳細</h2><button type="button" autoFocus onClick={onClose}>閉じる</button></header>
    <div className="game-details-body badge-detail-body">{children}</div>
  </dialog>, document.body);
}

// ============================================================
// 教科別成績（ジャンル別統計）
// ============================================================

/** これまでの積み上げ（演習・復習・ログインも含めた合計）。対戦しない人の記録も空にしない */
export function LifetimeTotals({ progress }: { progress: GrowthProgress }) {
  const t = lifetimeTotals(progress);
  const stages = stageSummary(auth.currentUser?.uid || 'guest');
  return (
    <section aria-label="これまでの積み上げ" data-lifetime-totals>
      <h3 className="mb-1.5 text-xs font-black" style={{ color: INK_SUB }}>これまでの積み上げ</h3>
      <div className="grid grid-cols-4 gap-1.5">
        <StatCard label="来た日" value={t.loginDays} sub="日" />
        <StatCard label="演習" value={t.studySolved} sub="大問" />
        <StatCard label="復習" value={t.holesFilled} sub="問" />
        <StatCard label="称号" value={t.badges} sub={`/ ${t.badgeTotal}`} color={AMBER} />
        <StatCard label="対戦" value={t.matches} sub={`${t.wins}勝`} />
        <StatCard label="対戦正解" value={t.correct} sub="問" />
        <StatCard label="ラッシュ" value={t.rushBest.toLocaleString()} sub="最高点" />
        <StatCard label="アイテム" value={t.items} sub="こ" />
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        <StatCard label="達成ステージ" value={stages.cleared} sub={`満点${STAGE_CLEAR_PERFECTS}回で達成`} color={AMBER} />
        <StatCard label="満点" value={stages.perfects} sub="回" />
        <StatCard label="ステージ挑戦" value={stages.plays} sub="回" />
      </div>
    </section>
  );
}

/** 最近あそんだステージ（一人で学ぶ）の履歴。新しい順 */
export function StageHistory() {
  const items = readStageHistory(auth.currentUser?.uid || 'guest').slice(0, 12);
  return (
    <section aria-label="最近のステージ" data-stage-history>
      <h3 className="mb-1.5 mt-1 text-xs font-black" style={{ color: INK_SUB }}>最近のステージ</h3>
      {items.length === 0 ? (
        <p className="rounded-2xl border px-3 py-3 text-center text-xs font-bold" style={{ borderColor: LINE, color: INK_SUB }}>
          演習でステージを最後まで解くと、ここに残ります。
        </p>
      ) : (
        <ol className="grid gap-1">
          {items.map((e) => {
            const perfect = e.c === e.j;
            const d = new Date(e.t);
            return (
              <li key={`${e.k}:${e.t}`} className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: LINE, background: '#FFFFFF' }}>
                <span className="w-12 shrink-0 text-xs font-bold tabular-nums" style={{ color: INK_SUB }}>{d.getMonth() + 1}/{d.getDate()}</span>
                <span className="min-w-0 flex-1 truncate text-xs font-black" style={{ color: INK }}>{e.title}</span>
                <span className="shrink-0 text-xs font-black tabular-nums" style={{ color: perfect ? AMBER : INK_SUB }}>
                  {perfect ? '満点 ' : ''}{e.c}/{e.j}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function StatsTab({ progress }: { progress: GrowthProgress }) {
  const rows = rankSubjects(progress);
  if (rows.length === 0) {
    return (
      <div className="grid gap-2">
        <LifetimeTotals progress={progress} />
        <StageHistory />
        <p className="rounded-2xl border px-3 py-3 text-center text-xs font-bold" style={{ borderColor: LINE, color: INK_SUB }}>
          教科ごとの成績は、対戦すると表示されます。
        </p>
      </div>
    );
  }
  return (
    <div className="grid gap-2">
      <LifetimeTotals progress={progress} />
      <StageHistory />
      <h3 className="mt-1 text-xs font-black" style={{ color: INK_SUB }}>教科ごとの対戦成績</h3>
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
