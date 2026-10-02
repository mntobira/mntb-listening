import { ITEMS, gachaRarityOf, type GachaRarity, type GrowthProgress, type ItemDef } from './growth';
import type { MatchSummaryForGrowth } from './growth';
export const GACHA_COST = 100;
export const GACHA_MULTI_COST = 1000;
export const GACHA_MULTI_COUNT = 11;
export const VIDEO_GACHA_DAILY_LIMIT = 5;
export const GACHA_DUPLICATE_REFUND = 20;
/** SR の重複はうれしさが減らないよう多めに返す。UR（学習プリント）の重複は全額返す */
export const GACHA_DUPLICATE_REFUND_BY_RARITY: Record<GachaRarity, number> = { N: 20, R: 25, SR: 40, UR: 100 };
export const gachaItems = () => ITEMS.filter(item => 'coins' in item.unlock || item.gacha);

/**
 * レア枠の提供割合（合計 1）。枠を決めてから、その枠の中で等確率に1つ選ぶ。
 * UR（大当たり）＝学習プリント PDF。枠全体で 5%、プリントが多いので1種あたりは 0.1% 台。
 */
export const GACHA_RARITY_RATES: Record<GachaRarity, number> = { UR: 0.05, SR: 0.05, R: 0.25, N: 0.65 };
export const GACHA_RARITY_ORDER: readonly GachaRarity[] = ['UR', 'SR', 'R', 'N'];
export const GACHA_RARITY_LABELS: Record<GachaRarity, string> = { UR: '大当たり（学習プリント）', SR: 'スーパーレア', R: 'レア', N: 'ノーマル' };

export function gachaItemsByRarity(): Record<GachaRarity, ItemDef[]> {
  const out: Record<GachaRarity, ItemDef[]> = { UR: [], SR: [], R: [], N: [] };
  for (const item of gachaItems()) out[gachaRarityOf(item)].push(item);
  return out;
}

/** 1つのアイテムの提供割合（0〜1） */
export function gachaItemRate(item: ItemDef, minRarity: GachaRarity = 'N'): number {
  const table = rarityTable(minRarity);
  const tier = gachaRarityOf(item);
  const entry = table.find(t => t.rarity === tier);
  if (!entry) return 0;
  return entry.rate / gachaItemsByRarity()[tier].length;
}

/** minRarity 以上だけで割合を振り直した表（5連の「R以上確定」枠で使う） */
function rarityTable(minRarity: GachaRarity) {
  const groups = gachaItemsByRarity();
  const allowed = GACHA_RARITY_ORDER.slice(0, GACHA_RARITY_ORDER.indexOf(minRarity) + 1).filter(r => groups[r].length > 0);
  const sum = allowed.reduce((n, r) => n + GACHA_RARITY_RATES[r], 0);
  return allowed.map(r => ({ rarity: r, rate: GACHA_RARITY_RATES[r] / sum }));
}

/** 乱数 [0,1) → アイテム。前半で枠を決め、枠の中の位置は同じ乱数を引き伸ばして使う（乱数1個で決まる） */
export function pickGachaItem(random: number, minRarity: GachaRarity = 'N'): { item: ItemDef; rarity: GachaRarity } | null {
  if (!Number.isFinite(random) || random < 0 || random >= 1) return null;
  const groups = gachaItemsByRarity();
  let acc = 0;
  for (const { rarity, rate } of rarityTable(minRarity)) {
    if (random < acc + rate || rate === 0) {
      const within = Math.min(0.999999999, Math.max(0, (random - acc) / rate));
      const list = groups[rarity];
      const item = list[Math.floor(within * list.length)];
      return item ? { item, rarity } : null;
    }
    acc += rate;
  }
  const last = rarityTable(minRarity).at(-1);
  const list = last ? groups[last.rarity] : [];
  return list.length ? { item: list[list.length - 1], rarity: last!.rarity } : null;
}

export function matchCoins(match: MatchSummaryForGrowth) {
  const active = !match.forfeit && match.score.perQuestion.some(q => q.answered || q.correct);
  const finish = active ? 10 : 0;
  const correct = active ? Math.max(0, match.score.correctCount) * 2 : 0;
  const victory = active && match.outcome === 'win' ? 10 : 0;
  return { finish, correct, victory, total: finish + correct + victory };
}
export function rollGacha(progress: GrowthProgress, random: number, minRarity: GachaRarity = 'N', options: { cost?: number; refundDuplicates?: boolean } = {}) {
  const cost = options.cost ?? GACHA_COST;
  if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(random) || random < 0 || random >= 1 || progress.coins < cost) return null;
  const picked = pickGachaItem(random, minRarity);
  if (!picked) return null;
  const { item, rarity } = picked;
  const duplicate = progress.owned.includes(item.id);
  const refund = duplicate && options.refundDuplicates !== false ? GACHA_DUPLICATE_REFUND_BY_RARITY[rarity] : 0;
  return { next: { ...progress, coins: progress.coins - cost + refund,
    owned: duplicate ? progress.owned : [...progress.owned, item.id] }, item, rarity, duplicate, refund };
}
