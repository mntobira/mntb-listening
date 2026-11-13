/**
 * TOEIC® L&R リスニング（Part 2・Part 3・Part 4）全15回（各回12問＝180問・120トラック）
 */
import type { ToeicListeningRoundData } from './toeicListeningKit';
import { TOEIC_LISTENING_ROUNDS_01_03 } from './toeicListeningRounds01_03';
import { TOEIC_LISTENING_ROUNDS_04_06 } from './toeicListeningRounds04_06';
import { TOEIC_LISTENING_ROUNDS_07_09 } from './toeicListeningRounds07_09';
import { TOEIC_LISTENING_ROUNDS_10_12 } from './toeicListeningRounds10_12';
import { TOEIC_LISTENING_ROUNDS_13_15 } from './toeicListeningRounds13_15';

export const TOEIC_LISTENING_ROUNDS: readonly ToeicListeningRoundData[] = [
  ...TOEIC_LISTENING_ROUNDS_01_03,
  ...TOEIC_LISTENING_ROUNDS_04_06,
  ...TOEIC_LISTENING_ROUNDS_07_09,
  ...TOEIC_LISTENING_ROUNDS_10_12,
  ...TOEIC_LISTENING_ROUNDS_13_15,
];
