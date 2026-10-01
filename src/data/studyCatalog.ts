/**
 * 学習カタログ（B17：データ駆動）2026-10-01
 *
 *   科目（subject） → 学習コンテンツ（contents） → 既存の単元・演習画面
 *
 * 画面（StudyCatalog）はこのデータを読むだけで、科目ごとの分岐を持たない。
 * 新しい科目を足すときは、ここに1件足す（＋そのコンテンツの action を App に1つ用意する）だけでよい。
 * 中身（問題データ・進捗・回答履歴）は既存のものをそのまま使い、ここでは「どの画面を開くか」だけを持つ。
 */
import { getSubjectStats } from './chapterIndex.generated';
import { VOCABULARY_COUNT } from './listeningVocabularyMeta.generated';

/** コンテンツを押したときに開く既存の画面。App 側で1か所にまとめて解釈する */
export type StudyAction =
  | { kind: 'units'; subject: string }           // 既存の単元一覧（ChapterSelection）
  | { kind: 'foundation'; tab: 'words' | 'grammar' | 'more' }; // 既存の固めるページの各タブ

export type StudyIcon = 'headphones' | 'pen' | 'letters' | 'book' | 'flask' | 'sigma' | 'globe';

export interface StudyContent {
  id: string;
  title: string;
  /** 1行の説明（何が学べるか） */
  description: string;
  /** 規模（単元数・問題数など）。データから作る */
  meta: string;
  icon: StudyIcon;
  /** 主役のコンテンツ（カードを少し強調する） */
  primary?: boolean;
  /** 進捗の集計に使う科目ID（単元一覧を持つコンテンツだけ） */
  progressSubject?: string;
  action: StudyAction;
}

export interface StudySubject {
  id: string;
  label: string;
  /** 科目カードの一言 */
  description: string;
  icon: StudyIcon;
  contents: StudyContent[];
}

const listening = getSubjectStats('english_listening');
const grammar = getSubjectStats('english_grammar');

export const STUDY_CATALOG: readonly StudySubject[] = [
  {
    id: 'english',
    label: '英語',
    description: 'リスニングと、聞くための英文法・英単語',
    icon: 'headphones',
    contents: [
      {
        id: 'english_listening', title: '英語リスニング', primary: true, icon: 'headphones',
        description: '共通テスト 第1問A〜第6問B。1回ずつ完結',
        meta: `全${listening.units ?? 0}単元・マーク${listening.marks ?? 0}個`,
        progressSubject: 'english_listening',
        action: { kind: 'units', subject: 'english_listening' },
      },
      {
        id: 'english_grammar', title: '英文法', icon: 'pen',
        description: '時制・関係詞・語法など。4択で演習',
        meta: `全${grammar.chapters ?? 0}単元・4択${grammar.marks ?? 0}問`,
        progressSubject: 'english_grammar',
        action: { kind: 'units', subject: 'english_grammar' },
      },
      {
        id: 'english_vocabulary', title: '英単語・英熟語', icon: 'letters',
        description: '目標別のセット。リスニングに出る語にしぼれる',
        meta: `${VOCABULARY_COUNT.toLocaleString()}語・1章20語`,
        action: { kind: 'foundation', tab: 'words' },
      },
      {
        id: 'english_listening_grammar', title: '聞き取りの文法', icon: 'book',
        description: '音がつながる・弱くなる形を例文で確認',
        meta: '8ポイント・例文とクイズつき',
        action: { kind: 'foundation', tab: 'grammar' },
      },
    ],
  },
];

export function findStudySubject(id: string | null | undefined): StudySubject | undefined {
  return STUDY_CATALOG.find(s => s.id === id);
}

/** 単元一覧の科目ID（english_listening など）から、カタログ上の科目を引く */
export function studySubjectOfUnits(unitSubject: string): StudySubject | undefined {
  return STUDY_CATALOG.find(s => s.contents.some(c => c.action.kind === 'units' && c.action.subject === unitSubject));
}
