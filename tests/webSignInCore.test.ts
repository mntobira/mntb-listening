/**
 * Web 版ログインが「連携中…」のまま止まらないことの振る舞いテスト（2026-10-23）。
 * webSignInCore.runWebSignIn は Firebase を直接 import しないので、偽の呼び出し口で
 * 成功・失敗・無応答・キャンセル・競合・同じ uid・復元の取り違え を本物の分岐のまま確かめる。
 *
 * 背景（PR の説明と docs/WEB_LOGIN_SAME_ORIGIN.md）：
 *   ・旧実装はキャンセル系のエラーで signInWithRedirect に切り替え、その「終わらない Promise」を待って固まった
 *   ・Google と Apple を続けて押すと前の操作が cancelled-popup-request になり、同じ経路に入った
 *   ・見張りが前回ログインの「復元」を今回の成功と取り違えた
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  runWebSignIn,
  getSignInInFlight,
  subscribeSignInInFlight,
  __resetSignInStateForTest,
  MSG_BUSY,
  MSG_CANCELLED,
  MSG_POPUP_BLOCKED,
  POPUP_WATCHDOG_MS,
  REDIRECT_START_GRACE_MS,
  type WebSignInDeps,
} from '../src/utils/webSignInCore';

type U = { uid: string };

function authErr(code: string) {
  return Object.assign(new Error(code), { code });
}

/** 偽の Firebase。onAuthStateChanged の通知を手で出せる */
function fakeAuth(initialUid: string | null = null) {
  let uid = initialUid;
  const subs = new Set<(u: U | null) => void>();
  return {
    currentUid: () => uid,
    onAuthStateChanged: (cb: (u: U | null) => void) => {
      subs.add(cb);
      // Firebase と同じく、登録直後に今の状態を1回通知する
      queueMicrotask(() => { if (subs.has(cb)) cb(uid ? { uid } : null); });
      return () => { subs.delete(cb); };
    },
    emit(next: string | null) {
      uid = next;
      subs.forEach((cb) => cb(next ? { uid: next } : null));
    },
    subscriberCount: () => subs.size,
  };
}

function deps(over: Partial<WebSignInDeps<string, U>> = {}, fa = fakeAuth()): WebSignInDeps<string, U> {
  return {
    method: 'google',
    provider: 'google-provider',
    signInWithPopup: () => new Promise(() => {}),
    signInWithRedirect: () => new Promise(() => {}),
    authStateReady: () => Promise.resolve(),
    currentUid: fa.currentUid,
    onAuthStateChanged: fa.onAuthStateChanged,
    allowRedirectFallback: false,
    describeError: (e) => `ERR:${(e as { code?: string })?.code ?? 'unknown'}`,
    ...over,
  };
}

beforeEach(() => {
  __resetSignInStateForTest();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('成功', () => {
  it('ポップアップ成功 → ok とユーザー、処理中フラグは解除', async () => {
    const r = await runWebSignIn(deps({ signInWithPopup: async () => ({ user: { uid: 'A' } }) }));
    expect(r).toEqual({ ok: true, user: { uid: 'A' } });
    expect(getSignInInFlight()).toBeNull();
  });

  it('ポップアップの結果が届かなくても、裏で別の uid にログインできたら成功（見張り）', async () => {
    const fa = fakeAuth(null);
    const p = runWebSignIn(deps({}, fa));
    await vi.advanceTimersByTimeAsync(10);
    fa.emit('B');
    await expect(p).resolves.toEqual({ ok: true, user: { uid: 'B' } });
    expect(fa.subscriberCount()).toBe(0); // 見張りは必ず解除
  });
});

describe('必ず終わる（連携中…で止まらない）', () => {
  it('無応答 → 90秒で timeout を返し、見張りもタイマーも片づく', async () => {
    const fa = fakeAuth(null);
    const p = runWebSignIn(deps({}, fa));
    await vi.advanceTimersByTimeAsync(POPUP_WATCHDOG_MS - 1);
    expect(getSignInInFlight()).toBe('google');
    await vi.advanceTimersByTimeAsync(2);
    const r = await p;
    expect(r.ok).toBe(false);
    expect(r).toMatchObject({ errorCode: 'login_popup_timeout' });
    expect(getSignInInFlight()).toBeNull();
    expect(fa.subscriberCount()).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('通常の失敗（network など）→ 失敗として返す', async () => {
    const r = await runWebSignIn(deps({ signInWithPopup: () => Promise.reject(authErr('auth/network-request-failed')) }));
    expect(r).toMatchObject({ ok: false, message: 'ERR:auth/network-request-failed', errorCode: 'auth_network-request-failed' });
    expect(getSignInInFlight()).toBeNull();
  });

  it('signInWithPopup が同期的に throw しても、処理中フラグは解除', async () => {
    const r = await runWebSignIn(deps({ signInWithPopup: () => { throw authErr('auth/argument-error'); } }));
    expect(r.ok).toBe(false);
    expect(getSignInInFlight()).toBeNull();
  });

  it('authStateReady が失敗しても続行する', async () => {
    const r = await runWebSignIn(deps({
      authStateReady: () => Promise.reject(new Error('x')),
      signInWithPopup: async () => ({ user: { uid: 'A' } }),
    }));
    expect(r.ok).toBe(true);
  });
});

describe('キャンセルは redirect にしない（旧実装の固まる入口）', () => {
  for (const code of ['auth/popup-closed-by-user', 'auth/cancelled-popup-request']) {
    it(`${code} → cancelled、signInWithRedirect は呼ばない`, async () => {
      const redirect = vi.fn(() => new Promise(() => {}));
      const r = await runWebSignIn(deps({
        signInWithPopup: () => Promise.reject(authErr(code)),
        signInWithRedirect: redirect,
        allowRedirectFallback: true,
      }));
      expect(r).toMatchObject({ ok: false, cancelled: true, message: MSG_CANCELLED });
      expect(redirect).not.toHaveBeenCalled();
      expect(getSignInInFlight()).toBeNull();
    });
  }
});

describe('ポップアップが使えない環境', () => {
  it('同じドメインでないとき（firebaseapp.com）は redirect せず案内を返す', async () => {
    const redirect = vi.fn(() => new Promise(() => {}));
    const r = await runWebSignIn(deps({
      signInWithPopup: () => Promise.reject(authErr('auth/popup-blocked')),
      signInWithRedirect: redirect,
      allowRedirectFallback: false,
    }));
    expect(r).toMatchObject({ ok: false, message: MSG_POPUP_BLOCKED });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('同じドメインのときは redirect。終わらない Promise を待たず、猶予後に redirecting を返す', async () => {
    const p = runWebSignIn(deps({
      signInWithPopup: () => Promise.reject(authErr('auth/popup-blocked')),
      signInWithRedirect: () => new Promise(() => {}), // Firebase の本物と同じく成功時は終わらない
      allowRedirectFallback: true,
    }));
    await vi.advanceTimersByTimeAsync(REDIRECT_START_GRACE_MS + 1);
    await expect(p).resolves.toEqual({ ok: false, redirecting: true });
    expect(getSignInInFlight()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('redirect の開始自体が失敗したら、失敗として返す', async () => {
    const r = await runWebSignIn(deps({
      signInWithPopup: () => Promise.reject(authErr('auth/popup-blocked')),
      signInWithRedirect: () => Promise.reject(authErr('auth/unauthorized-domain')),
      allowRedirectFallback: true,
    }));
    expect(r).toMatchObject({ ok: false, message: 'ERR:auth/unauthorized-domain' });
  });
});

describe('Google と Apple の同時操作', () => {
  it('処理中に2つ目を押しても、前の操作を中断せず「処理中」を即返す', async () => {
    const popupA = vi.fn(() => new Promise<{ user: U }>(() => {}));
    const first = runWebSignIn(deps({ signInWithPopup: popupA }));
    await vi.advanceTimersByTimeAsync(1);
    const popupB = vi.fn(async () => ({ user: { uid: 'X' } }));
    const second = await runWebSignIn(deps({ method: 'apple', signInWithPopup: popupB }));
    expect(second).toMatchObject({ ok: false, errorCode: 'login_busy', message: MSG_BUSY });
    expect(popupB).not.toHaveBeenCalled();
    expect(getSignInInFlight()).toBe('google');
    await vi.advanceTimersByTimeAsync(POPUP_WATCHDOG_MS + 1);
    await first;
    expect(getSignInInFlight()).toBeNull();
  });

  it('処理中の変化はボタン側へ通知される', async () => {
    const seen: (string | null)[] = [];
    subscribeSignInInFlight(() => seen.push(getSignInInFlight()));
    await runWebSignIn(deps({ method: 'apple', signInWithPopup: async () => ({ user: { uid: 'A' } }) }));
    expect(seen).toEqual(['apple', null]);
  });
});

describe('見張りの取り違えを防ぐ', () => {
  it('復元（authStateReady 中に A が戻る）を、今回の Apple 成功と取り違えない', async () => {
    const fa = fakeAuth(null);
    let ready!: () => void;
    const p = runWebSignIn(deps({
      method: 'apple',
      authStateReady: () => new Promise<void>((r) => { ready = r; }),
    }, fa));
    await vi.advanceTimersByTimeAsync(1);
    fa.emit('A'); // 前回のログインが復元された
    ready();
    await vi.advanceTimersByTimeAsync(POPUP_WATCHDOG_MS + 1);
    const r = await p;
    expect(r).toMatchObject({ ok: false, errorCode: 'login_popup_timeout' });
  });

  it('同じ uid のまま（登録直後の通知）では成功扱いしない／ポップアップの結果は通す', async () => {
    const fa = fakeAuth('A');
    let resolvePopup!: (v: { user: U }) => void;
    const p = runWebSignIn(deps({ signInWithPopup: () => new Promise((r) => { resolvePopup = r; }) }, fa));
    await vi.advanceTimersByTimeAsync(5); // 登録直後の通知（A）が来ても終わらない
    expect(getSignInInFlight()).toBe('google');
    resolvePopup({ user: { uid: 'A' } });
    await expect(p).resolves.toEqual({ ok: true, user: { uid: 'A' } });
  });

  it('時間切れの後でポップアップが遅れて失敗しても、未処理の reject を出さない', async () => {
    let rejectPopup!: (e: unknown) => void;
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    const p = runWebSignIn(deps({ signInWithPopup: () => new Promise((_, j) => { rejectPopup = j; }) }));
    await vi.advanceTimersByTimeAsync(POPUP_WATCHDOG_MS + 1);
    await p;
    rejectPopup(authErr('auth/popup-closed-by-user'));
    await vi.advanceTimersByTimeAsync(1);
    process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
});
