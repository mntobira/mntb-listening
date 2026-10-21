/**
 * 選んだ解答欄へ「本物のフォーカス」とスクロールを合わせる（C-02: Quiz.tsx から分離）。
 *
 *   1. useLayoutEffect … 前へ／次へ・キーボードの next で移動したとき、描画前（同期）に .focus() する。
 *      iOS はユーザー操作に続く同期の focus ならソフトキーボードを閉じない（「次へ」で入力が一瞬切れる不具合の対策）
 *   2. useEffect       … スマホで選んだ欄が変わったら、カード内の入力欄へフォーカスしてキーボードの上に見せる
 *   3. useEffect       … スマホでキーボード表示中も、いま入力している穴（黄色の <mark>）を問題ペインの中央に寄せる
 *
 * ★フックの数と順番は Quiz.tsx にあったときと同じ★
 *   Quiz はこのフックを、3つの effect があった位置でそのまま1回呼ぶ。
 *   カスタムフックの中のフックはその場で順に実行されるので、React から見た呼び出し順は変わらない。
 *   中身（3つの effect の本体と依存配列）は1文字も変えていない。
 */
import { useEffect, useLayoutEffect } from 'react';
import type React from 'react';
import { isShortAnswerType } from '../utils/quizBlanks';
import { scrollInputIntoView } from '../utils/quizInputScroll';
import type { Problem } from '../types/curriculum';

export function useQuizInputFocus({ focusedSubId, isDesktop, pendingFocusIdRef, inputRefs, getCurrentQuestion, problemScrollRef }: {
  focusedSubId: string | null;
  isDesktop: boolean;
  pendingFocusIdRef: React.MutableRefObject<string | null>;
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>;
  /**
   * いま表示中の問題。Quiz では currentQuestionRef の宣言がこのフック呼び出しより後ろにあるので、
   * 値ではなく「読み出す関数」で受け取る（effect の中で読むのは分離前と同じタイミング）。
   */
  getCurrentQuestion: () => Problem | undefined;
  problemScrollRef: React.MutableRefObject<HTMLDivElement | null>;
}): void {
  // 「次へ/前へ」やキーボードの next キーによる移動時は、再レンダー直後・描画前に
  // 同期でフォーカスを移す（useLayoutEffect）。iOS はユーザー操作に続く同期的な
  // focus 移動であればソフトキーボードを閉じないため、「次へ」で入力状態が一瞬
  // 解除される不具合を防げる（課題2）。
  useLayoutEffect(() => {
    if (isDesktop) return;
    if (!focusedSubId) return;
    if (pendingFocusIdRef.current !== focusedSubId) return;
    pendingFocusIdRef.current = null;
    // テキスト非入力（選択式・並べ替え）はキーボードを開かないため
    // フォーカス移動は不要。
    {
      const cur = (getCurrentQuestion()?.subQuestions || []).find((sq) => sq.id === focusedSubId);
      const isText = cur && (isShortAnswerType(cur) || cur.type === 'descriptive');
      if (!isText) return;
    }
    // ★入力欄は「カード内の実入力欄」1つだけ（ご指摘「タップしたらなんで
    //   重複して解答欄が出てくるかわからん」への対応で、下部バーの複製
    //   入力欄を廃止した）。前へ/次へでの移動先もカード内の入力欄になる。
    const el = inputRefs.current[focusedSubId] ?? null;
    if (el) {
      el.focus({ preventScroll: true });
      try {
        const len = (el.value || '').length;
        el.setSelectionRange?.(len, len);
      } catch {
        /* noop */
      }
    }
  }, [focusedSubId, isDesktop]);

  // 選択中の空欄（focusedSubId）が変わったら、そのカード内の入力欄へ
  // 実フォーカスを移してソフトキーボードを開く。
  //
  // ★入力欄は「カード内」の1か所だけ（ご指摘対応）
  // ─────────────────────────────────────────────
  // ご指摘：「タップしたらなんで重複して解答欄が出てくるかわからん。
  //          普通に入力できるようにしてよ。」
  // 以前は「カード＝表示専用チップ／実入力＝下部バーの複製入力欄」の
  // 2段構えで、同じ設問の解答欄が画面に2つ見えていた。
  // いまはカード内の入力欄に直接書き込む方式なので、フォーカスも
  // カード内の入力欄（inputRefs）へ移すだけでよい。
  // （移動由来の pendingFocus は上の useLayoutEffect が処理済みなのでスキップ）
  useEffect(() => {
    if (isDesktop) return;
    if (!focusedSubId) return;
    // テキスト非入力（選択式・並べ替え）はキーボードを開かないため、
    // カードのスクロールのみ行いフォーカス移動はしない。
    const curSub = (getCurrentQuestion()?.subQuestions || []).find((sq) => sq.id === focusedSubId);
    const isTextFocus = curSub && (isShortAnswerType(curSub) || curSub.type === 'descriptive');
    if (!isTextFocus) {
      const card = document.getElementById(`ans-card-${focusedSubId}`);
      if (card) {
        const raf = requestAnimationFrame(() => setTimeout(() => scrollInputIntoView(card), 150));
        return () => cancelAnimationFrame(raf);
      }
      return;
    }
    const raf = requestAnimationFrame(() => {
      const el = inputRefs.current[focusedSubId] ?? null;
      // すでにフォーカス済み（useLayoutEffect で処理済み・ユーザーの直接タップ等）
      // なら二重処理しない
      if (el && document.activeElement !== el) {
        el.focus({ preventScroll: true });
        try {
          const len = (el.value || '').length;
          el.setSelectionRange?.(len, len);
        } catch {
          /* noop */
        }
      }
      // 選択中の入力欄がキーボード・下部バーに隠れないようスクロール
      if (el) setTimeout(() => scrollInputIntoView(el), 320);
    });
    return () => cancelAnimationFrame(raf);
  }, [focusedSubId, isDesktop]);

  // ─────────────────────────────────────────────
  // G-3：キーボード表示中でも「いま入力している穴抜きのカッコ」が見えるようにする
  // ─────────────────────────────────────────────
  // ご要望：「文字の入力欄を出す時に、全体が上に上がりすぎて問題が見えなく
  //          なるので、うまいこと工夫して問題(穴抜きなどのカッコの場所)は
  //          見えるようにしたい」
  // キーボード表示中は問題ペインが max-h-[24vh] に縮むが、縮んだだけでは
  // 該当の空欄が画面外（スクロール下）にあることが多い。そこで、
  // フォーカス中の空欄に対応する黄色ハイライト（<mark>）を問題ペイン内で
  // 探し、ペインのスクロール位置をそのハイライトが中央に来るよう合わせる。
  // ハイライトの描画（combinedHighlights 反映）後に走らせたいので
  // 少し遅延させる。ページ全体は fixed なので window は動かない。
  useEffect(() => {
    if (isDesktop) return;
    if (!focusedSubId) return;
    const timer = setTimeout(() => {
      const pane = problemScrollRef.current;
      if (!pane) return;
      const mark = pane.querySelector('mark');
      if (!mark) return;
      const paneRect = pane.getBoundingClientRect();
      const markRect = (mark as HTMLElement).getBoundingClientRect();
      // ペイン内でのハイライトの相対位置 → ペインの中央に来る scrollTop
      const offsetInPane = markRect.top - paneRect.top + pane.scrollTop;
      const target = Math.max(0, offsetInPane - pane.clientHeight / 2 + markRect.height / 2);
      pane.scrollTo({ top: target, behavior: 'smooth' });
    }, 200);
    return () => clearTimeout(timer);
  }, [focusedSubId, isDesktop]);
}
