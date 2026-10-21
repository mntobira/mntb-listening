import { useEffect, useRef, useState } from 'react';

/**
 * ソフトキーボードの表示/非表示を visualViewport の高さ変化で推定する（Quiz.tsx から移した。判定は不変）。
 *
 *   keyboardVisible … キーボードが出ているか（可視領域が 15% 以上縮んだら表示とみなす）
 *   keyboardOffset  … 画面下端からキーボード上端までの距離（px）。
 *                     iOS Safari では position:fixed + bottom:0 がキーボードに隠れるため、
 *                     フローティング入力バーの bottom に与えてキーボードに貼り付ける。
 *
 * onKeyboardClosed はキーボードが閉じたと判定されるたびに呼ぶ。
 * resize の監視はマウント時に1回だけ張るので、最初に渡された関数を使い続ける（以前と同じ）。
 */
export function useVirtualKeyboard(onKeyboardClosed: () => void): { keyboardVisible: boolean; keyboardOffset: number } {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const onKeyboardClosedRef = useRef(onKeyboardClosed);

  // ソフトキーボードの表示/非表示を visualViewport の高さ変化で推定する。
  // キーボードが閉じたら、フローティング入力欄も閉じて「問題文全体＋入力欄」を
  // 同時に見られる通常表示に戻す（要件1）。
  useEffect(() => {
    const vv: VisualViewport | null | undefined = window.visualViewport;
    if (!vv) return;
    // 初期のフル高さ。キーボード表示で vv.height はこれより小さくなる。
    const baseline = () => Math.max(vv.height, window.innerHeight || 0);
    let base = baseline();
    const onResize = () => {
      const full = Math.max(base, window.innerHeight || 0);
      // 可視領域が 15% 以上縮んだらキーボード表示とみなす。
      const shrink = full - vv.height;
      const visible = shrink > full * 0.15;
      setKeyboardVisible(visible);
      if (visible) {
        // キーボード上端の位置（レイアウトビューポート下端からの距離）。
        // layout viewport の高さ - (visualViewport の可視下端) がキーボード高さに相当。
        // offsetTop はページスクロール分、height は可視高さ。
        const layoutH = window.innerHeight || full;
        const kbTopFromBottom = Math.max(0, layoutH - (vv.height + vv.offsetTop));
        setKeyboardOffset(kbTopFromBottom);
      } else {
        setKeyboardOffset(0);
        // キーボードが閉じたら呼び出し側に知らせる（フォーカス解除などは呼び出し側が決める）。
        onKeyboardClosedRef.current();
      }
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, []);

  return { keyboardVisible, keyboardOffset };
}
