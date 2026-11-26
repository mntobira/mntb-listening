"""Centralized configuration and precomputed coordinate grids for Tobira-kun Cutout v18."""
from dataclasses import dataclass, field
from typing import Tuple
import numpy as np


@dataclass(frozen=True)
class CutoutConfig:
    video_path: str = "/home/user/uploaded_files/tobirakun_home_github.mp4"
    u2_mask_path: str = "/tmp/u2netp_masks.npy"
    sil_mask_path: str = "/tmp/silueta_masks.npy"
    isnet_mask_path: str = "/tmp/isnet_masks.npy"
    title_plate_path: str = "/home/user/work-repos/mntb-listening/public/cinematics/title-plate.webp"

    expected_src_size: Tuple[int, int] = (768, 1344)  # (W, H)
    # 768 : 1344 == 4 : 7 exactly -> 420 : 735; pad 1px transparent bottom row -> 420x736 even H.264/VP9 canvas
    out_size: Tuple[int, int] = (420, 736)  # (OUT_W, OUT_H)
    active_scaled_height: int = 735

    bg_calm_range: Tuple[int, int] = (0, 4)
    bg_jump_range: Tuple[int, int] = (64, 71)
    bg_patch_box: Tuple[int, int, int, int] = (215, 775, 555, 1055)  # (x0, y0, x1, y1)

    matte_bg_rgb: Tuple[float, float, float] = (16.0, 26.0, 44.0)

    output_dirs: Tuple[str, ...] = field(default_factory=lambda: (
        "/home/user/work-repos/mntb-listening/public/cinematics",
        "/home/user/work-repos/mntb-eiken/eiken-app/public/cinematics",
        "/home/user/mntb-promo-workspace/public/cinematics",
    ))


class CoordinateGrid:
    """Reusable spatial coordinate arrays so `(yy, xx, yn, xn)` are allocated once per run."""

    def __init__(self, width: int, height: int):
        self.w = width
        self.h = height
        self.yy, self.xx = np.mgrid[0:height, 0:width]
        self.yn = self.yy.astype(np.float32) / float(height)
        self.xn = self.xx.astype(np.float32) / float(width)
