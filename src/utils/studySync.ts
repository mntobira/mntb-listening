/**
 * ===================================================================
 * 学習データの Firestore 同期（localStorage を主、Firestore を従）
 * ===================================================================
 *
 * -------------------------------------------------------------------
 * ■ このファイルの責務
 * -------------------------------------------------------------------
 * studySyncCore.ts（純粋なマージ処理）と、実際の Firestore 読み書きを
 * 繋ぐ層。Firebase に依存するコードをここへ閉じ込めることで、
 * マージのロジックは Firebase 無しでテストできるようにしている。
 *
 * -------------------------------------------------------------------
 * ■ Firestore のデータ形
 * -------------------------------------------------------------------
 *   study_progress/{uid} = {
 *     uid,
 *     solved:      { "章ID::大問ID": 初回解答時刻ms, ... },
 *     reviewItems: [ ReviewItem, ... ],
 *     solvedTotal: number,        // 先生画面での並べ替え用（集計済み）
 *     lastStudiedAt: number,      // 最終学習時刻
 *     updatedAt: serverTimestamp,
 *   }
 *
 * 1ユーザー1ドキュメントにする理由：
 *   - 読み取り回数が1回で済む（Firestore の課金は読み取り件数）
 *   - 先生が40人分見るとき 40 read で済む（サブコレクションだと数千 read）
 *   - ドキュメント上限 1MiB に対し、進捗は数百件で数十KB程度なので十分収まる
 *     （復習リストは studySyncCore.limitReviewItemsForSync で上限を掛けている）
 *
 * -------------------------------------------------------------------
 * ■ 通信を減らす工夫（Firestore は書き込み回数で課金される）
 * -------------------------------------------------------------------
 * 1問解くたびに書き込むと、40人×1授業で数千書き込みになる。
 * そこで**デバウンス**して、まとめて書く。
 *   - 学習中は 15 秒ごとにまとめて1回
 *   - 画面を離れる（pagehide）ときに必ず1回
 * これで1授業あたり数十書き込みに収まる。
 *
 * -------------------------------------------------------------------
 * ■ 失敗しても学習を止めない
 * -------------------------------------------------------------------
 * 同期は「あとから追いつく」性質のものなので、
 * 通信エラーは画面に出さず、次の機会に再送する。
 * localStorage には既に書けているので、データは失われない。
 */

import { doc, getDoc, setDoc, serverTimestamp } from './firestoreMetered';
import { db, auth } from '../firebase';

import { readSolvedMap, SOLVED_KEY_PREFIX } from './progress';
import { loadReviewList, saveReviewList, type ReviewItem } from './reviewList';
import {
  mergeSolvedMaps,
  mergeReviewLists,
  solvedMapChanged,
  reviewListChanged,
  limitReviewItemsForSync,
  toSyncableReviewItem,
  fromSyncedReviewItems,
  type SolvedMap,
} from './studySyncCore';
import { setItemOrThrow } from './safeLocalStorage';

/** Firestore のコレクション名 */
export const STUDY_PROGRESS_COLLECTION = 'study_progress';

/** まとめ書きの待ち時間 */
const FLUSH_DEBOUNCE_MS = 15000;

/** 同期が済んでいるかを覚えておく（起動時の二重取得を防ぐ） */
let pullDoneForUid: string | null = null;

/** デバウンス用のタイマー */
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** 同期が有効か（ログイン済みのみ。ゲストは端末内に留める） */
export function isSyncEnabled(): boolean {
  return Boolean(auth.currentUser?.uid);
}

function currentUid(): string | null {
  return auth.currentUser?.uid || null;
}

/**
 * localStorage へ進捗マップを直接書く。
 *
 * progress.ts は markProblemSolved（1件追加）しか公開しておらず、
 * マージ結果を一括で書き戻す手段が無い。同期のためだけに
 * progress.ts の内部仕様（キー名）に触れるのは望ましくないが、
 * SOLVED_KEY_PREFIX を公開してくれているのでそれを使う。
 */
function writeSolvedMapLocal(uid: string, map: SolvedMap): void {
  try {
    setItemOrThrow(`${SOLVED_KEY_PREFIX}${uid}`, JSON.stringify(map));
  } catch {
    /* 容量超過などは無視（学習は継続させる） */
  }
}

/** 進捗マップから最終学習時刻を求める */
function latestTime(map: SolvedMap, items: ReviewItem[]): number {
  let latest = 0;
  Object.values(map).forEach((time) => {
    const value = Number(time);
    if (Number.isFinite(value) && value > latest) latest = value;
  });
  items.forEach((item) => {
    const value = Number(item?.updatedAt);
    if (Number.isFinite(value) && value > latest) latest = value;
  });
  return latest;
}

// ===================================================================
// 取得（起動時に1回）
// ===================================================================

export interface PullResult {
  /** 同期が実行されたか（未ログイン・失敗時は false） */
  synced: boolean;
  /** クラウドから取り込んで増えた進捗の件数 */
  addedProblems: number;
  /** クラウドから取り込んで増えた復習項目の件数 */
  addedReviews: number;
}

/**
 * Firestore から取得し、ローカルとマージして localStorage を更新する。
 *
 * 「クラウドで上書き」ではなく**マージ**なので、
 * オフラインで解いた分もクラウドにある分も、どちらも残る。
 *
 * @param force 既に取得済みでも再取得する（画面の「同期」ボタン用）
 */
export async function pullStudyData(force = false): Promise<PullResult> {
  const uid = currentUid();
  if (!uid) return { synced: false, addedProblems: 0, addedReviews: 0 };
  if (!force && pullDoneForUid === uid) {
    return { synced: false, addedProblems: 0, addedReviews: 0 };
  }

  const localSolved = readSolvedMap(uid);
  const localReviews = loadReviewList(uid);

  try {
    const snapshot = await getDoc(doc(db, STUDY_PROGRESS_COLLECTION, uid));
    pullDoneForUid = uid;

    if (!snapshot.exists()) {
      // クラウドに何も無い＝初回。ローカル分を上げておく。
      await pushStudyData(true);
      return { synced: true, addedProblems: 0, addedReviews: 0 };
    }

    const data = snapshot.data() || {};
    const remoteSolved = (data.solved && typeof data.solved === 'object' ? data.solved : {}) as SolvedMap;
    const remoteReviews = fromSyncedReviewItems(data.reviewItems);

    const mergedSolved = mergeSolvedMaps(localSolved, remoteSolved);
    const mergedReviews = mergeReviewLists(localReviews, remoteReviews);

    const addedProblems = Object.keys(mergedSolved).length - Object.keys(localSolved).length;
    const addedReviews = mergedReviews.length - localReviews.length;

    if (solvedMapChanged(localSolved, mergedSolved)) writeSolvedMapLocal(uid, mergedSolved);
    if (reviewListChanged(localReviews, mergedReviews)) saveReviewList(uid, mergedReviews);

    // ローカルにしか無かった分をクラウドへ返す（双方向をここで閉じる）
    if (
      Object.keys(mergedSolved).length !== Object.keys(remoteSolved).length ||
      mergedReviews.length !== remoteReviews.length
    ) {
      await pushStudyData(true);
    }

    return {
      synced: true,
      addedProblems: Math.max(0, addedProblems),
      addedReviews: Math.max(0, addedReviews),
    };
  } catch (error) {
    // 通信できなくても学習は続く。次回起動で再試行する。
    console.warn('[studySync] pull failed (学習は継続します):', error);
    return { synced: false, addedProblems: 0, addedReviews: 0 };
  }
}

// ===================================================================
// 送信
// ===================================================================

/**
 * localStorage の内容を Firestore へ書く。
 *
 * @param immediate true なら即送信、false ならデバウンスして後でまとめ送信
 */
export async function pushStudyData(immediate = false): Promise<boolean> {
  const uid = currentUid();
  if (!uid) return false;

  if (!immediate) {
    schedulePush();
    return false;
  }

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const solved = readSolvedMap(uid);
  const reviews = limitReviewItemsForSync(loadReviewList(uid));

  try {
    await setDoc(
      doc(db, STUDY_PROGRESS_COLLECTION, uid),
      {
        uid,
        solved,
        reviewItems: reviews.map(toSyncableReviewItem),
        // 先生画面で並べ替えるための集計値（毎回クライアントで計算するのを避ける）
        solvedTotal: Object.keys(solved).length,
        reviewTotal: reviews.length,
        lastStudiedAt: latestTime(solved, reviews),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  } catch (error) {
    console.warn('[studySync] push failed (次の機会に再送します):', error);
    return false;
  }
}

/** デバウンスして後でまとめて送る */
export function schedulePush(): void {
  if (!isSyncEnabled()) return;
  if (flushTimer) return; // 既に予約済み
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void pushStudyData(true);
  }, FLUSH_DEBOUNCE_MS);
}

/**
 * 画面を離れるときの取りこぼし防止。
 *
 * ⚠️ beforeunload ではなく pagehide を使う。
 * iOS Safari は beforeunload を発火しないことがあり、
 * スマホで学習する生徒の分が最も失われやすいため。
 */
export function installStudySyncFlush(): () => void {
  const flush = () => {
    if (!isSyncEnabled()) return;
    void pushStudyData(true);
  };

  const onVisibility = () => {
    // タブが隠れる＝別アプリへ切り替えた瞬間に送る（スマホで最も多い離脱）
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') flush();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };
}

/** ログアウト時に状態を捨てる（別アカウントの進捗と混ざらないように） */
export function resetStudySyncState(): void {
  pullDoneForUid = null;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}
