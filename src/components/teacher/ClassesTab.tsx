import { Copy, Check, Lock, Unlock } from 'lucide-react';
import { type ClassroomDoc } from '../../utils/classroomCore';
import { subjectTheme } from '../../data/subjectTheme';
import type { ThemeShape } from './teacherTheme';

// ===================================================================
// クラス設定タブ
// ===================================================================

interface ClassesTabProps {
  classrooms: ClassroomDoc[];
  theme: ThemeShape;
  copiedCode: string;
  onCopyCode: (code: string) => void;
  onToggleJoin: (room: ClassroomDoc) => void;
}

export function ClassesTab({ classrooms, theme, copiedCode, onCopyCode, onToggleJoin }: ClassesTabProps) {
  return (
    <div className="space-y-3">
      {classrooms.map((room) => {
        const roomTheme = subjectTheme(room.subject);
        return (
          <div key={room.id} className="bg-white rounded-2xl border border-[#E0E1DD] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs text-[#6B7280]">{room.schoolName}</p>
                <p className="text-base font-bold text-[#1B2631]">{room.className}</p>
                <span
                  className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[11px] ${roomTheme.chipTextClass} ${roomTheme.chipBgClass}`}
                >
                  {roomTheme.label}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#6B7280] mb-1">参加コード</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-[0.18em] text-[#1B2631]">
                    {room.joinCode}
                  </span>
                  <button
                    onClick={() => onCopyCode(room.joinCode)}
                    className="p-1.5 rounded-lg border border-[#E0E1DD] text-[#4B5563] hover:bg-[#FAF8F2] transition-colors"
                    aria-label="参加コードをコピー"
                  >
                    {copiedCode === room.joinCode ? (
                      <Check className="w-3.5 h-3.5 text-[#3E9C93]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/*
              受付の開閉。
              学期が終わったら閉じられるようにしておくのは、
              卒業生や他クラスの生徒が後から入ってこないようにするため。
            */}
            <button
              onClick={() => onToggleJoin(room)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-colors ${
                room.joinOpen
                  ? 'border-[#A9E0D8] bg-[#F5FCFA] text-[#2F7C74]'
                  : 'border-[#E0E1DD] bg-[#FAF8F2] text-[#6B7280]'
              }`}
            >
              {room.joinOpen ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  参加を受け付けています（閉じる）
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  参加を締め切っています（開く）
                </>
              )}
            </button>
          </div>
        );
      })}

      <p className="text-xs text-[#6B7280] leading-relaxed px-1">
        参加コードは学校名・クラス名とセットで発行されます。学校名はアプリの画面にも表示されます。
        コードは <strong>O と 0</strong>、<strong>I と 1</strong> のような見間違えやすい文字を
        使わない設計なので、黒板に書いても読み違えが起きにくくなっています。
      </p>
    </div>
  );
}
