import { describe, expect, it } from 'vitest';
import { TOEIC_P7_ROUNDS } from '../src/data/toeic/toeicPart7Rounds';
import { buildToeicP7Round, p7AnswerPositions, validateP7Round } from '../src/data/toeic/toeicPart7Kit';
import { TOEIC_MARKS } from '../src/data/toeic/toeicPart5Kit';
import {
  isToeicPageChapter, isToeicPart6Chapter, isToeicPart7Chapter, locateP7, p7EvidenceText, perPageOf, resolveCues, splitP7Pages,
  splitToeicPages, toeicExplanationFor,
} from '../src/components/toeic/toeicPageModel';
import { buildToeicP7PageBudgets } from '../src/components/toeic/toeicTimeBudget';
import { MAX_WIDTH, textWidth } from './toeicPart5Notes.test';

/**
 * TOEIC Part 7 の問題と解説の検査（2026-11-02）
 *   ・1回＝1文書5セット（2・2・3・3・4問）＋2文書1セット（5問）＋3文書1セット（5問）＝24問、全15回
 *   ・各設問に 着眼点 h・ポイント r・TOEICでのコツ tip・手がかり cues・根拠 e がある（Part 5・6 と同じ書き方＋根拠）
 *   ・スマホ幅で3行以内／使わない表現が入っていない／手がかりが根拠と正解の理由の両方で見つかる
 *   ・解説の引き当て（画面）と組み立て（データ）の正解が一致する／ページはセットごと
 * 他の文章との5語連続一致は scripts/check-toeic-notes.mts（npm run check:toeic-notes）で確かめる。
 */
const BANNED = /必ず|絶対|頻出|よく出る|定番|確実|間違いなく|合格|満点|スコアが上が|点が上が|得点アップ|毎回出る/;
const problems = TOEIC_P7_ROUNDS.map((sets, r) => buildToeicP7Round({ round: r + 1 }, sets));
const rows = TOEIC_P7_ROUNDS.flatMap((sets, r) => {
  let i = 0;
  return sets.flatMap((set, si) => set.q.map((q, qi) => {
    const sq = problems[r].subQuestions[i];
    i += 1;
    return { r, si, qi, set, q, sq, id: `第${r + 1}回 セット${si + 1} 設問${qi + 1}` };
  }));
});

describe('TOEIC Part 7：問題と解説', () => {
  it('全15回・各回7セット24問（1文書2・2・3・3・4問、2文書5問、3文書5問）', () => {
    expect(TOEIC_P7_ROUNDS).toHaveLength(15);
    TOEIC_P7_ROUNDS.forEach((sets, r) => {
      expect(sets.map((s) => s.q.length), `第${r + 1}回`).toEqual([2, 2, 3, 3, 4, 5, 5]);
      expect(sets.map((s) => s.kind), `第${r + 1}回`).toEqual(['single', 'single', 'single', 'single', 'single', 'double', 'triple']);
      expect(sets.map((s) => s.docs.length), `第${r + 1}回`).toEqual([1, 1, 1, 1, 1, 2, 3]);
    });
    expect(rows).toHaveLength(360);
  });

  it('データの検査（語数・和訳の数・誤答の理由・根拠が本文にある など）で問題がない', () => {
    const bad = TOEIC_P7_ROUNDS.flatMap((sets, r) => validateP7Round(sets).map((m) => `第${r + 1}回 ${m}`));
    expect(bad).toEqual([]);
  });

  it('全設問に 着眼点・ポイント・TOEICでのコツ・手がかり・根拠・和訳 がある', () => {
    const bad = rows.filter((x) => !x.q.h || !x.q.r || !x.q.tip || !(x.q.cues || []).length || !x.q.e.length || !x.q.qtr || !x.q.etr)
      .map((x) => x.id);
    expect(bad).toEqual([]);
  });

  it('着眼点・ポイント・TOEICでのコツはスマホ幅で3行以内', () => {
    const bad = rows.flatMap((x) => (['h', 'r', 'tip'] as const).filter((k) => textWidth(String(x.q[k] || '')) > MAX_WIDTH).map((k) => `${x.id} ${k}`));
    expect(bad).toEqual([]);
  });

  it('使わない表現（必ず・頻出 など）が入っていない', () => {
    const bad = rows.filter((x) => BANNED.test([x.q.h, x.q.r, x.q.tip, x.q.why, ...x.q.w.map((w) => w[1])].join(' '))).map((x) => x.id);
    expect(bad).toEqual([]);
  });

  it('手がかりは根拠（解説に出す英文）と正解の理由の両方で見つかる', () => {
    const bad = rows.filter((x) => resolveCues(p7EvidenceText(x.set, x.q), x.q.why, x.q.cues).length !== (x.q.cues || []).length).map((x) => x.id);
    expect(bad).toEqual([]);
  });

  it('画面の解説の引き当てが、組み立てたデータの正解・選択肢と一致する', () => {
    const bad = rows.filter((x) => {
      const ex = toeicExplanationFor(x.sq);
      if (!ex) return true;
      const right = ex.choices.find((c) => c.correct);
      return right?.text !== x.q.c || right?.mark !== x.sq.correctAnswer || ex.choices.some((c, i) => c.text !== x.sq.optionTexts?.[i]);
    }).map((x) => x.id);
    expect(bad).toEqual([]);
  });

  it('正解の位置：データの並びと一致し、各回 A〜D がどれも出てくる', () => {
    problems.forEach((p, r) => {
      const pos = p7AnswerPositions(r + 1, TOEIC_P7_ROUNDS[r].flatMap((s) => s.q));
      expect(p.subQuestions.map((q) => q.correctAnswer)).toEqual(pos.map((i) => TOEIC_MARKS[i]));
      [0, 1, 2, 3].forEach((k) => {
        expect(pos.filter((v) => v === k).length, `第${r + 1}回 ${TOEIC_MARKS[k]}`).toBeGreaterThanOrEqual(3);
      });
    });
  });

  it('文挿入の選択肢は [1]〜[4] の順で、正解の印が本文にある', () => {
    const bad = rows.filter((x) => x.q.k === '文挿入').filter((x) => {
      const n = x.q.c.replace(/\D/g, '');
      return x.sq.optionTexts?.join(',') !== '[1],[2],[3],[4]' || !x.set.docs.some((d) => d.p.join(' ').includes(`[[${n}]]`));
    }).map((x) => x.id);
    expect(bad).toEqual([]);
  });

  it('同じ書き出しの文書がほかのセット・回にない', () => {
    const heads = TOEIC_P7_ROUNDS.flat().flatMap((s) => s.docs.map((d) => d.p[0].slice(0, 60)));
    expect(new Set(heads).size).toBe(heads.length);
  });
});

describe('TOEIC Part 7：画面の計算', () => {
  it('単元の判定と小問IDの読み取り', () => {
    expect(isToeicPageChapter('tp7_1')).toBe(true);
    expect(isToeicPart7Chapter('tp7_1')).toBe(true);
    expect(isToeicPart7Chapter('tp6_1')).toBe(false);
    expect(isToeicPart6Chapter('tp7_1')).toBe(false);
    expect(locateP7('q_tp7_1_r01_1')).toEqual({ round: 1, index: 0, set: 0, q: 0 });
    expect(locateP7('q_tp7_1_r01_5')).toEqual({ round: 1, index: 4, set: 2, q: 0 });
    expect(locateP7('q_tp7_1_r02_24')).toEqual({ round: 2, index: 23, set: 6, q: 4 });
    expect(locateP7('q_tp7_1_r01_25')).toBeNull();
    expect(locateP7('q_tp6_1_r01_1')).toBeNull();
    expect(perPageOf('tp7_1')).toBe(1);
  });

  it('ページはセットごと。間違えた問題だけに絞ってもセットで分かれる', () => {
    const subs = problems[0].subQuestions;
    expect(splitToeicPages('tp7_1', subs).map((p) => p.length)).toEqual([2, 2, 3, 3, 4, 5, 5]);
    expect(splitP7Pages([subs[0], subs[1], subs[5], subs[23]]).map((p) => p.length)).toEqual([2, 1, 1]);
  });

  it('時間の目安：セットの設問の数に比例し、最後のページで制限時間を使い切る', () => {
    const pages = splitToeicPages('tp7_1', problems[0].subQuestions);
    const b = buildToeicP7PageBudgets(pages, 'standard', 1200);
    expect(b.map((x) => x.targetSec)).toEqual([100, 100, 150, 150, 200, 250, 250]);
    expect(b[b.length - 1].limitRemainingSec).toBeCloseTo(0);
    expect(b[0].limitElapsedSec).toBeCloseTo(100);
  });
});

describe('TOEIC の英文：金額の $ を数式にしない（2026-11-03）', () => {
  it('「$100 … $15」のように $ が2つ並んでも、KaTeX で組まず文字のまま出す', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { createElement, Fragment } = await import('react');
    const { formatText } = await import('../src/utils/textFormatter');
    const text = 'Standard delivery is free for orders over $100. Express delivery costs $15.';
    const html = renderToStaticMarkup(createElement(Fragment, null, formatText(text, [], { prose: true, noMath: true })));
    expect(html).not.toContain('katex');
    expect(html.replace(/<[^>]+>/g, '')).toBe(text);
  });

  it('TOEIC の部品は formatText に noMath を渡している', async () => {
    const { readFileSync } = await import('node:fs');
    for (const f of ['ToeicP7Passage.tsx', 'ToeicP6Passage.tsx', 'ToeicExplanationPanel.tsx', 'ToeicPageQuiz.tsx']) {
      const src = readFileSync(new URL(`../src/components/toeic/${f}`, import.meta.url), 'utf8');
      const calls = src.match(/formatText\([^)]*\)/g) || [];
      expect(calls.length, f).toBeGreaterThan(0);
      expect(calls.filter((c) => !c.includes('noMath: true')), f).toEqual([]);
    }
  });
});
