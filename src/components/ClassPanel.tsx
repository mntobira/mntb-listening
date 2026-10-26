import React, { useCallback, useEffect, useState } from 'react';
import {
  School,
  Users,
  LogIn,
  Loader2,
  AlertTriangle,
  Check,
  Eye,
  Trash2,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { auth } from '../firebase';
import {
  joinClassroomByCode,
  fetchMyMembershipDetails,
  leaveClassroom,
  type MembershipDetail,
} from '../utils/classroom';
import { normalizeJoinCode, JOIN_CODE_LENGTH } from '../utils/classroomCore';
import { subjectTheme } from '../data/subjectTheme';
import { confirmAction } from '../utils/dialog';
import { saveJukuMemberships } from '../utils/classAssignments';
import { StudentAssignments } from './classroom/StudentAssignments';

/**
 * ===================================================================
 * ClassPanel — 生徒側の「クラスに参加」画面
 * ===================================================================
 *
 * -------------------------------------------------------------------
 * ■ この画面が背負っている責任
 * -------------------------------------------------------------------
 * 先生ダッシュボードの裏返しであり、**同意の窓口**である。
 * 学習データを他人（先生）が読めるようになる唯一の入口なので、
 * ここでは機能の説明よりも先に、次の3点を明示する。
 *
 *   ① 誰が見るのか（学校名・クラス名）
 *   ② 何が見えるのか（解いた問題数・学習した日・復習の実行状況）
 *   ③ 何は見えないのか（答案の中身・他の科目のメモ・成績）
 *   ④ やめられること（いつでも退出でき、その時点で見えなくなる）
 *
 * 「入るのは簡単だが抜けるのが分かりにくい」設計は、教育現場向けの
 * プロダクトとして採ってはいけない。退出ボタンは畳まず常設する。
 *
 * -------------------------------------------------------------------
 * ■ 参加コードの入力について
 * -------------------------------------------------------------------
 * 現場で最も多い失敗は「O と 0」「I と 1」の打ち間違いと、
 * 全角入力である。normalizeJoinCode が吸収するので、
 * 入力中にリアルタイムで正規化して見せ、生徒に「直された」ことが
 * 分かるようにする（弾いてから怒るのではなく、先に直す）。
 */

interface ClassPanelProps {
  /** 先生の画面に出す既定の名前（プロフィールのニックネーム） */
  defaultDisplayName?: string;
  /** 課題の「解く」から演習を始める（塾クラスだけ。無ければボタンを出さない） */
  onStartChapter?: (chapterId: string, subject: MembershipDetail['subject']) => void;
}

export function ClassPanel({ defaultDisplayName = '', onStartChapter }: ClassPanelProps) {
  const [memberships, setMemberships] = useState<MembershipDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [leavingClassId, setLeavingClassId] = useState('');

  const uid = auth.currentUser?.uid || '';

  const load = useCallback(async () => {
    if (!uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchMyMembershipDetails();
      setMemberships(rows);
      // 塾クラス（plan == 'juku'）を端末に覚えておく。解説画面の「選んだ理由」欄と
      // 広告の出し分けが Firestore を読まずに判断できるようにする（送れるかはルールが決める）。
      saveJukuMemberships(
        uid,
        rows
          .filter((row) => row.plan === 'juku')
          .map((row) => ({ classId: row.classId, teacherUid: row.teacherUid, className: row.className, subject: row.subject })),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '参加クラスの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleJoin = async () => {
    setJoining(true);
    setError('');
    setNotice('');
    try {
      const result = await joinClassroomByCode(code, defaultDisplayName);
      setNotice(
        result.alreadyJoined
          ? `「${result.classroom.className}」にはすでに参加しています。`
          : `「${result.classroom.className}」に参加しました。`,
      );
      setCode('');
      await load();
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'クラスへの参加に失敗しました。');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async (membership: MembershipDetail) => {
    // 退出は取り消せない操作なので必ず確認する（誤タップ防止）
    const confirmed = confirmAction(
      `「${membership.className}」から抜けます。\n先生からあなたの学習状況は見えなくなります。よろしいですか？`,
    );
    if (!confirmed) return;

    setLeavingClassId(membership.classId);
    setError('');
    setNotice('');
    try {
      await leaveClassroom(membership.classId, membership.teacherUid);
      setNotice(`「${membership.className}」から抜けました。`);
      await load();
    } catch (leaveError) {
      setError(leaveError instanceof Error ? leaveError.message : 'クラスからの退出に失敗しました。');
    } finally {
      setLeavingClassId('');
    }
  };

  if (!uid) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
        <School className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-xs text-gray-500 leading-relaxed">
          クラスへの参加には Google ログインが必要です。
          <br />
          先に「アカウント」からログインしてください。
        </p>
      </div>
    );
  }

  const normalized = normalizeJoinCode(code);
  const canJoin = normalized.length === JOIN_CODE_LENGTH && !joining;

  return (
    <div className="space-y-2.5">
      {/* 参加中のクラス（＝いま見られている相手） */}
      <section className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          参加中のクラス
        </h3>

        {loading ? (
          <p className="text-xs text-gray-400 py-3 text-center">読み込んでいます…</p>
        ) : memberships.length === 0 ? (
          <p className="text-xs text-gray-500 leading-relaxed py-1">
            まだどのクラスにも参加していません。
            <br />
            学習の記録は<strong>あなただけのもの</strong>で、誰にも見えていません。
          </p>
        ) : (
          <ul className="space-y-2">
            {memberships.map((membership) => {
              const theme = subjectTheme(membership.subject);
              return (
                <li
                  key={membership.classId}
                  className="rounded-xl border border-gray-200 bg-gray-50/60 p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 truncate">{membership.schoolName}</p>
                      <p className="text-xs font-bold text-[#1B2631] truncate">
                        {membership.className}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs ${theme.chipTextClass} ${theme.chipBgClass}`}
                        >
                          {theme.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          先生の画面での表示名：{membership.rosterName}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLeave(membership)}
                      disabled={leavingClassId === membership.classId}
                      className="shrink-0 flex min-h-[44px] items-center gap-1 px-2.5 rounded-lg border border-red-100 bg-red-50 text-xs font-bold text-red-600 disabled:opacity-50"
                    >
                      {leavingClassId === membership.classId ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                      抜ける
                    </button>
                  </div>
                  {membership.plan === 'juku' && (
                    <StudentAssignments membership={membership} onStartChapter={onStartChapter} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 何が見えるのか（同意の中身） */}
      {memberships.length > 0 && (
        <section className="rounded-2xl bg-[#F4F7FA] border border-[#D9E4EC] p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#3C5A6E] mb-1.5">
            <Eye size={13} />
            先生に見えていること
          </p>
          <ul className="space-y-0.5 text-xs text-[#3C5A6E] leading-snug">
            <li>・解いた大問の数と、学習した日</li>
            <li>・復習リストの件数と、期限が来ているのに残っている数</li>
            <li>・間違えた回数と、解き直した回数</li>
            {memberships.some((m) => m.plan === 'juku') && (
              <li>・解説画面で「先生に送る」を押した「選んだ理由」（送ったものだけ）</li>
            )}
          </ul>
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#3C5A6E] mt-2 mb-1.5">
            <Info size={13} />
            見えていないこと
          </p>
          <ul className="space-y-0.5 text-xs text-[#3C5A6E] leading-snug">
            <li>・あなたが書いた答案の中身やノートのメモ</li>
            <li>・クラスの科目以外の学習内容</li>
            <li>・成績や評定（先生が判断する材料としてだけ使われます）</li>
          </ul>
          <p className="text-xs text-[#5A7A8E] mt-2 leading-snug">
            「抜ける」を押した時点で、先生からは見えなくなります。
          </p>
        </section>
      )}

      {/* 参加コードの入力 */}
      <section className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm space-y-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          クラスに参加する
        </h3>
        <p className="text-xs text-gray-500 leading-snug">
          先生から聞いた{JOIN_CODE_LENGTH}文字のコードを入力してください。
        </p>

        <div className="flex gap-2">
          <input
            value={code}
            onChange={(event) => setCode(normalizeJoinCode(event.target.value))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && canJoin) void handleJoin();
            }}
            maxLength={JOIN_CODE_LENGTH}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="ABC234"
            aria-label="参加コード"
            className="flex-1 min-w-0 min-h-[44px] px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold tracking-[0.2em] text-[#1B2631] uppercase focus:outline-none focus:border-[#6FA8C5]"
          />
          <button
            onClick={handleJoin}
            disabled={!canJoin}
            className="shrink-0 flex min-h-[44px] items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2C3E50] text-white text-xs font-bold disabled:opacity-40"
          >
            {joining ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
            {joining ? '参加中…' : '参加'}
          </button>
        </div>

        <p className="text-xs text-gray-400 leading-snug">
          コードには <strong>O・0</strong>、<strong>I・1</strong> のような
          見間違えやすい文字は使われていません。打ち間違えても自動で直します。
        </p>

        {/* 16歳未満は保護者の同意が必要（学習記録を先生＝第三者に見せることになるため） */}
        <p
          data-testid="class-consent-notice"
          className="flex items-start gap-1.5 rounded-xl bg-[#FFF8E6] border border-[#F2D58A] px-2.5 py-2 text-xs leading-snug text-[#7A5A12]"
        >
          <ShieldCheck size={13} className="shrink-0 mt-[1px]" />
          <span>
            <strong>16歳未満の人は、参加する前に保護者の方の同意をもらってください。</strong>
            参加すると、解いた問題の数や学習した日などの記録が先生に見えるようになります。
          </span>
        </p>
      </section>

      {notice && (
        <div className="flex items-start gap-1.5 rounded-xl bg-[#F5FCFA] border border-[#A9E0D8] px-2.5 py-2 text-xs leading-snug text-[#2F7C74]">
          <Check size={13} className="shrink-0 mt-[1px]" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-1.5 rounded-xl bg-[#FDEDEC] border border-[#E74C3C]/40 px-2.5 py-2 text-xs leading-snug text-[#C0392B]"
        >
          <AlertTriangle size={13} className="shrink-0 mt-[1px]" />
          <span>{error}</span>
        </div>
      )}

      <p className="flex items-start gap-1.5 text-xs text-gray-400 leading-snug px-1">
        <Users size={11} className="shrink-0 mt-[1px]" />
        <span>
          先生の側からあなたを勝手にクラスへ追加することはできません。
          このコード入力があなたの「見せていいですよ」という意思表示になります。
        </span>
      </p>
    </div>
  );
}
