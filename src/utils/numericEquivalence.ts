/**
 * 単位付きの数値・有効数字・指数表記の同値判定（C-14: answerEquivalence.ts から分離）。
 *   「2.0×10^3 g」と「2.0 kg」を同じとみなす、などの数値の比較だけを持つ。
 *   中身は分離前と1文字も変えていない。answerEquivalence.ts から re-export している。
 */
// -------------------------------------------------------------------
// 第3層-1：数値＋単位の同一視
// -------------------------------------------------------------------

/**
 * 単位表記のゆれを「基準単位 + 換算係数」に寄せる。
 * これにより「40 mL」と「0.040 L」を同じ答えとして扱える一方、
 * 「40 mL」と「40 L」は（換算後の値が違うので）別の答えのままになる。
 */
interface UnitSpec {
  /** 換算後の基準単位名。これが違えば別物として扱う */
  base: string;
  /** 基準単位に直すための係数 */
  factor: number;
}

const UNIT_ALIASES: Record<string, UnitSpec> = {
  // 体積（基準: L）
  'ml': { base: 'l', factor: 1e-3 },
  'ミリリットル': { base: 'l', factor: 1e-3 },
  'cm3': { base: 'l', factor: 1e-3 },
  'cc': { base: 'l', factor: 1e-3 },
  'l': { base: 'l', factor: 1 },
  'リットル': { base: 'l', factor: 1 },
  'm3': { base: 'l', factor: 1e3 },
  // 質量（基準: g）
  'g': { base: 'g', factor: 1 },
  'グラム': { base: 'g', factor: 1 },
  'mg': { base: 'g', factor: 1e-3 },
  'ミリグラム': { base: 'g', factor: 1e-3 },
  'kg': { base: 'g', factor: 1e3 },
  'キログラム': { base: 'g', factor: 1e3 },
  // 物質量（基準: mol）
  'mol': { base: 'mol', factor: 1 },
  'モル': { base: 'mol', factor: 1 },
  'mmol': { base: 'mol', factor: 1e-3 },
  // 濃度（基準: mol/L）
  'mol/l': { base: 'mol/l', factor: 1 },
  'モル濃度': { base: 'mol/l', factor: 1 },
  'mmol/l': { base: 'mol/l', factor: 1e-3 },
  'g/l': { base: 'g/l', factor: 1 },
  'mg/l': { base: 'g/l', factor: 1e-3 },
  // 密度
  'g/cm3': { base: 'g/cm3', factor: 1 },
  'g/ml': { base: 'g/cm3', factor: 1 },
  // 割合・温度
  '%': { base: '%', factor: 1 },
  'パーセント': { base: '%', factor: 1 },
  '℃': { base: 'celsius', factor: 1 },
  '°c': { base: 'celsius', factor: 1 },
  '度': { base: 'celsius', factor: 1 },
  // 長さ（基準: m）
  'm': { base: 'm', factor: 1 },
  'cm': { base: 'm', factor: 1e-2 },
  'mm': { base: 'm', factor: 1e-3 },
  'nm': { base: 'm', factor: 1e-9 },
  'pm': { base: 'm', factor: 1e-12 },
  // 数え上げ（換算しないが単位名は同一視する）
  '個': { base: '個', factor: 1 },
  '種類': { base: '個', factor: 1 },
  '価': { base: '価', factor: 1 },
  '倍': { base: '倍', factor: 1 },
};

/** 大文字と小文字で意味が変わる単位（K=ケルビン / M=mol/L）は別扱いで先に引く */
const CASE_SENSITIVE_UNITS: Record<string, UnitSpec> = {
  'L': { base: 'l', factor: 1 },
  'mL': { base: 'l', factor: 1e-3 },
  'M': { base: 'mol/l', factor: 1 },
  'K': { base: 'kelvin', factor: 1 },
  'mol/L': { base: 'mol/l', factor: 1 },
  'mmol/L': { base: 'mol/l', factor: 1e-3 },
  'g/L': { base: 'g/l', factor: 1 },
  'mg/L': { base: 'g/l', factor: 1e-3 },
  'g/mL': { base: 'g/cm3', factor: 1 },
};

/** 数値部分と単位部分に切り分けた結果 */
interface NumericAnswer {
  /** 書かれたままの数値（単位が片方だけのときの比較に使う） */
  rawValue: number;
  /** 基準単位に換算した数値（単位が両方そろっているときの比較に使う） */
  value: number;
  /** 基準単位名（単位なしのときは空文字） */
  unit: string;
  /** 辞書にある既知の単位か。未知なら「単位省略の緩和」を行わない */
  knownUnit: boolean;
}

/** 上付き文字 → `^` 付きの通常表記（NFKC より前に処理する） */
const SUPERSCRIPT_MAP: Record<string, string> = {
  '\u2070': '0', '\u00B9': '1', '\u00B2': '2', '\u00B3': '3', '\u2074': '4',
  '\u2075': '5', '\u2076': '6', '\u2077': '7', '\u2078': '8', '\u2079': '9',
  '\u207A': '+', '\u207B': '-',
};

function superscriptToCaret(value: string): string {
  return value.replace(
    /[\u2070\u00B9\u00B2\u00B3\u2074-\u2079\u207A\u207B]+/g,
    (run) => '^' + [...run].map((ch) => SUPERSCRIPT_MAP[ch] ?? ch).join(''),
  );
}

/**
 * 「5.0×10⁻² mol/L」「5.0e-2mol/l」「0.050 mol/L」「40mL」「+5」などを
 * 数値と単位に分解する。数値として解釈できない場合は null。
 *
 * ★ 指数表記の書き換えは「×10」「10^」のように *明示的な指数* があるときだけ行う。
 *   そうしないと「100」「0.100」に含まれる "10" を指数と誤読してしまう。
 */
export function parseNumericAnswer(raw: string): NumericAnswer | null {
  let s = superscriptToCaret(String(raw ?? ''))
    .normalize('NFKC')
    .trim()
    // 「約」「およそ」などの前置きは無視する
    .replace(/^(?:約|およそ|ほぼ|だいたい)\s*/u, '');
  if (!s) return null;

  // 掛け算記号のゆれを * に統一（× ✕ ✖ x X ・ を掛け算として扱う）
  s = s
    .replace(/[×✕✖ｘxX*・]/g, '*')
    .replace(/\s+/g, '')
    .replace(/,/g, '');

  // 「5.0×10^-2」「5.0*10**-2」「5.0×10-2」→「5.0e-2」（× が前提なので誤読しない）
  s = s.replace(/\*10[\^*]{0,2}([+-]?\d+)/g, (_w, exp: string) => `e${exp}`);
  // 先頭の「10^-10」→「1e-10」（^ を必須にして「100」を除外する）
  s = s.replace(/^10[\^*]{1,2}([+-]?\d+)/, (_w, exp: string) => `1e${exp}`);
  s = s.replace(/E/g, 'e');

  const matched = s.match(/^([+-]?\d*\.?\d+(?:e[+-]?\d+)?)(.*)$/);
  if (!matched) return null;

  const value = Number(matched[1]);
  if (!Number.isFinite(value)) return null;

  const rawUnit = matched[2].trim();
  if (!rawUnit) return { rawValue: value, value, unit: '', knownUnit: true };

  const spec =
    CASE_SENSITIVE_UNITS[rawUnit] ??
    UNIT_ALIASES[rawUnit] ??
    UNIT_ALIASES[rawUnit.toLowerCase()];

  if (!spec) {
    // 「1万〜10万」「⑥ 還元剤」「12 * MA / MC」のような、単位ではない残りかす。
    // 数値だけの解答と同一視してはいけないので knownUnit=false でガードする。
    return { rawValue: value, value, unit: rawUnit.toLowerCase(), knownUnit: false };
  }
  return { rawValue: value, value: value * spec.factor, unit: spec.base, knownUnit: true };
}

/** 相対誤差での一致判定（1 と 1.0、0.010 と 0.01 を同一視する） */
function nearlyEqual(a: number, b: number): boolean {
  const scale = Math.max(Math.abs(a), Math.abs(b), 1e-30);
  return Math.abs(a - b) / scale < 1e-9;
}

/**
 * 数値として（単位も含めて）同じ答えか。
 *   ・両方に単位がある  → 基準単位に換算して比較（40 mL ＝ 0.040 L、40 mL ≠ 40 L）
 *   ・片方に単位がない  → 書かれたままの数値で比較（40 ＝ 40 mL）
 */
export function isNumericallyEqual(a: string, b: string): boolean {
  const left = parseNumericAnswer(a);
  const right = parseNumericAnswer(b);
  if (!left || !right) return false;

  if (left.unit && right.unit) {
    if (left.unit !== right.unit) return false;
    return nearlyEqual(left.value, right.value);
  }

  // 単位ではない語（「1万〜10万」「⑥ 還元剤」など）が付いている側は、
  // 数値だけの解答と同一視しない。
  if (!left.knownUnit || !right.knownUnit) return false;

  // 設問文で単位が指定済みのことが多いため、既知の単位の省略だけ許容する
  return nearlyEqual(left.rawValue, right.rawValue);
}
