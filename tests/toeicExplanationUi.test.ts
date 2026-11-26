import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { toeicPart5Data } from '../src/data/toeic/toeicPart5Data';
import { TOEIC_LISTENING_ROUNDS } from '../src/data/toeic/toeicListeningRounds';
import { buildToeicListeningRound } from '../src/data/toeic/toeicListeningKit';
import { ToeicReviewCard } from '../src/components/explanation/ToeicReviewCard';
import { StemWithBlank, ToeicExplanationPanel } from '../src/components/toeic/ToeicExplanationPanel';
import { toeicExplanationFor } from '../src/components/toeic/toeicPageModel';
import { buildResultPages, scopeQuestionsToFocus } from '../src/components/explanation/explanationLogic';
import {
  isEnglishProseChapter,
  isNoMathChapter,
  resolveChoiceOptionText,
  splitDialogueTurns,
} from '../src/components/explanation/helpers';
import { formatText } from '../src/utils/textFormatter';

describe('英語・TOEIC 解説の書体・数式抑止・対話整形ヘルパー', () => {
  it('英語・TOEIC 単元は prose=true かつ noMath=true と判定され、理数系単元は false になる', () => {
    expect(isEnglishProseChapter('tp5_1', [])).toBe(true);
    expect(isEnglishProseChapter('tp6_1', [])).toBe(true);
    expect(isEnglishProseChapter('tp7_1', [])).toBe(true);
    expect(isEnglishProseChapter('tpl_1', [])).toBe(true);
    expect(isEnglishProseChapter('eg1_1', [])).toBe(true);
    expect(isEnglishProseChapter('ev_1', [])).toBe(true);
    expect(isEnglishProseChapter('er_1', [])).toBe(true);
    expect(isEnglishProseChapter('math1_1', [])).toBe(false);
    expect(isEnglishProseChapter('chem_1', [])).toBe(false);

    expect(isNoMathChapter('tp5_1')).toBe(true);
    expect(isNoMathChapter('tpl_1')).toBe(true);
    expect(isNoMathChapter('eg1_1')).toBe(true);
    expect(isNoMathChapter('el1_A')).toBe(true);
    expect(isNoMathChapter('math1_1')).toBe(false);
  });

  it('prose: true, noMath: true では (A)〜(D) が化学式セリフ体にならず、$100〜$250 も数式化されない', () => {
    const node = formatText('(A) Refunds between $100 and $250 require a receipt.', [], { prose: true, noMath: true });
    const html = renderToStaticMarkup(React.createElement('div', null, node));
    expect(html).not.toContain('Cambria Math');
    expect(html).not.toContain('katex');
    expect(html).toContain('$100');
    expect(html).toContain('$250');
  });

  it('対話文（A: ... / B: ...）を話者ごとに分割でき、非対話文では null を返す', () => {
    const turns = splitDialogueTurns('A: Where did you put the contract?\nB: It is in the top ( ).');
    expect(turns).toEqual([
      { speaker: 'A', text: 'Where did you put the contract?' },
      { speaker: 'B', text: 'It is in the top ( ).' },
    ]);
    expect(splitDialogueTurns('Ms. Okafor will present ______ findings.')).toBeNull();
  });

  it('resolveChoiceOptionText は選んだ記号に対応する選択肢本文を返し、重複や空文字では空文字を返す', () => {
    const sq = toeicPart5Data.parts[0].chapters[0].practiceProblems[0].subQuestions[0];
    expect(resolveChoiceOptionText(sq, '(A)')).toBe('her');
    expect(resolveChoiceOptionText(sq, '(B)')).toBe('she');
    expect(resolveChoiceOptionText(sq, '')).toBe('');
  });
});

describe('TOEIC リスニング（tpl_1）の解説ページ分割・絞り込み', () => {
  const round1 = buildToeicListeningRound(1, TOEIC_LISTENING_ROUNDS[0]);

  it('tpl_1 は Part 3 / Part 4 の共有トラック問も含め、全12問が1問＝1ページに分かれる', () => {
    const pages = buildResultPages([round1], undefined);
    expect(pages).toHaveLength(12);
    expect(pages.map((p) => p.sq.id)).toEqual(round1.subQuestions.map((sq) => sq.id));
  });

  it('tpl_1 で focusSubQuestionId を指定したときは、対象1問だけに絞られる', () => {
    const targetId = round1.subQuestions[7].id;
    const scoped = scopeQuestionsToFocus([round1], targetId);
    expect(scoped).toHaveLength(1);
    expect(scoped[0].subQuestions.map((s) => s.id)).toEqual([targetId]);
  });
});

describe('まなとび英検＆英文法スタイルに統一した TOEIC 解説コンポーネント', () => {
  const chapter = toeicPart5Data.parts[0].chapters[0];
  const problem = chapter.practiceProblems[0];
  const sq1 = problem.subQuestions[0];

  it('ToeicReviewCard（誤答時）は空所で [誤答 → 正解] を対比表示し、要点・和訳を最初から表示する', () => {
    const html = renderToStaticMarkup(
      React.createElement(ToeicReviewCard, {
        chapter,
        question: problem,
        allQuestions: chapter.practiceProblems,
        objectiveSqs: [sq1],
        answers: { [sq1.id]: '(B)' },
        compact: true,
      }),
    );

    expect(html).toContain('data-toeic-review');
    expect(html).toContain('tp-blank-compare');
    expect(html).toContain('she');
    expect(html).toContain('her');
    expect(html).toContain('要点');
    expect(html).toContain('和訳');
    expect(html).toContain('選択肢の理由・ポイント');
    expect(html).not.toContain('英文法の音声を聞く');
    expect(html).not.toContain('Cambria Math');
  });

  it('ToeicExplanationPanel と StemWithBlank（演習中ページ採点）も同じ空所対比・要点・和訳構造になる', () => {
    const ex = toeicExplanationFor(sq1)!;
    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        null,
        React.createElement('p', null, React.createElement(StemWithBlank, {
          stem: ex.sentence,
          filled: 'she',
          compareRight: 'her',
          result: 'wrong',
          cues: ex.cues,
        })),
        React.createElement(ToeicExplanationPanel, {
          ex,
          correctText: 'her',
          open: true,
          onToggle: () => {},
        }),
      ),
    );

    expect(html).toContain('tp-blank-compare');
    expect(html).toContain('data-toeic-section="key"');
    expect(html).toContain('data-toeic-section="tr"');
    expect(html).toContain('選択肢の理由・ポイント');
    expect(html).not.toContain('Cambria Math');
  });
});
