import { BATTLE_AUDIO_STORAGE_KEY, parseBattleAudioSettings, serializeBattleAudioSettings, type BattleAudioSettings } from '../core/audioSettings';

let sessionSettings: BattleAudioSettings | undefined;

export function readAudioPreferences(): BattleAudioSettings {
  try {
    const raw = localStorage.getItem(BATTLE_AUDIO_STORAGE_KEY);
    const settings = parseBattleAudioSettings(raw);
    if (raw === null) {
      const legacy = localStorage.getItem('battle_sfx');
      // Preserve the app's previous quiet default and explicit preferences.
      settings.sfx = legacy === 'on';
      const volume = localStorage.getItem('bgm_volume');
      if (volume !== null && volume.trim() !== '' && Number.isFinite(Number(volume))) {
        settings.volume = Math.min(1, Math.max(0, Number(volume)));
      }
    }
    return settings;
  } catch { return sessionSettings ?? { ...parseBattleAudioSettings(null), sfx: false }; }
}
export function writeAudioPreferences(patch: Partial<BattleAudioSettings>): BattleAudioSettings {
  const next = parseBattleAudioSettings(serializeBattleAudioSettings({ ...readAudioPreferences(), ...patch }));
  sessionSettings = next;
  try {
    localStorage.setItem(BATTLE_AUDIO_STORAGE_KEY, serializeBattleAudioSettings(next));
    // Keep legacy readers compatible; only the canonical record is read when present.
    localStorage.setItem('bgm_volume', String(next.volume));
  } catch { /* session state still applies */ }
  globalThis.dispatchEvent?.(new Event('battle-audio-settings'));
  return next;
}
