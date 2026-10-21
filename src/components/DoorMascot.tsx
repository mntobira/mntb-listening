import { DEFAULT_SUBJECT } from '../data/subjects';
import React, { useState } from 'react';
import { auth } from '../firebase';
import { TIP_CATEGORIES, tipsForSubject, type MascotTip, type TipSubject } from '../data/mascotTips';
import { subjectTheme } from '../data/subjectTheme';
import { markTipSeen, pickTip, readLastTipId, readSeenTipIds, resetSeenTips } from '../utils/tipRotation';

// 添付されたとびら君キャラクター（9種）。public/mascots に配置。
const mascots = [
  { src: '/mascots/basic.webp', label: '基本のとびら君' },
  { src: '/mascots/walking.webp', label: '歩いているとびら君' },
  { src: '/mascots/studying.webp', label: '勉強しているとびら君' },
  { src: '/mascots/cheering.webp', label: '応援しているとびら君' },
  { src: '/mascots/good.webp', label: 'グッド！なとびら君' },
  { src: '/mascots/thinking.webp', label: '考えているとびら君' },
  { src: '/mascots/happy.webp', label: '喜んでいるとびら君' },
  { src: '/mascots/bowing.webp', label: 'おじぎしているとびら君' },
  { src: '/mascots/sleeping.webp', label: 'ねているとびら君' },
] as const;

export interface DoorMascotProps {
  className?: string;
  showSpeech?: boolean;
  size?: 'mini' | 'normal';
  /**
   * いま開いている科目。
   * 渡すとその科目の豆知識だけを出し、吹き出しの色もその科目の配色になる。
   * 省略時は化学基礎として扱う（既存の呼び出しを壊さないため）。
   */
  subject?: TipSubject;
  /**
   * 分野ラベル（🧭 解き方の作戦 など）を吹き出しに出すか。
   * 科目が3つに増えて「何の話か」が分かりにくくなったので出せるようにした。
   */
  showCategory?: boolean;
}

/** 現在のユーザー（未ログインはゲスト）を既読の保存先キーに使う */
const currentUid = (): string => auth.currentUser?.uid || 'guest';

/**
 * 既読の保存先を科目ごとに分ける。
 *
 * ★科目をまたいで既読を共有すると、化学基礎を読み切った人がリスニングを
 *   開いた瞬間に「全部読み終えた扱い」になってしまう★
 * 科目ごとに候補が違うので、記録も科目ごとに分けるのが素直。
 */
const tipStorageKey = (subject: TipSubject): string => `${currentUid()}:${subject}`;

/**
 * 1つ選んで「既読」として記録する。
 *
 * ★未読を優先するので、開き続けていれば必ず全部の豆知識に出会える★
 * （以前は毎回ただのランダムで、一度も出ないものが残っていた）
 *
 * この仕組みは画面には一切出さない「裏方」である。
 * 読了カウンターや「別の豆知識を見る」ボタンは廃止したため、
 * 見た目は従来どおり「とびら君がひとこと言うだけ」に近い。
 * それでも取りこぼしが出ないよう、選び方だけは賢いままにしておく。
 */
function selectTip(subject: TipSubject): MascotTip | null {
  const key = tipStorageKey(subject);
  const candidates = tipsForSubject(subject);
  const picked = pickTip(candidates, readSeenTipIds(key), readLastTipId(key));
  if (!picked) return null;
  markTipSeen(key, picked.tip.id);
  // ちょうど全部読み切ったら、次の巡のために既読をリセットする
  if (picked.justCompleted) resetSeenTips(key);
  return picked.tip;
}

export function DoorMascot({
  className = '',
  showSpeech = true,
  size = 'normal',
  subject = DEFAULT_SUBJECT,
  showCategory = false,
}: DoorMascotProps) {
  // マスコットの絵柄は表示ごとにランダム（従来どおり）
  const [mascot] = useState(() => mascots[Math.floor(Math.random() * mascots.length)]);
  // 吹き出しを出さない使い方（アイコン用途）では豆知識を選ばない
  const [tip] = useState(() => (showSpeech ? selectTip(subject) : null));
  // 吹き出しの色は科目ごとに変える（いまどの科目を開いているか色で分かるようにする）
  const theme = subjectTheme(subject);
  const category = tip ? TIP_CATEGORIES[tip.category] : null;

  return (
    <div className={`flex items-end gap-3 min-w-0 ${showSpeech ? 'w-full' : ''} ${className}`}>
      {/* マスコット画像：用途に応じて通常／ミニ表示を選べる */}
      {/* スマホでは通常サイズも一段小さくする（w-20 h-24 → w-14 h-16）。
          ホームを1画面に収めるうえで、この画像が最も背の高い要素だった。
          sm 以上（タブレット・PC）は従来サイズのままにする。 */}
      <div className={`relative shrink-0 flex items-end justify-center ${size === 'mini' ? 'w-11 h-12' : 'w-14 h-16 sm:w-24 sm:h-28'}`}>
        <img
          src={mascot.src}
          alt={mascot.label}
          draggable={false}
          className="max-w-full max-h-full object-contain drop-shadow-md select-none"
        />
      </div>
      {showSpeech && tip && (
        // 吹き出しは残り幅いっぱいに広がり（flex-1 + min-w-0）、横はみ出し・テキスト切れを防ぐ
        <div
          className={`relative ${theme.bubbleBgClass} border ${theme.bubbleBorderClass} rounded-2xl px-3 py-2 sm:px-4 sm:py-3 flex-1 min-w-0 mb-1`}
          style={{ boxShadow: theme.bubbleShadow }}
        >
          {/* 吹き出しの三角（左向き、マスコット側を指す） */}
          <div className={`absolute left-[-7px] top-7 w-4 h-4 ${theme.bubbleBgClass} border-l border-b ${theme.bubbleBorderClass} rotate-45`} />
          {/* 分野ラベルはスマホ（sm 未満）では出さない。
              ホームを 1 画面に収める際、このラベル行（19px＋余白）が
              セカンダリカードをナビの下へ押し出していた。
              豆知識の本文は残す（消すのは飾りの分類だけ）。sm 以上は従来どおり。 */}
          {showCategory && category && (
            <span
              className={`hidden sm:inline-flex items-center gap-1 mb-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${theme.chipBgClass} ${theme.chipTextClass}`}
            >
              <span aria-hidden>{category.emoji}</span>
              <span>{category.label}</span>
            </span>
          )}
          <p className="text-xs sm:text-xs leading-snug sm:leading-relaxed text-[#2C3E50] font-bold font-handwriting break-words">{tip.text}</p>
        </div>
      )}
    </div>
  );
}
