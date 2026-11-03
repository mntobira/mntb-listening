/**
 * LR（レジェンドレア）：大阪大学 前期日程 外国語（英語）対策 予想問題（白黒・A4）。
 *   3回分 × 「問題（解答用紙つき）」「解答・解説（採点基準・全訳つき）」の6種。各回 大問 I〜IV・150点（独自配点）。
 *   英文・日本文・設問はすべて書き下ろしのオリジナル。
 *   大阪大学の過去問・公式問題ではなく、大学とは関係がない（表紙と奥付に明記。tests/osakaMockPrints.test.ts が確かめる）。
 *
 * PDF は scripts/gacha-prints/osaka_mock/render.py で作る。pages / kb は実物の値を写す（テストが照合する）。
 */
import type { GachaPrintDef } from './gachaPrints.generated';

const q = (n: number, pages: number, kb: number): GachaPrintDef => ({
  id: `print_lr_osaka_q_${n}`,
  label: `大阪大学 前期 英語 予想問題 第${n}回 問題（150点・大学とは無関係のオリジナル）`,
  subject: 'english_reading',
  category: '演習プリント',
  file: `/prints/print_lr_osaka_q_${n}.pdf`,
  thumb: `/prints/thumbs/print_lr_osaka_q_${n}.webp`,
  pages,
  kb,
});
const a = (n: number, pages: number, kb: number): GachaPrintDef => ({
  id: `print_lr_osaka_a_${n}`,
  label: `大阪大学 前期 英語 予想問題 第${n}回 解答・解説（採点基準・全訳つき）`,
  subject: 'english_reading',
  category: '演習プリント',
  file: `/prints/print_lr_osaka_a_${n}.pdf`,
  thumb: `/prints/thumbs/print_lr_osaka_a_${n}.webp`,
  pages,
  kb,
});

export const OSAKA_MOCK_PRINTS: readonly GachaPrintDef[] = [
  q(1, 12, 665), a(1, 15, 838),
  q(2, 11, 667), a(2, 15, 856),
  q(3, 11, 662), a(3, 16, 847),
];
