/**
 * ===================================================================
 * ユーザーフィードバック収集ユーティリティ
 * ===================================================================
 *
 * 【収集先について】
 * 「メールアドレス（mntobira@gmail.com）に届くのか、Google スプレッドシート
 * に溜まるのか、まだ決めきれていない」という要件に対応するため、
 * “あとから切り替えられる” 3 系統の送信口（sink）を用意している。
 *
 *   ① Firestore（既定・常時ON）
 *      `feedback` コレクションに1件1ドキュメントで保存する。
 *      Firebase コンソールからそのまま閲覧・CSV エクスポートできるので、
 *      「とりあえず消えずに全部溜まる」土台として最優先で書き込む。
 *
 *   ② Google Apps Script Web アプリ（任意・環境変数で有効化）
 *      `VITE_FEEDBACK_WEBHOOK_URL` に GAS のデプロイURLを設定すると、
 *      同じ内容を GAS へ POST する。GAS 側（docs/feedback-gas.js）で
 *        - Google スプレッドシートへ1行追記
 *        - mntobira@gmail.com へメール通知
 *      の両方（または片方だけ）を行える。つまり「スプレッドシート」か
 *      「メール」かの判断を、アプリのコードを触らずに後から決められる。
 *
 *   ③ mailto: フォールバック（任意・最後の手段）
 *      ①②がどちらも失敗した／未設定のときに、本文を差し込んだ
 *      メール作成画面を開くリンクを提示する。宛先は FEEDBACK_EMAIL。
 *
 * さらに、通信失敗時は localStorage の再送キューに積み、次回起動時に
 * 自動で再送する（flushFeedbackQueue）。
 */

import { addDoc, collection, serverTimestamp } from './firestoreMetered';
import { auth, db } from '../firebase';
import { safeLocalStorage } from './safeLocalStorage';
// タイムアウト付き fetch と 15秒のタイムアウト値は、ユーザー記録
// （userRegistry.ts）と同じ GAS へ同じ作法で送るため共通のものを使う
// （以前はこの2ファイルに同じ実装と同じ値が別々に書かれていた）。
import { fetchWithTimeout, WEBHOOK_TIMEOUT_MS } from './httpTimeout';

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

// -------------------------------------------------------------------
// 環境変数アクセス（テスト環境では import.meta.env が無いこともある）
// -------------------------------------------------------------------

function readEnv(key: string): string {
  try {
    const env = (import.meta as any)?.env;
    const value = env ? env[key] : undefined;
    if (typeof value === 'string') return value.trim();
  } catch {
    // import.meta が使えない環境（Node の CJS 実行など）は無視する
  }
  try {
    const value = (globalThis as any)?.process?.env?.[key];
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
    const override = (globalThis as any)?.localStorage?.getItem(FEEDBACK_WEBHOOK_OVERRIDE_KEY);
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
    const ls = (globalThis as any)?.localStorage;
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
    const uuid = (globalThis as any)?.crypto?.randomUUID?.();
    if (uuid) return `fb_${uuid}`;
  } catch {
    // randomUUID が無い環境はフォールバックへ
  }
  return `fb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function safeViewport(): string {
  try {
    const w = (globalThis as any)?.window;
    if (w?.innerWidth) return `${w.innerWidth}x${w.innerHeight}`;
  } catch {
    // SSR / テスト環境
  }
  return 'unknown';
}

function safeUserAgent(): string {
  try {
    const ua = (globalThis as any)?.navigator?.userAgent;
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

// -------------------------------------------------------------------
// 送信口①：Firestore
// -------------------------------------------------------------------

/**
 * Firestore のエラーコードを、原因と対処が分かる日本語に翻訳する。
 *
 * ★ 実測（2026-08-02 本番 mntb-4ef06）
 *   `feedback` への create が `permission-denied` になることを確認済み。
 *   これはリポジトリの firestore.rules が本番へ未反映であることを意味する。
 *   利用者に「あなたの入力が悪い」と誤解させないよう、運営側の設定問題である
 *   ことが伝わる文言にする。
 */
function describeFirestoreError(error: any): string {
  const code = String(error?.code || '');
  if (code.includes('permission-denied')) {
    return '保存先データベースが受け付けを拒否しました（サーバー側の権限設定が未反映です）';
  }
  if (code.includes('unavailable') || code.includes('deadline-exceeded')) {
    return 'ネットワークに接続できませんでした';
  }
  if (code.includes('unauthenticated')) {
    return 'ログイン情報の期限が切れています';
  }
  if (code.includes('invalid-argument') || code.includes('failed-precondition')) {
    return '送信データの形式がサーバーの想定と一致しませんでした';
  }
  return String(error?.message || error || '不明なエラー');
}

async function sendToFirestore(payload: FeedbackPayload): Promise<void> {
  await addDoc(collection(db, FEEDBACK_COLLECTION), {
    // ルール側で検証する必須フィールド
    id: payload.id,
    screen: payload.screen,
    category: payload.category,
    rating: payload.rating,
    message: payload.message,
    uid: payload.uid,
    // 付帯情報
    displayName: payload.displayName,
    authEmail: payload.authEmail,
    contactEmail: payload.contactEmail ?? null,
    context: payload.context ?? null,
    userAgent: payload.userAgent,
    viewport: payload.viewport,
    appVersion: payload.appVersion,
    createdAtIso: payload.createdAtIso,
    // サーバー時刻（並べ替えの基準にする）
    createdAt: serverTimestamp(),
    status: 'new',
  });
}

// -------------------------------------------------------------------
// 送信口②：Google Apps Script Web アプリ（スプレッドシート／メール）
// -------------------------------------------------------------------

/**
 * Google Apps Script（スプレッドシート）へ送る。
 *
 * ★ ここが「連携済みなのに1行も増えない」の主因になりやすい
 *   GAS のウェブアプリは POST を受けると 302 で
 *   `script.googleusercontent.com` へリダイレクトする。
 *   ブラウザの CORS はリダイレクト先にも Access-Control-Allow-Origin を要求するが、
 *   デプロイ設定やブラウザ（特に Safari / iOS）の組み合わせによっては
 *   ここで `TypeError: Failed to fetch` になり、
 *   **サーバー側では正常に1行追記されているのにクライアントは失敗と判定する**。
 *
 *   そこで 2 段構えにする:
 *     ① 通常の CORS リクエスト（成功可否をきちんと判定できる）
 *     ② ①が CORS/ネットワーク由来で落ちたら `mode:'no-cors'` で撃ち直す。
 *        レスポンスは opaque で中身を読めないが、リクエスト自体は GAS に到達する。
 *        「読めない」だけで「届いていない」わけではないため、送達扱いにする。
 *        （二重送信になっても GAS 側は payload.id で重複を判別できる）
 */
async function sendToWebhook(payload: FeedbackPayload, url: string): Promise<void> {
  const body = JSON.stringify(payload);
  // GAS の doPost は CORS プリフライトを返せないため、
  // "text/plain" にして simple request（プリフライト不要）で投げる。
  const init: RequestInit = {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body,
  };

  try {
    const response = await fetchWithTimeout(url, init, WEBHOOK_TIMEOUT_MS);
    if (!response.ok) {
      throw new Error(`スプレッドシート側が ${response.status} を返しました（GASの「アクセスできるユーザー」を「全員」にしてください）`);
    }
    return;
  } catch (error: any) {
    // タイムアウト（中断）は再試行しても無駄なので、そのまま失敗にする
    if (error?.name === 'AbortError') {
      throw new Error('スプレッドシートへの送信がタイムアウトしました');
    }
    // ステータス由来のエラー（上で投げたもの）は再試行しない
    if (typeof error?.message === 'string' && error.message.includes('を返しました')) {
      throw error;
    }

    // ここに来るのは CORS / ネットワーク由来 → no-cors で撃ち直す
    try {
      await fetchWithTimeout(url, { ...init, mode: 'no-cors' }, WEBHOOK_TIMEOUT_MS);
      // opaque レスポンス。到達したとみなす（best effort）
      return;
    } catch (retryError: any) {
      throw new Error(
        retryError?.name === 'AbortError'
          ? 'スプレッドシートへの送信がタイムアウトしました'
          : 'スプレッドシートに接続できませんでした（URLまたは公開設定をご確認ください）',
      );
    }
  }
}

// -------------------------------------------------------------------
// 再送キュー（localStorage）
// -------------------------------------------------------------------

/**
 * 使える localStorage を返す（使えなければ null）。
 * 実装は utils/safeLocalStorage.ts が唯一の定義。
 * 呼び出し側の書き方は今までどおり `readStorage()` のままにしている。
 */
const readStorage = safeLocalStorage;

/**
 * キューに積まれた1件。
 * `pending` に「まだ届いていない送信先」だけを持たせることで、
 * 「Firestore は成功したがスプレッドシートだけ失敗した」場合に
 * スプレッドシートのみを再送でき、Firestore の二重登録を防げる。
 */
export interface QueuedFeedback {
  payload: FeedbackPayload;
  /** 未達の送信先 */
  pending: FeedbackSink[];
}

/** 再送キューを読み出す（旧フォーマットも読めるようにする） */
export function readFeedbackQueue(): QueuedFeedback[] {
  const ls = readStorage();
  if (!ls) return [];
  try {
    const raw = ls.getItem(FEEDBACK_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item: any): QueuedFeedback | null => {
        if (!item || typeof item !== 'object') return null;
        // 新フォーマット { payload, pending }
        if (item.payload && Array.isArray(item.pending)) {
          return { payload: item.payload as FeedbackPayload, pending: item.pending as FeedbackSink[] };
        }
        // 旧フォーマット（ペイロードが直接入っている）→ 全送信先を未達として扱う
        if (typeof item.id === 'string' && typeof item.message === 'string') {
          return { payload: item as FeedbackPayload, pending: ['firestore', 'webhook'] };
        }
        return null;
      })
      .filter((item): item is QueuedFeedback => item !== null);
  } catch {
    return [];
  }
}

function writeFeedbackQueue(items: QueuedFeedback[]): void {
  const ls = readStorage();
  if (!ls) return;
  try {
    // 古いものから捨てて上限を守る
    const trimmed = items.slice(-FEEDBACK_QUEUE_LIMIT);
    if (trimmed.length === 0) ls.removeItem(FEEDBACK_QUEUE_KEY);
    else ls.setItem(FEEDBACK_QUEUE_KEY, JSON.stringify(trimmed));
  } catch {
    // 容量超過などは黙って諦める（ユーザー操作を妨げない）
  }
}

/**
 * 未達の送信先があるフィードバックをキューへ退避する。
 * すでに同じIDが入っている場合は pending を統合する。
 */
export function enqueueFeedback(payload: FeedbackPayload, pending: FeedbackSink[]): void {
  if (pending.length === 0) return;
  const queue = readFeedbackQueue();
  const existing = queue.find((item) => item.payload.id === payload.id);
  if (existing) {
    existing.pending = Array.from(new Set([...existing.pending, ...pending]));
  } else {
    queue.push({ payload, pending: [...pending] });
  }
  writeFeedbackQueue(queue);
}

/** キューの件数（UI 表示用） */
export function pendingFeedbackCount(): number {
  return readFeedbackQueue().length;
}

// -------------------------------------------------------------------
// 送信本体
// -------------------------------------------------------------------

/** 現在有効な送信先の一覧 */
function activeSinks(): FeedbackSink[] {
  const sinks: FeedbackSink[] = ['firestore'];
  if (getFeedbackWebhookUrl()) sinks.push('webhook');
  return sinks;
}

/**
 * 指定された送信先へ並行して送る。
 *
 * ★ 1つでも成功すれば ok = true（ユーザーの意見は受理された）とするが、
 *   失敗した送信先は「その送信先だけ」を再送キューに積む。
 *   これにより「Firestore は成功したのにスプレッドシートの1行だけ失われる」
 *   という取りこぼしを防ぐ。
 */
async function deliver(payload: FeedbackPayload, sinks: FeedbackSink[]): Promise<FeedbackResult> {
  const delivered: FeedbackSink[] = [];
  const failed: Array<{ sink: FeedbackSink; reason: string }> = [];
  const webhookUrl = getFeedbackWebhookUrl();
  const tasks: Array<Promise<void>> = [];

  const run = (sink: FeedbackSink, task: Promise<void>, describe?: (error: any) => string) => {
    tasks.push(task.then(
      () => { delivered.push(sink); },
      (error) => {
        failed.push({ sink, reason: describe ? describe(error) : String(error?.message || error) });
      },
    ));
  };

  if (sinks.includes('firestore')) {
    run('firestore', sendToFirestore(payload), describeFirestoreError);
  }
  if (sinks.includes('webhook') && webhookUrl) {
    run('webhook', sendToWebhook(payload, webhookUrl));
    // webhook が未設定になった場合は「送る必要がない」ので失敗扱いにしない
  }

  await Promise.all(tasks);

  const pending = failed.map((item) => item.sink);
  if (pending.length > 0) enqueueFeedback(payload, pending);

  return {
    ok: delivered.length > 0,
    delivered,
    failed,
    queued: pending.length > 0,
    mailtoUrl: buildFeedbackMailto(payload),
    payload,
  };
}

/**
 * 画面から呼ぶメインAPI。
 * 検証 → ペイロード生成 → 送信 を行い、UI 表示に必要な情報を返す。
 *
 * @throws 入力が不正な場合は Error（メッセージは日本語・そのまま表示可）
 */
const FEEDBACK_RATE_KEY = 'feedback_rate_v1';
const FEEDBACK_PER_MINUTE = 3;
const FEEDBACK_PER_DAY = 20;

/**
 * ★連続送信の歯止め（2026-10-04）★
 * ゲストでも送れる窓口なので、ボタンの連打・スクリプトでの大量投函を端末側で止める。
 * （本当の防御は firestore.rules の形式・サイズ検証。ここは通常利用を邪魔しない一次防御）
 * 送れるなら記録して true、上限なら false を返す。
 */
export function takeFeedbackSlot(now: number = Date.now()): boolean {
  try {
    const ls = (globalThis as any)?.localStorage;
    if (!ls) return true;
    const raw = JSON.parse(ls.getItem(FEEDBACK_RATE_KEY) || '[]');
    const recent = (Array.isArray(raw) ? raw : []).filter((t: unknown) => typeof t === 'number' && now - t < 86400000 && t <= now);
    if (recent.length >= FEEDBACK_PER_DAY) return false;
    if (recent.filter((t: number) => now - t < 60000).length >= FEEDBACK_PER_MINUTE) return false;
    recent.push(now);
    ls.setItem(FEEDBACK_RATE_KEY, JSON.stringify(recent));
    return true;
  } catch {
    return true;
  }
}

export async function submitFeedback(input: FeedbackInput): Promise<FeedbackResult> {
  const validation = validateFeedback(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join('\n'));
  }
  if (!takeFeedbackSlot()) {
    throw new Error('送信が続いています。少し時間をおいてから、もう一度送ってください。');
  }
  const payload = buildFeedbackPayload(input);
  return deliver(payload, activeSinks());
}

// -------------------------------------------------------------------
// 送信経路の自己診断
// -------------------------------------------------------------------

/** 1つの送信口の診断結果 */
export interface SinkDiagnosis {
  sink: FeedbackSink;
  label: string;
  /** 'ok' = 疎通OK / 'ng' = 失敗 / 'off' = 未設定（送信対象外） */
  status: 'ok' | 'ng' | 'off';
  detail: string;
}

/**
 * 送信経路の疎通を実際に試して、どこが詰まっているかを可視化する。
 *
 * 「送信できない」という報告に対して、
 *   ・アプリのコードが悪いのか
 *   ・Firestore のルールが未反映なのか
 *   ・スプレッドシート（GAS）のURL／公開設定が悪いのか
 * を切り分けられるようにするための保守用API（設定画面から呼ぶ）。
 *
 * 診断用の送信には message 冒頭に [診断] を付け、実データと区別できるようにする。
 */
export async function diagnoseFeedbackRoutes(): Promise<SinkDiagnosis[]> {
  const payload = buildFeedbackPayload({
    screen: 'other',
    category: 'other',
    rating: 0,
    message: '[診断] 送信経路の疎通確認です。この行は削除して構いません。',
    context: { diagnosis: true },
  });

  const results: SinkDiagnosis[] = [];

  // ① Firestore
  try {
    await sendToFirestore(payload);
    results.push({
      sink: 'firestore',
      label: 'アプリの管理データベース（Firestore）',
      status: 'ok',
      detail: 'テスト書き込みに成功しました。',
    });
  } catch (error) {
    results.push({
      sink: 'firestore',
      label: 'アプリの管理データベース（Firestore）',
      status: 'ng',
      detail: describeFirestoreError(error),
    });
  }

  // ② Google スプレッドシート（GAS）
  const webhookUrl = getFeedbackWebhookUrl();
  if (!webhookUrl) {
    results.push({
      sink: 'webhook',
      label: 'Google スプレッドシート',
      status: 'off',
      detail: '送信先URLが未設定です。GASのウェブアプリURL（末尾 /exec）を登録してください。',
    });
  } else {
    // まず「そもそも匿名で開けるURLなのか」を JSONP で確かめる。
    // ブラウザからの POST は CORS の都合で結果を読めず（no-cors のため）、
    // 401（限定公開）でも「成功」に見えてしまう。ここで先に潰しておく。
    const reachable = await pingWebhook(webhookUrl);
    if (reachable === false) {
      results.push({
        sink: 'webhook',
        label: 'Google スプレッドシート',
        status: 'ng',
        detail:
          'URLに匿名でアクセスできません。GASの［デプロイ］→［デプロイを管理］で '
          + '「次のユーザーとして実行: 自分」「アクセスできるユーザー: 全員」に設定し、'
          + '新しいバージョンとして再デプロイしてください。',
      });
      return results;
    }

    try {
      await sendToWebhook(payload, webhookUrl);
      results.push({
        sink: 'webhook',
        label: 'Google スプレッドシート',
        status: 'ok',
        detail:
          reachable === true
            ? 'テスト送信に成功しました。シートに [診断] の行が増えているか確認してください。'
            : 'テスト送信を実行しました。ブラウザの制約で結果を読み取れないため、'
              + 'シートに [診断] の行が増えているかを必ず確認してください。',
      });
    } catch (error: any) {
      results.push({
        sink: 'webhook',
        label: 'Google スプレッドシート',
        status: 'ng',
        detail: String(error?.message || error),
      });
    }
  }

  return results;
}

/**
 * GAS のウェブアプリURLに「匿名で到達できるか」を JSONP で確認する。
 *
 * fetch はクロスオリジンの CORS 制約を受けるが、<script> の読み込みは受けない。
 * そのため「限定公開（401）で読み込めない」ことを確実に検出できる。
 *
 * @returns true  … 到達できた（公開設定OK）
 *          false … 読み込めなかった（限定公開・URL誤り）
 *          null  … 判定できなかった（DOMなし等。従来どおり best effort で送る）
 */
async function pingWebhook(url: string): Promise<boolean | null> {
  const doc = (globalThis as any)?.document;
  if (!doc?.createElement || !doc?.head) return null;

  return new Promise<boolean | null>((resolve) => {
    const callbackName = `__chemnote_ping_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const script = doc.createElement('script');
    let settled = false;

    const cleanup = (result: boolean | null) => {
      if (settled) return;
      settled = true;
      try { delete (globalThis as any)[callbackName]; } catch { /* noop */ }
      try { script.remove(); } catch { /* noop */ }
      clearTimeout(timer);
      resolve(result);
    };

    (globalThis as any)[callbackName] = () => cleanup(true);

    const timer = setTimeout(() => cleanup(null), WEBHOOK_TIMEOUT_MS);

    const separator = url.includes('?') ? '&' : '?';
    script.src = `${url}${separator}ping=1&callback=${callbackName}`;
    // 401（限定公開）や URL 誤りは script の読み込みエラーになる
    script.onerror = () => cleanup(false);
    // 読み込めたのに callback が呼ばれない = 旧版のGAS（ping未対応）→ 判定不能
    script.onload = () => setTimeout(() => cleanup(null), 0);

    doc.head.appendChild(script);
  });
}

/**
 * 溜まっている未送信フィードバックをまとめて再送する。
 * アプリ起動時とオンライン復帰時に呼ぶ（失敗したものはキューに残る）。
 *
 * 送信先ごとに未達を記録しているので、例えば「Firestore は既に成功、
 * スプレッドシートだけ未達」の件はスプレッドシートのみ再送し、
 * Firestore に同じ意見が2件登録されることはない。
 *
 * @returns 完全に送り切れてキューから消えた件数
 */
export async function flushFeedbackQueue(): Promise<number> {
  const queue = readFeedbackQueue();
  if (queue.length === 0) return 0;

  // deliver() が失敗時に enqueue するので、先にキューを空にしてから回す
  writeFeedbackQueue([]);

  let cleared = 0;
  for (const item of queue) {
    // webhook が未設定に戻された場合は webhook 待ちを打ち切る
    const targets = item.pending.filter(
      (sink) => sink !== 'webhook' || getFeedbackWebhookUrl(),
    );
    if (targets.length === 0) { cleared += 1; continue; }

    try {
      const result = await deliver(item.payload, targets);
      // 失敗分は deliver() が自動でキューに戻す
      if (!result.queued) cleared += 1;
    } catch {
      // 予期しない例外でも意見を捨てない
      enqueueFeedback(item.payload, targets);
    }
  }

  return cleared;
}
