/**
 * ページ上の <audio> 要素をまとめて止める（二重再生の防止）。
 *
 * 以前は `document.querySelectorAll('audio').forEach(a => a.pause())` が
 * 画面ごとに8か所へ書き写されており、「自分自身を除くか」「再生中だけか」が
 * 場所ごとにばらついていた。ここに1つだけ置く。
 *
 * ・`except` に渡した要素は止めない（いま鳴らし始めた音源自身）
 * ・止まっている要素の pause() は何もしないのと同じなので、再生中かどうかは問わない
 * ・BGM（App の <audio loop>）も止める。練習音源と BGM が重ならないようにするための
 *   従来どおりの挙動（ListeningAudioPlayer の「BGM・他プレーヤーとの二重再生防止」）。
 * ・`root` を渡すと、その中の要素だけを止める（ダイアログ内だけ、など）
 *
 * SSR／テスト環境（document が無い）では何もしない。
 */
export interface PauseAllAudioOptions {
  /** BGM（data-bgm-audio を付けた <audio>）を止めずに残すか（既定 false＝従来どおり BGM も止める） */
  keepBgm?: boolean;
}

export function pauseAllAudio(
  except: HTMLMediaElement | null = null,
  root: ParentNode | null = typeof document === 'undefined' ? null : document,
  options?: PauseAllAudioOptions,
): void {
  if (!root) return;
  const keepBgm = Boolean(options?.keepBgm);
  root.querySelectorAll('audio').forEach((el) => {
    if (keepBgm && el.hasAttribute?.('data-bgm-audio')) return;
    if (el !== except && !el.paused) el.pause();
  });
}
