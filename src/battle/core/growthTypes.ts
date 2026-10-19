/** growth.ts の記録の型（SubjectProgress / DailyRecord / GrowthProgress）。
 *  分割したモジュールが growth.ts を import して循環しないよう、型だけをここに置く。 */

/** 教科ごとの成績（ジャンル別統計） */
export interface SubjectProgress {
  matches: number;
  wins: number;
  /** 正解数 */
  correct: number;
  /** 解答した（権利があった）問題数 */
  answered: number;
}

export interface DailyRecord {
  /** YYYY-MM-DD */
  date: string;
  /** ミッションID → 進捗の数 */
  progress: Record<string, number>;
  /** 受け取り済みミッションID */
  claimed: string[];
}

/**
 * 1人ぶんの成長記録。
 *
 * ★レート（battle_ranking）と分けている理由★
 * battle_ranking は「1試合で勝敗がちょうど1増える」など
 * 厳格なルールで守られている。そこに経験値・バッジ・装備を混ぜると、
 * ミッション達成（試合ではない）で書けなくなるか、
 * ルールを緩めてレートの守りを弱めるかの二択になる。
 * 成長記録は「見せる／飾る」ためのもので、勝敗の真正性とは独立に扱う。
 */
export interface GrowthProgress {
  uid: string;
  /** 累積経験値（減らない） */
  xp: number;
  /** ミッション報酬などで貯まる通貨（装備の交換に使う） */
  coins: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  /** 累計正解数 */
  correct: number;
  /** 累計解答数 */
  answered: number;
  /** 1試合内の最高連続正解 */
  bestStreak: number;
  /** 全問正解した試合数 */
  perfectGames: number;
  /** 早押しモードでの勝利数 */
  buzzWins: number;
  /** 学習で埋めた穴の累計 */
  holesFilled: number;
  /** ログイン（対戦モードを開いた）日数 */
  loginDays: number;
  /** 最後に数えた日（YYYY-MM-DD、端末ローカル） */
  lastLoginDate: string;
  /** 連続ログイン日数 */
  loginStreak: number;
  /** デイリーコンプリート宝箱：連続で開けた日数 */
  completeStreak: number;
  /** デイリーコンプリート宝箱：開けた日数の累計 */
  completeDays: number;
  /** デイリーコンプリート宝箱：最後に開けた日（YYYY-MM-DD） */
  lastCompleteDate: string;
  /** 教科ID → 成績 */
  subjects: Record<string, SubjectProgress>;
  /** 獲得したバッジID → 獲得時刻（epoch ms） */
  badges: Record<string, number>;
  /** 所持している装備のID */
  owned: string[];
  /** いま身につけているもの */
  equipped: {
    /** 称号（バッジIDまたは '' でレート称号を使う） */
    title: string;
    /** 扉くんのポーズ */
    pose: string;
    /** 枠の色 */
    frame: string;
    /** 部位ごとのアクセサリ（'' = つけない） */
    hat: string;
    glasses: string;
    cheek: string;
    aura: string;
    /** アプリの壁紙（'' = いつもの背景） */
    wallpaper: string;
  };
  /** 今日のミッション進捗 */
  daily: DailyRecord;
  /** 直前に反映した部屋ID（同じ試合の二重反映を防ぐ） */
  lastRoomId: string;
  /** 演習で得点した大問の累計（同じ大問は1日1回まで数える） */
  studySolved: number;
  /** マナラッシュ（60秒チャレンジ）の挑戦回数 */
  rushPlays: number;
  /** マナラッシュの自己ベスト（全教科） */
  rushBest: number;
  /** マナラッシュの最高コンボ */
  rushBestCombo: number;
  /** 教科ID → マナラッシュ自己ベスト */
  rushBestBy: Record<string, number>;
}
