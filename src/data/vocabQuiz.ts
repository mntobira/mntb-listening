/**
 * 英単語の4択演習（2026-10-01 D／2026-10-17 市販の単語アプリと同じ出題設定に）
 *
 * 単語帳（覚える）とは別に、英文法・リスニングと同じ「4択の問題」として解く。
 *
 * ★抜けなく覚える（2026-10-17 ご要望）★
 *   以前は「100語の中からランダムに10問」固定で、何回やっても出ない語が残り、問題数も選べなかった。
 *   市販の単語アプリと同じく、出題を自分で決められるようにする：
 *     - 語にはレベルごとに 1 からの番号（No.）を振る（データの並び＝頻度順のまま。単語帳と同じ番号）
 *     - 範囲（No.◯〜◯）・問題数（10／20／30／50／100／全部）・順番（番号順／ランダム）・出す語（まだの語だけ／すべて）
 *     - 正解した語は「覚えた（✓）」。間違えたら ✓ を外して「単語の復習」へ
 *     - 既定は「番号順 × まだの語だけ」。解くたびに No.1 から順に、抜けなく進む
 *
 * 問題文・選択肢はデータ（listeningVocabulary.json の questions）をそのまま使う。ここでは選ぶ・並べるだけ。
 */
import type { ListeningWord, WordQuestion } from './listeningSupport';
import { safeLocalStorage } from '../utils/safeLocalStorage';

export const QUIZ_SIZE = 10;
export const BLOCK_SIZE = 100;
export type QuizDirection = 'mix' | 'e2j' | 'j2e';

export interface QuizItem { wordId: string; word: string; q: WordQuestion; dir: 'e2j' | 'j2e'; /** レベル内の番号（1 から） */ no?: number }

/** 再現できる乱数（同じ seed なら同じ並び） */
export function rng(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

const dirOf = (q: WordQuestion): 'e2j' | 'j2e' => (q.id.endsWith(':j2e') ? 'j2e' : 'e2j');

/**
 * 1セット（10問）を作る。
 *   - 復習待ちの語（missed）を先に入れる（範囲内のものだけ）
 *   - 残りは範囲からランダム。同じ語は1セットに1回まで
 *   - 方向が指定されていればその向きの問題だけ（無い語は飛ばす）
 */
export function buildQuiz(words: readonly ListeningWord[], opts: { missed?: readonly string[]; dir?: QuizDirection; size?: number; seed?: number; prefer?: readonly string[] } = {}): QuizItem[] {
  const size = opts.size ?? QUIZ_SIZE;
  const r = rng(opts.seed ?? Date.now());
  const dir = opts.dir ?? 'mix';
  const pickQ = (w: ListeningWord): WordQuestion | undefined => {
    const qs = w.questions.filter(q => dir === 'mix' || dirOf(q) === dir);
    if (!qs.length) return undefined;
    return qs[Math.floor(r() * qs.length)];
  };
  const missed = new Set(opts.missed ?? []);
  const prefer = new Set(opts.prefer ?? []);
  const shuffle = <T,>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const first = words.filter(w => missed.has(w.id));
  // prefer（例：まだ ✓ が付いていない語）を、残りより先に（どちらも中はランダム）
  const second = shuffle(words.filter(w => !missed.has(w.id) && prefer.has(w.id)));
  const rest = shuffle(words.filter(w => !missed.has(w.id) && !prefer.has(w.id)));
  const out: QuizItem[] = [];
  for (const w of [...first, ...second, ...rest]) {
    if (out.length >= size) break;
    const q = pickQ(w);
    if (q) out.push({ wordId: w.id, word: w.word, q, dir: dirOf(q) });
  }
  return out;
}

/** 範囲（レベル内の 100語ブロック）を切り出す */
export function blockWords(words: readonly ListeningWord[], level: string, block: number): ListeningWord[] {
  const lv = words.filter(w => w.level === level);
  return lv.slice(block * BLOCK_SIZE, block * BLOCK_SIZE + BLOCK_SIZE);
}
export function blockCount(words: readonly ListeningWord[], level: string): number {
  return Math.ceil(words.filter(w => w.level === level).length / BLOCK_SIZE);
}

/** 語の番号（レベルごとに 1 から。データの並び＝頻度順）。id → No. */
export function wordNumbers(words: readonly ListeningWord[]): Map<string, number> {
  const next: Record<string, number> = {}; const out = new Map<string, number>();
  for (const w of words) { next[w.level] = (next[w.level] ?? 0) + 1; out.set(w.id, next[w.level]); }
  return out;
}

/**
 * 出題の設定（市販の単語アプリと同じく、範囲・問題数・順番・出す語を自分で選ぶ。2026-10-17）
 *   from / to … 番号の範囲（レベル内の No.・両端を含む）
 *   count     … 問題数（'all' は範囲の語を全部）
 *   order     … 'number' 番号順／'random' ランダム
 *   only      … 'unlearned' まだ ✓ が付いていない語だけ／'all' 範囲の語すべて
 * 番号順 × まだの語だけ にしておけば、解くたびに No.1 から順に抜けなく進む。
 */
export const COUNT_OPTIONS = [10, 20, 30, 50, 100, 'all'] as const;
export type QuizCount = (typeof COUNT_OPTIONS)[number];
export type QuizOrder = 'number' | 'random';
export type QuizOnly = 'unlearned' | 'all';
export interface RangeSettings { from: number; to: number; count: QuizCount; order: QuizOrder; only: QuizOnly }

/** 範囲の語（番号順）を取り出す。範囲はレベルの語数に収める */
export function rangeWords(words: readonly ListeningWord[], level: string, from: number, to: number): ListeningWord[] {
  const lv = words.filter(w => w.level === level);
  const [a, b] = clampRange(from, to, lv.length);
  return lv.slice(a - 1, b);
}
/** 範囲を 1〜max に収め、逆なら入れ替える */
export function clampRange(from: number, to: number, max: number): [number, number] {
  const f = (n: number) => Math.max(1, Math.min(max, Math.round(Number.isFinite(n) ? n : 1)));
  const a = f(from), b = f(to);
  return a <= b ? [a, b] : [b, a];
}

/**
 * 範囲と設定から出題を作る。
 *   - only='unlearned' で ✓ がまだの語が無ければ（範囲を全部覚えた）、範囲の語すべてから出す
 *   - order='number' は番号の小さい順に count 語（＝続きから）。出す順番は並べ替えない
 *   - order='random' は範囲からランダムに count 語（復習待ちの語を先に）
 *   - 向きを指定してその向きの問題が無い語は、もう一方の向きで出す（＝語を飛ばさない）
 */
export function buildRangeQuiz(list: readonly ListeningWord[], set: Pick<RangeSettings, 'count' | 'order' | 'only'>, opts: { mastered?: ReadonlySet<string>; missed?: readonly string[]; dir?: QuizDirection; seed?: number; numbers?: ReadonlyMap<string, number> } = {}): { items: QuizItem[]; allLearned: boolean } {
  const mastered = opts.mastered ?? new Set<string>();
  const pool0 = set.only === 'unlearned' ? list.filter(w => !mastered.has(w.id)) : list.slice();
  const allLearned = set.only === 'unlearned' && pool0.length === 0;
  const pool = allLearned ? list.slice() : pool0;
  const n = set.count === 'all' ? pool.length : Math.min(set.count, pool.length);
  const seed = opts.seed ?? Date.now();
  let picked: readonly ListeningWord[];
  if (set.order === 'number') picked = pool.slice(0, n);
  else picked = buildQuiz(pool, { missed: opts.missed, size: n, seed, dir: 'mix' }).map(x => pool.find(w => w.id === x.wordId)!).filter(Boolean);
  const r = rng(seed ^ 0x2545f491);
  const pickQ = (w: ListeningWord): QuizItem | undefined => {
    const want = opts.dir ?? 'mix';
    let qs = w.questions.filter(q => want === 'mix' || dirOf(q) === want);
    if (!qs.length) qs = w.questions; // その向きの問題が無い語も、もう一方の向きで出す
    if (!qs.length) return undefined;
    const q = qs[Math.floor(r() * qs.length)]!;
    return { wordId: w.id, word: w.word, q, dir: dirOf(q), no: opts.numbers?.get(w.id) };
  };
  return { items: picked.map(pickQ).filter((x): x is QuizItem => !!x), allLearned };
}

const PREF_KEY = (uid: string) => 'vocab_quiz_prefs_v1_' + encodeURIComponent(uid || 'guest');
/** レベルごとの範囲と、全体の問題数・順番・出す語の好み */
export interface QuizPrefs { count: QuizCount; order: QuizOrder; only: QuizOnly; ranges: Record<string, [number, number]> }
export const DEFAULT_PREFS: QuizPrefs = { count: 10, order: 'number', only: 'unlearned', ranges: {} };
export function readQuizPrefs(uid: string): QuizPrefs {
  try {
    const v = JSON.parse(safeLocalStorage()?.getItem(PREF_KEY(uid)) || 'null');
    if (!v || typeof v !== 'object') return { ...DEFAULT_PREFS, ranges: {} };
    const count = (COUNT_OPTIONS as readonly unknown[]).includes(v.count) ? v.count as QuizCount : DEFAULT_PREFS.count;
    const order: QuizOrder = v.order === 'random' ? 'random' : 'number';
    const only: QuizOnly = v.only === 'all' ? 'all' : 'unlearned';
    const ranges: Record<string, [number, number]> = {};
    if (v.ranges && typeof v.ranges === 'object') for (const [k, r] of Object.entries(v.ranges)) {
      if (Array.isArray(r) && r.length === 2 && r.every(n => Number.isInteger(n) && n > 0)) ranges[k] = [r[0], r[1]];
    }
    return { count, order, only, ranges };
  } catch { return { ...DEFAULT_PREFS, ranges: {} }; }
}
export function writeQuizPrefs(uid: string, p: QuizPrefs): void {
  try { safeLocalStorage()?.setItem(PREF_KEY(uid), JSON.stringify(p)); } catch { /* 保存できなくても今回は使える */ }
}
export const rangeKey = (level: string, from: number, to: number) => `${level}:${from}-${to}`;

// ---------------- 記録（間違えた語・ブロックごとの最高点） ----------------
/**
 * missed … 復習待ち（間違えた語）／best … 範囲ごとの最高点
 * mastered … 4択で正解した語（✓）。間違えると外れる。2026-10-17 に追加（古い記録には無いので空として読む）
 */
export interface VocabQuizRecord { version: 1; missed: string[]; best: Record<string, number>; mastered?: string[] }
const key = (uid: string) => 'vocab_quiz_v1_' + encodeURIComponent(uid || 'guest');
export const blockKey = (level: string, block: number) => `${level}:${block}`;

export function readQuizRecord(uid: string): VocabQuizRecord {
  try {
    const v = JSON.parse(safeLocalStorage()?.getItem(key(uid)) || 'null');
    if (v && v.version === 1 && Array.isArray(v.missed) && v.best && typeof v.best === 'object') {
      const str = (a: unknown) => (Array.isArray(a) ? a.filter((x: unknown): x is string => typeof x === 'string') : []);
      return { version: 1, missed: str(v.missed), best: v.best, mastered: str(v.mastered) };
    }
  } catch { /* 壊れていたら空から */ }
  return { version: 1, missed: [], best: {}, mastered: [] };
}

/** 1セット終わったときの記録。正解した語は復習から外し、間違えた語は入れる */
export function applyQuizResult(rec: VocabQuizRecord, results: readonly { wordId: string; correct: boolean }[], block: string): VocabQuizRecord {
  const missed = new Set(rec.missed);
  const mastered = new Set(rec.mastered ?? []);
  for (const r of results) {
    if (r.correct) { missed.delete(r.wordId); mastered.add(r.wordId); } else { missed.add(r.wordId); mastered.delete(r.wordId); }
  }
  const score = results.filter(r => r.correct).length;
  return { version: 1, missed: [...missed], best: { ...rec.best, [block]: Math.max(rec.best[block] ?? 0, score) }, mastered: [...mastered] };
}
export function writeQuizRecord(uid: string, rec: VocabQuizRecord): void {
  try { safeLocalStorage()?.setItem(key(uid), JSON.stringify(rec)); } catch { /* 保存できなくても演習は続ける */ }
}

/** 結果のひとこと（ゼロでも次の一手を） */
export function quizComment(score: number, size = QUIZ_SIZE): string {
  if (score === size) return '全問正解！ 続きへ進もう';
  if (score >= size * 0.8) return 'あと少しで満点。間違えた語だけもう一度';
  if (score >= size * 0.5) return '半分以上できた。単語帳で見直してから再挑戦';
  return 'まずは単語帳でこの範囲を眺めてから。必ず伸びるよ';
}
