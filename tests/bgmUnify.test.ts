import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { APP_BGM_GAIN, appBgmVolume } from '../src/utils/bgmFade';
import { BGM_FILES } from '../src/battle/audio/bgmFiles';
import { BATTLE_BGM_BUS_GAIN, BGM_MEASURED_LUFS, BGM_TARGET_LUFS } from '../src/battle/audio/bgmLoudness';
import { readAudioPreferences, writeAudioPreferences } from '../src/battle/audio/audioPreferences';
import { setTitleBgmVolume, unlockTitleBgm } from '../src/battle/audio/titleMediaAudio';
import { DEFAULT_BATTLE_AUDIO } from '../src/battle/core/audioSettings';

describe('BGMの音量と1つのスイッチ（2026-10-01）', () => {
  it('全BGM（誕生・待合室・対戦）を実測ラウドネスから同じ大きさにそろえる', () => {
    const db = (x: number) => 20 * Math.log10(x);
    for (const volume of [0.1, 0.5, DEFAULT_BATTLE_AUDIO.volume, 1]) {
      const title = BGM_MEASURED_LUFS.title + db(appBgmVolume(volume));
      const battle = BGM_MEASURED_LUFS.battle + db(volume * BATTLE_BGM_BUS_GAIN * BGM_FILES.battle!.gain);
      const waiting = BGM_MEASURED_LUFS.waiting + db(volume * BATTLE_BGM_BUS_GAIN * BGM_FILES.waiting!.gain);
      expect(battle).toBeCloseTo(waiting, 5);
      expect(title).toBeCloseTo(waiting, 5);
      expect(title).toBeCloseTo(BGM_TARGET_LUFS + db(volume), 5);
    }
    // 以前のように「他の曲をどんどん小さく」していないこと：最大音量で -22 LUFS
    expect(BGM_TARGET_LUFS).toBeGreaterThanOrEqual(-23);
    expect(appBgmVolume(0)).toBe(0);
    expect(appBgmVolume(1)).toBeCloseTo(APP_BGM_GAIN);
  });
  it('実測値はファイルと一致する（音源差し替え時に必ず測り直す）', () => {
    expect(BGM_MEASURED_LUFS).toEqual({ title: -13.4, waiting: -20.3, battle: -19.7, battle2: -20.3 });
  });
  it('アプリBGMのON/OFFが対戦BGMにも写る（逆向きも）', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    expect(app).toMatch(/writeAudioPreferences\(\{ bgm: isBgmEnabled \}\)/);
    expect(app).toMatch(/addEventListener\('battle-audio-settings', sync\)/);
    expect(app).not.toMatch(/audio\.volume = bgmVolume;/);
    expect(app).toContain('setBgmVolume(prev => prev === settings.volume');
    expect(app).toContain('writeAudioPreferences({ volume: bgmVolume })');
    expect(app).toContain('unlockTitleBgm(audio, appBgmVolume(bgmVolumeRef.current))');
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


describe('canonical audio preference and mobile-safe title gain', () => {
  afterEach(() => vi.unstubAllGlobals());
  const storage = (initial: Record<string,string> = {}) => {
    const records = new Map(Object.entries(initial));
    vi.stubGlobal('localStorage', { getItem: (key:string) => records.get(key) ?? null, setItem: (key:string,value:string) => records.set(key,value) });
    return records;
  };
  it('migrates valid legacy volume only when the canonical preference is absent', () => {
    storage({bgm_volume:'0.27'}); expect(readAudioPreferences().volume).toBe(0.27);
    storage({bgm_volume:'0.27',battle_audio_settings:JSON.stringify({bgm:true,sfx:false,volume:0.81})});
    expect(readAudioPreferences().volume).toBe(0.81);
  });
  it('clamps corrupt and out-of-range values and preserves mute', () => {
    storage({bgm_volume:'not a number'}); expect(readAudioPreferences().volume).toBe(0.6);
    storage({bgm_volume:'0'}); expect(readAudioPreferences().volume).toBe(0);
    expect(writeAudioPreferences({volume:2}).volume).toBe(1);
    expect(writeAudioPreferences({volume:-2}).volume).toBe(0);
  });
  it('persists one volume without altering sfx or ON/OFF', () => {
    const records = storage({battle_audio_settings:JSON.stringify({bgm:false,sfx:true,volume:0.6})});
    writeAudioPreferences({volume:0.35});
    expect(readAudioPreferences()).toEqual({bgm:false,sfx:true,volume:0.35});
    expect(records.get('bgm_volume')).toBe('0.35');
  });
  it('keeps session settings when storage is unavailable', () => {
    vi.stubGlobal('localStorage', {getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}});
    writeAudioPreferences({volume:0.23,bgm:false}); expect(readAudioPreferences().volume).toBe(0.23);
  });
  it('changes native gain even when the platform ignores media volume; creates one route', () => {
    const nodes:any[]=[]; let contexts=0; let sources=0; let resumes=0;
    class Context {
      state='suspended'; destination={};
      constructor(){contexts++;}
      createGain(){const gain={gain:{value:1},connect:vi.fn()}; nodes.push(gain); return gain;}
      createMediaElementSource(){sources++;return {connect:vi.fn()};}
      resume(){resumes++;this.state='running';return Promise.resolve();}
    }
    vi.stubGlobal('window', {AudioContext:Context});
    const audio = {get volume(){return 1;},set volume(_v:number){}} as HTMLMediaElement;
    setTitleBgmVolume(audio,appBgmVolume(0.2));
    unlockTitleBgm(audio,appBgmVolume(0.8));
    expect(nodes[0].gain.value).toBeCloseTo(appBgmVolume(0.8));
    expect([contexts,sources,resumes]).toEqual([1,1,1]);
    setTitleBgmVolume(audio,0); expect(nodes[0].gain.value).toBe(0);
  });
});
