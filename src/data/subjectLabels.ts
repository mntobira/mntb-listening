/**
 * 教科名の対応表と、教科IDの判定。
 *
 * 教科名の実体は data/subjects.ts（教科の登録簿）。ここは画面から引く窓口で、
 * 外部教科（英単語など、本体に教科データを持たない教科）の名前もここで引ける。
 * 教科データ本体を import しない（起動直後の画面からも安全に使える）。
 */
import { DEFAULT_SUBJECT, SUBJECT_REGISTRY, isSubjectKey, type SubjectKey } from './subjects';
import { externalSubjectOf } from './externalSubjects';

export const SUBJECT_LABELS: Record<SubjectKey, string> = Object.fromEntries(
  SUBJECT_REGISTRY.map((subject) => [subject.id, subject.label]),
) as Record<SubjectKey, string>;

/** 教科名。登録簿 → 外部教科の順に探し、どちらにも無ければ既定の教科名 */
export function labelOfSubject(id: string | null | undefined): string {
  if (isSubjectKey(id)) return SUBJECT_LABELS[id];
  const external = externalSubjectOf(id);
  if (external) return external.label;
  return SUBJECT_LABELS[DEFAULT_SUBJECT];
}

/** 画面の呼び名（従来の SubjectSelection の名前を保つ） */
export type SubjectId = SubjectKey;
export { labelOfSubject as getSubjectLabel };
/** 登録簿にある教科IDか（旧版の化学・数学などは false） */
export const isSubjectId = isSubjectKey;
