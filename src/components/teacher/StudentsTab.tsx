import React from 'react';
import { Users, Copy, Check, RefreshCw, Download, AlertTriangle, PenLine, Info } from 'lucide-react';
import { aggregateClass, type ClassroomDoc } from '../../utils/classroomCore';
import { type StudentSummary } from '../../utils/studySummary';
import type { ThemeShape } from './teacherTheme';

// ===================================================================
// 生徒の様子タブ
// ===================================================================


interface StudentsTabProps {
  students: StudentSummary[];
  aggregate: ReturnType<typeof aggregateClass>;
  loading: boolean;
  theme: ThemeShape;
  activeClass: ClassroomDoc | null;
  copiedCode: string;
  editingUid: string;
  editingName: string;
  onCopyCode: (code: string) => void;
  onRefresh: () => void;
  onExportCsv: () => void;
  onStartEdit: (student: StudentSummary) => void;
  onChangeEditingName: (value: string) => void;
  onSaveEdit: (uid: string) => void;
  onCancelEdit: () => void;
}

export function StudentsTab(props: StudentsTabProps) {
  const { students, aggregate, loading, theme, activeClass } = props;

  // 誰も参加していないクラス＝コードの周知が済んでいない状態。
  // ここで一番大きく出すべきなのは参加コードそのもの。
  if (!loading && students.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E0E1DD] p-7 text-center">
        <Users className="w-10 h-10 mx-auto mb-3 text-[#9BA3AE]" />
        <h2 className="text-base font-bold text-[#1B2631] mb-2">まだ誰も参加していません</h2>
        <p className="text-sm text-[#4B5563] leading-relaxed mb-5">
          下のコードを生徒に伝えてください。
          <br />
          アプリの「クラスに参加」から入力してもらいます。
        </p>
        {activeClass && (
          <JoinCodeBlock
            code={activeClass.joinCode}
            copied={props.copiedCode === activeClass.joinCode}
            accent={theme.accent}
            onCopy={() => props.onCopyCode(activeClass.joinCode)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 参加コード（授業中にすぐ言えるよう常設） */}
      {activeClass && (
        <div className="bg-white rounded-2xl border border-[#E0E1DD] p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#6B7280] mb-1">参加コード</p>
            <p className="text-2xl font-bold tracking-[0.2em] text-[#1B2631]">
              {activeClass.joinCode}
            </p>
          </div>
          <button
            onClick={() => props.onCopyCode(activeClass.joinCode)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm border border-[#E0E1DD] text-[#4B5563] hover:bg-[#FAF8F2] transition-colors"
          >
            {props.copiedCode === activeClass.joinCode ? (
              <>
                <Check className="w-4 h-4 text-[#3E9C93]" />
                コピーしました
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                コピー
              </>
            )}
          </button>
        </div>
      )}

      {/* 上段：4つの数字 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="在籍" value={`${aggregate.memberCount}人`} accent={theme.accent} />
        <StatCard label="直近7日に学習" value={`${aggregate.activeIn7}人`} accent={theme.accent} />
        <StatCard label="平均で解いた大問" value={`${aggregate.avgSolved}問`} accent={theme.accent} />
        <StatCard label="平均の取り組み度" value={`${aggregate.avgEngagement}`} accent={theme.accent} />
      </div>

      {/* 声を掛けたい生徒（この画面の主目的） */}
      {(aggregate.neverStudied > 0 || aggregate.needsAttention.length > 0) && (
        <div className="bg-[#FFFBEB] border border-[#F4D98C] rounded-2xl p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-[#8A6412] mb-2">
            <AlertTriangle className="w-4 h-4" />
            声を掛けたい生徒
          </p>
          {aggregate.neverStudied > 0 && (
            <p className="text-sm text-[#6B5410] mb-2 leading-relaxed">
              まだ一度も学習していない生徒が <strong>{aggregate.neverStudied}人</strong> います。
              ログインだけして止まっている可能性があります。
            </p>
          )}
          {aggregate.needsAttention.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {aggregate.needsAttention.map((student) => (
                <span
                  key={student.uid}
                  className="px-2.5 py-1 rounded-lg bg-white/80 border border-[#EBD9A4] text-xs text-[#6B5410]"
                >
                  {student.displayName}
                  <span className="ml-1 font-bold">未処理{student.overdue}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 操作ボタン */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={props.onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm border border-[#E0E1DD] bg-white text-[#4B5563] hover:bg-[#FAF8F2] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          更新
        </button>
        <button
          onClick={props.onExportCsv}
          disabled={students.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: theme.accent }}
        >
          <Download className="w-4 h-4" />
          CSVで出す
        </button>
      </div>

      {/*
        ⚠️ この注意書きは折りたたまない。
        「取り組み度」が評定として一人歩きすることを防ぐための、
        設計上の安全装置である。
      */}
      <div className="flex items-start gap-2 p-3.5 rounded-xl bg-[#F4F7FA] border border-[#D9E4EC] text-xs text-[#3C5A6E] leading-relaxed">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          「取り組み度」は<strong>継続（最大50）</strong>・<strong>立て直し（最大35）</strong>・
          <strong>未処理（最大15）</strong>の合計です。成績そのものではなく、
          先生の判断を助ける材料としてご覧ください。
          <br />
          継続は「直近14日のうち何日やったか（7日で満点）」、立て直しは
          「間違えたあと解き直した割合」、未処理は「期限切れの復習を放置していないか」です。
          間違えた回数そのものは減点していません（挑戦を罰しないため）。
        </span>
      </div>

      {/* 生徒一覧 */}
      {loading ? (
        <div className="py-12 text-center text-sm text-[#6B7280]">学習状況を集めています…</div>
      ) : (
        <div className="space-y-2">
          {students.map((student) => (
            <StudentRow
              key={student.uid}
              student={student}
              theme={theme}
              isEditing={props.editingUid === student.uid}
              editingName={props.editingName}
              onStartEdit={() => props.onStartEdit(student)}
              onChangeEditingName={props.onChangeEditingName}
              onSave={() => props.onSaveEdit(student.uid)}
              onCancel={props.onCancelEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ===================================================================
// 小さな部品
// ===================================================================

/** 参加コードを大きく見せるブロック（黒板に書き写す想定で字間を広く取る） */
function JoinCodeBlock({
  code,
  copied,
  accent,
  onCopy,
}: {
  code: string;
  copied: boolean;
  accent: string;
  onCopy: () => void;
}) {
  return (
    <div className="inline-block">
      <p
        className="text-3xl font-bold tracking-[0.28em] text-[#1B2631] px-5 py-3 rounded-xl border-2"
        style={{ borderColor: accent }}
      >
        {code}
      </p>
      <button
        onClick={onCopy}
        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm border border-[#E0E1DD] text-[#4B5563] hover:bg-[#FAF8F2] transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-[#3E9C93]" />
            コピーしました
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            コピー
          </>
        )}
      </button>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E0E1DD] p-3.5">
      <p className="text-xs text-[#6B7280] mb-1">{label}</p>
      <p className="text-xl font-bold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

// ===================================================================
// 生徒1人分の行
// ===================================================================

interface StudentRowProps {
  student: StudentSummary;
  theme: ThemeShape;
  isEditing: boolean;
  editingName: string;
  onStartEdit: () => void;
  onChangeEditingName: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

// React.FC を使うのは、一覧で key を渡すため（既存の ReviewCard などと同じ書き方）。
const StudentRow: React.FC<StudentRowProps> = ({
  student,
  theme,
  isEditing,
  editingName,
  onStartEdit,
  onChangeEditingName,
  onSave,
  onCancel,
}) => {
  const { engagement, review } = student;
  const hasOverdue = review.overdue > 0;

  return (
    <div className="bg-white rounded-2xl border border-[#E0E1DD] p-4">
      {/* 名前の行 */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        {isEditing ? (
          <div className="flex-1 flex flex-wrap items-center gap-2">
            <input
              value={editingName}
              onChange={(event) => onChangeEditingName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onSave();
                if (event.key === 'Escape') onCancel();
              }}
              autoFocus
              maxLength={24}
              placeholder="出席番号や氏名"
              className="flex-1 min-w-[10rem] px-3 py-1.5 rounded-lg border border-[#C9D2DA] text-sm text-[#1B2631] focus:outline-none focus:border-[#6FA8C5]"
            />
            <button
              onClick={onSave}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
              style={{ backgroundColor: theme.accent }}
            >
              保存
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg text-xs border border-[#E0E1DD] text-[#4B5563]"
            >
              やめる
            </button>
          </div>
        ) : (
          <button
            onClick={onStartEdit}
            className="flex items-center gap-1.5 text-left group"
            title="出席番号や氏名を設定できます（生徒からは変更できません）"
          >
            <span className="text-sm font-bold text-[#1B2631]">{student.displayName}</span>
            <PenLine className="w-3.5 h-3.5 text-[#9BA3AE] group-hover:text-[#4B5563]" />
          </button>
        )}

        {!isEditing && (
          <div className="text-right shrink-0">
            <p className="text-lg font-bold leading-none" style={{ color: theme.accent }}>
              {engagement.score}
            </p>
            <p className="text-[10px] text-[#9BA3AE]">取り組み度</p>
          </div>
        )}
      </div>

      {/*
        内訳バー（3分割）。
        合計値だけを見て判断されないよう、必ず内訳を可視化する。
      */}
      <div className="flex h-2 rounded-full overflow-hidden bg-[#F1EFE9] mb-2">
        <div
          className="bg-[#6FA8C5]"
          style={{ width: `${engagement.breakdown.continuity}%` }}
          title={`継続 ${engagement.breakdown.continuity}/50`}
        />
        <div
          className="bg-[#5BC0BE]"
          style={{ width: `${engagement.breakdown.recovery}%` }}
          title={`立て直し ${engagement.breakdown.recovery}/35`}
        />
        <div
          className="bg-[#F4D03F]"
          style={{ width: `${engagement.breakdown.upkeep}%` }}
          title={`未処理 ${engagement.breakdown.upkeep}/15`}
        />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[#6B7280] mb-2.5">
        <span>継続 {engagement.breakdown.continuity}/50</span>
        <span>立て直し {engagement.breakdown.recovery}/35</span>
        <span>未処理 {engagement.breakdown.upkeep}/15</span>
      </div>

      {/* 実数（先生が自分で判断し直すための素の値） */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1.5 text-xs text-[#4B5563]">
        <span>
          解いた大問 <strong className="text-[#1B2631]">{student.solvedTotal}</strong>
        </span>
        <span>
          14日で <strong className="text-[#1B2631]">{student.activeDaysIn14}</strong> 日
        </span>
        <span>
          最終学習{' '}
          <strong className="text-[#1B2631]">{student.lastStudiedAt || 'まだなし'}</strong>
        </span>
        <span className={hasOverdue ? 'text-[#96342B]' : undefined}>
          未処理の復習{' '}
          <strong className={hasOverdue ? 'text-[#96342B]' : 'text-[#1B2631]'}>
            {review.overdue}
          </strong>
        </span>
        <span>
          復習リスト <strong className="text-[#1B2631]">{review.total}</strong>
        </span>
        <span>
          定着 <strong className="text-[#1B2631]">{review.mastered}</strong>
        </span>
        <span>
          間違え <strong className="text-[#1B2631]">{review.wrongCount}</strong> 回
        </span>
        <span>
          解き直し <strong className="text-[#1B2631]">{review.retryCount}</strong> 回
        </span>
      </div>
    </div>
  );
};
