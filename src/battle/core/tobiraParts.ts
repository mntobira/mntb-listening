/**
 * とびら君の「部位ごと」のきせかえ（帽子・メガネ・ほっぺ・オーラ）と、アプリの壁紙。
 *
 * ポーズ画像（public/mascots/*.webp）は1枚絵なので、アクセサリは上から重ねて描く。
 * ポーズごとに頭のてっぺん・目の位置・傾きが違うので、画像ごとの「取り付け位置」を持つ。
 *   head: [x, y, 幅, 傾き°] … 帽子のつばが乗る位置（x,y は画像幅・高さに対する割合、幅は画像幅に対する割合）
 *   eyes: [x, y, 幅, 傾き°] … 両目の中心と、両目を覆う幅
 * 値は12ポーズすべてを目で確認して決めた（.tmpwork の確認画像で、帽子・メガネが顔に合うことを確認済み）。
 */
export type AccessorySlot = 'hat' | 'glasses' | 'cheek' | 'aura';
export const ACCESSORY_SLOTS: readonly AccessorySlot[] = ['hat', 'glasses', 'cheek', 'aura'];
export const SLOT_LABELS: Record<AccessorySlot | 'wallpaper' | 'stage' | 'companion', string> = {
  hat: '頭（帽子）', glasses: '顔（メガネ）', cheek: 'ほっぺ', aura: 'オーラ', wallpaper: '壁紙', stage: 'ホームの背景', companion: 'お供',
};

export interface PoseAnchor { w: number; h: number; head: readonly [number, number, number, number]; eyes: readonly [number, number, number, number] }

export const POSE_ANCHORS: Record<string, PoseAnchor> = {
  '/mascots/basic.webp': { w: 892, h: 944, head: [0.52, 0.035, 0.50, 0], eyes: [0.475, 0.31, 0.34, 0] },
  '/mascots/bowing.webp': { w: 616, h: 828, head: [0.44, 0.05, 0.56, -10], eyes: [0.52, 0.47, 0.36, -3] },
  '/mascots/cheering.webp': { w: 940, h: 924, head: [0.55, 0.055, 0.44, 6], eyes: [0.55, 0.29, 0.28, 5] },
  '/mascots/good.webp': { w: 804, h: 836, head: [0.54, 0.035, 0.50, 0], eyes: [0.555, 0.28, 0.30, 0] },
  '/mascots/happy.webp': { w: 1024, h: 876, head: [0.52, 0.10, 0.34, 4], eyes: [0.52, 0.34, 0.24, 4] },
  '/mascots/listening.webp': { w: 827, h: 914, head: [0.52, 0.10, 0.36, 0], eyes: [0.54, 0.34, 0.28, 0] },
  '/mascots/science.webp': { w: 820, h: 969, head: [0.61, 0.06, 0.46, 4], eyes: [0.60, 0.34, 0.30, 4] },
  '/mascots/sleeping.webp': { w: 1028, h: 640, head: [0.44, 0.08, 0.30, -28], eyes: [0.50, 0.22, 0.20, -24] },
  '/mascots/studying.webp': { w: 668, h: 832, head: [0.48, 0.035, 0.54, 0], eyes: [0.44, 0.43, 0.34, 0] },
  '/mascots/thinking.webp': { w: 688, h: 836, head: [0.53, 0.03, 0.50, 0], eyes: [0.555, 0.35, 0.32, 0] },
  '/mascots/trophy.webp': { w: 485, h: 918, head: [0.56, 0.46, 0.36, 4], eyes: [0.58, 0.555, 0.28, 6] },
  '/mascots/walking.webp': { w: 804, h: 912, head: [0.56, 0.035, 0.48, 0], eyes: [0.575, 0.34, 0.30, 0] },
};

export function anchorOf(poseSrc: string): PoseAnchor {
  return POSE_ANCHORS[poseSrc] ?? POSE_ANCHORS['/mascots/basic.webp'];
}

/** アクセサリの value は「形:色」（例 'beanie:#E74C3C'）。形が知らないものなら null */
export const HAT_STYLES = ['beanie', 'cap', 'crown', 'wizard', 'graduation', 'ribbon', 'flower', 'bunny', 'halo', 'chef', 'beret', 'tiara', 'headphones', 'sprout', 'hachimaki'] as const;
export const GLASSES_STYLES = ['round', 'square', 'sun', 'star', 'heart', 'monocle', 'goggle', 'science', 'pixel'] as const;
export const CHEEK_STYLES = ['blush', 'star', 'heart', 'sticker', 'whisker', 'sparkle'] as const;
export const AURA_STYLES = ['sparkle', 'hearts', 'notes', 'bubbles', 'formula', 'stars', 'petals', 'flame', 'snow', 'abc', 'bolt', 'pencil'] as const;
const STYLE_SETS: Record<AccessorySlot, readonly string[]> = { hat: HAT_STYLES, glasses: GLASSES_STYLES, cheek: CHEEK_STYLES, aura: AURA_STYLES };

export function parseAccessory(slot: AccessorySlot, value: string): { style: string; color: string } | null {
  const [style, color = '#E74C3C'] = value.split(':');
  if (!STYLE_SETS[slot].includes(style) || !/^#[0-9A-Fa-f]{6}$/.test(color)) return null;
  return { style, color };
}

/**
 * 壁紙（アプリの背景）。CSS の background だけで描く（画像ファイルを増やさない・通信しない）。
 * data: の SVG は CSP の img-src 'self' data: で許可済み。
 */
const svg = (body: string, size = 120) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>${body}</svg>`)}")`;

export const WALLPAPERS: Record<string, { label: string; css: string; dark?: boolean }> = {
  grid: { label: '方眼ノート', css: `linear-gradient(#cfe0ec66 1px,transparent 1px) 0 0/22px 22px,linear-gradient(90deg,#cfe0ec66 1px,transparent 1px) 0 0/22px 22px,#fbfdff` },
  lined: { label: '大学ノート', css: `repeating-linear-gradient(#fffdf8 0 29px,#b9d3e6 29px 30px),#fffdf8` },
  sakura: { label: '桜', css: `${svg("<g fill='#f6b6c8' opacity='.55'><circle cx='20' cy='24' r='6'/><circle cx='84' cy='70' r='5'/><circle cx='50' cy='104' r='4'/><circle cx='104' cy='18' r='3'/></g>")},linear-gradient(#fff5f8,#fde8ef)` },
  mint: { label: 'ミントストライプ', css: `repeating-linear-gradient(135deg,#e6f6ef 0 18px,#f5fcf8 18px 36px)` },
  sunset: { label: '夕焼け', css: `linear-gradient(#ffd6a5,#ffadad 55%,#e3b5d9)` },
  ocean: { label: '海', css: `${svg("<path d='M0 90 Q30 80 60 90 T120 90' stroke='#ffffff' stroke-width='3' fill='none' opacity='.5'/><path d='M0 60 Q30 50 60 60 T120 60' stroke='#ffffff' stroke-width='2' fill='none' opacity='.35'/>")},linear-gradient(#bde0fe,#8ecae6)` },
  forest: { label: '森の小道', css: `${svg("<g fill='#8fbf88' opacity='.45'><path d='M20 40 l10 -22 l10 22z'/><path d='M80 100 l9 -20 l9 20z'/></g>")},linear-gradient(#eef7e8,#d8ecd0)` },
  chalk: { label: '黒板', dark: true, css: `${svg("<g fill='none' stroke='#ffffff' stroke-width='1.5' opacity='.18' font-family='serif'><text x='8' y='30' fill='#fff' stroke='none' font-size='14'>y=ax²</text><text x='60' y='90' fill='#fff' stroke='none' font-size='13'>H₂O</text></g>", 140)},linear-gradient(#2f5d50,#274c42)` },
  chem: { label: '化学式柄', css: `${svg("<g fill='#7fb3d5' opacity='.35' font-family='sans-serif' font-size='13' font-weight='700'><text x='6' y='26'>H₂O</text><text x='62' y='58'>CO₂</text><text x='14' y='96'>NaCl</text><text x='70' y='118'>O₂</text></g><polygon points='100,14 110,20 110,32 100,38 90,32 90,20' fill='none' stroke='#7fb3d5' stroke-width='2' opacity='.35'/>", 130)},#f4f9fd` },
  math: { label: '数式柄', css: `${svg("<g fill='#a29bfe' opacity='.35' font-family='serif' font-size='15' font-style='italic'><text x='6' y='26'>∫f(x)dx</text><text x='60' y='64'>π</text><text x='10' y='100'>√2</text><text x='70' y='116'>Σ</text></g>", 130)},#f7f6ff` },
  music: { label: '五線譜', css: `${svg("<g stroke='#c9b8e8' stroke-width='1' opacity='.7'><line x1='0' y1='40' x2='120' y2='40'/><line x1='0' y1='48' x2='120' y2='48'/><line x1='0' y1='56' x2='120' y2='56'/><line x1='0' y1='64' x2='120' y2='64'/><line x1='0' y1='72' x2='120' y2='72'/></g><text x='30' y='62' font-size='22' fill='#b39ddb' opacity='.6'>♪</text><text x='84' y='58' font-size='22' fill='#b39ddb' opacity='.6'>♫</text>")},#fbf8ff` },
  night: { label: '夜空', dark: true, css: `${svg("<g fill='#fff'><circle cx='14' cy='20' r='1.4'/><circle cx='70' cy='44' r='1'/><circle cx='100' cy='12' r='1.6'/><circle cx='36' cy='90' r='1.2'/><circle cx='96' cy='100' r='1'/></g>")},linear-gradient(#1b2a4e,#3a3f7a)` },
  galaxy: { label: '銀河', dark: true, css: `${svg("<g fill='#fff'><circle cx='20' cy='30' r='1.3'/><circle cx='88' cy='20' r='1'/><circle cx='60' cy='80' r='1.6'/><circle cx='104' cy='96' r='1'/></g>")},radial-gradient(ellipse at 30% 30%,#7b2ff788,transparent 60%),radial-gradient(ellipse at 75% 70%,#f107a355,transparent 55%),linear-gradient(#10002b,#240046)` },
  aurora: { label: 'オーロラ', dark: true, css: `radial-gradient(ellipse at 20% 20%,#43e97b66,transparent 55%),radial-gradient(ellipse at 80% 35%,#38f9d766,transparent 55%),radial-gradient(ellipse at 50% 80%,#7f5af066,transparent 60%),linear-gradient(#0b132b,#1c2541)` },
  rainbow: { label: 'レインボー', css: `linear-gradient(160deg,#ffadad,#ffd6a5,#fdffb6,#caffbf,#9bf6ff,#a0c4ff,#bdb2ff)` },
  gold: { label: '黄金の書斎', css: `${svg("<path d='M60 10 L66 54 L110 60 L66 66 L60 110 L54 66 L10 60 L54 54Z' fill='#f5d06f' opacity='.25'/>")},linear-gradient(#fff6d8,#f3dea0)` },
  // ── 2026-10-23 追加（ガチャ増量）──
  library: { label: '図書館', css: `repeating-linear-gradient(90deg,#c98b5a 0 14px,#7fa3c9 14px 24px,#e2b84f 24px 34px,#8fbf88 34px 46px,#b5838d 46px 56px) 0 0/56px 60px,linear-gradient(#f6ead7,#f6ead7)`, },
  english: { label: 'ABC', css: `${svg("<g fill='#7aa7d9' opacity='.32' font-family='sans-serif' font-weight='900'><text x='8' y='30' font-size='22'>A</text><text x='70' y='40' font-size='18'>b</text><text x='30' y='92' font-size='20'>C</text><text x='88' y='108' font-size='16'>?</text></g>", 130)},#f5f9ff` },
  sky: { label: '青空', css: `${svg("<g fill='#ffffff' opacity='.85'><ellipse cx='30' cy='30' rx='22' ry='9'/><ellipse cx='44' cy='24' rx='14' ry='10'/><ellipse cx='92' cy='88' rx='20' ry='8'/><ellipse cx='104' cy='82' rx='12' ry='9'/></g>", 130)},linear-gradient(#9fd3ff,#d9f0ff)` },
  candy: { label: 'キャンディ', css: `repeating-linear-gradient(45deg,#ffe3ef 0 16px,#fff7d6 16px 32px,#dff6ff 32px 48px)` },
  // ── 2026-10-29 追加（2次試験ガチャ専用）──
  campus: { label: 'キャンパスの並木', css: `${svg("<g fill='#7fb77e' opacity='.5'><circle cx='20' cy='30' r='14'/><circle cx='100' cy='36' r='12'/><circle cx='62' cy='96' r='10'/></g><g fill='#8d6e63' opacity='.45'><rect x='18' y='42' width='4' height='14'/><rect x='98' y='46' width='4' height='12'/><rect x='60' y='104' width='4' height='10'/></g>", 130)},linear-gradient(#e8f5e9,#f6f1e1)` },
  sheet: { label: '答案用紙', css: `linear-gradient(90deg,transparent 36px,#f2a7a7 36px 37px,transparent 37px),repeating-linear-gradient(#ffffff 0 27px,#d6dbe4 27px 28px)` },
  nightdesk: { label: '夜の自習机', dark: true, css: `${svg("<circle cx='96' cy='22' r='10' fill='#ffe8a3' opacity='.55'/><g fill='#ffffff' opacity='.7'><circle cx='20' cy='18' r='1.2'/><circle cx='54' cy='40' r='1'/><circle cx='12' cy='70' r='1'/></g><rect x='0' y='100' width='130' height='30' fill='#3b2f4a' opacity='.55'/><rect x='70' y='88' width='22' height='12' fill='#f8f1dc' opacity='.6'/>", 130)},radial-gradient(ellipse at 75% 15%,#ffe08a44,transparent 55%),linear-gradient(#18203f,#2b2d55)` },
  dawn: { label: '試験の朝', css: `${svg("<circle cx='92' cy='96' r='18' fill='#ffb36b' opacity='.45'/><g stroke='#ffffff' stroke-width='3' opacity='.5'><line x1='0' y1='30' x2='40' y2='30'/><line x1='60' y1='52' x2='120' y2='52'/></g>", 130)},linear-gradient(#ffe5c2,#ffc9a8 45%,#c9d8f2)` },
};

export function wallpaperOf(value: string) { return WALLPAPERS[value] ?? null; }

/**
 * D7（2026-10-30）ホームのステージの背景。value → 見本の色（一覧・ガチャの絵）と、明るさ。
 *   色・星・光・動きは styles/home-stage.css（ホームは [data-stage=...]、一覧の見本は [data-stage-swatch=...]）。ここは名前だけ。
 */
export const STAGES: Record<string, { label: string; light?: boolean }> = {
  cosmos: { label: '宇宙' },
  sunrise: { label: '朝焼けの丘', light: true },
  forest: { label: '森のこみち' },
  ocean: { label: '深い海' },
  sakura: { label: '夜桜' },
  library: { label: '夜の図書館' },
  candy: { label: 'おかしの国', light: true },
  aurora: { label: 'オーロラ' },
  neon: { label: 'ネオンの街' },
};
export function stageOf(value: string) { return STAGES[value] ?? null; }

/**
 * 2026-11-03 お供（ホームでとびら君のとなりにいる子）。
 *   絵は public/mascots/companion_key.webp の1枚（とびら君と同じ立体の絵柄で作った金のカギ「カギノスケ」）。
 *   色違いは画像を増やさず CSS の filter で作る（通信量を増やさない）。
 */
export const COMPANION_SRC = '/mascots/companion_key.webp';
export const COMPANIONS: Record<string, { label: string }> = {
  key_gold: { label: 'カギノスケ' },
  key_silver: { label: 'カギノスケ（ぎん）' },
  key_rose: { label: 'カギノスケ（さくら）' },
  key_mint: { label: 'カギノスケ（ミント）' },
  key_sky: { label: 'カギノスケ（そら）' },
  key_night: { label: 'カギノスケ（よぞら）' },
  key_aurora: { label: 'カギノスケ（オーロラ）' },
};
export function companionOf(value: string) { return COMPANIONS[value] ?? null; }
