import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Sparkles } from 'lucide-react';
import { NOTICE_KIND_META } from '../data/updateNotices';
import {
  formatNoticeDateTime,
  loadReadIds,
  markAllNoticesRead,
  relativeNoticeLabel,
  sortedNotices,
  refreshRemoteNotices,
} from '../utils/updateNotices';

/**
 * UpdateNoticeModal ― お知らせ（更新履歴）
 * ------------------------------------------------------------------
 * ■ 何を見せるか
 *   「いつ・何が変わったか」を新しい順に並べる。
 *   1件あたり ①種別バッジ ②日時 ③1行見出し ④箇条書き の4要素だけに絞り、
 *   スクロールしながら流し読みできる密度にしている。
 *
 * ■ 未読の扱い
 *   開いた瞬間に「全部既読」にするのではなく、
 *   **開いた時点の未読IDを覚えてから**既読化する。
 *   こうすると、いま開いた画面の中では未読だったものに
 *   「NEW」が付いたままになり、どれが新しいのか分かる。
 *   （開いた途端にNEWが消えると、何が新しかったのか読めない）
 *
 * ■ 閉じ方
 *   背景タップ・×ボタン・Esc の3つを用意する。
 *   スマホでは画面下端に「閉じる」も置き、片手で閉じられるようにする。
 */

export interface UpdateNoticeModalProps {
  onClose: () => void;
}

export function UpdateNoticeModal({ onClose }: UpdateNoticeModalProps) {
  const [notices, setNotices] = useState(() => sortedNotices());
  // 運営のお知らせ（Firestore）を重ねる。届いた分も開いている間に既読にする。
  useEffect(() => { let alive = true; void refreshRemoteNotices().then(list => { if (alive) { setNotices(list); markAllNoticesRead(); } }); return () => { alive = false; }; }, []);

  // 開いた時点の未読IDを固定して保持する（この画面の中では NEW を残すため）。
  //   既読の集合は開いた瞬間のものを1度だけ取る（あとから届いた Firestore 分も NEW と判定できるように）。
  const [readAtOpen] = useState(() => loadReadIds());
  const unreadAtOpen = useMemo(
    () => new Set(notices.filter((n) => !readAtOpen.has(n.id)).map((n) => n.id)),
    [notices, readAtOpen],
  );

  // 開いたら既読にする（バッジを消す）。
  useEffect(() => {
    markAllNoticesRead();
  }, []);

  // Esc で閉じる（PC操作での取りこぼしを防ぐ）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="お知らせ（更新履歴）"
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[80vh] sm:rounded-3xl"
        >
          {/* ── 見出し ── */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-[#F7FAFC] px-5 py-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#A9CCE3] text-white shadow-sm">
                <Bell size={19} />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-bold leading-tight text-[#2C3E50]">お知らせ</h2>
                <p className="text-xs font-bold leading-snug text-gray-500">
                  アプリの更新内容と日時をまとめています
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="お知らせを閉じる"
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── 一覧（新しい順） ── */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {notices.length === 0 ? (
              <p className="py-10 text-center text-sm font-bold text-gray-400">
                お知らせはまだありません。
              </p>
            ) : (
              <ol className="space-y-3">
                {notices.map((notice) => {
                  const meta = NOTICE_KIND_META[notice.kind];
                  const isNew = unreadAtOpen.has(notice.id);
                  return (
                    <li
                      key={notice.id}
                      className={`rounded-2xl border-2 p-4 shadow-sm transition-colors ${
                        isNew
                          ? 'border-[#A9CCE3]/70 bg-[#F4F9FC]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-lg border px-2 py-0.5 text-xs font-bold ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                        {isNew && (
                          <span className="flex items-center gap-1 rounded-lg border border-[#E8A87C] bg-[#E8A87C] px-2 py-0.5 text-xs font-bold text-white">
                            <Sparkles size={10} />
                            NEW
                          </span>
                        )}
                        {/* 日時：相対表記（今日/きのう）と絶対日時を両方見せる。
                            相対だけでは記録として残らず、絶対だけでは勢いが伝わらない。 */}
                        <span className="text-xs font-bold text-gray-500">
                          {relativeNoticeLabel(notice)}・{formatNoticeDateTime(notice)}
                        </span>
                      </div>

                      <h3 className="mb-1.5 text-[14px] font-bold leading-snug text-[#2C3E50]">
                        {notice.title}
                      </h3>

                      <ul className="space-y-1">
                        {notice.items.map((item, i) => (
                          <li
                            key={i}
                            className="flex gap-1.5 text-[12.5px] leading-relaxed text-gray-600"
                          >
                            <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#A9CCE3]" />
                            <span className="min-w-0">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {/* ── 閉じる（スマホで片手で閉じられる位置） ── */}
          <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={onClose}
              className="w-full cursor-pointer rounded-xl bg-[#2C3E50] py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#1B2631]"
            >
              閉じる
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
