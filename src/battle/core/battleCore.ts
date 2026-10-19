/**
 * ===================================================================
 * battleCore — 対戦の判定ロジック（純粋関数・依存ゼロ）
 * ===================================================================
 *
 * ★このファイルは Firebase / React / DOM を一切 import しない。★
 *
 * -------------------------------------------------------------------
 * ■ なぜ「純粋関数」で切り出すのか
 * -------------------------------------------------------------------
 * 対戦のスコアは Firestore に保存しない。保存すると、書き込む本人が
 * 好きな数値を入れられてしまう（Firestore のセキュリティルールは
 * 「送られてきた点数が正しく計算されたものか」を検算できない）。
 *
 * そこで保存するのは
 *
 *     「何番を選んだか」＋「サーバー時刻で何時に答えたか」
 *
 * だけにして、点数はこのファイルの関数で ★両者の端末が計算し直す★。
 * 入力（選択と時刻）が同じなら出力（点数）も必ず同じになるので、
 * 点数を偽装する余地が構造的に無くなる。
 *
 * 既存の src/utils/answerJudge.ts / scoring.ts が同じ思想で書かれており
 * （「サーバー移行時にそのまま Cloud Functions へ持ち込める」）、
 * このファイルもその方針を踏襲している。将来 Cloud Functions を使える
 * ようになったら、このファイルをそのままサーバーに置いて検算させられる。
 *
 * -------------------------------------------------------------------
 * ■ 「早押し」ではなく「時間窓」にした理由
 * -------------------------------------------------------------------
 * 先に押した方が正解権を得る方式（早押し）は、
 *
 *   1. 回線の速い人が有利になり、実力と無関係に勝敗が決まる
 *   2. 正解データがクライアントのJSに含まれているため、
 *      それを読んだ人が最速で押して必ず勝てる（サーバー無しでは防げない）
 *
 * という2つの問題がある。
 *
 * そこで「両者に同時出題し、締切まで各自1回だけ答える」方式にした。
 *   ・速さは加点にしか影響しない（勝敗を直接決めない）
 *   ・締切まで結果が出ないので、先に押す旨味が無い
 *   ・締切後の回答はルールで弾ける（`request.time < deadlineAt`）
 * 速さボーナスの粒度は下の SPEED_GRANULARITY_MS（500ms）なので、
 * 通信のゆらぎ（数十〜200ms程度）では点差がつかない。
 */

import type {
  BattleAnswerRecord,
  BattleAnswerSheet,
  BattleOutcome,
  BattlePlayerScore,
  BattleQuestion,
  BattleQuestionScore,
  BattleResultSummary,
  BattleRule,
} from './types';
import { answerIndexOf } from './types';
import { speedCurve } from './arenaRules';
import { kanaTextOf } from './kanaKeyboard';

/**
 * 回答（マップ or 配列）を「問題番号 → 回答」の Map に正規化する。
 *
 * ★同じ問題に複数の回答が来た場合は、最初に見つけた1つだけを採用する。★
 *   保存形式がマップになった今、同じキーが2つ来ることは構造上ありえない。
 *   ただし配列で渡された場合（テストや将来の呼び出し）には起きうるので、
 *   「後から出し直して点を上げる」ことができないように最初の1件で固定する。
 *
 * ★キーが壊れている場合は捨てる（0番扱いにしない）★
 *   `q0` 以外の名前（例: `qX`）が混ざっていたとき、
 *   Number('X') は NaN になる。これを 0 に丸めると
 *   「1問目の回答」として採点されてしまう。黙って混ぜるより捨てる方が安全。
 */
function indexAnswers(
  records: BattleAnswerRecord[] | BattleAnswerSheet | null | undefined,
): Map<number, BattleAnswerRecord> {
  const byIndex = new Map<number, BattleAnswerRecord>();
  if (!records) return byIndex;

  if (Array.isArray(records)) {
    for (const r of records) {
      if (!r || typeof r.index !== 'number') continue;
      if (!byIndex.has(r.index)) byIndex.set(r.index, r);
    }
    return byIndex;
  }

  for (const [key, value] of Object.entries(records)) {
    if (!value) continue;

    // ★問題番号はキー名だけを正とする（中身の index は当てにしない）★
    //
    // キー名はルールで `q{currentIndex}` と一致することを強制しているので、
    // 中身の index より信頼できる。
    //
    // 以前は「キー名が読めなければ中身の index を使う」保険を入れていたが、
    // これは害しかなかったので外した。理由:
    //   オブジェクトの走査順はキーの挿入順である。
    //   壊れたキー（例 `qX`, 中身 index:0）が `q0` より先にあると、
    //   保険のせいで `qX` が先に0番の枠を取り、
    //   下の has() 判定で★本物の q0 が捨てられる★。
    //   結果は「正しく答えたのに点が入らない」で、
    //   利用者には原因がまったく説明できない。
    //
    // そもそもキー名を強制しているのだから、
    // 読めないキーは壊れたデータでしかない。黙って捨てるのが正しい。
    const index = answerIndexOf(key);
    if (index == null || !Number.isInteger(index) || index < 0) continue;
    if (!byIndex.has(index)) byIndex.set(index, { ...value, index });
  }
  return byIndex;
}

// ============================================================
// 定数
// ============================================================

/**
 * 速さボーナスの時間粒度（ミリ秒）。
 *
 * ★通信のゆらぎで点差がつかないようにするための刻み。★
 * 残り時間をこの単位に切り下げてからボーナスを計算するので、
 * 200ms 程度のラグ差では同じボーナスになる。
 * 逆に「3秒で答えた人」と「10秒で答えた人」にはきちんと差が出る。
 */
export const SPEED_GRANULARITY_MS = 500;

/** 連続正解ボーナスが付き始める連続数（これ以上で加点） */
export const STREAK_THRESHOLD = 3;

/** 連続正解ボーナスの計算に使う連続数の上限（際限なく伸びないようにする） */
export const STREAK_CAP = 8;

/** 無回答を表す choice の値 */
export const NO_ANSWER = -1;

/**
 * 何問連続で無回答なら「放棄」と見なすか。
 *
 * ブラウザを閉じた・通信が切れた場合、その端末は何も書き込めなくなる。
 * 締切は deadlineAt で進むので試合自体は進行するが、
 * 最後まで無回答で消化されると相手が延々と待つことになる。
 * そこで連続でこの回数だけ無回答なら、その時点で決着させる。
 *
 * ★5問にしている理由（3問から引き上げた）★
 * 当初は3問にしていたが、これは短すぎた。
 * 電車がトンネルに入る、地下に降りる、エレベーターに乗る——
 * どれも30〜60秒の圏外になり、1問10〜20秒なら★3問は簡単に飛ぶ★。
 * つまり「席を立った人」ではなく「トンネルに入った人」が
 * 不戦敗にされることになり、その人はレートを削られる。
 *
 * 一方、放棄の判定が遅れて困るのは
 * 「相手が本当に閉じたのに待たされる」場合だけで、
 * その待ち時間は締切の進行で自動的に消化される（最大でも数十秒）。
 * ★誤って負けにされる害の方がはるかに大きい★ので、緩い側に倒す。
 *
 * なお「本当に閉じた」場合は abortRoom() が離脱を書き込むので、
 * そちらは無回答の回数を待たずに即座に決着できる（下の hasLeft を参照）。
 */
export const FORFEIT_STREAK = 5;

/**
 * 相手が明示的に離脱したかを判定する。
 *
 * ★無回答の回数と分けている理由★
 * 離脱には2種類ある。
 *   (A) 「もどる」を押した／画面を閉じた
 *       → abortRoom() が left.{uid} を書き込める。★確実な離脱★。
 *          この場合は待つ意味がないので即座に決着してよい。
 *   (B) 電源が切れた／通信が切れた／アプリを強制終了された
 *       → 何も書き込めない。無回答が続くことからの推測しかできない。
 *
 * (A) を (B) と同じ扱いにすると、相手が「もどる」を押したのに
 * こちらは5問ぶん待たされる。逆に (B) を (A) と同じに扱うことはできない。
 * 確実に分かる方は確実に扱う。
 */
export function hasLeft(left: unknown, uid: string): boolean {
  if (!left || typeof left !== 'object' || Array.isArray(left)) return false;
  if (!uid) return false;
  return (left as Record<string, unknown>)[uid] != null;
}

// ============================================================
// 時刻の取り出し
// ============================================================

/**
 * 回答記録の answeredAt からミリ秒を取り出す。
 *
 * ★型が1つに定まらない理由★
 * answeredAt には Firestore の serverTimestamp() を書き込む。
 * 読み出したときの中身は状況によって3通りある。
 *
 *   1. Firestore から読んだ確定値      … Timestamp（toMillis() を持つ）
 *   2. 書き込み直後のローカル反映       … Timestamp（同上）だが推定値
 *   3. まだサーバに届いていない瞬間     … null
 *
 * さらにテストからは素の数値（ミリ秒）を渡したい。
 * これらを1か所で吸収する。
 *
 * ★この関数が無かったときに起きていた不具合★
 * 採点側が `typeof record.answeredAt === 'number'` だけを見ていたため、
 * 実機では Timestamp オブジェクトが来て条件が常に false になり、
 * 「無回答として制限時間いっぱい使った」扱い＝★速さ点が常に0★ になっていた。
 * 型定義が unknown（Firestore の値をそのまま持つ）なので
 * TypeScript では検出できず、この関数として切り出して塞ぐ。
 */
export function answeredAtMillis(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  // Firestore の Timestamp（firebase/firestore に依存せず判定する。
  // このファイルは Firebase を import しない葉モジュールのままにしたいため）
  const stamp = value as { toMillis?: () => number; seconds?: number } | null | undefined;
  if (stamp && typeof stamp.toMillis === 'function') {
    const ms = stamp.toMillis();
    return Number.isFinite(ms) ? ms : null;
  }
  if (stamp && typeof stamp.seconds === 'number') {
    return stamp.seconds * 1000;
  }

  return null;
}

// ============================================================
// 正誤判定
// ============================================================

/**
 * 1問について、その回答が正解かどうかを判定する。
 *
 * ★正解を「文字列の一致」ではなく「並びの中での位置」で判定している。★
 * 出題プールには正解の文字列そのものを入れず、
 * 「options の何番目が正解か（answerIndex）」だけを持たせている。
 * これは
 *   ・プールを配っただけで答えが読めてしまう事故を減らす
 *   ・表記ゆれの判定（answerJudge.ts の正規化）を対戦中に走らせなくてよい
 *     （プール生成時に一度だけ判定してあるので、対戦中は添字の比較で済む）
 * という2つの狙いがある。
 */
export function isBattleAnswerCorrect(
  question: BattleQuestion,
  record: BattleAnswerRecord | undefined,
): boolean {
  if (!record) return false;

  /**
   * 文字パネル・五十音キーボード: 押した順が正解の順と完全に一致していること。
   *
   * ★2つを同じ式で判定できる理由★
   * どちらも「番号の並び」を答えとして送る。違うのは番号の意味だけで、
   *   panel … options（画面に並んだ文字パネル）の添字
   *   kana  … KANA_KEYS（五十音キーボードの文字表）の添字
   * 判定は「送られた並びが正解の並びと同じか」しか見ないので、
   * 番号の意味を知る必要がない。★ここで文字列に戻して比べてはいけない★
   * （戻すには文字表が必要になり、この葉モジュールが kanaKeyboard に依存する）。
   */
  if (question.format === 'panel' || question.format === 'kana') {
    const expected = question.panelOrder;
    const actual = record.panel || [];
    if (expected.length === 0) return false;
    if (actual.length !== expected.length) return false;
    for (let i = 0; i < expected.length; i += 1) {
      if (actual[i] !== expected[i]) return false;
    }
    return true;
  }

  // 4択 / 語句選択: 選んだ番号が正解の番号と一致していること
  if (record.choice === NO_ANSWER) return false;
  return record.choice === question.answerIndex;
}

// ============================================================
// 制限時間
// ============================================================

/**
 * 1問の制限時間（秒）を決める。
 *
 * 既定は「問題ごとにプール生成時に決めた秒数」を使う。
 * 運用でどうしても揃えたいときだけ rules.timeLimitOverride を入れると、
 * 全問その秒数で固定される。
 *
 * ★問題ごとに変える理由★
 * 実データの問題文の長さは中央値268文字・上位10%で904文字・最長1764文字と
 * 大きく散らばっている。全問同じ秒数にすると、長文の問題は読み終わる前に
 * 締切が来て「運で決まる」試合になってしまう。
 * 既存の scoring.ts も同じ理由で問題タイプ別に秒数を見積もっている。
 */
/** Reading/thinking time, plus extra time for entering kana or arranging panels.
 * Keep deadlines below the deployed Firestore 60-second bound, including the
 * 700ms network allowance. No cloud rules change is needed.
 */
export const BATTLE_TIME_SCALE = 2.2;
export const BATTLE_TIME_SCALED_MAX = 55;
export const BATTLE_REVEAL_HOLD_MS = 3500;

export function resolveTimeLimit(question: BattleQuestion, rules: BattleRule): number {
  const base = rules.timeLimitOverride != null && rules.timeLimitOverride > 0
    ? rules.timeLimitOverride
    : Math.max(25, Math.round(question.timeLimit * BATTLE_TIME_SCALE));
  const input = question.format === 'kana' || question.format === 'panel';
  return Math.min(BATTLE_TIME_SCALED_MAX,
    input ? Math.max(base, 45 + question.panelOrder.length * 2) : base);
}

// ============================================================
// 全国対戦の自動開始
// ============================================================

/**
 * 全国対戦で「部屋主が開始の書き込みをしない」ときに、
 * 相手側が代わりに開始してよいと判断するまでの待ち時間（ミリ秒）。
 *
 * ★8秒にしている理由★
 *   部屋主の開始は通常 1〜2 秒（問題プールの読み込み＋1回の書き込み）で届く。
 *   これより短いと「部屋主が書いている途中」に相手も書いて deadlineAt が
 *   2回書かれ、後の方に上書きされて片方の残り時間が数秒ずれる。
 *   これより長いと「マッチしたのに始まらない」と感じて離脱される
 *   （マッチング画面の AI 提案は 45 秒だが、ここは既に相手が居るので
 *   待たせる理由が無い）。
 */
export const NATIONAL_AUTO_START_FALLBACK_MS = 8000;

/**
 * 全国対戦の部屋を自動で開始してよいか、また何ミリ秒待ってからか。
 *
 * ★背景★
 *   findOrEnqueue は「2人揃った」部屋を status:'waiting' で作る。
 *   以前はその後 BattleLobby（合言葉を見せて相手を待つ画面）が出て、
 *   部屋主が「はじめる」を押すまで始まらなかった。
 *   全国対戦を選んだ人からは★フレンド対戦の画面に飛ばされた★ように見える。
 *   全国対戦は相手を選ばない・合言葉も無いので、揃った時点で始めてよい。
 *
 * 戻り値:
 *   null … 自動開始しない（フレンド対戦・もう始まっている・自分は参加者でない
 *           ・問題がまだ読めていない）
 *   0    … いま開始する（部屋主）
 *   NATIONAL_AUTO_START_FALLBACK_MS … 部屋主が開始しなければ代わりに開始する（相手側）
 *
 * ★フレンド対戦（joinCode あり）は対象外★
 *   合言葉の部屋は「相手が入ってきたら、部屋主が声を掛けてから始める」
 *   のが自然なので、自動では始めない。
 *
 * ★問題が読めていないうちは始めない★
 *   開始の書き込みには最初の問題の制限時間（deadlineAt）が要る。
 */
export function nationalAutoStartDelayMs(
  room: {
    status: string;
    joinCode: string;
    hostUid: string;
    players: readonly string[];
  },
  uid: string,
  questionsLoaded: boolean,
): number | null {
  if (!uid || !questionsLoaded) return null;
  if (room.status !== 'waiting') return null;
  if (room.joinCode) return null;
  if (room.players.length < 2) return null;
  if (!room.players.includes(uid)) return null;
  return room.hostUid === uid ? 0 : NATIONAL_AUTO_START_FALLBACK_MS;
}

// ============================================================
// 採点
// ============================================================

/**
 * 1問ぶんの得点を計算する。
 *
 * 得点の内訳:
 *   ・基礎点   … 正解なら rules.pointsCorrect
 *   ・速さ点   … 正解のときのみ。残り時間の割合に比例して 0〜pointsSpeedMax。
 *                残り時間は SPEED_GRANULARITY_MS 単位に切り下げてから使う。
 *   ・連続点   … STREAK_THRESHOLD 連続以上で、連続数に応じて加点。
 *
 * 誤答・無回答は0点（減点はしない）。
 * ★減点しない理由★: 減点があると「分からない問題は答えない方が得」になり、
 * 学習の場としては逆効果になる。挑戦した方が損をしない設計にしている。
 */
export function scoreBattleQuestion(
  question: BattleQuestion,
  record: BattleAnswerRecord | undefined,
  rules: BattleRule,
  runningStreak: number,
  questionStartMs: number,
  index = 0,
): BattleQuestionScore {
  const timeLimit = resolveTimeLimit(question, rules);
  const correct = isBattleAnswerCorrect(question, record);

  // 使った時間。回答が無い（無回答）なら制限時間いっぱい使ったものとして扱う。
  //
  // ★開始時刻が分からない問題は速さ点0にする（推測しない）★
  //   questionStartMs が 0 のときは、その問題の開始時刻を記録できていない
  //   （途中参加・再読み込みなど）。ここで 0 を基準に引き算すると
  //   1970年からの経過ミリ秒が「使った時間」になり、
  //   制限時間で打ち切られて結果的に速さ点0になる。
  //   意図せずそうなっているのではなく、意図してそうしている。
  let timeUsedMs = timeLimit * 1000;
  const answeredMs = record ? answeredAtMillis(record.answeredAt) : null;
  if (answeredMs != null && questionStartMs > 0) {
    timeUsedMs = Math.max(0, answeredMs - questionStartMs);
  }
  // 締切を超えた分は制限時間で打ち切る（超過ペナルティは設けない。
  // 締切後の回答はそもそもルールで弾かれるため、ここに来る超過は
  // サーバー時刻の丸め誤差の範囲しかない）
  timeUsedMs = Math.min(timeUsedMs, timeLimit * 1000);

  const base = correct ? rules.pointsCorrect : 0;

  // 速さ点
  let speed = 0;
  if (correct && rules.pointsSpeedMax > 0 && timeLimit > 0) {
    const remainMs = Math.max(0, timeLimit * 1000 - timeUsedMs);
    // 粒度で切り下げる（通信のゆらぎで差がつかないようにする）
    const quantized = Math.floor(remainMs / SPEED_GRANULARITY_MS) * SPEED_GRANULARITY_MS;
    const rate = Math.min(1, quantized / (timeLimit * 1000));
    speed = Math.round(rules.pointsSpeedMax * (rules.scoringVersion === 2 ? speedCurve(rate) : rate));
  }

  // 連続点（この問題を正解して runningStreak+1 連続になったときの加点）
  let streak = 0;
  if (correct && rules.pointsStreak > 0) {
    const newStreak = runningStreak + 1;
    if (newStreak >= STREAK_THRESHOLD) {
      const effective = Math.min(newStreak, STREAK_CAP) - STREAK_THRESHOLD + 1;
      streak = rules.pointsStreak * effective;
    }
  }

  return {
    index,
    correct,
    answered: !!record && (question.format === 'kana' || question.format === 'panel'
      ? record.panel.length > 0 : record.choice >= 0 && record.choice < question.options.length),
    submittedAnswer: !record ? '' : question.format === 'kana'
      ? kanaTextOf(record.panel)
      : question.format === 'panel' ? record.panel.map(i => question.options[i] || '').join('')
      : question.options[record.choice] || '',
    timeUsed: Math.round(timeUsedMs / 100) / 10, // 0.1秒単位に丸める
    base,
    speed,
    streak,
    total: base + speed + streak,
  };
}

/**
 * 1人ぶんの試合全体を採点する。
 *
 * @param questions       出題（部屋に焼き付けられた順そのまま）
 * @param records         その人の回答記録。
 *                        Firestore 上の形（`{ q0: {...}, q1: {...} }` のマップ）でも、
 *                        配列でも渡せる。
 *
 * ★マップと配列の両方を受け取る理由★
 *   保存形式はマップ（`answers.{uid}.q0`）に統一したが、
 *   この関数はテストから配列で呼ぶと読みやすいケースが多い。
 *   また、片方しか受け取らない形にすると
 *   「渡した側の形が違って全問0点」という事故が起きる。
 *   実際に過去、questionStarts で Map を渡したのに配列しか見ておらず
 *   ★全問の速さ点が0★ になるバグを出している（型が unknown 経由で通った）。
 *   同じ事故を繰り返さないため、入口で形を吸収する。
 * @param rules           部屋に焼き付けられたルール
 * @param questionStarts  各問題が始まったサーバー時刻（ミリ秒）。
 *                        「締切 − 制限時間」で求めた値を渡す。
 *                        配列でも Map でも渡せる。
 *
 * ★Map も受け取れるようにしている理由★
 * 呼び出し側（useBattleRoom）は「今出ている問題」の締切しか知らないので、
 * 問題ごとの開始時刻を Map<問題番号, 時刻> に貯めていく。
 * 配列だけを受け取る形にしていたときは、Map を渡しても
 * `questionStarts[i]` が常に undefined になり
 * ★全問の速さ点が0★ になっていた（型は unknown 経由で通ってしまう）。
 * 両方受け取れるようにして、呼び出し側の形に依存しないようにする。
 */
export function scoreBattlePlayer(
  uid: string,
  questions: BattleQuestion[],
  records: BattleAnswerRecord[] | BattleAnswerSheet | null | undefined,
  rules: BattleRule,
  questionStarts: readonly number[] | ReadonlyMap<number, number>,
): BattlePlayerScore {
  /** 配列と Map のどちらでも同じように引けるようにする */
  const startAt = (index: number): number => {
    if (questionStarts instanceof Map) return questionStarts.get(index) ?? 0;
    return (questionStarts as readonly number[])[index] ?? 0;
  };
  const byIndex = indexAnswers(records);

  const perQuestion: BattleQuestionScore[] = [];
  let score = 0;
  let correctCount = 0;
  let totalTime = 0;
  let runningStreak = 0;
  let maxStreak = 0;

  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];
    // 出題が読み込めていない位置は採点をとばす。
    // （プールの読み込み失敗時に questions が短くなることがある。
    //   ここで落とすと結果画面が出せなくなるので、静かにとばす）
    if (!q) continue;
    const rec = byIndex.get(i);
    const startMs = startAt(i);
    const s = scoreBattleQuestion(q, rec, rules, runningStreak, startMs, i);

    if (s.correct) {
      runningStreak += 1;
      correctCount += 1;
      if (runningStreak > maxStreak) maxStreak = runningStreak;
    } else {
      runningStreak = 0;
    }

    score += s.total;
    totalTime += s.timeUsed;
    perQuestion.push(s);
  }

  return {
    uid,
    perQuestion,
    score,
    correctCount,
    totalTime: Math.round(totalTime * 10) / 10,
    maxStreak,
  };
}

// ============================================================
// 勝敗判定
// ============================================================

/**
 * 両者の採点結果から勝敗を決める。
 *
 * 判定の順:
 *   1. 合計点が高い方の勝ち
 *   2. 同点なら rules.tiebreak に従う
 *        'time'   … 合計解答時間が短い方の勝ち
 *        'sudden' … サドンデスが必要（needsSuddenDeath = true）
 *        'draw'   … 引き分け
 *   3. 'time' でも完全に同じなら引き分け
 */
export function judgeBattle(
  me: BattlePlayerScore,
  opponent: BattlePlayerScore | null,
  rules: BattleRule,
): BattleResultSummary {
  if (!opponent) {
    // 相手が居ない（相手が部屋に来なかった等）。勝敗をつけない。
    return { me, opponent: null, outcome: 'draw', decidedByTime: false, needsSuddenDeath: false };
  }

  if (me.score > opponent.score) {
    return { me, opponent, outcome: 'win', decidedByTime: false, needsSuddenDeath: false };
  }
  if (me.score < opponent.score) {
    return { me, opponent, outcome: 'lose', decidedByTime: false, needsSuddenDeath: false };
  }

  // ---- ここから同点 ----
  if (rules.tiebreak === 'draw') {
    return { me, opponent, outcome: 'draw', decidedByTime: false, needsSuddenDeath: false };
  }

  if (rules.tiebreak === 'sudden') {
    return { me, opponent, outcome: 'draw', decidedByTime: false, needsSuddenDeath: true };
  }

  // tiebreak === 'time'
  if (me.totalTime < opponent.totalTime) {
    return { me, opponent, outcome: 'win', decidedByTime: true, needsSuddenDeath: false };
  }
  if (me.totalTime > opponent.totalTime) {
    return { me, opponent, outcome: 'lose', decidedByTime: true, needsSuddenDeath: false };
  }
  return { me, opponent, outcome: 'draw', decidedByTime: false, needsSuddenDeath: false };
}

/**
 * 「放棄（何問連続で無回答か）」を数える。
 *
 * 通信が切れた・ブラウザを閉じた場合、その人は何も書き込めない。
 * 締切は deadlineAt で進むので試合は進行するが、最後まで無回答で
 * 消化されると相手が待たされる。そこで連続無回答が FORFEIT_STREAK に
 * 達した時点で決着させるための判定に使う。
 *
 * @returns 最後の問題から数えて何問連続で無回答か
 */
export function trailingNoAnswerCount(
  answeredIndices: number[],
  upToIndex: number,
): number {
  const answered = new Set(answeredIndices);
  let n = 0;
  for (let i = upToIndex; i >= 0; i -= 1) {
    if (answered.has(i)) break;
    n += 1;
  }
  return n;
}

// ============================================================
// レート（Elo）
// ============================================================

/** レートの初期値。1500 は Elo で広く使われる基準値 */
export const RATING_INITIAL = 1500;

/**
 * レート変動の係数（K値）。
 *
 * 大きいほど1試合の増減が激しくなる。
 * 学習アプリなので「負けても大きく落ちない」ことを重視して控えめの 24 にした。
 * （チェスの一般的な設定は 10〜40）
 */
export const RATING_K = 24;

/** レートの下限（これ以下には下がらない。心理的な歯止め） */
export const RATING_FLOOR = 800;

/**
 * 切断・放棄で勝ったときのレート増加の割合。
 *
 * ★なぜ半分にするのか★
 * 「勝てそうにない試合をわざと切断する」ことを防ぐのと同時に、
 * 「相手を切断させて稼ぐ」ことも防ぎたい。
 * 放棄勝ちの価値を下げると、どちらの動機も弱くなる。
 */
export const FORFEIT_RATING_RATIO = 0.5;

/**
 * Elo で新しいレートを計算する。
 *
 * 期待勝率 E = 1 / (1 + 10^((相手 − 自分)/400))
 * 新レート  = 自分 + K × (実際の結果 − E)
 *   実際の結果: 勝ち 1 / 引き分け 0.5 / 負け 0
 *
 * @param forfeit 放棄・切断による決着なら true（増減を半分にする）
 */
export function nextRating(
  myRating: number,
  opponentRating: number,
  outcome: BattleOutcome,
  forfeit = false,
): number {
  const expected = 1 / (1 + Math.pow(10, (opponentRating - myRating) / 400));
  const actual = outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0;
  const k = forfeit ? RATING_K * FORFEIT_RATING_RATIO : RATING_K;
  const raw = myRating + k * (actual - expected);
  return Math.max(RATING_FLOOR, Math.round(raw));
}


// ============================================================
// 決定論的な乱数（出題の抽選に使う）
// ============================================================

/**
 * 文字列から32bitのハッシュを作る（FNV-1a）。
 *
 * ★何に使うのか★
 * 出題の抽選に Math.random() を使うと、部屋を作った端末しか
 * 「どの問題が選ばれたか」を再現できない。
 * ここでは「部屋ID（種）から決まる乱数」を使い、
 * 種が同じなら誰の端末でも同じ並びが得られるようにする。
 * こうすると、部屋に保存するのは種だけでよく、
 * さらに「保存された問題並びが種から作られたものか」を
 * 後から検算できる（＝問題差し替えの検知に使える）。
 */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * 種から擬似乱数を作る（mulberry32）。
 * 同じ種なら必ず同じ数列が出る。
 */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function random(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 配列から重複なく n 件を選ぶ（Fisher-Yates の部分適用）。
 * 元の配列は変更しない。
 */
export function pickRandom<T>(items: readonly T[], count: number, random: () => number): T[] {
  const arr = items.slice();
  const n = Math.min(count, arr.length);
  for (let i = 0; i < n; i += 1) {
    const j = i + Math.floor(random() * (arr.length - i));
    // 分割代入で入れ替える（添字アクセスの undefined 判定を避けるため）。
    // i, j はどちらも 0..arr.length-1 の範囲に必ず収まる。
    [arr[i], arr[j]] = [arr[j] as T, arr[i] as T];
  }
  return arr.slice(0, n);
}

/**
 * buildQuestionOrder の追加指定（省略可）。
 *
 * ★なぜ引数を増やすのではなくまとめた形にしたのか★
 * 引数を並べていくと呼び出し側が
 *   buildQuestionOrder(ids, 10, seed, groupOf, isKana, 0.3)
 * のようになり、真ん中の値が何なのか読めなくなる。
 * また、あとで「かな入力以外の混ぜ方」を足したくなったときに
 * 既存の呼び出しを全部書き換えることになる。
 */
export interface QuestionOrderMix {
  /** その出題IDがかな入力（五十音キーボード）かどうか */
  isKana: (id: string) => boolean;
  /** かな入力にしたい問題の割合（0〜1）。0.3 なら10問中3問 */
  kanaShare: number;
}

/**
 * 出題IDの並びを「種」から決定論的に作る。
 *
 * ★同じ種・同じプールなら、誰の端末で計算しても同じ並びになる。★
 * これにより
 *   ・部屋を作るとき: 種から並びを作って保存する
 *   ・相手の端末   : 保存された並びが種から作られたものか検算できる
 * の両方が成立する（問題差し替えの検知）。
 *
 * @param poolIds 抽選対象の出題ID（教科・形式で絞り込んだ後のもの）
 * @param count   選ぶ数
 * @param seed    種（部屋IDなど）
 * @param groupOf 同じ小問から作られた問題をまとめるキー（省略可）
 * @param mix     かな入力を何割混ぜるか（省略可）
 */
export function buildQuestionOrder(
  poolIds: readonly string[],
  count: number,
  seed: string,
  groupOf?: (id: string) => string,
  mix?: QuestionOrderMix,
): string[] {
  const random = createRandom(hashString(seed));

  // 何の指定も無ければ単純に抽選する
  if (!groupOf && !mix) return pickRandom(poolIds, count, random);

  // ★同じ小問から作られた別形式を1試合に混ぜない★
  //
  // 生成プールには、1つの小問から「語句選択」と「文字パネル」の
  // 2問が作られているものがある（化学基礎763問のうち実質553小問）。
  // 単純に抽選すると、まったく同じ問いが
  //   3問目「次の語を選べ → 混合物」
  //   7問目「文字を並べよ → 混合物」
  // という形で1試合に2回出る。答えを知った状態の2回目は
  // ただの作業になり、対戦としても学習としても価値がない。
  //
  // そこで ★プール全体をシャッフルしてから、
  // 同じグループ（小問）の2問目以降を捨てる★ 方式にする。
  // 「先に絞ってから抽選」ではなく「シャッフル後に間引く」ので、
  // どの形式が採用されるかも種によって決まり、決定論性が保たれる。
  const shuffled = pickRandom(poolIds, poolIds.length, random);
  const usedGroups = new Set<string>();
  const unique: string[] = [];

  for (const id of shuffled) {
    const group = groupOf ? groupOf(id) : id;
    if (usedGroups.has(group)) continue;
    usedGroups.add(group);
    unique.push(id);
    // 混ぜる指定が無いときは、必要な数が揃った時点で打ち切ってよい。
    // 混ぜる指定があるときは、後ろの方にしか無い形式（かな入力）を
    // 拾う必要があるので ★最後まで見る★。
    if (!mix && unique.length >= count) break;
  }

  if (!mix) return unique;

  // ------------------------------------------------------------
  // ★選択式とかな入力を混ぜる★
  // ------------------------------------------------------------
  // 利用者の指定は「みんはや形式（1文字ずつ押す）をもっと入れてほしい。
  // ただし全部をそうしなくてよい。四択問題も含めて」だった。
  //
  // ■ なぜ「形式で絞ってから抽選」ではだめなのか
  //   形式で絞ると 0問か全問かにしかならない。
  //   「10問中3問だけかな入力」は、抽選のあとに
  //   ★形式ごとの取り分を決める★ことでしか作れない。
  //
  // ■ 足りないときは自動で振り替える
  //   例：地理はかな入力が0問なので、0.3 を指定しても
  //   かな入力の取り分が0になり、全問が選択式で埋まる。
  //   逆に生物基礎のようにかな入力が多い教科では、
  //   選択式が足りなければかな入力で埋める。
  //   ★どちらの場合も「問題数が足りない」で試合が短くなることはない。★
  const kanaIds: string[] = [];
  const otherIds: string[] = [];
  for (const id of unique) {
    if (mix.isKana(id)) kanaIds.push(id);
    else otherIds.push(id);
  }

  const share = Math.min(1, Math.max(0, mix.kanaShare));
  const total = Math.min(count, unique.length);
  // 四捨五入。0.3 × 10問 = 3問。0.3 × 5問 = 2問（1.5 → 2）。
  let wantKana = Math.min(Math.round(total * share), kanaIds.length);
  let wantOther = total - wantKana;

  // 選択式が足りなければ、その分をかな入力で埋める（逆も同じ）。
  if (wantOther > otherIds.length) {
    const short = wantOther - otherIds.length;
    wantOther = otherIds.length;
    wantKana = Math.min(kanaIds.length, wantKana + short);
  }

  const chosen = [...kanaIds.slice(0, wantKana), ...otherIds.slice(0, wantOther)];

  /**
   * ★取り分を決めたあと、もう一度並べ直す★
   *
   * ■ なぜ「unique の順で拾い直す」ではだめなのか（実測で判明）
   * 上で取っているのは「シャッフル列に先に現れたかな入力3問」と
   * 「先に現れた選択式7問」である。かな入力は30問中3問（上位10%）しか
   * 取らないので選ばれる3問は列のかなり前方に集まるが、
   * 選択式は30問中7問（上位23%）なので後ろまで取る。
   * その結果 ★かな入力が試合の前半に固まる★。
   * 30部屋で試したところ、8部屋で1〜3問目が全部かな入力になった
   * （前半だけ極端に難しい試合になる）。
   *
   * 取り分を決めてから並べ直すと、どの位置に来るかが形式と無関係になる。
   * 同じ種なら同じ並びになるので、両端末で同じ出題順という前提も保たれる
   * （random は上のシャッフルの続きなので、種だけで決まる）。
   */
  return pickRandom(chosen, chosen.length, random);
}
