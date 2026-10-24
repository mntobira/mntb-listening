/**
 * LR（レジェンドレア）：共通テスト 英語 予想問題（2025年度〜 新課程の形式）。
 *   リーディング（80分・100点・大問8・解答数44）とリスニング（30分・100点・大問6・37問）を各5回分。
 *   すべて書き下ろしのオリジナル問題（センターの過去問ではない）。リスニングは音声なし・全スクリプト＋全訳つき。
 *
 * PDF は scripts/gacha-prints/kyotsu_mock/build.py で作る。pages / kb は .tmpwork/kyotsu-mock.json の値を写す
 * （tests/kyotsuMockPrints.test.ts が実物と照合する）。
 */
import type { GachaPrintDef } from './gachaPrints.generated';

const r = (n: number, pages: number, kb: number): GachaPrintDef => ({
  id: `print_lr_kyotsu_r_${n}`,
  label: `共通テスト 英語リーディング 予想問題 第${n}回（80分・100点）`,
  subject: 'english_reading',
  category: '演習プリント',
  file: `/prints/print_lr_kyotsu_r_${n}.pdf`,
  thumb: `/prints/thumbs/print_lr_kyotsu_r_${n}.webp`,
  pages,
  kb,
});
const l = (n: number, pages: number, kb: number): GachaPrintDef => ({
  id: `print_lr_kyotsu_l_${n}`,
  label: `共通テスト 英語リスニング 予想問題 第${n}回（スクリプト・全訳つき）`,
  subject: 'english_listening',
  category: '演習プリント',
  file: `/prints/print_lr_kyotsu_l_${n}.pdf`,
  thumb: `/prints/thumbs/print_lr_kyotsu_l_${n}.webp`,
  pages,
  kb,
});

export const KYOTSU_MOCK_PRINTS: readonly GachaPrintDef[] = [
  r(1, 24, 416), l(1, 20, 376),
  r(2, 21, 373), l(2, 20, 357),
  r(3, 21, 392), l(3, 19, 346),
  r(4, 20, 401), l(4, 19, 337),
  r(5, 21, 355), l(5, 20, 352),
];
