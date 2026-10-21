/**
 * 単元選択画面のタブ（章のグループ）と、単元ごとの復習用音源の取り出し（C-05）。
 * ChapterSelection.tsx から移した。中身は1文字も変えていない（描画を持たない純粋な処理だけ）。
 */
import { getPartsOfSubject } from '../data/allChapters';
import type { ListeningAudioTrack } from '../data/englishListeningQ1AProblems';
import type { Chapter, Part, Problem } from '../types/curriculum';

/**
 * parts を「教科書の章（realTitle）」単位のタブにまとめる共通処理。
 */
/** 単元選択画面のタブ1つ（英文法は PART 単位で、添え字 kicker と見出し label を持つ） */
interface ChapterGroup {
  title: string;
  chapters: Chapter[];
  partId: string;
  partTitle: string;
  kicker?: string;
  label?: string;
}

function buildChapterGroups(parts: Part[]): ChapterGroup[] {
  return parts.flatMap((part) => {
    const groups = new Map<string, Chapter[]>();

    part.chapters.forEach(chapter => {
      const groupTitle = chapter.realTitle || 'その他';
      const chapters = groups.get(groupTitle) || [];
      chapters.push(chapter);
      groups.set(groupTitle, chapters);
    });

    return Array.from(groups, ([title, chapters]) => ({
      title,
      chapters,
      partId: part.id,
      partTitle: part.title,
    }));
  });
}

/**
 * 教科ごとのタブ（章のグループ）。
 *
 * どの教科も realTitle でグループ化するだけで正しいタブになるため、
 * 処理は buildChapterGroups の1本で共通。以前は教科ごとに
 *   const listeningGroups = buildChapterGroups(englishListeningData.parts);
 *   …（5教科ぶん）
 * と同じ行を並べていたが、教科を足すたびに書き足す必要があった。
 *
 * ★同じ教科なら必ず同じ配列（実体）を返すこと。★
 * groups は useEffect / useMemo の依存に入っているので、
 * 呼ぶたびに新しい配列を作るとタブが毎回作り直され、
 * 開いているタブが勝手に先頭へ戻ってしまう。
 * そのため一度作ったものを教科IDで覚えておく。
 *
 * 参考（各教科の事情はそのまま）：
 * - 英語リスニング：A・B が分かれる大問は realTitle も別（'第1問 A' / '第1問 B'）
 *   なので、この共通処理を通すだけで A・B が独立したタブになる
 * - 英文法：「10章 語法」は 4 単元を抱えるので、1 つのタブに 4 単元が並ぶ
 */
const groupsBySubject = new Map<string, ChapterGroup[]>();

export function getChapterGroups(subject: string): ChapterGroup[] {
  const cached = groupsBySubject.get(subject);
  if (cached) return cached;
  const built = buildChapterGroups(getPartsOfSubject(subject));
  groupsBySubject.set(subject, built);
  return built;
}

const GRAMMAR_PART_LABEL: Record<string, string> = { eg_grammar: '文法の幹', eg_usage: '語法', eg_expression: '会話表現' };

let grammarPartGroups: ChapterGroup[] | null = null;

export function getGrammarPartGroups(): ChapterGroup[] {
  if (grammarPartGroups) return grammarPartGroups;
  grammarPartGroups = getPartsOfSubject('english_grammar').map((part, i): ChapterGroup => ({
    title: GRAMMAR_PART_LABEL[part.id] ?? part.title,
    label: GRAMMAR_PART_LABEL[part.id] ?? part.title,
    kicker: `PART ${i + 1}`,
    chapters: part.chapters,
    partId: part.id,
    partTitle: part.title,
  }));
  return grammarPartGroups;
}

/**
 * 単元の中に収録されている音源を、回（problem）ごとにまとめて取り出す。
 *
 * ご要望「復習用の音源を聞く場所もしっかりと作って」に対応するためのもの。
 * 問題を解き直さなくても、単元選択の画面からいつでも音源だけを
 * 聞き直せるようにする（＝復習専用の入口）。
 */
export function collectAudioSets(
  chapter: Chapter,
): { id: string; title: string; readCount: 1 | 2; tracks: ListeningAudioTrack[] }[] {
  const problems: Problem[] = [
    ...(chapter?.practiceProblems || []),
    ...(chapter?.miniTest || []),
  ];
  return problems
    .filter((p) => Array.isArray(p?.audioTracks) && p.audioTracks.length > 0)
    .map((p) => ({
      id: p.id,
      title: p.category || chapter.abstractTitle,
      readCount: (p.readCount || 2) as 1 | 2,
      tracks: p.audioTracks as ListeningAudioTrack[],
    }));
}

/**
 * タブに出す見出しを「小さな添え字（上段）＋ 見出し（下段）」に分解する。
 *
 * - 「1章 名詞」              → 上段「1章」／下段「名詞」
 * - 英語リスニング：「第1問」        → 上段「Q1」／下段「第1問」
 *                   「第1問 A」      → 上段「Q1A」／下段「第1問 A」
 *   （リスニングの大問には章名が無いので、上段に通し番号を置いて
 *    デザイン（2段組みのタブ）を他科目とまったく同じに保つ）
 *
 * ★A・B の枝番まで上段に出す理由★
 *   第1問 A と第1問 B は設問形式がまったく違う別の練習なので、
 *   タブを横に並べたときに「Q1」が2つ続くと見分けが付かない。
 *   上段を Q1A / Q1B と書き分けることで、狭いスマホ幅でも取り違えない。
 */
export function splitTabTitle(title: string, index: number): { kicker: string; label: string } {
  const chapterMatch = title.match(/^(\d+章)\s*(.*)$/);
  if (chapterMatch) {
    return { kicker: chapterMatch[1], label: chapterMatch[2] || title };
  }
  // 「第1問」「第1問 A」「第1問A」のいずれの表記でも拾う
  const questionMatch = title.match(/^第(\d+)問\s*([A-Z]?)$/);
  if (questionMatch) {
    return { kicker: `Q${questionMatch[1]}${questionMatch[2]}`, label: title };
  }
  return { kicker: `${index + 1}章`, label: title };
}
