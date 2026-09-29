import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { CINEMATIC_CLIPS } from '../src/components/CinematicClip';

const probe = (file: string) => {
  try { return execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration', '-of', 'json', file], { encoding: 'utf8' }); }
  catch { return null; }
};

describe('とびら君の演出動画', () => {
  it('登録した動画・ポスターが public にあり、1MB 未満', () => {
    for (const [name, clip] of Object.entries(CINEMATIC_CLIPS)) {
      const file = resolve('public', '.' + clip.src);
      expect(existsSync(file), name).toBe(true);
      expect(statSync(file).size, name).toBeLessThan(1_000_000);
      if ('poster' in clip && clip.poster) expect(existsSync(resolve('public', '.' + clip.poster)), name + ' poster').toBe(true);
    }
  });
  it('再生の安全装置（全体8秒）より短く、音声トラックを持たない', () => {
    for (const [name, clip] of Object.entries(CINEMATIC_CLIPS)) {
      const out = probe(resolve('public', '.' + clip.src));
      if (!out) continue; // ffprobe が無い環境では省略
      const info = JSON.parse(out);
      const rate = 'playbackRate' in clip && clip.playbackRate ? clip.playbackRate : 1;
      expect(Number(info.format.duration) / rate, name).toBeLessThan(7.5);
      expect(info.streams.some((s: { codec_type: string }) => s.codec_type === 'audio'), name).toBe(false);
    }
  });
  it('コンボ攻撃は答え合わせの表示時間（3.5秒）に収まる', () => {
    const out = probe(resolve('public/cinematics/attack.mp4'));
    if (!out) return;
    expect(Number(JSON.parse(out).format.duration) / (CINEMATIC_CLIPS.special.playbackRate ?? 1)).toBeLessThan(3.5);
  });
  it('台帳に全動画が載っている', () => {
    const doc = readFileSync('docs/CINEMATICS.md', 'utf8');
    for (const clip of Object.values(CINEMATIC_CLIPS)) expect(doc).toContain(clip.src.split('/').pop()!);
  });
});
