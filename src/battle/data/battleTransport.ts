/**
 * 対戦の書き込みを支える通信層（書き込みの待ち時間上限・一時的な失敗の再送・往復時間の計測）。
 * 2026-10-15 のリファクタリングで battle.ts（1,420行）から機能ごとに切り出した。中身は元のまま。
 * 依存の向き: battleShared ← battleTransport / battleRuleOverrides ← battleFriendRoom / battleMatchmaking ← battleRoomActions
 * 呼び出し側は従来どおり './battle'（再公開）から import してよい。
 */
import { isTransientError, retryDelayMs, smoothRtt } from '../core/connection';
import { serverNow } from '../core/serverClock';

/**
 * 締切時刻を作る。
 *
 * ★サーバ時刻ではなく「推定サーバ時刻＋秒数」で作る理由★
 * serverTimestamp() は「書き込んだ瞬間のサーバ時刻」しか作れず、
 * 「サーバ時刻＋10秒」は表現できない（Cloud Functions が無いため）。
 * そこで端末側で作るしかないが、★Date.now() を直接使ってはいけない★。
 *
 * かつてここは Date.now() を使っており、
 * 「両者が同じ deadlineAt を見るので不公平は生じない」と書いていた。
 * これは誤りだった。実際には次の2つが壊れる:
 *
 *   ① ルールは「締切は request.time（サーバ時刻）より未来で、
 *      かつ60秒以内」しか許さない。
 *      部屋主の時計が1分以上ずれていると★この書き込みが必ず拒否される★。
 *      利用者に出るのは「この操作は許可されていません」だけで、
 *      対戦が始まらない理由が誰にも分からない。
 *
 *   ② 残り時間は各端末が「締切 − 自分の時計」で出している。
 *      時計が遅れている側は「残り3秒」と見えている時点で
 *      サーバ上ではもう締切を過ぎており、
 *      ★答えたのに解答が消える★。
 *
 * serverNow() は既存の通信から推定したサーバ時刻を返すので、
 * 端末の時計がずれていても正しい締切が書ける。
 * 受付の可否はルール側で request.time と比べて決まるため、
 * 端末時計を操作して締切を伸ばすことはできない（安全性は変わらない）。
 */
export function deadlineFromNow(seconds: number): Date {
  // 通信の往復ぶん（両者への配信遅延）を少しだけ足す。
  // これが無いと、電波の悪い側が毎回わずかに不利になる。
  const NETWORK_GRACE_MS = 700;
  return new Date(serverNow() + seconds * 1000 + NETWORK_GRACE_MS);
}

/**
 * 書き込みの往復からサーバ時刻を観測する。
 *
 * ★専用の通信を足さない★
 * 時刻合わせのために読み書きを増やすと無料枠を食う。
 * 対戦の書き込みはどれも updatedAt: serverTimestamp() を含んでいるので、
 * 「書いた直後にその1件を読む」のではなく、
 * ★送信前後の端末時刻だけを測っておき、
 *   購読（onSnapshot）で返ってくるサーバ時刻と突き合わせる★。
 * これで追加の通信は0のまま観測できる。
 *
 * ここでは送信の前後を測る部分だけを受け持つ。
 */
/**
 * ★書き込みの待ち時間の上限★
 * Firestore の書き込みは圏外だと「送信待ち」のまま Promise が返ってこない。
 * 以前は「はじめる」を押しても何も起きず、ずっと待っているように見えた
 * （フレンド対戦でカウントダウンが始まらない不具合の原因の1つ）。
 * 上限を過ぎたら 'deadline-exceeded' として投げ、画面に再試行を出す。
 */
export const WRITE_TIMEOUT_MS = 12_000;
function withWriteTimeout<T>(promise: Promise<T>, ms = WRITE_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'deadline-exceeded' })), ms);
    promise.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
  });
}


/**
 * ★通信が一瞬切れても諦めない書き込み★
 *
 * 市販の対戦ゲームは、電波が1〜2秒途切れても操作が消えない。
 * 以前は1回失敗するとそのまま「送信できませんでした」になり、
 * 開始・解答・進行・結果の申告が失われて試合が止まることがあった。
 *
 *   ・やり直して通る見込みがある失敗（unavailable / deadline-exceeded など）だけ再送する
 *   ・0.4秒→0.8秒→1.6秒…と間隔を伸ばす（揺らぎつき）
 *   ・全体の締切（budgetMs）を過ぎたら諦める（締切後の解答はどうせ拒否される）
 *   ・再送のあとの permission-denied は「最初の送信が実は届いていた」ことが多い。
 *     acceptDeniedAfterRetry のときは成功として扱う（解答の二重送信はルールが止める）
 */
export async function resilientWrite(
  run: () => Promise<void>,
  opts: { budgetMs?: number; acceptDeniedAfterRetry?: boolean; attemptTimeoutMs?: number } = {},
): Promise<void> {
  const started = Date.now();
  const budget = opts.budgetMs ?? 20_000;
  for (let attempt = 0; ; attempt += 1) {
    try {
      const sentAt = Date.now();
      await withWriteTimeout(run(), Math.max(1_000, Math.min(opts.attemptTimeoutMs ?? WRITE_TIMEOUT_MS, budget - (sentAt - started))));
      const ackAt = Date.now();
      lastWrite = { sentAt, ackAt };
      reportRtt(ackAt - sentAt);
      return;
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (attempt > 0 && code === 'permission-denied' && opts.acceptDeniedAfterRetry) return;
      const wait = retryDelayMs(attempt);
      if (!isTransientError(error) || Date.now() - started + wait >= budget) throw error;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

/** 読み取り・やり直しても同じ結果になる処理を、一時的な失敗のときだけ再試行する */
export async function withRetry<T>(run: () => Promise<T>, budgetMs: number): Promise<T> {
  const started = Date.now();
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await withWriteTimeout(run(), Math.max(1_500, Math.min(WRITE_TIMEOUT_MS, budgetMs - (Date.now() - started))));
    } catch (error) {
      const wait = retryDelayMs(attempt);
      if (!isTransientError(error) || Date.now() - started + wait >= budgetMs) throw error;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

// ---- 往復時間（アンテナ表示用）----
let rttMs: number | null = null;
const rttListeners = new Set<(ms: number) => void>();
function reportRtt(sample: number) {
  rttMs = smoothRtt(rttMs, sample);
  for (const fn of rttListeners) { try { fn(rttMs); } catch { /* isolate */ } }
}
/** 直近の往復時間（ms、なめらか済み）。まだ測れていなければ null */
export function currentRttMs(): number | null { return rttMs; }
export function subscribeRtt(fn: (ms: number) => void): () => void {
  rttListeners.add(fn);
  return () => { rttListeners.delete(fn); };
}

/**
 * 直近の書き込みの送信・応答時刻。
 * watchRoom がサーバ時刻を受け取ったときに突き合わせて使う。
 */
let lastWrite: { sentAt: number; ackAt: number } | null = null;
/** 直近の書き込みの送信・応答時刻（まだ購読側で突き合わせていなければ値がある） */
export function peekLastWrite(): { sentAt: number; ackAt: number } | null { return lastWrite; }
/** 購読側で突き合わせ終えたら消す */
export function clearLastWrite(): void { lastWrite = null; }
