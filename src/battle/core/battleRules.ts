/**
 * ===================================================================
 * battleRules — 教科ごとの対戦ルール（既定値）
 * ===================================================================
 *
 * ★このファイルは他の src を一切 import しない（葉モジュール）。★
 * 教科IDの文字列だけを持ち、問題データ本体には触らない。
 * （教科名の表示は画面側が data/subjectLabels.ts から引く）
 *
 * -------------------------------------------------------------------
 * ■ なぜ教科ごとにルールを分けるのか（実測に基づく必然性）
 * -------------------------------------------------------------------
 * 「全教科10問・全問12秒」で統一しようとすると、実データでは成立しない。
 *
 * ★2026-08-31 の方針変更★
 * 「問題が論理的に破綻している場合が多い」という指摘を受けて、
 * 対戦に出すのを ★元データが選択肢を持っている設問だけ★ に限定した
 * （＝対戦の問題は演習で解ける問題とまったく同じ内容になる）。
 * 短答・記述から誤答を借りて4択に作り替える動作（word / panel）は停止した。
 * 詳しい理由は scripts/gen-battle-pool.mts の冒頭と core/types.ts に書いてある。
 *
 * ★同日の追加：五十音キーボード（「みんはや」方式）★
 * 利用者から「1文字ずつ押していく方式をもっと導入してほしい」
 * 「ただし全ての問題をみんはや形式にしなくてもよい。四択問題も含めて」
 * と指定があったので、★選択式とかな入力を混ぜて出す★ことにした。
 * かな入力にするのはカタカナの答えだけ（表記ゆれが起きないため）。
 *
 * その結果、対戦に使える小問の数は次のようになった（npm run gen:battle-pool の実測）。
 *
 *   教科              4択   2〜3・5〜6択   かな入力   合計
 *   化学基礎         1574      178         24     1776
 *   生物基礎          228       21         41      290
 *   数学              239        1          0      240
 *   英語リスニング    146        0          0      146
 *   地理               77       50          0      127
 *   化学（発展）       78       22          1      101
 *   英文法            100        0          0      100
 *
 * ★この表は手書き作問が入るたびに変わる★（上は c1〜c6・生物基礎・数学・
 * 化学（発展）の手書きが入った後の実測値）。数え直すときは
 * `npm run gen:battle-pool` の最後に出る教科別の行をそのまま写すこと。
 *
 * ★かな入力が入ったことで生物基礎が22問→ 62問になった★。
 * この教科は用語の穴埋めが中心で選択肢を持つ設問が少なかったので、
 * かな入力の追加がそのまま収録数の回復になっている
 * （その後、手書き作問が入って 290問になった）。
 *
 * ★数学は解禁した（以前は enabled: false）★
 * 選択肢もカタカナの答えも無かったので出せなかったが、
 * 誤答まで出題者が用意した手書き問題が240問入ったので出せるようになった。
 * 経緯は下の math の項に残してある。
 *
 * 化学（発展）は10問だったが手書きで101問になったので、
 * 「同じ問題が出る」注意書きは実態に合わなくなりつつある
 * （note は残してあるが、さらに増えたら外してよい）。
 * リスニングは音声の再生時間そのものが必要なので、他教科と同じ秒数にできない。
 *
 * つまり「教科ごとに違う設定を持てること」は後から便利な機能ではなく、
 * ★無いと成立しない前提★である。
 *
 * -------------------------------------------------------------------
 * ■ formats と収録数の関係（ここを間違えると「選べるのに対戦できない」）
 * -------------------------------------------------------------------
 * ルールの formats に、その教科が1問も持っていない形式だけを書くと、
 * 教科選択には出るのに試合が始められない状態になる。
 * 収録数は ★形式別★ に data/battlePool.ts の poolCountOf() で数えること
 * （POOL_COUNTS は形式を問わない総数なので、この判定には使えない）。
 *
 * -------------------------------------------------------------------
 * ■ 既定値と Firestore の関係
 * -------------------------------------------------------------------
 * 既定値はこのファイルに持つ（＝Firestore を1回も読まずに対戦が始められる）。
 * `battle_rules/{教科ID}` にドキュメントがあればそれを優先する。
 * 運用で「数学だけ問題数を6問にする」といった調整を、
 * アプリを作り直さずに Firebase コンソールからできるようにするため。
 *
 * 読み取り回数はキャッシュで1セッション1回に抑える（data/battleRules 側で実装）。
 */

import type { BattleAnswerFormat, BattleRule } from './types';

/**
 * すべての教科に共通の土台。
 * ここを変えると全教科の既定が変わる。
 */
const BASE: Omit<BattleRule, 'subject'> = {
  enabled: true,
  questionCount: 10,
  timeLimitOverride: null,
  pointsCorrect: 100,
  pointsSpeedMax: 50,
  pointsStreak: 15,
  tiebreak: 'time',
  /**
   * ★選択式とかな入力を混ぜて出す★
   *
   * 利用者の指定は「みんはや形式をもっと導入してほしい。
   * ただし全てをそうしなくてよい。四択問題も含めて」だったので、
   * 3つの形式をすべて有効にしている。
   *   choice4 … 4択
   *   choice  … 2〜3択・5〜6択
   *   kana    … 五十音キーボードで1文字ずつ
   *
   * ★比率をここで固定していない★
   * 何問をかな入力にするかは kanaShare で指定する。
   * 形式の一覧（formats）と、そのうち何割をかな入力にするかは
   * 別の問題なので分けてある（formats をいじると
   * 「その形式を使わない」になってしまい、比率の調整にならない）。
   *
   * word / panel はプールに1問も無いので書かない
   * （書くとその分が0問になるだけ）。
   */
  formats: ['choice4', 'choice', 'kana'],
  /**
   * ★かな入力問題の割合（0〜1）★
   *
   * 0.3 なら10問のうち3問がかな入力で、残り7問は選択式になる。
   *
   * ★全問をかな入力にしない理由★
   * かな入力は思い出せないと ★完全に0点★ になる（選択式なら
   * 当てずっぽうでも当たる余地がある）。全問かな入力にすると
   * 覚えていない方が1問も取れず、対戦が成立しなくなる。
   * 3割なら「覚えている人が差をつけられる」と
   * 「覚えていなくても試合になる」の両方が成り立つ。
   *
   * 収録数が足りない場合は自動で減る（battleCore の出題組み立て側）。
   */
  kanaShare: 0.3,
  note: '',
};

/**
 * 教科ごとの既定ルール。
 *
 * ★ここに無い教科は「既定値（BASE）＋enabled:false」として扱う。★
 * 新しい教科のデータを後から追加したときは、
 *   1. データを src/data に足す
 *   2. npm run gen:battle-pool を実行してプールを作り直す
 *   3. このファイルに1件足して enabled: true にする
 * の3手順で対戦に出せるようになる。
 */
export const BATTLE_RULES: Readonly<Record<string, BattleRule>> = {
  "english_listening": {
    "enabled": true,
    "questionCount": 8,
    "timeLimitOverride": 55,
    "pointsCorrect": 100,
    "pointsSpeedMax": 20,
    "pointsStreak": 15,
    "tiebreak": "time",
    "formats": [
      "choice4"
    ],
    "kanaShare": 0,
    "note": "イヤホン推奨・聞き終えてから解答",
    "subject": "english_listening"
  },
  "english_grammar": {
    "enabled": true,
    "questionCount": 10,
    "timeLimitOverride": null,
    "pointsCorrect": 100,
    "pointsSpeedMax": 50,
    "pointsStreak": 15,
    "tiebreak": "time",
    "formats": [
      "choice4"
    ],
    "kanaShare": 0,
    "note": "",
    "subject": "english_grammar"
  },
  "english_vocab": {
    "enabled": true,
    "questionCount": 10,
    "timeLimitOverride": null,
    "pointsCorrect": 100,
    "pointsSpeedMax": 50,
    "pointsStreak": 15,
    "tiebreak": "time",
    "formats": [
      "choice4",
      "choice",
      "kana"
    ],
    "kanaShare": 0,
    "note": "",
    "subject": "english_vocab"
  }
};

/**
 * 教科IDから既定ルールを引く。
 *
 * ★未知の教科IDでも落ちない★
 * 教科データを追加してプールを作り直したあと、このファイルへの追記を
 * 忘れた場合に備えて、既定値ベースの「無効なルール」を返す。
 * こうすると「教科選択に出ない」だけで済み、画面が壊れることはない。
 */
export function defaultRuleOf(subject: string): BattleRule {
  const found = BATTLE_RULES[subject];
  if (found) return found;
  return { ...BASE, subject, enabled: false, note: '' };
}

/** 対戦が有効な教科IDの一覧（既定値ベース） */
export function defaultEnabledSubjects(): string[] {
  return Object.values(BATTLE_RULES)
    .filter((r) => r.enabled)
    .map((r) => r.subject);
}

/**
 * Firestore から読んだ不定形のデータを BattleRule に整える。
 *
 * ★なぜ1フィールドずつ検査するのか★
 * `battle_rules` は運用者が Firebase コンソールから手で編集する場所なので、
 * 打ち間違い（questionCount に文字列が入る、formats に存在しない形式が入る）が
 * 起こりうる。そのまま信じると対戦中に画面が壊れる。
 * ここで既定値に寄せておけば、打ち間違いは「その項目が既定に戻る」だけで済む。
 *
 * 数値には上限も設けている。questionCount に 999 を入れられると
 * 1試合の書き込みが増えて無料枠を食い潰すため。
 */
export function normalizeRule(subject: string, raw: unknown): BattleRule {
  const base = defaultRuleOf(subject);
  if (!["english_listening","english_grammar","english_vocab"].includes(subject)) return base;
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;

  const num = (v: unknown, fallback: number, min: number, max: number): number => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
    return Math.min(max, Math.max(min, Math.round(v)));
  };

  /**
   * ★ここに列挙し忘れた形式は「無かったこと」にされる★
   * 新しい形式を types.ts に足したら、必ずこの行にも足すこと。
   * 忘れると、運用者が Firestore にその形式を書いても静かに捨てられ、
   * 「設定したのに出ない」という原因の分かりにくい不具合になる。
   */
  const formats: BattleAnswerFormat[] = Array.isArray(r.formats)
    ? (r.formats.filter(
        (f): f is BattleAnswerFormat =>
          f === 'choice4' ||
          f === 'choice' ||
          f === 'kana' ||
          f === 'word' ||
          f === 'panel',
      ) as BattleAnswerFormat[])
    : base.formats;

  /**
   * かな入力の割合（0〜1）。
   *
   * ★整数に丸める num() を使えない★
   * num() は Math.round するので 0.3 が 0 になり、
   * 「かな入力が1問も出ない」に化ける。ここだけ小数のまま扱う。
   */
  const kanaShare: number =
    typeof r.kanaShare === 'number' && Number.isFinite(r.kanaShare)
      ? Math.min(1, Math.max(0, r.kanaShare))
      : base.kanaShare;

  return {
    ...(r.scoringVersion === 2 ? { scoringVersion: 2 as const } : {}),
    subject,
    enabled: typeof r.enabled === 'boolean' ? r.enabled : base.enabled,
    questionCount: num(r.questionCount, base.questionCount, 3, 20),
    timeLimitOverride:
      r.timeLimitOverride === null
        ? null
        : typeof r.timeLimitOverride === 'number'
          ? num(r.timeLimitOverride, 20, 5, 120)
          : base.timeLimitOverride,
    pointsCorrect: num(r.pointsCorrect, base.pointsCorrect, 1, 1000),
    pointsSpeedMax: num(r.pointsSpeedMax, base.pointsSpeedMax, 0, 500),
    pointsStreak: num(r.pointsStreak, base.pointsStreak, 0, 200),
    tiebreak:
      r.tiebreak === 'time' || r.tiebreak === 'sudden' || r.tiebreak === 'draw'
        ? r.tiebreak
        : base.tiebreak,
    formats: formats.length > 0 ? formats : base.formats,
    kanaShare,
    note: typeof r.note === 'string' ? r.note.slice(0, 120) : base.note,
  };
}
