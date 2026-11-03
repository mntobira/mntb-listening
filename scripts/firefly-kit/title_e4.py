#!/usr/bin/env python3
"""
E4（2026-11-03）タイトル画面の とびら君 動画（title.mp4）を、運営者が送った動画から作り直す。
  元動画：「Create a lively, adorable 3D ani 389900 OFW.mp4」（1080×1080・24fps・5秒）。
    もう1本（「…heartwarming 200121 Aoq.mp4」）は 1.75〜2.3秒で目が白く崩れ、それ以外もほぼ静止なので不採用。
  顔が崩れる区間は使わない：0.00〜0.29秒（参照画像のコマ・目が白い）、1.75〜2.12秒（顔がのっぺり）、4.65秒〜（目が小さくなる）。
  使う区間（コマ番号・24fps）を、絵が近いコマどうしでつなぐ（つなぎ目は2コマのクロスフェード）：
    2.17〜3.92秒 → 1.04〜1.71秒 → 3.92〜4.62秒（1.71秒と3.92秒、3.92秒と1.04秒は ほぼ同じ姿勢）
  背景は他の C 動画と同じクリーム色 #FBF5E8 に塗り替え（unify_background.py の unify）。
使い方：FIREFLY_SRC=<元動画の置き場（t1.mp4）> FIREFLY_OUT=<出力先> python3 scripts/firefly-kit/title_e4.py
"""
import os, sys, importlib.util, subprocess
import numpy as np
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('unify_bg', os.path.join(here, 'unify_background.py'))
u = importlib.util.module_from_spec(spec); sys.argv = sys.argv[:1]; spec.loader.exec_module(u)
SEGMENTS = [(52, 94), (25, 41), (94, 111)]   # [start, end] フレーム（両端を含む）
XF = 2                                         # つなぎ目のクロスフェード（コマ数）
fr = u.read('t1')
segs = [[u.unify(fr[i]) for i in range(a, b + 1)] for a, b in SEGMENTS]
out = list(segs[0])
for s in segs[1:]:
    tail = out[-XF:]; head = s[:XF]
    blend = [(t.astype(np.float32) * (1 - (k + 1) / (XF + 1)) + h.astype(np.float32) * ((k + 1) / (XF + 1))).astype(np.uint8)
             for k, (t, h) in enumerate(zip(tail, head))]
    out = out[:-XF] + blend + list(s[XF:])
arr = np.stack(out)
mp4 = os.path.join(u.OUT, 'title.mp4')
p = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{u.S}x{u.S}', '-r', '24', '-i', '-',
                      '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4],
                     stdin=subprocess.PIPE)
p.stdin.write(arr.tobytes()); p.stdin.close(); p.wait()
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', mp4, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '85', mp4.replace('.mp4', '-poster.webp')])
print(mp4, os.path.getsize(mp4) // 1024, 'KB', round(len(arr) / 24, 2), 's')
