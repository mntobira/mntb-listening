import type { SubQuestion } from '../../types/curriculum';

export type ToeicTimePresetId = 'standard' | 'slow' | 'advanced';
export type ToeicTimeKind = '品詞' | '文法' | '語彙';

/** 標準値は仕様に基づく（1問あたり）。表示名はスコアを保証せず想定目安であることを明記する。 */
export const TOEIC_TIME_PRESETS: Record<ToeicTimePresetId, {
  label: string;
  seconds: Record<ToeicTimeKind, number>;
}> = {
  standard: {
    label: '標準（800点前後を想定した目安）',
    seconds: { 品詞: 8, 文法: 12, 語彙: 30 },
  },
  // 仮の値：利用状況を見て調整するための初期案。標準目標や得点を保証するものではありません。
  slow: { label: 'ゆっくり（仮の目安）', seconds: { 品詞: 12, 文法: 16, 語彙: 40 } },
  // 仮の値：利用状況を見て調整するための初期案。標準目標や得点を保証するものではありません。
  advanced: { label: '上級（仮の目安）', seconds: { 品詞: 6, 文法: 9, 語彙: 22 } },
};

/** 品詞と既存の語彙分類（句動詞・コロケーションを含む）以外は文法枠で計算。空・欠落も文法。 */
export function classifyToeicSkill(label: string | null | undefined): ToeicTimeKind {
  if (label === '品詞') return '品詞';
  if (label === '語彙' || label === '句動詞・コロケーション') return '語彙';
  return '文法';
}

export interface ToeicPageBudget {
  targetSec: number;
  /** ページ終了時点の残り時間：10分から目標累積を引く */
  targetRemainingSec: number;
  /** ページ終了時点の残り時間：均等配分した限界ライン */
  limitRemainingSec: number;
  targetElapsedSec: number;
  limitElapsedSec: number;
  counts: Record<ToeicTimeKind, number>;
}

export function buildToeicPageBudgets(
  pages: readonly (readonly Pick<SubQuestion, 'skill'>[])[],
  preset: ToeicTimePresetId = 'standard',
  totalLimitSec = 600,
): ToeicPageBudget[] {
  const safeTotal = Math.max(0, Number.isFinite(totalLimitSec) ? totalLimitSec : 600);
  const pageLimit = pages.length > 0 ? safeTotal / pages.length : 0;
  let targetElapsedSec = 0;
  return pages.map((page, index) => {
    const counts: Record<ToeicTimeKind, number> = { 品詞: 0, 文法: 0, 語彙: 0 };
    for (const item of page) counts[classifyToeicSkill(item.skill)] += 1;
    const perQuestion = TOEIC_TIME_PRESETS[preset]?.seconds ?? TOEIC_TIME_PRESETS.standard.seconds;
    const targetSec = (Object.keys(counts) as ToeicTimeKind[]).reduce((sum, kind) => sum + counts[kind] * perQuestion[kind], 0);
    targetElapsedSec += targetSec;
    const limitElapsedSec = pageLimit * (index + 1);
    return {
      targetSec,
      targetRemainingSec: safeTotal - targetElapsedSec,
      limitRemainingSec: safeTotal - limitElapsedSec,
      targetElapsedSec,
      limitElapsedSec,
      counts,
    };
  });
}

export function formatToeicBudgetTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

export function formatToeicBudgetDelta(seconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(safe / 60) > 0 ? `${Math.floor(safe / 60)}分` : ''}${safe % 60}秒`;
}
