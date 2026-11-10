/**
 * 通知を実際に予約する層（studyReminders.ts の計画を、端末 or ブラウザへ渡す）。
 * アプリ版のプラグインは使うときだけ読み込む（Web 版の起動を重くしない）。
 */
import { auth } from '../firebase';
import { cachedGrowth } from '../battle/data/growthStore';
import { isNativeApp } from '../native/platform';
import { loadReviewList } from './reviewList';
import { lastActiveKey, streakKey } from './userStorageKeys';
import { planReminders, readReminderPrefs, type PlannedReminder } from './studyReminders';
import { requireLocalStorage } from './safeLocalStorage';

export type ReminderPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

function currentInput(now = Date.now()) {
  const uid = auth.currentUser?.uid || 'guest';
  let streak = 0; let lastActive: string | null = null;
  try {
    const ls = requireLocalStorage(); // 読めない端末では同じ catch に入る（元の動きのまま・C-17）
    streak = parseInt(ls.getItem(streakKey(uid)) || '0', 10) || 0;
    lastActive = ls.getItem(lastActiveKey(uid));
  } catch { /* 読めなければ連続日数の通知は出さない */ }
  const growth = cachedGrowth();
  return { now, reviewDueAts: loadReviewList(uid).map(i => i.dueAt).filter(Number.isFinite), streak: growth?.loginStreak ?? streak, lastActive, loginLastClaimed: growth?.lastLoginDate ?? null };
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

/**
 * 2026-10-28 A5「通知が鳴らない」の修正。
 *   iOS：予約に sound を付けないと無音で届く（プラグインの仕様）→ notify_chime.wav を付ける（public/ から探す）。
 *   Android 8+：音はチャンネルで決まる → 重要度「高」（音・ポップアップあり）の専用チャンネルを作り、そこへ出す。
 *     音のファイルは android/app/src/main/res/raw/notify_chime.wav。
 *   Web：ブラウザの通知は音を鳴らさないことが多いので、出すときにチャイムを鳴らす。
 */
export const REMINDER_CHANNEL = 'study_reminders';
export const REMINDER_SOUND = 'notify_chime.wav';
let channelReady = false;
async function ensureChannel(ln: Awaited<ReturnType<typeof plugin>>) {
  if (channelReady) return;
  try {
    await ln.createChannel({ id: REMINDER_CHANNEL, name: '学習のお知らせ', description: '復習の日・連続日数のお知らせ', importance: 4, visibility: 1, sound: REMINDER_SOUND, vibration: true });
  } catch { /* iOS にはチャンネルが無い（何もしなくてよい） */ }
  channelReady = true;
}
function playWebChime() {
  try { const a = new Audio('/' + REMINDER_SOUND); a.volume = 0.8; void a.play().catch(() => undefined); } catch { /* 鳴らせない環境は何もしない */ }
}
const toNative = (p: { id: number; title: string; body: string; at: number; kind: string }) => ({
  id: p.id, title: p.title, body: p.body, schedule: { at: new Date(p.at), allowWhileIdle: true },
  sound: REMINDER_SOUND, channelId: REMINDER_CHANNEL, extra: { kind: p.kind },
});

/** 設定の「テスト通知」：5秒後に1回だけ鳴らして、届くか・鳴るかを本人が確かめられる */
export async function sendTestReminder(): Promise<'sent' | 'denied' | 'unsupported'> {
  const title = 'マナトビからのお知らせ♪';
  const body = 'この音と表示が届けば、かわいい学習のお知らせも届くよ！';
  try {
    if (isNativeApp()) {
      const ln = await plugin();
      if ((await reminderPermission()) !== 'granted') return 'denied';
      await ensureChannel(ln);
      await ln.schedule({ notifications: [toNative({ id: 3000, title, body, at: Date.now() + 5000, kind: 'test' })] });
      return 'sent';
    }
    if (typeof Notification === 'undefined') return 'unsupported';
    if (Notification.permission !== 'granted') return 'denied';
    setTimeout(() => { try { new Notification(title, { body, icon: '/brand/app-icon-logo.webp', tag: 'manatobi-test', silent: false }); } catch { /* 出せない環境 */ } playWebChime(); }, 5000);
    return 'sent';
  } catch { return 'unsupported'; }
}

let webTimers: ReturnType<typeof setTimeout>[] = [];
const NATIVE_IDS = [...Array.from({ length: 7 }, (_, i) => 1000 + i), 2000, 4000];

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
      await ensureChannel(ln);
      await ln.schedule({ notifications: plan.map(toNative) });
      return plan;
    }
    webTimers.forEach(clearTimeout); webTimers = [];
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return plan;
    const DAY = 24 * 60 * 60 * 1000;
    for (const p of plan) {
      const wait = p.at - Date.now();
      if (wait <= 0 || wait > DAY) continue; // ブラウザは開いているあいだだけ。1日以内のものだけ
      webTimers.push(setTimeout(() => {
        try { new Notification(p.title, { body: p.body, icon: '/brand/app-icon-logo.webp', tag: `manatobi-${p.kind}`, silent: false }); } catch { /* 出せない環境は何もしない */ }
        playWebChime();
      }, wait));
    }
  } catch (error) {
    console.warn('[reminders] 通知を予約できませんでした:', error);
  }
  return plan;
}
