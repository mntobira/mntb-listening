/**
 * ===================================================================
 * useBattleAudio — 対戦の音の設定と再生を React に繋ぐ
 * ===================================================================
 *
 * ■ 設定は localStorage に保存し、タブ間・画面間で同じ値を共有する。
 *   （設定画面 ProfileModal と対戦画面の両方がこのフックを使う。
 *    片方で変えたら storage イベントで他方にも届く。）
 *
 * ■ 鳴らす側（対戦画面）は engine を直接呼ぶ。
 *   play('correct') のような呼び出しは副作用なので useEffect の中から行う。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  BATTLE_AUDIO_STORAGE_KEY,
  type BattleAudioSettings,
} from '../core/audioSettings';
import { battleAudio, type BattleSfx } from '../audio/battleAudio';
import type { BattleBgmTrack } from '../core/audioSettings';

import { readAudioPreferences as readSettings, writeAudioPreferences } from '../audio/audioPreferences';

export function useBattleAudioSettings(): [
  BattleAudioSettings,
  (patch: Partial<BattleAudioSettings>) => void,
] {
  const [settings, setSettings] = useState<BattleAudioSettings>(readSettings);

  // 他の画面・タブでの変更を受け取る
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === BATTLE_AUDIO_STORAGE_KEY) setSettings(readSettings());
    };
    const onLocal = () => setSettings(readSettings());
    window.addEventListener('storage', onStorage);
    window.addEventListener('battle-audio-settings', onLocal);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('battle-audio-settings', onLocal);
    };
  }, []);

  // エンジンへ反映
  useEffect(() => {
    battleAudio().setSettings(settings);
  }, [settings]);

  const update = useCallback((patch: Partial<BattleAudioSettings>) => {
    const next = writeAudioPreferences(patch);
    setSettings(next);
    // 設定を触った＝ユーザー操作なので、この機会に再生制限を解いておく
    battleAudio().unlock();
  }, []);

  return [settings, update];
}

/**
 * 対戦画面用：効果音と BGM の操作。
 *
 * @param track いま鳴らすべき BGM（null で止める）。局面から呼び出し側が決める。
 */
export function useBattleAudio(track: BattleBgmTrack, startInMs?: number, priority = 10) {
  const [settings] = useBattleAudioSettings();
  const engine = useMemo(() => battleAudio(), []);
  const owner = useRef(Symbol('bgm-screen'));
  // startInMs は曲を始める瞬間の値だけ使う（毎フレーム変わる値で effect を回さない）
  const startRef = useRef<number | undefined>(startInMs);
  startRef.current = startInMs;

  useEffect(() => {
    engine.setBgmOwner(owner.current, track, priority, startRef.current);
  }, [engine, track, priority, settings.bgm]);

  // 画面を離れたら止める
  useEffect(() => {
    const token = owner.current;
    const resume = () => { if (document.visibilityState !== 'hidden') engine.unlock(); };
    window.addEventListener('pointerdown', resume);
    window.addEventListener('pageshow', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      engine.releaseBgmOwner(token);
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('pageshow', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [engine]);

  const play = useCallback((sfx: BattleSfx) => engine.play(sfx), [engine]);
  const unlock = useCallback(() => engine.unlock(), [engine]);

  return { play, unlock, settings };
}
