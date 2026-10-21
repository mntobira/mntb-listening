/**
 * 試合中の「対戦をやめる」（1回目は確認にする）（C-21）。
 * BattleRoomScreen.tsx から JSX をそのまま移した（クラス名・style・文言は1文字も変えていない）。
 * 確認中かどうか（confirmQuit）は親が持つ。部品ではなく描画関数にして、React の木を変えない。
 */
import { X } from 'lucide-react';
import { BattleButton, INK, LINE } from './BattleParts';

export function renderBattleQuitControl({ confirmQuit, setConfirmQuit, leave, onExit }: {
  confirmQuit: boolean;
  setConfirmQuit: (v: boolean) => void;
  leave: () => void;
  onExit: (message?: string) => void;
}) {
  return confirmQuit ? (
    <div
      className="grid gap-2 rounded-2xl border-2 p-3"
      style={{ borderColor: LINE, background: '#FFFFFF' }}
    >
      <p className="text-center text-xs font-black" style={{ color: INK }}>
        対戦をやめますか？ やめると<span style={{ color: '#C0392B' }}>この試合は負け</span>になります。
      </p>
      <div className="grid grid-cols-2 gap-2">
        <BattleButton variant="ghost" onClick={() => setConfirmQuit(false)}>
          つづける
        </BattleButton>
        <BattleButton
          variant="danger"
          onClick={() => {
            leave();
            onExit('対戦をやめました。この試合は負けとして記録されます。');
          }}
          icon={<X size={16} />}
        >
          やめる
        </BattleButton>
      </div>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setConfirmQuit(true)}
      className="w-full min-h-11 py-1 text-center text-xs font-bold underline-offset-2 hover:underline"
      style={{ color: '#9A948A' }}
    >
      対戦をやめる
    </button>
  );
}
