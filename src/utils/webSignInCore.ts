/**
 * ===================================================================
 * Web 版ログイン（popup / redirect）の「止まらない」中心部分（2026-10-23）
 * ===================================================================
 *
 * Firebase を直接 import しない（呼び出し口を引数でもらう）ので、
 * tests/webSignInCore.test.ts で Promise の全経路（成功・失敗・無応答・キャンセル・競合）を
 * 本物の分岐のまま確かめられる。
 *
 * ■ 2026-10-22 版で「連携中…」のまま止まり得た経路と、ここでの直し方
 *   1. ポップアップを閉じた／別のポップアップで中断された（popup-closed-by-user / cancelled-popup-request）
 *      → 旧：自動で signInWithRedirect へ。redirect は成功しても「決して終わらない Promise」を返すので、
 *        遷移しきれない・ブラウザの「戻る」で戻ると「連携中…」で固まる
 *      → 新：キャンセルとして即座に返す（redirect にしない）
 *   2. ポップアップが使えない環境（popup-blocked など）
 *      → 新：redirect は「同じドメインでログインしているときだけ」。開始の失敗だけを短時間待ち、
 *        終わらない Promise は待たない（redirecting を返す）
 *   3. Google と Apple を続けて押す → 前の操作が cancelled-popup-request で 1. へ
 *      → 新：アプリ全体で同時に1つだけ（2つ目は「処理中」として即返す）
 *   4. 見張り（onAuthStateChanged）が、前回のログインの「復元」を今回の成功と取り違える
 *      → 新：見張りを張る前に authStateReady() で復元を待ち、それから「前の uid」を記録する
 *   5. 時間切れの後に、元のポップアップが遅れて成功／失敗する
 *      → 新：時間切れ後の結果は画面に返さない（未処理の reject も出さない）。ログインできていれば
 *        useAuthRouting の onAuthStateChanged が拾って画面を進める
 */
import type { GoogleSignInOutcome, SignInMethod } from './authTypes';

/** ポップアップの結果を待つ最長時間（パスワード入力・2段階認証の時間を見て長めに） */
export const POPUP_WATCHDOG_MS = 90_000;
/** signInWithRedirect の「開始に失敗したか」だけを待つ時間（成功時は終わらない Promise なので待ち切らない） */
export const REDIRECT_START_GRACE_MS = 4_000;

export const MSG_CANCELLED = 'ログインをキャンセルしました。もう一度ボタンを押すとやり直せます。';
export const MSG_BUSY = 'ほかのログイン処理の途中です。開いているログイン画面を閉じてから、もう一度お試しください。';
export const MSG_TIMEOUT =
  'ログインの結果を受け取れませんでした。ページを再読み込みしてから、もう一度お試しください。';
export const MSG_POPUP_BLOCKED =
  'ブラウザがログイン画面（ポップアップ）をブロックしました。アドレスバーの右側などからポップアップを許可して、もう一度お試しください。';

/** 認証の呼び出し口（本番は googleAuth.ts が Firebase の関数を渡す。テストは偽物を渡す） */
export interface WebSignInDeps<P, U extends { uid: string }> {
  method: SignInMethod;
  provider: P;
  signInWithPopup: (p: P) => Promise<{ user: U }>;
  signInWithRedirect: (p: P) => Promise<unknown>;
  /** 保存済みログインの復元が終わるのを待つ（auth.authStateReady） */
  authStateReady: () => Promise<void>;
  currentUid: () => string | null;
  /** onAuthStateChanged。戻り値は解除関数 */
  onAuthStateChanged: (cb: (u: U | null) => void) => () => void;
  /** ポップアップが使えないとき、redirect に切り替えてよいか（同じドメインでログインしているときだけ true） */
  allowRedirectFallback: boolean;
  describeError: (e: unknown) => string;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (id: unknown) => void;
  watchdogMs?: number;
  redirectGraceMs?: number;
}

export type WebSignInResult<U> =
  | { ok: true; user: U }
  | (Omit<GoogleSignInOutcome, 'user' | 'ok'> & { ok: false });

function errorCode(e: unknown): string {
  if (e && typeof e === 'object' && 'code' in e) return String((e as { code: unknown }).code || '');
  return '';
}

/** ユーザーが閉じた／別の操作で中断された（＝キャンセル。redirect にしない） */
export function isUserCancel(code: string): boolean {
  return code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request') || code.includes('user-cancelled');
}

/** ポップアップそのものが使えない環境（ここだけ redirect の候補） */
export function isPopupUnsupported(code: string): boolean {
  return (
    code.includes('popup-blocked') ||
    code.includes('operation-not-supported-in-this-environment') ||
    code.includes('web-storage-unsupported')
  );
}

/** 解析用の短いコード（auth/popup-blocked → auth_popup-blocked）。値・個人情報は入れない */
export function shortCode(code: string, fallback: string): string {
  const c = code.replace(/[^a-z0-9_:\-]/gi, '_').slice(0, 40);
  return c || fallback;
}

// ---------------------------------------------------------------
// アプリ全体で「ログイン処理は同時に1つだけ」
// ---------------------------------------------------------------
let inFlight: SignInMethod | null = null;
const listeners = new Set<() => void>();
function setInFlight(v: SignInMethod | null) {
  inFlight = v;
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      // 表示の更新に失敗しても、ログイン処理そのものは止めない（意図して捨てている）
    }
  });
}
/** いま処理中のログイン（無ければ null）。ボタンの無効化に使う */
export function getSignInInFlight(): SignInMethod | null {
  return inFlight;
}
/** 処理中かどうかの変化を受け取る（React は useSyncExternalStore で使う） */
export function subscribeSignInInFlight(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
/** テスト用：状態を初期化する */
export function __resetSignInStateForTest(): void {
  inFlight = null;
  listeners.clear();
}

/**
 * ポップアップでログインする。必ず「終わる」：
 *   成功 / 失敗 / キャンセル / 時間切れ / redirect 開始 のどれかを返し、決して永久に待たない。
 */
export async function runWebSignIn<P, U extends { uid: string }>(deps: WebSignInDeps<P, U>): Promise<WebSignInResult<U>> {
  if (inFlight) {
    return { ok: false, message: MSG_BUSY, errorCode: 'login_busy' };
  }
  setInFlight(deps.method);
  const setT = deps.setTimer ?? ((fn: () => void, ms: number) => setTimeout(fn, ms));
  const clearT = deps.clearTimer ?? ((id: unknown) => clearTimeout(id as ReturnType<typeof setTimeout>));
  try {
    // 4. 保存済みログインの復元を待ってから「前の uid」を記録する（復元を今回の成功と取り違えない）
    try {
      await deps.authStateReady();
    } catch {
      // 復元の待機に失敗しても、ログイン自体は続ける（見張りの精度が下がるだけ。意図して捨てている）
    }
    const before = deps.currentUid();

    let stop = () => {};
    const watcher = new Promise<{ user: U } | 'timeout'>((resolve) => {
      let unsub: () => void = () => {};
      try {
        unsub = deps.onAuthStateChanged((u) => {
          // 「別の uid でログインした」ときだけ救済（同じ uid は signInWithPopup の結果を待つ）
          if (u && u.uid !== before) resolve({ user: u });
        });
      } catch {
        // 見張りが張れなくても、時間切れの保険は残る（意図して捨てている）
      }
      const t = setT(() => resolve('timeout'), deps.watchdogMs ?? POPUP_WATCHDOG_MS);
      stop = () => {
        try {
          unsub();
        } finally {
          clearT(t);
        }
      };
    });

    let raced: { user: U } | 'timeout';
    const popup = deps.signInWithPopup(deps.provider);
    // 5. 時間切れの後に遅れて終わった結果は画面に返さない。未処理の reject も出さない
    popup.catch(() => undefined);
    try {
      raced = await Promise.race([popup, watcher]);
    } catch (error) {
      return await handlePopupError(deps, error, setT, clearT);
    } finally {
      stop();
    }
    if (raced === 'timeout') {
      return { ok: false, message: MSG_TIMEOUT, errorCode: 'login_popup_timeout' };
    }
    return { ok: true, user: raced.user };
  } catch (unexpected) {
    // ここに来るのは想定外（プロバイダの準備など）。画面は必ず元に戻す
    return { ok: false, message: deps.describeError(unexpected), errorCode: shortCode(errorCode(unexpected), 'login_unexpected') };
  } finally {
    setInFlight(null);
  }
}

async function handlePopupError<P, U extends { uid: string }>(
  deps: WebSignInDeps<P, U>,
  error: unknown,
  setT: (fn: () => void, ms: number) => unknown,
  clearT: (id: unknown) => void,
): Promise<WebSignInResult<U>> {
  const code = errorCode(error);
  // 1. キャンセルは redirect にしない（旧実装の「連携中…で固まる」入口）
  if (isUserCancel(code)) {
    return { ok: false, message: MSG_CANCELLED, errorCode: 'login_cancelled', cancelled: true };
  }
  if (code.includes('operation-not-allowed')) {
    const label = deps.method === 'apple' ? 'Apple' : 'Google';
    return {
      ok: false,
      message: deps.method === 'apple' ? 'Apple でのログインは現在準備中です。Google でログインしてください。' : `${label} でのログインは現在準備中です。時間をおいてお試しください。`,
      errorCode: shortCode(code, 'login_failed'),
    };
  }
  if (isPopupUnsupported(code)) {
    // 2. 別ドメイン（firebaseapp.com）のままの redirect は、最近のブラウザでは結果が戻らないことがある。
    //    同じドメインでログインしているときだけ redirect に切り替える。それ以外は案内を出して止める。
    if (!deps.allowRedirectFallback) {
      return { ok: false, message: code.includes('popup-blocked') ? MSG_POPUP_BLOCKED : deps.describeError(error), errorCode: shortCode(code, 'login_failed') };
    }
    return startRedirect(deps, setT, clearT);
  }
  return { ok: false, message: deps.describeError(error), errorCode: shortCode(code, 'login_failed') };
}

/**
 * signInWithRedirect は成功すると「ページが移動するまで決して終わらない Promise」を返す。
 * それを await すると、移動しきれなかったとき永久に「連携中…」になるので、
 * 「開始に失敗したか」だけを短時間待ち、それ以外は redirecting として返す。
 */
async function startRedirect<P, U extends { uid: string }>(
  deps: WebSignInDeps<P, U>,
  setT: (fn: () => void, ms: number) => unknown,
  clearT: (id: unknown) => void,
): Promise<WebSignInResult<U>> {
  let timer: unknown;
  const started = deps.signInWithRedirect(deps.provider).then(
    () => ({ kind: 'started' as const }),
    (e: unknown) => ({ kind: 'failed' as const, e }),
  );
  const grace = new Promise<{ kind: 'pending' }>((resolve) => {
    timer = setT(() => resolve({ kind: 'pending' }), deps.redirectGraceMs ?? REDIRECT_START_GRACE_MS);
  });
  const r = await Promise.race([started, grace]);
  clearT(timer);
  if (r.kind === 'failed') {
    return { ok: false, message: deps.describeError(r.e), errorCode: shortCode(errorCode(r.e), 'login_redirect_failed') };
  }
  return { ok: false, redirecting: true };
}
