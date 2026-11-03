/**
 * LR（レジェンドレア）：立命館大学 全学統一方式（文系）英語 対策 予想問題（白黒・A4・マーク式）。
 *   3回分 × 「問題（マーク式解答用紙つき）」「解答・解説（全訳つき）」の6種。各回 大問 I〜V・120点（独自配点）。
 *   英文・設問はすべて書き下ろしのオリジナル。登場する人物・団体・場所は架空。
 *   立命館大学の過去問・公式問題ではなく、大学とは関係がない（表紙と奥付に明記。tests/ritsuMockPrints.test.ts が確かめる）。
 *
 * PDF は scripts/gacha-prints/ritsu_mock/render.py で作る。pages / kb は実物の値を写す（テストが照合する）。
 */
import type { GachaPrintDef } from './gachaPrints.generated';

const q = (n: number, pages: number, kb: number): GachaPrintDef => ({
  id: `print_lr_ritsu_q_${n}`,
  label: `立命館大学 全学統一（文系） 英語 予想問題 第${n}回 問題（120点・大学とは無関係のオリジナル）`,
  subject: 'english_reading',
  category: '演習プリント',
  file: `/prints/print_lr_ritsu_q_${n}.pdf`,
  thumb: `/prints/thumbs/print_lr_ritsu_q_${n}.webp`,
  pages,
  kb,
});
const a = (n: number, pages: number, kb: number): GachaPrintDef => ({
  id: `print_lr_ritsu_a_${n}`,
  label: `立命館大学 全学統一（文系） 英語 予想問題 第${n}回 解答・解説（全訳つき）`,
  subject: 'english_reading',
  category: '演習プリント',
  file: `/prints/print_lr_ritsu_a_${n}.pdf`,
  thumb: `/prints/thumbs/print_lr_ritsu_a_${n}.webp`,
  pages,
  kb,
});

export const RITSU_MOCK_PRINTS: readonly GachaPrintDef[] = [
  q(1, 14, 679), a(1, 15, 921),
  q(2, 14, 676), a(2, 15, 885),
  q(3, 13, 676), a(3, 15, 889),
];
