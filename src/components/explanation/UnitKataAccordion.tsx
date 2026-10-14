import React from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import { ExplanationBody } from '../ExplanationBody';

/**
 * 要件①「この単元の思考の型」の折りたたみ（単元につき1回だけ出す）。
 * 2026-10-13 のリファクタリングで Explanation.tsx の kataAccordion（JSX 変数）を部品にした。
 * JSX・クラス名・文言は元のまま。
 *
 * ★状態は持たない★ 開閉の状態（kataOpen / kataClosedByUser）は親（Explanation）が持ったまま。
 *   この折りたたみは画面の2か所（採点結果の直下／PCリスニングの右列）のどちらかに置かれるので、
 *   部品の中に状態を持たせると、置き場所が変わったときに開閉が初期化されて挙動が変わってしまう。
 *   そのため「開いているか（isOpen）」と「押したとき（onToggle）」を受け取るだけにしている。
 *
 *   compact … スマホの1問ごとの答え合わせ（副題と「開く／閉じる」の文字を出さず、余白を詰める）
 */
export function UnitKataAccordion({ unitKataBlock, isOpen, onToggle, compact }: {
  unitKataBlock: string;
  isOpen: boolean;
  onToggle: () => void;
  compact: boolean;
}) {
  const kataIsOpen = isOpen;
  const kataCompact = compact;
  return (
    <div className={`rounded-xl border overflow-hidden ${'border-pink-200 bg-pink-50/40'}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={kataIsOpen}
        aria-label={`この単元の思考の型を${kataIsOpen ? '閉じる' : '開く'}`}
        className={`w-full flex items-center justify-between text-left transition-colors ${kataCompact ? 'gap-2 px-2.5 py-1.5' : 'gap-3 px-3 py-2.5 md:px-4 md:py-3'} ${'hover:bg-pink-100/70'}`}
      >
        <span className={`font-bold flex items-center flex-wrap ${kataCompact ? 'gap-1.5 text-[11px]' : 'gap-2 text-xs md:text-sm'} ${'text-[#B03A5B]'}`}>
          <BookOpen size={kataCompact ? 13 : 16} className="shrink-0" />
          <span>この単元の思考の型</span>
          {!kataCompact && (
            <span className={`font-normal text-[10px] md:text-xs ${'text-[#B03A5B]/70'}`}>
              （この単元の全問に共通・必要なときだけ開く）
            </span>
          )}
        </span>
        <span className={`flex items-center gap-1 shrink-0 font-bold ${kataCompact ? 'text-[10px]' : 'text-[10px] md:text-xs'} ${'text-[#B03A5B]'}`}>
          {!kataCompact && <span>{kataIsOpen ? '閉じる' : '開く'}</span>}
          <ChevronDown size={kataCompact ? 14 : 16} className={`transition-transform duration-300 ${kataIsOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {kataIsOpen && (
        <div className={`px-3 pb-3 md:px-4 md:pb-4 border-t ${'border-pink-200 bg-white'}`}>
          <ExplanationBody
            text={unitKataBlock}
            tone={'light'}
            /* 本文なので、問題画面と同じゴシック（font-modern）にそろえる。
               ここだけ手書き体で残すと、同じ解説画面の中で書体が2種類になる。 */
            className={`font-modern text-xs md:text-sm leading-relaxed pt-3 ${'text-gray-700'}`}
          />
        </div>
      )}
    </div>
  );
}
