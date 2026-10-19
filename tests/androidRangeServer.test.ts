/**
 * Google Play 版だけの音声劣化（Capacitor 内蔵サーバーが Range の位置を無視して先頭から返す）の修正
 * android/.../RangeAwareWebViewClient.java を、Android SDK なしで動かして確かめる。
 * Java が無い環境では飛ばす。
 */
import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';

const hasJava = spawnSync('java', ['-version']).status === 0;

describe.skipIf(!hasJava)('Android アプリの音源 Range 応答', () => {
  it('指定した位置のバイトを返す（先頭から返さない）', () => {
    const r = spawnSync('sh', ['scripts/android-range-check/run.sh'], { encoding: 'utf8', timeout: 60000 });
    expect(r.status, r.stderr).toBe(0);
    const lines = r.stdout.trim().split('\n');
    const ranged = lines.filter((l) => / -> 206 /.test(l));
    expect(ranged.length).toBe(4);
    for (const l of ranged) expect(l).toMatch(/match=true lenOK=true/);
    expect(r.stdout).toMatch(/bytes=99999999- -> 416/);
    expect(r.stdout).toMatch(/no-range -> null/);
    expect(r.stdout).toMatch(/js -> null/);
  }, 60000);
});
