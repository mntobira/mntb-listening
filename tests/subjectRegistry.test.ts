/**
 * 教科の登録簿（src/data/subjects.ts）が「唯一の出どころ」になっていることを固定する。
 * 教科を1つ足したときに、どこか1か所だけ足し忘れて一部の画面にだけ出ない、を防ぐ。
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SUBJECT_REGISTRY, SUBJECT_IDS, DEFAULT_SUBJECT, isSubjectKey, subjectOfChapterId } from '../src/data/subjects';
import { SUBJECTS, getChaptersOfSubject } from '../src/data/allChapters';
import { SUBJECT_INDEX, SUBJECT_STATS } from '../src/data/chapterIndex.generated';
import { isSubjectEnabled } from '../src/config/features';
import { SUBJECT_LABELS, labelOfSubject } from '../src/data/subjectLabels';
import { subjectTheme } from '../src/data/subjectTheme';
import { REVIEW_SUBJECT_LABELS, reviewSubjectStyle } from '../src/utils/reviewSubject';
import { validateClassroomInput } from '../src/utils/classroomCore';
import { studyEntry } from '../src/utils/studyNavigation';

describe('教科の登録簿', () => {
  it('教科データ・索引・統計が登録簿と同じ顔ぶれ・同じ順で揃っている', () => {
    expect(SUBJECTS.map((s) => s.id)).toEqual(SUBJECT_IDS);
    expect(SUBJECT_INDEX.map((s) => s.id)).toEqual(SUBJECT_IDS);
    expect(Object.keys(SUBJECT_STATS)).toEqual(SUBJECT_IDS);
    expect(DEFAULT_SUBJECT).toBe(SUBJECT_IDS[0]);
  });

  it('ID は重複せず、各教科の全章IDがその教科の形にだけ当てはまる', () => {
    expect(new Set(SUBJECT_IDS).size).toBe(SUBJECT_IDS.length);
    for (const subject of SUBJECT_REGISTRY) {
      const chapters = getChaptersOfSubject(subject.id);
      expect(chapters.length, subject.id).toBeGreaterThan(0);
      for (const chapter of chapters) {
        const matched = SUBJECT_REGISTRY.filter((s) => s.chapterIdPattern.test(chapter.id)).map((s) => s.id);
        expect(matched, chapter.id).toEqual([subject.id]);
        expect(subjectOfChapterId(chapter.id)).toBe(subject.id);
      }
    }
  });

  it('名前・配色・復習タブ・公開状態・入口・クラス作成がすべて登録簿から引ける', () => {
    for (const subject of SUBJECT_REGISTRY) {
      expect(SUBJECT_LABELS[subject.id]).toBe(subject.label);
      expect(labelOfSubject(subject.id)).toBe(subject.label);
      expect(subjectTheme(subject.id)).toEqual(subject.theme);
      expect(REVIEW_SUBJECT_LABELS[subject.id]).toBe(subject.label);
      expect(reviewSubjectStyle(subject.id)).toEqual(subject.reviewStyle);
      expect(isSubjectEnabled(subject.id)).toBe(subject.enabled);
      expect(studyEntry(subject.id)).toBe(subject.entry);
      expect(validateClassroomInput({ schoolName: 'a', className: 'b', subject: subject.id }).ok).toBe(true);
    }
  });

  it('登録簿に無い教科（旧版の化学・数学など）は、隠す・その他扱い・既定に倒す', () => {
    for (const old of ['chemistry_basic', 'chemistry', 'math', 'biology_basic', 'geography', 'rika']) {
      expect(isSubjectKey(old)).toBe(false);
      expect(isSubjectEnabled(old)).toBe(false);
      expect(validateClassroomInput({ schoolName: 'a', className: 'b', subject: old as never }).ok).toBe(false);
    }
    expect(subjectOfChapterId('c1_1')).toBeNull();
    expect(labelOfSubject('unknown')).toBe(SUBJECT_LABELS[DEFAULT_SUBJECT]);
  });

  it('src の中に、教科IDを並べた手書きの一覧が残っていない（登録簿を通す）', () => {
    const files: string[] = [];
    (function walk(dir: string) {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(f) && !/\.generated\.ts$/.test(f)) files.push(p);
      }
    })('src');
    const offenders = files.filter((f) => !f.endsWith('src/data/subjects.ts')).filter((f) => {
      const src = readFileSync(f, 'utf8');
      // 'english_listening', 'english_grammar' の2つが同じ配列リテラルに並んでいたら手書きの一覧
      return /\[\s*['"]english_listening['"]\s*,\s*['"]english_grammar['"]\s*\]/.test(src);
    });
    expect(offenders).toEqual([]);
  });
});
