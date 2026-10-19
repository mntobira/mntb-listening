import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * R-23: react-hooks/exhaustive-deps の抑制は「理由を書いたものだけ」にする。
 *   ・マウント時に1回だけ → hooks/useMountEffect
 *   ・最新の関数を読むだけ → hooks/useLatest
 *   ・わざと一部の値でだけ動かす → 抑制の直前に理由のコメント（このテストで必須にする）
 */
const ROOT = join(__dirname, '..', 'src');
const walk = (d: string): string[] => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
});

describe('フックの依存の抑制', () => {
  it('抑制は全部で 17 か所以下（29 か所から減らした。増やすときは理由を書いてここを更新する）', () => {
    const n = walk(ROOT).reduce((a, f) => a + (readFileSync(f, 'utf8').match(/eslint-disable-next-line react-hooks\/exhaustive-deps/g)?.length ?? 0), 0);
    expect(n).toBeLessThanOrEqual(17);
  });
  it('抑制の直前の行には必ず理由のコメントがある', () => {
    const missing: string[] = [];
    for (const f of walk(ROOT)) {
      const lines = readFileSync(f, 'utf8').split('\n');
      lines.forEach((l, i) => {
        if (l.includes('eslint-disable-next-line react-hooks/exhaustive-deps') && !/^\s*(\/\/|\*)/.test(lines[i - 1] ?? '')) {
          missing.push(`${f.slice(ROOT.length + 1)}:${i + 1}`);
        }
      });
    }
    expect(missing).toEqual([]);
  });
});
