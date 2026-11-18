/**
 * ===================================================================
 * 学習成果指標（Learning Outcomes）の集計・コホート算出・CSV出力
 * ===================================================================
 *
 * 個人（StudyRecord）・クラス（TeacherDashboard）・運営全体（usage_sessions）から
 * 共通ロジックで4指標を算出する純粋関数群。
 */

import { buildCsvText } from './studySummaryCsv';
import { startOfDay } from './studyPeriods';
import {
  OUTCOME_FORMAT_LABELS,
  OUTCOME_FORMAT_ORDER,
  type OutcomeFormatId,
  type SyncedOutcomesSummary,
} from './learningOutcomes';

const DAY_MS = 86_400_000;

export interface StudentRetentionStatus {
  firstDay: string | null;
  daysSinceStart: number;
  d7Eligible: boolean;
  d7Retained: boolean;
  d30Eligible: boolean;
  d30Retained: boolean;
}

function parseDayMs(dayKey: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return null;
  const ms = new Date(`${dayKey}T00:00:00`).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * 個人の D7 / D30 継続判定（既存 solved / reviewItems 由来の学習日集合も統合してバックフィル対応）
 *   D7 継続  = 初回学習日から 7〜13日後の間に1回以上学習した（対象：初回から7日以上経過）
 *   D30 継続 = 初回学習日から 30〜36日後の間に1回以上学習した（対象：初回から30日以上経過）
 */
export function evaluateRetentionForDays(
  studyDays: readonly string[],
  explicitFirstDay: string | null | undefined,
  now = Date.now(),
): StudentRetentionStatus {
  const all = new Set<string>();
  if (explicitFirstDay && /^\d{4}-\d{2}-\d{2}$/.test(explicitFirstDay)) all.add(explicitFirstDay);
  for (const d of studyDays) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) all.add(d);
  }
  const sorted = [...all].sort();
  if (sorted.length === 0) {
    return { firstDay: null, daysSinceStart: 0, d7Eligible: false, d7Retained: false, d30Eligible: false, d30Retained: false };
  }
  const firstDay = sorted[0]!;
  const firstMs = parseDayMs(firstDay);
  if (firstMs === null) {
    return { firstDay: null, daysSinceStart: 0, d7Eligible: false, d7Retained: false, d30Eligible: false, d30Retained: false };
  }
  const todayMs = startOfDay(now);
  const daysSinceStart = Math.max(0, Math.floor((todayMs - firstMs) / DAY_MS));
  const offsets = sorted
    .map((d) => parseDayMs(d))
    .filter((ms): ms is number => ms !== null)
    .map((ms) => Math.round((ms - firstMs) / DAY_MS));

  const d7Eligible = daysSinceStart >= 7;
  const d7Retained = d7Eligible && offsets.some((diff) => diff >= 7 && diff <= 13);
  const d30Eligible = daysSinceStart >= 30;
  const d30Retained = d30Eligible && offsets.some((diff) => diff >= 30 && diff <= 36);

  return { firstDay, daysSinceStart, d7Eligible, d7Retained, d30Eligible, d30Retained };
}

export interface WeeklyVolumeSeries {
  /** 直近7日間の解答数 */
  last7Days: number;
  /** 先週（8〜14日前）の解答数 */
  prev7Days: number;
  /** 直近4週間の週別解答数（古い順 [3週前, 2週前, 先週, 今週]） */
  fourWeeks: [number, number, number, number];
}

export function computeWeeklyVolume(
  daily: Record<string, number> | null | undefined,
  now = Date.now(),
): WeeklyVolumeSeries {
  const map = daily || {};
  const todayMs = startOfDay(now);
  const buckets: [number, number, number, number] = [0, 0, 0, 0];

  for (const [day, count] of Object.entries(map)) {
    const ms = parseDayMs(day);
    const n = Number(count);
    if (ms === null || !Number.isFinite(n) || n <= 0) continue;
    const diffDays = Math.round((todayMs - ms) / DAY_MS);
    if (diffDays >= 0 && diffDays < 7) buckets[3] += n;
    else if (diffDays >= 7 && diffDays < 14) buckets[2] += n;
    else if (diffDays >= 14 && diffDays < 21) buckets[1] += n;
    else if (diffDays >= 21 && diffDays < 28) buckets[0] += n;
  }

  return { last7Days: buckets[3], prev7Days: buckets[2], fourWeeks: buckets };
}

export interface UnseenTrajectoryRow {
  format: OutcomeFormatId;
  label: string;
  totalUnseen: number;
  overallRatePct: number;
  initialCount: number;
  initialRatePct: number;
  recentCount: number;
  recentRatePct: number;
  /** 直近正答率 − 初回正答率（ポイント差。未見11問以上かつ初回・直近5問以上のとき算出） */
  deltaPt: number | null;
  /** 10問ビンごとの正答率%（推移グラフ用） */
  binRatesPct: number[];
}

export function computeUnseenTrajectoriesFromSummary(
  summary: SyncedOutcomesSummary | null | undefined,
): UnseenTrajectoryRow[] {
  if (!summary?.formats) return [];
  const rows: UnseenTrajectoryRow[] = [];
  for (const fmt of OUTCOME_FORMAT_ORDER) {
    const tr = summary.formats[fmt];
    if (!tr || tr.total <= 0) continue;
    const overallRatePct = Math.round((tr.correct / tr.total) * 100);
    const initialRatePct = tr.firstN > 0 ? Math.round((tr.firstC / tr.firstN) * 100) : overallRatePct;
    const recentRatePct = tr.recentN > 0 ? Math.round((tr.recentC / tr.recentN) * 100) : overallRatePct;
    const deltaPt = tr.total >= 11 && tr.firstN >= 5 && tr.recentN >= 5
      ? recentRatePct - initialRatePct
      : null;
    const binRatesPct = tr.bins
      .filter(([n]) => n > 0)
      .map(([n, c]) => Math.round((c / n) * 100));
    rows.push({
      format: fmt,
      label: OUTCOME_FORMAT_LABELS[fmt],
      totalUnseen: tr.total,
      overallRatePct,
      initialCount: tr.firstN,
      initialRatePct,
      recentCount: tr.recentN,
      recentRatePct,
      deltaPt,
      binRatesPct,
    });
  }
  return rows;
}

export interface StudentOutcomeRow {
  uid: string;
  displayName: string;
  retention: StudentRetentionStatus;
  weeklyAnswers: number;
  prevWeeklyAnswers: number;
  fourWeeks: [number, number, number, number];
  battlesTotal: number;
  battlesConverted: number;
  battlesToReview: number;
  battlesToPractice: number;
  battleConversionPct: number | null;
  unseenTotal: number;
  unseenInitialPct: number | null;
  unseenRecentPct: number | null;
  unseenDeltaPt: number | null;
  trajectories: UnseenTrajectoryRow[];
}

export interface ClassOutcomesAggregate {
  memberCount: number;
  d7: { eligible: number; retained: number; ratePct: number | null };
  d30: { eligible: number; retained: number; ratePct: number | null };
  weeklyAnswersPerMember: number;
  weeklyAnswersPerActive: number;
  activeMembersIn7d: number;
  fourWeeksAvgPerMember: [number, number, number, number];
  battleConversion: {
    battles: number;
    converted: number;
    toReview: number;
    toPractice: number;
    ratePct: number | null;
  };
  formatTrajectories: UnseenTrajectoryRow[];
  students: StudentOutcomeRow[];
}

export interface StudentOutcomeInput {
  uid: string;
  displayName: string;
  /** solved + reviewItems から集めた学習日（YYYY-MM-DD） */
  studyDays: readonly string[];
  outcomes?: SyncedOutcomesSummary | null;
}

export function aggregateClassOutcomes(
  inputs: readonly StudentOutcomeInput[],
  now = Date.now(),
): ClassOutcomesAggregate {
  const students: StudentOutcomeRow[] = inputs.map((inp) => {
    const out = inp.outcomes ?? null;
    const mergedDays = [...new Set([...inp.studyDays, ...Object.keys(out?.daily ?? {})])].sort();
    const retention = evaluateRetentionForDays(mergedDays, out?.firstDay, now);
    const vol = computeWeeklyVolume(out?.daily, now);
    const bTotal = out?.battles.total ?? 0;
    const bConv = out?.battles.converted ?? 0;
    const bRev = out?.battles.toReview ?? 0;
    const bPrac = out?.battles.toPractice ?? 0;
    const trajectories = computeUnseenTrajectoriesFromSummary(out);

    let unseenTotal = 0;
    let firstN = 0;
    let firstC = 0;
    let recentN = 0;
    let recentC = 0;
    if (out?.formats) {
      for (const f of Object.values(out.formats)) {
        if (!f) continue;
        unseenTotal += f.total;
        firstN += f.firstN;
        firstC += f.firstC;
        recentN += f.recentN;
        recentC += f.recentC;
      }
    }
    const unseenInitialPct = firstN > 0 ? Math.round((firstC / firstN) * 100) : null;
    const unseenRecentPct = recentN > 0 ? Math.round((recentC / recentN) * 100) : null;
    const unseenDeltaPt =
      unseenTotal >= 11 && unseenInitialPct !== null && unseenRecentPct !== null
        ? unseenRecentPct - unseenInitialPct
        : null;

    return {
      uid: inp.uid,
      displayName: inp.displayName,
      retention,
      weeklyAnswers: vol.last7Days,
      prevWeeklyAnswers: vol.prev7Days,
      fourWeeks: vol.fourWeeks,
      battlesTotal: bTotal,
      battlesConverted: bConv,
      battlesToReview: bRev,
      battlesToPractice: bPrac,
      battleConversionPct: bTotal > 0 ? Math.round((bConv / bTotal) * 100) : null,
      unseenTotal,
      unseenInitialPct,
      unseenRecentPct,
      unseenDeltaPt,
      trajectories,
    };
  });

  const memberCount = students.length;
  const d7Eligible = students.filter((s) => s.retention.d7Eligible).length;
  const d7Retained = students.filter((s) => s.retention.d7Retained).length;
  const d30Eligible = students.filter((s) => s.retention.d30Eligible).length;
  const d30Retained = students.filter((s) => s.retention.d30Retained).length;

  const totalLast7 = students.reduce((acc, s) => acc + s.weeklyAnswers, 0);
  const activeMembersIn7d = students.filter((s) => s.weeklyAnswers > 0 || Boolean(s.retention.firstDay && s.retention.daysSinceStart < 7)).length;
  const activeAnswering = students.filter((s) => s.weeklyAnswers > 0).length;

  const sumWeeks: [number, number, number, number] = [0, 0, 0, 0];
  for (const s of students) {
    sumWeeks[0] += s.fourWeeks[0];
    sumWeeks[1] += s.fourWeeks[1];
    sumWeeks[2] += s.fourWeeks[2];
    sumWeeks[3] += s.fourWeeks[3];
  }
  const fourWeeksAvgPerMember: [number, number, number, number] = memberCount > 0
    ? [
        Math.round((sumWeeks[0] / memberCount) * 10) / 10,
        Math.round((sumWeeks[1] / memberCount) * 10) / 10,
        Math.round((sumWeeks[2] / memberCount) * 10) / 10,
        Math.round((sumWeeks[3] / memberCount) * 10) / 10,
      ]
    : [0, 0, 0, 0];

  const battles = students.reduce((acc, s) => acc + s.battlesTotal, 0);
  const converted = students.reduce((acc, s) => acc + s.battlesConverted, 0);
  const toReview = students.reduce((acc, s) => acc + s.battlesToReview, 0);
  const toPractice = students.reduce((acc, s) => acc + s.battlesToPractice, 0);

  const mergedFormats: SyncedOutcomesSummary['formats'] = {};
  for (const fmt of OUTCOME_FORMAT_ORDER) {
    let total = 0;
    let correct = 0;
    let firstN = 0;
    let firstC = 0;
    let recentN = 0;
    let recentC = 0;
    const binAcc: Array<[number, number]> = [];
    for (const inp of inputs) {
      const f = inp.outcomes?.formats?.[fmt];
      if (!f || f.total <= 0) continue;
      total += f.total;
      correct += f.correct;
      firstN += f.firstN;
      firstC += f.firstC;
      recentN += f.recentN;
      recentC += f.recentC;
      f.bins.forEach(([bn, bc], idx) => {
        if (!binAcc[idx]) binAcc[idx] = [0, 0];
        binAcc[idx]![0] += bn;
        binAcc[idx]![1] += bc;
      });
    }
    if (total > 0) {
      mergedFormats[fmt] = { total, correct, firstN, firstC, recentN, recentC, bins: binAcc };
    }
  }

  return {
    memberCount,
    d7: { eligible: d7Eligible, retained: d7Retained, ratePct: d7Eligible > 0 ? Math.round((d7Retained / d7Eligible) * 100) : null },
    d30: { eligible: d30Eligible, retained: d30Retained, ratePct: d30Eligible > 0 ? Math.round((d30Retained / d30Eligible) * 100) : null },
    weeklyAnswersPerMember: memberCount > 0 ? Math.round((totalLast7 / memberCount) * 10) / 10 : 0,
    weeklyAnswersPerActive: activeAnswering > 0 ? Math.round((totalLast7 / activeAnswering) * 10) / 10 : 0,
    activeMembersIn7d,
    fourWeeksAvgPerMember,
    battleConversion: {
      battles,
      converted,
      toReview,
      toPractice,
      ratePct: battles > 0 ? Math.round((converted / battles) * 100) : null,
    },
    formatTrajectories: computeUnseenTrajectoriesFromSummary({
      v: 1,
      firstDay: null,
      daily: {},
      battles: { total: 0, toReview: 0, toPractice: 0, converted: 0 },
      formats: mergedFormats,
    }),
    students: [...students].sort((a, b) => b.weeklyAnswers - a.weeklyAnswers || a.displayName.localeCompare(b.displayName, 'ja')),
  };
}

export const OUTCOMES_CSV_HEADERS = [
  '生徒名',
  '初回学習日',
  '7日後継続',
  '30日後継続',
  '今週の解答数(直近7日)',
  '先週の解答数',
  '対戦数',
  '対戦→復習・演習数',
  '対戦後転換率(%)',
  '未見問題の累計解答数',
  '未見初回正答率(%)',
  '未見直近正答率(%)',
  '未見正答率の伸び(pt)',
] as const;

function retentionCell(eligible: boolean, retained: boolean): string {
  if (!eligible) return '対象外(期間未達)';
  return retained ? '継続' : '離脱';
}

export function buildOutcomesCsv(rows: readonly StudentOutcomeRow[], withBom = true): string {
  return buildCsvText(
    OUTCOMES_CSV_HEADERS,
    rows.map((r) => [
      r.displayName,
      r.retention.firstDay ?? '未学習',
      retentionCell(r.retention.d7Eligible, r.retention.d7Retained),
      retentionCell(r.retention.d30Eligible, r.retention.d30Retained),
      r.weeklyAnswers,
      r.prevWeeklyAnswers,
      r.battlesTotal,
      r.battlesConverted,
      r.battleConversionPct !== null ? `${r.battleConversionPct}%` : '-',
      r.unseenTotal,
      r.unseenInitialPct !== null ? `${r.unseenInitialPct}%` : '-',
      r.unseenRecentPct !== null ? `${r.unseenRecentPct}%` : '-',
      r.unseenDeltaPt !== null ? (r.unseenDeltaPt > 0 ? `+${r.unseenDeltaPt}` : String(r.unseenDeltaPt)) : '-',
    ]),
    withBom,
  );
}

export interface UsageSessionRowLike {
  day: string;
  install: string;
  events?: Record<string, number>;
}

export interface GlobalSessionOutcomes {
  installCount: number;
  activeInstalls7d: number;
  d7: { eligible: number; retained: number; ratePct: number | null };
  d30: { eligible: number; retained: number; ratePct: number | null };
  weeklyAnswersPerActiveInstall: number;
  totalAnswers7d: number;
  battlesDone: number;
  battlesConverted: number;
  battleConversionPct: number | null;
  unseenCount: number;
  unseenAccuracyPct: number | null;
}

export function sumTrackedEventProp(events: Record<string, number> | undefined, eventName: string, propKey: string): number {
  if (!events) return 0;
  const prefix = `${eventName}:${propKey}`;
  let sum = 0;
  for (const [k, count] of Object.entries(events)) {
    if (!k.startsWith(prefix)) continue;
    const val = Number(k.slice(prefix.length));
    const times = Number(count);
    if (Number.isFinite(val) && Number.isFinite(times) && times > 0) sum += val * times;
  }
  return sum;
}

export function aggregateGlobalUsageSessions(
  sessions: readonly UsageSessionRowLike[],
  now = Date.now(),
): GlobalSessionOutcomes {
  const daysByInstall = new Map<string, Set<string>>();
  const todayMs = startOfDay(now);
  const activeInstalls7dSet = new Set<string>();

  let totalAnswers7d = 0;
  let battlesDone = 0;
  let battlesConverted = 0;
  let unseenCount = 0;
  let unseenOk = 0;

  for (const s of sessions) {
    if (!s || typeof s.install !== 'string' || !s.install || typeof s.day !== 'string') continue;
    const dayMs = parseDayMs(s.day);
    if (dayMs === null) continue;

    let set = daysByInstall.get(s.install);
    if (!set) {
      set = new Set<string>();
      daysByInstall.set(s.install, set);
    }
    set.add(s.day);

    const diffDays = Math.round((todayMs - dayMs) / DAY_MS);
    const ev = s.events || {};
    const ans = sumTrackedEventProp(ev, 'outcome_ans', 'n');
    if (diffDays >= 0 && diffDays < 7) {
      activeInstalls7dSet.add(s.install);
      totalAnswers7d += ans;
    }
    battlesDone += Math.max(0, Number(ev.outcome_battle_done) || 0);
    battlesConverted += Math.max(0, Number(ev.outcome_battle_conv) || 0);
    unseenCount += sumTrackedEventProp(ev, 'outcome_unseen', 'n');
    unseenOk += sumTrackedEventProp(ev, 'outcome_unseen', 'ok');
  }

  let d7Eligible = 0;
  let d7Retained = 0;
  let d30Eligible = 0;
  let d30Retained = 0;

  for (const daySet of daysByInstall.values()) {
    const status = evaluateRetentionForDays([...daySet], null, now);
    if (status.d7Eligible) d7Eligible += 1;
    if (status.d7Retained) d7Retained += 1;
    if (status.d30Eligible) d30Eligible += 1;
    if (status.d30Retained) d30Retained += 1;
  }

  const activeInstalls7d = activeInstalls7dSet.size;
  return {
    installCount: daysByInstall.size,
    activeInstalls7d,
    d7: { eligible: d7Eligible, retained: d7Retained, ratePct: d7Eligible > 0 ? Math.round((d7Retained / d7Eligible) * 100) : null },
    d30: { eligible: d30Eligible, retained: d30Retained, ratePct: d30Eligible > 0 ? Math.round((d30Retained / d30Eligible) * 100) : null },
    weeklyAnswersPerActiveInstall: activeInstalls7d > 0 ? Math.round((totalAnswers7d / activeInstalls7d) * 10) / 10 : 0,
    totalAnswers7d,
    battlesDone,
    battlesConverted,
    battleConversionPct: battlesDone > 0 ? Math.round((battlesConverted / battlesDone) * 100) : null,
    unseenCount,
    unseenAccuracyPct: unseenCount > 0 ? Math.round((unseenOk / unseenCount) * 100) : null,
  };
}
