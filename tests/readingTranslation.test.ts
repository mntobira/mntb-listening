/**
 * 英文解釈：本文の全訳（2026-10-24）
 *   ・全60題・全段落に和訳がある（段落の数と順番が本文と同じ）
 *   ・設問の根拠の和訳（evidenceJa）が、その段落の全訳の中にそのまま入っている
 *     → 解説で「第N段落の全訳」を開くと、根拠の部分が太字で見つかる
 *   ・解説と結果画面に全訳が出る配線
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { READING_PASSAGES, evidencePara } from '../src/data/reading';
import { READING_TRANSLATIONS, paragraphJa } from '../src/data/reading/ja';

const hasJa = (t: string) => /[ぁ-んァ-ン一-龥]/.test(t);

describe('全訳のデータ', () => {
  it('すべての文章に、段落と同じ数の和訳がある', () => {
    const missing = READING_PASSAGES.filter(p => READING_TRANSLATIONS[p.id]?.length !== p.paragraphs.length)
      .map(p => `${p.id}: 本文${p.paragraphs.length}段落 / 訳${READING_TRANSLATIONS[p.id]?.length ?? 0}`);
    expect(missing).toEqual([]);
  });
  it('余分な訳（本文に無い文章ID）が無い', () => {
    const ids = new Set(READING_PASSAGES.map(p => p.id));
    expect(Object.keys(READING_TRANSLATIONS).filter(id => !ids.has(id))).toEqual([]);
  });
  it('和訳は日本語で、空でない（英文のコピペになっていない）', () => {
    const bad: string[] = [];
    for (const p of READING_PASSAGES) READING_TRANSLATIONS[p.id]!.forEach((ja, k) => {
      if (!ja.trim() || !hasJa(ja) || ja.includes(p.paragraphs[k]!.slice(0, 30))) bad.push(`${p.id}-${k + 1}`);
    });
    expect(bad).toEqual([]);
  });
  it('設問の根拠の和訳が、根拠の段落の全訳の中にそのまま入っている（太字で示せる）', () => {
    const miss: string[] = [];
    for (const p of READING_PASSAGES) for (const q of p.questions) {
      const ja = paragraphJa(p.id, evidencePara(p, q));
      const key = q.evidenceJa.replace(/^「|」$/g, '');
      if (!ja || !ja.includes(key)) miss.push(`${q.id}: ${key}`);
    }
    expect(miss).toEqual([]);
  });
});

describe('画面の配線', () => {
  const src = readFileSync('src/components/ReadingQuiz.tsx', 'utf8');
  it('解説に「第N段落の全訳」（開閉式・根拠は太字）', () => {
    expect(src).toContain('data-reading-translation');
    expect(src).toContain('<summary>第{evPara}段落の全訳</summary>');
    expect(src).toContain('markJa(evJa, q.evidenceJa)');
  });
  it('結果画面に「本文と全訳を見る」', () => {
    expect(src).toContain('data-reading-translation-all');
    expect(src).toContain('本文と全訳を見る');
  });
  it('文字は 12px 以上・押せる高さは 44px 以上（UI の決まり）', () => {
    const css = readFileSync('src/components/foundation.css', 'utf8');
    const block = css.slice(css.indexOf('.rq-ex-ja {'), css.indexOf('.rq-ex-point { margin: 0;'));
    for (const m of block.matchAll(/(\d+(?:\.\d+)?)px/g)) {
      const line = block.slice(block.lastIndexOf('\n', m.index!), block.indexOf('\n', m.index!));
      if (/font(-size)?:/.test(line) && /font[^;]*?(\d+)px/.test(line)) {
        const size = Number(/font(?:-size)?:\s*(?:\d+\s+)?(\d+(?:\.\d+)?)px/.exec(line)?.[1] ?? 99);
        expect(size, line.trim()).toBeGreaterThanOrEqual(12);
      }
    }
    expect(block).toContain('min-height: 44px');
  });
});
