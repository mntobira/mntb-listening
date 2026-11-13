import { describe, expect, it } from 'vitest';
import { TOEIC_LISTENING_ROUNDS } from '../src/data/toeic/toeicListeningRounds';
import {
  buildToeicListeningRound,
  p2AnswerPositions,
  talkAnswerPositions,
  TOEIC_P2_MARKS,
  validateToeicListeningRound,
} from '../src/data/toeic/toeicListeningKit';
import { TOEIC_MARKS } from '../src/data/toeic/toeicPart5Kit';
import {
  isToeicListeningChapter,
  locateToeicListening,
  toeicListeningChoiceTexts,
  toeicListeningPageAudioOf,
  toeicListeningStem,
} from '../src/data/toeic/toeicListeningPage';
import {
  isToeicPageChapter,
  perPageOf,
  resolveCues,
  splitToeicPages,
  toeicExplanationFor,
} from '../src/components/toeic/toeicPageModel';
import { buildToeicListeningPageBudgets } from '../src/components/toeic/toeicTimeBudget';
import {
  __resetToeicListeningAudio,
  hasToeicListeningMp3,
  loadToeicListeningAudioIndex,
  toeicListeningAudioUrl,
} from '../src/utils/toeicListeningAudio';
import { BANNED, MAX_WIDTH, textWidth } from './toeicPart5Notes.test';

const SPACING = /,[A-Za-z]|[a-z]\.[A-Z]|\s{2,}/;
const UK_SPELLING =
  /\b(colour|favour|honour|labour|neighbour|centre|theatre|metre|litre|catalogue|dialogue|programme|travelling|travelled|cancelled|cancelling|organisation|organise|realise|recognise|apologise|analyse|defence|licence|practise|offence|cheque|grey|enquire|enquiry|fulfil|skilful|instalment)\b/i;

const problems = TOEIC_LISTENING_ROUNDS.map((round, i) => buildToeicListeningRound(i + 1, round));

describe('TOEIC リスニング（全15回・180問・120トラック）', () => {
  it('全15回あり、各回 Part 2（6問）＋Part 3（3問）＋Part 4（3問）＝12問・8トラック', () => {
    expect(TOEIC_LISTENING_ROUNDS).toHaveLength(15);
    problems.forEach((p, i) => {
      expect(p.subQuestions, `第${i + 1}回`).toHaveLength(12);
      expect(p.audioTracks, `第${i + 1}回`).toHaveLength(8);
      expect(p.subQuestions.slice(0, 6).every((sq) => sq.options.length === 3)).toBe(true);
      expect(p.subQuestions.slice(6, 12).every((sq) => sq.options.length === 4)).toBe(true);
    });
  });

  it('validateToeicListeningRound の整合チェック（重複なし・根拠文がスクリプト内に一致・和訳数一致）に全回通る', () => {
    const issues = TOEIC_LISTENING_ROUNDS.flatMap((round, r) =>
      validateToeicListeningRound(round).map((m) => `第${r + 1}回: ${m}`),
    );
    expect(issues).toEqual([]);
  });

  it('全180問に 着眼点 h・ポイント r・TOEICでのコツ tip・和訳・理由 があり、Part 5〜7 と同じ全角62幅以内・禁止表現ゼロ', () => {
    const missing: string[] = [];
    const tooLong: string[] = [];
    const bannedHits: string[] = [];
    TOEIC_LISTENING_ROUNDS.forEach((round, r) => {
      round.p2.forEach((it, i) => {
        const id = `第${r + 1}回 Part2 問${i + 1}`;
        if (!it.h || !it.r || !it.tip || !it.why || !it.qtr || !it.ctr) missing.push(id);
        (['h', 'r', 'tip'] as const).forEach((k) => {
          if (textWidth(it[k]) > MAX_WIDTH) tooLong.push(`${id} ${k}: ${textWidth(it[k])}`);
        });
        [it.qtr, it.ctr, it.h, it.r, it.tip, it.why, it.w[0][2], it.w[1][2]].forEach((txt, ti) => {
          const m = txt.match(BANNED);
          if (m) bannedHits.push(`${id} [${ti}] (${m[0]}): ${txt}`);
        });
      });
      round.p3.turns.forEach((t, ti) => {
        const m = t.ja.match(BANNED);
        if (m) bannedHits.push(`第${r + 1}回 Part3 和訳${ti + 1} (${m[0]}): ${t.ja}`);
      });
      round.p4.tr.forEach((tr, ti) => {
        const m = tr.match(BANNED);
        if (m) bannedHits.push(`第${r + 1}回 Part4 和訳${ti + 1} (${m[0]}): ${tr}`);
      });
      [...round.p3.q, ...round.p4.q].forEach((q, qi) => {
        const id = `第${r + 1}回 問${7 + qi}`;
        if (!q.h || !q.r || !q.tip || !q.why || !q.qtr || !q.etr) missing.push(id);
        (['h', 'r', 'tip'] as const).forEach((k) => {
          if (textWidth(q[k]) > MAX_WIDTH) tooLong.push(`${id} ${k}: ${textWidth(q[k])}`);
        });
        [q.qtr, q.etr, q.h, q.r, q.tip, q.why, q.w[0][1], q.w[1][1], q.w[2][1]].forEach((txt, ti) => {
          const m = txt.match(BANNED);
          if (m) bannedHits.push(`${id} [${ti}] (${m[0]}): ${txt}`);
        });
      });
    });
    expect(missing).toEqual([]);
    expect(tooLong).toEqual([]);
    expect(bannedHits).toEqual([]);
  });

  it('全180問の手がかり（cues）が1件以上あり、英文と正解の理由（why）の双方に完全対応する', () => {
    const bad: string[] = [];
    TOEIC_LISTENING_ROUNDS.forEach((round, r) => {
      round.p2.forEach((it, i) => {
        const cues = it.cues || [];
        const resolved = resolveCues(it.q, it.why, cues);
        if (!cues.length || resolved.length !== cues.length) {
          bad.push(`第${r + 1}回 Part2 問${i + 1}: ${resolved.length}/${cues.length}`);
        }
      });
      [...round.p3.q, ...round.p4.q].forEach((q, qi) => {
        const cues = q.cues || [];
        const resolved = resolveCues(q.e, q.why, cues);
        if (!cues.length || resolved.length !== cues.length) {
          bad.push(`第${r + 1}回 問${7 + qi}: ${resolved.length}/${cues.length}`);
        }
      });
    });
    expect(bad).toEqual([]);
  });

  it('全15回で設問文・解説ノート（h/r/tip）の使い回しゼロ・米国式綴り・句読点スペース不備ゼロ', () => {
    const seenP2Q = new Set<string>();
    const seenH = new Set<string>();
    const seenR = new Set<string>();
    const seenTip = new Set<string>();
    const dups: string[] = [];
    const formatIssues: string[] = [];

    TOEIC_LISTENING_ROUNDS.forEach((round, r) => {
      const rn = r + 1;
      round.p2.forEach((it, i) => {
        const id = `R${rn}-P2-${i + 1}`;
        if (seenP2Q.has(it.q)) dups.push(`${id} q`);
        seenP2Q.add(it.q);
        if (seenH.has(it.h)) dups.push(`${id} h`);
        seenH.add(it.h);
        if (seenR.has(it.r)) dups.push(`${id} r`);
        seenR.add(it.r);
        if (seenTip.has(it.tip)) dups.push(`${id} tip`);
        seenTip.add(it.tip);
        [it.q, it.c, it.w[0][0], it.w[1][0]].forEach((en) => {
          if (SPACING.test(en)) formatIssues.push(`${id} spacing: ${en}`);
          if (UK_SPELLING.test(en)) formatIssues.push(`${id} UK: ${en}`);
        });
      });
      round.p3.turns.forEach((t, ti) => {
        if (SPACING.test(t.en)) formatIssues.push(`R${rn}-P3-T${ti + 1} spacing: ${t.en}`);
        if (UK_SPELLING.test(t.en)) formatIssues.push(`R${rn}-P3-T${ti + 1} UK: ${t.en}`);
      });
      round.p4.p.forEach((p, pi) => {
        if (SPACING.test(p)) formatIssues.push(`R${rn}-P4-P${pi + 1} spacing: ${p}`);
        if (UK_SPELLING.test(p)) formatIssues.push(`R${rn}-P4-P${pi + 1} UK: ${p}`);
      });
      [...round.p3.q, ...round.p4.q].forEach((q, qi) => {
        const id = `R${rn}-Q${7 + qi}`;
        if (seenH.has(q.h)) dups.push(`${id} h`);
        seenH.add(q.h);
        if (seenR.has(q.r)) dups.push(`${id} r`);
        seenR.add(q.r);
        if (seenTip.has(q.tip)) dups.push(`${id} tip`);
        seenTip.add(q.tip);
        [q.q, q.c, q.w[0][0], q.w[1][0], q.w[2][0], q.e].forEach((en) => {
          if (SPACING.test(en)) formatIssues.push(`${id} spacing: ${en}`);
          if (UK_SPELLING.test(en)) formatIssues.push(`${id} UK: ${en}`);
        });
      });
    });
    expect(dups).toEqual([]);
    expect(formatIssues).toEqual([]);
  });

  it('正解位置：Part 2 は (A)(B)(C) が各2回ずつで3連続なし、Part 3・4 は4択で偏りなし', () => {
    problems.forEach((p, r) => {
      const p2Pos = p2AnswerPositions(r + 1);
      expect(p.subQuestions.slice(0, 6).map((q) => q.correctAnswer)).toEqual(p2Pos.map((k) => TOEIC_P2_MARKS[k]));
      [0, 1, 2].forEach((m) => expect(p2Pos.filter((v) => v === m)).toHaveLength(2));
      const talkPos = talkAnswerPositions(r + 1);
      expect(p.subQuestions.slice(6, 12).map((q) => q.correctAnswer)).toEqual(talkPos.map((k) => TOEIC_MARKS[k]));
    });
  });

  it('ページ分割・解説引き当て・採点前マスクが正しく動く', () => {
    expect(isToeicListeningChapter('tpl_1')).toBe(true);
    expect(isToeicPageChapter('tpl_1')).toBe(true);
    expect(perPageOf('tpl_1')).toBe(3);
    expect(locateToeicListening('q_tpl_1_r01_1')).toEqual({ round: 1, index: 0, pageGroup: 0, kind: 'p2_a' });
    expect(locateToeicListening('q_tpl_1_r01_8')).toEqual({ round: 1, index: 7, pageGroup: 2, kind: 'p3' });
    expect(locateToeicListening('q_tpl_1_r15_12')).toEqual({ round: 15, index: 11, pageGroup: 3, kind: 'p4' });

    const subs = problems[0].subQuestions;
    const pages = splitToeicPages('tpl_1', subs);
    expect(pages.map((pg) => pg.length)).toEqual([3, 3, 3, 3]);

    // Part 2 は採点前は質問英文・選択肢英文を伏せ、採点後は出す
    expect(toeicListeningStem(subs[0], false)).toContain('音声を聞いて');
    expect(toeicListeningStem(subs[0], true)).toBe(TOEIC_LISTENING_ROUNDS[0].p2[0].q);
    expect(toeicListeningChoiceTexts(subs[0], false)).toEqual(['音声を聞いて選ぶ', '音声を聞いて選ぶ', '音声を聞いて選ぶ']);
    expect(toeicListeningChoiceTexts(subs[0], true)).toContain(TOEIC_LISTENING_ROUNDS[0].p2[0].c);

    // 音声バー情報と解説
    expect(toeicListeningPageAudioOf(pages[0])?.tracks).toHaveLength(3);
    expect(toeicListeningPageAudioOf(pages[2])?.tracks).toHaveLength(1);
    expect(toeicListeningPageAudioOf(pages[3])?.tracks).toHaveLength(1);

    problems.forEach((p) => {
      p.subQuestions.forEach((sq) => {
        const ex = toeicExplanationFor(sq);
        expect(ex, sq.id).not.toBeNull();
        expect(ex?.choices.find((c) => c.correct)?.mark).toBe(sq.correctAnswer);
      });
    });

    // 時間ガイド予算
    const budgets = buildToeicListeningPageBudgets(pages, 'standard', 540);
    expect(budgets).toHaveLength(4);
    expect(budgets[0].targetSec).toBe(105);
    expect(budgets[3].limitElapsedSec).toBe(540);

    // cues の検証用（resolveCues が例外を投げない）
    expect(Array.isArray(resolveCues('When does it start?', 'When ...', [{ p: 'When' }]))).toBe(true);
  });

  it('MP3 インデックス読み込みと URL 生成が正しく動く', async () => {
    __resetToeicListeningAudio();
    expect(toeicListeningAudioUrl('tpl_r01_p2_q1', 'v1')).toBe('/audio/toeic_listening/tpl_r01_p2_q1.mp3?v=v1');
    expect(toeicListeningAudioUrl('tpl_r15_p3')).toBe('/audio/toeic_listening/tpl_r15_p3.mp3');
    expect(toeicListeningAudioUrl('invalid_id')).toBeNull();

    await loadToeicListeningAudioIndex(async () => ({
      ok: true,
      json: async () => ({ rev: '20261112', ids: ['tpl_r01_p3'] }),
    }) as Response);
    expect(hasToeicListeningMp3('tpl_r01_p3')).toBe(true);
    expect(hasToeicListeningMp3('tpl_r01_p4')).toBe(false);
    __resetToeicListeningAudio();
  });
});
