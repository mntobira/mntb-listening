/**
 * ===================================================================
 * ユーザー登録状況の把握（Firestore + Google スプレッドシート）
 * ===================================================================
 *
 * 「総ユーザー数」と「登録されている Google アカウント」を、
 * フィードバックと同じ仕組み（Firestore と スプレッドシートの二重記録）で
 * 把握できるようにするための仕組み。
 *
 * -------------------------------------------------------------------
 * ■ なぜ Firebase Authentication の一覧だけでは足りないのか
 * -------------------------------------------------------------------
 *   Firebase コンソールの Authentication にも登録ユーザーの一覧はあるが、
 *     ・「いつ最後に使ったか」以上の学習状況（継続日数・修了章数）が分からない
 *     ・スプレッドシートに落とせないので集計・グラフ化ができない
 *     ・ゲスト利用者（未ログイン）はそもそも1人も現れない
 *   ため、アプリ側から能動的に記録する。
 *
 * -------------------------------------------------------------------
 * ■ 記録するタイミング（送りすぎないための設計）
 * -------------------------------------------------------------------
 *   起動のたびに送るとスプレッドシートが一瞬で数万行になるため、
 *     ① 初回（そのアカウントで初めて記録するとき）      → 'signup'
 *     ② 前回の記録から24時間以上あいた最初の起動        → 'active'
 *   の2種類だけを送る。判定は localStorage で行い、
 *   Firestore 側は uid をドキュメントIDにして常に上書き（1人1行）にする。
 *
 * -------------------------------------------------------------------
 * ■ プライバシー配慮
 * -------------------------------------------------------------------
 *   記録するのは Google ログイン時にアプリが既に受け取っている情報
 *   （uid / 表示名 / メールアドレス）と学習状況のみ。
 *   ゲストは個人を特定できる情報を持たないため、匿名の端末IDで数だけ数える。
 */

import { doc, setDoc, serverTimestamp } from './firestoreMetered';
import { auth, db } from '../firebase';
import { safeLocalStorage } from './safeLocalStorage';
// ユーザーごとの localStorage キー名は utils/userStorageKeys.ts が唯一の定義
import { profileKey, streakKey, completedKey } from './userStorageKeys';
// タイムアウト付き fetch と 15秒のタイムアウト値は、フィードバック
// （feedback.ts）と同じ GAS へ同じ作法で送るため共通のものを使う
// （以前はこの2ファイルに同じ実装と同じ値が別々に書かれていた）。
import { fetchWithTimeout, WEBHOOK_TIMEOUT_MS } from './httpTimeout';

/** Firestore のコレクション名（1人1ドキュメント。ドキュメントID = uid） */
export const USERS_COLLECTION = 'app_users';

/** 記録の種類 */
export type UserEventType = 'signup' | 'active';

/** localStorage のキー */
const LAST_SYNC_KEY = 'user_registry_last_sync_v1';
const GUEST_DEVICE_ID_KEY = 'user_registry_guest_device_v1';

/** 「アクティブ」として再送する間隔（24時間） */
const ACTIVE_RESYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** スプレッドシートへ送るペイロード */
export interface UserRecordPayload {
  /** これはユーザー記録である、という宛先の振り分け用 */
  kind: 'user';
  /** 'signup'（初回） or 'active'（継続利用） */
  event: UserEventType;
  /** Firebase の uid。ゲストは匿名の端末ID */
  uid: string;
  /** Google ログイン済みか */
  isGoogleLinked: boolean;
  /** 表示名（ゲストは null） */
  displayName: string | null;
  /** Google アカウントのメールアドレス（ゲストは null） */
  email: string | null;
  /** プロフィール画像URL */
  photoUrl: string | null;
  /** アプリ内で設定したニックネーム */
  profileName: string | null;
  /** 学年 */
  grade: string | null;
  /** 連続学習日数 */
  streak: number;
  /** 修了した章の数 */
  completedCount: number;
  /** アカウント作成日時（Google 連携時のみ取得できる） */
  createdAtIso: string | null;
  /** 今回の記録時刻 */
  recordedAtIso: string;
  appVersion: string;
  userAgent: string;
  viewport: string;
}

// -------------------------------------------------------------------
// 小さなヘルパー
// -------------------------------------------------------------------

function readEnv(key: string): string {
  try {
    const env = (import.meta as unknown as { env?: Record<string, unknown> } | undefined)?.env;
    const value = env?.[key];
    return typeof value === 'string' ? value.trim() : '';
  } catch {
    return '';
  }
}

/**
 * 使える localStorage を返す（使えなければ null）。
 * 実装は utils/safeLocalStorage.ts が唯一の定義。
 * 呼び出し側の書き方は今までどおり `safeStorage()` のままにしている。
 */
const safeStorage = safeLocalStorage;

/**
 * ゲスト用の匿名端末ID。
 * 個人は特定できないが「何台の端末がゲストで使っているか」は数えられる。
 */
function getGuestDeviceId(): string {
  const storage = safeStorage();
  const existing = storage?.getItem(GUEST_DEVICE_ID_KEY);
  if (existing) return existing;
  const generated = `guest_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  try {
    storage?.setItem(GUEST_DEVICE_ID_KEY, generated);
  } catch {
    // 保存できなくても動作は続ける
  }
  return generated;
}

/** localStorage から学習状況を読む（Firestore を汚さずに済ませる） */
function readLocalStats(uid: string): { streak: number; completedCount: number; profileName: string | null; grade: string | null } {
  const storage = safeStorage();
  let streak = 0;
  let completedCount = 0;
  let profileName: string | null = null;
  let grade: string | null = null;
  try {
    streak = parseInt(storage?.getItem(streakKey(uid)) || '0', 10) || 0;
    const completed = JSON.parse(storage?.getItem(completedKey(uid)) || '[]');
    completedCount = Array.isArray(completed) ? completed.length : 0;
    const raw = storage?.getItem(profileKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      profileName = parsed?.name || null;
      grade = parsed?.grade || null;
    }
  } catch {
    // 壊れた値は無視して既定値のまま進む
  }
  return { streak, completedCount, profileName, grade };
}

function buildPayload(event: UserEventType): UserRecordPayload {
  const user = auth.currentUser;
  const uid = user?.uid || getGuestDeviceId();
  const stats = readLocalStats(user?.uid || 'guest');

  return {
    kind: 'user',
    event,
    uid,
    isGoogleLinked: Boolean(user),
    displayName: user?.displayName ?? null,
    email: user?.email ?? null,
    photoUrl: user?.photoURL ?? null,
    profileName: stats.profileName,
    grade: stats.grade,
    streak: stats.streak,
    completedCount: stats.completedCount,
    createdAtIso: user?.metadata?.creationTime
      ? new Date(user.metadata.creationTime).toISOString()
      : null,
    recordedAtIso: new Date().toISOString(),
    appVersion: readEnv('VITE_APP_VERSION') || 'dev',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    viewport:
      typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
  };
}

// -------------------------------------------------------------------
// 送信口①：Firestore（1人1ドキュメント。ここが「総数」の集計元）
// -------------------------------------------------------------------

async function saveToFirestore(payload: UserRecordPayload): Promise<void> {
  await setDoc(
    doc(db, USERS_COLLECTION, payload.uid),
    {
      uid: payload.uid,
      isGoogleLinked: payload.isGoogleLinked,
      displayName: payload.displayName,
      email: payload.email,
      photoUrl: payload.photoUrl,
      profileName: payload.profileName,
      grade: payload.grade,
      streak: payload.streak,
      completedCount: payload.completedCount,
      createdAtIso: payload.createdAtIso,
      appVersion: payload.appVersion,
      userAgent: payload.userAgent,
      // 初回だけ記録し、以降は更新しない（merge のため既存値が残る）
      ...(payload.event === 'signup' ? { firstSeenAt: serverTimestamp() } : {}),
      // 毎回更新（「最後に使った日」が分かる）
      lastSeenAt: serverTimestamp(),
      lastSeenIso: payload.recordedAtIso,
    },
    { merge: true },
  );
}

// -------------------------------------------------------------------
// 送信口②：Google スプレッドシート（フィードバックと同じ GAS を使う）
// -------------------------------------------------------------------

/**
 * GAS へ送る。
 * フィードバックと同じ URL・同じ作法（text/plain で simple request、
 * CORS で落ちたら no-cors で撃ち直し）を使い、
 * GAS 側は payload.kind === 'user' を見て「users」シートへ振り分ける。
 */
async function sendToWebhook(payload: UserRecordPayload, url: string): Promise<void> {
  const init: RequestInit = {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  };
  try {
    const response = await fetchWithTimeout(url, init, WEBHOOK_TIMEOUT_MS);
    if (!response.ok) throw new Error(`status ${response.status}`);
  } catch (error) {
    if ((error as { name?: unknown } | null)?.name === 'AbortError') throw error;
    // CORS / ネットワーク由来 → no-cors で撃ち直す（到達すれば記録はされる）
    await fetchWithTimeout(url, { ...init, mode: 'no-cors' }, WEBHOOK_TIMEOUT_MS);
  }
}

// -------------------------------------------------------------------
// 公開API
// -------------------------------------------------------------------

/**
 * 今このタイミングで記録すべきか判定する。
 * - まだ一度も記録していない uid → 'signup'
 * - 前回から24時間以上経過        → 'active'
 * - それ以外                      → null（送らない）
 */
function decideEvent(uid: string): UserEventType | null {
  const storage = safeStorage();
  if (!storage) return 'active'; // 記録できない環境では毎回 active 扱い（数は追える）
  try {
    const raw = storage.getItem(LAST_SYNC_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const last = map?.[uid];
    if (!last) return 'signup';
    if (Date.now() - Number(last) >= ACTIVE_RESYNC_INTERVAL_MS) return 'active';
    return null;
  } catch {
    return 'signup';
  }
}

function markSynced(uid: string): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    const raw = storage.getItem(LAST_SYNC_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[uid] = Date.now();
    storage.setItem(LAST_SYNC_KEY, JSON.stringify(map));
  } catch {
    // 保存できなくても致命的ではない
  }
}

/**
 * ユーザーの登録・利用状況を記録する。
 *
 * ★ この処理は「あくまで裏方」なので、失敗しても絶対にアプリを止めない。
 *   （記録できないことより、学習が中断されることの方が利用者にとって重大）
 *
 * @param webhookUrl スプレッドシート送信先。省略時はフィードバックと同じURLを使う
 */
export async function recordUserPresence(webhookUrl?: string): Promise<void> {
  try {
    const user = auth.currentUser;
    const uid = user?.uid || getGuestDeviceId();

    const event = decideEvent(uid);
    if (!event) return; // 24時間以内に記録済み

    const payload = buildPayload(event);

    // Firestore（総数の集計元）。ゲストは書き込み権限がないので試みない。
    if (user) {
      try {
        await saveToFirestore(payload);
      } catch (error) {
        // ルール未反映などで失敗しても、スプレッドシート側は試す
        console.warn('[userRegistry] Firestore への記録に失敗しました', error);
      }
    }

    // スプレッドシート
    if (webhookUrl) {
      try {
        await sendToWebhook(payload, webhookUrl);
      } catch (error) {
        console.warn('[userRegistry] スプレッドシートへの記録に失敗しました', error);
      }
    }

    markSynced(uid);
  } catch (error) {
    console.warn('[userRegistry] 記録処理でエラーが発生しました', error);
  }
}

/**
 * -------------------------------------------------------------------
 * ■ 総ユーザー数の「見かた」について
 * -------------------------------------------------------------------
 * 総数をアプリの画面から読む API は、あえて用意していない。
 *
 * app_users は他人のメールアドレスが並ぶ台帳なので、
 * firestore.rules で read を全面禁止しているためである。
 * クライアントから件数を読めるようにするには read を開ける必要があり、
 * 「件数だけ」を許可する書き方は Firestore のルールには存在しない。
 * 総数を見るためだけに全利用者のメールアドレスを露出させるのは
 * 明らかに割に合わないので、閲覧は運営側の手段に限定する。
 *
 * 運営が総数を確認する方法は次の3つ:
 *   ① Google スプレッドシートの「users」シート
 *      → 行数がそのまま登録数。メールアドレス・最終利用日も並ぶので、
 *        ピボットや COUNTIF でそのまま集計できる（いちばん手軽）。
 *   ② Firebase コンソール → Firestore → app_users
 *      → コレクションのドキュメント数が総ユーザー数。
 *   ③ Firebase コンソール → Authentication → Users
 *      → Google ログイン済みアカウントの一覧（メールアドレス付き）。
 */
