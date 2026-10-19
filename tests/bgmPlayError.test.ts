import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * R-22: タイトルBGMの audio.play() 失敗処理（3か所のコピー）を handlePlayError に一本化した。
 * 3つの場面それぞれで「出るログ・順番・無音モード切替」が以前と同じかを、
 * 分岐を実際に動かして確かめる（ソースから関数と文言表を取り出して評価する）。
 */
const SRC = readFileSync('src/hooks/useTitleBgmController.tsx', 'utf8');

function build() {
  const table = SRC.slice(SRC.indexOf('const DECODE_HINT'), SRC.indexOf('} as const satisfies'));
  const fn = SRC.slice(SRC.indexOf('const handlePlayError'), SRC.indexOf('};', SRC.indexOf('const handlePlayError')) + 2);
  const strip = (s: string) => s.replace(/: \{ name\?: string; message\?: string \}/, '').replace(/, messages: BgmPlayErrorMessages/, ', messages');
  const logs: string[] = [];
  const state = { logged: false, valid: true };
  const consoleMock = {
    error: (...a: unknown[]) => logs.push('error:' + String(a[0])),
    warn: (...a: unknown[]) => logs.push('warn:' + String(a[0])),
  };
  const body = `${table}};\n${strip(fn)}\nreturn { handlePlayError, BGM_PLAY_ERROR_MESSAGES };`;
  const hasLoggedAudioError = { get current() { return state.logged; }, set current(v: boolean) { state.logged = v; } };
  const api = new Function('console', 'hasLoggedAudioError', 'setIsAudioValid', body)(
    consoleMock, hasLoggedAudioError, (v: boolean) => { state.valid = v; },
  );
  return { api, logs, state };
}

describe('タイトルBGM：再生エラーの共通処理', () => {
  it('3つの場面それぞれ、以前と同じログを同じ順に出す', () => {
    const expected: Record<string, [string, string[], string[], string[]]> = {
      INTERACTION: ['interaction',
        ['error:[BGM Error] Decode failed on interaction. Switching to silent mode.', 'warn:音源ファイルが読み込めないか、サポートされていない形式です。無音でアプリを続行します。'],
        ['warn:[BGM Info] Autoplay blocked by browser. Waiting for user interaction.'],
        ['error:[BGM Error] Unexpected playback error on interaction:']],
      AUTOPLAY: ['autoplay',
        ['error:[BGM Error] Decode failed (NotSupportedError). Switching to silent mode.', 'warn:音源ファイルが読み込めないか、サポートされていない形式です。無音でアプリを続行します。'],
        ['warn:[BGM Info] Autoplay blocked by browser. Waiting for user interaction.'],
        ['error:[BGM Error] Unexpected playback error:']],
      TOGGLE: ['toggle',
        ['error:[BGM Error] Decode failed on toggle. Switching to silent mode.'],
        ['warn:[BGM Info] Playback blocked by browser on toggle.'],
        ['error:[BGM Error] Unexpected playback error on toggle:']],
    };
    for (const [key, [, decode, blocked, other]] of Object.entries(expected)) {
      let t = build();
      t.api.handlePlayError({ name: 'NotSupportedError' }, t.api.BGM_PLAY_ERROR_MESSAGES[key]);
      expect(t.logs, key).toEqual(decode);
      expect(t.state.valid).toBe(false);
      // 2回目は（もう記録済みなので）ログを出さず、無音モードのまま
      t.api.handlePlayError({ message: 'no supported sources' }, t.api.BGM_PLAY_ERROR_MESSAGES[key]);
      expect(t.logs, key).toEqual(decode);

      t = build();
      t.api.handlePlayError({ name: 'NotAllowedError' }, t.api.BGM_PLAY_ERROR_MESSAGES[key]);
      expect(t.logs, key).toEqual(blocked);
      expect(t.state.valid).toBe(true);

      t = build();
      t.api.handlePlayError({ name: 'AbortError' }, t.api.BGM_PLAY_ERROR_MESSAGES[key]);
      expect(t.logs, key).toEqual(other);
      expect(t.state.valid).toBe(true);
    }
  });

  it('同じ分岐のコピーがフック内に残っていない', () => {
    expect(SRC.match(/e\.name === 'NotSupportedError'/g)?.length).toBe(1);
    expect(SRC.match(/handlePlayError\(e, BGM_PLAY_ERROR_MESSAGES\.(INTERACTION|AUTOPLAY|TOGGLE)\)/g)?.length).toBe(3);
  });
});
