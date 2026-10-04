/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 問題解答後の「+○○」スコア加算アニメーション
 * - 浮き上がる数字アニメーション
 * - タイミングスケジュール: 基礎点 → 時間ボーナス → コンボ → 特殊ボーナス
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingScoreItem {
  id: string;
  label: string;
  value: number;
  color: string;
  delay: number;
}

interface FloatingScoreAnimationProps {
  breakdown: {
    basePoints: number;
    timeBonus: number;
    comboBonus: number;
    perfectBonus: number;
    descriptiveBonus: number;
    overtimePenalty: number;
  };
  totalScore: number;
  isVisible: boolean;
}

export function FloatingScoreAnimation({
  breakdown,
  totalScore,
  isVisible,
}: FloatingScoreAnimationProps) {
  const [items, setItems] = useState<FloatingScoreItem[]>([]);

  useEffect(() => {
    if (!isVisible) {
      setItems([]);
      return;
    }

    const newItems: FloatingScoreItem[] = [];
    let delayOffset = 0;

    if (breakdown.basePoints > 0) {
      newItems.push({ id: 'base', label: '\u57fa\u790e\u70b9', value: breakdown.basePoints, color: 'bg-rose-500', delay: delayOffset });
      delayOffset += 0.28;
    }
    if (breakdown.timeBonus > 0) {
      newItems.push({ id: 'time', label: '\u6642\u9593\u30dc\u30fc\u30ca\u30b9', value: breakdown.timeBonus, color: 'bg-blue-500', delay: delayOffset });
      delayOffset += 0.28;
    }
    if (breakdown.comboBonus > 0) {
      newItems.push({ id: 'combo', label: '\u30b3\u30f3\u30dc\u30dc\u30fc\u30ca\u30b9', value: breakdown.comboBonus, color: 'bg-orange-500', delay: delayOffset });
      delayOffset += 0.28;
    }
    if (breakdown.perfectBonus > 0) {
      newItems.push({ id: 'perfect', label: '\u30d1\u30fc\u30d5\u30a7\u30af\u30c8', value: breakdown.perfectBonus, color: 'bg-amber-500', delay: delayOffset });
      delayOffset += 0.28;
    }
    if (breakdown.descriptiveBonus > 0) {
      newItems.push({ id: 'descriptive', label: '\u8a18\u8ff0\u5f0f', value: breakdown.descriptiveBonus, color: 'bg-violet-500', delay: delayOffset });
      delayOffset += 0.28;
    }
    if (breakdown.overtimePenalty > 0) {
      newItems.push({ id: 'penalty', label: '\u30da\u30ca\u30eb\u30c6\u30a3', value: -breakdown.overtimePenalty, color: 'bg-gray-500', delay: delayOffset });
      delayOffset += 0.28;
    }
    // ★0点のとき（不正解）は「合計 +0」を出さない★ 解説のスクリプトに被るだけで意味がないため（2026-09-30）
    if (newItems.length > 0 || totalScore !== 0) {
      newItems.push({ id: 'total', label: '\u5408\u8a08', value: totalScore, color: 'bg-emerald-600', delay: delayOffset + 0.18 });
    }

    setItems(newItems);
  }, [isVisible, breakdown, totalScore]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex flex-col items-end justify-center pr-6 gap-1.5">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 60, rotate: 3 }}
              animate={{ opacity: 1, x: 0, rotate: item.id === 'total' ? -1 : Math.random() > 0.5 ? 1.5 : -1.5 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{
                duration: 0.5,
                delay: item.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div
                className={`
                  ${item.color} text-white
                  font-handwriting font-bold
                  px-4 py-1.5 rounded-full shadow-lg
                  whitespace-nowrap
                  ${item.id === 'total' ? 'text-lg md:text-xl' : 'text-sm md:text-base'}
                `}
                style={{ letterSpacing: '0.04em' }}
              >
                {item.id === 'total'
                  ? `${item.label}: +${item.value}`
                  : `${item.label}: +${item.value}`}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
