/**
 * ===================================================================
 * BattleAiSelect — AI の強さをえらぶ
 * ===================================================================
 *
 * ★4段階を「同じ形のカード」で縦に並べる★
 * 差は「正解率」「速さ」の2つの値で見せる（BattleHome の対比表と同じ原理）。
 * 見た目の派手さより「どれを選べば自分に合うか」が一目で分かることを優先する。
 *
 * ★おすすめを付ける★
 * 初めて来た人が迷わないように、ふつう（normal）に「おすすめ」を付ける。
 * 本番の受験生の正解率（6〜7割）に近く、勝ったり負けたりする相手だから。
 */

import { ArrowLeft, Bot, Gauge, Target } from 'lucide-react';
import type { CSSProperties } from 'react';
import { subjectTheme } from '../../data/subjectTheme';
import type { SubjectKey } from '../../data/allChapters';
import { AI_LEVELS, aiProfileOf, type AiLevel } from '../core/aiOpponent';
import { BattleButton, BattleShell, BattleTitle, GOLD, INK, INK_SUB, LINE } from './BattleParts';

const SPEED_LABEL: Record<AiLevel, string> = {
  easy: 'ゆっくり',
  normal: 'ふつう',
  hard: 'はやい',
  expert: 'とても はやい',
};

export function BattleAiSelect({
  subject,
  onPick,
  onBack,
}: {
  subject: string;
  onPick: (level: AiLevel) => void;
  onBack: () => void;
}) {
  const theme = subjectTheme(subject as SubjectKey);

  return (
    <BattleShell
      footer={
        <BattleButton variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
          もどる
        </BattleButton>
      }
    >
      <BattleTitle subtitle={`${theme.label} ／ AIと対戦 ／ 強さをえらぶ`} />

      <p className="mb-3 text-xs font-bold leading-relaxed" style={{ color: INK_SUB }}>
        待ち時間なしですぐ始まります。出題・制限時間・点数の計算は全国対戦と同じ。
        <br />
        <span style={{ color: INK }}>レートは動きません</span>（練習用です）。
      </p>

      <div className="grid gap-2.5">
        {AI_LEVELS.map((level, i) => {
          const p = aiProfileOf(level);
          const recommended = level === 'normal';
          return (
            <button
              key={level}
              type="button"
              id={`battle-ai-${level}`}
              onClick={() => onPick(level)}
              className="battle-card-in relative flex w-full items-center gap-3 rounded-3xl border-2 p-3.5 text-left transition active:translate-y-[2px] active:scale-[0.99]"
              style={
                {
                  borderColor: `${p.color}77`,
                  background: '#FFFFFF',
                  boxShadow: `0 5px 0 ${p.color}22`,
                  '--card-delay': `${0.05 * i}s`,
                } as CSSProperties
              }
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: `${p.color}1F`, color: p.color }}
              >
                <Bot size={26} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-handwriting text-lg font-black" style={{ color: INK }}>
                    {p.name}
                  </span>
                  {recommended && (
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-xs font-black"
                      style={{ background: GOLD, color: INK }}
                    >
                      おすすめ
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs font-bold" style={{ color: INK_SUB }}>
                  {p.tagline}
                </span>
                <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs font-black">
                  <span className="flex items-center gap-1" style={{ color: p.color }}>
                    <Target size={12} />
                    正解率 {Math.round(p.accuracy * 100)}%
                  </span>
                  <span className="flex items-center gap-1" style={{ color: INK_SUB }}>
                    <Gauge size={12} />
                    {SPEED_LABEL[level]}
                  </span>
                  <span
                    className="rounded-full px-1.5 tabular-nums"
                    style={{ background: '#FAF8F3', border: `1px solid ${LINE}`, color: INK_SUB }}
                  >
                    レート目安 {p.displayRating}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </BattleShell>
  );
}
