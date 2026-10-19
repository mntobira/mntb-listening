/**
 * 化学式（mhchem）組版ヘルパー（#27: mathTypeset.ts から分離）
 */

export interface MathRegion {
  start: number;
  end: number;
  text: string;
}

export const SUPERSCRIPT_CHARS: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5',
  '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-', 'ⁿ': 'n',
};

export const SUBSCRIPT_CHARS: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
};

/** 実在する元素記号（周期表 1〜118）。これ以外の綴りは化学式と認めない。 */
const ELEMENTS = new Set([
  'H','He','Li','Be','B','C','N','O','F','Ne',
  'Na','Mg','Al','Si','P','S','Cl','Ar',
  'K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr',
  'Rb','Sr','Y','Zr','Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn','Sb','Te','I','Xe',
  'Cs','Ba','La','Ce','Pr','Nd','Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu',
  'Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg','Tl','Pb','Bi','Po','At','Rn',
  'Fr','Ra','Ac','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm','Md','No','Lr',
  'Rf','Db','Sg','Bh','Hs','Mt','Ds','Rg','Cn','Nh','Fl','Mc','Lv','Ts','Og',
]);

/**
 * 化学式と紛れやすいので化学式にしない語。
 */
const NOT_CHEMICAL = new Set([
  'No','In','As','At','Be','He','If','It','Is','On','Of','So','To','Or','An','Am','We','Us',
  'Sc','Cs','Ba','Nb','Pa','Os','Pm','Pr','Np','Bk','Cf','Es','Fm','Md','Lr','Ho','Er',
  'CD','ID','OK','TV','PC','AI','US','UK',
  // 単位・記号
  'mol','L','g','kg','mL','cm','mm','km','Pa','hPa','kPa','MPa','J','kJ','K','V','A','W','C',
  'N','S','B','F','P','H','O','U','Y','I',
]);

/** 化学反応式で使う矢印。mhchem の記法へ写す。 */
const CHEM_ARROWS: [RegExp, string][] = [
  [/⇄|⇌|⟷|⇔/g, ' <=> '],
  [/⟶|→|->/g, ' -> '],
  [/←/g, ' <- '],
];

/**
 * 語が「元素記号の並び＋数字＋電荷」として完全に説明できるか。
 */
function isChemicalFormula(word: string): boolean {
  if (!word || NOT_CHEMICAL.has(word)) return false;
  if (!/^[0-9]*[A-Z(]/.test(word)) return false;
  if (!/^[0-9A-Za-z()·・^+-]+$/.test(word)) return false;

  let i = 0;
  let elementCount = 0;
  while (i < word.length && /[0-9]/.test(word[i])) i++;

  while (i < word.length) {
    const ch = word[i];
    if (ch === '(' || ch === ')' || ch === '·' || ch === '・') { i++; continue; }
    if (/[0-9]/.test(ch)) { i++; continue; }
    if (ch === '^') {
      if (!/^\^[0-9]*[+-]$/.test(word.slice(i))) return false;
      i = word.length;
      continue;
    }
    if (ch === '+' || ch === '-') {
      if (i !== word.length - 1) return false;
      i++;
      continue;
    }
    const two = word.slice(i, i + 2);
    if (two.length === 2 && /^[A-Z][a-z]$/.test(two) && ELEMENTS.has(two)) {
      elementCount++; i += 2; continue;
    }
    if (/^[A-Z]$/.test(ch) && ELEMENTS.has(ch)) {
      elementCount++; i += 1; continue;
    }
    return false;
  }
  return elementCount > 0;
}

/**
 * Unicode の添字・上付き（H₂O, SO₄²⁻）を mhchem が読める表記に戻す。
 */
function unscript(text: string): string {
  return text
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => SUBSCRIPT_CHARS[c] ?? c)
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g, (run) =>
      `^${[...run].map((c) => SUPERSCRIPT_CHARS[c] ?? '').join('')}`,
    );
}

/**
 * 化学反応式の候補を mhchem の \ce{…} に変換する。
 * 化学式として解釈できなければ null（＝従来の描画に任せる）。
 */
export function toChemLatex(src: string): string | null {
  let t = String(src ?? '')
    .replace(/_\{([0-9]+)\}/g, '$1')
    .replace(/\^\{([0-9]*[+-])\}/g, '^$1');

  t = unscript(t).replace(/＋/g, ' + ').replace(/[（]/g, '(').replace(/[）]/g, ')');
  for (const [re, rep] of CHEM_ARROWS) t = t.replace(re, rep);

  t = t.replace(/(?<!\^)\+(?=[A-Z(0-9])/g, ' + ');

  const tokens = t.split(/\s+/).filter(Boolean).map((token) => {
    const match = token.match(/^(\d*)(.*)$/)!;
    const compact: Record<string, string> = {
      'Fe2+': 'Fe^2+', 'Fe3+': 'Fe^3+', 'Cu2+': 'Cu^2+',
      'Na2+': 'Na^2+', 'Y2+': 'Y^2+',
      'Ca2+': 'Ca^2+', 'Mg2+': 'Mg^2+', 'Ba2+': 'Ba^2+',
      'Sr2+': 'Sr^2+', 'Be2+': 'Be^2+', 'Zn2+': 'Zn^2+',
      'Al3+': 'Al^3+', 'Mn2+': 'Mn^2+', 'Cr3+': 'Cr^3+',
      'Pb2+': 'Pb^2+', 'Sn2+': 'Sn^2+', 'Sn4+': 'Sn^4+',
      'Ni2+': 'Ni^2+', 'Co2+': 'Co^2+', 'Cd2+': 'Cd^2+',
      'Hg2+': 'Hg^2+', 'O2-': 'O^2-', 'S2-': 'S^2-',
      'SO42-': 'SO4^2-', 'SO32-': 'SO3^2-', 'CO32-': 'CO3^2-',
      'PO43-': 'PO4^3-', 'CrO42-': 'CrO4^2-', 'Cr2O72-': 'Cr2O7^2-',
      'C2O42-': 'C2O4^2-',
    };
    return compact[match[2]] ? match[1] + compact[match[2]] : token;
  });
  if (tokens.length === 0) return null;

  let sawFormula = false;
  for (const token of tokens) {
    if (/^(\+|->|<-|<=>|=)$/.test(token)) continue;
    if (!isChemicalFormula(token)) return null;
    sawFormula = true;
  }
  if (!sawFormula) return null;

  return `\\ce{${tokens.join(' ')}}`;
}

const CHEM_CHAR = /[0-9A-Za-z()·・^_{}+\-＋→⟶⇄⇌⟷⇔←=₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ \t]/;

const ROMAN_ONLY = /^\(?[IVXLCDM]{1,5}\)?$/;

export function scanChemRegions(text: string): MathRegion[] {
  const regions: MathRegion[] = [];
  let i = 0;

  while (i < text.length) {
    if (!CHEM_CHAR.test(text[i])) { i++; continue; }

    let j = i;
    while (j < text.length && CHEM_CHAR.test(text[j])) j++;

    const raw = text.slice(i, j);
    const lead = raw.length - raw.replace(/^[\s=]+/, '').length;
    const candidate = raw.replace(/^[\s=]+/, '').replace(/[\s]+$/, '');

    if (candidate) {
      const latex = toChemLatex(candidate);
      const trivial = /^[0-9]*[A-Z][a-z]?$/.test(candidate);
      if (latex && !trivial && !ROMAN_ONLY.test(candidate)) {
        regions.push({
          start: i + lead,
          end: i + lead + candidate.length,
          text: candidate,
        });
      }
    }
    i = j;
  }

  return regions;
}
