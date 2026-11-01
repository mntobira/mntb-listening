/**
 * ===================================================================
 * 公開プロフィール（スタディプラス級）の純粋ロジック（2026-10-26）
 * ===================================================================
 *   public_study_profiles/{uid} に「本人が公開を選んだときだけ」載せる項目の
 *   形・上限・整形をここに集める。Firestore も画面も触らない。
 *
 * ■ 載せる項目（どれも任意・古い文書には無い）
 *   nickname  … 表示名（ニックネーム。24文字まで）
 *   grade     … 学年（決まった選択肢だけ。自由入力にしない＝個人を特定されにくくする）
 *   bio       … 自己紹介（160文字まで。URL・連絡先・使えない語は保存前にはじく）
 *   week      … 直近7日の学習時間（秒×7、古い日→今日）。学習の記録のグラフに使う
 *   streak    … 連続学習日数
 *   solved    … 解いた大問の数
 *   badges    … 持っている称号の数
 *   title     … 身につけている称号（称号ID）
 *   lookPose / lookFrame / lookHat / lookGlasses … とびら君の見た目（アイテムID）
 *
 * ■ 載せないもの
 *   実名・メール・学校名（在籍校）・誕生日・住んでいる場所・連絡先・答案の中身・成績
 */

export const BIO_MAX = 160;
export const WEEK_DAYS = 7;
/** 1日の上限（studyTime.ts の DAY_CAP と同じ 12時間） */
export const DAY_SECONDS_MAX = 12 * 3600;
export const COUNT_MAX = 1_000_000;
export const LOOK_ID_MAX = 40;

/** 学年の選択肢（空＝公開しない） */
export const GRADE_OPTIONS = ['', '中学生', '高校1年', '高校2年', '高校3年', '既卒', '大学生', '社会人', 'その他'] as const;
export type PublicGrade = (typeof GRADE_OPTIONS)[number];

export function normalizeGrade(v: unknown): PublicGrade {
  return typeof v === 'string' && (GRADE_OPTIONS as readonly string[]).includes(v) ? (v as PublicGrade) : '';
}

/** 自己紹介：改行は2つまで残し、前後の空白と長さを整える */
export function normalizeBio(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\u3000]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, BIO_MAX);
}

/** 'YYYY-MM-DD'（端末の時刻帯） */
export function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 直近7日（古い日→今日）の学習秒。studyTime の days から作る */
export function buildWeek(days: Record<string, number>, now: number = Date.now()): number[] {
  const out: number[] = [];
  for (let i = WEEK_DAYS - 1; i >= 0; i -= 1) {
    const key = dayKey(now - i * 86_400_000);
    const v = Math.floor(days[key] || 0);
    out.push(Math.max(0, Math.min(DAY_SECONDS_MAX, v)));
  }
  return out;
}

/** グラフの曜日ラベル（古い日→今日） */
export function weekLabels(now: number = Date.now()): string[] {
  const out: string[] = [];
  for (let i = WEEK_DAYS - 1; i >= 0; i -= 1) out.push('日月火水木金土'[new Date(now - i * 86_400_000).getDay()]);
  return out;
}

/** 読んだ値を7つの整数に直す（形が違えば null） */
export function parseWeek(v: unknown): number[] | null {
  if (!Array.isArray(v) || v.length !== WEEK_DAYS) return null;
  if (!v.every((x) => typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= DAY_SECONDS_MAX)) return null;
  return v as number[];
}

export function intOrNull(v: unknown, max = COUNT_MAX): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max ? v : null;
}

export function lookIdOrEmpty(v: unknown): string {
  return typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : '';
}

/** 週の合計と、学習した日の数 */
export function weekSummary(week: readonly number[]): { total: number; activeDays: number; max: number } {
  let total = 0;
  let activeDays = 0;
  let max = 0;
  week.forEach((s) => {
    total += s;
    if (s >= 60) activeDays += 1;
    if (s > max) max = s;
  });
  return { total, activeDays, max };
}

/** 秒 → グラフの棒の高さ（0〜100%）。いちばん長い日を 100% にする。0秒は 0 */
export function barPercents(week: readonly number[]): number[] {
  const { max } = weekSummary(week);
  if (max <= 0) return week.map(() => 0);
  return week.map((s) => (s <= 0 ? 0 : Math.max(6, Math.round((s / max) * 100))));
}

// ===================================================================
// D6（2026-10-30）：公開したら「その人のマイページ全体」を見せる
//   カレンダー（直近28日の日ごとの時間・教科ごとの合計）・きせかえ（持っているアイテム）・称号・マイPDF。
//   Firestore のルールで形を確かめやすいよう、どれも「決まった文字だけの文字列」にして載せる。
//   教材名・ひとことは自由入力なので載せない（教科だけ）。
// ===================================================================
export const CAL_DAYS = 28;
/** 1日の上限（アプリの計測12時間＋自分の記録12時間） */
export const CAL_DAY_MAX = 86_400;
export const SUBJECTS_MAX = 14;
export const OWNED_IDS_MAX = 8000;
export const BADGE_IDS_MAX = 3000;

/** 直近28日（古い日→今日）の日付 */
export function calDays(now: number = Date.now()): string[] {
  const out: string[] = [];
  for (let i = CAL_DAYS - 1; i >= 0; i -= 1) out.push(dayKey(now - i * 86_400_000));
  return out;
}
export function encodeCal(secs: readonly number[]): string {
  const list = secs.slice(-CAL_DAYS);
  while (list.length < CAL_DAYS) list.unshift(0);
  return list.map((s) => Math.max(0, Math.min(CAL_DAY_MAX, Math.floor(Number(s) || 0)))).join(',');
}
export function parseCal(v: unknown): number[] | null {
  if (typeof v !== 'string' || !/^[0-9]{1,5}(,[0-9]{1,5}){27}$/.test(v)) return null;
  const out = v.split(',').map(Number);
  return out.every((n) => n <= CAL_DAY_MAX) ? out : null;
}
/** 教科ごとの合計秒（多い順に14まで）'eng:3600,math:120' */
export function encodeSubjects(map: Record<string, number>): string {
  return Object.entries(map)
    .filter(([k, s]) => /^[a-z]{1,8}$/.test(k) && s >= 60)
    .sort((a, b) => b[1] - a[1])
    .slice(0, SUBJECTS_MAX)
    .map(([k, s]) => `${k}:${Math.min(9_999_999, Math.floor(s))}`)
    .join(',');
}
export function parseSubjects(v: unknown): { id: string; sec: number }[] {
  if (typeof v !== 'string' || !/^([a-z]{1,8}:[0-9]{1,7}(,[a-z]{1,8}:[0-9]{1,7}){0,13})?$/.test(v) || !v) return [];
  return v.split(',').map((p) => { const [id, sec] = p.split(':'); return { id, sec: Number(sec) }; });
}
/** アイテム・称号のID（英数字・_・-）をカンマでつなぐ。形の違うID・重なりは捨てる */
export function encodeIds(ids: readonly string[], max: number): string {
  const ok = [...new Set(ids)].filter((id) => /^[A-Za-z0-9_-]{1,40}$/.test(id));
  let out = '';
  for (const id of ok) { const next = out ? `${out},${id}` : id; if (next.length > max) break; out = next; }
  return out;
}
export function parseIds(v: unknown, max: number): string[] {
  if (typeof v !== 'string' || v.length > max || !/^[A-Za-z0-9_,-]*$/.test(v)) return [];
  return v.split(',').filter((id) => /^[A-Za-z0-9_-]{1,40}$/.test(id));
}

/**
 * ★2026-10-30 E4★ 公開された28日の記録（calEnd が最後の日）を「今日が最後」にそろえる。
 *   本人がしばらく開いていないと calEnd が古いので、そのぶん後ろを 0 で埋めて前を捨てる。
 *   28日以上前なら全部 0。時計のずれで calEnd が未来なら、そのまま使う。
 */
export function alignCal(cal: readonly number[] | null, calEnd: string, now: number = Date.now()): number[] | null {
  if (!cal || cal.length !== CAL_DAYS || !/^\d{4}-\d{2}-\d{2}$/.test(calEnd)) return null;
  const end = new Date(`${calEnd}T12:00:00`).getTime();
  const today = new Date(`${dayKey(now)}T12:00:00`).getTime();
  const lag = Math.round((today - end) / 86_400_000);
  if (lag <= 0) return [...cal];
  if (lag >= CAL_DAYS) return Array(CAL_DAYS).fill(0);
  return [...cal.slice(lag), ...Array(lag).fill(0)];
}
