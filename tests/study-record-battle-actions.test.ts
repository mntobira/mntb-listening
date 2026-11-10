import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const record = readFileSync('src/components/StudyRecord.tsx', 'utf8');
const actions = readFileSync('src/components/StudyRecordBattleActions.tsx', 'utf8');

describe('対戦の解いた問題からの復習・解き直し', () => {
  it('解いた問題の各対戦小問に問題表示と復習登録を出す', () => {
    expect(record).toContain('entry.kind === \'battle\' && <StudyRecordBattleActions');
    expect(actions).toContain('問題を見る');
    expect(actions).toContain('復習ノートに追加');
    expect(actions).toContain('captureWrongAnswers(uid, [input])');
  });

  it('対戦小問から全問の解き直しと誤答だけの解き直しへ進める', () => {
    expect(actions).toContain('onRetry({');
    expect(actions).toContain('wrongOnly,');
    expect(actions).toContain('subQuestionIds: wrongOnly ? [result.question.subQuestionId] : []');
    expect(actions).toContain('解きなおす');
    expect(actions).toContain('まちがえた問題だけ解く');
    expect(actions).toContain('disabled={!isWrong || retryLoading || loading !== null}');
  });

  it('対戦記録本文が空のときも対戦プールと教材データから本文を補う', () => {
    expect(actions).toContain("await import('../battle/data/battlePool')");
    expect(actions).toContain("await import('../data/allChapters')");
    expect(actions).toContain('prompt = [problem?.text, sub?.label, ...(sub?.options ?? [])]');
  });
});
