/**
 * ===================================================================
 * 豆知識の出し方（未読を優先して、必ず全部に出会えるようにする）
 * ===================================================================
 *
 * ■ 何が問題だったのか
 * これまでは毎回ただの `Math.random()` で1つ選んでいた。
 * 単純なランダムだと、
 *   ・直前と同じものが続けて出る
 *   ・何度もアプリを開いても一度も出ないものが残る
 * ということが普通に起きる。62個あっても「同じものばかり見る」体験になり、
 * せっかくの復習素材が届かない。
 *
 * ■ どうしたか
 * 「見たことがある ID」を localStorage に覚えておき、
 *   ① 未読があれば、未読の中からランダムに選ぶ
 *   ② 全部読み終えたら、既読をリセットして次の巡へ（ただし直前のものは避ける）
 * とした。これで
 *   ・すべての豆知識に必ず出会える（取りこぼしゼロ）
 *   ・「62個ぜんぶ読んだ」という区切りが作れる
 * という2つが同時に成立する。
 *
 * ■ 保存の作法
 * 既存の profile_/streak_/solved_problems_v1_ と同じく、uid ごとに分ける。
 * localStorage が使えない環境（プライベートモード等）でも
 * 例外で画面が落ちないよう、読み書きは必ず try/catch で包む。
 */
import { requireLocalStorage, safeParseJson, setItemOrThrow } from './safeLocalStorage';

export const SEEN_TIPS_KEY_PREFIX = 'seen_tips_v1_';
/** 直前に出したものを覚えて、2回連続で同じものが出ないようにする */
export const LAST_TIP_KEY_PREFIX = 'last_tip_v1_';

const storageKey = (prefix: string, uid: string | null | undefined): string =>
  `${prefix}${uid || 'guest'}`;

function safeRead(key: string): string | null {
  try {
    return requireLocalStorage().getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  try {
    setItemOrThrow(key, value);
  } catch {
    /* 保存できなくても表示は続ける（機能を止めない） */
  }
}

/** 既読の ID 一覧を読む。壊れたデータが入っていても空配列として扱う。 */
export function readSeenTipIds(uid: string | null | undefined): string[] {
  const parsed = safeParseJson<unknown[]>(safeRead(storageKey(SEEN_TIPS_KEY_PREFIX, uid)), [], Array.isArray);
  return parsed.filter((id): id is string => typeof id === 'string');
}

/** 既読として記録する（重複は持たない） */
export function markTipSeen(uid: string | null | undefined, id: string): void {
  const current = readSeenTipIds(uid);
  if (!current.includes(id)) current.push(id);
  safeWrite(storageKey(SEEN_TIPS_KEY_PREFIX, uid), JSON.stringify(current));
  safeWrite(storageKey(LAST_TIP_KEY_PREFIX, uid), id);
}

export interface TipPick<T> {
  tip: T;
  /** この巡で何個読み終えたか（この1つを含む） */
  seenCount: number;
  /** 全部で何個あるか */
  total: number;
  /** この1つで全部読み切ったか（＝ちょうど達成した瞬間） */
  justCompleted: boolean;
}

/**
 * 未読を優先して1つ選ぶ。
 *
 * @param tips  候補（空配列を渡してはならない。呼び出し側で保証する）
 * @param seenIds 既読 ID
 * @param lastId 直前に出した ID（連続を避けるため）
 * @param random 0以上1未満の乱数（テストから差し替えられるようにする）
 */
export function pickTip<T extends { id: string }>(
  tips: T[],
  seenIds: string[],
  lastId: string | null,
  random: () => number = Math.random,
): TipPick<T> | null {
  if (tips.length === 0) return null;

  const seen = new Set(seenIds.filter((id) => tips.some((tip) => tip.id === id)));
  const unseen = tips.filter((tip) => !seen.has(tip.id));

  if (unseen.length > 0) {
    const tip = unseen[Math.floor(random() * unseen.length) % unseen.length];
    return {
      tip,
      seenCount: seen.size + 1,
      total: tips.length,
      justCompleted: unseen.length === 1,
    };
  }

  // 全部読み終えている → 次の巡へ。直前と同じものは避ける。
  const candidates = tips.length > 1 && lastId ? tips.filter((tip) => tip.id !== lastId) : tips;
  const tip = candidates[Math.floor(random() * candidates.length) % candidates.length];
  return { tip, seenCount: tips.length, total: tips.length, justCompleted: false };
}

/** 次の巡を始めるために既読を消す（総数ぶん読み終えたときに呼ぶ） */
export function resetSeenTips(uid: string | null | undefined): void {
  safeWrite(storageKey(SEEN_TIPS_KEY_PREFIX, uid), JSON.stringify([]));
}

/** 直前に出した ID */
export function readLastTipId(uid: string | null | undefined): string | null {
  return safeRead(storageKey(LAST_TIP_KEY_PREFIX, uid));
}
