/**
 * 学習の期間集計（日付のキー・学習した日の集合・直近 N 日の学習日数）（C-20）。
 * studySummary.ts から移した。中身は1文字も変えていない。studySummary.ts からも再エクスポートしている。
 * 日付だけを扱う純粋な関数なので、単体テストでそのまま確かめられる。
 */
import type { ReviewItem } from './reviewList';
import type { SolvedMap } from './studySyncCore';

const DAY_MS = 24 * 60 * 60 * 1000;

/** 日付を「その日の0時」に丸めた epoch ms（日単位の集計に使う） */
export function startOfDay(time: number): number {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** YYYY-MM-DD 文字列（CSV や表示に使う。ローカルタイム基準） */
export function toDateKey(time: number): string {
  const date = new Date(time);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// ===================================================================
// 学習した日の集計
// ===================================================================

/**
 * 進捗マップ（値 = 初回解答時刻）から「学習した日」の集合を作る。
 *
 * solvedMap は初回解答時刻しか持たないため、
 * 「2回目以降に解いた日」は拾えない。これは既知の限界で、
 * 少なく見積もる方向の誤差なので評価上は安全側に働く。
 * （復習リストの updatedAt も併せて見ることで精度を上げる）
 */
export function collectStudyDays(
  solved: SolvedMap | null | undefined,
  reviewItems: ReviewItem[] | null | undefined = [],
): string[] {
  const days = new Set<string>();

  if (solved && typeof solved === 'object') {
    Object.values(solved).forEach((time) => {
      const value = Number(time);
      if (Number.isFinite(value) && value > 0) days.add(toDateKey(value));
    });
  }

  if (Array.isArray(reviewItems)) {
    reviewItems.forEach((item) => {
      const value = Number(item?.updatedAt);
      if (Number.isFinite(value) && value > 0) days.add(toDateKey(value));
    });
  }

  return Array.from(days).sort();
}

/**
 * 直近 windowDays 日のうち、何日学習したか。
 * 「先週ちゃんとやったか」を見るための指標で、
 * 連続日数（streak）より実態を反映しやすい
 * （週末に休む生徒が不当に低く出ないため）。
 */
export function countActiveDaysWithin(
  studyDays: string[],
  windowDays: number,
  now: number = Date.now(),
): number {
  const threshold = startOfDay(now) - (windowDays - 1) * DAY_MS;
  return studyDays.filter((day) => {
    const time = new Date(`${day}T00:00:00`).getTime();
    return Number.isFinite(time) && time >= threshold;
  }).length;
}
