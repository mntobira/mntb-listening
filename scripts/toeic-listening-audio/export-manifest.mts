/**
 * TOEIC リスニング 全15回（120トラック・180問）の ElevenLabs 用データを JSON に書き出す。
 * 出力先: docs/elevenlabs_toeic_listening/manifest.json と scripts/ テキスト
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildP2ElevenLabsLines,
  p2AnswerPositions,
  placeP2Choices,
  TOEIC_P2_MARKS,
  toeicListeningTrackId,
} from '../../src/data/toeic/toeicListeningKit';
import { TOEIC_LISTENING_ROUNDS } from '../../src/data/toeic/toeicListeningRounds';

const OUT_DIR = join(process.cwd(), 'docs/elevenlabs_toeic_listening');
const TXT_DIR = join(OUT_DIR, 'txt');
mkdirSync(TXT_DIR, { recursive: true });

export interface ExportedTrack {
  round: number;
  part: 'Part 2' | 'Part 3' | 'Part 4';
  trackId: string;
  fileName: string;
  titleJa: string;
  voiceGuide: string;
  mode: 'tts' | 'dialogue';
  lines: string[];
  dialogueTurns?: { speaker: 'W' | 'M'; text: string }[];
  referenceJa: string[];
}

const tracks: ExportedTrack[] = [];

TOEIC_LISTENING_ROUNDS.forEach((roundData, rIdx) => {
  const round = rIdx + 1;

  // Part 2: 問1〜問6
  roundData.p2.forEach((item, qIdx) => {
    const trackId = toeicListeningTrackId(round, 'p2', qIdx);
    const pos = p2AnswerPositions(round)[qIdx] ?? 0;
    const placed = placeP2Choices(item, pos);
    const lines = buildP2ElevenLabsLines(round, qIdx, item);
    const answerer = item.sp === 'W' ? '男性 (M)' : '女性 (W)';
    const asker = item.sp === 'W' ? '女性 (W)' : '男性 (M)';
    tracks.push({
      round,
      part: 'Part 2',
      trackId,
      fileName: `${trackId}.mp3`,
      titleJa: `第${round}回 問${qIdx + 1}（${item.t}）`,
      voiceGuide: `質問:${item.sp} / 応答:${item.sp === 'W' ? 'M' : 'W'}（1声TTS通し読み可）`,
      mode: 'tts',
      lines,
      dialogueTurns: [
        { speaker: item.sp, text: `Number ${qIdx + 1}. ${item.q}` },
        { speaker: item.sp === 'W' ? 'M' : 'W', text: `A. ${placed.texts[0]} <break time="0.8s" /> B. ${placed.texts[1]} <break time="0.8s" /> C. ${placed.texts[2]}` },
      ],
      referenceJa: [
        `質問：${item.qtr}`,
        ...placed.translations.map((tr, i) => `${TOEIC_P2_MARKS[i]} ${tr}${i === pos ? ' ★正解' : ''}`),
      ],
    });
  });

  // Part 3: 問7〜問9（2人の対話）
  {
    const trackId = toeicListeningTrackId(round, 'p3');
    const p3 = roundData.p3;
    const wLines: string[] = [];
    const mLines: string[] = [];
    const studioLines: string[] = [];
    p3.turns.forEach((t, idx) => {
      studioLines.push(`[${t.sp === 'W' ? 'Woman' : 'Man'}] ${t.en}`);
      if (idx < p3.turns.length - 1) studioLines.push('<break time="0.6s" />');
      if (t.sp === 'W') wLines.push(t.en);
      else mLines.push(t.en);
    });
    tracks.push({
      round,
      part: 'Part 3',
      trackId,
      fileName: `${trackId}.mp3`,
      titleJa: `第${round}回 問7〜9（${p3.situation}）`,
      voiceGuide: `W・M 掛け合い（Studioで2声割当）`,
      mode: 'dialogue',
      lines: studioLines,
      dialogueTurns: p3.turns.map((t) => ({ speaker: t.sp, text: t.en })),
      referenceJa: p3.turns.map((t) => `${t.sp}: ${t.ja}`),
    });
    void wLines;
    void mLines;
  }

  // Part 4: 問10〜問12（1人の説明文）
  {
    const trackId = toeicListeningTrackId(round, 'p4');
    const p4 = roundData.p4;
    const lines: string[] = [];
    p4.p.forEach((para, idx) => {
      lines.push(para);
      if (idx < p4.p.length - 1) lines.push('<break time="0.8s" />');
    });
    tracks.push({
      round,
      part: 'Part 4',
      trackId,
      fileName: `${trackId}.mp3`,
      titleJa: `第${round}回 問10〜12（${p4.genre}）`,
      voiceGuide: `話者:${p4.sp === 'W' ? '女性(W)' : '男性(M)'}（1声TTS）`,
      mode: 'tts',
      lines,
      referenceJa: [...p4.tr],
    });
  }
});

// 1回ごとのまとめ一括テキストも出力
for (let r = 1; r <= 15; r += 1) {
  const rTracks = tracks.filter((t) => t.round === r);
  for (const t of rTracks) {
    writeFileSync(join(TXT_DIR, `${t.trackId}.txt`), `${t.lines.join('\n')}\n`, 'utf8');
  }
}

const manifest = {
  generatedAt: '2026-11-12',
  chapterId: 'tpl_1',
  rounds: 15,
  questionsPerRound: 12,
  totalQuestions: 180,
  totalTracks: tracks.length,
  audioDestination: 'public/audio/toeic_listening/<trackId>.mp3',
  indexJsonPath: 'public/audio/toeic_listening/index.json',
  tracks,
};

writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log(`[export-manifest] 完了: 全${manifest.rounds}回 / ${manifest.totalTracks}トラック / ${manifest.totalQuestions}問`);
