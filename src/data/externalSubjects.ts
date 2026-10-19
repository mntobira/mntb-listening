/**
 * ===================================================================
 * 外部教科（本体に教科データを持たない教科）の登録簿
 * ===================================================================
 *
 * 通常の教科は src/data/*.ts に章・大問・小問のデータがあり、data/subjects.ts に並ぶ。
 * 英単語・英熟語のように「対戦の出題だけを持ち、本体の章・大問・小問の形を持たない」
 * 教科はここに登録する。SubjectKey に足すと「型は通るのに実体（章）が無い」場所が
 * 各所に生まれるため、別の種類の教科として扱う。
 *
 * ここが担うのは、画面に出す教科名（labelOfSubject）と配色（subjectTheme）と章名だけ。
 * 出題そのものは scripts/gen-battle-pool.mts が作る。
 *
 * ★このファイルは何も import しない（葉）★
 * 教科名や配色を引くだけで問題データ本体まで連れてこないようにするため。
 */

/**
 * 外部教科の1件ぶん。
 *
 * 配色の項目名は SubjectTheme と同じにしてある（subjectTheme.ts がそのまま返せるようにするため）。
 * 型を import しないのは葉に保つためで、食い違っていないことは subjectTheme.ts 側の代入で検査される。
 */
export interface ExternalSubject {
  /** 教科ID（出題プールの subject と同じ文字列） */
  id: string;
  /** 画面に出す教科名 */
  label: string;
  accent: string;
  accentSoft: string;
  surface: string;
  bubbleBorderClass: string;
  bubbleBgClass: string;
  bubbleShadow: string;
  chipTextClass: string;
  chipBgClass: string;
  progressBarClass: string;
  /**
   * 章ID → 章名。
   *
   * ★何のために持つのか★
   * 対戦の結果画面は「まちがえた単元」を名前で出し、そこから演習へ渡す。
   * 名前は本体の軽い索引（chapterIndex.generated.ts）から引いているが、
   * 外部教科はそこに載らないので、引くと ★'ch01' という生の記号★ が
   * そのまま画面に出てしまう（何の単元か生徒に分からない）。
   * それを避けるため、章名をここに持つ。
   *
   * 出題プールに出てくる章だけを載せる。
   */
  chapters: readonly { id: string; title: string }[];
}

/** 外部教科の一覧 */
export const EXTERNAL_SUBJECTS: readonly ExternalSubject[] = [
  {
    "id": "english_vocab",
    "label": "英単語・英熟語",
    "accent": "#2F5D8A",
    "accentSoft": "#BFD3E6",
    "surface": "#F4F8FC",
    "bubbleBorderClass": "border-[#BFD3E6]/80",
    "bubbleBgClass": "bg-[#F8FBFE]/95",
    "bubbleShadow": "0 10px 24px -14px rgba(47,93,138,0.55)",
    "chipTextClass": "text-[#274B70]",
    "chipBgClass": "bg-[#BFD3E6]/35",
    "progressBarClass": "bg-[#5B84AF]",
    "chapters": [
      {
        "id": "lv1",
        "title": "単語　共通テスト6割〜"
      },
      {
        "id": "lv2",
        "title": "単語　共通テスト8割〜"
      },
      {
        "id": "lv3",
        "title": "単語　2次試験レベル"
      },
      {
        "id": "lv4",
        "title": "単語　2次試験の追加語彙"
      },
      {
        "id": "ilv1",
        "title": "熟語　共通テスト6割〜"
      },
      {
        "id": "ilv2",
        "title": "熟語　共通テスト8割〜"
      },
      {
        "id": "ilv3",
        "title": "熟語　2次試験レベル"
      }
    ]
  }
];

/** 教科ID → 外部教科。知らないIDなら undefined。 */
export function externalSubjectOf(id: string | null | undefined): ExternalSubject | undefined {
  if (!id) return undefined;
  return EXTERNAL_SUBJECTS.find((subject) => subject.id === id);
}

/**
 * 外部教科かどうか。
 *
 * 「本体の教科データを持たない教科」を見分けたい場所で使う
 * （例：章名を本体の索引から引こうとしても入っていない）。
 */
export function isExternalSubject(id: string | null | undefined): boolean {
  return externalSubjectOf(id) !== undefined;
}

/**
 * 外部教科の章名を引く。知らない教科・知らない章なら undefined。
 *
 * 呼び出し側（対戦の結果画面）は「本体の索引 → だめならこちら →
 * それでもだめなら章IDをそのまま」の順で出す。
 */
export function externalChapterTitleOf(
  subjectId: string | null | undefined,
  chapterId: string | null | undefined,
): string | undefined {
  if (!chapterId) return undefined;
  const subject = externalSubjectOf(subjectId);
  if (!subject) return undefined;
  return subject.chapters.find((chapter) => chapter.id === chapterId)?.title;
}

/**
 * 本体に演習画面が無い「対戦専用」の外部教科。
 * 対戦の結果画面は、この教科では「この問題を演習する」「つづけて演習する」「復習する」を出さない
 * （押しても行き先が無いため）。答えは各問の1行解答で見せる。
 */
export const BATTLE_ONLY_SUBJECTS: readonly string[] = ['english_vocab', 'joho'];

/** 対戦専用（演習画面が無い）教科か。 */
export function isBattleOnlySubject(id: string | null | undefined): boolean {
  return !!id && BATTLE_ONLY_SUBJECTS.includes(id);
}
