/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 復習リスト（間違えた問題）ユーティリティ
 *
 * 設計方針:
 *   - 端末内 localStorage をソース・オブ・トゥルースとして完結（オフラインでも動作）。
 *   - 誤答は採点時に自動でキャプチャし、忘却曲線（間隔反復）で再出題スケジュールを持つ。
 *   - ゲスト（未ログイン）でも uid = 'guest' として同じ仕組みで保存できる。
 *   - 将来的な Firestore 同期に備え、各アイテムは updatedAt を持ち「新しい方優先」でマージ可能な形にしている。
 *     （本PRではローカル完結。Firestore 同期は後続PRで addReviewItems() 等の純データ関数を再利用する）
 *
 * ⚠️ データエクスポート系（// DO NOT MODIFY / protected 領域）には一切触れない。
 *    これは新規の独立モジュールであり、既存の problem JSON / Firestore スキーマを変更しない。
 */

import {
  fingerprintProblem,
  detectStale,
  type CurrentProblemState,
} from './problemVersion';

const STORAGE_PREFIX = 'review_list_';

/**
 * 忘却曲線（間隔反復）の復習間隔（日数）。
 * box 0 = 当日, box 1 = 翌日, box 2 = 3日後 ... と段階的に間隔を伸ばす。
 * 正解するたびに box を1つ進め、間違えると box 0 に戻す。
 */
export const REVIEW_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30, 60] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReviewItem {
  /** 一意キー: `${chapterId}::${questionId}::${subQuestionId}` */
  key: string;
  chapterId: string;
  chapterTitle?: string;
  /** 章内の問題番号（1始まり、表示用） */
  questionIndex?: number;
  questionId: string;
  subQuestionId: string;
  /** 設問ラベル（例: 「(1)」「問1」） */
  subLabel?: string;
  /** 問題文（プレビュー用、長い場合は呼び出し側で切り詰め） */
  questionText?: string;
  /** 正答（表示用） */
  correctAnswer?: string;
  /** 直近に誤答した際のユーザー解答（表示用） */
  lastWrongAnswer?: string;
  /** 間隔反復のボックス番号（0〜REVIEW_INTERVALS_DAYS.length-1） */
  box: number;
  /** 次回復習予定日時（epoch ms）。この時刻を過ぎたものが「復習対象」 */
  dueAt: number;
  /** 累計の間違い回数 */
  wrongCount: number;
  /** 累計の正解回数（復習で正解した回数） */
  correctCount: number;
  /** 初回登録日時 */
  createdAt: number;
  /** 最終更新日時（Firestore マージ時の勝敗判定に使用） */
  updatedAt: number;
  /**
   * 登録した時点の問題本文の指紋（utils/problemVersion.ts）。
   *
   * ★何のためにあるか★
   *   同じIDのまま問題を差し替えると、ここに残っている
   *   問題文・正答が古いまま復習リストに居座る。
   *   ユーザーから見ると「こんな問題、登録してない」になる。
   *   指紋を持たせておけば、いま配信している問題と
   *   食い違ったことを機械的に検知して外せる。
   *
   * ★任意（省略可）にしている理由★
   *   この仕組みを入れる前に登録された分には指紋が無い。
   *   必須にすると、導入した瞬間に全ユーザーの復習リストが
   *   「指紋なし＝不正」として消える。指紋が無い間は
   *   今までと完全に同じ扱いにし、次にその問題に
   *   出会ったときに入る。
   */
  fingerprint?: string;
}

function storageKey(uid: string | null | undefined): string {
  return `${STORAGE_PREFIX}${uid || 'guest'}`;
}

function makeItemKey(chapterId: string, questionId: string, subQuestionId: string): string {
  return `${chapterId}::${questionId}::${subQuestionId}`;
}

/** 指定日数後の epoch ms を返す（当日基準、時刻はそのまま） */
function dueAfterDays(days: number, from: number = Date.now()): number {
  return from + days * DAY_MS;
}

function boxToDue(box: number, from: number = Date.now()): number {
  const clamped = Math.max(0, Math.min(box, REVIEW_INTERVALS_DAYS.length - 1));
  return dueAfterDays(REVIEW_INTERVALS_DAYS[clamped], from);
}

// ============================================================
// 読み書き（純粋なストレージ操作）
// ============================================================

export function loadReviewList(uid: string | null | undefined): ReviewItem[] {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ReviewItem[];
  } catch {
    return [];
  }
}

export function saveReviewList(uid: string | null | undefined, items: ReviewItem[]): void {
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(items));
  } catch {
    /* noop: ストレージ枯渇時などは黙って無視 */
  }
}

// ============================================================
// キャプチャ（採点時に呼ばれる）
// ============================================================

export interface WrongAnswerInput {
  chapterId: string;
  chapterTitle?: string;
  questionIndex?: number;
  questionId: string;
  subQuestionId: string;
  subLabel?: string;
  questionText?: string;
  correctAnswer?: string;
  wrongAnswer?: string;
}

/**
 * 誤答を1件、復習リストに登録（既存なら間違い回数を加算しスケジュールを box 0 に戻す）。
 * 副作用なし版（items を受け取り新配列を返す）。ストレージ書き込みは行わない。
 */
export function upsertWrongAnswer(items: ReviewItem[], input: WrongAnswerInput): ReviewItem[] {
  const key = makeItemKey(input.chapterId, input.questionId, input.subQuestionId);
  const now = Date.now();
  const idx = items.findIndex((it) => it.key === key);

  if (idx === -1) {
    const newItem: ReviewItem = {
      key,
      chapterId: input.chapterId,
      chapterTitle: input.chapterTitle,
      questionIndex: input.questionIndex,
      questionId: input.questionId,
      subQuestionId: input.subQuestionId,
      subLabel: input.subLabel,
      questionText: input.questionText,
      correctAnswer: input.correctAnswer,
      lastWrongAnswer: input.wrongAnswer,
      box: 0,
      dueAt: boxToDue(0, now),
      wrongCount: 1,
      correctCount: 0,
      createdAt: now,
      updatedAt: now,
      // 登録した時点の問題の指紋を一緒に残す。
      // あとで問題を差し替えたときに「古い内容が居座っている」ことを
      // 機械的に検知できるようにするため（utils/problemVersion.ts）。
      fingerprint: fingerprintProblem({
        questionText: input.questionText,
        correctAnswer: input.correctAnswer,
        subLabel: input.subLabel,
      }),
    };
    return [...items, newItem];
  }

  // 既存: 間違えたので box を 0 に戻し、当日復習対象へ
  const existing = items[idx];
  const updated: ReviewItem = {
    ...existing,
    // 表示情報は最新で上書き（問題文修正などに追従）
    chapterTitle: input.chapterTitle ?? existing.chapterTitle,
    questionIndex: input.questionIndex ?? existing.questionIndex,
    subLabel: input.subLabel ?? existing.subLabel,
    questionText: input.questionText ?? existing.questionText,
    correctAnswer: input.correctAnswer ?? existing.correctAnswer,
    lastWrongAnswer: input.wrongAnswer ?? existing.lastWrongAnswer,
    box: 0,
    dueAt: boxToDue(0, now),
    wrongCount: existing.wrongCount + 1,
    updatedAt: now,
    // 表示情報を最新で上書きしたので、指紋も同じ内容から取り直す。
    // ★ここで取り直さないと、本文だけ新しく指紋だけ古い★
    // という一番たちの悪い状態（検知しても直らない）になる。
    // なお input 側が空のときは既存の表示情報がそのまま残るため、
    // 上の ?? と同じ材料から作れば必ず整合する。
    fingerprint: fingerprintProblem({
      questionText: input.questionText ?? existing.questionText,
      correctAnswer: input.correctAnswer ?? existing.correctAnswer,
      subLabel: input.subLabel ?? existing.subLabel,
    }),
  };
  const next = items.slice();
  next[idx] = updated;
  return next;
}

/**
 * 複数の誤答をまとめて登録し、localStorage へ保存する（採点時の呼び出し口）。
 */
export function captureWrongAnswers(
  uid: string | null | undefined,
  inputs: WrongAnswerInput[]
): void {
  if (!inputs || inputs.length === 0) return;
  let items = loadReviewList(uid);
  for (const input of inputs) {
    items = upsertWrongAnswer(items, input);
  }
  saveReviewList(uid, items);
}

// ============================================================
// 復習操作（ユーザーが「できた」「まだ」を押す）
// ============================================================

/**
 * 復習で正解 → box を1つ進め、次回予定日を先送りする。
 * 最終ボックスまで到達したら習得済みとして扱えるよう correctCount を加算。
 */
export function markReviewedCorrect(uid: string | null | undefined, key: string): ReviewItem[] {
  const items = loadReviewList(uid);
  const now = Date.now();
  const next = items.map((it) => {
    if (it.key !== key) return it;
    const nextBox = Math.min(it.box + 1, REVIEW_INTERVALS_DAYS.length - 1);
    return {
      ...it,
      box: nextBox,
      dueAt: boxToDue(nextBox, now),
      correctCount: it.correctCount + 1,
      updatedAt: now,
    };
  });
  saveReviewList(uid, next);
  // Optional personal reward; never block review scheduling or add growth code to initial study load.
  if (uid && items.some(it => it.key === key)) {
    void import('../battle/data/growthStore').then(({ recordReviewGrowth }) => recordReviewGrowth(uid, key)).catch(() => {});
  }
  return next;
}

/**
 * 復習で不正解 → box を 0 に戻して当日再出題対象へ。
 */
export function markReviewedWrong(uid: string | null | undefined, key: string): ReviewItem[] {
  const items = loadReviewList(uid);
  const now = Date.now();
  const next = items.map((it) => {
    if (it.key !== key) return it;
    return {
      ...it,
      box: 0,
      dueAt: boxToDue(0, now),
      wrongCount: it.wrongCount + 1,
      updatedAt: now,
    };
  });
  saveReviewList(uid, next);
  return next;
}

/**
 * 復習リストから完全に削除（「マスターした」「不要」）。
 */
export function removeReviewItem(uid: string | null | undefined, key: string): ReviewItem[] {
  const items = loadReviewList(uid).filter((it) => it.key !== key);
  saveReviewList(uid, items);
  return items;
}

/**
 * ユーザーが手動で1問を復習に追加する（採点フロー外からの導線）。
 */
export function addReviewItemManually(
  uid: string | null | undefined,
  input: WrongAnswerInput
): ReviewItem[] {
  const items = upsertWrongAnswer(loadReviewList(uid), input);
  saveReviewList(uid, items);
  return items;
}

// ============================================================
// 参照系（表示・スケジュール判定）
// ============================================================

/** 今復習すべき（dueAt <= now）アイテムのみを、緊急度順（古い予定日→間違い回数）で返す */
export function getDueReviewItems(
  uid: string | null | undefined,
  now: number = Date.now()
): ReviewItem[] {
  return loadReviewList(uid)
    .filter((it) => it.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt || b.wrongCount - a.wrongCount);
}

/** 全アイテムを更新日時の新しい順で返す（一覧表示用） */
export function getAllReviewItems(uid: string | null | undefined): ReviewItem[] {
  return loadReviewList(uid).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** 復習対象件数（バッジ表示用） */
export function getDueCount(uid: string | null | undefined, now: number = Date.now()): number {
  return loadReviewList(uid).reduce((n, it) => (it.dueAt <= now ? n + 1 : n), 0);
}

/**
 * ===================================================================
 * 差し替えられた問題を復習リストから外す
 * ===================================================================
 *
 * ■ いつ呼ぶか
 *   問題データを読み込んでいる画面（復習リスト・学習ノート）で、
 *   一覧を出す直前に1回だけ呼ぶ。
 *
 * ■ ★「調べていないものは触らない」を徹底する★
 *   getCurrent が 'unknown' を返した件は、食い違っているかどうか
 *   判断できないので★何もしない★。
 *   判断できないものを消すのは、ユーザーのデータを理由なく壊す行為。
 *   （判定そのものは utils/problemVersion.ts の detectStale が持つ。
 *     ここはストレージ側の受け口だけを担当する。）
 *
 * ■ 返り値
 *   { items, removed } — removed は外した件数。
 *   0 件なら保存もしない（書き込みを増やさない）。
 *
 * ■ なぜ「非表示」ではなく「削除」なのか
 *   残したまま隠すと、件数バッジと一覧の数が食い違う。
 *   「3件あるはずなのに開くと0件」は原因が分からない不具合の典型。
 *   古い問題は解いても意味がないので、外すのが正しい。
 */
export function purgeStaleReviewItems(
  uid: string | null | undefined,
  getCurrent: (item: ReviewItem) => CurrentProblemState,
): { items: ReviewItem[]; removed: number } {
  const items = loadReviewList(uid);
  if (items.length === 0) return { items, removed: 0 };

  const kept = items.filter((it) => {
    let current: CurrentProblemState;
    try {
      current = getCurrent(it);
    } catch {
      // 問い合わせ側が転んだ場合は「調べられなかった」扱いにして残す。
      // ここで消すと、一時的な不具合でユーザーのデータが失われる。
      return true;
    }
    return detectStale(it.fingerprint, current) === null;
  });

  const removed = items.length - kept.length;
  if (removed > 0) saveReviewList(uid, kept);
  return { items: kept, removed };
}

/** アイテムが「習得済み」とみなせるか（最終ボックス到達） */
export function isMastered(item: ReviewItem): boolean {
  return item.box >= REVIEW_INTERVALS_DAYS.length - 1;
}

/**
 * ===================================================================
 * 画面から使う「復習の3操作」をまとめて作る
 * ===================================================================
 *
 * ■ なぜこれを置いたのか
 *   復習リスト画面（components/ReviewList.tsx）と
 *   学習ノート画面（components/StudyHub.tsx）に、
 *   まったく同じ形のハンドラが3つずつ、合計6つ書かれていた。
 *
 *     const handleCorrect = (key) => { markReviewedCorrect(uid, key); refresh(); };
 *     const handleWrong   = (key) => { markReviewedWrong(uid, key);   refresh(); };
 *     const handleRemove  = (key) => { removeReviewItem(uid, key);    refresh(); };
 *
 *   「保存してから画面を作り直す」という手順は復習操作の要で、
 *   順序を逆にすると更新前の内容が表示されてしまう。
 *   2か所に写してあると、片方だけ直して食い違う危険がある。
 *
 * ■ ★refresh を引数で受け取る理由（ここが重要）★
 *   2画面の refresh は**中身が違う**。
 *
 *     ReviewList: setNow() + setItems(getAllReviewItems(uid))
 *     StudyHub  : setNow() + setReviewItems(getAllReviewItems(uid))
 *                 ＋ setNotes(loadNotes())   ← ノートも読み直す
 *
 *   そのため「refresh の中身まで」共通化してはいけない。
 *   （StudyHub のノート再読込が消えるという壊し方をする）
 *   共通化するのは順序だけにとどめ、
 *   何を作り直すかは各画面が渡す関数に任せる。
 *
 * @param uid     ログイン中のユーザーID（ゲストは null でよい）
 * @param refresh 保存後に画面を作り直す処理。画面ごとに中身が違う。
 */
export function createReviewActions(
  uid: string | null | undefined,
  refresh: () => void,
) {
  return {
    /** 復習で正解 → 次回予定日を先送りしてから画面を更新 */
    handleCorrect: (key: string) => {
      markReviewedCorrect(uid, key);
      refresh();
    },
    /** 復習で不正解 → 当日再出題に戻してから画面を更新 */
    handleWrong: (key: string) => {
      markReviewedWrong(uid, key);
      refresh();
    },
    /** 復習リストから削除してから画面を更新 */
    handleRemove: (key: string) => {
      removeReviewItem(uid, key);
      refresh();
    },
  };
}

// ============================================================
// 問題ごとのまとまり（2026-10-04 ご要望）
// ============================================================
//
// 記録は小問ごと（問4だけ間違えたら問4だけ）に持つ。
// ただし一覧に小問を1行ずつ並べると数が多すぎるので、
// 「同じ大問（回）で間違えた小問」は1枚のカードにまとめて見せ、
// 解き直すときもその小問だけを出す（問1〜5をすべて解き直させない）。

export interface ReviewGroup {
  /** `${chapterId}::${questionId}` */
  key: string;
  chapterId: string;
  questionId: string;
  items: ReviewItem[];
  /** 解き直す小問ID（items の並び＝問番号順） */
  subQuestionIds: string[];
  /** いちばん早い復習予定 */
  dueAt: number;
  wrongCount: number;
}

const subNo = (it: ReviewItem) => {
  const m = String(it.subLabel || '').match(/問\s*(\d+)/u) || String(it.subQuestionId).match(/_(\d+)$/u);
  return m ? Number(m[1]) : 0;
};

/** 小問ごとの復習アイテムを、大問（回）ごとにまとめる。並びは元の items の順（最初に出てきた順）を保つ */
export function groupReviewItems(items: ReviewItem[]): ReviewGroup[] {
  const map = new Map<string, ReviewGroup>();
  for (const it of items) {
    const key = `${it.chapterId}::${it.questionId}`;
    let g = map.get(key);
    if (!g) { g = { key, chapterId: it.chapterId, questionId: it.questionId, items: [], subQuestionIds: [], dueAt: it.dueAt, wrongCount: 0 }; map.set(key, g); }
    g.items.push(it);
    g.dueAt = Math.min(g.dueAt, it.dueAt);
    g.wrongCount = Math.max(g.wrongCount, it.wrongCount);
  }
  for (const g of map.values()) {
    g.items.sort((a, b) => subNo(a) - subNo(b));
    g.subQuestionIds = g.items.map(it => it.subQuestionId);
  }
  return [...map.values()];
}

/** 解き直しの結果を反映する：正解した小問は「できた」、間違えた小問は採点時に自動で当日へ戻る */
export function applyReviewRetry(
  uid: string | null | undefined,
  chapterId: string,
  questionId: string,
  results: { subQuestionId: string; correct: boolean }[],
): void {
  for (const r of results) {
    if (r.correct) markReviewedCorrect(uid, makeItemKey(chapterId, questionId, r.subQuestionId));
  }
}
