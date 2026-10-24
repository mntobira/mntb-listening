/**
 * Web 版の Google / Apple ログインの「配線」テスト（文字列・設定の検査）。
 * Promise の振る舞いは tests/webSignInCore.test.ts、authDomain の判定は下の shouldUseSameOriginAuth で確かめる。
 *
 * 2026-10-21：auth/argument-error（initializeAuth に Web の resolver が無かった）
 * 2026-10-22：/__/auth 中継・authDomain 切替スイッチ・見張り
 * 2026-10-23：・Web だけ initializeAuth に resolver を入れる（アプリ版は入れない）
 *             ・authDomain の切替は VITE_AUTH_SAME_ORIGIN と VITE_AUTH_SAME_ORIGIN_APPLE_READY の両方が true のときだけ
 *               （Apple の Return URL 未登録のまま切り替えると Apple が必ず失敗するため）
 *             ・キャンセルで redirect しない／Google と Apple を同時に動かさない／ボタンは必ず元に戻る
 *   手順書：docs/WEB_LOGIN_SAME_ORIGIN.md
 */
import { describe, expect, it } from 'vitest';
import { shouldUseSameOriginAuth } from '../src/authDomainPolicy';
import { readFileSync } from 'node:fs';

const g = readFileSync('src/utils/googleAuth.ts', 'utf8');
const fb = readFileSync('src/firebase.ts', 'utf8');
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
  rewrites: { source: string; destination: string }[];
  headers: { source: string; headers: { key: string; value: string }[] }[];
};

describe('Web ログインに resolver を渡す', () => {
  it('popup・redirect・結果の受け取りの3か所すべて', () => {
    expect(g).toContain('signInWithPopup(auth, p, browserPopupRedirectResolver)');
    expect(g).toContain('signInWithRedirect(auth, p, browserPopupRedirectResolver)');
    expect(g).toContain('getRedirectResult(auth, browserPopupRedirectResolver)');
  });
  it('アプリ版は今までどおり nativeSignIn（popup より前で分かれる）', () => {
    expect(g.indexOf('return nativeSignIn(method);')).toBeGreaterThan(0);
    expect(g.indexOf('return nativeSignIn(method);')).toBeLessThan(g.indexOf('signInWithPopup(auth, p'));
  });
  it('firebase.ts：保存の仕方は変えず、resolver は Web のときだけ', () => {
    expect(fb).toContain('const persistence = [indexedDBLocalPersistence, browserLocalPersistence];');
    expect(fb).toContain('native ? { persistence } : { persistence, popupRedirectResolver: browserPopupRedirectResolver }');
    expect(fb).toContain('initializeAuth(app, authDependencies(isCapacitorNative()))');
    expect(fb).toContain("import { shouldUseSameOriginAuth } from './authDomainPolicy';");
  });
});

describe('authDomain の判定（本物の関数を呼ぶ）', () => {
  it('shouldUseSameOriginAuth：2つのスイッチが両方 true で、HTTPS の Web のときだけ', () => {
    const web = { protocol: 'https:', hostname: 'mntb-listening.vercel.app' };
    const both = { sameOrigin: 'true', appleReady: 'true' };
    expect(shouldUseSameOriginAuth(both, web, false)).toBe(true);
    // 片方だけでは切り替えない（2026-10-23：Apple の Return URL 未登録で壊れたため）
    expect(shouldUseSameOriginAuth({ sameOrigin: 'true' }, web, false)).toBe(false);
    expect(shouldUseSameOriginAuth({ appleReady: 'true' }, web, false)).toBe(false);
    expect(shouldUseSameOriginAuth({}, web, false)).toBe(false);
    // アプリ版・localhost・http は常に従来どおり
    expect(shouldUseSameOriginAuth(both, web, true)).toBe(false);
    expect(shouldUseSameOriginAuth(both, { protocol: 'https:', hostname: 'localhost' }, false)).toBe(false);
    expect(shouldUseSameOriginAuth(both, { protocol: 'http:', hostname: 'example.com' }, false)).toBe(false);
    expect(shouldUseSameOriginAuth(both, null, false)).toBe(false);
  });
});

describe('Web ログインを同じドメインで（中継の配線）', () => {
  it('vercel.json：/__/auth を firebaseapp.com へ中継し、SPA の書き換えより前にある', () => {
    const auth = vercel.rewrites.findIndex((r) => r.source === '/__/auth/:path*');
    const spa = vercel.rewrites.findIndex((r) => r.destination === '/index.html');
    expect(auth).toBeGreaterThanOrEqual(0);
    expect(vercel.rewrites[auth].destination).toBe('https://mntb-listening.firebaseapp.com/__/auth/:path*');
    expect(auth).toBeLessThan(spa);
    // SPA 側は __/ を飲み込まない
    expect(vercel.rewrites[spa].source).toContain('__/');
  });
  it('vercel.json：アプリの CSP は /__/ に付けない（Firebase のログイン画面が壊れないように）', () => {
    expect(vercel.headers[0].source).toBe('/((?!__/).*)');
    expect(vercel.headers[0].headers.some((h) => h.key === 'Content-Security-Policy')).toBe(true);
    const authHeaders = vercel.headers.find((h) => h.source === '/__/(.*)');
    expect(authHeaders).toBeTruthy();
    expect(authHeaders!.headers.some((h) => h.key === 'Content-Security-Policy')).toBe(false);
    expect(authHeaders!.headers.find((h) => h.key === 'Cache-Control')?.value).toBe('no-store');
  });
  it('googleAuth.ts：止まらない中心部分（webSignInCore）を使い、redirect は同じドメインのときだけ', () => {
    expect(g).toContain('runWebSignIn<AuthProvider, User>(');
    expect(g).toContain('allowRedirectFallback: AUTH_SAME_ORIGIN_ACTIVE');
    expect(g).toContain('authStateReady: () => auth.authStateReady()');
    expect(g).not.toContain('popupWithWatchdog');
  });
});

describe('ボタンは必ず元に戻る（配線）', () => {
  const files = {
    onboarding: readFileSync('src/components/Onboarding.tsx', 'utf8'),
    profile: readFileSync('src/components/ProfileModal.tsx', 'utf8'),
    banner: readFileSync('src/components/GoogleLinkBanner.tsx', 'utf8'),
    apple: readFileSync('src/features/auth/AppleSignInButton.tsx', 'utf8'),
  };
  it('4つの入口すべてが useSignInGuard を通す（try/finally・Google/Apple の排他・戻るで解除）', () => {
    for (const [name, src] of Object.entries(files)) {
      expect(src, name).toContain('useSignInGuard()');
      expect(src, name).not.toMatch(/await signInWith(Google|Apple)\(\)/);
    }
  });
  it('useSignInGuard：finally で解除し、pageshow（戻る）でも解除する', () => {
    const h = readFileSync('src/hooks/useSignInGuard.ts', 'utf8');
    expect(h).toMatch(/finally \{[\s\S]*setBusy\(false\)/);
    expect(h).toContain("addEventListener('pageshow'");
    expect(h).toContain('useSyncExternalStore(subscribeSignInInFlight, getSignInInFlight');
  });
  it('Onboarding：プロフィール待ちは finally で解除、ログイン済みで画面に残ったら先へ進める', () => {
    expect(files.onboarding).toMatch(/setSyncing\(true\);\s*try \{[\s\S]*?\} finally \{\s*setSyncing\(false\);/);
    expect(files.onboarding).toContain('if (!cancelled && auth.currentUser) void checkProfile(auth.currentUser);');
  });
  it("useAuthRouting：ログイン済み＆プロフィールありなのにログイン画面なら home へ", () => {
    const r = readFileSync('src/hooks/useAuthRouting.ts', 'utf8');
    expect(r).toContain("!wasFirstLoad || appStateRef.current === 'onboarding'");
  });
});
