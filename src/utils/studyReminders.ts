/**
 * ===================================================================
 * 学習のお知らせ（通知）2026-10-19
 * ===================================================================
 *
 * ■ 出すのは2種類だけ（出しすぎると切られるので、役に立つものに絞る）
 *   ① 復習の期限 … 間違えた問題の「復習日」が来たら、その日の夕方 18:00 に1回
 *   ② 連続日数が切れそう … 今日まだ学習していなくて連続日数が2日以上なら、21:00 に1回
 *
 * ■ どうやって出すか
 *   アプリ版（iOS / Android）… 端末のローカル通知（@capacitor/local-notifications）。
 *     アプリを閉じていても届く。サーバーは使わない（個人情報を外へ出さない）。
 *   Web 版 … ブラウザはアプリを閉じたあとの予約ができないので、
 *     開いているあいだに時刻が来たら1回だけ出す（タブが裏にあっても出る）。
 *
 * ■ オンにするのは本人だけ（設定 → 通知）。最初はオフ。許可を求めるのも、オンにしたときだけ。
 *
 * planReminders は日時の計算だけをする純粋関数（テストで直接確かめる）。
 */
import { safeLocalStorage } from './safeLocalStorage';

export interface ReminderPrefs { enabled: boolean; review: boolean; streak: boolean }
export const DEFAULT_REMINDER_PREFS: ReminderPrefs = { enabled: false, review: true, streak: true };
const PREFS_KEY = 'study_reminders_v1';

export function readReminderPrefs(): ReminderPrefs {
  try {
    const v = JSON.parse(safeLocalStorage()?.getItem(PREFS_KEY) || 'null');
    if (v && typeof v === 'object') {
      return { enabled: v.enabled === true, review: v.review !== false, streak: v.streak !== false };
    }
  } catch { /* 壊れていたら既定値 */ }
  return { ...DEFAULT_REMINDER_PREFS };
}
export function writeReminderPrefs(p: ReminderPrefs): void {
  try { safeLocalStorage()?.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* 保存できなくても今回は使える */ }
}

export interface ReminderInput {
  now: number;
  /** 復習リストの dueAt（ms）の一覧 */
  reviewDueAts: number[];
  /** 連続学習日数 */
  streak: number;
  /** 最後に学習した日（Date.toDateString() 形式。Home.tsx と同じ） */
  lastActive: string | null;
}
export interface PlannedReminder {
  /** 端末の通知ID（同じ種類は同じIDで上書き＝重ならない） */
  id: number;
  kind: 'review' | 'streak';
  at: number;
  title: string;
  body: string;
}

export const REVIEW_HOUR = 18;
export const STREAK_HOUR = 21;
/** 何日先まで予約するか（アプリを開かない日が続いても届くように） */
export const PLAN_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;

function atHour(base: number, hour: number): number {
  const d = new Date(base); d.setHours(hour, 0, 0, 0); return d.getTime();
}
function startOfDay(t: number): number { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }

/**
 * これから出す通知の一覧（時刻順）。
 *   ・復習：PLAN_DAYS 日先まで、復習日が来る日ごとに 18:00 に1回（その時点で期限の来ている件数を出す）
 *   ・連続日数：今日まだ学習していなければ今日 21:00、学習済みなら明日 21:00（明日学習しなければ切れる）
 */
export function planReminders(input: ReminderInput, prefs: ReminderPrefs): PlannedReminder[] {
  if (!prefs.enabled) return [];
  const out: PlannedReminder[] = [];
  const today0 = startOfDay(input.now);
  if (prefs.review && input.reviewDueAts.length) {
    for (let i = 0; i < PLAN_DAYS; i += 1) {
      const at = atHour(today0 + i * DAY + 12 * 60 * 60 * 1000, REVIEW_HOUR);
      if (at <= input.now) continue;
      const due = input.reviewDueAts.filter(t => t <= at).length;
      const dueBefore = i === 0 ? 0 : input.reviewDueAts.filter(t => t <= at - DAY).length;
      // その日に新しく期限が来た問題があるときだけ（毎日同じ通知を出さない）
      if (due > 0 && (i === 0 || due > dueBefore)) {
        out.push({ id: 1000 + i, kind: 'review', at, title: '復習の日です', body: `間違えた問題が ${due} 問、復習の日をむかえました。忘れる前に1回だけ解き直そう。` });
      }
    }
  }
  if (prefs.streak && input.streak >= 2) {
    const studiedToday = input.lastActive === new Date(input.now).toDateString();
    const day = studiedToday ? today0 + DAY : today0;
    const at = atHour(day + 12 * 60 * 60 * 1000, STREAK_HOUR);
    if (at > input.now) {
      out.push({ id: 2000, kind: 'streak', at, title: `連続 ${input.streak} 日がとぎれそう`, body: '今日はまだ学習していません。1問だけでも解くと、連続日数がつながります。' });
    }
  }
  return out.sort((a, b) => a.at - b.at);
}
