/**
 * ===================================================================
 * 英語リスニング 第1問A/B の類題集収録＋解答画面の操作性テスト
 * ===================================================================
 * ご要望：
 *   ① 1問題とそれに該当する再生ボタンを「横」に配置する
 *   ② 選択肢を直接タップして消去法を行えるようにする（モードは持たない）
 *   ③ 第1問A の問題追加を PDF のとおりに行う（13セット・52問）
 *   ④ 第1問B の問題追加を PDF（イラスト＋スクリプト）のとおりに行う（15セット・60問）
 *      S1 の画像の右下にあった GenSpark ロゴは削除する
 *   ⑤ 問題文（選択肢）と解答欄を分離せず、同じカードに並べて同期させる
 *   ⑥ 画面上部の「音源を聞く」パネルは置かない
 *   ⑦ 第1問B セット7〜15（36問）の選択肢はシャッフルして正解を散らす
 *   ⑧ 進捗は「問1で1つ・問2で1つ」に分ける（回まるごと1進捗をやめる）
 *   ⑨ 選択肢の英文はスマホでは上・PCでは右に置き、スクロールなしで一目に映す
 *   ⑩ 図は選択肢の中に載せない（見にくい）
 *   ⑪ 【音源の聞き方】等の定型ブロックは問題文から落とす
 *   ⑫ 左ペインには「いま解いている問」だけを出す（問1〜問4をまとめない）
 *   ⑬ 再生ボタンは左の問題文のところに置く（解答側に置かない）
 *   ⑭ 図も問題の方（左側）に置く（解答側に置かない）
 *   ⑮ 左右2画面の比（58% / 42%・50vh）は勝手に変えない
 *
 * これらは別の修正で簡単に巻き戻る（音源パネルが復活する、
 * 消去モードが戻る、データの配線が外れる）ため、テストで固定する。
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { EL1_A_EXTRA_PROBLEMS } from '../src/data/englishListeningQ1ASets';
import { EL1_B_PROBLEMS } from '../src/data/englishListeningQ1BProblems';
import { getAllListeningChapters } from '../src/data/englishListeningData';

const ROOT = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf-8');

const QUIZ = read('src/components/Quiz.tsx');
// 選択肢ボタン群は components/MultipleChoiceControl.tsx へ切り出した。
const MC = read('src/components/MultipleChoiceControl.tsx');
// 問題文ペイン（左58%／スマホ上）の JSX は components/ProblemPane.tsx へ切り出した。
const PROBLEM = read('src/components/ProblemPane.tsx');
// 解答ペイン（右42%／スマホ下）の JSX は components/AnswerPane.tsx へ切り出した。
const ANSWER = read('src/components/AnswerPane.tsx');
// 消去状態そのものと長押しのしくみは hooks/useElimination.ts へまとめた。
const ELIM = read('src/hooks/useElimination.ts');
// 設問から作る「表示用の派生値」（useMemo 17個）は
// hooks/useQuestionDerived.ts へ切り出した。
const DERIVED = read('src/hooks/useQuestionDerived.ts');
// リスニングの「問題の説明ページ」は components/ListeningBriefing.tsx へ
const BRIEFING = read('src/components/ListeningBriefing.tsx');
const PLAYER = read('src/components/ListeningAudioPlayer.tsx');
const SPEECH = read('src/utils/listeningSpeech.ts');
const FIGURE = read('src/components/QuestionFigure.tsx');

const MARKS = ['①', '②', '③', '④'];

const chapter = (id: string) => {
  const c = getAllListeningChapters().find((x) => x.id === id);
  if (!c) throw new Error(`${id} が見つかりません`);
  return c;
};

// =====================================================================
// ③ 第1問A：PDF の13セット（52問）が入っている
// =====================================================================
describe('第1問A：PDF の類題集13セットが収録されている', () => {
  it('13セット・各4問＝52問ある', () => {
    expect(EL1_A_EXTRA_PROBLEMS).toHaveLength(13);
    const total = EL1_A_EXTRA_PROBLEMS.reduce((n, p) => n + p.subQuestions.length, 0);
    expect(total).toBe(52);
  });

  it('既存の第1回とID衝突せず、第2回〜第14回として並ぶ', () => {
    const ids = EL1_A_EXTRA_PROBLEMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe('q_el1_A_set2');
    expect(ids[ids.length - 1]).toBe('q_el1_A_set14');
    EL1_A_EXTRA_PROBLEMS.forEach((p, i) => {
      expect(p.category).toContain(`第${i + 2}回`);
    });
  });

  it('全設問がマーク式（①〜④）で、正解がその中にある', () => {
    for (const p of EL1_A_EXTRA_PROBLEMS) {
      for (const sq of p.subQuestions as any[]) {
        expect(sq.type).toBe('multiple_choice');
        expect(sq.options).toEqual(MARKS);
        expect(MARKS).toContain(sq.correctAnswer);
      }
    }
  });

  it('各問に選択肢の英文が問題文へ並んでいる（マークだけでは解けないため）', () => {
    for (const p of EL1_A_EXTRA_PROBLEMS) {
      for (const mark of MARKS) {
        // 4問 × 4選択肢なので、各マークは最低4回現れる
        const count = p.text.split(mark).length - 1;
        expect(count).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('各問に音源トラック（スクリプト）が対応づいている', () => {
    for (const p of EL1_A_EXTRA_PROBLEMS) {
      expect(p.audioTracks).toHaveLength(p.subQuestions.length);
      const subIds = (p.subQuestions as any[]).map((s) => s.id);
      for (const track of p.audioTracks) {
        expect(subIds).toContain(track.subId);
        // スクリプトが空だと読み上げも復習もできない
        expect(track.script.trim().length).toBeGreaterThan(5);
      }
    }
  });

  it('解説に問1〜問4の見出しが行頭で入っている（アコーディオン整形の条件）', () => {
    for (const p of EL1_A_EXTRA_PROBLEMS) {
      for (let n = 1; n <= 4; n += 1) {
        expect(p.explanation).toMatch(new RegExp(`^問${n}`, 'm'));
      }
    }
  });
});

// =====================================================================
// ④ 第1問B：PDF の15セット（60問）＋イラストが入っている
// =====================================================================
describe('第1問B：イラスト選択の類題集15セットが収録されている', () => {
  it('15セット・各4問＝60問ある', () => {
    expect(EL1_B_PROBLEMS).toHaveLength(15);
    const total = EL1_B_PROBLEMS.reduce((n, p) => n + p.subQuestions.length, 0);
    expect(total).toBe(60);
  });

  it('各設問にイラストが割り当てられ、public に実ファイルがある', () => {
    for (const p of EL1_B_PROBLEMS) {
      for (const sq of p.subQuestions as any[]) {
        expect(typeof sq.imageUrl).toBe('string');
        // Genspark の共有URLはセッション認証つきで資産にできない。必ず public 配下。
        expect(sq.imageUrl.startsWith('/listening_q1b/')).toBe(true);
        const file = path.join(ROOT, 'public', sq.imageUrl.replace(/^\//, ''));
        expect(fs.existsSync(file)).toBe(true);
        // 空ファイル・壊れファイルの混入を防ぐ
        expect(fs.statSync(file).size).toBeGreaterThan(5000);
      }
    }
  });

  it('イラストは1問1枚で重複しない（画像の貼り違えを防ぐ）', () => {
    const urls = EL1_B_PROBLEMS.flatMap((p) =>
      (p.subQuestions as any[]).map((sq) => sq.imageUrl),
    );
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toHaveLength(60);
  });

  it('画像のセット・問番号が設問IDと一致している（スクリプトと絵の対応）', () => {
    EL1_B_PROBLEMS.forEach((p, si) => {
      const setNo = si + 1;
      (p.subQuestions as any[]).forEach((sq, qi) => {
        expect(sq.id).toBe(`q_el1_B_set${setNo}_${qi + 1}`);
        expect(sq.imageUrl).toBe(`/listening_q1b/el1B_set${setNo}_q${qi + 1}.jpg`);
      });
    });
  });

  it('全設問がマーク式（①〜④）で、正解がその中にある', () => {
    for (const p of EL1_B_PROBLEMS) {
      for (const sq of p.subQuestions as any[]) {
        expect(sq.type).toBe('multiple_choice');
        expect(sq.options).toEqual(MARKS);
        expect(MARKS).toContain(sq.correctAnswer);
      }
    }
  });

  it('各問に音源トラック（スクリプト）が対応づいている', () => {
    for (const p of EL1_B_PROBLEMS) {
      expect(p.audioTracks).toHaveLength(p.subQuestions.length);
      const subIds = (p.subQuestions as any[]).map((s) => s.id);
      for (const track of p.audioTracks) {
        expect(subIds).toContain(track.subId);
        expect(track.script.trim().length).toBeGreaterThan(5);
      }
    }
  });

  it('S1（第1セット）の画像から GenSpark ロゴを除去済みである', () => {
    // ロゴ除去は画像処理なので中身は目視で確認済み。
    // ここでは「除去スクリプトが残っており、テンプレートも同梱されている」ことを固定し、
    // 画像を再生成したときに素材が失われていないことを保証する。
    expect(fs.existsSync(path.join(ROOT, 'scripts/strip_genspark_logo.py'))).toBe(true);
    expect(
      fs.existsSync(path.join(ROOT, 'scripts/assets/genspark_badge_template.png')),
    ).toBe(true);
    // 第1セットの4枚が存在する（除去処理の対象だったファイル）
    for (let q = 1; q <= 4; q += 1) {
      const file = path.join(ROOT, `public/listening_q1b/el1B_set1_q${q}.jpg`);
      expect(fs.existsSync(file)).toBe(true);
    }
  });
});

// =====================================================================
// データの配線（単元に流し込まれているか）
// =====================================================================
describe('単元への配線', () => {
  it('el1_A に第1回＋13セット＝14回ぶんが入っている', () => {
    const problems = chapter('el1_A').practiceProblems;
    expect(problems).toHaveLength(14);
    expect(problems[0].id).toBe('q_el1_A_set1');
    expect(problems[13].id).toBe('q_el1_A_set14');
  });

  it('el1_B に15回ぶんが入っている', () => {
    const problems = chapter('el1_B').practiceProblems;
    expect(problems).toHaveLength(15);
    expect(problems[0].id).toBe('q_el1_B_set1');
  });

  it('大問IDが全単元で一意（進捗の取り違えを防ぐ）', () => {
    const ids = getAllListeningChapters().flatMap((c) =>
      (c.practiceProblems || []).map((p: any) => p.id),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// =====================================================================
// ① 音源は「左の問題文のところ」に横帯で置く
//    ご要望：「後音源はその画面の上側の問題のところに設置すること。
//              選択肢のところに設置しても押しずらい」
//    ご指摘（差し戻し）：「再生ボタンはさ、左の問題の文章のところに
//              おいてほしいよね。何で解答の方に置くの？」
//    → 音源・図は左ペイン（問題文）側に置き、解答カードには置かない。
// =====================================================================
describe('解答画面：音源は左（問題文）ペインに横帯で置く', () => {
  it('ListeningAudioPlayer に inline バリアントがある', () => {
    expect(PLAYER).toContain("variant?: 'panel' | 'inline'");
    expect(PLAYER).toContain("const isInline = variant === 'inline'");
  });

  it('inline に横並び（horizontal）の並べ方がある', () => {
    expect(PLAYER).toContain("orientation?: 'vertical' | 'horizontal'");
    expect(PLAYER).toContain("const isRow = isInline && orientation === 'horizontal'");
  });

  it('横帯モードではボタンが 44px 級のタップ領域を持つ（押しやすさ）', () => {
    /*
     * 再生ボタン・2回ボタン・速度ボタンのいずれも高さ 44px 以上。
     *
     * ★幅は固定しない★
     *   もとは min-h と min-w をつないだ文字列で照合していたが、
     *   それだと「横幅を詰める」修正で落ちてしまう。
     *   ご指摘11「再生ボタンがまた少し大きくなったせいで、
     *   ④の選択肢みたいに少し下に隠れちゃってる」の対策は、
     *   横幅を詰めて flex-wrap の 2 段折り返しを 1 段に戻すことだった。
     *   守りたいのは高さ 44px（＝指で押せる下限）のほうなので、
     *   幅と切り離してこちらだけを固定する。
     *
     *   なお isCompact（panel を畳んだ表示）の 36px ボタンは
     *   音源ボタンではないので、条件名 isRow で絞って除外する。
     */
    const rowMinHeights = [...PLAYER.matchAll(/isRow\s*\n?\s*\?\s*'min-h-\[([0-9.]+)rem\]/g)].map(
      (m) => parseFloat(m[1]),
    );
    expect(rowMinHeights.length).toBeGreaterThanOrEqual(3);
    for (const rem of rowMinHeights) {
      expect(rem * 16).toBeGreaterThanOrEqual(44);
    }
  });

  it('左ペインの問ブロックで focusSubId + variant="inline" + horizontal を使っている', () => {
    expect(PROBLEM).toContain('variant="inline"');
    expect(PROBLEM).toContain('focusSubId={activeStepSub.id}');
    expect(PROBLEM).toContain('orientation="horizontal"');
    // 音源を選択肢の左に細く差し込む縦列レイアウトは廃止した
    expect(QUIZ).not.toContain("'flex flex-row items-start gap-3'");
  });

  it('その問に音源がある場合だけボタン列を出す（他科目に影響しない）', () => {
    expect(DERIVED).toContain('const hasTrackFor');
    expect(PROBLEM).toContain('hasTrackFor(activeStepSub.id)');
  });

  it('解答カード・スマホ固定パネルには音源を置かない（ご指摘の反映）', () => {
    // 「何で解答の方に置くの？」→ 解答側からは完全に取り除く。
    expect(QUIZ).not.toContain('focusSubId={sq.id}');
    expect(QUIZ).not.toContain('focusSubId={focusedSub.id}');
    expect(QUIZ).not.toContain('hasTrackFor(sq.id)');
    expect(QUIZ).not.toContain('hasTrackFor(focusedSub.id)');
  });

  it('第1問B のイラストは問題の方（左側）に置く', () => {
    // ご要望：「図は選択肢のところに載せるのやめよう。見にくい」
    // ご指摘：「第１問の図も何で解答の方にあるの？
    //          問題の方（左側）においてっていったよね」
    // → 図は左ペインの「いま解いている問」ブロックにだけ置く。
    expect(PROBLEM).toContain('src={activeStepSub.imageUrl}');
    // この it の本題は「図が左ペインにある」こと。
    // 高さの与え方は fill（＝もらえた高さいっぱい）に変わった。
    expect(PROBLEM).toContain('fill={listeningMobileSplit}');
    expect(QUIZ).not.toContain('src={sq.imageUrl}');
    expect(QUIZ).not.toContain('src={focusedSub.imageUrl}');
    expect(FIGURE).toContain('imgClassName');
  });

  /*
    ★ご要望★
      「発話に合うイラストっていう文字をさ、問４（全４問中４問目）の右に
        もってこれば、もう少し図を上にできるでしょ」
    第1問B の設問文は「発話に合うイラスト」の一言だけなのに、
    見出し行の下に独立した段落として置かれ、1行ぶん図を押し下げていた。
  */
  it('短い設問文は「問N（全N問中N問目）」と同じ行に置く（図を上げる）', () => {
    // 全角20文字相当までを見出し行へ寄せる。
    expect(PROBLEM).toContain('const inlineBody = body && body.length <= 20 ? body : \'\'');
    expect(PROBLEM).toContain('const blockBody = inlineBody ? \'\' : body');
    // 見出し行は折り返せるようにし、問Nバッジと問数表示は縮ませない。
    expect(PROBLEM).toContain('flex items-center gap-2 flex-wrap');
    // 長い設問文（第1問A・第3問の英文の問い）は従来どおり下の段落に出す。
    expect(PROBLEM).toContain('{blockBody && (');
  });
});

// =====================================================================
// ② 選択肢の直接タップで消去法（モードなし）
// =====================================================================
describe('解答画面：消去法（選択肢を直接タップして斜線を引く）', () => {
  it('解答とは別の state で消去を持っている（取り違え防止）', () => {
    // 消去状態は hooks/useElimination.ts が持つ（解答 answers とは別の入れ物）。
    expect(ELIM).toContain('const [eliminated, setEliminated]');
    expect(QUIZ).toContain('useElimination(chapter.id, mode)');
  });

  it('消去モードの切替ボタンを持たない（ご要望：モードではなく直接タップ）', () => {
    // モード用の state・トグル文言が一切残っていないこと。
    // 残っていると「押す前にモードを確認する」手間が復活してしまう。
    expect(QUIZ).not.toContain('eliminateMode');
    expect(QUIZ).not.toContain('消去法を使う');
    expect(QUIZ).not.toContain('消去モード中');
    expect(QUIZ).not.toContain('消去を戻す');
  });

  it('タップだけで 未選択→選択→斜線→未選択 と巡回する', () => {
    // ① 斜線済みをタップ → 斜線を消して候補に戻す
    expect(MC).toMatch(/if \(struck\) \{[\s\S]{0,120}?restoreOption\(sq\.id, opt\)/);
    // ② 選択中をタップ → 解答を外して斜線を引く
    //    （斜線を引く関数は、変化を動きで見せるため strikeOptionAnimated に変更）
    expect(MC).toMatch(
      /if \(isSelected\) \{[\s\S]{0,200}?handleOptionSelect\(sq\.id, ''\);[\s\S]{0,120}?strikeOptionAnimated\(sq\.id, opt\)/,
    );
    // ③ 未選択をタップ → 解答として選ぶ
    expect(MC).toContain("handleOptionSelect(sq.id, opt);");
  });

  it('操作方法を選択肢の上に示している（モード表示の代わり）', () => {
    // 文字だけの一行説明から、各状態の見本を並べた表示に変更した。
    // 「2段階あることに気づかれない」というご指摘への対応。
    expect(QUIZ).toContain('タップで選択');
    expect(MC).toContain('もう一度で斜線');
    expect(MC).toContain('さらにタップで元に戻る');
    expect(MC).toContain('長押しでこの設問の斜線をまとめて消す');
  });

  it('消去済みの選択肢は取り消し線で表示される', () => {
    expect(MC).toContain('line-through');
    expect(MC).toContain('const struck = isEliminated(sq.id, opt)');
  });

  it('消去状態は端末に保存され、戻ってきても残る', async () => {
    // 以前は `expect(QUIZ).toContain('quiz_elim_')` だった。
    // ところが Quiz.tsx には別物の 'quiz_elim_hint_seen'（操作説明を見たか）
    // もあるので、保存キーを集約したあとでもこの文字列は残ってしまい、
    // 「消去状態が保存されているか」を確かめられていない状態だった。
    // 実際に使っているキー生成と、読み書き両方の存在で確認する。
    // 引数名はフック側では chapterId（Quiz.tsx から chapter.id を渡す）。
    expect(ELIM).toContain('quizElimKey(chapterId, mode)');
    expect(ELIM).toContain('localStorage.setItem(quizElimKey(chapterId, mode)');
    expect(ELIM).toContain('localStorage.getItem(quizElimKey(chapterId, mode))');

    const { quizElimKey } = await import('../src/utils/quizStorageKeys');
    expect(quizElimKey('q_el1_A', 'practice')).toBe('quiz_elim_q_el1_A_practice');
    // 操作説明のキーとは別物であること
    expect(quizElimKey('q_el1_A', 'practice')).not.toBe('quiz_elim_hint_seen');
  });
});

// =====================================================================
// ③ 問題文（選択肢）と解答欄を分離しない
// =====================================================================
describe('英語リスニング：問題文（選択肢）と解答欄が同じ場所にある', () => {
  it('選択肢の英文を problem.text から取り出して解答欄に載せている', () => {
    expect(DERIVED).toContain('buildListeningOptionTexts');
    expect(MC).toContain('listeningOptionTexts.get(sq.id)');
  });

  it('左ペインはリード文のみ（問1〜問4をまとめて出さない）', () => {
    // ご指摘：「問題のところさ、全部の問いがまとまってて
    //          どの問いを解いているかが分からない」
    // → 正しい順序を閉じ込めた buildListeningLeadText を使う。
    expect(BRIEFING).toContain('buildListeningLeadText(currentQuestion.text)');
    // 設問一覧はリスニングでは描画しない（解答カード側に一本化）
    expect(PROBLEM).toMatch(/if \(listeningUnified\) return null;/);
  });

  it('設問文は問題ペイン（左側）に出す（何を答えるか分からなくならないように）', () => {
    // いま解いている問（activeStepSub）の設問文を左ペインに出す。
    expect(PROBLEM).toContain('splitQuestionLabel(activeStepSub.label');
  });

  it('スマホでも下部パネルに飛ばさず、カード内で選択肢を表示する', () => {
    // 以前は「isDesktop || listeningUnified ? 直接表示 : 表示専用チップ」の分岐で、
    // 化学などのスマホは下部パネルに複製の解答UIを出していた（重複解答欄）。
    // いまは全教科・全端末で renderMultipleChoiceControl をカード内に直接描画する。
    expect(QUIZ).not.toContain('isDesktop || listeningUnified ?');
    expect(ANSWER).toContain('renderMultipleChoiceControl(sq)');
  });

  it('音源を持つ問題だけを対象にする（化学などに影響しない）', () => {
    expect(DERIVED).toContain('const listeningUnified = listeningTracks.length > 0');
  });
});

// =====================================================================
// ④ 上部の「音源を聞く」パネルは置かない
// =====================================================================
describe('英語リスニング：見出しつき音源パネル（panel）は使わない', () => {
  it('Quiz は panel バリアント（見出しつきパネル）を使っていない', () => {
    // 音源は問題ブロックの横帯（inline + horizontal）だけに置く。
    // 問題文ペインを ProblemPane.tsx へ切り出したので、
    // プレイヤーの置き場所は「Quiz.tsx と切り出し先の両方」を見る。
    const SOURCES = QUIZ + '\n' + PROBLEM;
    expect(SOURCES).not.toMatch(/<ListeningAudioPlayer(?![\s\S]{0,400}?variant="inline")/);
    const inlineCount = (SOURCES.match(/variant="inline"/g) || []).length;
    const playerCount = (SOURCES.match(/<ListeningAudioPlayer/g) || []).length;
    expect(playerCount).toBeGreaterThan(0);
    expect(inlineCount).toBe(playerCount);
  });

  it('速度切替（0.75倍／標準）は inline バリアントに移設されている', () => {
    const player = read('src/components/ListeningAudioPlayer.tsx');
    // inline の早期 return より前に速度切替のボタン群があること
    const inlineAt = player.indexOf('if (isInline) {');
    const returnAt = player.indexOf('return (', inlineAt);
    const endAt = player.indexOf('return (\n    <section');
    const inlineBlock = player.slice(returnAt, endAt);
    expect(inlineAt).toBeGreaterThan(-1);
    expect(inlineBlock).toContain('0.75倍');
    expect(inlineBlock).toContain('setRate');
  });
});

// =====================================================================
// 音源が無い回の読み上げフォールバック
// =====================================================================
describe('MP3 未収録の回でも音が出る（読み上げフォールバック）', () => {
  it('audioUrl は任意項目になっている', () => {
    const types = read('src/data/englishListeningQ1AProblems.ts');
    expect(types).toContain('audioUrl?: string');
  });

  it('読み上げユーティリティが用意されている', () => {
    expect(SPEECH).toContain('export function speak(');
    expect(SPEECH).toContain('export function stopSpeech(');
    expect(SPEECH).toContain('export function isSpeechSupported(');
    expect(SPEECH).toContain('export function hasRealAudio(');
  });

  it('プレーヤーが MP3 の有無で経路を切り替える', () => {
    expect(PLAYER).toContain('hasRealAudio(track)');
    expect(PLAYER).toContain('speak(subId, track.script');
  });

  it('読み上げで代替していることを画面上で明示する', () => {
    expect(PLAYER).toContain('読み上げ音声で再生します');
  });

  it('提供音声を適用した類題集は実在するMP3を参照する', () => {
    for (const p of [...EL1_A_EXTRA_PROBLEMS, ...EL1_B_PROBLEMS]) {
      for (const track of p.audioTracks) {
        expect(track.audioUrl, track.subId).toMatch(/^\/listening_audio\/el1[AB]_set\d+_q\d+\.mp3$/);
        expect(fs.existsSync(path.join(ROOT, 'public', track.audioUrl!)), track.subId).toBe(true);
      }
    }
  });
});

// =====================================================================
// ⑦ 第1問B セット7〜15：選択肢のシャッフル
// =====================================================================
//
// 配布 PDF は第7セット以降の正解がすべて ① になっていた（PDF 側の不備）。
// 「①を押しておけば当たる」状態では消去法の練習にならないため、
// イラスト（画像の①〜④のコマ）と正解をセットで入れ替えている。
// 巻き戻ると気づけないので、テストで固定する。
describe('第1問B：セット7〜15 の選択肢はシャッフルされている', () => {
  const SHUFFLED = EL1_B_PROBLEMS.filter((p) => {
    const m = p.id.match(/set(\d+)$/);
    return m ? Number(m[1]) >= 7 : false;
  });

  it('対象は 9セット・36問', () => {
    expect(SHUFFLED.length).toBe(9);
    expect(SHUFFLED.reduce((n, p) => n + p.subQuestions.length, 0)).toBe(36);
  });

  it('各セットの正解に ①②③④ がちょうど1回ずつ出る', () => {
    for (const p of SHUFFLED) {
      const answers = p.subQuestions.map((sq: any) => sq.correctAnswer);
      expect([...answers].sort()).toEqual([...MARKS].sort());
    }
  });

  it('「①ばかり」ではない（正解の偏りが解消されている）', () => {
    const count: Record<string, number> = { '①': 0, '②': 0, '③': 0, '④': 0 };
    for (const p of EL1_B_PROBLEMS) {
      for (const sq of p.subQuestions as any[]) count[sq.correctAnswer] += 1;
    }
    // 60問中どのマークも「半分以上」にはならない＝当てずっぽうが通らない
    for (const mark of MARKS) expect(count[mark]).toBeLessThan(30);
    // どのマークも必ず出番がある
    for (const mark of MARKS) expect(count[mark]).toBeGreaterThan(0);
  });

  it('並びが単純な規則（昇順・降順・一定間隔）になっていない', () => {
    for (const p of SHUFFLED) {
      const idx = p.subQuestions.map((sq: any) => MARKS.indexOf(sq.correctAnswer));
      expect(idx).not.toEqual([...idx].sort((a, b) => a - b));
      expect(idx).not.toEqual([...idx].sort((a, b) => b - a));
      // 「+1 ずつずれる」ような回転パターンも避ける
      const strides = new Set([0, 1, 2].map((i) => (idx[i + 1] - idx[i] + 4) % 4));
      expect(strides.size).toBeGreaterThan(1);
    }
  });

  it('イラストの差し替え前の原本を保管している（再シャッフル・巻き戻しが可能）', () => {
    const dir = path.join(ROOT, 'scripts/assets/q1b_original');
    expect(fs.existsSync(dir)).toBe(true);
    expect(fs.readdirSync(dir).filter((f) => f.endsWith('.jpg')).length).toBe(36);
  });

  it('シャッフル用スクリプトが残っている（手作業ではない＝再現できる）', () => {
    const script = read('scripts/shuffle_q1b_options.py');
    // 選択肢の①②③④のバッジと枠は動かさず、中身だけを入れ替える設計。
    expect(script).toContain('badge_box');
    expect(script).toContain('frame_inner_box');
    // 乱数の種を固定しているので、同じ結果を再現できる
    expect(script).toMatch(/SEED\s*=\s*\d+/);
  });

  it('解説の中の ①〜④ も入れ替え後の番号に合わせて書き換わっている', () => {
    for (const p of SHUFFLED) {
      for (const sq of p.subQuestions as any[]) {
        const no = sq.id.slice(sq.id.lastIndexOf('_') + 1);
        // 「問N　正解は ○」の行が subQuestion.correctAnswer と一致していること。
        // ここがズレると「解説を読んだら正解が違う」という最悪の不整合になる。
        const m = p.explanation.match(new RegExp(`問${no}\\s*正解は\\s*([①②③④])`));
        expect(m, `${sq.id} の解説に正解の行が無い`).not.toBeNull();
        expect(m![1]).toBe(sq.correctAnswer);
      }
    }
  });
});
