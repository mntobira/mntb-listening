# マナトビ 起動エンブレムの効果音 ライセンス

- `open_shimmer.mp3`（きらきら）、`title_swell.mp3`（すーっ）、`title_bloom.mp3`（ふわっ）の3つです。
- `store-assets/_tools/promo_sfx.py` が numpy の数式だけで一から作ったオリジナル音です
  （宣伝動画の冒頭と同じ音）。サンプリング素材・フリー素材・AIで生成した音声は使っていません。
- **商用利用できます**。アプリ・広告・動画・配信に使えます。クレジット表記は要りません。権利はマナトビにあります。

## 作り直し方

```bash
python3 store-assets/_tools/promo_sfx.py /tmp/lsfx
for n in open_shimmer title_swell title_bloom; do
  ffmpeg -y -i /tmp/lsfx/$n.wav -ar 44100 -c:a libmp3lame -b:a 128k public/sfx/launch/$n.mp3
done
```
