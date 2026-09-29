#!/usr/bin/env python3
"""第1問B セット7〜15 の選択肢をシャッフルする。

■ なぜ必要か
    配布PDF由来のセット7〜15（36問）は、正解がすべて ① になっていた。
    これは取り込みの不具合ではなく配布PDF自体がそうなっているのだが、
    アプリの問題としては「①を選べば必ず当たる」ため演習にならない。
    そこで、イラストの並びと解答データを「同時に」入れ替えて、
    正解の位置をばらけさせる。

■ むずかしいのは「画像と文字の整合」
    イラストは1枚のJPEGに①〜④が2×2で焼き込まれている。
    ①②③④の丸バッジも画像に描かれている。
    そこで、

        バッジ（左上の丸数字）は動かさず、
        マスの「中身」だけを入れ替える

    という方針を採る。こうすると
        ・①のバッジは常に左上にある（見た目が自然）
        ・①の中身が別の絵に変わる
    となり、「①の絵」が入れ替わったのと同じ結果になる。
    同時に JSON 側の options / answerIndex / explanation の
    丸数字も同じ置換で書き換えるため、画像・選択肢・解説が必ず一致する。

■ 使い方
    python3 scripts/shuffle_q1b_options.py          # 実行（画像とJSONを更新）
    python3 scripts/shuffle_q1b_options.py --check   # 検証のみ

    実行後に scripts/gen_listening_data.py を回すと TS が再生成される。
"""
from __future__ import annotations

import argparse
import json
import random
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / 'public' / 'listening_q1b'
JSON_PATH = Path('/tmp/lst/q1b.json')
BACKUP_DIR = ROOT / 'scripts' / 'assets' / 'q1b_original'

# シャッフル対象。セット1〜6は正解がすでにばらけているため触らない。
TARGET_SETS = list(range(7, 16))

MARKS = ['①', '②', '③', '④']

# 乱数を固定し、何度実行しても同じ結果になるようにする（再現性のため）。
SEED = 20260817


def find_gutters(gray: np.ndarray) -> tuple[list[int], list[int]]:
    """2×2に区切っている「ほぼ真っ白な帯」の行・列を返す。"""
    h, w = gray.shape
    row_white = (gray > 240).mean(axis=1)
    col_white = (gray > 240).mean(axis=0)
    rows = [i for i in range(h // 2 - 45, h // 2 + 45) if row_white[i] > 0.97]
    cols = [i for i in range(w // 2 - 45, w // 2 + 45) if col_white[i] > 0.97]
    return rows, cols


def quadrant_boxes(img: Image.Image) -> list[tuple[int, int, int, int]]:
    """①〜④の4マスの座標 (left, top, right, bottom) を返す。

    戻り順は ①左上 → ②右上 → ③左下 → ④右下（画像の並びと同じ）。
    """
    gray = np.array(img.convert('L'))
    rows, cols = find_gutters(gray)
    if not rows or not cols:
        raise ValueError('2×2の区切りが見つからない')
    # 帯の内側を各マスの境界にする
    r0, r1 = rows[0], rows[-1] + 1
    c0, c1 = cols[0], cols[-1] + 1
    h, w = gray.shape
    return [
        (0, 0, c0, r0),    # ①
        (c1, 0, w, r0),    # ②
        (0, r1, c0, h),    # ③
        (c1, r1, w, h),    # ④
    ]


def badge_box(img: Image.Image, box: tuple[int, int, int, int]) -> tuple[int, int, int, int] | None:
    """マス内の丸数字バッジの座標を返す（マスの左上にある）。見つからなければ None。

    バッジは「動かさない」ために切り出す。少し広めに取り、
    バッジの外周が中身の絵とぶつからないようにする。

    ■ 罫線と間違えないための工夫
        マスの左上だけを切り出すと、マスの外枠（罫線）も写り込む。
        ただし罫線は「1px の細長い線」または「マス全体に及ぶ大きな L 字」
        なので、直径 40〜130px・ほぼ正方形という条件で自然に除外できる。
        （縁に接するかどうかでは判定しない。マスの境界が
          バッジをかすめる画像があり、正しいバッジまで捨ててしまうため。）
    """
    import cv2

    left, top, right, bottom = box
    qw, qh = right - left, bottom - top
    # 左上 40% 四方を探索（バッジは必ずこの中にある）
    cw, ch = int(qw * 0.4), int(qh * 0.4)
    search = np.array(img.convert('L').crop((left, top, left + cw, top + ch)))
    dark = (search < 130).astype(np.uint8)

    n, _lab, stats, _cent = cv2.connectedComponentsWithStats(dark, connectivity=8)
    best = None
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        # 丸バッジ：ほぼ正方形の外形で、直径 40〜130px 程度
        if not (40 <= w <= 130 and 40 <= h <= 130):
            continue
        if abs(w - h) > max(w, h) * 0.35:
            continue
        # 円のリング（細い線）なので、外形に対する塗り面積はごく一部。
        # 実測では 0.08 前後（線が細い画像）〜0.6（数字と繋がった画像）まで幅がある。
        fill = area / float(w * h)
        if not (0.05 <= fill <= 0.80):
            continue
        # 左上に近いものを優先する（絵の中の丸印を拾わないため）
        if best is None or (x + y) < (best[0] + best[1]):
            best = (x, y, w, h, area)
    if best is None:
        return None
    x, y, w, h, _a = best
    pad = 5
    return (
        max(left, left + x - pad),
        max(top, top + y - pad),
        min(right, left + x + w + pad),
        min(bottom, top + y + h + pad),
    )


def badge_boxes_for(img: Image.Image, boxes: list[tuple[int, int, int, int]]) -> list[tuple[int, int, int, int]]:
    """4マス分のバッジ座標をそろえて返す。

    ■ 検出に失敗するマスがある問題への対処
        バッジの円が「マスの枠線」と1点でつながっている画像があり、
        その場合は円が枠と一体の巨大な塊になって検出条件から外れる。
        ただし4つのバッジは同じ位置・同じ大きさで描かれているので、
        検出できたマスの「マス左上からの相対位置」の中央値を、
        失敗したマスに当てはめれば正しい位置が得られる。
    """
    found = [badge_box(img, b) for b in boxes]
    rels = [
        (bb[0] - q[0], bb[1] - q[1], bb[2] - bb[0], bb[3] - bb[1])
        for bb, q in zip(found, boxes)
        if bb is not None
    ]
    if not rels:
        # 1つも取れない場合は実測の定位置を使う（マス幅比で指定）
        qw = boxes[0][2] - boxes[0][0]
        rels = [(int(qw * 0.03), int(qw * 0.03), int(qw * 0.20), int(qw * 0.20))]

    def med(vals: list[int]) -> int:
        vals = sorted(vals)
        return vals[len(vals) // 2]

    dx = med([r[0] for r in rels])
    dy = med([r[1] for r in rels])
    bw = med([r[2] for r in rels])
    bh = med([r[3] for r in rels])

    out: list[tuple[int, int, int, int]] = []
    for bb, q in zip(found, boxes):
        if bb is not None:
            out.append(bb)
        else:
            out.append((q[0] + dx, q[1] + dy, q[0] + dx + bw, q[1] + dy + bh))
    return out


def frame_inner_box(img: Image.Image, box: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    """マスの「枠線の内側」の座標を返す。

    ■ なぜ枠線を避けるのか
        4つのマスは幅・高さが数pxずつ違う。マスまるごと入れ替えると
        拡大縮小が入り、枠線が二重に見えたりずれたりしてしまう。
        そこで枠線は元の位置に残したまま、その内側の絵だけを交換する。
    """
    import cv2

    left, top, right, bottom = box
    qw, qh = right - left, bottom - top
    gray = np.array(img.convert('L').crop(box))
    dark = (gray < 150).astype(np.uint8)
    n, _lab, stats, _cent = cv2.connectedComponentsWithStats(dark, connectivity=8)

    best = None
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        # 枠線：マスのほぼ全体に広がる大きな矩形
        if w > qw * 0.80 and h > qh * 0.80:
            if best is None or area > best[4]:
                best = (x, y, w, h, area)

    if best is None:
        # 枠が見つからないときはマス端から一定量だけ内側に入る
        pad = max(6, int(min(qw, qh) * 0.05))
        return (left + pad, top + pad, right - pad, bottom - pad)

    x, y, w, h, _a = best
    # 枠線そのものを含めないよう、線幅ぶん内側に入る
    pad = max(4, int(min(qw, qh) * 0.012))
    return (left + x + pad, top + y + pad, left + x + w - pad, top + y + h - pad)


def shuffle_image(path: Path, perm: list[int]) -> None:
    """マスの中身だけを perm の通りに入れ替えて上書き保存する。

    perm[i] = j は「表示位置 i のマスに、元の位置 j の中身を入れる」意味。
    バッジ（丸数字）と枠線はもとの位置のまま残す。
    """
    img = Image.open(path).convert('RGB')
    quads = quadrant_boxes(img)
    # 枠線の内側だけを交換対象にする（枠線とバッジは動かさない）
    boxes = [frame_inner_box(img, b) for b in quads]
    badges = badge_boxes_for(img, quads)

    # 元のマス中身（バッジを白で塗りつぶしたもの）を取り出す
    contents = []
    for box, badge in zip(boxes, badges):
        tile = img.crop(box).copy()
        # バッジ部分を白で消す（新しい位置のバッジと重ならないように）。
        # バッジが内側領域からはみ出す場合もあるので座標を丸める。
        bx0 = max(0, badge[0] - box[0])
        by0 = max(0, badge[1] - box[1])
        bx1 = min(tile.width, badge[2] - box[0])
        by1 = min(tile.height, badge[3] - box[1])
        if bx1 > bx0 and by1 > by0:
            white = Image.new('RGB', (bx1 - bx0, by1 - by0), (255, 255, 255))
            tile.paste(white, (bx0, by0))
        contents.append(tile)

    # バッジ画像（元の位置のものをそのまま使い回す）
    badge_imgs = [img.crop(b).copy() for b in badges]

    out = img.copy()
    for pos, src in enumerate(perm):
        box = boxes[pos]
        target_size = (box[2] - box[0], box[3] - box[1])
        tile = contents[src]
        if tile.size != target_size:
            # マスごとに数pxの寸法差があるため、収まるように合わせる。
            # 白地に貼ってから中央寄せし、絵の縦横比を崩さない。
            scale = min(target_size[0] / tile.width, target_size[1] / tile.height)
            new_size = (max(1, int(tile.width * scale)), max(1, int(tile.height * scale)))
            resized = tile.resize(new_size, Image.LANCZOS)
            canvas = Image.new('RGB', target_size, (255, 255, 255))
            canvas.paste(
                resized,
                ((target_size[0] - new_size[0]) // 2, (target_size[1] - new_size[1]) // 2),
            )
            tile = canvas
        out.paste(tile, (box[0], box[1]))
        # そのマス本来のバッジを描き戻す
        out.paste(badge_imgs[pos], (badges[pos][0], badges[pos][1]))

    out.save(path, 'JPEG', quality=82, optimize=True)


def remap_marks(text: str, new_of_old: dict[int, int]) -> str:
    """解説文の丸数字を新しい位置に置き換える。

    new_of_old[old] = new は「もとの old 番の内容が、いまは new 番にある」意味。
    一度に置換すると二重変換が起きるため、いったん占位文字に逃がす。
    """
    tmp = text
    for old, new in new_of_old.items():
        tmp = tmp.replace(MARKS[old], f'\x00{new}\x00')
    for i in range(4):
        tmp = tmp.replace(f'\x00{i}\x00', MARKS[i])
    return tmp


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true', help='検証のみ（書き換えない）')
    args = ap.parse_args()

    data = json.loads(JSON_PATH.read_text(encoding='utf-8'))
    rng = random.Random(SEED)

    if args.check:
        for s in data:
            if s['set'] in TARGET_SETS:
                idx = [q['answerIndex'] for q in s['questions']]
                print(f"set{s['set']}: answerIndex={idx}")
        return 0

    # 画像のバックアップ（やり直せるように）
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    plan: list[tuple[Path, list[int]]] = []

    for s in data:
        if s['set'] not in TARGET_SETS:
            continue

        # ── このセットの「正解位置の並び」を決める ───────────────
        # ・4問で①②③④が1回ずつ（偏りゼロ・本番の出題感に近い）
        # ・ただし①②③④の順そのままなど、規則が読める並びは避ける
        #   （規則が読めると勘で当てられてしまい、演習にならない）
        while True:
            targets = [0, 1, 2, 3]
            rng.shuffle(targets)
            # 昇順・降順は「次はこれだ」と読まれるので却下
            if targets == sorted(targets) or targets == sorted(targets, reverse=True):
                continue
            # 一定間隔で回るだけの並び（0,1,2,3 を回転させただけ）も却下
            diffs = {(targets[i + 1] - targets[i]) % 4 for i in range(3)}
            if len(diffs) == 1:
                continue
            break

        for q in s['questions']:
            img = IMG_DIR / f"el1B_set{s['set']}_q{q['no']}.jpg"
            if not img.exists():
                print(f'!! 画像が無い: {img}', file=sys.stderr)
                return 1
            backup = BACKUP_DIR / img.name
            if not backup.exists():
                shutil.copy2(img, backup)

            old_answer = q['answerIndex']
            # 正解の新しい位置。set_targets で「セット内の並び」を決めてある。
            want = targets[q['no'] - 1]
            # perm[pos] = src（表示位置 pos に元の src を置く）
            others = [i for i in range(4) if i != old_answer]
            rng.shuffle(others)
            perm = [0, 0, 0, 0]
            perm[want] = old_answer
            it = iter(others)
            for pos in range(4):
                if pos != want:
                    perm[pos] = next(it)

            # old → new の対応表
            new_of_old = {src: pos for pos, src in enumerate(perm)}

            # 選択肢の並べ替え（表示位置順に並べ直す）
            old_options = list(q['options'])
            q['options'] = [old_options[src] for src in perm]
            q['answerIndex'] = want
            q['answerText'] = old_options[old_answer]
            q['explanation'] = remap_marks(q['explanation'], new_of_old)

            plan.append((img, perm))

    # 画像を書き換える
    for img, perm in plan:
        shuffle_image(img, perm)

    JSON_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8'
    )

    # 結果を表示
    for s in data:
        if s['set'] in TARGET_SETS:
            idx = [q['answerIndex'] + 1 for q in s['questions']]
            print(f"set{s['set']}: 正解位置={idx}")
    print(f'画像 {len(plan)} 枚を更新しました（原本は {BACKUP_DIR} に保存）')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
