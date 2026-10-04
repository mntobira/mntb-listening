/**
 * ===================================================================
 * BattleHistory — たいせん履歴
 * ===================================================================
 *
 * ★履歴を自分の下（battle_history/{uid}/items）に置く理由★
 * 部屋（battle_rooms）は試合が終わると消える／古くなる。
 * 部屋を残し続けると読み取り回数と保存量が増え続けるので、
 * 「自分から見た結果」だけを自分の領域に1件書く。
 * 相手からは読めないので、ルールも単純になる（自分の下だけ許可）。
 *
 * ★レートの増減をここでも出す理由★
 * リザルト画面は1回しか見られない（次の対戦で消える）。
 * 「昨日どれだけ上がったか」を後から確かめられるようにする。
 */

import { useEffect, useState } from 'react';
import { ArrowLeft, Minus, Swords, TrendingDown, TrendingUp } from 'lucide-react';
import { labelOfSubject } from '../../data/subjectLabels';
import { subjectTheme } from '../../data/subjectTheme';
import type { SubjectKey } from '../../data/allChapters';
import { fetchHistory } from '../data/battle';
import type { BattleHistoryItem } from '../data/battle';
import {
  AMBER,
  BattleButton,
  BattleLoading,
  BattleShell,
  BattleTitle,
  INK,
  INK_SUB,
  LINE,
  WRONG,
} from './BattleParts';

interface OutcomeConf {
  label: string;
  color: string;
}

/**
 * 勝敗の表示。
 *
 * ★引き分けを定数として別に置いている理由★
 * ここは元々
 *   OUTCOME_CONF[item.outcome] || OUTCOME_CONF.draw
 * と書いていたが、Record<string, …> の値は型の上では常に undefined を含むため、
 * ★フォールバック先の .draw 自体も「無いかもしれない」扱いになる★。
 * つまり保険を書いたつもりで、保険が効いている保証が無かった。
 * （実際に outcome に想定外の値が入ると conf.color の参照で画面が落ちる。）
 *
 * 引き分けを独立した定数にすれば、フォールバックは型として必ず存在する。
 */
const DRAW_CONF: OutcomeConf = { label: 'ひきわけ', color: '#2E86C1' };

/**
 * ★「かち」にゴールド（#F4D03F）を使わない★
 * ここは小さな札の中の 11px の文字なので、アイボリー地の上では
 * 金色の文字がほぼ読めない。既存の hint 色（琥珀）に置き換えている。
 */
const OUTCOME_CONF: Record<string, OutcomeConf | undefined> = {
  win: { label: 'かち', color: AMBER },
  lose: { label: 'まけ', color: INK_SUB },
  draw: DRAW_CONF,
};

function formatDate(value: BattleHistoryItem['playedAt']): string {
  const raw = value as { toDate?: () => Date } | null | undefined;
  if (!raw || typeof raw.toDate !== 'function') return '';
  const d = raw.toDate();
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
}

export function BattleHistory({ onBack, onRetryWrong, onStartAi }: { onBack: () => void; onRetryWrong?: (subject: string, ids: string[]) => void; onStartAi?: () => void }) {
  const [items, setItems] = useState<BattleHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchHistory(30)
      .then((list) => {
        if (alive) {
          setItems(list);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <BattleShell
      footer={
        <BattleButton variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
          もどる
        </BattleButton>
      }
    >
      <BattleTitle subtitle="たいせん履歴" />

      {loading ? (
        <BattleLoading message="履歴を読みこんでいます…" />
      ) : items.length === 0 ? (
        <div className="grid justify-items-center gap-3 py-10 text-center" data-history-empty>
          <span className="grid h-14 w-14 place-items-center rounded-full" style={{ background: '#fff4dc', color: '#b07a1e' }} aria-hidden="true">
            <Swords size={26} />
          </span>
          <p className="text-sm font-black" style={{ color: INK_SUB }}>まだ対戦の記録がありません</p>
          <p className="text-xs font-bold leading-relaxed" style={{ color: INK_SUB }}>
            フレンド・全国対戦の結果がここに残ります。
            <br />
            まずはAIと1戦して、腕だめししてみよう。
          </p>
          {onStartAi && (
            <BattleButton onClick={onStartAi} icon={<Swords size={18} />}>
              AIと対戦する
            </BattleButton>
          )}
        </div>
      ) : (
        <ul className="grid gap-1.5">
          {items.map((item) => {
            const conf = OUTCOME_CONF[item.outcome] ?? DRAW_CONF;
            const theme = subjectTheme(item.subject as SubjectKey);
            const delta = (item.ratingAfter || 0) - (item.ratingBefore || 0);
            const applied = item.ratingBefore > 0 || item.ratingAfter > 0;

            return (
              <li key={item.roomId} className="grid gap-1.5">
              <div
                className="flex items-center gap-2.5 rounded-2xl border-2 px-3 py-2.5"
                style={{
                  borderColor: `${conf.color}44`,
                  background: '#FFFFFF',
                }}
              >
                {/* 勝敗 */}
                <span
                  className="flex h-9 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                  style={{ background: `${conf.color}1F`, color: conf.color }}
                >
                  {conf.label}
                </span>

                {/* 教科と相手 */}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="shrink-0 rounded-full px-1.5 py-0.5 text-xs font-black"
                      style={{ background: `${theme.accent}2E`, color: theme.accent }}
                    >
                      {labelOfSubject(item.subject)}
                    </span>
                    <span className="truncate text-xs font-bold" style={{ color: INK }}>
                      vs {item.opponentNickname || '対戦相手'}
                    </span>
                  </span>
                  <span
                    className="block text-xs font-bold tabular-nums"
                    style={{ color: INK_SUB }}
                  >
                    {item.myScore} — {item.opponentScore}
                    {formatDate(item.playedAt) && (
                      <span className="ml-1.5" style={{ color: `${INK_SUB}AA` }}>
                        {formatDate(item.playedAt)}
                      </span>
                    )}
                  </span>
                </span>

                {/* レート増減 */}
                {applied ? (
                  <span
                    className="flex shrink-0 items-center gap-0.5 text-xs font-black tabular-nums"
                    style={{ color: delta > 0 ? AMBER : delta < 0 ? WRONG : INK_SUB }}
                  >
                    {delta > 0 ? (
                      <TrendingUp size={13} />
                    ) : delta < 0 ? (
                      <TrendingDown size={13} />
                    ) : (
                      <Minus size={13} />
                    )}
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                ) : (
                  <span
                    className="shrink-0 rounded px-1 py-0.5 text-xs font-bold"
                    style={{ background: '#F1EDE4', border: `1px solid ${LINE}`, color: INK_SUB }}
                  >
                    未反映
                  </span>
                )}
              </div>
              {onRetryWrong && (item.wrongIds?.length ?? 0) > 0 && (
                <button type="button" data-history-retry={item.roomId}
                  onClick={() => onRetryWrong(item.subject, item.wrongIds!)}
                  className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border-2 px-3 text-xs font-black"
                  style={{ borderColor: `${AMBER}66`, background: '#FFFBEF', color: AMBER }}>
                  <Swords size={14} aria-hidden />間違えた{item.wrongIds!.length}問だけ再対戦（AI）
                </button>
              )}
              </li>
            );
          })}
        </ul>
      )}
    </BattleShell>
  );
}
