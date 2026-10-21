import { useEffect, useRef, useState } from 'react';
import { setDialogHandlers } from '../utils/dialog';

/**
 * アプリ内のトースト（2026-10-19）。
 *
 * utils/dialog.ts の notify（「保存しました」「保存に失敗しました」などのお知らせ）を、
 * ブラウザ標準の alert から画面下の小さな帯に切り替える。
 *   ・alert は画面を止め、ネイティブ版では「localhost says…」の見出しまで出ていた
 *   ・お知らせは閉じる操作が要らない情報なので、数秒で自動的に消えるトーストで足りる
 * 確認（confirmAction：フレンド解除・削除など）は、はい／いいえを決めるまで止めるべきなので
 * これまでどおりの確認ダイアログのまま（ここでは差し替えない）。
 *
 * 表示は components/ui の Toast と同じ見た目（.mt-toast）。下のナビの上に出る。
 * 読み上げは role="status"（aria-live=polite）で、操作の邪魔をしない。
 */
const SHOW_MS = 2600;
/** 長い文（失敗の理由など）は読み終えられるよう少し長く出す */
const msFor = (message: string) => Math.min(6000, SHOW_MS + Math.max(0, message.length - 20) * 60);

export function AppToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [seq, setSeq] = useState(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const restore = setDialogHandlers({
      notify: (next) => {
        window.clearTimeout(timer.current);
        setMessage(next);
        setSeq((n) => n + 1); // 同じ文が続いても出し直す（アニメーションをやり直す）
        timer.current = window.setTimeout(() => setMessage(null), msFor(next));
      },
    });
    return () => { window.clearTimeout(timer.current); restore(); };
  }, []);

  if (!message) return null;
  return (
    <div key={seq} className="mt-toast app-toast" role="status" data-app-toast
      onClick={() => { window.clearTimeout(timer.current); setMessage(null); }}>
      {message}
    </div>
  );
}
