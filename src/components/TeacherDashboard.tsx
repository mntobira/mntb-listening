import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Users, Plus, AlertTriangle, School } from 'lucide-react';
import { auth } from '../firebase';
import {
  createClassroom,
  fetchMyClassrooms,
  fetchClassSummaries,
  fetchClassRawProgress,
  setJoinOpen,
  setRosterName,
  KANTEN_MASTERED_BOX,
} from '../utils/classroom';
import { buildKantenReport, type KantenReport } from '../utils/kantenReport';
import { getChapterCatalog, SUBJECT_LABELS } from '../data/chapterCatalog';
import { aggregateClass, type ClassroomDoc } from '../utils/classroomCore';
import { buildStudentCsv, type StudentSummary } from '../utils/studySummary';
import { subjectTheme } from '../data/subjectTheme';
import { toDateKey } from '../utils/studySummary';
import { DEFAULT_CLASS_SUBJECT } from './teacher/teacherSubjects';
import { EmptyState } from './teacher/EmptyState';
import { StudentsTab } from './teacher/StudentsTab';
import { KantenTab } from './teacher/KantenTab';
import { ClassesTab } from './teacher/ClassesTab';
import { CreateClassModal } from './teacher/CreateClassModal';
import { JukuTab } from './teacher/JukuTab';

/**
 * ===================================================================
 * 先生ダッシュボード（フェーズ0 ③）
 * ===================================================================
 *
 * -------------------------------------------------------------------
 * ■ この画面が答えるべき問い
 * -------------------------------------------------------------------
 * 現場の先生が学習アプリの管理画面を開くとき、知りたいことは
 * 実際には次の3つしかない。
 *
 *   ① 今日、誰に声を掛けるべきか（手が止まっている生徒は誰か）
 *   ② クラスはどこでつまずいているか（未処理の復習が集まる場所）
 *   ③ 評価に使える形で持ち出せるか（＝CSV）
 *
 * 逆に、凝ったグラフや期間比較のチャートは「見て楽しい」が
 * 職員室では使われない。授業前の5分で①→③が終わることを優先し、
 * 装飾よりも「次の行動が決まること」を設計基準にした。
 *
 * -------------------------------------------------------------------
 * ■ 教育的な安全装置（外してはいけない）
 * -------------------------------------------------------------------
 * 「取り組み度」は 継続50 / 立て直し35 / 未処理15 の合計であり、
 * 成績そのものではない。画面には必ず内訳を並べ、
 *
 *   「成績そのものではなく、先生の判断を助ける材料としてご覧ください」
 *
 * という説明を常時表示する。数字だけが独り歩きして生徒が
 * 不当に評価されることを防ぐため、この注意書きは折りたたまない。
 *
 * -------------------------------------------------------------------
 * ■ プライバシー（同意の作り込み）
 * -------------------------------------------------------------------
 * 先生が生徒の学習データを読めるのは、生徒自身が参加コードで
 * クラスに入り study_access を作ったときだけ。先生側からは
 * 生徒を勝手に追加できない（Firestore ルールで保証）。
 * つまりこの画面に並ぶのは「本人が見せることを選んだ生徒」だけである。
 */

interface TeacherDashboardProps {
  onBack: () => void;
}

type Tab = 'students' | 'kanten' | 'juku' | 'classes';


export function TeacherDashboard({ onBack }: TeacherDashboardProps) {
  const [tab, setTab] = useState<Tab>('students');
  const [classrooms, setClassrooms] = useState<ClassroomDoc[]>([]);
  const [activeClassId, setActiveClassId] = useState<string>('');
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  // クラス作成モーダル
  const [showCreate, setShowCreate] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newSubject, setNewSubject] = useState<ClassroomDoc['subject']>(DEFAULT_CLASS_SUBJECT);
  const [creating, setCreating] = useState(false);

  // 名簿名のインライン編集
  const [editingUid, setEditingUid] = useState('');
  const [editingName, setEditingName] = useState('');

  // 観点別評価レポート（開いたときにだけ読む＝無駄な read を発生させない）
  const [kantenReports, setKantenReports] = useState<KantenReport[]>([]);
  const [loadingKanten, setLoadingKanten] = useState(false);
  const [kantenLoadedFor, setKantenLoadedFor] = useState('');

  const uid = auth.currentUser?.uid || '';

  const activeClass = useMemo(
    () => classrooms.find((room) => room.id === activeClassId) || null,
    [classrooms, activeClassId],
  );
  const theme = subjectTheme(activeClass?.subject);

  // ---------------------------------------------------------------
  // クラス一覧の読み込み
  // ---------------------------------------------------------------
  const loadClasses = useCallback(async () => {
    if (!uid) {
      setLoadingClasses(false);
      return;
    }
    setLoadingClasses(true);
    setError('');
    try {
      const rooms = await fetchMyClassrooms();
      // 作成順が保証されないので、クラス名で並べて毎回同じ順にする
      rooms.sort((a, b) => (a.className || '').localeCompare(b.className || '', 'ja'));
      setClassrooms(rooms);
      setActiveClassId((current) => {
        if (current && rooms.some((room) => room.id === current)) return current;
        return rooms.length > 0 ? rooms[0].id : '';
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'クラスの読み込みに失敗しました。');
    } finally {
      setLoadingClasses(false);
    }
  }, [uid]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  // ---------------------------------------------------------------
  // 選択中クラスの生徒サマリー
  // ---------------------------------------------------------------
  const loadStudents = useCallback(async (classId: string) => {
    if (!classId) {
      setStudents([]);
      return;
    }
    setLoadingStudents(true);
    setError('');
    try {
      const summaries = await fetchClassSummaries(classId);
      setStudents(summaries);
    } catch (loadError) {
      setStudents([]);
      setError(loadError instanceof Error ? loadError.message : '学習状況の取得に失敗しました。');
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    void loadStudents(activeClassId);
  }, [activeClassId, loadStudents]);

  const aggregate = useMemo(() => aggregateClass(students), [students]);

  // ---------------------------------------------------------------
  // 観点別評価レポートの読み込み
  //
  // 「生徒の様子」タブとは別に生データを読む必要がある
  // （章別の到達状況はサマリーからは復元できないため）。
  // タブを開いた瞬間に1回だけ読み、クラスを切り替えたら読み直す。
  // ---------------------------------------------------------------
  const loadKanten = useCallback(
    async (classId: string, subject: ClassroomDoc['subject']) => {
      if (!classId) {
        setKantenReports([]);
        return;
      }
      setLoadingKanten(true);
      setError('');
      try {
        const chapters = getChapterCatalog(subject);
        const subjectLabel = SUBJECT_LABELS[subject] || subject;
        const rows = await fetchClassRawProgress(classId);
        setKantenReports(
          rows.map((row) =>
            buildKantenReport({
              uid: row.uid,
              displayName: row.displayName,
              subjectLabel,
              chapters,
              solved: row.solved,
              reviewItems: row.reviewItems,
              masteredBox: KANTEN_MASTERED_BOX,
            }),
          ),
        );
        setKantenLoadedFor(classId);
      } catch (loadError) {
        setKantenReports([]);
        setError(
          loadError instanceof Error ? loadError.message : '観点別評価の材料の取得に失敗しました。',
        );
      } finally {
        setLoadingKanten(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (tab !== 'kanten' || !activeClass) return;
    if (kantenLoadedFor === activeClass.id) return; // 読み直しは「更新」ボタンで明示的に
    void loadKanten(activeClass.id, activeClass.subject);
  }, [tab, activeClass, kantenLoadedFor, loadKanten]);

  // ---------------------------------------------------------------
  // 操作
  // ---------------------------------------------------------------
  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const created = await createClassroom({
        schoolName: newSchoolName,
        className: newClassName,
        subject: newSubject,
      });
      setShowCreate(false);
      setNewClassName('');
      // 学校名は次のクラスでもたいてい同じなので残す（連続作成の手間を減らす）
      setClassrooms((prev) => [...prev, created]);
      setActiveClassId(created.id);
      setTab('classes');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'クラスの作成に失敗しました。');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(''), 1800);
    } catch {
      // クリップボードが使えない環境（古い端末・非HTTPS）でも
      // コードは画面に大きく出しているので、失敗しても致命的ではない
      setError('コードのコピーができませんでした。画面の文字を書き写してください。');
    }
  };

  const handleToggleJoin = async (room: ClassroomDoc) => {
    const next = !room.joinOpen;
    // 楽観更新（通信を待たせない）。失敗したら元に戻す。
    setClassrooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, joinOpen: next } : r)));
    try {
      await setJoinOpen(room.id, next);
    } catch (toggleError) {
      setClassrooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, joinOpen: room.joinOpen } : r)));
      setError(toggleError instanceof Error ? toggleError.message : '参加受付の変更に失敗しました。');
    }
  };

  const handleSaveRosterName = async (studentUid: string) => {
    const trimmed = editingName.trim();
    setEditingUid('');
    if (!activeClassId) return;
    try {
      await setRosterName(activeClassId, studentUid, trimmed);
      setStudents((prev) =>
        prev.map((student) =>
          student.uid === studentUid
            ? { ...student, displayName: trimmed || student.displayName }
            : student,
        ),
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '名前の設定に失敗しました。');
    }
  };

  /**
   * CSV を書き出す。
   * ファイル名にクラス名と日付を入れる。先生は複数クラス分を
   * ダウンロードフォルダに溜めるので、名前で判別できないと使えない。
   */
  const handleExportCsv = () => {
    if (students.length === 0) return;
    const csv = buildStudentCsv(students);
    const className = (activeClass?.className || 'クラス').replace(/[\\/:*?"<>|]/g, '_');
    const fileName = `学習状況_${className}_${toDateKey(Date.now())}.csv`;

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

  // ---------------------------------------------------------------
  // 未ログイン：先に入口を閉じる
  // ---------------------------------------------------------------
  if (!uid) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] px-5 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#4B5563] hover:text-[#1B2631] transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">戻る</span>
        </button>
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-[#E0E1DD] p-6 text-center">
          <School className="w-10 h-10 mx-auto mb-3 text-[#9BA3AE]" />
          <h2 className="text-lg font-bold text-[#1B2631] mb-2">先生用の画面です</h2>
          <p className="text-sm text-[#4B5563] leading-relaxed">
            クラスの管理には Google ログインが必要です。
            <br />
            設定画面からログインしてから、もう一度お試しください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] px-4 sm:px-6 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-6">
      {/* ヘッダー */}
      <div className="max-w-5xl mx-auto">
        <button
          onClick={onBack}
          className="flex min-h-[44px] items-center gap-2 text-[#4B5563] hover:text-[#1B2631] transition-colors mb-3"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">戻る</span>
        </button>

        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            {/* ホワイトレーベル：学校名を主役にする */}
            {activeClass?.schoolName && (
              <p className="text-xs text-[#6B7280] mb-1">{activeClass.schoolName}</p>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-[#1B2631] flex items-center gap-2">
              <Users className="w-6 h-6" style={{ color: theme.accent }} />
              クラスの学習状況
            </h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex min-h-[44px] items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-transform active:scale-95"
            style={{ backgroundColor: theme.accent }}
          >
            <Plus className="w-4 h-4" />
            クラスを作る
          </button>
        </div>

        {/* クラス切り替え */}
        {classrooms.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {classrooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setActiveClassId(room.id)}
                className={`shrink-0 min-h-[44px] px-3.5 py-2 rounded-xl text-sm border transition-colors ${
                  room.id === activeClassId
                    ? 'bg-white border-transparent font-bold text-[#1B2631]'
                    : 'bg-transparent border-[#E0E1DD] text-[#4B5563] hover:bg-white/60'
                }`}
                style={room.id === activeClassId ? { boxShadow: theme.bubbleShadow } : undefined}
              >
                {room.className}
              </button>
            ))}
          </div>
        )}

        {/* タブ */}
        {classrooms.length > 0 && (
          <div className="grid grid-cols-4 sm:flex gap-1 p-1 bg-[#F1EFE9] rounded-xl mb-5 sm:w-fit">
            {([
              { id: 'students' as Tab, label: '生徒の様子' },
              { id: 'kanten' as Tab, label: '観点別評価' },
              { id: 'juku' as Tab, label: '課題・理由' },
              { id: 'classes' as Tab, label: 'クラス設定' },
            ]).map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`min-h-[44px] px-1 sm:px-4 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  tab === item.id ? 'bg-white font-bold text-[#1B2631] shadow-sm' : 'text-[#4B5563]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-[#FDECEA] border border-[#F5C6C0] text-sm text-[#96342B]">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {loadingClasses ? (
          <div className="py-16 text-center text-sm text-[#6B7280]">読み込んでいます…</div>
        ) : classrooms.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} accent={theme.accent} />
        ) : tab === 'students' ? (
          <StudentsTab
            students={students}
            aggregate={aggregate}
            loading={loadingStudents}
            theme={theme}
            activeClass={activeClass}
            copiedCode={copiedCode}
            editingUid={editingUid}
            editingName={editingName}
            onCopyCode={handleCopyCode}
            onRefresh={() => void loadStudents(activeClassId)}
            onExportCsv={handleExportCsv}
            onStartEdit={(student) => {
              setEditingUid(student.uid);
              setEditingName(student.displayName === '（名前未設定）' ? '' : student.displayName);
            }}
            onChangeEditingName={setEditingName}
            onSaveEdit={handleSaveRosterName}
            onCancelEdit={() => setEditingUid('')}
          />
        ) : tab === 'kanten' ? (
          <KantenTab
            reports={kantenReports}
            loading={loadingKanten}
            theme={theme}
            activeClass={activeClass}
            onRefresh={() => {
              if (activeClass) void loadKanten(activeClass.id, activeClass.subject);
            }}
          />
        ) : tab === 'juku' ? (
          <JukuTab activeClass={activeClass} theme={theme} />
        ) : (
          <ClassesTab
            classrooms={classrooms}
            theme={theme}
            copiedCode={copiedCode}
            onCopyCode={handleCopyCode}
            onToggleJoin={handleToggleJoin}
          />
        )}
      </div>

      {showCreate && (
        <CreateClassModal
          schoolName={newSchoolName}
          className={newClassName}
          subject={newSubject}
          creating={creating}
          accent={theme.accent}
          onChangeSchool={setNewSchoolName}
          onChangeClass={setNewClassName}
          onChangeSubject={setNewSubject}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
