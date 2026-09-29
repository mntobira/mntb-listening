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
 * ■ 曲は2本
 *   waiting … 待合室・相手さがし・対戦メニュー（'matching'）。ループ。
 *   battle  … カウントダウン開始から鳴らし、★曲頭から dropSec 秒で本編に入る★。
 *             カウントダウン「7・6・…・1」が 7 秒、そのあと START! なので、
 *             dropSec = 7 で作れば「7秒たった瞬間にバトルが始まる」形になる。
 *             'normal' / 'closing' / 'final' はすべてこの1曲を流しっぱなしにする。
 *
 * ■ ここに登録するのは「実在して、商用の根拠があるファイル」だけ
 *   ・音源は public/bgm/battle/ に置き、license を必ず書く（台帳は docs/BATTLE_BGM.md）。
 *   ・未登録（undefined）なら合成音のまま。ファイルが読めなかったときも合成音に戻る。
 *   ・架空のファイル名や仮の音源は登録しない。
 */

export type BgmFileKey = 'waiting' | 'battle';

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
export const BGM_FILES: Readonly<Partial<Record<BgmFileKey, BgmFileSpec>>> = {};

/** 局面のトラック → どのファイルで鳴らすか */
export function bgmFileKeyOf(track: 'matching' | 'normal' | 'closing' | 'final'): BgmFileKey {
  return track === 'matching' ? 'waiting' : 'battle';
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
