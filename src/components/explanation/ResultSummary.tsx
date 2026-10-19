import React from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Coins, ListOrdered, TrendingUp } from 'lucide-react';
import { FeedbackButton } from '../FeedbackButton';
import { NextBadgeHint } from '../../battle/ui/GrowthParts';
import { formatResultTime } from './helpers';
import type { Chapter, SubQuestion } from '../../types/curriculum';
import type { GrowthProgress } from '../../battle/core/growth';
import type { ResultPage } from './explanationLogic';
import { KineticText, ScoreRing } from '../../motion';
import { CountUp } from '../ui/CountUp';

/**
 * 結果画面（全問を解き終えたあと）の部品。
 * 2026-10-13 のリファクタリングで Explanation.tsx から切り出した。JSX・クラス名・文言・並び順は元のまま。
 * 「いつ出すか」（isResultView && resultStep === 'summary' など）の条件は、元どおり呼び出し側に残している。
 *
 *   ResultScoreCard      … 演習の結果（正解数・正答率・時間）＋あと少しの称号＋復習推奨（スマホ版）＋ご意見
 *   ResultStage          … とびらくんと今回もらったマナコイン
 *   ResultSummaryActions … 下のバー「詳しい結果を確認する」
 *   WeakAreasPanel       … 大きな「分析結果：復習推奨エリア」（スマホ以外）
 *   ResultPager          … 詳しい結果の「1問ずつの答え合わせ」ページ送り
 */

/** 正答率（0〜1）。判定できる問が0なら0 */
const rateOf = (correct?: number, judgeable?: number) => (judgeable ? (correct ?? 0) / judgeable : 0);

export function ResultScoreCard({ compactResult, resultTotalCorrect, resultTotalJudgeable, resultTotalTimeSec, growth, compactWeakAreas, chapter, displayTotalScore }: {
  compactResult: boolean;
  resultTotalCorrect?: number;
  resultTotalJudgeable?: number;
  resultTotalTimeSec?: number;
  growth: GrowthProgress | null;
  compactWeakAreas: React.ReactNode;
  chapter: Chapter;
  displayTotalScore: number | null | undefined;
}) {
  return (
        <div className={`relative z-10 ${compactResult ? 'px-3 pt-3' : 'px-4 md:px-6 pt-4'}`}>
          <div className={`bg-gradient-to-br from-[#FFF8E1] via-white to-[#E8F4FD] border border-[#F4D03F]/60 shadow-lg ${
            compactResult ? 'rounded-2xl p-3' : 'rounded-3xl p-5 md:p-6'
          }`}>
            {/* スマホ（compactResult）ではスコアと Correct/Rate/Time を1行に圧縮して、
                直下の「復習推奨エリア」まで同じ画面に収める。 */}
            {/* 2026-10-02：演習ではポイントを出さない（対戦と分ける）。正解数・正答率・時間だけ */}
            <div className="practice-result-summary" data-practice-result>
              <div className="practice-result-main">
                <span className="practice-result-badge"><KineticText text="演習の結果" step={45} variant="pop" /></span>
                <p><strong><CountUp value={resultTotalCorrect ?? 0} fromZero duration={900} delay={250} /></strong><span>/ {resultTotalJudgeable ?? 0} 問 正解</span></p>
              </div>
              <dl className="practice-result-stats">
                <div><dt>正答率</dt><dd className="mo-rate"><ScoreRing rate={rateOf(resultTotalCorrect, resultTotalJudgeable)} size={22} stroke={4} tone={rateOf(resultTotalCorrect, resultTotalJudgeable) >= 1 ? 'done' : 'brand'} /><span><CountUp value={resultTotalJudgeable ? Math.round(((resultTotalCorrect ?? 0) / resultTotalJudgeable) * 100) : 0} fromZero duration={1100} delay={350} />%</span></dd></div>
                <div><dt>時間</dt><dd>{formatResultTime(resultTotalTimeSec ?? 0)}</dd></div>
              </dl>
            </div>
            {/* あと少し：演習でもらえる称号のうち近いもの（無ければ出さない） */}
            <NextBadgeHint progress={growth} prefer="b_study" className="mt-2" />

            {/* ===== 次にすること =====
                点数の直下に主操作を1つ置く。間違いがあれば「間違えた問題を解き直す」、
                全問正解なら「次の単元へ」。どちらも無ければ何も出さない
                （従来どおりヘッダーの「単元選択に戻る」を使う）。 */}
            {/* 「間違えた問題を解き直す／次の回へ」は詳しい結果の下へ移した（2026-10-04 ご指摘） */}

            {/* ★スマホ：スコアの直下に復習推奨エリア（コンパクト版）を出し、
                1画面で「点数」と「どこを復習すべきか」が同時に見えるようにする。 */}
            {compactWeakAreas}



            {/* ===== この単元についてのご意見（結果画面の意見収集入口）=====
                解いた直後は「ここが分かりにくい」が一番鮮明なタイミングなので、
                スコアカードの直下に常設する。単元ID・スコア・正答数を自動で添付する。 */}
            <div className="mt-4 pt-4 border-t border-[#F4D03F]/40 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <p className="text-[11px] text-[#4B5563]/80 font-modern leading-snug flex-1">
                この単元の問題文・解説で気づいたこと（分かりにくい、誘導が欲しい、誤字・表示崩れなど）をお寄せください。
              </p>
              <FeedbackButton
                screen="chapter_result"
                variant="inline"
                label="この単元にご意見"
                description={`${chapter.title || chapter.id}の問題・解説についてのご意見をお聞かせください`}
                context={{
                  chapterId: chapter.id,
                  chapterTitle: chapter.title || '',
                  mode: 'mini_test',
                  totalScore: displayTotalScore,
                  correct: resultTotalCorrect ?? 0,
                  judgeable: resultTotalJudgeable ?? 0,
                  timeSec: resultTotalTimeSec ?? 0,
                }}
                className="shrink-0 self-start sm:self-auto"
              />
            </div>
          </div>
        </div>
  );
}

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
        const line = judge > 0 && correct === judge ? '全問正解！この調子で次の回へ行こう！'
          : rate >= 0.6 ? 'いい感じ！まちがえた所だけ見直せば完ぺき！'
          : rate > 0 ? 'ナイスチャレンジ！解説で「解くカギ」を確認しよう'
          : 'ここからが伸びしろ！詳しい結果で1問ずつ確かめよう';
        const coins = studyReward?.coins ?? 0;
        return (
          <section className="practice-stage" aria-label="とびらくんと今回のごほうび" data-practice-stage data-pose={pose}>
            <div className="practice-stage-bubble" role="status"><KineticText text={line} delay={500} step={28} max={40} /></div>
            <img className="practice-stage-tobira" src={`/mascots/${pose}.webp`} alt="" width={160} height={160} draggable={false} />
            <div className="practice-stage-reward" data-practice-reward>
              <Coins size={22} aria-hidden="true" />
              {isGuest
                ? <span>ログインすると、正解した問題ごとにマナコインがもらえます</span>
                : coins > 0
                  ? <><span>今回のごほうび</span><b>＋<CountUp value={coins} fromZero duration={900} delay={1100} /></b><span>マナコイン</span>{studyReward?.xp ? <small>＋{studyReward.xp}XP</small> : null}</>
                  : <span>正解した問題ごとに<b className="is-inline">＋3</b>マナコイン<small>（同じ問題は1日1回）</small></span>}
            </div>
          </section>
        );
}

/**
 * ★結果（1画面目）の下のバー：主操作は「詳しい結果を確認する」1つだけ。親指の届く画面の下に置く★
 * 元は2つの兄弟要素（下の余白 div とバー本体）だったので、Fragment で同じ並びのまま返す。
 */
export function ResultSummaryActions({ onOpenDetail, wrongCount }: { onOpenDetail: () => void; wrongCount: number }) {
  return (
    <>
      <div className="practice-bottom-spacer" aria-hidden="true" />
        <div className="practice-bottom-bar" data-practice-summary-actions>
          <button type="button" className="practice-detail-open" data-practice-open-detail
            onClick={onOpenDetail}>
            <ListOrdered size={18} aria-hidden="true" />詳しい結果を確認する{wrongCount > 0 ? `（まちがい${wrongCount}問）` : ''}
          </button>
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
          <div className={`rounded-2xl p-5 md:p-6 shadow-lg border relative flex flex-col flex-none ${
            'bg-gray-50 border-gray-100'
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
                <div key={area.category} className={`p-4 md:p-5 rounded-xl border shadow-sm ${
                  'bg-white border-gray-100'
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
                    'bg-gray-100'
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
                  <div className={`flex justify-between mt-1 text-[10px] md:text-xs font-mono ${
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
