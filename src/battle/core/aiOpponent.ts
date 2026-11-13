/**
 * ===================================================================
 * AI 対戦相手 — 強さのプリセットと「いつ・何を答えるか」の決定
 * ===================================================================
 *
 * ★この葉モジュールは Firebase も React も import しない★
 * 対戦の点数計算（battleCore.ts）と同じく純関数だけで書き、
 * テストで「よわい AI は本当に弱いか」を数値で確かめられるようにする。
 *
 * -------------------------------------------------------------------
 * ■ AI 対戦を「Firestore を使わないローカル対戦」にした理由
 * -------------------------------------------------------------------
 * 全国対戦は「相手がいないと始まらない」ので、人が少ない時間帯は
 * 数分待っても始まらない（利用者から「壊れている」と見える）。
 * AI 相手なら待ち時間ゼロで、同じ出題・同じ制限時間・同じ点数計算で
 * 練習できる。
 *
 * 部屋を Firestore に置かない理由:
 *   ・相手が端末の中にいるので同期する必要がない
 *   ・書き込み回数（無料枠）を1回も使わない
 *   ・ルール上「2人部屋で相手の申告が一致したとき」しかレートが動かない
 *     ので、そもそも AI 戦はレートを動かせない（動かすべきでもない。
 *     AI に勝ってもレートが上がるなら、全国で戦う理由が無くなる）
 *
 * -------------------------------------------------------------------
 * ■ 強さの作り方
 * -------------------------------------------------------------------
 * AI は正解を知っている（answerIndex / panelOrder が手元にある）。
 * だから「強さ」は ★どれくらいの確率で正解を選ぶか★ と
 * ★どれくらいの速さで答えるか★ の2つで作る。
 *
 *   accuracy   … 正解する確率（0〜1）
 *   speedRange … 制限時間のうち何割の時点で答えるか（min〜max）
 *                0.2 なら「制限時間の2割が過ぎた時点」＝速い
 *
 * ★問題文の長さで解答時間を伸ばす★
 * 人間は長い問題文を読むのに時間がかかる。AI が長文でも0.5秒で答えると
 * 「読んでいない相手」に見えて不自然なので、文字数に応じて底上げする。
 *
 * ★同じ試合の同じ問題では毎回同じ行動をする（決定論）★
 * 乱数の種を「試合ID＋問題番号」から作る。
 * こうしないと、React の再描画のたびに AI の答えが変わり、
 * 画面に出た内容と点数計算が食い違う。
 */

import { createRandom, hashString, NO_ANSWER } from './battleCore';
import { KANA_KEYS, KANA_REACHABLE } from './kanaKeyboard';
import type { BattleAnswerRecord, BattleQuestion } from './types';

/** 強さの段階 */
export type AiLevel = 'easy' | 'normal' | 'hard' | 'expert';

export const AI_LEVELS: readonly AiLevel[] = ['easy', 'normal', 'hard', 'expert'];

/**
 * 強さのプリセット。
 *
 * ★数値の根拠★
 *   easy   … 正解率 45%。初めて対戦する人でも勝てる。速さも遅い。
 *   normal … 正解率 70%。共通テストで6〜7割取る受験生の目安。
 *   hard   … 正解率 85%。ここに勝てれば全国対戦で上位に入れる。
 *   expert … 正解率 95%・かなり速い。ほぼ全問正解してくる。
 *            満点ではないのは「絶対に勝てない相手」にしないため
 *            （練習相手として意味が無くなる）。
 *
 * かな入力（五十音キーボード）は選択式より難しい。
 * 人間の正解率も大きく落ちるので、AI にも kanaPenalty を掛ける。
 */
export interface AiProfile {
  level: AiLevel;
  /** 表示名 */
  name: string;
  /** 一言（強さ選択の説明） */
  tagline: string;
  /** 表示上のレート（対戦画面の見た目のみ。ランキングには存在しない） */
  displayRating: number;
  /** 正解する確率（選択式） */
  accuracy: number;
  /** かな入力での正解率の倍率（0〜1）。かな入力は難しいので下げる */
  kanaPenalty: number;
  /** 解答するタイミング。制限時間に対する割合の範囲（min ≦ max、0〜1） */
  speedRange: readonly [number, number];
  /** 主色（UI 用） */
  color: string;
  /**
   * 人間らしい間・プレイスタイル（全国対戦の相手だけ。B7 / バリエーション拡張）。
   *   tempo      … 考えるテンポ（1＝ふつう、大きいほどゆっくり）
   *   wobble     … 問題ごとのばらつき（0〜1）。大きいほど「即答」と「長考」がまざる
   *   archetype  … 対戦相手ごとの性格・得意不得意の型
   *   streakBias … 波の大きさ（0〜0.2）。問題ごとに好調・不調のうねりを作る
   */
  human?: {
    tempo: number;
    wobble: number;
    archetype?: GhostArchetypeId;
    streakBias?: number;
  };
}

/** 全国対戦で当たる相手のプレイスタイル（8タイプ） */
export type GhostArchetypeId =
  | 'rookie'      // 慎重ビギナー：ゆっくり考えてミスも多め
  | 'rush'        // 早押し特化：とにかく速いが誤答も多い（おてつき型）
  | 'careful'     // 熟考・堅実：遅めだが正解率はレート以上に高い
  | 'balanced'    // 標準バランス：レート相応の正答率と速さ
  | 'streaky'     // ムラっ気：即答で連続正解することもあれば急に崩れる
  | 'kana_pro'    // 記述・かな得意：かな入力でも正答率が落ちにくい
  | 'challenger'  // 格下チャレンジャー：発展途上だが得意問題は鋭い
  | 'veteran';    // 格上ランカー：高精度かつ判断が速い

export const AI_PROFILES: Readonly<Record<AiLevel, AiProfile>> = Object.freeze({
  easy: {
    level: 'easy',
    name: 'マナボ（見習い）',
    tagline: 'ゆっくり考える。まだ間違いも多い',
    displayRating: 1200,
    accuracy: 0.45,
    kanaPenalty: 0.6,
    speedRange: [0.45, 0.85],
    color: '#5DADE2',
  },
  normal: {
    level: 'normal',
    name: 'マナボ（受験生）',
    tagline: '7割くらい正解する。ふつうの速さ',
    displayRating: 1500,
    accuracy: 0.7,
    kanaPenalty: 0.75,
    speedRange: [0.3, 0.7],
    color: '#58D68D',
  },
  hard: {
    level: 'hard',
    name: 'マナボ（先生）',
    tagline: 'ほとんど正解して、速い。勝てたら上位',
    displayRating: 1850,
    accuracy: 0.85,
    kanaPenalty: 0.85,
    speedRange: [0.18, 0.5],
    color: '#F5B041',
  },
  expert: {
    level: 'expert',
    name: 'マナボ（博士）',
    tagline: 'ほぼ全問正解・最速。まず勝てない',
    displayRating: 2300,
    accuracy: 0.95,
    kanaPenalty: 0.95,
    speedRange: [0.08, 0.3],
    color: '#C0392B',
  },
});

export function aiProfileOf(level: AiLevel): AiProfile {
  return AI_PROFILES[level] ?? AI_PROFILES.normal;
}

/** AI の uid（部屋の players に入れる固定文字列。実在の Firebase uid と衝突しない） */
export const AI_UID_PREFIX = 'ai:';
export function aiUidOf(level: AiLevel): string {
  return `${AI_UID_PREFIX}${level}`;
}

/**
 * 問題文の長さから「読むのにかかる時間」の下限（秒）を見積もる。
 *
 * 日本語の黙読は 1 秒に 8〜10 文字程度。英語は 1 秒に 3 語程度。
 * ここでは文字数 ÷ 12 とし、AI は人より少し速く読むことにする。
 * 選択肢も読むので、選択肢の合計文字数の半分を足す。
 */
export function aiReadSeconds(question: BattleQuestion): number {
  const promptLen = question.prompt.length;
  const optionLen = question.options.reduce((s, o) => s + o.length, 0);
  return promptLen / 12 + optionLen / 24;
}

/** AI の1問ぶんの行動 */
export interface AiMove {
  /** 正解するか */
  correct: boolean;
  /** 問題開始から何ミリ秒後に答えるか */
  delayMs: number;
  /** 送る解答（choice / panel）。無回答なら null */
  answer: { choice: number; panel: number[] } | null;
}

/**
 * ある問題に対する AI の行動を決める。
 *
 * ★決定論★ 同じ (seed, index) なら必ず同じ結果を返す。
 *
 * @param profile 強さ
 * @param question 出題
 * @param timeLimitSec この問題の制限時間（秒）
 * @param seed 試合ID
 * @param index 問題番号
 */
export function decideAiMove(
  profile: AiProfile,
  question: BattleQuestion,
  timeLimitSec: number,
  seed: string,
  index: number,
): AiMove {
  const random = createRandom(hashString(`${seed}#${index}#${profile.level}`));

  const isKana = question.format === 'kana';
  const isPanel = question.format === 'panel';
  let baseAcc = isKana ? profile.accuracy * profile.kanaPenalty : profile.accuracy;
  if (profile.human?.streakBias) {
    // 問題ごとに調子の波をつける（ムラっ気型は好不調の差が大きくなる）
    const wave = Math.sin((index + 1) * 1.9 + profile.displayRating * 0.017) * profile.human.streakBias;
    baseAcc = Math.min(0.98, Math.max(0.18, baseAcc + wave));
  }
  const accuracy = baseAcc;
  const correct = random() < accuracy;

  // ---- 答えるタイミング ----
  const [minR, maxR] = profile.speedRange;
  let ratio = minR + (maxR - minR) * random();
  // ★B7 人間らしい間（全国対戦の相手）★ 問題ごとに「即答」「ふつう」「長考」がまざる。
  //   さらに考えるテンポ（tempo）と型（archetype）で全体を伸び縮みさせる。乱数は既存の順番のあとに引くので、
  //   human を持たない AI（AI対戦）の動きは変わらない。
  if (profile.human) {
    const { tempo, wobble, archetype } = profile.human;
    const roll = random();
    const swing = random();
    const snapChance = archetype === 'rush' ? 0.38 : archetype === 'streaky' ? 0.30 : 0.12 * wobble * 2;
    const longChance = archetype === 'careful' ? 0.32 : archetype === 'rookie' ? 0.28 : 0.14 * wobble * 2;
    if (roll < snapChance) ratio *= 0.42 + swing * 0.25;          // 即答（わかる問題・早押し）
    else if (roll > 1 - longChance) ratio = ratio + (0.9 - ratio) * (0.4 + swing * 0.5); // 長考
    else ratio *= 0.85 + swing * 0.3;                             // ふつうのゆらぎ
    ratio = Math.min(0.9, ratio * tempo);
  }
  const readFloor = aiReadSeconds(question);
  // かな入力は文字数ぶん打つ時間もかかる（1文字 0.6 秒）
  const typeSec = isKana ? question.panelOrder.length * 0.6 : isPanel ? question.panelOrder.length * 0.4 : 0;
  // 間違えるときは迷っているので少し遅くする
  const hesitate = correct ? 0 : 0.12;
  let sec = Math.max(timeLimitSec * (ratio + hesitate), readFloor + typeSec + 0.6);
  // 締切ぎりぎりを超えないよう、上限は制限時間の 92%
  sec = Math.min(sec, timeLimitSec * 0.92);
  const delayMs = Math.round(sec * 1000);

  // ---- 送る答え ----
  let answer: AiMove['answer'] = null;
  if (isKana || isPanel) {
    if (correct) {
      answer = { choice: NO_ANSWER, panel: [...question.panelOrder] };
    } else {
      answer = { choice: NO_ANSWER, panel: wrongPanel(question, random) };
    }
  } else {
    const n = question.options.length;
    if (correct) {
      answer = { choice: question.answerIndex, panel: [] };
    } else if (n >= 2) {
      // 正解以外から1つ選ぶ
      const wrong = Math.floor(random() * (n - 1));
      const choice = wrong >= question.answerIndex ? wrong + 1 : wrong;
      answer = { choice, panel: [] };
    } else {
      answer = { choice: NO_ANSWER, panel: [] };
    }
  }

  return { correct, delayMs, answer };
}

/**
 * 「惜しい間違い」の並びを作る。
 *
 * kana … 正解の1文字を別のキーに置き換える（例: ダイヤモンド → ダイヤモント）
 * panel … 最後の2枚を入れ替える。1枚なら別の札にする
 *
 * ★まったく無関係な文字列にしない理由★
 * 答え合わせの画面で AI の解答が見える。無関係な文字列だと
 * 「AI が壊れている」ように見えるため、人間らしい間違いにする。
 */
function wrongPanel(question: BattleQuestion, random: () => number): number[] {
  const order = [...question.panelOrder];
  if (order.length === 0) return [];

  if (question.format === 'kana') {
    const pos = Math.floor(random() * order.length);
    const reachable = [...KANA_REACHABLE].filter((k) => k !== order[pos] && k < KANA_KEYS.length);
    const pick = reachable[Math.floor(random() * reachable.length)];
    if (pick != null) order[pos] = pick;
    return order;
  }

  // panel
  if (order.length >= 2) {
    const a = order.length - 1;
    const b = order.length - 2;
    [order[a], order[b]] = [order[b] as number, order[a] as number];
    return order;
  }
  const alt = question.options.map((_, i) => i).filter((i) => i !== order[0]);
  const pick = alt[Math.floor(random() * alt.length)];
  return pick == null ? order : [pick];
}

/**
 * AI の解答記録を作る（人間の BattleAnswerRecord と同じ形）。
 * answeredAt は「問題開始時刻＋遅延」のミリ秒。
 */
export function aiAnswerRecord(index: number, move: AiMove, questionStartMs: number): BattleAnswerRecord | null {
  if (!move.answer) return null;
  return {
    index,
    choice: move.answer.choice,
    panel: move.answer.panel,
    answeredAt: questionStartMs + move.delayMs,
  };
}

/**
 * ★A21：あなたが答えてから AI の答えを見せるまでの間（0.35〜0.8秒）★
 * 2026-10-01 夜：0.8〜1.5秒 → 0.35〜0.8秒に短縮（押したらすぐ結果が見えるように。
 * ゼロにしないのは「相手も考えて押した」感じを残すため）。
 * 同じ (seed, index) なら同じ値（決定論）。表示のタイミングだけに使い、採点の時刻は変えない。
 */
export function aiRevealLagMs(seed: string, index: number): number {
  const random = createRandom(hashString(`${seed}#${index}#reveal`));
  return Math.round(350 + random() * 450);
}

// ===================================================================
// ★全国対戦の「AIプレイヤー」（2026-10-01）★
// ===================================================================
//
// 全国対戦で相手が見つからないとき・サーバーが使えないとき（無料枠の上限など）に、
// 人と同じように振る舞う AI を相手にする。
//   ・名前は毎回変わる（決まった一覧から、種で選ぶ＝同じ試合なら同じ名前）
//   ・レートは自分の近く（±90）。強さ（正解率・速さ）もそのレートに合わせる
//   ・正解率・速さに個性のゆらぎを付ける（毎回同じ動きの相手に見えないように）
// ★2026-10-01 夜 方針変更★ 全国対戦で組まれたときは「AI」と表示しない（運営判断）。
//   見た目は人と組めたときと同じ（名前は伏せ字・開始準備画面も同じ）。
//   レートは動かない（サーバー側は2人の記録がそろわないとレートを動かせないため）。

const GHOST_NAMES = [
  'そら', 'ゆずき', 'はると', 'みお', 'りく', 'あおい', 'こはる', 'そうた', 'ひなた', 'れん',
  'つむぎ', 'ゆうと', 'さくら', 'かいと', 'めい', 'しおん', 'いろは', 'たくみ', 'なぎ', 'るか',
  'かなた', 'ほのか', 'あかり', 'みなと', 'すず', 'けい', 'ちひろ', 'あやね', 'だいき', 'まほ',
  'Haru', 'Yuu', 'Mio', 'Ren', 'Sora', 'Kai', 'Nana', 'Riku', 'Leo', 'Ema',
] as const;
const GHOST_SUFFIX = ['', '', '', '_jp', '0', '7', '23', '♪', '★', '（受験生）', '高1', '高2', '高3', '_eng', '99'] as const;

/** 全国対戦の相手のレートの幅（自分の上下この範囲。近い相手を中心に出しつつ、格下〜格上まで幅広く当たる） */
export const GHOST_RATING_SPREAD = 480;
export const GHOST_RATING_MIN = 800;
export const GHOST_RATING_MAX = 2800;

interface ArchetypeSpec {
  id: GhostArchetypeId;
  accDelta: number;
  speedDelta: number;
  widthRange: readonly [number, number];
  tempoRange: readonly [number, number];
  wobbleRange: readonly [number, number];
  kanaBoost: number;
  streakBias: number;
}

const GHOST_ARCHETYPES: readonly ArchetypeSpec[] = [
  { id: 'balanced',   accDelta:  0.00, speedDelta:  0.00, widthRange: [0.18, 0.34], tempoRange: [0.88, 1.15], wobbleRange: [0.18, 0.34], kanaBoost:  0.00, streakBias: 0.03 },
  { id: 'rush',       accDelta: -0.13, speedDelta: -0.18, widthRange: [0.10, 0.22], tempoRange: [0.68, 0.86], wobbleRange: [0.22, 0.42], kanaBoost: -0.08, streakBias: 0.07 },
  { id: 'careful',    accDelta: +0.11, speedDelta: +0.16, widthRange: [0.16, 0.30], tempoRange: [1.08, 1.36], wobbleRange: [0.14, 0.28], kanaBoost: +0.06, streakBias: 0.02 },
  { id: 'streaky',    accDelta: -0.02, speedDelta: -0.04, widthRange: [0.26, 0.46], tempoRange: [0.78, 1.25], wobbleRange: [0.35, 0.55], kanaBoost:  0.00, streakBias: 0.16 },
  { id: 'kana_pro',   accDelta: +0.04, speedDelta: -0.03, widthRange: [0.16, 0.30], tempoRange: [0.85, 1.08], wobbleRange: [0.16, 0.30], kanaBoost: +0.16, streakBias: 0.04 },
  { id: 'rookie',     accDelta: -0.10, speedDelta: +0.12, widthRange: [0.20, 0.38], tempoRange: [1.05, 1.38], wobbleRange: [0.24, 0.44], kanaBoost: -0.10, streakBias: 0.08 },
  { id: 'challenger', accDelta: -0.05, speedDelta: -0.07, widthRange: [0.20, 0.38], tempoRange: [0.82, 1.06], wobbleRange: [0.26, 0.45], kanaBoost: -0.03, streakBias: 0.10 },
  { id: 'veteran',    accDelta: +0.08, speedDelta: -0.10, widthRange: [0.12, 0.24], tempoRange: [0.74, 0.94], wobbleRange: [0.14, 0.26], kanaBoost: +0.10, streakBias: 0.03 },
];

export const GHOST_ARCHETYPE_IDS: readonly GhostArchetypeId[] = GHOST_ARCHETYPES.map((a) => a.id);

function pickArchetype(ratingDiff: number, rating: number, roll: number): ArchetypeSpec {
  // レート差やレート帯に合う型を少し出やすくしつつ、どの帯でもいろいろなタイプと当たるようにする
  if (ratingDiff <= -180 && roll < 0.45) return roll < 0.22 ? GHOST_ARCHETYPES[5]! : GHOST_ARCHETYPES[6]!; // rookie / challenger
  if (ratingDiff >= 180 && roll < 0.45) return GHOST_ARCHETYPES[7]!; // veteran
  if (rating < 1150 && roll < 0.35) return GHOST_ARCHETYPES[5]!; // rookie
  if (rating > 2100 && roll < 0.35) return GHOST_ARCHETYPES[7]!; // veteran
  const idx = Math.floor(roll * GHOST_ARCHETYPES.length) % GHOST_ARCHETYPES.length;
  return GHOST_ARCHETYPES[idx]!;
}

/**
 * 自分のレートから、全国対戦の相手を作る（同じ seed なら同じ相手）。
 *   ・レートは自分の ±480：近い相手（±120）を厚めに残しつつ、約3割で格下チャレンジャー〜格上ランカーとも当たる混合分布
 *   ・8種類のプレイスタイル（早押し特化・熟考堅実・ムラっ気・記述得意・ビギナー・チャレンジャー・ランカー・標準）で、
 *     同じレート帯でも「速いけどミスする相手」「遅いけど正確な相手」「波のある相手」など手応えが変わる
 *   ・正解率は 0.22〜0.98、速さも 0.05〜0.92 まで広く分布し、レートが高いほど平均正答率は上がる
 */
export function ghostProfileFor(myRating: number, seed: string): AiProfile {
  const random = createRandom(hashString(`ghost#${seed}`));
  const base0 = Number.isFinite(myRating) ? myRating : 1500;

  // 近い相手（約62%）＋ 中距離の格上・格下（約24%）＋ 大幅な格上・格下（約14%）の混合分布
  const bandRoll = random();
  const u1 = random();
  const u2 = random();
  let offsetRatio: number;
  if (bandRoll < 0.62) {
    // 近い相手（±150 付近に集まる三角分布）
    offsetRatio = ((u1 + u2) - 1) * 0.36;
  } else if (bandRoll < 0.86) {
    // はっきり格上・格下（±140〜±320）
    const sign = u1 < 0.5 ? -1 : 1;
    offsetRatio = sign * (0.30 + u2 * 0.38);
  } else {
    // たまに当たる強敵・ビギナー（±300〜±480）
    const sign = u1 < 0.5 ? -1 : 1;
    offsetRatio = sign * (0.62 + u2 * 0.38);
  }

  const rating = Math.round(Math.min(GHOST_RATING_MAX, Math.max(GHOST_RATING_MIN, base0 + offsetRatio * GHOST_RATING_SPREAD)));
  const spec = pickArchetype(rating - base0, rating, random());
  const level: AiLevel = rating < 1300 ? 'easy' : rating < 1700 ? 'normal' : rating < 2050 ? 'hard' : 'expert';
  const base = AI_PROFILES[level];

  // レートに合わせて正解率をなめらかに（800 で約 0.28、2800 で約 0.96）＋ プレイスタイル差 ＋ 個人のゆらぎ
  const t = (rating - GHOST_RATING_MIN) / (GHOST_RATING_MAX - GHOST_RATING_MIN);
  const rawAcc = 0.28 + t * 0.68 + spec.accDelta + (random() * 0.12 - 0.06);
  const accuracy = Math.min(0.98, Math.max(0.22, rawAcc));

  // 速さ：強いほど速いが、早押し型は低レートでも速く、熟考型は高レートでもじっくり考える
  const center = 0.64 - t * 0.50 + spec.speedDelta + (random() * 0.14 - 0.07);
  const width = spec.widthRange[0] + random() * (spec.widthRange[1] - spec.widthRange[0]);
  const minS = Math.min(0.80, Math.max(0.05, center - width / 2));
  const maxS = Math.min(0.92, Math.max(minS + 0.08, center + width / 2));
  const speedRange: [number, number] = [minS, maxS];

  const kanaPenalty = Math.min(0.98, Math.max(0.42, base.kanaPenalty + spec.kanaBoost + (random() * 0.08 - 0.04)));
  const tempo = spec.tempoRange[0] + random() * (spec.tempoRange[1] - spec.tempoRange[0]);
  const wobble = spec.wobbleRange[0] + random() * (spec.wobbleRange[1] - spec.wobbleRange[0]);
  const name = GHOST_NAMES[Math.floor(random() * GHOST_NAMES.length)] + GHOST_SUFFIX[Math.floor(random() * GHOST_SUFFIX.length)];

  return {
    level,
    name,
    tagline: '全国対戦の相手',
    displayRating: rating,
    accuracy,
    kanaPenalty,
    speedRange,
    color: base.color,
    human: {
      tempo,
      wobble,
      archetype: spec.id,
      streakBias: spec.streakBias,
    },
  };
}
