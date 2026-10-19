import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReviewNav } from './types';

/**
 * 「詳しい結果」で上に出す、解いた問題の切り替えバー（結果にもどる・前/次・番号チップ）。
 * 2026-10-14 のリファクタリングで Explanation.tsx から切り出した。JSX・クラス名・文言は元のまま。
 * 表示する条件（reviewNav があるとき）は呼び出し側に残している。
 */
export function ReviewTopNav({ reviewNav }: { reviewNav: ReviewNav }) {
  return (
        <nav className="practice-pager is-review" aria-label="解いた問題を切り替える" data-practice-pager>
          <div className="practice-pager-row">
            <button type="button" className="practice-pager-back" onClick={reviewNav.onSummary} aria-label="結果にもどる"><ChevronLeft size={16} aria-hidden="true" />結果</button>
            <button type="button" className="practice-pager-arrow" aria-label="前の問題" disabled={reviewNav.current === 0}
              onClick={() => reviewNav.onPage(Math.max(0, reviewNav.current - 1))}><ChevronLeft size={20} /></button>
            <ol className="practice-pager-chips">
              {reviewNav.pages.map((pg, i) => (
                <li key={i}>
                  <button type="button" data-state={pg.state} aria-current={i === reviewNav.current || undefined}
                    aria-label={`${i + 1}問目（${pg.state === 'ok' ? '正解' : pg.state === 'ng' ? '不正解' : pg.state === 'skip' ? '未解答' : '自己採点'}）`}
                    onClick={() => reviewNav.onPage(i)}>{i + 1}</button>
                </li>
              ))}
            </ol>
            <button type="button" className="practice-pager-arrow" aria-label="次の問題" disabled={reviewNav.current >= reviewNav.pages.length - 1}
              onClick={() => reviewNav.onPage(Math.min(reviewNav.pages.length - 1, reviewNav.current + 1))}><ChevronRight size={20} /></button>
          </div>
        </nav>
  );
}
