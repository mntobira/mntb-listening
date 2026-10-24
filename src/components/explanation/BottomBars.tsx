import React from 'react';
import { ArrowLeft, ChevronRight, Home, ListOrdered, Target } from 'lucide-react';
import type { ReviewNav } from './types';

/**
 * 解答・解説画面の下に固定するバー2種。
 * 2026-10-13 のリファクタリングで Explanation.tsx から切り出した。JSX・クラス名・文言は元のまま。
 * 表示する条件（reorderMobile && onNextQuestion／reviewNav があるとき）は呼び出し側に残している。
 */

/**
 * ★スマホ：下部固定ナビ（次の問題へ）。2026-10-23 に「問題に戻る」は外した。
 * 演習画面の「前へ / 解答と解説を見る」と同じ位置・同じ操作感にして、
 * 親指だけで「解く→答え合わせ→次を解く」を回せるようにする。
 */
export function MobileAnswerNav({ onNextQuestion, isLastQuestion }: { onBack?: () => void; onNextQuestion: () => void; isLastQuestion?: boolean }) {
  return (
          <div className="order-4 fixed left-0 right-0 bottom-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.10)] px-3 pt-2.5 pb-[calc(0.6rem+env(safe-area-inset-bottom))]">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
              {/* 「問題に戻る」は置かない（答え合わせの後は進むだけ。2026-10-23） */}
              <button
                onClick={onNextQuestion}
                className="flex shadow-md active:translate-y-0.5 items-center justify-center gap-1.5 px-5 py-3 rounded-xl font-bold tracking-wider transition-all duration-200 text-sm bg-[#2C3E50] text-white active:bg-[#1B2631] flex-1 cursor-pointer"
              >
                <span>{isLastQuestion ? '結果を見る' : '次の問題へ'}</span>
                <ArrowLeft size={16} className="rotate-180 stroke-[2.5]" />
              </button>
            </div>
          </div>
  );
}

/**
 * ★詳しい結果の下のバー（2026-10-04）★ 問題・スクリプト・解説の下に、次にすることをまとめる。
 * 元は2つの兄弟要素（下の余白 div とバー本体）だったので、Fragment で同じ並びのまま返す。
 */
export function ReviewBottomBar({ reviewNav }: { reviewNav: ReviewNav }) {
  return (
    <>
        <div className="practice-bottom-spacer is-review" aria-hidden="true" />
          <div className="practice-bottom-bar is-review" data-review-actions>
            {reviewNav.onRetryWrong
              ? <button type="button" className="pbb-main" onClick={reviewNav.onRetryWrong}><Target size={17} aria-hidden="true" />{reviewNav.retryLabel}</button>
              : reviewNav.onNext && <button type="button" className="pbb-main" onClick={reviewNav.onNext}><ChevronRight size={17} aria-hidden="true" />{reviewNav.nextLabel}</button>}
            <div className="pbb-sub">
              <button type="button" onClick={reviewNav.onChapters}><ListOrdered size={16} aria-hidden="true" />単元選択に戻る</button>
              {reviewNav.onHome && <button type="button" onClick={reviewNav.onHome}><Home size={16} aria-hidden="true" />ホームに戻る</button>}
            </div>
          </div>
    </>
  );
}
