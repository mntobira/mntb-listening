import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import { abortRoom, joinRoomByCode } from '../data/battle';
import { AMBER, BattleButton, BattleNotice, BattleShell, BattleTitle, INK, INK_SUB, LINE } from './BattleParts';
import { ConnectionCheckPanel } from './ConnectionCheckPanel';

/** Normalize only for validation/submission, never rewrite an active IME buffer. */
export function normalizeJoinCode(raw: string): string {
  return raw.normalize('NFKC').replace(/\s/g, '').toUpperCase();
}

export function BattleFriendJoin({ onJoined, onBack, onOpenFriends }: {
  /** フレンドでない相手だったときの「フレンドを追加する」ボタンの行き先 */
  onOpenFriends?: () => void;
  onJoined: (roomId: string) => void;
  onBack: () => void;
}) {
  const [raw, setRaw] = useState('');
  const [composing, setComposing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const composingRef = useRef(false);
  const sendingRef = useRef(false);
  const mountedRef = useRef(true);
  const code = normalizeJoinCode(raw);
  const valid = /^[A-Z0-9]{4}$/.test(code);

  useEffect(() => {
    mountedRef.current = true;
    inputRef.current?.focus();
    return () => { mountedRef.current = false; };
  }, []);

  const submit = async () => {
    // Read the current DOM value: Enter and the final input event can arrive
    // together on mobile. A synchronous lock prevents duplicate join requests.
    if (sendingRef.current || composingRef.current) return;
    const value = normalizeJoinCode(inputRef.current?.value ?? raw);
    if (!/^[A-Z0-9]{4}$/.test(value)) {
      setError('合言葉を英数字4文字で入力してください。');
      return;
    }
    sendingRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const roomId = await joinRoomByCode(value);
      if (mountedRef.current) onJoined(roomId);
      else void abortRoom(roomId).catch(() => {});
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : '部屋に入れませんでした。');
        setBusy(false);
      }
      sendingRef.current = false;
    }
  };

  return (
    <BattleShell footer={<div className="grid gap-2.5">
      <BattleButton onClick={() => void submit()} disabled={!valid || composing || busy} icon={<LogIn size={18} />}>
        {busy ? '入っています…' : '部屋に入る'}
      </BattleButton>
      <BattleButton variant="ghost" onClick={onBack} disabled={busy} icon={<ArrowLeft size={18} />}>もどる</BattleButton>
    </div>}>
      <BattleTitle subtitle="合言葉で参加する" />
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-6">
        <p className="text-center text-sm font-bold leading-relaxed" style={{ color: INK_SUB }}>
          フレンドの4文字の合言葉を入力して、<br />「部屋に入る」を押してください。
        </p>
        <label htmlFor="battle-code-input" className="text-sm font-bold" style={{ color: INK }}>合言葉（4文字）</label>
        <input ref={inputRef} id="battle-code-input" value={raw}
          onChange={e => { setRaw(e.currentTarget.value); setError(null); }}
          onCompositionStart={() => { composingRef.current = true; setComposing(true); }}
          onCompositionEnd={e => { setRaw(e.currentTarget.value); composingRef.current = false; setComposing(false); }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229 && !composingRef.current) {
              e.preventDefault(); void submit();
            }
          }}
          type="text" inputMode="text" autoCapitalize="characters" autoCorrect="off" autoComplete="off"
          spellCheck={false} maxLength={64} disabled={busy} enterKeyHint="go"
          aria-label="合言葉" aria-describedby="battle-code-hint" aria-invalid={!!error}
          className="h-20 w-full max-w-[280px] rounded-2xl border-2 bg-white px-4 text-center text-3xl font-black uppercase tracking-[0.3em] outline-none focus:ring-2 focus:ring-amber-500"
          style={{ color: INK, borderColor: LINE }} />
        <p id="battle-code-hint" className="text-center text-xs font-bold" style={{ color: INK_SUB }}>
          小文字・全角英数字でも入力できます。入力後に確認して参加します。
        </p>
        {error && <BattleNotice message={error} />}
        {error && /フレンドどうし/.test(error) && onOpenFriends && (
          <BattleButton variant="ghost" onClick={onOpenFriends} icon={<UserPlus size={18} />}>フレンドを追加する</BattleButton>
        )}
        {error && !/見つかりません|合言葉|フレンド/.test(error) && <ConnectionCheckPanel compact />}
        <p className="rounded-xl px-3 py-2 text-center text-xs font-bold" style={{ background: '#F1EDE4', color: INK_SUB }}>
          合言葉には<span style={{ color: AMBER }}> 0 / O / 1 / I / L </span>を使いません。
        </p>
      </div>
    </BattleShell>
  );
}
