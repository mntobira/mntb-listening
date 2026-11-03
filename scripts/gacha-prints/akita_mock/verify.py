# -*- coding: utf-8 -*-
"""秋田大 予想問題の難易度・形式チェック。 python3 verify.py N → logs/verify_rN.json（NG があれば終了コード1）
基準：2024〜2026年度の公式PDF（R6〜R8）。Ⅰ・Ⅱの本文は著作権のため非公開（本文省略）で，公開されているのは設問・注・出典・模範解答例。
  Ⅰ・Ⅱ：本文は紙面2〜3ページ分（段落番号 [1]〜[9]〜[16]）→ 550〜900語・9〜16段落と推定。設問は英語の4択で各9〜10問
        （R8 Ⅰ 10問・Ⅱ 10問，R7 Ⅰ 10問・Ⅱ 9問，R6 Ⅰ 10問・Ⅱ 10問）。平均文長 14〜24語・難語率 3〜14%（新聞・解説記事の文体）
  Ⅲ：自分の意見を1段落・about 120 words。模範解答例は 115〜137語 → 解答例は 108〜140語
"""
import sys, re, json, importlib
from pathlib import Path
from wordfreq import zipf_frequency as z
HERE = Path(__file__).resolve().parent; sys.path.insert(0, str(HERE))
import render
sys.path.insert(0, str(HERE))
R = sys.argv[1] if len(sys.argv) > 1 else '1'
D = importlib.import_module(f'a{R}').DATA

def wc(x): return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'’\-]*", x))
def stats(t):
    t = t.replace('’', "'")
    S = [x for x in re.split(r'(?<=[.?!])["”’]?\s+(?=[A-Z“"])', t) if wc(x) > 2]
    toks = [w.lower() for w in re.findall(r'[A-Za-z]+', t) if len(w) > 1]
    caps = set(w.lower() for w in re.findall(r"(?<![.?!]\s)\b[A-Z][a-z]+", t))
    cont = [w for w in toks if w not in caps and z(w, 'en') > 0]
    return dict(words=wc(t), avg=round(wc(t) / max(1, len(S)), 1),
                zipf_lt4=round(sum(z(w, 'en') < 4 for w in cont) / max(1, len(cont)) * 100, 1))
RANGE = dict(words=(550, 900), avg=(14, 24), zipf_lt4=(3, 14), paras=(9, 16), questions=(9, 10))

log, ng = {}, []
for n in ('1', '2'):
    P = D[n]
    d = stats(render.text_of(P)); d['paras'] = len(P['paras']); d['questions'] = len(P['questions'])
    d['range'] = {m: f'{lo}–{hi}:' + ('OK' if lo <= d[m] <= hi else 'NG') for m, (lo, hi) in RANGE.items()}
    log[n] = d
    if any('NG' in v for v in d['range'].values()): ng.append(n)
P = D['3']
ws = []
for lab, m in P['models']:
    w = wc(re.sub(r'\(\d+ words\)', '', m)); ws.append(w)
    if not 108 <= w <= 140: ng.append(('3', lab, w))
log['3'] = dict(models=ws, range='108–140語', task_words=wc(' '.join(P['task'])))
log['ng'] = ng
(HERE / 'logs').mkdir(exist_ok=True)
json.dump(log, open(HERE / f'logs/verify_r{R}.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(log, ensure_ascii=False, indent=1)); sys.exit(1 if ng else 0)
