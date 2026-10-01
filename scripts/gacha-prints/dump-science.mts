/**
 * 理科・化学（無機）・数学の UR 学習プリント用に、アプリの手書きデータを JSON に書き出す。
 *   npx tsx scripts/gacha-prints/dump-science.mts  →  .tmpwork/science-raw.json
 * 文章はアプリのデータのまま（ここでは並べ替え・作文はしない）。
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import * as inorg from '../../src/data/inorganicProblems';
import * as metal from '../../src/data/inorganicMetalProblems';
import { MATH_CURRICULUM_UNITS, MATH_COURSES } from '../../src/data/mathCurriculum';
import { RIKA_ITEMS } from '../../src/features/rika/rikaData';
import { RIKA_SUMMARY } from '../../src/features/rika/rikaSummaryData';

const root = new URL('../../', import.meta.url);
mkdirSync(new URL('.tmpwork/', root), { recursive: true });

const inorganic = [...Object.values(inorg), ...Object.values(metal)]
  .filter(Array.isArray).flat()
  .map((p: any) => ({ id: p.id, category: p.category, text: p.text, explanation: p.explanation, subQuestions: p.subQuestions }));

const math = MATH_CURRICULUM_UNITS.map(u => ({
  id: u.id, course: MATH_COURSES.find(c => c.id === u.course)?.title ?? u.course, title: u.title,
  lesson: u.lesson, caution: u.caution, exercises: u.exercises,
}));

const rika = {
  items: RIKA_ITEMS.filter(i => i.format !== 'exam'),
  summary: RIKA_SUMMARY.map(ch => ({ id: ch.id, name: ch.name, field: ch.field, sections: ch.sections.map(s => ({ head: s.head, stars: s.stars, rank: s.rank, memo: s.memo, keywords: s.keywords, blocks: s.blocks })) })),
};

writeFileSync(new URL('.tmpwork/science-raw.json', root), JSON.stringify({ inorganic, math, rika }));
console.log('inorganic', inorganic.length, 'math units', math.length, 'rika items', rika.items.length);
