/**
 * ============================================================================
 * 英語2教科（リスニング・英文法）の「解説の後処理」を共通化する前後で
 * 出来上がる解説が1文字も変わらないことを確かめるテスト
 * ============================================================================
 *
 * ■ 何が重複していたか
 * src/data/englishListeningData.ts と src/data/englishGrammarData.ts の末尾に、
 * ほぼ同じ「解説の後処理ループ」がそれぞれ書かれていた。
 * 実際に両者を並べて比較すると、★コメント以外は1文字も違わなかった★。
 *
 *   for (const chapter of データ.parts.flatMap((p) => p.chapters)) {
 *     const problems = [...(chapter.practiceProblems || []), ...(chapter.miniTest || [])];
 *     for (const problem of problems) {
 *       if (!problem) continue;
 *       if (typeof problem.explanation === 'string'
 *           && isStructuredExplanation(problem.explanation)) {
 *         continue;                       // 構造化解説（フローチャートJSON）はそのまま
 *       }
 *       problem.explanation =
 *         buildListeningExplanation(problem) || enhanceExplanation(problem);
 *     }
 *   }
 *
 * ■ 化学の後処理（explanationPostProcess.ts）とは別物なので、まとめない
 * 化学側は
 *   ・構造化解説のとき explanationSupplement を「付ける」
 *   ・通常のとき enhanceExplanation(problem, teaching, 単位変換) を使う
 * で、英語側は
 *   ・構造化解説のとき何もせず skip する
 *   ・通常のとき buildListeningExplanation を先に試す（音声・例文の並びが違う）
 * と、分岐の中身がまるで違う。
 * ★見た目が似ているからといって化学と英語を1つの関数に押し込めると、
 *   どちらかの教科の解説の並びが変わってしまう★ので、英語は英語で1つにする。
 *
 * ■ このテストのやり方（他の共通化と同じ手順）
 * 1. 変更前の書き方を legacyListening / legacyGrammar としてこのファイル内に複製する
 * 2. ★まず「この2つは同じ結果になる」ことを確かめる（前提テスト）★
 *    ここが通ることが「まとめてよい」という根拠になる
 * 3. 新しい共通関数の結果が legacy と一致することを確かめる
 * 4. 実装ファイル側が共通関数を使っていること・自前のループを持っていないことを確かめる
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  enhanceExplanation,
  isStructuredExplanation,
} from '../src/utils/explanationFormat';
import { buildListeningExplanation } from '../src/utils/listeningExplanation';
import { applyListeningPostProcess } from '../src/data/listeningPostProcess';

// ---------------------------------------------------------------------------
// 変更前の書き方の複製（リスニング側）
// ---------------------------------------------------------------------------
const legacyListening = (data: any) => {
  for (const chapter of data.parts.flatMap((p: any) => p.chapters)) {
    const problems = [...(chapter.practiceProblems || []), ...(chapter.miniTest || [])];
    for (const problem of problems) {
      if (!problem) continue;
      if (typeof problem.explanation === 'string' && isStructuredExplanation(problem.explanation)) {
        continue;
      }
      problem.explanation = buildListeningExplanation(problem) || enhanceExplanation(problem);
    }
  }
};

// ---------------------------------------------------------------------------
// 変更前の書き方の複製（英文法側）
//   コメントは違うが処理は上とまったく同じだった、という事実をそのまま残す
// ---------------------------------------------------------------------------
const legacyGrammar = (data: any) => {
  for (const chapter of data.parts.flatMap((p: any) => p.chapters)) {
    const problems = [...(chapter.practiceProblems || []), ...(chapter.miniTest || [])];
    for (const problem of problems) {
      if (!problem) continue;
      if (typeof problem.explanation === 'string' && isStructuredExplanation(problem.explanation)) {
        continue;
      }
      problem.explanation = buildListeningExplanation(problem) || enhanceExplanation(problem);
    }
  }
};

// ---------------------------------------------------------------------------
// テスト用のデータ（実物と同じ形をなるべく再現する）
// ---------------------------------------------------------------------------
const TREE_JSON = JSON.stringify({
  type: 'flowchart',
  phase1: { steps: [{ label: 'Step 1', body: '聞き取る' }] },
});

const makeData = () => ({
  parts: [
    {
      id: 'first_half',
      chapters: [
        {
          id: 'el1_A',
          practiceProblems: [
            // 音声つき（buildListeningExplanation が組み立てられる想定）
            //   ★実物と同じ形にする★
            //   buildListeningExplanation は subQuestions が必須で、
            //   さらに audioTracks の subId が小問 id と一致し script を持つときだけ
            //   専用の組み立てを行う（utils/listeningExplanation.ts の pickScript）。
            {
              id: 'q_el1_A_1',
              question: 'What does the man mean?',
              answer: 'He agrees.',
              explanation: '問1 男性は同意している。',
              subQuestions: [
                { id: 'q_el1_A_1_1', label: '問1 男性の発話に最も近い英文', correctAnswer: '①' },
              ],
              audioTracks: [
                {
                  subId: 'q_el1_A_1_1',
                  script: 'Sure, that works for me.',
                  translation: 'いいですよ、それで大丈夫です。',
                },
              ],
            },
            // 構造化解説（触ってはいけない）
            {
              id: 'q_el1_A_2',
              question: '図表から読み取れることは何か。',
              answer: 'B',
              explanation: TREE_JSON,
            },
            // 音声なし（汎用エンジンに落ちる想定）
            {
              id: 'q_el1_A_3',
              question: '空欄に入る語を選べ。',
              answer: 'however',
              explanation: '逆接なので however。',
            },
            null,
          ],
          miniTest: [
            {
              id: 'q_el1_A_mt1',
              question: 'Choose the best answer.',
              answer: 'C',
              explanation: '消去法で C。',
            },
          ],
        },
        {
          // miniTest を持たない単元
          id: 'eg1_1',
          practiceProblems: [
            {
              id: 'q_eg1_1_1',
              question: 'He ( ) to school every day.',
              answer: 'goes',
              explanation: '三単現の s。',
              audioTracks: [
                { speaker: '', text: 'He goes to school every day.', translation: '彼は毎日学校へ行く。' },
              ],
            },
          ],
        },
        {
          // 問題がまったく無い単元
          id: 'eg9_9',
          practiceProblems: [],
        },
      ],
    },
  ],
});

/** 後処理の結果を比較しやすい形に落とす */
const snapshot = (data: any) =>
  data.parts
    .flatMap((p: any) => p.chapters)
    .flatMap((c: any) => [...(c.practiceProblems || []), ...(c.miniTest || [])])
    .filter(Boolean)
    .map((q: any) => `${q.id}\n---explanation---\n${q.explanation}\n`)
    .join('\n========\n');

describe('英語2教科の解説の後処理の共通化', () => {
  // -------------------------------------------------------------------------
  // 1. 前提テスト：まとめてよいのかを先に確かめる
  // -------------------------------------------------------------------------
  it('★前提★ 変更前の2つの書き方は、同じデータに対して同じ結果になる', () => {
    const a = makeData();
    const b = makeData();
    legacyListening(a);
    legacyGrammar(b);
    expect(snapshot(a)).toBe(snapshot(b));
  });

  // -------------------------------------------------------------------------
  // 2. 新しい共通関数が変更前と一致すること
  // -------------------------------------------------------------------------
  it('共通関数の結果は、変更前（リスニング版）と完全に一致する', () => {
    const now = makeData();
    const before = makeData();
    applyListeningPostProcess(now);
    legacyListening(before);
    expect(snapshot(now)).toBe(snapshot(before));
  });

  it('共通関数の結果は、変更前（英文法版）と完全に一致する', () => {
    const now = makeData();
    const before = makeData();
    applyListeningPostProcess(now);
    legacyGrammar(before);
    expect(snapshot(now)).toBe(snapshot(before));
  });

  // -------------------------------------------------------------------------
  // 3. 振る舞いそのものの確認
  // -------------------------------------------------------------------------
  it('構造化解説（フローチャートJSON）は書き換えない', () => {
    const data = makeData();
    applyListeningPostProcess(data);
    const q = data.parts[0].chapters[0].practiceProblems[1] as any;
    expect(q.explanation).toBe(TREE_JSON);
  });

  it('構造化解説には explanationSupplement を付けない（化学とはここが違う）', () => {
    const data = makeData();
    applyListeningPostProcess(data);
    const q = data.parts[0].chapters[0].practiceProblems[1] as any;
    expect(q.explanationSupplement).toBeUndefined();
  });

  it('音声つきの問題は、リスニング専用の組み立てが使われる', () => {
    const data = makeData();
    const q = data.parts[0].chapters[0].practiceProblems[0] as any;
    const expected = buildListeningExplanation({ ...q });
    // 前提としてリスニング専用の組み立てが成立するデータであること
    expect(expected).toBeTruthy();
    applyListeningPostProcess(data);
    expect(q.explanation).toBe(expected);
  });

  it('音声なしの問題は、汎用エンジンの整形結果になる', () => {
    const data = makeData();
    const raw = data.parts[0].chapters[0].practiceProblems[2] as any;
    const expected = buildListeningExplanation({ ...raw }) || enhanceExplanation({ ...raw } as any);
    applyListeningPostProcess(data);
    expect(raw.explanation).toBe(expected);
  });

  it('ミニテストの問題も処理される', () => {
    const data = makeData();
    const before = data.parts[0].chapters[0].miniTest[0].explanation;
    applyListeningPostProcess(data);
    const after = data.parts[0].chapters[0].miniTest[0].explanation;
    expect(after).not.toBe(before);
    expect(String(after).length).toBeGreaterThan(0);
  });

  it('null の問題が混ざっていても落ちない', () => {
    const data = makeData();
    expect(() => applyListeningPostProcess(data)).not.toThrow();
  });

  it('miniTest を持たない単元でも落ちない', () => {
    const data = makeData();
    expect(() => applyListeningPostProcess(data)).not.toThrow();
    const q = data.parts[0].chapters[1].practiceProblems[0] as any;
    expect(String(q.explanation).length).toBeGreaterThan(0);
  });

  it('問題が空の単元でも落ちない', () => {
    const data = makeData();
    expect(() => applyListeningPostProcess(data)).not.toThrow();
  });

  it('parts が空でも落ちない', () => {
    expect(() => applyListeningPostProcess({ parts: [] } as any)).not.toThrow();
  });

  /**
   * ★べき等性について（調べた結果をそのまま残す）★
   *
   * このテストを書いたとき「2回実行しても同じ結果になるはず」と考えていたが、
   * 実際に測ると音声つきの問題では2回目で解説が二重になった（1087字 → 2568字）。
   * そこで「これは共通化で壊したのか？」を切り分けるため、
   * ★変更前のコードの複製（legacy）でも同じことを試した★ところ、
   * 変更前もまったく同じように二重になった。
   * つまり ★これは元からの性質であって、今回の共通化で変わったものではない★。
   *
   * ・汎用エンジン（enhanceExplanation）は整形済みマーカーで二重適用を防ぐので冪等
   * ・リスニング専用の組み立て（buildListeningExplanation）はマーカーを持たないため
   *   かけ直すと本文が積み重なる
   *
   * 実際のアプリでは、この後処理はモジュール読み込み時の即時実行関数の中で
   * 1回だけ走るので、この性質が表に出ることはない
   * （開発時の HMR で再評価された場合のみ。これも変更前から同じ）。
   *
   * ここでは「変更前と変更後で振る舞いが同じであること」を確認するにとどめる。
   * ★勝手に冪等へ直すと表示が変わってしまうため、直さない★
   */
  it('2回実行したときの振る舞いが、変更前とまったく同じである', () => {
    const now = makeData();
    const before = makeData();
    applyListeningPostProcess(now);
    applyListeningPostProcess(now);
    legacyListening(before);
    legacyListening(before);
    expect(snapshot(now)).toBe(snapshot(before));
  });

  it('音声を持たない問題については、2回実行しても結果が変わらない（汎用エンジンは冪等）', () => {
    const data = makeData();
    applyListeningPostProcess(data);
    const first = (data.parts[0].chapters[0].practiceProblems[2] as any).explanation;
    applyListeningPostProcess(data);
    const second = (data.parts[0].chapters[0].practiceProblems[2] as any).explanation;
    expect(second).toBe(first);
  });

  // -------------------------------------------------------------------------
  // 4. 構造のガード（また同じ重複が生えないようにする）
  // -------------------------------------------------------------------------
  const read = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf-8');

  it('英語2教科は共通関数を使っている', () => {
    for (const f of ['src/data/englishListeningData.ts', 'src/data/englishGrammarData.ts']) {
      expect(read(f)).toContain('applyListeningPostProcess');
    }
  });

  it('英語2教科に自前の後処理ループが残っていない', () => {
    for (const f of ['src/data/englishListeningData.ts', 'src/data/englishGrammarData.ts']) {
      const src = read(f);
      expect(src).not.toMatch(
        /problem\.explanation\s*=\s*buildListeningExplanation\(problem\)\s*\|\|\s*enhanceExplanation\(problem\)/,
      );
    }
  });

  it('共通関数は画面（components）に依存していない', () => {
    expect(read('src/data/listeningPostProcess.ts')).not.toContain("from '../components/");
  });

  it('化学の後処理とは別の関数のままにしている（分岐が違うため）', () => {
    const src = read('src/data/listeningPostProcess.ts');
    // 化学側の関数を呼び出していない＝混ぜていない
    expect(src).not.toContain('applyExplanationPostProcess');
    // 化学側だけが持つ「補足を付ける」処理を持ち込んでいない
    expect(src).not.toContain('buildSupplement');
  });
});
