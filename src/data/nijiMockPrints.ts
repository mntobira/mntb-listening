/**
 * LR（レジェンドレア）：2次試験ガチャの大当たり＝国公立2次 英語 予想問題（各大学 前期の形式に沿った書き下ろし）。
 *   1冊＝問題編＋解答・解説編。
 *   - 名古屋大学 前期対策：大問Ⅰ〜Ⅳ・105分・100点。3回分。
 *   - 静岡大学 前期対策（2026-10-30 追加）：大問1〜5（物語文・誤り訂正・評論文・会話文・自由英作文）・80分・配点は%。3回分。
 *   - 大阪公立大学 前期対策（2026-10-30 追加）：長文2題＋和文英訳・100分・100点。第1・2問は全学部共通、
 *     第3問（和文英訳）だけ学部・学域で2系統に分かれるため、Aグループ用・Bグループ用を各3回分（計6冊）。
 *   ★過去問ではない★ 英文・設問・図表・解答はすべて書き下ろし。過去問・解答速報・講評の文章は引用していない
 *   （英語5語以上・日本語12字以上の連続一致がないことを機械で確認済み）。表紙と奥付に「大学とは関係がない」旨を明記。
 *
 * PDF は問題編と解答・解説編を pdfunite でつないだもの。pages / kb は実物の値（tests/nijiGacha.test.ts が照合）。
 */
import type { GachaPrintDef } from './gachaPrints.generated';

/**
 * 予想問題を作った大学（id は PDF のファイル名に使う）。
 * track：学部・学域で問題が分かれる大学だけ、どの系統向けかを書く（ラベルにも出す）。
 */
export const NIJI_UNIVERSITIES = [
  { id: 'nagoya', name: '名古屋大学', track: '' },
  { id: 'shizuoka', name: '静岡大学', track: '' },
  { id: 'omua', name: '大阪公立大学', track: 'Aグループ（文・法・経済・商・獣医・医学科・生活科学）' },
  { id: 'omub', name: '大阪公立大学', track: 'Bグループ（現代システム科学域・理・工・農・リハビリ・看護）' },
] as const;
export type NijiUniversityId = (typeof NIJI_UNIVERSITIES)[number]['id'];

const mock = (univ: NijiUniversityId, n: number, pages: number, kb: number): GachaPrintDef => {
  const { name, track } = NIJI_UNIVERSITIES.find((u) => u.id === univ)!;
  return {
    id: `print_lr_niji_${univ}_en_${n}`,
    label: `国公立2次 英語 予想問題 ${name} 前期対策${track ? ` ${track}` : ''} 第${n}回（問題＋解答・解説）`,
    subject: 'english_reading',
    category: '演習プリント',
    file: `/prints/print_lr_niji_${univ}_en_${n}.pdf`,
    thumb: `/prints/thumbs/print_lr_niji_${univ}_en_${n}.webp`,
    pages,
    kb,
  };
};
const nagoya = (n: number, pages: number, kb: number) => mock('nagoya', n, pages, kb);
const shizuoka = (n: number, pages: number, kb: number) => mock('shizuoka', n, pages, kb);
const omua = (n: number, pages: number, kb: number) => mock('omua', n, pages, kb);
const omub = (n: number, pages: number, kb: number) => mock('omub', n, pages, kb);

export const NIJI_MOCK_PRINTS: readonly GachaPrintDef[] = [
  nagoya(1, 28, 2026),
  nagoya(2, 30, 2033),
  nagoya(3, 30, 1983),
  shizuoka(1, 28, 1849),
  shizuoka(2, 28, 1847),
  shizuoka(3, 28, 1855),
  omua(1, 26, 1971),
  omua(2, 24, 1965),
  omua(3, 25, 1986),
  omub(1, 26, 1971),
  omub(2, 24, 1968),
  omub(3, 25, 1992),
];

/** その大学の予想問題に必ず添える注意書き（PDF の表紙・奥付と同じ文） */
export function nijiDisclaimerFor(univName: string): string {
  return `${univName}の過去問・公式問題ではありません。予想問題であり、大学とは関係がありません。`;
}

/** 予想問題（id）がどの大学のものか。2次の予想問題でなければ undefined */
export function nijiUniversityOf(id: string): (typeof NIJI_UNIVERSITIES)[number] | undefined {
  const m = id.match(/^print_lr_niji_([a-z]+)_en_\d+$/);
  return m ? NIJI_UNIVERSITIES.find((u) => u.id === m[1]) : undefined;
}

/** ピックアップなど、ガチャ全体に添える注意書き（収録している大学をすべて挙げる） */
export const NIJI_DISCLAIMER = `${[...new Set(NIJI_UNIVERSITIES.map((u) => u.name))].join('・')}の過去問・公式問題ではありません。予想問題であり、各大学とは関係がありません。`;
