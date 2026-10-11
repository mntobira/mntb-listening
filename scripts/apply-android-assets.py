#!/usr/bin/env python3
"""Apply Android icon and splash assets from original/public/まなとびandroid.png"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC_ANDROID = ROOT / 'public' / 'まなとびandroid.png'
RES_DIR = ROOT / 'android' / 'app' / 'src' / 'main' / 'res'

def make_splash(src: Image.Image, width: int, height: int, logo_ratio: float = 0.55) -> Image.Image:
    canvas = Image.new('RGB', (width, height), (255, 255, 255))
    logo_size = int(min(width, height) * logo_ratio)
    resized_logo = src.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    offset_x = (width - logo_size) // 2
    offset_y = (height - logo_size) // 2
    canvas.paste(resized_logo, (offset_x, offset_y))
    return canvas

def main():
    if not SRC_ANDROID.exists():
        raise FileNotFoundError(f"Source file not found at {SRC_ANDROID}")

    src_img = Image.open(SRC_ANDROID).convert('RGB')
    print(f"Loaded Android source: {src_img.size}, mode={src_img.mode}")

    # 1. Update Android mipmap launcher icons
    # Adaptive icon foreground standard sizes (108dp):
    # mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432
    # Legacy icon standard sizes (48dp):
    # mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192
    mipmap_configs = {
        'mipmap-mdpi': (48, 108),
        'mipmap-hdpi': (72, 162),
        'mipmap-xhdpi': (96, 216),
        'mipmap-xxhdpi': (144, 324),
        'mipmap-xxxhdpi': (192, 432),
    }

    for folder, (legacy_sz, fg_sz) in mipmap_configs.items():
        dir_path = RES_DIR / folder
        if not dir_path.exists():
            continue
        
        # Legacy square and round icons
        legacy_img = src_img.resize((legacy_sz, legacy_sz), Image.Resampling.LANCZOS)
        legacy_img.save(dir_path / 'ic_launcher.png', 'PNG', optimize=True)
        legacy_img.save(dir_path / 'ic_launcher_round.png', 'PNG', optimize=True)

        # Adaptive icon foreground (108dp)
        fg_img = src_img.resize((fg_sz, fg_sz), Image.Resampling.LANCZOS)
        fg_img.save(dir_path / 'ic_launcher_foreground.png', 'PNG', optimize=True)
        print(f"Updated {folder}: legacy={legacy_sz}x{legacy_sz}, foreground={fg_sz}x{fg_sz}")

    # 2. Update Android splash screens
    splash_targets = {
        'drawable/splash.png': (480, 320),
        'drawable-land-mdpi/splash.png': (480, 320),
        'drawable-land-hdpi/splash.png': (800, 480),
        'drawable-land-xhdpi/splash.png': (1280, 720),
        'drawable-land-xxhdpi/splash.png': (1600, 960),
        'drawable-land-xxxhdpi/splash.png': (1920, 1280),
        'drawable-port-mdpi/splash.png': (320, 480),
        'drawable-port-hdpi/splash.png': (480, 800),
        'drawable-port-xhdpi/splash.png': (720, 1280),
        'drawable-port-xxhdpi/splash.png': (960, 1600),
        'drawable-port-xxxhdpi/splash.png': (1280, 1920),
    }

    for rel_path, (w, h) in splash_targets.items():
        target_path = RES_DIR / rel_path
        target_path.parent.mkdir(parents=True, exist_ok=True)
        splash_img = make_splash(src_img, w, h, logo_ratio=0.55)
        splash_img.save(target_path, 'PNG', optimize=True)
        print(f"Updated splash: {rel_path} ({w}x{h})")

    print("ALL ANDROID ICONS & SPLASH SCREENS SUCCESSFULLY UPDATED!")

if __name__ == '__main__':
    main()
