import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { isChunkLoadError, shouldReloadForChunk } from '../utils/chunkRecovery';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** 「単元選択に戻る」等のリカバリ動作。未指定ならリロードのみ表示。 */
  onReset?: () => void;
  /** 障害箇所を特定しやすくするためのラベル（例: '結果・解説画面'） */
  label?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * 画面描画中の例外で「真っ白な画面」になるのを防ぐエラーバウンダリ。
 *
 * 【導入の経緯】
 * 問題データの型ゆらぎ（gradingCriteria が配列でなく文字列）により
 * 「⑦ 滴定曲線と二段階滴定」の結果・ランキング画面が描画時に例外を投げ、
 * 画面が何も表示されないまま操作不能になっていた。
 * 原因自体は修正済みだが、他の章で似たデータ不備が起きても
 * 生徒が復帰できるよう、原因表示付きのフォールバックUIを出す。
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // このリポジトリは @types/react を導入していない（React 型が any 扱い）ため、
  // クラスコンポーネントで使うインスタンスメンバを明示的に宣言しておく。
  declare readonly props: ErrorBoundaryProps;
  declare setState: (state: ErrorBoundaryState) => void;

  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // 開発時・本番ともに原因を追えるようコンソールへ残す
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`, error, info);
    // 新しい版の配信直後に古い画面の部品が見つからないときは、1回だけ読み直して新しい版にする
    if (isChunkLoadError(error) && navigator.onLine && shouldReloadForChunk()) window.location.reload();
  }

  private handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#F5B7B1] rounded-3xl shadow-lg p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#FDEDEC] text-[#C0392B] flex items-center justify-center">
            <AlertTriangle size={26} />
          </div>
          <h2 className="text-lg font-bold text-[#1B2631] mb-2">
            画面の表示中に問題が発生しました
          </h2>
          <p className="text-sm text-[#4B5563] leading-relaxed mb-4">
            {this.props.label ? `「${this.props.label}」の` : ''}
            表示に失敗しました。学習の記録は保存されていますので、
            下のボタンからやり直してください。
          </p>
          <p className="text-[11px] text-[#7A8B99] font-mono break-all bg-[#F8F9F9] border border-[#EAECEE] rounded-lg p-2 mb-5 text-left">
            {error.message || String(error)}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {this.props.onReset && (
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#1B2631] text-white text-sm font-bold hover:bg-[#2C3E50] transition-colors"
              >
                <Home size={16} />
                単元選択に戻る
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-[#D1D5DB] text-[#4B5563] text-sm font-bold hover:bg-[#F8F9F9] transition-colors"
            >
              <RotateCcw size={16} />
              再読み込み
            </button>
          </div>
        </div>
      </div>
    );
  }
}
