import type { GachaPrintDef } from '../../data/gachaPrints.generated';

/**
 * PDF の棚（2026-11-04 ご要望「ショップの PDF があふれているので分野ごとに整理（地方ごとなど）」）。
 *   ショップの「PDF」・マイPDF で、種類のチップの下に棚のチップを出して絞り込む。
 *   大学別の予想問題は地方ごとの棚に分ける。棚が決まらない PDF は「その他」。
 *   ★新しい大学の予想問題を足したら UNIV_REGION に1行足す★（tests/printShelves.test.ts が見張る）
 */
export type PrintShelfId =
  | 'kyotsu' | 'hokkaido_tohoku' | 'kanto_chubu' | 'kinki' | 'chugoku_shikoku' | 'kyushu_okinawa'
  | 'book' | 'english' | 'chemistry' | 'math' | 'joho' | 'science' | 'trend' | 'other';

/** 並び順もこの順（共通テスト → 大学別（北から） → 本 → 教科 → 出題傾向） */
export const PRINT_SHELVES: readonly { id: PrintShelfId; label: string }[] = [
  { id: 'kyotsu', label: '共通テスト予想' },
  { id: 'hokkaido_tohoku', label: '2次 北海道・東北' },
  { id: 'kanto_chubu', label: '2次 関東・中部' },
  { id: 'kinki', label: '2次 近畿' },
  { id: 'chugoku_shikoku', label: '2次 中国・四国' },
  { id: 'kyushu_okinawa', label: '2次 九州・沖縄' },
  { id: 'book', label: '完全版の本' },
  { id: 'english', label: '英語' },
  { id: 'chemistry', label: '化学' },
  { id: 'math', label: '数学' },
  { id: 'joho', label: '情報' },
  { id: 'science', label: '生物・理科' },
  { id: 'trend', label: '出題傾向' },
  { id: 'other', label: 'その他' },
];

/** 大学（PDF の id に入っている名前）→ 地方 */
export const UNIV_REGION: Readonly<Record<string, PrintShelfId>> = {
  hokudai: 'hokkaido_tohoku', tohoku: 'hokkaido_tohoku', hirosaki: 'hokkaido_tohoku', iwate: 'hokkaido_tohoku', akita: 'hokkaido_tohoku',
  yamagata: 'hokkaido_tohoku', fukushima: 'hokkaido_tohoku',
  utsunomiya: 'kanto_chubu', ibaraki: 'kanto_chubu', gakugei: 'kanto_chubu', tufs: 'kanto_chubu', nagoya: 'kanto_chubu', shizuoka: 'kanto_chubu', mie: 'kanto_chubu',
  omua: 'kinki', omub: 'kinki', wakayama: 'kinki', wakayamamed: 'kinki', kobe: 'kinki', osaka: 'kinki', ritsu: 'kinki',
  okayama: 'chugoku_shikoku', hiroshima: 'chugoku_shikoku', tottori: 'chugoku_shikoku', yamaguchi: 'chugoku_shikoku', onomichi: 'chugoku_shikoku', shimaneh: 'chugoku_shikoku', shimanem: 'chugoku_shikoku', kankyo: 'chugoku_shikoku',
  kagawa: 'chugoku_shikoku', tokushima: 'chugoku_shikoku', ehimeh: 'chugoku_shikoku', ehimee: 'chugoku_shikoku', ehimem: 'chugoku_shikoku',
  kochij: 'chugoku_shikoku', kochik: 'chugoku_shikoku', kochie: 'chugoku_shikoku', kochim: 'chugoku_shikoku',
  kyushu: 'kyushu_okinawa', saga: 'kyushu_okinawa', kumamoto: 'kyushu_okinawa', ryukyu: 'kyushu_okinawa', fwu: 'kyushu_okinawa',
  nagasakid: 'kyushu_okinawa', nagasakic: 'kyushu_okinawa',
};

/** 大学別の予想問題なら、その大学の名前（id の一部）。それ以外は null */
export function univOfPrint(id: string): string | null {
  const m = /^print_lr_niji_([a-z]+)_en_\d+$/.exec(id) ?? /^print_lr_([a-z]+)_(?:[qa]_)?\d+$/.exec(id);
  return m && m[1] !== 'kyotsu' ? m[1] : null;
}

export function printShelfOf(p: GachaPrintDef): PrintShelfId {
  if (p.id.startsWith('print_lr_kyotsu')) return 'kyotsu';
  const univ = univOfPrint(p.id);
  if (univ) return UNIV_REGION[univ] ?? 'other';
  if (p.category === '完全版') return 'book';
  if (p.category === '出題傾向') return 'trend';
  if (p.subject.startsWith('english')) return 'english';
  if (p.subject.startsWith('chemistry')) return 'chemistry';
  if (p.subject === 'math') return 'math';
  if (p.subject === 'joho') return 'joho';
  if (p.subject === 'biology_basic' || p.subject === 'rika') return 'science';
  return 'other';
}
