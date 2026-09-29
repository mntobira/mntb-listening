/**
 * ===================================================================
 * 英語リスニング 第3問の収録／対話音声／単元選択の一覧化テスト
 * ===================================================================
 * ご要望（原文）：
 *   > 第３問を追加して。音声も同様に作成して。
 *   > 単元選択をカルーセルではなく一覧にして。
 *
 * 分解すると次の3点になる。
 *   F1 第3問（15セット×6問＝90問）をアプリに載せる
 *   F2 音声も同じように用意する。ただし第3問は「2人の対話」なので、
 *      1つの声で通して読むと話者の交替が分からず設問が解けない。
 *      A / B に別の声を割り当てて読み上げる。
 *   F3 単元選択の章タブを、横スクロール（カルーセル）から一覧（折り返し）にする
 *
 * これらは別の修正で簡単に巻き戻る（データの配線が外れる、
 * 対話読み上げが単一音声に戻る、tablist が overflow-x-auto に戻る）ため、
 * テストで固定する。
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { EL3_PROBLEMS } from '../src/data/englishListeningQ3Problems';
import { getAllListeningChapters } from '../src/data/englishListeningData';

const ROOT = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf-8');

const PLAYER = read('src/components/ListeningAudioPlayer.tsx');
const SPEECH = read('src/utils/listeningSpeech.ts');
const CHAPTER = read('src/components/ChapterSelection.tsx');

const MARKS = ['①', '②', '③', '④'];

// =====================================================================
// F1 データ：15セット × 6問 ＝ 90問
// =====================================================================
describe('F1 第3問：PDF の15セット（90問）が入っている', () => {
  it('15セットあり、通し番号（第1回〜第15回）が飛んでいない', () => {
    expect(EL3_PROBLEMS).toHaveLength(15);
    EL3_PROBLEMS.forEach((p, i) => {
      expect(p.id).toBe(`q_el3_set${i + 1}`);
      expect(p.category).toContain(`第${i + 1}回`);
    });
  });

  it('1セットは6問。合計90問ある（本番と同じマーク数）', () => {
    EL3_PROBLEMS.forEach((p) => {
      expect(p.subQuestions).toHaveLength(6);
      expect(p.audioTracks).toHaveLength(6);
    });
    const total = EL3_PROBLEMS.reduce((sum, p) => sum + p.subQuestions.length, 0);
    expect(total).toBe(90);
  });

  it('1回読み（readCount: 1）になっている', () => {
    // 第3問は本番でも1回しか流れない。2回読みにすると練習が本番と食い違う。
    EL3_PROBLEMS.forEach((p) => expect(p.readCount).toBe(1));
  });

  it('選択肢はマーク（①〜④）で、正解は必ずそのどれか', () => {
    EL3_PROBLEMS.forEach((p) => {
      p.subQuestions.forEach((sq: any) => {
        expect(sq.type).toBe('multiple_choice');
        expect(sq.options).toEqual(MARKS);
        expect(MARKS).toContain(sq.correctAnswer);
      });
    });
  });

  it('小問 id と音源 subId が1対1で対応している（音源の取り違えを防ぐ）', () => {
    EL3_PROBLEMS.forEach((p) => {
      const subIds = p.audioTracks.map((t) => t.subId);
      const sqIds = p.subQuestions.map((sq: any) => sq.id);
      expect(subIds).toEqual(sqIds);
      // id は全問でユニークでなければ進捗が混ざる
      expect(new Set(sqIds).size).toBe(sqIds.length);
    });
  });

  it('問題文に「場面」と英語の Question、①〜④の選択肢が並んでいる', () => {
    EL3_PROBLEMS.forEach((p) => {
      // 6問ぶんの区切りと場面・設問がある
      expect((p.text.match(/^問\d/gmu) || []).length).toBe(6);
      expect((p.text.match(/^場面：/gmu) || []).length).toBe(6);
      expect((p.text.match(/^Question: /gmu) || []).length).toBe(6);
      MARKS.forEach((m) => {
        expect((p.text.match(new RegExp(`^${m} `, 'gmu')) || []).length).toBe(6);
      });
    });
  });

  it('解説の「問N　正解は ○」が subQuestions の正解と一致している', () => {
    // 解説を読んだら正解が違う、という最悪の不整合を防ぐ命綱。
    EL3_PROBLEMS.forEach((p) => {
      p.subQuestions.forEach((sq: any, i: number) => {
        const line = new RegExp(`^問${i + 1}　正解は ${sq.correctAnswer}$`, 'mu');
        expect(p.explanation).toMatch(line);
      });
    });
  });

  it('正解の位置が偏っていない（音を聞かずに②③を塗れば当たる状態を避ける）', () => {
    // PDF 原文のままだと ①5 / ②40 / ③37 / ④8 と極端に偏っていた。
    // scripts/shuffle_listening_q3_options.py で並べ替えて均している。
    const counts = new Map<string, number>(MARKS.map((m) => [m, 0]));
    EL3_PROBLEMS.forEach((p) => {
      p.subQuestions.forEach((sq: any) => {
        counts.set(sq.correctAnswer, (counts.get(sq.correctAnswer) || 0) + 1);
      });
    });
    const values = [...counts.values()];
    expect(values.reduce((a, b) => a + b, 0)).toBe(90);
    // 均等なら各22〜23問。どのマークも「90問の1/4 ± 6問」に収まること。
    values.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(90 / 4 - 6);
      expect(v).toBeLessThanOrEqual(90 / 4 + 6);
    });
  });

  it('el3 単元に配線され、第3問として画面に出る', () => {
    const el3 = getAllListeningChapters().find((c) => c.id === 'el3');
    expect(el3).toBeTruthy();
    expect(el3!.practiceProblems).toHaveLength(15);
    expect(el3!.readCount).toBe(1);
    expect(el3!.marks).toBe(6);
    // 単元の設定（1回読み・2人の対話）とデータが食い違っていないこと
    expect(el3!.speakers).toContain('2人');
  });
});

// =====================================================================
// F2 音声：2人の対話として読み上げる
// =====================================================================
describe('F2 第3問の音声：A / B を別の声で読み上げる', () => {
  it('全問の音源が turns（A / B の発話列）を持っている', () => {
    EL3_PROBLEMS.forEach((p) => {
      p.audioTracks.forEach((t: any) => {
        expect(Array.isArray(t.turns)).toBe(true);
        // 対話なので最低2発話。実データは5〜7発話。
        expect(t.turns.length).toBeGreaterThanOrEqual(2);
        t.turns.forEach((turn: any) => {
          expect(['A', 'B']).toContain(turn.who);
          expect(turn.text.trim().length).toBeGreaterThan(0);
        });
        // A と B の両方が登場している（片方だけならモノローグになってしまう）
        const whos = new Set(t.turns.map((turn: any) => turn.who));
        expect(whos.has('A')).toBe(true);
        expect(whos.has('B')).toBe(true);
      });
    });
  });

  it('script は turns と同じ内容を「A: …」形式で持つ（MP3 が無いときの保険）', () => {
    EL3_PROBLEMS.forEach((p) => {
      p.audioTracks.forEach((t: any) => {
        const rebuilt = t.turns.map((x: any) => `${x.who}: ${x.text}`).join('\n');
        expect(t.script).toBe(rebuilt);
      });
    });
  });

  it('listeningSpeech に speakDialogue（話者ごとに声を替える）がある', () => {
    expect(SPEECH).toContain('export function speakDialogue(');
    expect(SPEECH).toContain('export function pickEnglishVoicePair(');
    // 声が1種類しかない端末でも聞き分けられるよう pitch をずらしている
    expect(SPEECH).toContain('pitch');
  });

  it('プレーヤーは turns があれば speakDialogue、なければ speak を使う', () => {
    expect(PLAYER).toContain('speakDialogue');
    expect(PLAYER).toMatch(/track\.turns && track\.turns\.length > 0/u);
    // 従来の単一音声経路（第1問）も残っていること
    expect(PLAYER).toMatch(/speak\(subId, track\.script/u);
  });

  it('復習のスクリプト表示は対話を行ごとに分ける（誰の発話か追えるように）', () => {
    expect(PLAYER).toMatch(/track\.turns\.map\(/u);
    expect(PLAYER).toContain('{turn.who}');
  });

  it('1回読みでは「2回続けて」ボタンを出さない', () => {
    // readCount === 2 のときだけ出す条件になっていること。
    expect(PLAYER).toContain('readCount === 2 && (');
  });
});

// =====================================================================
// F3 単元選択：カルーセル → 一覧
// =====================================================================
describe('F3 単元選択：横スクロールではなく一覧で並べる', () => {
  it('章タブは「スマホ＝横スクロール／PC＝grid一覧」の両立になっている', () => {
    // ■ 仕様変更の経緯
    //   当初は「横スクロールをやめて grid 一覧」だったが、その後のご要望
    //   「単元ボタンを縦に置いたら選びづらいから横に並べて横スクロールに」
    //   （feat(navigation): make mobile chapter tabs horizontally scrollable）で
    //   スマホは横スクロール・PC（sm以上）は grid 一覧、が現行仕様になった。
    const m = CHAPTER.match(/aria-label="章を選択"\s*\n\s*className="([^"]+)"/u);
    expect(m).toBeTruthy();
    const cls = m![1];
    // スマホ：横スクロール（スナップ付き）
    expect(cls).toContain('overflow-x-auto');
    expect(cls).toContain('snap-x');
    // PC（sm以上）：grid 一覧に戻し、横スクロールは無効化
    expect(cls).toContain('sm:grid');
    expect(cls).toContain('sm:overflow-x-visible');
  });

  it('章名は折り返して全文を出す（途中で切れて見分けが付かなくなるのを防ぐ）', () => {
    // 化学（発展）には '④ 希薄溶液の性質（沸点上昇・凝固点降下）' のような長い章名がある
    expect(CHAPTER).not.toMatch(/whitespace-nowrap">\{shortTitle\}/u);
    expect(CHAPTER).toMatch(/break-words[^"]*">\s*\n?\s*\{shortTitle\}/u);
  });

  it('タブとしての操作（キーボード・読み上げ）は壊していない', () => {
    expect(CHAPTER).toContain('role="tablist"');
    expect(CHAPTER).toContain('role="tab"');
    expect(CHAPTER).toContain('aria-selected={isActive}');
    expect(CHAPTER).toContain('aria-controls="chapter-tab-panel"');
    expect(CHAPTER).toContain('id={`chapter-tab-${index}`}');
    expect(CHAPTER).toContain('role="tabpanel"');
  });

  it('ボタンの高さを揃えて一覧として読める形にしている', () => {
    // grid／横スクロールのどちらでも高さがばらつくと読みにくいので h-full で揃える。
    // （横スクロール対応で min-h と flex-col の間に幅指定が入ったため、
    //   間に他のクラスがあっても許容する形で検査する）
    expect(CHAPTER).toMatch(/flex h-full min-h-\[3rem\][^"]*flex-col/u);
  });
});
