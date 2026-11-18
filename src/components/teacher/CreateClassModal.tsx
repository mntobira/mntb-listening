import { type ClassroomDoc } from '../../utils/classroomCore';
import { subjectTheme } from '../../data/subjectTheme';
import { SUBJECT_OPTIONS } from './teacherSubjects';

// ===================================================================
// クラス作成モーダル
// ===================================================================

interface CreateClassModalProps {
  schoolName: string;
  className: string;
  subject: ClassroomDoc['subject'];
  creating: boolean;
  accent: string;
  onChangeSchool: (value: string) => void;
  onChangeClass: (value: string) => void;
  onChangeSubject: (value: ClassroomDoc['subject']) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function CreateClassModal(props: CreateClassModalProps) {
  const canSubmit =
    props.schoolName.trim().length > 0 && props.className.trim().length > 0 && !props.creating;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 py-6"
      onClick={props.onClose}
    >
      <div
        className="w-full max-w-md bg-[#FFFDF8] rounded-2xl border border-[#E5DCCC] p-5 shadow-[0_18px_40px_rgba(32,24,14,0.22),inset_0_1px_0_rgba(255,255,255,0.95)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-[#1B2631] mb-1">クラスを作る</h2>
        <p className="text-xs text-[#6B7280] mb-4 leading-relaxed">
          作成すると参加コードが自動で発行されます。あとから変更できるのはクラス名ではなく
          「参加の受付」だけなので、名前は学年・組が分かる形で付けてください。
        </p>

        <label className="block mb-3">
          <span className="block text-xs font-bold text-[#4B5563] mb-1">学校名</span>
          <input
            value={props.schoolName}
            onChange={(event) => props.onChangeSchool(event.target.value)}
            maxLength={40}
            placeholder="例）〇〇県立〇〇高等学校"
            className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#DFD2BC] bg-white text-sm text-[#1B2631] shadow-[inset_0_1px_2px_rgba(28,42,57,0.04)] focus:outline-none focus:border-[#2458A6] focus:ring-2 focus:ring-[#E5EEF9]"
          />
          <span className="block text-xs text-[#9BA3AE] mt-1">
            生徒のアプリ画面にも表示されます。
          </span>
        </label>

        <label className="block mb-3">
          <span className="block text-xs font-bold text-[#4B5563] mb-1">クラス名</span>
          <input
            value={props.className}
            onChange={(event) => props.onChangeClass(event.target.value)}
            maxLength={40}
            placeholder="例）2年A組 化学基礎"
            className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#DFD2BC] bg-white text-sm text-[#1B2631] shadow-[inset_0_1px_2px_rgba(28,42,57,0.04)] focus:outline-none focus:border-[#2458A6] focus:ring-2 focus:ring-[#E5EEF9]"
          />
        </label>

        <div className="mb-5">
          <span className="block text-xs font-bold text-[#4B5563] mb-1.5">対象科目</span>
          <div className="flex flex-wrap gap-2">
            {SUBJECT_OPTIONS.map((option) => {
              const selected = props.subject === option.value;
              const optionTheme = subjectTheme(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => props.onChangeSubject(option.value)}
                  className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-sm border transition-all ${
                    selected
                      ? `font-bold ${optionTheme.chipTextClass} ${optionTheme.chipBgClass} border-transparent shadow-[0_2px_0_rgba(0,0,0,0.08)]`
                      : 'border-[#DFD2BC] bg-white text-[#4B5563] hover:bg-[#FAF6EC]'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={props.onClose}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-sm border border-[#DFD2BC] bg-white text-[#3F3527] shadow-[0_2px_0_#E5D9C4] hover:bg-[#FAF6EC] active:translate-y-[1.5px] active:shadow-none transition-all"
          >
            やめる
          </button>
          <button
            onClick={props.onSubmit}
            disabled={!canSubmit}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-[0_2.5px_0_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all active:translate-y-[1.5px] active:shadow-none disabled:opacity-50 disabled:shadow-none"
            style={{ backgroundColor: props.accent }}
          >
            {props.creating ? '作成中…' : '作る'}
          </button>
        </div>
      </div>
    </div>
  );
}
