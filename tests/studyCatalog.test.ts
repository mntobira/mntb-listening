import { describe, expect, it } from 'vitest';
import { STUDY_CATALOG } from '../src/data/studyCatalog';

describe('TOEIC spotlight card', () => {
  it('presents the TOEIC® L&R TEST listening and reading offering without part-number branding', () => {
    const card = STUDY_CATALOG.find((subject) => subject.id === 'english')?.contents
      .find((content) => content.id === 'english_toeic');

    expect(card?.title).toBe('TOEIC® L&R TEST');
    expect(card?.description).toBe('リスニング・リーディング（穴埋め／読解）');
  });
});
