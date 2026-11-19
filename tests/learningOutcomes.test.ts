import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  aggregateClassOutcomes,
  aggregateGlobalUsageSessions,
  buildOutcomesCsv,
  classifyOutcomeFormat,
  computeUnseenTrajectoriesFromSummary,
  computeWeeklyVolume,
  evaluateRetentionForDays,
  fromSyncedOutcomesSummary,
  loadOutcomesStore,
  mergeOutcomesStores,
  recordBattleFinished,
  recordBattleFollowup,
  recordOutcomeAttempts,
  toSyncedOutcomesSummary,
} from '../src/utils/learningOutcomes';

class MemoryStorage implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
}

const g = globalThis as { localStorage?: Storage };
let prevStorage: Storage | undefined;
const DAY_MS = 86_400_000;

describe('学習成果・定着指標（learningOutcomes）', () => {
  beforeEach(() => {
    prevStorage = g.localStorage;
    g.localStorage = new MemoryStorage();
  });

  afterEach(() => {
    g.localStorage = prevStorage;
  });

  it('章ID・教科から問題形式を正しく分類する', () => {
    expect(classifyOutcomeFormat('el1_A')).toBe('listening_short');
    expect(classifyOutcomeFormat('el2')).toBe('listening_short');
    expect(classifyOutcomeFormat('el4_B')).toBe('listening_long');
    expect(classifyOutcomeFormat('eg6_3')).toBe('grammar');
    expect(classifyOutcomeFormat('vocab_quiz')).toBe('vocab_quiz');
    expect(classifyOutcomeFormat('reading_comp')).toBe('reading_comp');
    expect(classifyOutcomeFormat('tpl_1')).toBe('toeic_listening');
    expect(classifyOutcomeFormat('tp5_1')).toBe('toeic_p5');
    expect(classifyOutcomeFormat('tp7_1')).toBe('toeic_reading');
  });

  it('未見問題のみ正答率推移に記録し、2回目や既見問題は週の解答数だけに加算する', () => {
    const t0 = new Date('2026-11-10T10:00:00').getTime();

    // 初回10問（正解4問 = 40%）
    recordOutcomeAttempts(
      'u_test',
      Array.from({ length: 10 }, (_, i) => ({
        itemKey: `eg6_1::q1::${i + 1}`,
        format: 'grammar' as const,
        correct: i < 4,
      })),
      t0,
    );

    // 同じ10問の解き直し（全問正解しても未見正答率は水増しされない）
    recordOutcomeAttempts(
      'u_test',
      Array.from({ length: 10 }, (_, i) => ({
        itemKey: `eg6_1::q1::${i + 1}`,
        format: 'grammar' as const,
        correct: true,
      })),
      t0 + 3600_000,
    );

    // 新しい未見10問（正解8問 = 80%）
    const t1 = new Date('2026-11-12T10:00:00').getTime();
    recordOutcomeAttempts(
      'u_test',
      Array.from({ length: 10 }, (_, i) => ({
        itemKey: `eg6_2::q1::${i + 1}`,
        format: 'grammar' as const,
        correct: i < 8,
      })),
      t1,
    );

    const store = loadOutcomesStore('u_test');
    const summary = toSyncedOutcomesSummary(store);
    const vol = computeWeeklyVolume(summary.daily, t1);
    expect(vol.last7Days).toBe(30); // 解き直しを含む総解答数

    const rows = computeUnseenTrajectoriesFromSummary(summary);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.totalUnseen).toBe(20); // 未見は20問のみ
    expect(rows[0]!.initialRatePct).toBe(40); // 初回10問 = 40%
    expect(rows[0]!.recentRatePct).toBe(60); // 直近20問 = (4+8)/20 = 60%
    expect(rows[0]!.deltaPt).toBe(20); // +20pt
    expect(rows[0]!.binRatesPct).toEqual([40, 80]); // 第1ビン40% → 第2ビン80%
  });

  it('対戦完了と復習・演習への遷移を試合単位で集計し二重計上しない', () => {
    const now = new Date('2026-11-14T12:00:00').getTime();
    recordBattleFinished('u_test', 'match_1', now);
    recordBattleFollowup('u_test', 'review', undefined, now + 5000);
    recordBattleFollowup('u_test', 'practice', 'match_1', now + 9000);

    recordBattleFinished('u_test', 'match_2', now + 20_000);
    // match_2 は転換なし

    const summary = fromSyncedOutcomesSummary(toSyncedOutcomesSummary(loadOutcomesStore('u_test')))!;
    expect(summary.battles).toEqual({
      total: 2,
      toReview: 1,
      toPractice: 1,
      converted: 1, // match_1 で両方押しても試合転換数は 1/2 = 50%
    });
  });

  it('D7 / D30 コホート継続率とクラス集計・CSV出力が正しく機能する', () => {
    const now = new Date('2026-11-14T12:00:00').getTime();
    const d0 = '2026-10-10'; // 35日前（D7・D30ともに対象）
    const d8 = '2026-10-18'; // +8日後 → D7継続
    const d32 = '2026-11-11'; // +32日後 → D30継続

    const s1 = evaluateRetentionForDays([d0, d8, d32], null, now);
    expect(s1).toMatchObject({ d7Eligible: true, d7Retained: true, d30Eligible: true, d30Retained: true });

    // 3日前に始めた生徒は D7・D30 ともに対象外（期間未達）
    const recentStart = new Date(now - 3 * DAY_MS).toISOString().slice(0, 10);
    const s2 = evaluateRetentionForDays([recentStart], null, now);
    expect(s2).toMatchObject({ d7Eligible: false, d7Retained: false, d30Eligible: false, d30Retained: false });

    const agg = aggregateClassOutcomes(
      [
        {
          uid: 's1',
          displayName: '山田 太郎',
          studyDays: [d0, d8, d32],
          outcomes: {
            v: 1,
            firstDay: d0,
            daily: { '2026-11-13': 25, '2026-11-14': 15 },
            battles: { total: 4, toReview: 2, toPractice: 1, converted: 3 },
            formats: {
              listening_short: { total: 20, correct: 14, firstN: 10, firstC: 5, recentN: 10, recentC: 9, bins: [[10, 5], [10, 9]] },
            },
          },
        },
        {
          uid: 's2',
          displayName: '=危険な名前',
          studyDays: [recentStart],
          outcomes: null,
        },
      ],
      now,
    );

    expect(agg.d7).toEqual({ eligible: 1, retained: 1, ratePct: 100 });
    expect(agg.d30).toEqual({ eligible: 1, retained: 1, ratePct: 100 });
    expect(agg.weeklyAnswersPerMember).toBe(20); // (40 + 0) / 2
    expect(agg.battleConversion.ratePct).toBe(75); // 3 / 4

    const csv = buildOutcomesCsv(agg.students);
    expect(csv.startsWith('\uFEFF生徒名,初回学習日,7日後継続,30日後継続')).toBe(true);
    // escapeCsvCell により先頭の + / = / - は Excel 数式インジェクション防止のため ' が付く
    expect(csv).toContain("山田 太郎,2026-10-10,継続,継続,40,0,4,3,75%,20,50%,90%,'+40");
    expect(csv).toContain("'=危険な名前");
  });

  it('3-way マージと usage_sessions 全体集計がデータを失わない', () => {
    const base = {
      version: 1 as const,
      firstStudyDay: '2026-11-01',
      dailyAnswers: { '2026-11-14': 10 },
      formats: {},
      seen: { k1: 1 as const },
      battles: { b1: { at: 100, conv: 0 as const } },
    };
    const local = {
      ...base,
      dailyAnswers: { '2026-11-14': 15 }, // +5
      battles: { b1: { at: 100, conv: 1 as const } }, // review
    };
    const remote = {
      ...base,
      dailyAnswers: { '2026-11-14': 18 }, // +8
      battles: { b1: { at: 100, conv: 2 as const } }, // practice
    };
    const merged = mergeOutcomesStores(local, remote, base);
    expect(merged.dailyAnswers['2026-11-14']).toBe(23); // 10 + 5 + 8
    expect(merged.battles.b1?.conv).toBe(3); // review | practice

    const now = new Date('2026-11-14T12:00:00').getTime();
    const global = aggregateGlobalUsageSessions(
      [
        { day: '2026-11-01', install: 'inst_a', events: { 'outcome_ans:n12': 1 } },
        { day: '2026-11-09', install: 'inst_a', events: { 'outcome_ans:n20': 1, outcome_battle_done: 2, outcome_battle_conv: 1 } },
        { day: '2026-11-14', install: 'inst_b', events: { 'outcome_ans:n10': 2, 'outcome_unseen:n10': 1, 'outcome_unseen:ok7': 1 } },
      ],
      now,
    );
    expect(global.d7).toEqual({ eligible: 1, retained: 1, ratePct: 100 });
    expect(global.totalAnswers7d).toBe(40); // inst_a(20) + inst_b(10*2)
    expect(global.battleConversionPct).toBe(50);
    expect(global.unseenAccuracyPct).toBe(70);
  });

  it('単元・回の一覧から「満点 0/3」を廃止し、何問中何問進捗したかを表示する', () => {
    const unitCard = readFileSync('src/components/UnitCard.tsx', 'utf8');
    const chapterSel = readFileSync('src/components/ChapterSelection.tsx', 'utf8');
    const readingQuiz = readFileSync('src/components/ReadingQuiz.tsx', 'utf8');

    expect(unitCard).not.toContain('満点 ${');
    expect(unitCard).toContain('`${solvedCount}/${questionCount}問 完了`');
    expect(chapterSel).not.toContain('満点 {roundStage');
    expect(chapterSel).toContain('進捗 ${rounds.filter');
    expect(readingQuiz).toContain('進捗 <b>{progressed}</b>/{list.length}題');
  });
});
