/**
 * ガチャの種類（2026-10-29 追加）：共通テストガチャ（これまでの1つ）と、2次試験ガチャ。
 *   ガチャ画面で左右にスワイプして切り替える。抽選の仕組み（割合・10＋1連・ダブりの返還・かけら）は共通。
 *
 *   ・共通テストガチャ … これまでどおり（LR＝共通テスト英語 予想問題）。2次試験ガチャ専用の景品は出ない。
 *   ・2次試験ガチャ   … LR＝国公立2次 英語 予想問題（名古屋大学・静岡大学 前期対策・書き下ろし）。
 *                        それ以外は「新しく作った2次試験向けの装飾」＋「今ある景品の使い回し」（難関向けの単語・熟語・文法の本など）。
 *
 * このファイルは ITEMS を import しない（growthItems → ここ の循環を避けるため、ID だけ持つ）。
 */
import { NIJI_MOCK_PRINTS } from '../../data/nijiMockPrints';

export type GachaPoolId = 'kyotsu' | 'niji';

export interface GachaPoolDef {
  id: GachaPoolId;
  /** バナーの見出し */
  title: string;
  /** 切替タブの短い名前 */
  short: string;
  /** LR の中身（提供割合・ピックアップの説明に使う） */
  lrName: string;
  lrNote: string;
  /** UR の目玉に優先する科目 */
  preferSubjects: readonly string[];
}

export const GACHA_POOLS: readonly GachaPoolDef[] = [
  {
    id: 'kyotsu',
    title: '共通テストガチャ',
    short: '共通テスト',
    lrName: '共通テスト英語 予想問題',
    lrNote: 'リーディング・リスニング 各5回分。本番と同じ形式・分量のオリジナル問題。',
    preferSubjects: ['english_listening', 'english_vocab', 'english_grammar'],
  },
  {
    id: 'niji',
    title: '2次試験ガチャ',
    short: '2次試験',
    lrName: '国公立2次 英語 予想問題',
    lrNote: '名古屋大学・静岡大学・大阪公立大学 前期の出題形式に沿った書き下ろしの予想問題（解答解説つき）各3回分（大阪公立大学は第3問の系統別にA・B各3回）。大学の過去問・公式問題ではありません。',
    preferSubjects: ['english_vocab', 'english_grammar', 'english_reading'],
  },
];

export const DEFAULT_GACHA_POOL: GachaPoolId = 'kyotsu';

export function gachaPoolOf(id: GachaPoolId): GachaPoolDef {
  return GACHA_POOLS.find((p) => p.id === id) ?? GACHA_POOLS[0];
}

/** 2次試験ガチャのために新しく作った装飾（共通テストガチャには出ない） */
export const NIJI_NEW_ITEM_IDS: readonly string[] = [
  'hat_hachimaki_red', 'hat_hachimaki_navy', 'hat_hachimaki_gold',
  'aura_pencil', 'aura_pencil_gold',
  'wall_campus', 'wall_sheet', 'wall_nightdesk', 'wall_dawn',
  'frame_niji_ink', 'frame_niji_sakura', 'frame_niji_midnight',
];

/** 2次試験ガチャだけで出るもの（新しい装飾＋LRの予想問題） */
export const NIJI_ONLY_IDS: ReadonlySet<string> = new Set([...NIJI_NEW_ITEM_IDS, ...NIJI_MOCK_PRINTS.map((p) => p.id)]);

/** 2次試験ガチャでも出る、今ある景品（使い回し。共通テストガチャからも引き続き出る） */
export const NIJI_SHARED_IDS: readonly string[] = [
  // UR（完全版の本）：2次・難関でも使えるもの
  'print_book_vocab_adv', 'print_book_idiom_all', 'print_book_idiom_reading_standard', 'print_book_idiom_reading_advanced',
  'print_book_grammar_b4_bunpo', 'print_book_grammar_b4_gohou',
  // SR（学習プリント）
  'print_vocab_lv3', 'print_vocab_lv3_2', 'print_vocab_lv4', 'print_grammar_100',
  // 装飾（勉強・英語・夜の自習の雰囲気のもの）
  'pose_studying', 'pose_thinking', 'pose_trophy', 'frame_prism',
  'hat_graduation', 'hat_beanie_navy', 'hat_wizard',
  'glasses_round', 'glasses_square', 'glasses_monocle', 'glasses_star',
  'cheek_blush', 'cheek_sticker',
  'aura_abc', 'aura_formula', 'aura_flame', 'aura_stars',
  'wall_grid', 'wall_lined', 'wall_library', 'wall_english', 'wall_chalk', 'wall_night',
];

/** そのアイテムがガチャの種類 pool に入るか（ガチャで出る物かどうかの判定は呼び出し側） */
export function inGachaPool(id: string, pool: GachaPoolId): boolean {
  if (pool === 'niji') return NIJI_ONLY_IDS.has(id) || NIJI_SHARED_IDS.includes(id);
  return !NIJI_ONLY_IDS.has(id);
}
