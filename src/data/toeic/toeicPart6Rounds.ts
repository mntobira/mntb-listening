/**
 * TOEIC Part 6 の回の並び（第1回〜）。1回＝文書4つ（ToeicP6Set を4つ）。
 * 回を足したら toeicPart6RoundNN.ts を作り、ここに1行足す（Part 5 の toeicPart5Rounds.ts と同じ）。
 *
 * 2026-10-30：準備だけ。2026-10-31：問題を入れ始めた（第1回〜）。
 */
import type { ToeicP6Set } from './toeicPart6Kit';
import { P6_ROUND_01 } from './toeicPart6Round01';
import { P6_ROUND_02 } from './toeicPart6Round02';
import { P6_ROUND_03 } from './toeicPart6Round03';
import { P6_ROUND_04 } from './toeicPart6Round04';
import { P6_ROUND_05 } from './toeicPart6Round05';
import { P6_ROUND_06 } from './toeicPart6Round06';
import { P6_ROUND_07 } from './toeicPart6Round07';
import { P6_ROUND_08 } from './toeicPart6Round08';
import { P6_ROUND_09 } from './toeicPart6Round09';
import { P6_ROUND_10 } from './toeicPart6Round10';

export const TOEIC_P6_ROUNDS: readonly ToeicP6Set[][] = [
  P6_ROUND_01,
  P6_ROUND_02,
  P6_ROUND_03,
  P6_ROUND_04,
  P6_ROUND_05,
  P6_ROUND_06,
  P6_ROUND_07,
  P6_ROUND_08,
  P6_ROUND_09,
  P6_ROUND_10,
];
