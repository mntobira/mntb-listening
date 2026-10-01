/**
 * ガチャの「今回の注目アイテム」（2026-10-01 C6・C8・C23）
 *
 *   ★アイテム名はここにも画面にも書かない★ 既存のガチャデータ（gachaItemsByRarity）から毎回組み立てる。
 *   ガチャの中身（ITEMS・学習プリント）を変えれば、注目アイテムも自動で入れ替わる。
 *
 *   ・並び：UR（目玉）→ SR → R（その他の注目）。UR はこのアプリでは学習プリント＝「学習系の大当たり」。
 *   ・「注目」は見せ方の話で、排出率とは別。割合は gachaItemRate()（本物の抽選表）をそのまま表示する。
 *   ・「今回」は週ごとに入れ替わる（全員同じ）。週の番号を種にした決まった並べ替えなので、乱数・保存は使わない。
 *   ・preferSubjects を渡すと、その科目の学習プリントを UR の目玉に優先する（この版は英語）。
 */
import { gachaItemsByRarity, gachaItemRate } from './arenaEconomy';
import type { GachaRarity, ItemDef } from './growth';
import { printOf } from './growth';

export interface FeaturedEntry { item: ItemDef; rarity: GachaRarity; rate: number }
export interface GachaFeatured {
  /** UR の目玉（1つ）。UR が空なら null */
  hero: FeaturedEntry | null;
  /** そのほかの注目（SR → R の順） */
  others: FeaturedEntry[];
  /** レア度ごとの種類数（「UR 50種」などの表示用） */
  counts: Record<GachaRarity, number>;
  /** いつの「今回」か（週の番号） */
  week: number;
}

/** 2026-01-05（月）起点の週番号。月曜で切り替わる */
export function featuredWeek(now: Date = new Date()): number {
  const base = Date.UTC(2026, 0, 5);
  const day = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((day - base) / (7 * 86400000));
}

/** 週番号を種にした決まった並べ替え（同じ週・同じデータなら同じ順） */
function rotate<T>(list: readonly T[], seed: number, salt: number): T[] {
  if (list.length === 0) return [];
  const step = (Math.abs(seed * 7919 + salt * 104729) % list.length);
  return [...list.slice(step), ...list.slice(0, step)];
}

export function gachaFeatured({ now = new Date(), preferSubjects = [], srCount = 2, rCount = 1 }: {
  now?: Date; preferSubjects?: readonly string[]; srCount?: number; rCount?: number;
} = {}): GachaFeatured {
  const tiers = gachaItemsByRarity();
  const week = featuredWeek(now);
  const entry = (item: ItemDef): FeaturedEntry => ({ item, rarity: tierOf(tiers, item), rate: gachaItemRate(item) });

  const ur = tiers.UR;
  const preferred = ur.filter(i => { const p = printOf(i.id); return !!p && preferSubjects.includes(p.subject); });
  const heroPool = preferred.length ? preferred : ur;
  const hero = heroPool.length ? entry(rotate(heroPool, week, 1)[0]) : null;

  // SR はとびら君の見た目が変わるもの（ポーズ・わく・アクセ）を先に。壁紙は後ろ
  const srSorted = [...tiers.SR].sort((a, b) => Number(a.kind === 'wallpaper') - Number(b.kind === 'wallpaper'));
  const sr = rotate(srSorted.filter(i => i.kind !== 'wallpaper'), week, 2).concat(srSorted.filter(i => i.kind === 'wallpaper')).slice(0, srCount);
  const r = rotate(tiers.R, week, 3).slice(0, rCount);

  return {
    hero,
    others: [...sr, ...r].map(entry),
    counts: { UR: tiers.UR.length, SR: tiers.SR.length, R: tiers.R.length, N: tiers.N.length },
    week,
  };
}
function tierOf(tiers: Record<GachaRarity, ItemDef[]>, item: ItemDef): GachaRarity {
  return (['UR', 'SR', 'R', 'N'] as const).find(r => tiers[r].includes(item)) ?? 'N';
}
