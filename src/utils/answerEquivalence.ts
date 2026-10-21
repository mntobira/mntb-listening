/**
 * ===================================================================
 * 解答の同一視ルール（表記ゆれの吸収）
 * ===================================================================
 *
 * 「化学的には同じことを書いているのに、表記が違うだけで×になる」
 * という理不尽な失点をなくすためのモジュール。
 *
 * answerJudge.ts から呼ばれ、次の3層で緩和する。
 *
 *   第1層：文字レベルの正規化（normalizeForCompare）
 *     半角/全角、ひらがな/カタカナ、長音、記号、上付き/下付き、
 *     句読点・括弧、単位の大小文字など。
 *
 *   第1層-b：記法の正規化（normalizeNotation）
 *     同じ式を別の書き方で入力しても同じ答えとみなす。
 *       SO₄²⁻ ＝ SO4^2- ＝ ＳＯ４^２−（記号パレット／手打ち／全角）
 *       x² ＝ x^2 ＝ x**2、x≦3 ＝ x<=3 ＝ x≤3、1÷3 ＝ 1/3
 *
 *   第2層：表現の展開（expandAnswerVariants）
 *     「水素イオン（H⁺）」→「水素イオン」「H+」のように、
 *     正解データそのものから別解を機械的に取り出す。
 *     「メチルオレンジ（またはメチルレッド）」のような明示的な別解も分解する。
 *
 *   第3層：意味レベルの同一視
 *     ・数値＋単位の比較（40 mL ＝ 40ml ＝ 40）
 *     ・指数表記の比較（5.0×10⁻² ＝ 5.0e-2 ＝ 0.050）
 *     ・化学用語の同義語辞書（ろ過＝濾過、貴ガス＝希ガス など）
 *     ・順序・列挙の区切り記号を無視した比較（Li>Na>K ＝ Li→Na→K）
 *     ・★数式としての同一視（mathExpression）★
 *       足す順番・掛ける順番・掛け算記号の有無・分数と小数の違いを吸収する。
 *         2x + 3 ＝ 3 + 2x、2√x ＝ 2*√x、(2/3)x√x ＝ x√x*2/3、1/2 ＝ 0.5
 *       ★化学式・英単語・単位はこの層に入らない（mathExpression 側の門で断る）★
 *       ★展開・因数分解・約分はしない（問題の意図を壊すため）★
 *
 * ★ 方針：正解を増やす方向にだけ働かせる。
 *   別の物質・別の数値が正解になってしまう緩和は入れない。
 */

import { isMathematicallyEqual } from './mathExpression';
import { isNumericallyEqual } from './numericEquivalence';
export { parseNumericAnswer, isNumericallyEqual } from './numericEquivalence';

// -------------------------------------------------------------------
// 第1層：文字レベルの正規化
// -------------------------------------------------------------------

/** ひらがな → カタカナ（「ろ過」「ロ過」「ﾛ過」の吸収に使う） */
function hiraganaToKatakana(value: string): string {
  return value.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60),
  );
}

/** 半角カタカナ → 全角カタカナ（濁点・半濁点も合成する） */
const HALFWIDTH_KANA_MAP: Record<string, string> = {
  'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
  'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
  'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
  'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
  'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
  'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
  'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
  'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
  'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
  'ﾜ': 'ワ', 'ｦ': 'ヲ', 'ﾝ': 'ン',
  'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
  'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ', 'ｯ': 'ッ', 'ｰ': 'ー',
};

function halfwidthKanaToFullwidth(value: string): string {
  let s = value.replace(/[\uFF61-\uFF9F]/g, (ch) => HALFWIDTH_KANA_MAP[ch] ?? ch);
  // 濁点・半濁点の合成（ﾊﾞ → バ）
  s = s.normalize('NFKC');
  return s;
}

/**
 * 比較用の共通正規化。
 * ここで潰した差は「同じ解答」とみなされる。
 */
export function normalizeForCompare(value: string): string {
  let s = halfwidthKanaToFullwidth(String(value ?? ''));

  // ひらがな→カタカナ（「でんぷん」＝「デンプン」、「ろか」＝「ロカ」）
  s = hiraganaToKatakana(s);

  // カタカナの長音・小書き文字のゆれ（ビュレット／ビューレット）
  s = s.replace(/[ー〜～\u30FC]/g, '');

  // 記号・空白の統一
  s = s
    .replace(/[\u3000\s]+/g, '')                 // 空白はすべて除去
    .replace(/[。、，,．]/g, '')                  // 句読点は無視
    .replace(/[（）()［］\[\]｛｝{}【】「」『』]/g, '') // 括弧は無視
    .replace(/[〜～]/g, '~');

  return s;
}

// -------------------------------------------------------------------
// 第1層-b：数式・化学式の「書き方」のゆれを1つの形に寄せる
// -------------------------------------------------------------------

/**
 * 上付き・下付き・不等号などの *記法* のゆれを吸収するための正規化。
 *
 * ■ 何のために必要か（ご要望「半角でも全角でも正解になるようにしてね」）
 *   同じ答えでも、入力手段によって文字がまったく違う。
 *
 *     記号パレットから入れた形   手で打った形      これまでの判定
 *     ─────────────────────────────────────────────────────────
 *     SO₄²⁻                     SO4^2-           ×（不一致）
 *     x²                        x^2              ×（不一致）
 *     x ≦ 3                     x<=3             ×（不一致）
 *     1/3                       1÷3              ×（不一致）
 *
 *   パレットは Unicode の上付き・下付き（²⁻ ₄）を入れるが、
 *   キーボードだけで打つ生徒は `^2-` `_4` と書く。
 *   どちらも同じことを書いているので、両方正解にする。
 *
 * ■ ★上付きは「消さずに ^ に寄せる」★
 *   ² を単に 2 に潰す（→ "x2"）方法は採らない。
 *   それだと「2^3（=8）」と「23」が同じ答えになってしまい、
 *   別の数値を正解にしてしまう危険がある。
 *   そこで ² → `^2` の向きに揃える。情報を落とさないので安全で、
 *   かつ手打ちの `^2` とちょうど一致する。
 *   （なお ² を 2 に潰した比較は answerJudge.normalizeAnswer 側が
 *     既に別ルートで行っているので、両方の書き方が救われる。）
 */
export function normalizeNotation(value: string): string {
  // ★ここで NFKC を使ってはいけない★
  //   NFKC は ² を 2、⁻ を - に潰してしまう（互換分解）。
  //   そうすると "x²" が "x2" になり、手打ちの "x^2" と一致しなくなる。
  //   上付きは下の SUP テーブルで `^2` の向きに寄せたいので、
  //   全角→半角は下の U+FF01〜U+FF5E の範囲変換だけで行う。
  let s = String(value ?? '');

  // 全角 ASCII → 半角（＾ ／ ＜ ＝ ＋ ０-９ Ａ-Ｚ ａ-ｚ など）
  s = s.replace(/[\uFF01-\uFF5E]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
  );

  // 各種マイナス様記号 → 半角ハイフン（長音「ー」は対象外）
  s = s.replace(/[\u2212\u2010\u2011\u2013\u2014\u2015]/g, '-');

  // 下付き数字（₀-₉）→ 通常数字。化学式の原子数は「H2O」と書くのが標準形。
  s = s.replace(/[\u2080-\u2089]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x2080 + 0x30),
  );
  // 明示的な下付き記法 `_2` も同じ形へ（H_2O → H2O）
  s = s.replace(/_(?=[0-9])/g, '');

  // 上付き（数字・符号）→ `^` 記法へ。連続する上付きはまとめて1つの ^ にする。
  //   ²⁻ → ^2-   ⁺ → ^+   ⁻³ → ^-3
  const SUP: Record<string, string> = {
    '\u2070': '0', '\u00B9': '1', '\u00B2': '2', '\u00B3': '3', '\u2074': '4',
    '\u2075': '5', '\u2076': '6', '\u2077': '7', '\u2078': '8', '\u2079': '9',
    '\u207A': '+', '\u207B': '-', '\u207C': '=', '\u207D': '(', '\u207E': ')',
    '\u207F': 'n',
  };
  s = s.replace(/[\u2070\u00B9\u00B2\u00B3\u2074-\u207F]+/g, (run) =>
    '^' + [...run].map((ch) => SUP[ch] ?? ch).join(''),
  );
  // ^{2-} のような波かっこ付きの書き方も外して同じ形に
  s = s.replace(/\^\{([^}]*)\}/g, '^$1');

  // 不等号・演算子の書き方のゆれ
  s = s
    .replace(/[\u2266\u2264]/g, '<=')   // ≦ ≤
    .replace(/[\u2267\u2265]/g, '>=')   // ≧ ≥
    .replace(/\u2260/g, '!=')           // ≠
    .replace(/\u2248/g, '=')            // ≈（およそ等しい）
    .replace(/\u00F7/g, '/')            // ÷ → /
    .replace(/[\u22C5\u00B7\u2027]/g, '*') // ⋅ · ‧（掛け算の中点）
    .replace(/\u21D2/g, '->')           // ⇒
    .replace(/\u2192/g, '->')           // →
    .replace(/\u21CC|\u21C4|\u2194/g, '<=>') // ⇌ ⇄ ↔（可逆反応）
    .replace(/\*\*/g, '^');             // 2**3 → 2^3

  // 空白は比較上すべて無視（"x <= 3" ＝ "x<=3"）
  s = s.replace(/[\u3000\s]+/g, '');

  return s;
}

// -------------------------------------------------------------------
// 第2層：正解データからの別解の自動展開
// -------------------------------------------------------------------

/** 「ア」「(b)」「①」のような、選択肢の記号だけの文字列か */
function isChoiceToken(value: string): boolean {
  const token = String(value ?? '').trim();
  return /^(?:[ア-ンa-zA-Z]|[①-⑳]|[0-9]{1,2})$/u.test(token);
}

/**
 * 正解文字列から、認めてよい別解を機械的に取り出す。
 *
 * 例）
 *   「水素イオン（H⁺）」        → 水素イオン ／ H⁺
 *   「メチルオレンジ（またはメチルレッド）」→ メチルオレンジ ／ メチルレッド
 *   「550 mL（5.5×10² mL）」    → 550 mL ／ 5.5×10² mL
 *   「水（水溶液・溶媒）」        → 水 ／ 水溶液 ／ 溶媒
 *   「割合（または組成）」        → 割合 ／ 組成
 *
 * ★ ただし「(ア)・(オ)」「（イ）NaNO₃、（エ）K₂SO₄」のように
 *   *複数の選択肢記号が括弧で並んでいる* 解答は「すべて答えて初めて正解」なので、
 *   分解すると片方だけの解答を通してしまう。この場合は展開しない。
 */
export function expandAnswerVariants(answer: string): string[] {
  const source = String(answer ?? '').trim();
  if (!source) return [];

  const variants = new Set<string>([source]);

  const bracket = /[（(]([^（()）]+)[)）]/g;
  const groups: { inner: string; index: number; length: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = bracket.exec(source)) !== null) {
    groups.push({ inner: match[1].trim(), index: match.index, length: match[0].length });
  }

  // 選択肢記号の括弧が2つ以上 → 複数解答の列挙とみなして展開しない
  const choiceGroups = groups.filter((g) => isChoiceToken(g.inner));
  if (choiceGroups.length >= 2) return [source];

  for (const group of groups) {
    const outer = (
      source.slice(0, group.index) + source.slice(group.index + group.length)
    ).trim();
    if (outer) variants.add(outer);

    // 「または」「もしくは」「・」「/」で並んだ複数の別解を分解する
    group.inner
      .split(/または|もしくは|あるいは|[・／/]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => variants.add(part));
  }

  // 「A と B」「A、B」のような単純な列挙は、そのままの形だけを使う
  // （分解すると片方だけの解答を正解にしてしまうため、あえて展開しない）

  return [...variants].filter(Boolean);
}

// -------------------------------------------------------------------
// 第3層-2：化学用語の同義語辞書
// -------------------------------------------------------------------

/**
 * 同じ意味として扱ってよい語のグループ。
 * 1グループ内のどれを書いても正解になる。
 *
 * ★ 化学的に厳密に等価か、教科書・共通テストで同義に扱われる表記だけを載せる。
 *   （例：「昇華」と「凝華」は向きが逆なので同義にしない）
 */
const SYNONYM_GROUPS: string[][] = [
  // --- 分離・精製の操作と器具 ---
  ['ろ過', '濾過', '沪過', 'ろか'],
  ['ろ液', '濾液', '沪液', 'ろえき'],
  ['クロマトグラフィー', 'クロマトグラフ', 'ペーパークロマトグラフィー', '薄層クロマトグラフィー'],
  ['昇華法', '昇華'],
  ['枝付きフラスコ', '枝つきフラスコ', '枝付フラスコ'],
  ['リービッヒ冷却器', 'リービッヒ冷却管', '冷却器', '冷却管'],
  ['アダプター', 'アダプタ', '連結管', 'アダプター管'],
  ['三角フラスコ', 'コニカルビーカー', '三角ビーカー'],
  ['分留', '分別蒸留'],
  ['再結晶', '再結晶法'],
  ['抽出', '抽出法', '溶媒抽出'],
  ['吸着力', '吸着', '吸着の強さ', '吸着されやすさ'],
  ['溶解度', '溶解度の差', '溶解度の違い'],
  ['枝の付け根付近', '枝の付け根', '枝の高さ', '枝分かれ部分', '枝の付け根の高さ'],
  ['下から上', '下から上へ', '下から'],

  // --- 器具（中和滴定） ---
  ['ビュレット', 'ビューレット'],
  ['ホールピペット', 'ホールピペツト'],
  ['メスフラスコ', 'メスフラスコ'],
  ['フェノールフタレイン', 'フェノールフタレイン溶液', 'フェノールフタレイン液'],
  ['メチルオレンジ', 'メチルオレンジ溶液', 'メチルオレンジ液'],
  ['メチルレッド', 'メチルレッド溶液'],
  ['デンプン溶液', 'デンプン水溶液', 'デンプン', 'ヨウ素デンプン反応の指示薬'],

  // --- 同素体・単体 ---
  ['黄リン', '黄燐', '白リン', '白燐'],
  ['赤リン', '赤燐'],
  ['斜方硫黄', '斜方イオウ', '斜方いおう'],
  ['単斜硫黄', '単斜イオウ', '単斜いおう'],
  ['ダイヤモンド', 'ダイアモンド', '金剛石'],
  ['黒鉛', 'グラファイト', 'せきぼく'],
  ['フラーレン', 'フラーレン類', 'C60'],

  // --- 周期表・原子 ---
  ['貴ガス', '希ガス', '18族元素', '貴ガス元素', '希ガス元素'],
  ['ハロゲン', 'ハロゲン元素', '17族元素'],
  ['アルカリ金属', 'アルカリ金属元素'],
  ['アルカリ土類金属', 'アルカリ土類金属元素'],
  ['最外殻電子', '最外殻の電子', '最外殻電子数'],
  ['価電子', '価電子数'],
  ['原子番号', '原子番号（陽子の数）'],
  ['ネオン型', 'Ne型', 'ネオンと同じ電子配置', 'ネオン型電子配置'],
  ['アルゴン型', 'Ar型', 'アルゴンと同じ電子配置', 'アルゴン型電子配置'],
  ['ヘリウム型', 'He型', 'ヘリウムと同じ電子配置', 'ヘリウム型電子配置'],
  ['イオン化エネルギー', '第一イオン化エネルギー', 'イオン化ｴﾈﾙｷﾞｰ'],

  // --- 結合・結晶 ---
  ['静電気', '静電気力', 'クーロン力', '静電気的な引力'],
  ['ファンデルワールス', 'ファンデルワールス力', 'ファンデルワールスの力'],
  ['非共有電子', '非共有電子対', '孤立電子対'],
  ['共有電子対', '共有電子'],
  ['脆い', 'もろい', '割れやすい', '砕けやすい'],
  ['展性', '展性（たたくと広がる性質）'],
  ['延性', '延性（引き伸ばせる性質）'],
  ['折れ線', '折れ線形', 'く の字形', '折れ線型'],
  ['三角錐', '三角錐形', '三角錐型'],
  ['正四面体', '正四面体形', '正四面体型'],
  ['直線', '直線形', '直線型'],
  ['無極性', '無極性分子', '極性なし'],
  ['極性', '極性分子', '極性あり'],

  // --- 熱運動・状態 ---
  ['熱運動', '熱運動（分子運動）', '分子の熱運動'],
  ['絶対温度', 'ケルビン温度', '熱力学温度'],
  ['ケルビン', 'K', 'ケルビン（K）'],
  ['潮解', '潮解性'],
  ['風解', '風解性'],

  // --- 酸塩基・酸化還元 ---
  ['水素イオン', 'H+', 'オキソニウムイオン', 'H3O+'],
  ['水酸化物イオン', 'OH-'],
  ['融解塩電解', '溶融塩電解', '融解塩電気分解', '溶融塩電気分解'],
  ['王水', '王水（濃塩酸と濃硝酸の混合物）'],
  ['陽極泥', '陽極でい'],
  ['氷晶石', 'クリオライト', 'Na3AlF6'],
  ['一酸化炭素', 'CO'],
  ['分極', '分極（水素の発生による電圧低下）'],

  // --- 色（「〜色」の有無は下の共通ルールで吸収するので、色名のゆれのみ） ---
  ['紫', '赤紫', '淡紫', '薄紫'],
  ['橙', 'だいだい', 'オレンジ', '橙赤'],
  ['紅', '深赤', '紅赤', '深紅'],
  ['淡青', '薄い青', '青', '淡い青'],
  ['青緑', '緑青', '青みどり'],
];

/** 正規化済みの語 → グループID の索引 */
const SYNONYM_INDEX: Map<string, number> = (() => {
  const index = new Map<string, number>();
  SYNONYM_GROUPS.forEach((group, groupId) => {
    group.forEach((word) => {
      index.set(normalizeForCompare(stripColorSuffix(word)), groupId);
    });
  });
  return index;
})();

/** 末尾の「色」を落とす（赤 ＝ 赤色 ＝ 赤い色） */
function stripColorSuffix(value: string): string {
  return String(value ?? '').replace(/[のい]?色$/u, '');
}

/** 同義語グループとして一致するか */
export function isSynonym(a: string, b: string): boolean {
  const left = SYNONYM_INDEX.get(normalizeForCompare(stripColorSuffix(a)));
  if (left === undefined) return false;
  const right = SYNONYM_INDEX.get(normalizeForCompare(stripColorSuffix(b)));
  return right !== undefined && left === right;
}

// -------------------------------------------------------------------
// 第3層-3：順序・列挙の区切り記号を無視した比較
// -------------------------------------------------------------------

/**
 * 「Li > Na > K」「Li→Na→K」「Li、Na、K」「LiNaK」を同一視するための圧縮形。
 * 元素記号・選択肢記号の列に限って使う（通常の語句で使うと別解答を通してしまう）。
 */
export function compactSequence(value: string): string {
  return normalizeForCompare(value)
    .replace(/[>＞<＜→←、,，・･\-−–—=＝]/g, '');
}

/**
 * 区切り記号を無視した比較を許してよい形か。
 * 判定は「元の文字列」に対して行う（正規化すると区切り記号が消えてしまうため）。
 *
 *   ・選択肢記号（ア〜ト、①〜⑩）が含まれる
 *   ・不等号・矢印で順序を並べている（Li > Na > K、Li→Na→K）
 *   ・元素記号／イオン式を読点・中黒で並べている（Li、Na、K）
 */
export function looksLikeSequence(value: string): boolean {
  const raw = String(value ?? '').trim();
  if (!raw) return false;

  // Mathematical inequalities describe sets, not lists of labels. Removing
  // direction/sign would make x<-4, x>-4 and x>4 identical. Keep the existing
  // chemistry ordering (Li > Na > K) but never compact a numeric/math operand.
  const notation = normalizeNotation(raw);
  if (/[<>]/.test(notation) && notation.split(/<=|>=|<|>/).some(
    operand => /^[0-9a-z+\-*/^().]+$/.test(operand),
  )) return false;

  // 選択肢記号（ア〜ト、①〜⑩）
  if (/[アイウエオカキクケコサシスセソタチツテト①②③④⑤⑥⑦⑧⑨⑩]/.test(raw)) return true;

  // 不等号・矢印による順序表現
  if (/[>＞<＜→←]/.test(raw)) return true;

  // 元素記号・イオン式の列挙（例: Li, Na, K ／ O2-・F-・Na+）
  const ION = String.raw`[A-Z][a-z]?\d*(?:\s*\d*\s*[+\-−–—\u207A\u207B])?`;
  return new RegExp(`^\\s*${ION}(?:\\s*[、,，・･]\\s*${ION})+\\s*$`).test(raw);
}

// -------------------------------------------------------------------
// 総合判定
// -------------------------------------------------------------------

/**
 * 1つの正解候補とユーザー解答が「同じ答え」といえるか。
 * answerJudge.isAnswerCorrect から候補ごとに呼ばれる。
 */
export function isEquivalentAnswer(candidate: string, userAnswer: string): boolean {
  const user = String(userAnswer ?? '').trim();
  if (!user) return false;
  if (!String(candidate ?? '').trim()) return false;

  const candidateVariants = expandAnswerVariants(candidate);

  for (const variant of candidateVariants) {
    if (!normalizeForCompare(variant)) continue;

    // ① 文字レベルの正規化で一致
    if (normalizeForCompare(variant) === normalizeForCompare(userAnswer)) return true;

    // ② 末尾の「色」の有無を無視して一致
    if (
      normalizeForCompare(stripColorSuffix(variant)) ===
      normalizeForCompare(stripColorSuffix(userAnswer))
    ) {
      return true;
    }

    // ③ 記法のゆれを吸収して一致
    //    （SO₄²⁻ ＝ SO4^2-、x² ＝ x^2、x≦3 ＝ x<=3、1÷3 ＝ 1/3）
    //    ★空文字どうしの一致で誤爆しないようガードする★
    const variantNotation = normalizeNotation(variant);
    if (variantNotation && variantNotation === normalizeNotation(userAnswer)) return true;

    // ④ 数値＋単位として一致（40 mL ＝ 40 ＝ 40ml、5.0×10⁻² ＝ 0.050）
    if (isNumericallyEqual(variant, userAnswer)) return true;

    // ⑤ 化学用語の同義語として一致
    if (isSynonym(variant, userAnswer)) return true;

    // ⑥ 順序・列挙の区切り記号を無視して一致
    if (
      looksLikeSequence(variant) &&
      looksLikeSequence(userAnswer) &&
      compactSequence(variant) !== '' &&
      compactSequence(variant) === compactSequence(userAnswer)
    ) {
      return true;
    }

    // ⑦ ★数式として同じ式か（2x+3 ＝ 3+2x、2√x ＝ 2*√x、1/2 ＝ 0.5）★
    //    数式として読み取れないもの（化学式・英単語・単位つき）は
    //    mathExpression 側の門で断られ、false が返るだけなので影響しない。
    if (isMathematicallyEqual(variant, userAnswer)) return true;
  }

  return false;
}
