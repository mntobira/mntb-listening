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
 * ■ popup → redirect のフォールバック
 *   iOS Safari のプライベートブラウズや、サードパーティ Cookie を
 *   制限している環境では signInWithPopup が
 *   `auth/popup-blocked` 等で失敗する。その場合は同じタブで遷移する
 *   signInWithRedirect に切り替えると成功することが多いため、
 *   自動で切り替える（ユーザーに何度も押させない）。
 */

import {
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  type AuthProvider,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { auth, provider, FIREBASE_CONFIGURED, USE_EMULATORS } from '../firebase';
// ユーザーごとの localStorage キー名は utils/userStorageKeys.ts が唯一の定義
import { profileKey } from './userStorageKeys';

/** サインイン結果 */
export interface GoogleSignInOutcome {
  /** 連携できたか */
  ok: boolean;
  /** 連携できたユーザー（redirect に切り替えた場合は undefined のままページが遷移する） */
  user?: User;
  /** ページ遷移（リダイレクト）を開始したので、この後の処理は不要 */
  redirecting?: boolean;
  /** 失敗理由（利用者向けの日本語） */
  message?: string;
}

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

/** 「popup が使えない環境」に該当するエラーコードか */
function isPopupUnavailable(code: string): boolean {
  return (
    code.includes('popup-blocked') ||
    code.includes('popup-closed-by-user') ||
    code.includes('cancelled-popup-request') ||
    code.includes('operation-not-supported-in-this-environment') ||
    code.includes('web-storage-unsupported')
  );
}

/** Firebase のエラーを、原因と次の行動が分かる日本語にする */
export function describeAuthError(error: any): string {
  const code = String(error?.code || '');
  if (code.includes('network-request-failed')) {
    return 'ネットワークに接続できませんでした。通信状況をご確認ください。';
  }
  if (code.includes('unauthorized-domain')) {
    return 'このドメインは連携が許可されていません（運営側の設定不備です）。';
  }
  if (isPopupUnavailable(code)) {
    return 'ブラウザがログイン画面の表示をブロックしました。ポップアップを許可するか、標準ブラウザ（Safari / Chrome）で開き直してください。';
  }
  if (code.includes('account-exists-with-different-credential')) {
    return 'このメールアドレスは別の方法で登録済みです。';
  }
  return String(error?.message || 'ログインに失敗しました。時間をおいてお試しください。');
}

/** ログイン方法（2026-10-02：App Store 申請に向けて Apple を戻した） */
export type SignInMethod = 'google' | 'apple';

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
 * popup が使えない環境では自動で redirect に切り替える。
 */
export async function signInWith(method: SignInMethod): Promise<GoogleSignInOutcome> {
  if (!FIREBASE_CONFIGURED && !USE_EMULATORS) return { ok: false, message: 'オンライン機能は初期設定が必要です。運営者はREADMEに従って専用Firebaseを設定してください。ゲストで演習・AI対戦を試せます。' };
  const label = method === 'apple' ? 'Apple' : 'Google';
  if (isInAppBrowser()) {
    return {
      ok: false,
      message:
        `LINE や Instagram などのアプリ内ブラウザでは ${label} ログインが利用できません。右上のメニューから「ブラウザで開く」を選び、Safari や Chrome で開き直してください。`,
    };
  }
  const p = providerFor(method);
  try {
    const credential: UserCredential = await signInWithPopup(auth, p);
    return { ok: true, user: credential.user };
  } catch (error: any) {
    const code = String(error?.code || '');
    if (isPopupUnavailable(code)) {
      // 同じタブでログイン画面へ遷移する。戻ってきたときは
      // consumeGoogleRedirectResult() が結果を受け取る。
      try {
        await signInWithRedirect(auth, p);
        return { ok: false, redirecting: true };
      } catch (redirectError: any) {
        return { ok: false, message: describeAuthError(redirectError) };
      }
    }
    if (code.includes('operation-not-allowed')) {
      return { ok: false, message: method === 'apple' ? 'Apple でのログインは現在準備中です。Google でログインしてください。' : `${label} でのログインは現在準備中です。時間をおいてお試しください。` };
    }
    return { ok: false, message: describeAuthError(error) };
  }
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
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch {
    // リダイレクト結果が無い／期限切れは正常系として扱う
    return null;
  }
}

/** ログアウト（プロフィールのローカルキャッシュも掃除する） */
export async function signOutGoogle(): Promise<void> {
  const uid = auth.currentUser?.uid;
  await signOut(auth);
  if (uid) {
    try {
      localStorage.removeItem(profileKey(uid));
    } catch {
      /* localStorage が使えない環境は何もしない */
    }
  }
}

/** アカウントを切り替える（ログアウト → 連携し直す） */
export async function switchGoogleAccount(): Promise<GoogleSignInOutcome> {
  await signOutGoogle();
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
