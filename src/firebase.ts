import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  connectAuthEmulator,
  type Dependencies,
} from 'firebase/auth';
import { getFirestore, initializeFirestore, connectFirestoreEmulator, disableNetwork, type Firestore } from 'firebase/firestore';
// authDomain を「同じドメイン」にするかの判定（Firebase を初期化せずにテストできるよう別ファイル。説明もそちら）
import { shouldUseSameOriginAuth } from './authDomainPolicy';
const env = import.meta.env;
export const FIREBASE_CONFIGURED = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_AUTH_DOMAIN && env.VITE_FIREBASE_APP_ID);
export const USE_EMULATORS = env.VITE_USE_EMULATORS === 'true';
if (env.VITE_FIREBASE_PROJECT_ID === 'mntb-4ef06') throw new Error('統合版のFirebaseには接続できません。リスニング専用プロジェクトを設定してください。');
const projectId = FIREBASE_CONFIGURED ? env.VITE_FIREBASE_PROJECT_ID : 'demo-manatobi-listening';

/** アプリ版（Capacitor の端末内）で動いているか。firebase.ts は native/platform を読まない（初期化順を変えないため） */
function isCapacitorNative(): boolean {
  try {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    return Boolean(cap?.isNativePlatform?.());
  } catch {
    // window が無い（テスト・SSR）ときは Web 扱い
    return false;
  }
}

function resolveAuthDomain(configured: string): string {
  try {
    if (typeof window === 'undefined') return configured;
    const ok = shouldUseSameOriginAuth(
      { sameOrigin: env.VITE_AUTH_SAME_ORIGIN, appleReady: env.VITE_AUTH_SAME_ORIGIN_APPLE_READY },
      window.location,
      isCapacitorNative(),
    );
    return ok ? window.location.host : configured;
  } catch {
    // 判定に失敗したら従来どおり（安全側）
    return configured;
  }
}

const authDomain = FIREBASE_CONFIGURED ? resolveAuthDomain(env.VITE_FIREBASE_AUTH_DOMAIN) : 'demo-manatobi-listening.firebaseapp.com';
/** いま「同じドメイン」でログインしているか（true のときだけ、ポップアップが使えない環境でリダイレクトに切り替える） */
export const AUTH_SAME_ORIGIN_ACTIVE = FIREBASE_CONFIGURED && authDomain !== env.VITE_FIREBASE_AUTH_DOMAIN;
const app = initializeApp({
  apiKey: FIREBASE_CONFIGURED ? env.VITE_FIREBASE_API_KEY : 'demo-listening-key',
  projectId, authDomain,
  appId: FIREBASE_CONFIGURED ? env.VITE_FIREBASE_APP_ID : '1:123:web:listening',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET, messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
}, 'manatobi-listening');

/**
 * ★Auth の初期化（2026-10-23）★
 *   1.0.2（b7a25cb）でアプリ版のために getAuth → initializeAuth に変えたとき、
 *   Web 用の popupRedirectResolver を入れ忘れ、2026-10-21 から Web ログインが壊れた（auth/argument-error）。
 *   ・Web：resolver を入れる（= getAuth と同じ部品）。リダイレクトから戻った結果も、どの画面にいても自動で受け取られる
 *   ・アプリ版：今までどおり入れない（WebView で Google の画面を読み込ませない。ログインは nativeSignIn）
 */
export function authDependencies(native: boolean): Dependencies {
  const persistence = [indexedDBLocalPersistence, browserLocalPersistence];
  return native ? { persistence } : { persistence, popupRedirectResolver: browserPopupRedirectResolver };
}

function initAuth() {
  try {
    return initializeAuth(app, authDependencies(isCapacitorNative()));
  } catch {
    // 2回目の初期化（HMR など）は既存のものを使う
    return getAuth(app);
  }
}
export const auth = initAuth();
export const provider = new GoogleAuthProvider();
// 統合版と同じ：学校・塾の Wi-Fi などでストリーム通信が詰まる環境だけ、自動でロングポーリングに切り替える
function createDb(): Firestore {
  try { return initializeFirestore(app, { experimentalAutoDetectLongPolling: true }); } catch { return getFirestore(app); }
}
export const db = createDb();
if (USE_EMULATORS) {
  if (!projectId.startsWith('demo-')) throw new Error('Emulator testing requires a demo- project ID.');
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
} else if (!FIREBASE_CONFIGURED) {
  // Guest preview only. Never connect to the integrated app or an unknown backend.
  void disableNetwork(db);
}
