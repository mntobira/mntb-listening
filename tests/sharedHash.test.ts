import { describe, expect, it } from 'vitest';
import { hashString } from '../src/battle/core/battleCore';
import { missionsForDate } from '../src/battle/core/growth';

/**
 * R-06: growth.ts の hashOf と authoredConvert.ts の hashString を battleCore.hashString に一本化した。
 * 旧 growth.hashOf（途中で >>>0 しない版）と結果が 1 ビットも違わないことを確かめる。
 * ここが変わると「その日のミッション」や選択肢の並びが変わってしまう。
 */
function legacyGrowthHashOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

describe('共通ハッシュ（FNV-1a 32bit）', () => {
  const samples = ['', 'a', '2026-10-17', 'bonus:2026-10-17', 'あいうえお', 'q-英文法-001', 'x'.repeat(500)];

  it('旧 growth.hashOf と完全に同じ値を返す', () => {
    for (const s of samples) expect(hashString(s)).toBe(legacyGrowthHashOf(s));
    for (let d = 1; d <= 366; d += 1) {
      const key = `2026-${String(Math.ceil(d / 31)).padStart(2, '0')}-${String(((d - 1) % 31) + 1).padStart(2, '0')}`;
      expect(hashString(key)).toBe(legacyGrowthHashOf(key));
      expect(hashString(`bonus:${key}`)).toBe(legacyGrowthHashOf(`bonus:${key}`));
    }
  });

  it('既知の値（FNV-1a の定義どおり）', () => {
    expect(hashString('')).toBe(0x811c9dc5);
    expect(hashString('a')).toBe(0xe40c292c);
  });

  it('日付ごとのミッションの組（共通化前に記録した値）が変わらない', () => {
    const ids = (d: string) => missionsForDate(d).map((m) => m.id).join(',');
    expect({
      '2026-10-17': ids('2026-10-17'),
      '2026-01-01': ids('2026-01-01'),
      '2027-04-01': ids('2027-04-01'),
    }).toMatchSnapshot();
  });
});
