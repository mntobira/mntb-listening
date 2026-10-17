/**
 * 英単語の4択演習（2026-10-01 D／2026-10-17 番号順のステージ制に）
 *
 * 単語帳（覚える）とは別に、英文法・リスニングと同じ「4択の問題」として解く。
 *   レベル → 100語のまとまり → 10語ずつのステージ（No.1〜10, 11〜20, …）→ その10語を全部出す
 *
 * ★抜けなく覚える（2026-10-17 ご要望）★
 *   以前は 100語の中からランダムに10問だったので、何回やっても出ない語が残った。
 *   市販の単語アプリと同じ構造にする：
 *     - 語にはレベルごとに 1 からの番号（No.）を振る（データの並び＝頻度順のまま）
 *     - 10語ずつのステージを番号順に進める。ステージでは10語を必ず全部出す（順番だけ入れ替える）
 *     - 正解した語は「覚えた（✓）」。間違えたら ✓ を外して「単語の復習」へ
 *     - 10語すべて ✓ でステージクリア。100語すべて ✓ でまとまりクリア
 *     - 仕上げに「100語からランダム10問」（✓ がまだの語を優先）
 *
 * 問題文・選択肢はデータ（listeningVocabulary.json の questions）をそのまま使う。ここでは選ぶ・並べるだけ。
 */
import type { ListeningWord, WordQuestion } from './listeningSupport';
import { safeLocalStorage } from '../utils/safeLocalStorage';

export const QUIZ_SIZE = 10;
export const BLOCK_SIZE = 100;
/** 1ステージの語数（100語＝10ステージ） */
export const STAGE_SIZE = 10;
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

/** 100語のまとまりの中の、10語ずつのステージ */
export interface VocabStage { index: number; from: number; to: number; ids: string[]; learned: number; cleared: boolean }
export function blockStages(blockList: readonly ListeningWord[], block: number, mastered: ReadonlySet<string>, size = STAGE_SIZE): VocabStage[] {
  const out: VocabStage[] = [];
  for (let i = 0; i < blockList.length; i += size) {
    const ids = blockList.slice(i, i + size).map(w => w.id);
    const learned = ids.reduce((n, id) => n + (mastered.has(id) ? 1 : 0), 0);
    const from = block * BLOCK_SIZE + i + 1;
    out.push({ index: out.length, from, to: from + ids.length - 1, ids, learned, cleared: learned === ids.length });
  }
  return out;
}
/** 「続きから」：まだクリアしていない最初のステージ。全部クリアなら -1 */
export function nextStage(stages: readonly VocabStage[]): number {
  return stages.findIndex(s => !s.cleared);
}
/**
 * ステージの出題：その10語を必ず全部出す（順番だけ入れ替える）。
 * 向きを指定してその向きの問題が無い語は、もう一方の向きで出す（＝語を飛ばさない）。
 */
export function buildStageQuiz(stageList: readonly ListeningWord[], opts: { dir?: QuizDirection; seed?: number; numbers?: ReadonlyMap<string, number> } = {}): QuizItem[] {
  const items = buildQuiz(stageList, { dir: opts.dir, size: stageList.length, seed: opts.seed });
  const got = new Set(items.map(x => x.wordId));
  const lacking = stageList.filter(w => !got.has(w.id));
  const extra = lacking.length ? buildQuiz(lacking, { dir: 'mix', size: lacking.length, seed: (opts.seed ?? 1) + 1 }) : [];
  const all = [...items, ...extra];
  const r = rng((opts.seed ?? Date.now()) ^ 0x5bd1e995);
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  return opts.numbers ? all.map(x => ({ ...x, no: opts.numbers!.get(x.wordId) })) : all;
}
export const stageKey = (level: string, block: number, stage: number) => `${level}:${block}:s${stage}`;

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
  if (score === size) return '全問正解！ 次の100語へ進もう';
  if (score >= size * 0.8) return 'あと少しで満点。間違えた語だけもう一度';
  if (score >= size * 0.5) return '半分以上できた。単語帳で見直してから再挑戦';
  return 'まずは単語帳でこの100語を眺めてから。必ず伸びるよ';
}
