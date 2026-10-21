import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { profileKey } from '../utils/userStorageKeys';
import { safeGetItem } from '../utils/safeLocalStorage';
import type { AppState } from '../appState';
import { isScreenshotLaunch } from './useAppPersistence';

/**
 * ログイン状態が変わったときの画面の振り分け（C-01: App.tsx から分離。中身は同じ）。
 *
 *   ・未ログイン（「この端末だけで続ける」でもない） → ログイン画面へ（2026-10-19 ログイン必須化。起動直後も。画面検証の起動だけは除く）
 *   ・ログインした → ゲストを解除。この端末にプロフィールが無ければ初回案内、
 *     あれば（起動直後でなければ）ホームへ
 *   ・起動直後の1回目は、復元した画面をそのまま使う（勝手にホームへ飛ばさない）
 */
export function useAuthRouting({ isGuest, setIsGuest, setAppState }: {
  isGuest: boolean;
  setIsGuest: (v: boolean) => void;
  setAppState: (s: AppState) => void;
}): void {
  const isFirstLoad = useRef(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const wasFirstLoad = isFirstLoad.current;
      isFirstLoad.current = false;

      if (!user) {
        // ログイン必須（2026-10-19）。起動時に未ログインならログイン画面へ。
        // 例外：ログインできずに「この端末だけで続ける」を選んだ人・スクリーンショット撮影
        if (!isGuest && !(wasFirstLoad && isScreenshotLaunch())) {
          setAppState('onboarding');
        }
      } else {
        setIsGuest(false);
        try {
          // Firestoreの代わりにlocalStorageを使用
          const localProfile = safeGetItem(profileKey(user.uid));
          if (!localProfile) {
            setAppState('onboarding');
          } else if (!wasFirstLoad) {
            setAppState('home');
          }
        } catch (error) {
          console.error("Error in onAuthStateChanged:", error);
          setAppState('onboarding');
        }
      }
    });
    return unsubscribe;
    // setter は React が同じ参照を保証するので、従来どおり isGuest だけで張り直す
  }, [isGuest]);
}
