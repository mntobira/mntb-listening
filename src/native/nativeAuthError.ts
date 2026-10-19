/**
 * アプリ版（Capacitor）のログイン失敗を「原因の種類」に分ける。
 *
 * ■ なぜ分けるか
 *   端末ネイティブのログインは、失敗の原因がほぼ「アプリ側の設定」か「Firebase コンソールの登録」。
 *   英語の生エラーをそのまま出すと、利用者にも開発者にも何を直せばよいか分からない。
 *   種類ごとに、利用者向けの日本語と、開発者が調べるための短いコード（[NA-xxx]）を付ける。
 *
 * ■ 判定元（@capacitor-firebase/authentication 8.x / Google Credential Manager の実際の文言）
 *   ・"... sign-in provider is not enabled. Make sure to add the provider to the 'providers' list ..."
 *       → capacitor.config.ts の FirebaseAuthentication.providers 不足（NA-PROVIDER）
 *   ・"The Google Sign-In SDK is not included in this build" / "NoClassDefFoundError ...googleid"
 *       → Android: rgcfaIncludeGoogle、iOS: SwiftPM の Google trait 不足（NA-SDK）
 *   ・"[28444] Developer console is not set up correctly" / ApiException 10 / "DEVELOPER_ERROR"
 *       → Firebase に SHA-1 が未登録、またはパッケージ名違い（NA-SHA1）
 *   ・"No credentials available" / NoCredentialException
 *       → 端末に Google アカウントが無い、または SHA-1 未登録でも出る（NA-NOCRED）
 *   ・"not implemented" / "UNAVAILABLE" / "configuration" / "GoogleService-Info.plist"
 *       → google-services.json / GoogleService-Info.plist の未配置（NA-CONFIG）
 *   ・network / timeout → 通信（NA-NETWORK）
 *   ・canceled / 12501 / 1001 → 本人のキャンセル（メッセージだけ・コードなし）
 */

export type NativeAuthErrorKind =
  | 'cancelled'
  | 'provider-not-enabled'
  | 'sdk-missing'
  | 'developer-console'
  | 'no-credential'
  | 'config-missing'
  | 'network'
  | 'unknown';

export interface NativeAuthErrorInfo {
  kind: NativeAuthErrorKind;
  /** 画面に出す日本語（末尾に [NA-xxx] が付く。キャンセルは付かない） */
  message: string;
  /** 解析・問い合わせ用の短いコード */
  code: string;
}

const CODES: Record<NativeAuthErrorKind, string> = {
  cancelled: 'NA-CANCEL',
  'provider-not-enabled': 'NA-PROVIDER',
  'sdk-missing': 'NA-SDK',
  'developer-console': 'NA-SHA1',
  'no-credential': 'NA-NOCRED',
  'config-missing': 'NA-CONFIG',
  network: 'NA-NETWORK',
  unknown: 'NA-UNKNOWN',
};

function readText(rawError: unknown): string {
  if (rawError == null) return '';
  if (typeof rawError === 'string') return rawError;
  const e = rawError as { code?: unknown; message?: unknown; errorMessage?: unknown };
  return [e.code, e.message, e.errorMessage]
    .filter((v) => v != null && v !== '')
    .map((v) => String(v))
    .join(' ');
}

export function classifyNativeAuthError(rawError: unknown): NativeAuthErrorKind {
  const t = readText(rawError).toLowerCase();
  if (!t) return 'unknown';
  if (/cancel|12501|\b1001\b|user denied|aborted by user/.test(t)) return 'cancelled';
  if (t.includes('provider is not enabled') || t.includes("'providers' list")) return 'provider-not-enabled';
  if (t.includes('sdk is not included') || t.includes('noclassdeffound') || t.includes('classnotfound')) return 'sdk-missing';
  if (t.includes('28444') || t.includes('developer console') || t.includes('developer_error') || /apiexception:?\s*10\b/.test(t) || /^10:/.test(t)) {
    return 'developer-console';
  }
  if (t.includes('no credential') || t.includes('nocredentialexception')) return 'no-credential';
  if (t.includes('not implemented') || t.includes('unavailable') || t.includes('configuration') || t.includes('googleservice-info') || t.includes('google-services') || t.includes('clientid')) {
    return 'config-missing';
  }
  if (t.includes('network') || t.includes('timeout') || t.includes('timed out') || t.includes('offline')) return 'network';
  return 'unknown';
}

/**
 * 失敗を利用者向けの文に直す。
 * @param label 'Google' | 'Apple'
 */
export function describeNativeAuthError(rawError: unknown, label: string): NativeAuthErrorInfo {
  const kind = classifyNativeAuthError(rawError);
  const code = CODES[kind];
  const tag = ` [${code}]`;
  let message: string;
  switch (kind) {
    case 'cancelled':
      return { kind, code, message: `${label} ログインがキャンセルされました。` };
    case 'provider-not-enabled':
    case 'sdk-missing':
    case 'config-missing':
      message = `このアプリの ${label} ログイン設定が足りないため、ログインできませんでした。お手数ですが、少し時間をおいてアプリを更新してからお試しください。`;
      break;
    case 'developer-console':
      message = `${label} ログインの登録（アプリの署名）がまだ反映されていないため、ログインできませんでした。運営が対応します。もう一方のログイン方法か、時間をおいてお試しください。`;
      break;
    case 'no-credential':
      message = `この端末で使える ${label} アカウントが見つかりませんでした。端末の「設定 → アカウント」で ${label} アカウントを追加してから、もう一度お試しください。`;
      break;
    case 'network':
      message = `通信ができなかったため ${label} ログインできませんでした。電波のよい場所で、もう一度お試しください。`;
      break;
    default: {
      const raw = readText(rawError).slice(0, 120);
      message = `${label} ログインに失敗しました。${raw ? `（${raw}）` : ''}`;
    }
  }
  return { kind, code, message: message + tag };
}
