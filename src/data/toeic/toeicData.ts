/**
 * TOEIC の教科データ（2026-10-31）：Part 5（短文穴埋め）と Part 6（長文穴埋め）を1つの教科にまとめる。
 *
 * 教科ID は Part 5 を始めたときの toeic_part5 のまま（進み具合・復習・ノートの記録を付け替えないため）。
 * 単元選択では parts の順に「Part 5」「Part 6」のタブになる。
 */
import { toeicPart5Data, getToeicPart5Stats, type ToeicPart } from './toeicPart5Data';
import { toeicPart6Data, getToeicPart6Stats } from './toeicPart6Data';

export const toeicData: { parts: ToeicPart[] } = {
  parts: [...toeicPart5Data.parts, ...toeicPart6Data.parts],
};

/** 収録状況（単元数・回数・問題数）。Part 5 と Part 6 の合計 */
export function getToeicStats() {
  const p5 = getToeicPart5Stats();
  const p6 = getToeicPart6Stats();
  return { chapters: p5.chapters + p6.chapters, questions: p5.questions + p6.questions, marks: p5.marks + p6.marks };
}
