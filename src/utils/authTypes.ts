import type { User } from 'firebase/auth';

/**
 * ログインまわりの型（Web: utils/googleAuth.ts、アプリ: native/nativeAuth.ts の両方が使う）。
 * 両者が互いを import すると循環参照になるため、型だけをこの葉ファイルに置く。
 */

/** ログイン方法（2026-10-02：App Store 申請に向けて Apple を戻した） */
export type SignInMethod = 'google' | 'apple';

/** サインイン結果 */
export interface GoogleSignInOutcome {
  /** 連携できたか */
  ok: boolean;
  /** 連携できたユーザー（redirect に切り替えた場合は undefined のままページが遷移する） */
  user?: User;
  /** ページ遷移（リダイレクト）を開始したので、この後の処理は不要 */
  redirecting?: boolean;
  /** 失敗理由（利用者向けの日本語） */
  message?: string;
  /** 失敗の種類（解析用の短いコード。例：NA-SHA1） */
  errorCode?: string;
  /** 利用者が閉じた／中断した（失敗に数えない。逃げ道も出さない） */
  cancelled?: boolean;
}
