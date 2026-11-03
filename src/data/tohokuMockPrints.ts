/**
 * LR（レジェンドレア）：東北大学 前期日程 英語（全学部共通）対策 予想問題（白黒・A4）。
 *   3回分 × 「問題（解答用紙つき）」「解答・解説（全訳つき）」の6種。各回 大問Ⅰ〜Ⅳ・200点（独自配点）。
 *   英文・日本文・設問はすべて書き下ろしのオリジナル。登場する人物・団体・地名は架空。
 *   東北大学の過去問・公式問題ではなく、大学とは関係がない（表紙と奥付に明記。tests/tohokuMockPrints.test.ts が確かめる）。
 *
 * PDF は scripts/gacha-prints/tohoku_mock/render.py で作る。pages / kb は実物の値を写す（テストが照合する）。
 */
import type { GachaPrintDef } from './gachaPrints.generated';

const q = (n: number, pages: number, kb: number): GachaPrintDef => ({
  id: `print_lr_tohoku_q_${n}`,
  label: `東北大学 前期 英語 予想問題 第${n}回 問題（200点・大学とは無関係のオリジナル）`,
  subject: 'english_reading',
  category: '演習プリント',
  file: `/prints/print_lr_tohoku_q_${n}.pdf`,
  thumb: `/prints/thumbs/print_lr_tohoku_q_${n}.webp`,
  pages,
  kb,
});
const a = (n: number, pages: number, kb: number): GachaPrintDef => ({
  id: `print_lr_tohoku_a_${n}`,
  label: `東北大学 前期 英語 予想問題 第${n}回 解答・解説（全訳つき）`,
  subject: 'english_reading',
  category: '演習プリント',
  file: `/prints/print_lr_tohoku_a_${n}.pdf`,
  thumb: `/prints/thumbs/print_lr_tohoku_a_${n}.webp`,
  pages,
  kb,
});

export const TOHOKU_MOCK_PRINTS: readonly GachaPrintDef[] = [
  q(1, 14, 673), a(1, 20, 878),
  q(2, 14, 670), a(2, 20, 895),
  q(3, 14, 667), a(3, 21, 892),
];
