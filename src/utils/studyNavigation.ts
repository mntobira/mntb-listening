import type { SubjectKey } from '../data/allChapters';
import { getChapterIndexOfSubject } from '../data/chapterIndex.generated';

/** Learning entry only; battle remains available from the existing main navigation. */
export function studyEntry(subject: SubjectKey): 'chapters' | 'mode_selection' {
  return ['english_listening', 'english_grammar', 'geography'].includes(subject)
    ? 'chapters' : 'mode_selection';
}

export function isLearningScreen(screen: string): boolean {
  // 'study'（演習する：科目・コンテンツ選択）と 'foundation'（英単語・聞き取りの文法）も「学習」の画面
  return ['study', 'foundation', 'mode_selection', 'advanced_fields', 'chapters', 'learning', 'quiz', 'explanation', 'mock_exam'].includes(screen);
}

export function safeStudyResume(subject: SubjectKey, screen: string, chapterId: string | null): string {
  if (!isLearningScreen(screen)) return studyEntry(subject);
  if (['quiz', 'explanation'].includes(screen) &&
      !getChapterIndexOfSubject(subject).some(chapter => chapter.id === chapterId)) {
    return studyEntry(subject);
  }
  if (screen === 'advanced_fields' && subject !== 'chemistry') return studyEntry(subject);
  if (screen === 'mock_exam' && subject !== 'chemistry_basic') return studyEntry(subject);
  if (screen === 'learning' && studyEntry(subject) === 'chapters') return 'chapters';
  return screen;
}
