import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildReadAlong, readAlongUrl, toIpa, wordAt, type ReadAlongFile } from '../src/features/readAlong/readAlong';

const load = (rel: string) => buildReadAlong(JSON.parse(readFileSync(join(__dirname, '..', 'public', rel), 'utf8')) as ReadAlongFile);

describe('音読・ディクテーション（2026-10-08）', () => {
  it('音源 URL から時刻データの URL を作る', () => {
    expect(readAlongUrl('/listening_audio/el1A_set1_q1.mp3')).toBe('/read_along/listening_audio/el1A_set1_q1.json');
    expect(readAlongUrl('/listening_q5/q5set01_lecture.mp3')).toBe('/read_along/listening_q5/q5set01_lecture.json');
    expect(readAlongUrl(undefined)).toBeNull();
  });

  it('音源 374 本すべてに時刻データがあり、平均の一致率が 9 割以上', () => {
    const root = join(__dirname, '..', 'public', 'read_along');
    const files = readdirSync(root).flatMap(d => readdirSync(join(root, d)).map(f => join(root, d, f)));
    expect(files.length).toBe(374);
    const rates = files.map(f => JSON.parse(readFileSync(f, 'utf8')).rate as number);
    expect(rates.reduce((a, b) => a + b, 0) / rates.length).toBeGreaterThan(0.9);
    for (const f of files) {
      const d = JSON.parse(readFileSync(f, 'utf8')) as ReadAlongFile;
      expect(existsSync(join(__dirname, '..', 'public', d.src))).toBe(true);
      const ws = d.lines.flatMap(l => l.w);
      for (let k = 1; k < ws.length; k++) expect(ws[k][1]).toBeGreaterThanOrEqual(ws[k - 1][1]);
      expect(ws[ws.length - 1][1]).toBeLessThanOrEqual(d.dur * 1000 + 50);
    }
  });

  it('第1問A 問1：単語の時刻・語群・連結', () => {
    const ra = load('read_along/listening_audio/el1A_set1_q1.json');
    expect(ra.words.map(w => w.text).join(' ')).toBe('I was going to bring my umbrella, but I forgot it on the train this morning.');
    // umbrella, のあとで語群が切れる
    const umb = ra.words.find(w => w.text === 'umbrella,')!;
    expect(ra.words[umb.i + 1].chunk).not.toBe(umb.chunk);
    // forgot it（t + 母音）はつながる
    const forgot = ra.words.find(w => w.text === 'forgot')!;
    expect(forgot.link === 'flap' || forgot.link === 'link').toBe(true);
    // 再生位置 → 単語
    expect(wordAt(ra.words, forgot.start + 10)).toBe(forgot.i);
    expect(wordAt(ra.words, 0)).toBeLessThanOrEqual(0);
    // to・the は弱く読む語
    expect(ra.words.find(w => w.text === 'to')!.weak).toBe(true);
  });

  it('発音記号（IPA）と音節・強勢', () => {
    expect(toIpa('AH0 M B R EH1 L AH0').ipa).toBe('əmˈbrɛlə');
    expect(toIpa('AH0 M B R EH1 L AH0').syllables).toBe(3);
    expect(toIpa('AH0 M B R EH1 L AH0').stressAt).toBe(2);
    expect(toIpa('T R EY1 N').ipa).toBe('treɪn');
    expect(toIpa('').ipa).toBe('');
  });

  it('強弱・アクセント・文末の上げ下げ（音源から測った目立ち度＋つづりの音節）', () => {
    const ra = load('read_along/listening_audio/el1A_set1_q1.json');
    const umb = ra.words.find(w => w.text === 'umbrella,')!;
    expect(umb.syl).toEqual(['um', 'brel', 'la']);
    expect(umb.stressSyl).toBe(1);
    const the = ra.words.find(w => w.text === 'the')!;
    expect(the.level).toBe('weak');
    expect(the.weakIpa).toBe('ðə');
    expect(ra.words.filter(w => w.level === 'focus').length).toBeGreaterThanOrEqual(2);
    expect(ra.words[ra.words.length - 1].tone).toBe('down');
    const q = buildReadAlong({ v: 1, src: '', dur: 3, rate: 1, lines: [
      { who: 'A', w: [['Can', 0, 100, 'K AE1 N', 3], ['I', 100, 200, 'AY1', 5], ['go?', 200, 400, 'G OW1', 7]] },
      { who: 'B', w: [['Where', 500, 700, 'W EH1 R', 6], ['to?', 700, 900, 'T UW1', 4]] },
      { who: 'A', w: [['Ice', 1000, 1200, 'AY1 S', 6], ['or', 1200, 1300, 'AO1 R', 2], ['hot?', 1300, 1600, 'HH AA1 T', 7]] },
    ] });
    expect(q.words[2].tone).toBe('up');
    expect(q.words[4].tone).toBe('down');
    expect(q.words[7].tone).toBe('down');
  });

  it('すべての時刻データに目立ち度（0〜9）とつづりの音節がある', () => {
    const root = join(__dirname, '..', 'public', 'read_along');
    for (const d of readdirSync(root)) for (const f of readdirSync(join(root, d))) {
      const j = JSON.parse(readFileSync(join(root, d, f), 'utf8')) as ReadAlongFile;
      for (const l of j.lines) for (const w of l.w) {
        expect(w.length).toBe(7);
        expect(w[4]).toBeGreaterThanOrEqual(0); expect(w[4]).toBeLessThanOrEqual(9);
        if (w[5]) expect(w[0]).toContain(w[5].replace(/\|/g, ''));
      }
    }
  });

  it('絵の問題：第1問B・第2問のイラストはすべて実在し、答え合わせで1コマずつ切り出せる', async () => {
    const { englishListeningData } = await import('../src/data/englishListeningData');
    const subs = englishListeningData.parts.flatMap((p: any) => p.chapters ?? []).flatMap((c: any) => c.practiceProblems ?? c.problems ?? [])
      .flatMap((pb: any) => pb.subQuestions ?? []).filter((sq: any) => /^\/listening_(q1b|q2)\//.test(sq.imageUrl ?? ''));
    expect(subs.length).toBeGreaterThanOrEqual(100);
    for (const sq of subs) {
      expect(existsSync(join(__dirname, '..', 'public', sq.imageUrl))).toBe(true);
      expect(sq.options.length).toBe(4);
    }
  });

  it('対話は話者ごとの行になる', () => {
    const ra = load('read_along/listening_audio/el3_set1_q1.json');
    expect(ra.lines.length).toBeGreaterThan(2);
    expect(ra.lines[0].who).toBeTruthy();
  });
});
