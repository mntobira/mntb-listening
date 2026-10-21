/**
 * 学習まとめの「結果の型」だけ（C-20）。studySummary.ts から移した（中身は不変・再エクスポートあり）。
 * CSV 出力（studySummaryCsv.ts）と集計（studySummary.ts）の両方が使うので、循環しないよう型だけを下の層に置く。
 */
// ===================================================================
// 復習の実行状況（＝「主体的に取り組む態度」の中核）
// ===================================================================

export interface ReviewDiscipline {
  /** 復習リストに載っている総数 */
  total: number;
  /** 期限が来ているのに未対応の数 */
  overdue: number;
  /** box が最終段階まで進んだ（＝定着した）数 */
  mastered: number;
  /** 復習で解き直した回数の合計 */
  retryCount: number;
  /** 間違えた回数の合計 */
  wrongCount: number;
  /**
   * 立て直し率 = 解き直した回数 / 間違えた回数
   * 「間違えたあと、実際に戻って解き直したか」を表す。
   * 1.0 に近いほど、間違いを放置していない。
   */
  recoveryRate: number;
}

export interface EngagementScore {
  /** 0〜100 の目安値 */
  score: number;
  /** 内訳（先生が自分で判断し直せるように必ず併記する） */
  breakdown: {
    /** 継続（最大50点）：直近14日のうち何日やったか */
    continuity: number;
    /** 立て直し（最大35点）：間違いを解き直しているか */
    recovery: number;
    /** 未処理（最大15点）：期限超過を放置していないか */
    upkeep: number;
  };
}

// ===================================================================
// 生徒1人分のサマリー
// ===================================================================

export interface StudentSummary {
  uid: string;
  displayName: string;
  /** 解いた大問の総数 */
  solvedTotal: number;
  /** 直近14日で学習した日数 */
  activeDaysIn14: number;
  /** 最終学習日（YYYY-MM-DD、記録が無ければ null） */
  lastStudiedAt: string | null;
  review: ReviewDiscipline;
  engagement: EngagementScore;
}
