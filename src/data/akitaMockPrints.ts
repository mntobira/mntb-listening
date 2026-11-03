/**
 * LR（レジェンドレア）：秋田大学 前期日程 英語（国際資源学部・教育文化学部・医学部保健学科・情報データ科学部 共通問題）対策 予想問題（白黒・A4）。
 *   3回分 × 「問題（解答用紙つき）」「解答・解説（全訳つき）」の6種。各回 大問Ⅰ〜Ⅲ・200点（独自配点）。
 *   英文・日本文・設問はすべて書き下ろしのオリジナル。登場する人物・団体・地名は架空。
 *   秋田大学の過去問・公式問題ではなく、大学とは関係がない（表紙と奥付に明記。tests/akitaMockPrints.test.ts が確かめる）。
 *
 * PDF は scripts/gacha-prints/akita_mock/render.py で作る。pages / kb は実物の値を写す（テストが照合する）。
 */
import type { GachaPrintDef } from './gachaPrints.generated';

const q = (n: number, pages: number, kb: number): GachaPrintDef => ({
  id: `print_lr_akita_q_${n}`,
  label: `秋田大学 前期 英語 予想問題 第${n}回 問題（200点・大学とは無関係のオリジナル）`,
  subject: 'english_reading',
  category: '演習プリント',
  file: `/prints/print_lr_akita_q_${n}.pdf`,
  thumb: `/prints/thumbs/print_lr_akita_q_${n}.webp`,
  pages,
  kb,
});
const a = (n: number, pages: number, kb: number): GachaPrintDef => ({
  id: `print_lr_akita_a_${n}`,
  label: `秋田大学 前期 英語 予想問題 第${n}回 解答・解説（全訳つき）`,
  subject: 'english_reading',
  category: '演習プリント',
  file: `/prints/print_lr_akita_a_${n}.pdf`,
  thumb: `/prints/thumbs/print_lr_akita_a_${n}.webp`,
  pages,
  kb,
});

export const AKITA_MOCK_PRINTS: readonly GachaPrintDef[] = [
  q(1, 12, 658), a(1, 13, 834),
  q(2, 12, 657), a(2, 13, 843),
  q(3, 12, 655), a(3, 13, 828),
];
