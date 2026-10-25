import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Firefly 動画キットの台帳（docs/FIREFLY_KIT.md）は scripts/firefly-kit/videos.py から作る
describe('Adobe Firefly 動画キット', () => {
  const doc = readFileSync('docs/FIREFLY_KIT.md', 'utf8');
  it('いまアプリで使っている全画面の演出4本は全部「撮り直し」に入っている', () => {
    for (const n of ['title', 'attack', 'gacha', 'victory']) expect(doc).toMatch(new RegExp(`\\| ${n} \\| 撮り直し`));
  });
  it('背景なしモーションの5本（TobiraMotion）も入っている', () => {
    for (const n of ['greet', 'wakeup', 'cheer', 'encourage', 'think']) expect(doc).toContain(`| ${n} |`);
  });
  it('Firefly のプロンプト上限（175語）を超えない（videos.py の assert）', () => {
    try { execFileSync('python3', ['-c', 'import sys; sys.path.insert(0, "scripts/firefly-kit"); import videos'], { stdio: 'pipe' }); }
    catch (e) { const msg = String((e as { stderr?: Buffer }).stderr ?? e); if (/not found|ENOENT/.test(msg)) return; throw e; }
  });
});
