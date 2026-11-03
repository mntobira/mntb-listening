/**
 * LR（レジェンドレア）：弘前大学 前期日程 英語（英語を課す学部で共通）対策 予想問題（白黒・A4）。
 *   3回分 × 「問題（解答用紙つき）」「解答・解説（全訳つき）」の6種。各回 大問1〜4・200点（独自配点）。
 *   英文・日本文・設問はすべて書き下ろしのオリジナル。登場する人物・団体・地名は架空。
 *   弘前大学の過去問・公式問題ではなく、大学とは関係がない（表紙と奥付に明記。tests/hirosakiMockPrints.test.ts が確かめる）。
 *
 * PDF は scripts/gacha-prints/hirosaki_mock/render.py で作る。pages / kb は実物の値を写す（テストが照合する）。
 */
import type { GachaPrintDef } from './gachaPrints.generated';

const q = (n: number, pages: number, kb: number): GachaPrintDef => ({
  id: `print_lr_hirosaki_q_${n}`,
  label: `弘前大学 前期 英語 予想問題 第${n}回 問題（200点・大学とは無関係のオリジナル）`,
  subject: 'english_reading',
  category: '演習プリント',
  file: `/prints/print_lr_hirosaki_q_${n}.pdf`,
  thumb: `/prints/thumbs/print_lr_hirosaki_q_${n}.webp`,
  pages,
  kb,
});
const a = (n: number, pages: number, kb: number): GachaPrintDef => ({
  id: `print_lr_hirosaki_a_${n}`,
  label: `弘前大学 前期 英語 予想問題 第${n}回 解答・解説（全訳つき）`,
  subject: 'english_reading',
  category: '演習プリント',
  file: `/prints/print_lr_hirosaki_a_${n}.pdf`,
  thumb: `/prints/thumbs/print_lr_hirosaki_a_${n}.webp`,
  pages,
  kb,
});

export const HIROSAKI_MOCK_PRINTS: readonly GachaPrintDef[] = [
  q(1, 12, 649), a(1, 19, 893),
  q(2, 12, 638), a(2, 18, 862),
  q(3, 11, 634), a(3, 16, 827),
];
