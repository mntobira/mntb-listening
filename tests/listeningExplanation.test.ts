/**
 * ===================================================================
 * 英語リスニングの解説の「並び」と「決め手」のテスト
 * ===================================================================
 * ご要望（そのまま）：
 *   > あと解説は、解答の道筋よりも以前にスクリプトをまずは出すこと。
 *   > その後でそのスクリプトのどの単語を聞き取れればよかったのか、
 *   > どの表現を聞き取れればよかったのかをしっかりと反映すること。
 *   > スクリプトはすくりぷとだけで枠で囲んでくれると見やすい。
 *   > 解説が長すぎるというか変に多くて、どこが大事なのかどうかわかんないんだよね。
 *
 * これを C3／C4／C5 の3点に分けて固定する。
 *   C3 スクリプトが「解答の道すじ」より *前* にあること
 *   C4 「どの語を聞き取れればよかったか」が示され、
 *      しかもそれが *スクリプトの中に実在する* こと
 *   C5 スクリプトは枠の中に英文だけ／全問共通の一般論は小問の中で繰り返さないこと
 *
 * この並びは、別の修正で汎用エンジン側に戻されると静かに壊れる
 * （画面は表示され続けるが、スクリプトが解説の奥に埋もれる）ため、
 * 「壊れたら気づける」形でテストに固定しておく。
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { EL1_A_PROBLEMS } from '../src/data/englishListeningQ1AProblems';
import { EL1_A_EXTRA_PROBLEMS } from '../src/data/englishListeningQ1ASets';
import { EL1_B_PROBLEMS } from '../src/data/englishListeningQ1BProblems';
// このインポートで、解説を整形する副作用（IIFE）が走る。
// 以降 p.explanation は整形後の文字列になる。
import '../src/data/englishListeningData';
import {
  buildListeningExplanation,
  scriptBox,
  locateListeningEvidence,
  pickScript,
  extractDecisivePhrases,
  areStepsSharedAcrossSubQuestions,
  sharedSteps,
  isScriptFirstExplanation,
  LISTENING_SCRIPT_FIRST_MARK,
} from '../src/utils/listeningExplanation';
import { sliceEnhancedBySubQuestion } from '../src/utils/explanationFormat';
import { sanitizeInlineHtml } from '../src/utils/sanitizeHtml';

const ROOT = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf-8');

/** 収録済みのリスニング問題すべて（第1問A 14回 ＋ 第1問B 15回） */
const ALL_PROBLEMS: any[] = [
  ...(EL1_A_PROBLEMS as any[]),
  ...(EL1_A_EXTRA_PROBLEMS as any[]),
  ...(EL1_B_PROBLEMS as any[]),
];

/** すべての小問を (problem, subQuestion) の組で列挙する */
const ALL_SUBS: { problem: any; sq: any }[] = ALL_PROBLEMS.flatMap((problem) =>
  (problem.subQuestions as any[]).map((sq) => ({ problem, sq })),
);

/** HTML タグを外して素のテキストにする（並び順の検査に使う） */
const toText = (html: string) => String(html).replace(/<[^>]*>/g, '\n');

describe('リスニングの解説：スクリプトを最初に出す（C3）', () => {
  it('収録した29回ぶんすべてがリスニング専用の並びで整形されている', () => {
    expect(ALL_PROBLEMS.length).toBe(29);
    for (const p of ALL_PROBLEMS) {
      expect(isScriptFirstExplanation(p.explanation), `${p.id} が専用整形されていない`).toBe(true);
    }
  });

  it('小問を開いたとき、スクリプトが「解答の道すじ」より前にある', () => {
    for (const p of ALL_PROBLEMS) {
      const slices = sliceEnhancedBySubQuestion(p.explanation);
      expect(slices, `${p.id} を小問に切り出せない`).not.toBeNull();
      for (const sub of slices!.subs) {
        const scriptAt = sub.body.indexOf('SCRIPT ／ 実際に流れた英文');
        const reasonAt = sub.body.indexOf('解答の道すじ');
        expect(scriptAt, `${p.id}/${sub.id} にスクリプトの枠が無い`).toBeGreaterThanOrEqual(0);
        if (reasonAt >= 0) {
          // ★これがご要望の核心★ スクリプトが道すじより前にあること
          expect(scriptAt, `${p.id}/${sub.id} でスクリプトが道すじより後ろにある`).toBeLessThan(
            reasonAt,
          );
        }
      }
    }
  });

  it('スクリプトは「聞き取りの決め手」よりも前にある（音 → 決め手 の順）', () => {
    for (const { problem, sq } of ALL_SUBS) {
      const slices = sliceEnhancedBySubQuestion(problem.explanation)!;
      const sub = slices.subs.find((s) => s.id === sq.id);
      if (!sub) continue;
      const scriptAt = sub.body.indexOf('SCRIPT ／ 実際に流れた英文');
      const decisiveAt = sub.body.indexOf('聞き取りの決め手');
      if (decisiveAt >= 0) {
        expect(scriptAt, `${sq.id} で決め手がスクリプトより前にある`).toBeLessThan(decisiveAt);
      }
    }
  });

  it('小問の本文には、実際に流れた英文がそのまま入っている', () => {
    for (const { problem, sq } of ALL_SUBS) {
      const { script } = pickScript(problem, sq);
      expect(script.length, `${sq.id} のスクリプトが取れない`).toBeGreaterThan(5);
      const slices = sliceEnhancedBySubQuestion(problem.explanation)!;
      const sub = slices.subs.find((s) => s.id === sq.id);
      expect(sub, `${sq.id} の小問セクションが無い`).toBeTruthy();
      // 記号のエスケープを戻してから照合する
      const body = sub!.body.replace(/<sup>\d+<\/sup>/g, '').replace(/<\/?mark\b[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      expect(body, `${sq.id} の本文にスクリプトが無い`).toContain(script);
    }
  });

  it('画面側は「スクリプト先出し」のときだけ道すじの重複表示を止めている', () => {
    // ここが外れると、全問共通の一般論がスクリプトより前に4問ぶん並んでしまう。
    const source = read('src/components/Explanation.tsx');
    expect(source).toContain('isScriptFirstExplanation');
    expect(source).toContain('const isScriptFirst = isScriptFirstExplanation(sqSliceRaw)');
    expect(source).toContain('{!isScriptFirst && isPracticeMode && sq.detailedExplanation?.steps?.length > 0');
  });
});

describe('リスニングの解説：どの語を聞き取れればよかったか（C4）', () => {
  it('116問すべてに「聞き取りの決め手」が1つ以上ある', () => {
    expect(ALL_SUBS.length).toBe(116);
    for (const { problem, sq } of ALL_SUBS) {
      const { script } = pickScript(problem, sq);
      const phrases = extractDecisivePhrases(problem, sq, script);
      expect(phrases.length, `${sq.id} の決め手が空`).toBeGreaterThan(0);
    }
  });

  it('決め手はすべてスクリプトの中に実在する（枠の中で必ず見つかる）', () => {
    // スクリプトに無い表現を「これを聞き取れれば良かった」と出すと、
    // 生徒は枠の中を探して見つからず、混乱するだけになる。
    for (const { problem, sq } of ALL_SUBS) {
      const { script } = pickScript(problem, sq);
      const lower = script.toLowerCase();
      for (const item of extractDecisivePhrases(problem, sq, script)) {
        const inScript = lower.includes(item.phrase.toLowerCase());
        if (inScript) continue;
        // 手書きの keyPhrases は辞書の見出し形（forget A on the train）なので
        // 文字どおりには一致しない。その場合は意味の説明が付いていること＝
        // 人が書いたデータであることを確認する。
        expect(
          item.meaning.length,
          `${sq.id} の決め手「${item.phrase}」がスクリプトに無く、意味の説明も無い`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('決め手を並べ過ぎない（多くても3つ）', () => {
    // ご要望は「変に多くてどこが大事か分からない」なので、
    // 決め手を並べすぎたら本末転倒になる。
    for (const { problem, sq } of ALL_SUBS) {
      const { script } = pickScript(problem, sq);
      const phrases = extractDecisivePhrases(problem, sq, script);
      expect(phrases.length, `${sq.id} の決め手が多すぎる`).toBeLessThanOrEqual(3);
    }
  });

  it('決め手にスクリプト全文を丸ごと出さない', () => {
    // 全文を指されても「どこが大事か」は何も分からない。
    for (const { problem, sq } of ALL_SUBS) {
      const { script } = pickScript(problem, sq);
      const scriptWords = (script.match(/[A-Za-z][A-Za-z'’]*/gu) || []).length;
      for (const item of extractDecisivePhrases(problem, sq, script)) {
        const words = item.phrase.split(/\s+/u).filter(Boolean).length;
        expect(
          words,
          `${sq.id} の決め手「${item.phrase}」がスクリプトのほぼ全文になっている`,
        ).toBeLessThanOrEqual(Math.max(2, Math.ceil(scriptWords * 0.6)));
      }
    }
  });

  it('手書きの keyPhrases（意味つき）は捨てられず、先頭に出る', () => {
    // 意味の説明が付いたデータは人が書いたいちばん価値の高い情報なので、
    // 機械的に拾った語より先に見せる。
    const p: any = EL1_A_PROBLEMS[0];
    const sq = p.subQuestions[0];
    const { script } = pickScript(p, sq);
    const phrases = extractDecisivePhrases(p, sq, script);
    expect(phrases[0].meaning.length).toBeGreaterThan(0);
    // 「forget A on the train」のように語形が変わる見出し形でも採用されること
    expect(phrases.some((x) => x.meaning.includes('置き忘れ'))).toBe(true);
  });

  it('過去に取りこぼしていた15問にも決め手が入っている', () => {
    // 一度は「自動では拾えない」と判定した小問。
    // 取りこぼしが再発したらここで気づけるようにしておく。
    const GAP_IDS = [
      'q_el1_A_set2_4', 'q_el1_A_set3_3', 'q_el1_A_set7_4', 'q_el1_A_set8_3',
      'q_el1_A_set8_4', 'q_el1_A_set11_4', 'q_el1_A_set14_2',
      'q_el1_B_set2_3', 'q_el1_B_set4_4', 'q_el1_B_set5_4', 'q_el1_B_set7_1',
      'q_el1_B_set7_4', 'q_el1_B_set12_3', 'q_el1_B_set15_3', 'q_el1_B_set15_4',
    ];
    for (const id of GAP_IDS) {
      const found = ALL_SUBS.find((x) => x.sq.id === id);
      expect(found, `${id} が見つからない`).toBeTruthy();
      const { script } = pickScript(found!.problem, found!.sq);
      const phrases = extractDecisivePhrases(found!.problem, found!.sq, script);
      expect(phrases.length, `${id} の決め手が空`).toBeGreaterThan(0);
    }
  });
});

describe('リスニングの解説：枠と分量（C5）', () => {
  it('スクリプトは枠で囲まれ、中身は英文（と和訳）だけ', () => {
    const html = scriptBox('I forgot it on the train.', '電車に忘れました。');
    // 枠であること
    expect(html).toContain('border:2px solid #3E9C93');
    // 英文と和訳が入っていること
    expect(html).toContain('I forgot it on the train.');
    expect(html).toContain('電車に忘れました。');
    // 枠の中に解説の見出し（決め手・道すじ）が混ざっていないこと
    expect(html).not.toContain('聞き取りの決め手');
    expect(html).not.toContain('解答の道すじ');
  });

  it('スクリプトが無いときは枠を作らない（空の枠を出さない）', () => {
    expect(scriptBox('')).toBe('');
    expect(scriptBox('   ')).toBe('');
  });

  it('枠は sanitizeHtml を通しても消えない', () => {
    // class ではなく style で書いているのは、この検査を通すため。
    const html = scriptBox('Only twelve students signed up.');
    const safe = sanitizeInlineHtml(html);
    expect(safe).toContain('border:2px solid #3E9C93');
    expect(safe).toContain('Only twelve students signed up.');
    expect(safe).toContain(LISTENING_SCRIPT_FIRST_MARK);
  });

  it('枠の中の記号はエスケープされる（生の英文をそのまま置くため）', () => {
    const html = scriptBox('a < b & c > d');
    expect(html).toContain('a &lt; b &amp; c &gt; d');
  });

  it('全問共通の一般論は小問の中で繰り返さない（同じ4行が4回出ない）', () => {
    // ご要望「解説が長すぎるというか変に多くて、どこが大事か分からない」の正体。
    // 実データでは 52問／60問がまったく同じ4行の手順を持っていた。
    for (const p of ALL_PROBLEMS) {
      const common = sharedSteps(p);
      if (common.length === 0) continue;
      const slices = sliceEnhancedBySubQuestion(p.explanation)!;
      const first = common[0];
      for (const sub of slices.subs) {
        expect(
          sub.body.includes(first),
          `${p.id}/${sub.id} の中に全問共通の一般論が入り込んでいる`,
        ).toBe(false);
      }
      // 全体では1回だけ出ている（情報は削られていない）
      const occurrences = p.explanation.split(first).length - 1;
      expect(occurrences, `${p.id} の共通手順が1回になっていない`).toBe(1);
    }
  });

  it('共通の一般論かどうかを、文言の決め打ちではなく構造で判定している', () => {
    // 「全小問で同一なら、その問固有の話ではない」という構造だけで判定する。
    // こうしておけば、データの文言が変わっても正しく効き続ける。
    const steps = ['① 通して聞く', '② but を探す', '③ 半分に切る', '④ 確定する'];
    const allSame = {
      subQuestions: [
        { id: 'a', detailedExplanation: { steps: [...steps] } },
        { id: 'b', detailedExplanation: { steps: [...steps] } },
      ],
    };
    expect(areStepsSharedAcrossSubQuestions(allSame)).toBe(true);
    expect(sharedSteps(allSame)).toEqual(steps);

    const different = {
      subQuestions: [
        { id: 'a', detailedExplanation: { steps: ['① 固有の話'] } },
        { id: 'b', detailedExplanation: { steps: ['① べつの固有の話'] } },
      ],
    };
    expect(areStepsSharedAcrossSubQuestions(different)).toBe(false);
    expect(sharedSteps(different)).toEqual([]);

    // 小問が1つだけのときは「共通」と判断しない（比べる相手がいない）
    expect(
      areStepsSharedAcrossSubQuestions({
        subQuestions: [{ id: 'a', detailedExplanation: { steps } }],
      }),
    ).toBe(false);
  });

  it('小問1つぶんの本文が長くなりすぎない（読み切れる分量）', () => {
    // 「長すぎて、どこが大事か分からない」への歯止め。
    // 手書きの第1回だけは元から詳しいので、機械生成の28回ぶんを見る。
    const generated = [...(EL1_A_EXTRA_PROBLEMS as any[]), ...(EL1_B_PROBLEMS as any[])];
    for (const p of generated) {
      const slices = sliceEnhancedBySubQuestion(p.explanation)!;
      for (const sub of slices.subs) {
        const text = toText(sub.body).replace(/\n+/g, '\n').trim();
        expect(text.length, `${p.id}/${sub.id} の本文が長すぎる`).toBeLessThan(1200);
      }
    }
  });
});

describe('リスニングの解説：安全側の作り', () => {
  it('スクリプトが無い問題では専用整形を行わない（汎用エンジンに任せる）', () => {
    // 無理に専用整形をかけて情報が欠けるほうが害が大きい。
    expect(buildListeningExplanation({ subQuestions: [] })).toBe('');
    expect(
      buildListeningExplanation({
        explanation: '解説',
        subQuestions: [{ id: 'x', label: '問1', correctAnswer: '②' }],
        audioTracks: [],
      }),
    ).toBe('');
    expect(buildListeningExplanation(null)).toBe('');
    expect(buildListeningExplanation(undefined)).toBe('');
  });

  it('解説の「問N　正解は ○」が解答データと一致している', () => {
    // 解説を読んだら正解が違う、という最悪の不整合を防ぐ命綱。
    for (const p of ALL_PROBLEMS) {
      for (const sq of p.subQuestions as any[]) {
        const no = String(sq.label || '').match(/問\s*(\d+)/u)?.[1];
        expect(no, `${sq.id} のラベルに問番号が無い`).toBeTruthy();
        const m = p.explanation.match(new RegExp(`問${no}\\s*正解は\\s*([①②③④])`));
        expect(m, `${sq.id} の解説に正解の行が無い`).not.toBeNull();
        expect(m![1], `${sq.id} の解説と解答が食い違っている`).toBe(sq.correctAnswer);
      }
    }
  });

  it('小問の見出しは行頭の「問N」から始まる（アコーディオン整形の条件）', () => {
    for (const p of ALL_PROBLEMS) {
      for (let n = 1; n <= (p.subQuestions as any[]).length; n += 1) {
        expect(p.explanation, `${p.id} に問${n}の見出しが無い`).toMatch(
          new RegExp(`^問${n}`, 'm'),
        );
      }
    }
  });
});


describe('literal listening evidence locations', () => {
  it('matches case, whitespace and typographic apostrophes while preserving offsets', () => {
    const script = "I’ll go\nto bed early. Only on Monday.";
    const hits = locateListeningEvidence(script, ["I'll go to bed", 'on', 'only']);
    expect(hits.map(hit => script.slice(hit.start,hit.end))).toEqual(['I’ll go\nto bed', 'Only', 'on']);
  });
  it('does not invent a location for dictionary forms or match inside another word', () => {
    expect(locateListeningEvidence('I forgot it. Only today.', ['forget A', 'on'])).toEqual([]);
  });
  it('escapes regex syntax and highlights repeated literal phrases', () => {
    const text = 'Take A+B. Then A+B.';
    expect(locateListeningEvidence(text,['A+B'])).toHaveLength(2);
  });
  it('keeps numbered marks after sanitizing and escapes script HTML', () => {
    const html = sanitizeInlineHtml(scriptBox('<img onerror=alert(1)> go home', '', ['go home']));
    expect(html).toContain('listening-evidence');
    expect(html).toContain('<sup>1</sup>go home');
    expect(html).not.toContain('<img');
  });
});
