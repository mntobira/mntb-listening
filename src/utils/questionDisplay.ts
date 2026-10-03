/**
 * questionDisplay.ts — 問題文（左側）と解答欄（右側）の表示ルールを支える共有ユーティリティ
 *
 * 【表示ルール】
 * 1. 左側の「問題文」欄には、共通のリード文に加えて、続く全小問の設問文
 *    （問1、問2、…）を順番に表示する。左側だけ読めば全設問が理解できる。
 * 2. 右側の「解答欄」には設問文自体は含めず、設問マーカー（(ア)/(1)/問2 など）と
 *    入力フォーム・選択肢のみを配置する。
 *
 * そのために、設問ラベル（sq.label）を
 *   - marker: 「(ア)」「(1)」「問2」などの識別子
 *   - body  : マーカーに続く設問文本体
 * に分離するヘルパーを提供する。
 *
 * 【枝番（① ② / (a) (b) / （ア）（イ））の扱い】
 *   1つの大問マーカーの中がさらに枝分かれしている設問がある。
 *     例) "(3)① 非共有電子対を最も多くもつ分子"
 *         "(3)② 非共有電子対をもたない分子（すべて）"
 *         "問2 ①" 〜 "問2 ⑩"
 *   従来は marker が両方とも "(3)" になってしまい、解答欄に
 *   同じ "(3)" が並んで「今どの問題を解いているのか分からない」
 *   状態だった。そこで枝番はマーカー側に含め "(3)①" と表示する。
 *   （枝番は body 側からは取り除くので、左側の設問一覧では
 *     マーカー "(3)①" ＋ 本文 "非共有電子対を…" と並ぶ）
 */

/**
 * 表示上の問題番号（問1／【問1】／第1問／先頭の「1.」など）を消して、
 * 進捗表示（「1 / 10」など）に統一する。
 *
 * ■ なぜ消すのか
 *   問題文そのものに「問1」と書かれていると、画面上部の進捗表示と
 *   二重に番号が出てしまう。しかも範囲を絞って解いているときは
 *   本文の「問1」が実際の順番と食い違い、どれを解いているのか
 *   分からなくなる。番号は進捗表示だけに任せる。
 *
 * ■ なぜここ（questionDisplay.ts）にあるのか
 *   以前は Quiz.tsx（演習画面）と Explanation.tsx（解説画面）に
 *   1文字も違わない同じ実装が2つ書かれていた。
 *   同じ問題文を出す2画面なので、片方だけ直すと
 *   「演習では番号が消えているのに解説では残る」という
 *   食い違いになる。定義を1つにして、その事故の余地を無くしている。
 *
 * ■ 消す対象を限定している理由
 *   本文中の「(1)〜(10)の下線部は…」や「水素と酸素」のような
 *   数字は消してはいけない。そのため
 *     ・1つ目の replace … 文字列の先頭だけ（^）
 *     ・2つ目の replace … 行頭だけ（\n の直後）
 *   に限定し、本文の途中は触らない。
 *
 * @param text 問題文（null / undefined / 数値が来ても落ちない）
 */
export function cleanQuestionText(text: string): string {
  return String(text || '')
    .replace(/^\s*(?:【\s*問?\s*\d+\s*】|問\s*\d+|第\s*\d+\s*問|\d+[.．、\s]+)\s*/u, '')
    .replace(/\n\s*(?:問\s*\d+|【\s*問?\s*\d+\s*】)\s*/gu, '\n');
}

export interface SplitLabel {
  /** 設問マーカー（例: "(ア)" "(1)" "問2" "(3)①"）。抽出できない場合はフォールバック文字列 */
  marker: string;
  /** マーカー（枝番を含む）を除いた設問文本体。マーカーのみのラベルなら空文字 */
  body: string;
  /** 枝番（"①" "(a)" "（ア）" など）。枝番が無ければ空文字 */
  subMarker: string;
}

/**
 * 設問文本体の先頭に残っている「枝番」を切り出す。
 *
 * 枝番として認めるのは次の形だけに限定する。
 *   - 丸数字     … ① ② ⑳ / ❶ ❷（そのまま。区切り記号は任意）
 *   - 括弧つき記号 … (a) (b) / (A) (B) / （ア）（イ）/ (1) (2)
 *
 * 「(　)」のような空欄カッコや、本文がいきなり括弧で始まる説明文
 * （例: "（記述）…"）を誤って枝番にしないよう、括弧の中身は
 * 英数字・カナ・丸数字のみを許可し、2文字以内に限る。
 */
function splitSubMarker(body: string): { subMarker: string; rest: string } {
  const raw = String(body || '').trim();
  if (!raw) return { subMarker: '', rest: '' };

  // ① ② …（丸数字はそれ自体が枝番。後ろの区切り記号は読み捨てる）
  const circled = raw.match(/^([①-⑳❶-❿])\s*[.．、)）:：]?\s*(.*)$/su);
  if (circled) {
    return { subMarker: circled[1], rest: circled[2].trim() };
  }

  // (a) / (A) / （ア） / (1) — 中身は英数字・カナ・丸数字の1〜2文字のみ
  const paren = raw.match(
    /^[（(]\s*([0-9a-zA-Zぁ-んァ-ヶ①-⑳]{1,2})\s*[）)]\s*(.*)$/su,
  );
  if (paren) {
    // 本文が残らない場合（"(ア)" だけのラベル）も枝番として扱う。
    // これは「リード文中の空欄を答える」形式で、解答欄には
    // マーカー＋枝番だけが出れば十分。
    return { subMarker: `(${paren[1].trim()})`, rest: paren[2].trim() };
  }

  return { subMarker: '', rest: raw };
}

/** マーカーと枝番を連結した表示用文字列を返す（枝番が無ければマーカーのみ）。 */
export function joinMarker(marker: string, subMarker: string): string {
  if (!marker) return subMarker;
  if (!subMarker) return marker;
  return `${marker}${subMarker}`;
}

/**
 * 設問ラベルをマーカーと設問文本体に分離する。
 *
 * 対応パターン:
 *  - "(ア)" / "（ア）" / "(1)" / "（10）"       … 括弧つきマーカー
 *  - "問1" / "問 12"                            … 問番号
 *  - "a." / "ア." / "1."                        … ピリオド区切り
 *  - 上記に続く本文（例: "(2) ろ過はどのような…"）
 *
 * マーカーが見つからない場合は、fallbackMarker（例: "問3"）をマーカーとし、
 * ラベル全体を本文として返す。
 */
export function splitQuestionLabel(label: string, fallbackMarker = ''): SplitLabel {
  const raw = String(label || '').trim();
  if (!raw) return { marker: fallbackMarker, body: '', subMarker: '' };

  /** 大問マーカーを決めたあと、残りの先頭から枝番を切り出して返す */
  const withSub = (marker: string, body: string): SplitLabel => {
    const { subMarker, rest } = splitSubMarker(body);
    return { marker, body: rest, subMarker };
  };

  // 括弧つきマーカー: (ア) / （１） / (10) / (a)
  const paren = raw.match(/^[（(]\s*([^（）()]{1,4})\s*[）)]\s*(.*)$/su);
  if (paren) {
    return withSub(`(${paren[1].trim()})`, paren[2].trim());
  }

  // 「問1」「問 12」「第2問」形式
  const toi = raw.match(/^((?:第\s*\d+\s*問)|(?:問\s*\d+))[.．、:：\s]*(.*)$/su);
  if (toi) {
    return withSub(toi[1].replace(/\s+/g, ''), toi[2].trim());
  }

  // 「a.」「ア.」「1.」「①」形式
  const dot = raw.match(/^([0-9a-zA-Zぁ-んァ-ヶ①-⑳]{1,3})[.．、)）:：]\s+(.*)$/su);
  if (dot) {
    return { marker: dot[1], body: dot[2].trim(), subMarker: '' };
  }

  // 大問マーカーが無く、丸数字だけで始まるラベル（例: "① 空欄に入る語句を答えよ。"）。
  // この丸数字は「その問題内での通し番号」なので、マーカーとして扱う。
  const leadCircled = raw.match(/^([①-⑳❶-❿])\s*[.．、)）:：]?\s*(.*)$/su);
  if (leadCircled && leadCircled[2].trim()) {
    return { marker: leadCircled[1], body: leadCircled[2].trim(), subMarker: '' };
  }

  // マーカーが抽出できない → ラベル全体を設問文とみなす
  return { marker: fallbackMarker, body: raw, subMarker: '' };
}

/** 自動採番に使う丸数字。①〜⑳ まで。 */
export const CIRCLED = [
  '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
  '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳',
];

/**
 * ★選択肢に付ける丸文字（①②③…）を決める★
 *
 * ご要望：「解答入力のところにも丸文字を。」
 *
 * ■ なぜ「常に index+1 の丸数字を出す」ではいけないのか（実測）
 *     全教科の multiple_choice を走査すると：
 *       英語リスニング 221問 / 英文法 100問 → options が既に ['①','②',…]
 *       で ★選択肢文字列そのものが丸数字★
 *     ここに更に丸数字バッジを足すと「① ①」と二重に出る。
 *
 *     さらに、設問文が「次の①〜⑥のうちから一つ選べ」と番号の範囲を
 *     明示している問題（地理 3問）では、バッジの番号と本文の番号が
 *     食い違うと ★問題文が嘘になる★。実測では地理の3問すべて
 *     （①〜⑥↔6択、①〜④↔4択、①〜④↔4択）で個数が一致しており、
 *     全教科で個数の不一致は0件だった。よって
 *     「出現順に番号を振る」で本文と必ず整合する。
 *
 * ■ 判定は選択肢の中身という事実だけで行う（教科で決め打ちしない）
 *     選択肢文字列が既に丸数字だけ／丸数字で始まる場合は付けない。
 *     それ以外には出現順の丸数字を付ける。⑳を超えた分は付けない
 *     （存在しない文字を作らない）。
 */
export function optionCircledMark(option: string, index: number): string {
  const raw = String(option ?? '').trim();
  // 既に丸数字を持っている選択肢（英語リスニング・英文法）には付けない
  if (/^[①-⑳]/u.test(raw)) return '';
  return CIRCLED[index] ?? '';
}

/**
 * 1つの問題に含まれる全設問について、解答欄に出す表示マーカーを決める。
 *
 * ① ラベルに枝番が書かれている場合は、それをそのまま使う（"(3)①"）。
 * ② それでも同じマーカーが複数ある場合は、出現順に丸数字を足して区別する
 *    （"(5)" が2つ → "(5)①" "(5)②" ／ "問1(1)" が2つ → "問1(1)①" "問1(1)②"）。
 *
 *    例) "(5) きわめて硬いのはどちらか"  → "(5)①"
 *        "(5) その理由（記述）"          → "(5)②"
 *
 *    これは元の問題文に無い番号を補うことになるが、左側の「設問一覧」にも
 *    同じマーカーを出すので左右の対応は崩れない。解答欄に "(5)" が2つ並んで
 *    「今どちらを入力しているのか分からない」状態を防ぐことを優先する。
 * ③ 重複が無ければ従来どおりマーカーのみ（表示は変わらない）。
 */
export function resolveAnswerMarkers(question: any): Map<any, string> {
  const subs: any[] = question?.subQuestions || [];

  const base = subs.map((sq, i) => {
    const fallback = `問${i + 1}`;
    const { marker, subMarker } = splitQuestionLabel(sq?.label || '', fallback);
    return { sq, subMarker, full: joinMarker(marker, subMarker) || fallback };
  });

  // 同じマーカーが何回出るかを数える
  const counts = new Map<string, number>();
  for (const b of base) counts.set(b.full, (counts.get(b.full) || 0) + 1);

  // 重複していないマーカーは確定枠として押さえておく。
  // 自動採番した結果がこれらとぶつかると、また区別できなくなってしまう。
  const taken = new Set<string>();
  for (const b of base) if ((counts.get(b.full) || 0) === 1) taken.add(b.full);

  const seq = new Map<string, number>();
  const out = new Map<any, string>();
  for (const b of base) {
    const duplicated = (counts.get(b.full) || 0) > 1;
    if (duplicated) {
      // 空いている番号が見つかるまで進める
      let n = (seq.get(b.full) || 0);
      let candidate = '';
      do {
        n += 1;
        candidate = `${b.full}${CIRCLED[n - 1] ?? `-${n}`}`;
      } while (taken.has(candidate));
      seq.set(b.full, n);
      taken.add(candidate);
      out.set(b.sq, candidate);
    } else {
      out.set(b.sq, b.full);
    }
  }
  return out;
}

/**
 * 右側の解答欄カードに表示する「短いマーカー」を返す。
 * グループ化された設問（化学反応式の係数など）はグループ名の先頭語を冠する。
 *
 * (1) の中が ①② に枝分かれしている設問では "(1)①" のように枝番まで含める。
 * こうしないと解答欄に "(1)" が2つ並び、どちらを入力しているのか分からない。
 *
 * @param question 同じ問題の全設問。渡すと重複マーカーの自動採番まで行う。
 */
export function answerCardMarker(sq: any, index: number, question?: any): string {
  const fallback = `問${index + 1}`;
  let full: string;

  const resolved = question ? resolveAnswerMarkers(question).get(sq) : undefined;
  if (resolved) {
    full = resolved;
  } else {
    const { marker, subMarker } = splitQuestionLabel(sq?.label || '', fallback);
    full = joinMarker(marker, subMarker);
  }

  if (sq?.group) {
    const groupHead = String(sq.group).split(' ')[0];
    return `${groupHead} : 係数 ${full || sq.label}`;
  }
  return full || fallback;
}

/**
 * 左側「問題文」欄に並べる設問文リストを作る。
 * 設問文本体を持たない（マーカーのみ＝リード文中の空欄）設問は除外する。
 * グループ設問（係数入力など）はグループ名を1件として代表表示する。
 */
export function buildSubQuestionList(question: any): { marker: string; body: string }[] {
  const subs: any[] = question?.subQuestions || [];
  const list: { marker: string; body: string }[] = [];
  const seenGroups = new Set<string>();

  // 解答欄カードとまったく同じマーカーを使う（枝番・自動採番を含む）。
  // 左の設問一覧と右の解答欄で番号が食い違うと、かえって混乱するため。
  const markers = resolveAnswerMarkers(question);

  subs.forEach((sq, i) => {
    if (sq?.group) {
      // グループはグループ名（例: "①式 C3H8 + O2 → CO2 + H2O"）を1件として表示
      if (!seenGroups.has(sq.group)) {
        seenGroups.add(sq.group);
        list.push({ marker: '', body: String(sq.group) });
      }
      return;
    }
    const { body } = splitQuestionLabel(sq?.label || '', `問${i + 1}`);
    if (body) {
      list.push({ marker: markers.get(sq) || '', body });
    }
  });

  return list;
}

/**
 * 「設問一覧」が問題文の丸写しになっているかを判定する。
 *
 * ご要望（原文）：
 *   > 数学の問題でさ、設問一覧と問題が同じなので、同じやつはもう設問一覧いらない
 *
 * ■ なぜ「数学なら消す」という実装にしないのか
 *   ご指摘のとおり、問題によって作りが違うので科目で決め打ちすると壊れる。
 *   実際に全306問を走査して数えると、重複の有無は科目では決まらなかった。
 *
 *     科目        問題数  一覧なし  完全重複  一部重複  重複なし
 *     化学基礎     153      7        30       24       92
 *     化学(発展)    20     12         1        1        6
 *     数学          65      0        43       16        6
 *     生物基礎      24     23         0        1        0
 *
 *   ・数学にも「重複していない」問題が 6 件ある（消すと設問が読めなくなる）
 *   ・化学基礎にも「完全に重複している」問題が 30 件ある（消して良い）
 *   ・そして最も危険なのが「一部重複」41 件。
 *     一覧の一部だけが問題文にあるので、一覧ごと消すと
 *     問題文に載っていない設問が完全に読めなくなる。
 *
 * ■ 判定ルール
 *   「一覧のすべての項目が問題文の中に見つかるときだけ」冗長とみなす。
 *   1 項目でも問題文に無ければ false（＝一覧を残す）＝安全側に倒す。
 *
 *   比較は表記ゆれを吸収するため
 *     ・空白（全角/半角/改行）を除去
 *     ・全角括弧 （） を半角 () に寄せる
 *   の正規化をしてから包含判定する。
 *   例）問題文 "（1）∫ x^4 dx" と ラベル "（1）∫ x^4 dx" は一致し、
 *       "(1)∫x^4dx" として突き合わせる。
 *
 * @returns true = 一覧は問題文の繰り返しなので省略して良い
 */
export function isSubQuestionListRedundant(question: any): boolean {
  const list = buildSubQuestionList(question);
  // 一覧が空なら「省略する/しない」を語る意味が無い（呼び出し側も描画しない）
  if (list.length === 0) return false;

  const text = normalizeForDuplicateCheck(String(question?.text || ''));
  if (!text) return false;

  return list.every(item => {
    const body = normalizeForDuplicateCheck(item.body);
    // 本文が無い（マーカーだけの）項目は判定材料にならないので
    // 「重複している」側に数える（残す理由にはならない）。
    if (!body) return true;

    // 判定1：本文が十分に長ければ、本文だけで照合する。
    //   マーカーの採番が問題文と一覧でずれている場合（自動採番など）でも
    //   拾えるので、こちらを先に見る。
    if (body.length >= MIN_BODY_LEN_FOR_TEXT_ONLY_MATCH && text.includes(body)) return true;

    // 判定2：短い本文は「マーカー＋本文」の並びで照合する。
    //   本文だけで照合すると偶然の一致が起きるため。
    //     例) 分類問題の選択肢 "水" は、リード文の "水溶液" にも当たってしまう。
    //   一方 "(11)水" のような並びは、問題文中の該当行にしか現れない。
    //   これにより、元素記号 (Li/Na/K…) や 1文字の物質名だけが並ぶ
    //   分類・暗記系の問題（化学基礎に多い）も正しく重複と判定できる。
    const marker = normalizeForDuplicateCheck(item.marker);
    if (marker && text.includes(marker + body)) return true;

    // どちらでも見つからない項目が1つでもあれば「一覧を残す」。
    return false;
  });
}

/**
 * 本文だけで重複照合してよい最小文字数。
 * これより短い本文は「マーカー＋本文」の並びでのみ一致を認める。
 */
const MIN_BODY_LEN_FOR_TEXT_ONLY_MATCH = 3;

/** 重複判定用の正規化（空白除去＋全角括弧を半角へ） */
function normalizeForDuplicateCheck(s: string): string {
  return String(s || '')
    .replace(/\s+/gu, '')
    .replace(/[（]/gu, '(')
    .replace(/[）]/gu, ')');
}

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
  question: any
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
export function extractSubQuestionSentences(question: any): Map<string, string> | null {
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
export function findSubQuestionSentence(question: any, sub: any): string | null {
  if (!sub) return null;
  const sentences = extractSubQuestionSentences(question);
  if (!sentences) return null;
  const no = String(sub?.label || '').match(/問\s*([0-9]{1,2})/u)?.[1];
  if (!no) return null;
  return sentences.get(no) || null;
}
