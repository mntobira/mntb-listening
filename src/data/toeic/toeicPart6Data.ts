/**
 * ===================================================================
 * TOEIC® L&R Part 6（長文穴埋め）データ（2026-10-30 準備 → 2026-10-31 問題を入れて画面につなぐ）
 * ===================================================================
 *
 * Part 5（toeicPart5Data.ts）と同じ「parts → chapters → practiceProblems」の形。
 * 単元は1つ（tp6_1）で、その中に「第1回〜」（1回＝文書4つ・16問）を並べる。
 * 教科は Part 5 と同じ「TOEIC」（toeic_part5）。toeicData.ts で Part 5 と1つにまとめて登録簿につなぐ。
 *
 * ■ 問題は音を出さない（Part 5・英文法と同じ扱い）
 *   完成文・全訳・語句は、解説の表示用に文字だけ持つ（explanationTracks）。
 */
import type { Problem } from '../../types/curriculum';
import { applyListeningPostProcess } from '../listeningPostProcess';
import { countProblemsInChapters } from '../problemCount';
import type { ToeicChapter, ToeicPart } from './toeicPart5Data';
import { buildToeicP6Round, TOEIC_P6_CHAPTER_ID, type ToeicP6Set } from './toeicPart6Kit';
import { TOEIC_P6_ROUNDS } from './toeicPart6Rounds';

function buildProblems(rounds: readonly (readonly ToeicP6Set[])[]): Problem[] {
  return rounds.map((sets, i) => buildToeicP6Round({ round: i + 1 }, sets) as unknown as Problem);
}

export const toeicPart6Data: { parts: ToeicPart[] } = {
  parts: [
    {
      id: 'tp6',
      title: 'TOEIC Part 6 長文穴埋め',
      chapters: [
        {
          id: TOEIC_P6_CHAPTER_ID,
          abstractTitle: 'Part 6 長文穴埋め',
          realTitle: 'Part 6',
          questionGroup: 'Part 6',
          topics: ['1回 文書4つ・16問・4択', '文法・語彙・つなぎの語句・文挿入'],
          practiceProblems: buildProblems(TOEIC_P6_ROUNDS),
          miniTest: [],
        },
      ],
    },
  ],
};

/** 解説の整形（Part 5 と同じ経路）と、音を出さない設定 */
(() => {
  applyListeningPostProcess(toeicPart6Data, { decisive: false });
  for (const c of toeicPart6Data.parts.flatMap((p) => p.chapters)) {
    for (const problem of c.practiceProblems) {
      if (Array.isArray(problem.audioTracks)) problem.explanationTracks = problem.audioTracks;
      delete problem.audioTracks;
      problem.stepwise = true;
      if (typeof problem.explanation === 'string') {
        problem.explanation = problem.explanation
          .replace(/SCRIPT ／ 実際に流れた英文/g, 'ANSWER ／ 完成した英文')
          .replace(/解答の道すじ/g, '解説');
      }
    }
  }
})();

export function getAllToeicPart6Chapters(): ToeicChapter[] {
  return toeicPart6Data.parts.flatMap((p) => p.chapters);
}

/** 収録状況（単元数・回数・問題数）。データから数える */
export function getToeicPart6Stats() {
  const chapters = getAllToeicPart6Chapters();
  const questions = countProblemsInChapters(chapters);
  const marks = chapters.reduce(
    (sum, c) => sum + c.practiceProblems.reduce((n, p) => n + (Array.isArray(p?.subQuestions) ? p.subQuestions.length : 0), 0),
    0,
  );
  return { chapters: chapters.length, questions, marks };
}
