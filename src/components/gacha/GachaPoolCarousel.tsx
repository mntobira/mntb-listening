/**
 * ガチャの種類を左右スワイプで切り替えるバナー（2026-10-29 追加：共通テストガチャ／2次試験ガチャ）。
 *
 *   ・上の切替（共通テスト｜2次試験）を押しても、バナーを左右にスワイプしても切り替わる（どちらも同じ状態）。
 *   ・縦には伸ばさない（UI の決まり「1画面でスクロールしない」）。横の scroll-snap で1枚ずつ止まる。
 *   ・各スライドの中身（今週の目玉・ピックアップ・ひとこと・案内）は、これまでの1枚のバナーと同じ作り。
 *     目玉・ピックアップはそのガチャの中身（gachaItems(pool)）から毎週自動で選ぶ。アイテム名は書かない。
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Info, Sparkles, Target } from 'lucide-react';
import { gachaItems, gachaItemRate } from '../../battle/core/arenaEconomy';
import { gachaFeatured } from '../../battle/core/gachaFeatured';
import { GACHA_POOLS, type GachaPoolId } from '../../battle/core/gachaPools';
import { gachaRarityOf, type GrowthProgress, type ItemDef } from '../../battle/core/growth';
import { ItemArt, RarityTag, pct } from '../GachaParts';
import { TobiraBuddy } from '../TobiraBuddy';
import { weekEndLabel, weeklyHero, weeklyPickup } from './GachaItemDetail';

/** E2：目玉の枠で1つを見せる時間と、フェードアウトの時間 */
export const HERO_SHOW_MS = 4200;
export const HERO_FADE_MS = 450;

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function GachaPoolCarousel({ pool, onPool, progress, onDetail, onPickup, onOdds, coinsLow, onMissions }: {
  pool: GachaPoolId;
  onPool: (pool: GachaPoolId) => void;
  progress: GrowthProgress | null;
  onDetail: (item: ItemDef, pool: GachaPoolId) => void;
  onPickup: () => void;
  onOdds: () => void;
  coinsLow: boolean;
  onMissions: () => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const index = Math.max(0, GACHA_POOLS.findIndex((p) => p.id === pool));
  const week = useMemo(() => gachaFeatured().week, []);

  // 初めて表示したとき（結果を見て戻ったときも）は、選んでいるガチャの位置にアニメーションなしで合わせる。
  // 表示したときの位置だけ使う（その後の切り替えはスワイプ・タブ側で動かす）ので ref に取っておく
  const firstIndex = useRef(index);
  useLayoutEffect(() => {
    const el = track.current;
    if (el) el.scrollLeft = firstIndex.current * el.clientWidth;
  }, []);
  // 画面の幅が変わっても、同じガチャのところで止まるように
  useEffect(() => {
    const el = track.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => { el.scrollLeft = index * el.clientWidth; });
    ro.observe(el);
    return () => ro.disconnect();
  }, [index]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  /** スワイプで止まった位置 → 選んでいるガチャ */
  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = track.current;
      if (!el || !el.clientWidth) return;
      const next = GACHA_POOLS[Math.round(el.scrollLeft / el.clientWidth)];
      if (next && next.id !== pool) onPool(next.id);
    });
  };

  /** 切替を押した → そのスライドまで動かす */
  const go = useCallback((i: number) => {
    const target = GACHA_POOLS[(i + GACHA_POOLS.length) % GACHA_POOLS.length];
    const el = track.current;
    if (el) el.scrollTo({ left: GACHA_POOLS.indexOf(target) * el.clientWidth, behavior: reducedMotion() ? 'auto' : 'smooth' });
    onPool(target.id);
  }, [onPool]);

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = index + (e.key === 'ArrowRight' ? 1 : -1);
    go(next);
    requestAnimationFrame(() => document.getElementById(`gacha-pool-tab-${GACHA_POOLS[(next + GACHA_POOLS.length) % GACHA_POOLS.length].id}`)?.focus());
  };

  return (
    <section className="gacha-banner" data-pool={pool} aria-labelledby="gacha-banner-title" data-gacha-featured>
      <h1 id="gacha-banner-title" className="sr-only">装飾ガチャ</h1>
      <header className="gacha-banner-head">
        <div className="gacha-pool-tabs" role="tablist" aria-label="ガチャの種類（左右にスワイプしても切り替わります）" data-gacha-pool-tabs>
          {GACHA_POOLS.map((p, i) => (
            <button
              key={p.id}
              id={`gacha-pool-tab-${p.id}`}
              type="button"
              role="tab"
              aria-selected={p.id === pool}
              aria-controls={`gacha-pool-panel-${p.id}`}
              tabIndex={p.id === pool ? 0 : -1}
              onClick={() => go(i)}
              onKeyDown={onTabKey}
              data-gacha-pool-tab={p.id}
            >
              {p.id === pool && <Sparkles size={14} aria-hidden="true" />}
              {p.short}
            </button>
          ))}
        </div>
        <small>{weekEndLabel(week)}</small>
      </header>
      <div className="gacha-carousel" ref={track} onScroll={onScroll} data-gacha-carousel>
        {GACHA_POOLS.map((p) => (
          <PoolSlide key={p.id} poolId={p.id} active={p.id === pool} progress={progress} onDetail={onDetail}
            onPickup={onPickup} onOdds={onOdds} coinsLow={coinsLow} onMissions={onMissions} />
        ))}
      </div>
      <p className="gacha-swipe-hint" aria-hidden="true">
        {GACHA_POOLS.map((p) => <i key={p.id} data-on={p.id === pool} />)}
        <span>左右にスワイプで切りかえ</span>
      </p>
    </section>
  );
}

function PoolSlide({ poolId, active, progress, onDetail, onPickup, onOdds, coinsLow, onMissions }: {
  /** このリポジトリの JSX 型では key を props に書いておく必要がある（GachaRoomContent と同じ） */
  key?: string;
  poolId: GachaPoolId;
  active: boolean;
  progress: GrowthProgress | null;
  onDetail: (item: ItemDef, pool: GachaPoolId) => void;
  onPickup: () => void;
  onOdds: () => void;
  coinsLow: boolean;
  onMissions: () => void;
}) {
  const def = GACHA_POOLS.find((p) => p.id === poolId)!;
  const items = useMemo(() => gachaItems(poolId), [poolId]);
  const featured = useMemo(() => gachaFeatured({ pool: poolId, preferSubjects: def.preferSubjects, srCount: 0, rCount: 0 }), [poolId, def]);
  // 目玉は週ごとに LR と UR を交互に（いつも UR にならない）。割合はそのガチャの本物の抽選表の値
  const hero = useMemo(() => weeklyHero(items, featured.week, featured.hero?.item ?? null), [items, featured]);
  const pickup = useMemo(() => weeklyPickup(items, featured.week, hero?.id), [items, featured, hero]);
  // ★E2（2026-10-30）目玉の枠を順に回す★ 今週の目玉 → ピックアップの LR → UR の順に、
  //   しばらく見せたらフェードアウト → 次の物がフェードイン。押すと、いま出ている物の詳細が開く。
  //   見ていないスライド・裏に回したとき・動きを減らす設定のときは止める（今週の目玉のまま）。
  const heroes = useMemo(() => {
    const list = [hero, ...pickup.filter((i) => gachaRarityOf(i) === 'LR'), ...pickup.filter((i) => gachaRarityOf(i) !== 'LR')];
    return list.filter((i, k): i is ItemDef => !!i && list.findIndex((x) => x?.id === i.id) === k);
  }, [hero, pickup]);
  const [heroAt, setHeroAt] = useState(0);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    setHeroAt(0); setFading(false);
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!active || reduce || heroes.length < 2) return;
    let swap: ReturnType<typeof setTimeout> | undefined;
    const tick = setInterval(() => {
      if (document.hidden) return;
      setFading(true);
      swap = setTimeout(() => { setHeroAt((n) => (n + 1) % heroes.length); setFading(false); }, HERO_FADE_MS);
    }, HERO_SHOW_MS);
    return () => { clearInterval(tick); if (swap) clearTimeout(swap); };
  }, [active, heroes]);
  const shown = heroes[heroAt] ?? hero;
  if (!hero || !shown) return null;
  return (
    <div
      className="gacha-slide"
      id={`gacha-pool-panel-${poolId}`}
      role="tabpanel"
      aria-labelledby={`gacha-pool-tab-${poolId}`}
      aria-hidden={!active}
      inert={!active ? true : undefined}
      data-gacha-pool={poolId}
    >
      <button
        type="button"
        className="gacha-banner-hero"
        data-rarity={gachaRarityOf(shown)}
        data-gacha-hero={active ? '' : undefined}
        data-hero-fading={fading || undefined}
        data-hero-index={heroAt}
        onClick={() => onDetail(shown, poolId)}
        aria-label={`${def.title} ${heroAt === 0 ? '今週の目玉' : 'ピックアップ'} ${shown.label} の詳細を見る`}
      >
        {/* B5（2026-10-29）：光が走る・キラキラが舞う（目玉を派手に）。動きを減らす設定では止める */}
        <span className="gacha-banner-shine" aria-hidden="true" />
        <span className="gacha-banner-sparks" aria-hidden="true"><i /><i /><i /><i /><i /></span>
        <span className="gacha-banner-swap" key={shown.id}>
          <span className="gacha-banner-art"><ItemArt item={shown} progress={progress} size={76} /></span>
          <span className="gacha-banner-body">
            <span className="gacha-banner-top"><RarityTag rarity={gachaRarityOf(shown)} /><em>{heroAt === 0 ? `${def.title}の目玉` : 'ピックアップ'}</em></span>
            <strong>{shown.label}</strong>
            <small>1種あたり {pct(gachaItemRate(shown, 'N', poolId))}%{progress?.owned.includes(shown.id) ? ' · 所持済み' : ''}</small>
            <span className="gacha-banner-tap"><Info size={13} aria-hidden="true" />タップで詳細</span>
          </span>
        </span>
        {heroes.length > 1 && <span className="gacha-banner-dots" aria-hidden="true">{heroes.map((h, k) => <i key={h.id} data-on={k === heroAt || undefined} />)}</span>}
      </button>
      <ul className="gacha-banner-picks" aria-label={`${def.title} 今週のピックアップ（押すと詳細）`}>
        {pickup.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => onDetail(item, poolId)} data-gacha-pickup-item={item.id} data-rarity={gachaRarityOf(item)} aria-label={`${gachaRarityOf(item)} ${item.label} の詳細を見る`}>
              <ItemArt item={item} progress={progress} size={40} />
              <RarityTag rarity={gachaRarityOf(item)} />
            </button>
          </li>
        ))}
      </ul>
      {/* B5：あいていた下の余白に、とびら君がひとこと（目玉をすすめる） */}
      <div className="gacha-banner-buddy">
        <TobiraBuddy size="sm" input={{ screen: 'gacha', seed: featured.week }} line={`${def.title}の目玉は「${hero.label}」！${gachaRarityOf(hero)}はめったに出ないよ`} />
      </div>
      <nav className="gacha-banner-links" aria-label={`${def.title}の案内`}>
        <button type="button" className="gacha-chip" aria-haspopup="dialog" onClick={onPickup} data-gacha-pickup-open>ピックアップ一覧</button>
        <button type="button" className="gacha-chip gacha-odds-toggle" aria-haspopup="dialog" onClick={onOdds}>提供割合</button>
        {coinsLow && <button type="button" className="gacha-chip" onClick={onMissions}><Target size={13} aria-hidden="true" />コインをためる</button>}
      </nav>
    </div>
  );
}
