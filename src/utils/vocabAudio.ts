/**
 * 英単語の読み上げ音声（2026-10-19）。
 *
 * ElevenLabs で録った音声を scripts/vocab-audio/cut.py が1語ずつに切り、
 *   public/audio/vocab/<レベル>/<番号>.mp3（例 lv1/1.mp3 ＝ ev:lv1:1）
 *   public/audio/vocab/index.json（音声がある語ID と版。{ version, rev, ids }）
 * に置く。音声がある語はそれを鳴らし、無い語・読み込めないときは端末の読み上げ（speechSynthesis）にする。
 * index.json が無いあいだ（まだ録っていない）は、これまでどおり全部端末の読み上げ。
 *
 * ■ 起きうる失敗と、その対策（2026-10-19 見直し）
 *   ① iPhone は「タップの中で」play() しないと音が出ない
 *      → index.json は画面を開いたときに先に読んでおき（prefetchVocabAudioIndex）、
 *        タップでは待たずにその場で new Audio().play() する。待つ処理を挟まない
 *   ② 録り直した音声が、古いキャッシュのまま鳴る
 *      → URL に版（rev）を付ける（?v=rev）。cut.py が切るたびに rev を変える
 *   ③ 音声ファイルが壊れている・届かない
 *      → error / 再生失敗のときは端末の読み上げに切り替える（onFail）
 *   ④ 連打で音が重なる
 *      → 新しく鳴らす前に、前の音を必ず止める
 *   ⑤ 音声が多すぎてアプリ・サーバーが重くなる
 *      → 1語 約0.6〜1秒・モノラル 48kbps（1語 約5KB、全語で 約30MB）。画面を開いても先読みしない
 */
export const VOCAB_AUDIO_BASE = '/audio/vocab';

interface VocabAudioIndex { rev: string; ids: Set<string> }
const EMPTY: VocabAudioIndex = { rev: '', ids: new Set() };

let loaded: VocabAudioIndex | null = null;
let loading: Promise<VocabAudioIndex> | null = null;
let current: HTMLAudioElement | null = null;

/** 語ID → 音声の場所（ID の形が違えば null） */
export function vocabAudioUrl(wordId: string, rev = ''): string | null {
  const m = /^e[vi]:([a-z0-9]+):(\d+)$/.exec(wordId);
  if (!m) return null;
  return `${VOCAB_AUDIO_BASE}/${m[1]}/${m[2]}.mp3${rev ? `?v=${encodeURIComponent(rev)}` : ''}`;
}

/** index.json を読む（1回だけ。失敗したら「録音なし」として扱い、次に画面を開いたとき読み直す） */
export function loadVocabAudioIndex(fetcher: typeof fetch = fetch): Promise<VocabAudioIndex> {
  if (loaded) return Promise.resolve(loaded);
  if (!loading) {
    loading = fetcher(`${VOCAB_AUDIO_BASE}/index.json`, { cache: 'no-cache' })
      .then(r => (r.ok ? r.json() : null))
      .then((v: { rev?: unknown; ids?: unknown } | null) => {
        const ids = new Set(Array.isArray(v?.ids) ? v!.ids.filter((x): x is string => typeof x === 'string') : []);
        const value = { rev: typeof v?.rev === 'string' ? v.rev : '', ids };
        loaded = value;
        return value;
      })
      .catch(() => EMPTY)
      .finally(() => { loading = null; });
  }
  return loading;
}

/** 単語帳・4択を開いたときに呼ぶ（タップの前に読み終えておくため） */
export function prefetchVocabAudioIndex(): void {
  if (typeof window !== 'undefined') void loadVocabAudioIndex();
}

/** その語の録音があるか（index.json を読み終えていなければ false＝端末の読み上げ） */
export function hasVocabAudio(wordId: string): boolean {
  return Boolean(loaded?.ids.has(wordId));
}

export function stopVocabAudio(): void {
  if (!current) return;
  const el = current;
  current = null;
  try { el.pause(); el.removeAttribute('src'); el.load(); } catch { /* 止められない環境は無視 */ }
}

/**
 * 録音を鳴らす。★必ずタップの処理の中から、待たずに呼ぶ★（iPhone の制限）
 * @returns 鳴らし始めたら true。録音が無ければ false（呼び出し側がすぐ端末の読み上げにする）
 * @param onFail 再生できなかったとき（壊れたファイル・通信切れ）に呼ぶ。端末の読み上げに切り替える用
 */
export function playVocabAudio(wordId: string, onFail?: () => void, onEnd?: () => void): boolean {
  if (typeof Audio === 'undefined' || !hasVocabAudio(wordId)) return false;
  const url = vocabAudioUrl(wordId, loaded?.rev);
  if (!url) return false;
  stopVocabAudio();
  const el = new Audio(url);
  el.preload = 'auto';
  current = el;
  let failed = false;
  const fail = () => {
    if (failed || current !== el) return;
    failed = true; current = null;
    onFail?.();
  };
  el.onended = () => { if (current === el) current = null; onEnd?.(); };
  el.onerror = fail;
  try {
    const p = el.play();
    if (p && typeof p.catch === 'function') p.catch(fail);
  } catch { fail(); }
  return true;
}

/** テスト用 */
export function __resetVocabAudio(value: VocabAudioIndex | null = null) { loaded = value; loading = null; stopVocabAudio(); }
