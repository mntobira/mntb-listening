/**
 * 英単語の4択演習（2026-10-01 D）
 *
 * 単語帳（覚える）とは別に、英文法・リスニングと同じ「4択の問題」として解く。
 *   レベル → 100語のまとまり → 10問（英→日／日→英をまぜる）
 *   間違えた語は「単語の復習」に入り、次のセットで先に出る。
 *
 * 問題文・選択肢はデータ（listeningVocabulary.json の questions）をそのまま使う。ここでは選ぶ・並べるだけ。
 */
import type { ListeningWord, WordQuestion } from './listeningSupport';
import { safeLocalStorage } from '../utils/safeLocalStorage';

export const QUIZ_SIZE = 10;
export const BLOCK_SIZE = 100;
export type QuizDirection = 'mix' | 'e2j' | 'j2e';

export interface QuizItem { wordId: string; word: string; q: WordQuestion; dir: 'e2j' | 'j2e' }

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
export function buildQuiz(words: readonly ListeningWord[], opts: { missed?: readonly string[]; dir?: QuizDirection; size?: number; seed?: number } = {}): QuizItem[] {
  const size = opts.size ?? QUIZ_SIZE;
  const r = rng(opts.seed ?? Date.now());
  const dir = opts.dir ?? 'mix';
  const pickQ = (w: ListeningWord): WordQuestion | undefined => {
    const qs = w.questions.filter(q => dir === 'mix' || dirOf(q) === dir);
    if (!qs.length) return undefined;
    return qs[Math.floor(r() * qs.length)];
  };
  const missed = new Set(opts.missed ?? []);
  const first = words.filter(w => missed.has(w.id));
  const rest = words.filter(w => !missed.has(w.id));
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  const out: QuizItem[] = [];
  for (const w of [...first, ...rest]) {
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

// ---------------- 記録（間違えた語・ブロックごとの最高点） ----------------
export interface VocabQuizRecord { version: 1; missed: string[]; best: Record<string, number> }
const key = (uid: string) => 'vocab_quiz_v1_' + encodeURIComponent(uid || 'guest');
export const blockKey = (level: string, block: number) => `${level}:${block}`;

export function readQuizRecord(uid: string): VocabQuizRecord {
  try {
    const v = JSON.parse(safeLocalStorage()?.getItem(key(uid)) || 'null');
    if (v && v.version === 1 && Array.isArray(v.missed) && v.best && typeof v.best === 'object') return { version: 1, missed: v.missed.filter((x: unknown) => typeof x === 'string'), best: v.best };
  } catch { /* 壊れていたら空から */ }
  return { version: 1, missed: [], best: {} };
}

/** 1セット終わったときの記録。正解した語は復習から外し、間違えた語は入れる */
export function applyQuizResult(rec: VocabQuizRecord, results: readonly { wordId: string; correct: boolean }[], block: string): VocabQuizRecord {
  const missed = new Set(rec.missed);
  for (const r of results) { if (r.correct) missed.delete(r.wordId); else missed.add(r.wordId); }
  const score = results.filter(r => r.correct).length;
  return { version: 1, missed: [...missed], best: { ...rec.best, [block]: Math.max(rec.best[block] ?? 0, score) } };
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
