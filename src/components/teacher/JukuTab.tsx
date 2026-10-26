import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Plus, Trash2, RefreshCw, MessageSquareText, ClipboardList, Info, ChevronDown } from 'lucide-react';
import { type ClassroomDoc } from '../../utils/classroomCore';
import { fetchClassRawProgress, type StudentRawProgress } from '../../utils/classroom';
import {
  createAssignment,
  deleteAssignment,
  fetchAssignments,
  fetchClassReasons,
} from '../../utils/classAssignments';
import {
  ASSIGNMENT_MAX_CHAPTERS,
  ASSIGNMENT_TITLE_MAX,
  computeAssignmentProgress,
  countStatuses,
  formatDue,
  groupReasonsByQuestion,
  isJukuPlan,
  reasonHeading,
  sortAssignments,
  STATUS_LABELS,
  type AnswerReasonDoc,
  type AssignmentDoc,
  type AssignmentStatus,
} from '../../utils/classAssignmentsCore';
import { getChapterCatalog } from '../../data/chapterCatalog';
import { confirmAction } from '../../utils/dialog';
import type { ThemeShape } from './teacherTheme';

// ===================================================================
// 課題・理由タブ（塾向け・plan == 'juku' のクラスだけ）
// ===================================================================

/**
 * ① 課題：単元と締切を選んで配る → 生徒ごとに「期限内に完了／期限後に完了／取り組み中／未着手」
 * ② 選んだ理由：生徒が解説画面から送った理由を、問題ごとにまとめて読む
 *
 * ■ 見た目は既存の先生画面にそろえる
 *   ・上の操作ボタン … 観点別評価タブ（更新＝白枠、主ボタン＝科目色）
 *   ・空の状態 … 観点別評価タブ・生徒の様子タブの「まだ〜ありません」カード
 *   ・作成の窓 … クラスを作る窓（CreateClassModal）
 *   ・表示の切り替え … ダッシュボード上部のタブと同じ灰色の段
 *   ・状況の色 … 受付中の緑・注意書きの青・エラーの赤・控えめな灰（新しい色は足さない）
 *
 * plan は運営がコンソールで設定する。ここからは変えられない（ルールで禁止）。
 */
const STATUS_STYLE: Record<AssignmentStatus, string> = {
  done: 'bg-[#F5FCFA] text-[#2F7C74] border-[#A9E0D8]',
  late: 'bg-[#FAF8F2] text-[#6B7280] border-[#E0E1DD]',
  in_progress: 'bg-[#F4F7FA] text-[#3C5A6E] border-[#D9E4EC]',
  not_started: 'bg-[#FDECEA] text-[#96342B] border-[#F5C6C0]',
};

function StatusChip({ status, children }: { status: AssignmentStatus; children: ReactNode }) {
  return <span className={`inline-block px-2 py-0.5 rounded-md text-xs border ${STATUS_STYLE[status]}`}>{children}</span>;
}

function todayPlus(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function EmptyCard({ icon: Icon, title, children }: { icon: typeof Info; title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E0E1DD] p-7 text-center">
      <Icon className="w-10 h-10 mx-auto mb-3 text-[#9BA3AE]" />
      <h2 className="text-base font-bold text-[#1B2631] mb-2">{title}</h2>
      <p className="text-sm text-[#4B5563] leading-relaxed">{children}</p>
    </div>
  );
}

export function JukuTab({ activeClass, theme }: { activeClass: ClassroomDoc | null; theme: ThemeShape }) {
  const [view, setView] = useState<'assign' | 'reasons'>('assign');
  const [assignments, setAssignments] = useState<AssignmentDoc[]>([]);
  const [students, setStudents] = useState<StudentRawProgress[]>([]);
  const [reasons, setReasons] = useState<AnswerReasonDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [openId, setOpenId] = useState('');

  const juku = isJukuPlan(activeClass?.plan);
  const classId = activeClass?.id || '';
  const catalog = useMemo(() => (activeClass ? getChapterCatalog(activeClass.subject) : []), [activeClass]);
  const totals = useMemo(() => Object.fromEntries(catalog.map((c) => [c.id, c.totalProblems])), [catalog]);
  const titles = useMemo(() => Object.fromEntries(catalog.map((c) => [c.id, c.title])), [catalog]);
  const names = useMemo(() => Object.fromEntries(students.map((s) => [s.uid, s.displayName])), [students]);

  const load = useCallback(async () => {
    if (!classId || !juku) return;
    setLoading(true);
    setError('');
    try {
      const [list, rows, rs] = await Promise.all([
        fetchAssignments(classId),
        fetchClassRawProgress(classId),
        fetchClassReasons(classId).catch(() => [] as AnswerReasonDoc[]),
      ]);
      setAssignments(sortAssignments(list));
      setStudents(rows);
      setReasons(rs);
    } catch (e) {
      setError(e instanceof Error ? e.message : '読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [classId, juku]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!activeClass) return null;

  if (!juku) {
    return (
      <div data-testid="juku-locked">
        <EmptyCard icon={Info} title="課題の配信・選んだ理由は、塾向けのクラスで使えます">
          いまは試験導入中の塾のクラスだけで使えるようにしています。
          <br />
          生徒の学習機能（問題・音声・復習・対戦）は、どのクラスでもそのまま無料で使えます。
        </EmptyCard>
      </div>
    );
  }

  const handleDelete = async (a: AssignmentDoc) => {
    if (!confirmAction(`課題「${a.title}」を消します。生徒の画面からも消えます。よろしいですか？`)) return;
    try {
      await deleteAssignment(a.id);
      setAssignments((prev) => prev.filter((r) => r.id !== a.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : '課題の削除に失敗しました。');
    }
  };

  const groups = groupReasonsByQuestion(reasons);

  return (
    <div className="space-y-4" data-testid="juku-tab">
      {/* 表示の切り替え（ダッシュボード上部のタブと同じ見た目）＋ 操作ボタン（観点別評価タブと同じ見た目） */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 p-1 bg-[#F1EFE9] rounded-xl" role="group" aria-label="表示の切り替え">
          {([
            { id: 'assign' as const, label: `課題（${assignments.length}）` },
            { id: 'reasons' as const, label: `選んだ理由（${reasons.length}）` },
          ]).map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={view === item.id}
              onClick={() => setView(item.id)}
              className={`min-h-[44px] px-3 sm:px-4 rounded-lg text-sm transition-colors ${
                view === item.id ? 'bg-white font-bold text-[#1B2631] shadow-sm' : 'text-[#4B5563]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="flex min-h-[44px] items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm border border-[#E0E1DD] bg-white text-[#4B5563] hover:bg-[#FAF8F2] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          更新
        </button>
        {view === 'assign' && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex min-h-[44px] items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold text-white transition-transform active:scale-95"
            style={{ backgroundColor: theme.accent }}
          >
            <Plus className="w-4 h-4" />
            課題を出す
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#FDECEA] border border-[#F5C6C0] text-sm text-[#96342B] leading-relaxed">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-[#6B7280]">読み込んでいます…</div>
      ) : view === 'assign' ? (
        assignments.length === 0 ? (
          <EmptyCard icon={ClipboardList} title="まだ課題はありません">
            「課題を出す」から単元と締切を選ぶと、生徒のクラス画面に届きます。
          </EmptyCard>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const rows = students.map((s) => ({ s, p: computeAssignmentProgress(a, s.solved, totals) }));
              const counts = countStatuses(rows.map((r) => r.p));
              const opened = openId === a.id;
              return (
                <div key={a.id} className="bg-white rounded-2xl border border-[#E0E1DD] p-4">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#6B7280]">締切 {formatDue(a.dueAt)}</p>
                      <p className="text-base font-bold text-[#1B2631] truncate">{a.title}</p>
                      <p className="text-xs text-[#6B7280] truncate">{a.chapterIds.map((id) => titles[id] || id).join('、')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDelete(a)}
                      aria-label={`課題「${a.title}」を消す`}
                      className="shrink-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#E0E1DD] text-[#6B7280] hover:bg-[#FAF8F2] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(Object.keys(STATUS_LABELS) as AssignmentStatus[]).map((k) => (
                      <span key={k}>
                        <StatusChip status={k}>{`${STATUS_LABELS[k]} ${counts[k]}`}</StatusChip>
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenId(opened ? '' : a.id)}
                    aria-expanded={opened}
                    className="mt-2 flex min-h-[44px] items-center gap-1 text-xs font-bold text-[#4B5563]"
                  >
                    生徒ごとに見る
                    <ChevronDown className={`w-4 h-4 transition-transform ${opened ? 'rotate-180' : ''}`} />
                  </button>
                  {opened && (
                    <div className="border-t border-[#F1EFE9] pt-2 space-y-1.5">
                      {rows.length === 0 && <p className="text-xs text-[#6B7280]">まだ生徒がいません。</p>}
                      {rows.map(({ s, p }) => (
                        <div key={s.uid} className="flex items-center gap-2 text-sm">
                          <span className="flex-1 min-w-0 truncate text-[#1B2631]">{s.displayName}</span>
                          <span className="text-xs text-[#6B7280]">{p.solved}/{p.total}問</span>
                          <StatusChip status={p.status}>{STATUS_LABELS[p.status]}</StatusChip>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : groups.length === 0 ? (
        <EmptyCard icon={MessageSquareText} title="まだ届いていません">
          生徒が解説画面で「この答えを選んだ理由を先生に送る」から送ると、ここに問題ごとに並びます。
        </EmptyCard>
      ) : (
        <div className="space-y-3">
          {/* 観点別評価タブの注意書きと同じ青い帯 */}
          <div className="flex items-start gap-2 p-3.5 rounded-xl bg-[#F4F7FA] border border-[#D9E4EC] text-xs text-[#3C5A6E] leading-relaxed">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>生徒が自分で「先生に送る」を押した理由だけが並びます。生徒はいつでも取り消せます。</span>
          </div>
          {groups.map((g) => (
            <div key={`${g.chapterId}::${g.questionId}`} className="bg-white rounded-2xl border border-[#E0E1DD] p-4">
              <p className="text-xs text-[#6B7280] truncate">{titles[g.chapterId] || g.chapterId}</p>
              <p className="text-base font-bold text-[#1B2631] mb-2">
                {reasonHeading(g)}
                <span className="ml-1.5 text-xs font-normal text-[#6B7280]">{g.rows.length}件</span>
              </p>
              <div className="space-y-2">
                {g.rows.map((r) => (
                  <div key={r.uid} className="rounded-xl bg-[#FAF8F2] border border-[#E0E1DD] p-3">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-[#1B2631] mb-1">
                      {names[r.uid] || '（退出した生徒）'}
                      {typeof r.correct === 'boolean' && (
                        <StatusChip status={r.correct ? 'done' : 'not_started'}>{r.correct ? '正解' : '不正解'}</StatusChip>
                      )}
                    </p>
                    <p className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-wrap break-words">{r.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateAssignmentModal
          catalog={catalog}
          accent={theme.accent}
          onClose={() => setShowCreate(false)}
          onCreate={async (input) => {
            const created = await createAssignment(classId, input);
            setAssignments((prev) => sortAssignments([...prev, created]));
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

// ===================================================================
// 課題を出す窓（クラスを作る窓 CreateClassModal と同じ見た目）
// ===================================================================

function CreateAssignmentModal({
  catalog,
  accent,
  onClose,
  onCreate,
}: {
  catalog: Array<{ id: string; title: string; totalProblems: number }>;
  accent: string;
  onClose: () => void;
  onCreate: (input: { title: string; chapterIds: string[]; dueDate: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState(todayPlus(7));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id: string) => {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= ASSIGNMENT_MAX_CHAPTERS ? prev : [...prev, id]));
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await onCreate({ title, chapterIds: picked, dueDate });
    } catch (e) {
      setError(e instanceof Error ? e.message : '課題の作成に失敗しました。');
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = title.trim().length > 0 && picked.length > 0 && !busy;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 py-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="課題を出す"
    >
      <div
        className="w-full max-w-md max-h-full flex flex-col bg-white rounded-2xl border border-[#E0E1DD] p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-[#1B2631] mb-1">課題を出す</h2>
        <p className="text-xs text-[#6B7280] mb-3 leading-relaxed">
          単元と締切を選ぶと、クラスの生徒の画面に届きます。進み具合は生徒が解いた記録から自動で数えます。
        </p>

        <label className="block mb-3">
          <span className="block text-xs font-bold text-[#4B5563] mb-1">課題の名前</span>
          <input
            value={title}
            maxLength={ASSIGNMENT_TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例）第1問A 週末課題"
            className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#C9D2DA] text-sm text-[#1B2631] focus:outline-none focus:border-[#6FA8C5]"
          />
        </label>

        <label className="block mb-3">
          <span className="block text-xs font-bold text-[#4B5563] mb-1">締切</span>
          <input
            type="date"
            value={dueDate}
            min={todayPlus(0)}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#C9D2DA] text-sm text-[#1B2631] focus:outline-none focus:border-[#6FA8C5]"
          />
        </label>

        <span className="block text-xs font-bold text-[#4B5563] mb-1.5">
          単元（{picked.length}/{ASSIGNMENT_MAX_CHAPTERS}）
        </span>
        <div className="flex-1 min-h-0 overflow-y-auto mb-4">
          <div className="flex flex-wrap gap-2">
            {catalog.map((c) => {
              const on = picked.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(c.id)}
                  className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-sm border transition-colors ${
                    on ? 'font-bold text-white border-transparent' : 'border-[#E0E1DD] text-[#4B5563] hover:bg-[#FAF8F2]'
                  }`}
                  style={on ? { backgroundColor: accent } : undefined}
                >
                  {c.title}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-xs text-[#96342B] mb-2 leading-relaxed">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-sm border border-[#E0E1DD] text-[#4B5563] hover:bg-[#FAF8F2] transition-colors"
          >
            やめる
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canSubmit}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            {busy ? '作成中…' : '出す'}
          </button>
        </div>
      </div>
    </div>
  );
}
