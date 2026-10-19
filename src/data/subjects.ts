/**
 * ===================================================================
 * 教科の登録簿（教科を足すときに書き換えるのは、原則ここと教科データだけ）
 * ===================================================================
 *
 * 教科の「名前・公開状態・章IDの形・入口・配色・復習タブの色」をここに集める。
 * 以前はこれらが features.ts / subjectTheme.ts / reviewSubject.ts /
 * classroomCore.ts / TeacherDashboard.tsx / App.tsx などに教科ごとに手書きされており、
 * 教科を1つ足すたびに10か所近くを直す必要があった（直し忘れると一部の画面だけ出ない）。
 * いまは各所がこの一覧から作られるので、ここに1件足せば揃う。
 *
 * 手順は docs/ADDING_SUBJECT.md にまとめてある。
 *
 * ■ このファイルは何も import しない（葉モジュール）
 *   ホーム・ナビなど起動直後に読む画面からも参照されるため、
 *   教科データ本体（数MB）を引き込まないようにしている。
 */

/** 科目ごとの配色。完成したクラス名を文字列で持つ（Tailwind が動的な組み立てを拾えないため） */
export interface SubjectTheme {
  /** 科目の表示名（吹き出しの見出しなどに使う） */
  label: string;
  /** 主役の色（濃いめ・文字色にも耐える） */
  accent: string;
  /** 淡い色（枠線・下地） */
  accentSoft: string;
  /** 画面の下地 */
  surface: string;
  bubbleBorderClass: string;
  bubbleBgClass: string;
  bubbleShadow: string;
  chipTextClass: string;
  chipBgClass: string;
  progressBarClass: string;
}

/** 復習ノートの科目タブ・帯の色 */
export interface ReviewSubjectStyle {
  textClass: string;
  bgClass: string;
  borderClass: string;
  activeClass: string;
  stripeClass: string;
}

export interface SubjectDefinition {
  /** 教科ID。保存データ（進捗・復習ノート・クラス）のキーになるので、公開後は変えない */
  id: string;
  /** 画面に出す教科名 */
  label: string;
  /** 狭い場所（復習タブなど）に出す短い名前 */
  shortLabel: string;
  /** false にすると、カード・ナビ・状態の復元・一覧のすべてから消える */
  enabled: boolean;
  /** この教科の章IDの形。復習アイテムがどの教科のものかを章IDから判定する */
  chapterIdPattern: RegExp;
  /**
   * 「学習する」を押したときの入口。
   *   chapters       … すぐ単元一覧へ
   *   mode_selection … 学習モード選択（演習／まとめなど）を挟む
   */
  entry: 'chapters' | 'mode_selection';
  /** 学習モード選択画面の「演習問題」カードの説明 */
  practiceDescription: string;
  /**
   * 学習モード選択画面の「まとめプリント」カードの説明。
   * 書いた科目だけカードが出る（まとめプリントを持たない科目は書かない）。
   */
  learningDescription?: string;
  theme: SubjectTheme;
  reviewStyle: ReviewSubjectStyle;
}

export const SUBJECT_REGISTRY = [
  {
    id: 'english_listening',
    label: '英語リスニング',
    shortLabel: 'リスニング',
    enabled: true,
    chapterIdPattern: /^el\d+(_[A-Z])?$/,
    entry: 'chapters',
    practiceDescription: '第1問A・第1問B …のように大問別（A／Bも別）に選び、回ごとに取り組みます。',
    // 音・語学のイメージでミントグリーン
    theme: {
      label: '英語リスニング',
      accent: '#3E9C93',
      accentSoft: '#A9E0D8',
      surface: '#F5FCFA',
      bubbleBorderClass: 'border-[#A9E0D8]/80',
      bubbleBgClass: 'bg-[#F8FEFC]/95',
      bubbleShadow: '0 10px 24px -14px rgba(62,156,147,0.55)',
      chipTextClass: 'text-[#2F7C74]',
      chipBgClass: 'bg-[#A9E0D8]/35',
      progressBarClass: 'bg-[#5BC0BE]',
    },
    reviewStyle: {
      textClass: 'text-[#2F7C74]',
      bgClass: 'bg-[#A9E0D8]/25',
      borderClass: 'border-[#A9E0D8]',
      activeClass: 'bg-[#3E9C93] text-white border-[#3E9C93]',
      stripeClass: 'bg-[#3E9C93]',
    },
  },
  {
    id: 'english_grammar',
    label: '英文法',
    shortLabel: '英文法',
    enabled: true,
    chapterIdPattern: /^eg\d+_\d+$/,
    entry: 'chapters',
    practiceDescription: '文型・時制・準動詞…の単元別に4択を解きます。全問に完成文の音源と誤答肢の理由がつきます。',
    // 同じ英語のリスニング（ミント）と見違えないよう、温色の琥珀（アンバー）
    theme: {
      label: '英文法',
      accent: '#C77B3C',
      accentSoft: '#EFD3B4',
      surface: '#FDF8F2',
      bubbleBorderClass: 'border-[#EFD3B4]/80',
      bubbleBgClass: 'bg-[#FFFBF6]/95',
      bubbleShadow: '0 10px 24px -14px rgba(199,123,60,0.55)',
      chipTextClass: 'text-[#9D5C24]',
      chipBgClass: 'bg-[#EFD3B4]/35',
      progressBarClass: 'bg-[#D9975A]',
    },
    reviewStyle: {
      textClass: 'text-[#9F6230]',
      bgClass: 'bg-[#EFD3B4]/25',
      borderClass: 'border-[#EFD3B4]',
      activeClass: 'bg-[#C77B3C] text-white border-[#C77B3C]',
      stripeClass: 'bg-[#C77B3C]',
    },
  },
] as const satisfies readonly SubjectDefinition[];

/** 教科ID（アプリ全体で唯一の定義）。登録簿に足すと自動で増える */
export type SubjectKey = (typeof SUBJECT_REGISTRY)[number]['id'];

/** 登録簿の並び順の教科ID */
export const SUBJECT_IDS: readonly SubjectKey[] = SUBJECT_REGISTRY.map((s) => s.id);

/** 既定の教科（登録簿の先頭） */
export const DEFAULT_SUBJECT: SubjectKey = SUBJECT_REGISTRY[0].id;

export function isSubjectKey(value: string | null | undefined): value is SubjectKey {
  return !!value && (SUBJECT_IDS as readonly string[]).includes(value);
}

export function subjectDefinitionOf(id: string | null | undefined): SubjectDefinition | undefined {
  return SUBJECT_REGISTRY.find((s) => s.id === id);
}

/** 章IDから教科を判定する（どの教科の形にも合わなければ null） */
export function subjectOfChapterId(chapterId: string | null | undefined): SubjectKey | null {
  const id = (chapterId || '').trim();
  if (!id) return null;
  return SUBJECT_REGISTRY.find((s) => s.chapterIdPattern.test(id))?.id ?? null;
}
