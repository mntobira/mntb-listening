import { useEffect } from 'react';
import { logRejection } from '../utils/reportError';

/**
 * 画面が変わったときの共通処理（C-01: App.tsx から分離。中身は同じ）。
 *
 * 1. 画面遷移時に常に最上部へスクロール（前画面のスクロール位置を引き継がない）
 *
 * 2. ★「先読み」＝次に行く画面を、まだ表示していないうちに裏で読み始める★
 *   単元選択・演習・解説の3画面は遅延読み込みにした。遅延読み込みは「その画面に入った瞬間に読み始める」ので、
 *   何もしないと通信が遅い端末で★画面に入った直後に何も出ない時間★ができる（元のアプリには無かった見え方）。
 *   そこで「次に行く可能性が高い」段階で裏側で読み込みを始めておく。
 *   ユーザーがモードを選んでいる数秒間や単元を選んでいる数秒間が、そのまま読み込み時間になる。
 *
 *   ・起動時（ホーム）には先読みしない：起動と同時に問題データを取りに行くことになり、遅延読み込みの意味が消える
 *   ・「必ず間に合う」保証ではない。ただし入った瞬間から読むよりは確実に早く、起動時に全部持ってくるよりは確実に軽い
 *   ・失敗しても実害が無い（本番でその画面に入ったときに改めて読み込みが走る）ので、記録だけしてエラー表示は出さない
 */
export function useScreenPrefetch(appState: string): void {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [appState]);

  useEffect(() => {
    // モード選択にいる ＝ 次は単元選択の可能性が高い
    if (appState === 'mode_selection') {
      import('../components/ChapterSelection').catch(logRejection('chunk.prefetch.ChapterSelection'));
    }
    // 単元選択にいる ＝ 次は演習画面の可能性が高い
    if (appState === 'chapters') {
      import('../components/QuizScreens').catch(logRejection('chunk.prefetch.QuizScreens'));
    }
  }, [appState]);
}
