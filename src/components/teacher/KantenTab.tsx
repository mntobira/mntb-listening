import { useState } from 'react';
import { Copy, Check, RefreshCw, Download, Info } from 'lucide-react';
import { buildKantenCsv, kantenCsvFileName, THINKING_NOTE, type KantenReport } from '../../utils/kantenReport';
import { type ClassroomDoc } from '../../utils/classroomCore';
import type { ThemeShape } from './teacherTheme';

// ===================================================================
// 観点別評価タブ
// ===================================================================

/**
 * 観点別評価の材料を、先生が「そのまま所見に使える」形で見せるタブ。
 *
 * ■ この画面の設計基準
 * 先生が学期末にやる作業は「材料集め → 所見の文章化」の2段階。
 * この画面はその両方を1画面で終わらせる。
 *   - 材料：知識・技能（章別到達）／態度（立て直しの証跡）を観点別に分けて表示
 *   - 文章化：所見の下書きをコピーボタン1つで成績ソフトへ
 *
 * ■ 誠実さの担保（kantenReport.ts のルールを画面でも守る）
 *   - A/B/C の評定は出さない
 *   - 「思考・判断・表現」は測れないと正直に書く（THINKING_NOTE を常時表示）
 *   - 下書きは「編集する前提の下書き」だと明記する
 */
interface KantenTabProps {
  reports: KantenReport[];
  loading: boolean;
  theme: ThemeShape;
  activeClass: ClassroomDoc | null;
  onRefresh: () => void;
}

export function KantenTab({ reports, loading, theme, activeClass, onRefresh }: KantenTabProps) {
  const [copiedUid, setCopiedUid] = useState('');

  const handleCopyDraft = async (report: KantenReport) => {
    try {
      await navigator.clipboard.writeText(report.commentDraft);
      setCopiedUid(report.uid);
      window.setTimeout(() => setCopiedUid(''), 1800);
    } catch {
      // コピー不可の環境でも文章は画面に出ているので手写しできる
    }
  };

  const handleExportKantenCsv = () => {
    if (reports.length === 0) return;
    const csv = buildKantenCsv(reports);
    const fileName = kantenCsvFileName(activeClass?.className || 'クラス');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-[#6B7280]">
        観点別評価の材料を集めています…
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E0E1DD] p-7 text-center">
        <Info className="w-10 h-10 mx-auto mb-3 text-[#9BA3AE]" />
        <h2 className="text-base font-bold text-[#1B2631] mb-2">まだ材料がありません</h2>
        <p className="text-sm text-[#4B5563] leading-relaxed">
          生徒がクラスに参加して学習を始めると、ここに観点別評価の材料が並びます。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 操作ボタン */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm border border-[#E0E1DD] bg-white text-[#4B5563] hover:bg-[#FAF8F2] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          更新
        </button>
        <button
          onClick={handleExportKantenCsv}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold text-white transition-transform active:scale-95"
          style={{ backgroundColor: theme.accent }}
        >
          <Download className="w-4 h-4" />
          観点別CSVで出す
        </button>
      </div>

      {/*
        ⚠️ 折りたたまない注意書き（3つの約束）。
        「これは評定ではない」を画面の一番目立つ場所で言い続ける。
      */}
      <div className="flex items-start gap-2 p-3.5 rounded-xl bg-[#F4F7FA] border border-[#D9E4EC] text-xs text-[#3C5A6E] leading-relaxed">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          ここに出るのは<strong>評価の材料と所見の下書き</strong>であり、評定（A/B/C）ではありません。
          下書きは学習記録の事実だけで組み立てています。
          先生の観察と併せて、加筆・修正してお使いください。
          <br />
          <strong>思考・判断・表現について：</strong>
          {THINKING_NOTE}
        </span>
      </div>

      {/* 生徒ごとのレポートカード */}
      <div className="space-y-3">
        {reports.map((report) => (
          <div key={report.uid} className="bg-white rounded-2xl border border-[#E0E1DD] p-4">
            {/* 名前 */}
            <p className="text-sm font-bold text-[#1B2631] mb-3">{report.displayName}</p>

            {/* 観点別の材料（2カラム） */}
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              {/* 知識・技能 */}
              <div className="rounded-xl bg-[#FAF8F2] border border-[#E8E5DC] p-3">
                <p className="text-xs font-bold text-[#6B7280] mb-1.5">知識・技能の材料</p>
                <p className="text-sm text-[#1B2631] mb-1">
                  到達率{' '}
                  <strong style={{ color: theme.accent }}>{report.knowledge.ratePercent}%</strong>
                  <span className="text-xs text-[#6B7280] ml-1">
                    （{report.knowledge.solvedProblems}/{report.knowledge.totalProblems}問・定着
                    {report.knowledge.mastered}問）
                  </span>
                </p>
                {report.knowledge.strongChapters[0] && (
                  <p className="text-xs text-[#4B5563]">
                    得意：{report.knowledge.strongChapters[0].chapterTitle}（
                    {report.knowledge.strongChapters[0].ratePercent}%）
                  </p>
                )}
                {report.knowledge.weakChapters[0] && (
                  <p className="text-xs text-[#4B5563]">
                    重点：{report.knowledge.weakChapters[0].chapterTitle}（
                    {report.knowledge.weakChapters[0].ratePercent}%）
                  </p>
                )}
              </div>

              {/* 主体的に学習に取り組む態度 */}
              <div className="rounded-xl bg-[#FAF8F2] border border-[#E8E5DC] p-3">
                <p className="text-xs font-bold text-[#6B7280] mb-1.5">
                  主体的に学習に取り組む態度の材料
                </p>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  直近14日で <strong className="text-[#1B2631]">{report.attitude.activeDaysIn14}日</strong> 学習
                  ／解き直し{' '}
                  <strong className="text-[#1B2631]">{report.attitude.review.retryCount}回</strong>
                  （立て直し率 {Math.round(report.attitude.review.recoveryRate * 100)}%）
                  <br />
                  間違えた問題を定着まで戻した数{' '}
                  <strong className="text-[#1B2631]">{report.attitude.recoveredToMastery}問</strong>
                  ／未処理の復習{' '}
                  <strong
                    className={
                      report.attitude.review.overdue > 0 ? 'text-[#96342B]' : 'text-[#1B2631]'
                    }
                  >
                    {report.attitude.review.overdue}
                  </strong>
                </p>
              </div>
            </div>

            {/* 所見の下書き */}
            <div className="rounded-xl border border-[#D9E4EC] bg-[#F8FBFD] p-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-xs font-bold text-[#3C5A6E]">所見の下書き（編集前提）</p>
                <button
                  onClick={() => void handleCopyDraft(report)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border border-[#C9D2DA] text-[#4B5563] bg-white hover:bg-[#FAF8F2] transition-colors"
                >
                  {copiedUid === report.uid ? (
                    <>
                      <Check className="w-3 h-3 text-[#3E9C93]" />
                      コピーしました
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      コピー
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-[#1B2631] leading-relaxed">{report.commentDraft}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
