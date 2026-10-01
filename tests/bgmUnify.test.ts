import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { APP_BGM_GAIN, appBgmVolume } from '../src/utils/bgmFade';
import { BGM_FILES } from '../src/battle/audio/bgmFiles';
import { DEFAULT_BATTLE_AUDIO } from '../src/battle/core/audioSettings';

describe('BGMの音量と1つのスイッチ（2026-10-01）', () => {
  it('アプリBGM（誕生 -13.4LUFS）は既定で対戦BGM（-20LUFS×0.15）と同じくらいの大きさ', () => {
    const db = (x: number) => 20 * Math.log10(x);
    const app = -13.4 + db(appBgmVolume(0.5));
    const battle = -20 + db(DEFAULT_BATTLE_AUDIO.volume * 0.5 * BGM_FILES.battle!.gain);
    expect(Math.abs(app - battle)).toBeLessThan(1);
    expect(appBgmVolume(0)).toBe(0);
    expect(appBgmVolume(1)).toBeCloseTo(APP_BGM_GAIN);
  });
  it('アプリBGMのON/OFFが対戦BGMにも写る（逆向きも）', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    expect(app).toMatch(/writeAudioPreferences\(\{ bgm: isBgmEnabled \}\)/);
    expect(app).toMatch(/addEventListener\('battle-audio-settings', sync\)/);
    expect(app).not.toMatch(/audio\.volume = bgmVolume;/);
  });
  it('設定画面に「対戦BGM」の別スイッチは無い', () => {
    expect(readFileSync('src/components/ProfileModal.tsx', 'utf8')).not.toMatch(/label="対戦BGM"/);
  });
});
