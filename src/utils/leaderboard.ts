/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Firestore を使ったランキング同期ロジック
 *
 * コレクション設計:
 *   leaderboard_chapter / {chapterId}_{uid}
 *     - uid, nickname, photoURL, chapterId
 *     - bestScore, correctRate, totalCorrect, timeUsedSec
 *     - playedAt (Timestamp) ← 週間/月間集計用
 *
 *   leaderboard_total / {uid}
 *     - uid, nickname, photoURL
 *     - totalScore (全章ベストスコアの合計)
 *     - chapterScores (Record<chapterId, score>)
 *     - updatedAt (Timestamp)
 *
 *   leaderboard_events / {auto}
 *     - uid, nickname, photoURL
 *     - chapterId, score, correctRate
 *     - playedAt (Timestamp)  ← 週間/月間/全期間ランキングはこのコレクションから集計
 *
 * 仕様:
 *   - 章ベスト: 同一 chapterId & uid のドキュメントを 1 つだけ持つ（書き込み前に既存スコアと比較）
 *   - 全章合計: chapterScores を更新するたびに totalScore を再計算
 *   - 週間/月間: 全プレイ履歴(leaderboard_events)から playedAt の範囲で集計
 *   - ゲストモード（auth.currentUser が null）の場合は同期しない
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
} from './firestoreMetered';
import { db, auth } from '../firebase';
import { LEADERBOARD_PAGE_SIZE } from './scoring';
// ユーザーごとの localStorage キー名は utils/userStorageKeys.ts が唯一の定義
import { profileKey } from './userStorageKeys';
import { sanitizeNickname } from '../features/safety/nicknameFilter';

export interface ChapterScoreEntry {
  uid: string;
  nickname: string;
  photoURL?: string;
  chapterId: string;
  bestScore: number;
  correctRate: number;
  totalCorrect: number;
  totalQuestions: number;
  timeUsedSec: number;
  playedAt: Timestamp | null;
}

export interface TotalScoreEntry {
  uid: string;
  nickname: string;
  photoURL?: string;
  totalScore: number;
  chapterScores: Record<string, number>;
  updatedAt: Timestamp | null;
}

export type RankingPeriod = 'week' | 'month' | 'all';

export interface RankingResult<T> {
  rank: number;
  entry: T;
  isMe: boolean;
}

// ============================================================
// ニックネーム解決
// ============================================================

/**
 * プロフィール（localStorage）からニックネームを取得。
 * なければ displayName、それもなければ「名無しの化学者」を返す。
 */
export function resolveNickname(): string {
  const user = auth.currentUser;
  if (!user) return 'ゲスト';
  // ★他人の画面に出る名前なので、送る直前に必ず安全チェックを通す★
  //   （App Store 1.2。保存時にも弾くが、古い端末に残った名前もここで止める）
  try {
    const local = localStorage.getItem(profileKey(user.uid));
    if (local) {
      const p = JSON.parse(local);
      if (p && typeof p.name === 'string' && p.name.trim().length > 0) {
        return sanitizeNickname(p.name);
      }
    }
  } catch {
    // noop
  }
  return sanitizeNickname(user.displayName || '', '名無しの化学者');
}

// ============================================================
// ランキングへの参加登録（0pt でも掲載する）
// ============================================================

/** Legacy compatibility: learning-score ranking writes are retired. */
export async function ensureRankingEntry(): Promise<{ created: boolean }> {
  return { created: false };
}

// ============================================================
// 章スコア書き込み
// ============================================================

export interface SubmitChapterScoreInput {
  chapterId: string;
  score: number;
  correctRate: number;
  totalCorrect: number;
  totalQuestions: number;
  timeUsedSec: number;
}

/** Keep local learning records; never publish them as ranking scores. */
export async function submitChapterScore(
  _input: SubmitChapterScoreInput
): Promise<{ updated: boolean; previousBest: number }> {
  return { updated: false, previousBest: 0 };
}

// ============================================================
// ニックネーム変更の即時反映
// ============================================================

/** Update only the active battle-rating profile, without touching its rating. */
export async function syncRankingNickname(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const ref = doc(db, 'battle_ranking', user.uid);
    if (!(await getDoc(ref)).exists()) return;
    await setDoc(ref, { nickname: resolveNickname(), photoURL: user.photoURL || '' }, { merge: true });
  } catch (e) {
    console.warn('[Leaderboard] nickname sync failed:', e);
  }
}

// ============================================================
// ランキング取得
// ============================================================

/**
 * 章ベストランキングを取得（上位 N 件）
 */
export async function fetchChapterRanking(
  chapterId: string,
  topN: number = LEADERBOARD_PAGE_SIZE
): Promise<RankingResult<ChapterScoreEntry>[]> {
  const me = auth.currentUser;
  try {
    // chapterId の単一条件で取得してクライアント側で並べる。
    // 複合インデックスが未デプロイの環境でもランキングを確実に表示できる。
    const q = query(collection(db, 'leaderboard_chapter'), where('chapterId', '==', chapterId));
    const snaps = await getDocs(q);
    const entries = snaps.docs
      .map((item) => item.data() as ChapterScoreEntry)
      .sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0) || (a.timeUsedSec || 0) - (b.timeUsedSec || 0))
      .slice(0, topN);
    return entries.map((entry, index) => ({
      rank: index + 1,
      entry,
      isMe: !!me && entry.uid === me.uid,
    }));
  } catch (e) {
    console.error('[Leaderboard] fetchChapterRanking failed:', e);
    return [];
  }
}

/**
 * 全章合計ランキングを取得
 *
 * ■ 0pt のユーザーも掲載する（ご要望）
 *   ensureRankingEntry() がログイン時に totalScore: 0 の枠を作るため、
 *   Google 連携済みのユーザーは全員このコレクションに存在する。
 *   ここでは絞り込み（where）を一切かけないので、0pt の人もそのまま並ぶ。
 *
 * ■ 同点の並び順
 *   Firestore の orderBy('totalScore','desc') だけでは同点内の順序が
 *   ドキュメントID順（実質ランダム）になり、0pt の人が大量に並ぶと
 *   毎回順番が入れ替わって落ち着かない。
 *   そこで取得後に「スコア降順 → 更新が新しい順 → 名前順」で安定化させる。
 *
 * ■ 同順位の扱い
 *   同点なら同じ順位を与える（0pt の人が全員違う順位になるのは不自然なため）。
 *   例：100pt, 50pt, 0pt, 0pt, 0pt → 1位, 2位, 3位, 3位, 3位
 */
export async function fetchTotalRanking(
  topN: number = LEADERBOARD_PAGE_SIZE
): Promise<RankingResult<TotalScoreEntry>[]> {
  const me = auth.currentUser;
  try {
    const q = query(
      collection(db, 'leaderboard_total'),
      orderBy('totalScore', 'desc'),
      limit(topN)
    );
    const snaps = await getDocs(q);
    const entries: TotalScoreEntry[] = [];
    snaps.forEach((s) => entries.push(s.data() as TotalScoreEntry));

    entries.sort((a, b) => {
      const diff = (b.totalScore || 0) - (a.totalScore || 0);
      if (diff !== 0) return diff;
      // 同点：最近プレイした人を上に（0pt 同士でも順序が毎回変わらないようにする）
      const at = a.updatedAt?.toMillis?.() ?? 0;
      const bt = b.updatedAt?.toMillis?.() ?? 0;
      if (bt !== at) return bt - at;
      return (a.nickname || '').localeCompare(b.nickname || '', 'ja');
    });

    const list: RankingResult<TotalScoreEntry>[] = [];
    let rank = 0;
    let prevScore: number | null = null;
    entries.forEach((entry, index) => {
      const score = entry.totalScore || 0;
      // 同点は同順位。違うスコアになったら「その要素の通し番号」を順位にする。
      if (prevScore === null || score !== prevScore) rank = index + 1;
      prevScore = score;
      list.push({ rank, entry, isMe: !!me && entry.uid === me.uid });
    });
    return list;
  } catch (e) {
    console.error('[Leaderboard] fetchTotalRanking failed:', e);
    return [];
  }
}

/**
 * 期間ランキング（週間 / 月間 / 全期間）
 * leaderboard_events を期間で絞り、uid ごとに最高スコアを集計する。
 */
export async function fetchPeriodRanking(
  period: RankingPeriod,
  topN: number = LEADERBOARD_PAGE_SIZE
): Promise<RankingResult<{ uid: string; nickname: string; photoURL?: string; bestScore: number; playCount: number }>[]> {
  const me = auth.currentUser;
  try {
    let since: Date | null = null;
    if (period === 'week') {
      since = new Date();
      since.setDate(since.getDate() - 7);
    } else if (period === 'month') {
      since = new Date();
      since.setMonth(since.getMonth() - 1);
    }

    const constraints: any[] = [orderBy('playedAt', 'desc'), limit(500)];
    if (since) {
      constraints.unshift(where('playedAt', '>=', Timestamp.fromDate(since)));
    }
    const q = query(collection(db, 'leaderboard_events'), ...constraints);
    const snaps = await getDocs(q);

    // イベントは playedAt 降順で届く＝各 uid の最初の1件が「最新のプレイ」。
    // 名前・アイコンはその最新イベントの値を使う。
    // （events はルール上 create 専用で書き換えられないため、
    //   プロフィール改名後の名前は「いちばん新しいプレイの記録」にしか
    //   入っていない。ベストスコア時点の古い名前で上書きしない。）
    const bucket = new Map<string, { uid: string; nickname: string; photoURL?: string; bestScore: number; playCount: number }>();
    snaps.forEach((s) => {
      const d = s.data() as any;
      const cur = bucket.get(d.uid);
      if (!cur) {
        bucket.set(d.uid, {
          uid: d.uid,
          nickname: d.nickname || '名無しの化学者',
          photoURL: d.photoURL || '',
          bestScore: d.score || 0,
          playCount: 1,
        });
      } else {
        cur.playCount += 1;
        if ((d.score || 0) > cur.bestScore) {
          cur.bestScore = d.score;
        }
      }
    });

    const sorted = [...bucket.values()].sort((a, b) => b.bestScore - a.bestScore).slice(0, topN);
    return sorted.map((entry, i) => ({
      rank: i + 1,
      entry,
      isMe: !!me && entry.uid === me.uid,
    }));
  } catch (e) {
    console.error('[Leaderboard] fetchPeriodRanking failed:', e);
    return [];
  }
}

/**
 * 自分の章ベストスコアを取得（カード表示用）
 */
export async function fetchMyChapterBest(chapterId: string): Promise<number> {
  const user = auth.currentUser;
  if (!user) return 0;
  try {
    const ref = doc(db, 'leaderboard_chapter', `${chapterId}_${user.uid}`);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data() as ChapterScoreEntry;
      return d.bestScore || 0;
    }
  } catch (e) {
    console.error('[Leaderboard] fetchMyChapterBest failed:', e);
  }
  return 0;
}

/**
 * 自分の全章合計スコアを取得
 */
export async function fetchMyTotalScore(): Promise<TotalScoreEntry | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const ref = doc(db, 'leaderboard_total', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as TotalScoreEntry;
  } catch (e) {
    console.error('[Leaderboard] fetchMyTotalScore failed:', e);
  }
  return null;
}
