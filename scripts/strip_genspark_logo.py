#!/usr/bin/env python3
"""
第1問B のイラスト画像から Genspark ロゴ（右下のグレーのバッジ）を取り除く。

なぜ必要か
  配布用 PDF（第１問B.pdf）から抜き出したイラストのうち、第1セットの4枚には
  画像生成時に焼き込まれた Genspark のウォーターマーク（角丸グレーのバッジ）が
  右下に入っている。教材の画像にサービス名が入ると出典が誤解されるため消す。

なぜ「色で探す」だけではダメだったか
  バッジは半透明で背景に溶けるため、地色（≒RGB 160）だけを条件にすると
  白背景のコマしか当たらず、逆にしきい値を緩めると書棚や制服の灰色を
  ロゴと誤検出してイラスト本体を壊す。実測でも 60 枚中 3〜11 枚しか
  安定して当たらなかった。

採用した方法（テンプレートマッチ＋インペイント）
  1. 実際のバッジを切り出した画像（scripts/assets/genspark_badge_template.png）を
     テンプレートとして cv2.matchTemplate（TM_CCOEFF_NORMED）で右下領域を走査する。
  2. 相関スコアの分布は、ロゴありの4枚が 0.82〜1.00、ロゴなしの56枚が 0.53 以下と
     はっきり2群に分かれる。しきい値 0.70 で誤検出・取りこぼしゼロで分離できる。
  3. 当たった位置にだけマスクを作り、cv2.inpaint(TELEA) で周囲の画素から埋める。
     白地なら白に、書棚の上なら書棚の続きに馴染むので、白い矩形で塗るより自然。
  4. しきい値未満の画像は一切加工せずコピーする（イラストを壊さない安全側）。

使い方
  python3 scripts/strip_genspark_logo.py <入力ディレクトリ> <出力ディレクトリ>
"""

from __future__ import annotations

import sys
from pathlib import Path

import cv2
import numpy as np

TEMPLATE_PATH = Path(__file__).resolve().parent / 'assets' / 'genspark_badge_template.png'

# ロゴあり/なしを分ける相関スコアのしきい値。
# 実測：ロゴあり 0.823〜1.000 / ロゴなし 0.100〜0.526 → 0.70 で安全に分離できる。
MATCH_THRESHOLD = 0.70

# 走査範囲（右下のみ）。バッジは必ず右下角に置かれるので、
# 画像全体を走査してイラスト内の似た形を誤検出するリスクを避ける。
ROI_TOP_FRAC = 0.88
ROI_LEFT_FRAC = 0.74

# インペイント時にバッジの縁（アンチエイリアスの薄いグレー）を残さないための余白。
PAD = 5


def load_template() -> np.ndarray:
    tpl = cv2.imread(str(TEMPLATE_PATH), cv2.IMREAD_COLOR)
    if tpl is None:
        raise SystemExit(f'テンプレートが読めません: {TEMPLATE_PATH}')
    return tpl


def strip(src: Path, dst: Path, tpl: np.ndarray) -> tuple[bool, float]:
    bgr = cv2.imread(str(src), cv2.IMREAD_COLOR)
    if bgr is None:
        raise SystemExit(f'読み込めません: {src}')
    h, w = bgr.shape[:2]

    oy, ox = int(h * ROI_TOP_FRAC), int(w * ROI_LEFT_FRAC)
    roi = bgr[oy:, ox:]
    th, tw = tpl.shape[:2]

    score = 0.0
    loc = None
    if roi.shape[0] >= th and roi.shape[1] >= tw:
        res = cv2.matchTemplate(roi, tpl, cv2.TM_CCOEFF_NORMED)
        _, score, _, max_loc = cv2.minMaxLoc(res)
        loc = max_loc

    if score < MATCH_THRESHOLD or loc is None:
        # ロゴなし：一切加工せずそのまま保存する
        cv2.imwrite(str(dst), bgr, [cv2.IMWRITE_PNG_COMPRESSION, 6])
        return False, score

    x0 = max(0, ox + loc[0] - PAD)
    y0 = max(0, oy + loc[1] - PAD)
    x1 = min(w, ox + loc[0] + tw + PAD)
    y1 = min(h, oy + loc[1] + th + PAD)

    mask = np.zeros((h, w), np.uint8)
    mask[y0:y1, x0:x1] = 255
    out = cv2.inpaint(bgr, mask, 5, cv2.INPAINT_TELEA)
    cv2.imwrite(str(dst), out, [cv2.IMWRITE_PNG_COMPRESSION, 6])
    return True, score


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__)
        return 1
    src_dir, dst_dir = Path(sys.argv[1]), Path(sys.argv[2])
    dst_dir.mkdir(parents=True, exist_ok=True)
    tpl = load_template()

    removed = total = 0
    for f in sorted(src_dir.glob('*.png')):
        total += 1
        did, score = strip(f, dst_dir / f.name, tpl)
        if did:
            removed += 1
            print(f'  logo removed: {f.name} (score={score:.3f})')
    print(f'processed={total} logo_removed={removed}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
