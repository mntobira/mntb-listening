import { useEffect, useState, useSyncExternalStore } from 'react';
import { MessageSquareText, Send, Loader2, ChevronDown } from 'lucide-react';
import { auth } from '../../firebase';
import { subjectOfChapterId } from '../../data/subjects';
import {
  jukuClassForSubject,
  subscribeJukuMemberships,
  submitAnswerReason,
  fetchMyAnswerReason,
  deleteMyAnswerReason,
  type ReasonTarget,
} from '../../utils/classAssignments';
import { REASON_MAX } from '../../utils/classAssignmentsCore';
import { SOCIAL_FEATURES } from '../../config/features';
import '../listening-explanation.css';

/**
 * 解説画面：「選んだ理由」を書いて先生に送る欄（塾クラスの生徒だけ）。
 *   ・塾クラス（plan == 'juku'）に入っていて、その教科の問題のときだけ出す。それ以外は何も描かない。
 *   ・最初は畳んでおく（解説の1画面を崩さない）。押したら開く。
 *   ・送るのは本人が「先生に送る」を押したときだけ。送ったものは取り消せる。
 */
export function ReasonBox({ chapterId, questionId, correct, qNo }: { chapterId: string; questionId: string; correct?: boolean; qNo?: number }) {
  const uid = auth.currentUser?.uid || '';
  const subject = subjectOfChapterId(chapterId);
  // 塾クラスの記録が書き変わったら出し直す
  const version = useSyncExternalStore(subscribeJukuMemberships, () => jukuVersion(uid, subject), () => '');
  const room = version ? jukuClassForSubject(uid, subject) : null;

  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const roomClassId = room?.classId || '';
  const roomTeacherUid = room?.teacherUid || '';
  const target: ReasonTarget | null = room ? { classId: roomClassId, teacherUid: roomTeacherUid, chapterId, questionId } : null;

  useEffect(() => {
    setText('');
    setSent(false);
    setMessage('');
    setOpen(false);
  }, [chapterId, questionId]);

  useEffect(() => {
    if (!open || !roomClassId) return;
    let alive = true;
    void fetchMyAnswerReason({ classId: roomClassId, teacherUid: roomTeacherUid, chapterId, questionId }).then((row) => {
      if (alive && row) {
        setText(row.reason);
        setSent(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [open, roomClassId, roomTeacherUid, chapterId, questionId]);

  // クラス機能を公開する前は、端末に古い記録が残っていても出さない
  if (!SOCIAL_FEATURES.classroom || !uid || !room || !target) return null;

  const handleSend = async () => {
    setBusy(true);
    setMessage('');
    try {
      await submitAnswerReason(target, text, correct, qNo);
      setSent(true);
      setMessage(`「${room.className}」の先生に送りました。`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '送れませんでした。');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setMessage('');
    try {
      await deleteMyAnswerReason(target);
      setSent(false);
      setText('');
      setMessage('送った理由を取り消しました。');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '取り消せませんでした。');
    } finally {
      setBusy(false);
    }
  };

  // 見た目は解説画面の他の折りたたみ（大問全体の流れ・周辺知識）と同じ lx-fold を使う
  return (
    <details
      className="lx-fold lx-fold-shared"
      data-testid="reason-box"
      open={open || undefined}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>
        <MessageSquareText size={16} aria-hidden="true" />
        <span className="lx-lbl-long">{sent ? '選んだ理由（先生に送信済み）' : 'この答えを選んだ理由を先生に送る'}</span>
        <span className="lx-lbl-short">{sent ? '選んだ理由（送信済み）' : '選んだ理由を送る'}</span>
        <ChevronDown size={18} aria-hidden="true" />
      </summary>
      <div className="lx-fold-body space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, REASON_MAX))}
          rows={3}
          maxLength={REASON_MAX}
          placeholder="例）2回目の音声で not until と聞こえたので3番にした"
          aria-label="選んだ理由"
          className="mt-2 w-full p-3 rounded-lg border border-gray-200 bg-white text-sm leading-relaxed text-gray-800 focus:outline-none focus:border-amber-300"
        />
        <p className="text-xs text-gray-500">
          {text.length}/{REASON_MAX}文字 ・ 送った理由だけが「{room.className}」の先生に見えます
        </p>
        <div className="flex items-center justify-end gap-2">
          {sent && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="flex min-h-[44px] items-center gap-1 px-4 rounded-full text-xs font-bold border bg-gray-100 text-gray-500 border-gray-200 disabled:opacity-50"
            >
              取り消す
            </button>
          )}
          <button
            type="button"
            onClick={handleSend}
            disabled={busy || !text.trim()}
            className="flex min-h-[44px] items-center gap-1 px-4 rounded-full text-xs font-bold border transition-colors bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 disabled:opacity-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sent ? '送り直す' : '先生に送る'}
          </button>
        </div>
        {message && <p className="text-xs text-gray-600" role="status">{message}</p>}
      </div>
    </details>
  );
}

/** useSyncExternalStore 用：塾クラスの有無が変わったときだけ値が変わる文字列 */
function jukuVersion(uid: string, subject: string | null): string {
  const room = jukuClassForSubject(uid, subject);
  return room ? `${room.classId}:${room.teacherUid}` : '';
}
