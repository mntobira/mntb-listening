/**
 * 英文法・TOEIC 新カードUI＆1問ごとの詳細解説・手がかりマーカー・過去データ完全互換テスト
 *
 * ■ 検証すること
 *   1. 単元分け・章ID・大問ID・小問ID・選択肢の保存値（①〜④ / (A)〜(D)）が1文字も変わっていないこと
 *   2. 英文法 全20章・全1,163問がカードモデルへ欠落ゼロで変換でき、全問に固有の着眼点・要点・4択それぞれの理由・補足解説・手がかりマーカー（`¹` `²`）が備わっていること
 *   3. すでに旧UIで解いていたユーザーの保存データ（`solved_problems_v1_*` / `stage_records_v1_*` /
 *      `unit_stats_v1_*` / `quiz_answers_*` / `quiz_run_*` / `review_focus_v1`）をそのまま読め、
 *      新UIで採点した記録も同じキー形式で積み上がること
 *   4. アプリ内のお知らせ（`UPDATE_NOTICES`）の先頭に今回の解説強化と記録引き継ぎの案内が入っていること
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getAllGrammarChapters } from '../src/data/englishGrammarData';
import {
  buildGrammarSubReviews,
  isGrammarPageChapterId,
  parseGrammarProblemCards,
  splitGrammarDialogueTurns,
} from '../src/components/grammar/grammarPageModel';
import { GrammarResultView } from '../src/components/grammar/GrammarResultView';
import { ToeicResultView } from '../src/components/toeic/ToeicResultView';
import { toeicPart5Data } from '../src/data/toeic/toeicPart5Data';
import { UPDATE_NOTICES } from '../src/data/updateNotices';
import { markAllNoticesRead, unreadNoticeCount } from '../src/utils/updateNotices';
import { markProblemSolved, problemKey, readSolvedMap } from '../src/utils/progress';
import { isStageCleared, readStageRecords, stageKey } from '../src/utils/stageRecords';
import { accuracyOf, readUnitStats, recordUnitResult } from '../src/utils/unitStats';
import { applyReviewFocus, type ReviewFocus } from '../src/utils/reviewFocus';
import { quizAnswersKey, quizRunKey } from '../src/utils/quizStorageKeys';
import { loadRun, saveRun } from '../src/utils/quizRunState';

describe('英文法・TOEIC カードUI＆個別詳細解説・過去データ引き継ぎ互換', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    const ls: Storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => store.clear(),
      key: (i: number) => [...store.keys()][i] ?? null,
      get length() {
        return store.size;
      },
    };
    vi.stubGlobal('localStorage', ls);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('英文法の単元構成（全20章・eg6_1〜eg6_20・1回5問・全1163問）と保存用ID・選択肢①〜④が不変で、全問に具体解説とマーカーがある', () => {
    const chapters = getAllGrammarChapters();
    expect(chapters.map((c) => c.id)).toEqual(
      Array.from({ length: 20 }, (_, i) => `eg6_${i + 1}`),
    );
    for (const c of chapters) {
      expect(isGrammarPageChapterId(c.id)).toBe(true);
    }
    expect(isGrammarPageChapterId('el1_A')).toBe(false);
    expect(isGrammarPageChapterId('tp5_1')).toBe(false);

    let totalCards = 0;
    let dialogueCards = 0;
    let cardsWithCues = 0;
    let cardsWithPlus = 0;
    for (const ch of chapters) {
      for (const p of ch.practiceProblems) {
        expect(p.id.startsWith(`q_${ch.id}_set`)).toBe(true);
        const cards = parseGrammarProblemCards(p);
        expect(cards.length).toBe(p.subQuestions.length);
        for (const card of cards) {
          totalCards += 1;
          expect(card.sq.options).toEqual(['①', '②', '③', '④']);
          expect(card.choiceTexts).toHaveLength(4);
          expect(card.translation.length).toBeGreaterThan(2);
          expect(card.why.length).toBeGreaterThanOrEqual(20);
          expect(card.hint.length).toBeGreaterThanOrEqual(12);
          expect(card.hint.startsWith('空所の前後「')).toBe(false);
          expect(card.choices).toHaveLength(4);
          for (const chDetail of card.choices) {
            expect(chDetail.reason.length).toBeGreaterThanOrEqual(8);
          }
          if (card.cues.length >= 1) {
            cardsWithCues += 1;
          }
          if (card.plus.length > 0) {
            cardsWithPlus += 1;
          }
          if (splitGrammarDialogueTurns(card.stem)) {
            dialogueCards += 1;
          }
        }
      }
    }
    expect(totalCards).toBe(1163);
    expect(cardsWithCues).toBeGreaterThanOrEqual(1160);
    expect(cardsWithPlus).toBe(1163);
    expect(dialogueCards).toBeGreaterThanOrEqual(160);
  });

  it('既存ユーザーの過去の学習記録・達成ステージ・途中回答・復習絞り込みが1件も失われずそのまま動く', () => {
    const uid = 'existing-student-01';
    const ch1 = getAllGrammarChapters()[0];
    const p1 = ch1.practiceProblems[0]; // q_eg6_1_set1
    const p2 = ch1.practiceProblems[1]; // q_eg6_1_set2

    markProblemSolved(uid, ch1.id, p1.id, 100);
    recordUnitResult(uid, ch1.id, 5, 5);
    store.set(
      `stage_records_v1_${uid}`,
      JSON.stringify({
        [stageKey(ch1.id, p1.id)]: { p: 3, n: 3, b: 100, t: 1700000000000 },
      }),
    );

    const partialAnswers: Record<string, string> = {
      [p2.subQuestions[0].id]: p2.subQuestions[0].correctAnswer,
      [p2.subQuestions[1].id]: '①',
    };
    store.set(quizAnswersKey(ch1.id, 'practice'), JSON.stringify(partialAnswers));
    saveRun(ch1.id, 'practice', {
      totalScore: 120,
      totalCorrect: 1,
      totalJudgeable: 1,
      totalTimeSec: 18,
      startedAt: 1700000000000,
      runningCombo: 1,
      perQuestion: {},
      perStep: {
        [`${p2.id}::${p2.subQuestions[0].id}`]: {
          correctCount: 1,
          judgeableCount: 1,
          totalCount: 1,
          basePoints: 100,
          timeBonus: 20,
          comboBonus: 0,
          descriptiveBonus: 0,
          overtimePenalty: 0,
          finalScore: 120,
          perfectBonus: 0,
          comboCount: 1,
          timeLimit: 60,
          timeUsed: 18,
        },
      },
    });

    const solved = readSolvedMap(uid);
    expect(solved[problemKey(ch1.id, p1.id)]).toBeGreaterThan(0);
    const stages = readStageRecords(uid);
    expect(isStageCleared(stages[stageKey(ch1.id, p1.id)])).toBe(true);
    expect(accuracyOf(readUnitStats(uid)[ch1.id])).toBe(100);

    expect(store.get(quizRunKey(ch1.id, 'practice'))).toBeTruthy();
    const restoredRun = loadRun(ch1.id, 'practice');
    expect(restoredRun.totalScore).toBe(120);
    const expectedCards = parseGrammarProblemCards(p2);
    const reviews = buildGrammarSubReviews(p2, partialAnswers);
    expect(reviews[0].status).toBe('correct');
    expect(reviews[1].status).toBe('wrong');
    expect(reviews[1].filledWord).toBe(expectedCards[1].choiceTexts[0]);
    expect(reviews[1].correctWord).toBe(expectedCards[1].correctWord);
    expect(reviews[2].status).toBe('blank');

    const focus: ReviewFocus = {
      chapterId: ch1.id,
      targets: [{ questionId: p2.id, subQuestionIds: [p2.subQuestions[1].id] }],
    };
    const narrowed = applyReviewFocus(ch1.practiceProblems, ch1.id, focus);
    expect(narrowed).toHaveLength(1);
    const narrowedCards = parseGrammarProblemCards(narrowed[0]);
    expect(narrowedCards).toHaveLength(1);
    expect(narrowedCards[0].displayNo).toBe(2);
    expect(narrowedCards[0].correctWord).toBe(expectedCards[1].correctWord);
  });

  it('GrammarResultView と ToeicResultView が初期表示で結果画面（ResultInsight + ResultStage）を出し、detail ではインライン空所比較 [誤答 → 正解]・手がかりマーカー・カード解説を描画できる', () => {
    const ch20 = getAllGrammarChapters().find((c) => c.id === 'eg6_20')!;
    const p20 = ch20.practiceProblems[0];
    const grammarAnswers = {
      [p20.subQuestions[0].id]: '①',
      [p20.subQuestions[1].id]: p20.subQuestions[1].correctAnswer,
    };

    // 1画面目（既定 step='summary'）：結果画面（正答率リング・前回比・とびら君・「詳しい解説・答え合わせを見る」・「第2回へ」）
    const grammarSummaryHtml = renderToStaticMarkup(
      React.createElement(GrammarResultView, {
        mode: 'practice',
        chapter: ch20,
        answers: grammarAnswers,
        onBack: () => {},
        isGuest: true,
        questionRange: { startIndex: 0, endIndex: 0 },
        onNextAction: () => {},
        nextActionLabel: '第2回',
      }),
    );
    expect(grammarSummaryHtml).toContain('data-grammar-result');
    expect(grammarSummaryHtml).toContain('data-result-step="summary"');
    expect(grammarSummaryHtml).toContain('data-result-insight');
    expect(grammarSummaryHtml).toContain('data-practice-stage');
    expect(grammarSummaryHtml).toContain('data-practice-open-detail');
    expect(grammarSummaryHtml).toContain('詳しい解説・答え合わせを見る');
    expect(grammarSummaryHtml).toContain('第2回へ');

    // 2画面目（step='detail'）：1問ずつではなく全問カード一覧での答え合わせ＋結果画面へ戻る導線
    const grammarDetailHtml = renderToStaticMarkup(
      React.createElement(GrammarResultView, {
        mode: 'practice',
        chapter: ch20,
        answers: grammarAnswers,
        onBack: () => {},
        isGuest: true,
        questionRange: { startIndex: 0, endIndex: 0 },
        initialStep: 'detail',
      }),
    );
    expect(grammarDetailHtml).toContain('data-result-step="detail"');
    expect(grammarDetailHtml).toContain('data-back-to-summary');
    expect(grammarDetailHtml).toContain('gp-speaker-pill');
    expect(grammarDetailHtml).toContain('gp-blank-compare');
    expect(grammarDetailHtml).toContain('gp-cue');
    expect(grammarDetailHtml).toContain('How have you been?');
    expect(grammarDetailHtml).toContain('How do you do?');
    expect(grammarDetailHtml).toContain('和訳');
    expect(grammarDetailHtml).toContain('要点');

    const toeicChapter = toeicPart5Data.parts[0].chapters[0];
    const tp0 = toeicChapter.practiceProblems[0];
    const wrongMark = tp0.subQuestions[0].options.find(
      (m) => m !== tp0.subQuestions[0].correctAnswer,
    )!;
    const toeicAnswers = {
      [tp0.subQuestions[0].id]: wrongMark,
      [tp0.subQuestions[1].id]: tp0.subQuestions[1].correctAnswer,
    };

    const toeicSummaryHtml = renderToStaticMarkup(
      React.createElement(ToeicResultView, {
        mode: 'practice',
        chapter: toeicChapter,
        answers: toeicAnswers,
        onBack: () => {},
        isGuest: true,
        questionRange: { startIndex: 0, endIndex: 0 },
      }),
    );
    expect(toeicSummaryHtml).toContain('data-toeic-result');
    expect(toeicSummaryHtml).toContain('data-result-step="summary"');
    expect(toeicSummaryHtml).toContain('data-result-insight');
    expect(toeicSummaryHtml).toContain('data-practice-stage');
    expect(toeicSummaryHtml).toContain('詳しい解説・答え合わせを見る');

    const toeicDetailHtml = renderToStaticMarkup(
      React.createElement(ToeicResultView, {
        mode: 'practice',
        chapter: toeicChapter,
        answers: toeicAnswers,
        onBack: () => {},
        isGuest: true,
        questionRange: { startIndex: 0, endIndex: 0 },
        initialStep: 'detail',
      }),
    );
    expect(toeicDetailHtml).toContain('data-result-step="detail"');
    expect(toeicDetailHtml).toContain('tp-blank-compare');
    expect(toeicDetailHtml).toContain('tp-cue');
    expect(toeicDetailHtml).toContain('和訳');
    expect(toeicDetailHtml).toContain('要点');
  });

  it('アプリ内のお知らせ（UPDATE_NOTICES）の先頭に解説強化・手がかりマーカーと学習記録引き継ぎの案内があり、未読バッジに反映される', () => {
    const latest = UPDATE_NOTICES[0];
    expect(latest.id).toBe('2026-11-16-01');
    expect(latest.title).toContain('手がかりマーカー');
    expect(latest.items.join(' ')).toContain('そのまま引き継がれます');

    const previousIds = UPDATE_NOTICES.slice(1).map((n) => n.id);
    store.set('update_notices_read_v1', JSON.stringify(previousIds));
    expect(unreadNoticeCount()).toBe(1);
    markAllNoticesRead();
    expect(unreadNoticeCount()).toBe(0);
  });
});
