/**
 * ===================================================================
 * 対戦モード: 画面の共通部品
 * ===================================================================
 *
 * ■ ここに置くもの
 * 複数の対戦画面（入口・待機・対戦・結果）で使い回す小さな部品だけ。
 * 画面ごとの組み立ては各画面ファイルが持つ。
 *
 * -------------------------------------------------------------------
 * ■ 見た目の方針（★2026-08 に濃紺からアイボリーへ作り直した★）
 * -------------------------------------------------------------------
 * 以前の実装は BattleShell が濃紺の radial-gradient を直接持ち、
 * 全部品が text-white 系だった。
 * 「対戦モードはゲームらしく暗い方が映える」という発想だったが、
 * 実際に使った人から
 *   「オンライン対戦のUIが黒っぽくなっており、普段のUIとは乖離している」
 * という指摘を受けた。
 *
 * ★対戦モードは「別アプリ」ではなく「同じノートの中の1ページ」である。★
 * 教科を選び、問題を解き、解説を読む——という体験はふだんの学習と同じで、
 * 変わるのは「相手がいる」ことだけ。
 * 地色まで変えてしまうと、変わっていない部分まで別物に見えてしまう。
 *
 * そこで、色は src/index.css の @theme トークンだけを使う。
 *   --color-surface  #FDFBF7（アイボリー：カードの地）
 *   --color-bg       #F4F1EA（紙：画面の地）
 *   --color-navy-ink #2C3E50（文字）
 *   --color-accent   #D9A0A0（ダスティピンク：罫線・補助）
 *   #F4D03F（ゴールド：主役の強調）
 * 罫線は既存の .notebook-paper、見出しは font-handwriting（Yomogi）。
 * ＝ ModeSelection・ChapterSelection と同じ材料しか使っていない。
 */

import type { ReactNode } from 'react';
import { Crown, Loader2, Swords, Timer, Trophy, UserRound } from 'lucide-react';

import { maskNickname } from '../../utils/nicknamePrivacy';
import { ratingTitle } from '../data/battleRanking';
import { safeAvatarUrl } from '../../features/safety/avatarUrl';
import { displaySafeNickname } from '../../features/safety/nicknameFilter';

/**
 * 対戦画面で使う色。
 *
 * ★ここに定義を集める理由★
 * 各画面ファイルが `#FDFBF7` のような生の値を書き始めると、
 * 「既存トークンと1桁違う色」が混ざっても誰も気づけない。
 * 対戦の画面はこの4つ＋subjectTheme だけで塗る。
 */
export const GOLD = '#F4D03F';
/**
 * ★ゴールドの「文字用」代替色（既存の --color-hint と同じ琥珀）★
 *
 * ここが今回いちばん間を取った判断。
 * アイボリー地（#FDFBF7）の上に #F4D03F を文字や細線で置くと、
 * 輝度が近すぎて読めない（コントラスト比 1.5 前後しか出ない）。
 * かといってゴールドを捨てると対戦モードの華やかさが消える。
 *
 * → ★ゴールドは「面」にだけ使い、文字と細線はこの琥珀を使う★
 *   という規則にした。既存アプリの --color-hint と同じ値なので、
 *   アプリ全体で使う色の数を増やしたことにはならない。
 */
export const AMBER = '#B7791F';
/** 文字色（既存の --color-navy-ink と同じ） */
export const INK = '#2C3E50';
/** 補助の文字色（既存の --color-ink-sub と同じ） */
export const INK_SUB = '#5D6D7E';
/** カードの地（既存の --color-surface と同じ） */
export const SURFACE = '#FDFBF7';
/** 画面の地（既存の --color-bg と同じ） */
export const PAPER = '#F4F1EA';
/** 罫線・枠（既存の --color-line と同じ） */
export const LINE = '#E5E7EB';
/** 不正解・警告（既存の --color-wrong と同じ） */
export const WRONG = '#C0392B';

/**
 * ★NAVY は互換のために残している★
 * ゴールド地の上に置く文字色として使われている箇所があり、
 * その用途では今も正しい（金の上に濃紺は既存アプリと同じ組み合わせ）。
 */
export const NAVY = INK;

// ============================================================
// 残り時間バー
// ============================================================

/**
 * 残り時間のバー。
 *
 * ★数字だけでなくバーも出す理由★
 * 制限時間が問題ごとに違う（8〜30秒）ので、
 * 「7」という数字だけでは急ぐべきか判断できない。
 * バーの残量なら一瞬で分かる。
 *
 * ★色を段階で変える理由★
 * 残り3秒を切ったら赤くする。音を出さない設計なので
 * （対戦は電車内でも遊ばれる）、色だけが焦りを伝える手段になる。
 *
 * ★ライト地で金色をそのまま使わない★
 * アイボリー地の上に #F4D03F を細いバーで置くと、輝度が近すぎて
 * 残量の境目が読めない。通常時は既存の hint 色（#B7791F 系の琥珀）を
 * 使い、バーの溝も白ではなく紙より少し濃い色にしている。
 */
export function TimeBar({
  remainMs,
  limitSec,
}: {
  remainMs: number;
  limitSec: number;
}) {
  const total = Math.max(1, limitSec * 1000);
  const ratio = Math.max(0, Math.min(1, remainMs / total));
  const seconds = Math.ceil(remainMs / 1000);

  const color = seconds <= 3 ? WRONG : seconds <= 6 ? '#E67E22' : AMBER;

  return (
    <section id="battle-time-bar" className="w-full" aria-label="残り時間">
      <div className="mb-1 flex items-center justify-between text-xs font-bold">
        <span className="flex items-center gap-1" style={{ color: INK_SUB }}>
          <Timer size={13} />
          のこり
        </span>
        <span style={{ color }} className="tabular-nums text-base">
          {seconds}
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full"
        style={{ background: '#E8E2D6' }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-200 ease-linear"
          style={{ width: `${ratio * 100}%`, background: color }}
        />
      </div>
    </section>
  );
}

// ============================================================
// 対戦相手の表示
// ============================================================

/**
 * プレイヤーの札（名前・アイコン・レート）。
 *
 * ★相手の名前をマスクする理由★
 * 全国ランダムマッチでは、知らない相手に本名が見えてしまう。
 * 既存の全国ランキングと同じ規則（先頭1文字＋＊）でマスクする。
 * ★フレンド対戦ではマスクしない★（合言葉を教え合った相手なので）。
 */
export function PlayerBadge({
  nickname,
  photoURL,
  rating,
  isMe,
  mask,
  answered,
  score,
  align = 'left',
  compact = false,
}: {
  nickname: string;
  photoURL?: string;
  rating: number;
  isMe?: boolean;
  mask?: boolean;
  answered?: boolean;
  score?: number;
  align?: 'left' | 'right';
  compact?: boolean;
}) {
  const shown = mask && !isMe ? maskNickname(displaySafeNickname(nickname)) : isMe ? nickname : displaySafeNickname(nickname);
  const title = ratingTitle(rating);
  const right = align === 'right';

  if (compact) return (
    <div className={`flex min-h-[32px] min-w-0 flex-1 items-center gap-2 ${right ? 'flex-row-reverse text-right' : ''}`}>
      <span className="min-w-0 flex-1 truncate text-xs font-bold" style={{ color: INK }}>{isMe ? 'あなた' : shown}</span>
      {answered && <span className="shrink-0 text-xs font-bold" style={{ color: '#1E7D46' }}>解答済み</span>}
      <strong className="shrink-0 text-lg tabular-nums" style={{ color: INK }} aria-label={`${isMe ? 'あなた' : shown}の得点 ${score ?? 0}`}>{score ?? 0}</strong>
    </div>
  );

  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2 ${right ? 'flex-row-reverse text-right' : ''}`}
    >
      <div className="relative shrink-0">
        {safeAvatarUrl(photoURL) ? (
          <img
            src={safeAvatarUrl(photoURL)}
            referrerPolicy="no-referrer"
            alt=""
            className="h-9 w-9 rounded-full border-2 object-cover"
            style={{ borderColor: isMe ? GOLD : LINE }}
          />
        ) : (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full border-2"
            style={{ borderColor: isMe ? GOLD : LINE, background: PAPER }}
          >
            <UserRound size={16} style={{ color: INK_SUB }} />
          </div>
        )}
        {answered && (
          // 「相手が答えた」ことだけ伝える。★何を答えたかは出さない★
          // 見えてしまうと、それを見て答えを合わせられる。
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2"
            style={{ background: '#1E7D46', borderColor: SURFACE }}
            aria-label="解答済み"
          />
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-bold" style={{ color: INK }}>
          {shown}
          {isMe && (
            <span className="ml-1 text-xs" style={{ color: INK_SUB }}>
              じぶん
            </span>
          )}
        </p>
        <p className="flex items-center gap-1 text-xs font-bold" style={{ color: title.color }}>
          <span className={`flex items-center gap-1 ${right ? 'flex-row-reverse' : ''}`}>
            <Crown size={10} />
            {title.label} {rating}
          </span>
        </p>
      </div>

      {typeof score === 'number' && (
        <p
          className="shrink-0 tabular-nums text-xl font-black"
          style={{ color: isMe ? AMBER : INK }}
        >
          {score}
        </p>
      )}
    </div>
  );
}

// ============================================================
// 見出し・枠
// ============================================================

/**
 * 対戦画面の外枠。全画面で共通にする。
 *
 * ★ふだんの画面と同じ「紙の上のノート」構造にしている★
 *   外側 = --color-bg（紙 #F4F1EA）＋ fabric-texture の微細なノイズ
 *   内側 = .notebook-paper（アイボリー＋横罫線＋ピンクの左罫）
 * ModeSelection と同じ材料なので、対戦に入っても
 * 「同じノートの別のページを開いた」ように見える。
 */
export function BattleShell({
  children,
  footer,
  className = '',
}: {
  children: ReactNode;
  footer?: ReactNode;
  /** Screen-specific styles; live matches retain the default shell. */
  className?: string;
}) {
  return (
    <div
      id="battle-shell"
      className={`fabric-texture flex min-h-[100dvh] flex-col ${className}`}
      style={{ background: PAPER }}
    >
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-3 pb-4 pt-3 sm:px-4 sm:pt-4">
        <div className="notebook-paper flex flex-1 flex-col rounded-2xl px-3.5 py-4 sm:px-5 sm:py-5">
          {children}
        </div>
      </main>
      {footer && (
        <footer className="mx-auto w-full max-w-xl px-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-4">
          {footer}
        </footer>
      )}
    </div>
  );
}

/**
 * 対戦モードの見出し。
 * 既存の見出しと同じ font-handwriting（Yomogi）＋濃紺。
 * 金はアイコンと下線だけに使う（ライト地では文字色に使うと読みにくい）。
 */
export function BattleTitle({ subtitle }: { subtitle?: string }) {
  return (
    <header id="battle-title" className="mb-4 text-center">
      <h1
        className="inline-flex items-center gap-2 font-handwriting text-2xl font-black"
        style={{ color: INK }}
      >
        <Swords size={22} style={{ color: AMBER }} />
        対戦モード
      </h1>
      <div
        className="mx-auto mt-1 h-1 w-24 rounded-full"
        style={{ background: `${GOLD}CC` }}
        aria-hidden
      />
      {subtitle && (
        <p className="mt-2 text-xs font-bold" style={{ color: INK_SUB }}>
          {subtitle}
        </p>
      )}
    </header>
  );
}

/** 読み込み中 */
export function BattleLoading({ message }: { message: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
      <Loader2 size={28} className="animate-spin" style={{ color: AMBER }} />
      <p className="text-sm font-bold" style={{ color: INK_SUB }}>
        {message}
      </p>
    </div>
  );
}

/** エラー表示（対戦を止めない範囲の案内） */
export function BattleNotice({
  message,
  tone = 'warn',
}: {
  message: string;
  tone?: 'warn' | 'info';
}) {
  const color = tone === 'warn' ? WRONG : AMBER;
  return (
    <p
      className="rounded-xl border px-3 py-2 text-center text-xs font-bold"
      style={{ borderColor: `${color}55`, background: `${color}14`, color }}
      role="status"
    >
      {message}
    </p>
  );
}

/**
 * 大きなボタン（対戦の主動線）。
 *
 * ★primary を金地・濃紺文字にしている★
 * 既存アプリの「決定」系ボタンと同じ組み合わせ。
 * ghost は白地＋グレー枠（既存の「もどる」ボタンと同じ見え方）。
 */
export function BattleButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  icon?: ReactNode;
}) {
  const styles =
    variant === 'primary'
      ? {
          background: GOLD,
          color: INK,
          borderColor: '#E5B93C',
          boxShadow: '0 3px 0 #D9A72E',
        }
      : variant === 'danger'
        ? { background: '#FFFFFF', color: WRONG, borderColor: `${WRONG}66` }
        : { background: '#FFFFFF', color: INK, borderColor: LINE };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3.5 text-base font-black transition active:translate-y-[2px] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0"
      style={styles}
    >
      {icon}
      {children}
    </button>
  );
}

/** 勝敗の帯 */
export function OutcomeBanner({ outcome }: { outcome: 'win' | 'lose' | 'draw' }) {
  const conf = {
    win: { label: 'かち！', color: AMBER, bg: `${GOLD}2E`, icon: <Trophy size={28} /> },
    lose: { label: 'まけ…', color: '#5D6D7E', bg: '#5D6D7E14', icon: <Swords size={28} /> },
    draw: { label: 'ひきわけ', color: '#2E86C1', bg: '#2E86C114', icon: <Swords size={28} /> },
  }[outcome];

  return (
    <div
      className="mb-4 flex flex-col items-center gap-1 rounded-3xl border-2 py-6"
      style={{ borderColor: `${conf.color}55`, background: conf.bg }}
    >
      <span style={{ color: conf.color }}>{conf.icon}</span>
      <p className="font-handwriting text-3xl font-black" style={{ color: conf.color }}>
        {conf.label}
      </p>
    </div>
  );
}
