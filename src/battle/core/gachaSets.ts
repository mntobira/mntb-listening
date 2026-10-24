/**
 * ガチャの「セット収集」と「かけら交換」（2026-10-23 やり込み強化）
 *
 * ★なぜ入れたか★
 *   景品を増やすだけだと「ダブりが増えてつまらない」「欲しい物が永遠に出ない」になる。
 *   そこで次の2つで「引くほど前に進む」形にした（課金・換金はしない。強さも変わらない）。
 *     ① セット収集 … テーマごとに4つ集めると称号＋限定フレーム。完成したセット数でも称号
 *     ② かけら交換 … ダブるたびに「とびらのかけら」が貯まり、未所持のガチャ景品と交換できる（天井の代わり）
 *
 * このファイルは ITEMS を import しない（growthBadges → ここ の循環を避けるため、ID だけ持つ）。
 */
/** growthItems の GachaRarity と同じ（import すると growthItems → growthBadges → ここ で循環するので、ここでも定義する） */
type GachaRarity = 'N' | 'R' | 'SR' | 'UR' | 'LR';

export interface GachaSetDef {
  id: string;
  label: string;
  /** 集める4つ（すべてガチャで出るもの） */
  items: readonly string[];
  /** 完成でもらえる称号（バッジID） */
  badge: string;
  /** 完成でもらえる限定フレーム（ガチャには出ない） */
  reward: string;
}

export const GACHA_SETS: readonly GachaSetDef[] = [
  { id: 'set_sprout', label: '芽ぶきセット', items: ['hat_sprout', 'cheek_sparkle', 'aura_petals', 'wall_forest'], badge: 'b_set_sprout', reward: 'frame_set_sprout' },
  { id: 'set_listening', label: 'リスニングの達人セット', items: ['hat_headphones', 'aura_notes', 'wall_music', 'pose_listening'], badge: 'b_set_listening', reward: 'frame_set_listening' },
  { id: 'set_english', label: '英語マスターセット', items: ['aura_abc', 'wall_english', 'glasses_monocle', 'hat_graduation'], badge: 'b_set_english', reward: 'frame_set_english' },
  { id: 'set_sweets', label: 'スイーツセット', items: ['wall_candy', 'hat_ribbon_pink', 'cheek_heart', 'aura_hearts'], badge: 'b_set_sweets', reward: 'frame_set_sweets' },
  { id: 'set_winter', label: '冬じたくセット', items: ['hat_beanie_navy', 'aura_snow', 'cheek_blush', 'wall_night'], badge: 'b_set_winter', reward: 'frame_set_winter' },
  { id: 'set_hero', label: 'イナズマヒーローセット', items: ['aura_bolt', 'glasses_pixel', 'hat_crown', 'wall_sky'], badge: 'b_set_hero', reward: 'frame_set_hero' },
];

/** セットを何個完成させると「コレクター」称号か */
export const SETS_FOR_COLLECTOR = 3;

export function setProgress(owned: readonly string[], set: GachaSetDef): { have: number; total: number; done: boolean } {
  const have = set.items.filter((id) => owned.includes(id)).length;
  return { have, total: set.items.length, done: have === set.items.length };
}

export function completedSetCount(owned: readonly string[]): number {
  return GACHA_SETS.filter((s) => setProgress(owned, s).done).length;
}

export function setsOfItem(id: string): GachaSetDef[] {
  return GACHA_SETS.filter((s) => s.items.includes(id));
}

// ============================================================
// とびらのかけら（ダブりで貯まる・未所持の景品と交換）
// ============================================================

/** ダブったときにもらえるかけら（コイン返還とは別。無料の動画ガチャでももらえる） */
export const SHARDS_PER_DUPLICATE: Record<GachaRarity, number> = { N: 1, R: 2, SR: 5, UR: 8, LR: 10 };
/** 交換に必要なかけら。SR を 40 にして「SR がダブり続けても、8回で好きな SR が1つ確定」くらいにする */
export const SHARD_EXCHANGE_COST: Record<GachaRarity, number> = { N: 8, R: 16, SR: 40, UR: 60, LR: 80 };
