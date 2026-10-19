/**
 * catch で受け取った「何が来るか分からない例外」を読むための型。
 *
 * ■ なぜ必要か
 *   Firebase / fetch / Capacitor のエラーはどれも `code` `message` `name` を持つことが多いが、
 *   TypeScript では catch 句の値は `unknown`（以前はここを `any` にしていた）。
 *   `any` のままだとフィールド名の打ち間違い（`e.cdoe`）にも気づけないため、
 *   「読むかもしれない項目」だけを持つ型にして、存在しないことも前提に読む。
 *
 * ■ ルール
 *   ・asErrorLike は値を変換しない（型を付けるだけ）。
 *     そのため `e?.code` / `String(e?.message || e)` などの読み方は以前と完全に同じ結果になる。
 *   ・null / undefined / 文字列が投げられても `?.` で安全に読めるよう、戻り値は `ErrorLike | null | undefined`。
 */
export interface ErrorLike {
  code?: unknown;
  message?: unknown;
  name?: unknown;
}

/** 例外に型だけを付ける（実行時には何もしない）。 */
export function asErrorLike(error: unknown): ErrorLike | null | undefined {
  return error as ErrorLike | null | undefined;
}
