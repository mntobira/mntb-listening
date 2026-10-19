import { asErrorLike } from './errorLike';

/**
 * Firestore のエラーコード → 利用者向け日本語メッセージ の対応表。
 * 文言は呼び出し元（friends.ts / classroom.ts）ごとに違うので、表は各ファイルが持つ。
 * 表に無いコードは「fallback（＋元の message）」になる。
 */
export type FirestoreErrorMessages = Readonly<Partial<Record<string, string>>>;

/**
 * Firestore の例外を、意味が伝わる日本語の Error に変換する共通処理。
 * 「Missing or insufficient permissions.」などをそのまま画面に出さないために使う。
 */
export function toFriendlyFirestoreError(
  rawError: unknown,
  fallback: string,
  messages: FirestoreErrorMessages,
): Error {
  const error = asErrorLike(rawError);
  const code = error?.code as string | undefined;
  const mapped = code !== undefined && Object.prototype.hasOwnProperty.call(messages, code)
    ? messages[code]
    : undefined;
  if (mapped !== undefined) return new Error(mapped);
  return new Error(error?.message ? `${fallback}（${error.message}）` : fallback);
}

/** Firestore の permission-denied かどうか（フォールバック判定用）。 */
export function isPermissionDenied(error: unknown): boolean {
  return asErrorLike(error)?.code === 'permission-denied';
}
