/** リスニング解説：スクリプトから「決め手の語句」を抜き出す処理。listeningExplanation.ts から分けた。中身は不変（listeningExplanation.ts からも従来どおり import できる）。 */
import type { AudioTrack, Problem, SubQuestion } from '../types/curriculum';


/**
 * 解説の組み立てが読む大問・小問の形。
 * データ取り込みの途中（listeningPostProcess）でも呼ばれ、欠けた項目があっても
 * 空文字・空配列で続けるよう書かれているので、全項目を任意として受ける。
 */
export type ProblemSource = Partial<Problem> | null | undefined;
export type SubSource = Partial<SubQuestion> | null | undefined;

// 枠の中に生の英文をそのまま置くので、記号が壊れないように
// escapeHtml を通す。実装は sanitizeHtml.ts（このファイル冒頭で import）。
// 以前ここにあったものは String(text) を挟んでいたが、呼び出し元の
// scriptBox が既に String(script || '') / String(translation || '') で
// 文字列にしてから渡しているため、結果は変わらない。

// ---------------------------------------------------------------------
// スクリプトの取り出し
// ---------------------------------------------------------------------

/**
 * 小問に対応するスクリプトを取り出す。
 *
 * ■ どこから取るか（優先順）
 *   ① problem.audioTracks[].script（subId が小問 id と一致するもの）
 *      … 音源そのものの台本なので、これが最も正確。
 *   ② 解説本文の「スクリプト：…」行
 *      … 音源データが未整備な問題のための保険。
 *
 * ■ 引用符を外す理由
 *   第1問B のデータはスクリプトが "…" で囲まれている。
 *   枠の中に置くときは囲みが二重になって読みにくいので外す。
 */
/**
 * 小問に対応する音源トラックを探す。
 * 第4問以降は1本の音源に複数の小問がぶら下がる（subIds）ので、
 * subId が一致しなければ subIds の中も見る。
 */
export function trackForSubQuestion(problem: ProblemSource, sq: SubSource): AudioTrack | undefined {
  const subId = String(sq?.id || '');
  const tracks: AudioTrack[] = Array.isArray(problem?.audioTracks) ? problem.audioTracks : [];
  return (
    tracks.find((t) => String(t?.subId || '') === subId) ||
    tracks.find((t) => Array.isArray(t?.subIds) && t.subIds.map(String).includes(subId))
  );
}

/** 小問ラベル（'問2 話者（…）'）から設問番号を取り出す */
export function questionNumberOf(sq: SubSource): number | null {
  const m = String(sq?.label || '').match(/問\s*(\d+)/u);
  return m ? Number(m[1]) : null;
}

// ---------------------------------------------------------------------
// C4：どの単語・どの表現を聞き取れればよかったのか
// ---------------------------------------------------------------------

/**
 * 決め手を数えるときに無視する語。
 *
 * ■ なぜ必要か
 *   the / a / is などは、聞き取れても正解には結びつかない。
 *   これらを「決め手」として出すと、本当に大事な語（否定・数量・前置詞）が
 *   埋もれてしまい、ご要望の「どこが大事か分からない」をむしろ悪化させる。
 *
 * ■ not / no / only などは *あえて残している*
 *   リスニングの誤答はほとんどが否定・限定の聞き落としで起きるため、
 *   これらは最重要の決め手になる。
 */
export const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'and', 'or', 'of', 'to', 'that', 'this', 'it', 'its',
  'i', 'you', 'he', 'she', 'they', 'we', 'my', 'your', 'his', 'her', 'their',
  'in', 'on', 'at', 'for', 'with', 'as', 'so', 'there', 'here', 'will', 'would',
  'can', 'could', 'have', 'has', 'had', 'me', 'him', 'them', 'us', 'one',
]);

/** 英語のかたまりを含むか（決め手として出す価値があるか）の判定 */
export function looksEnglish(text: string): boolean {
  return /[A-Za-z]{2,}/.test(text);
}

/** 決め手として使えるくらい意味のある語句か */
export function isMeaningfulPhrase(phrase: string): boolean {
  const cleaned = phrase.trim().toLowerCase().replace(/[.,!?;:]+$/u, '');
  if (cleaned.length < 2) return false;
  const words = cleaned.split(/\s+/u).filter(Boolean);
  if (words.length === 0) return false;
  // 1語のときは、意味の薄い語（the / is …）を弾く
  if (words.length === 1) return !STOPWORDS.has(words[0]);
  // 2語以上なら、少なくとも1語は意味のある語であること
  return words.some((w) => !STOPWORDS.has(w));
}

/** スクリプトの中に実際に出てくる表現か（大文字小文字は無視） */
export function occursInScript(script: string, phrase: string): boolean {
  const s = script.toLowerCase();
  const p = phrase.trim().toLowerCase().replace(/[.,!?;:]+$/u, '');
  return p.length > 1 && s.includes(p);
}

/**
 * 辞書の見出し形でも「スクリプトの中の表現を指している」と認められるか。
 *
 * ■ なぜ文字どおりの一致では駄目なのか
 *   手書きの keyPhrases は
 *     "forget A on the train"（A を電車に置き忘れる）
 *     "be going to bring"（持って行くつもりだった）
 *   のように、A や原形を使った辞書の見出し形で書かれている。
 *   実際のスクリプトは "I forgot it on the train" / "I was going to bring" なので、
 *   文字どおりでは一致せず、意味の説明が付いた最良のデータを丸ごと捨ててしまう。
 *
 * ■ 判定の考え方
 *   見出し形の「内容語」（A / be / to などの型を表す語を除く）が
 *   スクリプトに出てくるかを見る。語形が変わる語（forget→forgot,
 *   bring→brought）にも当たるよう、語幹の先頭4文字での前方一致も許す。
 *   内容語の過半数が見つかれば、その表現はスクリプトの中の出来事を
 *   指していると判断できる。
 */
export function isGroundedInScript(script: string, phrase: string): boolean {
  if (occursInScript(script, phrase)) return true;
  const s = script.toLowerCase();
  // 見出し形の「型」を表す語（A/B や be/to）は照合対象から外す
  const SKELETON = new Set(['a', 'b', 'be', 'to', 'one', 'sth', 'sb', 'the', 'on', 'in', 'at', 'of']);
  const words = phrase
    .toLowerCase()
    .split(/\s+/u)
    .map((w) => w.replace(/[^a-z'’]/gu, ''))
    .filter((w) => w.length > 1 && !SKELETON.has(w));
  if (words.length === 0) return false;
  const hits = words.filter((w) => {
    if (s.includes(w)) return true;
    // 語形変化（forget→forgot / bring→brought）を語幹の前方一致で拾う
    const stem = w.slice(0, 4);
    return stem.length >= 4 && new RegExp(`\\b${stem}`, 'u').test(s);
  }).length;
  return hits * 2 >= words.length;
}

/**
 * 語句の「端」に来ると意味が切れて見える語。
 *
 * ■ なぜ端だけを特別扱いするのか
 *   決め手を機械的に切り出すと
 *     「There are fifteen books on the」「and I'll add five more from」
 *   のように、前置詞や接続詞のところで文が途切れた形になってしまう。
 *   途切れた英語は、生徒が枠の中を目で追うときに
 *   「どこまでが決め手なのか」が分からず、かえって読みにくい。
 *   端の機能語だけを削れば
 *     「There are fifteen books」「I'll add five more」
 *   という、意味のかたまりとして読める形になる。
 *
 * ■ not / no / only を入れていない理由
 *   これらは端に来ても決め手そのもの（「not on weekends」の not）なので、
 *   削ってしまうと肝心の否定・限定が消える。
 */
export const EDGE_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'so', 'of', 'to', 'for', 'from',
  'in', 'on', 'at', 'with', 'by', 'as', 'that', 'than', 'if', 'is', 'am',
  'are', 'was', 'were', 'be', 'been', 'do', 'does', 'did', 'will', 'would',
  'can', 'could', 'have', 'has', 'had', 'there', 'here', 'it', 'its',
]);

/**
 * 語句の前後にくっついた機能語を落として、意味のかたまりに整える。
 * 落としすぎて空になる場合は、元の語句をそのまま返す（情報を失わない）。
 */
export function trimPhraseEdges(phrase: string): string {
  let words = phrase.trim().replace(/[.,!?;:]+$/u, '').split(/\s+/u).filter(Boolean);
  if (words.length <= 1) return words.join(' ');
  const isEdge = (w: string) => EDGE_WORDS.has(w.toLowerCase().replace(/[.,!?;:]+$/u, ''));
  while (words.length > 1 && isEdge(words[0])) words = words.slice(1);
  while (words.length > 1 && isEdge(words[words.length - 1])) words = words.slice(0, -1);
  const trimmed = words.join(' ');
  return trimmed || phrase.trim();
}

/**
 * 括弧・引用符の中に入っている英語のかたまりを取り出す。
 *
 * データの解説やテーマは
 *   「将来の意志（I'll go to bed early tonight）を問う基本問題」
 *   「had to stand all the way（ずっと立っていた）が要点」
 * のように、決め手の英語をすでに書いてくれている。
 * これを機械的に拾えば、手作業なしで「聞き取るべき表現」を復元できる。
 */
export function englishFragments(text: string): string[] {
  const source = String(text || '');
  const found: string[] = [];

  // ① 括弧・引用符の中身
  const bracketed = source.match(/[（(「『"“][^）)」』"”]{2,60}[）)」』"”]/gu) || [];
  for (const chunk of bracketed) {
    const inner = chunk.slice(1, -1).trim();
    if (looksEnglish(inner)) found.push(inner);
  }

  // ② 括弧の外に地の文として書かれた英語のかたまり
  //    （例：「had to stand all the way（…）が要点」の先頭部分）
  const bare = source.match(/[A-Za-z][A-Za-z'’]*(?:\s+[A-Za-z][A-Za-z'’]*){0,5}/gu) || [];
  for (const chunk of bare) found.push(chunk.trim());

  return found;
}

/** 解説本文から、その小問に対応するブロックだけを取り出す */
export function commentaryFor(problem: ProblemSource, sq: SubSource): string {
  const no = questionNumberOf(sq);
  if (no === null) return '';
  const lines = String(problem?.explanation || '').split('\n');
  const collected: string[] = [];
  let inTarget = false;
  for (const line of lines) {
    const head = line.match(/^\s*問\s*(\d+)/u);
    if (head) {
      inTarget = Number(head[1]) === no;
      continue;
    }
    if (inTarget) collected.push(line);
  }
  return collected.join('\n');
}

/**
 * 「聞き取れればよかった語句」を取り出す（C4の本体）。
 *
 * ■ 探し方（すべて “スクリプトに実在する表現だけ” に絞る）
 *   ① 手書きの keyPhrases（意味つき。あるならこれが最良）
 *   ② テーマ（detailedExplanation.theme）に書かれた英語
 *   ③ その問の解説コメントに書かれた英語
 *   ④ 正解の選択肢／正解のイラスト説明とスクリプトに *両方* 出てくる語
 *      … 両方に出てくる語は、定義上そこが答えの根拠になっている。
 *   ⑤ それでも取れないときは、否定・数量・前置詞の“ひっかけ語”を拾う
 *
 * ■ なぜ「スクリプトに実在する」ことを必須にしたか
 *   スクリプトに無い表現を「これを聞き取れれば良かった」と出すと、
 *   生徒は枠の中を探して見つからず、混乱するだけになる。
 *   聞き取りの復習は必ず「流れた音の中の語」を指さねばならない。
 *
 * ■ 最大4つに絞る理由
 *   ご要望は「どこが大事か分からない」なので、決め手を並べすぎたら本末転倒。
 *   4択問題1問を決めるのに必要な手がかりは、多くても数個である。
 */
export function extractDecisivePhrases(
  problem: ProblemSource,
  sq: SubSource,
  script: string,
): { phrase: string; meaning: string }[] {
  const result: { phrase: string; meaning: string }[] = [];
  const seen = new Set<string>();

  // スクリプト全体（またはほぼ全体）を「決め手」として出さないための上限。
  // 全文を指されても「どこが大事か」は何も分からず、ご要望に逆行する。
  const scriptWordCount = (script.match(/[A-Za-z][A-Za-z'’]*/gu) || []).length;
  const maxWords = Math.max(2, Math.min(7, Math.ceil(scriptWordCount * 0.6)));

  const push = (phrase: string, meaning = '', options?: { allowCitationForm?: boolean }) => {
    // 端の機能語を落として「意味のかたまり」にしてから採用する。
    // （切り出したままだと "There are fifteen books on the" のように
    //   前置詞で途切れ、枠の中と見比べにくい）
    const cleaned = trimPhraseEdges(phrase);
    if (!cleaned) return;
    if (!isMeaningfulPhrase(cleaned)) return;
    // スクリプトの大半を占める長さのものは、決め手として意味がないので捨てる
    const words = cleaned.split(/\s+/u).filter(Boolean);
    if (words.length > maxWords) return;
    // 端を削ったあともスクリプトに実在することを再確認する。
    // ここを飛ばすと「枠の中を探しても見つからない決め手」が出てしまう。
    //
    // ただし手書きの keyPhrases は例外にする（下の allowCitationForm）。
    // 辞書の見出し形（forget A on the train / be going to bring）で書かれており
    // 文字どおりには一致しないが、意味の説明が付いた最も価値の高いデータなので、
    // 「内容語がスクリプトに含まれているか」で実在を判定する。
    const grounded = options?.allowCitationForm
      ? isGroundedInScript(script, cleaned)
      : occursInScript(script, cleaned);
    if (!grounded) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push({ phrase: cleaned, meaning: meaning.trim() });
  };

  // ① 手書きの keyPhrases（意味つき）＝いちばん価値が高い
  const track = trackForSubQuestion(problem, sq);
  // 英文法（改訂版）は「空所に入った正解そのもの」だけを指す。
  // 機能語の除去・語数の上限をかけると「the number of」が「number」になったり、
  // 「can」1語の正解が消えたりするので、完成文に実在するかだけを見る。
  // 解説文の英語も拾わない（誤りの選択肢の語まで黄色くなるため）。
  if (problem?.keyPhrasesOnly === true) {
    return (track?.keyPhrases || [])
      .map((kp) => ({ phrase: String(kp?.phrase || '').trim(), meaning: String(kp?.meaning || '').trim() }))
      .filter((kp) => kp.phrase && occursInScript(script, kp.phrase));
  }
  for (const kp of track?.keyPhrases || []) {
    push(String(kp?.phrase || ''), String(kp?.meaning || ''), { allowCitationForm: true });
  }

  const theme = String(sq?.detailedExplanation?.theme || '');
  const commentary = commentaryFor(problem, sq);

  // ②③ の照合元からは「スクリプト：…」の行を必ず外す。
  //
  // ■ なぜ外さないと壊れるのか
  //   commentaryFor が返す本文にはスクリプトの行そのものが含まれている。
  //   そこから英語のかたまりを拾うと、スクリプトを5語ずつずらした断片
  //     ①cat is sleeping under ②under the table ③table again
  //   が「決め手」として並んでしまう。これは全文を細切れにしただけで、
  //   どこが大事かはまったく示していない（ご要望に逆行する）。
  //   決め手は “解説が言葉で指名した表現” から採るべきなので、
  //   スクリプトの引用行だけを取り除いてから拾う。
  const commentaryWithoutScript = commentary
    .split('\n')
    .filter((line) => !/^\s*スクリプト\s*[：:]/u.test(line))
    .filter((line) => !/^\s*スクリプトは\s/u.test(line))
    .join('\n');

  // ② テーマの中の英語 → ③ 解説コメントの中の英語
  for (const source of [theme, commentaryWithoutScript]) {
    for (const fragment of englishFragments(source)) push(fragment);
  }

  // ④ 正解の選択肢／イラスト説明とスクリプトの両方に出てくる語
  if (result.length === 0) {
    for (const line of commentary.split('\n')) {
      if (!/^\s*正解(?:の選択肢|のイラスト)?\s*[：:]/u.test(line)) continue;
      for (const fragment of longestSharedRuns(line, script)) push(fragment);
    }
  }

  // ⑤ 最後の受け皿：リスニングで最も誤答を生む「ひっかけ語」を拾う
  if (result.length === 0) {
    for (const fragment of trapWords(script)) push(fragment);
  }

  // 長い表現に含まれてしまう短い表現は落とす（「not」と「not weekends」の重複を避ける）
  const trimmed = result.filter(
    (item) =>
      !result.some(
        (other) =>
          other !== item &&
          other.phrase.toLowerCase().includes(item.phrase.toLowerCase()) &&
          other.phrase.length > item.phrase.length,
      ),
  );

  // 並び順：
  //   ① 意味の説明が付いているもの（手書きの keyPhrases）を最優先。
  //      「どの表現を聞き取れればよかったか」に意味まで添えられるのは
  //      これだけなので、いちばん上に出ないと価値が埋もれる。
  //   ② 同じ条件なら、長い（＝具体的な）表現を先に。
  trimmed.sort((a, b) => {
    const byMeaning = Number(Boolean(b.meaning)) - Number(Boolean(a.meaning));
    if (byMeaning !== 0) return byMeaning;
    return b.phrase.length - a.phrase.length;
  });

  // ------------------------------------------------------------------
  // 重なり合う言い方を1つに絞る（ご要望「変に多くてどこが大事か分からない」）
  // ------------------------------------------------------------------
  //   完全な包含でなくても
  //     「I'll go to bed early tonight」「I think I'll go to bed」
  //   のように同じ場所を指した言い方が並ぶと、決め手が3つあるように見えて
  //   かえって焦点がぼやける。スクリプト上の同じ範囲を指すものは
  //   いちばん長い（＝具体的な）1つだけを残す。
  const picked: { phrase: string; meaning: string }[] = [];
  const usedWords = new Set<string>();
  for (const item of trimmed) {
    const words = item.phrase.toLowerCase().split(/\s+/u).filter((w) => !STOPWORDS.has(w));
    if (words.length === 0) continue;
    const fresh = words.filter((w) => !usedWords.has(w)).length;
    // 半分以上が新しい語でなければ、すでに出した決め手の言い換えとみなして捨てる。
    // 「1語でも新しければ残す」だと
    //   ①I'll go to bed early tonight ②I think I'll go to bed
    // のように、同じ箇所の言い方違いが並んでしまう。
    if (fresh * 2 < words.length) continue;
    picked.push(item);
    for (const w of words) usedWords.add(w);
    if (picked.length >= 3) break; // 3つで足りる。並べすぎは本末転倒
  }
  return picked;
}

/**
 * 2つの文に共通して現れる、いちばん長い語のつながりを探す。
 * 「正解の選択肢」とスクリプトの両方に出てくる語こそが答えの根拠になる。
 */
export function longestSharedRuns(line: string, script: string): string[] {
  const words = (line.match(/[A-Za-z][A-Za-z'’]*/gu) || []).map((w) => w);
  const runs: string[] = [];
  let i = 0;
  while (i < words.length) {
    // その位置から、スクリプトに含まれる最長の連続を伸ばす
    let best = '';
    for (let len = Math.min(5, words.length - i); len >= 1; len -= 1) {
      const candidate = words.slice(i, i + len).join(' ');
      if (occursInScript(script, candidate) && isMeaningfulPhrase(candidate)) {
        best = candidate;
        break;
      }
    }
    if (best) {
      runs.push(best);
      i += best.split(/\s+/u).length;
    } else {
      i += 1;
    }
  }
  // 語数の多いものを優先（1語だけの寄せ集めより句のほうが手がかりになる）
  return runs.sort((a, b) => b.length - a.length);
}

/**
 * スクリプトの中の「ひっかけ語」。
 *
 * リスニングの4択は、ほぼ必ず
 *   ・否定（not / never / no）
 *   ・逆接（but / instead / actually）
 *   ・限定（only / just / all / both / none）
 *   ・数量（数字・比較級）
 *   ・位置（前置詞）
 * のどこかで差が付くように作られている。
 * 個別の決め手が取れないときは、この観点で拾えば必ず的を外さない。
 */
export function trapWords(script: string): string[] {
  const patterns: RegExp[] = [
    /\b(?:isn't|aren't|wasn't|weren't|don't|doesn't|didn't|won't|can't|couldn't|not|never|no)\b/giu,
    /\b(?:but|instead|actually|though|however|yet)\b/giu,
    /\b(?:only|just|all|both|none|either|neither|every|each)\b/giu,
    /\b(?:more|less|fewer|\w+er than|\w+est)\b/giu,
    /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty)\b/giu,
    /\b(?:between|under|above|below|behind|beside|inside|outside|in front of|next to)\b/giu,
    /\b\d+\b/gu,
  ];
  const found: string[] = [];
  for (const pattern of patterns) {
    const hits = script.match(pattern) || [];
    for (const hit of hits) found.push(hit);
  }
  return found;
}
