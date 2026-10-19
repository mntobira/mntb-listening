import { describe, it, expect } from 'vitest';
import { activeStudySeconds, STUDY_IDLE_MS } from '../src/utils/studyTime';
import { daysUntil, getDaysUntilExam, getDaysUntilSecondExam } from '../src/utils/examCountdown';

describe('学習時間：1分操作がなければ数えない（2026-10-11）', () => {
  const t0 = 1_000_000;
  it('操作が続いていれば、その区間をそのまま数える', () => {
    expect(activeStudySeconds(t0, t0 + 15000, t0 + 14000)).toBe(15);
  });
  it('最後の操作から1分を超えた分は切り捨てる', () => {
    // 最後の操作が t0、区間は t0+50s〜t0+65s → 数えるのは t0+60s まで（10秒）
    expect(activeStudySeconds(t0 + 50000, t0 + 65000, t0)).toBe(10);
  });
  it('1分以上放置した区間はゼロ', () => {
    expect(activeStudySeconds(t0 + STUDY_IDLE_MS + 1000, t0 + STUDY_IDLE_MS + 16000, t0)).toBe(0);
  });
});

describe('本番までの日数', () => {
  it('共通テスト・2次(前期)', () => {
    const from = new Date(2026, 9, 11);
    expect(getDaysUntilExam(from)).toBe(97);
    expect(getDaysUntilSecondExam(from)).toBe(137);
    expect(daysUntil(new Date(2026, 0, 1), from)).toBe(0);
  });
});

describe('学習時間の計測フック（App.tsx から hooks/useStudyTimeTracker.ts へ移した）', () => {
  it('日付キーは utils/studySummary の toDateKey と同じ YYYY-MM-DD（従来の手書きの書式と一致）', async () => {
    const { toDateKey } = await import('../src/utils/studySummary');
    const d = new Date(2026, 0, 5, 23, 59);
    const legacy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(toDateKey(d.getTime())).toBe(legacy);
  });
  it('15秒ごとに足す（間隔は定数で1か所）', async () => {
    const { STUDY_TICK_MS } = await import('../src/hooks/useStudyTimeTracker');
    expect(STUDY_TICK_MS).toBe(15_000);
  });
});
