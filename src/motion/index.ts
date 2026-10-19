/**
 * モーション層の入口（2026-10-16）。見た目のルールは ./motion.css の冒頭を参照。
 *   KineticText … 見出しを1文字ずつ立ち上げる（キネティック・タイポ）
 *   ScoreRing   … 割合を輪で見せる（インフォグラフィック）
 *   installRipple … 押した瞬間の波紋（main.tsx で1回だけ）
 *   数字のカウントアップは components/ui/CountUp（fromZero で 0 から数える）
 */
import './motion.css';
export { KineticText, splitKinetic } from './KineticText';
export { ScoreRing } from './ScoreRing';
export { installRipple } from './MoRipple';
