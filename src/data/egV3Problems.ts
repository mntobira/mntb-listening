/**
 * ===================================================================
 * 英文法 第1〜16章（4択・全729問）を「1回5問」の大問に組み立てる
 * ===================================================================
 *
 * ■ 元データ
 *   3つの納品（1〜7章 245問／8〜11章 287問 v3／12〜16章 197問 v3）を
 *   scripts/data/grammar_v3/normalize.py で1つの形にそろえ、
 *   build_ts.py で egV3Items.generated.ts に書き出している。
 *   ★内部用の番号対応表（教科書番号との対応）は読み込んでいない★
 *
 * ■ 解説の形をそろえた（2026-10-03）
 *   3つの納品は解説の書き方が少しずつ違った。
 *     1〜7章  … 【ポイント】【訳】【注意】＋選択肢ごとの理由
 *     8〜11章 … 【着眼点】【ポイント】【プラス】＋選択肢ごとの理由＋和訳（いちばん情報が多い）
 *     12〜16章… 一言ポイント＋解説本文＋選択肢ごとの ○／×
 *   いちばん情報が多く、解く順番どおりに読める 8〜11章の形にそろえた。
 *     【着眼点】→【ポイント】→【選択肢】①〜④の ○／× と理由 →【プラス】
 *   和訳は「完成した英文」の枠の中に出す（どの章も同じ位置）。
 *   元データに無い段（1〜7章・12〜16章の【着眼点】など）は作らない。
 *
 * ■ 画面は変えない
 *   buildEgSet() に流すだけなので、問題画面・1問ずつの進み方・
 *   解説の1画面表示（選択肢に正誤 → 完成文と和訳 → 詳しい解説）は今までどおり。
 */

import { buildEgSet, EG_MARKS, type EgItem, type GrammarProblem } from './englishGrammarKit';
import { EG_V3_ITEMS, type EgV3Item } from './egV3Items.generated';

/** 1回あたりの問題数（今までの英文法と同じ5問） */
const SET_SIZE = 5;

/** 章番号 → 単元 id（eg6_1 〜 eg6_16） */
export const egV3ChapterId = (chapter: number): string => `eg6_${chapter}`;

function toEgItem(x: EgV3Item): EgItem {
  return {
    topic: x.g,
    focus: x.g.length > 24 ? `${x.g.slice(0, 23)}…` : x.g,
    sentence: x.s,
    choices: x.o,
    answer: EG_MARKS[x.a],
    full: x.f,
    translation: x.tr,
    // 完成文の中で正解の部分に黄色いマーカーを付け、文法事項を添える
    keyPhrases: [{ phrase: x.k, meaning: x.km }],
    theme: x.th,
    type: '4択',
    difficulty: x.tl >= 25 ? 3 : 2,
    steps: [],
    commentary: x.cm,
  };
}

/** 章ごとの元データ（問題番号順） */
const byChapter = new Map<number, EgV3Item[]>();
for (const item of EG_V3_ITEMS) {
  const list = byChapter.get(item.c) || [];
  list.push(item);
  byChapter.set(item.c, list);
}
for (const list of byChapter.values()) list.sort((a, b) => a.n - b.n);

export type EgV3Chapter = { chapter: number; title: string; topics: string[]; problems: GrammarProblem[] };

function uniq(values: string[]): string[] {
  return [...new Set(values.map((v) => v.replace(/[（(].*$/u, '').trim()).filter(Boolean))];
}

export const egV3Chapters: EgV3Chapter[] = [...byChapter.keys()]
  .sort((a, b) => a - b)
  .map((chapter) => {
    const items = byChapter.get(chapter) || [];
    const title = items[0]?.t || `第${chapter}章`;
    const chapterId = egV3ChapterId(chapter);
    const problems: GrammarProblem[] = [];
    for (let i = 0; i < items.length; i += SET_SIZE) {
      const chunk = items.slice(i, i + SET_SIZE);
      const setNo = i / SET_SIZE + 1;
      const from = chunk[0].n;
      const to = chunk[chunk.length - 1].n;
      const points = uniq(chunk.map((x) => x.g));
      const head = points.slice(0, 2).join('／');
      problems.push(
        buildEgSet(
          {
            chapterId,
            setNo,
            unitTitle: `第${chapter}章 ${title}`,
            category: `No.${from}〜${to}　${head.length > 34 ? `${head.slice(0, 33)}…` : head}`,
            intro: `第${chapter}章「${title}」No.${from}〜${to}。空所の前後のどこを見れば形が決まるかを確かめながら、1問ずつ解いていきましょう。`,
            summary: points,
            surroundingKnowledge: [],
            deepDiveTopics: [],
          },
          chunk.map(toEgItem),
        ),
      );
      const built = problems[problems.length - 1] as any;
      built.keyPhrasesOnly = true;
      // 対戦用：元データの制限時間と、試合後に出す1行解答（答え＋ひと言）
      built.subQuestions.forEach((sq: any, si: number) => {
        sq.battleTimeLimit = chunk[si].tl;
        sq.oneLine = chunk[si].one;
      });
    }
    return { chapter, title, topics: uniq(items.map((x) => x.g)).slice(0, 5), problems };
  });
