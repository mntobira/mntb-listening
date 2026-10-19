/** growth.ts から分割（growthItems）。外部からは従来どおり growth.ts 経由で import できる。 */
import { GACHA_PRINTS } from '../../data/gachaPrints.generated';
import type { GachaPrintDef } from '../../data/gachaPrints.generated';
import { ACCESSORY_SLOTS, type AccessorySlot } from './tobiraParts';
import type { GrowthProgress } from './growthTypes';
import { badgeById } from './growthBadges';
import { levelOf } from './growthLevel';

export const DEFAULT_POSE = 'pose_basic';
export const DEFAULT_FRAME = 'frame_paper';
// ============================================================
// 扉くんの装備（ポーズ・枠）
// ============================================================

/**
 * pose / frame は扉くん本体、hat / glasses / cheek / aura は部位ごとのアクセサリ（重ねて描く）、
 * wallpaper はアプリの壁紙。print は大当たりの学習プリント（PDF・装備はしない）。
 */
export type ItemKind = 'pose' | 'frame' | AccessorySlot | 'wallpaper' | 'print';
/** 装備できる種類（equipped のキー） */
export type EquipKind = Exclude<ItemKind, 'print'>;
/** 外せる種類（アクセサリと壁紙。ポーズと枠は常に何か1つ） */
export const REMOVABLE_KINDS: readonly EquipKind[] = [...ACCESSORY_SLOTS, 'wallpaper'];
/** ガチャのレア度：N（ノーマル）/ R（レア）/ SR（スーパーレア）/ UR（大当たり＝学習プリント） */
export type GachaRarity = 'N' | 'R' | 'SR' | 'UR';

export interface ItemDef {
  id: string;
  kind: ItemKind;
  label: string;
  /** pose: 画像パス（public/mascots）／ frame: 色コード ／ アクセサリ: '形:色'（tobiraParts.ts）／ wallpaper: WALLPAPERS のキー ／ print: PDF のパス（public/prints） */
  value: string;
  gacha?: boolean;
  pattern?: 'dashed' | 'double' | 'dots' | 'rays' | 'stars' | 'stripes' | 'checker' | 'wave' | 'grid' | 'sparkle' | 'rainbow' | 'aurora' | 'neon' | 'prism' | 'galaxy';
  /** ガチャのレア度。省略時は gachaRarityOf() が入手条件から決める（N / R / SR）。UR は学習プリントだけ */
  rarity?: GachaRarity;
  /**
   * 入手条件。どれか1つ。
   *   level  … そのレベルで自動解放
   *   badge  … そのバッジで自動解放
   *   coins  … コインで交換
   *   gacha  … ガチャ限定（自動解放・コイン交換なし）
   */
  unlock: { level: number } | { badge: string } | { coins: number } | { gacha: true };
}

/**
 * 扉くんのポーズは public/mascots の画像。
 * 基本9枚に、ガチャ限定の新ポーズ（リスニング・実験・トロフィー）を追加。
 * 「ポーズを選べる」こと自体が装備で、レベルや実績・コイン・ガチャで順に解放する。
 * gacha: true を付けたものはガチャの抽選対象にも入る（レベル解放と併用可）。
 */
/**
 * レベル報酬の学習プリント（UR）。ガチャからは出ない。レベルに届いたら自動で手に入る。
 * PDF は scripts/gacha-prints/build-level-ur.py で作る。
 */
export const LEVEL_PRINTS: readonly GachaPrintDef[] = [
  { id: 'print_level_listening_howto', label: '共通テスト リスニングの聞き方（大問別の聞き方と毎日の練習法）', subject: 'english_listening', category: '出題傾向', file: '/prints/print_level_listening_howto.pdf', thumb: '/prints/thumbs/print_level_listening_howto.webp', pages: 2, kb: 82 },
];

/** レベルでだけ解放される装備（ガチャ・ショップには出さない） */
export const LEVEL_REWARD_ITEMS: readonly ItemDef[] = [
  { id: 'lv_cheek_star', kind: 'cheek', rarity: 'R', label: 'ほしのペイント（Lv.3）', value: 'star:#FFD43B', unlock: { level: 3 } },
  { id: 'lv_glasses_round', kind: 'glasses', rarity: 'R', label: '学者のまるメガネ（Lv.7）', value: 'round:#8B5E34', unlock: { level: 7 } },
  { id: 'lv_aura_notes', kind: 'aura', rarity: 'SR', label: 'リスニングのおんぷ（Lv.12）', value: 'notes:#2F9E8F', unlock: { level: 12 } },
  { id: 'print_level_listening_howto', kind: 'print', rarity: 'UR', label: LEVEL_PRINTS[0].label, value: LEVEL_PRINTS[0].file, unlock: { level: 15 } },
  { id: 'lv_wall_gold', kind: 'wallpaper', rarity: 'SR', label: '壁紙：黄金の書斎（Lv.25）', value: 'gold', unlock: { level: 25 } },
  { id: 'lv_frame_aurora', kind: 'frame', rarity: 'UR', label: 'マスターのオーロラフレーム（Lv.30）', value: '#8657c5', pattern: 'aurora', unlock: { level: 30 } },
];

export const ITEMS: readonly ItemDef[] = [
  { id: 'frame_league_aurora', kind: 'frame', rarity: 'UR', label: 'リーグ・オーロラフレーム', value: '#8657c5', pattern: 'aurora', unlock: { gacha: true } },
  { id: 'pose_basic', kind: 'pose', label: '基本', value: '/mascots/basic.webp', unlock: { level: 1 } },
  { id: 'pose_walking', kind: 'pose', gacha: true, label: 'おさんぽ', value: '/mascots/walking.webp', unlock: { level: 3 } },
  { id: 'pose_studying', kind: 'pose', gacha: true, label: '勉強中', value: '/mascots/studying.webp', unlock: { level: 5 } },
  { id: 'pose_thinking', kind: 'pose', gacha: true, label: '考え中', value: '/mascots/thinking.webp', unlock: { level: 8 } },
  { id: 'pose_good', kind: 'pose', gacha: true, label: 'グッド！', value: '/mascots/good.webp', unlock: { badge: 'b_first_win' } },
  { id: 'pose_cheering', kind: 'pose', label: '応援', value: '/mascots/cheering.webp', unlock: { coins: 120 } },
  { id: 'pose_happy', kind: 'pose', gacha: true, label: 'よろこび', value: '/mascots/happy.webp', unlock: { badge: 'b_perfect' } },
  { id: 'pose_bowing', kind: 'pose', gacha: true, label: 'おじぎ', value: '/mascots/bowing.webp', unlock: { badge: 'b_holes_10' } },
  { id: 'pose_sleeping', kind: 'pose', label: 'おひるね', value: '/mascots/sleeping.webp', unlock: { coins: 200 } },
  // ── ガチャ限定の新ポーズ（コイン交換不可・ガチャのみ）──
  { id: 'pose_listening', kind: 'pose', gacha: true, label: 'リスニング中', value: '/mascots/listening.webp', unlock: { gacha: true } },
  { id: 'pose_science', kind: 'pose', gacha: true, label: '実験中', value: '/mascots/science.webp', unlock: { gacha: true } },
  { id: 'pose_trophy', kind: 'pose', gacha: true, label: '優勝トロフィー', value: '/mascots/trophy.webp', unlock: { gacha: true } },
  // ── SR（スーパーレア）限定フレーム：ガチャからだけ出る ──
  { id: 'frame_prism', kind: 'frame', gacha: true, rarity: 'SR', label: 'プリズム', value: '#C471ED', pattern: 'prism', unlock: { gacha: true } },
  { id: 'frame_galaxy', kind: 'frame', gacha: true, rarity: 'SR', label: 'ギャラクシー', value: '#1E1B4B', pattern: 'galaxy', unlock: { gacha: true } },
  { id: 'frame_paper', kind: 'frame', label: 'ノート', value: '#E5E7EB', unlock: { level: 1 } },
  { id: 'frame_green', kind: 'frame', label: 'わかば', value: '#2ECC71', unlock: { level: 5 } },
  { id: 'frame_blue', kind: 'frame', label: 'そら', value: '#3498DB', unlock: { level: 10 } },
  { id: 'frame_purple', kind: 'frame', label: 'すみれ', value: '#9B59B6', unlock: { level: 20 } },
  { id: 'frame_gold', kind: 'frame', label: 'ゴールド', value: '#F4D03F', unlock: { badge: 'b_wins_10' } },
  { id: 'frame_pink', kind: 'frame', label: 'さくら', value: '#D9A0A0', unlock: { coins: 80 } },
  { id: 'frame_mint', kind: 'frame', label: 'ミント', value: '#74B7A3', unlock: { coins: 60 } },
  { id: 'frame_ocean', kind: 'frame', label: 'マリン', value: '#4D93AE', unlock: { coins: 100 } },
  { id: 'frame_lavender', kind: 'frame', label: 'ラベンダー', value: '#B09BC7', unlock: { coins: 140 } },
  { id: 'frame_coral', kind: 'frame', label: 'コーラル', value: '#DD8F79', unlock: { coins: 160 } },
  { id: 'frame_midnight', kind: 'frame', label: '星空', value: '#3F527C', unlock: { coins: 200 } },
  { id: 'frame_stitch', kind: 'frame', label: '手帳ステッチ', value: '#B58164', pattern: 'dashed', unlock: { coins: 120 } },
  { id: 'frame_medal', kind: 'frame', label: '二重のメダル', value: '#BBA049', pattern: 'double', unlock: { coins: 180 } },
  { id: 'frame_bubbles', kind: 'frame', label: 'ソーダバブル', value: '#62A8BB', pattern: 'dots', unlock: { coins: 150 } },
  { id: 'frame_sunrise', kind: 'frame', label: '朝日のリング', value: '#DA9B65', pattern: 'rays', unlock: { coins: 180 } },
  { id: 'frame_constellation', kind: 'frame', label: '星めぐり', value: '#7A76B0', pattern: 'stars', unlock: { coins: 220 } },
  // ── 追加フレーム（ガチャ増量分）──
  { id: 'frame_candy', kind: 'frame', label: 'キャンディ', value: '#E98BA5', pattern: 'stripes', unlock: { coins: 130 } },
  { id: 'frame_checker', kind: 'frame', label: 'チェッカー', value: '#5B6B7F', pattern: 'checker', unlock: { coins: 140 } },
  { id: 'frame_wave', kind: 'frame', label: 'さざなみ', value: '#4FA3C7', pattern: 'wave', unlock: { coins: 150 } },
  { id: 'frame_graph', kind: 'frame', label: 'グラフ用紙', value: '#6FA88C', pattern: 'grid', unlock: { coins: 110 } },
  { id: 'frame_sparkle', kind: 'frame', label: 'きらめき', value: '#C9A227', pattern: 'sparkle', unlock: { coins: 240 } },
  { id: 'frame_rainbow', kind: 'frame', label: 'レインボー', value: '#E76F51', pattern: 'rainbow', unlock: { coins: 260 } },
  { id: 'frame_aurora', kind: 'frame', label: 'オーロラ', value: '#3FA796', pattern: 'aurora', unlock: { coins: 280 } },
  { id: 'frame_neon', kind: 'frame', label: 'ネオン', value: '#7C3AED', pattern: 'neon', unlock: { coins: 300 } },
  { id: 'frame_lemon', kind: 'frame', label: 'レモン', value: '#F2D16B', unlock: { coins: 70 } },
  { id: 'frame_grape', kind: 'frame', label: 'ぶどう', value: '#8E5EA2', unlock: { coins: 90 } },
  { id: 'frame_chocolate', kind: 'frame', label: 'チョコ', value: '#7B4B2A', unlock: { coins: 100 } },
  { id: 'frame_ice', kind: 'frame', label: 'アイス', value: '#A8DDE9', unlock: { coins: 90 } },
  { id: 'frame_fire', kind: 'frame', label: 'ほのお', value: '#E67E22', unlock: { badge: 'b_streak_5' } },
  // ── 演習・マナラッシュの実績で解放（ガチャ・交換なし）──
  { id: 'frame_scholar', kind: 'frame', label: '努力の証', value: '#2F7D6D', pattern: 'double', unlock: { badge: 'b_study_50' } },
  { id: 'frame_lightning', kind: 'frame', label: 'イナズマ', value: '#E0A800', pattern: 'rays', unlock: { badge: 'b_rush_2500' } },
  { id: 'frame_comet', kind: 'frame', label: 'コメット', value: '#5A67D8', pattern: 'sparkle', unlock: { badge: 'b_rush_combo10' } },
  // ── 部位ごとのアクセサリ（とびら君に重ねて描く・ガチャ限定）。value は '形:色'（tobiraParts.ts）──
  // 頭（帽子）
  { id: 'hat_beanie_red', kind: 'hat', gacha: true, rarity: 'N', label: 'ニット帽（あか）', value: 'beanie:#E76F51', unlock: { gacha: true } },
  { id: 'hat_beanie_navy', kind: 'hat', gacha: true, rarity: 'N', label: 'ニット帽（こん）', value: 'beanie:#3D5A80', unlock: { gacha: true } },
  { id: 'hat_cap_blue', kind: 'hat', gacha: true, rarity: 'N', label: 'キャップ（そら）', value: 'cap:#4D96FF', unlock: { gacha: true } },
  { id: 'hat_cap_green', kind: 'hat', gacha: true, rarity: 'N', label: 'キャップ（みどり）', value: 'cap:#43AA8B', unlock: { gacha: true } },
  { id: 'hat_ribbon_pink', kind: 'hat', gacha: true, rarity: 'N', label: 'リボン（ピンク）', value: 'ribbon:#F28AB2', unlock: { gacha: true } },
  { id: 'hat_flower', kind: 'hat', gacha: true, rarity: 'N', label: 'お花のかみかざり', value: 'flower:#FF8FAB', unlock: { gacha: true } },
  { id: 'hat_beret', kind: 'hat', gacha: true, rarity: 'R', label: 'ベレー帽', value: 'beret:#9B2226', unlock: { gacha: true } },
  { id: 'hat_bunny', kind: 'hat', gacha: true, rarity: 'R', label: 'うさみみ', value: 'bunny:#F8F9FA', unlock: { gacha: true } },
  { id: 'hat_chef', kind: 'hat', gacha: true, rarity: 'R', label: 'コック帽', value: 'chef:#E63946', unlock: { gacha: true } },
  { id: 'hat_graduation', kind: 'hat', gacha: true, rarity: 'R', label: '卒業帽（角帽）', value: 'graduation:#F4D03F', unlock: { gacha: true } },
  { id: 'hat_wizard', kind: 'hat', gacha: true, rarity: 'SR', label: '魔法使いの帽子', value: 'wizard:#5A4FCF', unlock: { gacha: true } },
  { id: 'hat_crown', kind: 'hat', gacha: true, rarity: 'SR', label: '王冠', value: 'crown:#F6C744', unlock: { gacha: true } },
  { id: 'hat_tiara', kind: 'hat', gacha: true, rarity: 'SR', label: 'ティアラ', value: 'tiara:#C0C8D6', unlock: { gacha: true } },
  { id: 'hat_halo', kind: 'hat', gacha: true, rarity: 'SR', label: '天使のわっか', value: 'halo:#FFD43B', unlock: { gacha: true } },
  // 顔（メガネ）
  { id: 'glasses_round', kind: 'glasses', gacha: true, rarity: 'N', label: 'まるメガネ', value: 'round:#3B2F2F', unlock: { gacha: true } },
  { id: 'glasses_square', kind: 'glasses', gacha: true, rarity: 'N', label: 'スクエアメガネ', value: 'square:#1D3557', unlock: { gacha: true } },
  { id: 'glasses_red', kind: 'glasses', gacha: true, rarity: 'N', label: 'あかぶちメガネ', value: 'round:#D62828', unlock: { gacha: true } },
  { id: 'glasses_science', kind: 'glasses', gacha: true, rarity: 'N', label: '実験用ゴーグル', value: 'science:#74C0FC', unlock: { gacha: true } },
  { id: 'glasses_sun', kind: 'glasses', gacha: true, rarity: 'R', label: 'サングラス', value: 'sun:#222222', unlock: { gacha: true } },
  { id: 'glasses_monocle', kind: 'glasses', gacha: true, rarity: 'R', label: '名探偵の片メガネ', value: 'monocle:#B8860B', unlock: { gacha: true } },
  { id: 'glasses_goggle', kind: 'glasses', gacha: true, rarity: 'R', label: 'スイミングゴーグル', value: 'goggle:#2A9D8F', unlock: { gacha: true } },
  { id: 'glasses_star', kind: 'glasses', gacha: true, rarity: 'SR', label: 'スターグラス', value: 'star:#F9C74F', unlock: { gacha: true } },
  { id: 'glasses_heart', kind: 'glasses', gacha: true, rarity: 'SR', label: 'ハートグラス', value: 'heart:#FF4D8D', unlock: { gacha: true } },
  // ほっぺ
  { id: 'cheek_blush', kind: 'cheek', gacha: true, rarity: 'N', label: 'ぽっとほっぺ', value: 'blush:#FF8FA3', unlock: { gacha: true } },
  { id: 'cheek_orange', kind: 'cheek', gacha: true, rarity: 'N', label: 'みかんほっぺ', value: 'blush:#FFA94D', unlock: { gacha: true } },
  { id: 'cheek_whisker', kind: 'cheek', gacha: true, rarity: 'N', label: 'ねこのおひげ', value: 'whisker:#5C4033', unlock: { gacha: true } },
  { id: 'cheek_sticker', kind: 'cheek', gacha: true, rarity: 'R', label: 'ばんそうこう', value: 'sticker:#F4C28F', unlock: { gacha: true } },
  { id: 'cheek_star', kind: 'cheek', gacha: true, rarity: 'R', label: 'ほしのペイント', value: 'star:#FFD43B', unlock: { gacha: true } },
  { id: 'cheek_heart', kind: 'cheek', gacha: true, rarity: 'R', label: 'ハートのペイント', value: 'heart:#FF6B9D', unlock: { gacha: true } },
  // オーラ（まわりに浮かぶ）
  { id: 'aura_bubbles', kind: 'aura', gacha: true, rarity: 'N', label: 'シャボン玉', value: 'bubbles:#74C0FC', unlock: { gacha: true } },
  { id: 'aura_petals', kind: 'aura', gacha: true, rarity: 'N', label: '桜ふぶき', value: 'petals:#F9A8C9', unlock: { gacha: true } },
  { id: 'aura_notes', kind: 'aura', gacha: true, rarity: 'R', label: 'おんぷ', value: 'notes:#9775FA', unlock: { gacha: true } },
  { id: 'aura_formula', kind: 'aura', gacha: true, rarity: 'R', label: '数式と化学式', value: 'formula:#4C6EF5', unlock: { gacha: true } },
  { id: 'aura_hearts', kind: 'aura', gacha: true, rarity: 'R', label: 'ハート', value: 'hearts:#FF6B9D', unlock: { gacha: true } },
  { id: 'aura_sparkle', kind: 'aura', gacha: true, rarity: 'SR', label: 'きらきら', value: 'sparkle:#FFC300', unlock: { gacha: true } },
  { id: 'aura_stars', kind: 'aura', gacha: true, rarity: 'SR', label: '流れ星', value: 'stars:#FFD166', unlock: { gacha: true } },
  { id: 'aura_flame', kind: 'aura', gacha: true, rarity: 'SR', label: 'やる気の炎', value: 'flame:#FF7B00', unlock: { gacha: true } },
  // ── アプリの壁紙（ホームなどの背景）──
  { id: 'wall_grid', kind: 'wallpaper', gacha: true, rarity: 'N', label: '壁紙：方眼ノート', value: 'grid', unlock: { gacha: true } },
  { id: 'wall_lined', kind: 'wallpaper', gacha: true, rarity: 'N', label: '壁紙：大学ノート', value: 'lined', unlock: { gacha: true } },
  { id: 'wall_mint', kind: 'wallpaper', gacha: true, rarity: 'N', label: '壁紙：ミントストライプ', value: 'mint', unlock: { gacha: true } },
  { id: 'wall_sakura', kind: 'wallpaper', gacha: true, rarity: 'N', label: '壁紙：桜', value: 'sakura', unlock: { gacha: true } },
  { id: 'wall_forest', kind: 'wallpaper', gacha: true, rarity: 'N', label: '壁紙：森の小道', value: 'forest', unlock: { gacha: true } },
  { id: 'wall_ocean', kind: 'wallpaper', gacha: true, rarity: 'R', label: '壁紙：海', value: 'ocean', unlock: { gacha: true } },
  { id: 'wall_sunset', kind: 'wallpaper', gacha: true, rarity: 'R', label: '壁紙：夕焼け', value: 'sunset', unlock: { gacha: true } },
  { id: 'wall_chem', kind: 'wallpaper', gacha: true, rarity: 'R', label: '壁紙：化学式柄', value: 'chem', unlock: { gacha: true } },
  { id: 'wall_math', kind: 'wallpaper', gacha: true, rarity: 'R', label: '壁紙：数式柄', value: 'math', unlock: { gacha: true } },
  { id: 'wall_music', kind: 'wallpaper', gacha: true, rarity: 'R', label: '壁紙：五線譜', value: 'music', unlock: { gacha: true } },
  { id: 'wall_chalk', kind: 'wallpaper', gacha: true, rarity: 'R', label: '壁紙：黒板', value: 'chalk', unlock: { gacha: true } },
  { id: 'wall_night', kind: 'wallpaper', gacha: true, rarity: 'SR', label: '壁紙：夜空', value: 'night', unlock: { gacha: true } },
  { id: 'wall_aurora', kind: 'wallpaper', gacha: true, rarity: 'SR', label: '壁紙：オーロラ', value: 'aurora', unlock: { gacha: true } },
  { id: 'wall_galaxy', kind: 'wallpaper', gacha: true, rarity: 'SR', label: '壁紙：銀河', value: 'galaxy', unlock: { gacha: true } },
  { id: 'wall_rainbow', kind: 'wallpaper', gacha: true, rarity: 'SR', label: '壁紙：レインボー', value: 'rainbow', unlock: { gacha: true } },
  { id: 'wall_gold', kind: 'wallpaper', gacha: true, rarity: 'SR', label: '壁紙：黄金の書斎', value: 'gold', unlock: { gacha: true } },
  // ── UR（大当たり）：学習プリント PDF。ガチャからだけ出る（一覧は gachaPrints.generated.ts）──
  ...GACHA_PRINTS.map((p): ItemDef => ({ id: p.id, kind: 'print', gacha: true, rarity: 'UR', label: p.label, value: p.file, unlock: { gacha: true } })),
  // ── レベル報酬（2026-10-04 ご要望「レベルを上げる意味」）：このレベルでしか手に入らないもの ──
  ...LEVEL_REWARD_ITEMS,
];

/** 学習プリント（UR）の詳細（サムネイル・ページ数など）。プリントでなければ undefined */
export function printOf(id: string): GachaPrintDef | undefined {
  return GACHA_PRINTS.find((p) => p.id === id) ?? LEVEL_PRINTS.find((p) => p.id === id);
}

/**
 * ガチャのレア度。
 *   UR … 大当たりの学習プリント（rarity:'UR' 指定のみ）
 *   SR … ガチャ限定のもの（rarity:'SR' 指定・または unlock:{gacha:true}）
 *   R  … 模様つきフレーム・200枚以上の交換品・称号で解放されるポーズ
 *   N  … それ以外
 */
export function gachaRarityOf(item: ItemDef): GachaRarity {
  if (item.rarity) return item.rarity;
  if ('gacha' in item.unlock) return 'SR';
  if (item.pattern || ('coins' in item.unlock && item.unlock.coins >= 200) || ('badge' in item.unlock)) return 'R';
  return 'N';
}

export function itemById(id: string): ItemDef | undefined {
  return ITEMS.find((i) => i.id === id);
}

/** 自動解放（レベル・バッジ条件）で新しく手に入る装備 */
export function evaluateUnlocks(progress: GrowthProgress): string[] {
  const level = levelOf(progress.xp).level;
  const out: string[] = [];
  for (const item of ITEMS) {
    if (progress.owned.includes(item.id)) continue;
    if ('level' in item.unlock && level >= item.unlock.level) out.push(item.id);
    else if ('badge' in item.unlock && item.unlock.badge in progress.badges) out.push(item.id);
  }
  return out;
}

/** コインで装備を交換する */
export function purchaseItem(
  progress: GrowthProgress,
  id: string,
): { next: GrowthProgress; ok: boolean; reason?: string } {
  const item = itemById(id);
  if (!item) return { next: progress, ok: false, reason: 'その装備はありません。' };
  if (progress.owned.includes(id)) return { next: progress, ok: false, reason: 'すでに持っています。' };
  if (!('coins' in item.unlock)) return { next: progress, ok: false, reason: 'コインでは交換できません。' };
  if (progress.coins < item.unlock.coins) {
    return {
      next: progress,
      ok: false,
      reason: `コインが ${item.unlock.coins - progress.coins} 足りません。`,
    };
  }
  return {
    next: { ...progress, coins: progress.coins - item.unlock.coins, owned: [...progress.owned, id] },
    ok: true,
  };
}

/** 装備を身につける（持っていないものは拒否） */
export function equipItem(progress: GrowthProgress, id: string): GrowthProgress {
  const item = itemById(id);
  // 学習プリントは装備ではない（equipped に入れると扉くんの表示が壊れる）
  if (!item || item.kind === 'print' || !progress.owned.includes(id)) return progress;
  return { ...progress, equipped: { ...progress.equipped, [item.kind]: id } };
}

/**
 * 装備を外す（2026-10-06：一度付けた装備を外せるように）。
 *   ・帽子・メガネ・ほっぺ・オーラ・壁紙 → 何も付けない（''）
 *   ・ポーズ・フレーム → 「なし」は無いので最初の基本（基本ポーズ・紙のフレーム）に戻す
 *   ・称号は equipTitle('') で外す（ここでは扱わない）
 */
export function unequipKind(progress: GrowthProgress, kind: EquipKind): GrowthProgress {
  const fallback = kind === 'pose' ? DEFAULT_POSE : kind === 'frame' ? DEFAULT_FRAME : '';
  if (!REMOVABLE_KINDS.includes(kind) && kind !== 'pose' && kind !== 'frame') return progress;
  if ((progress.equipped[kind] || '') === fallback) return progress;
  return { ...progress, equipped: { ...progress.equipped, [kind]: fallback } };
}

/** その装備を外せるか（いま付けていて、外すと見た目が変わるもの） */
export function canUnequip(progress: GrowthProgress, item: { id: string; kind: string }): boolean {
  if (progress.equipped[item.kind as EquipKind] !== item.id) return false;
  if (item.kind === 'pose') return item.id !== DEFAULT_POSE;
  if (item.kind === 'frame') return item.id !== DEFAULT_FRAME;
  return REMOVABLE_KINDS.includes(item.kind as EquipKind);
}

/** 装備中のアクセサリの見た目（'形:色'）。持っていない・種類が違うものは無視 */
export function equippedAccessory(progress: GrowthProgress, slot: AccessorySlot): string | undefined {
  const id = progress.equipped[slot];
  const item = id ? itemById(id) : undefined;
  return item && item.kind === slot && progress.owned.includes(id) ? item.value : undefined;
}

/** 装備中の壁紙のキー（WALLPAPERS）。無ければ '' */
export function equippedWallpaper(progress: GrowthProgress): string {
  const id = progress.equipped.wallpaper;
  const item = id ? itemById(id) : undefined;
  return item && item.kind === 'wallpaper' && progress.owned.includes(id) ? item.value : '';
}

/** 称号を身につける（'' でレート称号に戻す。持っていないバッジは拒否） */
export function equipTitle(progress: GrowthProgress, badgeId: string): GrowthProgress {
  if (badgeId !== '' && !(badgeId in progress.badges)) return progress;
  return { ...progress, equipped: { ...progress.equipped, title: badgeId } };
}

/** 身につけているポーズの画像パス（壊れていれば基本） */
export function equippedPoseSrc(progress: GrowthProgress): string {
  const item = itemById(progress.equipped.pose);
  return item && item.kind === 'pose' ? item.value : '/mascots/basic.webp';
}

/** 身につけている枠の色 */
export function equippedFramePattern(progress: GrowthProgress): string {
  return itemById(progress.equipped.frame)?.pattern || 'plain';
}

export function equippedFrameColor(progress: GrowthProgress): string {
  const item = itemById(progress.equipped.frame);
  return item && item.kind === 'frame' ? item.value : '#E5E7EB';
}

/** 表示する称号（バッジ称号を選んでいればそれ、無ければ null＝レート称号を使う） */
export function equippedTitleLabel(progress: GrowthProgress): string | null {
  if (!progress.equipped.title) return null;
  const b = badgeById(progress.equipped.title);
  if (!b || !(b.id in progress.badges)) return null;
  return b.label;
}
