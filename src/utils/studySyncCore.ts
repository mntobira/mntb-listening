/**
 * ===================================================================
 * 学習データ同期の「純粋ロジック」層（Firestore に依存しない）
 * ===================================================================
 *
 * -------------------------------------------------------------------
 * ■ なぜこのファイルが必要か
 * -------------------------------------------------------------------
 * これまで学習進捗（solved_problems_v1_*）と復習リスト（review_list_*）は
 * **端末の localStorage だけ**に保存されていた。Firestore に上がっていたのは
 * ランキングとフレンドだけで、学習データは一度も端末外へ出ていない。
 *
 * その結果、次の問題が起きていた。
 *   ① 機種変更・ブラウザ変更・キャッシュ削除で**進捗が全部消える**
 *   ② PC と スマホで進捗が別々になる
 *   ③ 先生が生徒の状況を見る手段が原理的に存在しない
 *
 * ①②は学習者にとって明確な不具合で、③は「教材として学校へ提供する」
 * 際の前提条件になる。よって進捗をサーバーに置く必要がある。
 *
 * -------------------------------------------------------------------
 * ■ 設計方針：localStorage を主、Firestore を従（オフライン優先）
 * -------------------------------------------------------------------
 * 「Firestore を唯一の正解」にすると、電車の中や学校の弱い Wi-Fi で
 * 解いた分が失われる。学習アプリでこれは致命的なので、
 *
 *     書き込みは常にまず localStorage → 後から Firestore へ上げる
 *     読み込みは 両方を取ってマージ（どちらも壊さない）
 *
 * という形にする。これにより通信が落ちていても学習は完全に継続でき、
 * オンラインに戻った時点で自動的に追いつく。
 *
 * -------------------------------------------------------------------
 * ■ なぜマージが安全に書けるのか（データ構造の幸運）
 * -------------------------------------------------------------------
 * 一般に双方向同期は「どちらが正しいか」が決まらず難しい。
 * しかし今回の2つのデータは、たまたま**衝突しない性質**を持っている。
 *
 *   ● 進捗 solvedMap: Record<"章ID::大問ID", 初回解答時刻ms>
 *       - progress.ts は「追記のみ・削除しない・初回時刻は上書きしない」
 *       - つまり集合の **和（union）** を取り、時刻は **小さい方**（より早い
 *         初回解答）を残せば、どの端末の事実も失われない。
 *       - 順序に依存しない（可換・結合的）ので、何回どの順でマージしても
 *         同じ結果になる。これは CRDT の grow-only map と同じ性質。
 *
 *   ● 復習リスト ReviewItem[]: key ごとに updatedAt を持つ
 *       - reviewList.ts が最初から updatedAt を用意していた（作者の意図）
 *       - key ごとに **updatedAt が新しい方を採用**すれば足りる。
 *       - ただし wrongCount / correctCount は「累計回数」なので、
 *         新しい方を採るだけだと別端末で解いた回数が消える。
 *         そこで回数系だけは **大きい方**を残す（後述）。
 *
 * -------------------------------------------------------------------
 * ■ 意図的に「やらない」こと
 * -------------------------------------------------------------------
 *   - 削除の同期はしない。片方で消えた項目を「消した」と解釈すると、
 *     未同期の端末の学習記録を誤って消す危険がある。復習リストの削除は
 *     手動操作なので、消えていないことによる害（また出てくる）より
 *     消えることによる害（記録が飛ぶ）の方が大きい。
 *   - ゲスト（未ログイン）は同期しない。uid が端末固有で、他人の記録と
 *     混ざる余地を作らないため。ログイン後に localStorage の分が
 *     マージされて引き継がれる。
 */

import type { ReviewItem } from './reviewList';

/** 進捗マップ（キー = `章ID::大問ID`、値 = 初回解答時刻 ms） */
export type SolvedMap = Record<string, number>;

// ===================================================================
// 進捗のマージ
// ===================================================================

/**
 * 進捗マップを2つマージする。
 *
 * - キーは和集合（どちらかで解いていれば「解いた」）
 * - 値は小さい方（より早い初回解答時刻を正とする）
 * - 不正な値（数値でない・0以下）は捨てるが、キー自体は残す
 *   （「解いた事実」は保ちつつ、時刻だけ相手側で補う）
 *
 * 可換かつ結合的なので、マージの順序や回数に結果が依存しない。
 */
export function mergeSolvedMaps(a: SolvedMap | null | undefined, b: SolvedMap | null | undefined): SolvedMap {
  const result: SolvedMap = {};

  const absorb = (source: SolvedMap | null | undefined) => {
    if (!source || typeof source !== 'object') return;
    Object.keys(source).forEach((key) => {
      if (!key) return;
      const raw = Number((source as Record<string, unknown>)[key]);
      const time = Number.isFinite(raw) && raw > 0 ? raw : 0;
      const current = result[key];
      if (current === undefined) {
        result[key] = time;
        return;
      }
      // どちらも有効な時刻なら早い方。片方が 0（不明）なら有効な方を採る。
      if (current === 0) result[key] = time;
      else if (time > 0 && time < current) result[key] = time;
    });
  };

  absorb(a);
  absorb(b);
  return result;
}

/**
 * マージ結果がローカルより増えているか（＝保存し直す価値があるか）。
 * 無駄な localStorage 書き込みと再レンダリングを避けるために使う。
 */
export function solvedMapChanged(before: SolvedMap, after: SolvedMap): boolean {
  const beforeKeys = Object.keys(before);
  const afterKeys = Object.keys(after);
  if (beforeKeys.length !== afterKeys.length) return true;
  return afterKeys.some((key) => before[key] !== after[key]);
}

// ===================================================================
// 復習リストのマージ
// ===================================================================

/**
 * 復習アイテムを1件マージする。
 *
 * 基本は updatedAt が新しい方を採用するが、
 * **累計回数（wrongCount / correctCount）だけは大きい方**を残す。
 *
 * 理由：スマホで2回間違え、PCで1回間違えた場合、
 * 「新しい方を採る」だけだと wrongCount が 1 に上書きされ、
 * 「何回つまずいたか」という評価上いちばん重要な情報が失われる。
 * 回数は単調増加なので max を取るのが実態に最も近い。
 *
 * box / dueAt は「今どの間隔で復習すべきか」という現在の状態なので、
 * 新しい方の判断を尊重する（回数と違って max では意味を成さない）。
 */
export function mergeReviewItem(a: ReviewItem, b: ReviewItem): ReviewItem {
  const aTime = Number.isFinite(a?.updatedAt) ? a.updatedAt : 0;
  const bTime = Number.isFinite(b?.updatedAt) ? b.updatedAt : 0;
  const newer = bTime > aTime ? b : a;
  const older = bTime > aTime ? a : b;

  const maxOf = (x: unknown, y: unknown): number => {
    const nx = Number.isFinite(Number(x)) ? Number(x) : 0;
    const ny = Number.isFinite(Number(y)) ? Number(y) : 0;
    return Math.max(nx, ny);
  };

  const createdA = Number.isFinite(a?.createdAt) ? a.createdAt : 0;
  const createdB = Number.isFinite(b?.createdAt) ? b.createdAt : 0;
  const created = createdA && createdB ? Math.min(createdA, createdB) : createdA || createdB;

  return {
    ...older,
    ...newer,
    // 累計は失わない
    wrongCount: maxOf(a?.wrongCount, b?.wrongCount),
    correctCount: maxOf(a?.correctCount, b?.correctCount),
    // 初回登録は早い方
    createdAt: created,
    updatedAt: Math.max(aTime, bTime),
  };
}

/**
 * 復習リストをマージする。
 * key が同じものは mergeReviewItem で統合し、片方にしか無いものはそのまま残す。
 * （削除は同期しない＝未同期端末の記録を消さない）
 */
export function mergeReviewLists(
  a: ReviewItem[] | null | undefined,
  b: ReviewItem[] | null | undefined,
): ReviewItem[] {
  const byKey = new Map<string, ReviewItem>();

  const absorb = (list: ReviewItem[] | null | undefined) => {
    if (!Array.isArray(list)) return;
    list.forEach((item) => {
      if (!item || typeof item.key !== 'string' || !item.key) return;
      const existing = byKey.get(item.key);
      byKey.set(item.key, existing ? mergeReviewItem(existing, item) : item);
    });
  };

  absorb(a);
  absorb(b);

  // 復習が近い順に並べておく（画面側で並べ直す手間を減らす）
  return Array.from(byKey.values()).sort((x, y) => (x.dueAt || 0) - (y.dueAt || 0));
}

/** 復習リストが変化したか（保存の必要判定用） */
export function reviewListChanged(before: ReviewItem[], after: ReviewItem[]): boolean {
  if (before.length !== after.length) return true;
  const map = new Map(before.map((item) => [item.key, item]));
  return after.some((item) => {
    const prev = map.get(item.key);
    if (!prev) return true;
    return (
      prev.box !== item.box ||
      prev.dueAt !== item.dueAt ||
      prev.wrongCount !== item.wrongCount ||
      prev.correctCount !== item.correctCount ||
      prev.updatedAt !== item.updatedAt
    );
  });
}

// ===================================================================
// Firestore へ載せる形への変換
// ===================================================================

/**
 * Firestore ドキュメントの1件あたりサイズ上限は 1MiB。
 * 復習リストは1件あたり最大でも数百バイトだが、問題文や解答を
 * 抱えているため、際限なく増やすと上限に触れる危険がある。
 *
 * 実際に上限へ達するのは数千件規模で、通常の学習では届かない。
 * ただし「届かないはず」で落ちるのが最悪なので、上限を決めて
 * **復習予定が近い順に残す**（＝いま必要な分を優先する）。
 */
export const MAX_SYNCED_REVIEW_ITEMS = 600;

/** 同期対象を絞る（due が近い順に MAX 件） */
export function limitReviewItemsForSync(items: ReviewItem[]): ReviewItem[] {
  if (items.length <= MAX_SYNCED_REVIEW_ITEMS) return items;
  return [...items].sort((a, b) => (a.dueAt || 0) - (b.dueAt || 0)).slice(0, MAX_SYNCED_REVIEW_ITEMS);
}

/**
 * 問題文・解答文はサイズを食うので、同期時は長さを切る。
 * 表示は「復習リスト」画面でのプレビュー用途なので、
 * 全文が無くても学習は成立する（問題本体はアプリ内データにある）。
 */
export const SYNCED_TEXT_MAX = 200;

function clip(value: unknown): string | undefined {
  if (typeof value !== 'string' || value === '') return undefined;
  return value.length <= SYNCED_TEXT_MAX ? value : `${value.slice(0, SYNCED_TEXT_MAX)}…`;
}

/**
 * Firestore へ書ける形（undefined を含まない）に整える。
 * Firestore は undefined を受け付けずエラーになるため、
 * 欠けている項目はキー自体を落とす。
 */
export function toSyncableReviewItem(item: ReviewItem): Record<string, unknown> {
  const out: Record<string, unknown> = {
    key: item.key,
    chapterId: item.chapterId,
    questionId: item.questionId,
    subQuestionId: item.subQuestionId,
    box: Number.isFinite(item.box) ? item.box : 0,
    dueAt: Number.isFinite(item.dueAt) ? item.dueAt : Date.now(),
    wrongCount: Number.isFinite(item.wrongCount) ? item.wrongCount : 0,
    correctCount: Number.isFinite(item.correctCount) ? item.correctCount : 0,
    createdAt: Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
    updatedAt: Number.isFinite(item.updatedAt) ? item.updatedAt : Date.now(),
  };

  const optional: Array<[string, unknown]> = [
    ['chapterTitle', clip(item.chapterTitle)],
    ['subLabel', clip(item.subLabel)],
    ['questionText', clip(item.questionText)],
    ['correctAnswer', clip(item.correctAnswer)],
    ['lastWrongAnswer', clip(item.lastWrongAnswer)],
    ['questionIndex', Number.isFinite(item.questionIndex as number) ? item.questionIndex : undefined],
  ];
  optional.forEach(([key, value]) => {
    if (value !== undefined) out[key] = value;
  });

  return out;
}

/** Firestore から取り出した生データを ReviewItem に戻す（壊れた行は捨てる） */
export function fromSyncedReviewItems(raw: unknown): ReviewItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((row): row is ReviewItem => {
    if (!row || typeof row !== 'object') return false;
    const item = row as Partial<ReviewItem>;
    return typeof item.key === 'string' && !!item.key && typeof item.chapterId === 'string';
  });
}
