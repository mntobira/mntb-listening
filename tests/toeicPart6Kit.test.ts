import { describe, expect, it } from 'vitest';
import {
  blankLabel, buildToeicP6Round, fillParagraph, p6AnswerPositions, p6RoundBreakdown, passageWordCount, renderParagraph,
  TOEIC_P6_QUESTIONS_PER_ROUND, validateP6Round, validateP6Set, type ToeicP6Set,
} from '../src/data/toeic/toeicPart6Kit';
import { TOEIC_MARKS } from '../src/data/toeic/toeicPart5Kit';
import { TOEIC_P6_ROUNDS } from '../src/data/toeic/toeicPart6Rounds';
import { getToeicPart6Stats, toeicPart6Data } from '../src/data/toeic/toeicPart6Data';
import { SUBJECT_REGISTRY } from '../src/data/subjects';

/**
 * TOEIC Part 6 の道具の検査（2026-10-30 準備）
 * 問題データはまだ無いので、テストの中だけの見本（架空の社内連絡）で道具を確かめる。
 * この見本はアプリには入らない。
 */
const SAMPLE: ToeicP6Set = {
  genre: '社内連絡',
  title: 'Parking Lot Repairs',
  sc: '施設・地域',
  p: [
    'To all Brenfield Logistics staff: The east parking lot will be [[1]] for repairs from Monday, June 3, through Friday, June 7.',
    '[[2]] During this period, employees may use the visitor spaces near the main entrance. Please display your staff permit on the dashboard at all times.',
    'Space near the entrance is limited, [[3]] we encourage you to share rides or take the shuttle from Orrin Station. [[4]] questions about the schedule should be sent to the facilities office.',
  ],
  tr: [
    'ブレンフィールド物流の全従業員へ：東駐車場は、6月3日（月）から6月7日（金）まで補修のため閉鎖されます。',
    '舗装の打ち直しには5日間かかる見込みです。この期間、従業員は正面入口近くの来客用区画を使えます。常に従業員用の駐車許可証をダッシュボードに掲示してください。',
    '入口近くの区画は限られているので、相乗りするか、オリン駅からのシャトルを使うことをおすすめします。日程についての質問は施設管理室へ送ってください。',
  ],
  b: [
    { k: '動詞の形', t: '受け身', d: 1, c: 'closed',
      w: [['closing', '進行形だと駐車場が何かを閉じることになる'], ['close', '原形は will be の後ろに置けない'], ['closure', '名詞。will be の後ろで「閉鎖」そのものになり意味が合わない']],
      why: '主語の parking lot は「閉じられる」側。will be の後ろに過去分詞 closed を置いて受け身にする。', kw: [['parking lot', '駐車場']] },
    { k: '文挿入', t: '前の文を受ける', d: 2, c: 'The resurfacing work is expected to take five days.',
      w: [['The new lot will open next year.', '新しい駐車場の話は前後のどこにもつながらない'], ['Thank you for attending the meeting.', '会議の話は出てこない'], ['Visitors must sign in at the front desk.', '来客の受付の話で、従業員の駐車の流れと合わない']],
      why: '前の段落の「6月3日から7日まで補修」を受けて、工事の日数を述べる文が入ると次の During this period につながる。', kw: [['resurfacing', '舗装の打ち直し']] },
    { k: 'つなぎの語句', t: '結果', d: 2, c: 'so',
      w: [['but', '逆接。区画が限られている→相乗りをすすめる、は逆の関係ではない'], ['although', '従属接続詞。文の後半の頭に置くと意味が逆になる'], ['unless', '「〜でなければ」。条件の関係ではない']],
      why: '「区画が限られている」が原因、「相乗りをすすめる」が結果。結果をつなぐのは so。', kw: [['share rides', '相乗りする']] },
    { k: '語彙', t: '形容詞', d: 1, c: 'Any',
      w: [['Every', '後ろに単数名詞を取る。questions（複数）と合わない'], ['Each', '後ろに単数名詞を取る。questions（複数）と合わない'], ['Much', '数えられない名詞に使う。questions は数えられる']],
      why: '複数名詞 questions の前で「どんな〜でも」を表すのは Any。', kw: [['facilities office', '施設管理室']] },
  ],
};

const ROUND = [
  SAMPLE,
  { ...SAMPLE, genre: 'Eメール' as const },
  { ...SAMPLE, genre: 'お知らせ' as const },
  { ...SAMPLE, genre: '広告' as const },
];

describe('TOEIC Part 6：本文の表示', () => {
  it('[[n]] を回の中の通し番号つきの空所にする', () => {
    expect(blankLabel(5)).toBe('(5)______');
    expect(renderParagraph('A [[1]] B [[2]].', 4)).toBe('A (5)______ B (6)______.');
  });

  it('[[n]] に正解を入れた完成文（文挿入も同じ位置に入る）', () => {
    const filled = SAMPLE.p.map((x) => fillParagraph(x, SAMPLE.b)).join(' ');
    expect(filled).toContain('will be closed for repairs');
    expect(filled).toContain('The resurfacing work is expected to take five days. During this period');
    expect(filled).not.toMatch(/\[\[\d\]\]/);
  });

  it('語数は空所の印を数えない', () => {
    expect(passageWordCount({ p: ['One [[1]] two three.'] })).toBe(3);
  });
});

describe('TOEIC Part 6：形の検査', () => {
  it('見本は問題なし', () => {
    expect(validateP6Set(SAMPLE)).toEqual([]);
    expect(validateP6Round(ROUND)).toEqual([]);
  });

  it('空所の印の抜け・段落と和訳の数のずれ・文挿入の数・選択肢の重複を見つける', () => {
    expect(validateP6Set({ ...SAMPLE, p: SAMPLE.p.map((x) => x.replace('[[3]]', '')) }).join()).toContain('空所の印');
    expect(validateP6Set({ ...SAMPLE, tr: SAMPLE.tr.slice(0, 2) }).join()).toContain('和訳');
    const noInsert = { ...SAMPLE, b: SAMPLE.b.map((x) => ({ ...x, k: '語彙' as const })) as ToeicP6Set['b'] };
    expect(validateP6Set(noInsert).join()).toContain('文挿入が 0 問');
    const dup = { ...SAMPLE, b: [{ ...SAMPLE.b[0], c: 'close' }, SAMPLE.b[1], SAMPLE.b[2], SAMPLE.b[3]] as ToeicP6Set['b'] };
    expect(validateP6Set(dup).join()).toContain('選択肢4つが互いに違っていない');
  });

  it('1回は文書4つ・種類は3種類以上', () => {
    expect(validateP6Round(ROUND.slice(0, 3)).join()).toContain('文書が 3 つ');
    expect(validateP6Round([SAMPLE, SAMPLE, SAMPLE, SAMPLE]).join()).toContain('種類');
  });
});

describe('TOEIC Part 6：1回の組み立て', () => {
  const problem = buildToeicP6Round({ round: 1 }, ROUND);

  it('16問・小問IDと正解マークがデータの正解と一致する', () => {
    expect(problem.subQuestions).toHaveLength(TOEIC_P6_QUESTIONS_PER_ROUND);
    expect(problem.id).toBe('q_tp6_1_r01');
    problem.subQuestions.forEach((sq, i) => {
      expect(sq.id).toBe(`q_tp6_1_r01_${i + 1}`);
      const idx = TOEIC_MARKS.indexOf(sq.correctAnswer as (typeof TOEIC_MARKS)[number]);
      expect(sq.optionTexts?.[idx], `問${i + 1}`).toBe(ROUND[Math.floor(i / 4)].b[i % 4].c);
    });
  });

  it('問題文に空所の通し番号 (1)〜(16) が1回ずつ出る', () => {
    for (let n = 1; n <= 16; n += 1) expect(problem.text.split(`(${n})______`).length - 1, `(${n})`).toBe(1);
    expect(problem.text).not.toMatch(/\[\[\d\]\]/);
  });

  it('文書ごとの解説カード（4問ぶんの小問ID・完成文・全訳）', () => {
    expect(problem.audioTracks).toHaveLength(4);
    expect(problem.audioTracks[1].subIds).toEqual(['q_tp6_1_r01_5', 'q_tp6_1_r01_6', 'q_tp6_1_r01_7', 'q_tp6_1_r01_8']);
    expect(problem.audioTracks[0].script).not.toMatch(/\[\[\d\]\]/);
    expect(problem.audioTracks[0].translation).toContain('東駐車場');
  });

  it('正解の位置：A〜D がそれぞれ3〜5回・3問続かない（各回）', () => {
    for (let round = 1; round <= 30; round += 1) {
      const pos = p6AnswerPositions(round, 16);
      [0, 1, 2, 3].forEach((p) => {
        const n = pos.filter((v) => v === p).length;
        expect(n, `第${round}回`).toBeGreaterThanOrEqual(3);
        expect(n, `第${round}回`).toBeLessThanOrEqual(5);
      });
      expect(pos.some((v, i) => i >= 2 && v === pos[i - 1] && v === pos[i - 2]), `第${round}回`).toBe(false);
    }
  });

  it('回の一覧カードの配分', () => {
    expect(p6RoundBreakdown(ROUND)).toBe('文法4・語彙4・つなぎ4・文挿入4');
  });
});

describe('TOEIC Part 6：いまの状態（2026-10-31 問題を入れて TOEIC の教科につないだ）', () => {
  it('問題が1回以上あり、TOEIC の教科（toeic_part5）の中の単元 tp6_1 として出る', () => {
    expect(TOEIC_P6_ROUNDS.length).toBeGreaterThan(0);
    expect(getToeicPart6Stats()).toEqual({ chapters: 1, questions: TOEIC_P6_ROUNDS.length, marks: TOEIC_P6_ROUNDS.length * 16 });
    expect(toeicPart6Data.parts[0].chapters[0].id).toBe('tp6_1');
    // 教科は Part 5 と同じ TOEIC（教科を分けると進み具合・復習の記録が別になるため）
    expect(SUBJECT_REGISTRY.map((s) => s.id as string)).not.toContain('toeic_part6');
  });

  it('全回が形の検査を通る', () => {
    TOEIC_P6_ROUNDS.forEach((sets, r) => expect(validateP6Round(sets), `第${r + 1}回`).toEqual([]));
  });
});
