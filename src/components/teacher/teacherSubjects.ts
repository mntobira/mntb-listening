import { SUBJECT_REGISTRY } from '../../data/subjects';
import { type ClassroomDoc } from '../../utils/classroomCore';
import { filterEnabledSubjects } from '../../config/features';

/** 登録簿の全教科。クラス作成で選べるのは、このうち公開中の教科だけ */
const ALL_SUBJECT_OPTIONS: Array<{ value: ClassroomDoc['subject']; label: string }> =
  SUBJECT_REGISTRY.map((s) => ({ value: s.id, label: s.label }));
export const SUBJECT_OPTIONS = filterEnabledSubjects(ALL_SUBJECT_OPTIONS, (option) => option.value);
/** クラス作成の初期教科（リスニング版の主役） */
export const DEFAULT_CLASS_SUBJECT: ClassroomDoc['subject'] = SUBJECT_OPTIONS[0]?.value ?? 'english_listening';
