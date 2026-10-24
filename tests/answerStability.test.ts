import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8');

describe('ご指摘3点の修正（2026-10-23）', () => {
  it('① 対戦：回答の赤/青表示で4択ボタンが上下に動かない（高さ固定の枠）', () => {
    const css = read('src/battle/ui/battle-question.css');
    expect(css).toMatch(/--live-feed-h:\s*28px/);
    expect(css).toMatch(/--opp-answer-h:\s*34px/);
    expect(css).toMatch(/\[data-empty\][^{]*\{[^}]*visibility:\s*hidden/);
    expect(css).toMatch(/\.bq-progress-notice\s*\{[^}]*max-height:\s*18px/);
    // 枠は常に描画（出たり消えたりで高さが変わらない）
    expect(read('src/battle/ui/BattleLiveParts.tsx')).toMatch(/data-live-feed-fixed/);
    expect(read('src/battle/ui/BattleLiveStage.tsx')).toMatch(/data-opponent-answer-slot/);
  });

  it('② 正解/不正解が出たあとは解答画面へ戻れない', () => {
    expect(read('src/utils/quizNavigationActions.ts')).toMatch(/if \(showingExplanation\) return;/);
    expect(read('src/components/Quiz.tsx')).toMatch(/canGoPrevious = showingExplanation\s*\?\s*false/);
    expect(read('src/components/explanation/ExplanationHeader.tsx')).not.toMatch(/>\s*問題に戻る/);
  });

  it('③ 第6問Bの図は1枚ずつ、左右の矢印で切り替える', () => {
    const src = read('src/components/ListeningMaterials.tsx');
    expect(src).toMatch(/export function FigureCarousel/);
    expect(src).toMatch(/data-carousel-prev/);
    expect(src).toMatch(/data-carousel-next/);
    expect(src).toMatch(/images\.length > 1 \?\s*\(?\s*<FigureCarousel/);
  });
});

describe('操作説明の撤去（2026-10-24）', () => {
  it('全問題で「ア 選ぶ → ア 斜線 → ア 戻す／閉じる」「?操作説明」を描画しない', () => {
    const files = ['src/components/MultipleChoiceControl.tsx', 'src/components/Quiz.tsx'];
    for (const f of files) expect(read(f)).not.toMatch(/renderEliminationHint\(/);
  });
});
