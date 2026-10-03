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
    const ls = (globalThis as any)?.localStorage;
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

/** 保存されている JSON の「オブジェクト」を読む。読めない・オブジェクトでないときは {} */
export function readJsonObject<T extends Record<string, unknown> = Record<string, unknown>>(key: string): T {
  try {
    const raw = safeLocalStorage()?.getItem(key);
    if (!raw) return {} as T;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as T) : ({} as T);
  } catch {
    return {} as T;
  }
}
