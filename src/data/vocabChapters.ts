/**
 * 英単語・英熟語の「分け方」（2026-10-01）。
 *
 * 5,700語あまりを 1本の一覧で 20語ずつ区切ると「第1章〜第154章」になり、
 * どこまで進んだか・どこを開けばよいかが分からなくなる。
 * そこで 3段に分ける：
 *
 *   レベル（単語・基礎 など） → まとまり（100語＝5章） → 章（20語）
 *
 * 章の番号はレベルごとに 1 から数え直すので、「単語・基礎の第3章」で場所が一意に決まる。
 * 語の並びはデータの並び（頻度順）をそのまま使い、ここでは並べ替えない。
 */
export const CHAPTER_SIZE = 20;
export const CHAPTERS_PER_BLOCK = 5;

export interface VocabChapter {
  /** 0 始まりの章番号（レベル内） */
  index: number;
  /** レベル内の語番号（1 始まり・両端を含む） */
  from: number;
  to: number;
  ids: string[];
  learned: number;
}

export interface VocabBlock {
  /** 0 始まり */
  index: number;
  from: number;
  to: number;
  chapters: VocabChapter[];
  learned: number;
  total: number;
}

/** 語の配列を 20語の章に分ける。覚えた数も数える。 */
export function splitChapters(ids: readonly string[], known: ReadonlySet<string>, size = CHAPTER_SIZE): VocabChapter[] {
  const out: VocabChapter[] = [];
  for (let i = 0; i < ids.length; i += size) {
    const part = ids.slice(i, i + size);
    out.push({ index: out.length, from: i + 1, to: i + part.length, ids: part, learned: part.reduce((n, id) => n + (known.has(id) ? 1 : 0), 0) });
  }
  return out;
}

/** 章を 5章（100語）ずつのまとまりにする。 */
export function groupBlocks(chapters: readonly VocabChapter[], per = CHAPTERS_PER_BLOCK): VocabBlock[] {
  const out: VocabBlock[] = [];
  for (let i = 0; i < chapters.length; i += per) {
    const part = chapters.slice(i, i + per);
    out.push({
      index: out.length, from: part[0].from, to: part[part.length - 1].to, chapters: part,
      learned: part.reduce((n, c) => n + c.learned, 0), total: part.reduce((n, c) => n + c.ids.length, 0),
    });
  }
  return out;
}

/** 「続きから」：まだ全部は覚えていない最初の章。全部覚えていれば最後の章。 */
export function nextChapter(chapters: readonly VocabChapter[]): number {
  const i = chapters.findIndex(c => c.learned < c.ids.length);
  return i < 0 ? Math.max(0, chapters.length - 1) : i;
}

/** 章の状態（地図の色分け用） */
export function chapterState(c: Pick<VocabChapter, 'learned' | 'ids'>): 'done' | 'doing' | 'new' {
  return c.learned >= c.ids.length ? 'done' : c.learned > 0 ? 'doing' : 'new';
}
