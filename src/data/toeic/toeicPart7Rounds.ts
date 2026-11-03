/**
 * TOEIC Part 7 の回の並び（第1回〜）。1回＝セット7つ（1つの文書5・2つの文書1・3つの文書1）。
 * 回を足したら toeicPart7RoundNN.ts を作り、ここに1行足す（Part 5・6 の Rounds と同じ）。
 *
 * 2026-11-02：始めた。
 */
import type { ToeicP7Set } from './toeicPart7Kit';
import { P7_ROUND_01 } from './toeicPart7Round01';
import { P7_ROUND_02 } from './toeicPart7Round02';
import { P7_ROUND_03 } from './toeicPart7Round03';
import { P7_ROUND_04 } from './toeicPart7Round04';
import { P7_ROUND_05 } from './toeicPart7Round05';
import { P7_ROUND_06 } from './toeicPart7Round06';
import { P7_ROUND_07 } from './toeicPart7Round07';
import { P7_ROUND_08 } from './toeicPart7Round08';
import { P7_ROUND_09 } from './toeicPart7Round09';
import { P7_ROUND_10 } from './toeicPart7Round10';
import { P7_ROUND_11 } from './toeicPart7Round11';
import { P7_ROUND_12 } from './toeicPart7Round12';
import { P7_ROUND_13 } from './toeicPart7Round13';
import { P7_ROUND_14 } from './toeicPart7Round14';
import { P7_ROUND_15 } from './toeicPart7Round15';

export const TOEIC_P7_ROUNDS: readonly ToeicP7Set[][] = [
  P7_ROUND_01,
  P7_ROUND_02,
  P7_ROUND_03,
  P7_ROUND_04,
  P7_ROUND_05,
  P7_ROUND_06,
  P7_ROUND_07,
  P7_ROUND_08,
  P7_ROUND_09,
  P7_ROUND_10,
  P7_ROUND_11,
  P7_ROUND_12,
  P7_ROUND_13,
  P7_ROUND_14,
  P7_ROUND_15,
];
