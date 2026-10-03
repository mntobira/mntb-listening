/**
 * ===================================================================
 * 新しい版を配信したあとに「古い画面」が部品を読めなくなる事故への備え
 * ===================================================================
 *
 * ■ 何が起きるのか
 *   画面の部品（解説・対戦など）は必要になったときに読み込む（React.lazy）。
 *   部品のファイル名には版ごとの印（ハッシュ）が付くので、
 *   新しい版を配信すると、開きっぱなしの古い画面が探す部品はもう無い。
 *   そのままだと「対戦を押したら真っ白」「解説が開かない」になる。
 *   人が多いほど、配信の瞬間に開いている人も多いので必ず起きる。
 *
 * ■ どう直すか
 *   読み込みに失敗したら、1回だけ再読み込みして新しい版に入れ替える。
 *   ★何度も再読み込みしない★（本当に通信が無いときに無限に再読み込みしないよう、
 *   直近の再読み込みから 60 秒以内なら行わない）。
 */

const KEY = 'manatobi:chunk-reload-at';
const COOLDOWN_MS = 60_000;

/** 部品の読み込み失敗かどうか（ブラウザごとに文言が違うのでまとめて見る） */
export function isChunkLoadError(error: unknown): boolean {
  const message = String((error as { message?: unknown })?.message ?? error ?? '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|ChunkLoadError|Loading chunk [\w-]+ failed/i.test(message);
}

/** 直近に再読み込みしていなければ true（その時刻を記録する） */
export function shouldReloadForChunk(now = Date.now(), storage: Pick<Storage, 'getItem' | 'setItem'> | null = safeSession()): boolean {
  const last = Number(storage?.getItem(KEY) || 0);
  if (Number.isFinite(last) && now - last < COOLDOWN_MS) return false;
  try { storage?.setItem(KEY, String(now)); } catch { /* 保存できなくても再読み込みはする */ }
  return true;
}

function safeSession(): Storage | null {
  try { return typeof sessionStorage === 'undefined' ? null : sessionStorage; } catch { return null; }
}

/** アプリ起動時に1回だけ呼ぶ */
export function installChunkRecovery(): void {
  if (typeof window === 'undefined') return;
  const recover = (error: unknown): boolean => {
    if (!isChunkLoadError(error)) return false;
    if (!navigator.onLine) return false; // 圏外なら再読み込みしても直らない
    if (!shouldReloadForChunk()) return false;
    window.location.reload();
    return true;
  };
  // Vite が出す専用イベント（preload の失敗）
  window.addEventListener('vite:preloadError', (event: Event) => {
    if (recover((event as Event & { payload?: unknown }).payload)) event.preventDefault();
  });
  // React.lazy の import() 失敗は Promise の拒否として上がってくる
  window.addEventListener('unhandledrejection', (event) => {
    if (recover(event.reason)) event.preventDefault();
  });
}
