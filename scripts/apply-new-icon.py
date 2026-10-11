#!/usr/bin/env python3
"""Apply new app icon from user download to iOS, Web, and Android icon assets."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC_PATH = Path('/Users/bentodai/Downloads/マナトビリスニング最終盤アイコン.png')

def make_maskable(img: Image.Image, size: int, scale: float = 0.8) -> Image.Image:
    target_dim = int(size * scale)
    scaled = img.resize((target_dim, target_dim), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (size, size), (255, 255, 255))
    offset = (size - target_dim) // 2
    canvas.paste(scaled, (offset, offset))
    return canvas

def main():
    if not SRC_PATH.exists():
        raise FileNotFoundError(f"Source icon not found at {SRC_PATH}")

    src_img = Image.open(SRC_PATH).convert('RGB')
    print(f"Loaded source image: {src_img.size}, mode={src_img.mode}")

    # 1. 1024x1024 for iOS AppIcon
    img_1024 = src_img.resize((1024, 1024), Image.Resampling.LANCZOS)
    ios_app_icon = ROOT / 'ios' / 'App' / 'App' / 'Assets.xcassets' / 'AppIcon.appiconset' / 'AppIcon-512@2x.png'
    img_1024.save(ios_app_icon, 'PNG', optimize=True)
    print(f"Updated iOS AppIcon: {ios_app_icon} (1024x1024)")

    # 2. Source asset for scripts
    src_asset = ROOT / 'scripts' / 'assets' / 'app-icon-source.png'
    src_asset.parent.mkdir(parents=True, exist_ok=True)
    img_1024.save(src_asset, 'PNG', optimize=True)
    print(f"Updated script source asset: {src_asset}")

    # 3. Web & Home icons
    home_icon_png = ROOT / 'public' / 'home_icon.png'
    home_icon_jpg = ROOT / 'public' / 'home_icon.jpg'
    home_icon_sub_png = ROOT / 'public' / 'icons' / 'home_icon.png'
    home_icon_sub_png.parent.mkdir(parents=True, exist_ok=True)

    img_512 = src_img.resize((512, 512), Image.Resampling.LANCZOS)
    img_512.save(home_icon_png, 'PNG', optimize=True)
    img_512.save(home_icon_jpg, 'JPEG', quality=95)
    img_512.save(home_icon_sub_png, 'PNG', optimize=True)
    print("Updated public/home_icon.png, home_icon.jpg, and icons/home_icon.png (512x512)")

    # 4. Brand emblem logo
    brand_logo = ROOT / 'public' / 'brand' / 'app-icon-logo.webp'
    brand_logo.parent.mkdir(parents=True, exist_ok=True)
    img_640 = src_img.resize((640, 640), Image.Resampling.LANCZOS)
    img_640.save(brand_logo, 'WEBP', quality=95)
    print(f"Updated brand logo: {brand_logo} (640x640 webp)")

    # 5. Public / Icons PWA sizes
    icons_dir = ROOT / 'public' / 'icons'
    for size in (192, 512):
        img_size = src_img.resize((size, size), Image.Resampling.LANCZOS)
        img_size.save(icons_dir / f'icon-{size}.png', 'PNG', optimize=True)
        maskable = make_maskable(src_img, size, scale=0.8)
        maskable.save(icons_dir / f'icon-maskable-{size}.png', 'PNG', optimize=True)
        print(f"Updated icon-{size}.png and icon-maskable-{size}.png")

    apple_touch = src_img.resize((180, 180), Image.Resampling.LANCZOS)
    apple_touch.save(icons_dir / 'apple-touch-icon-180.png', 'PNG', optimize=True)

    for fav_size in (32, 48, 96, 192):
        fav = src_img.resize((fav_size, fav_size), Image.Resampling.LANCZOS)
        fav.save(icons_dir / f'favicon-{fav_size}.png', 'PNG', optimize=True)

    # 6. Favicon ICO
    fav_ico = ROOT / 'public' / 'favicon.ico'
    src_img.resize((256, 256), Image.Resampling.LANCZOS).save(
        fav_ico, 'ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    print("Updated favicon.ico")

    # 7. Android mipmap icons
    android_res = ROOT / 'android' / 'app' / 'src' / 'main' / 'res'
    mipmap_sizes = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192,
    }
    for folder, size in mipmap_sizes.items():
        dir_path = android_res / folder
        if dir_path.exists():
            resized = src_img.resize((size, size), Image.Resampling.LANCZOS)
            resized.save(dir_path / 'ic_launcher.png', 'PNG', optimize=True)
            resized.save(dir_path / 'ic_launcher_round.png', 'PNG', optimize=True)
            # foreground can also use the icon
            resized.save(dir_path / 'ic_launcher_foreground.png', 'PNG', optimize=True)
            print(f"Updated Android {folder} ({size}x{size})")

    print("ALL APP ICONS UPDATED SUCCESSFULLY!")

if __name__ == '__main__':
    main()
