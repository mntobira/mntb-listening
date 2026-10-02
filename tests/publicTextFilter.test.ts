import { describe, expect, it } from 'vitest';
import { checkPublicText, displaySafePublicText } from '../src/features/safety/nicknameFilter';

describe('志望校など公開される自由入力のフィルタ（App Store 1.2）', () => {
  it('空欄と普通の大学名は通す。24文字を超える長い学校名も40文字までは通す', () => {
    expect(checkPublicText('').ok).toBe(true);
    expect(checkPublicText('東京大学').ok).toBe(true);
    expect(checkPublicText('国立大学法人東京農工大学農学部獣医学科共同獣医学専攻').ok).toBe(true);
  });
  it('連絡先・URLは公開させない', () => {
    expect(checkPublicText('line: abc123 https://x.com/a').ok).toBe(false);
    expect(displaySafePublicText('https://example.com')).toBe('（非表示）');
  });
  it('表示側も40文字で切る', () => {
    expect([...displaySafePublicText('あ'.repeat(60))].length).toBeLessThanOrEqual(40);
  });
});
