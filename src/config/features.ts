/**
 * ===================================================================
 * フィーチャーフラグ（公開/非公開の一元管理）
 * ===================================================================
 *
 * -------------------------------------------------------------------
 * ■ なぜこのファイルが必要なのか
 * -------------------------------------------------------------------
 * 「まだ完成していない機能が、ユーザーから見えてしまう」ことを防ぐため。
 *
 * これまでは公開/非公開の判断が画面ごとにバラバラに書かれていた。
 * 例えば科目カードには `available: true` というフラグが1つずつ
 * 手書きで置かれていたが、
 *
 *   ・そのフラグはカードの見た目にしか効かない
 *   ・ナビ・進捗一覧・復習タブ・遷移先の判定は別の場所で決まっている
 *
 * ため、「1か所だけ隠したつもりで、別の入口からは入れてしまう」
 * という状態が起こりうる。★これが一番まずい形である。★
 * 「隠れているのに触れる」のは、隠れていないより信頼を損なう。
 *
 * -------------------------------------------------------------------
 * ■ ★このフラグは「4箇所すべて」で参照すること★
 * -------------------------------------------------------------------
 * 隠すというのは「見えない」ことではなく「到達できない」ことである。
 * したがって次の4箇所すべてで同じフラグを見る。
 *
 *   1. ナビ           … 下部ナビのボタン（ランキングなど）
 *   2. トップのカード   … 科目選択画面のカード
 *   3. ルーティング     … 画面遷移の受け口（状態の復元も含む）
 *   4. 一覧・検索結果   … ホームの科目別進捗、復習リストの科目タブ、
 *                        先生ダッシュボードの科目一覧
 *
 * ★3（ルーティング）が抜けていると、ナビだけ隠しても
 *   保存済みの状態が復元されて中に入れてしまう。★
 * このアプリは URL でページを切り替えていない（画面状態は React の
 * state と localStorage で持っている）ので「URL直打ち」は存在しないが、
 * 代わりに ★localStorage に残った古い選択が復元される★ という
 * まったく同じ抜け道がある。だから 3 を必ず通す。
 *
 * 4箇所すべてを通っていることは tests/featureFlags.test.ts が
 * 機械的に検査する（人の記憶に頼らない）。
 *
 * -------------------------------------------------------------------
 * ■ このファイルは何も import しない（葉モジュール）
 * -------------------------------------------------------------------
 * ここから教科データや画面を import すると、
 * 「フラグを1つ見たいだけ」の場所が重いデータを引き込んでしまう。
 * ★何も import しないことが仕様である。★
 * （tests/featureFlags.test.ts がこれも検査する）
 */

/**
 * 公開/非公開の一覧。
 *
 * true  … ユーザーに見せる／入れる
 * false … ユーザーから完全に隠す（見えないし、入れない）
 *
 * ★false にした理由は必ずコメントに残すこと。★
 * 理由が書かれていないフラグは、後で誰も戻せなくなる。
 */
export const FEATURES = {
  "chemistry_basic": false,
  "chemistry": false,
  "listening": true,
  "english_grammar": true,
  "biology_basic": false,
  "geography": false,
  "math": false,
  "physics": false,
  "rika": false,
  "my_words": false,
  "bgm": false,
  "ranking": true,
  "battle": true
} as const;

export type FeatureKey = keyof typeof FEATURES;

/**
 * フラグを1つ引く。
 *
 * 未知のキーが来たときは false（＝隠す）を返す。
 * ★安全側を「隠す」に倒しているのは意図的である。★
 * 綴りを間違えたときに「うっかり公開される」よりも
 * 「うっかり隠れる」ほうが被害が小さい（隠れていればすぐ気づく）。
 */
export function isFeatureEnabled(key: string | null | undefined): boolean {
  if (!key) return false;
  return (FEATURES as Record<string, boolean>)[key] === true;
}

/**
 * 科目IDのフラグ名。
 *
 * ■ なぜ対応表が必要か
 *   科目IDと、先方の助言にあったフラグ名が完全一致していない。
 *     科目ID `english_listening`  ↔  フラグ名 `listening`
 *   IDを変えると保存済みの進捗・復習リストのキーが全部変わって
 *   ユーザーのデータが消えるので、★IDは変えずに対応表で吸収する。★
 *
 *   フラグ名を持たない科目IDが来た場合は「フラグ名なし」を返し、
 *   下の isSubjectEnabled が false（隠す）と判断する。
 *   ここでも安全側は「隠す」。
 */
const SUBJECT_FEATURE_KEY: Record<string, FeatureKey> = {
  chemistry_basic: 'chemistry_basic',
  chemistry: 'chemistry',
  english_listening: 'listening',
  english_grammar: 'english_grammar',
  biology_basic: 'biology_basic',
  geography: 'geography',
  math: 'math',
  physics: 'physics',
};

/**
 * その科目をユーザーに見せる／入れてよいか。
 *
 * 4箇所すべて（ナビ／カード／ルーティング／一覧）がこの1つの関数を呼ぶ。
 * 判断が1か所しかないので、片方だけ直して片方を忘れることが起きない。
 */
export function isSubjectEnabled(subjectId: string | null | undefined): boolean {
  if (!subjectId) return false;
  const key = SUBJECT_FEATURE_KEY[subjectId];
  if (!key) return false;
  return FEATURES[key] === true;
}

/**
 * 公開中の科目だけに絞る（一覧・検索結果用）。
 *
 * 一覧を作っている場所が「自分で if を書く」のをやめさせるための入口。
 * 呼び出し側は元の配列の形を保ったまま絞れる。
 */
export function filterEnabledSubjects<T>(
  list: readonly T[],
  getId: (item: T) => string,
): T[] {
  return (list || []).filter((item) => isSubjectEnabled(getId(item)));
}

/**
 * 非公開の科目が選ばれていたときに戻す先。
 *
 * localStorage に残った古い選択（例：数学を選んだ状態で非公開にした）を
 * 復元してしまわないようにするための受け口。
 * ★ここが「URL直打ち相当」の穴を塞ぐ場所である。★
 *
 * 公開中の科目が1つも無い場合は null を返す（呼び出し側が判断する）。
 * 「必ず化学基礎に倒す」と書いてしまうと、化学基礎を非公開にした日に
 * 非公開の科目へ倒す関数になってしまうため。
 */
export function fallbackSubjectId(candidates: readonly string[]): string | null {
  for (const id of candidates) {
    if (isSubjectEnabled(id)) return id;
  }
  return null;
}

/**
 * まだ公開しない「みんなで」系の機能（2026-10-05）。false の間は入口に「準備中」を出し、中身は開かない。
 *   classroom … 設定 › クラス（先生が作ったクラスに参加）
 *   manaClan  … 対戦 › マナクラン／ランキングのマナクランタブ
 * 理由：サーバー側（Cloud Functions・ルール）の公開準備がまだのため。公開するときは true にするだけ。
 */
export const SOCIAL_FEATURES = { classroom: false, manaClan: false } as const;
