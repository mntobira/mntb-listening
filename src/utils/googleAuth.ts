/**
 * ===================================================================
 * Google アカウント連携（サインイン）の共通処理
 * ===================================================================
 *
 * ■ なぜ共通化したか
 *   これまで Google ログインの処理は
 *     - Onboarding.tsx
 *     - （旧 AuthButton.tsx は未使用のため削除）
 *     - ProfileModal.tsx
 *   の3箇所にコピーされており、
 *     ・popup が失敗したときのフォールバックが揃っていない
 *     ・エラーメッセージの文言が画面ごとに違う
 *     ・アプリ内ブラウザ（LINE 等）の判定が片方にしかない
 *   といったズレが生じていた。
 *
 *   アプリ全体で「Google アカウント連携」を主動線にする方針にあたり、
 *   どの入口から連携しても同じ品質で成功／同じ案内で失敗するよう、
 *   ここに一本化する。
 *
 * ■ popup → redirect のフォールバック（2026-10-23 見直し）
 *   ・ポップアップそのものが使えない環境（popup-blocked など）だけが redirect の候補。
 *     しかも「同じドメインでログインしているとき（firebase.ts の AUTH_SAME_ORIGIN_ACTIVE）」だけ。
 *     別ドメイン（firebaseapp.com）の redirect は、最近のブラウザでは結果が戻らないことがある。
 *   ・利用者が閉じた／別の操作で中断された（popup-closed-by-user / cancelled-popup-request）は
 *     キャンセルとして返す。以前はここで redirect に切り替えており、
 *     redirect の「終わらない Promise」を待って「連携中…」のまま固まる入口になっていた。
 *   ・Promise の全経路は utils/webSignInCore.ts と tests/webSignInCore.test.ts。
 */

import {
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  browserPopupRedirectResolver,
  onAuthStateChanged,
  signOut,
  type AuthProvider,
  type User,
} from 'firebase/auth';
import { auth, provider, FIREBASE_CONFIGURED, USE_EMULATORS, AUTH_SAME_ORIGIN_ACTIVE } from '../firebase';
import { runWebSignIn, isPopupUnsupported, isUserCancel, shortCode } from './webSignInCore';
// ユーザーごとの localStorage キー名は utils/userStorageKeys.ts が唯一の定義
import { profileKey } from './userStorageKeys';
import { isNativeApp } from '../native/platform';
import { nativeSignIn, nativeSignOut } from '../native/nativeAuth';
import type { GoogleSignInOutcome, SignInMethod } from './authTypes';
import { logRejection } from './reportError';
import { asErrorLike } from './errorLike';
import { trackError, trackEvent } from './analytics';
import { requireLocalStorage } from './safeLocalStorage';
// 既存の呼び出し側（import { SignInMethod } from './googleAuth'）のため再公開する
export type { GoogleSignInOutcome, SignInMethod } from './authTypes';


/**
 * LINE / Instagram などのアプリ内ブラウザ（WebView）かどうか。
 * これらは Google ログインが仕様上ブロックされるため、
 * 「標準ブラウザで開き直す」案内を先に出す必要がある。
 */
export function isInAppBrowser(): boolean {
  try {
    const ua = navigator.userAgent || '';
    return /Line\//i.test(ua) || /FBAN|FBAV|Instagram/i.test(ua) || /\bwv\b/i.test(ua) || /WebView/i.test(ua);
  } catch {
    return false;
  }
}

/** 「popup が使えない環境」または利用者が閉じた（どちらも「ログイン画面が出なかった／閉じた」の案内） */
function isPopupUnavailable(code: string): boolean {
  return isPopupUnsupported(code) || isUserCancel(code);
}

/** Firebase のエラーを、原因と次の行動が分かる日本語にする */
export function describeAuthError(rawError: unknown): string {
  const error = asErrorLike(rawError);
  const code = String(error?.code || '');
  if (code.includes('network-request-failed')) {
    return 'ネットワークに接続できませんでした。通信状況をご確認ください。';
  }
  if (code.includes('unauthorized-domain')) {
    return 'このドメインは連携が許可されていません（運営側の設定不備です）。';
  }
  if (isUserCancel(code)) {
    return 'ログインをキャンセルしました。もう一度ボタンを押すとやり直せます。';
  }
  if (isPopupUnavailable(code)) {
    return 'ブラウザがログイン画面の表示をブロックしました。ポップアップを許可するか、標準ブラウザ（Safari / Chrome）で開き直してください。';
  }
  if (code.includes('argument-error')) {
    return 'ログインの準備に失敗しました。ページを再読み込みしてから、もう一度お試しください。';
  }
  if (code.includes('account-exists-with-different-credential')) {
    return 'このメールアドレスは別の方法で登録済みです。';
  }
  return String(error?.message || 'ログインに失敗しました。時間をおいてお試しください。');
}


/**
 * Apple でサインイン（App Store Review Guideline 4.8）。
 * Google などの外部ログインを提供するアプリは、同等の選択肢として
 * 「Sign in with Apple」も出す必要がある。
 * ★Firebase コンソールで Apple プロバイダを有効化すること★（docs/APP_STORE.md）
 */
export function appleProvider(): OAuthProvider {
  const p = new OAuthProvider('apple.com');
  p.addScope('email');
  p.addScope('name');
  p.setCustomParameters({ locale: 'ja' });
  return p;
}

function providerFor(method: SignInMethod): AuthProvider {
  return method === 'apple' ? appleProvider() : provider;
}

/**
 * 指定した方法で連携する。
 * Web は webSignInCore.runWebSignIn（必ず終わる：成功／失敗／キャンセル／時間切れ／redirect 開始）。
 * アプリ版は nativeSignIn。
 */
export async function signInWith(method: SignInMethod): Promise<GoogleSignInOutcome> {
  let outcome: GoogleSignInOutcome;
  try {
    outcome = await signInWithInner(method);
  } catch (unexpected) {
    // 想定外の例外でも、呼び出し側のボタンが「連携中…」のまま残らないよう必ず結果として返す
    outcome = { ok: false, message: describeAuthError(unexpected), errorCode: 'login_unexpected' };
  }
  try {
    // 使われ方の記録：ログインの成否と失敗の種類（キャンセル・処理中は数えない）
    if (outcome.ok) trackEvent(`login_ok_${method}`);
    else if (!outcome.redirecting && !outcome.cancelled && outcome.errorCode !== 'login_busy') trackError(outcome.errorCode || `login_${method}_failed`);
  } catch {
    // 記録の失敗でログイン結果を失わない（意図して捨てている）
  }
  return outcome;
}

async function signInWithInner(method: SignInMethod): Promise<GoogleSignInOutcome> {
  // アプリ（Capacitor ネイティブ環境）のときは端末のログイン画面を使用する
  if (isNativeApp()) {
    return nativeSignIn(method);
  }

  if (!FIREBASE_CONFIGURED && !USE_EMULATORS) return { ok: false, message: 'オンライン機能は初期設定が必要です。運営者はREADMEに従って専用Firebaseを設定してください。' };
  const label = method === 'apple' ? 'Apple' : 'Google';
  if (isInAppBrowser()) {
    return {
      ok: false,
      message:
        `LINE や Instagram などのアプリ内ブラウザでは ${label} ログインが利用できません。右上のメニューから「ブラウザで開く」を選び、Safari や Chrome で開き直してください。`,
    };
  }
  // ★resolver は firebase.ts の initializeAuth（Web のみ）でも入れているが、念のため毎回も渡す（2026-10-21 の auth/argument-error 対策）★
  // アプリ版はこの関数の先頭で nativeSignIn に分かれるので、ここは通らない（アプリへの影響なし）。
  const result = await runWebSignIn<AuthProvider, User>({
    method,
    provider: providerFor(method),
    signInWithPopup: (p) => signInWithPopup(auth, p, browserPopupRedirectResolver),
    signInWithRedirect: (p) => signInWithRedirect(auth, p, browserPopupRedirectResolver),
    authStateReady: () => auth.authStateReady(),
    currentUid: () => auth.currentUser?.uid ?? null,
    onAuthStateChanged: (cb) => onAuthStateChanged(auth, cb),
    allowRedirectFallback: AUTH_SAME_ORIGIN_ACTIVE,
    describeError: describeAuthError,
  });
  return result.ok ? { ok: true, user: result.user } : result;
}

/** Google アカウントで連携する（既存の呼び出し口） */
export function signInWithGoogle(): Promise<GoogleSignInOutcome> {
  return signInWith('google');
}

/** Apple でサインインする */
export function signInWithApple(): Promise<GoogleSignInOutcome> {
  return signInWith('apple');
}

/**
 * リダイレクト方式で戻ってきたときの結果を受け取る。
 * アプリ起動時に一度だけ呼べばよい（結果が無ければ null）。
 */
export async function consumeGoogleRedirectResult(): Promise<User | null> {
  if (!FIREBASE_CONFIGURED && !USE_EMULATORS) return null;
  // アプリ版はリダイレクトを使わない（WebView で Google の画面を読み込ませない）
  if (isNativeApp()) return null;
  try {
    const result = await getRedirectResult(auth, browserPopupRedirectResolver);
    return result?.user ?? null;
  } catch (error) {
    // 結果が無い／期限切れは正常系として null。ただし原因が追えるよう、エラーの種類だけは記録する（値・個人情報は残さない）
    const code = String(asErrorLike(error)?.code || '');
    try { trackError(shortCode(code, 'login_redirect_result')); } catch { /* 記録できなくても続ける */ }
    return null;
  }
}

/** ログアウト（プロフィールのローカルキャッシュも掃除する） */
export async function signOutGoogle(): Promise<void> {
  if (isNativeApp()) {
    nativeSignOut().catch(logRejection('auth.nativeSignOut'));
  }
  const uid = auth.currentUser?.uid;
  await signOut(auth);
  if (uid) {
    try {
      requireLocalStorage().removeItem(profileKey(uid));
    } catch {
      /* localStorage が使えない環境は何もしない */
    }
  }
}

/** アカウントを切り替える（ログアウト → 連携し直す） */
export async function switchGoogleAccount(): Promise<GoogleSignInOutcome> {
  try {
    await signOutGoogle();
  } catch (error) {
    // ログアウトに失敗しても、ボタンが「切り替え中…」で残らないよう結果として返す
    return { ok: false, message: describeAuthError(error), errorCode: 'logout_failed' };
  }
  return signInWithGoogle();
}

/**
 * 連携すると得られること（アプリ全体で同じ文言を使うための一覧）。
 * ゲスト利用は端末の localStorage しか使わないため、
 * 「消えてしまうもの」を具体的に伝えることが連携の一番の動機になる。
 *
 * ★1行目を「オンライン対戦ができる」にした理由★
 *   利用者の指示「オンラインをメインにするUIにしていかんとだめよね？」
 *   を受けて導線を見直したとき、ここが一番おかしかった。
 *
 *   ・対戦は Firestore のルール上、uid を持たないゲストでは
 *     ★どうやっても部屋に入れない★（src/battle/ui/BattleHome.tsx）
 *   ・つまり対戦は「連携すると便利」ではなく
 *     ★連携しないと存在しない機能★である
 *   なのにこの一覧は「記録が引き継がれる」「ランキング・フレンド」
 *   しか言っていなかった。アプリの主機能が、連携する理由として
 *   1行も挙がっていなかったことになる。
 *
 *   順番も入れ替えた。1行目は必ず読まれるが3行目は読み飛ばされる。
 *   「できないことが無くなる」＞「便利になる」の順に並べる。
 */
export const GOOGLE_LINK_BENEFITS: string[] = [
  'オンライン対戦ができる（友だちと1対1・全国とレート戦）',
  '学習記録・連続日数が端末を変えても引き継がれる',
  'ランキング・フレンド機能が使えるようになる',
  '復習リストと間違えた問題がクラウドに保存される',
];
