import React from 'react';
import { ArrowLeft, CheckCircle2, Save } from 'lucide-react';
import type { Chapter, Problem } from '../../types/curriculum';

/**
 * 解答・解説画面の上部ヘッダー（「解答・解説 / 章名」＋答え合わせ・Q番号・カテゴリ・ノートに保存・正答率＋戻る/次へ）。
 * 2026-10-14 のリファクタリングで Explanation.tsx から切り出した。JSX・クラス名・文言・条件は元のまま。
 * 状態は持たない（値と関数は親から受け取る）。表示する条件（!reviewNav）は呼び出し側に残している。
 */
export interface ExplanationHeaderProps {
  chapter: Chapter;
  questions: Problem[];
  singleQuestionIndex?: number;
  reorderMobile: boolean;
  isResultView: boolean;
  savingNote: Record<string, boolean>;
  handleSaveNote: (question: Problem, index: number) => void;
  calculateScore: (question: Problem) => number;
  onBack: () => void;
  onNextQuestion?: () => void;
  isLastQuestion?: boolean;
}

export function ExplanationHeader({ chapter, questions, singleQuestionIndex, reorderMobile, isResultView, savingNote, handleSaveNote, calculateScore, onBack, onNextQuestion, isLastQuestion }: ExplanationHeaderProps) {
  return (
      <div className={`p-4 md:p-6 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] md:pt-6 border-b-2 z-30 flex items-start justify-between gap-4 flex-none ${
        // ★スマホの1問ごとの答え合わせ（reorderMobile）では、
        //   「解答・解説 / 章名」の右横に Score・答え合わせ・Q番号・ノートに保存・正答率を
        //   横並びで置き、縦方向の占有を減らす（上部の1行に集約する）。
        reorderMobile ? 'flex-row' : 'flex-col md:flex-row md:items-center'
      } ${
        isResultView ? 'sticky top-0 backdrop-blur-md' : 'relative'
      } ${
        'bg-white/95 border-gray-100'
      }`}>
        <div className={`flex flex-1 min-w-0 ${
          reorderMobile
            ? 'flex-row items-start justify-between gap-2 w-full'
            : 'flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto'
        }`}>
          <div className="flex-shrink-0">
            <h3 className={`font-bold tracking-wider ${reorderMobile ? 'text-base' : 'text-lg md:text-xl'} ${
              'text-[#2C3E50]'
            }`}>
              解答・解説
            </h3>
            <div className={`mt-0.5 md:mt-1 ${reorderMobile ? 'text-[10px]' : 'text-xs md:text-sm'} ${
              'text-gray-500'
            }`}>
              {chapter.realTitle}
            </div>
          </div>

          {/* ★スマホの1問ごとの答え合わせでは、Score とメタ情報（答え合わせ / Q番号 /
              カテゴリ / ノートに保存 / 正答率）を右寄せの1ブロックにまとめる。
              PC・結果表示では従来のレイアウトを崩さないよう display:contents で素通しする。

              ★ご要望「解答と解説って書いてあるところの右のトロフィーとか
                ☑️答え合わせとかをもう少し横に並べる感じに」★

              ■ 実測（Playwright / 390x844・化学基礎「ろ過」の解答・解説）
                ヘッダーの高さ 106px。右側のチップが3段に折り返していた。
                  y=16 … 🏆0pt
                  y=40 … ☑答え合わせ / Q1 / カテゴリ
                  y=67 … ノートに保存 / 正答率
                合計幅は 50+84+30+92+47+カテゴリ ≒ 380px あり、
                右側に使える幅（約265px）に対して flex-wrap が2回折り返していた。

              ■ 直し方＝「並べる」ために幅を削る（要素は消さない）
                折り返しを禁止（flex-nowrap）したうえで、
                スマホでは文字ラベルを落としてアイコン＋数値だけにする。
                  ☑答え合わせ → ☑（アイコンのみ・aria-label で読み上げは維持）
                  ノートに保存 → 💾（同上）
                  正答率: 0%   → 0%（「正答率:」の見出しを省く）
                これで 50+24+30+30+26+カテゴリ ≒ 240px になり1行に収まる。
                カテゴリだけは可変なので min-w-0 + truncate で余りに合わせて縮む。
                PC（reorderMobile=false）はラベルもレイアウトも従来のまま。 */}
          <div className={reorderMobile
            ? 'flex flex-nowrap items-center justify-end gap-1 min-w-0 flex-1'
            : 'contents'
          }>
          {singleQuestionIndex !== undefined && questions[0] && (
            <div className={reorderMobile
              ? 'flex flex-nowrap items-center justify-end gap-1 min-w-0 flex-1'
              : `flex flex-wrap items-center gap-2 sm:gap-3 sm:border-l sm:pl-4 md:pl-6 lg:pl-8 ${
                  'border-gray-200'
                } w-full sm:w-auto`
            }>
              {/* 「答え合わせ」チップ。
                  スマホでは文字を落としてチェックアイコンだけにする
                  （aria-label を付けるので読み上げは「答え合わせ」のまま）。 */}
              <div
                aria-label="答え合わせ"
                title="答え合わせ"
                className={`flex items-center font-bold rounded-full border shrink-0 ${
                  reorderMobile ? 'gap-0 text-[10px] px-1 py-0.5' : 'gap-1 text-[11px] md:text-xs px-2.5 py-1'
                } ${
                'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <CheckCircle2 className={reorderMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                {!reorderMobile && <span>答え合わせ</span>}
              </div>

              <div className={`font-bold rounded-full shadow-sm border shrink-0 ${
                reorderMobile ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-0.5'
              } ${
                'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                Q{singleQuestionIndex + 1}
              </div>

              {/* カテゴリだけは長さが可変なので、1行に収める調整役にする。
                  min-w-0 + truncate で「余った幅ぶんだけ表示」になる。 */}
              <div className={`font-bold truncate ${
                reorderMobile ? 'text-[10px] min-w-0 flex-1' : 'text-xs md:text-sm max-w-[120px] sm:max-w-[200px]'
              } ${
                'text-gray-800'
              }`}>
                {questions[0].category || '問題'}
              </div>

              {/* 「ノートに保存」も同様に、スマホではアイコンだけにする。 */}
              <button
                onClick={(e) => { e.stopPropagation(); handleSaveNote(questions[0], singleQuestionIndex); }}
                aria-label={savingNote[questions[0].id] ? 'ノートに保存中' : 'ノートに保存'}
                title={savingNote[questions[0].id] ? '保存中...' : 'ノートに保存'}
                className={`flex items-center rounded-full font-bold transition-colors border shrink-0 ${
                  reorderMobile ? 'gap-0 text-[10px] px-1 py-0.5' : 'gap-1 text-[11px] px-2.5 py-1'
                } ${
                  savingNote[questions[0].id] 
                    ? ('bg-gray-100 text-gray-500 border-gray-200') 
                    : ('bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100')
                }`}
                disabled={savingNote[questions[0].id]}
              >
                <Save size={reorderMobile ? 12 : 12} />
                {!reorderMobile && <span>{savingNote[questions[0].id] ? '保存中...' : 'ノートに保存'}</span>}
              </button>

              {(() => {
                const scorePercentage = calculateScore(questions[0]);
                return (
                  <div
                    className={`flex items-center gap-1 shrink-0 ${reorderMobile ? '' : 'ml-auto sm:ml-0'}`}
                    aria-label={`正答率 ${scorePercentage}%`}
                    title={`正答率 ${scorePercentage}%`}
                  >
                    {/* スマホでは「正答率:」の見出しを省き、数値だけを出す
                        （aria-label / title で意味は残す）。 */}
                    {!reorderMobile && (
                      <span className={`font-bold text-[10px] md:text-xs ${'text-gray-500'}`}>正答率:</span>
                    )}
                    <span className={`font-mono font-bold ${reorderMobile ? 'text-[11px]' : 'text-xs md:text-sm'} ${
                      scorePercentage >= 80 
                        ? ('text-emerald-600') 
                        : scorePercentage <= 40 
                          ? ('text-red-500') 
                          : ('text-amber-500')
                    }`}>
                      {scorePercentage}%
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
          </div>
        </div>
        {singleQuestionIndex !== undefined && onNextQuestion ? (
          // ★スマホの1問ごとの答え合わせでは、このボタン行は画面下部の
          //   固定ナビ（親指の届く位置・演習画面と同じ操作感）に移すため隠す。
          <div className={`${reorderMobile ? 'hidden' : 'flex'} items-center gap-3 w-full md:w-auto`}>
            <button 
              onClick={onBack}
              className={`flex items-center gap-2 transition-colors font-bold px-4 py-2 rounded-full border flex-1 md:flex-none justify-center ${
                'text-gray-500 hover:text-[#2C3E50] border-gray-200 hover:border-[#2C3E50] bg-gray-50'
              }`}
            >
              <ArrowLeft size={18} />
              <span>問題に戻る</span>
            </button>
            <button 
              onClick={onNextQuestion}
              className={`flex items-center gap-2 transition-colors font-bold px-4 py-2 rounded-full border flex-1 md:flex-none justify-center ${
                'text-white bg-[#2C3E50] hover:bg-[#1a252f] border-[#2C3E50]'
              }`}
            >
              <span>{isLastQuestion ? '結果を見る' : '次の問題へ'}</span>
              <ArrowLeft size={18} className="rotate-180" />
            </button>
          </div>
        ) : isResultView ? null : (
          <button 
            onClick={onBack}
            className={`flex items-center gap-2 transition-colors font-bold px-4 py-2 rounded-full border w-full md:w-auto justify-center ${
              'text-gray-500 hover:text-[#2C3E50] border-gray-200 hover:border-[#2C3E50] bg-gray-50'
            }`}
          >
            <ArrowLeft size={18} />
            <span>単元選択に戻る</span>
          </button>
        )}
      </div>
  );
}
