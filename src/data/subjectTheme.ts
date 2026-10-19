/**
 * 科目ごとの配色（サブジェクトテーマ）
 *
 * 配色の実体は data/subjects.ts（教科の登録簿）の theme にある。ここは引く窓口。
 *
 *   const theme = subjectTheme(subject);
 *   <div className={theme.bubbleBorderClass} style={{ boxShadow: theme.bubbleShadow }} />
 *
 * Tailwind はクラス名を動的に組み立てると JIT が拾えないため、
 * 登録簿には完成したクラス名を文字列として持たせている（結合しない）。
 */

// 教科IDの型と配色は data/subjects.ts（教科の登録簿）が唯一の定義
import { DEFAULT_SUBJECT, SUBJECT_REGISTRY, type SubjectKey, type SubjectTheme } from './subjects';
// 本体に教科データを持たない教科（英単語など）の配色
import { externalSubjectOf } from './externalSubjects';

export type { SubjectTheme } from './subjects';

/**
 * 配色を引くときに渡す教科ID。
 * 登録簿の教科に加えて、外部教科（英単語など）の ID も受け付ける。
 */
export type ThemeSubject = SubjectKey | (string & {});

const THEMES = Object.fromEntries(SUBJECT_REGISTRY.map((s) => [s.id, s.theme])) as Record<SubjectKey, SubjectTheme>;

/**
 * 教科の配色を返す。登録簿 → 外部教科の順に探し、どちらにも無ければ既定の教科の配色。
 */
export function subjectTheme(subject: ThemeSubject | undefined): SubjectTheme {
  if (subject) {
    const known = THEMES[subject as SubjectKey];
    if (known) return known;
    const external = externalSubjectOf(subject);
    // 項目名を SubjectTheme と揃えてあるので、そのまま配色として使える。
    // （食い違っていればこの代入で型エラーになる＝取り違えを機械が止める）
    if (external) {
      const theme: SubjectTheme = {
        label: external.label,
        accent: external.accent,
        accentSoft: external.accentSoft,
        surface: external.surface,
        bubbleBorderClass: external.bubbleBorderClass,
        bubbleBgClass: external.bubbleBgClass,
        bubbleShadow: external.bubbleShadow,
        chipTextClass: external.chipTextClass,
        chipBgClass: external.chipBgClass,
        progressBarClass: external.progressBarClass,
      };
      return theme;
    }
  }
  return THEMES[DEFAULT_SUBJECT];
}

/** テスト・検証用に一覧を公開する（実装と期待値が乖離しないようにするため）。 */
export const SUBJECT_THEMES = THEMES;
