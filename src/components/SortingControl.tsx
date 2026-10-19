/**
 * =====================================================================
 * 並べ替え（sorting）設問の解答UI
 * =====================================================================
 *
 * ■ なぜ Quiz.tsx から切り出したのか
 *   Quiz.tsx の中で 188 行を占める、独立した1種類の解答UIだった。
 *   選択式・短答・記述と違って「ドラッグ＆ドロップ」と
 *   「タップ入れ替え」の2系統の操作を抱えているため一番かさばる。
 *   ここだけ別ファイルにすると、並べ替えの操作を直したいときに
 *   クイズ本体（採点・タイマー・ページ送り）を読まなくて済む。
 *
 * ■ 動きは 1 バイトも変えていない
 *   className・aria 属性・入れ替えの計算・回答文字列の作り方
 *   （' > ' 区切り）はすべて Quiz.tsx にあったものと同一。
 *   ドラッグ状態とタップ選択状態は Quiz 側の state をそのまま
 *   props で受け取る（問題を切り替えたときのリセットが
 *   Quiz 側の useEffect にあるため、state の持ち主は動かさない）。
 */
import React from 'react';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import type { SubQuestion } from '../types/curriculum';
import { formatText } from '../utils/textFormatter';

export interface SortingControlProps {
  sq: SubQuestion;
  /** 設問ID → 解答文字列。並べ替えは ' > ' 区切りで1本の文字列に入る。 */
  answers: Record<string, string>;
  /** 解答を更新する（Quiz 側の handleOptionSelect をそのまま渡す） */
  onSelect: (sqId: string, option: string) => void;
  /** PC なら true（HTML5 ドラッグ＆ドロップを使う） */
  isDesktop: boolean;
  /** ドラッグ中の要素インデックス（PC） */
  draggingIndex: number | null;
  setDraggingIndex: (v: number | null) => void;
  /** ドラッグが乗っている要素インデックス（PC） */
  dragOverIndex: number | null;
  setDragOverIndex: (v: number | null) => void;
  /** タップで選択中の要素（スマホ）。設問をまたいだ選択残りを防ぐため sqId 込み。 */
  tapSortSelect: { sqId: string; index: number } | null;
  setTapSortSelect: (v: { sqId: string; index: number } | null) => void;
}

export function SortingControl({
  sq,
  answers,
  onSelect,
  isDesktop,
  draggingIndex,
  setDraggingIndex,
  dragOverIndex,
  setDragOverIndex,
  tapSortSelect,
  setTapSortSelect,
}: SortingControlProps) {
  // Quiz.tsx にあったときの呼び名をそのまま残す（下の JSX を書き換えないため）
  const handleOptionSelect = onSelect;

  /** activeOrder 内で from→to へ要素を移動し、回答を更新する共通関数。 */
  const reorderSort = (sqId: string, activeOrder: string[], from: number, to: number) => {
    if (from === to || to < 0 || to >= activeOrder.length) return;
    const nextOrder = [...activeOrder];
    const moved = nextOrder.splice(from, 1)[0];
    nextOrder.splice(to, 0, moved);
    handleOptionSelect(sqId, nextOrder.join(' > '));
  };

  /** activeOrder 内で index a と b を入れ替えて回答を更新する（タップ入れ替え用）。 */
  const swapSort = (sqId: string, activeOrder: string[], a: number, b: number) => {
    if (a === b) return;
    const nextOrder = [...activeOrder];
    [nextOrder[a], nextOrder[b]] = [nextOrder[b], nextOrder[a]];
    handleOptionSelect(sqId, nextOrder.join(' > '));
  };

  /**
   * 並べ替え（sorting）UIを描画する。
   * - PC（isDesktop）: HTML5 ドラッグ＆ドロップで並べ替え。
   * - スマホ（タッチ端末）: HTML5 DnD はタッチで発火しないため使えない。
   *   代わりに「タップで選択→別要素タップで入れ替え」＋各要素の ◀▶ 移動ボタンで
   *   確実に並べ替えできるタッチ対応UIを提供する（要件：スマホでドラッグが使えない不具合）。
   */
  function renderSortingControl(sq: SubQuestion) {
    const activeOrder = answers[sq.id] ? answers[sq.id].split(' > ') : [...(sq.items || [])];

    // ── スマホ（タッチ）: タップ入れ替え ＋ ◀▶ 移動ボタン ──
    if (!isDesktop) {
      const selIdx = tapSortSelect && tapSortSelect.sqId === sq.id ? tapSortSelect.index : null;
      return (
        <div className="flex-grow flex flex-col gap-3 w-full">
          <div className="text-xs text-gray-400 font-bold flex items-center justify-between">
            <span>タップで並べ替え :</span>
            <span className="text-[10px] text-[#A9CCE3] font-normal">左から順に並べる</span>
          </div>
          <div className="flex flex-col gap-2 p-3 bg-gray-50/80 border border-gray-200 rounded-2xl">
            {activeOrder.map((item: string, idx: number) => {
              const isSelected = selIdx === idx;
              return (
                <div
                  key={`${item}-${idx}`}
                  className={`flex items-center gap-2 px-3 py-2.5 bg-white border rounded-xl shadow-xs transition-all duration-200 select-none
                    ${isSelected ? 'border-[#A9CCE3] bg-[#A9CCE3]/10 ring-2 ring-[#A9CCE3]/30' : 'border-gray-200'}
                  `}
                >
                  {/* 番号 */}
                  <span className="text-[11px] bg-stone-100 text-stone-500 rounded px-1.5 py-0.5 text-center select-none font-mono font-semibold shrink-0 w-6">{idx + 1}</span>
                  {/* 本体：タップで選択／入れ替え */}
                  <button
                    type="button"
                    onClick={() => {
                      if (selIdx === null) {
                        // 1つ目：選択
                        setTapSortSelect({ sqId: sq.id, index: idx });
                      } else if (selIdx === idx) {
                        // 同じ要素を再タップ：選択解除
                        setTapSortSelect(null);
                      } else {
                        // 2つ目：選択中の要素と入れ替え
                        swapSort(sq.id, activeOrder, selIdx, idx);
                        setTapSortSelect(null);
                      }
                    }}
                    className="flex-1 flex items-center gap-2 text-left min-w-0 min-h-[2.75rem] cursor-pointer"
                  >
                    <GripVertical size={16} className={`shrink-0 ${isSelected ? 'text-[#A9CCE3]' : 'text-gray-400'}`} />
                    <span className="font-bold text-gray-800 text-[16px] break-words">{formatText(item)}</span>
                  </button>
                  {/* ◀▶ 移動ボタン（確実な操作手段） */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label="1つ上へ移動"
                      disabled={idx === 0}
                      onClick={() => { reorderSort(sq.id, activeOrder, idx, idx - 1); setTapSortSelect(null); }}
                      // ▲▼ は 32px 角では隣同士を誤タップしやすいため 44px 角に拡大。
                      className={`flex items-center justify-center w-11 h-11 rounded-lg border transition-colors ${
                        idx === 0 ? 'border-gray-150 text-gray-300 bg-gray-50' : 'border-[#A9CCE3] text-[#2C3E50] bg-white active:bg-[#A9CCE3]/20'
                      }`}
                    >
                      <ChevronLeft size={18} className="stroke-[2.5] -rotate-90" />
                    </button>
                    <button
                      type="button"
                      aria-label="1つ下へ移動"
                      disabled={idx === activeOrder.length - 1}
                      onClick={() => { reorderSort(sq.id, activeOrder, idx, idx + 1); setTapSortSelect(null); }}
                      className={`flex items-center justify-center w-11 h-11 rounded-lg border transition-colors ${
                        idx === activeOrder.length - 1 ? 'border-gray-150 text-gray-300 bg-gray-50' : 'border-[#A9CCE3] text-[#2C3E50] bg-white active:bg-[#A9CCE3]/20'
                      }`}
                    >
                      <ChevronRight size={18} className="stroke-[2.5] rotate-90" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <span className="text-xs text-gray-400 leading-normal">
              ※ 要素をタップで選び、もう一方をタップすると入れ替わります。▲▼でも移動できます。
            </span>
            {(answers[sq.id] || '') !== '' && (
              <button
                type="button"
                onClick={() => { handleOptionSelect(sq.id, ''); setTapSortSelect(null); }}
                className="text-xs text-red-400 active:text-red-500 transition-colors font-medium py-1 px-2.5 active:bg-red-50 rounded-lg cursor-pointer shrink-0"
              >
                やり直す (初期設定に戻す)
              </button>
            )}
          </div>
        </div>
      );
    }

    // ── PC: HTML5 ドラッグ＆ドロップ ──
    return (
      <div className="flex-grow flex flex-col gap-4 w-full">
        <div className="flex flex-col gap-2.5">
          <div className="text-xs text-gray-400 font-bold flex items-center justify-between">
            <span>ドラッグで順序を並べ替え :</span>
            <span className="text-[10px] text-[#A9CCE3] font-normal">左から順に並べる</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 p-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl min-h-[72px]">
            {activeOrder.map((item: string, idx: number) => {
              const isDragging = draggingIndex === idx;
              const isDragOver = dragOverIndex === idx;
              return (
                <div
                  key={`${item}-${idx}`}
                  draggable
                  onDragStart={(e) => {
                    setDraggingIndex(idx);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragOverIndex(idx);
                  }}
                  onDragLeave={() => setDragOverIndex(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverIndex(null);
                    if (draggingIndex === null || draggingIndex === idx) return;
                    const nextOrder = [...activeOrder];
                    const draggedValue = nextOrder[draggingIndex];
                    nextOrder.splice(draggingIndex, 1);
                    nextOrder.splice(idx, 0, draggedValue);
                    handleOptionSelect(sq.id, nextOrder.join(' > '));
                    setDraggingIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggingIndex(null);
                    setDragOverIndex(null);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-xl shadow-xs transition-all duration-200 cursor-grab select-none active:cursor-grabbing
                    ${isDragging ? 'opacity-30 border-dashed border-gray-300 scale-95' : 'opacity-100'}
                    ${isDragOver ? 'border-[#A9CCE3] bg-[#A9CCE3]/15 scale-105 ring-2 ring-[#A9CCE3]/20' : 'border-gray-200 hover:border-[#A9CCE3]/50 hover:bg-gray-50/50'}
                  `}
                >
                  <GripVertical size={13} className="text-gray-400 font-bold shrink-0" />
                  <span className="font-bold text-gray-800 text-sm whitespace-nowrap">{formatText(item)}</span>
                  <span className="text-[10px] bg-stone-100 text-stone-500 rounded px-1.5 py-0.5 text-center select-none font-mono font-semibold shrink-0">{idx + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 pt-0.5">
          <span className="text-xs text-gray-400 leading-normal">
            ※ 要素をドラッグして、正しい順序に並び替えてください。
          </span>
          {(answers[sq.id] || '') !== '' && (
            <button
              type="button"
              onClick={() => handleOptionSelect(sq.id, '')}
              className="text-xs text-red-400 hover:text-red-500 transition-colors font-medium hover:underline py-1 px-2.5 hover:bg-red-50 rounded-lg cursor-pointer shrink-0"
            >
              やり直す (初期設定に戻す)
            </button>
          )}
        </div>
      </div>
    );
  }

  return renderSortingControl(sq);
}
