import React from 'react';
import { AlertTriangle, BookOpen, ChevronLeft, ChevronRight, Coins, Flag, TrendingUp } from 'lucide-react';
import { QUESTION_REPORT_FORM_URL } from '../../features/legal/legalText';
import type { SubQuestion } from '../../types/curriculum';
import type { ResultPage } from './explanationLogic';
import { KineticText } from '../../motion';
import { CountUp } from '../ui/CountUp';
import { CinematicClip, CINEMATIC_CLIPS } from '../CinematicClip';

/**
 * 結果画面（全問を解き終えたあと）の部品。
 * 2026-10-13 のリファクタリングで Explanation.tsx から切り出した。JSX・クラス名・文言・並び順は元のまま。
 * 「いつ出すか」（isResultView && resultStep === 'summary' など）の条件は、元どおり呼び出し側に残している。
 *
 *   （演習の結果のカードは D2 で ResultInsight.tsx へ。前回・自己ベスト・目標・回の棒グラフ）
 *   ResultStage          … とびらくんと今回もらったマナコイン（D2：横並びの小さめ）
 *   ResultSummaryActions … 下のバー「詳しい解説を見る」＋小さな「この問題の不具合を報告する」（F1）
 *   WeakAreasPanel       … 大きな「分析結果：復習推奨エリア」（スマホ以外）
 *   ResultPager          … 詳しい結果の「1問ずつの答え合わせ」ページ送り
 */

/** ★結果のステージ（2026-10-04 ご要望）★ カードと下のボタンの間の空きに、とびらくんと今回もらったマナコインを大きく出す */
export function ResultStage({ resultTotalJudgeable, resultTotalCorrect, studyReward, isGuest }: {
  resultTotalJudgeable?: number;
  resultTotalCorrect?: number;
  studyReward: { coins: number; xp: number; count: number } | null;
  isGuest: boolean;
}) {
        const judge = resultTotalJudgeable ?? 0; const correct = resultTotalCorrect ?? 0;
        const rate = judge ? correct / judge : 0;
        const pose = judge > 0 && correct === judge ? 'trophy' : rate >= 0.6 ? 'happy' : rate > 0 ? 'cheering' : 'thinking';
        const line = judge > 0 && correct === judge ? '全問正解！解説で考え方も確かめよう'
          : rate >= 0.6 ? 'いい感じ！まちがえた所だけ見直せば完ぺき！'
          : rate > 0 ? 'ナイスチャレンジ！解説で「解くカギ」を確認しよう'
          : 'ここからが伸びしろ！解説で1問ずつ確かめよう';
        const coins = studyReward?.coins ?? 0;
        return (
          <section className="practice-stage is-row" aria-label="とびらくんと今回のごほうび" data-practice-stage data-pose={pose}>
            <div className="practice-stage-bubble" role="status"><KineticText text={line} delay={500} step={28} max={40} /></div>
            {pose === 'trophy'
              // ★2026-10-26★ 全問正解は、とびら君がトロフィーを掲げる動画（最後のコマを残す。再生できなければ絵のまま）
              ? <div className="practice-stage-cinema" data-practice-perfect><img src="/mascots/trophy.webp" alt="" width={160} height={160} draggable={false} /><CinematicClip src={CINEMATIC_CLIPS.perfect.src} poster={CINEMATIC_CLIPS.perfect.poster} label="とびら君の全問正解動画" hold /></div>
              : <img className="practice-stage-tobira" src={`/mascots/${pose}.webp`} alt="" width={160} height={160} draggable={false} />}
            <div className="practice-stage-reward" data-practice-reward>
              <Coins size={22} aria-hidden="true" />
              {isGuest
                ? <span>ログインすると、正解した問題ごとにマナコインがもらえます</span>
                : coins > 0
                  ? <><span>今回のごほうび</span><b>＋<CountUp value={coins} fromZero duration={900} delay={1100} /></b><span>マナコイン</span>{studyReward?.xp ? <small>＋{studyReward.xp}XP</small> : null}</>
                  : <span>正解した問題ごとに<b className="is-inline">＋2〜5</b>マナコイン<small>（速く・つづけて正解すると多め／同じ問題は1日1回）</small></span>}
            </div>
          </section>
        );
}

/**
 * ★結果（1画面目）の下のバー★
 * D2（2026-10-30 ご要望）：ここは「詳しい解説を見る」1つだけ。必ず詳しい解説の画面へ行く。
 *   「次の回へ／単元選択に戻る／ホームに戻る」は詳しい解説の画面の下（ReviewBottomBar）にまとめる。
 * 元は2つの兄弟要素（下の余白 div とバー本体）だったので、Fragment で同じ並びのまま返す。
 */
export function ResultSummaryActions({ onOpenDetail, wrongCount }: { onOpenDetail: () => void; wrongCount: number }) {
  return (
    <>
      <div className="practice-bottom-spacer is-summary" aria-hidden="true" />
        <div className="practice-bottom-bar is-summary" data-practice-summary-actions>
          <button type="button" className="practice-detail-open" data-practice-open-detail onClick={onOpenDetail}>
            <BookOpen size={18} aria-hidden="true" />詳しい解説を見る{wrongCount > 0 ? `（まちがい${wrongCount}問）` : ''}<ChevronRight size={18} aria-hidden="true" />
          </button>
          {/* F1（2026-11-04 レビューのご要望「問題点をすぐ報告したい」）：見つけたその場で報告できる。Googleフォームが開く */}
          <a className="practice-report-link" data-practice-report href={QUESTION_REPORT_FORM_URL} target="_blank" rel="noopener noreferrer">
            <Flag size={15} aria-hidden="true" />この問題の不具合を報告する
          </a>
        </div>
    </>
  );
}

/**
 * Weak Areas Analysis（大きな「分析結果：復習推奨エリア」）
 *   ★ 修正：問題数が多い場合（弱点エリアが多数）に desktop で潜在的にはみ出してスクロールできなかった不具合を解消。
 *     - ブロック自体は flex-none（縮まない）
 *     - 見出しは固定し、カードのグリッド部分だけを max-height 付きで縦スクロール可能にする
 */
export function WeakAreasPanel({ weakAreas, isMobile }: {
  weakAreas: { category: string; percentage: number }[];
  isMobile: boolean;
}) {
  return (
          <div className={`rounded-2xl p-5 md:p-6 shadow-sm border relative flex flex-col flex-none ${
            'bg-[#FFFDF9] border-[#E6DCCB]'
          }`}>
            <h3 className={`text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2 flex-none ${
              'text-[#2C3E50]'
            }`}>
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
              <span>分析結果：復習推奨エリア</span>
            </h3>
            
            <div className={isMobile
              // スマホでは内部スクロール（40vh固定）を設けず、全カードをそのまま並べて
              // ページ全体の縦スクロールで閲覧できるようにする（途中でクリップしない）。
              ? "grid grid-cols-1 gap-4"
              : "grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 overflow-y-auto max-h-[40vh] md:max-h-[34vh] pr-1 -mr-1"}>
              {weakAreas.map((area) => (
                <div key={area.category} className={`p-4 md:p-5 rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_0_#e8dfd0] ${
                  'bg-white border-[#E6DCCB]'
                }`}>
                  <div className="flex justify-between items-end mb-2 md:mb-3">
                    <div className={`flex items-center gap-1.5 md:gap-2 font-bold text-sm md:text-base ${
                      'text-[#2C3E50]'
                    }`}>
                      <AlertTriangle className={`w-4 h-4 md:w-[18px] md:h-[18px] ${
                        'text-[#D9A0A0]'
                      }`} />
                      <span>{area.category}</span>
                    </div>
                    <span className={`font-mono font-bold text-xl md:text-2xl ${
                      'text-[#D9A0A0]'
                    }`}>
                      {area.percentage}<span className="text-xs md:text-sm ml-0.5">%</span>
                    </span>
                  </div>
                  
                  {/* Gauge/Slider UI */}
                  <div className={`relative h-3 md:h-4 rounded-full overflow-hidden shadow-inner ${
                    'bg-[#F3ECE0]'
                  }`}>
                    <div 
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${
                        'bg-gradient-to-r from-[#D9A0A0] to-[#FFB7B2]'
                      }`}
                      style={{ width: `${area.percentage}%` }}
                    />
                    <div className="absolute inset-0 opacity-30" 
                         style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.2) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.2) 50%,rgba(255,255,255,.2) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }} 
                    />
                  </div>
                  <div className={`flex justify-between mt-1 text-xs md:text-xs font-mono ${
                    'text-gray-400'
                  }`}>
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              ))}
            </div>
            <p className={`text-xs md:text-sm mt-4 text-right ${
              'text-gray-400'
            }`}>
              ※ 記述問題は自己採点チェックを入れるとスコアに反映されます
            </p>
          </div>
  );
}

/** ★解いた問題のページ送り（2026-10-04）★ 対戦の「1問ずつのけっか」と同じ操作。番号の色で正誤が分かる */
export function ResultPager({ resultPages, safeResultPage, pageState, setResultPage, onBackToSummary }: {
  resultPages: ResultPage[];
  safeResultPage: number;
  pageState: (pg: { sq: SubQuestion }) => string;
  setResultPage: (i: number) => void;
  onBackToSummary: () => void;
}) {
  return (
          <nav className="practice-pager" aria-label="解いた問題を切り替える" data-practice-pager>
            <p className="practice-pager-title">
              <button type="button" className="practice-pager-back" onClick={onBackToSummary} aria-label="結果にもどる"><ChevronLeft size={16} aria-hidden="true" />結果</button>
              <span>1問ずつの答え合わせ</span><b>{safeResultPage + 1} / {resultPages.length}</b>
            </p>
            <div className="practice-pager-row">
              <button type="button" className="practice-pager-arrow" aria-label="前の問題" disabled={safeResultPage === 0}
                onClick={() => setResultPage(Math.max(0, safeResultPage - 1))}><ChevronLeft size={20} /></button>
              <ol className="practice-pager-chips">
                {resultPages.map((pg, i) => {
                  const st = pageState(pg);
                  return (
                    <li key={`${pg.qIndex}-${pg.sq?.id}`}>
                      <button type="button" data-state={st} aria-current={i === safeResultPage || undefined}
                        aria-label={`${i + 1}問目（${st === 'ok' ? '正解' : st === 'ng' ? '不正解' : st === 'skip' ? '未解答' : '自己採点'}）`}
                        onClick={() => setResultPage(i)}>{i + 1}</button>
                    </li>
                  );
                })}
              </ol>
              <button type="button" className="practice-pager-arrow" aria-label="次の問題" disabled={safeResultPage >= resultPages.length - 1}
                onClick={() => setResultPage(Math.min(resultPages.length - 1, safeResultPage + 1))}><ChevronRight size={20} /></button>
            </div>
          </nav>
  );
}
