# 録画から「いつ・どこが変わったか」を測る道具（台本の時刻合わせ用）
#   python3 store-assets/_tools/measure.py changes <動画> <開始秒> <終了秒> [x0 y0 x1 y1] [--th 6]
#       画面（または指定の四角）が大きく変わったコマの時刻を出す → 正解の演出・カウントダウンの数字・FINISH などの時刻
#   python3 store-assets/_tools/measure.py sheet <動画> <秒,秒,...> [--w 220] [--out 出力.jpg]
#       指定した時刻のコマを横に並べた一覧（時刻入り）を作る → 切り出す場所を目で確かめる
#   python3 store-assets/_tools/measure.py loud <音声>
#       0.5秒ごとの音量（dB）→ BGM の静かな所・盛り上がる所を探す
import sys, subprocess
import cv2, numpy as np

def changes(path, t0, t1, box=None, th=6.0):
  cap = cv2.VideoCapture(path); fps = cap.get(5) or 30; i = int(t0 * fps); cap.set(1, i); prev = None; out = []
  while i < t1 * fps:
    ok, f = cap.read()
    if not ok: break
    if box: x0, y0, x1, y1 = map(int, box); f = f[y0:y1, x0:x1]
    g = cv2.resize(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), (160, max(1, int(160 * f.shape[0] / f.shape[1])))).astype(np.float32)
    if prev is not None:
      d = float(np.mean(np.abs(g - prev)))
      if d > th: out.append((round(i / fps, 2), round(d, 1)))
    prev = g; i += 1
  for t, d in out: print(f'{t:8.2f}s  変化 {d}')

def sheet(path, times, w=220, out='measure_sheet.jpg'):
  cap = cv2.VideoCapture(path); fps = cap.get(5) or 30; ims = []
  for t in times:
    cap.set(1, int(t * fps)); ok, f = cap.read()
    if not ok: continue
    h = round(f.shape[0] * w / f.shape[1]); im = cv2.resize(f, (w, h), interpolation=cv2.INTER_AREA)
    cv2.putText(im, f'{t:.2f}', (4, 22), 0, 0.7, (0, 0, 255), 2); ims.append(im)
  cv2.imwrite(out, np.hstack(ims)); print(out)

def loud(path):
  raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], capture_output=True).stdout
  a = np.frombuffer(raw, np.int16).astype(np.float32) / 32768; n = 4000
  print(' '.join(f'{k / 2:g}:{int(20 * np.log10(np.sqrt(np.mean(a[k * n:(k + 1) * n] ** 2)) + 1e-9))}' for k in range(len(a) // n)))

def opt(name, default):
  if name in sys.argv: i = sys.argv.index(name); v = sys.argv[i + 1]; del sys.argv[i:i + 2]; return type(default)(v)
  return default

if __name__ == '__main__':
  th = opt('--th', 6.0); w = opt('--w', 220); out = opt('--out', 'measure_sheet.jpg')
  cmd, *a = sys.argv[1:]
  if cmd == 'changes': changes(a[0], float(a[1]), float(a[2]), [float(x) for x in a[3:7]] if len(a) >= 7 else None, th)
  elif cmd == 'sheet': sheet(a[0], [float(x) for x in a[1].split(',')], w, out)
  elif cmd == 'loud': loud(a[0])
  else: print(__doc__ or open(__file__).read().split('import')[0])
