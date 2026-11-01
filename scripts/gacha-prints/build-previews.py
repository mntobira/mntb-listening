#!/usr/bin/env python3
"""ガチャの「ピックアップ」で見せる『中身を少しだけ』の画像を作る。

対象：LR（共通テスト予想問題 10種・2次試験予想問題）＋ 厳選UR（GachaParts.tsx の FEATURED_UR_IDS 10種）。
各PDFの 2ページ目と真ん中のページを、上半分だけ・幅 360px の webp にする（下はぼかして白く消す）。
→ 全部は読めない「ちら見せ」。出力：public/prints/previews/<id>_p<n>.webp
一覧は src/data/gachaPreviews.generated.ts に書き出す（tests/gachaPickup.test.ts が実物と照合）。

  python3 scripts/gacha-prints/build-previews.py                 # すべて作り直す
  python3 scripts/gacha-prints/build-previews.py print_lr_niji_nagoya_en_1 ...  # 指定したものだけ（他は一覧に残す）
"""
import json, re, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/prints/previews'
WIDTH, KEEP = 360, 0.52  # 幅・上から残す割合


def featured_ur_ids() -> list[str]:
    src = (ROOT / 'src/components/GachaParts.tsx').read_text()
    block = src[src.index('FEATURED_UR_IDS'):]
    block = block[:block.index('] as const')]
    return re.findall(r"'(print_[a-z0-9_]+)'", block)


def lr_ids() -> list[str]:
    src = (ROOT / 'src/data/kyotsuMockPrints.ts').read_text()
    out = []
    for kind, n in re.findall(r'\b([rl])\((\d), \d+, \d+\)', src):
        out.append(f'print_lr_kyotsu_{kind}_{n}')
    # 2026-10-29：2次試験ガチャの LR（国公立2次 英語 予想問題）
    niji = (ROOT / 'src/data/nijiMockPrints.ts').read_text()
    for univ, n in re.findall(r'\b(nagoya|shizuoka|omua|omub|wakayama|okayama|hiroshima)\((\d+), \d+, \d+\)', niji):
        out.append(f'print_lr_niji_{univ}_en_{n}')
    return out


def current_table() -> dict[str, list[str]]:
    src = (ROOT / 'src/data/gachaPreviews.generated.ts').read_text()
    return json.loads(src[src.index('{'):src.rindex('}') + 1])


def page_count(pdf: Path) -> int:
    info = subprocess.run(['pdfinfo', str(pdf)], capture_output=True, text=True).stdout
    return int(re.search(r'Pages:\s+(\d+)', info).group(1))


def shot(pdf: Path, page: int, dest: Path) -> None:
    with tempfile.TemporaryDirectory() as td:
        base = Path(td) / 'p'
        subprocess.run(['pdftoppm', '-f', str(page), '-l', str(page), '-r', '60', '-png',
                        '-singlefile', str(pdf), str(base)], check=True, stderr=subprocess.DEVNULL)
        im = Image.open(str(base) + '.png').convert('L')
    h = int(im.height * WIDTH / im.width)
    im = im.resize((WIDTH, h), Image.LANCZOS).crop((0, 0, WIDTH, int(h * KEEP)))
    # 下 35% をだんだんぼかして白へ（続きは手に入れてから）
    fade_from = int(im.height * 0.65)
    blurred = im.filter(ImageFilter.GaussianBlur(3))
    white = Image.new('L', im.size, 255)
    mask_blur = Image.new('L', im.size, 0)
    mask_white = Image.new('L', im.size, 0)
    span = im.height - fade_from
    for y in range(fade_from, im.height):
        t = (y - fade_from) / max(1, span)
        mask_blur.paste(int(255 * min(1, t * 2)), (0, y, WIDTH, y + 1))
        mask_white.paste(int(255 * t), (0, y, WIDTH, y + 1))
    im = Image.composite(blurred, im, mask_blur)
    im = Image.composite(white, im, mask_white)
    im.save(dest, 'WEBP', quality=55, method=6)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    ids = lr_ids() + featured_ur_ids()
    only = set(sys.argv[1:])
    old = current_table() if only else {}
    table: dict[str, list[str]] = {}
    for pid in ids:
        if only and pid not in only:
            if pid in old:
                table[pid] = old[pid]
            continue
        pdf = ROOT / f'public/prints/{pid}.pdf'
        n = page_count(pdf)
        pages = sorted({min(2, n), max(1, (n + 1) // 2)})
        files = []
        for p in pages:
            name = f'{pid}_p{p}.webp'
            shot(pdf, p, OUT / name)
            files.append(f'/prints/previews/{name}')
        table[pid] = files
        print(pid, pages, sum((OUT / Path(f).name).stat().st_size for f in files) // 1024, 'KB')
    body = json.dumps(table, ensure_ascii=False, indent=2)
    (ROOT / 'src/data/gachaPreviews.generated.ts').write_text(
        '// scripts/gacha-prints/build-previews.py が作る。手で直さない。\n'
        '/** ピックアップの「中身を少し見る」画像（PDFの一部の上半分だけ） */\n'
        f'export const GACHA_PREVIEWS: Readonly<Record<string, readonly string[]>> = {body};\n')


if __name__ == '__main__':
    main()
