/**
 * ===================================================================
 * 外部教科（本体に教科データを持たない教科）の登録簿
 * ===================================================================
 *
 * -------------------------------------------------------------------
 * ■ なぜこのファイルが必要になったのか
 * -------------------------------------------------------------------
 * この本体アプリの教科は、これまで全部「同じ形」だった。
 *
 *   src/data/*.ts に章・大問・小問のデータがある
 *     → allChapters.ts の SUBJECTS に並ぶ
 *       → SubjectKey（教科IDの型）に名前が載る
 *         → 教科名（subjectLabels）と配色（subjectTheme）が引ける
 *
 * ところが「高校入試 理科」（rika）はこの形に当てはまらない。
 * 理科は別リポジトリで作られた完成品で、
 *
 *   ・出題は src/battle/data/external/rika.json（1117問）を丸ごと受け取る
 *   ・演習・まとめ・出題傾向の画面は src/features/rika/ に自前で持つ
 *   ・本体の章・大問・小問の形（miniTest / practiceProblems）を持たない
 *
 * という作りになっている。つまり ★SUBJECTS に並べられない★。
 *
 * -------------------------------------------------------------------
 * ■ SubjectKey に rika を足さない理由
 * -------------------------------------------------------------------
 * SubjectKey に足すと、型の上では「本体の教科データがある教科」と
 * 同じ扱いになる。すると
 *
 *   getChaptersOfSubject('rika')  → 中身が無いので空
 *   SUBJECT_LABELS['rika']        → 索引（生成物）に無いので undefined
 *   chapterCatalog / kanten の集計 → 0 件の教科が混ざる
 *
 * のように「型は通るのに実体が無い」場所が各所に生まれる。
 * これは ★型が嘘をつく★ 状態で、後から読む人が必ず踏む。
 * さらに SUBJECTS の並びは画面の表示順そのものなので、
 * 通常教科の列に理科が割り込むと既存画面の並びまで動いてしまう。
 *
 * だから理科は「別の種類の教科」として、こちらに登録する。
 *
 * -------------------------------------------------------------------
 * ■ このファイルが担うのは2つだけ
 * -------------------------------------------------------------------
 *   ① 画面に出す教科名   （labelOfSubject が読む）
 *   ② 画面の配色         （subjectTheme が読む）
 *
 * どちらも「これが無いと化学基礎として表示されてしまう」ものである。
 * 実際、登録する前は対戦の教科選択・待合室・出題・結果・履歴の
 * 5画面すべてで、理科が ★「化学基礎」という名前とローズ色★ で
 * 表示されていた（未知の教科は化学基礎に落ちる作りのため）。
 *
 * 出題そのものはここを通らない。プールは
 * scripts/gen-battle-pool.mts が external/*.json から作る。
 *
 * -------------------------------------------------------------------
 * ■ ★このファイルは何も import しない（葉）★
 * -------------------------------------------------------------------
 * 教科名や配色は「軽い入口」から引けなければ意味がない。
 * ここが何かを import すると、教科名を1つ引くだけで
 * 問題データ本体（約2.6MB）まで連れてくる恐れがある。
 * それを防ぐため、このファイルは
 *   ・import 文を1つも持たない
 *   ・型も自前で持たず、値だけを置く
 * という決まりにしている。
 * この性質は tests/subjectLabels.test.ts が機械検査している。
 */

/**
 * 外部教科の1件ぶん。
 *
 * 配色の項目名は SubjectTheme と同じにしてある
 * （subjectTheme.ts がそのまま返せるようにするため）。
 * ★型を import しないのは上に書いた「葉に保つ」ためで、
 *   食い違っていないことは subjectTheme.ts 側の代入で検査される。★
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
   * ★出題プールに出てくる章だけを載せる★
   * 理科の原典は32単元あるが、そのうち1単元は見出しだけで
   * 中身が書かれておらず、出題が1問も作られていない。
   * 出ない単元の名前を持っても使い道がないので載せていない。
   */
  chapters: readonly { id: string; title: string }[];
}

/**
 * 外部教科の一覧。
 *
 * 高校入試 理科 — 原典は『三重県後期選抜入試対策理科最終プリント』。
 *
 * ★色の選び方★
 * 既存7教科の色相は
 *   ローズ 10°（化学基礎）／アンバー 30°（英文法）／オリーブ 85°（生物基礎）
 *   ミント 175°（英語リスニング）／ブルー 203°（化学）
 *   インディゴ 238°（数学）／モーブ 325°（地理）
 * で埋まっている。空いているのは 238°〜325° の間なので、
 * そこに入る ★バイオレット（約 272°）★ を選んだ。
 * 隣のインディゴ（#5B5EA6）とは彩度と暗さで差をつけてあるので、
 * 並べても取り違えない。
 */
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
 * 理科（rika）は src/features/rika/ に演習画面があるので含めない。
 */
export const BATTLE_ONLY_SUBJECTS: readonly string[] = ['english_vocab', 'joho'];

/** 対戦専用（演習画面が無い）教科か。 */
export function isBattleOnlySubject(id: string | null | undefined): boolean {
  return !!id && BATTLE_ONLY_SUBJECTS.includes(id);
}
