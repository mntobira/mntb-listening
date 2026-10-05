import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// 2026-10-05：first の意味が「第／の」（数字の抜け）になっていた。助詞だけ・数字の抜けが残らないこと
it('単語帳・対戦の意味に「第／の」のような表記くずれが無い', () => {
  const d = JSON.parse(readFileSync('public/data/listeningVocabulary.json', 'utf8'));
  const lone = /(^|／)(第|の|を|に|が|は)(／|$)/;
  const bad = d.words.filter((w: { meaning: string; fullMeaning: string }) => lone.test(w.meaning) || lone.test(w.fullMeaning));
  expect(bad.map((w: { word: string }) => w.word)).toEqual([]);
  const first = d.words.find((w: { word: string }) => w.word === 'first');
  expect(first.meaning).toContain('最初の');
  expect(readFileSync('src/battle/data/pool.english_vocab.generated.ts', 'utf8')).not.toContain('第／の');
});
