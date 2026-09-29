import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { EL2_PROBLEMS } from '../src/data/englishListeningQ2Problems';
import { englishListeningData } from '../src/data/englishListeningData';

/**
 * ===================================================================
 * 英語リスニング 第2問（イラスト選択）の回帰テスト
 * ===================================================================
 *
 * ■ このテストが守っていること
 *   ① データそのものの整合（選択肢・正解・音源トラックの対応）
 *   ② 収録した全問にイラストの実ファイルがあること
 *      → 第2問は「4枚の絵を見比べて選ぶ」大問なので、
 *        絵が無い問を出すとマーク（①〜④）だけが並んで原理的に解けない。
 *   ③ イラストのパスが設問IDと1対1で対応している（絵の貼り違え防止）
 *   ④ 実物イラストを使う問が「PDF 原文の並び」で固定されていること
 *   ⑤ 収録した全問がそのまま単元へ流し込まれていること
 *
 * ■ 「48問すべて」を要求しない理由
 *   当初は48問ぶんの絵を自前生成する前提で、
 *   「48枚揃うまで単元に登録しない」全か無かの設計にしていた。
 *   その後、配布 PDF から実物のイラストが取れたため、
 *   絵が揃った問だけを先に公開する方式へ変えた。
 *   そこでこのテストも「収録した問には必ず絵がある」
 *   「絵のある問は必ず公開されている」という不変条件に置き換えている。
 *   ★問数を定数で書かない★のは、追加のたびにテストを書き換える運用にすると
 *   「テストを数字に合わせる」だけの作業になり、検査の意味が薄れるため。
 */

const ROOT = path.resolve(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'public/listening_q2');
const MARKS = ['①', '②', '③', '④'];

const allSub = EL2_PROBLEMS.flatMap((p) => p.subQuestions as any[]);

/** imageUrl（/listening_q2/el2_set9_q2.jpg）から実ファイルのパスを作る。 */
const fileOf = (imageUrl: string) =>
  path.join(ROOT, 'public', imageUrl.replace(/^\//, ''));

/** id（q_el2_set9_2）から (セット番号, 問番号) を取り出す。 */
function idParts(id: string): { set: number; q: number } {
  const m = /^q_el2_set(\d+)_(\d)$/.exec(id);
  if (!m) throw new Error(`設問IDの形式が違う: ${id}`);
  return { set: Number(m[1]), q: Number(m[2]) };
}

describe('第2問：収録データの整合', () => {
  it('1問以上収録されており、各セットに1問以上ある', () => {
    expect(EL2_PROBLEMS.length).toBeGreaterThan(0);
    expect(allSub.length).toBeGreaterThan(0);
    for (const p of EL2_PROBLEMS) {
      expect(p.subQuestions.length).toBeGreaterThan(0);
    }
  });

  it('2回読み（本番と同じ）である', () => {
    for (const p of EL2_PROBLEMS) {
      expect(p.readCount).toBe(2);
    }
  });

  it('全設問がマーク式（①〜④）で、正解がその中にある', () => {
    for (const sq of allSub) {
      expect(sq.type).toBe('multiple_choice');
      expect(sq.options).toEqual(MARKS);
      expect(MARKS).toContain(sq.correctAnswer);
    }
  });

  it('各問に音源トラック（対話スクリプト）が対応づいている', () => {
    for (const p of EL2_PROBLEMS) {
      expect(p.audioTracks).toHaveLength(p.subQuestions.length);
      const subIds = (p.subQuestions as any[]).map((s) => s.id);
      for (const track of p.audioTracks as any[]) {
        expect(subIds).toContain(track.subId);
        expect(track.script.trim().length).toBeGreaterThan(5);
        // 2人の対話なので発話は必ず2つ以上。1つだと話者交替が耳で分からない。
        expect(track.turns.length).toBeGreaterThanOrEqual(2);
        for (const turn of track.turns) {
          expect(turn.who.trim().length).toBeGreaterThan(0);
          expect(turn.text.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('IDがセット・問番号と一致し、セット内で問番号が昇順である', () => {
    // ★問番号は「1,2,3」と詰めない★
    // イラストが揃っていない問を飛ばして公開しているため、
    // 「問1・問2」だけ、「問2・問3」だけというセットが存在する。
    // 詰め直すと、後日追加したときに既存の学習記録の ID が別の問を指す。
    for (const p of EL2_PROBLEMS) {
      const m = /^q_el2_set(\d+)$/.exec(p.id);
      expect(m, `セットIDの形式が違う: ${p.id}`).not.toBeNull();
      const setNo = Number(m![1]);

      let prev = 0;
      for (const sq of p.subQuestions as any[]) {
        const { set, q } = idParts(sq.id);
        expect(set).toBe(setNo);
        expect(q).toBeGreaterThan(prev);
        prev = q;
      }
    }
  });

  it('セット番号が重複せず昇順である', () => {
    const nums = EL2_PROBLEMS.map((p) => Number(/^q_el2_set(\d+)$/.exec(p.id)![1]));
    expect(new Set(nums).size).toBe(nums.length);
    expect([...nums]).toEqual([...nums].sort((a, b) => a - b));
  });
});

describe('第2問：正解位置（耳を使わずに解けないようにする）', () => {
  it('①〜④のどれかに全部集まっていない', () => {
    // 実物イラストを使う問は ①②③④ が絵に焼き込まれているため
    // 並べ替えられず、公開分だけを見ると偏りが残る。
    // それでも「1つの位置だけ塗れば全部当たる」状態は避けられていること。
    const count: Record<string, number> = { '①': 0, '②': 0, '③': 0, '④': 0 };
    for (const sq of allSub) count[sq.correctAnswer] += 1;
    const used = Object.values(count).filter((n) => n > 0).length;
    expect(used).toBeGreaterThanOrEqual(3);

    const best = Math.max(...Object.values(count));
    expect(best / allSub.length).toBeLessThan(0.5);
  });

  it('解説に選択肢のイラスト説明と、収録した問の見出しが入っている', () => {
    for (const p of EL2_PROBLEMS) {
      expect(p.explanation).toContain('選択肢のイラスト：');
      for (const sq of p.subQuestions as any[]) {
        const { q } = idParts(sq.id);
        expect(p.explanation).toMatch(new RegExp(`^問${q}`, 'm'));
      }
    }
  });

  it('問題文には選択肢の日本語説明を出さない（絵を読み取る練習にするため）', () => {
    // 例：第1セット問1の選択肢文が問題文に混ざっていないこと
    const first = EL2_PROBLEMS[0];
    expect(first.explanation).toContain('ミルク');
    expect(first.text).not.toContain('ミルク');
  });

  it('問を飛ばしたセットには、その旨が問題文に書かれている', () => {
    for (const p of EL2_PROBLEMS) {
      const qs = (p.subQuestions as any[]).map((sq) => idParts(sq.id).q);
      const skipped = [1, 2, 3].filter((n) => !qs.includes(n));
      if (skipped.length === 0) continue;
      // 「問3が無いのはなぜか」が学習者に分かるようにしておく。
      expect(p.text).toContain('イラストの準備中');
      for (const n of skipped) {
        expect(p.text).toContain(`問${n}`);
      }
    }
  });
});

describe('第2問：イラストの割り当て', () => {
  it('imageUrl が設問IDと1対1で対応している', () => {
    for (const p of EL2_PROBLEMS) {
      for (const sq of p.subQuestions as any[]) {
        const { set, q } = idParts(sq.id);
        expect(sq.imageUrl).toBe(`/listening_q2/el2_set${set}_q${q}.jpg`);
        expect(typeof sq.imageCaption).toBe('string');
        expect(sq.imageCaption.length).toBeGreaterThan(0);
      }
    }
  });

  it('imageUrl は public 配下を指す（共有URLを資産にしない）', () => {
    for (const sq of allSub) {
      expect(sq.imageUrl).toMatch(/^\/listening_q2\/el2_set\d+_q\d\.jpg$/);
    }
  });

  it('画像が重複していない（絵の貼り違えを防ぐ）', () => {
    const urls = allSub.map((sq) => sq.imageUrl);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('★収録した全問にイラストの実ファイルがある★', () => {
    // これが第2問でいちばん大事な条件。
    // 絵が無い問を収録すると、マークだけが並ぶ解けない問題になる。
    const missing = allSub
      .filter((sq) => !fs.existsSync(fileOf(sq.imageUrl)))
      .map((sq) => sq.imageUrl);
    expect(missing, `イラストが無い問がある: ${missing.join(', ')}`).toEqual([]);
  });

  it('イラストが壊れていない（空ファイルを混ぜない）', () => {
    for (const sq of allSub) {
      const file = fileOf(sq.imageUrl);
      expect(fs.statSync(file).size, `画像が小さすぎる: ${sq.imageUrl}`).toBeGreaterThan(5000);
    }
  });

  it('イラストの縦横比が保たれている（正方形に押し込んでいない）', () => {
    // 以前は無条件に 900x900 へ resize していたため、
    // 横長の1枚図（地図・座席表など）が縦に伸びて位置関係が読めなくなる恐れがあった。
    // 長辺が 900 以内で、極端に潰れていないことを確かめる。
    for (const sq of allSub) {
      const buf = fs.readFileSync(fileOf(sq.imageUrl));
      const size = jpegSize(buf);
      expect(size, `JPEGのサイズが読めない: ${sq.imageUrl}`).not.toBeNull();
      const { width, height } = size!;
      expect(Math.max(width, height)).toBeLessThanOrEqual(900);
      const ratio = width / height;
      expect(ratio, `縦横比が極端: ${sq.imageUrl} (${width}x${height})`).toBeGreaterThan(0.5);
      expect(ratio).toBeLessThan(2);
    }
  });

  it('並べ替え後のプロンプトが収録分ぶん保存されている（同じ絵を再生成できる）', () => {
    const dir = path.join(ROOT, 'scripts/data/q2_prompts');
    expect(fs.existsSync(dir)).toBe(true);
    for (const sq of allSub) {
      const name = sq.imageUrl.replace('/listening_q2/', '').replace('.jpg', '.txt');
      const file = path.join(dir, name);
      expect(fs.existsSync(file), `プロンプトが無い: ${name}`).toBe(true);
      expect(fs.statSync(file).size).toBeGreaterThan(100);
    }
  });
});

describe('第2問：単元への配線', () => {
  function el2Chapter(): any {
    for (const part of (englishListeningData as any).parts ?? []) {
      for (const ch of part.chapters ?? []) {
        if (ch.id === 'el2') return ch;
      }
    }
    return null;
  }

  it('el2 の単元が存在する', () => {
    expect(el2Chapter()).not.toBeNull();
  });

  it('収録した全セットがそのまま演習問題として登録されている', () => {
    const problems = el2Chapter().practiceProblems ?? [];
    expect(problems).toHaveLength(EL2_PROBLEMS.length);
    expect(problems.map((p: any) => p.id)).toEqual(EL2_PROBLEMS.map((p) => p.id));
  });

  it('画像ディレクトリが用意されている', () => {
    expect(fs.existsSync(IMG_DIR)).toBe(true);
  });
});

/**
 * JPEG のヘッダから幅・高さを読む（画像ライブラリを足さずに寸法だけ知りたいため）。
 * SOF0〜SOF15 マーカー（0xFFC0〜0xFFCF、ただし C4/C8/CC は除く）に寸法が入っている。
 */
function jpegSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = buf.readUInt16BE(i + 2);
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}
