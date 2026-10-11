import React from 'react';
import { AD_TOGGLES } from '../utils/adConfig';

/**
 * 妙案3: 解説画面スクロール末尾のインライン広告スロット
 * =========================================================
 * - AD_TOGGLES.enableInlineAd が false のときは何も描画しません（DOM自体存在しない）。
 * - true のとき、解説を一通り読み終えた最下部に、
 *   UIデザイン（マナトビの丸み・落ち着いた色合い）に溶け込む形で広告枠を表示します。
 * - 固定ナビや操作ボタンと重ならないため、誤タップや操作不能が一切発生しません。
 */
export function InlineAdSlot({ className = '' }: { className?: string }) {
  if (!AD_TOGGLES.enableInlineAd) return null;

  return (
    <aside
      aria-label="スポンサーリンク"
      className={`my-6 mx-auto w-full max-w-xl rounded-2xl border border-[#e3d9c8] bg-[#fffdf6] p-4 shadow-[0_2px_8px_rgba(80,60,30,0.05)] transition-all ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[#e3d9c8]/70 pb-2 mb-3">
        <span className="text-[11px] font-bold tracking-wider text-[#7a6a4c] uppercase">
          SPONSORED
        </span>
        <span className="text-[10px] text-gray-400">広告</span>
      </div>

      {/* ネイティブ広告 / インラインユニットのプレースホルダー・描画領域 */}
      <div className="flex flex-col items-center justify-center min-h-[90px] rounded-xl bg-[#f6efe2]/60 border border-dashed border-[#cbbda6]/60 p-4 text-center">
        <p className="text-xs font-bold text-[#3d3222] mb-1">
          おすすめの学習コンテンツ・サービス
        </p>
        <p className="text-[11px] text-[#7a6a4c]">
          （AdMob インライン・ネイティブ広告配信枠）
        </p>
      </div>
    </aside>
  );
}
