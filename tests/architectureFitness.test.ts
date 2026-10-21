import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { stripComments } from './helpers/sourceScan';

/**
 * ===================================================================
 * アーキテクチャの退行を CI で止める見張り（Fitness Function・C-22）
 * ===================================================================
 *
 * 2026-10 の構造リファクタ（C-01〜C-21）で巨大ファイルを分け、ローカル保存の入口を1本にした。
 * 分けたものは、何もしないとまた太り、生の localStorage はまた混ざる。ここでそれを自動で止める。
 *
 *   ① 手書きの TS/TSX は 1,000 行以内（データ・自動生成ファイルは除く）
 *   ② 分けた元のファイルは、分ける前と同じ名前を公開し続ける（re-export の整合）
 *   ③ 生の localStorage.getItem / setItem / removeItem は、入口の2ファイル以外に書かない
 *
 * 既存の noExplicitAny / noSilentCatch / hookDepsReasons / moduleGraph と並ぶ、同じ種類の見張り。
 */
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(ts|tsx)$/.test(name) ? [p] : [];
  });
}
const rel = (p: string) => relative(ROOT, p).split('\\').join('/');
const sources = walk(SRC).map(rel);

// ============================================================
// ① 行数の上限
// ============================================================

const MAX_LINES = 1000;

/**
 * 行数の上限から外すもの（手書きのロジックではないもの）。
 *   ・*.generated.*                 … scripts/ が作るファイル（手で直さない）
 *   ・src/data/*Problems.ts / *Sets.ts … 問題文そのもの（データ。分けても読みやすくならない）
 * ロジックのファイルをここに足して逃がさないこと。
 */
const isDataOrGenerated = (p: string) =>
  /\.generated\./.test(p) || /^src\/data\/[^/]*(Problems|Sets)\.ts$/.test(p);

describe('① 手書きの TS/TSX は 1,000 行以内', () => {
  it('上限を超えるファイルが無い', () => {
    const over = sources
      .filter((p) => !isDataOrGenerated(p))
      .map((p) => ({ p, n: readFileSync(join(ROOT, p), 'utf8').split('\n').length }))
      .filter(({ n }) => n > MAX_LINES)
      .map(({ p, n }) => `${p}: ${n} 行`);
    expect(over).toEqual([]);
  });

  it('除外の決まりが、ロジックのファイルを巻き込んでいない', () => {
    // 除外されるのは generated と data の問題ファイルだけ（増えたら意図を確かめる）
    const excluded = sources.filter(isDataOrGenerated);
    expect(excluded.every((p) => p.includes('.generated.') || p.startsWith('src/data/'))).toBe(true);
  });
});

// ============================================================
// ② 分けた元のファイルの公開名（re-export の整合）
// ============================================================

/** ファイルが公開している名前（型も含む）を、構文だけで集める（実行しないので Firebase 等を読まない） */
function exportedNames(relPath: string): string[] {
  const file = join(ROOT, relPath);
  const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true,
    file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const names = new Set<string>();
  const has = (n: ts.Node, k: ts.SyntaxKind) => ts.canHaveModifiers(n) && (ts.getModifiers(n) ?? []).some((m) => m.kind === k);
  for (const st of sf.statements) {
    if (ts.isExportDeclaration(st)) {
      if (st.exportClause && ts.isNamedExports(st.exportClause)) st.exportClause.elements.forEach((e) => names.add(e.name.text));
      else names.add('*');
      continue;
    }
    if (ts.isExportAssignment(st)) { names.add('default'); continue; }
    if (!has(st, ts.SyntaxKind.ExportKeyword)) continue;
    if (has(st, ts.SyntaxKind.DefaultKeyword)) { names.add('default'); continue; }
    if (ts.isVariableStatement(st)) st.declarationList.declarations.forEach((d) => { if (ts.isIdentifier(d.name)) names.add(d.name.text); });
    else if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st) || ts.isInterfaceDeclaration(st)
      || ts.isTypeAliasDeclaration(st) || ts.isEnumDeclaration(st)) && st.name) names.add(st.name.text);
  }
  return [...names].sort();
}

/**
 * 分ける前（refactor/audit-v4 の Phase0 時点）に公開していた名前。
 * ここにある名前は、分けた先から再エクスポートしてでも、元のファイルから import できなければならない。
 * （名前を本当に消すときは、使っている所を直したうえでここも直す＝意図した変更だと分かるようにする）
 */
const PUBLIC_API_BEFORE_SPLIT: Record<string, string[]> = {
  'src/App.tsx': ['AppMode', 'AppState', 'default', 'isAppMode', 'isAppState'],
  'src/utils/explanationFormat.ts': ['ANS', 'ANS_STYLE', 'BOX', 'BodySegments', 'ConversionHop', 'DETAIL_TITLE', 'ENHANCED_MARK', 'EnhancedSlices', 'FlowchartStepLike', 'GROUP_MARK', 'KEY', 'KEY_STYLE', 'LABEL', 'QuestionGroupParts', 'SQ_BODY_MARK', 'SQ_MARK', 'SQ_SHARED_MARK', 'STEPS_TITLE', 'SubQuestionSlices', 'ThinkingStep', 'TrendInsight', 'UNIT_KATA_TITLE', 'UnitConversionWalk', 'UnitTeaching', 'buildAnswerBlock', 'buildFlowchartSteps', 'buildQuestionGroupParts', 'buildStepsBlock', 'buildSupplement', 'buildTrendBox', 'buildUnitConversionBlock', 'circledNumber', 'dedupeAgainstSteps', 'enhanceExplanation', 'extractFlowchartSteps', 'isEnhanced', 'isStructuredExplanation', 'normalizeLegacyBody', 'qualifyStepReferences', 'questionGroupKey', 'sliceEnhancedByQuestion', 'sliceEnhancedBySubQuestion', 'splitBodyByQuestionGroups', 'splitBodyBySubQuestions', 'subMarkerCandidates'],
  'src/utils/mathTypeset.ts': ['KATEX_WRAPPER_CLASS', 'MathRegion', 'TypesetOptions', 'TypesetPiece', 'hasExplicitMath', 'mayContainMath', 'renderLatex', 'scanChemRegions', 'scanMathRegions', 'splitMathPieces', 'toChemLatex', 'toLatex', 'typesetHtmlMath', 'typesetMath'],
  'src/utils/questionDisplay.ts': ['CIRCLED', 'InlineQuestionRow', 'InlineQuestionRows', 'SplitLabel', 'answerCardMarker', 'buildSubQuestionList', 'cleanQuestionText', 'extractInlineQuestionRows', 'extractListeningQuestionRows', 'extractSubQuestionSentences', 'findSubQuestionSentence', 'isSubQuestionListRedundant', 'joinMarker', 'optionCircledMark', 'resolveAnswerMarkers', 'splitQuestionLabel'],
  'src/utils/answerEquivalence.ts': ['compactSequence', 'expandAnswerVariants', 'isEquivalentAnswer', 'isNumericallyEqual', 'isSynonym', 'looksLikeSequence', 'normalizeForCompare', 'normalizeNotation', 'parseNumericAnswer'],
  'src/utils/feedback.ts': ['DEFAULT_FEEDBACK_WEBHOOK_URL', 'FEEDBACK_CATEGORY_LABELS', 'FEEDBACK_COLLECTION', 'FEEDBACK_EMAIL', 'FEEDBACK_MESSAGE_MAX', 'FEEDBACK_QUEUE_KEY', 'FEEDBACK_QUEUE_LIMIT', 'FEEDBACK_SCREEN_LABELS', 'FEEDBACK_WEBHOOK_OVERRIDE_KEY', 'FeedbackCategory', 'FeedbackInput', 'FeedbackPayload', 'FeedbackResult', 'FeedbackScreen', 'FeedbackSink', 'FeedbackValidation', 'QueuedFeedback', 'SinkDiagnosis', 'buildFeedbackMailto', 'buildFeedbackPayload', 'describeFeedbackSinks', 'diagnoseFeedbackRoutes', 'enqueueFeedback', 'flushFeedbackQueue', 'getFeedbackEmail', 'getFeedbackWebhookUrl', 'isAllowedFeedbackWebhookUrl', 'pendingFeedbackCount', 'readFeedbackQueue', 'setFeedbackWebhookUrl', 'submitFeedback', 'takeFeedbackSlot', 'validateFeedback'],
  'src/utils/classroom.ts': ['CLASSROOMS_COLLECTION', 'CLASS_CODES_COLLECTION', 'CLASS_MEMBERS_COLLECTION', 'JoinResult', 'KANTEN_MASTERED_BOX', 'MembershipDetail', 'STUDY_ACCESS_COLLECTION', 'StudentRawProgress', 'clearSchoolBrandFor', 'createClassroom', 'fetchClassMembers', 'fetchClassRawProgress', 'fetchClassSummaries', 'fetchMyClassrooms', 'fetchMyMembershipDetails', 'fetchMyMemberships', 'isValidJoinCode', 'joinClassroomByCode', 'leaveClassroom', 'loadSchoolBrand', 'memberDocId', 'resolveRosterName', 'saveSchoolBrand', 'setJoinOpen', 'setRosterName', 'studyAccessDocId', 'validateJoinCodeInput'],
  'src/battle/core/battleCore.ts': ['BATTLE_REVEAL_HOLD_MS', 'BATTLE_TIME_SCALE', 'BATTLE_TIME_SCALED_MAX', 'FORFEIT_RATING_RATIO', 'FORFEIT_STREAK', 'NATIONAL_AUTO_START_FALLBACK_MS', 'NO_ANSWER', 'QuestionOrderMix', 'RATING_FLOOR', 'RATING_INITIAL', 'RATING_K', 'SPEED_GRANULARITY_MS', 'STREAK_CAP', 'STREAK_THRESHOLD', 'answeredAtMillis', 'buildQuestionOrder', 'createRandom', 'hasLeft', 'hashString', 'isBattleAnswerCorrect', 'judgeBattle', 'nationalAutoStartDelayMs', 'nextRating', 'pickRandom', 'resolveTimeLimit', 'scoreBattlePlayer', 'scoreBattleQuestion', 'trailingNoAnswerCount'],
  'src/battle/hooks/useBattleRoom.ts': ['BattleRoomActions', 'BattleRoomState', 'useBattleRoom'],
  'src/battle/ui/GrowthParts.tsx': ['BadgeChip', 'GrowthAvatar', 'LevelBar', 'MissionRow', 'NextBadgeHint', 'NextGoals', 'StatCard', 'TitleChip', 'flyCoins'],
  'src/components/ExplanationBody.tsx': ['ExplanationBody', 'ExplanationBodyProps', 'ExplanationTone', 'parseExplanationBlocks'],
  'src/utils/studySummary.ts': ['CHAPTER_CSV_HEADERS', 'ChapterDefinition', 'ChapterProgressRow', 'EngagementInput', 'EngagementScore', 'ReviewDiscipline', 'STUDENT_CSV_HEADERS', 'StudentSummary', 'StudyBaseMetrics', 'buildChapterProgressRows', 'buildCsvText', 'buildStudentCsv', 'buildStudentSummary', 'buildStudyBaseMetrics', 'calcEngagementScore', 'collectStudyDays', 'countActiveDaysWithin', 'escapeCsvCell', 'startOfDay', 'summarizeReviewDiscipline', 'toDateKey'],
  'src/components/ListeningAudioPlayer.tsx': ['ListeningAudioPlayer', 'ListeningAudioPlayerProps', 'ListeningEvidenceScript'],
  'src/components/Explanation.tsx': ['Explanation', 'ReviewNav'],
};

describe('② 分けた元のファイルは、分ける前と同じ名前を公開している', () => {
  for (const [file, before] of Object.entries(PUBLIC_API_BEFORE_SPLIT)) {
    it(file, () => {
      const now = new Set(exportedNames(file));
      expect(before.filter((name) => !now.has(name))).toEqual([]);
    });
  }

  it('再エクスポート先のファイルが実在し、その名前を本当に公開している', () => {
    const broken: string[] = [];
    for (const file of Object.keys(PUBLIC_API_BEFORE_SPLIT)) {
      const abs = join(ROOT, file);
      const sf = ts.createSourceFile(abs, readFileSync(abs, 'utf8'), ts.ScriptTarget.Latest, true,
        abs.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      for (const st of sf.statements) {
        if (!ts.isExportDeclaration(st) || !st.moduleSpecifier || !ts.isStringLiteral(st.moduleSpecifier)) continue;
        const spec = st.moduleSpecifier.text;
        if (!spec.startsWith('.')) continue;
        const base = join(abs, '..', spec);
        const target = ['.ts', '.tsx', '/index.ts', '/index.tsx'].map((ext) => base + ext).find((p) => {
          try { return statSync(p).isFile(); } catch { return false; } // 無いパスは次の候補へ
        });
        if (!target) { broken.push(`${file} → ${spec}（ファイルが無い）`); continue; }
        const provided = new Set(exportedNames(rel(target)));
        if (st.exportClause && ts.isNamedExports(st.exportClause)) {
          for (const e of st.exportClause.elements) {
            const name = (e.propertyName ?? e.name).text;
            if (!provided.has(name) && !provided.has('*')) broken.push(`${file} → ${spec} の ${name}`);
          }
        }
      }
    }
    expect(broken).toEqual([]);
  });
});

// ============================================================
// ③ 生の localStorage を書かない
// ============================================================

/**
 * localStorage に触ってよい入口（C-17）。
 *   ・safeLocalStorage.ts … 読み出し・削除・例外を投げる書き込み（setItemOrThrow）
 *   ・storageGuard.ts     … 容量オーバー対策と、投げない書き込み（safeSetItem）
 */
const STORAGE_GATEWAYS = new Set(['src/utils/safeLocalStorage.ts', 'src/utils/storageGuard.ts']);

/**
 * 「グローバルの localStorage」を直接呼んでいる所を探す。
 * safeLocalStorage() が返した Storage を同じ名前の変数で受けている所（useElimination.ts）は
 * 生の呼び出しではないので、同じ関数の中に `const localStorage = safeLocalStorage()` があれば数えない。
 */
function rawLocalStorageCalls(): string[] {
  const hits: string[] = [];
  for (const p of sources) {
    if (STORAGE_GATEWAYS.has(p) || /\.generated\./.test(p)) continue;
    const code = stripComments(readFileSync(join(ROOT, p), 'utf8'));
    const shadowed = /const localStorage = safeLocalStorage\(\)/.test(code);
    code.split('\n').forEach((line, i) => {
      // window.localStorage / globalThis.localStorage / (globalThis as …).localStorage も「生」に数える
      const viaGlobal = /\b(window|globalThis|self)\s*\)?\s*(as\s+[^)]*\))?\s*\??\.\s*localStorage\b/.test(line)
        || /\)\s*\??\.localStorage\b/.test(line);
      const bare = /(?<![\w.])localStorage\.(getItem|setItem|removeItem)\(/.test(line);
      if (!viaGlobal && !bare) return;
      if (bare && !viaGlobal && shadowed) return;
      hits.push(`${p}:${i + 1}  ${line.trim().slice(0, 100)}`);
    });
  }
  return hits;
}

describe('③ 生の localStorage 呼び出しが無い（safeLocalStorage / storageGuard を通す）', () => {
  it('入口の2ファイル以外に localStorage.getItem / setItem / removeItem が無い', () => {
    expect(rawLocalStorageCalls()).toEqual([]);
  });

  it('固定名のキーは STORAGE_KEYS から引く（screenshot_mode / no_ads を直書きしない）', () => {
    const offenders = sources
      .filter((p) => p !== 'src/utils/storageKeysCatalog.ts' && !/\.generated\./.test(p))
      .filter((p) => /getItem\(\s*'(screenshot_mode|no_ads|savedAppState|savedAppMode|savedQuizRange)'/
        .test(stripComments(readFileSync(join(ROOT, p), 'utf8'))));
    expect(offenders).toEqual([]);
  });
});
