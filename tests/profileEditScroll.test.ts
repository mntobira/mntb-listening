import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('profile edit page scrolling', () => {
  it('keeps the edit page scrollable within the available viewport height', () => {
    const css = readFileSync('src/components/growth-hub.css', 'utf8');
    const rule = css.match(/\.mypage-profile-edit\[data-mypage-profile-edit\]\s*\{([^}]+)\}/)?.[1] ?? '';

    expect(rule).toContain('flex: 1 1 0');
    expect(rule).toContain('min-height: 0');
    expect(rule).toContain('overflow-y: auto');
  });
});
