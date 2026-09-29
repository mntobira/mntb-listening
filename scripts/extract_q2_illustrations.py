#!/usr/bin/env python3
"""
配布 PDF「第２問.pdf」から第2問のイラストを取り出し、
public/listening_q2/ に正式な名前（el2_set<N>_q<M>.jpg）で置く。

■ なぜこのスクリプトが必要か
    第2問は「絵を選ぶ」大問なので、イラストが無いと問題が成立しない。
    当初は絵を自前生成する前提だったが、配布 PDF に実物のイラストが
    含まれていることが分かったため、そちらを使う。
    手作業で 48 枚を切り出して並べるとまず取り違えるので、
    ページ順から機械的に (セット, 問) を割り当てる。

■ 取り出せる絵と、そのうち実際に使う絵
    PDF には 46 枚の画像が入っている（第2問は p1-61）。
    ページ順に第1セット問1 → 第1セット問2 → … と並んでいる。
    ただし「絵があること」と「その絵が使えること」は別問題である。
    絵の1マスずつを拡大して選択肢の文言と突き合わせた結果、
    絵と選択肢が食い違う問が実際に見つかった
    （どの問がなぜ使えないかは shuffle_listening_q2_options.py の
      EXCLUDED_PDF_ILLUSTRATIONS に理由つきで記録している）。
    そこで、収録対象は shuffle 側の PDF_ILLUSTRATION_QUESTIONS を
    唯一の定義として参照し、このスクリプトには書かない。

■ ①②③④ が絵に焼き込まれていることの確認
    各マスの左上に番号が「絵として」描かれているため、
    マスを切り貼りして並べ替えることはできない。
    --verify を付けると、2×2 の各マスについて
        左上 22% の領域の暗ピクセル率 と、その右隣の帯の暗ピクセル率
    を測って表示する。前者だけが大きければ番号が焼き込まれている。
    （実測値の例：約 10% 対 約 0.3%）

使い方
    python3 scripts/extract_q2_illustrations.py --pdf <第２問.pdf>
    python3 scripts/extract_q2_illustrations.py --pdf <第２問.pdf> --verify
    python3 scripts/extract_q2_illustrations.py --pdf <第２問.pdf> --dry-run
"""

from __future__ import annotations

import argparse
import io
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from q2_img_to_public import convert  # noqa: E402
from shuffle_listening_q2_options import (  # noqa: E402
    EXCLUDED_PDF_ILLUSTRATIONS,
    ILLUSTRATION_SOURCE_LABEL,
    PDF_ILLUSTRATION_QUESTIONS,
)

# 第2問の収録範囲（この後ろは第4問A なので読み飛ばす）
Q2_LAST_PAGE = 61

# ページ本文に置かれた見出し。「S6」がセット、「Q1」が問。
RE_SET = re.compile(r'^S[\s]*[０-９0-9]+$')
RE_Q = re.compile(r'^Q[\s]*([０-９0-9])$')


def _to_int(s: str) -> int:
    """全角数字にも対応した整数化。"""
    return int(s.translate(str.maketrans('０１２３４５６７８９', '0123456789')))


def extract(pdf: Path) -> list[dict]:
    """
    PDF から画像を取り出し、(セット, 問) を割り当てる。

    ★「3枚ずつ順番に」割り当ててはいけない★
    一見どのセットも3問なので i//3 で割り当てられそうに見えるが、
    実際には1つの問が2ページに分かれて画像が2枚入っている箇所がある
    （第2セット問2）。順番に3枚ずつ数えると、そこから後ろが
    まるごと1つずれて、別の問の絵を貼ってしまう。
    実際に i//3 で割り当てたところ、第13セット問2 に
    第13セット問1 の地図（1316x1195）が入り、取り違えが起きた。

    そこで、ページ本文の見出し（S6 / Q1 …）と画像を
    「ページ番号 → ページ内の Y 座標」の順に並べ、
    各画像を★直前に現れた見出し★に結びつける。
    見出しは PDF が持っている構造なので、枚数の増減に影響されない。
    """
    doc = fitz.open(pdf)
    found: list[dict] = []
    seen: set[int] = set()
    cur_set: int | None = None
    cur_q: int | None = None

    for pno in range(min(len(doc), Q2_LAST_PAGE)):
        page = doc[pno]

        # 見出しと画像を1つの列に混ぜ、Y 座標の順に読む
        items: list[tuple[float, str, object]] = []
        for b in page.get_text('blocks'):
            text = b[4].strip()
            if text:
                items.append((b[1], 'text', text))
        for info in page.get_image_info(xrefs=True):
            items.append((info['bbox'][1], 'image', info['xref']))
        items.sort(key=lambda it: it[0])

        for _, kind, value in items:
            if kind == 'text':
                for line in str(value).splitlines():
                    line = line.strip()
                    if RE_SET.match(line):
                        cur_set = _to_int(line[1:])
                        cur_q = None
                    elif m := RE_Q.match(line):
                        cur_q = _to_int(m.group(1))
                continue

            xref = int(value)  # type: ignore[arg-type]
            if xref in seen:   # 同じ画像が複数ページから参照される場合がある
                continue
            seen.add(xref)
            if cur_set is None or cur_q is None:
                print(f'  ! p{pno + 1} の画像 xref={xref} は見出しの前にあります')
                continue
            info = doc.extract_image(xref)
            found.append(
                {
                    'page': pno + 1,
                    'xref': xref,
                    'set': cur_set,
                    'q': cur_q,
                    'width': info['width'],
                    'height': info['height'],
                    'bytes': info['image'],
                }
            )
    return found


def dark_ratio(im: Image.Image, box: tuple[int, int, int, int]) -> float:
    """指定範囲の暗い（＝線が引かれている）ピクセルの割合を返す。"""
    a = np.asarray(im.crop(box).convert('L'))
    return float((a < 128).mean() * 100)


def verify_numbers_baked(im: Image.Image) -> list[tuple[float, float]]:
    """
    2×2 の各マスについて (左上22%の暗ピクセル率, その右隣の帯の暗ピクセル率)
    を返す。前者だけが大きければ ①②③④ が絵として焼き込まれている。
    """
    w, h = im.size
    pw, ph = w // 2, h // 2
    corner = int(pw * 0.22), int(ph * 0.22)
    out = []
    for r, c in ((0, 0), (0, 1), (1, 0), (1, 1)):
        x0, y0 = c * pw, r * ph
        mark = (x0, y0, x0 + corner[0], y0 + corner[1])
        beside = (x0 + corner[0], y0, x0 + corner[0] * 2, y0 + corner[1])
        out.append((dark_ratio(im, mark), dark_ratio(im, beside)))
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--pdf', required=True, type=Path, help='配布 PDF「第２問.pdf」')
    ap.add_argument('--verify', action='store_true', help='番号の焼き込みを実測して表示')
    ap.add_argument('--dry-run', action='store_true', help='書き出さずに一覧だけ表示')
    args = ap.parse_args()

    if not args.pdf.exists():
        print(f'PDF が見つかりません: {args.pdf}')
        return 1

    found = extract(args.pdf)
    print(f'{args.pdf.name}: 画像 {len(found)} 枚を検出')

    # 見出し（S◯Q◯）→ その見出しの位置にある画像
    # 1つの見出しに2枚ある箇所（第2セット問2）は最後の1枚を採る。
    by_label: dict[tuple[int, int], dict] = {}
    for e in found:
        by_label[(e['set'], e['q'])] = e

    written = 0
    for key in sorted(PDF_ILLUSTRATION_QUESTIONS):
        # 絵と問がずれている問は、実際に絵が入っている見出しから取る。
        label = ILLUSTRATION_SOURCE_LABEL.get(key, key)
        e = by_label.get(label)
        if e is None:
            print(f'  ! 第{key[0]}セット問{key[1]} の絵が PDF に見つかりません')
            continue

        im = Image.open(io.BytesIO(e['bytes']))
        name = f'el2_set{key[0]}_q{key[1]}'
        note = f'{name}  p{e["page"]}  {e["width"]}x{e["height"]}'
        if label != key:
            note += f'  ← 見出し S{label[0]}Q{label[1]}'

        if args.verify:
            pairs = verify_numbers_baked(im)
            note += '  番号/右隣: ' + ' '.join(
                f'{m:.1f}%/{b:.1f}%' for m, b in pairs
            )

        if args.dry_run:
            print('  ' + note)
            continue

        tmp = ROOT / 'scripts' / 'data' / 'q2_raw'
        tmp.mkdir(parents=True, exist_ok=True)
        src = tmp / f'{name}.png'
        im.save(src)
        dst = convert(src, name)
        w, h = Image.open(dst).size
        print(f'  {note} -> {dst.name} ({w}x{h}, {dst.stat().st_size // 1024} kB)')
        written += 1

    skipped = sorted(EXCLUDED_PDF_ILLUSTRATIONS)
    print(f'\n収録: {written} 枚 / 見送り: {len(skipped)} 問 {skipped}')
    print('（見送りの理由は shuffle_listening_q2_options.py に記録）')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
