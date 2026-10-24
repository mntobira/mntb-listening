/**
 * ★Web 版のログインを「同じドメイン」で行うかどうか（2026-10-22 追加 → 2026-10-23 二重スイッチに変更）★
 *   vercel.json で /__/auth/* を firebaseapp.com へ中継しているので、authDomain を今のドメインにすることはできる。
 *   ただし Apple は Services ID の Return URL に今のドメインが登録されていないと
 *   「Invalid web redirect url」で必ず失敗する（2026-10-23 本番で実測。firebaseapp.com の戻り先なら正常）。
 *   そこで ★VITE_AUTH_SAME_ORIGIN と VITE_AUTH_SAME_ORIGIN_APPLE_READY の両方が 'true'★ のときだけ切り替える。
 *   片方だけなら従来どおり firebaseapp.com（2026-10-21 以前に Web ログインが動いていた構成）。
 *   ・アプリ版（Capacitor）と localhost / http では常に従来どおり
 *   手順書：docs/WEB_LOGIN_SAME_ORIGIN.md
 */
export function shouldUseSameOriginAuth(
  flags: { sameOrigin?: string; appleReady?: string },
  loc: { protocol: string; hostname: string } | null,
  native: boolean,
): boolean {
  if (flags.sameOrigin !== 'true' || flags.appleReady !== 'true') return false;
  if (native || !loc) return false;
  const { protocol, hostname } = loc;
  if (protocol !== 'https:' || hostname === 'localhost' || hostname.startsWith('127.') || hostname.endsWith('.local')) return false;
  return true;
}
