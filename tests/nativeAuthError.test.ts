import { describe, expect, it } from 'vitest';
import { classifyNativeAuthError, describeNativeAuthError } from '../src/native/nativeAuthError';
import { readFileSync } from 'node:fs';

describe('アプリ版ログインの失敗を種類に分ける', () => {
  it.each([
    ["Google sign-in provider is not enabled. Make sure to add the provider to the 'providers' list in the Capacitor configuration.", 'provider-not-enabled'],
    ['The Google Sign-In SDK is not included in this build.', 'sdk-missing'],
    ['[28444] Developer console is not set up correctly.', 'developer-console'],
    ['10: ', 'developer-console'],
    ['No credentials available', 'no-credential'],
    ['The user canceled the sign-in flow.', 'cancelled'],
    ['A network error (such as timeout) has occurred', 'network'],
    ['something else', 'unknown'],
  ])('%s → %s', (message, kind) => {
    expect(classifyNativeAuthError({ message })).toBe(kind);
  });
  it('利用者向けの文に調べ用のコードが付く（キャンセルには付かない）', () => {
    expect(describeNativeAuthError({ message: '[28444] Developer console is not set up correctly.' }, 'Google').message).toContain('[NA-SHA1]');
    expect(describeNativeAuthError({ message: 'canceled' }, 'Google').message).not.toContain('[NA-');
  });
});

describe('アプリ版のログイン設定', () => {
  it('capacitor.config で Google / Apple を有効にしている', () => {
    const c = readFileSync('capacitor.config.ts', 'utf8');
    expect(c).toMatch(/providers:\s*\[\s*'google\.com',\s*'apple\.com'\s*\]/);
    expect(c).toMatch(/skipNativeAuth:\s*true/);
  });
  it('Android の Google ログイン SDK を含めている', () => {
    expect(readFileSync('android/variables.gradle', 'utf8')).toMatch(/rgcfaIncludeGoogle\s*=\s*true/);
  });
});
