import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getSignInInFlight, subscribeSignInInFlight } from '../utils/webSignInCore';
import type { GoogleSignInOutcome } from '../utils/authTypes';

/**
 * ログインボタンの「連携中…」を必ず元に戻すための共通フック（2026-10-23）。
 *
 *   ・run(fn) は try/finally で busy を必ず false に戻す（想定外の例外でも）
 *   ・redirect に切り替えたときだけ busy のまま（ページが移動するため）。
 *     ただしブラウザの「戻る」でページがそのまま復元された（pageshow の persisted）ときは元に戻す
 *   ・anyBusy：Google / Apple どちらかのログインが進行中か（アプリ全体。もう片方のボタンも押せなくする）
 */
export function useSignInGuard() {
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  const inFlight = useSyncExternalStore(subscribeSignInInFlight, getSignInInFlight, () => null);

  useEffect(() => {
    alive.current = true;
    // bfcache（戻る／進む）で復元されたら、redirect 待ちの「連携中…」を解除する
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted && alive.current) setBusy(false); };
    window.addEventListener('pageshow', onPageShow);
    return () => { alive.current = false; window.removeEventListener('pageshow', onPageShow); };
  }, []);

  const run = useCallback(async (fn: () => Promise<GoogleSignInOutcome>): Promise<GoogleSignInOutcome> => {
    setBusy(true);
    let outcome: GoogleSignInOutcome | undefined;
    try {
      outcome = await fn();
      return outcome;
    } catch (error) {
      outcome = { ok: false, message: String((error as { message?: unknown })?.message || 'ログインに失敗しました。'), errorCode: 'login_unexpected' };
      return outcome;
    } finally {
      // redirect 中だけは「連携中…」のまま（ページが移動する）
      if (alive.current && !outcome?.redirecting) setBusy(false);
    }
  }, []);

  return { busy, anyBusy: busy || inFlight !== null, run };
}
