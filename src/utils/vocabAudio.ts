/**
 * 英単語の読み上げ音声（2026-10-19）。
 *
 * ElevenLabs で録った音声を scripts/vocab-audio/cut.py が1語ずつに切り、
 *   public/audio/vocab/<レベル>/<番号>.mp3（例 lv1/1.mp3 ＝ ev:lv1:1）
 *   public/audio/vocab/index.json（音声がある語ID の一覧）
 * に置く。音声がある語はそれを鳴らし、無い語・読み込めないときは端末の読み上げ（speechSynthesis）にする。
 * index.json が無いあいだ（まだ録っていない）は、これまでどおり全部端末の読み上げ。
 */
export const VOCAB_AUDIO_BASE = '/audio/vocab';

let index: Promise<Set<string>> | null = null;
let current: HTMLAudioElement | null = null;

/** 語ID → 音声の場所（ID の形が違えば null） */
export function vocabAudioUrl(wordId: string): string | null {
  const m = /^e[vi]:([a-z0-9]+):(\d+)$/.exec(wordId);
  return m ? `${VOCAB_AUDIO_BASE}/${m[1]}/${m[2]}.mp3` : null;
}

export function loadVocabAudioIndex(fetcher: typeof fetch = fetch): Promise<Set<string>> {
  if (!index) {
    index = fetcher(`${VOCAB_AUDIO_BASE}/index.json`, { cache: 'no-cache' })
      .then(r => (r.ok ? r.json() : { ids: [] }))
      .then((v: { ids?: unknown }) => new Set(Array.isArray(v?.ids) ? v.ids.filter((x): x is string => typeof x === 'string') : []))
      .catch(() => new Set<string>());
  }
  return index;
}

export function stopVocabAudio(): void {
  if (current) { current.pause(); current.src = ''; current = null; }
}

/**
 * 録音があれば鳴らす。鳴らせたら true、無い・失敗なら false（呼び出し側が端末の読み上げにする）。
 */
export async function playVocabAudio(wordId: string, onEnd?: () => void): Promise<boolean> {
  const url = vocabAudioUrl(wordId);
  if (!url || typeof Audio === 'undefined') return false;
  if (!(await loadVocabAudioIndex()).has(wordId)) return false;
  stopVocabAudio();
  const el = new Audio(url);
  current = el;
  el.onended = () => { if (current === el) current = null; onEnd?.(); };
  try { await el.play(); return true; } catch { if (current === el) current = null; return false; }
}

/** テスト用 */
export function __resetVocabAudio() { index = null; stopVocabAudio(); }
