import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { APP_BGM_GAIN, appBgmVolume } from '../src/utils/bgmFade';
import { BGM_FILES } from '../src/battle/audio/bgmFiles';
import { DEFAULT_BATTLE_AUDIO } from '../src/battle/core/audioSettings';

describe('BGMの音量と1つのスイッチ（2026-10-01）', () => {
  it('アプリBGM（誕生 -13.4LUFS）は既定で対戦BGM・待ち時間BGMより小さい（誕生は音が詰まっていて大きく聞こえるため）', () => {
    const db = (x: number) => 20 * Math.log10(x);
    const app = -13.4 + db(appBgmVolume(0.5));
    const battle = -19.7 + db(DEFAULT_BATTLE_AUDIO.volume * 0.5 * BGM_FILES.battle!.gain);
    const waiting = -20.3 + db(DEFAULT_BATTLE_AUDIO.volume * 0.5 * BGM_FILES.waiting!.gain);
    expect(app).toBeLessThan(battle - 8);
    expect(app).toBeLessThan(waiting - 8);
    expect(app).toBeGreaterThan(battle - 12);
    // 待ち時間の曲（静かな曲調）は対戦の曲と同じくらいまで持ち上げる
    expect(Math.abs(waiting - battle)).toBeLessThan(1.5);
    expect(appBgmVolume(0)).toBe(0);
    expect(appBgmVolume(1)).toBeCloseTo(APP_BGM_GAIN);
  });
  it('アプリBGMのON/OFFが対戦BGMにも写る（逆向きも）', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    expect(app).toMatch(/writeAudioPreferences\(\{ bgm: isBgmEnabled \}\)/);
    expect(app).toMatch(/addEventListener\('battle-audio-settings', sync\)/);
    expect(app).not.toMatch(/audio\.volume = bgmVolume;/);
  });
  it('勝敗ジングルは結果BGMを止める無音リクエストを登録しない', () => {
    expect(readFileSync('src/battle/ui/BattleResultLive.tsx', 'utf8')).not.toContain('useBattleAudio(null)');
    expect(readFileSync('src/battle/ui/BattleResult.tsx', 'utf8')).toContain("useBattleAudio('matching')");
  });
  it('非表示の対戦画面はホーム・演習へBGMを持ち込まない', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    expect(app).toContain("if (appState === 'battle') return;");
    expect(app).toContain("engine.setBgmOwner(token, reviewing ? 'matching' : null, 100)");
  });
  it('設定画面に「対戦BGM」の別スイッチは無い', () => {
    expect(readFileSync('src/components/ProfileModal.tsx', 'utf8')).not.toMatch(/label="対戦BGM"/);
  });
});
