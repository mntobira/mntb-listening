import { describe, expect, it } from 'vitest';
import { barPercents, buildWeek, dayKey, normalizeBio, normalizeGrade, parseWeek, weekLabels, weekSummary, BIO_MAX, DAY_SECONDS_MAX } from '../src/utils/publicProfileCore';
import { parsePublicStudyProfile } from '../src/utils/publicStudyProfile';

const NOW = new Date(2026, 9, 26, 15, 0, 0).getTime(); // 月曜

describe('週の記録', () => {
  it('古い日→今日の7日分。無い日は0、上限で切る', () => {
    const days = { [dayKey(NOW)]: 600, [dayKey(NOW - 86_400_000)]: 99999, [dayKey(NOW - 10 * 86_400_000)]: 50 };
    const w = buildWeek(days, NOW);
    expect(w).toHaveLength(7);
    expect(w[6]).toBe(600);
    expect(w[5]).toBe(DAY_SECONDS_MAX);
    expect(w.slice(0, 5)).toEqual([0, 0, 0, 0, 0]);
    expect(weekLabels(NOW)[6]).toBe('月');
  });
  it('集計と棒の高さ（最長の日が100%、少しでもあれば最低6%）', () => {
    expect(weekSummary([0, 30, 60, 600, 0, 0, 1200])).toEqual({ total: 1890, activeDays: 3, max: 1200 });
    expect(barPercents([0, 10, 600, 1200, 0, 0, 0])).toEqual([0, 6, 50, 100, 0, 0, 0]);
    expect(barPercents([0, 0, 0, 0, 0, 0, 0])).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });
  it('読んだ値の形チェック', () => {
    expect(parseWeek([1, 2, 3, 4, 5, 6, 7])).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(parseWeek([1, 2, 3])).toBeNull();
    expect(parseWeek([1, 2, 3, 4, 5, 6, -1])).toBeNull();
    expect(parseWeek([1, 2, 3, 4, 5, 6, 0.5])).toBeNull();
  });
});

describe('学年・自己紹介', () => {
  it('学年は選択肢だけ', () => {
    expect(normalizeGrade('高校2年')).toBe('高校2年');
    expect(normalizeGrade('○○高校2年A組')).toBe('');
    expect(normalizeGrade(3)).toBe('');
  });
  it('自己紹介は整えて160文字まで', () => {
    expect(normalizeBio('  a\r\n\n\n\nb  ')).toBe('a\n\nb');
    expect(normalizeBio('あ'.repeat(300))).toHaveLength(BIO_MAX);
  });
});

describe('公開プロフィールの読み込み', () => {
  it('古い文書（新しい項目なし）も読める', () => {
    const p = parsePublicStudyProfile({ public: true, targetSchool: 'A大', studySeconds: 60 });
    expect(p?.week).toBeNull();
    expect(p?.grade).toBe('');
    expect(p?.look).toEqual({ pose: '', frame: '', hat: '', glasses: '' });
  });
  it('新しい項目を読み、形の悪い値は捨てる', () => {
    const p = parsePublicStudyProfile({
      public: true, targetSchool: 'A大', studySeconds: 60, nickname: 'たろう', grade: '高校3年', bio: 'よろしく',
      week: [0, 0, 0, 0, 0, 60, 120], weekEnd: '2026-10-26', streak: 5, solved: 40, badges: 3, title: 'b_first_win',
      lookPose: 'pose_x', lookFrame: 'bad id!', lookHat: '', lookGlasses: 'g1',
    });
    expect(p).toMatchObject({ nickname: 'たろう', grade: '高校3年', bio: 'よろしく', streak: 5, solved: 40, badges: 3, title: 'b_first_win', weekEnd: '2026-10-26' });
    expect(p?.look).toEqual({ pose: 'pose_x', frame: '', hat: '', glasses: 'g1' });
  });
  it('public: true でなければ読まない', () => {
    expect(parsePublicStudyProfile({ public: false, targetSchool: '', studySeconds: 0 })).toBeNull();
  });
});

import { calDays, encodeCal, parseCal, encodeSubjects, parseSubjects, encodeIds, parseIds, OWNED_IDS_MAX } from '../src/utils/publicProfileCore';
describe('D6：公開したらマイページ全体（2026-10-30）', () => {
  it('カレンダーは28日分。足りなければ前を0で埋め、上限で切る', () => {
    expect(calDays(new Date('2026-10-30T12:00:00').getTime())).toHaveLength(28);
    const enc = encodeCal([60, 999999]);
    expect(enc.split(',')).toHaveLength(28);
    expect(parseCal(enc)?.slice(-2)).toEqual([60, 86400]);
    expect(parseCal('1,2,3')).toBeNull();
    expect(parseCal('a'.repeat(5))).toBeNull();
  });
  it('教科は多い順・1分未満と形の違うキーは捨てる', () => {
    const enc = encodeSubjects({ math: 120, eng: 3600, 'BAD KEY': 999, jpn: 30 });
    expect(enc).toBe('eng:3600,math:120');
    expect(parseSubjects(enc)).toEqual([{ id: 'eng', sec: 3600 }, { id: 'math', sec: 120 }]);
    expect(parseSubjects('eng:1;drop')).toEqual([]);
  });
  it('IDは形の違うもの・重なりを捨て、上限の長さで止める', () => {
    expect(encodeIds(['pose_basic', 'pose_basic', 'bad id!', 'frame_x'], 100)).toBe('pose_basic,frame_x');
    expect(encodeIds(Array.from({ length: 2000 }, (_, i) => `item_${i}`), OWNED_IDS_MAX).length).toBeLessThanOrEqual(OWNED_IDS_MAX);
    expect(parseIds('a,b_c,<x>', 100)).toEqual([]);
    expect(parseIds('a,b_c', 100)).toEqual(['a', 'b_c']);
  });
  it('公開文書の新しい項目を読む・古い文書は空', () => {
    const p = parsePublicStudyProfile({ public: true, targetSchool: 'A大', studySeconds: 60, cal: encodeCal([0, 60]), calEnd: '2026-10-30', subj: 'eng:600', ownedIds: 'pose_basic,frame_default', badgeIds: 'b_first_win' });
    expect(p?.cal?.length).toBe(28);
    expect(p?.subjects).toEqual([{ id: 'eng', sec: 600 }]);
    expect(p?.owned).toEqual(['pose_basic', 'frame_default']);
    expect(p?.badgeIds).toEqual(['b_first_win']);
    const old = parsePublicStudyProfile({ public: true, targetSchool: 'A大', studySeconds: 60 });
    expect(old).toMatchObject({ cal: null, subjects: [], owned: [], badgeIds: [] });
  });
});

import { alignCal } from '../src/utils/publicProfileCore';
describe('E4：公開された28日を今日にそろえる（2026-10-30）', () => {
  const cal = Array.from({ length: 28 }, (_, i) => i + 1);
  const now = new Date(2026, 9, 30, 12).getTime();
  it('今日書かれていればそのまま', () => { expect(alignCal(cal, '2026-10-30', now)).toEqual(cal); });
  it('3日前に書かれていれば、前を3日捨てて後ろを0で埋める', () => {
    const a = alignCal(cal, '2026-10-27', now)!;
    expect(a).toHaveLength(28);
    expect(a.slice(0, 2)).toEqual([4, 5]);
    expect(a.slice(-4)).toEqual([28, 0, 0, 0]);
  });
  it('28日以上前なら全部0／形が違えば null', () => {
    expect(alignCal(cal, '2026-09-01', now)).toEqual(Array(28).fill(0));
    expect(alignCal(null, '2026-10-30', now)).toBeNull();
    expect(alignCal(cal, '', now)).toBeNull();
  });
});
