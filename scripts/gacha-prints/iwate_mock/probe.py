# -*- coding: utf-8 -*-
"""言い回し候補が過去問（照合先すべて）と英語4語／日本語13字で重ならないかを試す。 python3 probe.py '文1' '文2' …"""
import sys, re, glob
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
REFS = [ROOT / f'.tmpwork/{u}_ref' for u in ('iwate', 'hirosaki', 'tohoku', 'hokudai', 'kobe', 'osaka', 'ritsu')]
def norm(t): return re.sub(r'\s+', ' ', t.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"'))
def words(t): return [w.lower() for w in re.findall(r"[A-Za-z]+(?:'[a-z]+)?", norm(t))]
def jchars(t): return re.sub(r'[^\u3040-\u30ff\u4e00-\u9fff]', '', t)
E, J = set(), set()
for d in REFS:
    for f in glob.glob(str(d / 'ocr/*.txt')):
        t = open(f, errors='ignore').read(); w = words(t); j = jchars(t)
        E.update(tuple(w[i:i+4]) for i in range(len(w)-3)); J.update(j[i:i+13] for i in range(len(j)-12))
for s in sys.argv[1:]:
    w = words(s); j = jchars(s)
    e = [' '.join(w[i:i+4]) for i in range(len(w)-3) if tuple(w[i:i+4]) in E]
    jj = [j[i:i+13] for i in range(len(j)-12) if j[i:i+13] in J]
    print('OK ' if not e and not jj else 'NG ', s[:60], e, jj[:3])
