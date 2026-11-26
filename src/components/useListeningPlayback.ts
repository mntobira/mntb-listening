/**
 * 復習用・演習用の音源プレーヤーの「再生の中身」（C-10）。
 * ListeningAudioPlayer.tsx から移した。中身（状態・再生・2回読み・1回だけ再生・読み上げ代替）は1文字も変えていない。
 *
 * ★フックの順番★ ListeningAudioPlayer の元の位置（list を作った直後）で呼ぶので、
 *   React から見たフックの並びは以前と同じ。見た目（JSX）は ListeningAudioPlayer に残している。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ListeningAudioTrack } from '../data/englishListeningQ1AProblems';
import { pauseAllAudio } from '../utils/audioElements';
import {
  hasRealAudio,
  isSpeechSupported,
  speak,
  speakDialogue,
  stopSpeech,
} from '../utils/listeningSpeech';

export function useListeningPlayback(list: ListeningAudioTrack[], { playOnce, isReview }: { playOnce: boolean; isReview: boolean }) {
  /** いま再生中のトラック（null なら停止中） */
  const [playingId, setPlayingId] = useState<string | null>(null);
  /** スクリプトを開いているトラック（復習モードのみ） */
  const [openScriptId, setOpenScriptId] = useState<string | null>(null);
  /** 「2回続けて再生」の残り回数。1 なら再生終了後にもう一度鳴らす */
  const repeatLeft = useRef(0);
  /** 再生速度（0.75 はゆっくり確認用） */
  const [rate, setRate] = useState(1);
  /**
   * 最後まで再生し終えたトラック（1回だけ再生の制限用）。
   * practice かつ playOnce のときだけ意味を持つ。
   */
  const [finishedIds, setFinishedIds] = useState<Set<string>>(() => new Set());
  const lockOnce = playOnce && !isReview;
  const isLocked = (subId: string) => lockOnce && finishedIds.has(subId);

  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  /** 復習用のシークバー表示（現在時刻と総時間・秒） */
  const [progressMap, setProgressMap] = useState<Record<string, { cur: number; dur: number }>>({});

  /**
   * MP3 を持たないトラックがあるか。
   * PDF 由来の類題集は音源ファイルが無いため、読み上げ（SpeechSynthesis）で代替する。
   * 1つでも代替対象があれば、その旨をユーザーに明示する。
   */
  const usesSpeech = useMemo(() => list.some((t) => !hasRealAudio(t)), [list]);
  /** 読み上げが使えない端末では「音が出ない理由」を伝える必要がある */
  const speechBlocked = usesSpeech && !isSpeechSupported();

  // アンマウント時は必ず止める（画面遷移後に音だけ残るのを防ぐ）
  useEffect(() => {
    const refs = audioRefs;
    return () => {
      (Object.values(refs.current) as (HTMLAudioElement | null)[]).forEach((el) => {
        if (el && !el.paused) el.pause();
      });
      stopSpeech();
    };
  }, []);

  // 再生速度の変更は再生中の要素にも即時反映する
  useEffect(() => {
    (Object.values(audioRefs.current) as (HTMLAudioElement | null)[]).forEach((el) => {
      if (el) el.playbackRate = rate;
    });
  }, [rate]);

  /**
   * 指定トラックを再生する。
   *   - startFromSec 指定時 … その秒数から流す（復習時の途中再生・文頭ジャンプ用）
   *   - resumeIfPaused=true かつ一時停止中の位置が残っている場合 … 先頭に戻さず続きから流す
   *   - repeat=true … 本番同様に2回続けて流す（先頭から）
   */
  const play = useCallback(
    (subId: string, repeat = false, opts?: { startFromSec?: number; resumeIfPaused?: boolean }) => {
      const track = list.find((t) => t.subId === subId);
      if (!track) return;
      // 1回だけ再生：聞き終えた音源はもう鳴らさない（本番は1回読み）
      if (lockOnce && finishedIds.has(subId)) return;

      // ---- MP3 が無い問題：ブラウザの音声合成で読み上げる ----
      if (!hasRealAudio(track)) {
        pauseAllAudio(null);
        repeatLeft.current = 0;
        // 対話（第3問）は話者ごとに声を替える。1つの声で通して読むと
        // どこで話者が替わったか分からず、「男性は何をするか」型の設問が解けない。
        const started = track.turns && track.turns.length > 0
          ? speakDialogue(subId, track.turns, repeat ? 2 : 1, {
              rate,
              onEnd: () => {
                setPlayingId(null);
                if (lockOnce) setFinishedIds((prev) => new Set(prev).add(subId));
              },
            })
          : speak(subId, track.script, repeat ? 2 : 1, {
              rate,
              onEnd: () => {
                setPlayingId(null);
                if (lockOnce) setFinishedIds((prev) => new Set(prev).add(subId));
              },
            });
        setPlayingId(started ? subId : null);
        return;
      }

      // ---- 通常経路：MP3 を再生する ----
      const el = audioRefs.current[subId];
      if (!el) return;
      stopSpeech();
      pauseAllAudio(el);
      repeatLeft.current = repeat ? 1 : 0;
      if (typeof opts?.startFromSec === 'number' && Number.isFinite(opts.startFromSec)) {
        el.currentTime = Math.max(0, opts.startFromSec);
      } else if (
        opts?.resumeIfPaused &&
        !repeat &&
        el.currentTime > 0.15 &&
        (!Number.isFinite(el.duration) || el.currentTime < el.duration - 0.15)
      ) {
        // 一時停止位置が残っていれば続きから再開する
      } else {
        el.currentTime = 0;
      }
      el.playbackRate = rate;
      const p = el.play();
      if (p !== undefined) {
        p.then(() => setPlayingId(subId)).catch(() => setPlayingId(null));
      } else {
        setPlayingId(subId);
      }
    },
    [rate, list, lockOnce, finishedIds],
  );

  /** 再生位置（秒）を動かす。再生中ならそのままの位置から鳴らし続け、停止中なら位置だけ合わせて再生を始められるようにする。 */
  const seek = useCallback((subId: string, sec: number, autoPlay = false) => {
    const el = audioRefs.current[subId];
    if (!el) return;
    const clamped = Math.max(0, Number.isFinite(el.duration) && el.duration > 0 ? Math.min(sec, el.duration) : sec);
    el.currentTime = clamped;
    setProgressMap((prev) => ({
      ...prev,
      [subId]: { cur: clamped, dur: Number.isFinite(el.duration) && el.duration > 0 ? el.duration : prev[subId]?.dur ?? 0 },
    }));
    if (autoPlay) {
      play(subId, false, { startFromSec: clamped });
    }
  }, [play]);

  const updateProgress = useCallback((subId: string, el: HTMLAudioElement | null) => {
    if (!el) return;
    const dur = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 0;
    const cur = Number.isFinite(el.currentTime) ? el.currentTime : 0;
    setProgressMap((prev) => {
      const old = prev[subId];
      if (old && Math.abs(old.cur - cur) < 0.08 && Math.abs(old.dur - dur) < 0.08) return prev;
      return { ...prev, [subId]: { cur, dur } };
    });
  }, []);

  /** 再生／一時停止のトグル（同じボタンを2回押したら止まる。復習モードでは一時停止位置から再開）。 */
  const toggle = useCallback(
    (subId: string) => {
      const track = list.find((t) => t.subId === subId);
      if (!track) return;

      // 読み上げ経路：SpeechSynthesis は一時停止より「止めて読み直す」方が分かりやすい
      if (!hasRealAudio(track)) {
        if (playingId === subId) {
          stopSpeech();
          setPlayingId(null);
          return;
        }
        play(subId, false);
        return;
      }

      const el = audioRefs.current[subId];
      if (!el) return;
      if (playingId === subId && !el.paused) {
        el.pause();
        repeatLeft.current = 0;
        setPlayingId(null);
        return;
      }
      play(subId, false, { resumeIfPaused: isReview });
    },
    [playingId, play, list, isReview],
  );

  /** 再生終了時。2回読みの残りがあればもう一度鳴らす。 */
  const handleEnded = useCallback((subId: string) => {
    if (repeatLeft.current > 0) {
      repeatLeft.current -= 1;
      const el = audioRefs.current[subId];
      if (el) {
        el.currentTime = 0;
        const p = el.play();
        if (p !== undefined) p.catch(() => setPlayingId(null));
        return;
      }
    }
    setPlayingId(null);
    const el = audioRefs.current[subId];
    if (el) {
      el.currentTime = 0;
      updateProgress(subId, el);
    }
    // 最後まで聞き終えた → 1回だけ再生の制限が掛かる
    if (lockOnce) setFinishedIds((prev) => new Set(prev).add(subId));
  }, [lockOnce, updateProgress]);

  return {
    playingId, setPlayingId, openScriptId, setOpenScriptId, rate, setRate,
    lockOnce, isLocked, audioRefs, usesSpeech, speechBlocked, play, toggle, handleEnded,
    progressMap, seek, updateProgress,
  };
}
