import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * src/ のモジュール依存グラフに循環参照が無いことを固定する（静的 import・動的 import()・再公開・import type を含む）。
 * 循環は「片方を変えるともう片方も壊れる」密結合の兆候なので、増えたらこのテストで止める。
 * あわせて、生成スクリプト専用の src/battle/authoring がアプリ側から読み込まれていないことも固定する。
 */
const ROOT = path.resolve(__dirname, '..', 'src');
const EXTS = ['.ts', '.tsx', '.js', '.jsx'];

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) return listFiles(p);
    return /\.(tsx?|jsx?)$/.test(name) ? [p] : [];
  });
}

function resolveSpec(from: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null;
  const base = path.resolve(path.dirname(from), spec);
  for (const c of [base, ...EXTS.map((e) => base + e), ...EXTS.map((e) => path.join(base, 'index' + e))]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

function buildGraph(): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  for (const file of listFiles(ROOT)) {
    const code = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const deps: string[] = [];
    const re = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g;
    for (const m of code.matchAll(re)) {
      const r = resolveSpec(file, m[1] || m[2] || m[3]);
      if (r) deps.push(r);
    }
    graph.set(file, deps);
  }
  return graph;
}

/** Tarjan の強連結成分分解で、2ファイル以上の成分（＝循環）を返す */
function findCycles(graph: Map<string, string[]>): string[][] {
  let index = 0;
  const idx = new Map<string, number>(), low = new Map<string, number>(), stack: string[] = [], on = new Set<string>();
  const out: string[][] = [];
  const visit = (v: string) => {
    idx.set(v, index); low.set(v, index); index += 1; stack.push(v); on.add(v);
    for (const w of graph.get(v) ?? []) {
      if (!idx.has(w)) { visit(w); low.set(v, Math.min(low.get(v)!, low.get(w)!)); }
      else if (on.has(w)) low.set(v, Math.min(low.get(v)!, idx.get(w)!));
    }
    if (low.get(v) === idx.get(v)) {
      const comp: string[] = [];
      let w: string;
      do { w = stack.pop()!; on.delete(w); comp.push(path.relative(ROOT, w)); } while (w !== v);
      if (comp.length > 1) out.push(comp);
    }
  };
  for (const v of graph.keys()) if (!idx.has(v)) visit(v);
  return out;
}

describe('モジュール依存グラフ', () => {
  it('循環参照が無い', () => {
    expect(findCycles(buildGraph())).toEqual([]);
  });

  it('src/battle/authoring（生成スクリプト専用）はアプリから import されない', () => {
    const graph = buildGraph();
    const AUTHORING = path.join(ROOT, 'battle', 'authoring') + path.sep;
    const leaks: string[] = [];
    for (const [from, deps] of graph) {
      if (from.startsWith(AUTHORING)) continue;
      for (const dep of deps) {
        if (dep.startsWith(AUTHORING)) leaks.push(`${path.relative(ROOT, from)} -> ${path.relative(ROOT, dep)}`);
      }
    }
    expect(graph.size).toBeGreaterThan(0);
    expect(leaks).toEqual([]);
  });
});
