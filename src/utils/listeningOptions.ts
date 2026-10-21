/**
 * ===================================================================
 * 英語リスニング：問題文（選択肢）と解答欄を「同じ場所」に出すための整形
 * ===================================================================
 *
 * ■ なぜ必要か（ご要望：問題文と解答欄を分離しないで）
 *   第1問A のデータは
 *     ・problem.text        … リード文＋「問1（話者：…）＋①〜④の英文」
 *     ・subQuestions[].options … ['①','②','③','④'] のマークだけ
 *   という持ち方をしている。マークシートの再現としては正しいが、
 *   画面上は「左ペインに英文／右ペインに①〜④のチップ」と分かれてしまい、
 *   ①がどの英文なのかを目で往復して探す必要があった。
 *
 *   そこで、problem.text から「問Nの①〜④の本文」を機械的に取り出し、
 *   解答欄の選択肢ボタンにそのまま載せる。こうすると
 *   「読む場所」と「押す場所」が一致し、視線移動がゼロになる。
 *
 * ■ データは書き換えない
 *   解説（Explanation）では従来どおり問題文全文（①〜④つき）を見せたい。
 *   そのため元データには手を入れず、Quiz の表示時にだけ
 *   ・選択肢本文を取り出す（buildListeningOptionTexts）
 *   ・左ペインからは重複する問N ブロックを落とす（stripListeningQuestionBlocks）
 *   という2つの整形を行う。
 *
 * ■ 第1問B（イラスト選択）について
 *   判断材料はイラスト（subQuestion.imageUrl）なので選択肢本文は無い。
 *   その場合は空の Map が返り、呼び出し側はマークのみのボタンを描く。
 */
import type { ProblemLike, SubQuestion, SubQuestionLike } from '../types/curriculum';

/** 選択肢マーク（第1問A/B はすべて ①〜④ の4択） */
const MARKS = ['①', '②', '③', '④'];

/** 行頭のマークを見て「何番の選択肢か」を返す（該当しなければ -1）。 */
function markIndexOf(line: string): number {
  const head = line.trim().charAt(0);
  return MARKS.indexOf(head);
}

/** 「問1」「問 1」「問1（話者：…）」などから設問番号を取り出す（なければ null）。 */
function questionNumberOf(line: string): number | null {
  const m = line.match(/^\s*問\s*(\d+)/u);
  return m ? Number(m[1]) : null;
}

/**
 * problem.text から「設問番号 → ①〜④の本文」を取り出す。
 *
 * 想定する形（第1問A の生成データ）:
 *   ────────────────────
 *   問1（話者：女性（高校生））
 *   ① She went to bed early last night.
 *   ② She plans to go to bed early tonight.
 *   ...
 *
 * 取り出せなかった設問はキーを作らない（＝マークのみで描画される）。
 */
export function parseListeningOptionBlocks(text: string): Map<number, string[]> {
  const result = new Map<number, string[]>();
  let currentNo: number | null = null;

  for (const rawLine of String(text || '').split('\n')) {
    const qno = questionNumberOf(rawLine);
    if (qno !== null) {
      currentNo = qno;
      continue;
    }
    if (currentNo === null) continue;

    const idx = markIndexOf(rawLine);
    if (idx < 0) continue;

    // 「① 本文」のマークを外して本文だけにする（先頭の記号・空白も除去）。
    const body = rawLine.trim().slice(1).replace(/^[\s.．、,:：)）]*/u, '').trim();
    if (!body) continue;

    const list = result.get(currentNo) || [];
    list[idx] = body;
    result.set(currentNo, list);
  }

  // ①〜④が欠けている（＝抽出が不完全な）設問は使わない。
  // 途中まで表示すると「②だけ本文が無い」といった不整合になり、かえって危険。
  for (const [no, list] of Array.from(result.entries())) {
    if (list.length !== 4 || list.some((s) => !s)) result.delete(no);
  }
  return result;
}

/**
 * subQuestion のラベル（"問2 話者（…）の発話に最も近い英文"）から設問番号を推定する。
 * 取れない場合は並び順（index+1）を使う。
 */
export function subQuestionNumber(sq: SubQuestionLike, index: number): number {
  const m = String(sq?.label || '').match(/問\s*(\d+)/u);
  return m ? Number(m[1]) : index + 1;
}

/**
 * 「subQuestion.id → 選択肢本文の配列（options と同じ並び）」を作る。
 * 選択肢本文が取れない設問（第1問B など）はキーを持たない。
 */
export function buildListeningOptionTexts(problem: ProblemLike): Map<string, string[]> {
  const map = new Map<string, string[]>();
  // ここで読む小問は id を持つ前提（データの小問は必ず id を持つ）
  const subs = (problem?.subQuestions || []) as Array<Partial<SubQuestion> & { id: string }>;

  // ★第4問以降：小問が選択肢本文（optionTexts）を直接持っている★
  //   6択共有・図が選択肢・日本語の選択肢など形が多く、problem.text から
  //   機械抽出するより、データが直接持つほうが確実。options と同じ長さの
  //   ときだけ採用する（ずれた本文を貼ると誤答を誘うため）。
  subs.forEach((sq) => {
    const texts = sq?.optionTexts;
    const options: string[] = Array.isArray(sq?.options) ? sq.options : [];
    if (Array.isArray(texts) && texts.length === options.length && options.length > 0) {
      map.set(sq.id, texts.map((t: unknown) => String(t)));
    }
  });

  const blocks = parseListeningOptionBlocks(problem?.text || '');
  if (blocks.size === 0) return map;

  subs.forEach((sq, i) => {
    if (map.has(sq.id)) return; // データ側の本文を優先
    const bodies = blocks.get(subQuestionNumber(sq, i));
    if (!bodies) return;
    const options: string[] = Array.isArray(sq?.options) ? sq.options : [];
    // options が ①〜④ のマークであることを確認してから対応づける
    // （将来「本文そのものを options に入れる」形になっても壊れないようにする）。
    if (options.length !== 4 || !options.every((o, idx) => String(o).trim() === MARKS[idx])) return;
    map.set(sq.id, bodies);
  });
  return map;
}

/**
 * 左ペイン用に「問N 以降のブロック」を落とし、リード文（指示文・コツ）だけを残す。
 *
 * 選択肢本文と設問文は解答カード側に出すので、左ペインに残すと
 * 同じ文が2か所に並び「どちらを見ればよいか」が分からなくなる。
 * 分離をやめる（＝解答欄と同期させる）ための整形。
 */
export function stripListeningQuestionBlocks(text: string): string {
  const lines = String(text || '').split('\n');
  let cut = lines.length;

  for (let i = 0; i < lines.length; i += 1) {
    if (questionNumberOf(lines[i]) !== null) {
      cut = i;
      // 直前が区切り線（──── など）や空行なら、それも一緒に落とす。
      while (cut > 0 && /^[\s─―—-]*$/u.test(lines[cut - 1])) cut -= 1;
      break;
    }
  }

  return lines.slice(0, cut).join('\n').replace(/\n{3,}/gu, '\n\n').trim();
}

/**
 * 問題文から「リード文＋指定した問Nのブロックだけ」を取り出す。
 *
 * ■ なぜ必要か（ご指摘への対応）
 *     > 左側も問題をなぜ問4まで乗せるの？
 *     > 問ごとに切ってるんだから解答と解説の方も対応させないと。
 *
 *   リスニングは「1画面＝1問」で解き、解説も問ごとに表示する。
 *   ところが解説画面の左ペイン（問題文）は problem.text の全文
 *   （問1〜問4の全ブロック）を出していたため、まだ解いていない
 *   問の選択肢まで読めてしまっていた。
 *   この関数で「共通のリード文 ＋ いま見ている問のブロック」だけに絞る。
 *
 * ■ 見つからないときは全文を返す（安全側）
 *   問N の区切りを持たないデータ（第1問B の図問題など）では
 *   絞り込まず従来どおり全文を出す。情報が欠けるほうが害が大きい。
 */
export function sliceListeningQuestionBlock(text: string, questionNo: number): string {
  const source = String(text || '');
  const lines = source.split('\n');

  // 各「問N」行の位置を拾う
  const marks: { index: number; no: number }[] = [];
  lines.forEach((line, i) => {
    const no = questionNumberOf(line);
    if (no !== null) marks.push({ index: i, no });
  });

  const hit = marks.find((m) => m.no === questionNo);
  if (!hit) return source; // 区切りが無い／該当問が無い → 全文（従来どおり）

  // リード文＝最初の問N より前（区切り線・空行は落とす）
  let leadEnd = marks[0].index;
  while (leadEnd > 0 && /^[\s─―—-]*$/u.test(lines[leadEnd - 1])) leadEnd -= 1;
  const lead = lines.slice(0, leadEnd).join('\n');

  // 該当問のブロック＝問N 行から「次の問」または末尾まで
  const next = marks.find((m) => m.index > hit.index);
  let blockEnd = next ? next.index : lines.length;
  // ブロック末尾の区切り線・空行は落とす
  while (blockEnd > hit.index && /^[\s─―—-]*$/u.test(lines[blockEnd - 1])) blockEnd -= 1;
  const block = lines.slice(hit.index, blockEnd).join('\n');

  return [lead, block]
    .filter((part) => part.trim())
    .join('\n\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
}

/**
 * 解答中の画面から「操作の説明」の見出しブロックを落とす。
 *
 * ■ なぜ落とすのか（ご要望）
 *     > いまこの音源の聞き方とかはもういらないので、
 *     > 問題をつけた今のこの上場面に4つの英文がしっかりと映る
 *     > もしくは、図がしっかりと映るようにしてほしい。
 *     > スクロールしてわざわざ答えるのめんどい。
 *
 *   問題データのリード文には【音源の聞き方】【解き方のコツ】という
 *   長い説明が入っている。初回は役に立つが、2回目以降は毎回同じ文章で、
 *   しかも「選択肢の英文・イラスト」よりも上にあるため
 *   スマホでは本題が画面の外に押し出されてしまっていた。
 *   アプリの操作方法は画面を見れば分かる（再生ボタンは問の横にある）ので、
 *   解答中の画面からは落とし、限られた1画面を選択肢と図に使う。
 *
 * ■ データは書き換えない
 *   解説画面では問題文を全文見せたいので、元データには手を入れず
 *   Quiz の表示時にだけこの整形を通す。
 *
 * ■ 落とす対象
 *   「【…】で始まる行」から次の空行までを1ブロックとして扱う。
 *   問題そのものの指示文（「①〜④のうちから1つずつ選びなさい」）は
 *   【】で囲まれていないので残る。
 */
const DROPPED_LEAD_HEADINGS = ['音源の聞き方', '解き方のコツ'];

export function stripListeningHowToBlocks(text: string): string {
  const lines = String(text || '').split('\n');
  const kept: string[] = [];
  let dropping = false;

  for (const line of lines) {
    const heading = line.match(/^\s*【\s*([^】]+?)\s*】/u);
    if (heading) {
      // 落とす見出しに入ったらブロック終わり（空行）まで捨てる。
      dropping = DROPPED_LEAD_HEADINGS.includes(heading[1].trim());
      if (dropping) continue;
    }
    if (dropping) {
      // 空行まで来たらブロックの終わり。空行自体は捨てて詰める。
      if (line.trim() === '') dropping = false;
      continue;
    }
    kept.push(line);
  }

  return kept.join('\n').replace(/\n{3,}/gu, '\n\n').trim();
}

/**
 * 問題文ペイン（左側）に出す「リード文だけ」を作る。
 *
 * ■ なぜ専用の関数にしたのか（不具合の修正）
 *   これまで呼び出し側は
 *     stripListeningQuestionBlocks(cleanQuestionText(text))
 *   の順で通していた。ところが `cleanQuestionText` は
 *   「行頭の 問N を消す」処理なので、先に通すと問N の行が消えてしまい、
 *   `stripListeningQuestionBlocks` が切り落とす目印を見つけられなかった。
 *   結果として左ペインに問1〜問4の全ブロックがそのまま残り、
 *
 *     > 問題のところさ、全部の問いがまとまってて
 *     > どの問いを解いているかが分からない
 *
 *   というご指摘のとおりの状態になっていた。
 *   順序を間違えないよう、正しい順番をこの関数に閉じ込める。
 *
 * ■ やること（順番が大事）
 *   ① 問N 以降のブロックを落とす（この時点では問N がまだ残っている）
 *   ② 【音源の聞き方】【解き方のコツ】の定型ブロックを落とす
 *   結果は「第2回　第1問 A（…）」＋「①〜④のうちから1つずつ選びなさい」だけになる。
 *   いま解いている問の見出し・音源・図は、呼び出し側がこの下に描く。
 */
export function buildListeningLeadText(text: string): string {
  return stripListeningHowToBlocks(stripListeningQuestionBlocks(text));
}

/**
 * リード文から【難易度：…】の表記を取り出す（無ければ null）。
 *
 * ■ なぜ分離するのか（ご要望）
 *   「難易度：易しめ」等の表記は解答操作の妨げになるため、
 *   タイトル行から外して問題文カードの末尾に小さく表示する。
 *   タイトル行は「第2回　第1問 A（4問・2回読み）」だけになり、
 *   限られたスマホの縦幅を本題（音源・選択肢）に使える。
 */
export function extractListeningDifficulty(text: string): string | null {
  const m = String(text || '').match(/【\s*難易度\s*[:：]\s*([^】]+)】/u);
  return m ? m[1].trim() : null;
}

/** リード文から【難易度：…】の表記を取り除く（表示位置は呼び出し側が決める）。 */
export function stripListeningDifficulty(text: string): string {
  return String(text || '')
    .replace(/\s*【\s*難易度\s*[:：][^】]*】\s*/gu, ' ')
    .replace(/[ \t]{2,}/gu, ' ')
    .replace(/[ \t]+$/gmu, '')
    .trim();
}

/**
 * 説明ページ（ListeningBriefing）に出す内容を、読みやすい形に分けて取り出す。
 *
 * ■ なぜ（2026-10-21 ご指摘）
 *   「問題文の表示のところがフォント見づらいしスクロール大変やししんどい」
 *   第4問〜第6問のリード文には「■ 問26 …」以降に Conditions・表・選択肢まで
 *   そのまま入っていて、説明ページが 900〜1800 文字の縦長になっていた。
 *   選択肢・表・Conditions は解答画面（資料欄と解答欄）に出るので、ここでは
 *     ・題（第1回　第4問 B（問26・1回読み））
 *     ・何をする問題か（説明文）
 *     ・状況（解答画面の「状況・場面を確認」をやめたので、ここで読む）
 *     ・活動1〜3（第5問）
 *     ・本番の配点
 *   だけを出し、1画面に収める。
 */
export interface ListeningBriefingParts {
  title: string;
  paragraphs: string[];
  situations: { label?: string; text: string }[];
  activities: string[];
  points?: string;
}
export function parseListeningBriefing(lead: string): ListeningBriefingParts {
  const blocks = String(lead || '').split(/\n\s*─{4,}\s*\n/u);
  const head = (blocks.shift() ?? '').split('\n').map(l => stripListeningDifficulty(l));
  const out: ListeningBriefingParts = { title: head.shift() ?? '', paragraphs: [], situations: [], activities: [] };
  const situationOf = (line: string) => line.match(/^状況\s*[:：]\s*(.+)$/u)?.[1];
  for (const line of head) {
    if (!line) continue;
    const points = line.match(/^【\s*本番の配点\s*】\s*(.+)$/u)?.[1];
    if (points) { out.points = points; continue; }
    const situation = situationOf(line);
    if (situation) { out.situations.push({ text: situation }); continue; }
    if (/^活動\s*\d/u.test(line)) { out.activities.push(line); continue; }
    if (/^メモ欄\s*[:：]/u.test(line)) continue;
    out.paragraphs.push(line);
  }
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim());
    const label = lines[0]?.match(/^■\s*(問\s*[\d〜～・]+)/u)?.[1];
    for (const line of lines) {
      const situation = situationOf(line);
      if (situation) out.situations.push({ label, text: situation });
    }
  }
  return out;
}
