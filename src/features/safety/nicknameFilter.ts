/**
 * ===================================================================
 * 表示名（ニックネーム）の安全チェック
 * ===================================================================
 *
 * ■ なぜ必要か（App Store Review Guideline 1.2 ユーザー生成コンテンツ）
 *   ニックネームはランキング・対戦相手の表示などで ★他人の画面に出る★。
 *   App Store は「他人に見えるユーザー生成コンテンツ」がある場合、
 *     1. 不適切な内容を出さないための仕組み（フィルタ）
 *     2. 通報の手段
 *     3. ブロックの手段
 *     4. 運営の連絡先
 *   を求める。ここは 1 を担当する（2・3 は userSafety.ts）。
 *
 * ■ 方針
 *   - 判定は「正規化した文字列に禁止語が含まれるか」。
 *     全角/半角・カタカナ/ひらがな・大文字/小文字・記号や空白の挟み込み
 *     （「し.ね」「ｼ ﾈ」）をならしてから比べる。
 *   - 連絡先（URL・メールアドレス・電話番号・SNS の @ID）も出さない。
 *     学習アプリの利用者の多くは未成年で、外部への誘導は事故につながる。
 *   - 引っかかった名前は保存させない（画面で理由を出す）。
 *     すでに保存済みの古い名前は、送信時に既定名へ差し替える（sanitizeNickname）。
 *
 * ★この一覧は完璧ではない★ 最終的な防波堤は「通報 → 運営が対応」。
 */

/** 表示名の最大長（firestore.rules の isValidRankingIdentity と一致させる） */
export const NICKNAME_MAX = 24;

/** 不適切語として扱う文字列（正規化後＝ひらがな・小文字・記号なしで比較する） */
const BLOCKED_WORDS: readonly string[] = [
  // 暴力・脅迫
  'しね', '死ね', 'ころす', '殺す', 'ころせ', '殺せ', 'しんで', '死んで', 'きえろ', '消えろ',
  'じさつ', '自殺', 'kill', 'die',
  // 侮辱・差別
  'きもい', 'きしょい', 'うざい', 'ばか', 'あほ', 'くず', 'かす', 'ごみ', 'ぶす', 'でぶ',
  'がいじ', 'ちょん', 'しなじん', '支那', 'えた', 'ひにん', 'めくら', 'つんぼ', 'かたわ', 'きちがい', '気違い',
  'nigger', 'nigga', 'fag', 'retard', 'idiot', 'stupid', 'bitch', 'fuck', 'shit', 'asshole',
  // 性的
  'せっくす', 'sex', 'えろ', 'ちんこ', 'ちんぽ', 'まんこ', 'おっぱい', 'ぱいぱい', 'れいぷ', 'rape',
  'porn', 'ぽるの', 'av女優', 'やりまん', 'やりちん', 'dick', 'pussy', 'penis', 'vagina',
  // 薬物
  'かくせいざい', '覚醒剤', '大麻', 'たいま', 'まやく', '麻薬',
  // なりすまし（運営・公式を名乗らせない）
  'うんえい', '運営', 'こうしき', '公式', 'admin', 'official', 'manatobi', 'まなとび',
];

/**
 * ひらがな2文字以下の語（しね・えろ・ばか…）は、一般語の一部に紛れやすい
 * （「かえろう」「よしねこ」「ばかり」）。そこで ★名前全体がその語のとき★
 * （語尾を伸ばした「しねええ」も含む）だけ弾く。漢字・英字の語は部分一致で見る。
 */
function isShortKana(word: string): boolean {
  return /^[\u3041-\u3096]{1,2}$/.test(word);
}

/** 誤検出を避けたい一般語（英字の短い語が紛れる単語） */
const ALLOW_CONTAINS: readonly string[] = [
  'たいまつ', 'ころすけ', 'しんでん', 'かたわら', 'ちょんまげ', 'ばかり',
  'diet', 'died', 'diego', 'diesel', 'indie', 'skill', 'studied', 'soldier',
  'essex', 'sussex', 'sextet',
];

/** 長く伸ばした語（「しねええ」）や大文字・全角をならす */
export function normalizeForCheck(input: string): string {
  let s = (input || '').normalize('NFKC').toLowerCase();
  // カタカナ → ひらがな
  s = s.replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  // 記号・空白・長音・絵文字などを取り除く（「し・ね」「し ね」「しーね」対策）
  s = s.replace(/[\s\p{P}\p{S}ー〜~_]/gu, '');
  // よく使われる言い換え（数字・記号の置き換え）
  s = s.replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/\$/g, 's').replace(/@/g, 'a');
  return s;
}

const CONTACT_PATTERNS: readonly RegExp[] = [
  /https?:\/\//i,
  /www\./i,
  /\b[a-z0-9-]+\.(com|net|org|jp|io|me|app|co|xyz|info|link|ly)\b/i,
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  // 電話番号（10〜11桁の数字。ハイフンなどを挟んだ形も）
  /(?:\d[\s\-‐－ー]?){10,11}/,
  // SNS の ID 誘導
  /(^|[^a-z0-9])@[a-z0-9_.]{3,}/i,
  /(line|ライン|insta|インスタ|twitter|ツイッター|tiktok|ティックトック|discord|ディスコ)\s*(id|ＩＤ|アイディー)?\s*[:：]?/i,
];

export type NicknameIssue = 'empty' | 'too_long' | 'blocked_word' | 'contact' | 'control_chars';

export interface NicknameCheck {
  ok: boolean;
  issue?: NicknameIssue;
  /** 利用者に見せる説明 */
  message?: string;
}

const MESSAGES: Record<NicknameIssue, string> = {
  empty: 'ニックネームを入力してください。',
  too_long: `ニックネームは${NICKNAME_MAX}文字以内にしてください。`,
  blocked_word: 'この名前は使えません。ほかの人が見て嫌な気持ちになる言葉や、運営・公式を名乗る言葉は使えません。',
  contact: 'URL・メールアドレス・電話番号・SNSのIDは名前に入れられません（ほかの人に表示されるため）。',
  control_chars: '使えない文字が含まれています。',
};

/** ニックネームとして使えるか */
export function checkNickname(raw: string, max = NICKNAME_MAX): NicknameCheck {
  const name = (raw || '').trim();
  if (!name) return { ok: false, issue: 'empty', message: MESSAGES.empty };
  if ([...name].length > max) return { ok: false, issue: 'too_long', message: MESSAGES.too_long };
  // 制御文字・書字方向の上書き（表示を偽装できる）・ゼロ幅文字
  if (/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/.test(name)) {
    return { ok: false, issue: 'control_chars', message: MESSAGES.control_chars };
  }
  if (CONTACT_PATTERNS.some((re) => re.test(name.normalize('NFKC')))) {
    return { ok: false, issue: 'contact', message: MESSAGES.contact };
  }
  const norm = normalizeForCheck(name);
  // 伸ばし・繰り返しをならした形（しねええ → しね、ばかばか → ばか）
  const collapsed = norm.replace(/(.)\1+$/u, '$1');
  let rest = norm;
  for (const w of ALLOW_CONTAINS) rest = rest.split(normalizeForCheck(w)).join('');
  const hit = BLOCKED_WORDS.some((w) => {
    const nw = normalizeForCheck(w);
    if (!nw) return false;
    if (isShortKana(nw)) {
      return norm === nw || collapsed === nw || norm === nw + nw
        || new RegExp(`^${nw}[ぁぃぅぇぉあいうえおっ]*$`, 'u').test(norm);
    }
    return rest.includes(nw);
  });
  if (hit) return { ok: false, issue: 'blocked_word', message: MESSAGES.blocked_word };
  return { ok: true };
}

/**
 * 他人に見える場所へ送る直前の最終チェック。
 * 使えない名前なら fallback に差し替え、長さも切り詰める。
 */
export function sanitizeNickname(raw: string, fallback = 'マナトビユーザー'): string {
  const trimmed = (raw || '').trim();
  const cut = [...trimmed].slice(0, NICKNAME_MAX).join('');
  return checkNickname(cut).ok ? cut : fallback;
}

/**
 * 他人の名前を ★表示する直前★ に通す。
 * 送信側（resolveNickname）で弾いていても、改造クライアントは素通りできるため、
 * 表示側でも同じ判定をかけて使えない名前は伏せる（App Store 1.2 の二重の防波堤）。
 */
export function displaySafeNickname(raw: string | null | undefined): string {
  const name = (raw || '').trim();
  if (!name) return '名前なし';
  // マスク済み（山＊＊＊）や定型の名前はそのまま
  if (/＊/.test(name) || name === '退会したユーザー' || name === '対戦相手') return [...name].slice(0, NICKNAME_MAX).join('');
  return checkNickname([...name].slice(0, NICKNAME_MAX).join('')).ok ? [...name].slice(0, NICKNAME_MAX).join('') : '（表示できない名前）';
}

/**
 * 志望校など「他人に見える短い自由入力」の判定。空欄は可（未設定）。
 * 名前と同じ NG 語・連絡先の規則を使う（App Store 1.2：利用者生成コンテンツのフィルタ）。
 */
export function checkPublicText(raw: string, max = 40): NicknameCheck {
  if (!(raw || '').trim()) return { ok: true };
  return checkNickname(raw, max);
}

/** 他人の志望校などを表示する直前に通す。使えない語は伏せる */
export function displaySafePublicText(raw: string | null | undefined, max = 40): string {
  const t = [...(raw || '').trim()].slice(0, max).join('');
  if (!t) return '';
  return checkNickname(t, max).ok ? t : '（非表示）';
}
