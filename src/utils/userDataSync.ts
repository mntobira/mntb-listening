/**
 * ===================================================================
 * 端末だけにあった記録の Firestore 同期（2026-10-19）
 * ===================================================================
 *
 *   user_data/{uid} = { uid, s_growth: "<JSON>", s_vocabQuiz: "<JSON>", ..., updatedAt }
 *
 * ■ 値を JSON 文字列で持つ理由
 *   ・Firestore はキーに「.」「/」を含む map を扱いにくい（章ID・単語ID・日付が混ざる）
 *   ・1フィールド＝1データにしておくと、変わったデータだけ書けて安い
 *   ・ルール側では「本人だけ・決まったフィールドだけ・大きさの上限」を確かめる
 *
 * ■ いつ通信するか（Firestore は回数で課金）
 *   ・ログイン直後に1回（読み1・書き0〜1）
 *   ・その後は 20 秒ごとに「端末の記録が変わったか」を見て、変わっていたら 読み1・書き1
 *   ・アプリを閉じる／裏に回すときに1回
 *   学習しているあいだだけ動くので、1日あたり数十回に収まる。
 *
 * ■ 失敗しても学習は止めない（localStorage にはもう書けている）。次の機会に送り直す。
 *
 * 合わせ方の中身は userDataSyncCore.ts（Firebase なしでテストしている）。
 */
import { doc, getDoc, setDoc, serverTimestamp } from './firestoreMetered';
import { auth, db } from '../firebase';
import { safeLocalStorage } from './safeLocalStorage';
import { localFingerprint, migrateGuestData, reconcile, SYNC_SECTIONS, USER_DATA_SYNCED_EVENT, type KV } from './userDataSyncCore';

export { USER_DATA_SYNCED_EVENT };

export const USER_DATA_COLLECTION = 'user_data';
/** 前回そろえた値（3-way マージの base）。uid ごと */
const BASE_KEY = (uid: string) => 'user_data_sync_base_v1_' + encodeURIComponent(uid);
const CHECK_MS = 20_000;

let lastFingerprint: string | null = null;
let syncing: Promise<void> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let activeUid: string | null = null;

function kv(): KV | null {
  return safeLocalStorage();
}

function readBase(store: KV, uid: string): Record<string, string> {
  try {
    const v = JSON.parse(store.getItem(BASE_KEY(uid)) || '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, string> : {};
  } catch { return {}; }
}

/**
 * クラウドと1回そろえる（読み1 → 合わせる → 変わったフィールドだけ書く）。
 * 同時に2つ走らないようにする。
 */
export function syncUserData(reason = 'auto'): Promise<void> {
  if (syncing) return syncing;
  const uid = auth.currentUser?.uid;
  const store = kv();
  if (!uid || !store) return Promise.resolve();
  syncing = (async () => {
    try {
      const ref = doc(db, USER_DATA_COLLECTION, uid);
      const snap = await getDoc(ref);
      if (auth.currentUser?.uid !== uid) return; // 途中でアカウントが変わった
      const remote = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
      const r = reconcile(store, uid, remote, readBase(store, uid));
      if (Object.keys(r.upload).length) {
        await setDoc(ref, { uid, ...r.upload, updatedAt: serverTimestamp() }, { merge: true });
      }
      try { store.setItem(BASE_KEY(uid), JSON.stringify(r.base)); } catch { /* 容量不足：次回は 2-way で合わせる */ }
      lastFingerprint = localFingerprint(store, uid);
      if (r.tooLarge.length) console.warn('[userDataSync] 大きすぎてクラウドに置けないデータ:', r.tooLarge.join(', '));
      if (r.changedLocal.length && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(USER_DATA_SYNCED_EVENT, { detail: { changed: r.changedLocal, reason } }));
      }
    } catch (error) {
      console.warn('[userDataSync] 同期できませんでした（学習は続けられます。次の機会に送り直します）:', error);
    } finally {
      syncing = null;
    }
  })();
  return syncing;
}

/** 端末の記録が前回から変わっていれば送る */
function syncIfChanged(reason: string) {
  const uid = auth.currentUser?.uid;
  const store = kv();
  if (!uid || !store) return;
  if (localFingerprint(store, uid) === lastFingerprint) return;
  void syncUserData(reason);
}

/**
 * ログインしたときに呼ぶ。
 *   ① この端末のゲストの記録をアカウントへ移す
 *   ② クラウドと合わせる
 *   ③ 以後、変わったら送る見張りを始める
 */
export function startUserDataSync(uid: string): void {
  const store = kv();
  if (!store || !uid) return;
  if (activeUid !== uid) {
    stopUserDataSync();
    activeUid = uid;
    try {
      const m = migrateGuestData(store, uid);
      if (m.moved.length) {
        console.info('[userDataSync] ゲストの記録をアカウントへ移しました:', m.moved.join(', '));
        window.dispatchEvent(new CustomEvent(USER_DATA_SYNCED_EVENT, { detail: { changed: m.moved, reason: 'migrate' } }));
      }
    } catch (error) { console.warn('[userDataSync] ゲストの記録を移せませんでした（元の記録は残しています）:', error); }
  }
  void syncUserData('login');
  if (!timer) timer = setInterval(() => syncIfChanged('interval'), CHECK_MS);
}

/** ログアウト・アカウント切り替えのとき */
export function stopUserDataSync(): void {
  if (timer) { clearInterval(timer); timer = null; }
  activeUid = null;
  lastFingerprint = null;
}

/** アプリを閉じる・裏に回すときに送る */
export function installUserDataSyncFlush(): () => void {
  if (typeof window === 'undefined') return () => {};
  const flush = () => syncIfChanged('pagehide');
  const onVis = () => { if (document.visibilityState === 'hidden') flush(); };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', onVis);
  return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onVis); };
}

/** 同期の対象（設定画面の説明・テストで使う） */
export const USER_DATA_SECTION_IDS = SYNC_SECTIONS.map(s => s.id);
