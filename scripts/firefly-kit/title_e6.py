#!/usr/bin/env python3
"""
E6（2026-11-04）タイトル画面の とびら君 動画（title.mp4）を、もう1本の動画に差し替える。
  元動画：「Create an adorable, heartwarming 200121 Aoq.mp4」（1080×1080・24fps・5秒・121コマ）。
  （E4 で使った「…3D ani 389900 OFW.mp4」から、運営者の希望でこちらに変更）
  顔が崩れる区間は使わない：0〜2コマ（参照画像のコマ）、44〜56コマ（目が白い・眉が上がる）。
  使う区間：57〜120コマ（2.67秒）を1本のまま使う（つなぎ目なし）。
  背景は他の C 動画と同じクリーム色 #FBF5E8 に塗り替え（unify_background.py の unify）。
使い方：FIREFLY_SRC=<元動画の置き場（t2.mp4）> FIREFLY_OUT=<出力先> python3 scripts/firefly-kit/title_e6.py
"""
import os, sys, importlib.util, subprocess
import numpy as np
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('unify_bg', os.path.join(here, 'unify_background.py'))
u = importlib.util.module_from_spec(spec); sys.argv = sys.argv[:1]; spec.loader.exec_module(u)
START, END = 57, 120                            # 使うコマ（両端を含む）
fr = u.read('t2')
arr = np.stack([u.unify(fr[i]) for i in range(START, END + 1)])
mp4 = os.path.join(u.OUT, 'title.mp4')
p = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{u.S}x{u.S}', '-r', '24', '-i', '-',
                      '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4],
                     stdin=subprocess.PIPE)
p.stdin.write(arr.tobytes()); p.stdin.close(); p.wait()
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', mp4, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '85', mp4.replace('.mp4', '-poster.webp')])
print(mp4, os.path.getsize(mp4) // 1024, 'KB', round(len(arr) / 24, 2), 's')
