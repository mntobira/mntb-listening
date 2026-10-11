import React, { useState } from 'react';
import { X, TrendingUp, ChevronDown, ChevronUp, BarChart2, BookOpen, Star, AlertCircle } from 'lucide-react';
import { chemistryBasicTrendDataset, type TrendDataset } from '../data/trendData';

interface TrendModalProps {
  onClose: () => void;
  // chapterGroupTitle: 特定の章の傾向を表示する場合に指定。undefinedなら全体総括。
  // unitId: 特定の小単元を表示する場合に指定。
  targetChapterGroupTitle?: string;
  targetUnitId?: string;
  /** 表示するデータセット。未指定なら化学基礎。 */
  dataset?: TrendDataset;
}

export function TrendModal({
  onClose,
  targetChapterGroupTitle,
  targetUnitId,
  dataset = chemistryBasicTrendDataset,
}: TrendModalProps) {
  const [activeTab, setActiveTab] = useState<'overall' | 'chapter' | 'rotation'>('overall');
  const [expandedUnit, setExpandedUnit] = useState<string | null>(targetUnitId || null);

  const overallTrend = dataset.overall;
  const chapterTrends = dataset.chapters;
  const rotationAnalysis = dataset.rotation;
  // 追試験の情報を持つデータセットかどうか（化学（発展）のみ true）
  const hasSupplementary =
    overallTrend.yearlyOverview.some(r => !!r.supplementary) ||
    rotationAnalysis.some(r => !!r.yearsSupplementary);

  // ターゲットの章を探す
  const targetChapter = targetChapterGroupTitle
    ? chapterTrends.find(c => c.chapterGroupTitle === targetChapterGroupTitle)
    : null;

  // 特定章・単元が指定されている場合はその章タブを初期表示
  React.useEffect(() => {
    if (targetChapterGroupTitle) {
      setActiveTab('chapter');
    }
  }, [targetChapterGroupTitle]);

  const getPredictionColor = (prediction: string) => {
    if (prediction.startsWith('◎')) return 'text-red-600 bg-red-50 border-red-200';
    if (prediction.startsWith('○')) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm p-2 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] md:p-4 md:pt-[calc(1rem+env(safe-area-inset-top,0px))] overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4 overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-[#2C3E50] to-[#34495E] text-white p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-[#F4D03F]" />
            <div>
              <h2 className="text-lg md:text-xl font-bold font-handwriting">
                {targetChapterGroupTitle
                  ? `${targetChapterGroupTitle} 共通テスト出題傾向`
                  : dataset.headerTitle}
              </h2>
              <p className="text-xs text-white/70 font-handwriting">{dataset.headerSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overall')}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-bold font-handwriting whitespace-nowrap transition-colors ${activeTab === 'overall' ? 'text-[#2C3E50] border-b-2 border-[#2C3E50] bg-white' : 'text-gray-500 hover:text-[#2C3E50]'}`}
          >
            <BarChart2 className="w-4 h-4" />
            全体総括
          </button>
          <button
            onClick={() => setActiveTab('chapter')}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-bold font-handwriting whitespace-nowrap transition-colors ${activeTab === 'chapter' ? 'text-[#2C3E50] border-b-2 border-[#2C3E50] bg-white' : 'text-gray-500 hover:text-[#2C3E50]'}`}
          >
            <BookOpen className="w-4 h-4" />
            章・単元別
          </button>
          <button
            onClick={() => setActiveTab('rotation')}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-bold font-handwriting whitespace-nowrap transition-colors ${activeTab === 'rotation' ? 'text-[#2C3E50] border-b-2 border-[#2C3E50] bg-white' : 'text-gray-500 hover:text-[#2C3E50]'}`}
          >
            <Star className="w-4 h-4" />
            2027年予想
          </button>
        </div>

        {/* コンテンツ */}
        <div className="overflow-y-auto max-h-[70vh] p-4 md:p-6">

          {/* ========== 全体総括タブ ========== */}
          {activeTab === 'overall' && (
            <div className="space-y-6">
              {/* 年度別一覧 */}
              <div>
                <h3 className="text-base font-bold text-[#2C3E50] font-handwriting mb-3 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#A9CCE3]" />
                  {dataset.yearlyTableTitle}
                </h3>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-xs font-handwriting">
                    <thead>
                      <tr className="bg-[#2C3E50] text-white">
                        <th className="p-2 text-left font-bold">年度</th>
                        <th className="p-2 text-center font-bold">区分</th>
                        <th className="p-2 text-center font-bold">小問数</th>
                        <th className="p-2 text-left font-bold">{hasSupplementary ? '本試験の構成の特徴' : '主な構成の特徴'}</th>
                        {hasSupplementary && <th className="p-2 text-left font-bold">追試験の特徴</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {overallTrend.yearlyOverview.map((row, i) => (
                        <tr key={row.year} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="p-2 font-bold text-[#2C3E50]">{row.year}</td>
                          <td className={`p-2 text-center font-bold ${row.type === '共通テスト' ? 'text-blue-600' : 'text-gray-600'}`}>
                            {row.type === '共通テスト' ? '共通' : 'センター'}
                          </td>
                          <td className="p-2 text-center">{row.subQuestions}</td>
                          <td className="p-2 text-gray-700 leading-relaxed">{row.feature}</td>
                          {hasSupplementary && (
                            <td className="p-2 text-purple-700 leading-relaxed">{row.supplementary ?? '—'}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3つの大きなトレンド */}
              <div>
                <h3 className="text-base font-bold text-[#2C3E50] font-handwriting mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#D9A0A0]" />
                  大きく見える{overallTrend.bigTrends.length}つのトレンド
                </h3>
                <div className="space-y-3">
                  {overallTrend.bigTrends.map((trend, i) => (
                    <div key={i} className="bg-gradient-to-r from-[#FDFBF7] to-white border border-[#D9A0A0]/30 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#D9A0A0] text-white flex items-center justify-center text-sm font-bold shrink-0 font-handwriting">
                          {String.fromCharCode(65 + i)}
                        </div>
                        <div>
                          <h4 className="font-bold text-[#2C3E50] text-sm font-handwriting mb-1">{trend.title}</h4>
                          <p className="text-xs text-gray-700 font-handwriting leading-relaxed">{trend.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2027年第1問予想 */}
              <div>
                <h3 className="text-base font-bold text-[#2C3E50] font-handwriting mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#F4D03F]" />
                  2027年共通テスト 予想構成
                </h3>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
                  <p className="text-xs font-bold text-amber-800 font-handwriting mb-3">{dataset.structurePrimaryLabel}</p>
                  <div className="space-y-2">
                    {overallTrend.exam2027Structure.q1.map((item) => (
                      <div key={item.no} className="flex items-start gap-2">
                        <span className="text-xs font-bold text-amber-700 font-handwriting shrink-0 w-6">問{item.no}</span>
                        <p className="text-xs text-gray-700 font-handwriting flex-1">{item.theme}</p>
                        <span className={`text-xs font-bold font-handwriting px-2 py-0.5 rounded-full shrink-0 ${
                          item.probability.startsWith('◎') || parseInt(item.probability) >= 80
                            ? 'bg-red-100 text-red-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>{item.probability}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-blue-800 font-handwriting mb-2">{dataset.structureSecondaryLabel}</p>
                  <ul className="space-y-1">
                    {overallTrend.exam2027Structure.q2Candidates.map((c, i) => (
                      <li key={i} className="text-xs text-gray-700 font-handwriting flex items-start gap-1.5">
                        <span className="text-blue-500 shrink-0">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 平均点 */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-gray-700 font-handwriting mb-2">平均点・難易度の推移（参考）</h4>
                <div className="flex gap-3 flex-wrap">
                  {overallTrend.averageScores.map((s) => (
                    <div key={s.year} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-handwriting">
                      <span className="font-bold text-[#2C3E50]">{s.year}年：</span>
                      <span className="text-gray-600">{s.score}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600 font-handwriting mt-2">{dataset.averageScoreNote}</p>
              </div>
            </div>
          )}

          {/* ========== 章・単元別タブ ========== */}
          {activeTab === 'chapter' && (
            <div className="space-y-6">
              {(targetChapter ? [targetChapter] : chapterTrends).map((chapter) => (
                <div key={chapter.chapterGroupTitle} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* 章ヘッダー */}
                  <div className="bg-gradient-to-r from-[#A9CCE3]/30 to-[#A9CCE3]/10 p-4 border-b border-gray-200">
                    <h3 className="text-base font-bold text-[#2C3E50] font-handwriting mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#A9CCE3]" />
                      {chapter.chapterGroupTitle}【章まとめ・総括】
                    </h3>
                    <p className="text-xs text-gray-700 font-handwriting leading-relaxed">{chapter.summary}</p>
                  </div>

                  {/* 小単元一覧 */}
                  <div className="divide-y divide-gray-100">
                    {chapter.units.map((unit) => {
                      const isExpanded = expandedUnit === unit.id;
                      const isTarget = unit.id === targetUnitId;
                      return (
                        <div key={unit.id} className={`${isTarget ? 'bg-yellow-50' : 'bg-white'}`}>
                          <button
                            onClick={() => setExpandedUnit(isExpanded ? null : unit.id)}
                            className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              {isTarget && (
                                <span className="text-xs font-bold bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-handwriting">この単元</span>
                              )}
                              <span className="text-sm font-bold text-[#2C3E50] font-handwriting">{unit.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 font-handwriting hidden md:block">{unit.frequency.split('（')[0]}</span>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 space-y-4">
                              {/* 出題実績 */}
                              <div>
                                <h5 className="text-xs font-bold text-[#A9CCE3] font-handwriting mb-1">📅 出題実績（年度・頻度）</h5>
                                <p className="text-xs text-gray-600 font-handwriting leading-relaxed bg-blue-50 border border-blue-100 rounded-lg p-2">{unit.frequency}</p>
                                <p className="text-xs text-gray-700 font-handwriting leading-relaxed mt-1">{unit.yearsAppeared}</p>
                              </div>

                              {/* 出題タイプ */}
                              <div>
                                <h5 className="text-xs font-bold text-[#D9A0A0] font-handwriting mb-1">📝 具体的な出題タイプ</h5>
                                <ul className="space-y-1">
                                  {unit.examTypes.map((t, i) => (
                                    <li key={i} className="text-xs text-gray-700 font-handwriting flex items-start gap-1.5">
                                      <span className="text-[#D9A0A0] shrink-0">•</span>
                                      <span>{t}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* 必要な武器 */}
                              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                <h5 className="text-xs font-bold text-green-700 font-handwriting mb-2">⚔️ 必要な武器（知識・概念）</h5>
                                <ul className="space-y-1">
                                  {unit.weapons.map((w, i) => (
                                    <li key={i} className="text-xs text-gray-700 font-handwriting flex items-start gap-1.5">
                                      <span className="text-green-500 shrink-0">✓</span>
                                      <span>{w}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* 演習意識ポイント */}
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                <h5 className="text-xs font-bold text-amber-700 font-handwriting mb-1">⚡ 演習時の意識ポイント</h5>
                                <p className="text-xs text-gray-700 font-handwriting leading-relaxed">{unit.studyPoints}</p>
                              </div>

                              {/* 2027予想 */}
                              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                <h5 className="text-xs font-bold text-red-700 font-handwriting mb-1">🎯 2027年予想</h5>
                                <p className="text-xs text-gray-700 font-handwriting leading-relaxed">{unit.prediction2027}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========== 2027年予想タブ ========== */}
          {activeTab === 'rotation' && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-bold text-red-700 font-handwriting">ローテーション分析と2027年出題予想度</h3>
                </div>
                <p className="text-xs text-gray-600 font-handwriting">{dataset.rotationIntro}</p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs font-handwriting">
                  <thead>
                    <tr className="bg-[#2C3E50] text-white">
                      <th className="p-2 text-left font-bold">テーマ</th>
                      <th className="p-2 text-center font-bold">周期</th>
                      <th className="p-2 text-left font-bold">2027予想度</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rotationAnalysis.map((row, i) => (
                      <tr key={row.theme} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-2">
                          <div className="font-bold text-[#2C3E50]">{row.theme}</div>
                          <div className="text-gray-400 text-[10px] mt-0.5">
                            {hasSupplementary ? '本試: ' : ''}{row.years}
                          </div>
                          {row.yearsSupplementary && (
                            <div className="text-purple-400 text-[10px] mt-0.5">追試: {row.yearsSupplementary}</div>
                          )}
                        </td>
                        <td className="p-2 text-center text-gray-600">{row.cycle}</td>
                        <td className="p-2">
                          <span className={`inline-block text-xs font-bold px-2 py-1 rounded-lg border font-handwriting ${getPredictionColor(row.prediction)}`}>
                            {row.prediction}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* センター→共通テストへの変化 */}
              <div>
                <h3 className="text-sm font-bold text-[#2C3E50] font-handwriting mb-3">センター → 共通テストへの変化（重要）</h3>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-xs font-handwriting">
                    <thead>
                      <tr className="bg-[#2C3E50] text-white">
                        <th className="p-2 text-left font-bold">観点</th>
                        <th className="p-2 text-left font-bold">センター（〜2020）</th>
                        <th className="p-2 text-left font-bold">共通テスト（2021〜）</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataset.comparisonTable.map(([aspect, center, kyotsuu], i) => (
                        <tr key={aspect} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="p-2 font-bold text-[#2C3E50] whitespace-nowrap">{aspect}</td>
                          <td className="p-2 text-gray-600">{center}</td>
                          <td className="p-2 text-blue-700 font-bold">{kyotsuu}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 最終メッセージ */}
              <div className="bg-gradient-to-r from-[#2C3E50] to-[#34495E] text-white rounded-xl p-5">
                <h3 className="text-sm font-bold font-handwriting mb-3">受験生への最終メッセージ</h3>
                <p className="text-xs font-handwriting leading-relaxed text-white/90 mb-2">
                  {dataset.finalMessageLead}
                </p>
                <ul className="space-y-2">
                  {dataset.finalMessages.map((msg, i) => (
                    <li key={i} className="text-xs font-handwriting text-white/90 flex items-start gap-2">
                      <span className="text-[#F4D03F] shrink-0">★</span>
                      <span>{msg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#2C3E50] text-white rounded-xl font-bold font-handwriting text-sm hover:bg-[#1B2631] transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
