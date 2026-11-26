"""Rebuild the title-only cutout/idle from the checked-in transparent countdown.

Run from the repository root with Python (OpenCV, NumPy, Pillow) and FFmpeg
(libvpx-vp9, libx264). The battle assets remain untouched.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
import subprocess

import cv2
import numpy as np
from PIL import Image, ImageDraw

MEDIA = Path('public/cinematics')
W, H, FPS = 420, 736, 24


def ffmpeg(*args):
    return ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', *map(str, args)]


def refine(frame):
    rgb, alpha = frame[..., :3], frame[..., 3]
    # Remove faint compression halos, keeping the mid-edge and a narrow AA band.
    matte = np.clip((alpha.astype(np.float32) - 24) / 204, 0, 1)
    matte = matte * matte * (3 - 2 * matte)
    # Edge pixels should use foreground colors, not RGB from the old backdrop.
    core = alpha >= 224
    distance, nearest = cv2.distanceTransformWithLabels((~core).astype('uint8'), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    foreground = rgb[core][np.maximum(nearest - 1, 0)]
    light = cv2.GaussianBlur(rgb, (0, 0), .85).astype(np.float32)
    detail = rgb.astype(np.float32) - light
    crisp = rgb + np.clip(detail, -12, 12) * .4
    blend = np.clip((alpha.astype(np.float32) - 60) / 174, 0, 1)[..., None]
    color = foreground * (1 - blend) + crisp * blend
    # A short RGB bleed supports chroma subsampling without encoding the whole invisible frame.
    color[distance > 5] = 0
    return np.dstack((np.clip(color, 0, 255), matte * 255)).round().astype('uint8')


def blink_patch(frame):
    # The near eye is partly occluded by the open door. Keep the door untouched.
    region = np.zeros((H, W), np.uint8)
    cv2.ellipse(region, (178, 305), (26, 26), 0, 0, 360, 255, -1)
    cv2.ellipse(region, (252, 305), (27, 26), 0, 0, 360, 255, -1)
    region[:, :167] = 0
    skin = cv2.inpaint(frame[..., :3].copy(), region, 7, cv2.INPAINT_TELEA)
    # Interpolate from the skin beyond the eye on both sides of the eyelid.
    for y in range(279, 332):
        weight = (y - 277) / 56
        row = frame[277, :, :3] * (1 - weight) + frame[333, :, :3] * weight
        skin[y] = np.where(region[y, :, None] > 0, row.round().astype('uint8'), skin[y])
    outline = Image.new('RGBA', (W * 3, H * 3))
    draw = ImageDraw.Draw(outline)
    for pts in [[(167, 306), (174, 310), (182, 311), (189, 309), (195, 305)],
                [(234, 305), (242, 310), (251, 311), (260, 309), (268, 304)]]:
        draw.line([(x * 3, y * 3) for x, y in pts], fill=(92, 56, 36, 255), width=8, joint='curve')
    feather = cv2.GaussianBlur(region, (7, 7), 1.35)
    feather[:, :167] = 0
    patch = Image.fromarray(np.dstack((skin, feather)))
    return Image.alpha_composite(patch, outline.resize((W, H), Image.Resampling.LANCZOS))


def main():
    cv2.setNumThreads(1)
    with TemporaryDirectory(dir=Path.cwd()) as tmp:
        source, encoded = Path(tmp) / 'source.rgba', Path(tmp) / 'crisp.rgba'
        subprocess.run(ffmpeg('-threads', 1, '-c:v', 'libvpx-vp9', '-i', MEDIA / 'battle_countdown.webm',
                              '-pix_fmt', 'rgba', '-threads', 1, '-f', 'rawvideo', source), check=True)
        frames = np.memmap(source, dtype='uint8', mode='r').reshape(-1, H, W, 4)
        with encoded.open('wb') as output:
            for frame in frames:
                fixed = refine(frame)
                output.write(fixed.tobytes())
        Image.fromarray(refine(frames[0])).save(MEDIA / 'title_tobira-poster.webp', lossless=True)
        final = refine(frames[-1])
        Image.fromarray(final).save(MEDIA / 'title_tobira-landed.webp', lossless=True)
        blink_patch(final).save(MEDIA / 'title_tobira-blink.webp', lossless=True)
        input_args = ('-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{W}x{H}', '-r', FPS, '-i', encoded, '-an')
        subprocess.run(ffmpeg(*input_args, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-crf', 27, '-b:v', 0,
                              '-threads', 2, '-row-mt', 1, '-auto-alt-ref', 0, '-lag-in-frames', 0,
                              MEDIA / 'title_tobira.webm'), check=True)
        # Canvas expects straight RGB above, alpha below (no dark background premix).
        stack = ffmpeg('-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H*2}', '-r', FPS, '-i', 'pipe:0',
                       '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', 19, '-threads', 2,
                       '-movflags', '+faststart', MEDIA / 'title_tobira-sbs.mp4')
        with subprocess.Popen(stack, stdin=subprocess.PIPE) as process:
            for rgba in np.memmap(encoded, dtype='uint8', mode='r').reshape(-1, H, W, 4):
                process.stdin.write(np.concatenate((rgba[..., :3], np.repeat(rgba[..., 3:], 3, axis=2))).tobytes())
            process.stdin.close()
            if process.wait():
                raise RuntimeError('Title H.264 encoding failed')


if __name__ == '__main__':
    main()
