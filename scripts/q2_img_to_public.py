#!/usr/bin/env python3
"""第2問のイラストを public/listening_q2/ 用に整える。

第1問B の既存画像（900x900 / JPG / 約113kB）と同じ仕様に揃えることで、
アプリ側の表示（QuestionFigure）や配信サイズの傾向を第1問Bと同じにする。

■ 縦横比は絶対に変えない
    以前は無条件に 900x900 の正方形へ resize していた。
    生成物が 1024x1024 の正方形しかなかった頃はそれで問題なかったが、
    配布 PDF から取り出した実物のイラストには
        2×2の4枚組 … 1254x1254（正方形）
        1枚の図     … 1411x1114 / 1536x1024 / 1448x1086 など（横長）
    が混在している。横長の図を正方形に押し込むと絵が縦に伸び、
    地図・座席表・料理本の棚のように「位置関係」で答える図では
    形が変わって読み取れなくなる。
    そこで長辺を SIZE に合わせ、短辺は比率どおりに縮める
    （＝ thumbnail と同じ考え方）。余白は足さない。
    正方形の画像はこれまでと同じ 900x900 になるので、既存の見た目は変わらない。

■ 拡大はしない
    長辺が SIZE より小さい画像は、拡大するとぼやけるだけなので原寸のまま。

使い方
    python3 scripts/q2_img_to_public.py                 # scripts/data/q2_raw/*.png
    python3 scripts/q2_img_to_public.py a.png b.png     # ファイル指定
"""
import pathlib
import sys

from PIL import Image

SIZE = 900          # 第1問B の既存画像と同じ「長辺」の長さ
QUALITY = 88        # 線画なので 88 で十分（q1b と同程度のファイルサイズになる）
OUT = pathlib.Path('public/listening_q2')


def convert(src: pathlib.Path, name: str | None = None) -> pathlib.Path:
    """1枚を JPG に変換する。name を渡すと出力ファイル名を差し替える。"""
    OUT.mkdir(parents=True, exist_ok=True)
    im = Image.open(src).convert('RGB')

    # 長辺を SIZE に合わせる（縦横比は維持・拡大はしない）
    if max(im.size) > SIZE:
        im.thumbnail((SIZE, SIZE), Image.LANCZOS)

    dst = OUT / ((name or src.stem) + '.jpg')
    im.save(dst, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
    return dst


if __name__ == '__main__':
    targets = [pathlib.Path(a) for a in sys.argv[1:]] or sorted(
        pathlib.Path('scripts/data/q2_raw').glob('*.png'))
    for src in targets:
        dst = convert(src)
        w, h = Image.open(dst).size
        print(f'{src.name} -> {dst} ({w}x{h}, {dst.stat().st_size // 1024} kB)')
