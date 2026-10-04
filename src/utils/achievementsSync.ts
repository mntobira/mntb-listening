/**
 * 積み上げ（達成ステージ・レベル）を端末共通にする（2026-10-04）。
 * この端末の記録を achievements 関数へ送り、サーバーが全端末を合算する。
 * 返ってきた合算値から「ほかの端末ぶん」を保存し、画面の「満点 n/3」を端末共通にする。
 * 公開プロフィールの 達成ステージ数・レベル はサーバーだけが書く（自己申告では変えられない）。
 */
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { auth, FIREBASE_CONFIGURED, USE_EMULATORS } from '../firebase';
import { safeLocalStorage } from './safeLocalStorage';
import { readLocalStageRecords, writeOtherDeviceStages } from './stageRecords';
import { cachedGrowth } from '../battle/data/growthStore';

const DEVICE_KEY = 'achievements_device_v1';
type Result = { stages: Record<string, { p: number; n: number }>; stagesCleared: number; level: number; xp: number };

function deviceId(): string {
  const store = safeLocalStorage();
  let id = store?.getItem(DEVICE_KEY) || '';
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
    id = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('');
    try { store?.setItem(DEVICE_KEY, id); } catch { /* 無視 */ }
  }
  return id;
}

let functionsInstance: ReturnType<typeof getFunctions> | null = null;
function fns() {
  if (!functionsInstance) {
    functionsInstance = getFunctions(auth.app, 'asia-northeast1');
    if (USE_EMULATORS) connectFunctionsEmulator(functionsInstance, '127.0.0.1', 5001);
  }
  return functionsInstance;
}

export async function syncAchievements(): Promise<Result | null> {
  const user = auth.currentUser;
  if (!user || user.isAnonymous || (!FIREBASE_CONFIGURED && !USE_EMULATORS)) return null;
  const uid = user.uid;
  const local = readLocalStageRecords(uid);
  const sent: Record<string, { p: number; n: number }> = {};
  for (const [k, v] of Object.entries(local)) if (/^[A-Za-z0-9_:-]{1,200}$/.test(k)) sent[k] = { p: v.p, n: v.n };
  const xp = Math.max(0, Math.floor(cachedGrowth()?.xp ?? 0));
  const res = await httpsCallable<Record<string, unknown>, Result>(fns(), 'achievements')({ deviceId: deviceId(), xp, stages: sent });
  if (auth.currentUser?.uid !== uid) return null;
  writeOtherDeviceStages(uid, res.data.stages ?? {}, sent);
  return res.data;
}

let timer: ReturnType<typeof setTimeout> | null = null;
/** 連続で解いたときに何度も送らないよう、まとめて送る */
export function scheduleAchievementsSync(delayMs = 4000): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { timer = null; void syncAchievements().catch(() => {}); }, delayMs);
}
