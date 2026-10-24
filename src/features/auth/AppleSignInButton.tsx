/**
 * 「Appleでサインイン」ボタン（App Store Review Guideline 4.8）。
 * Apple のヒューマンインターフェースガイドラインに合わせ、黒地・白文字・Apple ロゴ・
 * Google ボタンと同じ大きさで並べる。
 */
import { Loader2 } from 'lucide-react';
import { signInWithApple, type GoogleSignInOutcome } from '../../utils/googleAuth';
import { useSignInGuard } from '../../hooks/useSignInGuard';

export function AppleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 814 1000" aria-hidden="true" fill="currentColor">
      <path d="M788 341c-6 4-108 62-108 190 0 148 130 200 134 202-1 3-21 72-69 142-43 62-88 124-156 124s-86-40-164-40c-77 0-104 41-167 41s-106-57-156-128C44 790 0 669 0 555 0 371 120 274 238 274c63 0 115 41 155 41 38 0 97-44 169-44 27 0 126 3 191 70zM566 169c29-35 50-83 50-131 0-7-1-14-2-19-48 2-104 32-138 71-27 30-52 78-52 127 0 7 1 15 2 17 3 1 8 1 13 1 43 0 97-29 127-66z" />
    </svg>
  );
}

export function AppleSignInButton({
  onResult,
  className = '',
  label = 'Appleでサインイン',
}: {
  onResult?: (outcome: GoogleSignInOutcome) => void;
  className?: string;
  label?: string;
}) {
  // busy は必ず元に戻る（try/finally）。Google のログイン中は押せない（同時に2つ開くと片方が中断され固まるため）
  const { busy, anyBusy, run } = useSignInGuard();
  const onClick = async () => {
    const outcome = await run(signInWithApple);
    if (outcome.redirecting) return;
    onResult?.(outcome);
  };
  return (
    <button type="button" onClick={onClick} disabled={anyBusy} className={`apple-signin-btn ${className}`}>
      {busy ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <AppleMark size={17} />}
      {busy ? '連携中…' : label}
    </button>
  );
}
