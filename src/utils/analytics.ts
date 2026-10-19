/**
 * ===================================================================
 * 使われ方の記録（2026-10-19）
 * ===================================================================
 *
 * ■ 何が分かるようになるか
 *   ・どの画面がよく開かれ、どのくらい居たか（ホーム・演習・単語・対戦・ガチャ…）
 *   ・どの操作がよく使われたか（4択を始めた・ガチャを引いた・PDF を開いた…）
 *   ・どこでエラーが起きたか（ログイン失敗の種類 [NA-xxx] など）
 *
 * ■ 集め方（個人が分からない形・安く）
 *   1回の利用（アプリを開いてから閉じる／裏に回すまで）を、端末の中で数えてまとめ、
 *   閉じるときに1件だけ送る： usage_sessions/{自動ID}
 *     { day, platform, appVersion, install(ランダムな端末ID), signedIn(true/false),
 *       durationSec, screens{名前:回数}, screenSec{名前:秒}, events{名前:回数}, errors{コード:回数}, createdAt }
 *   ・uid・名前・メールは送らない。install は端末で作ったランダムな文字列（アカウントとは結びつかない）
 *   ・書き込みは1回の利用につき1回。読めるのは運営（firestore.rules の isFeedbackAdmin）だけ
 *
 * ■ オフにできる（設定 → その他 → 「使われ方の記録」）。オフにすると何も送らない。
 */
import { addDoc, collection, serverTimestamp } from './firestoreMetered';
import { auth, db, FIREBASE_CONFIGURED, USE_EMULATORS } from '../firebase';
import { safeLocalStorage } from './safeLocalStorage';
import { getAppPlatform } from '../native/platform';

export const USAGE_COLLECTION = 'usage_sessions';
const OPT_KEY = 'usage_analytics_opt_out_v1';
const INSTALL_KEY = 'usage_install_id_v1';
/** 1回の記録で持てる種類の上限（ルールの上限と同じ） */
export const MAX_KEYS = 60;
const NAME_RE = /^[a-z0-9_:\-]{1,40}$/i;

export interface UsageSummary {
  day: string; platform: string; appVersion: string; install: string; signedIn: boolean; durationSec: number;
  screens: Record<string, number>; screenSec: Record<string, number>; events: Record<string, number>; errors: Record<string, number>;
}

export function analyticsEnabled(): boolean {
  try { return safeLocalStorage()?.getItem(OPT_KEY) !== '1'; } catch { return true; }
}
export function setAnalyticsEnabled(on: boolean): void {
  try { if (on) safeLocalStorage()?.removeItem(OPT_KEY); else safeLocalStorage()?.setItem(OPT_KEY, '1'); } catch { /* 保存できなくても今回は従う */ }
  if (!on) resetSession();
}

function installId(): string {
  const s = safeLocalStorage();
  let id = s?.getItem(INSTALL_KEY) || '';
  if (!/^[a-z0-9]{16}$/.test(id)) {
    const b = new Uint8Array(8); crypto.getRandomValues(b);
    id = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
    try { s?.setItem(INSTALL_KEY, id); } catch { /* 毎回変わるだけ */ }
  }
  return id;
}

const pad = (n: number) => String(n).padStart(2, '0');
const today = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// ---------------- 端末の中での集計（純粋に近い部分。テストで確かめる） ----------------
let session = fresh();
let currentScreen: { name: string; since: number } | null = null;

function fresh() {
  return { startedAt: Date.now(), screens: {} as Record<string, number>, screenSec: {} as Record<string, number>, events: {} as Record<string, number>, errors: {} as Record<string, number>, touched: false };
}
function bump(map: Record<string, number>, key: string, by = 1) {
  if (!NAME_RE.test(key)) return;
  if (!(key in map) && Object.keys(map).length >= MAX_KEYS) return;
  map[key] = Math.min(1_000_000, (map[key] || 0) + by);
}
function closeScreen(now = Date.now()) {
  if (!currentScreen) return;
  bump(session.screenSec, currentScreen.name, Math.max(0, Math.round((now - currentScreen.since) / 1000)));
  currentScreen = null;
}

/** 画面を開いたとき（App.tsx の appState が変わるたび） */
export function trackScreen(name: string): void {
  if (!analyticsEnabled()) return;
  const now = Date.now();
  if (currentScreen?.name === name) return;
  closeScreen(now);
  bump(session.screens, name);
  currentScreen = { name, since: now };
  session.touched = true;
}
/** 操作（ボタンを押した・始めた など）。props は数字だけ（名前に足して数える。例 on=1 → reminder_toggle:on1） */
export function trackEvent(name: string, props?: Record<string, number>): void {
  if (!analyticsEnabled()) return;
  bump(session.events, name);
  if (props) for (const [k, v] of Object.entries(props)) bump(session.events, `${name}:${k}${Math.round(v)}`);
  session.touched = true;
}
/** エラー（code は短い英数字。例：NA-SHA1, auth/network-request-failed → auth_network-request-failed） */
export function trackError(code: string): void {
  if (!analyticsEnabled()) return;
  bump(session.errors, code.replace(/[^a-z0-9_:\-]/gi, '_').slice(0, 40) || 'unknown');
  session.touched = true;
}

/** 送る形にまとめる（送らない場合は null） */
export function buildSummary(now = Date.now()): UsageSummary | null {
  closeScreen(now);
  if (!session.touched) return null;
  return {
    day: today(new Date(session.startedAt)),
    platform: getAppPlatform(),
    appVersion: String(import.meta.env?.VITE_APP_VERSION || 'dev').slice(0, 40),
    install: installId(),
    signedIn: Boolean(auth.currentUser),
    durationSec: Math.min(24 * 3600, Math.max(0, Math.round((now - session.startedAt) / 1000))),
    screens: { ...session.screens }, screenSec: { ...session.screenSec }, events: { ...session.events }, errors: { ...session.errors },
  };
}
function resetSession() { session = fresh(); currentScreen = null; }

/** 今の利用ぶんを送って、数え直す */
export async function flushUsage(): Promise<boolean> {
  if (!analyticsEnabled() || (!FIREBASE_CONFIGURED && !USE_EMULATORS)) { resetSession(); return false; }
  const resume = currentScreen?.name;
  const summary = buildSummary();
  resetSession();
  if (resume) { currentScreen = { name: resume, since: Date.now() }; }
  if (!summary || summary.durationSec < 3) return false;
  try {
    await addDoc(collection(db, USAGE_COLLECTION), { ...summary, createdAt: serverTimestamp() });
    return true;
  } catch { return false; } // 送れなくても利用は止めない（記録は捨てる）
}

/** 裏に回す・閉じるときに送る */
export function installUsageFlush(): () => void {
  if (typeof window === 'undefined') return () => {};
  const onVis = () => { if (document.visibilityState === 'hidden') void flushUsage(); };
  const onHide = () => { void flushUsage(); };
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('pagehide', onHide);
  return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pagehide', onHide); };
}

/** テスト用 */
export function __resetUsageForTest() { resetSession(); }
