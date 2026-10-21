/** フィードバックの型と定数（feedback.ts から分けた。値は不変。feedback.ts からも従来どおり import できる） */


/**
 * テスト（Node）でも落ちないよう、ブラウザの機能は globalThis から「あるかもしれない」として読む。
 * 実行時は `globalThis` そのもの（型を付けるだけ）。
 */
export type MaybeBrowserGlobals = {
  process?: { env?: Record<string, string | undefined> };
  localStorage?: Storage;
  crypto?: { randomUUID?: () => string };
  window?: { innerWidth?: number; innerHeight?: number };
  navigator?: { userAgent?: unknown };
  document?: Document;
} & Record<string, unknown>;
export const browserGlobals = (): MaybeBrowserGlobals | undefined => globalThis as unknown as MaybeBrowserGlobals | undefined;

/** フィードバックの送付先メールアドレス（mailto フォールバック／GAS 通知先の既定値） */
export const FEEDBACK_EMAIL = 'mntobira@gmail.com';

/** Firestore のコレクション名 */
export const FEEDBACK_COLLECTION = 'feedback';

/** 再送キューを保存する localStorage キー */
export const FEEDBACK_QUEUE_KEY = 'feedback_outbox_v1';

/** 再送キューに保持する最大件数（localStorage 肥大化の防止） */
export const FEEDBACK_QUEUE_LIMIT = 20;

/** 自由記述の最大文字数（Firestore ルール側の上限と揃える） */
export const FEEDBACK_MESSAGE_MAX = 2000;

/** フィードバックの種類 */
export type FeedbackCategory =
  | 'praise'      // よかった点
  | 'problem'     // 問題・解説の内容について
  | 'bug'         // 不具合・表示崩れ
  | 'request'     // 新機能・改善の要望
  | 'other';      // その他

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  praise: 'よかった点',
  problem: '問題・解説の内容',
  bug: '不具合・表示崩れ',
  request: '要望・改善案',
  other: 'その他',
};

/** どの画面から送られたか */
export type FeedbackScreen =
  | 'title'            // タイトル（ホーム）画面
  | 'chapter_result'   // 単元の結果・解説画面
  | 'mock_exam_result' // 模擬試験の結果画面
  | 'other';

export const FEEDBACK_SCREEN_LABELS: Record<FeedbackScreen, string> = {
  title: 'タイトル画面',
  chapter_result: '単元の結果画面',
  mock_exam_result: '模擬試験の結果画面',
  other: 'その他の画面',
};

/** 画面から渡す入力値 */
export interface FeedbackInput {
  /** 送信元画面 */
  screen: FeedbackScreen;
  /** 種類 */
  category: FeedbackCategory;
  /** 5段階評価（0 = 未選択） */
  rating: number;
  /** 自由記述（必須） */
  message: string;
  /** 返信を希望する場合の連絡先メール（任意） */
  contactEmail?: string;
  /** 画面ごとの付帯情報（単元ID・スコアなど） */
  context?: Record<string, unknown>;
}

/** 実際に送信されるペイロード（メタ情報付き） */
export interface FeedbackPayload extends FeedbackInput {
  /** クライアント側で採番する一意ID（重複送信の検出用） */
  id: string;
  /** ログイン中なら uid、ゲストなら null */
  uid: string | null;
  /** ログイン中の表示名 */
  displayName: string | null;
  /** ログイン中のメールアドレス（本人特定用・任意） */
  authEmail: string | null;
  /** 送信時刻（ISO8601・端末ローカル時刻由来） */
  createdAtIso: string;
  /** UserAgent */
  userAgent: string;
  /** 画面サイズ（不具合報告の再現用） */
  viewport: string;
  /** アプリのバージョン（package.json 由来ではなくビルド時定数を想定） */
  appVersion: string;
}

/** 送信先の種別 */
export type FeedbackSink = 'firestore' | 'webhook';

/** 送信結果 */
export interface FeedbackResult {
  /** 1つ以上の送信口に届いたか */
  ok: boolean;
  /** 成功した送信口 */
  delivered: FeedbackSink[];
  /** 失敗した送信口とエラーメッセージ */
  failed: Array<{ sink: FeedbackSink; reason: string }>;
  /** 未達の送信先があり、再送キューに退避したか */
  queued: boolean;
  /** 手動送信用の mailto: URL（常に生成しておく） */
  mailtoUrl: string;
  /** 実際に送信したペイロード */
  payload: FeedbackPayload;
}

/** 入力検証の結果 */
export interface FeedbackValidation {
  valid: boolean;
  errors: string[];
}
