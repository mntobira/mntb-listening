import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Play, Check } from 'lucide-react';
import { auth } from '../../firebase';
import { fetchAssignments } from '../../utils/classAssignments';
import {
  computeAssignmentProgress,
  formatDue,
  sortAssignments,
  STATUS_LABELS,
  type AssignmentDoc,
} from '../../utils/classAssignmentsCore';
import { getChapterCatalog } from '../../data/chapterCatalog';
import { readSolvedMap } from '../../utils/progress';
import type { MembershipDetail } from '../../utils/classroom';

/**
 * 生徒側：塾クラスの課題（締切つき）。ClassPanel の「参加中のクラス」の各行の下に出す。
 *   進み具合は端末の solved（解いた大問の記録）から数える＝通信は課題一覧の1回だけ。
 *   「解く」は課題の中でまだ終わっていない最初の単元から始める。
 */
export function StudentAssignments({
  membership,
  onStartChapter,
}: {
  membership: MembershipDetail;
  onStartChapter?: (chapterId: string, subject: MembershipDetail['subject']) => void;
}) {
  const [rows, setRows] = useState<AssignmentDoc[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchAssignments(membership.classId)
      .then((list) => {
        if (alive) setRows(sortAssignments(list));
      })
      .catch(() => {
        if (alive) setFailed(true);
      })
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [membership.classId]);

  const catalog = useMemo(() => getChapterCatalog(membership.subject), [membership.subject]);
  const totals = useMemo(() => Object.fromEntries(catalog.map((c) => [c.id, c.totalProblems])), [catalog]);
  const titles = useMemo(() => Object.fromEntries(catalog.map((c) => [c.id, c.title])), [catalog]);
  const solved = readSolvedMap(auth.currentUser?.uid);

  if (!loaded) return <p className="mt-2 text-xs text-gray-400">課題を読み込んでいます…</p>;
  if (failed) return <p className="mt-2 text-xs text-gray-400">課題を読み込めませんでした。</p>;

  return (
    <div className="mt-2 border-t border-gray-200 pt-2" data-testid="student-assignments">
      {/* 見出しは ClassPanel の「先生に見えていること」と同じ形 */}
      <p className="flex items-center gap-1.5 text-xs font-bold text-[#3C5A6E] mb-1.5">
        <ClipboardList size={13} />
        先生からの課題
      </p>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-500">いま出ている課題はありません。</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((a) => {
            const p = computeAssignmentProgress(a, solved, totals);
            const finished = p.status === 'done' || p.status === 'late';
            const next = a.chapterIds.find((id) => {
              const one = computeAssignmentProgress({ chapterIds: [id], dueAt: a.dueAt }, solved, totals);
              return one.status !== 'done' && one.status !== 'late';
            }) || a.chapterIds[0];
            const past = a.dueAt < Date.now();
            return (
              <li key={a.id} className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-2.5 py-1.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#1B2631] truncate">{a.title}</p>
                  <p className="text-xs text-gray-500 truncate">
                    <span className={past && !finished ? 'text-red-600 font-bold' : ''}>締切 {formatDue(a.dueAt)}</span>
                    {' ・ '}
                    {STATUS_LABELS[p.status]}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {p.solved}/{p.total}問 ・ {a.chapterIds.map((id) => titles[id] || id).join('、')}
                  </p>
                </div>
                {finished ? (
                  <span className="shrink-0 flex items-center gap-1 rounded-xl bg-[#F5FCFA] border border-[#A9E0D8] px-2.5 py-1 text-xs font-bold text-[#2F7C74]">
                    <Check size={13} />
                    完了
                  </span>
                ) : onStartChapter && next ? (
                  <button
                    type="button"
                    onClick={() => onStartChapter(next, membership.subject)}
                    className="shrink-0 flex min-h-[44px] items-center gap-1.5 px-3.5 rounded-xl bg-[#2C3E50] text-white text-xs font-bold"
                  >
                    <Play size={14} />
                    解く
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
