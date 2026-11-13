#!/usr/bin/env python3
"""
ElevenLabs 録音済み MP3 を public/audio/toeic_listening/ に取り込み、
public/audio/toeic_listening/index.json を自動更新するスクリプト。

使い方:
  python3 scripts/toeic-listening-audio/import_mp3.py <MP3が入ったフォルダ>
"""
import datetime
import json
import os
import re
import shutil
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
DEST_DIR = os.path.join(ROOT, 'public/audio/toeic_listening')
INDEX_PATH = os.path.join(DEST_DIR, 'index.json')
VALID_ID = re.compile(r'^(tpl_r\d{2}_(?:p2_q[1-6]|p3|p4))\.mp3$', re.IGNORECASE)


def sync_index() -> list[str]:
    os.makedirs(DEST_DIR, exist_ok=True)
    ids = sorted(
        VALID_ID.match(name).group(1).lower()
        for name in os.listdir(DEST_DIR)
        if VALID_ID.match(name)
    )
    payload = {
        'version': 1,
        'rev': datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d-%H%M%S'),
        'ids': ids,
    }
    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write('\n')
    return ids


def main() -> None:
    if len(sys.argv) >= 2:
        src_dir = os.path.abspath(sys.argv[1])
        if not os.path.isdir(src_dir):
            raise SystemExit(f'フォルダが見つかりません: {src_dir}')
        os.makedirs(DEST_DIR, exist_ok=True)
        copied = 0
        for name in sorted(os.listdir(src_dir)):
            m = VALID_ID.match(name)
            if not m:
                continue
            dst_name = f'{m.group(1).lower()}.mp3'
            shutil.copy2(os.path.join(src_dir, name), os.path.join(DEST_DIR, dst_name))
            copied += 1
        print(f'[import_mp3] コピー完了: {copied} ファイル -> {DEST_DIR}')
    ids = sync_index()
    print(f'[import_mp3] index.json 更新完了: 収録済み {len(ids)} / 120 トラック')


if __name__ == '__main__':
    main()
