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
 *   ・その後は 20 秒ごとに「端末の記録が変わったか」を見て、変わっていて前回から3分以上たっていたら 読み1・書き1（E8）
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
import { applyLocalWrites, localFingerprint, migrateGuestData, parseSyncState, reconcile, resolvePendingBase, serializeSyncState,
  stateBeforeUpload, SYNC_SECTIONS, USER_DATA_SYNCED_EVENT, type KV, type SyncState } from './userDataSyncCore';

export { USER_DATA_SYNCED_EVENT };

export const USER_DATA_COLLECTION = 'user_data';
/** 前回そろえた値（3-way マージの base）。uid ごと */
const BASE_KEY = (uid: string) => 'user_data_sync_base_v1_' + encodeURIComponent(uid);
const CHECK_MS = 20_000;
/**
 * ★2026-10-30 E8★ 定期チェックで送るのは、前回そろえてから3分以上たったときだけ。
 *   学習中は学習時間が15秒ごとに端末へ足されるので、20秒ごとのチェックがほぼ毎回「変わった」になり、
 *   1時間に最大180回（読み＋書き）通信していた。アプリを閉じる・裏に回す・ログインのときは
 *   今までどおりすぐ送るので、記録が失われることはない（最大3分ぶん、クラウドへの反映が遅れるだけ）。
 */
const INTERVAL_MIN_GAP_MS = 180_000;
let lastSyncAt = 0;

let lastFingerprint: string | null = null;
let syncing: Promise<void> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let activeUid: string | null = null;

function kv(): KV | null {
  return safeLocalStorage();
}

function readState(store: KV, uid: string): SyncState {
  return parseSyncState(store.getItem(BASE_KEY(uid)));
}

/**
 * クラウドと1回そろえる（読み1 → 合わせる → 変わったフィールドだけ書く）。
 * 同時に2つ走らないようにする（同じ端末の別タブとも Web Locks で順番に）。
 *
 * ★順番（2026-10-21 コイン・XP が増えていく不具合の修正）★
 *   ① クラウドを読む（キャッシュからの古い値なら、今回は合わせない）
 *   ② 前回の送信が途中で終わっていたら、届いたかどうかを見て base を決め直す
 *   ③ 合わせる（まだ書かない）
 *   ④ 「送っている途中」の状態を保存 → 端末へ書く
 *   ⑤ 送る。届いたら base を確定
 *   ④と⑤の間でアプリが閉じられても、次の②で正しく決め直せる（userDataSyncCore.ts の説明）。
 */
export function syncUserData(reason = 'auto'): Promise<void> {
  if (syncing) return syncing;
  const uid = auth.currentUser?.uid;
  const store = kv();
  if (!uid || !store) return Promise.resolve();
  const run = async () => {
    const ref = doc(db, USER_DATA_COLLECTION, uid);
    const snap = await getDoc(ref);
    if (auth.currentUser?.uid !== uid) return; // 途中でアカウントが変わった
    if (snap.metadata?.fromCache) return; // 通信できず古い値しか無い：合わせると増減を取り違えるので次の機会に
    const remote = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
    const state = readState(store, uid);
    const base = resolvePendingBase(state, remote);
    const r = reconcile(store, uid, remote, base, { apply: false });
    const hasUpload = Object.keys(r.upload).length > 0;
    // ④ 状態 → 端末。状態を保存できなければ（容量不足など）端末もクラウドも触らずにやめる
    try {
      store.setItem(BASE_KEY(uid), serializeSyncState(hasUpload ? stateBeforeUpload(base, r) : { base: r.base, pending: null }));
    } catch { return; }
    try { applyLocalWrites(store, uid, r.localWrites); } catch (error) {
      try { store.setItem(BASE_KEY(uid), serializeSyncState(state)); } catch { /* 元に戻せなくても次回の②が決め直す */ }
      throw error;
    }
    if (hasUpload) {
      await setDoc(ref, { uid, ...r.upload, updatedAt: serverTimestamp() }, { merge: true });
      try { store.setItem(BASE_KEY(uid), serializeSyncState({ base: r.base, pending: null })); } catch { /* 次回の②が決め直す */ }
    }
    lastFingerprint = localFingerprint(store, uid);
    lastSyncAt = Date.now();
    if (r.tooLarge.length) console.warn('[userDataSync] 大きすぎてクラウドに置けないデータ:', r.tooLarge.join(', '));
    if (r.changedLocal.length && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(USER_DATA_SYNCED_EVENT, { detail: { changed: r.changedLocal, reason } }));
    }
  };
  syncing = (async () => {
    try {
      const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
      if (locks) await locks.request(`user-data-sync-${uid}`, run); else await run();
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
  if (reason === 'interval' && Date.now() - lastSyncAt < INTERVAL_MIN_GAP_MS) return;
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
  lastSyncAt = 0;
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
