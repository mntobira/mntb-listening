/**
 * HTML のタグをまたいだ数式の組版（C-12: mathTypeset.ts から分離）。
 *   解説の HTML 文字列を「タグ」「文字」に分け、タグをまたいで続く数式を1つにまとめて KaTeX で組む。
 *   中身は分離前と1文字も変えていない。mathTypeset.ts から re-export している。
 */
import { escapeHtml } from './sanitizeHtml';
import { scanChemRegions, toChemLatex, type MathRegion } from './mathChemTypeset';
import { renderLatex, toLatex, mayContainMath, scanMathRegions } from './mathTypesetCore';

// ===================================================================
// 4. すでに HTML になっている本文の中の数式を組み直す
// ===================================================================
//
// まとめプリント（src/data/learningContent/*.ts）は HTML 文字列で
// 書かれており、指数が <sup>n</sup>、添字が <sub>2</sub> になっている。
//   例: <li>(x<sup>n</sup>)' = nx<sup>n−1</sup>、(sin x)' = cos x</li>
// これは「本文の文字を小さくして上に寄せただけ」なので、
// 分数・∫・根号が混ざると途端に崩れる。
//
// そこで <sup>/<sub> を一旦 ^{…}/_{…} の記法に戻して数式領域を判定し、
// 数式と判定できた範囲だけ KaTeX で組み直す。
// 数式でなかった範囲は元の HTML をそのまま返す（化学式・英文は無変更）。

/** 数式化の対象にしてよいインラインタグ（中身が短いものだけ）。 */
const SCRIPT_TAG_RE = /^<(sup|sub)(?:\s[^>]*)?>([^<]{1,24})<\/\1>$/i;

/** HTML をタグ／テキストに分解する（sanitizeHtml と同じ考え方）。 */
const HTML_TOKEN_RE = /(<!--[\s\S]*?-->|<\/?[a-zA-Z][a-zA-Z0-9]*(?:"[^"]*"|'[^']*'|[^>"'])*>)/g;

/** HTML の実体参照を素のテキストへ戻す（数式判定のため）。 */
function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&minus;/gi, '-')
    .replace(/&times;/gi, '×')
    .replace(/&pi;/gi, 'π')
    .replace(/&infin;/gi, '∞')
    .replace(/&radic;/gi, '√')
    .replace(/&int;/gi, '∫')
    .replace(/&amp;/gi, '&');
}

/** 数式判定用の論理テキストと、元 HTML を保持する断片。 */
interface Atom {
  /** 数式判定に使う論理テキスト */
  text: string;
  /** 出力時に復元する元の HTML */
  html: string;
  /** テキストノードは境界で分割してよい */
  splittable: boolean;
}

/**
 * HTML 中の数式を KaTeX で組み直す。
 *
 * @param html  まとめプリント等の HTML 文字列
 */
export function typesetHtmlMath(html: string): string {
  if (!html) return '';
  // 数式の気配が無い HTML は触らない（大多数のケースを高速に素通し）。
  // <sup>/<sub> は数式化後に初めてトリガを満たす場合があるため、
  // 共通判定に加えてタグの存在も許可する。
  if (!mayContainMath(html) && !/<su[pb][\s>]/i.test(html)) return html;

  const tokens = html.split(HTML_TOKEN_RE).filter((t) => t !== undefined && t !== '');
  const out: string[] = [];
  let run: Atom[] = [];

  /**
   * 溜めた run（テキスト＋sup/sub）を、数式・化学式部分だけ KaTeX にして出力する。
   *
   * ★化学式もここで組む（ご要望「化学式とか反応式も全部ね」）★
   *   まとめプリントは
   *     <p>Zn ＋ 2HCl → ZnCl<sub>2</sub> ＋ H<sub>2</sub></p>
   *   のように書かれている。以前ここは scanMathRegions だけを掛けていた
   *   ため、∫ や √ を含まない化学式・反応式は 1 つも数式領域と判定されず、
   *   まとめプリントの化学だけが「HTML の <sub> を小さくしただけ」の
   *   見た目で取り残されていた（解説・問題は既に mhchem で組めていた）。
   *
   *   splitMathPieces（プレーンテキスト用）と同じ二段構えにする：
   *     ① まず数式領域を確定させる
   *     ② その「隙間」だけを化学式として調べる
   *   順序が逆だと、数式の中の英字（dx の x など）を化学式と誤認する。
   */
  const flushRun = () => {
    if (run.length === 0) return;

    const logical = run.map((a) => a.text).join('');
    const mathRegions = scanMathRegions(logical);

    // 数式に取られなかった範囲から化学式を探す
    const chemRegions: MathRegion[] = [];
    let scanFrom = 0;
    for (const r of [...mathRegions, { start: logical.length, end: logical.length, text: '' }]) {
      if (r.start > scanFrom) {
        const gap = logical.slice(scanFrom, r.start);
        for (const c of scanChemRegions(gap)) {
          chemRegions.push({ start: scanFrom + c.start, end: scanFrom + c.end, text: c.text });
        }
      }
      scanFrom = Math.max(scanFrom, r.end);
    }

    type MarkedRegion = MathRegion & { chem: boolean };
    const regions: MarkedRegion[] = [
      ...mathRegions.map((r) => ({ ...r, chem: false })),
      ...chemRegions.map((r) => ({ ...r, chem: true })),
    ].sort((a, b) => a.start - b.start);

    if (regions.length === 0) {
      out.push(run.map((a) => a.html).join(''));
      run = [];
      return;
    }

    // 論理テキスト上の位置 → atom のどこか、を辿れるように開始位置を持つ
    const starts: number[] = [];
    let pos = 0;
    for (const atom of run) {
      starts.push(pos);
      pos += atom.text.length;
    }

    /** 位置 p を含む atom の index */
    const atomAt = (p: number) => {
      for (let i = run.length - 1; i >= 0; i--) if (starts[i] <= p) return i;
      return 0;
    };

    let cursor = 0;
    const pieces: string[] = [];

    const emitPlain = (from: number, to: number) => {
      if (to <= from) return;
      let i = atomAt(from);
      while (i < run.length && starts[i] < to) {
        const atom = run[i];
        const atomStart = starts[i];
        const atomEnd = atomStart + atom.text.length;
        if (atom.splittable) {
          const s = Math.max(from, atomStart) - atomStart;
          const e = Math.min(to, atomEnd) - atomStart;
          // テキストノードは元 HTML と論理テキストの長さが実体参照でずれ得るため、
          // 部分切り出しは「元 HTML 全体」か「論理テキストの切片」を使い分ける。
          if (s === 0 && e === atom.text.length) pieces.push(atom.html);
          else pieces.push(escapeHtml(atom.text.slice(s, e)));
        } else if (atomStart >= from && atomEnd <= to) {
          pieces.push(atom.html);
        }
        i++;
      }
    };

    for (const region of regions) {
      // 直前の領域と重なってしまった場合は捨てる（安全側）
      if (region.start < cursor) continue;

      // 数式領域が sup/sub の atom を途中で跨ぐ場合は、その atom を丸ごと含める
      // （<sup>n</sup> は指数そのものなので数式側に入れるのが正しい）
      let start = region.start;
      let end = region.end;
      const first = atomAt(start);
      const last = atomAt(Math.max(start, end - 1));
      if (!run[first].splittable) start = starts[first];
      if (!run[last].splittable) end = starts[last] + run[last].text.length;
      if (start < cursor) start = cursor;
      if (end <= start) continue;

      const source = logical.slice(start, end);
      // 化学式は mhchem（\ce{…}）、数式は通常の LaTeX へ。
      const latex = region.chem ? toChemLatex(source) : toLatex(source);

      emitPlain(cursor, start);
      if (latex === null) {
        // atom を丸ごと含めた結果、化学式として組めなくなった場合は
        // 元の HTML をそのまま出す（勝手に壊さない）。
        emitPlain(start, end);
      } else {
        pieces.push(renderLatex(latex, { ariaLabel: source }));
      }
      cursor = end;
    }
    emitPlain(cursor, logical.length);

    out.push(pieces.join(''));
    run = [];
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // --- <sup>n</sup> / <sub>2</sub> は「開始タグ・中身・終了タグ」の3トークンで来る ---
    const scriptTag = /^<(sup|sub)(?:\s[^>]*)?>$/i.exec(token);
    if (scriptTag && tokens[i + 1] !== undefined && !tokens[i + 1].startsWith('<')) {
      const closing = tokens[i + 2];
      if (closing && new RegExp(`^</${scriptTag[1]}\\s*>$`, 'i').test(closing)) {
        const inner = decodeEntities(tokens[i + 1]);
        const combined = token + tokens[i + 1] + closing;
        if (SCRIPT_TAG_RE.test(combined.replace(/\n/g, ' '))) {
          run.push({
            text: scriptTag[1].toLowerCase() === 'sup' ? `^{${inner}}` : `_{${inner}}`,
            html: combined,
            splittable: false,
          });
          i += 2;
          continue;
        }
      }
    }

    // --- それ以外のタグは run の区切り ---
    if (token.startsWith('<')) {
      flushRun();
      out.push(token);
      continue;
    }

    // --- テキストノード ---
    run.push({ text: decodeEntities(token), html: token, splittable: true });
  }

  flushRun();
  return out.join('');
}
