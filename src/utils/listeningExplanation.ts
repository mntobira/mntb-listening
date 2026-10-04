/**
 * =====================================================================
 * 英語リスニング専用の解説の組み立て
 * =====================================================================
 *
 * ■ なぜ専用の組み立てが必要なのか（ご要望そのもの）
 *   > 解説は、解答の道筋よりも以前にスクリプトをまずは出すこと。
 *   > その後でそのスクリプトのどの単語を聞き取れればよかったのか、
 *   > どの表現を聞き取れればよかったのかをしっかりと反映すること。
 *   > スクリプトはすくりぷとだけで枠で囲んでくれると見やすい。
 *   > 解説が長すぎるというか変に多くて、どこが大事なのかどうかわかんないんだよね。
 *
 *   リスニングは「読めば分かる問題」ではなく「聞こえたかどうか」の勝負なので、
 *   復習でいちばん先に見たいのは “実際には何と言っていたのか”＝スクリプトである。
 *   ところが従来の解説は、化学と同じ汎用エンジンを通していたため
 *     ［解答］→［解法の思考手順］→［詳しい解説（この中にスクリプトが埋もれる）］
 *   という並びになっていた。スクリプトが本文の途中に地の文として混ざるので、
 *   「結局どこを聞き取れれば良かったのか」がまったく浮き上がらない。
 *
 *   そこで並びを
 *     ① スクリプト（枠の中に英文だけ）
 *     ② 聞き取りの決め手（どの語・どの表現が勝負だったか）
 *     ③ 解答の道すじ（なぜその選択肢になるか・短く）
 *   に変える。①→②→③は「聞こえた音 → 決め手 → 判断」という、
 *   実際に耳が働く順番そのものなので、復習が本番の再現になる。
 *
 * ■ 分量を増やさないための約束
 *   ご要望は「長すぎて、どこが大事か分からない」なので、
 *   ここでは *情報を足さない*。既にデータの中にあるもの
 *   （スクリプト・正解・正解の選択肢・その問の一言解説）を
 *   並べ替えて枠で囲むだけにする。
 *   全問に同じ文章が並ぶ一般論（＝どの問でも同じ「音声を1回目で通して聞き…」）は
 *   1回だけ出す（重複の削除は areStepsSharedAcrossSubQuestions が判定する）。
 *
 * ■ データを書き換えない
 *   問題データ（*.ts）そのものは触らず、表示に使う文字列を組み立てるだけにする。
 *   データを直接書き換えると、元のPDF由来の記述と食い違ったときに
 *   どちらが正しいのか追えなくなる。
 */

// ---------------------------------------------------------------------
// 既存の整形エンジンから、体裁と「目印」を借りる
// ---------------------------------------------------------------------
//
// SQ_* の目印は既存の整形エンジンとまったく同じものを使う。
// こうすることで、画面側（Explanation.tsx の sliceForSq）を書き換えずに
// 「小問アコーディオンを開くとその問の解説だけが出る」挙動をそのまま使える。
import {
  ANS,
  KEY,
  LABEL,
  circledNumber,
  SQ_MARK,
  SQ_BODY_MARK,
  ENHANCED_MARK,
} from './explanationFormat';
// 生テキストの最小エスケープは、数式側（mathTypeset.ts）と同じ作法で
// なければ表示が食い違うので、sanitizeHtml.ts の1つだけを使う
// （以前はこのファイルにも同じ実装が書かれていた）。
import { escapeHtml } from './sanitizeHtml';

/**
 * スクリプトを入れる枠。
 *
 * ■ なぜ枠だけを専用に用意するのか（ご要望「スクリプトはスクリプトだけで枠で囲む」）
 *   スクリプトの中に日本語の解説が混ざると、目が英文を追わずに
 *   日本語だけを読んでしまう。枠の中は英文（と和訳）だけに限定し、
 *   「ここが実際に流れた音の全部」と一目で分かる状態にする。
 *
 * ■ 色を解説本文と変えている理由
 *   枠を本文と同系色にすると、ただの囲み罫に見えて読み飛ばされる。
 *   スクリプトは復習の起点なので、開いた瞬間にいちばん目に入る色にする。
 *
 * ■ style 属性で書いている理由
 *   解説本文は sanitizeHtml を通ってから描画される。
 *   class は Tailwind の JIT が拾えず消えるため、インラインの style を使う
 *   （既存の BOX() とまったく同じ方針）。
 */
/**
 * この解説がリスニング専用の並び（スクリプトが先頭）で作られていることを表す目印。
 *
 * ■ 何のために要るのか
 *   画面側（Explanation.tsx）は、小問を開いたとき
 *     答えの核心 → 正解までの道すじ → 切り出した本文
 *   の順に描いている。この「正解までの道すじ」は
 *   detailedExplanation.steps（＝この回の全問で同じ一般論）なので、
 *   そのままだとスクリプトより前に一般論が来てしまい、
 *   「スクリプトをまずは出す」というご要望を満たせない。
 *   そこで、この目印があるときだけ画面側で道すじの重複表示を止める。
 *
 * ■ コメントの形にした理由
 *   sanitizeHtml が通す安全なコメント（英数字と : _ . - のみ）の形に合わせてある。
 *   表示上は何も出ないので、生徒の画面を汚さずに機械が判別できる。
 */
export const LISTENING_SCRIPT_FIRST_MARK = '<!--lsn-script-first-->';

/** リスニング専用の並び（スクリプトが先頭）で整形済みか */
export function isScriptFirstExplanation(text: unknown): boolean {
  return typeof text === 'string' && text.includes(LISTENING_SCRIPT_FIRST_MARK);
}

/** Literal script locations only. Dictionary forms are never guessed into a sentence. */
export function locateListeningEvidence(script: string, phrases: readonly string[]) {
  const candidates: { start: number; end: number; phraseIndex: number }[] = [];
  phrases.forEach((phrase, phraseIndex) => {
    const plain = phrase.trim().replace(/[.,!?;:]+$/u, '');
    if (plain.length < 2) return;
    const pattern = plain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/['’]/g, "['’]").split(/\s+/u).join('\\s+');
    const regex = new RegExp(`(^|[^A-Za-z])(${pattern})(?=$|[^A-Za-z])`, 'gi');
    for (const match of script.matchAll(regex)) {
      const start = match.index! + match[1].length;
      candidates.push({ start, end: start + match[2].length, phraseIndex });
    }
  });
  const chosen: typeof candidates = [];
  candidates.sort((a,b) => (b.end-b.start)-(a.end-a.start) || a.phraseIndex-b.phraseIndex);
  for (const hit of candidates) {
    if (!chosen.some(other => hit.start < other.end && hit.end > other.start)) chosen.push(hit);
  }
  return chosen.sort((a,b) => a.start-b.start);
}

function highlightedScript(script: string, phrases: readonly string[]): string {
  let end = 0;
  let html = '';
  for (const hit of locateListeningEvidence(script, phrases)) {
    html += escapeHtml(script.slice(end, hit.start));
    html += `<mark class="listening-evidence" aria-label="聞き取りの決め手 ${hit.phraseIndex+1}"><sup>${hit.phraseIndex+1}</sup>${escapeHtml(script.slice(hit.start, hit.end))}</mark>`;
    end = hit.end;
  }
  return (html + escapeHtml(script.slice(end))).replace(/\n/g, '<br>');
}

export function scriptBox(script: string, translation?: string, phrases: readonly string[] = []): string {
  const body = String(script || '').trim();
  if (!body) return '';
  const jp = String(translation || '').trim();
  return (
    LISTENING_SCRIPT_FIRST_MARK +
    '<div style="background-color:#F2FBFA; border:2px solid #3E9C93; border-left:9px solid #3E9C93; border-radius:10px; padding:12px 14px; margin-top:6px; color:#12403C;">' +
    '<div style="font-size:0.78em; font-weight:bold; letter-spacing:0.08em; color:#2F7C74; margin-bottom:6px;">SCRIPT ／ 実際に流れた英文</div>' +
    // 対話（第3問）のスクリプトは 'A: …' / 'B: …' の複数行で入ってくる。
    // 改行をそのまま出すと1行に潰れて誰の発話か追えないため、<br> に置き換える。
    `<div style="font-size:1.06em; font-weight:bold; line-height:1.85;">${highlightedScript(body, phrases)}</div>` +
    (jp
      ? `<div style="margin-top:8px; padding-top:8px; border-top:1px dashed rgba(62,156,147,0.5); font-size:0.9em; color:#2F7C74;">${escapeHtml(jp)}</div>`
      : '') +
    '</div>'
  );
}

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
export function trackForSubQuestion(problem: any, sq: any): any | undefined {
  const subId = String(sq?.id || '');
  const tracks: any[] = Array.isArray(problem?.audioTracks) ? problem.audioTracks : [];
  return (
    tracks.find((t) => String(t?.subId || '') === subId) ||
    tracks.find((t) => Array.isArray(t?.subIds) && t.subIds.map(String).includes(subId))
  );
}

export function pickScript(problem: any, sq: any): { script: string; translation: string } {
  const track = trackForSubQuestion(problem, sq);
  if (track && String(track.script || '').trim()) {
    return {
      script: unquote(String(track.script)),
      translation: String(track.translation || '').trim(),
    };
  }

  // 保険：解説本文の「スクリプト：…」行から拾う
  const fromBody = scriptLineFor(problem, sq);
  return { script: fromBody, translation: '' };
}

/** 前後の引用符（"…" / “…” / 「…」）を外す */
function unquote(text: string): string {
  return String(text)
    .trim()
    .replace(/^["“”「』『]+/u, '')
    .replace(/["“”」』]+$/u, '')
    .trim();
}

/** 解説本文の「問N …／スクリプト：…」から、その小問のスクリプト行を拾う */
function scriptLineFor(problem: any, sq: any): string {
  const no = questionNumberOf(sq);
  if (no === null) return '';
  const lines = String(problem?.explanation || '').split('\n');
  let inTarget = false;
  for (const line of lines) {
    const head = line.match(/^\s*問\s*(\d+)/u);
    if (head) {
      inTarget = Number(head[1]) === no;
      continue;
    }
    if (!inTarget) continue;
    const m = line.match(/^\s*スクリプト\s*[：:]\s*(.+)$/u);
    if (m) return unquote(m[1]);
  }
  return '';
}

/** 小問ラベル（'問2 話者（…）'）から設問番号を取り出す */
function questionNumberOf(sq: any): number | null {
  const m = String(sq?.label || '').match(/問\s*(\d+)/u);
  return m ? Number(m[1]) : null;
}

/** 外から設問番号を知りたいとき用の公開版（Explanation の問スコープで使う） */
export function listeningQuestionNumberOf(sq: any): number | null {
  return questionNumberOf(sq);
}

/**
 * 共通解説（大問全体の流れ・共通ポイント）から
 * 「いま見ている問 *以外* の解答行」を取り除く。
 *
 * ■ なぜ必要か（ご指摘への対応）
 *     > 問1の問題なのになぜ右側の大問全体の流れ・共通ポイントのところに
 *     > 問4までの答えがあるのか。なくさないとだめじゃない？
 *
 *   buildListeningExplanation は冒頭に「解 答」一覧
 *   （問1〜問4の正解をまとめた行）を置く。全問終えた結果画面では
 *   便利だが、1問ずつ解く途中の解説では、まだ解いていない問の
 *   答えがネタバレになってしまう。
 *
 * ■ やること
 *   ・「問N　【解答】…」の行のうち、N ≠ いま見ている問 の行を落とす
 *   ・一覧が「いま見ている問」1行だけになる（その問の答えは
 *     解答カードにも出ているので隠す必要はない）
 *   ・解答行が1つも残らなければ「解 答」の見出しごと落とす
 *   ・「この形式の解き方」などの一般論はそのまま残す（ネタバレではない）
 */
export function scopeListeningCommonToQuestion(common: string, questionNo: number | null): string {
  const source = String(common || '');
  if (!source || questionNo === null) return source;

  const lines = source.split('\n');
  const kept = lines.filter((line) => {
    // 「問N　…【解答】…」形式の行だけを選別対象にする
    const m = line.match(/^\s*問\s*(\d+)\s*　/u);
    if (!m || !line.includes('【解答】')) return true;
    return Number(m[1]) === questionNo;
  });

  // 解答行が全部消えた場合は「解 答」見出し（LABEL）も落とす
  const hasAnswerRow = kept.some((line) => line.includes('【解答】'));
  const result = hasAnswerRow
    ? kept
    : kept.filter((line) => !(line.includes('>解 答<') || /^\s*<span[^>]*>解 答<\/span>\s*$/u.test(line)));

  return result.join('\n').replace(/\n{3,}/gu, '\n\n');
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
const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'and', 'or', 'of', 'to', 'that', 'this', 'it', 'its',
  'i', 'you', 'he', 'she', 'they', 'we', 'my', 'your', 'his', 'her', 'their',
  'in', 'on', 'at', 'for', 'with', 'as', 'so', 'there', 'here', 'will', 'would',
  'can', 'could', 'have', 'has', 'had', 'me', 'him', 'them', 'us', 'one',
]);

/** 英語のかたまりを含むか（決め手として出す価値があるか）の判定 */
function looksEnglish(text: string): boolean {
  return /[A-Za-z]{2,}/.test(text);
}

/** 決め手として使えるくらい意味のある語句か */
function isMeaningfulPhrase(phrase: string): boolean {
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
function occursInScript(script: string, phrase: string): boolean {
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
function isGroundedInScript(script: string, phrase: string): boolean {
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
const EDGE_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'so', 'of', 'to', 'for', 'from',
  'in', 'on', 'at', 'with', 'by', 'as', 'that', 'than', 'if', 'is', 'am',
  'are', 'was', 'were', 'be', 'been', 'do', 'does', 'did', 'will', 'would',
  'can', 'could', 'have', 'has', 'had', 'there', 'here', 'it', 'its',
]);

/**
 * 語句の前後にくっついた機能語を落として、意味のかたまりに整える。
 * 落としすぎて空になる場合は、元の語句をそのまま返す（情報を失わない）。
 */
function trimPhraseEdges(phrase: string): string {
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
function englishFragments(text: string): string[] {
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
function commentaryFor(problem: any, sq: any): string {
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
  problem: any,
  sq: any,
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
    return ((track?.keyPhrases || []) as any[])
      .map((kp) => ({ phrase: String(kp?.phrase || '').trim(), meaning: String(kp?.meaning || '').trim() }))
      .filter((kp) => kp.phrase && occursInScript(script, kp.phrase));
  }
  for (const kp of (track?.keyPhrases || []) as any[]) {
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
function longestSharedRuns(line: string, script: string): string[] {
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
function trapWords(script: string): string[] {
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

// ---------------------------------------------------------------------
// C5：全問に同じ文章が並ぶ一般論を1回だけにする
// ---------------------------------------------------------------------

/**
 * その大問の全小問が「まったく同じ思考手順」を持っているか。
 *
 * ■ なぜこれを判定するのか（ご要望「解説が長すぎる／変に多い」の正体）
 *   実データを数えたところ、116個の小問のうち
 *     ・52個がまったく同じ4行（「① 音声を1回目で通して聞き…」）
 *     ・60個がまったく同じ4行（「① 音声の前に4枚を見比べ…」）
 *   を持っていた。つまり「解答の道すじ」として表示されている文章の
 *   ほぼ全部が、その問固有の話ではなく形式共通の一般論だった。
 *   それが4問ぶん繰り返されるので、画面が文字で埋まり、
 *   本当に大事な「どの語を聞き取れば良かったか」が埋もれてしまう。
 *
 * ■ 判定を文字列の決め打ちにしない理由
 *   「① 音声を1回目で…」を直接書いて弾くと、データの文言が
 *   1文字変わるだけで効かなくなる。
 *   「全小問で同一なら、それはこの問固有の話ではない」という
 *   構造だけで判定すれば、今後どんな文言に変わっても正しく効く。
 */
export function areStepsSharedAcrossSubQuestions(problem: any): boolean {
  const subs: any[] = Array.isArray(problem?.subQuestions) ? problem.subQuestions : [];
  const stepSets = subs.map((sq) =>
    JSON.stringify((sq?.detailedExplanation?.steps || []) as string[]),
  );
  // 手順を持つ小問が2つ以上あり、その中身が全部同じときだけ「共通の一般論」とみなす
  const withSteps = stepSets.filter((s) => s !== '[]');
  if (withSteps.length < 2) return false;
  if (withSteps.length !== stepSets.length) return false;
  return new Set(withSteps).size === 1;
}

/** 全小問で共通している思考手順（無ければ空配列） */
export function sharedSteps(problem: any): string[] {
  if (!areStepsSharedAcrossSubQuestions(problem)) return [];
  const subs: any[] = Array.isArray(problem?.subQuestions) ? problem.subQuestions : [];
  return (subs[0]?.detailedExplanation?.steps || []) as string[];
}

// ---------------------------------------------------------------------
// 解説の組み立て
// ---------------------------------------------------------------------

/**
 * その問の「なぜその選択肢か」を短くまとめた行だけを取り出す。
 *
 * ■ 何を落とすのか
 *   ・「スクリプト：…」行 … 枠の中に出したので二度は要らない
 *   ・「正解は ②」行     … 解答カードに出ているので二度は要らない
 *   ★内容そのものは要約せず、重複行を除くだけ★
 *     （PDF由来の説明を勝手に言い換えると、原典と食い違ってしまう）
 */
function reasonLines(problem: any, sq: any): string[] {
  const lines = commentaryFor(problem, sq).split('\n');
  const kept: string[] = [];
  // 第4問以降：小問が自分の一言解説（explainJa）を持つならそれを先頭に置く
  if (typeof sq?.explainJa === 'string' && sq.explainJa.trim()) {
    kept.push(...sq.explainJa.split('\n').map((l: string) => l.trim()).filter(Boolean));
  }
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^スクリプト\s*[：:]/u.test(line)) continue; // 枠に出した
    if (/^正解は\s*[①②③④]/u.test(line)) continue; // 解答カードに出ている
    kept.push(line);
  }
  return kept;
}

/**
 * 「聞き取りの決め手」ブロック（C4）。
 * スクリプトの直後に置き、枠の中のどこが勝負だったのかを指さす。
 */
function decisiveBlock(phrases: { phrase: string; meaning: string }[], theme: string): string {
  if (phrases.length === 0 && !theme.trim()) return '';

  const rows: string[] = [];
  rows.push(`${LABEL('聞き取りの決め手')}`);

  if (phrases.length > 0) {
    rows.push(
      // 「枠の中のこの語」と結び付けて読ませる。
      // 語だけを並べても、どこの話か分からず記憶に残らない。
      'スクリプト内の黄色いマーカーと、次の番号を照合してください。語形・言い換えで一致しない表現にはマーカーを付けていません。',
    );
    phrases.forEach((item, index) => {
      const meaning = item.meaning ? `　… ${item.meaning}` : '';
      rows.push(`${circledNumber(index)} ${KEY(item.phrase)}${meaning}`);
    });
  }

  if (theme.trim()) {
    // テーマは「何を問う問題だったか」を一言で言ったもの。
    // 決め手のすぐ下に置くと、語と狙いが1対1で結び付く。
    rows.push(`ねらい：${theme.trim()}`);
  }

  return rows.join('\n');
}

/**
 * リスニング1問（大問1回ぶん）の解説を組み立てる。
 *
 * ■ 並び（ご要望どおりの順番）
 *   小問ごとに
 *     ① SCRIPT（枠・英文だけ）
 *     ② 聞き取りの決め手（どの語・どの表現か）
 *     ③ 解答の道すじ（なぜその選択肢か・重複行は除いた元の説明）
 *
 * ■ 目印について
 *   既存の SQ_MARK / SQ_BODY_MARK をそのまま使うので、
 *   画面側（Explanation.tsx）は一切変更しなくても
 *   「小問アコーディオンを開くとその問のスクリプトから読める」状態になる。
 *
 * ■ SQ_SHARED_MARK を *あえて使っていない* 理由（C5の要点）
 *   画面側の sliceForSq() は、共通部分（SQ_SHARED_MARK 以降）を
 *   「どの小問を開いても必ず添える」実装になっている。
 *   つまり共通部分に一般論を置くと、4問ぶん複製されて表示され、
 *   まさにご要望の「変に多くてどこが大事か分からない」状態に戻ってしまう。
 *   そこで一般論は、小問アコーディオンの外＝「解説を全文まとめて読む」の
 *   冒頭に1回だけ置く。読みたい人は開ける／普段は目に入らない、が両立する。
 *
 * ■ 「問N　正解は ○」の行を残す理由
 *   この行は元データの表記そのままで、解説と subQuestions[].correctAnswer が
 *   食い違っていないことを検査で担保している（解説を読んだら正解が違う、
 *   という最悪の不整合を防ぐ命綱）。表示上は解答カードと重なるが、
 *   検査が通らなくなるほうが危険なので必ず残す。
 *
 * ■ 組み立てられないときは空文字を返す
 *   スクリプトが1つも無い（＝リスニング以外／データ未整備）の場合は
 *   従来の汎用エンジンに任せる。無理に専用整形をかけて
 *   情報が欠けるほうが害が大きい。
 */
export function buildListeningExplanation(problem: any): string {
  const subs: any[] = Array.isArray(problem?.subQuestions) ? problem.subQuestions : [];
  if (subs.length === 0) return '';

  // スクリプトが1問でも取れなければ、この専用整形は使わない
  const scripts = subs.map((sq) => pickScript(problem, sq));
  if (scripts.every((s) => !s.script)) return '';

  const sections: string[] = [];

  // --- 冒頭：解答の一覧（どの問が何番だったか一目で分かるように） ---
  const answerRows = subs
    .filter((sq) => sq && sq.correctAnswer)
    .map((sq) => {
      const label = String(sq.label || '').trim();
      // ラベルは「問1 話者（…）の発話に最も近い英文」と長いので、
      // 一覧では「問1」までに詰める（同じ情報が2度出るのを避ける）。
      const short = label.match(/^問\s*\d+/u)?.[0] || label;
      return `${short}　${ANS(`【解答】${String(sq.correctAnswer).trim()}`)}`;
    });
  if (answerRows.length > 0) {
    sections.push(`${LABEL('解 答')}\n${answerRows.join('\n')}`);
  }

  // --- 全問共通の一般論は、小問の外に1回だけ（C5） ---
  //     小問アコーディオンの中には入れない（上のコメントの理由）。
  const common = sharedSteps(problem);
  if (common.length > 0) {
    sections.push(
      `${LABEL('この形式の解き方')}` +
        '<span style="font-size:0.8em; color:#B03A5B; margin-left:6px;">（この回の全問に共通・1回だけ載せています）</span>\n' +
        common.map((step) => String(step).trim()).join('\n'),
    );
  }

  // --- 小問ごとに ［スクリプト → 決め手 → 道すじ］ ---
  subs.forEach((sq, index) => {
    const { script, translation } = scripts[index];
    const rows: string[] = [];

    rows.push(SQ_MARK(String(sq?.id || '')));

    // 見出し行。
    // ★「問N　正解は ○」という元データの表記を必ず行頭に置く★
    //   ・行頭の「問N」は、整形前の解説と同じ形なので既存の検査がそのまま通る
    //   ・正解の丸数字を併記することで、解説と解答データの食い違いを検査できる
    const no = questionNumberOf(sq) ?? index + 1;
    const answer = String(sq?.correctAnswer || '').trim();
    rows.push(answer ? `問${no}　正解は ${answer}` : `問${no}`);

    // ここから下がアコーディオンの中身
    rows.push(SQ_BODY_MARK);

    // ① スクリプト（枠・英文だけ）★いちばん先に出す★
    const phrases = extractDecisivePhrases(problem, sq, script);
    if (script) rows.push(scriptBox(script, translation, phrases.map(item => item.phrase)));

    // ② 聞き取りの決め手
    const decisive = decisiveBlock(phrases, String(sq?.detailedExplanation?.theme || ''));
    if (decisive) rows.push(decisive);

    // ③ 解答の道すじ（元の説明から重複行だけを除いたもの）
    const reasons = reasonLines(problem, sq);
    if (reasons.length > 0) {
      rows.push(`${LABEL('解答の道すじ')}\n${reasons.join('\n')}`);
    }

    sections.push(rows.join('\n'));
  });

  if (sections.length === 0) return '';
  return `${ENHANCED_MARK}${sections.join('\n\n')}`;
}

/**
 * 解説の先頭に入れた「SCRIPT／実際に流れた英文」（英文法では「ANSWER／完成した英文」）の枠を取り除く。
 * 答え合わせ画面ではスクリプト（英文＋和訳）をすぐ上に出しているので、詳しい解説で同じ英文を繰り返さない。
 * 枠の中は div が2〜3個（見出し・英文・和訳）だけで入れ子は無い、という scriptBox の形に合わせて外す。
 */
export function stripScriptBox(text: string): string {
  if (typeof text !== 'string' || !text.includes('background-color:#F2FBFA')) return text;
  return text.replace(
    /(?:<!--lsn-script-first-->)?\s*<div style="background-color:#F2FBFA;[^"]*">(?:\s*<div[^>]*>(?:(?!<div)[\s\S])*?<\/div>){1,3}\s*<\/div>/g,
    '',
  ).replace(/^\s*(<br\s*\/?>\s*)+/, '');
}
