/**
 * ===================================================================
 * 「運営からの返信」受信ボックス（利用者側）
 * ===================================================================
 * ご意見・ご要望を送ってくれた人に、運営の返事をアプリ内で届ける。
 *
 * ■ 表示の方針
 *   - ログイン済みで、自分宛の返信が1件以上あるときだけ入口を出す。
 *     （返信が無い人には何も表示しない＝画面を汚さない）
 *   - 未読があるときはバッジで知らせる。
 *   - 開くと一覧が出て、開いた返信は既読になる。
 *
 * ■ データの流れ
 *   運営が FeedbackAdminPanel から feedback_replies に書き込む
 *   → ここが自分宛（toUid == 自分）だけを読む（Firestore ルールで保証）
 */

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MailOpen, Loader2, MessageSquareHeart, ChevronDown } from 'lucide-react';
import { auth } from '../firebase';
import {
  fetchMyFeedbackReplies,
  markReplyRead,
  type MyFeedbackReply,
} from '../utils/feedbackReply';
import { logRejection } from '../utils/reportError';

export function FeedbackReplyInbox() {
  const [replies, setReplies] = useState<MyFeedbackReply[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      setReplies(await fetchMyFeedbackReplies());
    } catch {
      // 読めない（オフライン等）ときは黙って非表示のままにする。
      // ホーム画面の主目的は学習開始であり、ここでエラーを出して
      // 学習の妨げになるのは本末転倒のため。
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unread = replies.filter((r) => !r.read).length;

  // 返信が1件も無ければ入口ごと出さない
  if (replies.length === 0) return null;

  const handleExpand = (reply: MyFeedbackReply) => {
    const next = expandedId === reply.docId ? null : reply.docId;
    setExpandedId(next);
    if (next && !reply.read) {
      // 開いた時点で既読化（失敗しても次回また試みるだけなので握りつぶす）
      markReplyRead(reply.docId).catch(logRejection('feedback.markReplyRead'));
      setReplies((prev) => prev.map((p) => (p.docId === reply.docId ? { ...p, read: true } : p)));
    }
  };

  return (
    <>
      {/* 入口ボタン（ホームのカード列に馴染む横長カード） */}
      <button
        onClick={() => setOpen(true)}
        aria-label="運営からの返信を見る"
        className="flex items-center gap-4 px-5 py-4 lg:py-3 rounded-[18px] border border-[#A9CCE3]/50 bg-white/90 backdrop-blur-sm hover:bg-[#F2F8FC] hover:border-[#4A7FA0]/50 active:scale-[0.99] transition-all shadow-[0_8px_22px_-14px_rgba(74,127,160,0.4)] text-left group w-full"
      >
        <div className="relative w-11 h-11 lg:w-10 lg:h-10 rounded-2xl bg-[#EAF3F9] flex items-center justify-center shrink-0">
          <MailOpen className="w-5 h-5 text-[#4A7FA0]" aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D9466E] text-white text-xs font-bold flex items-center justify-center">
              {unread}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-handwriting font-bold text-[#1B2631] text-base md:text-lg">運営からの返信</div>
          <div className="text-xs md:text-xs text-[#8895A0] font-modern mt-0.5">
            {unread > 0 ? `未読が${unread}件あります` : 'いただいたご意見へのお返事'}
          </div>
        </div>
      </button>

      {/* 一覧モーダル */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <div className="relative w-full max-w-lg max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <MessageSquareHeart size={18} className="text-[#E8688E]" />
                <h2 className="font-bold text-sm flex-1">運営からの返信</h2>
                <button onClick={() => setOpen(false)} aria-label="閉じる" className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-gray-400 gap-2 text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    読み込み中…
                  </div>
                ) : (
                  replies.map((reply) => {
                    const expanded = expandedId === reply.docId;
                    return (
                      <div key={reply.docId} className={`rounded-xl border ${reply.read ? 'border-gray-200 bg-white' : 'border-[#E8688E]/40 bg-[#FFF7FA]'}`}>
                        <button
                          onClick={() => handleExpand(reply)}
                          className="w-full flex items-start gap-2 p-3 text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {!reply.read && <span className="w-2 h-2 rounded-full bg-[#D9466E] shrink-0" />}
                              <span className="text-xs text-gray-400">
                                {reply.createdAtIso ? reply.createdAtIso.slice(0, 10) : ''} ・ {reply.adminName}
                              </span>
                            </div>
                            {reply.feedbackSummary && (
                              <p className="text-xs text-gray-400 mt-1 truncate">
                                ご意見「{reply.feedbackSummary}」への返信
                              </p>
                            )}
                            {!expanded && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{reply.message}</p>
                            )}
                          </div>
                          <ChevronDown size={16} className={`text-gray-400 shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                        {expanded && (
                          <div className="px-3 pb-3">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap bg-white rounded-lg border border-gray-100 p-3">
                              {reply.message}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
