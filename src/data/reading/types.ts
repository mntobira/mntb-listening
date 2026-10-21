/**
 * 英文解釈（段落ごとに読む・内容一致の4択）2026-10-21 改訂
 *
 * ■ 形（スマホで「スクロールせずに」読めるように、段落ごとにページを分ける）
 *   文章 = 段落 3〜4 個（1段落 ≦ 90語：スマホ1画面に収まる量）
 *   設問 = 段落ごとに1問（para = その段落の番号 1〜）＋ 文章全体の問い（para = 0：主旨など）
 *   出題は ［第1段落を読む］→［問1］→［第2段落を読む］→［問2］… →［全体の問い］
 *
 * ■ 英文の質（大学入試で通用する読解力・表現力のために）
 *   - 入試頻出の構文（not A but B／強調構文／倒置／分詞構文／譲歩／無生物主語／同格の that など）を
 *     段落の中に自然に入れる。設問の point にその構文の読み方を短く書く
 *   - phrases（重要表現）は本文にそのまま出てくる語句だけを載せる（テストで確かめる）
 *   - 本文はオリジナル。実在の入試問題・市販教材の文章は使わない
 *
 * ■ 設問の決まり（tests/reading.test.ts で全問を確かめる）
 *   - 選択肢は4つ。正解は書くときは先頭。出題のときに設問IDから決まる順でならべ替える
 *   - evidence（根拠）は該当段落の文字どおりの一節。evidenceJa はその和訳（英文解釈の練習になる）
 *   - type（出題形式）から「どの大学でよく出る形式か」を解説に出す（index.ts の TYPE_INFO）
 */
export type ReadingLevel = 1 | 2 | 3 | 4 | 5;

/** 出題形式 */
export type QType = 'detail' | 'reason' | 'not' | 'vocab' | 'inference' | 'main' | 'paraphrase';

export interface ReadingQuestion {
  id: string;
  /** どの段落の問いか（1〜）。0 は文章全体（主旨・要旨） */
  para: number;
  type: QType;
  /** 問い（Lv1〜3 は日本語、Lv4・5 は英語） */
  prompt: string;
  /** [正解, 誤り, 誤り, 誤り] の順で書く（出題時にならべ替える） */
  options: readonly [string, string, string, string];
  /** なぜそれが正解か（日本語・短く） */
  explanation: string;
  /** 根拠になる本文の一節（段落の文字どおり） */
  evidence: string;
  /** 根拠の和訳 */
  evidenceJa: string;
  /** 構文・読み方のポイント（任意・短く） */
  point?: string;
}

export interface ReadingPassage {
  id: string;
  level: ReadingLevel;
  /** 英語のタイトル */
  title: string;
  /** 話題（日本語） */
  topic: string;
  paragraphs: readonly string[];
  /** 本文（段落を空行でつないだもの） */
  text: string;
  /** 重要表現 [英語, 意味] */
  phrases: readonly (readonly [string, string])[];
  questions: readonly ReadingQuestion[];
}

export function q(
  id: string, para: number, type: QType, prompt: string, options: readonly [string, string, string, string],
  explanation: string, evidence: string, evidenceJa: string, point?: string,
): ReadingQuestion {
  return point ? { id, para, type, prompt, options, explanation, evidence, evidenceJa, point } : { id, para, type, prompt, options, explanation, evidence, evidenceJa };
}

export function p(
  id: string, level: ReadingLevel, title: string, topic: string, paragraphs: readonly string[],
  phrases: readonly (readonly [string, string])[], questions: readonly ReadingQuestion[],
): ReadingPassage {
  const paras = paragraphs.map(s => s.trim().replace(/\s+/g, ' '));
  return { id, level, title, topic, paragraphs: paras, text: paras.join('\n\n'), phrases, questions };
}
