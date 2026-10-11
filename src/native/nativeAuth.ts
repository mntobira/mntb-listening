import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth } from '../firebase';
import type { GoogleSignInOutcome, SignInMethod } from '../utils/googleAuth';

/**
 * アプリ版（Capacitor）用のログイン処理。
 * Google は WebView 内での直接認証をブロックするため、
 * 端末ネイティブの認証シート（Google Sign-In / Sign in with Apple）を開いて認証し、
 * 得られた資格情報で Web 版と同じ Firebase にログインする。
 */
export async function nativeSignIn(method: SignInMethod): Promise<GoogleSignInOutcome> {
  const label = method === 'apple' ? 'Apple' : 'Google';

  try {
    let idToken: string | undefined;
    let rawNonce: string | undefined;

    if (method === 'google') {
      const res = await FirebaseAuthentication.signInWithGoogle();
      idToken = res.credential?.idToken;
    } else if (method === 'apple') {
      const res = await FirebaseAuthentication.signInWithApple();
      idToken = res.credential?.idToken;
      rawNonce = res.credential?.nonce;
    }

    if (!idToken) {
      return { ok: false, message: `${label} ログインの認証情報を取得できませんでした。` };
    }

    // Web 版と同じ Firebase Auth インスタンスにログイン（uid・データ連携が同一になる）
    const credential =
      method === 'google'
        ? GoogleAuthProvider.credential(idToken)
        : new OAuthProvider('apple.com').credential({ idToken, rawNonce });

    const userCred = await signInWithCredential(auth, credential);
    return { ok: true, user: userCred.user };
  } catch (error: any) {
    const code = String(error?.code || error?.message || '');

    // ユーザーによるキャンセル
    if (code.includes('canceled') || code.includes('cancelled') || code.includes('12501')) {
      return { ok: false, message: `${label} ログインがキャンセルされました。` };
    }

    // プラグイン未実装・未設定（GoogleService-Info.plist等がない場合）
    if (code.includes('not implemented') || code.includes('UNAVAILABLE') || code.includes('configuration')) {
      return {
        ok: false,
        message: `端末のログイン設定（GoogleService-Info.plist / google-services.json）が未構成です。詳細は APP_CAPACITOR_README.md を確認してください。`,
      };
    }

    return { ok: false, message: `${label} ログインに失敗しました: ${error?.message || error}` };
  }
}

/**
 * アプリ版のサインアウト
 */
export async function nativeSignOut(): Promise<void> {
  try {
    await FirebaseAuthentication.signOut();
  } catch {
    // 失敗しても何もしない
  }
}
