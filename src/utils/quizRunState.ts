/**
 * ===================================================================
 * 章単位の「1回の演習」の途中経過（点数・コンボ・所要時間）の型と保存/復元
 * ===================================================================
 *
 * ■ なぜ Quiz.tsx から切り出したのか
 *   Quiz.tsx は 3,900 行あり、そのうち約 480 行が
 *   「画面の描き方とは関係のない下請け処理」だった。
 *   ここに置いてあるのは localStorage への読み書きだけで、
 *   React にも画面にも依存していない。
 *   分けておくと
 *     ・保存形式を直すときに Quiz.tsx を開かなくて済む
 *     ・localStorage の壊れたデータをどう扱うかを単体で試せる
 *   という利点がある。
 *
 * ■ 動きは1バイトも変えていない
 *   関数名・引数・戻り値・分岐の順序は Quiz.tsx にあったものと同一。
 *   保存キーは今までどおり utils/quizStorageKeys.ts の quizRunKey を使う。
 *   （キー名が1文字でも変わると、解きかけの記録がまるごと迷子になる）
 */
import type { ScoreBreakdown } from './scoring';
import { isPlainRecord } from './progress';
import { quizRunKey } from './quizStorageKeys';
import { requireLocalStorage, setItemOrThrow } from './safeLocalStorage';

/**
 * 章単位の累積スコアを localStorage に保持するためのキー生成。
 *
 * 実体は utils/quizStorageKeys.ts の quizRunKey（唯一の定義）。
 * Quiz.tsx が chapterRunKey という名前で呼んでいたので名前はそのまま残す。
 */
export const chapterRunKey = quizRunKey;

/** 1問分の採点結果（制限時間と実際にかかった時間を添えたもの） */
export type ScoredQuestion = ScoreBreakdown & { timeLimit: number; timeUsed: number };

export interface ChapterRunState {
  totalScore: number;
  runningCombo: number;
  perQuestion: Record<string, ScoredQuestion>;
  /**
   * 「1問ずつ」解くリスニング用の採点記録。キーは `大問ID::小問ID`。
   *
   * perQuestion と分けている理由：
   *   perQuestion のキーは「大問ID」である前提で、進捗の引き継ぎ
   *   （progress.ts の backfillLegacyProgress）がキーを大問IDとして数える。
   *   小問単位のキーを混ぜると存在しない大問を「解いた」と数えてしまうため、
   *   別のフィールドに置いて既存の集計を汚さないようにしている。
   *   古い保存データには無いフィールドなので任意項目にしている。
   */
  perStep?: Record<string, ScoredQuestion>;
  totalCorrect: number;
  totalJudgeable: number;
  totalTimeSec: number;
  startedAt: number;
}

export function emptyRun(): ChapterRunState {
  return {
    totalScore: 0,
    runningCombo: 0,
    perQuestion: {},
    perStep: {},
    totalCorrect: 0,
    totalJudgeable: 0,
    totalTimeSec: 0,
    startedAt: Date.now(),
  };
}

export function nonNegativeFinite(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function loadRun(chapterId: string, mode: string): ChapterRunState {
  try {
    const raw = requireLocalStorage().getItem(chapterRunKey(chapterId, mode));
    if (!raw) return emptyRun();

    const parsed: unknown = JSON.parse(raw);
    if (!isPlainRecord(parsed)) return emptyRun();

    return {
      totalScore: nonNegativeFinite(parsed.totalScore),
      runningCombo: nonNegativeFinite(parsed.runningCombo),
      perQuestion: isPlainRecord(parsed.perQuestion)
        ? parsed.perQuestion as ChapterRunState['perQuestion']
        : {},
      perStep: isPlainRecord(parsed.perStep)
        ? parsed.perStep as NonNullable<ChapterRunState['perStep']>
        : {},
      totalCorrect: nonNegativeFinite(parsed.totalCorrect),
      totalJudgeable: nonNegativeFinite(parsed.totalJudgeable),
      totalTimeSec: nonNegativeFinite(parsed.totalTimeSec),
      startedAt: nonNegativeFinite(parsed.startedAt, Date.now()),
    };
  } catch {
    return emptyRun();
  }
}

export function saveRun(chapterId: string, mode: string, run: ChapterRunState) {
  try {
    setItemOrThrow(chapterRunKey(chapterId, mode), JSON.stringify(run));
  } catch {
    /* noop */
  }
}

/** 章の記録を捨てる（結果送信後のリセット用） */
export function clearRun(chapterId: string, mode: string) {
  try {
    requireLocalStorage().removeItem(chapterRunKey(chapterId, mode));
  } catch {
    /* noop */
  }
}
