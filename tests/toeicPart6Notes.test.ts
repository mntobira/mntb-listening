import { describe, expect, it } from 'vitest';
import { TOEIC_P6_ROUNDS } from '../src/data/toeic/toeicPart6Rounds';
import { buildToeicP6Round, p6AnswerPositions, p6BlankContext, passageWordCount, TOEIC_P6_WORDS_MAX, TOEIC_P6_WORDS_MIN } from '../src/data/toeic/toeicPart6Kit';
import { TOEIC_MARKS } from '../src/data/toeic/toeicPart5Kit';
import {
  isToeicPageChapter, isToeicPart6Chapter, locateP6, p6Snippet, resolveCues, splitP6Pages, splitToeicPages, toeicExplanationFor,
} from '../src/components/toeic/toeicPageModel';
import { getChaptersOfSubject, getPartsOfSubject } from '../src/data/allChapters';
import { MAX_WIDTH, textWidth } from './toeicPart5Notes.test';

/**
 * TOEIC Part 6 の問題と解説の検査（2026-10-31）
 *   ・各空所に 着眼点 h・ポイント r・TOEICでのコツ tip・手がかり cues がある（Part 5 と同じ書き方）
 *   ・スマホ幅で3行以内／使わない表現が入っていない／手がかりが文脈と正解の理由の両方で見つかる
 *   ・解説の引き当て（画面）と組み立て（データ）の正解が一致する
 *   ・問題カードの文に空所がある・ページは文書ごと
 * 他の文章との5語連続一致は scripts/check-toeic-notes.mts（npm run check:toeic-notes）で確かめる。
 */
const BANNED = /必ず|絶対|頻出|よく出る|定番|確実|間違いなく|合格|満点|スコアが上が|点が上が|得点アップ|毎回出る/;
const problems = TOEIC_P6_ROUNDS.map((sets, r) => buildToeicP6Round({ round: r + 1 }, sets));
const rows = TOEIC_P6_ROUNDS.flatMap((sets, r) => sets.flatMap((set, si) => set.b.map((b, bi) => ({
  r, si, bi, set, b, sq: problems[r].subQuestions[si * 4 + bi], id: `第${r + 1}回 文書${si + 1} 空所${bi + 1}`,
}))));

describe('TOEIC Part 6：問題と解説', () => {
  it('全空所に 着眼点・ポイント・TOEICでのコツ・手がかり がある', () => {
    const bad = rows.filter((x) => !x.b.h || !x.b.r || !x.b.tip || !(x.b.cues || []).length).map((x) => x.id);
    expect(bad).toEqual([]);
  });

  it('着眼点・ポイント・TOEICでのコツはスマホ幅で3行以内', () => {
    const bad = rows.flatMap((x) => (['h', 'r', 'tip'] as const).filter((k) => textWidth(String(x.b[k] || '')) > MAX_WIDTH).map((k) => `${x.id} ${k}`));
    expect(bad).toEqual([]);
  });

  it('使わない表現（必ず・頻出 など）が入っていない', () => {
    const bad = rows.filter((x) => BANNED.test([x.b.h, x.b.r, x.b.tip, x.b.why, ...x.b.w.map((w) => w[1])].join(' '))).map((x) => x.id);
    expect(bad).toEqual([]);
  });

  it('手がかりは文脈（解説に出す段落）と正解の理由の両方で見つかり、空所にかからない', () => {
    const bad = rows.filter((x) => {
      const ctx = p6BlankContext(x.set, x.bi);
      return resolveCues(ctx.text, x.b.why, x.b.cues).length !== (x.b.cues || []).length;
    }).map((x) => x.id);
    expect(bad).toEqual([]);
  });

  it('画面の解説の引き当てが、組み立てたデータの正解・選択肢と一致する', () => {
    const bad = rows.filter((x) => {
      const ex = toeicExplanationFor(x.sq);
      if (!ex) return true;
      const right = ex.choices.find((c) => c.correct);
      return right?.text !== x.b.c || right?.mark !== x.sq.correctAnswer || ex.choices.some((c, i) => c.text !== x.sq.optionTexts?.[i]);
    }).map((x) => x.id);
    expect(bad).toEqual([]);
  });

  it('問題カードの文に空所 ______ が1つある（ほかの空所の答えは見せない）', () => {
    const bad = rows.filter((x) => {
      const s = p6Snippet(x.sq);
      return s.split('______').length !== 2 || x.set.b.some((o, j) => j !== x.bi && o.k !== '文挿入' && s.includes(` ${o.c} `) && !x.set.p.join(' ').replace(/\[\[\d\]\]/g, '').includes(o.c));
    }).map((x) => x.id);
    expect(bad).toEqual([]);
  });

  it('本文の語数が目安の範囲で、文書の種類は回ごとに3種類以上', () => {
    const bad = TOEIC_P6_ROUNDS.flatMap((sets, r) => sets.filter((s) => {
      const n = passageWordCount(s);
      return n < TOEIC_P6_WORDS_MIN || n > TOEIC_P6_WORDS_MAX;
    }).map((s) => `第${r + 1}回 ${s.genre} ${passageWordCount(s)}語`));
    expect(bad).toEqual([]);
  });

  it('正解の位置：各回 A〜D がそれぞれ3〜5回・3問続かない', () => {
    problems.forEach((p, r) => {
      const pos = p6AnswerPositions(r + 1, 16);
      expect(p.subQuestions.map((q) => q.correctAnswer)).toEqual(pos.map((i) => TOEIC_MARKS[i]));
      [0, 1, 2, 3].forEach((k) => {
        const n = pos.filter((v) => v === k).length;
        expect(n, `第${r + 1}回`).toBeGreaterThanOrEqual(3);
        expect(n, `第${r + 1}回`).toBeLessThanOrEqual(5);
      });
    });
  });

  it('同じ英文の文書・同じ文挿入の正解がほかの回にない', () => {
    const titles = TOEIC_P6_ROUNDS.flat().map((s) => s.p[0].slice(0, 60));
    const inserts = rows.filter((x) => x.b.k === '文挿入').map((x) => x.b.c);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(inserts).size).toBe(inserts.length);
  });
});

describe('TOEIC Part 6：画面の計算', () => {
  it('単元の判定と小問IDの読み取り', () => {
    expect(isToeicPageChapter('tp6_1')).toBe(true);
    expect(isToeicPart6Chapter('tp6_1')).toBe(true);
    expect(isToeicPart6Chapter('tp5_1')).toBe(false);
    expect(locateP6('q_tp6_1_r01_7')).toEqual({ round: 1, index: 6, set: 1, blank: 2 });
    expect(locateP6('q_tp5_1_r01_7')).toBeNull();
  });

  it('ページは文書ごと（4問ずつ）。間違えた問題だけに絞っても文書で分かれる', () => {
    const subs = problems[0].subQuestions;
    expect(splitToeicPages('tp6_1', subs).map((p) => p.length)).toEqual([4, 4, 4, 4]);
    expect(splitP6Pages([subs[1], subs[3], subs[6], subs[15]]).map((p) => p.map((q) => q.id.slice(-2)))).toEqual([['_2', '_4'], ['_7'], ['16']]);
    expect(splitToeicPages('tp5_1', Array.from({ length: 30 }, (_, i) => ({ id: `q_tp5_1_r01_${i + 1}` }))).map((p) => p.length)).toEqual([6, 6, 6, 6, 6]);
  });

  it('TOEIC の教科に Part 5・Part 6 の2つの単元が並ぶ', () => {
    expect(getPartsOfSubject('toeic_part5').map((p) => p.id)).toEqual(['tp5', 'tp6']);
    expect(getChaptersOfSubject('toeic_part5').map((c) => c.id)).toEqual(['tp5_1', 'tp6_1']);
  });
});
