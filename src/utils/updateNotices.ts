/**
 * ===================================================================
 * updateNotices.ts（utils）― お知らせの既読管理
 * ===================================================================
 *
 * ■ 役割
 *   「どのお知らせまで読んだか」を端末に覚えさせ、
 *   未読件数（ベルのバッジ）を計算する。
 *
 * ■ なぜアカウントに紐づけないのか
 *   お知らせは全員に同じ内容が届くので、端末ごとの既読で十分。
 *   ログインしていない利用者にも同じ体験を提供でき、
 *   Firestore の読み書きも発生しない（無料枠を消費しない）。
 *
 * ■ 保存する値
 *   「最後に開いたときの最新お知らせID」ではなく
 *   「最後に開いた時刻（epoch ミリ秒）」ではなく、
 *   **既読にしたお知らせIDの集合**を持つ。
 *   IDの集合にしている理由は、過去に遡って1件だけ追加した場合でも
 *   （日付が古いお知らせを後から足したときでも）取りこぼさないため。
 *   件数が増えても1件あたり十数バイトなので容量の心配はない。
 */

import { UPDATE_NOTICES, type UpdateNotice, type UpdateNoticeKind } from '../data/updateNotices';
import { safeLocalStorage } from './safeLocalStorage';

/** localStorage のキー */
const READ_KEY = 'update_notices_read_v1';

/**
 * 使える localStorage を返す（使えなければ null）。
 * 実装は utils/safeLocalStorage.ts が唯一の定義。
 * 呼び出し側の書き方は今までどおり `safeStorage()` のままにしている。
 */
const safeStorage = safeLocalStorage;

/** 既読にしたお知らせIDの集合を読む。壊れた値は空として扱う。 */
export function loadReadIds(): Set<string> {
  const storage = safeStorage();
  if (!storage) return new Set();
  try {
    const raw = storage.getItem(READ_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []);
  } catch {
    return new Set();
  }
}

/**
 * 日付・時刻の新しい順に並べたお知らせ。
 * date + time を文字列比較できる形（'2026-08-17 19:10'）にして比較する。
 * ゼロ埋めされた固定長なので、文字列比較でそのまま時系列順になる。
 */
export function sortedNotices(): UpdateNotice[] {
  return mergeNotices(UPDATE_NOTICES, remoteCache).sort((a, b) =>
    `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`),
  );
}

/** 未読のお知らせ一覧（新しい順）。 */
export function unreadNotices(): UpdateNotice[] {
  const read = loadReadIds();
  return sortedNotices().filter((n) => !read.has(n.id));
}

/** 未読件数。ベルのバッジに出す。 */
export function unreadNoticeCount(): number {
  return unreadNotices().length;
}

/**
 * すべて既読にする（お知らせ画面を開いたときに呼ぶ）。
 *
 * 保存に失敗しても例外は投げない。既読にできない環境では
 * 毎回バッジが出るだけで、機能そのものは壊れない。
 */
export function markAllNoticesRead(): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    const ids = sortedNotices().map((n) => n.id);
    storage.setItem(READ_KEY, JSON.stringify(ids));
  } catch {
    // 保存できなくても致命的ではない
  }
}

/**
 * 日時の表示文字列（'2026-08-17' + '19:10' → '2026年8月17日 19:10'）。
 * 「簡易的な修正・追加内容と日時程度」というご要望どおり、
 * 秒までは出さず、分単位で読みやすく整える。
 */
export function formatNoticeDateTime(notice: UpdateNotice): string {
  const [y, m, d] = notice.date.split('-');
  const month = String(Number(m));
  const day = String(Number(d));
  return `${y}年${month}月${day}日 ${notice.time}`;
}

/**
 * 「今日／きのう／それ以前」の相対表記。
 * 日付だけだと更新の勢いが伝わらないため、直近のものは相対表記にする。
 * @param now テストから固定時刻を渡せるようにしている
 */
export function relativeNoticeLabel(notice: UpdateNotice, now: Date = new Date()): string {
  const [y, m, d] = notice.date.split('-').map(Number);
  const target = new Date(y, (m || 1) - 1, d || 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);
  if (diffDays <= 0) return '今日';
  if (diffDays === 1) return 'きのう';
  if (diffDays < 7) return `${diffDays}日前`;
  return formatNoticeDateTime(notice).split(' ')[0];
}

/* ===================================================================
 * ★運営から届くお知らせ（Firestore・A20）★（2026-09-30）
 * ===================================================================
 * アプリを更新しなくても告知を出せるよう、Firestore の app_notices から読む。
 *   - 誰でも読めるが書けない（firestore.rules の app_notices。書くのは運営のコンソールだけ）。
 *   - 同梱のお知らせ（data/updateNotices.ts）と ID で重ね、同じ ID は Firestore 側を優先。
 *   - 取れないとき（未設定・オフライン・ルール未反映）は同梱分だけで表示する。お知らせで学習を止めない。
 *   - 1回の起動で1度だけ取りに行き、結果は端末にも覚えておく（次の起動で先に出せる）。
 */
const REMOTE_CACHE_KEY = 'update_notices_remote_v1';
const KINDS: readonly UpdateNoticeKind[] = ['feature', 'content', 'fix', 'improve'];

/** Firestore から来た値を UpdateNotice として検査する（壊れた・余計な値は捨てる）。 */
export function parseRemoteNotice(id: string, raw: unknown): UpdateNotice | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (r.published === false) return null;
  const date = typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : null;
  const time = typeof r.time === 'string' && /^\d{2}:\d{2}$/.test(r.time) ? r.time : '00:00';
  const kind = KINDS.includes(r.kind as UpdateNoticeKind) ? (r.kind as UpdateNoticeKind) : 'improve';
  const title = typeof r.title === 'string' ? r.title.trim().slice(0, 120) : '';
  const items = Array.isArray(r.items) ? r.items.filter((x): x is string => typeof x === 'string' && !!x.trim()).map(x => x.slice(0, 400)).slice(0, 12) : [];
  if (!date || !title || !/^[\w-]{1,64}$/.test(id)) return null;
  return { id, date, time, kind, title, items };
}

export function mergeNotices(local: readonly UpdateNotice[], remote: readonly UpdateNotice[]): UpdateNotice[] {
  const byId = new Map<string, UpdateNotice>();
  for (const n of local) byId.set(n.id, n);
  for (const n of remote) byId.set(n.id, n);
  return [...byId.values()];
}

function readRemoteCache(): UpdateNotice[] {
  try {
    const raw = safeStorage()?.getItem(REMOTE_CACHE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.map((n: any) => parseRemoteNotice(String(n?.id ?? ''), n)).filter((n): n is UpdateNotice => !!n) : [];
  } catch { return []; }
}
let remoteCache: UpdateNotice[] = readRemoteCache();
let remoteRequest: Promise<UpdateNotice[]> | null = null;

/**
 * Firestore のお知らせを取りに行く（1起動1回）。終わったら並び替え済みの全件を返す。
 * firebase は動的 import にして、ホームの起動を重くしない。
 */
export function refreshRemoteNotices(): Promise<UpdateNotice[]> {
  if (!remoteRequest) {
    remoteRequest = (async () => {
      try {
        const [{ db, FIREBASE_CONFIGURED }, fs] = await Promise.all([import('../firebase'), import('firebase/firestore')]);
        if (!FIREBASE_CONFIGURED) return remoteCache;
        const snap = await fs.getDocs(fs.query(fs.collection(db, 'app_notices'), fs.orderBy('date', 'desc'), fs.limit(30)));
        const list = snap.docs.map(d => parseRemoteNotice(d.id, d.data())).filter((n): n is UpdateNotice => !!n);
        remoteCache = list;
        try { safeStorage()?.setItem(REMOTE_CACHE_KEY, JSON.stringify(list)); } catch { /* 容量不足などは無視 */ }
      } catch { /* オフライン・ルール未反映：同梱分だけで表示する */ }
      return remoteCache;
    })();
  }
  return remoteRequest.then(() => sortedNotices());
}
