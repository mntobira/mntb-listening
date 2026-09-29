/**
 * ===================================================================
 * 英語リスニング（共通テスト）単元データの構造テスト
 * ===================================================================
 * ご要望：
 *   第1問 A,B / 第2問 / 第3問 / 第4問 A,B / 第5問 / 第6問 A,B
 *   の順で「まずは単元を追加する」。デザインは他科目と変えない。
 *
 * 「デザインを変えない」＝ 既存の単元選択画面（ChapterSelection）を
 * そのまま流用できることなので、
 *   ① 化学基礎／化学とまったく同じ parts→chapters の形をしていること
 *   ② 単元IDが既存2科目と衝突しないこと（進捗・ランキングは単元IDで管理）
 * を機械的に守れるようテストで固定する。
 */
import { describe, it, expect } from 'vitest';
import {
  englishListeningData,
  LISTENING_SECTIONS,
  getListeningPart,
  getListeningChapters,
  getAllListeningChapters,
  getListeningStats,
} from '../src/data/englishListeningData';
import { chemistryData } from '../src/data/chemistryData';
import { getAllAdvancedChapters } from '../src/data/chemistryAdvancedData';

describe('英語リスニングの単元構成', () => {
  it('ご要望どおりの並び（第1問A/B → 第2問 → 第3問 → 第4問A/B → 第5問 → 第6問A/B）', () => {
    expect(getAllListeningChapters().map((c) => c.abstractTitle)).toEqual([
      '第1問 A',
      '第1問 B',
      '第2問',
      '第3問',
      '第4問 A',
      '第4問 B',
      '第5問',
      '第6問 A',
      '第6問 B',
    ]);
  });

  it('タブ見出し（realTitle）は A・B ごとに独立した9つになる', () => {
    // ご要望：「第1問A、第1問B というように A、B での区別も分けれるようにして」
    // A と B は設問形式（英文を選ぶ／絵を選ぶ）が違う別の練習なので、
    // 同じ「第1問」タブに同居させない。
    const realTitles = [...new Set(getAllListeningChapters().map((c) => c.realTitle))];
    expect(realTitles).toEqual([
      '第1問 A',
      '第1問 B',
      '第2問',
      '第3問',
      '第4問 A',
      '第4問 B',
      '第5問',
      '第6問 A',
      '第6問 B',
    ]);
  });

  it('タブ見出しと単元名（abstractTitle）は同じ文字列（呼び名を2つ作らない）', () => {
    for (const c of getAllListeningChapters()) {
      expect(c.realTitle).toBe(c.abstractTitle);
    }
  });

  it('配点集計用の大問キー（questionGroup）は第1問〜第6問の6つ', () => {
    const groups = [...new Set(getAllListeningChapters().map((c) => c.questionGroup))];
    expect(groups).toEqual(['第1問', '第2問', '第3問', '第4問', '第5問', '第6問']);
  });

  it('前半（2回読み）／後半（1回読み）の2区分に分かれている', () => {
    expect(englishListeningData.parts.map((p) => p.section)).toEqual([
      'first_half',
      'second_half',
    ]);
    expect(LISTENING_SECTIONS.map((s) => s.id)).toEqual(['first_half', 'second_half']);
    // 第1問・第2問だけが2回読み、第3問以降は1回読み
    for (const c of getListeningChapters('first_half')) expect(c.readCount).toBe(2);
    for (const c of getListeningChapters('second_half')) expect(c.readCount).toBe(1);
  });
});

describe('他科目と同じ形（画面を流用するための約束）', () => {
  it('章は abstractTitle / realTitle / topics / practiceProblems / miniTest を持つ', () => {
    for (const chapter of getAllListeningChapters()) {
      expect(typeof chapter.id).toBe('string');
      expect(chapter.abstractTitle.length).toBeGreaterThan(0);
      expect(chapter.realTitle.length).toBeGreaterThan(0);
      expect(chapter.questionGroup.length).toBeGreaterThan(0);
      expect(Array.isArray(chapter.topics)).toBe(true);
      expect(chapter.topics.length).toBeGreaterThan(0);
      expect(Array.isArray(chapter.practiceProblems)).toBe(true);
      expect(Array.isArray(chapter.miniTest)).toBe(true);
    }
  });

  it('単元ID に重複がなく、化学基礎・化学の単元ID とも衝突しない', () => {
    const ids = getAllListeningChapters().map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);

    const chemIds = new Set<string>([
      ...chemistryData.parts.flatMap((p: any) => p.chapters.map((c: any) => c.id)),
      ...getAllAdvancedChapters().map((c) => c.id),
    ]);
    for (const id of ids) {
      expect(chemIds.has(id)).toBe(false);
      // 接頭辞 el… で識別できる
      expect(id.startsWith('el')).toBe(true);
    }
  });

  it('全9単元に問題が収録されている', () => {
    expect(getListeningStats().questions).toBeGreaterThan(0);
    for (const chapter of getAllListeningChapters()) {
      expect(chapter.practiceProblems.length, chapter.id).toBeGreaterThan(0);
    }

    // 収録数の内訳（取り込み漏れ・二重登録の検知用）
    const byId = new Map(getAllListeningChapters().map((c) => [c.id, c]));
    expect(byId.get('el1_A')!.practiceProblems.length).toBe(14); // 第1回＋13セット
    expect(byId.get('el1_B')!.practiceProblems.length).toBe(15); // 15セット
    // 第2問は配布PDF全16セットのうち、実物イラストが使える6セットだけを先行公開。
    // （残りはイラストを用意でき次第あとから追加する。数は増える前提なので下限で見る）
    expect(byId.get('el2')!.practiceProblems.length).toBeGreaterThanOrEqual(6);
    expect(byId.get('el2')!.practiceProblems.length).toBeLessThanOrEqual(16);
    expect(byId.get('el3')!.practiceProblems.length).toBe(15); // 15セット（各6問）
  });
});

describe('集計ヘルパー', () => {
  it('getListeningStats は大問数・単元数・配点・マーク数を返す', () => {
    const stats = getListeningStats();
    // タブは9つに分かれても、共通テストの大問はあくまで6つ。
    // （配点は questionGroup で数えるので A/B 分割の影響を受けない）
    expect(stats.sections).toBe(6);
    expect(stats.units).toBe(9);
    // 配点は大問単位で公表されるため、A/B を二重に足さず合計100点になる
    expect(stats.points).toBe(100);
    expect(stats.marks).toBe(37);
  });

  it('getListeningPart は未知の区分に対して null を返す', () => {
    expect(getListeningPart('first_half')).not.toBeNull();
    expect(getListeningPart('unknown' as any)).toBeNull();
    expect(getListeningChapters('unknown' as any)).toEqual([]);
  });
});


describe('提供MP3全206本の対応・整合性', () => {
  it('原稿、ID、ファイル、チェックサム、再生回数を全件照合する', async () => {
    const { readFileSync } = await import('node:fs');
    const { createHash } = await import('node:crypto');
    const manifest = JSON.parse(readFileSync('scripts/data/listening_premium_manifest.json', 'utf8'));
    const targets = getAllListeningChapters().filter(c => ['el1_A', 'el1_B', 'el3'].includes(c.id));
    const tracks = targets.flatMap(c => c.practiceProblems.flatMap((p: any) =>
      p.audioTracks.map((track: any) => ({ ...track, readCount: p.readCount }))));
    expect(tracks).toHaveLength(206);
    expect(manifest).toHaveLength(206);
    expect(new Set(tracks.map(t => t.audioUrl)).size).toBe(206);
    for (const reference of manifest) {
      const matches = tracks.filter(t => t.subId === reference.subId);
      expect(matches, reference.subId).toHaveLength(1);
      const track = matches[0];
      expect(track.audioUrl, reference.subId).toBe(reference.audioUrl);
      expect(track.script, reference.subId).toBe(reference.script);
      expect(track.readCount).toBe(reference.app_read_count);
      expect(reference.repetitions_in_file).toBe(1);
      const bytes = readFileSync(`public${track.audioUrl}`);
      expect(createHash('sha256').update(bytes).digest('hex'), reference.subId).toBe(reference.sha256);
    }
  });
});
