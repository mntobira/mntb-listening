/**
 * ソースコードを「テキストとして検査する」ための共有ヘルパー
 *
 * ■ なぜこのファイルを作ったか（実際に起きた事故の記録）
 *
 * このリポジトリは「なぜこう直したか」を長いコメントで残す方針である。
 * その結果、テストが素朴な `src.indexOf('<LearningViewer')` で
 * 「JSX の書き出し位置」を探すと、
 * ★経緯を説明した自分のコメント文が先にヒットする★ という事故が起きた。
 *
 * 実際に起きたこと（tests/learningPrint.test.ts）:
 *
 *   App.tsx に遅延読み込みの理由を書いた際、その説明の中に
 *
 *       元のコードは
 *           {appState === 'learning' && <LearningViewer … />}
 *       で、画面が「学習」に切り替わった瞬間に描画される形だった。
 *
 *   という一行を含めた。すると
 *
 *       const at = appSrc.indexOf('<LearningViewer');
 *       expect(appSrc.slice(at, at + 300)).toContain('subject=');
 *
 *   がこのコメント行に当たり、実際の JSX（すぐ下にあり subject= を
 *   ちゃんと渡している）ではなく説明文を検査してしまって失敗した。
 *
 * ■ どちらが悪いのか（コメントを消す修正では直らない）
 *
 *   アプリは正しく動いていた（ブラウザで実機確認済み）。
 *   壊れていたのは★テスト（見張り役）のほう★である。
 *   コメントの文言を変えて緑にするのは、
 *   「見張り役の弱点をそのままにして症状だけ隠す」対応であり、
 *   同じ罠が次に別のファイルで必ず再発する。
 *
 *   さらに悪いのは逆方向の誤りである。
 *   「◯◯が書かれていないこと」を確かめるテストは、
 *   コメントに ◯◯ と書いてあるだけで
 *   ★本物のコードから消えていても失敗し続ける／逆に残っていても気づけない★。
 *   つまりコメントを検査対象に含めることは
 *   「見張り役が嘘をつく」原因になる。
 *
 * ■ 実装方針
 *
 *   自作のスキャナで // や /* を消そうとすると、
 *   文字列リテラル中の記号やテンプレートリテラルの ${} 入れ子で
 *   必ず取りこぼす（過去に実際に取りこぼした）。
 *   ここでは TypeScript 自身の removeComments を使い、
 *   ★コンパイラが見ているコードと同じもの★ を検査対象にする。
 *
 *   jsx は Preserve にしている。className の文字列や
 *   <Component prop=... /> の並びをそのまま見たいテストがあるため、
 *   JSX を関数呼び出しに変換してはいけない。
 */
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '..', '..');

/** リポジトリ相対パスでソースを読む */
export function readSource(relPath: string): string {
  return readFileSync(resolve(repoRoot, relPath), 'utf8');
}

/**
 * コメントを除いた実コードを返す。
 *
 * 同じ文字列を何度も渡すテストが多いのでメモ化する
 * （transpileModule は 1 ファイル数十 ms かかり、
 *   毎回呼ぶとテスト全体が体感で遅くなる）。
 */
const strippedCache = new Map<string, string>();
export function stripComments(src: string): string {
  const cached = strippedCache.get(src);
  if (cached !== undefined) return cached;
  const out = ts.transpileModule(src, {
    compilerOptions: {
      removeComments: true,
      jsx: ts.JsxEmit.Preserve, // JSX を残す（属性の並びを見たいので）
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    },
    fileName: 'src.tsx',
  }).outputText;
  strippedCache.set(src, out);
  return out;
}

/** 読み込みとコメント除去をまとめて行う（一番よく使う形） */
export function readCode(relPath: string): string {
  return stripComments(readSource(relPath));
}
