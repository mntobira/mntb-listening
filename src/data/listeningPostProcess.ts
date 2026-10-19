/**
 * ============================================================================
 * 英語2教科（リスニング・英文法）の「解説の後処理」
 * ============================================================================
 *
 * ■ なぜこのファイルがあるか
 * englishListeningData.ts と englishGrammarData.ts の末尾に、
 * まったく同じ後処理ループがそれぞれ書かれていた。
 * 実際に2つを並べて比較すると、★コメント以外は1文字も違わなかった★。
 * 片方だけ直して片方を直し忘れると、教科によって解説の並びが違う、という
 * 気づきにくい不具合になるため、1つにまとめてここへ置いた。
 *
 * ■ 何をしているか
 * 全単元の「演習問題」と「ミニテスト」を順に見て、
 *   ・すでに構造化解説（フローチャートJSON）を持つ問題 → ★何もしない★
 *     画面側がJSONをステップ表示に組み立てるので、文字列を触ると壊れる。
 *   ・それ以外の問題 → リスニング専用の組み立てを先に試し、
 *     組み立てられなければ汎用エンジンで整形する。
 *
 * ■ リスニング専用の組み立てを先に試す理由（もとのコメントを引き継ぐ）
 *   化学と同じ汎用エンジンだと［解答 → 思考手順 → 詳しい解説］の順になり、
 *   スクリプト（実際に何と言っていたか）が地の文に埋もれてしまう。
 *   リスニングは「聞こえたか」の勝負なので、復習で最初に見たいのは
 *   スクリプトそのもの。だから buildListeningExplanation が組み立てられた
 *   ときだけそれを使い、組み立てられない（音声が無い）ときに汎用エンジンへ落とす。
 *   英文法も audioTracks（例文・和訳・語句）を持つので、まったく同じ経路で
 *   「英文 → 決め手 → 道すじ」の並びになる。
 *
 * ■ ★化学の後処理（explanationPostProcess.ts）とは別にしている理由★
 * 見た目は似ているが、分岐の中身がまるで違う。
 *   化学: 構造化解説のとき explanationSupplement を「付ける」／
 *         通常のとき enhanceExplanation(問題, 単元の教え方, 単位変換) を使う
 *   英語: 構造化解説のとき何もせず飛ばす／
 *         通常のとき buildListeningExplanation を先に試す
 * 似ているからと1つの関数に押し込めると、どちらかの教科の解説の並びが
 * 変わってしまう。★「綺麗にするためだけの統合」はしない★という方針により、
 * 化学用と英語用の2つに分けたままにしている。
 *
 * ■ 置き場所を data/ にしている理由
 * utils/ に置くと utils → data → utils の循環依存が復活してしまうため。
 * （この循環は以前わざわざ解消したもの。）
 */
import { enhanceExplanation, isStructuredExplanation } from '../utils/explanationFormat';
import { buildListeningExplanation } from '../utils/listeningExplanation';
import type { Chapter } from '../types/curriculum';

/** 教科データの、このファイルが必要とする最小限の形 */
interface SubjectDataLike {
  parts: Array<{ chapters?: Array<Partial<Pick<Chapter, 'practiceProblems' | 'miniTest'>>> }>;
}

/**
 * 英語2教科の解説を、画面表示用の形に整える。
 * データ自身を書き換える（もとのループと同じ振る舞い）。
 */
export function applyListeningPostProcess(data: SubjectDataLike): void {
  const chapters = data.parts.flatMap((part) => part.chapters || []);
  for (const chapter of chapters) {
    const problems = [
      ...(chapter.practiceProblems || []),
      ...(chapter.miniTest || []),
    ];
    for (const problem of problems) {
      if (!problem) continue;
      // 構造化解説（フローチャートJSON）はそのまま画面へ渡す
      if (typeof problem.explanation === 'string' && isStructuredExplanation(problem.explanation)) {
        continue;
      }
      // 音声・例文を持つ問題は専用の並び（スクリプト → 決め手 → 道すじ）に、
      // それ以外は従来の汎用エンジンに。
      problem.explanation = buildListeningExplanation(problem) || enhanceExplanation(problem);
    }
  }
}
