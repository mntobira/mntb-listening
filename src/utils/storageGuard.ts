/**
 * localStorage の容量オーバーでアプリが落ちないようにする（2026-10-03）。
 *
 * ■ 何が起きていたか
 *   localStorage.setItem は保存領域（5MB 前後）がいっぱいだと QuotaExceededError を投げる。
 *   App.tsx などの useEffect で try なしに setItem している所が 40 か所以上あり、
 *   1つでも投げると React の描画ごと止まり、ErrorBoundary の画面になっていた
 *   （学習履歴・復習ノートがたまった長期利用者ほど起きやすい）。
 *
 * ■ どうしたか
 *   1) Storage.prototype.setItem を1回だけ包み、容量オーバーのときは
 *      消してよい一時データ（キャッシュ類）を捨てて1回だけ再試行する。
 *      それでも入らなければ★例外はそのまま投げる★
 *      （成長記録・ガチャは「保存できなかったら報酬を出さない」ために例外を使っている）。
 *   2) 画面の状態を覚えるだけの書き込み（App.tsx など）は safeSetItem() を使い、
 *      失敗しても描画を止めない。
 */

/** 容量が足りないときに捨ててよいキーの接頭辞（再取得・再計算できるものだけ） */
const DISPOSABLE_PREFIXES = ['cache_', 'cached_', 'tmp_', 'battle_pool_cache', 'study_catalog_cache'];

function isQuotaError(e: unknown): boolean {
  const err = e as { name?: string; code?: number } | null;
  return !!err && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || err.code === 22 || err.code === 1014);
}

function freeDisposable(storage: Storage): number {
  let freed = 0;
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const k = storage.key(i);
      if (k && DISPOSABLE_PREFIXES.some((p) => k.startsWith(p))) keys.push(k);
    }
    for (const k of keys) { storage.removeItem(k); freed += 1; }
  } catch { /* noop */ }
  return freed;
}

let installed = false;
let failures = 0;

/** 保存に失敗した回数（テスト・診断用） */
export function storageWriteFailures(): number { return failures; }

export function installStorageGuard(): void {
  if (installed || typeof Storage === 'undefined') return;
  installed = true;
  const original = Storage.prototype.setItem;
  Storage.prototype.setItem = function guardedSetItem(this: Storage, key: string, value: string): void {
    try {
      original.call(this, key, value);
    } catch (e) {
      if (isQuotaError(e) && freeDisposable(this) > 0) {
        try { original.call(this, key, value); return; } catch { /* fallthrough */ }
      }
      throw e;
    }
  };
}

/**
 * 失敗しても例外を投げない setItem（画面の状態・設定など「保存できなくても困らない」もの用）。
 * 戻り値で保存できたかが分かる。
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    failures += 1;
    if (failures <= 3) console.warn('[storage] 保存できませんでした:', key, e);
    return false;
  }
}

installStorageGuard();
