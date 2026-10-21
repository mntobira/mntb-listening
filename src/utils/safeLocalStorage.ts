/**
 * ===================================================================
 * localStorage の安全な取り出し口
 * ===================================================================
 *
 * ■ なぜこのファイルがあるのか
 *
 * このアプリは進捗・既読・再送キューなどを localStorage に置いている。
 * ところが localStorage は「必ず使える」ものではない。
 *
 *   ・プライベートブラウズ／Cookie ブロック
 *       → `localStorage` を **参照した瞬間に例外が飛ぶ** ブラウザがある
 *         （Safari の SecurityError など。getItem を呼ぶ前に落ちる）
 *   ・Node（vitest / SSR）
 *       → そもそも `localStorage` が存在しない
 *
 * なので全体の約束は「読めなければ既定値で続行し、例外は外に漏らさない」。
 * その約束を守る取り出し口が、名前だけ違う同じ関数で4本あった。
 *
 *   src/utils/progress.ts       の storage()
 *   src/utils/userRegistry.ts   の safeStorage()
 *   src/utils/updateNotices.ts  の safeStorage()
 *   src/utils/feedback.ts       の readStorage()
 *
 * 4本とも中身は文字どおり同一で、コメントだけが違っていた。
 * localStorage の扱いは「落ちたらデータが消えたように見える」場所なので、
 * ここが4か所に散っているのは直したときの直し漏れが怖い。1本に集約した。
 *
 * ■ 意図的にこうしている点
 *
 * ・**呼ばれるたびに globalThis を見る。**
 *   モジュール先頭の定数に固めると「起動時は無かったが後から生えた」
 *   ケースを取りこぼし、localStorage を差し替えるテストも壊れる。
 *
 * ・**返すのは受け取ったオブジェクトそのもの（ラップしない）。**
 *   ラップすると呼び出し側が握る参照が別物になり、
 *   片方への書き込みがもう片方に見えない事故が起きうる。
 *
 * ・**`getItem` が関数かどうかまで見る。**
 *   形だけ似た偽物（`{}` や `{ getItem: 'x' }`）を弾くため。
 *
 * ・**このファイルは他の src を一切 import しない（葉モジュール）。**
 *   どこから呼んでも依存の向きが増えないようにしている。
 */

/**
 * 使える localStorage を返す。使えなければ `null`。
 *
 * 例外は投げない。呼び出し側は `null` のときに既定値で進めればよい。
 *
 * ```ts
 * const ls = safeLocalStorage();
 * if (!ls) return {};              // 読めない環境 → 既定値で続行
 * const raw = ls.getItem(key);
 * ```
 *
 * なお `setItem` は **この関数を通っても例外を投げうる**（容量超過など）。
 * 書き込み側は従来どおり呼び出し箇所で try/catch すること。
 */
export function safeLocalStorage(): Storage | null {
  try {
    const ls = (globalThis as { localStorage?: Storage } | undefined)?.localStorage;
    if (ls && typeof ls.getItem === 'function') return ls as Storage;
  } catch {
    /* プライベートブラウズ等では保存できないが、動作は続ける */
  }
  return null;
}

/**
 * 保存されている JSON の「配列」を読む。読めない・配列でない・壊れているときは [] を返す。
 *
 * ★JSON.parse(... || '[]') をそのまま使わない理由★
 *   古い版が別の形（{} や文字列）で保存していた、容量オーバーで途中までしか書けなかった、
 *   などで中身が配列でないと、その直後の .push / .includes / .map で例外になり、
 *   ノートの保存や結果画面が丸ごと失敗する（端末を変えるまで直らない）。
 */
export function readJsonArray<T = unknown>(key: string): T[] {
  try {
    const raw = safeLocalStorage()?.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * 例外を投げない getItem（C-17）。読めない環境・読めないキーは null。
 *
 * ★生の localStorage.getItem をやめる理由★
 *   iOS Safari のプライベートブラウズや一部の WebView では、`localStorage` を
 *   **参照した瞬間** に SecurityError が飛ぶ。useState の初期化（描画中）で投げると
 *   アプリ全体が ErrorBoundary の画面になる。読み出しは必ずここを通す。
 */
export function safeGetItem(key: string): string | null {
  try {
    return safeLocalStorage()?.getItem(key) ?? null;
  } catch {
    return null; // 読めないときは「保存されていない」と同じ扱い
  }
}

/** 例外を投げない removeItem（C-17）。消せたら true */
export function safeRemoveItem(key: string): boolean {
  try {
    const ls = safeLocalStorage();
    if (!ls) return false;
    ls.removeItem(key);
    return true;
  } catch {
    return false; // 消せなくても動作は続ける（次回の上書きで正される）
  }
}

/**
 * 使える localStorage を返す。使えなければ **例外を投げる**（C-17）。
 *
 * ★safeGetItem と使い分ける理由★
 *   「読めなかったとき」と「保存されていなかったとき」で、別の動きをしている箇所がある
 *   （例：読めなければ何も変えない／保存が無ければ既定値を入れる）。
 *   そこを safeGetItem（読めなければ null）に替えると、読めない端末での動きが変わってしまう。
 *   try の中でこれを使えば、`localStorage` を参照した瞬間の SecurityError も
 *   今までどおり同じ catch に入るので、動きは1つも変わらない。
 */
export function requireLocalStorage(): Storage {
  const ls = safeLocalStorage();
  if (!ls) throw new Error('localStorage is unavailable');
  return ls;
}

/**
 * 失敗を **例外で** 呼び出し側へ伝える setItem（C-17）。
 *
 * ★safeSetItem（storageGuard.ts）と使い分ける理由★
 *   ノートやプロフィールの保存は「保存できませんでした」と画面で知らせるために
 *   例外を受け取っている。ここで握りつぶすと、保存できていないのに「保存しました」と出てしまう。
 */
export function setItemOrThrow(key: string, value: string): void {
  requireLocalStorage().setItem(key, value);
}

/**
 * 保存されていた JSON 文字列を、型の確認つきで読む（C-18）。
 *
 *   safeParseJson(raw, fallback)            … 壊れている・空なら fallback
 *   safeParseJson(raw, fallback, isValid)   … さらに isValid が false なら fallback
 *
 * ★各ファイルで `try { JSON.parse(raw) } catch {}` を書かない理由★
 *   容量オーバーで途中までしか書けなかった・古い版が別の形で保存していた、などで
 *   中身が壊れていることがある。型を確かめずに使うと、その直後の .map / .push で例外になる。
 *   読む側の約束（壊れていたら既定値）をここ1か所にまとめる。
 */
export function safeParseJson<T>(raw: string | null | undefined, fallback: T, isValid?: (value: unknown) => value is T): T;
export function safeParseJson<T>(raw: string | null | undefined, fallback: T, isValid?: (value: unknown) => boolean): T;
export function safeParseJson<T>(raw: string | null | undefined, fallback: T, isValid?: (value: unknown) => boolean): T {
  if (raw === null || raw === undefined || raw === '') return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isValid && !isValid(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback; // 壊れた JSON は「保存されていない」と同じ扱い
  }
}

/** localStorage のキーを読んで safeParseJson する近道 */
export function readStoredJson<T>(key: string, fallback: T, isValid?: (value: unknown) => boolean): T {
  return safeParseJson(safeGetItem(key), fallback, isValid);
}

/** よく使う型ガード：ふつうのオブジェクト（配列・null 以外） */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
