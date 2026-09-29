import type { ComponentProps } from 'react';
import { Home } from './Home';

/**
 * リスニング専用版のホーム（2026-09-29 作り直し）。
 *
 * 統合版のホーム（Home.tsx）の構造をそのまま使う：
 *   ヘッダー → マナコイン/XP → とびら君のステージ（ガチャ・ショップ・きせかえ・称号）
 *   → ［演習する］［対戦する］［復習ノート］ → 下の帯 → ラッシュ・ミッション・学習状況・使い方
 * 1画面に収まる配置は統合版で調整済みなので、ここでは組み替えない。
 *
 * 違いは下の帯だけ（書き出し時に Home.tsx を編集）：
 *   ［英語リスニング・科目］［英文法・英単語を固める］ → どちらも専用の科目選択画面
 *   （ListeningSubjectSelection：リスニング＋英文法の演習／英単語カード／聞き取りの文法／対戦で固める）
 * 科目のプルダウンは出さない（onPickSubject を渡さない）。
 */
type Props = ComponentProps<typeof Home> & { onListeningStart?: (chapter: string, index: number) => void };

export function ListeningHome({ onListeningStart: _unused, onPickSubject: _pick, ...props }: Props) {
  return <Home {...props} />;
}
