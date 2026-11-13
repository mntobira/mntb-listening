/**
 * ===================================================================
 * TOEIC® L&R リスニング（Part 2・Part 3・Part 4）データ（2026-11-12）
 * ===================================================================
 *
 * Part 5・Part 6・Part 7 と同じ「parts → chapters → practiceProblems」の形。
 * 単元は1つ（tpl_1）で、その中に「第1回〜第15回」（1回＝Part 2 応答6問＋Part 3 会話3問＋Part 4 説明文3問＝12問）を並べる。
 * 教科は既存の TOEIC（toeic_part5）にまとめる。
 */
import type { Problem } from '../../types/curriculum';
import { applyListeningPostProcess } from '../listeningPostProcess';
import { countProblemsInChapters } from '../problemCount';
import type { ToeicChapter, ToeicPart } from './toeicPart5Data';
import {
  buildToeicListeningRound,
  TOEIC_LISTENING_CHAPTER_ID,
  type ToeicListeningRoundData,
} from './toeicListeningKit';
import { TOEIC_LISTENING_ROUNDS } from './toeicListeningRounds';

function buildProblems(rounds: readonly ToeicListeningRoundData[]): Problem[] {
  return rounds.map((roundData, i) => buildToeicListeningRound(i + 1, roundData) as unknown as Problem);
}

export const toeicListeningData: { parts: ToeicPart[] } = {
  parts: [
    {
      id: 'tpl',
      title: 'TOEIC リスニング',
      chapters: [
        {
          id: TOEIC_LISTENING_CHAPTER_ID,
          abstractTitle: 'リスニング 応答・会話・説明文',
          realTitle: 'リスニング',
          questionGroup: 'リスニング',
          topics: ['1回12問（Part 2 応答6・Part 3 会話3・Part 4 説明文3）', 'スクリプト・全訳・選択肢ごとの理由つき'],
          practiceProblems: buildProblems(TOEIC_LISTENING_ROUNDS),
          miniTest: [],
        },
      ],
    },
  ],
};

(() => {
  applyListeningPostProcess(toeicListeningData, { decisive: false });
  for (const c of toeicListeningData.parts.flatMap((p) => p.chapters)) {
    for (const problem of c.practiceProblems) {
      if (Array.isArray(problem.audioTracks)) {
        problem.explanationTracks = problem.audioTracks;
      }
      problem.stepwise = true;
    }
  }
})();

export function getAllToeicListeningChapters(): ToeicChapter[] {
  return toeicListeningData.parts.flatMap((p) => p.chapters);
}

/** 収録状況（単元数・回数・問題数）。データから数える */
export function getToeicListeningStats() {
  const chapters = getAllToeicListeningChapters();
  const questions = countProblemsInChapters(chapters);
  const marks = chapters.reduce(
    (sum, c) => sum + c.practiceProblems.reduce((n, p) => n + (Array.isArray(p?.subQuestions) ? p.subQuestions.length : 0), 0),
    0,
  );
  return { chapters: chapters.length, questions, marks };
}
