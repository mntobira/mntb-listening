import { describe, expect, it } from 'vitest';
import { applyReadingResult, evidencePara, examNote, isCleared, isLiteralPhrase, phrasesIn, READING_LEVELS, READING_PASSAGES, passagesOf, shuffledOptions, splitEvidence, stepsOf, wordCount, type ReadingRecord } from '../src/data/reading';
import { READING_PASSAGE_COUNT } from '../src/data/reading/meta';
import { STUDY_CATALOG } from '../src/data/studyCatalog';
import { SYNC_SECTIONS, sectionField } from '../src/utils/userDataSyncCore';
import { readFileSync } from 'node:fs';

/** 英文解釈の問題データを全問チェックする（2026-10-21） */
describe('英文解釈：問題データ', () => {
  it('題数の表示（meta）が実際の数と一致する', () => {
    expect(READING_PASSAGES.length).toBe(READING_PASSAGE_COUNT);
  });

  it('5レベルすべてに文章があり、どのレベルにも12題以上', () => {
    for (const l of READING_LEVELS) expect(passagesOf(l.level).length, l.name).toBeGreaterThanOrEqual(12);
  });

  it('文章・設問のIDが重複しない（記録のキーになる）', () => {
    const ids = READING_PASSAGES.flatMap(p => [p.id, ...p.questions.map(q => q.id)]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of READING_PASSAGES) for (const q of p.questions) expect(q.id.startsWith(p.id + '-'), q.id).toBe(true);
  });

  it('段落ごとのページ：3〜4段落、1段落はスマホ1画面に収まる量（Lv1〜3 ≦ 90語・Lv4〜5 ≦ 100語）', () => {
    for (const p of READING_PASSAGES) {
      expect(p.paragraphs.length, p.id).toBeGreaterThanOrEqual(3);
      expect(p.paragraphs.length, p.id).toBeLessThanOrEqual(4);
      const cap = p.level <= 3 ? 90 : 100;
      p.paragraphs.forEach((t, i) => {
        const n = wordCount(t);
        expect(n, `${p.id} 第${i + 1}段落 ${n}語`).toBeLessThanOrEqual(cap);
        expect(n, `${p.id} 第${i + 1}段落 ${n}語`).toBeGreaterThanOrEqual(25);
      });
    }
  });

  it('レベルが上がるほど文章が長い（平均語数が単調に増える）', () => {
    const avg = READING_LEVELS.map(l => { const ps = passagesOf(l.level); return ps.reduce((s, p) => s + wordCount(p.text), 0) / ps.length; });
    for (let i = 1; i < avg.length; i++) expect(avg[i]!, `Lv${i + 1}`).toBeGreaterThan(avg[i - 1]!);
  });

  it('どの段落も、いずれかのページで読む（最後の段落は全体の問いと同じページでもよい）', () => {
    for (const p of READING_PASSAGES) {
      const shown = new Set(stepsOf(p).map(s => s.para));
      for (let k = 1; k <= p.paragraphs.length; k++) expect(shown.has(k), `${p.id} 第${k}段落`).toBe(true);
      // 全体の問い以外は、段落ごとに1問以上
      for (let k = 1; k < p.paragraphs.length; k++) expect(p.questions.some(q => q.para === k), `${p.id} 第${k}段落`).toBe(true);
    }
  });

  it('重要表現：型でない表現は本文に文字どおり出てくる', () => {
    for (const p of READING_PASSAGES) {
      expect(p.phrases.length, p.id).toBeGreaterThanOrEqual(3);
      for (const [en, ja] of p.phrases) {
        expect(ja.length, `${p.id} ${en}`).toBeGreaterThan(0);
        if (isLiteralPhrase(en)) expect(p.text.toLowerCase().includes(en.toLowerCase()), `${p.id} 「${en}」が本文に無い`).toBe(true);
      }
    }
  });

  it('出題時の並び：毎回同じで、正解の位置が偏らない', () => {
    const pos = [0, 0, 0, 0];
    for (const p of READING_PASSAGES) for (const q of p.questions) {
      const a = shuffledOptions(q); const b = shuffledOptions(q);
      expect(a).toEqual(b);
      expect(a.options[a.answerIndex]).toBe(q.options[0]);
      expect([...a.options].sort()).toEqual([...q.options].sort());
      pos[a.answerIndex]!++;
    }
    const total = pos.reduce((s, n) => s + n, 0);
    for (const n of pos) expect(n / total).toBeGreaterThan(0.15);
  });

  it('ページの順番：段落の順、全体の問いは最後。根拠の段落が分かる', () => {
    for (const p of READING_PASSAGES) {
      const st = stepsOf(p);
      expect(st.length).toBe(p.questions.length);
      for (let i = 1; i < st.length; i++) expect(st[i]!.para).toBeGreaterThanOrEqual(st[i - 1]!.para);
      for (const s of st) expect(p.paragraphs[evidencePara(p, s.question) - 1]!.includes(s.question.evidence), s.question.id).toBe(true);
      // 全ページの重要表現を合わせると、表現をすべて一度は見せる
      const shown = new Set(p.paragraphs.flatMap((_, i) => phrasesIn(p, i + 1).map(x => x[0])));
      for (const [en] of p.phrases) expect(shown.has(en), `${p.id} ${en}`).toBe(true);
    }
  });

  it('出題傾向：どの形式・レベルにも大学名つきの短い説明がある', () => {
    for (const p of READING_PASSAGES) for (const q of p.questions) {
      const n = examNote(p.level, q.type);
      expect(n.where.length).toBeGreaterThan(4);
      expect(n.where.length + n.tip.length, q.id).toBeLessThanOrEqual(90);
    }
    expect(examNote(5, 'main').where).toContain('東大');
    expect(examNote(4, 'paraphrase').where).toMatch(/早稲田|慶應/);
  });

  it('根拠の切り出し', () => {
    expect(splitEvidence('aa BB cc', 'BB')).toEqual({ before: 'aa ', mark: 'BB', after: ' cc' });
    expect(splitEvidence('aa', null)).toEqual({ before: 'aa', mark: '', after: '' });
    expect(splitEvidence('aa', 'zz')).toEqual({ before: 'aa', mark: '', after: '' });
  });
});

describe('英文解釈：記録', () => {
  const p = READING_PASSAGES[0]!;
  const empty: ReadingRecord = { version: 1, best: {}, missed: [] };
  it('最高点は下がらず、間違えた設問は正解すると外れる', () => {
    const r1 = applyReadingResult(empty, p.id, p.questions.map((q, i) => ({ questionId: q.id, correct: i === 0 })), 1);
    expect(r1.best[p.id]).toEqual({ score: 1, total: p.questions.length, at: 1 });
    expect(r1.missed).toEqual(p.questions.slice(1).map(q => q.id));
    const r2 = applyReadingResult(r1, p.id, p.questions.map(q => ({ questionId: q.id, correct: true })), 2);
    expect(isCleared(r2, p)).toBe(true);
    expect(r2.missed).toEqual([]);
    const r3 = applyReadingResult(r2, p.id, p.questions.map(q => ({ questionId: q.id, correct: false })), 3);
    expect(r3.best[p.id]!.score).toBe(p.questions.length);
  });
});

describe('英文解釈：アプリへの組み込み', () => {
  it('学習カタログで「英単語・英熟語」のすぐ下に NEW つきで並ぶ', () => {
    const en = STUDY_CATALOG.find(s => s.id === 'english')!;
    const practice = en.contents.filter(c => c.section !== 'memorize').map(c => c.id);
    expect(practice.indexOf('english_reading')).toBe(practice.indexOf('english_vocab_quiz') + 1);
    const c = en.contents.find(x => x.id === 'english_reading')!;
    expect(c.badge).toBe('NEW');
    expect(c.action).toEqual({ kind: 'reading' });
  });

  it('記録はアカウント同期の対象で、Firestore ルールも s_reading を許可する', () => {
    const s = SYNC_SECTIONS.find(x => x.id === 'reading')!;
    expect(s.keys('u1')).toEqual(['reading_quiz_v1_u1']);
    const merged = s.merge(
      { version: 1, best: { a: { score: 1, total: 2, at: 5 } }, missed: ['a-2', 'x-1'] },
      { version: 1, best: { a: { score: 2, total: 2, at: 1 }, b: { score: 1, total: 3, at: 2 } }, missed: ['a-2'] },
      { version: 1, best: {}, missed: ['a-2', 'x-1'] },
    ) as ReadingRecord;
    expect(merged.best.a!.score).toBe(2);
    expect(merged.best.b!.score).toBe(1);
    expect(merged.missed).toEqual(['a-2']);
    const rules = readFileSync('firestore.rules', 'utf8');
    expect(rules).toContain(`'${sectionField('reading')}'`);
    expect(rules).toContain(`sec(data, 's_reading')`);
  });
});
