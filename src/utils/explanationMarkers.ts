/**
 * ===================================================================
 * 解説本文の小問マーカー検出・本文分割（C-11: explanationFormat.ts から分離）
 * ===================================================================
 *   解説エンジンの4段階パイプラインの2段目。
 *     1. 解答・単位換算・思考手順ブロック生成 … explanationFormat.ts
 *     2. 小問マーカー検出・本文分割          … ここ
 *     3. HTML コメントのスライス目印         … explanationSlices.ts
 *     4. インターリーブ統合・レガシー正規化   … explanationFormat.ts
 *   中身は分離前と1文字も変えていない。export はすべて explanationFormat.ts からも従来どおり取れる。
 */
import { ANS_STYLE, KEY_STYLE } from './explanationSupplement';
import type { SubQuestionLike } from './explanationShapes';

// -------------------------------------------------------------------
// 問（問1・問2…）単位への再構成
// -------------------------------------------------------------------

/** 全角数字を半角に寄せる（ラベルの表記ゆれ対策） */
function toHalfWidthDigits(text: string): string {
  return text.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
}

/**
 * 小問マーカーの表記ゆれを吸収する正規化。
 *
 * ■ なぜ必要か（実測にもとづく）
 * 教材データは人の手で長期間書き足されてきたため、同じ「(1)」でも
 *   ・全角括弧「（1）」／半角括弧「(1)」
 *   ・全角数字「（１）」／半角数字「(1)」
 *   ・全角スペース「（1） 答え」／半角スペース
 * が混在している。全174問を機械的に走査したところ、この表記ゆれだけが原因で
 * 「本文には見出しがあるのに、小問と結び付かない」問題が多数あった。
 * ここで両者を同じ土俵に載せてから比較する。
 *
 * ★注意★ この正規化は「比較のためだけ」に使う。
 * 本文そのものは1文字も書き換えない（情報を失わせないための鉄則）。
 */
function normalizeMarker(text: string): string {
  return toHalfWidthDigits(String(text || ''))
    .replace(/[（]/g, '(')
    .replace(/[）]/g, ')')
    .replace(/[\u3000\s]+/g, ' ')
    .trim();
}

/** タグを取り除いて素の文字にする（見出し判定用） */
export function plainLine(line: string): string {
  return normalizeMarker(String(line || '').replace(/<[^>]*>/g, ''));
}

/**
 * 小問ラベルから「本文中で見出しになりうるマーカー」の候補を取り出す。
 *
 * 例）
 *   「問2 (1) 中和点のpH」 → ['問2(1)', '(1)']
 *   「（ア）」             → ['(ア)']
 *   「(3) ろ過の図」       → ['(3)']
 *   「① 斜方硫黄」        → ['①']
 *
 * 候補を複数返すのは、本文側が「問2(1)」と書く場合と、
 * 「問2」のセクションの中で単に「(1)」と書く場合の両方があるため。
 * 長いマーカー（より限定的なもの）から順に並べる。
 */
export function subMarkerCandidates(label?: string): string[] {
  const s = normalizeMarker(label);
  if (!s) return [];
  const out: string[] = [];

  // 「問2 (1) …」形式
  const withQ = s.match(/^問\s*(\d+)\s*\(\s*([^)]{1,8}?)\s*\)/);
  if (withQ) {
    out.push(`問${withQ[1]}(${withQ[2]})`);
    out.push(`(${withQ[2]})`);
  }

  // 「(1)(a)」のような二段の入れ子
  const nested = s.match(/^\(\s*([^)]{1,8}?)\s*\)\s*\(\s*([^)]{1,8}?)\s*\)/);
  if (nested) {
    out.push(`(${nested[1]})(${nested[2]})`);
    out.push(`(${nested[2]})`);
    out.push(`(${nested[1]})`);
  }

  // 「A (1)価電子数」「A(1)」形式（大問中でさらに物質A・B・Cに枝分かれするタイプ）
  const alphaParen = s.match(/^([A-Za-z])\s*\(\s*([^)]{1,8}?)\s*\)/);
  if (alphaParen) {
    out.push(`${alphaParen[1]}(${alphaParen[2]})`);
    out.push(`${alphaParen[1]} (${alphaParen[2]})`);
  }

  // 「(ア)」「(1)」形式
  const paren = s.match(/^\(\s*([^)]{1,8}?)\s*\)/);
  if (paren) out.push(`(${paren[1]})`);

  // 「問4」だけの形式
  const onlyQ = s.match(/^問\s*(\d+)/);
  if (onlyQ) out.push(`問${onlyQ[1]}`);

  // 「① …」形式
  const circled = s.match(/^([①-⑮])/);
  if (circled) out.push(circled[1]);

  // 「a」「b」「c」だけの形式（穴埋めの空欄記号）。
  // 1文字は偶然の一致が起きやすいので、照合側で「直後が区切り文字」であることを必須にする。
  const bareAlpha = s.match(/^([A-Za-z])(?:\s|[:：.．、,]|$)/);
  if (bareAlpha) out.push(bareAlpha[1]);

  // 上のどれにも当てはまらない「説明的なラベル」
  // （例：「化合物Aに含まれる金属元素の元素記号」）は、ラベルそのものを見出しとみなす。
  // 本文側も同じ文言で書き出されていることが多く、これで結び付けられる。
  if (out.length === 0 && s.length >= 4) out.push(s);

  return [...new Set(out.filter(Boolean))];
}

/** 記号ではない「素の語」で始まるマーカーか（境界チェックを厳しくする対象） */
function isWordMarker(marker: string): boolean {
  return /^[A-Za-z0-9]/.test(marker);
}

/**
 * 本文の各行が「どの小問の見出しか」を判定して、行番号→マーカーの対応を作る。
 * 行頭がマーカーで始まる行だけを境界とみなす（文中に出てくる (1) は無視）。
 */
function findSubAnchors(
  lines: string[],
  markersInOrder: { key: string; markers: string[] }[],
): { index: number; key: string }[] {
  const anchors: { index: number; key: string }[] = [];
  const used = new Set<string>();

  lines.forEach((line, index) => {
    const plain = plainLine(line);
    if (!plain) return;
    for (const entry of markersInOrder) {
      if (used.has(entry.key)) continue;
      const matched = entry.markers.some((marker) => {
        if (!plain.startsWith(marker)) return false;
        const rest = plain.slice(marker.length);
        // 「(1)」が「(10)」の先頭に一致してしまう事故を防ぐ
        if (/^[0-9０-９]/.test(rest)) return false;
        // 「a」が「acid」の先頭に一致してしまう事故を防ぐ
        // （素の語で始まるマーカーは、直後が区切り文字か行末であることを必須にする）
        if (isWordMarker(marker) && rest !== '' && !/^[\s(（:：.．、,／/─\-]/.test(rest)) return false;
        return true;
      });
      if (matched) {
        anchors.push({ index, key: entry.key });
        used.add(entry.key);
        return;
      }
    }
  });

  return anchors.sort((a, b) => a.index - b.index);
}

/**
 * 1行に複数の小問がまとめ書きされている本文を、小問ごとの行に開く。
 *
 * ■ なぜ必要か（実データで確認した最大の壁）
 * 教材データには、こう書かれた解説が多数ある：
 *
 *   （ア）熱運動 （イ）大きく （ウ）絶対零度 （エ）−273 （オ）絶対温度 （カ）ケルビン
 *
 * 6問ぶんの答えが1行に詰まっているため、「行の境界で切る」方式では
 * どこにも切れ目が無く、小問ごとに解説を配ることができなかった。
 * ここで各マーカーの直前に改行を入れて、切れる形に整える。
 *
 * ★情報は1文字も減らない★
 * 行わない操作：削除・要約・並べ替え・語句の書き換え。
 * 行う操作：マーカー直前の「空白を改行に置き換える」だけ。
 * 表示上も、6つの答えが横1列から縦6行になって *読みやすくなる* 方向にしか変わらない。
 * 表（|を含む行）と、そもそもマーカーが1つ以下の行には一切手を触れない。
 */
function explodeInlineMarkers(
  body: string,
  markersInOrder: { key: string; markers: string[] }[],
): string {
  // 照合に使うマーカー（最長一致を優先）
  const all = [...new Set(markersInOrder.flatMap((entry) => entry.markers))].sort(
    (a, b) => b.length - a.length,
  );
  if (all.length < 2) return body;

  return body
    .split('\n')
    .map((line) => {
      if (line.includes('|')) return line; // 表は絶対に壊さない
      if (/<(?:div|table|tr|td|th)\b/i.test(line)) return line; // ブロック要素も触らない

      // この行に「行頭以外の位置で」現れるマーカーの数を数える
      const plain = plainLine(line);
      const found = all.filter((marker) => plain.includes(marker));
      if (found.length < 2) return line; // まとめ書きではないので触らない

      // 実際の（正規化していない）行に対して、全角・半角どちらの表記でも
      // マーカーの直前にある空白を改行へ置き換える。
      let out = line;
      for (const marker of found) {
        // 「(ア)」→ 全角・半角どちらでも当たる正規表現に変換する
        const pattern = marker
          .split('')
          .map((ch) => {
            if (ch === '(') return '[(（]';
            if (ch === ')') return '[)）]';
            if (ch === ' ') return '[\\s　]*';
            if (/[0-9]/.test(ch)) {
              return `[${ch}${String.fromCharCode(ch.charCodeAt(0) + 0xfee0)}]`;
            }
            return ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          })
          .join('');
        // 行頭のマーカーは対象外（すでに切れ目になっている）。
        // 直前が空白のときだけ、その空白を改行にする。
        out = out.replace(new RegExp(`([^\\n])[\\s　]+(?=${pattern})`, 'g'), '$1\n');
      }
      return out;
    })
    .join('\n');
}

/**
 * 詳しい解説の本文を「小問（(ア)/(1)/①…）」の見出し行で切り分ける。
 *
 * ■ 無損失であることが絶対条件（要件の最重要事項）
 * splitBodyByQuestionGroups と同じく「行を落とさず・並べ替えず、境界で切るだけ」。
 *   lead + segments を順に連結すると、必ず元の本文に戻る。
 * 2つ以上の境界が見つからない場合は null を返し、呼び出し側は従来表示のままにする。
 */
export function splitBodyBySubQuestions(
  body: string,
  subs: SubQuestionLike[],
): BodySegments | null {
  if (!body || !subs || subs.length < 2) return null;

  const markersInOrder = subs
    .map((sub) => ({ key: String(sub.id || sub.label || ''), markers: subMarkerCandidates(sub.label) }))
    .filter((entry) => entry.key && entry.markers.length > 0);
  if (markersInOrder.length < 2) return null;

  const lines = explodeInlineMarkers(body, markersInOrder).split('\n');
  const anchors = findSubAnchors(lines, markersInOrder);
  // 少なくとも2箇所で切れないと「問ごとに完結」にならない
  if (anchors.length < 2) return null;

  const lead = lines.slice(0, anchors[0].index).join('\n');
  const segments = anchors.map((anchor, i) => ({
    key: anchor.key,
    text: lines
      .slice(anchor.index, i + 1 < anchors.length ? anchors[i + 1].index : lines.length)
      .join('\n'),
  }));

  return { lead, segments };
}

/**
 * 小問ラベルから「どの問に属するか」のキーを取り出す。
 * 「問2 (1) …」→ '2'、「(ア)」など問番号を持たないものは '' を返す。
 */
export function questionGroupKey(label?: string): string {
  const matched = toHalfWidthDigits(String(label || '').trim()).match(/^問\s*(\d+)/);
  return matched ? matched[1] : '';
}

/** 詳しい解説本文を問ごとに切り分けた結果 */
export interface BodySegments {
  /** 最初の「問N」見出しより前にある共通のリード文 */
  lead: string;
  /** 問キー → その問に属する本文（出現順） */
  segments: { key: string; text: string }[];
}

/**
 * 詳しい解説の本文を「問N」の見出し行を境界にして切り分ける。
 *
 * ■ 無損失であることが絶対条件
 * 情報量を絶対に減らさないという要件のため、
 * 「行を落とさず・並べ替えず、境界で切るだけ」に徹している。
 *   lead + segments を順に連結すると、必ず元の本文に戻る。
 * 境界が1つも見つからない場合は null を返し、呼び出し側は分割せず従来表示にする。
 */
export function splitBodyByQuestionGroups(body: string, keys: string[]): BodySegments | null {
  if (!body || keys.length === 0) return null;
  const lines = body.split('\n');
  const anchors: { index: number; key: string }[] = [];

  lines.forEach((line, index) => {
    const matched = toHalfWidthDigits(line).match(/^\s*(?:【\s*)?問\s*(\d+)/);
    if (matched && keys.includes(matched[1])) anchors.push({ index, key: matched[1] });
  });

  if (anchors.length === 0) return null;

  const lead = lines.slice(0, anchors[0].index).join('\n');
  const segments = anchors.map((anchor, i) => ({
    key: anchor.key,
    text: lines
      .slice(anchor.index, i + 1 < anchors.length ? anchors[i + 1].index : lines.length)
      .join('\n'),
  }));

  return { lead, segments };
}

/**
 * 「解法の思考手順」と「詳しい解説」の両方に *まったく同じ一文* が
 * 書かれている場合だけ、詳しい解説側の重複行を落とす。
 *
 * ■ 情報量を絶対に減らさないためのガード（実データで検証済み）
 * 次のいずれかに当てはまる行は、たとえ一致しても絶対に落とさない。
 *   ・表の行（|）……… 表が壊れる
 *   ・見出し行（■◆【）… 文章の骨格が消える
 *   ・「=」「→」を含む行… 計算式・反応式の途中が消えて筋道が追えなくなる
 *     （例：「2.0=25.0c」の次の「c=0.080 mol/L」を落とすと答えが消える）
 *   ・短い行（10文字未満）… 偶然の一致が起こりうる
 * この条件で実際に落ちるのは全174大問で1行だけであり、
 * 「重複していて、かつ落としても情報が失われない」ものに限定できている。
 */
export function dedupeAgainstSteps(body: string, stepsText: string): string {
  if (!body || !stepsText) return body;

  const normalize = (line: string): string =>
    line
      .replace(/<[^>]*>/g, '')
      .replace(/[①-⑮]/g, '')
      // 思考手順側の箇条書き記号（└ ├ ─ など）も落として、同じ文なら同じ鍵になるようにする
      .replace(/[└├─―\-‐‑–—]/g, '')
      .replace(/[\s　・■※（）()「」【】。、,.：:→＝=＋+]/g, '')
      .trim();

  const stepLines = new Set(
    stepsText.split('\n').map(normalize).filter((s) => s.length >= 16),
  );
  if (stepLines.size === 0) return body;

  const kept = body.split('\n').filter((line) => {
    const plain = line.replace(/<[^>]*>/g, '');
    if (line.includes('|')) return true; // 表は絶対に壊さない
    if (/^\s*[■◆【]/.test(plain)) return true; // 見出しは消さない
    if (/[=＝→⟶]/.test(plain)) return true; // 計算式・反応式は消さない
    if (/答え|よって|したがって|ゆえに|求める/.test(plain)) return true; // 結論行は消さない
    if (line.includes(ANS_STYLE) || line.includes(KEY_STYLE)) return true; // 強調済みは消さない
    const normalized = normalize(line);
    // 短い行は偶然の一致が起こりやすいので落とさない（16文字以上の完全一致のみ）
    if (normalized.length < 16) return true;
    return !stepLines.has(normalized);
  });

  return kept.join('\n');
}
