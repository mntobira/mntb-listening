import type { BattleRule, BattleQuestion } from './types';
/** Only newly created rooms opt in. Old rooms retain their snapshotted scoring. */
export function arenaRule(rule: BattleRule): BattleRule {
  const listening = rule.subject === 'english_listening';
  return { ...rule, scoringVersion: 2, pointsCorrect: 60,
    pointsSpeedMax: listening ? 20 : 240, pointsStreak: 5,
    // Longest shipped recording is 42.27s. New rooms allow listening + answer time;
    // existing rooms continue to use their saved rule and deadline.
    ...(listening ? { timeLimitOverride: 55,
      note: '音源は自動再生。鳴らない場合は再生ボタンを押してください。再生中も制限時間は進みます。' } : {}),
  };
}
/** Bounded smooth curve: quick correct answers matter, late answers keep base points. */
export function speedCurve(remainingRatio: number) {
  const r = Math.min(1, Math.max(0, remainingRatio));
  return 0.7 * r * r + 0.3 * r * r * r;
}
export function nationalRoomMatches(room: { mode?: unknown; subject?: unknown; joinCode?: unknown; status?: unknown; players?: unknown; profiles?: Record<string, { matchSessionId?: unknown } | undefined> }, uid: string, subject: string, session: string) {
  return !!session && room.mode === 'random' && room.subject === subject && room.joinCode === ''
    && (room.status === 'waiting' || room.status === 'playing') && Array.isArray(room.players)
    && room.players.length === 2 && new Set(room.players).size === 2 && room.players.includes(uid)
    && room.profiles?.[uid]?.matchSessionId === session;
}

/** Number only for a uniquely identifiable submitted choice; never invent draft input. */
export function answerNumber(question: BattleQuestion, text?: string) {
  if (!text || question.format === "kana" || question.format === "panel") return "";
  const index = question.options.indexOf(text);
  return index < 0 || question.options.lastIndexOf(text) !== index ? "" : `【${index + 1}】`;
}
