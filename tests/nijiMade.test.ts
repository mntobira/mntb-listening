import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error 型定義のない .mjs（CLI 用のスクリプト）
import { parseUniversities } from '../scripts/gacha-prints/niji-made.mjs';
import { NIJI_UNIVERSITIES } from '../src/data/nijiMockPrints';

describe('niji:made（作成済みの大学の確認）', () => {
  it('台帳の NIJI_UNIVERSITIES をすべて読み取れる', () => {
    const got = parseUniversities(readFileSync('src/data/nijiMockPrints.ts', 'utf8'));
    expect(got).toEqual(NIJI_UNIVERSITIES.map((u) => ({ id: u.id, name: u.name, track: u.track })));
  });
  it('一覧がないファイルは空', () => {
    expect(parseUniversities('export const X = 1;')).toEqual([]);
  });
});
