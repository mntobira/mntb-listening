/**
 * 解答・解説画面（Explanation と explanation/ 配下の部品）で共有する型。
 * 部品が親（Explanation.tsx）を import すると循環参照になるため、型だけをこの葉ファイルに置く。
 */

/** 結果の「詳しい結果」から開いたときの、問題の切り替えと下部の出口 */
export interface ReviewNav {
  pages: { state: string }[];
  current: number;
  onPage: (i: number) => void;
  onSummary: () => void;
  onHome?: () => void;
  onChapters: () => void;
  onRetryWrong?: () => void;
  retryLabel?: string;
  onNext?: () => void;
  nextLabel?: string;
}
