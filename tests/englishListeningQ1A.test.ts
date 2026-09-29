/**
 * ===================================================================
 * 英語リスニング 第1問A「第1回」の収録内容と音源まわりのテスト
 * ===================================================================
 * ご要望：
 *   ・第1問A(4問)の単元に、問題・解答解説を「第1回」として差し込む
 *   ・解説をもう少し詳しくする
 *   ・復習用の音源を聞く場所をしっかり作る
 *   ・音源のボタンはわかりやすい場所に配置する
 *   ・スクリプトの音声を生成し、アプリ内で再生できるようにする
 *
 * これらは一度直すと元に戻りやすい（別の修正で音源パネルが消える等）ため、
 * 「壊れたら気づける」形でテストに固定する。
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { readCode } from './helpers/sourceScan';
import { EL1_A_PROBLEMS } from '../src/data/englishListeningQ1AProblems';
import { getAllListeningChapters } from '../src/data/englishListeningData';

const ROOT = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf-8');

const PLAYER = read('src/components/ListeningAudioPlayer.tsx');
const QUIZ = read('src/components/Quiz.tsx');
// 問題文ペイン（左58%／スマホ上）の JSX は components/ProblemPane.tsx へ切り出した。
const PROBLEM = read('src/components/ProblemPane.tsx');
const EXPLANATION = read('src/components/Explanation.tsx');
// 設問から作る「表示用の派生値」（useMemo 17個）は
// hooks/useQuestionDerived.ts へ切り出した。
const DERIVED = read('src/hooks/useQuestionDerived.ts');
const CHAPTER_SELECTION = read('src/components/ChapterSelection.tsx');

/** 第1問A の単元（el1_A）を取り出す */
const el1A = () => {
  const chapter = getAllListeningChapters().find((c) => c.id === 'el1_A');
  if (!chapter) throw new Error('el1_A が見つかりません');
  return chapter;
};

describe('第1問A に「第1回」が差し込まれている', () => {
  it('el1_A の practiceProblems に第1回が入っている', () => {
    const problems = el1A().practiceProblems;
    expect(problems.length).toBeGreaterThanOrEqual(1);
    // 「アプリには第1回として」というご要望どおり、回が名前に出る
    expect(problems[0].category).toContain('第1回');
  });

  it('回を増やせる形（配列）になっている', () => {
    expect(Array.isArray(EL1_A_PROBLEMS)).toBe(true);
    // 第2回・第3回を足すときは、この配列に追加するだけで済む構造
    expect(EL1_A_PROBLEMS.length).toBeGreaterThanOrEqual(1);
  });

  it('4問（第1問Aのマーク数）ぶんの小問がある', () => {
    const set1 = EL1_A_PROBLEMS[0];
    expect(set1.subQuestions.length).toBe(4);
    expect(set1.subQuestions.map((sq: any) => sq.label.slice(0, 2))).toEqual([
      '問1',
      '問2',
      '問3',
      '問4',
    ]);
  });

  it('4問すべてマーク式（①〜④）で、正解は ②②③④', () => {
    const set1 = EL1_A_PROBLEMS[0];
    for (const sq of set1.subQuestions) {
      expect(sq.type).toBe('multiple_choice');
      expect(sq.options).toEqual(['①', '②', '③', '④']);
    }
    expect(set1.subQuestions.map((sq: any) => sq.correctAnswer)).toEqual([
      '②',
      '②',
      '③',
      '④',
    ]);
  });

  it('問題文に4問ぶんの選択肢（英文）がすべて載っている', () => {
    const { text } = EL1_A_PROBLEMS[0];
    // 各問の見出し
    for (const label of ['問1', '問2', '問3', '問4']) {
      expect(text).toContain(label);
    }
    // 正解の英文が問題文に必ず存在する（選択肢を読める場所に置く方針）
    expect(text).toContain('The speaker does not have her umbrella now.');
    expect(text).toContain('Mike should not turn off the computer yet.');
    expect(text).toContain('because the buses were not running');
    expect(text).toContain('There will be ten cookies for tomorrow.');
  });

  it('2回読み（第1問は本番2回読み）であることを持っている', () => {
    expect(EL1_A_PROBLEMS[0].readCount).toBe(2);
    expect(el1A().readCount).toBe(2);
  });
});

describe('解説が「もう少し詳しく」なっている', () => {
  const set1 = EL1_A_PROBLEMS[0];

  it('解説は小問見出しを行頭に置いている（アコーディオン分割の条件）', () => {
    // enhanceExplanation が小問ごとに切り分けるため、行頭の見出しが必須。
    for (const label of ['問1', '問2', '問3', '問4']) {
      expect(set1.explanation).toMatch(new RegExp(`^${label}\\s`, 'm'));
    }
  });

  it('各問の解説に「正解」だけでなく誤答の切り方まで書かれている', () => {
    // ①〜④それぞれに言及があること（＝消去法の根拠が示されている）
    for (const mark of ['①', '②', '③', '④']) {
      expect(set1.explanation).toContain(mark);
    }
    // 誤答分析の言葉づかい
    expect(set1.explanation).toContain('誤り');
  });

  it('スクリプトを解説内に引用して、音と文字を結び付けている', () => {
    expect(set1.explanation).toContain('I was going to bring my umbrella');
    expect(set1.explanation).toContain("don't turn off the computer yet");
    expect(set1.explanation).toContain('Emma usually takes the bus to school');
    expect(set1.explanation).toContain('There are eight cookies on the plate');
  });

  it('数量計算（問4）は途中の値まで説明している', () => {
    // 8 - 3 + 5 = 10 の式と、誤答が「途中で止まった値」である説明
    expect(set1.explanation).toContain('8 - 3 + 5 = 10');
    expect(set1.explanation).toContain('途中');
  });

  it('全4問に「解法の思考手順」（detailedExplanation.steps）が付いている', () => {
    for (const sq of set1.subQuestions) {
      expect(sq.detailedExplanation).toBeTruthy();
      expect(Array.isArray(sq.detailedExplanation.steps)).toBe(true);
      // 手順は4ステップ以上（「もう少し詳しく」の担保）
      expect(sq.detailedExplanation.steps.length).toBeGreaterThanOrEqual(4);
      expect(typeof sq.detailedExplanation.theme).toBe('string');
    }
  });

  it('解説の分量が十分にある（要約で終わっていない）', () => {
    expect(set1.explanation.length).toBeGreaterThan(1500);
  });

  it('周辺知識・深掘りテーマも用意されている', () => {
    expect(set1.surroundingKnowledge.length).toBeGreaterThanOrEqual(4);
    expect(set1.deepDiveTopics.length).toBeGreaterThanOrEqual(3);
  });
});

describe('音源（スクリプトから生成した音声）', () => {
  const set1 = EL1_A_PROBLEMS[0];

  it('4問ぶんの音源トラックがある', () => {
    expect(set1.audioTracks.length).toBe(4);
    expect(set1.audioTracks.map((t) => t.label)).toEqual(['問1', '問2', '問3', '問4']);
  });

  it('音源トラックの subId は小問の id と一致している', () => {
    const subIds = set1.subQuestions.map((sq: any) => sq.id);
    expect(set1.audioTracks.map((t) => t.subId)).toEqual(subIds);
  });

  it('音声ファイルが public 配下に実在する（アプリ内で再生できる）', () => {
    for (const track of set1.audioTracks) {
      // Genspark の共有URLはセッション認証付きで資産にできないため、
      // 必ず public 配下の静的パスであること。
      expect(track.audioUrl.startsWith('/listening_audio/')).toBe(true);
      const file = path.join(ROOT, 'public', track.audioUrl);
      expect(fs.existsSync(file)).toBe(true);
      // 空ファイルでないこと
      expect(fs.statSync(file).size).toBeGreaterThan(10000);
    }
  });

  it('各トラックにスクリプト・和訳・重要表現が揃っている', () => {
    for (const track of set1.audioTracks) {
      expect(track.script.length).toBeGreaterThan(20);
      expect(track.translation.length).toBeGreaterThan(5);
      expect(track.keyPhrases.length).toBeGreaterThanOrEqual(2);
      expect(track.hint.length).toBeGreaterThan(0);
    }
  });

  it('スクリプトは生成した音声の内容と一致している', () => {
    const scripts = set1.audioTracks.map((t) => t.script);
    expect(scripts[0]).toBe(
      'I was going to bring my umbrella, but I forgot it on the train this morning.',
    );
    expect(scripts[1]).toBe("Mike, don't turn off the computer yet. I haven't saved my report.");
    expect(scripts[2]).toBe(
      'Emma usually takes the bus to school, but today she rode her bike because the buses are on strike.',
    );
    expect(scripts[3]).toBe(
      "There are eight cookies on the plate. If you eat three, I'll bake five more for tomorrow.",
    );
  });
});

describe('ListeningAudioPlayer（音源を聞く場所）', () => {
  it('練習用と復習用の2モードを持つ', () => {
    expect(PLAYER).toContain("mode?: 'practice' | 'review'");
    expect(PLAYER).toContain("mode = 'practice'");
    expect(PLAYER).toContain("const isReview = mode === 'review'");
  });

  it('見出しに「音源を聞く」「復習用の音源を聞く」を出す', () => {
    expect(PLAYER).toContain('復習用の音源を聞く');
    expect(PLAYER).toContain('音源を聞く');
  });

  it('ヘッドホンアイコンで「ここが音源」と分かるようにしている', () => {
    expect(PLAYER).toContain('Headphones');
  });

  it('問ごとの再生ボタンが常時表示（アコーディオンで隠していない）', () => {
    // list.map で問1〜問4 のボタンを直接描画している
    expect(PLAYER).toMatch(/list\.map\(\(track\)/);
    expect(PLAYER).toContain('track.label');
    expect(PLAYER).toContain('track.hint');
  });

  it('タップ領域は 48px 以上（スマホでの取りこぼし防止）', () => {
    expect(PLAYER).toContain('min-h-[3rem]');
  });

  it('再生・一時停止・もう1回・2回続けて再生ができる', () => {
    expect(PLAYER).toContain('Play');
    expect(PLAYER).toContain('Pause');
    expect(PLAYER).toContain('もう1回');
    expect(PLAYER).toContain('を2回続けて');
    // 2回読みのときだけ「2回続けて」を出す
    expect(PLAYER).toContain('readCount === 2');
  });

  it('ゆっくり再生（0.75倍）に対応している', () => {
    expect(PLAYER).toContain('0.75');
    expect(PLAYER).toContain('playbackRate');
  });

  it('復習モードではスクリプト・和訳・重要表現を開ける', () => {
    expect(PLAYER).toContain('スクリプト');
    expect(PLAYER).toContain('track.translation');
    expect(PLAYER).toContain('押さえたい表現');
    expect(PLAYER).toContain('keyPhrases');
  });

  it('他の音声（BGM・他プレーヤー）を止めて二重再生を防ぐ', () => {
    expect(PLAYER).toContain('pauseOtherAudio');
    expect(PLAYER).toMatch(/document\.querySelectorAll\('audio'\)/);
  });

  it('画面から離れたら音を止める（後追い再生の防止）', () => {
    expect(PLAYER).toMatch(/return \(\) => \{[\s\S]*?el\.pause\(\)/);
  });

  it('明色ペイン／暗色ペインの両方に対応している', () => {
    expect(PLAYER).toContain("tone?: 'light' | 'dark'");
    expect(PLAYER).toContain("const isDark = tone === 'dark'");
  });
});

describe('音源ボタンが「わかりやすい場所」に置かれている', () => {
  it('Quiz：解いている問の問題文のすぐ下に練習用プレーヤーがある', () => {
    // 画面上部の「音源を聞く」パネルは廃止し（ご要望）、
    // inline バリアントに一本化した。
    //
    // 置き場所はその後さらに修正した。ご指摘（原文）：
    //   > 再生ボタンはさ、左の問題の文章のところにおいてほしいよね。
    //   > 何で解答の方に置くの？
    // そこで解答カード側ではなく、問題文ペイン（左側）の
    // 「いま解いている問」ブロックに置く。
    // 問題文ペインは components/ProblemPane.tsx へ切り出したので、
    // プレイヤーを実際に置いているのはそちら。
    expect(PROBLEM).toContain('ListeningAudioPlayer');
    expect(QUIZ).not.toContain('ListeningAudioPlayer');
    expect(PROBLEM).toContain("mode=\"practice\"");
    expect(PROBLEM).toContain('variant="inline"');
    // その問の音源だけを鳴らすため、必ず focusSubId を渡している。
    // 対象は「いま解いている問」= activeStepSub。
    expect(PROBLEM).toMatch(/focusSubId=\{activeStepSub\.id\}/);
    // 解答カード側（sq）に戻していないこと。
    expect(QUIZ).not.toMatch(/focusSubId=\{sq\.id\}/);
  });

  it('Quiz：音源を持つ問題のときだけ出す（他科目に影響しない）', () => {
    // audioTracks は「問題ごとの音源リスト」を listeningTracks に正規化してから使う。
    // 配列でなければ空配列になるので、化学など音源を持たない科目では
    // listeningTracks.length === 0 となりプレーヤーは描画されない。
    expect(DERIVED).toMatch(
      /const listeningTracks[\s\S]{0,200}?Array\.isArray\(t\) \? t : \[\]/,
    );
    expect(DERIVED).toMatch(/\(currentQuestion as any\)\?\.audioTracks/);
    expect(QUIZ).toContain('listeningTracks.length > 0');
    // 小問ごとの再生ボタンも「その小問の音源があるときだけ」出す
    expect(QUIZ).toContain('hasTrackFor');
  });

  it('Explanation：復習用としてスクリプトつきで出す', () => {
    expect(EXPLANATION).toContain('ListeningAudioPlayer');
    /*
     * ★ご要望8でスマホの役割を入れ替えたため、mode は固定値ではなくなった★
     *   「音源のボタンと問題が上。下は合ってるか間違ってるかとスクリプトを載せて」
     *
     *   スマホ：上＝practice（再生ボタンだけ）／下＝review（スクリプト）
     *   PC    ：上＝review（従来どおり）／下＝practice（従来どおり）
     *
     * 以前は上のプレーヤーが常に mode="review" だったので
     * リテラル 'mode="review"' で確かめられたが、いまは三項になっている。
     * 大事なのは「どちらの画面幅でも review が必ず1か所ある」＝
     * スクリプトを読む場所が失われていないこと。ここを検証する。
     */
    expect(EXPLANATION).toMatch(/mode=\{reorderMobile \? 'practice' : 'review'\}/);
    expect(EXPLANATION).toMatch(/mode=\{reorderMobile \? 'review' : 'practice'\}/);
    expect(EXPLANATION).toMatch(/Array\.isArray\(\(question as any\)\.audioTracks\)/);
    // 解説ペインの配色に合わせて tone を切り替える
    expect(EXPLANATION).toMatch(/tone=\{mode === 'mini_test' \? 'light' : 'dark'\}/);
  });

  it('Explanation：問題文より前（採点直後に目に入る位置）に置く', () => {
    /*
     * ★「どちらが先に書かれているか」は実コードだけで決まる★
     *
     * 素のソースを indexOf で探すと、経緯を説明したコメントの中に
     * 同じ JSX を書き写した瞬間にそこへ当たり、判定が狂う。
     * 実際に learningPrint.test.ts でこの事故が起きた
     * （詳細は tests/helpers/sourceScan.ts の冒頭）。
     */
    const code = readCode('src/components/Explanation.tsx');
    const playerAt = code.indexOf('<ListeningAudioPlayer');
    const bodyAt = code.indexOf('text={cleanQuestionText(question.text)}');
    expect(playerAt).toBeGreaterThan(-1);
    expect(bodyAt).toBeGreaterThan(-1);
    expect(playerAt).toBeLessThan(bodyAt);
  });
});

describe('単元選択に「復習用の音源を聞く場所」がある', () => {
  it('音源を持つ単元カードに「音源」ボタンを出す', () => {
    expect(CHAPTER_SELECTION).toContain('collectAudioSets');
    expect(CHAPTER_SELECTION).toContain('Headphones');
    expect(CHAPTER_SELECTION).toContain('復習用の音源を聞く（問題を解かずに音声だけ再生）');
  });

  it('音源を持つ科目（リスニング・英文法）だけに音源ボタンを出す', () => {
    // ★もとは「リスニング以外は出さない」という検査だった★
    //   英文法を追加したとき、各問に「空所を埋めた完成文」の音源を持たせたので、
    //   英文法の単元カードにも復習用音源の入口が要る。
    //   （正しい形を音で通しておくと、本番で「音の違和感」で誤答を切れる。）
    //   一方で化学・数学・生物基礎には音源が無いので、そこには出してはいけない。
    //   つまり守りたいのは「リスニングだけ」ではなく
    //   ★音源を持つ科目に限定されていること★なので、条件式ごと検査する。
    expect(CHAPTER_SELECTION).toMatch(
      /isListening \|\| isGrammar \? collectAudioSets\(chapter\) : \[\]/,
    );
  });

  it('音源を持たない科目（化学・数学・生物基礎）には音源ボタンを出さない', () => {
    // 条件が「常に collectAudioSets を呼ぶ」形に緩められていないことを確かめる。
    // : [] という空配列に倒す分岐が残っていれば、音源の無い科目では出ない。
    const line = CHAPTER_SELECTION.split('\n').find((l) =>
      l.includes('collectAudioSets(chapter) : []'),
    );
    expect(line).toBeTruthy();
    // isListening / isGrammar 以外の科目が条件に混ざっていないこと
    expect(line).not.toMatch(/isChemistry|isMath|isBiology/u);
  });

  it('プレーヤー本体はグリッド下に全幅で開く（スクリプトが読める幅を確保）', () => {
    expect(CHAPTER_SELECTION).toContain('復習用音源 ／');
    expect(CHAPTER_SELECTION).toMatch(/openAudioSetId/);
    expect(CHAPTER_SELECTION).toContain('mode="review"');
  });

  it('大問タブを切り替えたら開いていた音源パネルを閉じる', () => {
    expect(CHAPTER_SELECTION).toMatch(/setOpenAudioSetId\(null\)/);
  });
});
