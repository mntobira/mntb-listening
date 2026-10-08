/**
 * 音読・ディクテーション（2026-10-08）— データと計算
 * ------------------------------------------------------------------
 * 音源の「単語ごとの時刻」は public/read_along/<フォルダ>/<音源名>.json に入っている
 * （scripts/readalong/align_readalong.py が、実際の音源を音声認識してスクリプトと突き合わせて作る）。
 *
 *   { v:1, src, dur, rate, lines:[ { who, w:[[表示語, 開始ms, 終了ms, ARPAbet], …] } ] }
 *
 * ここでは
 *   ・語群（意味のかたまり。スラッシュリーディングの区切り）
 *   ・音のつながり（連結・脱落・同化・弾音化）と、弱く読まれる語
 *   ・発音記号（ARPAbet → IPA）
 * を計算する。画面は ReadAlongStudio.tsx。
 */

/** [表示語, 開始ms, 終了ms, ARPAbet, 目立ち度0〜9（音源から測定）, つづりの音節 "um|brel|la", 強く読む音節の番号] */
export type RawWord = [text: string, startMs: number, endMs: number, arpabet: string, prom?: number, syl?: string, stressSyl?: number];
export interface ReadAlongFile { v: 1; src: string; dur: number; rate: number; lines: { who: string | null; w: RawWord[] }[] }

export type LinkKind = 'link' | 'drop' | 'assim' | 'flap' | 'same';
export interface RaWord {
  i: number; text: string; start: number; end: number; arpabet: string;
  line: number; chunk: number;
  /** 弱く（短く・あいまいに）読まれやすい機能語 */
  weak: boolean;
  /** 次の語との音のつながり */
  link: LinkKind | null;
  /** 音源で測った目立ち度（0〜9。大きく・高く・長く読まれたほど大きい） */
  prom: number;
  /** つづりの音節（1音節なら [語]） */
  syl: string[];
  /** 強く読む音節（syl の番号。無ければ -1） */
  stressSyl: number;
  /** 文の中での強さ：focus＝語群でいちばん強い／strong／mid／weak（弱く読む） */
  level: 'focus' | 'strong' | 'mid' | 'weak';
  /** 弱く読むときの発音記号（the → ðə） */
  weakIpa: string | null;
  /** 文末の抑揚（? の Yes/No 疑問 → up、それ以外の文末 → down） */
  tone: 'up' | 'down' | null;
}
export interface RaChunk { i: number; line: number; from: number; to: number; start: number; end: number; text: string }
export interface RaLine { who: string | null; words: RaWord[] }
export interface ReadAlong { dur: number; rate: number; words: RaWord[]; chunks: RaChunk[]; lines: RaLine[] }

/** 音源 URL → 時刻データの URL（/listening_q5/q5set01_lecture.mp3 → /read_along/listening_q5/q5set01_lecture.json） */
export function readAlongUrl(audioUrl: string | undefined | null): string | null {
  if (!audioUrl) return null;
  const m = /^\/([^/]+)\/([^/]+)\.mp3$/i.exec(audioUrl.trim());
  return m ? `/read_along/${m[1]}/${m[2]}.json` : null;
}

const cache = new Map<string, Promise<ReadAlong | null>>();
export function loadReadAlong(audioUrl: string | undefined | null): Promise<ReadAlong | null> {
  const url = readAlongUrl(audioUrl);
  if (!url || typeof fetch !== 'function') return Promise.resolve(null);
  let p = cache.get(url);
  if (!p) {
    p = fetch(url).then(r => (r.ok ? r.json() : null)).then(j => (j && j.v === 1 ? buildReadAlong(j as ReadAlongFile) : null)).catch(() => null);
    p.then(v => { if (!v) cache.delete(url); });
    cache.set(url, p);
  }
  return p;
}

// ------------------------------------------------------------------
// 語の正規化
// ------------------------------------------------------------------
export function normWord(s: string): string {
  return s.toLowerCase().replace(/[’‘]/g, "'").replace(/[éè]/g, 'e').replace(/[^a-z0-9'%$£€]/g, '').replace(/^'+|'+$/g, '');
}

/** 弱形で読まれやすい語（強調されない限り、母音があいまいになる・短くなる） */
export const WEAK_WORDS = new Set([
  'a', 'an', 'the', 'to', 'of', 'and', 'or', 'but', 'for', 'from', 'at', 'as', 'than', 'that',
  'can', 'could', 'would', 'should', 'will', 'shall', 'must', 'do', 'does', 'did', 'have', 'has', 'had',
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'him', 'her', 'his', 'them', 'us', 'your', 'you', 'some', 'there',
]);

const VOWEL = /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)/;
function phones(arpabet: string): string[] { return arpabet.split(/\s+/).filter(p => p && p !== '|'); }
const lastPhone = (w: RaWord) => { const p = phones(w.arpabet); return p[p.length - 1] ?? ''; };
const firstPhone = (w: RaWord) => phones(w.arpabet)[0] ?? '';
const endsSentence = (t: string) => /[.?!]["”']?$/.test(t);
const endsClause = (t: string) => /[,;:—–]["”']?$/.test(t);

/** 次の語との音のつながり（同じ語群の中・間がほぼ空いていないときだけ） */
export function linkKind(a: RaWord, b: RaWord): LinkKind | null {
  if (endsSentence(a.text) || endsClause(a.text)) return null;
  if (b.start - a.end > 90) return null;
  const x = lastPhone(a).replace(/\d/g, ''); const y = firstPhone(b).replace(/\d/g, '');
  if (!x || !y) return null;
  const xv = VOWEL.test(x); const yv = VOWEL.test(y);
  if ((x === 'D' || x === 'T') && y === 'Y') return 'assim';            // did you → ディジュ / want you → ウォンチュ
  if (x === y && !xv) return 'same';                                    // big girl / next time（同じ子音は1回）
  if (x === 'T' && yv && !/^(AH0|IH0)$/.test(firstPhone(b)) && /[aeiou]t$/i.test(normWord(a.text))) return 'flap'; // get up → ゲラップ
  if (!xv && yv) return 'link';                                         // pick it up → ピキラップ
  if ((x === 'T' || x === 'D') && !yv && y !== 'HH') return 'drop';     // just now / good night（t・d がほぼ聞こえない）
  return null;
}

/** 弱く読むときの発音（強く読むときは辞書どおり） */
export const WEAK_IPA: Record<string, string> = {
  a: 'ə', an: 'ən', the: 'ðə', to: 'tə', of: 'əv', and: 'ən', or: 'ɚ', but: 'bət', for: 'fɚ', from: 'frəm', at: 'ət', as: 'əz',
  than: 'ðən', that: 'ðət', can: 'kən', could: 'kəd', would: 'wəd', should: 'ʃəd', will: 'wəl', shall: 'ʃəl', must: 'məst',
  do: 'də', does: 'dəz', did: 'dɪd', have: 'həv', has: 'həz', had: 'həd', am: 'əm', is: 'ɪz', are: 'ɚ', was: 'wəz', were: 'wɚ',
  be: 'bi', been: 'bɪn', him: 'ɪm', her: 'hɚ', his: 'ɪz', them: 'ðəm', us: 'əs', your: 'jɚ', you: 'jə', some: 'səm', there: 'ðɚ',
};
const WH = new Set(['what', 'where', 'when', 'why', 'who', 'whom', 'whose', 'which', 'how']);

const CONJ = new Set(['and', 'but', 'because', 'so', 'when', 'if', 'which', 'who', 'where', 'while', 'although', 'though', 'before', 'after', 'until', 'since', 'unless', 'or', 'whether', 'whose']);
const PREP = new Set(['in', 'on', 'at', 'for', 'with', 'from', 'to', 'about', 'during', 'without', 'into', 'through', 'by', 'after', 'before', 'between', 'under', 'over', 'than']);

/** 時刻データ → 語・語群・つながり */
export function buildReadAlong(file: ReadAlongFile): ReadAlong {
  const words: RaWord[] = [];
  file.lines.forEach((ln, li) => ln.w.forEach(([text, s, e, a, prom, syl, st]) => {
    const key = normWord(text);
    words.push({
      i: words.length, text, start: s, end: Math.max(e, s + 40), arpabet: a || '', line: li, chunk: 0,
      weak: WEAK_WORDS.has(key), link: null,
      prom: typeof prom === 'number' ? prom : 5,
      syl: syl ? syl.split('|') : [text], stressSyl: typeof st === 'number' && syl ? st : -1,
      level: 'mid', weakIpa: null, tone: null,
    });
  }));
  // 語群：文末・句読点・話者の交替・ポーズで切る。長いときは接続詞・前置詞の前でも切る
  const chunks: RaChunk[] = [];
  let from = 0;
  const close = (to: number) => {
    if (to < from) return;
    const ws = words.slice(from, to + 1);
    chunks.push({ i: chunks.length, line: ws[0].line, from, to, start: ws[0].start, end: ws[ws.length - 1].end, text: ws.map(w => w.text).join(' ') });
    ws.forEach(w => { w.chunk = chunks.length - 1; });
    from = to + 1;
  };
  for (let k = 0; k < words.length; k++) {
    const w = words[k]; const nx = words[k + 1];
    if (!nx) { close(k); break; }
    const len = k - from + 1;
    const gap = nx.start - w.end;
    const n = normWord(nx.text);
    if (nx.line !== w.line || endsSentence(w.text) || endsClause(w.text) || gap >= 260
      || (len >= 3 && CONJ.has(n)) || (len >= 4 && PREP.has(n)) || len >= 8) close(k);
  }
  for (let k = 0; k + 1 < words.length; k++) {
    if (words[k].chunk === words[k + 1].chunk) words[k].link = linkKind(words[k], words[k + 1]);
  }
  // 強弱：内容語は mid、音源で目立っていれば strong、語群でいちばん強い語は focus。
  //       機能語は、音源でも目立っていなければ weak（弱形の発音を出す）
  for (const w of words) {
    const strongBySound = w.prom >= 6;
    if (w.weak) w.level = w.prom >= 8 ? 'strong' : 'weak';
    else w.level = strongBySound ? 'strong' : 'mid';
    if (w.level === 'weak') w.weakIpa = WEAK_IPA[normWord(w.text)] ?? null;
  }
  for (const c of chunks) {
    const ws = words.slice(c.from, c.to + 1).filter(w => w.level !== 'weak');
    if (!ws.length) continue;
    const top = ws.reduce((a, b) => (b.prom > a.prom || (b.prom === a.prom && b.i > a.i) ? b : a));
    if (top.prom >= 5) top.level = 'focus';
  }
  // 文末の抑揚：Yes/No 疑問（? で、疑問詞で始まらない）は上げる、それ以外の文末は下げる
  let sStart = 0;
  for (let k = 0; k < words.length; k++) {
    const w = words[k]; const nx = words[k + 1];
    const end = !nx || nx.line !== w.line || endsSentence(w.text);
    if (!end) continue;
    // 疑問詞の疑問（What…?）と、A or B? の選ぶ疑問は下げる。それ以外の ?（Yes/No 疑問）は上げる
    if (/\?["”')]*$/.test(w.text)) {
      const sent = words.slice(sStart, k + 1).map(x => normWord(x.text));
      w.tone = WH.has(sent[0]) || sent.slice(1).includes('or') ? 'down' : 'up';
    }
    else if (/[.!]["”')]*$/.test(w.text)) w.tone = 'down';
    sStart = k + 1;
  }
  const lines: RaLine[] = file.lines.map((ln, li) => ({ who: ln.who, words: words.filter(w => w.line === li) }));
  return { dur: file.dur, rate: file.rate, words, chunks, lines };
}

/** いま鳴っている語（ms）。語と語のすき間では直前の語のまま */
export function wordAt(words: RaWord[], ms: number): number {
  let lo = 0, hi = words.length - 1, ans = -1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (words[mid].start <= ms) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
  return ans;
}

export const LINK_LABEL: Record<LinkKind, { name: string; tip: string }> = {
  link: { name: '連結', tip: '前の語の最後の子音と、次の語の頭の母音がつながる（pick it up → ピキラップ）' },
  drop: { name: '脱落', tip: '語の終わりの t・d がほとんど聞こえない（just now → ジャス(ト)ナウ）' },
  assim: { name: '同化', tip: 't・d と次の you がまざって「チュ」「ジュ」になる（did you → ディジュ）' },
  flap: { name: '弾音', tip: '母音にはさまれた t が軽い「ラ」のような音になる（get up → ゲラップ）' },
  same: { name: '同じ音', tip: '同じ子音が続くと1回だけ発音する（next time → ネクスタイム）' },
};

// ------------------------------------------------------------------
// 発音記号（ARPAbet → IPA）
// ------------------------------------------------------------------
const IPA: Record<string, string> = {
  AA: 'ɑ', AE: 'æ', AH: 'ʌ', AO: 'ɔ', AW: 'aʊ', AY: 'aɪ', B: 'b', CH: 'tʃ', D: 'd', DH: 'ð', EH: 'ɛ', ER: 'ɝ', EY: 'eɪ',
  F: 'f', G: 'ɡ', HH: 'h', IH: 'ɪ', IY: 'i', JH: 'dʒ', K: 'k', L: 'l', M: 'm', N: 'n', NG: 'ŋ', OW: 'oʊ', OY: 'ɔɪ',
  P: 'p', R: 'r', S: 's', SH: 'ʃ', T: 't', TH: 'θ', UH: 'ʊ', UW: 'u', V: 'v', W: 'w', Y: 'j', Z: 'z', ZH: 'ʒ',
};
const ONSETS = new Set([
  ...'B CH D DH F G HH JH K L M N P R S SH T TH V W Y Z ZH'.split(' '),
  ...['B','D','F','G','K','P','T','TH','SH'].flatMap(c => [`${c} R`, `${c} L`, `${c} W`, `${c} Y`]),
  'S P', 'S T', 'S K', 'S M', 'S N', 'S L', 'S W', 'S P R', 'S T R', 'S K R', 'S P L', 'S K W', 'M Y', 'N Y', 'V Y', 'H Y', 'HH Y',
]);
function ipaWord(arpa: string): { ipa: string; syllables: number; stressAt: number } {
  const ps = phones(arpa);
  const vowels = ps.map((p, k) => (VOWEL.test(p) ? k : -1)).filter(k => k >= 0);
  const syllables = vowels.length;
  let stressAt = -1;
  const out: string[] = ps.map(p => {
    const base = p.replace(/\d/g, '');
    if (base === 'AH' && p.endsWith('0')) return 'ə';
    if (base === 'ER' && p.endsWith('0')) return 'ɚ';
    if (base === 'IH' && p.endsWith('0')) return 'ɪ';
    return IPA[base] ?? base.toLowerCase();
  });
  if (syllables > 1) {
    const sv = ps.findIndex(p => /1$/.test(p));
    if (sv >= 0) {
      stressAt = vowels.indexOf(sv) + 1;
      // 強勢記号は、母音の直前の子音（1つ）の前に置く（だいたいの音節の頭）
      // 強勢記号は音節の頭に置く（母音の前の子音のうち、語頭に立てるかたまり：br・pl・st・str など）
      let at = sv;
      while (at > 0 && !VOWEL.test(ps[at - 1]) && ONSETS.has(ps.slice(at - 1, sv).map(p => p.replace(/\d/g, '')).join(' '))) at -= 1;
      out.splice(at, 0, 'ˈ');
    }
  }
  return { ipa: out.join(''), syllables, stressAt };
}
/** 表示語の発音記号（ハイフン語・数字は部分ごと）。辞書に無い語は '' */
export function toIpa(arpabet: string): { ipa: string; syllables: number; stressAt: number } {
  if (!arpabet) return { ipa: '', syllables: 0, stressAt: -1 };
  const parts = arpabet.split('|').map(s => ipaWord(s.trim()));
  return { ipa: parts.map(p => p.ipa).join(' '), syllables: parts.reduce((a, p) => a + p.syllables, 0), stressAt: parts.length === 1 ? parts[0].stressAt : -1 };
}
