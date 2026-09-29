#!/usr/bin/env python3
"""第2問の音源で「先に話す人の性別」が台本どおりかを実測で確かめる。

■ なぜ必要か
elevenlabs/v3-tts は台本の Speaker 番号を★勝手に入れ替えることがある★。
実際に el2_set10_q1 で、台本は Speaker 2（男性）が先頭なのに
生成側の応答では Speaker 1 が先頭に割り当てられていた。

第2問は「イラストを選ぶ」形式で、設問に "she" / "the woman" /
"the boy" のような性別語が入る問がある。その問で男女が入れ替わると
★正解が変わってしまい、問題として成立しなくなる★。
逆に設問が "they" / "correct" だけの問なら、男女が入れ替わっても
選ぶイラストは変わらないので実害は無い。

■ 判定の方法（ピッチだけで判断してはいけない）
F0（声の高さ）だけで男女を決めると誤判定する。理由は2つある。

 1. 息継ぎで発話が割れるため、「冒頭N秒」で切ると
    2人目の声が混ざる。実際 el2_set9_q3 は冒頭3秒で
    F0=157Hz（男性判定）になったが、無音区間で切って
    1発話目だけを測ると女性で、台本どおりだった。
 2. ナレーター(Daniel)と女性(Adeline)の F0 は
    7.7Hz しか離れていない実例がある（205.2 vs 197.5）。
    高さでは分離できないが、音色（MFCC）なら 100% 分離できた。

そこで
  ・librosa.effects.split で無音区間ごとに発話を切る
  ・0.6秒未満の断片は捨てる（短いと音色が安定しない）
  ・検証済みの声サンプル（.tmpwork/tts/cmp_*.mp3）から
    MFCC の指紋を作り、コサイン類似度で最も近い役に割り当てる
という手順にした。

■ 使い方
    python3 scripts/verify_q2_single_gender.py            # 全部
    python3 scripts/verify_q2_single_gender.py el2_set10_q1

■ 判定が出たあとの扱い
  OK          … そのまま使う
  入れ替わり + 設問に性別語なし … ★そのまま使って良い★
                （選ぶイラストが変わらないため）
  入れ替わり + 設問に性別語あり … ★録り直す★
                （正解が変わるため使えない）
"""
from __future__ import annotations

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
AUDIO = ROOT / 'public' / 'listening_audio'
MANIFEST = ROOT / 'scripts' / 'data' / 'q2_tts' / 'manifest.json'
REF_DIR = ROOT / '.tmpwork' / 'tts'

# 検証済みの声サンプル。batch01 の検証時に切り出したもの。
REFS = {
    'female': 'cmp_female.mp3',
    'male': 'cmp_male.mp3',
    'narrator': 'cmp_narr_q1.mp3',
}

# 設問に出たら「男女の入れ替わりが正解を変える」語。
GENDER_WORDS = re.compile(
    r'\b(she|he|her|his|him|woman|man|women|men|boy|girl'
    r'|mother|father|son|daughter)\b',
    re.I,
)

MIN_UTT_SEC = 0.6


def embed(y, sr):
    import librosa
    import numpy as np
    m = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
    return np.concatenate([m.mean(axis=1), m.std(axis=1)])


def cos(a, b) -> float:
    import numpy as np
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))


def load_refs():
    import librosa
    out = {}
    for role, fname in REFS.items():
        p = REF_DIR / fname
        if not p.exists():
            raise SystemExit(
                f'基準の声サンプルがありません: {p}\n'
                '（batch01 検証時の cmp_*.mp3 が必要）'
            )
        y, sr = librosa.load(str(p), sr=22050)
        out[role] = embed(y, sr)
    return out


def first_utterance_role(mp3: pathlib.Path, refs) -> tuple[str, float, float]:
    """最初の発話がどの役かを返す。(役, 開始秒, 終了秒)"""
    import librosa
    y, sr = librosa.load(str(mp3), sr=22050)
    iv = librosa.effects.split(y, top_db=32, frame_length=2048, hop_length=512)
    for s, e in iv:
        if (e - s) / sr < MIN_UTT_SEC:
            continue
        v = embed(y[s:e], sr)
        role = max(refs, key=lambda r: cos(v, refs[r]))
        return role, s / sr, e / sr
    raise SystemExit(f'{mp3.name}: 0.6秒以上の発話が見つかりません')


def main() -> None:
    rows = json.loads(MANIFEST.read_text(encoding='utf-8'))
    by_name = {r['name']: r for r in rows}

    targets = sys.argv[1:]
    if not targets:
        targets = sorted(
            p.stem for p in AUDIO.glob('el2_*.mp3')
            if p.stat().st_size > 1000
        )

    refs = load_refs()
    ng_fatal: list[str] = []
    ng_ok: list[str] = []

    print(f'{"問":14} {"台本の先頭":12} {"実測":10} {"性別語":6} 判定')
    print('-' * 66)

    for name in targets:
        row = by_name.get(name)
        if row is None:
            print(f'{name:14} manifest に無いので飛ばす')
            continue

        mp3 = AUDIO / f'{name}.mp3'
        if not mp3.exists():
            continue

        # 台本の先頭話者 → 期待する性別
        # Speaker 1 = 女性 / Speaker 2 = 男性（性別順に振り直したあとの規約）
        first_line = next(
            (l for l in row['script'].splitlines() if l.startswith('Speaker ')),
            '',
        )
        # manifest の script は「登場順」なので voiceMap で性別に直す
        spk = first_line.split(':')[0].strip()
        role_ja = row['voiceMap'].get(spk, '')
        expect = 'female' if any(
            w in role_ja for w in ('女', '母', '娘')
        ) else 'male'

        actual, a, b = first_utterance_role(mp3, refs)

        question = next(
            (l for l in row['script'].splitlines()
             if l.startswith('Speaker 3')),
            '',
        )
        has_gender = bool(GENDER_WORDS.search(question))

        if actual == expect:
            verdict = 'OK'
        elif has_gender:
            verdict = '★録り直し★'
            ng_fatal.append(name)
        else:
            verdict = '入れ替わりだが実害なし'
            ng_ok.append(name)

        print(f'{name:14} {expect:12} {actual:10} '
              f'{"あり" if has_gender else "なし":6} {verdict}')

    print()
    print(f'録り直しが必要: {len(ng_fatal)} 問')
    for n in ng_fatal:
        print(f'  ★{n}')
    print(f'入れ替わったが設問に性別語が無く実害なし: {len(ng_ok)} 問')
    for n in ng_ok:
        print(f'  {n}')

    if ng_fatal:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
