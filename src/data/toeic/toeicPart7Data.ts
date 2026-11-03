/**
 * ===================================================================
 * TOEIC® L&R Part 7（読解）データ（2026-11-02）
 * ===================================================================
 *
 * Part 6（toeicPart6Data.ts）と同じ「parts → chapters → practiceProblems」の形。
 * 単元は1つ（tp7_1）で、その中に「第1回〜」（1回＝7セット・24問）を並べる。
 * 教科は Part 5・6 と同じ「TOEIC」（toeic_part5）。toeicData.ts でまとめて登録簿につなぐ。
 *
 * ■ 問題は音を出さない（Part 5・6 と同じ扱い）
 *   文書・和訳・語句は、解説の表示用に文字だけ持つ（explanationTracks）。
 */
import type { Problem } from '../../types/curriculum';
import { applyListeningPostProcess } from '../listeningPostProcess';
import { countProblemsInChapters } from '../problemCount';
import type { ToeicChapter, ToeicPart } from './toeicPart5Data';
import { buildToeicP7Round, TOEIC_P7_CHAPTER_ID, type ToeicP7Set } from './toeicPart7Kit';
import { TOEIC_P7_ROUNDS } from './toeicPart7Rounds';

function buildProblems(rounds: readonly (readonly ToeicP7Set[])[]): Problem[] {
  return rounds.map((sets, i) => buildToeicP7Round({ round: i + 1 }, sets) as unknown as Problem);
}

export const toeicPart7Data: { parts: ToeicPart[] } = {
  parts: [
    {
      id: 'tp7',
      title: 'TOEIC Part 7 読解',
      chapters: [
        {
          id: TOEIC_P7_CHAPTER_ID,
          abstractTitle: 'Part 7 読解',
          realTitle: 'Part 7',
          questionGroup: 'Part 7',
          topics: ['1回 7セット・24問・4択', '1つの文書・2つの文書・3つの文書'],
          practiceProblems: buildProblems(TOEIC_P7_ROUNDS),
          miniTest: [],
        },
      ],
    },
  ],
};

/** 解説の整形（Part 5・6 と同じ経路）と、音を出さない設定 */
(() => {
  applyListeningPostProcess(toeicPart7Data, { decisive: false });
  for (const c of toeicPart7Data.parts.flatMap((p) => p.chapters)) {
    for (const problem of c.practiceProblems) {
      if (Array.isArray(problem.audioTracks)) problem.explanationTracks = problem.audioTracks;
      delete problem.audioTracks;
      problem.stepwise = true;
      if (typeof problem.explanation === 'string') {
        problem.explanation = problem.explanation
          .replace(/SCRIPT ／ 実際に流れた英文/g, 'DOCUMENTS ／ 文書')
          .replace(/解答の道すじ/g, '解説');
      }
    }
  }
})();

export function getAllToeicPart7Chapters(): ToeicChapter[] {
  return toeicPart7Data.parts.flatMap((p) => p.chapters);
}

/** 収録状況（単元数・回数・問題数）。データから数える */
export function getToeicPart7Stats() {
  const chapters = getAllToeicPart7Chapters();
  const questions = countProblemsInChapters(chapters);
  const marks = chapters.reduce(
    (sum, c) => sum + c.practiceProblems.reduce((n, p) => n + (Array.isArray(p?.subQuestions) ? p.subQuestions.length : 0), 0),
    0,
  );
  return { chapters: chapters.length, questions, marks };
}
