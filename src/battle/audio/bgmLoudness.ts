/**
 * 全BGMの音量をそろえる唯一の場所（2026-10-02）。
 *
 * ffmpeg ebur128 で実測した統合ラウドネス（LUFS）を書き、
 * 「音量スライダー最大のとき、どの曲も BGM_TARGET_LUFS で鳴る」ように倍率を決める。
 *   誕生（タイトル・ホーム）  -13.4 LUFS（もともと大きい曲 → 下げる）
 *   夕凪（待合室）            -20.3 LUFS
 *   風の列車（対戦）          -19.7 LUFS
 *   カナリアスキップ（対戦2） -20.4 LUFS
 * 以前は「待合室の小さい倍率に全部を合わせて、誕生はさらに-3dB」にしていたため
 * 全曲が -31〜-35 LUFS まで小さくなっていた。今回は曲ごとの差だけを補正し、
 * 全体の大きさはスライダーだけで決まる。音源ファイルは加工しない。
 */
export const BGM_TARGET_LUFS = -22;

export const BGM_MEASURED_LUFS = {
  title: -13.4,
  waiting: -20.3,
  battle: -19.7,
  battle2: -20.4,
} as const;

export type BgmLoudnessKey = keyof typeof BGM_MEASURED_LUFS;

/** スライダー 1.0 のときに曲へかける総合倍率（目標 LUFS に合わせる） */
export function bgmLoudnessGain(key: BgmLoudnessKey): number {
  return Math.pow(10, (BGM_TARGET_LUFS - BGM_MEASURED_LUFS[key]) / 20);
}

/** 対戦エンジンは BGM バス（0.5）を通るので、その分を戻した倍率 */
export const BATTLE_BGM_BUS_GAIN = 0.5;
export function battleFileGain(key: 'waiting' | 'battle' | 'battle2'): number {
  return bgmLoudnessGain(key) / BATTLE_BGM_BUS_GAIN;
}
