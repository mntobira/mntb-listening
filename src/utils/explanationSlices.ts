/**
 * ===================================================================
 * 整形済み解説の HTML コメント目印と、問・小問ごとの切り出し（C-11: explanationFormat.ts から分離）
 * ===================================================================
 *   <!--grp:N--> / <!--sq:id--> / <!--sqb:id--> などの目印の定義と、それを頼りに
 *   採点画面（Explanation.tsx）が「この小問の解説だけ」を取り出す関数。
 *   中身は分離前と1文字も変えていない。export はすべて explanationFormat.ts からも従来どおり取れる。
 */
/**
 * 問ごとのセクションに付ける「機械可読の目印」。
 *
 * 採点画面（Explanation.tsx）の小問アコーディオンは、この目印を頼りに
 * 「この小問が属する問の解説だけ」を切り出して表示する。
 * HTML コメントなので画面には一切出ない（textFormatter はコメントをそのまま通す）。
 */
export const GROUP_MARK = (key: string): string => `<!--grp:${key}-->`;

const GROUP_MARK_PATTERN = /<!--grp:([^-]*)-->/g;

/**
 * 小問（(ア)/(1)/① …）ごとのセクションに付ける目印。
 *
 * ■ なぜ「問N」用とは別の目印が要るのか（実測にもとづく設計判断）
 * 教材データの小問ラベルは「(ア)」「(1)」が主流で、「問N」形式は少数派だった。
 * そのため <!--grp:N--> だけでは全174問中15問（8.6%）にしか目印が付かず、
 * 「採点結果のアコーディオンを開いても解説が出てこない」状態が
 * 残り91%の問題で起きていた。
 *
 * ここでは小問 id をそのまま鍵にする。id は問題データ内で一意なので、
 * ラベルの表記ゆれ（全角/半角括弧など）に一切影響されずに結び付けられる。
 * HTML コメントなので画面には出ない。
 */
export const SQ_MARK = (id: string): string => `<!--sq:${id}-->`;

const SQ_MARK_PATTERN = /<!--sq:([^>]*?)-->/g;

/**
 * 小問セクションの「見出しの終わり／本文の始まり」を示す目印。
 *
 * ■ なぜ2つ目の目印が必要か
 * 全文まとめ読みでは「(ア) — テーマ ／ 答え」という見出しカードが要る。
 * しかし採点アコーディオンの中では、そのすぐ上のタブに同じ (ア) と正解が
 * すでに出ているので、見出しを再掲すると同じ情報が二重に並んでしまう（要件③）。
 * そこで「見出しはここまで」を機械的に示し、アコーディオン側はこの目印から後ろ
 * ＝［解法の思考手順］＋［詳しい解説］だけを取り出せるようにする。
 */
export const SQ_BODY_MARK = '<!--sqb-->';

/**
 * 「この大問のすべての小問に共通する解説」の始まりを示す目印。
 *
 * ■ なぜ必要か（要件⑤「1問を見ればその場で完結する」）
 * 大問全体に1本しかない思考手順や、全小問の前提になるリード文は、
 * 特定の小問に配り直すことができない。かといって共通部分だけ画面の別の場所に
 * 置いてしまうと、アコーディオンを開いた生徒はまた上へスクロールする羽目になる。
 * そこでこの目印から後ろ・最初の小問セクションまでを「共通部分」とし、
 * 画面側がどの小問のアコーディオンにも必ず添えて表示する。
 * 本文は複製されるだけで、1文字も削られない。
 */
export const SQ_SHARED_MARK = '<!--sqall-->';

export interface SubQuestionSlices {
  /** 全小問に共通する部分（解答一覧・リード文など） */
  common: string;
  /** どの小問のアコーディオンにも添える共通解説（無ければ空文字） */
  shared: string;
  /** 小問 id ごとの部分（見出しを含む・全文まとめ読み用） */
  subs: { id: string; text: string; body: string }[];
}

/**
 * 整形済み解説を「小問」単位に切り出す。目印が無ければ null。
 * 文字を書き換えずに切るだけなので、common + subs.text を連結すると元に戻る。
 */
export function sliceEnhancedBySubQuestion(text: string): SubQuestionSlices | null {
  const source = String(text || '');
  if (!source) return null;
  const marks: { index: number; id: string; length: number }[] = [];
  SQ_MARK_PATTERN.lastIndex = 0;
  let matched: RegExpExecArray | null;
  while ((matched = SQ_MARK_PATTERN.exec(source)) !== null) {
    marks.push({ index: matched.index, id: matched[1], length: matched[0].length });
  }
  if (marks.length === 0) return null;

  const common = source.slice(0, marks[0].index);

  // 共通解説（<!--sqall--> 〜 最初の小問セクション）を取り出す
  const sharedAt = common.indexOf(SQ_SHARED_MARK);
  const shared = sharedAt >= 0 ? common.slice(sharedAt + SQ_SHARED_MARK.length) : '';

  const subs = marks.map((mark, i) => {
    const text = source.slice(
      mark.index + mark.length,
      i + 1 < marks.length ? marks[i + 1].index : source.length,
    );
    // 見出しの後ろ（＝思考手順＋詳しい解説）だけを body として取り出す
    const bodyAt = text.indexOf(SQ_BODY_MARK);
    const body = bodyAt >= 0 ? text.slice(bodyAt + SQ_BODY_MARK.length) : text;
    return { id: mark.id, text, body };
  });

  return { common, shared, subs };
}

export interface EnhancedSlices {
  /** 全問に共通する部分（解答一覧・リード文・共通の思考手順など） */
  common: string;
  /** 問ごとの部分 */
  groups: { key: string; text: string }[];
}

/**
 * 整形済み解説を「問N」単位に切り出す。目印が無い（＝単一の問の大問）場合は null。
 * 文字を書き換えずに切るだけなので、common + groups を連結すると元に戻る。
 */
export function sliceEnhancedByQuestion(text: string): EnhancedSlices | null {
  const source = String(text || '');
  if (!source) return null;
  const marks: { index: number; key: string; length: number }[] = [];
  GROUP_MARK_PATTERN.lastIndex = 0;
  let matched: RegExpExecArray | null;
  while ((matched = GROUP_MARK_PATTERN.exec(source)) !== null) {
    marks.push({ index: matched.index, key: matched[1], length: matched[0].length });
  }
  if (marks.length === 0) return null;
  const common = source.slice(0, marks[0].index);
  const groups = marks.map((mark, i) => ({
    key: mark.key,
    text: source.slice(mark.index + mark.length, i + 1 < marks.length ? marks[i + 1].index : source.length),
  }));
  return { common, groups };
}
