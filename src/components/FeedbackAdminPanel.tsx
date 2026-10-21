/**
 * ===================================================================
 * フィードバック管理画面（運営専用）
 * ===================================================================
 * 「ご意見・ご要望」をくれた人への返答フォーム。
 *
 * ■ できること
 *   - 届いたフィードバックの一覧（新しい順）・対応状況での絞り込み
 *   - ログイン投函者（uid あり）へのアプリ内返信
 *       → 相手のホーム画面の「運営からの返信」に届く
 *   - 連絡先メールがある投稿へのメール返信（mailto: リンク）
 *   - 対応状況（未対応／対応中／返信済み／完了）の更新
 *
 * ■ 入口
 *   設定（ProfileModal）内の「フィードバック管理」ボタン。
 *   運営メール（FEEDBACK_ADMIN_EMAILS）でログインしたときだけ表示する。
 *   万一 URL 操作などで一般ユーザーが開いても、Firestore ルールが
 *   読み取りを拒否するため一覧は表示されない（権限エラー案内を出す）。
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Send,
  Mail,
  Loader2,
  AlertTriangle,
  MessageSquareHeart,
  CheckCircle2,
  Star,
  User,
  ShieldAlert,
} from 'lucide-react';
import { auth } from '../firebase';
import { UsageMeterPanel } from './UsageMeterPanel';
import {
  fetchFeedbackList,
  sendFeedbackReply,
  updateFeedbackStatus,
  buildReplyMailto,
  isFeedbackAdmin,
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_REPLY_MAX,
  type AdminFeedbackItem,
  type FeedbackStatus,
} from '../utils/feedbackReply';
import { FEEDBACK_CATEGORY_LABELS, FEEDBACK_SCREEN_LABELS } from '../utils/feedback';
import { asErrorLike } from '../utils/errorLike';

interface FeedbackAdminPanelProps {
  onBack: () => void;
}

const STATUS_ORDER: (FeedbackStatus | 'all')[] = ['all', 'new', 'in_progress', 'replied', 'closed'];

const STATUS_BADGE: Record<FeedbackStatus, string> = {
  new: 'bg-[#FDEDEC] text-[#C0392B] border-[#E74C3C]/30',
  in_progress: 'bg-[#FEF9E7] text-[#B7950B] border-[#F1C40F]/40',
  replied: 'bg-[#EAF9F6] text-[#148F77] border-[#5BC0BE]/40',
  closed: 'bg-gray-100 text-gray-500 border-gray-200',
};

function labelOf(map: Record<string, string>, key: string): string {
  return map[key] || key;
}

export function FeedbackAdminPanel({ onBack }: FeedbackAdminPanelProps) {
  const [items, setItems] = useState<AdminFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FeedbackStatus | 'all'>('all');
  /** 返信フォームを開いている投稿の docId */
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sentId, setSentId] = useState<string | null>(null);

  const admin = isFeedbackAdmin(auth.currentUser);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchFeedbackList();
      setItems(list);
    } catch (rawError) {
      const e = asErrorLike(rawError);
      const code = String(e?.code || '');
      setError(
        code.includes('permission-denied')
          ? 'フィードバックの閲覧権限がありません。運営アカウントでログインしているか、Firestore ルールが最新かを確認してください。'
          : String(e?.message || rawError || '読み込みに失敗しました'),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((item) => item.status === filter)),
    [items, filter],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: items.length, new: 0, in_progress: 0, replied: 0, closed: 0 };
    items.forEach((item) => { map[item.status] = (map[item.status] || 0) + 1; });
    return map;
  }, [items]);

  const handleStatus = async (item: AdminFeedbackItem, status: FeedbackStatus) => {
    try {
      await updateFeedbackStatus(item.docId, status);
      setItems((prev) => prev.map((p) => (p.docId === item.docId ? { ...p, status } : p)));
    } catch (e) {
      setError(String(asErrorLike(e)?.message || e || '対応状況の更新に失敗しました'));
    }
  };

  const handleSendReply = async (item: AdminFeedbackItem) => {
    setSending(true);
    setError(null);
    try {
      await sendFeedbackReply(item, replyText);
      setItems((prev) => prev.map((p) => (p.docId === item.docId ? { ...p, status: 'replied' } : p)));
      setSentId(item.docId);
      setReplyText('');
      setReplyingId(null);
      window.setTimeout(() => setSentId(null), 4000);
    } catch (e) {
      setError(String(asErrorLike(e)?.message || e || '返信の送信に失敗しました'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-[#1B2631]">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* ヘッダー */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="設定に戻る"
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#1B2631] shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg flex items-center gap-2">
              <MessageSquareHeart className="text-[#E8688E]" size={20} />
              フィードバック管理
            </h1>
            <p className="text-xs text-gray-400">届いたご意見への返信・対応状況の管理（運営専用）</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            再読み込み
          </button>
        </div>

        {/* 運営アカウントでない場合の案内（ルール側でも読めないが、理由を明示する） */}
        {!admin && (
          <div role="alert" className="flex items-start gap-2 rounded-xl bg-[#FDEDEC] border border-[#E74C3C]/40 p-3 text-xs text-[#C0392B]">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>この画面は運営アカウント専用です。運営メールアドレスの Google アカウントでログインしてください。</span>
          </div>
        )}

        {/* Firebase 使用量（運営専用） */}
        {admin && <UsageMeterPanel />}

        {/* 絞り込みタブ */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {STATUS_ORDER.map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${
                filter === key
                  ? 'bg-[#2C3E50] text-white border-[#2C3E50]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {key === 'all' ? 'すべて' : FEEDBACK_STATUS_LABELS[key]}
              <span className="ml-1 opacity-70">{counts[key] ?? 0}</span>
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl bg-[#FDEDEC] border border-[#E74C3C]/40 p-3 text-xs text-[#C0392B]">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2 text-sm">
            <Loader2 size={18} className="animate-spin" />
            読み込み中…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            {filter === 'all' ? 'フィードバックはまだありません' : `「${filter === 'all' ? '' : FEEDBACK_STATUS_LABELS[filter as FeedbackStatus]}」の投稿はありません`}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const mailto = buildReplyMailto(item);
              const canInApp = !!item.uid;
              const isReplying = replyingId === item.docId;
              return (
                <div key={item.docId} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
                  {/* メタ情報 */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full border font-bold ${STATUS_BADGE[item.status]}`}>
                      {FEEDBACK_STATUS_LABELS[item.status]}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">
                      {labelOf(FEEDBACK_SCREEN_LABELS as Record<string, string>, item.screen)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FBE0E9] text-[#D9466E] font-bold">
                      {labelOf(FEEDBACK_CATEGORY_LABELS as Record<string, string>, item.category)}
                    </span>
                    {item.rating > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold">
                        <Star size={12} fill="currentColor" />{item.rating}/5
                      </span>
                    )}
                    <span className="text-gray-400 ml-auto">
                      {item.createdAtIso ? item.createdAtIso.slice(0, 16).replace('T', ' ') : ''}
                    </span>
                  </div>

                  {/* 本文 */}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.message}</p>

                  {/* 送信者情報 */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <User size={13} />
                    <span>{item.displayName || (item.uid ? 'ログインユーザー' : 'ゲスト')}</span>
                    {item.contactEmail && <span className="text-gray-400">連絡先: {item.contactEmail}</span>}
                    {!item.uid && !item.contactEmail && (
                      <span className="text-gray-400">（匿名投函のため返信手段なし）</span>
                    )}
                  </div>

                  {/* 操作列 */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
                    {canInApp && (
                      <button
                        onClick={() => {
                          setReplyingId(isReplying ? null : item.docId);
                          setReplyText('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8688E] text-white text-xs font-bold hover:bg-[#D9466E] transition-colors"
                      >
                        <Send size={13} />
                        {isReplying ? '返信をやめる' : 'アプリ内で返信'}
                      </button>
                    )}
                    {mailto && (
                      <a
                        href={mailto}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#F4A9C4]/70 text-[#D9466E] text-xs font-bold hover:bg-[#FFF3F7] transition-colors"
                        onClick={() => handleStatus(item, 'replied')}
                      >
                        <Mail size={13} />
                        メールで返信
                      </a>
                    )}
                    {/* 対応状況の変更 */}
                    <select
                      value={item.status}
                      onChange={(e) => handleStatus(item, e.target.value as FeedbackStatus)}
                      aria-label="対応状況を変更"
                      className="ml-auto text-xs font-bold border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 text-gray-600 cursor-pointer"
                    >
                      {(Object.keys(FEEDBACK_STATUS_LABELS) as FeedbackStatus[]).map((s) => (
                        <option key={s} value={s}>{FEEDBACK_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>

                  {sentId === item.docId && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#148F77]">
                      <CheckCircle2 size={14} />
                      返信を送りました。相手のホーム画面「運営からの返信」に届きます。
                    </div>
                  )}

                  {/* 返信フォーム */}
                  {isReplying && (
                    <div className="space-y-2 rounded-xl bg-[#FFF7FA] border border-[#F4A9C4]/40 p-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        maxLength={FEEDBACK_REPLY_MAX}
                        rows={4}
                        placeholder="返信を入力…（相手のアプリ内に届きます）"
                        className="w-full rounded-lg border border-[#F4A9C4]/50 bg-white p-2.5 text-sm leading-relaxed focus:outline-none focus:border-[#E8688E]"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{replyText.length}/{FEEDBACK_REPLY_MAX}</span>
                        <button
                          onClick={() => handleSendReply(item)}
                          disabled={sending || !replyText.trim()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D9466E] text-white text-xs font-bold disabled:opacity-40"
                        >
                          {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                          {sending ? '送信中…' : '返信を送る'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
