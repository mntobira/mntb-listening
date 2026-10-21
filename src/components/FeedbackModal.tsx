/**
 * ===================================================================
 * フィードバック入力モーダル
 * ===================================================================
 * タイトル画面・各結果画面から呼び出される共通の意見投稿フォーム。
 *
 * 設計方針
 *  - 「ひとこと書いて送るだけ」で完了する軽さを最優先（星は任意）
 *  - 送信先（Firestore / スプレッドシート / メール）は utils/feedback.ts が
 *    吸収するので、この画面は「どこに届くか」を案内するだけに留める
 *  - 通信に失敗しても捨てずに、再送キュー退避＋メール送信リンクを提示する
 *  - アプリ全体の淡いピンク基調（#D9466E / #E8688E / #FBE0E9）に合わせる
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { asErrorLike } from '../utils/errorLike';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Star, CheckCircle2, AlertTriangle, Mail, MessageSquareHeart, Loader2 } from 'lucide-react';
import {
  submitFeedback,
  validateFeedback,
  describeFeedbackSinks,
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_SCREEN_LABELS,
  FEEDBACK_MESSAGE_MAX,
  type FeedbackCategory,
  type FeedbackScreen,
  type FeedbackResult,
} from '../utils/feedback';

interface FeedbackModalProps {
  /** 呼び出し元の画面 */
  screen: FeedbackScreen;
  /** 単元名やスコアなど、画面固有の付帯情報 */
  context?: Record<string, unknown>;
  /** 見出し下に出す補助文（省略時は画面名から自動生成） */
  description?: string;
  /** 種類の初期選択（省略時は画面から自動推定） */
  category?: FeedbackCategory;
  /** 本文の初期値（「化学の公開希望」など、用途が決まっている入口用） */
  initialMessage?: string;
  /** 閉じる */
  onClose: () => void;
}

const CATEGORY_ORDER: FeedbackCategory[] = ['praise', 'problem', 'bug', 'request', 'other'];

/** 画面ごとに「最初から選ばれていると自然な」種類を決める */
function defaultCategory(screen: FeedbackScreen): FeedbackCategory {
  if (screen === 'chapter_result' || screen === 'mock_exam_result') return 'problem';
  return 'request';
}

export function FeedbackModal({
  screen,
  context,
  description,
  category: initialCategory,
  initialMessage,
  onClose,
}: FeedbackModalProps) {
  const [category, setCategory] = useState<FeedbackCategory>(() => initialCategory || defaultCategory(screen));
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState(initialMessage || '');
  const [contactEmail, setContactEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const sinks = useMemo(() => describeFeedbackSinks(), []);
  const remaining = FEEDBACK_MESSAGE_MAX - message.length;

  // Esc で閉じる（送信中は閉じない）
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !sending) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, sending]);

  // 開いたらすぐ書き始められるようにフォーカスする
  useEffect(() => {
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, []);

  // モーダル表示中は背後のページをスクロールさせない。
  // （背後が動くと、モーダル内をスクロールしているつもりで裏側が動いてしまい
  //   「送信ボタンまでたどり着けない」体験になる）
  useEffect(() => {
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => { body.style.overflow = previous; };
  }, []);

  const handleSubmit = useCallback(async () => {
    const validation = validateFeedback({ screen, category, rating, message, contactEmail });
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors([]);
    setSending(true);
    try {
      const submitted = await submitFeedback({ screen, category, rating, message, contactEmail, context });
      setResult(submitted);
    } catch (error) {
      setErrors([String(asErrorLike(error)?.message || '送信に失敗しました。時間をおいてお試しください。')]);
    } finally {
      setSending(false);
    }
  }, [screen, category, rating, message, contactEmail, context]);

  const headerNote = description || `${FEEDBACK_SCREEN_LABELS[screen]}についてのご意見をお聞かせください`;

  /* ===================================================================
   * レイアウト方針（「送信ボタンまでスクロールできない」不具合の対策）
   * ===================================================================
   *  1. createPortal で <body> 直下に描画する。
   *     呼び出し元（タイトル画面のカード等）は motion のアニメーションで
   *     transform が掛かることがあり、transform 付き祖先があると
   *     position:fixed の基準がその祖先になってしまう。結果、モーダルが
   *     祖先の高さに閉じ込められて下端が画面外に切れ、送信ボタンへ
   *     到達できなくなる。ポータル化でこれを根本から断つ。
   *  2. パネルは「ヘッダー（固定）／本文（スクロール）／フッター（固定）」の
   *     3段 flex 構成にする。送信ボタンはスクロール領域の外＝常時表示。
   *  3. 高さは 100dvh 基準にし、iOS のホームバー用に safe-area を確保する。
   * =================================================================== */
  const modal = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-[#1B2631]/45 backdrop-blur-sm px-0 sm:px-4 py-0 sm:py-6 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
        role="dialog"
        aria-modal="true"
        aria-label="フィードバックを送る"
        onClick={() => { if (!sending) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          onClick={(event: React.MouseEvent) => event.stopPropagation()}
          className="w-full sm:max-w-lg flex flex-col max-h-[calc(100dvh-env(safe-area-inset-top,0px))] sm:max-h-[min(88dvh,720px)] overflow-hidden bg-[#FDFBF7] rounded-t-[26px] sm:rounded-[26px] border border-[#F4A9C4]/50 shadow-[0_24px_60px_-20px_rgba(217,70,110,0.5)] font-handwriting"
        >
          {/* ヘッダー（固定） */}
          <div className="shrink-0 flex items-start gap-3 px-5 pt-5 pb-3 bg-gradient-to-b from-[#FFF1F5] to-[#FDFBF7] border-b border-[#F4A9C4]/35 rounded-t-[26px]">
            <div className="w-10 h-10 rounded-2xl bg-[#FBE0E9] text-[#D9466E] flex items-center justify-center shrink-0">
              <MessageSquareHeart size={20} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-[#1B2631] leading-tight">ご意見・ご感想をお寄せください</h2>
              <p className="text-xs text-[#5D6D7E] font-modern mt-1 leading-snug">{headerNote}</p>
            </div>
            <button
              onClick={onClose}
              disabled={sending}
              aria-label="閉じる"
              className="p-2 -mt-1 -mr-1 rounded-xl text-[#8895A0] hover:text-[#D9466E] hover:bg-white transition-colors disabled:opacity-40 shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {result ? (
            /* ============ 送信完了 ============ */
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {result.ok ? (
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#E8F8EE] text-[#27AE60] flex items-center justify-center mb-3">
                    <CheckCircle2 size={30} aria-hidden="true" />
                  </div>
                  <p className="text-base font-bold text-[#1B2631]">送信しました。ありがとうございます！</p>
                  <p className="text-xs text-[#5D6D7E] font-modern mt-2 leading-relaxed">
                    いただいたご意見は、問題文・解説・機能の改善に活用させていただきます。
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-start gap-3 bg-[#FFF4E5] border border-[#FF9F43]/60 rounded-2xl p-4">
                    <AlertTriangle size={20} className="text-[#E67E22] shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="text-xs text-[#7E5109] font-modern leading-relaxed min-w-0">
                      <p className="font-bold text-sm text-[#B9770E] mb-1">送信できませんでした</p>
                      入力内容は<b>端末に保存済み</b>です。次回アプリを開いたときに自動で再送します。
                      すぐに届けたい場合は、下のボタンからメールでお送りください。

                      {/* 何が起きたのかを具体的に開示する。
                          「原因不明のまま何度も押させる」体験を避け、
                          運営側の設定不備であることも隠さず伝える。 */}
                      {result.failed.length > 0 && (
                        <ul className="mt-2 pt-2 border-t border-[#FF9F43]/40 space-y-1">
                          {result.failed.map((item) => (
                            <li key={item.sink} className="break-words">
                              <span className="font-bold">
                                {item.sink === 'firestore' ? '管理データベース' : 'スプレッドシート'}：
                              </span>
                              {item.reason}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <a
                    href={result.mailtoUrl}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#2C3E50] text-white text-sm font-bold hover:bg-[#1B2631] transition-colors"
                  >
                    <Mail size={16} aria-hidden="true" />
                    メールで送る
                  </a>
                </div>
              )}
              <button
                onClick={onClose}
                className="mt-4 w-full py-3 rounded-2xl border border-[#F4A9C4]/60 bg-white text-sm font-bold text-[#5D6D7E] hover:bg-[#FFF3F7] transition-colors"
              >
                閉じる
              </button>
            </div>
          ) : (
            /* ============ 入力フォーム ============ */
            <>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
              {/* 満足度（必須）
                  ★はスプレッドシート側で平均を取るための数値。
                  空欄が混ざると平均が崩れるので入力を必須にし、
                  同じ星を再タップしても 0 に戻らない（解除できない）。 */}
              <div>
                <label className="block text-xs font-bold text-[#8895A0] font-modern tracking-wider mb-2">
                  満足度
                  <span className="ml-1.5 inline-block px-1.5 py-[1px] rounded-md bg-[#FBE0E9] text-[#D9466E] text-xs align-middle">必須</span>
                </label>
                <div className="flex items-center gap-1.5" role="radiogroup" aria-label="満足度">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={rating === value}
                      aria-label={`${value}点`}
                      onClick={() => setRating(value)}
                      className="p-1.5 rounded-xl hover:bg-[#FBE0E9]/60 transition-colors"
                    >
                      <Star
                        size={26}
                        className={value <= rating ? 'text-[#E8688E] fill-[#E8688E]' : 'text-[#D7DDE3]'}
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-1 text-xs font-bold text-[#D9466E] font-modern tabular-nums">{rating}</span>
                  )}
                </div>
                {rating === 0 && (
                  <p className="mt-1.5 text-xs text-[#8895A0] font-modern">星をタップして満足度を選んでください。</p>
                )}
              </div>

              {/* 種類 */}
              <div>
                <label className="block text-xs font-bold text-[#8895A0] font-modern tracking-wider mb-2">
                  ご意見の種類
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_ORDER.map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={category === value}
                      onClick={() => setCategory(value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold font-modern border transition-all ${
                        category === value
                          ? 'bg-[#D9466E] text-white border-[#D9466E] shadow-[0_6px_16px_-8px_rgba(217,70,110,0.8)]'
                          : 'bg-white text-[#5D6D7E] border-[#E4E8EC] hover:border-[#E8688E]/60 hover:text-[#D9466E]'
                      }`}
                    >
                      {FEEDBACK_CATEGORY_LABELS[value]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 本文 */}
              <div>
                <label htmlFor="feedback-message" className="block text-xs font-bold text-[#8895A0] font-modern tracking-wider mb-2">
                  内容<span className="text-[#D9466E] ml-1">必須</span>
                </label>
                <textarea
                  id="feedback-message"
                  ref={textareaRef}
                  value={message}
                  onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(event.target.value.slice(0, FEEDBACK_MESSAGE_MAX))}
                  rows={5}
                  placeholder={
                    screen === 'title'
                      ? '例）連続学習のカードが好きです。復習リストに単元名も出してほしいです。'
                      : '例）第3章の結晶の問題で、解説の図がもう少し大きいと読みやすいです。'
                  }
                  className="w-full rounded-2xl border border-[#E4E8EC] bg-white px-3.5 py-3 text-sm text-[#1B2631] font-modern leading-relaxed placeholder:text-[#B8C4CE] focus:outline-none focus:border-[#E8688E] focus:ring-2 focus:ring-[#FBE0E9] resize-y"
                />
                <div className="flex justify-end mt-1">
                  <span className={`text-xs font-modern tabular-nums ${remaining < 100 ? 'text-[#D9466E] font-bold' : 'text-[#B8C4CE]'}`}>
                    残り {remaining} 文字
                  </span>
                </div>
              </div>

              {/* 返信用メール（任意） */}
              <div>
                <label htmlFor="feedback-contact" className="block text-xs font-bold text-[#8895A0] font-modern tracking-wider mb-2">
                  返信用メールアドレス（任意）
                </label>
                <input
                  id="feedback-contact"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={contactEmail}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setContactEmail(event.target.value)}
                  placeholder="返信が必要な場合のみご記入ください"
                  className="w-full rounded-2xl border border-[#E4E8EC] bg-white px-3.5 py-2.5 text-sm text-[#1B2631] font-modern placeholder:text-[#B8C4CE] focus:outline-none focus:border-[#E8688E] focus:ring-2 focus:ring-[#FBE0E9]"
                />
              </div>

              {/* エラー表示 */}
              {errors.length > 0 && (
                <div className="flex items-start gap-2 bg-[#FDEDEC] border border-[#E74C3C]/40 rounded-2xl px-3.5 py-3">
                  <AlertTriangle size={16} className="text-[#C0392B] shrink-0 mt-0.5" aria-hidden="true" />
                  <ul className="text-xs text-[#C0392B] font-modern leading-relaxed space-y-0.5">
                    {errors.map((error) => <li key={error}>{error}</li>)}
                  </ul>
                </div>
              )}

              {/* 送信先の案内（収集先が増えても自動で追記される） */}
              <p className="text-xs text-[#8895A0] font-modern leading-relaxed bg-white/70 border border-[#E4E8EC] rounded-xl px-3 py-2">
                送信先：{sinks.join(' ／ ')}<br />
                お名前・メールアドレスは未入力でも送信できます。学習の記録や成績には影響しません。
              </p>

            </div>

            {/* 送信ボタン（スクロール領域の外＝常に画面内に残る） */}
            <div className="shrink-0 border-t border-[#F4A9C4]/35 bg-[#FDFBF7]/95 backdrop-blur-sm px-5 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
              <div className="grid grid-cols-[1fr_2fr] gap-2">
                <button
                  onClick={onClose}
                  disabled={sending}
                  className="py-3 rounded-2xl border border-[#E4E8EC] bg-white text-sm font-bold text-[#8895A0] hover:bg-[#F7F9FA] transition-colors disabled:opacity-40"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={sending || message.trim().length === 0 || rating === 0}
                  className="py-3 rounded-2xl bg-gradient-to-r from-[#E8688E] to-[#D9466E] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_10px_24px_-12px_rgba(217,70,110,0.9)] hover:from-[#E0567F] hover:to-[#C93C61] transition-colors disabled:opacity-40 disabled:shadow-none"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
                  {sending ? '送信中…' : '送信する'}
                </button>
              </div>
            </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  // SSR / テスト環境で document が無い場合はそのまま返す
  if (typeof document === 'undefined') return modal;
  return createPortal(modal, document.body);
}
