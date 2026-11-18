import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { ALPHA_CINEMATIC_CLIPS, FULLFRAME_CINEMATIC_MOVIES } from '../src/components/AlphaCinematicClip';
import { TITLE_SCREEN_BGM_SRC, TITLE_SCREEN_BGM_SUBTLE_GAIN } from '../src/components/TitleBgmControl';

const probe = (file: string) => {
  try {
    return JSON.parse(
      execFileSync(
        'ffprobe',
        ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height:format=duration', '-of', 'json', file],
        { encoding: 'utf8' },
      ),
    );
  } catch {
    return null;
  }
};

describe('2026-11-15 モンスト風OPムービー（②横/③縦）＋ ①高精度切り抜きとびら君 ＋ ④ガチャ演出＆タイトルBGM', () => {
  it('①透過WebM・iOS用SBS MP4・ポスター・終了プレートと②③④フル画角ムービーがすべて1MB未満かつ音声トラック無し', () => {
    for (const [name, clip] of Object.entries(ALPHA_CINEMATIC_CLIPS)) {
      for (const rel of [clip.webm, clip.sbsMp4, clip.poster, clip.endPlate]) {
        const file = resolve('public', '.' + rel);
        expect(existsSync(file), `${name}: ${rel}`).toBe(true);
        expect(statSync(file).size, `${name} size: ${rel}`).toBeLessThan(1_000_000);
      }
      const webmInfo = probe(resolve('public', '.' + clip.webm));
      if (webmInfo) {
        expect(webmInfo.streams.some((s: { codec_type: string }) => s.codec_type === 'audio'), `${name} webm muted`).toBe(false);
      }
      const sbsInfo = probe(resolve('public', '.' + clip.sbsMp4));
      if (sbsInfo) {
        expect(sbsInfo.streams.some((s: { codec_type: string }) => s.codec_type === 'audio'), `${name} sbs muted`).toBe(false);
        const v = sbsInfo.streams.find((s: { codec_type: string }) => s.codec_type === 'video');
        expect([v.width, v.height], `${name} sbs stacked dimensions`).toEqual([clip.width, clip.height * 2]);
      }
    }

    for (const [name, movie] of Object.entries(FULLFRAME_CINEMATIC_MOVIES)) {
      for (const rel of [movie.mp4, movie.poster]) {
        const file = resolve('public', '.' + rel);
        expect(existsSync(file), `${name}: ${rel}`).toBe(true);
        expect(statSync(file).size, `${name} size: ${rel}`).toBeLessThan(1_000_000);
      }
      const mp4Info = probe(resolve('public', '.' + movie.mp4));
      if (mp4Info) {
        expect(mp4Info.streams.some((s: { codec_type: string }) => s.codec_type === 'audio'), `${name} mp4 muted`).toBe(false);
        const v = mp4Info.streams.find((s: { codec_type: string }) => s.codec_type === 'video');
        expect([v.width, v.height], `${name} mp4 dimensions`).toEqual([movie.width, movie.height]);
      }
    }
  });

  it('タイトル画面が「エンブレム → モンスト風OP（②横/③縦・タップスキップ可）→ 既存タイトル画面で①切り抜き演出 → 待機」を備える', () => {
    const launch = readFileSync('src/components/LaunchScreen.tsx', 'utf8');
    expect(launch).toContain('(orientation: landscape) and (min-width: 768px)');
    expect(launch).toContain('FULLFRAME_CINEMATIC_MOVIES.titleOpLandscape');
    expect(launch).toContain('FULLFRAME_CINEMATIC_MOVIES.titleOpPortrait');
    expect(launch).toContain('ALPHA_CINEMATIC_CLIPS.battleCountdown');
    expect(launch).toContain('data-launch-op');
    expect(launch).toContain('タップしてスキップ');
    expect(launch).toContain('TitleBgmMuteButton');
    // ループ属性を持たず1回完結再生し、0.00s同期再生を行うことを保証
    expect(launch).not.toMatch(/<audio[^>]*\bloop\b/);
    expect(launch).toContain('startBgmFromBeginning');
    expect(launch).toContain('onEnded={markTitleBgmEnded}');

    const bgmControl = readFileSync('src/components/TitleBgmControl.tsx', 'utf8');
    expect(bgmControl).toContain('audio.loop = false');
    expect(bgmControl).toContain('endedOnceRef');
    expect(bgmControl).toContain('audio.currentTime = 0');

    const bgmFile = resolve('public', '.' + TITLE_SCREEN_BGM_SRC);
    expect(existsSync(bgmFile)).toBe(true);
    expect(statSync(bgmFile).size).toBeLessThan(500_000);
    const bgmInfo = probe(bgmFile);
    if (bgmInfo?.format?.duration) {
      const dur = Number(bgmInfo.format.duration);
      expect(dur).toBeGreaterThanOrEqual(14.5);
      expect(dur).toBeLessThanOrEqual(15.5);
    }
    expect(TITLE_SCREEN_BGM_SUBTLE_GAIN).toBeGreaterThan(0.1);
    expect(TITLE_SCREEN_BGM_SUBTLE_GAIN).toBeLessThanOrEqual(0.5);
  });

  it('対戦カウントダウン（3・2・1・START!）とガチャ確定演出（GachaReveal / RewardVideo）に統合されている', () => {
    const countdown = readFileSync('src/battle/ui/BattleLiveParts.tsx', 'utf8');
    expect(countdown).toContain('ALPHA_CINEMATIC_CLIPS.battleCountdown');
    expect(countdown).toContain("label === 'START!'");

    const gachaReveal = readFileSync('src/components/GachaReveal.tsx', 'utf8');
    expect(gachaReveal).toContain('FULLFRAME_CINEMATIC_MOVIES.gachaDuoIntro');
    expect(gachaReveal).toContain('GACHA_REVEAL_CLIPS[rarity]');

    const rewardVideo = readFileSync('src/components/RewardVideo.tsx', 'utf8');
    expect(rewardVideo).toContain('FULLFRAME_CINEMATIC_MOVIES.gachaDuoIntro');
  });
});
