#!/usr/bin/env python3
"""Generate app icons from the user-supplied square artwork.

Preserve the entire logo, its white background and original aspect ratio.
Favicons use the same artwork, not a cropped initial. Maskable versions add
extra white padding. No application logos, questions or audio are modified.
Run: python3 scripts/make-icons.py
"""
import math
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
SRC_LOGO = ROOT / 'scripts' / 'assets' / 'app-icon-source.png'
OUT_DIR = ROOT / 'public' / 'icons'
BG = (255, 255, 255, 255)
# The supplied image already contains its intended white margins.
WIDTH_RATIO = {
    'any': 1.0,
    'maskable': 0.88,
    'apple': 1.0,
}


def check_safe_zone(logo: Image.Image, width_ratio: float) -> None:
    """Check visible artwork, not its white canvas, against the 80% circle."""
    white = Image.new('RGB', logo.size, 'white')
    diff = ImageChops.difference(logo.convert('RGB'), white)
    bounds = diff.convert('L').point(lambda value: 255 if value > 15 else 0).getbbox()
    if bounds is None:
        raise ValueError('The source artwork is blank')
    w, h = logo.size
    x0, y0, x1, y1 = bounds
    radius = max(math.hypot((x - w / 2) / w, (y - h / 2) / w)
                 for x in (x0, x1) for y in (y0, y1)) * width_ratio
    if radius > 0.4:
        raise ValueError(f'Maskable artwork exceeds the safe zone: {radius:.4f}')
    print(f'Maskable safe zone: {radius:.4f} <= 0.4')


def letterbox(logo: Image.Image, size: int, width_ratio: float) -> Image.Image:
    lw, lh = logo.size
    target_w = max(1, round(size * width_ratio))
    target_h = max(1, round(target_w * lh / lw))
    resized = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (size, size), BG)
    canvas.alpha_composite(resized, ((size - target_w) // 2, (size - target_h) // 2))
    return canvas


def main() -> None:
    logo = Image.open(SRC_LOGO).convert('RGBA')
    if logo.width != logo.height:
        raise ValueError('The approved icon artwork must be square')
    check_safe_zone(logo, WIDTH_RATIO['maskable'])
    OUT_DIR.mkdir(exist_ok=True)
    outputs = []
    for size in (192, 512):
        outputs.append((f'icon-{size}.png', size, WIDTH_RATIO['any']))
        outputs.append((f'icon-maskable-{size}.png', size, WIDTH_RATIO['maskable']))
    outputs.append(('apple-touch-icon-180.png', 180, WIDTH_RATIO['apple']))
    outputs.extend((f'favicon-{size}.png', size, WIDTH_RATIO['any']) for size in (32, 48, 96, 192))
    for name, size, scale in outputs:
        letterbox(logo, size, scale).save(OUT_DIR / name, 'PNG', optimize=True)
        print(f'{name}: {size}x{size}')
    letterbox(logo, 256, WIDTH_RATIO['any']).save(
        ROOT / 'public' / 'favicon.ico', 'ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print('favicon.ico: 16, 32, 48, 64')


if __name__ == '__main__':
    main()
