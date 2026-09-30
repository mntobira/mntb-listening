import React, { useMemo } from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import { REVIEW_INTERVALS_DAYS, type ReviewItem } from '../utils/reviewList';
import { retentionOf, averageRetentionPercent } from '../utils/reviewSubject';
import { pickAxisTicks } from '../utils/forgettingCurveAxis';
import { useIsMobile } from '../hooks/useMediaQuery';

/**
 * ForgettingCurveChart — 忘却曲線 × 復習リストの定着度を可視化するグラフ。
 *
 * 目的:
 *   - 各問題の「解答日時（createdAt / updatedAt）」を記録として活かし、
 *     エビングハウスの忘却曲線（理論値）と、ユーザー自身の復習アイテムの
 *     現在の定着度（box → retention%）を1つのグラフに重ねて表示する。
 *   - 「いつ・どの単元を復習すべきか」を視覚的に判断できるよう、
 *     復習期限（dueAt）が今日以前のアイテムは “復習推奨” としてハイライトする。
 *
 * 依存を増やさない方針で、外部チャートライブラリは使わず軽量な SVG で描画する。
 *
 * ■ 今回の改善（UI/UX）
 *   1) X軸ラベルの重なりを解消
 *      復習間隔は [0,1,3,7,14,30,60] と対数的なので、日数に比例する
 *      X座標では 0〜7日が左端に密集し、4つのラベルが重なっていた。
 *      文字幅を見積もって衝突するものだけを間引く（forgettingCurveAxis.ts）。
 *      スマホ幅ではフォントを小さくせず「間引き」で対応することで、
 *      読める文字サイズを保ったまま重なりだけを解消している。
 *   2) 凡例をコンパクト化
 *      4項目を折り返しで縦に積むと高さを食っていたため、
 *      アイコン＋短縮ラベルにして1〜2行に収める。
 *      正式名称は title 属性に残し、意味が失われないようにした。
 *   3) 科目タブと連動
 *      渡された items だけを描くので、呼び出し側が科目で絞り込めば
 *      グラフもその科目だけの状態を示す。見出しに科目名を出せるよう
 *      subjectLabel を受け取る。
 */

interface ForgettingCurveChartProps {
  items: ReviewItem[];
  now?: number;
  /**
   * 見出しに添える科目名（「化学基礎の定着度」のように出す）。
   * 「すべて」タブのときは undefined を渡す。
   */
  subjectLabel?: string;
  /** スマホ判定の上書き（スマホプレビュー枠・テスト用） */
  isMobileOverride?: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// エビングハウスの忘却曲線（理論値）: R = e^(-t/S) を単純化して描く。
// 復習しない場合、時間とともに記憶保持率が急速に下がる様子を表す。
function ebbinghaus(days: number): number {
  // S（記憶の強さ）を約1.8日相当にして、1日で約58%、7日で約2割…の感触に合わせる
  return Math.exp(-days / 1.8);
}

export const ForgettingCurveChart: React.FC<ForgettingCurveChartProps> = ({
  items,
  now = Date.now(),
  subjectLabel,
  isMobileOverride,
}) => {
  const isMobile = useIsMobile(isMobileOverride);

  // 復習アイテムを「初回解答からの経過日数」と「現在の定着度」に写像する。
  const points = useMemo(() => {
    return items.map((it) => {
      const elapsedDays = Math.max(0, (now - (it.createdAt ?? now)) / DAY_MS);
      // box が進むほど定着度が上がる（0〜1）。復習によって忘却曲線を押し上げるイメージ。
      const retention = retentionOf(it);
      const due = it.dueAt <= now;
      return { elapsedDays, retention, due, item: it };
    });
  }, [items, now]);

  // グラフの描画領域（viewBox 座標）
  // X軸ラベルの行を確保するため padB を少し広げている。
  const W = 320;
  const H = 150;
  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // X軸は 0〜60日（最終復習間隔）で正規化
  const maxDays = REVIEW_INTERVALS_DAYS[REVIEW_INTERVALS_DAYS.length - 1] || 60;
  const xForDays = (d: number) => padL + (Math.min(d, maxDays) / maxDays) * plotW;
  const yForRet = (r: number) => padT + (1 - Math.max(0, Math.min(1, r))) * plotH;

  // 忘却曲線（理論値）のパスを生成
  const curvePath = useMemo(() => {
    const N = 40;
    let d = '';
    for (let i = 0; i <= N; i++) {
      const day = (i / N) * maxDays;
      const x = xForDays(day);
      const y = yForRet(ebbinghaus(day));
      d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    return d.trim();
  }, [maxDays]);

  // 復習の“階段”（間隔反復で定着度が段階的に上がる）を理想線として描く
  const stairPath = useMemo(() => {
    const steps = REVIEW_INTERVALS_DAYS.length;
    let d = '';
    for (let i = 0; i < steps; i++) {
      const x = xForDays(REVIEW_INTERVALS_DAYS[i]);
      const y = yForRet(i / (steps - 1));
      d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    return d.trim();
  }, [maxDays]);

  /**
   * X軸ラベル。
   *
   * 描画自体は常に fontSize=12（viewBox 座標）で行う。
   * ただし SVG は幅いっぱいに縮小表示されるため、
   * スマホの狭い画面では 8 単位の文字が「実寸では相対的に大きい」ことになる。
   * そこで間引きの判定だけは太めの見積り（11）で行い、
   * 文字サイズを小さくせずに重なりを解消する。
   */
  const axisFontSize = 12;
  const tickFontSizeForLayout = isMobile ? 15 : axisFontSize;
  const ticks = useMemo(
    () => pickAxisTicks(REVIEW_INTERVALS_DAYS, xForDays, tickFontSizeForLayout, 4),
    [maxDays, tickFontSizeForLayout]
  );

  const dueCount = points.filter((p) => p.due).length;
  const avgRetention = averageRetentionPercent(items);

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#EAF2FB] flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-[#2C6187]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#2C3E50] font-handwriting leading-tight truncate">
              {subjectLabel ? `${subjectLabel}の忘却曲線と定着度` : '忘却曲線と定着度'}
            </h3>
            <p className="text-xs text-[#5a6573]">
              解答日時をもとに、復習で記憶がどれだけ定着したかを可視化します
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg sm:text-xl font-bold text-[#2C6187] tabular-nums leading-none">
            {avgRetention}<span className="text-xs ml-0.5">%</span>
          </div>
          <div className="text-xs text-[#5a6573]">平均定着度</div>
        </div>
      </div>

      {points.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400">
          {subjectLabel
            ? `${subjectLabel}の復習アイテムはまだありません。`
            : '復習アイテムがまだありません。'}
          <br />問題を解くと、ここに定着度の推移が表示されます。
        </div>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto"
            role="img"
            aria-label="忘却曲線と定着度グラフ"
          >
            {/* Y軸グリッド（0/50/100%） */}
            {[0, 0.5, 1].map((r) => (
              <g key={r}>
                <line
                  x1={padL}
                  y1={yForRet(r)}
                  x2={W - padR}
                  y2={yForRet(r)}
                  stroke="#EEE"
                  strokeWidth={1}
                />
                <text x={padL - 4} y={yForRet(r) + 3} textAnchor="end" fontSize="12" fill="#5a6573">
                  {Math.round(r * 100)}
                </text>
              </g>
            ))}

            {/*
              X軸ラベル（日数）。
              重なるものは pickAxisTicks が間引いているので、
              ここでは選ばれた目盛りだけを描く。
            */}
            {ticks.map((t) => (
              <text
                key={t.days}
                x={t.x}
                y={H - padB + 14}
                textAnchor="middle"
                fontSize={axisFontSize}
                fill="#5a6573"
              >
                {t.label}
              </text>
            ))}

            {/* 復習しない場合の忘却曲線（赤・破線） */}
            <path d={curvePath} fill="none" stroke="#E8A0A0" strokeWidth={1.6} strokeDasharray="4 3" />
            {/* 間隔反復による理想的な定着（青・実線） */}
            <path d={stairPath} fill="none" stroke="#7FB3D5" strokeWidth={2} strokeLinejoin="round" />

            {/* ユーザーの各アイテム（点） */}
            {points.map((p, i) => (
              <circle
                key={p.item.key + i}
                cx={xForDays(p.elapsedDays)}
                cy={yForRet(p.retention)}
                r={p.due ? 4.2 : 3}
                fill={p.due ? '#E8688E' : '#5DADE2'}
                stroke="#fff"
                strokeWidth={1}
              >
                <title>
                  {(p.item.chapterTitle || '') + ' ' + (p.item.subLabel || '')}｜定着度{Math.round(p.retention * 100)}%
                  {p.due ? '（復習推奨）' : ''}
                </title>
              </circle>
            ))}
          </svg>

          {/*
            凡例（コンパクト版）。
            以前は「復習なしの忘却曲線」等のフルネームを4つ並べ、
            スマホでは2〜3行に折り返してグラフ本体を圧迫していた。
            アイコン＋短縮ラベルにし、正式名称は title に持たせる。
          */}
          <ul className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#3e4c5b]">
            <li className="flex items-center gap-1" title="復習しなかった場合の忘却曲線（理論値）">
              <span className="inline-block w-3.5 h-0 border-t-2 border-dashed border-[#E8A0A0] shrink-0" aria-hidden="true" />
              <span>復習なし</span>
            </li>
            <li className="flex items-center gap-1" title="間隔反復（復習）による理想的な定着">
              <span className="inline-block w-3.5 h-0 border-t-2 border-[#7FB3D5] shrink-0" aria-hidden="true" />
              <span>復習あり</span>
            </li>
            <li className="flex items-center gap-1" title="いま復習すべき問題（復習推奨）">
              <span className="inline-block w-2 h-2 rounded-full bg-[#E8688E] shrink-0" aria-hidden="true" />
              <span>要復習</span>
            </li>
            <li className="flex items-center gap-1" title="あなたが解いた問題の現在の定着度">
              <span className="inline-block w-2 h-2 rounded-full bg-[#5DADE2] shrink-0" aria-hidden="true" />
              <span>あなた</span>
            </li>
          </ul>

          {dueCount > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-[#b3261e] bg-[#FDF0F3] rounded-lg px-3 py-2">
              <Calendar size={14} className="shrink-0" />
              <span>
                いま復習すべき問題が <b className="font-bold">{dueCount}</b> 件あります。忘却曲線が下がりきる前に復習しましょう。
              </span>
            </div>
          )}
        </>
      )}
    </section>
  );
};
