/**
 * ===================================================================
 * 学習サマリーの算出（先生ダッシュボード／観点別評価の材料）
 * ===================================================================
 *
 * -------------------------------------------------------------------
 * ■ なぜこれを作るのか
 * -------------------------------------------------------------------
 * 高校では新学習指導要領のもとで「観点別評価」が求められ、なかでも
 *
 *     「主体的に学習に取り組む態度」
 *
 * の評価材料が現場で最も不足している。知識・技能はテストの点で測れるが、
 * 「粘り強く取り組んだか」「自分の学習を調整したか」は
 * 客観的な証跡がないと評価しづらく、提出物や挙手で代替されがちである。
 *
 * このアプリは既に
 *   - 間違えた問題を忘却曲線（0/1/3/7/14/30/60日）で再出題し
 *   - 何回間違え、何回正解し直したかを ReviewItem に記録している
 *
 * つまり「間違えた後にどう行動したか」という、態度評価にとって
 * 理想的なデータを既に持っている。ここではそれを
 * **先生がそのまま評価に使える指標**へ変換する。
 *
 * -------------------------------------------------------------------
 * ■ 設計上の重要な注意（教育的な誠実さ）
 * -------------------------------------------------------------------
 * この数値は「先生の判断を助ける材料」であり、**成績そのものではない**。
 * したがって、
 *   - 断定的な評定（A/B/C）を機械的に出すことはしない
 *   - 「取り組み度」は 0〜100 の目安値とし、内訳を必ず併記する
 *   - 内訳を見れば先生が自分で判断を覆せるようにする
 * という方針を取る。数字だけが独り歩きして生徒が不当に評価されるのは
 * 避けなければならない。
 */

import type { ReviewItem } from './reviewList';
import type { SolvedMap } from './studySyncCore';
import { collectStudyDays, countActiveDaysWithin } from './studyPeriods';
import type { ReviewDiscipline, EngagementScore, StudentSummary } from './studySummaryTypes';
export type { ReviewDiscipline, EngagementScore, StudentSummary } from './studySummaryTypes';
export { escapeCsvCell, buildCsvText, STUDENT_CSV_HEADERS, buildStudentCsv, CHAPTER_CSV_HEADERS } from './studySummaryCsv';
export { startOfDay, toDateKey, collectStudyDays, countActiveDaysWithin } from './studyPeriods';

export function summarizeReviewDiscipline(
  items: ReviewItem[] | null | undefined,
  masteredBox: number,
  now: number = Date.now(),
): ReviewDiscipline {
  const list = Array.isArray(items) ? items : [];
  let overdue = 0;
  let mastered = 0;
  let retryCount = 0;
  let wrongCount = 0;

  list.forEach((item) => {
    const due = Number(item?.dueAt);
    if (Number.isFinite(due) && due <= now) overdue += 1;
    if (Number(item?.box) >= masteredBox) mastered += 1;
    retryCount += Number.isFinite(Number(item?.correctCount)) ? Number(item.correctCount) : 0;
    wrongCount += Number.isFinite(Number(item?.wrongCount)) ? Number(item.wrongCount) : 0;
  });

  return {
    total: list.length,
    overdue,
    mastered,
    retryCount,
    wrongCount,
    recoveryRate: wrongCount > 0 ? retryCount / wrongCount : 0,
  };
}

// ===================================================================
// 単元別の到達状況
// ===================================================================

export interface ChapterProgressRow {
  chapterId: string;
  chapterTitle: string;
  /** その章の大問総数 */
  totalProblems: number;
  /** 解いた大問数 */
  solvedProblems: number;
  /** 到達率 0〜100（整数） */
  ratePercent: number;
  /** その章で復習待ちになっている数（つまずきの所在） */
  pendingReviews: number;
}

export interface ChapterDefinition {
  id: string;
  title: string;
  totalProblems: number;
}

/**
 * 章ごとの到達状況を出す。
 * 先生が最初に見るのは「クラスのどこが弱いか」なので、
 * 個人でも同じ形の行を作れるようにしておく。
 */
export function buildChapterProgressRows(
  chapters: ChapterDefinition[],
  solved: SolvedMap | null | undefined,
  reviewItems: ReviewItem[] | null | undefined = [],
  now: number = Date.now(),
): ChapterProgressRow[] {
  const solvedByChapter = new Map<string, number>();
  if (solved && typeof solved === 'object') {
    Object.keys(solved).forEach((key) => {
      const chapterId = key.split('::')[0];
      if (!chapterId) return;
      solvedByChapter.set(chapterId, (solvedByChapter.get(chapterId) || 0) + 1);
    });
  }

  const pendingByChapter = new Map<string, number>();
  if (Array.isArray(reviewItems)) {
    reviewItems.forEach((item) => {
      const due = Number(item?.dueAt);
      if (!item?.chapterId) return;
      if (Number.isFinite(due) && due <= now) {
        pendingByChapter.set(item.chapterId, (pendingByChapter.get(item.chapterId) || 0) + 1);
      }
    });
  }

  return chapters.map((chapter) => {
    // 解いた数が総数を超えないよう抑える（章の問題が減った場合の保険）
    const solvedCount = Math.min(solvedByChapter.get(chapter.id) || 0, chapter.totalProblems);
    return {
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      totalProblems: chapter.totalProblems,
      solvedProblems: solvedCount,
      ratePercent:
        chapter.totalProblems > 0 ? Math.round((solvedCount / chapter.totalProblems) * 100) : 0,
      pendingReviews: pendingByChapter.get(chapter.id) || 0,
    };
  });
}

// ===================================================================
// 取り組み度（先生が判断するための目安値）
// ===================================================================

export interface EngagementInput {
  /** 直近2週間で学習した日数 */
  activeDaysIn14: number;
  /** 立て直し率（0〜1超） */
  recoveryRate: number;
  /** 期限超過の復習数 */
  overdue: number;
  /** 復習リストの総数 */
  reviewTotal: number;
}

/**
 * 「主体的に学習に取り組む態度」の目安値。
 *
 * 配点の考え方：
 *   継続 50点 … 毎日でなくてよい。14日中7日（週3〜4回）で満点に近づく設計。
 *                 毎日を満点条件にすると部活等で不当に低く出るため。
 *   立て直し 35点 … 間違えた回数に対して解き直した割合。
 *                     「間違えた数」自体は減点しない（挑戦を罰しないため）。
 *   未処理 15点 … 期限超過の割合が低いほど高い。復習が0件なら満点扱い
 *                   （まだ間違えていない＝放置していない）。
 *
 * ⚠️ この値は評定ではない。必ず breakdown と併せて提示する。
 */
export function calcEngagementScore(input: EngagementInput): EngagementScore {
  const activeDays = Math.max(0, Number(input.activeDaysIn14) || 0);
  // 14日中7日で満点。それ以上やっている生徒も満点で頭打ち（過剰学習を煽らない）
  const continuity = Math.round(Math.min(1, activeDays / 7) * 50);

  const rate = Math.max(0, Number(input.recoveryRate) || 0);
  const recovery = Math.round(Math.min(1, rate) * 35);

  const total = Math.max(0, Number(input.reviewTotal) || 0);
  const overdue = Math.max(0, Number(input.overdue) || 0);
  const overdueRatio = total > 0 ? Math.min(1, overdue / total) : 0;
  const upkeep = Math.round((1 - overdueRatio) * 15);

  return {
    score: continuity + recovery + upkeep,
    breakdown: { continuity, recovery, upkeep },
  };
}

// ===================================================================
// 学習の基礎指標（サマリーと観点別レポートの共通の土台）
// ===================================================================

/**
 * ★重複していたので1つにまとめた計算★
 *
 * -------------------------------------------------------------------
 * ■ なぜまとめたのか
 * -------------------------------------------------------------------
 * 「学習した日を集める → 復習状況をまとめる → 直近14日の学習日数を数える
 *   → 最終学習日を取る → 取り組み度を出す」という5つの導出は、
 *
 *   - studySummary.ts の buildStudentSummary（先生ダッシュボード用）
 *   - kantenReport.ts  の buildAttitudeEvidence（観点別評価レポート用）
 *
 * の2か所に、まったく同じ順序・同じ引数で書かれていた。
 *
 * これは見た目が似ているだけの重複ではなく、**評価の数値そのものを出す計算**
 * なので放置すると危険度が高い。たとえば「継続は14日中7日で満点」という
 * 配点や、取り組み度に渡す4つの値のどれかを片方だけ直してしまうと、
 * 同じ生徒がダッシュボードとレポートで違う点数に見えてしまう。
 * 先生が「どちらが正しいのか」と迷う状態は評価材料として致命的なため、
 * 土台の計算はここ1か所だけに置く。
 *
 * -------------------------------------------------------------------
 * ■ まとめた範囲（意図的に狭くしている）
 * -------------------------------------------------------------------
 * 共通なのは「土台の5指標」だけである。その先は2つで違う：
 *   - buildStudentSummary   … uid・表示名・solvedTotal を足す
 *   - buildAttitudeEvidence … totalStudyDays・recoveredToMastery を足す
 * したがって呼び出し側の関数は**まとめない**。
 * 綺麗さのために外側まで1つにすると、片方の画面に不要な項目が
 * 混ざって責任が曖昧になるだけなので、共通部分だけを切り出す。
 *
 * ※ studyDays をそのまま返しているのは、呼び出し側が
 *    totalStudyDays（= studyDays.length）を必要とするためで、
 *    二重に集計し直さないようにするためである。
 */
export interface StudyBaseMetrics {
  /** 学習した日（YYYY-MM-DD の昇順） */
  studyDays: string[];
  /** 直近14日で学習した日数 */
  activeDaysIn14: number;
  /** 最終学習日（YYYY-MM-DD、記録が無ければ null） */
  lastStudiedAt: string | null;
  review: ReviewDiscipline;
  engagement: EngagementScore;
}

export function buildStudyBaseMetrics(
  solved: SolvedMap | null | undefined,
  reviewItems: ReviewItem[] | null | undefined,
  masteredBox: number,
  now: number = Date.now(),
): StudyBaseMetrics {
  const studyDays = collectStudyDays(solved, reviewItems);
  const review = summarizeReviewDiscipline(reviewItems, masteredBox, now);
  const activeDaysIn14 = countActiveDaysWithin(studyDays, 14, now);

  return {
    studyDays,
    activeDaysIn14,
    lastStudiedAt: studyDays.length > 0 ? studyDays[studyDays.length - 1] : null,
    review,
    engagement: calcEngagementScore({
      activeDaysIn14,
      recoveryRate: review.recoveryRate,
      overdue: review.overdue,
      reviewTotal: review.total,
    }),
  };
}

export function buildStudentSummary(params: {
  uid: string;
  displayName: string;
  solved: SolvedMap | null | undefined;
  reviewItems: ReviewItem[] | null | undefined;
  masteredBox: number;
  now?: number;
}): StudentSummary {
  const now = params.now ?? Date.now();
  // 土台の5指標は buildStudyBaseMetrics に1つだけ置いている
  // （観点別評価レポートと必ず同じ数値になるようにするため）。
  const base = buildStudyBaseMetrics(params.solved, params.reviewItems, params.masteredBox, now);

  return {
    uid: params.uid,
    displayName: params.displayName,
    solvedTotal: params.solved ? Object.keys(params.solved).length : 0,
    activeDaysIn14: base.activeDaysIn14,
    lastStudiedAt: base.lastStudiedAt,
    review: base.review,
    engagement: base.engagement,
  };
}

