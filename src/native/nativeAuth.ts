import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth } from '../firebase';
import type { GoogleSignInOutcome, SignInMethod } from '../utils/authTypes';
import { describeNativeAuthError } from './nativeAuthError';

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
  } catch (rawError) {
    const info = describeNativeAuthError(rawError, label);
    if (info.kind !== 'cancelled') {
      // 開発者が端末ログ（adb logcat / Xcode）で原因を追えるよう、生のエラーも残す
      console.warn(`[nativeSignIn] ${info.code}`, rawError);
    }
    return { ok: false, message: info.message, errorCode: info.code };
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
