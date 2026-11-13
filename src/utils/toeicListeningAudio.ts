/**
 * TOEIC® L&R リスニング音源再生（2026-11-12）
 *
 * ■ しくみ
 *   1. ElevenLabs で収録した MP3 を `public/audio/toeic_listening/<trackId>.mp3` に置き、
 *      `public/audio/toeic_listening/index.json` に収録済み trackId 一覧（`{ rev, ids }`）を記録する。
 *   2. 収録済み MP3 があるトラックは HTMLAudioElement で再生し、
 *      まだ MP3 が無いトラック（または再生エラー時）はブラウザの Web Speech API（speakDialogue / speak）に
 *      自動フォールバックして対話・説明文・応答選択肢を読み上げる。
 *   3. これにより、ElevenLabs 録音前の段階でも全15回（120トラック・180問）がそのまま演習でき、
 *      録音ファイルを置けばコード変更なしで順次ネイティブ音源へ切り替わる。
 */
import { pauseAllAudio } from './audioElements';
import { isSpeechSupported, speak, speakDialogue, stopSpeech, type SpeechTurn } from './listeningSpeech';

export const TOEIC_LISTENING_AUDIO_BASE = '/audio/toeic_listening';

interface ToeicAudioIndex {
  rev: string;
  ids: Set<string>;
}

const EMPTY_INDEX: ToeicAudioIndex = { rev: '', ids: new Set() };

let loadedIndex: ToeicAudioIndex | null = null;
let loadingIndex: Promise<ToeicAudioIndex> | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentTrackKey: string | null = null;
let currentEndCallback: (() => void) | null = null;

export function toeicListeningAudioUrl(trackId: string, rev = ''): string | null {
  if (!/^tpl_r\d{2}_(?:p2_q[1-6]|p3|p4)$/.test(trackId)) return null;
  return `${TOEIC_LISTENING_AUDIO_BASE}/${trackId}.mp3${rev ? `?v=${encodeURIComponent(rev)}` : ''}`;
}

export function loadToeicListeningAudioIndex(fetcher: typeof fetch = fetch): Promise<ToeicAudioIndex> {
  if (loadedIndex) return Promise.resolve(loadedIndex);
  if (!loadingIndex) {
    loadingIndex = fetcher(`${TOEIC_LISTENING_AUDIO_BASE}/index.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((v: { rev?: unknown; ids?: unknown } | null) => {
        const ids = new Set(Array.isArray(v?.ids) ? v.ids.filter((x): x is string => typeof x === 'string') : []);
        const next = { rev: typeof v?.rev === 'string' ? v.rev : '', ids };
        loadedIndex = next;
        return next;
      })
      .catch(() => EMPTY_INDEX)
      .finally(() => {
        loadingIndex = null;
      });
  }
  return loadingIndex;
}

export function prefetchToeicListeningAudioIndex(): void {
  if (typeof window !== 'undefined') void loadToeicListeningAudioIndex();
}

export function hasToeicListeningMp3(trackId: string): boolean {
  return Boolean(loadedIndex?.ids.has(trackId));
}

export function getPlayingToeicTrack(): string | null {
  return currentTrackKey;
}

export function stopToeicListeningAudio(): void {
  const cb = currentEndCallback;
  currentEndCallback = null;
  currentTrackKey = null;
  if (currentAudio) {
    const el = currentAudio;
    currentAudio = null;
    try {
      el.pause();
      el.removeAttribute('src');
      el.load();
    } catch {
      /* 再生停止できない環境は無視する */
    }
  }
  stopSpeech();
  cb?.();
}

export interface PlayToeicTrackInput {
  trackId: string;
  turns?: readonly SpeechTurn[];
  fallbackScript: string;
  rate?: number;
  onEnd?: () => void;
}

/**
 * トラックを再生する（収録済み MP3 優先 → 失敗または未収録時は Web Speech API）。
 * @returns 再生を開始できたら 'mp3' | 'tts'、どちらも使えない環境なら null
 */
export function playToeicListeningTrack(input: PlayToeicTrackInput): 'mp3' | 'tts' | null {
  const rate = input.rate && Number.isFinite(input.rate) ? input.rate : 1.0;
  stopToeicListeningAudio();
  pauseAllAudio();

  const finish = () => {
    if (currentTrackKey !== input.trackId) return;
    currentTrackKey = null;
    const cb = currentEndCallback;
    currentEndCallback = null;
    cb?.();
  };

  const startSpeechFallback = (): 'tts' | null => {
    if (!isSpeechSupported()) {
      currentTrackKey = null;
      currentEndCallback = null;
      return null;
    }
    currentTrackKey = input.trackId;
    currentEndCallback = input.onEnd ?? null;
    const ok = input.turns && input.turns.length > 0
      ? speakDialogue(`toeic_${input.trackId}`, [...input.turns], 1, { rate, onEnd: finish })
      : speak(`toeic_${input.trackId}`, input.fallbackScript, 1, { rate, onEnd: finish });
    if (!ok) {
      currentTrackKey = null;
      currentEndCallback = null;
      return null;
    }
    return 'tts';
  };

  if (typeof Audio !== 'undefined' && hasToeicListeningMp3(input.trackId)) {
    const url = toeicListeningAudioUrl(input.trackId, loadedIndex?.rev);
    if (url) {
      const el = new Audio(url);
      el.preload = 'auto';
      el.playbackRate = rate;
      currentAudio = el;
      currentTrackKey = input.trackId;
      currentEndCallback = input.onEnd ?? null;
      let switched = false;
      const fallback = () => {
        if (switched || currentAudio !== el) return;
        switched = true;
        currentAudio = null;
        if (!startSpeechFallback()) {
          const cb = currentEndCallback;
          currentEndCallback = null;
          currentTrackKey = null;
          cb?.();
        }
      };
      el.onended = () => {
        if (currentAudio === el) currentAudio = null;
        finish();
      };
      el.onerror = fallback;
      try {
        const p = el.play();
        if (p && typeof p.catch === 'function') p.catch(fallback);
        return 'mp3';
      } catch {
        fallback();
        return currentTrackKey ? 'tts' : null;
      }
    }
  }

  return startSpeechFallback();
}

/** テスト用リセット */
export function __resetToeicListeningAudio(value: ToeicAudioIndex | null = null): void {
  stopToeicListeningAudio();
  loadedIndex = value;
  loadingIndex = null;
}
