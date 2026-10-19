/**
 * ===================================================================
 * 忘却曲線グラフの X 軸目盛りの間引き
 * ===================================================================
 *
 * ■ 直していた問題
 *   X軸ラベルは復習間隔 [0, 1, 3, 7, 14, 30, 60] 日をそのまま
 *   「当日 / 1日 / 3日 / 7日 / 14日 / 30日 / 60日」と全部描いていた。
 *   X座標は日数に比例（0〜60日を等間隔に写像）するので、
 *   0・1・3・7日 は左端の1/8以内に密集する。
 *   その狭い範囲に4つのラベルを置くため、文字が重なって読めなかった。
 *
 * ■ どう解いたか
 *   「文字が占める幅」を見積もって、隣のラベルとぶつかるものを落とす。
 *   固定で「スマホでは1つ飛ばし」にする案は採らなかった。
 *   間隔が不均等（0,1,3,7… と対数的）なので、均等な間引きでは
 *   左端の密集は解消せず、右端は無駄に間引かれてしまう。
 *
 *   実際の座標と文字幅で判定すれば、
 *     - 密集している左端だけが間引かれる
 *     - 右側の余裕のあるラベルは残る
 *   という自然な結果になる。両端（最初と最後）は
 *   軸の範囲を示す情報なので必ず残す。
 *
 * ■ なぜ純関数として切り出すか
 *   SVG の描画結果は jsdom では実測できない（テキストの実寸が出ない）。
 *   間引きの判断だけを純関数にしておけば、
 *   「重なりが解消されているか」を座標計算のレベルで検証できる。
 */

/** 目盛り1つ分の情報 */
export interface AxisTick {
  /** 何日後か */
  days: number;
  /** 表示ラベル */
  label: string;
  /** SVG 上の X 座標 */
  x: number;
}

/** 日数 → ラベル文字列（0 日は「当日」と読ませる） */
export function formatDayLabel(days: number): string {
  return days === 0 ? '当日' : `${days}日`;
}

/**
 * ラベルの描画幅の見積り（SVG ユーザー単位）。
 *
 * 日本語（全角）は約 fontSize、半角数字は約 fontSize*0.55 で見積もる。
 * 厳密な実測ではないが、間引きの判断には十分な精度がある。
 */
export function estimateLabelWidth(label: string, fontSize: number): number {
  let w = 0;
  for (const ch of label) {
    // 半角英数・記号はおよそ半分の幅
    w += /[\x20-\x7E]/.test(ch) ? fontSize * 0.55 : fontSize;
  }
  return w;
}

/**
 * 重なるラベルを間引いて、描画すべき目盛りだけを返す。
 *
 * @param days     目盛りにしたい日数の配列（昇順であること）
 * @param xForDays 日数 → X座標 の写像
 * @param fontSize ラベルのフォントサイズ（SVG ユーザー単位）
 * @param gap      ラベル間に最低限空けたい余白
 *
 * アルゴリズム:
 *   1. 最初のラベルは必ず採用する
 *   2. 以降は「直前に採用したラベルの右端 + gap」より
 *      自分の左端が右にあるときだけ採用する
 *   3. 最後のラベルは軸の上限を示すので必ず採用し、
 *      直前の採用分と衝突する場合はその直前を取り下げる
 */
export function pickAxisTicks(
  days: readonly number[],
  xForDays: (d: number) => number,
  fontSize: number,
  gap = 4
): AxisTick[] {
  const all: AxisTick[] = (days || []).map((d) => ({
    days: d,
    label: formatDayLabel(d),
    x: xForDays(d),
  }));
  if (all.length <= 1) return all;

  const halfWidth = (t: AxisTick) => estimateLabelWidth(t.label, fontSize) / 2;

  const picked: AxisTick[] = [all[0]];
  for (let i = 1; i < all.length - 1; i += 1) {
    const cand = all[i];
    const prev = picked[picked.length - 1];
    const prevRight = prev.x + halfWidth(prev);
    if (cand.x - halfWidth(cand) >= prevRight + gap) {
      picked.push(cand);
    }
  }

  // 最後のラベル（軸の上限）は必ず出す。
  // 直前に採用したものと重なるなら、そちらを取り下げる。
  const last = all[all.length - 1];
  while (picked.length > 1) {
    const prev = picked[picked.length - 1];
    if (last.x - halfWidth(last) < prev.x + halfWidth(prev) + gap) {
      picked.pop();
    } else {
      break;
    }
  }
  picked.push(last);

  return picked;
}

