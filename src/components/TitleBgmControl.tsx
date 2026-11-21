import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { setTitleBgmVolume, unlockTitleBgm } from '../battle/audio/titleMediaAudio';
import { readAudioPreferences, writeAudioPreferences } from '../battle/audio/audioPreferences';
import { safeGetItem, safeLocalStorage } from '../utils/safeLocalStorage';

export const TITLE_SCREEN_BGM_SRC = '/bgm/title_intro_bgm.mp3';
/**
 * タイトル画面専用BGM（動画④から抽出したループ音源: 実測 -23.0 LUFS / Peak -9.0 dBFS）。
 * 効果音や主CTAの邪魔にならない「控えめ」な音量（標準 volume=0.6 のとき実効 0.21 ≒ -29.5 LUFS）でループ再生する。
 */
export const TITLE_SCREEN_BGM_SUBTLE_GAIN = 0.35;
const TITLE_MUTE_STORAGE_KEY = 'title_screen_bgm_muted';

function readInitialMuted(): boolean {
  try {
    const saved = safeGetItem(TITLE_MUTE_STORAGE_KEY);
    if (saved === '1') return true;
    if (saved === '0') return false;
    return !readAudioPreferences().bgm;
  } catch {
    return false;
  }
}

export function useLaunchTitleBgm(active: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState<boolean>(readInitialMuted);
  const [interacted, setInteracted] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const activeRef = useRef(active);
  activeRef.current = active;

  const targetVolume = () => {
    if (mutedRef.current) return 0;
    const pref = readAudioPreferences();
    if (!pref.bgm) return 0;
    return Math.max(0, Math.min(1, pref.volume * TITLE_SCREEN_BGM_SUBTLE_GAIN));
  };

  useEffect(() => {
    const onGesture = () => {
      setInteracted(true);
      const audio = audioRef.current;
      if (audio && activeRef.current && !mutedRef.current && document.visibilityState !== 'hidden') {
        unlockTitleBgm(audio, targetVolume());
        // 自動再生制限時は次のユーザー操作で再開するため意図して無視する
        void audio.play().catch(() => undefined);
      }
    };
    window.addEventListener('pointerdown', onGesture, { passive: true });
    window.addEventListener('keydown', onGesture);
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (active && interacted && !muted && document.visibilityState !== 'hidden') {
      unlockTitleBgm(audio, targetVolume());
      if (audio.paused) {
        // 自動再生制限時は次のユーザー操作で再開するため意図して無視する
        void audio.play().catch(() => undefined);
      }
    } else if (!audio.paused) {
      setTitleBgmVolume(audio, 0);
      const t = window.setTimeout(() => audio.pause(), 180);
      return () => window.clearTimeout(t);
    }
  }, [active, interacted, muted]);

  useEffect(() => {
    const onVis = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.visibilityState === 'hidden') {
        audio.pause();
      } else if (activeRef.current && interacted && !mutedRef.current) {
        unlockTitleBgm(audio, targetVolume());
        // 自動再生制限時は次のユーザー操作で再開するため意図して無視する
        void audio.play().catch(() => undefined);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [interacted]);

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setInteracted(true);
    try {
      safeLocalStorage()?.setItem(TITLE_MUTE_STORAGE_KEY, next ? '1' : '0');
    } catch { /* ignore storage restrictions */ }
    writeAudioPreferences({ bgm: !next });
    const audio = audioRef.current;
    if (!audio) return;
    if (next) {
      setTitleBgmVolume(audio, 0);
      audio.pause();
    } else if (activeRef.current) {
      unlockTitleBgm(audio, Math.max(0.08, readAudioPreferences().volume * TITLE_SCREEN_BGM_SUBTLE_GAIN));
      // 再生拒否時は次操作で再開されるため無視する
      void audio.play().catch(() => undefined);
    }
  };

  const stopTitleBgm = () => {
    activeRef.current = false;
    const audio = audioRef.current;
    if (!audio) return;
    setTitleBgmVolume(audio, 0);
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch { /* ignore seek before metadata */ }
  };

  return { audioRef, muted, toggleMute, stopTitleBgm };
}

export function TitleBgmMuteButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="launch-bgm-toggle"
      onClick={onToggle}
      aria-pressed={!muted}
      aria-label={muted ? 'タイトルBGMをオンにする' : 'タイトルBGMをミュートする'}
      data-title-bgm-toggle
    >
      {muted ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
      <span>{muted ? 'BGM OFF' : 'BGM ON'}</span>
    </button>
  );
}
