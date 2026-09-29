/**
 * ===================================================================
 * 英語リスニング Wave D：1画面＝1問／選択肢を先に見せる／音源は問題側
 * ===================================================================
 * ご要望（原文）：
 *   > リスニングの修正をしたい。今リスニングは、第1問Aだったらどの回も
 *   > 問1〜問4を同じ進捗に入れてると思うんだけど、それもうやめて、
 *   > 問1で1つの進捗、問2で1つの進捗みたいな感じにしてほしい。
 *   > だから解説も修正な。で、後、問題文はスマホでスクロールとかしなくても
 *   > 選択肢の英文と図が一目に映るようにしてほしい。だから、選択肢の英文と図は
 *   > スマホだったら上に持ってきて、パソコンだったら右に持ってきてほしい。
 *   > 選択肢のところに英文を載せるのはまあいいけど、図は選択肢のところに
 *   > 載せるのやめよう。見にくい。いまこの音源の聞き方とかはもういらないので、
 *   > 問題をつけた今のこの上場面に4つの英文がしっかりと映るもしくは、
 *   > 図がしっかりと映るようにしてほしい。スクロールしてわざわざ答えるのめんどい。
 *   > 後音源はその画面の上側の問題のところに設置すること。
 *   > 選択肢のところに設置しても押しずらい
 *
 * これを D1〜D5 に分解してテストで固定する。
 *   D1  進捗を「問ごと」にする（回まるごと1進捗をやめる）
 *   D1b 解説も「その問だけ」に絞る
 *   D2  選択肢の英文・図はスマホでは上／PCでは右（スクロール不要）
 *   D3  図は選択肢の中に載せない
 *   D4  【音源の聞き方】等の定型ブロックを問題文から落とす
 *   D5  音源は画面上側の「問題のところ」に置く
 *
 * ★続き（差し戻しを受けた修正 E1〜E4）★
 * 1回目の実装をお見せしたところ、次のご指摘をいただいた（原文）：
 *   > 解答のところは変わってるけど、問題のところさ、全部の問いがまとまってて
 *   > どの問いを解いているかが分からない。で再生ボタンはさ、
 *   > 左の問題の文章のところにおいてほしいよね。何で解答の方に置くの？
 *   > 第１問の図も何で解答の方にあるの？問題の方（左側）においてっていったよね。
 *   > 勝手に左右の２画面の比も変えないでよ。
 *
 *   E1  左ペインに問1〜問4が全部残っていた → いま解いている問だけにする
 *   E2  再生ボタンは左（問題文）ペインに置く（解答側に置かない）
 *   E3  図も左（問題文）ペインに置く（解答側に置かない）
 *   E4  左右2画面の比（58% / 42%・50vh）は変えない
 *
 * ★重要（回帰防止）★
 *   進捗を問ごとにするために教材データ（practiceProblems）を分割してはいけない。
 *   分割すると進捗台帳のキー（章ID::大問ID）が総入れ替えになり、
 *   これまでの学習記録が全部リセットされる。ここもテストで固定する。
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildListeningSteps,
  isPerSubQuestionListening,
  stepLabelOf,
  stepScoreKey,
} from '../src/utils/listeningSteps';
import { buildListeningLeadText, stripListeningHowToBlocks } from '../src/utils/listeningOptions';
import { EL1_A_EXTRA_PROBLEMS } from '../src/data/englishListeningQ1ASets';
import { EL1_B_PROBLEMS } from '../src/data/englishListeningQ1BProblems';
import { getAllListeningChapters } from '../src/data/englishListeningData';
import { chemistryData } from '../src/data/chemistryData';

const ROOT = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf-8');

const QUIZ = read('src/components/Quiz.tsx');
// 問題文ペイン（左58%／スマホ上）の JSX は components/ProblemPane.tsx へ切り出した。
const PROBLEM = read('src/components/ProblemPane.tsx');
// 解答ペイン（右42%／スマホ下）の JSX は components/AnswerPane.tsx へ切り出した。
const ANSWER = read('src/components/AnswerPane.tsx');
// 章の途中経過（ChapterRunState / perStep）の型は Quiz.tsx から
// utils/quizRunState.ts へ切り出したので、型の見張りはそちらのソースで行う。
const RUN_STATE = read('src/utils/quizRunState.ts');
// 採点処理の本体は utils/quizScoring.ts へ切り出した（Quiz.tsx から137行）
const SCORING = read('src/utils/quizScoring.ts');
// 解答解説の画面（早期 return の JSX 50行）は components/ExplanationScreen.tsx へ
const EXPL_SCREEN = read('src/components/ExplanationScreen.tsx');
// リスニングの「問題の説明ページ」（早期 return の JSX 64行）は
// components/ListeningBriefing.tsx へ
const BRIEFING = read('src/components/ListeningBriefing.tsx');
// 設問から作る「表示用の派生値」（useMemo 17個）は
// hooks/useQuestionDerived.ts へ切り出した。
const DERIVED = read('src/hooks/useQuestionDerived.ts');
const EXPL = read('src/components/Explanation.tsx');
const PLAYER = read('src/components/ListeningAudioPlayer.tsx');
const FIGURE = read('src/components/QuestionFigure.tsx');
// 選択肢ボタンの並べ方（①②③④ のグリッド／本文つき選択肢の縦積み）は
// components/MultipleChoiceControl.tsx が持つ。
const CHOICE = read('src/components/MultipleChoiceControl.tsx');

const chapter = (id: string) => {
  const c = getAllListeningChapters().find((x) => x.id === id);
  if (!c) throw new Error(`${id} が見つかりません`);
  return c;
};

// =====================================================================
// D1: 進捗を「問ごと」にする
// =====================================================================
describe('D1: 1画面＝1問（問1で1つの進捗、問2で1つの進捗）', () => {
  it('リスニングの大問は「1問ずつ」の対象になる', () => {
    // 第1問A・第1問B はどちらも音源つき・小問複数なので対象。
    expect(isPerSubQuestionListening(EL1_A_EXTRA_PROBLEMS[0])).toBe(true);
    expect(isPerSubQuestionListening(EL1_B_PROBLEMS[0])).toBe(true);
  });

  it('化学の大問は対象外（(1)の結果を(2)で使う構成を壊さない）', () => {
    // 音源を持たないので false。1問ずつに切ると前の設問を見返せず解けなくなる。
    const chem = (chemistryData as any).parts
      .flatMap((p: any) => p.chapters || [])
      .flatMap((c: any) => [...(c.miniTest || []), ...(c.practiceProblems || [])]);
    expect(chem.length).toBeGreaterThan(0);
    for (const p of chem) {
      expect(isPerSubQuestionListening(p)).toBe(false);
    }
  });

  it('音源はあっても小問が1つだけなら分割しない（分ける意味がない）', () => {
    expect(
      isPerSubQuestionListening({
        audioTracks: [{ subId: 'a' }],
        subQuestions: [{ id: 'a' }],
      }),
    ).toBe(false);
  });

  it('第1問A の1回ぶんが 問1〜問4 の4ステップに分かれる', () => {
    const steps = buildListeningSteps(EL1_A_EXTRA_PROBLEMS[0]);
    expect(steps.map((s) => s.label)).toEqual(['問1', '問2', '問3', '問4']);
    expect(steps.map((s) => s.index)).toEqual([0, 1, 2, 3]);
    // 各ステップのIDは、その回の小問IDと1対1で対応する
    expect(steps.map((s) => s.subQuestionId)).toEqual(
      EL1_A_EXTRA_PROBLEMS[0].subQuestions.map((sq: any) => sq.id),
    );
  });

  it('全リスニング大問でステップ数＝小問数（取りこぼしゼロ）', () => {
    for (const p of [...EL1_A_EXTRA_PROBLEMS, ...EL1_B_PROBLEMS]) {
      expect(buildListeningSteps(p).length).toBe(p.subQuestions.length);
    }
  });

  it('ラベルが「問N」で無いときも並び順から番号を作る（空表示にしない）', () => {
    expect(stepLabelOf({ label: '問 3 発話に合うイラスト' }, 0)).toBe('問3');
    expect(stepLabelOf({ label: '発話に合うイラスト' }, 1)).toBe('問2');
    expect(stepLabelOf({}, 2)).toBe('問3');
  });

  it('採点キーは「大問ID::小問ID」で、問ごとに別レコードになる', () => {
    expect(stepScoreKey('q_el1_A_set2', 'sq_x')).toBe('q_el1_A_set2::sq_x');
    expect(stepScoreKey('q1', 'a')).not.toBe(stepScoreKey('q1', 'b'));
  });

  it('Quiz が step の位置を端末に保存し、再開しても続きから解ける', async () => {
    expect(QUIZ).toContain('const [stepIndex, setStepIndex]');

    // 保存キー名は utils/quizStorageKeys.ts へ集約したため、
    // 「ソースに quiz_step_ と書いてあるか」では意図
    // （＝ステップ位置が章・モードごとに端末へ保存されること）を守れない。
    // 代わりに Quiz が使っているキー生成関数そのものを確認する。
    expect(QUIZ).toContain('quizStepKey(chapter.id, mode)');
    const { quizStepKey } = await import('../src/utils/quizStorageKeys');
    expect(quizStepKey('q_el1_A', 'practice')).toBe('quiz_step_q_el1_A_practice');
    // 章・モードが違えば別レコードになる（他の回の続きが出てこない）
    expect(quizStepKey('q_el1_A', 'practice')).not.toBe(quizStepKey('q_el1_B', 'practice'));
    expect(quizStepKey('q_el1_A', 'practice')).not.toBe(quizStepKey('q_el1_A', 'mini_test'));
  });

  it('進捗ピルの分子・分母が問単位に切り替わる', () => {
    expect(QUIZ).toContain('const progressTotal = perStep ? listeningSteps.length : rangeCount');
    expect(QUIZ).toContain('const progressPosition = perStep ? safeStepIndex + 1 : rangePosition');
  });

  it('最後の問を解き終えるまで結果画面に進まない', () => {
    expect(QUIZ).toContain('const isLastStep = !perStep || safeStepIndex >= listeningSteps.length - 1');
    expect(QUIZ).toContain('const isLastQuestion = currentQuestionIndex >= rangeEnd && isLastStep');
  });

  it('「前へ」で回の先頭からでも前の回へ戻れる（押せないボタンを残さない）', () => {
    expect(QUIZ).toContain('const canGoPrevious');
    // 旧実装の「大問インデックスが0か」だけの判定は残っていない
    expect(QUIZ).not.toContain('currentQuestionIndex === 0');
  });

  it('解答欄には「いま解いている問」だけを描画する', () => {
    expect(DERIVED).toContain('const visibleGroupedSubQuestions');
    // スマホはさらに「1ページ＝1解答欄」に絞った renderedAnswerGroups を描画する
    // （PC は renderedAnswerGroups = visibleGroupedSubQuestions のまま）。
    expect(DERIVED).toContain('const renderedAnswerGroups');
    expect(DERIVED).toContain('if (isDesktop) return visibleGroupedSubQuestions;');
    expect(ANSWER).toContain('renderedAnswerGroups.map(');
  });
});

// =====================================================================
// D1 回帰防止：教材データは分割しない（学習記録を守る）
// =====================================================================
describe('D1 回帰防止：進捗台帳のキーを壊さない', () => {
  it('第1問A/B の大問数は据え置き（14 / 15）', () => {
    // ここが変わると solved_problems_v1 のキーが総入れ替えになり、
    // これまでの学習記録が全部「未着手」に戻る。
    expect(chapter('el1_A').practiceProblems.length).toBe(14);
    expect(chapter('el1_B').practiceProblems.length).toBe(15);
  });

  it('小問単位の採点は perQuestion ではなく perStep に入れる', () => {
    // progress.ts の backfillLegacyProgress は perQuestion のキーを
    // 「大問ID」としてそのまま読む。小問キーを混ぜると存在しない大問を
    // 解いたと数え、進捗が分母を超えてしまう。
    expect(RUN_STATE).toContain('perStep?: Record<string');
    // 採点の記録先の振り分けは utils/quizScoring.ts が持っている。
    expect(SCORING).toMatch(/perQuestion:\s*perStep\s*\?\s*run\.perQuestion/);
    expect(SCORING).toMatch(/perStep:\s*perStep\s*\?\s*\{\s*\.\.\.\(run\.perStep \|\| \{\}\)/);
    // Quiz.tsx に古い採点コードが残って二重になっていないことも見る。
    expect(QUIZ).not.toMatch(/perQuestion:\s*perStep\s*\?/);
  });
});

// =====================================================================
// D1b: 解説も「その問だけ」に絞る
// =====================================================================
describe('D1b: 解説も問ごと（先の問の正解が見えないようにする）', () => {
  it('Explanation が「いま解いた1問」を受け取れる', () => {
    expect(EXPL).toContain('focusSubQuestionId?: string | null');
    expect(EXPL).toContain('focusSubQuestionId }: ExplanationProps');
  });

  it('その問だけに subQuestions を絞り込む', () => {
    expect(EXPL).toContain('if (!focusSubQuestionId) return picked;');
    expect(EXPL).toContain('subs.filter((sq: any) => sq?.id === focusSubQuestionId)');
    expect(EXPL).toContain('subQuestions: hit,');
  });

  it('復習用の音源もその問のトラックだけにする', () => {
    expect(EXPL).toContain("tracks.filter((t: any) => t?.subId === focusSubQuestionId)");
  });

  it('解説へ「いま解いた問」を渡している', () => {
    // 解答解説の画面は components/ExplanationScreen.tsx へ切り出した。
    expect(EXPL_SCREEN).toContain('focusSubQuestionId={perStep && activeStepSub ? activeStepSub.id : null}');
    // Quiz.tsx に古い JSX が残って二重になっていないことも見る。
    expect(QUIZ).not.toContain('focusSubQuestionId=');
    // Quiz.tsx は「切り出した画面を1回だけ呼ぶ」形になっている。
    expect(QUIZ).toContain('<ExplanationScreen');
    expect((QUIZ.match(/<ExplanationScreen/g) || []).length).toBe(1);
  });

  it('解説のスコアも問ごとの記録（perStep）から引く', () => {
    expect(EXPL_SCREEN).toMatch(/run\.perStep\?\.\[stepScoreKey\(currentQuestion\.id, activeStepSub\.id\)\]/);
    expect(QUIZ).not.toMatch(/run\.perStep\?\.\[stepScoreKey\(/);
  });
});

// =====================================================================
// D2（改）: スマホは全教科とも「問題が上・解答が下」に統一する
// =====================================================================
// ご指摘：「問題文と解答入力を逆にして。(リスニングの話)
//         選択肢を見せるということに気が取られて問題が見えない
//         スクロールがしにくい　図も見えない」
// 以前はリスニングだけ flex-col-reverse（解答が上）にしていたが、
// 問題文が「下からせり出すカード」になり問題・図が読めなくなった。
describe('D2（改）: 問題が上・解答が下（自然な読み順）', () => {
  it('上下を入れ替える flex-col-reverse は使わない', () => {
    expect(QUIZ).not.toContain('flex-col-reverse');
    // PC（lg:flex-row）では従来どおり左＝問題文／右＝解答。
    expect(QUIZ).toContain('lg:flex-row');
  });

  /*
    ★方針を変えた箇所★
    以前ここは「リスニングの問題ペインは 40vh 上限」を期待していた。
    しかしご指摘
      「選択肢のところが固定されてるけど、選択肢の下に空白合って無駄だから、
        まず固定するならもっと下にもってきて、図が隠れてるのを防いでほしい」
    により、高さの配り方を逆にした。

      旧：問題ペイン = max-h-[40vh]（上限つき） ／ 解答ペイン = flex-1
          → 図は 40vh に押し込められて隠れ、①〜④ の4ボタンしか無い
            解答ペインが余った高さを全部受け取って下に空白ができていた。

      新：問題ペイン = flex-1 min-h-0（余りを全部もらう）
          解答ペイン = flex-none（中身の高さだけ＝空白ゼロ、位置は最下部）
  */
  it('リスニング（スマホ）は問題ペインが余りの高さを全部もらう', () => {
    // ご指摘：「図が隠れてるのを防いでほしい」
    // 上限を外して flex-1 にしたので、図は使える高さいっぱいまで伸びる。
    // ★ご要望(7a)「他の大問のUIも変えてくれない？」で条件が1つ増えた★
    //   図がある大問（第1問B）だけ「問題文ペイン＝flex-1」。
    //   図が無い大問（第1問A・第3問・第2問）は flex-none にして、
    //   余った高さは解答ペイン側へ回す（下記の別テストで固定）。
    expect(PROBLEM).toContain(
      "${listeningMobileSplit && !listeningMobileNoFigure ? 'flex-1 min-h-0' : 'flex-none'}"
    );
    // 高さの連鎖（親が min-h-0 の flex）を切らないこと。
    // これが無いと <img> の max-h-full が none 扱いになり図がはみ出す。
    expect(PROBLEM).toContain("listeningMobileSplit ? 'flex flex-col px-3 pt-2 pb-3' : 'p-4'");
    // リスニングだけに効かせる（化学・数学の 42dvh は触らない）。
    expect(DERIVED).toContain('const listeningMobileSplit');
    // 旧上限には戻さない。選択肢②以降が隠れていた 32vh / 30vh も同様。
    expect(QUIZ).not.toContain("'max-h-[40vh] h-auto shadow-md relative z-20'");
    expect(QUIZ).not.toContain('max-h-[32vh]');
    expect(QUIZ).not.toContain('max-h-[30vh]');
  });

  it('リスニングの解答ペインは中身の高さだけ取り、下部ナビの直上に置く', () => {
    // ご指摘：「選択肢の下に空白合って無駄」
    // 原因は解答ペインの flex-1。リスニングだけ flex-none にして空白を消す。
    expect(ANSWER).toContain("listeningMobileSplit ? 'flex-none pt-2' : 'flex-1 pt-4'");
    // 「もっと下にもってきて」＝下部ナビの高さ分だけ余白を残す
    //（余らせすぎない値。iOS のノッチは safe-area-inset で確保する）。
    expect(ANSWER).toContain('pb-[calc(4.75rem+env(safe-area-inset-bottom))]');
  });

  it('左右2画面の比は勝手に変えない（58% / 42% のまま）', () => {
    // ご指摘：「勝手に左右の２画面の比も変えないでよ」
    // 一度 46% / 54% に変えてしまったので、元の比に戻したことを固定する。
    // listeningUnified による幅の分岐が復活していないことも確認する。
    expect(PROBLEM).toContain('lg:w-[58%]');
    expect(ANSWER).toContain('lg:w-[42%]');
    expect(QUIZ).not.toContain('lg:w-[46%]');
    expect(QUIZ).not.toContain('lg:w-[54%]');
    expect(QUIZ).not.toMatch(/listeningUnified \? 'lg:w-\[/u);
  });

  it('化学・数学などリスニング以外の問題文ペインは 42dvh（実表示高さ基準）', () => {
    // ご指摘：「解答するところが問題文（上画面が長すぎて）で埋もれちゃってる」
    // iOS Safari の vh はURLバーを含む最大高さ基準のため、50vh では実際の
    // 表示領域の半分を大きく超え、解答入力欄が下部固定ナビに隠れていた。
    // dvh（実際に見えている高さ）基準の 42% に変更し、解答欄を必ず見せる。
    expect(PROBLEM).toContain('max-h-[42dvh]');
    expect(QUIZ).not.toContain("'max-h-[50vh] h-auto shadow-md relative z-20'");
  });
});

// =====================================================================
// D3: 図は選択肢の中に載せない
// =====================================================================
describe('D3: 図を選択肢の中に載せない（見にくさの解消）', () => {
  it('図に高さ上限を付けられる', () => {
    expect(FIGURE).toContain('imgClassName');
    expect(FIGURE).toContain('imgClassName = \'\'');
  });

  /*
    ★方針を変えた箇所★
    旧：スマホも 22vh の固定上限（問題ペインが 40vh だったため）。
    新：問題ペインが余りの高さを全部もらうようになったので、
        図は fill モードで「もらえた高さいっぱい」に伸ばす。
        22vh の上限は PC・非リスニング用に残す。
  */
  it('リスニングの図は親からもらえた高さいっぱいに伸ばす（fill）', () => {
    // 図は「問題のところ（左側）」の現在の問ブロックにだけ置く。
    expect(PROBLEM).toContain('fill={listeningMobileSplit}');
    /*
      ★上限を 22vh → 42vh に緩めた★
      ご要望「画像のある問題の画像が小さいので確認して。
              クリックしてズーム機能はいらない。」

      22vh（390x844 で 186px）は「小さくてもタップで拡大できる」
      前提の数字だった。拡大機能を外したので、最初から読める
      大きさで出す必要がある。42vh（=354px、ほぼ横幅と同じ）まで
      緩めても、音源バーと選択肢は同時に見える（実測で確認）。
    */
    expect(PROBLEM).toContain("listeningMobileSplit ? '' : 'max-h-[42vh] md:max-h-[52vh] object-contain'");
  });

  /*
    ★図が高さ上限に張り付いているときは、余白を図に譲る★
    実測（390x844・第1問B・900x900 の4コマ）で
      図 298x298 ／ 横幅は 366px 空いている ／ 高さの余りは 0px
    だった。＝「小さい」の原因は高さ不足なので、高さをどこかから
    もらう以外に方法がない。もらう先は選択肢のタップ領域ではなく
    純粋な余白（解答カードの p-5 と図の上余白）にする。
  */
  it('図がある大問は解答カードの余白を詰めて図に高さを譲る（タップ領域は減らさない）', () => {
    // 図がある大問（listeningMobileSplit かつ図あり）だけ p-5 → py-3.5。
    expect(ANSWER).toContain("? 'px-3 py-3.5'");
    /*
      図の上余白は 12px → 8px → ★4px★ と段階的に詰めてきた。

      ★8px → 4px にした理由★
        ご指摘（手書きの指示書）「第1問B・第2問の図を大きめに」。
        figure は fill（余り高さいっぱい）なので、上余白を削った分は
        そのまま図の高さに変わる。見出しと図のあいだは 4px でも
        「別のもの」と分かる（見出しは太字・図は枠付き）ので、
        ここは払う価値のない余白と判断した。
    */
    expect(PROBLEM).toContain("className={listeningMobileSplit ? 'mt-1' : 'mt-3'}");
    // 選択肢ボタン自身の最小高さ（3rem = 48px）は据え置き。
    expect(ANSWER).toContain('min-h-[3rem]');
  });

  it('fill は figure→button→img に高さの連鎖を通す（max-h-full を効かせる）', () => {
    // ★percentage の max-height は親の高さが確定していないと none 扱い★
    //   そのため flex + min-h-0 + flex-1 を全段に通す必要がある。
    expect(FIGURE).toContain('fill?: boolean');
    expect(FIGURE).toContain("fill ? 'flex min-h-0 flex-1 flex-col' : ''");
    expect(FIGURE).toContain("fill ? 'flex min-h-0 flex-1 items-start justify-center' : 'block'");
    // fill のときは「高さ基準で縮める」ので幅は auto のまま
    // （w-full にすると縦長の枠で横に伸びて比率が破綻する）。
    expect(FIGURE).toContain("? 'w-auto max-w-full min-h-0 max-h-full object-contain'");
    // キャプションは図に押し潰されない。
    expect(FIGURE).toContain('shrink-0');
  });

  it('図は解答カード側・スマホ固定パネル側には残さない', () => {
    // ご指摘：「第１問の図も何で解答の方にあるの？問題の方（左側）においてっていったよね」
    // 解答側（sq / focusedSub）に図を描く記述が復活していないこと。
    expect(QUIZ).not.toContain('src={sq.imageUrl}');
    expect(QUIZ).not.toContain('src={focusedSub.imageUrl}');
    // 図は activeStepSub（＝いま解いている問）に紐づけて左ペインに出す。
    expect(PROBLEM).toContain('src={activeStepSub.imageUrl}');
  });

  /*
    ★ズーム（タップで拡大）は撤去した★
    ご要望：「クリックしてズーム機能はいらない。」

    以前は「小さくてもタップで拡大できるから情報は失わない」という
    前提で強い高さ上限（22vh）を掛けていた。拡大機能を外す代わりに、
    最初から読める大きさで出すよう上限を緩めた（上記テスト参照）。
    ここでは拡大機能が復活していないことを固定する。
  */
  it('図はタップで拡大しない（ズーム機能を持たない）', () => {
    expect(FIGURE).not.toContain('cursor-zoom-in');
    expect(FIGURE).not.toContain('setZoomed');
    // ライトボックス（全画面オーバーレイ）の実装が残っていないこと。
    // 撤去の経緯は上のコメントに書いてあるので、判定はコード側の
    // 呼び出し・import だけを見る（コメント中の語に引っかからないように）。
    expect(FIGURE).not.toContain('createPortal(');
    expect(FIGURE).not.toMatch(/^import .*(createPortal|ZoomIn|AnimatePresence)/mu);
    expect(FIGURE).not.toContain('<ZoomIn');
    /*
      図は <button> ではないので、誤タップで全画面が開くことがない。
      コメント中の「<button> ではなく <div>」という説明文に
      引っかからないよう、コメントを落としたコードだけで判定する。
    */
    const figureCode = FIGURE.replace(/\/\*[\s\S]*?\*\//gu, '').replace(/\/\/[^\n]*/gu, '');
    expect(figureCode).not.toMatch(/<button/u);
  });

  /*
    ★横長の図は「高さ基準＋横スクロール」で読める大きさにする★
    実測（390x844・化学基礎「ろ過」）で 1024x288（比 3.56）の図が
    358x102 になり、器具1つが約 90x100px しかなかった。
    しきい値は「幅 366px に合わせたときに 26vh(220px) を割るか」
    ＝ 366/220 ≒ 1.66 から決めており、マジックナンバーではない。
  */
  it('横長の図は画像の実寸比から判定して高さ基準に切り替える', () => {
    // 判定はデータのフラグではなく naturalWidth/naturalHeight の実測。
    expect(FIGURE).toContain('naturalWidth');
    expect(FIGURE).toContain('naturalHeight');
    expect(FIGURE).toContain('const FIG_ASPECT_THRESHOLD = 1.7');
    expect(FIGURE).toContain('aspect >= FIG_ASPECT_THRESHOLD');
    // スマホは高さ基準（幅は比なり）、PC は従来どおり幅基準に戻す。
    expect(FIGURE).toContain("? 'h-[26vh] w-auto max-w-none md:h-auto md:w-full md:max-w-full'");
    expect(FIGURE).toContain("isWide ? 'overflow-x-auto md:overflow-x-visible' : ''");
    // 案内文は「比が大きい」ではなく「実際に溢れている」ときだけ出す。
    expect(FIGURE).toContain('scrollWidth > el.clientWidth');
    expect(FIGURE).toContain('isWide && overflowing');
  });

  /*
    ★しきい値 1.7 だけで切り替えると、縦の短い端末で逆に小さくなる★

    実測で見つけた不具合（地理 第4回 900x524 / 比 1.718・枠 358px）：
      390x844（26vh=219px）… 高さ基準 375x219 ／ 幅基準 358x208 → 高さ基準が大きい
      390x664（26vh=173px）… 高さ基準 295x173 ／ 幅基準 358x208 → ★幅基準が大きい★
    26vh は端末の高さで変わるのに、1.7 は 844px 端末だけを前提に
    366/220 から逆算した固定値だったため、画面の低い端末では
    「大きく見せるための切り替え」が図を 1.4 倍ほど縮めていた。

    直したあとの実測（同じ図・390x664）: 358x209（横スクロールも消えた）。
    比の固定値ではなく「高さ基準の方が実際に大きいか」で決めるようにした。
  */
  it('高さ基準に切り替えるのは「実際に大きくなるとき」だけ（端末の高さを見る）', () => {
    // 端末の高さを実測して使っていること（26vh の実寸を知るため）
    expect(FIGURE).toContain('window.innerHeight');
    // 枠の実効幅も実測（clientWidth）で採る
    expect(FIGURE).toContain('setFrameWidth(el.clientWidth)');
    // 判定式そのもの：26vh の実寸 > 幅基準にしたときの高さ
    expect(FIGURE).toContain('viewportH * 0.26 > frameWidth / aspect');
    // 「比が下限以上」かつ「高さ基準の方が大きい」の両方を満たすときだけ切り替える
    expect(FIGURE).toContain('heightBasedIsBigger');

    // ★測れていないあいだは従来どおり幅基準★（横スクロールしてから戻る揺れの防止）
    expect(FIGURE).toContain('aspect !== null &&');
    expect(FIGURE).toContain('frameWidth !== null &&');
    expect(FIGURE).toContain('viewportH !== null &&');

    // resize で測り直す（縦横回転・URL バーの出入りに追従する）
    expect(FIGURE).toContain("window.addEventListener('resize', read)");
  });

  it('横長でない図は枠の横幅いっぱいまで使う（原寸で止まらない）', () => {
    // w-auto だと原寸より大きくならず、小さい図は枠が余っても小さいまま。
    expect(FIGURE).toContain(": 'w-full h-auto max-w-full'");
  });
});

// =====================================================================
// D4: 【音源の聞き方】などの定型ブロックを落とす
// =====================================================================
describe('D4: 「音源の聞き方」等の定型説明を問題文から落とす', () => {
  it('【音源の聞き方】ブロックを丸ごと落とす', () => {
    const out = stripListeningHowToBlocks(
      ['第2回　第1問 A', '', '【音源の聞き方】', '・再生を押す', '・2回読み', '', '次の文を読め。'].join('\n'),
    );
    expect(out).not.toContain('音源の聞き方');
    expect(out).not.toContain('再生を押す');
    expect(out).toContain('次の文を読め。');
    expect(out).toContain('第2回　第1問 A');
  });

  it('【解き方のコツ】ブロックも落とす', () => {
    const out = stripListeningHowToBlocks(['【解き方のコツ】', '・先に選択肢を読む', '', '本文'].join('\n'));
    expect(out).not.toContain('解き方のコツ');
    expect(out).toContain('本文');
  });

  it('行の途中にある【難易度：…】は消さない（見出しではないので残す）', () => {
    const out = stripListeningHowToBlocks('第2回　第1問 A（4問・2回読み）　【難易度：易しめ（導入）】');
    expect(out).toContain('【難易度：易しめ（導入）】');
  });

  it('必要な見出し（【状況】など）は残す', () => {
    const out = stripListeningHowToBlocks(['【状況】', '空港のアナウンス', '', '本文'].join('\n'));
    expect(out).toContain('【状況】');
    expect(out).toContain('空港のアナウンス');
  });

  it('実データ（第1問A/B）から「音源の聞き方」が消える', () => {
    for (const p of [...EL1_A_EXTRA_PROBLEMS, ...EL1_B_PROBLEMS]) {
      expect(stripListeningHowToBlocks(p.text)).not.toContain('音源の聞き方');
    }
  });

  it('Quiz の問題文描画に組み込まれている（書いただけで未配線を防ぐ）', () => {
    // 呼び出し順を間違えないよう buildListeningLeadText に閉じ込めた（E1 の修正）。
    expect(BRIEFING).toContain('buildListeningLeadText(currentQuestion.text)');
  });
});

// =====================================================================
// E1: 左ペインには「いま解いている問」だけを出す
// =====================================================================
describe('E1: 左ペインに問1〜問4がまとまって残る不具合の修正', () => {
  /*
   * ■ 何がバグだったか
   *   以前の呼び出しは
   *     stripListeningQuestionBlocks(cleanQuestionText(text))
   *   だった。cleanQuestionText は「行頭の 問N を消す」処理なので、
   *   先に通すと切り落とす目印の 問N が消えてしまい、
   *   stripListeningQuestionBlocks が何も切れず問1〜問4が全部残った。
   *   → ご指摘「全部の問いがまとまっててどの問いを解いているかが分からない」
   */
  it('リード文だけが残り、問N と選択肢は落ちる（第1問A の実データ）', () => {
    for (const p of EL1_A_EXTRA_PROBLEMS) {
      const lead = buildListeningLeadText(p.text);
      expect(lead).not.toMatch(/^\s*問\s*\d/mu);
      // 選択肢の丸番号が行頭に並ぶブロックも残っていないこと。
      expect(lead).not.toMatch(/^\s*[①②③④]/mu);
      expect(lead).not.toContain('音源の聞き方');
      // 指示文（リード）は残っていること＝何をする回なのかは読める。
      expect(lead).toContain('第1問 A');
      expect(lead.length).toBeGreaterThan(20);
    }
  });

  it('リード文だけが残り、問N と選択肢は落ちる（第1問B の実データ）', () => {
    for (const p of EL1_B_PROBLEMS) {
      const lead = buildListeningLeadText(p.text);
      expect(lead).not.toMatch(/^\s*問\s*\d/mu);
      expect(lead).not.toContain('音源の聞き方');
      expect(lead).not.toContain('解き方のコツ');
      expect(lead).toContain('第1問 B');
    }
  });

  it('Quiz は壊れた順序（cleanQuestionText を先に通す）を使わない', () => {
    expect(QUIZ).not.toMatch(/stripListeningQuestionBlocks\(\s*cleanQuestionText\(/u);
  });

  it('左ペインにいま解いている問の見出しと「全N問中M問目」を出す', () => {
    expect(PROBLEM).toContain('stepLabelOf(activeStepSub, safeStepIndex)');
    expect(PROBLEM).toContain('splitQuestionLabel(activeStepSub.label');
    expect(PROBLEM).toContain('全{listeningSteps.length}問中');
  });

  it('リスニング以外（化学など）は従来どおり全文を出す', () => {
    expect(PROBLEM).toContain('cleanQuestionText(currentQuestion.text)');
  });

  it('リード文（回の説明）は解答中の画面には出さず、説明ページに移す', () => {
    // ご要望：「第一問Aでは・・・のところいらない。ここのスペースを
    //          解答の選択肢のスペースに当てて」
    //         「これらの問題の説明は…問題を出すまえに問題の説明のページを
    //          作ってそこに書いて欲しい」
    // → リード文は showingBriefing（回を選んだ直後の説明ページ）でだけ出す。
    //   解答中の左ペインは 問Nの見出し・設問文・音源・図 だけになる。
    // 問題文ペインを ProblemPane.tsx へ切り出したので、
    // 「前にある／後ろにある」ではなく「どのファイルに居るか」で固定する。
    //   ・リード文（回の説明）… Quiz.tsx の説明ページ（早期 return）だけ
    //   ・問Nの見出し        … ProblemPane.tsx（解答中の左ペイン）だけ
    expect(PROBLEM).toContain('stepLabelOf(activeStepSub, safeStepIndex)');
    expect(BRIEFING).toContain('buildListeningLeadText(currentQuestion.text)');
    // 解答中の左ペインにリード文は無い（切り出し先に漏れていない）
    expect(PROBLEM).not.toContain('buildListeningLeadText(');
    // 説明ページの見出しは Quiz.tsx 側に残っている
    expect(QUIZ).not.toContain('stepLabelOf(activeStepSub, safeStepIndex)');
    expect(QUIZ).toContain('showingBriefing');
    expect(QUIZ).toContain('setShowingBriefing(false)');
    expect(BRIEFING).toContain('問題をはじめる');
    // 解答中の左ペインでは化学など以外にリード全文を出さない
    expect(ANSWER).toContain('{!listeningUnified && (');
  });
});

// =====================================================================
// E2: 再生ボタンは左（問題文）ペインに置く
// =====================================================================
describe('E2: 音源プレイヤーは問題文ペイン（左側）に置く', () => {
  it('いま解いている問（activeStepSub）の音源を左ペインに出す', () => {
    expect(PROBLEM).toContain('hasTrackFor(activeStepSub.id)');
    expect(PROBLEM).toContain('focusSubId={activeStepSub.id}');
  });

  it('解答カード・スマホ固定パネルには音源を置かない', () => {
    // ご指摘：「再生ボタンはさ、左の問題の文章のところにおいてほしいよね。何で解答の方に置くの？」
    expect(QUIZ).not.toContain('focusSubId={sq.id}');
    expect(QUIZ).not.toContain('focusSubId={focusedSub.id}');
    expect(QUIZ).not.toContain('hasTrackFor(sq.id)');
    expect(QUIZ).not.toContain('hasTrackFor(focusedSub.id)');
  });
});

// =====================================================================
// D5: 音源は画面上側の「問題のところ」に置く
// =====================================================================
describe('D5: 音源は問題ブロックに横帯で置く（押しやすさ）', () => {
  it('inline に横並び（horizontal）モードがある', () => {
    expect(PLAYER).toContain("orientation?: 'vertical' | 'horizontal'");
    expect(PLAYER).toContain("const isRow = isInline && orientation === 'horizontal'");
  });

  it('Quiz が横帯モードで音源を描画する', () => {
    expect(PROBLEM).toContain('orientation="horizontal"');
  });

  it('選択肢の左に細い縦列で差し込む旧レイアウトは廃止', () => {
    // 幅 4.5rem の縦列に押し込むと 再生/2回/0.75倍/標準 が小さくて押しにくい。
    expect(QUIZ).not.toContain("'flex flex-row items-start gap-3'");
  });

  /**
   * ★このテストが守るのは「高さの下限」だけ（幅は対象外）★
   *
   * もとは min-h と min-w をひとつなぎの文字列で照合していたが、
   * それだと「幅を詰める」修正まで落ちてしまう。
   * 実際、ご指摘11
   *   「再生ボタンがまた少し大きくなったせいで、④の選択肢みたいに
   *     少し下に隠れちゃってる」
   * の対策は「横幅を詰めて 2 段の折り返しを 1 段に戻す」ことだった。
   * だから幅は固定せず、高さの下限だけをここで守る。
   *
   * ★★下限を 44px → 36px に改める★★
   * ------------------------------------------------------------------
   * ご指摘（手書きの指示書）：
   *   ▷再生／▷2回再生／▷0.75倍再生／標準再生 の列を「小さめに」。
   *   あわせて第1問B・第2問の図を「大きめに」。
   *
   * ■ 44px を確保した当時の前提は、いまは成り立たない
   *     44px は「選択肢のところに設置しても押しずらい」というご指摘への
   *     対策だった。当時この列は★解答ペイン側★にあり、①〜④のすぐ隣で
   *     「選択肢とまぎれて押しにくい」ことが問題だった。
   *     いまはこの列は問題文ペインに移り、上下に見出しと図しかない
   *     独立した1行になっている。まぎれる相手がいないので、
   *     44px を確保していた理由そのものが消えた。
   *
   * ■ なぜ 36px で止めるのか（0 まで下げないのか）
   *     「小さめに」は「押せなくしてよい」ではない。36px は
   *     指で押せる実用上の下限（Material のタッチターゲット下限 36dp）で、
   *     実測（390x664・第1問B / 第2問）でも 1行のまま折り返さずに収まり、
   *     押し間違いは起きなかった。ここより下げるのは根拠がない。
   *
   * ■ 削った 8px は図に変わる
   *     figure は fill（余り高さいっぱい）なので、この列が縮んだ分は
   *     そのまま図の高さになる。実測で図は 96x96 → 236x236 になった。
   */
  it('横帯のボタンはどれも高さ 36px 以上のタップ領域を持つ', () => {
    /*
     * 計測対象は「isRow（横帯）のときに選ばれる側」の min-h だけ。
     *
     * 同じファイルには isCompact（panel バリアントを小さく畳んだ表示）の
     * min-h-[2.25rem]=36px もあるが、あれは解説側の折りたたみチップで、
     * ここで言う「押しやすさを確保したい音源ボタン」ではない。
     * 条件名を見ずに min-h を拾うと、その無関係なチップまで巻き込んで
     * 誤って落ちる（実際に一度そうなった）。
     */
    const rowMinHeights = [...PLAYER.matchAll(/isRow\s*\n?\s*\?\s*'min-h-\[([0-9.]+)rem\]/g)].map(
      (m) => parseFloat(m[1]),
    );
    // 再生／2回／速度 の3種はいずれも横帯分岐を持つ
    expect(rowMinHeights.length).toBeGreaterThanOrEqual(3);
    for (const rem of rowMinHeights) {
      // 指で押せる下限。これ未満に縮めるのは「小さめに」を通り越して
      // 「押せない」になるので、ここで止める。
      expect(rem * 16).toBeGreaterThanOrEqual(36);
    }
  });

  /*
    ★退行防止：この列を 44px に戻さない★
    「タップ領域は 44px 以上」という一般論だけを根拠に戻されやすいので、
    上限側も固定しておく。44px が必要だったのは
    ★解答ペインで①〜④とまぎれていたとき★の話で、
    いまは問題文ペインの独立した1行なので当てはまらない。
    戻すと図が 8px ぶん小さくなり、ご指摘（「図が小さすぎて見づらい」）に
    逆行する。
  */
  it('★退行防止★ 横帯のボタンを 44px まで戻さない（図に高さを譲る）', () => {
    const rowMinHeights = [...PLAYER.matchAll(/isRow\s*\n?\s*\?\s*'min-h-\[([0-9.]+)rem\]/g)].map(
      (m) => parseFloat(m[1]),
    );
    expect(rowMinHeights.length).toBeGreaterThanOrEqual(3);
    for (const rem of rowMinHeights) {
      expect(rem * 16).toBeLessThanOrEqual(36);
    }
  });

  it('見出しつきパネル（panel）は復活していない', () => {
    expect(QUIZ).not.toMatch(/<ListeningAudioPlayer(?![\s\S]{0,400}?variant="inline")/);
  });
});

// =====================================================================
// D6: 図つきスマホでは「図に高さを譲る」
// =====================================================================
/**
 * ご指摘（手書きの指示書・逐語）：
 *   > 第１問Bと第２問のすまほのUi 変えてほしい
 *   > 普通に図が小さすぎてみずらいからね
 * 添付のワイヤーフレームには
 *   ・2x2グリッド（①②③④）の縦横に「大きめに」
 *   ・▷再生／▷2回再生／▷0.75倍再生／標準再生 の右に「小さめに」
 *   ・赤字で「図の説明はいらない」「なにもなし」
 * と書かれていた。
 *
 * ★この画面で図を大きくする唯一の方法は「枠の高さを増やす」こと★
 *   img は max-h-full ＋ object-contain が必須（枠から溢れさせないため）で、
 *   このとき絵の実寸は min(枠の幅 / 比, 枠の高さ) ＝ 高さで律速されている。
 *   だから w-full を足しても絵は 1px も大きくならない
 *   （実測で確認し、撤回した。詳細は QuestionFigure.tsx のコメント）。
 *   高さを食っている兄弟要素を削る以外に手がない。
 *
 * ここでは、その「削った先」が元に戻されないように固定する。
 * 実測（390x664）：図 第1問B 134x134 → 236x236 ／ 第2問 96x96 → 236x236。
 */
describe('D6: 図つきスマホでは図に高さを譲る（図が小さすぎる問題）', () => {
  /*
    ★図の説明（figcaption）は画面に出さない★
    実測で「問1 の選択肢イラスト（①〜④の4枚）」は 20px を占めていた。
    図の中身を見れば自明な説明なので、この20pxは払う価値がない。
  */
  it('図の説明（キャプション）はスマホの図つきリスニングでは出さない', () => {
    expect(PROBLEM).toContain('caption={listeningMobileSplit ? undefined : activeStepSub.imageCaption}');
  });

  /*
    ★データ側（imageCaption）は消していない★
    解説画面や PC では図が小さく並ぶので説明が要る。
    ここで渡さないだけにして、影響範囲をこの画面に閉じている。
  */
  it('キャプションはデータから消さない（解説側では従来どおり出す）', () => {
    expect(EXPL).toContain('imageCaption');
  });

  /*
    ★alt は必ず明示する★
    QuestionFigure は alt が無いとき caption を代わりに使う実装なので、
    caption を落とすだけだとスクリーンリーダー向けの説明も同時に消える。
    画面には出さず、alt にだけ残す。
  */
  it('画面から消したキャプションは alt に残す（読み上げを失わない）', () => {
    expect(PROBLEM).toContain('alt={activeStepSub.imageCaption || undefined}');
  });

  /*
    ★短い設問文は見出し行に載せる（36px を図へ）★
    第2問の設問文は英語の一言「What will the man drink?」で、
    日本語なら一目で1行と分かる短さなのに body.length は 24。
    文字数のしきい値20を超えるので独立した段落（h=24＋下余白12px）に
    落ちて、図の取り分が 36px 減っていた
    （実測：第1問B の図 134px に対し第2問は 96px）。
    ASCII を 0.5 文字として数える「表示幅」に変えて解決した。
    しきい値そのもの（20）は動かしていないので、
    日本語の設問文の振り分けは一切変わらない。
  */
  it('設問文の長短は「文字数」ではなく「表示上の幅」で判定する', () => {
    expect(PROBLEM).toContain('const displayWidthOf =');
    expect(PROBLEM).toContain('displayWidthOf(body) <= 20');
    // ASCII は半分の幅として数える（英語の一言が長文扱いされないように）
    expect(PROBLEM).toContain('0x80');
  });

  it('表示幅の判定は英語の一言を見出し行に載せ、長い英文は段落に落とす', () => {
    // ソースと同じ式をここでも組み、境界の振り分けを数値で確かめる。
    const displayWidthOf = (t: string) =>
      [...t].reduce((w, ch) => w + (ch.charCodeAt(0) < 0x80 ? 0.5 : 1), 0);
    // 第2問の設問文：文字数は24（=旧しきい値20超）だが表示幅は12
    expect('What will the man drink?'.length).toBeGreaterThan(20);
    expect(displayWidthOf('What will the man drink?')).toBeLessThanOrEqual(20);
    // 日本語の短い設問文は従来どおり見出し行
    expect(displayWidthOf('発話に合うイラスト')).toBeLessThanOrEqual(20);
    // 長い英文の問いは従来どおり段落へ
    expect(
      displayWidthOf('Which of the following best describes the speaker attitude toward the plan?'),
    ).toBeGreaterThan(20);
  });

  /*
    ★①②③④ は図つきスマホだけ4列1行にする（64px を図へ）★
    実測：grid-cols-2 は 52px×2行＋行間8px＝112px、
          grid-cols-4 は 48px×1行＝48px。
    4列でも 1つ 88x48px あり、指で押す下限（44x44px）を上下とも超える。
  */
  it('マークだけの選択肢は図つきスマホで4列1行に並べる', () => {
    expect(CHOICE).toContain('listeningMobileWithFigure');
    expect(CHOICE).toContain("listeningMobileWithFigure ? 'grid-cols-4 md:grid-cols-2' : 'grid-cols-2'");
    // PC は従来の2列に戻す（md: 以上）
    expect(CHOICE).toContain('md:grid-cols-2');
  });

  it('4列にしても選択肢ボタンの最小高さ（3rem=48px）は据え置く', () => {
    expect(ANSWER).toContain('min-h-[3rem]');
  });

  /*
    ★図あり／図なしで選択肢の扱いは逆になる★
    図なし大問（listeningMobileNoFigure）は逆に「背を伸ばして押しやすく」が
    正解なので、両者を同じ分岐にまとめてはいけない。
    Quiz.tsx の式で、両方が同時に真にならないことを担保している。
  */
  it('図つき用の分岐は図なし用の分岐と排他にする', () => {
    expect(QUIZ).toContain('listeningMobileWithFigure={listeningMobileSplit && !listeningMobileNoFigure}');
  });

  /*
    ★退行防止：fill モードの img を w-full に戻さない★
    「横幅が空いているのだから幅基準に倒せば大きくなる」という発想で
    戻されやすいが、max-h-full ＋ object-contain がある限り
    絵の実寸は高さで律速されたままで 1px も大きくならない。
    実測では 236x236 の絵に 366px 幅の枠が付き、
    「枠の中で絵が中央に浮く」不自然な見た目になった
    （枠は冊子の図枠の再現なので、絵より広いと意味が壊れる）。
  */
  it('★退行防止★ fill の img を幅基準（w-full）に切り替えない', () => {
    expect(FIGURE).toContain("? 'w-auto max-w-full min-h-0 max-h-full object-contain'");
    expect(FIGURE).not.toContain("? 'w-full max-w-full min-h-0 max-h-full object-contain'");
  });
});
