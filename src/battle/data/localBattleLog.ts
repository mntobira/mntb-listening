/**
 * ===================================================================
 * 端末内の対戦ログ（2026-10-04）
 * ===================================================================
 *
 * 「部屋（対戦を始める前の画面）に学習の履歴を置いて、そこで次の問題を選べるように」
 * というご指示のための小さな記録。
 *
 * ★Firestore の battle_history を使わない理由★
 *   battle_history はオンライン対戦（フレンド・全国）しか書かれず、ログインも必要。
 *   AI 対戦（いちばん多い遊び方）やゲストの試合が部屋に出てこない。
 *   部屋で「さっきの単元をもう一度」を選ぶための記録なので、端末内に直近だけ持てば足りる。
 *
 * 保存するのは「教科・単元・勝敗・点数・間違えた問題ID（最大30）」だけ。個人情報は持たない。
 */

export interface LocalBattleLogItem {
  /** 同じ試合を2回書かないための鍵（部屋ID・AI の試合番号など） */
  key: string;
  subject: string;
  /** 単元を選んだ試合だけ。全単元なら undefined */
  chapterId?: string;
  /** 画面に出す単元名（なければ教科名だけ出す） */
  chapterTitle?: string;
  outcome: 'win' | 'lose' | 'draw';
  correct: number;
  total: number;
  wrongIds: string[];
  mode: 'ai' | 'friend' | 'national';
  at: number;
}

const KEY_PREFIX = 'battle_local_log_v1_';
const MAX_ITEMS = 12;

const keyOf = (uid: string | null | undefined) => `${KEY_PREFIX}${uid || 'guest'}`;

function isItem(v: unknown): v is LocalBattleLogItem {
  if (!v || typeof v !== 'object') return false;
  const x = v as Record<string, unknown>;
  return typeof x.key === 'string' && typeof x.subject === 'string'
    && (x.outcome === 'win' || x.outcome === 'lose' || x.outcome === 'draw')
    && typeof x.correct === 'number' && typeof x.total === 'number'
    && Array.isArray(x.wrongIds) && typeof x.at === 'number';
}

export function loadLocalBattleLog(uid: string | null | undefined): LocalBattleLogItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(keyOf(uid)) || '[]');
    return (Array.isArray(raw) ? raw : []).filter(isItem).slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

/** 試合を1件足す（同じ key は上書き。新しい順に最大12件） */
export function recordLocalBattle(uid: string | null | undefined, item: LocalBattleLogItem): void {
  try {
    const rest = loadLocalBattleLog(uid).filter((x) => x.key !== item.key);
    const next = [{ ...item, wrongIds: item.wrongIds.slice(0, 30) }, ...rest].slice(0, MAX_ITEMS);
    localStorage.setItem(keyOf(uid), JSON.stringify(next));
  } catch {
    // 保存できなくても対戦結果には影響させない
  }
}
