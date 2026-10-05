import { useRef } from 'react';
import { ClipboardPaste } from 'lucide-react';

/**
 * フレンドコードの入力欄（2026-10-05 再修正）。
 *
 * ★1つの普通の入力欄にしている理由★
 *   前回の「8マス表示＋透明な入力欄を重ねる」作りは、スマホで
 *   ・長押しの「ペースト」が出ない（透明な欄は押せない扱いになる）
 *   ・入力中に値を書き換えるため、変換中の文字が消えて打てない
 *   という不具合があった。対戦の合言葉と同じく、見えている普通の入力欄に
 *   打った文字をそのまま入れ、整える（大文字・全角→半角・ハイフン補完）のは送信時だけにする。
 *
 * 受け付ける形：「MNTB-AB12-CD34」「mntb ab12 cd34」「AB12CD34」（MNTB- 省略）、全角も可。
 */
export function friendCodeFromRaw(raw: string): string {
  let s = (raw || '').normalize('NFKC').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.length === 12 && s.startsWith('MNTB')) s = s.slice(4);
  return /^[A-Z0-9]{8}$/.test(s) ? `MNTB-${s.slice(0, 4)}-${s.slice(4)}` : '';
}

export function FriendCodeInput({ value, onChange, onSubmit, disabled }: {
  /** 入力されたそのままの文字列 */
  value: string; onChange: (raw: string) => void; onSubmit?: () => void; disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const composingRef = useRef(false);
  const canPaste = typeof navigator !== 'undefined' && !!navigator.clipboard?.readText;
  return <div className="friend-code-input" data-friend-code-input>
    <input ref={ref} value={value} disabled={disabled}
      onChange={e => onChange(e.currentTarget.value)}
      onCompositionStart={() => { composingRef.current = true; }}
      onCompositionEnd={e => { composingRef.current = false; onChange(e.currentTarget.value); }}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229 && !composingRef.current) {
          e.preventDefault(); onSubmit?.();
        }
      }}
      type="text" inputMode="text" autoCapitalize="characters" autoCorrect="off" autoComplete="off" spellCheck={false}
      enterKeyHint="send" maxLength={40} placeholder="MNTB-XXXX-XXXX"
      aria-label="フレンドコード" className="friend-code-field" />
    {canPaste && <button type="button" className="friend-code-paste" disabled={disabled} aria-label="コピーしたコードを貼り付け"
      onClick={async () => {
        try { const t = await navigator.clipboard.readText(); if (t) onChange(t.trim()); } catch { ref.current?.focus(); }
      }}>
      <ClipboardPaste size={16} /><span>貼り付け</span>
    </button>}
  </div>;
}
