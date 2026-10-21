/**
 * ===================================================================
 * フィードバック入口ボタン（モーダル開閉つき）
 * ===================================================================
 * 「どの画面でも1行差し込むだけで意見を集められる」ようにした共通部品。
 *
 *   <FeedbackButton screen="title" variant="card" />
 *   <FeedbackButton screen="chapter_result" variant="inline" context={{ chapterId }} />
 *
 * variant
 *   - 'card'   … タイトル画面の他カードと揃えた横長カード
 *   - 'inline' … 結果画面のボタン列に馴染む中サイズのピル
 *   - 'text'   … 目立たせたくない場所用のテキストリンク
 */

import React, { useState } from 'react';
import { MessageSquareHeart, ChevronRight } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import type { FeedbackScreen } from '../utils/feedback';

interface FeedbackButtonProps {
  screen: FeedbackScreen;
  /** 単元IDやスコアなど、あとから分析したい付帯情報 */
  context?: Record<string, unknown>;
  variant?: 'card' | 'inline' | 'text';
  /** ボタンに出す文字（省略時は variant ごとの既定値） */
  label?: string;
  /** カード variant の補足文 */
  subLabel?: string;
  /** モーダル見出し下の補助文 */
  description?: string;
  className?: string;
}

export function FeedbackButton({
  screen,
  context,
  variant = 'inline',
  label,
  subLabel,
  description,
  className = '',
}: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);

  const buttonLabel = label || (variant === 'card' ? 'ご意見・ご要望' : 'ご意見を送る');

  return (
    <>
      {variant === 'card' && (
        <button
          onClick={() => setOpen(true)}
          aria-label="ご意見・ご要望を送る"
          /* スマホ（md 未満）ではホームの隣のカード（学習ノート／アプリ紹介）と
             同じ高さ（px-4 py-2.5・アイコン 36px）にそろえる。
             このカードだけ 78px で他は 64px だったため、ホームで 3 枚を
             1 画面に収めるときにこのカードの下端だけがナビの下に潜っていた。
             md 以上は従来どおり。 */
          className={`flex items-center gap-3 md:gap-4 px-4 md:px-5 py-2.5 md:py-4 lg:py-3 rounded-[18px] border border-[#F4A9C4]/40 bg-white/90 backdrop-blur-sm hover:bg-[#FFF3F7] hover:border-[#E8688E]/50 active:scale-[0.99] transition-all shadow-[0_8px_22px_-14px_rgba(217,70,110,0.4)] text-left group w-full ${className}`}
        >
          <div className="w-9 h-9 md:w-11 md:h-11 lg:w-10 lg:h-10 rounded-2xl bg-[#FBE0E9] flex items-center justify-center shrink-0">
            <MessageSquareHeart className="w-5 h-5 text-[#E8688E]" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-handwriting font-bold text-[#1B2631] text-base md:text-lg">{buttonLabel}</div>
            <div className="text-xs md:text-xs text-[#8895A0] font-modern mt-0.5">
              {subLabel || '気づいたことを開発者に伝える'}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#B8C4CE] group-hover:text-[#E8688E] group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
        </button>
      )}

      {variant === 'inline' && (
        <button
          onClick={() => setOpen(true)}
          aria-label="ご意見を送る"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#F4A9C4]/70 bg-white text-[#D9466E] text-sm font-bold hover:bg-[#FFF3F7] hover:border-[#E8688E] active:scale-[0.98] transition-all shadow-[0_6px_16px_-10px_rgba(217,70,110,0.6)] ${className}`}
        >
          <MessageSquareHeart size={16} aria-hidden="true" />
          <span>{buttonLabel}</span>
        </button>
      )}

      {variant === 'text' && (
        <button
          onClick={() => setOpen(true)}
          aria-label="ご意見を送る"
          className={`inline-flex items-center gap-1.5 text-xs font-bold text-[#8895A0] hover:text-[#D9466E] underline-offset-4 hover:underline transition-colors ${className}`}
        >
          <MessageSquareHeart size={14} aria-hidden="true" />
          <span>{buttonLabel}</span>
        </button>
      )}

      {open && (
        <FeedbackModal
          screen={screen}
          context={context}
          description={description}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
