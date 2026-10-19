import { subjectDefinitionOf } from '../data/subjects';
import type { SubjectKey } from '../data/allChapters';

/** Learning entry only; battle remains available from the existing main navigation. */
export function studyEntry(subject: SubjectKey): 'chapters' | 'mode_selection' {
  return subjectDefinitionOf(subject)?.entry ?? 'chapters';
}

export function isLearningScreen(screen: string): boolean {
  // 'study'（演習する：科目・コンテンツ選択）と 'foundation'（英単語・聞き取りの文法）も「学習」の画面
  return ['study', 'foundation', 'mode_selection', 'advanced_fields', 'chapters', 'learning', 'quiz', 'explanation', 'mock_exam'].includes(screen);
}

