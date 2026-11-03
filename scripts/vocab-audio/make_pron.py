#!/usr/bin/env python3
"""単語帳の「読み方」表示のデータを作る（2026-11-03）。

  public/data/vocabPron.json = { v:1, words: { 語ID: [ARPAbet, 音節, 強勢] } }
    ARPAbet … 発音辞書（CMUdict）の発音。熟語は語ごとに "|" で区切る（画面で発音記号に直す）
    音節    … つづりの切れ目 "um|brel|la"（1音節・熟語は ""）
    強勢    … 強く読む音節の番号（0 から。無ければ -1）
  音節の分け方は、リスニングの音読モード（scripts/readalong/add_prosody.py）と同じ関数を使う。
  辞書に無い語（固有名詞・記号つき）は入れない＝画面は表示しない。

  使い方：python3 scripts/vocab-audio/make_pron.py
"""
import json, os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'scripts', 'readalong'))
sys.path.insert(0, os.path.dirname(__file__))
import cmudict
from add_prosody import syllables  # noqa: E402
from spoken import spoken           # noqa: E402

CMU = cmudict.dict()

def arpa_of(w: str) -> str:
    k = w.lower().replace('’', "'")
    v = CMU.get(k) or CMU.get(k.strip("'"))
    return ' '.join(v[0]) if v else ''

def entry(word: str):
    s = spoken(word).replace('—', ' ').rstrip('?!.')
    if re.search(r'[^\x00-\x7f]', s): return None   # résumé など：つづりが辞書と合わない（読み違えるので出さない）
    toks = re.findall(r"[A-Za-z][A-Za-z']*", s)
    if not toks: return None
    arps = [arpa_of(t) for t in toks]
    if not all(arps): return None
    if len(toks) == 1:
        syl, st = syllables(toks[0], arps[0])
        # 見出しと音節のつづりが違う（記号つきなど）ときは音節を出さない
        if syl and syl.replace('|', '') != word: syl = ''
        return [arps[0], syl, st]
    return ['|'.join(arps), '', -1]

def main():
    data = json.load(open(os.path.join(ROOT, 'public/data/listeningVocabulary.json')))
    out, miss = {}, 0
    for w in data['words']:
        e = entry(w['word'])
        if e: out[w['id']] = e
        else: miss += 1
    path = os.path.join(ROOT, 'public/data/vocabPron.json')
    json.dump({'v': 1, 'words': out}, open(path, 'w'), ensure_ascii=False, separators=(',', ':'))
    print('words', len(data['words']), 'with pron', len(out), 'missing', miss, 'bytes', os.path.getsize(path))

if __name__ == '__main__':
    main()
