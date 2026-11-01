import { describe, expect, it } from 'vitest';
import { STUDY_CATALOG } from '../src/data/studyCatalog';

describe('TOEIC spotlight card', () => {
  // 2026-11-01 Part 6 を足したので、入口の説明は「Part 5・Part 6」（以前は「まずはPart 5を試験導入」）
  it('presents Part 5 and Part 6 as the TOEIC offering', () => {
    const card = STUDY_CATALOG.find((subject) => subject.id === 'english')?.contents
      .find((content) => content.id === 'english_toeic');

    expect(card?.title).toBe('TOEIC');
    expect(card?.description).toBe('Part 5・Part 6');
  });
});
