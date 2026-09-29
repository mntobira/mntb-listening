import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { BGM_FILES, bgmFileKeyOf, introDelaySec, introOffsetSec } from '../src/battle/audio/bgmFiles';
import { COUNTDOWN_SECONDS, COUNTDOWN_START_HOLD_MS, COUNTDOWN_STEP_MS, COUNTDOWN_TOTAL_MS } from '../src/battle/core/battleLive';

describe('対戦BGM（音源ファイル）', () => {
  it('待合室は waiting、通常〜最終問題は同じ battle 曲', () => {
    expect(bgmFileKeyOf('matching')).toBe('waiting');
    for (const t of ['normal', 'closing', 'final'] as const) expect(bgmFileKeyOf(t)).toBe('battle');
  });
  it('カウントダウン7秒の頭から鳴らすと、7秒たった瞬間（START!）に曲の本編へ入る', () => {
    // START! が出るのは カウントダウン開始から 7 秒後
    expect(COUNTDOWN_SECONDS * COUNTDOWN_STEP_MS).toBe(7000);
    expect(COUNTDOWN_TOTAL_MS - COUNTDOWN_START_HOLD_MS).toBe(7000);
    // 頭（残り7秒）から → 曲頭 0 秒から再生、待ちなし
    expect(introOffsetSec(7, 7000)).toBe(0);
    expect(introDelaySec(7, 7000)).toBe(0);
    // 途中（残り2.5秒）で入った → 4.5秒の位置から。2.5秒後に 7 秒地点＝本編
    expect(introOffsetSec(7, 2500)).toBeCloseTo(4.5);
    // 残りが曲の前奏より長い → 前奏の長さに合うまで待つ
    expect(introDelaySec(7, 9000)).toBeCloseTo(2);
    expect(introOffsetSec(7, 9000)).toBe(0);
    // 負の残りは 0 扱い（本編から）
    expect(introOffsetSec(7, -500)).toBe(7);
  });
  it('登録された音源は実在し、商用の根拠が書いてある（架空・仮の音源を登録しない）', () => {
    for (const [key, spec] of Object.entries(BGM_FILES)) {
      expect(existsSync(resolve('public', '.' + spec!.url)), key).toBe(true);
      expect(spec!.license.length, key).toBeGreaterThan(10);
      expect(readFileSync('docs/BATTLE_BGM.md', 'utf8')).toContain(spec!.url);
      if (key === 'battle') expect(spec!.dropSec).toBe(7);
    }
  });
  it('対戦画面はカウントダウン中から対戦曲を渡し、リスニングは問題中に鳴らさない', () => {
    const stage = readFileSync('src/battle/ui/BattleLiveStage.tsx', 'utf8');
    expect(stage).toContain("counting && BGM_FILES.battle ? 'normal' : track");
    expect(stage).toContain("listening ? (counting ? 'matching' : null) : countdownTrack");
  });
});
