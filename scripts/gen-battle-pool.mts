/**
 * ===================================================================
 * 対戦用 出題プールの生成スクリプト
 * ===================================================================
 *
 *     npm run gen:battle-pool
 *
 * 教科データ本体（src/data/*.ts）から、対戦で出題できる小問だけを抜き出して
 *
 *     src/battle/data/battlePool.generated.ts
 *
 * を生成する。
 *
 * -------------------------------------------------------------------
 * ■ なぜ「生成」するのか（実行時に作らない理由）
 * -------------------------------------------------------------------
 * 対戦は「両者にまったく同じ問題を、同じ順で出す」ことが絶対条件である。
 * もし出題プールを実行時に組み立てると、
 *
 *   ・アプリを更新した直後、片方だけ新しいプールを持っている状態が起きる
 *     （＝同じ部屋なのに問題が違う、という最悪の不具合になる）
 *   ・誤答選択肢を実行時に抽選すると、両者で違う選択肢が並ぶ
 *
 * という2つの破綻が起きる。そこで
 *
 *   ・プールの内容（誤答選択肢・並び順・制限時間）はビルド時に確定させる
 *   ・実行時は「そのプールから、部屋IDを種にして問題を抽選する」だけにする
 *
 * という形にした。抽選は決定論的な乱数（battleCore.ts の buildQuestionOrder）
 * なので、種が同じなら誰の端末でも同じ並びになる。
 *
 * さらに、既存の scripts/gen-chapter-index.mts と同じ方式で
 * ★生成物が本体とズレていないかをテストで突き合わせる★
 * （src/battle/tests/battlePool.test.ts）。
 * 問題を足して再生成を忘れるとテストが落ちるので、
 * 古いプールが本番に出ることはない。
 *
 * -------------------------------------------------------------------
 * ■ ★出題するのは「演習でそのまま解ける問題」だけ★（最重要の方針）
 * -------------------------------------------------------------------
 * 以前は、元が短答・記述の設問も対戦向けに作り替えて出題していた。
 *
 *   word  … 答えの代わりに「同じ章の他の設問の正解」を誤答として3つ並べる
 *   panel … 答えの文字をばらして、文字パネルを押して組み立てさせる
 *
 * この2つは数を稼げた（1428問のうち1064問）が、
 * ★問いとして成り立たない問題が大量に混ざった★。
 *
 *   ・借りてきた誤答が、その問いに対しても実は正しい
 *     （「代謝」の誤答に「同化」を借りると、文脈によってはどちらも正しい）
 *   ・穴埋めのリード文を切り出す過程で前提の文が落ち、答えが一意でなくなる
 *   ・文字パネルは答えの表記ゆれ（送り仮名・カタカナ・記号）を1つに固定できない
 *
 * 利用者からも「問題が論理的に破綻している場合が多い。
 * 現段階では演習問題と同じものを利用するようにして」と指摘された。
 * そこで、現在は
 *
 *   ★元データが選択肢を持っている設問だけを、選択肢をいじらずに出す★
 *
 * という一本の方針にしている。対戦に出る問題は、演習で解ける問題と
 * まったく同じ内容・同じ選択肢である（＝答えが一意であることを
 * 出題者がすでに保証している）。
 *
 * 変換系のコードは USE_SYNTHESIZED_FORMATS で丸ごと止めてある。
 * 消していないのは、上の3点を解決できたときに戻せるようにするため。
 *
 * -------------------------------------------------------------------
 * ■ 選択肢を「足さない・削らない・並べ替えない」
 * -------------------------------------------------------------------
 * 元データの選択肢は2〜6個ある（実測: 2択109件・3択49件・4択484件・5〜6択30件）。
 *
 * ★2択を4択に膨らませない★
 *   「元素／単体」の2択に他の設問の答えを2つ足すと
 *   「元素／単体／中和／モル」のように毛色の違う語が並び、
 *   消去法だけで当たる問題になる（＝元の設問より簡単になる）。
 *
 * ★5〜6択を4択に切り詰めない★
 *   切り詰めると、出題者が「紛らわしいから並べた」選択肢が消える。
 *
 * ★並べ替えもしない★
 *   演習で見た並びと同じにしておけば、対戦で覚えた位置が演習でも通じる。
 *   （並べ替えても両者に同じ並びを配れるが、そこに利点が無い）
 *
 * よって回答形式は次の2つだけになる。
 *
 *   choice4 … 選択肢がちょうど4つ
 *   choice  … 選択肢が2・3・5・6個（元データのまま）
 *
 * -------------------------------------------------------------------
 * ■ 記号だけの選択肢は、問題文の凡例から本文に戻す
 * -------------------------------------------------------------------
 * 元データには options が
 *
 *     ['①','②','③','④']      （英文法・リスニング）
 *     ['(イ)','(ウ)','(エ)']    （化学基礎の分類問題）
 *     ['A','B','C']            （同上）
 *
 * という★記号だけ★のものがある。選択肢の本文は問題文の中にある。
 * そのまま出すと「①」「②」と書かれたカードが並ぶだけの画面になるので、
 *
 *   ・「問N ＋ ①〜④」の行構造から取り出す（parseNumberedBlocks）
 *   ・「(イ) 混合物　(ウ) 単体」「【A：単体】」の凡例から取り出す（buildLegend）
 *
 * の2通りで本文に戻す。★どちらでも戻せない設問は出題しない。★
 */

import { buildSingleBlankDisplay, singleQuestionLabel, stripExerciseHeading, hasUnresolvedBlank, type PromptSub } from '../src/battle/core/questionPrompt';
import { writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SUBJECTS, getChaptersOfSubject } from '../src/data/allChapters';
import { battleTimeLimitOf } from '../src/battle/core/battleTiming';
import { normalizeAnswer } from '../src/utils/answerJudge';
/**
 * ★手書き問題（authored）の型は画面・検証器と共有する★
 * ここで独自に型を書くと、検証器が通した JSON を生成器が別の形だと思って
 * 静かに落とす、という一番気づきにくい壊れ方をする。必ず同じファイルを見る。
 */
import type { AuthoredFile, AuthoredQuestion } from '../src/battle/core/authoredTypes';
/**
 * ★手書き問題の変換の判断は共有モジュールに置く★
 * ここに書くとテストから呼べないため（このファイルは import すると main() が走る）。
 */
import {
  convertAuthoredQuestion,
  authoredRejectMessage,
} from '../src/battle/core/authoredConvert';
/**
 * ★五十音キーボードの番号表は画面と共有する★
 * ここで独自に文字表を持つと、生成した番号と画面の文字がズレて
 * 「正しく答えたのに不正解」になる。必ず同じファイルを参照する。
 */
import { kanaKeysOf, KANA_MAX_INPUT } from '../src/battle/core/kanaKeyboard';
/**
 * ★対戦ルールは画面と同じ定義を見る★
 * 外部プールが「1試合ぶんを組めるか」を確かめるのに questionCount が要る。
 * ここで独自に 10 と書くと、ルールを変えたときに検査だけ古い値で通ってしまう。
 */
import { defaultRuleOf } from '../src/battle/core/battleRules';

const HERE = dirname(fileURLToPath(import.meta.url));
/** 生成物の出力先ディレクトリ（教科ごとに1ファイル＋索引1ファイルを置く） */
const OUT_DIR = resolve(HERE, '../src/battle/data');
/**
 * 別の作業場が書いた手書き問題の置き場。
 * `npm run import:authored -- <zip>` だけがここに書き込む。
 * ★中身は検証器（verify-authored-battle.mts）を通ったものだけ★という前提で読む。
 */
const AUTHORED_DIR = resolve(HERE, '../src/battle/data/authored');

/**
 * ★外部プール（別リポジトリで作られた教科まるごと）の置き場所★
 *
 * ■ authored/ と何が違うのか
 *   authored/ は「本体の教科データ（src/data/*.ts）に既にある小問」に対して
 *   作業場が選択肢と解説を書いたものである。だから元の小問が無いと孤児になる。
 *
 *   external/ は ★本体に教科データが1行も無い教科★ を丸ごと受け取るための口。
 *   高校入試理科（三重県後期選抜入試対策理科最終プリント由来・1117問）が
 *   これに当たる。理科は演習・まとめ・出題傾向の画面を
 *   src/features/rika/ に自前で持っており、
 *   本体の章・大問・小問の形（miniTest / practiceProblems）を持っていない。
 *
 * ■ なぜ pool.rika.generated.ts を手で置かないのか
 *   索引（battlePool.ts）は ★このスクリプトが丸ごと生成する★。
 *   手で置いたファイルは loadPool() の switch にも POOL_COUNTS にも現れず、
 *   どこからも読まれない孤立ファイルになる（次の生成で気づかないまま残る）。
 *   ここから読めば、索引・形式別件数・解答ファイルまで全部そろう。
 *
 * ■ 中身の形（rika.json）
 *   { subject, label, source, questions: [ { id, chapterId, problemId,
 *     subQuestionId, format, prompt, label, options, answerIndex,
 *     panelOrder, timeLimit, imageUrl } ] }
 *   ★PoolQuestion とそろえてある★ ので、そのままプールに足せる。
 */
const EXTERNAL_DIR = resolve(HERE, '../src/battle/data/external');

// ============================================================
// 生成に使う設定
// ============================================================

/**
 * 対戦の制限時間の下限・上限（秒）。
 *
 * 既存の scoring.ts の見積り（20〜240秒）は「1人でじっくり解く」前提なので、
 * そのままだと対戦としては長すぎる。対戦では次の式で圧縮する。
 *
 *     対戦の秒数 = clamp(round(1人用の秒数 × BATTLE_TIME_RATIO), 下限, 上限)
 *
 * ★比率で圧縮する理由★
 * 全問同じ秒数にすると、問題文が長い問題（実データの上位10%は904文字以上）は
 * 読み終わる前に締切が来てしまう。1人用の見積りは問題文の長さ・選択肢の数を
 * 見ているので、比率で縮めれば「長い問題は長め」という関係が保たれる。
 */
// 下限・上限・比率は src/battle/core/battleTiming.ts に固定（1人用の調整で対戦が変わらないように）

/**
 * ★合成形式（word / panel）を作るか★
 *
 * false = 元データが選択肢を持っている設問だけを出す（現在の方針）。
 * true に戻すと、短答・記述から誤答を借りて4択を作る動作が復活する。
 *
 * 戻す前に、ファイル冒頭に書いた3つの破綻（誤答が実は正しい／
 * 切り出しで前提が落ちる／表記ゆれを固定できない）を必ず解決すること。
 * 解決していない状態で戻すと、対戦に「誰も正解できない問題」が混ざる。
 */
const USE_SYNTHESIZED_FORMATS = false;

/**
 * 出題に使える選択肢の数の範囲。
 *
 * 下限2 … 元データが意図して作った2択（「元素／単体」など109件）を認める。
 * 上限6 … 7択以上は、スマホの1画面に収めると1つあたりが読めない大きさになる。
 *         実測で7択は2件しか無いので、切り詰めるより外すほうが素直。
 */
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

/**
 * ★五十音キーボード形式（kana）にできる答えの文字数★
 *
 * 下限2 … 1文字の答え（「鐵」「水」など）は、押した瞬間に確定する形になり
 *          誤タップがそのまま誤答になる。手直しの余地が欲しいので2字以上。
 * 上限8 … 制限時間が8〜30秒しかないので、9字以上は思い出せていても
 *          押し終わらない（実測の最長は8字「デオキシリボース」）。
 *
 * なお Firestore のルールが panel.size() <= 12 で受け付けを制限しているので、
 * 上限はいずれにしろ12を超えられない。
 */
const KANA_MIN_CHARS = 2;
const KANA_MAX_CHARS = 8;

/** 文字パネル形式にできる答えの文字数 */
const PANEL_MIN_CHARS = 2;
const PANEL_MAX_CHARS = 5;

/** 文字パネルに並べるダミー文字の数（正解の文字数に加えて並べる） */
const PANEL_DECOY_COUNT = 3;

/** 語句選択（word）で使う答えの最大文字数。これより長いとカードに収まらない */
const WORD_MAX_CHARS = 28;

/**
 * 対戦用に切り出す問題文（リード文）の最大文字数。
 *
 * ★リード文と設問文を別枠にしている理由★
 * 穴埋め問題は「長いリード文の中に空欄がある」形なので、
 * リード文を丸ごと切ると空欄そのものが消えてしまう。
 * そこで
 *   ・空欄の周辺だけを切り出す（extractBlankContext）
 *   ・設問文（ラベル）は別枠で必ず全文出す
 * という2段構えにしている。
 */
const PROMPT_MAX_CHARS = 150;
/** 対戦に出す「絵を選ぶ」リスニング（第1問B・第2問）の絵の置き場所。第4問〜第6問は音声が長すぎるので入れない */
const LISTENING_PICTURE_DIRS = ['/listening_q1b/', '/listening_q2/'];

/** 設問文（ラベル）の最大文字数 */
const LABEL_MAX_CHARS = 110;

/**
 * ラベルが「それだけで答えられる問い」と見なす最小文字数。
 *
 * 「(ア)」「問3」のような参照記号を取り除いた残りがこれ以上あれば、
 * ラベル自体が問いになっていると判断する（実測: 146件が該当）。
 */
const SELF_CONTAINED_MIN_CHARS = 6;

/**
 * ラベル自体が問いのとき、リード文を添える上限文字数。
 * これを超えるリード文は捨てる（肝心の問いが埋もれるため）。
 */
const SELF_CONTAINED_LEAD_MAX = 70;

// ============================================================
// 型
// ============================================================

type Format = 'choice4' | 'choice' | 'kana' | 'word' | 'panel';

interface PoolQuestion {
  id: string;
  subject: string;
  chapterId: string;
  problemId: string;
  subQuestionId: string;
  format: Format;
  prompt: string;
  label: string;
  options: string[];
  answerIndex: number;
  panelOrder: number[];
  timeLimit: number;
  imageUrl?: string;
  /**
   * ★試合後にだけ出す「答え＋ひと言の理由」（請求⑦-A）★
   * 手書き問題（authored）だけが持つ。機械生成は空文字。
   * ★出題プール（pool.*.generated.ts）には書き出さない。★
   *   別ファイル（answer.*.generated.ts）に分けて出す。理由は
   *   renderAnswerFile() のコメントに書いた。
   */
  oneLine?: string;
}

interface RawSub {
  subject: string;
  chapterId: string;
  problemId: string;
  problemText: string;
  siblings: PromptSub[];
  imageUrl?: string;
  id: string;
  label: string;
  type: string;
  correctAnswer: string;
  acceptedAnswers: string[];
  options: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any;
}

// ============================================================
// 決定論的な乱数（生成の再現性のため）
// ============================================================

/**
 * 種から擬似乱数を作る（battleCore.ts と同じ mulberry32）。
 *
 * ★生成に Math.random() を使わない理由★
 * 使うと、同じ問題データから生成しても毎回違うプールができてしまう。
 * そうなると「再生成の差分」が本当の変更なのか乱数のゆらぎなのか
 * 区別できず、レビューできない。ここでは設問IDを種にするので、
 * 同じデータからは必ず同じプールが生成される。
 */
function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function random(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWith<T>(items: readonly T[], random: () => number): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

// ============================================================
// 問題文の整形
// ============================================================

/**
 * 問題文から、対戦画面に出す部分だけを切り出す。
 *
 * ★なぜ切り出すのか★
 * 実データの問題文には、対戦では邪魔な情報が含まれている。
 *   ・「第1回　① 基本5文型（5問・4択）」のような見出し
 *   ・「【音源の聞き方】…」のような操作説明（数百文字）
 *   ・「────────」の区切り線
 *   ・問1〜問5 の全部（対戦では1問だけ出したい）
 * これをそのまま出すと、画面が説明文で埋まって肝心の設問が見えない。
 */
function cleanPrompt(text: string): string {
  const lines = String(text || '').split('\n');
  const kept: string[] = [];
  let skipping = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    // 区切り線
    if (/^[─—\-=＝]{3,}$/.test(line)) continue;
    // 【…】で始まる操作説明のブロックは、次の空行までまとめて捨てる
    // ただし英文法の【並べかえ】は問題文そのもの（操作説明ではない）なので残す
    if (/^【.*】/.test(line) && !/^【並べかえ】/.test(line)) {
      skipping = true;
      continue;
    }
    if (skipping) {
      // 説明の続き（句点で終わる説明文）を捨て続ける。
      // 「問1」など設問が始まったら再開する。
      if (/^問\s*\d+/.test(line) || /^[（(]?[ア-ンA-Za-z0-9]{1,3}[)）]/.test(line)) {
        skipping = false;
      } else {
        continue;
      }
    }
    // 「第1回　第1問 A（4問・2回読み）」のような見出し
    if (/^第\s*\d+\s*回/.test(line) && line.length < 60) continue;
    // 「①〜④のうちから1つずつ選びなさい」のような一括指示
    if (/[①-⑩]〜[①-⑩]/.test(line) && /選び/.test(line)) continue;
    kept.push(line);
  }

  const joined = kept.join('\n').trim();
  if (joined.length <= PROMPT_MAX_CHARS) return joined;
  return `${joined.slice(0, PROMPT_MAX_CHARS - 1)}…`;
}

/**
 * 問題文の中から「問N」のブロック（設問文＋①〜④）を切り出す。
 *
 * ★なぜ必要なのか（実測）★
 * 英文法100問・リスニング221問は、選択肢の配列が
 *
 *     options: ['①','②','③','④']
 *
 * という★記号だけ★になっていて、選択肢の本文は問題文の中にある。
 *
 *     問1　Your plan ______ good to me.
 *     ① sounds
 *     ② hears
 *     ③ listens
 *     ④ is heard
 *
 * これを解析せずに出題すると、対戦画面のカードが「①」「②」「③」「④」に
 * なってしまい、何も読めない画面になる。
 *
 * 実測の成功率:
 *   英文法        100/100 件（全件成功）
 *   リスニング    146/221 件（残り75件はイラスト選択問題で、
 *                 選択肢が絵なので対戦には使えない → プールに入れない）
 */
function parseNumberedBlocks(text: string): Map<number, { stem: string; options: string[] }> {
  const out = new Map<number, { stem: string; options: string[] }>();
  const lines = String(text || '').split('\n');
  let cur: { no: number; stem: string[]; opts: string[] } | null = null;

  const flush = (): void => {
    if (cur && cur.opts.length >= 2) {
      out.set(cur.no, { stem: cur.stem.join(' ').trim(), options: cur.opts });
    }
    cur = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    const mq = line.match(/^問\s*(\d+)[　\s]*(.*)$/);
    if (mq) {
      flush();
      cur = { no: Number(mq[1]), stem: mq[2] ? [mq[2]] : [], opts: [] };
      continue;
    }
    if (!cur) continue;
    const mo = line.match(/^([①②③④⑤⑥⑦⑧⑨⑩])[\s　]*(.+)$/);
    if (mo) {
      cur.opts.push(mo[2].trim());
      continue;
    }
    if (/^[─—\-=＝]{3,}$/.test(line)) {
      flush();
      continue;
    }
    if (line && cur.opts.length === 0) cur.stem.push(line);
  }
  flush();
  return out;
}

/** 選択肢が記号だけ（①②③④ / (イ)(ウ)(エ) / A B C）かどうか */
function isSymbolOnlyOptions(options: string[]): boolean {
  if (options.length === 0) return false;
  return options.every((o) => symbolKeyOf(o) !== null);
}

/**
 * 記号だけの選択肢から「記号そのもの」を取り出す。記号でなければ null。
 *
 * 「(イ)」→「イ」、「① 」→「①」、「A」→「A」。
 * ★括弧を外して比べる理由★
 * 元データでは選択肢が「(イ)」なのに凡例が「( イ ) 混合物」だったり、
 * 逆に選択肢が「A」で凡例が「【A：単体】」だったりする。
 * 記号だけを取り出しておけば、括弧・空白の違いに影響されずに突き合わせられる。
 */
function symbolKeyOf(option: string): string | null {
  const s = option.replace(/\s+/g, '').replace(/^[（(【]/, '').replace(/[)）】]$/, '');
  if (/^[①-⑩]$/.test(s)) return s;
  if (/^[ア-ン]$/.test(s)) return s;
  if (/^[A-Za-z]$/.test(s)) return s.toUpperCase();
  return null;
}

/**
 * 問題文の中の「凡例」から、記号 → 本文の対応を作る。
 *
 * ★これが無いと出せない設問がある（実測40件）★
 * 化学基礎の分類問題は、選択肢が記号だけで本文が問題文の凡例にある。
 *
 *     問2 次の (1)〜(6) の物質は、文章中の( イ )～（ エ ）のどれに分類されるか答えよ。
 *     (イ) 混合物　(ウ) 単体　(エ) 化合物
 *
 *     問2 次の（1）〜（15）の物質を、【A：単体】【B：化合物】【C：混合物】に分類しなさい。
 *
 * どちらも「記号 ＋ 区切り ＋ 短い語」という同じ形をしている。
 * 拾えれば「空気 → 混合物／単体／化合物」という、演習とまったく同じ
 * 3択の設問として出せる。拾えなければ「(イ)/(ウ)/(エ)」と書かれた
 * カードが並ぶだけの画面になるので、そのときは出題しない。
 *
 * -------------------------------------------------------------------
 * ■ 拾い間違いを防ぐための条件
 * -------------------------------------------------------------------
 * 「(1) 空気　(2) 酸素」のような ★設問の通し番号★ を凡例と誤認すると、
 * 選択肢に「空気／酸素／食塩水」が並ぶ別の問題になってしまう。そこで
 *
 *   ・数字の記号（(1) など）は凡例として採らない
 *   ・本文が長い（LEGEND_MAX_CHARS 超）ものは採らない
 *   ・記号が2つ以上そろわないと採用しない
 *
 * の3つで絞る。
 */
const LEGEND_MAX_CHARS = 20;

function buildLegend(text: string): Map<string, string> {
  const out = new Map<string, string>();
  const src = String(text || '');

  const add = (rawKey: string, rawBody: string): void => {
    const key = symbolKeyOf(rawKey);
    if (!key) return;
    // 数字は設問の通し番号なので凡例として扱わない
    if (/^[0-9０-９]+$/.test(rawKey.replace(/\s+/g, ''))) return;
    const body = rawBody
      .replace(/\s+/g, ' ')
      .replace(/[、。，．]+$/, '')
      .trim();
    if (!body || body.length > LEGEND_MAX_CHARS) return;
    // 本文が別の記号だけ（「(イ) (ウ)」のような列挙）なら凡例ではない
    if (symbolKeyOf(body) !== null) return;
    if (!out.has(key)) out.set(key, body);
  };

  // 形①「【A：単体】【B：化合物】」
  for (const m of src.matchAll(/【\s*([A-Za-zア-ン①-⑩])\s*[：:]\s*([^】]+)】/g)) {
    add(m[1], m[2]);
  }

  // 形②「(イ) 混合物　(ウ) 単体」／「① sounds」
  //   本文は「次の記号が始まるまで」または「全角空白・改行まで」。
  for (const m of src.matchAll(
    /[（(]\s*([A-Za-zア-ン])\s*[)）]\s*([^（()）\n　]{1,20})/g,
  )) {
    add(m[1], m[2]);
  }

  return out;
}

/** 正解の選択肢が options の何番目かを求める（記号・本文の両方に対応） */
function findAnswerIndex(options: string[], correctAnswer: string): number {
  const target = normalizeAnswer(correctAnswer);
  if (!target) return -1;

  // ① そのまま一致
  const direct = options.findIndex((o) => normalizeAnswer(o) === target);
  if (direct >= 0) return direct;

  // ② 「①」のような記号で答えが指定されている場合、記号の位置を数える
  const symbols = '①②③④⑤⑥⑦⑧⑨⑩';
  const symIdx = symbols.indexOf(target);
  if (symIdx >= 0 && symIdx < options.length) return symIdx;

  // ③ 「ア」のような記号
  const kana = 'アイウエオカキクケコ';
  const kanaIdx = kana.indexOf(target);
  if (kanaIdx >= 0 && kanaIdx < options.length) return kanaIdx;

  // ④ 「a」「A」
  if (/^[a-jA-J]$/.test(target)) {
    const i = target.toLowerCase().charCodeAt(0) - 97;
    if (i < options.length) return i;
  }
  return -1;
}

// ============================================================
// 収集
// ============================================================

function collectAll(): RawSub[] {
  const rows: RawSub[] = [];
  /**
   * 収録済みの小問キー。
   *
   * ★重複を除く理由（実測 83 件）★
   * 教科データには、同じ大問が miniTest と practiceProblems の両方に
   * 登録されている章がある（chemistry_basic の c2_1 で 7 大問）。
   * 1人用では「小テスト」と「演習」という別の入口なので問題ないが、
   * 対戦プールにそのまま入れると、まったく同じ問題が2件並ぶ。
   * 抽選で両方引くと ★同じ問題が1試合に2回出る★ ので、先に潰す。
   */
  const seen = new Set<string>();

  for (const subject of SUBJECTS) {
    for (const chapter of getChaptersOfSubject(subject.id)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ch = chapter as any;
      const problems = [...(ch.miniTest || []), ...(ch.practiceProblems || [])];
      for (const problem of problems) {
        for (const sq of problem.subQuestions || []) {
          const key = `${ch.id}/${problem.id}/${sq.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          // ★リスニングは音源ファイル（audioUrl）がある小問だけ対戦に出す★
          //   対戦は音源を必ず鳴らす（battlePool.ts が audioUrl 無しを例外にする）。
          //   第2問の追加10問のように「絵はあるが録音待ち」の小問は、録音が入るまで対戦に出さない。
          if (subject.id === 'english_listening') {
            const track = (problem.audioTracks || []).find((t: { subId?: string; subIds?: string[] }) =>
              t.subId === sq.id || t.subIds?.includes(sq.id));
            if (!track?.audioUrl) continue;
          }

          rows.push({
            subject: subject.id,
            chapterId: String(ch.id),
            problemId: String(problem.id),
            problemText: String(problem.text || ''),
            siblings: problem.subQuestions || [],
            imageUrl: problem.imageUrl ? String(problem.imageUrl) : undefined,
            id: String(sq.id),
            label: String(sq.label || ''),
            type: String(sq.type || 'text'),
            correctAnswer: String(sq.correctAnswer ?? ''),
            acceptedAnswers: Array.isArray(sq.acceptedAnswers)
              ? sq.acceptedAnswers.map((a: unknown) => String(a))
              : [],
            options: Array.isArray(sq.options) ? sq.options.map((o: unknown) => String(o)) : [],
            raw: sq,
          });
        }
      }
    }
  }
  return rows;
}

// ============================================================
// 変換: 元データが選択肢を持っている設問（★これが唯一の出題元★）
// ============================================================

/**
 * 元データの選択肢をそのまま使って出題1問を作る。
 *
 * ★この関数は選択肢を1つも足さず・削らず・並べ替えない。★
 * 演習で解ける問題と、対戦に出る問題を同一にするための中核である。
 *
 * -------------------------------------------------------------------
 * ■ 処理の流れ
 * -------------------------------------------------------------------
 *  1. 選択肢が記号だけなら、本文に戻す（戻せなければ出題しない）
 *  2. 選択肢の数が 2〜6 の範囲に無ければ出題しない
 *  3. 正解が選択肢の何番目かを特定できなければ出題しない
 *  4. 選択肢が重複していたら出題しない（正解が2つある状態になる）
 *  5. 画面を見て何を答えるか分からない設問は出題しない
 *
 * どの段階でも「無理に成立させない」。数が減っても、
 * 出た問題がすべて正しく解ける状態のほうが対戦としては健全である。
 */
function convertChoice(
  row: RawSub,
  blocks: Map<number, { stem: string; options: string[] }>,
  legend: Map<string, string>,
): PoolQuestion | null {
  let options = row.options.map((o) => o.trim()).filter((o) => o.length > 0);
  if (options.length === 0) return null;

  let stem = '';
  /** 絵を選ぶ問題の小問ごとの絵（経路③） */
  let pictureImage: string | undefined;
  /** 正解が「記号」で書かれている場合の、記号での位置合わせに使う元の並び */
  let symbolOptions: string[] | null = null;

  if (isSymbolOnlyOptions(options)) {
    symbolOptions = options;

    // 経路① 「問N ＋ ①〜④」の行構造から取る（英文法・リスニング）
    const m = row.label.match(/問\s*(\d+)/);
    const block = m ? blocks.get(Number(m[1])) : undefined;

    if (block && block.options.length === options.length) {
      options = block.options.map((o) => o.trim());
      stem = block.stem;
    } else if (
      row.subject === 'english_listening'
      && typeof row.raw?.imageUrl === 'string'
      && LISTENING_PICTURE_DIRS.some((dir) => String(row.raw.imageUrl).startsWith(dir))
      && options.length === 4
      && options.every((o) => /^[①②③④]$/.test(o))
    ) {
      // 経路③ ★リスニングの「絵を選ぶ」問題（第1問B・第2問）★
      //   選択肢は絵（①〜④が描かれた1枚の画像）なので、本文には直せない。
      //   以前はここで捨てていたため、対戦には第1問A・第3問しか出なかった。
      //   選択肢は ①〜④ のまま、その小問の絵を一緒に出す（対戦画面が画像を表示する）。
      //   問題文は「音声を聞いて絵を選ぶ」指示にする（英文の中身は音声にしかない）。
      //   ★「①〜④から選びなさい」と書くと cleanPrompt が一括指示として消すので、その形にしない★
      //
      //   ★第4問〜第6問は入れない★
      //   音声が28〜128秒あり、対戦の締切（ルールで60秒未満）の中では聞き終わらない。
      stem = '音声を聞いて、内容に最も合う絵を選びなさい。';
      pictureImage = String(row.raw.imageUrl);
    } else {
      // 経路② 問題文の凡例から取る（「(イ) 混合物」「【A：単体】」）
      const mapped = options.map((o) => {
        const key = symbolKeyOf(o);
        return key ? legend.get(key) : undefined;
      });
      // ★1つでも引けない記号があれば出題しない★
      //   一部だけ本文に置き換えると「混合物／単体／(エ)」という
      //   意味不明な選択肢が並ぶ。全部揃うか、出さないかの二択にする。
      if (mapped.some((v) => !v)) return null;
      options = mapped.map((v) => String(v));
    }
  }

  if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) return null;

  // 正解の位置。記号だった場合は「記号の並び」で位置を求める
  // （本文に置き換えたあとの配列と添字は一致している）。
  const answerIndex = findAnswerIndex(symbolOptions || options, row.correctAnswer);
  if (answerIndex < 0 || answerIndex >= options.length) return null;

  // 選択肢の重複は「正解が2つある」状態。正しく答えたのに不正解になる人が出る。
  const uniq = new Set(options.map((o) => normalizeAnswer(o)));
  if (uniq.size !== options.length) return null;

  // 対戦画面に出す問題文と設問文。
  //
  // ★stem（問題文から切り出したその設問だけの文）があれば最優先★
  //   リード文全体より短く、かつその設問の内容そのものなので確実。
  // ★無ければ穴埋め問題と同じ組み立てを使う★
  //   選択式でも「リード文の(ア)に入る語を選べ」型があり、
  //   リード文を先頭から切ると空欄が消える。また地理・生物には
  //   「問いはラベルにあり、リード文は資料の導入だけ」という型があるので、
  //   buildBlankPrompt に判定を任せる（同じ規則を2箇所に書かない）。
  const display = stem
    ? { prompt: cleanPrompt(stem), label: formatLabel(row.label), answerable: true }
    : buildBlankPrompt(row);

  // ★何を答えるか分からない設問は出さない★
  //   ラベルが「(1)」だけ・リード文にも空欄が見つからない、という設問が
  //   元データに一定数ある。出すと両者にとって運の問題になる。
  if (!isAnswerable(display)) return null;

  return {
    id: `q:${uniqueKey(row)}`,
    subject: row.subject,
    chapterId: row.chapterId,
    problemId: row.problemId,
    subQuestionId: row.id,
    // 4つだけ choice4、それ以外（2・3・5・6）は choice。
    // 画面の並べ方を切り替えるための区別で、採点の扱いは同じ。
    format: options.length === 4 ? 'choice4' : 'choice',
    prompt: display.prompt,
    label: display.label,
    options: options.map((o) => trimOption(o)),
    answerIndex,
    panelOrder: [],
    // ★元データが制限時間を持っていればそれを使う（英文法 改訂版：15／20／25秒）★
    timeLimit: Number.isFinite(row.raw?.battleTimeLimit) ? Number(row.raw.battleTimeLimit) : battleTimeLimit(row),
    imageUrl: pictureImage ?? row.imageUrl,
    // ★試合後の1行解答（答え＋ひと言）。出題プールには入らず answer.*.generated.ts に分けて出る★
    ...(typeof row.raw?.oneLine === 'string' && row.raw.oneLine.trim() ? { oneLine: String(row.raw.oneLine).trim() } : {}),
  };
}

// ============================================================
// 変換: 短答・記述 → 語句選択（word）
// ============================================================

/**
 * 短答・記述の設問を「4つの語句カードから選ぶ」形に変換する。
 *
 * 誤答は同じ章の他の設問の正解から取る（無ければ同じ教科から補う）。
 * ★文字数の近いものを優先する★
 *   「混合物」の誤答に「液体が周囲に飛び散るのを防ぐため」が混ざると、
 *   長さだけで正解が分かってしまう（長い方が正解だと当てられる）。
 *   そこで、正解と文字数が近い候補を優先して並べる。
 */
function convertWord(
  row: RawSub,
  sameChapter: string[],
  sameSubject: string[],
): PoolQuestion | null {
  const answer = row.correctAnswer.trim();
  if (!answer) return null;
  if (answer.length > WORD_MAX_CHARS) return null;

  const answerNorm = normalizeAnswer(answer);

  /** 候補から、正解と同じもの・重複を除いて文字数の近い順に並べる */
  const rank = (pool: string[]): string[] => {
    const seen = new Set<string>([answerNorm]);
    const uniq: string[] = [];
    for (const c of pool) {
      const n = normalizeAnswer(c);
      if (!n || seen.has(n)) continue;
      // 正解が誤答の一部（またはその逆）になっているものは避ける。
      // 「単体」と「単体・化合物」が並ぶと、どちらも正しく見えてしまう。
      if (n.includes(answerNorm) || answerNorm.includes(n)) continue;
      seen.add(n);
      uniq.push(c.trim());
    }
    return uniq.sort(
      (a, b) => Math.abs(a.length - answer.length) - Math.abs(b.length - answer.length),
    );
  };

  const candidates = [...rank(sameChapter), ...rank(sameSubject)];
  // 章の候補で足りない場合に教科の候補が続くので、重複をもう一度除く
  const seen = new Set<string>([answerNorm]);
  const decoys: string[] = [];
  for (const c of candidates) {
    const n = normalizeAnswer(c);
    if (seen.has(n)) continue;
    seen.add(n);
    decoys.push(c);
    if (decoys.length === 3) break;
  }
  if (decoys.length < 3) return null;

  const random = createRandom(hashString(`w:${uniqueKey(row)}`));
  const options = shuffleWith([answer, ...decoys], random);
  const answerIndex = options.findIndex((o) => normalizeAnswer(o) === answerNorm);
  if (answerIndex < 0) return null;

  const display = buildBlankPrompt(row);
  // 何を答えるのか画面から読み取れない設問は出題しない（後述の判定に集約）
  if (!isAnswerable(display)) return null;

  return {
    id: `w:${uniqueKey(row)}`,
    subject: row.subject,
    chapterId: row.chapterId,
    problemId: row.problemId,
    subQuestionId: row.id,
    format: 'word',
    prompt: display.prompt,
    label: display.label,
    options: options.map((o) => trimOption(o)),
    answerIndex,
    panelOrder: [],
    timeLimit: battleTimeLimit(row),
    imageUrl: row.imageUrl,
  };
}

/**
 * ★五十音キーボードで1文字ずつ押して答える形式（「みんはや」方式）★
 *
 * 例: 答えが「ダイヤモンド」なら、画面には五十音表だけが出て、
 *     ダ→イ→ヤ→モ→ン→ド と押す。ヒントは一切出ない。
 *
 * -------------------------------------------------------------------
 * ■ ★カタカナの答えだけに限定している★
 * -------------------------------------------------------------------
 * これがこの形式の成否を決める一点である。
 *
 * 漢字の答え（「酸化」）をかなで入力させると、
 *   ・「さんか」なのか「サンカ」なのか
 *   ・「酸化」と書きたいのに書けない
 * という具合に ★正解が1通りに定まらない★。
 * かな入力を許すと、正しく理解している人が表記の違いで落ちる。
 * これは以前の文字パネル形式が「表記ゆれを固定できない」と言われて
 * 止まった理由とまったく同じなので、繰り返さない。
 *
 * カタカナ語（「ダイヤモンド」「ミトコンドリア」「フラーレン」）は
 * ★元データの答えがそのまま唯一の書き方★なので、この問題が起きない。
 * 実測で72件（化学基礎31・生物基礎40・化学1）ある。
 *
 * -------------------------------------------------------------------
 * ■ ひらがなの答えを外している理由
 * -------------------------------------------------------------------
 * 実データのひらがな答えは「にくい」1件だけで、しかも
 * 「溶けにくい」の一部を切り出したものだった。
 * 文の一部を答えさせる形はキーボード入力に向かない（区切りが曖昧）ので外す。
 *
 * -------------------------------------------------------------------
 * ■ 同じ文字が2回出てもよい
 * -------------------------------------------------------------------
 * 文字パネル形式では「同じ文字が2回出る語」を外していた
 * （並んだパネルのどちらを押したか判別できないため）。
 * 五十音キーボードは同じキーを2回押せばよいだけなので、この制限は要らない。
 * 「バリウム」「アルミニウム」のような語が出せるようになる。
 */
function convertKana(row: RawSub): PoolQuestion | null {
  const answer = row.correctAnswer.trim();

  // ★カタカナ（＋長音）だけで書かれた答えに限る★
  if (!/^[ァ-ヶー]+$/.test(answer)) return null;

  const chars = Array.from(answer);
  if (chars.length < KANA_MIN_CHARS || chars.length > KANA_MAX_CHARS) return null;
  // Firestore のルールが panel.size() <= 12 で拒否するので、念のため二重に見る
  if (chars.length > KANA_MAX_INPUT) return null;

  /**
   * ★画面のキーボードから実際に押せる文字か★
   * 番号表（KANA_KEYS）に載っているだけで五十音表に置いていない文字
   * （現在は「ヲ」）が混ざると、誰も入力できない＝両者0点確定の問題になる。
   * kanaKeysOf が到達可能性まで見て null を返す。
   */
  const keys = kanaKeysOf(answer);
  if (!keys) return null;

  const display = buildBlankPrompt(row);
  if (!isAnswerable(display)) return null;

  return {
    id: `k:${uniqueKey(row)}`,
    subject: row.subject,
    chapterId: row.chapterId,
    problemId: row.problemId,
    subQuestionId: row.id,
    format: 'kana',
    prompt: display.prompt,
    label: display.label,
    /**
     * ★選択肢は持たない★
     * 持たせると、プールを見ただけで「答えは6文字」「ダとイを使う」と
     * 分かってしまう。キーボードは画面側が描くので、データは要らない。
     */
    options: [],
    answerIndex: -1,
    /** ★五十音キーボードのキー番号の並び★（options の添字ではない） */
    panelOrder: keys,
    timeLimit: battleTimeLimit(row),
    imageUrl: row.imageUrl,
  };
}

// ============================================================
// 変換: 短答 → 文字パネル（panel）
// ============================================================

/**
 * 短答の設問を「文字パネルを順に押して語を組み立てる」形に変換する。
 *
 * 例: 答えが「酸化」なら、パネルに ['化','素','酸','水'] を並べ、
 *     「酸」→「化」の順に押せば正解。
 *
 * ★手打ち入力の代わりとして入れている★
 * 語句選択（4択）だけだと「選択肢を見れば思い出せる」ので、
 * 用語をきちんと覚えているかを問えない。
 * 文字パネルは自分で語を組み立てる必要があるので、
 * 手打ち入力に近い手応えを、入力の速さに左右されずに出せる。
 *
 * ダミー文字は同じ章の他の答えに使われている文字から取る。
 * こうすると「その章で学ぶ用語」の文字が並ぶので、
 * 見た目で正解が浮かないうえ、紛らわしい語も作れてしまう
 * （例: 「酸化」を作るパネルで「水素」も作れる）。
 */
function convertPanel(row: RawSub, chapterChars: string[]): PoolQuestion | null {
  const answer = row.correctAnswer.trim();
  if (answer.length < PANEL_MIN_CHARS || answer.length > PANEL_MAX_CHARS) return null;
  // 日本語（漢字・ひらがな・カタカナ・長音）だけを対象にする。
  // 数式や英単語は1文字ずつ押す形に向かない（「x^5/5 + C」など）。
  if (!/^[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FFー]+$/.test(answer)) return null;
  // 同じ文字が2回出る語は、押した順の判定が分かりにくくなるので避ける
  const chars = Array.from(answer);
  if (new Set(chars).size !== chars.length) return null;

  const used = new Set(chars);
  const decoyPool = chapterChars.filter((c) => !used.has(c));
  if (decoyPool.length < PANEL_DECOY_COUNT) return null;

  const random = createRandom(hashString(`p:${uniqueKey(row)}`));
  const decoys = shuffleWith([...new Set(decoyPool)], random).slice(0, PANEL_DECOY_COUNT);
  const options = shuffleWith([...chars, ...decoys], random);

  // 正解を押す順（options の添字）
  const panelOrder: number[] = [];
  const consumed = new Set<number>();
  for (const ch of chars) {
    const idx = options.findIndex((o, i) => o === ch && !consumed.has(i));
    if (idx < 0) return null;
    consumed.add(idx);
    panelOrder.push(idx);
  }

  const display = buildBlankPrompt(row);
  if (!isAnswerable(display)) return null;

  return {
    id: `p:${uniqueKey(row)}`,
    subject: row.subject,
    chapterId: row.chapterId,
    problemId: row.problemId,
    subQuestionId: row.id,
    format: 'panel',
    prompt: display.prompt,
    label: display.label,
    options,
    answerIndex: -1,
    panelOrder,
    timeLimit: battleTimeLimit(row),
    imageUrl: row.imageUrl,
  };
}

// ============================================================
// 共通のヘルパ
// ============================================================

/**
 * 対戦での制限時間（秒）。
 * 1人用の見積り（scoring.ts）を比率で圧縮し、下限・上限でクランプする。
 */
function battleTimeLimit(row: RawSub): number {
  return battleTimeLimitOf({
    type: row.type,
    label: row.label,
    correctAnswer: row.correctAnswer,
    options: row.options,
    items: row.raw?.items,
  });
}

/**
 * 短答・記述の設問について、対戦画面に出す問題文を作る。
 *
 * -------------------------------------------------------------------
 * ■ 実データの設問は2種類に分かれる（実測）
 * -------------------------------------------------------------------
 *   ① 空欄参照型（1076件）… ラベルが「(ア)」だけ。
 *      答えるべき場所はリード文の中の「( ア )」。
 *      ラベルだけ見せても何も分からないので、★リード文が必須★。
 *
 *   ② 自己完結型（146件）… ラベルが問いそのもの。
 *      例「（1） ろ紙を通過して下に落ちた液体の名称」→ 答え「ろ液」
 *      この場合リード文は文脈にすぎず、ラベルだけで答えられる。
 *
 * この2つを同じ扱いにすると、①では「(ア)」しか出ない画面になり、
 * ②では長いリード文で肝心の問いが埋もれる。そこで型を判定して分ける。
 *
 * -------------------------------------------------------------------
 * ■ 空欄参照型で「空欄の周辺だけ」を切り出す理由
 * -------------------------------------------------------------------
 * リード文は中央値268文字・上位10%で904文字ある。
 * 先頭から150文字で切ると、後半にある空欄が消えてしまう
 * （＝答えるべき場所が画面に無い問題になる）。
 * そこで★空欄の位置を見つけて、その前後だけを残す★。
 *
 * -------------------------------------------------------------------
 * ■ 他の空欄は元の正答から補完する
 * -------------------------------------------------------------------
 * 実データには「( エ: 蒸留 )」のように、答えが併記された空欄がある。
 * 単独出題では対象だけを空欄にし、それ以外は同じ大問の正答から補完する。
 * 別の大問の正答を流用したり、補完できないものを推測で埋めたりしない。
 */
interface Display {
  prompt: string;
  label: string;
  /** 画面を見て「何を答えればよいか」が分かるか（分からない設問は出題しない） */
  answerable: boolean;
}

const PROMPT_REPAIRS: Record<string, { prompt: string; label: string; expectedAnswer: string }> = JSON.parse(
  readFileSync(new URL('./data/battle_prompt_repairs.json', import.meta.url), 'utf8'),
);

function buildBlankPrompt(row: RawSub): Display {
  const repair = PROMPT_REPAIRS[uniqueKey(row)];
  if (repair) {
    if (repair.expectedAnswer !== row.correctAnswer) throw new Error(`Stale prompt repair: ${uniqueKey(row)}`);
    return { prompt: repair.prompt, label: repair.label, answerable: true };
  }
  const blank = buildSingleBlankDisplay(row.problemText, row.raw, row.siblings);
  if (blank) return blank;
  const bare = singleQuestionLabel(row.label);
  const selfContained = bare.length >= SELF_CONTAINED_MIN_CHARS;
  const label = formatLabel(row.label);
  const text = String(row.problemText || '');

  // A one-question exercise with a generic instruction needs its WHOLE stem.
  // The instruction's character count does not make it a self-contained question.
  if (row.siblings.length === 1 && bare === '答えを選びなさい。') {
    const prompt = stripExerciseHeading(text);
    return { prompt, label, answerable: !!prompt && !hasUnresolvedBlank(prompt) };
  }

  if (selfContained) {
    // ラベル自体が問いになっている。
    // リード文は文脈にすぎないので、短ければ添え、長ければ捨てる
    // （長いリード文を付けると肝心の問いが埋もれる）。
    const lead = cleanPrompt(text);
    return {
      prompt: lead.length <= SELF_CONTAINED_LEAD_MAX && !hasUnresolvedBlank(lead) ? lead : '',
      label,
      answerable: true,
    };
  }

  // ここに来るのは「ラベルが参照記号だけ」かつ「リード文に該当の空欄が
  // 見つからなかった」設問。★画面を見ても何を答えるか分からない★ので
  // 出題対象から外す（answerable: false）。
  // 無理に出すと「(ア) に入る語は？」だけが表示され、
  // 対戦相手も自分も運で押すしかない問題になってしまう。
  return { prompt: cleanPrompt(text), label, answerable: false };
}

/**
 * 画面から答えが読み取れる設問か。
 *
 * ★この判定を入れる理由★
 * 実データには「ラベルが (ア) だけ」かつ「リード文にその空欄の記号が
 * 見つからない」設問が一定数ある（元データの表記ゆれ・図中の空欄など）。
 * これを出題すると、両者にとって当てずっぽうの問題になり、
 * 対戦の結果が実力と無関係になる。数を減らしてでも外す。
 */
function isAnswerable(d: Display): boolean {
  if (!d.answerable) return false;
  // 問題文も設問文も無い（どちらも空）なら当然出せない
  return (d.prompt.length > 0 || d.label.length > 0);
}

/** 設問文（ラベル）を対戦画面用に整える */
function formatLabel(label: string): string {
  const s = singleQuestionLabel(label);
  return s.length <= LABEL_MAX_CHARS ? s : `${s.slice(0, LABEL_MAX_CHARS - 1)}…`;
}

/**
 * 出題IDに使う、教科データ全体で一意なキー。
 *
 * ★小問IDだけでは一意にならない（実測）★
 *   小問ID だけ            → 131 件が衝突
 *   章ID + 小問ID          →  39 件が衝突
 *   章ID + 大問ID + 小問ID →   0 件（一意）
 *
 * 章をまたいで同じ小問ID（q1_a など）が使われているため、
 * 小問IDをそのまま出題IDにすると別の問題が同じIDになる。
 * 部屋には questionIds しか保存しないので、IDが衝突すると
 * ★対戦相手と違う問題が表示される★（最悪の不具合）。
 * また抽選の重複排除も効かなくなり、同じ問題が2回出る。
 *
 * 乱数の種にもこのキーを使う。種が衝突すると選択肢の並びまで
 * 同一になり、別問題なのに同じ並びという不自然な出題になる。
 */
function uniqueKey(row: RawSub): string {
  return `${row.chapterId}:${row.problemId}:${row.id}`;
}

/** 選択肢カードに収まるように整える */
function trimOption(option: string): string {
  const s = option.replace(/\s+/g, ' ').trim();
  return s; // Never truncate a choice: its distinguishing clause may be at the end.
}

// ============================================================
// 合流: 手書き問題（authored）
// ============================================================

/**
 * ===================================================================
 * 別の作業場が書いた問題を、機械生成のプールに合流させる
 * ===================================================================
 *
 * ■ なぜ「置き換え」ではなく「合流」なのか
 *
 * 元データが選択肢を持っている設問（＝機械生成が今出せている 604 問）は、
 * 誰かが書き直す必要がない。★選択肢を元データからそのまま持ってきているので、
 * 人が触るほうがむしろ誤りが入る。★
 *
 * 手書きが要るのは、機械生成が「出せない」と判断して落とした設問である。
 * だから両者は競合しない。競合するのは
 *
 *     ・作業場が「機械生成でも出せている設問」を、あえて書き直した場合
 *
 * のときだけで、そのときは ★手書きを優先する★。人が読んで書いたほうが、
 * 元データの記号選択肢を機械が本文に戻したものより正確だからである。
 *
 * ■ 優先の判定は「小問の3つのID」で行う
 *
 * chapterId / problemId / subQuestionId が同じなら、同じ小問から来ている。
 * 同じ小問に手書きが1問でもあれば、その小問の機械生成は全部落とす。
 * ★一部だけ残すと、同じ小問が対戦で2回出る（抽選は id で重複を見るので防げない）。★
 *
 * ■ 選択肢の並びはここで決める
 *
 * JSON では `correct: true` が選択肢自身にくっついていて、順番に意味がない。
 * 人が書くと正解が2番目に偏ることが知られているので、
 * ★ID を種にした決定論的なシャッフル★で並べ替えてから answerIndex を求める。
 * 種が ID なので、何度生成しても同じ並びになる（差分レビューができる）。
 */
/** 教科名は問題ごとではなくファイルが持つので、読み込み時にくっつけておく */
type AuthoredRow = AuthoredQuestion & { __subject: string };

function loadAuthored(): AuthoredRow[] {
  if (!existsSync(AUTHORED_DIR)) return [];
  const files = readdirSync(AUTHORED_DIR)
    .filter((f) => f.endsWith('.json'))
    // ★見本（.example.）は読まない★
    //   見本は docs/battle-authoring/ に置く決まりだが、
    //   間違って authored/ に混ざったときに本番の出題に紛れ込ませない。
    .filter((f) => !f.includes('.example.'))
    .sort();

  const out: AuthoredRow[] = [];
  for (const f of files) {
    const raw = readFileSync(join(AUTHORED_DIR, f), 'utf8');
    let parsed: AuthoredFile;
    try {
      parsed = JSON.parse(raw) as AuthoredFile;
    } catch (e) {
      // ★ここで黙って飛ばさない★
      //   作業場が丸一日かけて書いたものが「なぜか出題されない」のが
      //   一番たちが悪い。壊れていたら生成そのものを止める。
      throw new Error(`[authored] JSON として読めない: ${f} (${String(e)})`);
    }
    if (!parsed || !Array.isArray(parsed.questions)) {
      throw new Error(`[authored] questions 配列が無い: ${f}`);
    }
    for (const q of parsed.questions) {
      // subject はファイルが持っている。問題ごとには持たせない
      // （1ファイル＝1章＝1教科なので、問題ごとに書かせると食い違いが起きる）。
      out.push({ ...q, source: { ...q.source }, __subject: String(parsed.subject || '') });
    }
  }
  return out;
}

/**
 * 手書き1問を、対戦プールの1問に変換する。
 *
 * ★判断そのものは src/battle/core/authoredConvert.ts にある★
 * ここに書くとテストから呼べない（このスクリプトは import した瞬間に
 * main() が走って全教科データを読み、生成ファイルを書き換えてしまう）。
 * 過去の事故（USE_SYNTHESIZED_FORMATS）は「生成器の中だけにあって
 * 誰にも検査されないロジック」が原因だった。同じ形にはしない。
 *
 * この関数がやるのは「教科名をくっつける」ことだけである。
 */
function convertAuthored(q: AuthoredRow): { question: PoolQuestion | null; reason: string } {
  const subject = String(q.__subject || '');
  if (!subject) return { question: null, reason: '教科名がファイルに書かれていない' };

  const r = convertAuthoredQuestion(q);
  if (r.ok === false) return { question: null, reason: authoredRejectMessage(r.reason) };
  return { question: { ...r.question, subject }, reason: '' };
}

// ============================================================
// 本体
// ============================================================

/**
 * ===================================================================
 * 外部プールを読む（src/battle/data/external/*.json）
 * ===================================================================
 *
 * ■ 何を読むのか
 *   本体に教科データ（章・大問・小問）が無い教科を、
 *   「出題プールの形そのまま」で受け取るためのファイル。
 *   いま入っているのは高校入試理科（rika）1本だけ。
 *
 * ■ ★検証してから通す（黙って壊れたデータを入れない）★
 *   外部プールは別リポジトリの生成物なので、こちらの決まりを知らない。
 *   tests/battlePool.test.ts が見ている条件と同じものを、ここで先に見る。
 *   1件でも外れていたら ★その1問だけを捨てて、必ず画面に出す★。
 *   （全部止めると、直せない相手側の1問のせいで生成できなくなる）
 *
 *   見ている条件:
 *     ・id / chapterId / problemId / subQuestionId が空でない
 *     ・prompt と label が両方空でない（何も表示されない問題を防ぐ）
 *     ・format が choice4 / choice / kana のどれか
 *     ・choice4 は選択肢ちょうど4つ・answerIndex が 0〜3
 *     ・choice は選択肢2〜6つ・answerIndex が範囲内
 *     ・選択肢に空文字が無い／重複が無い（重複＝正解が2つある状態）
 *     ・選択肢が記号（①ア A）だけになっていない
 *     ・制限時間が 8〜40 秒
 *
 * ■ ★panelOrder は 4択では空にする★
 *   本体の機械生成が空で出しているので、そこにそろえる。
 *   （パネル形式でしか使わない欄）
 */
function loadExternalPools(): PoolQuestion[] {
  if (!existsSync(EXTERNAL_DIR)) return [];

  const out: PoolQuestion[] = [];
  /** 記号だけの選択肢（tests/battlePool.test.ts と同じ式） */
  const symbolOnly = /^[（(【]?[①-⑩ア-ンA-Za-z][)）】]?$/;
  const files = readdirSync(EXTERNAL_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  for (const file of files) {
    const raw = JSON.parse(readFileSync(join(EXTERNAL_DIR, file), 'utf8')) as {
      subject?: string;
      label?: string;
      source?: string;
      questions?: unknown[];
    };
    const subject = String(raw.subject || '').trim();
    if (!subject) {
      console.log(`[gen:battle-pool] ★${file} に subject が無いので読み飛ばした★`);
      continue;
    }

    const list = Array.isArray(raw.questions) ? raw.questions : [];
    const dropped: string[] = [];
    let taken = 0;

    for (const item of list) {
      const q = item as Record<string, unknown>;
      const id = String(q.id || '').trim();
      const chapterId = String(q.chapterId || '').trim();
      const problemId = String(q.problemId || '').trim();
      const subQuestionId = String(q.subQuestionId || '').trim();
      const format = String(q.format || '').trim();
      const prompt = String(q.prompt || '');
      const label = String(q.label || '');
      const options = Array.isArray(q.options) ? q.options.map((o) => String(o)) : [];
      const answerIndex = Number(q.answerIndex);
      const timeLimit = Number(q.timeLimit);

      const bad = (why: string): void => {
        dropped.push(`${id || '(idなし)'}: ${why}`);
      };

      if (!id) {
        bad('id が無い');
        continue;
      }
      if (!chapterId || !problemId || !subQuestionId) {
        bad('章ID・大問ID・小問IDのどれかが空（結果画面から復習に飛べない）');
        continue;
      }
      if (!prompt.trim() && !label.trim()) {
        bad('prompt と label が両方空（画面に何も出ない）');
        continue;
      }
      if (format !== 'choice4' && format !== 'choice' && format !== 'kana') {
        bad(`format が対応外（${format}）`);
        continue;
      }
      if (!Number.isFinite(timeLimit) || timeLimit < 8 || timeLimit > 40) {
        bad(`制限時間が範囲外（${q.timeLimit}）`);
        continue;
      }
      if (format === 'kana') {
        /**
         * ★かな入力は options を持ってはいけない★
         * 持つと五十音キーボードの画面に答えの一覧が出てしまう。
         */
        if (options.length > 0) {
          bad('kana なのに選択肢を持っている（答えが漏れる）');
          continue;
        }
      } else {
        if (options.some((o) => !o.trim())) {
          bad('選択肢に空文字がある');
          continue;
        }
        if (new Set(options).size !== options.length) {
          bad('選択肢が重複している（正解が2つある状態）');
          continue;
        }
        if (format === 'choice4' && options.length !== 4) {
          bad(`choice4 なのに選択肢が ${options.length} 個`);
          continue;
        }
        if (format === 'choice' && (options.length < 2 || options.length > 6)) {
          bad(`choice の選択肢が ${options.length} 個（2〜6でなければならない）`);
          continue;
        }
        if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) {
          bad(`answerIndex が選択肢の範囲外（${q.answerIndex}）`);
          continue;
        }
        if (options.every((o) => symbolOnly.test(o.trim()))) {
          bad('選択肢が記号（①ア A）だけで、何を選ぶのか分からない');
          continue;
        }
      }

      out.push({
        id,
        subject,
        chapterId,
        problemId,
        subQuestionId,
        format: format as Format,
        prompt,
        label,
        options,
        answerIndex: format === 'kana' ? -1 : answerIndex,
        // ★4択・選択では空（パネル形式でしか使わない欄）★
        panelOrder: [],
        timeLimit,
        imageUrl: q.imageUrl ? String(q.imageUrl) : undefined,
        /**
         * ★試合後の1行解答（oneLine）は「外部プールが持ってきた場合だけ」通す★
         *
         * 理科（rika.json）は持たせていない。原典（配布プリント）の言い回しを
         * そのまま出しており、「答え＋ひと言の理由」を書き足すと原典に無い説明を
         * 足すことになるため。理科の答えは演習画面（RikaPractice）が原典どおりに
         * 出すので、対戦のリザルトからそちらへ渡す。
         *
         * 英単語・英熟語（english_vocab.json）は持たせている。中身は
         * 「見出し語 ＝ 単語帳の意味の全文」で、原典に無いことは一切書いていない
         * （4択ボタンでは長さの都合で意味を短く切っているので、全文をここで見せる）。
         * 英単語には本体の演習画面が無く、リザルトの解答がここしか無い。
         */
        oneLine: typeof q.oneLine === 'string' && q.oneLine.trim() ? String(q.oneLine) : undefined,
      });
      taken += 1;
    }

    /**
     * ============================================================
     * ★★ グループキーが足りているかを必ず確かめる ★★
     * ============================================================
     *
     * ■ ここで何が起きたのか（実際に踏んだ罠）
     *   本番の抽選（src/battle/data/battle.ts の drawQuestionIds）は
     *
     *       groupById.set(q.id, `${q.chapterId}:${q.subQuestionId}`)
     *
     *   をグループキーにして、★同じキーの問題は1試合に1問しか出さない★。
     *   これは「1つの小問から語句選択版と文字パネル版を作っている」
     *   本体のプールで、同じ問いが1試合に2回出るのを防ぐための仕組み。
     *
     *   ところが受け取った理科のデータは、全1117問が
     *   subQuestionId = 1 だった（原典に小問番号が無いため）。
     *   そのまま入れると 章 × 1 の31グループにしかならず、
     *   ★1117問あるのに1試合10問すら組めない★
     *   （実測では 1 問しか並ばなかった）。
     *
     * ■ なぜ「件数」の検査では気づけないのか
     *   収録数・形式・選択肢・答えの位置はすべて正しかった。
     *   壊れていたのは「1問1問が別の問題であること」を
     *   本体に伝える欄だけで、これは1問ずつ見ても分からない。
     *   ★プール全体を見て初めて分かる種類の欠陥★ なので、
     *   1問ずつの検査とは別にここで見る。
     *
     * ■ 落とさずに知らせる理由
     *   ここで止めても直せるのは相手側なので、生成は続ける。
     *   ただし ★対戦が成立しない★ という重い話なので、
     *   見逃せない形で警告を出す。
     */
    {
      const groups = new Set<string>();
      for (const q of out) {
        if (q.subject !== subject) continue;
        groups.add(`${q.chapterId}:${q.subQuestionId}`);
      }
      const rule = defaultRuleOf(subject);
      if (rule.enabled && groups.size < rule.questionCount) {
        console.log(
          `[gen:battle-pool] ★★警告★★ ${file}: ` +
            `${taken} 問あるのに、章ID:小問ID の組が ${groups.size} 種しかない。\n` +
            `  本番の抽選は同じ組から1問しか出さないため、` +
            `1試合 ${rule.questionCount} 問を組めない（${groups.size} 問で打ち切られる）。\n` +
            `  → ★1問ごとに違う subQuestionId を持たせること★` +
            `（原典に小問番号が無い場合は問題番号をそのまま使う）。`,
        );
      }
    }

    console.log(
      `[gen:battle-pool] 外部プール ${file}: ${taken} 問を取り込み` +
        `${dropped.length > 0 ? ` / ★${dropped.length} 問を捨てた★` : ''}` +
        `${raw.source ? `（原典: ${raw.source}）` : ''}`,
    );
    for (const note of dropped.slice(0, 20)) console.log(`  - ${note}`);
    if (dropped.length > 20) console.log(`  - …ほか ${dropped.length - 20} 件`);
  }

  return out;
}

function build(): { pool: PoolQuestion[]; stats: Record<string, Record<string, number>> } {
  const rows = collectAll();

  // 問題文の解析結果は大問ごとに1回だけ行う（同じ大問の設問で共有する）
  const blocksByProblem = new Map<string, Map<number, { stem: string; options: string[] }>>();
  /** 記号 → 本文 の凡例。同じ大問の設問がすべて同じ凡例を参照する */
  const legendByProblem = new Map<string, Map<string, string>>();
  for (const row of rows) {
    if (!blocksByProblem.has(row.problemId)) {
      blocksByProblem.set(row.problemId, parseNumberedBlocks(row.problemText));
      legendByProblem.set(row.problemId, buildLegend(row.problemText));
    }
  }

  // 誤答候補: 章ごと / 教科ごとの「正解の一覧」
  const answersByChapter = new Map<string, string[]>();
  const answersBySubject = new Map<string, string[]>();
  // 文字パネルのダミー文字: 章ごとに使われている文字
  const charsByChapter = new Map<string, Set<string>>();

  for (const row of rows) {
    const a = row.correctAnswer.trim();
    if (!a) continue;
    // 記号だけの答え（「①」「ア」）は誤答候補として意味がないので除く
    if (/^[①-⑩ア-ンa-dA-D]$/.test(a)) continue;

    if (row.type === 'short_answer' || row.type === 'descriptive' || row.type === 'text') {
      const ck = row.chapterId;
      if (!answersByChapter.has(ck)) answersByChapter.set(ck, []);
      answersByChapter.get(ck)!.push(a);
      if (!answersBySubject.has(row.subject)) answersBySubject.set(row.subject, []);
      answersBySubject.get(row.subject)!.push(a);

      // 文字パネルのダミー文字は「その章の用語に使われている文字」から取る。
      //
      // ★2文字未満の答えを除く理由★
      // 1文字の答えには「ア」「カ」「ギ」のような空欄参照の記号が混じっている
      // （元データで参照記号がそのまま correctAnswer に入っている設問がある）。
      // これをダミーに使うと、パネルに意味のないカタカナが並び、
      // 「明らかに使わない文字」として消去法のヒントになってしまう。
      if (a.length >= 2 && /^[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FFー]+$/.test(a)) {
        if (!charsByChapter.has(ck)) charsByChapter.set(ck, new Set());
        for (const ch of a) charsByChapter.get(ck)!.add(ch);
      }
    }
  }

  const pool: PoolQuestion[] = [];
  const stats: Record<string, Record<string, number>> = {};
  const bump = (subject: string, key: string): void => {
    stats[subject] ??= { choice4: 0, choice: 0, kana: 0, word: 0, panel: 0, skipped: 0 };
    stats[subject][key] = (stats[subject][key] || 0) + 1;
  };

  for (const row of rows) {
    let made = 0;

    if (row.type === 'multiple_choice') {
      // 元データが選択肢を持っている設問を、選択肢をいじらずに出す。
      const q = convertChoice(
        row,
        blocksByProblem.get(row.problemId) || new Map(),
        legendByProblem.get(row.problemId) || new Map(),
      );
      if (q) {
        pool.push(q);
        bump(row.subject, q.format);
        made += 1;
      }
    } else if (row.type === 'short_answer') {
      /**
       * ★五十音キーボード形式（「みんはや」方式）★
       *
       * これは下の USE_SYNTHESIZED_FORMATS で止めてある word / panel とは違い、
       * ★誤答を1つも作っていない★ので常に有効にしている。
       *
       * word / panel が壊れていたのは「同じ章の他の設問の正解を
       * 誤答として借りていた」ためで、借りた誤答が実は正しいことがあった。
       * kana は問いと正解を元データからそのまま使い、
       * 画面には五十音表しか出さない。★演習と同じ問題のまま★である。
       *
       * さらにカタカナの答えに限定してあるので、
       * 表記ゆれ（送り仮名・かな/漢字）で落とす事故も起きない。
       */
      const k = convertKana(row);
      if (k) {
        pool.push(k);
        bump(row.subject, 'kana');
        made += 1;
      }
    }

    if (
      made === 0 &&
      USE_SYNTHESIZED_FORMATS &&
      (row.type === 'short_answer' || row.type === 'descriptive' || row.type === 'text')
    ) {
      // ------------------------------------------------------------
      // ★以下は現在動いていない（USE_SYNTHESIZED_FORMATS === false）★
      //
      // 短答・記述から「同じ章の他の設問の正解」を誤答として借り、
      // 4択（word）や文字パネル（panel）を作る処理。
      // 問いとして成り立たない問題が混ざるため止めている。
      // 詳細はファイル冒頭の方針と、この定数の説明を参照。
      // ------------------------------------------------------------
      const sameChapter = (answersByChapter.get(row.chapterId) || []).filter(
        (a) => a !== row.correctAnswer,
      );
      const sameSubject = (answersBySubject.get(row.subject) || []).filter(
        (a) => a !== row.correctAnswer,
      );

      const w = convertWord(row, sameChapter, sameSubject);
      if (w) {
        pool.push(w);
        bump(row.subject, 'word');
        made += 1;
      }

      // 文字パネルは短答のみ（記述の長文は組み立てられない）
      if (row.type !== 'descriptive') {
        const p = convertPanel(row, [...(charsByChapter.get(row.chapterId) || [])]);
        if (p) {
          pool.push(p);
          bump(row.subject, 'panel');
          made += 1;
        }
      }
    }
    // 'sorting' は対戦では使わない（並び替えは操作時間が長く、
    //  選択式に変換すると元の設問の意図が失われる）

    if (made === 0) bump(row.subject, 'skipped');
  }

  // ------------------------------------------------------------
  // 手書き問題（authored）の合流
  // ------------------------------------------------------------
  //
  // ★ここが「別の作業場が書いたものが対戦に出る」唯一の経路★
  // これが無いと、作業場が何問書いても対戦画面には1問も出ない。
  //
  const authored = loadAuthored();
  if (authored.length > 0) {
    /**
     * 元データに実在する小問の集合。
     *
     * ★存在しない小問を指す手書きは落とす★
     * 検証器も同じことを見ているが、検証器を通ったあとに元データ側が
     * 消えた／IDが変わった場合、ここが最後の砦になる。
     * 「元の演習に飛べない対戦問題」は、①→②の橋が切れているのと同じ。
     */
    const realSubs = new Set(rows.map((r) => `${r.chapterId}:${r.problemId}:${r.id}`));

    const converted: PoolQuestion[] = [];
    /** 落とした問題の理由（生成の最後にまとめて表示する） */
    const dropNotes: string[] = [];
    /** 手書きが1問でもある小問（機械生成をここから取り除くために使う） */
    const takenOver = new Set<string>();
    const seenIds = new Set(pool.map((q) => q.id));

    for (const a of authored) {
      const key = `${a.source.chapterId}:${a.source.problemId}:${a.source.subQuestionId}`;
      if (!realSubs.has(key)) {
        bump(a.__subject || '?', 'authored_orphan');
        dropNotes.push(`${a.id || '(id なし)'}: 元データに存在しない小問を指している (${key})`);
        continue;
      }
      const { question: q, reason } = convertAuthored(a);
      if (!q) {
        bump(a.__subject || '?', 'authored_dropped');
        // ★落とした理由をその場で出す★
        //   「なぜか出題されない」が作業場にとって一番たちが悪い。
        dropNotes.push(`${a.id || '(id なし)'}: ${reason}`);
        continue;
      }
      /**
       * ★IDの重複は最悪の不具合★
       * 部屋には questionIds しか保存しないので、同じIDが2問あると
       * 対戦相手と違う問題が表示される。あとから来たほうを捨てる。
       */
      if (seenIds.has(q.id)) {
        bump(q.subject, 'authored_dup_id');
        dropNotes.push(`${q.id}: 同じ id が既にある（あとから来たほうを捨てた）`);
        continue;
      }
      seenIds.add(q.id);
      takenOver.add(key);
      converted.push(q);
      bump(q.subject, `authored_${q.format}`);
    }

    // 手書きが担当した小問の機械生成を取り除く（同じ小問が2回出るのを防ぐ）
    if (takenOver.size > 0) {
      for (let i = pool.length - 1; i >= 0; i -= 1) {
        const q = pool[i];
        const key = `${q.chapterId}:${q.problemId}:${q.subQuestionId}`;
        if (takenOver.has(key)) {
          pool.splice(i, 1);
          bump(q.subject, 'replaced_by_authored');
        }
      }
    }

    for (const q of converted) pool.push(q);

    if (dropNotes.length > 0) {
      console.log(`[gen:battle-pool] ★手書きのうち ${dropNotes.length} 問を落とした★`);
      for (const note of dropNotes) console.log(`  - ${note}`);
    }
  }

  /**
   * ===================================================================
   * 外部プール（src/battle/data/external/*.json）を合流させる
   * ===================================================================
   *
   * ★ここで足す理由★
   * このあと main() が「pool を教科ごとに分けて」ファイルと索引を作る。
   * その手前で足しておけば、外部教科も他の教科と同じ扱いで
   *   ・pool.<教科>.generated.ts
   *   ・answer.<教科>.generated.ts
   *   ・battlePool.ts（loadPool の switch / POOL_COUNTS / POOL_FORMAT_COUNTS）
   * が自動でそろう。手作業の置き忘れが起きない。
   *
   * ★機械生成の加工は一切かけない★
   * 外部プールは向こう側で選択肢まで作り終えているので、
   * 誤答の借用や凡例の復元（このスクリプトの前半の処理）を通す必要がない。
   * 通すと、向こうが意図して並べた選択肢を壊すおそれがある。
   */
  {
    // ここまでに入っている全出題のID（機械生成＋手書き）
    const seenAll = new Set(pool.map((q) => q.id));
    for (const q of loadExternalPools()) {
      /**
       * ★IDの重複は必ず捨てる★
       * 部屋には questionIds しか保存しないので、同じIDが2問あると
       * 対戦相手の端末と違う問題が表示され、対戦が成立しない。
       */
      if (seenAll.has(q.id)) {
        bump(q.subject, 'external_dup_id');
        console.log(`[gen:battle-pool] ★外部プールの id が重複したので捨てた★ ${q.id}`);
        continue;
      }
      seenAll.add(q.id);
      pool.push(q);
      bump(q.subject, `external_${q.format}`);
    }
  }

  for (const q of pool) {
    q.prompt = stripExerciseHeading(q.prompt).replace(/［\s*？\s*］/g, '［　？　］');
    if ((q.prompt.match(/_{2,}/g) || []).length === 1) {
      q.prompt = q.prompt.replace(/_{2,}/, '［　？　］');
      q.label = '空欄に入るものを選びなさい。';
    }
    q.label = singleQuestionLabel(q.label).replace(/^(酸化還元でない反応)[（(][ア-ン][)）]$/, '$1');
    // Authored prompts are standalone; discard leftover fragments such as の名称.
    if (q.id.startsWith('a:') && q.prompt && /^の(?:名称|記号|道具名)$/.test(q.label)) q.label = '';
  }

  // 出力の並びを安定させる（生成のたびに差分が出ないように）
  pool.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { pool, stats };
}

// ============================================================
// 出力（ファイル生成）
// ============================================================

/**
 * ===================================================================
 * 出力を「教科ごとのファイル」＋「タプル圧縮」にしている理由
 * ===================================================================
 *
 * ■ 1ファイルに全教科を入れると重すぎる
 * 全教科をまとめると整形JSONで約900KB になる。
 * 対戦画面を開いた瞬間にこれを読むと、化学基礎で対戦する人が
 * 英語・数学・地理の問題まで全部ダウンロードすることになる。
 * スマホの回線では体感で分かるレベルの遅さになる。
 *
 * → ★教科ごとに別ファイルにして、選ばれた教科だけを動的 import する。★
 *   化学基礎（最大の教科）でも 200KB 台、他は数十KB で済む。
 *
 * ■ オブジェクトではなくタプル（配列）で持つ理由
 * オブジェクト形式は 1 問ごとに
 *   "id": "subject": "chapterId": "format": "prompt": "label": ...
 * というキー名がそのまま文字列としてファイルに入る。
 * 1600問あるとキー名だけで 100KB を超える。
 * 配列にすればキー名は 1 回も出てこない。
 * 読み込み時に展開する関数（expand）を 1 つ置くだけで済む。
 *
 * ■ 整形（インデント）しない理由
 * JSON.stringify(x, null, 2) は 1 行ごとに空白が入り、
 * 実測でファイルサイズがほぼ 2 倍になる。
 * この生成ファイルは人が読むものではない（読むのは元データ側）ので、
 * 1 行 1 問の詰めた形で出す。差分は行単位で読めるので
 * レビュー可能性も保たれる。
 */

/** タプルの並び。expand() と必ず対応させること */
type Tuple = [
  id: string,
  chapterId: string,
  problemId: string,
  subQuestionId: string,
  format: number, // 0=choice4 1=word 2=panel 3=choice
  prompt: string,
  label: string,
  options: string[],
  answerIndex: number,
  panelOrder: number[],
  timeLimit: number,
  imageUrl: string, // 無いときは ''
];

/**
 * 形式 → 番号。
 *
 * ★番号は append-only。既存の番号を動かすのは禁止。★
 * 番号は生成ファイルの中に数字として書かれるので、
 * 途中に割り込ませると全問の形式が総入れ替わりになる。
 * （choice を 3、kana を 4 と末尾に足しているのはこのため）
 * battlePool.ts 側の FORMATS 配列も同じ並びであること。
 */
const FORMAT_CODE: Record<Format, number> = {
  choice4: 0,
  word: 1,
  panel: 2,
  choice: 3,
  kana: 4,
};

function toTuple(q: PoolQuestion): Tuple {
  return [
    q.id,
    q.chapterId,
    q.problemId,
    q.subQuestionId,
    FORMAT_CODE[q.format],
    q.prompt,
    q.label,
    q.options,
    q.answerIndex,
    q.panelOrder,
    q.timeLimit,
    q.imageUrl || '',
  ];
}

/** 教科ごとの生成ファイルの中身を作る */
/**
 * ★大きなプールは「JSON 文字列 → 実行時に parse」で書き出す★
 *
 * 英単語・英熟語（27,172問）を配列リテラルで書くと、tsc が要素ごとの型推論で
 * ヒープを食い尽くして落ちる（実測：既定ヒープで Aborted）。
 * 1本の文字列リテラルにすれば tsc は中身を見ないので、型検査の重さは 0 になる。
 * 実行時のコストは JSON.parse 1回（5MB で数十ms）で、配列リテラルの評価と大差ない。
 * 小さな教科は従来どおり配列リテラル（差分が読める形）のまま。
 */
const JSON_STRING_THRESHOLD = 5000;

function renderSubjectFile(subject: string, pool: PoolQuestion[]): string {
  const asJsonString = pool.length >= JSON_STRING_THRESHOLD;
  const lines = asJsonString
    ? ''
    : pool.map((q) => `  ${JSON.stringify(toTuple(q))},`).join('\n');
  const body = asJsonString
    ? `export const POOL: readonly unknown[][] = JSON.parse(${JSON.stringify(JSON.stringify(pool.map(toTuple)))});`
    : `export const POOL: readonly unknown[][] = [\n${lines}\n];`;

  return `/**
 * ===================================================================
 * 対戦用 出題プール: ${subject}（自動生成・手で編集しないこと）
 * ===================================================================
 *
 * ★このファイルは scripts/gen-battle-pool.mts が生成する。★
 * 手で書き換えても次の生成で消える。問題を直したいときは
 * 教科データ本体（src/data/*.ts）を直してから
 *
 *     npm run gen:battle-pool
 *
 * を実行すること。
 *
 * -------------------------------------------------------------------
 * ■ 収録数: ${pool.length} 問
 * -------------------------------------------------------------------
 *
 * ■ 中身は「タプルの配列」であって、読みやすさを捨てている。
 *   キー名（"prompt" など）を 1 問ごとに書くとファイルが倍以上になるため。
 *   並びの意味は battlePool.ts の expand() が持っている。
 *   ★並びを変えるときは expand() と必ず同時に変えること。★
 *
 * ■ このファイルは何も import しない（型すら import しない）。
 *   教科データ（約2.5MB）を間接的に読み込まないことが仕様である。
 */

/** [id, chapterId, problemId, subQuestionId, format, prompt, label, options, answerIndex, panelOrder, timeLimit, imageUrl] */
${body}
`;
}

/** 教科ID → 生成ファイル名に使う安全な名前 */
function fileNameOf(subject: string): string {
  return `pool.${subject}.generated.ts`;
}

/** 教科ID → 解答ファイル（試合後に読む）の名前 */
function answerFileNameOf(subject: string): string {
  return `answer.${subject}.generated.ts`;
}

/**
 * ===================================================================
 * 解答ファイル（answer.<教科>.generated.ts）を出す
 * ===================================================================
 *
 * ■ ★なぜ出題プールと同じファイルに入れないのか★
 *
 * 出題プール（pool.*.generated.ts）は ★対戦が始まる前に★ 読み込まれる。
 * そこに「答え＋ひと言の理由（oneLine）」を混ぜると、
 * 開発者ツールのネットワークタブを開くだけで全問の答えが読める。
 * この対戦はレートが動くので、それは不正の入口になる。
 *
 * 出題プールが correctAnswer を持たない（answerIndex しか持たない）のは
 * まさにこの理由であり、oneLine は「答えそのもの」なので同じ扱いにする。
 *
 * ■ ★では、いつ読むのか★
 *
 * 試合が終わったあと、リザルト画面が出たときだけ読む（動的 import）。
 * 試合が終わっていればもう答えを隠す意味はないし、
 * 逆に隠したままにすると「対戦 ⇒ 演習」の橋がかからない。
 *
 * ■ サイズ
 *
 * 化学基礎で約 120KB。リザルト画面が出てから落ちてくるので、
 * 対戦開始までの待ち時間には一切影響しない。
 *
 * ■ 中身の形
 *
 * [出題ID, oneLine] の2要素タプルの配列。
 * oneLine を持つ問題（＝手書き問題）だけを入れる。
 * 機械生成の問題は元データに1行解答が無いので入らない。
 */
function renderAnswerFile(subject: string, pool: PoolQuestion[]): string {
  const withAnswer = pool.filter((q) => (q.oneLine || '').trim().length > 0);
  const count = withAnswer.length;
  // 出題プールと同じ理由（tsc のヒープ）で、大きいものは JSON 文字列にする。
  const asJsonString = count >= JSON_STRING_THRESHOLD;
  const rows = asJsonString
    ? ''
    : withAnswer.map((q) => `  ${JSON.stringify([q.id, q.oneLine])},`).join('\n');
  const answerBody = asJsonString
    ? `export const ANSWERS: readonly (readonly [string, string])[] = JSON.parse(${JSON.stringify(JSON.stringify(withAnswer.map((q) => [q.id, q.oneLine])))});`
    : `export const ANSWERS: readonly (readonly [string, string])[] = [\n${rows}\n];`;

  return `/**
 * ===================================================================
 * 対戦の解答（試合後に出す1行解答）: ${subject}（自動生成・手で編集しないこと）
 * ===================================================================
 *
 * ★このファイルは scripts/gen-battle-pool.mts が生成する。★
 * 手で書き換えても次の生成で消える。直したいときは
 * src/battle/data/authored/*.json の oneLine を直してから
 *
 *     npm run gen:battle-pool
 *
 * を実行すること。
 *
 * -------------------------------------------------------------------
 * ■ ★これは出題プールとは別のファイルである★
 * -------------------------------------------------------------------
 * 出題プール（pool.${subject}.generated.ts）は対戦が始まる前に読み込まれる。
 * そこに答えを混ぜると、通信を覗くだけで全問の答えが分かってしまう。
 * このファイルは ★試合が終わってリザルト画面が出たときだけ★ 読み込む。
 *
 * -------------------------------------------------------------------
 * ■ 収録数: ${count} 問（oneLine を持つ問題だけ）
 * -------------------------------------------------------------------
 * 機械生成の問題は元データに1行解答が無いので入っていない。
 * 画面側は「無い問題は答えの行を出さない」作りにしてある。
 *
 * ■ このファイルは何も import しない（型すら import しない）。
 */

/** [出題ID, 試合後に出す1行解答] */
${answerBody}
`;
}

/**
 * 教科ファイルをまとめる索引を作る。
 *
 * ★静的 import ではなく動的 import にする理由★
 * ここで全教科を静的に import すると、分割した意味が消える
 * （バンドラが 1 つのチャンクにまとめてしまう）。
 * import() を使うと Vite が教科ごとに別チャンクを作り、
 * 選ばれた教科だけがネットワークを流れる。
 */
function renderIndexFile(
  subjects: string[],
  counts: Record<string, number>,
  formatCounts: Record<string, Record<string, number>>,
  answerCounts: Record<string, number>,
): string {
  const cases = subjects
    .map(
      (s) =>
        `    case '${s}':\n      return (await import('./${fileNameOf(s).replace(/\.ts$/, '')}')).POOL;`,
    )
    .join('\n');

  /** 解答ファイル（試合後だけ読む）の分岐 */
  const answerCases = subjects
    .map(
      (s) =>
        `    case '${s}':\n      return (await import('./${answerFileNameOf(s).replace(/\.ts$/, '')}')).ANSWERS;`,
    )
    .join('\n');

  const answerCountLines = subjects.map((s) => `  ${s}: ${answerCounts[s] || 0},`).join('\n');

  const countLines = subjects.map((s) => `  ${s}: ${counts[s] || 0},`).join('\n');

  // 形式別の数。0 の形式は書かない（読む人が「使える形式」を一目で分かるように）。
  const formatCountLines = subjects
    .map((s) => {
      const byFormat = formatCounts[s] || {};
      const inner = (['choice4', 'choice', 'kana', 'word', 'panel'] as const)
        .filter((f) => (byFormat[f] || 0) > 0)
        .map((f) => `${f}: ${byFormat[f]}`)
        .join(', ');
      return `  ${s}: { ${inner} },`;
    })
    .join('\n');

  return `/**
 * ===================================================================
 * 対戦用 出題プールの読み込み口（自動生成・手で編集しないこと）
 * ===================================================================
 *
 * ★このファイルは scripts/gen-battle-pool.mts が生成する。★
 *
 * -------------------------------------------------------------------
 * ■ 役割
 * -------------------------------------------------------------------
 * 教科ごとに分かれた生成ファイル（pool.*.generated.ts）を
 * ★必要になった教科だけ★ 動的に読み込む。
 *
 * 全教科をまとめると約900KBある。対戦画面を開いた時点で全部読むと、
 * 化学基礎で対戦する人が英語・数学・地理の問題まで
 * ダウンロードすることになる。教科は対戦開始時に決まっているので、
 * その1教科だけを取れば十分である。
 *
 * -------------------------------------------------------------------
 * ■ 一度読んだ教科は使い回す
 * -------------------------------------------------------------------
 * 1試合の中で何度も呼ばれる（問題を1問ずつ引く）ので、
 * 読み込み結果はモジュール内に保持する。
 * 同じ教科で連続して対戦しても再ダウンロードは起きない。
 */

import type { BattleAnswerFormat, BattleQuestion } from '../core/types';

/** 教科ごとの収録数（UIで「この教科は◯問あります」と出すために使う） */
export const POOL_COUNTS: Readonly<Record<string, number>> = {
${countLines}
};

/**
 * 教科ごと・回答形式ごとの収録数。
 *
 * -------------------------------------------------------------------
 * ■ ★POOL_COUNTS（総数）だけでは足りない理由★
 * -------------------------------------------------------------------
 * 教科ごとのルール（battleRules.ts の formats）は「使う回答形式」を絞る。
 * 総数だけを見て教科カードを出すと、
 *
 *   ・カードには「収録 348 問」と書いてある
 *   ・でもルールが使う形式の問題は 1 問しか無い
 *   ・押すと対戦が始められない
 *
 * という ★選べるのに対戦できない★ 状態が起こる。
 * 実際に過去そうなりかけた（生物基礎が該当）。
 *
 * 形式別の数をここに持っておけば、画面は問題データ本体（数百KB）を
 * 読まずに「この教科でいま出せる数」を出せる。
 */
export const POOL_FORMAT_COUNTS: Readonly<
  Record<string, Readonly<Partial<Record<BattleAnswerFormat, number>>>>
> = {
${formatCountLines}
};

/**
 * その教科で「指定の形式のうち」何問使えるかを数える。
 *
 * ★画面の「収録N問」はこの数を出すこと。★
 * 総数（POOL_COUNTS）を出すと、上に書いたとおり嘘になる場合がある。
 */
export function poolCountOf(
  subject: string,
  formats: readonly BattleAnswerFormat[],
): number {
  const byFormat = POOL_FORMAT_COUNTS[subject];
  if (!byFormat) return 0;
  let total = 0;
  for (const f of formats) total += byFormat[f] || 0;
  return total;
}

/**
 * 形式番号 → 形式名。
 *
 * ★番号は生成器の FORMAT_CODE と同じ並びでなければならない。★
 * choice が末尾（3）にいるのは、あとから追加したときに
 * 既存の 0/1/2 を動かさなかったためである。並べ替えてはいけない。
 */
const FORMATS: readonly BattleAnswerFormat[] = ['choice4', 'word', 'panel', 'choice', 'kana'];

/**
 * タプルを BattleQuestion に戻す。
 *
 * ★並びは生成ファイル側の toTuple() と対応している。★
 * どちらか片方だけ変えると全教科が壊れるので、必ず同時に変えること。
 */
function expand(subject: string, t: readonly unknown[]): BattleQuestion {
  return {
    id: t[0] as string,
    subject,
    chapterId: t[1] as string,
    problemId: t[2] as string,
    subQuestionId: t[3] as string,
    // 形式番号が範囲外なら choice4 に寄せる。
    // 生成ファイルが古い（新しい形式番号を知らない）状態で
    // 画面だけ新しくなったときに、undefined が入って落ちるのを防ぐ。
    format: FORMATS[t[4] as number] ?? 'choice4',
    prompt: t[5] as string,
    label: t[6] as string,
    options: t[7] as string[],
    answerIndex: t[8] as number,
    panelOrder: t[9] as number[],
    timeLimit: t[10] as number,
    imageUrl: (t[11] as string) || undefined,
  };
}

async function loadRaw(subject: string): Promise<readonly unknown[][]> {
  switch (subject) {
${cases}
    default:
      return [];
  }
}

/** 読み込み済みの教科（教科ID → 出題の配列） */
const cache = new Map<string, readonly BattleQuestion[]>();
/** 読み込み中の教科（同時に2回呼ばれても1回しか取りに行かないため） */
const inflight = new Map<string, Promise<readonly BattleQuestion[]>>();

/**
 * 教科の出題プールを読み込む。
 *
 * ★並び順はプールの並び（ID昇順）で固定★
 * 抽選は「部屋IDを種にした決定論的な乱数」でこの並びに対して行うため、
 * 順序が変わると同じ種でも違う問題が選ばれ、
 * 対戦相手と出題がズレる（＝対戦が成立しない）。
 * 生成時にID昇順で固定してあるので、問題を足さない限り順序は変わらない。
 */
export async function loadPool(subject: string): Promise<readonly BattleQuestion[]> {
  const cached = cache.get(subject);
  if (cached) return cached;

  const running = inflight.get(subject);
  if (running) return running;

  const promise = loadRaw(subject)
    .then(async (raw) => {
      const list = raw.map((t) => expand(subject, t));
      // Resolve before matchmaking starts; preserve IDs and order, expose no script/hints.
      if (subject === 'english_listening') {
        const { getAllListeningChapters } = await import('../../data/englishListeningData');
        const chapters = getAllListeningChapters();
        for (const question of list) {
          const chapter = chapters.find(c => c.id === question.chapterId);
          const problem = [...(chapter?.practiceProblems || []), ...(chapter?.miniTest || [])]
            .find(p => p.id === question.problemId);
          const track = problem?.audioTracks?.find((t: { subId: string; subIds?: string[] }) =>
            t.subId === question.subQuestionId || t.subIds?.includes(question.subQuestionId));
          if (!track?.audioUrl) throw new Error('Listening battle audio is missing: ' + question.id);
          question.audioUrl = track.audioUrl;
        }
      }
      cache.set(subject, list);
      inflight.delete(subject);
      return list as readonly BattleQuestion[];
    })
    .catch((error) => {
      inflight.delete(subject);
      throw error;
    });

  inflight.set(subject, promise);
  return promise;
}

/**
 * 出題ID → 出題。
 * 部屋に保存されているのは questionIds だけなので、これで本体に戻す。
 * ★読み込み済みの教科でしか引けない★（先に loadPool を呼ぶこと）
 */
export function questionByIdSync(subject: string, id: string): BattleQuestion | undefined {
  const list = cache.get(subject);
  if (!list) return undefined;
  return list.find((q) => q.id === id);
}

/** 出題IDの一覧（形式で絞り込む）。抽選の母集団に使う */
export async function poolIdsOf(
  subject: string,
  formats: readonly BattleAnswerFormat[],
): Promise<string[]> {
  const list = await loadPool(subject);
  return list.filter((q) => formats.includes(q.format)).map((q) => q.id);
}

/** 読み込み済みの出題を全部返す（テスト・検証用） */
export function loadedPool(subject: string): readonly BattleQuestion[] {
  return cache.get(subject) || [];
}

// ============================================================
// 試合後の解答（請求⑦-A）
// ============================================================

/**
 * 教科ごとの「1行解答を持つ問題」の数。
 * リザルト画面が「この教科は解答が出ます／出ません」を
 * データ本体を読まずに判断するために置いてある。
 */
export const ANSWER_COUNTS: Readonly<Record<string, number>> = {
${answerCountLines}
};

async function loadAnswerRaw(subject: string): Promise<readonly (readonly [string, string])[]> {
  switch (subject) {
${answerCases}
    default:
      return [];
  }
}

/** 読み込み済みの解答（教科ID → 出題ID → 1行解答） */
const answerCache = new Map<string, ReadonlyMap<string, string>>();
const answerInflight = new Map<string, Promise<ReadonlyMap<string, string>>>();

/**
 * その教科の「試合後の1行解答」を読み込む。
 *
 * ★★ここは「試合が終わってから」しか呼んではいけない★★
 *
 * 出題プール（loadPool）と別のファイルに分けているのは、
 * 対戦前に答えが端末に落ちてくるのを防ぐためである。
 * 対戦画面や待機画面からこれを呼ぶと、その意味がまるごと消える。
 * 呼び出しているのはリザルト画面（BattleResult）だけであり、
 * tests/battleAnswers.test.ts がそれを検査している。
 *
 * 解答が1問も無い教科（機械生成だけの教科）では空の Map が返る。
 * 画面側は「無ければ答えの行を出さない」作りなので、それで正しく動く。
 */
export async function loadBattleAnswers(
  subject: string,
): Promise<ReadonlyMap<string, string>> {
  const cached = answerCache.get(subject);
  if (cached) return cached;

  const running = answerInflight.get(subject);
  if (running) return running;

  const promise = loadAnswerRaw(subject)
    .then((rows) => {
      const map: ReadonlyMap<string, string> = new Map(rows.map(([id, one]) => [id, one]));
      answerCache.set(subject, map);
      answerInflight.delete(subject);
      return map;
    })
    .catch((error) => {
      answerInflight.delete(subject);
      throw error;
    });

  answerInflight.set(subject, promise);
  return promise;
}
`;
}

/**
 * 1教科ぶんの統計から「実際に出題になった手書き問題」の数を数える。
 * 落としたもの（orphan / dropped / dup_id）は出題ではないので数に入れない。
 */
function authoredOf(st: Record<string, number>): number {
  return Object.entries(st).reduce(
    (n, [k, v]) =>
      k.startsWith('authored_') &&
      !k.endsWith('_orphan') &&
      !k.endsWith('_dropped') &&
      !k.endsWith('_dup_id')
        ? n + v
        : n,
    0,
  );
}

function main(): void {
  const { pool, stats } = build();

  const bySubject = new Map<string, PoolQuestion[]>();
  for (const q of pool) {
    if (!bySubject.has(q.subject)) bySubject.set(q.subject, []);
    bySubject.get(q.subject)!.push(q);
  }

  /**
   * 教科の並びは SUBJECTS の定義順（生成の再現性のため）。
   *
   * ★そのあとに「外部プールだけの教科」を足す★
   * 高校入試理科（rika）は本体の教科データを持たないので SUBJECTS にいない。
   * ここで拾い落とすと、プールは作られるのに索引（battlePool.ts）に載らず、
   * loadPool() から読めない孤立ファイルになる。
   * 並びは最後に固めるので、既存教科の順番（＝画面の並び）は動かない。
   */
  const known: string[] = SUBJECTS.map((s) => String(s.id)).filter((id) => bySubject.has(id));
  const knownSet = new Set(known);
  const extra = [...bySubject.keys()].filter((id) => !knownSet.has(id)).sort();
  const subjects: string[] = [...known, ...extra];
  const counts: Record<string, number> = {};
  /** 教科 → 形式 → 件数。索引ファイルの POOL_FORMAT_COUNTS になる */
  const formatCounts: Record<string, Record<string, number>> = {};
  /** 教科 → 1行解答を持つ問題の数（索引の ANSWER_COUNTS になる） */
  const answerCounts: Record<string, number> = {};
  let totalBytes = 0;
  const perFile: Array<[string, number, number]> = [];
  /** 解答ファイルの合計バイト数（対戦前には落ちてこない分） */
  let answerBytes = 0;

  for (const subject of subjects) {
    const list = bySubject.get(subject)!;
    counts[subject] = list.length;

    // ★stats ではなく実際に出力する配列から数える★
    //   stats は「作った回数」なので、あとで並びやフィルタを足したときに
    //   出力内容とズレうる。索引に書く数は必ず出力そのものから数える。
    const byFormat: Record<string, number> = {};
    for (const q of list) byFormat[q.format] = (byFormat[q.format] || 0) + 1;
    formatCounts[subject] = byFormat;

    const source = renderSubjectFile(subject, list);
    const path = resolve(OUT_DIR, fileNameOf(subject));
    writeFileSync(path, source, 'utf8');
    const bytes = Buffer.byteLength(source, 'utf8');
    totalBytes += bytes;
    perFile.push([subject, list.length, bytes]);

    /**
     * ★解答（oneLine）は必ず別ファイルに出す★
     * 出題プールに混ぜると対戦前に答えが端末に落ちる。
     * 理由は renderAnswerFile() のコメントに書いた。
     */
    answerCounts[subject] = list.filter((q) => (q.oneLine || '').trim().length > 0).length;
    const answerSource = renderAnswerFile(subject, list);
    writeFileSync(resolve(OUT_DIR, answerFileNameOf(subject)), answerSource, 'utf8');
    answerBytes += Buffer.byteLength(answerSource, 'utf8');
  }

  const indexSource = renderIndexFile(subjects, counts, formatCounts, answerCounts);
  writeFileSync(resolve(OUT_DIR, 'battlePool.ts'), indexSource, 'utf8');
  totalBytes += Buffer.byteLength(indexSource, 'utf8');

  console.log(`[gen:battle-pool] 出題 ${pool.length} 件 / 合計 ${totalBytes.toLocaleString()} バイト`);
  if (!USE_SYNTHESIZED_FORMATS) {
    console.log(
      '[gen:battle-pool] ★誤答を借りて作る形式（語句選択・文字パネル）は停止中★',
    );
    console.log(
      '[gen:battle-pool]   出題は「元データの選択肢をそのまま使う問題」と' +
        '「カタカナの答えを五十音キーボードで書く問題」だけです。',
    );
  }
  const kanaTotal = Object.values(formatCounts).reduce((s, f) => s + (f.kana || 0), 0);
  console.log(`[gen:battle-pool] うち五十音キーボード（みんはや方式）: ${kanaTotal} 問`);

  /**
   * ★試合後の解答（請求⑦-A）の件数を必ず表示する★
   * ここが 0 のまま気づかないと、リザルト画面に答えが1問も出ない。
   */
  const answerTotal = Object.values(answerCounts).reduce((s, n) => s + n, 0);
  console.log(
    `[gen:battle-pool] 試合後の1行解答: ${answerTotal} 問 / ` +
      `${Math.round(answerBytes / 1024)}KB（★対戦前には読み込まれない別ファイル★）`,
  );

  /**
   * ★手書き問題の合流結果を必ず表示する★
   * 作業場が書いた JSON を取り込んだのに、書式の取り違えなどで
   * 静かに0問になっていた、という事故を目で止めるための行。
   */
  const authoredTotal = Object.values(stats).reduce((sum, st) => sum + authoredOf(st), 0);
  const authoredBad = Object.values(stats).reduce(
    (sum, st) =>
      sum + (st.authored_orphan || 0) + (st.authored_dropped || 0) + (st.authored_dup_id || 0),
    0,
  );
  const replaced = Object.values(stats).reduce((sum, st) => sum + (st.replaced_by_authored || 0), 0);
  if (authoredTotal > 0 || authoredBad > 0) {
    console.log(
      `[gen:battle-pool] うち手書き（別の作業場が書いたもの）: ${authoredTotal} 問` +
        `${replaced > 0 ? `（うち ${replaced} 問は機械生成を置き換えた）` : ''}`,
    );
    if (authoredBad > 0) {
      console.log(
        `[gen:battle-pool] ★手書きのうち ${authoredBad} 問を落とした★ ` +
          '（元データに無い小問／形式が不正／IDの重複）。' +
          'npm run verify:authored で内訳が出ます。',
      );
    }
  } else {
    console.log('[gen:battle-pool] 手書き問題（src/battle/data/authored/）: 0 問');
  }
  console.log('[gen:battle-pool] 教科別（★対戦時はこのうち1教科だけを読み込む★）:');
  for (const [subject, count, bytes] of perFile) {
    const s = stats[subject] || {};
    const f = formatCounts[subject] || {};
    console.log(
      `  ${subject.padEnd(20)} ${String(count).padStart(4)}問 ${String(Math.round(bytes / 1024)).padStart(4)}KB  ` +
        `(4択 ${String(f.choice4 || 0).padStart(3)} / 2〜3・5〜6択 ${String(f.choice || 0).padStart(3)}` +
        ` / かな入力 ${String(f.kana || 0).padStart(3)}` +
        `${f.word || f.panel ? ` / 語句 ${f.word || 0} / パネル ${f.panel || 0}` : ''})  ` +
        `未使用 ${s.skipped || 0}` +
        `${authoredOf(s) > 0 ? `  手書き ${authoredOf(s)}` : ''}`,
    );
  }
}

main();
