/**
 * ===================================================================
 * 英語リスニング：問題文（選択肢）と解答欄を同期させる整形のテスト
 * ===================================================================
 * ご要望：
 *   「英語リスニングでは問題文と解答欄を分離しないで。
 *     問題文(選択肢)と解答欄が同期するようにしたい。」
 *
 * 実装方針
 *   データ（problem.text）は書き換えず、Quiz の表示時に
 *     ① problem.text から ①〜④ の本文を取り出して解答欄のボタンに載せる
 *     ② 左ペインからは問N 以降のブロックを落として重複を消す
 *   という2つの整形を行う。
 *
 * ここが壊れると
 *   ・選択肢の本文と正解の対応がズレる（＝正しく解いても誤答になる）
 *   ・左右に同じ文が二重表示される（＝分離状態に逆戻り）
 * という致命的な不具合になるため、実データ全問で検証する。
 */
import { describe, it, expect } from 'vitest';
import {
  buildListeningOptionTexts,
  parseListeningOptionBlocks,
  stripListeningQuestionBlocks,
  subQuestionNumber,
} from '../src/utils/listeningOptions';
import { EL1_A_PROBLEMS } from '../src/data/englishListeningQ1AProblems';
import { EL1_A_EXTRA_PROBLEMS } from '../src/data/englishListeningQ1ASets';
import { EL1_B_PROBLEMS } from '../src/data/englishListeningQ1BProblems';

const MARKS = ['①', '②', '③', '④'];
const Q1A = [...EL1_A_PROBLEMS, ...EL1_A_EXTRA_PROBLEMS];

describe('parseListeningOptionBlocks：問題文から ①〜④ の本文を取り出す', () => {
  const TEXT = [
    '第2回　第1問 A（4問・2回読み）',
    '',
    '第1問 A では、短い英文が2回読まれます。',
    '',
    '────────────────────',
    '問1（話者：女性（高校生））',
    '① She went to bed early last night.',
    '② She plans to go to bed early tonight.',
    '③ She is not sleepy at all.',
    '④ She will stay up late tonight.',
    '',
    '────────────────────',
    '問2（話者：男性（会社員））',
    '① He found a seat on the train.',
    '② He drove to the office.',
    '③ He stood on the train the whole way.',
    '④ He took a bus to the office.',
  ].join('\n');

  it('設問番号ごとに 4件ずつ、順番どおりに取り出す', () => {
    const blocks = parseListeningOptionBlocks(TEXT);
    expect(blocks.size).toBe(2);
    expect(blocks.get(1)).toEqual([
      'She went to bed early last night.',
      'She plans to go to bed early tonight.',
      'She is not sleepy at all.',
      'She will stay up late tonight.',
    ]);
    expect(blocks.get(2)![2]).toBe('He stood on the train the whole way.');
  });

  it('マーク記号（①など）は本文から外す', () => {
    for (const bodies of parseListeningOptionBlocks(TEXT).values()) {
      for (const body of bodies) {
        expect(MARKS.some((m) => body.startsWith(m))).toBe(false);
      }
    }
  });

  it('①〜④が揃っていない設問は採用しない（中途半端な表示を防ぐ）', () => {
    const broken = ['問1', '① one', '② two', '③ three'].join('\n');
    expect(parseListeningOptionBlocks(broken).size).toBe(0);
  });

  it('選択肢を持たない問題文では何も取り出さない（イラスト選択・化学など）', () => {
    const noOptions = ['問1（話者：女性）', 'イラスト①〜④から選びなさい。'].join('\n');
    expect(parseListeningOptionBlocks(noOptions).size).toBe(0);
  });
});

describe('stripListeningQuestionBlocks：左ペインからは問N 以降を落とす', () => {
  it('リード文（指示文・解き方のコツ）は残す', () => {
    const out = stripListeningQuestionBlocks(
      '第1問 A の指示文です。\n\n【解き方のコツ】\nまず違いを言語化する。\n\n────────────────────\n問1（話者：女性）\n① aaa\n② bbb',
    );
    expect(out).toContain('第1問 A の指示文です。');
    expect(out).toContain('まず違いを言語化する。');
  });

  it('問N 以降（設問文・選択肢）と直前の区切り線は消す', () => {
    const out = stripListeningQuestionBlocks(
      'リード文\n\n────────────────────\n問1（話者：女性）\n① aaa\n② bbb',
    );
    expect(out).not.toContain('問1');
    expect(out).not.toContain('aaa');
    expect(out).not.toContain('─');
    expect(out).toBe('リード文');
  });

  it('問N を含まない文章は変えない（化学などに影響しない）', () => {
    const text = '次の文章を読み、下の問いに答えよ。\n\n実験1では…';
    expect(stripListeningQuestionBlocks(text)).toBe(text);
  });
});

describe('subQuestionNumber：ラベルから設問番号を読む', () => {
  it('「問2 …」から 2 を読む', () => {
    expect(subQuestionNumber({ label: '問2 話者の発話に最も近い英文' }, 0)).toBe(2);
  });

  it('番号が書かれていなければ並び順を使う', () => {
    expect(subQuestionNumber({ label: '発話に合うイラスト' }, 2)).toBe(3);
  });
});

describe('実データ検証：第1問A 全14セット（56問）', () => {
  it('すべてのセットで4問ぶんの選択肢本文が取り出せる', () => {
    for (const p of Q1A) {
      const map = buildListeningOptionTexts(p);
      expect(map.size, `${p.id} の選択肢本文が取り出せていない`).toBe(
        p.subQuestions.length,
      );
    }
  });

  it('選択肢本文は「設問IDごとに4件・空文字なし」', () => {
    for (const p of Q1A) {
      for (const sq of p.subQuestions as any[]) {
        const bodies = buildListeningOptionTexts(p).get(sq.id)!;
        expect(bodies.length).toBe(4);
        for (const body of bodies) expect(body.length).toBeGreaterThan(0);
      }
    }
  });

  it('正解のマークに対応する本文が、解説に載っている「正解の選択肢」と一致する', () => {
    // ここがズレると「正しく選んだのに誤答」になる。最重要の検証。
    //
    // 解説は「問1 …／問2 …」と行頭見出しで区切られているので、
    // まず設問ごとのブロックに切り分けてから照合する
    // （切らずに正規表現で拾うと隣の設問の行を掴んでしまう）。
    let checked = 0;
    for (const p of Q1A) {
      const blocks = new Map<string, string[]>();
      let cur: string | null = null;
      for (const line of p.explanation.split('\n')) {
        const head = line.match(/^\s*問\s*(\d+)/u);
        if (head) {
          cur = head[1];
          blocks.set(cur, [line]);
        } else if (cur) {
          blocks.get(cur)!.push(line);
        }
      }

      const map = buildListeningOptionTexts(p);
      for (const sq of p.subQuestions as any[]) {
        const bodies = map.get(sq.id)!;
        const picked = bodies[MARKS.indexOf(sq.correctAnswer)];
        expect(picked, `${sq.id}: 正解マークに対応する本文が無い`).toBeTruthy();

        const no = sq.id.slice(sq.id.lastIndexOf('_') + 1);
        const block = (blocks.get(no) || []).join('\n');
        const m = block.match(/正解の選択肢：(.+)/);
        // 手書きの第1回には「正解の選択肢：」行が無いのでスキップする
        if (!m) continue;
        expect(m[1].trim(), `${sq.id} の解説と選択肢本文が食い違っている`).toBe(picked);
        checked += 1;
      }
    }
    // PDF 由来の13セット（52問）は必ず照合できていること
    expect(checked).toBe(52);
  });

  it('左ペイン用に整形しても、リード文（指示文）は必ず残る', () => {
    for (const p of Q1A) {
      const lead = stripListeningQuestionBlocks(p.text);
      expect(lead.length, `${p.id} のリード文が空になっている`).toBeGreaterThan(20);
      // 選択肢の英文は残っていない（＝解答欄との重複が無い）
      expect(lead).not.toMatch(/^\s*[①②③④]/mu);
    }
  });
});

describe('実データ検証：第1問B（イラスト選択）は本文を持たない', () => {
  it('選択肢本文が無いので、マークのみのボタンになる', () => {
    for (const p of EL1_B_PROBLEMS) {
      expect(buildListeningOptionTexts(p).size).toBe(0);
    }
  });

  it('代わりに設問ごとのイラストを持っている（判断材料が解答欄の中にある）', () => {
    for (const p of EL1_B_PROBLEMS) {
      for (const sq of p.subQuestions as any[]) {
        expect(sq.imageUrl).toMatch(/^\/listening_q1b\/.+\.jpg$/);
      }
    }
  });
});

/**
 * ===================================================================
 * 問ごと表示のスコープ（ネタバレ防止）のテスト
 * ===================================================================
 * ご指摘：
 *   「問1の問題なのになぜ右側の共通ポイントに問4までの答えがあるのか。
 *     左側も問題をなぜ問4まで乗せるの？問ごとに切ってるんだから
 *     解答と解説の方も対応させないと。」
 *
 * ここが壊れると
 *   ・解説画面の左ペインに、まだ解いていない問の選択肢が全部出る
 *   ・共通ポイント欄に問1〜問4の正解一覧が出る（未着手の問のネタバレ）
 * という「1問ずつ解く」設計を台無しにする不具合になる。
 */
import { sliceListeningQuestionBlock } from '../src/utils/listeningOptions';
import {
  buildListeningExplanation,
  scopeListeningCommonToQuestion,
  listeningQuestionNumberOf,
} from '../src/utils/listeningExplanation';
import { sliceEnhancedBySubQuestion } from '../src/utils/explanationFormat';

describe('問ごと表示：問題文のスコープ（sliceListeningQuestionBlock）', () => {
  it('問1指定なら、リード文＋問1のブロックだけが残り、問2〜問4は消える', () => {
    for (const p of EL1_A_PROBLEMS) {
      const scoped = sliceListeningQuestionBlock(p.text, 1);
      expect(scoped, `${p.id}: 問1が残っていない`).toMatch(/^問\s*1/mu);
      expect(scoped, `${p.id}: 問2が残っている（ネタバレ）`).not.toMatch(/^問\s*2/mu);
      expect(scoped, `${p.id}: 問3が残っている（ネタバレ）`).not.toMatch(/^問\s*3/mu);
      expect(scoped, `${p.id}: 問4が残っている（ネタバレ）`).not.toMatch(/^問\s*4/mu);
    }
  });

  it('最後の問（問4）を指定しても、その問のブロックが取り出せる', () => {
    for (const p of EL1_A_PROBLEMS) {
      const scoped = sliceListeningQuestionBlock(p.text, 4);
      expect(scoped, `${p.id}: 問4が残っていない`).toMatch(/^問\s*4/mu);
      expect(scoped, `${p.id}: 問1が残っている`).not.toMatch(/^問\s*1（/mu);
    }
  });

  it('問Nの区切りを持たないテキストは全文をそのまま返す（安全側）', () => {
    const text = '区切りの無い普通の問題文です。\n選びなさい。';
    expect(sliceListeningQuestionBlock(text, 1)).toBe(text);
  });
});

describe('問ごと表示：共通解説のスコープ（scopeListeningCommonToQuestion）', () => {
  it('問1指定なら、解答一覧から問2〜問4の【解答】行が消える', () => {
    for (const p of EL1_A_PROBLEMS) {
      const enhanced = buildListeningExplanation(p);
      if (!enhanced) continue;
      const slices = sliceEnhancedBySubQuestion(enhanced);
      expect(slices, `${p.id}: 小問マーカーが無い`).not.toBeNull();
      const common = [slices!.common, slices!.shared].filter((s) => s.trim()).join('\n');
      const scoped = scopeListeningCommonToQuestion(common, 1);
      // 問2〜問4 の解答行は残っていないこと
      expect(scoped).not.toMatch(/問\s*2\s*　.*【解答】/u);
      expect(scoped).not.toMatch(/問\s*3\s*　.*【解答】/u);
      expect(scoped).not.toMatch(/問\s*4\s*　.*【解答】/u);
      // 「この形式の解き方」（一般論）は残す
      if (common.includes('この形式の解き方')) {
        expect(scoped).toContain('この形式の解き方');
      }
    }
  });

  it('問番号が取れない場合（null）は何も削らない（安全側）', () => {
    const common = '問1　【解答】①\n問2　【解答】③';
    expect(scopeListeningCommonToQuestion(common, null)).toBe(common);
  });

  it('小問ラベルから問番号を取り出せる（listeningQuestionNumberOf）', () => {
    for (const p of EL1_A_PROBLEMS) {
      for (const sq of p.subQuestions as any[]) {
        expect(listeningQuestionNumberOf(sq), `${sq.id} の問番号が取れない`).not.toBeNull();
      }
    }
  });
});

/**
 * ===================================================================
 * 難易度表記の分離（extractListeningDifficulty / stripListeningDifficulty）
 * ===================================================================
 * ご要望：
 *   「難易度：易しめ」等の表記は解答操作の妨げになるため、
 *   問題文カード内の目立たない位置（末尾など）に小さく表示する。
 */
import {
  extractListeningDifficulty,
  stripListeningDifficulty,
  buildListeningLeadText,
} from '../src/utils/listeningOptions';
import { EL1_A_EXTRA_PROBLEMS as EXTRA } from '../src/data/englishListeningQ1ASets';

describe('難易度表記の分離', () => {
  it('【難易度：易しめ（導入）】から中身を取り出せる', () => {
    expect(extractListeningDifficulty('第2回　第1問 A　【難易度：易しめ（導入）】')).toBe('易しめ（導入）');
    expect(extractListeningDifficulty('【難易度: 標準】')).toBe('標準');
    expect(extractListeningDifficulty('難易度の表記なし')).toBeNull();
  });

  it('タイトル行から【難易度：…】が消え、他の文は残る', () => {
    const s = stripListeningDifficulty('第2回　第1問 A（4問・2回読み）　【難易度：易しめ（導入）】');
    expect(s).not.toContain('難易度');
    expect(s).toContain('第2回　第1問 A（4問・2回読み）');
  });

  it('実データ：難易度つきの回はリード文から抽出・除去できる', () => {
    let checked = 0;
    for (const p of EXTRA) {
      const lead = buildListeningLeadText(p.text);
      const d = extractListeningDifficulty(lead);
      if (d) {
        checked += 1;
        expect(stripListeningDifficulty(lead)).not.toContain('【難易度');
      }
    }
    // PDF由来の13回分はすべて難易度表記を持っている
    expect(checked).toBeGreaterThanOrEqual(13);
  });
});
