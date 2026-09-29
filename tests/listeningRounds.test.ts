/**
 * ====================================================================
 * 「第N回演習」ボタンの元になる回の取り出し（listeningRounds）のテスト
 * ====================================================================
 *
 * ■ 何を守るためのテストか（ご要望）
 *   「第1問Aのページ ⇒ 第1回演習〜第14回演習までのボタンがある」形にした。
 *   このボタンの見出しと並び順は、問題データの `category`
 *   （例：'第2回 短い発話の言い換え（易しめ（導入））'）から機械的に作っている。
 *   ここが崩れると、ボタンの番号がズレて「第3回を押したのに別の回が出る」
 *   という致命的な取り違えが起きるので、テストで固定しておく。
 */

import { describe, it, expect } from 'vitest';
import { buildListeningRounds, parseRoundLabel } from '../src/utils/listeningRounds';
import { englishListeningData } from '../src/data/englishListeningData';

function chapterById(id: string) {
  return englishListeningData.parts
    .flatMap((p) => p.chapters as any[])
    .find((c) => c.id === id);
}

describe('parseRoundLabel（category から回の番号と内容を読み取る）', () => {
  it('「第N回 ＋ 内容」から番号と内容を取り出せる', () => {
    expect(parseRoundLabel('第2回 短い発話の言い換え（易しめ（導入））', 0)).toEqual({
      roundNumber: 2,
      detail: '短い発話の言い換え（易しめ（導入））',
    });
  });

  it('「第N回」だけでも壊れない（内容は空になる）', () => {
    expect(parseRoundLabel('第7回', 0)).toEqual({ roundNumber: 7, detail: '' });
  });

  it('全角スペースや空白なしでも拾える（表記ゆれに強くする）', () => {
    expect(parseRoundLabel('第3回　発話に合うイラストを選ぶ（標準）', 0).roundNumber).toBe(3);
    expect(parseRoundLabel('第10回発話に合うイラストを選ぶ', 0).roundNumber).toBe(10);
  });

  it('「第N回」と書かれていないデータは並び順から番号を作る（画面を壊さない）', () => {
    // 将来ほかの大問を追加したとき、category の書式が違っても
    // ボタンが消えたり空白になったりしないための保険。
    expect(parseRoundLabel('ワークシート完成問題', 4)).toEqual({
      roundNumber: 5,
      detail: 'ワークシート完成問題',
    });
    expect(parseRoundLabel(undefined, 0)).toEqual({ roundNumber: 1, detail: '' });
  });
});

describe('buildListeningRounds（回のボタン一覧を作る）', () => {
  it('第1問A は第1回演習〜第14回演習の14個になる', () => {
    // ご要望「第1回演習〜第14回演習までのボタンがある」形そのもの
    const rounds = buildListeningRounds(chapterById('el1_A')?.practiceProblems);
    expect(rounds).toHaveLength(14);
    expect(rounds.map((r) => r.roundLabel)).toEqual([
      '第1回演習', '第2回演習', '第3回演習', '第4回演習', '第5回演習',
      '第6回演習', '第7回演習', '第8回演習', '第9回演習', '第10回演習',
      '第11回演習', '第12回演習', '第13回演習', '第14回演習',
    ]);
  });

  it('第1問B にも同じ形が使われている（第1回演習〜第15回演習）', () => {
    // ご要望「それは第1問B以降も採用してほしい」
    const rounds = buildListeningRounds(chapterById('el1_B')?.practiceProblems);
    expect(rounds).toHaveLength(15);
    expect(rounds[0].roundLabel).toBe('第1回演習');
    expect(rounds[14].roundLabel).toBe('第15回演習');
  });

  it('index は章の中の通し番号（0始まり）で、画面遷移にそのまま使える', () => {
    // Quiz / Explanation へ渡す範囲はこの index を基準にしている。
    // ここがズレると「押した回と違う回が開く」ので必ず 0,1,2… であること。
    const rounds = buildListeningRounds(chapterById('el1_A')?.practiceProblems);
    expect(rounds.map((r) => r.index)).toEqual([...Array(14).keys()]);
  });

  it('questionId は問題データの id と一致する（進捗の「済」判定に使う）', () => {
    const problems = chapterById('el1_A')?.practiceProblems as any[];
    const rounds = buildListeningRounds(problems);
    expect(rounds.map((r) => r.questionId)).toEqual(problems.map((p) => p.id));
  });

  it('回の内容（detail）が付いていて、何をする回か分かる', () => {
    const rounds = buildListeningRounds(chapterById('el1_B')?.practiceProblems);
    // ボタンに「第3回演習」だけでなく内容も添えられていること
    expect(rounds[2].detail).toContain('イラスト');
  });

  it('問題が無い（未収録の）大問では空配列になる（準備中の表示に使う）', () => {
    // ★特定の大問IDを書かない★
    //   以前は「まだ未収録の第2問（el2）で確かめる」と id を直接書いていたが、
    //   第2問を収録した時点でこのテストが落ちた。収録が進むたびに
    //   テストを書き換えるのは本質的でないので、
    //   「その時点で practiceProblems が空の大問」を実データから探す形にする。
    const empty = englishListeningData.parts
      .flatMap((p) => p.chapters as any[])
      .filter((c) => (c.practiceProblems?.length ?? 0) === 0);
    // 全大問が埋まったらこのケースは検証不要（空配列の入力だけ確認する）
    for (const c of empty) {
      expect(buildListeningRounds(c.practiceProblems), `${c.id} は未収録`).toEqual([]);
    }
    expect(buildListeningRounds([])).toEqual([]);
    expect(buildListeningRounds(undefined)).toEqual([]);
    expect(buildListeningRounds(null)).toEqual([]);
  });
});
