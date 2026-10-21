/**
 * 英文解釈（段落ごとに読む・内容一致の4択）の問題集と記録（2026-10-21）
 *   - 全レベルの文章をまとめ、出題時の選択肢の並びを設問IDから決める（何度解いても同じ・正解位置が偏らない）
 *   - 記録は端末（localStorage）に保存し、アカウント同期（userDataSyncCore の 'reading'）でほかの端末にもそろえる
 */
import { LEVEL1 } from './level1';
import { LEVEL2 } from './level2';
import { LEVEL3 } from './level3';
import { LEVEL4 } from './level4';
import { LEVEL5 } from './level5';
import { safeGetItem } from '../../utils/safeLocalStorage';
import { safeSetItem } from '../../utils/storageGuard';
import type { QType, ReadingLevel, ReadingPassage, ReadingQuestion } from './types';

export type { QType, ReadingLevel, ReadingPassage, ReadingQuestion } from './types';

export const READING_PASSAGES: readonly ReadingPassage[] = [...LEVEL1, ...LEVEL2, ...LEVEL3, ...LEVEL4, ...LEVEL5];

export const READING_LEVELS: readonly { level: ReadingLevel; name: string; target: string }[] = [
  { level: 1, name: 'Lv1 基礎', target: '高1・共通テスト基礎' },
  { level: 2, name: 'Lv2 標準', target: '共通テスト・日東駒専・産近甲龍' },
  { level: 3, name: 'Lv3 応用', target: 'GMARCH・関関同立・地方国立' },
  { level: 4, name: 'Lv4 難関', target: '早慶・旧帝大・難関国立' },
  { level: 5, name: 'Lv5 最難関', target: '東大・京大・医学部' },
];

export const passagesOf = (level: ReadingLevel) => READING_PASSAGES.filter(x => x.level === level);
export const findPassage = (id: string) => READING_PASSAGES.find(x => x.id === id);
export const wordCount = (text: string) => text.split(/\s+/).filter(w => /[A-Za-z0-9]/.test(w)).length;

/** 文字列 → 32bit の数（FNV-1a）。並び替えの種に使う */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

/** 出題時の選択肢（正解は先頭に書いてある）。設問IDから決まる順にならべ替える */
export function shuffledOptions(q: ReadingQuestion): { options: string[]; answerIndex: number } {
  let s = hash(q.id) || 1;
  const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 0x100000000; };
  const idx = [0, 1, 2, 3];
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j]!, idx[i]!]; }
  return { options: idx.map(i => q.options[i]!), answerIndex: idx.indexOf(0) };
}

// -------------------------------------------------------------------
// 段落ごとのページ（スクロールせずに読めるよう、1ページ＝1段落＋その段落の問い）
// -------------------------------------------------------------------

export interface ReadingStep { para: number; question: ReadingQuestion }
/** 段落の順に並べる。文章全体の問い（para=0）は最後のページ（最終段落を表示し、段落タブで見返せる） */
export function stepsOf(p: ReadingPassage, qs: readonly ReadingQuestion[] = p.questions): ReadingStep[] {
  const order = (q: ReadingQuestion) => q.para === 0 ? p.paragraphs.length + 1 : q.para;
  return [...qs].sort((a, b) => order(a) - order(b) || p.questions.indexOf(a) - p.questions.indexOf(b))
    .map(question => ({ para: question.para === 0 ? p.paragraphs.length : question.para, question }));
}
/** 根拠がある段落（1〜）。para=0 の問いは本文から探す */
export function evidencePara(p: ReadingPassage, q: ReadingQuestion): number {
  if (q.para > 0) return q.para;
  const i = p.paragraphs.findIndex(t => t.includes(q.evidence));
  return i >= 0 ? i + 1 : p.paragraphs.length;
}
/** 本文に文字どおり出てくるはずの表現か（〜・…・one's・A/B などの「型」は除く） */
export const isLiteralPhrase = (en: string) => !/[~〜…()（）ぁ-んァ-ン一-龥]|one's|oneself|\b[ABS]\b|p\.p\./.test(en);
/** その段落に出てくる重要表現。型（〜 を含むもの）は最初の段落にまとめて出す */
export function phrasesIn(p: ReadingPassage, para: number): (readonly [string, string])[] {
  const t = (p.paragraphs[para - 1] ?? '').toLowerCase();
  return p.phrases.filter(([en]) => isLiteralPhrase(en) ? t.includes(en.toLowerCase()) : para === firstParaOf(p, en));
}
/** 型の表現が最初に現れる段落（見つからなければ 1） */
function firstParaOf(p: ReadingPassage, en: string): number {
  const head = en.split(/[~〜…(（]/)[0]!.replace(/\b(one's|oneself|A|B|S)\b/g, '').trim().toLowerCase().split(/\s+/)[0] ?? '';
  const i = head.length >= 2 ? p.paragraphs.findIndex(t => t.toLowerCase().includes(head)) : -1;
  return i >= 0 ? i + 1 : 1;
}

// -------------------------------------------------------------------
// 出題形式と、その形式がよく出る大学（一般的な出題傾向の目安。特定の過去問ではない）
// -------------------------------------------------------------------

export const TYPE_LABEL: Record<QType, string> = {
  detail: '内容一致', reason: '理由', not: '本文にないもの', vocab: '語句の意味', paraphrase: '言い換え', inference: '推論', main: '主旨・要旨',
};
const BAND: Record<ReadingLevel, string> = {
  1: '共通テスト・日東駒専・産近甲龍', 2: '共通テスト・日東駒専・産近甲龍', 3: 'GMARCH・関関同立・地方国立',
  4: '早慶・上智・旧帝大', 5: '東大・京大・一橋・医学部',
};
const SPECIAL: Partial<Record<QType, Partial<Record<ReadingLevel, string>>>> = {
  not: { 1: '共通テストでおなじみの「述べられていないもの」', 2: '共通テストでおなじみの「述べられていないもの」', 3: '明治・法政・関西大などの内容不一致で頻出', 4: '早稲田（商・社学など）の NOT 型で頻出', 5: '国公立二次の選択式・医学部で出る形' },
  paraphrase: { 2: '共通テスト・中堅私大の下線部の意味', 3: '青山・立教・同志社などの下線部言い換えで頻出', 4: '早稲田・慶應・上智の下線部言い換えで頻出', 5: '東大の下線部和訳・京大の下線部説明の土台になる力' },
  inference: { 2: '共通テストの「推測できること」', 3: 'MARCH・関関同立の「本文から推測できること」', 4: '慶應（経済・法など）の推論型の内容一致で頻出', 5: '東大・一橋の内容説明で問われる行間の読み取り' },
  reason: { 3: '地方国立の「理由を説明せよ」を4択にした形', 4: '旧帝大の「理由を説明せよ」を4択にした形', 5: '東大・京大・阪大の「理由を説明せよ」を4択にした形' },
  main: { 1: '共通テストの「最も適切な要旨・タイトル」', 2: '共通テストの「最も適切な要旨・タイトル」', 3: '地方国立・MARCH の主旨選択', 4: '早慶・旧帝大の主旨・要旨選択', 5: '東大の要約（1A）・京大の論旨把握に直結する形' },
  detail: { 1: '共通テスト第4〜6問の内容一致', 2: '共通テスト第4〜6問の内容一致', 3: 'GMARCH・関関同立の内容一致で頻出', 4: '早慶の段落ごとの内容一致で頻出', 5: '京大・医学部の精読を4択にした形' },
};
const TIP: Record<QType, string> = {
  detail: '問いのキーワードを段落で探し、その一文と選択肢を照らし合わせる。',
  reason: 'because・since・for・so that などの因果のサインを探す。',
  not: '選択肢を1つずつ本文と照合し、書かれていないものを残す（消去法）。',
  vocab: '前後の文脈から意味を決める。辞書の第一義にとらわれない。',
  paraphrase: '下線部を自分の言葉に言い換えてから選択肢を見る。',
  inference: '本文から「確実に言えること」だけを選ぶ。言い過ぎ・逆の選択肢に注意。',
  main: '譲歩（〜ではない）のあとの however・rather・the point is に筆者の主張が来る。',
};
/** 解説の下に出す「出題傾向」（短く1行） */
export function examNote(level: ReadingLevel, type: QType): { label: string; where: string; tip: string } {
  return { label: TYPE_LABEL[type], where: SPECIAL[type]?.[level] ?? `${BAND[level]}で頻出の形式`, tip: TIP[type] };
}

/** 本文を「根拠の前・根拠・後ろ」に分ける（答えたあとに根拠へ色を付ける） */
export function splitEvidence(text: string, evidence: string | null): { before: string; mark: string; after: string } {
  const i = evidence ? text.indexOf(evidence) : -1;
  if (!evidence || i < 0) return { before: text, mark: '', after: '' };
  return { before: text.slice(0, i), mark: evidence, after: text.slice(i + evidence.length) };
}

// -------------------------------------------------------------------
// 記録
// -------------------------------------------------------------------

export interface ReadingBest { score: number; total: number; at: number }
export interface ReadingRecord {
  version: 1;
  /** 文章ごとの最高点 */
  best: Record<string, ReadingBest>;
  /** 間違えたままの設問ID（正解すると外れる） */
  missed: string[];
}

export const READING_KEY = (uid: string) => 'reading_quiz_v1_' + encodeURIComponent(uid);
const empty = (): ReadingRecord => ({ version: 1, best: {}, missed: [] });

export function isReadingRecord(v: unknown): v is ReadingRecord {
  return !!v && typeof v === 'object' && (v as ReadingRecord).version === 1
    && !!(v as ReadingRecord).best && typeof (v as ReadingRecord).best === 'object' && Array.isArray((v as ReadingRecord).missed);
}

export function readReadingRecord(uid: string): ReadingRecord {
  try {
    const v = JSON.parse(safeGetItem(READING_KEY(uid)) || 'null');
    return isReadingRecord(v) ? { version: 1, best: { ...v.best }, missed: v.missed.filter(x => typeof x === 'string') } : empty();
  } catch { return empty(); }
}

export function writeReadingRecord(uid: string, rec: ReadingRecord) {
  safeSetItem(READING_KEY(uid), JSON.stringify(rec)); // 容量不足などで保存できなくても解き続けられる
}

/** 1つの文章を解き終えたときの記録の更新 */
export function applyReadingResult(rec: ReadingRecord, passageId: string, results: readonly { questionId: string; correct: boolean }[], at = Date.now()): ReadingRecord {
  const score = results.filter(r => r.correct).length;
  const prev = rec.best[passageId];
  const best = !prev || score >= prev.score ? { ...rec.best, [passageId]: { score, total: results.length, at } } : rec.best;
  const missed = new Set(rec.missed);
  for (const r of results) { if (r.correct) missed.delete(r.questionId); else missed.add(r.questionId); }
  return { version: 1, best, missed: [...missed] };
}

export const isCleared = (rec: ReadingRecord, p: ReadingPassage) => {
  const b = rec.best[p.id];
  return !!b && b.score >= p.questions.length;
};
