/**
 * =====================================================================
 * ソフトウェアキーボードで入力欄が隠れるのを防ぐスクロール調整
 * =====================================================================
 *
 * ■ なぜ Quiz.tsx から切り出したのか
 *   ここは「クイズ」に固有の処理ではなく、
 *   スマホで入力欄にフォーカスしたときの見え方を整える汎用処理である。
 *   Quiz.tsx に置いておくと、クイズの進行を読みたいときに
 *   visualViewport の細かい計算を毎回読み飛ばすことになる。
 *
 * ■ 動きは 1 バイトも変えていない
 *   余白 24px・待ち時間 300ms/1000ms・floating-answer-bar の高さ補正は
 *   Quiz.tsx にあったものと同一。
 */
import type React from 'react';

// iOS/Android: ソフトウェアキーボード出現時に入力欄がキーボードで隠れるのを防ぐため、
// フォーカス時に少し遅延して入力欄を画面内へスクロールする。
// visualViewport API が使える場合は、キーボードで狭まった実際の可視領域を基準に
// 入力欄がキーボードの上に来るよう調整する（block:'center' だとキーボード裏に隠れることがある）。
export const scrollInputIntoView = (target: HTMLElement) => {
  const vv = window.visualViewport as VisualViewport | null | undefined;
  if (vv) {
    const rect = target.getBoundingClientRect();
    // 可視領域の下端（キーボード上端に相当）
    const visibleBottom = vv.offsetTop + vv.height;
    // フローティング解答バーはキーボードの上に重なって表示されるため、
    // 「可視領域の下端」だけを基準にするとバーの裏に隠れてしまう。
    // 実際のバーの高さを測って遮蔽領域として差し引く。
    // （入力欄拡大でバーが高くなったぶん、この補正がないと選択中の空欄が隠れる）
    const bar = document.getElementById('floating-answer-bar');
    const barHeight = bar ? bar.getBoundingClientRect().height : 0;
    // 入力欄の下端が実効可視下端より下（＝キーボード／バーに隠れている）なら、
    // 余白 24px を確保してスクロールする。
    const margin = 24;
    const overflowBottom = rect.bottom - (visibleBottom - margin - barHeight);
    if (overflowBottom > 0) {
      window.scrollBy({ top: overflowBottom, behavior: 'smooth' });
      return;
    }
    // 入力欄が可視領域の上に隠れている場合（上端側はバーの高さと無関係）
    const overflowTop = (vv.offsetTop + margin) - rect.top;
    if (overflowTop > 0) {
      window.scrollBy({ top: -overflowTop, behavior: 'smooth' });
      return;
    }
    return;
  }
  // visualViewport 非対応環境のフォールバック
  try {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch {
    target.scrollIntoView();
  }
};

export const handleInputFocusScroll = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const target = e.currentTarget;
  // キーボードの表示アニメーション完了を待ってからスクロールする。
  setTimeout(() => scrollInputIntoView(target), 300);
  // visualViewport のリサイズ（キーボード出現）を捉えて再調整（iOS で確実にするため）。
  const vv = window.visualViewport as VisualViewport | null | undefined;
  if (vv) {
    const onResize = () => {
      scrollInputIntoView(target);
      vv.removeEventListener('resize', onResize);
    };
    vv.addEventListener('resize', onResize);
    // 保険として一定時間後にリスナーを解除
    setTimeout(() => vv.removeEventListener('resize', onResize), 1000);
  }
};
