/*
 * マナトビ Service Worker
 *
 * 方針（安全側）:
 *   - 同じオリジンの GET だけを扱う。Firebase / Google / 解析などの外部通信には一切触れない。
 *   - 画面（HTML）はネットワーク優先。オフライン時だけ最後に取れた画面を返す
 *     → デプロイ直後に古い画面が残り続ける事故を防ぐ。
 *   - /assets/ はファイル名にハッシュが付くので、キャッシュ優先で問題ない。
 *   - 画像・効果音・音源はキャッシュを返しつつ裏で更新（stale-while-revalidate）。
 *   - 容量が膨らまないよう、実行時キャッシュは件数に上限を設ける。
 *   - Range リクエスト（音声のシーク）はキャッシュしない（206 を保存すると壊れる）。
 */
const VERSION = 'v3';
/** 画面（HTML）の取得をこれ以上待たない（電波が弱いとき白い画面のまま待ち続けないため） */
const NAV_TIMEOUT_MS = 8000;
const SHELL = `manatobi-shell-${VERSION}`;
const RUNTIME = `manatobi-runtime-${VERSION}`;
const RUNTIME_MAX_ENTRIES = 300;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(['/', '/manifest.json']))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('manatobi-') && k !== SHELL && k !== RUNTIME)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i += 1) await cache.delete(keys[i]);
}

function cacheable(res) {
  return res && res.ok && res.status === 200 && res.type === 'basic';
}

function fetchWithTimeout(request, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(request, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

async function networkFirstPage(request) {
  try {
    const res = await fetchWithTimeout(request, NAV_TIMEOUT_MS);
    // 画面（HTML）だけを '/' として保存する。PDF などを開いた時に '/' が上書きされないように。
    if (cacheable(res) && (res.headers.get('content-type') || '').includes('text/html')) {
      const copy = res.clone();
      caches.open(SHELL).then((c) => c.put('/', copy)).catch(() => undefined);
    }
    return res;
  } catch {
    const cached = await caches.match('/');
    return cached || new Response('オフラインです。通信が戻ったら再読み込みしてください。', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (cacheable(res)) {
    const copy = res.clone();
    caches.open(RUNTIME).then((c) => c.put(request, copy)).then(() => trim(RUNTIME, RUNTIME_MAX_ENTRIES)).catch(() => undefined);
  }
  return res;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then((res) => {
      if (cacheable(res)) {
        const copy = res.clone();
        caches.open(RUNTIME).then((c) => c.put(request, copy)).then(() => trim(RUNTIME, RUNTIME_MAX_ENTRIES)).catch(() => undefined);
      }
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/__') || url.pathname.startsWith('/_vercel')) return;
  // 学習プリント PDF はサイズが大きいので SW では扱わない（ブラウザの通常キャッシュに任せる）
  if (url.pathname.startsWith('/prints/') && url.pathname.endsWith('.pdf')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (/\.(png|jpe?g|svg|webp|gif|ico|mp3|m4a|ogg|wav|woff2?|json)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
