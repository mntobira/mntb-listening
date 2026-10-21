/**
 * Google Play 版の音声劣化の修正が「ストアに出すビルドの元」に入っていることを固定する（2026-10-17）。
 *
 * ■ なぜ要るか
 *   2026-10-16 の修正（7c0b440）は genspark_ai_developer に入ったが、
 *   ストアに出した 1.0.2（versionCode 12）は修正を含まない別ブランチ（feature/mobile-app-setup）から作られ、
 *   公開版では「夕凪」などの BGM が 10〜90ms ずつ途切れたまま（端末の画面録画で 110 秒中 87 か所）だった。
 *   修正が抜けたブランチからビルドしても、このテストが落ちて気づけるようにする。
 *
 * ■ 確かめること（どれか1つでも欠けると音が途切れる・劣化する）
 *   1. MainActivity が RangeAwareWebViewClient に差し替えている（音源を指定位置から正しく返す）
 *   2. 音源・動画を APK 内で無圧縮にしている（途中から読めるように）
 *   3. 共有 AudioContext を Android では latencyHint:'playback'（大きい出力バッファ）で作る
 *   4. タイトル曲は Android では Web Audio に通さず <audio>.volume で鳴らす
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8');
const JAVA = 'android/app/src/main/java/com/manatobi/listening';

describe('Google Play 版の音声劣化の修正がビルドの元に入っている', () => {
  it('MainActivity が RangeAwareWebViewClient を使う', () => {
    const main = read(`${JAVA}/MainActivity.java`);
    expect(main).toMatch(/bridge\.setWebViewClient\(\s*new RangeAwareWebViewClient\(bridge\)\s*\)/);
    expect(read(`${JAVA}/RangeAwareWebViewClient.java`)).toMatch(/class RangeAwareWebViewClient extends BridgeWebViewClient/);
  });

  it('音源・動画は APK 内で無圧縮', () => {
    const gradle = read('android/app/build.gradle');
    const m = gradle.match(/noCompress\s+([^\n]+)/);
    expect(m, 'android/app/build.gradle に noCompress が無い').not.toBeNull();
    for (const ext of ['mp3', 'mp4', 'm4a']) expect(m![1]).toContain(`'${ext}'`);
  });

  it("Android の共有 AudioContext は latencyHint:'playback'", () => {
    const src = read('src/battle/audio/sharedAudioContext.ts');
    expect(src).toMatch(/isAndroidAudio\(\)/);
    expect(src).toMatch(/latencyHint:\s*'playback'/);
  });

  it('Android のタイトル曲は <audio>.volume で鳴らす（Web Audio に通さない）', () => {
    expect(read('src/battle/audio/titleMediaAudio.ts')).toMatch(/isAndroidAudio\(\)\)\s*\{\s*audio\.volume\s*=/);
  });
});
