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
        className="w-full max-w-md bg-white rounded-2xl border border-[#E0E1DD] p-5"
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
            className="w-full px-3 py-2 rounded-xl border border-[#C9D2DA] text-sm text-[#1B2631] focus:outline-none focus:border-[#6FA8C5]"
          />
          <span className="block text-[11px] text-[#9BA3AE] mt-1">
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
            className="w-full px-3 py-2 rounded-xl border border-[#C9D2DA] text-sm text-[#1B2631] focus:outline-none focus:border-[#6FA8C5]"
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
                  className={`px-3.5 py-1.5 rounded-xl text-sm border transition-colors ${
                    selected
                      ? `font-bold ${optionTheme.chipTextClass} ${optionTheme.chipBgClass} border-transparent`
                      : 'border-[#E0E1DD] text-[#4B5563] hover:bg-[#FAF8F2]'
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
            className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-[#E0E1DD] text-[#4B5563] hover:bg-[#FAF8F2] transition-colors"
          >
            やめる
          </button>
          <button
            onClick={props.onSubmit}
            disabled={!canSubmit}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: props.accent }}
          >
            {props.creating ? '作成中…' : '作る'}
          </button>
        </div>
      </div>
    </div>
  );
}
