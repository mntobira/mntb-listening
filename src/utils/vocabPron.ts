/**
 * 単語帳の「読み方」表示のデータ（2026-11-03）。
 *
 * public/data/vocabPron.json（scripts/vocab-audio/make_pron.py が作る）
 *   { v:1, words: { 語ID: [ARPAbet, 音節 "um|brel|la", 強勢の番号] } }
 * を1回だけ読む。発音記号はリスニングの音読モードと同じ toIpa() で ARPAbet から作る。
 * 読めなかったとき・辞書に無い語は null（画面は何も出さない＝今までどおり）。
 */
import { toIpa } from '../features/readAlong/readAlong';

export const VOCAB_PRON_URL = '/data/vocabPron.json';

export interface VocabPron {
  /** 発音記号（強勢記号 ˈ つき。熟語は語ごとに空白） */
  ipa: string;
  /** つづりの音節（1音節・熟語は [見出し語]） */
  syl: string[];
  /** 強く読む音節の番号（0 から。音節が1つ・分からないときは -1） */
  stress: number;
  /** 音節の数（発音の上の数） */
  count: number;
}

type Raw = [arpabet: string, syl: string, stress: number];
let table: Record<string, Raw> | null = null;
let loading: Promise<Record<string, Raw>> | null = null;

export function parseVocabPron(v: unknown): Record<string, Raw> {
  const words = (v as { words?: unknown } | null)?.words;
  if (!words || typeof words !== 'object') return {};
  const out: Record<string, Raw> = {};
  for (const [id, e] of Object.entries(words as Record<string, unknown>)) {
    if (Array.isArray(e) && typeof e[0] === 'string' && typeof e[1] === 'string' && typeof e[2] === 'number') out[id] = [e[0], e[1], e[2]];
  }
  return out;
}

/** 1回だけ読む（失敗したら空。次に呼ばれたとき読み直す） */
export function loadVocabPron(fetcher: typeof fetch = fetch): Promise<Record<string, Raw>> {
  if (table) return Promise.resolve(table);
  if (!loading) {
    loading = fetcher(VOCAB_PRON_URL)
      .then(r => (r.ok ? r.json() : null))
      .then(v => { const t = parseVocabPron(v); if (Object.keys(t).length) table = t; return t; })
      .catch(() => ({}))
      .finally(() => { loading = null; });
  }
  return loading;
}

/** 語ID・見出し語 → 表示用の読み方（データが無ければ null） */
export function pronOf(t: Record<string, Raw> | null, id: string, word: string): VocabPron | null {
  const e = t?.[id];
  if (!e) return null;
  const [arpa, sylStr, st] = e;
  const p = toIpa(arpa);
  if (!p.ipa) return null;
  const syl = sylStr && sylStr.replace(/\|/g, '') === word ? sylStr.split('|') : [word];
  return { ipa: p.ipa, syl, stress: syl.length > 1 && st >= 0 && st < syl.length ? st : -1, count: p.syllables };
}

/** テスト用：読み込んだ表を捨てる */
export function resetVocabPronForTest(): void { table = null; loading = null; }
