/**
 * 通知を実際に予約する層（studyReminders.ts の計画を、端末 or ブラウザへ渡す）。
 * アプリ版のプラグインは使うときだけ読み込む（Web 版の起動を重くしない）。
 */
import { auth } from '../firebase';
import { isNativeApp } from '../native/platform';
import { loadReviewList } from './reviewList';
import { lastActiveKey, streakKey } from './userStorageKeys';
import { planReminders, readReminderPrefs, type PlannedReminder } from './studyReminders';

export type ReminderPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

function currentInput(now = Date.now()) {
  const uid = auth.currentUser?.uid || 'guest';
  let streak = 0; let lastActive: string | null = null;
  try {
    streak = parseInt(localStorage.getItem(streakKey(uid)) || '0', 10) || 0;
    lastActive = localStorage.getItem(lastActiveKey(uid));
  } catch { /* 読めなければ連続日数の通知は出さない */ }
  return { now, reviewDueAts: loadReviewList(uid).map(i => i.dueAt).filter(Number.isFinite), streak, lastActive };
}

async function plugin() {
  const m = await import('@capacitor/local-notifications');
  return m.LocalNotifications;
}

export async function reminderPermission(): Promise<ReminderPermission> {
  try {
    if (isNativeApp()) {
      const r = await (await plugin()).checkPermissions();
      return r.display === 'granted' ? 'granted' : r.display === 'denied' ? 'denied' : 'prompt';
    }
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission === 'default' ? 'prompt' : Notification.permission;
  } catch { return 'unsupported'; }
}

/** オンにしたときだけ呼ぶ（いきなり許可を求めない） */
export async function requestReminderPermission(): Promise<ReminderPermission> {
  try {
    if (isNativeApp()) {
      const r = await (await plugin()).requestPermissions();
      return r.display === 'granted' ? 'granted' : 'denied';
    }
    if (typeof Notification === 'undefined') return 'unsupported';
    const r = await Notification.requestPermission();
    return r === 'default' ? 'prompt' : r;
  } catch { return 'unsupported'; }
}

let webTimers: ReturnType<typeof setTimeout>[] = [];
const NATIVE_IDS = [...Array.from({ length: 7 }, (_, i) => 1000 + i), 2000];

/**
 * いまの記録から通知を予約し直す（前の予約は消す）。
 * 学習したとき・復習リストが変わったとき・アプリを開いたときに呼ぶ。何度呼んでもよい。
 */
export async function rescheduleReminders(): Promise<PlannedReminder[]> {
  const prefs = readReminderPrefs();
  const plan = planReminders(currentInput(), prefs);
  try {
    if (isNativeApp()) {
      const ln = await plugin();
      await ln.cancel({ notifications: NATIVE_IDS.map(id => ({ id })) });
      if (!plan.length || (await reminderPermission()) !== 'granted') return plan;
      await ln.schedule({
        notifications: plan.map(p => ({ id: p.id, title: p.title, body: p.body, schedule: { at: new Date(p.at), allowWhileIdle: true }, extra: { kind: p.kind } })),
      });
      return plan;
    }
    webTimers.forEach(clearTimeout); webTimers = [];
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return plan;
    const DAY = 24 * 60 * 60 * 1000;
    for (const p of plan) {
      const wait = p.at - Date.now();
      if (wait <= 0 || wait > DAY) continue; // ブラウザは開いているあいだだけ。1日以内のものだけ
      webTimers.push(setTimeout(() => {
        try { new Notification(p.title, { body: p.body, icon: '/brand/app-icon-logo.webp', tag: `manatobi-${p.kind}` }); } catch { /* 出せない環境は何もしない */ }
      }, wait));
    }
  } catch (error) {
    console.warn('[reminders] 通知を予約できませんでした:', error);
  }
  return plan;
}
