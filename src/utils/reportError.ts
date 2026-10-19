/**
 * 「失敗しても画面は止めない」処理の例外を、黙って捨てずに記録する。
 *
 * 以前は `.catch(() => {})` や `catch { }` で完全に握りつぶしていたため、
 * チャンク読み込み失敗（デプロイ直後のキャッシュ不整合）や Firestore の権限・通信エラーが
 * 起きても、手がかりが何も残らなかった。
 *
 * ここでは挙動（画面・戻り値）は変えずに、
 *   ・直近の失敗を最大 MAX_RECENT 件までメモリに残す（getRecentErrors で取り出せる）
 *   ・開発ビルドでは console.warn にも出す（本番のコンソールは汚さない）
 * だけを行う。利用者に見えるものは何も増えない。
 *
 * 使い分け：
 *   ・Promise   … `.catch(logRejection('ranking.ensureEntry'))`
 *   ・try/catch … `catch (error) { reportError('account.delete.friends', error); }`
 *   ・保存できない環境（localStorage 不可・容量不足）など「想定内で、記録しても役に立たない」
 *     失敗は、これを使わずに理由をコメントで書いて握りつぶしてよい。
 */

export interface RecordedError {
  /** どこで起きたか（'機能.操作' の形） */
  scope: string;
  /** エラーの要約（Firestore の code があれば先頭に付ける） */
  message: string;
  /** 起きた時刻（ms） */
  at: number;
}

export const MAX_RECENT = 20;

const recent: RecordedError[] = [];

function summarize(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' && code ? `${code}: ${error.message}` : error.message;
  }
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error) ?? String(error);
  } catch {
    // 循環参照などで文字列化できないものは型名だけ残す
    return Object.prototype.toString.call(error);
  }
}

function isDev(): boolean {
  try {
    return Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV);
  } catch {
    return false;
  }
}

/** 失敗を記録する。例外は投げない（記録処理そのものが画面を止めないように）。 */
export function reportError(scope: string, error: unknown, now: number = Date.now()): void {
  try {
    recent.push({ scope, message: summarize(error), at: now });
    if (recent.length > MAX_RECENT) recent.splice(0, recent.length - MAX_RECENT);
    if (isDev()) console.warn(`[${scope}]`, error);
  } catch {
    // 記録に失敗しても、呼び出し元の処理は続ける
  }
}

/** Promise の `.catch` にそのまま渡せる形。解決値は undefined（従来の `.catch(() => {})` と同じ）。 */
export function logRejection(scope: string): (error: unknown) => undefined {
  return (error: unknown) => {
    reportError(scope, error);
    return undefined;
  };
}

/** 直近の失敗（古い順）。不具合報告や画面検証で使う。 */
export function getRecentErrors(): readonly RecordedError[] {
  return recent.slice();
}

/** テスト用：記録を空にする */
export function clearRecentErrors(): void {
  recent.length = 0;
}
