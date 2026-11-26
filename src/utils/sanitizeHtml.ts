/**
 * ===================================================================
 * HTML サニタイザ（許可リスト方式）
 * ===================================================================
 *
 * ■ 何のために作ったか
 *   formatText()（src/utils/textFormatter.tsx）は化学式・添字・分数を
 *   きれいに見せるために HTML 文字列を組み立て、それを
 *   dangerouslySetInnerHTML でそのまま描画している。
 *
 *   ここに「ユーザーが入力した文字列」が流れ込む経路がある。
 *     src/components/Explanation.tsx の formatText(answers[sq.id] ...)
 *       → 記述問題の解答欄に生徒が打ち込んだ文字列
 *
 *   つまり入力に
 *     <img src=x onerror=alert(1)>
 *   と書くと、それが HTML として解釈されて JavaScript が動いてしまう
 *   （＝XSS）。今は自分の画面だけの被害（self-XSS）だが、解答を
 *   共有・同期する機能を足した瞬間に保存型XSSに化ける危険がある。
 *
 * ■ どう防ぐか（設計判断）
 *   「入力を先に全部エスケープする」方式は採らなかった。
 *   問題データ側が <u>…</u> や <br/>、整形エンジンの冪等マーカー
 *   <!--fmt-v1--> を意図的に HTML として書いているため、入力を
 *   エスケープすると本来の表示が壊れてしまう。
 *
 *   そこで「出来上がった HTML を、許可したタグ・属性だけに絞り込む」
 *   出口側のサニタイズにした。
 *     - 許可タグ以外は、タグだけ取り除いて中身のテキストは残す
 *     - <script> など中身自体が危険なものは中身ごと捨てる
 *     - 属性は class / style だけ。on* 系（onerror, onload…）は
 *       許可リストに無いので構造的に通らない
 *     - href / src を許可しないので javascript: スキームも入らない
 *
 * ■ 依存を足していない理由
 *   DOMPurify を入れれば済むが、
 *     - このアプリはブラウザにも Node（テスト）にも載る
 *     - 扱うのはインライン要素だけで、必要な機能はごく一部
 *   なので、監査しやすい小さな実装を自前で持つ方を選んだ。
 *   正規表現ベースだが「許可リストで組み立て直す」方式なので、
 *   未知のタグ・属性は自動的に落ちる（fail-safe）。
 */

/** 描画を許可するタグ。副作用（リソース読み込み・スクリプト実行）を持たないものだけ。 */
const ALLOWED_TAGS = new Set([
  'span', 'sub', 'sup', 'mark', 'br', 'wbr',
  'b', 'strong', 'i', 'em', 'u', 's', 'small', 'code',
  'p', 'div', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr',
  'details', 'summary', 'figure', 'figcaption', 'blockquote', 'pre',
  // 数式（KaTeX）の描画に必要な最小限の図形要素。
  // 根号の斜線、\left( の伸びる括弧、→ の矢印などは
  // フォントの文字ではなく <svg><path d="…"/></svg> で描かれるため、
  // これを落とすと「√ の記号だけ消える」「括弧が伸びない」という
  // 目に見える欠落になる。下の SVG_TAG_ATTRS で属性を厳しく絞る。
  'svg', 'path',
]);

/**
 * 許可する属性。
 * class は Tailwind のクラスを載せるために必須。
 * style は分数や添字の微調整（font-family / vertical-align など）に使う。
 * href / src / srcset を許可していないのが重要
 *   → javascript: スキームや外部リソース読み込みが構造的に入らない。
 * on* 系（onerror / onload / onclick …）も当然ここに無い。
 */
const ALLOWED_ATTRS = new Set([
  'class', 'style', 'colspan', 'rowspan', 'open', 'aria-hidden', 'scope',
  // KaTeX で組んだ数式は視覚表現を aria-hidden にするため、
  // 読み上げ用のテキストを aria-label で持たせる（値は文字列のみで副作用なし）。
  'aria-label',
]);

/**
 * SVG 要素だけに許す属性（タグごとの個別許可リスト）。
 *
 * ★SVG は全体を許可してはいけない★
 *   <svg> の中には <script>, <foreignObject>, <use href="…">, <animate> など
 *   スクリプト実行や外部参照が可能な要素がある。そこで
 *     - 通す要素は <svg> と <path> の 2 つだけ（ALLOWED_TAGS）
 *     - 属性も「図形の寸法とパス形状」に関わるものだけ
 *   に限定する。d / viewBox / width / height はいずれも
 *   数値と記号の文字列で、URL もスクリプトも表現できない。
 *   href/xlink:href を許可していないのが要点（外部参照が入らない）。
 */
const SVG_TAG_ATTRS: Record<string, Set<string>> = {
  svg: new Set(['class', 'style', 'width', 'height', 'viewbox', 'preserveaspectratio', 'xmlns', 'aria-hidden']),
  path: new Set(['class', 'd']),
};

/** タグだけでなく中身ごと捨てるタグ（中のテキストを見せる意味がない／危険）。 */
const DROP_WITH_CONTENT = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'template', 'noscript',
  'math', 'frame', 'frameset', 'applet', 'audio', 'video', 'canvas',
  'form', 'select', 'textarea', 'button', 'option',
  // SVG の中で危険になり得る要素は中身ごと捨てる。
  // <svg>/<path> 自体は数式描画のため許可しているので、
  // 「許可した器の中に危険物が入る」経路をここで閉じる。
  'foreignobject', 'animate', 'animatetransform', 'animatemotion', 'set',
  'use', 'image', 'handler', 'listener', 'discard',
]);

/**
 * SVG 属性の正しい大文字小文字。
 *
 * HTML の属性名は小文字化して扱うが、SVG の `viewBox` などは
 * キャメルケースでないと効かない（HTML パーサ側にも補正表はあるが、
 * 文字列として組み立て直す我々が正しい形で出す方が確実）。
 */
const SVG_ATTR_CANONICAL: Record<string, string> = {
  viewbox: 'viewBox',
  preserveaspectratio: 'preserveAspectRatio',
};

/**
 * 温存を許すHTMLコメントの形。
 *
 * 整形エンジンの冪等マーカー（<!--fmt-v1-->）だけを通したいので、
 * 「英数字・ハイフン・アンダースコア・コロン・ドットのみの短い文字列」に限定する。
 *
 * ★なぜコメントを丸ごと通さないのか★
 *   コメントは「中身が描画されない」ので一見安全だが、
 *     <!--><img src=x onerror=alert(1)>-->
 *   のように壊れたコメントを書くと、ブラウザによって
 *   コメントの終端の解釈が分かれ、中身がタグとして復活し得る。
 *   許可リスト方式を貫き、想定した形以外のコメントは捨てる。
 */
const SAFE_COMMENT_BODY = /^[A-Za-z0-9_:.-]{1,64}$/;

/** style 属性の値に含まれていたら危険と判断するパターン。 */
const DANGEROUS_STYLE =
  /(?:\\|expression\s*\(|url\s*\(|image-set\s*\(|javascript\s*:|vbscript\s*:|data\s*:|@import|behaviou?r\s*:|-moz-binding|(?:^|;)\s*--)/i;

/** SVG 属性ごとの安全な値の形式（スクリプト・外部URL・不正文字を遮断） */
const SAFE_SVG_ATTR_VALUES: Record<string, RegExp> = {
  d: /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,+\-\s]{1,8192}$/,
  viewbox: /^[-+0-9.eE\s,]{1,80}$/,
  width: /^[0-9.]+(?:px|em|ex|%|pt|pc|cm|mm|in|rem)?$/,
  height: /^[0-9.]+(?:px|em|ex|%|pt|pc|cm|mm|in|rem)?$/,
  preserveaspectratio: /^[A-Za-z0-9\s]{1,32}$/,
  xmlns: /^http:\/\/www\.w3\.org\/2000\/svg$/,
};

/** タグ / コメント / それ以外のテキストに切り分けるための正規表現。 */
const TOKEN_RE = /(<!--[\s\S]*?-->|<\/?[a-zA-Z][a-zA-Z0-9]*(?:"[^"]*"|'[^']*'|[^>"'])*>?)/g;

/** タグ文字列から属性を1つずつ取り出す。値なし属性（open など）にも対応。 */
const ATTR_RE =
  /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+)))?/g;

/** 「すでに正しい実体参照」を二重エスケープしないための否定先読み。 */
const KEEP_ENTITY = /&(?!#\d{1,7};|#[xX][0-9a-fA-F]{1,6};|[a-zA-Z][a-zA-Z0-9]{1,31};)/g;

/**
 * テキストノードをエスケープする。
 * `<` `>` は必ず実体参照にして、タグとして解釈される余地を消す。
 * `&` は「すでに正しい実体参照の一部」なら二重エスケープしない
 * （問題データに &nbsp; などが書かれていても表示が壊れないようにするため）。
 */
function escapeTextNode(text: string): string {
  return text
    .replace(KEEP_ENTITY, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * 生テキストを HTML の中にそのまま置くための、最小のエスケープ。
 *
 * ■ 使う場面
 *   「HTML ではない文字列」を innerHTML 用の文字列に埋め込む直前。
 *   例）リスニングの SCRIPT 枠に英文をそのまま入れる（listeningExplanation.ts）
 *       KaTeX が失敗したときに元の式をそのまま出す（mathTypeset.ts）
 *
 * ■ ★ 上の escapeTextNode とは別物。まとめてはいけない ★
 *   escapeTextNode は KEEP_ENTITY を使い「すでに正しい実体参照
 *   （&nbsp; や &amp; など）は二重エスケープしない」というふるまい。
 *   一方こちらは & を必ずエスケープする。
 *     'a &nbsp; b' → escapeTextNode : 'a &nbsp; b'      （実体参照として通す）
 *                  → escapeHtml     : 'a &amp;nbsp; b'  （文字として見せる）
 *
 *   使い分けの理由：
 *     ・escapeTextNode が扱うのは「HTML を含み得る問題データ」なので、
 *       中に書かれた &nbsp; は実体参照として機能してほしい。
 *     ・escapeHtml が扱うのは「HTML ではない生テキスト」なので、
 *       & は & という文字として見えなければならない。
 *   ここを1つにすると、どちらかの表示が必ず壊れる。
 *   （tests/sanitizeHtml.test.ts でこの差を固定してある）
 *
 * ■ 変えると壊れる点
 *   & を最初に置換すること。順序を変えると、後から作った &lt; の & が
 *   もう一度エスケープされて &amp;lt; になり、画面に &lt; と出てしまう。
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/\u0000/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** 属性を許可リストで絞り込み、安全なタグ文字列を組み立て直す。 */
function sanitizeTag(rawTag: string, tagName: string, isClosing: boolean): string {
  if (isClosing) return `</${tagName}>`;

  // タグ名と `>` の間（＝属性部分）だけを取り出す
  const attrSource = rawTag
    .replace(/^<\s*[a-zA-Z][a-zA-Z0-9]*/, '')
    .replace(/\/?>?$/, '');

  // SVG（数式の根号・伸びる括弧）はタグごとの厳しい許可リストを使う
  const svgAttrs = SVG_TAG_ATTRS[tagName];

  const kept: string[] = [];
  ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ATTR_RE.exec(attrSource)) !== null) {
    const name = m[1].toLowerCase();
    if (svgAttrs ? !svgAttrs.has(name) : !ALLOWED_ATTRS.has(name)) continue;

    // viewBox などは大文字小文字が意味を持つので正しい形に戻す
    const outName = svgAttrs ? (SVG_ATTR_CANONICAL[name] ?? name) : name;

    const rawValue = m[2] ?? m[3] ?? m[4];
    if (rawValue === undefined) {
      // 値なし属性（<details open> など）
      kept.push(outName);
      continue;
    }

    if (name === 'style' && DANGEROUS_STYLE.test(rawValue)) continue;
    if (svgAttrs && SAFE_SVG_ATTR_VALUES[name] && !SAFE_SVG_ATTR_VALUES[name]!.test(rawValue.trim())) continue;
    if ((name === 'colspan' || name === 'rowspan') && !/^[1-9][0-9]{0,2}$/.test(rawValue.trim())) continue;
    if (name === 'aria-hidden' && rawValue !== 'true' && rawValue !== 'false') continue;
    if (name === 'scope' && !/^(?:row|col|rowgroup|colgroup)$/.test(rawValue.trim())) continue;

    // 値の中の引用符・山かっこはエスケープしてタグを閉じられないようにする
    const value = rawValue
      .replace(KEEP_ENTITY, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    kept.push(`${outName}="${value}"`);
  }

  const selfClosing =
    /\/>$/.test(rawTag) || tagName === 'br' || tagName === 'hr' || tagName === 'wbr';
  const attrs = kept.length > 0 ? ` ${kept.join(' ')}` : '';
  return selfClosing ? `<${tagName}${attrs} />` : `<${tagName}${attrs}>`;
}

/**
 * HTML 文字列を「許可したタグ・属性だけ」に絞り込む。
 *
 * - 許可タグ以外 … タグを取り除き、中身のテキストは残す（情報を失わない）
 * - DROP_WITH_CONTENT のタグ … 閉じタグまで中身ごと捨てる
 * - コメント … 内容から `<`/`>` を落として温存する
 *   （整形エンジンの冪等マーカー <!--fmt-v1--> を壊さないため）
 */
export function sanitizeInlineHtml(html: string): string {
  if (!html) return '';

  const tokens = html.replace(/\u0000/g, '').split(TOKEN_RE);
  const out: string[] = [];
  /** 中身ごと破棄中のタグ名（ネストを数えるためスタックで持つ） */
  const dropStack: string[] = [];

  for (const token of tokens) {
    if (!token) continue;

    // --- HTML コメント ---
    if (token.startsWith('<!--')) {
      if (dropStack.length > 0) continue;
      // 想定した形（冪等マーカー等）だけ温存し、それ以外のコメントは捨てる。
      // 「捨てる」判断でよいのは、表示に必要な情報がコメントに入らない設計だから。
      const body = token.slice(4, -3);
      if (SAFE_COMMENT_BODY.test(body)) out.push(`<!--${body}-->`);
      continue;
    }

    const tagMatch = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)/.exec(token);

    // --- タグではない（＝テキスト） ---
    if (!tagMatch) {
      if (dropStack.length > 0) continue;
      out.push(escapeTextNode(token));
      continue;
    }

    const isClosing = tagMatch[1] === '/';
    const tagName = tagMatch[2].toLowerCase();
    const isSelfClosing = !isClosing && /\/\s*>\s*$/.test(token);

    // --- 中身ごと破棄中 ---
    if (dropStack.length > 0) {
      if (isClosing && dropStack[dropStack.length - 1] === tagName) dropStack.pop();
      else if (!isClosing && !isSelfClosing && DROP_WITH_CONTENT.has(tagName)) dropStack.push(tagName);
      continue;
    }

    // --- 中身ごと捨てるタグの開始（自己終了 <animate .../> は後続要素を巻き込まず単体破棄） ---
    if (!isClosing && DROP_WITH_CONTENT.has(tagName)) {
      if (!isSelfClosing) dropStack.push(tagName);
      continue;
    }
    // 対応する開始タグが無い閉じタグは単に無視する
    if (isClosing && DROP_WITH_CONTENT.has(tagName)) continue;

    // --- 許可していないタグ（<img> など）はタグだけ落とす ---
    if (!ALLOWED_TAGS.has(tagName)) continue;

    out.push(sanitizeTag(token, tagName, isClosing));
  }

  return out.join('');
}

/**
 * HTML からプレーンテキストだけを取り出す。
 *
 * ■ なぜ専用の関数が必要か
 *   以前は各コンポーネントが
 *     const tmp = document.createElement('div');
 *     tmp.innerHTML = html;
 *     return tmp.textContent;
 *   としていた。<script> は実行されないものの、
 *   `<img src=x onerror=...>` は解析時に読み込みが始まり
 *   ブラウザによっては onerror が発火する。
 *   「テキストが欲しいだけ」なのに HTML を評価するのは筋が悪い。
 *
 *   この実装は DOM を一切作らず、文字列処理だけで完結する。
 *   ブラウザにも Node（テスト・ビルド時）にも同じ結果を返す。
 */
export function stripHtmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/\u0000/g, '')
    // コメントを除去
    .replace(/<!--[\s\S]*?-->/g, '')
    // 中身を見せたくない要素は中身ごと除去
    .replace(
      /<(script|style|iframe|object|embed|template|noscript|svg|math)\b[\s\S]*?<\/\1\s*>/gi,
      ' ',
    )
    // 閉じ忘れた危険タグは開始位置以降を落とす
    .replace(/<(script|style)\b[\s\S]*$/gi, ' ')
    // 改行になるタグは空白に置き換えて単語が繋がるのを防ぐ
    .replace(/<(?:br|hr)\s*\/?>/gi, ' ')
    .replace(/<\/(?:p|div|li|tr|h[1-6]|blockquote|figcaption|summary)\s*>/gi, ' ')
    // 残りのタグを除去
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    // 未閉鎖のタグ（`<div class="` で切れている等）も落とす
    .replace(/<[^>]*$/g, '')
    // 実体参照を戻す
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    // 空白を整える
    .replace(/\s+/g, ' ')
    .trim();
}

/** 検証・テスト用に許可リストを公開する（実装と期待値が乖離しないようにするため）。 */
export const SANITIZER_ALLOWLIST = {
  tags: ALLOWED_TAGS,
  attrs: ALLOWED_ATTRS,
  dropWithContent: DROP_WITH_CONTENT,
} as const;
