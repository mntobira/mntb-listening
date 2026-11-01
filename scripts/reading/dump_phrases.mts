import { READING_PASSAGES } from '../../src/data/reading';
console.log(JSON.stringify(READING_PASSAGES.map(p => ({ id: p.id, phrases: p.phrases }))));
