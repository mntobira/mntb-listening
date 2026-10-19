import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 例外の「黙った握りつぶし」を増やさないための見張り（監査 #29）。
 *
 * 許すのは次のどちらかだけ：
 *   ・失敗を記録する（reportError / logRejection）
 *   ・握りつぶす理由をその場（同じ行か直前2行）にコメントで書く
 *     （ファイル全体で同じ理由のときは、冒頭に「意図して捨てている」と書く）
 * 理由のない `catch {}` / `.catch(() => {})` が新しく入ったら、このテストが落ちる。
 */
const ROOT = join(__dirname, '..', 'src');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(ts|tsx)$/.test(name) && !/\.generated\./.test(name) ? [p] : [];
  });
}

const EMPTY_TRY_CATCH = /catch\s*(\([^)]*\))?\s*\{\s*\}/;
const EMPTY_PROMISE_CATCH = /\.catch\(\s*\(\)\s*=>\s*(\{\s*\}|undefined|null)\s*\)/;
const hasComment = (s: string | undefined) => !!s && /\/\/|\/\*/.test(s);

function silentCatches(): string[] {
  const hits: string[] = [];
  for (const file of walk(ROOT)) {
    const lines = readFileSync(file, 'utf8').split('\n');
    const fileLevel = lines.slice(0, 40).some((l) => l.includes('意図して捨てている'));
    lines.forEach((line, i) => {
      if (!EMPTY_TRY_CATCH.test(line) && !EMPTY_PROMISE_CATCH.test(line)) return;
      const t = line.trim();
      if (t.startsWith('*') || t.startsWith('//')) return; // 説明文の中の例
      if (fileLevel || hasComment(line) || hasComment(lines[i - 1]) || hasComment(lines[i - 2])) return;
      hits.push(`${file.slice(ROOT.length + 1)}:${i + 1}  ${t.slice(0, 100)}`);
    });
  }
  return hits;
}

describe('理由のない例外の握りつぶしが無い', () => {
  it('空の catch には、記録するか理由のコメントがある', () => {
    expect(silentCatches()).toEqual([]);
  });
});
