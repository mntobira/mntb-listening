/**
 * 設問番号（問1・(ア)・(1) …）の分解・解答カードの目印の割り当て・小問の一覧（C-13: questionDisplay.ts から分離）。
 *   questionDisplay.ts（丸数字・解答カードの目印）と questionRowExtractor.ts（本文の設問行の取り出し）の
 *   両方がここを使う。依存は questionDisplay → questionRowExtractor → questionLabel の一方向（循環なし）。
 *   中身は分離前と1文字も変えていない。questionDisplay.ts から全て re-export している。
 */
import type { ProblemLike, SubQuestionLike } from '../types/curriculum';

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
export function resolveAnswerMarkers(question: ProblemLike): Map<SubQuestionLike, string> {
  const subs: SubQuestionLike[] = question?.subQuestions || [];

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
  const out = new Map<SubQuestionLike, string>();
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
 * 左側「問題文」欄に並べる設問文リストを作る。
 * 設問文本体を持たない（マーカーのみ＝リード文中の空欄）設問は除外する。
 * グループ設問（係数入力など）はグループ名を1件として代表表示する。
 */
export function buildSubQuestionList(question: ProblemLike): { marker: string; body: string }[] {
  const subs: SubQuestionLike[] = question?.subQuestions || [];
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
