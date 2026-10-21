/**
 * 本文の中の設問行（インライン行・リスニングの設問文・小問の文）を取り出す（C-13: questionDisplay.ts から分離）。
 *   中身は分離前と1文字も変えていない。questionDisplay.ts から全て re-export している。
 */
import type { ProblemLike, SubQuestionLike } from '../types/curriculum';
import { buildSubQuestionList } from './questionLabel';

/* ===========================================================================
 * 小問行の横並び（スマホのみ）
 * ===========================================================================
 * ご要望(8)：
 *   「(1)から4問縦書きになってるけど、横書きにしたら1画面に収まるくない？」
 *
 * ご注意(9)：
 *   「特に化学基礎とかは問題によって、問題文の長さが違うから、コードで
 *     形式的に作ると問題によっておかしくなる可能性があるから注意ね。」
 *
 * ■ なぜ「数学なら横並び」にしないのか
 *   横並びが成立するのは「小問の本文が数式のように短い」ときだけで、
 *   これは科目では決まらない。全 262 問を実測した結果が下表：
 *
 *     行頭マーカー（(1)/(ア)/①/問1）を持つ行の「本文の最大文字数」
 *     ─────────────────────────────────────────────
 *       数学      … 10〜22 文字（∫ x^4 dx など）
 *       化学基礎  … 最大 157 文字（p_c5_5_2 の計算問題）
 *       化学発展  … ほぼ全問 40 文字超
 *
 *   つまり「数学だから横並び」にすると化学基礎の 157 文字の小問まで
 *   横に並べようとして崩れる。逆に「化学だから縦」にすると
 *   q_c2_4_7（"F > O > N > C" など 16 文字）を縦に積んで損をする。
 *   そこで判定は科目ではなく **その問題自身の形** で行う。
 *
 * ■ 判定条件（すべて満たしたときだけ横並び）
 *   1. 問題文に Markdown 表（|）を含まない
 *      … 表は横幅を必要とするので分割してはいけない
 *   2. マーカー行が 2〜4 本
 *      … 1 本なら並べる意味がない。5 本以上は 2 列でも 3 段になり効果が薄い
 *   3. マーカー行が「問題文の末尾に連続して」並んでいる
 *      … 間に地の文が挟まる問題（例：p_c5_6_3）を横並びにすると
 *        読み順が壊れる。リード文＋小問リストという形だけを対象にする
 *   4. すべての本文が 1 文字以上、かつ 20 文字以下
 *      … 20 文字は 2 列（≒画面幅の半分＝約 170px）に 1〜2 行で収まる上限
 *
 *   実測結果：21 問が該当（数学 20 問／化学基礎 1 問）。
 *   除外理由の内訳は マーカー行<2:115、本文が長い:68、マーカー行>4:37、
 *   末尾に連続していない:15、表を含む:6。
 *
 * ■ 崩れないための二重の安全網
 *   ・上記 4 条件で「短いことが確認できた問題」だけを対象にする（この関数）
 *   ・描画側は grid ではなく flex-wrap を使い、万一 1 項目が想定より
 *     長くなっても行が折り返すだけで、はみ出しや文字切れにならない
 *
 * ■ PC は対象外
 *   呼び出し側でスマホ幅のときだけ適用する。PC の見た目は一切変えない。
 */

/** 行頭の小問マーカー：(1) (ア) (a) ① 問1 など */
const LEADING_MARKER_RE =
  /^\s*(?:[（(]\s*(?:[0-9０-９]{1,2}|[ア-ンa-zA-Zａ-ｚＡ-Ｚ])\s*[)）]|[①-⑳]|問\s*[0-9０-９]{1,2})\s*/u;

/** 横並びを許す小問の本数の下限・上限 */
const INLINE_ROWS_MIN = 2;

const INLINE_ROWS_MAX = 4;

/** 横並びを許す本文の最大文字数（2 列に 1〜2 行で収まる上限） */
const INLINE_BODY_MAX_LEN = 20;

export interface InlineQuestionRow {
  /** 行頭のマーカー（"(1)" など）。無い場合は空文字 */
  marker: string;
  /** マーカーを除いた本文 */
  body: string;
}

export interface InlineQuestionRows {
  /** マーカー行より前の地の文（リード文）。無ければ空文字 */
  lead: string;
  /** 横並びにする小問行 */
  rows: InlineQuestionRow[];
}

/**
 * 問題文を「リード文＋横並びにできる小問行」に分解できるか判定する。
 *
 * 横並びの条件を満たさない問題では null を返すので、呼び出し側は
 * 従来どおりの縦積み描画にフォールバックすればよい（安全側）。
 */
export function extractInlineQuestionRows(text: string): InlineQuestionRows | null {
  const raw = String(text || '');
  if (!raw.trim()) return null;
  // 条件1：表を含む問題は対象外（表は横幅を必要とする）
  if (raw.includes('|')) return null;

  const lines = raw.split(/\n/u).map(s => s.trim()).filter(Boolean);
  if (lines.length < INLINE_ROWS_MIN) return null;

  const markedIdx = lines
    .map((line, i) => (LEADING_MARKER_RE.test(line) ? i : -1))
    .filter(i => i >= 0);

  // 条件2：マーカー行が 2〜4 本
  if (markedIdx.length < INLINE_ROWS_MIN || markedIdx.length > INLINE_ROWS_MAX) return null;

  // 条件3：末尾に連続して並んでいる（間に地の文が挟まらない）
  const last = markedIdx[markedIdx.length - 1];
  const isContiguousTail =
    last === lines.length - 1 && markedIdx.every((v, k) => v === markedIdx[0] + k);
  if (!isContiguousTail) return null;

  const rows: InlineQuestionRow[] = [];
  for (const i of markedIdx) {
    const line = lines[i];
    const marker = (line.match(LEADING_MARKER_RE)?.[0] ?? '').trim();
    const body = line.replace(LEADING_MARKER_RE, '').trim();
    // 条件4：本文が空でなく、かつ十分に短い
    if (!body || body.length > INLINE_BODY_MAX_LEN) return null;
    rows.push({ marker, body });
  }

  const lead = lines.slice(0, markedIdx[0]).join('\n');
  return { lead, rows };
}

/**
 * ===================================================================
 * リスニング／英文法の「解説画面に出す問題」を組み立てる
 * ===================================================================
 *
 * ★ご要望11（原文）★
 *   「解説なんだけど、今回の写真みたいに、第1問Aではから続く文章は要らんくて、
 *     問題ページの^問題はいらないよね。ここには上半分に音源(ボタン小さくして)と
 *     問題を入れて、スクリプトを押さなくても直で下に出てるようにしたい。」
 *   「一画面に収める+受験生は何をみたいか→文章(スクリプト・正誤)をまずみたい
 *     (選択肢は問題に戻れば見れる・選択肢まで解説の方に書くと
 *      おそらく文字が収まりきらない)→その後に解説を読みたい。」
 *
 * ■ この関数が返すもの
 *   各小問の「設問文」だけ（例：問1 傘について、話者の状況に最も近い英文）。
 *   形式説明（第1問 A では…）・操作説明（【音源の聞き方】）・
 *   選択肢 ①〜④ は返さない。
 *
 * ■ なぜ問題文（question.text）を切り刻まずに subQuestions から作るのか
 *   question.text を正規表現で削る方式にすると、
 *   「どこまでが形式説明で、どこからが選択肢か」を字面から推測することになり、
 *   問題ごとに書式が少し違うだけで壊れる
 *   （ご指摘「コードで形式的に作ると問題によっておかしくなる可能性がある」）。
 *   設問文はもともと subQuestions[].label に構造化されて入っているので、
 *   そこから読むほうが確実で、書式のゆらぎに影響されない。
 *
 * ■ 適用しない問題は null を返す（安全側）
 *   ・小問が無い問題
 *   ・設問文が空の問題（第1問B の図選択など、label に本文が無い形）
 *   ・設問文が長すぎて1画面に収まらない問題
 *   これらは null を返し、呼び出し側は従来の描画にそのまま落ちる。
 */
/**
 * 1問ぶんの設問文の長さの上限。
 *
 * ★この数字は当てずっぽうではなく実測値★
 *   リスニング＋英文法の全64問（＝設問 計約230）を走査した結果、
 *     設問文の最長 = 68字
 *     「What should the group members (not the leader) do with their phones?」
 *       （英語リスニング el3）
 *   だった。marker 欠け 0 件・本文欠け 0 件。
 *   最初 44 字にしていたが、それだと el3 が対象外に落ちて
 *   従来の縦積み（形式説明＋選択肢16行）に戻ってしまうため、
 *   実測の最長を収容できる 80 字にする。
 *   80字はスマホ幅（390px・15px）で概ね4行に収まり、
 *   4問ぶん並べても上半分に収まる範囲。
 *   これを超える設問文が将来入ったら null を返して従来描画に落ちる
 *   ＝壊れるのではなく、安全側に倒れる。
 */
const LISTENING_BODY_MAX_LEN = 80;

export function extractListeningQuestionRows(
  question: ProblemLike
): { marker: string; body: string }[] | null {
  const rows = buildSubQuestionList(question);
  if (rows.length === 0) return null;
  // マーカー（問1 など）と本文の両方がそろっていない形は対象外。
  // 第1問B のようにイラストを選ぶ問題は label に本文が無いのでここで外れる。
  if (rows.some((r) => !r.marker || !r.body)) return null;
  // 1問でも長い設問文があれば、横並び前提の「1画面」が崩れるので使わない。
  if (rows.some((r) => r.body.length > LISTENING_BODY_MAX_LEN)) return null;
  return rows;
}

/**
 * ===================================================================
 * 「問N　英文」の英文だけを小問ごとに取り出す
 * ===================================================================
 *
 * ★ご要望11（原文）★
 *   「次、英文法の問題音声つけるのはいいけどさ、英文法は普通に英文ないと
 *     問題成立しやんのやけど　音声のボタンを少し小さくした上で、英文しっかり載せて。」
 *
 * ■ なぜ英文が消えていたのか（原因を実測で確定させた）
 *   英文法の問題は音源（audioTracks）を持つ。
 *   Quiz.tsx はリスニングと同じ扱い（listeningUnified = true）にするため、
 *     {!listeningUnified && ( …question.text を描画… )}
 *   の分岐で question.text を丸ごと描画しない。
 *   リスニングは「英文は音声にしか無い」ので、これが正しい。
 *   ところが英文法は question.text の中に
 *     問1　I ______ to Kyoto three times, so I can show you around.
 *   という英文があり、これが唯一の英文なので、消すと
 *   「空所に入れるものを選べ」なのに空所のある文が無い＝問題が成立しない。
 *   代わりに表示されている subQuestions[].label は
 *     「問1 経験の現在完了」
 *   という文法項目名だけで、英文はどこにも入っていない（全20問・実測）。
 *
 * ■ なぜ「英文法なら出す」という科目分岐にしないのか
 *   ご指摘「コードで形式的に作ると問題によっておかしくなる可能性がある」。
 *   科目名で分けると、将来リスニングに英文つきの問題が入ったり、
 *   英文法に英文なしの問題が入った瞬間に壊れる。
 *   そこで「その問題の本文に、その小問番号の本文行が実在するか」だけを見る。
 *   これは問題ごとの事実なので、科目構成が変わっても壊れない。
 *
 * ■ この判定が正しく効くことの実測
 *   正規表現 /^問\s*([0-9]{1,2})[　\s]+(.+)$/u を全問に当てた結果
 *     英文法  ：20問すべてで一致（本文行 計100本）、英文の最長 112字
 *               「The scientists announced the surprising fact ______ the ice
 *                 in that region was melting far faster than expected.」（eg3_4）
 *     リスニング：44問すべてで不一致（本文行 0本）
 *   つまり英文を持つ問題だけで勝手に有効になり、
 *   リスニングでは自動的に無効になる。科目分岐は要らない。
 *
 * ■ 選択肢（①〜④）は返さない
 *   選択肢は解答ペインのボタンとして別に描画されているので、
 *   ここで返すと同じ文字が二重に並ぶ。
 *   「問N」の行だけを拾い、① で始まる行は拾わない。
 *
 * @returns 小問番号（"1","2",…）→ 英文 の Map。1本も取れなければ null。
 */
export function extractSubQuestionSentences(question: ProblemLike): Map<string, string> | null {
  const text = String(question?.text || '');
  if (!text) return null;

  // 「問1　英文」の形の行だけを拾う。
  // 全角スペース・半角スペースどちらの区切りでも拾えるようにする
  // （データの書式が問題ごとに少し違っても落ちないように）。
  const HEAD_RE = /^問\s*([0-9]{1,2})[　\s]+(.+)$/u;

  const map = new Map<string, string>();
  // ★英文が2行以上ある問（英文法の書き換え「(a) …／(b) …（空所）」）★
  //   1行目だけを拾うと、空所のある (b) の行が問題画面に出なかった。
  //   「問N」の次の行から、①〜④ の選択肢・区切り線・次の「問N」までを続きとして拾う。
  let current: string | null = null;
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) { current = null; continue; }
    const m = line.match(HEAD_RE);
    if (!m) {
      if (current && !/^[①②③④⑤⑥⑦⑧⑨⑩]/u.test(line) && !/^[─―—-]{3,}$/u.test(line)) {
        map.set(current, `${map.get(current)}\n${line}`);
      } else {
        current = null;
      }
      continue;
    }
    const no = m[1];
    const body = m[2].trim();
    if (!body) { current = null; continue; }
    // 同じ番号が2回出てきたら最初のものを採用（後段の重複記述に引きずられない）
    if (!map.has(no)) { map.set(no, body); current = no; } else { current = null; }
  }

  return map.size > 0 ? map : null;
}

/**
 * 指定の小問に対応する「問N　英文」の英文を返す。
 *
 * 小問の番号は label（"問1 経験の現在完了"）から読む。
 * 番号が読めない・その番号の本文行が無い場合は null を返し、
 * 呼び出し側は「英文は出さない」＝従来の表示のままになる（安全側）。
 */
export function findSubQuestionSentence(question: ProblemLike, sub: SubQuestionLike): string | null {
  if (!sub) return null;
  const sentences = extractSubQuestionSentences(question);
  if (!sentences) return null;
  const no = String(sub?.label || '').match(/問\s*([0-9]{1,2})/u)?.[1];
  if (!no) return null;
  return sentences.get(no) || null;
}
