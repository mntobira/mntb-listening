/**
 * ===================================================================
 * bgmFiles — 対戦BGMを「音源ファイル」で鳴らすための登録簿（2026-09-29）
 * ===================================================================
 *
 * ■ 何のためか
 *   対戦のBGMは今まで battleAudio.ts の合成音（ファイル0個）だった。
 *   商用利用できる作曲済みBGM（ElevenLabs Music を有料契約中に生成したもの等）を
 *   置けるように、ファイルがあればファイルを、無ければ従来の合成音を鳴らす。
 *
 * ■ 曲は3本（対戦曲は2本から試合ごとに1本を選ぶ）
 *   waiting … 待合室・相手さがし・対戦メニュー（'matching'）。ループ。
 *   battle  … カウントダウン開始から鳴らし、★曲頭から dropSec 秒で本編に入る★。
 *             カウントダウン「7・6・…・1」が 7 秒、そのあと START! なので、
 *             dropSec = 7 で作れば「7秒たった瞬間にバトルが始まる」形になる。
 *             'normal' / 'closing' / 'final' はすべてこの1曲を流しっぱなしにする。
 *   battle2 … battle と同じ作り（dropSec = 7）の2曲目。試合ごとに battle と 50% で入れ替わる。
 *
 * ■ ここに登録するのは「実在して、商用の根拠があるファイル」だけ
 *   ・音源は public/bgm/battle/ に置き、license を必ず書く（台帳は docs/BATTLE_BGM.md）。
 *   ・未登録（undefined）なら合成音のまま。ファイルが読めなかったときも合成音に戻る。
 *   ・架空のファイル名や仮の音源は登録しない。
 */

import { battleFileGain } from './bgmLoudness';

export type BgmFileKey = 'waiting' | 'battle' | 'battle2';

/** 対戦中に流す曲の候補（試合ごとにどちらか1曲を選び、最後まで流しっぱなし） */
export type BattleBgmVariant = 'battle' | 'battle2';
export const BATTLE_BGM_VARIANTS: readonly BattleBgmVariant[] = ['battle', 'battle2'];

export interface BgmFileSpec {
  /** public からのパス（例: '/bgm/battle/waiting.mp3'） */
  url: string;
  /** 曲頭から本編（ドロップ）までの秒数。battle は 7 を想定 */
  dropSec: number;
  /** ループ区間の開始秒（曲の終わりに来たらここへ戻る） */
  loopStartSec: number;
  /** ループ区間の終了秒（省略時は曲の終わり） */
  loopEndSec?: number;
  /** 再生音量（0〜1。合成音と揃えるための補正） */
  gain: number;
  /** 商用の根拠（台帳 docs/BATTLE_BGM.md と同じ文言） */
  license: string;
}

/**
 * 登録簿。★音源が届いたらここに追記する★
 * 例:
 *   battle: { url: '/bgm/battle/battle.mp3', dropSec: 7, loopStartSec: 7, gain: 0.55,
 *             license: 'ElevenLabs Music・Creator有料契約中に運営者が生成（領収書 #…）' },
 */
export const BGM_FILES: Readonly<Partial<Record<BgmFileKey, BgmFileSpec>>> = {
  // 2026-10-01 利用者が2曲（y005「夕凪」・w001「風の列車」）から「落ち着いている方」として選定。
  // 夕凪＝ピアノ中心・ゆったり（高域ほぼ無し）→ 待合室。風の列車はテンポが速くにぎやか → 対戦。
  // 末尾3秒をフェードアウトして曲頭（ピアノの入り）へ戻る。音量は bgmLoudness.ts で全曲同じ大きさにそろえる。
  waiting: { url: '/bgm/battle/waiting.mp3', dropSec: 0, loopStartSec: 0, loopEndSec: 81.5, gain: battleFileGain('waiting'),
    license: 'フリー音源「夕凪」作曲：やっすん／配布元：創作堂さくら紅葉（https://yukizakura.net/）。利用規約第6条：商用・非商用を問わず利用可、カット・ループ調整などの加工可、配布元とURLの記載が条件' },
  // 2026-10-01 利用者の指定：「風の列車」は対戦の曲に。★リスニング対戦には付けない★
  //   （BattleLiveStage：リスニングは問題の音声と重ならないよう、問題中は BGM を鳴らさない。カウントダウン中は待合室の曲）
  // 原曲 6.5 秒から切り出し → 曲頭から 7 秒で本編（原曲 13.5 秒の盛り上がり）に入る。ループは本編の頭（7秒）から曲末まで。
  battle: { url: '/bgm/battle/battle.mp3', dropSec: 7, loopStartSec: 7, loopEndSec: 67.5, gain: battleFileGain('battle'),
    license: 'フリー音源「風の列車」作曲：坂田白／配布元：創作堂さくら紅葉（https://yukizakura.net/）。利用規約第6条：商用・非商用を問わず利用可、カット・ループ調整などの加工可、配布元とURLの記載が条件' },
  // 2026-10-03 利用者の指定：対戦曲の2曲目に「カナリアスキップ」（135bpm・1小節＝1.7778秒）。試合ごとに 50% で風の列車と入れ替わる。
  //   ★2026-10-05 作り直し（「1番サビからバトルが始まっていない」）★
  //   原曲（419秒）を小節ごとに解析すると、1番サビは 17小節目＝原曲 30.222 秒（音量 25→33・最後のサビと和音一致 0.95）。
  //   以前の切り出し（原曲 49.889 秒から）は 7 秒が原曲 32小節目＝サビの終わりで、START! のときにはサビが終わりかけていた。
  //   → 原曲 23.222 秒から切り出し直し、★曲頭から 7 秒ちょうどで1番サビ★（0〜7秒はAメロ終わり→フィル）。
  //   ループは 114 小節（作曲者指定のループ区間の長さ）＝ 7 秒 → 209.667 秒。原曲でも 114 小節後に同じサビへ戻る（継ぎ目の和音一致 0.998）。
  battle2: { url: '/bgm/battle/battle2.mp3', dropSec: 7, loopStartSec: 7, loopEndSec: 209.667, gain: battleFileGain('battle2'),
    license: 'フリーBGM「カナリアスキップ」作曲：まんぼう二等兵／配布元：OpenTracks（旧DOVA-SYNDROME https://opentracks.com/bgm/detail/7312 ）。音源利用ライセンス：商用・非商用を問わずアプリのBGMとして利用可、カット・ループ・フェード等の加工可、クレジット不要（音源単体の再配布・AI学習は禁止）' },
};

/**
 * 対戦曲を1曲選ぶ（登録されている候補から等確率）。
 * rand は 0〜1 の乱数（テスト用に差し替え可）。候補が無ければ 'battle'（＝合成音へ戻る）。
 */
export function pickBattleVariant(rand: number = Math.random()): BattleBgmVariant {
  const list = BATTLE_BGM_VARIANTS.filter((k) => BGM_FILES[k]);
  if (list.length === 0) return 'battle';
  const r = Number.isFinite(rand) ? Math.min(Math.max(rand, 0), 0.999999) : 0;
  return list[Math.floor(r * list.length)];
}

export function isBattleVariantKey(key: BgmFileKey | null): key is BattleBgmVariant {
  return key === 'battle' || key === 'battle2';
}

/** 局面のトラック → どのファイルで鳴らすか */
export function bgmFileKeyOf(
  track: 'matching' | 'normal' | 'closing' | 'final',
  variant: BattleBgmVariant = 'battle',
): BgmFileKey {
  return track === 'matching' ? 'waiting' : variant;
}

/**
 * カウントダウン中に battle 曲をどこから再生するか（秒）。
 *
 * startInMs = START! まであと何ミリ秒か（7秒のカウントダウン中なら 7000→0）。
 * 曲頭から dropSec 秒で本編なので、再生位置 = dropSec − 残り秒。
 * カウントダウンの途中で画面に入った（再接続など）場合も、ドロップがSTART!に揃う。
 * 残りが dropSec より長いときは 0 から（少し早くドロップするより、遅れて入るほうが自然なため
 * 呼び出し側で待たせる）。負になることはない。
 */
export function introOffsetSec(dropSec: number, startInMs: number): number {
  const remain = Math.max(0, startInMs) / 1000;
  return Math.max(0, dropSec - remain);
}

/** 本編が始まるまで何秒待ってから再生を始めるか（残りが dropSec より長いとき） */
export function introDelaySec(dropSec: number, startInMs: number): number {
  return Math.max(0, Math.max(0, startInMs) / 1000 - dropSec);
}
