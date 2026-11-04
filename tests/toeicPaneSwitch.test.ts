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

describe('TOEIC Part 7：採点後の「文書で根拠を見る」（2026-11-03）', () => {
  it('全360問で、根拠の英文が文書の中にマーカーとして出る（段落・吹き出し・見出しの行・表）', async () => {
    const React = (await import('react')).default;
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { ToeicP7Passage } = await import('../src/components/toeic/ToeicP7Passage');
    const { p7EvidenceDoc } = await import('../src/components/toeic/toeicPageModel');
    const { TOEIC_P7_ROUNDS } = await import('../src/data/toeic/toeicPart7Rounds');
    const bad: string[] = [];
    let checked = 0;
    TOEIC_P7_ROUNDS.forEach((sets, r) => sets.forEach((set, si) => set.q.forEach((q, qi) => q.e.forEach((e) => {
      const n = p7EvidenceDoc(set, e) - 1;
      const id = `第${r + 1}回 セット${si + 1} 設問${qi + 1}`;
      if (n < 0) { bad.push(`${id}：根拠が文書に無い`); return; }
      const html = renderToStaticMarkup(React.createElement(ToeicP7Passage, {
        set, setIndex: si, offset: 0, tab: n, onTab: () => {}, evidence: { [n]: [e] },
      }));
      checked += 1;
      if (!html.includes('data-toeic-ev')) bad.push(`${id}：マーカーが出ない「${e.slice(0, 40)}」`);
      if (set.docs.length > 1 && !html.includes('data-toeic-tab-ev')) bad.push(`${id}：タブに「根拠」の印が無い`);
    }))));
    expect(bad).toEqual([]);
    expect(checked).toBeGreaterThan(360);
  });

  it('根拠を出していないときは、マーカーもタブの印も出さない', async () => {
    const React = (await import('react')).default;
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { ToeicP7Passage } = await import('../src/components/toeic/ToeicP7Passage');
    const { TOEIC_P7_ROUNDS } = await import('../src/data/toeic/toeicPart7Rounds');
    const set = TOEIC_P7_ROUNDS[0][6];
    const html = renderToStaticMarkup(React.createElement(ToeicP7Passage, { set, setIndex: 6, offset: 19, tab: 0, onTab: () => {}, evidence: null }));
    expect(html).not.toContain('data-toeic-ev');
    expect(html).not.toContain('data-toeic-tab-ev');
  });

  it('ボタン・帯の決まり：採点後の Part 6・7 だけ、高さ44px以上、ページが変わったらマーカーを消す', () => {
    expect(quiz).toContain('{ex && (isP6 || isP7) && (');
    expect(quiz).toMatch(/const resetPane = [\s\S]*?setEvFor\(null\);[\s\S]*?setDocTab\(0\);/);
    expect(quiz).toContain('if (!p7Doc || !evFor || !pageScored) return null;');
    const rule = (sel: string) => css.match(new RegExp(`\\${sel} \\{([^}]*)\\}`))?.[1] ?? '';
    expect(rule('.tp-evbtn')).toContain('min-height: 44px');
    expect(rule('.tp-ev-back')).toContain('min-height: 44px');
    expect(rule('.tp-ev-clear')).toMatch(/width: 44px; height: 44px/);
  });
});
