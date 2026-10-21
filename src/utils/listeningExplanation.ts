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
import type { SubQuestion } from '../types/curriculum';
import { trackForSubQuestion, questionNumberOf, commentaryFor, extractDecisivePhrases } from './listeningEvidenceMatcher';
import type { ProblemSource, SubSource } from './listeningEvidenceMatcher';
export { trackForSubQuestion, extractDecisivePhrases } from './listeningEvidenceMatcher';


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
    '<div style="font-size:max(12px, 0.78em); font-weight:bold; letter-spacing:0.08em; color:#2F7C74; margin-bottom:6px;">SCRIPT ／ 実際に流れた英文</div>' +
    // 対話（第3問）のスクリプトは 'A: …' / 'B: …' の複数行で入ってくる。
    // 改行をそのまま出すと1行に潰れて誰の発話か追えないため、<br> に置き換える。
    `<div style="font-size:1.06em; font-weight:bold; line-height:1.85;">${highlightedScript(body, phrases)}</div>` +
    (jp
      ? `<div style="margin-top:8px; padding-top:8px; border-top:1px dashed rgba(62,156,147,0.5); font-size:max(12px, 0.9em); color:#2F7C74;">${escapeHtml(jp)}</div>`
      : '') +
    '</div>'
  );
}

export function pickScript(problem: ProblemSource, sq: SubSource): { script: string; translation: string } {
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
function scriptLineFor(problem: ProblemSource, sq: SubSource): string {
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

/** 外から設問番号を知りたいとき用の公開版（Explanation の問スコープで使う） */
export function listeningQuestionNumberOf(sq: SubSource): number | null {
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
export function areStepsSharedAcrossSubQuestions(problem: ProblemSource): boolean {
  const subs: SubQuestion[] = Array.isArray(problem?.subQuestions) ? problem.subQuestions : [];
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
export function sharedSteps(problem: ProblemSource): string[] {
  if (!areStepsSharedAcrossSubQuestions(problem)) return [];
  const subs: SubQuestion[] = Array.isArray(problem?.subQuestions) ? problem.subQuestions : [];
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
/**
 * ★英文法の解説を読みやすく（2026-10-11 大改訂③）★
 *   【着眼点】【ポイント】【選択肢】【プラス】【入試ではここ】の見出しを小さな札にし、
 *   選択肢の行は ○（緑）／×（赤）を目立たせる。中身の文は変えない。
 */
const EG_HEADS: Record<string, string> = {
  着眼点: '#2F7C74', ポイント: '#B0464F', 選択肢: '#5A6573', プラス: '#7A5B2A', 入試ではここ: '#1F5FA8',
};
function styleReasonLine(line: string): string {
  const head = line.match(/^【(着眼点|ポイント|選択肢|プラス|入試ではここ)】\s*(.*)$/u);
  if (head) {
    const color = EG_HEADS[head[1]];
    const tag = `<span style="display:inline-block; margin-right:6px; padding:0 8px; border-radius:6px; font-size:max(12px, 0.82em); font-weight:bold; color:#fff; background-color:${color};">${head[1]}</span>`;
    const body = head[2] ? (head[1] === '入試ではここ' ? `<span style="font-weight:bold; color:#1F3F6A;">${escapeHtml(head[2])}</span>` : escapeHtml(head[2])) : '';
    return tag + body;
  }
  const choice = line.match(/^([①②③④])\s*(.+?)　([○×])\s*(.*)$/u);
  if (choice) {
    const ok = choice[3] === '○';
    const mark = `<span style="font-weight:bold; color:${ok ? '#1E7D46' : '#C0392B'};">${choice[3]}</span>`;
    return `${choice[1]} <span style="font-weight:bold;">${escapeHtml(choice[2])}</span>　${mark} ${escapeHtml(choice[4])}`;
  }
  return line;
}

function reasonLines(problem: ProblemSource, sq: SubSource): string[] {
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
export function buildListeningExplanation(problem: ProblemSource): string {
  const subs: SubQuestion[] = Array.isArray(problem?.subQuestions) ? problem.subQuestions : [];
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
        '<span style="font-size:max(12px, 0.8em); color:#B03A5B; margin-left:6px;">（この回の全問に共通・1回だけ載せています）</span>\n' +
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
      rows.push(`${LABEL('解答の道すじ')}\n${reasons.map(styleReasonLine).join('\n')}`);
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
