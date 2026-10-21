/**
 * フィードバックの送り先（トランスポート層）と疎通診断（C-15: feedback.ts から分離）。
 *   Firestore・Webhook（Apps Script）への送信、送り先ごとの振り分け、管理画面の「送り先の診断」。
 *   中身は分離前と1文字も変えていない。export は feedback.ts からも従来どおり取れる。
 */
import { addDoc, collection, serverTimestamp } from './firestoreMetered';
import { db } from '../firebase';
import { fetchWithTimeout, WEBHOOK_TIMEOUT_MS } from './httpTimeout';
import { asErrorLike } from './errorLike';
import { browserGlobals, FEEDBACK_COLLECTION } from './feedbackTypes';
import type { MaybeBrowserGlobals, FeedbackPayload, FeedbackSink, FeedbackResult } from './feedbackTypes';
import { enqueueFeedback } from './feedbackQueue';
import { getFeedbackWebhookUrl, buildFeedbackPayload, buildFeedbackMailto } from './feedbackPayload';

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
function describeFirestoreError(rawError: unknown): string {
  const error = asErrorLike(rawError);
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
  } catch (rawError) {
    const error = asErrorLike(rawError);
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
    } catch (retryError) {
      throw new Error(
        asErrorLike(retryError)?.name === 'AbortError'
          ? 'スプレッドシートへの送信がタイムアウトしました'
          : 'スプレッドシートに接続できませんでした（URLまたは公開設定をご確認ください）',
      );
    }
  }
}

// -------------------------------------------------------------------
// 送信本体
// -------------------------------------------------------------------

/** 現在有効な送信先の一覧 */
export function activeSinks(): FeedbackSink[] {
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
export async function deliver(payload: FeedbackPayload, sinks: FeedbackSink[]): Promise<FeedbackResult> {
  const delivered: FeedbackSink[] = [];
  const failed: Array<{ sink: FeedbackSink; reason: string }> = [];
  const webhookUrl = getFeedbackWebhookUrl();
  const tasks: Array<Promise<void>> = [];

  const run = (sink: FeedbackSink, task: Promise<void>, describe?: (error: unknown) => string) => {
    tasks.push(task.then(
      () => { delivered.push(sink); },
      (error) => {
        failed.push({ sink, reason: describe ? describe(error) : String(asErrorLike(error)?.message || error) });
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
    } catch (error) {
      results.push({
        sink: 'webhook',
        label: 'Google スプレッドシート',
        status: 'ng',
        detail: String(asErrorLike(error)?.message || error),
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
  const doc = browserGlobals()?.document;
  if (!doc?.createElement || !doc?.head) return null;

  return new Promise<boolean | null>((resolve) => {
    const callbackName = `__chemnote_ping_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const script = doc.createElement('script');
    let settled = false;

    const cleanup = (result: boolean | null) => {
      if (settled) return;
      settled = true;
      try { delete (globalThis as unknown as MaybeBrowserGlobals)[callbackName]; } catch { /* noop */ }
      try { script.remove(); } catch { /* noop */ }
      clearTimeout(timer);
      resolve(result);
    };

    (globalThis as unknown as MaybeBrowserGlobals)[callbackName] = () => cleanup(true);

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
