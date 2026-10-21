/**
 * フィードバックの送り先の設定（Webhook URL の検証・上書き）と、送る中身（ペイロード・mailto）の組み立て
 * （C-15: feedback.ts から分離）。
 *   依存は feedback → feedbackTransports → feedbackPayload の一方向（循環なし）。
 *   中身は分離前と1文字も変えていない。export は feedback.ts からも従来どおり取れる。
 */
import { auth } from '../firebase';
import { browserGlobals, FEEDBACK_EMAIL, FEEDBACK_MESSAGE_MAX, FEEDBACK_CATEGORY_LABELS, FEEDBACK_SCREEN_LABELS } from './feedbackTypes';
import type { FeedbackInput, FeedbackPayload, FeedbackValidation } from './feedbackTypes';
import { safeLocalStorage } from './safeLocalStorage';

// -------------------------------------------------------------------
// 環境変数アクセス（テスト環境では import.meta.env が無いこともある）
// -------------------------------------------------------------------

function readEnv(key: string): string {
  try {
    const env = (import.meta as unknown as { env?: Record<string, unknown> } | undefined)?.env;
    const value = env ? env[key] : undefined;
    if (typeof value === 'string') return value.trim();
  } catch {
    // import.meta が使えない環境（Node の CJS 実行など）は無視する
  }
  try {
    const value = browserGlobals()?.process?.env?.[key];
    if (typeof value === 'string') return value.trim();
  } catch {
    // process が無い環境も無視
  }
  return '';
}

/**
 * 実行時に上書きできる webhook URL を保存する localStorage キー。
 *
 * ★ なぜ実行時上書きが必要か
 *   `VITE_FEEDBACK_WEBHOOK_URL` は Vite の仕様上「ビルド時」に値が埋め込まれる。
 *   そのため、Google スプレッドシート側（GAS）を先に用意していても、
 *   ホスティングの環境変数に入れて再ビルドするまでアプリは URL を知らない。
 *   この「連携したのに届かない」状態を解消するため、設定画面から貼り付けた
 *   URL を localStorage に保持し、再ビルド無しで送信口を有効化できるようにする。
 */
export const FEEDBACK_WEBHOOK_OVERRIDE_KEY = 'feedback_webhook_url_v1';

/**
 * 連携済み Google Apps Script（スプレッドシート追記／メール通知）のURL。
 *
 * .env は .gitignore の対象で本番ビルドに含まれないため、
 * ここを既定値として同梱する。これにより「環境変数の設定漏れで
 * 送信先がゼロになる」という不具合が構造的に起こらなくなる。
 * （GAS の /exec は公開エンドポイントであり、Firebase の設定と同様に
 *   クライアントへ配布されることを前提とした値。）
 *
 * 差し替えたいときは設定画面から上書きできる（localStorage が最優先）。
 */
export const DEFAULT_FEEDBACK_WEBHOOK_URL =
  '';

/**
 * HTTPS の Google Apps Script Web アプリURLを正規化する。
 * URLに埋め込まれた認証情報、別ホスト、`/exec` 以外のパスは受け付けない。
 */
function normalizeAppsScriptWebhookUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'https:') return '';
    if (parsed.username || parsed.password || parsed.port) return '';
    if (parsed.hostname !== 'script.google.com') return '';
    if (!/^\/macros\/s\/[A-Za-z0-9_-]+\/exec\/?$/.test(parsed.pathname)) return '';
    return `${parsed.origin}${parsed.pathname.replace(/\/$/, '')}`;
  } catch {
    return '';
  }
}

/**
 * localStorage の上書き先として承認済みのURLか。
 *
 * 同じ Google Apps Script ホストでも第三者が作成した Web アプリへ差し替えられると、
 * UID・メールアドレス・学習状況を含むフィードバックが流出する。そのため、
 * 同梱の既定URLか、管理者がビルド時に指定したURLと完全一致するものだけを許可する。
 */
export function isAllowedFeedbackWebhookUrl(url: string): boolean {
  const normalized = normalizeAppsScriptWebhookUrl(url);
  if (!normalized) return false;

  const approved = [DEFAULT_FEEDBACK_WEBHOOK_URL, readEnv('VITE_FEEDBACK_WEBHOOK_URL')]
    .map(normalizeAppsScriptWebhookUrl)
    .filter(Boolean);
  return approved.includes(normalized);
}

/**
 * GAS Web アプリ（スプレッドシート／メール転送）のURL。未設定なら ''。
 *
 * 優先順位:
 *   ① localStorage の実行時設定（設定画面から上書き。「今すぐ直したい」運用を最優先）
 *   ② ビルド時の環境変数 VITE_FEEDBACK_WEBHOOK_URL
 *   ③ 同梱の既定URL（DEFAULT_FEEDBACK_WEBHOOK_URL）
 */
export function getFeedbackWebhookUrl(): string {
  try {
    const override = safeLocalStorage()?.getItem(FEEDBACK_WEBHOOK_OVERRIDE_KEY);
    if (typeof override === 'string') {
      const trimmed = override.trim();
      // 意図的に空文字を保存した場合は「既定URLも使わない」という指示として扱う
      if (trimmed === '__disabled__') return '';
      if (isAllowedFeedbackWebhookUrl(trimmed)) return normalizeAppsScriptWebhookUrl(trimmed);
    }
  } catch {
    // localStorage が使えない環境は環境変数／既定値へフォールバック
  }
  const url = normalizeAppsScriptWebhookUrl(readEnv('VITE_FEEDBACK_WEBHOOK_URL'));
  if (url) return url;
  return normalizeAppsScriptWebhookUrl(DEFAULT_FEEDBACK_WEBHOOK_URL);
}

/**
 * 実行時に webhook URL を設定／解除する（設定画面から呼ぶ）。
 * @param url 空文字を渡すと解除して環境変数の値に戻る
 * @returns 保存できたか（形式不正・localStorage 不可のときは false）
 */
export function setFeedbackWebhookUrl(url: string): boolean {
  const trimmed = (url || '').trim();
  try {
    const ls = safeLocalStorage();
    if (!ls) return false;
    if (trimmed === '') {
      ls.removeItem(FEEDBACK_WEBHOOK_OVERRIDE_KEY);
      return true;
    }
    if (!isAllowedFeedbackWebhookUrl(trimmed)) return false;
    ls.setItem(FEEDBACK_WEBHOOK_OVERRIDE_KEY, normalizeAppsScriptWebhookUrl(trimmed));
    return true;
  } catch {
    return false;
  }
}

/** 送信先メールアドレス（環境変数で上書き可能） */
export function getFeedbackEmail(): string {
  return readEnv('VITE_FEEDBACK_EMAIL') || FEEDBACK_EMAIL;
}

/**
 * 現在有効な収集先の一覧（UI で「どこに届くか」を案内するために使う）
 */
export function describeFeedbackSinks(): string[] {
  const sinks = ['アプリの管理データベース（Firestore）'];
  if (getFeedbackWebhookUrl()) {
    sinks.push('Google スプレッドシート／メール通知');
  }
  return sinks;
}

// -------------------------------------------------------------------
// 入力検証
// -------------------------------------------------------------------

/**
 * 送信前の入力チェック。
 * 「空送信」「長すぎる本文」「不正なメール形式」を弾く。
 */
export function validateFeedback(input: Partial<FeedbackInput>): FeedbackValidation {
  const errors: string[] = [];
  const message = (input.message || '').trim();

  if (message.length === 0) {
    errors.push('ご意見・ご感想を入力してください。');
  }
  if (message.length > FEEDBACK_MESSAGE_MAX) {
    errors.push(`本文は${FEEDBACK_MESSAGE_MAX}文字以内で入力してください。`);
  }
  // 星評価は必須。
  // （スプレッドシート側で平均を取るため、未選択の 0 が混ざると
  //   平均値が不当に下がってしまう。よって 1〜5 のみ受け付ける。）
  const rating = input.rating ?? 0;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push('満足度（星）を選択してください。');
  }
  const contact = (input.contactEmail || '').trim();
  if (contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
    errors.push('返信用メールアドレスの形式が正しくありません。');
  }

  return { valid: errors.length === 0, errors };
}

// -------------------------------------------------------------------
// ペイロード生成
// -------------------------------------------------------------------

function createId(): string {
  try {
    const uuid = browserGlobals()?.crypto?.randomUUID?.();
    if (uuid) return `fb_${uuid}`;
  } catch {
    // randomUUID が無い環境はフォールバックへ
  }
  return `fb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function safeViewport(): string {
  try {
    const w = browserGlobals()?.window;
    if (w?.innerWidth) return `${w.innerWidth}x${w.innerHeight}`;
  } catch {
    // SSR / テスト環境
  }
  return 'unknown';
}

function safeUserAgent(): string {
  try {
    const ua = browserGlobals()?.navigator?.userAgent;
    if (typeof ua === 'string') return ua.slice(0, 300);
  } catch {
    // SSR / テスト環境
  }
  return 'unknown';
}

/**
 * 入力値にメタ情報（uid・端末情報・時刻）を付けて送信ペイロードを組み立てる。
 * 副作用を持たない純関数なのでテストしやすい。
 */
export function buildFeedbackPayload(input: FeedbackInput): FeedbackPayload {
  let uid: string | null = null;
  let displayName: string | null = null;
  let authEmail: string | null = null;
  try {
    const user = auth?.currentUser;
    if (user) {
      uid = user.uid;
      displayName = user.displayName || null;
      authEmail = user.email || null;
    }
  } catch {
    // Firebase 未初期化（テスト等）でも送信できるようにする
  }

  return {
    id: createId(),
    screen: input.screen,
    category: input.category,
    rating: input.rating ?? 0,
    message: (input.message || '').trim().slice(0, FEEDBACK_MESSAGE_MAX),
    contactEmail: (input.contactEmail || '').trim() || undefined,
    context: input.context && Object.keys(input.context).length > 0 ? input.context : undefined,
    uid,
    displayName,
    authEmail,
    createdAtIso: new Date().toISOString(),
    userAgent: safeUserAgent(),
    viewport: safeViewport(),
    appVersion: readEnv('VITE_APP_VERSION') || 'dev',
  };
}

// -------------------------------------------------------------------
// mailto: フォールバック
// -------------------------------------------------------------------

/** 人が読める1行ラベルに整える */
function contextLines(context?: Record<string, unknown>): string[] {
  if (!context) return [];
  return Object.entries(context).map(([key, value]) => `  - ${key}: ${String(value)}`);
}

/**
 * mailto: リンクを生成する。
 * ①②が使えない環境（オフライン・ルール未反映・webhook 未設定）でも
 * ユーザーが自分のメーラーから送れるようにする最後の砦。
 */
export function buildFeedbackMailto(payload: FeedbackPayload, to: string = getFeedbackEmail()): string {
  const subject = `【まなとび】フィードバック（${FEEDBACK_SCREEN_LABELS[payload.screen]}／${FEEDBACK_CATEGORY_LABELS[payload.category]}）`;
  const body = [
    'ご意見・ご感想：',
    payload.message,
    '',
    '--- 以下は自動で付与された情報です（そのまま送信してください）---',
    `送信画面: ${FEEDBACK_SCREEN_LABELS[payload.screen]}`,
    `種類: ${FEEDBACK_CATEGORY_LABELS[payload.category]}`,
    // 数値のみ（「5 / 5」のような書式だとスプレッドシートで平均が取れない）
    `評価: ${payload.rating > 0 ? String(payload.rating) : ''}`,
    `返信希望先: ${payload.contactEmail || '（なし）'}`,
    `送信日時: ${payload.createdAtIso}`,
    `ユーザー: ${payload.displayName || 'ゲスト'}${payload.uid ? `（uid: ${payload.uid}）` : ''}`,
    `アプリ版: ${payload.appVersion}`,
    `画面サイズ: ${payload.viewport}`,
    `UserAgent: ${payload.userAgent}`,
    ...(payload.context ? ['付帯情報:', ...contextLines(payload.context)] : []),
    `管理ID: ${payload.id}`,
  ].join('\n');

  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
