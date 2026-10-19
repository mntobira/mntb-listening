/**
 * ===================================================================
 * 教科データの入口（章の一覧・章の検索）
 * ===================================================================
 *
 * 画面は教科データ本体（parts / chapters のネスト）を直接触らず、ここを通して章を引く。
 * どの教科があるかは data/subjects.ts（教科の登録簿）が決め、
 * ここは「教科ID → データ本体」の対応だけを持つ。
 *
 * 章IDは教科ごとに接頭辞が分かれている（リスニング el… / 英文法 eg…）ので、
 * 全教科を連結して探しても取り違えは起きない。新しい教科も別の接頭辞にすること
 * （登録簿の chapterIdPattern で検査される）。
 *
 * 教科データは起動後に変化しないので、章の一覧は初回だけ組み立てて使い回す。
 */

import { englishListeningData } from './englishListeningData';
import { englishGrammarData } from './englishGrammarData';
import type { Chapter, Part, Problem } from '../types/curriculum';

/** 教科データの外側の形（parts の中身は types/curriculum.ts の Part） */
interface PartsLike {
  parts: Part[];
}

/**
 * 教科ID。★定義は data/subjects.ts（教科の登録簿）にある。★
 * ここでは今まで使ってきた import 先（allChapters の SubjectKey）を保つために再公開している。
 */
import { SUBJECT_REGISTRY, type SubjectKey } from './subjects';
export type { SubjectKey } from './subjects';

interface SubjectEntry {
  id: SubjectKey;
  /** 画面に出す教科名 */
  label: string;
  /** この教科のデータ本体（章の取り出し元） */
  data: PartsLike;
}

/**
 * 教科ID → 教科データ本体。
 *
 * ★教科を追加するときは、登録簿（data/subjects.ts）に1件足し、ここにデータを1行足す。★
 * Record<SubjectKey, …> なので、登録簿に足してここを忘れると型エラーになる。
 */
const SUBJECT_DATA: Record<SubjectKey, PartsLike> = {
  english_listening: englishListeningData,
  english_grammar: englishGrammarData,
};

/**
 * アプリが扱う教科の一覧（並び順は登録簿どおり）。
 *
 * 並び順には2つの意味がある。
 *   1. 章IDの検索順（findChapterById）… 同じIDが複数教科にあった場合、先の教科が優先される。
 *   2. ホーム画面の「教科ごとの進捗」の表示順。
 */
export const SUBJECTS: readonly SubjectEntry[] = SUBJECT_REGISTRY.map((s) => ({ id: s.id, label: s.label, data: SUBJECT_DATA[s.id] }));

/**
 * ★教科名の対応表（SUBJECT_LABELS）はこのファイルには置かない★
 *
 * 以前はここに
 *     export const SUBJECT_LABELS = Object.fromEntries(
 *       SUBJECTS.map((s) => [s.id, s.label]));
 * があった。今の置き場所は data/subjectLabels.ts。
 *
 * なぜ移したか（消したのではなく移した）:
 *
 *   1. 誰も import していなかった。
 *      画面側は SubjectSelection / chapterCatalog 経由で引いていて、
 *      この export は実際には一度も使われていない状態だった。
 *
 *   2. ★残しておくと「重い入口」になる★
 *      このファイルは冒頭で6教科ぶんの問題データを静的に読む。
 *      つまり「教科名を1つ引きたいだけ」でもここを import すると、
 *      約2.5MB の問題データが起動時の読み込みに入ってしまう。
 *      軽い置き場所（subjectLabels.ts は索引だけを読む）がある以上、
 *      重い入口を残すのは将来の踏み間違いを招くだけである。
 *
 * 出どころは変わっていない。subjectLabels.ts は生成済み索引
 * （chapterIndex.generated.ts）の id / label から作り、その索引は
 * 下の SUBJECTS から自動生成している。両者が一致することは
 * tests/chapterIndex.test.ts と tests/allChapters.test.ts が検査する。
 *
 * 教科名が必要なときは:
 *     import { SUBJECT_LABELS } from './subjectLabels';        // data 層
 *     import { getSubjectLabel } from './components/SubjectSelection'; // 画面層
 */

/**
 * 教科データから章の配列を取り出す。
 *
 * これは各教科ファイルにある getAllAdvancedChapters() / getAllMathChapters() などと
 * 完全に同じ処理（`data.parts.flatMap(p => p.chapters)`）。
 * 同じ内容であることは tests/allChapters.test.ts で実際に突き合わせて確認している。
 */
function flattenChapters(data: PartsLike): Chapter[] {
  return (data.parts || []).flatMap((part) => part.chapters || []);
}

/**
 * 教科ID → その教科の章配列。
 *
 * 教科データは起動後に変化しないため、初回だけ作って使い回す。
 * ★返す配列を呼び出し側で書き換えない（sort / push など）こと。★
 * 現在の呼び出し側はすべて読み取りのみ（reduce / map / find）であることを
 * 確認したうえでキャッシュしている。
 */
const chaptersBySubject = new Map<SubjectKey, Chapter[]>();

/**
 * 指定した教科の章一覧を返す。
 * 未知の教科IDが来た場合は、先頭の教科（SUBJECTS[0]＝英語リスニング）の章を返す
 * （画面が空にならないようにするため）。
 */
export function getChaptersOfSubject(subjectId: string | null | undefined): Chapter[] {
  const entry =
    SUBJECTS.find((subject) => subject.id === subjectId) ??
    // 既定は先頭の教科（SUBJECTS[0]＝英語リスニング）
    SUBJECTS[0];

  const cached = chaptersBySubject.get(entry.id);
  if (cached) return cached;

  const chapters = flattenChapters(entry.data);
  chaptersBySubject.set(entry.id, chapters);
  return chapters;
}

/**
 * 指定した教科の parts（章のまとまり）をそのまま返す。
 *
 * 単元選択画面（ChapterSelection）は章をタブへまとめ直すために
 * parts の情報（part.id / part.title / part.field）まで必要なので、
 * 章だけを返す getChaptersOfSubject では足りない。
 *
 * 未知の教科IDのときは、getChaptersOfSubject と同じく先頭の教科（英語リスニング）を返す。
 * 返す配列は元データそのものなので、書き換えないこと。
 */
export function getPartsOfSubject(subjectId: string | null | undefined): Part[] {
  const entry = SUBJECTS.find((subject) => subject.id === subjectId) ?? SUBJECTS[0];
  return entry.data.parts || [];
}

/**
 * 全教科の章を連結した配列。
 * 教科データは起動後に変わらないので、初回だけ作って使い回す。
 */
let cachedChapters: Chapter[] | null = null;

function getAllChapters(): Chapter[] {
  if (cachedChapters) return cachedChapters;
  cachedChapters = SUBJECTS.flatMap((subject) => getChaptersOfSubject(subject.id));
  return cachedChapters;
}

/**
 * 章IDから章を引く（全教科横断）。
 * 見つからなければ undefined を返す。
 *
 * 戻り値の形（Chapter）は types/curriculum.ts にあり、
 * 全教科の実データを走査して実在したキーに合わせてある。
 */
export function findChapterById(chapterId: string | null | undefined): Chapter | undefined {
  if (!chapterId) return undefined;
  return getAllChapters().find((chapter) => chapter.id === chapterId);
}

/**
 * 章の小テストの問題一覧。
 *
 * 現行データの miniTest は常に配列だが、古い形式（`{ problems: [...] }`）の章を
 * 読み込んでも空にならないよう、呼び出し側2か所（App / 対戦の解説）が持っていた
 * 読み替えをここに1つにまとめた。
 */
export function miniTestProblemsOf(chapter: Pick<Chapter, 'miniTest'> | null | undefined): Problem[] {
  const mini: unknown = chapter?.miniTest;
  if (Array.isArray(mini)) return mini as Problem[];
  return (mini as { problems?: Problem[] } | undefined)?.problems || [];
}
