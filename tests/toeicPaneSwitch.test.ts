import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * TOEIC Part 6・7 のスマホ：「文書」と「設問・選択肢」の切り替え（2026-11-03）
 *   ・切り替えのボタンは Part 6・7 のときだけ出す（Part 5 には出さない）
 *   ・1024px 未満だけで片方を隠す。PC（1024px 以上）は2列のままで、ボタンは隠す
 *   ・ボタンは高さ48px以上、添え書きの文字は12px以上
 *   ・採点したら設問に切り替え、ページが変わったら文書に戻す。結果の印を押したら設問に切り替えて移動する
 */
const quiz = readFileSync(new URL('../src/components/toeic/ToeicPageQuiz.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/components/toeic/toeic-page.css', import.meta.url), 'utf8');

describe('TOEIC Part 6・7：文書と設問の切り替え（スマホ）', () => {
  it('切り替えは Part 6・7 の文書があるときだけ出す', () => {
    expect(quiz).toMatch(/const docPane = p7Doc \? .* : p6Doc \? .* : null;/);
    expect(quiz).toContain('{docPane && (');
    expect(quiz).toContain('data-pane={docPane ? pane : undefined}');
  });

  it('採点で設問へ、ページ移動で文書へ、結果の印は設問に切り替えてから移動', () => {
    expect(quiz).toContain("if (isP6 || isP7) resetPane('q');");
    expect(quiz.match(/resetPane\(\);/g)?.length).toBeGreaterThanOrEqual(2);
    expect(quiz).toMatch(/if \(\(isP6 \|\| isP7\) && pane !== 'q'\) \{\s*switchPane\('q'\);/);
  });

  it('1024px 未満だけで片方を隠し、PC ではボタンを出さない', () => {
    const mobile = css.slice(css.indexOf('@media (max-width: 1023.98px)'));
    expect(mobile).toMatch(/\.tp-scroll\[data-pane="doc"\] \.tp-list/);
    expect(mobile).toMatch(/\.tp-scroll\[data-pane="q"\] \.tp7-docs/);
    expect(mobile).toMatch(/\.tp-scroll\[data-pane="q"\] \.tp-p6 > \.tp-doc/);
    expect(css).toMatch(/@media \(min-width: 1024px\) \{\s*\.tp-pane-switch, \.tp-pane-next \{ display: none; \}/);
  });

  it('ボタンは高さ48px以上・文字は12px以上', () => {
    const rule = (sel: string) => css.match(new RegExp(`${sel.replace(/[.[\]"=]/g, '\\$&')} \\{([^}]*)\\}`))?.[1] ?? '';
    expect(rule('.tp-pane-tab')).toContain('min-height: 48px');
    expect(rule('.tp-pane-next')).toContain('min-height: 48px');
    const sizes = [...css.slice(css.indexOf('.tp-pane-switch {')).matchAll(/font-size: (\d+)px/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(12);
  });
});
