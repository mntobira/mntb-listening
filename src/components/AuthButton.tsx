/**
 * Google アカウント連携ボタン（ログイン済みなら何も出さない）
 *
 * ログイン処理そのものは utils/googleAuth.ts に一本化している。
 * （popup が塞がれている環境では自動で redirect 方式に切り替わる）
 */

import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import { Loader2 } from 'lucide-react';
import { signInWithGoogle, consumeGoogleRedirectResult, isInAppBrowser } from '../utils/googleAuth';
import { GoogleMark } from './GoogleLinkBanner';

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 認証状態の監視
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      try {
        if (currentUser) localStorage.setItem('user_uid', currentUser.uid);
        else localStorage.removeItem('user_uid');
      } catch {
        /* localStorage が使えない環境は何もしない */
      }
    });

    // リダイレクト方式で戻ってきた場合の結果を受け取る
    void consumeGoogleRedirectResult();

    return () => unsubscribe();
  }, []);

  const handleLogin = useCallback(async () => {
    setSigning(true);
    setError(null);
    const outcome = await signInWithGoogle();
    if (outcome.redirecting) return; // ページ遷移するのでそのまま待つ
    setSigning(false);
    if (!outcome.ok) setError(outcome.message || 'ログインに失敗しました。');
  }, []);

  if (user) return null;

  if (isInAppBrowser()) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800 shadow-sm font-handwriting">
        LINE や Instagram などのアプリ内ブラウザでは Google ログインが利用できません。<br />
        右上のメニューから「ブラウザで開く」を選び、Safari や Chrome で開き直してください。
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        onClick={handleLogin}
        disabled={signing}
        className="flex items-center gap-2 rounded-full border border-[#DADCE0] bg-white px-4 py-2 font-handwriting font-bold text-[#3C4043] shadow-sm transition-all hover:bg-[#F8F9FA] disabled:opacity-50"
      >
        {signing ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <GoogleMark size={18} />}
        {signing ? '連携中…' : 'Google アカウントで連携'}
      </button>
      {error && (
        <p className="max-w-xs text-[11px] font-bold leading-snug text-rose-600" role="alert">{error}</p>
      )}
    </div>
  );
}
