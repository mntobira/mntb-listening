/**
 * ===================================================================
 * 英文解釈：英文と和訳を「1文ずつ」組にする（2026-10-30 E10）
 * ===================================================================
 * ご要望：全訳をまとめて出すのではなく「英文→和訳→英文→和訳」と交互に。構文把握の観点も入れる。
 *
 * ■ 組にするしかた
 *   和訳は段落ごとにしか持っていないので、英文・和訳をそれぞれ文に分け、長さの比で対応を決める。
 *   1対1 だけでなく、英文1文＝和訳2文（コロンの後ろを訳で別の文にした等）、英文2文＝和訳1文 も許す
 *   （Gale–Church 法の簡易版：長さの比が全体の比に近い組み合わせを選ぶ）。
 *   それでも決められないとき（どちらかが空・文が多すぎる）は、段落まるごとを1組にする（訳が欠けない安全側）。
 *
 * ■ 構文のヒント（structureHints）
 *   はっきり形で分かるものだけを拾う（関係代名詞の非制限用法・so ~ that・not A but B・比較級＋than any など）。
 *   当て推量で品詞を決めない。拾えなかった文には何も付けない。
 */

/** 英文を文に分ける。引用符の中では区切らない。Mr. などの略語で切らない */
export function splitEnSentences(text: string): string[] {
  const s = text.trim().replace(/\s+/g, ' ');
  const out: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    cur += c;
    if (c === '"') inQuote = !inQuote;
    else if (c === '“') inQuote = true;
    else if (c === '”') inQuote = false;
    if (!/[.!?]/.test(c)) continue;
    // 引用符・かっこが続くなら、それも同じ文に入れる
    while (i + 1 < s.length && /["”’)]/.test(s[i + 1])) {
      const q = s[++i];
      cur += q;
      if (q === '"') inQuote = !inQuote;
      if (q === '”') inQuote = false;
    }
    if (inQuote) continue;
    if (/\b(Mr|Mrs|Ms|Dr|St|vs|etc|e\.g|i\.e)\.$/i.test(cur)) continue;
    const next = s.slice(i + 1);
    if (next.trim() === '' || /^\s+["“(]?[A-Z0-9]/.test(next)) { out.push(cur.trim()); cur = ''; }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** 和訳を文に分ける。かぎかっこ・丸かっこの中では区切らない */
export function splitJaSentences(text: string): string[] {
  const out: string[] = [];
  let cur = '';
  let depth = 0;
  const chars = [...text.trim()];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    cur += c;
    if ('「『（'.includes(c)) depth += 1;
    else if ('」』）'.includes(c)) depth = Math.max(0, depth - 1);
    if (depth === 0 && /[。！？]/.test(c)) { out.push(cur.trim()); cur = ''; }
    // 「…。」で終わる文（かっこを閉じたところで文が終わる）
    //   ただし「…。」と言った のように助詞が続くときは文の途中なので切らない
    else if (depth === 0 && c === '」' && /[。！？]」$/.test(cur) && !/^[とっ、のをにがはもでや]/.test(chars[i + 1] ?? '')) { out.push(cur.trim()); cur = ''; }
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

export interface SentencePair { en: string; ja: string }

/**
 * 英文の文と和訳の文を、長さの比で対応させる。
 *   使える組：1-1・1-2・2-1（どれも並びは崩さない）
 *   英文の文字数 : 和訳の文字数 の全体の比を基準に、それに近い組み合わせを選ぶ。
 */
export function alignSentences(en: readonly string[], ja: readonly string[]): SentencePair[] | null {
  const n = en.length;
  const m = ja.length;
  if (n === 0 || m === 0) return null;
  if (n === m) return en.map((e, i) => ({ en: e, ja: ja[i] }));
  if (n > 40 || m > 40) return null;
  const lenEn = en.map((s) => s.length);
  const lenJa = ja.map((s) => s.length);
  const ratio = lenJa.reduce((a, b) => a + b, 0) / Math.max(1, lenEn.reduce((a, b) => a + b, 0));
  // 長さの比のずれ（log の差）＋ 1-1 以外は少し損にする
  const cost = (a: number, b: number, extra: number) => Math.abs(Math.log((b + 1) / ((a + 1) * ratio))) + extra;
  const INF = Number.POSITIVE_INFINITY;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(INF));
  const back: ([number, number] | null)[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(null));
  dp[0][0] = 0;
  const moves: [number, number, number][] = [[1, 1, 0], [1, 2, 0.35], [2, 1, 0.35]];
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      if (dp[i][j] === INF) continue;
      for (const [di, dj, extra] of moves) {
        const a = i + di;
        const b = j + dj;
        if (a > n || b > m) continue;
        const c = dp[i][j] + cost(lenEn.slice(i, a).reduce((x, y) => x + y, 0), lenJa.slice(j, b).reduce((x, y) => x + y, 0), extra);
        if (c < dp[a][b]) { dp[a][b] = c; back[a][b] = [i, j]; }
      }
    }
  }
  if (dp[n][m] === INF) return null;
  const pairs: SentencePair[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const prev = back[i][j];
    if (!prev) return null;
    const [pi, pj] = prev;
    pairs.unshift({ en: en.slice(pi, i).join(' '), ja: ja.slice(pj, j).join('') });
    i = pi;
    j = pj;
  }
  return pairs;
}

/** 段落1つを「英文→和訳」の組の並びにする。決められなければ段落まるごとを1組（訳は欠けない） */
export function pairParagraph(en: string, ja: string | null | undefined): SentencePair[] {
  if (!ja) return [{ en, ja: '' }];
  return alignSentences(splitEnSentences(en), splitJaSentences(ja)) ?? [{ en, ja }];
}

export interface StructureHint { label: string; note: string }

/**
 * 構文のヒント（入試頻出のうち、形ではっきり分かるものだけ）。1文に最大2つ。
 *   当て推量はしない：例えば that は「同格」か「関係代名詞」か形だけでは決めにくいので拾わない。
 */
const HINTS: { re: RegExp; label: string; note: string }[] = [
  { re: /\bnot (?:only|just|merely)\b[^.]*\bbut(?: also)?\b/i, label: 'not only A but (also) B', note: '「AだけでなくBも」。B のほうが言いたいこと。' },
  { re: /\bnot\b[^.,;]{1,60}\bbut\b/i, label: 'not A but B', note: '「AではなくB」。筆者の主張は but の後ろ（B）。' },
  { re: /\bso\b [a-z]+(?: [a-z]+)? that\b/i, label: 'so ~ that …', note: '「とても〜なので…」。that 以下が結果。' },
  { re: /\bsuch\b[^.]{1,40}\bthat\b/i, label: 'such ~ that …', note: '「とても〜なので…」。such の後ろは名詞のかたまり。' },
  { re: /\bIt (?:is|was) [^.]{1,60}? (?:that|who) /, label: '強調構文 / 形式主語 It', note: 'It is ~ that … は「…なのは〜だ」（強調）か「…ということは〜だ」（形式主語）。It と that を外して文が成り立てば強調構文。' },
  { re: /\b(?:more|less|[a-z]+er) [^.]{0,40}than any\b/i, label: '比較級＋than any ~', note: '「どの〜よりも…」＝最上級の意味。' },
  { re: /\bno (?:sooner|longer)\b|\bnever (?:have|had|has|did|do|does)\b|\bhardly (?:had|has|have)\b|\bnot until\b|\bonly (?:then|when|after)\b/i, label: '否定語・倒置', note: '否定の語が前に出ると、後ろが疑問文の語順（助動詞＋主語）になることがある。主語を見失わないように。' },
  { re: /, (?:who|which|whom|whose) /, label: '関係詞の非制限用法', note: 'コンマ＋who/which は「そしてそれは〜」と前から順に足して読む。' },
  { re: /^(?:[A-Z][a-z]+ing|Having [a-z]+ed|[A-Z][a-z]+ed by)[^,]{0,60},/, label: '分詞構文', note: '文頭の -ing / -ed のかたまりは、主節の主語の「時・理由・状況」を表す。主節の主語が分詞の意味上の主語。' },
  { re: /\b(?:Although|Though|Even though|While|Whereas)\b/, label: '譲歩・対比', note: 'Although / While の節は「〜だけれども」。筆者の言いたいことは主節のほう。' },
  { re: /\bused to\b/i, label: 'used to ~', note: '「以前は〜していた（今は違う）」。今との対比が来ることが多い。' },
  { re: /\b(?:what|What) [a-z]+(?: [a-z]+)? (?:is|was) /, label: '関係代名詞 what', note: 'What … is ~ は「…なのは〜だ」。what のかたまりが主語。' },
  { re: /\bthe [a-z]+er\b[^.]{1,50}, the [a-z]+er\b|\bthe more\b[^.]{1,50}, the (?:more|less)\b/i, label: 'the 比較級 ~, the 比較級 …', note: '「〜すればするほど…」。' },
  { re: /\b(?:makes?|made|allows?|allowed|enables?|enabled|leads?|led) [a-z]+ (?:to )?[a-z]+/i, label: '無生物主語', note: '物・ことが主語で「〜が人に…させる」の形。「〜のおかげで／〜によって人は…」と訳すと自然。' },
];

export function structureHints(sentence: string): StructureHint[] {
  const out: StructureHint[] = [];
  for (const h of HINTS) {
    if (out.length >= 2) break;
    if (h.re.test(sentence) && !out.some((o) => o.label === h.label)) {
      // not only A but B を拾ったら not A but B は重ねない
      if (h.label === 'not A but B' && out.some((o) => o.label.startsWith('not only'))) continue;
      out.push({ label: h.label, note: h.note });
    }
  }
  return out;
}
