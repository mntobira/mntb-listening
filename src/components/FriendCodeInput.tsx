import { useRef, useState } from 'react';

/**
 * フレンドコードの入力欄（2026-10-05：合言葉の入力と同じ感じに）。
 *   ・「MNTB-」は最初から表示し、打つのは後ろの8文字だけ（4文字＋4文字の2マス表示）
 *   ・自動で大文字・自動修正なし・予測変換なし（スマホで同じ文字が勝手に入る／アルファベットが打ちにくい対策）
 *   ・全角・小文字・ハイフン・空白も受け付ける。「MNTB-XXXX-XXXX」をまるごと貼り付けてもよい
 * 返す値は送信用の正規形 MNTB-XXXX-XXXX（8文字そろうまでは ''）。
 */
export function friendCodeBody(raw: string): string {
  let s = (raw || '').normalize('NFKC').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.startsWith('MNTB') && s.length > 8) s = s.slice(4);
  return s.slice(0, 8);
}
export function friendCodeFromBody(body: string): string {
  return body.length === 8 ? `MNTB-${body.slice(0, 4)}-${body.slice(4)}` : '';
}

export function FriendCodeInput({ value, onChange, onSubmit, disabled }: {
  /** 8文字の本体（MNTB- を除く） */
  value: string; onChange: (body: string) => void; onSubmit?: () => void; disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [composing, setComposing] = useState(false);
  const cells = Array.from({ length: 8 }, (_, i) => value[i] ?? '');
  return <div className="friend-code-input" onClick={() => ref.current?.focus()} data-friend-code-input>
    <span className="friend-code-prefix" aria-hidden="true">MNTB-</span>
    <span className="friend-code-cells" aria-hidden="true">
      {cells.slice(0, 4).map((c, i) => <i key={i} data-filled={!!c || undefined} data-cursor={i === value.length || undefined}>{c}</i>)}
      <b>-</b>
      {cells.slice(4).map((c, i) => <i key={i + 4} data-filled={!!c || undefined} data-cursor={i + 4 === value.length || undefined}>{c}</i>)}
    </span>
    <input ref={ref} value={value} disabled={disabled}
      onChange={e => { if (!composing) onChange(friendCodeBody(e.currentTarget.value)); }}
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={e => { setComposing(false); onChange(friendCodeBody(e.currentTarget.value)); }}
      onPaste={e => { e.preventDefault(); onChange(friendCodeBody(e.clipboardData.getData('text'))); }}
      onKeyDown={e => { if (e.key === 'Enter' && !composing && value.length === 8) { e.preventDefault(); onSubmit?.(); } }}
      type="text" inputMode="text" autoCapitalize="characters" autoCorrect="off" autoComplete="off" spellCheck={false}
      enterKeyHint="send" maxLength={14} aria-label="フレンドコード（MNTB- の後ろの8文字）" className="friend-code-hidden" />
  </div>;
}
