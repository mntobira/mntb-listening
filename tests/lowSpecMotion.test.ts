import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  classifyDevicePerf, isSlowFrameSample, getPerfTier, isLitePerf, onPerfTierChange, installDevicePerf,
  __resetDevicePerfForTest, SLOW_FRAME_MS,
} from '../src/utils/devicePerf';
import { rippleLookOf } from '../src/motion/MoRipple';

/**
 * 低スペック端末でも 60fps で動く（L-01〜L-08）の決まりを固定する。
 */

describe('devicePerf：端末スペックの判定（L-08）', () => {
  beforeEach(() => __resetDevicePerfForTest());

  it('メモリ 4GB 以下・コア 4 以下・省データは lite', () => {
    expect(classifyDevicePerf({ deviceMemory: 2 })).toBe('lite');
    expect(classifyDevicePerf({ deviceMemory: 4 })).toBe('lite');
    expect(classifyDevicePerf({ hardwareConcurrency: 4 })).toBe('lite');
    expect(classifyDevicePerf({ saveData: true, deviceMemory: 16, hardwareConcurrency: 16 })).toBe('lite');
  });
  it('十分な端末・指標が読めない端末は full', () => {
    expect(classifyDevicePerf({ deviceMemory: 8, hardwareConcurrency: 8 })).toBe('full');
    expect(classifyDevicePerf({})).toBe('full');
    expect(classifyDevicePerf({ deviceMemory: 0, hardwareConcurrency: 0 })).toBe('full');
  });
  it('iOS はコア数が丸められて返るので、コア数だけでは lite にしない（全 iPhone が lite になるのを防ぐ）', () => {
    expect(classifyDevicePerf({ hardwareConcurrency: 2, isAppleMobile: true })).toBe('full');
    expect(classifyDevicePerf({ hardwareConcurrency: 4, isAppleMobile: true })).toBe('full');
  });
  it('rAF の間隔の平均が 24ms を超えたら遅い端末（先頭の乱れと単発の長い間隔は無視）', () => {
    const at = (ms: number, n: number, start = 0) => Array.from({ length: n }, (_, i) => start + i * ms);
    expect(isSlowFrameSample(at(16.7, 35))).toBe(false);
    expect(isSlowFrameSample(at(33.3, 35))).toBe(true);
    expect(isSlowFrameSample(at(SLOW_FRAME_MS, 35))).toBe(false);
    // 起動直後の 5 コマだけ極端に遅い → 捨てるので full
    const warm = [0, 300, 600, 900, 1200, ...at(16.7, 30, 1300)];
    expect(isSlowFrameSample(warm)).toBe(false);
    // 1回だけ GC で 2 秒止まった → 100ms で頭打ちにするので平均を引きずらない
    const gc = at(16.7, 35); for (let i = 20; i < gc.length; i++) gc[i] += 2000;
    expect(isSlowFrameSample(gc)).toBe(false);
    expect(isSlowFrameSample([1, 2])).toBe(false);
  });
  it('既定は full。document が無い環境（テスト・SSR）でも例外を出さない', () => {
    expect(getPerfTier()).toBe('full');
    expect(isLitePerf()).toBe(false);
    expect(() => installDevicePerf(undefined)()).not.toThrow();
  });
  it('指標で lite と分かれば <html data-perf="lite"> を付け、購読者に知らせる', () => {
    const nav = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { userAgent: 'Android', hardwareConcurrency: 2, deviceMemory: 2 } });
    try {
      const seen: string[] = [];
      onPerfTierChange((t) => seen.push(t));
      const root = { dataset: {} as Record<string, string> };
      installDevicePerf({ documentElement: root, hidden: false } as unknown as Document);
      expect(root.dataset.perf).toBe('lite');
      expect(isLitePerf()).toBe(true);
      expect(seen).toEqual(['lite']);
    } finally {
      Object.defineProperty(globalThis, 'navigator', { configurable: true, value: nav });
    }
  });
});

describe('MoRipple：押した瞬間の重い計算を減らす（L-03）', () => {
  it('同じボタンの getComputedStyle は1回だけ', () => {
    let calls = 0;
    const el = {} as Element;
    const read = () => { calls++; return { borderRadius: '12px', color: 'rgb(0, 0, 0)' }; };
    expect(rippleLookOf(el, read)).toEqual({ radius: '12px', color: 'rgb(0, 0, 0)' });
    expect(rippleLookOf(el, read)).toEqual({ radius: '12px', color: 'rgb(0, 0, 0)' });
    expect(calls).toBe(1);
  });
  it('低スペック端末では波紋を出さない', () => {
    expect(readFileSync('src/motion/MoRipple.ts', 'utf8')).toMatch(/isLitePerf\(\)\) return;/);
  });
});

describe('カウントアップは数えている途中に React を再描画しない（L-02）', () => {
  it('CountUp：途中は文字ノードへ直接書き、setShown / setDone は数え終わりの1回だけ', () => {
    const src = readFileSync('src/components/ui/CountUp.tsx', 'utf8');
    const step = src.slice(src.indexOf('const step'), src.indexOf('setDone(false);'));
    const [during, after] = step.split('} else {');
    expect(during).toContain('write(');
    expect(during).not.toMatch(/set(Shown|Done)\(/);
    expect(after).toMatch(/setShown\(value\); setDone\(true\);/);
  });
  it('BattleCountUp：途中は文字ノードへ直接書き、setValue は最後の1回だけ', () => {
    const src = readFileSync('src/battle/ui/GrowthFx.tsx', 'utf8');
    const body = src.slice(src.indexOf('export function BattleCountUp'), src.indexOf('// 段位バー'));
    const step = body.slice(body.indexOf('const step'), body.indexOf('raf = requestAnimationFrame(step);\n    }, delay)'));
    const [during, after] = step.split('} else {');
    expect(during).toContain('write(v)');
    expect(during).not.toContain('setValue(');
    expect(after).toContain('setValue(v)');
  });
});

describe('キネティック・タイポは GPU の合成だけで動く（L-01）', () => {
  const css = readFileSync('src/motion/motion.css', 'utf8');
  it('kt-rise に filter（ぼかし）を使わない', () => {
    const kf = css.match(/@keyframes kt-rise \{([^\n]*)\n/)?.[1] ?? '';
    expect(kf).toContain('opacity');
    expect(kf).not.toMatch(/filter|blur/);
  });
  it('低スペック端末では1文字ずつに分けず、見出し全体を1要素（.kt-whole）で立ち上げる', () => {
    expect(readFileSync('src/motion/KineticText.tsx', 'utf8')).toMatch(/chars\.length > max \|\| isLitePerf\(\)/);
  });
});

// ======================================================================
// Fitness Function：無限ループのアニメはコンポジタ専用プロパティだけ（L-05）
//   top / left / margin / width / height / box-shadow / filter / background-position などを
//   infinite で動かすと、毎フレーム レイアウトや描き直しが走り、低スペック端末で止まる。
// ======================================================================
function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? cssFiles(p) : p.endsWith('.css') ? [p] : [];
  });
}
function keyframes(src: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /@keyframes\s+([\w-]+)\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    let i = re.lastIndex; let depth = 1;
    while (depth && i < src.length) { if (src[i] === '{') depth++; else if (src[i] === '}') depth--; i++; }
    out.set(m[1], (out.get(m[1]) ?? '') + src.slice(re.lastIndex, i - 1));
  }
  return out;
}
const HEAVY = /(?:^|[\s{;])(top|left|right|bottom|margin(?:-\w+)?|width|height|box-shadow|filter|background-position|clip-path|text-shadow)\s*:/;

describe('無限アニメはコンポジタ専用プロパティ（transform / translate / scale / rotate / opacity）だけ（L-05）', () => {
  const files = cssFiles('src');
  const all = new Map<string, string>();
  for (const f of files) for (const [k, v] of keyframes(readFileSync(f, 'utf8'))) all.set(k, (all.get(k) ?? '') + v);

  /** 例外：古い端末向けの代用（@supports で cqw 版に置き換わる）、または一度しか流れない短い光 */
  const ALLOW = new Set([
    'arena-streak', // @supports (width: 1cqw) の中で arena-streak-cq（translate）に置き換わる。未対応の古い端末だけの代用
    'gacha-shine', // 大当たり（UR）の確定演出の数秒間だけ。文字の上の光（background-clip:text）は translate に置き換えられない
  ]);

  it('infinite のアニメに重いプロパティを使っていない', () => {
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const m of src.matchAll(/animation\s*:([^;}]*)/g)) {
        for (const part of m[1].split(',')) {
          if (!/\binfinite\b/.test(part)) continue;
          for (const name of part.match(/[\w-]+/g) ?? []) {
            const body = all.get(name);
            if (!body || ALLOW.has(name)) continue;
            const hit = body.match(HEAVY);
            if (hit) offenders.push(`${f}: ${name} → ${hit[1]}`);
          }
        }
      }
      // animation-name + animation-iteration-count: infinite の書き方（桜の花びらなど）
      for (const m of src.matchAll(/\{([^{}]*animation-iteration-count:\s*infinite[^{}]*)\}/g)) {
        for (const name of m[1].match(/animation-name:\s*([^;]+)/)?.[1].match(/[\w-]+/g) ?? []) {
          const hit = all.get(name)?.match(HEAVY);
          if (hit && !ALLOW.has(name)) offenders.push(`${f}: ${name} → ${hit[1]}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('正解演出の後光は画面の数倍（160vmax）にしない（L-04）', () => {
    const cb = readFileSync('src/components/fx/correct-burst.css', 'utf8');
    expect(cb).not.toMatch(/width:\s*160vmax/);
    expect(cb).toMatch(/\.cb-rays \{[^}]*will-change: transform[^}]*contain: strict/);
    const idx = readFileSync('src/index.css', 'utf8');
    expect(idx).toMatch(/\.gacha-reveal-rays \{[^}]*will-change: transform; contain: strict/);
    expect(readFileSync('src/components/mission-clear.css', 'utf8')).toMatch(/\.mission-clear-rays \{[^}]*will-change: transform; contain: strict/);
  });
});

describe('perf-lite.css：低スペック端末の軽量化（L-04 / L-06 / L-07）', () => {
  const lite = readFileSync('src/styles/perf-lite.css', 'utf8');
  const rules = lite.replace(/\/\*[\s\S]*?\*\//g, '');
  it('main.tsx で index.css の後に読む', () => {
    const main = readFileSync('src/main.tsx', 'utf8');
    expect(main.indexOf("import './styles/perf-lite.css';")).toBeGreaterThan(main.indexOf("import './index.css';"));
    expect(main).toMatch(/installDevicePerf\(\);\ninstallRipple\(\);/);
  });
  it('紙吹雪・火花は半分、マスクは外す', () => {
    expect(rules).toMatch(/\.cb-confetti b:nth-child\(even\) \{ display: none; \}/);
    expect(rules).toMatch(/\.gacha-reveal-sparks i:nth-child\(even\) \{ display: none; \}/);
    expect(rules).toMatch(/\.mission-clear-confetti i:nth-child\(even\) \{ display: none; \}/);
    expect(rules).toMatch(/\.cb-rays \{[^}]*mask: none/);
    expect(rules).toMatch(/\.gacha-reveal-rays \{[^}]*mask: none/);
  });
  it('モーダル・演出が開いている間は背景の飾りのループを止める', () => {
    expect(rules).toMatch(/html:has\(dialog\[open\], \[aria-modal=true\][^)]*\)[\s\S]*?animation-play-state: paused/);
  });
  it('疑似要素を :is() の中に書かない（書くとそのルールごと無効になる）', () => {
    for (const m of rules.matchAll(/:is\(([^)]*)\)/g)) expect(m[1]).not.toMatch(/::/);
  });
  it('動画の入れ物は別レイヤー（contain: layout paint）', () => {
    expect(rules).toMatch(/\.cinematic-clip \{ contain: layout paint; \}/);
  });
  it('文言・大きさ・余白は変えない（content / font-size / margin / padding を書かない）', () => {
    expect(rules).not.toMatch(/\b(content|font-size|margin|padding)\s*:/);
  });
});
