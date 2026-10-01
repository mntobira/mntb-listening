/**
 * ===================================================================
 * Google アカウント連携のおすすめバナー
 * ===================================================================
 *
 * ゲスト利用中のユーザーに対して、アプリ全体で一貫した文言・見た目で
 * 「Google アカウント連携」を勧めるための共通部品。
 *
 * 設計方針
 *  - 押し売りにしない：閉じられる／学習を邪魔しない位置に置く
 *  - 「なぜ連携すべきか」を必ず具体的な利点で示す（抽象論では動かない）
 *  - 連携中・失敗時の状態をこの中で完結して表示する
 *  - アプリ全体の淡いピンク基調（#D9466E / #E8688E / #FBE0E9）に合わせる
 */

import React, { useCallback, useState } from 'react';
import { motion } from 'motion/react';
import { CloudUpload, Check, Loader2, AlertTriangle, X } from 'lucide-react';
import { signInWithGoogle, GOOGLE_LINK_BENEFITS } from '../utils/googleAuth';

/** Google の「G」マーク（公式配色）。画像に頼らず SVG で描く */
export function GoogleMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.6h11.9c-.2 2-1.5 5-4.4 7l6.7 5.2c3.9-3.6 6.9-8.9 6.9-15.8z" />
      <path fill="#34A853" d="M24 46c5.9 0 10.8-1.9 14.2-5.3l-6.7-5.2c-1.8 1.3-4.3 2.2-7.5 2.2-5.8 0-10.7-3.8-12.4-9.1l-7 5.4C8 41.1 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.6 28.6c-.5-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1l-7-5.4C3.6 17.8 2.9 20.8 2.9 24s.7 6.2 1.7 9l7-4.4z" />
      <path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6-6C34.7 4.6 29.9 2 24 2 15.4 2 8 6.9 4.6 15l7 5.4c1.7-5.3 6.6-9.6 12.4-9.6z" />
    </svg>
  );
}

interface GoogleLinkBannerProps {
  /** 表示バリエーション。'card' = 独立カード / 'inline' = 既存カードに差し込む細い帯 */
  variant?: 'card' | 'inline';
  /** 閉じるボタンを出すか（学習中の画面では邪魔なので閉じられるようにする） */
  dismissible?: boolean;
  /** 連携に成功したときの通知（呼び出し元でゲストフラグを解除するなど） */
  onLinked?: () => void;
  /** 追加クラス */
  className?: string;
}

export function GoogleLinkBanner({
  variant = 'card',
  dismissible = false,
  onLinked,
  className = '',
}: GoogleLinkBannerProps) {
  const [state, setState] = useState<'idle' | 'signing' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  const handleLink = useCallback(async () => {
    setState('signing');
    setError(null);
    const outcome = await signInWithGoogle();
    if (outcome.redirecting) return; // ページ遷移するのでこのまま待つ
    if (outcome.ok) {
      setState('done');
      onLinked?.();
      return;
    }
    setState('idle');
    setError(outcome.message || 'ログインに失敗しました。');
  }, [onLinked]);

  if (hidden || state === 'done') return null;

  /* ---------- inline（細い帯） ---------- */
  if (variant === 'inline') {
    return (
      <div className={`rounded-2xl border border-[#F4A9C4]/60 bg-white/85 px-3.5 py-2.5 ${className}`}>
        <div className="flex items-center gap-2.5">
          <GoogleMark size={18} />
          {/* ★文言に対戦を入れた理由★
              利用者の指示「オンラインをメインにするUIにしていかんと
              だめよね？」「対戦画面は他のところでしているので
              そこまでのところはすべて変えて」

              この帯は ★ホームでゲストが実際に見る唯一の案内★
              （Home.tsx で variant="inline" として order-4 に置いている）。
              なのに書いてあったのは「記録が端末を変えても残ります」だけで、
              ★対戦ができないことに触れていなかった★。

              対戦は Firestore のルール上、uid を持たない
              ゲストではどうやっても部屋に入れない。
              しかも前回の変更でホームの一番上が対戦のボタンになった。
              つまりこの帯のすぐ上に、押しても入れないボタンがある状態。
              ★同じ画面の中で矛盾している★ので、ここに書く。

              ★帯の高さは変えていない★
              この帯は1行に収まる細さが取り柄（学習を邪魔しない位置に
              置くという、このファイル冒頭の設計方針）。
              文を足すのではなく、既にある文の言葉を置き換えた。
              leading-snug の1〜2行のまま。 */}
          <p className="flex-1 min-w-0 text-xs font-modern leading-snug text-[#5D6D7E]">
            <b className="text-[#1B2631]">ゲストで利用中です。</b>
            連携すると<b className="text-[#2E86C1]">オンライン対戦</b>ができ、記録も端末を変えても残ります。
          </p>
          <button
            type="button"
            onClick={handleLink}
            disabled={state === 'signing'}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#E8688E] to-[#D9466E] px-3 py-1.5 text-xs font-bold text-white shadow-[0_8px_18px_-10px_rgba(217,70,110,0.9)] transition-colors hover:from-[#E0567F] hover:to-[#C93C61] disabled:opacity-50"
          >
            {state === 'signing' ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <CloudUpload size={13} aria-hidden="true" />}
            連携する
          </button>
          {dismissible && (
            <button
              type="button"
              onClick={() => setHidden(true)}
              aria-label="この案内を閉じる"
              className="shrink-0 rounded-lg p-1 text-[#B8C4CE] transition-colors hover:bg-[#FFF3F7] hover:text-[#D9466E]"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {/* 失敗したときに理由が見えないと利用者は詰まるので、帯の中に必ず表示する */}
        {error && (
          <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-[#E74C3C]/40 bg-[#FDEDEC] px-2.5 py-1.5" role="alert">
            <AlertTriangle size={13} className="mt-[1px] shrink-0 text-[#C0392B]" aria-hidden="true" />
            <p className="text-xs font-modern leading-relaxed text-[#C0392B]">{error}</p>
          </div>
        )}
      </div>
    );
  }

  /* ---------- card（独立カード） ---------- */
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative mx-auto mb-7 w-full max-w-4xl overflow-hidden rounded-[22px] border border-[#F4A9C4]/60 bg-white/92 px-5 py-4 shadow-[0_14px_34px_-20px_rgba(217,70,110,0.55)] backdrop-blur-sm ${className}`}
      aria-label="Google アカウント連携のおすすめ"
    >
      <span
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#E8688E] via-[#D9466E] to-[#E89AAF]"
        aria-hidden="true"
      />

      {dismissible && (
        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label="この案内を閉じる"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-[#B8C4CE] transition-colors hover:bg-[#FFF3F7] hover:text-[#D9466E]"
        >
          <X size={15} />
        </button>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <GoogleMark size={19} />
            <p className="text-[13px] font-bold text-[#1B2631]">
              Google アカウントと連携しませんか？
            </p>
          </div>
          {/* ★card 版にも対戦を入れる★
              こちらは科目選択画面（PC）とランキング画面で出る大きめの版。
              inline 版と同じ理由で、対戦ができないことを書く。
              下の利点リスト（GOOGLE_LINK_BENEFITS）の1行目も対戦なので、
              説明文と利点で話がつながる。 */}
          <p className="mb-2.5 text-xs font-modern leading-relaxed text-[#5D6D7E]">
            いまは<b className="text-[#D9466E]">ゲスト利用</b>のため、<b className="text-[#1B2631]">オンライン対戦が使えません</b>。
            学習記録もこの端末の中だけに保存され、ブラウザのデータを消すと消えてしまいます。
          </p>
          <ul className="space-y-1">
            {GOOGLE_LINK_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-1.5 text-xs font-modern leading-snug text-[#5D6D7E]">
                <Check size={13} className="mt-[1px] shrink-0 text-[#E8688E]" aria-hidden="true" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="shrink-0 sm:w-52">
          <button
            type="button"
            onClick={handleLink}
            disabled={state === 'signing'}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8688E] to-[#D9466E] px-4 py-3 text-[13px] font-bold text-white shadow-[0_12px_26px_-12px_rgba(217,70,110,0.9)] transition-colors hover:from-[#E0567F] hover:to-[#C93C61] disabled:opacity-50 disabled:shadow-none"
          >
            {state === 'signing'
              ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" />連携中…</>
              : <><CloudUpload size={16} aria-hidden="true" />いま連携する</>}
          </button>
          <p className="mt-1.5 text-center text-xs font-modern leading-snug text-[#8895A0]">
            連携は無料です。いまの学習記録はそのまま引き継がれます。
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#E74C3C]/40 bg-[#FDEDEC] px-3 py-2" role="alert">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#C0392B]" aria-hidden="true" />
          <p className="text-xs font-modern leading-relaxed text-[#C0392B]">{error}</p>
        </div>
      )}
    </motion.section>
  );
}
