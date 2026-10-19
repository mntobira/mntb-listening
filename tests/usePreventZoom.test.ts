import { describe, it, expect } from 'vitest';
import { isDoubleTap, DOUBLE_TAP_WINDOW_MS, NATIVE_CONTROLS_SELECTOR } from '../src/hooks/usePreventZoom';
import { readFileSync } from 'node:fs';

describe('usePreventZoom（ズーム抑止を1か所に集約）', () => {
  it('前回のタップから 300ms 以内の2回目だけをダブルタップとみなす', () => {
    expect(DOUBLE_TAP_WINDOW_MS).toBe(300);
    expect(isDoubleTap(1000, 700)).toBe(true);
    expect(isDoubleTap(1000, 699)).toBe(false);
    expect(isDoubleTap(1000, 0)).toBe(false);
  });

  it('入力欄・ボタン・リンクは標準のタッチ挙動を残す（App 側の除外条件）', () => {
    expect(NATIVE_CONTROLS_SELECTOR).toBe('input, select, button, a');
  });

  it('document へのズーム抑止リスナーはフック以外に書かれていない（二重登録の防止）', () => {
    for (const f of ['src/App.tsx', 'src/components/Quiz.tsx']) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/addEventListener\('(gesturestart|gesturechange|touchend|touchmove)'/);
      expect(src, f).toContain('usePreventZoom(');
    }
  });
});
