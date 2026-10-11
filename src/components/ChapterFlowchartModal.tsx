import React from 'react';
import { X, GitBranch } from 'lucide-react';
import { InteractiveTree, type NodeData } from './InteractiveTree';
import { motion } from 'motion/react';
// 章ID → ツリーの対応表は data/chapterTreeMap.ts に集約している。
// （以前はこのファイルと PracticeExplanationTree.tsx が同じ対応表を
//   別々の書き方で持っていた。片方だけ直し忘れる事故を防ぐため統合した）
import { resolveChapterTree, isSharedUnitTree } from '../data/chapterTreeMap';
import { extractSectionByChapter } from '../utils/logicTreeUtils';

interface ChapterFlowchartModalProps {
  chapterId: string;
  chapterTitle: string;
  onClose: () => void;
  onSelectQuestion?: (questionIndex: number) => void;
  questions?: any[];
}

export function ChapterFlowchartModal({ 
  chapterId, 
  chapterTitle, 
  onClose, 
  onSelectQuestion,
  questions = []
}: ChapterFlowchartModalProps) {
  
  // Resolve the FULL tree data by chapterId.
  // ※ c5(酸と塩基)/c6(酸化還元)は単元全体で1つの大きなツリーを共有しており、
  //   下位章（c5_1〜c5_7 / c6_1〜c6_7）ごとに開いた場合は、
  //   「添付HTML由来のその重要事項セクション全体（フル解説ツリー）」を表示する。
  //   （確認問題プレースホルダは差し込まない）
  const fullTreeData: NodeData | null = resolveChapterTree(chapterId) ?? null;

  // c5/c6 は単元全体で1つの大きなツリーを共有しているため、
  // その下位章（c5_1〜c5_7 / c6_1〜c6_7）に対応する重要事項セクションのみを切り出す。
  // 添付HTML由来のフル解説（Step構成・解説付き）をそのまま表示する。
  // c1〜c4 は章ごとに専用ツリーがあるため切り出さない。
  let currentTreeData: NodeData | null = fullTreeData;
  if (fullTreeData && isSharedUnitTree(chapterId)) {
    currentTreeData = extractSectionByChapter(fullTreeData, chapterId);
  }

  // Handle click on a questions from the logic tree node
  const handleQuestionClick = (questionId: string) => {
    if (!onSelectQuestion || questions.length === 0) return;
    
    // Find subquestion or parent question index
    const qIndex = questions.findIndex((q: any) => {
      // Direct comparison or inside subquestions
      if (q.id === questionId) return true;
      return q.subQuestions?.some((sq: any) => sq.id === questionId);
    });

    if (qIndex !== -1) {
      onSelectQuestion(qIndex);
      onClose();
    }
  };

    /* items-center → items-safe-center。
        フローチャートは章によって縦に長くなるため、
        中央寄せのままだと ★上端の見出しにスクロールで到達できない★
        （はみ出した上半分がスクロール範囲から外れる CSS の仕様）。
        safe 付きで「収まるときは中央・はみ出すときは上端」にする。
        （定義は index.css 13.5 節） */
  return (
    <div className="fixed inset-0 bg-[#1B2631]/60 backdrop-blur-xs flex items-safe-center justify-center p-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:p-6 sm:pt-[calc(1.5rem+env(safe-area-inset-top,0px))] z-[100] overflow-y-auto font-handwriting">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="bg-white rounded-3xl shadow-2xl border border-gray-150 w-full max-w-4xl md:max-w-6xl max-h-[min(90vh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-1.5rem))] flex flex-col overflow-hidden font-handwriting"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-white text-[#2C3E50] shrink-0 font-handwriting">
          <div className="flex items-center gap-3">
            <div className="bg-[#A9CCE3]/20 p-2 rounded-xl">
              <GitBranch className="text-[#2C3E50]" size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-handwriting font-bold tracking-wider leading-tight">
                {chapterTitle}
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-500 font-handwriting font-bold">
                学習フローチャート・ロジックツリー
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 bg-[#FDFBF7] font-handwriting">
          {currentTreeData ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-1 sm:p-3 shadow-sm w-full font-handwriting">
              <p className="text-[11px] sm:text-xs text-gray-500 font-bold px-2 pt-2 pb-1">
                ▼ ロジックツリー（タップで開閉・確認問題へ移動できます）
              </p>
              <InteractiveTree 
                data={currentTreeData}
                onQuestionClick={handleQuestionClick}
                mobileTightCrop={true}
                zoom="far"
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm w-full text-center text-sm text-gray-400 font-handwriting font-bold">
              この単元のフローチャートは準備中です
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0 font-handwriting">
          <p className="text-[10px] sm:text-xs text-slate-400 font-handwriting font-bold">
            ※ ステップをタップして開閉。確認問題ボタンから直接学習を開始できます。
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2C3E50] hover:bg-[#1B2631] text-white text-xs sm:text-sm font-handwriting font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </motion.div>
    </div>
  );
}
